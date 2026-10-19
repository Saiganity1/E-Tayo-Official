/**
 * Backend Service Authentication Helper
 * Provides a reliable, cached JWT token for internal Next.js API route calls
 * to the Spring Boot Render backend so that municipal permit data can be synchronized
 * without being dropped due to client token expiration or missing Bearer headers.
 */

let cachedBackendToken: { token: string; expiresAt: number } | null = null;

export async function getBackendAdminToken(): Promise<string | null> {
  // Disabled: No automated background logins for admin@etayo.gov.ph to prevent spamming login logs
  return null;
}
