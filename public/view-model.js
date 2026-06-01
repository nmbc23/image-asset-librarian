export function createDefaultViewState() {
  return {
    query: "",
    root: "all",
    extension: "all",
    orientation: "all",
    resolution: "all",
    theme: "all",
    colorTheme: "all",
    maxAgeDays: "all",
    mark: "all",
    tag: "all",
    note: "all",
    issue: "all",
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

const RESOLUTION_BUCKETS = [
  { value: "huge", label: "Huge 8 MP+" },
  { value: "large", label: "Large 2-8 MP" },
  { value: "standard", label: "Standard 0.5-2 MP" },
  { value: "tiny", label: "Tiny < 0.5 MP" },
  { value: "missing", label: "Missing dimensions" }
];

const ISSUE_FILTERS = [
  { value: "duplicate", label: "Duplicate" },
  { value: "missing-dimensions", label: "Missing dimensions" },
  { value: "tiny-resolution", label: "Tiny resolution" }
];

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

export function getAllAssetThemes(assets = []) {
  return uniqueSorted((Array.isArray(assets) ? assets : []).flatMap(getAssetThemes));
}

export function getAssetThemes(asset = {}) {
  return uniqueStrings((Array.isArray(asset.themes) ? asset.themes : []).map(normalizeTheme));
}

export function getAllAssetColorThemes(assets = []) {
  return uniqueSorted((Array.isArray(assets) ? assets : []).flatMap(getAssetColorThemes));
}

export function getAssetColorThemes(asset = {}) {
  return uniqueStrings((Array.isArray(asset.colorThemes) ? asset.colorThemes : []).map(normalizeColorTheme));
}

export function getAssetPalette(asset = {}) {
  return uniqueStrings((Array.isArray(asset.palette) ? asset.palette : []).map(normalizePaletteColor));
}

export function getAssetMetadataEntries(asset = {}) {
  const metadata = normalizeEmbeddedMetadata(asset.metadata);
  const entries = [];

  if (metadata.title) {
    entries.push({ label: "Title", value: metadata.title });
  }
  if (metadata.description) {
    entries.push({ label: "Description", value: metadata.description });
  }

  for (const entry of metadata.text) {
    entries.push({
      label: entry.key || "Text",
      value: entry.value
    });
  }

  return entries;
}

export function getAssetIssues(asset = {}, duplicateAssetIds = new Set()) {
  const duplicateIds = toAssetIdSet(duplicateAssetIds);
  const resolutionBucket = getResolutionBucket(asset);
  const issues = [];

  if (duplicateIds.has(asset.id)) {
    issues.push(getIssueFilter("duplicate"));
  }
  if (resolutionBucket === "missing") {
    issues.push(getIssueFilter("missing-dimensions"));
  } else if (resolutionBucket === "tiny") {
    issues.push(getIssueFilter("tiny-resolution"));
  }

  return issues.filter(Boolean);
}

export function createAssetDescription(asset = {}) {
  const themes = getAssetThemes(asset);
  const orientation = getOrientation(asset);
  const semanticThemes = themes.filter((theme) => !["portrait", "landscape", "square", "vector"].includes(theme));
  const subjectParts = [];

  if (orientation !== "unknown") {
    subjectParts.push(orientation);
  }
  if (semanticThemes[0]) {
    subjectParts.push(semanticThemes[0]);
  }
  if (themes.includes("vector")) {
    subjectParts.push("vector");
  }

  const subject = uniqueStrings(subjectParts).join(" ") || "visual asset";
  const colorThemes = getDescriptionColorThemes(asset);
  const colorPhrase = colorThemes.length ? `${colorThemes.join(", ")} colors` : "an uncategorized color style";
  const paletteNames = uniqueStrings(getAssetPalette(asset).slice(0, 2).map(getPaletteColorName));
  const palettePhrase = paletteNames.length ? ` and a ${paletteNames.join(", ")} palette` : "";
  const metadataHint = getDescriptionMetadataHint(asset);
  const metadataPhrase = metadataHint ? ` Metadata suggests: ${metadataHint}.` : "";

  return `A ${subject} image with ${colorPhrase}${palettePhrase}.${metadataPhrase}`;
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
  if (normalizedState.resolution !== defaults.resolution) {
    chips.push({
      key: "resolution",
      label: "Resolution",
      value: formatResolutionLabel(normalizedState.resolution)
    });
  }
  if (normalizedState.theme !== defaults.theme) {
    chips.push({ key: "theme", label: "Theme", value: normalizedState.theme });
  }
  if (normalizedState.colorTheme !== defaults.colorTheme) {
    chips.push({ key: "colorTheme", label: "Color vibe", value: normalizedState.colorTheme });
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
  if (normalizedState.issue !== defaults.issue) {
    chips.push({ key: "issue", label: "Issue", value: formatIssueLabel(normalizedState.issue) });
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
    .filter((asset) => matchesResolution(asset, normalizedState.resolution))
    .filter((asset) => matchesTheme(asset, normalizedState.theme))
    .filter((asset) => matchesColorTheme(asset, normalizedState.colorTheme))
    .filter((asset) => isWithinAge(asset, normalizedState.maxAgeDays, normalizedState.now))
    .filter((asset) => matchesMark(asset, normalizedState.mark, savedAssetIds, reviewAssetIds))
    .filter((asset) => matchesTag(asset, normalizedState.tag, assetTags))
    .filter((asset) => matchesNote(asset, normalizedState.note, assetNotes))
    .filter((asset) => matchesIssue(asset, normalizedState.issue, duplicateAssetIds))
    .filter((asset) => !normalizedState.duplicateOnly || duplicateAssetIds.has(asset.id));

  return {
    assets: sortAssets(filteredAssets, normalizedState.sort),
    filteredSummary: summarizeAssets(filteredAssets, duplicateAssetIds, savedAssetIds, reviewAssetIds, assetTags, assetNotes),
    roots: uniqueSorted(assets.map((asset) => asset.rootName)),
    extensions: uniqueSorted(assets.map((asset) => asset.extension)),
    themes: getAllAssetThemes(assets),
    colorThemes: getAllAssetColorThemes(assets),
    tags: getAllAssetTags(assetTags),
    sourceBreakdown: createBreakdown(assets, "rootName"),
    extensionBreakdown: createBreakdown(assets, "extension"),
    resolutionBreakdown: createResolutionBreakdown(assets),
    issueBreakdown: createIssueBreakdown(assets, duplicateAssetIds),
    themeBreakdown: createThemeBreakdown(assets),
    colorThemeBreakdown: createColorThemeBreakdown(assets),
    similarGroups: Array.isArray(index.similarGroups) ? index.similarGroups : [],
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
  const themes = getAssetThemes(asset);
  const themeLabel = themes.length ? themes.join(", ") : "Uncategorized";
  const colorThemes = getAssetColorThemes(asset);
  const colorThemeLabel = colorThemes.length ? colorThemes.join(", ") : "Uncategorized";
  const palette = getAssetPalette(asset);
  const paletteLabel = palette.length ? palette.join(", ") : "Unavailable";
  const metadataEntries = getAssetMetadataEntries(asset);
  const metadataSummary = formatAssetMetadata(asset);
  const description = createAssetDescription(asset);

  return {
    id: asset.id,
    name: asset.name,
    imageUrl: `/assets/${encodeURIComponent(asset.id)}`,
    path: asset.path,
    hash: asset.hash,
    size: formatBytes(asset.sizeBytes),
    dimensions,
    palette,
    description,
    metadataEntries,
    metadataSummary,
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
      { label: "Themes", value: themeLabel },
      { label: "Color vibes", value: colorThemeLabel },
      { label: "Palette", value: paletteLabel },
      { label: "Metadata", value: metadataSummary || "Unavailable", copyValue: metadataSummary },
      { label: "Modified", value: formatDate(asset.modifiedAt) },
      { label: "Hash", value: asset.hash ?? "Unknown", copyValue: asset.hash },
      { label: "Path", value: asset.path ?? "Unknown", copyValue: asset.path }
    ]
  };
}

export function createAssetNavigation(assets = [], assetId) {
  const visibleAssets = Array.isArray(assets) ? assets : [];
  const index = visibleAssets.findIndex((asset) => asset.id === assetId);
  const previousAssetId = index > 0 ? visibleAssets[index - 1].id : null;
  const nextAssetId = index >= 0 && index < visibleAssets.length - 1 ? visibleAssets[index + 1].id : null;

  return {
    index,
    total: visibleAssets.length,
    previousAssetId,
    nextAssetId,
    hasPrevious: Boolean(previousAssetId),
    hasNext: Boolean(nextAssetId)
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

export function createSimilarGroupDetails(index, group) {
  const assetsById = new Map((index?.assets ?? []).map((asset) => [asset.id, asset]));
  const assets = (group?.assetIds ?? []).map((assetId) => assetsById.get(assetId)).filter(Boolean);

  return {
    signature: group?.signature ?? "",
    label: group?.label ?? "Similar assets",
    query: group?.query ?? "",
    count: group?.count ?? assets.length,
    assets,
    pathList: createPathList(assets)
  };
}

export function createWorkflowReport(index, options = {}) {
  const assets = Array.isArray(index?.assets) ? index.assets : [];
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
  const duplicateAssetIds = new Set((index?.duplicates ?? []).flatMap((group) => group.assetIds ?? []));
  const selectedAssetIds = toAssetIdSet(options.selectedAssetIds);
  const savedAssetIds = toAssetIdSet(options.savedAssetIds);
  const reviewAssetIds = toAssetIdSet(options.reviewAssetIds);
  const assetTags = normalizeAssetTags(options.assetTags);
  const assetNotes = normalizeAssetNotes(options.assetNotes);
  const reportContext = {
    duplicateAssetIds,
    assetTags,
    assetNotes
  };
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
    ...renderReportSection("Selected Assets", selectedAssetIds, assetsById, reportContext),
    ...renderReportSection("Saved Assets", savedAssetIds, assetsById, reportContext),
    ...renderReportSection("Review Queue", reviewAssetIds, assetsById, reportContext)
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

export function createExportFileName(label, extension, options = {}) {
  const safeLabel = String(label ?? "export")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "export";
  const safeExtension = String(extension ?? "txt")
    .trim()
    .replace(/^\./, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase() || "txt";
  return `image-asset-librarian-${safeLabel}-${formatExportTimestamp(options.generatedAt)}.${safeExtension}`;
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

export function createAssetDescriptionList(assets) {
  const lines = (Array.isArray(assets) ? assets : []).map((asset) => {
    const name = asset.name ?? asset.relativePath ?? asset.id ?? "Asset";
    return `- **${escapeMarkdownText(name)}**: ${createAssetDescription(asset)}`;
  });
  return `${lines.join("\n")}${lines.length ? "\n" : ""}`;
}

export function createAssetContactSheet(assets, options = {}) {
  const sheetAssets = Array.isArray(assets) ? assets : [];
  const lines = [
    "# Image Asset Contact Sheet",
    "",
    `Generated: ${options.generatedAt ?? new Date().toISOString()}`,
    `Count: ${sheetAssets.length}`,
    "",
    "| Preview | Asset | Description | Details |",
    "| --- | --- | --- | --- |"
  ];

  for (const asset of sheetAssets) {
    const name = asset.name ?? asset.relativePath ?? asset.id ?? "Asset";
    const path = asset.relativePath ?? asset.path ?? asset.id ?? "";
    const dimensions = formatContactSheetDimensions(asset);
    const details = [asset.rootName, asset.extension, dimensions, formatBytes(asset.sizeBytes)]
      .filter(Boolean)
      .map(escapeMarkdownTableText)
      .join(" · ");

    const cells = [
      `![${escapeMarkdownImageAlt(name)}](${createAssetContactSheetUrl(asset, options.assetBaseUrl)})`,
      `**${escapeMarkdownTableText(name)}**${path ? `<br>\`${escapeMarkdownCodeText(path)}\`` : ""}`,
      escapeMarkdownTableText(createAssetDescription(asset)),
      details
    ];
    lines.push(`| ${cells.join(" | ")} |`);
  }

  lines.push("");
  return lines.join("\n");
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
    ["themes", (asset) => getAssetThemes(asset).join("; ")],
    ["colorThemes", (asset) => getAssetColorThemes(asset).join("; ")],
    ["palette", (asset) => getAssetPalette(asset).join("; ")],
    ["description", (asset) => createAssetDescription(asset)],
    ["metadata", (asset) => formatAssetMetadata(asset)],
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
  const savedAssetIds = toAssetIdSet(options.savedAssetIds);
  const reviewAssetIds = toAssetIdSet(options.reviewAssetIds);
  const duplicateAssetIds = toAssetIdSet(options.duplicateAssetIds);
  const assetTags = normalizeAssetTags(options.assetTags);
  const assetNotes = normalizeAssetNotes(options.assetNotes);
  const includeCuration = hasManifestCurationOptions(options);
  const manifestAssets = (Array.isArray(assets) ? assets : []).map((asset) => {
    const manifestAsset = {
      id: asset.id ?? null,
      name: asset.name ?? null,
      source: asset.rootName ?? null,
      type: asset.extension ?? null,
      sizeBytes: Number.isFinite(asset.sizeBytes) ? asset.sizeBytes : null,
      width: Number.isFinite(asset.width) ? asset.width : null,
      height: Number.isFinite(asset.height) ? asset.height : null,
      themes: getAssetThemes(asset),
      colorThemes: getAssetColorThemes(asset),
      palette: getAssetPalette(asset),
      description: createAssetDescription(asset),
      metadata: normalizeEmbeddedMetadata(asset.metadata),
      modifiedAt: asset.modifiedAt ?? null,
      relativePath: asset.relativePath ?? null,
      path: asset.path ?? null,
      hash: asset.hash ?? null
    };

    if (includeCuration) {
      manifestAsset.curation = {
        saved: savedAssetIds.has(asset.id),
        review: reviewAssetIds.has(asset.id),
        tags: assetTags[asset.id] ?? [],
        note: assetNotes[asset.id] ?? "",
        duplicate: duplicateAssetIds.has(asset.id)
      };
    }

    return manifestAsset;
  });

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
    getAssetThemes(asset).join(" "),
    getAssetColorThemes(asset).join(" "),
    getAssetPalette(asset).join(" "),
    createAssetDescription(asset),
    formatAssetMetadata(asset),
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

function matchesTheme(asset, theme) {
  if (theme === "all") {
    return true;
  }
  return getAssetThemes(asset).includes(theme);
}

function matchesColorTheme(asset, colorTheme) {
  if (colorTheme === "all") {
    return true;
  }
  return getAssetColorThemes(asset).includes(colorTheme);
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

function matchesResolution(asset, resolution) {
  if (resolution === "all") {
    return true;
  }
  return getResolutionBucket(asset) === resolution;
}

function matchesIssue(asset, issue, duplicateAssetIds) {
  if (issue === "all") {
    return true;
  }
  const issues = getAssetIssues(asset, duplicateAssetIds).map((assetIssue) => assetIssue.value);
  if (issue === "any") {
    return issues.length > 0;
  }
  return issues.includes(issue);
}

function getResolutionBucket(asset) {
  const width = Number(asset.width);
  const height = Number(asset.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return "missing";
  }

  const pixels = width * height;
  if (pixels < 500_000) {
    return "tiny";
  }
  if (pixels < 2_000_000) {
    return "standard";
  }
  if (pixels < 8_000_000) {
    return "large";
  }
  return "huge";
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
  if (sort === "highest-resolution") {
    return sorted.sort((a, b) => getPixelCount(b) - getPixelCount(a) || byName(a, b));
  }
  if (sort === "lowest-resolution") {
    return sorted.sort((a, b) => getPixelCount(a) - getPixelCount(b) || byName(a, b));
  }
  if (sort === "name") {
    return sorted.sort(byName);
  }

  return sorted.sort((a, b) => Date.parse(b.modifiedAt) - Date.parse(a.modifiedAt) || byName(a, b));
}

function getPixelCount(asset) {
  const width = Number(asset.width);
  const height = Number(asset.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return 0;
  }
  return width * height;
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

function createResolutionBreakdown(assets) {
  const counts = new Map();
  for (const asset of assets) {
    const bucket = getResolutionBucket(asset);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }

  return RESOLUTION_BUCKETS
    .map((bucket) => ({
      ...bucket,
      count: counts.get(bucket.value) ?? 0
    }))
    .filter((bucket) => bucket.count > 0);
}

function createIssueBreakdown(assets, duplicateAssetIds) {
  const counts = new Map();
  for (const asset of assets) {
    for (const issue of getAssetIssues(asset, duplicateAssetIds)) {
      counts.set(issue.value, (counts.get(issue.value) ?? 0) + 1);
    }
  }

  return ISSUE_FILTERS
    .map((issue) => ({
      ...issue,
      count: counts.get(issue.value) ?? 0
    }))
    .filter((issue) => issue.count > 0);
}

function createThemeBreakdown(assets) {
  const counts = new Map();
  for (const asset of assets) {
    for (const theme of getAssetThemes(asset)) {
      counts.set(theme, (counts.get(theme) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function createColorThemeBreakdown(assets) {
  const counts = new Map();
  for (const asset of assets) {
    for (const theme of getAssetColorThemes(asset)) {
      counts.set(theme, (counts.get(theme) ?? 0) + 1);
    }
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

function hasManifestCurationOptions(options) {
  return options.savedAssetIds !== undefined
    || options.reviewAssetIds !== undefined
    || options.assetTags !== undefined
    || options.assetNotes !== undefined
    || options.duplicateAssetIds !== undefined;
}

function normalizeTag(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeTheme(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeColorTheme(value) {
  return normalizeTheme(value);
}

function normalizePaletteColor(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : "";
}

function normalizeEmbeddedMetadata(value) {
  const metadata = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    title: normalizeMetadataText(metadata.title),
    description: normalizeMetadataText(metadata.description),
    text: (Array.isArray(metadata.text) ? metadata.text : [])
      .map((entry) => ({
        key: normalizeMetadataText(entry?.key),
        value: normalizeMetadataText(entry?.value)
      }))
      .filter((entry) => entry.key && entry.value)
  };
}

function formatAssetMetadata(asset) {
  return getAssetMetadataEntries(asset)
    .map((entry) => `${entry.label}: ${entry.value}`)
    .join("; ");
}

function getDescriptionMetadataHint(asset) {
  const metadata = normalizeEmbeddedMetadata(asset.metadata);
  return metadata.description || metadata.title || metadata.text[0]?.value || "";
}

function getDescriptionColorThemes(asset) {
  const themes = getAssetColorThemes(asset);
  const hueThemes = themes.filter((theme) => !["vivid", "muted", "dark", "light", "monochrome"].includes(theme));
  const styleThemes = ["vivid", "muted", "dark", "light", "monochrome"].filter((theme) => themes.includes(theme));
  return uniqueStrings([...hueThemes.slice(0, 2), ...styleThemes.slice(0, 1)]).slice(0, 3);
}

function getPaletteColorName(color) {
  const match = String(color ?? "").match(/^#([0-9a-f]{6})$/i);
  if (!match) {
    return "";
  }

  const rgb = {
    r: Number.parseInt(match[1].slice(0, 2), 16),
    g: Number.parseInt(match[1].slice(2, 4), 16),
    b: Number.parseInt(match[1].slice(4, 6), 16)
  };
  const { hue, saturation, lightness } = rgbToHsl(rgb);

  if (lightness < 0.16) {
    return "black";
  }
  if (lightness > 0.88) {
    return "white";
  }
  if (saturation < 0.1) {
    return lightness < 0.45 ? "gray" : "light gray";
  }
  if (hue < 18) {
    return "red";
  }
  if (hue < 45) {
    return "orange";
  }
  if (hue < 70) {
    return "yellow";
  }
  if (hue < 155) {
    return "green";
  }
  if (hue < 195) {
    return "teal";
  }
  if (hue < 255) {
    return "blue";
  }
  if (hue < 300) {
    return "purple";
  }
  return "rose";
}

function rgbToHsl(color) {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { hue: 0, saturation: 0, lightness };
  }

  const delta = max - min;
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue;

  if (max === r) {
    hue = 60 * (((g - b) / delta) % 6);
  } else if (max === g) {
    hue = 60 * ((b - r) / delta + 2);
  } else {
    hue = 60 * ((r - g) / delta + 4);
  }

  return {
    hue: hue < 0 ? hue + 360 : hue,
    saturation,
    lightness
  };
}

function normalizeMetadataText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function createSavedFilterViewId(createdAt, name) {
  const safeName = String(name ?? "view")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36) || "view";
  return `view-${Date.parse(createdAt) || Date.now()}-${safeName}`;
}

function formatExportTimestamp(value) {
  const date = new Date(value ?? Date.now());
  if (!Number.isFinite(date.getTime())) {
    return "export";
  }

  return date.toISOString()
    .replace(/\.\d{3}Z$/, "Z")
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replace("T", "-")
    .replace("Z", "");
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

function formatResolutionLabel(value) {
  if (value === "missing") {
    return "Missing dimensions";
  }
  return formatChoiceLabel(value);
}

function formatIssueLabel(value) {
  if (value === "any") {
    return "Any issue";
  }
  return getIssueFilter(value)?.label ?? formatChoiceLabel(value);
}

function getIssueFilter(value) {
  return ISSUE_FILTERS.find((issue) => issue.value === value) ?? null;
}

function formatCsvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function escapeMarkdownText(value) {
  return String(value ?? "").replaceAll("\\", "\\\\").replaceAll("*", "\\*").replaceAll("_", "\\_").replaceAll("`", "\\`");
}

function escapeMarkdownTableText(value) {
  return escapeMarkdownText(value).replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
}

function escapeMarkdownCodeText(value) {
  return String(value ?? "").replaceAll("`", "'").replaceAll("|", "\\|").trim();
}

function escapeMarkdownImageAlt(value) {
  return String(value ?? "").replaceAll("[", "(").replaceAll("]", ")").replace(/\s+/g, " ").trim();
}

function formatContactSheetDimensions(asset = {}) {
  return asset.width && asset.height ? `${asset.width}x${asset.height}` : "Unknown dimensions";
}

function createAssetContactSheetUrl(asset = {}, assetBaseUrl = "") {
  const route = `/assets/${encodeURIComponent(asset.id ?? "")}`;
  const base = String(assetBaseUrl ?? "").replace(/\/$/, "");
  return base ? `${base}${route}` : route;
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

function renderReportSection(title, assetIds, assetsById, context = {}) {
  const assets = [...assetIds].map((assetId) => assetsById.get(assetId)).filter(Boolean);
  const duplicateAssetIds = context.duplicateAssetIds ?? new Set();
  const assetTags = context.assetTags ?? {};
  const assetNotes = context.assetNotes ?? {};
  const lines = [`## ${title}`, ""];
  if (!assets.length) {
    lines.push("No assets.", "");
    return lines;
  }

  for (const asset of assets) {
    const duplicateLabel = duplicateAssetIds.has(asset.id) ? ", duplicate" : "";
    const tags = assetTags[asset.id] ?? [];
    const note = formatReportNote(assetNotes[asset.id]);
    lines.push(`- \`${asset.relativePath}\` (${asset.rootName}, ${formatBytes(asset.sizeBytes)}${duplicateLabel})`);
    if (asset.path) {
      lines.push(`  - Path: \`${asset.path}\``);
    }
    if (tags.length) {
      lines.push(`  - Tags: ${tags.join(", ")}`);
    }
    if (note) {
      lines.push(`  - Note: ${note}`);
    }
  }
  lines.push("");
  return lines;
}

function formatReportNote(note) {
  return String(note ?? "").replace(/\s+/g, " ").trim();
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
