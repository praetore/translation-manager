import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  resetTranslationStore,
  useTranslationStoreBase,
} from '@/store/translationStore'

const mixedScan = {
  directoryPath: '/locales',
  files: [
    {
      filePath: '/locales/en.json',
      fileName: 'en.json',
      content: '{"greeting":"Hello"}',
    },
    {
      filePath: '/locales/nl.json',
      fileName: 'nl.json',
      content: '{"greeting":"Hallo"}',
    },
    {
      filePath: '/locales/zz.json',
      fileName: 'zz.json',
      content: '{"greeting":"Nope"}',
    },
    {
      filePath: '/locales/package.json',
      fileName: 'package.json',
      content: '{"name":"app"}',
    },
    {
      filePath: '/locales/de.json',
      fileName: 'de.json',
      content: '{broken',
    },
  ],
}

describe('loadDirectory file picker (mixed files)', () => {
  beforeEach(() => {
    resetTranslationStore('')
    vi.mocked(window.electronAPI.scanDirectory).mockReset()
  })

  afterEach(() => {
    vi.mocked(window.electronAPI.scanDirectory).mockReset()
  })

  it('opens a picker with valid candidates and skipped invalid files', async () => {
    vi.mocked(window.electronAPI.scanDirectory).mockResolvedValue(mixedScan)

    await useTranslationStoreBase.getState().loadDirectory('/locales')

    const picker = useTranslationStoreBase.getState().filePicker
    expect(picker).not.toBeNull()
    expect(picker?.directoryPath).toBe('/locales')
    expect(picker?.candidates.map((item) => item.locale)).toEqual(['en', 'nl'])
    expect(
      picker?.skipped.map((item) => ({
        fileName: item.fileName,
        reason: item.reason,
      })),
    ).toEqual([
      { fileName: 'zz.json', reason: 'invalidLocale' },
      { fileName: 'package.json', reason: 'invalidLocale' },
      { fileName: 'de.json', reason: 'parseError' },
    ])
    expect(useTranslationStoreBase.getState().project).toBeNull()
    expect(useTranslationStoreBase.getState().load.loading).toBe(false)
  })

  it('loads only the confirmed subset from a mixed scan', async () => {
    vi.mocked(window.electronAPI.scanDirectory).mockResolvedValue(mixedScan)

    await useTranslationStoreBase.getState().loadDirectory('/locales')
    useTranslationStoreBase.getState().confirmOpenFiles(['/locales/nl.json'])

    const state = useTranslationStoreBase.getState()
    expect(state.filePicker).toBeNull()
    expect(state.project?.columns.map((column) => column.locale)).toEqual(['nl'])
    expect(state.project?.rows).toEqual([
      { key: 'greeting', values: { nl: 'Hallo' } },
    ])
    expect(state.project?.dirty).toBe(false)
  })

  it('errors when a mix yields no valid files', async () => {
    vi.mocked(window.electronAPI.scanDirectory).mockResolvedValue({
      directoryPath: '/locales',
      files: [
        {
          filePath: '/locales/zz.json',
          fileName: 'zz.json',
          content: '{}',
        },
        {
          filePath: '/locales/package.json',
          fileName: 'package.json',
          content: '{"name":"x"}',
        },
      ],
    })

    await useTranslationStoreBase.getState().loadDirectory('/locales')

    expect(useTranslationStoreBase.getState().filePicker).toBeNull()
    expect(useTranslationStoreBase.getState().load.error).toMatch(/valid/i)
  })
})
