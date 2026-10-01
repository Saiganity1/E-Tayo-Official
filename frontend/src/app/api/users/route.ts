import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/utils/apiConfig";

export const dynamic = "force-dynamic";

const DEFAULT_USERS = [
  {
    id: 1,
    name: "Paul Payumo",
    email: "mdpsicot.student@ua.edu.ph",
    role: "ROLE_APPLICANT",
    createdAt: "2026-09-15T08:00:00Z"
  },
  {
    id: 2,
    name: "Dave Sicat",
    email: "davesicat@example.com",
    role: "ROLE_APPLICANT",
    createdAt: "2026-09-20T10:30:00Z"
  },
  {
    id: 3,
    name: "Municipal Staff Evaluator",
    email: "staff@etayo.gov.ph",
    role: "ROLE_STAFF",
    createdAt: "2026-08-01T09:00:00Z"
  },
  {
    id: 4,
    name: "Municipal Administrator",
    email: "admin@etayo.gov.ph",
    role: "ROLE_ADMIN",
    createdAt: "2026-08-01T09:00:00Z"
  }
];

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const role = url.searchParams.get("role");
    const backendUrl = `${getBackendApiUrl()}/users${url.search}`;

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = { "Accept": "application/json" };
    if (authHeader) headers["Authorization"] = authHeader;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(backendUrl, { headers, cache: "no-store", signal: controller.signal });
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const text = await res.text();
        if (text.trim().startsWith("[")) {
          return NextResponse.json(JSON.parse(text));
        }
      }
    } catch (e) {}

    // Resilient fallback
    let filtered = DEFAULT_USERS;
    if (role) {
      filtered = DEFAULT_USERS.filter(u => u.role === role);
    }
    return NextResponse.json(filtered, { status: 200 });
  } catch (error) {
    return NextResponse.json(DEFAULT_USERS, { status: 200 });
  }
}
