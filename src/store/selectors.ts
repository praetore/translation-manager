import { pipe } from 'remeda'
import type { TranslationRow } from '@shared/types'
import {
  collectMissingRowKeys,
  renameKey as renameProjectKey,
  type TranslationProject,
} from '@/services/translationProject'
import {
  filterRowsBySearch,
  type SearchOptions,
  type SearchScope,
} from '@/store/searchFilter'
import type { SessionState } from '@/store/types'

function filterByMissingKeys(
  missingFilterKeys: string[] | null,
): (rows: readonly TranslationRow[]) => TranslationRow[] {
  if (missingFilterKeys === null) {
    return (rows) => [...rows]
  }
  const keySet = new Set(missingFilterKeys)
  return (rows) => rows.filter((row) => keySet.has(row.key))
}

export function selectDisplayProject(
  state: Pick<SessionState, 'project' | 'missingFilterKeys'> & {
    searchScope?: SearchScope
    searchRegex?: boolean
  },
  searchQuery = '',
): TranslationProject | null {
  if (!state.project) {
    return null
  }

  const options: SearchOptions = {
    query: searchQuery,
    scope: state.searchScope ?? 'all',
    regex: state.searchRegex ?? false,
  }
  const query = options.query.trim()
  if (state.missingFilterKeys === null && !query) {
    return state.project
  }

  const rows = pipe(
    state.project.rows,
    filterByMissingKeys(state.missingFilterKeys),
    (next) => filterRowsBySearch(next, options),
  )

  return {
    ...state.project,
    rows,
  }
}

export function selectLiveMissingKeys(
  state: Pick<SessionState, 'project' | 'freshKeys'>,
): string[] {
  return state.project ? collectMissingRowKeys(state.project, state.freshKeys) : []
}

/** Peek whether a rename would succeed without mutating. */
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
