import { describe, expect, it } from 'vitest'
import type { TranslationRow } from '@shared/types'
import {
  filterRowsBySearch,
  isValidSearchRegex,
  rowMatchesSearch,
} from '@/store/searchFilter'

const rows: TranslationRow[] = [
  { key: 'auth.login', values: { en: 'Log in', nl: 'Inloggen' } },
  { key: 'auth.logout', values: { en: 'Log out', nl: 'Uitloggen' } },
  { key: 'home.title', values: { en: 'Welcome', nl: 'Welkom' } },
]

describe('searchFilter', () => {
  it('matches all fields by default', () => {
    expect(
      filterRowsBySearch(rows, { query: 'log', scope: 'all', regex: false }).map(
        (row) => row.key,
      ),
    ).toEqual(['auth.login', 'auth.logout'])
    expect(
      filterRowsBySearch(rows, {
        query: 'welkom',
        scope: 'all',
        regex: false,
      }).map((row) => row.key),
    ).toEqual(['home.title'])
  })

  it('limits matches to keys or text', () => {
    expect(
      filterRowsBySearch(rows, {
        query: 'log',
        scope: 'keys',
        regex: false,
      }).map((row) => row.key),
    ).toEqual(['auth.login', 'auth.logout'])
    expect(
      filterRowsBySearch(rows, {
        query: 'Welcome',
        scope: 'keys',
        regex: false,
      }),
    ).toEqual([])
    expect(
      filterRowsBySearch(rows, {
        query: 'Welcome',
        scope: 'text',
        regex: false,
      }).map((row) => row.key),
    ).toEqual(['home.title'])
  })

  it('supports regex and rejects invalid patterns', () => {
    expect(
      filterRowsBySearch(rows, {
        query: '^auth\\.',
        scope: 'keys',
        regex: true,
      }).map((row) => row.key),
    ).toEqual(['auth.login', 'auth.logout'])
    expect(isValidSearchRegex('(')).toBe(false)
    expect(
      rowMatchesSearch(rows[0]!, {
        query: '(',
        scope: 'all',
        regex: true,
      }),
    ).toBe(false)
  })
})
