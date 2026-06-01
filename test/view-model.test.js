import assert from "node:assert/strict";
import test from "node:test";

import {
  applyMarkBatch,
  applyTagBatch,
  createActiveFilterChips,
  createAssetAltText,
  createAssetAltTextList,
  createAssetIssueReport,
  createAssetDetails,
  createAssetDescription,
  createAssetDescriptionList,
  createAssetEmbedList,
  createAssetContactSheet,
  createAssetNavigation,
  createAssetCsv,
  createAssetManifest,
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
  createSuggestedFileName,
  createWorkflowReport,
  formatBytes,
  getAllAssetTags,
  getAssetNote,
  getAssetIssues,
  normalizeSavedFilterViews,
  parseCurationBackup,
  parseMarkBackup,
  setAssetNote
} from "../public/view-model.js";

const index = {
  assets: [
    {
      id: "a",
      name: "rose.png",
      relativePath: "flowers/rose.png",
      rootName: "Codex",
      extension: ".png",
      sizeBytes: 1200,
      width: 512,
      height: 768,
      themes: ["portrait", "character"],
      colorThemes: ["warm", "vivid"],
      palette: ["#d94f70", "#1f8a70"],
      metadata: {
        title: "Rose prompt",
        description: "Soft light portrait",
        text: [{ key: "parameters", value: "pink rose, macro lens" }]
      },
      hash: "hash-a",
      path: "P:/AI/Codex/generated_images/rose.png",
      modifiedAt: "2026-06-01T01:00:00.000Z"
    },
    {
      id: "b",
      name: "rose-copy.png",
      relativePath: "copies/rose-copy.png",
      rootName: "Archive",
      extension: ".png",
      sizeBytes: 1200,
      themes: ["portrait"],
      colorThemes: ["warm"],
      palette: ["#d94f70"],
      modifiedAt: "2026-06-01T02:00:00.000Z"
    },
    {
      id: "c",
      name: "mint.svg",
      relativePath: "mint.svg",
      rootName: "Codex",
      extension: ".svg",
      sizeBytes: 90,
      themes: ["logo", "vector"],
      colorThemes: ["cool", "green"],
      palette: ["#1f8a70"],
      modifiedAt: "2026-05-30T00:00:00.000Z"
    }
  ],
  duplicates: [{ hash: "same", count: 2, assetIds: ["a", "b"], reclaimableBytes: 1200 }],
  similarGroups: [
    {
      signature: "portrait|portrait|warm|#d94f70",
      label: "Portrait / warm / #d94f70",
      query: "portrait warm #d94f70",
      count: 2,
      assetIds: ["a", "b"]
    }
  ]
};

test("createLibraryView filters by search, root, extension, and duplicate state", () => {
  const view = createLibraryView(index, {
    query: "rose",
    root: "Codex",
    extension: ".png",
    duplicateOnly: true,
    sort: "name"
  });

  assert.deepEqual(view.assets.map((asset) => asset.id), ["a"]);
  assert.deepEqual(view.filteredSummary, {
    totalAssets: 1,
    totalBytes: 1200,
    duplicateAssets: 1,
    savedAssets: 0,
    reviewAssets: 0,
    taggedAssets: 0,
    notedAssets: 0,
    sources: 1,
    extensions: 1
  });
  assert.deepEqual(view.roots, ["Archive", "Codex"]);
  assert.deepEqual(view.extensions, [".png", ".svg"]);
  assert.deepEqual(view.themes, ["character", "logo", "portrait", "vector"]);
  assert.deepEqual(view.colorThemes, ["cool", "green", "vivid", "warm"]);
  assert.deepEqual(view.sourceBreakdown, [
    { label: "Codex", count: 2 },
    { label: "Archive", count: 1 }
  ]);
  assert.deepEqual(view.extensionBreakdown, [
    { label: ".png", count: 2 },
    { label: ".svg", count: 1 }
  ]);
  assert.deepEqual(view.themeBreakdown, [
    { label: "portrait", count: 2 },
    { label: "character", count: 1 },
    { label: "logo", count: 1 },
    { label: "vector", count: 1 }
  ]);
  assert.deepEqual(view.colorThemeBreakdown, [
    { label: "warm", count: 2 },
    { label: "cool", count: 1 },
    { label: "green", count: 1 },
    { label: "vivid", count: 1 }
  ]);
  assert.deepEqual(view.similarGroups.map((group) => group.label), ["Portrait / warm / #d94f70"]);
  assert.equal(view.duplicateAssetIds.has("a"), true);
  assert.equal(view.duplicateAssetIds.has("c"), false);
});

test("createLibraryView filters by saved and review marks", () => {
  const markState = {
    savedAssetIds: new Set(["a"]),
    reviewAssetIds: ["b"],
    sort: "name"
  };

  assert.deepEqual(
    createLibraryView(index, { ...markState, mark: "saved" }).assets.map((asset) => asset.id),
    ["a"]
  );
  assert.deepEqual(
    createLibraryView(index, { ...markState, mark: "review" }).assets.map((asset) => asset.id),
    ["b"]
  );
  assert.deepEqual(
    createLibraryView(index, { ...markState, mark: "unmarked" }).assets.map((asset) => asset.id),
    ["c"]
  );
  assert.deepEqual(createLibraryView(index, markState).filteredSummary, {
    totalAssets: 3,
    totalBytes: 2490,
    duplicateAssets: 2,
    savedAssets: 1,
    reviewAssets: 1,
    taggedAssets: 0,
    notedAssets: 0,
    sources: 2,
    extensions: 2
  });
});

