"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, LayersControl, useMap, useMapEvents } from "react-leaflet";
import { createLayerComponent } from "@react-leaflet/core";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { usePermitContext } from "../../context/PermitContext";
import { PROJECT_TYPES_MATRIX, ProjectCategory } from "../../data/projectTypeMatrix";
import { 
  stoTomasZoningGeoJSON, 
  stoTomasMunicipalBoundaryGeoJSON, 
  stoTomasMaskGeoJSON,
  STO_TOMAS_MUNICIPAL_CENTER,
  STO_TOMAS_BOUNDS,
  STO_TOMAS_GOVERNMENT_INFO,
  STO_TOMAS_GEODATA_PROVENANCE
} from "../../data/stoTomasGeoJSON";
import { PermitApplication } from "../../types";

// Fix missing marker icons in Leaflet with Next.js
const iconRetinaUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png";
const iconUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png";
const shadowUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";

// Project Category Themes & Modern SVG Icons
export const PROJECT_CATEGORY_THEMES: Record<ProjectCategory, {
  label: string;
  color: string;
  bg: string;
  border: string;
  svg: string;
}> = {
  Residential: {
    label: "Residential",
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
  },
  Commercial: {
    label: "Commercial",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`
  },
  Industrial: {
    label: "Industrial",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></svg>`
  },
  Institutional: {
    label: "Institutional",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`
  },
  "Ancillary & Alterations": {
    label: "Ancillary & Alterations",
    color: "#0284c7",
    bg: "#f0f9ff",
    border: "#bae6fd",
    svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`
  },
  "Utilities & Mechanical": {
    label: "Utilities & Mechanical",
    color: "#e11d48",
    bg: "#fff1f2",
    border: "#fecdd3",
    svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
  }
};

export function getAppProjectCategory(app: PermitApplication): {
  category: ProjectCategory;
  projectNameDisplay: string;
  projectTypeName: string;
} {
  // 1. Try matching by app.projectType
  if (app.projectType) {
    const matched = PROJECT_TYPES_MATRIX.find(
      p => p.id.toLowerCase() === app.projectType?.toLowerCase() ||
           p.name.toLowerCase() === app.projectType?.toLowerCase()
    );
    if (matched) {
      return {
        category: matched.category,
        projectNameDisplay: app.projectName || matched.name,
        projectTypeName: matched.name,
      };
    }
  }

  // 2. Try matching by app.projectName
  if (app.projectName) {
    const matched = PROJECT_TYPES_MATRIX.find(
      p => app.projectName.toLowerCase().includes(p.name.toLowerCase()) ||
           app.projectName.toLowerCase().includes(p.id.replace(/_/g, " ").toLowerCase())
    );
    if (matched) {
      return {
        category: matched.category,
        projectNameDisplay: app.projectName,
        projectTypeName: matched.name,
      };
    }
  }

  // 3. Fallbacks based on keywords
  const lowerName = (app.projectName || "").toLowerCase();
  const lowerDesc = (app.projectDescription || "").toLowerCase();
  const combined = `${lowerName} ${lowerDesc}`;

  if (combined.includes("commercial") || combined.includes("mall") || combined.includes("store") || combined.includes("office") || combined.includes("retail") || combined.includes("restaurant") || combined.includes("hotel")) {
    return { category: "Commercial", projectNameDisplay: app.projectName || "Commercial Project", projectTypeName: "Commercial Development" };
  }
  if (combined.includes("industrial") || combined.includes("warehouse") || combined.includes("factory") || combined.includes("plant") || combined.includes("manufacturing")) {
    return { category: "Industrial", projectNameDisplay: app.projectName || "Industrial Project", projectTypeName: "Industrial Facility" };
  }
  if (combined.includes("institutional") || combined.includes("school") || combined.includes("church") || combined.includes("hospital") || combined.includes("government")) {
    return { category: "Institutional", projectNameDisplay: app.projectName || "Institutional Project", projectTypeName: "Institutional Building" };
  }
  if (combined.includes("fence") || combined.includes("demolition") || combined.includes("renovation") || combined.includes("alteration") || combined.includes("sign")) {
    return { category: "Ancillary & Alterations", projectNameDisplay: app.projectName || "Ancillary Works", projectTypeName: "Ancillary & Alterations" };
  }
  if (combined.includes("solar") || combined.includes("generator") || combined.includes("electrical") || combined.includes("mechanical") || combined.includes("utility")) {
    return { category: "Utilities & Mechanical", projectNameDisplay: app.projectName || "Utility Installation", projectTypeName: "Utilities & Mechanical" };
  }

  // Default to Residential
  return { category: "Residential", projectNameDisplay: app.projectName || "Residential House", projectTypeName: "Single-Detached House" };
}


