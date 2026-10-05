import { describe, expect, it } from "vitest";
import { shouldEndApprooveTrial } from "./billing-access";
import { planFromPrice, subscriptionIdFromInvoice } from "./stripe-sync";

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }
  process.env[key] = value;
}

describe("planFromPrice", () => {
  it("maps current and legacy env price ids", () => {
    const previous = {
      starter: process.env.STRIPE_PRICE_STARTER,
      starterLegacy: process.env.STRIPE_PRICE_STARTER_LEGACY,
      pro: process.env.STRIPE_PRICE_PRO,
    };

    try {
      process.env.STRIPE_PRICE_STARTER = "price_starter_v2";
      process.env.STRIPE_PRICE_STARTER_LEGACY = "price_starter_old";
      process.env.STRIPE_PRICE_PRO = "price_pro_v2";

      expect(planFromPrice("price_starter_v2")).toBe("starter");
      expect(planFromPrice("price_starter_old")).toBe("starter");
      expect(planFromPrice("price_pro_v2")).toBe("pro");
      expect(planFromPrice("price_unknown")).toBe("free");
    } finally {
      restoreEnv("STRIPE_PRICE_STARTER", previous.starter);
      restoreEnv("STRIPE_PRICE_STARTER_LEGACY", previous.starterLegacy);
      restoreEnv("STRIPE_PRICE_PRO", previous.pro);
    }
  });
});

describe("syncSubscription trial patch", () => {
  it("would close Approove trial only for statuses that replace the free trial", () => {
    const patch = (status: string) =>
      shouldEndApprooveTrial(status) ? { trialEndsAt: "now" } : {};

    expect(patch("active")).toEqual({ trialEndsAt: "now" });
    expect(patch("trialing")).toEqual({ trialEndsAt: "now" });
    expect(patch("past_due")).toEqual({ trialEndsAt: "now" });
    expect(patch("incomplete")).toEqual({});
    expect(patch("incomplete_expired")).toEqual({});
    expect(patch("canceled")).toEqual({});
    expect(patch("unpaid")).toEqual({});
  });
});

describe("subscriptionIdFromInvoice", () => {
  it("reads legacy and nested subscription ids used when invoices go unpaid", () => {
    expect(
      subscriptionIdFromInvoice({ subscription: "sub_legacy" } as never)
    ).toBe("sub_legacy");
    expect(
      subscriptionIdFromInvoice({
        parent: { subscription_details: { subscription: "sub_nested" } },
      } as never)
    ).toBe("sub_nested");
    expect(subscriptionIdFromInvoice({} as never)).toBeNull();
  });
});
