import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  Filter, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  Info, 
  Calendar, 
  DollarSign, 
  Map, 
  FileText,
  User,
  Compass,
  Building,
  CheckCircle,
  Eye,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { PermitApplication, ViewFrame, PermitType } from '../types';

interface InteractiveMapViewProps {
  applications: PermitApplication[];
  onNavigate: (view: ViewFrame) => void;
  onSelectApplication: (id: string | null) => void;
}

// Sto. Tomas municipal boundary points for visual reference
const STO_TOMAS_BOUNDARY = [
  { lat: 15.0290, lng: 120.7030 }, // North-West
  { lat: 15.0298, lng: 120.7180 }, // North
  { lat: 15.0275, lng: 120.7320 }, // North-East
  { lat: 15.0150, lng: 120.7310 }, // East
  { lat: 15.0040, lng: 120.7245 }, // South-East
  { lat: 15.0035, lng: 120.7120 }, // South
  { lat: 15.0055, lng: 120.7010 }, // South-West
  { lat: 15.0180, lng: 120.7000 }  // West
];

const BARANGAYS = [
  { name: 'Poblacion', lat: 15.0132, lng: 120.7121 },
  { name: 'San Bartolome', lat: 15.0163, lng: 120.7188 },
  { name: 'San Vicente', lat: 15.0195, lng: 120.7241 },
  { name: 'San Matias', lat: 15.0233, lng: 120.7109 },
  { name: 'Santo Rosario', lat: 15.0101, lng: 120.7055 },
  { name: 'Sapa', lat: 15.0082, lng: 120.7201 },
  { name: 'Moras De La Paz', lat: 15.0255, lng: 120.7288 }
];

// Fixed bounding box that generously covers Santo Tomas municipal territory for high-performance client-side rendering
const FIXED_MIN_LAT = 14.9950;
const FIXED_MAX_LAT = 15.0380;
const FIXED_MIN_LNG = 120.6920;
const FIXED_MAX_LNG = 120.7420;

