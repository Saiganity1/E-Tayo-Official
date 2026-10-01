import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/utils/apiConfig";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BACKEND_API = getBackendApiUrl();

const globalForLogs = globalThis as unknown as {
  _etayoLogsStore: any[];
};

if (!globalForLogs._etayoLogsStore) {
  globalForLogs._etayoLogsStore = [
    {
      id: "LOG-SYS-01",
      timestamp: new Date().toISOString(),
      category: "application",
      status: "info",
      action: "APPLICATION_SUBMITTED",
      user: "Paul Payumo",
      message: "Application submitted: Single-Detached House - Locational Clearance (LC-2026-6494)",
      details: "Applicant Paul Payumo filed locational clearance for Purok 3, Brgy. San Bartolome, Sto. Tomas, Pampanga."
    },
    {
      id: "LOG-SYS-02",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      category: "security",
      status: "success",
      action: "USER_LOGIN",
      user: "admin@etayo.gov.ph",
      message: "Administrator authenticated into eTAYO Portal",
      details: "Session established · Sto. Tomas Online Permitting System"
    }
  ];
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
            return NextResponse.json(data);
          }
        }
      }
    } catch (e) {}

    return NextResponse.json(globalForLogs._etayoLogsStore, {
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
