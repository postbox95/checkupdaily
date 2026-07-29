// Shared domain types + pure helpers. All content now lives in the database
// and is loaded through src/lib/catalog.ts.

export type TestCategory =
  | "PATHOLOGY"
  | "RADIOLOGY"
  | "CARDIOLOGY"
  | "ENDOSCOPY"
  | "OTHER";

export const TEST_CATEGORIES: TestCategory[] = [
  "PATHOLOGY",
  "RADIOLOGY",
  "CARDIOLOGY",
  "ENDOSCOPY",
  "OTHER",
];

export interface DiagnosticCenter {
  id: string;
  slug: string;
  name: string;
  branchName: string;
  thana: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  contactPhone: string;
  sampleCollectionFee: number;
  homeSampleAvailable: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface MedicalTest {
  id: string;
  canonicalName: string;
  banglaName: string;
  code: string;
  category: TestCategory;
  synonyms: string[];
  description: string;
  preparationNote: string;
  fastingRequired: boolean;
  fastingHours?: number | null;
  reportDeliveryHrs: number;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface TestPrice {
  id: string;
  medicalTestId: string;
  diagnosticCenterId: string;
  price: number;
  discountedPrice?: number | null;
  notes?: string | null;
  isAvailable: boolean;
}

export interface Thana {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  sortOrder: number;
  isActive: boolean;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  heroTitleEn: string;
  heroTitleBn: string;
  heroSubEn: string;
  heroSubBn: string;
  defaultThana: string;
  defaultLang: "en" | "bn";
  currencySymbol: string;
  supportPhone: string;
  metaDescription: string;
}

export interface Catalog {
  centers: DiagnosticCenter[];
  tests: MedicalTest[];
  prices: TestPrice[];
  thanas: Thana[];
  settings: SiteSettings;
}

export const emptyCatalog: Catalog = {
  centers: [],
  tests: [],
  prices: [],
  thanas: [],
  settings: {
    siteName: "Niramoy Prices",
    tagline: "Compare diagnostic test prices across Dhaka",
    heroTitleEn: "Know the real price before you test",
    heroTitleBn: "পরীক্ষার আগেই আসল দাম জানুন",
    heroSubEn:
      "Compare diagnostic test prices across Dhaka labs — including needle, tube and registration charges.",
    heroSubBn: "ঢাকার ডায়াগনস্টিক সেন্টারগুলোর দাম তুলনা করুন — সব চার্জসহ।",
    defaultThana: "Dhanmondi",
    defaultLang: "en",
    currencySymbol: "৳",
    supportPhone: "",
    metaDescription:
      "Compare diagnostic test prices across Dhaka diagnostic centres, including needle & registration charges.",
  },
};

export const effectivePrice = (p: TestPrice) => p.discountedPrice ?? p.price;

export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(s));
}
