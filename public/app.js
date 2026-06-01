import {
  applyMarkBatch,
  applyTagBatch,
  createActiveFilterChips,
  createAssetAltTextList,
  createAssetCollectionBrief,
  createAssetContactSheet,
  createAssetCsv,
  createAssetDescription,
  createAssetDescriptionList,
  createAssetEmbedList,
  createAssetDetails,
  createAssetVisualReview,
  createAssetVisualReviewList,
  createAssetIssueReport,
  createAssetManifest,
  createAssetNavigation,
  createAssetPublishingChecklist,
  createAssetProvenanceReport,
  createAssetPromptKeywordReport,
  createAssetReadinessReport,
  createAssetRenamePlan,
  createCurationBackup,
  createDefaultViewState,
  createDuplicateGroupDetails,
  createExportFileName,
  createLibraryView,
  createLibraryHealthReport,
  createMarkBackup,
  createPathList,
  createSavedFilterView,
  createSimilarGroupDetails,
  createWorkflowReport,
  formatBytes,
  formatDate,
  getAllAssetTags,
  getAssetIssues,
  getAssetColorThemes,
  getAssetNote,
  getAssetPalette,
  getAssetTags,
  getAssetThemes,
  normalizeSavedFilterViews,
  parseCurationBackup,
  parseMarkBackup,
  setAssetNote
} from "./view-model.js";

const elements = {
  status: document.querySelector("#scan-status"),
  libraryKind: document.querySelector("#library-kind"),
  scanFolderForm: document.querySelector("#scan-folder-form"),
  folderPathInput: document.querySelector("#folder-path-input"),
  scanFolderButton: document.querySelector("#scan-folder-button"),
  recentFolderList: document.querySelector("#recent-folder-list"),
  assets: document.querySelector("#metric-assets"),
  size: document.querySelector("#metric-size"),
  duplicates: document.querySelector("#metric-duplicates"),
  reclaimable: document.querySelector("#metric-reclaimable"),
  search: document.querySelector("#search-input"),
  root: document.querySelector("#root-filter"),
  extension: document.querySelector("#extension-filter"),
  orientation: document.querySelector("#orientation-filter"),
  resolution: document.querySelector("#resolution-filter"),
  issue: document.querySelector("#issue-filter"),
  theme: document.querySelector("#theme-filter"),
  colorTheme: document.querySelector("#color-theme-filter"),
  age: document.querySelector("#age-filter"),
  sort: document.querySelector("#sort-select"),
  mark: document.querySelector("#mark-filter"),
  tag: document.querySelector("#tag-filter"),
  note: document.querySelector("#note-filter"),
  duplicateToggle: document.querySelector("#duplicate-toggle"),
  resetFilters: document.querySelector("#reset-filters"),
  activeFilters: document.querySelector("#active-filters"),
  saveFilterView: document.querySelector("#save-filter-view"),
  savedViewCount: document.querySelector("#saved-view-count"),
  savedViews: document.querySelector("#saved-views"),
  savedCount: document.querySelector("#saved-count"),
  reviewCount: document.querySelector("#review-count"),
  selectedCount: document.querySelector("#selected-count"),
  selectVisibleAssets: document.querySelector("#select-visible-assets"),
  copyVisiblePaths: document.querySelector("#copy-visible-paths"),
  copySelectedPaths: document.querySelector("#copy-selected-paths"),
  copyVisibleDescriptions: document.querySelector("#copy-visible-descriptions"),
  copySelectedDescriptions: document.querySelector("#copy-selected-descriptions"),
  copyVisibleAiReviews: document.querySelector("#copy-visible-ai-reviews"),
  copySelectedAiReviews: document.querySelector("#copy-selected-ai-reviews"),
  copyVisibleAltText: document.querySelector("#copy-visible-alt-text"),
  copySelectedAltText: document.querySelector("#copy-selected-alt-text"),
  downloadVisibleAltText: document.querySelector("#download-visible-alt-text"),
  downloadSelectedAltText: document.querySelector("#download-selected-alt-text"),
  copyVisibleContactSheet: document.querySelector("#copy-visible-contact-sheet"),
  copySelectedContactSheet: document.querySelector("#copy-selected-contact-sheet"),
  downloadVisibleContactSheet: document.querySelector("#download-visible-contact-sheet"),
  downloadSelectedContactSheet: document.querySelector("#download-selected-contact-sheet"),
  copyVisibleEmbeds: document.querySelector("#copy-visible-embeds"),
  copySelectedEmbeds: document.querySelector("#copy-selected-embeds"),
  downloadVisibleEmbeds: document.querySelector("#download-visible-embeds"),
  downloadSelectedEmbeds: document.querySelector("#download-selected-embeds"),
  copyVisiblePublishingChecklist: document.querySelector("#copy-visible-publishing-checklist"),
  copySelectedPublishingChecklist: document.querySelector("#copy-selected-publishing-checklist"),
  downloadVisiblePublishingChecklist: document.querySelector("#download-visible-publishing-checklist"),
  downloadSelectedPublishingChecklist: document.querySelector("#download-selected-publishing-checklist"),
  copyVisibleReadinessReport: document.querySelector("#copy-visible-readiness-report"),
  copySelectedReadinessReport: document.querySelector("#copy-selected-readiness-report"),
  downloadVisibleReadinessReport: document.querySelector("#download-visible-readiness-report"),
  downloadSelectedReadinessReport: document.querySelector("#download-selected-readiness-report"),
  copyVisibleProvenanceReport: document.querySelector("#copy-visible-provenance-report"),
  copySelectedProvenanceReport: document.querySelector("#copy-selected-provenance-report"),
  downloadVisibleProvenanceReport: document.querySelector("#download-visible-provenance-report"),
  downloadSelectedProvenanceReport: document.querySelector("#download-selected-provenance-report"),
  copyVisiblePromptKeywordReport: document.querySelector("#copy-visible-prompt-keyword-report"),
  copySelectedPromptKeywordReport: document.querySelector("#copy-selected-prompt-keyword-report"),
  downloadVisiblePromptKeywordReport: document.querySelector("#download-visible-prompt-keyword-report"),
  downloadSelectedPromptKeywordReport: document.querySelector("#download-selected-prompt-keyword-report"),
  copyVisibleCollectionBrief: document.querySelector("#copy-visible-collection-brief"),
  copySelectedCollectionBrief: document.querySelector("#copy-selected-collection-brief"),
  downloadVisibleCollectionBrief: document.querySelector("#download-visible-collection-brief"),
  downloadSelectedCollectionBrief: document.querySelector("#download-selected-collection-brief"),
  copyVisibleCsv: document.querySelector("#copy-visible-csv"),
  copySelectedCsv: document.querySelector("#copy-selected-csv"),
  copyVisibleManifest: document.querySelector("#copy-visible-manifest"),
  copySelectedManifest: document.querySelector("#copy-selected-manifest"),
  copyVisibleRenamePlan: document.querySelector("#copy-visible-rename-plan"),
  copySelectedRenamePlan: document.querySelector("#copy-selected-rename-plan"),
  downloadVisibleRenamePlan: document.querySelector("#download-visible-rename-plan"),
  downloadSelectedRenamePlan: document.querySelector("#download-selected-rename-plan"),
  saveSelectedAssets: document.querySelector("#save-selected-assets"),
  reviewSelectedAssets: document.querySelector("#review-selected-assets"),
  unmarkSelectedAssets: document.querySelector("#unmark-selected-assets"),
  tagSelectedAssets: document.querySelector("#tag-selected-assets"),
  untagSelectedAssets: document.querySelector("#untag-selected-assets"),
  copyWorkflowReport: document.querySelector("#copy-workflow-report"),
  downloadWorkflowReport: document.querySelector("#download-workflow-report"),
  copyHealthReport: document.querySelector("#copy-health-report"),
  downloadHealthReport: document.querySelector("#download-health-report"),
  copyIssueReport: document.querySelector("#copy-issue-report"),
  downloadIssueReport: document.querySelector("#download-issue-report"),
  copyMarksBackup: document.querySelector("#copy-marks-backup"),
  downloadMarksBackup: document.querySelector("#download-marks-backup"),
  importMarksBackup: document.querySelector("#import-marks-backup"),
  copyCurationBackup: document.querySelector("#copy-curation-backup"),
  downloadCurationBackup: document.querySelector("#download-curation-backup"),
  importCurationBackup: document.querySelector("#import-curation-backup"),
  clearSelection: document.querySelector("#clear-selection"),
  sourceBreakdown: document.querySelector("#source-breakdown"),
  sourceBreakdownCount: document.querySelector("#source-breakdown-count"),
  typeBreakdown: document.querySelector("#type-breakdown"),
  typeBreakdownCount: document.querySelector("#type-breakdown-count"),
  resolutionBreakdown: document.querySelector("#resolution-breakdown"),
  resolutionBreakdownCount: document.querySelector("#resolution-breakdown-count"),
  issueBreakdown: document.querySelector("#issue-breakdown"),
  issueBreakdownCount: document.querySelector("#issue-breakdown-count"),
  themeBreakdown: document.querySelector("#theme-breakdown"),
  themeBreakdownCount: document.querySelector("#theme-breakdown-count"),
  colorThemeBreakdown: document.querySelector("#color-theme-breakdown"),
  colorThemeBreakdownCount: document.querySelector("#color-theme-breakdown-count"),
  duplicateSummary: document.querySelector("#duplicate-summary"),
  duplicateList: document.querySelector("#duplicate-list"),
  similarSummary: document.querySelector("#similar-summary"),
  similarList: document.querySelector("#similar-list"),
  resultCount: document.querySelector("#result-count"),
  filteredSummary: document.querySelector("#filtered-summary"),
  gallery: document.querySelector("#gallery"),
  emptyState: document.querySelector("#empty-state"),
  detailDrawer: document.querySelector("#detail-drawer"),
  drawerTitle: document.querySelector("#drawer-title"),
  drawerContent: document.querySelector("#drawer-content")
};

const MARK_STORAGE_KEY = "image-asset-librarian:marks:v1";
const TAG_STORAGE_KEY = "image-asset-librarian:asset-tags:v1";
const NOTE_STORAGE_KEY = "image-asset-librarian:asset-notes:v1";
const FILTER_VIEWS_STORAGE_KEY = "image-asset-librarian:filter-views:v1";
const RECENT_FOLDERS_STORAGE_KEY = "image-asset-librarian:recent-folders:v1";
const state = createDefaultViewState();
const marks = loadMarks();
let assetTags = loadAssetTags();
let assetNotes = loadAssetNotes();
let savedFilterViews = loadSavedFilterViews();
const selectedAssetIds = new Set();

let libraryIndex = null;
let currentView = null;
let activeDetailAssetId = null;

init();

async function init() {
  bindEvents();
  hydrateRecentFolders();
  await loadIndex();
}

