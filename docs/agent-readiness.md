# Agent readiness

How the site serves AI agents and developer tools, and which patterns it borrows from
[Mintlify](https://www.mintlify.com/docs/ai/llmstxt), [Fern](https://buildwithfern.com/learn/docs/ai-features/llms-txt),
and [Cloudflare](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/).

## What ships

| Capability | Where | Pattern from |
| --- | --- | --- |
| `/llms.txt` index of every page with descriptions | `src/integrations/markdown-twins.ts` | llmstxt.org, Mintlify, Fern |
| `/llms-full.txt`, the whole site in one file (~3k tokens) | `src/integrations/markdown-twins.ts` | Mintlify |
| Markdown twin of every page (`/work.md`, `/index.md`, `/writing/<post>.md`) | `src/integrations/markdown-twins.ts`, `src/lib/compile-markdown.ts` | Mintlify, Fern |
| `Accept: text/markdown` content negotiation, `Vary: Accept` | `scripts/agent-http.ts` | Cloudflare, Mintlify |
| `Link` headers (`llms-txt`, `alternate` Markdown, `sitemap`) and `X-Llms-Txt` | `scripts/agent-http.ts` | Mintlify |
| `X-Markdown-Tokens` estimate on Markdown responses | `scripts/agent-http.ts` | Cloudflare |
| `/.well-known/llms.txt` alias | `scripts/agent-http.ts` | Mintlify |
| Content Signals in `robots.txt` and as a response header | `src/pages/robots.txt.ts`, `contentSignal` in `src/data/site.ts` | Cloudflare |
| `<link rel="alternate" type="text/markdown">` in every page head | `src/layouts/Base.astro` | Mintlify, Fern |
| Human / Agent switch on every page: "agent" swaps the page for its Markdown twin (persisted in `localStorage`, or `?view=agent`) | `src/components/ViewToggle.astro` | Parallel |
| schema.org JSON-LD (`WebSite` + `Person`, `ProfilePage`, `BlogPosting`) | `src/lib/structured-data.ts` | search engines and answer engines |
| Sitemap, RSS, Open Graph image | `@astrojs/sitemap`, `src/pages/rss.xml.ts`, `public/og.png` | standard SEO |

Markdown is compiled from the built HTML pages after each build (`src/integrations/markdown-twins.ts`), so
whatever a page shows ends up in its twin. The compiler (`src/lib/compile-markdown.ts`) leaves out controls,
SVG, `aria-hidden` and `data-md-skip` elements, keeps `data-md-keep` content (the back of a flipping print),
and puts an `<hgroup>`'s heading first so a label above a heading (a role's dates) stays in that heading's
section. Visually split pieces are grouped by their markup: each Work role's panel carries its role and org
heading, so the card and panel read as one section. `npm test` fails if any visible line, image, Work role or
Memory is missing from its twin. In `astro dev`, `.md` requests are compiled from the dev server's page. Markdown responses carry `X-Robots-Tag: noindex` and a canonical `Link` to the HTML page so
search engines index one copy.

## Hosting

Static hosts serve the `.md` and `.txt` files as-is, but the HTTP behaviors (content negotiation, `Link`
headers, the `.well-known` alias) need code. They live in `scripts/agent-http.ts`, which two servers share:

- **Production:** the Cloudflare Worker `austinrowland-com` (`worker/index.ts`, `wrangler.jsonc`) serves
  `dist/` through the `ASSETS` binding with `run_worker_first`, so every response gets the agent headers.
- **Local and the Devin App:** `npm run serve` (`scripts/serve.ts`); `npm test` runs against it.

## Deploys

Workers Builds (Cloudflare's GitHub integration) builds the repo on every push:

| Event | Build command | Deploy command | Result |
| --- | --- | --- | --- |
| Push to `staging` (the deploy-stage action, on every merge to `main`) | `npm run build` | `npx wrangler deploy --env staging` | staging: `austinrowland-com-staging.austinrowland2002.workers.dev` |
| Push to `production` | `npm run build` | `npx wrangler deploy` | production: `austinrowland.com` |
| Push to any other branch / PR | `npm run build` | `npx wrangler preview` | a Preview URL per branch, commented on the PR |

Merges land on staging only. Two GitHub actions control the deploy branches (Actions → Run workflow):

- **deploy-stage** runs on every merge to `main` and moves `staging` to it. Run it by hand to put any branch,
  tag or commit on staging before merging; the next merge to `main` replaces it.
- **deploy-prod** fast-forwards `production` to `main`, shipping it to `austinrowland.com`.

Roll back with `npx wrangler rollback` or the Cloudflare dashboard.

**Launch switch:** `austinrowland.com` and `www.austinrowland.com` are attached as custom domains, but
the Worker answers them with a noindex "coming soon" page (and a `Disallow: /` robots.txt) until
`vars.SITE_LIVE` in `wrangler.jsonc` is `"true"`. To launch, flip it in a PR, merge, and run deploy-prod.
Staging and Preview URLs always serve the full site.

GitHub Actions CI (`.github/workflows/ci.yml`) still gates PRs with `npm run check` (`astro check` plus the Worker type check), the build, `npm test`,
and `wrangler deploy --dry-run`.

## Not applicable here

MCP server cards, OAuth discovery, API catalogs, Agent Skills, and agentic commerce checks (from
Cloudflare's agent-readiness scanner) apply to sites with APIs or checkout flows, not to a personal site.
