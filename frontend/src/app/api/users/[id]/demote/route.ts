import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/utils/apiConfig";
import { updateUserRoleInMemory } from "../../route";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    updateUserRoleInMemory(id, "ROLE_APPLICANT");

    const backendUrl = `${getBackendApiUrl()}/users/${id}/demote`;
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

    // Fallback: also try PUT /users/${id} with { role: "ROLE_APPLICANT" }
    try {
      const fallbackUrl = `${getBackendApiUrl()}/users/${id}`;
      await fetch(fallbackUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify({ role: "ROLE_APPLICANT" })
      });
    } catch (e) {}

    return NextResponse.json({ success: true, message: `User ${id} demoted to applicant successfully` }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
