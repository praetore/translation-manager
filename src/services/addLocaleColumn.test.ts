import { afterEach, describe, expect, it } from 'vitest'
import {
  addLocaleColumn,
  suggestLocaleFileName,
} from '@/services/addLocaleColumn'
import type { TranslationProject } from '@/services/translationProject'
import { serializeProject } from '@/services/translationProject'
import {
  resetTranslationStore,
  useTranslationStoreBase,
} from '@/store/translationStore'

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

describe('suggestLocaleFileName', () => {
  it('replaces a bare locale basename', () => {
    expect(suggestLocaleFileName('en.json', 'de', 'json')).toBe('de.json')
  })

  it('keeps a messages_ prefix and can switch format', () => {
    expect(suggestLocaleFileName('messages_nl.properties', 'de', 'json')).toBe(
      'messages_de.json',
    )
  })
})

describe('addLocaleColumn', () => {
  it('appends a column with empty values and marks dirty', () => {
    const next = addLocaleColumn(makeProject(), { locale: 'de', format: 'json' })
    expect(next).not.toBeNull()
    expect(next!.dirty).toBe(true)
    expect(next!.columns.map((column) => column.locale)).toEqual(['en', 'nl', 'de'])
    expect(next!.columns[2]).toMatchObject({
      locale: 'de',
      fileName: 'de.json',
      filePath: 'C:/project/locales/de.json',
      format: 'json',
    })
    expect(next!.rows[0]?.values).toEqual({ en: 'Hello', nl: 'Hallo', de: '' })
  })

  it('rejects invalid or duplicate locales', () => {
    const project = makeProject()
    expect(addLocaleColumn(project, { locale: 'zz', format: 'json' })).toBeNull()
    expect(addLocaleColumn(project, { locale: 'nl', format: 'json' })).toBeNull()
  })

  it('serializes the new file on save', () => {
    const next = addLocaleColumn(makeProject(), {
      locale: 'fr',
      format: 'properties',
    })
    expect(next).not.toBeNull()
    const writes = serializeProject(next!)
    expect(writes.some((item) => item.filePath.endsWith('fr.properties'))).toBe(
      true,
    )
  })
})

describe('store addLocale', () => {
  afterEach(() => {
    resetTranslationStore()
  })

  it('adds a locale column via the store', () => {
    const project = makeProject()
    useTranslationStoreBase.setState({
      project,
      baselineRows: project.rows.map((row) => ({
        key: row.key,
        values: { ...row.values },
      })),
      directoryPath: project.directoryPath,
    })
    expect(useTranslationStoreBase.getState().addLocale('de', 'yaml')).toBe(true)
    const state = useTranslationStoreBase.getState()
    expect(state.project?.dirty).toBe(true)
    expect(state.project?.columns[2]).toMatchObject({
      locale: 'de',
      format: 'yaml',
      fileName: 'de.yaml',
    })
    expect(useTranslationStoreBase.getState().addLocale('nl', 'json')).toBe(false)
  })
})
