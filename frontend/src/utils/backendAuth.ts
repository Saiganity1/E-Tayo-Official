/**
 * Backend Service Authentication Helper
 * Provides a reliable, cached JWT token for internal Next.js API route calls
 * to the Spring Boot Render backend so that municipal permit data can be synchronized
 * without being dropped due to client token expiration or missing Bearer headers.
 */

let cachedBackendToken: { token: string; expiresAt: number } | null = null;

export async function getBackendAdminToken(): Promise<string | null> {
  const now = Date.now();
  // Return cached token if valid for at least 5 more minutes
  if (cachedBackendToken && cachedBackendToken.expiresAt > now + 5 * 60 * 1000) {
    return cachedBackendToken.token;
  }

  try {
    const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
    const backendUrl = rawApi.endsWith("/api") ? `${rawApi}/auth/login` : `${rawApi}/api/auth/login`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: "admin@etayo.gov.ph", 
        password: "Admin#StoTomas2026!Secured" 
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.accessToken) {
        // Cache token for 12 hours (Render tokens typically last 24h)
        cachedBackendToken = {
          token: data.accessToken,
          expiresAt: now + 12 * 60 * 60 * 1000
        };
        return data.accessToken;
      }
    }
  } catch (e: any) {
    console.warn("Failed to get backend admin token for internal sync:", e?.message || e);
  }

  return null;
}
