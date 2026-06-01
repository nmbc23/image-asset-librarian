import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadConfig } from "../src/config.js";
import { createAssetServer, ensureIndexFile, listenOnAvailablePort } from "../src/server.js";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

async function main() {
  const config = await loadConfig(path.join(projectRoot, "asset-librarian.config.json"));
  await ensureIndexFile(config);

  const result = await listenOnAvailablePort(
    () => createAssetServer({
      indexPath: config.outputPath,
      publicDir: path.join(projectRoot, "public")
    }),
    { host: "127.0.0.1", port: 0 }
  );
  const origin = `http://${result.host}:${result.port}`;

  try {
    const home = await fetch(origin);
    const index = await fetch(`${origin}/api/index`);
    const app = await fetch(`${origin}/app.js`);
    const indexJson = await index.json();

    assert.equal(home.status, 200);
    assert.equal(index.status, 200);
    assert.equal(app.status, 200);
    assert.ok(indexJson.summary.totalAssets > 0, "sample index should include assets");
    assert.match(await home.text(), /Image Asset Librarian/);
    assert.match(await app.text(), /Scan path/);

    console.log(`Smoke passed: ${origin}`);
    console.log(`Indexed ${indexJson.summary.totalAssets} sample asset(s).`);
  } finally {
    await new Promise((resolve) => result.server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
