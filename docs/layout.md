# Site Layout Map

> Built from `docs/profile.md` and the four inspiration sites in
> `docs/design-inspiration/` (Frederick James, Shubhu, Carter Cote, Aditya
> Dave). Decisions: light theme by default with a dark toggle, a minimal
> homepage, expressive motion.

## Global system

- **Theme:** light "paper" by default, with a dark "night" theme behind a
  toggle in the header. The choice is saved in `localStorage`, and an inline
  script applies it before first paint so the page never flashes.
  - Light: paper `#faf7f2`, ink `#1c1917`, muted `#78716c`
  - Dark: night `#0e0d0c`, bone `#ece7df`, muted `#8a837b`
  - Accent (both themes): amber, used for one word or one mark per view at most
- **Type:** serif display for headlines (lowercase voice), sans-serif for
  body text, mono caps for the nav, dates, badges, and captions.
- **Header:** social icons on the left; nav on the right in mono caps (WORK,
  WRITING, ABOUT, PHOTOS, CONTACT); theme toggle at the far right. This
  follows Carter's layout.
- **Footer:** a tiny centered name and year, like Frederick's.
- **Photos:** treated as film prints, with a soft shadow, a slight warm
  grade, and a small mono caption.
- **Motion:** expressive but well behaved.
  - Scroll reveals: fade and rise, staggered within a group.
  - View transitions between pages (Astro `ClientRouter`).
  - Everything turns off under `prefers-reduced-motion`.

## `/` Home (minimal)

1. **Hero, with the signature animation.** "Hi, I'm Austin Rowland." types
   out in the serif, with a text cursor riding the last typed letter; it
   blinks at the end once the line is done. A short lowercase bio
   fades in below, with inline links to Postman, the AI-Ready APIs post,
   and TEDx.
2. **Film-strip nav.** Four stacked image bars, each showing one of your
   photos with a lowercase label. On hover, the strip expands and the photo
   comes into full color, like a print developing.
   - work → `phr-gloves`
   - writing → `tedx-gt`
   - about → `spread-the-love-24` (convert from HEIC)
   - photos → `ultramarathon`
3. **Closing line.** A two-tone sentence: "go and watch where it fails." in
   ink, then "then improve the route." in muted gray, followed by a small
   contact link.

## `/work`

1. **Intro.** One serif line, "Building Where the Product Meets Real People",
   with a short lede under it.
2. **Experience → Highlights** (one pinned scroll sequence, Aditya Dave-style
   exploded view, "Orbit" look: faint circuit-board traces and a dashed orbit ring).
   - Starts as a stack of role cards with company logos. Clicking a card, the
     arrows, a swipe or the arrow keys rotates through roles; the details sit
     beside the stack on desktop and under it on phones.
   - Scrolling explodes the stack into a tilted ring around "Experience".
   - The ring turns, and each role card flies off to the right. Once they are
     all gone, "Highlights" fades in and the photo cards fly in from the left
     one at a time.
   - The photo ring condenses into a second clickable stack. Each card is
     tagged Project, Venture or Speaking.
   - A "Scroll to Highlights ↓" pill under the first stack and a "↑ Scroll to
     Experience" pill under the second fade out once scrolling starts; clicking
     one glides the page through the sequence.
   - Projects without a photo appear in the Markdown view only. Reduced motion
     swaps between the two stacks with no ring; without JS both are plain lists.

## `/writing` and `/writing/[slug]`

- A plain dated list with tags, with AI-Ready APIs pinned as the featured
  piece. Each entry is either a local MDX post or a link to an external
  source (the Postman blog, the LinkedIn TEDx reflection).
- Post pages use a narrow reading column with a mono date line and a
  progress hairline at the top.

## `/about`

1. **Headline.** "a little peek into my life," shown next to a fanned stack
   of photos that spreads apart on scroll (Aditya-style).
2. **Chapters.** A sticky mono label runs down the left (e.g. "01 / georgia
   tech") while photo prints reveal on the right. Chapters:
   1. georgia tech + the ra years
   2. spread the love
   3. tedx: ambition and discipline
   4. tikkun olam makers
   5. avova health
   6. security roots
   7. postman and agents
   8. outside the work: running, film, coffee club, guatemala
3. **Values strip.** Three short lines on voice and values from the
   profile.

## `/photos`

- A film-print gallery: one large image at a time with a mono caption
  (place and year). Arrow keys and swipe move through the set. A contact
  sheet grid toggle shows every photo at once.

## `/contact`

- Headline: "building with agents? let's talk."
- An email chip with a copy-to-clipboard button.
- A cal.com booking embed, loaded only when it scrolls into view.

## Inputs

- Booking: https://cal.com/austin-rowland/30min
- Contact email: austinrowland2002@gmail.com
- Headshot: `src/assets/headshot.jpg` (home hero and about stack)

## Still open

- Real photos for every placeholder. `Photo.astro` renders a labeled
  placeholder until it receives a `src`, so each one can be swapped in
  individually. Add files under `src/assets/photos/` and pass them in.
- The Guatemala summit story
