/**
 * Reads current Stripe TEST prices and creates V2 Prices that match lib/pricing.ts.
 * Does not change live mode. Old Price IDs should be kept as *_LEGACY.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Stripe from "stripe";
import { PLAN_AMOUNTS, type PaidPlan } from "../lib/pricing";

function loadEnv() {
  const raw = readFileSync(resolve(".env"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^"|"$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const currentIds: Record<PaidPlan, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  studio: process.env.STRIPE_PRICE_STUDIO,
};

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_test_")) {
    throw new Error("Only Stripe TEST keys are allowed for this script");
  }

  const stripe = new Stripe(key, { apiVersion: "2026-06-24.dahlia" });

  console.log("Current prices:\n");

  for (const plan of Object.keys(currentIds) as PaidPlan[]) {
    const id = currentIds[plan];
    if (!id) throw new Error(`Missing STRIPE_PRICE_${plan.toUpperCase()}`);
    const price = await stripe.prices.retrieve(id, { expand: ["currency_options"] });
    const brl = price.currency_options?.brl?.unit_amount;
    const usd = price.currency === "usd" ? price.unit_amount : price.currency_options?.usd?.unit_amount;
    console.log({
      plan,
      id,
      product: price.product,
      active: price.active,
      usd,
      brl,
      expectedUsd: PLAN_AMOUNTS[plan].usd,
      expectedBrl: PLAN_AMOUNTS[plan].brl,
      matches:
        usd === PLAN_AMOUNTS[plan].usd && brl === PLAN_AMOUNTS[plan].brl,
    });
  }

  if (process.argv.includes("--create")) {
    console.log("\nCreating V2 prices on the same products...\n");
    const created: Record<string, string> = {};

    for (const plan of Object.keys(currentIds) as PaidPlan[]) {
      const id = currentIds[plan]!;
      const existing = await stripe.prices.retrieve(id, {
        expand: ["currency_options"],
      });
      const product =
        typeof existing.product === "string" ? existing.product : existing.product.id;

      const usd = PLAN_AMOUNTS[plan].usd;
      const brl = PLAN_AMOUNTS[plan].brl;
      const alreadyUsd = existing.currency === "usd" && existing.unit_amount === usd;
      const alreadyBrl = existing.currency_options?.brl?.unit_amount === brl;

      if (alreadyUsd && alreadyBrl) {
        created[plan] = id;
        console.log(`${plan}: already matches, keeping ${id}`);
        continue;
      }

      const price = await stripe.prices.create({
        product,
        currency: "usd",
        unit_amount: usd,
        recurring: { interval: "month" },
        nickname: `Approove ${plan} V2`,
        currency_options: {
          brl: { unit_amount: brl },
        },
        metadata: {
          app: "approove",
          plan,
          version: "billing-v2",
        },
      });

      created[plan] = price.id;
      console.log(`${plan}: created ${price.id} (usd ${usd}, brl ${brl})`);
    }

    console.log("\nPut these in .env:\n");
    console.log(`STRIPE_PRICE_STARTER=${created.starter}`);
    console.log(`STRIPE_PRICE_PRO=${created.pro}`);
    console.log(`STRIPE_PRICE_STUDIO=${created.studio}`);
    if (created.starter !== currentIds.starter) {
      console.log(`STRIPE_PRICE_STARTER_LEGACY=${currentIds.starter}`);
    }
    if (created.pro !== currentIds.pro) {
      console.log(`STRIPE_PRICE_PRO_LEGACY=${currentIds.pro}`);
    }
    if (created.studio !== currentIds.studio) {
      console.log(`STRIPE_PRICE_STUDIO_LEGACY=${currentIds.studio}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
