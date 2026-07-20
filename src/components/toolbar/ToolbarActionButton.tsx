import type { LucideIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { Hint } from '@/components/common/Hint'
import { Button } from '@/components/ui/button'
import { useIsToolbarCompact } from '@/hooks/useToolbarCompact'
import { cn } from '@/lib/utils'

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
 * Label width animates both ways (duration must match TOOLBAR_COMPACT_MS).
 */
export function ToolbarActionButton({
  icon: Icon,
  label,
  children,
  hint,
  size,
  className,
  ...props
}: ToolbarActionButtonProps) {
  const compact = useIsToolbarCompact()
  const labelContent = children ?? label
  const showTooltip = compact || Boolean(hint)

  return (
    <Hint label={hint ?? label} side="bottom" disabled={!showTooltip}>
      <Button
        size={size ?? 'default'}
        aria-label={label}
        className={cn(
          'gap-2 transition-[gap,padding] duration-200 ease-out',
          compact && 'gap-0 px-2.5',
          className,
        )}
        {...props}
      >
        <Icon />
        <span
          aria-hidden={compact || undefined}
          className={cn(
            'inline-grid transition-[grid-template-columns,opacity] duration-200 ease-out',
            compact ? 'grid-cols-[0fr] opacity-0' : 'grid-cols-[1fr] opacity-100',
          )}
        >
          <span className="min-w-0 overflow-hidden whitespace-nowrap">
            {labelContent}
          </span>
        </span>
      </Button>
    </Hint>
  )
}
