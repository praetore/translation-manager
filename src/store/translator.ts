export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string

let translate: TranslateFn = (key) => key

export function setStoreTranslator(t: TranslateFn): void {
  translate = t
}

export function getStoreTranslator(): TranslateFn {
  return translate
}
