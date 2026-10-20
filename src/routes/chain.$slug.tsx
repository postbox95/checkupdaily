import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Mail, MapPin, Navigation, Phone, Star, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { chainProfileQuery, useRequestOtp, useSubmitReview } from "@/lib/reviews";
import type { ChainProfile } from "@/lib/reviews.types";
import { seoBundleQueryOptions, globalOf, pickSeo } from "@/lib/seo.query";
import { breadcrumbSchema, buildHead, faqSchema, localBusinessSchema } from "@/lib/seo";

export const Route = createFileRoute("/chain/$slug")({
  validateSearch: (s: Record<string, unknown>): { branch?: string } =>
    typeof s.branch === "string" && s.branch ? { branch: s.branch } : {},
  loaderDeps: ({ search }) => ({ branch: search.branch ?? null }),
  loader: async ({ params, context, deps }) => {
    const [data, bundle] = await Promise.all([
      context.queryClient.ensureQueryData(chainProfileQuery(params.slug, 1, deps.branch)),
      context.queryClient.ensureQueryData(seoBundleQueryOptions),
    ]);
    if (!data) throw notFound();
    const global = globalOf(bundle);
    return {
      profile: data,
      global,
      seo: pickSeo(bundle, "chain", data.chain.slug, global.defaultLang),
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return { meta: [{ title: "Lab chain not found" }, { name: "robots", content: "noindex" }] };
    const { profile, global, seo } = loaderData;
    const path = `/chain/${seo?.slug || profile.chain.slug}`;
    const description = `${profile.chain.name} has ${profile.branches.length} branches in Dhaka. Read verified patient reviews and compare test prices branch by branch.`;
    return buildHead({
      global,
      seo,
      path,
      fallbackTitle: `${profile.chain.name} — branches, prices & patient reviews`,
      fallbackDescription: description,
      image: profile.chain.logoUrl,
      jsonLd: [
        breadcrumbSchema(global, [{ name: "Home", path: "/" }, { name: profile.chain.name, path }]),
        faqSchema(seo?.faqs),
        ...profile.branches.map((branch) => localBusinessSchema(global, {
          name: profile.chain.name,
          branchName: branch.branchName,
          address: branch.address,
          thana: branch.thana,
          city: branch.city,
          phone: branch.contactPhone,
          latitude: branch.latitude,
          longitude: branch.longitude,
          url: path,
          logo: profile.chain.logoUrl,
        })),
      ].filter(Boolean),
    });
  },
  component: ChainPage,
  errorComponent: () => (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-muted-foreground">
      We could not load this lab chain right now. Please try again.
    </main>
  ),
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-lg font-bold">Lab chain not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">This chain may have been removed.</p>
    </main>
  ),
});

