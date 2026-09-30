import { NextResponse } from "next/server";
import { getPermitById, archivePermit } from "@/app/api/permits/dataStore";

const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
const BACKEND_API = rawApi.endsWith("/api") ? rawApi : `${rawApi}/api`;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cleanId = String(id || "").trim();
    const { searchParams } = new URL(req.url);
    
    let isArchived = true;
    if (searchParams.has("archived")) {
      isArchived = searchParams.get("archived") === "true";
    } else {
      try {
        const body = await req.json();
        if (typeof body.isArchived === "boolean") isArchived = body.isArchived;
        if (typeof body.archived === "boolean") isArchived = body.archived;
      } catch (e) {}
    }

    const updated = archivePermit(cleanId, isArchived);

    // Call backend endpoint in background / short timeout
    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {
      "Accept": "application/json"
    };
    if (authHeader) headers["Authorization"] = authHeader;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      await fetch(`${BACKEND_API}/permits/${encodeURIComponent(cleanId)}/archive?archived=${isArchived}`, {
        method: "PATCH",
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (e) {}

    return NextResponse.json(updated || { id: cleanId, isArchived }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update archive status" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  return PATCH(req, context);
}
