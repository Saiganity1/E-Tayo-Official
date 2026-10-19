import { NextResponse } from "next/server";
import { extractUserFromRequest, isAdmin, getClientIp, checkRateLimit } from "@/utils/security";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-backend-production.up.railway.app").replace(/\/+$/, "");
const BACKEND_API = rawApi.endsWith("/api") ? rawApi : `${rawApi}/api`;

export async function GET(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(clientIp, 100, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = { "Accept": "application/json" };
    if (authHeader) headers["Authorization"] = authHeader;

    const res = await fetch(`${BACKEND_API}/fees`, { headers, cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    return NextResponse.json([], { status: 200 });
  } catch (e: any) {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = extractUserFromRequest(req);
    if (!isAdmin(authUser)) {
      return NextResponse.json({ error: "Forbidden: Administrator privileges required to configure fees" }, { status: 403 });
    }

    const body = await req.json();
    const res = await fetch(`${BACKEND_API}/fees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to create fee configuration" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authUser = extractUserFromRequest(req);
    if (!isAdmin(authUser)) {
      return NextResponse.json({ error: "Forbidden: Administrator privileges required to modify fees" }, { status: 403 });
    }

    const body = await req.json();
    const id = body.id || "";
    const res = await fetch(`${BACKEND_API}/fees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to update fee configuration" }, { status: 500 });
  }
}
