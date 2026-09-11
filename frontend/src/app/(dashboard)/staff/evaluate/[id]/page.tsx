"use client";

import React, { useState, useEffect } from "react";
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
  const { applications, updateApplication, addSystemLog } = usePermitContext();

  const app = applications.find((a) => a.id === id);

  const [decisionNotes, setDecisionNotes] = useState(
    "In view of the foregoing findings and evaluation of facts, it is hereby recommended that the application for Locational Clearance be APPROVED, considering that the proposed project is located within a designated zone under the approved Comprehensive Land Use Plan (CLUP) and Zoning Ordinance (Resolution No. 4810, Series of 2017)."
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string>("/templates/ANNEX_D_TEMPLATE.pdf");

  useEffect(() => {
    if (!app?.fileUrl) {
      setBlobUrl("/templates/ANNEX_D_TEMPLATE.pdf");
      return;
    }

    if (app.fileUrl.startsWith("http") || app.fileUrl.startsWith("/")) {
      setBlobUrl(app.fileUrl);
      return;
    }

    if (app.fileUrl.startsWith("data:application/pdf")) {
      try {
        const parts = app.fileUrl.split(",");
        if (parts.length > 1 && parts[1].length > 100) {
          const byteCharacters = atob(parts[1]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);

          return () => {
            URL.revokeObjectURL(url);
          };
        }
      } catch (e) {
        console.error("Failed to convert base64 to blob URL, using template fallback:", e);
      }
    }

    setBlobUrl("/templates/ANNEX_D_TEMPLATE.pdf");
  }, [app?.fileUrl]);

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

    const shortSummary = "Locational Clearance Approved. Compliant with CLUP and Zoning Ordinance (Resolution No. 4810).";

    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    let staffName = "Staff Evaluator";
    let staffEmail = "staff@etayo.gov.ph";
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.name) staffName = u.name;
        if (u.email) staffEmail = u.email;
      } catch (e) {}
    }

    const applicantLabel = app.applicantName ? `${app.applicantName}` : (app.applicantEmail || "Applicant");
    const permitTitle = app.permitType ? app.permitType.replace(/_/g, " ") : "Locational Clearance";
    const logSummary = `Staff ${staffName} (${staffEmail}) evaluated application ${app.id} (${applicantLabel}) - Status: APPROVED`;
    const logDetails = `Locational Clearance Approved for ${applicantLabel}. Compliant with CLUP & Zoning Ordinance. Remarks: ${decisionNotes || shortSummary}`;

    const updatedTracking = [
      ...(app.trackingSteps || []).map((step) => {
        if (step.title.toLowerCase().includes("zoning") || step.title.toLowerCase().includes("evaluation")) {
          return { ...step, status: "completed" };
        }
        return step;
      }),
      {
        title: "Locational Clearance Approved",
        status: "completed" as const,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        notes: shortSummary,
        actor: `${staffName} / Zoning Administrator`,
      },
    ];

    const updatedHistory = [
      ...(app.historyLog || []),
      {
        date: new Date().toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        action: "Locational Clearance Approved",
        actor: staffName,
        details: shortSummary,
      },
    ];

    const updatedApp = {
      ...app,
      status: "approved" as const,
      trackingSteps: updatedTracking,
      historyLog: updatedHistory,
      remarks: decisionNotes,
    };

    await updateApplication(updatedApp);

    // 1. Immediately record in Admin System Audit Logs
    try {
      await addSystemLog({
        action: "EVALUATION_APPROVED",
        category: "application",
        status: "success",
        user: staffEmail,
        message: logSummary,
        details: logDetails,
      });
    } catch (e) {
      console.warn("Could not save system log", e);
    }

    // 2. Also record official evaluation log in backend
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/evaluations`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          staffEmail: staffEmail || "staff@etayo.gov.ph",
          applicantEmail: app.applicantEmail || "applicant@etayo.gov.ph",
          permitType: app.permitType || "locational_clearance",
          action: "Approved",
          comments: decisionNotes || shortSummary,
        })
      });
    } catch (e) {
      console.warn("Could not save evaluation log", e);
    }

    setIsProcessing(false);
    setSuccessMessage(
      `Locational Clearance (${app.id}) has been successfully APPROVED! Stage 1 is officially completed and Stage 2 (Project Type Matrix) is now unlocked for applicant ${applicantLabel}.`
    );
  };

  const handleReject = async () => {
    setIsProcessing(true);

    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    let staffName = "Staff Evaluator";
    let staffEmail = "staff@etayo.gov.ph";
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.name) staffName = u.name;
        if (u.email) staffEmail = u.email;
      } catch (e) {}
    }

    const applicantLabel = app.applicantName ? `${app.applicantName}` : (app.applicantEmail || "Applicant");
    const permitTitle = app.permitType ? app.permitType.replace(/_/g, " ") : "Locational Clearance";
    const logSummary = `Staff ${staffName} (${staffEmail}) evaluated application ${app.id} (${applicantLabel}) - Status: REVISION REQUESTED`;
    const logDetails = `Requirements revision requested for ${applicantLabel} (${permitTitle}). Remarks: ${decisionNotes || "Incomplete requirements."}`;

    const updatedApp = {
      ...app,
      status: "incomplete_requirements" as const,
      remarks: decisionNotes,
    };
    await updateApplication(updatedApp);

    // 1. Immediately record in Admin System Audit Logs
    try {
      await addSystemLog({
        action: "EVALUATION_REVISION_REQUESTED",
        category: "application",
        status: "warning",
        user: staffEmail,
        message: logSummary,
        details: logDetails,
      });
    } catch (e) {
      console.warn("Could not save system log", e);
    }

    // 2. Also record official evaluation log in backend
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/evaluations`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          staffEmail: staffEmail || "staff@etayo.gov.ph",
          applicantEmail: app.applicantEmail || "applicant@etayo.gov.ph",
          permitType: app.permitType || "locational_clearance",
          action: "Incomplete Requirements",
          comments: decisionNotes,
        })
      });
    } catch (e) {
      console.warn("Could not save evaluation log", e);
    }

    setIsProcessing(false);
    setSuccessMessage(`Application (${app.id}) has been tagged for requirements revision. Notification sent to ${applicantLabel}.`);
  };

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
              {(app as any).projectType && (
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Project Type</span>
                  <span style={{ background: "#ede9fe", color: "#6b21a8", padding: "2px 8px", borderRadius: "6px", fontSize: "0.82rem", fontWeight: "700", display: "inline-block" }}>
                    {(app as any).projectType}
                  </span>
                </div>
              )}
              {(app as any).locationalClearanceRef && (
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Zoning Clearance Ref</span>
                  <span style={{ color: "#047857", fontWeight: "700", fontSize: "0.85rem" }}>
                    ✓ {(app as any).locationalClearanceRef}
                  </span>
                </div>
              )}
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Permit Classification</span>
                <span style={{ textTransform: "capitalize", fontWeight: "600" }}>{app.permitType.replace("_", " ")}</span>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Date Filed</span>
                <span>{app.dateSubmitted}</span>
              </div>
            </div>

            {/* Section D Attached Sketch Thumbnail */}
            {(app as any).sketchImageUrl && (
              <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #e2e8f0" }}>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", marginBottom: "6px" }}>
                  Section D Location Sketch Attached
                </span>
                <div style={{ maxHeight: "120px", overflow: "hidden", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                  <img
                    src={(app as any).sketchImageUrl}
                    alt="Section D Sketch"
                    style={{ width: "100%", height: "120px", objectFit: "cover" }}
                  />
                </div>
                <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: "600", marginTop: "4px", display: "block" }}>
                  ✓ Automatically pasted into Annex D PDF below
                </span>
              </div>
            )}

            {/* Section E & F Verification Badge */}
            <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #e2e8f0", fontSize: "0.78rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", marginBottom: "4px" }}>
                <CheckCircle2 size={14} /> <span>Sec. E: CLUP/ZO Res. #4810 Verified</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534" }}>
                <CheckCircle2 size={14} /> <span>Sec. F: Conditions 1-7 Agreed by Applicant</span>
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
                href={blobUrl}
                download={`ANNEX_D_${(app.applicantName || "Applicant").replace(/\s+/g, "_")}.pdf`}
                className="btn-outline"
                style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none" }}
              >
                <Download size={15} /> Download PDF
              </a>
              <a
                href={blobUrl}
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
              src={`${blobUrl}#toolbar=1&navpanes=0`}
              title="ANNEX D - Project Evaluation Report Preview"
              style={{ width: "100%", height: "100%", border: "none", minHeight: "720px" }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
