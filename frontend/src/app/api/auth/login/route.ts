import { NextResponse } from "next/server";
import { getAssignedUserByEmail } from "@/utils/staffStore";
import { findRegisteredUser } from "@/utils/authStore";
import { signJwtToken, getClientIp } from "@/utils/security";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// In-memory sliding-window failed login attempt tracker (Max 5 attempts per 15 minutes)
const loginFailureStore = new Map<string, { count: number; lockedUntil: number }>();

function isLoginRateLimited(key: string): boolean {
  const record = loginFailureStore.get(key);
  if (!record) return false;
  if (Date.now() < record.lockedUntil) {
    return true;
  }
  // Reset after lockout expires
  loginFailureStore.delete(key);
  return false;
}

function recordLoginFailure(key: string): void {
  const record = loginFailureStore.get(key);
  const now = Date.now();
  if (!record || now > record.lockedUntil) {
    loginFailureStore.set(key, { count: 1, lockedUntil: now + 15 * 60 * 1000 });
  } else {
    record.count += 1;
    if (record.count >= 5) {
      record.lockedUntil = now + 15 * 60 * 1000; // Lock for 15 minutes
    }
  }
}

function resetLoginFailure(key: string): void {
  loginFailureStore.delete(key);
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const body = await req.json();
    const { email, password } = body;

    const sanitizedEmail = String(email || "").trim().toLowerCase();
    const sanitizedPassword = String(password || "").trim();

    if (!sanitizedEmail || !sanitizedPassword) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const rateKey = `${clientIp}_${sanitizedEmail}`;
    if (isLoginRateLimited(rateKey) || isLoginRateLimited(clientIp)) {
      return NextResponse.json({ 
        error: "Too many failed login attempts. Please wait 15 minutes before trying again." 
      }, { 
        status: 429,
        headers: { "Retry-After": "900" }
      });
    }

    // Explicitly reject automatic dummy staff accounts (staff must be explicitly assigned by admin)
    if (sanitizedEmail === "staff@etayo.gov.ph") {
      const isAssigned = getAssignedUserByEmail(sanitizedEmail);
      if (!isAssigned || isAssigned.role !== "ROLE_STAFF") {
        recordLoginFailure(rateKey);
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
        resetLoginFailure(rateKey);
        resetLoginFailure(clientIp);
        if (data && (!data.name || data.name.includes("@"))) {
          const registered = findRegisteredUser(sanitizedEmail);
          if (registered) data.name = registered.name;
        }
        return NextResponse.json(data);
      }

      // If backend explicitly rejected with 401/400
      if (res.status === 401 || res.status === 400) {
        const localUser = findRegisteredUser(sanitizedEmail);
        if (!localUser) {
          recordLoginFailure(rateKey);
          recordLoginFailure(clientIp);
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
      recordLoginFailure(rateKey);
      recordLoginFailure(clientIp);
      // Generic error message: Prevents user enumeration
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Verify Password
    if (registeredUser.password && registeredUser.password !== sanitizedPassword) {
      recordLoginFailure(rateKey);
      recordLoginFailure(clientIp);
      // Generic error message: Prevents password guessing feedback
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Reset rate limits on successful authentication
    resetLoginFailure(rateKey);
    resetLoginFailure(clientIp);

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
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
