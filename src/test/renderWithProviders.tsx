import type { ReactElement, ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { changeUiLocale, i18n } from '@shared/i18n'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ToolbarCompactProvider } from '@/hooks/useToolbarCompact'

void changeUiLocale('en')

export function AllProviders({
  children,
  compact = false,
}: {
  children: ReactNode
  compact?: boolean
}) {
  return (
    <I18nextProvider i18n={i18n}>
      <TooltipProvider delayDuration={0}>
        <ToolbarCompactProvider compact={compact}>{children}</ToolbarCompactProvider>
      </TooltipProvider>
    </I18nextProvider>
  )
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { compact?: boolean },
) {
  const { compact = false, ...rest } = options ?? {}
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders compact={compact}>{children}</AllProviders>
    ),
    ...rest,
  })
}
