import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadConfig } from "./config.js";
import { scanLibrary } from "./scanner.js";

const modulePath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(modulePath), "..");

export async function runCli(argv = process.argv.slice(2)) {
  const command = argv[0] ?? "help";

  if (command === "scan") {
    const configPath = readFlag(argv, "--config") ?? path.join(projectRoot, "asset-librarian.config.json");
    const config = await loadConfig(configPath);
    const outputPath = readFlag(argv, "--out") ? path.resolve(readFlag(argv, "--out")) : config.outputPath;
    const index = await scanLibrary({ roots: config.roots });

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");

    console.log(`Indexed ${index.summary.totalAssets} image asset(s).`);
    console.log(`Duplicate groups: ${index.summary.duplicateGroups}.`);
    console.log(`Wrote ${outputPath}`);
    if (index.errors.length) {
      console.log(`Scan warnings: ${index.errors.length}.`);
    }
    return;
  }

  console.log(`Usage:
  node src/cli.js scan [--config asset-librarian.config.json] [--out data/index.json]

Examples:
  npm run scan
  node src/cli.js scan --config examples/local.config.json --out data/index.json`);
}

function readFlag(argv, flag) {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : null;
}

if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  runCli().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
