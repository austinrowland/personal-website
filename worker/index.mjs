// Cloudflare Worker for austinrowland.com: serves the static Astro build (dist/, via the ASSETS
// binding) with the same agent-facing behavior as scripts/serve.mjs.
import { agentHeaders, decodePath, markdownTokens, notFoundPath, planRequest } from "../scripts/agent-http.mjs";

export default {
  async fetch(request, env) {
    const plan = planRequest(decodePath(request.url), request.headers.get("accept") ?? "");
    const assetUrl = (path) => new URL(encodeURI(path), request.url);

    let response = await env.ASSETS.fetch(new Request(assetUrl(plan.wantPath), request));
    let status = response.status;
    // not_found_handling serves 404.html for misses; Markdown requests get 404.md instead.
    if (status === 404 && plan.wantsMarkdown) {
      response = await env.ASSETS.fetch(new Request(assetUrl(notFoundPath(plan)), request));
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
