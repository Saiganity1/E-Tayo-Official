import { NextResponse } from "next/server";
import { getAllPermits, savePermit } from "./dataStore";
import { 
  extractUserFromRequest, 
  isStaffOrAdmin, 
  stripPermitPII, 
  getClientIp, 
  checkRateLimit, 
  sanitizeString,
  validateCsrf 
} from "@/utils/security";
import { getBackendAdminToken } from "@/utils/backendAuth";

const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-backend-production.up.railway.app").replace(/\/+$/, "");
const BACKEND_API = rawApi.endsWith("/api") ? rawApi : `${rawApi}/api`;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    // 1. IP Rate Limiting (60 requests per minute)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(clientIp, 60, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ 
        error: "Too many requests. Please wait a minute before retrying." 
      }, { 
        status: 429,
        headers: { "Retry-After": "60" }
      });
    }

    const url = new URL(req.url);
    const queryEmail = url.searchParams.get("email") || undefined;
    const queryName = url.searchParams.get("name") || undefined;
    const queryId = url.searchParams.get("id") || url.searchParams.get("reference") || undefined;

    // Pagination parameters
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const rawLimit = url.searchParams.get("limit");
    const hasExplicitLimit = Boolean(rawLimit);
    const limit = Math.min(50, Math.max(1, parseInt(rawLimit || "10", 10)));

    // 2. Auth & Role Gate Verification
    const authUser = extractUserFromRequest(req);
    const isPrivileged = isStaffOrAdmin(authUser);

    let effectiveEmail = queryEmail;
    let effectiveName = queryName;

    if (!isPrivileged) {
      if (authUser) {
        // Authenticated applicant: strictly restrict to their own email (Anti-IDOR)
        effectiveEmail = authUser.email;
        effectiveName = authUser.name || effectiveName;
      } else {
        // ANONYMOUS CALLER:
        // In strict compliance with RA 10173 and Anti-IDOR:
        // Unauthenticated callers cannot query by email or name.
        // Only public permit reference tracking (queryId) is allowed, which returns stripped PII.
        if (!queryId) {
          return NextResponse.json([], {
            status: 200,
            headers: {
              "X-Total-Count": "0",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Pragma": "no-cache"
            }
          });
        }
        effectiveEmail = undefined;
        effectiveName = undefined;
      }
    }

    // 3. Fetch from remote backend if available
    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache"
    };

    // Forward client bearer token if valid, or attach a valid backend admin token for privileged internal operations
    const clientToken = authHeader?.replace(/^Bearer\s+/i, "") || null;
    let tokenToForward = clientToken;

    if (!tokenToForward || tokenToForward.startsWith("admin_session") || tokenToForward.startsWith("staff_session")) {
      if (isPrivileged) {
        tokenToForward = await getBackendAdminToken();
      }
    }

    if (tokenToForward) {
      headers["Authorization"] = `Bearer ${tokenToForward}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`${BACKEND_API}/permits${url.search}`, {
        method: "GET",
        headers,
        cache: "no-store",
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const text = await res.text();
        if (text.trim().startsWith("[") || text.trim().startsWith("{")) {
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            data.forEach(item => savePermit(item));
            if (isPrivileged && !queryId && !queryEmail && !queryName && data.length > 0) {
              const totalCount = data.length;
              let sliceRecords = data;
              if (hasExplicitLimit) {
                const startIndex = (page - 1) * limit;
                sliceRecords = data.slice(startIndex, startIndex + limit);
              }
              return NextResponse.json(sliceRecords, {
                status: 200,
                headers: {
                  "X-Total-Count": String(totalCount),
                  "Content-Range": `permits 0-${sliceRecords.length}/${totalCount}`,
                  "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
                  "Pragma": "no-cache"
                }
              });
            }
          }
        }
      }
    } catch (netErr) {
      // Backend unavailable; proceed to local resilient data store
    }

    // 4. Retrieve from resilient server data store
    let records = getAllPermits(effectiveEmail, effectiveName);

    // If querying by specific ID
    if (queryId) {
      records = records.filter(r => r.id.toLowerCase() === queryId.trim().toLowerCase());
    }

    // 5. PII Masking: If anonymous lookup, strip sensitive personal data
    if (!authUser && !isPrivileged) {
      records = records.map(r => stripPermitPII(r));
    }

    const totalCount = records.length;

    // Apply pagination if explicitly requested or if result set is large
    if (hasExplicitLimit) {
      const startIndex = (page - 1) * limit;
      records = records.slice(startIndex, startIndex + limit);
    }

    return NextResponse.json(records, {
      status: 200,
      headers: {
        "X-Total-Count": String(totalCount),
        "Content-Range": `permits 0-${records.length}/${totalCount}`,
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        "Pragma": "no-cache"
      }
    });
  } catch (error: any) {
    console.warn("API /api/permits GET error:", error?.message);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const csrfCheck = validateCsrf(req);
    if (!csrfCheck.valid) {
      return NextResponse.json({ error: "Forbidden: CSRF check failed", reason: csrfCheck.reason }, { status: 403 });
    }

    // 1. IP Rate Limiting (30 creates per minute)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(clientIp, 30, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ 
        error: "Too many submissions. Please wait a minute before submitting again." 
      }, { status: 429 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // 2. Strict Input Validation (Prevents anonymous empty object row breeding)
    if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
      return NextResponse.json({ 
        error: "Missing mandatory permit application fields: permitType, applicantName, applicantEmail, and projectName are required." 
      }, { status: 400 });
    }

    const permitType = String(body.permitType || "").trim();
    const applicantName = String(body.applicantName || "").trim();
    const applicantEmail = String(body.applicantEmail || "").trim().toLowerCase();
    const projectName = String(body.projectName || "").trim();

    if (!permitType || !applicantName || !applicantEmail || !projectName) {
      return NextResponse.json({ 
        error: "Validation failed: 'permitType', 'applicantName', 'applicantEmail', and 'projectName' cannot be empty." 
      }, { status: 400 });
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(applicantEmail)) {
      return NextResponse.json({ 
        error: "Validation failed: 'applicantEmail' must be a valid email address." 
      }, { status: 400 });
    }

    // 3. User Authorization check
    const authUser = extractUserFromRequest(req);
    // If authenticated applicant, prevent submitting applications under a different email
    if (authUser && !isStaffOrAdmin(authUser) && authUser.email !== applicantEmail) {
      return NextResponse.json({ 
        error: "Unauthorized: Applicant email does not match authenticated user session." 
      }, { status: 403 });
    }

    // 4. Sanitize all incoming fields to prevent stored XSS
    const sanitizedApp = {
      ...body,
      permitType: sanitizeString(permitType),
      applicantName: sanitizeString(applicantName),
      applicantEmail: sanitizeString(applicantEmail),
      projectName: sanitizeString(projectName),
      projectAddress: sanitizeString(body.projectAddress || "Sto. Tomas, Pampanga"),
      projectDescription: sanitizeString(body.projectDescription || "")
    };

    // 5. Persist locally
    const savedLocally = savePermit(sanitizedApp);

    // 6. Synchronously sync to remote Spring Boot backend (ensures persistence before Vercel serverless freeze)
    try {
      const authHeader = req.headers.get("authorization");
      let syncToken = authHeader?.replace(/^Bearer\s+/i, "") || null;
      if (!syncToken || syncToken.startsWith("admin_session") || syncToken.startsWith("staff_session")) {
        const backendToken = await getBackendAdminToken();
        if (backendToken) syncToken = backendToken;
      }

      const syncHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json"
      };
      if (syncToken) syncHeaders["Authorization"] = `Bearer ${syncToken}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${BACKEND_API}/permits`, {
        method: "POST",
        headers: syncHeaders,
        body: JSON.stringify(sanitizedApp),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const text = await res.text();
        if (text.trim().startsWith("{")) {
          const backendRecord = JSON.parse(text);
          if (backendRecord && backendRecord.id) {
            savePermit(backendRecord);
            return NextResponse.json(backendRecord, { status: 201 });
          }
        }
      }
    } catch (e: any) {
      console.warn("Backend sync failed during permit creation:", e?.message || e);
    }

    return NextResponse.json(savedLocally, { status: 201 });
  } catch (error: any) {
    console.warn("API /api/permits POST failed:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to submit permit" }, { status: 500 });
  }
}
