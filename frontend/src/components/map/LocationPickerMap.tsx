"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Maximize, Minimize } from "lucide-react";

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

function MapEvents({ onLocationSelected }: { onLocationSelected: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerMap() {
  const [position, setPosition] = useState<[number, number]>([14.995, 120.705]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
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
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <Marker 
          position={position} 
          icon={customIcon}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const pos = marker.getLatLng();
              setPosition([pos.lat, pos.lng]);
            }
          }}
        />
        <MapEvents onLocationSelected={(lat, lng) => setPosition([lat, lng])} />
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
        {isFullscreen ? <Minimize size={18} color="#0f172a" /> : <Maximize size={18} color="#0f172a" />}
      </button>

      {!isFullscreen && (
        <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: "rgba(255,255,255,0.95)", padding: "6px 16px", borderRadius: "99px", fontSize: "0.85rem", fontWeight: "700", color: "#1d4ed8", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", pointerEvents: "none", border: "1px solid #bfdbfe", whiteSpace: "nowrap" }}>
          Click or drag pin to set location
        </div>
      )}
    </div>
  );
}
