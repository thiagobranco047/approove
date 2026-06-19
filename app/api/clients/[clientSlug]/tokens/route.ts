import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ clientSlug: string }> }
) {
  try {
    const { organization } = await requireOrganization();
    const { clientSlug } = await params;

    const client = await prisma.client.findFirst({
      where: { slug: clientSlug, organizationId: organization.id },
      include: {
        versions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    const latestVersion = client.versions[0];
    if (!latestVersion) {
      return NextResponse.json(
        { error: "Nenhuma versão de calendário encontrada" },
        { status: 404 }
      );
    }

    const token = await prisma.shareToken.create({
      data: { calendarVersionId: latestVersion.id },
    });

    const shareUrl = `/c/${client.slug}/${latestVersion.version}?t=${token.token}`;

    return NextResponse.json({ token: token.token, shareUrl });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
