import {
  forwardRef,
  useLayoutEffect,
  type CSSProperties,
  type Dispatch,
  type HTMLAttributes,
  type RefObject,
  type SetStateAction,
} from 'react'
import type { FixedSizeList } from 'react-window'
import { ROW_HEIGHT } from '@/components/translation-table/virtualization'

export function createInner(paneWidth: number) {
  return forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Inner(
    { style, ...rest },
    ref,
  ) {
    return (
      <div
        ref={ref}
        {...rest}
        style={{ ...style, width: paneWidth, minWidth: paneWidth }}
      />
    )
  })
}

/** Key pane follows locale scrollTop; no independent overflow scrolling. */
export const KeyOuter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { style?: CSSProperties }
>(function KeyOuter({ style, ...rest }, ref) {
  return (
    <div
      ref={ref}
      {...rest}
      style={{ ...style, overflow: 'hidden' }}
    />
  )
})

/** Convert wheel deltas to pixels (mouse wheels often report lines/pages). */
export function wheelDeltaPixels(
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

interface SyncedPaneScrollArgs {
  bodyRef: RefObject<HTMLDivElement | null>
  headerRef: RefObject<HTMLDivElement | null>
  keyOuterRef: RefObject<HTMLDivElement | null>
  localeOuterRef: RefObject<HTMLDivElement | null>
  keyListRef: RefObject<FixedSizeList | null>
  localeListRef: RefObject<FixedSizeList | null>
  setScrollbarSize: Dispatch<SetStateAction<{ width: number; height: number }>>
  deps: readonly unknown[]
}

/**
 * Locale scroll is the source of truth. Native wheel on the locale pane is
 * compositor-driven and paints before JS can sync the key pane — intercept
 * wheel in capture, preventDefault, and drive both lists together.
 */
export function useSyncedPaneScroll({
  bodyRef,
  headerRef,
  keyOuterRef,
  localeOuterRef,
  keyListRef,
  localeListRef,
  setScrollbarSize,
  deps,
}: SyncedPaneScrollArgs): void {
  useLayoutEffect(() => {
    const body = bodyRef.current
    const locale = localeOuterRef.current
    const key = keyOuterRef.current
    if (!body || !locale || !key) {
      return
    }

    const measureScrollbars = (): void => {
      setScrollbarSize({
        width: Math.max(0, locale.offsetWidth - locale.clientWidth),
        height: Math.max(0, locale.offsetHeight - locale.clientHeight),
      })
    }

    const syncKeyToLocale = (): void => {
      const top = locale.scrollTop
      keyListRef.current?.scrollTo(top)
      if (key.scrollTop !== top) {
        key.scrollTop = top
      }
      if (headerRef.current && headerRef.current.scrollLeft !== locale.scrollLeft) {
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
      const nextTop = Math.min(maxTop, Math.max(0, locale.scrollTop + y))
      const nextLeft = Math.min(maxLeft, Math.max(0, locale.scrollLeft + x))

      localeListRef.current?.scrollTo(nextTop)
      keyListRef.current?.scrollTo(nextTop)
      locale.scrollLeft = nextLeft
      if (headerRef.current) {
        headerRef.current.scrollLeft = nextLeft
      }
    }

    measureScrollbars()
    syncKeyToLocale()
    locale.addEventListener('scroll', syncKeyToLocale, { passive: true })
    body.addEventListener('wheel', applyWheel, { passive: false, capture: true })
    const observer = new ResizeObserver(measureScrollbars)
    observer.observe(locale)

    return () => {
      locale.removeEventListener('scroll', syncKeyToLocale)
      body.removeEventListener('wheel', applyWheel, { capture: true })
      observer.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies stable deps
  }, deps)
}
