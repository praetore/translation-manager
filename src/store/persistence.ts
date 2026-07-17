/**
 * Load / browse / save via Electron IPC.
 * Load scans the folder, then opens a file picker (or errors if nothing valid).
 * Confirm applies the selected files; cancel leaves the current project intact.
 * Save only runs when `project.dirty`; refreshes `baselineRows` on success.
 */
import { toast } from 'sonner'
import {
  candidatesToPayloads,
  classifyTranslationFiles,
} from '@/services/classifyTranslationFiles'
import {
  buildProjectFromFiles,
  cloneTranslationRows,
  serializeProject,
} from '@/services/translationProject'
import type { WriteFilesResult } from '@shared/types'
import { keysAndLocalesStatus } from '@/store/sessionHelpers'
import type { TranslateFn } from '@/store/translator'
import type { LoadState, TranslationState } from '@/store/types'

const SESSION_DIRECTORY_KEY = 'translation-manager:directory-path'

export function readStoredDirectory(): string {
  try {
    return localStorage.getItem(SESSION_DIRECTORY_KEY) ?? ''
  } catch {
    return ''
  }
}

export function storeDirectory(directoryPath: string): void {
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

function translateErrorMessage(message: string, t: TranslateFn): string {
  if (message.startsWith('errors.')) {
    return t(message)
  }
  return message
}

type PersistenceHost = TranslationState & {
  clearSelection: () => void
  clearSearch: () => void
  clearMotion: () => void
  animateLoadEnter: () => void
}

type StoreApi = {
  getState: () => PersistenceHost
  setState: (
    partial:
      | Partial<PersistenceHost>
      | ((state: PersistenceHost) => Partial<PersistenceHost>),
  ) => void
}

export function createPersistenceActions(api: StoreApi, getT: () => TranslateFn) {
  const applyLoadedProject = (
    directoryPath: string,
    files: Parameters<typeof buildProjectFromFiles>[1],
  ) => {
    const nextProject = buildProjectFromFiles(directoryPath, files)
    storeDirectory(directoryPath)
    api.getState().clearSelection()
    api.getState().clearSearch()
    api.getState().clearMotion()
    api.setState({
      project: nextProject,
      baselineRows: cloneTranslationRows(nextProject.rows),
      directoryPath,
      missingFilterKeys: null,
      freshKeys: [],
      pendingKeyEdit: null,
      filePicker: null,
      load: {
        loading: false,
        saving: false,
        error: null,
        status: keysAndLocalesStatus(nextProject),
      },
    })
    if (nextProject.rows.length > 0) {
      api.getState().animateLoadEnter()
    }
  }

  const loadDirectory = async (pathOverride?: string) => {
    const t = getT()
    const target = (pathOverride ?? api.getState().directoryPath).trim()
    if (!target) {
      const message = t('errors.enterPath')
      toast.error(message)
      const load = api.getState().load
      api.setState({ load: { ...load, error: message, status: null } })
      return
    }

    api.setState({
      load: { loading: true, saving: false, error: null, status: null },
      filePicker: null,
    })

    try {
      const scan = await window.electronAPI.scanDirectory(target)
      if (scan.files.length === 0) {
        throw new Error('errors.noSupportedFiles')
      }

      const classified = classifyTranslationFiles(scan.files)
      if (classified.candidates.length === 0) {
        const message = t('errors.noValidFiles')
        toast.error(message)
        api.setState({
          filePicker: null,
          load: { loading: false, saving: false, error: message, status: null },
        })
        return
      }

      api.setState({
        directoryPath: scan.directoryPath,
        filePicker: {
          directoryPath: scan.directoryPath,
          candidates: classified.candidates,
          skipped: classified.skipped,
        },
        load: { loading: false, saving: false, error: null, status: null },
      })
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error)
      const message = translateErrorMessage(raw, t)
      toast.error(message)
      api.setState({
        filePicker: null,
        load: { loading: false, saving: false, error: message, status: null },
      })
    }
  }

  const confirmOpenFiles = (selectedPaths: readonly string[]) => {
    const t = getT()
    const picker = api.getState().filePicker
    if (!picker) {
      return
    }

    const selected = new Set(selectedPaths)
    const chosen = picker.candidates.filter((item) => selected.has(item.filePath))
    if (chosen.length === 0) {
      const message = t('errors.selectAtLeastOneFile')
      toast.error(message)
      return
    }

    try {
      applyLoadedProject(picker.directoryPath, candidatesToPayloads(chosen))
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error)
      const message = translateErrorMessage(raw, t)
      toast.error(message)
      api.setState({
        load: { loading: false, saving: false, error: message, status: null },
      })
    }
  }

  const cancelOpenFiles = () => {
    api.setState({ filePicker: null })
  }

  const browseDirectory = async () => {
    const load: LoadState = api.getState().load
    if (load.status || load.error) {
      api.setState({ load: { ...load, status: null, error: null } })
    }
    const selected = await window.electronAPI.selectDirectory()
    if (!selected) {
      return
    }
    await loadDirectory(selected)
  }

  const saveProject = async () => {
    const t = getT()
    const snapshot = api.getState().project
    if (!snapshot?.dirty) {
      return
    }

    api.setState({
      load: {
        ...api.getState().load,
        saving: true,
        error: null,
        status: { key: 'status.saving' },
      },
    })

    try {
      const files = serializeProject(snapshot)
      const result = await window.electronAPI.writeFiles(files)

      if (result.errors.length > 0) {
        const message = result.errors
          .map((item: WriteFilesResult['errors'][number]) => `${item.filePath}: ${item.message}`)
          .join('; ')
        const error = t('errors.saveFailed', { message })
        toast.error(error)
        api.setState({
          load: { ...api.getState().load, saving: false, error },
        })
        return
      }

      toast.success(t('status.saved', { count: result.written.length }))
      api.setState({
        project: { ...snapshot, dirty: false },
        baselineRows: cloneTranslationRows(snapshot.rows),
        load: {
          loading: false,
          saving: false,
          error: null,
          status: keysAndLocalesStatus(snapshot),
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error(message)
      api.setState({
        load: { ...api.getState().load, saving: false, error: message },
      })
    }
  }

  return {
    loadDirectory,
    browseDirectory,
    confirmOpenFiles,
    cancelOpenFiles,
    saveProject,
    openProject: browseDirectory,
  }
}
