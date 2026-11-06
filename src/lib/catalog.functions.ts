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
import { normalizeMedicalTestPricing } from "@/lib/test-pricing";

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

/** The database returns at most 1000 rows per request, so page through everything. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAll(make: () => any): Promise<{ data: any[] }> {
  const out: unknown[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await make().range(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return { data: out };
}

async function loadCatalog(includeInactive: boolean): Promise<Catalog> {
  const sb = publicClient();
  const [chains, centers, tests, prices, chainPrices, thanas, settings] = await Promise.all([
    fetchAll(() => sb.from("lab_chains").select("*").order("sort_order").order("id")),
    fetchAll(() => sb.from("diagnostic_centers").select("*").order("sort_order").order("id")),
    fetchAll(() => sb.from("medical_tests").select("*").order("sort_order").order("id")),
    fetchAll(() => sb.from("test_prices").select("*").order("id")),
    fetchAll(() => sb.from("chain_test_prices").select("*").order("id")),
    fetchAll(() => sb.from("thanas").select("*").order("sort_order").order("id")),
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
    const values =
      data.table === "medical_tests"
        ? normalizeMedicalTestPricing(data.values)
        : data.values;
    if (data.id) {
      const { error } = await t.update(values).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: inserted, error } = await t.insert(values).select("id").single();
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
    const ids = Array.from(new Set(data.testIds));
    if (!ids.length) return { affected: 0 };

    const isChain = data.scope === "chain";
    const table = isChain ? "chain_test_prices" : "test_prices";
    const keyCol = isChain ? "lab_chain_id" : "diagnostic_center_id";
    const conflict = isChain ? "lab_chain_id,medical_test_id" : "medical_test_id,diagnostic_center_id";
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const sb = context.supabase as any;
    // Large .in() lists overflow the request URL, so work in chunks.
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 150) chunks.push(ids.slice(i, i + 150));

    if (data.action === "delete") {
      let affected = 0;
      for (const c of chunks) {
        const { data: del, error } = await sb.from(table).delete()
          .eq(keyCol, data.targetId).in("medical_test_id", c).select("id");
        if (error) throw new Error(error.message);
        affected += del?.length ?? 0;
      }
      return { affected };
    }

    // Load current rows; for a branch, fall back to the chain template so that
    // inherited prices become branch overrides instead of being silently skipped.
    type Row = { medical_test_id: string; price: number; discount_type: string; discount_value: number; notes: string | null; is_available: boolean };
    const rows = new Map<string, Row>();
    let chainId: string | null = null;
    if (!isChain) {
      const { data: c } = await sb.from("diagnostic_centers").select("lab_chain_id").eq("id", data.targetId).maybeSingle();
      chainId = c?.lab_chain_id ?? null;
    }
    const cols = "medical_test_id, price, discount_type, discount_value, notes, is_available";
    for (const c of chunks) {
      if (chainId) {
        const { data: tmpl, error } = await sb.from("chain_test_prices").select(cols)
          .eq("lab_chain_id", chainId).in("medical_test_id", c);
        if (error) throw new Error(error.message);
        for (const r of tmpl ?? []) rows.set(r.medical_test_id, r);
      }
      const { data: own, error } = await sb.from(table).select(cols)
        .eq(keyCol, data.targetId).in("medical_test_id", c);
      if (error) throw new Error(error.message);
      for (const r of own ?? []) rows.set(r.medical_test_id, r);
    }

    // "Mark offered/not offered" should also work for tests with no price yet.
    if (data.action === "availability") {
      for (const id of ids)
        if (!rows.has(id))
          rows.set(id, { medical_test_id: id, price: 0, discount_type: "none", discount_value: 0, notes: null, is_available: false });
    }

    const factor = 1 + (data.percent ?? 0) / 100;
    const out = [...rows.values()].map((r) => {
      const next: any = {
        [keyCol]: data.targetId,
        medical_test_id: r.medical_test_id,
        price: r.price,
        discount_type: r.discount_type,
        discount_value: r.discount_value,
        notes: r.notes,
        is_available: r.is_available,
      };
      if (data.action === "availability") next.is_available = Boolean(data.isAvailable);
      if (data.action === "discount") {
        next.discount_type = data.discountType ?? "none";
        next.discount_value = next.discount_type === "none" ? 0 : data.discountValue ?? 0;
      }
      if (data.action === "adjust") next.price = Math.max(0, Math.round((r.price * factor) / 10) * 10);
      return next;
    });

    for (let i = 0; i < out.length; i += 200) {
      const { error } = await sb.from(table).upsert(out.slice(i, i + 200), { onConflict: conflict });
      if (error) throw new Error(error.message);
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
    return { affected: out.length };
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
      what: "fee" | "prices" | "both" | "hours";
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

    if (data.what === "hours") {
      const { data: chain, error: cErr } = await context.supabase
        .from("lab_chains")
        .select("default_opens_at, default_closes_at, default_is_24_hours, default_closed_days")
        .eq("id", data.chainId)
        .maybeSingle();
      if (cErr) throw new Error(cErr.message);
      if (!chain) throw new Error("Chain not found");
      const { error } = await context.supabase
        .from("diagnostic_centers")
        .update({
          opens_at: chain.default_opens_at,
          closes_at: chain.default_closes_at,
          is_24_hours: chain.default_is_24_hours,
          closed_days: chain.default_closed_days,
        })
        .eq("lab_chain_id", data.chainId);
      if (error) throw new Error(error.message);
      return { branches: branchIds.length, prices: 0 };
    }

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
