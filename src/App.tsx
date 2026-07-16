import { useCallback, useEffect, useMemo, useState } from 'react'
import { FolderSearch } from 'lucide-react'
import { Toolbar } from '@/components/Toolbar'
import { TranslationTable } from '@/components/TranslationTable'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslationStore } from '@/hooks/useTranslationStore'
import {
  collectMissingRowKeys,
  type TranslationProject,
} from '@/services/translationProject'

export default function App() {
  const {
    project,
    directoryPath,
    setDirectoryPath,
    loadState,
    browseDirectory,
    loadDirectory,
    editCell,
    saveProject,
  } = useTranslationStore()

  /** Snapshot of row keys when the missing-filter was enabled. Null = filter off. */
  const [missingFilterKeys, setMissingFilterKeys] = useState<string[] | null>(null)

  useEffect(() => {
    setMissingFilterKeys(null)
  }, [project?.directoryPath])

  const liveMissingKeys = useMemo(
    () => (project ? collectMissingRowKeys(project) : []),
    [project],
  )

  const toggleMissingFilter = useCallback(() => {
    setMissingFilterKeys((current) => {
      if (current !== null) {
        return null
      }
      if (!project) {
        return null
      }
      return collectMissingRowKeys(project)
    })
  }, [project])

  const displayProject = useMemo<TranslationProject | null>(() => {
    if (!project) {
      return null
    }
    if (missingFilterKeys === null) {
      return project
    }

    const keySet = new Set(missingFilterKeys)
    return {
      ...project,
      rows: project.rows.filter((row) => keySet.has(row.key)),
    }
  }, [project, missingFilterKeys])

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr]">
      <Toolbar
        directoryPath={directoryPath}
        onDirectoryPathChange={setDirectoryPath}
        onBrowse={() => void browseDirectory()}
        onLoad={() => void loadDirectory()}
        onSave={() => void saveProject()}
        onToggleMissingFilter={toggleMissingFilter}
        loading={loadState.loading}
        saving={loadState.saving}
        canSave={Boolean(project)}
        dirty={Boolean(project?.dirty)}
        status={loadState.status}
        error={loadState.error}
        sourceLocale={project?.sourceLocale ?? null}
        missingFilterActive={missingFilterKeys !== null}
        missingFilterCount={missingFilterKeys?.length ?? 0}
        liveMissingCount={liveMissingKeys.length}
      />

      <main className="min-h-0 min-w-0 overflow-hidden p-4">
        {displayProject ? (
          <TranslationTable
            project={displayProject}
            onEdit={editCell}
            stripeMissingRows={missingFilterKeys === null}
          />
        ) : (
          <Card className="flex h-full items-center justify-center border-dashed py-12 shadow-sm">
            <CardHeader className="max-w-xl items-center text-center">
              <div className="bg-muted mb-2 flex size-12 items-center justify-center rounded-full">
                <FolderSearch className="text-muted-foreground size-6" />
              </div>
              <CardTitle className="text-lg">Geen project geladen</CardTitle>
              <CardDescription className="text-balance">
                Kies een lokale map met vertaalbestanden (<code className="font-mono text-xs">en.json</code>,{' '}
                <code className="font-mono text-xs">nl.json</code>, YAML, PO of Properties) om te
                beginnen. Alles blijft op dit apparaat.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </main>
    </div>
  )
}
