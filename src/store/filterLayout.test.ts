import { describe, expect, it } from 'vitest'
import { planFilterCollapse, planFilterExpand } from '@/store/filterLayout'

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
})
