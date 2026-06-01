import assert from "node:assert/strict";
import test from "node:test";

import { createDuplicateReport } from "../src/report.js";

test("createDuplicateReport summarizes duplicate groups with asset paths", () => {
  const report = createDuplicateReport({
    generatedAt: "2026-06-01T00:00:00.000Z",
    summary: {
      totalAssets: 3,
      duplicateGroups: 1,
      reclaimableBytes: 2048
    },
    assets: [
      { id: "a", relativePath: "one.png", rootName: "Sample", sizeBytes: 2048 },
      { id: "b", relativePath: "copy.png", rootName: "Sample", sizeBytes: 2048 },
      { id: "c", relativePath: "other.png", rootName: "Sample", sizeBytes: 512 }
    ],
    duplicates: [
      {
        hash: "abc123",
        count: 2,
        reclaimableBytes: 2048,
        assetIds: ["a", "b"]
      }
    ]
  });

  assert.match(report, /# Duplicate Review Report/);
  assert.match(report, /Total assets: 3/);
  assert.match(report, /Duplicate groups: 1/);
  assert.match(report, /Reclaimable: 2 KB/);
  assert.match(report, /one\.png/);
  assert.match(report, /copy\.png/);
});

test("createDuplicateReport explains when there are no duplicates", () => {
  const report = createDuplicateReport({
    generatedAt: "2026-06-01T00:00:00.000Z",
    summary: {
      totalAssets: 1,
      duplicateGroups: 0,
      reclaimableBytes: 0
    },
    assets: [{ id: "a", relativePath: "one.png", rootName: "Sample", sizeBytes: 2048 }],
    duplicates: []
  });

  assert.match(report, /No duplicate groups were found/);
});
