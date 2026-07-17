import { app, type BrowserWindow } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { UiTheme } from '../shared/theme'

const DIRECTORY_KEY = 'translation-manager:directory-path'
const THEME_KEY = 'translation-manager:ui-theme'
const LOCALE_KEY = 'translation-manager:ui-locale'
const SCREENSHOT_KEY = 'translation-manager:screenshot'

export function isScreenshotMode(): boolean {
  return process.env.TM_SCREENSHOT === '1'
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function waitForProjectRows(win: BrowserWindow, minRows = 5): Promise<void> {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    const count = await win.webContents.executeJavaScript(
      `document.querySelectorAll('[data-row-key]').length`,
    )
    if (typeof count === 'number' && count >= minRows) {
      return
    }
    await sleep(150)
  }
  throw new Error(`Timed out waiting for at least ${minRows} translation rows`)
}

async function waitForStoreReady(win: BrowserWindow): Promise<void> {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    const ready = await win.webContents.executeJavaScript(`
      (() => {
        const store = window.__TM_STORE__
        if (!store) return false
        const state = store.getState()
        return Boolean(state.project?.rows?.length) && !state.load?.loading
      })()
    `)
    if (ready === true) {
      return
    }
    await sleep(100)
  }
  throw new Error('Timed out waiting for translation store to be ready')
}

async function prepareSession(
  win: BrowserWindow,
  fixturesPath: string,
  theme: 'dark' | 'light',
): Promise<void> {
  const fixtures = JSON.stringify(fixturesPath)
  const themeJson = JSON.stringify(theme)
  await win.webContents.executeJavaScript(`
    localStorage.setItem(${JSON.stringify(DIRECTORY_KEY)}, ${fixtures});
    localStorage.setItem(${JSON.stringify(THEME_KEY)}, ${themeJson});
    localStorage.setItem(${JSON.stringify(LOCALE_KEY)}, 'en');
    localStorage.setItem(${JSON.stringify(SCREENSHOT_KEY)}, '1');
  `)
  await win.reload()
  await win.webContents.executeJavaScript(
    `new Promise((resolve) => {
      if (document.readyState === 'complete') resolve(undefined)
      else window.addEventListener('load', () => resolve(undefined), { once: true })
    })`,
  )
  await waitForStoreReady(win)
  await waitForProjectRows(win)
  // Let layout/virtualization settle before capture.
  await sleep(600)
}

/** Select keys via the store so bulk actions appear in the toolbar. */
async function selectKeysForScreenshot(
  win: BrowserWindow,
  count: number,
): Promise<void> {
  const selected = await win.webContents.executeJavaScript(`
    (() => {
      const store = window.__TM_STORE__
      if (!store) {
        return -1
      }
      const keys = (store.getState().project?.rows ?? [])
        .slice(0, ${count})
        .map((row) => row.key)
      store.getState().selectKeys(keys)
      return store.getState().selectedKeys.length
    })()
  `)
  if (typeof selected !== 'number' || selected < 2) {
    throw new Error(`Expected a multi-row selection, got ${String(selected)}`)
  }

  // Wait until the selection chrome is actually painted (badge / selected rows).
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    const painted = await win.webContents.executeJavaScript(`
      (() => {
        const selectedRows = document.querySelectorAll('[aria-selected="true"]').length
        const deselect = document.querySelector('[aria-label="Deselect"]')
        return selectedRows >= 2 && Boolean(deselect)
      })()
    `)
    if (painted === true) {
      await sleep(300)
      return
    }
    await sleep(100)
  }
  throw new Error('Timed out waiting for selection UI to paint')
}

async function captureToFile(win: BrowserWindow, filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const image = await win.capturePage()
  await fs.writeFile(filePath, image.toPNG())
  console.log(`Wrote ${filePath}`)
}

/**
 * Load fixtures, capture dark + light README screenshots, then quit.
 * Driven by TM_SCREENSHOT=1, TM_SCREENSHOT_FIXTURES, TM_SCREENSHOT_OUT.
 *
 * Dark: wide window, full toolbar labels.
 * Light: narrower window (compact icon toolbar) + row selection (bulk actions).
 */
export async function runScreenshotCapture(
  win: BrowserWindow,
  setTheme: (theme: UiTheme, broadcast?: boolean) => void,
): Promise<void> {
  const fixturesPath = path.resolve(
    process.env.TM_SCREENSHOT_FIXTURES ?? path.join(process.env.APP_ROOT ?? '.', 'fixtures'),
  )
  const outDir = path.resolve(
    process.env.TM_SCREENSHOT_OUT ?? path.join(process.env.APP_ROOT ?? '.', 'docs'),
  )

  win.show()

  try {
    win.setContentSize(1280, 800)
    setTheme('dark', true)
    await prepareSession(win, fixturesPath, 'dark')
    await captureToFile(win, path.join(outDir, 'main-window-dark.png'))

    // Narrower viewport so the toolbar goes icon-only once selection chrome appears.
    win.setContentSize(1000, 800)
    setTheme('light', true)
    await prepareSession(win, fixturesPath, 'light')
    await selectKeysForScreenshot(win, 3)
    await captureToFile(win, path.join(outDir, 'main-window-light.png'))

    app.exit(0)
  } catch (error) {
    console.error('Screenshot capture failed', error)
    app.exit(1)
  }
}
