"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePermitContext } from "../../../../context/PermitContext";
import { Search, Plus, Filter, Bell, User, Clock, CheckCircle2, AlertTriangle, FileText, Archive } from "lucide-react";
import Link from "next/link";
import Skeleton from "@/components/ui/Skeleton";

export default function ApplicantDashboard() {
  const { applications } = usePermitContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userName, setUserName] = useState("Applicant");
  const [userEmail, setUserEmail] = useState("");
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "info" } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const showToast = (text: string, type: "success" | "info" = "info") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj.name) setUserName(userObj.name);
        if (userObj.email) setUserEmail(userObj.email);
      }
    } catch (e) {}

    const syncArchived = () => {
      try {
        const savedArchived = localStorage.getItem("etayo_archived_application_ids");
        if (savedArchived) {
          const parsed = JSON.parse(savedArchived);
          if (Array.isArray(parsed)) {
            setArchivedIds(parsed);
          }
        } else {
          setArchivedIds([]);
        }
      } catch (e) {}
    };

    syncArchived();

    window.addEventListener("storage", syncArchived);
    window.addEventListener("etayo_archive_changed", syncArchived);

    // Simulate network request to show off skeleton loading UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("storage", syncArchived);
      window.removeEventListener("etayo_archive_changed", syncArchived);
    };
  }, []);

  // Filter by the actual logged-in applicant name or email
  const applicantApps = useMemo(() => {
    const email = (userEmail || "").toLowerCase().trim();
    const name = (userName || "").toLowerCase().trim();

    return (applications || []).filter(app => {
      const appEmail = (app.applicantEmail || "").toLowerCase().trim();
      const appName = (app.applicantName || "").toLowerCase().trim();

      const matchEmail = Boolean(email && appEmail && (appEmail === email || appEmail.includes(email)));
      const matchName = Boolean(name && appName && (appName === name || appName.includes(name)));

      return matchEmail || matchName || (name !== "applicant" && appName === name);
    });
  }, [applications, userEmail, userName]);

  // Exclude all archived applications so they NEVER appear in Recent Applications
  const activeApplicantApps = useMemo(() => {
    return applicantApps.filter(app => !archivedIds.includes(app.id));
  }, [applicantApps, archivedIds]);

  const archivedCount = useMemo(() => {
    return applicantApps.filter(app => archivedIds.includes(app.id)).length;
  }, [applicantApps, archivedIds]);

  const filteredApps = useMemo(() => {
    return activeApplicantApps.filter(app => {
      const matchesSearch = app.projectName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            app.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [activeApplicantApps, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: activeApplicantApps.length,
    pending: activeApplicantApps.filter(a => a.status === "pending").length,
    review: activeApplicantApps.filter(a => a.status === "under_review").length,
    approved: activeApplicantApps.filter(a => ["approved", "released"].includes(a.status)).length,
  }), [activeApplicantApps]);

  const handleArchiveCard = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = Array.from(new Set([...archivedIds, id]));
    setArchivedIds(next);
    try {
      localStorage.setItem("etayo_archived_application_ids", JSON.stringify(next));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("etayo_archive_changed"));
      }
    } catch (err) {}
    showToast(`Application ${id} moved to archive.`, "info");
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

  if (isLoading) {
    return (
      <div className="dashboard-page p-8">
        <Skeleton className="h-32 w-full mb-8 rounded-2xl" />
        <div className="flex gap-6 mb-12">
          <Skeleton className="h-32 flex-1 rounded-2xl" />
          <Skeleton className="h-32 flex-1 rounded-2xl" />
          <Skeleton className="h-32 flex-1 rounded-2xl" />
        </div>
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page animate-fade-in-up">
      <header className="page-header" style={{ 
        background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.9)",
        boxShadow: "0 10px 35px rgba(0, 0, 0, 0.14)",
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
        <div className="stat-card" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 10px 30px rgba(0,0,0,0.12)", borderRadius: "18px", transition: "transform 0.3s ease, box-shadow 0.3s ease" }}>
          <div className="stat-icon" style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)", color: "#1d4ed8", boxShadow: "0 4px 10px rgba(29, 78, 216, 0.15)" }}>
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value" style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a" }}>{stats.total}</span>
            <span className="stat-label" style={{ fontWeight: "600", color: "#64748b" }}>Total Applications</span>
          </div>
        </div>
        <div className="stat-card" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 10px 30px rgba(0,0,0,0.12)", borderRadius: "18px", transition: "transform 0.3s ease, box-shadow 0.3s ease" }}>
          <div className="stat-icon" style={{ background: "linear-gradient(135deg, #fffbeb, #fef3c7)", color: "#d97706", boxShadow: "0 4px 10px rgba(245, 158, 11, 0.15)" }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value" style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a" }}>{stats.pending}</span>
            <span className="stat-label" style={{ fontWeight: "600", color: "#64748b" }}>Pending</span>
          </div>
        </div>
        <div className="stat-card" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 10px 30px rgba(0,0,0,0.12)", borderRadius: "18px", transition: "transform 0.3s ease, box-shadow 0.3s ease" }}>
          <div className="stat-icon" style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", color: "#059669", boxShadow: "0 4px 10px rgba(16, 185, 129, 0.15)" }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value" style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a" }}>{stats.approved}</span>
            <span className="stat-label" style={{ fontWeight: "600", color: "#64748b" }}>Approved</span>
          </div>
        </div>
      </section>

      <section className="applications-section" style={{ marginTop: "2rem", background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.9)", borderRadius: "24px", padding: "2rem", boxShadow: "0 12px 40px rgba(0,0,0,0.14)" }}>
        <div className="section-header" style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: 0 }}>Recent Applications</h2>
            {archivedCount > 0 && (
              <Link
                href="/applicant/track?tab=archived"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.82rem",
                  fontWeight: "700",
                  padding: "5px 12px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
                  color: "#6d28d9",
                  border: "1px solid #ddd6fe",
                  textDecoration: "none",
                  boxShadow: "0 2px 6px rgba(109, 40, 217, 0.08)",
                  transition: "all 0.2s ease",
                }}
                title="View all archived applications in Application Status"
              >
                <Archive size={14} color="#7c3aed" />
                <span>{archivedCount} Archived</span>
              </Link>
            )}
          </div>
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
                  <div className="app-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="app-id" style={{ background: "#f8fafc", color: "#475569", fontWeight: "700", padding: "4px 10px", borderRadius: "8px" }}>{app.id}</span>
                      <button
                        type="button"
                        onClick={(e) => handleArchiveCard(app.id, e)}
                        title="Archive application (removes from Recent Applications)"
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          padding: "4px 8px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          color: "#64748b",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#ede9fe";
                          e.currentTarget.style.color = "#6d28d9";
                          e.currentTarget.style.borderColor = "#c4b5fd";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#f8fafc";
                          e.currentTarget.style.color = "#64748b";
                          e.currentTarget.style.borderColor = "#e2e8f0";
                        }}
                      >
                        <Archive size={13} />
                        <span>Archive</span>
                      </button>
                    </div>
                    <span className="app-status" style={{ backgroundColor: statusConfig.bg, color: statusConfig.color, fontWeight: "700", padding: "6px 12px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
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

      {toastMsg && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          background: "#0f172a",
          color: "#ffffff",
          padding: "12px 20px",
          borderRadius: "14px",
          fontSize: "0.9rem",
          fontWeight: "600",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          zIndex: 9999,
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <Archive size={16} color="#c084fc" />
          <span>{toastMsg.text}</span>
        </div>
      )}

    </div>
  );
}
