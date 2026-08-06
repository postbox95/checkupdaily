import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  bulkAdjustPrices,
  bulkPriceAction,
  deleteRecord,
  getAdminCatalog,
  getMyAccess,
  listStaff,
  pushChainToBranches,
  resetToChainDefault,
  saveRecord,
  savePrices,
  saveSettings,
  setUserRole,
  type AdminTable,
  type PriceInput,
} from "./catalog.functions";
import { decorate } from "./catalog";
import type { DiscountType } from "@/data/seed";

export const adminCatalogQuery = queryOptions({
  queryKey: ["admin", "catalog"],
  queryFn: () => getAdminCatalog(),
});

export const accessQuery = queryOptions({
  queryKey: ["admin", "access"],
  queryFn: () => getMyAccess(),
});

export const staffQuery = queryOptions({
  queryKey: ["admin", "staff"],
  queryFn: () => listStaff(),
});

export function useAdminCatalog() {
  const { data } = useSuspenseQuery(adminCatalogQuery);
  return decorate(data);
}

export function useAdminInvalidate() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["admin"] });
    void qc.invalidateQueries({ queryKey: ["catalog"] });
  };
}

export function useSaveRecord(onDone?: () => void) {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: (input: { table: AdminTable; id?: string | null; values: Record<string, unknown> }) =>
      saveRecord({ data: input }),
    onSuccess: () => {
      toast.success("Saved");
      invalidate();
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteRecord() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: (input: { table: AdminTable; id: string }) => deleteRecord({ data: input }),
    onSuccess: () => {
      toast.success("Deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSavePrices() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: (input: { scope: "chain" | "branch"; targetId: string; rows: PriceInput[] }) =>
      savePrices({ data: input }),
    onSuccess: (r) => {
      toast.success(`Saved ${r.saved} price row${r.saved === 1 ? "" : "s"}`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useResetToChainDefault() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: (input: { centerId: string; testIds: string[] }) =>
      resetToChainDefault({ data: input }),
    onSuccess: () => {
      toast.success("Reset to chain default");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBulkPriceAction() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: (input: {
      scope: "chain" | "branch";
      targetId: string;
      testIds: string[];
      action: "adjust" | "discount" | "availability" | "delete";
      percent?: number;
      discountType?: DiscountType;
      discountValue?: number;
      isAvailable?: boolean;
    }) => bulkPriceAction({ data: input }),
    onSuccess: (r) => {
      toast.success(`Updated ${r.affected} row${r.affected === 1 ? "" : "s"}`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function usePushChain() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: (input: {
      chainId: string;
      what: "fee" | "prices" | "both" | "hours";
      overwriteOverrides: boolean;
    }) => pushChainToBranches({ data: input }),
    onSuccess: (r) => {
      toast.success(`Pushed to ${r.branches} branch${r.branches === 1 ? "" : "es"}`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBulkAdjust() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: (input: { centerId?: string | null; testId?: string | null; percent: number }) =>
      bulkAdjustPrices({ data: input }),
    onSuccess: (r) => {
      toast.success(`Updated ${r.updated} price rows`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSaveSettings() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: (value: Record<string, unknown>) => saveSettings({ data: { value } }),
    onSuccess: () => {
      toast.success("Settings saved");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSetUserRole() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: (input: { userId: string; role: "admin" | "editor"; grant: boolean }) =>
      setUserRole({ data: input }),
    onSuccess: () => {
      toast.success("Roles updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
