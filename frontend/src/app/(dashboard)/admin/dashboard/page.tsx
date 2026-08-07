"use client";

import React, { useState } from "react";
import { usePermitContext } from "../../../../context/PermitContext";
import { ShieldAlert, Activity, Settings, Database, Trash2, CheckCircle, XCircle, AlertCircle, Info, Terminal, User, Clock } from "lucide-react";

export default function AdminDashboard() {
  const { systemLogs, clearLogs } = usePermitContext();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'success': return { color: '#22c55e', bg: '#f0fdf4', icon: CheckCircle };
      case 'warning': return { color: '#f59e0b', bg: '#fffbeb', icon: AlertCircle };
      case 'error': return { color: '#ef4444', bg: '#fef2f2', icon: XCircle };
      case 'info':
      default: return { color: '#3b82f6', bg: '#eff6ff', icon: Info };
    }
  };

  return (
    <div className="dashboard-page animate-fade-in-up">
      <header className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "2.25rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Database size={32} color="#1d4ed8" /> Admin Portal
          </h1>
          <p className="page-subtitle" style={{ fontSize: "1.1rem", color: "#64748b" }}>System overview and security audit logs.</p>
        </div>
      </header>

      <div style={{ maxWidth: "100%" }}>
        <section style={{ background: "white", padding: "2rem", borderRadius: "24px", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), 0 0 0 1px rgba(226, 232, 240, 0.8) inset" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid rgba(226, 232, 240, 0.8)" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)", padding: "10px", borderRadius: "14px", color: "#1d4ed8" }}>
                <Terminal size={24} />
              </div>
              System Logs
            </h2>
            <button onClick={clearLogs} style={{ background: "white", border: "1px solid #e2e8f0", color: "#ef4444", padding: "10px 16px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 2px 5px rgba(0,0,0,0.02)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.borderColor = "#fca5a5"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
              <Trash2 size={16} /> Clear Logs
            </button>
          </div>
          
          <div>
            {systemLogs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#f8fafc", borderRadius: "20px", border: "1px dashed #cbd5e1" }}>
                <Activity size={48} color="#94a3b8" style={{ margin: "0 auto 1rem auto", opacity: 0.5 }} />
                <h3 style={{ margin: "0 0 8px 0", color: "#334155", fontSize: "1.25rem", fontWeight: "700" }}>No Logs Available</h3>
                <p style={{ margin: 0, color: "#64748b" }}>System activity will be recorded here.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {systemLogs.map((log, index) => {
                  const config = getStatusConfig(log.status);
                  const StatusIcon = config.icon;
                  return (
                    <div key={log.id} className="animate-fade-in-up" style={{ padding: "1.25rem 1.5rem", background: "white", border: "1px solid #e2e8f0", borderRadius: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", display: "flex", gap: "1rem", alignItems: "flex-start", transition: "all 0.2s", animationDelay: `${index * 0.05}s` }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(0,0,0,0.05)"; e.currentTarget.style.borderColor = "#cbd5e1"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                      
                      <div style={{ background: config.bg, padding: "10px", borderRadius: "12px", color: config.color, flexShrink: 0, boxShadow: `inset 0 0 0 1px ${config.color}33` }}>
                        <StatusIcon size={22} strokeWidth={2.5} />
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                          <p style={{ margin: 0, color: "#0f172a", fontWeight: "600", fontSize: "1.05rem", lineHeight: "1.4" }}>{log.message}</p>
                          <span style={{ fontSize: "0.85rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, background: "#f8fafc", padding: "4px 8px", borderRadius: "8px", fontWeight: "600" }}>
                            <Clock size={14} /> {log.timestamp}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.9rem" }}>
                          <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "6px", background: "#f1f5f9", padding: "4px 10px", borderRadius: "20px", fontWeight: "500" }}>
                            <User size={14} /> {log.user}
                          </span>
                          <span style={{ color: "#64748b", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em", fontWeight: "700" }}>
                            • {log.category}
                          </span>
                        </div>
                      </div>
                      
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

    </div>
  );
}
