import { describe, expect, it } from 'vitest'
import { planFilterCollapse, planFilterExpand, planKeyListTransition } from '@/store/filterLayout'

const rows = [{ key: 'greeting' }, { key: 'farewell' }, { key: 'keep' }]

describe('filterLayout', () => {
  it('plans collapse: hide non-missing, compact remaining', () => {
    expect(planFilterCollapse(rows, ['farewell', 'keep'], 40)).toEqual({
      hiding: ['greeting'],
      remaining: [
        { key: 'farewell', fromTop: 40 },
        { key: 'keep', fromTop: 80 },
      ],
      missingKeys: ['farewell', 'keep'],
    })
  })

  it('plans expand: fade appearing, FLIP visible rows', () => {
    expect(planFilterExpand(rows, ['farewell', 'keep'], 40)).toEqual({
      appearing: ['greeting'],
      expanding: [
        { key: 'farewell', fromTop: 0, toTop: 40 },
        { key: 'keep', fromTop: 40, toTop: 80 },
      ],
    })
  })

  it('plans search shrink/grow between key lists', () => {
    expect(
      planKeyListTransition(['a', 'b', 'c'], ['a', 'c'], 40),
    ).toEqual({
      type: 'collapse',
      hiding: ['b'],
      remaining: [
        { key: 'a', fromTop: 0 },
        { key: 'c', fromTop: 80 },
      ],
    })
    expect(
      planKeyListTransition(['a', 'c'], ['a', 'b', 'c'], 40),
    ).toEqual({
      type: 'expand',
      appearing: ['b'],
      expanding: [
        { key: 'a', fromTop: 0, toTop: 0 },
        { key: 'c', fromTop: 40, toTop: 80 },
      ],
    })
  })
})
