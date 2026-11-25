// Checks the built site (run `npm run build` first) and the agent-facing behavior of scripts/serve.ts.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import type { AddressInfo, Server } from "node:net";
import type { Element, Root } from "hast";
import { fromHtml } from "hast-util-from-html";
import { select, selectAll } from "hast-util-select";
import { toText } from "hast-util-to-text";
import { createSiteServer, markdownPathFor, prefersMarkdown } from "../scripts/serve.ts";

const SITE = "https://austinrowland.com";
let base: string;
let server: Server | undefined;

before(async () => {
  assert.ok(existsSync("dist/index.html"), "dist/ is missing: run `npm run build` first");
  const site = (server = createSiteServer({ root: "dist" }));
  await new Promise<void>((resolve) => site.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(site.address() as AddressInfo).port}`;
});
after(() => server?.close());

const get = (path: string, headers: Record<string, string> = {}, init: RequestInit = {}) =>
  fetch(base + path, { headers, ...init });
const header = (res: Response, name: string) => res.headers.get(name) ?? "";

function sitemapPaths() {
  const index = readFileSync("dist/sitemap-index.xml", "utf8");
  const sitemaps = [...index.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  return sitemaps.flatMap((file) =>
    [...readFileSync(`dist${file}`, "utf8").matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname),
  );
}

describe("content negotiation", () => {
  test("prefersMarkdown follows Accept ranking", () => {
    assert.equal(prefersMarkdown("text/markdown"), true);
    assert.equal(prefersMarkdown("text/markdown, text/html;q=0.9"), true);
    assert.equal(prefersMarkdown("text/html,application/xhtml+xml,*/*;q=0.8"), false);
    assert.equal(prefersMarkdown("text/html, text/markdown;q=0.5"), false);
    assert.equal(prefersMarkdown(""), false);
    assert.equal(prefersMarkdown("*/*"), false);
    assert.equal(prefersMarkdown("text/markdown;q=0.5, text/*;q=1"), false);
    assert.equal(prefersMarkdown("text/markdown, */*;q=0.8"), true);
    assert.equal(prefersMarkdown("text/markdown;q=0.8, text/html;q=0, */*;q=1"), true);
  });

  test("markdownPathFor maps page paths to .md twins", () => {
    assert.equal(markdownPathFor("/"), "/index.md");
    assert.equal(markdownPathFor("/work/"), "/work.md");
    assert.equal(markdownPathFor("/writing/post"), "/writing/post.md");
  });

  test("browsers get HTML with discovery headers", async () => {
    const res = await get("/work/", { Accept: "text/html" });
    assert.equal(res.status, 200);
    assert.match(header(res, "content-type"), /text\/html/);
    assert.equal(res.headers.get("vary"), "Accept");
    assert.match(header(res, "link"), /<\/work\.md>; rel="alternate"; type="text\/markdown"/);
    assert.match(header(res, "link"), /<\/llms\.txt>; rel="llms-txt"/);
    assert.match(header(res, "content-signal"), /ai-input=yes/);
  });

  test("fingerprinted build assets are cached for a year; pages are not", async () => {
    const html = await (await get("/memories/")).text();
    const asset = html.match(/\/_astro\/[^"']+\.js/)?.[0];
    assert.ok(asset, "no /_astro/ script on /memories/");
    assert.equal((await get(asset)).headers.get("cache-control"), "public, max-age=31536000, immutable");
    assert.equal((await get("/memories/")).headers.get("cache-control"), null);
    assert.equal((await get("/_astro/missing.js")).headers.get("cache-control"), null);
  });

  test("Accept: text/markdown returns the Markdown twin", async () => {
    const res = await get("/", { Accept: "text/markdown" });
    assert.equal(res.status, 200);
    assert.match(header(res, "content-type"), /text\/markdown/);
    assert.equal(res.headers.get("x-robots-tag"), "noindex");
    assert.ok(Number(res.headers.get("x-markdown-tokens")) > 0);
    const body = await res.text();
    assert.match(body, /^---\ntitle:/);
    assert.match(body, /^title: "Austin Rowland"$/m);
    assert.match(body, /^# Hi, I'm Austin Rowland\.$/m);
    assert.doesNotMatch(body, /<(div|nav|script|span)\b/);
  });

  test("/.well-known/llms.txt mirrors /llms.txt", async () => {
    const [a, b] = await Promise.all([get("/llms.txt"), get("/.well-known/llms.txt")]);
    assert.equal(b.status, 200);
    assert.equal(await b.text(), await a.text());
  });

  test("renamed pages redirect to their new paths", async () => {
    for (const [from, to] of [
      ["/about", "/story/"],
      ["/about/", "/story/"],
      ["/about.md", "/story.md"],
      ["/photos/?x=1", "/memories/?x=1"],
      ["/photos.md", "/memories.md"],
    ]) {
      const res = await get(from, {}, { redirect: "manual" });
      assert.equal(res.status, 301, from);
      assert.equal(res.headers.get("location"), to, from);
      assert.match(header(res, "content-signal"), /ai-input=yes/, from);
      assert.match(header(res, "link"), /<\/llms\.txt>; rel="llms-txt"/, from);
    }
    assert.equal((await get("/story/")).status, 200);
    assert.equal((await get("/memories.md")).status, 200);
  });

  test("missing pages return 404 in the requested format", async () => {
    const html = await get("/nope");
    assert.equal(html.status, 404);
    assert.match(header(html, "content-type"), /text\/html/);
    const md = await get("/nope", { Accept: "text/markdown" });
    assert.equal(md.status, 404);
    assert.match(await md.text(), /^title: "Page not found"$/m);
  });

  test("encoded control characters in the path don't crash the server", async () => {
    const res = await get("/%0A");
    assert.equal(res.status, 404);
    assert.match(header(res, "link"), /<\/%0A\.md>/);
    assert.equal((await get("/")).status, 200);
  });
});

// Strips HTML or Markdown down to comparable words, so formatting differences don't count as drift.
const words = (s: string) =>
  s
    .replace(/<([^<>\s]+(?:@|:\/\/)[^<>\s]+)>/g, " $1 ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const CONTROLS = new Set(["script", "style", "svg", "template", "noscript", "button", "input", "select", "textarea", "iframe"]);

/** What a reader sees in `el`: controls, decoration and `data-md-skip` removed, icon-only text replaced by its label. */
function visible<T extends Element | Root>(el: T): T {
  el.children = el.children.filter(
    (c) =>
      c.type !== "element" ||
      !(
        CONTROLS.has(c.tagName) ||
        c.properties.dataMdSkip !== undefined ||
        (c.properties.ariaHidden === "true" && !select("[data-md-keep]", c))
      ),
  ) as T["children"];
  for (const c of el.children) if (c.type === "element") visible(c);
  // Sibling elements (flex items, list rows) read as separate words.
  el.children = el.children.flatMap((c, i) =>
    i && c.type === "element" && el.children[i - 1].type === "element" ? [{ type: "text" as const, value: " " }, c] : [c],
  ) as T["children"];
  const label = el.type === "element" ? el.properties.ariaLabel : undefined;
  if (typeof label === "string" && !toText(el).trim()) el.children = [{ type: "text", value: label }];
  return el;
}

const lines = (el: Element) => toText(visible(el)).split("\n").map(words).filter(Boolean);
const page = (path: string) => fromHtml(readFileSync(`dist${path}index.html`, "utf8"));

describe("HTML and Markdown stay in sync", () => {
  test("every line of visible text and every image on a page appears in its Markdown twin", () => {
    for (const path of sitemapPaths()) {
      const main = select("main > [data-human-view]", page(path));
      assert.ok(main, `${path}: no main content`);
      const md = words(readFileSync(`dist${markdownPathFor(path)}`, "utf8"));
      for (const line of lines(main)) {
        assert.ok(md.includes(line), `${path}: "${line.slice(0, 80)}" is missing from ${markdownPathFor(path)}`);
      }
      for (const img of selectAll("img[alt]", main)) {
        const alt = words(String(img.properties.alt));
        if (alt) assert.ok(md.includes(alt), `${path}: image "${alt.slice(0, 80)}" is missing`);
      }
    }
  });

  test("each Work card and its panel compile to one section", () => {
    const md = readFileSync("dist/work.md", "utf8");
    const sections = new Map(
      md
        .split(/^(?=#{2,3} )/m)
        .filter((s) => s.startsWith("### "))
        .map((s) => [s.slice(4, s.indexOf("\n")), words(s)]),
    );
    const groups = selectAll("[data-group]", page("/work/"));
    assert.ok(groups.length >= 2);
    for (const group of groups) {
      const cards = selectAll("[data-card]", group);
      const panels = selectAll("[data-panel]", group);
      assert.equal(cards.length, panels.length);
      cards.forEach((card, i) => {
        const heading = toText(select("h3", panels[i])!).replace(/\s+/g, " ").trim();
        const section = sections.get(heading);
        assert.ok(section, `work.md has no "### ${heading}" section`);
        const name = words(String(card.properties.ariaLabel).split(", ")[0]);
        assert.ok(words(heading).includes(name), `"${heading}" doesn't name its card "${name}"`);
        for (const line of lines(panels[i])) assert.ok(section.includes(line), `"${heading}" is missing "${line.slice(0, 80)}"`);
      });
    }
  });

  test("each Memory compiles to one list item with its caption and the story from the back of the print", () => {
    const items = readFileSync("dist/memories.md", "utf8").split(/^- /m).map(words);
    const prints = selectAll("[data-polaroid]", page("/memories/"));
    assert.ok(prints.length > 0);
    for (const print of prints) {
      const caption = words(toText(select(".front .caption", print)!));
      const story = words(toText(select(".story", print)!));
      const item = items.find((i) => i.includes(caption));
      assert.ok(item, `memories.md has no item for "${caption}"`);
      assert.ok(item.includes(story), `"${caption}" is missing its story`);
    }
  });

  test("Markdown leaves out controls and the old site description", () => {
    const full = readFileSync("dist/llms-full.txt", "utf8");
    for (const text of ["tap to flip back", "developing now", "Flip the", "scroll ↓", "building agents and agent infrastructure"]) {
      assert.ok(!full.includes(text), `llms-full.txt includes "${text}"`);
    }
    assert.doesNotMatch(full, /^copy$/m);
  });
});

