"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePermitContext } from "../../../../context/PermitContext";
import { 
  Search, 
  Plus, 
  Filter, 
  Bell, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Archive, 
  FolderKanban, 
  List, 
  Building2, 
  ChevronDown, 
  ChevronRight, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Copy, 
  MapPin, 
  Calendar 
} from "lucide-react";
import Link from "next/link";
import Skeleton from "@/components/ui/Skeleton";
import { PermitApplication } from "../../../../types";

type ViewMode = "project" | "flat";

interface ProjectDossier {
  id: string;
  projectName: string;
  projectType: string;
  projectAddress: string;
  applications: PermitApplication[];
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  actionRequiredCount: number;
  latestDate: string;
}

export default function ApplicantDashboard() {
  const { applications } = usePermitContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userName, setUserName] = useState("Applicant");
  const [userEmail, setUserEmail] = useState("");
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "info" } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("project");
  const [expandedDossiers, setExpandedDossiers] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const showToast = (text: string, type: "success" | "info" = "info") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const copyToClipboard = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    showToast(`Copied tracking ID ${id} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
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

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);

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

  // Filter individual applications by search and status
  const filteredApps = useMemo(() => {
    return activeApplicantApps.filter(app => {
      const sTerm = searchTerm.toLowerCase().trim();
      const pName = (app.projectName || "").toLowerCase();
      const appId = (app.id || "").toLowerCase();
      const pType = (typeof app.projectType === "object" ? (app.projectType as any)?.name : (app.projectType || "")).toLowerCase();
      const permType = (app.permitType || "").toLowerCase();
      const pAddr = (app.projectAddress || app.location?.address || "").toLowerCase();

      const matchesSearch = !sTerm || 
        pName.includes(sTerm) || 
        appId.includes(sTerm) || 
        pType.includes(sTerm) || 
        permType.includes(sTerm) || 
        pAddr.includes(sTerm);

      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "approved" ? ["approved", "released"].includes(app.status) : app.status === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [activeApplicantApps, searchTerm, statusFilter]);

  // Helper to extract the normalized base project title
  const extractBaseProjectName = (app: PermitApplication) => {
    const pTypeStr = typeof app.projectType === "object" ? (app.projectType as any)?.name : (app.projectType || "");
    const pName = (app.projectName || "").trim();

    if (pTypeStr && pTypeStr !== "Other" && pTypeStr !== "Unknown") {
      return pTypeStr.trim();
    }

    const cleaned = pName
      .replace(/\s*-\s*locational clearance/i, "")
      .replace(/\s*installation\s*&\s*construction/i, "")
      .replace(/\s*construction/i, "")
      .replace(/\s*building permit/i, "")
      .trim();

    return cleaned || pName || "Permit Project";
  };

  // Group applications by Project Dossier (just like on the staff/admin side!)
  const projectDossiers = useMemo(() => {
    const groups: Record<string, ProjectDossier> = {};

    filteredApps.forEach(app => {
      const baseTitle = extractBaseProjectName(app).toLowerCase();
      const pAddr = (app.projectAddress || app.location?.address || "").trim().toLowerCase();

      // Find matching group by base title or matching address
      let matchedKey: string | null = null;
      for (const key of Object.keys(groups)) {
        const g = groups[key];
        const gTitle = g.projectName.toLowerCase();
        const gAddr = g.projectAddress.toLowerCase();

        const titleMatch = Boolean(baseTitle && gTitle && (baseTitle === gTitle || baseTitle.includes(gTitle) || gTitle.includes(baseTitle)));
        const addrMatch = Boolean(pAddr && gAddr && (pAddr.includes(gAddr) || gAddr.includes(pAddr) || pAddr.slice(0, 16) === gAddr.slice(0, 16)));

        if (titleMatch || (addrMatch && (!baseTitle || !gTitle))) {
          matchedKey = key;
          break;
        }
      }

      const displayTitle = extractBaseProjectName(app);
      const groupKey = matchedKey || `GROUP-${baseTitle || app.id}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: `DOSSIER-${Object.keys(groups).length + 1}`,
          projectName: displayTitle,
          projectType: typeof app.projectType === "object" ? (app.projectType as any)?.name : (app.projectType || displayTitle),
          projectAddress: app.projectAddress || app.location?.address || "Sto. Tomas, Pampanga",
          applications: [],
          totalCount: 0,
          pendingCount: 0,
          approvedCount: 0,
          actionRequiredCount: 0,
          latestDate: app.dateSubmitted || new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
        };
      }

      groups[groupKey].applications.push(app);
      groups[groupKey].totalCount++;

      if (app.status === "pending" || app.status === "under_review") {
        groups[groupKey].pendingCount++;
      } else if (app.status === "approved" || app.status === "released") {
        groups[groupKey].approvedCount++;
      } else if (app.status === "incomplete_requirements" || app.status === "rejected") {
        groups[groupKey].actionRequiredCount++;
      }
    });

    // Sort applications inside each dossier: Locational Clearance first, then Building Permit, then others
    Object.values(groups).forEach(g => {
      g.applications.sort((a, b) => {
        const typeRank = (type?: string, id?: string) => {
          const t = (type || "").toLowerCase();
          const i = (id || "").toLowerCase();
          if (t.includes("locational") || t.includes("zoning") || i.startsWith("lc-")) return 1;
          if (t.includes("building") || i.startsWith("bp-") || i.startsWith("app-")) return 2;
          if (t.includes("occupancy") || i.startsWith("oc-")) return 3;
          return 4;
        };
        return typeRank(a.permitType, a.id) - typeRank(b.permitType, b.id);
      });
    });

    // Sort dossiers: active/pending items first, then by total count
    return Object.values(groups).sort((a, b) => {
      if (a.pendingCount > 0 && b.pendingCount === 0) return -1;
      if (b.pendingCount > 0 && a.pendingCount === 0) return 1;
      return b.applications.length - a.applications.length;
    });
  }, [filteredApps]);

  const toggleDossier = (dossierId: string) => {
    setExpandedDossiers(prev => ({
      ...prev,
      [dossierId]: prev[dossierId] === undefined ? false : !prev[dossierId]
    }));
  };

  const isDossierExpanded = (dossierId: string) => {
    if (expandedDossiers[dossierId] !== undefined) {
      return expandedDossiers[dossierId];
    }
    // Default: expanded so user can see all connected forms right away
    return true;
  };

  const expandAll = () => {
    const allExp: Record<string, boolean> = {};
    projectDossiers.forEach(d => { allExp[d.id] = true; });
    setExpandedDossiers(allExp);
  };

  const collapseAll = () => {
    const allCol: Record<string, boolean> = {};
    projectDossiers.forEach(d => { allCol[d.id] = false; });
    setExpandedDossiers(allCol);
  };

  const stats = useMemo(() => ({
    total: activeApplicantApps.length,
    pending: activeApplicantApps.filter(a => a.status === "pending" || a.status === "under_review").length,
    approved: activeApplicantApps.filter(a => ["approved", "released"].includes(a.status)).length,
    action: activeApplicantApps.filter(a => a.status === "incomplete_requirements").length,
    dossiersCount: projectDossiers.length
  }), [activeApplicantApps, projectDossiers]);

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
      case "pending": return { color: "#d97706", bg: "rgba(245, 158, 11, 0.15)", icon: Clock, label: "Pending Review", border: "#f59e0b" };
      case "under_review": return { color: "#0038A8", bg: "rgba(0, 56, 168, 0.12)", icon: Search, label: "Under Evaluation", border: "#0038A8" };
      case "approved": 
      case "released": return { color: "#059669", bg: "rgba(16, 185, 129, 0.15)", icon: CheckCircle2, label: "Approved", border: "#10b981" };
      case "incomplete_requirements": return { color: "#dc2626", bg: "rgba(239, 68, 68, 0.15)", icon: AlertTriangle, label: "Action Required", border: "#ef4444" };
      default: return { color: "#64748b", bg: "rgba(100, 116, 139, 0.15)", icon: FileText, label: "Processing", border: "#cbd5e1" };
    }
  };

  const getPermitTypeBadge = (permitType?: string, appId?: string) => {
    const isLC = (permitType || "").toLowerCase().includes("locational") || (appId || "").toLowerCase().startsWith("lc-");
    if (isLC) {
      return {
        code: "LC",
        stage: "Stage 1",
        label: "Locational Clearance",
        bg: "#eff6ff",
        color: "#1e40af",
        border: "#bfdbfe"
      };
    }
    return {
      code: "BP",
      stage: "Stage 2",
      label: "Building Permit",
      bg: "#f5f3ff",
      color: "#6d28d9",
      border: "#ddd6fe"
    };
  };

  if (isLoading) {
    return (
      <div className="dashboard-page p-8" style={{ maxWidth: "1400px", margin: "0 auto" }}>
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
    <div className="dashboard-page animate-fade-in-up" style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.25rem", paddingBottom: "4rem" }}>
      {/* Page Header */}
      <header className="page-header" style={{ 
        background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.9)",
        boxShadow: "0 10px 35px rgba(0, 0, 0, 0.14)",
        borderRadius: "20px",
        padding: "1.25rem 1.75rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "2rem", fontWeight: "800", background: "linear-gradient(90deg, #021a4f 0%, #0038A8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", color: "#0038A8", margin: 0 }}>
            Applicant Dashboard
          </h1>
          <p className="page-subtitle" style={{ fontSize: "1rem", marginTop: "0.35rem", color: "#475569" }}>
            Welcome back, <strong style={{color: "#1e293b"}}>{userName}</strong>! Track and manage your permit dossiers and technical applications.
          </p>
        </div>

        <Link href="/applicant/apply" className="btn-primary" style={{
          background: "linear-gradient(135deg, #0038A8 0%, #021a4f 100%)",
          boxShadow: "0 4px 15px rgba(0, 56, 168, 0.4)",
          transform: "translateY(0)",
          transition: "all 0.3s ease",
          color: "#ffffff",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 20px",
          borderRadius: "14px",
          fontWeight: "700",
          fontSize: "0.95rem"
        }}>
          <Plus size={18} /> New Application
        </Link>
      </header>

      {/* KPI Stats Cards */}
      <section className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        {/* Card 1: Project Dossiers */}
        <div className="stat-card" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 10px 30px rgba(0,0,0,0.06)", borderRadius: "18px", padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Project Dossiers</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", color: "#0038A8", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={19} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "900", color: "#0f172a" }}>{stats.dossiersCount}</div>
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Active project sites</span>
        </div>

        {/* Card 2: Total Application Forms */}
        <div className="stat-card" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 10px 30px rgba(0,0,0,0.06)", borderRadius: "18px", padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Forms</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f8fafc", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={19} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "900", color: "#0f172a" }}>{stats.total}</div>
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Clearance & permit forms</span>
        </div>

        {/* Card 3: Pending Review */}
        <div className="stat-card" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 10px 30px rgba(0,0,0,0.06)", borderRadius: "18px", padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#d97706", textTransform: "uppercase", letterSpacing: "0.5px" }}>Under Review</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fffbeb", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={19} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "900", color: "#d97706" }}>{stats.pending}</div>
          <span style={{ fontSize: "0.8rem", color: "#d97706", fontWeight: "600" }}>Awaiting municipal evaluation</span>
        </div>

        {/* Card 4: Approved & Released */}
        <div className="stat-card" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 10px 30px rgba(0,0,0,0.06)", borderRadius: "18px", padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#059669", textTransform: "uppercase", letterSpacing: "0.5px" }}>Approved & Released</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f0fdf4", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={19} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "900", color: "#059669" }}>{stats.approved}</div>
          <span style={{ fontSize: "0.8rem", color: "#059669", fontWeight: "600" }}>Clearances & permits granted</span>
        </div>
      </section>

      {/* Main Applications Section */}
      <section className="applications-section" style={{ 
        background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))", 
        backdropFilter: "blur(20px)", 
        border: "1px solid rgba(255,255,255,0.9)", 
        borderRadius: "24px", 
        padding: "1.75rem 2rem", 
        boxShadow: "0 12px 40px rgba(0,0,0,0.12)" 
      }}>
        {/* Section Header Controls */}
        <div style={{ marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", paddingBottom: "1.25rem", borderBottom: "1px solid #e2e8f0" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            {/* Title & Archived Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#1e293b", margin: 0 }}>Recent Applications</h2>
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

            {/* VIEW MODE TOGGLE BUTTONS (Group by Project Dossier vs Flat List) */}
            <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "14px", border: "1px solid #e2e8f0", gap: "4px" }}>
              <button
                type="button"
                onClick={() => setViewMode("project")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  background: viewMode === "project" ? "#ffffff" : "transparent",
                  color: viewMode === "project" ? "#0038A8" : "#64748b",
                  boxShadow: viewMode === "project" ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
                }}
                title="Group applications into Project Dossiers (combining Locational Clearance & Building Permits for each site)"
              >
                <FolderKanban size={16} /> Group by Project Dossier
              </button>

              <button
                type="button"
                onClick={() => setViewMode("flat")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  background: viewMode === "flat" ? "#ffffff" : "transparent",
                  color: viewMode === "flat" ? "#0038A8" : "#64748b",
                  boxShadow: viewMode === "flat" ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
                }}
                title="View all individual applications in a flat grid"
              >
                <List size={16} /> All Applications (Flat)
              </button>
            </div>
          </div>

          {/* Search, Filter, and Expand/Collapse Toolbar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "280px", maxWidth: "560px" }}>
              <div className="search-bar" style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "0.55rem 1rem", display: "flex", alignItems: "center", gap: "8px", width: "100%", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                <Search size={18} color="#94a3b8" />
                <input 
                  type="text" 
                  placeholder="Search projects, IDs, or permit types..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ background: "transparent", border: "none", outline: "none", width: "100%", fontSize: "0.92rem", color: "#1e293b", fontWeight: "500" }}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.8rem", fontWeight: "700" }}>✕</button>
                )}
              </div>

              <select 
                className="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "0.6rem 1rem", fontWeight: "600", fontSize: "0.88rem", color: "#334155", outline: "none", cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="incomplete_requirements">Action Required</option>
              </select>
            </div>

            {/* Expand / Collapse All for Dossier View */}
            {viewMode === "project" && projectDossiers.length > 0 && (
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  onClick={expandAll}
                  style={{ background: "#f8fafc", border: "1px solid #cbd5e1", color: "#475569", padding: "6px 12px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer" }}
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  style={{ background: "#f8fafc", border: "1px solid #cbd5e1", color: "#475569", padding: "6px 12px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer" }}
                >
                  Collapse All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: GROUPED BY PROJECT DOSSIER (JUST LIKE ON ADMIN / STAFF SIDE)      */}
        {/* ========================================================================= */}
        {viewMode === "project" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {projectDossiers.length === 0 ? (
              <div className="empty-state" style={{ background: "rgba(255,255,255,0.5)", borderRadius: "18px", border: "2px dashed #cbd5e1", padding: "3.5rem 2rem", textAlign: "center" }}>
                <Building2 size={48} color="#94a3b8" style={{ margin: "0 auto 1rem auto" }} />
                <h3 style={{ color: "#475569", margin: "0 0 6px 0", fontSize: "1.2rem", fontWeight: "700" }}>No project dossiers found</h3>
                <p style={{ color: "#64748b", margin: 0, fontSize: "0.95rem" }}>Try adjusting your search query or status filters.</p>
              </div>
            ) : (
              projectDossiers.map(dossier => {
                const isExpanded = isDossierExpanded(dossier.id);
                const hasPending = dossier.pendingCount > 0;
                const hasAction = dossier.actionRequiredCount > 0;
                const allApproved = dossier.approvedCount === dossier.totalCount && dossier.totalCount > 0;

                const borderStatusColor = hasAction ? "#ef4444" : hasPending ? "#f59e0b" : allApproved ? "#10b981" : "#0038A8";

                return (
                  <div
                    key={dossier.id}
                    style={{
                      background: "#ffffff",
                      borderRadius: "20px",
                      border: "1.5px solid #e2e8f0",
                      borderLeft: `5px solid ${borderStatusColor}`,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                      overflow: "hidden",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {/* DOSSIER HEADER CARD */}
                    <div
                      onClick={() => toggleDossier(dossier.id)}
                      style={{
                        padding: "1.25rem 1.5rem",
                        background: hasPending ? "linear-gradient(180deg, #fdfbf7 0%, #ffffff 100%)" : "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "1.25rem",
                        borderBottom: isExpanded ? "1px solid #f1f5f9" : "none"
                      }}
                    >
                      {/* Left: Project Dossier Title & Meta */}
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: "280px", flex: 1 }}>
                        <div style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "14px",
                          background: hasPending ? "#fef3c7" : allApproved ? "#d1fae5" : "#eff6ff",
                          color: hasPending ? "#b45309" : allApproved ? "#059669" : "#0038A8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
                        }}>
                          <Building2 size={24} />
                        </div>

                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                              {dossier.projectName}
                            </h3>
                            <span style={{
                              fontSize: "0.75rem",
                              fontWeight: "800",
                              padding: "3px 9px",
                              borderRadius: "999px",
                              background: hasAction ? "#fee2e2" : hasPending ? "#fffbeb" : "#f0fdf4",
                              color: hasAction ? "#b91c1c" : hasPending ? "#b45309" : "#16a34a",
                              border: `1px solid ${hasAction ? "#fca5a5" : hasPending ? "#fde68a" : "#bbf7d0"}`
                            }}>
                              {hasAction ? "Action Required on Requirements" : hasPending ? `${dossier.pendingCount} Form${dossier.pendingCount > 1 ? "s" : ""} Awaiting Review` : "All Forms Approved ✓"}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.85rem", color: "#64748b", flexWrap: "wrap" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <MapPin size={13} color="#94a3b8" /> {dossier.projectAddress}
                            </span>
                            <span>•</span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <FolderKanban size={13} color="#94a3b8" /> {dossier.applications.length} Connected Permit Form{dossier.applications.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Milestone Flow Chips & Expand Arrow */}
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          {dossier.applications.map((app, idx) => {
                            const badge = getPermitTypeBadge(app.permitType, app.id);
                            const stConfig = getStatusConfig(app.status);
                            return (
                              <React.Fragment key={app.id}>
                                <div style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "4px 10px",
                                  borderRadius: "8px",
                                  background: stConfig.bg,
                                  border: `1px solid ${stConfig.border}50`,
                                  fontSize: "0.78rem"
                                }}>
                                  <span style={{ fontWeight: "800", color: badge.color }}>[{badge.code}]</span>
                                  <span style={{ fontWeight: "700", color: "#1e293b" }}>{badge.label}</span>
                                  <span style={{ fontWeight: "700", color: stConfig.color }}>• {stConfig.label}</span>
                                </div>
                                {idx < dossier.applications.length - 1 && (
                                  <ArrowRight size={13} color="#94a3b8" />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>

                        <div style={{ 
                          width: "32px", 
                          height: "32px", 
                          borderRadius: "8px", 
                          background: "#f8fafc", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          color: "#64748b"
                        }}>
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </div>
                      </div>
                    </div>

                    {/* EXPANDED DOSSIER CONTENT: Connected Applications List */}
                    {isExpanded && (
                      <div style={{ padding: "1.25rem 1.5rem", background: "#f8fafc" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
                          {dossier.applications.map(app => {
                            const statusConfig = getStatusConfig(app.status);
                            const StatusIcon = statusConfig.icon;
                            const badge = getPermitTypeBadge(app.permitType, app.id);

                            return (
                              <div
                                key={app.id}
                                style={{
                                  background: "#ffffff",
                                  borderRadius: "16px",
                                  border: "1.5px solid #e2e8f0",
                                  borderLeft: `4px solid ${statusConfig.border}`,
                                  padding: "1.15rem 1.25rem",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "space-between",
                                  gap: "0.75rem",
                                  transition: "transform 0.15s ease, box-shadow 0.15s ease"
                                }}
                              >
                                <div>
                                  {/* Top Row: Badges & Archive */}
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "0.6rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                      {/* Tracking ID with copy button */}
                                      <button
                                        type="button"
                                        onClick={(e) => copyToClipboard(app.id, e)}
                                        title="Click to copy Tracking ID"
                                        style={{
                                          background: "#f8fafc",
                                          border: "1px solid #cbd5e1",
                                          borderRadius: "8px",
                                          padding: "3px 8px",
                                          fontSize: "0.82rem",
                                          fontWeight: "800",
                                          color: "#0f172a",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "4px",
                                          cursor: "pointer"
                                        }}
                                      >
                                        <code style={{ fontFamily: "monospace" }}>{app.id}</code>
                                        {copiedId === app.id ? <Check size={12} color="#16a34a" /> : <Copy size={12} color="#64748b" />}
                                      </button>

                                      {/* Stage Badge */}
                                      <span style={{
                                        background: badge.bg,
                                        color: badge.color,
                                        fontSize: "0.74rem",
                                        fontWeight: "800",
                                        padding: "3px 8px",
                                        borderRadius: "6px",
                                        border: `1px solid ${badge.border}`
                                      }}>
                                        {badge.stage} · {badge.label}
                                      </span>
                                    </div>

                                    {/* Status Badge */}
                                    <span style={{
                                      backgroundColor: statusConfig.bg,
                                      color: statusConfig.color,
                                      fontWeight: "800",
                                      padding: "4px 10px",
                                      borderRadius: "20px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      fontSize: "0.78rem",
                                      flexShrink: 0
                                    }}>
                                      <StatusIcon size={13} strokeWidth={2.5} /> {statusConfig.label}
                                    </span>
                                  </div>

                                  {/* Project Title & Category */}
                                  <h4 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0", lineHeight: "1.35" }}>
                                    {typeof app.projectName === "string" ? app.projectName : "Permit Application"}
                                  </h4>
                                  <p style={{ color: "#64748b", fontWeight: "500", fontSize: "0.82rem", margin: 0, textTransform: "capitalize" }}>
                                    {String(app.permitType || "locational_clearance").replace(/_/g, " ")}
                                  </p>
                                </div>

                                {/* Footer Row: Submission Date & Actions */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.6rem", borderTop: "1px solid #f1f5f9", gap: "8px", flexWrap: "wrap" }}>
                                  <span style={{ color: "#94a3b8", fontWeight: "600", fontSize: "0.78rem" }}>
                                    Submitted: {app.dateSubmitted || "Online Portal"}
                                  </span>

                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <button
                                      type="button"
                                      onClick={(e) => handleArchiveCard(app.id, e)}
                                      title="Archive this form"
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
                                        color: "#64748b"
                                      }}
                                    >
                                      <Archive size={12} /> Archive
                                    </button>

                                    <Link
                                      href={`/applicant/track/${app.id}`}
                                      style={{
                                        background: "linear-gradient(135deg, #0038A8 0%, #021a4f 100%)",
                                        color: "#ffffff",
                                        padding: "5px 12px",
                                        borderRadius: "8px",
                                        fontSize: "0.8rem",
                                        fontWeight: "700",
                                        textDecoration: "none",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        boxShadow: "0 2px 6px rgba(0, 56, 168, 0.25)"
                                      }}
                                    >
                                      <span>Track & Details</span>
                                      <ArrowRight size={13} />
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: FLAT APPLICATIONS GRID                                            */}
        {/* ========================================================================= */}
        {viewMode === "flat" && (
          <div className="app-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
            {filteredApps.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: "1 / -1", background: "rgba(255,255,255,0.5)", borderRadius: "18px", border: "2px dashed #cbd5e1", padding: "3.5rem 2rem", textAlign: "center" }}>
                <FileText size={48} color="#94a3b8" style={{ margin: "0 auto 1rem auto" }} />
                <h3 style={{ color: "#475569", margin: "0 0 6px 0", fontSize: "1.2rem", fontWeight: "700" }}>No applications found</h3>
                <p style={{ color: "#64748b", margin: 0 }}>Try adjusting your search or filters.</p>
              </div>
            ) : (
              filteredApps.map(app => {
                const statusConfig = getStatusConfig(app.status);
                const StatusIcon = statusConfig.icon;
                const badge = getPermitTypeBadge(app.permitType, app.id);

                return (
                  <div 
                    key={app.id} 
                    className="app-card" 
                    style={{
                      background: "#ffffff",
                      border: `1.5px solid #e2e8f0`,
                      borderLeft: `4px solid ${statusConfig.border}`,
                      borderRadius: "18px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                      transition: "all 0.25s ease",
                      padding: "1.35rem 1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="app-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "0.85rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={(e) => copyToClipboard(app.id, e)}
                            title="Click to copy Tracking ID"
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #cbd5e1",
                              borderRadius: "8px",
                              padding: "3px 8px",
                              fontSize: "0.82rem",
                              fontWeight: "800",
                              color: "#0f172a",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              cursor: "pointer"
                            }}
                          >
                            <code style={{ fontFamily: "monospace" }}>{app.id}</code>
                            {copiedId === app.id ? <Check size={12} color="#16a34a" /> : <Copy size={12} color="#64748b" />}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleArchiveCard(app.id, e)}
                            title="Archive application"
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              padding: "3px 8px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              color: "#64748b"
                            }}
                          >
                            <Archive size={12} />
                            <span>Archive</span>
                          </button>
                        </div>

                        <span className="app-status" style={{ 
                          backgroundColor: statusConfig.bg, 
                          color: statusConfig.color, 
                          fontWeight: "800", 
                          padding: "5px 12px", 
                          borderRadius: "20px", 
                          display: "inline-flex", 
                          alignItems: "center", 
                          gap: "6px", 
                          flexShrink: 0,
                          fontSize: "0.8rem"
                        }}>
                          <StatusIcon size={14} strokeWidth={2.5} /> {statusConfig.label}
                        </span>
                      </div>

                      {/* Card Content */}
                      <span style={{
                        background: badge.bg,
                        color: badge.color,
                        fontSize: "0.72rem",
                        fontWeight: "800",
                        padding: "2px 7px",
                        borderRadius: "5px",
                        border: `1px solid ${badge.border}`,
                        display: "inline-block",
                        marginBottom: "6px"
                      }}>
                        {badge.stage} · {badge.label}
                      </span>

                      <h3 className="app-title" style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0", lineHeight: "1.35" }}>
                        {typeof app.projectName === "string" ? app.projectName : "Permit Application"}
                      </h3>
                      <p className="app-type" style={{ color: "#64748b", fontWeight: "500", fontSize: "0.85rem", margin: 0, textTransform: "capitalize" }}>
                        {String(app.permitType || "locational_clearance").replace(/_/g, " ")}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="app-footer" style={{ marginTop: "1.25rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="app-date" style={{ color: "#94a3b8", fontWeight: "600", fontSize: "0.82rem" }}>
                        Submitted: {app.dateSubmitted || "Online Portal"}
                      </span>

                      <Link
                        href={`/applicant/track/${app.id}`}
                        style={{
                          background: "linear-gradient(135deg, #0038A8 0%, #021a4f 100%)",
                          color: "#ffffff",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          fontSize: "0.82rem",
                          fontWeight: "700",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          boxShadow: "0 2px 6px rgba(0, 56, 168, 0.25)"
                        }}
                      >
                        <span>View Details</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>

      {/* Floating Toast Notification */}
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
