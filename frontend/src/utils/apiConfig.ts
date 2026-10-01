/**
 * Unified API & WebSocket configuration for eTAYO.
 * Ensures consistent connection to the deployed Render backend (or local backend if specified)
 * without hardcoding localhost:8080 that breaks in production / live testing.
 */

export const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "https://e-tayo-official-by0b.onrender.com";
};

export const getBackendApiUrl = (): string => {
  const base = getApiBaseUrl();
  return base.endsWith("/api") ? base : `${base}/api`;
};

export const getWsUrl = (): string => {
  const envWs = process.env.NEXT_PUBLIC_WS_URL;
  if (envWs && envWs.trim()) {
    let ws = envWs.trim();
    if (typeof window !== "undefined" && window.location.protocol === "https:" && ws.startsWith("ws://")) {
      ws = ws.replace(/^ws:\/\//, "wss://");
    }
    return ws.endsWith("/ws") ? ws : `${ws.replace(/\/+$/, "")}/ws`;
  }

  const apiBase = getApiBaseUrl();
  if (apiBase.startsWith("https://")) {
    return apiBase.replace(/^https:\/\//, "wss://") + "/ws";
  }
  if (apiBase.startsWith("http://")) {
    // If running in browser over HTTPS, avoid mixed content WS
    if (typeof window !== "undefined" && window.location.protocol === "https:") {
      return "wss://e-tayo-official-by0b.onrender.com/ws";
    }
    return apiBase.replace(/^http:\/\//, "ws://") + "/ws";
  }
  return "wss://e-tayo-official-by0b.onrender.com/ws";
};
