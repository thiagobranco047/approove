import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { authorizeShareOrSession } from "@/lib/share-access";
import { isPostVisibleToClient } from "@/lib/client-content-boundary";
import {
  actorFromAuth,
  approvePost,
  invalidateApprovalIfNeeded,
  requestChanges,
  resolveClientStatusAction,
} from "@/lib/approval";

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
      return NextResponse.json({ error: authResult.error, code: "code" in authResult ? authResult.code : undefined }, { status: authResult.status });
    }

    if (!authResult.isAgency && !isPostVisibleToClient(post.productionStage)) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (!authResult.isAgency && !authResult.access?.permissions.canApprove) {
      return NextResponse.json({ error: "Sem permissão para aprovar" }, { status: 403 });
    }

    if (!authResult.isAgency && !resolveClientStatusAction(status)) {
      return NextResponse.json(
        { error: "Clientes podem aprovar ou solicitar ajustes" },
        { status: 400 }
      );
    }

    const session = authResult.isAgency ? await auth() : null;
    const actor = actorFromAuth({
      isAgency: authResult.isAgency,
      access: authResult.access,
      user: session?.user?.id
        ? {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
          }
        : null,
    });

    let updatedPost: typeof post = post;

    if (status === "approved") {
      updatedPost = ((await approvePost({ postId, actor })) as typeof post | null) ?? post;
    } else if (status === "adjustments") {
      updatedPost = ((await requestChanges({ postId, actor })) as typeof post | null) ?? post;
    } else if (status === "pending") {
      if (post.status === "approved") {
        updatedPost =
          ((await invalidateApprovalIfNeeded({
            postId,
            reason: "manual_reset",
            actor,
          })) as typeof post | null) ?? post;
      } else if (post.status !== "pending") {
        updatedPost = (await prisma.postItem.update({
          where: { id: postId },
          data: { status: "pending" },
          include: { calendarVersion: true },
        })) as typeof post;
      }
    }

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error("Error updating post status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
