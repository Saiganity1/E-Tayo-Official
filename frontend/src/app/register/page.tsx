"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, User, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Registration failed");
      }

      alert("Registration successful! You can now log in.");
      router.push("/login");
    } catch (err: any) {
      setErrorMsg(err.message);
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

      <div className="login-form-container">
        <div className="login-card animate-fade-in-up">
          <div className="logo-group">
            <div className="logo-icon"></div>
            <h2 className="logo-text">e-Tayo</h2>
          </div>
          
          <div className="form-header">
            <h1>Create Account</h1>
            <p>Please enter your details to register.</p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="login-form">
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
              {isLoading ? "Registering..." : "Create Account"}
            </button>
            
            <div className="register-prompt">
              Already have an account? <Link href="/login" className="register-link">Log in here</Link>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
