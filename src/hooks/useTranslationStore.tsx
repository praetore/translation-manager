import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import {
  selectDisplayProject,
  selectLiveMissingKeys,
} from '@/store/selectors'
import {
  useTranslationStoreBase,
  type TranslationStore,
} from '@/store/translationStore'
import type { TranslationProject } from '@/services/translationProject'
import { readStoredDirectory } from '@/store/persistence'

export type TranslationStoreValue = Omit<
  TranslationStore,
  | 'load'
  | 'baselineRows'
  | 'clearSearch'
  | 'clearMotion'
  | 'removeFromSelection'
  | 'transitionDisplayKeys'
  | 'searchLayoutHoldKeys'
> & {
  loadState: TranslationStore['load']
  displayProject: TranslationProject | null
  liveMissingKeys: string[]
}

function sameKeys(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((key, index) => key === b[index])
}

/** Survive React StrictMode remounts so we don't double-load (which clears selection). */
let didRestoreDirectory = false

/** Binds i18n, menu shortcuts, and directory restore to the Zustand store. */
export function TranslationStoreProvider({ children }: { children: ReactNode }) {
  const loadDirectory = useTranslationStoreBase((s) => s.loadDirectory)
  const openProject = useTranslationStoreBase((s) => s.openProject)
  const saveProject = useTranslationStoreBase((s) => s.saveProject)

  useEffect(() => {
    // Same store instance the UI uses — screenshots and e2e drive selection via this.
    window.__TM_STORE__ = useTranslationStoreBase
    return () => {
      delete window.__TM_STORE__
    }
  }, [])

  useEffect(() => {
    if (didRestoreDirectory) {
      return
    }
    didRestoreDirectory = true
    const stored = readStoredDirectory().trim()
    if (!stored || useTranslationStoreBase.getState().project) {
      return
    }
    void loadDirectory(stored)
  }, [loadDirectory])

  const openRef = useRef(openProject)
  const saveRef = useRef(saveProject)
  useEffect(() => {
    openRef.current = openProject
    saveRef.current = saveProject
  }, [openProject, saveProject])

  useEffect(() => {
    const unsubscribeOpen = window.electronAPI.onMenuOpen(() => {
      void openRef.current()
    })
    const unsubscribeSave = window.electronAPI.onMenuSave(() => {
      void saveRef.current()
    })
    return () => {
      unsubscribeOpen()
      unsubscribeSave()
    }
  }, [])

  return children
}

/** App-facing store hook (deferred search + derived display rows). */
export function useTranslationStore(): TranslationStoreValue {
  const store = useTranslationStoreBase()
  const deferredSearchQuery = useDeferredValue(store.searchQuery)
  const transitionDisplayKeys = useTranslationStoreBase((s) => s.transitionDisplayKeys)
  const searchLayoutHoldKeys = useTranslationStoreBase((s) => s.searchLayoutHoldKeys)

  const searchSig = `${deferredSearchQuery}\0${store.searchScope}\0${store.searchRegex}`
  const prevSearchSigRef = useRef<string | null>(null)
  const prevKeysRef = useRef<string[] | null>(null)

  const liveDisplayProject = useMemo(
    () =>
      selectDisplayProject(
        {
          project: store.project,
          missingFilterKeys: store.missingFilterKeys,
          searchScope: store.searchScope,
          searchRegex: store.searchRegex,
        },
        deferredSearchQuery,
      ),
    [
      store.project,
      store.missingFilterKeys,
      store.searchScope,
      store.searchRegex,
      deferredSearchQuery,
    ],
  )

  const targetKeys = useMemo(
    () => liveDisplayProject?.rows.map((row) => row.key) ?? [],
    [liveDisplayProject],
  )

  useEffect(() => {
    const prev = prevKeysRef.current
    if (prev === null) {
      prevKeysRef.current = targetKeys
      prevSearchSigRef.current = searchSig
      return
    }

    if (prevSearchSigRef.current === searchSig) {
      // Row edits without search change — keep baseline in sync, no motion.
      if (searchLayoutHoldKeys === null) {
        prevKeysRef.current = targetKeys
      }
      return
    }

    const visualKeys = searchLayoutHoldKeys ?? prev
    prevSearchSigRef.current = searchSig

    if (sameKeys(visualKeys, targetKeys)) {
      prevKeysRef.current = targetKeys
      return
    }

    const mode = transitionDisplayKeys(visualKeys, targetKeys, {
      holdOnCollapse: true,
    })
    if (mode !== 'collapse') {
      prevKeysRef.current = targetKeys
    }
  }, [transitionDisplayKeys, searchLayoutHoldKeys, searchSig, targetKeys])

  useEffect(() => {
    if (searchLayoutHoldKeys === null && prevSearchSigRef.current !== null) {
      prevKeysRef.current = targetKeys
    }
  }, [searchLayoutHoldKeys, targetKeys])

  const displayProject = useMemo(() => {
    if (!liveDisplayProject || !searchLayoutHoldKeys) {
      return liveDisplayProject
    }
    const base = selectDisplayProject(
      {
        project: store.project,
        missingFilterKeys: store.missingFilterKeys,
      },
      '',
    )
    if (!base) {
      return liveDisplayProject
    }
    const byKey = new Map(base.rows.map((row) => [row.key, row]))
    return {
      ...base,
      rows: searchLayoutHoldKeys.flatMap((key) => {
        const row = byKey.get(key)
        return row ? [row] : []
      }),
    }
  }, [
    liveDisplayProject,
    searchLayoutHoldKeys,
    store.project,
    store.missingFilterKeys,
  ])

  const liveMissingKeys = useMemo(
    () => selectLiveMissingKeys(store),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional narrow deps
    [store.project, store.freshKeys],
  )

  return {
    project: store.project,
    displayProject,
    directoryPath: store.directoryPath,
    setDirectoryPath: store.setDirectoryPath,
    loadState: store.load,
    missingFilterKeys: store.missingFilterKeys,
    freshKeys: store.freshKeys,
    pendingKeyEdit: store.pendingKeyEdit,
    liveMissingKeys,
    selectedKeys: store.selectedKeys,
    selectKeys: store.selectKeys,
    clearSelection: store.clearSelection,
    deleteSelectedRows: store.deleteSelectedRows,
    moveSelectedKeys: store.moveSelectedKeys,
    enteringKeys: store.enteringKeys,
    fadeEnteringKeys: store.fadeEnteringKeys,
    flashingKeys: store.flashingKeys,
    exitingKeys: store.exitingKeys,
    layoutMotion: store.layoutMotion,
    filterLayoutMode: store.filterLayoutMode,
    searchQuery: store.searchQuery,
    setSearchQuery: store.setSearchQuery,
    searchScope: store.searchScope,
    setSearchScope: store.setSearchScope,
    searchRegex: store.searchRegex,
    setSearchRegex: store.setSearchRegex,
    browseDirectory: store.browseDirectory,
    loadDirectory: store.loadDirectory,
    openProject: store.openProject,
    editCell: store.editCell,
    addRow: store.addRow,
    deleteRow: store.deleteRow,
    renameKey: store.renameKey,
    leaveFreshKey: store.leaveFreshKey,
    clearPendingKeyEdit: store.clearPendingKeyEdit,
    toggleMissingFilter: store.toggleMissingFilter,
    saveProject: store.saveProject,
  }
}
