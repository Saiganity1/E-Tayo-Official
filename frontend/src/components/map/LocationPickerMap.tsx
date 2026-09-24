"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, LayersControl, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Maximize, Minimize, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  stoTomasZoningGeoJSON,
  BARANGAY_CENTERS,
  STO_TOMAS_MUNICIPAL_CENTER,
  STO_TOMAS_BOUNDS
} from "../../data/stoTomasGeoJSON";

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
function isPointInPolygon(point: [number, number], vs: number[][]): boolean {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Distance from point to line segment squared
function pointToSegmentDistSq(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1, dy = y2 - y1;
  if (dx === 0 && dy === 0) return (px - x1) ** 2 + (py - y1) ** 2;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return (px - (x1 + t * dx)) ** 2 + (py - (y1 + t * dy)) ** 2;
}

// Minimum distance from point to polygon boundary
function minDistanceToPolygon(point: [number, number], vs: number[][]): number {
  let minDistSq = Infinity;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const dSq = pointToSegmentDistSq(point[0], point[1], vs[i][0], vs[i][1], vs[j][0], vs[j][1]);
    if (dSq < minDistSq) minDistSq = dSq;
  }
  return Math.sqrt(minDistSq);
}

// Find zone for point with exact ray-cast and nearest-polygon edge fallback
export function getZoneForPoint(lng: number, lat: number) {
  const barangayFeatures = stoTomasZoningGeoJSON.features.filter((f: any) => !f.properties?.isBoundary && f.geometry);

  // 1. Direct containment check
  for (const feature of barangayFeatures) {
    if (feature.geometry.type === 'Polygon') {
      if (isPointInPolygon([lng, lat], feature.geometry.coordinates[0])) {
        return feature.properties;
      }
    } else if (feature.geometry.type === 'MultiPolygon') {
      for (const polyCoords of feature.geometry.coordinates) {
        if (isPointInPolygon([lng, lat], polyCoords[0])) {
          return feature.properties;
        }
      }
    }
  }

  // 2. Fallback: Edge-proximity check (for border roads, waterways, or boundary seams)
  let closestFeature: any = null;
  let minDistance = Infinity;

  for (const feature of barangayFeatures) {
    const polyRings = feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates[0]]
      : feature.geometry.coordinates.map((c: any) => c[0]);

    for (const ring of polyRings) {
      if (ring && ring.length > 0) {
        const dist = minDistanceToPolygon([lng, lat], ring);
        if (dist < minDistance) {
          minDistance = dist;
          closestFeature = feature;
        }
      }
    }
  }

  // If within 0.003 degrees (~300m), return the closest barangay
  if (closestFeature && minDistance < 0.003) {
    return closestFeature.properties;
  }

  return closestFeature?.properties || null;
}

function MapPanController({ center }: { center: [number, number] }) {
  const map = useMap();
  const prevCenterRef = useRef<[number, number]>(center);

  useEffect(() => {
    const [prevLat, prevLng] = prevCenterRef.current;
    const [newLat, newLng] = center;
    const dist = Math.hypot(newLat - prevLat, newLng - prevLng);
    // Pan only if changed noticeably (e.g. from dropdown or programmatic change)
    if (dist > 0.0005) {
      map.panTo(center, { animate: true, duration: 0.6 });
      prevCenterRef.current = center;
    }
  }, [center, map]);

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
  name?: string;
  code?: string;
  zoneType?: string;
  description?: string;
  color?: string;
}

interface LocationPickerMapProps {
  onLocationChange?: (lat: number, lng: number, zone?: ZoneInfo | null) => void;
  selectedBarangay?: string;
  initialLat?: number;
  initialLng?: number;
}

