import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/auth";
import { isProductionStage } from "@/lib/production-stages";
import { isOrganizationMember } from "@/lib/post-access";
import { attachmentVersionInclude } from "@/lib/attachment-slides";

const createPostSchema = z.object({
  scheduledAt: z.string(),
  channel: z.string().optional(),
  title: z.string().optional(),
  copyText: z.string().optional(),
  productionStage: z.string().optional(),
  assigneeId: z.string().nullable().optional(),
  handoffNote: z.string().max(2000).optional(),
});

const postInclude = {
  comments: { orderBy: { createdAt: "asc" as const } },
  attachments: {
    orderBy: { order: "asc" as const },
    include: {
      versions: attachmentVersionInclude,
    },
  },
  assignee: { select: { id: true, name: true, email: true } },
  assignedBy: { select: { id: true, name: true, email: true } },
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientSlug: string; versionId: string }> }
) {
  try {
    const { user, organization } = await requireOrganization();
    const { clientSlug, versionId } = await params;
    const body = await request.json();
    const data = createPostSchema.parse(body);

    const calendarVersion = await prisma.calendarVersion.findFirst({
      where: {
        version: versionId,
        client: { slug: clientSlug, organizationId: organization.id },
      },
    });

    if (!calendarVersion) {
      return NextResponse.json({ error: "Calendário não encontrado" }, { status: 404 });
    }

    const productionStage =
      data.productionStage && isProductionStage(data.productionStage)
        ? data.productionStage
        : "draft_copy";

    if (data.assigneeId) {
      const isMember = await isOrganizationMember(data.assigneeId, organization.id);
      if (!isMember) {
        return NextResponse.json(
          { error: "Responsável deve ser membro da organização" },
          { status: 400 }
        );
      }
    }

    const post = await prisma.postItem.create({
      data: {
        calendarVersionId: calendarVersion.id,
        scheduledAt: new Date(data.scheduledAt),
        channel: data.channel || "Instagram",
        title: data.title?.trim() || "",
        copyText: data.copyText || "",
        status: "pending",
        productionStage,
        assigneeId: data.assigneeId ?? null,
        assignedAt: data.assigneeId ? new Date() : null,
        assignedById: data.assigneeId ? user.id : null,
        handoffNote: data.handoffNote?.trim() || null,
      },
      include: postInclude,
    });

    return NextResponse.json({ post });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Faça login para continuar" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
    }
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
