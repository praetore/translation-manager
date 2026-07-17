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

export interface RowLayoutMotion {
  /** Final list `top` (compacted index). */
  top: number
  /** FLIP offset; animates to 0 via transform. */
  shiftY: number
  /** When true, CSS transitions transform (phase 2). */
  animate: boolean
}

export interface MotionState {
  enteringKeys: string[]
  /** Filter-expand reappear: fade only (must not flip to slide mid-animation). */
  fadeEnteringKeys: string[]
  flashingKeys: string[]
  exitingKeys: string[]
  /** FLIP layout while compacting/expanding rows (missing filter). */
  layoutMotion: Record<string, RowLayoutMotion> | null
  /** Distinguishes filter on vs off animation for UI + stripe fade. */
  filterLayoutMode: 'collapse' | 'expand' | null
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
    fadeEnteringKeys: [],
    flashingKeys: [],
    exitingKeys: [],
    layoutMotion: null,
    filterLayoutMode: null,
  }
}
