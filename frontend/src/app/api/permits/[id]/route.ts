import { NextResponse } from "next/server";
import { getPermitById, updatePermit, deletePermit, savePermit } from "@/app/api/permits/dataStore";
import { 
  extractUserFromRequest, 
  isStaffOrAdmin, 
  isAdmin, 
  stripPermitPII, 
  sanitizeString 
} from "@/utils/security";

const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
const BACKEND_API = rawApi.endsWith("/api") ? rawApi : `${rawApi}/api`;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cleanId = String(id || "").trim();
    const targetUrl = `${BACKEND_API}/permits/${encodeURIComponent(cleanId)}`;

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = { 
      "Accept": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache"
    };
    if (authHeader) headers["Authorization"] = authHeader;

    const authUser = extractUserFromRequest(req);
    const isPrivileged = isStaffOrAdmin(authUser);

    // 1. Check local resilient store first
    let existing = getPermitById(cleanId);

    // 2. Try remote backend with short timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(targetUrl, { headers, cache: "no-store", signal: controller.signal });
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const text = await res.text();
        if (text.trim().startsWith("{")) {
          const data = JSON.parse(text);
          if (data && data.id) {
            if (existing && (existing.status === "approved" || existing.status === "released") && data.status !== "released") {
              data.status = existing.status;
              data.assessedFees = existing.assessedFees || data.assessedFees;
              data.orderOfPaymentNo = existing.orderOfPaymentNo || data.orderOfPaymentNo;
            }
            existing = savePermit(data);
          }
        }
      }
    } catch (e) {
      // Backend unavailable; fall through
    }

    if (!existing) {
      return NextResponse.json({ error: "Permit not found" }, { status: 404 });
    }

    // 3. PII Gate: If anonymous or unauthorized applicant, strip PII
    if (!isPrivileged) {
      if (!authUser || (existing.applicantEmail && authUser.email !== existing.applicantEmail.toLowerCase())) {
        existing = stripPermitPII(existing);
      }
    }

    return NextResponse.json(existing, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        "Pragma": "no-cache"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch permit" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cleanId = String(id || "").trim();

    // STRICT RBAC GATE: Staff or Admin role required to approve, evaluate, or modify permits
    const authUser = extractUserFromRequest(req);
    if (!isStaffOrAdmin(authUser)) {
      return NextResponse.json({ 
        error: "Forbidden: Staff or Administrator privileges required to evaluate or modify permits." 
      }, { status: 403 });
    }

    const body = await req.json();

    // Sanitize any textual updates to prevent Stored XSS
    if (body.applicantName) body.applicantName = sanitizeString(body.applicantName);
    if (body.remarks) body.remarks = sanitizeString(body.remarks);
    if (body.projectName) body.projectName = sanitizeString(body.projectName);

    // Record audit actor
    body.evaluatedBy = authUser?.name || authUser?.email || "Staff Evaluator";

    // 1. Update local store
    const updated = updatePermit({ ...body, id: cleanId });

    // 2. Sync to remote backend in background
    const targetUrl = `${BACKEND_API}/permits/${encodeURIComponent(cleanId)}`;
    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    if (authHeader) headers["Authorization"] = authHeader;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      await fetch(targetUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (e) {}

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update permit" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cleanId = String(id || "").trim();

    // STRICT RBAC GATE: Admin role strictly required to delete permits
    const authUser = extractUserFromRequest(req);
    if (!isAdmin(authUser)) {
      return NextResponse.json({ 
        error: "Forbidden: Administrator privileges required to delete permit records." 
      }, { status: 403 });
    }

    deletePermit(cleanId);

    // Call backend endpoint in background
    const targetUrl = `${BACKEND_API}/permits/${encodeURIComponent(cleanId)}`;
    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = { "Accept": "application/json" };
    if (authHeader) headers["Authorization"] = authHeader;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      await fetch(targetUrl, { method: "DELETE", headers, signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (e) {}

    return NextResponse.json({ success: true, message: `Permit ${cleanId} deleted successfully.` }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete permit" }, { status: 500 });
  }
}
