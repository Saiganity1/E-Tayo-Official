"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Map as MapIcon, FileCheck, Layers, Shield, ArrowRight, Eye, CheckCircle2, Clock } from "lucide-react";
import { usePermitContext } from "@/context/PermitContext";
import { useLanguage } from "@/context/LanguageContext";

// Dynamically import the map to avoid SSR issues with Leaflet
const SpatialMap = dynamic(() => import("@/components/map/SpatialMap"), { 
  ssr: false,
  loading: () => (
    <div className="map-loading-container">
      <div className="spinner" />
      <span>Loading Administrative Spatial Map of Sto. Tomas...</span>
      <style jsx>{`
        .map-loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
          background: #f8fafc;
          gap: 12px;
          color: #475569;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .spinner {
          width: 36px;
          height: 36px;
          border: 4px solid #e2e8f0;
          border-top-color: #0038A8;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
});

export default function AdminMapPage() {
  const { applications } = usePermitContext();
  const { language } = useLanguage();
  const isEn = language === "en";

  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(a => a.status === "pending" || a.status === "under_review").length;
    const approved = applications.filter(a => a.status === "approved" || a.status === "released").length;
    return { total, pending, approved };
  }, [applications]);

  return (
    <div className="dashboard-page animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4.2rem)' }}>
      {/* Admin Header */}
      <header 
        className="page-header" 
        style={{ 
          background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.9)",
          boxShadow: "0 10px 35px rgba(0, 0, 0, 0.08)",
          borderRadius: "20px",
          padding: "1rem 1.5rem",
          marginBottom: "0.85rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              fontSize: "0.72rem",
              fontWeight: "800",
              textTransform: "uppercase",
              padding: "2px 8px",
              borderRadius: "6px",
              letterSpacing: "0.05em"
            }}>
              {isEn ? "ADMINISTRATIVE GIS" : "PANG-ADMINISTRADOR NA GIS"}
            </span>
            <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "600" }}>
              Sto. Tomas, Pampanga
            </span>
          </div>

          <h1 
            className="page-title flex items-center gap-2" 
            style={{ 
              fontSize: "1.75rem", 
              fontWeight: "800", 
              background: "linear-gradient(90deg, #021a4f 0%, #0038A8 100%)", 
              WebkitBackgroundClip: "text", 
              WebkitTextFillColor: "transparent",
              margin: 0
            }}
          >
            <MapIcon size={26} style={{ color: "#0038A8", flexShrink: 0 }} />
            {isEn ? "Permit Applications Map" : "Mapa ng mga Aplikasyon"}
          </h1>
          <p className="page-subtitle" style={{ fontSize: "0.88rem", marginTop: "0.25rem", color: "#475569", margin: 0 }}>
            {isEn 
              ? "Geospatial overview of all permits. Click any marker to jump directly to its evaluation dossier."
              : "Heograpikal na mapa ng mga permit. I-click ang anumang marker sa mapa upang direktang pumunta sa pagsusuri ng aplikasyon."}
          </p>
        </div>

        {/* Quick Stats & Action Link */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "6px 12px", borderRadius: "10px", textAlign: "center" }}>
              <div style={{ fontSize: "1.05rem", fontWeight: "800", color: "#021a4f", lineHeight: "1" }}>{stats.total}</div>
              <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>
                {isEn ? "Total Permits" : "Kabuuan"}
              </div>
            </div>
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "6px 12px", borderRadius: "10px", textAlign: "center" }}>
              <div style={{ fontSize: "1.05rem", fontWeight: "800", color: "#d97706", lineHeight: "1" }}>{stats.pending}</div>
              <div style={{ fontSize: "0.68rem", color: "#b45309", fontWeight: "600", textTransform: "uppercase" }}>
                {isEn ? "Pending" : "Sinusuri"}
              </div>
            </div>
            <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "6px 12px", borderRadius: "10px", textAlign: "center" }}>
              <div style={{ fontSize: "1.05rem", fontWeight: "800", color: "#059669", lineHeight: "1" }}>{stats.approved}</div>
              <div style={{ fontSize: "0.68rem", color: "#047857", fontWeight: "600", textTransform: "uppercase" }}>
                {isEn ? "Approved" : "Aprubado"}
              </div>
            </div>
          </div>

          <Link
            href="/admin/evaluations"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#0038A8",
              color: "#ffffff",
              padding: "8px 14px",
              borderRadius: "10px",
              fontWeight: "700",
              fontSize: "0.85rem",
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(0, 56, 168, 0.2)",
              transition: "all 0.15s ease"
            }}
          >
            <FileCheck size={16} />
            <span>{isEn ? "Evaluations Table" : "Talaan ng Pagsusuri"}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Spatial Map Component with Admin Direct-Click Routing */}
      <section 
        className="glass-panel map-container" 
        style={{ 
          flex: 1, 
          padding: 0, 
          position: "relative", 
          overflow: "hidden",
          borderRadius: "20px",
          border: "1px solid rgba(255, 255, 255, 0.8)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)"
        }}
      >
        <SpatialMap mode="admin" initialDirectClick={true} />
      </section>
    </div>
  );
}
