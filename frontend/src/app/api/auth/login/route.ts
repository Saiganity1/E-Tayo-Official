import { NextResponse } from "next/server";
import { getAssignedUserByEmail } from "@/utils/staffStore";
import { findRegisteredUser } from "@/utils/authStore";
import { signJwtToken } from "@/utils/security";
import { loginLimiter, clientIp as getRealClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const clientIp = getRealClientIp(req.headers);
    const rl = await loginLimiter.limit(clientIp);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many failed login attempts. Please wait 15 minutes before trying again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000))),
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": String(rl.remaining),
            "X-RateLimit-Reset": String(rl.reset),
          },
        }
      );
    }

    const rateLimitHeaders = {
      "X-RateLimit-Limit": "5",
      "X-RateLimit-Remaining": String(rl.remaining),
      "X-RateLimit-Reset": String(rl.reset),
    };

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
        return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
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
        if (data && (!data.name || data.name.includes("@"))) {
          const registered = findRegisteredUser(sanitizedEmail);
          if (registered) data.name = registered.name;
        }
        return NextResponse.json(data, { headers: rateLimitHeaders });
      }

      // If backend explicitly rejected with 401/400
      if (res.status === 401 || res.status === 400) {
        const localUser = findRegisteredUser(sanitizedEmail);
        if (!localUser) {
          // Generic error message: Prevents user enumeration
          return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
        }
      }
    } catch (netErr: any) {
      console.warn("Backend unreachable / rate-limited during login:", netErr?.message);
    }

    // 2. Strict Authentication against Registered Users
    const registeredUser = findRegisteredUser(sanitizedEmail);

    if (!registeredUser) {
      // Generic error message: Prevents user enumeration
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Verify Password
    if (registeredUser.password && registeredUser.password !== sanitizedPassword) {
      // Generic error message: Prevents password guessing feedback
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Generate authenticated JWT session with cryptographically secure HMAC-SHA256 signature
    const accessToken = signJwtToken({
      sub: sanitizedEmail,
      role: registeredUser.role,
      name: registeredUser.name
    });

    return NextResponse.json({
      accessToken,
      tokenType: "Bearer",
      role: registeredUser.role,
      name: registeredUser.name,
      email: sanitizedEmail
    }, { headers: rateLimitHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
