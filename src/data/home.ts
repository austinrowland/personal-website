/** A run of text, optionally linked. Internal hrefs become Markdown-twin links in the .md output. */
export type Segment = string | { text: string; href: string };

export const homeIntro: Segment[][] = [
  [
    "I'm a founding forward deployed engineer at ",
    { text: "Postman", href: "https://www.postman.com/" },
    " in San Francisco, building agents and agent infrastructure. I work inside some of the largest API programs in the world to see where agents get stuck, then fix the route.",
  ],
  [
    "Lately that's ",
    { text: "AI-Ready APIs", href: "/writing" },
    ". Before that: security at Palo Alto Networks and Cisco, computer engineering at Georgia Tech, cookies on the lawn, and a ",
    { text: "TEDx talk", href: "/work" },
    " about ambition.",
  ],
];

export const homeTagline = ["Go and watch where it fails.", "Then improve the route."] as const;
