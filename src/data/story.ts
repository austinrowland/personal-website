/** The Story page: chapters that scroll in with ink drawings. Each line renders on the page and in /story.md. */
export type InkScene = "town" | "tower" | "note" | "pulse" | "stage" | "trail";

export type Chapter = {
  place: string;
  title: string;
  scene: InkScene;
  paragraphs: string[];
};

export const chapters: Chapter[] = [
  {
    place: "Walkersville, Maryland",
    title: "Keeping score",
    scene: "town",
    paragraphs: [
      "I grew up in Walkersville, Maryland, where everything was a competition: grades, sports, whatever my friends could turn into a race. I was a top performer for most of my life, and I liked it best when I was winning.",
      "It took me years to notice that the things I'm proudest of weren't wins at all. They were moments when something I built made someone's day a little easier.",
    ],
  },
  {
    place: "Georgia Tech",
    title: "Building for tomorrow",
    scene: "tower",
    paragraphs: [
      "Georgia Tech was the first place I wasn't at the top. Sophomore year, my money for school fell through. Most weeks ran about 100 hours between a job at Blue Donkey Coffee, my RA job, and five of the hardest classes I've taken, and I came close to leaving for the military.",
      "By the end of that summer I could support myself. If I could make it through that, I figured I could do anything. It also left me with a habit that took years to unlearn: giving up today to build for tomorrow.",
    ],
  },
  {
    place: "Spread the Love · Tikkun Olam Makers",
    title: "Noticing the gaps",
    scene: "note",
    paragraphs: [
      "So I tried to do everything, and that's where I started noticing gaps. Some were small: a campus that could use more kindness became Spread the Love, free cookies and handwritten notes on the lawn.",
      "Some were bigger: through Tikkun Olam Makers, I worked with students building assistive tech for people whose needs no store-bought product met. That was the first time I watched engineering change how someone lives, and I haven't stopped chasing that feeling since.",
    ],
  },
  {
    place: "Avova Health",
    title: "A real need, and a real business",
    scene: "pulse",
    paragraphs: [
      "Avova Health came from the same place. Patients kept telling us their records were scattered across every provider they'd ever seen, so I founded a company to build an AI health companion that pulled them into one profile.",
      "People liked it, but selling through providers and insurers didn't work before the runway ran out. It taught me that a real need and a working business are two different problems, and that I want to be close to both.",
    ],
  },
  {
    place: "TEDxGeorgiaTech",
    title: "Ambition and humanity",
    scene: "stage",
    paragraphs: [
      "In my fourth year I gave a TEDx talk about ambition, my guiding light and my Achilles heel. For years I had pushed myself to make every hour productive, and I kept swinging between good stretches and months where I felt like I wasn't doing enough.",
      "What pulled me out was simple: when things get hard, I hit reset and focus on what makes me happy right now, like the gym, books, and friends. You can do anything, but you can't do everything, and you don't have to give up your humanity to build something that matters.",
    ],
  },
  {
    place: "San Francisco, today",
    title: "Live for today, build for tomorrow",
    scene: "trail",
    paragraphs: [
      "My passions have changed shape more than direction. Now they're narrower and deeper: go where technology meets real people, watch where it fails, then build the fix. Currently, the world's most urgent problem to address is how humanity will responsibly apply AI to transform the lives of people all over the world and every industry, and I aim to be a part of that solution.",
      "And I try to be fully present for the days in between: ultramarathons, film photos, a coffee club, and being the friend who connects people. Building a better tomorrow only counts if I keep showing up for today.",
    ],
  },
];

export const valuesTitle = "Three things I try to live by";

export const values = [
  "Make the work visible.",
  "Show up for people, especially when it's inconvenient.",
  "Good work that costs you your life isn't as good as you think.",
];

/** The closing line; `ask` is linked to /contact. */
export const closing = { text: "If any of this sounds like a problem you're working on, let's talk.", ask: "let's talk" };
