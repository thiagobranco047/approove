/**
 * Compara os valores exibidos no app (lib/pricing) com os Stripe Prices reais.
 * Uso: npm run check:prices
 */
import { PLAN_AMOUNTS, type PaidPlan } from "../lib/pricing";
import { getStripe } from "../lib/stripe";

const priceIdByPlan: Record<PaidPlan, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  studio: process.env.STRIPE_PRICE_STUDIO,
};

async function main() {
  const stripe = getStripe();
  let failed = false;

  for (const [plan, expected] of Object.entries(PLAN_AMOUNTS) as [
    PaidPlan,
    Record<string, number>,
  ][]) {
    const priceId = priceIdByPlan[plan];

    if (!priceId) {
      console.error(`✗ ${plan}: STRIPE_PRICE_${plan.toUpperCase()} não configurado`);
      failed = true;
      continue;
    }

    const price = await stripe.prices.retrieve(priceId, {
      expand: ["currency_options"],
    });

    for (const [currency, amount] of Object.entries(expected)) {
      const actual =
        currency === price.currency
          ? price.unit_amount
          : price.currency_options?.[currency]?.unit_amount;

      if (actual === amount) {
        console.log(`✓ ${plan} ${currency}: ${amount}`);
      } else {
        console.error(
          `✗ ${plan} ${currency}: app mostra ${amount}, Stripe cobra ${actual ?? "não configurado"}`
        );
        failed = true;
      }
    }
  }

  if (failed) {
    console.error("\nPreços divergentes entre o app e o Stripe.");
    process.exit(1);
  }

  console.log("\nTodos os preços conferem com o Stripe.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
