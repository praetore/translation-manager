export const UI_THEMES = ['system', 'light', 'dark'] as const

export type UiTheme = (typeof UI_THEMES)[number]

export type ResolvedTheme = 'light' | 'dark'

export function isUiTheme(value: string): value is UiTheme {
  return (UI_THEMES as readonly string[]).includes(value)
}

export function resolveUiTheme(input?: string | null): UiTheme {
  if (input && isUiTheme(input)) {
    return input
  }
  return 'system'
}

export function resolveThemePreference(
  theme: UiTheme,
  prefersDark: boolean,
): ResolvedTheme {
  if (theme === 'system') {
    return prefersDark ? 'dark' : 'light'
  }
  return theme
}