async function loadIndex() {
  try {
    const response = await fetch("/api/index");
    if (!response.ok) {
      throw new Error(`Index request failed with ${response.status}`);
    }
    libraryIndex = await response.json();
    render();
  } catch (error) {
    elements.status.textContent = "Index not found";
    elements.gallery.innerHTML = `<div class="notice">${escapeHtml(error.message)}</div>`;
  }
}

async function scanFolderFromInput(event) {
  event.preventDefault();
  const folderPath = elements.folderPathInput.value.trim();
  if (!folderPath) {
    elements.status.textContent = "Enter an image folder path";
    elements.folderPathInput.focus();
    return;
  }

  setScanControlsBusy(true);
  elements.status.textContent = "Scanning folder...";
  try {
    const response = await fetch("/api/scan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ folderPath })
    });
    const nextIndex = await response.json();
    if (!response.ok) {
      throw new Error(nextIndex.error ?? `Scan failed with ${response.status}`);
    }

    libraryIndex = nextIndex;
    resetViewAfterScan();
    saveRecentFolder(folderPath);
    hydrateRecentFolders();
    render();
  } catch (error) {
    elements.status.textContent = `Scan failed: ${error.message}`;
  } finally {
    setScanControlsBusy(false);
  }
}

function resetViewAfterScan() {
  Object.assign(state, createDefaultViewState());
  selectedAssetIds.clear();
  activeDetailAssetId = null;
  elements.detailDrawer.setAttribute("aria-hidden", "true");
  syncControlsFromState();
}

function setScanControlsBusy(isBusy) {
  elements.folderPathInput.disabled = isBusy;
  elements.scanFolderButton.disabled = isBusy;
  elements.scanFolderButton.textContent = isBusy ? "Scanning..." : "Scan folder";
}

function bindEvents() {
  elements.scanFolderForm.addEventListener("submit", scanFolderFromInput);
  elements.search.addEventListener("input", () => {
    state.query = elements.search.value;
    render();
  });
  elements.root.addEventListener("change", () => {
    state.root = elements.root.value;
    render();
  });
  elements.extension.addEventListener("change", () => {
    state.extension = elements.extension.value;
    render();
  });
  elements.orientation.addEventListener("change", () => {
    state.orientation = elements.orientation.value;
    render();
  });
  elements.resolution.addEventListener("change", () => {
    state.resolution = elements.resolution.value;
    render();
  });
  elements.issue.addEventListener("change", () => {
    state.issue = elements.issue.value;
    render();
  });
  elements.theme.addEventListener("change", () => {
    state.theme = elements.theme.value;
    render();
  });
  elements.colorTheme.addEventListener("change", () => {
    state.colorTheme = elements.colorTheme.value;
    render();
  });
  elements.age.addEventListener("change", () => {
    state.maxAgeDays = elements.age.value;
    render();
  });
  elements.sort.addEventListener("change", () => {
    state.sort = elements.sort.value;
    render();
  });
  elements.mark.addEventListener("change", () => {
    state.mark = elements.mark.value;
    render();
  });
  elements.tag.addEventListener("change", () => {
    state.tag = elements.tag.value;
    render();
  });
  elements.note.addEventListener("change", () => {
    state.note = elements.note.value;
    render();
  });
  elements.duplicateToggle.addEventListener("change", () => {
    state.duplicateOnly = elements.duplicateToggle.checked;
    render();
  });
  elements.resetFilters.addEventListener("click", clearAllFilters);
  elements.activeFilters.addEventListener("click", (event) => {
    if (event.target.closest("[data-clear-all-filters]")) {
      clearAllFilters();
      return;
    }

    const button = event.target.closest("[data-clear-filter]");
    if (button) {
      clearFilterChip(button.dataset.clearFilter);
    }
  });
  elements.saveFilterView.addEventListener("click", saveCurrentFilterView);
  elements.savedViews.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-saved-view]");
    if (deleteButton) {
      deleteSavedFilterView(deleteButton.dataset.deleteSavedView);
      return;
    }

    const applyButton = event.target.closest("[data-apply-saved-view]");
    if (applyButton) {
      applySavedFilterView(applyButton.dataset.applySavedView);
    }
  });
  elements.selectVisibleAssets.addEventListener("click", selectVisibleAssets);
  elements.copyVisiblePaths.addEventListener("click", copyVisiblePaths);
  elements.copySelectedPaths.addEventListener("click", copySelectedPaths);
  elements.copyVisibleDescriptions.addEventListener("click", copyVisibleDescriptions);
  elements.copySelectedDescriptions.addEventListener("click", copySelectedDescriptions);
  elements.copyVisibleAiReviews.addEventListener("click", copyVisibleAiReviews);
  elements.copySelectedAiReviews.addEventListener("click", copySelectedAiReviews);
  elements.copyVisibleAltText.addEventListener("click", copyVisibleAltText);
  elements.copySelectedAltText.addEventListener("click", copySelectedAltText);
  elements.downloadVisibleAltText.addEventListener("click", downloadVisibleAltText);
  elements.downloadSelectedAltText.addEventListener("click", downloadSelectedAltText);
  elements.copyVisibleContactSheet.addEventListener("click", copyVisibleContactSheet);
  elements.copySelectedContactSheet.addEventListener("click", copySelectedContactSheet);
  elements.downloadVisibleContactSheet.addEventListener("click", downloadVisibleContactSheet);
  elements.downloadSelectedContactSheet.addEventListener("click", downloadSelectedContactSheet);
  elements.copyVisibleEmbeds.addEventListener("click", copyVisibleEmbeds);
  elements.copySelectedEmbeds.addEventListener("click", copySelectedEmbeds);
  elements.downloadVisibleEmbeds.addEventListener("click", downloadVisibleEmbeds);
  elements.downloadSelectedEmbeds.addEventListener("click", downloadSelectedEmbeds);
  elements.copyVisiblePublishingChecklist.addEventListener("click", copyVisiblePublishingChecklist);
  elements.copySelectedPublishingChecklist.addEventListener("click", copySelectedPublishingChecklist);
  elements.downloadVisiblePublishingChecklist.addEventListener("click", downloadVisiblePublishingChecklist);
  elements.downloadSelectedPublishingChecklist.addEventListener("click", downloadSelectedPublishingChecklist);
  elements.copyVisibleReadinessReport.addEventListener("click", copyVisibleReadinessReport);
  elements.copySelectedReadinessReport.addEventListener("click", copySelectedReadinessReport);
  elements.downloadVisibleReadinessReport.addEventListener("click", downloadVisibleReadinessReport);
  elements.downloadSelectedReadinessReport.addEventListener("click", downloadSelectedReadinessReport);
  elements.copyVisibleProvenanceReport.addEventListener("click", copyVisibleProvenanceReport);
  elements.copySelectedProvenanceReport.addEventListener("click", copySelectedProvenanceReport);
  elements.downloadVisibleProvenanceReport.addEventListener("click", downloadVisibleProvenanceReport);
  elements.downloadSelectedProvenanceReport.addEventListener("click", downloadSelectedProvenanceReport);
  elements.copyVisiblePromptKeywordReport.addEventListener("click", copyVisiblePromptKeywordReport);
  elements.copySelectedPromptKeywordReport.addEventListener("click", copySelectedPromptKeywordReport);
  elements.downloadVisiblePromptKeywordReport.addEventListener("click", downloadVisiblePromptKeywordReport);
  elements.downloadSelectedPromptKeywordReport.addEventListener("click", downloadSelectedPromptKeywordReport);
  elements.copyVisibleCollectionBrief.addEventListener("click", copyVisibleCollectionBrief);
  elements.copySelectedCollectionBrief.addEventListener("click", copySelectedCollectionBrief);
  elements.downloadVisibleCollectionBrief.addEventListener("click", downloadVisibleCollectionBrief);
  elements.downloadSelectedCollectionBrief.addEventListener("click", downloadSelectedCollectionBrief);
  elements.copyVisibleCsv.addEventListener("click", copyVisibleCsv);
  elements.copySelectedCsv.addEventListener("click", copySelectedCsv);
  elements.copyVisibleManifest.addEventListener("click", copyVisibleManifest);
  elements.copySelectedManifest.addEventListener("click", copySelectedManifest);
  elements.copyVisibleRenamePlan.addEventListener("click", copyVisibleRenamePlan);
  elements.copySelectedRenamePlan.addEventListener("click", copySelectedRenamePlan);
  elements.downloadVisibleRenamePlan.addEventListener("click", downloadVisibleRenamePlan);
  elements.downloadSelectedRenamePlan.addEventListener("click", downloadSelectedRenamePlan);
  elements.saveSelectedAssets.addEventListener("click", () => applySelectedMarkBatch("save", elements.saveSelectedAssets));
  elements.reviewSelectedAssets.addEventListener("click", () => applySelectedMarkBatch("review", elements.reviewSelectedAssets));
  elements.unmarkSelectedAssets.addEventListener("click", () => applySelectedMarkBatch("clear", elements.unmarkSelectedAssets));
  elements.tagSelectedAssets.addEventListener("click", () => applySelectedTagBatch("add", elements.tagSelectedAssets));
  elements.untagSelectedAssets.addEventListener("click", () => applySelectedTagBatch("remove", elements.untagSelectedAssets));
  elements.copyWorkflowReport.addEventListener("click", copyWorkflowReport);
  elements.downloadWorkflowReport.addEventListener("click", downloadWorkflowReport);
  elements.copyHealthReport.addEventListener("click", copyHealthReport);
  elements.downloadHealthReport.addEventListener("click", downloadHealthReport);
  elements.copyIssueReport.addEventListener("click", copyIssueReport);
  elements.downloadIssueReport.addEventListener("click", downloadIssueReport);
  elements.copyMarksBackup.addEventListener("click", copyMarksBackup);
  elements.downloadMarksBackup.addEventListener("click", downloadMarksBackup);
  elements.importMarksBackup.addEventListener("click", importMarksBackup);
  elements.copyCurationBackup.addEventListener("click", copyCurationBackup);
  elements.downloadCurationBackup.addEventListener("click", downloadCurationBackup);
  elements.importCurationBackup.addEventListener("click", importCurationBackup);
  elements.clearSelection.addEventListener("click", () => {
    selectedAssetIds.clear();
    render();
  });
  elements.sourceBreakdown.addEventListener("click", (event) => {
    const button = event.target.closest("[data-set-root-filter]");
    if (button) {
      applyBreakdownFilter("root", button.dataset.setRootFilter);
    }
  });
  elements.typeBreakdown.addEventListener("click", (event) => {
    const button = event.target.closest("[data-set-extension-filter]");
    if (button) {
      applyBreakdownFilter("extension", button.dataset.setExtensionFilter);
    }
  });
  elements.resolutionBreakdown.addEventListener("click", (event) => {
    const button = event.target.closest("[data-set-resolution-filter]");
    if (button) {
      applyBreakdownFilter("resolution", button.dataset.setResolutionFilter);
    }
  });
  elements.issueBreakdown.addEventListener("click", (event) => {
    const button = event.target.closest("[data-set-issue-filter]");
    if (button) {
      applyBreakdownFilter("issue", button.dataset.setIssueFilter);
    }
  });
  elements.themeBreakdown.addEventListener("click", (event) => {
    const button = event.target.closest("[data-set-theme-filter]");
    if (button) {
      applyBreakdownFilter("theme", button.dataset.setThemeFilter);
    }
  });
  elements.colorThemeBreakdown.addEventListener("click", (event) => {
    const button = event.target.closest("[data-set-color-theme-filter]");
    if (button) {
      applyBreakdownFilter("colorTheme", button.dataset.setColorThemeFilter);
    }
  });
  elements.duplicateList.addEventListener("click", async (event) => {
    const cleanupButton = event.target.closest("[data-copy-duplicate-candidates]");
    if (cleanupButton) {
      await copyDuplicateCleanupCandidates(cleanupButton, Number.parseInt(cleanupButton.dataset.copyDuplicateCandidates, 10));
      return;
    }

    const button = event.target.closest("[data-copy-duplicate-group]");
    if (!button) {
      return;
    }
    await copyDuplicateGroupPaths(button, Number.parseInt(button.dataset.copyDuplicateGroup, 10));
  });
  elements.similarList.addEventListener("click", async (event) => {
    const queryButton = event.target.closest("[data-set-similar-query]");
    if (queryButton) {
      state.query = queryButton.dataset.setSimilarQuery;
      syncControlsFromState();
      render();
      return;
    }

    const contactSheetButton = event.target.closest("[data-copy-similar-contact-sheet]");
    if (contactSheetButton) {
      await copySimilarGroupContactSheet(
        contactSheetButton,
        Number.parseInt(contactSheetButton.dataset.copySimilarContactSheet, 10)
      );
      return;
    }

    const copyButton = event.target.closest("[data-copy-similar-group]");
    if (!copyButton) {
      return;
    }
    await copySimilarGroupPaths(copyButton, Number.parseInt(copyButton.dataset.copySimilarGroup, 10));
  });
  elements.gallery.addEventListener("click", async (event) => {
    const themeButton = event.target.closest("[data-asset-theme]");
    if (themeButton) {
      state.theme = themeButton.dataset.assetTheme;
      syncControlsFromState();
      render();
      return;
    }

    const colorThemeButton = event.target.closest("[data-asset-color-theme]");
    if (colorThemeButton) {
      state.colorTheme = colorThemeButton.dataset.assetColorTheme;
      syncControlsFromState();
      render();
      return;
    }

    const paletteButton = event.target.closest("[data-palette-color]");
    if (paletteButton) {
      searchPaletteColor(paletteButton.dataset.paletteColor);
      return;
    }

    const tagButton = event.target.closest("[data-asset-tag]");
    if (tagButton) {
      state.tag = tagButton.dataset.assetTag;
      syncControlsFromState();
      render();
      return;
    }

    const issueButton = event.target.closest("[data-asset-issue]");
    if (issueButton) {
      state.issue = issueButton.dataset.assetIssue;
      syncControlsFromState();
      render();
      return;
    }

    const openButton = event.target.closest("[data-open-asset]");
    if (openButton) {
      window.location.assign(openButton.dataset.openAsset);
      return;
    }

    const selectInput = event.target.closest("[data-select-asset]");
    if (selectInput) {
      setAssetSelected(selectInput.dataset.selectAsset, selectInput.checked);
      render();
      return;
    }

    const saveButton = event.target.closest("[data-toggle-save]");
    if (saveButton) {
      toggleMark("saved", saveButton.dataset.toggleSave);
      render();
      return;
    }

    const reviewButton = event.target.closest("[data-toggle-review]");
    if (reviewButton) {
      toggleMark("review", reviewButton.dataset.toggleReview);
      render();
      return;
    }

    const detailsButton = event.target.closest("[data-show-details]");
    if (detailsButton) {
      showDetails(detailsButton.dataset.showDetails);
      return;
    }

    const captionCopyButton = event.target.closest("[data-copy-card-description]");
    if (captionCopyButton) {
      await copyFromButton(captionCopyButton, captionCopyButton.dataset.copyCardDescription);
      return;
    }

    const cardReviewCopyButton = event.target.closest("[data-copy-card-review]");
    if (cardReviewCopyButton) {
      await copyFromButton(cardReviewCopyButton, cardReviewCopyButton.dataset.copyCardReview);
      return;
    }

    const button = event.target.closest("[data-copy-path]");
    if (!button) {
      return;
    }
    await copyFromButton(button, button.dataset.copyPath);
  });
  elements.detailDrawer.addEventListener("click", async (event) => {
    if (event.target.closest("[data-close-details]")) {
      hideDetails();
      return;
    }

    const adjacentButton = event.target.closest("[data-show-adjacent-detail]");
    if (adjacentButton) {
      showDetails(adjacentButton.dataset.showAdjacentDetail);
      return;
    }

    const detailSaveButton = event.target.closest("[data-toggle-detail-save]");
    if (detailSaveButton) {
      toggleDetailMark("saved", detailSaveButton.dataset.toggleDetailSave);
      return;
    }

    const detailReviewButton = event.target.closest("[data-toggle-detail-review]");
    if (detailReviewButton) {
      toggleDetailMark("review", detailReviewButton.dataset.toggleDetailReview);
      return;
    }

    const paletteButton = event.target.closest("[data-palette-color]");
    if (paletteButton) {
      searchPaletteColor(paletteButton.dataset.paletteColor);
      return;
    }

    const metadataCopyButton = event.target.closest("[data-copy-metadata-value]");
    if (metadataCopyButton) {
      await copyFromButton(metadataCopyButton, metadataCopyButton.dataset.copyMetadataValue);
      return;
    }

    const descriptionCopyButton = event.target.closest("[data-copy-description]");
    if (descriptionCopyButton) {
      await copyFromButton(descriptionCopyButton, descriptionCopyButton.dataset.copyDescription);
      return;
    }

    const descriptionNoteButton = event.target.closest("[data-save-description-note]");
    if (descriptionNoteButton) {
      saveSuggestedDescriptionAsNote(descriptionNoteButton.dataset.saveDescriptionNote);
      return;
    }

    const reviewCopyButton = event.target.closest("[data-copy-visual-review]");
    if (reviewCopyButton) {
      await copyFromButton(reviewCopyButton, reviewCopyButton.dataset.copyVisualReview);
      return;
    }

    const reviewNoteButton = event.target.closest("[data-save-review-note]");
    if (reviewNoteButton) {
      saveVisualReviewAsNote(reviewNoteButton.dataset.saveReviewNote);
      return;
    }

    const copyButton = event.target.closest("[data-copy-value]");
    if (copyButton) {
      await copyFromButton(copyButton, copyButton.dataset.copyValue);
      return;
    }

    const noteButton = event.target.closest("[data-save-note]");
    if (noteButton) {
      saveAssetNote(noteButton.dataset.saveNote);
    }
  });
  document.addEventListener("keydown", (event) => {
    const drawerIsOpen = elements.detailDrawer.getAttribute("aria-hidden") === "false";
    if (!drawerIsOpen) {
      return;
    }
    if (event.key === "Escape") {
      hideDetails();
      return;
    }
    if (isTextEditingTarget(event.target)) {
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showAdjacentDetails("previous");
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showAdjacentDetails("next");
    } else if (event.key.toLowerCase() === "s") {
      event.preventDefault();
      toggleDetailMark("saved", activeDetailAssetId);
    } else if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      toggleDetailMark("review", activeDetailAssetId);
    }
  });
}

