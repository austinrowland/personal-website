// Cloudflare Worker for austinrowland.com: serves the static Astro build (dist/, via the ASSETS
// binding) with the same agent-facing behavior as scripts/serve.mjs.
import { agentHeaders, decodePath, markdownTokens, notFoundPath, planRequest } from "../scripts/agent-http.mjs";

const CONDITIONAL_HEADERS = ["if-match", "if-none-match", "if-modified-since", "if-unmodified-since", "if-range"];

export default {
  async fetch(request, env) {
    const plan = planRequest(decodePath(request.url), request.headers.get("accept") ?? "");
    // Markdown is read to estimate tokens, so fetch it with GET even for HEAD requests. The 404
    // fallback drops conditional headers: a 304 for 404.md would leave the error without a body.
    const assetRequest = (path, { conditional = true } = {}) => {
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

    let body = response.body;
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
};
