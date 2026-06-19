import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/auth";

export async function getAttachmentVersionForOrganization(versionId: string, organizationId: string) {
  return prisma.attachmentVersion.findFirst({
    where: {
      id: versionId,
      postAttachment: {
        postItem: {
          calendarVersion: {
            client: { organizationId },
          },
        },
      },
    },
    include: {
      postAttachment: { select: { id: true, type: true } },
      slides: { orderBy: { order: "asc" } },
    },
  });
}

export async function renumberVersionSlides(versionId: string) {
  const slides = await prisma.attachmentSlide.findMany({
    where: { attachmentVersionId: versionId },
    orderBy: { order: "asc" },
  });

  await prisma.$transaction(
    slides.map((slide, order) =>
      prisma.attachmentSlide.update({
        where: { id: slide.id },
        data: { order },
      })
    )
  );

  return slides.map((slide, order) => ({ ...slide, order }));
}

export async function syncVersionCoverFromSlides(
  versionId: string,
  slides: { order: number; url: string }[]
) {
  const first = [...slides].sort((a, b) => a.order - b.order)[0];
  if (!first) return;
  await prisma.attachmentVersion.update({
    where: { id: versionId },
    data: { url: first.url },
  });
}
