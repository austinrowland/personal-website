# Agent readiness

How the site serves AI agents and developer tools, and which patterns it borrows from
[Mintlify](https://www.mintlify.com/docs/ai/llmstxt), [Fern](https://buildwithfern.com/learn/docs/ai-features/llms-txt),
and [Cloudflare](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/).

## What ships

| Capability | Where | Pattern from |
| --- | --- | --- |
| `/llms.txt` index of every page with descriptions | `src/pages/llms.txt.ts` | llmstxt.org, Mintlify, Fern |
| `/llms-full.txt`, the whole site in one file (~3k tokens) | `src/pages/llms-full.txt.ts` | Mintlify |
| Markdown twin of every page (`/work.md`, `/index.md`, `/writing/<post>.md`) | `src/pages/[...path].md.ts`, `src/lib/markdown.ts` | Mintlify, Fern |
| `Accept: text/markdown` content negotiation, `Vary: Accept` | `scripts/agent-http.mjs` | Cloudflare, Mintlify |
| `Link` headers (`llms-txt`, `alternate` Markdown, `sitemap`) and `X-Llms-Txt` | `scripts/agent-http.mjs` | Mintlify |
| `X-Markdown-Tokens` estimate on Markdown responses | `scripts/agent-http.mjs` | Cloudflare |
| `/.well-known/llms.txt` alias | `scripts/agent-http.mjs` | Mintlify |
| Content Signals in `robots.txt` and as a response header | `src/pages/robots.txt.ts`, `contentSignal` in `src/data/site.ts` | Cloudflare |
| `<link rel="alternate" type="text/markdown">` in every page head and a visible footer link | `src/layouts/Base.astro`, `src/components/Footer.astro` | Mintlify, Fern |
| Human / Agent switch on every page: "agent" swaps the page for its Markdown twin (persisted in `localStorage`, or `?view=agent`) | `src/components/ViewToggle.astro` | Parallel |
| schema.org JSON-LD (`WebSite` + `Person`, `ProfilePage`, `BlogPosting`) | `src/lib/structured-data.ts` | search engines and answer engines |
| Sitemap, RSS, Open Graph image | `@astrojs/sitemap`, `src/pages/rss.xml.ts`, `public/og.png` | standard SEO |

Markdown is generated from the same data the HTML uses (`src/data/*`, the writing collection), so the two
cannot drift. Markdown responses carry `X-Robots-Tag: noindex` and a canonical `Link` to the HTML page so
search engines index one copy.

## Hosting

Static hosts serve the `.md` and `.txt` files as-is, but the HTTP behaviors (content negotiation, `Link`
headers, the `.well-known` alias) need code. They live in `scripts/agent-http.mjs`, which two servers share:

- **Production:** the Cloudflare Worker `austinrowland-com` (`worker/index.mjs`, `wrangler.jsonc`) serves
  `dist/` through the `ASSETS` binding with `run_worker_first`, so every response gets the agent headers.
- **Local and the Devin App:** `npm run serve` (`scripts/serve.mjs`); `npm test` runs against it.

## Deploys

Workers Builds (Cloudflare's GitHub integration) builds the repo on every push:

| Event | Build command | Deploy command | Result |
| --- | --- | --- | --- |
| Push to `main` | `npm run build` | `npx wrangler deploy` | production |
| Push to any other branch / PR | `npm run build` | `npx wrangler preview` | a Preview URL per branch, commented on the PR |

GitHub Actions CI (`.github/workflows/ci.yml`) still gates PRs with `astro check`, the build, `npm test`,
and `wrangler deploy --dry-run`.

## Not applicable here

MCP server cards, OAuth discovery, API catalogs, Agent Skills, and agentic commerce checks (from
Cloudflare's agent-readiness scanner) apply to sites with APIs or checkout flows, not to a personal site.
