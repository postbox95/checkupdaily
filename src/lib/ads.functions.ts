import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AdBanner } from "./ads.types";

function publicClient() {
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

/* eslint-disable @typescript-eslint/no-explicit-any */
const mapAd = (r: any): AdBanner => ({
  id: r.id,
  placement: r.placement,
  title: r.title ?? "",
  imageUrl: r.image_url ?? "",
  linkUrl: r.link_url ?? "",
  altText: r.alt_text ?? "",
  startsAt: r.starts_at ?? null,
  expiresAt: r.expires_at ?? null,
  isActive: r.is_active,
  sortOrder: r.sort_order,
  createdAt: r.created_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

async function assertAdmin(context: {
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> };
  userId: string;
}) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin role required");
}

/** Live banners only — the database policy already hides expired/unpublished rows. */
export const getLiveAds = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient()
    .from("ad_banners")
    .select("*")
    .order("sort_order")
    .order("created_at");
  return (data ?? []).map(mapAd);
});

export const getAllAds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ context }: any) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("ad_banners")
      .select("*")
      .order("placement")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapAd);
  });

export interface AdInput {
  placement: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  sortOrder: number;
}

export const saveAd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string | null; values: AdInput }) => d)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data, context }: any) => {
    await assertAdmin(context);
    const v = data.values as AdInput;
    if (!v.imageUrl) throw new Error("A banner image is required.");
    const row = {
      placement: v.placement,
      title: v.title,
      image_url: v.imageUrl,
      link_url: v.linkUrl,
      alt_text: v.altText,
      starts_at: v.startsAt,
      expires_at: v.expiresAt,
      is_active: v.isActive,
      sort_order: v.sortOrder,
    };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { error } = await supabaseAdmin.from("ad_banners").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id as string };
    }
    const { data: inserted, error } = await supabaseAdmin
      .from("ad_banners")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id as string };
  });

export const deleteAd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data, context }: any) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("ad_banners").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Uploads a banner image (base64) and returns the public URL to store on the ad. */
export const uploadAdImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { fileName: string; contentType: string; dataBase64: string }) => d)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data, context }: any) => {
    await assertAdmin(context);
    const bytes = Buffer.from(data.dataBase64, "base64");
    if (bytes.byteLength > 5_000_000) throw new Error("Image is larger than 5 MB.");
    const safe = String(data.fileName).replace(/[^a-zA-Z0-9._-]/g, "-").slice(-60);
    const path = `${Date.now()}-${safe}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("ads")
      .upload(path, bytes, { contentType: data.contentType || "image/png", upsert: true });
    if (error) throw new Error(error.message);
    return { url: `/api/public/ad-image/${path}` };
  });