function syncControlsFromState() {
  elements.search.value = state.query;
  elements.root.value = state.root;
  elements.extension.value = state.extension;
  elements.orientation.value = state.orientation;
  elements.resolution.value = state.resolution;
  elements.issue.value = state.issue;
  elements.theme.value = state.theme;
  elements.colorTheme.value = state.colorTheme;
  elements.age.value = state.maxAgeDays;
  elements.sort.value = state.sort;
  elements.mark.value = state.mark;
  elements.tag.value = state.tag;
  elements.note.value = state.note;
  elements.duplicateToggle.checked = state.duplicateOnly;
}

function render() {
  if (!libraryIndex) {
    return;
  }

  const view = createLibraryView(libraryIndex, {
    ...state,
    savedAssetIds: marks.saved,
    reviewAssetIds: marks.review,
    assetTags,
    assetNotes
  });
  currentView = view;
  renderSummary(libraryIndex);
  renderWorkflow();
  renderFilters(view);
  renderActiveFilters();
  renderSavedViews();
  renderBreakdowns(view);
  renderDuplicates(libraryIndex);
  renderSimilarGroups(libraryIndex);
  renderGallery(view);
}

function renderSummary(index) {
  elements.assets.textContent = String(index.summary.totalAssets ?? 0);
  elements.size.textContent = formatBytes(index.summary.totalBytes ?? 0);
  elements.duplicates.textContent = String(index.summary.duplicateGroups ?? 0);
  elements.reclaimable.textContent = formatBytes(index.summary.reclaimableBytes ?? 0);
  elements.status.textContent = `Indexed ${formatDate(index.generatedAt)}`;
  renderLibraryKind(index);
}

function renderLibraryKind(index) {
  const roots = Array.isArray(index.roots) ? index.roots : [];
  const isSample = roots.length > 0 && roots.every((root) => isSampleRoot(root));
  const label = isSample ? "Sample Library" : "Actual Library";
  const rootNames = roots.map((root) => root.name).filter(Boolean).join(", ");
  elements.libraryKind.textContent = rootNames ? `${label}: ${rootNames}` : label;
  elements.libraryKind.classList.toggle("sample", isSample);
}

function isSampleRoot(root = {}) {
  const name = String(root.name ?? "").toLowerCase();
  const rootPath = String(root.path ?? "").replaceAll("\\", "/").toLowerCase();
  return name.includes("sample") || rootPath.endsWith("/sample-library") || rootPath.includes("/sample-library/");
}

