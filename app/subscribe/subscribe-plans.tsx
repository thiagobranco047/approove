"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { localizedText, type AppLocale } from "@/lib/locale";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import { planPrice, type PaidPlan } from "@/lib/pricing";
import { TRIAL_DAYS } from "@/lib/billing-access";

type Props = {
  locale: AppLocale;
  organizationName: string;
  canManageBilling: boolean;
  trialUsed: boolean;
};

export function SubscribePlans({
  locale,
  organizationName,
  canManageBilling,
  trialUsed,
}: Props) {
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);
  const [loading, setLoading] = useState<PaidPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const limitLabel = (
    value: number | null,
    singular: string,
    plural: string,
    unlimited: string
  ) =>
    value === null ? unlimited : `${value} ${value === 1 ? singular : plural}`;

  const featureList = (plan: PaidPlan) => {
    const limits = PLAN_LIMITS[plan];
    return [
      limitLabel(limits.clients, tr("cliente", "client"), tr("clientes", "clients"), tr("Clientes ilimitados", "Unlimited clients")),
      limitLabel(limits.members, tr("usuário", "user"), tr("usuários", "users"), tr("Usuários ilimitados", "Unlimited users")),
      limitLabel(limits.reviewers, tr("revisor ativo", "active reviewer"), tr("revisores ativos", "active reviewers"), tr("Revisores ativos ilimitados", "Unlimited active reviewers")),
      tr("Publicações ilimitadas", "Unlimited posts"),
      tr("Aprovação por link", "Link-based approval"),
    ];
  };

  const plans: Array<{ id: PaidPlan; name: string; description: string; highlighted?: boolean }> = [
    { id: "solo", name: "Solo", description: tr("Para freelancers com os primeiros clientes", "For freelancers taking on their first clients") },
    { id: "starter", name: "Starter", description: tr("Para quem está começando a carteira", "For a growing client roster") },
    { id: "pro", name: "Pro", description: tr("Para agências em crescimento", "For growing agencies"), highlighted: true },
    { id: "studio", name: "Studio", description: tr("Para operações com muitos clientes", "For operations with many clients") },
  ];

  async function startCheckout(plan: PaidPlan) {
    setLoading(plan);
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, from: "paywall" }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || tr("Erro ao iniciar o checkout", "Unable to start checkout"));
      }

      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("Erro ao iniciar o checkout", "Unable to start checkout"));
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="flex h-16 items-center justify-between border-b bg-background px-5 sm:px-8">
        <span className="text-lg font-bold tracking-tight">Approove</span>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {organizationName}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            {tr("Sair", "Log out")}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        {canManageBilling ? (
          <>
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {trialUsed
                  ? tr("Escolha um plano para continuar", "Choose a plan to continue")
                  : tr(`Comece com ${TRIAL_DAYS} dias grátis`, `Start with ${TRIAL_DAYS} days free`)}
              </h1>
              <p className="mt-3 text-muted-foreground">
                {trialUsed
                  ? tr(
                      "Sua organização não tem uma assinatura ativa. Assine um plano para voltar a usar o Approove.",
                      "Your organization has no active subscription. Subscribe to keep using Approove."
                    )
                  : tr(
                      `Escolha um plano e adicione um cartão válido. Nada é cobrado hoje: a primeira cobrança acontece no fim dos ${TRIAL_DAYS} dias e você pode cancelar quando quiser.`,
                      `Pick a plan and add a valid card. Nothing is charged today: the first charge happens at the end of the ${TRIAL_DAYS} days, and you can cancel anytime.`
                    )}
              </p>
            </div>

            {error && (
              <p className="mx-auto mt-6 max-w-2xl rounded-md border border-destructive/30 bg-destructive/10 p-3 text-center text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => {
                const { price, period } = planPrice(plan.id, locale);

                return (
                  <div
                    key={plan.id}
                    className={`flex flex-col rounded-lg border bg-background p-6 ${
                      plan.highlighted ? "border-primary shadow-sm" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">{plan.name}</h2>
                      {plan.highlighted && (
                        <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                          {tr("Popular", "Popular")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-bold tracking-tight">{price}</span>
                      <span className="text-sm text-muted-foreground">{period}</span>
                    </div>
                    {!trialUsed && (
                      <p className="mt-1 text-xs font-medium text-primary">
                        {tr(`Grátis pelos primeiros ${TRIAL_DAYS} dias`, `Free for the first ${TRIAL_DAYS} days`)}
                      </p>
                    )}
                    <ul className="mt-5 flex-1 space-y-2">
                      {featureList(plan.id).map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="mt-6 w-full"
                      variant={plan.highlighted ? "default" : "outline"}
                      disabled={loading !== null}
                      onClick={() => startCheckout(plan.id)}
                    >
                      {loading === plan.id && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {trialUsed
                        ? tr("Assinar", "Subscribe")
                        : tr("Começar teste grátis", "Start free trial")}
                    </Button>
                  </div>
                );
              })}
            </div>

            {!trialUsed && (
              <p className="mt-8 text-center text-xs text-muted-foreground">
                {tr(
                  `Cancele a qualquer momento durante o período grátis e nada será cobrado. Enviaremos um lembrete antes da primeira cobrança.`,
                  `Cancel anytime during the free period and you won't be charged. We'll send a reminder before the first charge.`
                )}
              </p>
            )}
          </>
        ) : (
          <div className="mx-auto max-w-md rounded-lg border bg-background p-8 text-center">
            <h1 className="text-xl font-semibold">
              {tr("Assinatura necessária", "Subscription required")}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {tr(
                `A organização ${organizationName} ainda não tem uma assinatura ativa. Peça ao proprietário ou administrador para ativar um plano.`,
                `${organizationName} doesn't have an active subscription yet. Ask the owner or an admin to activate a plan.`
              )}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
