import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import {
  buildProjectFromFiles,
  serializeProject,
  type TranslationProject,
} from '@/services/translationProject'
import { useI18n } from '@/i18n/LocaleProvider'
import type { WriteFilesResult } from '@shared/types'
import {
  canRenameKey,
  createInitialTranslationSessionState,
  selectDisplayProject,
  selectLiveMissingKeys,
  translationSessionReducer,
} from '@/hooks/translationSessionReducer'

const SESSION_DIRECTORY_KEY = 'translation-manager:directory-path'

function readStoredDirectory(): string {
  try {
    return localStorage.getItem(SESSION_DIRECTORY_KEY) ?? ''
  } catch {
    return ''
  }
}

function storeDirectory(directoryPath: string): void {
  try {
    if (directoryPath) {
      localStorage.setItem(SESSION_DIRECTORY_KEY, directoryPath)
    } else {
      localStorage.removeItem(SESSION_DIRECTORY_KEY)
    }
  } catch {
    // localStorage may be unavailable; ignore
  }
}

function translateErrorMessage(
  message: string,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  if (message.startsWith('errors.')) {
    return t(message)
  }
  return message
}

export interface TranslationStoreValue {
  project: TranslationProject | null
  displayProject: TranslationProject | null
  directoryPath: string
  setDirectoryPath: (value: string) => void
  loadState: {
    loading: boolean
    saving: boolean
    error: string | null
    status: string | null
  }
  missingFilterKeys: string[] | null
  freshKeys: string[]
  pendingKeyEdit: string | null
  liveMissingKeys: string[]
  browseDirectory: () => Promise<void>
  loadDirectory: (pathOverride?: string) => Promise<void>
  openProject: () => Promise<void>
  editCell: (key: string, locale: string, value: string) => void
  addRow: () => void
  deleteRow: (key: string) => void
  renameKey: (oldKey: string, newKey: string) => boolean
  leaveFreshKey: (key: string) => void
  clearPendingKeyEdit: () => void
  toggleMissingFilter: () => void
  saveProject: () => Promise<void>
}

const TranslationStoreContext = createContext<TranslationStoreValue | null>(null)

