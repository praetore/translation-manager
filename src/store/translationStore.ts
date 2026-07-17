/**
 * Raw Zustand store. Prefer `useTranslationStore` in UI.
 * Architecture: `src/store/README.md`. Motion options: `storeApi.ts`.
 */
import { create } from 'zustand'
import { difference } from 'remeda'
import {
  buildLeadMoveMapping,
  moveKeysWithLead,
} from '@/services/keyPaths'
import {
  addRow as addProjectRow,
  collectMissingRowKeys,
  deleteRow as deleteProjectRow,
  peekNextRowKey,
  updateCell,
} from '@/services/translationProject'
import { createMotionActions } from '@/store/motionActions'
import {
  leaveKeyInLists,
  pickKeyLists,
  removeKeysFromLists,
} from '@/store/keyLists'
import { createPersistenceActions, readStoredDirectory, storeDirectory } from '@/store/persistence'
import { canRenameKey, selectDisplayProject } from '@/store/selectors'
import {
  applyDeleteRows,
  applyMoveKeys,
  applyRenameKey,
} from '@/store/sessionBulkActions'
import { withDirtyProject } from '@/store/sessionHelpers'
import type { TranslationStore } from '@/store/storeApi'
import { getStoreTranslator } from '@/store/translator'
import {
  createInitialTranslationState,
  type TranslationState,
} from '@/store/types'

export type { TranslationStore } from '@/store/storeApi'

function visibleDisplayKeys(state: TranslationState): string[] {
  return (
    selectDisplayProject(
      {
        project: state.project,
        missingFilterKeys: state.missingFilterKeys,
        searchScope: state.searchScope,
        searchRegex: state.searchRegex,
      },
      state.searchQuery,
    )?.rows.map((row) => row.key) ?? []
  )
}

