import { map, partition, pipe } from 'remeda'

export type CollapsePlan = {
  hiding: string[]
  remaining: { key: string; fromTop: number }[]
  missingKeys: string[]
}

export type ExpandPlan = {
  appearing: string[]
  expanding: { key: string; fromTop: number; toTop: number }[]
}

/** Partition rows into fade-out vs FLIP-compact targets for missing-filter on. */
export function planFilterCollapse(
  rows: readonly { key: string }[],
  missingKeys: readonly string[],
  rowHeight: number,
): CollapsePlan {
  const missingSet = new Set(missingKeys)
  return pipe(
    rows,
    map((row, index) => ({ key: row.key, fromTop: index * rowHeight })),
    partition((row) => missingSet.has(row.key)),
    ([remaining, hiding]) => ({
      remaining,
      hiding: map(hiding, (row) => row.key),
      missingKeys: [...missingKeys],
    }),
  )
}

/** Partition rows into fade-in vs FLIP-expand targets for missing-filter off. */
export function planFilterExpand(
  rows: readonly { key: string }[],
  visibleKeys: readonly string[],
  rowHeight: number,
): ExpandPlan {
  const visibleSet = new Set(visibleKeys)
  const compactIndex = new Map(visibleKeys.map((key, index) => [key, index]))

  return pipe(
    rows,
    map((row, index) => ({
      key: row.key,
      toTop: index * rowHeight,
      fromTop: (compactIndex.get(row.key) ?? 0) * rowHeight,
      visible: visibleSet.has(row.key),
    })),
    partition((row) => row.visible),
    ([expanding, appearing]) => ({
      expanding: map(expanding, ({ key, fromTop, toTop }) => ({
        key,
        fromTop,
        toTop,
      })),
      appearing: map(appearing, (row) => row.key),
    }),
  )
}
