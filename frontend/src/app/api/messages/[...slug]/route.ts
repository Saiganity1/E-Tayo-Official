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

export async function GET(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  try {
    const { slug } = await params;
    const path = slug.join("/");
    const url = new URL(req.url);
    const targetUrl = `${BACKEND_API}/messages/${path}${url.search}`;

    // 1. If remote backend is available, attempt to query it
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
            return NextResponse.json(parsed);
          }
        }
      }
    } catch (e) {}

    // 2. Fallback based on requested path
    if (path === "conversations") {
      // Gather contacts from both permits and messages
      const permits = getAllPermits();
      const permitEmails = permits.map(p => p.applicantEmail).filter(Boolean);
      const msgEmails = messageStore.flatMap(m => [m.senderEmail, m.recipientEmail]).filter(Boolean);
      const allUnique = Array.from(new Set([...permitEmails, ...msgEmails]))
        .map(e => (e || "").trim().toLowerCase())
        .filter(e => e && e !== "staff@etayo.gov.ph" && e !== "admin@etayo.gov.ph");
      return NextResponse.json(allUnique, { status: 200 });
    }

    if (path === "history") {
      const user1 = (url.searchParams.get("user1") || "").trim().toLowerCase();
      const user2 = (url.searchParams.get("user2") || "").trim().toLowerCase();
      
      const filtered = messageStore.filter(m => {
        const s = (m.senderEmail || "").trim().toLowerCase();
        const r = (m.recipientEmail || "").trim().toLowerCase();
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

      return NextResponse.json(filtered, { status: 200 });
    }

    return NextResponse.json(messageStore, { status: 200 });
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
    if (!messageStore.some(m => m.id === newMsg.id || (m.content === newMsg.content && m.timestamp === newMsg.timestamp))) {
      messageStore.push(newMsg);
    }

    // Forward to remote backend asynchronously if available
    try {
      const { slug } = await params;
      const path = slug.join("/");
      const targetUrl = `${BACKEND_API}/messages/${path}`;
      fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }).catch(() => null);
    } catch (e) {}

    return NextResponse.json(newMsg, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
