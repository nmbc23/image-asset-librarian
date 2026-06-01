import assert from "node:assert/strict";
import test from "node:test";

import { createBrowserFileListIndex, createBrowserFolderIndex } from "../public/browser-folder-index.js";

test("createBrowserFolderIndex builds a local index from a picked directory handle", async () => {
  const root = createDirectoryHandle("Generated", [
    createFileHandle("hero.png", "same pixels", { lastModified: 1_700_000_000_000 }),
    createFileHandle("hero-copy.png", "same pixels", { lastModified: 1_700_000_000_500 }),
    createFileHandle("notes.txt", "ignore me"),
    createDirectoryHandle("archive", [
      createFileHandle("mint-landscape.svg", "<svg></svg>", { lastModified: 1_700_000_001_000 })
    ])
  ]);

  const progressEvents = [];
  const index = await createBrowserFolderIndex(root, {
    hashFiles: true,
    createObjectUrl: (file) => `blob:test/${file.name}`,
    readDimensions: async (file) => file.name.endsWith(".svg")
      ? { width: 900, height: 520 }
      : { width: 1024, height: 1024 },
    now: "2026-06-01T00:00:00.000Z",
    onProgress: (event) => progressEvents.push(event)
  });

  assert.equal(index.version, 1);
  assert.equal(index.mode, "browser-folder");
  assert.equal(index.roots[0].name, "Generated");
  assert.equal(index.summary.totalAssets, 3);
  assert.equal(index.summary.duplicateGroups, 1);
  assert.equal(index.summary.reclaimableBytes, "same pixels".length);
  assert.equal(index.assets[0].rootName, "Generated");
  assert.match(index.assets[0].objectUrl, /^blob:test\//);
  assert.deepEqual(index.assets.map((asset) => asset.relativePath).sort(), [
    "archive/mint-landscape.svg",
    "hero-copy.png",
    "hero.png"
  ]);
  assert.equal(index.duplicates[0].assetIds.length, 2);
  assert.ok(index.similarGroups.length >= 1);
  assert.ok(progressEvents.some((event) => event.phase === "indexing"));
});

test("createBrowserFolderIndex renders browser-picked folders without reading every file byte by default", async () => {
  const root = createDirectoryHandle("Fast", [
    createFileHandle("large.png", "large", {
      arrayBuffer: async () => {
        throw new Error("byte read should not be required for quick gallery mode");
      }
    })
  ]);

  const index = await createBrowserFolderIndex(root, {
    createObjectUrl: (file) => `blob:test/${file.name}`,
    now: "2026-06-01T00:00:00.000Z"
  });

  assert.equal(index.summary.totalAssets, 1);
  assert.equal(index.summary.duplicateGroups, 0);
  assert.equal(index.assets[0].hash, null);
  assert.equal(index.assets[0].width, null);
  assert.equal(index.assets[0].height, null);
  assert.match(index.assets[0].objectUrl, /^blob:test\//);
});

test("createBrowserFolderIndex accepts common JPEG filename variants", async () => {
  const root = createDirectoryHandle("JPEGs", [
    createFileHandle("portrait.JPG", "jpg"),
    createFileHandle("download.jfif", "jfif"),
    createFileHandle("camera.JPE", "jpe")
  ]);

  const index = await createBrowserFolderIndex(root, {
    createObjectUrl: (file) => `blob:test/${file.name}`,
    now: "2026-06-01T00:00:00.000Z"
  });

  assert.deepEqual(index.assets.map((asset) => asset.extension).sort(), [".jfif", ".jpe", ".jpg"]);
});

test("createBrowserFileListIndex builds a local index from a directory file input", async () => {
  const files = [
    createBrowserFile("hero.png", "pixels", "Generated/hero.png"),
    createBrowserFile("notes.txt", "ignore me", "Generated/notes.txt"),
    createBrowserFile("mint-landscape.svg", "<svg></svg>", "Generated/archive/mint-landscape.svg")
  ];

  const index = await createBrowserFileListIndex(files, {
    createObjectUrl: (file) => `blob:test/${file.name}`,
    readDimensions: async (file) => file.name.endsWith(".svg")
      ? { width: 900, height: 520 }
      : { width: 1024, height: 1024 },
    now: "2026-06-01T00:00:00.000Z"
  });

  assert.equal(index.mode, "browser-folder");
  assert.equal(index.roots[0].name, "Generated");
  assert.equal(index.summary.totalAssets, 2);
  assert.deepEqual(index.assets.map((asset) => asset.relativePath).sort(), [
    "archive/mint-landscape.svg",
    "hero.png"
  ]);
});

test("createBrowserFolderIndex records inaccessible files without aborting the whole scan", async () => {
  const root = createDirectoryHandle("Mixed", [
    createFileHandle("good.png", "good"),
    {
      kind: "file",
      name: "broken.png",
      async getFile() {
        throw new Error("permission denied");
      }
    }
  ]);

  const index = await createBrowserFolderIndex(root, {
    createObjectUrl: (file) => `blob:test/${file.name}`,
    readDimensions: async () => ({ width: 512, height: 512 }),
    now: "2026-06-01T00:00:00.000Z"
  });

  assert.equal(index.summary.totalAssets, 1);
  assert.equal(index.errors.length, 1);
  assert.match(index.errors[0].message, /permission denied/);
});

function createDirectoryHandle(name, children) {
  return {
    kind: "directory",
    name,
    async *entries() {
      for (const child of children) {
        yield [child.name, child];
      }
    }
  };
}

function createBrowserFile(name, content, webkitRelativePath, options = {}) {
  const bytes = new TextEncoder().encode(content);
  return {
    name,
    webkitRelativePath,
    size: bytes.byteLength,
    lastModified: options.lastModified ?? 1_700_000_000_000,
    type: options.type ?? "",
    async arrayBuffer() {
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    }
  };
}

function createFileHandle(name, content, options = {}) {
  const bytes = new TextEncoder().encode(content);
  return {
    kind: "file",
    name,
    async getFile() {
      return {
        name,
        size: bytes.byteLength,
        lastModified: options.lastModified ?? 1_700_000_000_000,
        type: options.type ?? "",
        async arrayBuffer() {
          if (options.arrayBuffer) {
            return options.arrayBuffer();
          }
          return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        }
      };
    }
  };
}
