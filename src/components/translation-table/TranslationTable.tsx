import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
} from 'react'
import { FixedSizeList as List } from 'react-window'
import {
  flexRender,
  useTranslationColumns,
  useTranslationTableModel,
} from '@/components/translation-table/columns'
import {
  createOuterElement,
  ROW_HEIGHT,
  VirtualRow,
  type VirtualRowData,
} from '@/components/translation-table/virtualization'
import { SelectedKeysProvider } from '@/components/translation-table/selectionContext'
import { useKeyDragSelection } from '@/hooks/useKeyDragSelection'
import { useTranslationStore } from '@/hooks/useTranslationStore'
import { cn } from '@/lib/utils'
import type { TranslationProject } from '@/services/translationProject'

function TranslationTableView({
  project,
  onEdit,
  onDeleteRow,
  onRenameKey,
  onLeaveFreshKey,
  stripeMissingRows,
  freshKeys,
  pendingKeyEdit,
  onClearPendingKeyEdit,
  selectedKeys,
  selectKeys,
  enteringKeys,
  flashingKeys,
  exitingKeys,
}: {
  project: TranslationProject
  onEdit: (key: string, locale: string, value: string) => void
  onDeleteRow: (key: string) => void
  onRenameKey: (oldKey: string, newKey: string) => boolean
  onLeaveFreshKey: (key: string) => void
  stripeMissingRows: boolean
  freshKeys: readonly string[]
  pendingKeyEdit: string | null
  onClearPendingKeyEdit: () => void
  selectedKeys: readonly string[]
  selectKeys: (keys: string[]) => void
  enteringKeys: readonly string[]
  flashingKeys: readonly string[]
  exitingKeys: readonly string[]
}) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const listScrollRef = useRef<HTMLDivElement | null>(null)
  const [viewport, setViewport] = useState({ width: 800, height: 480 })
  const [scrollbarWidth, setScrollbarWidth] = useState(0)
  const freshKeySet = useMemo(() => new Set(freshKeys), [freshKeys])
  const selectedKeySet = useMemo(() => new Set(selectedKeys), [selectedKeys])
  const enteringKeySet = useMemo(() => new Set(enteringKeys), [enteringKeys])
  const flashingKeySet = useMemo(() => new Set(flashingKeys), [flashingKeys])
  const exitingKeySet = useMemo(() => new Set(exitingKeys), [exitingKeys])
  const orderedKeys = useMemo(() => project.rows.map((row) => row.key), [project.rows])
  const { beginSelectionDrag } = useKeyDragSelection(
    orderedKeys,
    selectKeys,
    selectedKeys,
  )

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
    // createOuterElement only stores the ref handle; it does not read .current here.
    // eslint-disable-next-line react-hooks/refs -- scroll container ref is assigned later in the outer element
    () => createOuterElement(syncHeaderScroll, listScrollRef),
    [syncHeaderScroll],
  )

  const columns = useTranslationColumns({
    project,
    onEdit,
    onDeleteRow,
    onRenameKey,
    freshKeySet,
    pendingKeyEdit,
    onClearPendingKeyEdit,
    onSelectionPointerDown: beginSelectionDrag,
  })

  const table = useTranslationTableModel(project, columns)
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
      freshKeys: freshKeySet,
      selectedKeys: selectedKeySet,
      enteringKeys: enteringKeySet,
      flashingKeys: flashingKeySet,
      exitingKeys: exitingKeySet,
      onLeaveFreshKey,
    }),
    [
      rows,
      project.sourceLocale,
      project.columns,
      totalWidth,
      stripeMissingRows,
      freshKeySet,
      selectedKeySet,
      enteringKeySet,
      flashingKeySet,
      exitingKeySet,
      onLeaveFreshKey,
    ],
  )

  return (
    <SelectedKeysProvider selectedKeys={selectedKeySet}>
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
    </SelectedKeysProvider>
  )
}

export function TranslationTable() {
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
    flashingKeys,
    exitingKeys,
  } = useTranslationStore()

  if (!displayProject) {
    return null
  }

  return (
    <TranslationTableView
      project={displayProject}
      onEdit={editCell}
      onDeleteRow={deleteRow}
      onRenameKey={renameKey}
      onLeaveFreshKey={leaveFreshKey}
      stripeMissingRows={missingFilterKeys === null}
      freshKeys={freshKeys}
      pendingKeyEdit={pendingKeyEdit}
      onClearPendingKeyEdit={clearPendingKeyEdit}
      selectedKeys={selectedKeys}
      selectKeys={selectKeys}
      enteringKeys={enteringKeys}
      flashingKeys={flashingKeys}
      exitingKeys={exitingKeys}
    />
  )
}
