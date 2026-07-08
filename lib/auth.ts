import { auth } from "@/auth";
import { prisma } from "./prisma";

export async function getSession() {
  const session = await auth();
  return session;
}

export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return { ...session.user, id: session.user.id };
}

export async function getUserOrganization(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  return membership;
}

export async function requireOrganization() {
  const user = await requireAuth();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true },
  });

  if (!dbUser) {
    throw new Error("Unauthorized");
  }

  const membership = await getUserOrganization(user.id);

  if (!membership) {
    throw new Error("No organization");
  }

  return { user, membership, organization: membership.organization };
}
