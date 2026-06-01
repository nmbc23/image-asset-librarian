export function createDefaultViewState() {
  return {
    query: "",
    root: "all",
    extension: "all",
    orientation: "all",
    maxAgeDays: "all",
    mark: "all",
    duplicateOnly: false,
    sort: "newest"
  };
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

  const filteredAssets = assets
    .filter((asset) => matchesSearch(asset, normalizedState.query))
    .filter((asset) => normalizedState.root === "all" || asset.rootName === normalizedState.root)
    .filter((asset) => normalizedState.extension === "all" || asset.extension === normalizedState.extension)
    .filter((asset) => normalizedState.orientation === "all" || getOrientation(asset) === normalizedState.orientation)
    .filter((asset) => isWithinAge(asset, normalizedState.maxAgeDays, normalizedState.now))
    .filter((asset) => matchesMark(asset, normalizedState.mark, savedAssetIds, reviewAssetIds))
    .filter((asset) => !normalizedState.duplicateOnly || duplicateAssetIds.has(asset.id));

  return {
    assets: sortAssets(filteredAssets, normalizedState.sort),
    filteredSummary: summarizeAssets(filteredAssets, duplicateAssetIds, savedAssetIds, reviewAssetIds),
    roots: uniqueSorted(assets.map((asset) => asset.rootName)),
    extensions: uniqueSorted(assets.map((asset) => asset.extension)),
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

export function createPathList(assets) {
  return assets
    .map((asset) => asset.path ?? asset.relativePath)
    .filter(Boolean)
    .join("\n");
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

function matchesSearch(asset, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    asset.name,
    asset.relativePath,
    asset.rootName,
    asset.extension
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

function summarizeAssets(assets, duplicateAssetIds, savedAssetIds, reviewAssetIds) {
  return {
    totalAssets: assets.length,
    totalBytes: assets.reduce((sum, asset) => sum + asset.sizeBytes, 0),
    duplicateAssets: assets.filter((asset) => duplicateAssetIds.has(asset.id)).length,
    savedAssets: assets.filter((asset) => savedAssetIds.has(asset.id)).length,
    reviewAssets: assets.filter((asset) => reviewAssetIds.has(asset.id)).length,
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
