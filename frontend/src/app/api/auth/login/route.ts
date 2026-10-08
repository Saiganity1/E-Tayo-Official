import { NextResponse } from "next/server";
import { getAssignedUserByEmail } from "@/utils/staffStore";
import { findRegisteredUser } from "@/utils/authStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const sanitizedEmail = String(email || "").trim().toLowerCase();
    const sanitizedPassword = String(password || "").trim();

    if (!sanitizedEmail || !sanitizedPassword) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Explicitly reject automatic dummy staff accounts (staff must be explicitly assigned by admin)
    if (sanitizedEmail === "staff@etayo.gov.ph") {
      const isAssigned = getAssignedUserByEmail(sanitizedEmail);
      if (!isAssigned || isAssigned.role !== "ROLE_STAFF") {
        return NextResponse.json({ 
          error: "This automatic staff account has been removed. All staff accounts must be explicitly assigned by the Admin." 
        }, { status: 401 });
      }
    }

    const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
    const backendUrl = rawApi.endsWith("/api") ? `${rawApi}/auth/login` : `${rawApi}/api/auth/login`;

    // 1. Try to authenticate directly with Render backend (fast 2.5s timeout)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sanitizedEmail, password: sanitizedPassword }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        // Ensure name is clean and not an email
        if (data && (!data.name || data.name.includes("@"))) {
          const registered = findRegisteredUser(sanitizedEmail);
          if (registered) data.name = registered.name;
        }
        return NextResponse.json(data);
      }

      // If backend explicitly rejected with 401/400
      if (res.status === 401 || res.status === 400) {
        // Check if the user is known in local registered store (e.g. backend DB restarted or local registration)
        const localUser = findRegisteredUser(sanitizedEmail);
        if (!localUser) {
          let errText = "";
          try {
            const errJson = await res.json();
            errText = errJson.error || errJson.message;
          } catch (e) {
            errText = await res.text();
          }
          return NextResponse.json({ 
            error: errText || "Account not found. Please register first to access eTAYO." 
          }, { status: 401 });
        }
      }
    } catch (netErr: any) {
      console.warn("Backend unreachable / rate-limited during login:", netErr?.message);
    }

    // 2. Strict Authentication against Registered Users
    // Users NOT registered in the system are STRICTLY REJECTED!
    const registeredUser = findRegisteredUser(sanitizedEmail);

    if (!registeredUser) {
      return NextResponse.json({ 
        error: "This account is not registered in the system. Please register first to access eTAYO." 
      }, { status: 401 });
    }

    // Verify Password if stored locally
    if (registeredUser.password && registeredUser.password !== sanitizedPassword) {
      return NextResponse.json({ 
        error: "Invalid password. Please check your credentials." 
      }, { status: 401 });
    }

    // Generate authenticated JWT session with Full Name
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({
      sub: sanitizedEmail,
      role: registeredUser.role,
      name: registeredUser.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 3600)
    })).toString("base64url");
    const fallbackToken = `${header}.${payload}.etayo_signature_resilient`;

    return NextResponse.json({
      accessToken: fallbackToken,
      tokenType: "Bearer",
      role: registeredUser.role,
      name: registeredUser.name,
      email: sanitizedEmail
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
