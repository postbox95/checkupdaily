import { describe, expect, test } from "bun:test";
import { normalizeMedicalTestPricing } from "../src/lib/test-pricing";

describe("test pricing rules", () => {
  test("keeps a needle and tools fee for pathology tests", () => {
    const saved = normalizeMedicalTestPricing({
      category: "PATHOLOGY",
      consumable_fee: 25,
      is_government_rate: false,
    });

    expect(saved.consumable_fee).toBe(25);
  });

  test("removes the needle and tools fee from radiology tests", () => {
    const saved = normalizeMedicalTestPricing({
      category: "RADIOLOGY",
      consumable_fee: 25,
      is_government_rate: false,
    });

    expect(saved.consumable_fee).toBe(0);
  });

  test("always turns off government-rate status", () => {
    const saved = normalizeMedicalTestPricing({
      category: "PATHOLOGY",
      consumable_fee: 0,
      is_government_rate: true,
    });

    expect(saved.is_government_rate).toBe(false);
  });
});