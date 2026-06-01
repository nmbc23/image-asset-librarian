# Contributing

Thanks for helping improve Image Asset Librarian. The project is intentionally small, local-first, and dependency-light, so changes should preserve those traits unless there is a clear product reason not to.

## Product Principles

- Make the first run obvious: a new visitor should understand the app from the README and sample library before reading source code.
- Polish one core workflow before adding another button.
- Keep AI wording honest: current descriptions, reviews, and grouping are local-rule features unless a change adds a real opt-in AI integration.
- Protect private folders, absolute paths, embedded prompt metadata, and generated indexes.
- Prefer small modules with tests over broad UI changes that are hard to maintain.

## Good First Contributions

- Improve scanner support for image metadata.
- Add tests for path handling, duplicate detection, and local folder rescans.
- Improve accessibility and keyboard flow in the gallery UI.
- Add or refine sample-library fixtures that demonstrate a real workflow.
- Clarify documentation for local AI image workflows.

## Development

```bash
npm install
npm test
npm run scan
npm run serve
```

Open `http://127.0.0.1:4173` after starting the server. The default config scans `sample-library/`.

## Pull Request Checklist

- Keep personal file paths out of commits.
- Add or update tests for behavior changes.
- Run `npm test` before opening a PR.
- Update the README, demo docs, or screenshots when commands, configuration, or user-facing behavior changes.
- Explain privacy impact when a change touches local files, metadata, generated indexes, network behavior, or future AI integrations.
- Check whether the UI can be simplified instead of adding a new visible control.

## Project Values

- Local-first by default.
- Clear file boundaries and small modules.
- No hidden network calls.
- Practical creator workflows over abstract demos.
- Security-conscious handling of local filesystem paths.
