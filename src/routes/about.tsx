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
import { aboutContentQuery, type AboutContent } from "@/lib/about";

export const Route = createFileRoute("/about")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(seoBundleQueryOptions),
      context.queryClient.ensureQueryData(aboutContentQuery),
    ]),
  head: ({ loaderData }) => {
    const bundle = loaderData?.[0] ?? { records: {}, global: {} };
    const about = loaderData?.[1] as AboutContent | undefined;
    const global = globalOf(bundle);
    const founder = about?.founderName ?? "Ummul Wara Saidi";
    const title = `About Us — Why We Built ${global.siteName}`;
    const description =
      `Meet ${founder}, the pharmacist who founded ${global.siteName} after years of not being able to compare diagnostic test prices in Dhaka. Learn how we collect prices and why patients trust us.`;
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
              name: founder,
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

/** Renders **bold** spans inside editable story paragraphs. */
function StoryParagraph({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <p>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

function AboutPage() {
  const { chains, centers, tests } = useCatalog();
  const { data: seoBundle } = useSuspenseQuery(seoBundleQueryOptions);
  const { data: about } = useSuspenseQuery(aboutContentQuery);
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
              <Stethoscope className="size-3.5" aria-hidden /> {about.badgeLabel}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {about.heading}
            </h1>
            <p className="mt-3 max-w-xl text-sm/relaxed text-muted-foreground sm:text-base/relaxed">
              {about.intro}
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
                src={about.founderImageUrl}
                alt={about.founderImageAlt}
                className="mx-auto w-full object-contain"
                loading="eager"
                width={480}
                height={600}
              />
            </div>
            <figcaption className="mt-3 text-center">
              <p className="text-sm font-bold">{about.founderName}</p>
              <p className="text-xs text-muted-foreground">{about.founderTitle}</p>
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
          {about.storyHeading}
        </h2>
        <div className="mt-4 space-y-4 text-sm/relaxed text-foreground/90 sm:text-base/relaxed">
          {about.story.map((p, i) => (
            <StoryParagraph key={i} text={p} />
          ))}
          {about.quote ? (
            <blockquote className="rounded-2xl border-l-4 border-primary bg-accent/40 px-5 py-4 text-sm/relaxed font-medium italic sm:text-base/relaxed">
              "{about.quote}"
              <footer className="mt-2 text-xs font-bold text-muted-foreground not-italic">
                — {about.quoteBy}
              </footer>
            </blockquote>
          ) : null}
        </div>
      </section>

      {/* What we do */}
      <section className="mt-10" aria-labelledby="what-heading">
        <h2 id="what-heading" className="text-2xl font-extrabold tracking-tight">
          {about.whatHeading}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{about.whatIntro}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {about.whatItems.map((item, i) => {
            const Icon = [Search, MapPin, Heart][i % 3];
            return (
              <div key={i} className="surface-card p-5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-3 text-sm font-bold">{item.title}</h3>
                <p className="mt-1.5 text-xs/relaxed text-muted-foreground">{item.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Transparency pledge */}
      <section className="mt-10" aria-labelledby="pledge-heading">
        <h2 id="pledge-heading" className="text-2xl font-extrabold tracking-tight">
          {about.pledgeHeading}
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {about.pledgeItems.map((item, i) => {
            const Icon = [Scale, ShieldCheck, BadgeCheck][i % 3];
            return (
              <div key={i} className="surface-card p-5">
                <Icon className="size-5 text-primary" aria-hidden />
                <h3 className="mt-3 text-sm font-bold">{item.title}</h3>
                <p className="mt-1.5 text-xs/relaxed text-muted-foreground">{item.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="surface-card mt-10 p-6 text-center sm:p-10">
        <h2 className="text-2xl font-extrabold tracking-tight">{about.ctaHeading}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm/relaxed text-muted-foreground">
          {about.ctaBody}
        </p>
        <p className="mt-4 text-sm font-semibold text-primary">
          Write to us at{" "}
          <a href={`mailto:${about.ctaEmail}`} className="underline underline-offset-2">
            {about.ctaEmail}
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
