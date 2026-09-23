"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, Mail, User, ShieldCheck, ArrowLeft, ArrowRight } from "lucide-react";

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

    </div>
  );
}
