import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/auth";
import { isProductionStage } from "@/lib/production-stages";
import { getPostForOrganization, isOrganizationMember } from "@/lib/post-access";
import { databaseUnavailableResponse, isDatabaseUnavailable } from "@/lib/api-error";
import { attachmentVersionInclude } from "@/lib/attachment-slides";

const handoffSchema = z.object({
  assigneeId: z.string().nullable().optional(),
  productionStage: z.string(),
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { user, organization } = await requireOrganization();
    const { postId } = await params;
    const body = await request.json();
    const data = handoffSchema.parse(body);

    if (!isProductionStage(data.productionStage)) {
      return NextResponse.json({ error: "Etapa de produção inválida" }, { status: 400 });
    }

    const post = await getPostForOrganization(postId, organization.id);
    if (!post) {
      return NextResponse.json({ error: "Publicação não encontrada" }, { status: 404 });
    }

    if (data.assigneeId) {
      const isMember = await isOrganizationMember(data.assigneeId, organization.id);
      if (!isMember) {
        return NextResponse.json(
          { error: "Responsável deve ser membro da organização" },
          { status: 400 }
        );
      }
    }

    const updatedPost = await prisma.postItem.update({
      where: { id: postId },
      data: {
        productionStage: data.productionStage,
        assigneeId: data.assigneeId ?? null,
        assignedAt: new Date(),
        assignedById: user.id,
        ...(data.handoffNote !== undefined && { handoffNote: data.handoffNote || null }),
      },
      include: postInclude,
    });

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Faça login para continuar" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
    }
    if (isDatabaseUnavailable(error)) {
      const { json, status } = databaseUnavailableResponse();
      return NextResponse.json(json, { status });
    }
    console.error("Error handing off post:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
