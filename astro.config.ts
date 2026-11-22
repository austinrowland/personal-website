import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import markdownTwins from "./src/integrations/markdown-twins";

// https://astro.build/config
export default defineConfig({
  site: "https://austinrowland.com",
  integrations: [mdx(), sitemap({ filter: (page) => !page.endsWith("/404/") }), markdownTwins()],
  vite: {
    plugins: [tailwindcss()],
  },
});
