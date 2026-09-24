"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, Mail, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { usePermitContext } from "../../context/PermitContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeoutMessage, setTimeoutMessage] = useState(false);
  
  const router = useRouter();
  const { setUserRole, addSystemLog } = usePermitContext();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("timeout") === "true") {
        setTimeoutMessage(true);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const sanitizedEmail = email.trim().toLowerCase();
      const sanitizedPassword = password.trim();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sanitizedEmail, password: sanitizedPassword }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Invalid credentials");
      }

      const data = await response.json();
      
      // Store token and user securely
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("user", JSON.stringify({ email, name: data.name, role: data.role }));

      let role: "applicant" | "staff" | "admin" = "applicant";
      let destination = "/applicant/dashboard";

      if (data.role === "ROLE_STAFF") {
        role = "staff";
        destination = "/staff/dashboard";
      } else if (data.role === "ROLE_ADMIN" || data.role === "ROLE_SUPERADMIN") {
        role = "admin";
        destination = "/admin/evaluations";
      }

      setUserRole(role);

      try {
        await addSystemLog({
          action: "USER_LOGIN",
          category: "security",
          status: "success",
          user: sanitizedEmail,
          message: `User ${data.name || sanitizedEmail} logged in successfully`,
          details: `Authenticated with role ${data.role || role} · Sto. Tomas Permitting Portal`
        });
      } catch (logErr) {
        console.warn("Could not log user login", logErr);
      }

      router.push(destination);
    } catch (err: any) {
      alert("Login failed: " + err.message);
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
          <h1>Secure Portal Access</h1>
          <p>eTAYO ensures your data is protected with enterprise-grade security protocols.</p>
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
            <h1>Welcome Back</h1>
            <p>Please enter your credentials to access your account.</p>
          </div>

          {timeoutMessage && (
            <div className="alert-timeout" style={{ backgroundColor: "#fef2f2", color: "#991b1b", padding: "12px", borderRadius: "8px", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px", border: "1px solid #f87171" }}>
              <AlertCircle size={18} />
              <span style={{ fontSize: "14px", fontWeight: "500" }}>Your session has expired due to inactivity. Please log in again.</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input 
                  type="text" 
                  required
                  placeholder="name@example.com or Username" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="flex-between">
                <label>Password</label>
                <a href="#" className="forgot-link">Forgot password?</a>
              </div>
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

            <button type="submit" className="btn-primary w-full login-btn" disabled={isLoading}>
              {isLoading ? "Authenticating..." : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="register-prompt">
            Don't have an account? <Link href="/register">Register here</Link>
          </p>
        </div>
        </div>
      </div>

    </div>
  );
}
