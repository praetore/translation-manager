import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const MAX_LINES = 300
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const INCLUDE_DIRS = ['src', 'electron', 'shared', 'scripts']
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const IGNORE_DIR_NAMES = new Set([
  'node_modules',
  'dist',
  'dist-electron',
  'release',
  '.git',
  'fixtures',
  'locales',
  'docs',
  'build',
  'public',
])

/**
 * Count non-blank, non-comment-only lines (aligned with ESLint max-lines options).
 */
function countEffectiveLines(source) {
  let count = 0
  let inBlockComment = false

  for (const rawLine of source.split(/\r?\n/)) {
    let line = rawLine

    if (inBlockComment) {
      const end = line.indexOf('*/')
      if (end === -1) {
        continue
      }
      line = line.slice(end + 2)
      inBlockComment = false
    }

    while (line.includes('/*')) {
      const start = line.indexOf('/*')
      const end = line.indexOf('*/', start + 2)
      if (end === -1) {
        line = line.slice(0, start)
        inBlockComment = true
        break
      }
      line = `${line.slice(0, start)}${line.slice(end + 2)}`
    }

    line = line.replace(/\/\/.*$/, '').trim()
    if (line.length > 0) {
      count += 1
    }
  }

  return count
}

async function walk(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (IGNORE_DIR_NAMES.has(entry.name)) {
      continue
    }
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(fullPath, files)
      continue
    }
    if (EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }
  return files
}

async function main() {
  const files = []
  for (const dir of INCLUDE_DIRS) {
    const absolute = path.join(ROOT, dir)
    try {
      const info = await stat(absolute)
      if (info.isDirectory()) {
        await walk(absolute, files)
      }
    } catch {
      // directory may not exist
    }
  }

  const violators = []
  for (const file of files) {
    const source = await readFile(file, 'utf8')
    const lines = countEffectiveLines(source)
    if (lines > MAX_LINES) {
      violators.push({
        file: path.relative(ROOT, file).replaceAll('\\', '/'),
        lines,
        overBy: lines - MAX_LINES,
      })
    }
  }

  violators.sort((a, b) => b.lines - a.lines || a.file.localeCompare(b.file))

  if (violators.length === 0) {
    console.log(`File length check passed (max ${MAX_LINES} effective lines).`)
    return
  }

  console.error(`File length check failed — max ${MAX_LINES} effective lines.\n`)
  console.error('Violators:')
  for (const item of violators) {
    console.error(`  - ${item.file}  (${item.lines} lines, +${item.overBy} over limit)`)
  }
  console.error(`\n${violators.length} file(s) exceed the limit. Split them before committing.`)
  process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
