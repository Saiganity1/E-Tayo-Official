import { NextResponse } from "next/server";

const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official.onrender.com").replace(/\/+$/, "");
const BACKEND_API = rawApi.endsWith("/api") ? rawApi : `${rawApi}/api`;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const queryString = url.search;
    const targetUrl = `${BACKEND_API}/permits${queryString}`;

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {
      "Accept": "application/json"
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    // Call backend server-to-server (bypasses browser CORS)
    let res: Response | null = null;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    try {
      res = await fetch(targetUrl, {
        method: "GET",
        headers,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (res && res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    // Fallback if backend returned 4xx or 5xx
    const status = res ? res.status : 502;
    let errBody: any = [];
    try {
      if (res) errBody = await res.json();
    } catch (e) {
      errBody = [];
    }
    return NextResponse.json(errBody, { status });
  } catch (error: any) {
    console.warn("Proxy /api/permits GET failed:", error?.message);
    return NextResponse.json([], { status: 200 }); // Graceful empty array rather than blocking client
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const targetUrl = `${BACKEND_API}/permits`;

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    let res: Response | null = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        res = await fetch(targetUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) break;
      } catch (err) {
        if (attempt === 2) throw err;
        await new Promise(r => setTimeout(r, 500));
      }
    }

    if (res && res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(body, { status: 200 }); // Optimistic return if backend timed out
  } catch (error: any) {
    console.warn("Proxy /api/permits POST failed:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to save permit" }, { status: 500 });
  }
}
