import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer, Share2, Trophy, TriangleAlert } from "lucide-react";
import { useMemo } from "react";
import { distanceKm } from "@/data/seed";
import { useCatalog } from "@/lib/catalog";
import { bdt, useAppStore } from "@/lib/store";
import { AdSlot } from "@/components/AdSlot";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Multi-Lab Prescription Comparison — MyTestReport" },
      {
        name: "description",
        content:
          "Add your whole prescription and see the total bill at every Dhaka diagnostic centre, including needle and registration charges.",
      },
      { property: "og:title", content: "Compare your full prescription across Dhaka labs" },
      {
        property: "og:description",
        content: "Itemised totals, missing-test warnings and the lowest combined bill for your prescription.",
      },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { cart, thana } = useAppStore();
  const { centers, testById, thanaCoords, branchFee, resolvePrice } = useCatalog();
  const origin = thanaCoords[thana] ?? Object.values(thanaCoords)[0] ?? { lat: 23.75, lng: 90.39 };

  const results = useMemo(() => {
    return centers
      .map((center) => {
        const fee = branchFee(center);
        let total = fee;
        const items: { name: string; cost: number }[] = [];
        const missing: string[] = [];
        for (const testId of cart) {
          const test = testById(testId);
          if (!test) continue;
          const row = resolvePrice(testId, center.id);
          if (row?.isAvailable) {
            const cost = row.finalPrice + test.consumableFee;
            total += cost;
            items.push({ name: test.canonicalName, cost });
          } else {
            missing.push(test.canonicalName);
          }
        }
        return {
          center,
          fee,
          total,
          items,
          missing,
          covered: items.length,
          distance: distanceKm(origin, { lat: center.latitude, lng: center.longitude }),
        };
      })
      .sort((a, b) => b.covered - a.covered || a.total - b.total);
  }, [cart, origin, centers, testById, resolvePrice, branchFee]);


  if (cart.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-extrabold">Your prescription cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Search for the tests on your prescription and add them to compare lab totals.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Start searching</Link>
        </Button>
      </main>
    );
  }

  const best = results[0];

  const summaryText = [
    `MyTestReport — prescription comparison (${cart.length} tests)`,
    ...cart.map((id) => `• ${testById(id)?.canonicalName}`),
    "",
    `Lowest total: ${best.center.name}, ${best.center.branchName} — ${bdt(best.total)} (${best.covered}/${cart.length} tests)`,
  ].join("\n");

  return (
    <main className="mx-auto max-w-4xl px-4 pt-8 pb-32">
      <AdSlot placement="compare_top" className="mb-5" />
      <h1 className="text-2xl font-extrabold tracking-tight">
        Multi-lab comparison for {cart.length} tests
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Totals include each centre's mandatory needle, tube & registration charge, applied once per
        visit.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
          <Printer className="size-4" aria-hidden /> Print / Save as PDF
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(summaryText)}`}
            target="_blank"
            rel="noreferrer"
            className="gap-1.5"
          >
            <Share2 className="size-4" aria-hidden /> Send to WhatsApp
          </a>
        </Button>
      </div>

      <ul className="mt-6 space-y-3">
        {results.map((r, i) => (
          <li
            key={r.center.id}
            className={`surface-card p-5 ${i === 0 ? "border-primary ring-2 ring-primary/25" : ""}`}
          >
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                {i === 0 && (
                  <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-success/20 px-2.5 py-1 text-[11px] font-bold text-accent-foreground">
                    <Trophy className="size-3.5" aria-hidden /> Lowest total bill
                  </span>
                )}
                <h2 className="text-base font-bold">{r.center.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {r.center.branchName} · {r.center.address} · {r.distance.toFixed(1)} km from{" "}
                  {thana}
                </p>
                <p className="mt-2 text-xs font-semibold text-muted-foreground">
                  {r.covered} of {cart.length} tests available
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Out-of-pocket
                </p>
                <p className="text-2xl font-extrabold text-primary">{bdt(r.total)}</p>
              </div>
            </div>

            {r.missing.length > 0 && (
              <p className="mt-3 flex gap-2 rounded-xl bg-warning/15 px-3 py-2.5 text-xs font-medium text-warning-foreground">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                Offers {r.covered}/{cart.length} tests. Missing: {r.missing.join(", ")}. You would
                need a second lab visit for these.
              </p>
            )}

            <Accordion type="single" collapsible className="mt-2">
              <AccordionItem value="breakdown" className="border-none">
                <AccordionTrigger className="text-xs font-semibold">
                  Itemised price breakdown
                </AccordionTrigger>
                <AccordionContent>
                  <dl className="space-y-1.5 text-xs">
                    {r.items.map((it) => (
                      <div key={it.name} className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">{it.name}</dt>
                        <dd className="font-semibold">{bdt(it.cost)}</dd>
                      </div>
                    ))}
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">
                        Registration / sample collection charge (once per visit)
                      </dt>
                      <dd className="font-semibold">{bdt(r.fee)}</dd>
                    </div>

                    <div className="mt-2 flex justify-between gap-4 border-t border-border pt-2">
                      <dt className="font-bold">Total out-of-pocket bill</dt>
                      <dd className="font-extrabold text-primary">{bdt(r.total)}</dd>
                    </div>
                  </dl>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </li>
        ))}
      </ul>

      <AdSlot placement="compare_bottom" className="mt-5" />
    </main>
  );
}
