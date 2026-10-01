"use client";

import React, { useState, useMemo } from "react";
import { formatPhilippineRelativeDateTime } from "@/utils/philippineTime";
import { usePermitContext } from "../../../../context/PermitContext";
import { 
  FileCheck, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Search, 
  RefreshCw, 
  Clock,
  User,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calendar,
  RotateCcw
} from "lucide-react";
import Link from "next/link";
import { SystemLog } from "../../../../types";

export default function StaffEvaluationsPage() {
  const { systemLogs, clearLogs, refreshApplications, applications } = usePermitContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [applicantFilter, setApplicantFilter] = useState<string>("all");
  const [dateFilterPreset, setDateFilterPreset] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Helper to extract or resolve an applicant name for any evaluation log
  const getApplicantForLog = (log: SystemLog): string => {
    // 1. Direct match with applications by ID
    for (const app of applications) {
      if (!app || !app.id) continue;
      if (
        log.id.includes(app.id) ||
        log.message.includes(app.id) ||
        (log.details && log.details.includes(app.id))
      ) {
        if (app.applicantName && app.applicantName.trim()) return app.applicantName.trim();
        if (app.applicantEmail && app.applicantEmail.trim()) return app.applicantEmail.trim();
      }
    }

    // 2. Direct match with applications by email
    if (log.user) {
      const appByEmail = applications.find(a => 
        a.applicantEmail && a.applicantEmail.toLowerCase() === log.user.toLowerCase()
      );
      if (appByEmail?.applicantName?.trim()) return appByEmail.applicantName.trim();
    }

    // 3. Regex match in details or message
    if (log.details) {
      const match = log.details.match(/Applicant\s+([A-Z][a-zA-Z\s\.\-]+?)(?:\s+filed|\s+submitted|\s+requested|\.|\,)/i);
      if (match && match[1]) return match[1].trim();

      const approvedMatch = log.details.match(/Approved for\s+([A-Z][a-zA-Z\s\.\-]+?)(?:\.|\,)/i);
      if (approvedMatch && approvedMatch[1]) return approvedMatch[1].trim();
    }

    if (log.message) {
      const parenMatch = log.message.match(/\(([A-Z][a-zA-Z\s\.\-]+?)\)/);
      if (parenMatch && parenMatch[1] && !parenMatch[1].startsWith("APP-") && !parenMatch[1].includes("@")) {
        return parenMatch[1].trim();
      }
    }

    return "";
  };

  // Filter logs specifically for staff evaluations and permit actions
  const evaluationLogs = useMemo(() => {
    return systemLogs.filter(log => {
      if (log.category === "application") return true;
      const act = (log.action || "").toUpperCase();
      const det = (log.details || "").toLowerCase();
      return (
        act.includes("EVALUAT") || 
        act.includes("PERMIT") || 
        act.includes("APPROV") || 
        act.includes("REJECT") || 
        act.includes("INSPECT") ||
        det.includes("evaluated") ||
        det.includes("reviewed") ||
        det.includes("inspection")
      );
    });
  }, [systemLogs]);

  // Unique applicant names with their evaluation activity counts
  const applicantList = useMemo(() => {
    const counts = new Map<string, number>();

    // Seed all applicants from active applications
    applications.forEach(app => {
      const name = app.applicantName?.trim() || app.applicantEmail?.trim();
      if (name && !name.toLowerCase().includes("dummy") && !name.toLowerCase().includes("test")) {
        counts.set(name, 0);
      }
    });

    // Tally evaluations for each applicant
    evaluationLogs.forEach(log => {
      const applicant = getApplicantForLog(log);
      if (applicant) {
        counts.set(applicant, (counts.get(applicant) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .filter(([name]) => Boolean(name))
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [applications, evaluationLogs]);

  // Date filtering logic
  const matchesDate = (timestamp?: string): boolean => {
    if (!timestamp) return dateFilterPreset === "all" && !startDate && !endDate;

    const logDate = new Date(timestamp);
    if (isNaN(logDate.getTime())) return true;

    const logTime = logDate.getTime();
    const now = new Date();

    if (dateFilterPreset === "today") {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
      return logTime >= startOfToday && logTime <= endOfToday;
    }

    if (dateFilterPreset === "week") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
      return logTime >= sevenDaysAgo && logTime <= now.getTime();
    }

    if (dateFilterPreset === "month") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();
      return logTime >= thirtyDaysAgo && logTime <= now.getTime();
    }

    if (dateFilterPreset === "custom" || startDate || endDate) {
      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`).getTime();
        if (logTime < start) return false;
      }
      if (endDate) {
        const end = new Date(`${endDate}T23:59:59.999`).getTime();
        if (logTime > end) return false;
      }
      return true;
    }

    return true;
  };

  const filteredLogs = useMemo(() => {
    return evaluationLogs.filter(log => {
      const sTerm = searchTerm.toLowerCase();
      const applicant = getApplicantForLog(log);

      const matchesSearch = 
        (log.message || "").toLowerCase().includes(sTerm) ||
        (log.user || "").toLowerCase().includes(sTerm) ||
        (log.details || "").toLowerCase().includes(sTerm) ||
        (log.action || "").toLowerCase().includes(sTerm) ||
        applicant.toLowerCase().includes(sTerm);

      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "approved" && (log.status === "success" || (log.action || "").toUpperCase().includes("APPROV"))) ||
        (statusFilter === "under_review" && (log.status === "info" || (log.action || "").toUpperCase().includes("REVIEW") || (log.action || "").toUpperCase().includes("EVALUAT"))) ||
        (statusFilter === "action_required" && (log.status === "warning" || log.status === "error" || (log.action || "").toUpperCase().includes("REJECT") || (log.action || "").toUpperCase().includes("INCOMPLETE")));

      const matchesApplicant = 
        applicantFilter === "all" ||
        applicant.toLowerCase() === applicantFilter.toLowerCase() ||
        (log.details || "").toLowerCase().includes(applicantFilter.toLowerCase()) ||
        (log.message || "").toLowerCase().includes(applicantFilter.toLowerCase());

      const dateMatches = matchesDate(log.timestamp);

      return matchesSearch && matchesStatus && matchesApplicant && dateMatches;
    });
  }, [evaluationLogs, searchTerm, statusFilter, applicantFilter, dateFilterPreset, startDate, endDate]);

  const approvedCount = evaluationLogs.filter(l => l.status === "success" || (l.action || "").toUpperCase().includes("APPROV")).length;
  const reviewCount = evaluationLogs.filter(l => l.status === "info" || (l.action || "").toUpperCase().includes("REVIEW") || (l.action || "").toUpperCase().includes("EVALUAT")).length;
  const actionRequiredCount = evaluationLogs.filter(l => l.status === "warning" || l.status === "error" || (l.action || "").toUpperCase().includes("REJECT") || (l.action || "").toUpperCase().includes("INCOMPLETE")).length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshApplications();
    } catch (e) {}
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleClearLogs = async () => {
    if (window.confirm("Are you sure you want to clear system evaluation audit logs?")) {
      setIsClearing(true);
      try {
        await clearLogs();
      } catch (e) {}
      setIsClearing(false);
    }
  };

  const formatLogTime = (dateStr?: string) => {
    return formatPhilippineRelativeDateTime(dateStr);
  };

  return (
    <div className="dashboard-page animate-fade-in-up" style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Page Header with White Glass Background Card */}
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
          <h1 className="page-title" style={{ fontSize: "2rem", fontWeight: "800", background: "linear-gradient(90deg, #021a4f 0%, #0038A8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "flex", alignItems: "center", gap: "0.75rem", margin: 0 }}>
            <FileCheck size={30} color="#0038A8" /> Staff Evaluations
          </h1>
          <p className="page-subtitle" style={{ fontSize: "0.95rem", color: "#475569", margin: "0.35rem 0 0 0" }}>
            Real-time audit trails of staff evaluations, permit reviews, and approval workflows.
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
            disabled={isClearing || evaluationLogs.length === 0}
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
              cursor: (isClearing || evaluationLogs.length === 0) ? "not-allowed" : "pointer", 
              opacity: evaluationLogs.length === 0 ? 0.5 : 1,
              transition: "all 0.2s", 
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)" 
            }} 
            onMouseEnter={(e) => { if (evaluationLogs.length > 0) e.currentTarget.style.background = "#fef2f2"; }} 
            onMouseLeave={(e) => { e.currentTarget.style.background = "white"; }}
          >
            <Trash2 size={16} /> Clear Logs
          </button>
        </div>
      </header>

      {/* KPI Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ background: "white", padding: "1.2rem 1.4rem", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Evaluations</span>
            <div style={{ background: "#eff6ff", color: "#0038A8", padding: "6px", borderRadius: "10px" }}><FileCheck size={18} /></div>
          </div>
          <div style={{ fontSize: "2.1rem", fontWeight: "900", color: "#0f172a" }}>{evaluationLogs.length}</div>
          <span style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: "600" }}>✓ Synchronized with system</span>
        </div>

        <div style={{ background: "white", padding: "1.2rem 1.4rem", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Approved & Released</span>
            <div style={{ background: "#ecfdf5", color: "#047857", padding: "6px", borderRadius: "10px" }}><CheckCircle2 size={18} /></div>
          </div>
          <div style={{ fontSize: "2.1rem", fontWeight: "900", color: "#0f172a" }}>{approvedCount}</div>
          <span style={{ fontSize: "0.8rem", color: "#059669", fontWeight: "600" }}>Clearances & Permits granted</span>
        </div>

        <div style={{ background: "white", padding: "1.2rem 1.4rem", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Under Evaluation</span>
            <div style={{ background: "#eff6ff", color: "#2563eb", padding: "6px", borderRadius: "10px" }}><Clock size={18} /></div>
          </div>
          <div style={{ fontSize: "2.1rem", fontWeight: "900", color: "#0f172a" }}>{reviewCount}</div>
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Currently in review pipeline</span>
        </div>

        <div style={{ background: "white", padding: "1.2rem 1.4rem", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Action Required</span>
            <div style={{ background: "#fef2f2", color: "#dc2626", padding: "6px", borderRadius: "10px" }}><AlertTriangle size={18} /></div>
          </div>
          <div style={{ fontSize: "2.1rem", fontWeight: "900", color: "#0f172a" }}>{actionRequiredCount}</div>
          <span style={{ fontSize: "0.8rem", color: "#dc2626", fontWeight: "600" }}>Revisions & deficient items</span>
        </div>
      </div>

      {/* Main Evaluations Logs Section */}
      <section style={{ background: "white", padding: "1.75rem", borderRadius: "24px", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.06), 0 0 0 1px rgba(226, 232, 240, 0.8) inset" }}>
        {/* Controls: Search, Status, Applicant & Date Filters */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem", marginBottom: "1.5rem", paddingBottom: "1.25rem", borderBottom: "1px solid #e2e8f0" }}>
          
          {/* Top Row: Search and Results Count */}
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

            {/* Total Results Count & Reset Filters Button */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: "600" }}>
                Showing <strong>{filteredLogs.length}</strong> of {evaluationLogs.length} evaluations
              </div>

              {(statusFilter !== "all" || applicantFilter !== "all" || dateFilterPreset !== "all" || startDate || endDate || searchTerm) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setApplicantFilter("all");
                    setDateFilterPreset("all");
                    setStartDate("");
                    setEndDate("");
                  }}
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    padding: "5px 10px",
                    color: "#475569",
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                  title="Clear all active filters"
                >
                  <RotateCcw size={13} /> Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row: Status Chips + Applicant Filter + Date Filter */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            
            {/* Filter Chips by Status */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#64748b", marginRight: "4px" }}>Filter:</span>
              {[
                { id: 'all', label: 'All Evaluations', count: evaluationLogs.length },
                { id: 'approved', label: 'Approved & Released', count: approvedCount },
                { id: 'under_review', label: 'Under Review', count: reviewCount },
                { id: 'action_required', label: 'Action Required', count: actionRequiredCount },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "999px",
                    fontSize: "0.82rem",
                    fontWeight: statusFilter === tab.id ? "700" : "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: statusFilter === tab.id ? "#0038A8" : "#f8fafc",
                    color: statusFilter === tab.id ? "white" : "#475569",
                    border: `1px solid ${statusFilter === tab.id ? "#0038A8" : "#e2e8f0"}`,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: statusFilter === tab.id ? "0 2px 8px rgba(0, 56, 168, 0.25)" : "none"
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{ 
                    background: statusFilter === tab.id ? "rgba(255,255,255,0.25)" : "#e2e8f0", 
                    color: statusFilter === tab.id ? "white" : "#64748b",
                    padding: "1px 6px", 
                    borderRadius: "10px", 
                    fontSize: "0.75rem" 
                  }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Applicant & Date Filter Dropdowns */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              
              {/* Applicant Filter Dropdown */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: applicantFilter !== "all" ? "#eff6ff" : "#f8fafc",
                border: `1.5px solid ${applicantFilter !== "all" ? "#3b82f6" : "#cbd5e1"}`,
                borderRadius: "12px",
                padding: "6px 12px",
                transition: "all 0.15s ease"
              }}>
                <User size={15} color={applicantFilter !== "all" ? "#2563eb" : "#64748b"} />
                <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#64748b" }}>Applicant:</span>
                <select
                  value={applicantFilter}
                  onChange={(e) => setApplicantFilter(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontWeight: "700",
                    color: applicantFilter !== "all" ? "#1e40af" : "#334155",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    maxWidth: "200px"
                  }}
                >
                  <option value="all">All Applicants ({applicantList.length})</option>
                  {applicantList.map(({ name, count }) => (
                    <option key={name} value={name}>
                      {name} {count > 0 ? `(${count})` : ""}
                    </option>
                  ))}
                </select>
                {applicantFilter !== "all" && (
                  <button
                    onClick={() => setApplicantFilter("all")}
                    title="Clear applicant filter"
                    style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "0.75rem", padding: "0 2px", fontWeight: "bold" }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Date Filter Dropdown */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: (dateFilterPreset !== "all" || startDate || endDate) ? "#eff6ff" : "#f8fafc",
                border: `1.5px solid ${(dateFilterPreset !== "all" || startDate || endDate) ? "#3b82f6" : "#cbd5e1"}`,
                borderRadius: "12px",
                padding: "6px 12px",
                transition: "all 0.15s ease"
              }}>
                <Calendar size={15} color={(dateFilterPreset !== "all" || startDate || endDate) ? "#2563eb" : "#64748b"} />
                <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#64748b" }}>Date:</span>
                <select
                  value={dateFilterPreset}
                  onChange={(e) => {
                    setDateFilterPreset(e.target.value);
                    if (e.target.value !== "custom") {
                      setStartDate("");
                      setEndDate("");
                    }
                  }}
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontWeight: "700",
                    color: (dateFilterPreset !== "all" || startDate || endDate) ? "#1e40af" : "#334155",
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">Past 7 Days</option>
                  <option value="month">Past 30 Days</option>
                  <option value="custom">Custom Range...</option>
                </select>
                {(dateFilterPreset !== "all" || startDate || endDate) && (
                  <button
                    onClick={() => {
                      setDateFilterPreset("all");
                      setStartDate("");
                      setEndDate("");
                    }}
                    title="Clear date filter"
                    style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "0.75rem", padding: "0 2px", fontWeight: "bold" }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Custom Date Pickers when 'custom' is selected */}
              {dateFilterPreset === "custom" && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "4px 8px" }}>
                  <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "700" }}>From:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: "6px", padding: "3px 6px", fontSize: "0.8rem", color: "#1e293b", background: "white" }}
                  />
                  <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "700" }}>To:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: "6px", padding: "3px 6px", fontSize: "0.8rem", color: "#1e293b", background: "white" }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Logs Feed */}
        <div>
          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#f8fafc", borderRadius: "20px", border: "1px dashed #cbd5e1" }}>
              <FileCheck size={48} color="#94a3b8" style={{ margin: "0 auto 1rem auto", opacity: 0.5 }} />
              <h3 style={{ margin: "0 0 8px 0", color: "#334155", fontSize: "1.2rem", fontWeight: "700" }}>No Staff Evaluations Found</h3>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
                {searchTerm || applicantFilter !== "all" || dateFilterPreset !== "all" 
                  ? "No evaluation events match your active filter criteria." 
                  : "Staff evaluation activities and permit assessments will appear here."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {filteredLogs.map((log, idx) => {
                const isApproved = log.status === "success" || (log.action || "").toUpperCase().includes("APPROV");
                const isRejected = log.status === "warning" || log.status === "error" || (log.action || "").toUpperCase().includes("REJECT") || (log.action || "").toUpperCase().includes("INCOMPLETE");
                const applicant = getApplicantForLog(log);

                const badgeBg = isApproved ? "#d1fae5" : isRejected ? "#fee2e2" : "#eff6ff";
                const badgeColor = isApproved ? "#047857" : isRejected ? "#b91c1c" : "#1d4ed8";
                const badgeLabel = isApproved ? "APPROVED" : isRejected ? "ACTION REQUIRED" : "UNDER REVIEW";

                return (
                  <div 
                    key={log.id || `eval-${idx}`}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      padding: "1.1rem 1.25rem",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "1rem",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", flex: 1 }}>
                      <div style={{ 
                        width: "40px", 
                        height: "40px", 
                        borderRadius: "12px", 
                        background: badgeBg, 
                        color: badgeColor, 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <FileCheck size={20} />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <span style={{
                            background: badgeBg,
                            color: badgeColor,
                            fontSize: "0.72rem",
                            fontWeight: "800",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            letterSpacing: "0.5px"
                          }}>
                            {badgeLabel}
                          </span>
                          <span style={{ fontSize: "0.92rem", fontWeight: "700", color: "#0f172a" }}>
                            {log.action || log.message || "Permit Evaluation Update"}
                          </span>
                        </div>

                        <p style={{ margin: "0 0 6px 0", fontSize: "0.88rem", color: "#334155", lineHeight: "1.45" }}>
                          {log.details || log.message}
                        </p>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", fontSize: "0.78rem", color: "#64748b" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <User size={13} color="#94a3b8" />
                            <strong>{log.user || "Staff Evaluator"}</strong>
                          </span>
                          <span>•</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Clock size={13} color="#94a3b8" />
                            {formatLogTime(log.timestamp)}
                          </span>
                          {applicant && (
                            <>
                              <span>•</span>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "1px 8px", borderRadius: "6px", fontWeight: "700" }}>
                                Applicant: {applicant}
                              </span>
                            </>
                          )}
                        </div>
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
