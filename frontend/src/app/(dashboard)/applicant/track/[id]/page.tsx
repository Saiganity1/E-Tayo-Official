"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePermitContext } from "../../../../../context/PermitContext";
import { ChevronLeft, CheckCircle2, Clock, Search, AlertTriangle, FileText, CheckCircle, XCircle } from "lucide-react";

export default function ApplicationTrackDetail() {
  const params = useParams();
  const router = useRouter();
  const { applications, cancelApplication } = usePermitContext();
  const [appData, setAppData] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Change of project plans");
  const [isCancelling, setIsCancelling] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
    ? `${process.env.NEXT_PUBLIC_API_URL}/api` 
    : "http://localhost:8080/api";

  useEffect(() => {
    // 1. Initial check from context or local cache
    if (params.id) {
      if (applications && applications.length > 0) {
        const found = applications.find(a => a.id === params.id);
        if (found) setAppData(found);
      } else {
        try {
          const cachedStr = localStorage.getItem("etayo_cached_applications");
          if (cachedStr) {
            const cachedList = JSON.parse(cachedStr);
            const found = cachedList.find((a: any) => a.id === params.id);
            if (found) setAppData(found);
          }
        } catch (e) {}
      }
    }

    // 2. Fetch fresh live data directly from server
    const fetchFreshStatus = async () => {
      if (!params.id) return;
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers: Record<string, string> = { "Accept": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE_URL}/permits/${params.id}`, { headers });
        if (res.ok) {
          const serverApp = await res.json();
          if (serverApp && serverApp.id) {
            setAppData(serverApp);
          }
        }
      } catch (e) {
        // network error or offline fallback
      }
    };

    fetchFreshStatus();

    // 3. Live polling every 3 seconds to auto-detect admin approval without manual refresh
    const pollTimer = setInterval(fetchFreshStatus, 3000);

    return () => clearInterval(pollTimer);
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
      case "cancelled": return { color: "#dc2626", bg: "rgba(220, 38, 38, 0.15)", icon: XCircle, label: "Cancelled by Applicant", step: 0 };
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
        <button onClick={() => router.push("/applicant/track")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontWeight: "600", marginBottom: "1rem", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem" }}>
          <ChevronLeft size={16} /> Back to Tracker
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className="page-title" style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a" }}>{appData.projectName}</h1>
            <p className="page-subtitle" style={{ fontSize: "1.1rem", marginTop: "0.5rem", color: "#475569" }}>
              Tracking ID: <strong style={{color: "#1e293b"}}>{appData.id}</strong> • {appData.permitType.replace("_", " ")}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {appData.status !== "cancelled" && appData.status !== "released" && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #fca5a5",
                  color: "#b91c1c",
                  padding: "8px 16px",
                  borderRadius: "12px",
                  fontWeight: "700",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 6px rgba(220, 38, 38, 0.1)"
                }}
              >
                <XCircle size={15} color="#dc2626" /> Cancel Application
              </button>
            )}
            <span style={{ backgroundColor: statusConfig.bg, color: statusConfig.color, fontWeight: "700", padding: "10px 20px", borderRadius: "30px", display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem" }}>
              <StatusIcon size={20} strokeWidth={2.5} /> {statusConfig.label}
            </span>
          </div>
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
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {appData.fileUrl.split(',').map((url: string, idx: number) => (
                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", border: "1px solid #e2e8f0", borderRadius: "12px", textDecoration: "none", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "#3b82f6"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}>
                    <div style={{ background: "#eff6ff", color: "#3b82f6", padding: "10px", borderRadius: "10px" }}>
                      <FileText size={24} />
                    </div>
                    <div>
                      <span style={{ display: "block", color: "#0f172a", fontWeight: "600" }}>Document {idx + 1}</span>
                      <span style={{ display: "block", color: "#64748b", fontSize: "0.85rem", marginTop: "2px" }}>Opens securely in Google Drive</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p style={{ color: "#64748b", fontSize: "0.95rem" }}>No files attached to this application.</p>
            )}
          </div>
        </div>
      </div>

      {/* CANCEL CONFIRMATION MODAL */}
      {showCancelModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(6px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "20px",
            maxWidth: "520px",
            width: "100%",
            padding: "2rem",
            boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.25rem" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", color: "#0f172a" }}>
                  Cancel Permit Application?
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  Ref ID: <strong style={{ color: "#1e293b" }}>{appData.id}</strong> • {appData.projectName || "Permit Application"}
                </p>
              </div>
            </div>

            <p style={{ fontSize: "0.92rem", color: "#475569", lineHeight: "1.6", margin: "0 0 1.25rem 0" }}>
              Are you sure you want to cancel this application? Once cancelled, municipal evaluation will be stopped. The record will remain archived in your Application Status as <strong>Cancelled</strong>.
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                Reason for Cancellation:
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.88rem",
                  color: "#1e293b",
                  background: "#f8fafc",
                  outline: "none"
                }}
              >
                <option value="Change of project plans">Change of project plans / design modifications</option>
                <option value="Duplicate submission">Accidental duplicate submission</option>
                <option value="Project postponed / cancelled">Project postponed or delayed indefinitely</option>
                <option value="Incorrect information provided">Incorrect project details entered</option>
                <option value="Other municipal requirements">Other reasons</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: "700",
                  fontSize: "0.88rem",
                  cursor: "pointer"
                }}
              >
                Keep Application
              </button>

              <button
                type="button"
                disabled={isCancelling}
                onClick={async () => {
                  setIsCancelling(true);
                  try {
                    await cancelApplication(appData.id, cancelReason);
                    setAppData((prev: any) => prev ? { ...prev, status: "cancelled", remarks: cancelReason } : null);
                    setShowCancelModal(false);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsCancelling(false);
                  }
                }}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                  color: "#ffffff",
                  fontWeight: "800",
                  fontSize: "0.88rem",
                  cursor: isCancelling ? "wait" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)"
                }}
              >
                <XCircle size={16} />
                <span>{isCancelling ? "Cancelling..." : "Confirm Cancellation"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
