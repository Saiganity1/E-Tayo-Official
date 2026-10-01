"use client";

import React, { useEffect, useState } from "react";
import { 
  Users, Shield, ShieldAlert, AlertTriangle, X, FileText, CheckCircle, 
  XCircle, UserCheck, Clock, Building2, ExternalLink 
} from "lucide-react";
import Link from "next/link";
import { usePermitContext } from "../../../../context/PermitContext";
import { formatPhilippineDateTime } from "@/utils/philippineTime";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface EvaluationLog {
  id: string | number;
  permitId?: string;
  projectName?: string;
  staffEmail: string;
  applicantEmail: string;
  applicantName?: string;
  permitType: string;
  action: string;
  comments: string;
  timestamp: string;
  evaluatorName?: string;
}

const isDummyRecord = (item: any): boolean => {
  if (!item) return true;
  const staff = String(item.staffEmail || item.evaluatorEmail || item.user || "").toLowerCase();
  const applicant = String(item.applicantEmail || item.user || "").toLowerCase();
  const id = String(item.id || item.permitId || "");
  if (applicant.includes("citizen@example.com") || applicant.includes("business@example.com")) return true;
  if (id.startsWith("LOG-SYS-BASE-") || id === "LOG-SYS-01" || id === "LOG-SYS-02") return true;
  return false;
};

