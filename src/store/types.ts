import type { TranslationProject } from '@/services/translationProject'
import type { FilePickerState } from '@/services/classifyTranslationFiles'
import type { TranslationRow } from '@shared/types'
import type { SearchScope } from '@/store/searchFilter'

/** i18n key + params; render with the current locale's `t`. */
export type StatusMessage = {
  key: string
  params?: Record<string, string | number>
}

export interface LoadState {
  loading: boolean
  saving: boolean
  error: string | null
  status: StatusMessage | null
}

/**
 * Project session fields (load + editor document).
 * Missing-filter semantics: see `isMissingAgainstSource` in translationProject —
 * filter snapshot ≠ live badge ≠ cell stripe.
 */
export interface SessionState {
  project: TranslationProject | null
  /**
   * Last loaded/saved row snapshot. `project.dirty` is derived by comparing
   * current rows to this baseline (`withDirtyProject`).
   */
  baselineRows: TranslationRow[] | null
  directoryPath: string
  load: LoadState
  /**
   * Keys visible while Missing is on — frozen at toggle-on.
   * Null = filter off. Not the same as live missing (`selectLiveMissingKeys`).
   */
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

/**
 * Ephemeral row-list animation fields. Cleared by `clearMotion`.
 *
 * Channels (do not mix roles):
 * - `enteringKeys` — slide-in (new row)
 * - `fadeEnteringKeys` — fade-in reappear (filter/search expand)
 * - `exitingKeys` + `layoutMotion` — exit/FLIP compact (collapse)
 * - `flashingKeys` — brief highlight after move (independent of FLIP)
 * - `filterLayoutMode` — missing-filter owns the layout channel while non-null
 * - `searchLayoutHoldKeys` — keep pre-shrink keys mounted for exit animation
 */
export interface MotionState {
  enteringKeys: string[]
  fadeEnteringKeys: string[]
  flashingKeys: string[]
  exitingKeys: string[]
  layoutMotion: Record<string, RowLayoutMotion> | null
  filterLayoutMode: 'collapse' | 'expand' | null
}

export interface TranslationState extends SessionState, MotionState {
  selectedKeys: string[]
  searchQuery: string
  searchScope: SearchScope
  searchRegex: boolean
  /**
   * While a shrink animates, keep these keys mounted so exiting rows can fade
   * out / FLIP. Used by search and missing-filter collapse. Null = live list.
   */
  searchLayoutHoldKeys: string[] | null
  /** Pending folder open: choose which scanned files to load. Null = closed. */
  filePicker: FilePickerState | null
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
    baselineRows: null,
    directoryPath,
    load: initialLoadState,
    missingFilterKeys: null,
    freshKeys: [],
    pendingKeyEdit: null,
    selectedKeys: [],
    searchQuery: '',
    searchScope: 'all',
    searchRegex: false,
    searchLayoutHoldKeys: null,
    filePicker: null,
    enteringKeys: [],
    fadeEnteringKeys: [],
    flashingKeys: [],
    exitingKeys: [],
    layoutMotion: null,
    filterLayoutMode: null,
  }
}
