// Timeline, as fractions of the intro's scroll length. Every frame is a pure function of progress, so scrolling back up rewinds it.
// Kept apart from the 3D engine so the page can drive the still camera and the overlays before three.js has loaded.
export const TIMELINE = {
  hover: [0.04, 0.24],
  approach: [0.26, 0.4],
  flash: [0.4, 0.47],
  eject: [0.44, 0.6],
  zoom: [0.62, 0.98],
  fadeCamera: [0.7, 0.86],
} as const;

export const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);
export const span = (t: number, [a, b]: readonly [number, number]) => clamp01((t - a) / (b - a));
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
/** Flash strength (0–1): full at the shutter, fading out over the flash span. */
export const flashAt = (p: number) => (p >= TIMELINE.flash[0] ? 1 - span(p, TIMELINE.flash) : 0);
