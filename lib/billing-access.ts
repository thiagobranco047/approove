const DAY_MS = 24 * 60 * 60 * 1000;

export const TRIAL_DAYS = 15;

/**
 * Statuses da assinatura Stripe que liberam o app. `past_due` entra como
 * período de graça: o Smart Retries tenta cobrar de novo e, se falhar de vez,
 * a assinatura vira `canceled` e o acesso cai junto.
 */
const ACTIVE_STATUSES = new Set(["trialing", "active", "past_due"]);

type BillingFields = {
  subscriptionStatus: string | null;
  currentPeriodEnd: Date | null;
};

export function hasBillingAccess(organization: BillingFields) {
  return (
    organization.subscriptionStatus !== null &&
    ACTIVE_STATUSES.has(organization.subscriptionStatus)
  );
}

export function isTrialing(organization: BillingFields) {
  return organization.subscriptionStatus === "trialing";
}

/** Dias restantes do trial (arredondado para cima), ou null fora do trial. */
export function trialDaysLeft(organization: BillingFields) {
  if (!isTrialing(organization) || !organization.currentPeriodEnd) return null;
  const ms = organization.currentPeriodEnd.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / DAY_MS));
}
