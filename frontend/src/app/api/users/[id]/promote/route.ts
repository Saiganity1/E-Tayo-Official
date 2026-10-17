import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/utils/apiConfig";
import { updateUserRoleInMemory } from "../../route";
import { extractUserFromRequest, isAdmin } from "@/utils/security";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = extractUserFromRequest(req);
    if (!isAdmin(authUser)) {
      return NextResponse.json({ error: "Forbidden: Administrator privileges required" }, { status: 403 });
    }

    const { id } = await params;
    updateUserRoleInMemory(id, "ROLE_STAFF");

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
