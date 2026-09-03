"use client";

import React, { useState, useEffect } from "react";
import { usePermitContext } from "../../../../context/PermitContext";
import { FileText, MapPin, Upload, CheckCircle, ChevronRight, ChevronLeft, Lock, ShieldCheck, AlertCircle, Check, Building2, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import LocationalClearanceGoogleForm from "../../../../components/forms/LocationalClearanceGoogleForm";

const LocationPickerMap = dynamic(() => import("../../../../components/map/LocationPickerMap"), { 
  ssr: false, 
  loading: () => <div style={{ height: "200px", background: "#f8fafc", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #cbd5e1", color: "#64748b", fontWeight: "600" }}>Loading Map...</div> 
});

const STEPS = [
  { id: 1, title: "Permit Type", icon: FileText },
  { id: 2, title: "Project Details", icon: MapPin },
  { id: 3, title: "Requirements", icon: Upload },
  { id: 4, title: "Review", icon: CheckCircle }
];

export default function ApplyPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const { applications, selectedPermitType, setSelectedPermitType, addApplication } = usePermitContext();
  const router = useRouter();

  // Locational Clearance Prerequisite & Form State
  const [showGoogleForm, setShowGoogleForm] = useState(false);
  const [manualClearanceRef, setManualClearanceRef] = useState("");
  const [isManualVerified, setIsManualVerified] = useState(false);
  const [showManualVerifyInput, setShowManualVerifyInput] = useState(false);
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  // Detect if applicant has an approved Locational Clearance in the system
  const approvedLC = (applications || []).find(
    app => (app.permitType === "locational_clearance") &&
           (app.status === "approved" || app.status === "released")
  );
  const hasSystemApprovedLC = !!approvedLC;
  const isClearancePassed = hasSystemApprovedLC || isManualVerified;
  const activeClearanceRef = hasSystemApprovedLC ? approvedLC.id : (isManualVerified ? manualClearanceRef : null);

  // Sync selected permit type based on clearance status
  useEffect(() => {
    if (!isClearancePassed) {
      setSelectedPermitType("locational_clearance");
    } else if (selectedPermitType === "locational_clearance") {
      setSelectedPermitType("building_permit");
    }
  }, [isClearancePassed]);

  const [projectName, setProjectName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [barangay, setBarangay] = useState("San Bartolome");
  const [lotArea, setLotArea] = useState("");
  const [floorArea, setFloorArea] = useState("");
  const [projectCost, setProjectCost] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [detectedZone, setDetectedZone] = useState<{barangay?: string, zoneType?: string, description?: string} | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");

  const projectAddress = `${streetAddress}, Brgy. ${barangay}, Sto. Tomas, Pampanga`;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    
    // Format "building_permit" to "Building Permit"
    const formattedPermitType = selectedPermitType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    formData.append("permitType", formattedPermitType);

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload files");
      }

      const data = await response.json();
      setUploadedFileUrl(data.urls.join(','));
    } catch (err: any) {
      setUploadError(err.message || "An error occurred during upload");
    } finally {
      setUploading(false);
    }
  };

  const handleVerifyManualClearance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualClearanceRef.trim()) return;
    setIsManualVerified(true);
    setShowManualVerifyInput(false);
    setLockedNotice(null);
    setSelectedPermitType("building_permit");
  };

  const handleSubmitApplication = () => {
    let applicantName = "Juan Dela Cruz";
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj.name) applicantName = userObj.name;
      }
    } catch (e) {}

    const newApp: any = {
      id: `APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      projectName,
      permitType: selectedPermitType,
      status: "pending",
      dateSubmitted: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      applicantName,
      fileUrl: uploadedFileUrl,
      locationalClearanceRef: activeClearanceRef || undefined,
      location: {
        lat: parseFloat(latitude) || 15.0050,
        lng: parseFloat(longitude) || 120.7100,
        address: projectAddress || 'Sto. Tomas, Pampanga',
      },
      requirements: [
        {
          name: 'Uploaded Document',
          required: true,
          status: 'approved',
          fileName: 'submitted_document.pdf'
        }
      ],
      trackingSteps: [
        { title: 'Application Submitted', status: 'completed', date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }), notes: 'Online application file successfully received.' },
        { title: 'Initial Document Verification', status: 'upcoming', notes: 'Reviewing all required attachments for completeness.' }
      ],
      historyLog: [
        { date: new Date().toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute:"2-digit" }), action: 'Application Submitted', actor: applicantName, details: 'Application package uploaded online.' }
      ]
    };

    addApplication(newApp);
    router.push("/applicant/dashboard");
  };

  if (showGoogleForm) {
    return <LocationalClearanceGoogleForm onCancel={() => setShowGoogleForm(false)} />;
  }

  return (
    <div className="wizard-page animate-fade-in-up">
      <header className="page-header">
        <h1 className="page-title">New Permit Application</h1>
        <p className="page-subtitle">Follow the steps below to securely file your application online.</p>
      </header>

      <div className="wizard-container glass-panel">
        <div className="wizard-sidebar">
          <ul className="step-list">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isPassed = currentStep > step.id;
              return (
                <li key={step.id} className={`step-item ${isActive ? "active" : ""} ${isPassed ? "passed" : ""}`}>
                  <div className="step-indicator">
                    {isPassed ? <CheckCircle size={16} /> : <span>{step.id}</span>}
                  </div>
                  <div className="step-content">
                    <span className="step-title">{step.title}</span>
                    {isActive && <span className="step-desc">In Progress</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="wizard-content">
          {currentStep === 1 && (
            <div className="step-pane animate-fade-in-up">
              <h2>Select Permit Type</h2>
              <p>Municipal ordinances require a sequential 2-stage permit process:</p>

              {/* STAGE STATUS BANNER */}
              {isClearancePassed ? (
                <div style={{
                  background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
                  border: "1px solid #86efac",
                  borderRadius: "14px",
                  padding: "1.25rem 1.5rem",
                  marginBottom: "1.75rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1rem",
                  boxShadow: "0 4px 15px rgba(34, 197, 94, 0.08)"
                }}>
                  <div style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    background: "#22c55e",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 4px 10px rgba(34, 197, 94, 0.3)"
                  }}>
                    <ShieldCheck size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: "700", color: "#14532d", fontSize: "1.05rem" }}>
                        Stage 1 Complete: Locational Clearance Passed
                      </span>
                      <span style={{
                        background: "#bbf7d0",
                        color: "#166534",
                        padding: "2px 10px",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: "700"
                      }}>
                        Ref: {activeClearanceRef || "Verified"}
                      </span>
                    </div>
                    <p style={{ margin: "0.4rem 0 0 0", color: "#166534", fontSize: "0.9rem", lineHeight: "1.4" }}>
                      You have passed the mandatory zoning & land use clearance. Please choose between a <strong>Building Permit</strong> or <strong>Occupancy Permit</strong> for Stage 2 below.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)",
                  border: "1px solid #bfdbfe",
                  borderRadius: "14px",
                  padding: "1.25rem 1.5rem",
                  marginBottom: "1.75rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1rem"
                }}>
                  <div style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    background: "#3b82f6",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <FileText size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: "1rem", color: "#1e3a8a", fontWeight: "700" }}>
                      Step 1: Apply for Locational Clearance First
                    </h3>
                    <p style={{ margin: "0.35rem 0 0 0", color: "#334155", fontSize: "0.88rem", lineHeight: "1.4" }}>
                      Before applying for construction or occupancy, municipal regulations require every project to pass a <strong>Locational Clearance</strong> to confirm zoning and land use compliance.
                    </p>
                  </div>
                </div>
              )}

              {/* LOCKED WARNING NOTIFICATION */}
              {lockedNotice && (
                <div className="animate-fade-in-up" style={{
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: "12px",
                  padding: "1rem 1.25rem",
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  color: "#92400e"
                }}>
                  <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>{lockedNotice}</span>
                  <button 
                    onClick={() => setLockedNotice(null)}
                    style={{ marginLeft: "auto", background: "none", border: "none", color: "#92400e", cursor: "pointer", fontWeight: "700" }}
                  >
                    &times;
                  </button>
                </div>
              )}

              {/* PERMIT CARDS */}
              {isClearancePassed ? (
                /* STAGE 2: CHOOSE BETWEEN BUILDING PERMIT OR OCCUPANCY PERMIT */
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Stage 2 Options: Choose Permit
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSelectedPermitType("locational_clearance")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#2563eb",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        textDecoration: "underline"
                      }}
                    >
                      Applying for another property? Apply for new Locational Clearance
                    </button>
                  </div>

                  <div className="permit-options" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    {/* Building Permit Card */}
                    <label className={`permit-card ${selectedPermitType === "building_permit" ? "selected" : ""}`}>
                      <input 
                        type="radio" 
                        name="permit_type" 
                        value="building_permit" 
                        checked={selectedPermitType === "building_permit"}
                        onChange={() => setSelectedPermitType("building_permit")}
                      />
                      <div className="card-content" style={{ padding: "1.75rem", textAlign: "left" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                          <div className="card-icon" style={{ margin: 0 }}><Building2 size={30} /></div>
                          {selectedPermitType === "building_permit" && (
                            <span style={{ background: "#2563eb", color: "white", borderRadius: "50%", padding: "4px", display: "flex" }}>
                              <Check size={16} />
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.35rem" }}>Building Permit</h3>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", lineHeight: "1.4" }}>
                          Required prior to starting new construction, structural alterations, addition, or repair of any building or structure.
                        </p>
                      </div>
                    </label>

                    {/* Occupancy Permit Card */}
                    <label className={`permit-card ${selectedPermitType === "occupancy_permit" ? "selected" : ""}`}>
                      <input 
                        type="radio" 
                        name="permit_type" 
                        value="occupancy_permit" 
                        checked={selectedPermitType === "occupancy_permit"}
                        onChange={() => setSelectedPermitType("occupancy_permit")}
                      />
                      <div className="card-content" style={{ padding: "1.75rem", textAlign: "left" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                          <div className="card-icon" style={{ margin: 0 }}><Home size={30} /></div>
                          {selectedPermitType === "occupancy_permit" && (
                            <span style={{ background: "#2563eb", color: "white", borderRadius: "50%", padding: "4px", display: "flex" }}>
                              <Check size={16} />
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.35rem" }}>Occupancy Permit</h3>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", lineHeight: "1.4" }}>
                          Certificate of Occupancy required once construction is completed to verify safe standards before moving in.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                /* STAGE 1: MUST PASS LOCATIONAL CLEARANCE FIRST */
                <div>
                  <div className="permit-options" style={{ gridTemplateColumns: "1.2fr 1fr 1fr" }}>
                    {/* Locational Clearance (Active & Required) */}
                    <label className={`permit-card ${selectedPermitType === "locational_clearance" ? "selected" : ""}`}>
                      <input 
                        type="radio" 
                        name="permit_type" 
                        value="locational_clearance" 
                        checked={selectedPermitType === "locational_clearance"}
                        onChange={() => {
                          setSelectedPermitType("locational_clearance");
                          setLockedNotice(null);
                        }}
                      />
                      <div className="card-content" style={{ border: "2px solid #3b82f6", background: "#f8fafc", position: "relative" }}>
                        <div style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          background: "#2563eb",
                          color: "white",
                          fontSize: "0.7rem",
                          fontWeight: "700",
                          padding: "3px 8px",
                          borderRadius: "999px"
                        }}>
                          STEP 1 REQUIRED
                        </div>
                        <div className="card-icon"><FileText size={28} color="#2563eb" /></div>
                        <h3 style={{ fontWeight: "700", color: "#1e3a8a", marginBottom: "0.5rem" }}>Locational Clearance</h3>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b", lineHeight: "1.4" }}>
                          Zoning clearance evaluation for land use, building location, and municipal zoning boundaries.
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowGoogleForm(true);
                          }}
                          style={{
                            marginTop: "0.85rem",
                            width: "100%",
                            padding: "0.5rem 0.75rem",
                            fontSize: "0.82rem",
                            fontWeight: "600",
                            background: "#673ab7",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            boxShadow: "0 2px 4px rgba(103, 58, 183, 0.25)"
                          }}
                        >
                          <FileText size={14} /> Open Google Form (Annex D)
                        </button>
                      </div>
                    </label>

                    {/* Building Permit (Locked) */}
                    <div 
                      onClick={() => setLockedNotice("Building Permit is locked. You must first pass and obtain an approved Locational Clearance before applying.")}
                      style={{ cursor: "not-allowed", opacity: 0.65, position: "relative" }}
                    >
                      <div className="card-content" style={{ background: "#f1f5f9", border: "1px dashed #cbd5e1" }}>
                        <div style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          background: "#64748b",
                          color: "white",
                          fontSize: "0.68rem",
                          fontWeight: "700",
                          padding: "3px 8px",
                          borderRadius: "999px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}>
                          <Lock size={10} /> LOCKED
                        </div>
                        <div className="card-icon"><Building2 size={28} color="#94a3b8" /></div>
                        <h3 style={{ color: "#475569" }}>Building Permit</h3>
                        <p style={{ margin: 0, fontSize: "0.78rem", color: "#94a3b8" }}>
                          Requires approved Locational Clearance first.
                        </p>
                      </div>
                    </div>

                    {/* Occupancy Permit (Locked) */}
                    <div 
                      onClick={() => setLockedNotice("Occupancy Permit is locked. You must first pass and obtain an approved Locational Clearance before applying.")}
                      style={{ cursor: "not-allowed", opacity: 0.65, position: "relative" }}
                    >
                      <div className="card-content" style={{ background: "#f1f5f9", border: "1px dashed #cbd5e1" }}>
                        <div style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          background: "#64748b",
                          color: "white",
                          fontSize: "0.68rem",
                          fontWeight: "700",
                          padding: "3px 8px",
                          borderRadius: "999px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}>
                          <Lock size={10} /> LOCKED
                        </div>
                        <div className="card-icon"><Home size={28} color="#94a3b8" /></div>
                        <h3 style={{ color: "#475569" }}>Occupancy Permit</h3>
                        <p style={{ margin: 0, fontSize: "0.78rem", color: "#94a3b8" }}>
                          Requires approved Locational Clearance first.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* LINK EXISTING CLEARANCE HELPER */}
                  <div style={{ marginTop: "1.75rem", padding: "1rem 1.25rem", background: "white", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
                    {!showManualVerifyInput ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#475569" }}>
                          <ShieldCheck size={18} color="#2563eb" />
                          <span>Already passed and received an official Locational Clearance Certificate?</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowManualVerifyInput(true)}
                          className="btn-outline"
                          style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem", borderRadius: "8px" }}
                        >
                          Link Reference No.
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleVerifyManualClearance} style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: "220px" }}>
                          <input 
                            type="text"
                            placeholder="Enter Locational Clearance Reference (e.g. LC-2025-0001)"
                            value={manualClearanceRef}
                            onChange={(e) => setManualClearanceRef(e.target.value)}
                            style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                            autoFocus
                          />
                        </div>
                        <button 
                          type="submit" 
                          className="btn-primary" 
                          style={{ padding: "0.6rem 1.2rem", fontSize: "0.85rem" }}
                          disabled={!manualClearanceRef.trim()}
                        >
                          Verify & Unlock Stage 2
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowManualVerifyInput(false)}
                          style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "0.85rem" }}
                        >
                          Cancel
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-pane animate-fade-in-up">
              <h2>Project Details</h2>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "1.5rem" }}>
                
                {/* Left Column: Basic Details & Location */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div className="form-group">
                    <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.5rem", display: "block" }}>Project Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 2-Storey Residential" 
                      className="form-input" 
                      value={projectName}
                      onChange={e => setProjectName(e.target.value)}
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <h3 style={{ fontSize: "1.1rem", color: "#0f172a", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem" }}>Location (Sto. Tomas Only)</h3>
                    
                    <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.5rem", display: "block", fontSize: "0.9rem" }}>Barangay</label>
                        <select 
                          className="form-input" 
                          value={barangay}
                          onChange={e => setBarangay(e.target.value)}
                          style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1", background: "white" }}
                        >
                          <option value="San Bartolome">San Bartolome</option>
                          <option value="San Vicente">San Vicente</option>
                          <option value="San Matias">San Matias</option>
                          <option value="Poblacion">Poblacion</option>
                          <option value="Santo Rosario">Santo Rosario</option>
                          <option value="Sapa (Santo Niño)">Sapa (Santo Niño)</option>
                          <option value="Moras De La Paz">Moras De La Paz</option>
                        </select>
                      </div>
                      
                      <div className="form-group" style={{ flex: 1 }}>
                        <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.5rem", display: "block", fontSize: "0.9rem" }}>Street / Lot No.</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Lot 12, Block 3" 
                          className="form-input" 
                          value={streetAddress}
                          onChange={e => setStreetAddress(e.target.value)}
                          style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                        />
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.5rem", display: "block", fontSize: "0.85rem" }}>Latitude</label>
                        <input 
                          type="text" 
                          readOnly 
                          value={latitude}
                          className="form-input" 
                          style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f1f5f9", color: "#64748b" }}
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.5rem", display: "block", fontSize: "0.85rem" }}>Longitude</label>
                        <input 
                          type="text" 
                          readOnly 
                          value={longitude}
                          className="form-input" 
                          style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f1f5f9", color: "#64748b" }}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: "1rem" }}>
                      <LocationPickerMap 
                        onLocationChange={async (lat, lng, zone) => {
                          setLatitude(lat.toFixed(6));
                          setLongitude(lng.toFixed(6));
                          
                          if (zone) {
                            setDetectedZone(zone);
                            // Auto-select the barangay dropdown if the zone has it
                            if (zone.barangay) {
                              setBarangay(zone.barangay);
                            }
                          }
                          
                          // Reverse Geocoding to auto-fill street address, but preserve user edits
                          try {
                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                            const data = await res.json();
                            if (data && data.address) {
                              const road = data.address.road || data.address.pedestrian || "";
                              const neighborhood = data.address.neighbourhood || data.address.suburb || "";
                              
                              let autoAddress = road;
                              if (neighborhood && !road.includes(neighborhood)) {
                                autoAddress += autoAddress ? `, ${neighborhood}` : neighborhood;
                              }
                              
                              // Auto-fill if user hasn't typed much, or if it's empty
                              if (autoAddress && streetAddress.length < 5) {
                                setStreetAddress(autoAddress);
                              }
                            }
                          } catch (e) {
                            console.error("Reverse geocoding failed", e);
                          }
                        }} 
                      />
                    </div>
                    
                    {detectedZone && detectedZone.zoneType && (
                      <div className="animate-fade-in-up" style={{ marginTop: "1rem", padding: "1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", display: "flex", gap: "1rem", alignItems: "center" }}>
                        <div style={{ width: "40px", height: "40px", background: "#22c55e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <MapPin size={20} color="white" />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#166534", fontWeight: "700" }}>Detected Zone: {detectedZone.zoneType}</h4>
                          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "#15803d" }}>
                            {detectedZone.barangay ? `Barangay ${detectedZone.barangay} - ` : ""}
                            {detectedZone.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Advanced Details */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", color: "#0f172a", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem" }}>Advanced Project Details</h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div className="form-group">
                        <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.5rem", display: "block", fontSize: "0.9rem" }}>Total Lot Area (sq.m)</label>
                        <input 
                          type="number" 
                          placeholder="e.g. 150" 
                          className="form-input" 
                          value={lotArea}
                          onChange={e => setLotArea(e.target.value)}
                          style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.5rem", display: "block", fontSize: "0.9rem" }}>Total Floor Area (sq.m)</label>
                        <input 
                          type="number" 
                          placeholder="e.g. 200" 
                          className="form-input" 
                          value={floorArea}
                          onChange={e => setFloorArea(e.target.value)}
                          style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.5rem", display: "block", fontSize: "0.9rem" }}>Estimated Project Cost (₱)</label>
                        <input 
                          type="number" 
                          placeholder="e.g. 2500000" 
                          className="form-input" 
                          value={projectCost}
                          onChange={e => setProjectCost(e.target.value)}
                          style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-pane animate-fade-in-up">
              <h2>Upload Requirements</h2>
              <p>Please upload your requirements (PDF or Image). Files will be securely stored in the cloud.</p>
              
              <div className="upload-box" style={{ border: "2px dashed #cbd5e1", borderRadius: "12px", padding: "3rem", textAlign: "center", marginTop: "1.5rem", backgroundColor: "#f8fafc" }}>
                {uploading ? (
                  <div className="uploading-state">
                    <div className="spinner" style={{ width: "40px", height: "40px", border: "4px solid rgba(29, 78, 216, 0.2)", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem auto" }}></div>
                    <p style={{ fontWeight: "600", color: "#475569" }}>Uploading securely to Google Drive...</p>
                  </div>
                ) : uploadedFileUrl ? (
                  <div className="success-state">
                    <CheckCircle size={48} color="#10b981" style={{ margin: "0 auto 1rem auto" }} />
                    <h3 style={{ color: "#0f172a", marginBottom: "0.5rem" }}>Files Uploaded Successfully!</h3>
                    <p style={{ color: "#64748b", marginBottom: "1rem" }}>{uploadedFileUrl.split(',').length} file(s) securely attached.</p>
                  </div>
                ) : (
                  <>
                    <Upload size={48} color="#94a3b8" style={{ margin: "0 auto 1rem auto" }} />
                    <h3 style={{ color: "#334155", marginBottom: "1rem" }}>Select files to upload</h3>
                    <input 
                      type="file" 
                      id="file-upload" 
                      style={{ display: "none" }}
                      onChange={handleFileUpload}
                      accept=".pdf,.png,.jpg,.jpeg"
                      multiple
                    />
                    <label htmlFor="file-upload" className="btn-primary" style={{ cursor: "pointer", display: "inline-block" }}>
                      Choose Files
                    </label>
                  </>
                )}
                {uploadError && <p style={{ color: "#ef4444", marginTop: "1rem" }}>{uploadError}</p>}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="step-pane animate-fade-in-up">
              <h2>Review Your Application</h2>
              <div className="review-summary" style={{ background: "#f8fafc", padding: "2rem", borderRadius: "16px", marginTop: "1.5rem", border: "1px solid #e2e8f0" }}>
                <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
                  <span style={{ color: "#64748b", fontWeight: "600" }}>Permit Type:</span>
                  <span style={{ color: "#0f172a", fontWeight: "700", textTransform: "capitalize" }}>{selectedPermitType.replace("_", " ")}</span>
                </div>
                {activeClearanceRef && (
                  <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
                    <span style={{ color: "#64748b", fontWeight: "600" }}>Locational Clearance:</span>
                    <span style={{ color: "#166534", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Check size={16} color="#16a34a" /> Passed ({activeClearanceRef})
                    </span>
                  </div>
                )}
                <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
                  <span style={{ color: "#64748b", fontWeight: "600" }}>Project Name:</span>
                  <span style={{ color: "#0f172a", fontWeight: "700" }}>{projectName || "Not provided"}</span>
                </div>
                <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
                  <span style={{ color: "#64748b", fontWeight: "600" }}>Project Address:</span>
                  <span style={{ color: "#0f172a", fontWeight: "700" }}>{projectAddress || "Not provided"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b", fontWeight: "600" }}>Requirement:</span>
                  <span style={{ color: uploadedFileUrl ? "#10b981" : "#ef4444", fontWeight: "700" }}>
                    {uploadedFileUrl ? "Uploaded successfully" : "Missing file"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="wizard-actions">
            {currentStep > 1 && (
              <button className="btn-outline" onClick={() => setCurrentStep(prev => prev - 1)} disabled={uploading}>
                <ChevronLeft size={18} /> Back
              </button>
            )}
            
            <div className="flex-spacer"></div>

            {currentStep === 1 && selectedPermitType === "locational_clearance" ? (
              <button 
                className="btn-primary" 
                onClick={() => setShowGoogleForm(true)} 
                style={{ background: "#673ab7", borderColor: "#5e35b1", display: "flex", alignItems: "center", gap: "8px" }}
              >
                <FileText size={18} /> Fill Locational Clearance Form <ChevronRight size={18} />
              </button>
            ) : currentStep < 4 ? (
              <button className="btn-primary" onClick={() => setCurrentStep(prev => prev + 1)} disabled={uploading || (currentStep === 2 && !projectName) || (currentStep === 3 && !uploadedFileUrl)}>
                Next Step <ChevronRight size={18} />
              </button>
            ) : (
              <button className="btn-primary" onClick={handleSubmitApplication}>
                Submit Application <CheckCircle size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />

    </div>
  );
}
