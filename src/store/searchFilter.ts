import { filter, values } from 'remeda'
import type { TranslationRow } from '@shared/types'

export type SearchScope = 'all' | 'keys' | 'text'

export type SearchOptions = {
  query: string
  scope: SearchScope
  regex: boolean
}

export function compileSearchMatcher(
  options: SearchOptions,
): ((text: string) => boolean) | null {
  const raw = options.query.trim()
  if (!raw) {
    return null
  }

  if (options.regex) {
    try {
      const pattern = new RegExp(raw, 'i')
      return (text) => pattern.test(text)
    } catch {
      return () => false
    }
  }

  const needle = raw.toLowerCase()
  return (text) => text.toLowerCase().includes(needle)
}

export function isValidSearchRegex(query: string): boolean {
  const raw = query.trim()
  if (!raw) {
    return true
  }
  try {
    void new RegExp(raw, 'i')
    return true
  } catch {
    return false
  }
}

export function rowMatchesSearch(
  row: TranslationRow,
  options: SearchOptions,
): boolean {
  const match = compileSearchMatcher(options)
  if (!match) {
    return true
  }

  const keyHit = match(row.key)
  const textHit = values(row.values).some((value) => match(value))

  if (options.scope === 'keys') {
    return keyHit
  }
  if (options.scope === 'text') {
    return textHit
  }
  return keyHit || textHit
}

export function filterRowsBySearch(
  rows: readonly TranslationRow[],
  options: SearchOptions,
): TranslationRow[] {
  if (!options.query.trim()) {
    return [...rows]
  }
  return filter(rows, (row) => rowMatchesSearch(row, options))
}
