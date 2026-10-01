"use client";

import React, { useEffect, useState } from "react";
import { 
  Users, Shield, ShieldAlert, AlertTriangle, X, FileText, CheckCircle, 
  XCircle, UserCheck, Clock, Building2, ExternalLink, UserPlus, 
  Trash2, UserMinus, Plus, Sparkles, RefreshCw
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

const isAutomaticDummyStaff = (u: any): boolean => {
  const email = String(u?.email || "").toLowerCase().trim();
  return email === "staff@etayo.gov.ph" || email === "dave.sicat@etayo.gov.ph";
};

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
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Modal State for Evaluation Audit Logs
  const [selectedStaff, setSelectedStaff] = useState<UserData | null>(null);
  const [logs, setLogs] = useState<EvaluationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Modal State for Assigning Staff
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTab, setAssignTab] = useState<"promote" | "create">("promote");
  const [applicants, setApplicants] = useState<UserData[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [selectedApplicantId, setSelectedApplicantId] = useState<number | string>("");

  // New Staff Form Fields
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);
  const [unassigningId, setUnassigningId] = useState<number | null>(null);

  const fetchStaff = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
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
      if (Array.isArray(data)) {
        // Strictly eliminate automatic seeded dummy staff
        const authenticStaff = data.filter(u => !isAutomaticDummyStaff(u));
        setUsers(authenticStaff);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async () => {
    setLoadingApplicants(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      let res = await fetch("/api/users?role=ROLE_APPLICANT", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      }).catch(() => null);

      if (!res || !res.ok) {
        const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
        res = await fetch(`${rawApi}/api/users?role=ROLE_APPLICANT`, {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        }).catch(() => null);
      }

      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setApplicants(data.filter(u => !isAutomaticDummyStaff(u)));
        }
      }
    } catch (e) {
    } finally {
      setLoadingApplicants(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openAssignModal = () => {
    setIsAssignModalOpen(true);
    fetchApplicants();
  };

  const handlePromoteApplicant = async () => {
    if (!selectedApplicantId) {
      alert("Pumili ng applicant na ia-assign bilang Staff.");
      return;
    }
    setIsSubmittingStaff(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      let res = await fetch(`/api/users/${selectedApplicantId}/promote`, {
        method: "PUT",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      }).catch(() => null);

      if (!res || !res.ok) {
        const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
        res = await fetch(`${rawApi}/api/users/${selectedApplicantId}/promote`, {
          method: "PUT",
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        }).catch(() => null);
      }

      setActionMessage("Matagumpay na nai-assign ang napiling applicant bilang Staff!");
      setIsAssignModalOpen(false);
      setSelectedApplicantId("");
      await fetchStaff();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) {
      alert("Pakilagay ang pangalan at email address ng staff.");
      return;
    }

    setIsSubmittingStaff(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: newStaffName.trim(),
          email: newStaffEmail.trim().toLowerCase(),
          password: newStaffPassword.trim() || "password123",
          role: "ROLE_STAFF"
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Failed to create staff member");
      }

      setActionMessage(`Matagumpay na nalikha at nai-assign si ${newStaffName} bilang Staff!`);
      setIsAssignModalOpen(false);
      setNewStaffName("");
      setNewStaffEmail("");
      setNewStaffPassword("");
      await fetchStaff();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  const handleUnassignStaff = async (staffId: number, staffName: string) => {
    if (!window.confirm(`Sigurado ka ba na nais mong alisin si ${staffName} mula sa Evaluating Staff? Babalik ang kanyang account bilang regular applicant.`)) {
      return;
    }

    setUnassigningId(staffId);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      let res = await fetch(`/api/users/${staffId}/demote`, {
        method: "PUT",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      }).catch(() => null);

      if (!res || !res.ok) {
        const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
        res = await fetch(`${rawApi}/api/users/${staffId}/demote`, {
          method: "PUT",
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        }).catch(() => null);
      }

      setActionMessage(`Matagumpay na inalis si ${staffName} sa listahan ng Staff.`);
      await fetchStaff();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setUnassigningId(null);
    }
  };

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
        
        {/* Header with Title and Action Button */}
        <header className="page-header" style={{ marginBottom: "1.75rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="page-title" style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "0.75rem", margin: 0 }}>
              <ShieldAlert size={32} color="#1d4ed8" /> Staff Management
            </h1>
            <p className="page-subtitle" style={{ fontSize: "1.05rem", marginTop: "0.5rem", color: "#475569", margin: "0.5rem 0 0 0" }}>
              Manwal na mag-assign ng mga opisyal na magiging evaluating staff para sa pagsusuri ng mga permit.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => fetchStaff()}
              style={{
                background: "#ffffff",
                border: "1.5px solid #cbd5e1",
                color: "#334155",
                padding: "10px 16px",
                borderRadius: "12px",
                fontSize: "0.9rem",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer"
              }}
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>

            <button
              onClick={openAssignModal}
              style={{
                background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "12px",
                fontSize: "0.92rem",
                fontWeight: "800",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.28)"
              }}
            >
              <UserPlus size={18} />
              <span>Assign Staff Member</span>
            </button>
          </div>
        </header>

        {/* Action Success Toast */}
        {actionMessage && (
          <div style={{
            background: "#f0fdf4",
            border: "1.5px solid #86efac",
            color: "#166534",
            padding: "12px 18px",
            borderRadius: "14px",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.92rem",
            fontWeight: "700"
          }}>
            <CheckCircle size={18} color="#16a34a" />
            <span>{actionMessage}</span>
          </div>
        )}

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
          ) : users.length === 0 ? (
            /* Clean Empty State */
            <div style={{
              textAlign: "center",
              padding: "4rem 2rem",
              background: "#f8fafc",
              borderRadius: "20px",
              border: "1.5px dashed #cbd5e1"
            }}>
              <div style={{
                width: "72px",
                height: "72px",
                borderRadius: "24px",
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem auto",
                boxShadow: "0 8px 20px -4px rgba(37, 99, 235, 0.15)"
              }}>
                <Users size={36} />
              </div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: "800", color: "#0f172a", margin: "0 0 8px 0" }}>
                Walang Staff Accounts sa Sistema
              </h2>
              <p style={{ fontSize: "0.95rem", color: "#64748b", maxWidth: "480px", margin: "0 auto 1.75rem auto", lineHeight: 1.6 }}>
                Ang system ay walang pre-created o automatic staff accounts. Ikaw bilang Admin ang mag-aassign kung sinong opisyal ang may karapatang mag-evaluate ng mga permit.
              </p>
              <button
                onClick={openAssignModal}
                style={{
                  background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "14px",
                  fontSize: "0.95rem",
                  fontWeight: "800",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)"
                }}
              >
                <UserPlus size={18} />
                <span>+ Mag-assign ng Staff Member</span>
              </button>
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
                    <tr key={user.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
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
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          <button 
                            onClick={() => openAuditLogs(user)}
                            className="btn-secondary" 
                            style={{
                              padding: "8px 16px",
                              fontSize: "0.85rem",
                              fontWeight: "700",
                              background: "#2563eb",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "10px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              boxShadow: "0 2px 6px rgba(37,99,235,0.2)"
                            }}
                          >
                            <FileText size={14} /> View Logs
                          </button>

                          <button
                            onClick={() => handleUnassignStaff(user.id, user.name)}
                            disabled={unassigningId === user.id}
                            title="Alisin sa staff access"
                            style={{
                              padding: "8px 12px",
                              fontSize: "0.85rem",
                              fontWeight: "700",
                              background: "#fef2f2",
                              color: "#dc2626",
                              border: "1px solid #fecaca",
                              borderRadius: "10px",
                              cursor: unassigningId === user.id ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <UserMinus size={14} />
                            <span>{unassigningId === user.id ? "Removing..." : "Unassign"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ASSIGN / CREATE STAFF MODAL */}
      {/* ========================================================================= */}
      {isAssignModalOpen && (
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
            borderRadius: "24px",
            width: "100%",
            maxWidth: "560px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            border: "1.5px solid #e2e8f0",
            overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "1.5rem 1.75rem",
              borderBottom: "1.5px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>
                    Assign Evaluating Staff
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                    Pumili sa mga rehistrado o lumikha ng bagong staff account
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Tab Selector */}
            <div style={{ display: "flex", padding: "8px 1.75rem", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setAssignTab("promote")}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  border: assignTab === "promote" ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                  background: assignTab === "promote" ? "#2563eb" : "#ffffff",
                  color: assignTab === "promote" ? "#ffffff" : "#475569",
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                Promote Existing User
              </button>
              <button
                type="button"
                onClick={() => setAssignTab("create")}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  border: assignTab === "create" ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                  background: assignTab === "create" ? "#2563eb" : "#ffffff",
                  color: assignTab === "create" ? "#ffffff" : "#475569",
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                Create New Staff
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "1.75rem" }}>
              {assignTab === "promote" ? (
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
                    Pumili ng Rehistradong Applicant na gagawing Staff:
                  </label>

                  {loadingApplicants ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                      Naglo-load ng applicants...
                    </div>
                  ) : applicants.length === 0 ? (
                    <div style={{ padding: "1.5rem", background: "#f8fafc", borderRadius: "12px", textAlign: "center", color: "#64748b", border: "1px dashed #cbd5e1" }}>
                      Walang applicants na puwedeng i-promote. Gamitin ang "Create New Staff" tab.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto", paddingRight: "4px" }}>
                      {applicants.map((appUser) => {
                        const isSelected = String(selectedApplicantId) === String(appUser.id);
                        return (
                          <div
                            key={appUser.id}
                            onClick={() => setSelectedApplicantId(appUser.id)}
                            style={{
                              padding: "10px 14px",
                              borderRadius: "12px",
                              border: isSelected ? "2px solid #2563eb" : "1.5px solid #e2e8f0",
                              background: isSelected ? "#eff6ff" : "#ffffff",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between"
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: "700", fontSize: "0.92rem", color: "#0f172a" }}>
                                {appUser.name}
                              </div>
                              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                {appUser.email}
                              </div>
                            </div>
                            <span style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              border: isSelected ? "5px solid #2563eb" : "2px solid #cbd5e1",
                              background: "#ffffff"
                            }} />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1.5rem" }}>
                    <button
                      type="button"
                      onClick={() => setIsAssignModalOpen(false)}
                      style={{ padding: "9px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#f1f5f9", fontWeight: "700", cursor: "pointer", color: "#475569" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handlePromoteApplicant}
                      disabled={isSubmittingStaff || !selectedApplicantId}
                      style={{
                        padding: "9px 22px",
                        borderRadius: "10px",
                        border: "none",
                        background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                        color: "white",
                        fontWeight: "800",
                        cursor: (isSubmittingStaff || !selectedApplicantId) ? "not-allowed" : "pointer",
                        opacity: (isSubmittingStaff || !selectedApplicantId) ? 0.5 : 1
                      }}
                    >
                      {isSubmittingStaff ? "Assigning..." : "Assign as Staff"}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateStaff}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                        Staff Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        placeholder="hal. Engr. Gilbert Cruz o Dave Sicat"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.92rem", outline: "none" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                        Official Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        placeholder="hal. gilbert.cruz@etayo.gov.ph"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.92rem", outline: "none" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                        Temporary Password
                      </label>
                      <input
                        type="password"
                        value={newStaffPassword}
                        onChange={(e) => setNewStaffPassword(e.target.value)}
                        placeholder="password123 (default kung blangko)"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.92rem", outline: "none" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1.5rem" }}>
                    <button
                      type="button"
                      onClick={() => setIsAssignModalOpen(false)}
                      style={{ padding: "9px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#f1f5f9", fontWeight: "700", cursor: "pointer", color: "#475569" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingStaff}
                      style={{
                        padding: "9px 22px",
                        borderRadius: "10px",
                        border: "none",
                        background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                        color: "white",
                        fontWeight: "800",
                        cursor: isSubmittingStaff ? "not-allowed" : "pointer",
                        opacity: isSubmittingStaff ? 0.5 : 1
                      }}
                    >
                      {isSubmittingStaff ? "Creating Staff..." : "Create & Assign Staff"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUDIT LOG MODAL (ACCURATE REAL EVALUATIONS) */}
      {/* ========================================================================= */}
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
