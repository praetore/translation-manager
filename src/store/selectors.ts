/**
 * Pure projections over session state.
 *
 * Display pipeline (order matters):
 * 1. Start from `project.rows`
 * 2. If `missingFilterKeys !== null`, keep only that snapshot (stable until toggle off)
 * 3. Apply search (scope + optional regex)
 *
 * `selectLiveMissingKeys` ignores the snapshot — used for the Missing (N) badge.
 * Stripe highlighting uses `isMissingAgainstSource` on each cell (see translationProject).
 */
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

/** Filtered project for the grid (missing snapshot + search). */
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

/** Keys that currently need translations (badge count), excluding fresh rows. */
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
