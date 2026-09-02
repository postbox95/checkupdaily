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
  head: () => ({ meta: [{ title: "Page not found" }, { name: "robots", content: "noindex" }] }),
  component: () => null,
});
