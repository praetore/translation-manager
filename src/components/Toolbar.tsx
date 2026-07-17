import { FolderOpen, ListFilter, Plus, Save } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslationStore } from '@/hooks/useTranslationStore'
import { useI18n } from '@/i18n/LocaleProvider'
import { cn } from '@/lib/utils'

export function Toolbar() {
  const { t } = useI18n()
  const {
    project,
    directoryPath,
    setDirectoryPath,
    loadState,
    browseDirectory,
    loadDirectory,
    addRow,
    toggleMissingFilter,
    saveProject,
    missingFilterKeys,
    liveMissingKeys,
  } = useTranslationStore()

  const dirty = Boolean(project?.dirty)
  const canSave = Boolean(project)
  const canAddRow = Boolean(project)
  const missingFilterActive = missingFilterKeys !== null
  const missingFilterCount = missingFilterKeys?.length ?? 0
  const liveMissingCount = liveMissingKeys.length
  const canToggleMissing = missingFilterActive || liveMissingCount > 0
  const hasMissing = liveMissingCount > 0
  const { loading, saving, status, error } = loadState

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
            onChange={(event) => setDirectoryPath(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void loadDirectory()
              }
            }}
          />
        </div>

        <Button type="button" variant="outline" onClick={() => void browseDirectory()} disabled={loading}>
          <FolderOpen />
          {t('toolbar.browse')}
        </Button>
        <Button type="button" onClick={() => void saveProject()} disabled={!canSave || saving}>
          <Save />
          {saving ? t('toolbar.saving') : dirty ? `${t('toolbar.save')} *` : t('toolbar.save')}
        </Button>
      </div>

      <div className="flex min-h-9 flex-wrap items-center gap-2" aria-live="polite">
        <div className="flex flex-wrap gap-2">
          {dirty ? (
            <Badge variant="warning">{t('toolbar.unsaved')}</Badge>
          ) : (
            status && <Badge variant="success">{status}</Badge>
          )}
          {error && <Badge variant="destructive">{error}</Badge>}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={addRow} disabled={!canAddRow}>
            <Plus />
            {t('toolbar.addRow')}
          </Button>
          <Button
            type="button"
            className={cn(
              hasMissing &&
                !missingFilterActive &&
                'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-900/60 dark:hover:text-amber-50',
            )}
            variant={hasMissing && missingFilterActive ? 'warning' : 'outline'}
            onClick={toggleMissingFilter}
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
      </div>
    </header>
  )
}
