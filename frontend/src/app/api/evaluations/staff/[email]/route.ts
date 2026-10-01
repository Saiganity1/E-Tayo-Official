import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
const BACKEND_API = rawApi.endsWith("/api") ? rawApi : `${rawApi}/api`;

const globalForEval = globalThis as unknown as {
  _etayoEvaluationsStore: any[];
};

if (!globalForEval._etayoEvaluationsStore) {
  globalForEval._etayoEvaluationsStore = [];
}

const isDummyEvaluation = (item: any) => {
  if (!item) return true;
  const staff = String(item.staffEmail || item.evaluatorEmail || item.user || "").toLowerCase();
  const applicant = String(item.applicantEmail || "").toLowerCase();
  if (applicant.includes("citizen@example.com") || applicant.includes("business@example.com")) return true;
  if (staff === "staff@etayo.gov.ph" && (applicant === "citizen@example.com" || applicant === "business@example.com")) return true;
  return false;
};

export async function GET(
  req: Request,
  { params }: { params: { email: string } }
) {
  try {
    const rawEmail = decodeURIComponent(params.email || "").trim().toLowerCase();
    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = { "Accept": "application/json" };
    if (authHeader) headers["Authorization"] = authHeader;

    let backendLogs: any[] = [];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${BACKEND_API}/evaluations/staff/${encodeURIComponent(rawEmail)}`, {
        headers,
        cache: "no-store",
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const text = await res.text();
        if (text.trim().startsWith("[")) {
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            backendLogs = data.filter((item: any) => !isDummyEvaluation(item));
          }
        }
      }
    } catch (e) {}

    // Find local evaluations matching this staff member
    const localLogs = (globalForEval._etayoEvaluationsStore || []).filter((item: any) => {
      if (isDummyEvaluation(item)) return false;
      const sEmail = String(item.staffEmail || item.evaluatorEmail || item.user || "").toLowerCase().trim();
      return sEmail === rawEmail || sEmail.includes(rawEmail);
    });

    // Merge and deduplicate
    const logMap = new Map<string, any>();
    [...backendLogs, ...localLogs].forEach((item, idx) => {
      const key = item.id ? String(item.id) : `${item.permitType || item.applicationId}-${item.action}-${item.timestamp || idx}`;
      if (!logMap.has(key)) {
        logMap.set(key, item);
      }
    });

    const combined = Array.from(logMap.values()).sort((a, b) => {
      const tA = new Date(a.timestamp || 0).getTime();
      const tB = new Date(b.timestamp || 0).getTime();
      return tB - tA;
    });

    return NextResponse.json(combined, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache"
      }
    });
  } catch (error) {
    return NextResponse.json([], { status: 200 });
  }
}
