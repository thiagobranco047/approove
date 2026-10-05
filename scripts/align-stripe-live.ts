/**
 * Creates Live products/prices matching lib/pricing.ts.
 * Requires STRIPE_SECRET_KEY_LIVE=sk_live_...
 */
import Stripe from "stripe";
import { PLAN_AMOUNTS, type PaidPlan } from "../lib/pricing";

async function main() {
  const key = process.env.STRIPE_SECRET_KEY_LIVE ?? process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_live_")) {
    console.error("Missing STRIPE_SECRET_KEY_LIVE (sk_live_...). Live prices were not created.");
    process.exit(2);
  }

  const stripe = new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
  const plans = Object.keys(PLAN_AMOUNTS) as PaidPlan[];
  const created: Record<
    PaidPlan,
    { productId: string; priceId: string }
  > = {
    starter: { productId: "", priceId: "" },
    pro: { productId: "", priceId: "" },
    studio: { productId: "", priceId: "" },
  };

  const existingPrices = await stripe.prices.list({
    active: true,
    type: "recurring",
    limit: 100,
    expand: ["data.currency_options"],
  });

  for (const plan of plans) {
    const match = existingPrices.data.find((price) => {
      const usd =
        price.currency === "usd" ? price.unit_amount : price.currency_options?.usd?.unit_amount;
      const brl = price.currency_options?.brl?.unit_amount;
      return (
        price.metadata?.plan === plan &&
        usd === PLAN_AMOUNTS[plan].usd &&
        brl === PLAN_AMOUNTS[plan].brl
      );
    });

    if (match) {
      const productId = typeof match.product === "string" ? match.product : match.product.id;
      created[plan] = { productId, priceId: match.id };
      console.log(`${plan}: reuse ${match.id}`);
      continue;
    }

    const product = await stripe.products.create({
      name: `Approove ${plan[0].toUpperCase()}${plan.slice(1)}`,
      metadata: { app: "approove", product: "approove-saas", plan },
    });

    const price = await stripe.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: PLAN_AMOUNTS[plan].usd,
      recurring: { interval: "month" },
      nickname: `Approove ${plan} Live`,
      currency_options: {
        brl: { unit_amount: PLAN_AMOUNTS[plan].brl },
      },
      metadata: { app: "approove", plan, version: "billing-v2-live" },
    });

    created[plan] = { productId: product.id, priceId: price.id };
    console.log(`${plan}: created ${product.id} / ${price.id}`);
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

  console.log("\nLive env:");
  console.log(`STRIPE_PRICE_STARTER=${created.starter.priceId}`);
  console.log(`STRIPE_PRICE_PRO=${created.pro.priceId}`);
  console.log(`STRIPE_PRICE_STUDIO=${created.studio.priceId}`);
  console.log(`STRIPE_PORTAL_CONFIGURATION_ID=${portal.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
