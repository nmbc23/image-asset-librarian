import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadConfig } from "./config.js";

const modulePath = fileURLToPath(import.meta.url);
const moduleDir = path.dirname(modulePath);
const projectRoot = path.resolve(moduleDir, "..");

const MIME_TYPES = new Map([
  [".avif", "image/avif"],
  [".bmp", "image/bmp"],
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".jpeg", "image/jpeg"],
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
      if (request.method !== "GET" && request.method !== "HEAD") {
        sendText(response, 405, "Method not allowed");
        return;
      }

      const url = new URL(request.url, "http://localhost");
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
      const status = error.code === "ENOENT" ? 404 : 500;
      sendText(response, status, status === 404 ? "Not found" : error.message);
    }
  });
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
