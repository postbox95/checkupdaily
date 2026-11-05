import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy URL — permanently superseded by /tests/$slug. */
export const Route = createFileRoute("/test/$code")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/tests/$slug", params: { slug: params.code }, replace: true });
  },
  head: () => ({
    meta: [
      { title: "Test page moved — CheckUp Daily" },
      { name: "description", content: "This diagnostic test page has moved to its current CheckUp Daily address." },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: "Test page moved — CheckUp Daily" },
      { property: "og:description", content: "This diagnostic test page has moved to its current CheckUp Daily address." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => null,
});
