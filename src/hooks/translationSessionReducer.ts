import {
  addRow as addProjectRow,
  collectMissingRowKeys,
  deleteRow as deleteProjectRow,
  renameKey as renameProjectKey,
  updateCell,
  type TranslationProject,
} from '@/services/translationProject'

export interface LoadState {
  loading: boolean
  saving: boolean
  error: string | null
  status: string | null
}

export interface TranslationSessionState {
  project: TranslationProject | null
  directoryPath: string
  load: LoadState
  /** Snapshot of row keys when the missing-filter was enabled. Null = filter off. */
  missingFilterKeys: string[] | null
  /** Keys just added; excluded from missing until focus leaves the row. */
  freshKeys: string[]
  /** Fresh key that should open in key-edit mode once. */
  pendingKeyEdit: string | null
}

export type TranslationSessionAction =
  | { type: 'setDirectoryPath'; path: string }
  | { type: 'clearMessages' }
  | { type: 'setError'; error: string }
  | { type: 'loadStart' }
  | { type: 'loadSuccess'; project: TranslationProject; directoryPath: string; status: string }
  | { type: 'loadError'; error: string }
  | { type: 'editCell'; key: string; locale: string; value: string }
  | { type: 'addRow' }
  | { type: 'deleteRow'; key: string }
  | { type: 'renameKey'; oldKey: string; newKey: string }
  | { type: 'leaveFreshKey'; key: string }
  | { type: 'clearPendingKeyEdit' }
  | { type: 'toggleMissingFilter' }
  | { type: 'saveStart'; status: string }
  | { type: 'saveSuccess'; status: string }
  | { type: 'saveError'; error: string }

export const initialLoadState: LoadState = {
  loading: false,
  saving: false,
  error: null,
  status: null,
}

function clearMessages(load: LoadState): LoadState {
  if (!load.status && !load.error) {
    return load
  }
  return { ...load, status: null, error: null }
}

function withDirtyProject(
  state: TranslationSessionState,
  project: TranslationProject,
  missingFilterKeys: string[] | null = state.missingFilterKeys,
  freshKeys: string[] = state.freshKeys,
): TranslationSessionState {
  return {
    ...state,
    project,
    missingFilterKeys,
    freshKeys,
    load: clearMessages(state.load),
  }
}

export function createInitialTranslationSessionState(
  directoryPath: string,
): TranslationSessionState {
  return {
    project: null,
    directoryPath,
    load: initialLoadState,
    missingFilterKeys: null,
    freshKeys: [],
    pendingKeyEdit: null,
  }
}

export function translationSessionReducer(
  state: TranslationSessionState,
  action: TranslationSessionAction,
): TranslationSessionState {
  switch (action.type) {
    case 'setDirectoryPath':
      return { ...state, directoryPath: action.path }

    case 'clearMessages':
      return { ...state, load: clearMessages(state.load) }

    case 'setError':
      return {
        ...state,
        load: { ...state.load, error: action.error, status: null },
      }

    case 'loadStart':
      return {
        ...state,
        load: { loading: true, saving: false, error: null, status: null },
      }

    case 'loadSuccess':
      return {
        ...state,
        project: action.project,
        directoryPath: action.directoryPath,
        missingFilterKeys: null,
        freshKeys: [],
        pendingKeyEdit: null,
        load: {
          loading: false,
          saving: false,
          error: null,
          status: action.status,
        },
      }

    case 'loadError':
      return {
        ...state,
        project: null,
        missingFilterKeys: null,
        freshKeys: [],
        pendingKeyEdit: null,
        load: {
          loading: false,
          saving: false,
          error: action.error,
          status: null,
        },
      }

    case 'editCell': {
      if (!state.project) {
        return state
      }
      return withDirtyProject(
        state,
        updateCell(state.project, action.key, action.locale, action.value),
      )
    }

    case 'addRow': {
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
    }

    case 'deleteRow': {
      if (!state.project) {
        return state
      }
      return {
        ...withDirtyProject(
          state,
          deleteProjectRow(state.project, action.key),
          state.missingFilterKeys === null
            ? null
            : state.missingFilterKeys.filter((key) => key !== action.key),
          state.freshKeys.filter((key) => key !== action.key),
        ),
        pendingKeyEdit:
          state.pendingKeyEdit === action.key ? null : state.pendingKeyEdit,
      }
    }

    case 'renameKey': {
      if (!state.project) {
        return state
      }
      const next = renameProjectKey(state.project, action.oldKey, action.newKey)
      if (!next || next === state.project) {
        return state
      }
      const trimmed = action.newKey.trim()
      return {
        ...withDirtyProject(
          state,
          next,
          state.missingFilterKeys === null
            ? null
            : state.missingFilterKeys.map((key) => (key === action.oldKey ? trimmed : key)),
          state.freshKeys.map((key) => (key === action.oldKey ? trimmed : key)),
        ),
        pendingKeyEdit:
          state.pendingKeyEdit === action.oldKey ? null : state.pendingKeyEdit,
      }
    }

    case 'leaveFreshKey': {
      if (!state.freshKeys.includes(action.key) && state.pendingKeyEdit !== action.key) {
        return state
      }
      return {
        ...state,
        freshKeys: state.freshKeys.filter((key) => key !== action.key),
        pendingKeyEdit:
          state.pendingKeyEdit === action.key ? null : state.pendingKeyEdit,
      }
    }

    case 'clearPendingKeyEdit':
      if (state.pendingKeyEdit === null) {
        return state
      }
      return { ...state, pendingKeyEdit: null }

    case 'toggleMissingFilter': {
      if (state.missingFilterKeys !== null) {
        return { ...state, missingFilterKeys: null }
      }
      if (!state.project) {
        return state
      }
      return {
        ...state,
        missingFilterKeys: collectMissingRowKeys(state.project, state.freshKeys),
      }
    }

    case 'saveStart':
      return {
        ...state,
        load: {
          ...state.load,
          saving: true,
          error: null,
          status: action.status,
        },
      }

    case 'saveSuccess':
      return {
        ...state,
        project: state.project ? { ...state.project, dirty: false } : null,
        load: {
          loading: false,
          saving: false,
          error: null,
          status: action.status,
        },
      }

    case 'saveError':
      return {
        ...state,
        load: {
          ...state.load,
          saving: false,
          error: action.error,
        },
      }

    default:
      return state
  }
}

export function selectDisplayProject(
  state: TranslationSessionState,
): TranslationProject | null {
  if (!state.project) {
    return null
  }
  if (state.missingFilterKeys === null) {
    return state.project
  }

  const keySet = new Set(state.missingFilterKeys)
  return {
    ...state.project,
    rows: state.project.rows.filter((row) => keySet.has(row.key)),
  }
}

export function selectLiveMissingKeys(state: TranslationSessionState): string[] {
  return state.project ? collectMissingRowKeys(state.project, state.freshKeys) : []
}

/** Peek whether a rename would succeed without dispatching. */
export function canRenameKey(
  project: TranslationProject | null,
  oldKey: string,
  newKey: string,
): boolean {
  if (!project) {
    return false
  }
  return renameProjectKey(project, oldKey, newKey) !== null
}
