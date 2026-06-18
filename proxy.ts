import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/admin"];
const publicPaths = ["/admin/login"];
const loginPath = "/admin/login";
const dashboardPath = "/admin";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only handle /admin/* routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Allow public paths
  if (publicPaths.some((p) => pathname === p)) {
    // If already has session cookie, redirect to dashboard
    if (request.cookies.has("brandg_session")) {
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
    return NextResponse.next();
  }

  // Check for session cookie on protected paths
  if (!request.cookies.has("brandg_session")) {
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
