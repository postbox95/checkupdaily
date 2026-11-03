import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { loadSeoBundle, publicClient, seoKey } from "@/lib/seo.server";
import { siteBase } from "@/lib/seo";
import { DEFAULT_GLOBAL_SEO, type SeoFields } from "@/lib/seo.types";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        let bundle: { global: typeof DEFAULT_GLOBAL_SEO; records: Record<string, SeoFields> } = {
          global: DEFAULT_GLOBAL_SEO,
          records: {},
        };
        try {
          bundle = await loadSeoBundle();
        } catch {
          /* defaults */
        }
        const g = bundle.global;
        const BASE_URL = siteBase(g);
        const lang = g.defaultLang;

        const allowed = (type: string, key: string) => {
          const rec = bundle.records[seoKey(type, key, lang)];
          if (!rec) return true;
          if (rec.includeInSitemap === false) return false;
          if (rec.robotsIndex === false) return false;
          return true;
        };
        const slugFor = (type: string, key: string) =>
          bundle.records[seoKey(type, key, lang)]?.slug || key;

        const sb = publicClient();
        const [{ data: tests }, { data: chains }] = await Promise.all([
          sb.from("medical_tests").select("code, category").eq("is_active", true),
          sb.from("lab_chains").select("slug").eq("is_active", true),
        ]);

        const categories = Array.from(
          new Set((tests ?? []).map((t: { category: string }) => t.category).filter(Boolean)),
        );

        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/about", changefreq: "monthly", priority: "0.5" },

          ...categories
            .filter((c) => allowed("category", String(c).toLowerCase()))
            .map((c) => ({
              path: `/category/${String(c).toLowerCase()}`,
              changefreq: "weekly" as const,
              priority: "0.6",
            })),
          ...(tests ?? [])
            .filter((t: { code: string }) => allowed("test", t.code))
            .map((t: { code: string }) => ({
              path: `/tests/${slugFor("test", t.code)}`,
              changefreq: "weekly" as const,
              priority: "0.8",
            })),
          ...(chains ?? [])
            .filter((c: { slug: string }) => allowed("chain", c.slug))
            .map((c: { slug: string }) => ({
              path: `/chain/${slugFor("chain", c.slug)}`,
              changefreq: "weekly" as const,
              priority: "0.7",
            })),
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
