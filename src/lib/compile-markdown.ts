import type { Element, ElementContent, Root as HastRoot } from "hast";
import type { Root as MdastRoot, RootContent } from "mdast";
import { fromHtml } from "hast-util-from-html";
import { select } from "hast-util-select";
import { toMdast } from "hast-util-to-mdast";
import { toText } from "hast-util-to-text";
import { toMarkdown } from "mdast-util-to-markdown";
import { visit } from "unist-util-visit";
import { absoluteUrl, markdownPath } from "../data/pages";
import { site } from "../data/site";

/**
 * Compiles a built HTML page into Markdown, so a page's Markdown twin always says what the page says.
 *
 * Markup rules the compiler follows:
 * - Controls (buttons, inputs), scripts, SVG, `aria-hidden` and `data-md-skip` elements are left out,
 *   except `aria-hidden` wrappers around `data-md-keep` content (the back of a flipping print).
 * - An element whose visible text is all hidden (an icon link, a typed-out headline) uses its `aria-label`.
 * - `<hgroup>` puts its heading first, so a label shown above a heading stays with that heading's section.
 * - Site links point to Markdown twins; images and links become absolute URLs.
 */
export type CompiledPage = {
  title: string;
  description: string;
  url: string;
  /** Page content without front matter, as used in llms-full.txt. */
  content: string;
};

const DROP = new Set([
  "script", "style", "svg", "template", "noscript", "button", "input", "select", "textarea",
  "canvas", "iframe", "link", "meta",
]);
const HEADING = /^h[1-6]$/;

function dropped(node: Element): boolean {
  const p = node.properties;
  const hidden = p.ariaHidden === "true" && !select("[data-md-keep]", node);
  return DROP.has(node.tagName) || hidden || p.hidden === true || p.dataMdSkip !== undefined;
}

function hasImage(node: Element): boolean {
  return node.children.some((c) => c.type === "element" && (c.tagName === "img" || hasImage(c)));
}

/** Applies the markup rules above, in place. */
function prepare(node: Element | HastRoot): void {
  node.children = node.children.filter((c) => c.type !== "element" || !dropped(c)) as typeof node.children;
  for (const child of node.children) if (child.type === "element") prepare(child);
  if (node.type !== "element") return;

  const label = node.properties.ariaLabel;
  if (typeof label === "string" && node.tagName !== "img" && !toText(node).trim() && !hasImage(node)) {
    node.children = [{ type: "text", value: label }];
  }
  if (node.tagName === "hgroup") {
    const heading = node.children.find((c) => c.type === "element" && HEADING.test(c.tagName));
    if (heading) node.children = [heading, ...node.children.filter((c) => c !== heading)];
  }
  if (HEADING.test(node.tagName)) {
    visit(node, "element", (el, i, parent) => {
      if (el.tagName === "br" && parent && i !== undefined) {
        parent.children[i] = { type: "text", value: " " };
      }
    });
  }
  // Adjacent elements with no text between them read as separate words, not one run-on word.
  const spaced: ElementContent[] = [];
  for (const child of node.children) {
    const prev = spaced.at(-1);
    if (prev?.type === "element" && child.type === "element") spaced.push({ type: "text", value: " " });
    spaced.push(child);
  }
  node.children = spaced;
}

function resolveUrl(url: string, page: string): string {
  if (/^(mailto:|tel:|#)/.test(url) || /^[a-z][a-z0-9+.-]*:\/\//i.test(url)) return url;
  const target = new URL(url, new URL(page, site.url));
  if (target.origin !== new URL(site.url).origin) return target.href;
  const isAsset = /\.[a-z0-9]+$/i.test(target.pathname) && !target.pathname.endsWith(".html");
  return isAsset ? target.href : absoluteUrl(markdownPath(target.pathname)) + target.hash;
}

function toMd(tree: MdastRoot): string {
  return toMarkdown(tree, {
    bullet: "-",
    emphasis: "*",
    strong: "*",
    rule: "-",
    listItemIndent: "one",
    fences: true,
  }).trim();
}

function convert(fragment: Element, page: string): MdastRoot {
  const root: HastRoot = { type: "root", children: [structuredClone(fragment)] };
  prepare(root);
  const md = toMdast(root) as MdastRoot;
  visit(md, (node, i, parent) => {
    if (node.type === "image" && !node.alt && parent && i !== undefined) {
      parent.children.splice(i, 1);
      return i;
    }
    if (node.type === "link" || node.type === "image") {
      node.url = resolveUrl(node.url, page);
      node.title = null;
    }
  });
  return md;
}

/** Compiles one built page. `path` is the page's URL path, e.g. `/work`. */
export function compilePage(html: string, path: string): CompiledPage {
  const doc = fromHtml(html);
  const title = toText(select("title", doc) ?? doc).replace(new RegExp(` · ${site.name}$`), "").trim();
  const description = String(select('meta[name="description"]', doc)?.properties.content ?? "");
  const main = select("main > [data-human-view]", doc);
  if (!main) throw new Error(`${path}: no <main> content to compile`);

  const body = convert(main, path);
  const intro: RootContent = {
    type: "blockquote",
    children: [
      {
        type: "paragraph",
        children: [
          { type: "text", value: `${description}\nSite index for agents: ` },
          { type: "link", url: absoluteUrl("/llms.txt"), children: [{ type: "text", value: absoluteUrl("/llms.txt") }] },
        ],
      },
    ],
  };
  const h1 = body.children.findIndex((n) => n.type === "heading" && n.depth === 1);
  if (h1 === -1) body.children.unshift({ type: "heading", depth: 1, children: [{ type: "text", value: title }] }, intro);
  else body.children.splice(h1 + 1, 0, intro);

  return { title, description, url: absoluteUrl(path), content: toMd(body) };
}

export function renderMarkdown(page: CompiledPage): string {
  return `---
title: ${JSON.stringify(page.title)}
description: ${JSON.stringify(page.description)}
url: ${page.url}
---

${page.content}
`;
}
