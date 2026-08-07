"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, LayersControl, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Maximize, Minimize, AlertCircle, CheckCircle2 } from "lucide-react";
import { stoTomasZoningGeoJSON } from "../../data/stoTomasGeoJSON";

// Fix marker icon issue in Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Ray-casting algorithm to check if point is in polygon
function isPointInPolygon(point: [number, number], vs: number[][]) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Check which zone a point belongs to
function getZoneForPoint(lng: number, lat: number) {
  for (const feature of stoTomasZoningGeoJSON.features) {
    if (!feature.properties?.isBoundary && feature.geometry) {
      let coords = feature.geometry.coordinates;
      if (feature.geometry.type === 'Polygon') {
        coords = coords[0];
      } else if (feature.geometry.type === 'MultiPolygon') {
        coords = coords[0][0]; // Simplified for first polygon
      }
      if (isPointInPolygon([lng, lat], coords)) {
        return feature.properties;
      }
    }
  }
  return null;
}

function MapEvents({ onLocationSelected }: { onLocationSelected: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export interface ZoneInfo {
  barangay?: string;
  zoneType?: string;
  description?: string;
}

interface LocationPickerMapProps {
  onLocationChange?: (lat: number, lng: number, zone?: ZoneInfo | null) => void;
}

export default function LocationPickerMap({ onLocationChange }: LocationPickerMapProps) {
  const [position, setPosition] = useState<[number, number]>([14.995, 120.705]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showError, setShowError] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const boundaryFeature = stoTomasZoningGeoJSON.features.find((f: any) => f.properties?.isBoundary);
  // Support both Polygon and MultiPolygon
  const boundaryCoords = boundaryFeature?.geometry.type === 'Polygon' 
    ? boundaryFeature.geometry.coordinates[0]
    : boundaryFeature?.geometry.coordinates[0][0];

  const handleLocationChange = (lat: number, lng: number) => {
    if (boundaryCoords && !isPointInPolygon([lng, lat], boundaryCoords)) {
      setShowError(true);
      return;
    }
    setShowError(false);
    setPosition([lat, lng]);
    
    if (onLocationChange) {
      const zoneInfo = getZoneForPoint(lng, lat);
      onLocationChange(lat, lng, zoneInfo);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    // Initial emit
    if (onLocationChange) {
      const zoneInfo = getZoneForPoint(position[1], position[0]);
      onLocationChange(position[0], position[1], zoneInfo);
    }
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div 
      ref={mapRef} 
      style={{ 
        position: "relative", 
        borderRadius: isFullscreen ? "0" : "12px", 
        overflow: "hidden", 
        border: isFullscreen ? "none" : "1px solid #cbd5e1", 
        height: isFullscreen ? "100vh" : "250px", 
        background: "#f8fafc", 
        width: "100%" 
      }}
    >
      <MapContainer 
        center={position} 
        zoom={14} 
        style={{ width: "100%", height: "100%" }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Street View">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite View">
            <TileLayer
              attribution='Tiles &copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <GeoJSON 
          key="sto-tomas-boundary"
          data={stoTomasZoningGeoJSON} 
          style={(feature: any) => {
            if (feature?.properties?.isBoundary) {
              return { color: "#ef4444", weight: 4, fillOpacity: 0.1, dashArray: "5, 10" };
            }
            return { weight: 0, fillOpacity: 0 };
          }}
        />

        <Marker 
          position={position} 
          icon={customIcon}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const pos = marker.getLatLng();
              handleLocationChange(pos.lat, pos.lng);
              marker.setLatLng(position); // reset if invalid, or it updates to new if valid (because of state)
            }
          }}
        />
        <MapEvents onLocationSelected={(lat, lng) => handleLocationChange(lat, lng)} />
      </MapContainer>
      
      <button 
        onClick={(e) => { e.preventDefault(); toggleFullscreen(); }}
        style={{ 
          position: "absolute", 
          bottom: "20px", 
          left: "10px", 
          zIndex: 1000, 
          background: "white", 
          border: "1px solid #cbd5e1", 
          padding: "8px", 
          borderRadius: "8px", 
          cursor: "pointer", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
      >
        {isFullscreen ? <Minimize size={20} color="#0f172a" /> : <Maximize size={20} color="#0f172a" />}
      </button>

      {!isFullscreen && (
        <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: "rgba(255,255,255,0.95)", padding: "6px 16px", borderRadius: "99px", fontSize: "0.85rem", fontWeight: "700", color: "#1d4ed8", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", pointerEvents: "none", border: "1px solid #bfdbfe", whiteSpace: "nowrap" }}>
          Click or drag pin to set location
        </div>
      )}

      {/* Custom Error Modal */}
      {showError && (
        <div className="animate-fade-in-up" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 2000, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", padding: "2rem", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", maxWidth: "320px", textAlign: "center" }}>
            <div style={{ width: "64px", height: "64px", background: "#fee2e2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto" }}>
              <AlertCircle size={32} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.5rem" }}>Out of Bounds</h3>
            <p style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: "1.5rem", lineHeight: "1.5" }}>
              The selected location falls outside the jurisdictional boundary of <strong>Sto. Tomas, Pampanga</strong>. Please pinpoint a location within the municipal borders.
            </p>
            <button 
              onClick={(e) => { e.preventDefault(); setShowError(false); }}
              style={{ width: "100%", padding: "0.75rem", background: "#3b82f6", color: "white", borderRadius: "8px", fontWeight: "600", border: "none", cursor: "pointer", transition: "background 0.2s" }}
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
