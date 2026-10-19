import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/superadmin")) {
    const role = request.cookies.get("role")?.value;

    // If authenticated as staff or applicant, redirect to their respective dashboard
    if (role === "ROLE_STAFF") {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    }
    if (role === "ROLE_APPLICANT") {
      return NextResponse.redirect(new URL("/applicant/dashboard", request.url));
    }

    // ROLE_SUPERADMIN, ROLE_ADMIN, or unauthenticated users can access /superadmin
    // (AdminApp handles both logged-in admins/superadmins and provides a standalone login screen)
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/superadmin/:path*"],
};
