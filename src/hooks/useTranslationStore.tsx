import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { useI18n } from '@/i18n/LocaleProvider'
import {
  selectDisplayProject,
  selectLiveMissingKeys,
} from '@/store/selectors'
import { setStoreTranslator } from '@/store/translator'
import {
  useTranslationStoreBase,
  type TranslationStore,
} from '@/store/translationStore'
import type { TranslationProject } from '@/services/translationProject'
import { readStoredDirectory } from '@/store/persistence'

export type TranslationStoreValue = Omit<
  TranslationStore,
  'load' | 'clearSearch' | 'clearMotion' | 'removeFromSelection'
> & {
  loadState: TranslationStore['load']
  displayProject: TranslationProject | null
  liveMissingKeys: string[]
}

/** Binds i18n, menu shortcuts, and directory restore to the Zustand store. */
export function TranslationStoreProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const loadDirectory = useTranslationStoreBase((s) => s.loadDirectory)
  const openProject = useTranslationStoreBase((s) => s.openProject)
  const saveProject = useTranslationStoreBase((s) => s.saveProject)
  const didRestoreRef = useRef(false)

  useEffect(() => {
    setStoreTranslator(t)
  }, [t])

  useEffect(() => {
    if (didRestoreRef.current) {
      return
    }
    didRestoreRef.current = true
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

  const displayProject = useMemo(
    () => selectDisplayProject(store, deferredSearchQuery),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional narrow deps
    [store.project, store.missingFilterKeys, deferredSearchQuery],
  )
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
