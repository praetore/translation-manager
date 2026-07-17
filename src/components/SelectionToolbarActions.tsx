import { FolderInput, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { AnimatedCount } from '@/components/AnimatedCount'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { MoveKeysDialog } from '@/components/MoveKeysDialog'
import { ToolbarActionButton } from '@/components/ToolbarActionButton'
import { useIsToolbarCompact } from '@/hooks/useToolbarCompact'
import { useTranslationStore } from '@/hooks/useTranslationStore'
import { useI18n } from '@/i18n/LocaleProvider'
import { springSnappy } from '@/lib/motion'

export function SelectionToolbarActions() {
  const { t } = useI18n()
  const compact = useIsToolbarCompact()
  const { selectedKeys, clearSelection, deleteSelectedRows, moveSelectedKeys } =
    useTranslationStore()
  const [moveOpen, setMoveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const count = selectedKeys.length
  const hasSelection = count > 0
  const [cachedCount, setCachedCount] = useState(count)
  if (count > 0 && count !== cachedCount) {
    setCachedCount(count)
  }

  const deleteLabel = t('toolbar.deleteSelected', { count: cachedCount })

  return (
    <>
      <AnimatePresence initial={false}>
        {hasSelection && (
          <motion.div
            key="bulk-actions"
            className="flex flex-wrap items-center gap-2"
            initial={{ opacity: 0, x: -12, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.96 }}
            transition={springSnappy}
          >
            {!compact && (
              <span className="text-muted-foreground shrink-0 px-1 text-xs font-medium tracking-wide uppercase">
                {t('toolbar.bulkActions')}
              </span>
            )}
            <ToolbarActionButton
              icon={X}
              label={t('toolbar.deselect')}
              variant="outline"
              onClick={clearSelection}
            />
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
