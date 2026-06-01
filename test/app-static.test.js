import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("asset Open action navigates the current tab instead of relying on a new tab", async () => {
  const appSource = await readFile(new URL("../public/app.js", import.meta.url), "utf8");

  assert.match(appSource, /data-open-asset/);
  assert.match(appSource, /window\.location\.assign/);
});

test("package exposes a smoke command for runnable app verification", async () => {
  const packageSource = await readFile(new URL("../package.json", import.meta.url), "utf8");

  assert.match(packageSource, /"smoke": "node scripts\/smoke.js"/);
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

test("folder scanning controls post to the server and refresh the gallery", async () => {
  const [appSource, htmlSource, cssSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="scan-folder-form"/);
  assert.match(htmlSource, /id="folder-path-input"/);
  assert.match(htmlSource, /id="scan-folder-button"/);
  assert.match(htmlSource, /id="recent-folder-list"/);
  assert.match(htmlSource, /id="library-kind"/);
  assert.match(appSource, /RECENT_FOLDERS_STORAGE_KEY/);
  assert.match(appSource, /scanFolderFromInput/);
  assert.match(appSource, /fetch\("\/api\/scan"/);
  assert.match(appSource, /loadIndex/);
  assert.match(appSource, /saveRecentFolder/);
  assert.match(appSource, /renderLibraryKind/);
  assert.match(cssSource, /\.scan-panel/);
  assert.match(cssSource, /\.library-kind/);
});

test("folder scanner defaults to crash-safe path scanning", async () => {
  const [appSource, htmlSource, cssSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /<details id="path-scan-details" class="path-scan-fallback" open>/);
  assert.match(htmlSource, /id="choose-folder-button"/);
  assert.match(htmlSource, /Use safe path scan/);
  assert.match(appSource, /chooseFolderFromBrowser/);
  assert.match(appSource, /focusPathScanner/);
  assert.doesNotMatch(appSource, /folderFileInput\.click/);
  assert.doesNotMatch(appSource, /showDirectoryPicker/);
  assert.doesNotMatch(htmlSource, /webkitdirectory/);
  assert.match(cssSource, /\.folder-picker-primary/);
  assert.match(cssSource, /\.path-scan-fallback/);
});

test("folder scanner placeholder does not expose a machine-specific path", async () => {
  const htmlSource = await readFile(new URL("../public/index.html", import.meta.url), "utf8");

  assert.match(htmlSource, /placeholder="D:\/Images\/generated"/);
  assert.doesNotMatch(htmlSource, /P:\/AI\/Codex\/generated_images/);
});

test("gallery rendering limits large folders to avoid tab crashes", async () => {
  const appSource = await readFile(new URL("../public/app.js", import.meta.url), "utf8");

  assert.match(appSource, /GALLERY_RENDER_LIMIT/);
  assert.match(appSource, /view\.assets\.slice\(0, GALLERY_RENDER_LIMIT\)/);
  assert.match(appSource, /gallery-limit-notice/);
  assert.match(appSource, /Refine filters to render fewer cards/);
});

test("workflow actions are grouped so exports do not overwhelm the first screen", async () => {
  const [htmlSource, cssSource] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8")
  ]);

  assert.equal([...htmlSource.matchAll(/class="workflow-action-group"/g)].length, 4);
  assert.match(htmlSource, /<summary>Selection<\/summary>/);
  assert.match(htmlSource, /<summary>Descriptions and publishing<\/summary>/);
  assert.match(htmlSource, /<summary>Reports and manifests<\/summary>/);
  assert.match(htmlSource, /<summary>Backups<\/summary>/);
  assert.match(cssSource, /\.workflow-action-group/);
  assert.match(cssSource, /\.workflow-action-grid/);
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

test("asset issue filter is exposed in the toolbar, breakdowns, and asset cards", async () => {
  const [appSource, htmlSource, cssSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="issue-filter"/);
  assert.match(htmlSource, /id="issue-breakdown"/);
  assert.match(htmlSource, /id="issue-breakdown-count"/);
  assert.match(appSource, /issue: document\.querySelector\("#issue-filter"\)/);
  assert.match(appSource, /state\.issue = elements\.issue\.value/);
  assert.match(appSource, /issueBreakdown: document\.querySelector\("#issue-breakdown"\)/);
  assert.match(appSource, /data-set-issue-filter/);
  assert.match(appSource, /applyBreakdownFilter\("issue"/);
  assert.match(appSource, /renderAssetIssues/);
  assert.match(appSource, /data-asset-issue/);
  assert.match(cssSource, /\.asset-issues/);
});

test("asset issue reports can be copied and downloaded", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="copy-issue-report"/);
  assert.match(htmlSource, /id="download-issue-report"/);
  assert.match(appSource, /createAssetIssueReport/);
  assert.match(appSource, /copyIssueReport/);
  assert.match(appSource, /downloadIssueReport/);
  assert.match(appSource, /asset-issue-report/);
});

test("library health reports can be copied and downloaded", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="copy-health-report"/);
  assert.match(htmlSource, /id="download-health-report"/);
  assert.match(appSource, /createLibraryHealthReport/);
  assert.match(appSource, /copyHealthReport/);
  assert.match(appSource, /downloadHealthReport/);
  assert.match(appSource, /library-health-report/);
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

test("color vibe grouping is exposed in filters, breakdowns, and asset cards", async () => {
  const [appSource, htmlSource, cssSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="color-theme-filter"/);
  assert.match(htmlSource, /id="color-theme-breakdown"/);
  assert.match(htmlSource, /id="color-theme-breakdown-count"/);
  assert.match(appSource, /colorTheme: document\.querySelector\("#color-theme-filter"\)/);
  assert.match(appSource, /state\.colorTheme = elements\.colorTheme\.value/);
  assert.match(appSource, /data-set-color-theme-filter/);
  assert.match(appSource, /renderAssetColorThemes/);
  assert.match(cssSource, /\.asset-color-themes/);
});

test("asset palettes are exposed as swatches on cards and details", async () => {
  const [appSource, cssSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(appSource, /renderAssetPalette/);
  assert.match(appSource, /renderDetailPalette/);
  assert.match(appSource, /data-palette-color/);
  assert.match(cssSource, /\.asset-palette/);
  assert.match(cssSource, /\.palette-swatch/);
  assert.match(cssSource, /\.detail-palette/);
});

test("embedded asset metadata is exposed in details and exports", async () => {
  const [appSource, cssSource, viewModelSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../public/view-model.js", import.meta.url), "utf8")
  ]);

  assert.match(viewModelSource, /getAssetMetadataEntries/);
  assert.match(viewModelSource, /metadataSummary/);
  assert.match(appSource, /renderDetailMetadata/);
  assert.match(appSource, /data-copy-metadata-value/);
  assert.match(cssSource, /\.detail-metadata/);
});

test("suggested image descriptions can be copied or saved as local notes", async () => {
  const [appSource, cssSource, viewModelSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../public/view-model.js", import.meta.url), "utf8")
  ]);

  assert.match(viewModelSource, /createAssetDescription/);
  assert.match(appSource, /renderSuggestedDescription/);
  assert.match(appSource, /data-copy-description/);
  assert.match(appSource, /data-save-description-note/);
  assert.match(appSource, /saveSuggestedDescriptionAsNote/);
  assert.match(cssSource, /\.suggested-description/);
});

test("AI visual reviews can be copied from cards and details", async () => {
  const [appSource, cssSource, viewModelSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../public/view-model.js", import.meta.url), "utf8")
  ]);

  assert.match(viewModelSource, /createAssetVisualReview/);
  assert.match(appSource, /renderAssetAiReview/);
  assert.match(appSource, /renderAiReview/);
  assert.match(appSource, /data-copy-card-review/);
  assert.match(appSource, /data-copy-visual-review/);
  assert.match(appSource, /data-save-review-note/);
  assert.match(appSource, /saveVisualReviewAsNote/);
  assert.match(cssSource, /\.ai-review/);
});

