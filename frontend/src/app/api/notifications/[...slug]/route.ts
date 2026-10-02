import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
const BACKEND_API = rawApi.endsWith("/api") ? rawApi : `${rawApi}/api`;

const DEFAULT_NOTIFICATIONS = [
  {
    id: 1,
    title: "Application Received",
    message: "Your application for Locational Clearance (LC-2026-6494) has been safely received by the Municipal Planning and Development Office.",
    timestamp: new Date().toISOString(),
    isRead: false,
    recipientEmail: "mdpsicat.student@ua.edu.ph"
  },
  {
    id: 2,
    title: "Document Verification in Progress",
    message: "Zoning evaluators are reviewing your submitted tax declaration and site development plans.",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    isRead: false,
    recipientEmail: "mdpsicat.student@ua.edu.ph"
  }
];

export async function GET(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  try {
    const { slug } = await params;
    const path = slug.join("/");
    const targetUrl = `${BACKEND_API}/notifications/${path}`;

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = { "Accept": "application/json" };
    if (authHeader) headers["Authorization"] = authHeader;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(targetUrl, { headers, cache: "no-store", signal: controller.signal });
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const text = await res.text();
        if (text.trim().startsWith("[")) {
          return NextResponse.json(JSON.parse(text));
        }
      }
    } catch (e) {}

    return NextResponse.json(DEFAULT_NOTIFICATIONS, { status: 200 });
  } catch (error) {
    return NextResponse.json(DEFAULT_NOTIFICATIONS, { status: 200 });
  }
}

export async function PUT(req: Request) {
  return NextResponse.json({ success: true }, { status: 200 });
}

export async function POST(req: Request) {
  return NextResponse.json({ success: true }, { status: 200 });
}
