import type { FlatTranslations } from '@shared/types'
import type { TranslationAdapter } from './TranslationAdapter'

function unescapeProperties(value: string): string {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\=/g, '=')
    .replace(/\\:/g, ':')
    .replace(/\\#/g, '#')
    .replace(/\\!/g, '!')
    .replace(/\\\\/g, '\\')
}

function escapeProperties(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
    .replace(/\r/g, '\\r')
}

export class PropertiesAdapter implements TranslationAdapter {
  readonly format = 'properties' as const
  readonly extensions = ['.properties'] as const

  canHandle(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.properties')
  }

  parse(content: string): FlatTranslations {
    const result: FlatTranslations = {}
    const lines = content.split(/\r?\n/)
    let pending = ''

    for (const rawLine of lines) {
      const line = pending + rawLine
      if (line.endsWith('\\') && !line.endsWith('\\\\')) {
        pending = line.slice(0, -1)
        continue
      }
      pending = ''

      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) {
        continue
      }

      let separatorIndex = -1
      for (let i = 0; i < trimmed.length; i++) {
        const ch = trimmed[i]
        if ((ch === '=' || ch === ':' || /\s/.test(ch)) && trimmed[i - 1] !== '\\') {
          separatorIndex = i
          break
        }
      }

      if (separatorIndex === -1) {
        result[unescapeProperties(trimmed)] = ''
        continue
      }

      const key = unescapeProperties(trimmed.slice(0, separatorIndex).trimEnd())
      let valuePart = trimmed.slice(separatorIndex + 1)
      if (/^[:=\s]/.test(trimmed[separatorIndex])) {
        valuePart = valuePart.replace(/^[:=\s]+/, '')
      }
      result[key] = unescapeProperties(valuePart)
    }

    return result
  }

  serialize(data: FlatTranslations): string {
    const lines = Object.keys(data)
      .sort()
      .map((key) => `${escapeProperties(key)}=${escapeProperties(data[key] ?? '')}`)

    return `${lines.join('\n')}\n`
  }
}
