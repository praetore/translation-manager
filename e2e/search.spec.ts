import { expect, test } from '@playwright/test'
import { launchApp, loadFixtures } from './helpers'

test.describe('Electron search', () => {
  test('filters rows by query, regex, and scope', async () => {
    const { app, page } = await launchApp()
    try {
      await loadFixtures(page)
      const initial = await page.locator('[data-row-key]').count()
      expect(initial).toBeGreaterThan(4)

      const search = page.getByRole('searchbox', { name: 'Search' })
      await search.fill('login')
      await expect
        .poll(async () => page.locator('[data-row-key]').count())
        .toBeLessThan(initial)

      await page.getByRole('button', { name: 'Regex search' }).click()
      await search.fill('auth\\.')
      await expect(page.locator('[data-row-key]').first()).toBeVisible()

      await page.getByRole('combobox', { name: /Search in/i }).click()
      await page.getByRole('option', { name: 'Keys' }).click()
      const scope = await page.evaluate(
        () => window.__TM_STORE__?.getState().searchScope ?? null,
      )
      expect(scope).toBe('keys')
    } finally {
      await app.close()
    }
  })
})
