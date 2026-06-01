# Image Asset Librarian

[![CI](https://github.com/nmbc23/image-asset-librarian/actions/workflows/ci.yml/badge.svg)](https://github.com/nmbc23/image-asset-librarian/actions/workflows/ci.yml)

A zero-dependency local gallery for AI-generated image folders. It scans one or more directories, builds a searchable JSON index, serves thumbnails in the browser, and highlights duplicate files by content hash.

## Features

- Local-first scanner for PNG, JPG, GIF, SVG, WebP, AVIF, BMP, and TIFF files
- Browser gallery with search, saved filter views, clickable source/type breakdowns, local asset tags and notes, active filter chips, age/orientation/mark filters, duplicate-only mode, and size/date/name sorting
- Saved and review marks stored in your browser, with batch marking, backup/restore, selected/visible path and CSV exports, and Markdown workflow reports
- Duplicate groups with reclaimable storage estimates, suggested keep files, and copy actions for full groups or cleanup candidates
- No database and no external services
- Public-repo friendly sample library and config

## Quick Start

```bash
npm install
npm run scan
npm run serve
```

Open `http://127.0.0.1:4173`.

The default config scans `sample-library/`, so the project works immediately after cloning.

## Scan Your Own Folders

Copy the example config:

```bash
copy asset-librarian.config.example.json asset-librarian.config.local.json
```

Edit `asset-librarian.config.local.json`:

```json
{
  "roots": [
    {
      "name": "Generated Images",
      "path": "D:/Images/generated"
    }
  ],
  "output": "data/index.json"
}
```

Run:

```bash
node src/cli.js scan --config asset-librarian.config.local.json
node src/server.js --config asset-librarian.config.local.json
```

## Scripts

- `npm test` runs the Node test suite.
- `npm run scan` builds `data/index.json` from `asset-librarian.config.json`.
- `npm run report` writes a duplicate review report to `reports/duplicates.md`.
- `npm run serve` starts the local gallery at `http://127.0.0.1:4173`.

## How It Works

The scanner walks each configured root, records file metadata, extracts basic dimensions when possible, hashes file contents with SHA-256, and writes a static JSON index. The server exposes that index at `/api/index` and serves image files by indexed asset id at `/assets/:id`.

For a deeper overview, see [docs/architecture.md](docs/architecture.md). Planned improvements live in [ROADMAP.md](ROADMAP.md).

## Security and Privacy

Image Asset Librarian is local-first. It does not upload files or metadata in the current version, and `data/index.json` is ignored because it can contain absolute local paths. See [SECURITY.md](SECURITY.md) and [docs/privacy.md](docs/privacy.md) for details.

## GitHub Release Checklist

- Add a screenshot to the README after running the app with your real image folder.
- Keep personal folders in `asset-librarian.config.local.json`; it is ignored by git.
- Commit the sample config so new users can run the demo immediately.