test("asset cards show generated image descriptions with copy actions", async () => {
  const [appSource, cssSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(appSource, /createAssetDescription/);
  assert.match(appSource, /renderAssetCaption/);
  assert.match(appSource, /data-copy-card-description/);
  assert.match(cssSource, /\.asset-caption/);
});

test("visible and selected AI visual reviews can be copied in batches", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="copy-visible-ai-reviews"/);
  assert.match(htmlSource, /id="copy-selected-ai-reviews"/);
  assert.match(appSource, /createAssetVisualReviewList/);
  assert.match(appSource, /copyVisibleAiReviews/);
  assert.match(appSource, /copySelectedAiReviews/);
});

test("visible and selected image descriptions can be copied in batches", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="copy-visible-descriptions"/);
  assert.match(htmlSource, /id="copy-selected-descriptions"/);
  assert.match(appSource, /createAssetDescriptionList/);
  assert.match(appSource, /copyVisibleDescriptions/);
  assert.match(appSource, /copySelectedDescriptions/);
});

test("visible and selected alt text lists can be copied and downloaded", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="copy-visible-alt-text"/);
  assert.match(htmlSource, /id="copy-selected-alt-text"/);
  assert.match(htmlSource, /id="download-visible-alt-text"/);
  assert.match(htmlSource, /id="download-selected-alt-text"/);
  assert.match(appSource, /createAssetAltTextList/);
  assert.match(appSource, /copyVisibleAltText/);
  assert.match(appSource, /copySelectedAltText/);
  assert.match(appSource, /downloadVisibleAltText/);
  assert.match(appSource, /downloadSelectedAltText/);
  assert.match(appSource, /asset-alt-text/);
});

