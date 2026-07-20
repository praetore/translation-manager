import { Pencil, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog'
import { Hint } from '@/components/common/Hint'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SelectionPointerHandler } from '@/hooks/useKeyDragSelection'
import { useI18n } from '@/i18n/LocaleProvider'

interface KeyCellProps {
  keyName: string
  rowIndex: number
  onSelectionPointerDown: SelectionPointerHandler
  onDeleteRow: (key: string) => void
  onRenameKey: (oldKey: string, newKey: string) => boolean
  /** Open in edit mode (e.g. freshly added row). */
  autoEdit?: boolean
  onAutoEditHandled?: () => void
}

export function KeyCell({
  keyName,
  rowIndex,
  onSelectionPointerDown,
  onDeleteRow,
  onRenameKey,
  autoEdit = false,
  onAutoEditHandled,
}: KeyCellProps) {
  const { t } = useI18n()
  const [manualEditing, setManualEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const editing = Boolean(autoEdit) || manualEditing
  const inputRef = useRef<HTMLInputElement>(null)
  const blurReadyRef = useRef(false)

  const finishEditing = useCallback(() => {
    setManualEditing(false)
    onAutoEditHandled?.()
  }, [onAutoEditHandled])

  useEffect(() => {
    if (!editing) {
      blurReadyRef.current = false
      return
    }

    blurReadyRef.current = false
    const input = inputRef.current
    if (!input) {
      return
    }

    input.focus()
    const end = input.value.length
    input.setSelectionRange(end, end)
    // Ignore blur from the activating click / DOM swap.
    const timer = window.setTimeout(() => {
      blurReadyRef.current = true
    }, 200)

    return () => window.clearTimeout(timer)
  }, [editing])

  const cancelEditing = useCallback(() => {
    finishEditing()
  }, [finishEditing])

  const commitEditing = useCallback(() => {
    const nextKey = inputRef.current?.value ?? keyName
    const ok = onRenameKey(keyName, nextKey)
    if (ok) {
      finishEditing()
      return
    }
    inputRef.current?.focus()
  }, [finishEditing, keyName, onRenameKey])

  const startEditing = useCallback(() => {
    setManualEditing(true)
  }, [])

  if (editing) {
    return (
      <div className="flex w-full min-w-0 items-center gap-1">
        <Input
          ref={inputRef}
          key={`edit-${keyName}`}
          className="h-8 min-w-0 flex-1 border-transparent bg-transparent font-mono text-xs shadow-none focus-visible:bg-background"
          defaultValue={keyName}
          placeholder={t('table.keyPlaceholder')}
          aria-label={t('table.editKey')}
          onBlur={() => {
            if (blurReadyRef.current) {
              commitEditing()
            }
          }}
          onKeyDown={(event) => {
            event.stopPropagation()
            if (event.key === 'Enter') {
              event.preventDefault()
              commitEditing()
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              cancelEditing()
            }
          }}
        />
      </div>
    )
  }

  return (
    <div
      className="group/key flex w-full min-w-0 items-center gap-1 rounded-sm"
      data-selection-index={rowIndex}
      onPointerDown={(event) => {
        if (event.button !== 0) {
          return
        }
        const target = event.target
        if (target instanceof Element && target.closest('button')) {
          return
        }
        onSelectionPointerDown(rowIndex, {
          shift: event.shiftKey,
          ctrl: event.ctrlKey || event.metaKey,
        })
      }}
      onDoubleClick={(event) => {
        const target = event.target
        if (target instanceof Element && target.closest('button')) {
          return
        }
        event.preventDefault()
        startEditing()
      }}
    >
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/key:opacity-100 focus-within:opacity-100">
        <Hint label={t('table.deleteRow')}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-6"
            aria-label={t('table.deleteRow')}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </Hint>
        <Hint label={t('table.editKey')}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground size-6"
            aria-label={t('table.editKey')}
            onMouseDown={(event) => {
              event.preventDefault()
              startEditing()
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
        </Hint>
      </div>
      <span className="block min-w-0 flex-1 cursor-default select-none truncate font-mono text-xs">
        {keyName}
      </span>
      <ConfirmDialog
        open={deleteOpen}
        title={t('table.deleteTitle')}
        description={t('table.deleteConfirm', { key: keyName })}
        cancelLabel={t('dialog.cancel')}
        confirmLabel={t('dialog.delete')}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => onDeleteRow(keyName)}
      />
    </div>
  )
}
