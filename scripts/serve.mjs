// Serves the built site (dist/) locally and for the Devin App, with the agent-facing HTTP behavior
// from agent-http.mjs. In production the Cloudflare Worker (worker/index.mjs) does the same.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { agentHeaders, decodePath, markdownTokens, notFoundPath, planRequest } from "./agent-http.mjs";

export { CONTENT_SIGNAL, markdownPathFor, prefersMarkdown } from "./agent-http.mjs";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function resolveFile(root, pathname) {
  const target = path.join(root, pathname);
  if (target !== root && !target.startsWith(root + path.sep)) return null;
  for (const candidate of [target, path.join(target, "index.html"), `${target}.html`]) {
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {}
  }
  return null;
}

export function createSiteServer({ root = "dist" } = {}) {
  const dist = path.resolve(root);
  return createServer((req, res) => {
    handle(dist, req, res).catch((error) => {
      console.error(error);
      if (!res.headersSent) res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Internal server error\n");
    });
  });
}

async function handle(dist, req, res) {
  const plan = planRequest(decodePath(req.url ?? "/"), req.headers.accept);
  let status = 200;
  let file = await resolveFile(dist, plan.wantPath);
  if (!file) {
    status = 404;
    file = await resolveFile(dist, notFoundPath(plan));
  }
  const headers = agentHeaders(plan, status);

  if (!file) {
    res.writeHead(404, { ...headers, "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found\n");
    return;
  }

  const body = await readFile(file);
  const type = TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  headers["Content-Type"] = type;
  headers["Content-Length"] = body.length;
  if (type.startsWith("text/markdown")) headers["X-Markdown-Tokens"] = markdownTokens(body.toString("utf8"));
  res.writeHead(status, headers);
  res.end(req.method === "HEAD" ? undefined : body);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 4321);
  const host = process.env.HOST ?? "127.0.0.1";
  const root = process.env.DIST ?? "dist";
  createSiteServer({ root }).listen(port, host, () => {
    console.log(`Serving ${root} at http://${host}:${port}`);
  });
}
