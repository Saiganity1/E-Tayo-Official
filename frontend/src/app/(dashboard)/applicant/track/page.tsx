"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePermitContext } from "../../../../context/PermitContext";
import { 
  Search, Plus, Clock, CheckCircle2, AlertTriangle, 
  FileText, CheckCircle, ChevronRight, Copy, Check, 
  MapPin, Sparkles, Layers, ShieldCheck, ArrowRight, MessageSquare, Lock
} from "lucide-react";

export default function ApplicationStatusPage() {
  const router = useRouter();
  const { applications } = usePermitContext();

  const [trackId, setTrackId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [userName, setUserName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (token && userStr) {
        const userObj = JSON.parse(userStr);
        setIsLoggedIn(true);
        setCurrentUser(userObj);
        if (userObj.name) setUserName(userObj.name);
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setUserName("");
      }
    } catch (e) {
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  }, []);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackId.trim()) {
      router.push(`/applicant/track/${trackId.trim()}`);
    }
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Strictly filter applications for the active logged-in applicant (NO leak for guests or incognito)
  const myApplications = useMemo(() => {
    if (!isLoggedIn || !currentUser) {
      // Unauthenticated guests must NEVER see private applications
      return [];
    }

    const email = (currentUser.email || "").toLowerCase().trim();
    const name = (currentUser.name || "").toLowerCase().trim();

    return (applications || []).filter(app => {
      const appEmail = (app.applicantEmail || "").toLowerCase().trim();
      const appName = (app.applicantName || "").toLowerCase().trim();

      const matchEmail = Boolean(email && appEmail && (appEmail === email || appEmail.includes(email)));
      const matchName = Boolean(name && appName && (appName === name || appName.includes(name)));

      return matchEmail || matchName;
    });
  }, [applications, isLoggedIn, currentUser]);

  const filteredApps = myApplications.filter(app => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch = !query ||
      (app.projectName && app.projectName.toLowerCase().includes(query)) ||
      (app.id && app.id.toLowerCase().includes(query)) ||
      (app.projectType && app.projectType.toLowerCase().includes(query)) ||
      (app.permitType && app.permitType.toLowerCase().includes(query)) ||
      (app.projectAddress && app.projectAddress.toLowerCase().includes(query));

    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "approved" ? ["approved", "released"].includes(app.status) : app.status === statusFilter);

    const matchesType = typeFilter === "all" ||
      (typeFilter === "locational_clearance" ? app.permitType === "locational_clearance" : app.permitType !== "locational_clearance");

    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: myApplications.length,
    pending: myApplications.filter(a => a.status === "pending").length,
    review: myApplications.filter(a => a.status === "under_review").length,
    approved: myApplications.filter(a => ["approved", "released"].includes(a.status)).length,
    action: myApplications.filter(a => a.status === "incomplete_requirements").length,
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case "pending":
        return { color: "#d97706", bg: "#fef3c7", border: "#f59e0b", icon: Clock, label: "Pending Review", step: 1 };
      case "under_review":
        return { color: "#2563eb", bg: "#dbeafe", border: "#3b82f6", icon: Search, label: "Under Evaluation", step: 2 };
      case "incomplete_requirements":
        return { color: "#dc2626", bg: "#fee2e2", border: "#ef4444", icon: AlertTriangle, label: "Action Required", step: 2 };
      case "approved":
        return { color: "#059669", bg: "#d1fae5", border: "#10b981", icon: CheckCircle2, label: "Approved", step: 3 };
      case "released":
        return { color: "#059669", bg: "#dcfce7", border: "#16a34a", icon: CheckCircle, label: "Permit Released", step: 4 };
      default:
        return { color: "#64748b", bg: "#f1f5f9", border: "#94a3b8", icon: FileText, label: "Processing", step: 1 };
    }
  };

  return (
    <div className="dashboard-page animate-fade-in-up">
      {/* HEADER */}
      <header className="page-header" style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.65))",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.6)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04)",
        borderRadius: "20px",
        padding: "2rem",
        marginBottom: "2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1.25rem"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
            <span style={{
              background: "#eff6ff",
              color: "#2563eb",
              fontSize: "0.75rem",
              fontWeight: "700",
              padding: "3px 10px",
              borderRadius: "999px"
            }}>
              MUNICIPAL PERMIT PORTAL
            </span>
            <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Sto. Tomas, Pampanga</span>
          </div>
          <h1 className="page-title" style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
            Application Status
          </h1>
          <p className="page-subtitle" style={{ fontSize: "1rem", marginTop: "0.35rem", color: "#475569" }}>
            Monitor real-time evaluation stages, zoning clearances, and official permits for your projects.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <Link href={isLoggedIn ? "/applicant/apply" : "/login?redirect=/applicant/apply"} className="btn-primary" style={{
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
            padding: "0.75rem 1.4rem",
            borderRadius: "12px",
            fontWeight: "700",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.95rem"
          }}>
            <Plus size={18} /> New Permit Application
          </Link>
        </div>
      </header>

      {/* GUEST BANNER OR STATS OVERVIEW CARDS */}
      {!isLoggedIn ? (
        <section style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          color: "white",
          borderRadius: "20px",
          padding: "2rem 2.25rem",
          marginBottom: "2rem",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1.5rem"
        }}>
          <div style={{ maxWidth: "650px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.12)", padding: "4px 12px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: "600", color: "#93c5fd", marginBottom: "0.75rem" }}>
              <ShieldCheck size={14} /> Official Municipal Permit Tracking Portal
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "800", margin: "0 0 0.5rem 0", color: "#ffffff" }}>
              Track Application Progress & Evaluation Status
            </h2>
            <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.95rem", lineHeight: "1.5" }}>
              Have an official Tracking ID receipt? Enter it into the Direct Tracking Lookup below to inspect evaluation milestones. Sign in to your account to view your private application history.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link href="/login?redirect=/applicant/track" className="btn-primary" style={{ background: "#2563eb", color: "white", padding: "0.75rem 1.4rem", borderRadius: "12px", fontWeight: "700", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              Sign In to View Applications <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      ) : (
        <section className="stats-grid" style={{ marginBottom: "2rem" }}>
          <div 
            onClick={() => setStatusFilter("all")}
            className="stat-card" 
            style={{ 
              background: statusFilter === "all" ? "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)" : "white", 
              borderRadius: "16px", 
              padding: "1.25rem", 
              border: statusFilter === "all" ? "2px solid #2563eb" : "1px solid #f1f5f9", 
              boxShadow: statusFilter === "all" ? "0 8px 24px rgba(37, 99, 235, 0.15)" : "0 4px 16px rgba(0,0,0,0.03)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            title="Click to show all applications"
          >
            <div className="stat-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
              <FileText size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value" style={{ fontSize: "1.8rem", fontWeight: "800", color: "#0f172a" }}>{stats.total}</span>
              <span className="stat-label" style={{ fontWeight: "600", color: statusFilter === "all" ? "#2563eb" : "#64748b" }}>
                Total Applications {statusFilter === "all" && "• Active"}
              </span>
            </div>
          </div>

          <div 
            onClick={() => setStatusFilter("pending")}
            className="stat-card" 
            style={{ 
              background: statusFilter === "pending" ? "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)" : "white", 
              borderRadius: "16px", 
              padding: "1.25rem", 
              border: statusFilter === "pending" ? "2px solid #d97706" : "1px solid #f1f5f9", 
              boxShadow: statusFilter === "pending" ? "0 8px 24px rgba(217, 119, 6, 0.15)" : "0 4px 16px rgba(0,0,0,0.03)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            title="Click to filter by Pending Review"
          >
            <div className="stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value" style={{ fontSize: "1.8rem", fontWeight: "800", color: "#0f172a" }}>{stats.pending}</span>
              <span className="stat-label" style={{ fontWeight: "600", color: statusFilter === "pending" ? "#d97706" : "#64748b" }}>
                Pending Review {statusFilter === "pending" && "• Active"}
              </span>
            </div>
          </div>

          <div 
            onClick={() => setStatusFilter("under_review")}
            className="stat-card" 
            style={{ 
              background: statusFilter === "under_review" ? "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)" : "white", 
              borderRadius: "16px", 
              padding: "1.25rem", 
              border: statusFilter === "under_review" ? "2px solid #2563eb" : "1px solid #f1f5f9", 
              boxShadow: statusFilter === "under_review" ? "0 8px 24px rgba(37, 99, 235, 0.15)" : "0 4px 16px rgba(0,0,0,0.03)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            title="Click to filter by Under Evaluation"
          >
            <div className="stat-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>
              <Search size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value" style={{ fontSize: "1.8rem", fontWeight: "800", color: "#0f172a" }}>{stats.review}</span>
              <span className="stat-label" style={{ fontWeight: "600", color: statusFilter === "under_review" ? "#2563eb" : "#64748b" }}>
                Under Evaluation {statusFilter === "under_review" && "• Active"}
              </span>
            </div>
          </div>

          <div 
            onClick={() => setStatusFilter("approved")}
            className="stat-card" 
            style={{ 
              background: statusFilter === "approved" ? "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)" : "white", 
              borderRadius: "16px", 
              padding: "1.25rem", 
              border: statusFilter === "approved" ? "2px solid #059669" : "1px solid #f1f5f9", 
              boxShadow: statusFilter === "approved" ? "0 8px 24px rgba(5, 150, 105, 0.15)" : "0 4px 16px rgba(0,0,0,0.03)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            title="Click to filter by Approved & Released"
          >
            <div className="stat-icon" style={{ background: "#d1fae5", color: "#059669" }}>
              <CheckCircle2 size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value" style={{ fontSize: "1.8rem", fontWeight: "800", color: "#0f172a" }}>{stats.approved}</span>
              <span className="stat-label" style={{ fontWeight: "600", color: statusFilter === "approved" ? "#059669" : "#64748b" }}>
                Approved & Released {statusFilter === "approved" && "• Active"}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* QUICK TRACKING LOOKUP BAR */}
      <section style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid #e2e8f0",
        borderRadius: "18px",
        padding: "1.5rem 1.75rem",
        marginBottom: "2rem",
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.1rem", fontWeight: "700", color: "#1e293b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Search size={18} color="#2563eb" /> Direct Tracking ID Lookup
            </h3>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
              Have an official Tracking ID (e.g. <code>LC-2026-4157</code>, <code>BP-2025-0005</code>)? Enter it to open the full evaluation audit trail.
            </p>
          </div>

          <form onSubmit={handleTrackSubmit} style={{ display: "flex", gap: "0.5rem", flex: 1, maxWidth: "440px", minWidth: "260px" }}>
            <input 
              type="text" 
              placeholder="e.g. LC-2026-4157"
              value={trackId}
              onChange={e => setTrackId(e.target.value)}
              style={{
                flex: 1,
                padding: "0.65rem 1rem",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "0.95rem",
                background: "white",
                outline: "none"
              }}
            />
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ padding: "0.65rem 1.25rem", borderRadius: "10px", whiteSpace: "nowrap" }}
              disabled={!trackId.trim()}
            >
              Track ID
            </button>
          </form>
        </div>

        {/* QUICK CLICK CHIPS OF CURRENT USER'S APPLICATIONS */}
        {isLoggedIn && myApplications && myApplications.length > 0 && (
          <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #e2e8f0", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
              Your Applications:
            </span>
            {myApplications.slice(0, 4).map(app => (
              <button
                key={app.id}
                type="button"
                onClick={() => router.push(`/applicant/track/${app.id}`)}
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "3px 10px",
                  fontSize: "0.76rem",
                  fontWeight: "700",
                  color: "#1e40af",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.background = "#eff6ff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#ffffff"; }}
                title={`Open audit trail for ${app.projectName || app.id}`}
              >
                <span>{app.id}</span>
                <span style={{ color: "#64748b", fontWeight: "500" }}>({app.projectName ? app.projectName.slice(0, 18) : "Application"})</span>
                <ChevronRight size={11} />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* RECENT APPLICATIONS SECTION */}
      <section className="applications-section" style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.8)",
        borderRadius: "24px",
        padding: "2rem",
        boxShadow: "0 10px 40px rgba(0,0,0,0.03)"
      }}>
        {/* SECTION HEADER WITH FILTERS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.75rem" }}>
          <div>
            <h2 style={{ fontSize: "1.45rem", fontWeight: "800", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "0.6rem" }}>
              Recent Applications
              <span style={{ fontSize: "0.8rem", background: "#f1f5f9", color: "#475569", padding: "2px 10px", borderRadius: "999px", fontWeight: "700" }}>
                {filteredApps.length}
              </span>
            </h2>
            <p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.88rem" }}>
              Detailed list of your submitted permits and clearance certificates.
            </p>
          </div>

          {isLoggedIn && (
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
              {/* Search Input */}
              <div style={{ position: "relative", minWidth: "220px" }}>
                <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input 
                  type="text" 
                  placeholder="Search applications..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: "0.6rem 1rem 0.6rem 2.25rem",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    background: "white",
                    fontSize: "0.88rem",
                    width: "100%"
                  }}
                />
              </div>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{
                  padding: "0.6rem 0.85rem",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "white",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "#334155"
                }}
              >
                <option value="all">All Types</option>
                <option value="locational_clearance">Locational Clearance (Annex D)</option>
                <option value="unified_permit">Unified Project Permits</option>
              </select>

              {/* Status Filter */}
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "0.6rem 0.85rem",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "white",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "#334155"
                }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Evaluation</option>
                <option value="approved">Approved / Released</option>
                <option value="incomplete_requirements">Action Required</option>
              </select>
            </div>
          )}
        </div>

        {/* APPLICATIONS LIST */}
        {!isLoggedIn ? (
          <div style={{
            background: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e2e8f0",
            padding: "3.5rem 2rem",
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
          }}>
            <div style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              background: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem auto",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.15)"
            }}>
              <Lock size={32} />
            </div>
            <h3 style={{ fontSize: "1.35rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.5rem 0" }}>
              Sign In to View Your Application History
            </h3>
            <p style={{ margin: "0 auto 1.75rem auto", color: "#64748b", fontSize: "0.95rem", maxWidth: "520px", lineHeight: "1.5" }}>
              Personal applications and clearance certificates are strictly protected. Sign in with your registered e-Tayo account to securely view your permits, review notes, and approved documents.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
              <Link href="/login?redirect=/applicant/track" className="btn-primary" style={{ padding: "0.75rem 1.6rem", borderRadius: "12px", fontWeight: "700" }}>
                Sign In to Account
              </Link>
              <Link href="/register" className="btn-secondary" style={{ padding: "0.75rem 1.6rem", borderRadius: "12px", fontWeight: "600", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#334155" }}>
                Register New Account
              </Link>
            </div>
          </div>
        ) : filteredApps.length === 0 ? (
          <div style={{
            background: "rgba(255,255,255,0.6)",
            borderRadius: "20px",
            border: "2px dashed #cbd5e1",
            padding: "3.5rem 2rem",
            textAlign: "center"
          }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#f1f5f9",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem auto"
            }}>
              <FileText size={32} />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#334155", margin: "0 0 0.4rem 0" }}>
              No applications found
            </h3>
            <p style={{ margin: "0 0 1.5rem 0", color: "#64748b", fontSize: "0.9rem" }}>
              {searchTerm || statusFilter !== "all" || typeFilter !== "all" 
                ? "No permits match your search filters. Try resetting your filters."
                : "You have not submitted any permit applications under this account yet."}
            </p>
            <Link href="/applicant/apply" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <Plus size={16} /> File New Application
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {filteredApps.map(app => {
              const statusConfig = getStatusConfig(app.status);
              const StatusIcon = statusConfig.icon;
              const isLocationalClearance = app.permitType === "locational_clearance";
              const isApprovedLC = isLocationalClearance && (app.status === "approved" || app.status === "released");

              return (
                <div 
                  key={app.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "18px",
                    border: "1px solid #e2e8f0",
                    borderLeft: `5px solid ${statusConfig.border}`,
                    padding: "1.5rem",
                    boxShadow: "0 4px 18px rgba(0,0,0,0.03)",
                    transition: "all 0.2s ease"
                  }}
                >
                  {/* TOP HEADER ROW */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                      {/* Tracking ID Badge with Copy */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyId(app.id, e)}
                        title="Click to copy Tracking ID"
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          padding: "4px 10px",
                          fontSize: "0.85rem",
                          fontWeight: "700",
                          color: "#1e293b",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <code>{app.id}</code>
                        {copiedId === app.id ? (
                          <Check size={13} color="#16a34a" />
                        ) : (
                          <Copy size={13} color="#64748b" />
                        )}
                      </button>

                      {/* Permit Type Tag */}
                      {isLocationalClearance ? (
                        <span style={{
                          background: "#eff6ff",
                          color: "#1e40af",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}>
                          <ShieldCheck size={13} /> Stage 1 · Locational Clearance (Annex D)
                        </span>
                      ) : (
                        <span style={{
                          background: "#f5f3ff",
                          color: "#5b21b6",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}>
                          <Sparkles size={13} /> Stage 2 · {app.projectType || "Unified Permit Application"}
                        </span>
                      )}
                    </div>

                    {/* Status Pill */}
                    <div style={{
                      background: statusConfig.bg,
                      color: statusConfig.color,
                      border: `1px solid ${statusConfig.border}30`,
                      borderRadius: "999px",
                      padding: "4px 12px",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      <StatusIcon size={14} strokeWidth={2.5} />
                      <span>{statusConfig.label}</span>
                    </div>
                  </div>

                  {/* PROJECT TITLE & LOCATION */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <h3 style={{ margin: "0 0 0.35rem 0", fontSize: "1.25rem", fontWeight: "800", color: "#0f172a" }}>
                      {app.projectName || (isLocationalClearance ? "Locational Clearance Application" : "Unified Permit")}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#64748b", fontSize: "0.85rem" }}>
                      <MapPin size={14} color="#94a3b8" />
                      <span>{app.projectAddress || "Sto. Tomas, Pampanga"}</span>
                    </div>
                  </div>

                  {/* 4-STAGE VISUAL TIMELINE STEPPER */}
                  <div style={{
                    background: "#f8fafc",
                    border: "1px solid #edf2f7",
                    borderRadius: "14px",
                    padding: "0.9rem 1.25rem",
                    marginBottom: "1.25rem"
                  }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                      {[
                        { num: 1, title: "1. Filed", desc: "Submitted", active: statusConfig.step >= 1, current: statusConfig.step === 1 },
                        { num: 2, title: "2. Evaluation", desc: "Technical Review", active: statusConfig.step >= 2, current: statusConfig.step === 2 },
                        { num: 3, title: "3. Endorsement", desc: "Chief OBO Approval", active: statusConfig.step >= 3, current: statusConfig.step === 3 },
                        { num: 4, title: "4. Released", desc: "Order of Payment", active: statusConfig.step >= 4, current: statusConfig.step === 4 }
                      ].map((step) => (
                        <div key={step.num} style={{ textAlign: "center", position: "relative" }}>
                          <div style={{
                            height: "6px",
                            borderRadius: "999px",
                            background: step.active ? statusConfig.color : "#e2e8f0",
                            marginBottom: "6px",
                            boxShadow: step.current ? `0 0 8px ${statusConfig.color}80` : "none",
                            transition: "all 0.3s ease"
                          }} />
                          <div style={{
                            fontSize: "0.76rem",
                            fontWeight: step.active ? "800" : "600",
                            color: step.active ? "#0f172a" : "#94a3b8"
                          }}>
                            {step.title}
                          </div>
                          <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "1px" }}>
                            {step.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FOOTER ROW WITH ACTIONS */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "0.85rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.82rem", color: "#64748b" }}>
                      <span>Submitted: <strong>{app.dateSubmitted}</strong></span>
                      {isApprovedLC && (
                        <span style={{
                          background: "#dcfce7",
                          color: "#15803d",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontWeight: "700",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}>
                          <Check size={12} /> Stage 1 Prerequisite Passed
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
                      {/* Direct Message Officer Button */}
                      <Link
                        href={`/applicant/messages?ref=${app.id}`}
                        style={{
                          background: "#ffffff",
                          border: "1.5px solid #c7d2fe",
                          color: "#4338ca",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "0.82rem",
                          fontWeight: "700",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          transition: "all 0.15s ease"
                        }}
                        title="Inquire or message municipal staff regarding this application"
                      >
                        <MessageSquare size={13} color="#4f46e5" />
                        <span>Message Desk</span>
                      </Link>

                      {isApprovedLC && (
                        <Link 
                          href="/applicant/apply"
                          style={{
                            background: "#ede9fe",
                            color: "#6d28d9",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "0.82rem",
                            fontWeight: "700",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          Proceed to Stage 2 <ArrowRight size={13} />
                        </Link>
                      )}

                      <Link
                        href={`/applicant/track/${app.id}`}
                        style={{
                          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                          color: "#ffffff",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          fontWeight: "700",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)"
                        }}
                      >
                        View Full Timeline <ChevronRight size={15} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
