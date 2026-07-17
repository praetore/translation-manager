import type { TranslationProject } from '@/services/translationProject'

export interface LoadState {
  loading: boolean
  saving: boolean
  error: string | null
  status: string | null
}

/** Project session fields (load + editor document). */
export interface SessionState {
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

export interface MotionState {
  enteringKeys: string[]
  flashingKeys: string[]
  exitingKeys: string[]
}

export interface TranslationState extends SessionState, MotionState {
  selectedKeys: string[]
  searchQuery: string
}

export const initialLoadState: LoadState = {
  loading: false,
  saving: false,
  error: null,
  status: null,
}

export function createInitialTranslationState(directoryPath: string): TranslationState {
  return {
    project: null,
    directoryPath,
    load: initialLoadState,
    missingFilterKeys: null,
    freshKeys: [],
    pendingKeyEdit: null,
    selectedKeys: [],
    searchQuery: '',
    enteringKeys: [],
    flashingKeys: [],
    exitingKeys: [],
  }
}
