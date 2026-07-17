import { FolderOpen, ListFilter, Save } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/i18n/LocaleProvider'
import { cn } from '@/lib/utils'

interface ToolbarProps {
  directoryPath: string
  onDirectoryPathChange: (value: string) => void
  onBrowse: () => void
  onLoad: () => void
  onSave: () => void
  onToggleMissingFilter: () => void
  loading: boolean
  saving: boolean
  canSave: boolean
  status: string | null
  error: string | null
  missingFilterActive: boolean
  missingFilterCount: number
  liveMissingCount: number
  dirty: boolean
}

export function Toolbar({
  directoryPath,
  onDirectoryPathChange,
  onBrowse,
  onLoad,
  onSave,
  onToggleMissingFilter,
  loading,
  saving,
  canSave,
  status,
  error,
  missingFilterActive,
  missingFilterCount,
  liveMissingCount,
  dirty,
}: ToolbarProps) {
  const { t } = useI18n()
  const canToggleMissing = missingFilterActive || liveMissingCount > 0
  const hasMissing = liveMissingCount > 0

  return (
    <header className="grid gap-3 border-b bg-card/90 px-5 py-4 backdrop-blur">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t('app.title')}</h1>
        <p className="text-muted-foreground text-sm">{t('app.tagline')}</p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="grid min-w-[240px] flex-[1_1_360px] gap-1.5">
          <Label htmlFor="directory-path" className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('toolbar.directoryPath')}
          </Label>
          <Input
            id="directory-path"
            type="text"
            value={directoryPath}
            placeholder="C:\project\locales"
            className="bg-background"
            onChange={(event) => onDirectoryPathChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onLoad()
              }
            }}
          />
        </div>

        <Button type="button" variant="outline" onClick={onBrowse} disabled={loading}>
          <FolderOpen />
          {t('toolbar.browse')}
        </Button>
        <Button type="button" onClick={onSave} disabled={!canSave || saving}>
          <Save />
          {saving ? t('toolbar.saving') : dirty ? `${t('toolbar.save')} *` : t('toolbar.save')}
        </Button>
      </div>

      <div className="flex min-h-9 flex-wrap items-center gap-2" aria-live="polite">
        <div className="flex flex-wrap gap-2">
          {dirty && <Badge variant="warning">{t('toolbar.unsaved')}</Badge>}
          {status && <Badge variant="success">{status}</Badge>}
          {error && <Badge variant="destructive">{error}</Badge>}
        </div>

        <Button
          type="button"
          className={cn(
            'ml-auto',
            hasMissing &&
              !missingFilterActive &&
              'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-900/60 dark:hover:text-amber-50',
          )}
          variant={hasMissing && missingFilterActive ? 'warning' : 'outline'}
          onClick={onToggleMissingFilter}
          disabled={!canToggleMissing}
          aria-pressed={missingFilterActive}
          title={
            missingFilterActive
              ? t('toolbar.missingFilterOn')
              : t('toolbar.missingFilterOff')
          }
        >
          <ListFilter />
          {t('toolbar.missing', {
            count: missingFilterActive ? missingFilterCount : liveMissingCount,
          })}
        </Button>
      </div>
    </header>
  )
}