function LocateControl() {
  const map = useMap();
  useEffect(() => {
    const locateBtn = new L.Control({ position: 'bottomright' });
    locateBtn.onAdd = function () {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
      div.innerHTML = `<button style="background: white; border: none; padding: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 5px rgba(0,0,0,0.65); border-radius: 4px;" title="Locate Me">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0-10 10"/><path d="M12 22a10 10 0 0 0 10-10"/><path d="M22 12a10 10 0 0 0-10-10"/><path d="M2 12a10 10 0 0 0 10 10"/><circle cx="12" cy="12" r="3" fill="#2563eb"/></svg>
      </button>`;
      div.onclick = function(e){
        e.preventDefault();
        map.locate();
      }
      return div;
    };
    locateBtn.addTo(map);
    return () => { map.removeControl(locateBtn); };
  }, [map]);
  return null;
}

function UserLocationMarker() {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMapEvents({
    locationfound(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, 16);
    },
  });

  if (!position) return null;

  const userIcon = L.divIcon({
    html: `<div style="width: 20px; height: 20px; background-color: #2563eb; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5); animation: pulse 2s infinite;"></div>`,
    className: 'user-location-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  return (
    <Marker position={position} icon={userIcon}>
      <Popup>
        <div style={{ textAlign: "center", fontWeight: "bold", color: "#1e40af" }}>You are here</div>
      </Popup>
    </Marker>
  );
}

function MapResizer({ isFullscreen }: { isFullscreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timeout);
  }, [map, isFullscreen]);
  return null;
}

function FitStoTomasButton() {
  const map = useMap();
  const handleFit = () => {
    map.fitBounds([
      [14.9752, 120.6913],
      [15.0311, 120.7332]
    ], { padding: [35, 35], animate: true });
  };

  return (
    <button
      onClick={(e) => { e.preventDefault(); handleFit(); }}
      style={{
        position: 'absolute',
        top: '80px',
        left: '12px',
        zIndex: 1000,
        background: 'white',
        border: '2px solid rgba(0,0,0,0.2)',
        borderRadius: '4px',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 1px 5px rgba(0,0,0,0.3)',
        color: '#1e3a8a'
      }}
      title="Fit to Sto. Tomas Municipal Boundary"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
        <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
        <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
        <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    </button>
  );
}

