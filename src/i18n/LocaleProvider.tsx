import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createTranslator,
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

const LocaleContext = createContext<LocaleContextValue | null>(null)

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

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<UiLocale>(detectInitialLocale)

  const setLocale = useCallback((next: UiLocale) => {
    setLocaleState(next)
    storeLocale(next)
    void window.electronAPI.setUiLocale(next)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
    void window.electronAPI.setUiLocale(locale)
  }, [locale])

  useEffect(() => {
    return window.electronAPI.onUiLocaleChanged((next: string) => {
      const resolved = resolveUiLocale(next)
      setLocaleState(resolved)
      storeLocale(resolved)
    })
  }, [])

  const t = useMemo(() => createTranslator(locale), [locale])

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      locales: UI_LOCALES,
    }),
    [locale, setLocale, t],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useI18n(): LocaleContextValue {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useI18n must be used within LocaleProvider')
  }
  return context
}
