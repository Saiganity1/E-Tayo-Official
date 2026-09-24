"use client";

import React, { useState } from "react";
import { usePermitContext } from "../../context/PermitContext";
import { 
  CheckCircle2, 
  Download, 
  FileText, 
  Send, 
  AlertCircle, 
  Building2, 
  UploadCloud, 
  Image as ImageIcon, 
  X, 
  ShieldCheck, 
  Landmark, 
  MapPin, 
  FileCheck,
  ChevronRight,
  ArrowLeft,
  Printer,
  Clock
} from "lucide-react";

import { generateLocationalClearancePdf } from "../../utils/locationalClearancePdfGenerator";

export interface LocationalClearanceFormProps {
  onCancel?: () => void;
  onSuccessWithRef?: (ref: string) => void;
  initialProjectType?: string;
  initialProjectName?: string;
  initialBarangay?: string;
  initialLotArea?: string;
}

export default function LocationalClearanceGoogleForm({ 
  onCancel,
  onSuccessWithRef,
  initialProjectType = "Single-Detached House",
  initialProjectName = "",
  initialBarangay = "San Bartolome",
  initialLotArea = "150"
}: LocationalClearanceFormProps) {
  const { addApplication } = usePermitContext();

  // Get current user if stored
  let initialApplicantName = "Juan Dela Cruz";
  let initialApplicantEmail = "juan.delacruz@email.com";
  try {
    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (userStr) {
      const userObj = JSON.parse(userStr);
      if (userObj.name) initialApplicantName = userObj.name;
      if (userObj.email) initialApplicantEmail = userObj.email;
    }
  } catch (e) {}

  // --- BOXES 1-6: APPLICANT & CORPORATION INFORMATION ---
  const [applicantName, setApplicantName] = useState(initialApplicantName);
  const [corporationName, setCorporationName] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("Poblacion, Sto. Tomas, Pampanga");
  const [applicantPhone, setApplicantPhone] = useState("0917 123 4567");
  const [corporationAddress, setCorporationAddress] = useState("");
  const [corporationPhone, setCorporationPhone] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [representativeAddress, setRepresentativeAddress] = useState("");
  const [representativePhone, setRepresentativePhone] = useState("");

  // --- BOXES 7-12: PROJECT INFORMATION & LAND TENURE ---
  const [projectName, setProjectName] = useState(initialProjectName);
  const [projectType, setProjectType] = useState(initialProjectType);
  const [projectNature, setProjectNature] = useState<"New Development" | "Renovation / Alteration" | "Change of Use" | "Others">("New Development");
  const [natureOthers, setNatureOthers] = useState("");
  const [streetLocation, setStreetLocation] = useState("Purok 3");
  const [barangay, setBarangay] = useState(initialBarangay);
  const [lotArea, setLotArea] = useState(initialLotArea);
  const [bldgArea, setBldgArea] = useState("95");
  const [improvementArea, setImprovementArea] = useState("0");
  const [rightOverLand, setRightOverLand] = useState<"Owner" | "Lease" | "Others">("Owner");
  const [rightOverLandOthers, setRightOverLandOthers] = useState("");
  const [projectTenure, setProjectTenure] = useState<"Permanent" | "Temporary">("Permanent");

  // --- BOXES 13-14: SITE LAND USE & PROJECT COST ---
  const [existingLandUse, setExistingLandUse] = useState<"Residential" | "Commercial" | "Industrial" | "Institutional" | "Agricultural" | "Vacant / Idle" | "Others">("Residential");
  const [landUseOthers, setLandUseOthers] = useState("");
  const [agriculturalCrop, setAgriculturalCrop] = useState("");
  const [isTenanted, setIsTenanted] = useState<"Not tenanted" | "Tenanted">("Not tenanted");
  const [projectCost, setProjectCost] = useState("1,500,000.00");
  const [projectCostWords, setProjectCostWords] = useState("One Million Five Hundred Thousand Pesos Only");

  // --- BOXES 15-17: NOTICES, ACTIONS & MODE OF RELEASE ---
  const [hasWrittenNotice, setHasWrittenNotice] = useState<"No" | "Yes">("No");
  const [noticeOfficer, setNoticeOfficer] = useState("");
  const [noticeOrder, setNoticeOrder] = useState("");
  const [noticeDate, setNoticeDate] = useState("");

  const [hasRelatedAction, setHasRelatedAction] = useState<"No" | "Yes">("No");
  const [relatedOffice, setRelatedOffice] = useState("");
  const [relatedDate, setRelatedDate] = useState("");
  const [relatedActionTaken, setRelatedActionTaken] = useState("");

  const [preferredMode, setPreferredMode] = useState<"Pick-up" | "Mail to Applicant" | "Mail to Representative">("Pick-up");

  // --- BOXES 18-19: CERTIFICATION & SKETCH ATTACHMENT ---
  const [ctcNumber, setCtcNumber] = useState("CTC-2026-0891234");
  const [ctcIssuedAt, setCtcIssuedAt] = useState("Sto. Tomas, Pampanga");
  const [ctcIssuedOn, setCtcIssuedOn] = useState("Jan 15, 2026");
  const [certifiedTruth, setCertifiedTruth] = useState(false);

  // Vicinity map / Sketch file
  const [sketchImageBase64, setSketchImageBase64] = useState<string | null>(null);
  const [sketchFileName, setSketchFileName] = useState<string>("");

  // Form Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState("");
  const [formError, setFormError] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.includes("pdf")) {
      setFormError("Please upload a valid image file (PNG, JPG) or PDF for the vicinity sketch.");
      return;
    }

    setSketchFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSketchImageBase64(event.target?.result as string);
      setFormError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!applicantName.trim()) {
      setFormError("Applicant Name is required.");
      return;
    }
    if (!projectType.trim()) {
      setFormError("Project Type is required.");
      return;
    }
    if (!certifiedTruth) {
      setFormError("You must verify and certify the truthfulness of all statements under oath before submitting.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      const fullProjectLocation = `${streetLocation}, Brgy. ${barangay}, Sto. Tomas, Pampanga`;
      const submissionDate = new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });
      const newId = `LC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Generate the official Sto. Tomas Locational Clearance PDF
      let base64Pdf = "";
      try {
        base64Pdf = await generateLocationalClearancePdf({
          applicationNo: newId,
          submissionDate,
          applicantName,
          applicantAddress,
          applicantPhone,
          applicantEmail: initialApplicantEmail,
          corporationName: corporationName || undefined,
          representativeName: representativeName || undefined,
          representativeAddress: representativeAddress || undefined,
          representativePhone: representativePhone || undefined,
          projectName: projectName.trim() || `${projectType} - Locational Clearance`,
          projectType,
          projectNature,
          projectAddress: fullProjectLocation,
          barangay,
          lotArea,
          bldgArea,
          improvementArea,
          rightOverLand,
          projectTenure,
          existingLandUse,
          isTenanted,
          projectCost,
          projectCostWords,
          hasWrittenNotice,
          noticeOfficer: noticeOfficer || undefined,
          noticeOrder: noticeOrder || undefined,
          noticeDate: noticeDate || undefined,
          hasRelatedAction,
          relatedOffice: relatedOffice || undefined,
          relatedDate: relatedDate || undefined,
          relatedActionTaken: relatedActionTaken || undefined,
          preferredMode,
          ctcNumber,
          ctcIssuedAt,
          ctcIssuedOn,
          sketchImageBase64: sketchImageBase64 || undefined
        });
      } catch (pdfErr) {
        console.warn("Notice: Client PDF generation skipped or fallback:", pdfErr);
      }

      const generatedFileName = `${newId}_${projectType.replace(/\s+/g, '_')}_Locational_Clearance.pdf`;

      const newApp: any = {
        id: newId,
        projectName: projectName.trim() || `${projectType} - Locational Clearance`,
        projectType: projectType.trim(),
        permitType: "locational_clearance",
        status: "pending",
        dateSubmitted: submissionDate,
        applicantName,
        applicantEmail: initialApplicantEmail,
        applicantPhone,
        applicantAddress,
        corporationName: corporationName || undefined,
        representativeName: representativeName || undefined,
        projectAddress: fullProjectLocation,
        projectDescription: `${projectType} (${projectNature}) - Lot: ${lotArea} sq.m, Bldg: ${bldgArea} sq.m. Land Tenure: ${rightOverLand} (${projectTenure}). Land Use: ${existingLandUse}. Cost: Php ${projectCost}`,
        fileUrl: base64Pdf ? `data:application/pdf;base64,${base64Pdf}` : "/templates/LOCATIONAL-CLEARANCE-Sto-Tomas.pdf",
        fileName: generatedFileName,
        sketchImageUrl: sketchImageBase64 || undefined,
        location: {
          lat: 15.0163,
          lng: 120.7188,
          address: fullProjectLocation,
        },
        requirements: [
          {
            name: "Application for Locational Clearance (Sto. Tomas)",
            required: true,
            status: "approved",
            fileName: generatedFileName
          }
        ],
        trackingSteps: [
          { 
            title: "Locational Clearance Submitted", 
            status: "completed", 
            date: submissionDate, 
            notes: "Official Sto. Tomas Application for Locational Clearance received online." 
          },
          { 
            title: "Zoning & MPDO Evaluation", 
            status: "in-progress", 
            notes: "Zoning Administrator verifying compliance with Municipal Land Use Plan (CLUP)." 
          }
        ],
        historyLog: [
          { 
            date: new Date().toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute:"2-digit" }), 
            action: "Locational Clearance Filed", 
            actor: applicantName, 
            details: `Official application submitted for ${projectType}. Generated reference: ${newId}` 
          }
        ]
      };

      addApplication(newApp);
      setSubmittedAppId(newId);
      setIsSubmitted(true);
    } catch (err: any) {
      setFormError(err.message || "Failed to submit Locational Clearance. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- SUBMISSION CONFIRMATION VIEW ---
  if (isSubmitted) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{
          background: "#ffffff",
          borderRadius: "20px",
          border: "1.5px solid #a7f3d0",
          boxShadow: "0 20px 40px -15px rgba(5, 150, 105, 0.15)",
          overflow: "hidden"
        }}>
          {/* Header Banner */}
          <div style={{
            background: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
            color: "white",
            padding: "2rem 2.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1.25rem"
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <CheckCircle2 size={32} />
            </div>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: "800", letterSpacing: "1px", textTransform: "uppercase", opacity: 0.9 }}>
                MUNICIPALITY OF STO. TOMAS, PAMPANGA · MPDO / ZONING DIVISION
              </div>
              <h2 style={{ margin: "0.25rem 0 0 0", fontSize: "1.5rem", fontWeight: "800" }}>
                Locational Clearance Application Received!
              </h2>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "2rem 2.5rem" }}>
            <div style={{
              background: "#f0fdf4",
              border: "1.5px solid #bbf7d0",
              borderRadius: "14px",
              padding: "1.25rem 1.5rem",
              marginBottom: "1.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem"
            }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "#166534", fontWeight: "600" }}>
                  Your Official Clearance Reference Number:
                </span>
                <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#065f46", letterSpacing: "0.5px" }}>
                  {submittedAppId}
                </div>
              </div>
              <span style={{
                background: "#fef3c7",
                color: "#b45309",
                fontWeight: "800",
                fontSize: "0.8rem",
                padding: "4px 12px",
                borderRadius: "999px",
                border: "1px solid #fde68a",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}>
                <Clock size={14} /> Pending Admin Approval
              </span>
            </div>

            <div style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "12px",
              padding: "1.1rem 1.25rem",
              marginBottom: "1.5rem",
              display: "flex",
              gap: "12px",
              alignItems: "flex-start"
            }}>
              <AlertCircle size={22} color="#d97706" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ color: "#92400e", fontSize: "0.92rem", display: "block", marginBottom: "4px" }}>
                  Locational Clearance Must Be Approved Before Other Forms
                </strong>
                <p style={{ color: "#78350f", fontSize: "0.88rem", lineHeight: "1.5", margin: 0 }}>
                  Your <strong>Application for Locational Clearance</strong> for <strong>{projectType}</strong> has been successfully lodged with Reference ID <strong>{submittedAppId}</strong>.
                  <br /><br />
                  Under Sto. Tomas municipal permitting regulations, you must <strong>wait for the Municipal Zoning Administrator / Admin to evaluate and approve your clearance</strong> before you can proceed to fill up the subsequent technical permit forms (Building, Electrical, Mechanical, Sanitary, etc.).
                </p>
              </div>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              flexWrap: "wrap",
              gap: "0.75rem",
              borderTop: "1px solid #e2e8f0",
              paddingTop: "1.5rem"
            }}>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    color: "#475569",
                    padding: "11px 18px",
                    borderRadius: "10px",
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Close
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (onSuccessWithRef) {
                    onSuccessWithRef(submittedAppId);
                  } else if (onCancel) {
                    onCancel();
                  }
                }}
                style={{
                  background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                  color: "white",
                  border: "none",
                  padding: "11px 22px",
                  borderRadius: "10px",
                  fontSize: "0.92rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.3)"
                }}
              >
                <span>Return to Application (Wait for Admin Approval)</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- OFFICIAL FORM VIEW ---
  return (
    <div style={{ maxWidth: "880px", margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* Back Button / Navigation */}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "none",
            border: "none",
            color: "#64748b",
            fontSize: "0.85rem",
            fontWeight: "700",
            cursor: "pointer",
            marginBottom: "1rem"
          }}
        >
          <ArrowLeft size={16} /> Back to Permit Flow
        </button>
      )}

      {/* FORM CARD */}
      <form onSubmit={handleSubmit} style={{
        background: "#ffffff",
        borderRadius: "20px",
        border: "1.5px solid #e2e8f0",
        boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.08)",
        overflow: "hidden"
      }}>
        {/* OFFICIAL MUNICIPAL HEADER */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "white",
          padding: "2rem 2.25rem",
          position: "relative"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.35rem" }}>
                <span style={{
                  background: "rgba(255, 255, 255, 0.18)",
                  padding: "3px 9px",
                  borderRadius: "6px",
                  fontSize: "0.72rem",
                  fontWeight: "800",
                  letterSpacing: "0.5px"
                }}>
                  REPUBLIC OF THE PHILIPPINES
                </span>
                <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: "600" }}>
                  MUNICIPALITY OF STO. TOMAS, PAMPANGA
                </span>
              </div>
              <h1 style={{ margin: "0.25rem 0 0.35rem 0", fontSize: "1.55rem", fontWeight: "900", letterSpacing: "-0.01em" }}>
                APPLICATION FOR LOCATIONAL CLEARANCE
              </h1>
              <p style={{ margin: 0, fontSize: "0.86rem", color: "#cbd5e1" }}>
                Office of the Local Zoning Administrator · Municipal Planning and Development Office (MPDO)
              </p>
            </div>

            <a
              href="/templates/LOCATIONAL-CLEARANCE-Sto-Tomas.pdf"
              download
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                color: "white",
                fontSize: "0.8rem",
                fontWeight: "700",
                textDecoration: "none"
              }}
            >
              <Download size={14} /> Official PDF Form
            </a>
          </div>
        </div>

        {/* ERROR NOTICE */}
        {formError && (
          <div style={{
            background: "#fef2f2",
            borderLeft: "4px solid #ef4444",
            padding: "1rem 1.5rem",
            color: "#b91c1c",
            fontSize: "0.88rem",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>{formError}</span>
          </div>
        )}

        <div style={{ padding: "2rem 2.25rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* --- SECTION 1: APPLICANT & CORPORATION (BOXES 1-6) --- */}
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              paddingBottom: "0.65rem",
              borderBottom: "2px solid #e2e8f0",
              marginBottom: "1.25rem"
            }}>
              <span style={{ background: "#4f46e5", color: "white", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "800" }}>
                1
              </span>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
                Applicant & Corporation Information (Boxes 1–6)
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  1. Name of Applicant (Last, First, Middle) *
                </label>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  2. Name of Corporation (if applicable)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sto. Tomas Realty Corp."
                  value={corporationName}
                  onChange={(e) => setCorporationName(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  3. Address & Telephone of Applicant *
                </label>
                <input
                  type="text"
                  required
                  value={applicantAddress}
                  onChange={(e) => setApplicantAddress(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.88rem", marginBottom: "6px" }}
                />
                <input
                  type="text"
                  placeholder="Applicant Contact Number"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.85rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  4. Address & Telephone of Corporation
                </label>
                <input
                  type="text"
                  placeholder="Corporate Office Address"
                  value={corporationAddress}
                  onChange={(e) => setCorporationAddress(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.88rem", marginBottom: "6px" }}
                />
                <input
                  type="text"
                  placeholder="Corporate Telephone / Landline"
                  value={corporationPhone}
                  onChange={(e) => setCorporationPhone(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.85rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  5. Name of Authorized Representative
                </label>
                <input
                  type="text"
                  placeholder="Full name of representative"
                  value={representativeName}
                  onChange={(e) => setRepresentativeName(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  6. Address & Telephone of Representative
                </label>
                <input
                  type="text"
                  placeholder="Representative Address"
                  value={representativeAddress}
                  onChange={(e) => setRepresentativeAddress(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.88rem", marginBottom: "6px" }}
                />
                <input
                  type="text"
                  placeholder="Representative Contact Number"
                  value={representativePhone}
                  onChange={(e) => setRepresentativePhone(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.85rem" }}
                />
              </div>
            </div>
          </div>

          {/* --- SECTION 2: PROJECT INFO & LAND TENURE (BOXES 7-12) --- */}
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              paddingBottom: "0.65rem",
              borderBottom: "2px solid #e2e8f0",
              marginBottom: "1.25rem"
            }}>
              <span style={{ background: "#4f46e5", color: "white", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "800" }}>
                2
              </span>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
                Project Classification & Tenure (Boxes 7–12)
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  7. Project Type *
                </label>
                <input
                  type="text"
                  required
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.88rem", fontWeight: "600" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  8. Project Nature *
                </label>
                <select
                  value={projectNature}
                  onChange={(e: any) => setProjectNature(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.88rem" }}
                >
                  <option value="New Development">New Development</option>
                  <option value="Renovation / Alteration">Renovation / Alteration</option>
                  <option value="Change of Use">Change of Use</option>
                  <option value="Others">Others (specify)</option>
                </select>
                {projectNature === "Others" && (
                  <input
                    type="text"
                    placeholder="Specify project nature"
                    value={natureOthers}
                    onChange={(e) => setNatureOthers(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.85rem", marginTop: "6px" }}
                  />
                )}
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  9. Project Location (No., Street, Barangay, City/Municipality, Province) *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "0.5rem" }}>
                  <input
                    type="text"
                    placeholder="Purok / Street / Subd."
                    value={streetLocation}
                    onChange={(e) => setStreetLocation(e.target.value)}
                    style={{ padding: "9px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.88rem" }}
                  />
                  <select
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    style={{ padding: "9px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.88rem" }}
                  >
                    {[
                      "Moras Dela Paz",
                      "Poblacion",
                      "San Bartolome",
                      "San Matias",
                      "San Vicente",
                      "Santo Rosario (Pau)",
                      "Sapa (Santo Niño)"
                    ].map(b => <option key={b} value={b}>Brgy. {b}</option>)}
                  </select>
                  <input
                    type="text"
                    disabled
                    value="Sto. Tomas"
                    style={{ padding: "9px 12px", borderRadius: "8px", border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: "0.88rem" }}
                  />
                  <input
                    type="text"
                    disabled
                    value="Pampanga"
                    style={{ padding: "9px 12px", borderRadius: "8px", border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: "0.88rem" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  10. Project Area (in square meters) *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "600" }}>Lot Area</span>
                    <input
                      type="number"
                      placeholder="Lot Area"
                      value={lotArea}
                      onChange={(e) => setLotArea(e.target.value)}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "0.85rem" }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "600" }}>Building</span>
                    <input
                      type="number"
                      placeholder="Bldg Area"
                      value={bldgArea}
                      onChange={(e) => setBldgArea(e.target.value)}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "0.85rem" }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "600" }}>Improvement</span>
                    <input
                      type="number"
                      placeholder="Improvement"
                      value={improvementArea}
                      onChange={(e) => setImprovementArea(e.target.value)}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "0.85rem" }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  11. Right Over Land *
                </label>
                <div style={{ display: "flex", gap: "1rem", marginTop: "8px" }}>
                  {(["Owner", "Lease", "Others"] as const).map(right => (
                    <label key={right} style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.85rem", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="rightOverLand"
                        checked={rightOverLand === right}
                        onChange={() => setRightOverLand(right)}
                      />
                      <span>{right}</span>
                    </label>
                  ))}
                </div>
                {rightOverLand === "Others" && (
                  <input
                    type="text"
                    placeholder="Specify land rights (e.g. Usufruct, Special Power of Attorney)"
                    value={rightOverLandOthers}
                    onChange={(e) => setRightOverLandOthers(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.85rem", marginTop: "6px" }}
                  />
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  12. Project Tenure *
                </label>
                <div style={{ display: "flex", gap: "1.5rem", marginTop: "8px" }}>
                  {(["Permanent", "Temporary"] as const).map(tenure => (
                    <label key={tenure} style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.85rem", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="projectTenure"
                        checked={projectTenure === tenure}
                        onChange={() => setProjectTenure(tenure)}
                      />
                      <span>{tenure}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* --- SECTION 3: EXISTING LAND USE & VALUATION (BOXES 13-14) --- */}
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              paddingBottom: "0.65rem",
              borderBottom: "2px solid #e2e8f0",
              marginBottom: "1.25rem"
            }}>
              <span style={{ background: "#4f46e5", color: "white", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "800" }}>
                3
              </span>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
                Existing Land Use & Project Valuation (Boxes 13–14)
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  13. Existing Land Use of the Project Site *
                </label>
                <select
                  value={existingLandUse}
                  onChange={(e: any) => setExistingLandUse(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.88rem" }}
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Institutional">Institutional</option>
                  <option value="Agricultural">Agricultural (specify crop)</option>
                  <option value="Vacant / Idle">Vacant / Idle</option>
                  <option value="Others">Others</option>
                </select>

                {existingLandUse === "Agricultural" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
                    <input
                      type="text"
                      placeholder="Specify Crop (e.g. Rice, Corn)"
                      value={agriculturalCrop}
                      onChange={(e) => setAgriculturalCrop(e.target.value)}
                      style={{ padding: "8px 10px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "0.85rem" }}
                    />
                    <select
                      value={isTenanted}
                      onChange={(e: any) => setIsTenanted(e.target.value)}
                      style={{ padding: "8px 10px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "0.85rem" }}
                    >
                      <option value="Not tenanted">Not Tenanted</option>
                      <option value="Tenanted">Tenanted</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  14. Project Cost (in Pesos) *
                </label>
                <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                  <span style={{ padding: "9px 12px", background: "#f1f5f9", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontWeight: "700", fontSize: "0.88rem", color: "#475569" }}>
                    Php
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1,500,000.00"
                    value={projectCost}
                    onChange={(e) => setProjectCost(e.target.value)}
                    style={{ flex: 1, padding: "9px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.88rem", fontWeight: "700" }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Cost in words (e.g. One Million Five Hundred Thousand Pesos)"
                  value={projectCostWords}
                  onChange={(e) => setProjectCostWords(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }}
                />
              </div>
            </div>
          </div>

          {/* --- SECTION 4: NOTICES & RELEASE (BOXES 15-17) --- */}
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              paddingBottom: "0.65rem",
              borderBottom: "2px solid #e2e8f0",
              marginBottom: "1.25rem"
            }}>
              <span style={{ background: "#4f46e5", color: "white", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "800" }}>
                4
              </span>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
                Regulatory Notices & Mode of Release (Boxes 15–17)
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Box 15 */}
              <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                  15. Is the project applied for the subject of written notice(s) from this Board or the Local Govt. Unit (LGU) to present or apply for Locational Clearance (LC)?
                </label>
                <div style={{ display: "flex", gap: "1.5rem", marginBottom: "8px" }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.85rem", cursor: "pointer" }}>
                    <input type="radio" name="writtenNotice" checked={hasWrittenNotice === "No"} onChange={() => setHasWrittenNotice("No")} />
                    <span>No</span>
                  </label>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.85rem", cursor: "pointer" }}>
                    <input type="radio" name="writtenNotice" checked={hasWrittenNotice === "Yes"} onChange={() => setHasWrittenNotice("Yes")} />
                    <span>Yes (specify details below)</span>
                  </label>
                </div>
                {hasWrittenNotice === "Yes" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 1fr", gap: "6px", marginTop: "6px" }}>
                    <input
                      type="text"
                      placeholder="Issuing Officer"
                      value={noticeOfficer}
                      onChange={(e) => setNoticeOfficer(e.target.value)}
                      style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                    />
                    <input
                      type="text"
                      placeholder="Order in Notice"
                      value={noticeOrder}
                      onChange={(e) => setNoticeOrder(e.target.value)}
                      style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                    />
                    <input
                      type="text"
                      placeholder="Date of Notice"
                      value={noticeDate}
                      onChange={(e) => setNoticeDate(e.target.value)}
                      style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                    />
                  </div>
                )}
              </div>

              {/* Box 16 */}
              <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                  16. IS THE PROJECT APPLIED FOR THE SUBJECT OF RELATED ACTION(S) WITH OTHER OFFICES OF THE BOARD AND/OR LOCAL GOVERNMENT UNIT?
                </label>
                <div style={{ display: "flex", gap: "1.5rem", marginBottom: "8px" }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.85rem", cursor: "pointer" }}>
                    <input type="radio" name="relatedAction" checked={hasRelatedAction === "No"} onChange={() => setHasRelatedAction("No")} />
                    <span>[X] No</span>
                  </label>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.85rem", cursor: "pointer" }}>
                    <input type="radio" name="relatedAction" checked={hasRelatedAction === "Yes"} onChange={() => setHasRelatedAction("Yes")} />
                    <span>[ ] Yes (Please indicate the following)</span>
                  </label>
                </div>
                {hasRelatedAction === "Yes" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 2fr", gap: "6px", marginTop: "6px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                        Office where similar action(s) was filed
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. MPDO"
                        value={relatedOffice}
                        onChange={(e) => setRelatedOffice(e.target.value)}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                        Date filed
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 01/10/2026"
                        value={relatedDate}
                        onChange={(e) => setRelatedDate(e.target.value)}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                        Actions taken
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. APPROVED"
                        value={relatedActionTaken}
                        onChange={(e) => setRelatedActionTaken(e.target.value)}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Box 17 */}
              <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
                  17. PREFERRED MODE OR RELEASE OF DECISION *
                </label>
                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="preferredMode"
                      checked={preferredMode === "Pick-up"}
                      onChange={() => setPreferredMode("Pick-up")}
                      style={{ accentColor: "#0284c7", width: "16px", height: "16px" }}
                    />
                    <span>{preferredMode === "Pick-up" ? "[X]" : "[ ]"} Pick-up</span>
                  </label>

                  <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", background: "#ffffff", padding: "6px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "#475569" }}>
                      {preferredMode?.startsWith("Mail") ? "[X]" : "[ ]"} By mail, addressed to
                    </span>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.82rem", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="preferredMode"
                        checked={preferredMode === "Mail to Applicant"}
                        onChange={() => setPreferredMode("Mail to Applicant")}
                        style={{ accentColor: "#0284c7" }}
                      />
                      <span>{preferredMode === "Mail to Applicant" ? "[X]" : "[ ]"} Applicant</span>
                    </label>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.82rem", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="preferredMode"
                        checked={preferredMode === "Mail to Representative"}
                        onChange={() => setPreferredMode("Mail to Representative")}
                        style={{ accentColor: "#0284c7" }}
                      />
                      <span>{preferredMode === "Mail to Representative" ? "[X]" : "[ ]"} Authorized Representative</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- SECTION 5: SKETCH & CERTIFICATION (BOXES 18-19) --- */}
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              paddingBottom: "0.65rem",
              borderBottom: "2px solid #e2e8f0",
              marginBottom: "1.25rem"
            }}>
              <span style={{ background: "#4f46e5", color: "white", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "800" }}>
                5
              </span>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
                Vicinity Sketch & Applicant Oath (Boxes 18–19)
              </h3>
            </div>

            {/* Vicinity Sketch Upload */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                Location Sketch / Vicinity Plan (Optional Attachment)
              </label>
              <div style={{
                border: "2px dashed #cbd5e1",
                borderRadius: "12px",
                padding: "1.25rem",
                textAlign: "center",
                background: "#f8fafc"
              }}>
                {sketchFileName ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "#059669", fontWeight: "700", fontSize: "0.85rem" }}>
                    <CheckCircle2 size={18} />
                    <span>Attached: {sketchFileName}</span>
                    <button
                      type="button"
                      onClick={() => { setSketchFileName(""); setSketchImageBase64(null); }}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.8rem" }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <UploadCloud size={28} color="#94a3b8" style={{ marginBottom: "6px" }} />
                    <div style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "6px" }}>
                      Upload site sketch, google map screenshot, or lot plan
                    </div>
                    <label style={{
                      display: "inline-block",
                      padding: "6px 14px",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      color: "#334155",
                      cursor: "pointer"
                    }}>
                      Choose File
                      <input type="file" accept="image/*,.pdf" onChange={handleImageUpload} style={{ display: "none" }} />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Oath and Legal Verification */}
            <div style={{
              background: "#eff6ff",
              border: "1.5px solid #bfdbfe",
              borderRadius: "14px",
              padding: "1.25rem 1.5rem"
            }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  required
                  checked={certifiedTruth}
                  onChange={(e) => setCertifiedTruth(e.target.checked)}
                  style={{ marginTop: "4px" }}
                />
                <div style={{ fontSize: "0.85rem", color: "#1e3a8a", lineHeight: "1.5" }}>
                  <strong>Affidavit of Undertaking & Certification:</strong> I hereby certify that the above statements and information provided in this Application for Locational Clearance are true and correct to the best of my knowledge, and that any misrepresentation shall be sufficient ground for the denial or revocation of this clearance pursuant to municipal zoning laws of Sto. Tomas, Pampanga.
                </div>
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "1rem" }}>
                <input
                  type="text"
                  placeholder="CTC / Valid ID Number"
                  value={ctcNumber}
                  onChange={(e) => setCtcNumber(e.target.value)}
                  style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #93c5fd", fontSize: "0.8rem", background: "white" }}
                />
                <input
                  type="text"
                  placeholder="Issued at"
                  value={ctcIssuedAt}
                  onChange={(e) => setCtcIssuedAt(e.target.value)}
                  style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #93c5fd", fontSize: "0.8rem", background: "white" }}
                />
                <input
                  type="text"
                  placeholder="Date issued"
                  value={ctcIssuedOn}
                  onChange={(e) => setCtcIssuedOn(e.target.value)}
                  style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #93c5fd", fontSize: "0.8rem", background: "white" }}
                />
              </div>
            </div>
          </div>

          {/* FORM ACTION BUTTONS */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            borderTop: "1.5px solid #e2e8f0",
            paddingTop: "1.5rem"
          }}>
            <a
              href="/templates/LOCATIONAL-CLEARANCE-Sto-Tomas.pdf"
              download
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                borderRadius: "10px",
                background: "#f8fafc",
                border: "1.5px solid #cbd5e1",
                color: "#475569",
                fontSize: "0.86rem",
                fontWeight: "700",
                textDecoration: "none"
              }}
            >
              <Download size={15} /> Download Blank Form (PDF)
            </a>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    color: "#475569",
                    padding: "10px 18px",
                    borderRadius: "10px",
                    fontSize: "0.88rem",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                  color: "white",
                  border: "none",
                  padding: "11px 24px",
                  borderRadius: "10px",
                  fontSize: "0.92rem",
                  fontWeight: "800",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(79, 70, 229, 0.3)"
                }}
              >
                {isSubmitting ? (
                  <span>Submitting Application...</span>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Submit Locational Clearance</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
