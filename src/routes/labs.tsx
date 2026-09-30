import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { useCatalog } from "@/lib/catalog";
import { seoBundleQueryOptions, globalOf, pickSeo } from "@/lib/seo.query";
import { buildHead } from "@/lib/seo";

export const Route = createFileRoute("/labs")({
  loader: ({ context }) => context.queryClient.ensureQueryData(seoBundleQueryOptions),
  head: ({ loaderData }) => {
    const global = globalOf(loaderData);
    const bundle = loaderData ?? { records: {} };
    return buildHead({
      global,
      seo: pickSeo(bundle, "page", "labs", global.defaultLang),
      path: "/labs",
      fallbackTitle: `Test Labs — ${global.defaultTitle}`,
      fallbackDescription:
        "Browse diagnostic lab chains in Dhaka — branches, prices, ratings and patient reviews.",
    });
  },
  component: LabsPage,
  errorComponent: () => (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-muted-foreground">
      We could not load the lab list. Please try again.
    </main>
  ),
});

function LabsPage() {
  const { chains, centers } = useCatalog();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight">Test Labs</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Diagnostic lab chains we track in Dhaka — see branches, prices and patient reviews.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {chains.map((chain) => {
          const branches = centers.filter((c) => c.labChainId === chain.id);
          const areas = [...new Set(branches.map((b) => b.thana))].slice(0, 4);
          return (
            <Link
              key={chain.id}
              to="/chain/$slug"
              params={{ slug: chain.slug }}
              className="surface-card group p-4 transition-shadow hover:shadow-[var(--shadow-float)]"
            >
              <div className="flex items-center gap-3">
                {chain.logoUrl ? (
                  <img
                    src={chain.logoUrl}
                    alt={`${chain.name} logo`}
                    className="size-11 shrink-0 rounded-xl border border-border object-contain"
                  />
                ) : (
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-lg font-extrabold text-accent-foreground">
                    {chain.name.charAt(0)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{chain.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {branches.length} {branches.length === 1 ? "branch" : "branches"}
                  </p>
                </div>
              </div>
              {areas.length > 0 && (
                <p className="mt-3 flex items-start gap-1 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span className="min-w-0 truncate">{areas.join(" · ")}</span>
                </p>
              )}
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                <Star className="size-3.5" aria-hidden /> Reviews & profile
                <ArrowRight
                  className="size-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </Link>
          );
        })}
        {chains.length === 0 && (
          <p className="surface-card p-6 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
            No lab chains listed yet.
          </p>
        )}
      </div>
    </main>
  );
}
