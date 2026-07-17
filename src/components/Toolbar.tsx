import { FolderOpen, ListFilter, Plus, Save, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { AnimatedCount } from '@/components/AnimatedCount'
import { Hint } from '@/components/Hint'
import { SelectionToolbarActions } from '@/components/SelectionToolbarActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useTranslationStore } from '@/hooks/useTranslationStore'
import { useI18n } from '@/i18n/LocaleProvider'
import { springSnappy } from '@/lib/motion'
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
    selectedKeys,
    searchQuery,
    setSearchQuery,
  } = useTranslationStore()

  const dirty = Boolean(project?.dirty)
  const canSave = Boolean(project)
  const canAddRow = Boolean(project)
  const missingFilterActive = missingFilterKeys !== null
  const missingFilterCount = missingFilterKeys?.length ?? 0
  const liveMissingCount = liveMissingKeys.length
  const canToggleMissing = missingFilterActive || liveMissingCount > 0
  const hasMissing = liveMissingCount > 0
  const selectedCount = selectedKeys.length
  const { loading, saving, status } = loadState

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

      <div className="flex min-h-9 flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {dirty ? (
            <Badge variant="warning">{t('toolbar.unsaved')}</Badge>
          ) : (
            status && <Badge variant="success">{status}</Badge>
          )}
          <AnimatePresence initial={false}>
            {selectedCount > 0 && (
              <motion.div
                key="selected-badge"
                initial={{ opacity: 0, scale: 0.92, x: -6 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.92, x: -6 }}
                transition={springSnappy}
              >
                <Badge variant="secondary" className="inline-flex items-center gap-1">
                  <AnimatedCount value={selectedCount} />
                  {t('toolbar.selectedSuffix')}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <SelectionToolbarActions />
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              type="search"
              value={searchQuery}
              disabled={!project}
              placeholder={t('toolbar.searchPlaceholder')}
              aria-label={t('toolbar.search')}
              className="bg-background h-9 w-44 pl-8 md:w-56"
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <Separator orientation="vertical" className="mx-1 hidden sm:block" />
          <Button type="button" onClick={addRow} disabled={!canAddRow}>
            <Plus />
            {t('toolbar.addRow')}
          </Button>
          <Hint
            side="bottom"
            label={
              missingFilterActive
                ? t('toolbar.missingFilterOn')
                : t('toolbar.missingFilterOff')
            }
          >
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
            >
              <ListFilter />
              {t('toolbar.missing', {
                count: missingFilterActive ? missingFilterCount : liveMissingCount,
              })}
            </Button>
          </Hint>
        </div>
      </div>
    </header>
  )
}