function useTranslationStoreController(): TranslationStoreValue {
  const { t } = useI18n()
  const tRef = useRef(t)
  const [state, dispatch] = useReducer(
    translationSessionReducer,
    undefined,
    () => createInitialTranslationSessionState(readStoredDirectory()),
  )
  const stateRef = useRef(state)
  const didRestoreRef = useRef(false)
  const openProjectRef = useRef<() => Promise<void>>(async () => {})
  const saveProjectRef = useRef<() => Promise<void>>(async () => {})

  useEffect(() => {
    tRef.current = t
  }, [t])

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const setDirectoryPath = useCallback((value: string) => {
    storeDirectory(value)
    dispatch({ type: 'setDirectoryPath', path: value })
  }, [])

  const loadDirectory = useCallback(async (pathOverride?: string) => {
    const target = (pathOverride ?? stateRef.current.directoryPath).trim()
    if (!target) {
      dispatch({ type: 'setError', error: tRef.current('errors.enterPath') })
      return
    }

    dispatch({ type: 'loadStart' })

    try {
      const scan = await window.electronAPI.scanDirectory(target)
      const nextProject = buildProjectFromFiles(scan.directoryPath, scan.files)
      storeDirectory(scan.directoryPath)
      dispatch({
        type: 'loadSuccess',
        project: nextProject,
        directoryPath: scan.directoryPath,
        status: tRef.current('status.keysAndLocales', {
          keys: nextProject.rows.length,
          locales: nextProject.columns.length,
        }),
      })
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error)
      dispatch({
        type: 'loadError',
        error: translateErrorMessage(raw, tRef.current),
      })
    }
  }, [])

  const browseDirectory = useCallback(async () => {
    dispatch({ type: 'clearMessages' })
    const selected = await window.electronAPI.selectDirectory()
    if (!selected) {
      return
    }
    await loadDirectory(selected)
  }, [loadDirectory])

  const openProject = browseDirectory

  useEffect(() => {
    if (didRestoreRef.current) {
      return
    }
    didRestoreRef.current = true

    const stored = readStoredDirectory().trim()
    if (!stored || stateRef.current.project) {
      return
    }

    void loadDirectory(stored)
  }, [loadDirectory])

  const editCell = useCallback((key: string, locale: string, value: string) => {
    dispatch({ type: 'editCell', key, locale, value })
  }, [])

  const addRow = useCallback(() => {
    dispatch({ type: 'addRow' })
  }, [])

  const deleteRow = useCallback((key: string) => {
    dispatch({ type: 'deleteRow', key })
  }, [])

  const renameKey = useCallback((oldKey: string, newKey: string): boolean => {
    if (!canRenameKey(stateRef.current.project, oldKey, newKey)) {
      return false
    }
    dispatch({ type: 'renameKey', oldKey, newKey })
    return true
  }, [])

  const leaveFreshKey = useCallback((key: string) => {
    dispatch({ type: 'leaveFreshKey', key })
  }, [])

  const clearPendingKeyEdit = useCallback(() => {
    dispatch({ type: 'clearPendingKeyEdit' })
  }, [])

  const toggleMissingFilter = useCallback(() => {
    dispatch({ type: 'toggleMissingFilter' })
  }, [])

  const saveProject = useCallback(async () => {
    const snapshot = stateRef.current.project
    if (!snapshot) {
      return
    }

    dispatch({ type: 'saveStart', status: tRef.current('status.saving') })

    try {
      const files = serializeProject(snapshot)
      const result = await window.electronAPI.writeFiles(files)

      if (result.errors.length > 0) {
        const message = result.errors
          .map((item: WriteFilesResult['errors'][number]) => `${item.filePath}: ${item.message}`)
          .join('; ')
        dispatch({
          type: 'saveError',
          error: tRef.current('errors.saveFailed', { message }),
        })
        return
      }

      dispatch({
        type: 'saveSuccess',
        status: tRef.current('status.saved', { count: result.written.length }),
      })
    } catch (error) {
      dispatch({
        type: 'saveError',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }, [])

  useEffect(() => {
    openProjectRef.current = openProject
    saveProjectRef.current = saveProject
  }, [openProject, saveProject])

  useEffect(() => {
    const unsubscribeOpen = window.electronAPI.onMenuOpen(() => {
      void openProjectRef.current()
    })
    const unsubscribeSave = window.electronAPI.onMenuSave(() => {
      void saveProjectRef.current()
    })

    return () => {
      unsubscribeOpen()
      unsubscribeSave()
    }
  }, [])

  const displayProject = useMemo(
    () => selectDisplayProject(state),
    // Only recompute when project data or the missing-filter snapshot changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional narrow deps
    [state.project, state.missingFilterKeys],
  )
  const liveMissingKeys = useMemo(
    () => selectLiveMissingKeys(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional narrow deps
    [state.project, state.freshKeys],
  )

  return useMemo(
    () => ({
      project: state.project,
      displayProject,
      directoryPath: state.directoryPath,
      setDirectoryPath,
      loadState: state.load,
      missingFilterKeys: state.missingFilterKeys,
      freshKeys: state.freshKeys,
      pendingKeyEdit: state.pendingKeyEdit,
      liveMissingKeys,
      browseDirectory,
      loadDirectory,
      openProject,
      editCell,
      addRow,
      deleteRow,
      renameKey,
      leaveFreshKey,
      clearPendingKeyEdit,
      toggleMissingFilter,
      saveProject,
    }),
    [
      state.project,
      state.directoryPath,
      state.load,
      state.missingFilterKeys,
      state.freshKeys,
      state.pendingKeyEdit,
      displayProject,
      liveMissingKeys,
      setDirectoryPath,
      browseDirectory,
      loadDirectory,
      openProject,
      editCell,
      addRow,
      deleteRow,
      renameKey,
      leaveFreshKey,
      clearPendingKeyEdit,
      toggleMissingFilter,
      saveProject,
    ],
  )
}

export function TranslationStoreProvider({ children }: { children: ReactNode }) {
  const value = useTranslationStoreController()
  return (
    <TranslationStoreContext.Provider value={value}>{children}</TranslationStoreContext.Provider>
  )
}

export function useTranslationStore(): TranslationStoreValue {
  const context = useContext(TranslationStoreContext)
  if (!context) {
    throw new Error('useTranslationStore must be used within TranslationStoreProvider')
  }
  return context
}
