/** Shared durations so Motion transitions and delayed commits stay in sync. */
export const ROW_HEIGHT = 40
export const ROW_ENTER_MS = 450
export const ROW_FLASH_MS = 520
export const ROW_EXIT_MS = 200
/** Fade + compact remaining rows when applying the missing filter. */
export const FILTER_LAYOUT_MS = 260

export const springSnappy = { type: 'spring' as const, stiffness: 460, damping: 34, mass: 0.8 }
export const springSoft = { type: 'spring' as const, stiffness: 380, damping: 32, mass: 0.85 }
/** Smooth list reflow when rows shift after add/delete. */
export const springLayout = { type: 'spring' as const, stiffness: 420, damping: 38, mass: 0.9 }
