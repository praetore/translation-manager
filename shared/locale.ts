import type { TranslationFormat } from '@shared/types'
import { SOURCE_LOCALE } from '@shared/types'

const LOCALE_PATTERN =
  /(?:^|[._-])([a-z]{2}(?:[-_][A-Za-z]{2})?)(?:\.(?:json|ya?ml|po|properties)$)/i

/** language or language-REGION (after normalizeLocale). */
const LOCALE_TAG_PATTERN = /^[a-z]{2,3}(?:-[A-Z]{2})?$/

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

/**
 * True when `tag` is a real BCP-47 language (and optional region).
 * Uses structural shape + `Intl` (canonical + DisplayNames). Rejects
 * well-formed junk like `zz` / `package` that `getCanonicalLocales` alone allows.
 */
export function isValidLocaleTag(tag: string): boolean {
  const normalized = normalizeLocale(tag.trim())
  if (!LOCALE_TAG_PATTERN.test(normalized)) {
    return false
  }

  try {
    Intl.getCanonicalLocales(normalized)
  } catch {
    return false
  }

  const [language, region] = normalized.split('-')
  if (!language || !isKnownLanguageCode(language)) {
    return false
  }
  if (region && !isKnownRegionCode(region)) {
    return false
  }
  return true
}

function isKnownLanguageCode(code: string): boolean {
  const label = new Intl.DisplayNames(['en'], { type: 'language' }).of(code)
  // Unknown codes echo the input (`zz` → "zz"); skip und/mul meta tags.
  return Boolean(label && label !== code && code !== 'und' && code !== 'mul')
}

function isKnownRegionCode(code: string): boolean {
  const label = new Intl.DisplayNames(['en'], { type: 'region' }).of(code)
  if (!label || label === code) {
    return false
  }
  return label.toLowerCase() !== 'unknown region'
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

/**
 * Language → representative ISO 3166-1 alpha-2 when the tag has no region.
 * Flags are countries, not languages — this is a UI convention only.
 * Keys also seed the add-locale language picker.
 */
const LANGUAGE_FLAG_REGION: Record<string, string> = {
  ar: 'SA',
  bg: 'BG',
  ca: 'ES',
  cs: 'CZ',
  da: 'DK',
  de: 'DE',
  el: 'GR',
  en: 'GB',
  es: 'ES',
  et: 'EE',
  fi: 'FI',
  fr: 'FR',
  he: 'IL',
  hi: 'IN',
  hr: 'HR',
  hu: 'HU',
  id: 'ID',
  it: 'IT',
  ja: 'JP',
  ko: 'KR',
  lt: 'LT',
  lv: 'LV',
  ms: 'MY',
  nb: 'NO',
  nl: 'NL',
  nn: 'NO',
  no: 'NO',
  pl: 'PL',
  pt: 'PT',
  ro: 'RO',
  ru: 'RU',
  sk: 'SK',
  sl: 'SI',
  sr: 'RS',
  sv: 'SE',
  th: 'TH',
  tr: 'TR',
  uk: 'UA',
  vi: 'VN',
  zh: 'CN',
}

/** Language codes offered in the add-locale picker (sorted). */
export const CATALOG_LOCALES: readonly string[] = Object.keys(LANGUAGE_FLAG_REGION).sort(
  (a, b) => a.localeCompare(b),
)

function regionToFlagEmoji(region: string): string | null {
  const code = region.toUpperCase()
  if (!/^[A-Z]{2}$/.test(code) || !isKnownRegionCode(code)) {
    return null
  }
  const base = 0x1f1e6 // Regional Indicator Symbol Letter A
  return String.fromCodePoint(
    base + (code.charCodeAt(0) - 65),
    base + (code.charCodeAt(1) - 65),
  )
}

/**
 * ISO 3166-1 alpha-2 region used for the locale's flag (language fallback map
 * when the tag has no region). Null when the locale is invalid / unmapped.
 */
export function localeFlagRegion(locale: string): string | null {
  if (!isValidLocaleTag(locale)) {
    return null
  }
  const normalized = normalizeLocale(locale)
  const [language, region] = normalized.split('-')
  if (region && isKnownRegionCode(region)) {
    return region.toUpperCase()
  }
  const fallback = LANGUAGE_FLAG_REGION[language ?? '']
  return fallback && isKnownRegionCode(fallback) ? fallback : null
}

/**
 * Flag emoji for a locale tag (`de` → 🇩🇪, `en-US` → 🇺🇸).
 * Prefer SVG via `LocaleFlag` in the UI — Windows does not render these as flags.
 * Requires {@link isValidLocaleTag}; returns null otherwise.
 */
export function localeFlagEmoji(locale: string): string | null {
  const region = localeFlagRegion(locale)
  return region ? regionToFlagEmoji(region) : null
}

/**
 * Human-readable language name for a locale tag, in `displayLocale` (UI language).
 * e.g. localeDisplayName('de', 'en') → "German"; ('nl', 'nl') → "Nederlands".
 */
export function localeDisplayName(
  locale: string,
  displayLocale = 'en',
): string | null {
  if (!isValidLocaleTag(locale)) {
    return null
  }
  const normalized = normalizeLocale(locale)
  try {
    const name = new Intl.DisplayNames([displayLocale, 'en'], {
      type: 'language',
    }).of(normalized)
    if (!name || name === normalized) {
      return null
    }
    return name
  } catch {
    return null
  }
}
