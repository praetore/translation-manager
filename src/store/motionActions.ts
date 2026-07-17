import { ROW_ENTER_MS, ROW_EXIT_MS, ROW_FLASH_MS } from '@/lib/motion'
import type { TranslationState } from '@/store/types'

type SetState = (
  partial:
    | Partial<TranslationState>
    | ((state: TranslationState) => Partial<TranslationState>),
) => void

const enterTimers = new Map<string, number>()
const flashTimers = new Map<string, number>()
let exitTimer: number | null = null

function scheduleKeys(
  set: SetState,
  field: 'enteringKeys' | 'flashingKeys',
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
    if (exitTimer !== null) {
      clearTimeout(exitTimer)
    }
    set({ exitingKeys: [...keys] })
    exitTimer = setTimeout(() => {
      commit()
      set({ exitingKeys: [] })
      exitTimer = null
    }, ROW_EXIT_MS) as unknown as number
  }

  const clearMotion = () => {
    for (const timer of enterTimers.values()) {
      clearTimeout(timer)
    }
    for (const timer of flashTimers.values()) {
      clearTimeout(timer)
    }
    enterTimers.clear()
    flashTimers.clear()
    if (exitTimer !== null) {
      clearTimeout(exitTimer)
      exitTimer = null
    }
    set({ enteringKeys: [], flashingKeys: [], exitingKeys: [] })
  }

  return { animateEnter, animateFlash, animateExit, clearMotion }
}
