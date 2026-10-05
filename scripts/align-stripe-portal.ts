import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Stripe from "stripe";

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

async function main() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-06-24.dahlia",
  });
  const configId = process.env.STRIPE_PORTAL_CONFIGURATION_ID!;
  const config = await stripe.billingPortal.configurations.retrieve(configId);
  console.log("before:", JSON.stringify(config.features.subscription_update, null, 2));

  if (!process.argv.includes("--update")) return;

  const updated = await stripe.billingPortal.configurations.update(configId, {
    features: {
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
          proration_behavior: "always_invoice",
        products: [
          {
            product: "prod_UpXOrGzdH6FTtF",
            prices: [process.env.STRIPE_PRICE_STARTER!],
          },
          {
            product: "prod_UpXPk3JtokCNBP",
            prices: [process.env.STRIPE_PRICE_PRO!],
          },
          {
            product: "prod_UpXPlOgQKWDJIr",
            prices: [process.env.STRIPE_PRICE_STUDIO!],
          },
        ],
      },
    },
  });
  console.log("after:", JSON.stringify(updated.features.subscription_update, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
