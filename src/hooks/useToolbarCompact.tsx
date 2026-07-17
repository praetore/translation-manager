import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type DependencyList,
  type ReactNode,
  type RefObject,
} from 'react'

const ToolbarCompactContext = createContext(false)

/** Extra width required before leaving compact mode (avoids flicker). */
const EXPAND_HYSTERESIS_PX = 24

export function useIsToolbarCompact(): boolean {
  return useContext(ToolbarCompactContext)
}

export function ToolbarCompactProvider({
  compact,
  children,
}: {
  compact: boolean
  children: ReactNode
}) {
  return (
    <ToolbarCompactContext.Provider value={compact}>
      {children}
    </ToolbarCompactContext.Provider>
  )
}

function rowWrapped(el: HTMLElement): boolean {
  const children = Array.from(el.children) as HTMLElement[]
  if (children.length < 2) {
    return false
  }
  const firstTop = children[0]?.offsetTop ?? 0
  return children.some((child) => child.offsetTop > firstTop + 1)
}

/**
 * Compact when the observed actions row wraps to a second line.
 * Expands again once the row's available width grows past the wrap point.
 *
 * The observed element must track available width (e.g. `flex-1`), not shrink
 * to icon content — otherwise widening the window never unlocks full labels.
 */
export function useToolbarCompact(
  ref: RefObject<HTMLElement | null>,
  deps: DependencyList = [],
): boolean {
  const [compact, setCompact] = useState(false)
  const compactAtWidthRef = useRef<number | null>(null)
  const depsKey = deps.map(String).join('|')

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      const width = el.getBoundingClientRect().width

      if (rowWrapped(el)) {
        compactAtWidthRef.current = width
        setCompact(true)
        return
      }

      // Icons fit on one line. Grow past the wrap width before retrying labels.
      if (!compact) {
        return
      }

      const lockedAt = compactAtWidthRef.current
      if (lockedAt == null || width >= lockedAt + EXPAND_HYSTERESIS_PX) {
        compactAtWidthRef.current = null
        setCompact(false)
      }
    }

    // Measure before paint so icon-only mode applies without a wrapped flash.
    update()

    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
    // Re-run when compact flips so expanding to full labels can re-detect wrap.
  }, [ref, depsKey, compact])

  return compact
}
