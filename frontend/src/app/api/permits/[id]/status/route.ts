import { NextResponse } from "next/server";
import { patchPermitStatus } from "@/app/api/permits/dataStore";

const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official.onrender.com").replace(/\/+$/, "");
const BACKEND_API = rawApi.endsWith("/api") ? rawApi : `${rawApi}/api`;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cleanId = String(id || "").trim();
    const body = await req.json();

    // 1. Immediately update local data store
    const patched = patchPermitStatus(cleanId, body.status, body.remarks);

    // 2. Try remote backend in background
    const targetUrl = `${BACKEND_API}/permits/${encodeURIComponent(cleanId)}/status`;
    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    if (authHeader) headers["Authorization"] = authHeader;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      await fetch(targetUrl, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (e) {}

    return NextResponse.json(patched || body, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to patch permit status" }, { status: 500 });
  }
}
