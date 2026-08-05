"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function TrackIndexPage() {
  const [trackId, setTrackId] = useState("");
  const router = useRouter();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackId.trim()) {
      router.push(`/applicant/track/${trackId.trim()}`);
    }
  };

  return (
    <div className="dashboard-page animate-fade-in-up">
      <header className="page-header" style={{ marginBottom: "2rem" }}>
        <h1 className="page-title" style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a" }}>Track Application</h1>
        <p className="page-subtitle" style={{ fontSize: "1.1rem", marginTop: "0.5rem", color: "#475569" }}>Enter your tracking ID to view the status of your permit.</p>
      </header>
      
      <div className="glass-panel" style={{ maxWidth: "600px", margin: "0 auto", padding: "3rem 2rem", background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
        <form onSubmit={handleTrack} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label style={{ display: "block", color: "#1e293b", fontWeight: "600", marginBottom: "0.75rem", fontSize: "1.1rem" }}>Application Tracking ID</label>
            <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "0.5rem 1rem", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
              <Search size={20} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="e.g. APP-2026-1234"
                value={trackId}
                onChange={e => setTrackId(e.target.value)}
                style={{ border: "none", background: "transparent", width: "100%", padding: "0.75rem", fontSize: "1.1rem", outline: "none", color: "#0f172a", fontWeight: "500" }}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", display: "flex", justifyContent: "center" }} disabled={!trackId.trim()}>
            Track Now
          </button>
        </form>
      </div>
    </div>
  );
}
