import path from 'node:path'
import { defineConfig } from 'vitest/config'

const alias = {
  '@': path.resolve(__dirname, 'src'),
  '@shared': path.resolve(__dirname, 'shared'),
}

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.test.ts', 'shared/**/*.test.ts'],
          exclude: [
            'src/hooks/useToolbarCompact.test.ts',
            'src/**/*.test.tsx',
            // DOMParser for XLIFF
            'shared/adapters/adapters.test.ts',
          ],
          setupFiles: ['src/test/setup.ts'],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: [
            'src/**/*.test.tsx',
            'src/hooks/useToolbarCompact.test.ts',
            'shared/adapters/adapters.test.ts',
          ],
          setupFiles: ['src/test/setup.ts'],
        },
      },
    ],
  },
})
