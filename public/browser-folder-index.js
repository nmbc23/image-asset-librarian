const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  ".avif",
  ".bmp",
  ".gif",
  ".jpe",
  ".jpeg",
  ".jfif",
  ".jpg",
  ".png",
  ".svg",
  ".tif",
  ".tiff",
  ".webp"
]);

export async function createBrowserFolderIndex(directoryHandle, options = {}) {
  const rootName = String(directoryHandle?.name ?? "Selected folder").trim() || "Selected folder";
  const errors = [];
  const files = [];

  await collectImageFiles(directoryHandle, "", files, errors, options.onProgress);

  return createBrowserIndex(rootName, files, errors, options);
}

export async function createBrowserFileListIndex(fileList, options = {}) {
  const sourceFiles = [...(fileList ?? [])];
  const rootName = getFileListRootName(sourceFiles, options.rootName);
  const errors = [];
  const files = [];

  for (const file of sourceFiles) {
    const relativePath = getFileListRelativePath(file, rootName);
    const extension = getExtension(file?.name || relativePath);
    if (!SUPPORTED_IMAGE_EXTENSIONS.has(extension)) {
      continue;
    }

    files.push({ file, relativePath, extension });
    options.onProgress?.({
      phase: "collecting",
      scanned: files.length,
      path: relativePath
    });
  }

  return createBrowserIndex(rootName, files, errors, options);
}

async function createBrowserIndex(rootName, files, errors, options = {}) {
  const hashFiles = Boolean(options.hashFiles);
  const readDimensions = Boolean(options.readImageDimensions) || typeof options.readDimensions === "function";
  const assets = [];

  for (const [index, entry] of files.entries()) {
    options.onProgress?.({
      phase: "indexing",
      scanned: index + 1,
      total: files.length,
      path: entry.relativePath
    });

    const objectUrl = (options.createObjectUrl ?? defaultCreateObjectUrl)(entry.file);
    const hash = hashFiles ? await safeDigestFile(entry.file, entry.relativePath, errors) : null;
    const dimensions = readDimensions
      ? await safeReadDimensions(entry.file, objectUrl, entry.extension, entry.relativePath, options.readDimensions)
      : { width: null, height: null };
    const assetId = (await digestText(`${entry.relativePath}:${entry.file.size}:${entry.file.lastModified ?? ""}:${hash ?? ""}`)).slice(0, 20);

    assets.push({
      id: assetId,
      name: entry.file.name,
      path: `${rootName}/${entry.relativePath}`,
      relativePath: entry.relativePath,
      rootName,
      rootPath: rootName,
      extension: entry.extension,
      sizeBytes: entry.file.size,
      modifiedAt: new Date(entry.file.lastModified || Date.now()).toISOString(),
      hash,
      width: dimensions.width,
      height: dimensions.height,
      themes: inferThemes(entry.relativePath, entry.extension, dimensions),
      colorThemes: inferColorThemes(entry.relativePath),
      palette: [],
      metadata: {
        title: "",
        description: "",
        text: []
      },
      objectUrl
    });
  }

  assets.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  const duplicates = createDuplicateGroups(assets);
  const similarGroups = createSimilarGroups(assets);
  const totalBytes = assets.reduce((sum, asset) => sum + asset.sizeBytes, 0);
  const duplicateAssetIds = new Set(duplicates.flatMap((group) => group.assetIds));

  return {
    version: 1,
    mode: "browser-folder",
    generatedAt: options.now ?? new Date().toISOString(),
    roots: [{
      name: rootName,
      path: rootName,
      kind: "browser-folder"
    }],
    summary: {
      totalAssets: assets.length,
      totalBytes,
      duplicateGroups: duplicates.length,
      duplicateAssets: duplicateAssetIds.size,
      similarGroups: similarGroups.length,
      similarAssets: new Set(similarGroups.flatMap((group) => group.assetIds)).size,
      metadataAssets: 0,
      reclaimableBytes: duplicates.reduce((sum, group) => sum + group.reclaimableBytes, 0),
      roots: 1,
      extensions: countBy(assets, "extension"),
      sources: countBy(assets, "rootName")
    },
    assets,
    duplicates,
    similarGroups,
    errors
  };
}

