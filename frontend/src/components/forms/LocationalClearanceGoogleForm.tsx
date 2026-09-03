"use client";

import React, { useState } from "react";
import { usePermitContext } from "../../context/PermitContext";
import { generateAnnexDPdf, LocationalClearanceFormData } from "../../utils/annexDPdfGenerator";
import { CheckCircle2, Download, FileText, Send, AlertCircle, ArrowLeft, Building2 } from "lucide-react";
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

  // Form State
  const [applicantName, setApplicantName] = useState(initialApplicantName);
  const [corporationName, setCorporationName] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("123 Rizal Street, Sto. Tomas, Pampanga");
  const [applicantPhone, setApplicantPhone] = useState("0917 000 4567");
  const [corporationAddress, setCorporationAddress] = useState("");

  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState("Proposed 2-Storey Residence");
  const [streetLocation, setStreetLocation] = useState("");
  const [barangay, setBarangay] = useState("San Matias");
  const [lotArea, setLotArea] = useState("155.00");
  const [bldgArea, setBldgArea] = useState("107.00");
  const [classification, setClassification] = useState("RESIDENTIAL");
  const [siteZoningClass, setSiteZoningClass] = useState("GENERAL RESIDENTIAL ZONE (GRZ)");
  const [rightOverLand, setRightOverLand] = useState("TRANSFER CERTIFICATE OF TITLE (TCT)");
  const [projectStatus, setProjectStatus] = useState<"Proposed" | "Completed" | "Operational" | "Under Construction">("Proposed");

  const [northAbutting, setNorthAbutting] = useState("GRZ");
  const [southAbutting, setSouthAbutting] = useState("GRZ");
  const [eastAbutting, setEastAbutting] = useState("ROAD");
  const [westAbutting, setWestAbutting] = useState("GRZ");

  // Submission & Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState("");
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !streetLocation.trim() || !applicantName.trim()) {
      setFormError("Please fill out all required fields marked with *.");
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
      };

      // 1. Automatically generate/modify ANNEX D - TEMPLATE PDF
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
        ],
        trackingSteps: [
          {
            title: "Application Submitted",
            status: "completed",
            date: submissionDate,
            notes: "Locational Clearance Form and auto-generated Annex D submitted online.",
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
            details: "Form completed in Google Forms style. Annex D auto-populated and queued for Admin review.",
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
                <CheckCircle2 size={36} color="#16a34a" />
              </div>
              <div>
                <h2>Locational Clearance Form (Annex D)</h2>
                <p className="gf-subtitle">Your response has been recorded and submitted to the Admin.</p>
              </div>
            </div>

            <div className="gf-success-body">
              <div className="gf-info-box">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <strong>Reference ID:</strong>
                  <span className="gf-id-badge">{submittedAppId}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <strong>Status:</strong>
                  <span style={{ color: "#d97706", fontWeight: "700" }}>Pending Admin Approval</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>Generated Document:</strong>
                  <span style={{ color: "#1e3a8a", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                    <FileText size={16} /> ANNEX D - TEMPLATE.pdf
                  </span>
                </div>
              </div>

              <p style={{ fontSize: "0.9rem", color: "#475569", margin: "1.25rem 0" }}>
                The Municipal Planning and Development Coordinator (MPDC) / Zoning Administrator has received your application with the populated Annex D report. Once evaluated and approved, you will be notified and can immediately proceed to apply for a <strong>Building Permit</strong> or <strong>Occupancy Permit</strong>.
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
            Please fill in your project details below. When submitted, the system will automatically fill out the official <strong>ANNEX D - PROJECT EVALUATION REPORT</strong> PDF and transmit it directly to the Municipal Administrator for review and approval.
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
              Existing Land Uses Abutting Boundaries <span className="gf-optional">(Optional / Defaults to GRZ & Road)</span>
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
