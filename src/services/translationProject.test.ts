import { describe, expect, it } from 'vitest'
import type { TranslationProject } from '@/services/translationProject'
import {
  addRow,
  collectMissingRowKeys,
  deleteRow,
  isMissingAgainstSource,
  renameKey,
  rowHasMissingTranslation,
  updateCell,
} from '@/services/translationProject'

function makeProject(
  overrides?: Partial<TranslationProject>,
): TranslationProject {
  return {
    directoryPath: 'C:/project/locales',
    columns: [
      {
        locale: 'en',
        fileName: 'en.json',
        filePath: 'C:/project/locales/en.json',
        format: 'json',
      },
      {
        locale: 'nl',
        fileName: 'nl.json',
        filePath: 'C:/project/locales/nl.json',
        format: 'json',
      },
    ],
    rows: [
      { key: 'greeting', values: { en: 'Hello', nl: 'Hallo' } },
      { key: 'farewell', values: { en: 'Bye', nl: '' } },
    ],
    sourceLocale: 'en',
    dirty: false,
    ...overrides,
  }
}

describe('isMissingAgainstSource', () => {
  it('marks empty target when source has a value', () => {
    const row = { key: 'farewell', values: { en: 'Bye', nl: '' } }
    expect(isMissingAgainstSource(row, 'nl', 'en')).toBe(true)
    expect(isMissingAgainstSource(row, 'en', 'en')).toBe(false)
  })

  it('marks empty source as missing', () => {
    const row = { key: 'new.key', values: { en: '', nl: '' } }
    expect(isMissingAgainstSource(row, 'en', 'en')).toBe(true)
  })

  it('ignores fresh keys', () => {
    const row = { key: 'new.key', values: { en: '', nl: '' } }
    expect(isMissingAgainstSource(row, 'en', 'en', new Set(['new.key']))).toBe(
      false,
    )
  })
})

describe('collectMissingRowKeys', () => {
  it('collects rows with missing translations', () => {
    const project = makeProject()
    expect(collectMissingRowKeys(project)).toEqual(['farewell'])
  })

  it('excludes fresh keys from the missing list', () => {
    const project = makeProject({
      rows: [
        { key: 'new.key', values: { en: '', nl: '' } },
        { key: 'farewell', values: { en: 'Bye', nl: '' } },
      ],
    })
    expect(collectMissingRowKeys(project, ['new.key'])).toEqual(['farewell'])
  })
})

describe('row mutations', () => {
  it('updates a cell and marks the project dirty', () => {
    const project = makeProject()
    const next = updateCell(project, 'farewell', 'nl', 'Doei')
    expect(next.dirty).toBe(true)
    expect(next.rows.find((row) => row.key === 'farewell')?.values.nl).toBe(
      'Doei',
    )
    expect(project.dirty).toBe(false)
  })

  it('adds a unique empty row at the top', () => {
    const project = makeProject({
      rows: [{ key: 'new.key', values: { en: 'x', nl: 'y' } }],
    })
    const next = addRow(project)
    expect(next.rows[0]?.key).toBe('new.key.2')
    expect(next.rows[0]?.values).toEqual({ en: '', nl: '' })
    expect(next.dirty).toBe(true)
  })

  it('deletes a row by key', () => {
    const next = deleteRow(makeProject(), 'greeting')
    expect(next.rows.map((row) => row.key)).toEqual(['farewell'])
  })

  it('renames a key or rejects duplicates and empty names', () => {
    const project = makeProject()
    expect(renameKey(project, 'greeting', 'hello')?.rows[0]?.key).toBe('hello')
    expect(renameKey(project, 'greeting', 'farewell')).toBeNull()
    expect(renameKey(project, 'greeting', '   ')).toBeNull()
    expect(renameKey(project, 'greeting', 'greeting')).toBe(project)
  })
})

describe('rowHasMissingTranslation', () => {
  it('detects missing targets across locales', () => {
    const row = { key: 'farewell', values: { en: 'Bye', nl: '' } }
    expect(rowHasMissingTranslation(row, ['en', 'nl'], 'en')).toBe(true)
    expect(
      rowHasMissingTranslation(
        { key: 'ok', values: { en: 'A', nl: 'B' } },
        ['en', 'nl'],
        'en',
      ),
    ).toBe(false)
  })
})
