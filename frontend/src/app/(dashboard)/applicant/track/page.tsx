"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePermitContext } from "../../../../context/PermitContext";
import { 
  Search, Plus, Clock, CheckCircle2, AlertTriangle, 
  FileText, CheckCircle, ChevronRight, Copy, Check, 
  MapPin, Sparkles, Layers, ShieldCheck, ArrowRight, MessageSquare, Lock,
  XCircle, Trash2, Archive, ArchiveRestore, RotateCcw, Filter, Calendar,
  Building2, DollarSign, Eye, RefreshCw
} from "lucide-react";

export default function ApplicationStatusPage() {
  const router = useRouter();
  const { applications, cancelApplication } = usePermitContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [userName, setUserName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Archive State (persisted in localStorage)
  const [archivedIds, setArchivedIds] = useState<string[]>([]);

  // Cancellation State
  const [appToCancel, setAppToCancel] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("Change of project plans");
  const [isCancelling, setIsCancelling] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "info" } | null>(null);

  const showToast = (text: string, type: "success" | "info" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3800);
  };

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

    // Load archived IDs
    try {
      const savedArchived = localStorage.getItem("etayo_archived_application_ids");
      if (savedArchived) {
        const parsed = JSON.parse(savedArchived);
        if (Array.isArray(parsed)) {
          setArchivedIds(parsed);
        }
      }
    } catch (e) {}

    // Support tab deep-linking (e.g. /applicant/track?tab=archived)
    try {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("tab") === "archived") {
          setActiveTab("archived");
        }
      }
    } catch (e) {}
  }, []);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    showToast(`Copied tracking ID ${id} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleArchiveApp = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setArchivedIds(prev => {
      const next = Array.from(new Set([...prev, id]));
      try {
        localStorage.setItem("etayo_archived_application_ids", JSON.stringify(next));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("etayo_archive_changed"));
        }
      } catch (err) {}
      return next;
    });
    showToast(`Application ${id} moved to archive.`, "info");
  };

  const handleUnarchiveApp = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setArchivedIds(prev => {
      const next = prev.filter(x => x !== id);
      try {
        localStorage.setItem("etayo_archived_application_ids", JSON.stringify(next));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("etayo_archive_changed"));
        }
      } catch (err) {}
      return next;
    });
    showToast(`Application ${id} restored to active list.`, "success");
  };

  // Strictly filter applications for the active logged-in applicant (NO leak for guests or incognito)
  const myApplications = useMemo(() => {
    if (!isLoggedIn || !currentUser) {
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

  const activeApps = useMemo(() => {
    return myApplications.filter(a => !archivedIds.includes(a.id));
  }, [myApplications, archivedIds]);

  const archivedApps = useMemo(() => {
    return myApplications.filter(a => archivedIds.includes(a.id));
  }, [myApplications, archivedIds]);

  const currentPool = activeTab === "active" ? activeApps : archivedApps;

  const filteredApps = useMemo(() => {
    return currentPool.filter(app => {
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
  }, [currentPool, searchTerm, statusFilter, typeFilter]);

  const stats = {
    activeTotal: activeApps.length,
    pending: activeApps.filter(a => a.status === "pending").length,
    review: activeApps.filter(a => a.status === "under_review").length,
    approved: activeApps.filter(a => ["approved", "released"].includes(a.status)).length,
    action: activeApps.filter(a => a.status === "incomplete_requirements").length,
    archivedTotal: archivedApps.length,
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
      case "cancelled":
        return { color: "#dc2626", bg: "#fee2e2", border: "#ef4444", icon: XCircle, label: "Cancelled", step: 0 };
      default:
        return { color: "#64748b", bg: "#f1f5f9", border: "#94a3b8", icon: FileText, label: "Processing", step: 1 };
    }
  };

  return (
    <div className="dashboard-page animate-fade-in-up" style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* MODERN GLASS PAGE HEADER */}
      <header style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.85))",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(226, 232, 240, 0.8)",
        boxShadow: "0 10px 35px -5px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255,255,255,0.8) inset",
        borderRadius: "24px",
        padding: "2rem 2.25rem",
        marginBottom: "2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1.5rem"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
            <span style={{
              background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
              color: "#1d4ed8",
              fontSize: "0.75rem",
              fontWeight: "800",
              padding: "4px 12px",
              borderRadius: "999px",
              letterSpacing: "0.5px",
              border: "1px solid #bfdbfe"
            }}>
              OFFICIAL MUNICIPAL PERMIT REGISTRY
            </span>
            <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "600" }}>
              Sto. Tomas, Pampanga
            </span>
          </div>

          <h1 className="page-title" style={{ fontSize: "2.1rem", fontWeight: "900", color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>
            Application Status & Permits
          </h1>
          <p style={{ fontSize: "0.98rem", marginTop: "0.4rem", color: "#475569", maxWidth: "680px", lineHeight: "1.5" }}>
            Monitor real-time evaluation stages, zoning clearances, and engineering permits for your projects. Archive completed permits to keep your dashboard clean.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <Link 
            href={isLoggedIn ? "/applicant/apply" : "/login?redirect=/applicant/apply"} 
            style={{
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              color: "white",
              boxShadow: "0 6px 20px rgba(37, 99, 235, 0.35)",
              padding: "0.8rem 1.5rem",
              borderRadius: "14px",
              fontWeight: "800",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              fontSize: "0.95rem",
              textDecoration: "none",
              transition: "all 0.2s ease"
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>New Application</span>
          </Link>
        </div>
      </header>

      {/* GUEST BANNER OR STATS OVERVIEW CARDS */}
      {!isLoggedIn ? (
        <section style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          color: "white",
          borderRadius: "22px",
          padding: "2.25rem 2.5rem",
          marginBottom: "2rem",
          boxShadow: "0 12px 35px rgba(15, 23, 42, 0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1.5rem"
        }}>
          <div style={{ maxWidth: "650px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.12)", padding: "4px 12px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: "700", color: "#93c5fd", marginBottom: "0.75rem" }}>
              <ShieldCheck size={14} /> Official Municipal Permit Tracking Portal
            </div>
            <h2 style={{ fontSize: "1.55rem", fontWeight: "800", margin: "0 0 0.5rem 0", color: "#ffffff" }}>
              Track Application Progress & Official Status
            </h2>
            <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.95rem", lineHeight: "1.5" }}>
              Have an official Tracking ID receipt? Enter it into the Direct Tracking Lookup below to inspect evaluation milestones. Sign in to your account to view your private application history.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link href="/login?redirect=/applicant/track" style={{ background: "#2563eb", color: "white", padding: "0.8rem 1.5rem", borderRadius: "12px", fontWeight: "800", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 4px 14px rgba(37,99,235,0.3)" }}>
              Sign In to View Applications <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      ) : (
        /* INTERACTIVE KPI STATS DASHBOARD */
        <section style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "1.1rem",
          marginBottom: "2rem"
        }}>
          {/* Card 1: Active Total */}
          <div 
            onClick={() => { setActiveTab("active"); setStatusFilter("all"); }}
            style={{ 
              background: activeTab === "active" && statusFilter === "all" ? "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)" : "#ffffff", 
              borderRadius: "18px", 
              padding: "1.25rem 1.4rem", 
              border: activeTab === "active" && statusFilter === "all" ? "2px solid #2563eb" : "1.5px solid #e2e8f0", 
              boxShadow: activeTab === "active" && statusFilter === "all" ? "0 8px 24px rgba(37, 99, 235, 0.12)" : "0 2px 10px rgba(0,0,0,0.02)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            title="Click to show all active applications"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={22} />
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "#2563eb", background: "#dbeafe", padding: "2px 8px", borderRadius: "999px" }}>
                Active
              </span>
            </div>
            <div>
              <div style={{ fontSize: "2rem", fontWeight: "900", color: "#0f172a", lineHeight: 1 }}>{stats.activeTotal}</div>
              <div style={{ fontSize: "0.82rem", fontWeight: "700", color: activeTab === "active" && statusFilter === "all" ? "#2563eb" : "#64748b", marginTop: "0.35rem" }}>
                Active Permits
              </div>
            </div>
          </div>

          {/* Card 2: Under Review */}
          <div 
            onClick={() => { setActiveTab("active"); setStatusFilter("under_review"); }}
            style={{ 
              background: activeTab === "active" && statusFilter === "under_review" ? "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)" : "#ffffff", 
              borderRadius: "18px", 
              padding: "1.25rem 1.4rem", 
              border: activeTab === "active" && statusFilter === "under_review" ? "2px solid #2563eb" : "1.5px solid #e2e8f0", 
              boxShadow: activeTab === "active" && statusFilter === "under_review" ? "0 8px 24px rgba(37, 99, 235, 0.12)" : "0 2px 10px rgba(0,0,0,0.02)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            title="Click to filter by Under Evaluation"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#dbeafe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Search size={22} />
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "#1d4ed8", background: "#dbeafe", padding: "2px 8px", borderRadius: "999px" }}>
                Review
              </span>
            </div>
            <div>
              <div style={{ fontSize: "2rem", fontWeight: "900", color: "#0f172a", lineHeight: 1 }}>{stats.review}</div>
              <div style={{ fontSize: "0.82rem", fontWeight: "700", color: activeTab === "active" && statusFilter === "under_review" ? "#2563eb" : "#64748b", marginTop: "0.35rem" }}>
                Under Evaluation
              </div>
            </div>
          </div>

          {/* Card 3: Approved / Released */}
          <div 
            onClick={() => { setActiveTab("active"); setStatusFilter("approved"); }}
            style={{ 
              background: activeTab === "active" && statusFilter === "approved" ? "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)" : "#ffffff", 
              borderRadius: "18px", 
              padding: "1.25rem 1.4rem", 
              border: activeTab === "active" && statusFilter === "approved" ? "2px solid #059669" : "1.5px solid #e2e8f0", 
              boxShadow: activeTab === "active" && statusFilter === "approved" ? "0 8px 24px rgba(5, 150, 105, 0.12)" : "0 2px 10px rgba(0,0,0,0.02)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            title="Click to filter by Approved & Released"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#d1fae5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 size={22} />
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "#15803d", background: "#dcfce7", padding: "2px 8px", borderRadius: "999px" }}>
                Approved
              </span>
            </div>
            <div>
              <div style={{ fontSize: "2rem", fontWeight: "900", color: "#0f172a", lineHeight: 1 }}>{stats.approved}</div>
              <div style={{ fontSize: "0.82rem", fontWeight: "700", color: activeTab === "active" && statusFilter === "approved" ? "#059669" : "#64748b", marginTop: "0.35rem" }}>
                Approved & Released
              </div>
            </div>
          </div>

          {/* Card 4: Action Required */}
          <div 
            onClick={() => { setActiveTab("active"); setStatusFilter("incomplete_requirements"); }}
            style={{ 
              background: activeTab === "active" && statusFilter === "incomplete_requirements" ? "linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)" : "#ffffff", 
              borderRadius: "18px", 
              padding: "1.25rem 1.4rem", 
              border: activeTab === "active" && statusFilter === "incomplete_requirements" ? "2px solid #dc2626" : "1.5px solid #e2e8f0", 
              boxShadow: activeTab === "active" && statusFilter === "incomplete_requirements" ? "0 8px 24px rgba(220, 38, 38, 0.12)" : "0 2px 10px rgba(0,0,0,0.02)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            title="Click to filter by Action Required"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={22} />
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "#b91c1c", background: "#fee2e2", padding: "2px 8px", borderRadius: "999px" }}>
                Attention
              </span>
            </div>
            <div>
              <div style={{ fontSize: "2rem", fontWeight: "900", color: "#0f172a", lineHeight: 1 }}>{stats.action}</div>
              <div style={{ fontSize: "0.82rem", fontWeight: "700", color: activeTab === "active" && statusFilter === "incomplete_requirements" ? "#dc2626" : "#64748b", marginTop: "0.35rem" }}>
                Action Required
              </div>
            </div>
          </div>

          {/* Card 5: ARCHIVE TAB CARD */}
          <div 
            onClick={() => { setActiveTab("archived"); setStatusFilter("all"); }}
            style={{ 
              background: activeTab === "archived" ? "linear-gradient(135deg, #f8fafc 0%, #ede9fe 100%)" : "#ffffff", 
              borderRadius: "18px", 
              padding: "1.25rem 1.4rem", 
              border: activeTab === "archived" ? "2px solid #7c3aed" : "1.5px solid #e2e8f0", 
              boxShadow: activeTab === "archived" ? "0 8px 24px rgba(124, 58, 237, 0.15)" : "0 2px 10px rgba(0,0,0,0.02)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            title="Click to view Archived applications"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#f5f3ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Archive size={22} />
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "#6d28d9", background: "#ede9fe", padding: "2px 8px", borderRadius: "999px" }}>
                Storage
              </span>
            </div>
            <div>
              <div style={{ fontSize: "2rem", fontWeight: "900", color: "#0f172a", lineHeight: 1 }}>{stats.archivedTotal}</div>
              <div style={{ fontSize: "0.82rem", fontWeight: "700", color: activeTab === "archived" ? "#7c3aed" : "#64748b", marginTop: "0.35rem" }}>
                Archived Permits
              </div>
            </div>
          </div>
        </section>
      )}


      {/* SEGMENTED TAB SELECTOR: ACTIVE VS ARCHIVED */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        marginBottom: "1.5rem"
      }}>
        {/* Main Tabs */}
        <div style={{
          display: "inline-flex",
          background: "#f1f5f9",
          padding: "5px",
          borderRadius: "16px",
          border: "1.5px solid #e2e8f0",
          gap: "6px"
        }}>
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            style={{
              padding: "9px 20px",
              borderRadius: "12px",
              border: "none",
              background: activeTab === "active" ? "#ffffff" : "none",
              color: activeTab === "active" ? "#0f172a" : "#64748b",
              fontWeight: activeTab === "active" ? "800" : "600",
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: activeTab === "active" ? "0 4px 12px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.15s ease"
            }}
          >
            <FileText size={16} color={activeTab === "active" ? "#2563eb" : "#94a3b8"} />
            <span>Active Applications</span>
            <span style={{
              background: activeTab === "active" ? "#eff6ff" : "#e2e8f0",
              color: activeTab === "active" ? "#2563eb" : "#64748b",
              fontSize: "0.75rem",
              fontWeight: "800",
              padding: "2px 8px",
              borderRadius: "999px"
            }}>
              {activeApps.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("archived")}
            style={{
              padding: "9px 20px",
              borderRadius: "12px",
              border: "none",
              background: activeTab === "archived" ? "#ffffff" : "none",
              color: activeTab === "archived" ? "#6d28d9" : "#64748b",
              fontWeight: activeTab === "archived" ? "800" : "600",
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: activeTab === "archived" ? "0 4px 12px rgba(109, 40, 217, 0.12)" : "none",
              transition: "all 0.15s ease"
            }}
          >
            <Archive size={16} color={activeTab === "archived" ? "#7c3aed" : "#94a3b8"} />
            <span>Archived Permits</span>
            <span style={{
              background: activeTab === "archived" ? "#ede9fe" : "#e2e8f0",
              color: activeTab === "archived" ? "#6d28d9" : "#64748b",
              fontSize: "0.75rem",
              fontWeight: "800",
              padding: "2px 8px",
              borderRadius: "999px"
            }}>
              {archivedApps.length}
            </span>
          </button>
        </div>

        {/* Action / Count label */}
        <div style={{ fontSize: "0.88rem", color: "#64748b" }}>
          Showing <strong>{filteredApps.length}</strong> of {currentPool.length} {activeTab} permit{currentPool.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <section style={{
        background: "#ffffff",
        borderRadius: "18px",
        border: "1.5px solid #e2e8f0",
        padding: "1rem 1.4rem",
        marginBottom: "1.75rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
      }}>
        {/* Search Filter */}
        <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input 
            type="text" 
            placeholder="Search project name, reference ID, barangay..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "0.88rem",
              outline: "none"
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                fontWeight: "700",
                fontSize: "1rem"
              }}
            >
              &times;
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} color="#64748b" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                fontWeight: "600",
                color: "#334155",
                background: "#f8fafc",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="under_review">Under Evaluation</option>
              <option value="approved">Approved / Released</option>
              <option value="incomplete_requirements">Action Required</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                fontWeight: "600",
                color: "#334155",
                background: "#f8fafc",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="all">All Permit Types</option>
              <option value="locational_clearance">Stage 1 · Locational Clearance</option>
              <option value="building_permit">Stage 2 · Unified Technical Permits</option>
            </select>
          </div>

          {(searchTerm || statusFilter !== "all" || typeFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setTypeFilter("all");
              }}
              style={{
                background: "#fee2e2",
                color: "#991b1b",
                border: "none",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "0.78rem",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* APPLICATIONS LIST */}
      <section>
        {!isLoggedIn ? (
          <div style={{
            background: "#ffffff",
            borderRadius: "22px",
            border: "1.5px solid #e2e8f0",
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
            background: "rgba(255,255,255,0.7)",
            borderRadius: "22px",
            border: "2px dashed #cbd5e1",
            padding: "4rem 2rem",
            textAlign: "center"
          }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: activeTab === "archived" ? "#f5f3ff" : "#f1f5f9",
              color: activeTab === "archived" ? "#7c3aed" : "#94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem auto"
            }}>
              {activeTab === "archived" ? <Archive size={30} /> : <FileText size={30} />}
            </div>

            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#1e293b", margin: "0 0 0.4rem 0" }}>
              {activeTab === "archived" ? "No Archived Applications" : "No Applications Found"}
            </h3>

            <p style={{ margin: "0 auto 1.5rem auto", color: "#64748b", fontSize: "0.92rem", maxWidth: "480px", lineHeight: "1.5" }}>
              {activeTab === "archived"
                ? "You haven't archived any applications yet. When an application is completed, released, or cancelled, you can archive it to keep your active workspace organized."
                : (searchTerm || statusFilter !== "all" || typeFilter !== "all")
                ? "No applications match your active search filters. Try clearing your filters above."
                : "You have not submitted any permit applications under this account yet. Click below to begin your official application."}
            </p>

            {activeTab === "archived" ? (
              <button
                type="button"
                onClick={() => setActiveTab("active")}
                style={{
                  background: "#7c3aed",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "10px 20px",
                  fontWeight: "700",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <FileText size={16} /> Return to Active Applications
              </button>
            ) : (
              <Link href="/applicant/apply" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                <Plus size={16} /> File New Application
              </Link>
            )}
          </div>
        ) : (
          /* LIST OF APPLICATION CARDS */
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {filteredApps.map(app => {
              const statusConfig = getStatusConfig(app.status);
              const StatusIcon = statusConfig.icon;
              const isLocationalClearance = app.permitType === "locational_clearance";
              const isApprovedLC = isLocationalClearance && (app.status === "approved" || app.status === "released");
              const isArchived = archivedIds.includes(app.id);

              return (
                <div 
                  key={app.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "20px",
                    border: "1.5px solid #e2e8f0",
                    borderLeft: `6px solid ${statusConfig.border}`,
                    padding: "1.75rem",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                    transition: "all 0.2s ease"
                  }}
                >
                  {/* TOP HEADER ROW: CHIPS & STATUS */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                      {/* Tracking ID Badge with Instant Copy */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyId(app.id, e)}
                        title="Click to copy Tracking ID"
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #cbd5e1",
                          borderRadius: "10px",
                          padding: "5px 12px",
                          fontSize: "0.85rem",
                          fontWeight: "800",
                          color: "#0f172a",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <code style={{ fontFamily: "monospace", fontSize: "0.88rem" }}>{app.id}</code>
                        {copiedId === app.id ? (
                          <Check size={14} color="#16a34a" />
                        ) : (
                          <Copy size={14} color="#64748b" />
                        )}
                      </button>

                      {/* Permit Type Badge */}
                      {isLocationalClearance ? (
                        <span style={{
                          background: "#eff6ff",
                          color: "#1e40af",
                          fontSize: "0.76rem",
                          fontWeight: "800",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          border: "1px solid #bfdbfe",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px"
                        }}>
                          <ShieldCheck size={13} /> Stage 1 · Locational Clearance
                        </span>
                      ) : (
                        <span style={{
                          background: "#f5f3ff",
                          color: "#5b21b6",
                          fontSize: "0.76rem",
                          fontWeight: "800",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          border: "1px solid #ddd6fe",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px"
                        }}>
                          <Sparkles size={13} /> Stage 2 · {app.projectType || "Unified Technical Permits"}
                        </span>
                      )}

                      {/* Archive Status Pill if archived */}
                      {isArchived && (
                        <span style={{
                          background: "#ede9fe",
                          color: "#6d28d9",
                          fontSize: "0.72rem",
                          fontWeight: "800",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}>
                          <Archive size={12} /> Archived
                        </span>
                      )}
                    </div>

                    {/* Status Pill */}
                    <div style={{
                      background: statusConfig.bg,
                      color: statusConfig.color,
                      border: `1.5px solid ${statusConfig.border}40`,
                      borderRadius: "999px",
                      padding: "5px 14px",
                      fontSize: "0.84rem",
                      fontWeight: "800",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                    }}>
                      <StatusIcon size={15} strokeWidth={2.5} />
                      <span>{statusConfig.label}</span>
                    </div>
                  </div>

                  {/* PROJECT TITLE & LOCATION */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "1.35rem", fontWeight: "900", color: "#0f172a", letterSpacing: "-0.3px" }}>
                      {app.projectName || (isLocationalClearance ? "Locational Clearance Application" : "Unified Permitting Dossier")}
                    </h3>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", color: "#64748b", fontSize: "0.88rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <MapPin size={15} color="#94a3b8" />
                        <span>{app.projectAddress || "Sto. Tomas, Pampanga"}</span>
                      </div>

                      {app.projectType && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <Building2 size={15} color="#94a3b8" />
                          <span>{app.projectType}</span>
                        </div>
                      )}

                      {app.dateSubmitted && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <Calendar size={15} color="#94a3b8" />
                          <span>Filed on: <strong>{app.dateSubmitted}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4-STAGE VISUAL TIMELINE STEPPER */}
                  <div style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "1rem 1.4rem",
                    marginBottom: "1.25rem"
                  }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
                      {[
                        { num: 1, title: "1. Filed", desc: "Submitted Online", active: statusConfig.step >= 1, current: statusConfig.step === 1 },
                        { num: 2, title: "2. Evaluation", desc: "Technical Review", active: statusConfig.step >= 2, current: statusConfig.step === 2 },
                        { num: 3, title: "3. Endorsement", desc: "Chief OBO Approval", active: statusConfig.step >= 3, current: statusConfig.step === 3 },
                        { num: 4, title: "4. Released", desc: "Order of Payment", active: statusConfig.step >= 4, current: statusConfig.step === 4 }
                      ].map((step) => (
                        <div key={step.num} style={{ textAlign: "center", position: "relative" }}>
                          <div style={{
                            height: "7px",
                            borderRadius: "999px",
                            background: step.active ? statusConfig.color : "#cbd5e1",
                            marginBottom: "8px",
                            boxShadow: step.current ? `0 0 10px ${statusConfig.color}90` : "none",
                            transition: "all 0.3s ease"
                          }} />
                          <div style={{
                            fontSize: "0.8rem",
                            fontWeight: step.active ? "800" : "600",
                            color: step.active ? "#0f172a" : "#94a3b8"
                          }}>
                            {step.title}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "1px" }}>
                            {step.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PROMPT BANNER FOR APPROVED LOCATIONAL CLEARANCE */}
                  {isApprovedLC && (
                    <div style={{
                      background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
                      border: "1.5px solid #86efac",
                      borderRadius: "14px",
                      padding: "1rem 1.25rem",
                      marginBottom: "1.25rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "10px",
                      boxShadow: "0 2px 10px rgba(16, 185, 129, 0.08)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Check size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                          <div style={{ fontSize: "0.9rem", fontWeight: "800", color: "#166534" }}>
                            Stage 1 Prerequisite Passed! Clearance Ref: {app.id}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#15803d" }}>
                            Your locational zoning is officially approved. You can now proceed to Stage 2 Technical Permitting Forms with all fields prefilled.
                          </div>
                        </div>
                      </div>

                      <Link 
                        href={`/applicant/apply?clearanceRef=${encodeURIComponent(app.id)}&step=3`}
                        style={{
                          background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                          color: "white",
                          padding: "8px 16px",
                          borderRadius: "10px",
                          fontSize: "0.85rem",
                          fontWeight: "800",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)"
                        }}
                      >
                        <span>Proceed to Step 3: Permitting Forms</span>
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  )}

                  {/* FOOTER ROW WITH ACTIONS */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.85rem",
                    borderTop: "1.5px solid #f1f5f9",
                    paddingTop: "1rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.82rem", color: "#64748b" }}>
                      <span>Permit Dossier: <strong>{app.requirements?.length || 1} Document(s)</strong></span>
                      {app.locationalClearanceRef && (
                        <span>• Ref LC: <strong>{app.locationalClearanceRef}</strong></span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
                      {/* Message Desk Officer */}
                      <Link
                        href={`/applicant/messages?ref=${encodeURIComponent(app.id)}`}
                        style={{
                          background: "#ffffff",
                          border: "1.5px solid #cbd5e1",
                          color: "#334155",
                          padding: "7px 13px",
                          borderRadius: "10px",
                          fontSize: "0.84rem",
                          fontWeight: "700",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          transition: "all 0.15s ease"
                        }}
                        title="Inquire or message municipal evaluation officer regarding this application"
                      >
                        <MessageSquare size={14} color="#64748b" />
                        <span>Message Desk</span>
                      </Link>

                      {/* ARCHIVE / UNARCHIVE ACTION BUTTON */}
                      {isArchived ? (
                        <button
                          type="button"
                          onClick={(e) => handleUnarchiveApp(app.id, e)}
                          style={{
                            background: "#ede9fe",
                            border: "1.5px solid #ddd6fe",
                            color: "#6d28d9",
                            padding: "7px 13px",
                            borderRadius: "10px",
                            fontSize: "0.84rem",
                            fontWeight: "800",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            transition: "all 0.15s ease"
                          }}
                          title="Restore this application back to your active dashboard"
                        >
                          <ArchiveRestore size={14} />
                          <span>Restore to Active</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleArchiveApp(app.id, e)}
                          style={{
                            background: "#ffffff",
                            border: "1.5px solid #cbd5e1",
                            color: "#475569",
                            padding: "7px 13px",
                            borderRadius: "10px",
                            fontSize: "0.84rem",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            transition: "all 0.15s ease"
                          }}
                          title="Archive this application to hide it from your active list"
                        >
                          <Archive size={14} color="#64748b" />
                          <span>Archive</span>
                        </button>
                      )}

                      {/* Cancel Application Button (if not already cancelled or released) */}
                      {app.status === "cancelled" ? (
                        <span style={{
                          background: "#fee2e2",
                          color: "#991b1b",
                          border: "1px solid #fca5a5",
                          padding: "6px 12px",
                          borderRadius: "10px",
                          fontSize: "0.82rem",
                          fontWeight: "700",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}>
                          <XCircle size={14} color="#dc2626" /> Cancelled
                        </span>
                      ) : app.status !== "released" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAppToCancel(app);
                            setCancelReason("Change of project plans");
                          }}
                          style={{
                            background: "#ffffff",
                            border: "1.5px solid #fca5a5",
                            color: "#b91c1c",
                            padding: "7px 12px",
                            borderRadius: "10px",
                            fontSize: "0.84rem",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            transition: "all 0.15s ease"
                          }}
                          title="Cancel or withdraw this application"
                        >
                          <XCircle size={14} color="#dc2626" />
                          <span>Cancel</span>
                        </button>
                      ) : null}

                      {/* View Full Timeline Dossier Button */}
                      <Link
                        href={`/applicant/track/${app.id}`}
                        style={{
                          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                          color: "#ffffff",
                          padding: "7px 16px",
                          borderRadius: "10px",
                          fontSize: "0.86rem",
                          fontWeight: "800",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          boxShadow: "0 3px 10px rgba(37, 99, 235, 0.25)"
                        }}
                      >
                        <span>View Full Timeline</span>
                        <ChevronRight size={15} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* FLOATING TOAST FEEDBACK NOTIFICATION */}
      {toastMsg && (
        <div className="animate-fade-in-up" style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          zIndex: 9999,
          background: toastMsg.type === "success" ? "#0f172a" : "#1e1b4b",
          color: "white",
          padding: "12px 20px",
          borderRadius: "14px",
          boxShadow: "0 12px 35px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "0.92rem",
          fontWeight: "700",
          border: "1px solid rgba(255,255,255,0.15)"
        }}>
          {toastMsg.type === "success" ? (
            <CheckCircle size={18} color="#22c55e" />
          ) : (
            <Archive size={18} color="#a78bfa" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {appToCancel && (
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
            borderRadius: "22px",
            maxWidth: "520px",
            width: "100%",
            padding: "2rem",
            boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.25rem" }}>
              <div style={{ width: "46px", height: "46px", borderRadius: "14px", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: "900", color: "#0f172a" }}>
                  Cancel Permit Application?
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  Ref ID: <strong style={{ color: "#1e293b" }}>{appToCancel.id}</strong> • {appToCancel.projectName || "Permit Application"}
                </p>
              </div>
            </div>

            <p style={{ fontSize: "0.92rem", color: "#475569", lineHeight: "1.6", margin: "0 0 1.25rem 0" }}>
              Are you sure you want to cancel this application? Once cancelled, municipal evaluation will be stopped. The record will remain archived in your Application Status as <strong>Cancelled</strong>.
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                Reason for Cancellation:
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.88rem",
                  color: "#1e293b",
                  background: "#f8fafc",
                  outline: "none"
                }}
              >
                <option value="Change of project plans">Change of project plans / design modifications</option>
                <option value="Duplicate submission">Accidental duplicate submission</option>
                <option value="Project postponed / cancelled">Project postponed or delayed indefinitely</option>
                <option value="Incorrect information provided">Incorrect project details entered</option>
                <option value="Other municipal requirements">Other reasons</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setAppToCancel(null)}
                disabled={isCancelling}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: "700",
                  fontSize: "0.88rem",
                  cursor: "pointer"
                }}
              >
                Keep Application
              </button>

              <button
                type="button"
                disabled={isCancelling}
                onClick={async () => {
                  setIsCancelling(true);
                  try {
                    await cancelApplication(appToCancel.id, cancelReason);
                    showToast(`Application ${appToCancel.id} has been cancelled.`);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsCancelling(false);
                    setAppToCancel(null);
                  }
                }}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                  color: "#ffffff",
                  fontWeight: "800",
                  fontSize: "0.88rem",
                  cursor: isCancelling ? "wait" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)"
                }}
              >
                <XCircle size={16} />
                <span>{isCancelling ? "Cancelling..." : "Confirm Cancellation"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
