import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  applyDiscount,
  emptyCatalog,
  type Catalog,
  type ChainTestPrice,
  type DiagnosticCenter,
  type DiscountType,
  type LabChain,
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
const mapChain = (r: any): LabChain => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  logoUrl: r.logo_url ?? "",
  description: r.description ?? "",
  pros: r.pros ?? [],
  cons: r.cons ?? [],
  defaultHomeSampleAvailable: r.default_home_sample_available,
  defaultSampleCollectionFee: r.default_sample_collection_fee,
  defaultOpensAt: (r.default_opens_at ?? "08:00").slice(0, 5),
  defaultClosesAt: (r.default_closes_at ?? "22:00").slice(0, 5),
  defaultIs24Hours: r.default_is_24_hours ?? false,
  defaultClosedDays: (r.default_closed_days ?? []).map(Number),

  isActive: r.is_active,
  sortOrder: r.sort_order,
});

const mapCenter = (r: any): DiagnosticCenter => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  branchName: r.branch_name,
  labChainId: r.lab_chain_id ?? null,
  thana: r.thana,
  city: r.city,
  address: r.address,
  latitude: r.latitude,
  longitude: r.longitude,
  contactPhone: r.contact_phone,
  sampleCollectionFee: r.sample_collection_fee,
  sampleCollectionFeeOverride: r.sample_collection_fee_override ?? null,
  homeSampleAvailable: r.home_sample_available,
  homeSampleOverride: r.home_sample_override ?? null,
  opensAt: (r.opens_at ?? "08:00").slice(0, 5),
  closesAt: (r.closes_at ?? "22:00").slice(0, 5),
  is24Hours: r.is_24_hours ?? false,
  closedDays: (r.closed_days ?? []).map(Number),
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
  consumableFee: r.consumable_fee ?? 0,
  isGovernmentRate: r.is_government_rate ?? false,
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
  discountType: (r.discount_type ?? "none") as DiscountType,
  discountValue: Number(r.discount_value ?? 0),
  notes: r.notes,
  isAvailable: r.is_available,
});

const mapChainPrice = (r: any): ChainTestPrice => ({
  id: r.id,
  labChainId: r.lab_chain_id,
  medicalTestId: r.medical_test_id,
  price: r.price,
  discountType: (r.discount_type ?? "none") as DiscountType,
  discountValue: Number(r.discount_value ?? 0),
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
  const [chains, centers, tests, prices, chainPrices, thanas, settings] = await Promise.all([
    sb.from("lab_chains").select("*").order("sort_order"),
    sb.from("diagnostic_centers").select("*").order("sort_order"),
    sb.from("medical_tests").select("*").order("sort_order"),
    sb.from("test_prices").select("*"),
    sb.from("chain_test_prices").select("*"),
    sb.from("thanas").select("*").order("sort_order"),
    sb.from("site_settings").select("*").eq("key", "general").maybeSingle(),
  ]);

  const keep = <T extends { isActive: boolean }>(rows: T[]) =>
    includeInactive ? rows : rows.filter((r) => r.isActive);

  return {
    chains: keep((chains.data ?? []).map(mapChain)),
    centers: keep((centers.data ?? []).map(mapCenter)),
    tests: keep((tests.data ?? []).map(mapTest)),
    prices: (prices.data ?? []).map(mapPrice),
    chainPrices: (chainPrices.data ?? []).map(mapChainPrice),
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

export type AdminTable =
  | "medical_tests"
  | "diagnostic_centers"
  | "test_prices"
  | "thanas"
  | "lab_chains";

export const saveRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { table: AdminTable; id?: string | null; values: Row }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t: any = context.supabase.from(data.table);
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
  .inputValidator((d: { table: AdminTable; id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from(data.table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export interface PriceInput {
  medicalTestId: string;
  price: number;
  discountType: DiscountType;
  discountValue: number;
  notes?: string | null;
  isAvailable: boolean;
}

/** Saves one or many rows, either on the chain template or as branch overrides. */
export const savePrices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { scope: "chain" | "branch"; targetId: string; rows: PriceInput[] }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!data.rows.length) return { saved: 0 };

    if (data.scope === "chain") {
      const { error } = await context.supabase.from("chain_test_prices").upsert(
        data.rows.map((r) => ({
          lab_chain_id: data.targetId,
          medical_test_id: r.medicalTestId,
          price: r.price,
          discount_type: r.discountType,
          discount_value: r.discountValue,
          notes: r.notes ?? null,
          is_available: r.isAvailable,
        })),
        { onConflict: "lab_chain_id,medical_test_id" },
      );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("test_prices").upsert(
        data.rows.map((r) => ({
          diagnostic_center_id: data.targetId,
          medical_test_id: r.medicalTestId,
          price: r.price,
          discount_type: r.discountType,
          discount_value: r.discountValue,
          discounted_price: applyDiscount(r.price, r.discountType, r.discountValue) || null,
          notes: r.notes ?? null,
          is_available: r.isAvailable,
        })),
        { onConflict: "medical_test_id,diagnostic_center_id" },
      );
      if (error) throw new Error(error.message);
    }
    return { saved: data.rows.length };
  });

/** Removes branch overrides so those tests fall back to the chain template. */
export const resetToChainDefault = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { centerId: string; testIds: string[] }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!data.testIds.length) return { removed: 0 };
    const { error } = await context.supabase
      .from("test_prices")
      .delete()
      .eq("diagnostic_center_id", data.centerId)
      .in("medical_test_id", data.testIds);
    if (error) throw new Error(error.message);
    return { removed: data.testIds.length };
  });

/** Bulk actions on selected tests, at chain-template or branch level. */
export const bulkPriceAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      scope: "chain" | "branch";
      targetId: string;
      testIds: string[];
      action: "adjust" | "discount" | "availability" | "delete";
      percent?: number;
      discountType?: DiscountType;
      discountValue?: number;
      isAvailable?: boolean;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!data.testIds.length) return { affected: 0 };

    const table = data.scope === "chain" ? "chain_test_prices" : "test_prices";
    const keyCol = data.scope === "chain" ? "lab_chain_id" : "diagnostic_center_id";

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const tbl = () => context.supabase.from(table) as any;
    const base = () => tbl().eq(keyCol, data.targetId);

    if (data.action === "delete") {
      const { error } = await tbl()
        .delete()
        .eq(keyCol, data.targetId)
        .in("medical_test_id", data.testIds);

      if (error) throw new Error(error.message);
      return { affected: data.testIds.length };
    }

    if (data.action === "availability") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (context.supabase.from(table) as any)
        .update({ is_available: Boolean(data.isAvailable) })
        .eq(keyCol, data.targetId)
        .in("medical_test_id", data.testIds);
      if (error) throw new Error(error.message);
      return { affected: data.testIds.length };
    }

    if (data.action === "discount") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (context.supabase.from(table) as any)
        .update({
          discount_type: data.discountType ?? "none",
          discount_value: data.discountValue ?? 0,
        })
        .eq(keyCol, data.targetId)
        .in("medical_test_id", data.testIds);
      if (error) throw new Error(error.message);
      return { affected: data.testIds.length };
    }

    // adjust base price by a percentage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows, error } = await (base() as any)
      .select("id, price")
      .in("medical_test_id", data.testIds);
    if (error) throw new Error(error.message);
    const factor = 1 + (data.percent ?? 0) / 100;
    for (const r of rows ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (context.supabase.from(table) as any)
        .update({ price: Math.max(0, Math.round((r.price * factor) / 10) * 10) })
        .eq("id", r.id);
    }
    return { affected: rows?.length ?? 0 };
  });

