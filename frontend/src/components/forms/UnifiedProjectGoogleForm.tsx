"use client";

import React, { useState } from "react";
import { ProjectTypeItem, PERMIT_FORM_METADATA, PermitFormMatrix, getRequiredPermitForms, getConditionalPermitForms } from "../../data/projectTypeMatrix";
import { generateUnifiedPermitPdf } from "../../utils/unifiedPermitPdfGenerator";
import { FileText, CheckCircle2, ShieldCheck, User, Building, Wrench, Shield, ArrowRight, X, AlertCircle } from "lucide-react";

interface UnifiedProjectGoogleFormProps {
  projectType: ProjectTypeItem;
  locationalClearanceRef: string;
  initialApplicantName?: string;
  initialApplicantAddress?: string;
  initialApplicantPhone?: string;
  initialProjectName?: string;
  initialBarangay?: string;
  initialLotArea?: string;
  onSubmitSuccess: (application: any) => void;
  onCancel: () => void;
}

export default function UnifiedProjectGoogleForm({
  projectType,
  locationalClearanceRef,
  initialApplicantName = "Juan Dela Cruz",
  initialApplicantAddress = "Sto. Tomas, Pampanga",
  initialApplicantPhone = "0917-123-4567",
  initialProjectName = "",
  initialBarangay = "San Bartolome",
  initialLotArea = "250",
  onSubmitSuccess,
  onCancel
}: UnifiedProjectGoogleFormProps) {
  // 1. Core applicant details
  const [applicantName, setApplicantName] = useState(initialApplicantName);
  const [applicantPhone, setApplicantPhone] = useState(initialApplicantPhone);
  const [applicantEmail, setApplicantEmail] = useState("applicant@etayo.gov.ph");
  const [applicantAddress, setApplicantAddress] = useState(initialApplicantAddress);

  // 2. Project details
  const [projectName, setProjectName] = useState(initialProjectName || `${projectType.name} Construction`);
  const [barangay, setBarangay] = useState(initialBarangay);
  const [streetAddress, setStreetAddress] = useState("Main Highway");
  const [lotNo, setLotNo] = useState("Lot 12");
  const [blockNo, setBlockNo] = useState("Block 4");
  const [tctNo, setTctNo] = useState("TCT-123456");
  const [lotArea, setLotArea] = useState(initialLotArea);
  const [floorArea, setFloorArea] = useState("180");
  const [projectCost, setProjectCost] = useState("2,500,000.00");
  const [proposedStoreys, setProposedStoreys] = useState("2");
  const [scopeOfWork, setScopeOfWork] = useState("New Construction");
  const [occupancyClass, setOccupancyClass] = useState("Group A - Residential");

  // 3. Matrix Permit Selection (Auto-selects all mandatory forms, allows toggling conditionals)
  const mandatoryForms = getRequiredPermitForms(projectType);
  const conditionalForms = getConditionalPermitForms(projectType);
  const [selectedForms, setSelectedForms] = useState<(keyof PermitFormMatrix)[]>([
    ...mandatoryForms,
    ...conditionalForms // Default toggle conditionals for convenience
  ]);

  // 4. Engineering in charge
  const [architectName, setArchitectName] = useState("Arch. Maria Santos");
  const [architectPRC, setArchitectPRC] = useState("PRC-0045211");
  const [civilEngineerName, setCivilEngineerName] = useState("Engr. Roberto Cruz");
  const [civilEngineerPRC, setCivilEngineerPRC] = useState("PRC-0078923");
  const [electricalEngineerName, setElectricalEngineerName] = useState("Engr. Danilo Reyes");
  const [electricalEngineerPRC, setElectricalEngineerPRC] = useState("PRC-0033421");
  const [masterPlumberName, setMasterPlumberName] = useState("Engr. Jose Mendoza");
  const [masterPlumberPRC, setMasterPlumberPRC] = useState("PRC-0012984");

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const toggleForm = (key: keyof PermitFormMatrix) => {
    // Cannot uncheck mandatory forms
    if (mandatoryForms.includes(key)) return;
    if (selectedForms.includes(key)) {
      setSelectedForms(selectedForms.filter(f => f !== key));
    } else {
      setSelectedForms([...selectedForms, key]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const applicationNo = `UNIFIED-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const submissionDate = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

      // Generate the auto-populated official PDF document
      const base64Pdf = await generateUnifiedPermitPdf({
        applicationNo,
        locationalClearanceRef,
        projectType,
        applicantName,
        applicantPhone,
        applicantEmail,
        applicantAddress,
        projectName,
        projectAddress: `${streetAddress}, Brgy. ${barangay}, Sto. Tomas, Pampanga`,
        barangay,
        lotNo,
        blockNo,
        tctNo,
        lotArea,
        floorArea,
        projectCost,
        scopeOfWork,
        occupancyClass,
        proposedStoreys,
        architectName,
        architectPRC,
        civilEngineerName,
        civilEngineerPRC,
        electricalEngineerName,
        electricalEngineerPRC,
        masterPlumberName,
        masterPlumberPRC,
        activePermitForms: selectedForms,
        submissionDate
      });

      const fullAddress = `${streetAddress}, Brgy. ${barangay}, Sto. Tomas, Pampanga`;
      const newApplication: any = {
        id: applicationNo,
        projectName,
        projectType: projectType.name,
        permitType: "building_permit", // Main unified dossier
        locationalClearanceRef,
        status: "pending",
        dateSubmitted: submissionDate,
        applicantName,
        applicantPhone,
        applicantEmail,
        applicantAddress,
        projectAddress: fullAddress,
        projectDescription: `${projectType.name} construction project under unified permit application package.`,
        fileUrl: `data:application/pdf;base64,${base64Pdf}`,
        fileName: `${applicationNo}_${projectType.name.replace(/\s+/g, '_')}_Unified_Permit.pdf`,
        estimatedFees: 3500.0,
        paymentStatus: "unpaid",
        location: {
          lat: 15.0050,
          lng: 120.7100,
          address: fullAddress,
          lotNo,
          blockNo
        },
        requirements: selectedForms.map(formKey => ({
          name: PERMIT_FORM_METADATA[formKey].label,
          required: true,
          status: "approved",
          fileName: `${PERMIT_FORM_METADATA[formKey].code}_auto_generated.pdf`
        })),
        trackingSteps: [
          { title: "Unified Application Filed", status: "completed", date: submissionDate, notes: "Automated NBCP Form 1 dossier compiled and sent to Building Official." },
          { title: "Zoning Prerequisite Checked", status: "completed", date: submissionDate, notes: `Approved under Locational Clearance ${locationalClearanceRef}.` },
          { title: "Engineering & Safety Evaluation", status: "upcoming", notes: "Review by Municipal Building Official, Mechanical, Electrical, and BFP teams." }
        ],
        historyLog: [
          { date: new Date().toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }), action: "Unified Application Submitted", actor: applicantName, details: `Applied for ${projectType.name} with ${selectedForms.length} required permits.` }
        ]
      };

      onSubmitSuccess(newApplication);
    } catch (err: any) {
      console.error("Submission failed:", err);
      setSubmitError(err.message || "An unexpected error occurred while generating the permit form.");
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* GOOGLE FORM TOP BANNER */}
      <div style={{
        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        borderRadius: "16px 16px 0 0",
        height: "12px",
        width: "100%"
      }} />

      {/* HEADER CARD */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderTop: "none",
        borderRadius: "0 0 16px 16px",
        padding: "2rem",
        marginBottom: "1.5rem",
        boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "4px 12px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: "700", marginBottom: "0.75rem" }}>
              <ShieldCheck size={16} color="#059669" />
              Stage 1 Passed: {locationalClearanceRef}
            </div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.5rem 0" }}>
              Unified Permit Application: {projectType.name}
            </h1>
            <p style={{ color: "#475569", fontSize: "0.95rem", lineHeight: "1.5", margin: 0 }}>
              Official National Building Code application for <strong>{projectType.name}</strong> ({projectType.category}). 
              Data filled below will be automatically populated into the official municipal permit forms and submitted to the Office of the Building Official.
            </p>
          </div>
          <button
            onClick={onCancel}
            style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "#64748b" }}
            title="Cancel"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* SECTION 1: PERMIT FORMS MATRIX SELECTION */}
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "1.75rem",
          marginBottom: "1.5rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                Municipal Form Matrix for {projectType.name}
              </h2>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                Based on municipal ordinances, the following forms are required for this project type:
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "0.75rem" }}>
            {(Object.keys(PERMIT_FORM_METADATA) as (keyof PermitFormMatrix)[]).map((key) => {
              const meta = PERMIT_FORM_METADATA[key];
              const level = projectType.matrix[key];
              const isMandatory = level === "required";
              const isConditional = level === "conditional";
              const isNotRequired = level === "not_required";
              const isChecked = selectedForms.includes(key);

              if (isNotRequired) return null;

              return (
                <div
                  key={key}
                  onClick={() => !isMandatory && toggleForm(key)}
                  style={{
                    border: isChecked ? "2px solid #4f46e5" : "1px solid #cbd5e1",
                    background: isChecked ? "#f5f3ff" : "#f8fafc",
                    borderRadius: "12px",
                    padding: "0.85rem 1rem",
                    cursor: isMandatory ? "default" : "pointer",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    transition: "all 0.15s ease"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isMandatory}
                    onChange={() => toggleForm(key)}
                    style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#4f46e5" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "#0f172a" }}>{meta.label}</span>
                      <span style={{
                        fontSize: "0.7rem",
                        fontWeight: "700",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        background: isMandatory ? "#dbeafe" : "#fef3c7",
                        color: isMandatory ? "#1e40af" : "#92400e"
                      }}>
                        {isMandatory ? "Mandatory" : "Conditional"}
                      </span>
                    </div>
                    <p style={{ margin: "3px 0 0 0", fontSize: "0.78rem", color: "#64748b" }}>{meta.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: APPLICANT INFORMATION */}
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "1.75rem",
          marginBottom: "1.5rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={20} />
            </div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              Applicant & Owner Details
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Full Name of Applicant / Owner *
              </label>
              <input
                type="text"
                required
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Contact Number *
              </label>
              <input
                type="text"
                required
                value={applicantPhone}
                onChange={(e) => setApplicantPhone(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Email Address *
              </label>
              <input
                type="email"
                required
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Postal Address *
              </label>
              <input
                type="text"
                required
                value={applicantAddress}
                onChange={(e) => setApplicantAddress(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: BUILDING & SITE SPECIFICATIONS */}
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "1.75rem",
          marginBottom: "1.5rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building size={20} />
            </div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              Project Location & Structural Specifications
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Project Title / Name *
              </label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Barangay *
              </label>
              <select
                value={barangay}
                onChange={(e) => setBarangay(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", background: "white" }}
              >
                {["San Bartolome", "San Matias", "San Vicente", "Santa Ana", "Santo Rosario", "Poblacion", "San Nicolas"].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Lot No.
              </label>
              <input
                type="text"
                value={lotNo}
                onChange={(e) => setLotNo(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Block No.
              </label>
              <input
                type="text"
                value={blockNo}
                onChange={(e) => setBlockNo(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                TCT / OCT No.
              </label>
              <input
                type="text"
                value={tctNo}
                onChange={(e) => setTctNo(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Lot Area (sq. m) *
              </label>
              <input
                type="number"
                required
                value={lotArea}
                onChange={(e) => setLotArea(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Total Floor Area (sq. m) *
              </label>
              <input
                type="number"
                required
                value={floorArea}
                onChange={(e) => setFloorArea(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Proposed Number of Storeys *
              </label>
              <input
                type="number"
                required
                value={proposedStoreys}
                onChange={(e) => setProposedStoreys(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Estimated Project Cost (PHP) *
              </label>
              <input
                type="text"
                required
                value={projectCost}
                onChange={(e) => setProjectCost(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Scope of Work *
              </label>
              <select
                value={scopeOfWork}
                onChange={(e) => setScopeOfWork(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", background: "white" }}
              >
                <option value="New Construction">New Construction</option>
                <option value="Erection">Erection</option>
                <option value="Addition">Addition</option>
                <option value="Alteration">Alteration</option>
                <option value="Renovation">Renovation</option>
                <option value="Conversion">Conversion</option>
                <option value="Repair">Repair</option>
                <option value="Demolition">Demolition</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 4: DESIGN PROFESSIONALS IN CHARGE */}
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "1.75rem",
          marginBottom: "1.5rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#ede9fe", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wrench size={20} />
            </div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              Design Professionals in Charge (PRC Registered)
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Architect
              </label>
              <input
                type="text"
                value={architectName}
                onChange={(e) => setArchitectName(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Architect PRC No.
              </label>
              <input
                type="text"
                value={architectPRC}
                onChange={(e) => setArchitectPRC(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Civil / Structural Engineer
              </label>
              <input
                type="text"
                value={civilEngineerName}
                onChange={(e) => setCivilEngineerName(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Civil Engineer PRC No.
              </label>
              <input
                type="text"
                value={civilEngineerPRC}
                onChange={(e) => setCivilEngineerPRC(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Professional Electrical Engineer
              </label>
              <input
                type="text"
                value={electricalEngineerName}
                onChange={(e) => setElectricalEngineerName(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Electrical Engineer PRC No.
              </label>
              <input
                type="text"
                value={electricalEngineerPRC}
                onChange={(e) => setElectricalEngineerPRC(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
          </div>
        </div>

        {/* SUBMISSION & ERROR ALERT */}
        {submitError && (
          <div style={{ background: "#fef2f2", border: "1px solid #f87171", borderRadius: "12px", padding: "1rem", marginBottom: "1.5rem", color: "#991b1b", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <AlertCircle size={20} />
            <span>{submitError}</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "12px 24px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#475569",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            ← Back to Project Selection
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "14px 32px",
              borderRadius: "10px",
              border: "none",
              background: isSubmitting ? "#94a3b8" : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              color: "#ffffff",
              fontWeight: "700",
              fontSize: "1rem",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              boxShadow: "0 4px 15px rgba(79, 70, 229, 0.3)",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            {isSubmitting ? "Generating Official Permit Forms..." : "Submit Unified Permit Application"}
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </div>
      </form>
    </div>
  );
}
