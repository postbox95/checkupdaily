import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  emptyCatalog,
  type Catalog,
  type DiagnosticCenter,
  type MedicalTest,
  type SiteSettings,
  type TestPrice,
  type Thana,
} from "@/data/seed";

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
const mapCenter = (r: any): DiagnosticCenter => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  branchName: r.branch_name,
  thana: r.thana,
  city: r.city,
  address: r.address,
  latitude: r.latitude,
  longitude: r.longitude,
  contactPhone: r.contact_phone,
  sampleCollectionFee: r.sample_collection_fee,
  homeSampleAvailable: r.home_sample_available,
  isActive: r.is_active,
  sortOrder: r.sort_order,
});

const mapTest = (r: any): MedicalTest => ({
  id: r.id,
  code: r.code,
  canonicalName: r.canonical_name,
  banglaName: r.bangla_name,
  category: r.category,
  synonyms: r.synonyms ?? [],
  description: r.description ?? "",
  preparationNote: r.preparation_note ?? "",
  fastingRequired: r.fasting_required,
  fastingHours: r.fasting_hours,
  reportDeliveryHrs: r.report_delivery_hrs,
  isPopular: r.is_popular,
  isActive: r.is_active,
  sortOrder: r.sort_order,
});

const mapPrice = (r: any): TestPrice => ({
  id: r.id,
  medicalTestId: r.medical_test_id,
  diagnosticCenterId: r.diagnostic_center_id,
  price: r.price,
  discountedPrice: r.discounted_price,
  notes: r.notes,
  isAvailable: r.is_available,
});

const mapThana = (r: any): Thana => ({
  id: r.id,
  name: r.name,
  latitude: r.latitude,
  longitude: r.longitude,
  sortOrder: r.sort_order,
  isActive: r.is_active,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

async function loadCatalog(includeInactive: boolean): Promise<Catalog> {
  const sb = publicClient();
  const [centers, tests, prices, thanas, settings] = await Promise.all([
    sb.from("diagnostic_centers").select("*").order("sort_order"),
    sb.from("medical_tests").select("*").order("sort_order"),
    sb.from("test_prices").select("*"),
    sb.from("thanas").select("*").order("sort_order"),
    sb.from("site_settings").select("*").eq("key", "general").maybeSingle(),
  ]);

  const keep = <T extends { isActive: boolean }>(rows: T[]) =>
    includeInactive ? rows : rows.filter((r) => r.isActive);

  return {
    centers: keep((centers.data ?? []).map(mapCenter)),
    tests: keep((tests.data ?? []).map(mapTest)),
    prices: (prices.data ?? []).map(mapPrice),
    thanas: keep((thanas.data ?? []).map(mapThana)),
    settings: {
      ...emptyCatalog.settings,
      ...((settings.data?.value as Partial<SiteSettings>) ?? {}),
    },
  };
}

export const getCatalog = createServerFn({ method: "GET" }).handler(() => loadCatalog(false));

export const getAdminCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    return loadCatalog(true);
  });

/* ------------------------------ admin helpers ----------------------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin role required");
}

export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { userId: context.userId as string, isAdmin: Boolean(data) };
  });

/** First signed-in person can claim admin while no administrator exists yet. */
export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("An administrator already exists.");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const syncProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email?: string; fullName?: string }) => d ?? {})
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, email: data.email ?? null, full_name: data.fullName ?? null });
    return { ok: true };
  });

/* ------------------------------- mutations -------------------------------- */

type Row = Record<string, unknown>;

const table = (name: "medical_tests" | "diagnostic_centers" | "test_prices" | "thanas") => name;

export const saveRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      table: "medical_tests" | "diagnostic_centers" | "test_prices" | "thanas";
      id?: string | null;
      values: Row;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t: any = context.supabase.from(table(data.table));
    if (data.id) {
      const { error } = await t.update(data.values).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: inserted, error } = await t.insert(data.values).select("id").single();
    if (error) throw new Error(error.message);
    return { id: inserted.id as string };
  });

export const deleteRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      table: "medical_tests" | "diagnostic_centers" | "test_prices" | "thanas";
      id: string;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from(table(data.table)).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertPrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      medicalTestId: string;
      diagnosticCenterId: string;
      price: number;
      discountedPrice?: number | null;
      notes?: string | null;
      isAvailable: boolean;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("test_prices").upsert(
      {
        medical_test_id: data.medicalTestId,
        diagnostic_center_id: data.diagnosticCenterId,
        price: data.price,
        discounted_price: data.discountedPrice ?? null,
        notes: data.notes ?? null,
        is_available: data.isAvailable,
      },
      { onConflict: "medical_test_id,diagnostic_center_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bulkAdjustPrices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { centerId?: string | null; testId?: string | null; percent: number }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase.from("test_prices").select("id, price, discounted_price");
    if (data.centerId) q = q.eq("diagnostic_center_id", data.centerId);
    if (data.testId) q = q.eq("medical_test_id", data.testId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const factor = 1 + data.percent / 100;
    for (const r of rows ?? []) {
      await context.supabase
        .from("test_prices")
        .update({
          price: Math.max(0, Math.round((r.price * factor) / 10) * 10),
          discounted_price: r.discounted_price
            ? Math.max(0, Math.round((r.discounted_price * factor) / 10) * 10)
            : null,
        })
        .eq("id", r.id);
    }
    return { updated: rows?.length ?? 0 };
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { value: Record<string, unknown> }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("site_settings")
      .upsert(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { key: "general", value: data.value as any },
        { onConflict: "key" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      context.supabase.from("profiles").select("id, email, full_name, created_at"),
      context.supabase.from("user_roles").select("user_id, role"),
    ]);
    return (profiles ?? []).map((p: { id: string; email: string | null; full_name: string | null; created_at: string }) => ({
      id: p.id,
      email: p.email,
      fullName: p.full_name,
      createdAt: p.created_at,
      roles: (roles ?? [])
        .filter((r: { user_id: string }) => r.user_id === p.id)
        .map((r: { role: string }) => r.role),
    }));
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: "admin" | "editor"; grant: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      if (data.userId === context.userId && data.role === "admin")
        throw new Error("You cannot remove your own admin role.");
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
