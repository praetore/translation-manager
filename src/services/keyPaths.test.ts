import { describe, expect, it } from 'vitest'
import {
  applyKeyLead,
  deleteRows,
  keyLeaf,
  keysInIndexRange,
  moveKeysWithLead,
} from '@/services/keyPaths'
import type { TranslationProject } from '@/services/translationProject'

function makeProject(rows: TranslationProject['rows']): TranslationProject {
  return {
    directoryPath: '/locales',
    columns: [
      {
        locale: 'en',
        fileName: 'en.json',
        filePath: '/locales/en.json',
        format: 'json',
      },
    ],
    rows,
    sourceLocale: 'en',
    dirty: false,
  }
}

describe('keyPaths', () => {
  it('extracts the leaf and applies a lead', () => {
    expect(keyLeaf('auth.login.button')).toBe('button')
    expect(keyLeaf('solo')).toBe('solo')
    expect(applyKeyLead('auth.login.button', 'ui.cta')).toBe('ui.cta.button')
    expect(applyKeyLead('solo', 'ui')).toBe('ui.solo')
    expect(applyKeyLead('auth.login.button', '')).toBe('button')
  })

  it('moves selected keys with a new lead', () => {
    const project = makeProject([
      { key: 'auth.login.title', values: { en: 'A' } },
      { key: 'auth.login.button', values: { en: 'B' } },
      { key: 'other', values: { en: 'C' } },
    ])
    const result = moveKeysWithLead(project, ['auth.login.title', 'auth.login.button'], 'ui')
    expect(result?.project.rows.map((row) => row.key)).toEqual([
      'ui.title',
      'ui.button',
      'other',
    ])
    expect(result?.project.dirty).toBe(true)
  })

  it('rejects colliding move targets', () => {
    const project = makeProject([
      { key: 'auth.a', values: { en: 'A' } },
      { key: 'ui.a', values: { en: 'B' } },
    ])
    expect(moveKeysWithLead(project, ['auth.a'], 'ui')).toBeNull()
  })

  it('deletes multiple rows', () => {
    const project = makeProject([
      { key: 'a', values: { en: 'A' } },
      { key: 'b', values: { en: 'B' } },
      { key: 'c', values: { en: 'C' } },
    ])
    expect(deleteRows(project, ['a', 'c']).rows.map((row) => row.key)).toEqual(['b'])
  })

  it('selects keys in an index range', () => {
    expect(keysInIndexRange(['a', 'b', 'c', 'd'], 1, 3)).toEqual(['b', 'c', 'd'])
    expect(keysInIndexRange(['a', 'b', 'c'], 2, 0)).toEqual(['a', 'b', 'c'])
  })
})
