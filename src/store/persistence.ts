import { toast } from 'sonner'
import {
  buildProjectFromFiles,
  cloneTranslationRows,
  serializeProject,
} from '@/services/translationProject'
import type { WriteFilesResult } from '@shared/types'
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
    })
    api.getState().clearSelection()
    api.getState().clearSearch()
    api.getState().clearMotion()

    try {
      const scan = await window.electronAPI.scanDirectory(target)
      const nextProject = buildProjectFromFiles(scan.directoryPath, scan.files)
      storeDirectory(scan.directoryPath)
      const status = {
        key: 'status.keysAndLocales',
        params: {
          keys: nextProject.rows.length,
          locales: nextProject.columns.length,
        },
      }
      api.setState({
        project: nextProject,
        baselineRows: cloneTranslationRows(nextProject.rows),
        directoryPath: scan.directoryPath,
        missingFilterKeys: null,
        freshKeys: [],
        pendingKeyEdit: null,
        load: { loading: false, saving: false, error: null, status },
      })
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error)
      const message = translateErrorMessage(raw, t)
      toast.error(message)
      api.setState({
        project: null,
        baselineRows: null,
        missingFilterKeys: null,
        freshKeys: [],
        pendingKeyEdit: null,
        load: { loading: false, saving: false, error: message, status: null },
      })
    }
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
      const status = {
        key: 'status.keysAndLocales',
        params: {
          keys: snapshot.rows.length,
          locales: snapshot.columns.length,
        },
      }
      api.setState({
        project: { ...snapshot, dirty: false },
        baselineRows: cloneTranslationRows(snapshot.rows),
        load: { loading: false, saving: false, error: null, status },
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
    saveProject,
    openProject: browseDirectory,
  }
}
