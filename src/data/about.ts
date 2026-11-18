export type Chapter = {
  label: string;
  title: string;
  body: string;
  photo: string;
};

export const aboutIntro =
  "engineer, builder, runner, host. most of what i've made started close to real people, and most of what i've learned came from watching where things broke.";

export const chapters: Chapter[] = [
  {
    label: "georgia tech",
    title: "Computer engineering, and the RA years.",
    body: "i studied computer engineering at georgia tech, worked as a resident assistant, and learned to build on a calendar: gym at 7, class, the library, coffee at blue donkey, then the cisco office in the afternoon.",
    photo: "graduation-interview",
  },
  {
    label: "spread the love",
    title: "Scope is not surrender.",
    body: "the plan was 5,000 cookies with handwritten notes. we started with 500. the first 500 created evidence, the evidence brought helpers, and it grew to 1,000 and then 4,000+. the charm was the interface; the real work was logistics.",
    photo: "spread-the-love",
  },
  {
    label: "tedx",
    title: "Ambition might be your Achilles heel.",
    body: "my first talk, with no public speaking behind me. ambition expands the field of what's possible, and discipline is what moves you across it. you can do anything, but you can't do everything.",
    photo: "tedx-gt",
  },
  {
    label: "tikkun olam makers",
    title: "All you need is the desire to help people.",
    body: "i led a community of 100+ student makers building assistive technology for people with disabilities: eye-gaze communication software, custom wheelchairs, a piano pedal bite switch. we raised $45k+ and delivered devices to 20+ families.",
    photo: "tom-build-day",
  },
  {
    label: "avova health",
    title: "Listening before building.",
    body: "i founded a preventative health platform and interviewed 100+ patients before writing much code. it made the finals of mayo clinic's 2024 startup competition. alongside it, i built computer vision tools for a stroke rehab glove lab.",
    photo: "avova-health",
  },
  {
    label: "security roots",
    title: "Systems that can't fail quietly.",
    body: "critical infrastructure at gtri, cloud security at cisco, then a firewall os and vpn daemon at palo alto networks. that's also where i started building agents for my own engineering workflow.",
    photo: "phr-gloves",
  },
  {
    label: "postman",
    title: "Agents are the new audience.",
    body: "now i'm a founding forward deployed engineer on the cto's frontier team. we build, operate, and scale new uses of postman with the largest api programs in the world, and lately that means making apis ready for the agents that consume them.",
    photo: "postman-ai-ready-apis",
  },
  {
    label: "outside the work",
    title: "Running, film, and coffee.",
    body: "i train for ultramarathons, shoot film, read, and host a coffee club. most of my favorite days involve all four. san francisco by way of maryland, with family in st. augustine.",
    photo: "guatemala-summit",
  },
];

export const values = [
  "Make the work visible.",
  "Show up for people, especially when it's inconvenient.",
  "Good work that costs you your life isn't as good as you think.",
];
