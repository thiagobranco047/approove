export type PlanName = "free" | "solo" | "starter" | "pro" | "studio" | "enterprise";
export type LimitedResource = "clients" | "members" | "reviewers";

type PlanLimits = Record<LimitedResource, number | null>;

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  // Sem trial nem assinatura: nada novo pode ser criado.
  free: { clients: 0, members: 1, reviewers: null },
  solo: { clients: 2, members: 1, reviewers: null },
  starter: { clients: 5, members: 2, reviewers: null },
  pro: { clients: 15, members: 5, reviewers: null },
  studio: { clients: 40, members: 15, reviewers: null },
  enterprise: { clients: null, members: null, reviewers: null },
};

const planLabels: Record<PlanName, string> = {
  free: "Free",
  solo: "Solo",
  starter: "Starter",
  pro: "Pro",
  studio: "Studio",
  enterprise: "Enterprise",
};

const resourceLabels: Record<LimitedResource, { singular: string; plural: string }> = {
  clients: { singular: "cliente", plural: "clientes" },
  members: { singular: "usuário da agência", plural: "usuários da agência" },
  reviewers: { singular: "revisor ativo", plural: "revisores ativos" },
};

export function normalizePlan(plan: string | null | undefined): PlanName {
  if (plan === "agency") return "pro";
  if (
    plan === "solo" ||
    plan === "starter" ||
    plan === "pro" ||
    plan === "studio" ||
    plan === "enterprise"
  ) {
    return plan;
  }
  return "free";
}

export function getPlanLimit(plan: string | null | undefined, resource: LimitedResource) {
  return PLAN_LIMITS[normalizePlan(plan)][resource];
}

export function planAllows(
  plan: string | null | undefined,
  resource: LimitedResource,
  currentCount: number,
  add = 1
) {
  const limit = getPlanLimit(plan, resource);
  return limit === null || currentCount + add <= limit;
}

export function planLimitResponse(
  plan: string | null | undefined,
  resource: LimitedResource,
  currentCount: number
) {
  const normalizedPlan = normalizePlan(plan);
  const limit = getPlanLimit(normalizedPlan, resource);
  const labels = resourceLabels[resource];
  const unit = limit === 1 ? labels.singular : labels.plural;

  return {
    error: `Seu plano ${planLabels[normalizedPlan]} permite até ${limit} ${unit}.`,
    code: "PLAN_LIMIT_REACHED" as const,
    plan: normalizedPlan,
    resource,
    current: currentCount,
    limit,
    upgradePath: "/dashboard/settings",
  };
}
