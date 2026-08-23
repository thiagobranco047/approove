export type PlanName = "free" | "starter" | "pro" | "studio" | "enterprise";
export type LimitedResource = "clients" | "members" | "reviewers";

type PlanLimits = Record<LimitedResource, number | null>;

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free: { clients: 3, members: 3, reviewers: 10 },
  starter: { clients: 5, members: 2, reviewers: 10 },
  pro: { clients: 15, members: 5, reviewers: null },
  studio: { clients: 40, members: 15, reviewers: null },
  enterprise: { clients: null, members: null, reviewers: null },
};

const planLabels: Record<PlanName, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  studio: "Studio",
  enterprise: "Enterprise",
};

const resourceLabels: Record<LimitedResource, string> = {
  clients: "clientes",
  members: "usuários",
  reviewers: "revisores ativos",
};

export function normalizePlan(plan: string | null | undefined): PlanName {
  if (plan === "agency") return "pro";
  if (
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

  return {
    error: `Limite do plano ${planLabels[normalizedPlan]} atingido: ${limit} ${
      resourceLabels[resource]
    }.`,
    code: "PLAN_LIMIT_REACHED",
    plan: normalizedPlan,
    resource,
    current: currentCount,
    limit,
  };
}
