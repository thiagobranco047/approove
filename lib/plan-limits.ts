export type PlanName = "free" | "solo" | "starter" | "pro" | "studio" | "enterprise";
export type LimitedResource = "clients" | "members" | "reviewers";

type PlanLimits = Record<LimitedResource, number | null>;

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free: { clients: 3, members: 3, reviewers: 10 },
  solo: { clients: 2, members: 1, reviewers: 5 },
  starter: { clients: 5, members: 2, reviewers: 10 },
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

// Singular/plural: o plano Solo tem limites de 1, então a mensagem precisa
// concordar ("1 usuário", não "1 usuários").
const resourceLabels: Record<LimitedResource, { one: string; many: string }> = {
  clients: { one: "cliente", many: "clientes" },
  members: { one: "usuário", many: "usuários" },
  reviewers: { one: "revisor ativo", many: "revisores ativos" },
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

  const label = resourceLabels[resource];

  return {
    error: `Limite do plano ${planLabels[normalizedPlan]} atingido: ${limit} ${
      limit === 1 ? label.one : label.many
    }.`,
    code: "PLAN_LIMIT_REACHED",
    plan: normalizedPlan,
    resource,
    current: currentCount,
    limit,
  };
}
