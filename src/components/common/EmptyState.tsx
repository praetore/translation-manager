import { FolderSearch } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/i18n/LocaleProvider'

const FORMAT_EXAMPLES = 'en.json, nl.json, YAML, PO, Properties'

export function EmptyState() {
  const { t } = useI18n()
  const menuLabel = t('menu.fileOpenPath')
  const text = t('empty.description', {
    menu: menuLabel,
    formats: FORMAT_EXAMPLES,
  })
  const parts = text.split(menuLabel)

  const description =
    parts.length === 1 ? (
      text
    ) : (
      <>
        {parts[0]}
        <strong>{menuLabel}</strong>
        {parts.slice(1).join(menuLabel)}
      </>
    )

  return (
    <Card className="flex h-full items-center justify-center border-dashed py-12 shadow-sm">
      <CardHeader className="max-w-xl items-center text-center">
        <div className="bg-muted mb-2 flex size-12 items-center justify-center rounded-full">
          <FolderSearch className="text-muted-foreground size-6" />
        </div>
        <CardTitle className="text-lg">{t('empty.title')}</CardTitle>
        <CardDescription className="text-balance">{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}
