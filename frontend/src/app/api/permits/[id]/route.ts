import { NextResponse } from "next/server";
import { getPermitById, updatePermit, deletePermit, savePermit } from "@/app/api/permits/dataStore";

const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
const BACKEND_API = rawApi.endsWith("/api") ? rawApi : `${rawApi}/api`;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cleanId = String(id || "").trim();
    const targetUrl = `${BACKEND_API}/permits/${encodeURIComponent(cleanId)}`;

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = { 
      "Accept": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache"
    };
    if (authHeader) headers["Authorization"] = authHeader;

    // 1. Check local resilient store first - return immediately if already approved or released
    const existing = getPermitById(cleanId);
    if (existing && (existing.status === "approved" || existing.status === "released")) {
      return NextResponse.json(existing, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          "Pragma": "no-cache"
        }
      });
    }

    // 2. Try remote backend with short timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      let res = await fetch(targetUrl, { headers, cache: "no-store", signal: controller.signal });
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const text = await res.text();
        if (text.trim().startsWith("{")) {
          const data = JSON.parse(text);
          if (data && data.id) {
            // Prevent demoting approved/released status with stale remote backend data
            if (existing && (existing.status === "approved" || existing.status === "released") && data.status !== "released") {
              data.status = existing.status;
              data.assessedFees = existing.assessedFees || data.assessedFees;
              data.orderOfPaymentNo = existing.orderOfPaymentNo || data.orderOfPaymentNo;
            }
            const saved = savePermit(data);
            return NextResponse.json(saved, {
              headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
                "Pragma": "no-cache"
              }
            });
          }
        }
      }
    } catch (e) {
      // Backend unavailable; fall through
    }

    // 3. If found in local store, return it
    if (existing) {
      return NextResponse.json(existing, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          "Pragma": "no-cache"
        }
      });
    }

    // 4. If not found in remote backend or local store, return 404
    return NextResponse.json({ error: "Permit not found" }, { 
      status: 404,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        "Pragma": "no-cache"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch permit" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cleanId = String(id || "").trim();
    const body = await req.json();

    // 1. Immediately update local store
    const updated = updatePermit({ ...body, id: cleanId });

    // 2. Try remote backend in background
    const targetUrl = `${BACKEND_API}/permits/${encodeURIComponent(cleanId)}`;
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
        method: "PUT",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (e) {}

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update permit" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cleanId = String(id || "").trim();
    deletePermit(cleanId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete permit" }, { status: 500 });
  }
}
