import { FolderOpen, ListFilter, Save, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface ToolbarProps {
  directoryPath: string
  onDirectoryPathChange: (value: string) => void
  onBrowse: () => void
  onLoad: () => void
  onSave: () => void
  onToggleMissingFilter: () => void
  loading: boolean
  saving: boolean
  canSave: boolean
  dirty: boolean
  status: string | null
  error: string | null
  sourceLocale: string | null
  missingFilterActive: boolean
  missingFilterCount: number
  liveMissingCount: number
}

export function Toolbar({
  directoryPath,
  onDirectoryPathChange,
  onBrowse,
  onLoad,
  onSave,
  onToggleMissingFilter,
  loading,
  saving,
  canSave,
  dirty,
  status,
  error,
  sourceLocale,
  missingFilterActive,
  missingFilterCount,
  liveMissingCount,
}: ToolbarProps) {
  const canToggleMissing = missingFilterActive || liveMissingCount > 0
  const hasMissing = liveMissingCount > 0

  return (
    <header className="grid gap-3 border-b bg-card/90 px-5 py-4 backdrop-blur">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Translation Manager</h1>
        <p className="text-muted-foreground text-sm">
          Lokale vertaal-editor · JSON · YAML · PO · Properties
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="grid min-w-[240px] flex-[1_1_360px] gap-1.5">
          <Label htmlFor="directory-path" className="text-muted-foreground text-xs uppercase tracking-wide">
            Mappad
          </Label>
          <Input
            id="directory-path"
            type="text"
            value={directoryPath}
            placeholder="C:\project\locales"
            className="bg-background"
            onChange={(event) => onDirectoryPathChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onLoad()
              }
            }}
          />
        </div>

        <Button type="button" variant="outline" onClick={onBrowse} disabled={loading}>
          <FolderOpen />
          Bladeren…
        </Button>
        <Button type="button" onClick={onLoad} disabled={loading}>
          <Search />
          {loading ? 'Laden…' : 'Openen'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onSave}
          disabled={!canSave || saving}
        >
          <Save />
          {saving ? 'Opslaan…' : dirty ? 'Opslaan *' : 'Opslaan'}
        </Button>
      </div>

      <div className="flex min-h-9 flex-wrap items-center gap-2" aria-live="polite">
        <div className="flex flex-wrap gap-2">
          {sourceLocale && <Badge variant="secondary">Bron: {sourceLocale}</Badge>}
          {status && <Badge variant="success">{status}</Badge>}
          {error && <Badge variant="destructive">{error}</Badge>}
        </div>

        <Button
          type="button"
          className={cn(
            'ml-auto',
            hasMissing &&
              !missingFilterActive &&
              'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:text-amber-950',
          )}
          variant={hasMissing && missingFilterActive ? 'warning' : 'outline'}
          onClick={onToggleMissingFilter}
          disabled={!canToggleMissing}
          aria-pressed={missingFilterActive}
          title={
            missingFilterActive
              ? 'Filter uitzetten om de lijst opnieuw te berekenen'
              : 'Toon alleen rijen met ontbrekende vertalingen'
          }
        >
          <ListFilter />
          {missingFilterActive
            ? `Ontbrekende (${missingFilterCount})`
            : `Ontbrekende (${liveMissingCount})`}
        </Button>
      </div>
    </header>
  )
}
