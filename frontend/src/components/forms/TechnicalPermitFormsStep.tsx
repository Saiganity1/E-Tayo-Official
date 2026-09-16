"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, Wrench, Zap, Shield, Layers, Droplets, Flame, Radio, 
  CheckCircle2, AlertCircle, Download, Upload, Trash2, Check, 
  ArrowRight, Sparkles, Building, ChevronRight, Info, Eye, 
  Clock, ShieldCheck, ChevronLeft, Lock
} from "lucide-react";
import { 
  ProjectTypeItem, 
  PERMIT_FORM_METADATA, 
  PermitFormMatrix, 
  getPermitFormTemplate 
} from "../../data/projectTypeMatrix";
import { generateUnifiedPermitPdf } from "../../utils/unifiedPermitPdfGenerator";

interface TechnicalPermitFormsStepProps {
  projectType: ProjectTypeItem;
  locationalClearanceRef: string | null;
  isClearanceRequired: boolean;
  applicantName: string;
  projectName: string;
  setProjectName: (name: string) => void;
  streetAddress: string;
  setStreetAddress: (address: string) => void;
  barangay: string;
  setBarangay: (barangay: string) => void;
  lotArea: string;
  setLotArea: (area: string) => void;
  floorArea: string;
  setFloorArea: (area: string) => void;
  projectCost: string;
  setProjectCost: (cost: string) => void;
  uploadedPermitDocs: Record<string, any>;
  setUploadedPermitDocs: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  onProceedToMapping: () => void;
  onBack: () => void;
}

