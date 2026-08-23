import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authRoutes = ["/login", "/signup", "/forgot-password"];
  const isAuthRoute = authRoutes.includes(pathname);
  const protectedPrefixes = ["/dashboard", "/onboarding"];
  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isAuthRoute || isProtected) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const isLoggedIn = !!token;

    if (isAuthRoute && isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (isProtected && !isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const country =
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry");
  const requestHeaders = new Headers(req.headers);

  if (country) {
    requestHeaders.set("x-approove-country", country.toUpperCase());
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
