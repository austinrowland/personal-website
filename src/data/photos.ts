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
  { name: "gt-with-bethanie", alt: "Austin and Bethanie in graduation gowns, sitting in front of a rainbow glass wall at Georgia Tech", caption: "georgia tech's best gift", story: "A photo of Bethanie and I in some of our last days at GT. I truly lucked out in finding such a kind, ambitious, and adventurous partner. We graduated together and have embarked on many amazing chapters and adventures together ever since. Best gift I ever got from Georgia Tech." },
  { name: "valentines-albums", alt: "A custom album cover, Luv Wav Bounces Vol. 2, with a selfie of Austin and Bethanie in front of an old stone building", caption: "most interesting project", story: "Made a couple of custom albums as Valentine's Day gifts. Coming home to record these in 3 days nonstop on my brother's studio equipment as a non-musician was quite the test of ability. Luckily, I'd said they turned out rather well for the finished product." },
  { name: "guatemala-summit", alt: "Austin on a summit in Guatemala with a smoking volcano behind him", caption: "guatemala", story: "I ventured on another solo trip down to Guatemala, in an effort to go climb a volcano. Did I have good hiking experience? No. Was I prepared for this? Absolutely not. Was it an awesome adventure? Hell yeah. I spent around 28 hours hiking volcanoes with other travelers that evening, slept on the volcano, and got to watch dozens of eruptions up-close." },
  { name: "fishbowl", alt: "The Fishbowl band and friends gathered on a string-lit backyard stage at night", caption: "fishbowl", story: "My friends senior year had started a cool band in their backyard called the Fishbowl. They hosted parties and concerts to bring people together in their backyard, which would be named the Fishbowl, which would pack out hundreds of students at every event. This photo is from the night before graduation, where I got to perform with them, see lots of friends, and celebrate a close to the victory lap at Georgia Tech." },
  { name: "ultramarathon", alt: "Austin biting his finisher medal on the Embarcadero after an ultramarathon", caption: "ultramarathon", story: "One of the hardest things I have ever done. I am a big bucket list guy, which seems to be ever-growing. I saw this race on social media when I had first moved to SF, and knew that I was going to end up chasing after that bucket list item. After a year of training and learning to love running as a way to explore San Francisco, I finally completed the race with a time of 7 hours and 57 minutes, 9:06 pace, and achieved my lofty time goal of a sub-eight hour double marathon." },
];

export function photoAlt(name: string | undefined, fallback: string): string {
  return gallery.find((p) => p.name === name)?.alt ?? fallback;
}
