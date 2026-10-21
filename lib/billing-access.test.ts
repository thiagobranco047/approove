import { describe, expect, it } from "vitest";
import {
  SUBSCRIPTION_GRACE_DAYS,
  TRIAL_DAYS,
  hasLiveSubscription,
  isSubscriptionStale,
  checkoutAddsStripeTrial,
  getAccessState,
  getEffectivePlan,
  hasProductAccess,
  organizationTrialFields,
  shouldEndApprooveTrial,
  shouldRedirectFromSubscribe,
  subscribeCopyKind,
} from "./billing-access";

const now = new Date("2026-09-30T12:00:00.000Z");

function org(overrides: Record<string, unknown> = {}) {
  return {
    subscriptionStatus: null,
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    trialEndsAt: null,
    trialUsedAt: null,
    plan: "free",
    ...overrides,
  };
}

describe("Approove-owned trial", () => {
  it("starts a 15-day trial without a Stripe subscription", () => {
    const fields = organizationTrialFields(now);
    expect(fields.trialUsedAt).toEqual(now);
    expect(fields.trialEndsAt.getTime() - now.getTime()).toBe(TRIAL_DAYS * 24 * 60 * 60 * 1000);

    const state = getAccessState(
      org({ trialEndsAt: fields.trialEndsAt, trialUsedAt: fields.trialUsedAt }),
      now
    );
    expect(state.kind).toBe("trial_active");
    expect(state.daysLeft).toBe(15);
    expect(hasProductAccess(org({ trialEndsAt: fields.trialEndsAt }), now)).toBe(true);
    expect(getEffectivePlan(org({ trialEndsAt: fields.trialEndsAt, plan: "free" }), now)).toBe(
      "starter"
    );
  });

  it("blocks product access when the trial expires without a subscription", () => {
    const expired = org({
      trialUsedAt: new Date("2026-09-01T12:00:00.000Z"),
      trialEndsAt: new Date("2026-09-16T12:00:00.000Z"),
    });
    expect(getAccessState(expired, now).kind).toBe("trial_expired");
    expect(hasProductAccess(expired, now)).toBe(false);
  });

  it("does not reopen the Approove trial after a canceled subscription", () => {
    const leftover = org({
      subscriptionStatus: "canceled",
      stripeSubscriptionId: "sub_123",
      trialUsedAt: new Date("2026-09-20T12:00:00.000Z"),
      trialEndsAt: new Date("2026-10-10T12:00:00.000Z"),
    });
    expect(getAccessState(leftover, now).kind).toBe("subscription_inactive");
    expect(hasProductAccess(leftover, now)).toBe(false);
  });
});

describe("organization backward compatibility", () => {
  it("A: existing org + active subscription has access and is not on paywall", () => {
    const paid = org({
      subscriptionStatus: "active",
      stripeSubscriptionId: "sub_1",
      plan: "pro",
      trialEndsAt: null,
    });
    expect(getAccessState(paid, now).kind).toBe("subscription_active");
    expect(hasProductAccess(paid, now)).toBe(true);
    expect(shouldRedirectFromSubscribe(paid, now)).toBe(true);
  });

  it("B: existing org + past_due keeps grace access", () => {
    const grace = org({
      subscriptionStatus: "past_due",
      stripeSubscriptionId: "sub_1",
      plan: "starter",
    });
    expect(getAccessState(grace, now).kind).toBe("subscription_grace");
    expect(hasProductAccess(grace, now)).toBe(true);
  });

  it("C: existing org + legacy Stripe trialing has access", () => {
    const stripeTrial = org({
      subscriptionStatus: "trialing",
      stripeSubscriptionId: "sub_old",
      plan: "starter",
      currentPeriodEnd: new Date("2026-10-10T12:00:00.000Z"),
      trialEndsAt: null,
    });
    expect(getAccessState(stripeTrial, now).kind).toBe("subscription_active");
    expect(hasProductAccess(stripeTrial, now)).toBe(true);
  });

  it("D: trialUsedAt without trialEndsAt is not an infinite trial", () => {
    const legacyUsed = org({
      trialUsedAt: new Date("2026-09-01T12:00:00.000Z"),
      trialEndsAt: null,
    });
    expect(getAccessState(legacyUsed, now).kind).toBe("subscription_inactive");
    expect(hasProductAccess(legacyUsed, now)).toBe(false);
    expect(subscribeCopyKind(legacyUsed, now)).toBe("subscription_inactive");
  });

  it("E: no subscription and trialEndsAt null is paywalled, not a trial", () => {
    const unpaidLegacy = org();
    expect(getAccessState(unpaidLegacy, now).kind).toBe("subscription_inactive");
    expect(hasProductAccess(unpaidLegacy, now)).toBe(false);
    expect(shouldRedirectFromSubscribe(unpaidLegacy, now)).toBe(false);
  });

  it("F: new Billing V2 org is on Approove trial", () => {
    const fields = organizationTrialFields(now);
    const fresh = org({ ...fields, plan: "free" });
    expect(getAccessState(fresh, now).kind).toBe("trial_active");
    expect(hasProductAccess(fresh, now)).toBe(true);
    expect(subscribeCopyKind(fresh, now)).toBe("trial_active");
    expect(shouldRedirectFromSubscribe(fresh, now)).toBe(false);
  });
});