test("createLibraryView filters by local asset tags", () => {
  const view = createLibraryView(index, {
    tag: "keeper",
    assetTags: {
      a: ["keeper", "portrait"],
      b: ["review"]
    },
    sort: "name"
  });

  assert.deepEqual(view.assets.map((asset) => asset.id), ["a"]);
  assert.deepEqual(view.tags, ["keeper", "portrait", "review"]);
  assert.deepEqual(view.filteredSummary, {
    totalAssets: 1,
    totalBytes: 1200,
    duplicateAssets: 1,
    savedAssets: 0,
    reviewAssets: 0,
    taggedAssets: 1,
    notedAssets: 0,
    sources: 1,
    extensions: 1
  });
});

test("createLibraryView filters by inferred theme", () => {
  const view = createLibraryView(index, {
    theme: "logo",
    sort: "name"
  });

  assert.deepEqual(view.assets.map((asset) => asset.id), ["c"]);

  const searchView = createLibraryView(index, { query: "character", sort: "name" });
  assert.deepEqual(searchView.assets.map((asset) => asset.id), ["a"]);
});

test("createLibraryView filters by inferred color vibe", () => {
  const view = createLibraryView(index, {
    colorTheme: "green",
    sort: "name"
  });

  assert.deepEqual(view.assets.map((asset) => asset.id), ["c"]);

  const searchView = createLibraryView(index, { query: "vivid", sort: "name" });
  assert.deepEqual(searchView.assets.map((asset) => asset.id), ["a"]);
});

test("createLibraryView searches embedded asset metadata", () => {
  const view = createLibraryView(index, {
    query: "macro lens",
    sort: "name"
  });

  assert.deepEqual(view.assets.map((asset) => asset.id), ["a"]);
});

test("createLibraryView searches generated image descriptions", () => {
  const view = createLibraryView(index, {
    query: "rose teal palette",
    sort: "name"
  });

  assert.deepEqual(view.assets.map((asset) => asset.id), ["a"]);
});

test("createLibraryView filters and searches browser-local asset notes", () => {
  const assetNotes = {
    a: "  Final portrait pick for the Codex bio  ",
    c: "mint logo draft"
  };

  assert.deepEqual(
    createLibraryView(index, { note: "with-notes", assetNotes, sort: "name" }).assets.map((asset) => asset.id),
    ["c", "a"]
  );
  assert.deepEqual(
    createLibraryView(index, { note: "without-notes", assetNotes, sort: "name" }).assets.map((asset) => asset.id),
    ["b"]
  );

  const searchView = createLibraryView(index, { query: "bio", assetNotes });
  assert.deepEqual(searchView.assets.map((asset) => asset.id), ["a"]);
  assert.deepEqual(searchView.filteredSummary, {
    totalAssets: 1,
    totalBytes: 1200,
    duplicateAssets: 1,
    savedAssets: 0,
    reviewAssets: 0,
    taggedAssets: 0,
    notedAssets: 1,
    sources: 1,
    extensions: 1
  });
});

test("createLibraryView filters by orientation", () => {
  assert.deepEqual(
    createLibraryView(index, { orientation: "portrait" }).assets.map((asset) => asset.id),
    ["a"]
  );
  assert.deepEqual(
    createLibraryView(index, { orientation: "unknown" }).assets.map((asset) => asset.id),
    ["b", "c"]
  );
});

test("createLibraryView filters by resolution bucket", () => {
  const resolutionIndex = {
    assets: [
      {
        id: "missing",
        name: "missing.png",
        relativePath: "missing.png",
        rootName: "Test",
        extension: ".png",
        sizeBytes: 100,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      },
      {
        id: "tiny",
        name: "tiny.png",
        relativePath: "tiny.png",
        rootName: "Test",
        extension: ".png",
        width: 500,
        height: 500,
        sizeBytes: 100,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      },
      {
        id: "standard",
        name: "standard.png",
        relativePath: "standard.png",
        rootName: "Test",
        extension: ".png",
        width: 1200,
        height: 1000,
        sizeBytes: 100,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      },
      {
        id: "large",
        name: "large.png",
        relativePath: "large.png",
        rootName: "Test",
        extension: ".png",
        width: 3000,
        height: 2000,
        sizeBytes: 100,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      },
      {
        id: "huge",
        name: "huge.png",
        relativePath: "huge.png",
        rootName: "Test",
        extension: ".png",
        width: 5000,
        height: 3000,
        sizeBytes: 100,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      }
    ],
    duplicates: []
  };

  for (const resolution of ["missing", "tiny", "standard", "large", "huge"]) {
    assert.deepEqual(
      createLibraryView(resolutionIndex, { resolution, sort: "name" }).assets.map((asset) => asset.id),
      [resolution]
    );
  }
});

