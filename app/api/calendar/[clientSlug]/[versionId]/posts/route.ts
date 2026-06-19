import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeCalendarView, rolePermissions, touchInviteAccess } from "@/lib/share-access";
import { attachmentVersionInclude } from "@/lib/attachment-slides";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientSlug: string; versionId: string }> }
) {
  try {
    const { clientSlug, versionId } = await params;
    const token = request.nextUrl.searchParams.get("t") ?? undefined;

    const authResult = await authorizeCalendarView(token, clientSlug, versionId);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!authResult.isAgency && authResult.access) {
      await touchInviteAccess(authResult.access.shareTokenId);
    }

    const postInclude = {
      comments: {
        orderBy: { createdAt: "asc" as const },
      },
      attachments: {
        orderBy: { order: "asc" as const },
        include: {
          versions: attachmentVersionInclude,
        },
      },
      ...(authResult.isAgency && {
        assignee: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
      }),
    };

    const posts = await prisma.postItem.findMany({
      where: {
        calendarVersionId: authResult.calendarVersionId,
      },
      include: postInclude,
      orderBy: {
        scheduledAt: "asc",
      },
    });

    return NextResponse.json({
      posts,
      isAdmin: authResult.isAgency,
      access: authResult.isAgency
        ? {
            reviewer: null,
            permissions: rolePermissions("approver"),
          }
        : {
            reviewer: authResult.access!.reviewer,
            permissions: authResult.access!.permissions,
          },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
