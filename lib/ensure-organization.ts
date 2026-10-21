import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { organizationTrialFields } from "@/lib/billing-access";
import { slugFromName } from "@/lib/org-slug";

/**
 * Trial Approove só para quem nunca teve um. Marca o usuário na mesma transação
 * em que cria a organização. Recriar conta/organização não renova o trial.
 */
export async function claimTrialFields(tx: Prisma.TransactionClient, userId: string) {
  const claimed = await tx.user.updateMany({
    where: { id: userId, trialClaimedAt: null },
    data: { trialClaimedAt: new Date() },
  });
  return claimed.count === 1 ? organizationTrialFields() : {};
}

/**
 * Ensures the user has exactly one accepted Organization membership.
 * Creates an org only when the user has none and no invite is pending.
 * Never restarts a trial or duplicates an existing membership.
 */
export async function ensureOrganizationForUser(user: {
  id: string;
  name?: string | null;
  email?: string | null;
}) {
  const existing = await prisma.membership.findFirst({
    where: { userId: user.id, acceptedAt: { not: null } },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return existing;
  }

  const pending = await prisma.membership.count({
    where: { userId: user.id, acceptedAt: null },
  });
  if (pending > 0) {
    return null;
  }

  const orgName =
    user.name?.trim() ||
    user.email?.split("@")[0] ||
    "Minha agência";
  const baseSlug = slugFromName(orgName);

  return prisma.$transaction(async (tx) => {
    const raced = await tx.membership.findFirst({
      where: { userId: user.id, acceptedAt: { not: null } },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });
    if (raced) return raced;

    let slug = baseSlug;
    const taken = await tx.organization.findUnique({ where: { slug } });
    if (taken) {
      slug = `${baseSlug}-${Date.now().toString(36)}`;
    }

    const organization = await tx.organization.create({
      data: {
        name: orgName,
        slug,
        ...(await claimTrialFields(tx, user.id)),
      },
    });

    return tx.membership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "owner",
        acceptedAt: new Date(),
      },
      include: { organization: true },
    });
  });
}
