const DAY_MS = 24 * 60 * 60 * 1000;

export const TRIAL_DAYS = 15;

/**
 * Statuses Stripe that keep the product open.
 * `past_due` is a grace window while Smart Retries run.
 * `trialing` covers organizations still on a legacy Stripe trial.
 */
const STRIPE_ACCESS_STATUSES = new Set(["trialing", "active", "past_due"]);

/** Leftover Approove trial must not reopen after these Stripe outcomes. */
const STRIPE_BLOCKING_STATUSES = new Set(["canceled", "unpaid", "incomplete_expired"]);

/**
 * Statuses that mean the customer has a real (or legacy-trial) subscription
 * replacing the Approove free trial. Checkout no longer creates a Stripe trial,
 * so `trialing` here is only grandfathered Stripe trials.
 *
 * Do not end the Approove trial on incomplete / incomplete_expired / canceled / unpaid.
 */
const STRIPE_STATUSES_THAT_END_APPROOVE_TRIAL = new Set(["active", "trialing", "past_due"]);

export type BillingFields = {
  subscriptionStatus: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodEnd?: Date | null;
  trialEndsAt?: Date | null;
  trialUsedAt?: Date | null;
  plan?: string | null;
};

export type AccessKind =
  | "subscription_active"
  | "subscription_grace"
  | "trial_active"
  | "trial_expired"
  | "subscription_inactive";

export interface AccessState {
  kind: AccessKind;
  daysLeft: number | null;
}

export function organizationTrialFields(now = new Date()) {
  return {
    trialUsedAt: now,
    trialEndsAt: new Date(now.getTime() + TRIAL_DAYS * DAY_MS),
  };
}

export function getAccessState(organization: BillingFields, now = new Date()): AccessState {
  const status = organization.subscriptionStatus;

  if (status && STRIPE_ACCESS_STATUSES.has(status)) {
    const kind = status === "past_due" ? "subscription_grace" : "subscription_active";
    return { kind, daysLeft: null };
  }

  if (status && STRIPE_BLOCKING_STATUSES.has(status)) {
    return { kind: "subscription_inactive", daysLeft: null };
  }

  const trialEnd = organization.trialEndsAt;
  const trialStillOpen = Boolean(trialEnd && trialEnd.getTime() > now.getTime());

  if (trialStillOpen) {
    const ms = trialEnd!.getTime() - now.getTime();
    return {
      kind: "trial_active",
      daysLeft: Math.max(0, Math.ceil(ms / DAY_MS)),
    };
  }

  if (trialEnd && trialEnd.getTime() <= now.getTime()) {
    return { kind: "trial_expired", daysLeft: 0 };
  }

  return { kind: "subscription_inactive", daysLeft: null };
}

/** Paid/grace Stripe orgs should not sit on /subscribe. Trial users may. */
export function shouldRedirectFromSubscribe(organization: BillingFields, now = new Date()) {
  const kind = getAccessState(organization, now).kind;
  return kind === "subscription_active" || kind === "subscription_grace";
}

export function subscribeCopyKind(organization: BillingFields, now = new Date()) {
  const kind = getAccessState(organization, now).kind;
  if (kind === "trial_active") return "trial_active" as const;
  if (kind === "trial_expired") return "trial_expired" as const;
  return "subscription_inactive" as const;
}

export function shouldEndApprooveTrial(subscriptionStatus: string | null | undefined) {
  return Boolean(subscriptionStatus && STRIPE_STATUSES_THAT_END_APPROOVE_TRIAL.has(subscriptionStatus));
}

export function hasProductAccess(organization: BillingFields, now = new Date()) {
  const kind = getAccessState(organization, now).kind;
  return kind === "subscription_active" || kind === "subscription_grace" || kind === "trial_active";
}

/** @deprecated Use hasProductAccess. Kept so existing call sites keep compiling. */
export function hasBillingAccess(organization: BillingFields, now = new Date()) {
  return hasProductAccess(organization, now);
}

export function isTrialing(organization: BillingFields, now = new Date()) {
  return getAccessState(organization, now).kind === "trial_active";
}

export function trialDaysLeft(organization: BillingFields, now = new Date()) {
  const state = getAccessState(organization, now);
  return state.kind === "trial_active" ? state.daysLeft : null;
}

/**
 * Limits during an Approove trial match Starter.
 * Paid orgs use the plan mirrored from Stripe.
 */
export function getEffectivePlan(organization: BillingFields, now = new Date()) {
  const state = getAccessState(organization, now);
  if (state.kind === "subscription_active" || state.kind === "subscription_grace") {
    return organization.plan ?? "free";
  }
  if (state.kind === "trial_active") {
    return "starter";
  }
  return organization.plan ?? "free";
}

export function checkoutAddsStripeTrial() {
  return false;
}
