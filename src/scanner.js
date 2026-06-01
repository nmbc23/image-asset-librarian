import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { inflateSync } from "node:zlib";

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

const THEME_RULES = [
  ["character", ["avatar", "character", "mascot", "person", "people", "model", "npc"]],
  ["portrait", ["portrait", "face", "headshot", "selfie"]],
  ["background", ["background", "backdrop", "wallpaper"]],
  ["landscape", ["landscape", "scenery", "scene", "environment", "forest", "mountain", "sky", "city", "street", "ocean"]],
  ["nature", ["flower", "rose", "tree", "forest", "mountain", "sky", "ocean", "river", "garden", "nature"]],
  ["icon", ["icon", "glyph", "symbol", "sprite", "favicon"]],
  ["logo", ["logo", "brand", "mark", "badge", "emblem", "wordmark"]],
  ["pattern", ["pattern", "texture", "material", "tile", "seamless"]],
  ["ui", ["ui", "screen", "screenshot", "wireframe", "dashboard"]],
  ["product", ["product", "packshot", "mockup", "item", "commerce"]],
  ["illustration", ["illustration", "anime", "manga", "comic", "drawing", "concept", "art"]]
];

const COLOR_THEME_RULES = [
  ["warm", ["warm", "red", "orange", "yellow", "gold", "amber", "pink", "rose", "coral", "peach", "sunset"]],
  ["cool", ["cool", "blue", "cyan", "teal", "mint", "aqua", "azure", "navy", "purple", "violet"]],
  ["green", ["green", "forest", "leaf", "lime", "mint", "olive"]],
  ["dark", ["dark", "night", "black", "shadow"]],
  ["light", ["light", "white", "bright", "pastel", "cream"]],
  ["vivid", ["vivid", "neon", "saturated"]],
  ["muted", ["muted", "soft", "desaturated", "dusty"]],
  ["monochrome", ["monochrome", "mono", "grayscale", "greyscale", "gray", "grey", "black", "white"]]
];

const COLOR_THEME_ORDER = COLOR_THEME_RULES.map(([theme]) => theme);
const PNG_COLOR_SAMPLE_LIMIT = 256;
const PNG_COLOR_MAX_PIXELS = 4_000_000;
const PALETTE_COLOR_LIMIT = 5;

