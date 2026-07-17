import type { KeyListTransitionMode } from '@/store/motionActions'
import type { SearchScope } from '@/store/searchFilter'
import type { TranslationState } from '@/store/types'

export type TransitionDisplayKeysOptions = {
  trackFilterMode?: boolean
  holdOnCollapse?: boolean
  slideEnterKeys?: readonly string[]
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
   * Returns the motion mode that was started.
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
  clearMotion: () => void
  browseDirectory: () => Promise<void>
  loadDirectory: (pathOverride?: string) => Promise<void>
  openProject: () => Promise<void>
  saveProject: () => Promise<void>
}
