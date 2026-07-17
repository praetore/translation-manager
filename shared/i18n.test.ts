import { describe, expect, it } from 'vitest'
import {
  changeUiLocale,
  createTranslator,
  resolveUiLocale,
  translate,
} from '@shared/i18n'

describe('i18n', () => {
  it('resolves locale tags', () => {
    expect(resolveUiLocale('nl-NL')).toBe('nl')
    expect(resolveUiLocale('en-US')).toBe('en')
    expect(resolveUiLocale('de')).toBe('en')
  })

  it('interpolates nested keys with brace placeholders', () => {
    expect(
      translate('en', 'status.keysAndLocales', { keys: 3, locales: 2 }),
    ).toBe('3 keys · 2 languages')
    expect(
      translate('nl', 'status.keysAndLocales', { keys: 3, locales: 2 }),
    ).toBe('3 keys · 2 talen')
  })

  it('createTranslator follows the fixed locale', async () => {
    const tNl = createTranslator('nl')
    expect(tNl('toolbar.save')).toBe('Opslaan')
    await changeUiLocale('en')
    // Fixed translator stays on nl even if default language changes
    expect(tNl('toolbar.save')).toBe('Opslaan')
    expect(translate('en', 'toolbar.save')).toBe('Save')
  })
})
