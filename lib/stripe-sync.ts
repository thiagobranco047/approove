import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export function planFromPrice(priceId: string | null | undefined) {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "starter";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_STUDIO) return "studio";
  return "free";
}

export function currentPeriodEnd(subscription: Stripe.Subscription) {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return periodEnd ? new Date(periodEnd * 1000) : null;
}

/**
 * Espelha a assinatura Stripe na organização. Chamado pelo webhook e pelo
 * retorno do Checkout (`/api/billing/confirm`), para o gate liberar o app
 * sem depender do timing do webhook.
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
      // Assinatura nasceu com trial → organização já consumiu o período grátis.
      ...(subscription.trial_start
        ? { trialUsedAt: new Date(subscription.trial_start * 1000) }
        : {}),
    },
  });
}
