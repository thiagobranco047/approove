import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganization } from "@/lib/auth";
import { databaseUnavailableResponse, isDatabaseUnavailable } from "@/lib/api-error";

export async function GET() {
  try {
    const { user, organization } = await requireOrganization();

    const tasks = await prisma.postItem.findMany({
      where: {
        assigneeId: user.id,
        productionStage: { not: "ready_for_client" },
        calendarVersion: { client: { organizationId: organization.id } },
      },
      include: {
        calendarVersion: {
          include: {
            client: { select: { slug: true, name: true } },
          },
        },
      },
      orderBy: [{ assignedAt: "desc" }, { scheduledAt: "asc" }],
      take: 20,
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Faça login para continuar" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "No organization") {
      return NextResponse.json({ tasks: [] });
    }
    if (isDatabaseUnavailable(error)) {
      const { json, status } = databaseUnavailableResponse();
      return NextResponse.json(json, { status });
    }
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