function renderWorkflow() {
  elements.savedCount.textContent = `${marks.saved.size} saved`;
  elements.reviewCount.textContent = `${marks.review.size} review`;
  elements.selectedCount.textContent = `${selectedAssetIds.size} selected`;
  elements.selectVisibleAssets.disabled = !currentView?.assets.length;
  elements.copyVisiblePaths.disabled = !currentView?.assets.length;
  elements.copySelectedPaths.disabled = selectedAssetIds.size === 0;
  elements.copyVisibleDescriptions.disabled = !currentView?.assets.length;
  elements.copySelectedDescriptions.disabled = selectedAssetIds.size === 0;
  elements.copyVisibleAiReviews.disabled = !currentView?.assets.length;
  elements.copySelectedAiReviews.disabled = selectedAssetIds.size === 0;
  elements.copyVisibleAltText.disabled = !currentView?.assets.length;
  elements.copySelectedAltText.disabled = selectedAssetIds.size === 0;
  elements.downloadVisibleAltText.disabled = !currentView?.assets.length;
  elements.downloadSelectedAltText.disabled = selectedAssetIds.size === 0;
  elements.copyVisibleContactSheet.disabled = !currentView?.assets.length;
  elements.copySelectedContactSheet.disabled = selectedAssetIds.size === 0;
  elements.downloadVisibleContactSheet.disabled = !currentView?.assets.length;
  elements.downloadSelectedContactSheet.disabled = selectedAssetIds.size === 0;
  elements.copyVisibleEmbeds.disabled = !currentView?.assets.length;
  elements.copySelectedEmbeds.disabled = selectedAssetIds.size === 0;
  elements.downloadVisibleEmbeds.disabled = !currentView?.assets.length;
  elements.downloadSelectedEmbeds.disabled = selectedAssetIds.size === 0;
  elements.copyVisiblePublishingChecklist.disabled = !currentView?.assets.length;
  elements.copySelectedPublishingChecklist.disabled = selectedAssetIds.size === 0;
  elements.downloadVisiblePublishingChecklist.disabled = !currentView?.assets.length;
  elements.downloadSelectedPublishingChecklist.disabled = selectedAssetIds.size === 0;
  elements.copyVisibleReadinessReport.disabled = !currentView?.assets.length;
  elements.copySelectedReadinessReport.disabled = selectedAssetIds.size === 0;
  elements.downloadVisibleReadinessReport.disabled = !currentView?.assets.length;
  elements.downloadSelectedReadinessReport.disabled = selectedAssetIds.size === 0;
  elements.copyVisibleProvenanceReport.disabled = !currentView?.assets.length;
  elements.copySelectedProvenanceReport.disabled = selectedAssetIds.size === 0;
  elements.downloadVisibleProvenanceReport.disabled = !currentView?.assets.length;
  elements.downloadSelectedProvenanceReport.disabled = selectedAssetIds.size === 0;
  elements.copyVisiblePromptKeywordReport.disabled = !currentView?.assets.length;
  elements.copySelectedPromptKeywordReport.disabled = selectedAssetIds.size === 0;
  elements.downloadVisiblePromptKeywordReport.disabled = !currentView?.assets.length;
  elements.downloadSelectedPromptKeywordReport.disabled = selectedAssetIds.size === 0;
  elements.copyVisibleCollectionBrief.disabled = !currentView?.assets.length;
  elements.copySelectedCollectionBrief.disabled = selectedAssetIds.size === 0;
  elements.downloadVisibleCollectionBrief.disabled = !currentView?.assets.length;
  elements.downloadSelectedCollectionBrief.disabled = selectedAssetIds.size === 0;
  elements.copyVisibleCsv.disabled = !currentView?.assets.length;
  elements.copySelectedCsv.disabled = selectedAssetIds.size === 0;
  elements.copyVisibleManifest.disabled = !currentView?.assets.length;
  elements.copySelectedManifest.disabled = selectedAssetIds.size === 0;
  elements.copyVisibleRenamePlan.disabled = !currentView?.assets.length;
  elements.copySelectedRenamePlan.disabled = selectedAssetIds.size === 0;
  elements.downloadVisibleRenamePlan.disabled = !currentView?.assets.length;
  elements.downloadSelectedRenamePlan.disabled = selectedAssetIds.size === 0;
  elements.saveSelectedAssets.disabled = selectedAssetIds.size === 0;
  elements.reviewSelectedAssets.disabled = selectedAssetIds.size === 0;
  elements.unmarkSelectedAssets.disabled = selectedAssetIds.size === 0;
  elements.tagSelectedAssets.disabled = selectedAssetIds.size === 0;
  elements.untagSelectedAssets.disabled = selectedAssetIds.size === 0;
  elements.copyWorkflowReport.disabled = selectedAssetIds.size + marks.saved.size + marks.review.size === 0;
  elements.downloadWorkflowReport.disabled = selectedAssetIds.size + marks.saved.size + marks.review.size === 0;
  elements.copyHealthReport.disabled = !libraryIndex?.assets?.length;
  elements.downloadHealthReport.disabled = !libraryIndex?.assets?.length;
  elements.copyIssueReport.disabled = !hasAssetIssues();
  elements.downloadIssueReport.disabled = !hasAssetIssues();
  elements.copyMarksBackup.disabled = marks.saved.size + marks.review.size === 0;
  elements.downloadMarksBackup.disabled = marks.saved.size + marks.review.size === 0;
  elements.copyCurationBackup.disabled = !hasCurationState();
  elements.downloadCurationBackup.disabled = !hasCurationState();
  elements.clearSelection.disabled = selectedAssetIds.size === 0;
}

function renderFilters(view) {
  syncSelect(elements.root, [["all", "All sources"], ...view.roots.map((root) => [root, root])], state.root);
  syncSelect(
    elements.extension,
    [["all", "All types"], ...view.extensions.map((extension) => [extension, extension.replace(".", "").toUpperCase()])],
    state.extension
  );
  syncSelect(elements.theme, [["all", "All themes"], ...view.themes.map((theme) => [theme, theme])], state.theme);
  syncSelect(
    elements.colorTheme,
    [["all", "All color vibes"], ...view.colorThemes.map((theme) => [theme, theme])],
    state.colorTheme
  );
  syncSelect(elements.tag, [["all", "All tags"], ...view.tags.map((tag) => [tag, tag])], state.tag);
}

function renderActiveFilters() {
  const chips = createActiveFilterChips(state);
  elements.activeFilters.hidden = chips.length === 0;
  elements.activeFilters.innerHTML = chips.length
    ? `
      ${chips.map(renderActiveFilterChip).join("")}
      <button type="button" class="active-filter-clear" data-clear-all-filters>Clear all</button>
    `
    : "";
}

function renderActiveFilterChip(chip) {
  return `
    <button type="button" class="active-filter-chip" data-clear-filter="${escapeHtml(chip.key)}" aria-label="Clear ${escapeHtml(chip.label)} filter">
      <span>${escapeHtml(chip.label)}</span>
      <strong>${escapeHtml(chip.value)}</strong>
    </button>
  `;
}

function renderSavedViews() {
  elements.savedViewCount.textContent = `${savedFilterViews.length} views`;
  elements.savedViews.innerHTML = savedFilterViews.length
    ? savedFilterViews.map(renderSavedView).join("")
    : `<div class="notice">No saved views yet.</div>`;
}

function renderSavedView(view) {
  const chips = createActiveFilterChips(view.state);
  const summary = chips.length
    ? chips.map((chip) => `${chip.label}: ${chip.value}`).join(" / ")
    : "Default filters";

  return `
    <article class="saved-view">
      <div>
        <strong title="${escapeHtml(view.name)}">${escapeHtml(view.name)}</strong>
        <span title="${escapeHtml(summary)}">${escapeHtml(summary)}</span>
      </div>
      <div class="saved-view-actions">
        <button type="button" data-apply-saved-view="${escapeHtml(view.id)}">Apply</button>
        <button type="button" data-delete-saved-view="${escapeHtml(view.id)}">Delete</button>
      </div>
    </article>
  `;
}

function renderBreakdowns(view) {
  elements.sourceBreakdownCount.textContent = `${view.sourceBreakdown.length} sources`;
  elements.typeBreakdownCount.textContent = `${view.extensionBreakdown.length} types`;
  elements.resolutionBreakdownCount.textContent = `${view.resolutionBreakdown.length} buckets`;
  elements.issueBreakdownCount.textContent = `${view.issueBreakdown.length} issues`;
  elements.themeBreakdownCount.textContent = `${view.themeBreakdown.length} themes`;
  elements.colorThemeBreakdownCount.textContent = `${view.colorThemeBreakdown.length} vibes`;
  elements.sourceBreakdown.innerHTML = view.sourceBreakdown
    .map((item) => renderBreakdownItem(item, "root", item.label))
    .join("");
  elements.typeBreakdown.innerHTML = view.extensionBreakdown.map((item) =>
    renderBreakdownItem({
      label: item.label.replace(".", "").toUpperCase(),
      count: item.count
    }, "extension", item.label)
  ).join("");
  elements.resolutionBreakdown.innerHTML = view.resolutionBreakdown
    .map((item) => renderBreakdownItem(item, "resolution", item.value))
    .join("");
  elements.issueBreakdown.innerHTML = view.issueBreakdown
    .map((item) => renderBreakdownItem(item, "issue", item.value))
    .join("");
  elements.themeBreakdown.innerHTML = view.themeBreakdown
    .map((item) => renderBreakdownItem(item, "theme", item.label))
    .join("");
  elements.colorThemeBreakdown.innerHTML = view.colorThemeBreakdown
    .map((item) => renderBreakdownItem(item, "colorTheme", item.label))
    .join("");
}

function renderBreakdownItem(item, filterType, filterValue) {
  const filterAttributes = {
    root: "data-set-root-filter",
    extension: "data-set-extension-filter",
    resolution: "data-set-resolution-filter",
    issue: "data-set-issue-filter",
    theme: "data-set-theme-filter",
    colorTheme: "data-set-color-theme-filter"
  };
  const filterAttribute = `${filterAttributes[filterType]}="${escapeHtml(filterValue)}"`;
  return `
    <button type="button" class="breakdown-item" ${filterAttribute}>
      <span title="${escapeHtml(item.label)}">${escapeHtml(item.label)}</span>
      <strong>${item.count}</strong>
    </button>
  `;
}

function applyBreakdownFilter(filterType, filterValue) {
  if (filterType === "root") {
    state.root = filterValue;
  } else if (filterType === "resolution") {
    state.resolution = filterValue;
  } else if (filterType === "issue") {
    state.issue = filterValue;
  } else if (filterType === "theme") {
    state.theme = filterValue;
  } else if (filterType === "colorTheme") {
    state.colorTheme = filterValue;
  } else {
    state.extension = filterValue;
  }
  syncControlsFromState();
  render();
}

function clearFilterChip(key) {
  const defaults = createDefaultViewState();
  if (!(key in defaults)) {
    return;
  }
  state[key] = defaults[key];
  syncControlsFromState();
  render();
}

function clearAllFilters() {
  Object.assign(state, createDefaultViewState());
  syncControlsFromState();
  render();
}

function saveCurrentFilterView() {
  const viewName = window.prompt("Name this saved view", createSuggestedFilterViewName());
  if (viewName === null) {
    return;
  }

  const savedView = createSavedFilterView(viewName, state);
  savedFilterViews = [
    savedView,
    ...savedFilterViews.filter((view) => view.name !== savedView.name)
  ].slice(0, 16);
  saveSavedFilterViews();
  renderSavedViews();
  showButtonFeedback(elements.saveFilterView, "Saved");
}

