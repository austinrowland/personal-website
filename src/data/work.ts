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
    take: "working inside the largest API programs to see where agents get stuck, then fixing the route.",
    points: [
      "Part of the CTO's frontier team, running a Build, Operate, Scale model with strategic enterprises.",
      "Built AI-Ready APIs, an assessment of how ready an API is for the agents that consume it.",
      "Led company-wide GTM strategy for enterprise API packaging; the playbook was trained to ~400 sellers at Sales Kick-Off.",
      "Built a customer insights agent and a sandbox automation agent for the company's primary GTM motions.",
    ],
  },
  {
    start: "Aug 2024",
    end: "Oct 2025",
    role: "Software Engineer",
    org: "Palo Alto Networks",
    take: "security at the operating-system level, where the agents work first started.",
    points: [
      "Shipped network, infrastructure, and security features in Python, C, and Linux for a firewall OS used by 100K+ businesses.",
      "Designed an IKE/IPSec daemon for more scalable, secure GlobalProtect VPN access.",
      "Built pair-programmer and end-to-end testing agents with Claude Code, Gemini, and MCP.",
    ],
  },
  {
    start: "May 2023",
    end: "Dec 2023",
    role: "Software Engineer Intern",
    org: "Cisco Systems",
    take: "learned that most security work is root-cause work.",
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
    take: "first time building for systems that can't fail quietly.",
    points: [
      "Developed threat-resistant PLC software for critical infrastructure endpoints.",
      "Built a PLC device with Python and Arduino for packet analysis, IAM, and logic monitoring.",
    ],
  },
];

export type ProjectKind = "venture" | "community" | "research" | "agent" | "talk";

export type Project = {
  title: string;
  kind: ProjectKind;
  years: string;
  summary: string;
  photo?: string;
  href?: string;
};

export const projectKinds: { value: ProjectKind; label: string }[] = [
  { value: "venture", label: "Ventures" },
  { value: "community", label: "Community" },
  { value: "research", label: "Research" },
  { value: "agent", label: "Agents" },
  { value: "talk", label: "Talks" },
];

export const projects: Project[] = [
  {
    title: "AI-Ready APIs",
    kind: "agent",
    years: "2026",
    summary:
      "An assessment that grades how well agents can discover, understand, and operate an API: 25 checks across five categories.",
    photo: "postman-ai-ready-apis",
    href: "https://blog.postman.com/ai-ready-apis-agents-are-the-new-audience/",
  },
  {
    title: "Customer insights agent",
    kind: "agent",
    years: "2026",
    summary:
      "Compares Salesforce, Gong, and email signals against product knowledge to surface new opportunities across every Postman account.",
  },
  {
    title: "Avova Health",
    kind: "venture",
    years: "2024",
    summary:
      "A preventative health platform built from 100+ patient interviews. Finalist in Mayo Clinic's 2024 startup competition.",
    photo: "avova-health",
  },
  {
    title: "Spread the Love",
    kind: "community",
    years: "2023–2024",
    summary:
      "Free cookies and handwritten notes on the Georgia Tech lawn: 500, then 1,000, then 4,000+ in total.",
    photo: "spread-the-love",
  },
  {
    title: "Tikkun Olam Makers",
    kind: "community",
    years: "2022–2024",
    summary:
      "Led 100+ student makers building assistive technology for 20+ families, with $45k+ raised and three makeathons.",
    photo: "tom-build-day",
  },
  {
    title: "Passive haptic rehab gloves",
    kind: "research",
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
  },
];
