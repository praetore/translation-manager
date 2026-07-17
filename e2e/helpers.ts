import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { _electron as electron, expect, type ElectronApplication, type Page } from '@playwright/test'
import electronPath from 'electron'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const fixturesPath = path.join(root, 'fixtures')

const DIRECTORY_KEY = 'translation-manager:directory-path'
const THEME_KEY = 'translation-manager:ui-theme'
const LOCALE_KEY = 'translation-manager:ui-locale'

export async function launchApp(): Promise<{ app: ElectronApplication; page: Page }> {
  const app = await electron.launch({
    executablePath: String(electronPath),
    args: ['.', '--no-sandbox', '--disable-dev-shm-usage'],
    cwd: root,
    env: {
      ...process.env,
      TM_SCREENSHOT: '',
    },
  })
  const page = await app.firstWindow()
  page.setDefaultTimeout(30_000)
  return { app, page }
}

export async function loadFixtures(page: Page): Promise<void> {
  await page.evaluate(
    ({ directoryKey, themeKey, localeKey, fixtures }) => {
      localStorage.setItem(directoryKey, fixtures)
      localStorage.setItem(themeKey, 'light')
      localStorage.setItem(localeKey, 'en')
    },
    {
      directoryKey: DIRECTORY_KEY,
      themeKey: THEME_KEY,
      localeKey: LOCALE_KEY,
      fixtures: fixturesPath,
    },
  )
  await page.reload()
  await page.waitForFunction(
    () => {
      const store = window.__TM_STORE__
      if (!store) return false
      const state = store.getState()
      return Boolean(state.filePicker?.candidates?.length) && !state.load?.loading
    },
    undefined,
    { timeout: 30_000 },
  )
  await page.evaluate(() => {
    const store = window.__TM_STORE__
    if (!store) return
    const picker = store.getState().filePicker
    if (!picker) return
    store.getState().confirmOpenFiles(picker.candidates.map((item) => item.filePath))
  })
  await page.waitForFunction(
    () => {
      const store = window.__TM_STORE__
      if (!store) return false
      const state = store.getState()
      return Boolean(state.project?.rows?.length) && !state.load?.loading
    },
    undefined,
    { timeout: 30_000 },
  )
  await expect(page.locator('[data-row-key]').first()).toBeVisible({ timeout: 30_000 })
}

export async function selectFirstKeys(page: Page, count: number): Promise<string[]> {
  return page.evaluate((n) => {
    const store = window.__TM_STORE__
    if (!store) return []
    const keys = (store.getState().project?.rows ?? []).slice(0, n).map((row) => row.key)
    store.getState().selectKeys(keys)
    return keys
  }, count)
}
