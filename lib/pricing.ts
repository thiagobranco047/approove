import type { AppLocale } from "@/lib/locale";

export type PaidPlan = "solo" | "starter" | "pro" | "studio";
export type PlanCurrency = "usd" | "brl";

/**
 * Valores em centavos, espelhando cada Stripe Price:
 * `unit_amount` (USD, moeda padrão) e a entrada BRL de `currency_options`.
 * Rode `npm run check:prices` depois de alterar preços no Stripe.
 */
export const PLAN_AMOUNTS: Record<PaidPlan, Record<PlanCurrency, number>> = {
  solo: { usd: 1500, brl: 9700 },
  starter: { usd: 2500, brl: 19700 },
  pro: { usd: 7500, brl: 49700 },
  studio: { usd: 15000, brl: 99700 },
};

export function currencyForLocale(locale: AppLocale): PlanCurrency {
  return locale === "pt-BR" ? "brl" : "usd";
}

export function formatAmount(amountInCents: number, currency: PlanCurrency) {
  return new Intl.NumberFormat(currency === "brl" ? "pt-BR" : "en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amountInCents / 100);
}

/** Preço e período exibidos para um plano pago, na moeda do locale. */
export function planPrice(plan: PaidPlan, locale: AppLocale) {
  const currency = currencyForLocale(locale);

  return {
    price: formatAmount(PLAN_AMOUNTS[plan][currency], currency),
    period: locale === "pt-BR" ? "/mês" : "/month",
  };
}
