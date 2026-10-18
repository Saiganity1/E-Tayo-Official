import { NextResponse } from "next/server";
import { getPermitById, updatePermit, deletePermit, savePermit } from "@/app/api/permits/dataStore";
import { 
  extractUserFromRequest, 
  isStaffOrAdmin, 
  isAdmin, 
  stripPermitPII, 
  sanitizeString,
  validateCsrf 
} from "@/utils/security";
import { getBackendAdminToken } from "@/utils/backendAuth";

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

    const authUser = extractUserFromRequest(req);
    const isPrivileged = isStaffOrAdmin(authUser);

    let tokenToForward = authHeader?.replace(/^Bearer\s+/i, "") || null;
    if (isPrivileged || !tokenToForward || tokenToForward.startsWith("admin_session") || tokenToForward.startsWith("staff_session")) {
      const backendToken = await getBackendAdminToken();
      if (backendToken) tokenToForward = backendToken;
    }
    if (tokenToForward) headers["Authorization"] = `Bearer ${tokenToForward}`;

    // 1. Check local resilient store first
    let existing = getPermitById(cleanId);

    // 2. Try remote backend with safe timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
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

    // 3. IDOR Gate: Verify permit ownership for applicant or require Staff/Admin privileges
    if (!isPrivileged) {
      if (!authUser) {
        // Mask PII for public verification queries without revealing sensitive applicant data
        existing = stripPermitPII(existing);
      } else {
        const permitEmail = String(existing.applicantEmail || "").toLowerCase().trim();
        const userEmail = String(authUser.email || "").toLowerCase().trim();

        if (permitEmail && permitEmail !== userEmail) {
          return NextResponse.json({ 
            error: "Forbidden: You are not authorized to access this permit record." 
          }, { status: 403 });
        }
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
    const csrfCheck = validateCsrf(req);
    if (!csrfCheck.valid) {
      return NextResponse.json({ error: "Forbidden: CSRF check failed", reason: csrfCheck.reason }, { status: 403 });
    }

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

    // 2. Sync to remote backend
    const targetUrl = `${BACKEND_API}/permits/${encodeURIComponent(cleanId)}`;
    try {
      const authHeader = req.headers.get("authorization");
      let syncToken = authHeader?.replace(/^Bearer\s+/i, "") || null;
      if (!syncToken || syncToken.startsWith("admin_session") || syncToken.startsWith("staff_session")) {
        const backendToken = await getBackendAdminToken();
        if (backendToken) syncToken = backendToken;
      }
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json"
      };
      if (syncToken) headers["Authorization"] = `Bearer ${syncToken}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
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
    const csrfCheck = validateCsrf(req);
    if (!csrfCheck.valid) {
      return NextResponse.json({ error: "Forbidden: CSRF check failed", reason: csrfCheck.reason }, { status: 403 });
    }

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

    // Call backend endpoint
    const targetUrl = `${BACKEND_API}/permits/${encodeURIComponent(cleanId)}`;
    try {
      const authHeader = req.headers.get("authorization");
      let syncToken = authHeader?.replace(/^Bearer\s+/i, "") || null;
      if (!syncToken || syncToken.startsWith("admin_session") || syncToken.startsWith("staff_session")) {
        const backendToken = await getBackendAdminToken();
        if (backendToken) syncToken = backendToken;
      }
      const headers: Record<string, string> = { "Accept": "application/json" };
      if (syncToken) headers["Authorization"] = `Bearer ${syncToken}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      await fetch(targetUrl, { method: "DELETE", headers, signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (e) {}

    return NextResponse.json({ success: true, message: `Permit ${cleanId} deleted successfully.` }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete permit" }, { status: 500 });
  }
}
