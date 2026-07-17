import { FolderInput, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { AnimatedCount } from '@/components/AnimatedCount'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { MoveKeysDialog } from '@/components/MoveKeysDialog'
import { ToolbarActionButton } from '@/components/ToolbarActionButton'
import { Separator } from '@/components/ui/separator'
import { useIsToolbarCompact } from '@/hooks/useToolbarCompact'
import { useTranslationStore } from '@/hooks/useTranslationStore'
import { useI18n } from '@/i18n/LocaleProvider'
import { springSnappy } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface SelectionToolbarActionsProps {
  /** True while bulk chrome is mounted, including during exit animation. */
  onChromePresentChange?: (present: boolean) => void
}

export function SelectionToolbarActions({
  onChromePresentChange,
}: SelectionToolbarActionsProps) {
  const { t } = useI18n()
  const compact = useIsToolbarCompact()
  const { selectedKeys, deleteSelectedRows, moveSelectedKeys } =
    useTranslationStore()
  const [moveOpen, setMoveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const count = selectedKeys.length
  const hasSelection = count > 0
  const hasSelectionRef = useRef(hasSelection)

  const [cachedCount, setCachedCount] = useState(count)
  if (count > 0 && count !== cachedCount) {
    setCachedCount(count)
  }

  useEffect(() => {
    hasSelectionRef.current = hasSelection
  }, [hasSelection])

  useEffect(() => {
    if (hasSelection) {
      onChromePresentChange?.(true)
    }
  }, [hasSelection, onChromePresentChange])

  const deleteLabel = t('toolbar.deleteSelected', { count: cachedCount })

  return (
    <>
      <AnimatePresence
        initial={false}
        onExitComplete={() => {
          if (!hasSelectionRef.current) {
            onChromePresentChange?.(false)
          }
        }}
      >
        {hasSelection && (
          <motion.div
            key="bulk-actions"
            className="flex shrink-0 flex-nowrap items-center gap-2"
            initial={{ opacity: 0, x: -12, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.96 }}
            transition={springSnappy}
          >
            <span
              aria-hidden={compact || undefined}
              className={cn(
                'text-muted-foreground inline-grid px-1 text-xs font-medium tracking-wide uppercase transition-[grid-template-columns,opacity,padding] duration-200 ease-out',
                compact
                  ? 'grid-cols-[0fr] px-0 opacity-0'
                  : 'grid-cols-[1fr] opacity-100',
              )}
            >
              <span className="min-w-0 overflow-hidden whitespace-nowrap">
                {t('toolbar.bulkActions')}
              </span>
            </span>
            <ToolbarActionButton
              icon={FolderInput}
              label={t('toolbar.moveKeys')}
              onClick={() => setMoveOpen(true)}
            />
            <ToolbarActionButton
              icon={Trash2}
              label={deleteLabel}
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <span className="inline-flex items-center gap-1">
                {t('toolbar.deleteSelectedLabel')}
                <span className="inline-flex items-center">
                  (
                  <AnimatedCount value={cachedCount} />
                  )
                </span>
              </span>
            </ToolbarActionButton>
            <Separator orientation="vertical" className="mx-1 shrink-0" />
          </motion.div>
        )}
      </AnimatePresence>
      <MoveKeysDialog
        open={moveOpen}
        sampleKey={selectedKeys[0] ?? ''}
        selectedCount={count}
        onClose={() => setMoveOpen(false)}
        onConfirm={moveSelectedKeys}
      />
      <ConfirmDialog
        open={deleteOpen}
        title={t('toolbar.deleteSelectedTitle')}
        description={t('toolbar.deleteSelectedConfirm', { count: cachedCount })}
        cancelLabel={t('dialog.cancel')}
        confirmLabel={t('dialog.delete')}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteSelectedRows}
      />
    </>
  )
}
