import {
  translationRowsEqual,
  type TranslationProject,
} from '@/services/translationProject'
import type { LoadState, SessionState } from '@/store/types'

export function clearMessages(load: LoadState): LoadState {
  if (!load.status && !load.error) {
    return load
  }
  return { ...load, status: null, error: null }
}

export function withDirtyProject<T extends SessionState>(
  state: T,
  project: TranslationProject,
  missingFilterKeys: string[] | null = state.missingFilterKeys,
  freshKeys: string[] = state.freshKeys,
): T {
  const dirty =
    state.baselineRows === null
      ? true
      : !translationRowsEqual(project.rows, state.baselineRows)

  return {
    ...state,
    project: { ...project, dirty },
    missingFilterKeys,
    freshKeys,
    load: clearMessages(state.load),
  }
}
