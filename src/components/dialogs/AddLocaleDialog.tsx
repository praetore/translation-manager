import { useCallback, useMemo, useState } from 'react'
import type { TranslationFormat } from '@shared/types'
import { adapterRegistry } from '@shared/adapters'
import {
  CATALOG_LOCALES,
  localeDisplayName,
  normalizeLocale,
} from '@shared/locale'
import { LocaleFlag } from '@/components/common/LocaleFlag'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n } from '@/i18n/LocaleProvider'
import { suggestLocaleFileName } from '@/services/addLocaleColumn'

const FORMATS = adapterRegistry.listFormats()

interface AddLocaleDialogProps {
  open: boolean
  existingLocales: readonly string[]
  templateFileName: string
  defaultFormat: TranslationFormat
  onClose: () => void
  onConfirm: (locale: string, format: TranslationFormat) => boolean
}

function LocaleOptionLabel({
  locale,
  displayLocale,
}: {
  locale: string
  displayLocale: string
}) {
  const name = localeDisplayName(locale, displayLocale)
  return (
    <>
      <LocaleFlag locale={locale} />
      <span className="uppercase tracking-wide">{locale}</span>
      {name ? (
        <span className="text-muted-foreground font-normal normal-case">
          · {name}
        </span>
      ) : null}
    </>
  )
}

export function AddLocaleDialog({
  open,
  existingLocales,
  templateFileName,
  defaultFormat,
  onClose,
  onConfirm,
}: AddLocaleDialogProps) {
  const { t, locale: uiLocale } = useI18n()
  const [locale, setLocale] = useState('')
  const [format, setFormat] = useState<TranslationFormat>(defaultFormat)
  const [submitError, setSubmitError] = useState(false)

  const taken = useMemo(
    () => new Set(existingLocales.map((item) => normalizeLocale(item))),
    [existingLocales],
  )
  const availableLocales = useMemo(
    () => CATALOG_LOCALES.filter((item) => !taken.has(item)),
    [taken],
  )

  const fileName = locale
    ? suggestLocaleFileName(templateFileName, locale, format)
    : ''
  const canSubmit = locale.length > 0 && availableLocales.includes(locale)

  const reset = useCallback(() => {
    setLocale('')
    setFormat(defaultFormat)
    setSubmitError(false)
  }, [defaultFormat])

  const submit = useCallback(() => {
    if (!canSubmit) {
      return
    }
    const ok = onConfirm(locale, format)
    if (ok) {
      reset()
      onClose()
      return
    }
    setSubmitError(true)
  }, [canSubmit, locale, format, onConfirm, onClose, reset])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset()
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('addLocale.title')}</DialogTitle>
          <DialogDescription>{t('addLocale.description')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          <div className="grid gap-2">
            <Label htmlFor="add-locale-code">{t('addLocale.locale')}</Label>
            <Select
              value={locale || undefined}
              onValueChange={(value) => {
                setLocale(value)
                setSubmitError(false)
              }}
              disabled={availableLocales.length === 0}
            >
              <SelectTrigger
                id="add-locale-code"
                className="w-full"
                aria-invalid={submitError || undefined}
              >
                <SelectValue placeholder={t('addLocale.localePlaceholder')}>
                  {locale ? (
                    <span className="flex items-center gap-2">
                      <LocaleOptionLabel locale={locale} displayLocale={uiLocale} />
                    </span>
                  ) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {availableLocales.map((item) => (
                  <SelectItem key={item} value={item}>
                    <LocaleOptionLabel locale={item} displayLocale={uiLocale} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableLocales.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                {t('addLocale.noneAvailable')}
              </p>
            ) : null}
            {submitError ? (
              <p className="text-destructive text-xs">{t('addLocale.duplicateLocale')}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="add-locale-format">{t('addLocale.format')}</Label>
            <Select
              value={format}
              onValueChange={(value) => setFormat(value as TranslationFormat)}
            >
              <SelectTrigger id="add-locale-format" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {t(`addLocale.formats.${item}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {canSubmit ? (
            <p className="text-muted-foreground font-mono text-xs">
              {t('addLocale.filePreview', { fileName })}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset()
              onClose()
            }}
          >
            {t('dialog.cancel')}
          </Button>
          <Button type="button" disabled={!canSubmit} onClick={submit}>
            {t('addLocale.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
