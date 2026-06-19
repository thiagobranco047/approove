import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/auth";
import type { ClientInviteRole } from "@/lib/share-access";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reviewerId: string }> }
) {
  try {
    const { organization } = await requireOrganization();
    const { reviewerId } = await params;
    const body = await request.json();
    const { name, email, clientIds } = body as {
      name?: string;
      email?: string;
      clientIds?: string[];
    };

    const reviewer = await prisma.clientReviewer.findFirst({
      where: { id: reviewerId, organizationId: organization.id },
    });

    if (!reviewer) {
      return NextResponse.json({ error: "Revisor não encontrado" }, { status: 404 });
    }

    const updated = await prisma.clientReviewer.update({
      where: { id: reviewerId },
      data: {
        ...(name?.trim() && { name: name.trim() }),
        ...(email?.trim() && { email: email.trim().toLowerCase() }),
      },
    });

    if (clientIds) {
      const validClients = await prisma.client.findMany({
        where: { organizationId: organization.id, id: { in: clientIds } },
        select: { id: true },
      });

      if (validClients.length !== clientIds.length) {
        return NextResponse.json({ error: "Um ou mais clientes inválidos" }, { status: 400 });
      }

      await prisma.clientReviewerClient.deleteMany({
        where: {
          reviewerId,
          client: { organizationId: organization.id },
        },
      });

      await prisma.clientReviewerClient.createMany({
        data: clientIds.map((clientId) => ({ reviewerId, clientId })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ reviewer: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating reviewer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ reviewerId: string }> }
) {
  try {
    const { organization } = await requireOrganization();
    const { reviewerId } = await params;

    const reviewer = await prisma.clientReviewer.findFirst({
      where: { id: reviewerId, organizationId: organization.id },
    });

    if (!reviewer) {
      return NextResponse.json({ error: "Revisor não encontrado" }, { status: 404 });
    }

    await prisma.clientReviewer.delete({ where: { id: reviewerId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting reviewer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
