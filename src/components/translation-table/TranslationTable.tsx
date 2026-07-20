/**
 * Virtualized translation grid (TanStack Virtual).
 *
 * Locale pane owns overflow (x+y). Key pane is overflow-hidden and mirrors
 * vertical position via imperative `translateY` (same-frame as scroll), so the
 * horizontal scrollbar never sits under the key column and panes stay locked.
 *
 * Motion: `layoutMotion` overrides row `top` / `translateY` during FLIP.
 * Prefer `displayProject` from `useTranslationStore` (includes hold keys).
 */
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  useTranslationColumns,
  useTranslationTableModel,
} from '@/components/translation-table/columns'
import { LocaleTableHeader } from '@/components/translation-table/LocaleTableHeader'
import { useLocalePaneScrollSync } from '@/components/translation-table/tableScroll'
import {
  KEY_COLUMN_WIDTH,
  ROW_HEIGHT,
  VirtualRow,
  type VirtualRowData,
} from '@/components/translation-table/virtualization'
import { useKeyDragSelection } from '@/hooks/useKeyDragSelection'
import { useTranslationStore } from '@/hooks/useTranslationStore'

export function TranslationTable() {
  const { displayProject } = useTranslationStore()
  if (!displayProject) {
    return null
  }
  return <TranslationTableContent />
}

function TranslationTableContent() {
  const {
    displayProject,
    editCell,
    deleteRow,
    renameKey,
    leaveFreshKey,
    clearPendingKeyEdit,
    missingFilterKeys,
    freshKeys,
    pendingKeyEdit,
    selectedKeys,
    selectKeys,
    enteringKeys,
    fadeEnteringKeys,
    loadEntering,
    flashingKeys,
    exitingKeys,
    layoutMotion,
    filterLayoutMode,
  } = useTranslationStore()
  const project = displayProject!

  const bodyRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const keyInnerRef = useRef<HTMLDivElement>(null)
  const localePaneRef = useRef<HTMLDivElement>(null)
  const [keyPaneHeight, setKeyPaneHeight] = useState(480)
  /** Match header viewport to locale body (excludes classic vertical scrollbar). */
  const [localeScrollbarY, setLocaleScrollbarY] = useState(0)

  const freshKeySet = useMemo(() => new Set(freshKeys), [freshKeys])
  const selectedKeySet = useMemo(() => new Set(selectedKeys), [selectedKeys])
  const enteringKeySet = useMemo(() => new Set(enteringKeys), [enteringKeys])
  const fadeEnteringKeySet = useMemo(() => new Set(fadeEnteringKeys), [fadeEnteringKeys])
  const flashingKeySet = useMemo(() => new Set(flashingKeys), [flashingKeys])
  const exitingKeySet = useMemo(() => new Set(exitingKeys), [exitingKeys])
  const orderedKeys = useMemo(() => project.rows.map((row) => row.key), [project.rows])
  const { beginSelectionDrag } = useKeyDragSelection(
    orderedKeys,
    selectKeys,
    selectedKeys,
  )

  const columns = useTranslationColumns({
    project,
    onEdit: editCell,
    onDeleteRow: deleteRow,
    onRenameKey: renameKey,
    freshKeySet,
    pendingKeyEdit,
    onClearPendingKeyEdit: clearPendingKeyEdit,
    onSelectionPointerDown: beginSelectionDrag,
  })

  const table = useTranslationTableModel(project, columns)
  const { rows } = table.getRowModel()
  const localesWidth = table
    .getAllColumns()
    .filter((column) => column.id !== 'key')
    .reduce((sum, column) => sum + column.getSize(), 0)


  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => localePaneRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()
  // Keep in sync with imperative updates in `useLocalePaneScrollSync` so React
  // re-renders (virtualizer) do not wipe the key-pane transform.
  const scrollTop = localePaneRef.current?.scrollTop ?? 0

  useLayoutEffect(() => {
    const locale = localePaneRef.current
    if (!locale) {
      return
    }
    const measure = (): void => {
      setKeyPaneHeight(Math.max(locale.clientHeight, 0))
      setLocaleScrollbarY(Math.max(0, locale.offsetWidth - locale.clientWidth))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(locale)
    return () => observer.disconnect()
  }, [rows.length, localesWidth])

  useLocalePaneScrollSync({
    bodyRef,
    headerRef,
    keyInnerRef,
    localePaneRef,
    deps: [rows.length, localesWidth, totalSize, localeScrollbarY],
  })

  const sharedData = useMemo(
    () => ({
      rows,
      sourceLocale: project.sourceLocale,
      locales: project.columns.map((column) => column.locale),
      stripeMissingRows: missingFilterKeys === null,
      freshKeys: freshKeySet,
      selectedKeys: selectedKeySet,
      enteringKeys: enteringKeySet,
      fadeEnteringKeys: fadeEnteringKeySet,
      loadEntering,
      flashingKeys: flashingKeySet,
      exitingKeys: exitingKeySet,
      layoutMotion,
      filterLayoutMode,
      onLeaveFreshKey: leaveFreshKey,
    }),
    [
      rows,
      project,
      missingFilterKeys,
      freshKeySet,
      selectedKeySet,
      enteringKeySet,
      fadeEnteringKeySet,
      loadEntering,
      flashingKeySet,
      exitingKeySet,
      layoutMotion,
      filterLayoutMode,
      leaveFreshKey,
    ],
  )

  const keyData = useMemo<VirtualRowData>(
    () => ({ ...sharedData, pane: 'key', paneWidth: KEY_COLUMN_WIDTH }),
    [sharedData],
  )
  const localeData = useMemo<VirtualRowData>(
    () => ({ ...sharedData, pane: 'locales', paneWidth: localesWidth }),
    [sharedData, localesWidth],
  )

  const localeHeaders = table
    .getHeaderGroups()
    .flatMap((group) => group.headers.filter((header) => header.id !== 'key'))

  return (
    <div
      className="bg-card grid h-full min-h-0 min-w-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border shadow-sm"
      role="table"
    >
      <LocaleTableHeader
        headerRef={headerRef}
        localeHeaders={localeHeaders}
        localesWidth={localesWidth}
        localeScrollbarY={localeScrollbarY}
      />

      <div ref={bodyRef} className="flex min-h-0 min-w-0 overflow-hidden">
        <div
          className="bg-card flex shrink-0 flex-col border-r"
          style={{ width: KEY_COLUMN_WIDTH }}
        >
          <div className="overflow-hidden" style={{ height: keyPaneHeight }}>
            <div
              ref={keyInnerRef}
              className="relative will-change-transform"
              style={{
                height: totalSize,
                width: KEY_COLUMN_WIDTH,
                transform: `translateY(${-scrollTop}px)`,
              }}
            >
              {virtualRows.map((virtualRow) => (
                <VirtualRow
                  key={`key-${rows[virtualRow.index]?.id ?? virtualRow.key}`}
                  index={virtualRow.index}
                  start={virtualRow.start}
                  data={keyData}
                />
              ))}
            </div>
          </div>
        </div>

        <div
          ref={localePaneRef}
          className="min-h-0 min-w-0 flex-1 overflow-auto"
        >
          <div
            className="relative"
            style={{
              height: totalSize,
              width: localesWidth,
              minWidth: localesWidth,
            }}
          >
            {virtualRows.map((virtualRow) => (
              <VirtualRow
                key={`loc-${rows[virtualRow.index]?.id ?? virtualRow.key}`}
                index={virtualRow.index}
                start={virtualRow.start}
                data={localeData}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
