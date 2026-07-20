import { describe, expect, it } from 'vitest'
import { JsonAdapter } from '@shared/adapters/JsonAdapter'
import { YamlAdapter } from '@shared/adapters/YamlAdapter'
import { PropertiesAdapter } from '@shared/adapters/PropertiesAdapter'
import { XliffAdapter } from '@shared/adapters/XliffAdapter'
import { adapterRegistry } from '@shared/adapters'
import {
  detectFormat,
  detectLocale,
  isValidLocaleTag,
  localeDisplayName,
  localeFlagEmoji,
  localeFlagRegion,
  pickSourceLocale,
} from '@shared/locale'

describe('JsonAdapter', () => {
  const adapter = new JsonAdapter()

  it('flattens nested objects on parse', () => {
    expect(
      adapter.parse(`{
        "nav": { "home": "Home", "about": "About" },
        "title": "App"
      }`),
    ).toEqual({
      'nav.home': 'Home',
      'nav.about': 'About',
      title: 'App',
    })
  })

  it('round-trips flat keys back to nested JSON', () => {
    const flat = { 'nav.home': 'Home', title: 'App' }
    const serialized = adapter.serialize(flat)
    expect(JSON.parse(serialized)).toEqual({
      nav: { home: 'Home' },
      title: 'App',
    })
    expect(adapter.parse(serialized)).toEqual(flat)
  })
})

describe('YamlAdapter', () => {
  const adapter = new YamlAdapter()

  it('parses nested YAML into flat keys', () => {
    expect(
      adapter.parse(`
nav:
  home: Home
title: App
`),
    ).toEqual({
      'nav.home': 'Home',
      title: 'App',
    })
  })

  it('round-trips flat keys through YAML', () => {
    const flat = { 'nav.home': 'Home', title: 'App' }
    expect(adapter.parse(adapter.serialize(flat))).toEqual(flat)
  })
})

describe('PropertiesAdapter', () => {
  const adapter = new PropertiesAdapter()

  it('parses keys, escapes, and line continuations', () => {
    expect(
      adapter.parse(`
# comment
nav.home=Home
title=Hello\\nWorld
long=line \\
continuation
`),
    ).toEqual({
      'nav.home': 'Home',
      title: 'Hello\nWorld',
      long: 'line continuation',
    })
  })

  it('round-trips flat keys', () => {
    const flat = { 'nav.home': 'Home', title: 'App' }
    expect(adapter.parse(adapter.serialize(flat))).toEqual(flat)
  })
})

describe('XliffAdapter', () => {
  const adapter = new XliffAdapter()

  it('parses XLIFF 1.2 trans-units (target preferred)', () => {
    expect(
      adapter.parse(`<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="en" target-language="es" datatype="plaintext" original="messages">
    <body>
      <trans-unit id="nav.home">
        <source>Home</source>
        <target>Inicio</target>
      </trans-unit>
      <trans-unit id="nav.help">
        <source>Help</source>
        <target></target>
      </trans-unit>
      <trans-unit id="only.source">
        <source>Fallback</source>
      </trans-unit>
    </body>
  </file>
</xliff>`),
    ).toEqual({
      'nav.home': 'Inicio',
      'nav.help': '',
      'only.source': 'Fallback',
    })
  })

  it('parses XLIFF 2.0 units with segments', () => {
    expect(
      adapter.parse(`<?xml version="1.0" encoding="UTF-8"?>
<xliff version="2.0" xmlns="urn:oasis:names:tc:xliff:document:2.0" srcLang="en" trgLang="es">
  <file id="f1">
    <unit id="common.save">
      <segment>
        <source>Save</source>
        <target>Guardar</target>
      </segment>
    </unit>
  </file>
</xliff>`),
    ).toEqual({
      'common.save': 'Guardar',
    })
  })

  it('round-trips through XLIFF 1.2 serialize', () => {
    const flat = { 'nav.home': 'Inicio', title: 'App' }
    expect(adapter.parse(adapter.serialize(flat))).toEqual(flat)
  })

  it('rejects invalid XML', () => {
    expect(() => adapter.parse('<not-xliff>')).toThrow(/Invalid XLIFF|xliff/i)
  })

  it('handles .xliff and .xlf extensions', () => {
    expect(adapter.canHandle('es.xliff')).toBe(true)
    expect(adapter.canHandle('messages_es.xlf')).toBe(true)
    expect(detectFormat('es.xliff')).toBe('xliff')
    expect(detectFormat('app.es.xlf')).toBe('xliff')
    expect(detectLocale('es.xliff')).toBe('es')
    expect(adapterRegistry.getByFileName('es.xliff')?.format).toBe('xliff')
  })
})

describe('locale helpers', () => {
  it('detects locales from common filename patterns', () => {
    expect(detectLocale('en.json')).toBe('en')
    expect(detectLocale('messages_nl.properties')).toBe('nl')
    expect(detectLocale('app.fr-FR.yaml')).toBe('fr-FR')
    expect(detectLocale('es.xliff')).toBe('es')
    expect(detectLocale('messages_pt-BR.xlf')).toBe('pt-BR')
  })

  it('prefers English as source locale when present', () => {
    expect(pickSourceLocale(['nl', 'en', 'de'])).toBe('en')
    expect(pickSourceLocale(['nl', 'de'])).toBe('nl')
    expect(pickSourceLocale(['en-US', 'nl'])).toBe('en-US')
  })

  it('validates locale tags via Intl', () => {
    expect(isValidLocaleTag('en')).toBe(true)
    expect(isValidLocaleTag('de')).toBe(true)
    expect(isValidLocaleTag('en-US')).toBe(true)
    expect(isValidLocaleTag('fr-FR')).toBe(true)
    expect(isValidLocaleTag('eu')).toBe(true)
    expect(isValidLocaleTag('zz')).toBe(false)
    expect(isValidLocaleTag('xx')).toBe(false)
    expect(isValidLocaleTag('package')).toBe(false)
    expect(isValidLocaleTag('!!!')).toBe(false)
    expect(isValidLocaleTag('en-ZZ')).toBe(false)
  })

  it('maps locales to flag regions and emoji', () => {
    expect(localeFlagRegion('de')).toBe('DE')
    expect(localeFlagRegion('en')).toBe('GB')
    expect(localeFlagRegion('en-US')).toBe('US')
    expect(localeFlagEmoji('de')).toBe('🇩🇪')
    expect(localeFlagEmoji('nl')).toBe('🇳🇱')
    expect(localeFlagEmoji('zz')).toBeNull()
    expect(localeFlagRegion('package')).toBeNull()
  })

  it('resolves display names for known locales', () => {
    expect(localeDisplayName('de', 'en')).toBe('German')
    expect(localeDisplayName('nl', 'nl')).toBe('Nederlands')
    expect(localeDisplayName('en-US', 'en')).toMatch(/English/)
    expect(localeDisplayName('zz', 'en')).toBeNull()
  })
})
