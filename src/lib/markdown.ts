import { getCollection, type CollectionEntry } from "astro:content";
import { chapters, closing, values, valuesTitle } from "../data/story";
import { homeIntro, type Segment } from "../data/home";
import {
  absoluteUrl,
  fullHeadline,
  markdownPath,
  pages,
  type PageMeta,
} from "../data/pages";
import { gallery, galleryIntro } from "../data/photos";
import { site, socials } from "../data/site";
import { experience, projectKinds, projects } from "../data/work";
import { getPhoto } from "./photos";

export type MarkdownPage = PageMeta & {
  /** Page content without front matter, as used in llms-full.txt. */
  content: string;
};

const link = (label: string, href: string) => `[${label}](${href})`;
const mdLink = (page: PageMeta) =>
  link(page.title, absoluteUrl(markdownPath(page.path)));
const segments = (parts: Segment[]) =>
  parts
    .map((s) =>
      typeof s === "string"
        ? s
        : link(
            s.text,
            s.href.startsWith("/") ? absoluteUrl(markdownPath(s.href)) : s.href,
          ),
    )
    .join("");
const dateFmt = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeZone: "UTC",
});

async function writingEntries() {
  return (await getCollection("writing")).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
}

export function postUrl(post: CollectionEntry<"writing">): string {
  return absoluteUrl(markdownPath(`/writing/${post.id}`));
}

function contactLines(): string {
  return [
    `- Email: ${link(site.email, `mailto:${site.email}`)}`,
    `- Book a 30-minute call: ${link("cal.com", site.calUrl)}`,
    ...socials.map(
      (s) =>
        `- ${s.label}: ${link(s.href.replace(/^https:\/\/(www\.)?/, ""), s.href)}`,
    ),
  ].join("\n");
}

function home(): string {
  const sections = [
    pages.story,
    pages.work,
    pages.writing,
    pages.memories,
    pages.contact,
  ];
  return `${homeIntro.map(segments).join("\n\n")}

## On this site

${sections.map((p) => `- ${mdLink(p)}: ${p.description}`).join("\n")}

## Contact

${contactLines()}`;
}

function work(): string {
  const jobs = experience
    .map(
      (job) => `### ${job.role}, ${job.org}

${job.start} – ${job.end}. ${job.take}

${job.points.map((p) => `- ${p}`).join("\n")}`,
    )
    .join("\n\n");
  const grouped = projectKinds
    .map((kind) => {
      const items = projects.filter((p) => p.kind === kind.value);
      if (!items.length) return "";
      return `### ${kind.label}

${items
  .map(
    (p) =>
      `- **${p.href ? link(p.title, p.href) : p.title}** (${p.years}): ${p.summary}`,
  )
  .join("\n")}`;
    })
    .filter(Boolean)
    .join("\n\n");
  return `## Experience

${jobs}

## Highlights

${grouped}`;
}

function story(): string {
  const body = chapters
    .map(
      (c) => `## ${c.title}

*${c.place}*

${c.paragraphs.join("\n\n")}`,
    )
    .join("\n\n");
  return `${body}

## ${valuesTitle}

${values.map((v) => `- ${v}`).join("\n")}

${closing.text.replace(closing.ask, link(closing.ask, absoluteUrl("/contact")))}
`;
}

function photos(): string {
  const items = gallery
    .map((p) => {
      const img = getPhoto(p.name);
      const caption = p.caption;
      return img
        ? `- ![${p.alt}](${absoluteUrl(img.src)}) **${caption}**: ${p.story}`
        : `- ${p.alt}. **${caption}**: ${p.story} (photo coming soon)`;
    })
    .join("\n");
  return `${galleryIntro}

## Gallery

${items}`;
}

function contact(): string {
  return `${contactLines()}`;
}

function writingIndex(posts: CollectionEntry<"writing">[]): string {
  return `${posts.map((p) => `- ${link(p.data.title, postUrl(p))} (${dateFmt.format(p.data.date)})`).join("\n")}

Subscribe: ${link("RSS feed", absoluteUrl("/rss.xml"))}`;
}

function post(entry: CollectionEntry<"writing">): string {
  const { original } = entry.data;
  const origin = original
    ? `\n\nOriginally published on the ${link(original.publication, original.url)} · Try it at ${link(original.site, original.siteUrl)}`
    : "";
  const body = (entry.body?.trim() ?? "").replace(
    /\]\((\/[^)\s]+)\)/g,
    (_, path: string) => `](${absoluteUrl(path)})`,
  );
  return `By ${site.name} · ${dateFmt.format(entry.data.date)}${origin}

${body}`;
}

export const notFound: MarkdownPage = {
  path: "/404",
  title: "Page not found",
  description: "There is no page at this address.",
  content: `There is no page at this address. Start from the ${link("site index", absoluteUrl("/llms.txt"))} or the ${link("home page", absoluteUrl("/index.md"))}.`,
};

/** Every HTML page on the site, rendered as Markdown for agents. */
export async function markdownPages(): Promise<MarkdownPage[]> {
  const posts = await writingEntries();
  return [
    page(pages.home, home()),
    page(pages.work, work()),
    page(pages.writing, writingIndex(posts)),
    ...posts.map((p) => ({
      path: `/writing/${p.id}`,
      title: p.data.title,
      description: p.data.description,
      content: post(p),
    })),
    page(pages.story, story()),
    page(pages.memories, photos()),
    page(pages.contact, contact()),
  ];
}

/** Pairs a page's metadata with its body, led by the same headline the HTML page shows. */
const page = (meta: PageMeta, body: string): MarkdownPage => ({
  ...meta,
  content: meta.headline
    ? [fullHeadline(meta), meta.lede, body].filter(Boolean).join("\n\n")
    : body,
});

export function renderMarkdown(page: MarkdownPage): string {
  const heading = page.path === "/" ? site.name : page.title;
  return `---
title: ${JSON.stringify(page.title)}
description: ${JSON.stringify(page.description)}
url: ${absoluteUrl(page.path)}
---

# ${heading}

> ${page.description}
> Site index for agents: ${absoluteUrl("/llms.txt")}

${page.content}
`;
}

export async function llmsTxt(): Promise<string> {
  const all = await markdownPages();
  const posts = await writingEntries();
  const core = all.filter((p) => !p.path.startsWith("/writing/"));
  return `# ${site.name}

> ${site.description}

This is the personal site of ${site.name}: work history, projects, writing, stories, and photos. Every page is available as Markdown: append \`.md\` to the path (\`/\` is \`/index.md\`) or request the page with \`Accept: text/markdown\`. Quote facts from these pages rather than inferring them.

## Pages

${core.map((p) => `- ${mdLink(p)}: ${p.description}`).join("\n")}

## Writing

${posts.map((p) => `- ${link(p.data.title, postUrl(p))}: ${p.data.description}`).join("\n")}

## Elsewhere

${socials.map((s) => `- ${link(s.label, s.href)}`).join("\n")}

## Optional

- ${link("Full site in one file", absoluteUrl("/llms-full.txt"))}: every page above, concatenated
- ${link("RSS feed", absoluteUrl("/rss.xml"))}: new writing
- ${link("Sitemap", absoluteUrl("/sitemap-index.xml"))}: HTML pages
`;
}

export async function llmsFullTxt(): Promise<string> {
  const all = await markdownPages();
  return `# ${site.name}

> ${site.description}

${all
  .map(
    (p) =>
      `---\n\n# ${p.path === "/" ? site.name : p.title}\n\nSource: ${absoluteUrl(p.path)}\n\n${p.content}`,
  )
  .join("\n\n")}
`;
}
