import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/utils/apiConfig";
import { verifyAndConsumeOtp, registerUser } from "@/utils/authStore";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "").trim();
    const otp = String(body?.otp || "").trim();

    if (!name || !email || !password || !otp) {
      return NextResponse.json({ error: "All fields including OTP are required" }, { status: 400 });
    }

    const backendUrl = `${getBackendApiUrl()}/auth/register`;

    // 1. Try backend registration
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, otp }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        const data = text.trim().startsWith("{") ? JSON.parse(text) : { message: "Registration successful" };
        registerUser(name, email, password, "ROLE_APPLICANT");
        return NextResponse.json({
          ...data,
          name
        }, { status: 200 });
      }
    } catch (e) {
      console.warn("Backend register timed out/failed, checking local OTP store", e);
    }

    // 2. Verify OTP against locally stored OTP
    const verification = verifyAndConsumeOtp(email, otp);
    if (!verification.valid) {
      return NextResponse.json({ 
        error: verification.error || "Invalid verification code. Please check and try again." 
      }, { status: 400 });
    }

    // Successfully register user in store
    const registered = registerUser(name, email, password, "ROLE_APPLICANT");

    return NextResponse.json({ 
      message: "Registration successful! You can now log in.",
      name: registered.name,
      email: registered.email
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Registration failed" }, { status: 500 });
  }
}
