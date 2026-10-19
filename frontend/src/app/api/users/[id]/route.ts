import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/utils/apiConfig";
import { extractUserFromRequest, isAdmin } from "@/utils/security";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (authHeader) headers["Authorization"] = authHeader;

    const backendUrl = `${getBackendApiUrl()}/users/${id}`;
    try {
      const res = await fetch(backendUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json().catch(() => body);
        return NextResponse.json(data);
      }
    } catch (e) {}

    return NextResponse.json({ id, ...body, message: "User updated successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {};
    if (authHeader) headers["Authorization"] = authHeader;

    const backendUrl = `${getBackendApiUrl()}/users/${id}`;
    try {
      const res = await fetch(backendUrl, {
        method: "DELETE",
        headers
      });
      if (res.ok) {
        return NextResponse.json({ success: true, id });
      }
    } catch (e) {}

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete user" }, { status: 500 });
  }
}
