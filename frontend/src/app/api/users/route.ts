import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/utils/apiConfig";
import { 
  getAssignedUsers, 
  addOrUpdateAssignedUser, 
  updateUserRole, 
  getAssignedUserByEmail,
  isAutomaticDummyStaff 
} from "@/utils/staffStore";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const role = url.searchParams.get("role");
    const backendUrl = `${getBackendApiUrl()}/users${url.search}`;

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = { "Accept": "application/json" };
    if (authHeader) headers["Authorization"] = authHeader;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(backendUrl, { headers, cache: "no-store", signal: controller.signal });
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const text = await res.text();
        if (text.trim().startsWith("[")) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            // Strictly filter out any legacy dummy staff accounts
            const cleaned = parsed.filter(u => !isAutomaticDummyStaff(u));
            return NextResponse.json(cleaned);
          }
        }
      }
    } catch (e) {}

    // Resilient fallback using shared staffStore
    const filtered = getAssignedUsers(role);
    return NextResponse.json(filtered, { status: 200 });
  } catch (error) {
    const fallback = getAssignedUsers();
    return NextResponse.json(fallback, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, role, password } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();
    const cleanRole = String(role || "ROLE_APPLICANT").trim();

    const newUser = {
      id: Date.now(),
      name: cleanName,
      email: cleanEmail,
      role: cleanRole,
      createdAt: new Date().toISOString()
    };

    // Forward to Render backend
    try {
      const backendUrl = `${getBackendApiUrl()}/users`;
      const authHeader = req.headers.get("authorization");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authHeader) headers["Authorization"] = authHeader;

      const res = await fetch(backendUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          role: cleanRole,
          password: password || "password123"
        })
      });

      if (res && res.ok) {
        const backendUser = await res.json().catch(() => null);
        if (backendUser && backendUser.id) {
          newUser.id = backendUser.id;
        }
      }
    } catch (err) {}

    // Save in shared store
    const saved = addOrUpdateAssignedUser(newUser);

    return NextResponse.json(saved, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create user" }, { status: 500 });
  }
}

// Re-export helpers for promote/demote endpoints and backwards compatibility
export { updateUserRole as updateUserRoleInMemory, getAssignedUserByEmail };
