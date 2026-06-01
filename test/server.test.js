import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createAssetServer } from "../src/server.js";

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
