export type GalleryPhoto = {
  name: string;
  alt: string;
  caption: string;
  /** The longer memory on the back of the print. */
  story: string;
};

/** Small, repeating tilts so a grid of prints looks hand-placed. */
export const tilts = [-1.6, 1.2, -0.6, 1.8, -1.2, 0.8];

export const galleryIntro =
  "I have always loved photography as it requires careful thought about what matters to you and how you choose to showcase it. They show the way that someone views the world and documents them through a lens. In a way, my love for photography translates to my love for my work, my hobbies, and my relationships. Anyways, if you care to see the world through my lens, here's a glimpse of some meaningful moments in my life.";

// `name` matches a file in src/assets/photos/; missing files render as placeholders.
export const gallery: GalleryPhoto[] = [
  { name: "tedx-gt", alt: "Austin speaking on stage at TEDxGeorgiaTech", caption: "tedxgeorgiatech · atlanta · 2023", story: "In November 2023 I gave a TEDxGeorgiaTech talk called Ambition Might Be Your Achilles Heel. I wrote it about the year I tried to do everything at once, and saying it out loud on that stage made me admit how thin I'd spread myself." },
  { name: "spread-the-love", alt: "Austin and Jared at the Spread the Love free cookie table on a Valentine's Day afternoon", caption: "spread the love · georgia tech", story: "Every Valentine's Day we set up a table on campus and handed out free cookies with handwritten notes to anyone who walked by. It started with a few friends and an oven, and by the end we'd given away thousands." },
  { name: "tom-build-day", alt: "The Tikkun Olam Makers team with a finished toddler mobility trainer", caption: "tikkun olam makers · build day", story: "Tikkun Olam Makers paired students with families who needed assistive devices you can't buy off the shelf. Build days were long and loud, and this one ended with a finished toddler mobility trainer." },
  { name: "avova-health", alt: "The Avova Health team on stage at Mayo Clinic holding a certificate", caption: "avova health · mayo clinic · 2024", story: 'Our Avova team on stage at Mayo Clinic, finalists in their 2024 startup competition. This was the day it felt most real, a few months before we wound it down.' },
  { name: "georgia-tech-graduation", alt: "Austin smiling among graduates at Georgia Tech commencement", caption: "georgia tech commencement · 2024", story: "Commencement, 2024. A few years earlier I was calling home almost every day, sure I'd fail out. Here I was walking with the people I used to compare myself to." },
  { name: "graduation-interview", alt: "Austin being interviewed with a microphone at Georgia Tech commencement", caption: "commencement interview · 2024", story: "Someone stopped me with a microphone on the way out of commencement. I was still taking in the fact that I'd made it." },
  { name: "postman-ai-ready-apis", alt: "Austin beside a Postman billboard asking 'Are your APIs ready for AI agents?'", caption: "postman · san francisco · 2026", story: 'Walking past a Postman billboard in San Francisco asking whether your APIs are ready for AI agents, the question my work has been about lately.' },
  { name: "guatemala-summit", alt: "Austin on a summit in Guatemala with a smoking volcano behind him", caption: "guatemala · 2026", story: 'On a summit in Guatemala with a volcano smoking behind me. The longer story is still to be written.' },
  { name: "tikkun-olam-speech", alt: "Austin speaking to a room at a Tikkun Olam Makers event", caption: "tikkun olam makers · atlanta · 2024", story: 'Speaking to a room at a Tikkun Olam Makers event in Atlanta about why we build for the families we work with.' },
  { name: "phr-gloves", alt: "A phone app tracking a hand with computer vision for the rehab gloves lab", caption: "rehab gloves lab · georgia tech · 2023", story: 'An early prototype from the rehab gloves lab at Georgia Tech: a phone app tracking a hand with computer vision, long before it worked reliably.' },
  { name: "ultramarathon", alt: "Austin biting his finisher medal on the Embarcadero after a 2025 race", caption: "ultramarathon · 2025", story: 'Biting my finisher medal on the Embarcadero after a 2025 ultramarathon. Training was the first habit I ever kept.' },
];

export function photoAlt(name: string | undefined, fallback: string): string {
  return gallery.find((p) => p.name === name)?.alt ?? fallback;
}
