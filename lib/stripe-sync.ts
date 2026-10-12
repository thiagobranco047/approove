import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { shouldEndApprooveTrial } from "@/lib/billing-access";

function matchesPrice(priceId: string | null | undefined, ...envKeys: string[]) {
  if (!priceId) return false;
  return envKeys.some((key) => process.env[key] && process.env[key] === priceId);
}

export function planFromPrice(priceId: string | null | undefined) {
  if (matchesPrice(priceId, "STRIPE_PRICE_SOLO", "STRIPE_PRICE_SOLO_LEGACY")) {
    return "solo";
  }
  if (matchesPrice(priceId, "STRIPE_PRICE_STARTER", "STRIPE_PRICE_STARTER_LEGACY")) {
    return "starter";
  }
  if (matchesPrice(priceId, "STRIPE_PRICE_PRO", "STRIPE_PRICE_PRO_LEGACY")) {
    return "pro";
  }
  if (matchesPrice(priceId, "STRIPE_PRICE_STUDIO", "STRIPE_PRICE_STUDIO_LEGACY")) {
    return "studio";
  }
  return "free";
}

export function currentPeriodEnd(subscription: Stripe.Subscription) {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return periodEnd ? new Date(periodEnd * 1000) : null;
}

function idFrom(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

/** Invoice events often fire when a sub becomes past_due or unpaid. */
export function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const record = invoice as Stripe.Invoice & {
    subscription?: unknown;
    parent?: { subscription_details?: { subscription?: unknown } };
  };
  return (
    idFrom(record.subscription) ??
    idFrom(record.parent?.subscription_details?.subscription)
  );
}

/**
 * Espelha a assinatura Stripe na organização. Chamado pelo webhook e pelo
 * retorno do Checkout (`/api/billing/confirm`), para o gate liberar o app
 * sem depender do timing do webhook.
 *
 * Approove trial is closed only when shouldEndApprooveTrial(status) is true
 * (active, legacy trialing, past_due). `unpaid` is mirrored here but does not
 * stamp trialEndsAt; access is blocked by getAccessState.
 */
export async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const priceId = subscription.items.data[0]?.price.id;

  await prisma.organization.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      subscriptionStatus: subscription.status,
      plan: planFromPrice(priceId),
      currentPeriodEnd: currentPeriodEnd(subscription),
      ...(shouldEndApprooveTrial(subscription.status)
        ? { trialEndsAt: new Date() }
        : {}),
    },
  });
}
