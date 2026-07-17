import { flexRender, type Row } from '@tanstack/react-table'
import { type CSSProperties, type FocusEvent } from 'react'
import { type ListChildComponentProps } from 'react-window'
import type { TranslationRow } from '@shared/types'
import {
  resolveRowMotion,
  resolveRowTone,
  translationRowVariants,
} from '@/components/translation-table/rowVariants'
import { ROW_HEIGHT } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { isMissingAgainstSource } from '@/services/translationProject'
import type { RowLayoutMotion } from '@/store/types'

export { ROW_HEIGHT }
export const KEY_COLUMN_WIDTH = 280
export const LOCALE_COLUMN_WIDTH = 260

export type TablePane = 'key' | 'locales'

export interface VirtualRowData {
  rows: Array<Row<TranslationRow>>
  sourceLocale: string
  pane: TablePane
  paneWidth: number
  locales: string[]
  stripeMissingRows: boolean
  freshKeys: ReadonlySet<string>
  selectedKeys: ReadonlySet<string>
  enteringKeys: ReadonlySet<string>
  fadeEnteringKeys: ReadonlySet<string>
  flashingKeys: ReadonlySet<string>
  exitingKeys: ReadonlySet<string>
  layoutMotion: Record<string, RowLayoutMotion> | null
  filterLayoutMode: 'collapse' | 'expand' | null
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
    if (next instanceof HTMLElement) {
      const nextRow = next.closest('[data-row-key]')
      if (nextRow?.getAttribute('data-row-key') === row.original.key) {
        return
      }
    }
    data.onLeaveFreshKey(row.original.key)
  }

  const rowSelected = data.selectedKeys.has(row.original.key)
  const layout = data.layoutMotion?.[row.original.key]
  const top = layout?.top ?? readTop(style)
  const fadeEntering = data.fadeEnteringKeys.has(row.original.key)
  const cells = row.getVisibleCells().filter((cell) =>
    data.pane === 'key' ? cell.column.id === 'key' : cell.column.id !== 'key',
  )

  return (
    <div
      className={cn(
        translationRowVariants({
          tone: resolveRowTone(rowMissing, rowSelected),
          motion: resolveRowMotion(
            data.enteringKeys.has(row.original.key) || fadeEntering,
            data.exitingKeys.has(row.original.key),
            data.flashingKeys.has(row.original.key),
            fadeEntering,
          ),
        }),
        layout && layout.animate && 'row-layout',
        layout && rowMissing && data.filterLayoutMode === 'collapse' && 'row-stripe-fade',
      )}
      style={{
        position: 'absolute',
        left: 0,
        top,
        height: style.height,
        width: data.paneWidth,
        minWidth: data.paneWidth,
        transform: layout ? `translateY(${layout.shiftY}px)` : undefined,
      }}
      role="row"
      aria-selected={rowSelected}
      data-row-key={row.original.key}
      onBlur={handleRowBlur}
    >
      {cells.map((cell) => {
        const locale = cell.column.id === 'key' ? null : cell.column.id
        const missing =
          locale !== null &&
          isMissingAgainstSource(
            row.original,
            locale,
            data.sourceLocale,
            data.freshKeys,
          )

        return (
          <div
            key={cell.id}
            className={cn(
              'flex min-w-0 items-center border-r px-2.5',
              missing && !rowSelected && 'bg-destructive/15',
              missing && rowSelected && 'bg-primary/15',
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
