"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { usePermitContext } from "../../context/PermitContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setUserRole } = usePermitContext();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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
      } else if (data.role === "ROLE_ADMIN") {
        role = "admin";
        destination = "/admin/dashboard";
      }

      setUserRole(role);
      router.push(destination);
    } catch (err: any) {
      alert("Login failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-layout">
      <div className="login-visual animate-fade-in">
        <div className="visual-content">
          <div className="visual-icon"><ShieldCheck size={48} /></div>
          <h1>Secure Portal Access</h1>
          <p>e-Tayo ensures your data is protected with enterprise-grade security protocols.</p>

        </div>
        <div className="visual-overlay"></div>
      </div>

      <div className="login-form-container">
        <div className="login-card animate-fade-in-up">
          <div className="logo-group">
            <div className="logo-icon"></div>
            <h2 className="logo-text">e-Tayo</h2>
          </div>
          
          <div className="form-header">
            <h1>Welcome Back</h1>
            <p>Please enter your credentials to access your account.</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
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
  );
}
