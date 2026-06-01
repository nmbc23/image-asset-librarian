import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createAssetServer, ensureIndexFile, listenOnAvailablePort } from "../src/server.js";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="#3949ab"/></svg>`;

async function withTempServer(run) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "image-asset-librarian-server-"));
  const publicDir = path.join(dir, "public");
  const dataDir = path.join(dir, "data");
  await mkdir(publicDir);
  await mkdir(dataDir);

  const assetPath = path.join(dir, "image.svg");
  const indexPath = path.join(dataDir, "index.json");
  await writeFile(path.join(publicDir, "index.html"), "<main>Gallery</main>");
  await writeFile(assetPath, svg);
  await writeFile(
    indexPath,
    JSON.stringify({
      version: 1,
      generatedAt: "2026-06-01T00:00:00.000Z",
      roots: [],
      summary: { totalAssets: 1 },
      assets: [{ id: "asset-one", path: assetPath, extension: ".svg" }],
      duplicates: [],
      errors: []
    })
  );

  const server = createAssetServer({ indexPath, publicDir });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    const address = server.address();
    await run(`http://${address.address}:${address.port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
}

test("createAssetServer serves the static app, index JSON, and indexed assets", async () => {
  await withTempServer(async (origin) => {
    const home = await fetch(origin);
    const api = await fetch(`${origin}/api/index`);
    const asset = await fetch(`${origin}/assets/asset-one`);

    assert.equal(home.status, 200);
    assert.equal(await home.text(), "<main>Gallery</main>");
    assert.equal(api.status, 200);
    assert.equal((await api.json()).summary.totalAssets, 1);
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get("content-type"), "image/svg+xml");
    assert.equal(await asset.text(), svg);
  });
});

test("createAssetServer scans a posted image folder and refreshes the index", async () => {
  await withTempServer(async (origin) => {
    const scanDir = path.join(os.tmpdir(), `image-asset-librarian-scan-${Date.now()}`);
    await mkdir(scanDir, { recursive: true });
    await writeFile(path.join(scanDir, "posted.svg"), svg);

    try {
      const scan = await fetch(`${origin}/api/scan`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ folderPath: scanDir })
      });
      const scanJson = await scan.json();
      const api = await fetch(`${origin}/api/index`);
      const index = await api.json();
      const asset = await fetch(`${origin}/assets/${index.assets[0].id}`);

      assert.equal(scan.status, 200);
      assert.equal(scanJson.summary.totalAssets, 1);
      assert.equal(scanJson.roots[0].path, scanDir);
      assert.equal(index.assets[0].name, "posted.svg");
      assert.equal(index.roots[0].name, path.basename(scanDir));
      assert.equal(asset.status, 200);
      assert.equal(asset.headers.get("content-type"), "image/svg+xml");
    } finally {
      await rm(scanDir, { recursive: true, force: true });
    }
  });
});

test("createAssetServer rejects missing scan folders without replacing the index", async () => {
  await withTempServer(async (origin) => {
    const missingDir = path.join(os.tmpdir(), `missing-image-folder-${Date.now()}`);
    const scan = await fetch(`${origin}/api/scan`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ folderPath: missingDir })
    });
    const scanJson = await scan.json();
    const api = await fetch(`${origin}/api/index`);
    const index = await api.json();

    assert.equal(scan.status, 400);
    assert.equal(scanJson.error, "Folder not found");
    assert.equal(index.summary.totalAssets, 1);
    assert.equal(index.assets[0].id, "asset-one");
  });
});

test("ensureIndexFile creates a missing index from configured roots", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "image-asset-librarian-ensure-"));
  try {
    const sampleDir = path.join(dir, "sample-library");
    const indexPath = path.join(dir, "data", "index.json");
    await mkdir(sampleDir, { recursive: true });
    await writeFile(path.join(sampleDir, "sample.svg"), svg);

    const result = await ensureIndexFile({
      roots: [{ name: "Sample", path: sampleDir }],
      outputPath: indexPath
    });
    const index = JSON.parse(await readFile(indexPath, "utf8"));

    assert.equal(result.created, true);
    assert.equal(index.summary.totalAssets, 1);
    assert.equal(index.assets[0].name, "sample.svg");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("ensureIndexFile keeps an existing index in place", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "image-asset-librarian-ensure-existing-"));
  try {
    const sampleDir = path.join(dir, "sample-library");
    const indexPath = path.join(dir, "data", "index.json");
    await mkdir(sampleDir, { recursive: true });
    await mkdir(path.dirname(indexPath), { recursive: true });
    await writeFile(path.join(sampleDir, "sample.svg"), svg);
    await writeFile(indexPath, JSON.stringify({ version: 1, summary: { totalAssets: 99 } }));

    const result = await ensureIndexFile({
      roots: [{ name: "Sample", path: sampleDir }],
      outputPath: indexPath
    });
    const index = JSON.parse(await readFile(indexPath, "utf8"));

    assert.equal(result.created, false);
    assert.equal(index.summary.totalAssets, 99);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("listenOnAvailablePort skips an occupied port", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "image-asset-librarian-port-"));
  const occupiedServer = http.createServer((request, response) => response.end("occupied"));
  let appServer;

  try {
    const publicDir = path.join(dir, "public");
    const dataDir = path.join(dir, "data");
    const assetPath = path.join(dir, "image.svg");
    const indexPath = path.join(dataDir, "index.json");
    await mkdir(publicDir);
    await mkdir(dataDir);
    await writeFile(path.join(publicDir, "index.html"), "<main>Gallery</main>");
    await writeFile(assetPath, svg);
    await writeFile(
      indexPath,
      JSON.stringify({
        version: 1,
        generatedAt: "2026-06-01T00:00:00.000Z",
        roots: [],
        summary: { totalAssets: 1 },
        assets: [{ id: "asset-one", path: assetPath, extension: ".svg" }],
        duplicates: [],
        errors: []
      })
    );

    await new Promise((resolve) => occupiedServer.listen(0, "127.0.0.1", resolve));
    const occupiedPort = occupiedServer.address().port;
    const result = await listenOnAvailablePort(
      () => createAssetServer({ indexPath, publicDir }),
      { host: "127.0.0.1", port: occupiedPort, attempts: 2 }
    );
    appServer = result.server;

    const response = await fetch(`http://127.0.0.1:${result.port}/`);
    assert.equal(result.port, occupiedPort + 1);
    assert.equal(response.status, 200);
  } finally {
    if (appServer) {
      await new Promise((resolve) => appServer.close(resolve));
    }
    await new Promise((resolve) => occupiedServer.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});
