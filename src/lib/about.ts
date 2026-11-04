import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAboutContent,
  saveAboutContent,
  uploadAboutImage,
} from "./about.functions";

export type { AboutContent, AboutItem } from "./about.types";
export { DEFAULT_ABOUT, parseStory } from "./about.types";

export const aboutContentQuery = queryOptions({
  queryKey: ["about", "content"],
  queryFn: () => getAboutContent(),
});

export function useSaveAbout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: AboutContent) => saveAboutContent({ data: { value } }),
    onSuccess: () => {
      toast.success("About page saved");
      void qc.invalidateQueries({ queryKey: ["about"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUploadAboutImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const buf = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i += 8192)
        binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      return uploadAboutImage({
        data: {
          fileName: file.name,
          contentType: file.type || "image/png",
          dataBase64: btoa(binary),
        },
      });
    },
    onSuccess: () => toast.success("Image uploaded"),
    onError: (e: Error) => toast.error(e.message),
  });
}
