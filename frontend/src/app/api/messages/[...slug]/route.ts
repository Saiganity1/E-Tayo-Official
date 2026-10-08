import { NextResponse } from "next/server";
import { getAllPermits } from "../../permits/dataStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
const BACKEND_API = rawApi.endsWith("/api") ? rawApi : `${rawApi}/api`;

interface StoredMessage {
  id: string | number;
  senderEmail: string;
  recipientEmail: string;
  applicationId?: string;
  content: string;
  timestamp: string;
}

// In-memory persistent message store on Next.js server instance
const messageStore: StoredMessage[] = [];

const normalizeEmail = (e: string) => {
  const norm = (e || "").trim().toLowerCase();
  if (norm === "davesicat@gmail.com" || norm.includes("dave") || norm.includes("sicat")) return "mdpsicat.student@ua.edu.ph";
  return norm;
};

export async function GET(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  try {
    const { slug } = await params;
    const path = slug.join("/");
    const url = new URL(req.url);
    const targetUrl = `${BACKEND_API}/messages/${path}${url.search}`;

    // 1. If remote backend is available, query it
    let remoteMessages: any[] = [];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(targetUrl, { 
        headers: { "Accept": "application/json" }, 
        cache: "no-store", 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const text = await res.text();
        if (text.trim().startsWith("[") || text.trim().startsWith("{")) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            remoteMessages = parsed;
          }
        }
      }
    } catch (e) {}

    // 2. Route-specific responses
    if (path === "conversations") {
      const permits = getAllPermits();
      const permitEmails = permits.map(p => p.applicantEmail).filter(Boolean);
      const msgEmails = messageStore.flatMap(m => [m.senderEmail, m.recipientEmail]).filter(Boolean);
      const remoteEmails = Array.isArray(remoteMessages) ? remoteMessages.map(c => typeof c === "string" ? c : (c?.email || c?.senderEmail || c?.recipientEmail)).filter(Boolean) : [];
      const allUnique = Array.from(new Set([...permitEmails, ...msgEmails, ...remoteEmails]))
        .map(e => normalizeEmail(e))
        .filter(e => e && e !== "staff@etayo.gov.ph" && e !== "admin@etayo.gov.ph");
      return NextResponse.json(allUnique, { status: 200 });
    }

    if (path === "history") {
      const rawUser1 = (url.searchParams.get("user1") || "").trim().toLowerCase();
      const rawUser2 = (url.searchParams.get("user2") || "").trim().toLowerCase();
      const user1 = normalizeEmail(rawUser1);
      const user2 = normalizeEmail(rawUser2);
      const reqAppId = (url.searchParams.get("applicationId") || "").trim().toLowerCase();
      
      const filteredStore = messageStore.filter(m => {
        const s = normalizeEmail(m.senderEmail);
        const r = normalizeEmail(m.recipientEmail);
        const mAppId = (m.applicationId || "").trim().toLowerCase();

        if (reqAppId && reqAppId !== "all") {
          if (mAppId === reqAppId || (m.content && m.content.toLowerCase().includes(reqAppId))) {
            return true;
          }
        }

        if (!user1 && !user2) return true;
        if (user1 && user2) {
          const isStaffAdmin1 = user1 === "staff@etayo.gov.ph" || user1 === "admin@etayo.gov.ph";
          const isStaffAdmin2 = user2 === "staff@etayo.gov.ph" || user2 === "admin@etayo.gov.ph";
          if (isStaffAdmin1) {
            return (s === user2 && (r === "staff@etayo.gov.ph" || r === "admin@etayo.gov.ph")) ||
                   ((s === "staff@etayo.gov.ph" || s === "admin@etayo.gov.ph") && r === user2);
          }
          if (isStaffAdmin2) {
            return (s === user1 && (r === "staff@etayo.gov.ph" || r === "admin@etayo.gov.ph")) ||
                   ((s === "staff@etayo.gov.ph" || s === "admin@etayo.gov.ph") && r === user1);
          }
          return (s === user1 && r === user2) || (s === user2 && r === user1);
        }
        const target = user1 || user2;
        return s === target || r === target;
      });

      // Seamlessly combine remote backend messages + local server memory messages
      const merged: any[] = [...remoteMessages];
      filteredStore.forEach(sm => {
        const exists = merged.some(rm => 
          String(rm.id) === String(sm.id) || 
          (rm.content === sm.content && Math.abs(new Date(rm.timestamp).getTime() - new Date(sm.timestamp).getTime()) < 5000)
        );
        if (!exists) {
          merged.push(sm);
        }
      });

      merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return NextResponse.json(merged, { status: 200 });
    }

    return NextResponse.json(remoteMessages.length > 0 ? remoteMessages : messageStore, { status: 200 });
  } catch (error) {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  try {
    const body = await req.json();
    const newMsg: StoredMessage = {
      id: body.id || `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      senderEmail: body.senderEmail || "staff@etayo.gov.ph",
      recipientEmail: body.recipientEmail || "applicant@etayo.gov.ph",
      applicationId: body.applicationId || "",
      content: body.content || "",
      timestamp: body.timestamp || new Date().toISOString()
    };

    // Store in-memory
    if (!messageStore.some(m => String(m.id) === String(newMsg.id) || (m.content === newMsg.content && m.timestamp === newMsg.timestamp))) {
      messageStore.push(newMsg);
    }

    // Forward to remote backend asynchronously if available (strip non-numeric id for Spring Boot Long type)
    try {
      const { slug } = await params;
      const path = slug.join("/");
      const targetUrl = `${BACKEND_API}/messages/${path}`;
      const backendPayload = { ...body };
      if (typeof backendPayload.id === "string" && !/^\d+$/.test(backendPayload.id)) {
        delete backendPayload.id;
      }
      fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendPayload)
      }).catch(() => null);
    } catch (e) {}

    return NextResponse.json(newMsg, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
