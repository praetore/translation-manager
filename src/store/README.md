# Store architecture

Zustand holds the editor session; React derives what the grid shows.

## Layers

| Layer | Module | Role |
| --- | --- | --- |
| Public API | `storeApi.ts` | Action signatures + motion options contract |
| State shape | `types.ts` | Session + motion fields |
| Raw store | `translationStore.ts` | Mutations, load/save, `transitionDisplayKeys` wrapper |
| Display hook | `hooks/useTranslationStore.tsx` | Deferred search, hold keys, `displayProject` |
| Selectors | `selectors.ts` | `project` → missing snapshot → search |
| Dirty + lists | `sessionHelpers.ts`, `keyLists.ts`, `sessionBulkActions.ts` | Baseline dirty flag; keep selection/fresh/missing/pending in sync |
| Motion | `motionActions.ts`, `filterLayout.ts` | FLIP/fade timers; see `storeApi` for ownership |
| Persistence | `persistence.ts` | IPC load/save + `localStorage` directory |

## Data flow

```
disk (Electron IPC)
  → scanDirectory
  → classifyTranslationFiles → filePicker dialog (or error if none valid)
  → confirmOpenFiles → buildProjectFromFiles
  → store.project + baselineRows
  → selectDisplayProject(missingFilterKeys, search*)
  → useTranslationStore (deferred query + searchLayoutHoldKeys)
  → displayProject → TranslationTable
```

## What the UI should use

- **`useTranslationStore()`** — grid, toolbar, dialogs. Exposes `displayProject` and `liveMissingKeys`.
- **`useTranslationStoreBase`** — tests, e2e (`window.__TM_STORE__`), persistence internals.

Do not read `searchLayoutHoldKeys` or call `transitionDisplayKeys` from components; the hook owns search motion.

## Mutation styles

| Kind | Pattern |
| --- | --- |
| Cell / rename / leave-fresh | Direct `set` (no list motion) |
| Add / delete / missing filter / search | `transitionDisplayKeys(from, to, options)` |
| Delete commit | Pass `onDone` so rows exit before state drops them |
| Missing filter | `trackFilterMode: true`; owns `filterLayoutMode` while animating |

## Related docs

- Motion options: `storeApi.ts`
- Missing rules: `services/translationProject.ts` (`isMissingAgainstSource`)
- Dual-pane table: `components/translation-table/TranslationTable.tsx`
- Contributing / tests: repo root `CONTRIBUTING.md`
