import { Toolbar } from '@/components/Toolbar'
import { TranslationTable } from '@/components/translation-table/TranslationTable'
import { EmptyState } from '@/components/EmptyState'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { OpenProjectFilesDialog } from '@/components/OpenProjectFilesDialog'
import { useTranslationStore } from '@/hooks/useTranslationStore'

export default function App() {
  const {
    displayProject,
    loadState,
    filePicker,
    confirmOpenFiles,
    cancelOpenFiles,
  } = useTranslationStore()
  const showSkeleton = loadState.loading && !displayProject

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr]">
      <Toolbar />
      <main className="h-full min-h-0 min-w-0 overflow-hidden p-4">
        {showSkeleton ? (
          <LoadingSkeleton />
        ) : displayProject ? (
          <TranslationTable />
        ) : (
          <EmptyState />
        )}
      </main>
      {filePicker ? (
        <OpenProjectFilesDialog
          key={filePicker.directoryPath}
          picker={filePicker}
          onCancel={cancelOpenFiles}
          onConfirm={confirmOpenFiles}
        />
      ) : null}
    </div>
  )
}
