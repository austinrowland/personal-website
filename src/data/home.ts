/** A run of text, optionally linked. Internal hrefs become Markdown-twin links in the .md output. */
export type Segment = string | { text: string; href: string };

export const homeIntro: Segment[][] = [
  [
    "I'm a founding forward deployed engineer on the CTO's frontier team at ",
    { text: "Postman", href: "https://www.postman.com/" },
    " in San Francisco, helping turn an API platform into infrastructure for agents. I go inside customer deployments, find the bottleneck, and build the fix back into the product.",
  ],
  [
    "What I love most is owning a problem end to end, especially one that changes how someone lives. That has taken me through security at Cisco and Palo Alto Networks, assistive tech with ",
    { text: "Tikkun Olam Makers", href: "/work" },
    ", and founding ",
    { text: "Avova Health", href: "/work" },
    ". Outside work: ultramarathons, film photos, cookies for strangers, and a ",
    { text: "TEDx talk", href: "/writing/ambition-might-be-your-achilles-heel" },
    " about ambition.",
  ],
];

export const homeTagline = ["Go and watch where it fails.", "Then improve the route."] as const;

/** Titles from src/data/work.ts and photo names from src/data/photos.ts previewed on the home page. */
export const homeFeatured = {
  projects: ["AI-Ready APIs", "Avova Health", "Tikkun Olam Makers"],
  photos: ["ultramarathon", "guatemala-summit", "spread-the-love"],
  posts: 3,
};
