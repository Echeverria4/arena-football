const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 8081);
const distDir = path.resolve(__dirname, "..", "dist");
const indexFile = path.join(distDir, "index.html");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function sendFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Content-Type": mimeTypes[extension] || "application/octet-stream",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });

  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer((request, response) => {
  const requestPath = decodeURIComponent((request.url || "/").split("?")[0]);
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const assetPath = path.normalize(path.join(distDir, normalizedPath));

  if (!assetPath.startsWith(distDir)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  fs.stat(assetPath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(response, assetPath);
      return;
    }

    fs.stat(indexFile, (indexError, indexStats) => {
      if (indexError || !indexStats.isFile()) {
        response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("dist/index.html not found");
        return;
      }

      sendFile(response, indexFile);
    });
  });
});

server.listen(port, () => {
  console.log(`Arena web running at http://localhost:${port}`);
});
