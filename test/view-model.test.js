import assert from "node:assert/strict";
import test from "node:test";

import { createAssetDetails, createLibraryView, formatBytes } from "../public/view-model.js";

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
