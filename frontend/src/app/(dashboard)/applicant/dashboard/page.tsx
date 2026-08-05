"use client";

import React, { useState } from "react";
import { usePermitContext } from "../../../../context/PermitContext";
import { Search, Plus, Filter, Bell, User, Clock, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import Link from "next/link";

export default function ApplicantDashboard() {
  const { applications } = usePermitContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // In a real app, this would be filtered by the logged-in user's ID
  const applicantApps = applications.filter(app => app.applicantName === "Juan Dela Cruz");

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
      case "pending": return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", icon: Clock, label: "Pending" };
      case "under_review": return { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", icon: Search, label: "Under Review" };
      case "approved": 
      case "released": return { color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", icon: CheckCircle2, label: "Approved" };
      case "incomplete_requirements": return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", icon: AlertTriangle, label: "Action Required" };
      default: return { color: "#64748b", bg: "rgba(100, 116, 139, 0.1)", icon: FileText, label: "Unknown" };
    }
  };

  return (
    <div className="dashboard-page animate-fade-in-up">
      <header className="page-header">
        <div>
          <h1 className="page-title">Applicant Dashboard</h1>
          <p className="page-subtitle">Welcome back, Juan. Here is an overview of your permit applications.</p>
        </div>
        <Link href="/applicant/apply" className="btn-primary">
          <Plus size={18} /> New Application
        </Link>
      </header>

      <section className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: "rgba(29, 78, 216, 0.1)", color: "var(--color-primary)" }}>
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Applications</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
            <Search size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.review}</span>
            <span className="stat-label">Under Review</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.approved}</span>
            <span className="stat-label">Approved</span>
          </div>
        </div>
      </section>

      <section className="applications-section glass-panel">
        <div className="section-header">
          <h2>Recent Applications</h2>
          <div className="filters">
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search projects..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
            <div className="empty-state">
              <FileText size={48} />
              <h3>No applications found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          ) : (
            filteredApps.map(app => {
              const statusConfig = getStatusConfig(app.status);
              const StatusIcon = statusConfig.icon;
              return (
                <Link href={`/applicant/track/${app.id}`} key={app.id} className="app-card card transition-normal">
                  <div className="app-card-header">
                    <span className="app-id">{app.id}</span>
                    <span className="app-status" style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}>
                      <StatusIcon size={14} /> {statusConfig.label}
                    </span>
                  </div>
                  <h3 className="app-title">{app.projectName}</h3>
                  <p className="app-type">{app.permitType.replace("_", " ")}</p>
                  <div className="app-footer">
                    <span className="app-date">{app.dateSubmitted}</span>
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
