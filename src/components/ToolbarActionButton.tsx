import type { LucideIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { Hint } from '@/components/Hint'
import { Button } from '@/components/ui/button'
import { useIsToolbarCompact } from '@/hooks/useToolbarCompact'

type ToolbarActionButtonProps = Omit<ComponentProps<typeof Button>, 'children'> & {
  icon: LucideIcon
  /** Accessible name; also the tooltip in compact mode. */
  label: string
  /** Visible label when not compact. Defaults to `label`. */
  children?: ReactNode
  /** Tooltip when different from the visible label (e.g. longer explanation). */
  hint?: string
}

/**
 * Full labeled button when the toolbar is wide; icon-only with tooltip when compact.
 */
export function ToolbarActionButton({
  icon: Icon,
  label,
  children,
  hint,
  size,
  ...props
}: ToolbarActionButtonProps) {
  const compact = useIsToolbarCompact()
  const button = (
    <Button
      size={compact ? 'icon' : (size ?? 'default')}
      aria-label={label}
      {...props}
    >
      <Icon />
      {!compact && (children ?? label)}
    </Button>
  )

  if (compact || hint) {
    return (
      <Hint label={hint ?? label} side="bottom">
        {button}
      </Hint>
    )
  }

  return button
}
