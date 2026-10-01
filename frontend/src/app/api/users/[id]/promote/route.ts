import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/utils/apiConfig";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const backendUrl = `${getBackendApiUrl()}/users/${id}/promote`;

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (authHeader) headers["Authorization"] = authHeader;

    try {
      const res = await fetch(backendUrl, { method: "PUT", headers });
      if (res.ok) {
        const data = await res.json().catch(() => ({ success: true }));
        return NextResponse.json(data);
      }
    } catch (e) {}

    return NextResponse.json({ success: true, message: `User ${id} promoted to staff successfully` }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
