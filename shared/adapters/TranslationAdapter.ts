import type { FlatTranslations, TranslationFormat } from '@shared/types'

/**
 * Adapter contract: convert between file content and the central flat key→value map.
 */
export interface TranslationAdapter {
  readonly format: TranslationFormat
  readonly extensions: readonly string[]

  canHandle(fileName: string): boolean
  parse(content: string): FlatTranslations
  serialize(data: FlatTranslations): string
}
