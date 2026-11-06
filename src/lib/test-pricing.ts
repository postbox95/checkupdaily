type MedicalTestPricingFields = {
  category?: unknown;
  consumable_fee?: unknown;
};

/** Prevent needle/tube charges from being saved for non-pathology tests. */
export function normalizeMedicalTestPricing<T extends MedicalTestPricingFields>(values: T) {
  const fee = Number(values.consumable_fee ?? 0);

  return {
    ...values,
    consumable_fee:
      values.category === "PATHOLOGY" && Number.isFinite(fee) ? fee : 0,
  };
}