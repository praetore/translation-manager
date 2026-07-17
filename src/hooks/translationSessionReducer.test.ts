import { describe, expect, it } from 'vitest'
import {
  createInitialTranslationSessionState,
  selectDisplayProject,
  selectLiveMissingKeys,
  translationSessionReducer,
  type TranslationSessionState,
} from '@/hooks/translationSessionReducer'
import type { TranslationProject } from '@/services/translationProject'

function loadedState(
  overrides?: Partial<TranslationSessionState>,
): TranslationSessionState {
  const project: TranslationProject = {
    directoryPath: '/locales',
    columns: [
      {
        locale: 'en',
        fileName: 'en.json',
        filePath: '/locales/en.json',
        format: 'json',
      },
      {
        locale: 'nl',
        fileName: 'nl.json',
        filePath: '/locales/nl.json',
        format: 'json',
      },
    ],
    rows: [
      { key: 'greeting', values: { en: 'Hello', nl: 'Hallo' } },
      { key: 'farewell', values: { en: 'Bye', nl: '' } },
    ],
    sourceLocale: 'en',
    dirty: false,
  }

  return {
    ...createInitialTranslationSessionState('/locales'),
    project,
    ...overrides,
  }
}

describe('translationSessionReducer', () => {
  it('loads a project and resets transient UI state', () => {
    const state = loadedState({
      freshKeys: ['old'],
      pendingKeyEdit: 'old',
      missingFilterKeys: ['farewell'],
    })
    const project = state.project!
    const next = translationSessionReducer(state, {
      type: 'loadSuccess',
      project,
      directoryPath: '/other',
      status: '2 keys · 2 languages',
    })

    expect(next.directoryPath).toBe('/other')
    expect(next.freshKeys).toEqual([])
    expect(next.pendingKeyEdit).toBeNull()
    expect(next.missingFilterKeys).toBeNull()
    expect(next.load.status).toBe('2 keys · 2 languages')
  })

  it('adds a fresh row and tracks pending key edit', () => {
    const next = translationSessionReducer(loadedState(), { type: 'addRow' })
    expect(next.project?.rows[0]?.key).toBe('new.key')
    expect(next.freshKeys).toEqual(['new.key'])
    expect(next.pendingKeyEdit).toBe('new.key')
    expect(next.missingFilterKeys).toBeNull()
    expect(next.project?.dirty).toBe(true)
    expect(next.load.status).toBeNull()
  })

  it('keeps fresh keys out of live missing until leaveFreshKey', () => {
    let state = translationSessionReducer(loadedState(), { type: 'addRow' })
    expect(selectLiveMissingKeys(state)).toEqual(['farewell'])

    state = translationSessionReducer(state, {
      type: 'leaveFreshKey',
      key: 'new.key',
    })
    expect(state.freshKeys).toEqual([])
    expect(selectLiveMissingKeys(state)).toEqual(['new.key', 'farewell'])
  })

  it('renames keys and updates filter/fresh tracking', () => {
    let state = translationSessionReducer(loadedState(), { type: 'addRow' })
    state = translationSessionReducer(state, {
      type: 'renameKey',
      oldKey: 'new.key',
      newKey: 'auth.title',
    })

    expect(state.project?.rows[0]?.key).toBe('auth.title')
    expect(state.freshKeys).toEqual(['auth.title'])
    expect(state.pendingKeyEdit).toBeNull()
  })

  it('toggles the missing filter snapshot', () => {
    let state = translationSessionReducer(loadedState(), {
      type: 'toggleMissingFilter',
    })
    expect(state.missingFilterKeys).toEqual(['farewell'])

    const display = selectDisplayProject(state)
    expect(display?.rows.map((row) => row.key)).toEqual(['farewell'])

    state = translationSessionReducer(state, { type: 'toggleMissingFilter' })
    expect(state.missingFilterKeys).toBeNull()
  })

  it('marks save success as clean with a status message', () => {
    const dirty = loadedState({
      project: { ...loadedState().project!, dirty: true },
    })
    const next = translationSessionReducer(dirty, {
      type: 'saveSuccess',
      status: '2 file(s) saved',
    })
    expect(next.project?.dirty).toBe(false)
    expect(next.load.saving).toBe(false)
    expect(next.load.status).toBe('2 file(s) saved')
  })
})