export default function TechnicalPermitFormsStep({
  projectType,
  locationalClearanceRef,
  isClearanceRequired,
  applicantName,
  projectName,
  setProjectName,
  streetAddress,
  setStreetAddress,
  barangay,
  setBarangay,
  lotArea,
  setLotArea,
  floorArea,
  setFloorArea,
  projectCost,
  setProjectCost,
  uploadedPermitDocs,
  setUploadedPermitDocs,
  onProceedToMapping,
  onBack
}: TechnicalPermitFormsStepProps) {
  // Input Mode: "digital_fill" or "upload_scans"
  const [inputMode, setInputMode] = useState<"digital_fill" | "upload_scans">("digital_fill");

  // Mandatory technical permit keys for this project type (excluding zoning clearance which is Stage 1 / Step 2)
  const mandatoryKeys = (Object.keys(projectType.matrix) as (keyof PermitFormMatrix)[]).filter(
    (k) => projectType.matrix[k] === "required" && k !== "zoningPermit"
  );

  // Active form tab currently viewed in online mode
  const [activeTab, setActiveTab] = useState<keyof PermitFormMatrix>(
    mandatoryKeys[0] || "buildingPermit"
  );

  // --- 1. Mechanical Permit Specifications (for Elevator / Escalator / Generator / AC) ---
  const [machineryType, setMachineryType] = useState(
    projectType.id === "elevator_escalator" 
      ? "Commercial Escalator (Heavy Duty)" 
      : projectType.id === "generator_set"
      ? "Diesel Standby Generator Set"
      : "HVAC & Mechanical Air Ventilation"
  );
  const [machineryBrand, setMachineryBrand] = useState("Mitsubishi Heavy Industries / Otis");
  const [machineryCapacity, setMachineryCapacity] = useState(
    projectType.id === "elevator_escalator" ? "9,000 persons / hr (1,000 kg capacity)" : "250 kVA Standby Rating"
  );
  const [machinerySpeed, setMachinerySpeed] = useState("0.50 m/sec rated velocity");
  const [machineryPower, setMachineryPower] = useState("15 kW (20.0 HP), 3-Phase");
  const [machineryStoreys, setMachineryStoreys] = useState("Ground to 2nd Floor Level (2 Landings)");
  const [mechanicalEngineerName, setMechanicalEngineerName] = useState("Engr. Antonio Gomez, PME");
  const [mechanicalEngineerPRC, setMechanicalEngineerPRC] = useState("PRC-PME-0021489");
  const [mechanicalEngineerPTR, setMechanicalEngineerPTR] = useState("PTR-ST-2026-9921");

  // --- 2. Electrical Permit Specifications ---
  const [electricalConnectedLoad, setElectricalConnectedLoad] = useState(
    projectType.id === "elevator_escalator" ? "25.0 kVA" : "45.0 kVA"
  );
  const [electricalVoltage, setElectricalVoltage] = useState("460V / 230V, 3-Phase, 3-Wire, 60Hz");
  const [electricalFeeder, setElectricalFeeder] = useState("3 x 38mm² THHN in 50mm dia. RSC conduit");
  const [electricalEngineerName, setElectricalEngineerName] = useState("Engr. Danilo Reyes, PEE");
  const [electricalEngineerPRC, setElectricalEngineerPRC] = useState("PRC-PEE-0033421");
  const [electricalEngineerPTR, setElectricalEngineerPTR] = useState("PTR-ST-2026-4412");

  // --- 3. Building & Civil/Structural Permit Specifications ---
  const [lotNo, setLotNo] = useState("Lot 12");
  const [blockNo, setBlockNo] = useState("Block 4");
  const [tctNo, setTctNo] = useState("TCT-123456-P");
  const [proposedStoreys, setProposedStoreys] = useState(
    projectType.id === "two_storey_house" ? "2" : projectType.id === "single_detached_house" ? "1" : "2"
  );
  const [scopeOfWork, setScopeOfWork] = useState(
    projectType.id === "elevator_escalator" || projectType.id === "generator_set"
      ? "New Mechanical & Electrical Installation"
      : "New Construction"
  );
  const [civilEngineerName, setCivilEngineerName] = useState("Engr. Roberto Cruz, CE");
  const [civilEngineerPRC, setCivilEngineerPRC] = useState("PRC-CE-0078923");

  // --- 4. Architectural Permit Specifications ---
  const [architectName, setArchitectName] = useState("Arch. Maria Santos, UAP");
  const [architectPRC, setArchitectPRC] = useState("PRC-ARC-0045211");

  // --- 5. Sanitary / Plumbing Permit Specifications ---
  const [masterPlumberName, setMasterPlumberName] = useState("Engr. Jose Mendoza, RMP");
  const [masterPlumberPRC, setMasterPlumberPRC] = useState("PRC-MP-0012984");

  // --- 6. Electronics Permit Specifications ---
  const [electronicsEngineerName, setElectronicsEngineerName] = useState("Engr. Carlos Lim, PECE");
  const [electronicsEngineerPRC, setElectronicsEngineerPRC] = useState("PRC-PECE-0038912");

  // --- 7. Fire Safety Clearance (FSEC) ---
  const [fireEgressDetails, setFireEgressDetails] = useState("2 x 10-lb Dry Chemical ABC Extinguishers, Emergency Stop & Alarm Link");

  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeUploadingKey, setActiveUploadingKey] = useState<string | null>(null);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<string | null>(null);
  const [hasCompletedOnlineForm, setHasCompletedOnlineForm] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Sync active tab if projectType changes
  useEffect(() => {
    if (mandatoryKeys.length > 0 && !mandatoryKeys.includes(activeTab)) {
      setActiveTab(mandatoryKeys[0]);
    }
  }, [projectType]);

  // Check which mandatory keys have been satisfied (either uploaded or generated online)
  const satisfiedKeys = mandatoryKeys.filter((key) => Boolean(uploadedPermitDocs[key]));
  const areAllMandatorySatisfied = mandatoryKeys.every((key) => Boolean(uploadedPermitDocs[key]));

  // Auto-generate official PDF package and mark forms as completed
  const handleGenerateDigitalForms = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setNotification(null);

    try {
      const applicationNo = `UNIFIED-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const submissionDate = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
      const fullAddress = `${streetAddress || "Main Street"}, Brgy. ${barangay}, Sto. Tomas, Pampanga`;

      const base64Pdf = await generateUnifiedPermitPdf({
        applicationNo,
        locationalClearanceRef: locationalClearanceRef || (isClearanceRequired ? "LC-VERIFIED" : "EXEMPT"),
        projectType,
        applicantName,
        applicantPhone: "0917-123-4567",
        applicantEmail: "applicant@etayo.gov.ph",
        applicantAddress: fullAddress,
        projectName: projectName || `${projectType.name} Installation`,
        projectAddress: fullAddress,
        barangay,
        lotNo,
        blockNo,
        tctNo,
        lotArea: lotArea || "200",
        floorArea: floorArea || "150",
        projectCost: projectCost || "1,200,000",
        scopeOfWork,
        occupancyClass: projectType.category,
        proposedStoreys,
        architectName,
        architectPRC,
        civilEngineerName,
        civilEngineerPRC,
        electricalEngineerName,
        electricalEngineerPRC,
        masterPlumberName,
        masterPlumberPRC,
        mechanicalEngineerName,
        mechanicalEngineerPRC,
        electronicsEngineerName,
        electronicsEngineerPRC,
        machineryType,
        machineryCapacity,
        machineryPower,
        electricalLoadKva: electricalConnectedLoad,
        serviceVoltage: electricalVoltage,
        activePermitForms: mandatoryKeys,
        submissionDate
      });

      const dataUrl = `data:application/pdf;base64,${base64Pdf}`;
      setGeneratedPdfBlob(dataUrl);
      setHasCompletedOnlineForm(true);

      // Populate uploadedPermitDocs for each mandatory key
      const newDocs: Record<string, any> = { ...uploadedPermitDocs };
      mandatoryKeys.forEach((key) => {
        const meta = PERMIT_FORM_METADATA[key];
        newDocs[key] = {
          fileName: `${meta.code}_${projectType.name.replace(/\s+/g, '_')}_Official_Filled.pdf`,
          fileSize: "1.4 MB",
          fileUrl: dataUrl,
          uploadedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isDigitallyGenerated: true
        };
      });

      setUploadedPermitDocs(newDocs);
      setNotification(
        `All ${mandatoryKeys.length} official permit forms for ${projectType.name} have been compiled and signed digitally. You are cleared to proceed to Step 4: Mapping.`
      );
    } catch (err: any) {
      console.error("Error generating forms:", err);
      setNotification(err?.message || "Failed to compile official forms. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Upload individual scanned file
  const handleFileUpload = async (key: keyof PermitFormMatrix, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setActiveUploadingKey(key);
    try {
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
      const sizeStr = file.size > 1024 * 1024 ? `${sizeInMb} MB` : `${Math.round(file.size / 1024)} KB`;

      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = (reader.result as string) || "";
        setUploadedPermitDocs((prev) => ({
          ...prev,
          [key]: {
            fileName: file.name,
            fileSize: sizeStr,
            fileUrl: base64Data,
            uploadedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isDigitallyGenerated: false
          }
        }));
        setActiveUploadingKey(null);
      };
      reader.onerror = () => {
        setActiveUploadingKey(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setActiveUploadingKey(null);
    }
  };

  const handleRemoveDoc = (key: string) => {
    setUploadedPermitDocs((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  return (
    <div className="step-pane animate-fade-in-up">
      {/* STEP 3 HEADER */}
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
            STEP 3 OF 5
          </span>
          <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "600" }}>
            Technical Permitting Stage
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.65rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.35rem 0" }}>
              Permit Forms for {projectType.name}
            </h2>
            <p style={{ margin: 0, color: "#475569", fontSize: "0.92rem", lineHeight: "1.5" }}>
              Based on your approved Locational Clearance, complete the required municipal technical permit forms below.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              fontSize: "0.8rem",
              fontWeight: "800",
              padding: "5px 12px",
              borderRadius: "999px",
              background: areAllMandatorySatisfied ? "#dcfce7" : "#fef3c7",
              color: areAllMandatorySatisfied ? "#15803d" : "#b45309",
              border: areAllMandatorySatisfied ? "1px solid #86efac" : "1px solid #fde68a",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}>
              {areAllMandatorySatisfied ? (
                <>
                  <Check size={14} strokeWidth={3} />
                  All {mandatoryKeys.length} Forms Ready
                </>
              ) : (
                <>
                  <AlertCircle size={14} />
                  {satisfiedKeys.length} / {mandatoryKeys.length} Forms Ready
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* MODE SELECTOR: ONLINE DIGITAL FILL VS UPLOAD SCANS */}
      <div style={{
        background: "#ffffff",
        border: "1.5px solid #e2e8f0",
        borderRadius: "14px",
        padding: "6px",
        marginBottom: "1.5rem",
        display: "inline-flex",
        gap: "6px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
      }}>
        <button
          type="button"
          onClick={() => setInputMode("digital_fill")}
          style={{
            padding: "8px 18px",
            borderRadius: "10px",
            border: "none",
            background: inputMode === "digital_fill" ? "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)" : "none",
            color: inputMode === "digital_fill" ? "#ffffff" : "#475569",
            fontWeight: "700",
            fontSize: "0.85rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            boxShadow: inputMode === "digital_fill" ? "0 4px 12px rgba(79, 70, 229, 0.25)" : "none",
            transition: "all 0.15s ease"
          }}
        >
          <Sparkles size={15} />
          <span>Fill Official Forms Online (Interactive Digital)</span>
        </button>

        <button
          type="button"
          onClick={() => setInputMode("upload_scans")}
          style={{
            padding: "8px 18px",
            borderRadius: "10px",
            border: "none",
            background: inputMode === "upload_scans" ? "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)" : "none",
            color: inputMode === "upload_scans" ? "#ffffff" : "#475569",
            fontWeight: "700",
            fontSize: "0.85rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            boxShadow: inputMode === "upload_scans" ? "0 4px 12px rgba(79, 70, 229, 0.25)" : "none",
            transition: "all 0.15s ease"
          }}
        >
          <Upload size={15} />
          <span>Attach Pre-Printed Signed Forms (PDF)</span>
        </button>
      </div>

      {/* NOTIFICATION BANNER */}
      {notification && (
        <div className="animate-fade-in-up" style={{
          background: areAllMandatorySatisfied ? "#f0fdf4" : "#fef2f2",
          border: areAllMandatorySatisfied ? "1.5px solid #86efac" : "1.5px solid #fca5a5",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: areAllMandatorySatisfied ? "#166534" : "#991b1b"
        }}>
          {areAllMandatorySatisfied ? <CheckCircle2 size={20} color="#16a34a" /> : <AlertCircle size={20} color="#dc2626" />}
          <span style={{ fontSize: "0.9rem", fontWeight: "600" }}>{notification}</span>
          <button 
            type="button" 
            onClick={() => setNotification(null)}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "1.1rem", color: "inherit" }}
          >
            &times;
          </button>
        </div>
      )}

      {/* --- MODE 1: DIGITAL ONLINE FORM BUILDER --- */}
      {inputMode === "digital_fill" && (
        <div style={{
          background: "#ffffff",
          borderRadius: "18px",
          border: "1.5px solid #e2e8f0",
          padding: "1.75rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          marginBottom: "1.5rem"
        }}>
          {/* TABS FOR EACH MANDATORY FORM */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            borderBottom: "1.5px solid #e2e8f0",
            paddingBottom: "1rem",
            marginBottom: "1.5rem"
          }}>
            {mandatoryKeys.map((key) => {
              const meta = PERMIT_FORM_METADATA[key];
              const isSelected = activeTab === key;
              const isDone = Boolean(uploadedPermitDocs[key]);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "10px",
                    border: isSelected ? "1.5px solid #4f46e5" : "1px solid #e2e8f0",
                    background: isSelected ? "#eef2ff" : "#f8fafc",
                    color: isSelected ? "#4338ca" : "#475569",
                    fontWeight: isSelected ? "800" : "600",
                    fontSize: "0.84rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease"
                  }}
                >
                  <span style={{
                    fontSize: "0.68rem",
                    fontWeight: "800",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: isSelected ? "#4338ca" : "#94a3b8",
                    color: "white"
                  }}>
                    {meta.code}
                  </span>
                  <span>{meta.label}</span>
                  {isDone && <CheckCircle2 size={15} color="#16a34a" />}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleGenerateDigitalForms}>
            {/* GENERAL DETAILS SUMMARY (Shared by all forms) */}
            <div style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "1.1rem 1.25rem",
              marginBottom: "1.5rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.1rem"
            }}>
              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  Project Title / Name
                </label>
                <input
                  type="text"
                  value={projectName || `${projectType.name} Installation`}
                  onChange={(e) => setProjectName(e.target.value)}
                  style={{ width: "100%", padding: "8px 11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginTop: "4px", background: "white" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  Project Barangay
                </label>
                <select
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  style={{ width: "100%", padding: "8px 11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginTop: "4px", background: "white" }}
                >
                  {["San Bartolome", "San Matias", "San Vicente", "Santa Ana", "Santo Rosario", "Poblacion", "San Nicolas"].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  Estimated Project Cost (PHP)
                </label>
                <input
                  type="text"
                  value={projectCost || "1,200,000"}
                  onChange={(e) => setProjectCost(e.target.value)}
                  style={{ width: "100%", padding: "8px 11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginTop: "4px", background: "white" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  Zoning Prerequisite
                </label>
                <div style={{
                  marginTop: "4px",
                  padding: "7px 11px",
                  borderRadius: "8px",
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  fontSize: "0.82rem",
                  fontWeight: "700",
                  color: "#065f46",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}>
                  <ShieldCheck size={16} color="#059669" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                    {locationalClearanceRef ? `Approved: ${locationalClearanceRef}` : (isClearanceRequired ? "Stage 1 Approved" : "Zoning Exempt (PD 1096)")}
                  </span>
                </div>
              </div>
            </div>

            {/* TAB CONTENT: MECHANICAL PERMIT */}
            {activeTab === "mechanicalPermit" && (
              <div className="animate-fade-in-up">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Wrench size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
                      Mechanical Permit (MP) — Machinery & Professional Sign-Off
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                      Sto. Tomas OBO Form for Elevators, Escalators, Standby Generators, and Mechanical Machinery
                    </p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      Machinery / Equipment Classification *
                    </label>
                    <input
                      type="text"
                      required
                      value={machineryType}
                      onChange={(e) => setMachineryType(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      Equipment Make / Brand *
                    </label>
                    <input
                      type="text"
                      required
                      value={machineryBrand}
                      onChange={(e) => setMachineryBrand(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      Rated Speed / Velocity *
                    </label>
                    <input
                      type="text"
                      required
                      value={machinerySpeed}
                      onChange={(e) => setMachinerySpeed(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      Rated Load / Capacity *
                    </label>
                    <input
                      type="text"
                      required
                      value={machineryCapacity}
                      onChange={(e) => setMachineryCapacity(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      Drive Motor Power *
                    </label>
                    <input
                      type="text"
                      required
                      value={machineryPower}
                      onChange={(e) => setMachineryPower(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Levels / Storeys Served by Installation *
                  </label>
                  <input
                    type="text"
                    required
                    value={machineryStoreys}
                    onChange={(e) => setMachineryStoreys(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                  />
                </div>

                {/* Professional Mechanical Engineer Sign-Off */}
                <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: "12px", padding: "1.1rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#92400e", textTransform: "uppercase" }}>
                    Design Professional: Professional Mechanical Engineer (PME)
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "0.75rem", marginTop: "8px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#78350f" }}>Engineer Full Name *</label>
                      <input
                        type="text"
                        required
                        value={mechanicalEngineerName}
                        onChange={(e) => setMechanicalEngineerName(e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#78350f" }}>PRC Registration No. *</label>
                      <input
                        type="text"
                        required
                        value={mechanicalEngineerPRC}
                        onChange={(e) => setMechanicalEngineerPRC(e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#78350f" }}>PTR Number *</label>
                      <input
                        type="text"
                        required
                        value={mechanicalEngineerPTR}
                        onChange={(e) => setMechanicalEngineerPTR(e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ELECTRICAL PERMIT */}
            {activeTab === "electricalPermit" && (
              <div className="animate-fade-in-up">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#e0e7ff", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
                      Electrical Permit (EP) — Wiring & Power Feeder Sign-Off
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                      Sto. Tomas OBO Form for Motor Feeder Circuits, Power Connections, and Transformer Loads
                    </p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      Total Connected Power Load *
                    </label>
                    <input
                      type="text"
                      required
                      value={electricalConnectedLoad}
                      onChange={(e) => setElectricalConnectedLoad(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      Service Voltage & Frequency *
                    </label>
                    <input
                      type="text"
                      required
                      value={electricalVoltage}
                      onChange={(e) => setElectricalVoltage(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Main Feeder Line Specifications & Conduit Size *
                  </label>
                  <input
                    type="text"
                    required
                    value={electricalFeeder}
                    onChange={(e) => setElectricalFeeder(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                  />
                </div>

                {/* Professional Electrical Engineer Sign-Off */}
                <div style={{ background: "#eef2ff", border: "1.5px solid #c7d2fe", borderRadius: "12px", padding: "1.1rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#1e40af", textTransform: "uppercase" }}>
                    Design Professional: Professional Electrical Engineer (PEE)
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "0.75rem", marginTop: "8px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#1e3a8a" }}>Engineer Full Name *</label>
                      <input
                        type="text"
                        required
                        value={electricalEngineerName}
                        onChange={(e) => setElectricalEngineerName(e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#1e3a8a" }}>PRC Registration No. *</label>
                      <input
                        type="text"
                        required
                        value={electricalEngineerPRC}
                        onChange={(e) => setElectricalEngineerPRC(e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#1e3a8a" }}>PTR Number *</label>
                      <input
                        type="text"
                        required
                        value={electricalEngineerPTR}
                        onChange={(e) => setElectricalEngineerPTR(e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: BUILDING / CIVIL-STRUCTURAL PERMIT */}
            {(activeTab === "buildingPermit" || activeTab === "civilStructuralPermit") && (
              <div className="animate-fade-in-up">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#dbeafe", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Building size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
                      Building & Civil/Structural Permit (BP/SP)
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                      Unified NBCP Form 1 for General Construction and Structural Framing
                    </p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      Lot Area (sq. m) *
                    </label>
                    <input
                      type="number"
                      required
                      value={lotArea || "200"}
                      onChange={(e) => setLotArea(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      Floor Area (sq. m) *
                    </label>
                    <input
                      type="number"
                      required
                      value={floorArea || "150"}
                      onChange={(e) => setFloorArea(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      Proposed Storeys *
                    </label>
                    <input
                      type="number"
                      required
                      value={proposedStoreys}
                      onChange={(e) => setProposedStoreys(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                    />
                  </div>
                </div>

                <div style={{ background: "#f1f5f9", border: "1.5px solid #cbd5e1", borderRadius: "12px", padding: "1.1rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#334155", textTransform: "uppercase" }}>
                    Design Professional: Civil / Structural Engineer
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.75rem", marginTop: "8px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Civil Engineer Name *</label>
                      <input
                        type="text"
                        required
                        value={civilEngineerName}
                        onChange={(e) => setCivilEngineerName(e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>PRC License No. *</label>
                      <input
                        type="text"
                        required
                        value={civilEngineerPRC}
                        onChange={(e) => setCivilEngineerPRC(e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ARCHITECTURAL PERMIT */}
            {activeTab === "architecturalPermit" && (
              <div className="animate-fade-in-up">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f5f3ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
                      Architectural Permit (AP) — Spatial & Elevation Plans
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                      Architectural drawings, floor plans, sections, and Registered Architect sign-off
                    </p>
                  </div>
                </div>

                <div style={{ background: "#f5f3ff", border: "1.5px solid #ddd6fe", borderRadius: "12px", padding: "1.1rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#6d28d9", textTransform: "uppercase" }}>
                    Design Professional: Registered Architect
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.75rem", marginTop: "8px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#5b21b6" }}>Architect Full Name *</label>
                      <input
                        type="text"
                        required
                        value={architectName}
                        onChange={(e) => setArchitectName(e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#5b21b6" }}>PRC License No. *</label>
                      <input
                        type="text"
                        required
                        value={architectPRC}
                        onChange={(e) => setArchitectPRC(e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SANITARY / PLUMBING PERMIT */}
            {activeTab === "sanitaryPermit" && (
              <div className="animate-fade-in-up">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#ecfeff", color: "#0891b2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Droplets size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
                      Sanitary / Plumbing Permit (PL)
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                      Plumbing layouts, septic tank design, drainage, and Master Plumber sign-off
                    </p>
                  </div>
                </div>

                <div style={{ background: "#ecfeff", border: "1.5px solid #a5f3fc", borderRadius: "12px", padding: "1.1rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#0e7490", textTransform: "uppercase" }}>
                    Design Professional: Master Plumber / Sanitary Engineer
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.75rem", marginTop: "8px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#155e75" }}>Plumber / Engineer Name *</label>
                      <input
                        type="text"
                        required
                        value={masterPlumberName}
                        onChange={(e) => setMasterPlumberName(e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#155e75" }}>PRC License No. *</label>
                      <input
                        type="text"
                        required
                        value={masterPlumberPRC}
                        onChange={(e) => setMasterPlumberPRC(e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: FIRE / BFP CLEARANCE */}
            {activeTab === "fireBfpPermit" && (
              <div className="animate-fade-in-up">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fff1f2", color: "#e11d48", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Flame size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
                      Fire Safety Evaluation Clearance (FSEC / BFP)
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                      Bureau of Fire Protection compliance, fire exits, emergency stop, and extinguishers
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Fire Suppression & Safety Provision Details *
                  </label>
                  <input
                    type="text"
                    required
                    value={fireEgressDetails}
                    onChange={(e) => setFireEgressDetails(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT: SPECIAL / ANCILLARY PERMIT FORMS */}
            {!["mechanicalPermit", "electricalPermit", "buildingPermit", "civilStructuralPermit", "architecturalPermit", "sanitaryPermit", "fireBfpPermit"].includes(activeTab) && (
              <div className="animate-fade-in-up">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#ede9fe", color: "#6d28d9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
                      {PERMIT_FORM_METADATA[activeTab]?.label || activeTab} ({PERMIT_FORM_METADATA[activeTab]?.code})
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                      {PERMIT_FORM_METADATA[activeTab]?.desc || "Official Municipal Permitting Form"}
                    </p>
                  </div>
                </div>

                <div style={{
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "1.25rem",
                  marginBottom: "1rem"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#1e293b" }}>
                      Official Template: {PERMIT_FORM_METADATA[activeTab]?.label}
                    </span>
                    {PERMIT_FORM_METADATA[activeTab]?.templateFile && (
                      <a
                        href={PERMIT_FORM_METADATA[activeTab]?.templateFile}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "0.78rem",
                          color: "#4f46e5",
                          fontWeight: "700",
                          textDecoration: "none"
                        }}
                      >
                        <Download size={13} /> Download Official PDF Template
                      </a>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b", lineHeight: "1.5" }}>
                    This official form will be pre-filled with your applicant credentials (<strong>{applicantName}</strong>), construction site at <strong>{streetAddress}, Brgy. {barangay}</strong>, and scope of work. All official boxes (Box 1 and Box 2) are automatically compiled into your official permit package.
                  </p>
                </div>
              </div>
            )}

            {/* COMPILE / GENERATE ACTION BUTTON */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1.5px solid #e2e8f0",
              paddingTop: "1.25rem",
              marginTop: "1.5rem",
              flexWrap: "wrap",
              gap: "1rem"
            }}>
              <div>
                <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                  Submitting compiles all official municipal forms for <strong>{projectType.name}</strong>.
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {generatedPdfBlob && (
                  <a
                    href={generatedPdfBlob}
                    download={`${projectType.name.replace(/\s+/g, '_')}_Official_Permit_Forms.pdf`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "10px 16px",
                      borderRadius: "10px",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      color: "#334155",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      textDecoration: "none"
                    }}
                  >
                    <Download size={15} color="#4f46e5" /> Download Generated Forms (PDF)
                  </a>
                )}

                <button
                  type="submit"
                  disabled={isGenerating}
                  style={{
                    padding: "11px 24px",
                    borderRadius: "10px",
                    border: "none",
                    background: isGenerating 
                      ? "#94a3b8" 
                      : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                    color: "white",
                    fontWeight: "700",
                    fontSize: "0.92rem",
                    cursor: isGenerating ? "wait" : "pointer",
                    boxShadow: "0 4px 14px rgba(79, 70, 229, 0.3)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <Sparkles size={16} />
                  <span>{isGenerating ? "Compiling Forms..." : "Save & Generate Official Forms"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* --- MODE 2: UPLOAD PRE-PRINTED SIGNED SCANS --- */}
      {inputMode === "upload_scans" && (
        <div style={{
          background: "#ffffff",
          borderRadius: "18px",
          border: "1.5px solid #e2e8f0",
          padding: "1.75rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          marginBottom: "1.5rem"
        }}>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
            Upload Scanned Signed Permit Documents
          </h3>
          <p style={{ margin: "0 0 1.25rem 0", fontSize: "0.85rem", color: "#64748b" }}>
            Download the official blank Sto. Tomas municipal templates below, have them signed and sealed by your PRC-licensed professionals, and upload the scanned copies.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {mandatoryKeys.map((key) => {
              const meta = PERMIT_FORM_METADATA[key];
              const doc = uploadedPermitDocs[key];
              const templatePath = getPermitFormTemplate(key, projectType);
              const isUploading = activeUploadingKey === key;

              return (
                <div
                  key={key}
                  style={{
                    background: doc ? "#f0fdf4" : "#f8fafc",
                    border: doc ? "1.5px solid #86efac" : "1.5px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1rem"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: "800", padding: "2px 6px", borderRadius: "4px", background: "#1e3a8a", color: "white" }}>
                        {meta.code}
                      </span>
                      <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{meta.label}</strong>
                      <span style={{ fontSize: "0.68rem", fontWeight: "800", padding: "2px 8px", borderRadius: "999px", background: doc ? "#dcfce7" : "#fee2e2", color: doc ? "#166534" : "#991b1b" }}>
                        {doc ? "ATTACHED" : "REQUIRED"}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>{meta.desc}</p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {templatePath && (
                      <a
                        href={templatePath}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: "700",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          color: "#334155",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          textDecoration: "none"
                        }}
                      >
                        <Download size={13} color="#4f46e5" /> Blank Template (PDF)
                      </a>
                    )}

                    {doc ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "0.8rem", color: "#166534", fontWeight: "700" }}>✓ {doc.fileName}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(key)}
                          style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "700" }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "7px 14px",
                        borderRadius: "8px",
                        background: isUploading ? "#94a3b8" : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                        color: "white",
                        fontSize: "0.8rem",
                        fontWeight: "700",
                        cursor: isUploading ? "wait" : "pointer"
                      }}>
                        <Upload size={13} />
                        <span>{isUploading ? "Uploading..." : "Attach Signed File"}</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          disabled={isUploading}
                          onChange={(e) => handleFileUpload(key, e)}
                          style={{ display: "none" }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP NAVIGATION FOOTER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderTop: "1px solid #e2e8f0",
        paddingTop: "1.25rem",
        marginTop: "1.5rem"
      }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#475569",
            fontWeight: "700",
            fontSize: "0.88rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <ChevronLeft size={18} />
          <span>Back to Locational Clearance</span>
        </button>

        <button
          type="button"
          onClick={onProceedToMapping}
          disabled={!areAllMandatorySatisfied}
          style={{
            padding: "11px 24px",
            borderRadius: "10px",
            border: "none",
            background: areAllMandatorySatisfied 
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" 
              : "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
            color: "white",
            fontWeight: "800",
            fontSize: "0.92rem",
            cursor: areAllMandatorySatisfied ? "pointer" : "not-allowed",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: areAllMandatorySatisfied ? "0 4px 14px rgba(16, 185, 129, 0.35)" : "none",
            opacity: areAllMandatorySatisfied ? 1 : 0.8
          }}
          title={areAllMandatorySatisfied ? "Proceed to site mapping" : "Please complete the required permit forms above first"}
        >
          <span>
            {areAllMandatorySatisfied 
              ? "Proceed to Step 4: Mapping" 
              : `Step 4: Mapping (${mandatoryKeys.length - satisfiedKeys.length} Forms Pending)`}
          </span>
          {areAllMandatorySatisfied ? <ChevronRight size={18} /> : <Lock size={16} />}
        </button>
      </div>
    </div>
  );
}