describe("agent files", () => {
  test("every sitemap page has a Markdown twin listed in llms.txt or llms-full.txt", async () => {
    const llms = readFileSync("dist/llms.txt", "utf8");
    const full = readFileSync("dist/llms-full.txt", "utf8");
    const paths = sitemapPaths();
    assert.ok(paths.length >= 6);
    for (const path of paths) {
      const md = markdownPathFor(path);
      const res = await get(md);
      assert.equal(res.status, 200, `${md} missing`);
      assert.match(header(res, "content-type"), /text\/markdown/);
      const listed = llms.includes(SITE + md) || full.includes(`Source: ${SITE}${path.replace(/\/$/, "") || "/"}`);
      assert.ok(listed, `${path} not referenced by llms.txt or llms-full.txt`);
    }
  });

  test("every site link in llms.txt resolves", async () => {
    const llms = readFileSync("dist/llms.txt", "utf8");
    assert.match(llms, /^# Austin Rowland\n\n> /);
    const links = [...llms.matchAll(/\]\((https:\/\/austinrowland\.com[^)]*)\)/g)].map((m) => new URL(m[1]).pathname);
    assert.ok(links.length > 0);
    for (const path of links) assert.equal((await get(path)).status, 200, path);
  });

  test("robots.txt sets Content Signals and the sitemap", () => {
    const robots = readFileSync("dist/robots.txt", "utf8");
    assert.match(robots, /^Content-Signal: search=yes, ai-input=yes, ai-train=yes$/m);
    assert.match(robots, /^Sitemap: https:\/\/austinrowland\.com\/sitemap-index\.xml$/m);
  });

  test("HTML pages advertise Markdown and carry valid JSON-LD", () => {
    for (const path of sitemapPaths()) {
      const html = readFileSync(`dist${path}index.html`, "utf8");
      assert.ok(html.includes(`<link rel="alternate" type="text/markdown" href="${markdownPathFor(path)}"`), path);
      assert.match(html, /<meta property="og:image" content="https:\/\/austinrowland\.com\/og\.png(\?v=\d+)?"/);
      for (const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) JSON.parse(m[1]);
    }
    assert.match(readFileSync("dist/index.html", "utf8"), /"@type":"Person"/);
  });

  test("RSS feed lists writing", () => {
    assert.match(readFileSync("dist/rss.xml", "utf8"), /<item><title>AI-Ready APIs/);
  });
});
