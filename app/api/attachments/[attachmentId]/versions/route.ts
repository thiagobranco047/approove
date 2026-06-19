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
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  try {
    await requireAuth();

    const { attachmentId } = await params;
    const body = await request.json();
    const { url, urls, slides } = body as {
      url?: string;
      urls?: string[];
      slides?: SlideInput[];
    };

    const attachment = await prisma.postAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        versions: {
          orderBy: { version: "desc" },
          take: 1,
          include: {
            slides: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    const lastVersion = attachment.versions[0];
    const lastVersionNumber = lastVersion?.version ?? 0;

    let slideItems = normalizeSlides(url, urls, slides);
    if (slideItems.length === 0 && lastVersion) {
      slideItems = lastVersion.slides.length
        ? lastVersion.slides.map((slide) => ({
            url: slide.url,
            mediaType: slide.mediaType === "video" ? "video" as const : "image" as const,
          }))
        : [{ url: lastVersion.url, mediaType: "image" as const }];
    }

    if (slideItems.length === 0) {
      return NextResponse.json({ error: "URL ou urls são obrigatórios" }, { status: 400 });
    }

    if (attachment.type === "carousel" && slideItems.length < 2) {
      return NextResponse.json(
        { error: "Nova versão de carrossel exige ao menos 2 imagens" },
        { status: 400 }
      );
    }

    const version = await prisma.attachmentVersion.create({
      data: {
        postAttachmentId: attachmentId,
        url: slideItems[0].url,
        version: lastVersionNumber + 1,
        slides: {
          create: buildSlideCreates(slideItems),
        },
      },
      include: attachmentVersionInclude.include,
    });

    return NextResponse.json({ version });
  } catch (error) {
    console.error("Error creating attachment version:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
