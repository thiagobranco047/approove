import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/auth";
import { findAgencyShareToken } from "@/lib/share-access";
import { databaseUnavailableResponse, isDatabaseUnavailable } from "@/lib/api-error";

export async function GET() {
  try {
    const { organization } = await requireOrganization();

    const clients = await prisma.client.findMany({
      where: { organizationId: organization.id },
      include: {
        versions: {
          include: {
            posts: {
              select: { status: true },
            },
            tokens: {
              take: 1,
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const clientsWithStats = await Promise.all(
      clients.map(async (client) => {
        const latestVersion = client.versions[0];
        const posts = latestVersion?.posts || [];
        const shareToken = latestVersion
          ? await findAgencyShareToken(latestVersion.id)
          : null;

        return {
          ...client,
          stats: {
            pending: posts.filter((p) => p.status === "pending").length,
            approved: posts.filter((p) => p.status === "approved").length,
            adjustments: posts.filter((p) => p.status === "adjustments").length,
            total: posts.length,
          },
          latestToken: shareToken ?? undefined,
        };
      })
    );

    return NextResponse.json({ clients: clientsWithStats });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Faça login para continuar" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "No organization") {
      return NextResponse.json({ clients: [] });
    }
    if (isDatabaseUnavailable(error)) {
      const { json, status } = databaseUnavailableResponse();
      return NextResponse.json(json, { status });
    }
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organization } = await requireOrganization();

    const body = await request.json();
    const { name, slug, cnpj, address, website, instagram, facebook, linkedin } =
      body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Nome e slug são obrigatórios" },
        { status: 400 }
      );
    }

    const existing = await prisma.client.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Slug já existe" },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        organizationId: organization.id,
        name,
        slug,
        cnpj,
        address,
        website,
        instagram,
        facebook,
        linkedin,
      },
    });

    const version = await prisma.calendarVersion.create({
      data: {
        clientId: client.id,
        version: "v1",
      },
    });

    await prisma.shareToken.create({
      data: {
        calendarVersionId: version.id,
      },
    });

    return NextResponse.json({ client });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
