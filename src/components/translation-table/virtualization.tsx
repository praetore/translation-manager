import { flexRender, type Row } from '@tanstack/react-table'
import {
  forwardRef,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type UIEvent,
} from 'react'
import { type ListChildComponentProps } from 'react-window'
import type { TranslationRow } from '@shared/types'
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
  onLeaveFreshKey: (key: string) => void
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

  return (
    <div
      className={cn('flex border-b', rowMissing && 'row-missing-stripe')}
      style={{ ...style, width: data.totalWidth, minWidth: data.totalWidth }}
      role="row"
      onBlur={handleRowBlur}
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
              missing && 'bg-destructive/15',
              isKey &&
                cn(
                  'sticky left-0 z-[2]',
                  rowMissing ? 'row-missing-stripe-sticky' : 'bg-card',
                ),
            )}
            style={{ width: cell.column.getSize(), flex: `0 0 ${cell.column.getSize()}px` }}
            role="cell"
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        )
      })}
    </div>
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
