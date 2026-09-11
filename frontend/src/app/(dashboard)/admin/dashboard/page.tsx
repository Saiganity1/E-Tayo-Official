"use client";

import React, { useState } from "react";
import { usePermitContext } from "../../../../context/PermitContext";
import { 
  Database, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Terminal, 
  User, 
  Clock, 
  Search, 
  RefreshCw, 
  Shield, 
  FileCheck, 
  Sliders, 
  Globe, 
  Activity,
  Layers,
  ChevronRight
} from "lucide-react";

export default function AdminDashboard() {
  const { systemLogs, clearLogs, refreshApplications } = usePermitContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const getStatusConfig = (status?: string) => {
    switch (status) {
      case 'success': return { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: CheckCircle, label: 'Success' };
      case 'warning': return { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: AlertCircle, label: 'Warning' };
      case 'error': return { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: XCircle, label: 'Error' };
      case 'info':
      default: return { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: Info, label: 'Info' };
    }
  };

  const getCategoryConfig = (category?: string) => {
    switch (category) {
      case 'application': return { label: 'Evaluation / Application', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', icon: FileCheck };
      case 'security': return { label: 'Security & Auth', bg: '#f8fafc', color: '#475569', border: '#cbd5e1', icon: Shield };
      case 'setting': return { label: 'Configuration', bg: '#fff7ed', color: '#c2410c', border: '#ffedd5', icon: Sliders };
      case 'system':
      default: return { label: 'System Event', bg: '#f1f5f9', color: '#334155', border: '#e2e8f0', icon: Terminal };
    }
  };

  const formatLogTime = (dateStr?: string) => {
    if (!dateStr) return "Just now";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
      
      let relative = "";
      if (diffSec < 60) relative = "Just now";
      else if (diffSec < 3600) relative = `${Math.max(1, Math.floor(diffSec / 60))}m ago`;
      else if (diffSec < 86400) relative = `${Math.floor(diffSec / 3600)}h ago`;
      else if (diffSec < 604800) relative = `${Math.floor(diffSec / 86400)}d ago`;

      const formatted = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }) + " · " + d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });

      return relative ? `${formatted} (${relative})` : formatted;
    } catch (e) {
      return dateStr;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshApplications();
    } catch (e) {}
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleClearLogs = async () => {
    if (window.confirm("Are you sure you want to permanently clear all system and evaluation audit logs?")) {
      setIsClearing(true);
      try {
        await clearLogs();
      } catch (e) {}
      setIsClearing(false);
    }
  };

  // Filter logs
  const filteredLogs = systemLogs.filter((log) => {
    const sTerm = searchTerm.toLowerCase();
    const matchesSearch = 
      (log.message || "").toLowerCase().includes(sTerm) ||
      (log.user || "").toLowerCase().includes(sTerm) ||
      (log.details || "").toLowerCase().includes(sTerm) ||
      (log.action || "").toLowerCase().includes(sTerm) ||
      (log.category || "").toLowerCase().includes(sTerm);

    const matchesCategory = selectedCategory === "all" || log.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const evaluationLogsCount = systemLogs.filter(l => l.category === "application" || (l.action && l.action.includes("EVALUAT"))).length;
  const securityLogsCount = systemLogs.filter(l => l.category === "security" || (l.action && l.action.includes("LOGIN"))).length;

  return (
    <div className="dashboard-page animate-fade-in-up" style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Page Header */}
      <header className="page-header" style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "2.25rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "0.75rem", margin: 0 }}>
            <Database size={32} color="#1d4ed8" /> Admin Portal
          </h1>
          <p className="page-subtitle" style={{ fontSize: "1.05rem", color: "#64748b", margin: "0.4rem 0 0 0" }}>
            Real-time audit trails of staff evaluations, applicant updates, and security logs.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            style={{ 
              background: "white", 
              border: "1px solid #cbd5e1", 
              color: "#334155", 
              padding: "9px 16px", 
              borderRadius: "12px", 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              fontWeight: "600", 
              fontSize: "0.9rem",
              cursor: isRefreshing ? "not-allowed" : "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
              transition: "all 0.2s"
            }}
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} color="#2563eb" /> Refresh
          </button>

          <button 
            onClick={handleClearLogs} 
            disabled={isClearing || systemLogs.length === 0}
            style={{ 
              background: "white", 
              border: "1px solid #fecaca", 
              color: "#dc2626", 
              padding: "9px 16px", 
              borderRadius: "12px", 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              fontWeight: "600", 
              fontSize: "0.9rem",
              cursor: (isClearing || systemLogs.length === 0) ? "not-allowed" : "pointer", 
              opacity: systemLogs.length === 0 ? 0.5 : 1,
              transition: "all 0.2s", 
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)" 
            }} 
            onMouseEnter={(e) => { if (systemLogs.length > 0) e.currentTarget.style.background = "#fef2f2"; }} 
            onMouseLeave={(e) => { e.currentTarget.style.background = "white"; }}
          >
            <Trash2 size={16} /> Clear Logs
          </button>
        </div>
      </header>

      {/* Summary KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        <div style={{ background: "white", padding: "1.25rem 1.5rem", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Audit Events</span>
            <div style={{ background: "#eff6ff", color: "#2563eb", padding: "6px", borderRadius: "10px" }}><Activity size={18} /></div>
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "#0f172a" }}>{systemLogs.length}</div>
          <span style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: "600" }}>✓ Synchronized with backend</span>
        </div>

        <div style={{ background: "white", padding: "1.25rem 1.5rem", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Staff Evaluations</span>
            <div style={{ background: "#ecfdf5", color: "#047857", padding: "6px", borderRadius: "10px" }}><FileCheck size={18} /></div>
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "#0f172a" }}>{evaluationLogsCount}</div>
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Evaluations recorded</span>
        </div>

        <div style={{ background: "white", padding: "1.25rem 1.5rem", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Security & Auth</span>
            <div style={{ background: "#f8fafc", color: "#475569", padding: "6px", borderRadius: "10px" }}><Shield size={18} /></div>
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "#0f172a" }}>{securityLogsCount}</div>
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Logins & sessions</span>
        </div>
      </div>

      {/* Main Logs Section */}
      <section style={{ background: "white", padding: "2rem", borderRadius: "24px", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.06), 0 0 0 1px rgba(226, 232, 240, 0.8) inset" }}>
        
        {/* Controls: Search and Filter Tabs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "1.75rem", paddingBottom: "1.5rem", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            
            {/* Search Input */}
            <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "14px", padding: "0.6rem 1rem", flex: 1, minWidth: "280px", maxWidth: "480px" }}>
              <Search size={18} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Search by staff, applicant, permit, or keyword..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: "none", background: "transparent", outline: "none", padding: "0 0.5rem", width: "100%", color: "#1e293b", fontSize: "0.95rem" }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.8rem", fontWeight: "700" }}>✕</button>
              )}
            </div>

            {/* Total Results Count */}
            <div style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: "600" }}>
              Showing <strong>{filteredLogs.length}</strong> of {systemLogs.length} events
            </div>
          </div>

          {/* Category Chips Filter */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#64748b", marginRight: "4px" }}>Filter:</span>
            {[
              { id: 'all', label: 'All Logs', count: systemLogs.length },
              { id: 'application', label: 'Evaluations & Permits', count: evaluationLogsCount },
              { id: 'security', label: 'Security & Auth', count: securityLogsCount },
              { id: 'setting', label: 'Configurations', count: systemLogs.filter(l => l.category === 'setting').length },
              { id: 'system', label: 'System Operations', count: systemLogs.filter(l => l.category === 'system').length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  fontSize: "0.82rem",
                  fontWeight: selectedCategory === tab.id ? "700" : "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: selectedCategory === tab.id ? "#1d4ed8" : "#f8fafc",
                  color: selectedCategory === tab.id ? "white" : "#475569",
                  border: `1px solid ${selectedCategory === tab.id ? "#1d4ed8" : "#e2e8f0"}`,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: selectedCategory === tab.id ? "0 2px 8px rgba(29, 78, 216, 0.25)" : "none"
                }}
              >
                <span>{tab.label}</span>
                <span style={{ 
                  background: selectedCategory === tab.id ? "rgba(255,255,255,0.25)" : "#e2e8f0", 
                  color: selectedCategory === tab.id ? "white" : "#64748b",
                  padding: "1px 6px", 
                  borderRadius: "10px", 
                  fontSize: "0.75rem" 
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Logs Feed */}
        <div>
          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4.5rem 2rem", background: "#f8fafc", borderRadius: "20px", border: "1px dashed #cbd5e1" }}>
              <Terminal size={48} color="#94a3b8" style={{ margin: "0 auto 1rem auto", opacity: 0.5 }} />
              <h3 style={{ margin: "0 0 8px 0", color: "#334155", fontSize: "1.25rem", fontWeight: "700" }}>No Logs Found</h3>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
                {searchTerm ? "No audit events match your search query." : "System activity and staff evaluations will appear here as they occur."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {filteredLogs.map((log, index) => {
                const statusConfig = getStatusConfig(log.status);
                const categoryConfig = getCategoryConfig(log.category);
                const StatusIcon = statusConfig.icon;
                const CategoryIcon = categoryConfig.icon;

                const displayUser = log.user || log.userEmail || "System Staff";
                const displayMessage = log.message || log.details || (log.action ? log.action.replace(/_/g, " ") : "System Activity");
                const hasSeparateDetails = log.details && log.details !== log.message && !log.message?.includes(log.details);

                return (
                  <div 
                    key={log.id} 
                    className="animate-fade-in-up" 
                    style={{ 
                      padding: "1.25rem 1.5rem", 
                      background: "white", 
                      border: "1px solid #e2e8f0", 
                      borderRadius: "16px", 
                      boxShadow: "0 2px 8px rgba(0,0,0,0.02)", 
                      display: "flex", 
                      gap: "1.25rem", 
                      alignItems: "flex-start", 
                      transition: "all 0.2s", 
                      animationDelay: `${Math.min(index * 0.03, 0.3)}s` 
                    }} 
                    onMouseEnter={(e) => { 
                      e.currentTarget.style.transform = "translateY(-2px)"; 
                      e.currentTarget.style.boxShadow = "0 8px 24px -4px rgba(0,0,0,0.06)"; 
                      e.currentTarget.style.borderColor = "#cbd5e1"; 
                    }} 
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.transform = "translateY(0)"; 
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)"; 
                      e.currentTarget.style.borderColor = "#e2e8f0"; 
                    }}
                  >
                    
                    {/* Status Badge Icon */}
                    <div style={{ 
                      background: statusConfig.bg, 
                      padding: "12px", 
                      borderRadius: "14px", 
                      color: statusConfig.color, 
                      flexShrink: 0, 
                      boxShadow: `inset 0 0 0 1px ${statusConfig.border}`,
                      marginTop: "2px"
                    }}>
                      <StatusIcon size={22} strokeWidth={2.4} />
                    </div>
                    
                    {/* Log Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      
                      {/* Top Meta Line: Category chip, Status chip, and Timestamp */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ 
                            background: categoryConfig.bg, 
                            color: categoryConfig.color, 
                            border: `1px solid ${categoryConfig.border}`,
                            padding: "3px 10px", 
                            borderRadius: "999px", 
                            fontSize: "0.75rem", 
                            fontWeight: "700",
                            letterSpacing: "0.03em",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px"
                          }}>
                            <CategoryIcon size={12} /> {categoryConfig.label}
                          </span>

                          <span style={{
                            background: statusConfig.bg,
                            color: statusConfig.color,
                            border: `1px solid ${statusConfig.border}`,
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "0.72rem",
                            fontWeight: "700",
                            textTransform: "uppercase"
                          }}>
                            {statusConfig.label}
                          </span>
                        </div>

                        {/* Timestamp */}
                        <span style={{ 
                          fontSize: "0.82rem", 
                          color: "#64748b", 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "5px", 
                          flexShrink: 0, 
                          background: "#f8fafc", 
                          padding: "3px 10px", 
                          borderRadius: "8px", 
                          fontWeight: "600",
                          border: "1px solid #f1f5f9"
                        }}>
                          <Clock size={13} color="#94a3b8" /> {formatLogTime(log.timestamp)}
                        </span>
                      </div>

                      {/* Main Message Title */}
                      <p style={{ margin: "0 0 6px 0", color: "#0f172a", fontWeight: "700", fontSize: "1.02rem", lineHeight: "1.45" }}>
                        {displayMessage}
                      </p>

                      {/* Optional Detailed Remarks Subcard */}
                      {hasSeparateDetails && (
                        <div style={{ 
                          background: "#f8fafc", 
                          border: "1px solid #e2e8f0", 
                          borderRadius: "10px", 
                          padding: "8px 12px", 
                          margin: "6px 0 8px 0", 
                          fontSize: "0.88rem", 
                          color: "#475569",
                          borderLeft: "3px solid #3b82f6"
                        }}>
                          {log.details}
                        </div>
                      )}

                      {/* Bottom Meta Line: Actor / User & IP */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px", flexWrap: "wrap", fontSize: "0.82rem" }}>
                        <span style={{ color: "#334155", display: "flex", alignItems: "center", gap: "6px", background: "#f1f5f9", padding: "3px 10px", borderRadius: "20px", fontWeight: "600" }}>
                          <User size={13} color="#64748b" /> {displayUser}
                        </span>

                        {log.ipAddress && (
                          <span style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Globe size={13} /> {log.ipAddress}
                          </span>
                        )}

                        {log.action && (
                          <span style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: "0.75rem" }}>
                            [{log.action}]
                          </span>
                        )}
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
  );
}

