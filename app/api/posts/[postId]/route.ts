import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/auth";
import { isProductionStage } from "@/lib/production-stages";
import { getPostForOrganization, isOrganizationMember } from "@/lib/post-access";
import { attachmentVersionInclude } from "@/lib/attachment-slides";

const updatePostSchema = z.object({
  scheduledAt: z.string().optional(),
  channel: z.string().optional(),
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { user, organization } = await requireOrganization();
    const { postId } = await params;
    const body = await request.json();
    const data = updatePostSchema.parse(body);

    const post = await getPostForOrganization(postId, organization.id);
    if (!post) {
      return NextResponse.json({ error: "Publicação não encontrada" }, { status: 404 });
    }

    if (data.productionStage && !isProductionStage(data.productionStage)) {
      return NextResponse.json({ error: "Etapa de produção inválida" }, { status: 400 });
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

    const assigneeChanged =
      data.assigneeId !== undefined && data.assigneeId !== post.assigneeId;
    const stageChanged =
      data.productionStage !== undefined && data.productionStage !== post.productionStage;
    const shouldStampHandoff = assigneeChanged || stageChanged;

    const updatedPost = await prisma.postItem.update({
      where: { id: postId },
      data: {
        ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
        ...(data.channel && { channel: data.channel }),
        ...(data.copyText !== undefined && { copyText: data.copyText }),
        ...(data.productionStage && { productionStage: data.productionStage }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
        ...(data.handoffNote !== undefined && { handoffNote: data.handoffNote.trim() || null }),
        ...(shouldStampHandoff && {
          assignedAt: new Date(),
          assignedById: user.id,
        }),
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
    console.error("Error updating post:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { organization } = await requireOrganization();
    const { postId } = await params;

    const post = await getPostForOrganization(postId, organization.id);
    if (!post) {
      return NextResponse.json({ error: "Publicação não encontrada" }, { status: 404 });
    }

    await prisma.postItem.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Faça login para continuar" }, { status: 401 });
    }
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
