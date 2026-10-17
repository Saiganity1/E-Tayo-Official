import { NextResponse } from "next/server";
import { getAllPermits, savePermit } from "./dataStore";
import { 
  extractUserFromRequest, 
  isStaffOrAdmin, 
  stripPermitPII, 
  getClientIp, 
  checkRateLimit, 
  sanitizeString 
} from "@/utils/security";

const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
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
        // Authenticated applicant: strictly restrict to their own email
        effectiveEmail = authUser.email;
        effectiveName = authUser.name || effectiveName;
      } else {
        // ANONYMOUS CALLER:
        // In strict compliance with RA 10173 and Security Controls:
        // If no specific permit reference ID or email lookup is provided, return empty array (0 rows)
        // to prevent open PII database dumps.
        if (!queryId && !queryEmail && !queryName) {
          return NextResponse.json([], {
            status: 200,
            headers: {
              "X-Total-Count": "0",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Pragma": "no-cache"
            }
          });
        }
      }
    }

    // 3. Fetch from remote backend if available
    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache"
    };
    if (authHeader) headers["Authorization"] = authHeader;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
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

    // 6. Asynchronously sync to remote Spring Boot backend
    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    if (authHeader) headers["Authorization"] = authHeader;

    (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        await fetch(`${BACKEND_API}/permits`, {
          method: "POST",
          headers,
          body: JSON.stringify(sanitizedApp),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (e) {}
    })();

    return NextResponse.json(savedLocally, { status: 201 });
  } catch (error: any) {
    console.warn("API /api/permits POST failed:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to submit permit" }, { status: 500 });
  }
}
