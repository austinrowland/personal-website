/** The Story page: chapters that scroll in with ink drawings. Each line renders on the page and in /story.md. */
export type InkScene =
  "town" | "tower" | "note" | "pulse" | "scale" | "agent" | "trail";

export type Chapter = {
  place: string;
  title: string;
  scene: InkScene;
  paragraphs: string[];
};

export const chapters: Chapter[] = [
  {
    place: "Walkersville, Maryland",
    title: "Learning to Serve Others",
    scene: "town",
    paragraphs: [
      "I grew up in Walkersville, Maryland with a great friend group. Everything was a competition: grades, sports, hobbies. School came naturally to me and I had loved learning growing up. While technology wasn't a big focus in our area, it was the place I built a lot of my values.",
      "Walkersville taught me a lot about building community and how to focus on making the lives of those around me better every day. That you don't have to wait until you find success to help others, you can help people along the way.",
    ],
  },
  {
    place: "Georgia Tech, Atlanta",
    title: "Small Fish, Big Pond",
    scene: "tower",
    paragraphs: [
      "Georgia Tech was an incredibly different place from where I grew up. I went through lots of challenges learning how to adapt to a sea of top performers from their hometowns. It was the first time I really had challenges adapting to a new situation.",
      "I focused on the ups and downs of my own journey. Pulling 100 hour weeks between challenging courses and multiple jobs to pay my way through school. By the end of the second year, I came out stronger. If I could overcome these challenges, then surely I could overcome anything. I began to chase lots of new passions by noticing problems and building solutions to them.",
    ],
  },
  {
    place: "Spread the Love · Tikkun Olam Makers",
    title: "Noticing the Gaps",
    scene: "note",
    paragraphs: [
      "Using my technical knowledge and care for helping people, I began to take on new ventures that I never would have before. Some were small, like our Spread the Love tradition we started on campus. We baked over 4,000 cookies for students in an effort to make sure every student felt love on Valentine's Day.",
      "Some were larger. I led Tikkun Olam Makers, where I worked with engineers to build assistive tech for people with disabilities that faced unique challenges. It was the first time I watched engineering change how someone lives, and I haven't stopped chasing that feeling since. This really got me interested in the healthcare space, which I continued exploring through Thad Starner's research lab.",
    ],
  },
  {
    place: "Avova Health",
    title: "A Real Need and a Real Business",
    scene: "pulse",
    paragraphs: [
      "Avova Health came from the same place. Patients kept telling us their records were scattered across every medical provider they've visited, so we founded a company to build an AI health companion that could pull their information into one profile and provide personalized analysis to each user on the platform.",
      "Patients loved it, but we faced a dilemma working in consumer healthcare: how does one avoid heavily charging the consumer? We eventually settled on selling the platform to healthcare providers and insurance providers for various cost savings from preventative health measures, but this model didn't work out before we ran out of runway. I learned a lot through this venture, including the difference between making a great product and making a great business.",
    ],
  },
  {
    place: "Cisco · Palo Alto Networks",
    title: "Building Software at Scale",
    scene: "scale",
    paragraphs: [
      "By the time we shut down our startup, I found myself onboarding to another enterprise job. My time at Cisco had led to an opportunity at Palo Alto Networks, in which I continued to pursue enterprise software engineering.",
      "The interesting thing about both of these roles is they both taught me similar things. I had learned the ins and outs of shipping my daily work, learned how to develop scaled, production-grade systems, and eventually worked to automate the job I was doing once I had fully unearthed the workflows. But despite the interesting engineering challenges, I had really missed seeing the impact of my work in normal software engineering.",
    ],
  },
  {
    place: "Postman, San Francisco",
    title: "Building for an Agentic World",
    scene: "agent",
    paragraphs: [
      "My role at Postman covers lots of different challenges. I was hired into Postman as a founding FDE, but the nature of my job evolved constantly as the company worked to figure out its AI-native pivot. I ended up working under the CTO across FDE, Applied AI, AI research, and GTM strategy.",
      "During this chapter, the founder in me took over to navigate these challenges. Pick specific domains or products, become an expert in them, and continue solving bottlenecks for both customers and Postman to create scaled impact in various elements of the portfolio. I am very proud of the work I have shipped here at Postman as a result of owning my work end-to-end.",
    ],
  },
  {
    place: "San Francisco, today",
    title: "Live for Today, Build for Tomorrow",
    scene: "trail",
    paragraphs: [
      "My passions have changed shape more than direction. Now they are narrower and deeper: go where technology meets real people, watch where it fails, then build the fix. Currently, the world's most urgent problem to address is how humanity will responsibly apply AI to transform the lives of people all over the world and every industry, and I aim to be a piece of that solution.",
      "I also try to be fully present for the days in between: marathons, spending time in nature, coffee clubs, and being the friend to connect cool people to other cool people. Turns out, there is a world in which you can build for tomorrow's future and still fully live for today.",
    ],
  },
];

export const valuesTitle = "Three Things I Try to Live By";

export const values = [
  "The best way to build technology for the real world is to first immerse yourself in it.",
  "Show up for others, especially when it's inconvenient.",
  "Character is the best thing in which one can build and maintain in life.",
];
