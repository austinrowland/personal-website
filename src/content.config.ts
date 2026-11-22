import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const writing = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/writing" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      tags: z.array(z.string()).default([]),
      /** Woodblock cover, generated per docs/writing-covers.md. */
      cover: image(),
      coverAlt: z.string(),
      /** Set for pieces first published elsewhere and copied here. */
      original: z
        .object({
          publication: z.string(),
          url: z.url(),
          publisher: z.string(),
          publisherUrl: z.url(),
        })
        .optional(),
    }),
});

export const collections = { writing };
