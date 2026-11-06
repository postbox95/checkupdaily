type MedicalTestPricingFields = {
  category?: unknown;
  consumable_fee?: unknown;
};

/** Enforce the site-wide test fee rules whenever an admin saves a test. */
export function normalizeMedicalTestPricing<T extends MedicalTestPricingFields>(values: T) {
  const fee = Number(values.consumable_fee ?? 0);

  return {
    ...values,
    consumable_fee:
      values.category === "PATHOLOGY" && Number.isFinite(fee) ? fee : 0,
  };
}