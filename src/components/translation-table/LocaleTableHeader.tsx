import { flexRender, type Header } from '@tanstack/react-table'
import type { TranslationRow } from '@shared/types'
import {
  KEY_COLUMN_WIDTH,
  TABLE_HEADER_HEIGHT,
} from '@/components/translation-table/virtualization'
import { useI18n } from '@/i18n/LocaleProvider'
import type { RefObject } from 'react'

interface LocaleTableHeaderProps {
  headerRef: RefObject<HTMLDivElement | null>
  localeHeaders: Array<Header<TranslationRow, unknown>>
  localesWidth: number
  localeScrollbarY: number
}

/** Key + scrolling locale headers (scrollbar gutter when needed). */
export function LocaleTableHeader({
  headerRef,
  localeHeaders,
  localesWidth,
  localeScrollbarY,
}: LocaleTableHeaderProps) {
  const { t } = useI18n()

  return (
    <div
      className="bg-muted flex min-w-0 border-b"
      style={{ height: TABLE_HEADER_HEIGHT }}
    >
      <div
        className="flex h-full shrink-0 items-center border-r px-2.5 text-xs font-semibold"
        style={{ width: KEY_COLUMN_WIDTH }}
        role="columnheader"
      >
        {t('table.key')}
      </div>
      <div className="h-full min-w-0 flex-1 overflow-hidden" ref={headerRef}>
        <div
          className="flex h-full"
          style={{ width: localesWidth, minWidth: localesWidth }}
          role="row"
        >
          {localeHeaders.map((header) => (
            <div
              key={header.id}
              className="flex h-full min-w-0 shrink-0 items-center border-r px-2.5 text-xs font-semibold"
              style={{
                width: header.getSize(),
                flex: `0 0 ${header.getSize()}px`,
              }}
              role="columnheader"
            >
              {header.isPlaceholder
                ? null
                : flexRender(header.column.columnDef.header, header.getContext())}
            </div>
          ))}
        </div>
      </div>
      {localeScrollbarY > 0 ? (
        <div className="shrink-0" style={{ width: localeScrollbarY }} aria-hidden />
      ) : null}
    </div>
  )
}