describe("Stripe lifecycle", () => {
  it("active → access", () => {
    expect(hasProductAccess(org({ subscriptionStatus: "active", stripeSubscriptionId: "s" }), now)).toBe(true);
  });

  it("legacy trialing → access", () => {
    expect(hasProductAccess(org({ subscriptionStatus: "trialing", stripeSubscriptionId: "s" }), now)).toBe(true);
  });

  it("past_due → grace access", () => {
    expect(getAccessState(org({ subscriptionStatus: "past_due", stripeSubscriptionId: "s" }), now).kind).toBe(
      "subscription_grace"
    );
  });

  it("past_due → active stays access", () => {
    expect(hasProductAccess(org({ subscriptionStatus: "active", stripeSubscriptionId: "s" }), now)).toBe(true);
  });

  it("past_due → unpaid is blocked even with leftover trial dates", () => {
    const unpaid = org({
      subscriptionStatus: "unpaid",
      stripeSubscriptionId: "s",
      trialEndsAt: new Date("2026-10-20T12:00:00.000Z"),
    });
    expect(hasProductAccess(unpaid, now)).toBe(false);
    expect(getAccessState(unpaid, now).kind).toBe("subscription_inactive");
    expect(subscribeCopyKind(unpaid, now)).toBe("subscription_inactive");
  });

  it("past_due → canceled is blocked", () => {
    const canceled = org({
      subscriptionStatus: "canceled",
      stripeSubscriptionId: "s",
    });
    expect(hasProductAccess(canceled, now)).toBe(false);
  });

  it("incomplete keeps Approove trial if it is still open", () => {
    const incomplete = org({
      subscriptionStatus: "incomplete",
      stripeSubscriptionId: "s",
      trialEndsAt: new Date("2026-10-10T12:00:00.000Z"),
    });
    expect(getAccessState(incomplete, now).kind).toBe("trial_active");
    expect(hasProductAccess(incomplete, now)).toBe(true);
  });

  it("incomplete without Approove trial is blocked", () => {
    const incomplete = org({
      subscriptionStatus: "incomplete",
      stripeSubscriptionId: "s",
      trialEndsAt: null,
    });
    expect(getAccessState(incomplete, now).kind).toBe("subscription_inactive");
    expect(hasProductAccess(incomplete, now)).toBe(false);
  });

  it("incomplete_expired is blocked even if trialEndsAt is in the future", () => {
    const expiredCheckout = org({
      subscriptionStatus: "incomplete_expired",
      stripeSubscriptionId: "s",
      trialEndsAt: new Date("2026-10-10T12:00:00.000Z"),
    });
    expect(hasProductAccess(expiredCheckout, now)).toBe(false);
    expect(getAccessState(expiredCheckout, now).kind).toBe("subscription_inactive");
  });

  it("subscription deleted (canceled) is blocked", () => {
    expect(
      hasProductAccess(org({ subscriptionStatus: "canceled", stripeSubscriptionId: "s" }), now)
    ).toBe(false);
  });
});

describe("trial termination rule", () => {
  it("ends Approove trial only on active, legacy trialing, and past_due", () => {
    expect(shouldEndApprooveTrial("active")).toBe(true);
    expect(shouldEndApprooveTrial("trialing")).toBe(true);
    expect(shouldEndApprooveTrial("past_due")).toBe(true);
    expect(shouldEndApprooveTrial("incomplete")).toBe(false);
    expect(shouldEndApprooveTrial("incomplete_expired")).toBe(false);
    expect(shouldEndApprooveTrial("canceled")).toBe(false);
    expect(shouldEndApprooveTrial("unpaid")).toBe(false);
    expect(shouldEndApprooveTrial(null)).toBe(false);
  });

  it("does not add a Stripe checkout trial after the Approove trial", () => {
    expect(checkoutAddsStripeTrial()).toBe(false);
  });
});

describe("subscribe copy", () => {
  it("uses choose-plan copy during an open Approove trial", () => {
    const fields = organizationTrialFields(now);
    expect(subscribeCopyKind(org(fields), now)).toBe("trial_active");
  });

  it("uses trial-ended copy after trialEndsAt", () => {
    expect(
      subscribeCopyKind(
        org({ trialEndsAt: new Date("2026-09-01T12:00:00.000Z") }),
        now
      )
    ).toBe("trial_expired");
  });

  it("uses reactivation copy when there is no trial and no subscription", () => {
    expect(subscribeCopyKind(org(), now)).toBe("subscription_inactive");
  });
});

describe("stale subscriptions", () => {
  const day = 24 * 60 * 60 * 1000;

  it("keeps access through the grace window after period end", () => {
    const organization = org({
      subscriptionStatus: "active",
      currentPeriodEnd: new Date(now.getTime() - 2 * day),
    });
    expect(isSubscriptionStale(organization, now)).toBe(false);
    expect(hasProductAccess(organization, now)).toBe(true);
    expect(hasLiveSubscription(organization, now)).toBe(true);
  });

  it("drops access once active/past_due outlives the period by more than the grace", () => {
    for (const subscriptionStatus of ["active", "past_due", "trialing"]) {
      const organization = org({
        subscriptionStatus,
        currentPeriodEnd: new Date(now.getTime() - (SUBSCRIPTION_GRACE_DAYS + 1) * day),
      });
      expect(isSubscriptionStale(organization, now)).toBe(true);
      expect(hasProductAccess(organization, now)).toBe(false);
      expect(hasLiveSubscription(organization, now)).toBe(false);
    }
  });

  it("does not treat missing period end as stale (legacy rows)", () => {
    expect(isSubscriptionStale(org({ subscriptionStatus: "active" }), now)).toBe(false);
  });
});
