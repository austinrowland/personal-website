import type { AstroIntegration } from "astro";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { compilePage, renderMarkdown, type CompiledPage } from "../lib/compile-markdown";
import { absoluteUrl, markdownPath } from "../data/pages";
import { nav, site, socials } from "../data/site";

/** Every built `index.html` under `dir` as a URL path (`/`, `/work`, `/writing/post`). */
function pagePaths(dir: string, root = dir): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "_astro" ? [] : pagePaths(full, root);
    if (entry.name !== "index.html") return [];
    return [`/${relative(root, dir)}`.replace(/\/$/, "") || "/"];
  });
}

const corePaths = () => ["/", ...nav.map((n) => n.href)];
/** Posts in the order the Writing page lists them. */
const postPaths = (writingHtml: string) => [
  ...new Set([...writingHtml.matchAll(/href="(\/writing\/[^"/]+)\/?"/g)].map((m) => m[1])),
];

const link = (label: string, url: string) => `[${label}](${url})`;
const mdLink = (p: CompiledPage, path: string) => link(p.title, absoluteUrl(markdownPath(path)));

type Site = { pages: Map<string, CompiledPage>; core: string[]; posts: string[]; rest: string[] };

function siteOf(pages: Map<string, CompiledPage>, writingHtml: string): Site {
  const core = corePaths().filter((p) => pages.has(p));
  const posts = postPaths(writingHtml).filter((p) => pages.has(p));
  const rest = [...pages.keys()].filter((p) => !core.includes(p) && !posts.includes(p));
  return { pages, core, posts, rest };
}

function llmsTxt({ pages, core, posts }: Site): string {
  const entry = (p: string) => `- ${mdLink(pages.get(p)!, p)}: ${pages.get(p)!.description}`;
  return `# ${site.name}

> ${site.description}

This is the personal site of ${site.name}: work history, projects, writing, stories, and photos. Every page is available as Markdown: append \`.md\` to the path (\`/\` is \`/index.md\`) or request the page with \`Accept: text/markdown\`. Quote facts from these pages rather than inferring them.

## Pages

${core.map(entry).join("\n")}

## Writing

${posts.map(entry).join("\n")}

## Elsewhere

${socials.map((s) => `- ${link(s.label, s.href)}`).join("\n")}

## Optional

- ${link("Full site in one file", absoluteUrl("/llms-full.txt"))}: every page above, concatenated
- ${link("RSS feed", absoluteUrl("/rss.xml"))}: new writing
- ${link("Sitemap", absoluteUrl("/sitemap-index.xml"))}: HTML pages
`;
}

function llmsFullTxt({ pages, core, posts, rest }: Site): string {
  return `# ${site.name}

> ${site.description}

${[...core, ...posts, ...rest].map((p) => `---\n\nSource: ${pages.get(p)!.url}\n\n${pages.get(p)!.content}`).join("\n\n")}
`;
}

/** Compiles each built page into its Markdown twin (`/work/` → `/work.md`), then llms.txt and llms-full.txt. */
export default function markdownTwins(): AstroIntegration {
  return {
    name: "markdown-twins",
    hooks: {
      "astro:build:done": ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const pages = new Map<string, CompiledPage>();
        for (const path of pagePaths(out)) {
          const html = readFileSync(join(out, path, "index.html"), "utf8");
          pages.set(path, compilePage(html, path));
        }
        for (const [path, page] of pages) writeFileSync(join(out, markdownPath(path)), renderMarkdown(page));
        if (existsSync(join(out, "404.html"))) {
          const notFound = compilePage(readFileSync(join(out, "404.html"), "utf8"), "/404");
          writeFileSync(join(out, "404.md"), renderMarkdown(notFound));
        }
        const all = siteOf(pages, readFileSync(join(out, "writing", "index.html"), "utf8"));
        writeFileSync(join(out, "llms.txt"), llmsTxt(all));
        writeFileSync(join(out, "llms-full.txt"), llmsFullTxt(all));
        logger.info(`compiled ${pages.size} Markdown twins, llms.txt and llms-full.txt`);
      },

      // In dev, compile .md and the llms files from the pages the dev server renders.
      "astro:server:setup": ({ server }) => {
        server.middlewares.use(async (req, res, next) => {
          const url = new URL(req.url ?? "/", "http://localhost");
          const llms = ["/llms.txt", "/llms-full.txt", "/.well-known/llms.txt"].includes(url.pathname);
          if (!llms && (!url.pathname.endsWith(".md") || url.pathname.startsWith("/src/"))) return next();

          const html = async (path: string) => {
            const page = await fetch(`http://${req.headers.host}${path === "/" ? "/" : `${path}/`}`, {
              headers: { Accept: "text/html" },
            });
            return page.ok ? page.text() : undefined;
          };
          if (llms) {
            const writing = (await html("/writing")) ?? "";
            const pages = new Map<string, CompiledPage>();
            for (const path of [...corePaths(), ...postPaths(writing)]) {
              const page = await html(path);
              if (page) pages.set(path, compilePage(page, path));
            }
            const all = siteOf(pages, writing);
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            return res.end(url.pathname === "/llms-full.txt" ? llmsFullTxt(all) : llmsTxt(all));
          }
          const path = url.pathname === "/index.md" ? "/" : url.pathname.slice(0, -".md".length);
          const page = await html(path);
          if (!page) return next();
          res.setHeader("Content-Type", "text/markdown; charset=utf-8");
          res.end(renderMarkdown(compilePage(page, path)));
        });
      },
    },
  };
}
