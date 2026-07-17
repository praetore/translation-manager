import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { LocaleFlag } from '@/components/LocaleFlag'
import { useI18n } from '@/i18n/LocaleProvider'
import { cn } from '@/lib/utils'
import type { FilePickerState } from '@/services/classifyTranslationFiles'
import { localeDisplayName } from '@shared/locale'

interface OpenProjectFilesDialogProps {
  picker: FilePickerState
  onCancel: () => void
  onConfirm: (selectedPaths: readonly string[]) => void
}

export function OpenProjectFilesDialog({
  picker,
  onCancel,
  onConfirm,
}: OpenProjectFilesDialogProps) {
  const { t, locale: uiLocale } = useI18n()
  const allPaths = useMemo(
    () => picker.candidates.map((item) => item.filePath),
    [picker.candidates],
  )
  // Remount via `key` when the picker session changes (see App).
  const [selected, setSelected] = useState(() => new Set(allPaths))

  const selectedCount = selected.size
  const allSelected = selectedCount === allPaths.length && allPaths.length > 0

  const toggle = (filePath: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(filePath)) {
        next.delete(filePath)
      } else {
        next.add(filePath)
      }
      return next
    })
  }

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(allPaths))
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) {
          onCancel()
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[min(85vh,32rem)] max-w-lg flex-col gap-4 overflow-hidden"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>{t('openFiles.title')}</DialogTitle>
          <DialogDescription className="break-all">
            {t('openFiles.description', { path: picker.directoryPath })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <div className="flex shrink-0 items-center justify-between gap-2">
            <h3 className="text-sm font-medium">
              {t('openFiles.validHeading', { count: picker.candidates.length })}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 shrink-0 px-2 text-xs"
              onClick={toggleAll}
            >
              {allSelected ? t('openFiles.deselectAll') : t('openFiles.selectAll')}
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-lg border">
            <ul className="divide-border divide-y">
              {picker.candidates.map((item) => {
                const checked = selected.has(item.filePath)
                const languageName = localeDisplayName(item.locale, uiLocale)
                const id = `open-file-${item.filePath}`
                return (
                  <li key={item.filePath}>
                    <Label
                      htmlFor={id}
                      className={cn(
                        'hover:bg-muted/50 flex cursor-pointer items-start gap-3 px-3 py-2.5 font-normal',
                        checked && 'bg-muted/30',
                      )}
                    >
                      <input
                        id={id}
                        type="checkbox"
                        className="border-input text-primary mt-1.5 size-4 shrink-0 rounded border"
                        checked={checked}
                        onChange={() => toggle(item.filePath)}
                      />
                      <LocaleFlag locale={item.locale} className="mt-1" />
                      <span className="grid min-w-0 gap-0.5">
                        <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm font-medium">
                          {languageName ? (
                            <span className="text-foreground">{languageName}</span>
                          ) : null}
                          <span className="text-muted-foreground font-mono text-xs font-normal uppercase tracking-wide">
                            {item.locale}
                          </span>
                          <span className="text-muted-foreground font-normal">
                            · {item.format}
                          </span>
                        </span>
                        <span className="text-muted-foreground truncate font-mono text-xs">
                          {item.fileName}
                        </span>
                      </span>
                    </Label>
                  </li>
                )
              })}
            </ul>

            {picker.skipped.length > 0 ? (
              <div className="border-border border-t">
                <h3 className="text-muted-foreground px-3 pt-3 pb-1.5 text-xs font-medium tracking-wide uppercase">
                  {t('openFiles.skippedHeading', { count: picker.skipped.length })}
                </h3>
                <ul className="bg-muted/20 divide-border divide-y">
                  {picker.skipped.map((item) => (
                    <li
                      key={item.filePath}
                      className="text-muted-foreground grid gap-0.5 px-3 py-2.5 text-sm"
                    >
                      <span className="text-foreground font-mono text-xs">
                        {item.fileName}
                      </span>
                      <span className="text-xs">
                        {t(`openFiles.skipReason.${item.reason}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('dialog.cancel')}
          </Button>
          <Button
            type="button"
            disabled={selectedCount === 0}
            onClick={() => onConfirm([...selected])}
          >
            {t('openFiles.confirm', { count: selectedCount })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
