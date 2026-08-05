"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePermitContext } from "../../../../../context/PermitContext";
import { ChevronLeft, CheckCircle2, Clock, Search, AlertTriangle, FileText, CheckCircle } from "lucide-react";

export default function ApplicationTrackDetail() {
  const params = useParams();
  const router = useRouter();
  const { applications } = usePermitContext();
  const [appData, setAppData] = useState<any>(null);

  useEffect(() => {
    if (params.id && applications) {
      const foundApp = applications.find(a => a.id === params.id);
      if (foundApp) {
        setAppData(foundApp);
      }
    }
  }, [params.id, applications]);

  if (!appData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in-up">
        <div className="spinner mb-4" style={{ width: "40px", height: "40px", border: "4px solid rgba(29, 78, 216, 0.2)", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <p className="text-gray-600">Loading application data...</p>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  const getStatusDetails = (status: string) => {
    switch(status) {
      case "pending": return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", icon: Clock, label: "Pending Review", step: 1 };
      case "under_review": return { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)", icon: Search, label: "Under Evaluation", step: 2 };
      case "incomplete_requirements": return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", icon: AlertTriangle, label: "Action Required", step: 2 };
      case "approved": return { color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", icon: CheckCircle2, label: "Approved (Awaiting Payment)", step: 3 };
      case "released": return { color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", icon: CheckCircle, label: "Permit Released", step: 4 };
      default: return { color: "#64748b", bg: "rgba(100, 116, 139, 0.15)", icon: FileText, label: "Unknown", step: 0 };
    }
  };

  const statusConfig = getStatusDetails(appData.status);
  const StatusIcon = statusConfig.icon;

  const timelineSteps = [
    { num: 1, title: "Application Submitted", desc: `Received on ${appData.dateSubmitted}` },
    { num: 2, title: "Document Evaluation", desc: appData.status === "incomplete_requirements" ? "Pending applicant action" : "Verifying attached requirements" },
    { num: 3, title: "Final Approval", desc: "Awaiting signatures from officials" },
    { num: 4, title: "Permit Release", desc: "Ready for pickup / download" }
  ];

  return (
    <div className="dashboard-page animate-fade-in-up">
      <header className="page-header" style={{ marginBottom: "2rem" }}>
        <button onClick={() => router.push("/applicant/dashboard")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontWeight: "600", marginBottom: "1rem", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem" }}>
          <ChevronLeft size={16} /> Back to Dashboard
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className="page-title" style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a" }}>{appData.projectName}</h1>
            <p className="page-subtitle" style={{ fontSize: "1.1rem", marginTop: "0.5rem", color: "#475569" }}>
              Tracking ID: <strong style={{color: "#1e293b"}}>{appData.id}</strong> • {appData.permitType.replace("_", " ")}
            </p>
          </div>
          <span style={{ backgroundColor: statusConfig.bg, color: statusConfig.color, fontWeight: "700", padding: "10px 20px", borderRadius: "30px", display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem" }}>
            <StatusIcon size={20} strokeWidth={2.5} /> {statusConfig.label}
          </span>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "2rem" }}>
        
        {/* Left Column: Timeline */}
        <div className="glass-panel" style={{ padding: "2.5rem", background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e293b", marginBottom: "2rem" }}>Application Timeline</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", position: "relative" }}>
            {/* Connecting line */}
            <div style={{ position: "absolute", left: "20px", top: "20px", bottom: "20px", width: "3px", background: "#e2e8f0", zIndex: 0 }}></div>
            
            {timelineSteps.map((step) => {
              const isActive = statusConfig.step === step.num;
              const isPassed = statusConfig.step > step.num;
              
              let circleColor = "#e2e8f0";
              let iconColor = "#94a3b8";
              
              if (isPassed) {
                circleColor = "#10b981";
                iconColor = "#fff";
              } else if (isActive) {
                circleColor = statusConfig.color;
                iconColor = "#fff";
              }
              
              return (
                <div key={step.num} style={{ display: "flex", gap: "1.5rem", position: "relative", zIndex: 1, opacity: isPassed || isActive ? 1 : 0.5 }}>
                  <div style={{ 
                    width: "40px", height: "40px", borderRadius: "50%", background: circleColor, 
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    boxShadow: isActive ? `0 0 0 4px ${statusConfig.bg}` : "none",
                    transition: "all 0.3s ease"
                  }}>
                    {isPassed ? <CheckCircle size={20} color={iconColor} /> : <span style={{ color: iconColor, fontWeight: "700" }}>{step.num}</span>}
                  </div>
                  <div style={{ paddingTop: "8px" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" }}>{step.title}</h3>
                    <p style={{ color: "#64748b", marginTop: "0.25rem", fontSize: "0.95rem" }}>{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Details & Attachments */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="glass-panel" style={{ padding: "2rem", background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e293b", marginBottom: "1.5rem" }}>Project Details</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <span style={{ display: "block", color: "#64748b", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Applicant</span>
                <span style={{ color: "#0f172a", fontWeight: "600" }}>{appData.applicantName}</span>
              </div>
              <div>
                <span style={{ display: "block", color: "#64748b", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date Submitted</span>
                <span style={{ color: "#0f172a", fontWeight: "600" }}>{appData.dateSubmitted}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "2rem", background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e293b", marginBottom: "1.5rem" }}>Attachments</h2>
            {appData.fileUrl ? (
              <a href={appData.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", border: "1px solid #e2e8f0", borderRadius: "12px", textDecoration: "none", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "#3b82f6"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}>
                <div style={{ background: "#eff6ff", color: "#3b82f6", padding: "10px", borderRadius: "10px" }}>
                  <FileText size={24} />
                </div>
                <div>
                  <span style={{ display: "block", color: "#0f172a", fontWeight: "600" }}>View Uploaded Document</span>
                  <span style={{ display: "block", color: "#64748b", fontSize: "0.85rem", marginTop: "2px" }}>Opens securely in Google Drive</span>
                </div>
              </a>
            ) : (
              <p style={{ color: "#64748b", fontSize: "0.95rem" }}>No files attached to this application.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
