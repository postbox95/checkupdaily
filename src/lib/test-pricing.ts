type MedicalTestPricingFields = {
  category?: unknown;
  consumable_fee?: unknown;
  is_government_rate?: unknown;
};

/** Enforce the site's test fee and government-rate rules whenever tests are saved. */
export function normalizeMedicalTestPricing<T extends MedicalTestPricingFields>(values: T) {
  const fee = Number(values.consumable_fee ?? 0);

  return {
    ...values,
    consumable_fee:
      values.category === "PATHOLOGY" && Number.isFinite(fee) ? fee : 0,
    is_government_rate: false,
  };
}