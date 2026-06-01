# Roadmap

This roadmap favors a trustworthy local image workflow over a long feature list.

## Polish Before More Buttons

- Keep the README, screenshot, sample library, and demo walkthrough current with the app.
- Reduce or group UI controls when a workflow becomes noisy.
- Make duplicate review and similar-group review feel like one coherent cleanup flow.
- Add more focused tests for browser-visible states: sample vs. actual library, scanner errors, marks, and exports.
- Expand `sample-library/` only when a fixture demonstrates a specific workflow.

## Core Workflow Depth

- Improve exact duplicate review with clearer keep/candidate reasoning.
- Add better visual grouping explanations so users know why assets were grouped.
- Make generated descriptions easier to edit, save, and export as publishing notes.
- Add accessibility checks for gallery cards, detail drawer navigation, and copy/export controls.

## Optional AI-Assisted Features

These should remain explicit opt-in features and should never be required for the local demo.

- Real image captioning with clear provider, cost, and privacy notes.
- Optional embedding-based theme clustering for users who want heavier local image recognition.
- Style, subject, and quality tags.
- Semantic search over generated or user-approved tags.
- Duplicate cluster summaries.
- Natural language queries over the local index.

## Maintainer Tooling

- Release notes automation.
- Larger screenshot/GIF capture workflow using only sample assets.
- Contributor-friendly good first issues.
- More documentation around safe local config examples.

## Non-Goals

- Uploading a full private image library by default.
- Requiring a hosted backend.
- Replacing professional digital asset management systems.
- Adding telemetry without explicit consent.
- Adding vague "AI" labels for features that are actually local rules.
