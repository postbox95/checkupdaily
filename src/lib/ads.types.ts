/** Ad banner slots available across the public site. */
export const AD_PLACEMENTS = [
  { value: "search_top", label: "Search result page — top" },
  { value: "search_inline", label: "Search result page — between labs" },
  { value: "search_bottom", label: "Search result page — bottom" },
  { value: "home_top", label: "Homepage — under the search hero" },
  { value: "home_bottom", label: "Homepage — bottom" },
  { value: "compare_top", label: "Prescription cart — top" },
  { value: "compare_bottom", label: "Prescription cart — bottom" },
  { value: "chain_top", label: "Lab chain profile — top" },
  { value: "chain_bottom", label: "Lab chain profile — bottom" },
] as const;

export type AdPlacement = (typeof AD_PLACEMENTS)[number]["value"];

export const placementLabel = (value: string) =>
  AD_PLACEMENTS.find((p) => p.value === value)?.label ?? value;

export interface AdBanner {
  id: string;
  placement: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export function adIsLive(ad: AdBanner, now = Date.now()): boolean {
  if (!ad.isActive) return false;
  if (ad.startsAt && new Date(ad.startsAt).getTime() > now) return false;
  if (ad.expiresAt && new Date(ad.expiresAt).getTime() <= now) return false;
  return true;
}
