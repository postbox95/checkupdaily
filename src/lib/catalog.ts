import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getCatalog } from "./catalog.functions";
import {
  applyDiscount,
  type Catalog,
  type DiagnosticCenter,
  type DiscountType,
  type LabChain,
  type MedicalTest,
} from "@/data/seed";

export const catalogQueryOptions = queryOptions({
  queryKey: ["catalog"],
  queryFn: () => getCatalog(),
  staleTime: 30_000,
});

export function useCatalog() {
  const { data } = useSuspenseQuery(catalogQueryOptions);
  return useMemo(() => decorate(data), [data]);
}

/** A price as the public site sees it, after chain-template inheritance. */
export interface ResolvedPrice {
  medicalTestId: string;
  diagnosticCenterId: string;
  price: number;
  discountType: DiscountType;
  discountValue: number;
  finalPrice: number;
  notes?: string | null;
  isAvailable: boolean;
  /** true when the branch has no override and follows the chain template */
  inherited: boolean;
}

export function decorate(c: Catalog) {
  const testById = new Map(c.tests.map((t) => [t.id, t]));
  const testByCode = new Map(c.tests.map((t) => [t.code, t]));
  const centerById = new Map(c.centers.map((x) => [x.id, x]));
  const chainById = new Map(c.chains.map((x) => [x.id, x]));
  const branchPrice = new Map(
    c.prices.map((p) => [`${p.medicalTestId}|${p.diagnosticCenterId}`, p]),
  );
  const chainPrice = new Map(
    c.chainPrices.map((p) => [`${p.medicalTestId}|${p.labChainId}`, p]),
  );

  const thanaCoords: Record<string, { lat: number; lng: number }> = {};
  for (const th of c.thanas) thanaCoords[th.name] = { lat: th.latitude, lng: th.longitude };

  const chainOf = (center: DiagnosticCenter): LabChain | undefined =>
    center.labChainId ? chainById.get(center.labChainId) : undefined;

  /** Registration / collection fee actually charged at this branch. */
  const branchFee = (center: DiagnosticCenter) =>
    center.sampleCollectionFeeOverride ??
    chainOf(center)?.defaultSampleCollectionFee ??
    center.sampleCollectionFee;

  const branchHomeCollection = (center: DiagnosticCenter) =>
    center.homeSampleOverride ??
    chainOf(center)?.defaultHomeSampleAvailable ??
    center.homeSampleAvailable;

  const resolvePrice = (testId: string, centerId: string): ResolvedPrice | undefined => {
    const center = centerById.get(centerId);
    if (!center) return undefined;
    const test = testById.get(testId);
    const own = branchPrice.get(`${testId}|${centerId}`);
    const tmpl = center.labChainId ? chainPrice.get(`${testId}|${center.labChainId}`) : undefined;
    const src = own ?? tmpl;
    if (!src) return undefined;
    return {
      medicalTestId: testId,
      diagnosticCenterId: centerId,
      price: src.price,
      discountType: src.discountType,
      discountValue: src.discountValue,
      finalPrice: applyDiscount(
        src.price,
        src.discountType,
        src.discountValue,
        test?.isGovernmentRate ?? false,
      ),
      notes: src.notes,
      isAvailable: src.isAvailable,
      inherited: !own,
    };
  };

  /** Total cost of a single test at a branch, including its consumable charge. */
  const testCostAt = (test: MedicalTest, centerId: string) => {
    const p = resolvePrice(test.id, centerId);
    return p ? p.finalPrice + test.consumableFee : undefined;
  };

  return {
    ...c,
    testById: (id: string) => testById.get(id),
    testByCode: (code: string) => testByCode.get(code),
    centerById: (id: string) => centerById.get(id),
    chainById: (id: string) => chainById.get(id),
    chainOf,
    branchFee,
    branchHomeCollection,
    resolvePrice,
    testCostAt,
    branchesOfChain: (chainId: string) => c.centers.filter((x) => x.labChainId === chainId),
    thanaCoords,
    pricesForTest: (testId: string): ResolvedPrice[] =>
      c.centers
        .map((center) => resolvePrice(testId, center.id))
        .filter((p): p is ResolvedPrice => Boolean(p?.isAvailable)),
  };
}

export type DecoratedCatalog = ReturnType<typeof decorate>;
