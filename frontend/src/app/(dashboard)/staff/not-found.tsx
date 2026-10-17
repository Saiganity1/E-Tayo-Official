"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Home, FileCheck, ShieldAlert } from "lucide-react";

export default function StaffNotFound() {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: "520px",
          width: "100%",
          background: "white",
          borderRadius: "20px",
          padding: "2.5rem",
          boxShadow: "0 10px 25px -5px rgba(0, 56, 168, 0.08), 0 0 0 1px #e2e8f0",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#fee2e2",
            color: "#dc2626",
            padding: "6px 14px",
            borderRadius: "999px",
            fontSize: "0.85rem",
            fontWeight: "700",
            marginBottom: "1.25rem",
          }}
        >
          <ShieldAlert size={16} />
          <span>Staff Resource Not Found</span>
        </div>

        <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a", marginBottom: "0.5rem" }}>
          Page or Dossier Unavailable
        </h2>
        <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "1.75rem" }}>
          The requested staff view or evaluation record does not exist or has been relocated.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/staff/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#0038A8",
              color: "white",
              padding: "0.75rem 1.25rem",
              borderRadius: "10px",
              fontWeight: "700",
              fontSize: "0.9rem",
              textDecoration: "none",
            }}
          >
            <FileCheck size={16} />
            <span>Staff Evaluations</span>
          </Link>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#f1f5f9",
              color: "#334155",
              padding: "0.75rem 1.25rem",
              borderRadius: "10px",
              fontWeight: "700",
              fontSize: "0.9rem",
              textDecoration: "none",
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
