import { flexRender, type Row } from '@tanstack/react-table'
import { motion } from 'motion/react'
import {
  forwardRef,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type UIEvent,
} from 'react'
import { type ListChildComponentProps } from 'react-window'
import type { TranslationRow } from '@shared/types'
import { springLayout, springSoft } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { isMissingAgainstSource } from '@/services/translationProject'

export const ROW_HEIGHT = 40
export const KEY_COLUMN_WIDTH = 280
export const LOCALE_COLUMN_WIDTH = 260

export interface VirtualRowData {
  rows: Array<Row<TranslationRow>>
  sourceLocale: string
  totalWidth: number
  locales: string[]
  stripeMissingRows: boolean
  freshKeys: ReadonlySet<string>
  selectedKeys: ReadonlySet<string>
  enteringKeys: ReadonlySet<string>
  flashingKeys: ReadonlySet<string>
  exitingKeys: ReadonlySet<string>
  onLeaveFreshKey: (key: string) => void
}

function readTop(style: CSSProperties): number {
  if (typeof style.top === 'number') {
    return style.top
  }
  if (typeof style.top === 'string') {
    return Number.parseFloat(style.top) || 0
  }
  return 0
}

export function VirtualRow({ index, style, data }: ListChildComponentProps<VirtualRowData>) {
  const row = data.rows[index]
  if (!row) {
    return null
  }

  const rowMissing =
    data.stripeMissingRows &&
    data.locales.some((locale) =>
      isMissingAgainstSource(
        row.original,
        locale,
        data.sourceLocale,
        data.freshKeys,
      ),
    )

  const handleRowBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget
    if (next instanceof Node && event.currentTarget.contains(next)) {
      return
    }
    data.onLeaveFreshKey(row.original.key)
  }

  const rowSelected = data.selectedKeys.has(row.original.key)
  const rowEntering = data.enteringKeys.has(row.original.key)
  const rowFlashing = data.flashingKeys.has(row.original.key)
  const rowExiting = data.exitingKeys.has(row.original.key)
  const top = readTop(style)

  return (
    <motion.div
      className={cn(
        'flex border-b',
        rowMissing && 'row-missing-stripe',
        rowSelected && 'row-selected',
        rowExiting && 'pointer-events-none',
      )}
      style={{
        position: 'absolute',
        left: 0,
        height: style.height,
        width: data.totalWidth,
        minWidth: data.totalWidth,
      }}
      role="row"
      aria-selected={rowSelected}
      onBlur={handleRowBlur}
      initial={
        rowEntering
          ? { opacity: 0, top: top - ROW_HEIGHT }
          : false
      }
      animate={{
        top,
        opacity: rowExiting ? 0 : 1,
        filter: rowFlashing ? 'brightness(1.08)' : 'brightness(1)',
      }}
      transition={{
        top: springLayout,
        opacity: rowExiting
          ? { duration: 0.22, ease: 'easeIn' }
          : rowEntering
            ? springSoft
            : { duration: 0 },
        filter: rowFlashing ? { duration: 0.45, ease: 'easeOut' } : { duration: 0 },
      }}
    >
      {row.getVisibleCells().map((cell) => {
        const locale = cell.column.id === 'key' ? null : cell.column.id
        const missing =
          locale !== null &&
          isMissingAgainstSource(
            row.original,
            locale,
            data.sourceLocale,
            data.freshKeys,
          )
        const isKey = cell.column.id === 'key'

        return (
          <div
            key={cell.id}
            className={cn(
              'flex min-w-0 items-center border-r px-2.5',
              missing && !rowSelected && 'bg-destructive/15',
              missing && rowSelected && 'bg-primary/15',
              isKey &&
                cn(
                  'sticky left-0 z-[2]',
                  rowSelected && 'row-selected-sticky',
                  rowMissing && 'row-missing-stripe-sticky',
                  !rowMissing && !rowSelected && 'bg-card',
                ),
            )}
            style={{ width: cell.column.getSize(), flex: `0 0 ${cell.column.getSize()}px` }}
            role="cell"
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        )
      })}
    </motion.div>
  )
}

export function createOuterElement(
  onHorizontalScroll: (left: number) => void,
  scrollRef: { current: HTMLDivElement | null },
) {
  return forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { style?: CSSProperties }>(
    function OuterElement({ onScroll, style, children, ...rest }, ref) {
      const handleScroll = (event: UIEvent<HTMLDivElement>) => {
        onHorizontalScroll(event.currentTarget.scrollLeft)
        onScroll?.(event)
      }

      return (
        <div
          {...rest}
          ref={(node) => {
            scrollRef.current = node
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
          className="!overflow-auto"
          style={style}
          onScroll={handleScroll}
        >
          {children}
        </div>
      )
    },
  )
}
