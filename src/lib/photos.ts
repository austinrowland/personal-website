import type { ImageMetadata } from "astro";

const files = import.meta.glob<{ default: ImageMetadata }>(
  "../assets/photos/*.{jpg,jpeg,png,webp,avif}",
  { eager: true },
);

/** Photos keyed by file name without extension, e.g. "tedx-gt". */
const photoAssets: Record<string, ImageMetadata> = Object.fromEntries(
  Object.entries(files).map(([path, mod]) => [
    path.split("/").pop()!.replace(/\.[^.]+$/, ""),
    mod.default,
  ]),
);

/** Where to keep the subject when a photo is cropped to another aspect ratio. */
const photoFocus: Record<string, string> = {
  "tedx-gt": "42% 58%",
  "spread-the-love": "50% 38%",
  "tom-build-day": "55% 45%",
  "georgia-tech-graduation": "42% 45%",
  "graduation-interview": "50% 40%",
  "guatemala-summit": "28% 50%",
  "postman-ai-ready-apis": "60% 35%",
};

export function getPhoto(name?: string): ImageMetadata | undefined {
  return name ? photoAssets[name] : undefined;
}

export function getPhotoFocus(name?: string): string | undefined {
  return name ? photoFocus[name] : undefined;
}
