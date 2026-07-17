import { useCallback, useEffect, useMemo, useState } from 'react'
import { FolderSearch } from 'lucide-react'
import { Toolbar } from '@/components/Toolbar'
import { TranslationTable } from '@/components/TranslationTable'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslationStore } from '@/hooks/useTranslationStore'
import { useI18n } from '@/i18n/LocaleProvider'
import {
  collectMissingRowKeys,
  type TranslationProject,
} from '@/services/translationProject'

export default function App() {
  const { t } = useI18n()
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

  const emptyDescription = useMemo(() => {
    const text = t('empty.description', {
      menu: t('menu.fileOpenPath'),
      formats: 'en.json, nl.json, YAML, PO, Properties',
    })
    const menuLabel = t('menu.fileOpenPath')
    const parts = text.split(menuLabel)

    if (parts.length === 1) {
      return text
    }

    return (
      <>
        {parts[0]}
        <strong>{menuLabel}</strong>
        {parts.slice(1).join(menuLabel)}
      </>
    )
  }, [t])

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
              <CardTitle className="text-lg">{t('empty.title')}</CardTitle>
              <CardDescription className="text-balance">{emptyDescription}</CardDescription>
            </CardHeader>
          </Card>
        )}
      </main>
    </div>
  )
}
