import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse } from "@/lib/api-error";
import { requireActiveOrganization } from "@/lib/auth";
import { getPostForOrganization } from "@/lib/post-access";
import {
  attachmentVersionInclude,
  buildSlideCreates,
  normalizeSlides,
  slideInputSchema,
} from "@/lib/attachment-slides";

const createAttachmentSchema = slideInputSchema.extend({
  type: z.string().min(1).max(40),
  label: z.string().max(120).optional().nullable(),
});
import { actorFromAuth, invalidateApprovalIfNeeded } from "@/lib/approval";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { user, organization } = await requireActiveOrganization();
    const { postId } = await params;
    const { type, label, url, urls, slides } = createAttachmentSchema.parse(await request.json());

    const post = await getPostForOrganization(postId, organization.id);
    if (!post) {
      return NextResponse.json({ error: "Publicação não encontrada" }, { status: 404 });
    }

    const slideItems = normalizeSlides(url, urls, slides);
    if (!type || slideItems.length === 0) {
      return NextResponse.json(
        { error: "Type e ao menos uma imagem (url ou urls) são obrigatórios" },
        { status: 400 }
      );
    }

    if (type === "carousel" && slideItems.length < 2) {
      return NextResponse.json(
        { error: "Carrossel exige ao menos 2 imagens" },
        { status: 400 }
      );
    }

    const lastAttachment = await prisma.postAttachment.findFirst({
      where: { postItemId: postId },
      orderBy: { order: "desc" },
    });

    const attachment = await prisma.postAttachment.create({
      data: {
        postItemId: postId,
        type,
        label: label || null,
        order: (lastAttachment?.order ?? -1) + 1,
        versions: {
          create: {
            url: slideItems[0].url,
            version: 1,
            slides: {
              create: buildSlideCreates(slideItems),
            },
          },
        },
      },
      include: {
        versions: attachmentVersionInclude,
      },
    });

    await invalidateApprovalIfNeeded({
      postId,
      reason: "attachment_added",
      actor: actorFromAuth({ isAgency: true, access: null, user }),
    });

    return NextResponse.json({ attachment });
  } catch (error) {
    const handled = apiErrorResponse(error);
    if (handled) return handled;
    console.error("Error creating attachment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { user, organization } = await requireActiveOrganization();
    const { postId } = await params;
    const { attachmentId } = z.object({ attachmentId: z.string().min(1).max(64) }).parse(await request.json());

    if (!attachmentId) {
      return NextResponse.json(
        { error: "attachmentId is required" },
        { status: 400 }
      );
    }

    const post = await getPostForOrganization(postId, organization.id);
    if (!post) {
      return NextResponse.json({ error: "Publicação não encontrada" }, { status: 404 });
    }

    const attachment = await prisma.postAttachment.findFirst({
      where: { id: attachmentId, postItemId: postId },
    });
    if (!attachment) {
      return NextResponse.json({ error: "Material não encontrado" }, { status: 404 });
    }

    await invalidateApprovalIfNeeded({
      postId,
      reason: "attachment_removed",
      actor: actorFromAuth({ isAgency: true, access: null, user }),
    });

    await prisma.postAttachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const handled = apiErrorResponse(error);
    if (handled) return handled;
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
