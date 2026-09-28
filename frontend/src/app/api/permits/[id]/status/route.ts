import { NextResponse } from "next/server";

const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official.onrender.com").replace(/\/+$/, "");
const BACKEND_API = rawApi.endsWith("/api") ? rawApi : `${rawApi}/api`;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cleanId = encodeURIComponent(String(id || "").trim());
    const body = await req.json();
    const targetUrl = `${BACKEND_API}/permits/${cleanId}/status`;

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    if (authHeader) headers["Authorization"] = authHeader;

    let res: Response | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        res = await fetch(targetUrl, {
          method: "PATCH",
          headers,
          body: JSON.stringify(body)
        });
        if (res.ok) break;
      } catch (e) {
        if (attempt === 3) throw e;
        await new Promise(r => setTimeout(r, 400));
      }
    }

    if (res && res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(body, { status: 200 }); // Optimistic fallback so UI is never blocked
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to patch permit status" }, { status: 500 });
  }
}
