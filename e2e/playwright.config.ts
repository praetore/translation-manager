import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from '@playwright/test'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export default defineConfig({
  testDir: path.dirname(fileURLToPath(import.meta.url)),
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: path.join(root, 'tmp', 'playwright-report') }]],
  outputDir: path.join(root, 'tmp', 'playwright-results'),
  use: {
    trace: 'on-first-retry',
  },
})