function ChainPage() {
  const { slug } = Route.useParams();
  const { branch: branchId = null } = Route.useSearch();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const { data, isFetching } = useQuery(chainProfileQuery(slug, page, branchId));
  const { seo } = Route.useLoaderData();

  if (!data) return <main className="mx-auto max-w-3xl px-4 py-16" />;
  const { chain, branches, areas, summary, reviews } = data;
  if (data.testCount === 0 && !chain.pros.length && !chain.cons.length)
    return <PricesWithheld data={data} />;
  const activeBranch = branches.find((b) => b.id === branchId) ?? null;
  const pages = Math.max(1, Math.ceil(summary.total / data.pageSize));

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
      <AdSlot placement="chain_top" className="mb-5" />
      <header className="surface-card flex flex-wrap items-center gap-4 p-5">
        <div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
          {chain.logoUrl ? (
            <img src={chain.logoUrl} alt={`${chain.name} logo`} className="size-full object-contain" />
          ) : (
            <span className="text-lg font-bold text-muted-foreground">
              {chain.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold">{chain.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {branches.length} branch{branches.length === 1 ? "" : "es"} ·{" "}
            {areas.length ? areas.join(", ") : "Dhaka"}
          </p>
          {chain.description && (
            <p className="mt-2 text-sm text-muted-foreground">{chain.description}</p>
          )}
        </div>
      </header>

      {activeBranch && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <MapPin className="size-4 text-primary" aria-hidden />
          <span>
            Showing reviews for <strong>{activeBranch.branchName || activeBranch.name}</strong> branch
          </span>
          <Link
            to="/chain/$slug"
            params={{ slug }}
            search={{}}
            onClick={() => setPage(1)}
            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <X className="size-3" aria-hidden /> All branches
          </Link>
        </div>
      )}

      {seo?.intro && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{seo.intro}</p>}

      {/* review summary */}
      <section className="surface-card mt-4 p-5" aria-label="Review summary">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-3xl font-extrabold text-primary">{summary.average.toFixed(1)}</p>
            <Stars value={Math.round(summary.average)} />
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.total} published review{summary.total === 1 ? "" : "s"}
            </p>
          </div>
          <div className="min-w-[200px] flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.breakdown[star - 1] ?? 0;
              const pct = summary.total ? Math.round((count / summary.total) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-8 text-muted-foreground">{star}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 text-right text-muted-foreground">{pct}%</span>
                </div>
              );
            })}
          </div>
          <Button onClick={() => setFormOpen((v) => !v)}>Write a review</Button>
        </div>
      </section>

      {formOpen && (
        <ReviewForm chain={chain} branches={branches} onDone={() => setFormOpen(false)} />
      )}

      {(chain.pros.length > 0 || chain.cons.length > 0) && (
        <section className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="surface-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <ThumbsUp className="size-4 text-success" aria-hidden /> Pros
            </h2>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {chain.pros.map((p) => (
                <li key={p}>• {p}</li>
              ))}
              {!chain.pros.length && <li>Not listed yet.</li>}
            </ul>
          </div>
          <div className="surface-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <ThumbsDown className="size-4 text-destructive" aria-hidden /> Cons
            </h2>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {chain.cons.map((c) => (
                <li key={c}>• {c}</li>
              ))}
              {!chain.cons.length && <li>Not listed yet.</li>}
            </ul>
          </div>
        </section>
      )}

      <section className="mt-6" aria-label="Branches">
        <h2 className="text-sm font-bold">All branches</h2>
        <ul className="mt-3 space-y-2">
          {branches.map((b) => (
            <li key={b.id} className="surface-card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link
                  to="/chain/$slug"
                  params={{ slug }}
                  search={{ branch: b.id }}
                  onClick={() => setPage(1)}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  {b.branchName || b.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {b.thana}
                  {b.city ? `, ${b.city}` : ""} · {b.address}
                </p>
              </div>
              <a
                className="inline-flex items-center gap-1 text-xs underline decoration-dotted"
                target="_blank"
                rel="noreferrer"
                href={`https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}`}
              >
                <MapPin className="size-3" aria-hidden /> Map
              </a>
              {b.contactPhone && (
                <a
                  className="inline-flex items-center gap-1 text-xs underline decoration-dotted"
                  href={`tel:${b.contactPhone}`}
                >
                  <Phone className="size-3" aria-hidden /> Call
                </a>
              )}
              <Button size="sm" variant="outline" asChild>
                <Link to="/">Browse test prices</Link>
              </Button>
              <Button size="sm" asChild>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}`}
                >
                  <Navigation className="size-3.5" aria-hidden /> Visit the Branch
                </a>
              </Button>
            </li>
          ))}
          {!branches.length && (
            <li className="surface-card p-5 text-sm text-muted-foreground">
              No published branches for this chain yet.
            </li>
          )}
        </ul>
      </section>

      <section className="mt-6" aria-label="Reviews">
        <h2 className="text-sm font-bold">Visitor reviews</h2>
        <ul className="mt-3 space-y-2">
          {reviews.map((r) => (
            <li key={r.id} className="surface-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Stars value={r.rating} />
                <span className="text-sm font-semibold">{r.reviewerName}</span>
                <span className="text-xs text-muted-foreground">{r.maskedPhone}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{r.reviewText}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {[r.testName, r.branchName].filter(Boolean).join(" · ")}
              </p>
            </li>
          ))}
          {!reviews.length && (
            <li className="surface-card p-5 text-sm text-muted-foreground">
              No reviews yet — be the first to share your experience.
            </li>
          )}
        </ul>
        {pages > 1 && (
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1 || isFetching}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} of {pages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pages || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </section>

      {!!seo?.faqs?.filter((faq) => faq.q && faq.a).length && (
        <section className="surface-card mt-6 p-5">
          <h2 className="text-sm font-bold">Frequently asked questions</h2>
          <dl className="mt-3 space-y-3">
            {seo.faqs.filter((faq) => faq.q && faq.a).map((faq, index) => (
              <div key={index}>
                <dt className="text-sm font-semibold">{faq.q}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <AdSlot placement="chain_bottom" className="mt-5" />
    </main>
  );
}

function PricesWithheld({ data }: { data: ChainProfile }) {
  const { chain, branches, areas } = data;
  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
      <section className="surface-card overflow-hidden">
        <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-card">
              {chain.logoUrl ? (
                <img src={chain.logoUrl} alt={`${chain.name} logo`} className="size-full object-contain" />
              ) : (
                <span className="text-lg font-bold text-primary">{chain.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-extrabold">{chain.name}</p>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5" aria-hidden />
                {branches.length} branch{branches.length === 1 ? "" : "es"} · {areas.length ? areas.join(", ") : "Dhaka"}
              </p>
            </div>
          </div>
          <h1 className="mt-6 text-2xl font-extrabold leading-tight sm:text-3xl">
            The lab denied sharing their test prices.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            If you're from the lab and want to update the page, please contact us at{" "}
            <a href="mailto:request@checkup.com" className="font-semibold text-primary hover:underline">
              request@checkup.com
            </a>
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <a href="mailto:request@checkup.com">
                <Mail className="size-4" aria-hidden /> Contact us
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Compare other labs</Link>
            </Button>
          </div>
        </div>
      </section>

      {branches.length > 0 && (
        <section className="mt-6" aria-label="Branches">
          <h2 className="text-sm font-bold">Branch locations</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {branches.map((b) => (
              <li key={b.id} className="surface-card p-4">
                <p className="text-sm font-semibold">{b.branchName || b.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {b.thana}
                  {b.city ? `, ${b.city}` : ""} · {b.address}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <a
                    className="inline-flex items-center gap-1 underline decoration-dotted"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}`}
                  >
                    <Navigation className="size-3" aria-hidden /> Directions
                  </a>
                  {b.contactPhone && (
                    <a className="inline-flex items-center gap-1 underline decoration-dotted" href={`tel:${b.contactPhone}`}>
                      <Phone className="size-3" aria-hidden /> {b.contactPhone}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="mt-6 flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="size-3" aria-hidden /> We'll publish prices as soon as the lab shares them.
      </p>
    </main>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`size-4 ${s <= value ? "fill-warning text-warning" : "text-muted-foreground/40"}`}
          aria-hidden
        />
      ))}
    </span>
  );
}

