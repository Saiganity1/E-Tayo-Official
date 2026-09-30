import { NextResponse } from "next/server";
import { getAllPermits, savePermit } from "./dataStore";

const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
const BACKEND_API = rawApi.endsWith("/api") ? rawApi : `${rawApi}/api`;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const emailFilter = url.searchParams.get("email") || undefined;
    const nameFilter = url.searchParams.get("name") || undefined;
    const queryString = url.search;
    const targetUrl = `${BACKEND_API}/permits${queryString}`;

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache"
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    // Attempt to query remote backend with short timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(targetUrl, {
        method: "GET",
        headers,
        cache: "no-store",
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const text = await res.text();
        // Ensure response is actually JSON and not an HTML "Service Suspended" page
        if (text.trim().startsWith("[") || text.trim().startsWith("{")) {
          const data = JSON.parse(text);
          if (Array.isArray(data) && data.length > 0) {
            const mergedList = data.map(item => savePermit(item));
            return NextResponse.json(mergedList, {
              headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
                "Pragma": "no-cache"
              }
            });
          }
        }
      }
    } catch (netErr) {
      // Backend unavailable or suspended; proceed to resilient data store
    }

    // Resilient fallback: return permits from reliable server data store
    const localData = getAllPermits(emailFilter, nameFilter);
    return NextResponse.json(localData, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        "Pragma": "no-cache"
      }
    });
  } catch (error: any) {
    console.warn("Proxy /api/permits GET fallback:", error?.message);
    const fallback = getAllPermits();
    return NextResponse.json(fallback, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Immediately persist in server data store
    const savedLocally = savePermit(body);

    // 2. Optimistically try to sync with remote backend
    const targetUrl = `${BACKEND_API}/permits`;
    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    if (authHeader) headers["Authorization"] = authHeader;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(targetUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const text = await res.text();
        if (text.trim().startsWith("{")) {
          const data = JSON.parse(text);
          savePermit(data);
          return NextResponse.json(data);
        }
      }
    } catch (e) {
      // Background sync failed; local copy already stored safely
    }

    return NextResponse.json(savedLocally, { status: 200 });
  } catch (error: any) {
    console.warn("Proxy /api/permits POST failed:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to save permit" }, { status: 500 });
  }
}
