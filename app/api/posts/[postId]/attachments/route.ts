import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  attachmentVersionInclude,
  buildSlideCreates,
  normalizeSlides,
  type SlideInput,
} from "@/lib/attachment-slides";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    await requireAuth();

    const { postId } = await params;
    const body = await request.json();
    const { type, label, url, urls, slides } = body as {
      type: string;
      label?: string;
      url?: string;
      urls?: string[];
      slides?: SlideInput[];
    };

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

    return NextResponse.json({ attachment });
  } catch (error) {
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
    await requireAuth();

    const { attachmentId } = await request.json();

    if (!attachmentId) {
      return NextResponse.json(
        { error: "attachmentId is required" },
        { status: 400 }
      );
    }

    await prisma.postAttachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
