import { prisma } from "@/lib/prisma";
import { organizationTrialFields } from "@/lib/billing-access";
import { slugFromName } from "@/lib/org-slug";

/**
 * Ensures the user has exactly one Organization membership.
 * Creates an org + Approove trial only when the user has none.
 * Never restarts trial or duplicates an existing membership.
 */
export async function ensureOrganizationForUser(user: {
  id: string;
  name?: string | null;
  email?: string | null;
}) {
  const existing = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return existing;
  }

  const orgName =
    user.name?.trim() ||
    user.email?.split("@")[0] ||
    "Minha agência";
  const baseSlug = slugFromName(orgName);

  return prisma.$transaction(async (tx) => {
    const raced = await tx.membership.findFirst({
      where: { userId: user.id },
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
        ...organizationTrialFields(),
      },
    });

    return tx.membership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "owner",
      },
      include: { organization: true },
    });
  });
}
