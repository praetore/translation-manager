import { describe, expect, it } from 'vitest'
import { JsonAdapter } from '@shared/adapters/JsonAdapter'
import { YamlAdapter } from '@shared/adapters/YamlAdapter'
import { detectLocale, isValidLocaleTag, localeDisplayName, localeFlagEmoji, localeFlagRegion, pickSourceLocale } from '@shared/locale'

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

describe('locale helpers', () => {
  it('detects locales from common filename patterns', () => {
    expect(detectLocale('en.json')).toBe('en')
    expect(detectLocale('messages_nl.properties')).toBe('nl')
    expect(detectLocale('app.fr-FR.yaml')).toBe('fr-FR')
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
