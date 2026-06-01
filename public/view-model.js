export function createDefaultViewState() {
  return {
    query: "",
    root: "all",
    extension: "all",
    orientation: "all",
    maxAgeDays: "all",
    mark: "all",
    tag: "all",
    note: "all",
    duplicateOnly: false,
    sort: "newest"
  };
}

export function createSavedFilterView(name, state = {}, options = {}) {
  const createdAt = options.createdAt ?? new Date().toISOString();
  const viewName = String(name ?? "").trim() || "Saved view";

  return {
    id: options.id ?? createSavedFilterViewId(createdAt, viewName),
    name: viewName,
    createdAt,
    state: createFilterStateSnapshot(state)
  };
}

export function normalizeSavedFilterViews(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((view) => view && typeof view.id === "string" && view.id.trim())
    .map((view) => ({
      id: view.id,
      name: String(view.name ?? "Saved view").trim() || "Saved view",
      createdAt: typeof view.createdAt === "string" ? view.createdAt : "",
      state: createFilterStateSnapshot(view.state)
    }));
}

export function applyMarkBatch(options = {}, assetIds = [], action) {
  const saved = new Set(uniqueStrings([...toAssetIdSet(options.savedAssetIds)]));
  const review = new Set(uniqueStrings([...toAssetIdSet(options.reviewAssetIds)]));
  const selectedIds = uniqueStrings([...toAssetIdSet(assetIds)]);

  if (action === "save") {
    for (const assetId of selectedIds) {
      saved.add(assetId);
    }
  } else if (action === "review") {
    for (const assetId of selectedIds) {
      review.add(assetId);
    }
  } else if (action === "clear") {
    for (const assetId of selectedIds) {
      saved.delete(assetId);
      review.delete(assetId);
    }
  } else {
    throw new Error(`Unsupported mark batch action: ${action}`);
  }

  return {
    saved: [...saved],
    review: [...review]
  };
}

export function applyTagBatch(assetTags = {}, assetIds = [], tag, action) {
  const updatedTags = normalizeAssetTags(assetTags);
  const selectedIds = uniqueStrings([...toAssetIdSet(assetIds)]);
  const normalizedTag = normalizeTag(tag);

  if (action !== "add" && action !== "remove") {
    throw new Error(`Unsupported tag batch action: ${action}`);
  }
  if (!normalizedTag) {
    return updatedTags;
  }

  for (const assetId of selectedIds) {
    const tags = new Set(updatedTags[assetId] ?? []);
    if (action === "add") {
      tags.add(normalizedTag);
    } else {
      tags.delete(normalizedTag);
    }

    const nextTags = [...tags];
    if (nextTags.length) {
      updatedTags[assetId] = nextTags;
    } else {
      delete updatedTags[assetId];
    }
  }

  return updatedTags;
}

export function getAllAssetTags(assetTags = {}) {
  return uniqueSorted(Object.values(normalizeAssetTags(assetTags)).flat());
}

export function getAssetTags(assetTags = {}, assetId) {
  return normalizeAssetTags(assetTags)[assetId] ?? [];
}

export function setAssetNote(assetNotes = {}, assetId, note) {
  const updatedNotes = normalizeAssetNotes(assetNotes);
  const normalizedId = String(assetId ?? "").trim();
  const normalizedNote = String(note ?? "").trim();

  if (!normalizedId) {
    return updatedNotes;
  }
  if (normalizedNote) {
    updatedNotes[normalizedId] = normalizedNote;
  } else {
    delete updatedNotes[normalizedId];
  }
  return updatedNotes;
}

export function getAssetNote(assetNotes = {}, assetId) {
  const normalizedId = String(assetId ?? "").trim();
  if (!normalizedId) {
    return "";
  }
  return normalizeAssetNotes(assetNotes)[normalizedId] ?? "";
}

