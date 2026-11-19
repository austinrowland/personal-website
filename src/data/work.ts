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
    take: "core networking and OS work on PAN-OS, and an early piece of the company's agentic coding platform.",
    points: [
      "Shipped network, infrastructure, and security features in Python, C, and Linux for a firewall OS used by 100K+ businesses.",
      "Designed an IKE/IPSec daemon for more scalable, secure GlobalProtect VPN access.",
      "Helped lay the groundwork for the internal agentic coding platform: a context engine that applies the company's design, security, and compliance standards to coding agents before code ships.",
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
      "Runs on Postman's internal agent OS: compares Salesforce, Gong, and email signals against product knowledge to give sellers tailored use cases and positioning for each account.",
  },
  {
    title: "Avova Health",
    kind: "venture",
    years: "2024",
    summary:
      "An AI health companion that pulled each patient's records from every provider into one profile. Shaped by 100+ patient interviews; finalist in Mayo Clinic's 2024 startup competition.",
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
    href: "/writing/ambition-might-be-your-achilles-heel",
  },
];
