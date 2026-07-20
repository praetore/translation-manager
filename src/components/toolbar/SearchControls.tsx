import { KeyRound, Regex, Search, Type, type LucideIcon } from 'lucide-react'
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

const SCOPE_ICONS: Record<SearchScope, LucideIcon> = {
  all: Search,
  keys: KeyRound,
  text: Type,
}

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
  const ScopeIcon = SCOPE_ICONS[searchScope]
  const scopeLabel = t(`toolbar.searchScope.${searchScope}`)

  return (
    <ButtonGroup className="w-fit shrink-0">
      <InputGroup
        className={cn(
          'transition-[width] duration-200 ease-out',
          compact ? 'w-36' : 'w-44 md:w-56',
          disabled && 'opacity-50',
        )}
        data-disabled={disabled || undefined}
      >
        <InputGroupInput
          type="search"
          value={searchQuery}
          disabled={disabled}
          placeholder={t(
            compact
              ? 'toolbar.searchPlaceholderShort'
              : 'toolbar.searchPlaceholder',
          )}
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
          aria-label={`${t('toolbar.searchScope.label')}: ${scopeLabel}`}
          title={compact ? scopeLabel : undefined}
          className={cn(
            'bg-background transition-[width,padding,gap] duration-200 ease-out',
            compact
              ? 'w-auto gap-1 px-2 [&_[data-slot=select-value]]:pointer-events-none [&_[data-slot=select-value]]:absolute [&_[data-slot=select-value]]:size-0 [&_[data-slot=select-value]]:overflow-hidden'
              : 'w-[7.25rem]',
          )}
        >
          {/* Compact hides SelectValue; show icon here. Wide mode uses the item icon via SelectValue. */}
          {compact ? <ScopeIcon aria-hidden /> : null}
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" position="popper" className="w-max min-w-32">
          {SCOPES.map((scope) => {
            const ItemIcon = SCOPE_ICONS[scope]
            return (
              <SelectItem key={scope} value={scope}>
                <ItemIcon aria-hidden />
                {t(`toolbar.searchScope.${scope}`)}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </ButtonGroup>
  )
}
