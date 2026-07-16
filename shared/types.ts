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
} as const

export const SUPPORTED_EXTENSIONS = ['.json', '.yaml', '.yml', '.po', '.properties'] as const

export const SOURCE_LOCALE = 'en'
