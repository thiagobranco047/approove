import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/auth";
import type { ClientInviteRole } from "@/lib/share-access";
import { sendEmail } from "@/lib/email";
import { buildReviewerInviteEmail } from "@/lib/email-templates/reviewer-invite";
import { planAllows, planLimitResponse } from "@/lib/plan-limits";

async function getClientForOrg(slug: string, organizationId: string) {
  return prisma.client.findFirst({
    where: { slug, organizationId },
    include: {
      versions: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientSlug: string }> }
) {
  try {
    const { organization } = await requireOrganization();
    const { clientSlug } = await params;

    const client = await getClientForOrg(clientSlug, organization.id);
    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    const links = await prisma.clientReviewerClient.findMany({
      where: { clientId: client.id },
      include: {
        reviewer: {
          include: {
            clientLinks: {
              include: { client: { select: { id: true, name: true, slug: true } } },
            },
            invites: {
              where: { calendarVersion: { clientId: client.id } },
              include: {
                shareToken: { select: { token: true } },
                calendarVersion: { select: { id: true, version: true } },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const reviewers = links.map((link) => ({
      id: link.reviewer.id,
      name: link.reviewer.name,
      email: link.reviewer.email,
      clients: link.reviewer.clientLinks.map((cl) => cl.client),
      invites: link.reviewer.invites.map((invite) => ({
        id: invite.id,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expiresAt,
        lastAccessAt: invite.lastAccessAt,
        createdAt: invite.createdAt,
        calendarVersion: invite.calendarVersion.version,
        calendarVersionId: invite.calendarVersion.id,
        token: invite.shareToken.token,
      })),
    }));

    const orgClients = await prisma.client.findMany({
      where: { organizationId: organization.id },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ reviewers, orgClients });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Faça login para continuar" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "No organization") {
      return NextResponse.json(
        { error: "Conta sem organização. Complete o onboarding ou use admin@approove.com após o seed." },
        { status: 403 }
      );
    }
    console.error("Error fetching reviewers:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientSlug: string }> }
) {
  try {
    const { user, organization } = await requireOrganization();
    const { clientSlug } = await params;
    const body = await request.json();
    const {
      name,
      email,
      clientIds,
      role = "approver",
      calendarVersionId,
      expiresAt,
    } = body as {
      name: string;
      email: string;
      clientIds: string[];
      role?: ClientInviteRole;
      calendarVersionId?: string;
      expiresAt?: string | null;
    };

    if (!name?.trim() || !email?.trim() || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json(
        { error: "name, email e clientIds são obrigatórios" },
        { status: 400 }
      );
    }

    if (!["viewer", "reviewer", "approver"].includes(role)) {
      return NextResponse.json({ error: "Papel inválido" }, { status: 400 });
    }

    const client = await getClientForOrg(clientSlug, organization.id);
    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    const validClients = await prisma.client.findMany({
      where: { organizationId: organization.id, id: { in: clientIds } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    if (validClients.length !== clientIds.length) {
      return NextResponse.json({ error: "Um ou mais clientes inválidos" }, { status: 400 });
    }

    const targetVersion = calendarVersionId
      ? client.versions.find((v) => v.id === calendarVersionId)
      : client.versions[0];

    if (!targetVersion) {
      return NextResponse.json({ error: "Nenhuma versão de calendário encontrada" }, { status: 404 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingReviewer = await prisma.clientReviewer.findUnique({
      where: {
        organizationId_email: {
          organizationId: organization.id,
          email: normalizedEmail,
        },
      },
      include: { invites: { where: { status: "active" }, take: 1 } },
    });
    const activeReviewerCount = await prisma.clientReviewer.count({
      where: {
        organizationId: organization.id,
        invites: { some: { status: "active" } },
      },
    });
    const reviewerAlreadyActive = Boolean(existingReviewer?.invites.length);
    if (
      !reviewerAlreadyActive &&
      !planAllows(organization.plan, "reviewers", activeReviewerCount)
    ) {
      return NextResponse.json(
        planLimitResponse(organization.plan, "reviewers", activeReviewerCount),
        { status: 403 }
      );
    }

    const reviewer = await prisma.clientReviewer.upsert({
      where: {
        organizationId_email: {
          organizationId: organization.id,
          email: normalizedEmail,
        },
      },
      create: {
        organizationId: organization.id,
        name: name.trim(),
        email: normalizedEmail,
      },
      update: {
        name: name.trim(),
      },
    });

    await prisma.clientReviewerClient.createMany({
      data: clientIds.map((clientId: string) => ({ reviewerId: reviewer.id, clientId })),
      skipDuplicates: true,
    });

    const shareToken = await prisma.shareToken.create({
      data: {
        calendarVersionId: targetVersion.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    const invite = await prisma.clientInvite.create({
      data: {
        reviewerId: reviewer.id,
        calendarVersionId: targetVersion.id,
        shareTokenId: shareToken.id,
        role,
        status: "active",
        invitedByUserId: user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        shareToken: { select: { token: true } },
        calendarVersion: { select: { version: true } },
      },
    });

    const shareUrl = `/c/${client.slug}/${targetVersion.version}?t=${invite.shareToken.token}`;

    const emailContent = buildReviewerInviteEmail({
      reviewerName: reviewer.name,
      organizationName: organization.name,
      clientNames: validClients.map((c) => c.name),
      role,
      calendarVersion: targetVersion.version,
      sharePath: shareUrl,
      invitedByName: user.name,
    });

    const emailResult = await sendEmail({
      to: reviewer.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    return NextResponse.json({
      reviewer,
      invite,
      shareUrl,
      token: invite.shareToken.token,
      emailSent: emailResult.ok,
      emailSkipped: emailResult.skipped ?? false,
      emailError: emailResult.error ?? null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Faça login para continuar" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "No organization") {
      return NextResponse.json(
        { error: "Conta sem organização. Complete o onboarding ou use admin@approove.com após o seed." },
        { status: 403 }
      );
    }
    console.error("Error creating reviewer:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
