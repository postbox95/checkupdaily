import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Heart,
  MapPin,
  Scale,
  Search,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { useCatalog } from "@/lib/catalog";
import { seoBundleQueryOptions, globalOf, pickSeo } from "@/lib/seo.query";
import { buildHead, breadcrumbSchema, organizationSchema } from "@/lib/seo";
import founderAsset from "@/assets/founder.png.asset.json";

export const Route = createFileRoute("/about")({
  loader: ({ context }) => context.queryClient.ensureQueryData(seoBundleQueryOptions),
  head: ({ loaderData }) => {
    const global = globalOf(loaderData);
    const bundle = loaderData ?? { records: {} };
    const title = `About Us — Why We Built ${global.siteName}`;
    const description =
      `Meet Ummul Wara Saidi, the pharmacist who founded ${global.siteName} after years of not being able to compare diagnostic test prices in Dhaka. Learn how we collect prices and why patients trust us.`;
    return buildHead({
      global,
      seo: pickSeo(bundle, "page", "about", global.defaultLang),
      path: "/about",
      fallbackTitle: title,
      fallbackDescription: description,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: `About ${global.siteName}`,
          url: `${global.siteUrl}/about`,
          mainEntity: {
            "@type": "Organization",
            name: global.siteName,
            url: global.siteUrl,
            founder: {
              "@type": "Person",
              name: "Ummul Wara Saidi",
              jobTitle: "Founder",
              nationality: "Bangladeshi",
              alumniOf: { "@type": "CollegeOrUniversity", name: "North South University" },
            },
          },
        },
        organizationSchema(global),
        breadcrumbSchema(global, [
          { name: "Home", path: "/" },
          { name: "About Us", path: "/about" },
        ]),
      ],
    });
  },
  component: AboutPage,
});

const PLEDGES = [
  {
    icon: Scale,
    title: "No paid rankings",
    body: "Labs cannot pay to appear first or hide their price. The cheapest option is always the easiest to find.",
  },
  {
    icon: ShieldCheck,
    title: "Real, published prices",
    body: "Every price comes from a lab's own published rate card — including the needle, tube and registration charges, not just the base test fee.",
  },
  {
    icon: BadgeCheck,
    title: "Always verify before you go",
    body: "Prices can change without notice. We show the last published rate and always ask you to confirm with the lab before your visit.",
  },
];

const WHAT_WE_DO = [
  {
    icon: Search,
    title: "Search in your words",
    body: "Type in English, Bangla or the shorthand your doctor wrote — CBC, RBS, লিপিড, ECHO — and find the right test.",
  },
  {
    icon: MapPin,
    title: "Compare labs near you",
    body: "Pick your area in Dhaka and see every diagnostic centre nearby, with prices, opening hours and patient reviews side by side.",
  },
  {
    icon: Heart,
    title: "Know your true bill",
    body: "Add tests to your prescription cart and see the full out-of-pocket cost at each lab — before you leave home.",
  },
];

