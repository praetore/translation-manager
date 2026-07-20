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

/** Extra room beyond last measured expanded width before leaving compact. */
const EXPAND_SLACK_PX = 8

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

/** Sum of visible child widths + gaps (ignores enter transforms). */
export function measureRowUsedWidth(el: HTMLElement): number {
  const children = Array.from(el.children).filter(
    (node): node is HTMLElement =>
      node instanceof HTMLElement && getComputedStyle(node).display !== 'none',
  )
  if (children.length === 0) {
    return 0
  }

  const styles = getComputedStyle(el)
  const gap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0
  let used = 0
  for (let i = 0; i < children.length; i++) {
    used += children[i].offsetWidth
    if (i > 0) {
      used += gap
    }
  }
  return used
}

/**
 * Flex + overflow-hidden often keeps scrollWidth === clientWidth even when
 * children visibly overflow, so measure child widths instead.
 */
export function rowContentOverflows(el: HTMLElement): boolean {
  return measureRowUsedWidth(el) > el.clientWidth + 1
}

/**
 * Compact when the observed actions row overflows its width.
 * Pair with `flex-nowrap overflow-hidden` so excess clips instead of wrapping.
 *
 * Expand only when the row is wide enough for the last measured *expanded*
 * content width (not merely a few px past the compact lock). That avoids the
 * flash of labels opening and immediately collapsing while slowly resizing.
 *
 * Pass deps that change when chrome appears/disappears (e.g. selection) so we
 * can retry expand after space is freed.
 */
export function useToolbarCompact(
  ref: RefObject<HTMLElement | null>,
  deps: DependencyList = [],
): boolean {
  const [compact, setCompact] = useState(false)
  const compactRef = useRef(compact)
  const expandedNeedRef = useRef<number | null>(null)
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

    const schedulePostExpandCheck = (): void => {
      if (expandTimerRef.current) {
        clearTimeout(expandTimerRef.current)
      }
      expandTimerRef.current = setTimeout(() => {
        expandTimerRef.current = null
        update()
      }, TOOLBAR_COMPACT_MS)
    }

    const beginExpand = (): void => {
      expandUntilRef.current = performance.now() + TOOLBAR_COMPACT_MS
      setCompact(false)
      schedulePostExpandCheck()
    }

    const update = (options?: { allowDepsExpand?: boolean }): void => {
      const expanding = performance.now() < expandUntilRef.current
      // While labels animate open, ignore overflow so the expand isn't cancelled mid-way.
      if (expanding) {
        return
      }

      const used = measureRowUsedWidth(el)
      const available = el.clientWidth

      if (compactRef.current) {
        const need = expandedNeedRef.current
        const fitsKnownNeed =
          need != null && available >= need + EXPAND_SLACK_PX
        if (fitsKnownNeed || options?.allowDepsExpand) {
          beginExpand()
        }
        return
      }

      // Expanded: remember true label width; collapse only when it no longer fits.
      expandedNeedRef.current = used
      if (used > available + 1) {
        setCompact(true)
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

    const onWindowResize = (): void => update()
    window.addEventListener('resize', onWindowResize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', onWindowResize)
    }
  }, [ref, depsKey, compact])

  return compact
}
