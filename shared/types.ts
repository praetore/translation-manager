export type TranslationFormat = 'json' | 'yaml' | 'po' | 'properties'

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

export interface WriteFilesResult {
  written: string[]
  errors: Array<{ filePath: string; message: string }>
}

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

export const SUPPORTED_EXTENSIONS = ['.json', '.yaml', '.yml', '.po', '.properties'] as const

export const SOURCE_LOCALE = 'en'
