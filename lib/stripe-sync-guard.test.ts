import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const db = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { organization: { findUnique: db.findUnique, update: db.update } },
}));

import { syncSubscription } from "./stripe-sync";

function subscription(id: string, status: Stripe.Subscription.Status) {
  return {
    id,
    status,
    customer: "cus_1",
    items: { data: [{ price: { id: "price_x" }, current_period_end: 1_900_000_000 }] },
  } as unknown as Stripe.Subscription;
}

describe("syncSubscription", () => {
  beforeEach(() => {
    db.findUnique.mockReset();
    db.update.mockReset();
  });

  it("ignores a duplicate subscription that cancels while another one is live", async () => {
    db.findUnique.mockResolvedValue({ id: "org_1", stripeSubscriptionId: "sub_live", subscriptionStatus: "active" });
    await syncSubscription(subscription("sub_old", "canceled"));
    expect(db.update).not.toHaveBeenCalled();
  });

  it("mirrors cancellation of the tracked subscription and drops the plan", async () => {
    db.findUnique.mockResolvedValue({ id: "org_1", stripeSubscriptionId: "sub_live", subscriptionStatus: "active" });
    await syncSubscription(subscription("sub_live", "canceled"));
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "org_1" },
        data: expect.objectContaining({ subscriptionStatus: "canceled", plan: "free" }),
      })
    );
  });

  it("adopts a new live subscription", async () => {
    db.findUnique.mockResolvedValue({ id: "org_1", stripeSubscriptionId: "sub_old", subscriptionStatus: "canceled" });
    await syncSubscription(subscription("sub_new", "active"));
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ stripeSubscriptionId: "sub_new", subscriptionStatus: "active" }) })
    );
  });

  it("does nothing for an unknown customer", async () => {
    db.findUnique.mockResolvedValue(null);
    await syncSubscription(subscription("sub_x", "active"));
    expect(db.update).not.toHaveBeenCalled();
  });
});
