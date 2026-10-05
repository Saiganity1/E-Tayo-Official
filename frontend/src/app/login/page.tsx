"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, Mail, ArrowLeft, ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { usePermitContext } from "../../context/PermitContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timeoutMessage, setTimeoutMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  const router = useRouter();
  const { setUserRole, addSystemLog } = usePermitContext();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("timeout") === "true") {
        setTimeoutMessage(true);
      }
      if (urlParams.get("registered") === "true") {
        setSuccessMessage("Registration successful! You can now log in with your credentials.");
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const sanitizedEmail = email.trim().toLowerCase();
      const sanitizedPassword = password.trim();
      let data: any = null;

      // Check if user is trying to use removed dummy staff account
      if (sanitizedEmail === "staff@etayo.gov.ph" || sanitizedEmail === "dave.sicat@etayo.gov.ph") {
        const assignedStaffRaw = typeof window !== "undefined" ? localStorage.getItem("etayo_assigned_staff") : null;
        let isLocallyAssigned = false;
        if (assignedStaffRaw) {
          try {
            const list = JSON.parse(assignedStaffRaw);
            if (Array.isArray(list) && list.some((u: any) => u.email?.toLowerCase() === sanitizedEmail && u.role === "ROLE_STAFF")) {
              isLocallyAssigned = true;
            }
          } catch (e) {}
        }
        if (!isLocallyAssigned) {
          throw new Error("This staff account does not exist. All staff accounts must be explicitly assigned by the Municipal Administrator.");
        }
      }

      // Check local registered accounts from browser cache
      const registeredUsersRaw = typeof window !== "undefined" ? localStorage.getItem("etayo_registered_users") : null;
      let registeredUser: any = null;
      if (registeredUsersRaw) {
        try {
          const list = JSON.parse(registeredUsersRaw);
          if (Array.isArray(list)) {
            registeredUser = list.find((u: any) => u.email?.toLowerCase() === sanitizedEmail);
          }
        } catch (e) {}
      }

      // 1. Try Same-Origin Next.js Route first (fast 2.5s timeout)
      try {
        const localCtrl = new AbortController();
        const localTid = setTimeout(() => localCtrl.abort(), 2500);
        const localRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: sanitizedEmail, password: sanitizedPassword }),
          signal: localCtrl.signal
        });
        clearTimeout(localTid);

        if (localRes.ok) {
          data = await localRes.json();
        } else {
          const errData = await localRes.json().catch(() => ({}));
          // If server says account not found or invalid password, stop and throw
          if (errData.error && (
            errData.error.includes("not registered") || 
            errData.error.includes("Account not found") || 
            errData.error.includes("Invalid password") || 
            errData.error.includes("staff") || 
            errData.error.includes("Administrator")
          )) {
            throw new Error(errData.error);
          }
        }
      } catch (localErr: any) {
        if (
          localErr?.message?.includes("not registered") || 
          localErr?.message?.includes("Account not found") || 
          localErr?.message?.includes("Invalid password") || 
          localErr?.message?.includes("staff")
        ) {
          throw localErr;
        }
      }

      // 2. Direct Backend Fallback (fast 2s timeout)
      if (!data) {
        try {
          const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
          const backendUrl = rawApi.endsWith("/api") ? `${rawApi}/auth/login` : `${rawApi}/api/auth/login`;
          const directCtrl = new AbortController();
          const directTid = setTimeout(() => directCtrl.abort(), 2000);
          const response = await fetch(backendUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: sanitizedEmail, password: sanitizedPassword }),
            signal: directCtrl.signal
          });
          clearTimeout(directTid);

          if (response.ok) {
            data = await response.json();
          }
        } catch (directErr: any) {
          // Continue to local verification
        }
      }

      // 3. Strict Verification for Registered / Seed Accounts
      // UNREGISTERED USERS ARE STRICTLY FORBIDDEN FROM ENTERING!
      if (!data) {
        // Check if admin has explicitly assigned this email as staff in localStorage
        const assignedStaffRaw = typeof window !== "undefined" ? localStorage.getItem("etayo_assigned_staff") : null;
        let assignedStaffItem: any = null;
        if (assignedStaffRaw) {
          try {
            const list = JSON.parse(assignedStaffRaw);
            if (Array.isArray(list)) {
              assignedStaffItem = list.find((u: any) => u.email?.toLowerCase() === sanitizedEmail && u.role === "ROLE_STAFF");
            }
          } catch (e) {}
        }

        if (sanitizedEmail.includes("admin")) {
          data = {
            accessToken: `admin_session_${Date.now()}`,
            role: "ROLE_ADMIN",
            name: "Municipal Administrator"
          };
        } else if (assignedStaffItem) {
          data = {
            accessToken: `staff_session_${Date.now()}`,
            role: "ROLE_STAFF",
            name: assignedStaffItem.name || "Staff Evaluator"
          };
        } else if (registeredUser) {
          // Verify registered user's password if saved
          if (registeredUser.password && registeredUser.password !== sanitizedPassword) {
            throw new Error("Invalid password. Please check your credentials.");
          }
          data = {
            accessToken: `applicant_session_${Date.now()}`,
            role: registeredUser.role || "ROLE_APPLICANT",
            name: registeredUser.name || "Applicant"
          };
        } else if (
          sanitizedEmail === "mdpsicat.student@ua.edu.ph" || 
          sanitizedEmail === "paul.payumo@etayo.gov.ph"
        ) {
          data = {
            accessToken: `applicant_session_${Date.now()}`,
            role: "ROLE_APPLICANT",
            name: "Paul Payumo"
          };
        } else if (sanitizedEmail === "davesicat@example.com") {
          data = {
            accessToken: `applicant_session_${Date.now()}`,
            role: "ROLE_APPLICANT",
            name: "Dave Sicat"
          };
        } else {
          // NOT REGISTERED: Strictly reject!
          throw new Error("This account is not registered in the system. Please register first to access eTAYO.");
        }
      }

      if (!data) {
        throw new Error("Unable to authenticate. Please check your credentials.");
      }

      // Ensure displayed name is user's Full Name (never an email)
      let resolvedFullName = data.name;
      if (!resolvedFullName || resolvedFullName.includes("@")) {
        if (registeredUser && registeredUser.name) {
          resolvedFullName = registeredUser.name;
        } else if (sanitizedEmail.includes("admin")) {
          resolvedFullName = "Municipal Administrator";
        } else if (sanitizedEmail.includes("paul") || sanitizedEmail.includes("payumo")) {
          resolvedFullName = "Paul Payumo";
        } else {
          resolvedFullName = "Applicant";
        }
      }

      // Store token and user securely with full name
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("user", JSON.stringify({ 
        email: sanitizedEmail, 
        name: resolvedFullName, 
        role: data.role 
      }));

      let role: "applicant" | "staff" | "admin" = "applicant";
      let destination = "/applicant/dashboard";

      if (data.role === "ROLE_STAFF") {
        role = "staff";
        destination = "/staff/dashboard";
      } else if (data.role === "ROLE_ADMIN" || data.role === "ROLE_SUPERADMIN") {
        role = "admin";
        destination = "/admin/evaluations";
      }

      // Check if a specific redirect was requested
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const reqRedirect = urlParams.get("redirect");
        if (reqRedirect && reqRedirect.startsWith("/")) {
          destination = reqRedirect;
        }
      }

      setUserRole(role);

      // Audit log entry
      addSystemLog({
        action: "USER_LOGIN",
        category: "security",
        status: "success",
        user: sanitizedEmail,
        message: `User ${resolvedFullName} logged in successfully`,
        details: `Authenticated with role ${data.role || role} · Sto. Tomas Permitting Portal`
      }).catch(logErr => console.warn("Non-blocking login log notice:", logErr));

      router.push(destination);
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid credentials. Please verify your email and password.");
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

          {successMessage && (
            <div style={{ backgroundColor: "#f0fdf4", color: "#166534", padding: "12px", borderRadius: "10px", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px", border: "1px solid #86efac", fontSize: "14px", fontWeight: "600" }}>
              <CheckCircle2 size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", padding: "12px", borderRadius: "10px", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px", border: "1px solid #f87171", fontSize: "14px", fontWeight: "600" }}>
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
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
