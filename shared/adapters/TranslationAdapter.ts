import type { FlatTranslations, TranslationFormat } from '@shared/types'

/**
 * Adapter contract: file content ↔ flat `key → string` map used by the grid.
 *
 * ## Conventions
 * - Nested JSON/YAML becomes dot keys (`nav.home`); `serialize` reconstitutes objects.
 * - Leaf values are always strings (null/undefined → `''`; non-objects stringify).
 * - Arrays are not nested further — treated as leaf string values when present.
 * - Key order on serialize is adapter-defined (JSON/YAML sort keys; PO/properties
 *   typically follow `Object.keys` insertion / sort). Comments in PO are not
 *   round-tripped; expect a normalized header + msgid/msgstr body on save.
 *
 * Register implementations in `AdapterRegistry` (`shared/adapters/index.ts`).
 * Locale codes come from filenames via `shared/locale.ts`, not from file content.
 */
export interface TranslationAdapter {
  readonly format: TranslationFormat
  readonly extensions: readonly string[]

  canHandle(fileName: string): boolean
  parse(content: string): FlatTranslations
  serialize(data: FlatTranslations): string
}
