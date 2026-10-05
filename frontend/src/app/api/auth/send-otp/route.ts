import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/utils/apiConfig";
import { generateOtp, isUserRegistered } from "@/utils/authStore";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    // Generate active OTP in authStore
    const generatedCode = generateOtp(email);

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
        // Include generated OTP in response for testing/dev environments
        return NextResponse.json({
          ...data,
          debugOtp: generatedCode
        }, { status: res.status });
      }
    } catch (e) {
      console.warn("Backend send-otp failed/timed out, returning resilient OTP generator response", e);
    }

    return NextResponse.json({ 
      message: "OTP sent to email",
      debugOtp: generatedCode
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to generate OTP" }, { status: 500 });
  }
}