export function createActiveFilterChips(state = {}) {
  const defaults = createDefaultViewState();
  const normalizedState = { ...defaults, ...state };
  const chips = [];
  const query = String(normalizedState.query ?? "").trim();

  if (query) {
    chips.push({ key: "query", label: "Search", value: query });
  }
  if (normalizedState.root !== defaults.root) {
    chips.push({ key: "root", label: "Source", value: normalizedState.root });
  }
  if (normalizedState.extension !== defaults.extension) {
    chips.push({ key: "extension", label: "Type", value: formatExtensionLabel(normalizedState.extension) });
  }
  if (normalizedState.orientation !== defaults.orientation) {
    chips.push({
      key: "orientation",
      label: "Orientation",
      value: formatChoiceLabel(normalizedState.orientation)
    });
  }
  if (normalizedState.maxAgeDays !== defaults.maxAgeDays) {
    chips.push({
      key: "maxAgeDays",
      label: "Age",
      value: `Last ${normalizedState.maxAgeDays} days`
    });
  }
  if (normalizedState.mark !== defaults.mark) {
    chips.push({
      key: "mark",
      label: "Mark",
      value: formatMarkLabel(normalizedState.mark)
    });
  }
  if (normalizedState.tag !== defaults.tag) {
    chips.push({ key: "tag", label: "Tag", value: normalizedState.tag });
  }
  if (normalizedState.note !== defaults.note) {
    chips.push({ key: "note", label: "Notes", value: formatNoteFilterLabel(normalizedState.note) });
  }
  if (normalizedState.duplicateOnly !== defaults.duplicateOnly) {
    chips.push({ key: "duplicateOnly", label: "Duplicates", value: "Only duplicates" });
  }
  if (normalizedState.sort !== defaults.sort) {
    chips.push({ key: "sort", label: "Sort", value: formatChoiceLabel(normalizedState.sort) });
  }

  return chips;
}

export function createLibraryView(index, state = {}) {
  const assets = Array.isArray(index.assets) ? index.assets : [];
  const duplicateAssetIds = new Set((index.duplicates ?? []).flatMap((group) => group.assetIds ?? []));
  const normalizedState = {
    now: new Date().toISOString(),
    ...createDefaultViewState(),
    ...state
  };
  const savedAssetIds = toAssetIdSet(normalizedState.savedAssetIds);
  const reviewAssetIds = toAssetIdSet(normalizedState.reviewAssetIds);
  const assetTags = normalizeAssetTags(normalizedState.assetTags);
  const assetNotes = normalizeAssetNotes(normalizedState.assetNotes);

  const filteredAssets = assets
    .filter((asset) => matchesSearch(asset, normalizedState.query, assetNotes))
    .filter((asset) => normalizedState.root === "all" || asset.rootName === normalizedState.root)
    .filter((asset) => normalizedState.extension === "all" || asset.extension === normalizedState.extension)
    .filter((asset) => normalizedState.orientation === "all" || getOrientation(asset) === normalizedState.orientation)
    .filter((asset) => isWithinAge(asset, normalizedState.maxAgeDays, normalizedState.now))
    .filter((asset) => matchesMark(asset, normalizedState.mark, savedAssetIds, reviewAssetIds))
    .filter((asset) => matchesTag(asset, normalizedState.tag, assetTags))
    .filter((asset) => matchesNote(asset, normalizedState.note, assetNotes))
    .filter((asset) => !normalizedState.duplicateOnly || duplicateAssetIds.has(asset.id));

  return {
    assets: sortAssets(filteredAssets, normalizedState.sort),
    filteredSummary: summarizeAssets(filteredAssets, duplicateAssetIds, savedAssetIds, reviewAssetIds, assetTags, assetNotes),
    roots: uniqueSorted(assets.map((asset) => asset.rootName)),
    extensions: uniqueSorted(assets.map((asset) => asset.extension)),
    tags: getAllAssetTags(assetTags),
    sourceBreakdown: createBreakdown(assets, "rootName"),
    extensionBreakdown: createBreakdown(assets, "extension"),
    duplicateAssetIds
  };
}

function isWithinAge(asset, maxAgeDays, now) {
  if (maxAgeDays === "all") {
    return true;
  }

  const days = Number.parseInt(maxAgeDays, 10);
  const modified = Date.parse(asset.modifiedAt);
  const current = Date.parse(now);
  if (!Number.isFinite(days) || Number.isNaN(modified) || Number.isNaN(current)) {
    return false;
  }

  return current - modified <= days * 24 * 60 * 60 * 1000;
}

export function getOrientation(asset) {
  if (!asset.width || !asset.height) {
    return "unknown";
  }
  if (asset.width === asset.height) {
    return "square";
  }
  return asset.width > asset.height ? "landscape" : "portrait";
}

