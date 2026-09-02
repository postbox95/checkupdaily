import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { catalogQueryOptions, decorate, useCatalog } from "@/lib/catalog";
import { TEST_CATEGORIES, type TestCategory } from "@/data/seed";
import { seoBundleQueryOptions, globalOf, pickSeo } from "@/lib/seo.query";
import {
  breadcrumbSchema,
  buildHead,
  categoryDescriptionFallback,
  categoryTitleFallback,
  faqSchema,
} from "@/lib/seo";
import { bdt } from "@/lib/store";
import { AdSlot } from "@/components/AdSlot";

const label = (c: string) => c.charAt(0) + c.slice(1).toLowerCase();

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params, context }) => {
    const [raw, bundle] = await Promise.all([
      context.queryClient.ensureQueryData(catalogQueryOptions),
      context.queryClient.ensureQueryData(seoBundleQueryOptions),
    ]);
    const category = TEST_CATEGORIES.find((c) => c.toLowerCase() === params.slug.toLowerCase());
    if (!category) throw notFound();
    const g = globalOf(bundle);
    const count = decorate(raw).tests.filter((t) => t.category === category).length;
    return { category: category as TestCategory, count, seo: pickSeo(bundle, "category", category.toLowerCase(), g.defaultLang), global: g };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return { meta: [{ title: "Category not found" }, { name: "robots", content: "noindex" }] };
    const { category, count, seo, global: g } = loaderData;
    const path = `/category/${category.toLowerCase()}`;
    return buildHead({
      global: g,
      seo,
      path,
      fallbackTitle: categoryTitleFallback(label(category), g),
      fallbackDescription: categoryDescriptionFallback(label(category), count),
      jsonLd: [
        breadcrumbSchema(g, [
          { name: "Home", path: "/" },
          { name: label(category), path },
        ]),
        faqSchema(seo?.faqs),
      ].filter(Boolean),
    });
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-lg font-bold">Category not found</h1>
    </main>
  ),
});

function CategoryPage() {
  const { category, seo } = Route.useLoaderData();
  const { tests, pricesForTest } = useCatalog();
  const rows = tests
    .filter((t) => t.category === category)
    .map((test) => {
      const totals = pricesForTest(test.id).map((p) => p.finalPrice + test.consumableFee);
      return { test, count: totals.length, min: totals.length ? Math.min(...totals) : 0 };
    });

  return (
    <main className="mx-auto max-w-4xl px-4 pt-6 pb-28">
      <h1 className="text-2xl font-extrabold tracking-tight">
        {label(category)} test prices in Dhaka
      </h1>
      {seo?.intro && <p className="mt-2 text-sm text-muted-foreground">{seo.intro}</p>}
      <AdSlot placement="search_top" className="mt-4" />

      <ul className="mt-5 space-y-2">
        {rows.map(({ test, count, min }) => (
          <li key={test.id} className="surface-card p-4">
            <Link
              to="/tests/$slug"
              params={{ slug: test.code }}
              className="flex items-center justify-between gap-3"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{test.canonicalName}</span>
                <span className="block text-xs text-muted-foreground">
                  {count} lab{count === 1 ? "" : "s"} listed
                </span>
              </span>
              {min > 0 && (
                <span className="shrink-0 text-sm font-extrabold text-primary">from {bdt(min)}</span>
              )}
            </Link>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="surface-card p-6 text-center text-sm text-muted-foreground">
            No tests in this category yet.
          </li>
        )}
      </ul>

      {!!seo?.faqs?.filter((f) => f.q && f.a).length && (
        <section className="surface-card mt-6 p-5">
          <h2 className="text-sm font-bold">Frequently asked questions</h2>
          <dl className="mt-3 space-y-3">
            {seo.faqs
              .filter((f) => f.q && f.a)
              .map((f, i) => (
                <div key={i}>
                  <dt className="text-sm font-semibold">{f.q}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{f.a}</dd>
                </div>
              ))}
          </dl>
        </section>
      )}
    </main>
  );
}
