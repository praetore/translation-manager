import { app, type BrowserWindow } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { UiTheme } from '../shared/theme'

const DIRECTORY_KEY = 'translation-manager:directory-path'
const THEME_KEY = 'translation-manager:ui-theme'
const LOCALE_KEY = 'translation-manager:ui-locale'

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
  `)
  await win.reload()
  await win.webContents.executeJavaScript(
    `new Promise((resolve) => {
      if (document.readyState === 'complete') resolve(undefined)
      else window.addEventListener('load', () => resolve(undefined), { once: true })
    })`,
  )
  await waitForProjectRows(win)
  // Let layout/virtualization settle before capture.
  await sleep(600)
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

  win.setContentSize(1280, 800)
  win.show()

  try {
    setTheme('dark', true)
    await prepareSession(win, fixturesPath, 'dark')
    await captureToFile(win, path.join(outDir, 'main-window-dark.png'))

    setTheme('light', true)
    await prepareSession(win, fixturesPath, 'light')
    await captureToFile(win, path.join(outDir, 'main-window-light.png'))

    app.exit(0)
  } catch (error) {
    console.error('Screenshot capture failed', error)
    app.exit(1)
  }
}
