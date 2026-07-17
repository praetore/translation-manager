import { Pencil, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/i18n/LocaleProvider'

interface KeyCellProps {
  keyName: string
  onDeleteRow: (key: string) => void
  onRenameKey: (oldKey: string, newKey: string) => boolean
  /** Open in edit mode (e.g. freshly added row). */
  autoEdit?: boolean
  onAutoEditHandled?: () => void
}

export function KeyCell({
  keyName,
  onDeleteRow,
  onRenameKey,
  autoEdit = false,
  onAutoEditHandled,
}: KeyCellProps) {
  const { t } = useI18n()
  const [manualEditing, setManualEditing] = useState(false)
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
    input.select()
    const timer = window.setTimeout(() => {
      blurReadyRef.current = true
    }, 0)

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
    <div className="group/key flex w-full min-w-0 items-center gap-1">
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/key:opacity-100 focus-within:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive size-6"
          title={t('table.deleteRow')}
          aria-label={t('table.deleteRow')}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (window.confirm(t('table.deleteConfirm', { key: keyName }))) {
              onDeleteRow(keyName)
            }
          }}
        >
          <Trash2 className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground size-6"
          title={t('table.editKey')}
          aria-label={t('table.editKey')}
          onMouseDown={(event) => {
            event.preventDefault()
            setManualEditing(true)
          }}
        >
          <Pencil className="size-3.5" />
        </Button>
      </div>
      <span className="block min-w-0 flex-1 truncate font-mono text-xs">{keyName}</span>
    </div>
  )
}
