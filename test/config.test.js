import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadConfig } from "../src/config.js";

async function withTempProject(run) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "image-asset-librarian-config-"));
  try {
    await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("loadConfig resolves roots and output paths relative to the config file", async () => {
  await withTempProject(async (dir) => {
    const configDir = path.join(dir, "configs");
    await mkdir(configDir);
    const configPath = path.join(configDir, "demo.json");
    await writeFile(
      configPath,
      JSON.stringify({
        roots: [{ name: "Demo", path: "../sample-library" }],
        output: "../data/index.json"
      })
    );

    const config = await loadConfig(configPath);

    assert.equal(config.configPath, configPath);
    assert.deepEqual(config.roots, [
      { name: "Demo", path: path.join(dir, "sample-library") }
    ]);
    assert.equal(config.outputPath, path.join(dir, "data", "index.json"));
  });
});

test("loadConfig accepts string roots and derives a readable source name", async () => {
  await withTempProject(async (dir) => {
    const configPath = path.join(dir, "asset-librarian.config.json");
    await writeFile(
      configPath,
      JSON.stringify({
        roots: ["sample-library"]
      })
    );

    const config = await loadConfig(configPath);

    assert.equal(config.roots[0].name, "sample-library");
    assert.equal(config.roots[0].path, path.join(dir, "sample-library"));
    assert.equal(config.outputPath, path.join(dir, "data", "index.json"));
  });
});

test("loadConfig accepts UTF-8 JSON files with a BOM", async () => {
  await withTempProject(async (dir) => {
    const configPath = path.join(dir, "asset-librarian.config.json");
    await writeFile(
      configPath,
      `\uFEFF${JSON.stringify({
        roots: ["sample-library"],
        output: "data/index.json"
      })}`,
      "utf8"
    );

    const config = await loadConfig(configPath);

    assert.equal(config.roots[0].path, path.join(dir, "sample-library"));
    assert.equal(config.outputPath, path.join(dir, "data", "index.json"));
  });
});
