import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAboutContent,
  saveAboutContent,
  uploadAboutImage,
} from "./about.functions";
import founderAsset from "@/assets/founder.png.asset.json";

export interface AboutItem {
  title: string;
  body: string;
}

export interface AboutContent {
  /** Hero */
  badgeLabel: string;
  heading: string;
  intro: string;
  /** Founder */
  founderName: string;
  founderTitle: string;
  founderImageUrl: string;
  founderImageAlt: string;
  /** Story */
  storyHeading: string;
  story: string[];
  quote: string;
  quoteBy: string;
  /** What we do */
  whatHeading: string;
  whatIntro: string;
  whatItems: AboutItem[];
  /** Pledge */
  pledgeHeading: string;
  pledgeItems: AboutItem[];
  /** CTA */
  ctaHeading: string;
  ctaBody: string;
  ctaEmail: string;
}

export const DEFAULT_ABOUT: AboutContent = {
  badgeLabel: "About MyTestReport",
  heading: "No patient should have to pay blind.",
  intro:
    "MyTestReport shows the real price of diagnostic tests across Dhaka — base fee, needle, tube and registration charges included — so you can compare labs, choose with confidence and never get surprised at the counter.",
  founderName: "Ummul Wara Saidi",
  founderTitle: "Founder · Pharmacist, North South University",
  founderImageUrl: founderAsset.url,
  founderImageAlt: "Ummul Wara Saidi, founder of MyTestReport",
  storyHeading: "Our story — it started at the lab counter",
  story: [
    "**Ummul Wara Saidi** is an academic A Grade Pharmacist who graduated from North South University. Like most people in Dhaka, her life regularly brings her to a diagnostic lab — for herself, and for the people she cares about.",
    "She had to frequently look out for test labs and diagnostics — appearing in person or calling around just to know what a test costs. There was no way to compare whether a better yet cheaper choice existed across town. And the billed amount was always more than the price she was quoted — a little for the needle, a little for the tube, a little for registration. She was paying for the same test at wildly different prices, and she had no way of knowing.",
    "If this was hard for a pharmacist — someone trained in exactly these tests — she realised how impossible it was for everyone else. That frustration became an idea: **list every lab, publish every price, and let patients compare for themselves.** That idea is MyTestReport.",
  ],
  quote:
    "I kept thinking: why should finding the price of a blood test be harder than the test itself? Patients deserve to see the numbers before they walk in.",
  quoteBy: "Ummul Wara Saidi, Founder",
  whatHeading: "What we do",
  whatIntro:
    "Three things, done simply — so choosing a lab takes minutes, not a day of phone calls.",
  whatItems: [
    {
      title: "Search in your words",
      body: "Type in English, Bangla or the shorthand your doctor wrote — CBC, RBS, লিপিড, ECHO — and find the right test.",
    },
    {
      title: "Compare labs near you",
      body: "Pick your area in Dhaka and see every diagnostic centre nearby, with prices, opening hours and patient reviews side by side.",
    },
    {
      title: "Know your true bill",
      body: "Add tests to your prescription cart and see the full out-of-pocket cost at each lab — before you leave home.",
    },
  ],
  pledgeHeading: "Our promise to patients",
  pledgeItems: [
    {
      title: "No paid rankings",
      body: "Labs cannot pay to appear first or hide their price. The cheapest option is always the easiest to find.",
    },
    {
      title: "Real, published prices",
      body: "Every price comes from a lab's own published rate card — including the needle, tube and registration charges, not just the base test fee.",
    },
    {
      title: "Always verify before you go",
      body: "Prices can change without notice. We show the last published rate and always ask you to confirm with the lab before your visit.",
    },
  ],
  ctaHeading: "Are you a diagnostic centre?",
  ctaBody:
    "If your lab's rates have changed, or you'd like your price list published or updated on MyTestReport, we'd love to hear from you — accurate data helps your patients and ours.",
  ctaEmail: "request@checkup.com",
};

/** Story paragraphs support **bold** spans; split on blank lines in the admin. */
export function parseStory(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export const aboutContentQuery = queryOptions({
  queryKey: ["about", "content"],
  queryFn: () => getAboutContent(),
});

export function useAboutContent() {
  return aboutContentQuery;
}

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
