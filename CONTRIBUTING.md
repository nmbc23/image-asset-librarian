# Contributing

Thanks for helping improve Image Asset Librarian. The project is intentionally small, local-first, and dependency-light, so changes should preserve those traits unless there is a strong reason not to.

## Good First Contributions

- Improve scanner support for image metadata.
- Add tests for edge cases in path handling or duplicate detection.
- Improve accessibility and keyboard flow in the gallery UI.
- Add documentation for real AI image workflows.
- Build optional integrations without making the local workflow depend on a cloud service.

## Development

```bash
npm install
npm test
npm run scan
npm run serve
```

Open `http://127.0.0.1:4173` after starting the server.

## Pull Request Checklist

- Keep personal file paths out of commits.
- Add or update tests for behavior changes.
- Run `npm test` before opening a PR.
- Update the README when commands, configuration, or user-facing behavior changes.
- Explain privacy impact when a change touches local files, metadata, or future AI integrations.

## Project Values

- Local-first by default.
- Clear file boundaries and small modules.
- No hidden network calls.
- Practical creator workflows over abstract demos.
- Security-conscious handling of local filesystem paths.
