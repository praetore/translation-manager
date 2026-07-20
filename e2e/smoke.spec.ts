import { expect, test } from '@playwright/test'
import { launchApp, loadFixtures, selectFirstKeys } from './helpers'

test.describe('Electron smoke', () => {
  test('loads fixtures, selects rows, and shows selection chrome', async () => {
    const { app, page } = await launchApp()
    try {
      await loadFixtures(page)
      expect(await selectFirstKeys(page, 3)).toHaveLength(3)

      const bulkDelete = page.getByRole('button', { name: 'Delete', exact: true })
      await expect(page.getByRole('button', { name: 'Deselect' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Move' })).toBeVisible()
      await expect(bulkDelete).toBeVisible()
      await expect(page.locator('[data-row-key][aria-selected="true"]')).toHaveCount(6)

      await page.getByRole('button', { name: 'Deselect' }).click()
      await expect(page.getByRole('button', { name: 'Deselect' })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Move' })).toBeDisabled()
      await expect(bulkDelete).toBeDisabled()

      const browserWindow = await app.browserWindow(page)
      await browserWindow.evaluate((win) => {
        win.setContentSize(1000, 800)
      })

      await selectFirstKeys(page, 8)
      await expect(page.getByRole('button', { name: 'Move' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Delete', exact: true })).toBeVisible()
    } finally {
      await app.close()
    }
  })
})
