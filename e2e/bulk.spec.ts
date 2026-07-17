import { expect, test } from '@playwright/test'
import { launchApp, loadFixtures, selectFirstKeys } from './helpers'

test.describe('Electron bulk actions', () => {
  test('moves selected keys with a new lead path', async () => {
    const { app, page } = await launchApp()
    try {
      await loadFixtures(page)
      const [key] = await selectFirstKeys(page, 1)
      expect(key).toBeTruthy()

      await page.getByRole('button', { name: 'Move' }).click()
      await page.getByLabel('New path').fill('moved')
      await page.getByRole('dialog').getByRole('button', { name: 'Move' }).click()

      const keys = await page.evaluate(
        () => window.__TM_STORE__?.getState().project?.rows.map((row) => row.key) ?? [],
      )
      const leaf = key.split('.').pop()!
      expect(keys).toContain(`moved.${leaf}`)
      expect(keys).not.toContain(key)
    } finally {
      await app.close()
    }
  })

  test('deletes selected keys after confirm', async () => {
    const { app, page } = await launchApp()
    try {
      await loadFixtures(page)
      const keys = await selectFirstKeys(page, 2)
      expect(keys).toHaveLength(2)

      await page.getByRole('button', { name: 'Delete', exact: true }).click()
      await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()

      await expect
        .poll(async () =>
          page.evaluate(() => window.__TM_STORE__?.getState().selectedKeys.length ?? -1),
        )
        .toBe(0)

      const remaining = await page.evaluate(
        () => window.__TM_STORE__?.getState().project?.rows.map((row) => row.key) ?? [],
      )
      for (const key of keys) {
        expect(remaining).not.toContain(key)
      }
    } finally {
      await app.close()
    }
  })
})
