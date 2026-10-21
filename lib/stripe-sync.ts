import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import {
  hasProductAccess,
  isSubscriptionStale,
  shouldEndApprooveTrial,
  type BillingFields,
} from "@/lib/billing-access";
import { getStripe } from "@/lib/stripe";

const ACCESS_STATUSES = new Set(["trialing", "active", "past_due"]);

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

  const organization = await prisma.organization.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true, stripeSubscriptionId: true, subscriptionStatus: true },
  });
  if (!organization) return;

  // Outra assinatura viva já cobre a org: uma assinatura antiga/duplicada que
  // cancela ou falha não pode derrubar o acesso.
  const tracksAnother =
    organization.stripeSubscriptionId &&
    organization.stripeSubscriptionId !== subscription.id &&
    organization.subscriptionStatus &&
    ACCESS_STATUSES.has(organization.subscriptionStatus);
  if (tracksAnother && !ACCESS_STATUSES.has(subscription.status)) return;

  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      subscriptionStatus: subscription.status,
      plan: ACCESS_STATUSES.has(subscription.status) ? planFromPrice(priceId) : "free",
      currentPeriodEnd: currentPeriodEnd(subscription),
      ...(shouldEndApprooveTrial(subscription.status)
        ? { trialEndsAt: new Date() }
        : {}),
    },
  });
}

/** Lê a assinatura atual no Stripe e espelha. Para eventos e assinaturas desatualizadas. */
export async function refreshSubscription(subscriptionId: string) {
  await syncSubscription(await getStripe().subscriptions.retrieve(subscriptionId));
}

/**
 * Retorna a organização (relida) se ela tem acesso ao produto, senão `null`.
 * Assinatura com período vencido é confirmada no Stripe antes de bloquear,
 * para um webhook perdido não trancar quem pagou.
 */
export async function ensureProductAccess<T extends BillingFields & { id: string }>(
  organization: T
): Promise<T | null> {
  if (hasProductAccess(organization)) return organization;
  if (!organization.stripeSubscriptionId || !isSubscriptionStale(organization)) return null;

  try {
    await refreshSubscription(organization.stripeSubscriptionId);
  } catch (error) {
    console.error("Falha ao revalidar assinatura no Stripe:", error);
    return null;
  }

  const fresh = await prisma.organization.findUnique({ where: { id: organization.id } });
  return fresh && hasProductAccess(fresh) ? ({ ...organization, ...fresh } as T) : null;
}
