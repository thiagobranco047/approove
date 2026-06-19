import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { authorizeShareOrSession } from "@/lib/share-access";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const { text, token } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: "Texto obrigatório" }, { status: 400 });
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

    if (!authResult.isAgency && !authResult.access?.permissions.canComment) {
      return NextResponse.json({ error: "Sem permissão para comentar" }, { status: 403 });
    }

    const session = await auth();
    const author = authResult.isAgency ? "agency" : "client";
    const authorName = authResult.isAgency
      ? session?.user?.name?.trim() || session?.user?.email?.trim() || null
      : authResult.access?.reviewer?.name ?? null;

    const comment = await prisma.comment.create({
      data: {
        postItemId: postId,
        text: text.trim(),
        author,
        authorName,
        reviewerId: authResult.isAgency ? null : authResult.access?.reviewer?.id ?? null,
      },
    });

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
