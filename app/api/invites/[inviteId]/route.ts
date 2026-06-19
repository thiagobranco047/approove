import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const { organization } = await requireOrganization();
    const { inviteId } = await params;
    const body = await request.json();
    const { status, role } = body as { status?: string; role?: string };

    const invite = await prisma.clientInvite.findFirst({
      where: {
        id: inviteId,
        reviewer: { organizationId: organization.id },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
    }

    const updated = await prisma.clientInvite.update({
      where: { id: inviteId },
      data: {
        ...(status && { status }),
        ...(role && ["viewer", "reviewer", "approver"].includes(role) && { role }),
      },
    });

    return NextResponse.json({ invite: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating invite:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
