import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { useMemo } from 'react'
import type { TranslationRow } from '@shared/types'
import { Input } from '@/components/ui/input'
import { KeyCell } from '@/components/translation-table/KeyCell'
import {
  KEY_COLUMN_WIDTH,
  LOCALE_COLUMN_WIDTH,
} from '@/components/translation-table/virtualization'
import type { SelectionPointerHandler } from '@/hooks/useKeyDragSelection'
import { useI18n } from '@/i18n/LocaleProvider'
import { cn } from '@/lib/utils'
import type { TranslationProject } from '@/services/translationProject'
import { isMissingAgainstSource } from '@/services/translationProject'
import { LocaleFlag } from '@/components/common/LocaleFlag'
import { localeDisplayName } from '@shared/locale'

export function useTranslationColumns({
  project,
  onEdit,
  onDeleteRow,
  onRenameKey,
  freshKeySet,
  pendingKeyEdit,
  onClearPendingKeyEdit,
  onSelectionPointerDown,
}: {
  project: TranslationProject
  onEdit: (key: string, locale: string, value: string) => void
  onDeleteRow: (key: string) => void
  onRenameKey: (oldKey: string, newKey: string) => boolean
  freshKeySet: ReadonlySet<string>
  pendingKeyEdit: string | null
  onClearPendingKeyEdit: () => void
  onSelectionPointerDown: SelectionPointerHandler
}): ColumnDef<TranslationRow>[] {
  const { t, locale } = useI18n()

  return useMemo(() => {
    const keyColumn: ColumnDef<TranslationRow> = {
      id: 'key',
      accessorKey: 'key',
      header: t('table.key'),
      size: KEY_COLUMN_WIDTH,
      cell: (info) => {
        const keyName = info.getValue<string>()
        return (
          <KeyCell
            keyName={keyName}
            rowIndex={info.row.index}
            onSelectionPointerDown={onSelectionPointerDown}
            onDeleteRow={onDeleteRow}
            onRenameKey={onRenameKey}
            autoEdit={pendingKeyEdit === keyName}
            onAutoEditHandled={onClearPendingKeyEdit}
          />
        )
      },
    }

    const localeColumns: ColumnDef<TranslationRow>[] = project.columns.map((column) => ({
      id: column.locale,
      accessorFn: (row) => row.values[column.locale] ?? '',
      header: () => {
        const languageName = localeDisplayName(column.locale, locale)
        return (
          <div className="grid gap-0.5">
            <span className="flex items-center gap-1.5">
              <LocaleFlag locale={column.locale} />
              <span className="tracking-wide uppercase">{column.locale}</span>
              {languageName ? (
                <span className="text-muted-foreground font-normal normal-case">
                  · {languageName}
                </span>
              ) : null}
            </span>
            <span className="text-muted-foreground font-mono text-[0.72rem] font-normal">
              {column.fileName}
            </span>
          </div>
        )
      },
      size: LOCALE_COLUMN_WIDTH,
      cell: (info) => {
        const row = info.row.original
        const value = info.getValue<string>()
        const missing = isMissingAgainstSource(
          row,
          column.locale,
          project.sourceLocale,
          freshKeySet,
        )

        return (
          <Input
            className={cn(
              'h-8 rounded-none border-transparent bg-transparent shadow-none dark:bg-transparent',
              'focus-visible:border-transparent focus-visible:bg-transparent focus-visible:ring-0',
              missing && 'placeholder:text-destructive/80',
            )}
            value={value}
            aria-label={`${row.key} · ${column.locale}`}
            onChange={(event) => onEdit(row.key, column.locale, event.target.value)}
          />
        )
      },
    }))

    return [keyColumn, ...localeColumns]
  }, [
    t,
    locale,
    project.columns,
    project.sourceLocale,
    onEdit,
    onDeleteRow,
    onRenameKey,
    freshKeySet,
    pendingKeyEdit,
    onClearPendingKeyEdit,
    onSelectionPointerDown,
  ])
}

export function useTranslationTableModel(
  project: TranslationProject,
  columns: ColumnDef<TranslationRow>[],
) {
  return useReactTable({
    data: project.rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.key,
  })
}

export { flexRender }
