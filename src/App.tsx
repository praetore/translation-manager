import { Toolbar } from '@/components/Toolbar'
import { TranslationTable } from '@/components/translation-table/TranslationTable'
import { EmptyState } from '@/components/EmptyState'
import { useTranslationStore } from '@/hooks/useTranslationStore'

export default function App() {
  const { displayProject } = useTranslationStore()

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr]">
      <Toolbar />
      <main className="min-h-0 min-w-0 overflow-hidden p-4">
        {displayProject ? <TranslationTable /> : <EmptyState />}
      </main>
    </div>
  )
}
