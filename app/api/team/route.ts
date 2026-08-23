import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/auth";
import { z } from "zod";
import { planAllows, planLimitResponse } from "@/lib/plan-limits";
import { sendEmail } from "@/lib/email";
import { buildMemberInviteEmail } from "@/lib/email-templates/member-invite";

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(1, "Nome é obrigatório").optional(),
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

    const memberCount = await prisma.membership.count({
      where: { organizationId: organization.id },
    });
    if (!planAllows(organization.plan, "members", memberCount)) {
      return NextResponse.json(
        planLimitResponse(organization.plan, "members", memberCount),
        { status: 403 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { email: data.email, name: data.name || null },
      });
    } else if (data.name && !user.name) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: data.name },
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

    const inviter = await prisma.user.findUnique({
      where: { id: membership.userId },
      select: { name: true },
    });

    const emailContent = buildMemberInviteEmail({
      memberEmail: data.email,
      memberName: data.name || data.email,
      organizationName: organization.name,
      role: data.role,
      invitedByName: inviter?.name,
    });

    const emailResult = await sendEmail({
      to: data.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (emailResult.skipped) {
      console.warn("[team] E-mail de convite não enviado (RESEND_API_KEY não configurada)");
    }

    return NextResponse.json({ member: newMembership });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Dados inválidos" },
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
