import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy URL — permanently superseded by /tests/$slug. */
export const Route = createFileRoute("/test/$code")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/tests/$slug", params: { slug: params.code }, replace: true });
  },
  head: () => ({ meta: [{ name: "robots", content: "noindex, follow" }] }),
  component: () => null,
});
