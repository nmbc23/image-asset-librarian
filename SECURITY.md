# Security Policy

Image Asset Librarian is a local-first project that scans user-selected folders and serves indexed image files through a local browser UI. Security issues are most likely to involve filesystem boundaries, path handling, metadata exposure, or future optional AI integrations.

## Supported Versions

The project is pre-1.0. Security fixes are handled on the `main` branch until a stable release line exists.

## Reporting a Vulnerability

Please open a private security advisory on GitHub when available, or contact the maintainer through the GitHub profile linked from the repository.

Include:

- A short description of the issue.
- Steps to reproduce.
- The affected command or route.
- Whether arbitrary local files can be read, exposed, or overwritten.
- Any relevant platform details.

## Security Boundaries

The server should only serve files that appear in the generated index. The scanner should only read roots explicitly configured by the user. Future AI-assisted features should be opt-in and must clearly explain what data is sent to external APIs.

## Current Non-Goals

- No remote hosted service.
- No account system.
- No background telemetry.
- No automatic uploads of images or metadata.
