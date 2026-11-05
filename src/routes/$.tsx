import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { resolveRedirect } from "@/lib/seo.functions";

/** Catch-all that honours admin-managed 301/302 redirects before 404ing. */
export const Route = createFileRoute("/$")({
  loader: async ({ params }) => {
    const path = `/${(params._splat ?? "").replace(/^\/+/, "")}`;
    const hit = await resolveRedirect({ data: { path } });
    if (hit) {
      if (/^https?:\/\//i.test(hit.to)) throw redirect({ href: hit.to, replace: true });
      throw redirect({ href: hit.to, replace: true });
    }
    throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Page not found — CheckUp Daily" },
      { name: "description", content: "The requested CheckUp Daily page could not be found." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Page not found — CheckUp Daily" },
      { property: "og:description", content: "The requested CheckUp Daily page could not be found." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => null,
});