test("createLibraryView filters by asset issue and creates an issue breakdown", () => {
  const issueIndex = {
    assets: [
      {
        id: "duplicate",
        name: "duplicate.png",
        relativePath: "duplicate.png",
        rootName: "Test",
        extension: ".png",
        width: 1200,
        height: 1200,
        sizeBytes: 1000,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      },
      {
        id: "missing",
        name: "missing.png",
        relativePath: "missing.png",
        rootName: "Test",
        extension: ".png",
        sizeBytes: 1000,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      },
      {
        id: "tiny",
        name: "tiny.png",
        relativePath: "tiny.png",
        rootName: "Test",
        extension: ".png",
        width: 320,
        height: 320,
        sizeBytes: 1000,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      },
      {
        id: "clean",
        name: "clean.png",
        relativePath: "clean.png",
        rootName: "Test",
        extension: ".png",
        width: 1600,
        height: 1600,
        sizeBytes: 1000,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      }
    ],
    duplicates: [{ hash: "dupe", count: 1, assetIds: ["duplicate"], reclaimableBytes: 0 }]
  };

  const anyIssue = createLibraryView(issueIndex, { issue: "any", sort: "name" });
  assert.deepEqual(anyIssue.assets.map((asset) => asset.id), ["duplicate", "missing", "tiny"]);
  assert.deepEqual(anyIssue.issueBreakdown, [
    { value: "duplicate", label: "Duplicate", count: 1 },
    { value: "missing-dimensions", label: "Missing dimensions", count: 1 },
    { value: "tiny-resolution", label: "Tiny resolution", count: 1 }
  ]);
  assert.deepEqual(
    createLibraryView(issueIndex, { issue: "tiny-resolution", sort: "name" }).assets.map((asset) => asset.id),
    ["tiny"]
  );
  assert.deepEqual(getAssetIssues(issueIndex.assets[0], new Set(["duplicate"])), [
    { value: "duplicate", label: "Duplicate" }
  ]);
});

