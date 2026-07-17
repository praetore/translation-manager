/**
 * Dual-pane virtualized translation grid.
 *
 * Why two `react-window` lists:
 * - Key column stays fixed-width and vertically synced.
 * - Locale pane scrolls horizontally (many locales) and vertically.
 * Locale outer scroll is the source of truth; `useSyncedPaneScroll` drives
 * both lists together (wheel capture) so the key pane never drifts.
 *
 * Motion: `layoutMotion` overrides row `top` / `translateY` during FLIP.
 * `VirtualRowData` carries enter/exit/flash sets so both panes share one paint.
 * Prefer `displayProject` from `useTranslationStore` (includes hold keys).
 */
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { FixedSizeList as List, type FixedSizeList } from 'react-window'
import {
  flexRender,
  useTranslationColumns,
  useTranslationTableModel,
} from '@/components/translation-table/columns'
import {
  createInner,
  KeyOuter,
  useSyncedPaneScroll,
} from '@/components/translation-table/tableScroll'
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
    flashingKeys,
    exitingKeys,
    layoutMotion,
    filterLayoutMode,
  } = useTranslationStore()
  const project = displayProject!

  const bodyRef = useRef<HTMLDivElement>(null)
  const localePaneRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const keyOuterRef = useRef<HTMLDivElement>(null)
  const localeOuterRef = useRef<HTMLDivElement>(null)
  const keyListRef = useRef<FixedSizeList>(null)
  const localeListRef = useRef<FixedSizeList>(null)
  const [bodySize, setBodySize] = useState({ width: 800, height: 480 })
  const [localeWidth, setLocaleWidth] = useState(520)
  const [scrollbarSize, setScrollbarSize] = useState({ width: 0, height: 0 })

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

  useLayoutEffect(() => {
    const body = bodyRef.current
    const localePane = localePaneRef.current
    if (!body || !localePane) {
      return
    }
    const measure = (): void => {
      setBodySize({
        width: Math.max(body.clientWidth, 200),
        height: Math.max(body.clientHeight, 200),
      })
      setLocaleWidth(Math.max(localePane.clientWidth, 200))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(body)
    observer.observe(localePane)
    return () => observer.disconnect()
  }, [])

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

  useSyncedPaneScroll({
    bodyRef,
    headerRef,
    keyOuterRef,
    localeOuterRef,
    keyListRef,
    localeListRef,
    setScrollbarSize,
    deps: [rows.length, bodySize.height, localeWidth, localesWidth],
  })

  const KeyInner = useMemo(() => createInner(KEY_COLUMN_WIDTH), [])
  const LocaleInner = useMemo(() => createInner(localesWidth), [localesWidth])

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

  const itemKey = useCallback(
    (index: number) => rows[index]?.id ?? String(index),
    [rows],
  )

  const localeHeaders = table
    .getHeaderGroups()
    .flatMap((group) => group.headers.filter((header) => header.id !== 'key'))

  const keyListHeight = Math.max(bodySize.height - scrollbarSize.height, 0)

  return (
      <div className="bg-card grid h-full min-h-0 min-w-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border shadow-sm">
        <div className="bg-muted flex min-w-0 border-b">
          <div
            className="flex min-h-[52px] shrink-0 items-center border-r px-2.5 text-xs font-semibold"
            style={{ width: KEY_COLUMN_WIDTH }}
            role="columnheader"
          >
            Key
          </div>
          <div className="min-w-0 flex-1 overflow-hidden" ref={headerRef}>
            <div
              className="flex"
              style={{
                width: localesWidth,
                minWidth: localesWidth,
                paddingRight: scrollbarSize.width,
                boxSizing: 'content-box',
              }}
              role="row"
            >
              {localeHeaders.map((header) => (
                <div
                  key={header.id}
                  className="flex min-h-[52px] min-w-0 items-center border-r px-2.5 text-xs font-semibold"
                  style={{ width: header.getSize(), flex: `0 0 ${header.getSize()}px` }}
                  role="columnheader"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 overflow-hidden" ref={bodyRef}>
          <div
            className="bg-card flex h-full min-h-0 shrink-0 flex-col border-r"
            style={{ width: KEY_COLUMN_WIDTH }}
          >
            <List
              ref={keyListRef}
              outerRef={keyOuterRef}
              outerElementType={KeyOuter}
              height={keyListHeight}
              width={KEY_COLUMN_WIDTH}
              itemCount={rows.length}
              itemSize={ROW_HEIGHT}
              itemData={keyData}
              itemKey={itemKey}
              innerElementType={KeyInner}
            >
              {VirtualRow}
            </List>
          </div>

          <div className="h-full min-h-0 min-w-0 flex-1 overflow-hidden" ref={localePaneRef}>
            <List
              ref={localeListRef}
              outerRef={localeOuterRef}
              height={bodySize.height}
              width={localeWidth}
              itemCount={rows.length}
              itemSize={ROW_HEIGHT}
              itemData={localeData}
              itemKey={itemKey}
              innerElementType={LocaleInner}
            >
              {VirtualRow}
            </List>
          </div>
        </div>
      </div>
  )
}
