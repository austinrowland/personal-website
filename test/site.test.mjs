// Checks the built site (run `npm run build` first) and the agent-facing behavior of scripts/serve.mjs.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createSiteServer, markdownPathFor, prefersMarkdown } from "../scripts/serve.mjs";

const SITE = "https://austinrowland.com";
let base;
let server;

before(async () => {
  assert.ok(existsSync("dist/index.html"), "dist/ is missing: run `npm run build` first");
  server = createSiteServer({ root: "dist" });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server?.close());

const get = (path, headers = {}) => fetch(base + path, { headers });

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
  });

  test("markdownPathFor maps page paths to .md twins", () => {
    assert.equal(markdownPathFor("/"), "/index.md");
    assert.equal(markdownPathFor("/work/"), "/work.md");
    assert.equal(markdownPathFor("/writing/post"), "/writing/post.md");
  });

  test("browsers get HTML with discovery headers", async () => {
    const res = await get("/work/", { Accept: "text/html" });
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /text\/html/);
    assert.equal(res.headers.get("vary"), "Accept");
    assert.match(res.headers.get("link"), /<\/work\.md>; rel="alternate"; type="text\/markdown"/);
    assert.match(res.headers.get("link"), /<\/llms\.txt>; rel="llms-txt"/);
    assert.match(res.headers.get("content-signal"), /ai-input=yes/);
  });

  test("Accept: text/markdown returns the Markdown twin", async () => {
    const res = await get("/", { Accept: "text/markdown" });
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /text\/markdown/);
    assert.equal(res.headers.get("x-robots-tag"), "noindex");
    assert.ok(Number(res.headers.get("x-markdown-tokens")) > 0);
    const body = await res.text();
    assert.match(body, /^---\ntitle:/);
    assert.match(body, /^# Austin Rowland$/m);
    assert.doesNotMatch(body, /<(div|nav|script|span)\b/);
  });

  test("/.well-known/llms.txt mirrors /llms.txt", async () => {
    const [a, b] = await Promise.all([get("/llms.txt"), get("/.well-known/llms.txt")]);
    assert.equal(b.status, 200);
    assert.equal(await b.text(), await a.text());
  });

  test("missing pages return 404 in the requested format", async () => {
    const html = await get("/nope");
    assert.equal(html.status, 404);
    assert.match(html.headers.get("content-type"), /text\/html/);
    const md = await get("/nope", { Accept: "text/markdown" });
    assert.equal(md.status, 404);
    assert.match(await md.text(), /# Page not found/);
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
      assert.match(res.headers.get("content-type"), /text\/markdown/);
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
      assert.match(html, /<meta property="og:image" content="https:\/\/austinrowland\.com\/og\.png"/);
      for (const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) JSON.parse(m[1]);
    }
    assert.match(readFileSync("dist/index.html", "utf8"), /"@type":"Person"/);
  });

  test("RSS feed lists writing", () => {
    assert.match(readFileSync("dist/rss.xml", "utf8"), /<item><title>AI-Ready APIs/);
  });
});
