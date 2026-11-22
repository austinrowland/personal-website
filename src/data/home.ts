/** A run of text, optionally linked. Internal hrefs become Markdown-twin links in the .md output. */
export type Segment = string | { text: string; href: string };

/** Three lines: who I am, what I love, and why I love it. */
export const homeIntro: Segment[][] = [
  [
    "I'm a product builder who leans on AI to build faster and think bigger. I'm a founding forward deployed engineer at ",
    { text: "Postman", href: "https://www.postman.com/" },
    ", and before that I built at Palo Alto Networks and founded ",
    { text: "Avova Health", href: "/work" },
    ".",
  ],
  [
    "I love helping people, and I keep taking on harder problems so that ",
    { text: "the help reaches further", href: "/story" },
    ".",
  ],
  [
    "I build because that's how I make an impact. Hard work should end up changing someone's life.",
  ],
];
