import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteAd, getAllAds, getLiveAds, saveAd, uploadAdImage, type AdInput } from "./ads.functions";
import { adIsLive, type AdBanner } from "./ads.types";

export const liveAdsQuery = queryOptions({
  queryKey: ["ads", "live"],
  queryFn: () => getLiveAds(),
  staleTime: 60_000,
});

export const adminAdsQuery = queryOptions({
  queryKey: ["ads", "admin"],
  queryFn: () => getAllAds(),
});

/** Banners for one slot, filtered again client-side so expiry is exact. */
export function useAds(placement: string): AdBanner[] {
  const { data } = useQuery(liveAdsQuery);
  return (data ?? []).filter((a) => a.placement === placement && adIsLive(a));
}

function useAdsInvalidate() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: ["ads"] });
}

export function useSaveAd(onDone?: () => void) {
  const invalidate = useAdsInvalidate();
  return useMutation({
    mutationFn: (input: { id?: string | null; values: AdInput }) => saveAd({ data: input }),
    onSuccess: () => {
      toast.success("Banner saved");
      invalidate();
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAd() {
  const invalidate = useAdsInvalidate();
  return useMutation({
    mutationFn: (id: string) => deleteAd({ data: { id } }),
    onSuccess: () => {
      toast.success("Banner deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUploadAdImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const buf = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i += 8192)
        binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      return uploadAdImage({
        data: {
          fileName: file.name,
          contentType: file.type || "image/png",
          dataBase64: btoa(binary),
        },
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
