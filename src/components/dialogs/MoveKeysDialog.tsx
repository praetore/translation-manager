import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/i18n/LocaleProvider'
import { applyKeyLead, hasIncompleteDollarToken, validateLeadTemplate } from '@/services/keyPaths'

const EXAMPLE_KEY = 'auth.login.email'

const TOKEN_ROWS = [
  {
    token: '$$',
    meaningKey: 'toolbar.moveTokenFullPath',
    exampleKey: 'toolbar.moveTokenExampleFullPath',
  },
  {
    token: '$1, $2, …',
    meaningKey: 'toolbar.moveTokenFromLeft',
    exampleKey: 'toolbar.moveTokenExampleFromLeft',
  },
  {
    token: '$-1, $-2, …',
    meaningKey: 'toolbar.moveTokenFromRight',
    exampleKey: 'toolbar.moveTokenExampleFromRight',
  },
  {
    token: '\\$',
    meaningKey: 'toolbar.moveTokenLiteral',
    exampleKey: 'toolbar.moveTokenExampleLiteral',
  },
] as const

interface MoveKeysDialogProps {
  open: boolean
  sampleKey: string
  selectedKeys: readonly string[]
  selectedCount: number
  onClose: () => void
  onConfirm: (lead: string) => boolean
}

export function MoveKeysDialog({
  open,
  sampleKey,
  selectedKeys,
  selectedCount,
  onClose,
  onConfirm,
}: MoveKeysDialogProps) {
  const { t } = useI18n()
  const [lead, setLead] = useState('')
  const [conflict, setConflict] = useState(false)
  const [revealIncompleteError, setRevealIncompleteError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const trimmedLead = lead.trim()
  const keysForValidation = selectedKeys.length > 0 ? selectedKeys : [sampleKey]
  const placeholderInvalid =
    trimmedLead.length > 0 && !validateLeadTemplate(trimmedLead, keysForValidation)
  const showPlaceholderError =
    placeholderInvalid &&
    (!hasIncompleteDollarToken(trimmedLead) || revealIncompleteError)
  const fieldError = showPlaceholderError
    ? t('toolbar.moveInvalidPlaceholder')
    : conflict
      ? t('toolbar.moveConflict')
      : null
  const canSubmit = trimmedLead.length > 0 && !placeholderInvalid
  const preview =
    sampleKey && canSubmit ? applyKeyLead(sampleKey, trimmedLead) : ''

  const submit = useCallback(() => {
    if (!canSubmit) {
      return
    }
    const ok = onConfirm(trimmedLead)
    if (ok) {
      onClose()
      return
    }
    setConflict(true)
    inputRef.current?.focus()
  }, [canSubmit, trimmedLead, onClose, onConfirm])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setLead('')
          setConflict(false)
          setRevealIncompleteError(false)
          onClose()
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-xl"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          inputRef.current?.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('toolbar.moveTitle')}</DialogTitle>
          <DialogDescription>
            {t('toolbar.moveDescription', { count: selectedCount })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-border border-b text-left">
                  <th className="text-muted-foreground pr-3 pb-1.5 font-medium">
                    {t('toolbar.moveToken')}
                  </th>
                  <th className="text-muted-foreground pr-3 pb-1.5 font-medium">
                    {t('toolbar.moveTokenMeaning')}
                  </th>
                  <th className="text-muted-foreground pb-1.5 font-medium">
                    {t('toolbar.moveTokenExample')}{' '}
                    <span className="text-foreground font-mono font-semibold">
                      {EXAMPLE_KEY}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {TOKEN_ROWS.map((row) => (
                  <tr key={row.token} className="border-border/60 border-b last:border-b-0">
                    <td className="text-foreground py-1.5 pr-3 align-top font-mono whitespace-nowrap">
                      {row.token}
                    </td>
                    <td className="text-muted-foreground py-1.5 pr-3 align-top">
                      {t(row.meaningKey)}
                    </td>
                    <td className="text-muted-foreground py-1.5 align-top font-mono">
                      {t(row.exampleKey)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-muted-foreground text-xs">{t('toolbar.moveTokenLeafNote')}</p>
          </div>
          <div className="grid gap-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor="key-lead" className="shrink-0">
                {t('toolbar.moveLead')}
              </Label>
              <p
                className="text-destructive min-h-4 flex-1 text-right text-xs leading-4"
                aria-live="polite"
              >
                {fieldError ?? '\u00a0'}
              </p>
            </div>
            <Input
              ref={inputRef}
              id="key-lead"
              value={lead}
              placeholder={t('toolbar.moveLeadPlaceholder')}
              aria-invalid={Boolean(fieldError) || undefined}
              onBlur={() => setRevealIncompleteError(true)}
              onChange={(event) => {
                setLead(event.target.value)
                setConflict(false)
                setRevealIncompleteError(false)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  submit()
                }
              }}
            />
          </div>
          {preview ? (
            <p className="text-muted-foreground font-mono text-xs break-all">
              <span>{sampleKey}</span>
              <span className="text-muted-foreground/80 mx-1.5">→</span>
              <span className="text-foreground">{preview}</span>
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">
              {t('toolbar.movePreviewExample')}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('dialog.cancel')}
          </Button>
          <Button type="button" onClick={submit} disabled={!canSubmit}>
            {t('toolbar.moveConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
