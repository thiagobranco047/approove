import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/auth";
import { attachmentVersionInclude } from "@/lib/attachment-slides";
import { findAgencyShareToken } from "@/lib/share-access";
import { databaseUnavailableResponse, isDatabaseUnavailable } from "@/lib/api-error";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientSlug: string }> }
) {
  try {
    const { organization } = await requireOrganization();
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
            tokens: { orderBy: { createdAt: "desc" }, take: 1 },
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

    const clientWithShareToken = {
      ...client,
      versions: client.versions.map((version, index) =>
        index === 0
          ? {
              ...version,
              tokens: agencyShareToken ? [{ token: agencyShareToken }] : [],
            }
          : version
      ),
    };

    return NextResponse.json({ client: clientWithShareToken });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Faça login para continuar" }, { status: 401 });
    }
    if (isDatabaseUnavailable(error)) {
      const { json, status } = databaseUnavailableResponse();
      return NextResponse.json(json, { status });
    }
    console.error("Error fetching client:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientSlug: string }> }
) {
  try {
    const { organization } = await requireOrganization();
    const { clientSlug } = await params;

    const client = await prisma.client.findFirst({
      where: { slug: clientSlug, organizationId: organization.id },
    });

    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const { name, cnpj, address, website, instagram, facebook, linkedin } = body;

    const updated = await prisma.client.update({
      where: { id: client.id },
      data: {
        ...(name && { name }),
        ...(cnpj !== undefined && { cnpj }),
        ...(address !== undefined && { address }),
        ...(website !== undefined && { website }),
        ...(instagram !== undefined && { instagram }),
        ...(facebook !== undefined && { facebook }),
        ...(linkedin !== undefined && { linkedin }),
      },
    });

    return NextResponse.json({ client: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating client:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ clientSlug: string }> }
) {
  try {
    const { organization } = await requireOrganization();
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
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting client:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
