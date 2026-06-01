import {
  applyMarkBatch,
  applyTagBatch,
  createActiveFilterChips,
  createAssetCsv,
  createAssetDetails,
  createAssetManifest,
  createCurationBackup,
  createDefaultViewState,
  createDuplicateGroupDetails,
  createLibraryView,
  createMarkBackup,
  createPathList,
  createSavedFilterView,
  createWorkflowReport,
  formatBytes,
  formatDate,
  getAllAssetTags,
  getAssetNote,
  getAssetTags,
  normalizeSavedFilterViews,
  parseCurationBackup,
  parseMarkBackup,
  setAssetNote
} from "./view-model.js";

const elements = {
  status: document.querySelector("#scan-status"),
  assets: document.querySelector("#metric-assets"),
  size: document.querySelector("#metric-size"),
  duplicates: document.querySelector("#metric-duplicates"),
  reclaimable: document.querySelector("#metric-reclaimable"),
  search: document.querySelector("#search-input"),
  root: document.querySelector("#root-filter"),
  extension: document.querySelector("#extension-filter"),
  orientation: document.querySelector("#orientation-filter"),
  resolution: document.querySelector("#resolution-filter"),
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
  copyVisibleCsv: document.querySelector("#copy-visible-csv"),
  copySelectedCsv: document.querySelector("#copy-selected-csv"),
  copyVisibleManifest: document.querySelector("#copy-visible-manifest"),
  copySelectedManifest: document.querySelector("#copy-selected-manifest"),
  saveSelectedAssets: document.querySelector("#save-selected-assets"),
  reviewSelectedAssets: document.querySelector("#review-selected-assets"),
  unmarkSelectedAssets: document.querySelector("#unmark-selected-assets"),
  tagSelectedAssets: document.querySelector("#tag-selected-assets"),
  untagSelectedAssets: document.querySelector("#untag-selected-assets"),
  copyWorkflowReport: document.querySelector("#copy-workflow-report"),
  copyMarksBackup: document.querySelector("#copy-marks-backup"),
  importMarksBackup: document.querySelector("#import-marks-backup"),
  copyCurationBackup: document.querySelector("#copy-curation-backup"),
  importCurationBackup: document.querySelector("#import-curation-backup"),
  clearSelection: document.querySelector("#clear-selection"),
  sourceBreakdown: document.querySelector("#source-breakdown"),
  sourceBreakdownCount: document.querySelector("#source-breakdown-count"),
  typeBreakdown: document.querySelector("#type-breakdown"),
  typeBreakdownCount: document.querySelector("#type-breakdown-count"),
  duplicateSummary: document.querySelector("#duplicate-summary"),
  duplicateList: document.querySelector("#duplicate-list"),
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
const state = createDefaultViewState();
const marks = loadMarks();
let assetTags = loadAssetTags();
let assetNotes = loadAssetNotes();
let savedFilterViews = loadSavedFilterViews();
const selectedAssetIds = new Set();

let libraryIndex = null;
let currentView = null;

init();

async function init() {
  bindEvents();
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

function bindEvents() {
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
  elements.copyVisibleCsv.addEventListener("click", copyVisibleCsv);
  elements.copySelectedCsv.addEventListener("click", copySelectedCsv);
  elements.copyVisibleManifest.addEventListener("click", copyVisibleManifest);
  elements.copySelectedManifest.addEventListener("click", copySelectedManifest);
  elements.saveSelectedAssets.addEventListener("click", () => applySelectedMarkBatch("save", elements.saveSelectedAssets));
  elements.reviewSelectedAssets.addEventListener("click", () => applySelectedMarkBatch("review", elements.reviewSelectedAssets));
  elements.unmarkSelectedAssets.addEventListener("click", () => applySelectedMarkBatch("clear", elements.unmarkSelectedAssets));
  elements.tagSelectedAssets.addEventListener("click", () => applySelectedTagBatch("add", elements.tagSelectedAssets));
  elements.untagSelectedAssets.addEventListener("click", () => applySelectedTagBatch("remove", elements.untagSelectedAssets));
  elements.copyWorkflowReport.addEventListener("click", copyWorkflowReport);
  elements.copyMarksBackup.addEventListener("click", copyMarksBackup);
  elements.importMarksBackup.addEventListener("click", importMarksBackup);
  elements.copyCurationBackup.addEventListener("click", copyCurationBackup);
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
  elements.gallery.addEventListener("click", async (event) => {
    const tagButton = event.target.closest("[data-asset-tag]");
    if (tagButton) {
      state.tag = tagButton.dataset.assetTag;
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
    if (event.key === "Escape" && elements.detailDrawer.getAttribute("aria-hidden") === "false") {
      hideDetails();
    }
  });
}

function syncControlsFromState() {
  elements.search.value = state.query;
  elements.root.value = state.root;
  elements.extension.value = state.extension;
  elements.orientation.value = state.orientation;
  elements.resolution.value = state.resolution;
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
  renderGallery(view);
}

function renderSummary(index) {
  elements.assets.textContent = String(index.summary.totalAssets ?? 0);
  elements.size.textContent = formatBytes(index.summary.totalBytes ?? 0);
  elements.duplicates.textContent = String(index.summary.duplicateGroups ?? 0);
  elements.reclaimable.textContent = formatBytes(index.summary.reclaimableBytes ?? 0);
  elements.status.textContent = `Indexed ${formatDate(index.generatedAt)}`;
}

function renderWorkflow() {
  elements.savedCount.textContent = `${marks.saved.size} saved`;
  elements.reviewCount.textContent = `${marks.review.size} review`;
  elements.selectedCount.textContent = `${selectedAssetIds.size} selected`;
  elements.selectVisibleAssets.disabled = !currentView?.assets.length;
  elements.copyVisiblePaths.disabled = !currentView?.assets.length;
  elements.copySelectedPaths.disabled = selectedAssetIds.size === 0;
  elements.copyVisibleCsv.disabled = !currentView?.assets.length;
  elements.copySelectedCsv.disabled = selectedAssetIds.size === 0;
  elements.copyVisibleManifest.disabled = !currentView?.assets.length;
  elements.copySelectedManifest.disabled = selectedAssetIds.size === 0;
  elements.saveSelectedAssets.disabled = selectedAssetIds.size === 0;
  elements.reviewSelectedAssets.disabled = selectedAssetIds.size === 0;
  elements.unmarkSelectedAssets.disabled = selectedAssetIds.size === 0;
  elements.tagSelectedAssets.disabled = selectedAssetIds.size === 0;
  elements.untagSelectedAssets.disabled = selectedAssetIds.size === 0;
  elements.copyWorkflowReport.disabled = selectedAssetIds.size + marks.saved.size + marks.review.size === 0;
  elements.copyMarksBackup.disabled = marks.saved.size + marks.review.size === 0;
  elements.copyCurationBackup.disabled = !hasCurationState();
  elements.clearSelection.disabled = selectedAssetIds.size === 0;
}

function renderFilters(view) {
  syncSelect(elements.root, [["all", "All sources"], ...view.roots.map((root) => [root, root])], state.root);
  syncSelect(
    elements.extension,
    [["all", "All types"], ...view.extensions.map((extension) => [extension, extension.replace(".", "").toUpperCase()])],
    state.extension
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
  elements.sourceBreakdown.innerHTML = view.sourceBreakdown
    .map((item) => renderBreakdownItem(item, "root", item.label))
    .join("");
  elements.typeBreakdown.innerHTML = view.extensionBreakdown.map((item) =>
    renderBreakdownItem({
      label: item.label.replace(".", "").toUpperCase(),
      count: item.count
    }, "extension", item.label)
  ).join("");
}

function renderBreakdownItem(item, filterType, filterValue) {
  const filterAttribute = filterType === "root"
    ? `data-set-root-filter="${escapeHtml(filterValue)}"`
    : `data-set-extension-filter="${escapeHtml(filterValue)}"`;
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
  elements.gallery.innerHTML = view.assets.map((asset) => renderAssetCard(asset, view.duplicateAssetIds.has(asset.id))).join("");
}

function renderAssetCard(asset, isDuplicate) {
  const dimensions = asset.width && asset.height ? `${asset.width} x ${asset.height}` : "Unknown size";
  const duplicateBadge = isDuplicate ? `<span class="badge duplicate">Duplicate</span>` : "";
  const isSaved = marks.saved.has(asset.id);
  const isReview = marks.review.has(asset.id);
  const isSelected = selectedAssetIds.has(asset.id);
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

function renderAssetNotePreview(assetId) {
  const note = getAssetNote(assetNotes, assetId);
  if (!note) {
    return "";
  }

  return `<div class="asset-note-preview" title="${escapeHtml(note)}">${escapeHtml(note)}</div>`;
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

  details.note = getAssetNote(assetNotes, assetId);
  elements.drawerTitle.textContent = details.name;
  elements.drawerContent.innerHTML = renderDetails(details);
  elements.detailDrawer.setAttribute("aria-hidden", "false");
}

function hideDetails() {
  elements.detailDrawer.setAttribute("aria-hidden", "true");
}

function renderDetails(details) {
  return `
    <a class="drawer-preview" href="${details.imageUrl}" target="_blank" rel="noreferrer">
      <img src="${details.imageUrl}" alt="${escapeHtml(details.name)}">
    </a>
    ${details.isDuplicate ? `<div class="drawer-alert">${details.duplicateGroup.count} duplicate files, ${details.duplicateGroup.reclaimable} reclaimable</div>` : ""}
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

async function copyWorkflowReport() {
  const report = createWorkflowReport(libraryIndex, {
    generatedAt: new Date().toISOString(),
    selectedAssetIds,
    savedAssetIds: marks.saved,
    reviewAssetIds: marks.review
  });
  await copyFromButton(elements.copyWorkflowReport, report);
}

async function copyMarksBackup() {
  const backup = createMarkBackup({
    generatedAt: new Date().toISOString(),
    savedAssetIds: marks.saved,
    reviewAssetIds: marks.review
  });
  await copyFromButton(elements.copyMarksBackup, backup);
}

async function copyCurationBackup() {
  const backup = createCurationBackup({
    generatedAt: new Date().toISOString(),
    savedAssetIds: marks.saved,
    reviewAssetIds: marks.review,
    assetTags,
    assetNotes,
    savedFilterViews
  });
  await copyFromButton(elements.copyCurationBackup, backup);
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
