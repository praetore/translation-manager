/**
 * Add a locale column to an open project (empty values until the user edits).
 * Filename follows the first column's naming pattern when possible.
 */
import type { LocaleColumn, TranslationFormat } from '@shared/types'
import { adapterRegistry } from '@shared/adapters'
import {
  detectLocale,
  isValidLocaleTag,
  normalizeLocale,
} from '@shared/locale'
import type { TranslationProject } from '@/services/translationProject'

/** Default file extension for a format (first registered extension). */
export function formatExtension(format: TranslationFormat): string {
  return adapterRegistry.getByFormat(format).extensions[0] ?? '.json'
}

/**
 * Build a locale filename from an existing column's naming pattern.
 * `en.json` → `de.json`; `messages_nl.properties` → `messages_de.properties`.
 */
export function suggestLocaleFileName(
  templateFileName: string,
  locale: string,
  format: TranslationFormat,
): string {
  const normalized = normalizeLocale(locale)
  const extension = formatExtension(format)
  const templateLocale = detectLocale(templateFileName)
  const withoutExt = templateFileName.replace(
    /\.(json|ya?ml|po|properties|xliff|xlf)$/i,
    '',
  )

  if (!templateLocale || withoutExt === templateLocale) {
    return `${normalized}${extension}`
  }

  const candidates = [templateLocale, templateLocale.replace('-', '_')]
  for (const pattern of candidates) {
    const index = withoutExt.toLowerCase().lastIndexOf(pattern.toLowerCase())
    if (index === -1) {
      continue
    }
    const before = withoutExt.slice(0, index)
    const after = withoutExt.slice(index + pattern.length)
    const token = pattern.includes('_') ? normalized.replace('-', '_') : normalized
    return `${before}${token}${after}${extension}`
  }

  return `${normalized}${extension}`
}

/**
 * Append a locale column with empty values. Returns null when the locale is
 * invalid, already present, or the project has no template column.
 */
export function addLocaleColumn(
  project: TranslationProject,
  input: { locale: string; format: TranslationFormat; fileName?: string },
): TranslationProject | null {
  const locale = normalizeLocale(input.locale.trim())
  if (!isValidLocaleTag(locale)) {
    return null
  }
  if (project.columns.some((column) => column.locale === locale)) {
    return null
  }

  const template = project.columns[0]
  if (!template) {
    return null
  }

  const fileName =
    input.fileName?.trim() ||
    suggestLocaleFileName(template.fileName, locale, input.format)
  if (
    !fileName ||
    project.columns.some(
      (column) => column.fileName.toLowerCase() === fileName.toLowerCase(),
    )
  ) {
    return null
  }

  const dirPrefix = template.filePath.slice(
    0,
    template.filePath.length - template.fileName.length,
  )
  const column: LocaleColumn = {
    locale,
    fileName,
    filePath: `${dirPrefix}${fileName}`,
    format: input.format,
  }

  return {
    ...project,
    dirty: true,
    columns: [...project.columns, column],
    rows: project.rows.map((row) => ({
      ...row,
      values: { ...row.values, [locale]: '' },
    })),
  }
}
