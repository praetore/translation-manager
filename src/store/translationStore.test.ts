import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TranslationProject } from '@/services/translationProject'
import {
  selectDisplayProject,
  selectLiveMissingKeys,
} from '@/store/selectors'
import {
  resetTranslationStore,
  useTranslationStoreBase,
} from '@/store/translationStore'

function sampleProject(overrides?: Partial<TranslationProject>): TranslationProject {
  return {
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
    ...overrides,
  }
}

function loadSample(project = sampleProject()) {
  useTranslationStoreBase.setState({
    project,
    baselineRows: project.rows.map((row) => ({
      key: row.key,
      values: { ...row.values },
    })),
    directoryPath: project.directoryPath,
    missingFilterKeys: null,
    freshKeys: [],
    pendingKeyEdit: null,
    selectedKeys: [],
    searchQuery: '',
    load: {
      loading: false,
      saving: false,
      error: null,
      status: { key: 'status.keysAndLocales', params: { keys: 2, locales: 2 } },
    },
  })
}

describe('translationStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetTranslationStore('/locales')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('adds a fresh row and tracks pending key edit', () => {
    loadSample()
    useTranslationStoreBase.getState().addRow()
    const state = useTranslationStoreBase.getState()
    expect(state.project?.rows[0]?.key).toBe('new.key')
    expect(state.freshKeys).toEqual(['new.key'])
    expect(state.pendingKeyEdit).toBe('new.key')
    expect(state.missingFilterKeys).toBeNull()
    expect(state.project?.dirty).toBe(true)
    expect(state.enteringKeys).toContain('new.key')
    expect(state.load.status).toEqual({
      key: 'status.keysAndLocales',
      params: { keys: 3, locales: 2 },
    })
  })

  it('clears dirty after adding then deleting the same row', () => {
    loadSample()
    useTranslationStoreBase.getState().addRow()
    expect(useTranslationStoreBase.getState().project?.dirty).toBe(true)

    useTranslationStoreBase.getState().deleteRow('new.key')
    vi.runAllTimers()

    const state = useTranslationStoreBase.getState()
    expect(state.project?.rows.map((row) => row.key)).toEqual([
      'greeting',
      'farewell',
    ])
    expect(state.project?.dirty).toBe(false)
    expect(state.freshKeys).toEqual([])
    expect(state.load.status).toEqual({
      key: 'status.keysAndLocales',
      params: { keys: 2, locales: 2 },
    })
  })

  it('keeps fresh keys out of live missing until leaveFreshKey', () => {
    loadSample()
    useTranslationStoreBase.getState().addRow()
    expect(selectLiveMissingKeys(useTranslationStoreBase.getState())).toEqual([
      'farewell',
    ])

    useTranslationStoreBase.getState().leaveFreshKey('new.key')
    const state = useTranslationStoreBase.getState()
    expect(state.freshKeys).toEqual([])
    expect(selectLiveMissingKeys(state)).toEqual(['new.key', 'farewell'])
  })

  it('renames keys and updates selection', () => {
    loadSample()
    useTranslationStoreBase.getState().addRow()
    useTranslationStoreBase.getState().selectKeys(['new.key'])
    expect(
      useTranslationStoreBase.getState().renameKey('new.key', 'auth.title'),
    ).toBe(true)

    const state = useTranslationStoreBase.getState()
    expect(state.project?.rows[0]?.key).toBe('auth.title')
    expect(state.freshKeys).toEqual(['auth.title'])
    expect(state.selectedKeys).toEqual(['auth.title'])
    expect(state.pendingKeyEdit).toBeNull()
  })

  it('toggles the missing filter snapshot', () => {
    loadSample()
    useTranslationStoreBase.getState().toggleMissingFilter()
    const collapsing = useTranslationStoreBase.getState()
    expect(collapsing.missingFilterKeys).toEqual(['farewell'])
    expect(collapsing.searchLayoutHoldKeys).toEqual(['greeting', 'farewell'])
    expect(collapsing.exitingKeys).toEqual(['greeting'])
    expect(collapsing.layoutMotion).toEqual({
      farewell: { top: 0, shiftY: 40, animate: false },
    })

    // Second click during collapse reverses immediately
    useTranslationStoreBase.getState().toggleMissingFilter()
    expect(useTranslationStoreBase.getState().missingFilterKeys).toBeNull()
    expect(useTranslationStoreBase.getState().filterLayoutMode).toBe('expand')
    expect(useTranslationStoreBase.getState().searchLayoutHoldKeys).toBeNull()
    expect(useTranslationStoreBase.getState().fadeEnteringKeys).toEqual(['greeting'])

    vi.runAllTimers()
    let state = useTranslationStoreBase.getState()
    expect(state.missingFilterKeys).toBeNull()
    expect(state.searchLayoutHoldKeys).toBeNull()
    expect(state.layoutMotion).toBeNull()
    expect(selectDisplayProject(state)?.rows.map((row) => row.key)).toEqual([
      'greeting',
      'farewell',
    ])

    useTranslationStoreBase.getState().toggleMissingFilter()
    state = useTranslationStoreBase.getState()
    expect(state.missingFilterKeys).toEqual(['farewell'])
    expect(state.filterLayoutMode).toBe('collapse')

    vi.runAllTimers()
    state = useTranslationStoreBase.getState()
    expect(state.layoutMotion).toBeNull()
    expect(state.filterLayoutMode).toBeNull()
  })

  it('slide-enters a row added during missing-filter collapse', () => {
    loadSample()
    useTranslationStoreBase.getState().toggleMissingFilter()
    expect(useTranslationStoreBase.getState().layoutMotion).not.toBeNull()
    expect(useTranslationStoreBase.getState().missingFilterKeys).toEqual(['farewell'])

    useTranslationStoreBase.getState().addRow()
    const during = useTranslationStoreBase.getState()
    expect(during.project?.rows[0]?.key).toBe('new.key')
    expect(during.enteringKeys).toContain('new.key')
    expect(during.freshKeys).toEqual(['new.key'])
    expect(during.missingFilterKeys).toEqual(['new.key', 'farewell'])

    vi.runAllTimers()
    const after = useTranslationStoreBase.getState()
    expect(after.missingFilterKeys).toEqual(['new.key', 'farewell'])
    expect(after.searchLayoutHoldKeys).toBeNull()
    expect(selectDisplayProject(after)?.rows.map((row) => row.key)).toEqual([
      'new.key',
      'farewell',
    ])
  })

  it('filters display rows by search query on keys and values', () => {
    loadSample()
    expect(
      selectDisplayProject(useTranslationStoreBase.getState(), 'fare')?.rows.map(
        (row) => row.key,
      ),
    ).toEqual(['farewell'])
    expect(
      selectDisplayProject(useTranslationStoreBase.getState(), 'hallo')?.rows.map(
        (row) => row.key,
      ),
    ).toEqual(['greeting'])
  })

  it('marks save success as clean and restores keys/locales status', () => {
    loadSample({ ...sampleProject(), dirty: true })
    useTranslationStoreBase.setState({
      load: {
        loading: false,
        saving: true,
        error: null,
        status: { key: 'status.saving' },
      },
    })
    useTranslationStoreBase.setState({
      project: { ...useTranslationStoreBase.getState().project!, dirty: false },
      load: {
        loading: false,
        saving: false,
        error: null,
        status: {
          key: 'status.keysAndLocales',
          params: { keys: 2, locales: 2 },
        },
      },
    })
    const state = useTranslationStoreBase.getState()
    expect(state.project?.dirty).toBe(false)
    expect(state.load.status).toEqual({
      key: 'status.keysAndLocales',
      params: { keys: 2, locales: 2 },
    })
  })

  it('moves and deletes selected rows with exit animation', () => {
    loadSample(
      sampleProject({
        rows: [
          { key: 'auth.login.title', values: { en: 'A', nl: '' } },
          { key: 'auth.login.button', values: { en: 'B', nl: 'C' } },
          { key: 'keep', values: { en: 'K', nl: 'K' } },
        ],
      }),
    )
    useTranslationStoreBase.setState({
      missingFilterKeys: ['auth.login.title'],
      freshKeys: ['auth.login.button'],
      selectedKeys: ['auth.login.title', 'auth.login.button'],
    })

    expect(useTranslationStoreBase.getState().moveSelectedKeys('ui')).toBe(true)
    let state = useTranslationStoreBase.getState()
    expect(state.project?.rows.map((row) => row.key)).toEqual([
      'ui.title',
      'ui.button',
      'keep',
    ])
    expect(state.missingFilterKeys).toEqual(['ui.title'])
    expect(state.freshKeys).toEqual(['ui.button'])
    expect(state.selectedKeys).toEqual(['ui.title', 'ui.button'])

    useTranslationStoreBase.getState().selectKeys(['ui.title', 'keep'])
    useTranslationStoreBase.getState().deleteSelectedRows()
    // Only visible rows (missing-filter on) participate in the exit/FLIP animation.
    expect(useTranslationStoreBase.getState().exitingKeys).toEqual(['ui.title'])
    vi.runAllTimers()
    state = useTranslationStoreBase.getState()
    expect(state.project?.rows.map((row) => row.key)).toEqual(['ui.button'])
    expect(state.missingFilterKeys).toEqual([])
    expect(state.selectedKeys).toEqual([])
  })

  it('moves selected keys with path tokens and rejects invalid templates', () => {
    loadSample(
      sampleProject({
        rows: [
          { key: 'auth.login.title', values: { en: 'A', nl: '' } },
          { key: 'auth.signup.button', values: { en: 'B', nl: 'C' } },
        ],
      }),
    )
    useTranslationStoreBase.setState({
      selectedKeys: ['auth.login.title', 'auth.signup.button'],
    })

    expect(useTranslationStoreBase.getState().moveSelectedKeys('$9')).toBe(false)
    expect(useTranslationStoreBase.getState().project?.rows.map((row) => row.key)).toEqual([
      'auth.login.title',
      'auth.signup.button',
    ])

    expect(useTranslationStoreBase.getState().moveSelectedKeys('app.$$')).toBe(true)
    const state = useTranslationStoreBase.getState()
    expect(state.project?.rows.map((row) => row.key)).toEqual([
      'app.auth.login.title',
      'app.auth.signup.button',
    ])
    expect(state.selectedKeys).toEqual(['app.auth.login.title', 'app.auth.signup.button'])
  })

  it('updates selection with select, remove, and clear', () => {
    loadSample()
    const store = useTranslationStoreBase.getState()
    store.selectKeys(['greeting', 'farewell'])
    expect(useTranslationStoreBase.getState().selectedKeys).toEqual([
      'greeting',
      'farewell',
    ])
    store.removeFromSelection('greeting')
    expect(useTranslationStoreBase.getState().selectedKeys).toEqual(['farewell'])
    store.clearSelection()
    expect(useTranslationStoreBase.getState().selectedKeys).toEqual([])
  })
})
