import { NextRequest, NextResponse } from "next/server";
import { validateShareToken, touchInviteAccess } from "@/lib/share-access";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("t");
    const clientSlug = request.nextUrl.searchParams.get("clientSlug") ?? undefined;
    const versionId = request.nextUrl.searchParams.get("versionId") ?? undefined;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const result = await validateShareToken(token, { clientSlug, versionId });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await touchInviteAccess(result.access.shareTokenId);

    return NextResponse.json({
      access: {
        clientSlug: result.access.clientSlug,
        calendarVersion: result.access.calendarVersion,
        reviewer: result.access.reviewer,
        permissions: result.access.permissions,
      },
    });
  } catch (error) {
    console.error("Error validating share token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
