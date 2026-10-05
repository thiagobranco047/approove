import { describe, expect, it } from "vitest";
import Stripe from "stripe";

describe("Stripe webhook signatures", () => {
  it("accepts a payload signed with the endpoint secret", () => {
    const stripe = new Stripe("sk_test_placeholder", {
      apiVersion: "2026-06-24.dahlia",
    });
    const secret = "whsec_billing_v2_test";
    const payload = JSON.stringify({
      id: "evt_test",
      object: "event",
      type: "customer.subscription.updated",
      data: { object: { id: "sub_test", status: "past_due" } },
    });
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
    const event = stripe.webhooks.constructEvent(payload, header, secret);
    expect(event.type).toBe("customer.subscription.updated");
  });
});
