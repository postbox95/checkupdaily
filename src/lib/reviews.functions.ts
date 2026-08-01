import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ReviewStatus } from "./reviews.types";

export const getChainProfile = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string; page?: number }) => d)
  .handler(async ({ data }) => {
    const { fetchChainProfile } = await import("./reviews.server");
    return fetchChainProfile(data.slug, Math.max(1, Math.floor(data.page ?? 1)));
  });

export const requestReviewOtp = createServerFn({ method: "POST" })
  .inputValidator((d: { phone: string }) => d)
  .handler(async ({ data }) => {
    const { issueOtp } = await import("./reviews.server");
    return issueOtp(data.phone);
  });

export const submitReview = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      chainId: string;
      branchId?: string | null;
      phone: string;
      code: string;
      billingId: string;
      rating: number;
      reviewText: string;
      reviewerName: string;
      testName?: string | null;
    }) => d,
  )
  .handler(async ({ data }) => {
    const { submitReviewRecord } = await import("./reviews.server");
    return submitReviewRecord(data);
  });

export const listReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { fetchAdminReviews } = await import("./reviews.server");
    return fetchAdminReviews(context.supabase);
  });

export const moderateReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: ReviewStatus; flaggedReason?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { moderateReviewRecord } = await import("./reviews.server");
    return moderateReviewRecord(context.supabase, data);
  });
