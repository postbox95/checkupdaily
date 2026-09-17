import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deleteSeoRecord,
  deleteSeoRedirect,
  getSeoBundle,
  listSeoRecords,
  listSeoRedirects,
  saveSeoRecord,
  saveSeoRedirect,
} from "./seo.functions";
import { seoKey } from "./seo.keys";
import { DEFAULT_GLOBAL_SEO, type GlobalSeo, type SeoFields } from "./seo.types";

export const seoBundleQueryOptions = queryOptions({
  queryKey: ["seo-bundle"],
  queryFn: () => getSeoBundle(),
  staleTime: 60_000,
});

export const seoRecordsQueryOptions = queryOptions({
  queryKey: ["seo-records"],
  queryFn: () => listSeoRecords(),
});

export const seoRedirectsQueryOptions = queryOptions({
  queryKey: ["seo-redirects"],
  queryFn: () => listSeoRedirects(),
});

export function useSeoBundle() {
  const { data } = useSuspenseQuery(seoBundleQueryOptions);
  return data;
}

/** Look up an entity override from an already-loaded bundle. */
export function pickSeo(
  bundle: { records: Record<string, SeoFields> },
  entityType: string,
  entityKey: string,
  lang = "en",
): SeoFields | null {
  return bundle.records[seoKey(entityType, entityKey, lang)] ?? null;
}

export function globalOf(bundle: { global?: Partial<GlobalSeo> } | undefined): GlobalSeo {
  return { ...DEFAULT_GLOBAL_SEO, ...(bundle?.global ?? {}) };
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["seo-bundle"] });
    qc.invalidateQueries({ queryKey: ["seo-records"] });
    qc.invalidateQueries({ queryKey: ["seo-redirects"] });
  };
}

export function useSaveSeoRecord() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: {
      entityType: "global" | "page" | "test" | "center" | "chain" | "category";
      entityKey: string;
      lang: "en" | "bn";
      data: SeoFields | Partial<GlobalSeo>;
    }) => saveSeoRecord({ data }),
    onSuccess: () => {
      invalidate();
      toast.success("SEO saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSeoRecord() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => deleteSeoRecord({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Override removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSaveRedirect() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: {
      id?: string;
      fromPath: string;
      toPath: string;
      statusCode: number;
      isActive: boolean;
    }) => saveSeoRedirect({ data }),
    onSuccess: () => {
      invalidate();
      toast.success("Redirect saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteRedirect() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => deleteSeoRedirect({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Redirect removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
