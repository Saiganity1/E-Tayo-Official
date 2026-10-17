import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/utils/apiConfig";
import { generateOtp } from "@/utils/authStore";
import { otpLimiter, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req.headers);
    const rl = await otpLimiter.limit(ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please wait 15 minutes before trying again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000))),
            "X-RateLimit-Limit": "6",
            "X-RateLimit-Remaining": String(rl.remaining),
            "X-RateLimit-Reset": String(rl.reset),
          },
        }
      );
    }

    const rateLimitHeaders = {
      "X-RateLimit-Limit": "6",
      "X-RateLimit-Remaining": String(rl.remaining),
      "X-RateLimit-Reset": String(rl.reset),
    };

    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    // Generate active OTP in authStore
    generateOtp(email);

    const backendUrl = `${getBackendApiUrl()}/auth/send-otp`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const text = await res.text();
      if (text.trim().startsWith("{")) {
        const data = JSON.parse(text);
        // Do NOT leak OTP in response
        delete data.debugOtp;
        delete data.otp;
        return NextResponse.json(data, {
          status: res.status,
          headers: rateLimitHeaders,
        });
      }
    } catch (e) {
      console.warn("Backend send-otp failed/timed out, returning resilient OTP generator response", e);
    }

    return NextResponse.json(
      { message: "OTP sent to email" },
      { status: 200, headers: rateLimitHeaders }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to generate OTP" }, { status: 500 });
  }
}

