/**
 * Pure session reducers for delete / move / rename.
 * Applies the project change and remaps `KeyLists` in one step so the store
 * actions stay thin wrappers.
 */
import {
  deleteRows as deleteProjectRows,
  moveKeysWithLead,
} from '@/services/keyPaths'
import {
  renameKey as renameProjectKey,
  type TranslationProject,
} from '@/services/translationProject'
import {
  pickKeyLists,
  remapKeysInLists,
  removeKeysFromLists,
  renameKeyInLists,
  type KeyLists,
} from '@/store/keyLists'
import { withDirtyProject } from '@/store/sessionHelpers'
import type { SessionState } from '@/store/types'

/** Session document + selection lists updated by bulk/row edits. */
export type SessionEditorState = SessionState & KeyLists

function withProjectAndLists(
  state: SessionEditorState,
  project: TranslationProject,
  lists: KeyLists,
): SessionEditorState {
  return {
    ...withDirtyProject(state, project, lists.missingFilterKeys, lists.freshKeys),
    selectedKeys: lists.selectedKeys,
    pendingKeyEdit: lists.pendingKeyEdit,
  }
}

export function applyDeleteRows(
  state: SessionEditorState,
  keys: string[],
): SessionEditorState {
  if (!state.project || keys.length === 0) {
    return state
  }
  return withProjectAndLists(
    state,
    deleteProjectRows(state.project, keys),
    removeKeysFromLists(pickKeyLists(state), keys),
  )
}

export function applyMoveKeys(
  state: SessionEditorState,
  keys: string[],
  lead: string,
): SessionEditorState {
  if (!state.project || keys.length === 0) {
    return state
  }
  const result = moveKeysWithLead(state.project, keys, lead)
  if (!result || result.project === state.project) {
    return state
  }
  return withProjectAndLists(
    state,
    result.project,
    remapKeysInLists(pickKeyLists(state), result.mapping),
  )
}

export function applyRenameKey(
  state: SessionEditorState,
  oldKey: string,
  newKey: string,
): SessionEditorState {
  if (!state.project) {
    return state
  }
  const next = renameProjectKey(state.project, oldKey, newKey)
  if (!next || next === state.project) {
    return state
  }
  const trimmed = newKey.trim()
  return withProjectAndLists(
    state,
    next,
    renameKeyInLists(pickKeyLists(state), oldKey, trimmed),
  )
}
