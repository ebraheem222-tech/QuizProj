import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.join(__dirname, "client");
const port = Number(process.env.PORT || 3000);

const cleanRoutes = new Map([
  ["/", "index.html"],
  ["/login", "pages/login.html"],
  ["/register", "pages/register.html"],
  ["/teacher", "pages/teacher.html"],
  ["/student", "pages/student.html"],
  ["/search", "pages/search.html"]
]);

const dynamicRoutes = [
  { pattern: /^\/exam\/[a-zA-Z0-9-]+$/, file: "pages/exam-details.html" },
  { pattern: /^\/take\/[a-zA-Z0-9-]+$/, file: "pages/take-exam.html" }
];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function getRouteFile(pathname) {
  if (cleanRoutes.has(pathname)) {
    return cleanRoutes.get(pathname);
  }

  const dynamicRoute = dynamicRoutes.find(route => route.pattern.test(pathname));

  if (dynamicRoute) {
    return dynamicRoute.file;
  }

  return pathname.replace(/^\/+/, "");
}

function resolveClientFile(pathname) {
  const safePathname = decodeURIComponent(pathname).replaceAll("\\", "/");
  const routeFile = getRouteFile(safePathname);
  const filePath = path.resolve(clientDir, routeFile || "index.html");
  const relativePath = path.relative(clientDir, filePath);

  // Keep every request inside the client folder, even when the URL contains ../
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null;
  }

  return filePath;
}

async function sendFile(response, filePath) {
  const fileStats = await stat(filePath);
  const resolvedPath = fileStats.isDirectory()
    ? path.join(filePath, "index.html")
    : filePath;
  const ext = path.extname(resolvedPath);
  const content = await readFile(resolvedPath);

  response.writeHead(200, {
    "Content-Type": mimeTypes[ext] || "application/octet-stream"
  });
  response.end(content);
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const filePath = resolveClientFile(url.pathname);

  if (!filePath) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  try {
    await sendFile(response, filePath);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, () => {
  console.log(`QuizProj is running at http://localhost:${port}`);
});
