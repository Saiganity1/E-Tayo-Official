import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/superadmin")) {
    const token = request.cookies.get("token")?.value;
    const role = request.cookies.get("role")?.value;

    // 1. Unauthenticated -> 307 Redirect to /login
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Authenticated but not SUPERADMIN -> Redirect to proper user dashboard
    if (role !== "ROLE_SUPERADMIN") {
      if (role === "ROLE_ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      if (role === "ROLE_STAFF") {
        return NextResponse.redirect(new URL("/staff/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/applicant/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/superadmin/:path*"],
};
