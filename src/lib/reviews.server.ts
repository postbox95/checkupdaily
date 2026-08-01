// Server-only review logic: OTP issuing/verification and review reads/writes.
import { createClient } from "@supabase/supabase-js";
import { createHash, randomInt, timingSafeEqual } from "crypto";
import type { Database } from "@/integrations/supabase/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  maskPhone,
  normalizeBdPhone,
  REVIEW_PAGE_SIZE,
  type ChainProfile,
  type PublicReview,
  type RatingSummary,
  type ReviewStatus,
} from "./reviews.types";

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

const hash = (phone: string, code: string) =>
  createHash("sha256").update(`${phone}:${code}`).digest("hex");

const OTP_TTL_MS = 5 * 60 * 1000;

/* ------------------------------- OTP handling ------------------------------ */

export async function issueOtp(rawPhone: string) {
  const phone = normalizeBdPhone(rawPhone);
  if (!phone) throw new Error("Enter a valid Bangladeshi mobile number (e.g. 01712345678).");

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("phone_otps")
    .select("id", { count: "exact", head: true })
    .eq("phone_number", phone)
    .gte("created_at", since);
  if ((count ?? 0) >= 5)
    throw new Error("Too many verification codes requested. Please try again later.");

  const code = String(randomInt(100000, 999999));
  const { error } = await supabaseAdmin.from("phone_otps").insert({
    phone_number: phone,
    code_hash: hash(phone, code),
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
  });
  if (error) throw new Error(error.message);

  const sent = await sendSms(phone, `Your Niramoy Prices verification code is ${code}`);
  // Without an SMS provider configured we surface the code so the flow stays usable.
  return { phone, sent, devCode: sent ? null : code };
}

async function sendSms(phone: string, body: string) {
  const gatewayKey = process.env.LOVABLE_API_KEY;
  const twilioKey = process.env.TWILIO_API_KEY;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!gatewayKey || !twilioKey || !from) return false;
  try {
    const res = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gatewayKey}`,
        "X-Connection-Api-Key": twilioKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: `+88${phone}`, From: from, Body: body }),
    });
    if (!res.ok) {
      console.error(`[sms] gateway failed [${res.status}]: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[sms] send failed", e);
    return false;
  }
}

async function consumeOtp(phone: string, code: string) {
  const { data, error } = await supabaseAdmin
    .from("phone_otps")
    .select("id, code_hash, attempts, expires_at, consumed_at")
    .eq("phone_number", phone)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Request a new verification code.");
  if (new Date(data.expires_at).getTime() < Date.now())
    throw new Error("That code has expired — request a new one.");
  if (data.attempts >= 5) throw new Error("Too many wrong attempts. Request a new code.");

  const expected = Buffer.from(data.code_hash);
  const given = Buffer.from(hash(phone, code.trim()));
  const ok = expected.length === given.length && timingSafeEqual(expected, given);
  if (!ok) {
    await supabaseAdmin
      .from("phone_otps")
      .update({ attempts: data.attempts + 1 })
      .eq("id", data.id);
    throw new Error("That code is not correct.");
  }
  await supabaseAdmin
    .from("phone_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", data.id);
}

/* ----------------------------- review submission ---------------------------- */

export interface ReviewSubmission {
  chainId: string;
  branchId?: string | null;
  phone: string;
  code: string;
  billingId: string;
  rating: number;
  reviewText: string;
  reviewerName: string;
  testName?: string | null;
}

