import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/auth";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "member"], {
    message: "Função deve ser 'admin' ou 'member'",
  }),
});

export async function GET() {
  try {
    const { organization } = await requireOrganization();

    const members = await prisma.membership.findMany({
      where: { organizationId: organization.id },
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
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ members });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "No organization") {
      return NextResponse.json({ members: [] });
    }
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { membership, organization } = await requireOrganization();

    if (membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas proprietários e administradores podem convidar membros" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = inviteSchema.parse(body);

    const existingMembership = await prisma.membership.findFirst({
      where: {
        organizationId: organization.id,
        user: { email: data.email },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "Este usuário já faz parte da organização" },
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { email: data.email },
      });
    }

    const newMembership = await prisma.membership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: data.role,
      },
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

    return NextResponse.json({ member: newMembership });
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
    console.error("Error inviting member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