function ReviewForm({
  chain,
  branches,
  onDone,
}: {
  chain: ChainProfile["chain"];
  branches: ChainProfile["branches"];
  onDone: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [billingId, setBillingId] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [testName, setTestName] = useState("");
  const [branchId, setBranchId] = useState("");

  const otp = useRequestOtp();
  const submit = useSubmitReview(onDone);

  return (
    <section className="surface-card mt-4 space-y-3 p-5" aria-label="Write a review">
      <h2 className="text-sm font-bold">Write a review for {chain.name}</h2>
      <p className="text-xs text-muted-foreground">
        We verify your mobile number by SMS and store the billing/invoice ID from your visit so the
        lab can be cross-checked if a review is disputed. Your number is never shown in full.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="rv-name">Your name</Label>
          <Input id="rv-name" className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="rv-phone">Mobile number</Label>
          <div className="mt-1 flex gap-2">
            <Input
              id="rv-phone"
              inputMode="tel"
              placeholder="01712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={otp.isPending}
              onClick={() => otp.mutate(phone, { onSuccess: () => setVerifying(true) })}
            >
              Send code
            </Button>
          </div>
        </div>
        {verifying && (
          <div>
            <Label htmlFor="rv-code">SMS code</Label>
            <Input
              id="rv-code"
              inputMode="numeric"
              className="mt-1"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
        )}
        <div>
          <Label htmlFor="rv-bill">Billing / invoice ID</Label>
          <Input
            id="rv-bill"
            className="mt-1"
            value={billingId}
            onChange={(e) => setBillingId(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="rv-branch">Branch (optional)</Label>
          <select
            id="rv-branch"
            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            <option value="">Not specified</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branchName || b.name} — {b.thana}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="rv-test">Test you took (optional)</Label>
          <Input
            id="rv-test"
            className="mt-1"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>Rating</Label>
        <div className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              aria-label={`${s} star`}
              onClick={() => setRating(s)}
              className="p-1"
            >
              <Star
                className={`size-6 ${s <= rating ? "fill-warning text-warning" : "text-muted-foreground/40"}`}
                aria-hidden
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="rv-text">Your review</Label>
        <Textarea
          id="rv-text"
          className="mt-1"
          rows={4}
          maxLength={2000}
          placeholder="How was the service, waiting time, report accuracy?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted-foreground">{text.trim().length}/30 characters minimum</p>
      </div>

      <div className="flex gap-2">
        <Button
          disabled={!verifying || !code.trim() || submit.isPending}
          onClick={() =>
            submit.mutate({
              chainId: chain.id,
              branchId: branchId || null,
              phone,
              code,
              billingId,
              rating,
              reviewText: text,
              reviewerName: name,
              testName: testName || null,
            })
          }
        >
          Submit review
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
      {!verifying && (
        <p className="text-xs text-muted-foreground">Verify your mobile number to enable submission.</p>
      )}
    </section>
  );
}
