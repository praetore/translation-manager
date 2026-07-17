import type { TranslationProject } from '@/services/translationProject'
import { useTranslationStoreBase } from '@/store/translationStore'

export function sampleProject(
  overrides?: Partial<TranslationProject>,
): TranslationProject {
  return {
    directoryPath: '/locales',
    columns: [
      {
        locale: 'en',
        fileName: 'en.json',
        filePath: '/locales/en.json',
        format: 'json',
      },
      {
        locale: 'nl',
        fileName: 'nl.json',
        filePath: '/locales/nl.json',
        format: 'json',
      },
    ],
    rows: [
      { key: 'greeting', values: { en: 'Hello', nl: 'Hallo' } },
      { key: 'farewell', values: { en: 'Bye', nl: '' } },
      { key: 'auth.login', values: { en: 'Log in', nl: 'Inloggen' } },
    ],
    sourceLocale: 'en',
    dirty: false,
    ...overrides,
  }
}

/** Seed the zustand store with a project ready for UI tests. */
export function loadSampleProject(project = sampleProject()): TranslationProject {
  useTranslationStoreBase.setState({
    project,
    baselineRows: project.rows.map((row) => ({
      key: row.key,
      values: { ...row.values },
    })),
    directoryPath: project.directoryPath,
    missingFilterKeys: null,
    freshKeys: [],
    pendingKeyEdit: null,
    selectedKeys: [],
    searchQuery: '',
    searchScope: 'all',
    searchRegex: false,
    searchLayoutHoldKeys: null,
    layoutMotion: null,
    filterLayoutMode: null,
    load: {
      loading: false,
      saving: false,
      error: null,
      status: null,
    },
  })
  return project
}
