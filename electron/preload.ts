import { contextBridge, ipcRenderer } from 'electron'
import {
  IPC_CHANNELS,
  type ScanDirectoryResult,
  type WriteFileRequest,
  type WriteFilesResult,
} from '../shared/types'

const electronApi = {
  selectDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.SELECT_DIRECTORY),

  scanDirectory: (directoryPath: string): Promise<ScanDirectoryResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.SCAN_DIRECTORY, directoryPath),

  writeFiles: (files: WriteFileRequest[]): Promise<WriteFilesResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.WRITE_FILES, files),

  getUiLocale: (): Promise<string> => ipcRenderer.invoke(IPC_CHANNELS.GET_UI_LOCALE),

  setUiLocale: (locale: string): Promise<string> =>
    ipcRenderer.invoke(IPC_CHANNELS.SET_UI_LOCALE, locale),

  onUiLocaleChanged: (callback: (locale: string) => void): (() => void) => {
    const listener = (_event: unknown, locale: string): void => {
      callback(locale)
    }
    ipcRenderer.on(IPC_CHANNELS.UI_LOCALE_CHANGED, listener)
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.UI_LOCALE_CHANGED, listener)
    }
  },

  getUiTheme: (): Promise<string> => ipcRenderer.invoke(IPC_CHANNELS.GET_UI_THEME),

  setUiTheme: (theme: string): Promise<string> =>
    ipcRenderer.invoke(IPC_CHANNELS.SET_UI_THEME, theme),

  onUiThemeChanged: (callback: (theme: string) => void): (() => void) => {
    const listener = (_event: unknown, theme: string): void => {
      callback(theme)
    }
    ipcRenderer.on(IPC_CHANNELS.UI_THEME_CHANGED, listener)
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.UI_THEME_CHANGED, listener)
    }
  },

  onMenuOpen: (callback: () => void): (() => void) => {
    const listener = (): void => {
      callback()
    }
    ipcRenderer.on(IPC_CHANNELS.MENU_OPEN, listener)
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.MENU_OPEN, listener)
    }
  },

  onMenuSave: (callback: () => void): (() => void) => {
    const listener = (): void => {
      callback()
    }
    ipcRenderer.on(IPC_CHANNELS.MENU_SAVE, listener)
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.MENU_SAVE, listener)
    }
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronApi)

export type ElectronAPI = typeof electronApi
