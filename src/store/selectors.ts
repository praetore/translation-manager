import { filter, pipe, values } from 'remeda'
import type { TranslationRow } from '@shared/types'
import {
  collectMissingRowKeys,
  renameKey as renameProjectKey,
  type TranslationProject,
} from '@/services/translationProject'
import type { SessionState } from '@/store/types'

function filterByMissingKeys(
  missingFilterKeys: string[] | null,
): (rows: readonly TranslationRow[]) => TranslationRow[] {
  if (missingFilterKeys === null) {
    return (rows) => [...rows]
  }
  const keySet = new Set(missingFilterKeys)
  return (rows) => filter(rows, (row) => keySet.has(row.key))
}

function filterBySearch(
  query: string,
): (rows: readonly TranslationRow[]) => TranslationRow[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return (rows) => [...rows]
  }
  return (rows) =>
    filter(
      rows,
      (row) =>
        row.key.toLowerCase().includes(normalized) ||
        values(row.values).some((value) =>
          value.toLowerCase().includes(normalized),
        ),
    )
}

export function selectDisplayProject(
  state: Pick<SessionState, 'project' | 'missingFilterKeys'>,
  searchQuery = '',
): TranslationProject | null {
  if (!state.project) {
    return null
  }

  const query = searchQuery.trim()
  if (state.missingFilterKeys === null && !query) {
    return state.project
  }

  const rows = pipe(
    state.project.rows,
    filterByMissingKeys(state.missingFilterKeys),
    filterBySearch(query),
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
