import { readFile } from "node:fs/promises";
import path from "node:path";

export const DEFAULT_CONFIG_FILE = "asset-librarian.config.json";
export const DEFAULT_OUTPUT_FILE = "data/index.json";

export async function loadConfig(configPath = DEFAULT_CONFIG_FILE) {
  const resolvedConfigPath = path.resolve(configPath);
  const configDir = path.dirname(resolvedConfigPath);
  const raw = await readFile(resolvedConfigPath, "utf8");
  const parsed = JSON.parse(raw);

  return {
    configPath: resolvedConfigPath,
    roots: normalizeRoots(parsed.roots ?? [], configDir),
    outputPath: resolveFromConfig(configDir, parsed.output ?? DEFAULT_OUTPUT_FILE)
  };
}

function normalizeRoots(roots, configDir) {
  if (!Array.isArray(roots)) {
    throw new TypeError("Config field `roots` must be an array.");
  }

  return roots.map((root) => {
    if (typeof root === "string") {
      const rootPath = resolveFromConfig(configDir, root);
      return {
        name: path.basename(rootPath) || rootPath,
        path: rootPath
      };
    }

    if (!root || typeof root.path !== "string") {
      throw new TypeError("Every root must be a path string or an object with a `path` field.");
    }

    const rootPath = resolveFromConfig(configDir, root.path);
    return {
      name: root.name || path.basename(rootPath) || rootPath,
      path: rootPath
    };
  });
}

function resolveFromConfig(configDir, value) {
  return path.isAbsolute(value) ? value : path.resolve(configDir, value);
}