function AboutPage() {
  const { chains, centers, tests } = useCatalog();
  const { data: seoBundle } = useSuspenseQuery(seoBundleQueryOptions);
  const global = globalOf(seoBundle);
  const stats = {
    labs: chains.length,
    branches: centers.length,
    tests: tests.filter((t) => t.isActive !== false).length || tests.length,
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* Hero */}
      <section className="surface-card relative overflow-hidden p-6 sm:p-10">
        <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
              <Stethoscope className="size-3.5" aria-hidden /> About MyTestReport
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              No patient should have to pay blind.
            </h1>
            <p className="mt-3 max-w-xl text-sm/relaxed text-muted-foreground sm:text-base/relaxed">
              {global.siteName} shows the real price of diagnostic tests across Dhaka — base fee, needle,
              tube and registration charges included — so you can compare labs, choose with
              confidence and never get surprised at the counter.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Search test prices <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                to="/compare"
                className="inline-flex items-center gap-1.5 rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
              >
                Compare labs
              </Link>
            </div>
          </div>
          <figure className="mx-auto w-full max-w-56 md:max-w-none">
            <div className="relative rounded-3xl bg-gradient-to-b from-accent/70 to-accent/20 p-3">
              <img
                src={founderAsset.url}
                alt="Ummul Wara Saidi, founder of MyTestReport"
                className="mx-auto w-full object-contain"
                loading="eager"
                width={480}
                height={600}
              />
            </div>
            <figcaption className="mt-3 text-center">
              <p className="text-sm font-bold">Ummul Wara Saidi</p>
              <p className="text-xs text-muted-foreground">Founder · Pharmacist, North South University</p>
            </figcaption>
          </figure>
        </div>

        <dl className="mt-8 grid grid-cols-3 gap-3 border-t border-border/60 pt-6 text-center">
          {[
            { k: "Lab chains", v: stats.labs },
            { k: "Branches tracked", v: stats.branches },
            { k: "Tests listed", v: `${stats.tests}+` },
          ].map((s) => (
            <div key={s.k}>
              <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {s.k}
              </dt>
              <dd className="mt-0.5 text-2xl font-extrabold text-primary">{s.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Founder story */}
      <section className="mt-10" aria-labelledby="story-heading">
        <h2 id="story-heading" className="text-2xl font-extrabold tracking-tight">
          Our story — it started at the lab counter
        </h2>
        <div className="mt-4 space-y-4 text-sm/relaxed text-foreground/90 sm:text-base/relaxed">
          <p>
            <strong>Ummul Wara Saidi</strong> is an A-grade academic pharmacist who graduated from
            North South University. Like most people in Dhaka, her life regularly brings her to a
            diagnostic lab — for herself, and for the people she cares about.
          </p>
          <p>
            Every visit played out the same way. She would call one lab, then another, trying to
            find out what a test actually costs. There was no single place to compare prices. No
            way to know if the lab across town offered the same test for less. The billed amount
            was always more than the price she was quoted — a little for the needle, a little for
            the tube, a little for registration. She was paying for the same test at wildly
            different prices, and she had no way of knowing.
          </p>
          <p>
            If this was hard for a pharmacist — someone trained in exactly these tests — she
            realised how impossible it was for everyone else. That frustration became an idea:{" "}
            <strong>list every lab, publish every price, and let patients compare for
            themselves.</strong>{" "}
            That idea is {global.siteName}.
          </p>
          <blockquote className="rounded-2xl border-l-4 border-primary bg-accent/40 px-5 py-4 text-sm/relaxed font-medium italic sm:text-base/relaxed">
            "I kept thinking: why should finding the price of a blood test be harder than the test
            itself? Patients deserve to see the numbers before they walk in."
            <footer className="mt-2 text-xs font-bold text-muted-foreground not-italic">
              — Ummul Wara Saidi, Founder
            </footer>
          </blockquote>
        </div>
      </section>

      {/* What we do */}
      <section className="mt-10" aria-labelledby="what-heading">
        <h2 id="what-heading" className="text-2xl font-extrabold tracking-tight">
          What we do
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Three things, done simply — so choosing a lab takes minutes, not a day of phone calls.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {WHAT_WE_DO.map(({ icon: Icon, title, body }) => (
            <div key={title} className="surface-card p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-3 text-sm font-bold">{title}</h3>
              <p className="mt-1.5 text-xs/relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Transparency pledge */}
      <section className="mt-10" aria-labelledby="pledge-heading">
        <h2 id="pledge-heading" className="text-2xl font-extrabold tracking-tight">
          Our promise to patients
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {PLEDGES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="surface-card p-5">
              <Icon className="size-5 text-primary" aria-hidden />
              <h3 className="mt-3 text-sm font-bold">{title}</h3>
              <p className="mt-1.5 text-xs/relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="surface-card mt-10 p-6 text-center sm:p-10">
        <h2 className="text-2xl font-extrabold tracking-tight">
          Are you a diagnostic centre?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm/relaxed text-muted-foreground">
          If your lab's rates have changed, or you'd like your price list published or updated on
          MyTestReport, we'd love to hear from you — accurate data helps your patients and ours.
        </p>
        <p className="mt-4 text-sm font-semibold text-primary">
          Write to us at{" "}
          <a href="mailto:request@checkup.com" className="underline underline-offset-2">
            request@checkup.com
          </a>
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          <Link
            to="/labs"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Browse test labs <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Search a test price
          </Link>
        </div>
      </section>
    </main>
  );
}
