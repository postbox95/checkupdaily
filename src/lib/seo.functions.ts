import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { GlobalSeo, SeoEntityType, SeoFields, SeoLang } from "./seo.types";
import {
  assertAdminCtx,
  loadRedirects,
  loadSeoBundle,
  loadSeoRecords,
  normalisePath,
} from "./seo.server";

export const getSeoBundle = createServerFn({ method: "GET" }).handler(() => loadSeoBundle());

export const listSeoRecords = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminCtx(context);
    return loadSeoRecords();
  });

export const saveSeoRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      entityType: SeoEntityType;
      entityKey: string;
      lang: SeoLang;
      data: SeoFields | Partial<GlobalSeo>;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdminCtx(context);
    const { error } = await context.supabase.from("seo_meta").upsert(
      {
        entity_type: data.entityType,
        entity_key: data.entityKey ?? "",
        lang: data.lang ?? "en",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { ...data.data, updatedAt: new Date().toISOString() } as any,
      },
      { onConflict: "entity_type,entity_key,lang" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSeoRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdminCtx(context);
    const { error } = await context.supabase.from("seo_meta").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSeoRedirects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminCtx(context);
    return loadRedirects(false);
  });

export const saveSeoRedirect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id?: string;
      fromPath: string;
      toPath: string;
      statusCode: number;
      isActive: boolean;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdminCtx(context);
    const from = normalisePath(data.fromPath);
    const to = /^https?:\/\//i.test(data.toPath) ? data.toPath.trim() : normalisePath(data.toPath);
    if (from === to) throw new Error("Source and destination cannot be the same path.");
    const row = {
      from_path: from,
      to_path: to,
      status_code: data.statusCode === 302 ? 302 : 301,
      is_active: data.isActive,
    };
    const q = data.id
      ? context.supabase.from("seo_redirects").update(row).eq("id", data.id)
      : context.supabase.from("seo_redirects").insert(row);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSeoRedirect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdminCtx(context);
    const { error } = await context.supabase.from("seo_redirects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Public lookup used by the catch-all route to honour 301/302 redirects. */
export const resolveRedirect = createServerFn({ method: "GET" })
  .inputValidator((d: { path: string }) => d)
  .handler(async ({ data }) => {
    const from = normalisePath(data.path);
    const match = (await loadRedirects(true)).find((r) => normalisePath(r.fromPath) === from);
    return match ? { to: match.toPath, statusCode: match.statusCode } : null;
  });
