import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("README explains the product quickly and links a demo screenshot", async () => {
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  const screenshot = await stat(new URL("../docs/assets/demo-gallery.png", import.meta.url));

  assert.match(readme, /Organize AI image folders locally/);
  assert.match(readme, /!\[Image Asset Librarian screenshot\]\(docs\/assets\/demo-gallery\.png\)/);
  assert.match(readme, /What You Can Try In Two Minutes/);
  assert.match(readme, /Local Rules vs\. AI/);
  assert.match(readme, /Demo Scenario/);
  assert.ok(screenshot.size > 10_000, "demo screenshot should be a real image, not an empty placeholder");
});

test("project docs include demo and contribution guidance", async () => {
  const [demo, contributing, roadmap, bugTemplate, featureTemplate, pullRequestTemplate] = await Promise.all([
    readFile(new URL("../docs/demo.md", import.meta.url), "utf8"),
    readFile(new URL("../CONTRIBUTING.md", import.meta.url), "utf8"),
    readFile(new URL("../ROADMAP.md", import.meta.url), "utf8"),
    readFile(new URL("../.github/ISSUE_TEMPLATE/bug_report.yml", import.meta.url), "utf8"),
    readFile(new URL("../.github/ISSUE_TEMPLATE/feature_request.yml", import.meta.url), "utf8"),
    readFile(new URL("../.github/pull_request_template.md", import.meta.url), "utf8")
  ]);

  assert.match(demo, /Demo Scenario/);
  assert.match(demo, /sample-library/);
  assert.match(demo, /local rules, not cloud AI/i);
  assert.match(contributing, /Product Principles/);
  assert.match(roadmap, /Polish Before More Buttons/);
  assert.match(bugTemplate, /Current library mode/);
  assert.match(featureTemplate, /Does this reduce UI clutter/);
  assert.match(pullRequestTemplate, /User-facing clarity/);
});
