export type TranslationFormat = 'json' | 'yaml' | 'po' | 'properties' | 'xliff'

export interface FlatTranslations {
  [key: string]: string
}

export interface LocaleColumn {
  locale: string
  fileName: string
  filePath: string
  format: TranslationFormat
}

export interface TranslationRow {
  key: string
  values: Record<string, string>
}

export interface TranslationFilePayload {
  filePath: string
  fileName: string
  content: string
}

export interface ScanDirectoryResult {
  directoryPath: string
  files: TranslationFilePayload[]
}

export interface WriteFileRequest {
  filePath: string
  content: string
}

/** Partial success is allowed — check `errors` even when some paths were written. */
export interface WriteFilesResult {
  written: string[]
  errors: Array<{ filePath: string; message: string }>
}

/**
 * Electron IPC channel names (main ↔ preload ↔ renderer).
 *
 * | Channel | Direction | Purpose |
 * | --- | --- | --- |
 * | SELECT_DIRECTORY | invoke | Native folder dialog → path or null |
 * | SCAN_DIRECTORY | invoke | List + read supported locale files in a folder |
 * | WRITE_FILES | invoke | Write serialized locale files; may return partial errors |
 * | MENU_OPEN / MENU_SAVE | main→renderer | Accelerator / menu actions |
 * | GET/SET_UI_LOCALE + UI_LOCALE_CHANGED | invoke / event | App chrome language |
 * | GET/SET_UI_THEME + UI_THEME_CHANGED | invoke / event | light / dark / system |
 *
 * Security: renderer never gets `fs` — only `window.electronAPI` via preload
 * (`contextIsolation: true`, `nodeIntegration: false`).
 */
export const IPC_CHANNELS = {
  SELECT_DIRECTORY: 'fs:select-directory',
  SCAN_DIRECTORY: 'fs:scan-directory',
  WRITE_FILES: 'fs:write-files',
  MENU_OPEN: 'menu:open',
  MENU_SAVE: 'menu:save',
  SET_UI_LOCALE: 'ui:set-locale',
  GET_UI_LOCALE: 'ui:get-locale',
  UI_LOCALE_CHANGED: 'ui:locale-changed',
  SET_UI_THEME: 'ui:set-theme',
  GET_UI_THEME: 'ui:get-theme',
  UI_THEME_CHANGED: 'ui:theme-changed',
} as const

/** Extensions main includes when scanning a locales directory (non-recursive). */
export const SUPPORTED_EXTENSIONS = [
  '.json',
  '.yaml',
  '.yml',
  '.po',
  '.properties',
  '.xliff',
  '.xlf',
] as const

export const SOURCE_LOCALE = 'en'
