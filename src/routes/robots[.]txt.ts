import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { loadSeoBundle } from "@/lib/seo.server";
import { siteBase } from "@/lib/seo";
import { DEFAULT_GLOBAL_SEO } from "@/lib/seo.types";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        let g = DEFAULT_GLOBAL_SEO;
        try {
          g = (await loadSeoBundle()).global;
        } catch {
          /* fall back to defaults */
        }
        const base = siteBase(g);
        const lines = g.robotsIndex
          ? [
              "User-agent: *",
              "Allow: /",
              "Disallow: /admin",
              "Disallow: /auth",
              "Disallow: /compare",
              "",
              `Sitemap: ${base}/sitemap.xml`,
            ]
          : ["User-agent: *", "Disallow: /"];

        return new Response(`${lines.join("\n")}\n`, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
