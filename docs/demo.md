# Demo Walkthrough

This walkthrough shows the smallest useful version of Image Asset Librarian: scan a safe sample library, find repeated or related assets, and export notes without touching private folders.

## Demo Scenario

The bundled `sample-library/` is designed for a quick GitHub visitor test. It contains a small set of public SVG files, including one exact duplicate and one visually related pair.

Run:

```bash
npm install
npm run scan
npm run serve
```

Open `http://127.0.0.1:4173`.

Try this path through the app:

1. Confirm the library badge says "Sample Library".
2. Search for `terrace` to see matching assets and generated local descriptions.
3. Open the duplicate panel and copy cleanup-candidate paths.
4. Open the similar-groups panel and copy a Markdown contact sheet.
5. Open an asset detail drawer and review metadata, suggested filename, description, alt text, and AI-style review.
6. Mark one asset as saved and one as review, then export a selected-asset checklist.

## Sample Library vs. Real Library

The sample library proves the app works without publishing private local paths. It is small on purpose: it should explain the workflow, not pretend to be a full production asset archive.

A real library starts when you scan your own folder from the top scanner or from `asset-librarian.config.local.json`. Recent folder paths are saved only in browser local storage. The generated `data/index.json` can include absolute paths and embedded prompt metadata, so it is ignored by git.

## Local Rules, Not Cloud AI

Current descriptions, reviews, themes, color vibes, and similar groups use local rules, not cloud AI. They are derived from filenames, folders, dimensions, hashes, embedded SVG/PNG metadata, issue flags, and sampled colors.

There are no OpenAI calls, no image uploads, no telemetry, and no required API key in the default workflow. Future AI integrations should be explicit opt-in features and should document exactly which files or metadata leave the machine.

## Real Folder Smoke Test

When testing a personal folder:

1. Start the server with `npm run serve`.
2. Paste an absolute image folder path into the "Image folder path" field.
3. Click "Scan folder".
4. Confirm the gallery refreshes and the badge no longer identifies the data as the sample library.
5. Try search, duplicate-only mode, similar groups, and one export action.

Keep screenshots for the README based on the sample library unless you intentionally want to reveal real file names.
