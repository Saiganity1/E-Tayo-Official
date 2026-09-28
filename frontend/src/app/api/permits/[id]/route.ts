import { NextResponse } from "next/server";

const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official.onrender.com").replace(/\/+$/, "");
const BACKEND_API = rawApi.endsWith("/api") ? rawApi : `${rawApi}/api`;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cleanId = encodeURIComponent(String(id || "").trim());
    const targetUrl = `${BACKEND_API}/permits/${cleanId}`;

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = { 
      "Accept": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache"
    };
    if (authHeader) headers["Authorization"] = authHeader;

    let res = await fetch(targetUrl, { headers, cache: "no-store" });
    if (!res.ok && id.toUpperCase() !== id) {
      res = await fetch(`${BACKEND_API}/permits/${encodeURIComponent(id.toUpperCase())}`, { headers, cache: "no-store" });
    }

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          "Pragma": "no-cache"
        }
      });
    }

    return NextResponse.json({ error: "Permit not found" }, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch permit" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cleanId = encodeURIComponent(String(id || "").trim());
    const body = await req.json();
    const targetUrl = `${BACKEND_API}/permits/${cleanId}`;

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    if (authHeader) headers["Authorization"] = authHeader;

    let res: Response | null = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        res = await fetch(targetUrl, {
          method: "PUT",
          headers,
          body: JSON.stringify(body)
        });
        if (res.ok) break;
      } catch (e) {
        if (attempt === 2) throw e;
      }
    }

    if (res && res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(body, { status: 200 }); // Optimistic fallback
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update permit" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cleanId = encodeURIComponent(String(id || "").trim());
    const targetUrl = `${BACKEND_API}/permits/${cleanId}`;

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {};
    if (authHeader) headers["Authorization"] = authHeader;

    const res = await fetch(targetUrl, { method: "DELETE", headers });
    return NextResponse.json({ success: res.ok }, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete permit" }, { status: 500 });
  }
}
