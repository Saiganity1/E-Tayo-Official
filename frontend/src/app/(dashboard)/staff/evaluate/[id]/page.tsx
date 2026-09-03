"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePermitContext } from "../../../../../context/PermitContext";
import { 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Download, 
  User, 
  MapPin, 
  Calendar, 
  ExternalLink,
  Eye,
  AlertTriangle
} from "lucide-react";

export default function StaffEvaluatePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { applications, updateApplication } = usePermitContext();

  const app = applications.find((a) => a.id === id);

  const [decisionNotes, setDecisionNotes] = useState(
    "In view of the foregoing findings and evaluation of facts, it is hereby recommended that the application for Locational Clearance be APPROVED, considering that the proposed project is located within a designated zone under the approved Comprehensive Land Use Plan (CLUP) and Zoning Ordinance (Resolution No. 4810, Series of 2017)."
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!app) {
    return (
      <div style={{ maxWidth: "600px", margin: "4rem auto", textAlign: "center", padding: "3rem", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <AlertTriangle size={48} color="#f59e0b" style={{ margin: "0 auto 1rem auto" }} />
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a" }}>Application Not Found</h2>
        <p style={{ color: "#64748b", margin: "0.5rem 0 1.5rem 0" }}>
          Could not locate application with ID: <strong>{id}</strong>.
        </p>
        <button onClick={() => router.push("/staff/dashboard")} className="btn-primary">
          <ArrowLeft size={16} /> Return to Staff Dashboard
        </button>
      </div>
    );
  }

  const handleApprove = async () => {
    setIsProcessing(true);

    const updatedTracking = [
      ...(app.trackingSteps || []),
      {
        title: "Locational Clearance Approved",
        status: "completed" as const,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        notes: decisionNotes,
        actor: "Zoning Administrator / MPDC",
      },
    ];

    const updatedHistory = [
      ...(app.historyLog || []),
      {
        date: new Date().toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        action: "Locational Clearance Approved",
        actor: "Zoning Administrator",
        details: decisionNotes,
      },
    ];

    const updatedApp = {
      ...app,
      status: "approved" as const,
      trackingSteps: updatedTracking,
      historyLog: updatedHistory,
      remarks: decisionNotes,
    };

    updateApplication(updatedApp);
    setIsProcessing(false);
    setSuccessMessage(
      `Locational Clearance (${app.id}) has been successfully APPROVED! The applicant now has Stage 1 completed and can proceed to choose a Building Permit or Occupancy Permit.`
    );
  };

  const handleReject = () => {
    setIsProcessing(true);
    const updatedApp = {
      ...app,
      status: "incomplete_requirements" as const,
      remarks: decisionNotes,
    };
    updateApplication(updatedApp);
    setIsProcessing(false);
    setSuccessMessage("Application has been tagged for requirements revision.");
  };

  // Determine PDF source
  const pdfSource = app.fileUrl || "/templates/ANNEX_D_TEMPLATE.pdf";

  return (
    <div className="evaluate-page animate-fade-in-up" style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem 1rem 4rem 1rem" }}>
      {/* Top Header & Breadcrumb */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <button
            onClick={() => router.push("/staff/dashboard")}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem", marginBottom: "0.5rem" }}
          >
            <ArrowLeft size={16} /> Back to Staff Dashboard
          </button>
          <h1 style={{ fontSize: "1.85rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
            Project Evaluation & Approval
          </h1>
          <p style={{ color: "#64748b", margin: "0.25rem 0 0 0", fontSize: "0.95rem" }}>
            Review submitted Annex D evaluation report and zoning compliance.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{
            background: app.status === "approved" ? "#dcfce7" : "#fef3c7",
            color: app.status === "approved" ? "#166534" : "#92400e",
            padding: "6px 14px",
            borderRadius: "999px",
            fontWeight: "700",
            fontSize: "0.85rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Status: {app.status.replace("_", " ")}
          </span>
          <span style={{
            background: "#eff6ff",
            color: "#1e40af",
            padding: "6px 14px",
            borderRadius: "999px",
            fontWeight: "700",
            fontSize: "0.85rem"
          }}>
            {app.id}
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div style={{
          background: "#ecfdf5",
          border: "1px solid #86efac",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "#166534"
        }}>
          <CheckCircle2 size={24} color="#16a34a" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: "0.95rem", fontWeight: "600" }}>{successMessage}</div>
        </div>
      )}

      {/* Main Grid: Left Details, Center PDF, Right Decision */}
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "1.5rem" }}>
        
        {/* LEFT COLUMN: APPLICANT & PROJECT DOSSIER */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ background: "white", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={18} color="#2563eb" /> Applicant Profile
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Full Name</span>
                <strong style={{ color: "#0f172a" }}>{app.applicantName}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Contact Number</span>
                <span>{app.applicantPhone || "N/A"}</span>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Email Address</span>
                <span>{app.applicantEmail || "N/A"}</span>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Registered Address</span>
                <span>{app.applicantAddress || "N/A"}</span>
              </div>
            </div>
          </div>

          <div style={{ background: "white", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <MapPin size={18} color="#2563eb" /> Project Details
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Project Name</span>
                <strong style={{ color: "#0f172a" }}>{app.projectName}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Site Location</span>
                <span>{app.projectAddress || app.location?.address}</span>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Permit Type</span>
                <span style={{ textTransform: "capitalize", fontWeight: "600" }}>{app.permitType.replace("_", " ")}</span>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Date Filed</span>
                <span>{app.dateSubmitted}</span>
              </div>
            </div>
          </div>

          {/* DECISION ACTION PANEL */}
          <div style={{ background: "white", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 15px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={20} color="#16a34a" /> Zoning Recommendation
            </h3>
            
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#475569", marginBottom: "0.4rem" }}>
              Evaluation Findings & Legal Bases:
            </label>
            <textarea
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                color: "#1e293b",
                marginBottom: "1rem",
                lineHeight: "1.4"
              }}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                onClick={handleApprove}
                disabled={isProcessing || app.status === "approved"}
                style={{
                  background: app.status === "approved" ? "#94a3b8" : "#16a34a",
                  color: "white",
                  border: "none",
                  padding: "0.85rem 1.25rem",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  cursor: app.status === "approved" ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 2px 6px rgba(22, 163, 74, 0.3)"
                }}
              >
                <CheckCircle2 size={18} /> 
                {app.status === "approved" ? "Locational Clearance Approved" : "Approve Locational Clearance"}
              </button>

              {app.status !== "approved" && (
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  style={{
                    background: "white",
                    color: "#dc2626",
                    border: "1px solid #fca5a5",
                    padding: "0.65rem 1rem",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <XCircle size={16} /> Request Revisions / Reject
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT / MAIN COLUMN: EMBEDDED ANNEX D PDF VIEWER */}
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: "750px", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
          {/* Document Viewer Header Bar */}
          <div style={{ padding: "1rem 1.5rem", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ background: "#dbeafe", padding: "8px", borderRadius: "8px", color: "#1d4ed8" }}>
                <FileText size={20} />
              </div>
              <div>
                <strong style={{ fontSize: "1rem", color: "#0f172a", display: "block" }}>
                  ANNEX D - PROJECT EVALUATION REPORT
                </strong>
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  Auto-populated official clearance document
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <a
                href={pdfSource}
                download={`ANNEX_D_${app.applicantName.replace(/\s+/g, "_")}.pdf`}
                className="btn-outline"
                style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none" }}
              >
                <Download size={15} /> Download PDF
              </a>
              <a
                href={pdfSource}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none" }}
              >
                <ExternalLink size={15} /> Open in New Tab
              </a>
            </div>
          </div>

          {/* Embedded PDF iframe */}
          <div style={{ flex: 1, position: "relative", background: "#525659", minHeight: "680px" }}>
            <iframe
              src={`${pdfSource}#toolbar=1&navpanes=0`}
              title="ANNEX D - Project Evaluation Report Preview"
              style={{ width: "100%", height: "100%", border: "none", minHeight: "720px" }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
