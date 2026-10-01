"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, FileText } from "lucide-react";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("eTAYO App Runtime Error caught by error boundary:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)",
      padding: "2rem",
      fontFamily: "inherit"
    }}>
      <div style={{
        maxWidth: "520px",
        width: "100%",
        background: "#ffffff",
        borderRadius: "24px",
        padding: "2.5rem 2rem",
        boxShadow: "0 20px 45px rgba(0, 56, 168, 0.08)",
        border: "1.5px solid #e2e8f0",
        textAlign: "center"
      }}>
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "#fef2f2",
          color: "#dc2626",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.25rem auto",
          boxShadow: "0 4px 15px rgba(220, 38, 38, 0.15)"
        }}>
          <AlertTriangle size={32} />
        </div>

        <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.5rem 0" }}>
          Something went wrong
        </h2>

        <p style={{ fontSize: "0.95rem", color: "#64748b", margin: "0 0 1.75rem 0", lineHeight: "1.5" }}>
          The page encountered an unexpected issue while loading data. You can retry loading or return to the track page.
        </p>

        {error?.message && (
          <div style={{
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            padding: "8px 14px",
            fontSize: "0.8rem",
            color: "#475569",
            fontFamily: "monospace",
            marginBottom: "1.5rem",
            wordBreak: "break-word",
            textAlign: "left"
          }}>
            {error.message}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "linear-gradient(135deg, #0038A8 0%, #021a4f 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              padding: "10px 20px",
              fontSize: "0.9rem",
              fontWeight: "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 15px rgba(0, 56, 168, 0.25)"
            }}
          >
            <RotateCcw size={16} />
            <span>Try Again</span>
          </button>

          <Link
            href="/applicant/track"
            style={{
              background: "#f1f5f9",
              color: "#334155",
              border: "1px solid #cbd5e1",
              borderRadius: "12px",
              padding: "10px 18px",
              fontSize: "0.9rem",
              fontWeight: "700",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <FileText size={16} />
            <span>Application Status</span>
          </Link>

          <Link
            href="/"
            style={{
              background: "#f1f5f9",
              color: "#334155",
              border: "1px solid #cbd5e1",
              borderRadius: "12px",
              padding: "10px 18px",
              fontSize: "0.9rem",
              fontWeight: "700",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Home size={16} />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
