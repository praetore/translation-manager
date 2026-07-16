import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buildProjectFromFiles,
  serializeProject,
  updateCell,
  type TranslationProject,
} from '@/services/translationProject'
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

export function useTranslationStore() {
  const [project, setProject] = useState<TranslationProject | null>(null)
  const [directoryPath, setDirectoryPathState] = useState(readStoredDirectory)
  const [loadState, setLoadState] = useState<LoadState>(initialLoadState)
  const didRestoreRef = useRef(false)

  const setDirectoryPath = useCallback((value: string) => {
    setDirectoryPathState(value)
    storeDirectory(value)
  }, [])

  const clearMessages = useCallback(() => {
    setLoadState((prev) => ({ ...prev, error: null, status: null }))
  }, [])

  const browseDirectory = useCallback(async () => {
    clearMessages()
    const selected = await window.electronAPI.selectDirectory()
    if (selected) {
      setDirectoryPath(selected)
    }
  }, [clearMessages, setDirectoryPath])

  const loadDirectory = useCallback(async (pathOverride?: string) => {
    const target = (pathOverride ?? directoryPath).trim()
    if (!target) {
      setLoadState((prev) => ({ ...prev, error: 'Voer een mappad in' }))
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
        status: `${nextProject.rows.length} sleutels · ${nextProject.columns.length} talen`,
      })
    } catch (error) {
      setProject(null)
      setLoadState({
        loading: false,
        saving: false,
        error: error instanceof Error ? error.message : String(error),
        status: null,
      })
    }
  }, [directoryPath, setDirectoryPath])

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
    setLoadState((prev) => ({ ...prev, saving: true, error: null, status: null }))

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
          error: `Opslaan mislukt: ${message}`,
        }))
        return
      }

      setProject((current) => (current ? { ...current, dirty: false } : current))
      setLoadState({
        loading: false,
        saving: false,
        error: null,
        status: `${result.written.length} bestand(en) opgeslagen`,
      })
    } catch (error) {
      setLoadState((prev) => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : String(error),
      }))
    }
  }, [project])

  return {
    project,
    directoryPath,
    setDirectoryPath,
    loadState,
    browseDirectory,
    loadDirectory,
    editCell,
    saveProject,
  }
}
