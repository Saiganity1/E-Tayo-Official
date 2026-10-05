"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, Mail, User, ShieldCheck, ArrowLeft, ArrowRight, Eye, EyeOff, RotateCw, CheckCircle2, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const [step, setStep] = useState<"details" | "verification">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  // 2-Minute (120s) Resend OTP Timer
  const [timer, setTimer] = useState<number>(120);
  const [canResend, setCanResend] = useState<boolean>(false);

  const router = useRouter();

  // Manage 2-minute countdown timer when on verification step
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (step === "verification" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    if (!name.trim()) {
      setErrorMsg("Please enter your Full Name");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const sanitizedEmail = email.trim().toLowerCase();
      let response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sanitizedEmail }),
      }).catch(() => null);

      if (!response || !response.ok) {
        const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
        const backendUrl = rawApi.endsWith("/api") ? `${rawApi}/auth/send-otp` : `${rawApi}/api/auth/send-otp`;
        response = await fetch(backendUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: sanitizedEmail }),
        }).catch(() => null);
      }

      if (response && !response.ok) {
        let errorMessage = "Failed to send verification code";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = await response.text() || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Check if debug OTP is provided for quick validation
      if (response) {
        try {
          const data = await response.clone().json();
          if (data.debugOtp) {
            setDebugOtp(data.debugOtp);
            console.info(`[eTAYO OTP Generator] 6-digit Code for ${sanitizedEmail}:`, data.debugOtp);
          }
        } catch (e) {}
      }

      setStep("verification");
      setTimer(120); // Reset timer to 2 minutes (120 seconds)
      setCanResend(false);
      setInfoMsg(`A 6-digit verification code has been generated and sent to ${sanitizedEmail}.`);
    } catch (err: any) {
      setErrorMsg(err.message || "Network Error: Failed to fetch");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isResending) return;
    setErrorMsg("");
    setInfoMsg("");
    setIsResending(true);

    try {
      const sanitizedEmail = email.trim().toLowerCase();
      let response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sanitizedEmail }),
      }).catch(() => null);

      if (!response || !response.ok) {
        const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
        const backendUrl = rawApi.endsWith("/api") ? `${rawApi}/auth/send-otp` : `${rawApi}/api/auth/send-otp`;
        response = await fetch(backendUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: sanitizedEmail }),
        }).catch(() => null);
      }

      if (response && !response.ok) {
        let errorMessage = "Failed to resend code";
        try {
          const errData = await response.json();
          errorMessage = errData.error || errorMessage;
        } catch (e) {
          errorMessage = await response.text() || errorMessage;
        }
        throw new Error(errorMessage);
      }

      if (response) {
        try {
          const data = await response.clone().json();
          if (data.debugOtp) {
            setDebugOtp(data.debugOtp);
            console.info(`[eTAYO OTP Generator] New 6-digit Code for ${sanitizedEmail}:`, data.debugOtp);
          }
        } catch (e) {}
      }

      // Reset countdown back to 2 minutes
      setTimer(120);
      setCanResend(false);
      setOtp(""); // Clear previous input
      setInfoMsg("A new 6-digit verification code has been sent to your email.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMsg("Please enter the complete 6-digit verification code");
      return;
    }

    setIsLoading(true);

    try {
      const sanitizedName = name.trim();
      const sanitizedEmail = email.trim().toLowerCase();
      const sanitizedPassword = password.trim();
      const sanitizedOtp = otp.trim();

      let response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: sanitizedName, 
          email: sanitizedEmail, 
          password: sanitizedPassword, 
          otp: sanitizedOtp 
        }),
      }).catch(() => null);

      if (!response || !response.ok) {
        const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
        const backendUrl = rawApi.endsWith("/api") ? `${rawApi}/auth/register` : `${rawApi}/api/auth/register`;
        response = await fetch(backendUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name: sanitizedName, 
            email: sanitizedEmail, 
            password: sanitizedPassword, 
            otp: sanitizedOtp 
          }),
        }).catch(() => null);
      }

      if (response && !response.ok) {
        let errorMessage = "Registration failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = await response.text() || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Persistently register user in browser localStorage
      if (typeof window !== "undefined") {
        try {
          const registeredUsersRaw = localStorage.getItem("etayo_registered_users");
          const existingList = registeredUsersRaw ? JSON.parse(registeredUsersRaw) : [];
          const updatedList = [
            ...existingList.filter((u: any) => u.email?.toLowerCase() !== sanitizedEmail),
            {
              name: sanitizedName,
              email: sanitizedEmail,
              password: sanitizedPassword,
              role: "ROLE_APPLICANT",
              registeredAt: new Date().toISOString()
            }
          ];
          localStorage.setItem("etayo_registered_users", JSON.stringify(updatedList));
        } catch (e) {}
      }

      // Redirect to login with registered success indicator
      router.push("/login?registered=true");
    } catch (err: any) {
      setErrorMsg(err.message || "Network Error: Failed to complete registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-layout">
      {/* Full-Page Background: Sto. Tomas Municipal Hall with Red Palette Overlay */}
      <div className="login-bg-wrapper">
        <div className="login-bg-image"></div>
        <div className="login-bg-overlay"></div>
        <div className="login-bg-glow"></div>
      </div>

      <div className="login-visual animate-fade-in">
        <div className="visual-content">
          <h1>Join eTAYO</h1>
          <p>Create an account to apply for permits, track your progress, and securely communicate with city staff.</p>
        </div>
      </div>

      <div className="login-form-container">
        <div className="login-card-wrapper animate-fade-in-up">
          {/* Back to Home Button */}
          <Link 
            href="/" 
            className="auth-back-btn" 
            title="Bumalik sa Homepage"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>

          <div className="login-card">
          <div className="logo-group" style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }} title="Bumalik sa Homepage">
              <Image src="/logo.png" alt="eTAYO" width={160} height={50} style={{ height: "44px", width: "auto", objectFit: "contain", cursor: "pointer" }} priority />
            </Link>
          </div>
          
          <div className="form-header">
            {step === "details" ? (
              <>
                <h1>Create Account</h1>
                <p>Please enter your details to register.</p>
              </>
            ) : (
              <>
                <h1>Verify Email</h1>
                <p>We sent a 6-digit verification code to <b>{email}</b>. Please enter it below.</p>
              </>
            )}
          </div>

          {infoMsg && (
            <div style={{ backgroundColor: "#eff6ff", color: "#1e40af", padding: "12px", borderRadius: "10px", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px", border: "1px solid #bfdbfe", fontSize: "14px", fontWeight: "500" }}>
              <CheckCircle2 size={18} />
              <span>{infoMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", padding: "12px", borderRadius: "10px", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px", border: "1px solid #f87171", fontSize: "14px", fontWeight: "600" }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {debugOtp && step === "verification" && (
            <div style={{ backgroundColor: "#f8fafc", color: "#0038A8", padding: "10px 14px", borderRadius: "8px", marginBottom: "1rem", border: "1px dashed #93c5fd", fontSize: "13px", textAlign: "center", fontWeight: "600" }}>
              Generated OTP: <span style={{ letterSpacing: "0.2em", fontSize: "15px", color: "#021a4f" }}>{debugOtp}</span>
            </div>
          )}

          {step === "details" ? (
            <form onSubmit={handleSendOtp} className="login-form">
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input 
                    type="text" 
                    required
                    placeholder="Juan Dela Cruz" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input 
                    type="email" 
                    required
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="has-toggle"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn"
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="has-toggle"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="password-toggle-btn"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-btn" disabled={isLoading}>
                {isLoading ? "Sending Code..." : "Create Account"}
              </button>
              
              <div className="register-prompt">
                Already have an account? <Link href="/login" className="register-link">Log in here</Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="login-form">
              <div className="form-group">
                <label>6-Digit Verification Code</label>
                <div className="input-with-icon">
                  <ShieldCheck size={18} className="input-icon" />
                  <input 
                    type="text" 
                    required
                    maxLength={6}
                    placeholder="123456" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    style={{ letterSpacing: '0.5em', fontSize: '1.25rem', fontWeight: 'bold', textAlign: 'center' }}
                  />
                </div>
              </div>

              <button type="submit" className="login-btn" disabled={isLoading}>
                {isLoading ? "Verifying Code..." : "Verify & Complete Registration"}
              </button>

              {/* 2-Minute Timer Resend Button */}
              <button
                type="button"
                className="resend-otp-btn"
                disabled={!canResend || isResending}
                onClick={handleResendOtp}
              >
                <RotateCw size={15} className={isResending ? "animate-spin" : ""} />
                {canResend ? "Send another OTP" : `Send another OTP in ${formatTime(timer)}`}
              </button>
              
              <div className="register-prompt" style={{ marginTop: "1.25rem" }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setStep("details");
                    setOtp("");
                    setErrorMsg("");
                    setInfoMsg("");
                  }} 
                  style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                >
                  ← Change email address
                </button>
              </div>
            </form>
          )}
        </div>
        </div>
      </div>

    </div>
  );
}
