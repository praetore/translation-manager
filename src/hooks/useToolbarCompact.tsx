import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type DependencyList,
  type ReactNode,
  type RefObject,
} from 'react'
import { TOOLBAR_COMPACT_MS } from '@/lib/motion'

const ToolbarCompactContext = createContext(false)

/** Extra width required before leaving compact mode (avoids flicker at the edge). */
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

function rowContentOverflows(el: HTMLElement): boolean {
  const children = Array.from(el.children).filter(
    (node): node is HTMLElement =>
      node instanceof HTMLElement && getComputedStyle(node).display !== 'none',
  )
  if (children.length === 0) {
    return false
  }

  const styles = getComputedStyle(el)
  const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0
  let used = 0
  for (let i = 0; i < children.length; i++) {
    // offsetWidth ignores enter transforms (e.g. motion scale) that shrink getBoundingClientRect.
    used += children[i].offsetWidth
    if (i > 0) {
      used += gap
    }
  }

  return used > el.clientWidth + 1
}

/**
 * Compact when the observed actions row overflows its width.
 * Pair with `flex-nowrap overflow-hidden` so excess clips instead of wrapping.
 *
 * Pass deps that flip when toolbar chrome is fully gone (after exit animations),
 * not on every selection count change — otherwise labels flash open/closed.
 *
 * Hysteresis uses window width, not the actions row: compact mode shrinks
 * siblings (search) which would otherwise widen this row and false-trigger expand.
 */
export function useToolbarCompact(
  ref: RefObject<HTMLElement | null>,
  deps: DependencyList = [],
): boolean {
  const [compact, setCompact] = useState(false)
  const compactRef = useRef(compact)
  const compactAtWidthRef = useRef<number | null>(null)
  const expandUntilRef = useRef(0)
  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const depsKey = deps.map(String).join('|')
  const prevDepsKeyRef = useRef(depsKey)

  useEffect(() => {
    compactRef.current = compact
  }, [compact])

  useEffect(() => {
    return () => {
      if (expandTimerRef.current) {
        clearTimeout(expandTimerRef.current)
      }
    }
  }, [])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const depsChanged = prevDepsKeyRef.current !== depsKey
    prevDepsKeyRef.current = depsKey

    const update = (options?: { allowDepsExpand?: boolean }) => {
      const viewportWidth = window.innerWidth
      const expanding = performance.now() < expandUntilRef.current

      // While labels animate open, ignore overflow so the expand isn't cancelled mid-way.
      if (!expanding && rowContentOverflows(el)) {
        compactAtWidthRef.current = viewportWidth
        setCompact(true)
        return
      }

      if (!compactRef.current) {
        return
      }

      const lockedAt = compactAtWidthRef.current
      const grewEnough =
        lockedAt != null && viewportWidth >= lockedAt + EXPAND_HYSTERESIS_PX

      if (grewEnough || options?.allowDepsExpand) {
        compactAtWidthRef.current = null
        expandUntilRef.current = performance.now() + TOOLBAR_COMPACT_MS
        setCompact(false)
        if (expandTimerRef.current) {
          clearTimeout(expandTimerRef.current)
        }
        expandTimerRef.current = setTimeout(() => {
          expandTimerRef.current = null
          update()
        }, TOOLBAR_COMPACT_MS)
      }
    }

    update({ allowDepsExpand: depsChanged })

    const observer = new ResizeObserver(() => update())
    observer.observe(el)
    for (const child of Array.from(el.children)) {
      if (child instanceof HTMLElement) {
        observer.observe(child)
      }
    }

    const onWindowResize = () => update()
    window.addEventListener('resize', onWindowResize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', onWindowResize)
    }
  }, [ref, depsKey, compact])

  return compact
}
