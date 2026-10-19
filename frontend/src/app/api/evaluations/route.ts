import { NextResponse } from "next/server";
import { extractUserFromRequest, isStaffOrAdmin, sanitizeString } from "@/utils/security";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-backend-production.up.railway.app").replace(/\/+$/, "");
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

export async function GET(req: Request) {
  try {
    // STRICT RBAC: Staff or Administrator privileges required to inspect official evaluations
    const authUser = extractUserFromRequest(req);
    if (!isStaffOrAdmin(authUser)) {
      return NextResponse.json({ 
        error: "Forbidden: Staff or Administrator privileges required to access evaluations." 
      }, { status: 403 });
    }

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = { "Accept": "application/json" };
    if (authHeader) headers["Authorization"] = authHeader;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${BACKEND_API}/evaluations`, { headers, cache: "no-store", signal: controller.signal });
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const text = await res.text();
        if (text.trim().startsWith("[")) {
          const data = JSON.parse(text);
          if (Array.isArray(data) && data.length > 0) {
            const clean = data.filter((item: any) => !isDummyEvaluation(item));
            return NextResponse.json(clean);
          }
        }
      }
    } catch (e) {}

    const cleanLocal = (globalForEval._etayoEvaluationsStore || []).filter((item: any) => !isDummyEvaluation(item));
    return NextResponse.json(cleanLocal, { status: 200 });
  } catch (err) {
    return NextResponse.json(globalForEval._etayoEvaluationsStore || [], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    // STRICT RBAC: Staff or Administrator privileges required to submit official evaluations
    const authUser = extractUserFromRequest(req);
    if (!isStaffOrAdmin(authUser)) {
      return NextResponse.json({ 
        error: "Forbidden: Staff or Administrator privileges required to post evaluations." 
      }, { status: 403 });
    }

    const body = await req.json();
    if (body.comments) body.comments = sanitizeString(body.comments);
    if (body.evaluatorName) body.evaluatorName = sanitizeString(body.evaluatorName);

    const newEntry = {
      id: body.id || Date.now(),
      timestamp: body.timestamp || new Date().toISOString(),
      ...body
    };

    if (!isDummyEvaluation(newEntry)) {
      globalForEval._etayoEvaluationsStore.unshift(newEntry);
    }

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    if (authHeader) headers["Authorization"] = authHeader;

    try {
      const res = await fetch(`${BACKEND_API}/evaluations`, {
        method: "POST",
        headers,
        body: JSON.stringify(newEntry)
      });
      if (res && res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {}

    return NextResponse.json(newEntry, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
