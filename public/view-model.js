export function createLibraryView(index, state = {}) {
  const assets = Array.isArray(index.assets) ? index.assets : [];
  const duplicateAssetIds = new Set((index.duplicates ?? []).flatMap((group) => group.assetIds ?? []));
  const normalizedState = {
    query: "",
    root: "all",
    extension: "all",
    duplicateOnly: false,
    sort: "newest",
    ...state
  };

  const filteredAssets = assets
    .filter((asset) => matchesSearch(asset, normalizedState.query))
    .filter((asset) => normalizedState.root === "all" || asset.rootName === normalizedState.root)
    .filter((asset) => normalizedState.extension === "all" || asset.extension === normalizedState.extension)
    .filter((asset) => !normalizedState.duplicateOnly || duplicateAssetIds.has(asset.id));

  return {
    assets: sortAssets(filteredAssets, normalizedState.sort),
    roots: uniqueSorted(assets.map((asset) => asset.rootName)),
    extensions: uniqueSorted(assets.map((asset) => asset.extension)),
    sourceBreakdown: createBreakdown(assets, "rootName"),
    extensionBreakdown: createBreakdown(assets, "extension"),
    duplicateAssetIds
  };
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
