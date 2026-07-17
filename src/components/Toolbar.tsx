import { useRef, type RefObject } from 'react'
import { FolderOpen, ListFilter, Plus, Save } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { AnimatedCount } from '@/components/AnimatedCount'
import { Hint } from '@/components/Hint'
import { SearchControls } from '@/components/SearchControls'
import { SelectionToolbarActions } from '@/components/SelectionToolbarActions'
import { ToolbarActionButton } from '@/components/ToolbarActionButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  ToolbarCompactProvider,
  useIsToolbarCompact,
  useToolbarCompact,
} from '@/hooks/useToolbarCompact'
import { useTranslationStore } from '@/hooks/useTranslationStore'
import { useI18n } from '@/i18n/LocaleProvider'
import { springSnappy } from '@/lib/motion'
import { cn } from '@/lib/utils'

export function Toolbar() {
  const actionsRef = useRef<HTMLDivElement>(null)
  const { selectedKeys } = useTranslationStore()
  const compact = useToolbarCompact(actionsRef, [selectedKeys.length])

  return (
    <ToolbarCompactProvider compact={compact}>
      <header className="grid gap-3 border-b bg-card/90 px-5 py-4 backdrop-blur">
        <ToolbarContent actionsRef={actionsRef} />
      </header>
    </ToolbarCompactProvider>
  )
}

function ToolbarContent({
  actionsRef,
}: {
  actionsRef: RefObject<HTMLDivElement | null>
}) {
  const { t } = useI18n()
  const compact = useIsToolbarCompact()
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
    layoutMotion,
    filterLayoutMode,
  } = useTranslationStore()

  const dirty = Boolean(project?.dirty)
  const canSave = dirty
  const canAddRow = Boolean(project)
  const missingFilterActive = missingFilterKeys !== null
  const missingFilterCount = missingFilterKeys?.length ?? 0
  const liveMissingCount = liveMissingKeys.length
  const filterBusy = layoutMotion !== null && filterLayoutMode !== null
  /** Collapse in flight → on-state colors; expand → off-state immediately. */
  const filterVisuallyOn =
    missingFilterActive || filterLayoutMode === 'collapse'
  const canToggleMissing = missingFilterActive || liveMissingCount > 0
  const hasMissing = liveMissingCount > 0
  const selectedCount = selectedKeys.length
  const { loading, saving, status } = loadState

  const browseLabel = t('toolbar.browse')
  const saveLabel = saving
    ? t('toolbar.saving')
    : dirty
      ? `${t('toolbar.save')} *`
      : t('toolbar.save')
  const missingLabel = t('toolbar.missing', {
    count: missingFilterActive ? missingFilterCount : liveMissingCount,
  })

  const browseButton = (
    <Button
      type="button"
      variant="outline"
      size={compact ? 'icon' : 'default'}
      aria-label={browseLabel}
      onClick={() => void browseDirectory()}
      disabled={loading}
    >
      <FolderOpen />
      {!compact && browseLabel}
    </Button>
  )

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t('app.title')}</h1>
        <p className="text-muted-foreground text-sm">{t('app.tagline')}</p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="grid min-w-[240px] flex-[1_1_360px] gap-1.5">
          <Label
            htmlFor="directory-path"
            className="text-muted-foreground text-xs uppercase tracking-wide"
          >
            {t('toolbar.directoryPath')}
          </Label>
          <ButtonGroup className="w-full">
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
            {compact ? (
              <Hint label={browseLabel} side="bottom">
                {browseButton}
              </Hint>
            ) : (
              browseButton
            )}
          </ButtonGroup>
        </div>

        <ToolbarActionButton
          icon={Save}
          label={saveLabel}
          onClick={() => void saveProject()}
          disabled={!canSave || saving}
        />
      </div>

      <div className="flex min-h-9 flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {dirty ? (
            <Badge variant="warning">{t('toolbar.unsaved')}</Badge>
          ) : (
            status && (
              <Badge variant="success">{t(status.key, status.params)}</Badge>
            )
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

        <div
          ref={actionsRef}
          className="ml-auto flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2"
        >
          <SelectionToolbarActions />
          <SearchControls />
          <Separator orientation="vertical" className="mx-1 hidden sm:block" />
          <ToolbarActionButton
            icon={Plus}
            label={t('toolbar.addRow')}
            onClick={addRow}
            disabled={!canAddRow}
          />
          <ToolbarActionButton
            icon={ListFilter}
            label={missingLabel}
            hint={
              filterVisuallyOn
                ? t('toolbar.missingFilterOn')
                : t('toolbar.missingFilterOff')
            }
            className={cn(
              hasMissing &&
                !filterVisuallyOn &&
                'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-900/60 dark:hover:text-amber-50',
              filterBusy && 'pointer-events-none',
            )}
            variant={hasMissing && filterVisuallyOn ? 'warning' : 'outline'}
            onClick={toggleMissingFilter}
            disabled={!canToggleMissing}
            aria-disabled={!canToggleMissing || filterBusy}
            aria-pressed={filterVisuallyOn}
          />
        </div>
      </div>
    </>
  )
}
