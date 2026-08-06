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

export type DiscountType = "none" | "amount" | "percent";

export interface LabChain {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  description: string;
  pros: string[];
  cons: string[];
  defaultHomeSampleAvailable: boolean;
  defaultSampleCollectionFee: number;
  isActive: boolean;
  sortOrder: number;
}

export interface DiagnosticCenter {
  id: string;
  slug: string;
  name: string;
  branchName: string;
  labChainId: string | null;
  thana: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  contactPhone: string;
  /** legacy stored value, used as a fallback when the branch has no chain */
  sampleCollectionFee: number;
  sampleCollectionFeeOverride: number | null;
  homeSampleAvailable: boolean;
  homeSampleOverride: boolean | null;
  /** "HH:MM" 24h local opening time */
  opensAt: string;
  /** "HH:MM" 24h local closing time (may be past midnight, e.g. 02:00) */
  closesAt: string;
  is24Hours: boolean;
  /** weekday numbers the branch stays shut, 0 = Sunday */
  closedDays: number[];
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
  /** needle / tube / consumable charge specific to this test (0 for MRI, X-ray…) */
  consumableFee: number;
  /** government-regulated price — never discounted */
  isGovernmentRate: boolean;
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
  discountType: DiscountType;
  discountValue: number;
  notes?: string | null;
  isAvailable: boolean;
}

export interface ChainTestPrice {
  id: string;
  labChainId: string;
  medicalTestId: string;
  price: number;
  discountType: DiscountType;
  discountValue: number;
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
  /** search results are capped to this radius from the visitor's area */
  maxSearchRadiusKm: number;
}

export interface Catalog {
  chains: LabChain[];
  centers: DiagnosticCenter[];
  tests: MedicalTest[];
  prices: TestPrice[];
  chainPrices: ChainTestPrice[];
  thanas: Thana[];
  settings: SiteSettings;
}

export const emptyCatalog: Catalog = {
  chains: [],
  centers: [],
  tests: [],
  prices: [],
  chainPrices: [],
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
    maxSearchRadiusKm: 5,
  },
};

/** Applies a discount rule. Government-rate tests are never discounted. */
export function applyDiscount(
  price: number,
  type: DiscountType,
  value: number,
  governmentRate = false,
): number {
  if (governmentRate || type === "none" || !value) return price;
  const out = type === "percent" ? price - (price * value) / 100 : price - value;
  return Math.max(0, Math.round(out));
}

export const effectivePrice = (
  p: { price: number; discountType?: DiscountType; discountValue?: number; discountedPrice?: number | null },
  governmentRate = false,
) =>
  applyDiscount(p.price, p.discountType ?? "none", p.discountValue ?? 0, governmentRate);

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

