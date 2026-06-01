import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { deflateSync } from "node:zlib";

import { scanLibrary } from "../src/scanner.js";

const svgA = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="#d94f70"/></svg>`;
const svgB = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 60"><circle cx="45" cy="30" r="24" fill="#1f8a70"/></svg>`;
const svgSquare = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#1f8a70"/></svg>`;

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

test("scanLibrary infers local visual themes from image metadata and paths", async () => {
  await withTempLibrary(async (dir) => {
    await writeFile(path.join(dir, "portrait-avatar.svg"), svgA);
    await writeFile(path.join(dir, "wide-forest-background.svg"), svgB);
    await writeFile(path.join(dir, "brand-logo-icon.svg"), svgB);
    await writeFile(path.join(dir, "untitled.svg"), svgSquare);

    const index = await scanLibrary({
      roots: [{ name: "Theme Demo", path: dir }],
      generatedAt: "2026-06-01T00:00:00.000Z"
    });

    const byName = new Map(index.assets.map((asset) => [asset.name, asset]));

    assert.deepEqual(byName.get("portrait-avatar.svg").themes, ["character", "portrait", "vector"]);
    assert.deepEqual(byName.get("wide-forest-background.svg").themes, ["background", "landscape", "nature", "vector"]);
    assert.deepEqual(byName.get("brand-logo-icon.svg").themes, ["icon", "logo", "vector"]);
    assert.deepEqual(byName.get("untitled.svg").themes, ["square", "vector"]);
  });
});

test("scanLibrary infers color vibe themes from SVG colors and filenames", async () => {
  await withTempLibrary(async (dir) => {
    await writeFile(path.join(dir, "warm-poster.svg"), `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="120"><rect width="80" height="120" fill="#d94f70"/></svg>`);
    await writeFile(path.join(dir, "cool-mint.svg"), `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="60"><circle cx="45" cy="30" r="24" fill="#1f8a70"/></svg>`);
    await writeFile(path.join(dir, "dark-icon.svg"), `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><path fill="#111111" d="M0 0h80v80H0z"/></svg>`);
    await writeFile(path.join(dir, "gold-logo.svg"), `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><path fill="currentColor" d="M0 0h80v80H0z"/></svg>`);

    const index = await scanLibrary({
      roots: [{ name: "Color Demo", path: dir }],
      generatedAt: "2026-06-01T00:00:00.000Z"
    });

    const byName = new Map(index.assets.map((asset) => [asset.name, asset]));

    assert.deepEqual(byName.get("warm-poster.svg").colorThemes, ["warm", "vivid"]);
    assert.deepEqual(byName.get("cool-mint.svg").colorThemes, ["cool", "green", "vivid"]);
    assert.deepEqual(byName.get("dark-icon.svg").colorThemes, ["dark", "monochrome"]);
    assert.deepEqual(byName.get("gold-logo.svg").colorThemes, ["warm"]);
  });
});

test("scanLibrary infers color vibe themes from PNG pixel data", async () => {
  await withTempLibrary(async (dir) => {
    await writeFile(path.join(dir, "sample-a.png"), createSolidPng(2, 2, [217, 79, 112, 255]));
    await writeFile(path.join(dir, "sample-b.png"), createSolidPng(2, 2, [40, 115, 200, 255]));

    const index = await scanLibrary({
      roots: [{ name: "Pixel Demo", path: dir }],
      generatedAt: "2026-06-01T00:00:00.000Z"
    });

    const byName = new Map(index.assets.map((asset) => [asset.name, asset]));

    assert.deepEqual(byName.get("sample-a.png").colorThemes, ["warm", "vivid"]);
    assert.deepEqual(byName.get("sample-b.png").colorThemes, ["cool", "vivid"]);
  });
});

test("scanLibrary extracts a compact color palette from SVG and PNG data", async () => {
  await withTempLibrary(async (dir) => {
    await writeFile(path.join(dir, "two-tone.svg"), `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="40" height="80" fill="#d94f70"/><rect x="40" width="40" height="80" fill="#1f8a70"/></svg>`);
    await writeFile(path.join(dir, "blue-pixel.png"), createSolidPng(2, 2, [40, 115, 200, 255]));

    const index = await scanLibrary({
      roots: [{ name: "Palette Demo", path: dir }],
      generatedAt: "2026-06-01T00:00:00.000Z"
    });

    const byName = new Map(index.assets.map((asset) => [asset.name, asset]));

    assert.deepEqual(byName.get("two-tone.svg").palette, ["#d94f70", "#1f8a70"]);
    assert.deepEqual(byName.get("blue-pixel.png").palette, ["#2873c8"]);
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

test("scanLibrary groups visually similar non-duplicate assets by local signatures", async () => {
  await withTempLibrary(async (dir) => {
    await writeFile(path.join(dir, "portrait-warm-a.svg"), `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="160"><rect width="100" height="160" fill="#d94f70"/></svg>`);
    await writeFile(path.join(dir, "portrait-warm-b.svg"), `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="180"><circle cx="60" cy="90" r="50" fill="#d94f70"/></svg>`);
    await writeFile(path.join(dir, "logo-cool.svg"), `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#1f8a70"/></svg>`);

    const index = await scanLibrary({
      roots: [{ name: "Similar Demo", path: dir }],
      generatedAt: "2026-06-01T00:00:00.000Z"
    });

    assert.equal(index.summary.similarGroups, 1);
    assert.equal(index.similarGroups.length, 1);
    assert.equal(index.similarGroups[0].label, "Portrait / warm / #d94f70");
    assert.deepEqual(
      index.similarGroups[0].assetIds.map((id) => index.assets.find((asset) => asset.id === id).name).sort(),
      ["portrait-warm-a.svg", "portrait-warm-b.svg"]
    );
  });
});

function createSolidPng(width, height, rgba) {
  const signature = Buffer.from("89504e470d0a1a0a", "hex");
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowLength = 1 + width * 4;
  const raw = Buffer.alloc(rowLength * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowLength;
    raw[rowStart] = 0;
    for (let x = 0; x < width; x += 1) {
      const pixelStart = rowStart + 1 + x * 4;
      raw[pixelStart] = rgba[0];
      raw[pixelStart + 1] = rgba[1];
      raw[pixelStart + 2] = rgba[2];
      raw[pixelStart + 3] = rgba[3];
    }
  }

  return Buffer.concat([
    signature,
    createPngChunk("IHDR", ihdr),
    createPngChunk("IDAT", deflateSync(raw)),
    createPngChunk("IEND", Buffer.alloc(0))
  ]);
}

function createPngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([length, typeBytes, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

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
