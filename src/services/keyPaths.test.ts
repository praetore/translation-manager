import { describe, expect, it } from 'vitest'
import {
  applyKeyLead,
  deleteRows,
  keyLeaf,
  keyLeadSegments,
  keysInIndexRange,
  moveKeysWithLead,
  validateLeadTemplate,
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
    expect(keyLeadSegments('auth.login.button')).toEqual(['auth', 'login'])
    expect(keyLeadSegments('solo')).toEqual([])
    expect(applyKeyLead('auth.login.button', 'ui.cta')).toBe('ui.cta.button')
    expect(applyKeyLead('solo', 'ui')).toBe('ui.solo')
    expect(applyKeyLead('auth.login.button', '')).toBe('button')
  })

  it('expands path tokens in the lead', () => {
    const key = 'auth.login.button'
    expect(applyKeyLead(key, '$$')).toBe('auth.login.button')
    expect(applyKeyLead(key, 'app.$$')).toBe('app.auth.login.button')
    expect(applyKeyLead(key, '$1')).toBe('auth.button')
    expect(applyKeyLead(key, '$2')).toBe('login.button')
    expect(applyKeyLead(key, '$-1')).toBe('login.button')
    expect(applyKeyLead(key, '$-2')).toBe('auth.button')
    expect(applyKeyLead(key, 'ui.$1')).toBe('ui.auth.button')
    expect(applyKeyLead(key, 'price.\\$')).toBe('price.$.button')
  })

  it('validates lead placeholders against selected keys', () => {
    const keys = ['auth.login.button', 'auth.signup.button']
    expect(validateLeadTemplate('app.$$', keys)).toBe(true)
    expect(validateLeadTemplate('$1.$2', keys)).toBe(true)
    expect(validateLeadTemplate('$9', keys)).toBe(false)
    expect(validateLeadTemplate('$0', keys)).toBe(false)
    expect(validateLeadTemplate('$foo', keys)).toBe(false)
    expect(validateLeadTemplate('price.$', keys)).toBe(false)
    expect(validateLeadTemplate('price.\\$', keys)).toBe(true)
    expect(validateLeadTemplate('$2', ['solo'])).toBe(false)
    expect(validateLeadTemplate('$2', ['a.b.c', 'x.y'])).toBe(false)
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

  it('moves with token leads and rejects invalid templates', () => {
    const project = makeProject([
      { key: 'auth.login.title', values: { en: 'A' } },
      { key: 'auth.login.button', values: { en: 'B' } },
    ])
    const moved = moveKeysWithLead(
      project,
      ['auth.login.title', 'auth.login.button'],
      'app.$$',
    )
    expect(moved?.project.rows.map((row) => row.key)).toEqual([
      'app.auth.login.title',
      'app.auth.login.button',
    ])
    expect(moveKeysWithLead(project, ['auth.login.title'], '$9')).toBeNull()
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
