import type { FlatTranslations } from '@shared/types'
import type { TranslationAdapter } from './TranslationAdapter'

/**
 * Nested object ↔ flat map for JSON (and YamlAdapter via re-exports).
 * Dot segments become object paths on serialize; arrays are leaf strings.
 */
function flattenObject(
  value: unknown,
  prefix = '',
  result: FlatTranslations = {},
): FlatTranslations {
  if (value === null || value === undefined) {
    return result
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    if (prefix) {
      result[prefix] = value === null || value === undefined ? '' : String(value)
    }
    return result
  }

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const nextKey = prefix ? `${prefix}.${key}` : key
    if (nested !== null && typeof nested === 'object' && !Array.isArray(nested)) {
      flattenObject(nested, nextKey, result)
    } else {
      result[nextKey] = nested === null || nested === undefined ? '' : String(nested)
    }
  }

  return result
}

function unflattenObject(data: FlatTranslations): Record<string, unknown> {
  const root: Record<string, unknown> = {}

  const sortedKeys = Object.keys(data).sort()
  for (const flatKey of sortedKeys) {
    const parts = flatKey.split('.')
    let current: Record<string, unknown> = root

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      const existing = current[part]
      if (existing === undefined || typeof existing !== 'object' || existing === null || Array.isArray(existing)) {
        current[part] = {}
      }
      current = current[part] as Record<string, unknown>
    }

    current[parts[parts.length - 1]] = data[flatKey]
  }

  return root
}

export class JsonAdapter implements TranslationAdapter {
  readonly format = 'json' as const
  readonly extensions = ['.json'] as const

  canHandle(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.json')
  }

  parse(content: string): FlatTranslations {
    const trimmed = content.trim()
    if (!trimmed) {
      return {}
    }

    const parsed: unknown = JSON.parse(trimmed)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('JSON translation files must contain a top-level object')
    }

    return flattenObject(parsed)
  }

  serialize(data: FlatTranslations): string {
    return `${JSON.stringify(unflattenObject(data), null, 2)}\n`
  }
}

export { flattenObject, unflattenObject }
