/**
 * Keep key pane + locale header locked to the locale scroller.
 *
 * Native wheel on the locale pane paints before React can apply
 * `translateY(-scrollTop)` — capture wheel, preventDefault, and drive scroll
 * + key transform in the same turn.
 */
import { useLayoutEffect, type RefObject } from 'react'
import { ROW_HEIGHT } from '@/lib/motion'

function wheelDeltaPixels(
  event: WheelEvent,
  scroller: HTMLElement,
): { x: number; y: number } {
  let { deltaX, deltaY } = event
  if (event.deltaMode === 1) {
    deltaX *= ROW_HEIGHT
    deltaY *= ROW_HEIGHT
  } else if (event.deltaMode === 2) {
    deltaX *= scroller.clientWidth
    deltaY *= scroller.clientHeight
  }
  return { x: deltaX, y: deltaY }
}

interface LocalePaneScrollSyncArgs {
  bodyRef: RefObject<HTMLDivElement | null>
  headerRef: RefObject<HTMLDivElement | null>
  keyInnerRef: RefObject<HTMLDivElement | null>
  localePaneRef: RefObject<HTMLDivElement | null>
  deps: readonly unknown[]
}

export function useLocalePaneScrollSync({
  bodyRef,
  headerRef,
  keyInnerRef,
  localePaneRef,
  deps,
}: LocalePaneScrollSyncArgs): void {
  useLayoutEffect(() => {
    const body = bodyRef.current
    const locale = localePaneRef.current
    if (!body || !locale) {
      return
    }

    const syncChrome = (): void => {
      const top = locale.scrollTop
      const keyInner = keyInnerRef.current
      if (keyInner) {
        keyInner.style.transform = `translateY(${-top}px)`
      }
      if (headerRef.current) {
        headerRef.current.scrollLeft = locale.scrollLeft
      }
    }

    const applyWheel = (event: WheelEvent): void => {
      if (event.deltaY === 0 && event.deltaX === 0) {
        return
      }
      event.preventDefault()

      const { x, y } = wheelDeltaPixels(event, locale)
      const maxTop = Math.max(0, locale.scrollHeight - locale.clientHeight)
      const maxLeft = Math.max(0, locale.scrollWidth - locale.clientWidth)
      locale.scrollTop = Math.min(maxTop, Math.max(0, locale.scrollTop + y))
      locale.scrollLeft = Math.min(maxLeft, Math.max(0, locale.scrollLeft + x))
      syncChrome()
    }

    syncChrome()
    locale.addEventListener('scroll', syncChrome, { passive: true })
    body.addEventListener('wheel', applyWheel, { passive: false, capture: true })

    return () => {
      locale.removeEventListener('scroll', syncChrome)
      body.removeEventListener('wheel', applyWheel, { capture: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies stable deps
  }, deps)
}
