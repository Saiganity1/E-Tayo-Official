"use client";

import React, { useEffect, useState } from "react";
import { Users, Shield, ShieldAlert, AlertTriangle, X, FileText, CheckCircle, XCircle } from "lucide-react";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface EvaluationLog {
  id: number;
  staffEmail: string;
  applicantEmail: string;
  permitType: string;
  action: string;
  comments: string;
  timestamp: string;
}

export default function AdminStaffPage() {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/users?role=ROLE_STAFF`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to fetch staff");
      
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
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/evaluations/staff/${staff.email}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to fetch logs");
      
      const data = await res.json();
      setLogs(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const getRoleBadge = (role: string) => {
    return <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "4px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}><Shield size={14} /> Staff</span>;
  };

  return (
    <div className="dashboard-page animate-fade-in-up">
      <header className="page-header" style={{ marginBottom: "2rem" }}>
        <h1 className="page-title" style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <ShieldAlert size={32} color="#1d4ed8" /> Staff Management
        </h1>
        <p className="page-subtitle" style={{ fontSize: "1.1rem", marginTop: "0.5rem", color: "#475569" }}>
          Manage your evaluating staff and click a row to view their evaluation audit logs.
        </p>
      </header>

      <div className="glass-panel" style={{ padding: "2rem", background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
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
                    <td style={{ padding: "1.25rem 1rem", fontWeight: "600", color: "#0f172a" }}>{user.name}</td>
                    <td style={{ padding: "1.25rem 1rem", color: "#475569" }}>{user.email}</td>
                    <td style={{ padding: "1.25rem 1rem" }}>{getRoleBadge(user.role)}</td>
                    <td style={{ padding: "1.25rem 1rem", textAlign: "right" }}>
                      <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem", background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                        View Logs
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

      {/* Audit Log Modal */}
      {selectedStaff && (
        <div className="animate-fade-in" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(12px)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center", padding: "1rem" }}>
          <div className="animate-fade-in-up" style={{ background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)", borderRadius: "32px", width: "100%", maxWidth: "750px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.5) inset", display: "flex", flexDirection: "column" }}>
            
            {/* Modal Header */}
            <div style={{ padding: "2rem 2.5rem", borderBottom: "1px solid rgba(226, 232, 240, 0.8)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "sticky", top: 0, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)", zIndex: 10, borderTopLeftRadius: "32px", borderTopRightRadius: "32px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <div style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)", padding: "10px", borderRadius: "14px", color: "#1d4ed8" }}>
                    <FileText size={24} />
                  </div>
                  <h2 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>Evaluation Audit Log</h2>
                </div>
                <p style={{ color: "#64748b", margin: 0, fontSize: "1.05rem" }}>Viewing detailed evaluation history performed by <strong style={{ color: "#1d4ed8", fontWeight: "700" }}>{selectedStaff.name}</strong></p>
              </div>
              <button onClick={() => setSelectedStaff(null)} style={{ background: "white", border: "1px solid #e2e8f0", cursor: "pointer", color: "#64748b", padding: "10px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.transform = "rotate(90deg)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.transform = "rotate(0deg)"; }}>
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "2.5rem" }}>
              {loadingLogs ? (
                <div style={{ textAlign: "center", padding: "4rem" }}>
                   <div className="spinner" style={{ width: "48px", height: "48px", border: "4px solid rgba(29, 78, 216, 0.15)", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 1s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite", margin: "0 auto 1.5rem auto" }}></div>
                   <p style={{ color: "#64748b", fontSize: "1.1rem", fontWeight: "500", animation: "pulse 2s infinite" }}>Synchronizing audit trails...</p>
                </div>
              ) : logs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem", background: "rgba(241, 245, 249, 0.5)", borderRadius: "24px", border: "2px dashed #e2e8f0" }}>
                  <div style={{ width: "80px", height: "80px", background: "white", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
                    <FileText size={40} color="#cbd5e1" />
                  </div>
                  <h3 style={{ margin: "0 0 8px 0", color: "#334155", fontWeight: "700", fontSize: "1.25rem" }}>No Evaluations Found</h3>
                  <p style={{ color: "#64748b", fontSize: "1rem", margin: 0 }}>This staff member has not processed any applications yet.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {logs.map((log, index) => (
                    <div key={log.id} style={{ padding: "1.5rem", background: "white", border: "1px solid rgba(226, 232, 240, 0.8)", borderRadius: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.02)", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", position: "relative", overflow: "hidden", animationDelay: `${index * 0.1}s` }} className="hover:shadow-lg animate-fade-in-up" onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.02)"; }}>
                      
                      {/* Decorative side accent */}
                      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: log.action === "Approved" ? "#22c55e" : "#ef4444" }}></div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", paddingLeft: "12px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                          <div style={{ background: log.action === "Approved" ? "#f0fdf4" : "#fef2f2", padding: "12px", borderRadius: "16px", color: log.action === "Approved" ? "#16a34a" : "#dc2626", boxShadow: "inset 0 0 0 1px " + (log.action === "Approved" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)") }}>
                            {log.action === "Approved" ? <CheckCircle size={28} strokeWidth={2.5} /> : <XCircle size={28} strokeWidth={2.5} />}
                          </div>
                          <div>
                            <h4 style={{ margin: "0 0 4px 0", fontSize: "1.25rem", color: "#0f172a", fontWeight: "700" }}>{log.permitType}</h4>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "0.9rem" }}>
                              <span style={{ fontWeight: "600", color: "#475569" }}>Applicant:</span> {log.applicantEmail}
                            </div>
                          </div>
                        </div>
                        <div style={{ background: "#f8fafc", padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem", color: "#64748b", fontWeight: "600", border: "1px solid #e2e8f0" }}>
                          {new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      
                      <div style={{ marginLeft: "12px", background: "linear-gradient(to right, #f8fafc, white)", padding: "1.25rem", borderRadius: "12px", border: "1px solid #f1f5f9", position: "relative" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <strong style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8" }}>Final Verdict</strong>
                          <span style={{ background: log.action === "Approved" ? "#22c55e" : "#ef4444", color: "white", padding: "2px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700" }}>
                            {log.action}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "1rem", color: "#334155", lineHeight: "1.6", fontStyle: "italic", borderLeft: "3px solid #cbd5e1", paddingLeft: "12px" }}>"{log.comments}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
    </div>
  );
}
