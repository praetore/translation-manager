import type { FlatTranslations } from '../types'
import type { TranslationAdapter } from './TranslationAdapter'

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function textContent(el: Element | null): string {
  return el?.textContent ?? ''
}

function firstChildByLocalName(parent: Element, name: string): Element | null {
  for (const child of parent.children) {
    if (child.localName === name) {
      return child
    }
  }
  return null
}

function childrenByLocalName(parent: Element, name: string): Element[] {
  return Array.from(parent.children).filter((child) => child.localName === name)
}

function unitValue(unit: Element): string {
  const segments = childrenByLocalName(unit, 'segment')
  if (segments.length > 0) {
    const parts = segments.map((segment) => {
      const target = firstChildByLocalName(segment, 'target')
      const source = firstChildByLocalName(segment, 'source')
      return textContent(target ?? source)
    })
    return parts.join('')
  }

  const target = firstChildByLocalName(unit, 'target')
  const source = firstChildByLocalName(unit, 'source')
  return textContent(target ?? source)
}

function parseXliffDocument(content: string): FlatTranslations {
  const trimmed = content.trim()
  if (!trimmed) {
    return {}
  }

  const doc = new DOMParser().parseFromString(trimmed, 'application/xml')
  if (doc.querySelector('parsererror')) {
    throw new Error('Invalid XLIFF')
  }

  const root = doc.documentElement
  if (!root || root.localName !== 'xliff') {
    throw new Error('XLIFF root element must be <xliff>')
  }

  const result: FlatTranslations = {}
  for (const el of Array.from(doc.getElementsByTagName('*'))) {
    if (el.localName !== 'trans-unit' && el.localName !== 'unit') {
      continue
    }
    const id = el.getAttribute('id')?.trim()
    if (!id) {
      continue
    }
    result[id] = unitValue(el)
  }

  return result
}

export class XliffAdapter implements TranslationAdapter {
  readonly format = 'xliff' as const
  readonly extensions = ['.xliff', '.xlf'] as const

  canHandle(fileName: string): boolean {
    const lower = fileName.toLowerCase()
    return lower.endsWith('.xliff') || lower.endsWith('.xlf')
  }

  parse(content: string): FlatTranslations {
    return parseXliffDocument(content)
  }

  serialize(data: FlatTranslations): string {
    const units = Object.keys(data)
      .sort((a, b) => a.localeCompare(b))
      .map((id) => {
        const value = escapeXml(data[id] ?? '')
        const safeId = escapeXml(id)
        return [
          `    <trans-unit id="${safeId}">`,
          `      <source>${value}</source>`,
          `      <target>${value}</target>`,
          `    </trans-unit>`,
        ].join('\n')
      })
      .join('\n')

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">',
      '  <file source-language="en" datatype="plaintext" original="messages">',
      '    <body>',
      units,
      '    </body>',
      '  </file>',
      '</xliff>',
      '',
    ].join('\n')
  }
}
