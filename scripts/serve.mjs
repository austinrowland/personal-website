// Serves the built site (dist/) with the agent-facing HTTP behavior a static host can't express:
// Markdown content negotiation, discovery Link headers, Content Signals, and /.well-known aliases.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=yes";

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

const ALIASES = {
  "/.well-known/llms.txt": "/llms.txt",
  "/.well-known/llms-full.txt": "/llms-full.txt",
};

/**
 * True when the client explicitly asks for text/markdown and ranks it at least as high as
 * text/html. Each type takes the quality of its most specific matching range (exact, then
 * `text/*`, then `*\/*`); wildcards alone never select Markdown.
 */
export function prefersMarkdown(accept = "") {
  const ranges = new Map();
  for (const part of accept.toLowerCase().split(",")) {
    const [type, ...params] = part.split(";").map((s) => s.trim());
    if (!type) continue;
    const qParam = params.find((p) => p.startsWith("q="));
    const q = qParam ? Number(qParam.slice(2)) || 0 : 1;
    ranges.set(type, Math.max(ranges.get(type) ?? 0, q));
  }
  const quality = (...types) => {
    for (const t of [...types, "text/*", "*/*"]) if (ranges.has(t)) return ranges.get(t);
    return 0;
  };
  if (!ranges.has("text/markdown") && !ranges.has("text/x-markdown")) return false;
  const markdown = Math.max(ranges.get("text/markdown") ?? 0, ranges.get("text/x-markdown") ?? 0);
  const html = Math.max(quality("text/html"), quality("application/xhtml+xml"));
  return markdown > 0 && markdown >= html;
}

/** Mirrors markdownPath() in src/data/pages.ts. */
export function markdownPathFor(pathname) {
  const clean = pathname.replace(/\/index\.html$/, "").replace(/\/+$/, "");
  return clean ? `${clean}.md` : "/index.md";
}

function htmlPathFor(markdownPathname) {
  const page = markdownPathname.slice(0, -".md".length);
  return page === "/index" ? "/" : `${page}/`;
}

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
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  } catch {
    pathname = "/";
  }
  pathname = ALIASES[pathname] ?? pathname;

  const ext = path.extname(pathname);
  const isPage = !ext || ext === ".html";
  const isMarkdown = ext === ".md";
  const negotiated = isPage && prefersMarkdown(req.headers.accept);
  const wantPath = negotiated ? markdownPathFor(pathname) : pathname;

  let status = 200;
  let file = await resolveFile(dist, wantPath);
  if (!file) {
    status = 404;
    file = await resolveFile(dist, negotiated || isMarkdown ? "/404.md" : "/404.html");
  }

  const headers = {
    "Content-Signal": CONTENT_SIGNAL,
    "X-Content-Type-Options": "nosniff",
    "X-Llms-Txt": "/llms.txt",
  };
  const links = ['</llms.txt>; rel="llms-txt"', '</llms-full.txt>; rel="llms-full-txt"'];
  if (isPage) {
    headers.Vary = "Accept";
    links.push(`<${encodeURI(markdownPathFor(pathname))}>; rel="alternate"; type="text/markdown"`);
    links.push('</sitemap-index.xml>; rel="sitemap"');
  }
  if (isMarkdown || negotiated) {
    headers["X-Robots-Tag"] = "noindex";
    if (status === 200) links.push(`<${encodeURI(htmlPathFor(wantPath))}>; rel="canonical"`);
  }
  headers.Link = links.join(", ");

  if (!file) {
    res.writeHead(404, { ...headers, "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found\n");
    return;
  }

  const body = await readFile(file);
  const type = TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  headers["Content-Type"] = type;
  headers["Content-Length"] = body.length;
  if (type.startsWith("text/markdown")) {
    // Rough estimate (4 characters per token), like Cloudflare's x-markdown-tokens.
    headers["X-Markdown-Tokens"] = Math.ceil(body.toString("utf8").length / 4);
  }
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
