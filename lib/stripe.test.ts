import { describe, expect, it } from "vitest";
import { assertStripeSecretKey } from "./stripe";

describe("assertStripeSecretKey", () => {
  it("rejects a missing key", () => {
    expect(() => assertStripeSecretKey(undefined)).toThrow("STRIPE_SECRET_KEY is not configured");
  });

  it("rejects test keys on Vercel production unless explicitly allowed", () => {
    expect(() =>
      assertStripeSecretKey("sk_test_example", { vercelEnv: "production" })
    ).toThrow(/production now refuses test keys/);
  });

  it("allows test keys on Vercel production when STRIPE_ALLOW_TEST_MODE is true", () => {
    expect(
      assertStripeSecretKey("sk_test_example", {
        vercelEnv: "production",
        allowTestMode: "true",
      })
    ).toBe("sk_test_example");
  });

  it("allows live keys on Vercel production", () => {
    expect(
      assertStripeSecretKey("sk_live_example", { vercelEnv: "production" })
    ).toBe("sk_live_example");
  });

  it("allows test keys outside Vercel production", () => {
    expect(assertStripeSecretKey("sk_test_example", { vercelEnv: "preview" })).toBe(
      "sk_test_example"
    );
  });
});
