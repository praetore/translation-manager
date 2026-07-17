import {
  deleteRows as deleteProjectRows,
  moveKeysWithLead,
  remapKeyList,
} from '@/services/keyPaths'
import { withDirtyProject } from '@/store/sessionHelpers'
import type { SessionState } from '@/store/types'

export function applyDeleteRows(state: SessionState, keys: string[]): SessionState {
  if (!state.project || keys.length === 0) {
    return state
  }
  const remove = new Set(keys)
  return {
    ...withDirtyProject(
      state,
      deleteProjectRows(state.project, keys),
      state.missingFilterKeys === null
        ? null
        : state.missingFilterKeys.filter((key) => !remove.has(key)),
      state.freshKeys.filter((key) => !remove.has(key)),
    ),
    pendingKeyEdit:
      state.pendingKeyEdit && remove.has(state.pendingKeyEdit)
        ? null
        : state.pendingKeyEdit,
  }
}

export function applyMoveKeys(
  state: SessionState,
  keys: string[],
  lead: string,
): SessionState {
  if (!state.project || keys.length === 0) {
    return state
  }
  const result = moveKeysWithLead(state.project, keys, lead)
  if (!result || result.project === state.project) {
    return state
  }
  return {
    ...withDirtyProject(
      state,
      result.project,
      state.missingFilterKeys === null
        ? null
        : remapKeyList(state.missingFilterKeys, result.mapping),
      remapKeyList(state.freshKeys, result.mapping),
    ),
    pendingKeyEdit:
      state.pendingKeyEdit === null
        ? null
        : (result.mapping.get(state.pendingKeyEdit) ?? state.pendingKeyEdit),
  }
}