function createSuggestedFilterViewName() {
  const chips = createActiveFilterChips(state);
  if (!chips.length) {
    return "Default view";
  }
  return chips.slice(0, 3).map((chip) => chip.value).join(" + ");
}

function applySavedFilterView(viewId) {
  const savedView = savedFilterViews.find((view) => view.id === viewId);
  if (!savedView) {
    return;
  }
  Object.assign(state, createDefaultViewState(), savedView.state);
  syncControlsFromState();
  render();
}

function deleteSavedFilterView(viewId) {
  savedFilterViews = savedFilterViews.filter((view) => view.id !== viewId);
  saveSavedFilterViews();
  renderSavedViews();
}

function renderDuplicates(index) {
  const groups = index.duplicates ?? [];
  elements.duplicateSummary.textContent = `${groups.length} groups`;

  if (!groups.length) {
    elements.duplicateList.innerHTML = `<div class="notice">No duplicate groups found.</div>`;
    return;
  }

  elements.duplicateList.innerHTML = groups
    .slice(0, 8)
    .map((group, groupIndex) => {
      const details = createDuplicateGroupDetails(index, group);
      return `
        <article class="duplicate-group">
          <div>
            <strong>${details.count} matching files</strong>
            <span>${details.reclaimable} reclaimable</span>
          </div>
          ${details.recommendedKeepAsset ? `<p>Suggested keep: ${escapeHtml(details.recommendedKeepAsset.relativePath)}</p>` : ""}
          <div class="duplicate-actions">
            <button type="button" data-copy-duplicate-group="${groupIndex}">Copy group paths</button>
            <button type="button" data-copy-duplicate-candidates="${groupIndex}">Copy cleanup candidates</button>
          </div>
          <ul>
            ${details.assets.map((asset) => `<li>${escapeHtml(asset.relativePath)} <span>${escapeHtml(asset.rootName)}</span></li>`).join("")}
          </ul>
        </article>
      `;
    })
    .join("");
}

function renderSimilarGroups(index) {
  const groups = index.similarGroups ?? [];
  elements.similarSummary.textContent = `${groups.length} groups`;

  if (!groups.length) {
    elements.similarList.innerHTML = `<div class="notice">No similar visual groups found.</div>`;
    return;
  }

  elements.similarList.innerHTML = groups
    .slice(0, 8)
    .map((group, groupIndex) => {
      const details = createSimilarGroupDetails(index, group);
      return `
        <article class="similar-group">
          <div>
            <strong>${escapeHtml(details.label)}</strong>
            <span>${details.count} assets</span>
          </div>
          <p>${escapeHtml(details.query)}</p>
          <div class="similar-actions">
            <button type="button" data-set-similar-query="${escapeHtml(details.query)}">Show group</button>
            <button type="button" data-copy-similar-group="${groupIndex}">Copy group paths</button>
            <button type="button" data-copy-similar-contact-sheet="${groupIndex}">Copy contact sheet</button>
          </div>
          ${renderSimilarGroupPreview(details.assets)}
          <ul>
            ${details.assets.map((asset) => `<li>${escapeHtml(asset.relativePath)} <span>${escapeHtml(asset.rootName)}</span></li>`).join("")}
          </ul>
        </article>
      `;
    })
    .join("");
}

function renderSimilarGroupPreview(assets = []) {
  const previewAssets = assets.slice(0, 4);
  if (!previewAssets.length) {
    return "";
  }

  const hiddenCount = Math.max(assets.length - previewAssets.length, 0);

  return `
    <div class="similar-preview" aria-label="Similar asset thumbnails">
      ${previewAssets.map((asset) => `
        <a class="similar-preview-tile" href="/assets/${encodeURIComponent(asset.id)}" target="_blank" rel="noreferrer" title="${escapeHtml(asset.relativePath ?? asset.name)}">
          <img loading="lazy" src="/assets/${encodeURIComponent(asset.id)}" alt="${escapeHtml(asset.name)}">
        </a>
      `).join("")}
      ${hiddenCount ? `<span class="similar-preview-more">+${hiddenCount}</span>` : ""}
    </div>
  `;
}

function renderGallery(view) {
  elements.resultCount.textContent = `${view.assets.length} assets`;
  elements.filteredSummary.innerHTML = `
    <div><strong>${formatBytes(view.filteredSummary.totalBytes)}</strong><span>shown size</span></div>
    <div><strong>${view.filteredSummary.duplicateAssets}</strong><span>duplicates shown</span></div>
    <div><strong>${view.filteredSummary.savedAssets}</strong><span>saved shown</span></div>
    <div><strong>${view.filteredSummary.reviewAssets}</strong><span>review shown</span></div>
    <div><strong>${view.filteredSummary.taggedAssets}</strong><span>tagged shown</span></div>
    <div><strong>${view.filteredSummary.notedAssets}</strong><span>notes shown</span></div>
    <div><strong>${view.filteredSummary.sources}</strong><span>sources shown</span></div>
    <div><strong>${view.filteredSummary.extensions}</strong><span>types shown</span></div>
  `;
  elements.emptyState.hidden = view.assets.length > 0;
  elements.gallery.innerHTML = view.assets.map((asset) => renderAssetCard(asset, view.duplicateAssetIds)).join("");
}

function renderAssetCard(asset, duplicateAssetIds) {
  const dimensions = asset.width && asset.height ? `${asset.width} x ${asset.height}` : "Unknown size";
  const isDuplicate = duplicateAssetIds.has(asset.id);
  const duplicateBadge = isDuplicate ? `<span class="badge duplicate">Duplicate</span>` : "";
  const isSaved = marks.saved.has(asset.id);
  const isReview = marks.review.has(asset.id);
  const isSelected = selectedAssetIds.has(asset.id);
  const description = createAssetDescription(asset);
  const visualReview = createAssetVisualReview(asset, duplicateAssetIds);
  return `
    <article class="asset-card${isSelected ? " selected" : ""}">
      <a class="asset-preview" href="/assets/${encodeURIComponent(asset.id)}" target="_blank" rel="noreferrer">
        <img loading="lazy" src="/assets/${encodeURIComponent(asset.id)}" alt="${escapeHtml(asset.name)}">
      </a>
      <div class="asset-body">
        <div class="asset-card-controls">
          <label class="asset-select">
            <input type="checkbox" data-select-asset="${escapeHtml(asset.id)}" ${isSelected ? "checked" : ""}>
            <span>Select</span>
          </label>
          <div class="asset-mark-actions">
            <button type="button" class="${isSaved ? "is-active" : ""}" data-toggle-save="${escapeHtml(asset.id)}" aria-pressed="${isSaved}">Saved</button>
            <button type="button" class="${isReview ? "is-active" : ""}" data-toggle-review="${escapeHtml(asset.id)}" aria-pressed="${isReview}">Review</button>
          </div>
        </div>
        <div class="asset-title">
          <h3 title="${escapeHtml(asset.name)}">${escapeHtml(asset.name)}</h3>
          ${duplicateBadge}
        </div>
        <p title="${escapeHtml(asset.relativePath)}">${escapeHtml(asset.relativePath)}</p>
        ${renderAssetCaption(description)}
        ${renderAssetAiReview(visualReview)}
        ${renderAssetPalette(asset)}
        ${renderAssetThemes(asset)}
        ${renderAssetColorThemes(asset)}
        ${renderAssetIssues(asset, duplicateAssetIds)}
        ${renderAssetTags(asset.id)}
        ${renderAssetNotePreview(asset.id)}
        <dl>
          <div><dt>Source</dt><dd>${escapeHtml(asset.rootName)}</dd></div>
          <div><dt>Type</dt><dd>${escapeHtml(asset.extension.replace(".", "").toUpperCase())}</dd></div>
          <div><dt>Size</dt><dd>${formatBytes(asset.sizeBytes)}</dd></div>
          <div><dt>Frame</dt><dd>${dimensions}</dd></div>
        </dl>
        <div class="asset-actions">
          <button type="button" class="primary-action" data-open-asset="/assets/${encodeURIComponent(asset.id)}">Open</button>
          <button type="button" data-show-details="${escapeHtml(asset.id)}">Details</button>
          <button type="button" data-copy-path="${escapeHtml(asset.path)}">Copy path</button>
        </div>
      </div>
    </article>
  `;
}

function renderAssetCaption(description) {
  if (!description) {
    return "";
  }

  return `
    <div class="asset-caption" aria-label="Generated image description">
      <span title="${escapeHtml(description)}">${escapeHtml(description)}</span>
      <button type="button" data-copy-card-description="${escapeHtml(description)}">Copy</button>
    </div>
  `;
}

function renderAssetAiReview(review) {
  if (!review) {
    return "";
  }

  return `
    <div class="ai-review" aria-label="AI visual review">
      <strong>AI Review</strong>
      <span title="${escapeHtml(review)}">${escapeHtml(review)}</span>
      <button type="button" data-copy-card-review="${escapeHtml(review)}">Copy</button>
    </div>
  `;
}

function renderAssetIssues(asset, duplicateAssetIds) {
  const issues = getAssetIssues(asset, duplicateAssetIds);
  if (!issues.length) {
    return "";
  }

  return `
    <div class="asset-issues">
      ${issues.map((issue) => `<button type="button" data-asset-issue="${escapeHtml(issue.value)}">${escapeHtml(issue.label)}</button>`).join("")}
    </div>
  `;
}

function renderAssetNotePreview(assetId) {
  const note = getAssetNote(assetNotes, assetId);
  if (!note) {
    return "";
  }

  return `<div class="asset-note-preview" title="${escapeHtml(note)}">${escapeHtml(note)}</div>`;
}

function renderAssetThemes(asset) {
  const themes = getAssetThemes(asset);
  if (!themes.length) {
    return "";
  }

  return `
    <div class="asset-themes">
      ${themes.map((theme) => `<button type="button" data-asset-theme="${escapeHtml(theme)}">${escapeHtml(theme)}</button>`).join("")}
    </div>
  `;
}

function renderAssetPalette(asset) {
  const palette = getAssetPalette(asset);
  if (!palette.length) {
    return "";
  }

  return `
    <div class="asset-palette" aria-label="Asset palette">
      ${palette.map(renderPaletteSwatch).join("")}
    </div>
  `;
}

function renderPaletteSwatch(color) {
  return `
    <button
      type="button"
      class="palette-swatch"
      data-palette-color="${escapeHtml(color)}"
      style="--swatch-color: ${escapeHtml(color)}"
      title="${escapeHtml(color)}"
      aria-label="Search ${escapeHtml(color)}"
    ></button>
  `;
}

function searchPaletteColor(color) {
  state.query = color;
  syncControlsFromState();
  render();
}

function renderAssetColorThemes(asset) {
  const colorThemes = getAssetColorThemes(asset);
  if (!colorThemes.length) {
    return "";
  }

  return `
    <div class="asset-color-themes">
      ${colorThemes.map((theme) => `<button type="button" data-asset-color-theme="${escapeHtml(theme)}">${escapeHtml(theme)}</button>`).join("")}
    </div>
  `;
}