export function createAssetDetails(index, assetId) {
  const asset = (index.assets ?? []).find((candidate) => candidate.id === assetId);
  if (!asset) {
    return null;
  }

  const duplicateGroup = (index.duplicates ?? []).find((group) => (group.assetIds ?? []).includes(assetId));
  const dimensions = asset.width && asset.height ? `${asset.width} x ${asset.height}` : "Unknown";

  return {
    id: asset.id,
    name: asset.name,
    imageUrl: `/assets/${encodeURIComponent(asset.id)}`,
    path: asset.path,
    hash: asset.hash,
    size: formatBytes(asset.sizeBytes),
    dimensions,
    modified: formatDate(asset.modifiedAt),
    isDuplicate: Boolean(duplicateGroup),
    duplicateGroup: duplicateGroup
      ? {
          count: duplicateGroup.count,
          reclaimable: formatBytes(duplicateGroup.reclaimableBytes ?? 0),
          hash: duplicateGroup.hash
        }
      : null,
    fields: [
      { label: "Source", value: asset.rootName },
      { label: "Type", value: asset.extension?.replace(".", "").toUpperCase() ?? "Unknown" },
      { label: "Size", value: formatBytes(asset.sizeBytes) },
      { label: "Dimensions", value: dimensions },
      { label: "Modified", value: formatDate(asset.modifiedAt) },
      { label: "Hash", value: asset.hash ?? "Unknown", copyValue: asset.hash },
      { label: "Path", value: asset.path ?? "Unknown", copyValue: asset.path }
    ]
  };
}

export function createDuplicateGroupDetails(index, group) {
  const assetsById = new Map((index?.assets ?? []).map((asset) => [asset.id, asset]));
  const assets = (group?.assetIds ?? []).map((assetId) => assetsById.get(assetId)).filter(Boolean);
  const recommendedKeepAsset = [...assets].sort(compareDuplicateKeepCandidate)[0] ?? null;
  const cleanupCandidateAssets = recommendedKeepAsset
    ? assets.filter((asset) => asset.id !== recommendedKeepAsset.id)
    : [];

  return {
    count: group?.count ?? assets.length,
    reclaimable: formatBytes(group?.reclaimableBytes ?? 0),
    hash: group?.hash,
    assets,
    recommendedKeepAsset,
    cleanupCandidateAssets,
    pathList: createPathList(assets),
    cleanupPathList: createPathList(cleanupCandidateAssets)
  };
}

export function createWorkflowReport(index, options = {}) {
  const assets = Array.isArray(index?.assets) ? index.assets : [];
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
  const duplicateAssetIds = new Set((index?.duplicates ?? []).flatMap((group) => group.assetIds ?? []));
  const selectedAssetIds = toAssetIdSet(options.selectedAssetIds);
  const savedAssetIds = toAssetIdSet(options.savedAssetIds);
  const reviewAssetIds = toAssetIdSet(options.reviewAssetIds);
  const lines = [
    "# Image Asset Workflow Report",
    "",
    `Generated: ${options.generatedAt ?? new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Total assets: ${assets.length}`,
    `- Selected: ${selectedAssetIds.size}`,
    `- Saved: ${savedAssetIds.size}`,
    `- Review queue: ${reviewAssetIds.size}`,
    "",
    ...renderReportSection("Selected Assets", selectedAssetIds, assetsById, duplicateAssetIds),
    ...renderReportSection("Saved Assets", savedAssetIds, assetsById, duplicateAssetIds),
    ...renderReportSection("Review Queue", reviewAssetIds, assetsById, duplicateAssetIds)
  ];

  return lines.join("\n");
}

export function createMarkBackup(options = {}) {
  return `${JSON.stringify({
    schema: "image-asset-librarian-marks-v1",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    saved: [...toAssetIdSet(options.savedAssetIds)],
    review: [...toAssetIdSet(options.reviewAssetIds)]
  }, null, 2)}\n`;
}

export function createCurationBackup(options = {}) {
  return `${JSON.stringify({
    schema: "image-asset-librarian-curation-v1",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    marks: {
      saved: [...toAssetIdSet(options.savedAssetIds)],
      review: [...toAssetIdSet(options.reviewAssetIds)]
    },
    assetTags: normalizeAssetTags(options.assetTags),
    assetNotes: normalizeAssetNotes(options.assetNotes),
    savedFilterViews: normalizeSavedFilterViews(options.savedFilterViews)
  }, null, 2)}\n`;
}

export function parseMarkBackup(value) {
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("Mark backup must be valid JSON.");
  }

  if (!Array.isArray(parsed.saved) || !Array.isArray(parsed.review)) {
    throw new Error("Mark backup must include saved and review arrays.");
  }

  return {
    saved: uniqueStrings(parsed.saved),
    review: uniqueStrings(parsed.review)
  };
}