test("createAssetIssueReport exports markdown issue groups", () => {
  const issueIndex = {
    assets: [
      {
        id: "duplicate",
        name: "duplicate.png",
        relativePath: "duplicate.png",
        rootName: "Test",
        extension: ".png",
        width: 1200,
        height: 1200,
        sizeBytes: 1000,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      },
      {
        id: "missing",
        name: "missing.png",
        relativePath: "missing.png",
        rootName: "Test",
        extension: ".png",
        sizeBytes: 1000,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      },
      {
        id: "tiny",
        name: "tiny.png",
        relativePath: "tiny.png",
        rootName: "Test",
        extension: ".png",
        width: 320,
        height: 320,
        sizeBytes: 1000,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      },
      {
        id: "clean",
        name: "clean.png",
        relativePath: "clean.png",
        rootName: "Test",
        extension: ".png",
        width: 1600,
        height: 1600,
        sizeBytes: 1000,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      }
    ],
    duplicates: [{ hash: "dupe", count: 1, assetIds: ["duplicate"], reclaimableBytes: 0 }]
  };

  const report = createAssetIssueReport(issueIndex, { generatedAt: "2026-06-01T16:00:00.000Z" });

  assert.match(report, /# Image Asset Issue Report/);
  assert.match(report, /Generated: 2026-06-01T16:00:00.000Z/);
  assert.match(report, /Assets with issues: 3/);
  assert.match(report, /Duplicate: 1/);
  assert.match(report, /Missing dimensions: 1/);
  assert.match(report, /Tiny resolution: 1/);
  assert.match(report, /## Duplicate/);
  assert.match(report, /`duplicate\.png` \(Test, 1000 B, 1200 x 1200\): duplicate\.png/);
  assert.match(report, /## Missing dimensions/);
  assert.match(report, /`missing\.png` \(Test, 1000 B, Unknown dimensions\): missing\.png/);
  assert.match(report, /## Tiny resolution/);
  assert.match(report, /`tiny\.png` \(Test, 1000 B, 320 x 320\): tiny\.png/);
  assert.match(report, /\n$/);
});

test("createLibraryHealthReport exports summary breakdowns and recommendations", () => {
  const report = createLibraryHealthReport(index, { generatedAt: "2026-06-01T19:00:00.000Z" });

  assert.equal(report, [
    "# Image Asset Health Report",
    "",
    "Generated: 2026-06-01T19:00:00.000Z",
    "",
    "## Summary",
    "",
    "- Total assets: 3",
    "- Total size: 2.4 KB",
    "- Duplicate groups: 1",
    "- Duplicate assets: 2",
    "- Reclaimable: 1.2 KB",
    "- Similar groups: 1",
    "",
    "## Issues",
    "",
    "- Duplicate: 2",
    "- Missing dimensions: 2",
    "- Tiny resolution: 1",
    "",
    "## Sources",
    "",
    "- Codex: 2",
    "- Archive: 1",
    "",
    "## Types",
    "",
    "- .png: 2",
    "- .svg: 1",
    "",
    "## Resolutions",
    "",
    "- Tiny < 0.5 MP: 1",
    "- Missing dimensions: 2",
    "",
    "## Themes",
    "",
    "- portrait: 2",
    "- character: 1",
    "- logo: 1",
    "- vector: 1",
    "",
    "## Color Vibes",
    "",
    "- warm: 2",
    "- cool: 1",
    "- green: 1",
    "- vivid: 1",
    "",
    "## Recommendations",
    "",
    "- Review 1 duplicate group to reclaim about 1.2 KB.",
    "- Add dimensions for 2 assets with missing size metadata.",
    "- Review 1 tiny asset before publishing.",
    ""
  ].join("\n"));
});

test("createLibraryView creates a resolution breakdown", () => {
  const resolutionIndex = {
    assets: [
      {
        id: "missing",
        name: "missing.png",
        relativePath: "missing.png",
        rootName: "Test",
        extension: ".png",
        sizeBytes: 100,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      },
      {
        id: "tiny",
        name: "tiny.png",
        relativePath: "tiny.png",
        rootName: "Test",
        extension: ".png",
        width: 500,
        height: 500,
        sizeBytes: 100,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      },
      {
        id: "standard",
        name: "standard.png",
        relativePath: "standard.png",
        rootName: "Test",
        extension: ".png",
        width: 1200,
        height: 1000,
        sizeBytes: 100,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      },
      {
        id: "large",
        name: "large.png",
        relativePath: "large.png",
        rootName: "Test",
        extension: ".png",
        width: 3000,
        height: 2000,
        sizeBytes: 100,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      },
      {
        id: "huge",
        name: "huge.png",
        relativePath: "huge.png",
        rootName: "Test",
        extension: ".png",
        width: 5000,
        height: 3000,
        sizeBytes: 100,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      }
    ],
    duplicates: []
  };

  assert.deepEqual(createLibraryView(resolutionIndex).resolutionBreakdown, [
    { value: "huge", label: "Huge 8 MP+", count: 1 },
    { value: "large", label: "Large 2-8 MP", count: 1 },
    { value: "standard", label: "Standard 0.5-2 MP", count: 1 },
    { value: "tiny", label: "Tiny < 0.5 MP", count: 1 },
    { value: "missing", label: "Missing dimensions", count: 1 }
  ]);
});

test("createLibraryView filters by maximum age in days", () => {
  assert.deepEqual(
    createLibraryView(index, {
      maxAgeDays: "2",
      now: "2026-06-02T00:00:00.000Z",
      sort: "oldest"
    }).assets.map((asset) => asset.id),
    ["a", "b"]
  );
});

test("createLibraryView sorts newest and largest assets", () => {
  assert.deepEqual(
    createLibraryView(index, { sort: "newest" }).assets.map((asset) => asset.id),
    ["b", "a", "c"]
  );
  assert.deepEqual(
    createLibraryView(index, { sort: "smallest" }).assets.map((asset) => asset.id),
    ["c", "a", "b"]
  );
});

test("createLibraryView sorts by resolution", () => {
  const resolutionIndex = {
    assets: [
      {
        id: "missing",
        name: "missing.png",
        relativePath: "missing.png",
        rootName: "Test",
        extension: ".png",
        sizeBytes: 100,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      },
      {
        id: "tiny",
        name: "tiny.png",
        relativePath: "tiny.png",
        rootName: "Test",
        extension: ".png",
        width: 100,
        height: 100,
        sizeBytes: 100,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      },
      {
        id: "standard",
        name: "standard.png",
        relativePath: "standard.png",
        rootName: "Test",
        extension: ".png",
        width: 1000,
        height: 1000,
        sizeBytes: 100,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      },
      {
        id: "large",
        name: "large.png",
        relativePath: "large.png",
        rootName: "Test",
        extension: ".png",
        width: 3000,
        height: 2000,
        sizeBytes: 100,
        modifiedAt: "2026-06-01T00:00:00.000Z"
      }
    ],
    duplicates: []
  };

  assert.deepEqual(
    createLibraryView(resolutionIndex, { sort: "highest-resolution" }).assets.map((asset) => asset.id),
    ["large", "standard", "tiny", "missing"]
  );
  assert.deepEqual(
    createLibraryView(resolutionIndex, { sort: "lowest-resolution" }).assets.map((asset) => asset.id),
    ["missing", "tiny", "standard", "large"]
  );
});

test("formatBytes uses compact readable units", () => {
  assert.equal(formatBytes(0), "0 B");
  assert.equal(formatBytes(999), "999 B");
  assert.equal(formatBytes(1536), "1.5 KB");
  assert.equal(formatBytes(1024 * 1024 * 2), "2 MB");
});

test("createAssetDescription writes a concise local image description", () => {
  assert.equal(
    createAssetDescription(index.assets[0]),
    "A portrait character image with warm, vivid colors and a rose, teal palette. Metadata suggests: Soft light portrait."
  );
  assert.equal(
    createAssetDescription(index.assets[2]),
    "A logo vector image with cool, green colors and a teal palette."
  );
});

test("createAssetDetails formats metadata and duplicate context", () => {
  const details = createAssetDetails(index, "a");

  assert.equal(details.id, "a");
  assert.equal(details.name, "rose.png");
  assert.equal(details.size, "1.2 KB");
  assert.equal(details.dimensions, "512 x 768");
  assert.equal(details.description, "A portrait character image with warm, vivid colors and a rose, teal palette. Metadata suggests: Soft light portrait.");
  assert.equal(details.isDuplicate, true);
  assert.equal(details.duplicateGroup.count, 2);
  assert.equal(details.duplicateGroup.reclaimable, "1.2 KB");
  assert.deepEqual(details.fields.map((field) => field.label), [
    "Source",
    "Type",
    "Size",
    "Dimensions",
    "Themes",
    "Color vibes",
    "Palette",
    "Suggested filename",
    "Metadata",
    "Modified",
    "Hash",
    "Path"
  ]);
  assert.equal(details.fields.find((field) => field.label === "Suggested filename")?.value, "portrait-character-warm-vivid-512x768.png");
  assert.deepEqual(details.metadataEntries, [
    { label: "Title", value: "Rose prompt" },
    { label: "Description", value: "Soft light portrait" },
    { label: "parameters", value: "pink rose, macro lens" }
  ]);
});

test("createAssetDetails returns null for unknown assets", () => {
  assert.equal(createAssetDetails(index, "missing"), null);
});

test("createAssetNavigation returns adjacent visible assets", () => {
  assert.deepEqual(createAssetNavigation(index.assets, "b"), {
    index: 1,
    total: 3,
    previousAssetId: "a",
    nextAssetId: "c",
    hasPrevious: true,
    hasNext: true
  });

  assert.deepEqual(createAssetNavigation(index.assets, "a"), {
    index: 0,
    total: 3,
    previousAssetId: null,
    nextAssetId: "b",
    hasPrevious: false,
    hasNext: true
  });

  assert.deepEqual(createAssetNavigation(index.assets, "missing"), {
    index: -1,
    total: 3,
    previousAssetId: null,
    nextAssetId: null,
    hasPrevious: false,
    hasNext: false
  });
});

test("createDuplicateGroupDetails recommends a stable asset to keep and exports group paths", () => {
  const details = createDuplicateGroupDetails(index, index.duplicates[0]);

  assert.equal(details.count, 2);
  assert.equal(details.reclaimable, "1.2 KB");
  assert.equal(details.recommendedKeepAsset.id, "a");
  assert.deepEqual(details.cleanupCandidateAssets.map((asset) => asset.id), ["b"]);
  assert.equal(details.cleanupPathList, "copies/rose-copy.png");
  assert.deepEqual(details.assets.map((asset) => asset.id), ["a", "b"]);
  assert.equal(details.pathList, [
    "P:/AI/Codex/generated_images/rose.png",
    "copies/rose-copy.png"
  ].join("\n"));
});

test("createSimilarGroupDetails describes a local visual similarity group", () => {
  const details = createSimilarGroupDetails(index, index.similarGroups[0]);

  assert.equal(details.count, 2);
  assert.equal(details.label, "Portrait / warm / #d94f70");
  assert.equal(details.query, "portrait warm #d94f70");
  assert.deepEqual(details.assets.map((asset) => asset.id), ["a", "b"]);
  assert.equal(details.pathList, [
    "P:/AI/Codex/generated_images/rose.png",
    "copies/rose-copy.png"
  ].join("\n"));
});

test("createWorkflowReport exports selected, saved, and review queues as markdown", () => {
  const report = createWorkflowReport(index, {
    generatedAt: "2026-06-01T12:00:00.000Z",
    selectedAssetIds: ["a", "c"],
    savedAssetIds: new Set(["a"]),
    reviewAssetIds: ["b"],
    assetTags: {
      a: ["keeper", "profile"],
      b: ["cleanup"]
    },
    assetNotes: {
      a: "Use in README after cropping",
      b: "Duplicate candidate for removal"
    }
  });

  assert.match(report, /# Image Asset Workflow Report/);
  assert.match(report, /Generated: 2026-06-01T12:00:00.000Z/);
  assert.match(report, /Selected: 2/);
  assert.match(report, /Saved: 1/);
  assert.match(report, /Review queue: 1/);
  assert.match(report, /## Selected Assets/);
  assert.match(report, /`flowers\/rose\.png` \(Codex, 1\.2 KB, duplicate\)/);
  assert.match(report, /Tags: keeper, profile/);
  assert.match(report, /Note: Use in README after cropping/);
  assert.match(report, /## Saved Assets/);
  assert.match(report, /## Review Queue/);
  assert.match(report, /`copies\/rose-copy\.png` \(Archive, 1\.2 KB, duplicate\)/);
  assert.match(report, /Tags: cleanup/);
  assert.match(report, /Note: Duplicate candidate for removal/);
});

test("createSuggestedFileName builds stable descriptive names", () => {
  assert.equal(createSuggestedFileName(index.assets[0]), "portrait-character-warm-vivid-512x768.png");
  assert.equal(createSuggestedFileName(index.assets[2]), "logo-vector-cool-green.svg");
  assert.equal(createSuggestedFileName({
    id: "fallback",
    name: "My Weird File!!.jpg",
    extension: ".jpg",
    width: 800,
    height: 600,
    themes: [],
    colorThemes: []
  }), "my-weird-file-800x600.jpg");
});

test("createAssetRenamePlan exports markdown filename suggestions", () => {
  const plan = createAssetRenamePlan([
    index.assets[0],
    index.assets[2],
    { ...index.assets[2], id: "d", name: "mint-copy.svg", relativePath: "drafts/mint-copy.svg" }
  ], {
    generatedAt: "2026-06-01T17:00:00.000Z",
    label: "visible"
  });

  assert.equal(plan, [
    "# Image Asset Rename Plan",
    "",
    "Generated: 2026-06-01T17:00:00.000Z",
    "Scope: visible",
    "Count: 3",
    "",
    "| Current path | Suggested filename | Description |",
    "| --- | --- | --- |",
    "| `flowers/rose.png` | `portrait-character-warm-vivid-512x768.png` | A portrait character image with warm, vivid colors and a rose, teal palette. Metadata suggests: Soft light portrait. |",
    "| `mint.svg` | `logo-vector-cool-green.svg` | A logo vector image with cool, green colors and a teal palette. |",
    "| `drafts/mint-copy.svg` | `logo-vector-cool-green-2.svg` | A logo vector image with cool, green colors and a teal palette. |",
    ""
  ].join("\n"));
});

test("createPathList exports asset paths in display order", () => {
  assert.equal(createPathList([index.assets[0], { id: "missing-path" }, index.assets[2]]), [
    "P:/AI/Codex/generated_images/rose.png",
    "mint.svg"
  ].join("\n"));
});

test("createAssetDescriptionList exports markdown descriptions in display order", () => {
  assert.equal(createAssetDescriptionList([index.assets[0], index.assets[2]]), [
    "- **rose.png**: A portrait character image with warm, vivid colors and a rose, teal palette. Metadata suggests: Soft light portrait.",
    "- **mint.svg**: A logo vector image with cool, green colors and a teal palette.",
    ""
  ].join("\n"));
});

test("createAssetAltTextList exports accessibility alt text in display order", () => {
  assert.equal(createAssetAltText(index.assets[0]), "Portrait character visual with warm, vivid colors and a rose, teal palette. Metadata suggests: Soft light portrait.");

  assert.equal(createAssetAltTextList([index.assets[0], index.assets[2]], {
    generatedAt: "2026-06-01T18:00:00.000Z",
    label: "selected"
  }), [
    "# Image Asset Alt Text",
    "",
    "Generated: 2026-06-01T18:00:00.000Z",
    "Scope: selected",
    "Count: 2",
    "",
    "| Asset | Alt text |",
    "| --- | --- |",
    "| `flowers/rose.png` | Portrait character visual with warm, vivid colors and a rose, teal palette. Metadata suggests: Soft light portrait. |",
    "| `mint.svg` | Logo vector visual with cool, green colors and a teal palette. |",
    ""
  ].join("\n"));
});

test("createAssetEmbedList exports markdown and HTML image snippets", () => {
  assert.equal(createAssetEmbedList([index.assets[0], { ...index.assets[2], width: undefined, height: undefined }], {
    generatedAt: "2026-06-01T20:00:00.000Z",
    label: "visible",
    assetBaseUrl: "http://127.0.0.1:4173"
  }), [
    "# Image Asset Embeds",
    "",
    "Generated: 2026-06-01T20:00:00.000Z",
    "Scope: visible",
    "Count: 2",
    "",
    "## Markdown",
    "",
    "![Portrait character visual with warm, vivid colors and a rose, teal palette. Metadata suggests: Soft light portrait.](http://127.0.0.1:4173/assets/a)",
    "![Logo vector visual with cool, green colors and a teal palette.](http://127.0.0.1:4173/assets/c)",
    "",
    "## HTML",
    "",
    "<img src=\"http://127.0.0.1:4173/assets/a\" alt=\"Portrait character visual with warm, vivid colors and a rose, teal palette. Metadata suggests: Soft light portrait.\" width=\"512\" height=\"768\">",
    "<img src=\"http://127.0.0.1:4173/assets/c\" alt=\"Logo vector visual with cool, green colors and a teal palette.\">",
    ""
  ].join("\n"));
});

test("createAssetContactSheet exports previewable markdown in display order", () => {
  assert.equal(createAssetContactSheet([index.assets[0], { ...index.assets[2], width: undefined, height: undefined }], {
    generatedAt: "2026-06-01T15:00:00.000Z",
    assetBaseUrl: "http://127.0.0.1:4173"
  }), [
    "# Image Asset Contact Sheet",
    "",
    "Generated: 2026-06-01T15:00:00.000Z",
    "Count: 2",
    "",
    "| Preview | Asset | Description | Details |",
    "| --- | --- | --- | --- |",
    "| ![rose.png](http://127.0.0.1:4173/assets/a) | **rose.png**<br>`flowers/rose.png` | A portrait character image with warm, vivid colors and a rose, teal palette. Metadata suggests: Soft light portrait. | Codex · .png · 512x768 · 1.2 KB |",
    "| ![mint.svg](http://127.0.0.1:4173/assets/c) | **mint.svg**<br>`mint.svg` | A logo vector image with cool, green colors and a teal palette. | Codex · .svg · Unknown dimensions · 90 B |",
    ""
  ].join("\n"));
});

test("createAssetCsv exports escaped asset metadata in display order", () => {
  const csv = createAssetCsv([
    { ...index.assets[0], name: 'rose, "study".png' },
    { ...index.assets[2], width: undefined, height: undefined, path: undefined, hash: undefined }
  ]);

  assert.equal(csv, [
    "id,name,source,type,sizeBytes,width,height,themes,colorThemes,palette,description,metadata,modifiedAt,relativePath,path,hash",
    '"a","rose, ""study"".png","Codex",".png","1200","512","768","portrait; character","warm; vivid","#d94f70; #1f8a70","A portrait character image with warm, vivid colors and a rose, teal palette. Metadata suggests: Soft light portrait.","Title: Rose prompt; Description: Soft light portrait; parameters: pink rose, macro lens","2026-06-01T01:00:00.000Z","flowers/rose.png","P:/AI/Codex/generated_images/rose.png","hash-a"',
    '"c","mint.svg","Codex",".svg","90","","","logo; vector","cool; green","#1f8a70","A logo vector image with cool, green colors and a teal palette.","","2026-05-30T00:00:00.000Z","mint.svg","",""',
    ""
  ].join("\n"));
});

test("createAssetManifest exports selected asset metadata as stable JSON", () => {
  const manifest = createAssetManifest([
    index.assets[0],
    { ...index.assets[2], width: undefined, height: undefined, path: undefined, hash: undefined }
  ], {
    generatedAt: "2026-06-01T15:00:00.000Z",
    label: "selected"
  });

  assert.deepEqual(JSON.parse(manifest), {
    schema: "image-asset-librarian-manifest-v1",
    generatedAt: "2026-06-01T15:00:00.000Z",
    label: "selected",
    count: 2,
    assets: [
      {
        id: "a",
        name: "rose.png",
        source: "Codex",
        type: ".png",
        sizeBytes: 1200,
        width: 512,
        height: 768,
        themes: ["portrait", "character"],
        colorThemes: ["warm", "vivid"],
        palette: ["#d94f70", "#1f8a70"],
        description: "A portrait character image with warm, vivid colors and a rose, teal palette. Metadata suggests: Soft light portrait.",
        metadata: {
          title: "Rose prompt",
          description: "Soft light portrait",
          text: [{ key: "parameters", value: "pink rose, macro lens" }]
        },
        modifiedAt: "2026-06-01T01:00:00.000Z",
        relativePath: "flowers/rose.png",
        path: "P:/AI/Codex/generated_images/rose.png",
        hash: "hash-a"
      },
      {
        id: "c",
        name: "mint.svg",
        source: "Codex",
        type: ".svg",
        sizeBytes: 90,
        width: null,
        height: null,
        themes: ["logo", "vector"],
        colorThemes: ["cool", "green"],
        palette: ["#1f8a70"],
        description: "A logo vector image with cool, green colors and a teal palette.",
        metadata: {
          title: "",
          description: "",
          text: []
        },
        modifiedAt: "2026-05-30T00:00:00.000Z",
        relativePath: "mint.svg",
        path: null,
        hash: null
      }
    ]
  });
  assert.match(manifest, /\n$/);
});

test("createAssetManifest can include local curation annotations", () => {
  const manifest = createAssetManifest(index.assets, {
    generatedAt: "2026-06-01T15:30:00.000Z",
    label: "visible",
    savedAssetIds: ["a"],
    reviewAssetIds: new Set(["b"]),
    assetTags: {
      a: ["Keeper", "portrait"],
      c: ["draft"]
    },
    assetNotes: {
      a: "  Final profile image  ",
      c: "Needs SVG cleanup"
    },
    duplicateAssetIds: new Set(["a", "b"])
  });

  const parsed = JSON.parse(manifest);
  assert.deepEqual(parsed.assets.map((asset) => asset.curation), [
    {
      saved: true,
      review: false,
      tags: ["keeper", "portrait"],
      note: "Final profile image",
      duplicate: true
    },
    {
      saved: false,
      review: true,
      tags: [],
      note: "",
      duplicate: true
    },
    {
      saved: false,
      review: false,
      tags: ["draft"],
      note: "Needs SVG cleanup",
      duplicate: false
    }
  ]);
});

test("createMarkBackup and parseMarkBackup round-trip saved and review ids", () => {
  const backup = createMarkBackup({
    savedAssetIds: new Set(["a", "missing", "a"]),
    reviewAssetIds: ["b"],
    generatedAt: "2026-06-01T12:00:00.000Z"
  });

  assert.match(backup, /"schema": "image-asset-librarian-marks-v1"/);
  assert.match(backup, /"generatedAt": "2026-06-01T12:00:00.000Z"/);

  assert.deepEqual(parseMarkBackup(backup), {
    saved: ["a", "missing"],
    review: ["b"]
  });
});

test("parseMarkBackup rejects malformed backups", () => {
  assert.throws(() => parseMarkBackup("{ bad json"), /valid JSON/);
  assert.throws(() => parseMarkBackup(JSON.stringify({ saved: "a", review: [] })), /saved and review arrays/);
});

test("createCurationBackup and parseCurationBackup round-trip local curation state", () => {
  const savedView = createSavedFilterView("Needs export", {
    tag: "keeper",
    note: "with-notes",
    duplicateOnly: true
  }, {
    id: "view-keeper",
    createdAt: "2026-06-01T12:00:00.000Z"
  });

  const backup = createCurationBackup({
    generatedAt: "2026-06-01T14:00:00.000Z",
    savedAssetIds: new Set(["a", "a"]),
    reviewAssetIds: ["b", "missing"],
    assetTags: {
      a: ["Keeper", "keeper", ""],
      b: ["Publish candidate"]
    },
    assetNotes: {
      a: "  Final pick  ",
      b: 42,
      c: "Needs cleanup"
    },
    savedFilterViews: [savedView, { id: "", name: "Broken" }]
  });

  assert.match(backup, /"schema": "image-asset-librarian-curation-v1"/);
  assert.deepEqual(parseCurationBackup(backup), {
    saved: ["a"],
    review: ["b", "missing"],
    assetTags: {
      a: ["keeper"],
      b: ["publish candidate"]
    },
    assetNotes: {
      a: "Final pick",
      c: "Needs cleanup"
    },
    savedFilterViews: [savedView]
  });
});

test("createExportFileName builds stable safe download names", () => {
  assert.equal(
    createExportFileName("Workflow Report", "md", { generatedAt: "2026-06-01T15:04:05.000Z" }),
    "image-asset-librarian-workflow-report-20260601-150405.md"
  );
  assert.equal(
    createExportFileName("  Curation/Backup  ", ".json", { generatedAt: "bad date" }),
    "image-asset-librarian-curation-backup-export.json"
  );
});

test("parseCurationBackup rejects malformed or incompatible backups", () => {
  assert.throws(() => parseCurationBackup("{ bad json"), /valid JSON/);
  assert.throws(
    () => parseCurationBackup(JSON.stringify({ schema: "image-asset-librarian-marks-v1", saved: [] })),
    /Unsupported curation backup schema/
  );
});

test("createDefaultViewState returns resettable filter defaults", () => {
  assert.deepEqual(createDefaultViewState(), {
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
  });
});

test("createActiveFilterChips describes only non-default filters", () => {
  assert.deepEqual(createActiveFilterChips(createDefaultViewState()), []);

  assert.deepEqual(createActiveFilterChips({
    query: "rose study",
    root: "Codex",
    extension: ".png",
    orientation: "portrait",
    resolution: "large",
    theme: "logo",
    colorTheme: "green",
    maxAgeDays: "30",
    mark: "review",
    tag: "keeper",
    note: "with-notes",
    issue: "tiny-resolution",
    duplicateOnly: true,
    sort: "largest"
  }), [
    { key: "query", label: "Search", value: "rose study" },
    { key: "root", label: "Source", value: "Codex" },
    { key: "extension", label: "Type", value: "PNG" },
    { key: "orientation", label: "Orientation", value: "Portrait" },
    { key: "resolution", label: "Resolution", value: "Large" },
    { key: "theme", label: "Theme", value: "logo" },
    { key: "colorTheme", label: "Color vibe", value: "green" },
    { key: "maxAgeDays", label: "Age", value: "Last 30 days" },
    { key: "mark", label: "Mark", value: "Review queue" },
    { key: "tag", label: "Tag", value: "keeper" },
    { key: "note", label: "Notes", value: "With notes" },
    { key: "issue", label: "Issue", value: "Tiny resolution" },
    { key: "duplicateOnly", label: "Duplicates", value: "Only duplicates" },
    { key: "sort", label: "Sort", value: "Largest" }
  ]);
});

test("createSavedFilterView stores a normalized filter state snapshot", () => {
  assert.deepEqual(createSavedFilterView("  Portrait picks  ", {
    query: "rose",
    root: "Codex",
    extension: ".png",
    orientation: "portrait",
    colorTheme: "warm",
    duplicateOnly: true,
    sort: "largest",
    unrelated: "ignored"
  }, {
    id: "view-1",
    createdAt: "2026-06-01T12:00:00.000Z"
  }), {
    id: "view-1",
    name: "Portrait picks",
    createdAt: "2026-06-01T12:00:00.000Z",
    state: {
      query: "rose",
      root: "Codex",
      extension: ".png",
      orientation: "portrait",
      resolution: "all",
      theme: "all",
      colorTheme: "warm",
      maxAgeDays: "all",
      mark: "all",
      tag: "all",
      note: "all",
      issue: "all",
      duplicateOnly: true,
      sort: "largest"
    }
  });
});

test("normalizeSavedFilterViews drops invalid entries and restores missing defaults", () => {
  assert.deepEqual(normalizeSavedFilterViews([
    {
      id: "view-a",
      name: "Duplicates",
      createdAt: "2026-06-01T12:00:00.000Z",
      state: { duplicateOnly: true, sort: "oldest" }
    },
    {
      id: "",
      name: "Broken",
      state: {}
    },
    null
  ]), [
    {
      id: "view-a",
      name: "Duplicates",
      createdAt: "2026-06-01T12:00:00.000Z",
      state: {
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
        duplicateOnly: true,
        sort: "oldest"
      }
    }
  ]);
});

test("applyTagBatch normalizes tags and updates selected assets", () => {
  assert.deepEqual(applyTagBatch({
    a: ["Keeper"],
    b: ["draft"]
  }, ["a", "c", "c"], "  Review Pick  ", "add"), {
    a: ["keeper", "review pick"],
    b: ["draft"],
    c: ["review pick"]
  });

  assert.deepEqual(applyTagBatch({
    a: ["keeper", "review pick"],
    c: ["review pick"]
  }, ["a", "c"], "review pick", "remove"), {
    a: ["keeper"]
  });

  assert.throws(() => applyTagBatch({}, ["a"], "keeper", "archive"), /Unsupported tag batch action/);
});

test("getAllAssetTags returns sorted unique normalized tag names", () => {
  assert.deepEqual(getAllAssetTags({
    a: ["Keeper", "draft"],
    b: ["keeper", "", "review"],
    c: []
  }), ["draft", "keeper", "review"]);
});

test("setAssetNote trims notes and removes blank values", () => {
  assert.deepEqual(setAssetNote({
    a: "existing note",
    ignored: 4
  }, " b ", "  Fresh note\nfor export  "), {
    a: "existing note",
    b: "Fresh note\nfor export"
  });

  assert.deepEqual(setAssetNote({
    a: "existing note",
    b: "temporary"
  }, "b", "   "), {
    a: "existing note"
  });

  assert.equal(getAssetNote({ a: "  Saved note  " }, "a"), "Saved note");
  assert.equal(getAssetNote({ a: "Saved note" }, "missing"), "");
});

test("applyMarkBatch updates saved and review queues for selected assets", () => {
  assert.deepEqual(applyMarkBatch({
    savedAssetIds: ["a"],
    reviewAssetIds: ["b"]
  }, ["b", "c", "c"], "save"), {
    saved: ["a", "b", "c"],
    review: ["b"]
  });

  assert.deepEqual(applyMarkBatch({
    savedAssetIds: ["a", "c"],
    reviewAssetIds: ["b"]
  }, ["a", "c"], "review"), {
    saved: ["a", "c"],
    review: ["b", "a", "c"]
  });

  assert.deepEqual(applyMarkBatch({
    savedAssetIds: ["a", "c"],
    reviewAssetIds: ["b", "c"]
  }, ["c"], "clear"), {
    saved: ["a"],
    review: ["b"]
  });

  assert.throws(() => applyMarkBatch({}, ["a"], "archive"), /Unsupported mark batch action/);
});
