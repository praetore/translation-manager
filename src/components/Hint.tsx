import { useState, type ReactElement } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface HintProps {
  label: string
  children: ReactElement
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** When true, the tooltip never opens (tree stays mounted for stable children). */
  disabled?: boolean
}

/** Accessible hover/focus hint; wraps a single interactive child. */
export function Hint({ label, children, side = 'top', disabled = false }: HintProps) {
  const [open, setOpen] = useState(false)

  return (
    <Tooltip
      disableHoverableContent
      open={disabled ? false : open}
      onOpenChange={setOpen}
    >
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="pointer-events-none">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
