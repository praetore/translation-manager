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
import { applyKeyLead } from '@/services/keyPaths'

interface MoveKeysDialogProps {
  open: boolean
  sampleKey: string
  selectedCount: number
  onClose: () => void
  onConfirm: (lead: string) => boolean
}

export function MoveKeysDialog({
  open,
  sampleKey,
  selectedCount,
  onClose,
  onConfirm,
}: MoveKeysDialogProps) {
  const { t } = useI18n()
  const [lead, setLead] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const preview = sampleKey ? applyKeyLead(sampleKey, lead) : ''

  const submit = useCallback(() => {
    const ok = onConfirm(lead)
    if (ok) {
      onClose()
      return
    }
    setError(true)
    inputRef.current?.focus()
  }, [lead, onClose, onConfirm])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setLead('')
          setError(false)
          onClose()
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
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

        <div className="grid gap-1.5">
          <Label htmlFor="key-lead">{t('toolbar.moveLead')}</Label>
          <Input
            ref={inputRef}
            id="key-lead"
            value={lead}
            placeholder={t('toolbar.moveLeadPlaceholder')}
            aria-invalid={error}
            onChange={(event) => {
              setLead(event.target.value)
              setError(false)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                submit()
              }
            }}
          />
          {error && (
            <p className="text-destructive text-xs">{t('toolbar.moveConflict')}</p>
          )}
          {sampleKey && (
            <p className="text-muted-foreground font-mono text-xs">
              {t('toolbar.movePreview', { from: sampleKey, to: preview })}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('dialog.cancel')}
          </Button>
          <Button type="button" onClick={submit}>
            {t('toolbar.moveConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
