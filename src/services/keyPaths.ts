import type { TranslationProject } from '@/services/translationProject'

/** Rightmost segment after the final `.` (or the whole key if none). */
export function keyLeaf(key: string): string {
  const index = key.lastIndexOf('.')
  return index === -1 ? key : key.slice(index + 1)
}

/** Replace the lead (everything before the leaf) with `lead`. */
export function applyKeyLead(key: string, lead: string): string {
  const leaf = keyLeaf(key)
  const trimmed = lead.trim().replace(/^\.+|\.+$/g, '')
  return trimmed ? `${trimmed}.${leaf}` : leaf
}

export function buildLeadMoveMapping(
  keys: readonly string[],
  lead: string,
): Map<string, string> | null {
  if (keys.length === 0) {
    return new Map()
  }

  const mapping = new Map<string, string>()
  const targets = new Set<string>()

  for (const key of keys) {
    const nextKey = applyKeyLead(key, lead)
    if (!nextKey || targets.has(nextKey)) {
      return null
    }
    mapping.set(key, nextKey)
    targets.add(nextKey)
  }

  return mapping
}

/**
 * Re-prefix selected keys, keeping each leaf. Returns null when the lead would
 * create empty or colliding keys (among selection or with other rows).
 */
export function moveKeysWithLead(
  project: TranslationProject,
  keys: readonly string[],
  lead: string,
): { project: TranslationProject; mapping: Map<string, string> } | null {
  const mapping = buildLeadMoveMapping(keys, lead)
  if (!mapping) {
    return null
  }

  const selected = new Set(keys)
  const occupied = new Set(
    project.rows.filter((row) => !selected.has(row.key)).map((row) => row.key),
  )

  for (const nextKey of mapping.values()) {
    if (occupied.has(nextKey)) {
      return null
    }
  }

  let changed = false
  const rows = project.rows.map((row) => {
    const nextKey = mapping.get(row.key)
    if (!nextKey || nextKey === row.key) {
      return row
    }
    changed = true
    return { ...row, key: nextKey }
  })

  if (!changed) {
    return { project, mapping }
  }

  return { project: { ...project, dirty: true, rows }, mapping }
}

export function deleteRows(
  project: TranslationProject,
  keys: readonly string[],
): TranslationProject {
  if (keys.length === 0) {
    return project
  }
  const remove = new Set(keys)
  return {
    ...project,
    dirty: true,
    rows: project.rows.filter((row) => !remove.has(row.key)),
  }
}

export function keysInIndexRange(
  orderedKeys: readonly string[],
  fromIndex: number,
  toIndex: number,
): string[] {
  if (orderedKeys.length === 0) {
    return []
  }
  const start = Math.max(0, Math.min(fromIndex, toIndex))
  const end = Math.min(orderedKeys.length - 1, Math.max(fromIndex, toIndex))
  return orderedKeys.slice(start, end + 1)
}

export function remapKeyList(
  keys: readonly string[],
  mapping: ReadonlyMap<string, string>,
): string[] {
  return keys.map((key) => mapping.get(key) ?? key)
}