export default function InteractiveMapView({
  applications,
  onNavigate,
  onSelectApplication
}: InteractiveMapViewProps) {
  // Map container reference for precise coordinate translation and viewport calculations
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // Map positioning state
  const [zoom, setZoom] = useState(1.1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'approved' | 'all'>('approved');

  // Selected & Hovered project details
  const [hoveredApp, setHoveredApp] = useState<PermitApplication | null>(null);
  const [selectedApp, setSelectedApp] = useState<PermitApplication | null>(null);

  // Sidebar folded / collapsed state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // High Definition Map toggle state (default true for HD map rendering)
  const [isMapHD, setIsMapHD] = useState(true);

  // Background map image preload to prevent flashing on zoom/recenter
  const [loadedBackgroundUrl, setLoadedBackgroundUrl] = useState('');

  // Calculations for map bounding box
  const getTopPercent = (lat: number) => ((FIXED_MAX_LAT - lat) / (FIXED_MAX_LAT - FIXED_MIN_LAT)) * 100;
  const getLeftPercent = (lng: number) => ((lng - FIXED_MIN_LNG) / (FIXED_MAX_LNG - FIXED_MIN_LNG)) * 100;

  const resolution = isMapHD ? '2400,2064' : '1200,1032';
  const mapBackgroundUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${FIXED_MIN_LNG.toFixed(6)},${FIXED_MIN_LAT.toFixed(6)},${FIXED_MAX_LNG.toFixed(6)},${FIXED_MAX_LAT.toFixed(6)}&bboxSR=4326&size=${resolution}&format=jpg&f=image`;

  useEffect(() => {
    const img = new Image();
    img.src = mapBackgroundUrl;
    img.onload = () => {
      setLoadedBackgroundUrl(mapBackgroundUrl);
    };
  }, [isMapHD]);

  // Initial map centering
  useEffect(() => {
    handleRecenter();
  }, []);

  // Handle Drag / Pan controls
  const handleMapMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click
    setIsDraggingMap(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOffset({ x: 0, y: 0 });
  };

  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingMap) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleMapMouseUp = () => {
    if (!isDraggingMap) return;
    setIsDraggingMap(false);
    setPan(prev => ({
      x: prev.x + dragOffset.x,
      y: prev.y + dragOffset.y
    }));
    setDragOffset({ x: 0, y: 0 });
  };

  const handleMapMouseLeave = () => {
    if (!isDraggingMap) return;
    setIsDraggingMap(false);
    setPan(prev => ({
      x: prev.x + dragOffset.x,
      y: prev.y + dragOffset.y
    }));
    setDragOffset({ x: 0, y: 0 });
  };

  // Zoom / Recenter controls
  const handleZoomIn = () => {
    setZoom(prev => {
      const nextZoom = Math.min(prev + 0.4, 6.0);
      if (mapContainerRef.current) {
        const rect = mapContainerRef.current.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        setPan(prevPan => ({
          x: cx - (cx - prevPan.x) * (nextZoom / prev),
          y: cy - (cy - prevPan.y) * (nextZoom / prev)
        }));
      }
      return nextZoom;
    });
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const nextZoom = Math.max(prev - 0.4, 0.8);
      if (mapContainerRef.current) {
        const rect = mapContainerRef.current.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        setPan(prevPan => ({
          x: cx - (cx - prevPan.x) * (nextZoom / prev),
          y: cy - (cy - prevPan.y) * (nextZoom / prev)
        }));
      }
      return nextZoom;
    });
  };

  const handleRecenter = () => {
    if (!mapContainerRef.current) {
      setZoom(1.1);
      setPan({ x: 0, y: 0 });
      setDragOffset({ x: 0, y: 0 });
      setSelectedApp(null);
      return;
    }
    const rect = mapContainerRef.current.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 500;

    // Center map board exactly within container
    const targetZoom = 1.1;
    const panX = (width - width * targetZoom) / 2;
    const panY = (height - height * targetZoom) / 2;

    setZoom(targetZoom);
    setPan({ x: panX, y: panY });
    setDragOffset({ x: 0, y: 0 });
    setSelectedApp(null);
  };

  // Zoom relative to mouse cursor using mouse wheel scroll (60fps desktop experience)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = 1.15;
    let nextZoom = zoom;
    if (e.deltaY < 0) {
      nextZoom = Math.min(zoom * zoomFactor, 6.0);
    } else {
      nextZoom = Math.max(zoom / zoomFactor, 0.8);
    }

    if (nextZoom !== zoom) {
      setPan(prevPan => ({
        x: mouseX - (mouseX - prevPan.x) * (nextZoom / zoom),
        y: mouseY - (mouseY - prevPan.y) * (nextZoom / zoom)
      }));
      setZoom(nextZoom);
    }
  };

  // Navigate & Focus on specific project pin
  const handleFocusProject = (app: PermitApplication) => {
    setSelectedApp(app);
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 500;

    const leftPercent = getLeftPercent(app.location.lng);
    const topPercent = getTopPercent(app.location.lat);

    const targetX = (leftPercent / 100) * width;
    const targetY = (topPercent / 100) * height;

    const targetZoom = 2.6;
    const newPanX = (width / 2) - (targetX * targetZoom);
    const newPanY = (height / 2) - (targetY * targetZoom);

    setZoom(targetZoom);
    setPan({ x: newPanX, y: newPanY });
    setDragOffset({ x: 0, y: 0 });
  };

  // Dynamic map center coordinates calculated mathematically based on current client-side pan & zoom
  const currentPanX = pan.x + dragOffset.x;
  const currentPanY = pan.y + dragOffset.y;

  const getMapCenterCoords = () => {
    if (!mapContainerRef.current) return { lat: 15.0166, lng: 120.7160 };
    const rect = mapContainerRef.current.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 500;

    const centerX = (width / 2 - currentPanX) / zoom;
    const centerY = (height / 2 - currentPanY) / zoom;

    const percentX = Math.max(0, Math.min(100, (centerX / width) * 100));
    const percentY = Math.max(0, Math.min(100, (centerY / height) * 100));

    const lng = FIXED_MIN_LNG + (percentX / 100) * (FIXED_MAX_LNG - FIXED_MIN_LNG);
    const lat = FIXED_MAX_LAT - (percentY / 100) * (FIXED_MAX_LAT - FIXED_MIN_LAT);

    return { lat, lng };
  };

  const mapCenter = getMapCenterCoords();

  // Filtered applications list
  const filteredApps = applications.filter(app => {
    // 1. Filter by approved / all as requested by user ("all approved project inside Sto Tomas will appear")
    // Let's filter by approved & released status by default unless the toggle is flipped
    const isApproved = app.status === 'approved' || app.status === 'released';
    if (statusFilter === 'approved' && !isApproved) return false;

    // 2. Filter by permit type
    if (selectedType !== 'all' && app.permitType !== selectedType) return false;

    // 3. Filter by search query (project name, applicant, or address)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const matchProject = app.projectName.toLowerCase().includes(query);
      const matchApplicant = app.applicantName.toLowerCase().includes(query);
      const matchAddress = app.projectAddress.toLowerCase().includes(query);
      return matchProject || matchApplicant || matchAddress;
    }

    return true;
  });

  const getPermitTypeLabel = (type: PermitType) => {
    switch (type) {
      case 'locational_clearance': return 'Locational Clearance';
      case 'building_permit': return 'Building Permit';
      case 'occupancy_permit': return 'Occupancy Permit';
    }
  };

  const getPermitTypeColor = (type: PermitType) => {
    switch (type) {
      case 'locational_clearance': return 'bg-sky-100 text-sky-800 border-sky-200 text-blue-900';
      case 'building_permit': return 'bg-amber-100 text-amber-800 border-amber-200 text-amber-900';
      case 'occupancy_permit': return 'bg-emerald-100 text-emerald-800 border-emerald-200 text-emerald-900';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-[#F5F8FC] overflow-hidden" id="interactive-map-root">
      
      {/* SIDEBAR: Projects Directory List */}
      <div 
        className={`bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col shrink-0 shadow-xs z-10 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed 
            ? 'w-0 h-0 lg:w-0 lg:h-full overflow-hidden opacity-0 pointer-events-none' 
            : 'w-full h-[400px] lg:h-full lg:w-96'
        }`}
      >
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100 bg-blue-50/20">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Map className="h-5 w-5 text-[#0038A8]" />
              <h2 className="font-display font-extrabold text-lg text-gray-900 tracking-tight">
                Sto. Tomas GIS Registry
              </h2>
            </div>
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-1.5 hover:bg-gray-200/60 rounded-lg text-gray-500 hover:text-gray-900 transition-colors duration-200"
              title="Collapse Sidebar"
              id="collapse-sidebar-btn"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Geographical Information System of approved and issued building clearances.
          </p>
        </div>

        {/* Sidebar Controls */}
        <div className="p-4 border-b border-gray-100 space-y-3 bg-white">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search project, applicant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all duration-200"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            )}
          </div>

          {/* Permit Type filter tabs */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
              Clearance Type
            </label>
            <div className="grid grid-cols-4 gap-1 bg-gray-100 p-0.5 rounded-lg">
              <button
                onClick={() => setSelectedType('all')}
                className={`py-1 text-[10px] font-bold rounded transition-colors ${
                  selectedType === 'all' 
                    ? 'bg-white text-[#0038A8] shadow-xs' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedType('locational_clearance')}
                className={`py-1 text-[10px] font-bold rounded transition-colors ${
                  selectedType === 'locational_clearance' 
                    ? 'bg-sky-600 text-white shadow-xs' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Locational Clearance"
              >
                Zoning
              </button>
              <button
                onClick={() => setSelectedType('building_permit')}
                className={`py-1 text-[10px] font-bold rounded transition-colors ${
                  selectedType === 'building_permit' 
                    ? 'bg-amber-600 text-white shadow-xs' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Building Permit"
              >
                Building
              </button>
              <button
                onClick={() => setSelectedType('occupancy_permit')}
                className={`py-1 text-[10px] font-bold rounded transition-colors ${
                  selectedType === 'occupancy_permit' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Occupancy Permit"
              >
                Occupancy
              </button>
            </div>
          </div>

          {/* Status filter toggles */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-50">
            <span className="text-[10px] font-mono uppercase text-gray-400 tracking-wider">Show scope</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-full border transition-all ${
                  statusFilter === 'approved'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-gray-50 text-gray-400 border-gray-200 hover:text-gray-700'
                }`}
              >
                Approved Only
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-full border transition-all ${
                  statusFilter === 'all'
                    ? 'bg-blue-100 text-[#0038A8] border-blue-200'
                    : 'bg-gray-50 text-gray-400 border-gray-200 hover:text-gray-700'
                }`}
              >
                All States
              </button>
            </div>
          </div>
        </div>

        {/* Project directory lists */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 bg-gray-50/50">
          <div className="px-4 py-2.5 bg-gray-100/50 text-[10px] text-gray-400 font-mono flex justify-between items-center">
            <span>Listings ({filteredApps.length})</span>
            <span className="capitalize">{statusFilter} Registry</span>
          </div>

          {filteredApps.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Info className="h-8 w-8 mx-auto mb-2 opacity-40 text-gray-400" />
              <p className="text-xs font-medium">No projects found</p>
              <p className="text-[10px] mt-0.5">Try widening filters or searching something else.</p>
            </div>
          ) : (
            filteredApps.map((app) => {
              const isSelected = selectedApp?.id === app.id;
              const isAppApproved = app.status === 'approved' || app.status === 'released';
              return (
                <div
                  key={app.id}
                  onClick={() => handleFocusProject(app)}
                  className={`p-3.5 text-left cursor-pointer transition-all hover:bg-white border-l-4 ${
                    isSelected 
                      ? 'bg-blue-50/60 border-l-blue-600 shadow-xs' 
                      : isAppApproved
                        ? 'border-l-green-500 hover:border-l-green-600'
                        : 'border-l-gray-300 hover:border-l-blue-400'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-mono text-gray-400 block">{app.id}</span>
                    <span className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded-full ${
                      app.status === 'approved' || app.status === 'released'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : app.status === 'under_review'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-gray-900 mt-1 line-clamp-1">
                    {app.projectName}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                    <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{app.applicantName}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">
                    {app.projectAddress}
                  </p>
                  
                  <div className="mt-2.5 flex items-center justify-between text-[10px] border-t border-dashed border-gray-100 pt-2 text-gray-500">
                    <span className={`px-2 py-0.5 rounded font-medium text-[9px] ${getPermitTypeColor(app.permitType)}`}>
                      {getPermitTypeLabel(app.permitType)}
                    </span>
                    <span className="font-mono text-gray-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {app.dateSubmitted}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MAIN CONTAINER: Drag-to-Pan GIS Map Canvas */}
      <div className="flex-1 flex flex-col h-full relative" id="interactive-gis-map-container">
        
        {/* Expand Sidebar Trigger Button when Collapsed */}
        {isSidebarCollapsed && (
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="absolute top-4 left-4 z-40 bg-white hover:bg-gray-50 text-[#0038A8] p-3 rounded-xl border border-gray-200 shadow-xl flex items-center gap-2 font-display font-black text-xs transition-all duration-200 hover:scale-105 active:scale-95"
            title="Expand Registry"
            id="expand-sidebar-btn"
          >
            <PanelLeftOpen className="h-5 w-5" />
            <span className="hidden sm:inline">Expand Registry</span>
          </button>
        )}

        {/* Floating Top Info Panel */}
        <div className={`absolute top-4 z-20 transition-all duration-300 ${
          isSidebarCollapsed ? 'left-4 sm:left-44 md:left-48' : 'left-4'
        } bg-blue-950/95 text-white p-3 rounded-2xl border border-blue-800/80 shadow-lg backdrop-blur-md max-w-sm hidden sm:block`}>
          <div className="flex items-start gap-2.5">
            <Compass className="h-5 w-5 text-yellow-400 mt-0.5 animate-spin-slow shrink-0" />
            <div>
              <h3 className="font-display font-bold text-xs tracking-wide text-white uppercase">
                Santo Tomas Municipal Territory
              </h3>
              <p className="text-[10px] text-blue-200 mt-0.5 leading-relaxed">
                Displaying all coordinates within boundary limits. Drag map to pan, scroll or use buttons to zoom. Hover over any Pin to view status and project dossiers.
              </p>
            </div>
          </div>
        </div>

        {/* Map Stage Canvas */}
        <div
          id="interactive-gis-map"
          ref={mapContainerRef}
          onMouseDown={handleMapMouseDown}
          onMouseMove={handleMapMouseMove}
          onMouseUp={handleMapMouseUp}
          onMouseLeave={handleMapMouseLeave}
          onWheel={handleWheel}
          className={`relative w-full flex-1 bg-[#09152b] overflow-hidden select-none transition-colors ${
            isDraggingMap ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Draggable/Pannable Layer container (CSS transform for instant 60fps zooming and panning) */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              transform: `translate3d(${pan.x + dragOffset.x}px, ${pan.y + dragOffset.y}px, 0px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isDraggingMap ? 'none' : 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* The preloaded World Satellite Imagery background */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-300"
              style={{
                backgroundImage: `url("${loadedBackgroundUrl || mapBackgroundUrl}")`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
              }}
            />

            {/* Scientific Grid overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none z-0">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="gis-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <rect width="40" height="40" fill="none" stroke="#FFF" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#gis-grid)" />
              </svg>
            </div>

            {/* Sto. Tomas Red-Dotted Municipal Boundary SVG Overlay */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              viewBox="0 0 100 100" 
              preserveAspectRatio="none"
            >
              <polygon
                points={STO_TOMAS_BOUNDARY.map(pt => {
                  const x = getLeftPercent(pt.lng);
                  const y = getTopPercent(pt.lat);
                  return `${x},${y}`;
                }).join(' ')}
                fill="rgba(0, 56, 168, 0.04)"
                stroke="#CE1126"
                strokeWidth={1.5 / zoom}
                strokeDasharray="2.5 1.5"
                className="animate-pulse"
              />
              <text
                x="50"
                y="95"
                textAnchor="middle"
                className="fill-[#FCD116] font-mono font-bold text-[3px] tracking-widest uppercase opacity-70 select-none"
              >
                Santo Tomas Municipal Boundary Line
              </text>
            </svg>

            {/* Barangay Landmarks Layer */}
            {BARANGAYS.map((b) => {
              const topPercent = getTopPercent(b.lat);
              const leftPercent = getLeftPercent(b.lng);

              return (
                <div
                  key={b.name}
                  className="absolute pointer-events-none flex flex-col items-center z-10"
                  style={{ 
                    top: `${topPercent}%`, 
                    left: `${leftPercent}%`,
                    transform: `translate3d(-50%, -50%, 0px) scale(${1 / zoom})`
                  }}
                >
                  <div className="w-1.5 h-1.5 bg-[#FCD116] rounded-full border border-black shadow-xs animate-pulse"></div>
                  <span className="text-[8px] text-white font-mono font-medium mt-0.5 whitespace-nowrap bg-blue-950/85 px-1.5 py-0.5 rounded border border-blue-800/50 shadow-xs">
                    Brgy. {b.name}
                  </span>
                </div>
              );
            })}

            {/* Interactive Approved/All Permit Application Pins */}
            {filteredApps.map((app) => {
              const topPercent = getTopPercent(app.location.lat);
              const leftPercent = getLeftPercent(app.location.lng);

              const isSelected = selectedApp?.id === app.id;
              const isHovered = hoveredApp?.id === app.id;
              const isAppApproved = app.status === 'approved' || app.status === 'released';

              // Decide color coding for Pins based on permit type
              let pinBg = 'bg-[#CE1126]'; // default
              if (app.permitType === 'locational_clearance') {
                pinBg = 'bg-sky-600';
              } else if (app.permitType === 'building_permit') {
                pinBg = 'bg-amber-500';
              } else if (app.permitType === 'occupancy_permit') {
                pinBg = 'bg-emerald-600';
              }

              return (
                <div
                  key={app.id}
                  onMouseEnter={() => setHoveredApp(app)}
                  onMouseLeave={() => setHoveredApp(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFocusProject(app);
                  }}
                  className="absolute z-20 cursor-pointer"
                  style={{ 
                    top: `${topPercent}%`, 
                    left: `${leftPercent}%`,
                    transform: `translate3d(-50%, -100%, 0px) scale(${(isSelected || isHovered ? 1.25 : 1) / zoom})`,
                    transition: 'transform 0.15s ease-out'
                  }}
                >
                  <div className="relative group">
                    {/* Glowing background halo */}
                    <div className={`absolute -inset-1 rounded-full ${pinBg} opacity-25 scale-150 animate-ping -z-10`} />

                    {/* Distinct Pin Container */}
                    <div className={`flex items-center justify-center p-1.5 rounded-full shadow-lg border-2 transition-transform duration-200 ${
                      isSelected || isHovered
                        ? 'border-yellow-300 ring-4 ring-yellow-400/20' 
                        : 'border-white'
                    } ${pinBg}`}>
                      <MapPin className="h-4.5 w-4.5 text-white" />
                    </div>

                    {/* Small text tag under pin */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="text-[9px] font-mono font-bold text-white bg-black/60 px-1.5 py-0.5 rounded shadow-xs">
                        {app.id.substring(app.id.indexOf('-') + 1)}
                      </span>
                    </div>

                    {/* HOVER TOOLTIP (Shows Status and Project Details on mouse hover) */}
                    {isHovered && !isSelected && (
                      <div className="absolute bottom-11 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white p-3 rounded-xl border border-slate-700/80 shadow-2xl z-50 min-w-[240px] pointer-events-none backdrop-blur-md">
                        <div className="flex justify-between items-start gap-3 mb-1.5">
                          <span className="text-[9px] text-gray-400 font-mono tracking-wider uppercase">
                            {getPermitTypeLabel(app.permitType)}
                          </span>
                          <span className={`px-1.5 py-0.2 text-[8px] font-extrabold rounded-full ${
                            isAppApproved
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {app.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="text-xs font-extrabold text-white line-clamp-1">
                          {app.projectName}
                        </h4>
                        <p className="text-[10px] text-gray-300 mt-1 flex items-center gap-1">
                          <User className="h-3 w-3 text-gray-400" />
                          {app.applicantName}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                          {app.projectAddress}
                        </p>
                        <div className="mt-2 text-[9px] text-gray-400 border-t border-slate-800 pt-1.5 flex justify-between items-center">
                          <span>Submitted: {app.dateSubmitted}</span>
                          <span className="text-yellow-400 font-bold">Click to view details</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Map HUD Zoom & Quality Controls Overlay (Floating) */}
          <div 
            className="absolute bottom-5 right-5 flex flex-col gap-2 z-30"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* HD Map Quality toggle indicator */}
            <button
              onClick={() => setIsMapHD(!isMapHD)}
              className={`p-2.5 rounded-xl shadow-lg border transition-all duration-200 flex flex-col items-center justify-center focus:outline-none ${
                isMapHD 
                  ? 'bg-gradient-to-br from-blue-600 to-[#0038A8] text-white border-blue-500 hover:scale-105 active:scale-95' 
                  : 'bg-white/95 hover:bg-white text-gray-700 hover:text-gray-900 border-gray-200'
              }`}
              title={isMapHD ? "HD Map (2400x1200) Enabled" : "SD Map (1200x600) Enabled"}
              id="map-hd-toggle-btn"
            >
              <span className="text-[10px] font-extrabold font-mono leading-none">HD</span>
              <span className="text-[7px] font-mono mt-0.5 uppercase opacity-80">{isMapHD ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={handleZoomIn}
              className="bg-white/95 hover:bg-white text-blue-950 hover:text-blue-700 p-2.5 rounded-xl shadow-lg border border-gray-200 transition-colors flex items-center justify-center focus:outline-none"
              title="Zoom In"
              id="map-zoomin-btn"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="bg-white/95 hover:bg-white text-[#0038A8] hover:text-blue-700 p-2.5 rounded-xl shadow-lg border border-gray-200 transition-colors flex items-center justify-center focus:outline-none"
              title="Zoom Out"
              id="map-zoomout-btn"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <button
              onClick={handleRecenter}
              className="bg-white/95 hover:bg-white text-[#0038A8] hover:text-blue-700 p-2.5 rounded-xl shadow-lg border border-gray-200 transition-colors flex items-center justify-center focus:outline-none"
              title="Reset View"
              id="map-recenter-btn"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>

          {/* Out of View Warning Indicator */}
          {selectedApp && (() => {
            const baseTopPercent = getTopPercent(selectedApp.location.lat);
            const baseLeftPercent = getLeftPercent(selectedApp.location.lng);
            
            if (!mapContainerRef.current) return null;
            const rect = mapContainerRef.current.getBoundingClientRect();
            const width = rect.width || 800;
            const height = rect.height || 500;

            const visualX = currentPanX + (baseLeftPercent / 100) * width * zoom;
            const visualY = currentPanY + (baseTopPercent / 100) * height * zoom;

            if (visualY < 0 || visualY > height || visualX < 0 || visualX > width) {
              return (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-600/95 text-white text-[10px] font-bold px-3 py-1.5 rounded-md border border-rose-700 shadow-lg z-20 pointer-events-none animate-pulse flex items-center gap-1.5">
                  <Compass className="h-4 w-4 animate-spin-slow" />
                  <span>Selected Pin is out of viewport (Click Recenter or search)</span>
                </div>
              );
            }
            return null;
          })()}

          {/* Map HUD Status bar (Coordinates) */}
          <div className="absolute bottom-4 left-4 bg-blue-950/80 text-white px-3 py-1.5 rounded-xl text-[10px] font-mono border border-blue-900 shadow-sm pointer-events-none backdrop-blur-xs z-20 flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${isMapHD ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></span>
            <span>{isMapHD ? 'HD mode' : 'SD mode'} • Lat: {mapCenter.lat.toFixed(4)} • Lng: {mapCenter.lng.toFixed(4)} • Scale: {zoom.toFixed(1)}x Zoom</span>
          </div>
        </div>

        {/* BOTTOM DRAWER / INTERACTIVE VIEW: Selected Project Details */}
        {selectedApp && (
          <div className="bg-white border-t border-gray-200 p-4 shadow-xl relative z-20 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-all animate-slide-up" id="project-detail-drawer">
            <button 
              onClick={() => setSelectedApp(null)}
              className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Close Details"
              id="close-drawer-btn"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] bg-blue-100 text-[#0038A8] font-mono font-bold px-2 py-0.5 rounded">
                  {selectedApp.id}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getPermitTypeColor(selectedApp.permitType)}`}>
                  {getPermitTypeLabel(selectedApp.permitType)}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedApp.status === 'approved' || selectedApp.status === 'released'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  Status: {selectedApp.status.toUpperCase().replace('_', ' ')}
                </span>
              </div>

              <div>
                <h3 className="font-display font-black text-base text-gray-900 leading-tight">
                  {selectedApp.projectName}
                </h3>
                <p className="text-xs text-gray-500 mt-1 font-medium flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  Applicant: <span className="text-gray-800 font-semibold">{selectedApp.applicantName}</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Location Coordinates: {selectedApp.location.lat.toFixed(5)}, {selectedApp.location.lng.toFixed(5)}
                </p>
                <p className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded-lg border border-gray-100 italic line-clamp-2">
                  "{selectedApp.projectDescription}"
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
              <button
                onClick={() => {
                  onSelectApplication(selectedApp.id);
                  onNavigate('tracking_details');
                }}
                className="flex-1 sm:w-44 bg-[#0038A8] hover:bg-[#002B80] text-white text-xs font-extrabold py-2 px-4 rounded-xl shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-1.5"
                id="drawer-track-dossier-btn"
              >
                <Eye className="h-4 w-4" />
                <span>View Full Dossier</span>
              </button>
              <button
                onClick={() => setSelectedApp(null)}
                className="flex-1 sm:w-44 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 px-4 rounded-xl transition-colors flex items-center justify-center"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
