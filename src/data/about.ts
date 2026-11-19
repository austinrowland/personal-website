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
    body: "i co-founded avova, an ai health companion that pulled a patient's records from every provider into one profile. we interviewed 100+ patients before writing much code, went through create-x, and made the finals of mayo clinic's 2024 startup competition. the hard part was trust: cleaning sensitive data, keeping it hipaa-compliant, and keeping the ai from making things up. people liked it, but selling through providers and insurers didn't work before the runway ran out. the week it wound down, i started at palo alto networks.",
    photo: "avova-health",
  },
  {
    label: "security roots",
    title: "Systems that can't fail quietly.",
    body: "critical infrastructure at gtri, cloud security at cisco, then a firewall os and vpn daemon at palo alto networks. that's also where i helped lay the groundwork for the company's agentic coding platform, and got hooked on the question i still work on: how do you make agents follow the rules before anything ships?",
    photo: "phr-gloves",
  },
  {
    label: "postman",
    title: "Agents are the new audience.",
    body: "now i'm a founding forward deployed engineer on the cto's frontier team. postman went from one product to five in a year, and our job is to find where each one goes with the largest api programs in the world: build it for one customer, codify it across a few, then put it on the roadmap. lately that means making apis ready for the agents that consume them.",
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
