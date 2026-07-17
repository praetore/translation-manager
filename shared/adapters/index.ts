/**
 * Format adapters for locale files. Main only reads/writes bytes; the renderer
 * (and `buildProjectFromFiles`) parse via this registry.
 *
 * Mixed formats in one folder are allowed — each file picks its adapter by
 * extension. Unsupported files are skipped at scan/build time.
 */
import type { TranslationFormat } from '@shared/types'
import type { TranslationAdapter } from './TranslationAdapter'
import { JsonAdapter } from './JsonAdapter'
import { YamlAdapter } from './YamlAdapter'
import { PoAdapter } from './PoAdapter'
import { PropertiesAdapter } from './PropertiesAdapter'

export class AdapterRegistry {
  private readonly adapters: TranslationAdapter[]

  constructor(adapters?: TranslationAdapter[]) {
    this.adapters =
      adapters ?? [new JsonAdapter(), new YamlAdapter(), new PoAdapter(), new PropertiesAdapter()]
  }

  getByFileName(fileName: string): TranslationAdapter | undefined {
    return this.adapters.find((adapter) => adapter.canHandle(fileName))
  }

  getByFormat(format: TranslationFormat): TranslationAdapter {
    const adapter = this.adapters.find((item) => item.format === format)
    if (!adapter) {
      throw new Error(`No adapter registered for format: ${format}`)
    }
    return adapter
  }

  listFormats(): TranslationFormat[] {
    return this.adapters.map((adapter) => adapter.format)
  }
}

export const adapterRegistry = new AdapterRegistry()
