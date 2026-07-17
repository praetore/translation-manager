import type { ComponentType, SVGProps } from 'react'
import * as FlagIcons from 'country-flag-icons/react/3x2'
import { cn } from '@/lib/utils'
import { localeFlagRegion } from '@shared/locale'

type FlagComponent = ComponentType<SVGProps<SVGSVGElement>>

/**
 * SVG country flag for a locale tag. Prefer this over emoji — Windows shows
 * regional-indicator pairs as letters (GB, NL) instead of flag glyphs.
 */
export function LocaleFlag({
  locale,
  className,
}: {
  locale: string
  className?: string
}) {
  const region = localeFlagRegion(locale)
  if (!region) {
    return null
  }
  const Flag = (FlagIcons as Record<string, FlagComponent | undefined>)[region]
  if (!Flag) {
    return null
  }
  return (
    <Flag
      className={cn('inline-block h-3.5 w-[1.35rem] shrink-0 rounded-[2px]', className)}
      aria-hidden
    />
  )
}
