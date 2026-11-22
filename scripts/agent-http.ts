// Agent-facing HTTP behavior shared by the Node server (scripts/serve.ts) and the Cloudflare
// Worker (worker/index.ts): Markdown content negotiation, discovery Link headers, Content
// Signals, and /.well-known aliases.

export const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=yes";

export const ALIASES: Record<string, string> = {
  "/.well-known/llms.txt": "/llms.txt",
  "/.well-known/llms-full.txt": "/llms-full.txt",
};

/** Renamed pages: old path → new path. Covers `/old`, `/old/`, `/old/index.html` and `/old.md`. */
export const RENAMED: Record<string, string> = {
  "/about": "/story",
  "/photos": "/memories",
};

/** Where a renamed page now lives, keeping the same form (page or Markdown twin), or null. */
export function redirectFor(pathname: string): string | null {
  const match = pathname.match(/^(\/[^/.]+)(\/|\/index\.html|\.md)?$/);
  const target = match && RENAMED[match[1]];
  if (!target) return null;
  return match[2] === ".md" ? `${target}.md` : `${target}/`;
}

/**
 * True when the client explicitly asks for text/markdown and ranks it at least as high as
 * text/html. Each type takes the quality of its most specific matching range (exact, then
 * `text/*`, then `*\/*`); wildcards alone never select Markdown.
 */
export function prefersMarkdown(accept = ""): boolean {
  const ranges = new Map<string, number>();
  for (const part of accept.toLowerCase().split(",")) {
    const [type, ...params] = part.split(";").map((s) => s.trim());
    if (!type) continue;
    const qParam = params.find((p) => p.startsWith("q="));
    const q = qParam ? Number(qParam.slice(2)) || 0 : 1;
    ranges.set(type, Math.max(ranges.get(type) ?? 0, q));
  }
  const quality = (...types: string[]) => {
    for (const t of [...types, "text/*", "*/*"]) if (ranges.has(t)) return ranges.get(t)!;
    return 0;
  };
  if (!ranges.has("text/markdown") && !ranges.has("text/x-markdown")) return false;
  const markdown = Math.max(ranges.get("text/markdown") ?? 0, ranges.get("text/x-markdown") ?? 0);
  const html = quality("text/html");
  return markdown > 0 && markdown >= html;
}

/** Mirrors markdownPath() in src/data/pages.ts. */
export function markdownPathFor(pathname: string): string {
  const clean = pathname.replace(/\/index\.html$/, "").replace(/\/+$/, "");
  return clean ? `${clean}.md` : "/index.md";
}

function htmlPathFor(markdownPathname: string): string {
  const page = markdownPathname.slice(0, -".md".length);
  return page === "/index" ? "/" : `${page}/`;
}

export function decodePath(url: string): string {
  try {
    return decodeURIComponent(new URL(url, "http://localhost").pathname);
  } catch {
    return "/";
  }
}

export interface Plan {
  /** Request path after aliases. */
  pathname: string;
  /** An HTML page (no extension or .html), as opposed to a file. */
  isPage: boolean;
  wantsMarkdown: boolean;
  /** The file to serve. */
  wantPath: string;
}

/** Decides which file answers a request: the page itself, its Markdown twin, or an alias target. */
export function planRequest(pathname: string, accept = ""): Plan {
  const path = ALIASES[pathname] ?? pathname;
  const ext = path.match(/\.[^/.]+$/)?.[0].toLowerCase() ?? "";
  const isPage = !ext || ext === ".html";
  const isMarkdown = ext === ".md";
  const negotiated = isPage && prefersMarkdown(accept);
  return {
    pathname: path,
    isPage,
    wantsMarkdown: isMarkdown || negotiated,
    wantPath: negotiated ? markdownPathFor(path) : path,
  };
}

export const notFoundPath = (plan: Plan) => (plan.wantsMarkdown ? "/404.md" : "/404.html");

/** Headers every response gets, given the plan and the final status. */
export function agentHeaders(plan: Plan, status: number): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Signal": CONTENT_SIGNAL,
    "X-Content-Type-Options": "nosniff",
    "X-Llms-Txt": "/llms.txt",
  };
  const links = ['</llms.txt>; rel="llms-txt"', '</llms-full.txt>; rel="llms-full-txt"'];
  // Vite fingerprints everything under /_astro/ (scripts, styles, fonts, the 3D model), so a URL never changes content.
  if (status === 200 && plan.pathname.startsWith("/_astro/")) headers["Cache-Control"] = "public, max-age=31536000, immutable";
  if (plan.isPage) {
    headers.Vary = "Accept";
    links.push(`<${encodeURI(markdownPathFor(plan.pathname))}>; rel="alternate"; type="text/markdown"`);
    links.push('</sitemap-index.xml>; rel="sitemap"');
  }
  if (plan.wantsMarkdown) {
    headers["X-Robots-Tag"] = "noindex";
    if (status === 200) links.push(`<${encodeURI(htmlPathFor(plan.wantPath))}>; rel="canonical"`);
  }
  headers.Link = links.join(", ");
  return headers;
}

/** A 301 to a renamed page's new path, with the same discovery headers as every other response. */
export function redirectHeaders(location: string): Record<string, string> {
  const plan: Plan = { pathname: location, isPage: false, wantsMarkdown: false, wantPath: location };
  return { ...agentHeaders(plan, 301), Location: location };
}

/** Rough estimate (4 characters per token), like Cloudflare's x-markdown-tokens. */
export const markdownTokens = (text: string) => Math.ceil(text.length / 4);
