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
}

contextBridge.exposeInMainWorld('electronAPI', electronApi)

export type ElectronAPI = typeof electronApi
