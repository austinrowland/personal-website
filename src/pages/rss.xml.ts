import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { pages } from "../data/pages";
import { site } from "../data/site";

export const GET: APIRoute = async (context) => {
  const posts = (await getCollection("writing")).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
  return rss({
    title: `${pages.writing.title} · ${site.name}`,
    description: pages.writing.description,
    site: context.site ?? site.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: post.data.externalUrl ?? `/writing/${post.id}/`,
      categories: post.data.tags,
    })),
    customData: "<language>en-us</language>",
  });
};
