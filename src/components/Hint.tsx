import type { ReactElement } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface HintProps {
  label: string
  children: ReactElement
  side?: 'top' | 'right' | 'bottom' | 'left'
}

/** Accessible hover/focus hint; wraps a single interactive child. */
export function Hint({ label, children, side = 'top' }: HintProps) {
  return (
    <Tooltip disableHoverableContent>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="pointer-events-none">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
