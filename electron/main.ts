/**
 * Electron main process: window, menu, and filesystem IPC.
 *
 * Renderer never touches `fs` / `dialog` — only `window.electronAPI` (preload).
 * Scan is non-recursive and limited to `SUPPORTED_EXTENSIONS`. Write returns
 * partial success (`written` + `errors`). See `shared/types.ts` for channels.
 */
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeTheme,
  type MenuItemConstructorOptions,
} from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import {
  createTranslator,
  resolveUiLocale,
  UI_LOCALES,
  type UiLocale,
} from '../shared/i18n'
import {
  resolveUiTheme,
  UI_THEMES,
  type UiTheme,
} from '../shared/theme'
import {
  IPC_CHANNELS,
  SUPPORTED_EXTENSIONS,
  type ScanDirectoryResult,
  type WriteFileRequest,
  type WriteFilesResult,
} from '../shared/types'
import { isScreenshotMode, runScreenshotCapture } from './screenshot'

if (isScreenshotMode()) {
  // Required in Docker/CI (no user namespace privileges for Chromium sandbox).
  app.commandLine.appendSwitch('no-sandbox')
  app.commandLine.appendSwitch('disable-dev-shm-usage')
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let mainWindow: BrowserWindow | null = null
let uiLocale: UiLocale = 'en'
let uiTheme: UiTheme = 'system'

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
    if (isScreenshotMode()) {
      void runScreenshotCapture(mainWindow!, setUiTheme)
      return
    }
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

function sendMenuAction(channel: string): void {
  mainWindow?.webContents.send(channel)
}

function setUiLocale(next: UiLocale, broadcast = true): void {
  if (uiLocale === next) {
    createApplicationMenu()
    return
  }

  uiLocale = next
  createApplicationMenu()

  if (broadcast) {
    mainWindow?.webContents.send(IPC_CHANNELS.UI_LOCALE_CHANGED, uiLocale)
  }
}

function setUiTheme(next: UiTheme, broadcast = true): void {
  uiTheme = next
  nativeTheme.themeSource = next
  createApplicationMenu()

  if (broadcast) {
    mainWindow?.webContents.send(IPC_CHANNELS.UI_THEME_CHANGED, uiTheme)
  }
}

function createApplicationMenu(): void {
  const isMac = process.platform === 'darwin'
  const t = createTranslator(uiLocale)

  const languageMenu: MenuItemConstructorOptions = {
    label: t('menu.language'),
    submenu: UI_LOCALES.map(
      (locale): MenuItemConstructorOptions => ({
        label: t(`language.${locale}`),
        type: 'radio',
        checked: uiLocale === locale,
        click: () => setUiLocale(locale, true),
      }),
    ),
  }

  const themeMenu: MenuItemConstructorOptions = {
    label: t('menu.theme'),
    submenu: UI_THEMES.map(
      (theme): MenuItemConstructorOptions => ({
        label: t(`theme.${theme}`),
        type: 'radio',
        checked: uiTheme === theme,
        click: () => setUiTheme(theme, true),
      }),
    ),
  }

  const fileMenu: MenuItemConstructorOptions = {
    label: t('menu.file'),
    submenu: [
      {
        label: t('menu.open'),
        accelerator: 'CmdOrCtrl+O',
        click: () => sendMenuAction(IPC_CHANNELS.MENU_OPEN),
      },
      {
        label: t('menu.save'),
        accelerator: 'CmdOrCtrl+S',
        click: () => sendMenuAction(IPC_CHANNELS.MENU_SAVE),
      },
      { type: 'separator' },
      isMac
        ? { role: 'close', label: t('menu.close') }
        : { role: 'quit', label: t('menu.quit') },
    ],
  }

  const editMenu: MenuItemConstructorOptions = {
    label: t('menu.edit'),
    submenu: [
      { role: 'undo', label: t('menu.undo') },
      { role: 'redo', label: t('menu.redo') },
      { type: 'separator' },
      { role: 'cut', label: t('menu.cut') },
      { role: 'copy', label: t('menu.copy') },
      { role: 'paste', label: t('menu.paste') },
      { role: 'selectAll', label: t('menu.selectAll') },
    ],
  }

  const viewMenu: MenuItemConstructorOptions = {
    label: t('menu.view'),
    submenu: [
      { role: 'reload', label: t('menu.reload') },
      { role: 'toggleDevTools', label: t('menu.toggleDevTools') },
      { type: 'separator' },
      { role: 'resetZoom', label: t('menu.resetZoom') },
      { role: 'zoomIn', label: t('menu.zoomIn') },
      { role: 'zoomOut', label: t('menu.zoomOut') },
      { type: 'separator' },
      { role: 'togglefullscreen', label: t('menu.toggleFullscreen') },
      { type: 'separator' },
      themeMenu,
      languageMenu,
    ],
  }

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about', label: t('menu.about') },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide', label: t('menu.hide') },
              { role: 'hideOthers', label: t('menu.hideOthers') },
              { role: 'unhide', label: t('menu.unhide') },
              { type: 'separator' },
              { role: 'quit', label: t('menu.quitApp') },
            ],
          } satisfies MenuItemConstructorOptions,
        ]
      : []),
    fileMenu,
    editMenu,
    viewMenu,
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
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
    const t = createTranslator(uiLocale)
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
      title: t('menu.openFolderDialog'),
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

  ipcMain.handle(IPC_CHANNELS.GET_UI_LOCALE, () => uiLocale)

  ipcMain.handle(IPC_CHANNELS.SET_UI_LOCALE, (_event, locale: string) => {
    setUiLocale(resolveUiLocale(locale), false)
    return uiLocale
  })

  ipcMain.handle(IPC_CHANNELS.GET_UI_THEME, () => uiTheme)

  ipcMain.handle(IPC_CHANNELS.SET_UI_THEME, (_event, theme: string) => {
    setUiTheme(resolveUiTheme(theme), false)
    return uiTheme
  })
}

app.whenReady().then(() => {
  uiLocale = resolveUiLocale(app.getLocale())
  nativeTheme.themeSource = uiTheme
  registerIpcHandlers()
  createApplicationMenu()
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