export default function SpatialMap() {
  const { applications } = usePermitContext();
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState<any>(null);
  const [hoveredZone, setHoveredZone] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showGeoDataModal, setShowGeoDataModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapWrapperRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
    });
  }, []);

  const STO_TOMAS_CENTER: [number, number] = STO_TOMAS_MUNICIPAL_CENTER;
  const STO_TOMAS_MAX_BOUNDS: L.LatLngBoundsLiteral = [
    [14.92, 120.62],
    [15.10, 120.80]
  ];

  // Filtering Logic
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const { category } = getAppProjectCategory(app);
      if (filterType !== 'ALL' && category !== filterType) return false;
      if (searchQuery && !app.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) && !app.id?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      // If a barangay is selected, filter by its bounds (simplified by matching address text for mock data)
      if (selectedBarangay) {
        if (!app.location || !app.location.address) return false;
        if (!app.location.address.toLowerCase().includes(selectedBarangay.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [applications, filterType, searchQuery, selectedBarangay]);

  const selectedFeature = useMemo(() => {
    if (!selectedBarangay) return null;
    return stoTomasZoningGeoJSON.features.find((f: any) => f.properties?.barangay === selectedBarangay)?.properties || null;
  }, [selectedBarangay]);

  const styleFeature = (feature: any) => {
    const isSelected = selectedBarangay === feature.properties?.barangay;
    const isHovered = hoveredZone?.barangay === feature.properties?.barangay;
    
    return {
      fillColor: feature.properties?.color || '#3b82f6',
      weight: isSelected ? 3.5 : isHovered ? 2.5 : 1.5,
      opacity: 1,
      color: isSelected ? '#1e3a8a' : isHovered ? '#0f172a' : '#ffffff',
      dashArray: isSelected || isHovered ? '' : '2, 4',
      fillOpacity: isSelected ? 0.75 : isHovered ? 0.68 : 0.42
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const p = feature.properties;
    if (!p) return;

    layer.on({
      mouseover: (e) => {
        const target = e.target;
        target.setStyle({
          weight: 3,
          color: '#0f172a',
          fillOpacity: 0.70
        });
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          target.bringToFront();
        }
        setHoveredZone(p);
      },
      mouseout: (e) => {
        const target = e.target;
        target.setStyle(styleFeature(feature));
        setHoveredZone(null);
      },
      click: () => {
        setSelectedBarangay((prev: any) => prev === p.barangay ? null : p.barangay);
      }
    });
  };

  return (
    <div ref={mapWrapperRef} style={{ 
      height: "100%", 
      width: "100%", 
      borderRadius: isFullscreen ? "0" : "var(--radius-lg)", 
      overflow: "hidden", 
      position: "relative",
      boxShadow: isFullscreen ? "none" : "var(--shadow-md)",
      background: "var(--background-primary, white)",
      minHeight: "500px" // Fallback minimum height
    }}>
      {/* FLOATING LEGAL CADASTRAL BOUNDARY BADGE & GEOJSON VERIFICATION TRIGGER */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '56px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(10px)',
          border: '1px solid #bfdbfe',
          borderRadius: '99px',
          padding: '6px 14px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.78rem',
          fontWeight: '700',
          color: '#1e3a8a',
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'inline-block', boxShadow: '0 0 6px #0284c7' }}></span>
          <span>Republic of the Philippines • LGU Sto. Tomas, Pampanga (PSGC: 0305421000)</span>
        </div>

        <button
          onClick={() => setShowGeoDataModal(true)}
          style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '99px',
            padding: '6px 14px',
            fontSize: '0.76rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(30, 64, 175, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
          title="Inspect Official Geospatial Data & Download Cadastral GeoJSON"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          GeoJSON & Legal Cadastre
        </button>
      </div>

      {/* FLOATING ZONE INSPECTOR CARD ON HOVER */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        pointerEvents: 'none',
        maxWidth: 'calc(100% - 48px)',
        transition: 'all 0.2s ease'
      }}>
        {hoveredZone ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.97)',
            backdropFilter: 'blur(12px)',
            border: `2px solid ${hoveredZone.color}`,
            borderRadius: '16px',
            padding: '10px 18px',
            boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '14px',
              height: '14px',
              borderRadius: '4px',
              backgroundColor: hoveredZone.color,
              flexShrink: 0,
              boxShadow: `0 0 8px ${hoveredZone.color}`
            }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a' }}>
                  Brgy. {hoveredZone.barangay}
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  color: hoveredZone.color,
                  background: `${hoveredZone.color}20`,
                  padding: '2px 8px',
                  borderRadius: '99px'
                }}>
                  {hoveredZone.code}
                </span>
                {hoveredZone.otop && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    color: '#92400e',
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    padding: '1px 7px',
                    borderRadius: '99px'
                  }}>
                    ⭐ OTOP: {hoveredZone.otop}
                  </span>
                )}
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {hoveredZone.areaKm2} km² {hoveredZone.areaHectares ? `(${hoveredZone.areaHectares} ha • ${hoveredZone.landAreaPercent})` : ''}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#334155', fontWeight: '600', marginTop: '2px' }}>
                {hoveredZone.name} — <span style={{ color: hoveredZone.color }}>{hoveredZone.zoneType}</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <span>Limits: <strong>{hoveredZone.buildingRegulations?.maxHeight}</strong></span>
                <span>Setbacks: <strong>{hoveredZone.buildingRegulations?.setbacks}</strong></span>
                {hoveredZone.floodSusceptibility && (
                  <span style={{ color: hoveredZone.floodSusceptibility.includes('High') ? '#b91c1c' : '#b45309', fontWeight: '600' }}>
                    🌊 Baha: {hoveredZone.floodSusceptibility}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #cbd5e1',
            borderRadius: '99px',
            padding: '6px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            fontSize: '0.8rem',
            color: '#475569',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7', display: 'inline-block' }}></span>
            <span>Hover over any colored area to view official zoning classification & building regulations</span>
          </div>
        )}
      </div>

      {/* MAP CONTAINER */}
      <MapContainer 
        center={STO_TOMAS_CENTER} 
        zoom={13} 
        style={{ height: "100%", width: "100%" }}
        maxBounds={STO_TOMAS_MAX_BOUNDS}
        maxBoundsViscosity={0.9}
        minZoom={12}
      >
        <MapResizer isFullscreen={isFullscreen} />
        <LocateControl />
        <FitStoTomasButton />
        <UserLocationMarker />
        
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Standard Map (OSM)">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Topographic View">
            <TileLayer
              attribution='Map data: &copy; OpenTopoMap'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite Imagery (ESRI)">
            <TileLayer
              attribution='Tiles &copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>

          {/* 1. Cadastral Focus Mask (Dims areas outside Sto. Tomas for border clarity) */}
          <LayersControl.Overlay checked name="Focus Sto. Tomas (Boundary Mask)">
            <GeoJSON 
              key="sto-tomas-mask"
              data={stoTomasMaskGeoJSON} 
              style={{
                fillColor: '#0f172a',
                fillOpacity: 0.16,
                stroke: false
              }}
              onEachFeature={(_f, layer) => {
                if ((layer as any)._path) {
                  (layer as any)._path.style.pointerEvents = 'none';
                }
              }}
            />
          </LayersControl.Overlay>

          {/* 2. Barangay Zoning & Land Use (Hover over colors to view zones) */}
          <LayersControl.Overlay checked name="Barangay Zoning & Land Use">
            <GeoJSON 
              key={JSON.stringify(stoTomasZoningGeoJSON) + "-v7-" + selectedBarangay}
              data={stoTomasZoningGeoJSON} 
              style={styleFeature}
              onEachFeature={onEachFeature}
            />
          </LayersControl.Overlay>

          {/* 3. Official Municipal Perimeter Line (Stroke only, doesn't block hover events) */}
          <LayersControl.Overlay checked name="Sto. Tomas Municipal Border">
            <GeoJSON 
              key="sto-tomas-official-border"
              data={stoTomasMunicipalBoundaryGeoJSON} 
              style={{
                color: '#1e40af',
                weight: 4,
                opacity: 0.95,
                fill: false,
                dashArray: '6, 6'
              }}
              onEachFeature={(feature: any, layer: L.Layer) => {
                layer.bindTooltip(
                  `<div style="padding: 4px; font-family: inherit;">
                    <div style="font-weight: 700; color: #1e40af; font-size: 13px;">🏛️ Municipality of Sto. Tomas, Pampanga</div>
                    <div style="font-size: 11px; color: #475569; margin-top: 2px;">Official Cadastral Boundary (PSA: 0305421000)</div>
                    <div style="font-size: 10px; color: #64748b; margin-top: 4px; border-top: 1px solid #cbd5e1; padding-top: 3px;">
                      Bounded by: San Fernando (N) • San Simon (E) • Minalin (S) • Bacolor (W)
                    </div>
                  </div>`,
                  { sticky: true }
                );
              }}
            />
          </LayersControl.Overlay>
        </LayersControl>

        {/* CLUSTERED PERMITS (Rendered with Project Type Category icons and colors) */}
        <>
          {filteredApps.map((app) => {
            if (!app.location || typeof app.location.lat === 'undefined' || typeof app.location.lng === 'undefined') {
              return null; // Skip rendering applications without valid location data to prevent crashes
            }

            const { category, projectNameDisplay, projectTypeName } = getAppProjectCategory(app);
            const theme = PROJECT_CATEGORY_THEMES[category] || PROJECT_CATEGORY_THEMES.Residential;

            const permitIcon = L.divIcon({
              html: `
                <div style="
                  background: ${theme.color};
                  color: white;
                  width: 38px;
                  height: 38px;
                  border-radius: 50%;
                  border: 2.5px solid white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                  transform: translate(-50%, -50%);
                ">
                  <div style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">
                    ${theme.svg}
                  </div>
                </div>
              `,
              className: 'custom-div-icon',
              iconSize: [38, 38],
              iconAnchor: [19, 19],
              popupAnchor: [0, -19]
            });

            return (
              <Marker key={app.id} position={[app.location.lat, app.location.lng]} icon={permitIcon}>
                <Popup className="permit-popup">
                  <div style={{ padding: '0.5rem', minWidth: '230px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ 
                        background: theme.bg, 
                        color: theme.color, 
                        border: `1px solid ${theme.border}`,
                        padding: '3px 8px', 
                        borderRadius: '999px', 
                        fontSize: '0.72rem', 
                        fontWeight: '700', 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ display: 'inline-flex', width: '13px', height: '13px' }} dangerouslySetInnerHTML={{ __html: theme.svg }} />
                        {category}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>
                        {app.id}
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 2px 0', fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>{projectNameDisplay}</h3>
                    <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '8px', fontWeight: '600' }}>
                      {projectTypeName}
                    </div>

                    <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      {app.location.address}
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Status</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 
                          app.status.toLowerCase() === 'approved' || app.status.toLowerCase() === 'released' ? '#10b981' : 
                          app.status.toLowerCase() === 'rejected' ? '#ef4444' : 
                          app.status.toLowerCase() === 'under_review' ? '#3b82f6' : '#f59e0b'
                        }}>
                          {app.status.replace("_", " ")}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Submitted</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                          {new Date(app.dateSubmitted || (app as any).submissionDate || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <a href={`/applicant/track/${app.id}`} style={{ 
                      display: 'block', 
                      background: '#f1f5f9', 
                      color: 'var(--color-primary)', 
                      textAlign: 'center', 
                      padding: '8px', 
                      borderRadius: '6px', 
                      textDecoration: 'none', 
                      fontSize: '0.85rem', 
                      fontWeight: '600',
                      border: '1px solid #e2e8f0'
                    }}>
                      View Application Details
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </>
      </MapContainer>

      {/* INTERACTIVE SIDEBAR & ANALYTICS */}
      {showFilters ? (
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px', // placed to the right of Leaflet zoom controls
          zIndex: 10000,
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '20px',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0,0,0,0.05)',
          width: '320px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary)' }}>Spatial Filters</h3>
            <button onClick={() => setShowFilters(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>&minus;</button>
          </div>
          <input
            type="text"
            placeholder="Search Project Name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              marginBottom: '12px',
              fontSize: '0.9rem'
            }}
          />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(['ALL', 'Residential', 'Commercial', 'Industrial', 'Institutional', 'Ancillary & Alterations', 'Utilities & Mechanical'] as const).map(type => {
              const isSelected = filterType === type;
              const theme = type !== 'ALL' ? PROJECT_CATEGORY_THEMES[type as ProjectCategory] : null;
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: isSelected ? (theme ? theme.color : 'var(--color-primary)') : 'var(--background-secondary)',
                    color: isSelected ? 'white' : 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: isSelected ? '700' : '500',
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {theme && (
                    <span style={{ display: 'inline-flex', width: '14px', height: '14px' }} dangerouslySetInnerHTML={{ __html: theme.svg }} />
                  )}
                  {type === 'ALL' ? 'All Project Types' : type}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      ) : (
        <button 
          onClick={() => setShowFilters(true)}
          style={{ 
            position: 'absolute', 
            bottom: '24px', 
            left: '24px', 
            zIndex: 10000, 
            background: 'var(--color-primary)', 
            color: 'white',
            padding: '10px 16px', 
            borderRadius: 'var(--radius-md)', 
            border: 'none', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          Show Filters
        </button>
      )}

      {/* RIGHT-SIDE CADASTRAL & ZONING INSPECTION CARD (OPENS ON BARANGAY CLICK) */}
      {selectedBarangay && selectedFeature && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 1100,
            width: 'min(400px, calc(100% - 32px))',
            maxHeight: 'calc(100% - 32px)',
            overflowY: 'auto',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid #bfdbfe',
            borderRadius: '20px',
            boxShadow: '0 20px 45px -10px rgba(30, 64, 175, 0.25), 0 4px 12px rgba(0, 0, 0, 0.08)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: selectedFeature.color || '#2563eb',
                display: 'inline-block',
                boxShadow: `0 0 10px ${selectedFeature.color || '#2563eb'}`
              }} />
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                Brgy. {selectedBarangay}
              </h3>
              <span style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1d4ed8',
                fontWeight: '800',
                fontSize: '0.76rem',
                padding: '2px 8px',
                borderRadius: '99px'
              }}>
                {selectedFeature.code}
              </span>
            </div>
            <button 
              onClick={() => setSelectedBarangay(null)}
              style={{
                background: '#f1f5f9',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '1.25rem',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
              title="Close Inspection Panel"
            >
              &times;
            </button>
          </div>

          {/* Subtitle / Cadastral Data */}
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '-4px' }}>
            PSGC: <strong style={{ color: '#1e3a8a' }}>{selectedFeature.psgc || '0305421000'}</strong> • Area: <strong>{selectedFeature.areaKm2} km²</strong> {selectedFeature.areaHectares ? `(${selectedFeature.areaHectares} ha • ${selectedFeature.landAreaPercent})` : ''}
          </div>

          {/* OTOP Badge */}
          {selectedFeature.otop && (
            <div style={{
              background: '#fef3c7',
              border: '1px solid #fde68a',
              color: '#92400e',
              padding: '6px 12px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '1.1rem' }}>⭐</span>
              <div>
                <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: '#b45309', display: 'block', letterSpacing: '0.5px' }}>One Town One Product (OTOP)</span>
                <span>{selectedFeature.otop}</span>
              </div>
            </div>
          )}

          {/* Signature Blue Card Section */}
          <div style={{
            background: '#eff6ff',
            borderLeft: '4px solid #2563eb',
            borderRadius: '10px',
            padding: '12px 14px'
          }}>
            <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#1e3a8a', lineHeight: '1.3' }}>
              {selectedFeature.name}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#2563eb', fontWeight: '700', marginTop: '3px' }}>
              CLUP Zone: {selectedFeature.zoneType}
            </div>
          </div>

          {/* Description */}
          {selectedFeature.description && (
            <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: '1.5' }}>
              {selectedFeature.description}
            </div>
          )}

          {/* Quick Metrics (Permits) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#1e3a8a' }}>{filteredApps.length}</div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Total Permits</div>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#d97706' }}>
                {filteredApps.filter(a => a.status === 'pending' || a.status === 'under_review').length}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Pending Review</div>
            </div>
          </div>

          {/* Growth Node & Demographics */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {selectedFeature.growthNode && (
              <div style={{ color: '#334155' }}>
                🎯 <strong>CLUP Role:</strong> {selectedFeature.growthNode}
              </div>
            )}
            {selectedFeature.population2025Proj && (
              <div style={{ color: '#334155' }}>
                👥 <strong>Populasyon:</strong> {selectedFeature.population2010?.toLocaleString()} (2010) → <strong style={{ color: '#1e3a8a' }}>{selectedFeature.population2025Proj?.toLocaleString()} (2025 Proj)</strong>
              </div>
            )}
          </div>

          {/* Hazard Susceptibility (CLUP Table 5) */}
          {selectedFeature.floodSusceptibility && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#991b1b', textTransform: 'uppercase', marginBottom: '3px' }}>
                ⚠️ Hazard Vulnerability (CLUP Table 5)
              </div>
              <div style={{ fontSize: '0.78rem', color: '#b91c1c', fontWeight: '600' }}>
                🌊 Baha: <strong>{selectedFeature.floodSusceptibility}</strong>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#7f1d1d', marginTop: '2px' }}>
                🌋 Lindol: {selectedFeature.groundShaking} • Liquefaction: {selectedFeature.liquefactionSusceptibility || 'High (H)'}
              </div>
            </div>
          )}

          {/* Building Limits (PD 1096 NBCP) */}
          {selectedFeature.buildingRegulations && (
            <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px 12px', fontSize: '0.78rem' }}>
              <div style={{ fontWeight: '800', color: '#1e40af', marginBottom: '6px' }}>
                Building Limits (PD 1096 NBCP & CLUP):
              </div>
              <div style={{ color: '#334155', lineHeight: '1.5' }}>• Max Height: <strong>{selectedFeature.buildingRegulations.maxHeight}</strong></div>
              <div style={{ color: '#334155', lineHeight: '1.5' }}>• Setbacks: <strong>{selectedFeature.buildingRegulations.setbacks}</strong></div>
              <div style={{ color: '#334155', lineHeight: '1.5' }}>• Max PSO: <strong>{selectedFeature.buildingRegulations.maxPSO}</strong></div>
              {selectedFeature.buildingRegulations.parkingMandate && (
                <div style={{ color: '#1e40af', fontWeight: '600', marginTop: '2px' }}>• Parking: {selectedFeature.buildingRegulations.parkingMandate}</div>
              )}
              {selectedFeature.buildingRegulations.soilTestMandate && (
                <div style={{ color: '#1e40af', fontWeight: '600', marginTop: '2px' }}>• Soil Test: {selectedFeature.buildingRegulations.soilTestMandate}</div>
              )}
            </div>
          )}

          {/* Permitted Uses (CLUP) */}
          {selectedFeature.permittedUses && (
            <div style={{ fontSize: '0.78rem', color: '#334155' }}>
              <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>Permitted Uses (CLUP):</div>
              <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: '1.45' }}>
                {selectedFeature.permittedUses.map((use: string, i: number) => (
                  <li key={i} style={{ marginBottom: '3px' }}>{use}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Special Rules */}
          {selectedFeature.specialRules && selectedFeature.specialRules.length > 0 && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px', fontSize: '0.75rem', color: '#475569' }}>
              <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Special Zoning Guidelines:</div>
              <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: '1.4' }}>
                {selectedFeature.specialRules.map((rule: string, i: number) => (
                  <li key={i} style={{ marginBottom: '2px' }}>{rule}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Card Footer */}
          <div style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '8px',
            marginTop: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.72rem'
          }}>
            <span style={{ color: '#16a34a', fontWeight: '700' }}>✓ Official LGU Cadastral Zone</span>
            <span style={{ color: '#2563eb', fontWeight: '600' }}>CLUP 2016-2025 Enacted</span>
          </div>
        </div>
      )}

      {/* FULLSCREEN BUTTON */}
      <button 
        onClick={toggleFullscreen}
        style={{ position: 'absolute', bottom: '80px', right: '24px', zIndex: 10000, background: 'white', padding: '10px', borderRadius: 'var(--radius-md)', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
      >
        {isFullscreen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
        )}
      </button>

      {/* TOOLTIP STYLES */}
      <style>{`
        .zone-hover-tooltip {
          background: rgba(255, 255, 255, 0.98) !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25) !important;
          padding: 8px 12px !important;
          backdrop-filter: blur(8px) !important;
          pointer-events: none !important;
        }
        .zone-hover-tooltip::before {
          border-top-color: rgba(255, 255, 255, 0.98) !important;
        }
      `}</style>

      {/* GEOSPATIAL & CADASTRAL SPECIFICATION MODAL */}
      {showGeoDataModal && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowGeoDataModal(false)}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '760px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid #e2e8f0',
              padding: '24px 28px',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ 
                    background: '#eff6ff', 
                    color: '#1d4ed8', 
                    padding: '3px 8px', 
                    borderRadius: '6px', 
                    fontSize: '0.72rem', 
                    fontWeight: '800',
                    letterSpacing: '0.5px'
                  }}>
                    OFFICIAL GEOSPATIAL SPECIFICATION
                  </span>
                  <span style={{ 
                    background: '#f0fdf4', 
                    color: '#15803d', 
                    padding: '3px 8px', 
                    borderRadius: '6px', 
                    fontSize: '0.72rem', 
                    fontWeight: '700' 
                  }}>
                    RFC 7946 Standard
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                  Sto. Tomas, Pampanga Cadastral & Zoning Map Data
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Verified government administrative boundaries and comprehensive land use classification.
                </p>
              </div>
              <button 
                onClick={() => setShowGeoDataModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  color: '#475569'
                }}
              >
                &times;
              </button>
            </div>

            {/* Overview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>PSA PSGC / ZIP</div>
                <div style={{ fontSize: '1.0rem', fontWeight: '800', color: '#1e3a8a' }}>0305421000 • 2020</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Official Land Area</div>
                <div style={{ fontSize: '1.0rem', fontWeight: '800', color: '#0f172a' }}>14.67 km² (1,467.5 ha)</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Population Growth</div>
                <div style={{ fontSize: '1.0rem', fontWeight: '800', color: '#0f172a' }}>38,062 → 47,809 (2025)</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Seat of Government</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>San Vicente (P.D. 1441)</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>CLUP Planning Period</div>
                <div style={{ fontSize: '1.0rem', fontWeight: '800', color: '#16a34a' }}>2016–2025 Enacted</div>
              </div>
            </div>

            {/* Barangay Breakdown Table */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>7 Official Barangays (Cadastral & CLUP Profiles)</span>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 'normal' }}>Source: CLUP 2016-2025 Table 1, 4 & 5</span>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#475569', fontWeight: '700' }}>
                      <th style={{ padding: '8px 12px' }}>Barangay</th>
                      <th style={{ padding: '8px 12px' }}>OTOP (Product)</th>
                      <th style={{ padding: '8px 12px' }}>CLUP Zone Code</th>
                      <th style={{ padding: '8px 12px' }}>Land Area</th>
                      <th style={{ padding: '8px 12px' }}>% Share</th>
                      <th style={{ padding: '8px 12px' }}>Pop. (2010→2025)</th>
                      <th style={{ padding: '8px 12px' }}>Flood Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stoTomasZoningGeoJSON.features.map((feat: any, idx: number) => {
                      const p = feat.properties;
                      return (
                        <tr key={idx} style={{ borderTop: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          <td style={{ padding: '8px 12px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: p.color, display: 'inline-block' }}></span>
                            {p.barangay}
                          </td>
                          <td style={{ padding: '8px 12px', color: '#92400e', fontWeight: '600' }}>
                            {p.otop || 'N/A'}
                          </td>
                          <td style={{ padding: '8px 12px', color: '#334155' }}>
                            <span style={{ background: `${p.color}15`, color: p.color, padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                              {p.code}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: '600', color: '#475569' }}>
                            {p.areaKm2} km² ({p.areaHectares || (p.areaKm2 * 100).toFixed(1)} ha)
                          </td>
                          <td style={{ padding: '8px 12px', color: '#475569' }}>
                            {p.landAreaPercent || '-'}
                          </td>
                          <td style={{ padding: '8px 12px', color: '#475569' }}>
                            {p.population2010?.toLocaleString()} → {p.population2025Proj?.toLocaleString()}
                          </td>
                          <td style={{ padding: '8px 12px', color: p.floodSusceptibility?.includes('High') ? '#b91c1c' : '#b45309', fontWeight: '600' }}>
                            {p.floodSusceptibility || 'Moderate'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Municipal Land Use Allocation (Table 14) */}
            {STO_TOMAS_GOVERNMENT_INFO.clupProposedLandUseTable14 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>CLUP 2016-2025 Proposed Land Use Allocation (Table 14)</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 'normal' }}>Total: 1,467.50 Hectares (100.0%)</span>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflowX: 'auto', maxHeight: '200px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#475569', fontWeight: '700' }}>
                        <th style={{ padding: '6px 10px' }}>Land Use Category</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>Existing 2015 (ha)</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>Proposed 2016-2025 (ha)</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>Proposed Share (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {STO_TOMAS_GOVERNMENT_INFO.clupProposedLandUseTable14.map((row: any, i: number) => (
                        <tr key={i} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          <td style={{ padding: '6px 10px', fontWeight: '600', color: '#1e293b' }}>{row.category}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', color: '#64748b' }}>{row.existingHa.toFixed(2)} ha</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '700', color: '#1e3a8a' }}>{row.proposedHa.toFixed(2)} ha</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '600', color: '#16a34a' }}>{row.proposedPct.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Legal Authorities & File Provenance */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#1e3a8a', marginBottom: '6px' }}>
                Legal Framework & Data Provenance (CLUP 2016-2025 Enacted)
              </div>
              <ul style={{ margin: '0 0 10px 0', paddingLeft: '18px', fontSize: '0.76rem', color: '#475569', lineHeight: '1.4' }}>
                <li><strong>Republic Act No. 7160</strong> (Local Government Code of 1991, Sec. 20 (c) CLUP Mandate)</li>
                <li><strong>Presidential Decree No. 1096</strong> (National Building Code of the Philippines - NBCP)</li>
                <li><strong>Presidential Decree No. 1441</strong> (Mandating Barrio San Vicente as the Official Seat of Municipal Government)</li>
                <li><strong>Presidential Decree No. 1067</strong> (Water Code of the Philippines - Mandatory 3m Urban & 20m Agri River Easements)</li>
                <li><strong>Comprehensive Land Use Plan (CLUP 2016-2025)</strong> & Zoning Ordinance of Sto. Tomas, Pampanga</li>
                <li><strong>Cadastral Survey Reference</strong>: OpenStreetMap Administrative Relation <code>13255070</code> and Relations <code>21027520–21027526</code></li>
              </ul>
              
              <div style={{ fontSize: '0.76rem', color: '#475569' }}>
                <strong>Active System File:</strong> <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>/data/sto_tomas_pampanga_cadastral.geojson</code>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <a
                href="/data/sto_tomas_pampanga_cadastral.geojson"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#f1f5f9',
                  color: '#1e293b',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                View Raw GeoJSON
              </a>
              <a
                href="/data/sto_tomas_pampanga_cadastral.geojson"
                download="sto_tomas_pampanga_cadastral.geojson"
                style={{
                  background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 18px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(30, 64, 175, 0.3)'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download Official Cadastral GeoJSON
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