export const useTranslationStoreBase = create<TranslationStore>((set, get) => {
  const motion = createMotionActions(set)
  const persistence = createPersistenceActions(
    { getState: get, setState: set },
    getStoreTranslator,
  )

  /** Store wrapper around motion: ownership gate + optional search-hold. */
  const transitionDisplayKeys: TranslationStore['transitionDisplayKeys'] = (
    fromKeys,
    toKeys,
    options = {},
  ) => {
    if (fromKeys.length === 0) {
      set({ searchLayoutHoldKeys: null })
      return 'none'
    }

    const state = get()
    // Missing-filter owns the layout channel — don't fight it (unless we are it).
    if (!options.trackFilterMode && state.filterLayoutMode !== null) {
      return 'none'
    }

    if (options.holdOnCollapse) {
      const willCollapse =
        fromKeys.some((key) => !toKeys.includes(key)) &&
        toKeys.every((key) => fromKeys.includes(key))
      if (willCollapse) {
        set({ searchLayoutHoldKeys: [...fromKeys] })
      } else {
        set({ searchLayoutHoldKeys: null })
      }
    }

    const mode = motion.animateKeyListTransition(fromKeys, toKeys, {
      trackFilterMode: options.trackFilterMode,
      slideEnterKeys: options.slideEnterKeys,
      onDone: () => {
        if (options.holdOnCollapse) {
          set({ searchLayoutHoldKeys: null })
        }
        options.onDone?.()
      },
    })
    return mode
  }

  return {
    ...createInitialTranslationState(readStoredDirectory()),

    setDirectoryPath: (path) => {
      storeDirectory(path)
      set({ directoryPath: path })
    },

    setSearchQuery: (value) => set({ searchQuery: value }),
    clearSearch: () => set({ searchQuery: '' }),
    setSearchScope: (scope) =>
      set({ searchScope: scope, searchLayoutHoldKeys: null }),
    setSearchRegex: (enabled) =>
      set({ searchRegex: enabled, searchLayoutHoldKeys: null }),

    transitionDisplayKeys,

    selectKeys: (keys) => set({ selectedKeys: keys }),
    clearSelection: () => set({ selectedKeys: [] }),
    removeFromSelection: (key) =>
      set((state) => ({
        selectedKeys: difference(state.selectedKeys, [key]),
      })),

    editCell: (key, locale, value) =>
      set((state) => {
        if (!state.project) {
          return state
        }
        return withDirtyProject(state, updateCell(state.project, key, locale, value))
      }),

    addRow: () => {
      const state = get()
      if (!state.project) {
        return
      }
      const fromKeys = visibleDisplayKeys(state)
      const newKey = peekNextRowKey(state.project)
      set((current) => {
        if (!current.project) {
          return current
        }
        const next = addProjectRow(current.project)
        const addedKey = next.rows[0]?.key
        const freshKeys = addedKey
          ? [...current.freshKeys, addedKey]
          : current.freshKeys
        const missingFilterKeys =
          current.missingFilterKeys === null || !addedKey
            ? current.missingFilterKeys
            : [addedKey, ...current.missingFilterKeys]
        const searchLayoutHoldKeys =
          current.searchLayoutHoldKeys && addedKey
            ? [addedKey, ...current.searchLayoutHoldKeys]
            : current.searchLayoutHoldKeys
        return {
          ...withDirtyProject(current, next, missingFilterKeys, freshKeys),
          pendingKeyEdit: addedKey ?? null,
          searchLayoutHoldKeys,
        }
      })
      const afterKeys = visibleDisplayKeys(get())
      const slideEnterKeys = afterKeys[0] === newKey ? [newKey] : []
      const mode = transitionDisplayKeys(fromKeys, afterKeys, { slideEnterKeys })
      // Missing-filter owns layoutMotion — still slide-enter the new row.
      if (mode === 'none' && slideEnterKeys.length > 0) {
        motion.animateEnter(slideEnterKeys)
      }
    },

    deleteRow: (key) => {
      const fromKeys = visibleDisplayKeys(get())
      const toKeys = fromKeys.filter((item) => item !== key)
      const commit = () => {
        set((state) => {
          if (!state.project) {
            return state
          }
          const lists = removeKeysFromLists(pickKeyLists(state), [key])
          return {
            ...withDirtyProject(
              state,
              deleteProjectRow(state.project, key),
              lists.missingFilterKeys,
              lists.freshKeys,
            ),
            selectedKeys: lists.selectedKeys,
            pendingKeyEdit: lists.pendingKeyEdit,
          }
        })
      }
      const mode = transitionDisplayKeys(fromKeys, toKeys, { onDone: commit })
      if (mode === 'none') {
        commit()
      }
    },

    deleteSelectedRows: () => {
      const keys = [...get().selectedKeys]
      const fromKeys = visibleDisplayKeys(get())
      const remove = new Set(keys)
      const toKeys = fromKeys.filter((key) => !remove.has(key))
      const commit = () => {
        set((state) => ({
          ...applyDeleteRows(state, keys),
          selectedKeys: [],
        }))
      }
      const mode = transitionDisplayKeys(fromKeys, toKeys, { onDone: commit })
      if (mode === 'none') {
        commit()
      }
    },

    renameKey: (oldKey, newKey) => {
      const { project } = get()
      if (!canRenameKey(project, oldKey, newKey)) {
        return false
      }
      set((state) => applyRenameKey(state, oldKey, newKey))
      return true
    },

    moveSelectedKeys: (lead) => {
      const keys = get().selectedKeys
      const { project } = get()
      if (!project || keys.length === 0) {
        return false
      }
      if (moveKeysWithLead(project, keys, lead) === null) {
        return false
      }
      const mapping = buildLeadMoveMapping(keys, lead)
      set((state) => applyMoveKeys(state, keys, lead))
      if (mapping) {
        motion.animateFlash(keys.map((key) => mapping.get(key) ?? key))
      }
      return true
    },

    leaveFreshKey: (key) =>
      set((state) => {
        const lists = pickKeyLists(state)
        const next = leaveKeyInLists(lists, key)
        return next === lists
          ? state
          : { freshKeys: next.freshKeys, pendingKeyEdit: next.pendingKeyEdit }
      }),

    clearPendingKeyEdit: () =>
      set((state) =>
        state.pendingKeyEdit === null ? state : { pendingKeyEdit: null },
      ),

    toggleMissingFilter: () => {
      const state = get()
      if (!state.project) {
        return
      }

      const allKeys = state.project.rows.map((row) => row.key)
      const turningOff = state.missingFilterKeys !== null
      const fromFiltered = state.missingFilterKeys

      // Allow rapid re-clicks: cancel the in-flight FLIP and reverse immediately.
      if (
        state.filterLayoutMode !== null ||
        state.layoutMotion !== null ||
        state.searchLayoutHoldKeys !== null
      ) {
        motion.clearMotion()
      }

      if (turningOff && fromFiltered) {
        set({ missingFilterKeys: null })
        transitionDisplayKeys(fromFiltered, allKeys, { trackFilterMode: true })
        return
      }

      const toKeys = collectMissingRowKeys(state.project, state.freshKeys)
      // Apply the snapshot immediately; hold full list so exiting rows can animate.
      set({ missingFilterKeys: [...toKeys] })
      transitionDisplayKeys(allKeys, toKeys, {
        trackFilterMode: true,
        holdOnCollapse: true,
      })
    },

    clearMotion: motion.clearMotion,

    browseDirectory: persistence.browseDirectory,
    loadDirectory: persistence.loadDirectory,
    confirmOpenFiles: persistence.confirmOpenFiles,
    cancelOpenFiles: persistence.cancelOpenFiles,
    openProject: persistence.openProject,
    saveProject: persistence.saveProject,
  }
})

/** Reset mutable fields for tests; keeps actions intact. */
export function resetTranslationStore(directoryPath = ''): void {
  useTranslationStoreBase.setState({
    ...createInitialTranslationState(directoryPath),
  })
  useTranslationStoreBase.getState().clearMotion()
}
