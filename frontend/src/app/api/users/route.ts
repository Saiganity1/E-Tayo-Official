import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/utils/apiConfig";

export const dynamic = "force-dynamic";

// In-memory store for dynamic user updates when backend is offline or sleeping
// Default contains ZERO staff accounts. Staff must be explicitly assigned by the Admin.
let _assignedUsersStore = [
  {
    id: 1,
    name: "Paul Payumo",
    email: "mdpsicot.student@ua.edu.ph",
    role: "ROLE_APPLICANT",
    createdAt: "2026-09-15T08:00:00Z"
  },
  {
    id: 2,
    name: "Dave Sicat",
    email: "davesicat@example.com",
    role: "ROLE_APPLICANT",
    createdAt: "2026-09-20T10:30:00Z"
  },
  {
    id: 3,
    name: "Municipal Administrator",
    email: "admin@etayo.gov.ph",
    role: "ROLE_ADMIN",
    createdAt: "2026-08-01T09:00:00Z"
  }
];

const isAutomaticDummyStaff = (u: any): boolean => {
  const email = String(u?.email || "").toLowerCase().trim();
  return email === "staff@etayo.gov.ph" || email === "dave.sicat@etayo.gov.ph";
};

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

    // Resilient fallback using in-memory store
    let filtered = _assignedUsersStore.filter(u => !isAutomaticDummyStaff(u));
    if (role) {
      filtered = filtered.filter(u => u.role === role);
    }
    return NextResponse.json(filtered, { status: 200 });
  } catch (error) {
    let fallback = _assignedUsersStore.filter(u => !isAutomaticDummyStaff(u));
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

    // Save in in-memory store
    const existingIdx = _assignedUsersStore.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (existingIdx >= 0) {
      _assignedUsersStore[existingIdx] = { ..._assignedUsersStore[existingIdx], ...newUser };
    } else {
      _assignedUsersStore.push(newUser);
    }

    return NextResponse.json(newUser, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create user" }, { status: 500 });
  }
}

// Export helper to update role in memory from promote/demote endpoints
export function updateUserRoleInMemory(id: number | string, newRole: string) {
  const numId = Number(id);
  const user = _assignedUsersStore.find(u => u.id === numId || String(u.id) === String(id));
  if (user) {
    user.role = newRole;
  }
}
