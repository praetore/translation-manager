import type { FlatTranslations } from '@shared/types'
import type { TranslationAdapter } from './TranslationAdapter'

/**
 * Lightweight .po parser/serializer (no Node-only deps).
 * Supports msgid / msgstr pairs used by typical software i18n files.
 */
export class PoAdapter implements TranslationAdapter {
  readonly format = 'po' as const
  readonly extensions = ['.po'] as const

  canHandle(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.po')
  }

  parse(content: string): FlatTranslations {
    const result: FlatTranslations = {}
    const blocks = content.split(/\n\s*\n/)

    for (const block of blocks) {
      const msgid = extractPoString(block, 'msgid')
      if (msgid === null || msgid === '') {
        continue
      }
      const msgstr = extractPoString(block, 'msgstr')
      result[msgid] = msgstr ?? ''
    }

    return result
  }

  serialize(data: FlatTranslations): string {
    const header = [
      'msgid ""',
      'msgstr ""',
      '"Content-Type: text/plain; charset=UTF-8\\n"',
      '',
    ].join('\n')

    const body = Object.keys(data)
      .sort()
      .map((key) => {
        return [`msgid ${formatPoString(key)}`, `msgstr ${formatPoString(data[key] ?? '')}`, ''].join(
          '\n',
        )
      })
      .join('\n')

    return `${header}\n${body}`
  }
}

function extractPoString(block: string, field: 'msgid' | 'msgstr'): string | null {
  const lines = block.split(/\r?\n/)
  const startIndex = lines.findIndex((line) => line.startsWith(`${field} `) || line === `${field} ""`)
  if (startIndex === -1) {
    return null
  }

  const chunks: string[] = []
  const first = lines[startIndex].slice(field.length).trim()
  if (first) {
    chunks.push(unquotePo(first))
  }

  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line.startsWith('"')) {
      break
    }
    chunks.push(unquotePo(line))
  }

  return chunks.join('')
}

function unquotePo(value: string): string {
  const trimmed = value.trim()
  if (!(trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    return trimmed
  }

  return trimmed
    .slice(1, -1)
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
}

function formatPoString(value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\t/g, '\\t')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')

  return `"${escaped}"`
}
