# Translation Manager

A local desktop translation editor for software projects. Open a folder of locale files, edit translations in a virtualized grid, and save changes back to disk — entirely offline, with no cloud or AI runtime.

Built with **Electron**, **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **shadcn/ui**.

## Features

- **Local folder workflow** — pick a directory via path input or native folder dialog
- **Multiple formats** via an adapter pattern:
  - JSON
  - YAML (`.yaml` / `.yml`)
  - gettext PO (`.po`)
  - Java `.properties`
- **Virtualized grid** — TanStack Table + `react-window` for large key sets
- **Dynamic language columns** — one column per detected locale file (e.g. `en.json`, `nl.json`, `it.po`)
- **Inline editing** — changes stay in memory until you save
- **Save to disk** — writes through Electron’s main process (`fs`) back to the original files
- **Missing translation checks** — empty target cells are highlighted when the source locale (`en`) has a value
- **Missing filter** — toggle to focus on incomplete rows; the filtered set stays stable while you edit (refresh by toggling the filter off and on again)
- **100% local** — no network calls for translation; Main/Renderer separation via IPC

## Screenshots / sample data

Use the included `fixtures/` folder to try the app quickly. It contains English, Dutch, French, German, and Italian files across JSON, YAML, Properties, and PO.

## Requirements

- Node.js 20+ (recommended)
- npm

## Getting started

```bash
npm install
npm run dev
```

This starts Vite and launches the Electron window.

### Build

```bash
npm run build
```

Outputs the renderer to `dist/` and Electron main/preload to `dist-electron/`.

### Package executables

```bash
# Current platform (Windows → installer + portable .exe)
npm run dist

# Explicit targets
npm run dist:win     # NSIS installer + portable EXE
npm run dist:mac     # DMG (run on macOS)
npm run dist:linux   # AppImage (run on Linux)
```

Artifacts are written to `release/`:

| Artifact | Description |
|----------|-------------|
| `Translation Manager-*-Setup.exe` | Windows NSIS installer |
| `Translation Manager-*-Portable.exe` | Windows portable app (no install) |
| `Translation Manager-*.dmg` | macOS disk image |
| `Translation Manager-*.AppImage` | Linux AppImage |

Optional: replace `build/icon.png` and run `npm run icons` to refresh `icon.ico` and public favicons.

### GitHub Releases

Pushing a version tag builds installers on Windows, macOS, and Linux and uploads them to a GitHub Release.

```bash
# 1. Bump version in package.json (must match the tag without the "v")
# 2. Commit, then tag and push:
git tag v0.1.0
git push origin v0.1.0
```

The workflow in `.github/workflows/release.yml` runs automatically on `v*` tags and publishes:

- Windows: Setup + Portable `.exe`
- macOS: `.dmg` (x64 + arm64, unsigned in CI)
- Linux: `.AppImage`

You can also trigger it manually via **Actions → Release → Run workflow**.

Ensure `package.json` → `repository.url` matches your GitHub repo so electron-builder can resolve the publish target.

## Usage

1. Start the app with `npm run dev`
2. Enter a folder path (or use **Browse…**) containing translation files
3. Click **Open**
4. Edit cells inline
5. Click **Save** to write files back to disk
6. Optionally click **Missing (N)** to show only rows that had incomplete translations when the filter was enabled

Locale codes are inferred from filenames (`en.json`, `messages_de.properties`, `fr.yaml`, `it.po`, …). The source locale defaults to `en` when present.

## Architecture

```
electron/          Main process + preload (filesystem & dialogs via IPC)
src/               React renderer (UI only)
shared/            Shared types, locale helpers, format adapters
fixtures/          Sample translation files for local testing
```

### Process separation

| Process   | Responsibility                                      |
|-----------|-----------------------------------------------------|
| Main      | `dialog`, `fs` read/write, directory scan           |
| Preload   | `contextBridge` API (`window.electronAPI`)          |
| Renderer  | UI, adapters, in-memory project state               |

IPC channels:

- `fs:select-directory`
- `fs:scan-directory`
- `fs:write-files`

### Adapter pattern

Each format implements:

- `parse(content) → flat key/value map`
- `serialize(map) → file content`

Nested JSON/YAML objects are flattened with dot notation (e.g. `nav.home`) for the grid, then reconstituted on save.

## Tech stack

- Electron + Vite (`vite-plugin-electron`)
- React 19 + TypeScript
- TanStack Table + react-window
- Tailwind CSS v4 + shadcn/ui
- `js-yaml` for YAML

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server + Electron |
| `npm run build` | Typecheck + production build |
| `npm run dist` | Build + package for the current OS |
| `npm run dist:win` | Build Windows installer + portable EXE |
| `npm run dist:mac` | Build macOS DMG |
| `npm run dist:linux` | Build Linux AppImage |
| `npm run dist:publish` | Build + publish to GitHub Releases (needs `GH_TOKEN`) |
| `npm run icons` | Regenerate `build/icon.ico` from `build/icon.png` |
| `npm run preview` | Preview Vite production build |

## License

This project is licensed under the [MIT License](LICENSE).
