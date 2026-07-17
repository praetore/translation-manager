import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import electronPath from 'electron'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const fixtures = path.join(root, 'fixtures')
const localOut = process.argv.includes('--local')
const outDir = process.env.TM_SCREENSHOT_OUT
  ? path.resolve(process.env.TM_SCREENSHOT_OUT)
  : localOut
    ? path.join(root, 'tmp', 'screenshots')
    : path.join(root, 'docs')

// Chromium refuses to start as root (Docker/CI) without these flags as argv.
const electronArgs = ['.', '--no-sandbox', '--disable-dev-shm-usage']

const child = spawn(electronPath, electronArgs, {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    TM_SCREENSHOT: '1',
    TM_SCREENSHOT_FIXTURES: fixtures,
    TM_SCREENSHOT_OUT: outDir,
  },
})

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Electron exited from signal ${signal}`)
    process.exit(1)
  }
  process.exit(code ?? 1)
})