export async function submitReviewRecord(input: ReviewSubmission) {
  const phone = normalizeBdPhone(input.phone);
  if (!phone) throw new Error("Enter a valid Bangladeshi mobile number.");
  const billingId = input.billingId.trim();
  const text = input.reviewText.trim();
  const name = input.reviewerName.trim();
  if (!billingId) throw new Error("Enter the billing / invoice ID from your test receipt.");
  if (!name) throw new Error("Enter your name.");
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5)
    throw new Error("Give a rating between 1 and 5 stars.");
  if (text.length < 30) throw new Error("Please write at least 30 characters about your visit.");
  if (text.length > 2000) throw new Error("Please keep your review under 2000 characters.");
  if (name.length > 80) throw new Error("Please use a shorter name.");
  if (billingId.length > 60) throw new Error("That billing ID looks too long.");

  await consumeOtp(phone, input.code);

  const { data: existing } = await supabaseAdmin
    .from("reviews")
    .select("id")
    .eq("lab_chain_id", input.chainId)
    .eq("phone_number", phone)
    .eq("billing_id", billingId)
    .maybeSingle();
  if (existing) throw new Error("A review for this billing ID and phone number already exists.");

  const { error } = await supabaseAdmin.from("reviews").insert({
    lab_chain_id: input.chainId,
    diagnostic_center_id: input.branchId || null,
    reviewer_name: name,
    phone_number: phone,
    phone_verified_at: new Date().toISOString(),
    billing_id: billingId,
    rating: input.rating,
    review_text: text,
    test_name: input.testName?.trim() || null,
    status: "published",
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}

/* -------------------------------- public read ------------------------------- */

function summarize(rows: { rating: number }[]): RatingSummary {
  const breakdown = [0, 0, 0, 0, 0];
  for (const r of rows) breakdown[Math.min(4, Math.max(0, r.rating - 1))] += 1;
  const total = rows.length;
  const average = total ? rows.reduce((s, r) => s + r.rating, 0) / total : 0;
  return { average: Math.round(average * 10) / 10, total, breakdown };
}

export async function fetchChainProfile(slug: string, page: number): Promise<ChainProfile | null> {
  const sb = publicClient();
  const { data: chain } = await sb
    .from("lab_chains")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!chain) return null;

  const [{ data: branches }, { data: all }] = await Promise.all([
    sb
      .from("diagnostic_centers")
      .select("*")
      .eq("lab_chain_id", chain.id)
      .eq("is_active", true)
      .order("sort_order"),
    sb
      .from("reviews")
      .select("id, rating, review_text, reviewer_name, phone_number, test_name, created_at, diagnostic_center_id")
      .eq("lab_chain_id", chain.id)
      .eq("status", "published")
      .order("created_at", { ascending: false }),
  ]);

  const centerLabel = new Map(
    (branches ?? []).map((b) => [b.id, (b.branch_name ?? "").trim() || b.thana]),
  );
  const rows = all ?? [];
  const start = (page - 1) * REVIEW_PAGE_SIZE;
  const reviews: PublicReview[] = rows.slice(start, start + REVIEW_PAGE_SIZE).map((r) => ({
    id: r.id,
    rating: r.rating,
    reviewText: r.review_text,
    reviewerName: r.reviewer_name || "Verified visitor",
    maskedPhone: maskPhone(r.phone_number),
    testName: r.test_name,
    branchName: r.diagnostic_center_id
      ? (centerLabel.get(r.diagnostic_center_id) ?? null)
      : null,
    createdAt: r.created_at,
  }));

  return {
    chain: {
      id: chain.id,
      slug: chain.slug,
      name: chain.name,
      logoUrl: chain.logo_url ?? "",
      description: chain.description ?? "",
      pros: chain.pros ?? [],
      cons: chain.cons ?? [],
    },
    branches: (branches ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      branchName: b.branch_name,
      thana: b.thana,
      city: b.city,
      address: b.address,
      contactPhone: b.contact_phone,
      latitude: b.latitude,
      longitude: b.longitude,
    })),
    areas: [...new Set((branches ?? []).map((b) => b.thana).filter(Boolean))],
    summary: summarize(rows),
    reviews,
    page,
    pageSize: REVIEW_PAGE_SIZE,
  };
}

/* ------------------------------ admin moderation ---------------------------- */

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function fetchAdminReviews(sb: any) {
  const [{ data: reviews, error }, { data: chains }, { data: centers }] = await Promise.all([
    sb.from("reviews").select("*").order("created_at", { ascending: false }),
    sb.from("lab_chains").select("id, name"),
    sb.from("diagnostic_centers").select("id, branch_name, thana"),
  ]);
  if (error) throw new Error(error.message);
  const chainName = new Map((chains ?? []).map((c: any) => [c.id, c.name as string]));
  const branchLabel = new Map(
    (centers ?? []).map((c: any) => [c.id, `${c.branch_name || c.thana}` as string]),
  );
  return (reviews ?? []).map((r: any) => ({
    id: r.id,
    chainId: r.lab_chain_id,
    chainName: chainName.get(r.lab_chain_id) ?? "—",
    branchLabel: r.diagnostic_center_id ? (branchLabel.get(r.diagnostic_center_id) ?? null) : null,
    rating: r.rating,
    maskedPhone: maskPhone(r.phone_number),
    billingId: r.billing_id,
    reviewText: r.review_text,
    reviewerName: r.reviewer_name,
    testName: r.test_name,
    status: r.status as ReviewStatus,
    flaggedReason: r.flagged_reason,
    phoneVerifiedAt: r.phone_verified_at,
    createdAt: r.created_at,
  }));
}

export async function moderateReviewRecord(
  sb: any,
  input: { id: string; status: ReviewStatus; flaggedReason?: string | null },
) {
  if (input.status === "flagged" && !input.flaggedReason?.trim())
    throw new Error("A short reason is required when flagging a review.");
  const { error } = await sb
    .from("reviews")
    .update({
      status: input.status,
      flagged_reason: input.status === "flagged" ? input.flaggedReason!.trim() : null,
    })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  return { ok: true };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
