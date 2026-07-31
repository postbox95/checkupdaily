import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, Scale, Search } from "lucide-react";
import type { MedicalTest } from "@/data/seed";
import { bdt } from "@/lib/store";

export function StatBar({
  tests,
  labs,
  chains,
  pricePoints,
}: {
  tests: number;
  labs: number;
  chains: number;
  pricePoints: number;
}) {
  const items = [
    { value: tests, label: "tests catalogued" },
    { value: labs, label: "lab branches" },
    { value: chains, label: "lab chains" },
    { value: pricePoints, label: "price points tracked" },
  ];
  return (
    <section aria-label="Coverage statistics" className="mx-auto max-w-5xl px-4">
      <div className="surface-card grid grid-cols-2 divide-border sm:grid-cols-4 sm:divide-x">
        {items.map((s) => (
          <div key={s.label} className="px-4 py-4 text-center">
            <p className="text-2xl font-extrabold tracking-tight text-primary">
              {s.value.toLocaleString("en-US")}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              {s.label}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Updated pricing for Dhaka diagnostic centres — base price, needle/tube and registration
        charges included.
      </p>
    </section>
  );
}

const steps = [
  {
    icon: Search,
    title: "1. Search your test",
    body: "Type the test in English, Bangla or your doctor's shorthand — CBC, সুগার, USG, RBS.",
  },
  {
    icon: Scale,
    title: "2. Compare true totals",
    body: "Every quote includes the lab's registration fee and the needle/tube charge for that test.",
  },
  {
    icon: CalendarCheck,
    title: "3. Call & book",
    body: "Pick the branch nearest you or the cheapest one, then call the lab directly — no middleman.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h2 className="text-lg font-bold tracking-tight">How it works</h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {steps.map((s) => (
          <li key={s.title} className="surface-card p-4">
            <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <s.icon className="size-4" aria-hidden />
            </span>
            <h3 className="mt-3 text-sm font-bold">{s.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export interface RangeItem {
  test: MedicalTest;
  min: number;
  max: number;
  labs: number;
}

export function PriceRangeHooks({ items }: { items: RangeItem[] }) {
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-5xl px-4 pb-2">
      <h2 className="text-lg font-bold tracking-tight">Prices really do vary</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Same test, same city — here is the spread we are tracking right now.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {items.map(({ test, min, max, labs }) => (
          <Link
            key={test.id}
            to="/test/$code"
            params={{ code: test.code }}
            className="surface-card group p-4 transition-shadow hover:shadow-[var(--shadow-float)]"
          >
            <p className="text-sm font-bold">{test.canonicalName}</p>
            <p className="mt-2 text-lg font-extrabold text-primary">
              {bdt(min)} – {bdt(max)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              across {labs} {labs === 1 ? "branch" : "branches"} in Dhaka
              {max > min && ` · up to ${bdt(max - min)} difference`}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
              See why <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function TrustedBy({ names }: { names: string[] }) {
  if (!names.length) return null;
  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h2 className="text-center text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
        Pricing tracked from
      </h2>
      <ul className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {names.map((n) => (
          <li
            key={n}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground"
          >
            {n}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Prices are collected from published lab rate cards and branch enquiries. Always confirm with
        the lab before your visit.
      </p>
    </section>
  );
}
