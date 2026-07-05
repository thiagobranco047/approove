"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "US$25/mês",
    description: "Para equipes pequenas iniciando cobrança.",
  },
  {
    id: "pro",
    name: "Pro",
    price: "US$75/mês",
    description: "Para agências com operação recorrente.",
  },
  {
    id: "studio",
    name: "Studio",
    price: "US$150/mês",
    description: "Para times maiores e mais clientes.",
  },
] as const;

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
        throw new Error(data.error || "Erro ao abrir cobrança");
      }

      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao abrir cobrança");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {!canManageBilling && (
        <p className="text-sm text-muted-foreground">
          Apenas proprietários e administradores podem gerenciar cobrança.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
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
                    ? "Plano atual"
                    : opensPortal
                      ? "Alterar no portal"
                      : "Assinar"}
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
          Gerenciar cobrança
        </Button>
      )}
    </div>
  );
}
