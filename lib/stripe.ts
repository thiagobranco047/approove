import Stripe from "stripe";

const TEST_KEY_IN_PRODUCTION =
  "Stripe: production now refuses test keys. If it’s still on sk_test_, put the live keys in Vercel, or set STRIPE_ALLOW_TEST_MODE=true if you’re still testing.";

/**
 * Produção da Vercel nunca roda com chave de teste: qualquer um pagaria com o
 * cartão 4242 e ganharia um plano. Só sk_live_/rk_live_ passam (rk_test_ também é teste).
 */
export function assertStripeSecretKey(
  key: string | undefined,
  env: {
    vercelEnv?: string;
    allowTestMode?: string;
  } = {}
) {
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  const isVercelProduction = env.vercelEnv === "production";
  const allowTestMode = env.allowTestMode === "true";
  const isLiveKey = key.startsWith("sk_live_") || key.startsWith("rk_live_");

  if (isVercelProduction && !isLiveKey && !allowTestMode) {
    throw new Error(TEST_KEY_IN_PRODUCTION);
  }

  return key;
}

export function getStripe() {
  const key = assertStripeSecretKey(process.env.STRIPE_SECRET_KEY, {
    vercelEnv: process.env.VERCEL_ENV,
    allowTestMode: process.env.STRIPE_ALLOW_TEST_MODE,
  });

  return new Stripe(key, {
    apiVersion: "2026-06-24.dahlia",
  });
}
