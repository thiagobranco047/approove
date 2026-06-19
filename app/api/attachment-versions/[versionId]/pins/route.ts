import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeShareOrSession } from "@/lib/share-access";

async function getPinCalendarVersionId(pinId: string) {
  const pin = await prisma.annotationPin.findUnique({
    where: { id: pinId },
    include: {
      attachmentVersion: {
        include: {
          postAttachment: {
            include: { postItem: { select: { calendarVersionId: true } } },
          },
        },
      },
    },
  });
  return pin?.attachmentVersion.postAttachment.postItem.calendarVersionId ?? null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    const { versionId } = await params;
    const body = await request.json();
    const { xPercent, yPercent, text, token, slideId } = body;

    const x = Number(xPercent);
    const y = Number(yPercent);

    if (!Number.isFinite(x) || !Number.isFinite(y) || !text?.trim()) {
      return NextResponse.json(
        { error: "xPercent, yPercent e text são obrigatórios" },
        { status: 400 }
      );
    }

    if (x < 0 || x > 100 || y < 0 || y > 100) {
      return NextResponse.json(
        { error: "Coordenadas devem estar entre 0 e 100" },
        { status: 400 }
      );
    }

    const version = await prisma.attachmentVersion.findUnique({
      where: { id: versionId },
      include: {
        postAttachment: {
          include: { postItem: { select: { calendarVersionId: true } } },
        },
      },
    });

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    const calendarVersionId = version.postAttachment.postItem.calendarVersionId;
    const authResult = await authorizeShareOrSession(token, calendarVersionId);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!authResult.isAgency && !authResult.access?.permissions.canPin) {
      return NextResponse.json({ error: "Sem permissão para anotar" }, { status: 403 });
    }

    const resolvedAuthor = authResult.isAgency ? "agency" : "client";

    const pin = await prisma.annotationPin.create({
      data: {
        attachmentVersionId: versionId,
        attachmentSlideId: slideId || null,
        xPercent: x,
        yPercent: y,
        text: text.trim(),
        author: resolvedAuthor,
        authorName: authResult.isAgency ? null : authResult.access?.reviewer?.name ?? null,
        reviewerId: authResult.isAgency ? null : authResult.access?.reviewer?.id ?? null,
      },
    });

    return NextResponse.json({ pin });
  } catch (error) {
    console.error("Error creating annotation pin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { pinId, resolved, token } = body;

    if (!pinId || typeof resolved !== "boolean") {
      return NextResponse.json(
        { error: "pinId and resolved are required" },
        { status: 400 }
      );
    }

    const calendarVersionId = await getPinCalendarVersionId(pinId);
    if (!calendarVersionId) {
      return NextResponse.json({ error: "Pin not found" }, { status: 404 });
    }

    const authResult = await authorizeShareOrSession(token, calendarVersionId);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!authResult.isAgency && !authResult.access?.permissions.canPin) {
      return NextResponse.json({ error: "Sem permissão para alterar anotações" }, { status: 403 });
    }

    const pin = await prisma.annotationPin.update({
      where: { id: pinId },
      data: { resolved },
    });

    return NextResponse.json({ pin });
  } catch (error) {
    console.error("Error updating pin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { pinId, token } = body;

    if (!pinId) {
      return NextResponse.json({ error: "pinId is required" }, { status: 400 });
    }

    const calendarVersionId = await getPinCalendarVersionId(pinId);
    if (!calendarVersionId) {
      return NextResponse.json({ error: "Pin not found" }, { status: 404 });
    }

    const authResult = await authorizeShareOrSession(token, calendarVersionId);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!authResult.isAgency && !authResult.access?.permissions.canPin) {
      return NextResponse.json({ error: "Sem permissão para excluir anotações" }, { status: 403 });
    }

    await prisma.annotationPin.delete({ where: { id: pinId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting pin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
