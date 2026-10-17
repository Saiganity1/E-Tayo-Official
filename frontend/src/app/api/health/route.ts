import { NextResponse } from "next/server";
import packageJson from "../../../../package.json";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let status: "ok" | "degraded" = "ok";

  // Safe and cheap backend check with a fast timeout (1.5s)
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com";
  try {
    const pingTarget = backendUrl.replace(/\/+$/, "") + "/";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(pingTarget, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (!res || !res.ok) {
      // Degraded status if external backend is unreachable or not OK, but endpoint still returns 200
      status = "degraded";
    }
  } catch {
    status = "degraded";
  }

  const payload = {
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: packageJson.version || "0.1.0",
    latencyMs: Date.now() - startTime,
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Type": "application/json",
    },
  });
}
