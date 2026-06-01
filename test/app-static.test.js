import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("asset Open action navigates the current tab instead of relying on a new tab", async () => {
  const appSource = await readFile(new URL("../public/app.js", import.meta.url), "utf8");

  assert.match(appSource, /data-open-asset/);
  assert.match(appSource, /window\.location\.assign/);
});

test("detail drawer exposes previous and next asset navigation", async () => {
  const [appSource, cssSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(appSource, /createAssetNavigation/);
  assert.match(appSource, /data-show-adjacent-detail/);
  assert.match(appSource, /showAdjacentDetails/);
  assert.match(appSource, /event\.key === "ArrowLeft"/);
  assert.match(appSource, /event\.key === "ArrowRight"/);
  assert.match(cssSource, /\.drawer-nav/);
});

test("detail drawer supports asset marking controls and keyboard shortcuts", async () => {
  const [appSource, cssSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(appSource, /data-toggle-detail-save/);
  assert.match(appSource, /data-toggle-detail-review/);
  assert.match(appSource, /toggleDetailMark/);
  assert.match(appSource, /event\.key\.toLowerCase\(\) === "s"/);
  assert.match(appSource, /event\.key\.toLowerCase\(\) === "r"/);
  assert.match(cssSource, /\.drawer-mark-actions/);
});

test("review workflow exposes saved, review, and selected asset controls", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="mark-filter"/);
  assert.match(htmlSource, /id="copy-selected-paths"/);
  assert.match(htmlSource, /id="select-visible-assets"/);
  assert.match(htmlSource, /id="copy-visible-paths"/);
  assert.match(htmlSource, /id="copy-workflow-report"/);
  assert.match(htmlSource, /id="copy-marks-backup"/);
  assert.match(htmlSource, /id="import-marks-backup"/);
  assert.match(appSource, /MARK_STORAGE_KEY/);
  assert.match(appSource, /createMarkBackup/);
  assert.match(appSource, /parseMarkBackup/);
  assert.match(appSource, /createWorkflowReport/);
  assert.match(appSource, /data-toggle-save/);
  assert.match(appSource, /data-toggle-review/);
  assert.match(appSource, /data-select-asset/);
  assert.match(appSource, /copySelectedPaths/);
  assert.match(appSource, /selectVisibleAssets/);
  assert.match(appSource, /copyVisiblePaths/);
  assert.match(appSource, /currentView/);
  assert.match(appSource, /copyWorkflowReport/);
  assert.match(appSource, /createDuplicateGroupDetails/);
  assert.match(appSource, /data-copy-duplicate-group/);
  assert.match(appSource, /data-copy-duplicate-candidates/);
  assert.match(appSource, /copyDuplicateGroupPaths/);
  assert.match(appSource, /copyDuplicateCleanupCandidates/);
  assert.match(appSource, /copyMarksBackup/);
  assert.match(appSource, /importMarksBackup/);
  assert.match(appSource, /data-set-root-filter/);
  assert.match(appSource, /data-set-extension-filter/);
  assert.match(appSource, /applyBreakdownFilter/);
  assert.match(appSource, /navigator\.clipboard\.readText/);
});

test("active filter chips can clear individual filters from the toolbar state", async () => {
  const [appSource, htmlSource, cssSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="active-filters"/);
  assert.match(appSource, /createActiveFilterChips/);
  assert.match(appSource, /renderActiveFilters/);
  assert.match(appSource, /data-clear-filter/);
  assert.match(appSource, /data-clear-all-filters/);
  assert.match(appSource, /clearFilterChip/);
  assert.match(cssSource, /\.active-filters/);
});

test("resolution filter is exposed in the toolbar and wired into app state", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="resolution-filter"/);
  assert.match(htmlSource, /value="huge"/);
  assert.match(appSource, /resolution: document\.querySelector\("#resolution-filter"\)/);
  assert.match(appSource, /state\.resolution = elements\.resolution\.value/);
  assert.match(appSource, /elements\.resolution\.value = state\.resolution/);
});

test("sort menu exposes resolution sort modes", async () => {
  const htmlSource = await readFile(new URL("../public/index.html", import.meta.url), "utf8");

  assert.match(htmlSource, /value="highest-resolution"/);
  assert.match(htmlSource, /value="lowest-resolution"/);
});

test("resolution breakdown is exposed and wired into filter state", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="resolution-breakdown"/);
  assert.match(htmlSource, /id="resolution-breakdown-count"/);
  assert.match(appSource, /resolutionBreakdown: document\.querySelector\("#resolution-breakdown"\)/);
  assert.match(appSource, /data-set-resolution-filter/);
  assert.match(appSource, /applyBreakdownFilter\("resolution"/);
});

