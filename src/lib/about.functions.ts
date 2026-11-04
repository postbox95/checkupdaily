import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEFAULT_ABOUT, type AboutContent } from "./about";

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

export const ABOUT_SETTINGS_KEY = "about";

/** Public read of the editable About page content; falls back to defaults. */
export const getAboutContent = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient()
    .from("site_settings")
    .select("value")
    .eq("key", ABOUT_SETTINGS_KEY)
    .maybeSingle();
  return { ...DEFAULT_ABOUT, ...((data?.value as Partial<AboutContent>) ?? {}) };
});

export const saveAboutContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { value: AboutContent }) => d)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data, context }: any) => {
    const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error || !isAdmin) throw new Error("Forbidden: admin role required");
    // The settings write policy is admin-only, so the user-scoped client is enough.
    const { error: upErr } = await context.supabase
      .from("site_settings")
      .upsert(
        { key: ABOUT_SETTINGS_KEY, value: data.value },
        { onConflict: "key" },
      );
    if (upErr) throw new Error(upErr.message);
    return { ok: true };
  });

/** Uploads the founder (or any About) image (base64) and returns its URL. */
export const uploadAboutImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { fileName: string; contentType: string; dataBase64: string }) => d)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data, context }: any) => {
    const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error || !isAdmin) throw new Error("Forbidden: admin role required");
    const bytes = Buffer.from(data.dataBase64, "base64");
    if (bytes.byteLength > 5_000_000) throw new Error("Image is larger than 5 MB.");
    const safe = String(data.fileName).replace(/[^a-zA-Z0-9._-]/g, "-").slice(-60);
    const path = `content/${Date.now()}-${safe}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: upErr } = await supabaseAdmin.storage
      .from("ads")
      .upload(path, bytes, { contentType: data.contentType || "image/png", upsert: true });
    if (upErr) throw new Error(upErr.message);
    // Served publicly through the existing image proxy route.
    return { url: `/api/public/ad-image/${path}` };
  });
