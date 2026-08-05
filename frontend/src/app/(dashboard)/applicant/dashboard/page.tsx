"use client";

import React, { useState } from "react";
import { usePermitContext } from "../../../../context/PermitContext";
import { Search, Plus, Filter, Bell, User, Clock, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import Link from "next/link";

export default function ApplicantDashboard() {
  const { applications } = usePermitContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userName, setUserName] = useState("Applicant");

  React.useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj.name) setUserName(userObj.name);
      }
    } catch (e) {}
  }, []);

  // Filter by the actual logged-in applicant name
  const applicantApps = applications.filter(app => app.applicantName === userName);

  const filteredApps = applicantApps.filter(app => {
    const matchesSearch = app.projectName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: applicantApps.length,
    pending: applicantApps.filter(a => a.status === "pending").length,
    review: applicantApps.filter(a => a.status === "under_review").length,
    approved: applicantApps.filter(a => ["approved", "released"].includes(a.status)).length,
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case "pending": return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", icon: Clock, label: "Pending", border: "#fcd34d" };
      case "under_review": return { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)", icon: Search, label: "Under Review", border: "#93c5fd" };
      case "approved": 
      case "released": return { color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", icon: CheckCircle2, label: "Approved", border: "#6ee7b7" };
      case "incomplete_requirements": return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", icon: AlertTriangle, label: "Action Required", border: "#fca5a5" };
      default: return { color: "#64748b", bg: "rgba(100, 116, 139, 0.15)", icon: FileText, label: "Unknown", border: "#cbd5e1" };
    }
  };

  return (
    <div className="dashboard-page animate-fade-in-up">
      <header className="page-header" style={{ 
        background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.4))",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.4)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.05)",
        borderRadius: "20px",
        padding: "2rem",
        marginBottom: "2rem"
      }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "2rem", fontWeight: "800", background: "linear-gradient(90deg, #1d4ed8, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Applicant Dashboard</h1>
          <p className="page-subtitle" style={{ fontSize: "1.1rem", marginTop: "0.5rem", color: "#475569" }}>Welcome back, <strong style={{color: "#1e293b"}}>{userName}</strong>! Here is an overview of your permit applications.</p>
        </div>
        <Link href="/applicant/apply" className="btn-primary" style={{
          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
          boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
          transform: "translateY(0)",
          transition: "all 0.3s ease"
        }}>
          <Plus size={18} /> New Application
        </Link>
      </header>

      <section className="stats-grid">
        <div className="stat-card" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.5))", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 8px 24px rgba(0,0,0,0.04)", borderRadius: "16px", transition: "transform 0.3s ease, box-shadow 0.3s ease" }}>
          <div className="stat-icon" style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)", color: "#1d4ed8", boxShadow: "0 4px 10px rgba(29, 78, 216, 0.15)" }}>
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value" style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a" }}>{stats.total}</span>
            <span className="stat-label" style={{ fontWeight: "600", color: "#64748b" }}>Total Applications</span>
          </div>
        </div>
        <div className="stat-card" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.5))", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 8px 24px rgba(0,0,0,0.04)", borderRadius: "16px", transition: "transform 0.3s ease, box-shadow 0.3s ease" }}>
          <div className="stat-icon" style={{ background: "linear-gradient(135deg, #fffbeb, #fef3c7)", color: "#d97706", boxShadow: "0 4px 10px rgba(245, 158, 11, 0.15)" }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value" style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a" }}>{stats.pending}</span>
            <span className="stat-label" style={{ fontWeight: "600", color: "#64748b" }}>Pending</span>
          </div>
        </div>
        <div className="stat-card" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.5))", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 8px 24px rgba(0,0,0,0.04)", borderRadius: "16px", transition: "transform 0.3s ease, box-shadow 0.3s ease" }}>
          <div className="stat-icon" style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", color: "#059669", boxShadow: "0 4px 10px rgba(16, 185, 129, 0.15)" }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value" style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a" }}>{stats.approved}</span>
            <span className="stat-label" style={{ fontWeight: "600", color: "#64748b" }}>Approved</span>
          </div>
        </div>
      </section>

      <section className="applications-section" style={{ marginTop: "2rem", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.8)", borderRadius: "24px", padding: "2rem", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
        <div className="section-header" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b" }}>Recent Applications</h2>
          <div className="filters">
            <div className="search-bar" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
              <Search size={18} className="search-icon" color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Search projects..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: "transparent", fontWeight: "500" }}
              />
            </div>
            <select 
              className="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", fontWeight: "600", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="incomplete_requirements">Action Required</option>
            </select>
          </div>
        </div>

        <div className="app-grid">
          {filteredApps.length === 0 ? (
            <div className="empty-state" style={{ background: "rgba(255,255,255,0.5)", borderRadius: "16px", border: "2px dashed #cbd5e1" }}>
              <FileText size={48} color="#94a3b8" />
              <h3 style={{ color: "#475569", marginTop: "1rem" }}>No applications found</h3>
              <p style={{ color: "#64748b" }}>Try adjusting your search or filters.</p>
            </div>
          ) : (
            filteredApps.map(app => {
              const statusConfig = getStatusConfig(app.status);
              const StatusIcon = statusConfig.icon;
              return (
                <Link href={`/applicant/track/${app.id}`} key={app.id} className="app-card" style={{
                  background: "#ffffff",
                  border: `1px solid #f1f5f9`,
                  borderLeft: `4px solid ${statusConfig.border}`,
                  borderRadius: "16px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer",
                }}>
                  <div className="app-card-header">
                    <span className="app-id" style={{ background: "#f8fafc", color: "#475569", fontWeight: "700", padding: "4px 10px", borderRadius: "8px" }}>{app.id}</span>
                    <span className="app-status" style={{ backgroundColor: statusConfig.bg, color: statusConfig.color, fontWeight: "700", padding: "6px 12px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <StatusIcon size={14} strokeWidth={2.5} /> {statusConfig.label}
                    </span>
                  </div>
                  <h3 className="app-title" style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", marginTop: "1.5rem" }}>{app.projectName}</h3>
                  <p className="app-type" style={{ color: "#64748b", fontWeight: "500", marginTop: "0.25rem", textTransform: "capitalize" }}>{app.permitType.replace("_", " ")}</p>
                  <div className="app-footer" style={{ marginTop: "2rem", borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
                    <span className="app-date" style={{ color: "#94a3b8", fontWeight: "600", fontSize: "0.875rem" }}>Submitted: {app.dateSubmitted}</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>

    </div>
  );
}
