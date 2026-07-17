import { useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { I18nextProvider, useTranslation } from 'react-i18next'
import {
  changeUiLocale,
  i18n,
  resolveUiLocale,
  UI_LOCALES,
  type MessageParams,
  type UiLocale,
} from '@shared/i18n'

const STORAGE_KEY = 'translation-manager:ui-locale'

interface LocaleContextValue {
  locale: UiLocale
  setLocale: (locale: UiLocale) => void
  t: (key: string, params?: MessageParams) => string
  locales: readonly UiLocale[]
}

function readStoredLocale(): UiLocale | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? resolveUiLocale(stored) : null
  } catch {
    return null
  }
}

function storeLocale(locale: UiLocale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // localStorage may be unavailable; ignore
  }
}

function detectInitialLocale(): UiLocale {
  return readStoredLocale() ?? resolveUiLocale(navigator.language)
}

function LocaleEffects({ children }: { children: ReactNode }) {
  const { i18n: i18nInstance } = useTranslation()

  useEffect(() => {
    const initial = detectInitialLocale()
    if (resolveUiLocale(i18nInstance.language) !== initial) {
      void changeUiLocale(initial)
    }
    document.documentElement.lang = initial
    void window.electronAPI.setUiLocale(initial)
  }, [i18nInstance])

  useEffect(() => {
    const onLanguageChanged = (lng: string) => {
      document.documentElement.lang = resolveUiLocale(lng)
    }
    i18nInstance.on('languageChanged', onLanguageChanged)
    return () => {
      i18nInstance.off('languageChanged', onLanguageChanged)
    }
  }, [i18nInstance])

  useEffect(() => {
    return window.electronAPI.onUiLocaleChanged((next: string) => {
      const resolved = resolveUiLocale(next)
      storeLocale(resolved)
      void changeUiLocale(resolved)
    })
  }, [])

  return children
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <LocaleEffects>{children}</LocaleEffects>
    </I18nextProvider>
  )
}

export function useI18n(): LocaleContextValue {
  const { t, i18n: i18nInstance } = useTranslation()
  const locale = resolveUiLocale(i18nInstance.language)

  const setLocale = useCallback((next: UiLocale) => {
    storeLocale(next)
    void changeUiLocale(next)
    void window.electronAPI.setUiLocale(next)
  }, [])

  return useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: string, params?: MessageParams) => t(key, params),
      locales: UI_LOCALES,
    }),
    [locale, setLocale, t],
  )
}
