import { difference, evolve, isIncludedIn, map, pipe, unique } from 'remeda'

/** Session key-tracking fields updated together on delete / rename / move. */
export type KeyLists = {
  selectedKeys: string[]
  freshKeys: string[]
  missingFilterKeys: string[] | null
  pendingKeyEdit: string | null
}

export function pickKeyLists(state: KeyLists): KeyLists {
  return {
    selectedKeys: state.selectedKeys,
    freshKeys: state.freshKeys,
    missingFilterKeys: state.missingFilterKeys,
    pendingKeyEdit: state.pendingKeyEdit,
  }
}

function remapList(
  keys: readonly string[],
  mapping: ReadonlyMap<string, string>,
): string[] {
  return map(keys, (key) => mapping.get(key) ?? key)
}

/** Drop keys from every list field (and clear pending if removed). */
export function removeKeysFromLists(
  lists: KeyLists,
  keys: readonly string[],
): KeyLists {
  if (keys.length === 0) {
    return lists
  }
  return pipe(
    lists,
    evolve({
      selectedKeys: difference(keys),
      freshKeys: difference(keys),
      missingFilterKeys: (value) =>
        value === null ? null : difference(value, keys),
      pendingKeyEdit: (key) =>
        key !== null && isIncludedIn(key, keys) ? null : key,
    }),
  )
}

/** Remap keys after move / rename (Map old → new). */
export function remapKeysInLists(
  lists: KeyLists,
  mapping: ReadonlyMap<string, string>,
): KeyLists {
  if (mapping.size === 0) {
    return lists
  }
  return pipe(
    lists,
    evolve({
      selectedKeys: (keys) => remapList(keys, mapping),
      freshKeys: (keys) => remapList(keys, mapping),
      missingFilterKeys: (value) =>
        value === null ? null : remapList(value, mapping),
      pendingKeyEdit: (key) =>
        key === null ? null : (mapping.get(key) ?? key),
    }),
  )
}

export function renameKeyInLists(
  lists: KeyLists,
  oldKey: string,
  newKey: string,
): KeyLists {
  if (oldKey === newKey) {
    return lists
  }
  const remapped = remapKeysInLists(lists, new Map([[oldKey, newKey]]))
  // Renaming ends key-edit mode for the row that was being edited.
  return {
    ...remapped,
    pendingKeyEdit:
      lists.pendingKeyEdit === oldKey ? null : remapped.pendingKeyEdit,
  }
}

/** Clear fresh + pending tracking when focus leaves a row. */
export function leaveKeyInLists(lists: KeyLists, key: string): KeyLists {
  if (!isIncludedIn(key, lists.freshKeys) && lists.pendingKeyEdit !== key) {
    return lists
  }
  return pipe(
    lists,
    evolve({
      freshKeys: difference([key]),
      pendingKeyEdit: (pending) => (pending === key ? null : pending),
    }),
  )
}

export function mergeUniqueKeys(
  existing: readonly string[],
  next: readonly string[],
): string[] {
  return unique([...existing, ...next])
}
