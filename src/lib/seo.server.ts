import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  DEFAULT_GLOBAL_SEO,
  type GlobalSeo,
  type SeoEntityType,
  type SeoFields,
  type SeoLang,
  type SeoRecord,
  type SeoRedirect,
} from "./seo.types";

export function publicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const seoKey = (entityType: string, entityKey: string, lang: string) =>
  `${entityType}:${entityKey}:${lang}`;

export interface SeoBundle {
  global: GlobalSeo;
  /** keyed by `${entityType}:${entityKey}:${lang}` */
  records: Record<string, SeoFields>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const mapRecord = (r: any): SeoRecord => ({
  id: r.id,
  entityType: r.entity_type as SeoEntityType,
  entityKey: r.entity_key ?? "",
  lang: (r.lang ?? "en") as SeoLang,
  data: (r.data ?? {}) as SeoFields,
  updatedAt: r.updated_at,
});

const mapRedirect = (r: any): SeoRedirect => ({
  id: r.id,
  fromPath: r.from_path,
  toPath: r.to_path,
  statusCode: r.status_code,
  isActive: r.is_active,
  createdAt: r.created_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function loadSeoBundle(): Promise<SeoBundle> {
  const sb = publicClient();
  const { data } = await sb.from("seo_meta").select("*");
  const rows = (data ?? []).map(mapRecord);
  const globalRow = rows.find((r) => r.entityType === "global");
  const records: Record<string, SeoFields> = {};
  for (const r of rows) {
    if (r.entityType === "global") continue;
    records[seoKey(r.entityType, r.entityKey, r.lang)] = r.data;
  }
  return {
    global: { ...DEFAULT_GLOBAL_SEO, ...((globalRow?.data ?? {}) as Partial<GlobalSeo>) },
    records,
  };
}

export async function loadSeoRecords(): Promise<SeoRecord[]> {
  const sb = publicClient();
  const { data } = await sb.from("seo_meta").select("*").order("entity_type");
  return (data ?? []).map(mapRecord);
}

export async function loadRedirects(activeOnly: boolean): Promise<SeoRedirect[]> {
  const sb = publicClient();
  let q = sb.from("seo_redirects").select("*").order("created_at", { ascending: false });
  if (activeOnly) q = q.eq("is_active", true);
  const { data } = await q;
  return (data ?? []).map(mapRedirect);
}

export const normalisePath = (p: string) => {
  const clean = `/${String(p || "").trim().replace(/^\/+/, "")}`.split("?")[0].split("#")[0];
  return clean.length > 1 ? clean.replace(/\/+$/, "") : "/";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function assertAdminCtx(context: any) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin role required");
}
