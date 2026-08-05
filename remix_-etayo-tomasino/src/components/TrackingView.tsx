import React, { useState } from 'react';
import { Search, MapPin, CreditCard, Clock, CheckCircle2, AlertTriangle, FileText, ArrowRight, User, Calendar, MessageSquare, Download, Check, AlertCircle } from 'lucide-react';
import { PermitApplication, ViewFrame, TrackingStep, Requirement } from '../types';

interface TrackingViewProps {
  applications: PermitApplication[];
  selectedApplicationId: string | null;
  onSelectApplication: (id: string | null) => void;
  onNavigate: (view: ViewFrame) => void;
  onUpdateApplication?: (updated: PermitApplication) => void;
}

export default function TrackingView({
  applications,
  selectedApplicationId,
  onSelectApplication,
  onNavigate,
  onUpdateApplication
}: TrackingViewProps) {
  const [searchCode, setSearchCode] = useState(selectedApplicationId || '');
  const [hasSearched, setHasSearched] = useState(!!selectedApplicationId);
  const [errorMessage, setErrorMessage] = useState('');

  // Find selected application or searched application
  const activeApp = applications.find(
    (app) => app.id.toLowerCase() === (selectedApplicationId || searchCode).trim().toLowerCase()
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) {
      setErrorMessage('Please enter an application number.');
      return;
    }

    const found = applications.find(
      (app) => app.id.toLowerCase() === searchCode.trim().toLowerCase()
    );

    if (found) {
      onSelectApplication(found.id);
      setHasSearched(true);
      setErrorMessage('');
    } else {
      setErrorMessage(`No application found with ID "${searchCode}". Note: Try entering BP-2025-0005, LC-2025-0001, or OC-2025-0002.`);
    }
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'under_review':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'approved':
      case 'released':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'incomplete_requirements':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatPermitType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div id="tracking-view-root" className="flex-1 bg-[#F5F8FC] min-h-screen font-sans flex flex-col">
      {/* Search Header Bar */}
      <header className="bg-white px-8 py-4 border-b border-blue-100 shrink-0">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 mr-auto">
            <span className="text-xs font-mono bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md border border-blue-200 font-semibold uppercase">
              Permit Tracking System
            </span>
          </div>

          <div className="flex gap-2 w-full sm:w-auto max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Enter Application No. (e.g. BP-2025-0005)"
                className="w-full sm:w-80 bg-white text-xs py-2 px-9 rounded-xl border border-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
            <button
              type="submit"
              id="search-submit-btn"
              className="bg-[#0038A8] hover:bg-[#002D86] text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
            >
              Track Permit
            </button>
          </div>
        </form>
        {errorMessage && (
          <div className="text-xs text-red-600 mt-2 font-semibold text-left">
            {errorMessage}
          </div>
        )}
      </header>

      {/* Main body depending if app is loaded */}
      {activeApp ? (
        <div className="p-8 max-w-6xl mx-auto w-full space-y-8 flex-1">
          
          {/* Header summary hud */}
          <section className="bg-white p-6 rounded-3xl border border-blue-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
            <div className="space-y-1.5 text-left">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-extrabold text-[#0038A8]">{activeApp.id}</span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadgeStyles(activeApp.status)}`}>
                  {activeApp.status.replace(/_/g, ' ')}
                </span>
              </div>
              <h2 className="text-lg font-display font-extrabold text-gray-900 leading-tight">
                {activeApp.projectName}
              </h2>
              <p className="text-xs text-gray-500 font-mono flex items-center gap-2">
                <span>{formatPermitType(activeApp.permitType)}</span>
                <span>•</span>
                <span>Submitted: {activeApp.dateSubmitted}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {activeApp.status === 'released' && (
                <button
                  id="download-certificate-btn"
                  onClick={() => alert('Downloading official digital e-permit certificate.')}
                  className="bg-[#15803D] hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Download Approved Permit
                </button>
              )}
              <button
                id="back-to-portal-btn"
                onClick={() => onNavigate('applicant_dashboard')}
                className="bg-white hover:bg-blue-50/50 text-[#0038A8] border border-blue-200 font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Back to Portal
              </button>
            </div>
          </section>

          {/* Interactive Tracking Flow + Details Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Progress Timeline */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs space-y-6 text-left">
                <h3 className="font-display font-bold text-sm text-[#0038A8] border-b border-blue-100 pb-2">
                  Timeline Progress
                </h3>

                <div className="space-y-6 relative pl-4 before:content-[''] before:absolute before:left-6.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-100">
                  {activeApp.trackingSteps.map((step, idx) => {
                    const isCompleted = step.status === 'completed';
                    const isCurrent = step.status === 'current';
                    return (
                      <div key={idx} className="relative flex gap-4 text-xs">
                        {/* Dot indicator */}
                        <div className={`absolute -left-6 w-5.5 h-5.5 rounded-full flex items-center justify-center border-2 z-10 ${
                          isCompleted 
                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                            : isCurrent
                            ? 'bg-white border-[#0038A8] text-[#0038A8] scale-110 shadow-sm shadow-blue-50'
                            : 'bg-white border-blue-200 text-gray-300'
                        }`}>
                          {isCompleted ? (
                            <Check className="h-3 w-3 stroke-[3]" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          )}
                        </div>

                        {/* Content text */}
                        <div className="space-y-1 pl-4">
                          <div className={`font-semibold ${isCompleted ? 'text-gray-900' : isCurrent ? 'text-[#0038A8] font-extrabold' : 'text-gray-400'}`}>
                            {step.title}
                          </div>
                          {step.date && (
                            <div className="text-[10px] text-gray-500 font-mono font-medium flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              {step.date}
                            </div>
                          )}
                          {step.notes && (
                            <p className="text-[11px] text-gray-600 leading-normal bg-blue-50/30 p-2 rounded-lg border border-blue-50 mt-1">
                              {step.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Technical review cards, Maps and payment details */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Requirements & evaluations checker */}
              <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-xs text-left space-y-4">
                <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                  <h3 className="font-display font-bold text-sm text-[#0038A8]">
                    Document Review Docket
                  </h3>
                  <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-950 px-2 py-0.5 rounded border border-blue-100">
                    OBO Evaluator Dossier
                  </span>
                </div>

                <div className="space-y-2.5">
                  {activeApp.requirements.map((req, index) => (
                    <div key={index} className="p-3 bg-blue-50/10 rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5 max-w-[80%]">
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          {req.status === 'approved' ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          ) : req.status === 'rejected' ? (
                            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                          ) : (
                            <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                          )}
                          {req.name}
                        </div>
                        {req.fileName && (
                          <div className="text-[10px] text-gray-500 font-mono truncate">
                            Attached file: <span className="font-semibold text-[#0038A8] underline">{req.fileName}</span> ({req.fileSize})
                          </div>
                        )}
                        {req.remarks && (
                          <div className="text-[10px] bg-white/60 p-1.5 rounded border border-blue-100 text-gray-600 leading-normal mt-1">
                            <strong>Note:</strong> {req.remarks}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {req.status === 'approved' && (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            Approved
                          </span>
                        )}
                        {req.status === 'pending' && (
                          <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            Awaiting
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="bg-red-100 text-red-800 border border-red-200 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            Revision Required
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid: Map coordinates and Estimated Fee Billing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Site location Pin card */}
                <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs text-left space-y-3">
                  <h3 className="font-display font-bold text-sm text-[#0038A8] border-b border-blue-100 pb-2 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[#0038A8]" />
                    Pinned Location Details
                  </h3>
                  
                  {/* Small GIS Mini Map */}
                  <div className="w-full h-44 bg-gray-100 rounded-xl relative overflow-hidden border border-blue-150 shadow-inner">
                    <img
                      src={`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${activeApp.location.lng - 0.002}%2C${activeApp.location.lat - 0.001}%2C${activeApp.location.lng + 0.002}%2C${activeApp.location.lat + 0.001}&bboxSR=4326&size=600,300&format=jpg&f=image`}
                      alt="Project Satellite View"
                      className="w-full h-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                    {/* Dynamic MapPin Marker on center */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative">
                        <MapPin className="h-8 w-8 text-[#CE1126] fill-[#FCD116] animate-bounce" />
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500/40 rounded-full scale-150 animate-ping"></span>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs text-blue-950 text-[10px] font-mono font-bold px-2.5 py-1.5 rounded-lg border border-blue-200 shadow-sm flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#CE1126] fill-[#FCD116]" />
                      <span>{activeApp.location.lat}, {activeApp.location.lng}</span>
                    </div>

                    <div className="absolute top-2 right-2">
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${activeApp.location.lat},${activeApp.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/95 hover:bg-white backdrop-blur-xs text-[10px] text-[#0038A8] hover:text-[#002D86] font-bold font-sans px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-xs transition-all flex items-center gap-1.5"
                      >
                        Open Satellite ↗
                      </a>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div>
                      <strong className="text-gray-700">Project Address:</strong>
                      <p className="text-gray-600 font-mono text-[11px] leading-tight mt-0.5">{activeApp.projectAddress}</p>
                    </div>
                    <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-blue-100 font-mono text-left">
                      <span>Lot No: <strong className="text-blue-950">{activeApp.location.lotNo || 'N/A'}</strong></span>
                      <span>Block: <strong className="text-blue-950">{activeApp.location.blockNo || 'N/A'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* municipal evaluation card */}
                <div id="evaluation-guidelines-card" className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs text-left space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#0038A8] border-b border-blue-100 pb-2 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-[#0038A8]" />
                      Clearance & Evaluation Details
                    </h3>

                    <div className="space-y-2 pt-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Assigned Officer:</span>
                        <span className="font-bold text-gray-900 font-mono">{activeApp.assignedStaff || 'Assigning soon...'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Office Location:</span>
                        <span className="font-bold text-gray-900 font-mono text-right">OBO Dept, 2nd Floor</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-blue-100 font-bold">
                        <span className="text-[#0038A8]">Target Timeline:</span>
                        <span className="text-sm text-blue-950 font-mono font-extrabold">5 - 10 Working Days</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="bg-blue-50 text-blue-800 border border-blue-100 rounded-xl p-2.5 text-center text-[11px] font-medium leading-relaxed">
                      All structural, architectural, electrical, and plumbing blueprints are subject to strict municipal building ordinance guidelines.
                    </div>
                  </div>
                </div>

              </div>

              {/* History logs */}
              <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs text-left space-y-3">
                <h3 className="font-display font-bold text-xs text-blue-950 uppercase tracking-wider">
                  Digital Audit Trail & Activity Logs
                </h3>
                
                <div className="divide-y divide-blue-50 text-xs font-mono max-h-[160px] overflow-y-auto pr-2">
                  {activeApp.historyLog.map((log, idx) => (
                    <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between gap-1">
                      <div className="space-y-0.5">
                        <div className="font-bold text-gray-800 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0038A8]"></span>
                          {log.action}
                        </div>
                        <div className="text-[10px] text-gray-500 leading-normal">{log.details}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-blue-800 font-semibold">{log.actor}</div>
                        <div className="text-[9px] text-gray-400">{log.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      ) : (
        <div className="p-12 text-center max-w-lg mx-auto space-y-6 flex-grow flex flex-col justify-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-[#0038A8] border border-blue-100">
            <Search className="h-8 w-8 stroke-[1.5]" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="font-display font-extrabold text-xl text-gray-900">
              Application Tracker Search
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Enter your building permit, occupancy permit, or zoning locational clearance ID above. The eTAYO municipal evaluation portal provides live tracking updates of step processes.
            </p>
          </div>
          
          <div className="p-4 bg-blue-50/20 rounded-2xl border border-blue-100 text-left space-y-2.5">
            <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-[#0038A8]">Demo Shortcuts (Click to load):</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button 
                onClick={() => { setSearchCode('BP-2025-0005'); onSelectApplication('BP-2025-0005'); setHasSearched(true); }}
                className="bg-white hover:bg-blue-50 text-[10px] font-mono font-bold py-1.5 px-2 rounded-lg border border-blue-200 text-blue-950 shadow-2xs text-left cursor-pointer"
              >
                BP-2025-0005
              </button>
              <button 
                onClick={() => { setSearchCode('LC-2025-0001'); onSelectApplication('LC-2025-0001'); setHasSearched(true); }}
                className="bg-white hover:bg-blue-50 text-[10px] font-mono font-bold py-1.5 px-2 rounded-lg border border-blue-200 text-blue-950 shadow-2xs text-left cursor-pointer"
              >
                LC-2025-0001
              </button>
              <button 
                onClick={() => { setSearchCode('OC-2025-0002'); onSelectApplication('OC-2025-0002'); setHasSearched(true); }}
                className="bg-white hover:bg-blue-50 text-[10px] font-mono font-bold py-1.5 px-2 rounded-lg border border-blue-200 text-blue-950 shadow-2xs text-left cursor-pointer"
              >
                OC-2025-0002
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
