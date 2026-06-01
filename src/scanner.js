import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

export const IMAGE_EXTENSIONS = new Set([
  ".avif",
  ".bmp",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".tif",
  ".tiff",
  ".webp"
]);

export async function scanLibrary(options = {}) {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const roots = normalizeRoots(options.roots ?? []);
  const assets = [];
  const errors = [];

  for (const root of roots) {
    try {
      const rootStat = await stat(root.path);
      if (!rootStat.isDirectory()) {
        errors.push({
          rootName: root.name,
          rootPath: root.path,
          message: "Root is not a directory"
        });
        continue;
      }

      for await (const filePath of walk(root.path)) {
        const extension = path.extname(filePath).toLowerCase();
        if (!IMAGE_EXTENSIONS.has(extension)) {
          continue;
        }

        try {
          assets.push(await createAssetRecord(root, filePath, extension));
        } catch (error) {
          errors.push({
            rootName: root.name,
            rootPath: root.path,
            filePath,
            message: error.message
          });
        }
      }
    } catch (error) {
      errors.push({
        rootName: root.name,
        rootPath: root.path,
        message: error.code === "ENOENT" ? "Root not found" : error.message
      });
    }
  }

  assets.sort((a, b) => a.path.localeCompare(b.path));
  const duplicates = findDuplicates(assets);

  return {
    version: 1,
    generatedAt,
    roots,
    summary: summarize(assets, duplicates),
    assets,
    duplicates,
    errors
  };
}

function normalizeRoots(roots) {
  return roots.map((root) => {
    if (typeof root === "string") {
      const resolvedPath = path.resolve(root);
      return {
        name: path.basename(resolvedPath) || resolvedPath,
        path: resolvedPath
      };
    }

    const resolvedPath = path.resolve(root.path);
    return {
      name: root.name || path.basename(resolvedPath) || resolvedPath,
      path: resolvedPath
    };
  });
}

async function* walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      yield* walk(entryPath);
    } else if (entry.isFile()) {
      yield entryPath;
    }
  }
}

async function createAssetRecord(root, filePath, extension) {
  const [fileStat, bytes] = await Promise.all([stat(filePath), readFile(filePath)]);
  const dimensions = readDimensions(extension, bytes);
  const relativePath = path.relative(root.path, filePath).split(path.sep).join("/");
  const hash = createHash("sha256").update(bytes).digest("hex");

  return {
    id: createAssetId(filePath),
    name: path.basename(filePath),
    path: filePath,
    relativePath,
    rootName: root.name,
    rootPath: root.path,
    extension,
    sizeBytes: fileStat.size,
    modifiedAt: fileStat.mtime.toISOString(),
    hash,
    width: dimensions.width,
    height: dimensions.height
  };
}

function createAssetId(filePath) {
  return createHash("sha1").update(path.resolve(filePath).toLowerCase()).digest("hex").slice(0, 20);
}

function findDuplicates(assets) {
  const byHash = new Map();
  for (const asset of assets) {
    if (!byHash.has(asset.hash)) {
      byHash.set(asset.hash, []);
    }
    byHash.get(asset.hash).push(asset);
  }

  return [...byHash.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([hash, group]) => {
      const totalBytes = group.reduce((sum, asset) => sum + asset.sizeBytes, 0);
      const keepBytes = Math.max(...group.map((asset) => asset.sizeBytes));
      return {
        hash,
        count: group.length,
        assetIds: group.map((asset) => asset.id),
        totalBytes,
        reclaimableBytes: totalBytes - keepBytes
      };
    })
    .sort((a, b) => b.reclaimableBytes - a.reclaimableBytes || b.count - a.count);
}

function summarize(assets, duplicates) {
  return {
    totalAssets: assets.length,
    totalBytes: assets.reduce((sum, asset) => sum + asset.sizeBytes, 0),
    duplicateGroups: duplicates.length,
    duplicateAssets: duplicates.reduce((sum, group) => sum + group.count, 0),
    reclaimableBytes: duplicates.reduce((sum, group) => sum + group.reclaimableBytes, 0),
    roots: new Set(assets.map((asset) => asset.rootName)).size,
    extensions: countBy(assets, "extension"),
    sources: countBy(assets, "rootName")
  };
}

function countBy(assets, field) {
  return assets.reduce((counts, asset) => {
    const value = asset[field];
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function readDimensions(extension, bytes) {
  if (extension === ".svg") {
    return readSvgDimensions(bytes.toString("utf8"));
  }
  if (extension === ".png") {
    return readPngDimensions(bytes);
  }
  if (extension === ".gif") {
    return readGifDimensions(bytes);
  }
  if (extension === ".jpg" || extension === ".jpeg") {
    return readJpegDimensions(bytes);
  }
  if (extension === ".webp") {
    return readWebpDimensions(bytes);
  }
  return { width: null, height: null };
}

function readSvgDimensions(svg) {
  const width = readSvgLength(svg, "width");
  const height = readSvgLength(svg, "height");
  if (width && height) {
    return { width, height };
  }

  const viewBox = svg.match(/\bviewBox=["']\s*([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s*["']/i);
  if (viewBox) {
    return {
      width: Number.parseFloat(viewBox[3]),
      height: Number.parseFloat(viewBox[4])
    };
  }

  return { width: null, height: null };
}

function readSvgLength(svg, attribute) {
  const match = svg.match(new RegExp(`\\b${attribute}=["']\\s*([\\d.]+)(?:px)?\\s*["']`, "i"));
  return match ? Number.parseFloat(match[1]) : null;
}

function readPngDimensions(bytes) {
  if (bytes.length < 24 || bytes.toString("ascii", 1, 4) !== "PNG") {
    return { width: null, height: null };
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20)
  };
}

function readGifDimensions(bytes) {
  if (bytes.length < 10 || bytes.toString("ascii", 0, 3) !== "GIF") {
    return { width: null, height: null };
  }
  return {
    width: bytes.readUInt16LE(6),
    height: bytes.readUInt16LE(8)
  };
}

function readJpegDimensions(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return { width: null, height: null };
  }

  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7)
      };
    }

    offset += 2 + length;
  }

  return { width: null, height: null };
}

function readWebpDimensions(bytes) {
  if (bytes.length < 30 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") {
    return { width: null, height: null };
  }

  const chunkType = bytes.toString("ascii", 12, 16);
  if (chunkType === "VP8X") {
    return {
      width: 1 + bytes.readUIntLE(24, 3),
      height: 1 + bytes.readUIntLE(27, 3)
    };
  }

  if (chunkType === "VP8 " && bytes.length >= 30) {
    return {
      width: bytes.readUInt16LE(26) & 0x3fff,
      height: bytes.readUInt16LE(28) & 0x3fff
    };
  }

  return { width: null, height: null };
}
