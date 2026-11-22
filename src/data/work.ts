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
    take: "Working inside the largest API programs to see where agents get stuck, then fixing the route.",
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
    take: "Core networking and OS work on PAN-OS, and an early piece of the company's agentic coding platform.",
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
    take: "Found a real need, and learned that a real need and a working business are two different problems.",
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
    take: "Learned that most security work is root-cause work.",
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
    take: "First time building for systems that can't fail quietly.",
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
      "An assessment that grades how well agents can discover, understand, and operate an API: 25 checks across five categories.",
    photo: "postman-ai-ready-apis",
    href: "https://www.postman.com/ai/ai-ready-apis",
  },
  {
    title: "Customer insights agent",
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
      "Our finalist pitch at Mayo Clinic's 2024 startup competition. On stage in front of a room of doctors, I told the story we kept hearing in patient interviews: records scattered across every provider they'd ever seen. Then I showed how Avova's AI health companion pulled them into one profile, and why prevention starts with seeing the whole picture.",
    photo: "avova-health",
  },
  {
    title: "Spread the Love",
    kind: "project",
    years: "2023–2025",
    summary:
      "Free cookies and handwritten notes on the Georgia Tech lawn: 500, then 1,000, then 4,000+ in total.",
    photo: "spread-the-love",
    href: "https://nique.net/life/students-give-out-2000-cookies-for-valentines-day",
  },
  {
    title: "Tikkun Olam Makers",
    kind: "project",
    years: "2022–2024",
    summary:
      "Led 100+ student makers building assistive technology for 20+ families, with $45k+ raised and three makeathons.",
    photo: "tom-build-day",
  },
  {
    title: "Passive haptic rehab gloves",
    kind: "project",
    years: "2023",
    summary:
      "A full-stack app with computer vision tracking to measure stroke patients' motor recovery.",
    photo: "phr-gloves",
  },
  {
    title: "Ambition might be your Achilles heel",
    kind: "talk",
    years: "2023",
    summary:
      "TEDxGeorgiaTech. Ambition expands the field of possibility; discipline is what moves you across it.",
    photo: "tedx-gt",
    href: "/writing/ambition-might-be-your-achilles-heel",
  },
];
