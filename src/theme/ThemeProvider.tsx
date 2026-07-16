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
  resolveThemePreference,
  resolveUiTheme,
  UI_THEMES,
  type ResolvedTheme,
  type UiTheme,
} from '@shared/theme'

const STORAGE_KEY = 'translation-manager:ui-theme'

interface ThemeContextValue {
  theme: UiTheme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: UiTheme) => void
  themes: readonly UiTheme[]
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): UiTheme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? resolveUiTheme(stored) : null
  } catch {
    return null
  }
}

function storeTheme(theme: UiTheme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // localStorage may be unavailable; ignore
  }
}

function getSystemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyResolvedTheme(resolved: ResolvedTheme): void {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  document.documentElement.style.colorScheme = resolved
}

function detectInitialTheme(): UiTheme {
  return readStoredTheme() ?? 'system'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<UiTheme>(detectInitialTheme)
  const [prefersDark, setPrefersDark] = useState(getSystemPrefersDark)

  const resolvedTheme = useMemo(
    () => resolveThemePreference(theme, prefersDark),
    [theme, prefersDark],
  )

  const setTheme = useCallback((next: UiTheme) => {
    setThemeState(next)
    storeTheme(next)
    void window.electronAPI.setUiTheme(next)
  }, [])

  useEffect(() => {
    applyResolvedTheme(resolvedTheme)
    void window.electronAPI.setUiTheme(theme)
  }, [resolvedTheme, theme])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent): void => {
      setPrefersDark(event.matches)
    }

    media.addEventListener('change', onChange)
    return () => {
      media.removeEventListener('change', onChange)
    }
  }, [])

  useEffect(() => {
    return window.electronAPI.onUiThemeChanged((next: string) => {
      const resolved = resolveUiTheme(next)
      setThemeState(resolved)
      storeTheme(resolved)
    })
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      themes: UI_THEMES,
    }),
    [theme, resolvedTheme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
