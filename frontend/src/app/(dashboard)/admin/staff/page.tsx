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
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center", padding: "1rem" }}>
          <div className="animate-fade-in-up" style={{ background: "white", borderRadius: "24px", width: "100%", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 40px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" }}>
            
            {/* Modal Header */}
            <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "white", zIndex: 10 }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Evaluation Audit Log</h2>
                <p style={{ color: "#64748b", margin: 0, fontSize: "0.95rem" }}>Viewing evaluations performed by <strong style={{ color: "#0f172a" }}>{selectedStaff.name}</strong></p>
              </div>
              <button onClick={() => setSelectedStaff(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "2rem" }}>
              {loadingLogs ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                   <div className="spinner" style={{ width: "30px", height: "30px", border: "3px solid rgba(29, 78, 216, 0.2)", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem auto" }}></div>
                   <p style={{ color: "#64748b" }}>Fetching logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", background: "#f8fafc", borderRadius: "16px" }}>
                  <FileText size={48} color="#cbd5e1" style={{ margin: "0 auto 1rem auto" }} />
                  <h3 style={{ margin: 0, color: "#475569", fontWeight: "600" }}>No Evaluations Found</h3>
                  <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>This staff member has not evaluated any applications yet.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {logs.map(log => (
                    <div key={log.id} style={{ padding: "1.25rem", border: "1px solid #e2e8f0", borderRadius: "16px", background: "#fafafa" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {log.action === "Approved" ? <CheckCircle size={24} color="#16a34a" /> : <XCircle size={24} color="#dc2626" />}
                          <div>
                            <h4 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a" }}>{log.permitType}</h4>
                            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Applicant: {log.applicantEmail}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: "500" }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <div style={{ background: "white", padding: "1rem", borderRadius: "8px", border: "1px solid #f1f5f9", marginTop: "12px" }}>
                        <strong style={{ fontSize: "0.85rem", color: "#475569", display: "block", marginBottom: "4px" }}>Action: <span style={{ color: log.action === "Approved" ? "#16a34a" : "#dc2626" }}>{log.action}</span></strong>
                        <p style={{ margin: 0, fontSize: "0.95rem", color: "#1e293b", lineHeight: "1.5" }}>"{log.comments}"</p>
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
