import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getCatalog } from "./catalog.functions";
import type { Catalog, TestPrice } from "@/data/seed";

export const catalogQueryOptions = queryOptions({
  queryKey: ["catalog"],
  queryFn: () => getCatalog(),
  staleTime: 30_000,
});

export function useCatalog() {
  const { data } = useSuspenseQuery(catalogQueryOptions);
  return useMemo(() => decorate(data), [data]);
}

export function decorate(c: Catalog) {
  const testById = new Map(c.tests.map((t) => [t.id, t]));
  const testByCode = new Map(c.tests.map((t) => [t.code, t]));
  const centerById = new Map(c.centers.map((x) => [x.id, x]));
  const thanaCoords: Record<string, { lat: number; lng: number }> = {};
  for (const th of c.thanas) thanaCoords[th.name] = { lat: th.latitude, lng: th.longitude };

  return {
    ...c,
    testById: (id: string) => testById.get(id),
    testByCode: (code: string) => testByCode.get(code),
    centerById: (id: string) => centerById.get(id),
    thanaCoords,
    pricesForTest: (testId: string): TestPrice[] =>
      c.prices.filter(
        (p) => p.medicalTestId === testId && p.isAvailable && centerById.has(p.diagnosticCenterId),
      ),
  };
}

export type DecoratedCatalog = ReturnType<typeof decorate>;
