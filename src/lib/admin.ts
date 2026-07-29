import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  bulkAdjustPrices,
  deleteRecord,
  getAdminCatalog,
  getMyAccess,
  listStaff,
  saveRecord,
  saveSettings,
  setUserRole,
  upsertPrice,
} from "./catalog.functions";
import { decorate } from "./catalog";

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

type AdminTable = "medical_tests" | "diagnostic_centers" | "test_prices" | "thanas";

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

export function useUpsertPrice() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: (input: {
      medicalTestId: string;
      diagnosticCenterId: string;
      price: number;
      discountedPrice?: number | null;
      notes?: string | null;
      isAvailable: boolean;
    }) => upsertPrice({ data: input }),
    onSuccess: () => invalidate(),
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
