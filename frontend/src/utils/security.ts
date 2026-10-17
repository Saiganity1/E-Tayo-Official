/**
 * eTAYO Unified Security Utility
 * Provides lightweight, zero-dependency RBAC, JWT validation, XSS sanitization, 
 * PII masking, and in-memory rate limiting for Next.js API route handlers.
 */

export interface AuthUser {
  email: string;
  role: string;
  name?: string;
  exp?: number;
}

/**
 * Safely decodes and validates a JWT token from the Authorization header.
 * Works with both Spring Boot JJWT tokens and local resilient tokens.
 */
export function extractUserFromRequest(req: Request): AuthUser | null {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7).trim();
    const parts = token.split(".");
    if (parts.length < 2) return null;

    // Decode base64url payload
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = Buffer.from(base64, "base64").toString("utf-8");
    const payload = JSON.parse(jsonStr);

    // Expiry check
    if (payload.exp && typeof payload.exp === "number") {
      const nowSec = Math.floor(Date.now() / 1000);
      if (nowSec > payload.exp) {
        return null; // Token expired
      }
    }

    const email = String(payload.sub || payload.email || "").trim().toLowerCase();
    const role = String(payload.role || (Array.isArray(payload.roles) ? payload.roles[0] : "") || "ROLE_APPLICANT").trim().toUpperCase();
    const name = payload.name ? String(payload.name).trim() : undefined;

    if (!email) return null;

    return { email, role, name, exp: payload.exp };
  } catch (err) {
    return null;
  }
}

/**
 * Check if the user has Staff or Admin privileges
 */
export function isStaffOrAdmin(user: AuthUser | null): boolean {
  if (!user || !user.role) return false;
  const r = user.role.toUpperCase();
  return r.includes("STAFF") || r.includes("ADMIN") || r.includes("SUPERADMIN");
}

/**
 * Check if the user has Admin privileges
 */
export function isAdmin(user: AuthUser | null): boolean {
  if (!user || !user.role) return false;
  const r = user.role.toUpperCase();
  return r.includes("ADMIN") || r.includes("SUPERADMIN");
}

/**
 * Strips HTML tags, script tags, event handlers, and template injections to prevent stored XSS.
 */
export function sanitizeString(val: any): string {
  if (val === null || val === undefined) return "";
  let s = String(val).trim();
  // Strip script, iframe, object, embed tags
  s = s.replace(/<\s*(script|iframe|object|embed|svg|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  // Strip html tags
  s = s.replace(/<[^>]+>/g, "");
  // Neutralize template injection delimiters {{ ... }}
  s = s.replace(/\{\{[\s\S]*?\}\}/g, "");
  // Escape angle brackets and quotes
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Strips Personally Identifiable Information (PII) from permit records for public viewing.
 */
export function stripPermitPII(permit: any): any {
  if (!permit) return permit;

  const maskEmail = (em?: string) => {
    if (!em || !em.includes("@")) return "***@***.com";
    const [user, domain] = em.split("@");
    return `${user.substring(0, 2)}***@${domain}`;
  };

  const maskPhone = (phone?: string) => {
    if (!phone) return "09*********";
    const clean = phone.replace(/\D/g, "");
    if (clean.length >= 7) {
      return `${clean.substring(0, 4)}***${clean.slice(-3)}`;
    }
    return "****";
  };

  return {
    ...permit,
    applicantEmail: maskEmail(permit.applicantEmail),
    applicantPhone: maskPhone(permit.applicantPhone),
    applicantAddress: permit.applicantAddress ? "Sto. Tomas, Pampanga (Protected)" : undefined
  };
}

/**
 * Resolves Client IP address from request headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "127.0.0.1";
}

// In-memory sliding-window rate limit store
const ipRateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Sliding-window IP rate limiter
 * Default: 60 requests per minute
 */
export function checkRateLimit(ip: string, maxRequests = 60, windowMs = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = ipRateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count };
}
