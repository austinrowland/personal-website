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
  { name: "georgia-tech-graduation", alt: "Austin smiling among graduates at Georgia Tech commencement", caption: "georgia tech commencement · 2024", story: "Commencement, 2024. A few years earlier I was calling home almost every day, sure I'd fail out. Here I was walking with the people I used to compare myself to." },
  { name: "graduation-interview", alt: "Austin being interviewed with a microphone at Georgia Tech commencement", caption: "commencement interview · 2024", story: "Someone stopped me with a microphone on the way out of commencement. I was still taking in the fact that I'd made it." },
  { name: "guatemala-summit", alt: "Austin on a summit in Guatemala with a smoking volcano behind him", caption: "guatemala · 2026", story: 'On a summit in Guatemala with a volcano smoking behind me. The longer story is still to be written.' },
  { name: "ultramarathon", alt: "Austin biting his finisher medal on the Embarcadero after a 2025 race", caption: "ultramarathon · 2025", story: 'Biting my finisher medal on the Embarcadero after a 2025 ultramarathon. Training was the first habit I ever kept.' },
];

export function photoAlt(name: string | undefined, fallback: string): string {
  return gallery.find((p) => p.name === name)?.alt ?? fallback;
}
