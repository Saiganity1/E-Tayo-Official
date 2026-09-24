"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft, Home, FileText } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("eTAYO Application Tracker Error:", error);
  }, [error]);

  return (
    <div className="dashboard-page animate-fade-in-up" style={{ maxWidth: "700px", margin: "2rem auto", padding: "1rem" }}>
      <div style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.9)",
        borderRadius: "24px",
        padding: "2.5rem 2rem",
        boxShadow: "0 20px 50px rgba(0, 56, 168, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)",
        textAlign: "center"
      }}>
        {/* Warning Icon Badge */}
        <div style={{
          width: "72px",
          height: "72px",
          borderRadius: "22px",
          background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
          color: "#dc2626",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.5rem auto",
          boxShadow: "0 8px 20px rgba(220, 38, 38, 0.15)",
          border: "1px solid #fecaca"
        }}>
          <AlertTriangle size={36} />
        </div>

        <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.5rem 0", letterSpacing: "-0.01em" }}>
          Unable to Load Application Details
        </h2>

        <p style={{ color: "#475569", fontSize: "0.95rem", lineHeight: "1.6", maxWidth: "520px", margin: "0 auto 1.75rem auto" }}>
          We encountered an issue preparing the tracking view or official municipal documents for this permit record. You can try refreshing or returning to your applications list.
        </p>

        {error?.message && (
          <div style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "0.75rem 1rem",
            marginBottom: "1.75rem",
            fontSize: "0.82rem",
            color: "#64748b",
            fontFamily: "monospace",
            textAlign: "left",
            overflowX: "auto"
          }}>
            <strong>Diagnostic:</strong> {error.message}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "linear-gradient(135deg, #0038A8 0%, #021a4f 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "14px",
              padding: "10px 22px",
              fontWeight: "700",
              fontSize: "0.92rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(0, 56, 168, 0.35)",
              transition: "all 0.2s ease"
            }}
          >
            <RefreshCw size={16} /> Reload Page
          </button>

          <Link
            href="/applicant/track"
            style={{
              background: "#ffffff",
              color: "#334155",
              border: "1px solid #cbd5e1",
              borderRadius: "14px",
              padding: "10px 20px",
              fontWeight: "700",
              fontSize: "0.92rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              transition: "all 0.2s ease"
            }}
          >
            <FileText size={16} color="#0038A8" /> All Applications
          </Link>

          <Link
            href="/applicant/dashboard"
            style={{
              background: "#f8fafc",
              color: "#475569",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "10px 20px",
              fontWeight: "600",
              fontSize: "0.92rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none"
            }}
          >
            <Home size={16} /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
