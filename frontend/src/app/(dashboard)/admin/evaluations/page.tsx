"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { usePermitContext } from "../../../../context/PermitContext";
import { 
  Search, Filter, AlertCircle, FileCheck, MapPin, Eye, ChevronDown, 
  ChevronRight, FolderKanban, FolderOpen, Building2, User, Phone, 
  CheckCircle2, Clock, XCircle, ArrowRight, Layers, List, ShieldCheck, 
  Sparkles, Check, Copy, Calendar, CalendarDays, X, RotateCcw
} from "lucide-react";
import Link from "next/link";
import { PermitApplication } from "../../../../types";
import { 
  groupApplicationsIntoProjectDossiers, 
  ProjectDossier, 
  compareAppsNewestFirst, 
  compareDossiersNewestFirst, 
  getAppTimestamp, 
  parseDateToTimestamp 
} from "@/utils/projectGrouping";

type ViewMode = "project" | "applicant" | "flat";

export default function StaffEvaluationsPage() {
  const { applications, updateApplication } = usePermitContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("project");
  const [expandedDossiers, setExpandedDossiers] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Calendar / Date Filter State
  const [showCalendarFilter, setShowCalendarFilter] = useState(false);
  const [datePreset, setDatePreset] = useState("all"); // 'all' | 'today' | '7days' | 'this_month' | '30days' | 'custom'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close calendar popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendarFilter(false);
      }
    };
    if (showCalendarFilter) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showCalendarFilter]);

  // Robust date parser for various string formats ("October 01, 2026", "2026-10-01", etc.)
  const parseAppDate = (dateStr?: string): Date | null => {
    if (!dateStr) return null;
    const clean = String(dateStr).trim();
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) return parsed;
    const parts = clean.split(",");
    if (parts.length >= 2) {
      const fallback = new Date(`${parts[0]}, ${parts[1].trim().split(" ")[0]}`);
      if (!isNaN(fallback.getTime())) return fallback;
    }
    return null;
  };

  const isDateFilterActive = datePreset !== "all" || Boolean(startDate) || Boolean(endDate);

  const getDateFilterButtonLabel = () => {
    if (datePreset === "today") return "Date: Today";
    if (datePreset === "7days") return "Date: Last 7 Days";
    if (datePreset === "this_month") return "Date: This Month";
    if (datePreset === "30days") return "Date: Last 30 Days";
    if (startDate && endDate) {
      return `${startDate} → ${endDate}`;
    }
    if (startDate) return `From: ${startDate}`;
    if (endDate) return `To: ${endDate}`;
    return "Calendar Filter";
  };

  const handleStartEvaluation = (targetApp: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!targetApp || !targetApp.id) return;
    const curStatus = (targetApp.status || "").toLowerCase().trim();
    if (curStatus === "pending") {
      const curId = String(targetApp.id).trim();
      const lowerId = curId.toLowerCase();
      const upperId = curId.toUpperCase();

      const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      let curStaffName = "";
      let curStaffEmail = "";
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          if (u.name) curStaffName = u.name;
          if (u.email) curStaffEmail = u.email;
        } catch (e) {}
      }

      [curId, lowerId, upperId].forEach(k => {
        localStorage.setItem(`etayo_status_${k}`, "under_review");
        if (curStaffName) localStorage.setItem(`etayo_evaluated_by_${k}`, curStaffName);
        if (curStaffEmail) localStorage.setItem(`etayo_evaluator_email_${k}`, curStaffEmail);
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("etayo_applications_updated"));
      }
      if (updateApplication) {
        updateApplication({
          ...targetApp,
          status: "under_review",
          trackingSteps: (targetApp.trackingSteps || []).map((step: any, idx: number) => {
            if (idx === 0) return { ...step, status: "completed" };
            if (idx === 1) return { ...step, status: "in-progress" };
            return step;
          })
        });
      }
      try {
        const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
        const apiBase = rawApi.endsWith("/api") ? rawApi : `${rawApi}/api`;
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        fetch(`${apiBase}/permits/${encodeURIComponent(targetApp.id)}/status`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            status: "under_review",
            remarks: "Staff evaluation initiated."
          })
        }).catch(() => {});
      } catch (e) {}
    }
  };

  const copyToClipboard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter individual applications and sort newest first
  const filteredApps = useMemo(() => {
    const list = applications.filter(app => {
      const pName = (app.projectName || app.projectDescription || "Locational Clearance").toLowerCase();
      const appId = (app.id || "").toLowerCase();
      const aName = (app.applicantName || "").toLowerCase();
      const pAddr = (app.projectAddress || app.location?.address || "").toLowerCase();
      const sTerm = searchTerm.toLowerCase();

      const matchesSearch = pName.includes(sTerm) || appId.includes(sTerm) || aName.includes(sTerm) || pAddr.includes(sTerm);
      const matchesStatus = filterStatus === "all" || app.status === filterStatus;
      
      const appType = (app.permitType || "locational_clearance").toLowerCase();
      const matchesType = filterType === "all" || appType.includes(filterType.toLowerCase());

      const matchesDate = (() => {
        if (datePreset === "all" && !startDate && !endDate) return true;
        const appDate = parseAppDate(app.dateSubmitted || (app as any).createdAt || (app as any).submissionDate);
        if (!appDate) return true;

        const now = new Date();

        if (datePreset === "today") {
          return appDate.getFullYear() === now.getFullYear() &&
                 appDate.getMonth() === now.getMonth() &&
                 appDate.getDate() === now.getDate();
        }
        if (datePreset === "7days") {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          sevenDaysAgo.setHours(0, 0, 0, 0);
          return appDate >= sevenDaysAgo;
        }
        if (datePreset === "this_month") {
          return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
        }
        if (datePreset === "30days") {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          thirtyDaysAgo.setHours(0, 0, 0, 0);
          return appDate >= thirtyDaysAgo;
        }
        if (startDate || endDate) {
          let valid = true;
          if (startDate) {
            const start = new Date(`${startDate}T00:00:00`);
            if (!isNaN(start.getTime())) valid = valid && appDate >= start;
          }
          if (endDate) {
            const end = new Date(`${endDate}T23:59:59`);
            if (!isNaN(end.getTime())) valid = valid && appDate <= end;
          }
          return valid;
        }
        return true;
      })();

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });

    return list.sort(compareAppsNewestFirst);
  }, [applications, searchTerm, filterStatus, filterType, datePreset, startDate, endDate]);

  // Group applications by Project Dossier (Stage 1 Locational Clearance + Stage 2 Building Permit of the same project)
  const projectDossiers = useMemo(() => {
    return groupApplicationsIntoProjectDossiers(filteredApps);
  }, [filteredApps]);

  // Group applications by Applicant Name (Sorted newest first)
  const applicantDossiers = useMemo(() => {
    const groups: Record<string, ProjectDossier> = {};

    filteredApps.forEach(app => {
      const normApplicant = (app.applicantName || "Unknown Applicant").trim().toLowerCase();
      const groupKey = normApplicant;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: `APP-${Object.keys(groups).length + 1}`,
          applicantName: app.applicantName || "Unknown Applicant",
          applicantPhone: app.applicantPhone || "",
          applicantEmail: app.applicantEmail || "",
          projectName: `${app.applicantName}'s Project Portfolio`,
          projectAddress: app.projectAddress || app.location?.address || "Sto. Tomas, Pampanga",
          applications: [],
          totalCount: 0,
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          actionRequiredCount: 0,
          latestDate: app.dateSubmitted || (app as any).createdAt || new Date().toISOString()
        };
      } else {
        const curTime = parseDateToTimestamp(groups[groupKey].latestDate);
        const appTime = getAppTimestamp(app);
        if (appTime > curTime) {
          groups[groupKey].latestDate = app.dateSubmitted || (app as any).createdAt || groups[groupKey].latestDate;
        }
      }

      groups[groupKey].applications.push(app);
      groups[groupKey].totalCount++;
      if (app.status === "pending" || app.status === "under_review") {
        groups[groupKey].pendingCount++;
      } else if (app.status === "approved" || app.status === "released") {
        groups[groupKey].approvedCount++;
      } else if (app.status === "rejected") {
        groups[groupKey].rejectedCount++;
        groups[groupKey].actionRequiredCount++;
      } else if (app.status === "incomplete_requirements") {
        groups[groupKey].actionRequiredCount++;
      }
    });

    return Object.values(groups).sort(compareDossiersNewestFirst);
  }, [filteredApps]);

  const toggleDossier = (id: string) => {
    setExpandedDossiers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const isDossierExpanded = (id: string, _hasPending?: boolean) => {
    return Boolean(expandedDossiers[id]);
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    const activeDossiers = viewMode === "applicant" ? applicantDossiers : projectDossiers;
    activeDossiers.forEach(d => { next[d.id] = true; });
    setExpandedDossiers(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    const activeDossiers = viewMode === "applicant" ? applicantDossiers : projectDossiers;
    activeDossiers.forEach(d => { next[d.id] = false; });
    setExpandedDossiers(next);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "approved":
      case "released":
        return { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", icon: CheckCircle2, label: "Approved" };
      case "rejected":
        return { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", icon: XCircle, label: "Rejected" };
      case "under_review":
        return { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", icon: Clock, label: "Under Review" };
      case "pending":
      default:
        return { bg: "#fffbeb", color: "#d97706", border: "#fde68a", icon: Clock, label: "Pending" };
    }
  };

  const getPermitTypeBadge = (type?: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("locational") || t.includes("zoning")) {
      return { label: "Locational Clearance", code: "LC", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" };
    }
    if (t.includes("building")) {
      return { label: "Building Permit", code: "BP", bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" };
    }
    if (t.includes("occupancy")) {
      return { label: "Certificate of Occupancy", code: "CO", bg: "#faf5ff", color: "#7e22ce", border: "#e9d5ff" };
    }
    return { label: (type || "Permit").replace(/_/g, " "), code: "PERMIT", bg: "#f8fafc", color: "#475569", border: "#e2e8f0" };
  };

  // KPI calculations
  const totalDossiersCount = projectDossiers.length;
  const pendingAppsCount = applications.filter(a => a.status === "pending" || a.status === "under_review").length;
  const approvedAppsCount = applications.filter(a => a.status === "approved" || a.status === "released").length;

  return (
    <div className="dashboard-page animate-fade-in-up" style={{ maxWidth: "1380px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* HEADER */}
      <header className="page-header" style={{ 
        background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.9)",
        boxShadow: "0 10px 35px rgba(0, 0, 0, 0.14)",
        borderRadius: "20px",
        padding: "1.25rem 1.75rem",
        marginBottom: "1.25rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "4px 12px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: "700", color: "#1d4ed8", marginBottom: "0.5rem" }}>
            <ShieldCheck size={14} /> Official Sto. Tomas Engineering Office
          </div>
          <h1 className="page-title" style={{ fontSize: "2rem", fontWeight: "800", background: "linear-gradient(90deg, #021a4f 0%, #0038A8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "flex", alignItems: "center", gap: "0.75rem", margin: "0 0 0.25rem 0", letterSpacing: "-0.02em" }}>
            <FileCheck size={32} color="#0038A8" /> Staff Evaluation Hub
          </h1>
          <p className="page-subtitle" style={{ fontSize: "0.95rem", color: "#475569", margin: 0 }}>
            Review, evaluate, and approve multi-step permit applications grouped by applicant project dossiers.
          </p>
        </div>

        {/* VIEW MODE TOGGLE BUTTONS */}
        <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "14px", border: "1px solid #e2e8f0", gap: "4px" }}>
          <button
            onClick={() => setViewMode("project")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "10px",
              fontSize: "0.85rem",
              fontWeight: "700",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: viewMode === "project" ? "#ffffff" : "transparent",
              color: viewMode === "project" ? "#1d4ed8" : "#64748b",
              boxShadow: viewMode === "project" ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
            }}
            title="Group submissions by Project Dossier (e.g. Locational Clearance + Building Permit for same site)"
          >
            <FolderKanban size={16} /> Group by Project Dossier
          </button>

          <button
            onClick={() => setViewMode("applicant")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "10px",
              fontSize: "0.85rem",
              fontWeight: "700",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: viewMode === "applicant" ? "#ffffff" : "transparent",
              color: viewMode === "applicant" ? "#1d4ed8" : "#64748b",
              boxShadow: viewMode === "applicant" ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
            }}
            title="Group submissions by Applicant Name"
          >
            <User size={16} /> By Applicant
          </button>

          <button
            onClick={() => setViewMode("flat")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "10px",
              fontSize: "0.85rem",
              fontWeight: "700",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: viewMode === "flat" ? "#ffffff" : "transparent",
              color: viewMode === "flat" ? "#1d4ed8" : "#64748b",
              boxShadow: viewMode === "flat" ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
            }}
            title="Show flat table of all individual submissions"
          >
            <List size={16} /> All Submissions (Flat)
          </button>
        </div>
      </header>

      {/* KPI METRIC CARDS */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
        <div style={{ background: "white", padding: "1.25rem 1.5rem", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#64748b" }}>Project Dossiers</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FolderOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "#0f172a" }}>{totalDossiersCount}</div>
          <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "2px" }}>Active construction projects</div>
        </div>

        <div style={{ background: "white", padding: "1.25rem 1.5rem", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#d97706" }}>Pending Evaluations</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fffbeb", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "#d97706" }}>{pendingAppsCount}</div>
          <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "2px" }}>Forms awaiting engineer sign-off</div>
        </div>

        <div style={{ background: "white", padding: "1.25rem 1.5rem", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#16a34a" }}>Approved Permits</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "#16a34a" }}>{approvedAppsCount}</div>
          <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "2px" }}>Clearances & permits released</div>
        </div>

        <div style={{ background: "white", padding: "1.25rem 1.5rem", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#64748b" }}>Total Submissions</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f8fafc", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Layers size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "#0f172a" }}>{applications.length}</div>
          <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "2px" }}>Across all municipal categories</div>
        </div>
      </section>

      {/* FILTER & SEARCH TOOLBAR */}
      <section style={{ background: "white", padding: "1.5rem", borderRadius: "20px", border: "1px solid #e2e8f0", marginBottom: "1.75rem", boxShadow: "0 4px 20px -5px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          {/* Search Box */}
          <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "14px", padding: "0.5rem 1rem", flex: "1", minWidth: "280px" }}>
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Search by ID, applicant name, project title, or address..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", padding: "0.45rem 0.75rem", width: "100%", color: "#1e293b", fontSize: "0.95rem" }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} style={{ border: "none", background: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.85rem", fontWeight: "700" }}>Clear</button>
            )}
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: "0.65rem 1rem", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#334155", fontWeight: "600", fontSize: "0.88rem", outline: "none", cursor: "pointer" }}
          >
            <option value="all">All Permit Types</option>
            <option value="locational">Locational Clearance (LC)</option>
            <option value="building">Building Permit (BP)</option>
            <option value="occupancy">Certificate of Occupancy (CO)</option>
          </select>

          {/* Filter Status Button */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            style={{ background: showFilters ? "#eff6ff" : "white", border: `1px solid ${showFilters ? "#93c5fd" : "#cbd5e1"}`, color: showFilters ? "#1d4ed8" : "#475569", padding: "0.65rem 1.15rem", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", fontSize: "0.88rem", cursor: "pointer", transition: "all 0.2s" }}
          >
            <Filter size={16} /> Status Filter <ChevronDown size={15} style={{ transform: showFilters ? "rotate(180deg)" : "rotate(0)", transition: "0.2s" }} />
          </button>

          {/* Calendar / Date Filter Button & Popover */}
          <div ref={calendarRef} style={{ position: "relative" }}>
            <button 
              type="button"
              onClick={() => setShowCalendarFilter(!showCalendarFilter)}
              style={{
                background: isDateFilterActive ? "#eff6ff" : "white",
                border: `1.5px solid ${isDateFilterActive ? "#2563eb" : "#cbd5e1"}`,
                color: isDateFilterActive ? "#1d4ed8" : "#475569",
                padding: "0.65rem 1.15rem",
                borderRadius: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: "700",
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: isDateFilterActive ? "0 2px 8px rgba(37,99,235,0.18)" : "none",
                transition: "all 0.2s"
              }}
              title="Filter applications by submission calendar date"
            >
              <Calendar size={16} color={isDateFilterActive ? "#2563eb" : "#64748b"} />
              <span>{getDateFilterButtonLabel()}</span>
              <ChevronDown size={15} style={{ transform: showCalendarFilter ? "rotate(180deg)" : "rotate(0)", transition: "0.2s" }} />
            </button>

            {/* Popover Dropdown Card */}
            {showCalendarFilter && (
              <div 
                className="animate-fade-in-up"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  zIndex: 999,
                  width: "330px",
                  background: "#ffffff",
                  borderRadius: "18px",
                  border: "1.5px solid #cbd5e1",
                  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.16)",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem"
                }}
              >
                {/* Popover Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CalendarDays size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "0.92rem", fontWeight: "800", color: "#0f172a" }}>Submission Calendar</h4>
                      <p style={{ margin: 0, fontSize: "0.74rem", color: "#64748b" }}>Filter applications by submission date</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCalendarFilter(false)}
                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Quick Presets */}
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                    Quick Presets
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px" }}>
                    {[
                      { id: "all", label: "All Dates" },
                      { id: "today", label: "Today" },
                      { id: "7days", label: "Last 7 Days" },
                      { id: "this_month", label: "This Month" },
                      { id: "30days", label: "Last 30 Days" }
                    ].map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setDatePreset(preset.id);
                          if (preset.id !== "custom") {
                            setStartDate("");
                            setEndDate("");
                          }
                        }}
                        style={{
                          padding: "7px 10px",
                          borderRadius: "9px",
                          fontSize: "0.8rem",
                          fontWeight: "700",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          background: datePreset === preset.id && !startDate && !endDate ? "#2563eb" : "#f8fafc",
                          color: datePreset === preset.id && !startDate && !endDate ? "#ffffff" : "#334155",
                          border: `1px solid ${datePreset === preset.id && !startDate && !endDate ? "#2563eb" : "#e2e8f0"}`,
                          textAlign: "center"
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Date Range */}
                <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: "0.85rem" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                    Custom Date Range
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div>
                      <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "3px" }}>Date From:</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setDatePreset("custom");
                        }}
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          borderRadius: "9px",
                          border: "1.5px solid #cbd5e1",
                          fontSize: "0.84rem",
                          color: "#0f172a",
                          background: "#ffffff",
                          outline: "none"
                        }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "3px" }}>Date To:</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setDatePreset("custom");
                        }}
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          borderRadius: "9px",
                          border: "1.5px solid #cbd5e1",
                          fontSize: "0.84rem",
                          color: "#0f172a",
                          background: "#ffffff",
                          outline: "none"
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Popover Actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem", marginTop: "2px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setDatePreset("all");
                      setStartDate("");
                      setEndDate("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <RotateCcw size={13} /> Reset All
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCalendarFilter(false)}
                    style={{
                      background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "6px 16px",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(37,99,235,0.2)"
                    }}
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Expand/Collapse Controls for Grouped Views */}
          {viewMode !== "flat" && (
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={expandAll}
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", padding: "6px 12px", borderRadius: "10px", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer" }}
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", padding: "6px 12px", borderRadius: "10px", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer" }}
              >
                Collapse All
              </button>
            </div>
          )}
        </div>

        {/* Active Date Filter Chip Row */}
        {isDateFilterActive && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "0.85rem", paddingTop: "0.75rem", borderTop: "1px dashed #e2e8f0", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#64748b" }}>Active Date Filter:</span>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#eff6ff",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
              borderRadius: "999px",
              padding: "4px 12px",
              fontSize: "0.8rem",
              fontWeight: "700",
              boxShadow: "0 1px 3px rgba(37,99,235,0.08)"
            }}>
              <Calendar size={13} color="#2563eb" />
              <span>{getDateFilterButtonLabel()}</span>
              <button
                type="button"
                onClick={() => {
                  setDatePreset("all");
                  setStartDate("");
                  setEndDate("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#1d4ed8",
                  cursor: "pointer",
                  display: "inline-flex",
                  padding: "1px",
                  borderRadius: "50%",
                  marginLeft: "2px"
                }}
                title="Clear date filter"
              >
                <X size={13} />
              </button>
            </span>
            <span style={{ fontSize: "0.76rem", color: "#64748b", fontWeight: "600" }}>
              ({filteredApps.length} submission{filteredApps.length !== 1 ? "s" : ""} matched)
            </span>
          </div>
        )}

        {/* Filter Badges Row */}
        {showFilters && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
            {[
              { id: "all", label: "All Statuses" },
              { id: "pending", label: "Pending Evaluation" },
              { id: "under_review", label: "Under Review" },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" }
            ].map(status => (
              <button
                key={status.id}
                onClick={() => setFilterStatus(status.id)}
                style={{
                  padding: "0.45rem 1rem",
                  borderRadius: "99px",
                  fontWeight: "700",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  background: filterStatus === status.id ? "#1d4ed8" : "#f8fafc",
                  color: filterStatus === status.id ? "white" : "#475569",
                  border: `1px solid ${filterStatus === status.id ? "#1d4ed8" : "#e2e8f0"}`
                }}
              >
                {status.label}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* VIEW 1 & 2: GROUPED BY PROJECT DOSSIER / APPLICANT                       */}
      {/* ========================================================================= */}
      {viewMode !== "flat" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {(() => {
            const activeDossiers = viewMode === "applicant" ? applicantDossiers : projectDossiers;

            if (activeDossiers.length === 0) {
              return (
                <div style={{ background: "white", padding: "4rem 2rem", borderRadius: "20px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                  <FolderOpen size={48} color="#94a3b8" style={{ margin: "0 auto 1rem auto" }} />
                  <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#1e293b", margin: "0 0 0.5rem 0" }}>No matching project dossiers found</h3>
                  <p style={{ color: "#64748b", margin: 0, fontSize: "0.95rem" }}>Try adjusting your search query or status filters.</p>
                </div>
              );
            }

            return activeDossiers.map(dossier => {
              const hasPending = dossier.pendingCount > 0;
              const isExpanded = isDossierExpanded(dossier.id, hasPending);
              const nextPendingApp = dossier.applications.find(a => a.status === "pending" || a.status === "under_review");

              return (
                <div 
                  key={dossier.id}
                  style={{
                    background: "white",
                    borderRadius: "20px",
                    border: hasPending ? "1.5px solid #cbd5e1" : "1.5px solid #e2e8f0",
                    boxShadow: hasPending ? "0 8px 24px -5px rgba(0,0,0,0.06)" : "0 2px 8px rgba(0,0,0,0.02)",
                    overflow: "hidden",
                    transition: "all 0.2s ease"
                  }}
                >
                  {/* DOSSIER HEADER CARD */}
                  <div 
                    onClick={() => toggleDossier(dossier.id)}
                    style={{
                      padding: "1.25rem 1.75rem",
                      background: hasPending ? "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)" : "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "1.25rem",
                      borderBottom: isExpanded ? "1px solid #e2e8f0" : "none"
                    }}
                  >
                    {/* Left: Project & Applicant Identification */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: "320px", flex: "1" }}>
                      <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "14px",
                        background: hasPending ? "#eff6ff" : "#f1f5f9",
                        color: hasPending ? "#1d4ed8" : "#475569",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
                      }}>
                        <Building2 size={24} />
                      </div>

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "3px" }}>
                          <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                            {dossier.projectName}
                          </h3>
                          <span style={{
                            fontSize: "0.75rem",
                            fontWeight: "800",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: hasPending ? "#fffbeb" : "#f0fdf4",
                            color: hasPending ? "#b45309" : "#16a34a",
                            border: `1px solid ${hasPending ? "#fde68a" : "#bbf7d0"}`
                          }}>
                            {hasPending ? `${dossier.pendingCount} Form${dossier.pendingCount > 1 ? "s" : ""} Awaiting Review` : "All Forms Approved ✓"}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.85rem", color: "#64748b", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: "700", color: "#334155", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <User size={14} color="#64748b" /> {dossier.applicantName}
                          </span>
                          {dossier.applicantPhone && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <Phone size={13} color="#94a3b8" /> {dossier.applicantPhone}
                            </span>
                          )}
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <MapPin size={13} color="#94a3b8" /> {dossier.projectAddress}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Milestone Flow Chips & Action */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                      {/* Milestone Chips Sequence */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        {dossier.applications.map((app, idx) => {
                          const badge = getPermitTypeBadge(app.permitType);
                          const stStyle = getStatusColor(app.status);
                          return (
                            <div 
                              key={app.id} 
                              style={{ 
                                display: "inline-flex", 
                                alignItems: "center", 
                                gap: "6px", 
                                padding: "4px 10px", 
                                borderRadius: "8px", 
                                background: stStyle.bg, 
                                border: `1px solid ${stStyle.border}`,
                                fontSize: "0.78rem"
                              }}
                              title={`${badge.label}: ${(app.status || "PENDING").toUpperCase()} (${app.id})`}
                            >
                              <span style={{ fontWeight: "800", color: badge.color }}>{badge.code}</span>
                              <span style={{ color: "#64748b" }}>•</span>
                              <span style={{ fontWeight: "700", color: stStyle.color, textTransform: "capitalize" }}>
                                {app.status === "approved" ? "Approved" : app.status === "pending" ? "Pending" : (app.status || "Pending")}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Evaluate Next Button Shortcut */}
                      {nextPendingApp && (
                        <Link
                          href={`/staff/evaluate/${nextPendingApp.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEvaluation(nextPendingApp, e);
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "#2563eb",
                            color: "white",
                            padding: "8px 16px",
                            borderRadius: "10px",
                            fontWeight: "700",
                            fontSize: "0.85rem",
                            textDecoration: "none",
                            boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
                            transition: "all 0.15s ease"
                          }}
                        >
                          <Eye size={15} /> Evaluate ({nextPendingApp.id})
                        </Link>
                      )}

                      {/* Expand / Collapse Chevron */}
                      <div style={{ 
                        width: "32px", 
                        height: "32px", 
                        borderRadius: "8px", 
                        background: "#f1f5f9", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        color: "#475569",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease"
                      }}>
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED DOSSIER SUBMISSIONS LIST */}
                  {isExpanded && (
                    <div style={{ background: "#f8fafc", padding: "1rem 1.5rem" }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Layers size={14} /> Permits & Submissions in this Project Dossier ({dossier.applications.length})
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                        {dossier.applications.map((app, appIdx) => {
                          const statusStyle = getStatusColor(app.status);
                          const typeBadge = getPermitTypeBadge(app.permitType);
                          const StatusIcon = statusStyle.icon;

                          return (
                            <div 
                              key={app.id}
                              style={{
                                background: "white",
                                borderRadius: "12px",
                                padding: "1rem 1.25rem",
                                border: "1px solid #e2e8f0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: "1rem",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                              }}
                            >
                              {/* Left: Step / Form Info */}
                              <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: "260px" }}>
                                <div style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "8px",
                                  background: typeBadge.bg,
                                  color: typeBadge.color,
                                  fontWeight: "800",
                                  fontSize: "0.8rem",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  border: `1px solid ${typeBadge.border}`
                                }}>
                                  {appIdx + 1}
                                </div>

                                <div>
                                  <div style={{ fontWeight: "800", fontSize: "0.95rem", color: "#0f172a" }}>
                                    {typeBadge.label}
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                                    <button
                                      onClick={(e) => copyToClipboard(app.id, e)}
                                      style={{
                                        background: "#f1f5f9",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "6px",
                                        padding: "1px 6px",
                                        fontSize: "0.75rem",
                                        fontWeight: "700",
                                        color: "#334155",
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px"
                                      }}
                                      title="Copy Application ID"
                                    >
                                      {app.id} {copiedId === app.id ? <Check size={11} color="#16a34a" /> : <Copy size={11} color="#94a3b8" />}
                                    </button>
                                    <span>•</span>
                                    <span>Submitted: {app.dateSubmitted || "Recent"}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Center: Requirements & Fees */}
                              <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.85rem", color: "#475569" }}>
                                <div>
                                  <span style={{ color: "#64748b" }}>Docs: </span>
                                  <span style={{ fontWeight: "700" }}>{app.requirements?.length || 5} Required</span>
                                </div>
                                <span>•</span>
                                <div>
                                  <span style={{ color: "#64748b" }}>Assessed Fee: </span>
                                  <span style={{ fontWeight: "700", color: "#0f172a" }}>
                                    ₱{app.estimatedFees ? app.estimatedFees.toLocaleString() : "2,500.00"}
                                  </span>
                                </div>
                              </div>

                              {/* Right: Status & Action Button */}
                              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <span style={{
                                  background: statusStyle.bg,
                                  color: statusStyle.color,
                                  border: `1px solid ${statusStyle.border}`,
                                  padding: "5px 12px",
                                  borderRadius: "999px",
                                  fontSize: "0.75rem",
                                  fontWeight: "800",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px"
                                }}>
                                  <StatusIcon size={13} /> {app.status === "under_review" ? "Under Review" : (statusStyle.label || (app.status || "Pending").replace(/_/g, " "))}
                                </span>

                                <Link
                                  href={`/staff/evaluate/${app.id}`}
                                  onClick={(e) => handleStartEvaluation(app, e)}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    background: app.status === "pending" || app.status === "under_review" ? "#2563eb" : "#f8fafc",
                                    color: app.status === "pending" || app.status === "under_review" ? "white" : "#0f172a",
                                    border: `1px solid ${app.status === "pending" || app.status === "under_review" ? "#2563eb" : "#cbd5e1"}`,
                                    padding: "6px 14px",
                                    borderRadius: "8px",
                                    fontWeight: "700",
                                    fontSize: "0.85rem",
                                    textDecoration: "none",
                                    transition: "all 0.15s ease",
                                    boxShadow: app.status === "pending" || app.status === "under_review" ? "0 2px 6px rgba(37,99,235,0.2)" : "none"
                                  }}
                                >
                                  <Eye size={14} /> Evaluate
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: FLAT ALL-SUBMISSIONS TABLE VIEW                                   */}
      {/* ========================================================================= */}
      {viewMode === "flat" && (
        <div style={{ overflowX: "auto", borderRadius: "18px", border: "1px solid #e2e8f0", background: "white", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "0.82rem", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>App ID</th>
                <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "0.82rem", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Applicant</th>
                <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "0.82rem", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Project Details</th>
                <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "0.82rem", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</th>
                <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "0.82rem", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "0.82rem", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
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
                  const typeBadge = getPermitTypeBadge(app.permitType);
                  return (
                    <tr key={app.id} style={{ background: "white", borderBottom: i === filteredApps.length - 1 ? "none" : "1px solid #e2e8f0" }}>
                      <td style={{ padding: "1.2rem 1.5rem" }}>
                        <span style={{ background: "#f1f5f9", padding: "5px 10px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "800", color: "#334155", border: "1px solid #e2e8f0" }}>
                          {app.id}
                        </span>
                      </td>
                      <td style={{ padding: "1.2rem 1.5rem" }}>
                        <div style={{ fontWeight: "700", color: "#0f172a", marginBottom: "3px" }}>{app.applicantName}</div>
                        <div style={{ fontSize: "0.82rem", color: "#64748b" }}>{app.applicantPhone}</div>
                      </td>
                      <td style={{ padding: "1.2rem 1.5rem" }}>
                        <div style={{ fontWeight: "700", color: "#1e293b", marginBottom: "4px" }}>
                          {app.projectName || app.projectDescription || "Locational Clearance"}
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "5px" }}>
                          <MapPin size={13} color="#94a3b8" /> {app.projectAddress || "Sto. Tomas, Pampanga"}
                        </div>
                      </td>
                      <td style={{ padding: "1.2rem 1.5rem" }}>
                        <span style={{ background: typeBadge.bg, color: typeBadge.color, border: `1px solid ${typeBadge.border}`, padding: "4px 10px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "700" }}>
                          {typeBadge.label}
                        </span>
                      </td>
                      <td style={{ padding: "1.2rem 1.5rem" }}>
                        <span style={{ 
                          background: statusStyle.bg, 
                          color: statusStyle.color, 
                          border: `1px solid ${statusStyle.border}`,
                          padding: "5px 12px", 
                          borderRadius: "99px", 
                          fontSize: "0.75rem", 
                          fontWeight: "800", 
                          textTransform: "uppercase", 
                          letterSpacing: "0.05em",
                          display: "inline-block"
                        }}>
                          {app.status === "under_review" ? "Under Review" : (statusStyle.label || (app.status || "Pending").replace(/_/g, " "))}
                        </span>
                      </td>
                      <td style={{ padding: "1.2rem 1.5rem" }}>
                        <Link 
                          href={`/staff/evaluate/${app.id}`} 
                          onClick={(e) => handleStartEvaluation(app, e)}
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "white", border: "1px solid #cbd5e1", color: "#0f172a", padding: "7px 14px", borderRadius: "10px", fontWeight: "700", fontSize: "0.85rem", textDecoration: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}
                        >
                          <Eye size={15} color="#2563eb" /> Evaluate
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