test("theme grouping is exposed in filters, breakdowns, and asset cards", async () => {
  const [appSource, htmlSource, cssSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="theme-filter"/);
  assert.match(htmlSource, /id="theme-breakdown"/);
  assert.match(htmlSource, /id="theme-breakdown-count"/);
  assert.match(appSource, /theme: document\.querySelector\("#theme-filter"\)/);
  assert.match(appSource, /state\.theme = elements\.theme\.value/);
  assert.match(appSource, /data-set-theme-filter/);
  assert.match(appSource, /renderAssetThemes/);
  assert.match(cssSource, /\.asset-themes/);
});

test("selected assets can be bulk marked from the workflow panel", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="save-selected-assets"/);
  assert.match(htmlSource, /id="review-selected-assets"/);
  assert.match(htmlSource, /id="unmark-selected-assets"/);
  assert.match(appSource, /applyMarkBatch/);
  assert.match(appSource, /applySelectedMarkBatch/);
  assert.match(appSource, /saveSelectedAssets/);
  assert.match(appSource, /reviewSelectedAssets/);
  assert.match(appSource, /unmarkSelectedAssets/);
});

test("visible and selected asset metadata can be copied as CSV", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="copy-visible-csv"/);
  assert.match(htmlSource, /id="copy-selected-csv"/);
  assert.match(appSource, /createAssetCsv/);
  assert.match(appSource, /copyVisibleCsv/);
  assert.match(appSource, /copySelectedCsv/);
});

test("visible and selected asset metadata can be copied as JSON manifests", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="copy-visible-manifest"/);
  assert.match(htmlSource, /id="copy-selected-manifest"/);
  assert.match(appSource, /createAssetManifest/);
  assert.match(appSource, /copyVisibleManifest/);
  assert.match(appSource, /copySelectedManifest/);
  assert.match(appSource, /createManifestOptions/);
  assert.match(appSource, /duplicateAssetIds/);
  assert.match(appSource, /assetNotes/);
});

test("workflow report includes browser-local tags and notes", async () => {
  const appSource = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  const workflowReportFunction = appSource.match(/async function copyWorkflowReport\(\) \{[\s\S]*?\n\}/)?.[0] ?? "";

  assert.match(workflowReportFunction, /createWorkflowReport\(libraryIndex/);
  assert.match(workflowReportFunction, /assetTags,/);
  assert.match(workflowReportFunction, /assetNotes/);
});

test("saved filter views can be created, applied, and deleted", async () => {
  const [appSource, htmlSource, cssSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="save-filter-view"/);
  assert.match(htmlSource, /id="saved-views"/);
  assert.match(htmlSource, /id="saved-view-count"/);
  assert.match(appSource, /FILTER_VIEWS_STORAGE_KEY/);
  assert.match(appSource, /createSavedFilterView/);
  assert.match(appSource, /normalizeSavedFilterViews/);
  assert.match(appSource, /renderSavedViews/);
  assert.match(appSource, /saveCurrentFilterView/);
  assert.match(appSource, /applySavedFilterView/);
  assert.match(appSource, /deleteSavedFilterView/);
  assert.match(appSource, /data-apply-saved-view/);
  assert.match(appSource, /data-delete-saved-view/);
  assert.match(cssSource, /\.saved-views-panel/);
});

test("asset tags can be added in batches and used as a gallery filter", async () => {
  const [appSource, htmlSource, cssSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="tag-filter"/);
  assert.match(htmlSource, /id="tag-selected-assets"/);
  assert.match(htmlSource, /id="untag-selected-assets"/);
  assert.match(appSource, /TAG_STORAGE_KEY/);
  assert.match(appSource, /applyTagBatch/);
  assert.match(appSource, /getAllAssetTags/);
  assert.match(appSource, /assetTags/);
  assert.match(appSource, /applySelectedTagBatch/);
  assert.match(appSource, /renderAssetTags/);
  assert.match(appSource, /data-asset-tag/);
  assert.match(cssSource, /\.asset-tags/);
});

test("asset notes can be edited locally and used as a gallery filter", async () => {
  const [appSource, htmlSource, cssSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="note-filter"/);
  assert.match(appSource, /NOTE_STORAGE_KEY/);
  assert.match(appSource, /assetNotes/);
  assert.match(appSource, /setAssetNote/);
  assert.match(appSource, /getAssetNote/);
  assert.match(appSource, /saveAssetNote/);
  assert.match(appSource, /renderAssetNotePreview/);
  assert.match(appSource, /data-note-asset/);
  assert.match(cssSource, /\.asset-note-preview/);
  assert.match(cssSource, /\.note-editor/);
});

test("full curation state can be copied and restored from the workflow panel", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="copy-curation-backup"/);
  assert.match(htmlSource, /id="import-curation-backup"/);
  assert.match(appSource, /createCurationBackup/);
  assert.match(appSource, /parseCurationBackup/);
  assert.match(appSource, /copyCurationBackup/);
  assert.match(appSource, /importCurationBackup/);
  assert.match(appSource, /saveAllCurationState/);
});
