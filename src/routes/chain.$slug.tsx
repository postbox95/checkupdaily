import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { chainProfileQuery, useRequestOtp, useSubmitReview } from "@/lib/reviews";
import type { ChainProfile } from "@/lib/reviews.types";

export const Route = createFileRoute("/chain/$slug")({
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(chainProfileQuery(params.slug, 1));
    if (!data) throw notFound();
    return { name: data.chain.name, branches: data.branches.length };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return { meta: [{ title: "Lab chain not found" }, { name: "robots", content: "noindex" }] };
    const title = `${loaderData.name} — branches, prices & patient reviews`;
    const description = `${loaderData.name} has ${loaderData.branches} branches in Dhaka. Read verified patient reviews and compare test prices branch by branch.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
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
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const { data, isFetching } = useQuery(chainProfileQuery(slug, page));

  if (!data) return <main className="mx-auto max-w-3xl px-4 py-16" />;
  const { chain, branches, areas, summary, reviews } = data;
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
                <p className="text-sm font-semibold">{b.branchName || b.name}</p>
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

      <AdSlot placement="chain_bottom" className="mt-5" />
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