const NAMED_COLORS = new Map([
  ["black", "#000000"],
  ["white", "#ffffff"],
  ["red", "#ff0000"],
  ["orange", "#ffa500"],
  ["yellow", "#ffff00"],
  ["gold", "#ffd700"],
  ["pink", "#ffc0cb"],
  ["purple", "#800080"],
  ["violet", "#8f00ff"],
  ["blue", "#0000ff"],
  ["cyan", "#00ffff"],
  ["teal", "#008080"],
  ["green", "#008000"],
  ["lime", "#00ff00"],
  ["gray", "#808080"],
  ["grey", "#808080"]
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
    height: dimensions.height,
    themes: inferAssetThemes({
      relativePath,
      extension,
      width: dimensions.width,
      height: dimensions.height
    }),
    colorThemes: inferAssetColorThemes({
      relativePath,
      extension,
      width: dimensions.width,
      height: dimensions.height,
      bytes
    }),
    palette: inferAssetPalette({
      extension,
      width: dimensions.width,
      height: dimensions.height,
      bytes
    })
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

function inferAssetThemes(asset) {
  const haystack = tokenizeThemeText(asset.relativePath);
  const themes = [];

  for (const [theme, terms] of THEME_RULES) {
    if (terms.some((term) => haystack.has(term))) {
      themes.push(theme);
    }
  }

  if (!themes.length) {
    const shapeTheme = inferShapeTheme(asset.width, asset.height);
    if (shapeTheme) {
      themes.push(shapeTheme);
    }
  }

  if (asset.extension === ".svg") {
    themes.push("vector");
  }

  return [...new Set(themes)].slice(0, 6);
}

function inferAssetColorThemes(asset) {
  const haystack = tokenizeThemeText(asset.relativePath);
  const themes = [];

  for (const [theme, terms] of COLOR_THEME_RULES) {
    if (terms.some((term) => haystack.has(term))) {
      themes.push(theme);
    }
  }

  if (asset.extension === ".svg") {
    const svg = asset.bytes.toString("utf8");
    for (const color of extractSvgColors(svg)) {
      themes.push(...classifyRgbColor(color));
    }
  } else if (asset.extension === ".png") {
    for (const color of extractPngSampleColors(asset.bytes, asset.width, asset.height)) {
      themes.push(...classifyRgbColor(color));
    }
  }

  return sortColorThemes([...new Set(themes)]).slice(0, 6);
}

function inferAssetPalette(asset) {
  if (asset.extension === ".svg") {
    return createColorPalette(extractSvgColors(asset.bytes.toString("utf8")));
  }
  if (asset.extension === ".png") {
    return createColorPalette(extractPngSampleColors(asset.bytes, asset.width, asset.height));
  }
  return [];
}

function createColorPalette(colors) {
  const colorCounts = new Map();

  for (const color of colors) {
    const hex = formatHexColor(color);
    if (!colorCounts.has(hex)) {
      colorCounts.set(hex, { color: hex, count: 0, order: colorCounts.size });
    }
    colorCounts.get(hex).count += 1;
  }

  return [...colorCounts.values()]
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .map((entry) => entry.color)
    .slice(0, PALETTE_COLOR_LIMIT);
}

function sortColorThemes(themes) {
  return [...themes].sort((a, b) => {
    const aIndex = COLOR_THEME_ORDER.indexOf(a);
    const bIndex = COLOR_THEME_ORDER.indexOf(b);
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex) || a.localeCompare(b);
  });
}

function inferShapeTheme(width, height) {
  const numericWidth = Number(width);
  const numericHeight = Number(height);
  if (!Number.isFinite(numericWidth) || !Number.isFinite(numericHeight) || numericWidth <= 0 || numericHeight <= 0) {
    return null;
  }
  if (Math.abs(numericWidth - numericHeight) / Math.max(numericWidth, numericHeight) <= 0.08) {
    return "square";
  }
  return numericWidth > numericHeight ? "landscape" : "portrait";
}

function tokenizeThemeText(value) {
  return new Set(
    String(value ?? "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
  );
}

function extractSvgColors(svg) {
  const colors = new Map();

  for (const match of String(svg ?? "").matchAll(/#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/gi)) {
    const color = parseCssColor(match[0]);
    if (color) {
      colors.set(`${color.r},${color.g},${color.b}`, color);
    }
  }

  for (const match of String(svg ?? "").matchAll(/\b(?:fill|stroke|stop-color)\s*=\s*["']([^"']+)["']/gi)) {
    const color = parseCssColor(match[1]);
    if (color) {
      colors.set(`${color.r},${color.g},${color.b}`, color);
    }
  }

  return [...colors.values()];
}

function extractPngSampleColors(bytes, width, height) {
  const pixelCount = Number(width) * Number(height);
  if (!Number.isFinite(pixelCount) || pixelCount <= 0 || pixelCount > PNG_COLOR_MAX_PIXELS) {
    return [];
  }

  try {
    const png = readPngColorData(bytes);
    if (!png || png.bitDepth !== 8) {
      return [];
    }

    const colorType = png.colorType;
    const bytesPerPixel = getPngBytesPerPixel(colorType);
    if (!bytesPerPixel) {
      return [];
    }

    const rowBytes = getPngRowByteLength(png.width, colorType);
    if (!rowBytes || !png.idat.length) {
      return [];
    }

    const inflated = inflateSync(Buffer.concat(png.idat));
    const colors = [];
    const sampleEvery = Math.max(1, Math.floor((png.width * png.height) / PNG_COLOR_SAMPLE_LIMIT));
    let offset = 0;
    let previousRow = Buffer.alloc(rowBytes);
    let pixelIndex = 0;

    for (let y = 0; y < png.height; y += 1) {
      if (offset + 1 + rowBytes > inflated.length) {
        return [];
      }
      const filterType = inflated[offset];
      offset += 1;
      const row = Buffer.from(inflated.subarray(offset, offset + rowBytes));
      offset += rowBytes;
      unfilterPngRow(row, previousRow, bytesPerPixel, filterType);

      for (let x = 0; x < png.width; x += 1) {
        if (pixelIndex % sampleEvery === 0) {
          const color = readPngPixelColor(row, x, colorType, png.palette);
          if (color) {
            colors.push(color);
          }
        }
        pixelIndex += 1;
      }

      previousRow = row;
    }

    return colors;
  } catch {
    return [];
  }
}

function readPngColorData(bytes) {
  if (bytes.length < 33 || bytes.toString("ascii", 1, 4) !== "PNG") {
    return null;
  }

  const png = {
    width: null,
    height: null,
    bitDepth: null,
    colorType: null,
    palette: [],
    idat: []
  };
  let offset = 8;

  while (offset + 8 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd > bytes.length) {
      return null;
    }

    const data = bytes.subarray(dataStart, dataEnd);
    if (type === "IHDR") {
      png.width = data.readUInt32BE(0);
      png.height = data.readUInt32BE(4);
      png.bitDepth = data[8];
      png.colorType = data[9];
    } else if (type === "PLTE") {
      png.palette = readPngPalette(data);
    } else if (type === "IDAT") {
      png.idat.push(data);
    } else if (type === "IEND") {
      break;
    }

    offset = dataEnd + 4;
  }

  return Number.isFinite(png.width) && Number.isFinite(png.height) ? png : null;
}

function readPngPalette(data) {
  const palette = [];
  for (let offset = 0; offset + 2 < data.length; offset += 3) {
    palette.push({
      r: data[offset],
      g: data[offset + 1],
      b: data[offset + 2]
    });
  }
  return palette;
}

function getPngBytesPerPixel(colorType) {
  if (colorType === 0 || colorType === 3) {
    return 1;
  }
  if (colorType === 2) {
    return 3;
  }
  if (colorType === 4) {
    return 2;
  }
  if (colorType === 6) {
    return 4;
  }
  return null;
}

function getPngRowByteLength(width, colorType) {
  const bytesPerPixel = getPngBytesPerPixel(colorType);
  return bytesPerPixel ? width * bytesPerPixel : null;
}

function unfilterPngRow(row, previousRow, bytesPerPixel, filterType) {
  if (filterType === 0) {
    return;
  }

  for (let index = 0; index < row.length; index += 1) {
    const left = index >= bytesPerPixel ? row[index - bytesPerPixel] : 0;
    const up = previousRow[index] ?? 0;
    const upperLeft = index >= bytesPerPixel ? previousRow[index - bytesPerPixel] ?? 0 : 0;

    if (filterType === 1) {
      row[index] = (row[index] + left) & 0xff;
    } else if (filterType === 2) {
      row[index] = (row[index] + up) & 0xff;
    } else if (filterType === 3) {
      row[index] = (row[index] + Math.floor((left + up) / 2)) & 0xff;
    } else if (filterType === 4) {
      row[index] = (row[index] + paethPredictor(left, up, upperLeft)) & 0xff;
    } else {
      throw new Error(`Unsupported PNG filter type: ${filterType}`);
    }
  }
}

function paethPredictor(left, up, upperLeft) {
  const estimate = left + up - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upperLeftDistance = Math.abs(estimate - upperLeft);

  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) {
    return left;
  }
  return upDistance <= upperLeftDistance ? up : upperLeft;
}

function readPngPixelColor(row, x, colorType, palette) {
  if (colorType === 0) {
    const value = row[x];
    return { r: value, g: value, b: value };
  }
  if (colorType === 2) {
    const offset = x * 3;
    return { r: row[offset], g: row[offset + 1], b: row[offset + 2] };
  }
  if (colorType === 3) {
    return palette[row[x]] ?? null;
  }
  if (colorType === 4) {
    const offset = x * 2;
    if (row[offset + 1] < 128) {
      return null;
    }
    return { r: row[offset], g: row[offset], b: row[offset] };
  }
  if (colorType === 6) {
    const offset = x * 4;
    if (row[offset + 3] < 128) {
      return null;
    }
    return { r: row[offset], g: row[offset + 1], b: row[offset + 2] };
  }
  return null;
}

function parseCssColor(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized || normalized === "none" || normalized === "transparent" || normalized === "currentcolor") {
    return null;
  }

  const namedHex = NAMED_COLORS.get(normalized);
  if (namedHex) {
    return parseHexColor(namedHex);
  }

  const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    return parseHexColor(hexMatch[0]);
  }

  const rgbMatch = normalized.match(/^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/i);
  if (rgbMatch) {
    return {
      r: clampColor(Number.parseInt(rgbMatch[1], 10)),
      g: clampColor(Number.parseInt(rgbMatch[2], 10)),
      b: clampColor(Number.parseInt(rgbMatch[3], 10))
    };
  }

  return null;
}

