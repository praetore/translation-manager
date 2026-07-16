import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buildProjectFromFiles,
  serializeProject,
  updateCell,
  type TranslationProject,
} from '@/services/translationProject'
import { useI18n } from '@/i18n/LocaleProvider'
import type { WriteFilesResult } from '@shared/types'

const SESSION_DIRECTORY_KEY = 'translation-manager:directory-path'

interface LoadState {
  loading: boolean
  saving: boolean
  error: string | null
  status: string | null
}

const initialLoadState: LoadState = {
  loading: false,
  saving: false,
  error: null,
  status: null,
}

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

export function useTranslationStore() {
  const { t } = useI18n()
  const tRef = useRef(t)
  tRef.current = t

  const [project, setProject] = useState<TranslationProject | null>(null)
  const [directoryPath, setDirectoryPathState] = useState(readStoredDirectory)
  const [loadState, setLoadState] = useState<LoadState>(initialLoadState)
  const didRestoreRef = useRef(false)
  const openProjectRef = useRef<() => Promise<void>>(async () => {})
  const saveProjectRef = useRef<() => Promise<void>>(async () => {})

  const setDirectoryPath = useCallback((value: string) => {
    setDirectoryPathState(value)
    storeDirectory(value)
  }, [])

  const clearMessages = useCallback(() => {
    setLoadState((prev) => ({ ...prev, error: null, status: null }))
  }, [])

  const loadDirectory = useCallback(async (pathOverride?: string) => {
    const target = (pathOverride ?? directoryPath).trim()
    if (!target) {
      setLoadState((prev) => ({ ...prev, error: tRef.current('errors.enterPath') }))
      return
    }

    setLoadState({ loading: true, saving: false, error: null, status: null })

    try {
      const scan = await window.electronAPI.scanDirectory(target)
      const nextProject = buildProjectFromFiles(scan.directoryPath, scan.files)
      setDirectoryPath(scan.directoryPath)
      setProject(nextProject)
      setLoadState({
        loading: false,
        saving: false,
        error: null,
        status: tRef.current('status.keysAndLocales', {
          keys: nextProject.rows.length,
          locales: nextProject.columns.length,
        }),
      })
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error)
      setProject(null)
      setLoadState({
        loading: false,
        saving: false,
        error: translateErrorMessage(raw, tRef.current),
        status: null,
      })
    }
  }, [directoryPath, setDirectoryPath])

  const browseDirectory = useCallback(async () => {
    clearMessages()
    const selected = await window.electronAPI.selectDirectory()
    if (!selected) {
      return
    }
    await loadDirectory(selected)
  }, [clearMessages, loadDirectory])

  const openProject = browseDirectory

  // After a Vite/Electron reload (e.g. file write in the repo), restore the last folder.
  useEffect(() => {
    if (didRestoreRef.current) {
      return
    }
    didRestoreRef.current = true

    const stored = readStoredDirectory().trim()
    if (!stored || project) {
      return
    }

    void loadDirectory(stored)
  }, [loadDirectory, project])

  const editCell = useCallback((key: string, locale: string, value: string) => {
    setProject((current) => (current ? updateCell(current, key, locale, value) : current))
  }, [])

  const saveProject = useCallback(async () => {
    if (!project) {
      return
    }

    // Keep a stable reference for this save; avoid depending on later state updates.
    const snapshot = project
    setLoadState((prev) => ({
      ...prev,
      saving: true,
      error: null,
      status: tRef.current('status.saving'),
    }))

    try {
      const files = serializeProject(snapshot)
      const result = await window.electronAPI.writeFiles(files)

      if (result.errors.length > 0) {
        const message = result.errors
          .map((item: WriteFilesResult['errors'][number]) => `${item.filePath}: ${item.message}`)
          .join('; ')
        setLoadState((prev) => ({
          ...prev,
          saving: false,
          error: tRef.current('errors.saveFailed', { message }),
        }))
        return
      }

      setProject((current) => (current ? { ...current, dirty: false } : current))
      setLoadState({
        loading: false,
        saving: false,
        error: null,
        status: tRef.current('status.saved', { count: result.written.length }),
      })
    } catch (error) {
      setLoadState((prev) => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : String(error),
      }))
    }
  }, [project])

  openProjectRef.current = openProject
  saveProjectRef.current = saveProject

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

  return {
    project,
    directoryPath,
    setDirectoryPath,
    loadState,
    browseDirectory,
    loadDirectory,
    openProject,
    editCell,
    saveProject,
  }
}
