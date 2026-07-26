import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { TestSearch } from "@/components/TestSearch";
import { tests, prices, effectivePrice } from "@/data/seed";
import { t } from "@/lib/i18n";
import { bdt, useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Niramoy Prices — Compare Diagnostic Test Prices in Dhaka" },
      {
        name: "description",
        content:
          "Compare CBC, USG, Lipid Profile and more across Popular, Labaid, Ibn Sina, Praava and Medinova. See real totals including needle & registration charges.",
      },
      { property: "og:title", content: "Niramoy Prices — Diagnostic Test Price Comparison, Dhaka" },
      {
        property: "og:description",
        content:
          "Search any medical test in English or Bangla and compare the true out-of-pocket bill across Dhaka diagnostic centres.",
      },
    ],
  }),
  component: Home,
});

const popular = ["TEST-CBC", "TEST-LIPID", "TEST-USG-ABD", "TEST-HBA1C", "TEST-ECG", "TEST-CREAT"];

function lowestTotal(testId: string) {
  const rows = prices.filter((p) => p.medicalTestId === testId);
  return Math.min(...rows.map(effectivePrice));
}

function Home() {
  const lang = useAppStore((s) => s.lang);

  return (
    <main>
      <section className="hero-gradient relative overflow-hidden px-4 pt-14 pb-28 text-primary-foreground">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold">
            <Sparkles className="size-3.5" aria-hidden /> Dhaka · 9 branches · 17 tests
          </span>
          <h1 className="mt-5 text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl">
            {t("heroTitle", lang)}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm/relaxed opacity-90 sm:text-base">
            {t("heroSub", lang)}
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-2xl">
          <TestSearch />
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-16 max-w-5xl px-4">
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

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-lg font-bold tracking-tight">{t("popularTests", lang)}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((code) => {
            const test = tests.find((x) => x.code === code)!;
            return (
              <Link
                key={code}
                to="/test/$code"
                params={{ code }}
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
            );
          })}
        </div>
      </section>
    </main>
  );
}