function parseHexColor(value) {
  const hex = String(value).replace("#", "");
  const expanded = hex.length === 3
    ? hex.split("").map((character) => `${character}${character}`).join("")
    : hex;

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16)
  };
}

function formatHexColor(color) {
  return `#${[color.r, color.g, color.b].map((component) => clampColor(component).toString(16).padStart(2, "0")).join("")}`;
}

function classifyRgbColor(color) {
  const { hue, saturation, lightness } = rgbToHsl(color);
  const themes = [];

  if (lightness < 0.18) {
    themes.push("dark");
  } else if (lightness > 0.82) {
    themes.push("light");
  }

  if (saturation < 0.08) {
    themes.push("monochrome");
    return themes;
  }

  if (hue < 65 || hue >= 300) {
    themes.push("warm");
  }
  if (hue >= 65 && hue < 175) {
    themes.push("green");
  }
  if (hue >= 150 && hue < 300) {
    themes.push("cool");
  }

  if (saturation > 0.45 && lightness > 0.14 && lightness < 0.86) {
    themes.push("vivid");
  } else if (saturation < 0.28) {
    themes.push("muted");
  }

  return themes;
}

function rgbToHsl(color) {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { hue: 0, saturation: 0, lightness };
  }

  const delta = max - min;
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue;

  if (max === r) {
    hue = 60 * (((g - b) / delta) % 6);
  } else if (max === g) {
    hue = 60 * ((b - r) / delta + 2);
  } else {
    hue = 60 * ((r - g) / delta + 4);
  }

  return {
    hue: hue < 0 ? hue + 360 : hue,
    saturation,
    lightness
  };
}

function clampColor(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(255, value));
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
