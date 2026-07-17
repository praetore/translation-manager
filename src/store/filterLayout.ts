/**
 * Pure planner: ordered key list A → B becomes collapse, expand, or none.
 * Does not touch store state — `motionActions` / `transitionDisplayKeys` apply it.
 *
 * - Collapse: subset shrink (hiding keys leave; remaining FLIP upward).
 * - Expand: keys appear and/or remaining rows shift (includes mixed add+remove
 *   cases — treated as expand so appearing keys can fade/slide in).
 */
export function planKeyListTransition(
  fromKeys: readonly string[],
  toKeys: readonly string[],
  rowHeight: number,
):
  | { type: 'none' }
  | { type: 'collapse'; hiding: string[]; remaining: { key: string; fromTop: number }[] }
  | {
      type: 'expand'
      appearing: string[]
      expanding: { key: string; fromTop: number; toTop: number }[]
    } {
  if (
    fromKeys.length === toKeys.length &&
    fromKeys.every((key, index) => key === toKeys[index])
  ) {
    return { type: 'none' }
  }

  const fromSet = new Set(fromKeys)
  const toSet = new Set(toKeys)
  const fromIndex = new Map(fromKeys.map((key, index) => [key, index]))
  const toIndex = new Map(toKeys.map((key, index) => [key, index]))
  const hiding = fromKeys.filter((key) => !toSet.has(key))
  const appearing = toKeys.filter((key) => !fromSet.has(key))

  if (appearing.length === 0 && hiding.length > 0) {
    return {
      type: 'collapse',
      hiding,
      remaining: toKeys.map((key) => ({
        key,
        fromTop: (fromIndex.get(key) ?? 0) * rowHeight,
      })),
    }
  }

  return {
    type: 'expand',
    appearing,
    expanding: toKeys
      .filter((key) => fromSet.has(key))
      .map((key) => ({
        key,
        fromTop: (fromIndex.get(key) ?? 0) * rowHeight,
        toTop: (toIndex.get(key) ?? 0) * rowHeight,
      })),
  }
}
