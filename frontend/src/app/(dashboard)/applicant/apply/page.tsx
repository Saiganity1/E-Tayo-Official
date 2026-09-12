"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePermitContext } from "../../../../context/PermitContext";
import { 
  FileText, MapPin, Upload, CheckCircle, ChevronRight, ChevronLeft, 
  Lock, ShieldCheck, AlertCircle, Check, Layers, Search, Sparkles, 
  Home, Building2, Factory, Landmark, Wrench, Zap, Clock, Copy, 
  ArrowRight, CheckCircle2, Shield, Droplets, Flame, Radio, FileCheck, X,
  BadgeCheck, Info, Compass, Eye, Printer
} from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import LocationalClearanceGoogleForm from "../../../../components/forms/LocationalClearanceGoogleForm";
import UnifiedProjectGoogleForm from "../../../../components/forms/UnifiedProjectGoogleForm";
import { 
  PROJECT_TYPES_MATRIX, 
  ProjectTypeItem, 
  ProjectCategory, 
  PERMIT_FORM_METADATA, 
  PermitFormMatrix,
  getRequiredPermitForms,
  getConditionalPermitForms
} from "../../../../data/projectTypeMatrix";

const CATEGORY_THEMES: Record<string, { icon: any; color: string; bg: string; border: string; glow: string }> = {
  All: { icon: Layers, color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe", glow: "rgba(79, 70, 229, 0.25)" },
  Residential: { icon: Home, color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", glow: "rgba(5, 150, 105, 0.25)" },
  Commercial: { icon: Building2, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", glow: "rgba(37, 99, 235, 0.25)" },
  Industrial: { icon: Factory, color: "#d97706", bg: "#fffbeb", border: "#fde68a", glow: "rgba(217, 119, 6, 0.25)" },
  Institutional: { icon: Landmark, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", glow: "rgba(124, 58, 237, 0.25)" },
  "Ancillary & Alterations": { icon: Wrench, color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd", glow: "rgba(2, 132, 199, 0.25)" },
  "Utilities & Mechanical": { icon: Zap, color: "#e11d48", bg: "#fff1f2", border: "#fecdd3", glow: "rgba(225, 29, 72, 0.25)" },
};

const PERMIT_ICONS: Record<keyof PermitFormMatrix, any> = {
  buildingPermit: FileCheck,
  architecturalPermit: Layers,
  civilStructuralPermit: Shield,
  electricalPermit: Zap,
  sanitaryPermit: Droplets,
  mechanicalPermit: Wrench,
  electronicsPermit: Radio,
  fireBfpPermit: Flame,
  zoningPermit: MapPin,
};

const LocationPickerMap = dynamic(() => import("../../../../components/map/LocationPickerMap"), { 
  ssr: false, 
  loading: () => <div style={{ height: "200px", background: "#f8fafc", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #cbd5e1", color: "#64748b", fontWeight: "600" }}>Loading Map...</div> 
});

const STEPS = [
  { id: 1, title: "Project Stage", subtitle: "Clearance Verification", icon: ShieldCheck },
  { id: 2, title: "Project Type", subtitle: "Municipal Matrix", icon: Building2 },
  { id: 3, title: "Mapping", subtitle: "GIS & Coordinates", icon: MapPin },
  { id: 4, title: "Review", subtitle: "Final Endorsement", icon: CheckCircle }
];

const getProjectPermitsBreakdown = (project: ProjectTypeItem) => {
  const allKeys = Object.keys(PERMIT_FORM_METADATA) as (keyof PermitFormMatrix)[];
  
  const mandatory = allKeys
    .filter(k => project.matrix[k] === 'required')
    .map(k => ({
      key: k,
      ...PERMIT_FORM_METADATA[k],
      status: 'required' as const,
      icon: PERMIT_ICONS[k] || FileText
    }));

  const conditional = allKeys
    .filter(k => project.matrix[k] === 'conditional')
    .map(k => {
      let condition = 'Required depending on site engineering evaluation and specialized equipment scope.';
      if (k === 'mechanicalPermit') {
        condition = 'Required if project includes air conditioning machinery, elevator/escalators, commercial exhaust, or standby generator sets.';
      } else if (k === 'electronicsPermit') {
        condition = 'Required if project includes CCTV networks, security systems, commercial sound systems, or structured data cabling.';
      } else if (k === 'sanitaryPermit') {
        condition = 'Required if plumbing fixtures, drainage, or septic/wastewater facilities are modified.';
      } else if (k === 'fireBfpPermit') {
        condition = 'Required if structure undergoes material alteration, occupancy change, or high fire-load expansion.';
      }

      return {
        key: k,
        ...PERMIT_FORM_METADATA[k],
        status: 'conditional' as const,
        condition,
        icon: PERMIT_ICONS[k] || FileText
      };
    });

  const notRequired = allKeys
    .filter(k => project.matrix[k] === 'not_required')
    .map(k => ({
      key: k,
      ...PERMIT_FORM_METADATA[k],
      status: 'not_required' as const,
      icon: PERMIT_ICONS[k] || FileText
    }));

  return { mandatory, conditional, notRequired };
};

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
  const [selectedClearanceRef, setSelectedClearanceRef] = useState<string | null>(null);
  const [applicantName, setApplicantName] = useState("Applicant");

  // Project Type Matrix State (Stage 2)
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectTypeItem>(PROJECT_TYPES_MATRIX[0]);
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUnifiedForm, setShowUnifiedForm] = useState(false);
  const [showRequirementsAlert, setShowRequirementsAlert] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj.name) setApplicantName(userObj.name);
      }
    } catch (e) {}

    // Check if arriving from a specific clearance "Proceed to Stage 2" link (e.g. ?clearanceRef=LC-2026-4157)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("clearanceRef");
      if (ref) {
        setSelectedClearanceRef(ref);
        setIsManualVerified(true);
        setCurrentStep(2);
      }
    }
  }, []);

  useEffect(() => {
    if (showRequirementsAlert) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showRequirementsAlert]);

  const handleCopyRef = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } catch (e) {}
  };

  const filteredProjectTypes = PROJECT_TYPES_MATRIX.filter((p) => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesQuery = searchQuery.trim() === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // Detect if applicant has any approved Locational Clearance in their account history
  const approvedLC = (applications || []).find(
    app => (app.permitType === "locational_clearance") &&
           (app.status === "approved" || app.status === "released")
  );
  const hasSystemApprovedLC = !!approvedLC;
  
  // An application only passes Stage 1 if the user actively chooses to link an approved clearance or verifies a reference
  const isClearancePassed = Boolean(selectedClearanceRef || (isManualVerified && manualClearanceRef));
  const activeClearanceRef = selectedClearanceRef || (isManualVerified ? manualClearanceRef : null);

  // Stage navigation: Stage 1 = Locational Clearance, Stage 2 = Project Type Matrix
  const [stageOverride, setStageOverride] = useState<1 | 2 | null>(null);
  const currentStage = stageOverride !== null ? stageOverride : (isClearancePassed ? 2 : 1);

  // Sync selected permit type internally based on active stage
  useEffect(() => {
    if (currentStage === 1) {
      setSelectedPermitType("locational_clearance");
    } else {
      setSelectedPermitType("building_permit");
    }
  }, [currentStage, setSelectedPermitType]);

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
    setSelectedClearanceRef(manualClearanceRef.trim());
    setShowManualVerifyInput(false);
    setStageOverride(2);
    setCurrentStep(2);
    setLockedNotice(null);
  };

  const handleSubmitApplication = () => {
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

  if (showUnifiedForm) {
    return (
      <UnifiedProjectGoogleForm
        projectType={selectedProjectType}
        locationalClearanceRef={activeClearanceRef || "LC-APPROVED"}
        initialApplicantName={applicantName}
        initialApplicantAddress={projectAddress}
        initialProjectName={projectName}
        initialBarangay={barangay}
        initialLotArea={lotArea}
        onSubmitSuccess={(newApp) => {
          addApplication(newApp);
          setShowUnifiedForm(false);
          router.push("/applicant/dashboard");
        }}
        onCancel={() => setShowUnifiedForm(false)}
      />
    );
  }

  return (
    <div className="wizard-page animate-fade-in-up">
      <header className="page-header" style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.4rem" }}>
              <span style={{
                background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
                color: "white",
                padding: "3px 10px",
                borderRadius: "6px",
                fontSize: "0.72rem",
                fontWeight: "800",
                letterSpacing: "0.5px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}>
                <Landmark size={12} />
                LGU SANTO TOMAS, PAMPANGA
              </span>
              <span style={{
                fontSize: "0.75rem",
                color: "#64748b",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                • Office of the Local Building Official (OBO)
              </span>
            </div>
            <h1 className="page-title" style={{ fontSize: "1.85rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.35rem 0", letterSpacing: "-0.02em" }}>
              New Permit Application
            </h1>
            <p className="page-subtitle" style={{ margin: 0, color: "#64748b", fontSize: "0.92rem" }}>
              Official unified digital permitting workflow compliant with National Building Code of the Philippines (PD 1096).
            </p>
          </div>

          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
          }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>System Status</div>
              <div style={{ fontSize: "0.84rem", fontWeight: "800", color: "#16a34a", display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a" }}></span>
                Online Permitting Active
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="wizard-container glass-panel">
        <div className="wizard-sidebar" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <ul className="step-list">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isPassed = currentStep > step.id;
              return (
                <li 
                  key={step.id} 
                  className={`step-item ${isActive ? "active" : ""} ${isPassed ? "passed" : ""}`}
                  onClick={() => {
                    if (step.id === 1 || isClearancePassed) {
                      setCurrentStep(step.id);
                    } else {
                      setLockedNotice("Mandatory Locational Clearance (Stage 1) must be verified before proceeding to other steps.");
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="step-indicator" style={{
                    transition: "all 0.2s ease",
                    boxShadow: isActive ? "0 0 0 4px rgba(79, 70, 229, 0.15)" : "none"
                  }}>
                    {isPassed ? <CheckCircle size={16} /> : <span>{step.id}</span>}
                  </div>
                  <div className="step-content">
                    <span className="step-title">{step.title}</span>
                    <span className="step-desc" style={{ fontSize: "0.74rem", color: isActive ? "#4f46e5" : "#94a3b8", fontWeight: isActive ? "700" : "500" }}>
                      {isActive ? "In Progress" : step.subtitle}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          <div style={{
            marginTop: "2rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.72rem",
            color: "#94a3b8"
          }}>
            <Shield size={14} color="#94a3b8" />
            <span>256-Bit SSL Encrypted Portal</span>
          </div>
        </div>

        <div className="wizard-content">
          {/* STEP 1: PROJECT STAGE */}
          {currentStep === 1 && (
            <div className="step-pane animate-fade-in-up">
              <div style={{ marginBottom: "1.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                  <span style={{
                    fontSize: "0.72rem",
                    fontWeight: "800",
                    color: "#4338ca",
                    background: "#e0e7ff",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    letterSpacing: "0.5px"
                  }}>
                    STEP 1 OF 4
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "600" }}>
                    Prerequisite Verification
                  </span>
                </div>
                <h2 style={{ fontSize: "1.65rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.35rem 0" }}>
                  Project Stage
                </h2>
                <p style={{ margin: 0, color: "#475569", fontSize: "0.92rem", lineHeight: "1.5" }}>
                  Under Sto. Tomas Municipal Ordinance, construction permitting requires an approved <strong>Locational Clearance (Annex D)</strong> confirming zoning classification before selecting your specific Project Type.
                </p>
              </div>

              {/* LOCKED WARNING NOTIFICATION */}
              {lockedNotice && (
                <div className="animate-fade-in-up" style={{
                  background: "#fffbeb",
                  border: "1.5px solid #fde68a",
                  borderRadius: "14px",
                  padding: "1rem 1.25rem",
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  color: "#92400e",
                  boxShadow: "0 4px 12px rgba(217, 119, 6, 0.08)"
                }}>
                  <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: "0.9rem", fontWeight: "600" }}>{lockedNotice}</span>
                  <button 
                    onClick={() => setLockedNotice(null)}
                    style={{ marginLeft: "auto", background: "none", border: "none", color: "#92400e", cursor: "pointer", fontWeight: "700", fontSize: "1.1rem" }}
                  >
                    &times;
                  </button>
                </div>
              )}

              {/* STAGE STATUS / PATHWAY SELECTION */}
              {isClearancePassed ? (
                <div>
                  <div style={{
                    background: "linear-gradient(135deg, rgba(236, 253, 245, 0.95) 0%, rgba(240, 253, 244, 0.9) 100%)",
                    border: "1.5px solid #86efac",
                    borderRadius: "18px",
                    padding: "1.5rem 1.75rem",
                    marginBottom: "1.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1.25rem",
                    boxShadow: "0 10px 30px -5px rgba(34, 197, 94, 0.12), 0 0 0 1px rgba(134, 239, 172, 0.3) inset",
                    flexWrap: "wrap"
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", flex: 1, minWidth: "280px" }}>
                      <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: "0 6px 16px rgba(16, 185, 129, 0.35)"
                      }}>
                        <ShieldCheck size={26} strokeWidth={2.2} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                          <span style={{ fontWeight: "800", color: "#065f46", fontSize: "1.1rem", letterSpacing: "-0.01em" }}>
                            Locational Clearance Linked
                          </span>
                          <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "#ffffff",
                            border: "1px solid #a7f3d0",
                            color: "#047857",
                            padding: "3px 10px",
                            borderRadius: "999px",
                            fontSize: "0.8rem",
                            fontWeight: "700"
                          }}>
                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981" }}></span>
                            Ref: {activeClearanceRef || "Verified"}
                            <button
                              type="button"
                              onClick={() => handleCopyRef(activeClearanceRef || "LC-APPROVED")}
                              title="Copy Clearance Reference ID"
                              style={{ display: "flex", alignItems: "center", color: "#059669", marginLeft: "2px", cursor: "pointer", background: "none", border: "none", padding: 0 }}
                            >
                              {copiedRef ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                            </button>
                          </div>
                        </div>
                        <p style={{ margin: 0, color: "#166534", fontSize: "0.9rem", lineHeight: "1.45" }}>
                          This application is linked to approved clearance <strong>{activeClearanceRef}</strong>. You are cleared to proceed to <strong>Step 2: Project Type</strong>.
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClearanceRef(null);
                          setIsManualVerified(false);
                          setManualClearanceRef("");
                        }}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          color: "#475569",
                          borderRadius: "10px",
                          padding: "10px 16px",
                          fontSize: "0.85rem",
                          fontWeight: "700",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        Change / Apply for New Clearance
                      </button>

                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        style={{
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: "white",
                          border: "none",
                          borderRadius: "10px",
                          padding: "11px 20px",
                          fontSize: "0.9rem",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
                        }}
                      >
                        <span>Proceed to Step 2: Project Type</span>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{
                    background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)",
                    border: "1px solid #bfdbfe",
                    borderRadius: "16px",
                    padding: "1.25rem 1.5rem",
                    marginBottom: "1.75rem",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1rem",
                    boxShadow: "0 4px 15px rgba(59, 130, 246, 0.06)"
                  }}>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
                    }}>
                      <FileText size={22} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#1e3a8a", fontWeight: "800" }}>
                        Choose Your Permitting Pathway
                      </h3>
                      <p style={{ margin: "0.35rem 0 0 0", color: "#334155", fontSize: "0.88rem", lineHeight: "1.45" }}>
                        Select whether you are applying for a new <strong>Locational Clearance (Annex D)</strong> from scratch, or already hold an approved clearance and wish to file for <strong>Building & Engineering Permits</strong>.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
                    {/* PATHWAY 1: Apply for Locational Clearance (Annex D) */}
                    <div
                      style={{
                        border: "2px solid #3b82f6",
                        background: "#ffffff",
                        borderRadius: "18px",
                        padding: "1.75rem",
                        position: "relative",
                        boxShadow: "0 4px 16px rgba(59, 130, 246, 0.08)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                          <span style={{
                            background: "#2563eb",
                            color: "white",
                            fontSize: "0.72rem",
                            fontWeight: "800",
                            padding: "4px 10px",
                            borderRadius: "999px",
                            letterSpacing: "0.5px"
                          }}>
                            STAGE 1 · MANDATORY PREREQUISITE
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600" }}>
                            Annex D
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                          <div style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            background: "#eff6ff",
                            color: "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}>
                            <FileText size={24} />
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontWeight: "800", color: "#1e3a8a", fontSize: "1.15rem" }}>
                              Apply for Locational Clearance
                            </h3>
                            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Zoning & Land Use Verification</span>
                          </div>
                        </div>

                        <p style={{ margin: "0 0 1.5rem 0", fontSize: "0.88rem", color: "#475569", lineHeight: "1.5" }}>
                          Start a new application for Locational Clearance (Annex D) to certify municipal land zoning, Comprehensive Land Use Plan (CLUP) compliance, and boundary setbacks.
                        </p>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowGoogleForm(true);
                          }}
                          style={{
                            width: "100%",
                            padding: "0.85rem 1rem",
                            fontSize: "0.92rem",
                            fontWeight: "700",
                            background: "linear-gradient(135deg, #673ab7 0%, #512da8 100%)",
                            color: "white",
                            border: "none",
                            borderRadius: "10px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            boxShadow: "0 4px 12px rgba(103, 58, 183, 0.25)",
                            transition: "all 0.15s ease"
                          }}
                        >
                          <FileText size={18} /> Open Google Form (Annex D)
                        </button>
                      </div>
                    </div>

                    {/* PATHWAY 2: Have an approved clearance -> Proceed to Step 2 */}
                    <div 
                      style={{
                        border: hasSystemApprovedLC ? "2px solid #10b981" : "1.5px solid #e2e8f0",
                        background: hasSystemApprovedLC ? "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)" : "#f8fafc",
                        borderRadius: "18px",
                        padding: "1.75rem",
                        position: "relative",
                        boxShadow: hasSystemApprovedLC ? "0 4px 16px rgba(16, 185, 129, 0.1)" : "0 2px 8px rgba(0,0,0,0.02)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                          <span style={{
                            background: hasSystemApprovedLC ? "#059669" : "#64748b",
                            color: "white",
                            fontSize: "0.72rem",
                            fontWeight: "700",
                            padding: "4px 10px",
                            borderRadius: "999px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}>
                            {hasSystemApprovedLC ? <CheckCircle2 size={12} /> : <Lock size={12} />}
                            STAGE 2 · BUILDING PERMITS
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600" }}>
                            31 Project Types
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                          <div style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            background: hasSystemApprovedLC ? "#dcfce7" : "#e2e8f0",
                            color: hasSystemApprovedLC ? "#16a34a" : "#64748b",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}>
                            <Building2 size={24} />
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontWeight: "800", color: "#0f172a", fontSize: "1.15rem" }}>
                              Already Have Approved Clearance?
                            </h3>
                            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Proceed to Project Type Matrix</span>
                          </div>
                        </div>

                        <p style={{ margin: "0 0 1rem 0", fontSize: "0.88rem", color: "#475569", lineHeight: "1.5" }}>
                          If your Locational Clearance has already been verified and released by Sto. Tomas zoning officers, link it here to immediately configure your project type and building plans.
                        </p>

                        {hasSystemApprovedLC && approvedLC && (
                          <div style={{
                            background: "#ffffff",
                            border: "1.5px solid #86efac",
                            borderRadius: "12px",
                            padding: "10px 14px",
                            marginBottom: "1.25rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "8px"
                          }}>
                            <div>
                              <span style={{ fontSize: "0.72rem", color: "#166534", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Detected in your account:
                              </span>
                              <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "0.95rem" }}>
                                {approvedLC.id} <span style={{ fontWeight: "500", color: "#64748b" }}>({approvedLC.projectName || "Locational Clearance"})</span>
                              </div>
                            </div>
                            <span style={{ fontSize: "0.75rem", background: "#dcfce7", color: "#166534", padding: "3px 8px", borderRadius: "999px", fontWeight: "700", whiteSpace: "nowrap" }}>
                              Approved
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        {hasSystemApprovedLC && approvedLC ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClearanceRef(approvedLC.id);
                              setCurrentStep(2);
                            }}
                            style={{
                              width: "100%",
                              padding: "0.85rem 1rem",
                              fontSize: "0.92rem",
                              fontWeight: "700",
                              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                              color: "white",
                              border: "none",
                              borderRadius: "10px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)"
                            }}
                          >
                            <span>Use {approvedLC.id} & Proceed to Step 2</span>
                            <ChevronRight size={18} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowManualVerifyInput(true)}
                            style={{
                              width: "100%",
                              padding: "0.85rem 1rem",
                              fontSize: "0.92rem",
                              fontWeight: "700",
                              background: "#2563eb",
                              color: "white",
                              border: "none",
                              borderRadius: "10px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px"
                            }}
                          >
                            <span>Link Existing Clearance Ref</span>
                            <ChevronRight size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* LINK EXISTING CLEARANCE HELPER */}
                  <div style={{ marginTop: "1.75rem", padding: "1.25rem", background: "white", border: "1px solid #e2e8f0", borderRadius: "14px" }}>
                    {!showManualVerifyInput ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#475569" }}>
                          <ShieldCheck size={18} color="#2563eb" />
                          <span>Hold a clearance certificate from an offline application or another reference?</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowManualVerifyInput(true)}
                          className="btn-outline"
                          style={{ fontSize: "0.85rem", padding: "0.45rem 1rem", borderRadius: "8px", fontWeight: "600" }}
                        >
                          Enter Reference No.
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleVerifyManualClearance} style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: "240px" }}>
                          <input 
                            type="text"
                            placeholder="Enter Locational Clearance Reference (e.g. LC-2026-4157)"
                            value={manualClearanceRef}
                            onChange={(e) => setManualClearanceRef(e.target.value)}
                            style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                            autoFocus
                          />
                        </div>
                        <button 
                          type="submit" 
                          className="btn-primary" 
                          style={{ padding: "0.65rem 1.25rem", fontSize: "0.88rem" }}
                          disabled={!manualClearanceRef.trim()}
                        >
                          Verify & Proceed to Step 2
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowManualVerifyInput(false)}
                          style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#64748b", borderRadius: "8px", padding: "0.65rem 1rem", cursor: "pointer", fontSize: "0.88rem" }}
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

          {/* STEP 2: PROJECT TYPE */}
          {currentStep === 2 && (
            <div className="step-pane animate-fade-in-up">
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                  <span style={{
                    fontSize: "0.72rem",
                    fontWeight: "800",
                    color: "#4338ca",
                    background: "#e0e7ff",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    letterSpacing: "0.5px"
                  }}>
                    STEP 2 OF 4
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "600" }}>
                    Municipal Project Matrix
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h2 style={{ fontSize: "1.65rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.35rem 0" }}>
                      Project Type
                    </h2>
                    <p style={{ margin: 0, color: "#475569", fontSize: "0.92rem", lineHeight: "1.5" }}>
                      Select your specific project classification from the official Sto. Tomas 31-Project Type Matrix to determine required permits.
                    </p>
                  </div>
                  {selectedProjectType && (
                    <div style={{
                      background: "#f0fdf4",
                      border: "1.5px solid #86efac",
                      borderRadius: "12px",
                      padding: "8px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <CheckCircle2 size={18} color="#16a34a" />
                      <span style={{ fontSize: "0.84rem", color: "#166534", fontWeight: "700" }}>
                        Selected: <strong>{selectedProjectType.name}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* SEARCH & CATEGORY FILTERS */}
              <div style={{ marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div style={{ position: "relative", maxWidth: "420px" }}>
                  <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="text"
                    placeholder="Search by project name (e.g. House, Warehouse, Clinic)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px 9px 38px",
                      borderRadius: "10px",
                      border: "1.5px solid #e2e8f0",
                      fontSize: "0.88rem",
                      background: "#ffffff",
                      outline: "none",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                    }}
                  />
                  {searchQuery && (
                    <button 
                      type="button" 
                      onClick={() => setSearchQuery("")}
                      style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1rem" }}
                    >
                      &times;
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {(["All", "Residential", "Commercial", "Industrial", "Institutional", "Ancillary & Alterations", "Utilities & Mechanical"] as (ProjectCategory | "All")[]).map((cat) => {
                    const isActive = selectedCategory === cat;
                    const theme = cat === "All" 
                      ? CATEGORY_THEMES.All 
                      : (CATEGORY_THEMES[cat] || CATEGORY_THEMES.Commercial);
                    const CategoryIcon = theme.icon;
                    const count = cat === "All" 
                      ? PROJECT_TYPES_MATRIX.length 
                      : PROJECT_TYPES_MATRIX.filter(p => p.category === cat).length;

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "7px",
                          padding: "7px 14px",
                          borderRadius: "999px",
                          fontSize: "0.82rem",
                          fontWeight: "700",
                          border: isActive ? "1.5px solid #4f46e5" : "1px solid #e2e8f0",
                          background: isActive 
                            ? "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)" 
                            : "#ffffff",
                          color: isActive ? "#ffffff" : "#475569",
                          cursor: "pointer",
                          transition: "all 0.18s ease",
                          boxShadow: isActive ? "0 4px 12px rgba(79, 70, 229, 0.28)" : "0 1px 3px rgba(0,0,0,0.02)"
                        }}
                      >
                        <CategoryIcon size={15} color={isActive ? "#ffffff" : theme.color} />
                        <span>{cat}</span>
                        <span style={{
                          fontSize: "0.72rem",
                          fontWeight: "800",
                          background: isActive ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                          color: isActive ? "#ffffff" : "#64748b",
                          padding: "1px 6px",
                          borderRadius: "999px"
                        }}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STATUS BAR / COUNTER & SCROLL HINT */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
                padding: "0 4px",
                fontSize: "0.82rem",
                color: "#64748b"
              }}>
                <span style={{ fontWeight: "600" }}>
                  Showing <strong style={{ color: "#0f172a" }}>{filteredProjectTypes.length}</strong> project types
                  {selectedCategory !== "All" && ` · ${selectedCategory}`}
                </span>
                <span style={{ fontSize: "0.74rem", display: "inline-flex", alignItems: "center", gap: "5px", color: "#6366f1", fontWeight: "600", background: "#eef2ff", padding: "3px 10px", borderRadius: "999px" }}>
                  <span>Scroll to browse</span>
                  <span style={{ fontSize: "0.85rem" }}>↕</span>
                </span>
              </div>

              {/* 31 PROJECT TYPES GRID (SCROLLABLE) */}
              <div 
                className="project-cards-container"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
                  gap: "1.1rem",
                  padding: "6px 8px 16px 2px",
                  marginBottom: "1.5rem",
                  maxHeight: "clamp(380px, 58vh, 600px)",
                  overflowY: "auto",
                  overscrollBehavior: "contain"
                }}
              >
                {filteredProjectTypes.map((p) => {
                  const isSelected = selectedProjectType?.id === p.id;
                  const reqCount = getRequiredPermitForms(p).length;
                  const condCount = getConditionalPermitForms(p).length;
                  const theme = CATEGORY_THEMES[p.category] || CATEGORY_THEMES.Commercial;
                  const CatIcon = theme.icon;

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProjectType(p)}
                      className="project-card-item"
                      style={{
                        border: isSelected ? "2px solid #4f46e5" : "1.5px solid #e2e8f0",
                        background: isSelected ? "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)" : "#ffffff",
                        borderRadius: "16px",
                        padding: "1.2rem",
                        cursor: "pointer",
                        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                        boxShadow: isSelected 
                          ? "0 8px 24px rgba(79, 70, 229, 0.15), 0 0 0 1px #4f46e5" 
                          : "0 2px 6px rgba(0,0,0,0.02)",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.65rem" }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "0.72rem",
                            fontWeight: "700",
                            color: theme.color,
                            background: theme.bg,
                            border: `1px solid ${theme.border}`,
                            padding: "2px 8px",
                            borderRadius: "999px"
                          }}>
                            <CatIcon size={12} />
                            {p.category}
                          </span>

                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.72rem",
                            color: "#64748b",
                            fontWeight: "500"
                          }}>
                            <Clock size={12} /> {p.estimatedDays}
                          </span>
                        </div>

                        <h4 style={{ margin: "0 0 0.35rem 0", fontSize: "1.05rem", fontWeight: "800", color: "#0f172a" }}>
                          {p.name}
                        </h4>
                        <p style={{ margin: "0 0 0.85rem 0", fontSize: "0.82rem", color: "#64748b", lineHeight: "1.45", minHeight: "36px" }}>
                          {p.description}
                        </p>
                      </div>

                      <div>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "0.85rem", fontSize: "0.72rem", fontWeight: "700" }}>
                          <span style={{ background: "#dbeafe", color: "#1e40af", padding: "3px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Check size={12} strokeWidth={2.5} /> {reqCount} Mandatory
                          </span>
                          {condCount > 0 && (
                            <span style={{ background: "#fef3c7", color: "#92400e", padding: "3px 8px", borderRadius: "6px" }}>
                              {condCount} Conditional
                            </span>
                          )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProjectType(p);
                              setShowRequirementsAlert(true);
                            }}
                            style={{
                              background: "rgba(79, 70, 229, 0.08)",
                              border: "1px solid rgba(79, 70, 229, 0.2)",
                              color: "#4f46e5",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "6px 11px",
                              transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#4f46e5"; e.currentTarget.style.color = "#ffffff"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(79, 70, 229, 0.08)"; e.currentTarget.style.color = "#4f46e5"; }}
                            title="View Required Docs for this Project Type"
                          >
                            <Eye size={13} /> Required Docs
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProjectType(p);
                              setCurrentStep(3);
                            }}
                            style={{
                              background: isSelected ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" : "#f1f5f9",
                              border: isSelected ? "none" : "1px solid #cbd5e1",
                              color: isSelected ? "#ffffff" : "#475569",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "6px 14px",
                              boxShadow: isSelected ? "0 2px 8px rgba(79, 70, 229, 0.28)" : "none",
                              transition: "all 0.15s ease"
                            }}
                            title="Select this Project Type and proceed to Mapping"
                          >
                            <span>{isSelected ? "Selected" : "Select"}</span>
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: MAPPING */}
          {currentStep === 3 && (
            <div className="step-pane animate-fade-in-up">
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                  <span style={{
                    fontSize: "0.72rem",
                    fontWeight: "800",
                    color: "#4338ca",
                    background: "#e0e7ff",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    letterSpacing: "0.5px"
                  }}>
                    STEP 3 OF 4
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "600" }}>
                    Site & Cadastral Mapping
                  </span>
                </div>
                <h2 style={{ fontSize: "1.65rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.35rem 0" }}>
                  Mapping
                </h2>
                <p style={{ margin: 0, color: "#475569", fontSize: "0.92rem", lineHeight: "1.5" }}>
                  Pinpoint your project location in Sto. Tomas, Pampanga to determine cadastral boundaries, coordinates, and zoning compliance.
                </p>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "1rem" }}>
                {/* Left Column: Basic Details & Location */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div className="form-group">
                    <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.5rem", display: "block" }}>Project Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 2-Storey Residential House" 
                      className="form-input" 
                      value={projectName}
                      onChange={e => setProjectName(e.target.value)}
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  
                  <div>
                    <LocationPickerMap 
                      onLocationChange={async (lat, lng, zone) => {
                        setLatitude(lat.toFixed(6));
                        setLongitude(lng.toFixed(6));
                        
                        if (zone) {
                          setDetectedZone(zone);
                          if (zone.barangay) {
                            setBarangay(zone.barangay);
                          }
                        }
                        
                        try {
                          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                          const data = await res.json();
                          if (data && data.address) {
                            const road = data.address.road || data.address.pedestrian || "";
                            const neighborhood = data.address.neighbourhood || data.address.suburb || "";
                            if (road || neighborhood) {
                              setStreetAddress(prev => prev.trim() === "" ? [road, neighborhood].filter(Boolean).join(", ") : prev);
                            }
                          }
                        } catch (err) {
                          console.error("Reverse geocoding error:", err);
                        }
                      }}
                    />
                  </div>

                  {detectedZone && (
                    <div className="animate-fade-in-up" style={{ marginTop: "1rem", padding: "1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", display: "flex", gap: "1rem", alignItems: "center" }}>
                      <ShieldCheck size={28} color="#16a34a" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "0.75rem", background: "#dcfce7", color: "#166534", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                            {detectedZone.code || "ZONE"}
                          </span>
                          <span style={{ fontWeight: "700", color: "#166534", fontSize: "0.95rem" }}>
                            {detectedZone.name}
                          </span>
                        </div>
                        <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#15803d" }}>
                          {detectedZone.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW */}
          {currentStep === 4 && (
            <div className="step-pane animate-fade-in-up">
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                  <span style={{
                    fontSize: "0.72rem",
                    fontWeight: "800",
                    color: "#4338ca",
                    background: "#e0e7ff",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    letterSpacing: "0.5px"
                  }}>
                    STEP 4 OF 4
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "600" }}>
                    Final Verification & Filing
                  </span>
                </div>
                <h2 style={{ fontSize: "1.65rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.35rem 0" }}>
                  Review
                </h2>
                <p style={{ margin: 0, color: "#475569", fontSize: "0.92rem", lineHeight: "1.5" }}>
                  Review your application details, selected municipal project type, and site mapping before filing endorsement.
                </p>
              </div>

              <div className="review-summary" style={{ background: "#ffffff", padding: "2rem", borderRadius: "18px", border: "1.5px solid #e2e8f0", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
                  {/* Stage 1 Summary Card */}
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "14px", padding: "1.1rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "#166534", textTransform: "uppercase" }}>1. Project Stage</span>
                    <h4 style={{ margin: "0.4rem 0 0.2rem 0", fontSize: "1.05rem", fontWeight: "800", color: "#0f172a" }}>Locational Clearance</h4>
                    <span style={{ fontSize: "0.84rem", color: "#15803d", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle2 size={15} color="#16a34a" /> Passed ({activeClearanceRef || "LC-VERIFIED"})
                    </span>
                  </div>

                  {/* Stage 2 Summary Card */}
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "14px", padding: "1.1rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "#1e40af", textTransform: "uppercase" }}>2. Project Type</span>
                    <h4 style={{ margin: "0.4rem 0 0.2rem 0", fontSize: "1.05rem", fontWeight: "800", color: "#0f172a" }}>{selectedProjectType?.name}</h4>
                    <span style={{ fontSize: "0.84rem", color: "#2563eb", fontWeight: "600" }}>
                      {selectedProjectType?.category} • {getRequiredPermitForms(selectedProjectType).length} Mandatory Forms
                    </span>
                  </div>

                  {/* Stage 3 Summary Card */}
                  <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "14px", padding: "1.1rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>3. Mapping</span>
                    <h4 style={{ margin: "0.4rem 0 0.2rem 0", fontSize: "1.05rem", fontWeight: "800", color: "#0f172a" }}>{projectName || "Untitled Project"}</h4>
                    <span style={{ fontSize: "0.84rem", color: "#64748b" }}>
                      {streetAddress || "Sto. Tomas"}, Brgy. {barangay}
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                    <span style={{ color: "#64748b", fontWeight: "600" }}>Coordinates:</span>
                    <span style={{ color: "#0f172a", fontWeight: "700" }}>{latitude ? `${latitude}, ${longitude}` : "Sto. Tomas GIS Centroid"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                    <span style={{ color: "#64748b", fontWeight: "600" }}>Zoning Classification:</span>
                    <span style={{ color: "#0f172a", fontWeight: "700" }}>{detectedZone?.name || "R-1 (Low-Density Residential)"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                    <span style={{ color: "#64748b", fontWeight: "600" }}>Total Lot / Floor Area:</span>
                    <span style={{ color: "#0f172a", fontWeight: "700" }}>{lotArea || 0} sq.m / {floorArea || 0} sq.m</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                    <span style={{ color: "#64748b", fontWeight: "600" }}>Estimated Project Cost:</span>
                    <span style={{ color: "#16a34a", fontWeight: "800" }}>₱{Number(projectCost || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WIZARD ACTIONS BAR */}
          <div className="wizard-actions">
            {currentStep > 1 && (
              <button className="btn-outline" onClick={() => setCurrentStep(prev => prev - 1)} disabled={uploading}>
                <ChevronLeft size={18} /> Back
              </button>
            )}
            
            <div className="flex-spacer"></div>

            {currentStep === 1 ? (
              isClearancePassed ? (
                <button 
                  className="btn-primary" 
                  onClick={() => setCurrentStep(2)}
                  style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", display: "flex", alignItems: "center", gap: "8px", padding: "10px 22px", borderRadius: "10px" }}
                >
                  <span>Next: Project Type</span>
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button 
                  className="btn-primary" 
                  onClick={() => setShowGoogleForm(true)} 
                  style={{ background: "#673ab7", borderColor: "#5e35b1", display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <FileText size={18} /> Fill Locational Clearance Form (Annex D) <ChevronRight size={18} />
                </button>
              )
            ) : currentStep === 2 ? (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <button 
                  type="button"
                  onClick={() => setShowUnifiedForm(true)} 
                  style={{
                    background: "#ffffff",
                    border: "1.5px solid #c7d2fe",
                    color: "#4338ca",
                    padding: "9px 18px",
                    borderRadius: "10px",
                    fontWeight: "700",
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <FileText size={16} /> Open Unified Form (Google Form Style)
                </button>
                <button 
                  className="btn-primary" 
                  onClick={() => setCurrentStep(3)}
                  style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", display: "flex", alignItems: "center", gap: "8px", padding: "10px 22px", borderRadius: "10px" }}
                >
                  <span>Next: Mapping</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            ) : currentStep === 3 ? (
              <button 
                className="btn-primary" 
                onClick={() => setCurrentStep(4)}
                style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", display: "flex", alignItems: "center", gap: "8px", padding: "10px 22px", borderRadius: "10px" }}
              >
                <span>Next: Review</span>
                <ChevronRight size={18} />
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <button 
                  type="button"
                  onClick={() => setShowUnifiedForm(true)} 
                  style={{
                    background: "#ffffff",
                    border: "1.5px solid #c7d2fe",
                    color: "#4338ca",
                    padding: "9px 18px",
                    borderRadius: "10px",
                    fontWeight: "700",
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <FileText size={16} /> Open Unified Form (Google Form Style)
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleSubmitApplication}
                  style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", display: "flex", alignItems: "center", gap: "8px", padding: "10px 22px", borderRadius: "10px" }}
                >
                  <span>Submit Application</span>
                  <CheckCircle size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* ON-SCREEN REQUIRED PERMITS ALERT MODAL (PORTALED TO DOCUMENT.BODY) */}
      {mounted && showRequirementsAlert && typeof document !== "undefined" && (() => {
        const { mandatory, conditional, notRequired } = getProjectPermitsBreakdown(selectedProjectType);

        return createPortal(
          <div 
            role="alertdialog"
            aria-modal="true"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(15, 23, 42, 0.72)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
              margin: 0
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowRequirementsAlert(false);
            }}
          >
            <div style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "760px",
              width: "100%",
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(226, 232, 240, 0.8)",
              overflow: "hidden",
              position: "relative",
              animation: "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
            }}>
              {/* ALERT HEADER */}
              <div style={{
                background: "linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)",
                color: "white",
                padding: "1.25rem 1.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff"
                  }}>
                    <FileCheck size={24} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                      <span style={{
                        fontSize: "0.68rem",
                        fontWeight: "800",
                        background: "rgba(255, 255, 255, 0.2)",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        letterSpacing: "0.5px"
                      }}>
                        OFFICIAL PERMIT MATRIX BREAKDOWN
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>
                        Santo Tomas OBO • PD 1096
                      </span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: "800", letterSpacing: "-0.01em" }}>
                      Permits Needed for {selectedProjectType.name}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRequirementsAlert(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.15)",
                    border: "none",
                    color: "white",
                    width: "34px",
                    height: "34px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"; }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* ALERT BODY */}
              <div style={{ padding: "1.5rem 1.75rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* STATUS SUMMARY BANNER */}
                <div style={{
                  background: "#f0f9ff",
                  border: "1.5px solid #bae6fd",
                  borderRadius: "12px",
                  padding: "0.9rem 1.1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.75rem"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Info size={18} color="#0284c7" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: "0.86rem", color: "#0369a1", lineHeight: "1.4" }}>
                      Under the Santo Tomas Municipal Permitting Matrix, the following engineering permits are required for this <strong>{selectedProjectType.category}</strong> project:
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <span style={{ fontSize: "0.76rem", fontWeight: "800", color: "#15803d", background: "#dcfce7", border: "1px solid #86efac", padding: "3px 9px", borderRadius: "999px" }}>
                      {mandatory.length} Mandatory
                    </span>
                    {conditional.length > 0 && (
                      <span style={{ fontSize: "0.76rem", fontWeight: "800", color: "#b45309", background: "#fef3c7", border: "1px solid #fde68a", padding: "3px 9px", borderRadius: "999px" }}>
                        {conditional.length} Conditional
                      </span>
                    )}
                  </div>
                </div>

                {/* 1. MANDATORY PERMITS NEEDED */}
                <div>
                  <h4 style={{ margin: "0 0 0.65rem 0", fontSize: "0.98rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "7px" }}>
                    <CheckCircle2 size={18} color="#16a34a" />
                    Mandatory Permits for this Project ({mandatory.length} Required)
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                    {mandatory.map((p) => {
                      const Icon = p.icon;
                      return (
                        <div key={p.key} style={{
                          background: "linear-gradient(135deg, #f8faff 0%, #eff6ff 100%)",
                          border: "1.5px solid #bfdbfe",
                          borderRadius: "12px",
                          padding: "0.85rem 1rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.75rem",
                          boxShadow: "0 2px 5px rgba(37, 99, 235, 0.04)"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "8px",
                              background: "#dbeafe",
                              color: "#1d4ed8",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0
                            }}>
                              <Icon size={18} />
                            </div>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "0.68rem", fontWeight: "800", padding: "2px 6px", borderRadius: "4px", background: "#1e40af", color: "white" }}>
                                  {p.code}
                                </span>
                                <span style={{ fontSize: "0.9rem", fontWeight: "800", color: "#0f172a" }}>
                                  {p.label}
                                </span>
                              </div>
                              <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "2px" }}>
                                {p.desc}
                              </div>
                            </div>
                          </div>
                          <span style={{
                            fontSize: "0.7rem",
                            fontWeight: "800",
                            padding: "3px 10px",
                            borderRadius: "999px",
                            background: "#dcfce7",
                            color: "#15803d",
                            border: "1px solid #86efac",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            flexShrink: 0
                          }}>
                            <Check size={11} strokeWidth={3} /> MANDATORY
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. CONDITIONAL PERMITS NEEDED */}
                {conditional.length > 0 && (
                  <div>
                    <h4 style={{ margin: "0 0 0.65rem 0", fontSize: "0.98rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "7px" }}>
                      <AlertCircle size={18} color="#d97706" />
                      Conditional Permits ({conditional.length} Depending on Scope)
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                      {conditional.map((p) => {
                        const Icon = p.icon;
                        return (
                          <div key={p.key} style={{
                            background: "linear-gradient(135deg, #fffdfa 0%, #fef8eb 100%)",
                            border: "1.5px solid #fde68a",
                            borderRadius: "12px",
                            padding: "0.85rem 1rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.75rem"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <div style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "8px",
                                background: "#fef3c7",
                                color: "#b45309",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0
                              }}>
                                <Icon size={18} />
                              </div>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontSize: "0.68rem", fontWeight: "800", padding: "2px 6px", borderRadius: "4px", background: "#b45309", color: "white" }}>
                                    {p.code}
                                  </span>
                                  <span style={{ fontSize: "0.9rem", fontWeight: "800", color: "#0f172a" }}>
                                    {p.label}
                                  </span>
                                </div>
                                <div style={{ fontSize: "0.76rem", color: "#78350f", marginTop: "2px" }}>
                                  Condition: {p.condition}
                                </div>
                              </div>
                            </div>
                            <span style={{
                              fontSize: "0.7rem",
                              fontWeight: "800",
                              padding: "3px 10px",
                              borderRadius: "999px",
                              background: "#fef3c7",
                              color: "#b45309",
                              border: "1px solid #fde68a",
                              flexShrink: 0
                            }}>
                              CONDITIONAL
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. EXEMPT / NOT REQUIRED PERMITS */}
                {notRequired.length > 0 && (
                  <div>
                    <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.88rem", fontWeight: "700", color: "#64748b" }}>
                      Permits Exempt / Not Applicable for this Project Type ({notRequired.length}):
                    </h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {notRequired.map((p) => (
                        <span key={p.key} style={{
                          fontSize: "0.75rem",
                          background: "#f1f5f9",
                          color: "#64748b",
                          border: "1px solid #e2e8f0",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px"
                        }}>
                          <strong>{p.code}</strong>: {p.label} (Not Required)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ALERT FOOTER ACTIONS */}
              <div style={{
                background: "#f8fafc",
                borderTop: "1px solid #e2e8f0",
                padding: "1rem 1.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.75rem"
              }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: "#ffffff",
                    border: "1.5px solid #cbd5e1",
                    color: "#475569",
                    borderRadius: "10px",
                    padding: "9px 16px",
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <Printer size={15} /> Print Permit List
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowRequirementsAlert(false)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      padding: "9px 14px",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    Close Alert
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowRequirementsAlert(false);
                      setShowUnifiedForm(true);
                    }}
                    style={{
                      background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      padding: "9px 20px",
                      fontSize: "0.88rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 4px 14px rgba(79, 70, 229, 0.3)"
                    }}
                  >
                    <FileText size={16} /> Fill These Forms Online <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}} />

    </div>
  );
}
