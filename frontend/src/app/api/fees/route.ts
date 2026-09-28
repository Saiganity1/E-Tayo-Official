import { NextResponse } from "next/server";

const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official.onrender.com").replace(/\/+$/, "");
const BACKEND_API = rawApi.endsWith("/api") ? rawApi : `${rawApi}/api`;

export async function GET(req: Request) {
  try {
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
