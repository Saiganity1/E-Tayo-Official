"use client";

import React, { useEffect, useState } from "react";
import { 
  Users, Shield, ShieldAlert, AlertTriangle, X, FileText, CheckCircle, 
  XCircle, UserCheck, Clock, Building2, ExternalLink, UserPlus, 
  Trash2, UserMinus, Plus, Sparkles, RefreshCw, Calendar, Award, 
  CheckCircle2, MessageSquare, AlertCircle, FileCheck, Mail, MapPin
} from "lucide-react";
import Link from "next/link";
import { usePermitContext } from "../../../../context/PermitContext";
import { formatPhilippineDateTime } from "@/utils/philippineTime";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface EvaluationLog {
  id: string | number;
  permitId?: string;
  projectName?: string;
  staffEmail: string;
  applicantEmail: string;
  applicantName?: string;
  permitType: string;
  action: string;
  comments: string;
  timestamp: string;
  evaluatorName?: string;
}

const isAutomaticDummyStaff = (u: any): boolean => {
  const email = String(u?.email || "").toLowerCase().trim();
  return email === "staff@etayo.gov.ph" || email === "dummy@example.com";
};

const isDummyRecord = (item: any): boolean => {
  if (!item) return true;
  const applicant = String(item.applicantEmail || item.user || "").toLowerCase();
  const id = String(item.id || item.permitId || "");
  if (applicant.includes("citizen@example.com") || applicant.includes("business@example.com")) return true;
  if (id.startsWith("LOG-SYS-BASE-") || id === "LOG-SYS-01" || id === "LOG-SYS-02") return true;
  if (id.startsWith("eval-sys-")) return true;
  return false;
};

