"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Home, ClipboardList, PlusCircle, ArrowLeft, ShieldAlert } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const [trackQuery, setTrackQuery] = useState("");

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = trackQuery.trim();
    if (clean) {
      router.push(`/applicant/track/${encodeURIComponent(clean)}`);
    } else {
      router.push("/applicant/track");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f8fafc 0%, #eef2f6 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1.5rem",
      fontFamily: "var(--font-plus-jakarta-sans), sans-serif",
      color: "#0f172a"
    }}>
      <div style={{
        maxWidth: "580px",
        width: "100%",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        borderRadius: "24px",
        padding: "2.5rem",
        boxShadow: "0 20px 40px -15px rgba(0, 56, 168, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)",
        textAlign: "center"
      }}>
        {/* Header Badges */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "#fee2e2",
            color: "#dc2626",
            padding: "6px 14px",
            borderRadius: "999px",
            fontSize: "0.85rem",
            fontWeight: "700",
            letterSpacing: "0.05em"
          }}>
            <ShieldAlert size={16} />
            <span>HTTP 404 · PAGE NOT FOUND</span>
          </div>
        </div>

        <h1 style={{
          fontSize: "2.2rem",
          fontWeight: "800",
          color: "#0038A8",
          margin: "0 0 0.75rem 0",
          letterSpacing: "-0.02em"
        }}>
          Looking for a Permit?
        </h1>
        <p style={{
          fontSize: "1rem",
          color: "#64748b",
          lineHeight: "1.6",
          margin: "0 0 2rem 0"
        }}>
          The page or dossier link you entered could not be found. You can search directly by your Reference ID (e.g. <strong>LC-2026-6494</strong>) or return to the main dashboard.
        </p>

        {/* Quick Permit Search Input */}
        <form onSubmit={handleTrackSubmit} style={{ marginBottom: "2rem" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            background: "#f1f5f9",
            borderRadius: "14px",
            padding: "6px 8px 6px 16px",
            border: "2px solid #e2e8f0"
          }}>
            <Search size={18} color="#64748b" style={{ marginRight: "10px", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Enter Reference (e.g. LC-2026-6494)..."
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                width: "100%",
                fontSize: "0.95rem",
                color: "#0f172a",
                fontWeight: "500"
              }}
            />
            <button
              type="submit"
              style={{
                background: "linear-gradient(135deg, #0038A8 0%, #021a4f 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "8px 18px",
                fontWeight: "600",
                fontSize: "0.9rem",
                cursor: "pointer",
                flexShrink: 0
              }}
            >
              Track
            </button>
          </div>
        </form>

        {/* Action Navigation Buttons */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "1.5rem"
        }}>
          <Link
            href="/applicant/track"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 16px",
              background: "#eff6ff",
              color: "#0038A8",
              borderRadius: "12px",
              fontWeight: "600",
              fontSize: "0.9rem",
              textDecoration: "none",
              border: "1px solid #bfdbfe"
            }}
          >
            <ClipboardList size={16} />
            <span>Application Status</span>
          </Link>

          <Link
            href="/applicant/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 16px",
              background: "#ffffff",
              color: "#334155",
              borderRadius: "12px",
              fontWeight: "600",
              fontSize: "0.9rem",
              textDecoration: "none",
              border: "1px solid #cbd5e1"
            }}
          >
            <Home size={16} />
            <span>Dashboard</span>
          </Link>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px", fontSize: "0.85rem" }}>
          <Link href="/login" style={{ color: "#0038A8", textDecoration: "none", fontWeight: "600" }}>
            🔑 Go to Login
          </Link>
          <span style={{ color: "#cbd5e1" }}>•</span>
          <Link href="/" style={{ color: "#64748b", textDecoration: "none" }}>
            Official Sto. Tomas Portal
          </Link>
        </div>
      </div>

      <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.8rem", color: "#94a3b8" }}>
        Municipality of Sto. Tomas, Pampanga · Online Permitting Portal (eTAYO)
      </div>
    </div>
  );
}
