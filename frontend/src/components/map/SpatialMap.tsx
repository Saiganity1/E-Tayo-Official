"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, LayersControl, useMap, useMapEvents } from "react-leaflet";
import { createLayerComponent } from "@react-leaflet/core";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { usePermitContext } from "../../context/PermitContext";
import { stoTomasZoningGeoJSON } from "../../data/stoTomasGeoJSON";
import { PROJECT_TYPES_MATRIX, ProjectCategory } from "../../data/projectTypeMatrix";
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

export default function SpatialMap() {
  const { applications } = usePermitContext();
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState<any>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
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

  const STO_TOMAS_CENTER: [number, number] = [15.0050, 120.7100];
  const STO_TOMAS_BOUNDS: L.LatLngBoundsLiteral = [
    [14.80, 120.50],
    [15.20, 120.90] 
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

  const onEachFeature = (feature: any, layer: L.Layer) => {
    layer.on('click', () => {
      if(feature.properties.barangay) {
        // Toggle selection
        setSelectedBarangay((prev: any) => prev === feature.properties.barangay ? null : feature.properties.barangay);
      }
    });

    if (feature.properties && feature.properties.isBoundary) {
      layer.bindTooltip(
        `<strong>${feature.properties.name}</strong><br/>
         <small>${feature.properties.description}</small>`,
        { sticky: true }
      );
    } else if (feature.properties && feature.properties.barangay) {
      layer.bindTooltip(
        `<strong>${feature.properties.barangay}</strong><br/>
         <span style="color:${feature.properties.color}">${feature.properties.zoneType} Zone</span><br/>
         <small>Click to view analytics</small>`,
        { sticky: true }
      );
    }
  };

  const styleFeature = (feature: any) => {
    const isSelected = selectedBarangay === feature.properties.barangay;
    
    if (feature.properties.isBoundary) {
      return {
        fillColor: 'transparent',
        weight: 4,
        opacity: 1,
        color: feature.properties.color,
        dashArray: '5, 10',
        fillOpacity: 0
      };
    }
    
    return {
      fillColor: feature.properties.color,
      weight: isSelected ? 4 : 2,
      opacity: 1,
      color: isSelected ? 'white' : 'white',
      dashArray: isSelected ? '' : '3',
      fillOpacity: isSelected ? 0.7 : 0.4
    };
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
      {/* MAP CONTAINER */}
      <MapContainer 
        center={STO_TOMAS_CENTER} 
        zoom={13} 
        style={{ height: "100%", width: "100%" }}
        maxBounds={STO_TOMAS_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={12}
      >
        <MapResizer isFullscreen={isFullscreen} />
        <LocateControl />
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

          <LayersControl.Overlay checked name="Zoning & Land Use (GeoJSON)">
            <GeoJSON 
              key={JSON.stringify(stoTomasZoningGeoJSON) + "-v5-" + selectedBarangay}
              data={stoTomasZoningGeoJSON} 
              style={styleFeature}
              onEachFeature={onEachFeature}
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
                          app.status === 'APPROVED' ? '#10b981' : 
                          app.status === 'REJECTED' ? '#ef4444' : 
                          app.status === 'UNDER_REVIEW' ? '#3b82f6' : '#f59e0b'
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

      {/* FLOATING MAP LEGEND */}
      {showLegend ? (
      <div 
        style={{ 
          position: 'absolute', 
          bottom: '24px', 
          left: '24px', 
          zIndex: 1000, 
          background: 'rgba(255, 255, 255, 0.95)', 
          padding: '16px 20px', 
          borderRadius: 'var(--radius-md)', 
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)', 
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0,0,0,0.05)',
          maxWidth: '300px',
          maxHeight: 'calc(100% - 48px)',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '2px solid var(--border-color)', paddingBottom: '8px' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Map Legend</h4>
          <button onClick={() => setShowLegend(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>&minus;</button>
        </div>
        
        <div>
          <strong style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '10px', letterSpacing: '0.05em' }}>Project Types</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(PROJECT_CATEGORY_THEMES).map(([catKey, theme]) => (
              <div key={catKey} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                <span style={{ 
                  background: theme.color, 
                  width: '28px', 
                  height: '28px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white',
                  flexShrink: 0,
                  boxShadow: `0 2px 6px ${theme.color}40`
                }}>
                  <div style={{ width: '15px', height: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: theme.svg }} />
                </span>
                <span style={{ fontWeight: 600, color: '#334155' }}>{theme.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      ) : (
        <button 
          onClick={() => setShowLegend(true)}
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          Show Map Legend
        </button>
      )}
      
      {/* INTERACTIVE SIDEBAR & ANALYTICS */}
      {showFilters ? (
      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: '70px', // placed to the right of Leaflet zoom controls
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

        {selectedBarangay && (
          <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '2px dashed var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-primary)' }}>{selectedBarangay} Analytics</h4>
              <button 
                onClick={() => setSelectedBarangay(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                &times;
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'var(--background-secondary)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{filteredApps.length}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Permits</div>
              </div>
              <div style={{ background: 'var(--background-secondary)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#eab308' }}>{filteredApps.filter(a => a.status === 'pending' || a.status === 'under_review').length}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pending</div>
              </div>
            </div>
          </div>
        )}
      </div>
      ) : (
        <button 
          onClick={() => setShowFilters(true)}
          style={{ 
            position: 'absolute', 
            top: '24px', 
            left: '70px', 
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

    </div>
  );
}
