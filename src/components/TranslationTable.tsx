import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type UIEvent,
} from 'react'
import { FixedSizeList as List, type ListChildComponentProps } from 'react-window'
import type { TranslationRow } from '@shared/types'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { TranslationProject } from '@/services/translationProject'
import { isMissingAgainstSource } from '@/services/translationProject'

const ROW_HEIGHT = 40
const KEY_COLUMN_WIDTH = 280
const LOCALE_COLUMN_WIDTH = 260

interface TranslationTableProps {
  project: TranslationProject
  onEdit: (key: string, locale: string, value: string) => void
  /** Stripe rows with missing translations — only when missing-filter is off. */
  stripeMissingRows?: boolean
}

type TableRows = ReturnType<ReturnType<typeof useReactTable<TranslationRow>>['getRowModel']>['rows']

interface VirtualRowData {
  rows: TableRows
  sourceLocale: string
  totalWidth: number
  locales: string[]
  stripeMissingRows: boolean
}

function VirtualRow({ index, style, data }: ListChildComponentProps<VirtualRowData>) {
  const row = data.rows[index]
  if (!row) {
    return null
  }

  const rowMissing =
    data.stripeMissingRows &&
    data.locales.some((locale) =>
      isMissingAgainstSource(row.original, locale, data.sourceLocale),
    )

  return (
    <div
      className={cn('flex border-b', rowMissing && 'row-missing-stripe')}
      style={{ ...style, width: data.totalWidth, minWidth: data.totalWidth }}
      role="row"
    >
      {row.getVisibleCells().map((cell) => {
        const locale = cell.column.id === 'key' ? null : cell.column.id
        const missing =
          locale !== null &&
          isMissingAgainstSource(row.original, locale, data.sourceLocale)
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

function createOuterElement(
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

export function TranslationTable({
  project,
  onEdit,
  stripeMissingRows = false,
}: TranslationTableProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const listScrollRef = useRef<HTMLDivElement | null>(null)
  const [viewport, setViewport] = useState({ width: 800, height: 480 })
  const [scrollbarWidth, setScrollbarWidth] = useState(0)

  useEffect(() => {
    const node = bodyRef.current
    if (!node) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) {
        return
      }

      setViewport({
        width: Math.max(entry.contentRect.width, 200),
        height: Math.max(entry.contentRect.height, 200),
      })
    })

    observer.observe(node)
    setViewport({
      width: Math.max(node.clientWidth, 200),
      height: Math.max(node.clientHeight, 200),
    })

    return () => observer.disconnect()
  }, [])

  const syncHeaderScroll = useCallback((left: number) => {
    if (headerRef.current) {
      headerRef.current.scrollLeft = left
    }
  }, [])

  const OuterElement = useMemo(
    () => createOuterElement(syncHeaderScroll, listScrollRef),
    [syncHeaderScroll],
  )

  const columns = useMemo<ColumnDef<TranslationRow>[]>(() => {
    const keyColumn: ColumnDef<TranslationRow> = {
      id: 'key',
      accessorKey: 'key',
      header: 'Key',
      size: KEY_COLUMN_WIDTH,
      cell: (info) => (
        <span className="block w-full truncate font-mono text-xs">
          {info.getValue<string>()}
        </span>
      ),
    }

    const localeColumns: ColumnDef<TranslationRow>[] = project.columns.map((column) => ({
      id: column.locale,
      accessorFn: (row) => row.values[column.locale] ?? '',
      header: () => (
        <div className="grid gap-0.5">
          <span className="tracking-wide uppercase">{column.locale}</span>
          <span className="text-muted-foreground font-mono text-[0.72rem] font-normal">
            {column.fileName}
          </span>
        </div>
      ),
      size: LOCALE_COLUMN_WIDTH,
      cell: (info) => {
        const row = info.row.original
        const value = info.getValue<string>()
        const missing = isMissingAgainstSource(row, column.locale, project.sourceLocale)

        return (
          <Input
            className={cn(
              'h-8 border-transparent bg-transparent shadow-none focus-visible:bg-background',
              missing && 'border-destructive/40 bg-destructive/10',
            )}
            value={value}
            aria-label={`${row.key} · ${column.locale}`}
            onChange={(event) => onEdit(row.key, column.locale, event.target.value)}
          />
        )
      },
    }))

    return [keyColumn, ...localeColumns]
  }, [project.columns, project.sourceLocale, onEdit])

  const table = useReactTable({
    data: project.rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.key,
  })

  const { rows } = table.getRowModel()
  const totalWidth = table.getAllColumns().reduce((sum, column) => sum + column.getSize(), 0)

  useLayoutEffect(() => {
    const scrollEl = listScrollRef.current
    if (!scrollEl) {
      return
    }

    const measure = (): void => {
      setScrollbarWidth(Math.max(0, scrollEl.offsetWidth - scrollEl.clientWidth))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(scrollEl)
    return () => observer.disconnect()
  }, [rows.length, viewport.height, viewport.width, totalWidth])

  const InnerElement = useMemo(
    () =>
      forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function InnerElement(
        { style, ...rest },
        ref,
      ) {
        return (
          <div
            ref={ref}
            {...rest}
            style={{
              ...style,
              width: totalWidth,
              minWidth: totalWidth,
            }}
          />
        )
      }),
    [totalWidth],
  )

  const itemData = useMemo<VirtualRowData>(
    () => ({
      rows,
      sourceLocale: project.sourceLocale,
      totalWidth,
      locales: project.columns.map((column) => column.locale),
      stripeMissingRows,
    }),
    [rows, project.sourceLocale, project.columns, totalWidth, stripeMissingRows],
  )

  return (
    <div className="bg-card grid h-full min-h-0 min-w-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border shadow-sm">
      <div className="bg-muted overflow-hidden border-b" ref={headerRef}>
        <div
          className="flex"
          style={{
            width: totalWidth,
            minWidth: totalWidth,
            paddingRight: scrollbarWidth,
            boxSizing: 'content-box',
          }}
          role="row"
        >
          {table.getHeaderGroups().map((headerGroup) =>
            headerGroup.headers.map((header) => {
              const isKey = header.id === 'key'
              return (
                <div
                  key={header.id}
                  className={cn(
                    'flex min-h-[52px] min-w-0 items-center border-r px-2.5 text-xs font-semibold',
                    isKey && 'bg-muted sticky left-0 z-[3]',
                  )}
                  style={{ width: header.getSize(), flex: `0 0 ${header.getSize()}px` }}
                  role="columnheader"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </div>
              )
            }),
          )}
        </div>
      </div>

      <div className="relative min-h-0 min-w-0 overflow-hidden" ref={bodyRef}>
        <List
          height={viewport.height}
          width={viewport.width}
          itemCount={rows.length}
          itemSize={ROW_HEIGHT}
          itemData={itemData}
          itemKey={(index) => rows[index]?.id ?? String(index)}
          outerElementType={OuterElement}
          innerElementType={InnerElement}
        >
          {VirtualRow}
        </List>
      </div>
    </div>
  )
}
