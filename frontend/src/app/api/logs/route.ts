import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/utils/apiConfig";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BACKEND_API = getBackendApiUrl();

const globalForLogs = globalThis as unknown as {
  _etayoLogsStore: any[];
};

if (!globalForLogs._etayoLogsStore) {
  globalForLogs._etayoLogsStore = [];
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = { "Accept": "application/json" };
    if (authHeader) headers["Authorization"] = authHeader;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${BACKEND_API}/logs`, { headers, cache: "no-store", signal: controller.signal });
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const text = await res.text();
        if (text.trim().startsWith("[")) {
          const data = JSON.parse(text);
          if (Array.isArray(data) && data.length > 0) {
            const clean = data.filter((l: any) => {
              if (!l) return false;
              const id = String(l.id || "");
              const u = String(l.user || l.userEmail || "").toLowerCase();
              if (id.startsWith("LOG-SYS-BASE-") || id === "LOG-SYS-01" || id === "LOG-SYS-02") return false;
              if (u.includes("citizen@example.com") || u.includes("business@example.com")) return false;
              return true;
            });
            return NextResponse.json(clean);
          }
        }
      }
    } catch (e) {}

    const cleanLocal = (globalForLogs._etayoLogsStore || []).filter((l: any) => {
      if (!l) return false;
      const id = String(l.id || "");
      const u = String(l.user || l.userEmail || "").toLowerCase();
      if (id.startsWith("LOG-SYS-BASE-") || id === "LOG-SYS-01" || id === "LOG-SYS-02") return false;
      if (u.includes("citizen@example.com") || u.includes("business@example.com")) return false;
      return true;
    });

    return NextResponse.json(cleanLocal, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache"
      }
    });
  } catch (error) {
    return NextResponse.json(globalForLogs._etayoLogsStore, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...body
    };
    globalForLogs._etayoLogsStore.unshift(newLog);

    try {
      const authHeader = req.headers.get("authorization");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authHeader) headers["Authorization"] = authHeader;
      fetch(`${BACKEND_API}/logs`, { method: "POST", headers, body: JSON.stringify(newLog) }).catch(() => {});
    } catch (e) {}

    return NextResponse.json(newLog, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
