import type { CollectionEntry } from "astro:content";
import headshot from "../assets/headshot.jpg";
import { site, socials } from "../data/site";
import { absoluteUrl, pages } from "../data/pages";

const personId = `${site.url}/#person`;
const websiteId = `${site.url}/#website`;

export function person() {
  return {
    "@type": "Person",
    "@id": personId,
    name: site.name,
    url: site.url,
    image: absoluteUrl(headshot.src),
    description: site.description,
    jobTitle: "Founding Forward Deployed Engineer",
    worksFor: { "@type": "Organization", name: "Postman", url: "https://www.postman.com/" },
    alumniOf: { "@type": "CollegeOrUniversity", name: "Georgia Institute of Technology" },
    homeLocation: { "@type": "Place", name: `${site.location}, CA` },
    email: `mailto:${site.email}`,
    sameAs: socials.map((s) => s.href),
    knowsAbout: ["AI agents", "APIs", "Agent infrastructure", "Security engineering"],
  };
}

export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: site.name,
        url: site.url,
        description: site.description,
        publisher: { "@id": personId },
      },
      person(),
    ],
  };
}

export function profilePageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: absoluteUrl(pages.story.path),
    name: `${pages.story.title} · ${site.name}`,
    isPartOf: { "@id": websiteId },
    mainEntity: person(),
  };
}

export function articleJsonLd(post: CollectionEntry<"writing">) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.data.title,
    description: post.data.description,
    datePublished: post.data.date.toISOString(),
    url: absoluteUrl(`/writing/${post.id}`),
    keywords: post.data.tags,
    author: person(),
    isPartOf: { "@id": websiteId },
  };
}
