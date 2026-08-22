import { DEFAULT_GLOBAL_SEO, type GlobalSeo, type SeoFaq, type SeoFields } from "./seo.types";

/* ------------------------------ url helpers ------------------------------- */

export const siteBase = (g: GlobalSeo) =>
  (g.siteUrl || DEFAULT_GLOBAL_SEO.siteUrl).replace(/\/+$/, "");

/** Absolute, query-free URL for a public path. */
export const absUrl = (g: GlobalSeo, path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  const clean = `/${String(path || "/").replace(/^\/+/, "")}`.split("?")[0].split("#")[0];
  return `${siteBase(g)}${clean === "/" ? "/" : clean.replace(/\/$/, "")}`;
};

export const robotsContent = (index: boolean, follow: boolean) =>
  `${index ? "index" : "noindex"}, ${follow ? "follow" : "nofollow"}`;

export const trim = (v?: string | null) => (typeof v === "string" ? v.trim() : "");

/* --------------------------- fallback generators --------------------------- */

export const testTitleFallback = (testName: string, g: GlobalSeo) =>
  `${testName} Price in Dhaka | Compare Lab Costs | ${g.siteName}`;

export const labTitleFallback = (name: string, branch: string, g: GlobalSeo) =>
  `${name}${branch ? ` ${branch}` : ""} | Test Prices & Location | ${g.siteName}`;

export const categoryTitleFallback = (category: string, g: GlobalSeo) =>
  `${category} Test Prices in Bangladesh | ${g.siteName}`;

/** Descriptions are built only from verified catalogue facts — no claims, no fake prices. */
export function testDescriptionFallback(input: {
  testName: string;
  banglaName?: string;
  labCount: number;
  fastingRequired: boolean;
  reportHrs?: number;
}) {
  const bits = [
    `Compare ${input.testName} prices across ${input.labCount} diagnostic centre${
      input.labCount === 1 ? "" : "s"
    } in Dhaka, including needle, tube and registration charges.`,
  ];
  bits.push(input.fastingRequired ? "Fasting is required for this test." : "No fasting required.");
  if (input.reportHrs) bits.push(`Report in about ${input.reportHrs} hours.`);
  return bits.join(" ").slice(0, 300);
}

export function labDescriptionFallback(input: {
  name: string;
  branch: string;
  thana: string;
  city: string;
  testCount: number;
}) {
  return `${input.name}${input.branch ? `, ${input.branch}` : ""} in ${input.thana}, ${
    input.city
  }: address, opening hours, contact details and prices for ${input.testCount} diagnostic tests.`;
}

export function categoryDescriptionFallback(category: string, count: number) {
  return `Browse ${count} ${category.toLowerCase()} test${
    count === 1 ? "" : "s"
  } with lab-wise prices in Dhaka, preparation details and nearby diagnostic centres.`;
}

/* ------------------------------- head builder ------------------------------ */

export interface HeadTag {
  [key: string]: string | undefined;
}

export interface BuildHeadInput {
  global: GlobalSeo;
  seo?: SeoFields | null;
  /** Canonical path of this page, without query strings. */
  path: string;
  fallbackTitle: string;
  fallbackDescription: string;
  /** Page image (absolute or site-relative) used when no OG override exists. */
  image?: string;
  /** Search results, filter/sort views, cart, admin — never indexable. */
  forceNoindex?: boolean;
  jsonLd?: unknown[];
}

export function buildHead(input: BuildHeadInput) {
  const g = input.global;
  const s = input.seo ?? {};

  const title = trim(s.title) || input.fallbackTitle || g.defaultTitle;
  const description = trim(s.metaDescription) || input.fallbackDescription || g.defaultDescription;
  const canonical = trim(s.canonicalUrl)
    ? absUrl(g, trim(s.canonicalUrl))
    : absUrl(g, input.path);

  const index = input.forceNoindex ? false : (s.robotsIndex ?? g.robotsIndex);
  const follow = s.robotsFollow ?? g.robotsFollow;

  const image = trim(s.ogImage) || trim(input.image) || trim(g.ogImage);
  const absImage = image ? absUrl(g, image) : "";
  const twImage = trim(s.twitterImage) || absImage;

  const meta: HeadTag[] = [
    { title },
    { name: "description", content: description },
    { name: "robots", content: robotsContent(index, follow) },
    { property: "og:site_name", content: g.siteName },
    { property: "og:title", content: trim(s.ogTitle) || title },
    { property: "og:description", content: trim(s.ogDescription) || description },
    { property: "og:url", content: canonical },
    { name: "twitter:card", content: trim(s.twitterCard) || g.twitterCard || "summary_large_image" },
    { name: "twitter:title", content: trim(s.twitterTitle) || trim(s.ogTitle) || title },
    {
      name: "twitter:description",
      content: trim(s.twitterDescription) || trim(s.ogDescription) || description,
    },
  ];
  if (absImage) meta.push({ property: "og:image", content: absImage });
  if (twImage) meta.push({ name: "twitter:image", content: absUrl(g, twImage) });

  const scripts = (input.jsonLd ?? [])
    .filter(Boolean)
    .map((node) => ({ type: "application/ld+json", children: JSON.stringify(node) }));

  return {
    meta,
    links: [{ rel: "canonical", href: canonical }],
    scripts,
  };
}

