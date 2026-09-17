import { createFileRoute, notFound } from "@tanstack/react-router";
import { catalogQueryOptions, decorate } from "@/lib/catalog";
import { seoBundleQueryOptions, globalOf, pickSeo } from "@/lib/seo.query";
import {
  breadcrumbSchema,
  buildHead,
  faqSchema,
  testDescriptionFallback,
  testTitleFallback,
} from "@/lib/seo";
import { TestPricePage } from "@/components/TestPricePage";

export const Route = createFileRoute("/tests/$slug")({
  loader: async ({ params, context }) => {
    const [raw, bundle] = await Promise.all([
      context.queryClient.ensureQueryData(catalogQueryOptions),
      context.queryClient.ensureQueryData(seoBundleQueryOptions),
    ]);
    const catalog = decorate(raw);
    const g = globalOf(bundle);

    // Match by code, then by an admin-defined slug override.
    let test = catalog.testByCode(params.slug);
    if (!test) {
      const hit = Object.entries(bundle.records).find(
        ([key, data]) => key.startsWith("test:") && data.slug === params.slug,
      );
      const code = hit?.[0].split(":")[1];
      if (code) test = catalog.testByCode(code);
    }
    if (!test) throw notFound();

    const seo = pickSeo(bundle, "test", test.code, g.defaultLang);
    const labCount = catalog.pricesForTest(test.id).length;
    return { test, seo, global: g, labCount };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData)
      return { meta: [{ title: "Test not found" }, { name: "robots", content: "noindex" }] };
    const { test, seo, global: g, labCount } = loaderData;
    const path = `/tests/${seo?.slug || test.code}`;
    return buildHead({
      global: g,
      seo,
      path,
      fallbackTitle: testTitleFallback(test.canonicalName, g),
      fallbackDescription: testDescriptionFallback({
        testName: test.canonicalName,
        labCount,
        fastingRequired: test.fastingRequired,
        reportHrs: test.reportDeliveryHrs,
      }),
      jsonLd: [
        breadcrumbSchema(g, [
          { name: "Home", path: "/" },
          { name: test.canonicalName, path },
        ]),
        faqSchema(seo?.faqs),
        {
          "@context": "https://schema.org",
          "@type": "MedicalTest",
          name: test.canonicalName,
          alternateName: [test.banglaName, ...(test.synonyms ?? [])].filter(Boolean),
          url: `${g.siteUrl.replace(/\/+$/, "")}${path}`,
          ...(test.description ? { description: test.description } : {}),
        },
      ].filter(Boolean),
    });
  },
  component: TestRoute,
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-lg font-bold">Test not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This test may have been renamed or removed.
      </p>
    </main>
  ),
});

function TestRoute() {
  const { test, seo } = Route.useLoaderData();
  return <TestPricePage test={test} seo={seo} />;
}
