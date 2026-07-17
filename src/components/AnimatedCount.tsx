import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { springSnappy } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface AnimatedCountProps {
  value: number
  className?: string
}

/** Slides the digit up/down when `value` changes. */
export function AnimatedCount({ value, className }: AnimatedCountProps) {
  const [previous, setPrevious] = useState(value)
  const direction = value === previous ? 0 : value > previous ? 1 : -1
  if (value !== previous) {
    setPrevious(value)
  }

  return (
    <span
      className={cn(
        'relative inline-grid min-w-[1ch] overflow-hidden text-center align-middle tabular-nums',
        className,
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          className="col-start-1 row-start-1 inline-block"
          initial={{ y: direction >= 0 ? 12 : -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: direction >= 0 ? -12 : 12, opacity: 0 }}
          transition={springSnappy}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