async function collectImageFiles(directoryHandle, prefix, files, errors, onProgress) {
  try {
    for await (const [name, handle] of getDirectoryEntries(directoryHandle)) {
      const relativePath = prefix ? `${prefix}/${name}` : name;
      if (handle.kind === "directory") {
        await collectImageFiles(handle, relativePath, files, errors, onProgress);
        continue;
      }
      if (handle.kind !== "file") {
        continue;
      }

      const extension = getExtension(name);
      if (!SUPPORTED_IMAGE_EXTENSIONS.has(extension)) {
        continue;
      }

      try {
        const file = await handle.getFile();
        files.push({ file, relativePath, extension });
        onProgress?.({
          phase: "collecting",
          scanned: files.length,
          path: relativePath
        });
      } catch (error) {
        errors.push({ path: relativePath, message: error.message });
      }
    }
  } catch (error) {
    errors.push({ path: prefix || directoryHandle?.name || "", message: error.message });
  }
}

function getDirectoryEntries(directoryHandle) {
  if (directoryHandle && typeof directoryHandle.entries === "function") {
    return directoryHandle.entries();
  }
  if (directoryHandle && typeof directoryHandle.values === "function") {
    return mapDirectoryValues(directoryHandle.values());
  }
  throw new Error("Selected folder cannot be read by this browser");
}

async function* mapDirectoryValues(values) {
  for await (const handle of values) {
    yield [handle.name, handle];
  }
}

function getFileListRootName(files, fallbackName) {
  const fallback = String(fallbackName ?? "Selected folder").trim() || "Selected folder";
  for (const file of files) {
    const segments = splitRelativePath(file?.webkitRelativePath || file?.relativePath || "");
    if (segments.length > 1) {
      return segments[0];
    }
  }
  return fallback;
}

function getFileListRelativePath(file, rootName) {
  const pathSegments = splitRelativePath(file?.webkitRelativePath || file?.relativePath || file?.name || "");
  if (pathSegments.length > 1 && pathSegments[0] === rootName) {
    return pathSegments.slice(1).join("/");
  }
  return pathSegments.join("/") || String(file?.name ?? "untitled");
}

function splitRelativePath(relativePath) {
  return String(relativePath ?? "")
    .replaceAll("\\", "/")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

async function safeReadDimensions(file, objectUrl, extension, relativePath, readDimensions = defaultReadDimensions) {
  try {
    const dimensions = await readDimensions(file, objectUrl, extension, relativePath);
    return normalizeDimensions(dimensions);
  } catch {
    return { width: null, height: null };
  }
}

async function defaultReadDimensions(file, objectUrl, extension) {
  if (extension === ".svg" && typeof file.text === "function") {
    const text = await file.text();
    const svgDimensions = readSvgDimensions(text);
    if (svgDimensions.width && svgDimensions.height) {
      return svgDimensions;
    }
  }

  if (typeof Image === "undefined") {
    return { width: null, height: null };
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({ width: null, height: null });
    image.src = objectUrl;
  });
}

