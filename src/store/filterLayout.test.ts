import { describe, expect, it } from 'vitest'
import { planKeyListTransition } from '@/store/filterLayout'

describe('planKeyListTransition', () => {
  it('returns none when ordered lists match', () => {
    expect(planKeyListTransition(['a', 'b'], ['a', 'b'], 40)).toEqual({
      type: 'none',
    })
  })

  it('plans collapse: hide removed keys, FLIP remaining from prior tops', () => {
    expect(
      planKeyListTransition(
        ['greeting', 'farewell', 'keep'],
        ['farewell', 'keep'],
        40,
      ),
    ).toEqual({
      type: 'collapse',
      hiding: ['greeting'],
      remaining: [
        { key: 'farewell', fromTop: 40 },
        { key: 'keep', fromTop: 80 },
      ],
    })
  })

  it('plans expand: fade appearing, FLIP shared rows to new tops', () => {
    expect(
      planKeyListTransition(
        ['farewell', 'keep'],
        ['greeting', 'farewell', 'keep'],
        40,
      ),
    ).toEqual({
      type: 'expand',
      appearing: ['greeting'],
      expanding: [
        { key: 'farewell', fromTop: 0, toTop: 40 },
        { key: 'keep', fromTop: 40, toTop: 80 },
      ],
    })
  })

  it('plans search shrink/grow between key lists', () => {
    expect(planKeyListTransition(['a', 'b', 'c'], ['a', 'c'], 40)).toEqual({
      type: 'collapse',
      hiding: ['b'],
      remaining: [
        { key: 'a', fromTop: 0 },
        { key: 'c', fromTop: 80 },
      ],
    })
    expect(planKeyListTransition(['a', 'c'], ['a', 'b', 'c'], 40)).toEqual({
      type: 'expand',
      appearing: ['b'],
      expanding: [
        { key: 'a', fromTop: 0, toTop: 0 },
        { key: 'c', fromTop: 40, toTop: 80 },
      ],
    })
  })
})
