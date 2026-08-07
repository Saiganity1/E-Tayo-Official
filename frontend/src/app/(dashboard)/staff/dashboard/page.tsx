"use client";

import React, { useState } from "react";
import { usePermitContext } from "../../../../context/PermitContext";
import { Search, Filter, AlertCircle, FileCheck, MapPin, Eye, ChevronDown } from "lucide-react";
import Link from "next/link";

export default function StaffDashboard() {
  const { applications } = usePermitContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredApps = applications.filter(app => {
    const matchesSearch = app.projectName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicantName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || app.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
      case 'rejected': return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      case 'under_review': return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
      case 'pending': 
      default: return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
    }
  };

  return (
    <div className="dashboard-page animate-fade-in-up">
      <header className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "2.25rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <FileCheck size={32} color="#1d4ed8" /> Staff Evaluation Hub
          </h1>
          <p className="page-subtitle" style={{ fontSize: "1.1rem", color: "#64748b" }}>Review, process, and approve pending permit applications.</p>
        </div>
      </header>

      <section style={{ background: "white", padding: "2rem", borderRadius: "24px", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), 0 0 0 1px rgba(226, 232, 240, 0.8) inset" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2rem" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "0.5rem 1rem", flex: "1", minWidth: "300px", transition: "all 0.2s", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}>
              <Search size={18} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Search by ID, applicant, or project..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: "none", background: "transparent", outline: "none", padding: "0.5rem", width: "100%", color: "#334155", fontSize: "0.95rem" }}
              />
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              style={{ background: showFilters ? "#eff6ff" : "white", border: `1px solid ${showFilters ? "#bfdbfe" : "#e2e8f0"}`, color: showFilters ? "#1d4ed8" : "#64748b", padding: "0.75rem 1.25rem", borderRadius: "14px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}
            >
              <Filter size={18} /> Filters <ChevronDown size={16} style={{ transform: showFilters ? "rotate(180deg)" : "rotate(0)", transition: "0.2s" }} />
            </button>
          </div>

          {showFilters && (
            <div className="animate-fade-in-up" style={{ display: "flex", gap: "10px", flexWrap: "wrap", padding: "1rem", background: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              {['all', 'pending', 'under_review', 'approved', 'rejected'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  style={{
                    padding: "0.5rem 1.25rem",
                    borderRadius: "99px",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    textTransform: "capitalize",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: filterStatus === status ? "#1d4ed8" : "white",
                    color: filterStatus === status ? "white" : "#64748b",
                    border: `1px solid ${filterStatus === status ? "#1d4ed8" : "#cbd5e1"}`,
                    boxShadow: filterStatus === status ? "0 4px 10px rgba(29,78,216,0.3)" : "none"
                  }}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ overflowX: "auto", borderRadius: "16px", border: "1px solid #e2e8f0", background: "#f8fafc" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
            <thead>
              <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "0.85rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>App ID</th>
                <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "0.85rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Applicant</th>
                <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "0.85rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Project Details</th>
                <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "0.85rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</th>
                <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "0.85rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "0.85rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "4rem 2rem", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: "#94a3b8" }}>
                      <Search size={40} opacity={0.5} />
                      <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600" }}>No applications found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApps.map((app, i) => {
                  const statusStyle = getStatusColor(app.status);
                  return (
                    <tr key={app.id} style={{ background: "white", borderBottom: i === filteredApps.length - 1 ? "none" : "1px solid #e2e8f0", transition: "all 0.2s" }} className="hover:bg-slate-50">
                      <td style={{ padding: "1.25rem 1.5rem" }}>
                        <span style={{ background: "#f1f5f9", padding: "6px 12px", borderRadius: "8px", fontSize: "0.9rem", fontWeight: "700", color: "#475569", letterSpacing: "0.02em", border: "1px solid #e2e8f0" }}>
                          {app.id}
                        </span>
                      </td>
                      <td style={{ padding: "1.25rem 1.5rem" }}>
                        <div style={{ fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>{app.applicantName}</div>
                        <div style={{ fontSize: "0.85rem", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                          {app.applicantPhone}
                        </div>
                      </td>
                      <td style={{ padding: "1.25rem 1.5rem" }}>
                        <div style={{ fontWeight: "600", color: "#334155", marginBottom: "6px" }}>{app.projectName}</div>
                        <div style={{ fontSize: "0.85rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
                          <MapPin size={14} color="#cbd5e1" /> {app.projectAddress}
                        </div>
                      </td>
                      <td style={{ padding: "1.25rem 1.5rem", textTransform: "capitalize", fontWeight: "500", color: "#475569" }}>
                        {app.permitType.replace("_", " ")}
                      </td>
                      <td style={{ padding: "1.25rem 1.5rem" }}>
                        <span style={{ 
                          background: statusStyle.bg, 
                          color: statusStyle.color, 
                          border: `1px solid ${statusStyle.border}`,
                          padding: "6px 12px", 
                          borderRadius: "99px", 
                          fontSize: "0.75rem", 
                          fontWeight: "800", 
                          textTransform: "uppercase", 
                          letterSpacing: "0.05em",
                          display: "inline-block"
                        }}>
                          {app.status.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ padding: "1.25rem 1.5rem" }}>
                        <Link 
                          href={`/staff/evaluate/${app.id}`} 
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "white", border: "1px solid #cbd5e1", color: "#0f172a", padding: "8px 16px", borderRadius: "10px", fontWeight: "600", fontSize: "0.9rem", transition: "all 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", textDecoration: "none" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#94a3b8"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
                        >
                          <Eye size={16} color="#3b82f6" /> Evaluate
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
