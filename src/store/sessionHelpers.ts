/**
 * Dirty-flag helper for session edits.
 *
 * `baselineRows` is the last load/save snapshot. Every mutation that changes
 * rows should go through `withDirtyProject` so `project.dirty` stays derived
 * from a deep row compare — not a sticky boolean that never clears on revert.
 * Load/save in `persistence.ts` refresh `baselineRows` and set dirty false.
 *
 * Edits clear `load.error` but keep `status.keysAndLocales` in sync so the
 * toolbar summary returns when dirty flips back to false (e.g. add then delete).
 */
import {
  translationRowsEqual,
  type TranslationProject,
} from '@/services/translationProject'
import type { LoadState, SessionState, StatusMessage } from '@/store/types'

export function keysAndLocalesStatus(project: TranslationProject): StatusMessage {
  return {
    key: 'status.keysAndLocales',
    params: {
      keys: project.rows.length,
      locales: project.columns.length,
    },
  }
}

/** Drop load errors; keep / refresh the project summary badge. */
export function clearMessages(
  load: LoadState,
  project: TranslationProject,
): LoadState {
  return { ...load, error: null, status: keysAndLocalesStatus(project) }
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
    load: clearMessages(state.load, project),
  }
}
