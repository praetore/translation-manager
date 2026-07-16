import en from '../locales/en.json'
import nl from '../locales/nl.json'
import { flattenObject } from './adapters/JsonAdapter'

export const UI_LOCALES = ['en', 'nl'] as const

export type UiLocale = (typeof UI_LOCALES)[number]

export type MessageParams = Record<string, string | number>

const catalogs: Record<UiLocale, Record<string, string>> = {
  en: flattenObject(en),
  nl: flattenObject(nl),
}

const fallbackLocale: UiLocale = 'en'

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
  const catalog = catalogs[locale] ?? catalogs[fallbackLocale]
  const template = catalog[key] ?? catalogs[fallbackLocale][key] ?? key

  if (!params) {
    return template
  }

  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined ? match : String(value)
  })
}

export function createTranslator(locale: UiLocale) {
  return (key: string, params?: MessageParams): string => translate(locale, key, params)
}
