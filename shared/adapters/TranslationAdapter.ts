import type { FlatTranslations, TranslationFormat } from '@shared/types'

/**
 * Adapter contract: file content ↔ flat `key → string` map used by the grid.
 *
 * ## Conventions
 * - Nested JSON/YAML becomes dot keys (`nav.home`); `serialize` reconstitutes objects.
 * - Leaf values are always strings (null/undefined → `''`; non-objects stringify).
 * - Arrays are not nested further — treated as leaf string values when present.
 * - Key order on serialize is adapter-defined (JSON/YAML/XLIFF/properties sort keys;
 *   PO typically follows insertion order). Comments in PO/properties are not
 *   round-tripped; expect a normalized body on save.
 * - XLIFF uses the platform `DOMParser` (no XML dependency). Keys are
 *   `trans-unit` / `unit` ids; values prefer `target` over `source`. Serialize
 *   writes XLIFF 1.2; parse accepts 1.2 and 2.0.
 * - Properties uses `properties-file` for parse/escape.
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
