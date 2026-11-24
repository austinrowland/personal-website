export type Experience = {
  start: string;
  end: string;
  role: string;
  org: string;
  take: string;
  points: string[];
};

export const experience: Experience[] = [
  {
    start: "Oct 2025",
    end: "Now",
    role: "Founding Forward Deployed Engineer",
    org: "Postman",
    take: "Agentic infrastructure for enterprises. Worked on FDE, Applied AI, and AI Research to identify gaps and create solutions for various AI & agent related problems.",
    points: [
      "Part of the CTO's frontier team, running a Build, Operate, Scale model with strategic enterprises.",
      "Helped take Postman from one product to five in a year, working out the roadmap for each new product with our frontier enterprise customers.",
      "Turned one-off deployments into product: when a problem showed up across customers, codified it into the product or the GTM strategy, building it with the product team or on my own.",
      "Built the CI/CD integrations that automate producing and distributing agent-ready assets (docs, MCP servers, SDKs, and CLIs) from each API change.",
      "Built AI-Ready APIs, an assessment of how ready an API is for the agents that consume it.",
      "Helped build the core engine of Postman's internal agent OS, then GTM agents on top of it that give sellers tailored use cases and product positioning for each account.",
      "Led company-wide GTM strategy for enterprise API packaging; the playbook was trained to ~400 sellers at Sales Kick-Off.",
    ],
  },
  {
    start: "Aug 2024",
    end: "Oct 2025",
    role: "Software Engineer",
    org: "Palo Alto Networks",
    take: "Core networking and OS work on PAN-OS, and early contributions to the company's agentic coding harness.",
    points: [
      "Shipped network, infrastructure, and security features in Python, C, and Linux for a firewall OS used by 100K+ businesses.",
      "Designed an IKE/IPSec daemon for more scalable, secure GlobalProtect VPN access.",
      "Helped lay the groundwork for the internal agentic coding platform: a context engine that applies the company's design, security, and compliance standards to coding agents before code ships.",
      "Built pair-programmer and end-to-end testing agents with Claude Code, Gemini, and MCP.",
    ],
  },
  {
    start: "Jan 2024",
    end: "Aug 2024",
    role: "Founder",
    org: "Avova Health",
    take: "Built for a highly painful, real-world need. Learned valuable lessons on the difference between a great product and a great business in this venture.",
    points: [
      "Built an AI health companion that pulled each patient's records from every provider into one profile, on React, Node, and AWS.",
      "Shaped the product through patient interviews, then worked through HIPAA, messy medical data, and keeping the AI's answers grounded.",
      "Pitched Avova to investors and, as a finalist in Mayo Clinic's 2024 startup competition, on stage to a room of doctors at Mayo Clinic.",
    ],
  },
  {
    start: "May 2023",
    end: "Dec 2023",
    role: "Software Engineer Intern",
    org: "Cisco Systems",
    take: "Learned that the key to scaling work is to automate your job. Become an expert on what you do, then work to replace yourself.",
    points: [
      "Resolved 700+ recurring cloud security issues through root-cause analysis with Wiz and AWS.",
      "Automated vulnerability triage and remediation for 500+ containerized applications.",
    ],
  },
  {
    start: "May 2022",
    end: "Jul 2022",
    role: "Cybersecurity Intern",
    org: "Georgia Tech Research Institute",
    take: "First time building for enterprise-grade systems that cannot afford to fail.",
    points: [
      "Developed threat-resistant PLC software for critical infrastructure endpoints.",
      "Built a PLC device with Python and Arduino for packet analysis, IAM, and logic monitoring.",
    ],
  },
];

export type ProjectKind = "project" | "venture" | "talk";

export type Project = {
  title: string;
  kind: ProjectKind;
  years: string;
  summary: string;
  photo?: string;
  href?: string;
};

export const projectKinds: { value: ProjectKind; label: string; one: string }[] = [
  { value: "project", label: "Projects", one: "Project" },
  { value: "venture", label: "Ventures", one: "Venture" },
  { value: "talk", label: "Speaking", one: "Speaking" },
];

export const projects: Project[] = [
  {
    title: "AI-Ready APIs",
    kind: "project",
    years: "2026",
    summary:
      "A research-backed assessment that grades how well an agent can discover, understand, and operate your product.",
    photo: "postman-ai-ready-apis",
    href: "https://www.postman.com/ai/ai-ready-apis",
  },
  {
    title: "Customer Insights Agent",
    kind: "project",
    years: "2026",
    summary:
      "Runs on Postman's internal agent OS: compares Salesforce, Gong, and email signals against product knowledge to give sellers tailored use cases and positioning for each account.",
  },
  {
    title: "Avova Health",
    kind: "venture",
    years: "2024",
    summary:
      "Avova Health pitch at Mayo Clinic startup competition. We told the story we heard from customers on scattered records and provider challenges. Then we showed how Avova's AI companion could retrieve all their records into one profile with personalized analysis, and discussed how preventative health starts with seeing the whole picture.",
    photo: "avova-health",
  },
  {
    title: "Spread the Love",
    kind: "project",
    years: "2023–2025",
    summary:
      "An idea I started with one of my best friends. Created a Georgia Tech school tradition on Valentine's Day of handing out free cookies and handwritten notes from people all over the world. We wanted to make sure that every student felt the love on Valentine's Day. Eventually led to over 4,000 cookies and handwritten notes being given out during my tenure, and that number is still growing today.",
    photo: "spread-the-love",
    href: "https://nique.net/life/students-give-out-2000-cookies-for-valentines-day",
  },
  {
    title: "Tikkun Olam Makers",
    kind: "project",
    years: "2022–2024",
    summary:
      "An assistive technology organization that I led in Atlanta. The concept was simple: match groups of engineers with specific individuals or families living with a disability to create assistive technology that addressed a unique need. Raised $45k, built for more than 20 families in 2 years, and continue to impact more lives today.",
    photo: "tom-build-day",
  },
  {
    title: "Passive Haptic Rehab Gloves",
    kind: "project",
    years: "2023",
    summary:
      "Worked under Thad Starner's Passive Haptic Rehab Gloves lab. Built a full-stack app with computer vision tracking to measure stroke patients' motor recovery that would pair with the gloves that the team had created.",
    photo: "phr-gloves",
  },
  {
    title: "Ambition Might Be Your Achilles Heel",
    kind: "talk",
    years: "2023",
    summary:
      "First public speaking venture. Discussed the benefits and challenges of being an ambitious person, with takeaways to help listeners discover their own Achilles Heel and work towards solving it.",
    photo: "tedx-gt",
    href: "/writing/ambition-might-be-your-achilles-heel",
  },
];
