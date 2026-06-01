# Privacy Notes

Image Asset Librarian is designed to run locally. The default workflow scans a local folder, writes a JSON index to `data/index.json`, and serves the gallery from `127.0.0.1`.

## What Stays Local

- Image files.
- Absolute paths in the generated index.
- File names, sizes, hashes, dimensions, and modification times.
- Embedded SVG/PNG text metadata, including prompts or titles when present.
- Generated descriptions and card captions derived from local file metadata, color labels, palettes, and embedded metadata.
- Generated alt text derived from local file metadata, color labels, palettes, and embedded metadata.
- Duplicate group information.
- Library health reports, which summarize local metadata and only leave the browser when copied or downloaded by the user.
- Asset issue reports, which are generated locally and only leave the browser when copied or downloaded by the user.
- Image embed snippets, which use local asset URLs and only leave the browser when copied or downloaded by the user.
- Contact sheets, including similar-group contact sheets, which use local asset URLs and only leave the browser when copied or downloaded by the user.
- Publishing checklists, which combine local metadata, issue status, alt text, and local asset URLs only when copied or downloaded by the user.
- Readiness reports, which summarize local issue status, suggested filenames, and generated alt text only when copied or downloaded by the user.
- Provenance reports, which summarize embedded prompt/title/text metadata and only leave the browser when copied or downloaded by the user.
- Prompt keyword reports, which summarize reusable terms from embedded metadata and only leave the browser when copied or downloaded by the user.
- Collection briefs, which summarize selected or visible local asset metadata and only leave the browser when copied or downloaded by the user.
- Rename plans, which can include local relative paths and only leave the browser when copied or downloaded by the user.
- Saved and review marks, which are stored in browser local storage as asset ids and can be copied or downloaded as JSON backups only when the user clicks the backup controls.

## Network Behavior

The current app does not make external network requests. Browser requests are local routes served by the included Node.js server:

- `/api/index`
- `/assets/:id`
- Static files from `public/`

## Future AI Features

Optional AI-assisted tagging and semantic search should remain explicit opt-in features. Users should be able to choose which images or metadata are analyzed, and the local gallery should continue to work without API credentials.

## Local Path Caution

The generated index can contain absolute filesystem paths and embedded prompt metadata. Keep `data/index.json` out of public commits when scanning private folders. The repository `.gitignore` already ignores that file.
