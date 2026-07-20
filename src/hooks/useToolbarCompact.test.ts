import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  measureRowUsedWidth,
  rowContentOverflows,
} from '@/hooks/useToolbarCompact'

function box(width: number, display = 'block'): HTMLElement {
  const el = document.createElement('div')
  Object.defineProperty(el, 'offsetWidth', { value: width, configurable: true })
  el.style.display = display
  return el
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('measureRowUsedWidth', () => {
  it('sums child widths and gaps', () => {
    const row = document.createElement('div')
    row.append(box(80), box(80))
    document.body.append(row)
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      if (el === row) {
        return { columnGap: '8px', gap: '8px' } as CSSStyleDeclaration
      }
      return { display: (el as HTMLElement).style.display || 'block' } as CSSStyleDeclaration
    })
    expect(measureRowUsedWidth(row)).toBe(168)
    row.remove()
  })
})

describe('rowContentOverflows', () => {
  it('is false when children fit', () => {
    const row = document.createElement('div')
    Object.defineProperty(row, 'clientWidth', { value: 200 })
    row.append(box(80), box(80))
    document.body.append(row)
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      if (el === row) {
        return { columnGap: '8px', gap: '8px' } as CSSStyleDeclaration
      }
      return { display: (el as HTMLElement).style.display || 'block' } as CSSStyleDeclaration
    })
    expect(rowContentOverflows(row)).toBe(false)
    row.remove()
  })

  it('is true when children plus gap exceed the row', () => {
    const row = document.createElement('div')
    Object.defineProperty(row, 'clientWidth', { value: 200 })
    row.append(box(100), box(100))
    document.body.append(row)
    // jsdom does not resolve style.gap via getComputedStyle; stub gap explicitly.
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      if (el === row) {
        return { columnGap: '8px', gap: '8px' } as CSSStyleDeclaration
      }
      return { display: (el as HTMLElement).style.display || 'block' } as CSSStyleDeclaration
    })
    expect(rowContentOverflows(row)).toBe(true)
    row.remove()
  })

  it('ignores display:none children', () => {
    const row = document.createElement('div')
    Object.defineProperty(row, 'clientWidth', { value: 120 })
    row.append(box(100), box(100, 'none'))
    document.body.append(row)
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      if (el === row) {
        return { columnGap: '0px', gap: '0px' } as CSSStyleDeclaration
      }
      return {
        display: (el as HTMLElement).style.display || 'block',
      } as CSSStyleDeclaration
    })
    expect(rowContentOverflows(row)).toBe(false)
    row.remove()
  })
})
