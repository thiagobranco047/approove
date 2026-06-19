import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/auth";
import {
  attachmentVersionInclude,
} from "@/lib/attachment-slides";
import {
  getAttachmentVersionForOrganization,
  renumberVersionSlides,
  syncVersionCoverFromSlides,
} from "@/lib/attachment-version-access";
import { inferMediaType } from "@/lib/media-utils";

const addSlideSchema = z.object({
  url: z.string().min(1, "URL obrigatória"),
  mediaType: z.enum(["image", "video"]).optional(),
});

const reorderSchema = z.object({
  slideIds: z.array(z.string().min(1)).min(1),
});

async function loadVersionResponse(versionId: string) {
  return prisma.attachmentVersion.findUnique({
    where: { id: versionId },
    include: attachmentVersionInclude.include,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    const { organization } = await requireOrganization();
    const { versionId } = await params;
    const body = await request.json();
    const data = addSlideSchema.parse(body);

    const version = await getAttachmentVersionForOrganization(versionId, organization.id);
    if (!version) {
      return NextResponse.json({ error: "Versão não encontrada" }, { status: 404 });
    }

    const nextOrder = version.slides.length;
    await prisma.attachmentSlide.create({
      data: {
        attachmentVersionId: versionId,
        order: nextOrder,
        url: data.url,
        mediaType: data.mediaType ?? inferMediaType(data.url),
        label: nextOrder === 0 ? null : `Slide ${nextOrder + 1}`,
      },
    });

    const renumbered = await renumberVersionSlides(versionId);
    await syncVersionCoverFromSlides(versionId, renumbered);

    const updated = await loadVersionResponse(versionId);
    return NextResponse.json({ version: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Faça login para continuar" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
    }
    console.error("Error adding slide:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    const { organization } = await requireOrganization();
    const { versionId } = await params;
    const body = await request.json();
    const data = reorderSchema.parse(body);

    const version = await getAttachmentVersionForOrganization(versionId, organization.id);
    if (!version) {
      return NextResponse.json({ error: "Versão não encontrada" }, { status: 404 });
    }

    const existingIds = new Set(version.slides.map((slide) => slide.id));
    if (data.slideIds.length !== existingIds.size) {
      return NextResponse.json({ error: "Lista de slides incompleta" }, { status: 400 });
    }
    for (const slideId of data.slideIds) {
      if (!existingIds.has(slideId)) {
        return NextResponse.json({ error: "Slide inválido" }, { status: 400 });
      }
    }

    await prisma.$transaction(
      data.slideIds.map((slideId, order) =>
        prisma.attachmentSlide.update({
          where: { id: slideId },
          data: { order },
        })
      )
    );

    const renumbered = await renumberVersionSlides(versionId);
    await syncVersionCoverFromSlides(versionId, renumbered);

    const updated = await loadVersionResponse(versionId);
    return NextResponse.json({ version: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Faça login para continuar" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
    }
    console.error("Error reordering slides:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    const { organization } = await requireOrganization();
    const { versionId } = await params;
    const { slideId } = await request.json();

    if (!slideId || typeof slideId !== "string") {
      return NextResponse.json({ error: "slideId é obrigatório" }, { status: 400 });
    }

    const version = await getAttachmentVersionForOrganization(versionId, organization.id);
    if (!version) {
      return NextResponse.json({ error: "Versão não encontrada" }, { status: 404 });
    }

    const minSlides = version.postAttachment.type === "carousel" ? 2 : 1;
    if (version.slides.length <= minSlides) {
      return NextResponse.json(
        { error: `Mínimo de ${minSlides} slide(s) neste material` },
        { status: 400 }
      );
    }

    const slide = version.slides.find((item) => item.id === slideId);
    if (!slide) {
      return NextResponse.json({ error: "Slide não encontrado" }, { status: 404 });
    }

    await prisma.attachmentSlide.delete({ where: { id: slideId } });

    const renumbered = await renumberVersionSlides(versionId);
    await syncVersionCoverFromSlides(versionId, renumbered);

    const updated = await loadVersionResponse(versionId);
    return NextResponse.json({ version: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Faça login para continuar" }, { status: 401 });
    }
    console.error("Error deleting slide:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
