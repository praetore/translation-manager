import type { KeyListTransitionMode } from '@/store/motionActions'
import type { SearchScope } from '@/store/searchFilter'
import type { TranslationState } from '@/store/types'

/**
 * Options for {@link TranslationStore.transitionDisplayKeys}.
 *
 * ## Callers
 * | Caller | Options |
 * | --- | --- |
 * | Search (`useTranslationStore`) | `holdOnCollapse` |
 * | Missing filter on | `trackFilterMode`, `holdOnCollapse` |
 * | Missing filter off | `trackFilterMode` |
 * | Add row | `slideEnterKeys` |
 * | Delete / delete-selected | `onDone` (commit after exit) |
 *
 * ## Ownership
 * - Missing filter owns the FLIP layout channel while `filterLayoutMode !== null`.
 *   Non-filter callers (`trackFilterMode` unset/false) return `'none'` and must
 *   not fight that animation (add-row still slide-enters via `animateEnter`).
 * - `holdOnCollapse` mounts `searchLayoutHoldKeys` for the duration of a shrink
 *   so exiting rows stay in the DOM until FLIP finishes.
 * - Collapse: `onDone` runs after the exit/FLIP duration.
 * - Expand: `onDone` runs immediately (enter animations are fire-and-forget).
 */
export type TransitionDisplayKeysOptions = {
  /** Set by missing-filter so toolbar/stripe can follow collapse vs expand. */
  trackFilterMode?: boolean
  /** Keep pre-collapse keys mounted until the shrink animation ends. */
  holdOnCollapse?: boolean
  /** Appearing keys that slide in (add row) instead of fading in. */
  slideEnterKeys?: readonly string[]
  /** After collapse animation, or immediately on expand/`'none'`. */
  onDone?: () => void
}

export type TranslationStore = TranslationState & {
  setDirectoryPath: (path: string) => void
  setSearchQuery: (value: string) => void
  clearSearch: () => void
  setSearchScope: (scope: SearchScope) => void
  setSearchRegex: (enabled: boolean) => void
  /**
   * Shared row-list FLIP/fade for search, filter, add, and delete.
   * Returns the motion mode that was started (`'none'` if skipped or no-op).
   *
   * @see TransitionDisplayKeysOptions for caller contracts and ownership.
   */
  transitionDisplayKeys: (
    fromKeys: string[],
    toKeys: string[],
    options?: TransitionDisplayKeysOptions,
  ) => KeyListTransitionMode
  selectKeys: (keys: string[]) => void
  clearSelection: () => void
  removeFromSelection: (key: string) => void
  editCell: (key: string, locale: string, value: string) => void
  addRow: () => void
  deleteRow: (key: string) => void
  deleteSelectedRows: () => void
  renameKey: (oldKey: string, newKey: string) => boolean
  moveSelectedKeys: (lead: string) => boolean
  leaveFreshKey: (key: string) => void
  clearPendingKeyEdit: () => void
  toggleMissingFilter: () => void
  /** Cancel timers and clear all motion + search-hold fields. */
  clearMotion: () => void
  browseDirectory: () => Promise<void>
  loadDirectory: (pathOverride?: string) => Promise<void>
  openProject: () => Promise<void>
  saveProject: () => Promise<void>
}
