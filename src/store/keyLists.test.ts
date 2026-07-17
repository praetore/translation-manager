import { describe, expect, it } from 'vitest'
import {
  leaveKeyInLists,
  mergeUniqueKeys,
  pickKeyLists,
  remapKeysInLists,
  removeKeysFromLists,
  renameKeyInLists,
  type KeyLists,
} from '@/store/keyLists'

function sampleLists(overrides?: Partial<KeyLists>): KeyLists {
  return {
    selectedKeys: ['a', 'b', 'c'],
    freshKeys: ['b', 'd'],
    missingFilterKeys: ['a', 'b'],
    pendingKeyEdit: 'b',
    ...overrides,
  }
}

describe('keyLists', () => {
  it('removes keys from every list field', () => {
    expect(removeKeysFromLists(sampleLists(), ['b', 'c'])).toEqual({
      selectedKeys: ['a'],
      freshKeys: ['d'],
      missingFilterKeys: ['a'],
      pendingKeyEdit: null,
    })
  })

  it('leaves missingFilterKeys null when filter is off', () => {
    expect(
      removeKeysFromLists(sampleLists({ missingFilterKeys: null }), ['a']),
    ).toEqual({
      selectedKeys: ['b', 'c'],
      freshKeys: ['b', 'd'],
      missingFilterKeys: null,
      pendingKeyEdit: 'b',
    })
  })

  it('remaps keys after move', () => {
    const mapping = new Map([
      ['a', 'ui.a'],
      ['b', 'ui.b'],
    ])
    expect(remapKeysInLists(sampleLists(), mapping)).toEqual({
      selectedKeys: ['ui.a', 'ui.b', 'c'],
      freshKeys: ['ui.b', 'd'],
      missingFilterKeys: ['ui.a', 'ui.b'],
      pendingKeyEdit: 'ui.b',
    })
  })

  it('renames a single key across lists', () => {
    expect(renameKeyInLists(sampleLists(), 'b', 'auth.b')).toEqual({
      selectedKeys: ['a', 'auth.b', 'c'],
      freshKeys: ['auth.b', 'd'],
      missingFilterKeys: ['a', 'auth.b'],
      pendingKeyEdit: null,
    })
  })

  it('keeps pending when renaming a different key', () => {
    expect(
      renameKeyInLists(sampleLists({ pendingKeyEdit: 'd' }), 'b', 'auth.b')
        .pendingKeyEdit,
    ).toBe('d')
  })

  it('clears fresh + pending on leave', () => {
    expect(leaveKeyInLists(sampleLists(), 'b')).toEqual({
      selectedKeys: ['a', 'b', 'c'],
      freshKeys: ['d'],
      missingFilterKeys: ['a', 'b'],
      pendingKeyEdit: null,
    })
  })

  it('is a no-op when leave target is not tracked', () => {
    const lists = sampleLists({ pendingKeyEdit: null, freshKeys: [] })
    expect(leaveKeyInLists(lists, 'z')).toBe(lists)
  })

  it('merges unique keys and picks list fields', () => {
    expect(mergeUniqueKeys(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c'])
    expect(
      pickKeyLists({
        ...sampleLists(),
        // extra fields must be ignored by pick
      }),
    ).toEqual(sampleLists())
  })
})
