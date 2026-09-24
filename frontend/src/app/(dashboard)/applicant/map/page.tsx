"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Map as MapIcon } from "lucide-react";

// Dynamically import the map to avoid SSR issues with Leaflet
const SpatialMap = dynamic(() => import("../../../../components/map/SpatialMap"), { 
  ssr: false,
  loading: () => <div className="map-loading">Loading Spatial Map of Sto. Tomas...</div>
});

export default function MapPage() {
  return (
    <div className="dashboard-page animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)' }}>
      <header className="page-header" style={{ 
        background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.9)",
        boxShadow: "0 10px 35px rgba(0, 0, 0, 0.14)",
        borderRadius: "20px",
        padding: "1.25rem 1.75rem",
        marginBottom: "1rem"
      }}>
        <div>
          <h1 className="page-title flex items-center gap-2" style={{ fontSize: "2rem", fontWeight: "800", background: "linear-gradient(90deg, #021a4f 0%, #0038A8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            <MapIcon size={28} style={{ color: "#0038A8", flexShrink: 0 }} />
            Spatial Mapping
          </h1>
          <p className="page-subtitle" style={{ fontSize: "1rem", marginTop: "0.3rem", color: "#475569" }}>Interactive map of construction permits and clearings across Sto. Tomas, Pampanga.</p>
        </div>
      </header>
      
      <section className="glass-panel map-container" style={{ flex: 1, padding: 0, position: 'relative', overflow: 'hidden' }}>
        <SpatialMap />
      </section>
      
      <style jsx>{`
        .map-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
          background: rgba(255,255,255,0.5);
          font-weight: 600;
          color: var(--text-secondary);
        }
        .text-primary {
          color: var(--color-primary);
        }
      `}</style>
    </div>
  );
}
