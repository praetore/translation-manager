import { useCallback, useEffect, useRef } from 'react'
import { keysInIndexRange } from '@/services/keyPaths'

export interface SelectionModifiers {
  shift: boolean
  /** Ctrl on Windows/Linux, Meta (Cmd) on macOS. */
  ctrl: boolean
}

export type SelectionPointerHandler = (
  rowIndex: number,
  modifiers: SelectionModifiers,
) => void

/**
 * Excel-style selection: click, drag, Shift+click range, Ctrl/Cmd+click toggle.
 */
export function useKeyDragSelection(
  orderedKeys: readonly string[],
  selectKeys: (keys: string[]) => void,
  selectedKeys: readonly string[],
) {
  const orderedKeysRef = useRef(orderedKeys)
  const selectKeysRef = useRef(selectKeys)
  const selectedKeysRef = useRef(selectedKeys)
  const dragRef = useRef<{ active: boolean; anchor: number } | null>(null)
  const rangeAnchorRef = useRef<number | null>(null)

  useEffect(() => {
    orderedKeysRef.current = orderedKeys
  }, [orderedKeys])

  useEffect(() => {
    selectKeysRef.current = selectKeys
  }, [selectKeys])

  useEffect(() => {
    selectedKeysRef.current = selectedKeys
  }, [selectedKeys])

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag?.active) {
        return
      }
      const el = document.elementFromPoint(event.clientX, event.clientY)
      const cell = el?.closest('[data-selection-index]')
      if (!(cell instanceof HTMLElement)) {
        return
      }
      const index = Number(cell.dataset.selectionIndex)
      if (!Number.isFinite(index)) {
        return
      }
      selectKeysRef.current(keysInIndexRange(orderedKeysRef.current, drag.anchor, index))
    }

    const onPointerUp = () => {
      if (dragRef.current) {
        dragRef.current.active = false
      }
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [])

  const beginSelectionDrag = useCallback<SelectionPointerHandler>(
    (rowIndex, modifiers) => {
      const keys = orderedKeysRef.current
      const key = keys[rowIndex]
      if (!key) {
        return
      }

      if (modifiers.ctrl) {
        dragRef.current = null
        const current = selectedKeysRef.current
        const next = current.includes(key)
          ? current.filter((item) => item !== key)
          : [...current, key]
        selectKeysRef.current(next)
        rangeAnchorRef.current = rowIndex
        return
      }

      if (modifiers.shift && rangeAnchorRef.current !== null) {
        dragRef.current = null
        selectKeysRef.current(
          keysInIndexRange(keys, rangeAnchorRef.current, rowIndex),
        )
        return
      }

      rangeAnchorRef.current = rowIndex
      dragRef.current = { active: true, anchor: rowIndex }
      selectKeysRef.current(keysInIndexRange(keys, rowIndex, rowIndex))
    },
    [],
  )

  return { beginSelectionDrag }
}