export function parseCurationBackup(value) {
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("Curation backup must be valid JSON.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || parsed.schema !== "image-asset-librarian-curation-v1") {
    throw new Error("Unsupported curation backup schema.");
  }

  const marks = parsed.marks && typeof parsed.marks === "object" && !Array.isArray(parsed.marks)
    ? parsed.marks
    : {};

  return {
    saved: uniqueStrings(Array.isArray(marks.saved) ? marks.saved : []),
    review: uniqueStrings(Array.isArray(marks.review) ? marks.review : []),
    assetTags: normalizeAssetTags(parsed.assetTags),
    assetNotes: normalizeAssetNotes(parsed.assetNotes),
    savedFilterViews: normalizeSavedFilterViews(parsed.savedFilterViews)
  };
}

export function createPathList(assets) {
  return assets
    .map((asset) => asset.path ?? asset.relativePath)
    .filter(Boolean)
    .join("\n");
}

export function createAssetCsv(assets) {
  const columns = [
    ["id", (asset) => asset.id],
    ["name", (asset) => asset.name],
    ["source", (asset) => asset.rootName],
    ["type", (asset) => asset.extension],
    ["sizeBytes", (asset) => asset.sizeBytes],
    ["width", (asset) => asset.width],
    ["height", (asset) => asset.height],
    ["modifiedAt", (asset) => asset.modifiedAt],
    ["relativePath", (asset) => asset.relativePath],
    ["path", (asset) => asset.path],
    ["hash", (asset) => asset.hash]
  ];
  const rows = [columns.map(([header]) => header).join(",")];

  for (const asset of Array.isArray(assets) ? assets : []) {
    rows.push(columns.map(([, getValue]) => formatCsvCell(getValue(asset))).join(","));
  }

  return `${rows.join("\n")}\n`;
}

export function createAssetManifest(assets, options = {}) {
  const manifestAssets = (Array.isArray(assets) ? assets : []).map((asset) => ({
    id: asset.id ?? null,
    name: asset.name ?? null,
    source: asset.rootName ?? null,
    type: asset.extension ?? null,
    sizeBytes: Number.isFinite(asset.sizeBytes) ? asset.sizeBytes : null,
    width: Number.isFinite(asset.width) ? asset.width : null,
    height: Number.isFinite(asset.height) ? asset.height : null,
    modifiedAt: asset.modifiedAt ?? null,
    relativePath: asset.relativePath ?? null,
    path: asset.path ?? null,
    hash: asset.hash ?? null
  }));

  return `${JSON.stringify({
    schema: "image-asset-librarian-manifest-v1",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    label: String(options.label ?? "assets"),
    count: manifestAssets.length,
    assets: manifestAssets
  }, null, 2)}\n`;
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const formatted = value >= 10 || unitIndex === 0 ? Math.round(value).toString() : value.toFixed(1).replace(/\.0$/, "");
  return `${formatted} ${units[unitIndex]}`;
}

export function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function matchesSearch(asset, query, assetNotes = {}) {
  const normalizedQuery = String(query ?? "").trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    asset.name,
    asset.relativePath,
    asset.rootName,
    asset.extension,
    assetNotes[asset.id]
  ].join(" ").toLowerCase();

  return normalizedQuery.split(/\s+/).every((term) => haystack.includes(term));
}

function matchesMark(asset, mark, savedAssetIds, reviewAssetIds) {
  if (mark === "saved") {
    return savedAssetIds.has(asset.id);
  }
  if (mark === "review") {
    return reviewAssetIds.has(asset.id);
  }
  if (mark === "unmarked") {
    return !savedAssetIds.has(asset.id) && !reviewAssetIds.has(asset.id);
  }
  return true;
}

function matchesTag(asset, tag, assetTags) {
  if (tag === "all") {
    return true;
  }
  return (assetTags[asset.id] ?? []).includes(tag);
}

function matchesNote(asset, note, assetNotes) {
  if (note === "with-notes") {
    return Boolean(assetNotes[asset.id]);
  }
  if (note === "without-notes") {
    return !assetNotes[asset.id];
  }
  return true;
}

function compareDuplicateKeepCandidate(a, b) {
  const byDate = Date.parse(a.modifiedAt) - Date.parse(b.modifiedAt);
  if (Number.isFinite(byDate) && byDate !== 0) {
    return byDate;
  }
  return (a.relativePath ?? a.name ?? "").localeCompare(b.relativePath ?? b.name ?? "");
}

