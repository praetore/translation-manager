import { FolderInput, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { AnimatedCount } from '@/components/AnimatedCount'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Hint } from '@/components/Hint'
import { MoveKeysDialog } from '@/components/MoveKeysDialog'
import { Button } from '@/components/ui/button'
import { useTranslationStore } from '@/hooks/useTranslationStore'
import { useI18n } from '@/i18n/LocaleProvider'
import { springSnappy } from '@/lib/motion'

export function SelectionToolbarActions() {
  const { t } = useI18n()
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
            <span className="text-muted-foreground shrink-0 px-1 text-xs font-medium tracking-wide uppercase">
              {t('toolbar.bulkActions')}
            </span>
            <Hint label={t('toolbar.deselect')} side="bottom">
              <Button type="button" variant="outline" onClick={clearSelection}>
                <X />
                {t('toolbar.deselect')}
              </Button>
            </Hint>
            <Hint label={t('toolbar.moveKeys')} side="bottom">
              <Button type="button" onClick={() => setMoveOpen(true)}>
                <FolderInput />
                {t('toolbar.moveKeys')}
              </Button>
            </Hint>
            <Hint label={deleteLabel} side="bottom">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 />
                <span className="inline-flex items-center gap-1">
                  {t('toolbar.deleteSelectedLabel')}
                  <span className="inline-flex items-center">
                    (
                    <AnimatedCount value={cachedCount} />
                    )
                  </span>
                </span>
              </Button>
            </Hint>
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
