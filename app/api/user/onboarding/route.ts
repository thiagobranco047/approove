import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST() {
  try {
    const user = await requireAuth();

    await prisma.user.update({
      where: { id: user.id },
      data: { hasCompletedOnboarding: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating onboarding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
