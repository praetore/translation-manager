import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
} from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import {
  IPC_CHANNELS,
  SUPPORTED_EXTENSIONS,
  type ScanDirectoryResult,
  type WriteFileRequest,
  type WriteFilesResult,
} from '../shared/types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Translation Manager',
    show: false,
    icon: path.join(process.env.VITE_PUBLIC ?? RENDERER_DIST, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    void mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error('Window failed to load', { code, description, url })
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process gone', details)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function isSupportedTranslationFile(fileName: string): boolean {
  const lower = fileName.toLowerCase()
  return SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

async function scanDirectory(directoryPath: string): Promise<ScanDirectoryResult> {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (!entry.isFile() || !isSupportedTranslationFile(entry.name)) {
      continue
    }

    const filePath = path.join(directoryPath, entry.name)
    const content = await fs.readFile(filePath, 'utf-8')
    files.push({
      filePath,
      fileName: entry.name,
      content,
    })
  }

  files.sort((a, b) => a.fileName.localeCompare(b.fileName))

  return {
    directoryPath,
    files,
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.SELECT_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
      title: 'Select translation folder',
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })

  ipcMain.handle(
    IPC_CHANNELS.SCAN_DIRECTORY,
    async (_event, directoryPath: string): Promise<ScanDirectoryResult> => {
      if (!directoryPath || typeof directoryPath !== 'string') {
        throw new Error('Invalid directory path')
      }

      const stats = await fs.stat(directoryPath)
      if (!stats.isDirectory()) {
        throw new Error('Path is not a directory')
      }

      return scanDirectory(directoryPath)
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.WRITE_FILES,
    async (_event, requests: WriteFileRequest[]): Promise<WriteFilesResult> => {
      const written: string[] = []
      const errors: WriteFilesResult['errors'] = []

      for (const request of requests) {
        try {
          await fs.writeFile(request.filePath, request.content, 'utf-8')
          written.push(request.filePath)
        } catch (error) {
          errors.push({
            filePath: request.filePath,
            message: error instanceof Error ? error.message : String(error),
          })
        }
      }

      return { written, errors }
    },
  )
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
