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

function nextAvailableKey(existing: Set<string>, preferredKey: string): string {
  if (!existing.has(preferredKey)) {
    return preferredKey
  }

  let index = 2
  while (existing.has(`${preferredKey}.${index}`)) {
    index += 1
  }
  return `${preferredKey}.${index}`
}

/** Key that `addRow` would assign next (without mutating the project). */
export function peekNextRowKey(
  project: TranslationProject,
  preferredKey = 'new.key',
): string {
  return nextAvailableKey(new Set(project.rows.map((row) => row.key)), preferredKey)
}

/** Insert an empty row at the top of the grid. */
export function addRow(
  project: TranslationProject,
  preferredKey = 'new.key',
): TranslationProject {
  const key = peekNextRowKey(project, preferredKey)
  const values: Record<string, string> = {}
  for (const column of project.columns) {
    values[column.locale] = ''
  }

  return {
    ...project,
    dirty: true,
    rows: [{ key, values }, ...project.rows],
  }
}

export function deleteRow(project: TranslationProject, key: string): TranslationProject {
  return {
    ...project,
    dirty: true,
    rows: project.rows.filter((row) => row.key !== key),
  }
}


/**
 * Rename a translation key. Returns null when the new key is empty or already used.
 */
export function renameKey(
  project: TranslationProject,
  oldKey: string,
  newKey: string,
): TranslationProject | null {
  const trimmed = newKey.trim()
  if (!trimmed) {
    return null
  }
  if (trimmed === oldKey) {
    return project
  }
  if (project.rows.some((row) => row.key === trimmed)) {
    return null
  }

  return {
    ...project,
    dirty: true,
    rows: project.rows.map((row) => (row.key === oldKey ? { ...row, key: trimmed } : row)),
  }
}

/**
 * Mark a cell as missing when it still needs a value:
 * - source locale: empty source (e.g. a blank key after the user left the row)
 * - other locales: empty while the source locale has a value
 *
 * Fresh rows (just added, still focused) are ignored until leaveFreshKey.
 */
export function isMissingAgainstSource(
  row: TranslationRow,
  locale: string,
  sourceLocale: string,
  freshKeys?: ReadonlySet<string>,
): boolean {
  if (freshKeys?.has(row.key)) {
    return false
  }

  const value = row.values[locale]?.trim() ?? ''

  if (locale === sourceLocale) {
    return !value
  }

  const sourceValue = row.values[sourceLocale]?.trim() ?? ''
  if (!sourceValue) {
    return false
  }

  return !value
}

export function rowHasMissingTranslation(
  row: TranslationRow,
  locales: string[],
  sourceLocale: string,
  freshKeys?: ReadonlySet<string>,
): boolean {
  return locales.some((locale) =>
    isMissingAgainstSource(row, locale, sourceLocale, freshKeys),
  )
}

export function collectMissingRowKeys(
  project: TranslationProject,
  freshKeys: readonly string[] = [],
): string[] {
  const fresh = new Set(freshKeys)
  const locales = project.columns.map((column) => column.locale)
  return project.rows
    .filter((row) =>
      rowHasMissingTranslation(row, locales, project.sourceLocale, fresh),
    )
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
