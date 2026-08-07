"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, LayersControl, useMap } from "react-leaflet";
import { createLayerComponent } from "@react-leaflet/core";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { usePermitContext } from "../../context/PermitContext";
import { stoTomasZoningGeoJSON } from "../../data/stoTomasGeoJSON";

// Fix missing marker icons in Leaflet with Next.js
const iconRetinaUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png";
const iconUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png";
const shadowUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";

// Modern SVG Strings for Map Icons
const SVGS = {
  buildingPermit: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v11.26"/><path d="M18 19V7a2 2 0 0 0-2-2h-2"/><path d="M6 5H4a2 2 0 0 0-2 2v12"/><path d="M22 19H2"/><path d="M12 11h.01"/></svg>`,
  occupancyPermit: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/></svg>`,
  locationalClearance: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>`,
  municipalHall: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`,
  barangayHall: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`,
  school: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a2 2 0 0 1-.019 3.022L18.8 16.5m-15.2 0L1 12l11-6 11 6-2.6 1.42"/><path d="M10 16.9l-4.5-2.5v-4.5"/><path d="M14 16.9l4.5-2.5v-4.5"/><path d="M3.5 12v5a9.5 9.5 0 0 0 17 0v-5"/></svg>`,
  hospital: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>`,
  police: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-2 7-2 3 0 5 1 7 2a1 1 0 0 1 1 1z"/></svg>`,
  church: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 22V7a2 2 0 0 0-2-2h-3V2"/><path d="M11 2v3H8a2 2 0 0 0-2 2v15"/><path d="M3 22h18"/><path d="M12 2v5"/><path d="M10 5h4"/><path d="M10 18v4"/><path d="M14 18v4"/><path d="M10 14h4v4h-4z"/></svg>`
};

