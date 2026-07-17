import { Regex } from 'lucide-react'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useIsToolbarCompact } from '@/hooks/useToolbarCompact'
import { useTranslationStore } from '@/hooks/useTranslationStore'
import { useI18n } from '@/i18n/LocaleProvider'
import { cn } from '@/lib/utils'
import {
  isValidSearchRegex,
  type SearchScope,
} from '@/store/searchFilter'

const SCOPES: SearchScope[] = ['all', 'keys', 'text']

export function SearchControls() {
  const { t } = useI18n()
  const compact = useIsToolbarCompact()
  const {
    project,
    searchQuery,
    setSearchQuery,
    searchScope,
    setSearchScope,
    searchRegex,
    setSearchRegex,
  } = useTranslationStore()

  const disabled = !project
  const invalidRegex = searchRegex && !isValidSearchRegex(searchQuery)

  return (
    <ButtonGroup className="w-fit max-w-full">
      <InputGroup
        className={cn(
          compact ? 'w-36' : 'w-44 md:w-56',
          disabled && 'opacity-50',
        )}
        data-disabled={disabled || undefined}
      >
        <InputGroupInput
          type="search"
          value={searchQuery}
          disabled={disabled}
          placeholder={t('toolbar.searchPlaceholder')}
          aria-label={t('toolbar.search')}
          aria-invalid={invalidRegex || undefined}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            disabled={disabled}
            aria-pressed={searchRegex}
            aria-label={t('toolbar.searchRegex')}
            title={t('toolbar.searchRegex')}
            data-active={searchRegex || undefined}
            className={cn(
              'text-muted-foreground',
              'data-[active=true]:bg-primary data-[active=true]:text-primary-foreground',
              'data-[active=true]:hover:bg-primary/90 data-[active=true]:hover:text-primary-foreground',
            )}
            onClick={() => setSearchRegex(!searchRegex)}
          >
            <Regex />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      <Select
        value={searchScope}
        onValueChange={(value) => setSearchScope(value as SearchScope)}
        disabled={disabled}
      >
        <SelectTrigger
          size="default"
          aria-label={t('toolbar.searchScope.label')}
          className="bg-background w-[5.75rem]"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {SCOPES.map((scope) => (
            <SelectItem key={scope} value={scope}>
              {t(`toolbar.searchScope.${scope}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ButtonGroup>
  )
}
