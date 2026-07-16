import type {
  FlatTranslations,
  LocaleColumn,
  TranslationFilePayload,
  TranslationRow,
  WriteFileRequest,
} from '@shared/types'
import { adapterRegistry } from '@shared/adapters'
import { detectFormat, detectLocale, pickSourceLocale } from '@shared/locale'

export interface TranslationProject {
  directoryPath: string
  columns: LocaleColumn[]
  rows: TranslationRow[]
  sourceLocale: string
  dirty: boolean
}

interface ParsedLocaleFile {
  column: LocaleColumn
  data: FlatTranslations
}

export function buildProjectFromFiles(
  directoryPath: string,
  files: TranslationFilePayload[],
): TranslationProject {
  if (files.length === 0) {
    throw new Error('errors.noSupportedFiles')
  }

  const parsed: ParsedLocaleFile[] = []

  for (const file of files) {
    const adapter = adapterRegistry.getByFileName(file.fileName)
    const format = detectFormat(file.fileName)
    if (!adapter || !format) {
      continue
    }

    const data = adapter.parse(file.content)
    parsed.push({
      column: {
        locale: detectLocale(file.fileName),
        fileName: file.fileName,
        filePath: file.filePath,
        format,
      },
      data,
    })
  }

  if (parsed.length === 0) {
    throw new Error('errors.noValidFiles')
  }

  const columns = parsed.map((item) => item.column)
  const sourceLocale = pickSourceLocale(columns.map((column) => column.locale))
  const keySet = new Set<string>()

  for (const item of parsed) {
    for (const key of Object.keys(item.data)) {
      keySet.add(key)
    }
  }

  const rows: TranslationRow[] = [...keySet]
    .sort((a, b) => a.localeCompare(b))
    .map((key) => {
      const values: Record<string, string> = {}
      for (const item of parsed) {
        values[item.column.locale] = item.data[key] ?? ''
      }
      return { key, values }
    })

  return {
    directoryPath,
    columns,
    rows,
    sourceLocale,
    dirty: false,
  }
}

export function updateCell(
  project: TranslationProject,
  key: string,
  locale: string,
  value: string,
): TranslationProject {
  return {
    ...project,
    dirty: true,
    rows: project.rows.map((row) =>
      row.key === key
        ? { ...row, values: { ...row.values, [locale]: value } }
        : row,
    ),
  }
}

/**
 * Mark a cell as missing when the source locale has a value for the key
 * but the target locale is empty.
 */
export function isMissingAgainstSource(
  row: TranslationRow,
  locale: string,
  sourceLocale: string,
): boolean {
  if (locale === sourceLocale) {
    return false
  }

  const sourceValue = row.values[sourceLocale]?.trim() ?? ''
  if (!sourceValue) {
    return false
  }

  return !(row.values[locale]?.trim())
}

export function rowHasMissingTranslation(
  row: TranslationRow,
  locales: string[],
  sourceLocale: string,
): boolean {
  return locales.some((locale) => isMissingAgainstSource(row, locale, sourceLocale))
}

export function collectMissingRowKeys(project: TranslationProject): string[] {
  const locales = project.columns.map((column) => column.locale)
  return project.rows
    .filter((row) => rowHasMissingTranslation(row, locales, project.sourceLocale))
    .map((row) => row.key)
}

export function serializeProject(project: TranslationProject): WriteFileRequest[] {
  return project.columns.map((column) => {
    const data: FlatTranslations = {}

    for (const row of project.rows) {
      data[row.key] = row.values[column.locale] ?? ''
    }

    const adapter = adapterRegistry.getByFormat(column.format)
    return {
      filePath: column.filePath,
      content: adapter.serialize(data),
    }
  })
}
