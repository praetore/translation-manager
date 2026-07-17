import { describe, expect, it } from 'vitest'
import { classifyTranslationFiles } from '@/services/classifyTranslationFiles'

const mixedFiles = [
  {
    filePath: '/locales/en.json',
    fileName: 'en.json',
    content: '{"hi":"Hello","bye":"Bye"}',
  },
  {
    filePath: '/locales/messages_nl.properties',
    fileName: 'messages_nl.properties',
    content: 'hi=Hallo\n',
  },
  {
    filePath: '/locales/zz.json',
    fileName: 'zz.json',
    content: '{"hi":"Nope"}',
  },
  {
    filePath: '/locales/package.json',
    fileName: 'package.json',
    content: '{"name":"app"}',
  },
  {
    filePath: '/locales/de.json',
    fileName: 'de.json',
    content: '{broken',
  },
  {
    filePath: '/locales/fr.yaml',
    fileName: 'fr.yaml',
    content: 'hi: Bonjour\n',
  },
]

describe('classifyTranslationFiles', () => {
  it('splits a mix of valid and invalid files by reason', () => {
    const result = classifyTranslationFiles(mixedFiles)

    expect(result.candidates.map((item) => ({
      locale: item.locale,
      fileName: item.fileName,
      format: item.format,
    }))).toEqual([
      { locale: 'en', fileName: 'en.json', format: 'json' },
      { locale: 'nl', fileName: 'messages_nl.properties', format: 'properties' },
      { locale: 'fr', fileName: 'fr.yaml', format: 'yaml' },
    ])

    expect(result.skipped).toEqual([
      {
        filePath: '/locales/zz.json',
        fileName: 'zz.json',
        reason: 'invalidLocale',
      },
      {
        filePath: '/locales/package.json',
        fileName: 'package.json',
        reason: 'invalidLocale',
      },
      {
        filePath: '/locales/de.json',
        fileName: 'de.json',
        reason: 'parseError',
      },
    ])
  })

  it('returns only skipped when nothing is loadable', () => {
    const result = classifyTranslationFiles([
      {
        filePath: '/locales/zz.json',
        fileName: 'zz.json',
        content: '{}',
      },
      {
        filePath: '/locales/broken.json',
        fileName: 'en.json',
        content: 'not-json',
      },
    ])

    expect(result.candidates).toEqual([])
    expect(result.skipped.map((item) => item.reason)).toEqual([
      'invalidLocale',
      'parseError',
    ])
  })
})
