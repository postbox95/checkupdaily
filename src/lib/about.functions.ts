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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ context }: any) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error || !data) throw new Error("Forbidden: admin role required");
    const value = (arguments_0 ?? null) as never; // placeholder replaced below
    return { value };
  });
