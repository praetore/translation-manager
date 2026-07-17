import {
  collectMissingRowKeys,
  renameKey as renameProjectKey,
  type TranslationProject,
} from '@/services/translationProject'
import type { SessionState } from '@/store/types'

export function selectDisplayProject(
  state: Pick<SessionState, 'project' | 'missingFilterKeys'>,
  searchQuery = '',
): TranslationProject | null {
  if (!state.project) {
    return null
  }

  let rows = state.project.rows
  if (state.missingFilterKeys !== null) {
    const keySet = new Set(state.missingFilterKeys)
    rows = rows.filter((row) => keySet.has(row.key))
  }

  const query = searchQuery.trim().toLowerCase()
  if (query) {
    rows = rows.filter(
      (row) =>
        row.key.toLowerCase().includes(query) ||
        Object.values(row.values).some((value) =>
          value.toLowerCase().includes(query),
        ),
    )
  }

  if (rows === state.project.rows) {
    return state.project
  }

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
