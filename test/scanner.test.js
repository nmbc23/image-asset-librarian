import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { scanLibrary } from "../src/scanner.js";

const svgA = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="#d94f70"/></svg>`;
const svgB = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 60"><circle cx="45" cy="30" r="24" fill="#1f8a70"/></svg>`;

async function withTempLibrary(run) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "image-asset-librarian-"));
  try {
    await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("scanLibrary indexes image assets with searchable metadata", async () => {
  await withTempLibrary(async (dir) => {
    await writeFile(path.join(dir, "rose.svg"), svgA);
    await writeFile(path.join(dir, "notes.txt"), "not an image");

    const index = await scanLibrary({
      roots: [{ name: "Demo", path: dir }],
      generatedAt: "2026-06-01T00:00:00.000Z"
    });

    assert.equal(index.summary.totalAssets, 1);
    assert.equal(index.assets[0].name, "rose.svg");
    assert.equal(index.assets[0].rootName, "Demo");
    assert.equal(index.assets[0].extension, ".svg");
    assert.equal(index.assets[0].width, 120);
    assert.equal(index.assets[0].height, 80);
    assert.equal(index.assets[0].hash.length, 64);
    assert.deepEqual(index.summary.extensions, { ".svg": 1 });
    assert.deepEqual(index.summary.sources, { Demo: 1 });
    assert.equal(index.errors.length, 0);
  });
});

test("scanLibrary groups duplicate files by content hash", async () => {
  await withTempLibrary(async (dir) => {
    await writeFile(path.join(dir, "first.svg"), svgA);
    await writeFile(path.join(dir, "copy.svg"), svgA);
    await writeFile(path.join(dir, "other.svg"), svgB);

    const index = await scanLibrary({
      roots: [dir],
      generatedAt: "2026-06-01T00:00:00.000Z"
    });

    assert.equal(index.summary.totalAssets, 3);
    assert.equal(index.duplicates.length, 1);
    assert.equal(index.duplicates[0].count, 2);
    assert.deepEqual(
      index.duplicates[0].assetIds.map((id) => index.assets.find((asset) => asset.id === id).name).sort(),
      ["copy.svg", "first.svg"]
    );
  });
});

test("scanLibrary records missing roots without aborting the whole scan", async () => {
  await withTempLibrary(async (dir) => {
    const missing = path.join(dir, "missing");
    const index = await scanLibrary({
      roots: [{ name: "Missing", path: missing }],
      generatedAt: "2026-06-01T00:00:00.000Z"
    });

    assert.equal(index.summary.totalAssets, 0);
    assert.equal(index.errors.length, 1);
    assert.equal(index.errors[0].rootName, "Missing");
    assert.match(index.errors[0].message, /not found/i);
  });
});
