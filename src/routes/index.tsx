import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { AdSlot } from "@/components/AdSlot";
import { TestSearch } from "@/components/TestSearch";
import { StickySearch } from "@/components/StickySearch";
import {
  HowItWorks,
  PriceRangeHooks,
  StatBar,
  TrustedBy,
  type RangeItem,
} from "@/components/HomeSections";
import { useCatalog } from "@/lib/catalog";
import { t } from "@/lib/i18n";
import { bdt, useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyTestReport — Compare Diagnostic Test Prices in Dhaka" },
      {
        name: "description",
        content:
          "Compare CBC, USG, Lipid Profile and more across Popular, Labaid, Ibn Sina, Praava and Medinova. See real totals including needle & registration charges.",
      },
      { property: "og:title", content: "MyTestReport — Diagnostic Test Price Comparison, Dhaka" },
      {
        property: "og:description",
        content:
          "Search any medical test in English or Bangla and compare the true out-of-pocket bill across Dhaka diagnostic centres.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const CATEGORY_GROUPS: { label: string; match: (name: string, code: string) => boolean }[] = [
  { label: "Blood", match: (n) => /cbc|blood|esr|hb|haemo|hemo|crp|widal/i.test(n) },
  { label: "Diabetes", match: (n, c) => /glucose|sugar|hba1c|diabet|fbs|rbs|ogtt/i.test(n + c) },
  { label: "Thyroid", match: (n) => /thyroid|tsh|t3|t4/i.test(n) },
  { label: "Heart", match: (n) => /ecg|echo|cardiac|troponin|lipid|cholesterol/i.test(n) },
  { label: "Liver", match: (n) => /liver|sgpt|sgot|alt|ast|bilirubin|hbsag|hepat/i.test(n) },
  { label: "Kidney", match: (n) => /kidney|creatinine|urea|urine|electrolyte/i.test(n) },
  { label: "Pregnancy", match: (n) => /pregnan|beta hcg|hcg|obstetric|anomaly/i.test(n) },
  { label: "Hormones", match: (n) => /hormone|prolactin|testoster|estrogen|fsh|lh|vitamin d/i.test(n) },
  { label: "Brain", match: (n) => /brain|mri|ct scan|eeg|head/i.test(n) },
  { label: "Imaging", match: (n) => /usg|ultraso|x-?ray|mri|ct |scan|doppler/i.test(n) },
];

function Home() {
  const lang = useAppStore((s) => s.lang);
  const { tests, centers, chains, settings, pricesForTest } = useCatalog();
  const [tab, setTab] = useState("Popular");

  const priceRows = useMemo(
    () =>
      tests.map((test) => {
        const rows = pricesForTest(test.id);
        const totals = rows.map((r) => r.finalPrice + test.consumableFee);
        return {
          test,
          count: rows.length,
          min: totals.length ? Math.min(...totals) : 0,
          max: totals.length ? Math.max(...totals) : 0,
        };
      }),
    [tests, pricesForTest],
  );

  const pricePoints = priceRows.reduce((sum, r) => sum + r.count, 0);
  const lowestTotal = (testId: string) => priceRows.find((r) => r.test.id === testId)?.min ?? 0;

  const rangeItems: RangeItem[] = priceRows
    .filter((r) => r.count > 1 && r.max > r.min)
    .sort((a, b) => (b.max - b.min) / (b.min || 1) - (a.max - a.min) / (a.min || 1))
    .slice(0, 3)
    .map((r) => ({ test: r.test, min: r.min, max: r.max, labs: r.count }));

  const groups = CATEGORY_GROUPS.filter((g) =>
    tests.some((x) => g.match(x.canonicalName, x.code)),
  );

  const visibleTests = useMemo(() => {
    if (tab === "Popular") {
      const popular = tests.filter((x) => x.isPopular);
      return (popular.length ? popular : tests).slice(0, 6);
    }
    const group = groups.find((g) => g.label === tab);
    if (!group) return tests.slice(0, 6);
    return tests.filter((x) => group.match(x.canonicalName, x.code)).slice(0, 9);
  }, [tab, tests, groups]);

  return (
    <main>
      <StickySearch />

      <section className="hero-gradient relative z-20 px-4 pt-14 pb-16 text-primary-foreground">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold">
            <Sparkles className="size-3.5" aria-hidden /> Dhaka price transparency
          </span>
          <h1 className="mt-5 text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl">
            {(lang === "bn" ? settings.heroTitleBn : settings.heroTitleEn) || t("heroTitle", lang)}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm/relaxed opacity-90 sm:text-base">
            {(lang === "bn" ? settings.heroSubBn : settings.heroSubEn) || t("heroSub", lang)}
          </p>
        </div>
        <div className="relative z-30 mx-auto mt-8 max-w-2xl">
          <TestSearch />
        </div>
      </section>

      <div className="relative z-10 mt-6">
        <StatBar
          tests={tests.length}
          labs={centers.length}
          chains={chains.length}
          pricePoints={pricePoints}
        />
      </div>

      <AdSlot placement="home_top" className="mx-auto mt-6 max-w-5xl px-4" />

      <section className="mx-auto mt-8 max-w-5xl px-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Wallet, title: "True total price", body: "Needle, tube & registration charges included in every quote." },
            { icon: ShieldCheck, title: "Bangla + Banglish search", body: "Search 'rokto porikkha', 'RBS', 'USG' or 'সুগার'." },
            { icon: Clock, title: "Prep at a glance", body: "Fasting hours and report turnaround before you book." },
          ].map((f) => (
            <div key={f.title} className="surface-card p-4">
              <f.icon className="size-5 text-primary" aria-hidden />
              <h2 className="mt-2 text-sm font-bold">{f.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12">
        <PriceRangeHooks items={rangeItems} />
      </div>

      <HowItWorks />

      <section className="mx-auto max-w-5xl px-4 pb-12">
        <h2 className="text-lg font-bold tracking-tight">
          {tab === "Popular" ? t("popularTests", lang) : `${tab} tests`}
        </h2>
        <div
          className="mt-3 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2"
          role="tablist"
          aria-label="Test categories"
        >
          {["Popular", ...groups.map((g) => g.label)].map((label) => (
            <button
              key={label}
              role="tab"
              aria-selected={tab === label}
              onClick={() => setTab(label)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                tab === label
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTests.map((test) => (
            <Link
              key={test.code}
              to="/tests/$slug"
              params={{ slug: test.code }}
              className="surface-card group p-4 transition-shadow hover:shadow-[var(--shadow-float)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{test.canonicalName}</p>
                  <p className="truncate text-xs text-muted-foreground" data-lang="bn">
                    {test.banglaName}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {test.category.toLowerCase()}
                </Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                From{" "}
                <span className="text-base font-extrabold text-primary">
                  {bdt(lowestTotal(test.id))}
                </span>{" "}
                + lab charges
              </p>
            </Link>
          ))}
          {visibleTests.length === 0 && (
            <p className="surface-card p-6 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
              No tests in this category yet.
            </p>
          )}
        </div>
      </section>

      <AdSlot placement="home_bottom" className="mx-auto max-w-5xl px-4 pb-10" />

      <TrustedBy names={chains.map((c) => c.name)} />
    </main>
  );
}
