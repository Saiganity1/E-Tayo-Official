import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/utils/apiConfig";
import { validatePasswordStrength } from "@/utils/authStore";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const body = await req.json();

    if (body?.newPassword) {
      const passCheck = validatePasswordStrength(String(body.newPassword));
      if (!passCheck.valid) {
        return NextResponse.json({ error: passCheck.error }, { status: 400 });
      }
    }

    const backendUrl = `${getBackendApiUrl()}/users/profile`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    if (authHeader) headers["Authorization"] = authHeader;

    const res = await fetch(backendUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res && res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    const errText = await res.text();
    return NextResponse.json({ error: errText || "Failed to update profile" }, { status: res?.status || 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
