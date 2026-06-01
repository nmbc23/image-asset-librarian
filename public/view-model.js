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

export function createAssetVisualReview(asset = {}, duplicateAssetIds = new Set()) {
  const themes = getAssetThemes(asset);
  const focus = uniqueStrings(themes.slice(0, 2)).join(" ") || "visual asset";
  const colorThemes = getDescriptionColorThemes(asset);
  const colorPhrase = colorThemes.length ? `${colorThemes.join(", ")} color direction` : "an uncategorized color direction";
  const paletteNames = uniqueStrings(getAssetPalette(asset).slice(0, 2).map(getPaletteColorName));
  const palettePhrase = paletteNames.length ? ` and ${paletteNames.join(", ")} palette` : "";
  const reviewIssues = getAssetIssues(asset, duplicateAssetIds).map(formatReviewIssue);
  const issuePhrase = reviewIssues.length
    ? ` Review before publishing: ${reviewIssues.join(", ")}.`
    : " Ready for publishing: no obvious local issues.";
  const metadataHint = getDescriptionMetadataHint(asset);
  const metadataPhrase = metadataHint ? ` Metadata cue: ${metadataHint}.` : "";

  return `AI review: Strong ${focus} read with ${colorPhrase}${palettePhrase}.${issuePhrase}${metadataPhrase}`;
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
  const suggestedFileName = createSuggestedFileName(asset);
  const metadataEntries = getAssetMetadataEntries(asset);
  const metadataSummary = formatAssetMetadata(asset);
  const description = createAssetDescription(asset);
  const visualReview = createAssetVisualReview(asset, duplicateGroup ? new Set([assetId]) : new Set());

  return {
    id: asset.id,
    name: asset.name,
    imageUrl: asset.objectUrl || `/assets/${encodeURIComponent(asset.id)}`,
    path: asset.path,
    hash: asset.hash,
    size: formatBytes(asset.sizeBytes),
    dimensions,
    palette,
    description,
    visualReview,
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
      { label: "Suggested filename", value: suggestedFileName, copyValue: suggestedFileName },
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

export function createAssetIssueReport(index, options = {}) {
  const assets = Array.isArray(index?.assets) ? index.assets : [];
  const duplicateAssetIds = new Set((index?.duplicates ?? []).flatMap((group) => group.assetIds ?? []));
  const issueAssetsByValue = new Map(ISSUE_FILTERS.map((issue) => [issue.value, { ...issue, assets: [] }]));
  const issueAssetIds = new Set();

  for (const asset of assets) {
    const issues = getAssetIssues(asset, duplicateAssetIds);
    for (const issue of issues) {
      issueAssetIds.add(asset.id);
      issueAssetsByValue.get(issue.value)?.assets.push(asset);
    }
  }

  const issueGroups = [...issueAssetsByValue.values()].filter((issue) => issue.assets.length > 0);
  const lines = [
    "# Image Asset Issue Report",
    "",
    `Generated: ${options.generatedAt ?? new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Total assets: ${assets.length}`,
    `- Assets with issues: ${issueAssetIds.size}`,
    ...ISSUE_FILTERS.map((issue) => `- ${issue.label}: ${issueAssetsByValue.get(issue.value)?.assets.length ?? 0}`)
  ];

  if (!issueGroups.length) {
    lines.push("", "No issue groups found.");
  }

  for (const group of issueGroups) {
    lines.push("", `## ${group.label}`, "");
    for (const asset of group.assets) {
      lines.push(formatIssueReportAsset(asset));
    }
  }

  return `${lines.join("\n")}\n`;
}

export function createLibraryHealthReport(index, options = {}) {
  const assets = Array.isArray(index?.assets) ? index.assets : [];
  const duplicateGroups = Array.isArray(index?.duplicates) ? index.duplicates : [];
  const similarGroups = Array.isArray(index?.similarGroups) ? index.similarGroups : [];
  const duplicateAssetIds = new Set(duplicateGroups.flatMap((group) => group.assetIds ?? []));
  const totalBytes = assets.reduce((sum, asset) => sum + (Number(asset.sizeBytes) || 0), 0);
  const reclaimableBytes = duplicateGroups.reduce((sum, group) => sum + (Number(group.reclaimableBytes) || 0), 0);
  const view = createLibraryView(index);
  const lines = [
    "# Image Asset Health Report",
    "",
    `Generated: ${options.generatedAt ?? new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Total assets: ${assets.length}`,
    `- Total size: ${formatBytes(totalBytes)}`,
    `- Duplicate groups: ${duplicateGroups.length}`,
    `- Duplicate assets: ${duplicateAssetIds.size}`,
    `- Reclaimable: ${formatBytes(reclaimableBytes)}`,
    `- Similar groups: ${similarGroups.length}`,
    "",
    ...renderHealthBreakdown("Issues", view.issueBreakdown),
    ...renderHealthBreakdown("Sources", view.sourceBreakdown),
    ...renderHealthBreakdown("Types", view.extensionBreakdown),
    ...renderHealthBreakdown("Resolutions", view.resolutionBreakdown),
    ...renderHealthBreakdown("Themes", view.themeBreakdown),
    ...renderHealthBreakdown("Color Vibes", view.colorThemeBreakdown),
    ...renderHealthRecommendations({
      duplicateGroups: duplicateGroups.length,
      reclaimableBytes,
      missingDimensions: getBreakdownCount(view.issueBreakdown, "missing-dimensions"),
      tinyAssets: getBreakdownCount(view.issueBreakdown, "tiny-resolution")
    })
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

export function createAssetVisualReviewList(assets, options = {}) {
  const reviewAssets = Array.isArray(assets) ? assets : [];
  const duplicateAssetIds = toAssetIdSet(options.duplicateAssetIds);
  const lines = [
    "# Image Asset AI Reviews",
    "",
    `Generated: ${options.generatedAt ?? new Date().toISOString()}`,
    `Scope: ${String(options.label ?? "assets")}`,
    `Count: ${reviewAssets.length}`,
    ""
  ];

  for (const asset of reviewAssets) {
    const name = asset.name ?? asset.relativePath ?? asset.id ?? "Asset";
    lines.push(`- **${escapeMarkdownText(name)}**: ${createAssetVisualReview(asset, duplicateAssetIds)}`);
  }

  lines.push("");
  return lines.join("\n");
}

export function createAssetAltText(asset = {}) {
  const description = createAssetDescription(asset)
    .replace(/^A\s+/i, "")
    .replace(/\bimage\b/i, "visual")
    .trim();

  return description ? `${description.charAt(0).toUpperCase()}${description.slice(1)}` : "Visual asset.";
}

export function createAssetAltTextList(assets, options = {}) {
  const altTextAssets = Array.isArray(assets) ? assets : [];
  const lines = [
    "# Image Asset Alt Text",
    "",
    `Generated: ${options.generatedAt ?? new Date().toISOString()}`,
    `Scope: ${String(options.label ?? "assets")}`,
    `Count: ${altTextAssets.length}`,
    "",
    "| Asset | Alt text |",
    "| --- | --- |"
  ];

  for (const asset of altTextAssets) {
    const path = asset.relativePath ?? asset.path ?? asset.name ?? asset.id ?? "";
    const cells = [
      `\`${escapeMarkdownCodeText(path)}\``,
      escapeMarkdownTableText(createAssetAltText(asset))
    ];
    lines.push(`| ${cells.join(" | ")} |`);
  }

  lines.push("");
  return lines.join("\n");
}

export function createAssetEmbedList(assets, options = {}) {
  const embedAssets = Array.isArray(assets) ? assets : [];
  const markdownLines = [];
  const htmlLines = [];

  for (const asset of embedAssets) {
    const url = createAssetContactSheetUrl(asset, options.assetBaseUrl);
    const altText = createAssetAltText(asset);
    markdownLines.push(createAssetMarkdownEmbed(asset, url));
    htmlLines.push(createAssetHtmlEmbed(asset, url, altText));
  }

  return [
    "# Image Asset Embeds",
    "",
    `Generated: ${options.generatedAt ?? new Date().toISOString()}`,
    `Scope: ${String(options.label ?? "assets")}`,
    `Count: ${embedAssets.length}`,
    "",
    "## Markdown",
    "",
    ...markdownLines,
    "",
    "## HTML",
    "",
    ...htmlLines,
    ""
  ].join("\n");
}

export function createAssetPublishingChecklist(assets, options = {}) {
  const checklistAssets = Array.isArray(assets) ? assets : [];
  const duplicateAssetIds = toAssetIdSet(options.duplicateAssetIds);
  const lines = [
    "# Image Asset Publishing Checklist",
    "",
    `Generated: ${options.generatedAt ?? new Date().toISOString()}`,
    `Scope: ${String(options.label ?? "assets")}`,
    `Count: ${checklistAssets.length}`
  ];

  for (const asset of checklistAssets) {
    const path = asset.relativePath ?? asset.path ?? asset.name ?? asset.id ?? "Asset";
    const url = createAssetContactSheetUrl(asset, options.assetBaseUrl);
    const issues = getAssetIssues(asset, duplicateAssetIds).map((issue) => issue.label);

    lines.push(
      "",
      `## ${escapeMarkdownText(path)}`,
      "",
      `- Suggested filename: \`${escapeMarkdownCodeText(createSuggestedFileName(asset))}\``,
      `- Alt text: ${escapeMarkdownText(createAssetAltText(asset))}`,
      `- Dimensions: ${formatPublishingDimensions(asset)}`,
      `- Issues: ${issues.length ? issues.map(escapeMarkdownText).join(", ") : "None"}`,
      `- Markdown embed: \`${escapeMarkdownCodeText(createAssetMarkdownEmbed(asset, url))}\``
    );
  }

  lines.push("");
  return lines.join("\n");
}

export function createAssetReadinessReport(assets, options = {}) {
  const readinessAssets = Array.isArray(assets) ? assets : [];
  const duplicateAssetIds = toAssetIdSet(options.duplicateAssetIds);
  const rows = readinessAssets.map((asset) => ({
    asset,
    issues: getAssetIssues(asset, duplicateAssetIds)
  }));
  const readyCount = rows.filter((row) => row.issues.length === 0).length;
  const issueCounts = new Map(ISSUE_FILTERS.map((issue) => [issue.value, 0]));

  for (const row of rows) {
    for (const issue of row.issues) {
      issueCounts.set(issue.value, (issueCounts.get(issue.value) ?? 0) + 1);
    }
  }

  const lines = [
    "# Image Asset Readiness Report",
    "",
    `Generated: ${options.generatedAt ?? new Date().toISOString()}`,
    `Scope: ${String(options.label ?? "assets")}`,
    `Count: ${readinessAssets.length}`,
    "",
    "## Summary",
    "",
    `- Ready assets: ${readyCount}`,
    `- Needs review: ${readinessAssets.length - readyCount}`,
    ...ISSUE_FILTERS.map((issue) => `- ${issue.label}: ${issueCounts.get(issue.value) ?? 0}`),
    "",
    "## Assets",
    "",
    "| Status | Asset | Issues | Suggested filename | Alt text |",
    "| --- | --- | --- | --- | --- |"
  ];

  for (const row of rows) {
    const path = row.asset.relativePath ?? row.asset.path ?? row.asset.name ?? row.asset.id ?? "";
    const issueText = row.issues.length ? row.issues.map((issue) => issue.label).join("; ") : "None";
    const cells = [
      row.issues.length ? "Needs review" : "Ready",
      `\`${escapeMarkdownCodeText(path)}\``,
      escapeMarkdownTableText(issueText),
      `\`${escapeMarkdownCodeText(createSuggestedFileName(row.asset))}\``,
      escapeMarkdownTableText(createAssetAltText(row.asset))
    ];
    lines.push(`| ${cells.join(" | ")} |`);
  }

  lines.push("");
  return lines.join("\n");
}

export function createAssetProvenanceReport(assets, options = {}) {
  const provenanceAssets = Array.isArray(assets) ? assets : [];
  const rows = provenanceAssets.map((asset) => ({
    asset,
    metadataEntries: getAssetMetadataEntries(asset)
  }));
  const metadataCount = rows.filter((row) => row.metadataEntries.length > 0).length;
  const lines = [
    "# Image Asset Provenance Report",
    "",
    `Generated: ${options.generatedAt ?? new Date().toISOString()}`,
    `Scope: ${String(options.label ?? "assets")}`,
    `Count: ${provenanceAssets.length}`,
    "",
    "## Summary",
    "",
    `- Assets with embedded metadata: ${metadataCount}`,
    `- Assets missing embedded metadata: ${provenanceAssets.length - metadataCount}`,
    "",
    "## Assets"
  ];

  for (const row of rows) {
    const path = row.asset.relativePath ?? row.asset.path ?? row.asset.name ?? row.asset.id ?? "Asset";
    const source = row.asset.rootName ?? row.asset.source ?? "Unknown source";
    lines.push(
      "",
      `### ${escapeMarkdownText(path)}`,
      "",
      `- Source: ${escapeMarkdownText(source)}`
    );

    if (!row.metadataEntries.length) {
      lines.push("- Metadata: None found");
      continue;
    }

    for (const entry of row.metadataEntries) {
      lines.push(`- ${escapeMarkdownText(entry.label)}: ${escapeMarkdownText(entry.value)}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

export function createAssetPromptKeywordReport(assets, options = {}) {
  const keywordAssets = Array.isArray(assets) ? assets : [];
  const keywordRows = new Map();
  let metadataAssetCount = 0;

  for (const asset of keywordAssets) {
    const metadataEntries = getAssetMetadataEntries(asset);
    if (metadataEntries.length) {
      metadataAssetCount += 1;
    }

    const path = asset.relativePath ?? asset.path ?? asset.name ?? asset.id ?? "Asset";
    const assetKey = asset.id ?? path;
    for (const entry of metadataEntries) {
      for (const keyword of getPromptKeywords(entry.value)) {
        if (!keywordRows.has(keyword)) {
          keywordRows.set(keyword, {
            keyword,
            mentions: 0,
            assetIds: new Set(),
            examples: []
          });
        }

        const row = keywordRows.get(keyword);
        row.mentions += 1;
        row.assetIds.add(assetKey);
        if (!row.examples.includes(path)) {
          row.examples.push(path);
        }
      }
    }
  }

  const rows = [...keywordRows.values()].sort((left, right) =>
    right.mentions - left.mentions
    || right.assetIds.size - left.assetIds.size
    || left.keyword.localeCompare(right.keyword)
  );

  const lines = [
    "# Image Asset Prompt Keyword Report",
    "",
    `Generated: ${options.generatedAt ?? new Date().toISOString()}`,
    `Scope: ${String(options.label ?? "assets")}`,
    `Count: ${keywordAssets.length}`,
    "",
    "## Summary",
    "",
    `- Assets with embedded metadata: ${metadataAssetCount}`,
    `- Unique keywords: ${rows.length}`,
    "",
    "## Keywords"
  ];

  if (!rows.length) {
    lines.push("", "No reusable keywords found.", "");
    return lines.join("\n");
  }

  lines.push(
    "",
    "| Keyword | Mentions | Assets | Examples |",
    "| --- | ---: | ---: | --- |"
  );

  for (const row of rows) {
    const examples = row.examples
      .slice(0, 3)
      .map((path) => `\`${escapeMarkdownCodeText(path)}\``)
      .join(", ");
    lines.push(`| ${escapeMarkdownTableText(row.keyword)} | ${row.mentions} | ${row.assetIds.size} | ${examples} |`);
  }

  lines.push("");
  return lines.join("\n");
}

export function createAssetCollectionBrief(assets, options = {}) {
  const briefAssets = Array.isArray(assets) ? assets : [];
  const duplicateAssetIds = toAssetIdSet(options.duplicateAssetIds);
  const rows = briefAssets.map((asset) => ({
    asset,
    issues: getAssetIssues(asset, duplicateAssetIds)
  }));
  const issueCounts = new Map(ISSUE_FILTERS.map((issue) => [issue.value, 0]));

  for (const row of rows) {
    for (const issue of row.issues) {
      issueCounts.set(issue.value, (issueCounts.get(issue.value) ?? 0) + 1);
    }
  }

  const metadataCount = briefAssets.filter((asset) => getAssetMetadataEntries(asset).length > 0).length;
  const lines = [
    "# Image Asset Collection Brief",
    "",
    `Generated: ${options.generatedAt ?? new Date().toISOString()}`,
    `Scope: ${String(options.label ?? "assets")}`,
    `Count: ${briefAssets.length}`,
    "",
    "## Snapshot",
    "",
    `- Sources: ${formatCountSummary(createBreakdown(briefAssets, "rootName"))}`,
    `- File types: ${formatCountSummary(createBreakdown(briefAssets, "extension"))}`,
    `- Themes: ${formatCountSummary(createThemeBreakdown(briefAssets))}`,
    `- Color vibes: ${formatCountSummary(createColorThemeBreakdown(briefAssets))}`,
    `- Embedded metadata: ${metadataCount}`,
    `- Needs review: ${rows.filter((row) => row.issues.length > 0).length}`,
    "",
    "## Publishing Notes",
    "",
    ...ISSUE_FILTERS.map((issue) => `- ${issue.label}: ${issueCounts.get(issue.value) ?? 0}`),
    "",
    "## Assets",
    "",
    "| Asset | Source | Type | Description | Issues |",
    "| --- | --- | --- | --- | --- |"
  ];

  for (const row of rows) {
    const path = row.asset.relativePath ?? row.asset.path ?? row.asset.name ?? row.asset.id ?? "";
    const source = row.asset.rootName ?? row.asset.source ?? "Unknown source";
    const type = row.asset.extension || "Unknown";
    const issues = row.issues.length ? row.issues.map((issue) => issue.label).join("; ") : "None";
    const cells = [
      `\`${escapeMarkdownCodeText(path)}\``,
      escapeMarkdownTableText(source),
      escapeMarkdownTableText(type),
      escapeMarkdownTableText(createAssetAltText(row.asset)),
      escapeMarkdownTableText(issues)
    ];
    lines.push(`| ${cells.join(" | ")} |`);
  }

  lines.push("");
  return lines.join("\n");
}

export function createSuggestedFileName(asset = {}) {
  const themes = getAssetThemes(asset);
  const colorThemes = getAssetColorThemes(asset);
  const dimensions = formatSuggestedFileNameDimensions(asset);
  const fallbackName = removeFileExtension(asset.name ?? asset.relativePath ?? asset.id ?? "asset");
  const descriptiveParts = uniqueStrings([
    ...themes.slice(0, 2),
    ...colorThemes.slice(0, 2)
  ]);
  const parts = descriptiveParts.length ? uniqueStrings([...descriptiveParts, dimensions]) : uniqueStrings([fallbackName, dimensions]);
  const slug = slugifyFileName(parts.length ? parts.join(" ") : fallbackName) || "asset";
  const extension = normalizeSuggestedExtension(asset.extension) || normalizeSuggestedExtension(getFileExtension(asset.name));

  return `${slug}${extension}`;
}

export function createAssetRenamePlan(assets, options = {}) {
  const planAssets = Array.isArray(assets) ? assets : [];
  const usedFileNames = new Map();
  const lines = [
    "# Image Asset Rename Plan",
    "",
    `Generated: ${options.generatedAt ?? new Date().toISOString()}`,
    `Scope: ${String(options.label ?? "assets")}`,
    `Count: ${planAssets.length}`,
    "",
    "| Current path | Suggested filename | Description |",
    "| --- | --- | --- |"
  ];

  for (const asset of planAssets) {
    const currentPath = asset.relativePath ?? asset.path ?? asset.name ?? asset.id ?? "";
    const suggestedFileName = createUniqueSuggestedFileName(asset, usedFileNames);
    const cells = [
      `\`${escapeMarkdownCodeText(currentPath)}\``,
      `\`${escapeMarkdownCodeText(suggestedFileName)}\``,
      escapeMarkdownTableText(createAssetDescription(asset))
    ];
    lines.push(`| ${cells.join(" | ")} |`);
  }

  lines.push("");
  return lines.join("\n");
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

function formatCountSummary(items) {
  if (!items.length) {
    return "None";
  }
  return items.map((item) => `${item.label} (${item.count})`).join(", ");
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

function formatReviewIssue(issue = {}) {
  if (issue.value === "duplicate") {
    return "duplicate file";
  }
  if (issue.value === "missing-dimensions") {
    return "missing dimensions";
  }
  if (issue.value === "tiny-resolution") {
    return "tiny resolution";
  }
  return String(issue.label ?? issue.value ?? "review item").toLowerCase();
}

function normalizePaletteColor(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : "";
}

function getPromptKeywords(value) {
  const stopWords = new Set([
    "and",
    "are",
    "for",
    "from",
    "image",
    "img",
    "photo",
    "picture",
    "prompt",
    "the",
    "this",
    "with"
  ]);

  return (String(value ?? "").toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [])
    .filter((word) => word.length >= 3 && !stopWords.has(word));
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

function formatPublishingDimensions(asset = {}) {
  return asset.width && asset.height ? `${asset.width} x ${asset.height}` : "Unknown dimensions";
}

function formatSuggestedFileNameDimensions(asset = {}) {
  return asset.width && asset.height ? `${asset.width}x${asset.height}` : "";
}

function createUniqueSuggestedFileName(asset, usedFileNames) {
  const fileName = createSuggestedFileName(asset);
  const key = fileName.toLowerCase();
  const count = (usedFileNames.get(key) ?? 0) + 1;
  usedFileNames.set(key, count);

  if (count === 1) {
    return fileName;
  }

  const extension = getFileExtension(fileName);
  const baseName = removeFileExtension(fileName);
  return `${baseName}-${count}${extension}`;
}

function slugifyFileName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    .replace(/-$/g, "");
}

function normalizeSuggestedExtension(value) {
  const extension = String(value ?? "").trim().toLowerCase();
  if (!extension) {
    return "";
  }
  const normalized = extension.startsWith(".") ? extension : `.${extension}`;
  return /^\.[a-z0-9]+$/.test(normalized) ? normalized : "";
}

function getFileExtension(value) {
  const match = String(value ?? "").match(/(\.[a-z0-9]+)$/i);
  return match?.[1] ?? "";
}

function removeFileExtension(value) {
  return String(value ?? "").replace(/\.[a-z0-9]+$/i, "");
}

function createAssetContactSheetUrl(asset = {}, assetBaseUrl = "") {
  if (asset.objectUrl && !assetBaseUrl) {
    return asset.objectUrl;
  }
  const route = `/assets/${encodeURIComponent(asset.id ?? "")}`;
  const base = String(assetBaseUrl ?? "").replace(/\/$/, "");
  return base ? `${base}${route}` : route;
}

function createAssetMarkdownEmbed(asset = {}, url) {
  return `![${escapeMarkdownImageAlt(createAssetAltText(asset))}](${url})`;
}

function createAssetHtmlEmbed(asset = {}, url, altText) {
  const dimensions = asset.width && asset.height ? ` width="${escapeHtmlAttribute(asset.width)}" height="${escapeHtmlAttribute(asset.height)}"` : "";
  return `<img src="${escapeHtmlAttribute(url)}" alt="${escapeHtmlAttribute(altText)}"${dimensions}>`;
}

function escapeHtmlAttribute(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
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

function formatIssueReportAsset(asset = {}) {
  const name = asset.name ?? asset.relativePath ?? asset.id ?? "Asset";
  const path = asset.relativePath ?? asset.path ?? asset.name ?? asset.id ?? "";
  const source = asset.rootName ?? "Unknown source";
  const dimensions = asset.width && asset.height ? `${asset.width} x ${asset.height}` : "Unknown dimensions";
  const details = [source, formatBytes(asset.sizeBytes), dimensions]
    .filter(Boolean)
    .join(", ");

  return `- \`${escapeMarkdownCodeText(name)}\` (${escapeMarkdownText(details)}): ${escapeMarkdownText(path)}`;
}

function renderHealthBreakdown(title, items = []) {
  const lines = [`## ${title}`, ""];
  if (!items.length) {
    lines.push("No data.", "");
    return lines;
  }

  for (const item of items) {
    lines.push(`- ${item.label}: ${item.count}`);
  }
  lines.push("");
  return lines;
}

function renderHealthRecommendations(context) {
  const recommendations = [];
  if (context.duplicateGroups > 0) {
    recommendations.push(
      `Review ${context.duplicateGroups} ${formatCountNoun(context.duplicateGroups, "duplicate group")} to reclaim about ${formatBytes(context.reclaimableBytes)}.`
    );
  }
  if (context.missingDimensions > 0) {
    recommendations.push(
      `Add dimensions for ${context.missingDimensions} ${formatCountNoun(context.missingDimensions, "asset")} with missing size metadata.`
    );
  }
  if (context.tinyAssets > 0) {
    recommendations.push(
      `Review ${context.tinyAssets} ${formatCountNoun(context.tinyAssets, "tiny asset")} before publishing.`
    );
  }

  return [
    "## Recommendations",
    "",
    ...(recommendations.length ? recommendations.map((recommendation) => `- ${recommendation}`) : ["No recommendations."]),
    ""
  ];
}

function getBreakdownCount(items = [], value) {
  return items.find((item) => item.value === value)?.count ?? 0;
}

function formatCountNoun(count, noun) {
  return count === 1 ? noun : `${noun}s`;
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
