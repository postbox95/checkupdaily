import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getChainProfile,
  listReviews,
  moderateReview,
  requestReviewOtp,
  submitReview,
} from "./reviews.functions";
import type { AdminReview, ReviewStatus } from "./reviews.types";

export const chainProfileQuery = (slug: string, page: number) =>
  queryOptions({
    queryKey: ["chain", slug, page],
    queryFn: () => getChainProfile({ data: { slug, page } }),
  });

export const adminReviewsQuery = queryOptions({
  queryKey: ["admin", "reviews"],
  queryFn: () => listReviews() as Promise<AdminReview[]>,
});

export function useAdminReviews() {
  return useQuery(adminReviewsQuery);
}

export function useModerateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: ReviewStatus; flaggedReason?: string | null }) =>
      moderateReview({ data: input }),
    onSuccess: () => {
      toast.success("Review updated");
      void qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
      void qc.invalidateQueries({ queryKey: ["chain"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRequestOtp() {
  return useMutation({
    mutationFn: (phone: string) => requestReviewOtp({ data: { phone } }),
    onSuccess: (r) =>
      toast.success(
        r.sent
          ? "Verification code sent by SMS."
          : `SMS is not configured yet — your code is ${r.devCode}`,
      ),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSubmitReview(onDone?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      chainId: string;
      branchId?: string | null;
      phone: string;
      code: string;
      billingId: string;
      rating: number;
      reviewText: string;
      reviewerName: string;
      testName?: string | null;
    }) => submitReview({ data: input }),
    onSuccess: () => {
      toast.success("Thank you — your review is live.");
      void qc.invalidateQueries({ queryKey: ["chain"] });
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
