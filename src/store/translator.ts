import { i18n, type MessageParams } from '@shared/i18n'

export type TranslateFn = (key: string, params?: MessageParams) => string

/** Always reads the live i18n instance so toasts match the current UI locale. */
export function getStoreTranslator(): TranslateFn {
  return (key, params) => i18n.t(key, params)
}
