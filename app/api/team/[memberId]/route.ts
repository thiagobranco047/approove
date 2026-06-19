import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/auth";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(["admin", "member"], {
    message: "Função deve ser 'admin' ou 'member'",
  }),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { membership, organization } = await requireOrganization();

    if (membership.role !== "owner") {
      return NextResponse.json(
        { error: "Apenas o proprietário pode alterar funções" },
        { status: 403 }
      );
    }

    const { memberId } = await params;
    const body = await request.json();
    const data = updateRoleSchema.parse(body);

    const targetMembership = await prisma.membership.findFirst({
      where: {
        id: memberId,
        organizationId: organization.id,
      },
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: "Membro não encontrado" },
        { status: 404 }
      );
    }

    if (targetMembership.userId === membership.userId) {
      return NextResponse.json(
        { error: "Você não pode alterar sua própria função" },
        { status: 400 }
      );
    }

    if (targetMembership.role === "owner") {
      return NextResponse.json(
        { error: "Não é possível alterar a função do proprietário" },
        { status: 400 }
      );
    }

    const updated = await prisma.membership.update({
      where: { id: memberId },
      data: { role: data.role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ member: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { membership, organization } = await requireOrganization();

    if (membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas proprietários e administradores podem remover membros" },
        { status: 403 }
      );
    }

    const { memberId } = await params;

    const targetMembership = await prisma.membership.findFirst({
      where: {
        id: memberId,
        organizationId: organization.id,
      },
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: "Membro não encontrado" },
        { status: 404 }
      );
    }

    if (targetMembership.role === "owner") {
      return NextResponse.json(
        { error: "Não é possível remover o proprietário da organização" },
        { status: 400 }
      );
    }

    if (targetMembership.userId === membership.userId) {
      return NextResponse.json(
        { error: "Você não pode remover a si mesmo" },
        { status: 400 }
      );
    }

    await prisma.membership.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