export default function AdminStaffPage() {
  const { applications, systemLogs } = usePermitContext();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Modal State for Evaluation Audit Logs
  const [selectedStaff, setSelectedStaff] = useState<UserData | null>(null);
  const [logs, setLogs] = useState<EvaluationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Modal State for Assigning Staff
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTab, setAssignTab] = useState<"promote" | "create">("promote");
  const [applicants, setApplicants] = useState<UserData[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [selectedApplicantId, setSelectedApplicantId] = useState<number | string>("");

  // New Staff Form Fields
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);
  const [unassigningId, setUnassigningId] = useState<number | null>(null);

  const fetchStaff = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      let res = await fetch("/api/users?role=ROLE_STAFF", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      }).catch(() => null);

      if (!res || !res.ok) {
        const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
        res = await fetch(`${rawApi}/api/users?role=ROLE_STAFF`, {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        }).catch(() => null);
      }
      
      if (!res || !res.ok) throw new Error("Failed to fetch staff");
      
      const data = await res.json();
      if (Array.isArray(data)) {
        // Strictly eliminate automatic seeded dummy staff
        const authenticStaff = data.filter(u => !isAutomaticDummyStaff(u));
        setUsers(authenticStaff);
        if (typeof window !== "undefined") {
          localStorage.setItem("etayo_assigned_staff", JSON.stringify(authenticStaff));
        }
      } else {
        setUsers([]);
        if (typeof window !== "undefined") {
          localStorage.setItem("etayo_assigned_staff", JSON.stringify([]));
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async () => {
    setLoadingApplicants(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      let res = await fetch("/api/users?role=ROLE_APPLICANT", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      }).catch(() => null);

      if (!res || !res.ok) {
        const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
        res = await fetch(`${rawApi}/api/users?role=ROLE_APPLICANT`, {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        }).catch(() => null);
      }

      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setApplicants(data.filter(u => !isAutomaticDummyStaff(u)));
        }
      }
    } catch (e) {
    } finally {
      setLoadingApplicants(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openAssignModal = () => {
    setIsAssignModalOpen(true);
    fetchApplicants();
  };

  const handlePromoteApplicant = async () => {
    if (!selectedApplicantId) {
      alert("Pumili ng applicant na ia-assign bilang Staff.");
      return;
    }
    setIsSubmittingStaff(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      let res = await fetch(`/api/users/${selectedApplicantId}/promote`, {
        method: "PUT",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      }).catch(() => null);

      if (!res || !res.ok) {
        const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
        res = await fetch(`${rawApi}/api/users/${selectedApplicantId}/promote`, {
          method: "PUT",
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        }).catch(() => null);
      }

      const promoted = applicants.find(a => String(a.id) === String(selectedApplicantId));
      if (promoted && typeof window !== "undefined") {
        try {
          const cur = JSON.parse(localStorage.getItem("etayo_assigned_staff") || "[]");
          const next = [...cur.filter((u: any) => u.email?.toLowerCase() !== promoted.email?.toLowerCase()), { ...promoted, role: "ROLE_STAFF" }];
          localStorage.setItem("etayo_assigned_staff", JSON.stringify(next));
        } catch (e) {}
      }

      setActionMessage("Matagumpay na nai-assign ang napiling applicant bilang Staff!");
      setIsAssignModalOpen(false);
      setSelectedApplicantId("");
      await fetchStaff();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) {
      alert("Pakilagay ang pangalan at email address ng staff.");
      return;
    }

    setIsSubmittingStaff(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: newStaffName.trim(),
          email: newStaffEmail.trim().toLowerCase(),
          password: newStaffPassword.trim() || "password123",
          role: "ROLE_STAFF"
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Failed to create staff member");
      }

      if (typeof window !== "undefined") {
        try {
          const cur = JSON.parse(localStorage.getItem("etayo_assigned_staff") || "[]");
          const next = [...cur.filter((u: any) => u.email?.toLowerCase() !== newStaffEmail.trim().toLowerCase()), {
            id: Date.now(),
            name: newStaffName.trim(),
            email: newStaffEmail.trim().toLowerCase(),
            role: "ROLE_STAFF"
          }];
          localStorage.setItem("etayo_assigned_staff", JSON.stringify(next));
        } catch (e) {}
      }

      setActionMessage(`Matagumpay na nalikha at nai-assign si ${newStaffName} bilang Staff!`);
      setIsAssignModalOpen(false);
      setNewStaffName("");
      setNewStaffEmail("");
      setNewStaffPassword("");
      await fetchStaff();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  const handleUnassignStaff = async (staffId: number, staffName: string) => {
    if (!window.confirm(`Sigurado ka ba na nais mong alisin si ${staffName} mula sa Evaluating Staff? Babalik ang kanyang account bilang regular applicant.`)) {
      return;
    }

    setUnassigningId(staffId);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      let res = await fetch(`/api/users/${staffId}/demote`, {
        method: "PUT",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      }).catch(() => null);

      if (!res || !res.ok) {
        const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
        res = await fetch(`${rawApi}/api/users/${staffId}/demote`, {
          method: "PUT",
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        }).catch(() => null);
      }

      if (typeof window !== "undefined") {
        try {
          const cur = JSON.parse(localStorage.getItem("etayo_assigned_staff") || "[]");
          const next = cur.filter((u: any) => u.id !== staffId);
          localStorage.setItem("etayo_assigned_staff", JSON.stringify(next));
        } catch (e) {}
      }

      setActionMessage(`Matagumpay na inalis si ${staffName} sa listahan ng Staff.`);
      await fetchStaff();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setUnassigningId(null);
    }
  };

  const openAuditLogs = async (staff: UserData) => {
    setSelectedStaff(staff);
    setLoadingLogs(true);
    setLogs([]);

    const targetEmail = (staff.email || "").trim().toLowerCase();
    const targetName = (staff.name || "").trim().toLowerCase();
    const targetCleanName = targetName.replace(/[^a-z0-9]/g, "");

    const isDummyRecord = (item: any) => {
      if (!item) return true;
      const applicant = String(item.applicantEmail || item.user || "").toLowerCase();
      const id = String(item.id || item.permitId || "");
      if (applicant.includes("citizen@example.com") || applicant.includes("business@example.com")) return true;
      if (id.startsWith("LOG-SYS-BASE-") || id === "LOG-SYS-01" || id === "LOG-SYS-02") return true;
      if (id.startsWith("eval-sys-")) return true;
      return false;
    };

    // Strict staff verification: must match exact email or exact full name
    const isStaffMatch = (logEmail?: string, logName?: string) => {
      const eClean = (logEmail || "").trim().toLowerCase();
      const nClean = (logName || "").trim().toLowerCase();
      const nCleanCompact = nClean.replace(/[^a-z0-9]/g, "");

      // 1. Strict email match
      if (eClean && targetEmail) {
        if (eClean === targetEmail) return true;
      }

      // 2. Exact name match
      if (nClean && targetName) {
        if (nClean === targetName) return true;
        if (nCleanCompact.length >= 5 && nCleanCompact === targetCleanName) return true;
      }

      return false;
    };

    const normalizeActionLabel = (act?: string, comments?: string): string => {
      const a = (act || "").toLowerCase().trim();
      const c = (comments || "").toLowerCase().trim();
      if (a.includes("release") || c.includes("released")) return "Permit Released";
      if (a.includes("approv") || c.includes("approved")) return "Approved";
      if (a.includes("disapprov") || a.includes("reject") || c.includes("disapproved") || c.includes("rejected")) return "Disapproved";
      if (a.includes("revis") || a.includes("incomplete") || a.includes("deficien") || c.includes("revision") || c.includes("deficiencies")) return "Revision Requested";
      return "Evaluation Recorded";
    };

    const gatheredLogs: EvaluationLog[] = [];

    // Helper to find matching application
    const findMatchedApp = (appId?: string) => {
      if (!appId) return undefined;
      const cleanTarget = String(appId).trim().toUpperCase();
      return (applications || []).find(a => 
        a && a.id && String(a.id).trim().toUpperCase() === cleanTarget
      );
    };

    let apiLogs: any[] = [];
    let localLogs: any[] = [];

    // 1. Fetch from backend API / Next.js proxy
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      let res = await fetch(`/api/evaluations/staff/${encodeURIComponent(staff.email)}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      }).catch(() => null);

      if (!res || !res.ok) {
        const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
        res = await fetch(`${rawApi}/api/evaluations/staff/${encodeURIComponent(staff.email)}`, {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        }).catch(() => null);
      }
      
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          apiLogs = data.filter((item: any) => {
            if (isDummyRecord(item)) return false;
            const itemStaffEmail = String(item.staffEmail || item.evaluatorEmail || "").trim();
            const itemStaffName = String(item.evaluatorName || item.user || "").trim();
            return isStaffMatch(itemStaffEmail, itemStaffName);
          });
        }
      }
    } catch (err: any) {
      console.error("Error fetching evaluations for staff", err);
    }

    // 2. Fetch from localStorage evaluation records
    if (typeof window !== "undefined") {
      try {
        const localLogsRaw = localStorage.getItem("etayo_evaluation_logs");
        if (localLogsRaw) {
          const parsed = JSON.parse(localLogsRaw);
          if (Array.isArray(parsed)) {
            localLogs = parsed.filter((l: any) => {
              if (isDummyRecord(l)) return false;
              return isStaffMatch(l.staffEmail || l.evaluatorEmail, l.evaluatorName || l.user);
            });
          }
        }
      } catch (e) {}
    }

    // 3. Build canonical list of evaluated permits (strictly 1 unique entry per permit ID)
    const evaluatedPermitsMap = new Map<string, EvaluationLog>();

    // Process applications from PermitContext (the single source of truth for the municipal portal)
    (applications || []).forEach(app => {
      if (!app || !app.id || isDummyRecord(app)) return;
      const cleanId = String(app.id).trim().toUpperCase();

      const localEvaluator = typeof window !== "undefined" ? (
        localStorage.getItem(`etayo_evaluated_by_${cleanId}`) ||
        localStorage.getItem(`etayo_evaluated_by_${cleanId.toLowerCase()}`) ||
        localStorage.getItem(`etayo_evaluated_by_${app.id}`)
      ) : null;
      const localEvalEmail = typeof window !== "undefined" ? (
        localStorage.getItem(`etayo_evaluator_email_${cleanId}`) ||
        localStorage.getItem(`etayo_evaluator_email_${cleanId.toLowerCase()}`) ||
        localStorage.getItem(`etayo_evaluator_email_${app.id}`)
      ) : null;
      const localStatus = typeof window !== "undefined" ? (
        localStorage.getItem(`etayo_status_${cleanId}`) ||
        localStorage.getItem(`etayo_status_${cleanId.toLowerCase()}`) ||
        localStorage.getItem(`etayo_status_${app.id}`)
      ) : null;
      const isLocalReleased = typeof window !== "undefined" && (
        localStorage.getItem(`etayo_released_${cleanId}`) === "true" ||
        localStorage.getItem(`etayo_released_${cleanId.toLowerCase()}`) === "true"
      );

      const matchingApi = apiLogs.find(l => {
        const p = String(l.permitId || l.applicationId || "").trim().toUpperCase();
        return p === cleanId;
      });
      const matchingLocal = localLogs.find(l => {
        const p = String(l.permitId || l.applicationId || "").trim().toUpperCase();
        return p === cleanId;
      });
      const matchingSys = (systemLogs || []).find(l => {
        const str = `${l.message || ""} ${l.details || ""} ${l.id || ""}`.toUpperCase();
        const act = (l.action || "").toUpperCase();
        const isEval = act.startsWith("EVALUATION") || act === "PERMIT_RELEASED";
        return isEval && str.includes(cleanId) && isStaffMatch(l.userEmail, l.user);
      });
      const matchingHist = Array.isArray(app.historyLog) ? app.historyLog.find((h: any) => {
        const act = (h.action || "").toLowerCase();
        const isEval = act.includes("approv") || act.includes("release") || act.includes("evaluat") || act.includes("reject") || act.includes("revis");
        return isEval && isStaffMatch(h.actor, h.actor);
      }) : null;

      const appEvaluator = localEvaluator || app.evaluatedBy || (app as any).assignedStaff;
      const appEvalEmail = localEvalEmail || app.evaluatorEmail;

      const isEvaluatedByStaff = isStaffMatch(appEvalEmail, appEvaluator) || Boolean(matchingHist) || Boolean(matchingApi || matchingLocal || matchingSys);
      if (!isEvaluatedByStaff) return;

      const effectiveStatus = (isLocalReleased ? "released" : (localStatus || app.status || "")).toLowerCase().trim();
      const isEvaluatedStatus = effectiveStatus === "approved" || effectiveStatus === "released" || effectiveStatus === "rejected" || effectiveStatus === "incomplete_requirements" || Boolean((app as any).isReleased);

      if (!isEvaluatedStatus && !matchingApi && !matchingLocal && !matchingSys) return;

      let actionLabel = "Approved";
      if (effectiveStatus === "released" || (app as any).isReleased || isLocalReleased) {
        actionLabel = "Permit Released";
      } else if (effectiveStatus === "rejected") {
        actionLabel = "Disapproved";
      } else if (effectiveStatus === "incomplete_requirements") {
        actionLabel = "Revision Requested";
      } else if (effectiveStatus === "approved") {
        actionLabel = "Approved";
      } else if (matchingApi?.action || matchingLocal?.action) {
        actionLabel = normalizeActionLabel(matchingApi?.action || matchingLocal?.action);
      }

      const localRemarks = typeof window !== "undefined" ? (
        localStorage.getItem(`etayo_remarks_${cleanId}`) ||
        localStorage.getItem(`etayo_remarks_${cleanId.toLowerCase()}`) ||
        localStorage.getItem(`etayo_remarks_${app.id}`)
      ) : null;
      const comments = localRemarks || app.remarks || matchingApi?.comments || matchingLocal?.comments || matchingSys?.details || (
        actionLabel === "Permit Released" ? "Official receipt verified. Permits released." : `Official evaluation conducted by ${staff.name}.`
      );

      // Resolve authentic evaluation timestamp
      let resolvedTimestamp = "";
      if (matchingLocal?.timestamp && String(matchingLocal.timestamp).includes(":")) {
        resolvedTimestamp = matchingLocal.timestamp;
      } else if (matchingApi?.timestamp && String(matchingApi.timestamp).includes(":")) {
        resolvedTimestamp = matchingApi.timestamp;
      } else if (matchingSys?.timestamp && String(matchingSys.timestamp).includes(":")) {
        resolvedTimestamp = matchingSys.timestamp;
      } else if (matchingHist?.date && String(matchingHist.date).includes(":")) {
        resolvedTimestamp = matchingHist.date;
      } else if (app.evaluatedAt && String(app.evaluatedAt).includes(":")) {
        resolvedTimestamp = app.evaluatedAt;
      } else if (typeof window !== "undefined") {
        const localEvalAt = localStorage.getItem(`etayo_evaluated_at_${cleanId}`) || localStorage.getItem(`etayo_evaluated_at_${cleanId.toLowerCase()}`);
        if (localEvalAt && localEvalAt.includes(":")) {
          resolvedTimestamp = localEvalAt;
        }
      }

      if (!resolvedTimestamp) {
        const rawDateVal = (app as any).dateApproved || (app as any).dateIssued || app.dateSubmitted;
        if (rawDateVal && String(rawDateVal).includes(":")) {
          resolvedTimestamp = rawDateVal;
        } else if (rawDateVal) {
          resolvedTimestamp = rawDateVal;
        } else {
          resolvedTimestamp = new Date().toISOString();
        }
      }

      evaluatedPermitsMap.set(cleanId, {
        id: `eval-${cleanId}`,
        permitId: app.id,
        projectName: app.projectName || app.projectType || (cleanId.startsWith("BP") ? "Building & Structural Works" : "Locational Zoning Clearance"),
        staffEmail: staff.email,
        applicantEmail: app.applicantEmail || "Applicant",
        applicantName: app.applicantName,
        permitType: app.permitType ? app.permitType.replace(/_/g, " ").toUpperCase() : (cleanId.startsWith("LC") ? "LOCATIONAL CLEARANCE" : "BUILDING PERMIT"),
        action: actionLabel,
        comments: comments,
        timestamp: resolvedTimestamp,
        evaluatorName: staff.name
      });
    });

    // 4. Incorporate any unique evaluations found only in apiLogs or localLogs (without duplicating)
    [...apiLogs, ...localLogs].forEach((l: any) => {
      if (!l || isDummyRecord(l)) return;
      const rawId = l.permitId || l.applicationId;
      if (!rawId) return;
      const cleanId = String(rawId).trim().toUpperCase();

      if (evaluatedPermitsMap.has(cleanId)) {
        const existing = evaluatedPermitsMap.get(cleanId)!;
        if (l.comments && (!existing.comments || existing.comments.startsWith("Official evaluation conducted"))) {
          existing.comments = l.comments;
        }
        if (l.timestamp && String(l.timestamp).includes(":") && !String(existing.timestamp).includes(":")) {
          existing.timestamp = l.timestamp;
        }
        return;
      }

      const matchedApp = findMatchedApp(cleanId);
      const actionLabel = normalizeActionLabel(l.action, l.comments);
      evaluatedPermitsMap.set(cleanId, {
        id: `eval-${cleanId}`,
        permitId: matchedApp?.id || cleanId,
        projectName: l.projectName || matchedApp?.projectName || matchedApp?.projectType || "Permit Application",
        staffEmail: staff.email,
        applicantEmail: l.applicantEmail || matchedApp?.applicantEmail || "Applicant",
        applicantName: l.applicantName || matchedApp?.applicantName,
        permitType: l.permitType ? l.permitType.replace(/_/g, " ").toUpperCase() : (cleanId.startsWith("LC") ? "LOCATIONAL CLEARANCE" : "BUILDING PERMIT"),
        action: actionLabel,
        comments: l.comments || `Official evaluation conducted by ${staff.name}.`,
        timestamp: l.timestamp || new Date().toISOString(),
        evaluatorName: staff.name
      });
    });

    const finalLogs = Array.from(evaluatedPermitsMap.values()).sort((a, b) => {
      const tA = new Date(a.timestamp || 0).getTime();
      const tB = new Date(b.timestamp || 0).getTime();
      return tB - tA;
    });

    setLogs(finalLogs);
    setLoadingLogs(false);
  };

  const getRoleBadge = (role: string) => {
    return <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "4px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}><Shield size={14} /> Staff</span>;
  };

  return (
    <>
      <div className="dashboard-page animate-fade-in-up" style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "3rem" }}>
        
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
              <ShieldAlert size={30} color="#0038A8" /> Staff Management
            </h1>
            <p className="page-subtitle" style={{ fontSize: "0.95rem", color: "#475569", margin: "0.35rem 0 0 0" }}>
              Manwal na mag-assign ng mga opisyal na magiging evaluating staff para sa pagsusuri ng mga permit.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => fetchStaff()}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                color: "#334155",
                padding: "9px 16px",
                borderRadius: "12px",
                fontSize: "0.9rem",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                transition: "all 0.2s"
              }}
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>

            <button
              onClick={openAssignModal}
              style={{
                background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "12px",
                fontSize: "0.92rem",
                fontWeight: "800",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.28)"
              }}
            >
              <UserPlus size={18} />
              <span>Assign Staff Member</span>
            </button>
          </div>
        </header>

        {/* Action Success Toast */}
        {actionMessage && (
          <div style={{
            background: "#f0fdf4",
            border: "1.5px solid #86efac",
            color: "#166534",
            padding: "12px 18px",
            borderRadius: "14px",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.92rem",
            fontWeight: "700"
          }}>
            <CheckCircle size={18} color="#16a34a" />
            <span>{actionMessage}</span>
          </div>
        )}

        <div style={{ padding: "2rem", background: "#ffffff", borderRadius: "24px", border: "1.5px solid #e2e8f0", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.06), 0 0 0 1px rgba(226, 232, 240, 0.8) inset" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <div className="spinner" style={{ width: "40px", height: "40px", border: "4px solid rgba(29, 78, 216, 0.2)", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem auto" }}></div>
              <p style={{ color: "#64748b" }}>Loading staff...</p>
            </div>
          ) : error ? (
            <div style={{ padding: "2rem", background: "#fef2f2", color: "#b91c1c", borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
              <AlertTriangle size={24} />
              <span style={{ fontWeight: "600" }}>{error}</span>
            </div>
          ) : users.length === 0 ? (
            /* Clean Empty State */
            <div style={{
              textAlign: "center",
              padding: "4rem 2rem",
              background: "#f8fafc",
              borderRadius: "20px",
              border: "1.5px dashed #cbd5e1"
            }}>
              <div style={{
                width: "72px",
                height: "72px",
                borderRadius: "24px",
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem auto",
                boxShadow: "0 8px 20px -4px rgba(37, 99, 235, 0.15)"
              }}>
                <Users size={36} />
              </div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: "800", color: "#0f172a", margin: "0 0 8px 0" }}>
                Walang Staff Accounts sa Sistema
              </h2>
              <p style={{ fontSize: "0.95rem", color: "#64748b", maxWidth: "480px", margin: "0 auto 1.75rem auto", lineHeight: 1.6 }}>
                Ang system ay walang pre-created o automatic staff accounts. Ikaw bilang Admin ang mag-aassign kung sinong opisyal ang may karapatang mag-evaluate ng mga permit.
              </p>
              <button
                onClick={openAssignModal}
                style={{
                  background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "14px",
                  fontSize: "0.95rem",
                  fontWeight: "800",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)"
                }}
              >
                <UserPlus size={18} />
                <span>+ Mag-assign ng Staff Member</span>
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ textAlign: "left", padding: "1rem", color: "#64748b", fontWeight: "700" }}>Name</th>
                    <th style={{ textAlign: "left", padding: "1rem", color: "#64748b", fontWeight: "700" }}>Email</th>
                    <th style={{ textAlign: "left", padding: "1rem", color: "#64748b", fontWeight: "700" }}>Role</th>
                    <th style={{ textAlign: "right", padding: "1rem", color: "#64748b", fontWeight: "700" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "1.25rem 1rem", fontWeight: "700", color: "#0f172a" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800" }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "1.25rem 1rem", color: "#475569" }}>{user.email}</td>
                      <td style={{ padding: "1.25rem 1rem" }}>{getRoleBadge(user.role)}</td>
                      <td style={{ padding: "1.25rem 1rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          <button 
                            onClick={() => openAuditLogs(user)}
                            className="btn-secondary" 
                            style={{
                              padding: "8px 16px",
                              fontSize: "0.85rem",
                              fontWeight: "700",
                              background: "#2563eb",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "10px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              boxShadow: "0 2px 6px rgba(37,99,235,0.2)"
                            }}
                          >
                            <FileText size={14} /> View Logs
                          </button>

                          <button
                            onClick={() => handleUnassignStaff(user.id, user.name)}
                            disabled={unassigningId === user.id}
                            title="Alisin sa staff access"
                            style={{
                              padding: "8px 12px",
                              fontSize: "0.85rem",
                              fontWeight: "700",
                              background: "#fef2f2",
                              color: "#dc2626",
                              border: "1px solid #fecaca",
                              borderRadius: "10px",
                              cursor: unassigningId === user.id ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <UserMinus size={14} />
                            <span>{unassigningId === user.id ? "Removing..." : "Unassign"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ASSIGN / CREATE STAFF MODAL */}
      {/* ========================================================================= */}
      {isAssignModalOpen && (
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
            borderRadius: "24px",
            width: "100%",
            maxWidth: "560px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            border: "1.5px solid #e2e8f0",
            overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "1.5rem 1.75rem",
              borderBottom: "1.5px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>
                    Assign Evaluating Staff
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                    Pumili sa mga rehistrado o lumikha ng bagong staff account
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Tab Selector */}
            <div style={{ display: "flex", padding: "8px 1.75rem", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setAssignTab("promote")}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  border: assignTab === "promote" ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                  background: assignTab === "promote" ? "#2563eb" : "#ffffff",
                  color: assignTab === "promote" ? "#ffffff" : "#475569",
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                Promote Existing User
              </button>
              <button
                type="button"
                onClick={() => setAssignTab("create")}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  border: assignTab === "create" ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                  background: assignTab === "create" ? "#2563eb" : "#ffffff",
                  color: assignTab === "create" ? "#ffffff" : "#475569",
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                Create New Staff
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "1.75rem" }}>
              {assignTab === "promote" ? (
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
                    Pumili ng Rehistradong Applicant na gagawing Staff:
                  </label>

                  {loadingApplicants ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                      Naglo-load ng applicants...
                    </div>
                  ) : applicants.length === 0 ? (
                    <div style={{ padding: "1.5rem", background: "#f8fafc", borderRadius: "12px", textAlign: "center", color: "#64748b", border: "1px dashed #cbd5e1" }}>
                      Walang applicants na puwedeng i-promote. Gamitin ang "Create New Staff" tab.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto", paddingRight: "4px" }}>
                      {applicants.map((appUser) => {
                        const isSelected = String(selectedApplicantId) === String(appUser.id);
                        return (
                          <div
                            key={appUser.id}
                            onClick={() => setSelectedApplicantId(appUser.id)}
                            style={{
                              padding: "10px 14px",
                              borderRadius: "12px",
                              border: isSelected ? "2px solid #2563eb" : "1.5px solid #e2e8f0",
                              background: isSelected ? "#eff6ff" : "#ffffff",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between"
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: "700", fontSize: "0.92rem", color: "#0f172a" }}>
                                {appUser.name}
                              </div>
                              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                {appUser.email}
                              </div>
                            </div>
                            <span style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              border: isSelected ? "5px solid #2563eb" : "2px solid #cbd5e1",
                              background: "#ffffff"
                            }} />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1.5rem" }}>
                    <button
                      type="button"
                      onClick={() => setIsAssignModalOpen(false)}
                      style={{ padding: "9px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#f1f5f9", fontWeight: "700", cursor: "pointer", color: "#475569" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handlePromoteApplicant}
                      disabled={isSubmittingStaff || !selectedApplicantId}
                      style={{
                        padding: "9px 22px",
                        borderRadius: "10px",
                        border: "none",
                        background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                        color: "white",
                        fontWeight: "800",
                        cursor: (isSubmittingStaff || !selectedApplicantId) ? "not-allowed" : "pointer",
                        opacity: (isSubmittingStaff || !selectedApplicantId) ? 0.5 : 1
                      }}
                    >
                      {isSubmittingStaff ? "Assigning..." : "Assign as Staff"}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateStaff}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                        Staff Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        placeholder="hal. Engr. Gilbert Cruz o Dave Sicat"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.92rem", outline: "none" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                        Official Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        placeholder="hal. gilbert.cruz@etayo.gov.ph"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.92rem", outline: "none" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                        Temporary Password
                      </label>
                      <input
                        type="password"
                        value={newStaffPassword}
                        onChange={(e) => setNewStaffPassword(e.target.value)}
                        placeholder="password123 (default kung blangko)"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.92rem", outline: "none" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1.5rem" }}>
                    <button
                      type="button"
                      onClick={() => setIsAssignModalOpen(false)}
                      style={{ padding: "9px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#f1f5f9", fontWeight: "700", cursor: "pointer", color: "#475569" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingStaff}
                      style={{
                        padding: "9px 22px",
                        borderRadius: "10px",
                        border: "none",
                        background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                        color: "white",
                        fontWeight: "800",
                        cursor: isSubmittingStaff ? "not-allowed" : "pointer",
                        opacity: isSubmittingStaff ? 0.5 : 1
                      }}
                    >
                      {isSubmittingStaff ? "Creating Staff..." : "Create & Assign Staff"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUDIT LOG MODAL (EXECUTIVE MODERN DESIGN & REAL EVALUATIONS) */}
      {/* ========================================================================= */}
      {selectedStaff && (() => {
        const approvedCount = logs.filter(l => {
          const act = (l.action || "").toLowerCase();
          return act.includes("approv") || act.includes("release");
        }).length;
        const revisionsCount = logs.filter(l => {
          const act = (l.action || "").toLowerCase();
          return act.includes("revis") || act.includes("incomplete") || act.includes("deficien");
        }).length;
        const disapprovedCount = logs.filter(l => {
          const act = (l.action || "").toLowerCase();
          return act.includes("disapprov") || act.includes("reject");
        }).length;

        return (
          <div 
            className="animate-fade-in" 
            style={{ 
              position: "fixed", 
              top: 0, 
              left: 0, 
              width: "100%", 
              height: "100%", 
              background: "rgba(15, 23, 42, 0.72)", 
              backdropFilter: "blur(14px)", 
              WebkitBackdropFilter: "blur(14px)",
              zIndex: 9999, 
              display: "flex", 
              alignItems: "flex-start", 
              justifyContent: "center", 
              overflowY: "auto", 
              padding: "2.5rem 1rem" 
            }}
          >
            <div 
              className="animate-fade-in-up" 
              style={{ 
                margin: "auto", 
                background: "#ffffff", 
                borderRadius: "28px", 
                width: "100%", 
                maxWidth: "860px", 
                boxShadow: "0 30px 60px -12px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(226, 232, 240, 0.8)", 
                display: "flex", 
                flexDirection: "column", 
                position: "relative", 
                overflow: "hidden"
              }}
            >
              {/* Premium Top Accent Gradient Ribbon */}
              <div style={{ height: "6px", width: "100%", background: "linear-gradient(90deg, #1d4ed8 0%, #3b82f6 40%, #06b6d4 75%, #10b981 100%)" }} />

              {/* Modal Header */}
              <div 
                style={{ 
                  padding: "1.75rem 2.25rem 1.5rem 2.25rem", 
                  borderBottom: "1px solid #f1f5f9", 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "flex-start", 
                  position: "sticky", 
                  top: 0, 
                  background: "#ffffff", 
                  zIndex: 20 
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <div style={{ 
                      background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", 
                      padding: "10px", 
                      borderRadius: "14px", 
                      color: "#1d4ed8",
                      border: "1px solid #bfdbfe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 10px rgba(37, 99, 235, 0.12)"
                    }}>
                      <Award size={24} strokeWidth={2.2} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <h2 style={{ fontSize: "1.55rem", fontWeight: "900", color: "#0f172a", margin: 0, letterSpacing: "-0.03em" }}>
                          Evaluation Audit Log
                        </h2>
                        <span style={{ 
                          fontSize: "0.72rem", 
                          fontWeight: "800", 
                          textTransform: "uppercase", 
                          letterSpacing: "0.06em",
                          background: "#eff6ff", 
                          color: "#1d4ed8", 
                          padding: "3px 8px", 
                          borderRadius: "6px", 
                          border: "1px solid #bfdbfe" 
                        }}>
                          Official Trail
                        </span>
                      </div>
                      <p style={{ color: "#64748b", margin: "2px 0 0 0", fontSize: "0.9rem" }}>
                        Official municipal evaluations and clearance reviews conducted by staff
                      </p>
                    </div>
                  </div>

                  {/* Staff Identity Pill */}
                  <div style={{ 
                    marginTop: "10px",
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: "10px", 
                    background: "#f8fafc", 
                    padding: "6px 14px 6px 8px", 
                    borderRadius: "12px", 
                    border: "1px solid #e2e8f0" 
                  }}>
                    <div style={{ 
                      width: "30px", 
                      height: "30px", 
                      borderRadius: "50%", 
                      background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)", 
                      color: "#ffffff", 
                      fontWeight: "800", 
                      fontSize: "0.85rem",
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      boxShadow: "0 2px 6px rgba(37, 99, 235, 0.3)"
                    }}>
                      {selectedStaff.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: "800", color: "#0f172a", fontSize: "0.92rem" }}>
                      {selectedStaff.name}
                    </span>
                    <span style={{ color: "#94a3b8" }}>•</span>
                    <span style={{ color: "#475569", fontSize: "0.86rem", fontFamily: "monospace" }}>
                      {selectedStaff.email}
                    </span>
                    <span style={{ 
                      background: "#dcfce7", 
                      color: "#15803d", 
                      fontSize: "0.72rem", 
                      fontWeight: "800", 
                      padding: "2px 8px", 
                      borderRadius: "6px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px"
                    }}>
                      <Shield size={10} /> Active Staff
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedStaff(null)} 
                  aria-label="Close audit log modal"
                  style={{ 
                    background: "#f8fafc", 
                    border: "1px solid #e2e8f0", 
                    cursor: "pointer", 
                    color: "#64748b", 
                    padding: "10px", 
                    borderRadius: "50%", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    transition: "all 0.2s ease" 
                  }}
                  onMouseEnter={(e) => { 
                    e.currentTarget.style.background = "#fef2f2"; 
                    e.currentTarget.style.color = "#ef4444"; 
                    e.currentTarget.style.borderColor = "#fecaca"; 
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.background = "#f8fafc"; 
                    e.currentTarget.style.color = "#64748b"; 
                    e.currentTarget.style.borderColor = "#e2e8f0"; 
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "1.75rem 2.25rem 2.25rem 2.25rem" }}>
                {loadingLogs ? (
                  <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
                    <div className="spinner" style={{ width: "48px", height: "48px", border: "4px solid rgba(29, 78, 216, 0.15)", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 1s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite", margin: "0 auto 1.25rem auto" }}></div>
                    <p style={{ color: "#0f172a", fontSize: "1.05rem", fontWeight: "700", margin: 0 }}>Verifying database audit trail...</p>
                    <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "4px 0 0 0" }}>Retrieving official evaluations conducted by {selectedStaff.name}</p>
                  </div>
                ) : (
                  <>
                    {/* Executive KPI Micro-Dashboard Bar */}
                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", 
                      gap: "12px", 
                      marginBottom: "1.5rem" 
                    }}>
                      <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Total Evaluated</span>
                          <Award size={18} color="#2563eb" />
                        </div>
                        <div style={{ fontSize: "1.85rem", fontWeight: "900", color: "#0f172a", lineHeight: 1.1 }}>
                          {logs.length}
                        </div>
                        <span style={{ fontSize: "0.76rem", color: "#64748b" }}>Official reviews recorded</span>
                      </div>

                      <div style={{ background: "#f0fdf4", padding: "14px 18px", borderRadius: "16px", border: "1px solid #bbf7d0" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#166534", textTransform: "uppercase", letterSpacing: "0.04em" }}>Approved</span>
                          <CheckCircle2 size={18} color="#16a34a" />
                        </div>
                        <div style={{ fontSize: "1.85rem", fontWeight: "900", color: "#166534", lineHeight: 1.1 }}>
                          {approvedCount}
                        </div>
                        <span style={{ fontSize: "0.76rem", color: "#15803d" }}>Clearances & Permits</span>
                      </div>

                      <div style={{ background: "#fffbeb", padding: "14px 18px", borderRadius: "16px", border: "1px solid #fde68a" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#854d0e", textTransform: "uppercase", letterSpacing: "0.04em" }}>Revisions</span>
                          <AlertCircle size={18} color="#d97706" />
                        </div>
                        <div style={{ fontSize: "1.85rem", fontWeight: "900", color: "#854d0e", lineHeight: 1.1 }}>
                          {revisionsCount}
                        </div>
                        <span style={{ fontSize: "0.76rem", color: "#a16207" }}>Deficiencies / Required</span>
                      </div>

                      <div style={{ background: "#fef2f2", padding: "14px 18px", borderRadius: "16px", border: "1px solid #fecaca" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#991b1b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Disapproved</span>
                          <XCircle size={18} color="#dc2626" />
                        </div>
                        <div style={{ fontSize: "1.85rem", fontWeight: "900", color: "#991b1b", lineHeight: 1.1 }}>
                          {disapprovedCount}
                        </div>
                        <span style={{ fontSize: "0.76rem", color: "#b91c1c" }}>Formal Rejections</span>
                      </div>
                    </div>

                    {/* PST Time Banner */}
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      padding: "8px 14px", 
                      borderRadius: "12px", 
                      background: "#f8fafc", 
                      border: "1px solid #e2e8f0", 
                      marginBottom: "1.5rem",
                      fontSize: "0.82rem",
                      color: "#64748b"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a", display: "inline-block", boxShadow: "0 0 0 3px rgba(22, 163, 74, 0.2)" }} />
                        <span style={{ fontWeight: "700", color: "#0f172a" }}>Authentic Municipal Audit Trail</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#166534", fontWeight: "600" }}>
                        <Clock size={13} color="#16a34a" />
                        <span>Synchronized with Philippine Standard Time (PST UTC+8)</span>
                      </div>
                    </div>

                    {logs.length === 0 ? (
                      /* Clean, Illustrated Empty State */
                      <div 
                        style={{ 
                          textAlign: "center", 
                          padding: "3.5rem 2rem", 
                          borderRadius: "24px", 
                          background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)", 
                          border: "1.5px dashed #cbd5e1" 
                        }}
                      >
                        <div style={{ 
                          width: "80px", 
                          height: "80px", 
                          background: "#ffffff", 
                          borderRadius: "24px", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          margin: "0 auto 1.5rem auto", 
                          boxShadow: "0 12px 28px -6px rgba(37, 99, 235, 0.12)", 
                          border: "1.5px solid #dbeafe",
                          color: "#2563eb"
                        }}>
                          <FileCheck size={40} strokeWidth={1.75} />
                        </div>
                        <h3 style={{ margin: "0 0 8px 0", fontWeight: "900", fontSize: "1.35rem", color: "#0f172a", letterSpacing: "-0.02em" }}>
                          Walang Naka-credit na Evaluation Kay {selectedStaff.name}
                        </h3>
                        <p style={{ color: "#64748b", fontSize: "0.95rem", margin: "0 auto 1.5rem auto", maxWidth: "440px", lineHeight: "1.6" }}>
                          Kasalukuyang <strong>0 evaluations</strong> pa lamang ang naitala dahil bago itong staff account. Kapag nagsagawa na si {selectedStaff.name} ng opisyal na pagsusuri ng permit sa Staff Portal, dito agad lalabas ang verified audit trail.
                        </p>
                        
                        <div style={{ display: "inline-flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                          <span style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "6px 14px", borderRadius: "10px", fontSize: "0.8rem", fontWeight: "700", color: "#475569" }}>
                            ✓ 100% Legit Database Records
                          </span>
                          <span style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "6px 14px", borderRadius: "10px", fontSize: "0.8rem", fontWeight: "700", color: "#475569" }}>
                            ✓ No Fabricated Activity
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Rich Evaluation Cards */
                      <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                        {logs.map((log) => {
                          const isApproved = (log.action || "").toLowerCase().includes("approv") || (log.action || "").toLowerCase().includes("release");
                          const isRejected = (log.action || "").toLowerCase().includes("disapprov") || (log.action || "").toLowerCase().includes("reject");

                          const accentColor = isApproved ? "#16a34a" : (isRejected ? "#dc2626" : "#d97706");
                          const accentBg = isApproved ? "#f0fdf4" : (isRejected ? "#fef2f2" : "#fffbeb");
                          const accentBorder = isApproved ? "#bbf7d0" : (isRejected ? "#fecaca" : "#fde68a");

                          return (
                            <div 
                              key={String(log.id)} 
                              style={{ 
                                background: "#ffffff", 
                                border: "1.5px solid #e2e8f0", 
                                borderRadius: "20px", 
                                boxShadow: "0 4px 14px rgba(15, 23, 42, 0.03)", 
                                position: "relative", 
                                overflow: "hidden",
                                transition: "all 0.2s ease"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "#cbd5e1";
                                e.currentTarget.style.boxShadow = "0 8px 24px rgba(15, 23, 42, 0.06)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "#e2e8f0";
                                e.currentTarget.style.boxShadow = "0 4px 14px rgba(15, 23, 42, 0.03)";
                              }}
                            >
                              {/* Left Accent Bar */}
                              <div style={{ 
                                position: "absolute", 
                                left: 0, 
                                top: 0, 
                                bottom: 0, 
                                width: "6px", 
                                background: accentColor 
                              }} />

                              {/* Card Top Banner */}
                              <div style={{ padding: "1.35rem 1.6rem 1rem 1.6rem", paddingLeft: "1.85rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "0.85rem" }}>
                                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                                    <div style={{ 
                                      background: accentBg, 
                                      padding: "10px", 
                                      borderRadius: "14px", 
                                      color: accentColor,
                                      border: `1.5px solid ${accentBorder}`,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      marginTop: "2px"
                                    }}>
                                      {isApproved ? <CheckCircle size={22} strokeWidth={2.5} /> : (isRejected ? <XCircle size={22} strokeWidth={2.5} /> : <AlertCircle size={22} strokeWidth={2.5} />)}
                                    </div>
                                    <div>
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                                        {log.permitId && (
                                          <span style={{ 
                                            background: "#eff6ff", 
                                            color: "#1d4ed8", 
                                            border: "1px solid #bfdbfe", 
                                            padding: "3px 9px", 
                                            borderRadius: "8px", 
                                            fontSize: "0.8rem", 
                                            fontWeight: "800", 
                                            fontFamily: "monospace",
                                            letterSpacing: "0.02em"
                                          }}>
                                            {log.permitId}
                                          </span>
                                        )}
                                        <span style={{
                                          background: "#f1f5f9",
                                          color: "#475569",
                                          padding: "2px 8px",
                                          borderRadius: "6px",
                                          fontSize: "0.74rem",
                                          fontWeight: "700",
                                          textTransform: "uppercase"
                                        }}>
                                          {log.permitType}
                                        </span>
                                      </div>
                                      <h4 style={{ margin: 0, fontSize: "1.12rem", color: "#0f172a", fontWeight: "900", letterSpacing: "-0.01em" }}>
                                        {log.projectName || log.permitType}
                                      </h4>
                                    </div>
                                  </div>

                                  <div style={{ 
                                    background: "#f8fafc", 
                                    padding: "6px 12px", 
                                    borderRadius: "10px", 
                                    fontSize: "0.78rem", 
                                    color: "#475569", 
                                    fontWeight: "700", 
                                    border: "1px solid #e2e8f0", 
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    whiteSpace: "nowrap" 
                                  }}>
                                    <Calendar size={13} color="#64748b" />
                                    <span>{formatPhilippineDateTime(log.timestamp)}</span>
                                  </div>
                                </div>

                                {/* Applicant & Metadata Row */}
                                <div style={{ 
                                  display: "flex", 
                                  alignItems: "center", 
                                  gap: "8px", 
                                  fontSize: "0.86rem", 
                                  color: "#64748b",
                                  paddingBottom: "1rem",
                                  borderBottom: "1px solid #f1f5f9"
                                }}>
                                  <Users size={14} color="#64748b" />
                                  <span style={{ fontWeight: "600", color: "#334155" }}>Applicant:</span>
                                  <span style={{ fontWeight: "700", color: "#0f172a" }}>
                                    {log.applicantName || "Registered Citizen"}
                                  </span>
                                  <span style={{ color: "#94a3b8" }}>({log.applicantEmail})</span>
                                </div>

                                {/* Official Verdict & Assessment Memo Box */}
                                <div style={{ 
                                  marginTop: "1rem", 
                                  background: "#f8fafc", 
                                  padding: "1rem 1.25rem", 
                                  borderRadius: "14px", 
                                  border: "1px solid #e2e8f0" 
                                }}>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                      <span style={{ fontSize: "0.74rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
                                        Official Decision:
                                      </span>
                                      <span style={{ 
                                        background: accentColor, 
                                        color: "#ffffff", 
                                        padding: "3px 10px", 
                                        borderRadius: "6px", 
                                        fontSize: "0.78rem", 
                                        fontWeight: "800",
                                        letterSpacing: "0.02em"
                                      }}>
                                        {log.action}
                                      </span>
                                    </div>

                                    <div style={{ 
                                      display: "inline-flex", 
                                      alignItems: "center", 
                                      gap: "5px", 
                                      fontSize: "0.78rem", 
                                      color: "#166534", 
                                      fontWeight: "800", 
                                      background: "#f0fdf4", 
                                      border: "1px solid #bbf7d0", 
                                      padding: "3px 10px", 
                                      borderRadius: "8px" 
                                    }}>
                                      <UserCheck size={14} color="#16a34a" />
                                      <span>Verified Reviewer: {selectedStaff.name}</span>
                                    </div>
                                  </div>

                                  <div style={{ 
                                    borderLeft: `3.5px solid ${accentColor}`, 
                                    paddingLeft: "12px", 
                                    marginTop: "6px" 
                                  }}>
                                    <div style={{ fontSize: "0.72rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "3px" }}>
                                      Official Findings & Comments:
                                    </div>
                                    <p style={{ margin: 0, fontSize: "0.93rem", color: "#1e293b", lineHeight: "1.55", fontStyle: "italic" }}>
                                      "{log.comments}"
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

            </div>
          </div>
        );
      })()}

      <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
    </>
  );
}
