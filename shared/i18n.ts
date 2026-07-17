import i18next from 'i18next'
import en from '../locales/en.json'
import nl from '../locales/nl.json'

export const UI_LOCALES = ['en', 'nl'] as const

export type UiLocale = (typeof UI_LOCALES)[number]

export type MessageParams = Record<string, string | number>

const fallbackLocale: UiLocale = 'en'

/** Shared instance for Electron main + renderer (React via I18nextProvider). */
export const i18n = i18next.createInstance()

void i18n.init({
  resources: {
    en: { translation: en },
    nl: { translation: nl },
  },
  lng: fallbackLocale,
  fallbackLng: fallbackLocale,
  supportedLngs: [...UI_LOCALES],
  // Keep existing locale JSON placeholders: "{count}" not "{{count}}"
  interpolation: {
    prefix: '{',
    suffix: '}',
    escapeValue: false,
  },
})

export function isUiLocale(value: string): value is UiLocale {
  return (UI_LOCALES as readonly string[]).includes(value)
}

export function resolveUiLocale(input?: string | null): UiLocale {
  if (!input) {
    return fallbackLocale
  }

  const normalized = input.replace('_', '-').toLowerCase()
  if (isUiLocale(normalized)) {
    return normalized
  }

  const language = normalized.split('-')[0]
  if (isUiLocale(language)) {
    return language
  }

  return fallbackLocale
}

export function translate(
  locale: UiLocale,
  key: string,
  params?: MessageParams,
): string {
  return i18n.getFixedT(locale)(key, params)
}

export function createTranslator(locale: UiLocale) {
  const t = i18n.getFixedT(locale)
  return (key: string, params?: MessageParams): string => t(key, params)
}

export async function changeUiLocale(locale: UiLocale): Promise<UiLocale> {
  await i18n.changeLanguage(locale)
  return locale
}
