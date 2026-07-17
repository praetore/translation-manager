import { create } from 'zustand'
import { difference } from 'remeda'
import { ROW_HEIGHT } from '@/lib/motion'
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
import { planFilterCollapse, planFilterExpand } from '@/store/filterLayout'
import {
  leaveKeyInLists,
  pickKeyLists,
  removeKeysFromLists,
} from '@/store/keyLists'
import { createMotionActions } from '@/store/motionActions'
import { createPersistenceActions, readStoredDirectory, storeDirectory } from '@/store/persistence'
import { canRenameKey } from '@/store/selectors'
import {
  applyDeleteRows,
  applyMoveKeys,
  applyRenameKey,
} from '@/store/sessionBulkActions'
import { withDirtyProject } from '@/store/sessionHelpers'
import { getStoreTranslator } from '@/store/translator'
import {
  createInitialTranslationState,
  type TranslationState,
} from '@/store/types'

export type TranslationStore = TranslationState & {
  setDirectoryPath: (path: string) => void
  setSearchQuery: (value: string) => void
  clearSearch: () => void
  selectKeys: (keys: string[]) => void
  clearSelection: () => void
  removeFromSelection: (key: string) => void
  editCell: (key: string, locale: string, value: string) => void
  addRow: () => void
  deleteRow: (key: string) => void
  deleteSelectedRows: () => void
  renameKey: (oldKey: string, newKey: string) => boolean
  moveSelectedKeys: (lead: string) => boolean
  leaveFreshKey: (key: string) => void
  clearPendingKeyEdit: () => void
  toggleMissingFilter: () => void
  clearMotion: () => void
  browseDirectory: () => Promise<void>
  loadDirectory: (pathOverride?: string) => Promise<void>
  openProject: () => Promise<void>
  saveProject: () => Promise<void>
}

export const useTranslationStoreBase = create<TranslationStore>((set, get) => {
  const motion = createMotionActions(set)
  const persistence = createPersistenceActions(
    { getState: get, setState: set },
    getStoreTranslator,
  )

  return {
    ...createInitialTranslationState(readStoredDirectory()),

    setDirectoryPath: (path) => {
      storeDirectory(path)
      set({ directoryPath: path })
    },

    setSearchQuery: (value) => set({ searchQuery: value }),
    clearSearch: () => set({ searchQuery: '' }),

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
      const { project } = get()
      if (!project) {
        return
      }
      motion.animateEnter([peekNextRowKey(project)])
      set((state) => {
        if (!state.project) {
          return state
        }
        const next = addProjectRow(state.project)
        const newKey = next.rows[0]?.key
        return {
          ...withDirtyProject(
            state,
            next,
            null,
            newKey ? [...state.freshKeys, newKey] : state.freshKeys,
          ),
          pendingKeyEdit: newKey ?? null,
        }
      })
    },

    deleteRow: (key) => {
      motion.animateExit([key], () => {
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
      })
    },

    deleteSelectedRows: () => {
      const keys = [...get().selectedKeys]
      motion.animateExit(keys, () => {
        set((state) => ({
          ...applyDeleteRows(state, keys),
          selectedKeys: [],
        }))
      })
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
      // Ignore while filter collapse is in flight (avoids overlapping toggles).
      if (state.layoutMotion !== null) {
        return
      }

      if (state.missingFilterKeys !== null) {
        const { appearing, expanding } = planFilterExpand(
          state.project.rows,
          state.missingFilterKeys,
          ROW_HEIGHT,
        )
        set({ missingFilterKeys: null })
        motion.animateFilterExpand(appearing, expanding)
        return
      }

      const missing = collectMissingRowKeys(state.project, state.freshKeys)
      const { hiding, remaining, missingKeys } = planFilterCollapse(
        state.project.rows,
        missing,
        ROW_HEIGHT,
      )
      motion.animateFilterCollapse(hiding, remaining, () => {
        set({ missingFilterKeys: missingKeys })
      })
    },

    clearMotion: motion.clearMotion,

    browseDirectory: persistence.browseDirectory,
    loadDirectory: persistence.loadDirectory,
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
