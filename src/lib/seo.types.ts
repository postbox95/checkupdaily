/** Reusable SEO data model, shared by every entity type. */

export type SeoEntityType = "global" | "page" | "test" | "center" | "chain" | "category";
export type SeoLang = "en" | "bn";

export interface SeoFaq {
  q: string;
  a: string;
}

/** Page/entity level overrides. Every field is optional — empty falls back. */
export interface SeoFields {
  title?: string;
  metaDescription?: string;
  slug?: string;
  canonicalUrl?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  includeInSitemap?: boolean;
  /* editorial SEO content — complements, never replaces, catalogue data */
  intro?: string;
  about?: string;
  howItWorks?: string;
  preparation?: string;
  whyPricesDiffer?: string;
  faqs?: SeoFaq[];
  updatedAt?: string;
}

export interface GlobalSeo {
  siteName: string;
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultCanonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  faviconUrl: string;
  defaultLang: SeoLang;
  supportedLanguages: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  twitterCard: string;
  orgEmail: string;
  orgPhone: string;
  orgAddress: string;
  orgLogo: string;
  /** one social profile URL per line */
  socialProfiles: string;
}

export const DEFAULT_GLOBAL_SEO: GlobalSeo = {
  siteName: "MyTestReport",
  siteUrl: "https://med-compare-bd.lovable.app",
  defaultTitle: "Diagnostic Test Prices in Bangladesh | MyTestReport",
  defaultDescription:
    "Compare diagnostic test prices across Bangladesh. Find lab-wise test costs, collection charges, preparation details and nearby diagnostic centres.",
  defaultCanonical: "",
  ogTitle: "Diagnostic Test Prices in Bangladesh | MyTestReport",
  ogDescription:
    "Compare lab-wise diagnostic test prices, collection charges and preparation details across Bangladesh.",
  ogImage: "",
  faviconUrl: "/favicon.ico",
  defaultLang: "en",
  supportedLanguages: "en, bn",
  robotsIndex: true,
  robotsFollow: true,
  twitterCard: "summary_large_image",
  orgEmail: "",
  orgPhone: "",
  orgAddress: "",
  orgLogo: "",
  socialProfiles: "",
};

export interface SeoRecord {
  id: string;
  entityType: SeoEntityType;
  entityKey: string;
  lang: SeoLang;
  data: SeoFields;
  updatedAt: string;
}

export interface SeoRedirect {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
  isActive: boolean;
  createdAt: string;
}

export interface PageSeo {
  global: GlobalSeo;
  seo: SeoFields | null;
}
