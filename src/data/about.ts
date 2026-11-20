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
    label: "walkersville, md",
    title: "A small town that kept score.",
    body: "i grew up in walkersville, maryland, where everything was a competition: grades, sports, whatever my friends could turn into a race. i was a top performer my whole life, and i liked it best when i was winning.",
    photo: "walkersville",
  },
  {
    label: "georgia tech",
    title: "Different starting points, different timelines.",
    body: "georgia tech was the first place i wasn't at the top. i called home almost every day sure i'd fail out, surrounded by people who had coded since they were eight. then i got to know them, and plenty of them envied parts of my life too. i stopped looking for rooms where i belonged and started choosing rooms that made me better.",
    photo: "georgia-tech-graduation",
  },
  {
    label: "the 100-hour semester",
    title: "Almost dropping out.",
    body: "sophomore year, my money for school fell through. most weeks ran about 100 hours between a job at blue donkey coffee, my ra job, and five of the hardest classes i've taken, and i came close to leaving for the military. by the end of that summer i could support myself. if i could make it through that, i figured i could do anything.",
    photo: "graduation-interview",
  },
  {
    label: "junior year",
    title: "You can do anything, but not everything.",
    body: "so i tried to do everything: engineer, founder, photographer, content creator, nonprofit builder. the best parts lasted. spread the love handed out 4,000+ cookies with handwritten notes on the lawn, and tikkun olam makers grew into 100+ students building assistive tech for families. but i was spread thin, and that year became my tedx talk on ambition and discipline.",
    photo: "spread-the-love",
  },
  {
    label: "avova health",
    title: "Listening before building.",
    body: "after that i founded avova, an ai health companion that pulled a patient's records from every provider into one profile. we interviewed 100+ patients before writing much code, went through create-x, and made the finals of mayo clinic's 2024 startup competition. people liked it, but selling through providers and insurers didn't work before the runway ran out. the week it wound down, i started at palo alto networks.",
    photo: "avova-health",
  },
  {
    label: "san francisco",
    title: "Building a life, not just a career.",
    body: "i moved west for palo alto networks and stayed for postman. the bigger change was outside work: hybrid training became the first habit i ever kept, and i started running ultramarathons. now i'm trying to build the kind of community georgia tech gave me: hosting a coffee club, shooting film, and being the friend who connects people.",
    photo: "ultramarathon",
  },
];

export const values = [
  "Make the work visible.",
  "Show up for people, especially when it's inconvenient.",
  "Good work that costs you your life isn't as good as you think.",
];
