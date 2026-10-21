import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageWorkspace, requireActiveOrganization } from "@/lib/auth";
import { attachmentVersionInclude } from "@/lib/attachment-slides";
import { findAgencyShareToken } from "@/lib/share-access";
import { apiErrorResponse } from "@/lib/api-error";
import { clientFieldsSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientSlug: string }> }
) {
  try {
    const { organization, membership } = await requireActiveOrganization();
    const { clientSlug } = await params;

    const client = await prisma.client.findFirst({
      where: { slug: clientSlug, organizationId: organization.id },
      include: {
        versions: {
          include: {
            posts: {
              include: {
                comments: { orderBy: { createdAt: "asc" } },
                assignee: { select: { id: true, name: true, email: true } },
                assignedBy: { select: { id: true, name: true, email: true } },
                attachments: {
                  orderBy: { order: "asc" },
                  include: {
                    versions: attachmentVersionInclude,
                  },
                },
              },
              orderBy: { scheduledAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    const latestVersion = client.versions[0];
    const agencyShareToken = latestVersion
      ? await findAgencyShareToken(latestVersion.id)
      : null;

    // Só o link da agência da versão atual; tokens de revisores nunca saem aqui.
    const clientWithShareToken = {
      ...client,
      versions: client.versions.map((version, index) => ({
        ...version,
        tokens: index === 0 && agencyShareToken ? [{ token: agencyShareToken }] : [],
      })),
    };

    return NextResponse.json({
      client: clientWithShareToken,
      canManage: canManageWorkspace(membership.role),
    });
  } catch (error) {
    const handled = apiErrorResponse(error);
    if (handled) return handled;
    console.error("Error fetching client:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientSlug: string }> }
) {
  try {
    const { organization } = await requireActiveOrganization();
    const { clientSlug } = await params;

    const client = await prisma.client.findFirst({
      where: { slug: clientSlug, organizationId: organization.id },
    });

    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const data = clientFieldsSchema.partial().parse(body);

    // Só campos enviados mudam (partial + transform transformaria ausentes em null).
    const updated = await prisma.client.update({
      where: { id: client.id },
      data: Object.fromEntries(
        Object.entries(data).filter(([key, value]) => key in body && !(key === "name" && !value))
      ),
    });

    return NextResponse.json({ client: updated });
  } catch (error) {
    const handled = apiErrorResponse(error);
    if (handled) return handled;
    console.error("Error updating client:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ clientSlug: string }> }
) {
  try {
    // Apaga versões, posts e todo o histórico de aprovação: só owner/admin.
    const { organization } = await requireActiveOrganization({ roles: ["owner", "admin"] });
    const { clientSlug } = await params;

    const client = await prisma.client.findFirst({
      where: { slug: clientSlug, organizationId: organization.id },
    });

    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    await prisma.client.delete({ where: { id: client.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const handled = apiErrorResponse(error);
    if (handled) return handled;
    console.error("Error deleting client:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
