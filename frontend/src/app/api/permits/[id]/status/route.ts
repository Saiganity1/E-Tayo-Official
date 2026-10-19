import { NextResponse } from "next/server";
import { patchPermitStatus } from "@/app/api/permits/dataStore";
import { extractUserFromRequest, isStaffOrAdmin, sanitizeString } from "@/utils/security";

const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-backend-production.up.railway.app").replace(/\/+$/, "");
const BACKEND_API = rawApi.endsWith("/api") ? rawApi : `${rawApi}/api`;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cleanId = String(id || "").trim();

    // STRICT RBAC: Staff or Admin role required to approve/change status
    const authUser = extractUserFromRequest(req);
    if (!isStaffOrAdmin(authUser)) {
      return NextResponse.json({ 
        error: "Forbidden: Staff or Administrator privileges required to change permit status." 
      }, { status: 403 });
    }

    const body = await req.json();
    if (body.remarks) body.remarks = sanitizeString(body.remarks);

    // 1. Immediately update local data store
    const patched = patchPermitStatus(cleanId, body.status, body.remarks, {
      assessedFees: body.assessedFees !== undefined ? Number(body.assessedFees) : undefined,
      estimatedFees: body.estimatedFees !== undefined ? Number(body.estimatedFees) : undefined,
      orderOfPaymentNo: body.orderOfPaymentNo,
      paymentStatus: body.paymentStatus,
      dateApproved: body.dateApproved
    });

    // 2. Try remote backend in background
    const targetUrl = `${BACKEND_API}/permits/${encodeURIComponent(cleanId)}/status`;
    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    if (authHeader) headers["Authorization"] = authHeader;

    let backendSuccess = false;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(targetUrl, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) backendSuccess = true;
    } catch (e) {}

    // 3. Fallback direct email notification if backend didn't handle it or local store is primary
    if (!backendSuccess && patched && patched.applicantEmail) {
      try {
        const { sendApplicationStatusEmailDirect } = await import("@/app/api/permits/emailHelper");
        sendApplicationStatusEmailDirect({
          toEmail: patched.applicantEmail,
          applicantName: patched.applicantName,
          applicationId: patched.id,
          permitType: patched.permitType,
          projectName: patched.projectName,
          projectAddress: patched.projectAddress,
          newStatus: body.status,
          remarks: body.remarks,
          evaluatorName: body.evaluatedBy || body.assignedStaff || "Municipal Evaluator"
        });
      } catch (err) {}
    }

    return NextResponse.json(patched || body, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to patch permit status" }, { status: 500 });
  }
}

export const PUT = PATCH;
