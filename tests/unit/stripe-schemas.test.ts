import { describe, it, expect } from "vitest";
import {
  createCheckoutSchema,
  billingPortalSchema,
  PLAN_FEATURES,
  PLAN_IDS,
} from "../../packages/shared/src/stripe";
import { PLANS } from "../../packages/shared/src/constants";

describe("createCheckoutSchema", () => {
  it("accepts valid plan IDs", () => {
    for (const planId of ["starter", "growth", "pro"]) {
      const result = createCheckoutSchema.safeParse({ planId });
      expect(result.success).toBe(true);
    }
  });

  it("rejects enterprise (not a self-serve plan)", () => {
    const result = createCheckoutSchema.safeParse({ planId: "enterprise" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid plan ID", () => {
    const result = createCheckoutSchema.safeParse({ planId: "free" });
    expect(result.success).toBe(false);
  });

  it("rejects empty object", () => {
    const result = createCheckoutSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects missing planId", () => {
    const result = createCheckoutSchema.safeParse({ plan: "starter" });
    expect(result.success).toBe(false);
  });
});

describe("billingPortalSchema", () => {
  it("accepts empty object (returnUrl is optional)", () => {
    const result = billingPortalSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts valid returnUrl", () => {
    const result = billingPortalSchema.safeParse({
      returnUrl: "https://app.supportai.com/billing",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid returnUrl", () => {
    const result = billingPortalSchema.safeParse({
      returnUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("PLAN_FEATURES", () => {
  it("has features for every plan ID", () => {
    for (const planId of PLAN_IDS) {
      expect(PLAN_FEATURES[planId]).toBeDefined();
      expect(PLAN_FEATURES[planId].length).toBeGreaterThan(0);
    }
  });
});

describe("PLANS constants", () => {
  it("starter costs $49", () => {
    expect(PLANS.starter.price).toBe(49);
  });

  it("growth costs $99", () => {
    expect(PLANS.growth.price).toBe(99);
  });

  it("pro costs $199", () => {
    expect(PLANS.pro.price).toBe(199);
  });

  it("enterprise has null price (custom)", () => {
    expect(PLANS.enterprise.price).toBeNull();
  });

  it("all paid plans have numeric prices", () => {
    for (const planId of ["starter", "growth", "pro"] as const) {
      expect(typeof PLANS[planId].price).toBe("number");
    }
  });
});
