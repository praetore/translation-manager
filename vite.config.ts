import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron/simple'
import path from 'node:path'

/** Writing translation fixtures must not restart Vite/Electron (that wipes UI state). */
const watchIgnored = [
  '**/fixtures/**',
  '**/dist/**',
  '**/dist-electron/**',
  '**/.git/**',
  '**/node_modules/**',
]

const electronWatch = {
  chokidar: {
    ignored: watchIgnored,
  },
}

export default defineConfig(({ command }) => {
  const isDev = command === 'serve'

  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      electron({
        main: {
          entry: 'electron/main.ts',
          vite: {
            build: {
              ...(isDev ? { watch: electronWatch } : {}),
            },
          },
          onstart({ startup }) {
            if (isDev) {
              void startup()
            }
          },
        },
        preload: {
          input: 'electron/preload.ts',
          vite: {
            build: {
              ...(isDev ? { watch: electronWatch } : {}),
            },
          },
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@shared': path.resolve(__dirname, 'shared'),
      },
    },
    server: {
      port: 5173,
      watch: {
        ignored: watchIgnored,
      },
    },
    clearScreen: false,
  }
})
