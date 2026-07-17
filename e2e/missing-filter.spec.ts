import { expect, test } from '@playwright/test'
import { launchApp, loadFixtures } from './helpers'

test.describe('Electron missing filter', () => {
  test('narrows to missing rows and restores on toggle off', async () => {
    const { app, page } = await launchApp()
    try {
      await loadFixtures(page)
      const allCount = await page.evaluate(
        () => window.__TM_STORE__?.getState().project?.rows.length ?? 0,
      )
      expect(allCount).toBeGreaterThan(0)

      await page.getByRole('button', { name: /Missing/ }).click()
      await expect
        .poll(async () =>
          page.evaluate(() => window.__TM_STORE__?.getState().missingFilterKeys?.length ?? -1),
        )
        .toBeGreaterThan(0)

      const filteredVisible = await page.locator('[data-row-key]').count()
      expect(filteredVisible).toBeGreaterThan(0)
      expect(filteredVisible).toBeLessThan(allCount * 2)

      await page.getByRole('button', { name: /Missing/ }).click()
      await expect
        .poll(async () =>
          page.evaluate(() => window.__TM_STORE__?.getState().missingFilterKeys ?? null),
        )
        .toBeNull()
    } finally {
      await app.close()
    }
  })
})