export default function AdminStaffPage() {
  const { applications, systemLogs } = usePermitContext();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal State
  const [selectedStaff, setSelectedStaff] = useState<UserData | null>(null);
  const [logs, setLogs] = useState<EvaluationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("token");
      let res = await fetch("/api/users?role=ROLE_STAFF", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      }).catch(() => null);

      if (!res || !res.ok) {
        const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
        res = await fetch(`${rawApi}/api/users?role=ROLE_STAFF`, {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        }).catch(() => null);
      }
      
      if (!res || !res.ok) throw new Error("Failed to fetch staff");
      
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openAuditLogs = async (staff: UserData) => {
    setSelectedStaff(staff);
    setLoadingLogs(true);
    setLogs([]);

    const staffNameClean = (staff.name || "").trim().toLowerCase();
    const staffEmailClean = (staff.email || "").trim().toLowerCase();

    const gatheredLogs: EvaluationLog[] = [];

    // 1. Fetch from Next.js proxy / backend evaluation logs endpoint
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      let res = await fetch(`/api/evaluations/staff/${encodeURIComponent(staff.email)}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      }).catch(() => null);

      if (!res || !res.ok) {
        const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
        res = await fetch(`${rawApi}/api/evaluations/staff/${encodeURIComponent(staff.email)}`, {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        }).catch(() => null);
      }
      
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            if (!isDummyRecord(item)) {
              gatheredLogs.push({
                id: item.id || `eval-api-${Date.now()}-${Math.random()}`,
                permitId: item.applicationId || item.permitId,
                projectName: item.projectName,
                staffEmail: item.staffEmail || staff.email,
                applicantEmail: item.applicantEmail || "applicant@etayo.gov.ph",
                applicantName: item.applicantName,
                permitType: item.permitType || "Permit Evaluation",
                action: item.action || "Approved",
                comments: item.comments || "Evaluation recorded.",
                timestamp: item.timestamp || new Date().toISOString(),
                evaluatorName: staff.name
              });
            }
          });
        }
      }
    } catch (err: any) {
      console.error("Error fetching evaluations for staff", err);
    }

    // 2. Cross-reference all evaluated applications in state matching this staff member
    (applications || []).forEach(app => {
      if (!app || !app.id) return;
      const appEvaluator = (app.evaluatedBy || "").trim().toLowerCase();
      const appAssigned = (app.assignedStaff || "").trim().toLowerCase();
      const appEvalEmail = (app.evaluatorEmail || "").trim().toLowerCase();

      const isEvaluatedByStaff = 
        appEvaluator === staffNameClean ||
        appAssigned === staffNameClean ||
        appEvalEmail === staffEmailClean ||
        (Array.isArray(app.historyLog) && app.historyLog.some(h => 
          (h.actor && h.actor.toLowerCase().includes(staffNameClean)) ||
          (h.actor && h.actor.toLowerCase().includes(staffEmailClean))
        ));

      if (isEvaluatedByStaff) {
        const isApproved = app.status === "approved" || app.status === "released";
        const isRejected = app.status === "rejected";
        const actionLabel = isApproved ? "Approved" : (isRejected ? "Disapproved" : "Revision Requested");
        const evalTime = app.evaluatedAt || (app as any).dateApproved || (app as any).dateIssued || app.dateSubmitted || new Date().toISOString();

        gatheredLogs.push({
          id: `APP-EVAL-${app.id}`,
          permitId: app.id,
          projectName: app.projectName || app.projectType || "Permit Project",
          staffEmail: staff.email,
          applicantEmail: app.applicantEmail || "applicant@etayo.gov.ph",
          applicantName: app.applicantName,
          permitType: app.permitType ? app.permitType.replace(/_/g, " ").toUpperCase() : "CLEARANCE",
          action: actionLabel,
          comments: app.remarks || `Locational and technical evaluation completed by ${staff.name} for ${app.id}.`,
          timestamp: evalTime,
          evaluatorName: staff.name
        });
      }
    });

    // 3. Cross-reference system audit logs attributed to this staff member
    (systemLogs || []).forEach(log => {
      if (!log || isDummyRecord(log)) return;
      const logUser = (log.user || "").trim().toLowerCase();
      const logEmail = (log.userEmail || "").trim().toLowerCase();
      const logMsg = (log.message || "").toLowerCase();
      const logDet = (log.details || "").toLowerCase();

      const matchesStaff = 
        logUser === staffNameClean ||
        logUser === staffEmailClean ||
        logEmail === staffEmailClean ||
        logMsg.includes(staffNameClean) ||
        logDet.includes(staffNameClean);

      const isEvalAction = 
        (log.action || "").includes("EVALUAT") || 
        (log.action || "").includes("APPROV") || 
        (log.action || "").includes("REJECT") || 
        (log.action || "").includes("REVISION");

      if (matchesStaff && isEvalAction) {
        const isApproved = (log.action || "").includes("APPROV") || log.status === "success";
        const isRejected = (log.action || "").includes("REJECT") || log.status === "error";
        const actionLabel = isApproved ? "Approved" : (isRejected ? "Disapproved" : "Revision Requested");

        // Try to match permit ID
        const refMatch = (log.message + " " + (log.details || "")).match(/\b(LC-\d{4}-\d+|BP-\d{4}-\d+|APP-\d{4}-\d+)\b/i);
        const permitId = refMatch ? refMatch[1] : undefined;

        gatheredLogs.push({
          id: `SYS-LOG-${log.id}`,
          permitId,
          projectName: log.message,
          staffEmail: staff.email,
          applicantEmail: log.userEmail || "applicant@etayo.gov.ph",
          permitType: "Official Evaluation",
          action: actionLabel,
          comments: log.details || log.message,
          timestamp: log.timestamp,
          evaluatorName: staff.name
        });
      }
    });

    // Deduplicate logs by permitId or ID
    const logMap = new Map<string, EvaluationLog>();
    gatheredLogs.forEach(l => {
      const key = l.permitId ? `${l.permitId}-${l.action}` : String(l.id);
      if (!logMap.has(key)) {
        logMap.set(key, l);
      }
    });

    const finalLogs = Array.from(logMap.values()).sort((a, b) => {
      const tA = new Date(a.timestamp || 0).getTime();
      const tB = new Date(b.timestamp || 0).getTime();
      return tB - tA;
    });

    setLogs(finalLogs);
    setLoadingLogs(false);
  };

  const getRoleBadge = (role: string) => {
    return <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "4px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}><Shield size={14} /> Staff</span>;
  };

  return (
    <>
      <div className="dashboard-page animate-fade-in-up" style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "3rem" }}>
        <header className="page-header" style={{ marginBottom: "2rem" }}>
          <h1 className="page-title" style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <ShieldAlert size={32} color="#1d4ed8" /> Staff Management
          </h1>
          <p className="page-subtitle" style={{ fontSize: "1.05rem", marginTop: "0.5rem", color: "#475569" }}>
            Manage your evaluating staff and click <strong>View Logs</strong> to inspect accurate, real-time evaluation audit records.
          </p>
        </header>

        <div className="glass-panel" style={{ padding: "2rem", background: "#ffffff", borderRadius: "24px", border: "1.5px solid #e2e8f0", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <div className="spinner" style={{ width: "40px", height: "40px", border: "4px solid rgba(29, 78, 216, 0.2)", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem auto" }}></div>
              <p style={{ color: "#64748b" }}>Loading staff...</p>
            </div>
          ) : error ? (
            <div style={{ padding: "2rem", background: "#fef2f2", color: "#b91c1c", borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
              <AlertTriangle size={24} />
              <span style={{ fontWeight: "600" }}>{error}</span>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ textAlign: "left", padding: "1rem", color: "#64748b", fontWeight: "700" }}>Name</th>
                    <th style={{ textAlign: "left", padding: "1rem", color: "#64748b", fontWeight: "700" }}>Email</th>
                    <th style={{ textAlign: "left", padding: "1rem", color: "#64748b", fontWeight: "700" }}>Role</th>
                    <th style={{ textAlign: "right", padding: "1rem", color: "#64748b", fontWeight: "700" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} onClick={() => openAuditLogs(user)} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s", cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "1.25rem 1rem", fontWeight: "700", color: "#0f172a" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800" }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "1.25rem 1rem", color: "#475569" }}>{user.email}</td>
                      <td style={{ padding: "1.25rem 1rem" }}>{getRoleBadge(user.role)}</td>
                      <td style={{ padding: "1.25rem 1rem", textAlign: "right" }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); openAuditLogs(user); }}
                          className="btn-secondary" 
                          style={{ padding: "8px 16px", fontSize: "0.85rem", fontWeight: "700", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", boxShadow: "0 2px 6px rgba(37,99,235,0.2)" }}
                        >
                          <FileText size={14} /> View Logs
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>No staff found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Audit Log Modal */}
      {selectedStaff && (
        <div className="animate-fade-in" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(12px)", zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "2rem 1rem" }}>
          <div className="animate-fade-in-up" style={{ margin: "auto", background: "#ffffff", borderRadius: "28px", width: "100%", maxWidth: "820px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", position: "relative", border: "1px solid #e2e8f0" }}>
            
            {/* Modal Header */}
            <div style={{ padding: "1.75rem 2rem", borderBottom: "1.5px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "sticky", top: 0, background: "#ffffff", zIndex: 10, borderTopLeftRadius: "28px", borderTopRightRadius: "28px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                  <div style={{ background: "#eff6ff", padding: "10px", borderRadius: "14px", color: "#1d4ed8" }}>
                    <FileText size={24} />
                  </div>
                  <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>Evaluation Audit Log</h2>
                </div>
                <p style={{ color: "#64748b", margin: 0, fontSize: "0.98rem" }}>
                  Official municipal evaluations and clearance reviews conducted by <strong style={{ color: "#1d4ed8", fontWeight: "800" }}>{selectedStaff.name}</strong> ({selectedStaff.email})
                </p>
              </div>
              <button 
                onClick={() => setSelectedStaff(null)} 
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0", cursor: "pointer", color: "#64748b", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#fca5a5"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "2rem" }}>
              {loadingLogs ? (
                <div style={{ textAlign: "center", padding: "4rem" }}>
                   <div className="spinner" style={{ width: "44px", height: "44px", border: "4px solid rgba(29, 78, 216, 0.15)", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 1s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite", margin: "0 auto 1.25rem auto" }}></div>
                   <p style={{ color: "#64748b", fontSize: "1.05rem", fontWeight: "600" }}>Verifying evaluation records for {selectedStaff.name}...</p>
                </div>
              ) : logs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem 2rem", borderRadius: "20px", background: "#f8fafc", border: "1.5px dashed #cbd5e1" }}>
                  <div style={{ width: "70px", height: "70px", background: "#ffffff", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem auto", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
                    <FileText size={36} color="#94a3b8" strokeWidth={1.5} />
                  </div>
                  <h3 style={{ margin: "0 0 8px 0", fontWeight: "800", fontSize: "1.35rem", color: "#0f172a" }}>No Evaluations Credited Yet</h3>
                  <p style={{ color: "#64748b", fontSize: "0.95rem", margin: 0, maxWidth: "340px", marginInline: "auto", lineHeight: "1.5" }}>
                    No evaluations or clearance reviews have been recorded under <strong>{selectedStaff.name}</strong> yet. When this staff member reviews an application, it will appear here immediately.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "8px", borderBottom: "1px solid #e2e8f0", fontSize: "0.88rem", color: "#64748b", fontWeight: "600" }}>
                    <span>Total Evaluations Credited: <strong style={{ color: "#0f172a" }}>{logs.length}</strong></span>
                    <span style={{ color: "#16a34a", display: "flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle size={14} /> Synchronized with Philippine Time (UTC+8)
                    </span>
                  </div>

                  {logs.map((log) => {
                    const isApproved = log.action === "Approved";
                    const isRejected = log.action === "Disapproved" || log.action === "Rejected";

                    return (
                      <div 
                        key={String(log.id)} 
                        style={{ 
                          padding: "1.25rem 1.5rem", 
                          background: "#ffffff", 
                          border: "1.5px solid #e2e8f0", 
                          borderRadius: "16px", 
                          boxShadow: "0 2px 8px rgba(0,0,0,0.02)", 
                          position: "relative", 
                          overflow: "hidden" 
                        }}
                      >
                        {/* Decorative side accent */}
                        <div style={{ 
                          position: "absolute", 
                          left: 0, 
                          top: 0, 
                          bottom: 0, 
                          width: "5px", 
                          background: isApproved ? "#16a34a" : (isRejected ? "#dc2626" : "#d97706") 
                        }}></div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", paddingLeft: "8px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                            <div style={{ 
                              background: isApproved ? "#f0fdf4" : (isRejected ? "#fef2f2" : "#fffbeb"), 
                              padding: "10px", 
                              borderRadius: "12px", 
                              color: isApproved ? "#16a34a" : (isRejected ? "#dc2626" : "#d97706"),
                              border: `1px solid ${isApproved ? "#bbf7d0" : (isRejected ? "#fecaca" : "#fde68a")}`
                            }}>
                              {isApproved ? <CheckCircle size={24} strokeWidth={2.5} /> : <XCircle size={24} strokeWidth={2.5} />}
                            </div>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                                {log.permitId && (
                                  <span style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "800", fontFamily: "monospace" }}>
                                    {log.permitId}
                                  </span>
                                )}
                                <h4 style={{ margin: 0, fontSize: "1.05rem", color: "#0f172a", fontWeight: "800" }}>
                                  {log.projectName || log.permitType}
                                </h4>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "0.85rem" }}>
                                <span style={{ fontWeight: "600", color: "#475569" }}>Applicant:</span> {log.applicantName ? `${log.applicantName} (${log.applicantEmail})` : log.applicantEmail}
                              </div>
                            </div>
                          </div>

                          <div style={{ background: "#f8fafc", padding: "4px 10px", borderRadius: "10px", fontSize: "0.8rem", color: "#64748b", fontWeight: "600", border: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                            {formatPhilippineDateTime(log.timestamp)}
                          </div>
                        </div>
                        
                        <div style={{ marginLeft: "8px", background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px", flexWrap: "wrap", gap: "6px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <strong style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>Verdict:</strong>
                              <span style={{ 
                                background: isApproved ? "#16a34a" : (isRejected ? "#dc2626" : "#d97706"), 
                                color: "white", 
                                padding: "2px 8px", 
                                borderRadius: "6px", 
                                fontSize: "0.75rem", 
                                fontWeight: "800" 
                              }}>
                                {log.action}
                              </span>
                            </div>

                            <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "#166534", fontWeight: "700", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "2px 8px", borderRadius: "6px" }}>
                              <UserCheck size={13} color="#16a34a" />
                              <span>Evaluated by {selectedStaff.name}</span>
                            </div>
                          </div>
                          <p style={{ margin: 0, fontSize: "0.92rem", color: "#334155", lineHeight: "1.55", fontStyle: "italic", borderLeft: "3px solid #cbd5e1", paddingLeft: "10px" }}>
                            "{log.comments}"
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
    </>
  );
}