test("visible and selected contact sheets can be copied and downloaded", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="copy-visible-contact-sheet"/);
  assert.match(htmlSource, /id="copy-selected-contact-sheet"/);
  assert.match(htmlSource, /id="download-visible-contact-sheet"/);
  assert.match(htmlSource, /id="download-selected-contact-sheet"/);
  assert.match(appSource, /createAssetContactSheet/);
  assert.match(appSource, /copyVisibleContactSheet/);
  assert.match(appSource, /copySelectedContactSheet/);
  assert.match(appSource, /downloadVisibleContactSheet/);
  assert.match(appSource, /downloadSelectedContactSheet/);
  assert.match(appSource, /asset-contact-sheet/);
});

test("visible and selected image embeds can be copied and downloaded", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="copy-visible-embeds"/);
  assert.match(htmlSource, /id="copy-selected-embeds"/);
  assert.match(htmlSource, /id="download-visible-embeds"/);
  assert.match(htmlSource, /id="download-selected-embeds"/);
  assert.match(appSource, /createAssetEmbedList/);
  assert.match(appSource, /copyVisibleEmbeds/);
  assert.match(appSource, /copySelectedEmbeds/);
  assert.match(appSource, /downloadVisibleEmbeds/);
  assert.match(appSource, /downloadSelectedEmbeds/);
  assert.match(appSource, /asset-embeds/);
});

test("visible and selected publishing checklists can be copied and downloaded", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="copy-visible-publishing-checklist"/);
  assert.match(htmlSource, /id="copy-selected-publishing-checklist"/);
  assert.match(htmlSource, /id="download-visible-publishing-checklist"/);
  assert.match(htmlSource, /id="download-selected-publishing-checklist"/);
  assert.match(appSource, /createAssetPublishingChecklist/);
  assert.match(appSource, /copyVisiblePublishingChecklist/);
  assert.match(appSource, /copySelectedPublishingChecklist/);
  assert.match(appSource, /downloadVisiblePublishingChecklist/);
  assert.match(appSource, /downloadSelectedPublishingChecklist/);
  assert.match(appSource, /asset-publishing-checklist/);
});

test("visible and selected readiness reports can be copied and downloaded", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="copy-visible-readiness-report"/);
  assert.match(htmlSource, /id="copy-selected-readiness-report"/);
  assert.match(htmlSource, /id="download-visible-readiness-report"/);
  assert.match(htmlSource, /id="download-selected-readiness-report"/);
  assert.match(appSource, /createAssetReadinessReport/);
  assert.match(appSource, /copyVisibleReadinessReport/);
  assert.match(appSource, /copySelectedReadinessReport/);
  assert.match(appSource, /downloadVisibleReadinessReport/);
  assert.match(appSource, /downloadSelectedReadinessReport/);
  assert.match(appSource, /asset-readiness-report/);
});

test("visible and selected provenance reports can be copied and downloaded", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="copy-visible-provenance-report"/);
  assert.match(htmlSource, /id="copy-selected-provenance-report"/);
  assert.match(htmlSource, /id="download-visible-provenance-report"/);
  assert.match(htmlSource, /id="download-selected-provenance-report"/);
  assert.match(appSource, /createAssetProvenanceReport/);
  assert.match(appSource, /copyVisibleProvenanceReport/);
  assert.match(appSource, /copySelectedProvenanceReport/);
  assert.match(appSource, /downloadVisibleProvenanceReport/);
  assert.match(appSource, /downloadSelectedProvenanceReport/);
  assert.match(appSource, /asset-provenance-report/);
});

