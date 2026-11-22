/** A run of text, optionally linked. Internal hrefs become Markdown-twin links in the .md output. */
export type Segment = string | { text: string; href: string };

/** Three lines: who I am, what I do for fun, and what I love building. */
export const homeIntro: Segment[][] = [
  [
    "I'm a founding forward deployed engineer on the CTO's frontier team at ",
    { text: "Postman", href: "https://www.postman.com/" },
    " in San Francisco, and a Georgia Tech computer engineering grad.",
  ],
  [
    "Outside of work I run ultramarathons, shoot film, and hand out ",
    { text: "cookies to strangers", href: "/work" },
    ".",
  ],
  [
    "I love building things that close the gap between what technology can do and what people actually need: assistive tech, a ",
    { text: "health startup", href: "/story" },
    ", and now the infrastructure agents run on.",
  ],
];
