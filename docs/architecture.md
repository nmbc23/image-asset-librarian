# Architecture

Image Asset Librarian is split into three small layers: scanner, server, and browser UI.

## Scanner

`src/scanner.js` walks configured roots, filters supported image extensions, extracts basic metadata, hashes file contents, and produces a versioned JSON index.

Responsibilities:

- Respect only user-configured roots.
- Ignore unsupported files.
- Record recoverable scan errors without aborting the whole library.
- Group exact duplicates by SHA-256 content hash.

## Config

`src/config.js` loads `asset-librarian.config.json` and resolves root paths relative to the config file. This keeps the default sample config portable while still supporting absolute local paths.

## Server

`src/server.js` serves the static app and exposes two local routes:

- `GET /api/index` returns the generated index.
- `GET /assets/:id` serves only files listed in the generated index.

The server is intentionally small and uses Node.js built-ins only.

## Browser UI

`public/app.js` fetches the index and renders the gallery. `public/view-model.js` keeps filtering, sorting, duplicate detection state, and byte formatting as testable pure functions.

UI responsibilities:

- Search by name, relative path, source, or extension.
- Filter by source, file type, orientation, resolution bucket, age, duplicate state, and local review marks.
- Apply browser-local tags to selected assets and use those tags as gallery filters.
- Store browser-local notes per asset, search note text, and filter assets by whether notes exist.
- Show active filter chips so users can inspect or clear individual filters without resetting the whole gallery.
- Store named filter views in browser local storage so common curation workflows can be reapplied quickly.
- Use source and file-type breakdowns as quick filter controls.
- Sort by date, size, or name.
- Highlight duplicate assets.
- Inspect a filtered result set in a detail drawer with previous/next buttons and keyboard navigation.
- Suggest a stable file to keep in each duplicate group, copy all group paths, and copy only cleanup-candidate paths that exclude the suggested keep file.
- Store saved/review marks in browser local storage so the generated index stays disposable.
- Apply saved/review/unmarked states to selected assets in batches for faster curation.
- Copy and import saved/review mark backups as JSON through the clipboard.
- Copy and import full curation backups containing marks, asset tags, asset notes, and saved filter views.
- Select all currently visible filtered assets and copy selected or visible asset paths as a batch for downstream cleanup, curation, or prompt-tracking work.
- Copy selected or visible asset metadata as CSV for spreadsheets, issue reports, and lightweight inventory work.
- Copy selected or visible asset metadata as a structured JSON manifest that can include local curation annotations for automation and reproducible downstream workflows.
- Copy a Markdown workflow report summarizing selected, saved, and review-queue assets.
- Keep private local paths visible only to the local user.

## Data Flow

```mermaid
flowchart LR
  A["Configured image roots"] --> B["Scanner"]
  B --> C["data/index.json"]
  C --> D["Local HTTP server"]
  D --> E["Browser gallery"]
  D --> F["Indexed asset route"]
```

## Design Constraints

- No database.
- No external network calls in the default workflow.
- No required cloud account.
- No hidden telemetry.
- No dependency-heavy framework.
