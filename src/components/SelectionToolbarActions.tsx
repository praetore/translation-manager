import { FolderInput, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { AnimatedCount } from '@/components/AnimatedCount'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { MoveKeysDialog } from '@/components/MoveKeysDialog'
import { ToolbarActionButton } from '@/components/ToolbarActionButton'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useTranslationStore } from '@/hooks/useTranslationStore'
import { useI18n } from '@/i18n/LocaleProvider'
import { springSnappy } from '@/lib/motion'

interface SelectionToolbarActionsProps {
  /** True while bulk chrome is mounted, including during exit animation. */
  onChromePresentChange?: (present: boolean) => void
}

export function SelectionToolbarActions({
  onChromePresentChange,
}: SelectionToolbarActionsProps) {
  const { t } = useI18n()
  const { selectedKeys, clearSelection, deleteSelectedRows, moveSelectedKeys } =
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
            className="flex shrink-0 flex-nowrap items-center gap-3"
            initial={{ opacity: 0, x: -12, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.96 }}
            transition={springSnappy}
          >
            <Badge
              variant="secondary"
              className="inline-flex shrink-0 items-center gap-1.5 py-0.5 pr-1.5 pl-2.5"
            >
              <AnimatedCount value={count} />
              {t('toolbar.selectedSuffix')}
              <button
                type="button"
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex size-4 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
                aria-label={t('toolbar.deselect')}
                onClick={clearSelection}
              >
                <X className="size-2.5" strokeWidth={2.5} />
              </button>
            </Badge>
            <ToolbarActionButton
              icon={FolderInput}
              label={t('toolbar.moveKeys')}
              onClick={() => setMoveOpen(true)}
            />
            <ToolbarActionButton
              icon={Trash2}
              label={t('toolbar.deleteSelectedLabel')}
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            />
            <Separator orientation="vertical" className="mx-1 shrink-0" />
          </motion.div>
        )}
      </AnimatePresence>
      <MoveKeysDialog
        open={moveOpen}
        sampleKey={selectedKeys[0] ?? ''}
        selectedKeys={selectedKeys}
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
