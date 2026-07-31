import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, Info, MapPin, Phone, Plus, Utensils } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { distanceKm } from "@/data/seed";
import { catalogQueryOptions, decorate, useCatalog } from "@/lib/catalog";
import { redundancyWarning } from "@/lib/search";
import { t } from "@/lib/i18n";
import { bdt, useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const Route = createFileRoute("/test/$code")({
  loader: async ({ params, context }) => {
    const catalog = decorate(await context.queryClient.ensureQueryData(catalogQueryOptions));
    const test = catalog.testByCode(params.code);
    if (!test) throw notFound();
    return { test };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Test not found — Niramoy Prices" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.test.canonicalName} Price in Dhaka — Niramoy Prices`;
    const description = `Compare ${loaderData.test.canonicalName} prices across Dhaka diagnostic centres, including needle and registration charges.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: TestPage,
});

function TestPage() {
  const { test } = Route.useLoaderData();
  const { tests, centerById, chainOf, pricesForTest, thanaCoords, branchFee, branchHomeCollection } =
    useCatalog();
  const { lang, thana, cart, addToCart } = useAppStore();
  const [sort, setSort] = useState<"price" | "distance">("price");
  const [homeOnly, setHomeOnly] = useState(false);
  const [areaOnly, setAreaOnly] = useState(false);

  const origin = thanaCoords[thana] ?? Object.values(thanaCoords)[0] ?? { lat: 23.75, lng: 90.39 };

  const rows = useMemo(() => {
    return pricesForTest(test.id)
      .map((p) => {
        const center = centerById(p.diagnosticCenterId)!;
        const fee = branchFee(center);
        return {
          price: p,
          center,
          fee,
          homeCollection: branchHomeCollection(center),
          total: p.finalPrice + test.consumableFee + fee,
          distance: distanceKm(origin, { lat: center.latitude, lng: center.longitude }),
        };
      })
      .filter((r) => (homeOnly ? r.homeCollection : true))
      .filter((r) => (areaOnly ? r.center.thana === thana : true))
      .sort((a, b) => (sort === "price" ? a.total - b.total : a.distance - b.distance));
  }, [
    test.id,
    test.consumableFee,
    origin,
    homeOnly,
    areaOnly,
    sort,
    thana,
    centerById,
    pricesForTest,
    branchFee,
    branchHomeCollection,
  ]);


  const add = () => {
    if (cart.includes(test.id)) return toast.info("Already in your prescription cart.");
    addToCart(test.id);
    const codes = [...cart, test.id]
      .map((id) => tests.find((x) => x.id === id)?.code)
      .filter(Boolean) as string[];
    const warn = redundancyWarning(tests, codes);
    warn ? toast.warning(warn) : toast.success("Added to prescription cart.");
  };

  return (
    <main className="mx-auto max-w-4xl px-4 pt-6 pb-32">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden /> Back to search
      </Link>

      <header className="surface-card mt-3 p-5">
        <h1 className="text-2xl font-extrabold tracking-tight">{test.canonicalName}</h1>
        <p className="mt-1 text-sm text-muted-foreground" data-lang="bn">
          {test.banglaName}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="secondary">{test.category.toLowerCase()}</Badge>
          {test.fastingRequired ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-warning-foreground">
              <Utensils className="size-3.5" aria-hidden /> {test.fastingHours} hours fasting
              required
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              {t("noFasting", lang)}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            <Clock className="size-3.5" aria-hidden /> Report in {test.reportDeliveryHrs} hrs
          </span>
        </div>
        <div className="mt-4">
          <Button onClick={add} className="gap-1.5">
            <Plus className="size-4" aria-hidden /> {t("addToCart", lang)}
          </Button>
        </div>
      </header>

      <section className="surface-card mt-4 p-5">
        <h2 className="text-sm font-bold">How to prepare</h2>
        {test.description && (
          <p className="mt-2 text-sm text-muted-foreground">{test.description}</p>
        )}
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <Utensils className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>
              {test.fastingRequired
                ? `Fast for ${test.fastingHours ?? 8} hours before sampling — plain water is fine, no tea, sugar or food.`
                : "No fasting needed. You can give the sample at any time of day."}
            </span>
          </li>
          <li className="flex gap-2">
            <Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>
              Report is usually ready in {test.reportDeliveryHrs} hours
              {test.reportDeliveryHrs >= 24
                ? ` (about ${Math.round(test.reportDeliveryHrs / 24)} day${
                    test.reportDeliveryHrs >= 48 ? "s" : ""
                  })`
                : ""}
              . Collection cut-off times vary by branch — confirm when you call.
            </span>
          </li>
          <li className="flex gap-2">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>
              {test.preparationNote ||
                "Carry your prescription and a photo ID. Tell the lab about any medicines you are taking."}
            </span>
          </li>
        </ul>
      </section>

      <section className="surface-card mt-4 p-5">
        <h2 className="text-sm font-bold">Why the price differs between labs</h2>
        <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
          <li>
            <strong className="text-foreground">Registration / collection fee.</strong> Each branch
            charges its own per-visit fee, and home collection usually costs more than walk-in.
          </li>
          <li>
            <strong className="text-foreground">Needle, tube & consumables.</strong> Blood tests add
            a consumable charge; imaging tests like MRI or X-ray do not.
          </li>
          <li>
            <strong className="text-foreground">Discounts.</strong> Chains run branch-level or
            citywide discounts, shown here as a struck-through base price.
          </li>
          <li>
            <strong className="text-foreground">Government-regulated tests.</strong> Some tests have
            a fixed government rate and can never be discounted.
          </li>
        </ul>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
        <FilterChip active={sort === "price"} onClick={() => setSort("price")}>
          Price: low to high
        </FilterChip>
        <FilterChip active={sort === "distance"} onClick={() => setSort("distance")}>
          Nearest to {thana}
        </FilterChip>
        <FilterChip active={homeOnly} onClick={() => setHomeOnly((v) => !v)}>
          Home collection
        </FilterChip>
        <FilterChip active={areaOnly} onClick={() => setAreaOnly((v) => !v)}>
          Only in {thana}
        </FilterChip>
      </div>

      <ul className="mt-4 space-y-3">
        {rows.map((r, i) => (
          <li key={r.center.id} className="surface-card p-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-bold">{r.center.name}</h2>
                  {i === 0 && sort === "price" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                          Lowest price{areaOnly ? ` in ${thana}` : " in Dhaka"}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Lowest total bill (base price after discount + registration fee + needle/tube
                        charge) among the {rows.length} branch{rows.length === 1 ? "" : "es"}{" "}
                        {areaOnly ? `in ${thana}` : "across Dhaka"} currently matching your filters.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {r.center.branchName} · {r.center.thana} · {r.distance.toFixed(1)} km from {thana}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    Base:{" "}
                    {r.price.finalPrice < r.price.price ? (
                      <>
                        <s>{bdt(r.price.price)}</s>{" "}
                        <span className="font-semibold text-success">
                          {bdt(r.price.finalPrice)}
                        </span>
                      </>
                    ) : (
                      <span className="font-semibold">{bdt(r.price.price)}</span>
                    )}
                  </span>
                  {test.isGovernmentRate && <span>Government rate — no discount</span>}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="inline-flex items-center gap-1 underline decoration-dotted">
                        <Info className="size-3" aria-hidden />+
                        {bdt(r.fee + test.consumableFee)} charges
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t("regCharge", lang)} {bdt(r.fee)} per visit
                      {test.consumableFee > 0
                        ? ` + ${bdt(test.consumableFee)} needle/tube charge for this test`
                        : " (this test needs no needle/tube charge)"}
                      .
                    </TooltipContent>
                  </Tooltip>
                  <span>{r.homeCollection ? "🏠 Home collection available" : "🏥 Walk-in only"}</span>
                  {chainOf(r.center) && <span>Part of {chainOf(r.center)!.name}</span>}
                  <a
                    className="inline-flex items-center gap-1 underline decoration-dotted"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.google.com/maps/search/?api=1&query=${r.center.latitude},${r.center.longitude}`}
                  >
                    <MapPin className="size-3" aria-hidden /> View on map
                  </a>
                  {r.price.notes && <span className="text-warning-foreground">⚠ {r.price.notes}</span>}

                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Total</p>
                <p className="text-xl font-extrabold text-primary">{bdt(r.total)}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={add} className="gap-1.5">
                <Plus className="size-4" aria-hidden /> Add to cart
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={`tel:${r.center.contactPhone}`} className="gap-1.5">
                  <Phone className="size-4" aria-hidden /> {t("callLab", lang)}
                </a>
              </Button>
            </div>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="surface-card p-6 text-center text-sm text-muted-foreground">
            No labs match these filters. Try turning a filter off.
          </li>
        )}
      </ul>
    </main>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
