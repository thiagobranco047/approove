import { prisma } from "@/lib/prisma";

export async function getPostForOrganization(postId: string, organizationId: string) {
  return prisma.postItem.findFirst({
    where: {
      id: postId,
      calendarVersion: { client: { organizationId } },
    },
    include: {
      calendarVersion: {
        include: { client: { select: { id: true, slug: true, name: true } } },
      },
    },
  });
}

export async function isOrganizationMember(userId: string, organizationId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId, organizationId },
    select: { id: true },
  });
  return Boolean(membership);
}
