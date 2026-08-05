import React, { useState } from 'react';
import { ArrowLeft, Check, AlertTriangle, Clock, FileText, Calendar, User, MapPin, ClipboardCheck, MessageSquare, Plus, CheckCircle2 } from 'lucide-react';
import { PermitApplication, ViewFrame, Requirement, ApplicationStatus } from '../types';
import { MOCK_STAFF } from '../data';

interface EvaluateProjectViewProps {
  applications: PermitApplication[];
  selectedApplicationId: string | null;
  onUpdateApplication: (updated: PermitApplication) => void;
  onNavigate: (view: ViewFrame) => void;
}

export default function EvaluateProjectView({
  applications,
  selectedApplicationId,
  onUpdateApplication,
  onNavigate
}: EvaluateProjectViewProps) {
  // Find selected application
  const app = applications.find(a => a.id === selectedApplicationId);

  if (!app) {
    return (
      <div className="p-12 text-center text-gray-500 font-sans">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold">Project Not Found</h3>
        <p className="text-xs mt-1">The requested permit dossier could not be retrieved from the database registry.</p>
        <button 
          onClick={() => onNavigate('staff_dashboard')}
          className="mt-4 bg-[#0038A8] text-white px-4 py-2 rounded-xl text-xs font-bold"
        >
          Return to Registry
        </button>
      </div>
    );
  }

  // Local component states initialized from application values
  const [remarks, setRemarks] = useState(app.remarks || '');
  const [assignedStaff, setAssignedStaff] = useState(app.assignedStaff || MOCK_STAFF[0]);
  const [inspectionDate, setInspectionDate] = useState(() => {
    const step = app.trackingSteps.find(s => s.title.includes('Inspection') || s.title.includes('Site'));
    return step && step.date ? step.date : '';
  });

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

  // Handle document checklist approvals/rejections
  const handleUpdateDocumentStatus = (reqIndex: number, newStatus: 'approved' | 'rejected', note: string) => {
    const updatedRequirements = [...app.requirements];
    updatedRequirements[reqIndex] = {
      ...updatedRequirements[reqIndex],
      status: newStatus,
      remarks: note
    };

    const newHistoryLog = {
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      action: newStatus === 'approved' ? 'DOCUMENT VERIFIED' : 'DOCUMENT FLAGGED',
      actor: 'OBO Evaluator Desk',
      details: `${newStatus === 'approved' ? 'Approved' : 'Flagged correction for'} "${updatedRequirements[reqIndex].name}". ${note}`
    };

    onUpdateApplication({
      ...app,
      requirements: updatedRequirements,
      historyLog: [newHistoryLog, ...app.historyLog]
    });
  };

  // Handle scheduling site inspections
  const handleScheduleInspection = () => {
    if (!inspectionDate) {
      alert('Please specify a valid calendar date for the engineering site inspection.');
      return;
    }

    const updatedSteps = app.trackingSteps.map((step) => {
      if (step.title.toLowerCase().includes('site') || step.title.toLowerCase().includes('inspection')) {
        return {
          ...step,
          status: 'completed' as const,
          date: inspectionDate,
          notes: `Site evaluation inspection authorized and scheduled on ${inspectionDate} by engineering division.`
        };
      }
      return step;
    });

    const newHistoryLog = {
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      action: 'INSPECTION SCHEDULED',
      actor: 'OBO Inspector',
      details: `Field engineering inspection appointed for ${inspectionDate}.`
    };

    onUpdateApplication({
      ...app,
      trackingSteps: updatedSteps,
      historyLog: [newHistoryLog, ...app.historyLog]
    });

    alert(`Success: Engineering site inspection for project ${app.id} scheduled for ${inspectionDate}.`);
  };

  // Handle overall status updates (macro workflow transitions)
  const handleUpdateMacroStatus = (targetStatus: ApplicationStatus) => {
    // Generate system timeline updates based on selected workflow status
    let transitionNotes = '';
    let stepTitleToUpdate = '';

    if (targetStatus === 'under_review') {
      transitionNotes = 'Municipal reviewers have initialized thorough structural, zoning, and safety checks.';
      stepTitleToUpdate = 'Document Compliance Verification';
    } else if (targetStatus === 'incomplete_requirements') {
      transitionNotes = 'Evaluation halted: structural or clearance compliance items require revision by applicant.';
      stepTitleToUpdate = 'Technical Clearance Endorsement';
    } else if (targetStatus === 'approved') {
      transitionNotes = 'All engineering clearances signed off. Folder pre-authorized for permit release.';
      stepTitleToUpdate = 'Technical Clearance Endorsement';
    } else if (targetStatus === 'released') {
      transitionNotes = 'Official digitized building clearance and approved permit docket released to applicant.';
      stepTitleToUpdate = 'Final Building Permit Issuance';
    }

    // Update the corresponding tracking step status
    const updatedSteps = app.trackingSteps.map((step) => {
      if (step.title.toLowerCase().includes('verification') && targetStatus === 'under_review') {
        return { ...step, status: 'completed' as const, notes: transitionNotes, date: new Date().toISOString().substring(0, 10) };
      }
      if (step.title.toLowerCase().includes('clearance') && targetStatus === 'approved') {
        return { ...step, status: 'completed' as const, notes: transitionNotes, date: new Date().toISOString().substring(0, 10) };
      }
      if (step.title.toLowerCase().includes('issuance') && targetStatus === 'released') {
        return { ...step, status: 'completed' as const, notes: transitionNotes, date: new Date().toISOString().substring(0, 10) };
      }
      return step;
    });

    const newHistoryLog = {
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      action: `STATUS TRANSITION`,
      actor: 'OBO Chief Evaluator',
      details: `Permit dossier status advanced to ${targetStatus.replace(/_/g, ' ').toUpperCase()}. Remarks: ${remarks || 'None provided.'}`
    };

    onUpdateApplication({
      ...app,
      status: targetStatus,
      remarks: remarks,
      assignedStaff: assignedStaff,
      trackingSteps: updatedSteps,
      historyLog: [newHistoryLog, ...app.historyLog]
    });

    alert(`Dossier status updated to "${targetStatus.replace(/_/g, ' ').toUpperCase()}" successfully.`);
  };

  return (
    <div id="evaluation-detail-view" className="flex-1 bg-[#F5F8FC] min-h-screen font-sans flex flex-col pb-12">
      
      {/* Header bar */}
      <header className="bg-white px-8 py-4 border-b border-blue-100 shrink-0 sticky top-0 z-10 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4 text-left">
          <button 
            id="back-to-registry-btn"
            onClick={() => onNavigate('staff_dashboard')}
            className="flex items-center gap-2 text-[#0038A8] hover:text-[#002D86] text-xs font-bold bg-blue-50/50 hover:bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Registry
          </button>
          <div className="hidden sm:block">
            <h2 className="font-display font-extrabold text-lg text-gray-900 leading-tight">
              Detailed Project Evaluation Desk
            </h2>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">
              OBO Sto. Tomas • Permit Dossier Reviewer Mode
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-mono">Dossier ID:</span>
          <span className="text-xs font-mono font-bold bg-blue-50 text-[#0038A8] border border-blue-100 px-2.5 py-1 rounded-lg">
            {app.id}
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadgeStyles(app.status)}`}>
            {app.status.replace(/_/g, ' ')}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 text-left">
        
        {/* Left Side: Project Metadata & Checklist Files (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section: Project Core Info */}
          <section className="bg-white rounded-2xl border border-blue-100 p-6 shadow-xs space-y-4">
            <div className="border-b border-blue-50 pb-3">
              <span className="text-[10px] font-mono font-bold text-[#CE1126] uppercase tracking-wider block">
                Project Profile Specs
              </span>
              <h3 className="font-display font-extrabold text-xl text-gray-900 leading-tight mt-1">
                {app.projectName}
              </h3>
              <p className="text-xs text-gray-500 font-medium font-mono mt-0.5">
                {formatPermitType(app.permitType)} • Submitted on {app.dateSubmitted}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                Technical Scope & Description
              </span>
              <p className="text-xs text-gray-700 leading-relaxed bg-blue-50/20 p-3.5 rounded-xl border border-blue-50/60 font-mono">
                {app.projectDescription || 'No technical specification narrative was uploaded by the applicant.'}
              </p>
            </div>

            {/* Grid for details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                  Applicant Information
                </span>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1.5">
                  <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-blue-800" />
                    {app.applicantName}
                  </div>
                  <div className="text-gray-600 font-mono text-[10px]">Email: {app.applicantEmail}</div>
                  <div className="text-gray-600 font-mono text-[10px]">Phone: {app.applicantPhone}</div>
                  <div className="text-gray-600 font-mono text-[10px] truncate">Address: {app.applicantAddress}</div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                  Location Specs
                </span>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1.5">
                  <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#CE1126]" />
                    Sto. Tomas, Pampanga
                  </div>
                  <div className="text-gray-600 font-mono text-[10px] truncate">Barangay: {app.projectAddress}</div>
                  <div className="text-gray-600 font-mono text-[10px]">Lot No: {app.location.lotNo || 'N/A'} • Block No: {app.location.blockNo || 'N/A'}</div>
                  <div className="text-gray-600 font-mono text-[10px]">Coordinates: {app.location.lat}, {app.location.lng}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Checklist Dossier Evaluation */}
          <section className="bg-white rounded-2xl border border-blue-100 p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-blue-50 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold text-[#0038A8] uppercase tracking-wider block">
                  Mandatory Requirements
                </span>
                <h3 className="font-display font-extrabold text-sm text-gray-900">
                  Document Checklist & Safety Files
                </h3>
              </div>
              <span className="text-[9px] font-mono bg-blue-50 text-blue-900 border border-blue-100 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Inspection Mode
              </span>
            </div>

            <div className="space-y-3">
              {app.requirements.map((req, idx) => (
                <div key={idx} className="p-4 bg-gray-50 hover:bg-blue-50/10 rounded-xl border border-gray-100 text-xs space-y-3 transition-all duration-150">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div className="space-y-0.5 max-w-[70%]">
                      <div className="font-bold text-gray-900 leading-tight">
                        {req.name}
                      </div>
                      {req.fileName ? (
                        <div className="text-[10px] text-[#0038A8] font-mono flex items-center gap-1.5 mt-1">
                          <FileText className="h-3.5 w-3.5" />
                          Filename: <span className="underline font-semibold">{req.fileName}</span> ({req.fileSize})
                        </div>
                      ) : (
                        <div className="text-[10px] text-gray-400 italic font-mono mt-1">
                          No file uploaded by applicant
                        </div>
                      )}
                    </div>
                    
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      req.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      req.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                      'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  {req.remarks && (
                    <div className="text-[10px] bg-white p-2.5 rounded-lg border border-blue-50 text-gray-600 font-mono">
                      <strong>Remarks:</strong> {req.remarks}
                    </div>
                  )}

                  {/* Document actions */}
                  <div className="flex gap-2 justify-end border-t border-gray-100/60 pt-2.5">
                    <button
                      id={`approve-file-${idx}`}
                      onClick={() => handleUpdateDocumentStatus(idx, 'approved', 'Verified and compliant with zoning and building rules.')}
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      ✓ Approve document
                    </button>
                    <button
                      id={`reject-file-${idx}`}
                      onClick={() => {
                        const note = prompt('Type the discrepancy or clearance failure reason:');
                        if (note !== null) {
                          handleUpdateDocumentStatus(idx, 'rejected', note || 'Document fails layout or technical compliance criteria.');
                        }
                      }}
                      className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      ✗ Flag revision
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Progress Timeline */}
          <section className="bg-white rounded-2xl border border-blue-100 p-6 shadow-xs space-y-4 text-left">
            <h3 className="font-display font-bold text-xs text-blue-950 uppercase tracking-wider border-b border-blue-50 pb-2">
              Operational Timeline Progress
            </h3>
            <div className="space-y-5 relative pl-4 before:content-[''] before:absolute before:left-6.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-100">
              {app.trackingSteps.map((step, idx) => {
                const isCompleted = step.status === 'completed';
                const isCurrent = step.status === 'current';
                return (
                  <div key={idx} className="relative flex gap-4 text-xs">
                    <div className={`absolute -left-6 w-5.5 h-5.5 rounded-full flex items-center justify-center border-2 z-10 ${
                      isCompleted 
                        ? 'bg-emerald-600 border-emerald-600 text-white' 
                        : isCurrent
                        ? 'bg-white border-[#0038A8] text-[#0038A8] scale-110 shadow-sm'
                        : 'bg-white border-blue-200 text-gray-300'
                    }`}>
                      {isCompleted ? (
                        <Check className="h-3 w-3 stroke-[3]" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      )}
                    </div>

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
                        <p className="text-[11px] text-gray-600 leading-normal bg-blue-50/30 p-2.5 rounded-lg border border-blue-50 mt-1">
                          {step.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>

        {/* Right Side: Compliance Evaluations, Remarks & Actions (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Technical Assignments & Inspection */}
          <section className="bg-white rounded-2xl border border-blue-100 p-6 shadow-xs space-y-4">
            <span className="text-[10px] font-mono font-bold text-[#0038A8] uppercase tracking-wider block border-b border-blue-50 pb-2">
              Engineering Clearances
            </span>
            
            {/* Reviewer select */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-gray-700 block">Assigned Lead Expert Evaluator:</label>
              <select
                value={assignedStaff}
                onChange={(e) => setAssignedStaff(e.target.value)}
                className="w-full bg-white text-xs py-2 px-2.5 rounded-xl border border-blue-200 focus:outline-none cursor-pointer"
              >
                {MOCK_STAFF.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Site Inspection Scheduler */}
            <div className="space-y-2 pt-2 border-t border-blue-50 text-xs">
              <label className="font-bold text-gray-700 block">Schedule Official Site Inspection:</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className="flex-1 bg-white text-xs py-2 px-3 rounded-xl border border-blue-200 font-mono focus:outline-none"
                />
                <button
                  id="schedule-inspection-detail-btn"
                  onClick={handleScheduleInspection}
                  className="bg-[#0038A8] hover:bg-[#002D86] text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  Schedule
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Schedules field inspection and posts date to the applicant timeline.</p>
            </div>
          </section>

          {/* Remarks input */}
          <section className="bg-white rounded-2xl border border-blue-100 p-6 shadow-xs space-y-4">
            <span className="text-[10px] font-mono font-bold text-[#0038A8] uppercase tracking-wider block border-b border-blue-50 pb-2">
              Official Evaluator Remarks
            </span>
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-gray-700 block">Internal/Public Evaluation Notes:</label>
              <textarea
                rows={4}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Input engineering assessments, blueprints discrepancy details, or structural zoning recommendations..."
                className="w-full bg-white text-xs p-3 rounded-xl border border-blue-200 focus:outline-none text-gray-800 leading-relaxed font-mono"
              ></textarea>
              <p className="text-[10px] text-gray-400">These comments are synced real-time and will be visible on the applicant's tracking page.</p>
            </div>
          </section>

          {/* Overall Macro status update dockets */}
          <section className="bg-white rounded-2xl border border-blue-200 p-6 shadow-md space-y-4">
            <span className="text-[10px] font-mono font-bold text-[#CE1126] uppercase tracking-wider block border-b border-red-50 pb-2">
              Advance Permit Workflow Decision
            </span>
            
            <div className="space-y-2 text-xs">
              <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
                Advance this folder to its next formal clearance milestone. Make sure remarks are fully inputted.
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                <button
                  id="decision-review-btn"
                  onClick={() => handleUpdateMacroStatus('under_review')}
                  className="bg-orange-50 hover:bg-orange-100 text-orange-950 border border-orange-200 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer text-center"
                >
                  → Place Under Formal Evaluation
                </button>

                <button
                  id="decision-incomplete-btn"
                  onClick={() => handleUpdateMacroStatus('incomplete_requirements')}
                  className="bg-red-50 hover:bg-red-100 text-red-950 border border-red-200 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer text-center"
                >
                  ✗ Flag as Incomplete (Revision Required)
                </button>

                <button
                  id="decision-approve-btn"
                  onClick={() => handleUpdateMacroStatus('approved')}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer text-center"
                >
                  ✓ Complete Compliance (Approve Permit)
                </button>

                <button
                  id="decision-release-btn"
                  onClick={() => handleUpdateMacroStatus('released')}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold py-3 rounded-xl transition-colors cursor-pointer shadow-md text-center"
                >
                  ★ Issue & Release Official Digitized Permit
                </button>
              </div>
            </div>
          </section>

          {/* Quick GIS Map simulation */}
          <section className="bg-white rounded-2xl border border-blue-100 p-5 shadow-xs space-y-3">
            <h4 className="font-display font-bold text-xs text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#CE1126]" />
              Zoning Coordinates Alignment
            </h4>
            
            <div className="w-full h-48 bg-gray-100 rounded-xl relative overflow-hidden border border-blue-150 shadow-inner">
              <img
                src={`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${app.location.lng - 0.002}%2C${app.location.lat - 0.001}%2C${app.location.lng + 0.002}%2C${app.location.lat + 0.001}&bboxSR=4326&size=600,300&format=jpg&f=image`}
                alt="Zoning Satellite View"
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
                <span>{app.location.lat}, {app.location.lng}</span>
              </div>

              <div className="absolute top-2 right-2">
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${app.location.lat},${app.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/95 hover:bg-white backdrop-blur-xs text-[10px] text-[#0038A8] hover:text-[#002D86] font-bold font-sans px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-xs transition-all flex items-center gap-1.5"
                >
                  Open Satellite ↗
                </a>
              </div>
            </div>
            <div className="text-[10px] text-gray-500 font-mono text-center">
              GIS Sector Code: Sto. Tomas Zone-{app.projectAddress.split(' ')[0]}
            </div>
          </section>

        </div>

      </main>

    </div>
  );
}
