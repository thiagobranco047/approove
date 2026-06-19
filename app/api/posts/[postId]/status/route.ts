import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeShareOrSession } from "@/lib/share-access";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const { status, token } = body;

    if (!["pending", "approved", "adjustments"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const post = await prisma.postItem.findUnique({
      where: { id: postId },
      include: {
        calendarVersion: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const authResult = await authorizeShareOrSession(token, post.calendarVersionId);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!authResult.isAgency && !authResult.access?.permissions.canApprove) {
      return NextResponse.json({ error: "Sem permissão para aprovar" }, { status: 403 });
    }

    const updatedPost = await prisma.postItem.update({
      where: { id: postId },
      data: { status },
    });

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error("Error updating post status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
