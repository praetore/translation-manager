import {
  FILTER_LAYOUT_MS,
  ROW_ENTER_MS,
  ROW_EXIT_MS,
  ROW_FLASH_MS,
  ROW_HEIGHT,
} from '@/lib/motion'
import type { RowLayoutMotion, TranslationState } from '@/store/types'

type SetState = (
  partial:
    | Partial<TranslationState>
    | ((state: TranslationState) => Partial<TranslationState>),
) => void

const enterTimers = new Map<string, number>()
const fadeEnterTimers = new Map<string, number>()
const flashTimers = new Map<string, number>()
let exitTimer: number | null = null
let layoutFrameTimer: number | null = null
let layoutRaf: number | null = null

function scheduleKeys(
  set: SetState,
  field: 'enteringKeys' | 'fadeEnteringKeys' | 'flashingKeys',
  nextKeys: readonly string[],
  timers: Map<string, number>,
  durationMs: number,
) {
  if (nextKeys.length === 0) {
    return
  }
  set((state) => {
    const merged = new Set(state[field])
    for (const key of nextKeys) {
      merged.add(key)
    }
    return { [field]: [...merged] }
  })
  for (const key of nextKeys) {
    const existing = timers.get(key)
    if (existing !== undefined) {
      clearTimeout(existing)
    }
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key)
        set((state) => ({
          [field]: state[field].filter((item) => item !== key),
        }))
      }, durationMs) as unknown as number,
    )
  }
}

function clearLayoutFrame() {
  if (layoutFrameTimer !== null) {
    clearTimeout(layoutFrameTimer)
    layoutFrameTimer = null
  }
  if (layoutRaf !== null && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(layoutRaf)
    layoutRaf = null
  }
}

function clearExitTimer() {
  if (exitTimer !== null) {
    clearTimeout(exitTimer)
    exitTimer = null
  }
  clearLayoutFrame()
}

/** Run after the browser has painted (double rAF), with setTimeout fallback for tests. */
function afterPaint(cb: () => void) {
  if (typeof requestAnimationFrame !== 'function') {
    layoutFrameTimer = setTimeout(() => {
      layoutFrameTimer = null
      cb()
    }, 16) as unknown as number
    return
  }
  layoutRaf = requestAnimationFrame(() => {
    layoutRaf = requestAnimationFrame(() => {
      layoutRaf = null
      cb()
    })
  })
}

function runFlipLayout(
  set: SetState,
  mode: 'collapse' | 'expand',
  inverted: Record<string, RowLayoutMotion>,
  settled: Record<string, RowLayoutMotion>,
  extra: Partial<TranslationState>,
  onDone?: () => void,
) {
  clearExitTimer()
  set({ ...extra, layoutMotion: inverted, filterLayoutMode: mode })
  afterPaint(() => {
    set({ layoutMotion: settled })
  })
  exitTimer = setTimeout(() => {
    onDone?.()
    set({ layoutMotion: null, filterLayoutMode: null, exitingKeys: [] })
    exitTimer = null
  }, FILTER_LAYOUT_MS) as unknown as number
}

export function createMotionActions(set: SetState) {
  const animateEnter = (keys: readonly string[]) => {
    scheduleKeys(set, 'enteringKeys', keys, enterTimers, ROW_ENTER_MS)
  }

  const animateFlash = (keys: readonly string[]) => {
    scheduleKeys(set, 'flashingKeys', keys, flashTimers, ROW_FLASH_MS)
  }

  const animateExit = (keys: readonly string[], commit: () => void) => {
    if (keys.length === 0) {
      commit()
      return
    }
    clearExitTimer()
    set({ exitingKeys: [...keys], layoutMotion: null, filterLayoutMode: null })
    exitTimer = setTimeout(() => {
      commit()
      set({ exitingKeys: [], layoutMotion: null, filterLayoutMode: null })
      exitTimer = null
    }, ROW_EXIT_MS) as unknown as number
  }

  /**
   * Fade out `hiding` in place; FLIP-compact `remaining` via transform.
   * Phase 1 paints inverted shiftY; phase 2 eases shiftY → 0.
   */
  const animateFilterCollapse = (
    hiding: readonly string[],
    remaining: readonly { key: string; fromTop: number }[],
    commit: () => void,
  ) => {
    if (hiding.length === 0) {
      commit()
      return
    }
    const inverted: Record<string, RowLayoutMotion> = {}
    const settled: Record<string, RowLayoutMotion> = {}
    remaining.forEach((row, index) => {
      const top = index * ROW_HEIGHT
      inverted[row.key] = { top, shiftY: row.fromTop - top, animate: false }
      settled[row.key] = { top, shiftY: 0, animate: true }
    })
    runFlipLayout(
      set,
      'collapse',
      inverted,
      settled,
      { exitingKeys: [...hiding] },
      commit,
    )
  }

  /**
   * FLIP-expand rows that stay visible; fade-enter `appearing` at final slots.
   * Caller should clear `missingFilterKeys` in the same turn before/with this.
   */
  const animateFilterExpand = (
    appearing: readonly string[],
    expanding: readonly { key: string; fromTop: number; toTop: number }[],
  ) => {
    if (expanding.length === 0 && appearing.length === 0) {
      return
    }
    const inverted: Record<string, RowLayoutMotion> = {}
    const settled: Record<string, RowLayoutMotion> = {}
    for (const row of expanding) {
      inverted[row.key] = {
        top: row.toTop,
        shiftY: row.fromTop - row.toTop,
        animate: false,
      }
      settled[row.key] = { top: row.toTop, shiftY: 0, animate: true }
    }
    scheduleKeys(
      set,
      'fadeEnteringKeys',
      appearing,
      fadeEnterTimers,
      FILTER_LAYOUT_MS,
    )
    if (expanding.length === 0) {
      return
    }
    runFlipLayout(set, 'expand', inverted, settled, { exitingKeys: [] })
  }

  const clearMotion = () => {
    for (const timer of enterTimers.values()) {
      clearTimeout(timer)
    }
    for (const timer of fadeEnterTimers.values()) {
      clearTimeout(timer)
    }
    for (const timer of flashTimers.values()) {
      clearTimeout(timer)
    }
    enterTimers.clear()
    fadeEnterTimers.clear()
    flashTimers.clear()
    clearExitTimer()
    set({
      enteringKeys: [],
      fadeEnteringKeys: [],
      flashingKeys: [],
      exitingKeys: [],
      layoutMotion: null,
      filterLayoutMode: null,
    })
  }

  return {
    animateEnter,
    animateFlash,
    animateExit,
    animateFilterCollapse,
    animateFilterExpand,
    clearMotion,
  }
}
