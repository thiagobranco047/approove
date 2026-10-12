import Stripe from "stripe";
import { PLAN_AMOUNTS, type PaidPlan } from "../lib/pricing";

const PRODUCTS: Record<PaidPlan, string> = {
  solo: "prod_VAVTanFDJDkxOJ",
  starter: "prod_V9LGeJZiWEPddn",
  pro: "prod_V9LIoQsRa5BuuM",
  studio: "prod_V9LJlxVjmQ8BDl",
};

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_live_")) {
    throw new Error("STRIPE_SECRET_KEY must be sk_live_");
  }

  const stripe = new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
  const plans = Object.keys(PRODUCTS) as PaidPlan[];
  const created: Record<PaidPlan, { productId: string; priceId: string }> = {
    solo: { productId: "", priceId: "" },
    starter: { productId: "", priceId: "" },
    pro: { productId: "", priceId: "" },
    studio: { productId: "", priceId: "" },
  };

  for (const plan of plans) {
    const productId = PRODUCTS[plan];
    await stripe.products.update(productId, {
      metadata: { app: "approove", product: "approove-saas", plan },
    });

    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      type: "recurring",
      limit: 20,
      expand: ["data.currency_options"],
    });

    const match = prices.data.find((price) => {
      const usd =
        price.currency === "usd" ? price.unit_amount : price.currency_options?.usd?.unit_amount;
      const brl = price.currency_options?.brl?.unit_amount;
      return usd === PLAN_AMOUNTS[plan].usd && brl === PLAN_AMOUNTS[plan].brl;
    });

    if (match) {
      created[plan] = { productId, priceId: match.id };
      console.log(`${plan}: reuse ${match.id}`);
      continue;
    }

    const price = await stripe.prices.create({
      product: productId,
      currency: "usd",
      unit_amount: PLAN_AMOUNTS[plan].usd,
      recurring: { interval: "month" },
      nickname: `Approove ${plan} Live`,
      currency_options: {
        brl: { unit_amount: PLAN_AMOUNTS[plan].brl },
      },
      metadata: { app: "approove", plan, version: "billing-v2-live" },
    });

    created[plan] = { productId, priceId: price.id };
    console.log(`${plan}: created price ${price.id}`);
  }

  const portal = await stripe.billingPortal.configurations.create({
    business_profile: { headline: "Approove" },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        proration_behavior: "always_invoice",
        products: plans.map((plan) => ({
          product: created[plan].productId,
          prices: [created[plan].priceId],
        })),
      },
    },
  });

  const webhook = await stripe.webhookEndpoints.update("we_1U92mPKDZYoMpOmdxqFz0q3c", {
    enabled_events: [
      "checkout.session.completed",
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.paid",
      "invoice.payment_failed",
    ],
  });

  console.log("\nLive env:");
  console.log(`STRIPE_PRICE_SOLO=${created.solo.priceId}`);
  console.log(`STRIPE_PRICE_STARTER=${created.starter.priceId}`);
  console.log(`STRIPE_PRICE_PRO=${created.pro.priceId}`);
  console.log(`STRIPE_PRICE_STUDIO=${created.studio.priceId}`);
  console.log(`STRIPE_PORTAL_CONFIGURATION_ID=${portal.id}`);
  console.log(`webhook ${webhook.id} events=${webhook.enabled_events.join(",")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
