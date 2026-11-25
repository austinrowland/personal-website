// Cloudflare Worker for austinrowland.com: serves the static Astro build (dist/, via the ASSETS
// binding) with the same agent-facing behavior as scripts/serve.ts.
import { agentHeaders, decodePath, markdownTokens, notFoundPath, planRequest, redirectFor, redirectHeaders } from "../scripts/agent-http.ts";

// austinrowland.com shows a placeholder until SITE_LIVE is "true" in wrangler.jsonc; staging on
// workers.dev and Preview URLs always serve the full site.
const LAUNCH_HOSTS = new Set(["austinrowland.com", "www.austinrowland.com"]);
// www and plain http links land on the one address search engines should index.
const CANONICAL_ORIGIN = "https://austinrowland.com";

const PLACEHOLDER = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Austin Rowland</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f8f5f0;color:#1c1a17;font:18px/1.6 Georgia,serif}main{padding:2rem;text-align:center}h1{font-weight:400;font-size:2.5rem;margin:0 0 .5rem}p{margin:0;color:#6b655c}</style>
</head>
<body><main><h1>Austin Rowland</h1><p>New site coming soon.</p></main></body>
</html>
`;

function placeholder(request: Request) {
  const isRobots = new URL(request.url).pathname === "/robots.txt";
  return new Response(request.method === "HEAD" ? null : isRobots ? "User-agent: *\nDisallow: /\n" : PLACEHOLDER, {
    headers: {
      "Content-Type": isRobots ? "text/plain; charset=utf-8" : "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

const CONDITIONAL_HEADERS = ["if-match", "if-none-match", "if-modified-since", "if-unmodified-since", "if-range"];

export default {
  async fetch(request, env) {
    const requested = new URL(request.url);
    if (LAUNCH_HOSTS.has(requested.hostname) && requested.origin !== CANONICAL_ORIGIN)
      return Response.redirect(CANONICAL_ORIGIN + requested.pathname + requested.search, 301);
    if (LAUNCH_HOSTS.has(new URL(request.url).hostname) && env.SITE_LIVE !== "true") return placeholder(request);
    const url = new URL(request.url);
    const moved = redirectFor(decodePath(request.url));
    if (moved) return new Response(null, { status: 301, headers: redirectHeaders(moved + url.search) });
    const plan = planRequest(decodePath(request.url), request.headers.get("accept") ?? "");
    // Markdown is read to estimate tokens, so fetch it with GET even for HEAD requests. The 404
    // fallback drops conditional headers: a 304 for 404.md would leave the error without a body.
    const assetRequest = (path: string, { conditional = true } = {}) => {
      const headers = new Headers(request.headers);
      if (!conditional) for (const name of CONDITIONAL_HEADERS) headers.delete(name);
      const method = plan.wantsMarkdown ? "GET" : request.method;
      return new Request(new URL(encodeURI(path), request.url), { method, headers });
    };

    let response = await env.ASSETS.fetch(assetRequest(plan.wantPath));
    let status = response.status;
    // not_found_handling serves 404.html for misses; Markdown requests get 404.md instead.
    if (status === 404 && plan.wantsMarkdown) {
      response = await env.ASSETS.fetch(assetRequest(notFoundPath(plan), { conditional: false }));
    }

    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(agentHeaders(plan, status))) headers.set(name, value);

    let body: BodyInit | null = response.body;
    if (status < 300 || status === 404) {
      const type = headers.get("content-type") ?? "";
      if (plan.wantsMarkdown || type.startsWith("text/markdown")) {
        const text = await response.text();
        headers.set("Content-Type", "text/markdown; charset=utf-8");
        headers.set("X-Markdown-Tokens", String(markdownTokens(text)));
        headers.delete("Content-Length");
        body = request.method === "HEAD" ? null : text;
      }
    }
    return new Response(body, { status, statusText: status === 404 ? "Not Found" : response.statusText, headers });
  },
} satisfies ExportedHandler<Env>;