function renderAssetTags(assetId) {
  const tags = getAssetTags(assetTags, assetId);
  if (!tags.length) {
    return "";
  }

  return `
    <div class="asset-tags">
      ${tags.map((tag) => `<button type="button" data-asset-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join("")}
    </div>
  `;
}

function showDetails(assetId) {
  const details = createAssetDetails(libraryIndex, assetId);
  if (!details) {
    return;
  }

  activeDetailAssetId = assetId;
  details.note = getAssetNote(assetNotes, assetId);
  details.navigation = createAssetNavigation(getDetailNavigationAssets(), assetId);
  details.isSaved = marks.saved.has(assetId);
  details.isReview = marks.review.has(assetId);
  elements.drawerTitle.textContent = details.name;
  elements.drawerContent.innerHTML = renderDetails(details);
  elements.detailDrawer.setAttribute("aria-hidden", "false");
}

function hideDetails() {
  activeDetailAssetId = null;
  elements.detailDrawer.setAttribute("aria-hidden", "true");
}

function renderDetails(details) {
  return `
    ${renderDetailNavigation(details.navigation)}
    ${renderDetailMarkActions(details)}
    <a class="drawer-preview" href="${details.imageUrl}" target="_blank" rel="noreferrer">
      <img src="${details.imageUrl}" alt="${escapeHtml(details.name)}">
    </a>
    ${details.isDuplicate ? `<div class="drawer-alert">${details.duplicateGroup.count} duplicate files, ${details.duplicateGroup.reclaimable} reclaimable</div>` : ""}
    ${renderDetailPalette(details)}
    ${renderDetailMetadata(details)}
    ${renderSuggestedDescription(details)}
    ${renderAiReview(details)}
    <section class="note-editor" aria-label="Local asset note">
      <label>
        <span>Local note</span>
        <textarea rows="5" data-note-asset="${escapeHtml(details.id)}" placeholder="Add usage notes, prompt context, or publishing status">${escapeHtml(details.note)}</textarea>
      </label>
      <button type="button" class="secondary-button" data-save-note="${escapeHtml(details.id)}">Save note</button>
    </section>
    <dl class="detail-list">
      ${details.fields.map(renderDetailField).join("")}
    </dl>
  `;
}

function renderSuggestedDescription(details) {
  if (!details.description) {
    return "";
  }

  return `
    <section class="suggested-description" aria-label="Suggested image description">
      <h3>Suggested Description</h3>
      <p>${escapeHtml(details.description)}</p>
      <div>
        <button type="button" data-copy-description="${escapeHtml(details.description)}">Copy description</button>
        <button type="button" data-save-description-note="${escapeHtml(details.id)}">Save as note</button>
      </div>
    </section>
  `;
}

function renderAiReview(details) {
  if (!details.visualReview) {
    return "";
  }

  return `
    <section class="ai-review" aria-label="AI visual review">
      <h3>AI Review</h3>
      <p>${escapeHtml(details.visualReview)}</p>
      <div>
        <button type="button" data-copy-visual-review="${escapeHtml(details.visualReview)}">Copy review</button>
        <button type="button" data-save-review-note="${escapeHtml(details.id)}">Save as note</button>
      </div>
    </section>
  `;
}

function renderDetailMetadata(details) {
  if (!details.metadataEntries?.length) {
    return "";
  }

  return `
    <section class="detail-metadata" aria-label="Embedded asset metadata">
      <h3>Embedded Metadata</h3>
      <dl>
        ${details.metadataEntries.map((entry) => `
          <div>
            <dt>${escapeHtml(entry.label)}</dt>
            <dd>${escapeHtml(entry.value)}</dd>
            <button type="button" data-copy-metadata-value="${escapeHtml(entry.value)}">Copy</button>
          </div>
        `).join("")}
      </dl>
    </section>
  `;
}

function renderDetailPalette(details) {
  if (!details.palette?.length) {
    return "";
  }

  return `
    <section class="detail-palette" aria-label="Asset palette">
      ${details.palette.map(renderPaletteSwatch).join("")}
    </section>
  `;
}

function renderDetailMarkActions(details) {
  return `
    <div class="drawer-mark-actions" aria-label="Asset marks">
      <button type="button" class="${details.isSaved ? "is-active" : ""}" data-toggle-detail-save="${escapeHtml(details.id)}" aria-pressed="${details.isSaved}">Saved</button>
      <button type="button" class="${details.isReview ? "is-active" : ""}" data-toggle-detail-review="${escapeHtml(details.id)}" aria-pressed="${details.isReview}">Review</button>
    </div>
  `;
}

function renderDetailNavigation(navigation) {
  if (!navigation || navigation.index < 0 || navigation.total <= 1) {
    return "";
  }

  return `
    <nav class="drawer-nav" aria-label="Asset navigation">
      <button type="button" data-show-adjacent-detail="${escapeHtml(navigation.previousAssetId ?? "")}" ${navigation.hasPrevious ? "" : "disabled"}>Previous</button>
      <span>${navigation.index + 1} of ${navigation.total}</span>
      <button type="button" data-show-adjacent-detail="${escapeHtml(navigation.nextAssetId ?? "")}" ${navigation.hasNext ? "" : "disabled"}>Next</button>
    </nav>
  `;
}

function showAdjacentDetails(direction) {
  if (!activeDetailAssetId) {
    return;
  }

  const navigation = createAssetNavigation(getDetailNavigationAssets(), activeDetailAssetId);
  const nextAssetId = direction === "previous" ? navigation.previousAssetId : navigation.nextAssetId;
  if (nextAssetId) {
    showDetails(nextAssetId);
  }
}

function getDetailNavigationAssets() {
  return currentView?.assets?.length ? currentView.assets : libraryIndex?.assets ?? [];
}

function toggleDetailMark(kind, assetId) {
  if (!assetId) {
    return;
  }
  toggleMark(kind, assetId);
  render();
  showDetails(assetId);
}

function isTextEditingTarget(target) {
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement
    || target?.isContentEditable === true;
}

function renderDetailField(field) {
  const copyButton = field.copyValue
    ? `<button type="button" data-copy-value="${escapeHtml(field.copyValue)}">Copy</button>`
    : "";
  return `
    <div>
      <dt>${escapeHtml(field.label)}</dt>
      <dd title="${escapeHtml(field.value)}">${escapeHtml(field.value)}</dd>
      ${copyButton}
    </div>
  `;
}

async function copySelectedPaths() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  await copyFromButton(elements.copySelectedPaths, createPathList(selectedAssets));
}

async function copySelectedDescriptions() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  await copyFromButton(elements.copySelectedDescriptions, createAssetDescriptionList(selectedAssets));
}

async function copyVisibleDescriptions() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  await copyFromButton(elements.copyVisibleDescriptions, createAssetDescriptionList(visibleAssets));
}

async function copySelectedAiReviews() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  await copyFromButton(elements.copySelectedAiReviews, createAssetVisualReviewList(selectedAssets, createAiReviewOptions("selected")));
}

async function copyVisibleAiReviews() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  await copyFromButton(elements.copyVisibleAiReviews, createAssetVisualReviewList(visibleAssets, createAiReviewOptions("visible")));
}

async function copySelectedAltText() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  await copyFromButton(elements.copySelectedAltText, createAssetAltTextList(selectedAssets, createAltTextOptions("selected")));
}

async function copyVisibleAltText() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  await copyFromButton(elements.copyVisibleAltText, createAssetAltTextList(visibleAssets, createAltTextOptions("visible")));
}

function downloadSelectedAltText() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  downloadAltTextList(selectedAssets, "selected", elements.downloadSelectedAltText);
}

function downloadVisibleAltText() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  downloadAltTextList(visibleAssets, "visible", elements.downloadVisibleAltText);
}

async function copySelectedContactSheet() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  await copyFromButton(elements.copySelectedContactSheet, createAssetContactSheet(selectedAssets, createContactSheetOptions()));
}

async function copyVisibleContactSheet() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  await copyFromButton(elements.copyVisibleContactSheet, createAssetContactSheet(visibleAssets, createContactSheetOptions()));
}

function downloadSelectedContactSheet() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  downloadContactSheet(selectedAssets, "selected", elements.downloadSelectedContactSheet);
}

function downloadVisibleContactSheet() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  downloadContactSheet(visibleAssets, "visible", elements.downloadVisibleContactSheet);
}

async function copySelectedEmbeds() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  await copyFromButton(elements.copySelectedEmbeds, createAssetEmbedList(selectedAssets, createEmbedOptions("selected")));
}

async function copyVisibleEmbeds() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  await copyFromButton(elements.copyVisibleEmbeds, createAssetEmbedList(visibleAssets, createEmbedOptions("visible")));
}

function downloadSelectedEmbeds() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  downloadEmbedList(selectedAssets, "selected", elements.downloadSelectedEmbeds);
}

function downloadVisibleEmbeds() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  downloadEmbedList(visibleAssets, "visible", elements.downloadVisibleEmbeds);
}

async function copySelectedPublishingChecklist() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  await copyFromButton(
    elements.copySelectedPublishingChecklist,
    createAssetPublishingChecklist(selectedAssets, createPublishingChecklistOptions("selected"))
  );
}

async function copyVisiblePublishingChecklist() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  await copyFromButton(
    elements.copyVisiblePublishingChecklist,
    createAssetPublishingChecklist(visibleAssets, createPublishingChecklistOptions("visible"))
  );
}

function downloadSelectedPublishingChecklist() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  downloadPublishingChecklist(selectedAssets, "selected", elements.downloadSelectedPublishingChecklist);
}

function downloadVisiblePublishingChecklist() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  downloadPublishingChecklist(visibleAssets, "visible", elements.downloadVisiblePublishingChecklist);
}

async function copySelectedReadinessReport() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  await copyFromButton(
    elements.copySelectedReadinessReport,
    createAssetReadinessReport(selectedAssets, createReadinessReportOptions("selected"))
  );
}

async function copyVisibleReadinessReport() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  await copyFromButton(
    elements.copyVisibleReadinessReport,
    createAssetReadinessReport(visibleAssets, createReadinessReportOptions("visible"))
  );
}

function downloadSelectedReadinessReport() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  downloadReadinessReport(selectedAssets, "selected", elements.downloadSelectedReadinessReport);
}

function downloadVisibleReadinessReport() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  downloadReadinessReport(visibleAssets, "visible", elements.downloadVisibleReadinessReport);
}

async function copySelectedProvenanceReport() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  await copyFromButton(
    elements.copySelectedProvenanceReport,
    createAssetProvenanceReport(selectedAssets, createProvenanceReportOptions("selected"))
  );
}

async function copyVisibleProvenanceReport() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  await copyFromButton(
    elements.copyVisibleProvenanceReport,
    createAssetProvenanceReport(visibleAssets, createProvenanceReportOptions("visible"))
  );
}

function downloadSelectedProvenanceReport() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  downloadProvenanceReport(selectedAssets, "selected", elements.downloadSelectedProvenanceReport);
}

function downloadVisibleProvenanceReport() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  downloadProvenanceReport(visibleAssets, "visible", elements.downloadVisibleProvenanceReport);
}

async function copySelectedPromptKeywordReport() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  await copyFromButton(
    elements.copySelectedPromptKeywordReport,
    createAssetPromptKeywordReport(selectedAssets, createPromptKeywordReportOptions("selected"))
  );
}

async function copyVisiblePromptKeywordReport() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  await copyFromButton(
    elements.copyVisiblePromptKeywordReport,
    createAssetPromptKeywordReport(visibleAssets, createPromptKeywordReportOptions("visible"))
  );
}

function downloadSelectedPromptKeywordReport() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  downloadPromptKeywordReport(selectedAssets, "selected", elements.downloadSelectedPromptKeywordReport);
}

function downloadVisiblePromptKeywordReport() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  downloadPromptKeywordReport(visibleAssets, "visible", elements.downloadVisiblePromptKeywordReport);
}

async function copySelectedCollectionBrief() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  await copyFromButton(
    elements.copySelectedCollectionBrief,
    createAssetCollectionBrief(selectedAssets, createCollectionBriefOptions("selected"))
  );
}

async function copyVisibleCollectionBrief() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  await copyFromButton(
    elements.copyVisibleCollectionBrief,
    createAssetCollectionBrief(visibleAssets, createCollectionBriefOptions("visible"))
  );
}

function downloadSelectedCollectionBrief() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  downloadCollectionBrief(selectedAssets, "selected", elements.downloadSelectedCollectionBrief);
}

function downloadVisibleCollectionBrief() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  downloadCollectionBrief(visibleAssets, "visible", elements.downloadVisibleCollectionBrief);
}

async function copySelectedCsv() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  await copyFromButton(elements.copySelectedCsv, createAssetCsv(selectedAssets));
}

async function copyVisibleCsv() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  await copyFromButton(elements.copyVisibleCsv, createAssetCsv(visibleAssets));
}

async function copySelectedManifest() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  await copyFromButton(elements.copySelectedManifest, createAssetManifest(selectedAssets, createManifestOptions("selected")));
}

async function copyVisibleManifest() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  await copyFromButton(elements.copyVisibleManifest, createAssetManifest(visibleAssets, createManifestOptions("visible")));
}

async function copySelectedRenamePlan() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  await copyFromButton(elements.copySelectedRenamePlan, createAssetRenamePlan(selectedAssets, createRenamePlanOptions("selected")));
}

async function copyVisibleRenamePlan() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  await copyFromButton(elements.copyVisibleRenamePlan, createAssetRenamePlan(visibleAssets, createRenamePlanOptions("visible")));
}

function downloadSelectedRenamePlan() {
  const selectedAssets = getSelectedAssets();
  if (!selectedAssets.length) {
    return;
  }
  downloadRenamePlan(selectedAssets, "selected", elements.downloadSelectedRenamePlan);
}

function downloadVisibleRenamePlan() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  downloadRenamePlan(visibleAssets, "visible", elements.downloadVisibleRenamePlan);
}

function createManifestOptions(label) {
  return {
    label,
    savedAssetIds: marks.saved,
    reviewAssetIds: marks.review,
    assetTags,
    assetNotes,
    duplicateAssetIds: currentView?.duplicateAssetIds
  };
}

function createRenamePlanOptions(label, generatedAt = new Date().toISOString()) {
  return {
    generatedAt,
    label
  };
}

function createAltTextOptions(label, generatedAt = new Date().toISOString()) {
  return {
    generatedAt,
    label
  };
}

function createAiReviewOptions(label, generatedAt = new Date().toISOString()) {
  return {
    generatedAt,
    label,
    duplicateAssetIds: currentView?.duplicateAssetIds
  };
}

function createEmbedOptions(label, generatedAt = new Date().toISOString()) {
  return {
    generatedAt,
    label,
    assetBaseUrl: window.location.origin
  };
}

function createPublishingChecklistOptions(label, generatedAt = new Date().toISOString()) {
  return {
    generatedAt,
    label,
    assetBaseUrl: window.location.origin,
    duplicateAssetIds: currentView?.duplicateAssetIds
  };
}

function createReadinessReportOptions(label, generatedAt = new Date().toISOString()) {
  return {
    generatedAt,
    label,
    duplicateAssetIds: currentView?.duplicateAssetIds
  };
}

function createProvenanceReportOptions(label, generatedAt = new Date().toISOString()) {
  return {
    generatedAt,
    label
  };
}

function createPromptKeywordReportOptions(label, generatedAt = new Date().toISOString()) {
  return {
    generatedAt,
    label
  };
}

function createCollectionBriefOptions(label, generatedAt = new Date().toISOString()) {
  return {
    generatedAt,
    label,
    duplicateAssetIds: currentView?.duplicateAssetIds
  };
}

function createContactSheetOptionsWithTimestamp(generatedAt = new Date().toISOString()) {
  return {
    ...createContactSheetOptions(),
    generatedAt
  };
}

function downloadAltTextList(assets, label, button) {
  const generatedAt = new Date().toISOString();
  const list = createAssetAltTextList(assets, createAltTextOptions(label, generatedAt));
  const fileName = createExportFileName(`asset-alt-text-${label}`, "md", { generatedAt });
  downloadTextFile(button, list, fileName, "text/markdown");
}

function downloadEmbedList(assets, label, button) {
  const generatedAt = new Date().toISOString();
  const list = createAssetEmbedList(assets, createEmbedOptions(label, generatedAt));
  const fileName = createExportFileName(`asset-embeds-${label}`, "md", { generatedAt });
  downloadTextFile(button, list, fileName, "text/markdown");
}

function downloadContactSheet(assets, label, button) {
  const generatedAt = new Date().toISOString();
  const sheet = createAssetContactSheet(assets, createContactSheetOptionsWithTimestamp(generatedAt));
  const fileName = createExportFileName(`asset-contact-sheet-${label}`, "md", { generatedAt });
  downloadTextFile(button, sheet, fileName, "text/markdown");
}

function downloadPublishingChecklist(assets, label, button) {
  const generatedAt = new Date().toISOString();
  const checklist = createAssetPublishingChecklist(assets, createPublishingChecklistOptions(label, generatedAt));
  const fileName = createExportFileName(`asset-publishing-checklist-${label}`, "md", { generatedAt });
  downloadTextFile(button, checklist, fileName, "text/markdown");
}

function downloadReadinessReport(assets, label, button) {
  const generatedAt = new Date().toISOString();
  const report = createAssetReadinessReport(assets, createReadinessReportOptions(label, generatedAt));
  const fileName = createExportFileName(`asset-readiness-report-${label}`, "md", { generatedAt });
  downloadTextFile(button, report, fileName, "text/markdown");
}

function downloadProvenanceReport(assets, label, button) {
  const generatedAt = new Date().toISOString();
  const report = createAssetProvenanceReport(assets, createProvenanceReportOptions(label, generatedAt));
  const fileName = createExportFileName(`asset-provenance-report-${label}`, "md", { generatedAt });
  downloadTextFile(button, report, fileName, "text/markdown");
}

function downloadPromptKeywordReport(assets, label, button) {
  const generatedAt = new Date().toISOString();
  const report = createAssetPromptKeywordReport(assets, createPromptKeywordReportOptions(label, generatedAt));
  const fileName = createExportFileName(`asset-prompt-keyword-report-${label}`, "md", { generatedAt });
  downloadTextFile(button, report, fileName, "text/markdown");
}

function downloadCollectionBrief(assets, label, button) {
  const generatedAt = new Date().toISOString();
  const brief = createAssetCollectionBrief(assets, createCollectionBriefOptions(label, generatedAt));
  const fileName = createExportFileName(`asset-collection-brief-${label}`, "md", { generatedAt });
  downloadTextFile(button, brief, fileName, "text/markdown");
}

function downloadRenamePlan(assets, label, button) {
  const generatedAt = new Date().toISOString();
  const plan = createAssetRenamePlan(assets, createRenamePlanOptions(label, generatedAt));
  const fileName = createExportFileName(`asset-rename-plan-${label}`, "md", { generatedAt });
  downloadTextFile(button, plan, fileName, "text/markdown");
}

function createContactSheetOptions() {
  return {
    assetBaseUrl: window.location.origin
  };
}

function applySelectedMarkBatch(action, button) {
  if (!selectedAssetIds.size) {
    return;
  }

  const updatedMarks = applyMarkBatch({
    savedAssetIds: marks.saved,
    reviewAssetIds: marks.review
  }, selectedAssetIds, action);
  marks.saved = new Set(updatedMarks.saved);
  marks.review = new Set(updatedMarks.review);
  saveMarks();
  render();
  showButtonFeedback(button, getMarkBatchFeedback(action));
}

function getMarkBatchFeedback(action) {
  if (action === "save") {
    return "Saved";
  }
  if (action === "review") {
    return "Queued";
  }
  return "Unmarked";
}

function applySelectedTagBatch(action, button) {
  if (!selectedAssetIds.size) {
    return;
  }

  const promptText = action === "add" ? "Tag selected assets" : "Remove tag from selected assets";
  const defaultTag = action === "remove" ? getSelectedTags()[0] ?? "" : "";
  const tag = window.prompt(promptText, defaultTag);
  if (tag === null) {
    return;
  }

  assetTags = applyTagBatch(assetTags, selectedAssetIds, tag, action);
  if (state.tag !== "all" && !getAllAssetTags(assetTags).includes(state.tag)) {
    state.tag = "all";
  }
  saveAssetTags();
  syncControlsFromState();
  render();
  showButtonFeedback(button, action === "add" ? "Tagged" : "Removed");
}

function getSelectedTags() {
  return getAllAssetTags(Object.fromEntries(
    [...selectedAssetIds].map((assetId) => [assetId, getAssetTags(assetTags, assetId)])
  ));
}

function saveAssetNote(assetId) {
  const textarea = elements.drawerContent.querySelector("[data-note-asset]");
  if (!textarea || textarea.dataset.noteAsset !== assetId) {
    return;
  }

  assetNotes = setAssetNote(assetNotes, assetId, textarea.value);
  saveAssetNotes();
  render();
  showDetails(assetId);

  const button = elements.drawerContent.querySelector("[data-save-note]");
  if (button) {
    showButtonFeedback(button, "Saved");
  }
}

function saveSuggestedDescriptionAsNote(assetId) {
  const details = createAssetDetails(libraryIndex, assetId);
  if (!details?.description) {
    return;
  }

  assetNotes = setAssetNote(assetNotes, assetId, details.description);
  saveAssetNotes();
  render();
  showDetails(assetId);
}

function saveVisualReviewAsNote(assetId) {
  const details = createAssetDetails(libraryIndex, assetId);
  if (!details?.visualReview) {
    return;
  }

  assetNotes = setAssetNote(assetNotes, assetId, details.visualReview);
  saveAssetNotes();
  render();
  showDetails(assetId);
}

function selectVisibleAssets() {
  for (const asset of currentView?.assets ?? []) {
    selectedAssetIds.add(asset.id);
  }
  render();
}

async function copyVisiblePaths() {
  const visibleAssets = currentView?.assets ?? [];
  if (!visibleAssets.length) {
    return;
  }
  await copyFromButton(elements.copyVisiblePaths, createPathList(visibleAssets));
}

async function copyDuplicateGroupPaths(button, groupIndex) {
  const group = libraryIndex?.duplicates?.[groupIndex];
  if (!group) {
    return;
  }
  const details = createDuplicateGroupDetails(libraryIndex, group);
  await copyFromButton(button, details.pathList);
}

async function copyDuplicateCleanupCandidates(button, groupIndex) {
  const group = libraryIndex?.duplicates?.[groupIndex];
  if (!group) {
    return;
  }
  const details = createDuplicateGroupDetails(libraryIndex, group);
  if (!details.cleanupPathList) {
    return;
  }
  await copyFromButton(button, details.cleanupPathList);
}

async function copySimilarGroupPaths(button, groupIndex) {
  const group = libraryIndex?.similarGroups?.[groupIndex];
  if (!group) {
    return;
  }
  const details = createSimilarGroupDetails(libraryIndex, group);
  await copyFromButton(button, details.pathList);
}

async function copySimilarGroupContactSheet(button, groupIndex) {
  const group = libraryIndex?.similarGroups?.[groupIndex];
  if (!group) {
    return;
  }
  const details = createSimilarGroupDetails(libraryIndex, group);
  await copyFromButton(button, createAssetContactSheet(details.assets, createContactSheetOptions()));
}

async function copyWorkflowReport() {
  const report = createWorkflowReport(libraryIndex, createWorkflowReportOptions());
  await copyFromButton(elements.copyWorkflowReport, report);
}

function downloadWorkflowReport() {
  const generatedAt = new Date().toISOString();
  const report = createWorkflowReport(libraryIndex, createWorkflowReportOptions(generatedAt));
  const fileName = createExportFileName("workflow-report", "md", { generatedAt });
  downloadTextFile(elements.downloadWorkflowReport, report, fileName, "text/markdown");
}

async function copyHealthReport() {
  const report = createLibraryHealthReport(libraryIndex, { generatedAt: new Date().toISOString() });
  await copyFromButton(elements.copyHealthReport, report);
}

function downloadHealthReport() {
  const generatedAt = new Date().toISOString();
  const report = createLibraryHealthReport(libraryIndex, { generatedAt });
  const fileName = createExportFileName("library-health-report", "md", { generatedAt });
  downloadTextFile(elements.downloadHealthReport, report, fileName, "text/markdown");
}

async function copyIssueReport() {
  const report = createAssetIssueReport(libraryIndex, { generatedAt: new Date().toISOString() });
  await copyFromButton(elements.copyIssueReport, report);
}

function downloadIssueReport() {
  const generatedAt = new Date().toISOString();
  const report = createAssetIssueReport(libraryIndex, { generatedAt });
  const fileName = createExportFileName("asset-issue-report", "md", { generatedAt });
  downloadTextFile(elements.downloadIssueReport, report, fileName, "text/markdown");
}

async function copyMarksBackup() {
  const backup = createMarkBackup(createMarkBackupOptions());
  await copyFromButton(elements.copyMarksBackup, backup);
}

function downloadMarksBackup() {
  const generatedAt = new Date().toISOString();
  const backup = createMarkBackup(createMarkBackupOptions(generatedAt));
  const fileName = createExportFileName("marks-backup", "json", { generatedAt });
  downloadTextFile(elements.downloadMarksBackup, backup, fileName, "application/json");
}

async function copyCurationBackup() {
  const backup = createCurationBackup(createCurationBackupOptions());
  await copyFromButton(elements.copyCurationBackup, backup);
}

function downloadCurationBackup() {
  const generatedAt = new Date().toISOString();
  const backup = createCurationBackup(createCurationBackupOptions(generatedAt));
  const fileName = createExportFileName("curation-backup", "json", { generatedAt });
  downloadTextFile(elements.downloadCurationBackup, backup, fileName, "application/json");
}

async function importMarksBackup() {
  try {
    const imported = parseMarkBackup(await navigator.clipboard.readText());
    marks.saved = new Set(imported.saved);
    marks.review = new Set(imported.review);
    saveMarks();
    render();
    showButtonFeedback(elements.importMarksBackup, "Imported");
  } catch {
    showButtonFeedback(elements.importMarksBackup, "Import failed");
  }
}

async function importCurationBackup() {
  try {
    const imported = parseCurationBackup(await navigator.clipboard.readText());
    marks.saved = new Set(imported.saved);
    marks.review = new Set(imported.review);
    assetTags = imported.assetTags;
    assetNotes = imported.assetNotes;
    savedFilterViews = imported.savedFilterViews;
    saveAllCurationState();
    if (state.tag !== "all" && !getAllAssetTags(assetTags).includes(state.tag)) {
      state.tag = "all";
    }
    syncControlsFromState();
    render();
    showButtonFeedback(elements.importCurationBackup, "Imported");
  } catch {
    showButtonFeedback(elements.importCurationBackup, "Import failed");
  }
}

function hasCurationState() {
  return marks.saved.size > 0
    || marks.review.size > 0
    || Object.keys(assetTags).length > 0
    || Object.keys(assetNotes).length > 0
    || savedFilterViews.length > 0;
}

function hasAssetIssues() {
  return Boolean(currentView?.issueBreakdown?.length);
}

function createWorkflowReportOptions(generatedAt = new Date().toISOString()) {
  return {
    generatedAt,
    selectedAssetIds,
    savedAssetIds: marks.saved,
    reviewAssetIds: marks.review,
    assetTags,
    assetNotes
  };
}

function createMarkBackupOptions(generatedAt = new Date().toISOString()) {
  return {
    generatedAt,
    savedAssetIds: marks.saved,
    reviewAssetIds: marks.review
  };
}

function createCurationBackupOptions(generatedAt = new Date().toISOString()) {
  return {
    generatedAt,
    savedAssetIds: marks.saved,
    reviewAssetIds: marks.review,
    assetTags,
    assetNotes,
    savedFilterViews
  };
}

function getSelectedAssets() {
  const assets = Array.isArray(libraryIndex?.assets) ? libraryIndex.assets : [];
  return assets.filter((asset) => selectedAssetIds.has(asset.id));
}

function setAssetSelected(assetId, isSelected) {
  if (isSelected) {
    selectedAssetIds.add(assetId);
  } else {
    selectedAssetIds.delete(assetId);
  }
}

function toggleMark(kind, assetId) {
  const set = kind === "review" ? marks.review : marks.saved;
  if (set.has(assetId)) {
    set.delete(assetId);
  } else {
    set.add(assetId);
  }
  saveMarks();
}

function loadMarks() {
  try {
    const parsed = JSON.parse(localStorage.getItem(MARK_STORAGE_KEY) ?? "{}");
    return {
      saved: new Set(Array.isArray(parsed.saved) ? parsed.saved : []),
      review: new Set(Array.isArray(parsed.review) ? parsed.review : [])
    };
  } catch {
    return { saved: new Set(), review: new Set() };
  }
}

function loadAssetTags() {
  try {
    return JSON.parse(localStorage.getItem(TAG_STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function loadAssetNotes() {
  try {
    return JSON.parse(localStorage.getItem(NOTE_STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveAssetTags() {
  try {
    localStorage.setItem(TAG_STORAGE_KEY, JSON.stringify(assetTags));
  } catch {
    // Tags are optional browser-local curation state.
  }
}

function saveAssetNotes() {
  try {
    localStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(assetNotes));
  } catch {
    // Notes are optional browser-local curation state.
  }
}

function loadSavedFilterViews() {
  try {
    return normalizeSavedFilterViews(JSON.parse(localStorage.getItem(FILTER_VIEWS_STORAGE_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

function saveSavedFilterViews() {
  try {
    localStorage.setItem(FILTER_VIEWS_STORAGE_KEY, JSON.stringify(savedFilterViews));
  } catch {
    // Saved views are optional browser-local convenience state.
  }
}

function hydrateRecentFolders() {
  const recentFolders = loadRecentFolders();
  elements.recentFolderList.innerHTML = recentFolders
    .map((folderPath) => `<option value="${escapeHtml(folderPath)}"></option>`)
    .join("");

  if (!elements.folderPathInput.value && recentFolders[0]) {
    elements.folderPathInput.value = recentFolders[0];
  }
}

function saveRecentFolder(folderPath) {
  const normalizedPath = String(folderPath ?? "").trim();
  if (!normalizedPath) {
    return;
  }

  const recentFolders = [
    normalizedPath,
    ...loadRecentFolders().filter((candidate) => candidate !== normalizedPath)
  ].slice(0, 8);
  try {
    localStorage.setItem(RECENT_FOLDERS_STORAGE_KEY, JSON.stringify(recentFolders));
  } catch {
    // Recent folders are optional browser-local convenience state.
  }
}

function loadRecentFolders() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_FOLDERS_STORAGE_KEY) ?? "[]");
    return normalizeRecentFolders(parsed);
  } catch {
    return [];
  }
}

function normalizeRecentFolders(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...new Set(value.map((item) => String(item ?? "").trim()).filter(Boolean))].slice(0, 8);
}

function saveAllCurationState() {
  saveMarks();
  saveAssetTags();
  saveAssetNotes();
  saveSavedFilterViews();
}

function saveMarks() {
  try {
    localStorage.setItem(MARK_STORAGE_KEY, JSON.stringify({
      saved: [...marks.saved],
      review: [...marks.review]
    }));
  } catch {
    // Keep the UI usable even when browser storage is unavailable.
  }
}

async function copyFromButton(button, value) {
  await navigator.clipboard.writeText(value);
  showButtonFeedback(button, "Copied");
}

function downloadTextFile(button, value, fileName, mimeType = "text/plain") {
  const blob = new Blob([value], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showButtonFeedback(button, "Downloaded");
}

function showButtonFeedback(button, message) {
  const originalText = button.textContent;
  button.textContent = message;
  setTimeout(() => {
    button.textContent = originalText;
  }, 1100);
}

function syncSelect(select, options, selectedValue) {
  const existingValue = select.value || selectedValue;
  select.innerHTML = options
    .map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`)
    .join("");
  select.value = options.some(([value]) => value === existingValue) ? existingValue : "all";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
