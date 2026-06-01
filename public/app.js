import { createAssetDetails, createDefaultViewState, createLibraryView, formatBytes, formatDate } from "./view-model.js";

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
  age: document.querySelector("#age-filter"),
  sort: document.querySelector("#sort-select"),
  duplicateToggle: document.querySelector("#duplicate-toggle"),
  resetFilters: document.querySelector("#reset-filters"),
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

const state = createDefaultViewState();

let libraryIndex = null;

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
  elements.age.addEventListener("change", () => {
    state.maxAgeDays = elements.age.value;
    render();
  });
  elements.sort.addEventListener("change", () => {
    state.sort = elements.sort.value;
    render();
  });
  elements.duplicateToggle.addEventListener("change", () => {
    state.duplicateOnly = elements.duplicateToggle.checked;
    render();
  });
  elements.resetFilters.addEventListener("click", () => {
    Object.assign(state, createDefaultViewState());
    syncControlsFromState();
    render();
  });
  elements.gallery.addEventListener("click", async (event) => {
    const openButton = event.target.closest("[data-open-asset]");
    if (openButton) {
      window.location.assign(openButton.dataset.openAsset);
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
  elements.age.value = state.maxAgeDays;
  elements.sort.value = state.sort;
  elements.duplicateToggle.checked = state.duplicateOnly;
}

function render() {
  if (!libraryIndex) {
    return;
  }

  const view = createLibraryView(libraryIndex, state);
  renderSummary(libraryIndex);
  renderFilters(view);
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

function renderFilters(view) {
  syncSelect(elements.root, [["all", "All sources"], ...view.roots.map((root) => [root, root])], state.root);
  syncSelect(
    elements.extension,
    [["all", "All types"], ...view.extensions.map((extension) => [extension, extension.replace(".", "").toUpperCase()])],
    state.extension
  );
}

function renderBreakdowns(view) {
  elements.sourceBreakdownCount.textContent = `${view.sourceBreakdown.length} sources`;
  elements.typeBreakdownCount.textContent = `${view.extensionBreakdown.length} types`;
  elements.sourceBreakdown.innerHTML = view.sourceBreakdown.map(renderBreakdownItem).join("");
  elements.typeBreakdown.innerHTML = view.extensionBreakdown.map((item) =>
    renderBreakdownItem({
      label: item.label.replace(".", "").toUpperCase(),
      count: item.count
    })
  ).join("");
}

function renderBreakdownItem(item) {
  return `
    <div class="breakdown-item">
      <span title="${escapeHtml(item.label)}">${escapeHtml(item.label)}</span>
      <strong>${item.count}</strong>
    </div>
  `;
}

function renderDuplicates(index) {
  const assetsById = new Map(index.assets.map((asset) => [asset.id, asset]));
  const groups = index.duplicates ?? [];
  elements.duplicateSummary.textContent = `${groups.length} groups`;

  if (!groups.length) {
    elements.duplicateList.innerHTML = `<div class="notice">No duplicate groups found.</div>`;
    return;
  }

  elements.duplicateList.innerHTML = groups
    .slice(0, 8)
    .map((group) => {
      const assets = group.assetIds.map((id) => assetsById.get(id)).filter(Boolean);
      return `
        <article class="duplicate-group">
          <div>
            <strong>${group.count} matching files</strong>
            <span>${formatBytes(group.reclaimableBytes)} reclaimable</span>
          </div>
          <ul>
            ${assets.map((asset) => `<li>${escapeHtml(asset.relativePath)} <span>${escapeHtml(asset.rootName)}</span></li>`).join("")}
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
    <div><strong>${view.filteredSummary.sources}</strong><span>sources shown</span></div>
    <div><strong>${view.filteredSummary.extensions}</strong><span>types shown</span></div>
  `;
  elements.emptyState.hidden = view.assets.length > 0;
  elements.gallery.innerHTML = view.assets.map((asset) => renderAssetCard(asset, view.duplicateAssetIds.has(asset.id))).join("");
}

function renderAssetCard(asset, isDuplicate) {
  const dimensions = asset.width && asset.height ? `${asset.width} x ${asset.height}` : "Unknown size";
  const duplicateBadge = isDuplicate ? `<span class="badge duplicate">Duplicate</span>` : "";
  return `
    <article class="asset-card">
      <a class="asset-preview" href="/assets/${encodeURIComponent(asset.id)}" target="_blank" rel="noreferrer">
        <img loading="lazy" src="/assets/${encodeURIComponent(asset.id)}" alt="${escapeHtml(asset.name)}">
      </a>
      <div class="asset-body">
        <div class="asset-title">
          <h3 title="${escapeHtml(asset.name)}">${escapeHtml(asset.name)}</h3>
          ${duplicateBadge}
        </div>
        <p title="${escapeHtml(asset.relativePath)}">${escapeHtml(asset.relativePath)}</p>
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

function showDetails(assetId) {
  const details = createAssetDetails(libraryIndex, assetId);
  if (!details) {
    return;
  }

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

async function copyFromButton(button, value) {
  await navigator.clipboard.writeText(value);
  const originalText = button.textContent;
  button.textContent = "Copied";
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
