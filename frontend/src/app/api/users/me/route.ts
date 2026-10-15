import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/utils/apiConfig";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    const backendUrl = `${getBackendApiUrl()}/users/me`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(backendUrl, {
      headers: {
        "Accept": "application/json",
        "Authorization": authHeader
      },
      cache: "no-store",
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res && res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "User profile not found or expired" }, { status: res?.status || 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to reach backend" }, { status: 500 });
  }
}