function readSvgDimensions(text) {
  const width = Number.parseFloat(text.match(/\bwidth=["']?([0-9.]+)/i)?.[1] ?? "");
  const height = Number.parseFloat(text.match(/\bheight=["']?([0-9.]+)/i)?.[1] ?? "");
  if (Number.isFinite(width) && Number.isFinite(height)) {
    return { width, height };
  }

  const viewBox = text.match(/\bviewBox=["']?([0-9.\s-]+)/i)?.[1]?.trim().split(/\s+/).map(Number);
  if (viewBox?.length === 4 && Number.isFinite(viewBox[2]) && Number.isFinite(viewBox[3])) {
    return { width: viewBox[2], height: viewBox[3] };
  }

  return { width: null, height: null };
}

function normalizeDimensions(dimensions) {
  const width = Number(dimensions?.width);
  const height = Number(dimensions?.height);
  return {
    width: Number.isFinite(width) && width > 0 ? width : null,
    height: Number.isFinite(height) && height > 0 ? height : null
  };
}

function defaultCreateObjectUrl(file) {
  return URL.createObjectURL(file);
}

async function digestFile(file) {
  return digestBuffer(await file.arrayBuffer());
}

async function safeDigestFile(file, relativePath, errors) {
  try {
    return await digestFile(file);
  } catch (error) {
    errors.push({ path: relativePath, message: `Could not hash file: ${error.message}` });
    return null;
  }
}

async function digestText(value) {
  return digestBuffer(new TextEncoder().encode(value));
}

async function digestBuffer(buffer) {
  if (!globalThis.crypto?.subtle) {
    return digestBufferFallback(buffer);
  }
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function digestBufferFallback(buffer) {
  const bytes = new Uint8Array(buffer);
  let hash = 2166136261;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 16777619);
  }
  return hash.toString(16).padStart(8, "0");
}

function createDuplicateGroups(assets) {
  const groups = new Map();
  for (const asset of assets) {
    if (!asset.hash) {
      continue;
    }
    if (!groups.has(asset.hash)) {
      groups.set(asset.hash, []);
    }
    groups.get(asset.hash).push(asset);
  }

  return [...groups.entries()]
    .filter(([, groupAssets]) => groupAssets.length > 1)
    .map(([hash, groupAssets]) => {
      const totalBytes = groupAssets.reduce((sum, asset) => sum + asset.sizeBytes, 0);
      const keepBytes = Math.max(...groupAssets.map((asset) => asset.sizeBytes));
      return {
        hash,
        count: groupAssets.length,
        assetIds: groupAssets.map((asset) => asset.id),
        totalBytes,
        reclaimableBytes: totalBytes - keepBytes
      };
    });
}

function createSimilarGroups(assets) {
  const groups = new Map();
  for (const asset of assets) {
    const orientation = getOrientation(asset);
    const theme = asset.themes.find((candidate) => !["vector", "portrait", "landscape", "square"].includes(candidate)) ?? orientation;
    const color = asset.colorThemes[0] ?? "";
    const signature = [theme, color, asset.extension].filter(Boolean).join(":");
    if (!signature || signature === "unknown") {
      continue;
    }
    if (!groups.has(signature)) {
      groups.set(signature, []);
    }
    groups.get(signature).push(asset);
  }

  return [...groups.entries()]
    .filter(([, groupAssets]) => groupAssets.length > 1)
    .map(([signature, groupAssets]) => ({
      signature,
      label: formatSimilarGroupLabel(signature),
      query: signature.split(":").filter(Boolean).join(" "),
      count: groupAssets.length,
      assetIds: groupAssets.map((asset) => asset.id)
    }));
}

function inferThemes(relativePath, extension, dimensions) {
  const text = relativePath.toLowerCase();
  const themes = [];
  const orientation = getOrientation(dimensions);

  if (orientation !== "unknown") {
    themes.push(orientation);
  }
  if (extension === ".svg") {
    themes.push("vector");
  }
  if (/portrait|character|face|avatar|person|figure/.test(text)) {
    themes.push("character");
  }
  if (/landscape|terrain|city|street|room|interior|exterior|terrace|scene/.test(text)) {
    themes.push("environment");
  }
  if (/icon|logo|badge|symbol/.test(text)) {
    themes.push("icon");
  }
  if (/sheet|reference|turnaround|grid/.test(text)) {
    themes.push("reference");
  }

  return uniqueStrings(themes);
}

function inferColorThemes(relativePath) {
  const text = relativePath.toLowerCase();
  const themes = [];
  if (/mint|green|forest|leaf/.test(text)) themes.push("green");
  if (/neon|bright|vivid|glow/.test(text)) themes.push("vivid");
  if (/dark|night|shadow/.test(text)) themes.push("dark");
  if (/light|white|pale/.test(text)) themes.push("light");
  if (/warm|orange|red|gold|sun/.test(text)) themes.push("warm");
  if (/cool|blue|cyan|ice/.test(text)) themes.push("cool");
  return uniqueStrings(themes);
}

function getOrientation(asset) {
  if (!asset?.width || !asset?.height) {
    return "unknown";
  }
  if (asset.width === asset.height) {
    return "square";
  }
  return asset.width > asset.height ? "landscape" : "portrait";
}

function getExtension(name) {
  return (String(name ?? "").match(/(\.[a-z0-9]+)$/i)?.[1] ?? "").toLowerCase();
}

function countBy(assets, key) {
  return assets.reduce((counts, asset) => {
    const value = asset[key] ?? "Unknown";
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function formatSimilarGroupLabel(signature) {
  return signature
    .split(":")
    .filter(Boolean)
    .map((part) => part.replace(/^\./, "").toUpperCase())
    .join(" / ");
}

function uniqueStrings(values) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}