const LANDMARKS = [
  { name: "Sto. Tomas Municipal Hall", type: "Government Center", icon: SVGS.municipalHall, color: "#1e3a8a", position: [15.020, 120.710] as [number, number] },
  { name: "Sto. Tomas Rural Health Unit", type: "Main Healthcare Facility", icon: SVGS.hospital, color: "#be123c", position: [15.022, 120.712] as [number, number] },
  { name: "Sto. Tomas Police Station", type: "Law Enforcement", icon: SVGS.police, color: "#0f766e", position: [15.018, 120.708] as [number, number] },
  { name: "Poblacion Barangay Hall", type: "Barangay Center", icon: SVGS.barangayHall, color: "#475569", position: [15.018, 120.712] as [number, number] },
  { name: "San Matias Barangay Hall", type: "Barangay Center", icon: SVGS.barangayHall, color: "#475569", position: [15.022, 120.722] as [number, number] },
  { name: "San Vicente Barangay Hall", type: "Barangay Center", icon: SVGS.barangayHall, color: "#475569", position: [15.006, 120.712] as [number, number] },
  { name: "San Bartolome Barangay Hall", type: "Barangay Center", icon: SVGS.barangayHall, color: "#475569", position: [15.005, 120.722] as [number, number] },
  { name: "Moras De La Paz Barangay Hall", type: "Barangay Center", icon: SVGS.barangayHall, color: "#475569", position: [15.018, 120.705] as [number, number] },
  { name: "Santo Rosario (Pau) Barangay Hall", type: "Barangay Center", icon: SVGS.barangayHall, color: "#475569", position: [15.010, 120.700] as [number, number] },
  { name: "Santo Niño (Sapa) Barangay Hall", type: "Barangay Center", icon: SVGS.barangayHall, color: "#475569", position: [14.990, 120.705] as [number, number] },
  { name: "San Matias National High School", type: "Public Secondary School", icon: SVGS.school, color: "#b45309", position: [15.024, 120.725] as [number, number] },
  { name: "Sto. Tomas Elementary School", type: "Public Primary School", icon: SVGS.school, color: "#b45309", position: [15.016, 120.711] as [number, number] },
  { name: "San Vicente Elementary School", type: "Public Primary School", icon: SVGS.school, color: "#b45309", position: [15.004, 120.710] as [number, number] },
  { name: "San Bartolome Elementary School", type: "Public Primary School", icon: SVGS.school, color: "#b45309", position: [15.003, 120.725] as [number, number] },
  { name: "Moras De La Paz Elementary School", type: "Public Primary School", icon: SVGS.school, color: "#b45309", position: [15.020, 120.702] as [number, number] },
  { name: "San Bartolome Parish Church", type: "Catholic Church", icon: SVGS.church, color: "#6d28d9", position: [15.014, 120.716] as [number, number] },
  { name: "San Matias Parish Church", type: "Catholic Church", icon: SVGS.church, color: "#6d28d9", position: [15.020, 120.720] as [number, number] },
  { name: "Santo Niño Chapel", type: "Catholic Chapel", icon: SVGS.church, color: "#6d28d9", position: [14.988, 120.702] as [number, number] },
  { name: "San Matias Health Center", type: "Barangay Clinic", icon: SVGS.hospital, color: "#be123c", position: [15.023, 120.720] as [number, number] },
  { name: "San Vicente Health Station", type: "Barangay Clinic", icon: SVGS.hospital, color: "#be123c", position: [15.008, 120.715] as [number, number] },
];

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
        map.locate({setView: true, maxZoom: 16});
      }
      return div;
    };
    locateBtn.addTo(map);
    return () => { map.removeControl(locateBtn); };
  }, [map]);
  return null;
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
      if (filterType !== 'ALL' && !app.permitType.toLowerCase().includes(filterType.toLowerCase())) return false;
      if (searchQuery && !app.projectName.toLowerCase().includes(searchQuery.toLowerCase()) && !app.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      // If a barangay is selected, filter by its bounds (simplified by matching address text for mock data)
      if (selectedBarangay && !app.location.address.toLowerCase().includes(selectedBarangay.toLowerCase())) {
        return false;
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
      height: isFullscreen ? "100%" : "calc(100vh - 120px)", 
      width: "100%", 
      borderRadius: isFullscreen ? "0" : "var(--radius-lg)", 
      overflow: "hidden", 
      position: "relative",
      boxShadow: isFullscreen ? "none" : "var(--shadow-md)",
      background: "var(--background-primary, white)"
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

        {/* RENDER IMPORTANT LANDMARKS */}
        {LANDMARKS.map((landmark, idx) => {
          const customIcon = L.divIcon({
            html: `
              <div style="
                background: white;
                color: ${landmark.color};
                width: 32px;
                height: 32px;
                border-radius: 8px;
                border: 2px solid ${landmark.color};
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 6px rgba(0,0,0,0.2);
                transform: translate(-50%, -50%);
              ">
                ${landmark.icon}
              </div>
            `,
            className: 'custom-div-icon',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
          });

          return (
            <Marker key={`landmark-${idx}`} position={landmark.position} icon={customIcon}>
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: landmark.color, marginBottom: '8px', display: 'flex', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: landmark.icon }}></div>
                  <strong style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>{landmark.name}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{landmark.type}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        {/* CLUSTERED PERMITS (Temporarily rendering as direct markers due to React 19 compatibility issues with react-leaflet-cluster) */}
        <>
          {filteredApps.map((app) => {
            let symbol = SVGS.locationalClearance;
            let bgColor = "var(--color-primary)";

            if (app.permitType.toLowerCase().includes('building')) {
              symbol = SVGS.buildingPermit;
              bgColor = "#ef4444"; 
            } else if (app.permitType.toLowerCase().includes('occupancy')) {
              symbol = SVGS.occupancyPermit;
              bgColor = "#22c55e"; 
            } else if (app.permitType.toLowerCase().includes('locational') || app.permitType.toLowerCase().includes('clearance')) {
              symbol = SVGS.locationalClearance;
              bgColor = "#8b5cf6"; 
            }

            const permitIcon = L.divIcon({
              html: `
                <div style="
                  background: ${bgColor};
                  color: white;
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  border: 2px solid white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                  transform: translate(-50%, -50%);
                ">
                  ${symbol}
                </div>
              `,
              className: 'custom-div-icon',
              iconSize: [40, 40],
              iconAnchor: [20, 20],
              popupAnchor: [0, -20]
            });

            return (
              <Marker key={app.id} position={[app.location.lat, app.location.lng]} icon={permitIcon}>
                <Popup className="permit-popup">
                  <div style={{ padding: '0.5rem', minWidth: '220px' }}>
                    <div style={{ 
                      background: bgColor, 
                      color: 'white', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: '700', 
                      display: 'inline-block', 
                      marginBottom: '10px' 
                    }}>
                      {app.permitType.replace("_", " ")}
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#0f172a' }}>{app.projectName}</h3>
                    <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
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
                          {new Date(app.submissionDate).toLocaleDateString()}
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
        
        <div style={{ marginBottom: '16px' }}>
          <strong style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.05em' }}>Permit Applications</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
              <span style={{ background: '#ef4444', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <div style={{ width: '16px', height: '16px', display: 'flex' }} dangerouslySetInnerHTML={{ __html: SVGS.buildingPermit }} />
              </span>
              Building Permit
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
              <span style={{ background: '#8b5cf6', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <div style={{ width: '16px', height: '16px', display: 'flex' }} dangerouslySetInnerHTML={{ __html: SVGS.locationalClearance }} />
              </span>
              Locational Clearance
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
              <span style={{ background: '#22c55e', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <div style={{ width: '16px', height: '16px', display: 'flex' }} dangerouslySetInnerHTML={{ __html: SVGS.occupancyPermit }} />
              </span>
              Occupancy Permit
            </div>
          </div>
        </div>

        <div>
          <strong style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.05em' }}>Civic Landmarks</strong>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <span style={{ color: '#1e3a8a', display: 'flex' }} dangerouslySetInnerHTML={{ __html: SVGS.municipalHall }} /> Municipal Hall
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <span style={{ color: '#475569', display: 'flex' }} dangerouslySetInnerHTML={{ __html: SVGS.barangayHall }} /> Barangay Hall
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <span style={{ color: '#b45309', display: 'flex' }} dangerouslySetInnerHTML={{ __html: SVGS.school }} /> School
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <span style={{ color: '#be123c', display: 'flex' }} dangerouslySetInnerHTML={{ __html: SVGS.hospital }} /> Health Facility
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <span style={{ color: '#0f766e', display: 'flex' }} dangerouslySetInnerHTML={{ __html: SVGS.police }} /> Police Station
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <span style={{ color: '#6d28d9', display: 'flex' }} dangerouslySetInnerHTML={{ __html: SVGS.church }} /> Church
            </div>
          </div>
        </div>
      </div>
      ) : (
        <button 
          onClick={() => setShowLegend(true)}
          style={{ position: 'absolute', bottom: '24px', left: '24px', zIndex: 1000, background: 'rgba(255, 255, 255, 0.95)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🗺️ Show Legend
        </button>
      )}
      
      {/* INTERACTIVE SIDEBAR & ANALYTICS */}
      {showFilters ? (
      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: '70px', // placed to the right of Leaflet zoom controls
          zIndex: 1000,
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
            {['ALL', 'building', 'locational', 'occupancy'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: filterType === type ? 'var(--color-primary)' : 'var(--background-secondary)',
                  color: filterType === type ? 'white' : 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: filterType === type ? 'bold' : 'normal',
                  textTransform: 'capitalize'
                }}
              >
                {type === 'ALL' ? 'All Permits' : type.replace('_', ' ') + ' Permits'}
              </button>
            ))}
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
          style={{ position: 'absolute', top: '24px', left: '70px', zIndex: 1000, background: 'rgba(255, 255, 255, 0.95)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🔍 Show Filters
        </button>
      )}

      {/* FULLSCREEN BUTTON */}
      <button 
        onClick={toggleFullscreen}
        style={{ position: 'absolute', bottom: '80px', right: '10px', zIndex: 1000, background: 'white', padding: '6px', borderRadius: '4px', border: '2px solid rgba(0,0,0,0.2)', boxShadow: '0 1px 5px rgba(0,0,0,0.65)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
      >
        {isFullscreen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
        )}
      </button>

    </div>
  );
}
