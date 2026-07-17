/** Plan FLIP transition between two ordered key lists. */
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

/** @deprecated Prefer planKeyListTransition; kept for missing-filter call sites. */
export function planFilterCollapse(
  rows: readonly { key: string }[],
  missingKeys: readonly string[],
  rowHeight: number,
) {
  const fromKeys = rows.map((row) => row.key)
  const plan = planKeyListTransition(fromKeys, missingKeys, rowHeight)
  if (plan.type !== 'collapse') {
    return {
      hiding: [] as string[],
      remaining: [] as { key: string; fromTop: number }[],
      missingKeys: [...missingKeys],
    }
  }
  return {
    hiding: plan.hiding,
    remaining: plan.remaining,
    missingKeys: [...missingKeys],
  }
}

/** @deprecated Prefer planKeyListTransition; kept for missing-filter call sites. */
export function planFilterExpand(
  rows: readonly { key: string }[],
  visibleKeys: readonly string[],
  rowHeight: number,
) {
  const toKeys = rows.map((row) => row.key)
  const plan = planKeyListTransition(visibleKeys, toKeys, rowHeight)
  if (plan.type !== 'expand') {
    return {
      appearing: [] as string[],
      expanding: [] as { key: string; fromTop: number; toTop: number }[],
    }
  }
  return {
    appearing: plan.appearing,
    expanding: plan.expanding,
  }
}
