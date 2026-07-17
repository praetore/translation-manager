import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

Object.defineProperty(window, 'electronAPI', {
  configurable: true,
  writable: true,
  value: {
    selectDirectory: vi.fn(async () => null),
    scanDirectory: vi.fn(async () => ({
      directoryPath: '',
      files: [],
    })),
    writeFiles: vi.fn(async () => ({ written: [], errors: [] })),
    getUiLocale: vi.fn(async () => 'en'),
    setUiLocale: vi.fn(async (locale: string) => locale),
    onUiLocaleChanged: vi.fn(() => () => undefined),
    getUiTheme: vi.fn(async () => 'system'),
    setUiTheme: vi.fn(async (theme: string) => theme),
    onUiThemeChanged: vi.fn(() => () => undefined),
    onMenuOpen: vi.fn(() => () => undefined),
    onMenuSave: vi.fn(() => () => undefined),
  },
})

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Radix Select (and similar) call these; jsdom does not implement them.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => undefined
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => undefined
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => undefined
}

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub as typeof ResizeObserver
}
