"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";
import { localizedText } from "@/lib/locale";
import { planPrice, type PaidPlan } from "@/lib/pricing";

type Props = {
  canManageBilling: boolean;
  currentPlan: string;
  hasActiveSubscription: boolean;
  hasStripeCustomer: boolean;
};

export function BillingActions({
  canManageBilling,
  currentPlan,
  hasActiveSubscription,
  hasStripeCustomer,
}: Props) {
  const locale = useLocale();
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);
  const priceLabel = (plan: PaidPlan) => {
    const { price, period } = planPrice(plan, locale);
    return `${price}${period}`;
  };
  const plans = [
    { id: "solo", name: "Solo", price: priceLabel("solo"), description: tr("Para freelancers com os primeiros clientes.", "For freelancers with their first clients.") },
    { id: "starter", name: "Starter", price: priceLabel("starter"), description: tr("Para equipes pequenas iniciando cobrança.", "For small teams getting started.") },
    { id: "pro", name: "Pro", price: priceLabel("pro"), description: tr("Para agências com operação recorrente.", "For agencies with recurring operations.") },
    { id: "studio", name: "Studio", price: priceLabel("studio"), description: tr("Para times maiores e mais clientes.", "For larger teams and client rosters.") },
  ] as const;
  const [loading, setLoading] = useState<string | null>(null);

  async function openBilling(path: string, body?: unknown) {
    setLoading(path);

    try {
      const response = await fetch(path, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || tr("Erro ao abrir cobrança", "Unable to open billing"));
      }

      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      alert(error instanceof Error ? error.message : tr("Erro ao abrir cobrança", "Unable to open billing"));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {!canManageBilling && (
        <p className="text-sm text-muted-foreground">
          {tr("Apenas proprietários e administradores podem gerenciar cobrança.", "Only owners and admins can manage billing.")}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const opensPortal = hasActiveSubscription && !isCurrentPlan;

          return (
            <div key={plan.id} className="rounded-lg border bg-background p-5">
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="text-sm font-medium">{plan.price}</p>
                </div>
                <p className="min-h-10 text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <Button
                  className="w-full"
                  disabled={!canManageBilling || loading !== null || isCurrentPlan}
                  onClick={() =>
                    opensPortal
                      ? openBilling("/api/billing/portal")
                      : openBilling("/api/billing/checkout", { plan: plan.id })
                  }
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {isCurrentPlan
                    ? tr("Plano atual", "Current plan")
                    : opensPortal
                      ? tr("Alterar no portal", "Change in portal")
                      : tr("Assinar", "Subscribe")}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {hasStripeCustomer && (
        <Button
          variant="outline"
          disabled={!canManageBilling || loading !== null}
          onClick={() => openBilling("/api/billing/portal")}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          {tr("Gerenciar cobrança", "Manage billing")}
        </Button>
      )}
    </div>
  );
}
