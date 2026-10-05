import { NextResponse } from "next/server";
import { auth } from "@/auth";

/** Session presence only. Not organization-admin and not calendar agency. */
export async function GET() {
  try {
    const session = await auth();

    return NextResponse.json({
      authenticated: !!session?.user,
      user: session?.user || null,
    });
  } catch {
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }
}
