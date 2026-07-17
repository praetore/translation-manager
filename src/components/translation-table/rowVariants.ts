import { cva, type VariantProps } from 'class-variance-authority'

export const translationRowVariants = cva('flex border-b', {
  variants: {
    tone: {
      default: '',
      missing: 'row-missing-stripe',
      selected: 'row-selected',
      'missing-selected': 'row-missing-selected',
    },
    motion: {
      none: '',
      enter: 'animate-row-enter',
      'enter-fade': 'animate-row-enter-fade',
      'enter-load': 'animate-row-enter-load',
      exit: 'row-exit',
      flash: 'row-flash',
    },
  },
  defaultVariants: {
    tone: 'default',
    motion: 'none',
  },
})

export type TranslationRowVariantProps = VariantProps<typeof translationRowVariants>

export function resolveRowTone(
  missing: boolean,
  selected: boolean,
): NonNullable<TranslationRowVariantProps['tone']> {
  if (missing && selected) {
    return 'missing-selected'
  }
  if (missing) {
    return 'missing'
  }
  if (selected) {
    return 'selected'
  }
  return 'default'
}

export function resolveRowMotion(
  entering: boolean,
  exiting: boolean,
  flashing: boolean,
  enterFade = false,
  enterLoad = false,
): NonNullable<TranslationRowVariantProps['motion']> {
  if (exiting) {
    return 'exit'
  }
  if (enterLoad) {
    return 'enter-load'
  }
  if (entering) {
    return enterFade ? 'enter-fade' : 'enter'
  }
  if (flashing) {
    return 'flash'
  }
  return 'none'
}
