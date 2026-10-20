export type ReviewStatus = "pending" | "published" | "flagged" | "deleted";

export const REVIEW_STATUSES: ReviewStatus[] = ["published", "pending", "flagged", "deleted"];

/** A review as shown publicly — the phone number is already masked server-side. */
export interface PublicReview {
  id: string;
  rating: number;
  reviewText: string;
  reviewerName: string;
  maskedPhone: string;
  testName: string | null;
  branchName: string | null;
  createdAt: string;
}

export interface RatingSummary {
  average: number;
  total: number;
  /** count per star, index 0 = 1★ */
  breakdown: number[];
}

export interface ChainProfile {
  chain: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string;
    description: string;
    pros: string[];
    cons: string[];
  };
  branches: {
    id: string;
    name: string;
    branchName: string;
    thana: string;
    city: string;
    address: string;
    contactPhone: string;
    latitude: number;
    longitude: number;
  }[];
  areas: string[];
  summary: RatingSummary;
  reviews: PublicReview[];
  testCount: number;
  page: number;
  pageSize: number;
}

export interface AdminReview {
  id: string;
  chainId: string;
  chainName: string;
  branchLabel: string | null;
  rating: number;
  maskedPhone: string;
  billingId: string;
  reviewText: string;
  reviewerName: string;
  testName: string | null;
  status: ReviewStatus;
  flaggedReason: string | null;
  phoneVerifiedAt: string | null;
  createdAt: string;
}

export const REVIEW_PAGE_SIZE = 10;

/** 01712345678 -> 01xxxxx678 */
export function maskPhone(phone: string) {
  const p = phone.replace(/\D/g, "");
  if (p.length < 6) return "01xxxxxxxx";
  return `${p.slice(0, 2)}xxxxx${p.slice(-3)}`;
}

/** Accepts 01XXXXXXXXX, +8801XXXXXXXXX, 8801XXXXXXXXX. Returns 01XXXXXXXXX or null. */
export function normalizeBdPhone(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  const local = d.startsWith("880") ? d.slice(3) : d.startsWith("0") ? d : `0${d}`;
  return /^01[3-9]\d{8}$/.test(local) ? local : null;
}
