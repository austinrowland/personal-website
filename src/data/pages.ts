import { site } from "./site";

export type PageMeta = {
  path: string;
  title: string;
  description: string;
  /** The page's visible headline; `headlineAside` is the muted tail some pages show after it. */
  headline?: string;
  headlineAside?: string;
  /** A short paragraph under the headline. */
  lede?: string;
};

/** Titles and descriptions shared by the HTML pages, their Markdown twins, and llms.txt. */
export const pages = {
  home: {
    path: "/",
    title: "Home",
    description: site.description,
    headline: "Hi, I'm Austin Rowland.",
  },
  work: {
    path: "/work",
    title: "Work",
    headline: "Building Where the Product Meets Real People",
    lede: "I've always viewed engineering as a means to an end to impact others, which led me to ponder the debate of product-focus vs engineering-focus lens in which to view the world. These days I find myself getting equally lost in both.",
    description:
      "Roles, projects, ventures, and talks from Austin Rowland: Postman, Palo Alto Networks, Cisco, Avova Health, Tikkun Olam Makers, and more.",
  },
  writing: {
    path: "/writing",
    title: "Writing",
    headline: "My Thoughts and Views on the World",
    description: "Essays and field notes from Austin Rowland on agents, APIs, and building.",
  },
  story: {
    path: "/story",
    title: "Story",
    headline: "Live for Today,",
    headlineAside: "Build for Tomorrow",
    description:
      "Austin Rowland's story: from Walkersville and Georgia Tech to Avova Health and San Francisco, how helping people grew into building for tomorrow, and learning to live for today.",
  },
  memories: {
    path: "/memories",
    title: "Memories",
    headline: "The Art of Noticing: World through my Lens",
    description: "Photos by and of Austin Rowland: film, community, running, and travel.",
  },
  contact: {
    path: "/contact",
    title: "Contact",
    headline: "Building with agents? Let's talk.",
    description: "Get in touch with Austin Rowland or book a 30-minute call.",
  },
} satisfies Record<string, PageMeta>;

/** `/` → `/index.md`, `/work/` → `/work.md`, `/writing/post` → `/writing/post.md`. */
export function fullHeadline(page: PageMeta): string {
  return [page.headline, page.headlineAside].filter(Boolean).join(" ");
}

export function markdownPath(pathname: string): string {
  const clean = pathname.replace(/\/index\.html$/, "").replace(/\/+$/, "");
  return clean ? `${clean}.md` : "/index.md";
}

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).href;
}