test("visible and selected prompt keyword reports can be copied and downloaded", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="copy-visible-prompt-keyword-report"/);
  assert.match(htmlSource, /id="copy-selected-prompt-keyword-report"/);
  assert.match(htmlSource, /id="download-visible-prompt-keyword-report"/);
  assert.match(htmlSource, /id="download-selected-prompt-keyword-report"/);
  assert.match(appSource, /createAssetPromptKeywordReport/);
  assert.match(appSource, /copyVisiblePromptKeywordReport/);
  assert.match(appSource, /copySelectedPromptKeywordReport/);
  assert.match(appSource, /downloadVisiblePromptKeywordReport/);
  assert.match(appSource, /downloadSelectedPromptKeywordReport/);
  assert.match(appSource, /asset-prompt-keyword-report/);
});

test("visible and selected collection briefs can be copied and downloaded", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="copy-visible-collection-brief"/);
  assert.match(htmlSource, /id="copy-selected-collection-brief"/);
  assert.match(htmlSource, /id="download-visible-collection-brief"/);
  assert.match(htmlSource, /id="download-selected-collection-brief"/);
  assert.match(appSource, /createAssetCollectionBrief/);
  assert.match(appSource, /copyVisibleCollectionBrief/);
  assert.match(appSource, /copySelectedCollectionBrief/);
  assert.match(appSource, /downloadVisibleCollectionBrief/);
  assert.match(appSource, /downloadSelectedCollectionBrief/);
  assert.match(appSource, /asset-collection-brief/);
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

test("similar asset groups are exposed as a workflow panel", async () => {
  const [appSource, htmlSource, cssSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="similar-summary"/);
  assert.match(htmlSource, /id="similar-list"/);
  assert.match(appSource, /createSimilarGroupDetails/);
  assert.match(appSource, /renderSimilarGroups/);
  assert.match(appSource, /data-set-similar-query/);
  assert.match(cssSource, /\.similar-panel/);
  assert.match(cssSource, /\.similar-group/);
});

test("similar asset groups show thumbnails and copy contact sheets", async () => {
  const [appSource, cssSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(appSource, /renderSimilarGroupPreview/);
  assert.match(appSource, /data-copy-similar-contact-sheet/);
  assert.match(appSource, /copySimilarGroupContactSheet/);
  assert.match(appSource, /createAssetContactSheet/);
  assert.match(cssSource, /\.similar-preview/);
  assert.match(cssSource, /\.similar-preview-tile/);
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

test("visible and selected rename plans can be copied and downloaded", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="copy-visible-rename-plan"/);
  assert.match(htmlSource, /id="copy-selected-rename-plan"/);
  assert.match(htmlSource, /id="download-visible-rename-plan"/);
  assert.match(htmlSource, /id="download-selected-rename-plan"/);
  assert.match(appSource, /createAssetRenamePlan/);
  assert.match(appSource, /copyVisibleRenamePlan/);
  assert.match(appSource, /copySelectedRenamePlan/);
  assert.match(appSource, /downloadVisibleRenamePlan/);
  assert.match(appSource, /downloadSelectedRenamePlan/);
  assert.match(appSource, /asset-rename-plan/);
});

test("workflow report includes browser-local tags and notes", async () => {
  const appSource = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  const workflowReportFunction = appSource.match(/async function copyWorkflowReport\(\) \{[\s\S]*?\n\}/)?.[0] ?? "";
  const workflowReportOptionsFunction = appSource.match(/function createWorkflowReportOptions\([\s\S]*?\n\}/)?.[0] ?? "";

  assert.match(workflowReportFunction, /createWorkflowReport\(libraryIndex/);
  assert.match(workflowReportOptionsFunction, /assetTags,/);
  assert.match(workflowReportOptionsFunction, /assetNotes/);
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

test("workflow reports and curation backups can be downloaded as files", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="download-workflow-report"/);
  assert.match(htmlSource, /id="download-curation-backup"/);
  assert.match(appSource, /createExportFileName/);
  assert.match(appSource, /downloadWorkflowReport/);
  assert.match(appSource, /downloadCurationBackup/);
  assert.match(appSource, /downloadTextFile/);
});

test("marks-only backups can be downloaded as files", async () => {
  const [appSource, htmlSource] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8")
  ]);

  assert.match(htmlSource, /id="download-marks-backup"/);
  assert.match(appSource, /downloadMarksBackup/);
  assert.match(appSource, /downloadMarksBackup\.disabled/);
  assert.match(appSource, /createExportFileName\("marks-backup", "json"/);
});