export default function LocationPickerMap({
  onLocationChange,
  selectedBarangay,
  initialLat,
  initialLng
}: LocationPickerMapProps) {
  // Determine initial coordinates based on props
  const getInitialPosition = (): [number, number] => {
    if (typeof initialLat === "number" && typeof initialLng === "number" && !isNaN(initialLat) && !isNaN(initialLng)) {
      return [initialLat, initialLng];
    }
    if (selectedBarangay && BARANGAY_CENTERS[selectedBarangay]) {
      return BARANGAY_CENTERS[selectedBarangay];
    }
    return BARANGAY_CENTERS["San Bartolome"] || [14.984535, 120.706438];
  };

  const [position, setPosition] = useState<[number, number]>(getInitialPosition);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showError, setShowError] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const isInternalUpdateRef = useRef(false);

  const boundaryFeature = stoTomasZoningGeoJSON.features.find((f: any) => f.properties?.isBoundary);
  const boundaryCoords = boundaryFeature?.geometry?.type === 'Polygon'
    ? boundaryFeature.geometry.coordinates[0]
    : boundaryFeature?.geometry?.coordinates[0]?.[0];

  const handleLocationChange = (lat: number, lng: number, isFromUserAction = true) => {
    // Check municipal boundary with a 0.0015 deg (~150m) edge tolerance
    if (boundaryCoords) {
      const isInside = isPointInPolygon([lng, lat], boundaryCoords);
      if (!isInside) {
        const dist = minDistanceToPolygon([lng, lat], boundaryCoords);
        if (dist > 0.0015) {
          setShowError(true);
          return;
        }
      }
    }

    setShowError(false);
    setPosition([lat, lng]);

    if (isFromUserAction) {
      isInternalUpdateRef.current = true;
    }

    if (onLocationChange) {
      const zoneInfo = getZoneForPoint(lng, lat);
      onLocationChange(lat, lng, zoneInfo);
    }
  };

  // Sync when selectedBarangay prop changes externally (e.g. user chose from dropdown)
  useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }
    if (selectedBarangay && BARANGAY_CENTERS[selectedBarangay]) {
      const targetCenter = BARANGAY_CENTERS[selectedBarangay];
      const currentZone = getZoneForPoint(position[1], position[0]);
      // If position is not already inside selected barangay, update it to center
      if (currentZone?.barangay !== selectedBarangay) {
        handleLocationChange(targetCenter[0], targetCenter[1], false);
      }
    }
  }, [selectedBarangay]);

  // Initial emit on mount
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    if (onLocationChange) {
      const initialPos = getInitialPosition();
      const zoneInfo = getZoneForPoint(initialPos[1], initialPos[0]);
      onLocationChange(initialPos[0], initialPos[1], zoneInfo);
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
        height: isFullscreen ? "100vh" : "280px",
        background: "#f8fafc",
        width: "100%"
      }}
    >
      <MapContainer
        center={position}
        zoom={14}
        style={{ width: "100%", height: "100%" }}
        maxBounds={STO_TOMAS_BOUNDS}
        maxBoundsViscosity={0.9}
        minZoom={12}
      >
        <MapPanController center={position} />

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
          key="sto-tomas-cadastral-zones"
          data={stoTomasZoningGeoJSON}
          style={(feature: any) => {
            if (feature?.properties?.isBoundary) {
              return {
                color: "#dc2626",
                weight: 3,
                fillOpacity: 0.04,
                fillColor: "#ef4444",
                dashArray: "6, 8"
              };
            }
            return {
              color: feature?.properties?.color || "#3b82f6",
              weight: 1.5,
              fillOpacity: 0.12,
              fillColor: feature?.properties?.color || "#3b82f6",
              dashArray: "3, 4"
            };
          }}
          onEachFeature={(feature: any, layer: L.Layer) => {
            if (feature?.properties?.isBoundary) {
              layer.bindTooltip(
                `<strong>Sto. Tomas Jurisdictional Boundary</strong>`,
                { sticky: true }
              );
            } else if (feature?.properties?.barangay) {
              layer.bindTooltip(
                `<strong>Brgy. ${feature.properties.barangay}</strong><br/><span style="color:${feature.properties.color || '#2563eb'};font-weight:600;">${feature.properties.zoneType || ''}</span>`,
                { sticky: true }
              );
              layer.on('click', (e: any) => {
                handleLocationChange(e.latlng.lat, e.latlng.lng, true);
              });
            }
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
              handleLocationChange(pos.lat, pos.lng, true);
            }
          }}
        />
        <MapEvents onLocationSelected={(lat, lng) => handleLocationChange(lat, lng, true)} />
      </MapContainer>

      <button
        onClick={(e) => { e.preventDefault(); toggleFullscreen(); }}
        style={{
          position: "absolute",
          top: "10px",
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
        <div style={{
          position: "absolute",
          bottom: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          background: "rgba(255,255,255,0.95)",
          padding: "6px 16px",
          borderRadius: "99px",
          fontSize: "0.85rem",
          fontWeight: "700",
          color: "#1d4ed8",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          pointerEvents: "none",
          border: "1px solid #bfdbfe",
          whiteSpace: "nowrap"
        }}>
          Click map or drag pin to pinpoint location
        </div>
      )}

      {/* Custom Error Modal */}
      {showError && (
        <div className="animate-fade-in-up" style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 2000,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            background: "white",
            padding: "2rem",
            borderRadius: "16px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            maxWidth: "320px",
            textAlign: "center"
          }}>
            <div style={{
              width: "64px",
              height: "64px",
              background: "#fee2e2",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem auto"
            }}>
              <AlertCircle size={32} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.5rem" }}>Out of Bounds</h3>
            <p style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: "1.5rem", lineHeight: "1.5" }}>
              The selected location falls outside the jurisdictional boundary of <strong>Sto. Tomas, Pampanga</strong>. Please pinpoint a location within the municipal borders.
            </p>
            <button
              onClick={(e) => { e.preventDefault(); setShowError(false); }}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#3b82f6",
                color: "white",
                borderRadius: "8px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                transition: "background 0.2s"
              }}
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
