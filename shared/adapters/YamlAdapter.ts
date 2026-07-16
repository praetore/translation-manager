import yaml from 'js-yaml'
import type { FlatTranslations } from '@shared/types'
import type { TranslationAdapter } from './TranslationAdapter'
import { flattenObject, unflattenObject } from './JsonAdapter'

export class YamlAdapter implements TranslationAdapter {
  readonly format = 'yaml' as const
  readonly extensions = ['.yaml', '.yml'] as const

  canHandle(fileName: string): boolean {
    const lower = fileName.toLowerCase()
    return lower.endsWith('.yaml') || lower.endsWith('.yml')
  }

  parse(content: string): FlatTranslations {
    const trimmed = content.trim()
    if (!trimmed) {
      return {}
    }

    const parsed = yaml.load(trimmed)
    if (parsed === null || parsed === undefined) {
      return {}
    }
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('YAML translation files must contain a top-level object')
    }

    return flattenObject(parsed)
  }

  serialize(data: FlatTranslations): string {
    return yaml.dump(unflattenObject(data), {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: true,
    })
  }
}
