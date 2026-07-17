/// <reference types="vite/client" />

import type { ElectronAPI } from '../../electron/preload'

declare global {
  interface Window {
    electronAPI: ElectronAPI
    /** Present only during screenshot capture (localStorage flag). */
    __TM_STORE__?: {
      getState: () => {
        project: { rows: { key: string }[] } | null
        selectedKeys: string[]
        selectKeys: (keys: string[]) => void
        load?: { loading: boolean }
      }
    }
  }
}

export {}
