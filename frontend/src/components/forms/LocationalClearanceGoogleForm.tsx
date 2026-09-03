"use client";

import React, { useState } from "react";
import { usePermitContext } from "../../context/PermitContext";
import { generateAnnexDPdf, LocationalClearanceFormData } from "../../utils/annexDPdfGenerator";
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
  Scale, 
  FileCheck 
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function LocationalClearanceGoogleForm({ onCancel }: { onCancel?: () => void }) {
  const router = useRouter();
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

  // Section A: Applicant State
  const [applicantName, setApplicantName] = useState(initialApplicantName);
  const [corporationName, setCorporationName] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("123 Rizal Street, Sto. Tomas, Pampanga");
  const [applicantPhone, setApplicantPhone] = useState("0917 000 4567");
  const [corporationAddress, setCorporationAddress] = useState("");

  // Section B: Project Info State
  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState("Proposed 2-Storey Residence");
  const [streetLocation, setStreetLocation] = useState("");
  const [barangay, setBarangay] = useState("San Matias");
  const [lotArea, setLotArea] = useState("155.00");
  const [bldgArea, setBldgArea] = useState("107.00");
  const [classification, setClassification] = useState("RESIDENTIAL");
  const [siteZoningClass, setSiteZoningClass] = useState("GENERAL RESIDENTIAL ZONE (GRZ)");
  const [rightOverLand, setRightOverLand] = useState("TRANSFER CERTIFICATE OF TITLE (TCT)");

  // Section C: Site Findings State
  const [projectStatus, setProjectStatus] = useState<"Proposed" | "Completed" | "Operational" | "Under Construction">("Proposed");
  const [northAbutting, setNorthAbutting] = useState("GRZ");
  const [southAbutting, setSouthAbutting] = useState("GRZ");
  const [eastAbutting, setEastAbutting] = useState("ROAD");
  const [westAbutting, setWestAbutting] = useState("GRZ");

  // Section D: Sketch of Project Location Image State
  const [sketchImageBase64, setSketchImageBase64] = useState<string | null>(null);
  const [sketchFileName, setSketchFileName] = useState<string>("");
  const [sketchFileSize, setSketchFileSize] = useState<string>("");

  // Section E: Legal Bases State
  const [legalBasis, setLegalBasis] = useState("CLUP_4810");
  const [otherLegalBasis, setOtherLegalBasis] = useState("");
  const [findingFacts, setFindingFacts] = useState(
    "Based on the review of the Comprehensive Land Use Plan (CLUP) and the approved Zoning Ordinance of the Municipality, the subject property is classified under the designated zone. The proposed development is among the allowable uses within the said zone as provided in the zoning regulations."
  );

  // Section F: Conditions Acknowledged State
  const [conditionsAgreed, setConditionsAgreed] = useState(false);

  // Submission & Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState("");
  const [formError, setFormError] = useState("");

  // Handle Image File Upload for Section D
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please upload a valid image file (PNG, JPG, or JPEG) for the sketch attachment.");
      return;
    }

    setSketchFileName(file.name);
    setSketchFileSize((file.size / 1024).toFixed(1) + " KB");

    const reader = new FileReader();
    reader.onload = (event) => {
      setSketchImageBase64(event.target?.result as string);
      setFormError("");
    };
    reader.readAsDataURL(file);
  };

  const removeSketchImage = () => {
    setSketchImageBase64(null);
    setSketchFileName("");
    setSketchFileSize("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !streetLocation.trim() || !applicantName.trim()) {
      setFormError("Please fill out all required fields marked with * in Sections A and B.");
      return;
    }

    if (!conditionsAgreed) {
      setFormError("You must agree to the Additional Conditions in Section F before submitting.");
      return;
    }

    setFormError("");
    setIsGenerating(true);

    try {
      const fullProjectLocation = `${streetLocation}, Brgy. ${barangay}, Sto. Tomas, Pampanga`;
      const submissionDate = new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });

      const formData: LocationalClearanceFormData = {
        applicantName,
        corporationName,
        applicantAddress,
        applicantPhone,
        corporationAddress,
        projectName,
        projectType,
        projectLocation: streetLocation,
        barangay,
        lotArea,
        bldgArea,
        classification,
        siteZoningClass,
        rightOverLand,
        projectStatus,
        northAbutting,
        southAbutting,
        eastAbutting,
        westAbutting,
        submissionDate,
        sketchImageBase64: sketchImageBase64 || undefined,
        legalBases: legalBasis === "CLUP_4810" ? "Resolution No. 4810, Series of 2017" : otherLegalBasis,
        findingFacts,
        additionalConditionsAgreed: conditionsAgreed,
      };

      // 1. Automatically generate/modify ANNEX D - TEMPLATE PDF with user data and pasted Section D image
      const { dataUri, downloadUrl } = await generateAnnexDPdf(formData);
      setGeneratedPdfUrl(downloadUrl);

      // 2. Generate unique Application ID
      const newId = `LC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      setSubmittedAppId(newId);

      // 3. Register application with attached modified ANNEX D PDF in the system
      const newApp: any = {
        id: newId,
        projectName: projectName || "Locational Clearance Application",
        permitType: "locational_clearance",
        status: "pending",
        dateSubmitted: submissionDate,
        applicantName,
        applicantEmail: initialApplicantEmail,
        applicantPhone,
        applicantAddress,
        projectAddress: fullProjectLocation,
        projectDescription: `${projectType} - Classification: ${classification}, Land Right: ${rightOverLand}`,
        fileUrl: dataUri,
        fileName: "ANNEX D - TEMPLATE.pdf",
        sketchImageUrl: sketchImageBase64 || undefined,
        location: {
          lat: 15.0163,
          lng: 120.7188,
          address: fullProjectLocation,
        },
        requirements: [
          {
            name: "ANNEX D - Project Evaluation Report",
            required: true,
            status: "pending",
            fileName: "ANNEX D - TEMPLATE.pdf",
          },
          ...(sketchFileName ? [{
            name: "Section D: Location Sketch & Vicinity Map Attachment",
            required: false,
            status: "approved",
            fileName: sketchFileName,
          }] : []),
        ],
        trackingSteps: [
          {
            title: "Application Submitted",
            status: "completed",
            date: submissionDate,
            notes: "Locational Clearance Form (Sections A through F) with Annex D template submitted online.",
            actor: applicantName,
          },
          {
            title: "Zoning Administration Evaluation",
            status: "current",
            notes: "Pending review and endorsement by MPDC / Zoning Administrator.",
          },
        ],
        historyLog: [
          {
            date: new Date().toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
            action: "Form Submitted",
            actor: applicantName,
            details: `Annex D generated with attached Section D sketch (${sketchFileName || "Default Map"}) and Section F terms agreed.`,
          },
        ],
      };

      addApplication(newApp);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error("PDF Generation error:", err);
      setFormError(err.message || "Failed to generate Annex D template PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // SUCCESS / SUBMISSION SCREEN (Google Forms Style)
  if (isSubmitted) {
    return (
      <div className="gf-wrapper animate-fade-in-up">
        <div className="gf-container">
          <div className="gf-header-banner"></div>
          <div className="gf-card gf-success-card">
            <div className="gf-success-header">
              <div className="gf-check-icon">
                <CheckCircle2 size={40} color="#16a34a" />
              </div>
              <div>
                <h2>Locational Clearance Form (Annex D)</h2>
                <p className="gf-subtitle">Your response has been recorded and submitted to the Admin / Staff.</p>
              </div>
            </div>

            <div className="gf-success-body">
              <div className="gf-info-box">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                  <strong>Reference ID:</strong>
                  <span className="gf-id-badge">{submittedAppId}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                  <strong>Status:</strong>
                  <span style={{ color: "#d97706", fontWeight: "700" }}>Pending Admin Approval</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                  <strong>Generated Document:</strong>
                  <span style={{ color: "#1e3a8a", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                    <FileText size={16} /> ANNEX D - TEMPLATE.pdf
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>Section D Sketch Attachment:</strong>
                  <span style={{ color: "#16a34a", fontWeight: "600" }}>
                    {sketchFileName ? `Embedded (${sketchFileName})` : "Standard Vicinity Map Included"}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: "0.95rem", color: "#475569", margin: "1.25rem 0", lineHeight: "1.5" }}>
                The Municipal Planning and Development Office (MPDO) / Zoning Administrator has received your Annex D Project Evaluation Report with your populated answers, Section D sketch attachment, and legal basis agreement. Once evaluated and approved, you can immediately proceed to apply for your <strong>Building Permit</strong> or <strong>Occupancy Permit</strong>.
              </p>

              <div className="gf-btn-row">
                {generatedPdfUrl && (
                  <a
                    href={generatedPdfUrl}
                    download={`ANNEX_D_TEMPLATE_${applicantName.replace(/\s+/g, "_")}.pdf`}
                    className="gf-btn-primary"
                    style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px" }}
                  >
                    <Download size={18} /> Download Generated Annex D PDF
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => router.push("/applicant/dashboard")}
                  className="gf-btn-secondary"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // GOOGLE FORM STYLE QUESTIONNAIRE
  return (
    <div className="gf-wrapper animate-fade-in-up">
      <div className="gf-container">
        {/* Top Google Forms Purple Banner */}
        <div className="gf-header-banner"></div>

        {/* Title Header Card */}
        <div className="gf-card gf-title-card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.5rem" }}>
            <Building2 size={24} color="#673ab7" />
            <span style={{ fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "#673ab7" }}>
              Municipality of Sto. Tomas, Pampanga
            </span>
          </div>
          <h1 className="gf-title">Locational Clearance Application Form</h1>
          <p className="gf-description">
            Official Municipal Planning & Development Office (MPDO) Zoning Compliance Form.
            Please complete Sections A through F below. When submitted, the system will automatically fill out the official <strong>ANNEX D - PROJECT EVALUATION REPORT</strong> PDF, paste your Section D location sketch, and transmit it directly to the Administrator for approval.
          </p>
          <div className="gf-divider"></div>
          <div className="gf-user-indicator">
            <span>Filing as: <strong>{applicantName}</strong> ({initialApplicantEmail})</span>
            <span className="gf-required-note">* Indicates required question</span>
          </div>
        </div>

        {formError && (
          <div className="gf-card gf-error-card">
            <AlertCircle size={20} color="#dc2626" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* SECTION A: APPLICANT INFORMATION */}
          <div className="gf-section-divider">
            <h3>Section A: Applicant Information</h3>
          </div>

          <div className="gf-card gf-field-card">
            <label className="gf-field-label">
              Name of Applicant (Last, First, Middle) <span className="gf-req">*</span>
            </label>
            <input
              type="text"
              className="gf-input"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              placeholder="e.g. Dela Cruz, Juan M."
              required
            />
          </div>

          <div className="gf-card gf-field-card">
            <label className="gf-field-label">
              Name of Corporation / Business Entity <span className="gf-optional">(Optional)</span>
            </label>
            <p className="gf-field-help">If applying on behalf of a company or registered corporate developer.</p>
            <input
              type="text"
              className="gf-input"
              value={corporationName}
              onChange={(e) => setCorporationName(e.target.value)}
              placeholder="e.g. Dela Cruz Development Corp."
            />
          </div>

          <div className="gf-card gf-field-card">
            <label className="gf-field-label">
              Complete Residential / Office Address of Applicant <span className="gf-req">*</span>
            </label>
            <input
              type="text"
              className="gf-input"
              value={applicantAddress}
              onChange={(e) => setApplicantAddress(e.target.value)}
              placeholder="e.g. 123 Rizal Street, Sto. Tomas, Pampanga"
              required
            />
          </div>

          <div className="gf-card gf-field-card">
            <label className="gf-field-label">
              Telephone / Mobile Contact Number <span className="gf-req">*</span>
            </label>
            <input
              type="text"
              className="gf-input"
              value={applicantPhone}
              onChange={(e) => setApplicantPhone(e.target.value)}
              placeholder="e.g. 0917 123 4567"
              required
            />
          </div>

          {/* SECTION B: PROJECT INFORMATION */}
          <div className="gf-section-divider">
            <h3>Section B: Project Information</h3>
          </div>

          <div className="gf-card gf-field-card">
            <label className="gf-field-label">
              Project Title / Name <span className="gf-req">*</span>
            </label>
            <input
              type="text"
              className="gf-input"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Dela Cruz Family Residence"
              required
            />
          </div>

          <div className="gf-card gf-field-card">
            <label className="gf-field-label">
              Type of Proposed Construction / Structure <span className="gf-req">*</span>
            </label>
            <input
              type="text"
              className="gf-input"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              placeholder="e.g. A Proposed Two-Storey, Three (3) Bedroom Residence"
              required
            />
          </div>

          <div className="gf-card gf-field-card">
            <label className="gf-field-label">
              Project Site Location (Street, Subdivision, Lot & Block) <span className="gf-req">*</span>
            </label>
            <input
              type="text"
              className="gf-input"
              value={streetLocation}
              onChange={(e) => setStreetLocation(e.target.value)}
              placeholder="e.g. Lot 12 Block 4, La Corona Residence"
              required
            />
          </div>

          <div className="gf-card gf-field-card">
            <label className="gf-field-label">
              Barangay in Sto. Tomas, Pampanga <span className="gf-req">*</span>
            </label>
            <select
              className="gf-select"
              value={barangay}
              onChange={(e) => setBarangay(e.target.value)}
              required
            >
              <option value="San Matias">San Matias</option>
              <option value="San Bartolome">San Bartolome</option>
              <option value="Poblacion">Poblacion</option>
              <option value="San Vicente">San Vicente</option>
              <option value="Moras De La Paz">Moras De La Paz</option>
              <option value="Santo Rosario">Santo Rosario (Pau)</option>
              <option value="Santo Niño">Santo Niño (Sapa)</option>
            </select>
          </div>

          <div className="gf-card gf-field-card">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div>
                <label className="gf-field-label">
                  Total Lot Area (sq.m.) <span className="gf-req">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="gf-input"
                  value={lotArea}
                  onChange={(e) => setLotArea(e.target.value)}
                  placeholder="e.g. 155.00"
                  required
                />
              </div>
              <div>
                <label className="gf-field-label">
                  Building Footprint / Area (sq.m.) <span className="gf-req">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="gf-input"
                  value={bldgArea}
                  onChange={(e) => setBldgArea(e.target.value)}
                  placeholder="e.g. 107.00"
                  required
                />
              </div>
            </div>
          </div>

          <div className="gf-card gf-field-card">
            <label className="gf-field-label">
              Project Classification <span className="gf-req">*</span>
            </label>
            <div className="gf-radio-group">
              {[
                { val: "RESIDENTIAL", label: "Residential (Single/Multi-family home, apartment)" },
                { val: "COMMERCIAL", label: "Commercial (Store, office, restaurant, service shop)" },
                { val: "INDUSTRIAL", label: "Industrial (Warehouse, fabrication, logistics)" },
                { val: "INSTITUTIONAL", label: "Institutional (School, clinic, church, community center)" },
                { val: "AGRICULTURAL", label: "Agricultural" },
              ].map((item) => (
                <label key={item.val} className="gf-radio-item">
                  <input
                    type="radio"
                    name="classification"
                    value={item.val}
                    checked={classification === item.val}
                    onChange={() => {
                      setClassification(item.val);
                      setSiteZoningClass(
                        item.val === "COMMERCIAL"
                          ? "GENERAL COMMERCIAL ZONE (GCZ)"
                          : item.val === "INDUSTRIAL"
                          ? "LIGHT INDUSTRIAL ZONE (LIZ)"
                          : "GENERAL RESIDENTIAL ZONE (GRZ)"
                      );
                    }}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="gf-card gf-field-card">
            <label className="gf-field-label">
              Right Over Land / Proof of Ownership <span className="gf-req">*</span>
            </label>
            <div className="gf-radio-group">
              {[
                { val: "TRANSFER CERTIFICATE OF TITLE (TCT)", label: "Transfer Certificate of Title (TCT)" },
                { val: "DEED OF ABSOLUTE SALE", label: "Deed of Absolute Sale" },
                { val: "CONTRACT OF LEASE", label: "Contract of Lease / Tenancy Agreement" },
                { val: "TAX DECLARATION", label: "Tax Declaration with Barangay Certification" },
              ].map((item) => (
                <label key={item.val} className="gf-radio-item">
                  <input
                    type="radio"
                    name="rightOverLand"
                    value={item.val}
                    checked={rightOverLand === item.val}
                    onChange={() => setRightOverLand(item.val)}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* SECTION C: SITE INSPECTION & ADJACENT USES */}
          <div className="gf-section-divider">
            <h3>Section C: Site & Surrounding Land Uses</h3>
          </div>

          <div className="gf-card gf-field-card">
            <label className="gf-field-label">
              Project Status as of Application Date <span className="gf-req">*</span>
            </label>
            <div className="gf-radio-group">
              {[
                { val: "Proposed", label: "Proposed (Construction has not started)" },
                { val: "Under Construction", label: "Under Construction (% Ongoing)" },
                { val: "Completed", label: "Completed (Structure built)" },
                { val: "Operational", label: "Operational (Currently active/occupied)" },
              ].map((item) => (
                <label key={item.val} className="gf-radio-item">
                  <input
                    type="radio"
                    name="projectStatus"
                    value={item.val}
                    checked={projectStatus === item.val}
                    onChange={() => setProjectStatus(item.val as any)}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="gf-card gf-field-card">
            <label className="gf-field-label">
              Existing Land Uses Abutting Boundaries <span className="gf-optional">(Defaults to GRZ & Road)</span>
            </label>
            <p className="gf-field-help">Identify the structures or zoning adjacent to your lot boundaries.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
              <div>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#64748b" }}>North Boundary:</span>
                <input
                  type="text"
                  className="gf-input"
                  value={northAbutting}
                  onChange={(e) => setNorthAbutting(e.target.value)}
                  placeholder="e.g. GRZ / Residential"
                />
              </div>
              <div>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#64748b" }}>South Boundary:</span>
                <input
                  type="text"
                  className="gf-input"
                  value={southAbutting}
                  onChange={(e) => setSouthAbutting(e.target.value)}
                  placeholder="e.g. GRZ / Residential"
                />
              </div>
              <div>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#64748b" }}>East Boundary:</span>
                <input
                  type="text"
                  className="gf-input"
                  value={eastAbutting}
                  onChange={(e) => setEastAbutting(e.target.value)}
                  placeholder="e.g. Road / Alley"
                />
              </div>
              <div>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#64748b" }}>West Boundary:</span>
                <input
                  type="text"
                  className="gf-input"
                  value={westAbutting}
                  onChange={(e) => setWestAbutting(e.target.value)}
                  placeholder="e.g. GRZ / Residential"
                />
              </div>
            </div>
          </div>

          {/* SECTION D: SKETCH OF PROJECT LOCATION & SIGNIFICANT FINDINGS */}
          <div className="gf-section-divider">
            <h3>Section D: Sketch of Project Location (Image Attachment)</h3>
          </div>

          <div className="gf-card gf-field-card">
            <label className="gf-field-label">
              Upload Project Site Sketch / Vicinity Map Image <span className="gf-optional">(Recommended)</span>
            </label>
            <p className="gf-field-help">
              Upload an image of your location sketch, lot vicinity map, or site photo showing the project pin. This image will be automatically pasted into <strong>Section D of the official ANNEX D PDF</strong> passed to the Admin.
            </p>

            {!sketchImageBase64 ? (
              <div 
                style={{
                  border: "2px dashed #b39ddb",
                  borderRadius: "10px",
                  padding: "2rem",
                  textAlign: "center",
                  background: "#faf8fd",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onClick={() => document.getElementById("sketch-file-input")?.click()}
              >
                <UploadCloud size={44} color="#673ab7" style={{ margin: "0 auto 0.75rem auto" }} />
                <p style={{ margin: "0 0 0.5rem 0", fontWeight: "600", color: "#322153", fontSize: "0.95rem" }}>
                  Click to select or drag & drop location sketch image
                </p>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Supports PNG, JPG, or JPEG (Max 10MB)</span>
                <input
                  id="sketch-file-input"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                />
              </div>
            ) : (
              <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ImageIcon size={20} color="#16a34a" />
                    <div>
                      <strong style={{ fontSize: "0.9rem", color: "#0f172a" }}>{sketchFileName}</strong>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "8px" }}>({sketchFileSize})</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeSketchImage}
                    style={{
                      background: "#fee2e2",
                      border: "none",
                      color: "#dc2626",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <X size={14} /> Remove
                  </button>
                </div>

                <div style={{ maxHeight: "240px", overflow: "hidden", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", display: "flex", justifyContent: "center" }}>
                  <img
                    src={sketchImageBase64}
                    alt="Section D Location Sketch Preview"
                    style={{ maxHeight: "240px", width: "auto", objectFit: "contain" }}
                  />
                </div>
                <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.78rem", color: "#166534", fontWeight: "600" }}>
                  ✓ Image verified! This image will be dynamically embedded into Section D of ANNEX D - TEMPLATE.
                </p>
              </div>
            )}
          </div>

          {/* SECTION E: LEGAL BASES & RECOMMENDED DECISION */}
          <div className="gf-section-divider">
            <h3>Section E: Legal Bases & Recommended Decision</h3>
          </div>

          <div className="gf-card gf-field-card">
            <label className="gf-field-label">
              Legal Bases for Zoning Evaluation <span className="gf-req">*</span>
            </label>
            <div className="gf-radio-group">
              <label className="gf-radio-item">
                <input
                  type="radio"
                  name="legalBasis"
                  value="CLUP_4810"
                  checked={legalBasis === "CLUP_4810"}
                  onChange={() => setLegalBasis("CLUP_4810")}
                />
                <span>
                  <strong>[X] CLUP/ZO approved by HLURB/SP per Res.# 4810 Series of 2017</strong>
                  <span style={{ display: "block", fontSize: "0.8rem", color: "#64748b" }}>
                    Standard municipal zoning ordinance of Sto. Tomas, Pampanga
                  </span>
                </span>
              </label>

              <label className="gf-radio-item">
                <input
                  type="radio"
                  name="legalBasis"
                  value="OTHERS"
                  checked={legalBasis === "OTHERS"}
                  onChange={() => setLegalBasis("OTHERS")}
                />
                <span>[ ] Others (specify law, Implementing Rules and Regulations or Guidelines)</span>
              </label>
            </div>

            {legalBasis === "OTHERS" && (
              <input
                type="text"
                className="gf-input"
                style={{ marginTop: "0.75rem" }}
                value={otherLegalBasis}
                onChange={(e) => setOtherLegalBasis(e.target.value)}
                placeholder="Specify law or guidelines..."
                required
              />
            )}
          </div>

          <div className="gf-card gf-field-card">
            <label className="gf-field-label">
              Recommended Decision Formulation
            </label>
            <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.88rem", color: "#334155", lineHeight: "1.5" }}>
              <Scale size={18} color="#673ab7" style={{ marginBottom: "0.25rem" }} />
              <p style={{ margin: "0 0 0.5rem 0" }}>
                <strong>Standard Recommendation:</strong> In view of the foregoing findings and evaluation of facts, it is hereby recommended that the application for Locational Clearance be <strong>APPROVED</strong>, considering that the proposed project is located within a designated <strong>{classification === "COMMERCIAL" ? "Commercial Zone" : "Residential Zone"}</strong> under the approved Comprehensive Land Use Plan (CLUP) and Zoning Ordinance (Resolution No. 4810, Series of 2017).
              </p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                This recommendation is subject to compliance with all other applicable laws, rules, and regulations, and securing required secondary permits.
              </p>
            </div>
          </div>

          <div className="gf-card gf-field-card">
            <label className="gf-field-label">
              Finding and Evaluation of Facts
            </label>
            <textarea
              className="gf-input"
              rows={3}
              value={findingFacts}
              onChange={(e) => setFindingFacts(e.target.value)}
              style={{ lineHeight: "1.4" }}
            />
          </div>

          {/* SECTION F: ADDITIONAL CONDITIONS */}
          <div className="gf-section-divider">
            <h3>Section F: Additional Conditions & Compliance</h3>
          </div>

          <div className="gf-card gf-field-card">
            <label className="gf-field-label" style={{ marginBottom: "0.75rem" }}>
              Municipal Conditions of Approval (Sto. Tomas, Pampanga)
            </label>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem", color: "#334155", lineHeight: "1.45" }}>
              <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px", borderLeft: "3px solid #673ab7" }}>
                <strong>1.</strong> The issuance of a Locational Clearance shall <strong>not be construed as a Building Permit</strong> and shall be used solely for the purpose of securing other required permits and clearances.
              </div>
              <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px", borderLeft: "3px solid #673ab7" }}>
                <strong>2.</strong> Compliance with all applicable laws, rules, and regulations of the LGU and concerned national government agencies (National Building Code, Fire Code, and environmental laws) shall be strictly observed.
              </div>
              <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px", borderLeft: "3px solid #673ab7" }}>
                <strong>3.</strong> Any deviation or modification in the approved plans, use, or scope of the project shall require <strong>prior approval</strong> from the Office of the Zoning Administrator.
              </div>
              <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px", borderLeft: "3px solid #673ab7" }}>
                <strong>4.</strong> The proponent shall secure necessary clearances from concerned agencies: Barangay Clearance, Environmental Compliance (ECC or CNC), and Fire Safety Inspection Certificate.
              </div>
              <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px", borderLeft: "3px solid #673ab7" }}>
                <strong>5.</strong> Development controls and zoning standards, including setbacks, parking requirements, building height limits, and easements, shall be strictly complied with.
              </div>
              <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px", borderLeft: "3px solid #673ab7" }}>
                <strong>6.</strong> No obstruction to public roads, drainage, easements, and utilities shall be allowed during construction and operation.
              </div>
              <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px", borderLeft: "3px solid #673ab7" }}>
                <strong>7.</strong> The clearance may be <strong>REVOKED</strong> if found to have been issued on the basis of misrepresentation or non-compliance with any of the conditions stated herein.
              </div>
            </div>

            <div style={{ marginTop: "1.25rem", padding: "1rem", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: "8px" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={conditionsAgreed}
                  onChange={(e) => setConditionsAgreed(e.target.checked)}
                  style={{ accentColor: "#673ab7", width: "18px", height: "18px", marginTop: "2px" }}
                  required
                />
                <span style={{ fontSize: "0.9rem", color: "#4c1d95", fontWeight: "600" }}>
                  I hereby certify that I have read, understood, and agree to strictly comply with all 7 Additional Conditions stated in Section F. <span className="gf-req">*</span>
                </span>
              </label>
            </div>
          </div>

          {/* Action Bar */}
          <div className="gf-action-bar">
            <button
              type="submit"
              className="gf-submit-btn"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="gf-spinner"></span> Generating Official Annex D PDF...
                </>
              ) : (
                <>
                  <Send size={18} /> Submit Application & Send to Admin
                </>
              )}
            </button>

            {onCancel && (
              <button
                type="button"
                className="gf-cancel-btn"
                onClick={onCancel}
                disabled={isGenerating}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <style jsx>{`
        .gf-wrapper {
          background-color: #f0ebf8;
          min-height: 100vh;
          padding: 2rem 1rem 5rem 1rem;
          font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .gf-container {
          max-width: 680px;
          margin: 0 auto;
        }
        .gf-header-banner {
          height: 12px;
          background: linear-gradient(90deg, #673ab7, #7c4dff);
          border-top-left-radius: 10px;
          border-top-right-radius: 10px;
        }
        .gf-card {
          background: #ffffff;
          border: 1px solid #dadce0;
          border-radius: 8px;
          padding: 1.5rem 1.75rem;
          margin-bottom: 1rem;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          transition: box-shadow 0.2s;
        }
        .gf-card:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        }
        .gf-title-card {
          border-top-left-radius: 0;
          border-top-right-radius: 0;
          border-top: none;
          margin-bottom: 1.25rem;
        }
        .gf-title {
          font-size: 1.85rem;
          font-weight: 700;
          color: #202124;
          margin: 0 0 0.75rem 0;
          line-height: 1.25;
        }
        .gf-description {
          font-size: 0.95rem;
          color: #5f6368;
          line-height: 1.5;
          margin: 0 0 1rem 0;
        }
        .gf-divider {
          height: 1px;
          background: #dadce0;
          margin: 1rem 0;
        }
        .gf-user-indicator {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          color: #5f6368;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .gf-required-note {
          color: #d93025;
          font-weight: 500;
        }
        .gf-section-divider {
          margin: 2rem 0 1rem 0;
          padding-left: 0.5rem;
        }
        .gf-section-divider h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #673ab7;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0;
        }
        .gf-field-card {
          margin-bottom: 1rem;
        }
        .gf-field-label {
          display: block;
          font-size: 1rem;
          font-weight: 600;
          color: #202124;
          margin-bottom: 0.5rem;
        }
        .gf-req {
          color: #d93025;
          margin-left: 3px;
        }
        .gf-optional {
          color: #5f6368;
          font-size: 0.85rem;
          font-weight: 400;
          margin-left: 4px;
        }
        .gf-field-help {
          font-size: 0.82rem;
          color: #70757a;
          margin: -0.25rem 0 0.75rem 0;
        }
        .gf-input, .gf-select {
          width: 100%;
          padding: 0.75rem 0.5rem;
          border: none;
          border-bottom: 1px solid #dadce0;
          font-size: 0.95rem;
          color: #202124;
          outline: none;
          background: transparent;
          transition: border-color 0.2s, background 0.2s;
        }
        .gf-input:focus, .gf-select:focus {
          border-bottom: 2px solid #673ab7;
          background: #faf8fd;
        }
        .gf-radio-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
        .gf-radio-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.95rem;
          color: #3c4043;
          cursor: pointer;
          padding: 0.25rem 0;
        }
        .gf-radio-item input[type="radio"] {
          accent-color: #673ab7;
          width: 18px;
          height: 18px;
        }
        .gf-action-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .gf-submit-btn {
          background: #673ab7;
          color: #ffffff;
          border: none;
          padding: 0.75rem 1.75rem;
          border-radius: 4px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          transition: background 0.2s, transform 0.1s;
        }
        .gf-submit-btn:hover:not(:disabled) {
          background: #5e35b1;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
        }
        .gf-submit-btn:disabled {
          background: #b39ddb;
          cursor: not-allowed;
        }
        .gf-cancel-btn {
          background: transparent;
          color: #5f6368;
          border: 1px solid #dadce0;
          padding: 0.75rem 1.25rem;
          border-radius: 4px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
        }
        .gf-cancel-btn:hover {
          background: #f1f3f4;
        }
        .gf-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: gf-spin 0.8s linear infinite;
        }
        @keyframes gf-spin {
          100% { transform: rotate(360deg); }
        }
        .gf-error-card {
          background: #fef2f2;
          border-color: #fca5a5;
          color: #991b1b;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
        }
        .gf-success-card {
          padding: 2.5rem 2rem;
        }
        .gf-success-header {
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }
        .gf-success-header h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          color: #202124;
        }
        .gf-subtitle {
          margin: 0;
          color: #5f6368;
          font-size: 0.95rem;
        }
        .gf-info-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.25rem;
          font-size: 0.9rem;
        }
        .gf-id-badge {
          background: #dbeafe;
          color: #1e40af;
          padding: 2px 10px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.85rem;
        }
        .gf-btn-row {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          flex-wrap: wrap;
        }
        .gf-btn-primary {
          background: #16a34a;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
        }
        .gf-btn-primary:hover {
          background: #15803d;
        }
        .gf-btn-secondary {
          background: white;
          color: #475569;
          border: 1px solid #cbd5e1;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
        }
        .gf-btn-secondary:hover {
          background: #f8fafc;
        }
      `}</style>
    </div>
  );
}
