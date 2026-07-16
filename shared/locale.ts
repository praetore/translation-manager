import type { TranslationFormat } from '@shared/types'
import { SOURCE_LOCALE } from '@shared/types'

const LOCALE_PATTERN =
  /(?:^|[._-])([a-z]{2}(?:[-_][A-Za-z]{2})?)(?:\.(?:json|ya?ml|po|properties)$)/i

/**
 * Derive a locale code from a translation filename.
 * Examples: en.json → en, messages_nl.properties → nl, app.fr-FR.yaml → fr-FR
 */
export function detectLocale(fileName: string): string {
  const match = fileName.match(LOCALE_PATTERN)
  if (match?.[1]) {
    return normalizeLocale(match[1])
  }

  const base = fileName.replace(/\.(json|ya?ml|po|properties)$/i, '')
  if (/^[a-z]{2}(?:[-_][A-Za-z]{2})?$/i.test(base)) {
    return normalizeLocale(base)
  }

  return base || fileName
}

export function normalizeLocale(locale: string): string {
  const [language, region] = locale.replace('_', '-').split('-')
  if (!region) {
    return language.toLowerCase()
  }
  return `${language.toLowerCase()}-${region.toUpperCase()}`
}

export function detectFormat(fileName: string): TranslationFormat | null {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.json')) return 'json'
  if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'yaml'
  if (lower.endsWith('.po')) return 'po'
  if (lower.endsWith('.properties')) return 'properties'
  return null
}

export function pickSourceLocale(locales: string[]): string {
  const exact = locales.find((locale) => locale === SOURCE_LOCALE || locale.startsWith(`${SOURCE_LOCALE}-`))
  return exact ?? locales[0] ?? SOURCE_LOCALE
}
