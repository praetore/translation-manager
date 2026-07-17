/**
 * Lead-template DSL for Move keys (re-prefix path, keep leaf).
 *
 * For key `auth.login.email` → leaf `email`, lead segments `['auth','login']`.
 *
 * | Token | Meaning | Example template → result |
 * | --- | --- | --- |
 * | `$$` | Full lead path | `app.$$` → `app.auth.login.email` |
 * | `$1`, `$2`, … | Segment from left (1-based) | `$1.forms` → `auth.forms.email` |
 * | `$-1`, `$-2`, … | Segment from right | `ui.$-1` → `ui.login.email` |
 * | `\$` | Literal `$` | `prices.\$` → `prices.$.email` |
 *
 * Invalid: `$0`, out-of-range `$n`, bare `$`, or templates that collide within
 * the selection or with other project keys (`moveKeysWithLead` → null).
 * UI copy lives in `MoveKeysDialog`; keep this table in sync when tokens change.
 */
import type { TranslationProject } from '@/services/translationProject'

/** Sentinel while expanding so literal `$` from `\$` is not re-parsed as a token. */
const LITERAL_DOLLAR = '\u0000'

/** Rightmost segment after the final `.` (or the whole key if none). */
export function keyLeaf(key: string): string {
  const index = key.lastIndexOf('.')
  return index === -1 ? key : key.slice(index + 1)
}

/** Mutable path segments (everything before the leaf). */
export function keyLeadSegments(key: string): string[] {
  const index = key.lastIndexOf('.')
  if (index === -1) {
    return []
  }
  return key.slice(0, index).split('.').filter((part) => part.length > 0)
}

/**
 * Returns false when the template has invalid `$` tokens for any key
 * (out of range, `$0`, unknown `$…`, or bare unescaped `$`).
 */
export function validateLeadTemplate(
  template: string,
  keys: readonly string[],
): boolean {
  const masked = template.replaceAll('\\$', LITERAL_DOLLAR)
  // Strip valid tokens, then any remaining `$` is invalid.
  let rest = masked.replaceAll('$$', '')
  rest = rest.replace(/\$-(\d+)/g, (match, digits: string) => {
    const n = Number(digits)
    if (n < 1 || keys.length === 0) {
      return match
    }
    for (const key of keys) {
      if (n > keyLeadSegments(key).length) {
        return match
      }
    }
    return ''
  })
  rest = rest.replace(/\$(\d+)/g, (match, digits: string) => {
    const n = Number(digits)
    if (n < 1 || keys.length === 0) {
      return match
    }
    for (const key of keys) {
      if (n > keyLeadSegments(key).length) {
        return match
      }
    }
    return ''
  })
  return !rest.includes('$')
}

/**
 * True when the template ends in an unfinished `$` token (`$`, `$-`),
 * e.g. while typing `app.$$` or `app.$1`. Complete tokens and `\$` do not count.
 */
export function hasIncompleteDollarToken(template: string): boolean {
  let rest = template.replaceAll('\\$', LITERAL_DOLLAR)
  rest = rest.replaceAll('$$', '')
  rest = rest.replace(/\$-(\d+)/g, '')
  rest = rest.replace(/\$(\d+)/g, '')
  return /\$-?$/.test(rest)
}

/** Expand `$$` / `$n` / `$-n` and `\$` for one key. Throws if template is invalid. */
export function expandLeadTemplate(key: string, template: string): string {
  if (!validateLeadTemplate(template, [key])) {
    throw new Error('Invalid lead template')
  }
  const segments = keyLeadSegments(key)
  let result = template.replaceAll('\\$', LITERAL_DOLLAR)
  result = result.replaceAll('$$', segments.join('.'))
  result = result.replace(/\$-(\d+)/g, (_match, digits: string) => {
    const n = Number(digits)
    return segments[segments.length - n] ?? ''
  })
  result = result.replace(/\$(\d+)/g, (_match, digits: string) => {
    const n = Number(digits)
    return segments[n - 1] ?? ''
  })
  return result.replaceAll(LITERAL_DOLLAR, '$')
}

/** Replace the lead (everything before the leaf) with `lead` (supports tokens). */
export function applyKeyLead(key: string, lead: string): string {
  const expanded = expandLeadTemplate(key, lead)
  const leaf = keyLeaf(key)
  const trimmed = expanded.trim().replace(/^\.+|\.+$/g, '')
  return trimmed ? `${trimmed}.${leaf}` : leaf
}

export function buildLeadMoveMapping(
  keys: readonly string[],
  lead: string,
): Map<string, string> | null {
  if (keys.length === 0) {
    return new Map()
  }
  if (!validateLeadTemplate(lead, keys)) {
    return null
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
 * create empty or colliding keys (among selection or with other rows), or when
 * the lead template is invalid.
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
