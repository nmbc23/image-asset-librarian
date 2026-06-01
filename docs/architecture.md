# Architecture

Image Asset Librarian is split into three small layers: scanner, server, and browser UI.

## Scanner

`src/scanner.js` walks configured roots, filters supported image extensions, extracts basic metadata, reads embedded SVG title/description and PNG text chunks, infers lightweight local themes from filenames, folder names, vector status, image metadata, SVG color values, and PNG pixel samples, builds compact palettes, groups similar visual signatures, hashes file contents, and produces a versioned JSON index.

Responsibilities:

- Respect only user-configured roots.
- Ignore unsupported files.
- Record recoverable scan errors without aborting the whole library.
- Extract embedded prompt/title metadata from SVG and PNG files without uploading assets.
- Group exact duplicates by SHA-256 content hash.
- Group non-duplicate assets with similar local visual signatures from theme, orientation, color vibe, and dominant palette color.

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

- Search by name, relative path, source, extension, inferred theme, inferred color vibe, palette hex color, generated description, or embedded metadata.
- Filter by source, file type, orientation, resolution bucket, inferred theme, inferred color vibe, local asset issue, age, duplicate state, and local review marks.
- Apply browser-local tags to selected assets and use those tags as gallery filters.
- Store browser-local notes per asset, search note text, and filter assets by whether notes exist.
- Show active filter chips so users can inspect or clear individual filters without resetting the whole gallery.
- Store named filter views in browser local storage so common curation workflows can be reapplied quickly.
- Use source, file-type, resolution, asset issue, inferred theme, and color-vibe breakdowns as quick filter controls.
- Copy or download a Markdown asset issue report that groups duplicate, missing-dimension, and tiny-resolution files for cleanup planning.
- Review similar visual groups with thumbnail previews, jump into the matching search query, copy group paths, or copy a Markdown contact sheet for the group.
- Show compact palette swatches on asset cards and in the detail drawer.
- Generate concise local image descriptions from indexed visual signals, show them on asset cards, copy them one-by-one, export selected/visible description batches, or save them as local notes.
- Generate accessibility-oriented alt text from the same local visual signals, then copy or download selected/visible Markdown alt text lists for publishing workflows.
- Generate stable suggested filenames from local theme, color, dimension, and source-name signals, then copy or download selected/visible Markdown rename plans without modifying files.
- Copy selected or visible assets as Markdown contact sheets with local preview links, descriptions, paths, dimensions, and file sizes.
- Show embedded metadata in the detail drawer with copy controls.
- Sort by date, file size, resolution, or name.
- Highlight duplicate assets.
- Inspect a filtered result set in a detail drawer with previous/next buttons, keyboard navigation, and saved/review mark controls.
- Suggest a stable file to keep in each duplicate group, copy all group paths, and copy only cleanup-candidate paths that exclude the suggested keep file.
- Store saved/review marks in browser local storage so the generated index stays disposable.
- Apply saved/review/unmarked states to selected assets in batches for faster curation.
- Copy, download, and import saved/review mark backups as JSON.
- Copy and import full curation backups containing marks, asset tags, asset notes, and saved filter views, and download those backups as timestamped JSON files.
- Copy or download a Markdown library health report summarizing total size, duplicate pressure, issue counts, source/type/resolution/theme/color breakdowns, and cleanup recommendations.
- Select all currently visible filtered assets and copy selected or visible asset paths as a batch for downstream cleanup, curation, or prompt-tracking work.
- Copy or download selected or visible alt text lists as Markdown for README, documentation, and web publishing tasks.
- Copy or download selected or visible Markdown/HTML image embed snippets with generated alt text and local preview URLs.
- Copy or download selected or visible publishing checklists combining suggested filenames, alt text, dimensions, issue status, and Markdown embeds.
- Copy or download selected or visible readiness reports summarizing ready assets, review-needed assets, issue counts, suggested filenames, and alt text.
- Copy or download selected or visible provenance reports summarizing embedded prompt, title, description, and text metadata by source.
- Copy or download selected or visible prompt keyword reports that count reusable terms from embedded prompt/title/description metadata.
- Copy selected or visible asset metadata, including palettes, generated descriptions, and embedded prompt/title metadata, as CSV for spreadsheets, issue reports, and lightweight inventory work.
- Copy selected or visible asset metadata, including palettes, generated descriptions, and embedded prompt/title metadata, as a structured JSON manifest that can include local curation annotations for automation and reproducible downstream workflows.
- Copy or download selected or visible rename plans as Markdown so downstream cleanup can review proposed filenames before any file operation happens.
- Copy or download a Markdown workflow report summarizing selected, saved, and review-queue assets, including local tags and notes when present.
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
