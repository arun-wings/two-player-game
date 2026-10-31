import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import { attachGameServer } from "./server/gameServer.js";

const projectDirectory = path.dirname(fileURLToPath(import.meta.url));
const distDirectory = path.join(projectDirectory, "dist");
const port = Number(process.env.PORT) || 3001;
const allowedOrigins = (process.env.CLIENT_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const httpServer = createServer(async (request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }

  if (pathname === "/health") {
    response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" }).end("ok");
    return;
  }

  const requestedFile = pathname === "/"
    ? path.join(distDirectory, "index.html")
    : path.resolve(distDirectory, `.${pathname}`);
  if (requestedFile !== path.join(distDirectory, "index.html")
    && !requestedFile.startsWith(`${distDirectory}${path.sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    const file = await readFile(requestedFile);
    const isHtml = path.extname(requestedFile) === ".html";
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(requestedFile)] || "application/octet-stream",
      "Cache-Control": isHtml ? "no-cache" : "public, max-age=31536000, immutable",
    });
    response.end(file);
  } catch {
    if (!path.extname(pathname)) {
      try {
        const page = await readFile(path.join(distDirectory, "index.html"));
        response.writeHead(200, { "Content-Type": contentTypes[".html"], "Cache-Control": "no-cache" });
        response.end(page);
        return;
      } catch {
        // The app has not been built yet.
      }
    }
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Frontend build not found. Run npm run build first.");
  }
});

const cors = allowedOrigins.length > 0
  ? { origin: allowedOrigins }
  : (process.env.NODE_ENV === "production" ? undefined : { origin: true });
const io = new Server(httpServer, cors ? { cors } : {});
attachGameServer(io);

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Two Player Arena listening on port ${port}`);
});
