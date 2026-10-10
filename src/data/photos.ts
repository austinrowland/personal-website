export type GalleryPhoto = {
  name: string;
  alt: string;
  caption: string;
};

// Placeholders until the originals are added to src/assets/photos/.
export const gallery: GalleryPhoto[] = [
  { name: "tedx-gt", alt: "On stage at TEDxGeorgiaTech", caption: "tedxgeorgiatech · atlanta · 2023" },
  { name: "spread-the-love-24", alt: "The Spread the Love cookie table", caption: "spread the love · georgia tech · 2024" },
  { name: "tikkun-olam-speech", alt: "Speaking at a Tikkun Olam Makers event", caption: "tikkun olam makers · atlanta · 2024" },
  { name: "phr-gloves", alt: "Passive haptic rehab gloves", caption: "rehab gloves lab · georgia tech · 2023" },
  { name: "avova-health", alt: "Avova Health", caption: "avova health · 2024" },
  { name: "gt-with-bethanie", alt: "At Georgia Tech with Bethanie", caption: "georgia tech · 2024" },
  { name: "org-fair", alt: "At a Georgia Tech organization fair", caption: "org fair · georgia tech" },
  { name: "ultramarathon", alt: "Running an ultramarathon", caption: "ultramarathon · 2025" },
  { name: "guatemala-summit", alt: "At a summit in Guatemala", caption: "guatemala · 2026" },
];
