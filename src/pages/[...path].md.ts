import type { APIRoute, GetStaticPaths } from "astro";
import { markdownPages, notFound, renderMarkdown, type MarkdownPage } from "../lib/markdown";
import { markdownPath } from "../data/pages";

export const getStaticPaths = (async () =>
  [...(await markdownPages()), notFound].map((page) => ({
    params: { path: markdownPath(page.path).slice(1, -".md".length) },
    props: { page },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ page: MarkdownPage }> = ({ props }) =>
  new Response(renderMarkdown(props.page), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