/** Legacy percent adjust kept for the simple toolbar. */
export const bulkAdjustPrices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { centerId?: string | null; testId?: string | null; percent: number }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase.from("test_prices").select("id, price");
    if (data.centerId) q = q.eq("diagnostic_center_id", data.centerId);
    if (data.testId) q = q.eq("medical_test_id", data.testId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const factor = 1 + data.percent / 100;
    for (const r of rows ?? []) {
      await context.supabase
        .from("test_prices")
        .update({ price: Math.max(0, Math.round((r.price * factor) / 10) * 10) })
        .eq("id", r.id);
    }
    return { updated: rows?.length ?? 0 };
  });

/** "Push to all branches in this chain" — fees and/or the price template. */
export const pushChainToBranches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      chainId: string;
      what: "fee" | "prices" | "both";
      overwriteOverrides: boolean;
      testIds?: string[];
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { data: branches, error: bErr } = await context.supabase
      .from("diagnostic_centers")
      .select("id")
      .eq("lab_chain_id", data.chainId);
    if (bErr) throw new Error(bErr.message);
    const branchIds = (branches ?? []).map((b: { id: string }) => b.id);
    if (!branchIds.length) return { branches: 0, prices: 0 };

    let pricesTouched = 0;

    if (data.what === "fee" || data.what === "both") {
      // Clearing the override puts a branch back on the chain default.
      let q = context.supabase
        .from("diagnostic_centers")
        .update({ sample_collection_fee_override: null, home_sample_override: null })
        .eq("lab_chain_id", data.chainId);
      if (!data.overwriteOverrides) q = q.is("sample_collection_fee_override", null);
      const { error } = await q;
      if (error) throw new Error(error.message);
    }

    if (data.what === "prices" || data.what === "both") {
      if (data.overwriteOverrides) {
        // Every branch goes back to the template.
        let del = context.supabase.from("test_prices").delete().in("diagnostic_center_id", branchIds);
        if (data.testIds?.length) del = del.in("medical_test_id", data.testIds);
        const { error } = await del;
        if (error) throw new Error(error.message);
        pricesTouched = branchIds.length;
      }
      // Branches with no override already follow the template — nothing to write.
    }

    return { branches: branchIds.length, prices: pricesTouched };
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
