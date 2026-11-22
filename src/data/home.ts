/** A run of text, optionally linked. Internal hrefs become Markdown-twin links in the .md output. */
export type Segment = string | { text: string; href: string };

/** Three lines: who I am, what I love, and why I love it. */
export const homeIntro: Segment[][] = [
  [
    "I'm a product builder working to scale myself with AI to create faster and dream bigger. I'm a founding forward deployed engineer at ",
    { text: "Postman", href: "https://www.postman.com/" },
    ", and before that I built at Palo Alto Networks and founded ",
    { text: "Avova Health", href: "/work" },
    ".",
  ],
  [
    "I truly love helping people, both in my day to day as well as my work. As I grow older, I continue pursuing harder problems so that my impact can create ",
    { text: "a bigger sphere of influence", href: "/story" },
    ".",
  ],
  [
    "I believe in hard work, smart work, but most of all, meaningful work. What good are the first two if the work isn't helping create a better world for tomorrow's generation?",
  ],
];
