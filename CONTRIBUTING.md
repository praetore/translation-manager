# Contributing

## Setup

```bash
npm install
npm run dev
```

Node 20+ (22 recommended). See the README for packaging and release tags.

## Checks before a PR

```bash
npm test
npm run lint:all
npm run build          # required before e2e
npm run test:e2e
```

`lint:all` runs ESLint plus a **300 effective-line** file-length check (`scripts/check-file-length.mjs`). Comments and blank lines do not count.

## Unit tests (Vitest)

- Prefer fixtures from `src/test/projectFixture.ts`:
  - `sampleProject()` — in-memory multi-locale project
  - `loadSampleProject()` — seeds the Zustand store for component tests
- Reset store state between tests with `resetTranslationStore()` from `translationStore.ts` (clears motion timers too).
- Motion / filter tests often use Vitest fake timers; durations live in `src/lib/motion.ts` (`FILTER_LAYOUT_MS`, `ROW_ENTER_MS`, …).
- DOM tests: `src/test/renderWithProviders.tsx` and `src/test/setup.dom.ts`.

## E2E (Playwright + Electron)

- Config: `e2e/playwright.config.ts`. Helpers: `e2e/helpers.ts`.
- Always **`npm run build`** first so the packaged renderer/main match what Playwright launches.
- The renderer exposes `window.__TM_STORE__` (Zustand store) for selection and state setup in smoke/screenshot flows — set in `TranslationStoreProvider`, cleared on unmount.

## Screenshots

```bash
npm run build
npm run screenshots:local   # gitignored tmp/
npm run screenshots         # writes docs/ for README
```

## Architecture pointers

| Topic | Where |
| --- | --- |
| Store layers | `src/store/README.md` |
| Motion contract | `src/store/storeApi.ts` |
| Missing-filter rules | `src/services/translationProject.ts` |
| Dual-pane grid | `src/components/translation-table/TranslationTable.tsx` |
| Format adapters | `shared/adapters/TranslationAdapter.ts` |
| IPC surface | `shared/types.ts` (`IPC_CHANNELS`), `electron/preload.ts` |
| Move-key DSL | `src/services/keyPaths.ts` |

Filesystem access stays in the Electron main process (`contextIsolation: true`, no `nodeIntegration`). Renderer talks only through `window.electronAPI`.
