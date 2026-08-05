import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, MapPin, UploadCloud, CheckCircle, FileText, Check, HelpCircle, ArrowRight, ShieldCheck, Trash2, AlertTriangle, ZoomIn, ZoomOut, Compass } from 'lucide-react';
import { ViewFrame, PermitApplication, PermitType, Requirement } from '../types';
import { DEFAULT_REQUIREMENTS_BY_TYPE } from '../data';

interface NewApplicationViewProps {
  onAddApplication: (app: PermitApplication) => void;
  onNavigate: (view: ViewFrame) => void;
  onSelectApplication: (id: string) => void;
  selectedPermitType: PermitType;
  onSetSelectedPermitType: (type: PermitType) => void;
}

export default function NewApplicationView({
  onAddApplication,
  onNavigate,
  onSelectApplication,
  selectedPermitType,
  onSetSelectedPermitType
}: NewApplicationViewProps) {
  // Multistep state
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form fields state
  const [applicantName, setApplicantName] = useState('Juan Dela Cruz');
  const [applicantPhone, setApplicantPhone] = useState('0917 000 4567');
  const [applicantEmail, setApplicantEmail] = useState('juan.delacruz@email.com');
  const [applicantAddress, setApplicantAddress] = useState('123 Rizal Street, Sto. Tomas, Pampanga');
  
  const [projectName, setProjectName] = useState('Dela Cruz Warehouse');
  const [projectAddress, setProjectAddress] = useState('Lot 8, Block 3, Brgy. San Bartolome, Sto. Tomas, Pampanga');
  const [projectDescription, setProjectDescription] = useState('Proposed construction of a warehouse building for logistics and storage purposes.');
  const [lotNo, setLotNo] = useState('8');
  const [blockNo, setBlockNo] = useState('3');
  const [selectedBarangay, setSelectedBarangay] = useState('San Bartolome');

  // GIS coordinates
  const [pinnedLat, setPinnedLat] = useState(15.0163);
  const [pinnedLng, setPinnedLng] = useState(120.7188);
  const [isPinned, setIsPinned] = useState(true);

  // Sto. Tomas boundary points for validation and display
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

  const isPointInPolygon = (lat: number, lng: number, polygon: { lat: number; lng: number }[]) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng, yi = polygon[i].lat;
      const xj = polygon[j].lng, yj = polygon[j].lat;
      
      const intersect = ((yi > lat) !== (yj > lat))
          && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Map zoom and center states
  const [zoom, setZoom] = useState(1.0);
  const [mapCenter, setMapCenter] = useState({ lat: 15.0150, lng: 120.7150 });
  const [validationError, setValidationError] = useState<string | null>(null);

  // Map dragging states
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartCenter, setDragStartCenter] = useState({ lat: 15.0150, lng: 120.7150 });
  const [hasMovedDrag, setHasMovedDrag] = useState(false);

  // Background map image preload to prevent flashing on swap
  const [loadedBackgroundUrl, setLoadedBackgroundUrl] = useState('');

  React.useEffect(() => {
    const latSpan = 0.0300 / zoom;
    const lngSpan = 0.0300 / zoom;
    const minLat = mapCenter.lat - (latSpan / 2);
    const maxLat = mapCenter.lat + (latSpan / 2);
    const minLng = mapCenter.lng - (lngSpan / 2);
    const maxLng = mapCenter.lng + (lngSpan / 2);
    const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${minLng.toFixed(6)},${minLat.toFixed(6)},${maxLng.toFixed(6)},${maxLat.toFixed(6)}&bboxSR=4326&size=1000,500&format=jpg&f=image`;

    const img = new Image();
    img.src = url;
    img.onload = () => {
      setLoadedBackgroundUrl(url);
    };
  }, [mapCenter, zoom]);

  // Uploaded files state
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { name: string; size: string }>>({});
  const [isDragging, setIsDragging] = useState(false);

  // Mock Sto. Tomas Barangays & coordinates
  const BARANGAYS = [
    { name: 'Poblacion', lat: 15.0132, lng: 120.7121 },
    { name: 'San Bartolome', lat: 15.0163, lng: 120.7188 },
    { name: 'San Vicente', lat: 15.0195, lng: 120.7241 },
    { name: 'San Matias', lat: 15.0233, lng: 120.7109 },
    { name: 'Santo Rosario', lat: 15.0101, lng: 120.7055 },
    { name: 'Sapa', lat: 15.0082, lng: 120.7201 },
    { name: 'Moras De La Paz', lat: 15.0255, lng: 120.7288 }
  ];

  // Steps definitions
  const steps = [
    { num: 1, name: 'Permit Type' },
    { num: 2, name: 'Applicant Info' },
    { num: 3, name: 'Project Details' },
    { num: 4, name: 'Upload Files' },
    { num: 5, name: 'Pin Site' }
  ];

  // Requirements checklist per selected type
  const requirementChecklist = DEFAULT_REQUIREMENTS_BY_TYPE[selectedPermitType] || [];

  const handleBarangayChange = (brgyName: string) => {
    setSelectedBarangay(brgyName);
    const brgyObj = BARANGAYS.find(b => b.name === brgyName);
    if (brgyObj) {
      setPinnedLat(brgyObj.lat);
      setPinnedLng(brgyObj.lng);
      setIsPinned(true);
      // Automatically update the project address input
      setProjectAddress(`Lot ${lotNo}, Block ${blockNo}, Brgy. ${brgyName}, Sto. Tomas, Pampanga`);
      // Recenter the map on the selected barangay
      setMapCenter({ lat: brgyObj.lat, lng: brgyObj.lng });
      // Reset any out of bounds validation error because default barangays are inside
      setValidationError(null);
    }
  };

  const handleCoordinateChange = (lat: number, lng: number) => {
    if (isNaN(lat) || isNaN(lng)) return;
    
    const inside = isPointInPolygon(lat, lng, STO_TOMAS_BOUNDARY);
    if (!inside) {
      setValidationError("Out of Bounds: Input coordinates must be within Santo Tomas, Pampanga municipal borders.");
    } else {
      setValidationError(null);
    }

    setPinnedLat(Number(lat.toFixed(4)));
    setPinnedLng(Number(lng.toFixed(4)));
    setIsPinned(true);
  };

  const handleMapMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag with left click
    if (e.button !== 0) return;
    setIsDraggingMap(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOffset({ x: 0, y: 0 });
    setDragStartCenter({ lat: mapCenter.lat, lng: mapCenter.lng });
    setHasMovedDrag(false);
  };

  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingMap) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Determine if user has dragged more than a minimal threshold to prevent misinterpreting minor click twitches
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      setHasMovedDrag(true);
    }
    
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleMapMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingMap) return;
    setIsDraggingMap(false);
    
    // If they dragged, update mapCenter once on release
    if (hasMovedDrag) {
      const rect = e.currentTarget.getBoundingClientRect();
      const latSpan = 0.0300 / zoom;
      const lngSpan = 0.0300 / zoom;
      
      const deltaLat = (dragOffset.y / rect.height) * latSpan;
      const deltaLng = -(dragOffset.x / rect.width) * lngSpan;
      
      setMapCenter({
        lat: dragStartCenter.lat + deltaLat,
        lng: dragStartCenter.lng + deltaLng
      });
      setDragOffset({ x: 0, y: 0 });
    } else {
      // If they clicked without moving significantly, perform standard pinning
      handleMapGridClick(e);
    }
  };

  const handleMapMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingMap) return;
    setIsDraggingMap(false);
    
    if (hasMovedDrag) {
      const rect = e.currentTarget.getBoundingClientRect();
      const latSpan = 0.0300 / zoom;
      const lngSpan = 0.0300 / zoom;
      
      const deltaLat = (dragOffset.y / rect.height) * latSpan;
      const deltaLng = -(dragOffset.x / rect.width) * lngSpan;
      
      setMapCenter({
        lat: dragStartCenter.lat + deltaLat,
        lng: dragStartCenter.lng + deltaLng
      });
    }
    setDragOffset({ x: 0, y: 0 });
  };

  const handleMapGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within element.
    const y = e.clientY - rect.top;  // y position within element.
    
    // Zoom-aware lat/lng calculation
    const latSpan = 0.0300 / zoom;
    const lngSpan = 0.0300 / zoom;
    const maxLat = mapCenter.lat + (latSpan / 2);
    const minLng = mapCenter.lng - (lngSpan / 2);

    const calculatedLat = maxLat - (y / rect.height) * latSpan;
    const calculatedLng = minLng + (x / rect.width) * lngSpan;

    // Validate if click is inside the Sto. Tomas municipal boundary
    const inside = isPointInPolygon(calculatedLat, calculatedLng, STO_TOMAS_BOUNDARY);
    if (!inside) {
      setValidationError("Out of Bounds: Pinned location must be within Santo Tomas, Pampanga municipal borders.");
      return;
    }

    // Clear validation error if valid
    setValidationError(null);
    
    // Find closest barangay to click position for fun user interaction
    let closestBrgy = BARANGAYS[0];
    let minDist = Infinity;
    BARANGAYS.forEach(b => {
      const dist = Math.pow(b.lat - calculatedLat, 2) + Math.pow(b.lng - calculatedLng, 2);
      if (dist < minDist) {
        minDist = dist;
        closestBrgy = b;
      }
    });

    setPinnedLat(Number(calculatedLat.toFixed(4)));
    setPinnedLng(Number(calculatedLng.toFixed(4)));
    setIsPinned(true);
    setSelectedBarangay(closestBrgy.name);
    setProjectAddress(`Lot ${lotNo}, Block ${blockNo}, Brgy. ${closestBrgy.name}, Sto. Tomas, Pampanga`);
  };

  // Simulating document attachment
  const handleSimulateUpload = (reqName: string) => {
    const sizes = ['1.2 MB', '2.4 MB', '1.8 MB', '3.1 MB', '0.9 MB'];
    const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
    const extension = reqName.toLowerCase().includes('form') || reqName.toLowerCase().includes('plan') ? 'pdf' : 'jpg';
    const mockFilename = `${reqName.toLowerCase().substring(0, 15).replace(/[^a-z0-9]/g, '_')}_final.${extension}`;

    setUploadedFiles(prev => ({
      ...prev,
      [reqName]: { name: mockFilename, size: randomSize }
    }));
  };

  const handleRemoveFile = (reqName: string) => {
    setUploadedFiles(prev => {
      const copy = { ...prev };
      delete copy[reqName];
      return copy;
    });
  };

  const handleSubmit = () => {
    // Generate new unique ID based on type and current year
    const prefix = selectedPermitType === 'locational_clearance' ? 'LC' 
                 : selectedPermitType === 'building_permit' ? 'BP' 
                 : 'OC';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newId = `${prefix}-2026-${randomNum}`;

    // Format submitted requirements based on checklist and upload state
    const formattedRequirements: Requirement[] = requirementChecklist.map(name => {
      const upload = uploadedFiles[name];
      return {
        name,
        required: true,
        status: upload ? 'approved' : 'pending',
        fileName: upload ? upload.name : undefined,
        fileSize: upload ? upload.size : undefined,
        remarks: upload ? 'Uploaded and pending evaluation.' : undefined
      };
    });

    const todayStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });

    const newApplication: PermitApplication = {
      id: newId,
      permitType: selectedPermitType,
      projectName: projectName || 'Untitled Project',
      applicantName,
      applicantPhone,
      applicantEmail,
      applicantAddress,
      projectAddress,
      projectDescription: projectDescription || 'No description provided.',
      status: 'pending',
      dateSubmitted: todayStr,
      requirements: formattedRequirements,
      location: {
        lat: pinnedLat,
        lng: pinnedLng,
        address: projectAddress,
        lotNo,
        blockNo
      },
      trackingSteps: [
        { title: 'Application Submitted', status: 'completed', date: todayStr, notes: 'Online application successfully submitted through the eTAYO web portal.', actor: applicantName },
        { title: 'Initial Document Verification', status: 'current', notes: 'Evaluating uploaded requirements for stamp and seal compliance.' },
        { title: 'Technical Plan Evaluation', status: 'upcoming', notes: 'Engineering team checking zoning and structural calculations.' },
        { title: 'Technical Clearance Endorsement', status: 'upcoming', notes: 'Final sign-off of compliance certificates.' },
        { title: 'Final Approval & Release', status: 'upcoming', notes: 'Endorsement of Building Official.' }
      ],
      estimatedFees: 0,
      paymentStatus: 'paid',
      historyLog: [
        { date: `${todayStr}, 06:00 PM`, action: 'Application Created', actor: applicantName, details: 'Created digital permit dossier online.' },
        { date: `${todayStr}, 06:00 PM`, action: 'Attached Documents', actor: applicantName, details: `Successfully uploaded ${Object.keys(uploadedFiles).length} supporting documents.` }
      ]
    };

    onAddApplication(newApplication);
    onSelectApplication(newId);
    onNavigate('tracking_details');
  };

  return (
    <div id="new-application-root" className="flex-1 bg-[#F5F8FC] min-h-screen font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white px-8 py-4 border-b border-blue-100 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md border border-blue-200 font-semibold uppercase">
            New Permit Application
          </span>
          <span className="text-gray-400 text-sm">/</span>
          <span className="text-xs text-gray-600 font-medium font-mono">Submission Wizard</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-[#0038A8] to-[#CE1126] flex items-center justify-center text-white font-display font-bold text-sm shadow-xs">
            JD
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-gray-800 leading-none">Juan Dela Cruz</div>
            <div className="text-[10px] text-gray-500 font-mono mt-0.5">Applicant Portal</div>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-5xl mx-auto w-full space-y-8 flex-1 flex flex-col justify-between">
        
        {/* Title and Step Progress Indicator */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-display font-extrabold text-gray-900 tracking-tight">
              New Permit Application
            </h1>
            <p className="text-sm text-gray-600">
              Complete the required information and upload supporting documents for OBO review.
            </p>
          </div>

          {/* Stepper HUD */}
          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs">
            <div className="relative flex justify-between items-center">
              {/* Connector Line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-blue-50 -translate-y-1/2 z-0"></div>
              <div 
                className="absolute top-1/2 left-0 h-1 bg-[#0038A8] -translate-y-1/2 z-0 transition-all duration-300"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              ></div>

              {steps.map((st) => {
                const isPassed = st.num < currentStep;
                const isActive = st.num === currentStep;
                return (
                  <div key={st.num} className="relative z-10 flex flex-col items-center">
                    <button
                      onClick={() => {
                        // Allow skipping back and forth if validations are ok
                        setCurrentStep(st.num);
                      }}
                      id={`step-indicator-bubble-${st.num}`}
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-display text-xs font-bold transition-all duration-200 border-2 ${
                        isPassed
                          ? 'bg-[#0038A8] border-[#0038A8] text-white'
                          : isActive
                          ? 'bg-white border-[#0038A8] text-[#0038A8] scale-110 shadow-md shadow-blue-50'
                          : 'bg-blue-50/50 border-blue-100 text-gray-400'
                      }`}
                    >
                      {isPassed ? <Check className="h-4.5 w-4.5 stroke-[3]" /> : st.num}
                    </button>
                    <span className={`text-[10px] mt-2 font-semibold tracking-tight transition-colors duration-200 hidden sm:block ${
                      isActive ? 'text-[#0038A8] font-extrabold' : isPassed ? 'text-gray-800' : 'text-gray-400'
                    }`}>
                      {st.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Wizard Panel Content */}
        <section className="flex-1 mt-6 bg-white rounded-3xl border border-blue-100 p-6 lg:p-8 shadow-xs flex flex-col justify-between">
          
          {/* STEP 1: SELECT PERMIT TYPE */}
          {currentStep === 1 && (
            <div id="step-1-panel" className="space-y-6">
              <div className="space-y-1.5 border-b border-blue-100 pb-3">
                <h3 className="font-display font-extrabold text-md text-[#0038A8]">
                  Select Permit Type
                </h3>
                <p className="text-xs text-gray-500">
                  Choose the type of permit application you want to submit. Checklist requirements and fees adapt dynamically.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Locational Clearance */}
                <div
                  id="permit-select-lc"
                  onClick={() => onSetSelectedPermitType('locational_clearance')}
                  className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 text-left flex flex-col justify-between h-48 relative overflow-hidden ${
                    selectedPermitType === 'locational_clearance'
                      ? 'border-[#0038A8] bg-blue-50/30 ring-2 ring-blue-500/20'
                      : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50/10'
                  }`}
                >
                  <div className="space-y-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      selectedPermitType === 'locational_clearance' ? 'bg-[#0038A8] text-white' : 'bg-blue-100 text-[#0038A8]'
                    }`}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-gray-900">Locational Clearance</h4>
                      <p className="text-xs text-gray-500 mt-1">For zoning regulations and municipal land use evaluation.</p>
                    </div>
                  </div>
                  {selectedPermitType === 'locational_clearance' && (
                    <div className="absolute top-4 right-4 bg-[#0038A8] text-white p-1 rounded-full">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Building Permit */}
                <div
                  id="permit-select-bp"
                  onClick={() => onSetSelectedPermitType('building_permit')}
                  className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 text-left flex flex-col justify-between h-48 relative overflow-hidden ${
                    selectedPermitType === 'building_permit'
                      ? 'border-[#0038A8] bg-blue-50/30 ring-2 ring-blue-500/20'
                      : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50/10'
                  }`}
                >
                  <div className="space-y-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      selectedPermitType === 'building_permit' ? 'bg-[#0038A8] text-white' : 'bg-blue-100 text-[#0038A8]'
                    }`}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-gray-900">Building Permit</h4>
                      <p className="text-xs text-gray-500 mt-1">For construction, alteration, structural repair, or renovation approval.</p>
                    </div>
                  </div>
                  {selectedPermitType === 'building_permit' && (
                    <div className="absolute top-4 right-4 bg-[#0038A8] text-white p-1 rounded-full">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Occupancy Permit */}
                <div
                  id="permit-select-op"
                  onClick={() => onSetSelectedPermitType('occupancy_permit')}
                  className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 text-left flex flex-col justify-between h-48 relative overflow-hidden ${
                    selectedPermitType === 'occupancy_permit'
                      ? 'border-[#0038A8] bg-blue-50/30 ring-2 ring-blue-500/20'
                      : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50/10'
                  }`}
                >
                  <div className="space-y-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      selectedPermitType === 'occupancy_permit' ? 'bg-[#0038A8] text-white' : 'bg-blue-100 text-[#0038A8]'
                    }`}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-gray-900">Occupancy Permit</h4>
                      <p className="text-xs text-gray-500 mt-1">For approval before using or occupying completed architectural properties.</p>
                    </div>
                  </div>
                  {selectedPermitType === 'occupancy_permit' && (
                    <div className="absolute top-4 right-4 bg-[#0038A8] text-white p-1 rounded-full">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

              </div>

              {/* Informational checklist banner */}
              <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-200/50 flex gap-3">
                <ShieldCheck className="h-5 w-5 text-[#0038A8] shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-semibold text-blue-950">Active selection dynamically configures Checklist requirements:</span>
                  <p className="text-gray-600 leading-relaxed">
                    By choosing <strong className="capitalize">{selectedPermitType.replace(/_/g, ' ')}</strong>, you will be required to upload a minimum of <strong>{requirementChecklist.length} structural/legal document packets</strong> in Step 4.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: APPLICANT INFORMATION */}
          {currentStep === 2 && (
            <div id="step-2-panel" className="space-y-6">
              <div className="space-y-1.5 border-b border-blue-100 pb-3">
                <h3 className="font-display font-extrabold text-md text-[#0038A8]">
                  Applicant Information
                </h3>
                <p className="text-xs text-gray-500">
                  Verify or update your legal details. Communication regarding corrections or site evaluation will route to these channels.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-gray-700">Full Name</label>
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full bg-white text-xs py-2.5 px-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-1 focus:ring-[#0038A8]"
                    placeholder="E.g., Juan Dela Cruz"
                  />
                </div>

                {/* Mobile Number */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-gray-700">Mobile Number</label>
                  <input
                    type="text"
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    className="w-full bg-white text-xs py-2.5 px-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-1 focus:ring-[#0038A8]"
                    placeholder="E.g., 0917 000 4567"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-gray-700">Email Address</label>
                  <input
                    type="email"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    className="w-full bg-white text-xs py-2.5 px-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-1 focus:ring-[#0038A8]"
                    placeholder="E.g., juan.delacruz@email.com"
                  />
                </div>

                {/* Complete Address */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-gray-700">Complete Home/Business Address</label>
                  <input
                    type="text"
                    value={applicantAddress}
                    onChange={(e) => setApplicantAddress(e.target.value)}
                    className="w-full bg-white text-xs py-2.5 px-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-1 focus:ring-[#0038A8]"
                    placeholder="Unit / Street / Brgy / City"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PROJECT INFORMATION */}
          {currentStep === 3 && (
            <div id="step-3-panel" className="space-y-6">
              <div className="space-y-1.5 border-b border-blue-100 pb-3">
                <h3 className="font-display font-extrabold text-md text-[#0038A8]">
                  Project Details
                </h3>
                <p className="text-xs text-gray-500">
                  Input construction specifications. Information will be validated against structural drawings and lot titles.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Project Name */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-gray-700">Project Name / Scope</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full bg-white text-xs py-2.5 px-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-1 focus:ring-[#0038A8]"
                    placeholder="E.g., Dela Cruz Warehouse"
                  />
                </div>

                {/* Barangay Selection */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-gray-700">Barangay (Sto. Tomas)</label>
                  <select
                    value={selectedBarangay}
                    onChange={(e) => handleBarangayChange(e.target.value)}
                    className="w-full bg-white text-xs py-2.5 px-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-1 focus:ring-[#0038A8]"
                  >
                    {BARANGAYS.map(b => (
                      <option key={b.name} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Lot & Block No */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Lot No.</label>
                    <input
                      type="text"
                      value={lotNo}
                      onChange={(e) => {
                        setLotNo(e.target.value);
                        setProjectAddress(`Lot ${e.target.value}, Block ${blockNo}, Brgy. ${selectedBarangay}, Sto. Tomas, Pampanga`);
                      }}
                      className="w-full bg-white text-xs py-2.5 px-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-1 focus:ring-[#0038A8]"
                      placeholder="Lot No."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Block No.</label>
                    <input
                      type="text"
                      value={blockNo}
                      onChange={(e) => {
                        setBlockNo(e.target.value);
                        setProjectAddress(`Lot ${lotNo}, Block ${e.target.value}, Brgy. ${selectedBarangay}, Sto. Tomas, Pampanga`);
                      }}
                      className="w-full bg-white text-xs py-2.5 px-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-1 focus:ring-[#0038A8]"
                      placeholder="Block No."
                    />
                  </div>
                </div>

                {/* Project Address */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-gray-700">Project Address (Auto-generated)</label>
                  <input
                    type="text"
                    value={projectAddress}
                    onChange={(e) => setProjectAddress(e.target.value)}
                    className="w-full bg-blue-50/40 text-xs py-2.5 px-3 rounded-xl border border-blue-200 text-gray-700 font-medium focus:outline-none"
                    placeholder="Lot, Block, Barangay, Municipality"
                  />
                </div>

                {/* Project Description */}
                <div className="space-y-1 text-left md:col-span-2">
                  <label className="text-xs font-semibold text-gray-700">Project Description / Purpose</label>
                  <textarea
                    rows={3}
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="w-full bg-white text-xs py-2.5 px-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-1 focus:ring-[#0038A8]"
                    placeholder="Describe building layout, floors, materials, and target usage..."
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: UPLOAD REQUIREMENTS */}
          {currentStep === 4 && (
            <div id="step-4-panel" className="space-y-6">
              <div className="space-y-1.5 border-b border-blue-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-display font-extrabold text-md text-[#0038A8]">
                    Upload Supporting Documents
                  </h3>
                  <p className="text-xs text-gray-500">
                    Provide digital duplicates of papers. Click "Simulate File Upload" to attach mock compliance files.
                  </p>
                </div>
                <div className="text-right text-xs text-blue-800 font-mono font-bold">
                  {Object.keys(uploadedFiles).length} of {requirementChecklist.length} Attached
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Left side checklist */}
                <div className="lg:col-span-7 space-y-3">
                  <span className="text-[10px] uppercase text-[#0038A8] font-mono tracking-widest block font-bold">Required Documents Checklist:</span>
                  
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2">
                    {requirementChecklist.map((req, i) => {
                      const file = uploadedFiles[req];
                      return (
                        <div
                          key={i}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors duration-150 ${
                            file ? 'bg-emerald-50/40 border-emerald-200' : 'bg-blue-50/10 border-blue-200'
                          }`}
                        >
                          <div className="space-y-0.5 max-w-[70%]">
                            <div className="font-semibold text-gray-800 leading-tight truncate">{req}</div>
                            {file ? (
                              <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-2">
                                <span className="font-medium underline truncate max-w-[150px]">{file.name}</span>
                                <span>({file.size})</span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-yellow-600 font-mono">Pending PDF scan upload</div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {file ? (
                              <button
                                onClick={() => handleRemoveFile(req)}
                                className="p-1.5 text-gray-400 hover:text-red-600 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-lg transition-all"
                                title="Remove file"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                id={`simulate-upload-btn-${i}`}
                                onClick={() => handleSimulateUpload(req)}
                                className="bg-blue-55 text-[#0038A8] hover:bg-[#0038A8] hover:text-white border border-blue-200 hover:border-[#0038A8] text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                              >
                                <UploadCloud className="h-3.5 w-3.5" />
                                Simulate File Upload
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right side upload sandbox card */}
                <div className="lg:col-span-5">
                  <div 
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full transition-colors ${
                      isDragging ? 'bg-blue-50/40 border-[#0038A8]' : 'border-blue-200 bg-blue-50/10'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      // Simulate uploading the first missing file
                      const firstMissing = requirementChecklist.find(name => !uploadedFiles[name]);
                      if (firstMissing) {
                        handleSimulateUpload(firstMissing);
                      }
                    }}
                  >
                    <UploadCloud className="h-12 w-12 text-[#0038A8] mb-3 stroke-[1.5]" />
                    <h4 className="font-display font-bold text-sm text-gray-900 mb-1">Simulated Drag & Drop Area</h4>
                    <p className="text-xs text-gray-500 max-w-xs mb-4 leading-relaxed">
                      Drag files anywhere inside this card, or click to upload missing PDF documents instantly.
                    </p>
                    <button 
                      onClick={() => {
                        // Upload all missing files at once for speed in capstone demo
                        requirementChecklist.forEach(name => {
                          if (!uploadedFiles[name]) {
                            handleSimulateUpload(name);
                          }
                        });
                      }}
                      className="bg-white hover:bg-blue-50/50 text-[#0038A8] border border-blue-200 text-xs font-semibold py-2 px-4 rounded-xl shadow-xs transition-colors"
                    >
                      Attach All Documents (Demo Shortcut)
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STEP 5: PROJECT LOCATION PIN */}
          {currentStep === 5 && (() => {
            const latSpan = 0.0300 / zoom;
            const lngSpan = 0.0300 / zoom;
            const minLat = mapCenter.lat - (latSpan / 2);
            const maxLat = mapCenter.lat + (latSpan / 2);
            const minLng = mapCenter.lng - (lngSpan / 2);
            const maxLng = mapCenter.lng + (lngSpan / 2);

            const getTopPercent = (lat: number) => ((maxLat - lat) / latSpan) * 100;
            const getLeftPercent = (lng: number) => ((lng - minLng) / lngSpan) * 100;

            const mapBackgroundUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${minLng.toFixed(6)},${minLat.toFixed(6)},${maxLng.toFixed(6)},${maxLat.toFixed(6)}&bboxSR=4326&size=1000,500&format=jpg&f=image`;

            return (
              <div id="step-5-panel" className="space-y-6">
                <div className="space-y-1.5 border-b border-blue-100 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-display font-extrabold text-md text-[#0038A8]">
                      Project Site Pinning
                    </h3>
                    <p className="text-xs text-gray-500">
                      Drag the map to explore Santo Tomas, Pampanga. Click anywhere within the boundary to place your project pin. Use the controls to zoom.
                    </p>
                  </div>
                  {isPinned && !validationError && (
                    <div className="text-right text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 animate-pulse">
                      <MapPin className="h-3.5 w-3.5" />
                      Site Pinned
                    </div>
                  )}
                </div>

                {validationError && (
                  <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-r-xl flex items-start gap-3 text-left animate-bounce">
                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-rose-950">Pinning Restricted</h5>
                      <p className="text-xs text-rose-800">{validationError}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left: GIS Map Placeholder */}
                  <div className="lg:col-span-8 space-y-2">
                    <div className="text-[10px] uppercase text-[#0038A8] font-mono tracking-widest font-bold text-left flex justify-between items-center">
                      <span>STO. TOMAS GEOPORTAL GRID (DRAG TO MOVE, CLICK TO PIN):</span>
                      <span className="text-[9px] text-[#0038A8] normal-case bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Drag to Pan • Click to Pin</span>
                    </div>
                    
                    {/* Interactive Grid Map */}
                    <div 
                      id="map-canvas-interactive"
                      onMouseDown={handleMapMouseDown}
                      onMouseMove={handleMapMouseMove}
                      onMouseUp={handleMapMouseUp}
                      onMouseLeave={handleMapMouseLeave}
                      className={`relative w-full h-80 rounded-2xl bg-[#09152b] border border-blue-900 overflow-hidden shadow-md group select-none ${
                        isDraggingMap ? 'cursor-grabbing' : 'cursor-grab'
                      }`}
                    >
                      {/* The smooth translated map content wrapper */}
                      <div
                        className="absolute inset-0 w-full h-full"
                        style={{
                          transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
                          transition: isDraggingMap ? 'none' : 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      >
                        {/* Map satellite image background */}
                        <div 
                          className="absolute inset-0 bg-cover bg-center"
                          style={{
                            backgroundImage: `url("${loadedBackgroundUrl || mapBackgroundUrl}")`,
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                          }}
                        />

                        {/* Grid Overlay for technical feel */}
                        <div className="absolute inset-0 opacity-25 pointer-events-none z-0">
                          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <pattern id="grid-satellite" width="25" height="25" patternUnits="userSpaceOnUse">
                                <rect width="25" height="25" fill="none" stroke="#FFF" strokeWidth="0.5" />
                              </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid-satellite)" />
                          </svg>
                        </div>

                        {/* Sto. Tomas Municipal Boundary SVG Overlay */}
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
                            fill="rgba(0, 56, 168, 0.05)"
                            stroke="#CE1126"
                            strokeWidth="1.2"
                            strokeDasharray="2 1.5"
                            className="animate-pulse"
                          />
                          
                          {zoom < 2.0 && (
                            <text
                              x="50"
                              y="95"
                              textAnchor="middle"
                              className="fill-rose-500 font-mono font-bold text-[3px] select-none tracking-widest uppercase opacity-70"
                            >
                              Santo Tomas Boundary Limit (Pin Inside Only)
                            </text>
                          )}
                        </svg>

                        {/* Barangay Text Indicators as landmarks */}
                        {BARANGAYS.map((b) => {
                          const topPercent = getTopPercent(b.lat);
                          const leftPercent = getLeftPercent(b.lng);

                          // Only show within active viewport bounds
                          if (topPercent < 3 || topPercent > 97 || leftPercent < 3 || leftPercent > 97) {
                            return null;
                          }

                          return (
                            <div
                              key={b.name}
                              className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                              style={{ top: `${topPercent}%`, left: `${leftPercent}%` }}
                            >
                              <div className="w-1.5 h-1.5 bg-[#FCD116] rounded-full border border-black shadow-xs animate-pulse"></div>
                              <span className="text-[8px] text-white font-mono mt-0.5 whitespace-nowrap bg-blue-950/90 px-1.5 py-0.5 rounded border border-blue-900 shadow-xs">
                                Brgy. {b.name}
                              </span>
                            </div>
                          );
                        })}

                        {/* Dynamic Pin marker */}
                        {isPinned && (() => {
                          const pinTopPercent = getTopPercent(pinnedLat);
                          const pinLeftPercent = getLeftPercent(pinnedLng);

                          // Hide pin icon inside the panning container if it's out of bounds
                          if (pinTopPercent < 0 || pinTopPercent > 100 || pinLeftPercent < 0 || pinLeftPercent > 100) {
                            return null;
                          }

                          return (
                            <div
                              className="absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-full z-20 pointer-events-none"
                              style={{
                                top: `${pinTopPercent}%`,
                                left: `${pinLeftPercent}%`
                              }}
                            >
                              <div className="relative group">
                                {/* Pin Icon */}
                                <MapPin className="h-8 w-8 text-[#CE1126] fill-[#FCD116] animate-bounce" />
                                {/* Radial Ripple effect */}
                                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500/30 rounded-full scale-150 animate-ping -z-10"></span>
                                {/* Popup label */}
                                <div className="absolute bottom-9 left-1/2 -translate-x-1/2 bg-white text-blue-950 text-[10px] font-bold px-2 py-1 rounded-md shadow-lg border border-blue-300 whitespace-nowrap">
                                  Pin: {projectName || 'Dela Cruz Property'}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Floating HUD Map Zoom/Recenter Controls - Outside panning layer so they stay stationary */}
                      <div 
                        className="absolute top-3 right-3 flex flex-col gap-1.5 z-30"
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoom(z => Math.min(z * 1.5, 12));
                          }}
                          className="w-8 h-8 rounded-lg bg-white hover:bg-gray-50 text-blue-950 flex items-center justify-center border border-gray-200 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          title="Zoom In"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoom(z => Math.max(z / 1.5, 1.0));
                          }}
                          className="w-8 h-8 rounded-lg bg-white hover:bg-gray-50 text-blue-950 flex items-center justify-center border border-gray-200 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          title="Zoom Out"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMapCenter({ lat: pinnedLat, lng: pinnedLng });
                          }}
                          className="w-8 h-8 rounded-lg bg-white hover:bg-gray-50 text-[#0038A8] flex items-center justify-center border border-gray-200 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          title="Recenter on Pin"
                        >
                          <Compass className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Sto. Tomas Center Coordinates Label */}
                      <div className="absolute top-3 left-3 bg-white/95 text-blue-950 text-[9px] font-bold font-mono px-2.5 py-1 rounded-md border border-blue-200 shadow-sm z-10 pointer-events-none">
                        Sto. Tomas Town Hall Base: 15.0151° N, 120.7144° E
                      </div>

                      {/* Dynamic pinned coordinates overlay in corner */}
                      <div className="absolute bottom-3 left-3 bg-white/95 text-blue-950 text-[10px] font-mono px-3 py-1.5 rounded-md border border-blue-200 shadow-sm z-10 pointer-events-none">
                        Pinned: <span className="text-[#0038A8] font-bold">{pinnedLat}° N</span>, <span className="text-[#0038A8] font-bold">{pinnedLng}° E</span>
                      </div>

                      <div className="absolute bottom-3 right-3 bg-blue-950/90 text-white text-[9px] font-mono px-2.5 py-1 rounded-md border border-blue-800 shadow-sm z-10 font-bold pointer-events-none">
                        Scale: {zoom.toFixed(1)}x Zoom
                      </div>

                      {/* Out of Viewport Warning (Stays centered statically) */}
                      {isPinned && (() => {
                        const baseTopPercent = getTopPercent(pinnedLat);
                        const baseLeftPercent = getLeftPercent(pinnedLng);
                        
                        // Account for drag translation offset in pixels
                        const visualTopPercent = baseTopPercent + (isDraggingMap ? (dragOffset.y / 320) * 100 : 0);
                        const visualLeftPercent = baseLeftPercent + (isDraggingMap ? (dragOffset.x / 600) * 100 : 0);

                        if (visualTopPercent < 0 || visualTopPercent > 100 || visualLeftPercent < 0 || visualLeftPercent > 100) {
                          return (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-600/95 text-white text-[9px] font-bold px-3 py-1.5 rounded-md border border-rose-700 shadow-sm z-20 pointer-events-none animate-pulse flex items-center gap-1.5">
                              <Compass className="h-3.5 w-3.5 animate-spin" />
                              <span>Pin is out of viewport (Click Recenter)</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                {/* Right: GPS Metadata controls */}
                <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
                  <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-200/50 space-y-3">
                    <span className="text-[10px] uppercase text-[#0038A8] font-mono tracking-widest font-bold block text-left">GIS Metadata Coordinates:</span>
                    
                    <div className="space-y-2">
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] text-gray-500 font-semibold font-mono">LATITUDE (° N)</label>
                        <input
                          type="number"
                          value={pinnedLat}
                          step="0.0001"
                          onChange={(e) => handleCoordinateChange(Number(e.target.value), pinnedLng)}
                          className="w-full bg-white text-xs py-2 px-3 rounded-xl border border-blue-200 font-mono focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] text-gray-500 font-semibold font-mono">LONGITUDE (° E)</label>
                        <input
                          type="number"
                          value={pinnedLng}
                          step="0.0001"
                          onChange={(e) => handleCoordinateChange(pinnedLat, Number(e.target.value))}
                          className="w-full bg-white text-xs py-2 px-3 rounded-xl border border-blue-200 font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="text-[10px] text-gray-500 leading-relaxed pt-1 border-t border-blue-200/50 text-left">
                      Geographic location is auto-calculated using the stoichiometric boundaries of Santo Tomas, Pampanga. Selected Barangay is automatically set to <strong>{selectedBarangay}</strong>.
                    </div>
                  </div>

                   {/* Live real-time map preview */}
                  <div className="bg-white p-3.5 rounded-xl border border-blue-200 space-y-2 text-left shadow-2xs">
                    <span className="text-[10px] uppercase text-[#0038A8] font-mono tracking-widest font-bold block">Live Satellite Terrain:</span>
                    <div className="w-full h-32 bg-gray-50 rounded-xl overflow-hidden border border-gray-150 relative shadow-inner">
                      <img
                        src={`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${pinnedLng - 0.0018}%2C${pinnedLat - 0.0009}%2C${pinnedLng + 0.0018}%2C${pinnedLat + 0.0009}&bboxSR=4326&size=500,250&format=jpg&f=image`}
                        alt="Satellite Terrain Preview"
                        className="w-full h-full object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                      {/* Center Target Indicator overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative">
                          <MapPin className="h-6 w-6 text-[#CE1126] fill-[#FCD116] animate-bounce" />
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500/40 rounded-full scale-150 animate-ping"></span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-mono text-gray-500">
                      <span>Coordinates: {pinnedLat.toFixed(4)}, {pinnedLng.toFixed(4)}</span>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${pinnedLat},${pinnedLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-800 hover:underline font-bold"
                      >
                        Google Maps Satellite ↗
                      </a>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-blue-200/50 space-y-2 text-left">
                    <h5 className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Submitting as Juan Dela Cruz</h5>
                    <p className="text-[11px] text-gray-500 leading-normal">
                      By proceeding, you certify under penalty of law that all details are accurate, corresponding to authentic land deeds.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )})()}

          {/* Bottom Navigation Buttons in panel */}
          <div className="flex justify-between items-center pt-6 mt-8 border-t border-blue-100">
            {currentStep > 1 ? (
              <button
                id="wizard-back-btn"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="bg-white hover:bg-blue-50 text-gray-700 border border-blue-200 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors duration-150 flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < steps.length ? (
              <button
                id="wizard-next-btn"
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="bg-[#0038A8] hover:bg-[#002D86] text-white font-semibold px-5 py-2.5 rounded-xl text-xs shadow-xs transition-colors duration-150 flex items-center gap-1.5 cursor-pointer"
              >
                Continue
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            ) : (
              <button
                id="wizard-submit-btn"
                onClick={handleSubmit}
                className="bg-[#15803D] hover:bg-emerald-800 text-white font-semibold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-100 transition-colors duration-150 flex items-center gap-1.5 cursor-pointer"
              >
                Submit Permit Application
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            )}
          </div>

        </section>

      </div>
    </div>
  );
}