function sortAssets(assets, sort) {
  const sorted = [...assets];
  const byName = (a, b) => a.name.localeCompare(b.name);

  if (sort === "oldest") {
    return sorted.sort((a, b) => Date.parse(a.modifiedAt) - Date.parse(b.modifiedAt) || byName(a, b));
  }
  if (sort === "largest") {
    return sorted.sort((a, b) => b.sizeBytes - a.sizeBytes);
  }
  if (sort === "smallest") {
    return sorted.sort((a, b) => a.sizeBytes - b.sizeBytes);
  }
  if (sort === "name") {
    return sorted.sort(byName);
  }

  return sorted.sort((a, b) => Date.parse(b.modifiedAt) - Date.parse(a.modifiedAt) || byName(a, b));
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function createBreakdown(assets, field) {
  const counts = new Map();
  for (const asset of assets) {
    const label = asset[field];
    if (!label) {
      continue;
    }
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function createFilterStateSnapshot(state = {}) {
  const defaults = createDefaultViewState();
  const normalizedState = { ...defaults, ...(state ?? {}) };

  return Object.fromEntries(
    Object.keys(defaults).map((key) => [
      key,
      key === "duplicateOnly" ? normalizedState[key] === true : String(normalizedState[key] ?? defaults[key])
    ])
  );
}

function normalizeAssetTags(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([assetId, tags]) => [assetId, uniqueStrings((Array.isArray(tags) ? tags : []).map(normalizeTag))])
      .filter(([assetId, tags]) => typeof assetId === "string" && assetId.trim() && tags.length)
  );
}

function normalizeAssetNotes(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([assetId, note]) => [String(assetId ?? "").trim(), typeof note === "string" ? note.trim() : ""])
      .filter(([assetId, note]) => assetId && note)
  );
}

function normalizeTag(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function createSavedFilterViewId(createdAt, name) {
  const safeName = String(name ?? "view")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36) || "view";
  return `view-${Date.parse(createdAt) || Date.now()}-${safeName}`;
}

function formatExtensionLabel(extension) {
  return String(extension ?? "Unknown").replace(".", "").toUpperCase();
}

function formatChoiceLabel(value) {
  return String(value ?? "Unknown")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatMarkLabel(value) {
  if (value === "review") {
    return "Review queue";
  }
  return formatChoiceLabel(value);
}

function formatNoteFilterLabel(value) {
  if (value === "with-notes") {
    return "With notes";
  }
  if (value === "without-notes") {
    return "Without notes";
  }
  return formatChoiceLabel(value);
}

function formatCsvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function summarizeAssets(assets, duplicateAssetIds, savedAssetIds, reviewAssetIds, assetTags = {}, assetNotes = {}) {
  return {
    totalAssets: assets.length,
    totalBytes: assets.reduce((sum, asset) => sum + asset.sizeBytes, 0),
    duplicateAssets: assets.filter((asset) => duplicateAssetIds.has(asset.id)).length,
    savedAssets: assets.filter((asset) => savedAssetIds.has(asset.id)).length,
    reviewAssets: assets.filter((asset) => reviewAssetIds.has(asset.id)).length,
    taggedAssets: assets.filter((asset) => (assetTags[asset.id] ?? []).length).length,
    notedAssets: assets.filter((asset) => assetNotes[asset.id]).length,
    sources: new Set(assets.map((asset) => asset.rootName).filter(Boolean)).size,
    extensions: new Set(assets.map((asset) => asset.extension).filter(Boolean)).size
  };
}

function renderReportSection(title, assetIds, assetsById, duplicateAssetIds) {
  const assets = [...assetIds].map((assetId) => assetsById.get(assetId)).filter(Boolean);
  const lines = [`## ${title}`, ""];
  if (!assets.length) {
    lines.push("No assets.", "");
    return lines;
  }

  for (const asset of assets) {
    const duplicateLabel = duplicateAssetIds.has(asset.id) ? ", duplicate" : "";
    lines.push(`- \`${asset.relativePath}\` (${asset.rootName}, ${formatBytes(asset.sizeBytes)}${duplicateLabel})`);
    if (asset.path) {
      lines.push(`  - Path: \`${asset.path}\``);
    }
  }
  lines.push("");
  return lines;
}

function toAssetIdSet(value) {
  if (value instanceof Set) {
    return value;
  }
  if (Array.isArray(value)) {
    return new Set(value);
  }
  return new Set();
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.trim()))];
}