/* ----------------------------- structured data ----------------------------- */

export function organizationSchema(g: GlobalSeo) {
  const socials = g.socialProfiles
    .split(/[\n,]/)
    .map((v) => v.trim())
    .filter(Boolean);
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: g.siteName,
    url: siteBase(g),
  };
  if (g.orgLogo) node.logo = absUrl(g, g.orgLogo);
  if (socials.length) node.sameAs = socials;
  if (g.orgEmail || g.orgPhone) {
    node.contactPoint = [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        ...(g.orgEmail ? { email: g.orgEmail } : {}),
        ...(g.orgPhone ? { telephone: g.orgPhone } : {}),
      },
    ];
  }
  if (g.orgAddress) node.address = { "@type": "PostalAddress", streetAddress: g.orgAddress };
  return node;
}

export function websiteSchema(g: GlobalSeo) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: g.siteName,
    url: siteBase(g),
  };
}

export function breadcrumbSchema(g: GlobalSeo, items: { name: string; path?: string }[]) {
  if (items.length < 2) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      ...(it.path ? { item: absUrl(g, it.path) } : {}),
    })),
  };
}

export function faqSchema(faqs: SeoFaq[] | undefined) {
  const clean = (faqs ?? []).filter((f) => trim(f.q) && trim(f.a));
  if (!clean.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: clean.map((f) => ({
      "@type": "Question",
      name: f.q.trim(),
      acceptedAnswer: { "@type": "Answer", text: f.a.trim() },
    })),
  };
}

export interface BranchSchemaInput {
  name: string;
  branchName?: string;
  address?: string;
  thana?: string;
  city?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  url: string;
  logo?: string;
  is24Hours?: boolean;
  opensAt?: string;
  closesAt?: string;
  closedDays?: number[];
}

const DAY_URI = [
  "https://schema.org/Sunday",
  "https://schema.org/Monday",
  "https://schema.org/Tuesday",
  "https://schema.org/Wednesday",
  "https://schema.org/Thursday",
  "https://schema.org/Friday",
  "https://schema.org/Saturday",
];

/** MedicalClinic/Diagnostic lab — only fields that actually exist are emitted. */
export function localBusinessSchema(g: GlobalSeo, b: BranchSchemaInput) {
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: b.branchName ? `${b.name} — ${b.branchName}` : b.name,
    url: absUrl(g, b.url),
  };
  if (b.address || b.thana || b.city) {
    node.address = {
      "@type": "PostalAddress",
      ...(b.address ? { streetAddress: b.address } : {}),
      ...(b.thana ? { addressLocality: b.thana } : {}),
      ...(b.city ? { addressRegion: b.city } : {}),
      addressCountry: "BD",
    };
  }
  if (b.phone) node.telephone = b.phone;
  if (typeof b.latitude === "number" && typeof b.longitude === "number")
    node.geo = { "@type": "GeoCoordinates", latitude: b.latitude, longitude: b.longitude };
  if (b.logo) node.image = absUrl(g, b.logo);

  const closed = new Set(b.closedDays ?? []);
  const open = DAY_URI.filter((_, i) => !closed.has(i));
  if (open.length) {
    node.openingHoursSpecification = [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: open,
        opens: b.is24Hours ? "00:00" : (b.opensAt ?? "08:00"),
        closes: b.is24Hours ? "23:59" : (b.closesAt ?? "22:00"),
      },
    ];
  }
  return node;
}
