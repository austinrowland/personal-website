export type GalleryPhoto = {
  name: string;
  alt: string;
  caption: string;
};

export const galleryIntro =
  "I have always loved photography as it requires careful thought about what matters to you and how you choose to showcase it. They show the way that someone views the world and documents them through a lens. In a way, my love for photography translates to my love for my work, my hobbies, and my relationships. Anyways, if you care to see the world through my lens, here's a glimpse of some meaningful moments in my life.";

// `name` matches a file in src/assets/photos/; missing files render as placeholders.
export const gallery: GalleryPhoto[] = [
  { name: "tedx-gt", alt: "Austin speaking on stage at TEDxGeorgiaTech", caption: "tedxgeorgiatech · atlanta · 2023" },
  { name: "spread-the-love", alt: "Austin and Jared at the Spread the Love free cookie table on a Valentine's Day afternoon", caption: "spread the love · georgia tech" },
  { name: "tom-build-day", alt: "The Tikkun Olam Makers team with a finished toddler mobility trainer", caption: "tikkun olam makers · build day" },
  { name: "avova-health", alt: "The Avova Health team on stage at Mayo Clinic holding a certificate", caption: "avova health · mayo clinic · 2024" },
  { name: "georgia-tech-graduation", alt: "Austin smiling among graduates at Georgia Tech commencement", caption: "georgia tech commencement · 2024" },
  { name: "graduation-interview", alt: "Austin being interviewed with a microphone at Georgia Tech commencement", caption: "commencement interview · 2024" },
  { name: "postman-ai-ready-apis", alt: "Austin beside a Postman billboard asking 'Are your APIs ready for AI agents?'", caption: "postman · san francisco · 2026" },
  { name: "guatemala-summit", alt: "Austin on a summit in Guatemala with a smoking volcano behind him", caption: "guatemala · 2026" },
  { name: "tikkun-olam-speech", alt: "Austin speaking to a room at a Tikkun Olam Makers event", caption: "tikkun olam makers · atlanta · 2024" },
  { name: "phr-gloves", alt: "A phone app tracking a hand with computer vision for the rehab gloves lab", caption: "rehab gloves lab · georgia tech · 2023" },
  { name: "ultramarathon", alt: "Austin biting his finisher medal on the Embarcadero after a 2025 race", caption: "ultramarathon · 2025" },
];

export function photoAlt(name: string | undefined, fallback: string): string {
  return gallery.find((p) => p.name === name)?.alt ?? fallback;
}
