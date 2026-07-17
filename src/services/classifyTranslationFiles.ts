import type { TranslationFormat, TranslationFilePayload } from '@shared/types'
import { adapterRegistry } from '@shared/adapters'
import {
  detectFormat,
  detectLocale,
  isValidLocaleTag,
} from '@shared/locale'

export type FileSkipReason = 'invalidLocale' | 'parseError'

export type FilePickerCandidate = {
  filePath: string
  fileName: string
  locale: string
  format: TranslationFormat
  content: string
}

export type FilePickerSkipped = {
  filePath: string
  fileName: string
  reason: FileSkipReason
}

export type ClassifiedTranslationFiles = {
  candidates: FilePickerCandidate[]
  skipped: FilePickerSkipped[]
}

export type FilePickerState = {
  directoryPath: string
  candidates: FilePickerCandidate[]
  skipped: FilePickerSkipped[]
}

/** Split scanned files into loadable locale files vs skipped (with reason). */
export function classifyTranslationFiles(
  files: readonly TranslationFilePayload[],
): ClassifiedTranslationFiles {
  const candidates: FilePickerCandidate[] = []
  const skipped: FilePickerSkipped[] = []

  for (const file of files) {
    const adapter = adapterRegistry.getByFileName(file.fileName)
    const format = detectFormat(file.fileName)
    if (!adapter || !format) {
      continue
    }

    const locale = detectLocale(file.fileName)
    if (!isValidLocaleTag(locale)) {
      skipped.push({
        filePath: file.filePath,
        fileName: file.fileName,
        reason: 'invalidLocale',
      })
      continue
    }

    try {
      adapter.parse(file.content)
    } catch {
      skipped.push({
        filePath: file.filePath,
        fileName: file.fileName,
        reason: 'parseError',
      })
      continue
    }

    candidates.push({
      filePath: file.filePath,
      fileName: file.fileName,
      locale,
      format,
      content: file.content,
    })
  }

  return { candidates, skipped }
}

export function candidatesToPayloads(
  candidates: readonly FilePickerCandidate[],
): TranslationFilePayload[] {
  return candidates.map((item) => ({
    filePath: item.filePath,
    fileName: item.fileName,
    content: item.content,
  }))
}
