"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Map as MapIcon } from "lucide-react";

// Dynamically import the map to avoid SSR issues with Leaflet
const SpatialMap = dynamic(() => import("../../../../components/map/SpatialMap"), { 
  ssr: false,
  loading: () => <div className="map-loading">Loading Spatial Map of Sto. Tomas...</div>
});

export default function StaffMapPage() {
  return (
    <div className="dashboard-page animate-fade-in-up" style={{ height: 'calc(100vh - 4rem)' }}>
      <header className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <MapIcon size={32} className="text-primary" />
            Evaluation Map
          </h1>
          <p className="page-subtitle">View and inspect construction permits across Sto. Tomas, Pampanga.</p>
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
