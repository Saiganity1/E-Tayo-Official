import crypto from "crypto";

/**
 * Backend Service Authentication Helper
 * Provides a reliable, cryptographically signed JWT token for internal Next.js API route calls
 * to the Spring Boot backend so that municipal permit data can be synchronized
 * without being dropped due to client token expiration or missing Bearer headers.
 */

let cachedBackendToken: { token: string; expiresAt: number } | null = null;

export function createBackendSystemToken(email = "admin@gmail.com", role = "ROLE_ADMIN", name = "Administrator"): string {
  const secret = process.env.JWT_SECRET || "Dave112005";
  const sha256Secret = crypto.createHash("sha256").update(secret, "utf-8").digest();
  
  const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    sub: email,
    role: role,
    name: name,
    iat: now,
    exp: now + 86400 // 24 hours
  })).toString("base64url");
  
  const signature = crypto.createHmac("sha256", sha256Secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

export async function getBackendAdminToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedBackendToken && cachedBackendToken.expiresAt > now + 60000) {
    return cachedBackendToken.token;
  }
  const token = createBackendSystemToken();
  cachedBackendToken = {
    token,
    expiresAt: now + (23 * 3600 * 1000)
  };
  return token;
}
