import type { APIRoute } from "astro";
import { absoluteUrl } from "../data/pages";
import { contentSignal } from "../data/site";

export const GET: APIRoute = () =>
  new Response(
    `# Agents: start at ${absoluteUrl("/llms.txt")}. Every page is also available as Markdown
# (append .md to the path, or send Accept: text/markdown).
# Content Signals: https://contentsignals.org/

User-agent: *
Content-Signal: ${contentSignal}
Allow: /

Sitemap: ${absoluteUrl("/sitemap-index.xml")}
`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
