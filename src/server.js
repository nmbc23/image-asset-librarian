import { createReadStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadConfig } from "./config.js";
import { scanLibrary } from "./scanner.js";

const modulePath = fileURLToPath(import.meta.url);
const moduleDir = path.dirname(modulePath);
const projectRoot = path.resolve(moduleDir, "..");

const MIME_TYPES = new Map([
  [".avif", "image/avif"],
  [".bmp", "image/bmp"],
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".jpe", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".jfif", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".tif", "image/tiff"],
  [".tiff", "image/tiff"],
  [".webp", "image/webp"]
]);

export function createAssetServer(options = {}) {
  const indexPath = path.resolve(options.indexPath ?? path.join(projectRoot, "data", "index.json"));
  const publicDir = path.resolve(options.publicDir ?? path.join(projectRoot, "public"));

  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");

      if (request.method === "POST" && url.pathname === "/api/scan") {
        await scanPostedFolder(request, response, indexPath);
        return;
      }

      if (request.method !== "GET" && request.method !== "HEAD") {
        sendText(response, 405, "Method not allowed");
        return;
      }

      if (url.pathname === "/api/index") {
        await sendFile(response, indexPath, ".json", request.method);
        return;
      }

      if (url.pathname.startsWith("/assets/")) {
        await sendIndexedAsset(response, indexPath, decodeURIComponent(url.pathname.slice("/assets/".length)), request.method);
        return;
      }

      const staticPath = resolveStaticPath(publicDir, url.pathname);
      if (!staticPath) {
        sendText(response, 404, "Not found");
        return;
      }

      await sendFile(response, staticPath, path.extname(staticPath).toLowerCase(), request.method);
    } catch (error) {
      const status = error.statusCode ?? (error.code === "ENOENT" ? 404 : 500);
      sendText(response, status, status === 404 ? "Not found" : error.message);
    }
  });
}

async function scanPostedFolder(request, response, indexPath) {
  const body = await readJsonBody(request);
  const folderPath = String(body.folderPath ?? "").trim();
  if (!folderPath) {
    sendJson(response, 400, { error: "folderPath is required" });
    return;
  }

  const resolvedPath = path.resolve(folderPath);
  let folderStat;
  try {
    folderStat = await stat(resolvedPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendJson(response, 400, { error: "Folder not found" });
      return;
    }
    throw error;
  }
  if (!folderStat.isDirectory()) {
    sendJson(response, 400, { error: "Path is not a folder" });
    return;
  }

  const index = await scanLibrary({
    roots: [{
      name: body.name || path.basename(resolvedPath) || resolvedPath,
      path: resolvedPath
    }]
  });

  await mkdir(path.dirname(indexPath), { recursive: true });
  await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  sendJson(response, 200, index);
}

async function readJsonBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 64_000) {
      const error = new Error("Request body too large");
      error.statusCode = 413;
      throw error;
    }
  }

  if (!body.trim()) {
    return {};
  }
  return JSON.parse(body);
}

async function sendIndexedAsset(response, indexPath, assetId, method) {
  const index = JSON.parse(await readFile(indexPath, "utf8"));
  const asset = index.assets.find((candidate) => candidate.id === assetId);
  if (!asset) {
    sendText(response, 404, "Asset not found");
    return;
  }

  await sendFile(response, asset.path, asset.extension, method);
}

function resolveStaticPath(publicDir, pathname) {
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const resolvedPath = path.resolve(publicDir, relativePath);
  if (resolvedPath !== publicDir && !resolvedPath.startsWith(`${publicDir}${path.sep}`)) {
    return null;
  }
  return resolvedPath;
}

async function sendFile(response, filePath, extension, method) {
  const fileStat = await stat(filePath);
  const contentType = MIME_TYPES.get(extension) ?? "application/octet-stream";
  response.writeHead(200, {
    "content-length": fileStat.size,
    "content-type": contentType,
    "cache-control": "no-store"
  });

  if (method === "HEAD") {
    response.end();
    return;
  }

  createReadStream(filePath).pipe(response);
}

function sendText(response, status, message) {
  response.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  response.end(message);
}

function sendJson(response, status, value) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(`${JSON.stringify(value)}\n`);
}

async function startServer() {
  const configFlag = process.argv.indexOf("--config");
  const configPath = configFlag >= 0 ? process.argv[configFlag + 1] : path.join(projectRoot, "asset-librarian.config.json");
  const config = await loadConfig(configPath);
  const port = Number.parseInt(process.env.PORT || "4173", 10);
  const host = process.env.HOST || "127.0.0.1";
  const server = createAssetServer({
    indexPath: config.outputPath,
    publicDir: path.join(projectRoot, "public")
  });

  server.listen(port, host, () => {
    console.log(`Image Asset Librarian running at http://${host}:${port}`);
    console.log(`Serving index: ${config.outputPath}`);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  startServer().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
