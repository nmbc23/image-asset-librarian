import assert from "node:assert/strict";
import test from "node:test";

import {
  createActiveFilterChips,
  createAssetDetails,
  createDefaultViewState,
  createDuplicateGroupDetails,
  createLibraryView,
  createMarkBackup,
  createPathList,
  createWorkflowReport,
  formatBytes,
  parseMarkBackup
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
      modifiedAt: "2026-06-01T02:00:00.000Z"
    },
    {
      id: "c",
      name: "mint.svg",
      relativePath: "mint.svg",
      rootName: "Codex",
      extension: ".svg",
      sizeBytes: 90,
      modifiedAt: "2026-05-30T00:00:00.000Z"
    }
  ],
  duplicates: [{ hash: "same", count: 2, assetIds: ["a", "b"], reclaimableBytes: 1200 }]
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
    sources: 1,
    extensions: 1
  });
  assert.deepEqual(view.roots, ["Archive", "Codex"]);
  assert.deepEqual(view.extensions, [".png", ".svg"]);
  assert.deepEqual(view.sourceBreakdown, [
    { label: "Codex", count: 2 },
    { label: "Archive", count: 1 }
  ]);
  assert.deepEqual(view.extensionBreakdown, [
    { label: ".png", count: 2 },
    { label: ".svg", count: 1 }
  ]);
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
    sources: 2,
    extensions: 2
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

test("formatBytes uses compact readable units", () => {
  assert.equal(formatBytes(0), "0 B");
  assert.equal(formatBytes(999), "999 B");
  assert.equal(formatBytes(1536), "1.5 KB");
  assert.equal(formatBytes(1024 * 1024 * 2), "2 MB");
});

test("createAssetDetails formats metadata and duplicate context", () => {
  const details = createAssetDetails(index, "a");

  assert.equal(details.id, "a");
  assert.equal(details.name, "rose.png");
  assert.equal(details.size, "1.2 KB");
  assert.equal(details.dimensions, "512 x 768");
  assert.equal(details.isDuplicate, true);
  assert.equal(details.duplicateGroup.count, 2);
  assert.equal(details.duplicateGroup.reclaimable, "1.2 KB");
  assert.deepEqual(details.fields.map((field) => field.label), [
    "Source",
    "Type",
    "Size",
    "Dimensions",
    "Modified",
    "Hash",
    "Path"
  ]);
});

test("createAssetDetails returns null for unknown assets", () => {
  assert.equal(createAssetDetails(index, "missing"), null);
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

test("createWorkflowReport exports selected, saved, and review queues as markdown", () => {
  const report = createWorkflowReport(index, {
    generatedAt: "2026-06-01T12:00:00.000Z",
    selectedAssetIds: ["a", "c"],
    savedAssetIds: new Set(["a"]),
    reviewAssetIds: ["b"]
  });

  assert.match(report, /# Image Asset Workflow Report/);
  assert.match(report, /Generated: 2026-06-01T12:00:00.000Z/);
  assert.match(report, /Selected: 2/);
  assert.match(report, /Saved: 1/);
  assert.match(report, /Review queue: 1/);
  assert.match(report, /## Selected Assets/);
  assert.match(report, /`flowers\/rose\.png` \(Codex, 1\.2 KB, duplicate\)/);
  assert.match(report, /## Saved Assets/);
  assert.match(report, /## Review Queue/);
  assert.match(report, /`copies\/rose-copy\.png` \(Archive, 1\.2 KB, duplicate\)/);
});

test("createPathList exports asset paths in display order", () => {
  assert.equal(createPathList([index.assets[0], { id: "missing-path" }, index.assets[2]]), [
    "P:/AI/Codex/generated_images/rose.png",
    "mint.svg"
  ].join("\n"));
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

test("createDefaultViewState returns resettable filter defaults", () => {
  assert.deepEqual(createDefaultViewState(), {
    query: "",
    root: "all",
    extension: "all",
    orientation: "all",
    maxAgeDays: "all",
    mark: "all",
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
    maxAgeDays: "30",
    mark: "review",
    duplicateOnly: true,
    sort: "largest"
  }), [
    { key: "query", label: "Search", value: "rose study" },
    { key: "root", label: "Source", value: "Codex" },
    { key: "extension", label: "Type", value: "PNG" },
    { key: "orientation", label: "Orientation", value: "Portrait" },
    { key: "maxAgeDays", label: "Age", value: "Last 30 days" },
    { key: "mark", label: "Mark", value: "Review queue" },
    { key: "duplicateOnly", label: "Duplicates", value: "Only duplicates" },
    { key: "sort", label: "Sort", value: "Largest" }
  ]);
});
