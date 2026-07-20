import { getProperties } from 'properties-file'
import { escapeKey, escapeValue } from 'properties-file/escape'
import type { FlatTranslations } from '@shared/types'
import type { TranslationAdapter } from './TranslationAdapter'

/**
 * Java `.properties` adapter via `properties-file`.
 * Comment lines are not preserved on serialize.
 */
export class PropertiesAdapter implements TranslationAdapter {
  readonly format = 'properties' as const
  readonly extensions = ['.properties'] as const

  canHandle(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.properties')
  }

  parse(content: string): FlatTranslations {
    const trimmed = content.trim()
    if (!trimmed) {
      return {}
    }

    const parsed = getProperties(content)
    const result: FlatTranslations = {}
    for (const [key, value] of Object.entries(parsed)) {
      result[key] = value ?? ''
    }
    return result
  }

  serialize(data: FlatTranslations): string {
    const lines = Object.keys(data)
      .sort()
      .map((key) => `${escapeKey(key)}=${escapeValue(data[key] ?? '')}`)

    return `${lines.join('\n')}\n`
  }
}
