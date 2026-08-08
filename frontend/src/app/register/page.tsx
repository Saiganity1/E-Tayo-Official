"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, User, ShieldCheck, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const [step, setStep] = useState<"details" | "verification">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to send verification code";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = await response.text() || errorMessage;
        }
        throw new Error(errorMessage);
      }

      setStep("verification");
    } catch (err: any) {
      setErrorMsg(err.message || "Network Error: Failed to fetch");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, otp }),
      });

      if (!response.ok) {
        let errorMessage = "Registration failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = await response.text() || errorMessage;
        }
        throw new Error(errorMessage);
      }

      alert("Registration successful! You can now log in.");
      router.push("/login");
    } catch (err: any) {
      setErrorMsg(err.message || "Network Error: Failed to fetch");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-layout">
      <div className="login-visual animate-fade-in">
        <div className="visual-content">
          <div className="visual-icon"><ShieldCheck size={48} /></div>
          <h1>Join e-Tayo</h1>
          <p>Create an account to apply for permits, track your progress, and securely communicate with city staff.</p>
        </div>
        <div className="visual-overlay"></div>
      </div>

      <div className="login-form-container" style={{ position: "relative" }}>
        
        {/* Back Button */}
        <Link href="/" style={{ position: "absolute", top: "2rem", left: "2rem", display: "flex", alignItems: "center", gap: "8px", color: "#64748b", textDecoration: "none", fontSize: "0.9rem", fontWeight: "600", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#0f172a"; e.currentTarget.style.transform = "translateX(-4px)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.transform = "translateX(0)"; }}>
          <ArrowRight size={18} style={{ transform: "rotate(180deg)" }} /> Back to Home
        </Link>
        <div className="login-card animate-fade-in-up">
          <div className="logo-group">
            <div className="logo-icon"></div>
            <h2 className="logo-text">e-Tayo</h2>
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
                <p>We sent a 6-digit code to <b>{email}</b>. Please enter it below.</p>
              </>
            )}
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
              {errorMsg}
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
                    type="password" 
                    required
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
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
                    style={{ letterSpacing: '0.5em', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center' }}
                  />
                </div>
              </div>

              <button type="submit" className="login-btn" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify & Complete Registration"}
              </button>
              
              <div className="register-prompt">
                <button 
                  type="button" 
                  onClick={() => setStep("details")} 
                  style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}
                >
                  Change email address
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

    </div>
  );
}
