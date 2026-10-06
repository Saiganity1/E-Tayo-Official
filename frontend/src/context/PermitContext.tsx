"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { PermitApplication, SystemLog, FeeStructure, PermitType } from "../types";
import { isApplicationApproved } from "../utils/projectGrouping";
import { INITIAL_APPLICATIONS } from "../data/mock";

const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
const API_BASE_URL = rawApi.endsWith("/api") ? rawApi : `${rawApi}/api`;

type UserRole = "public" | "applicant" | "staff" | "admin";

interface PermitContextProps {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  applications: PermitApplication[];
  systemLogs: SystemLog[];
  feeStructures: FeeStructure[];
  selectedPermitType: PermitType;
  setSelectedPermitType: (type: PermitType) => void;
  addApplication: (app: PermitApplication) => void;
  updateApplication: (app: PermitApplication) => void;
  archiveApplication: (id: string, isArchived: boolean) => Promise<void>;
  cancelApplication: (id: string, reason?: string) => Promise<void>;
  refreshApplications: () => Promise<void>;
  updateFeeMultiplier: (id: string, value: number) => void;
  addSystemLog: (log: Partial<SystemLog>) => Promise<void>;
  clearLogs: () => Promise<void>;
}

const PermitContext = createContext<PermitContextProps | undefined>(undefined);

const normalizeLog = (raw: any): SystemLog => {
  const action = raw.action || "";
  const details = raw.details || "";
  const user = raw.user || raw.userEmail || raw.staffEmail || raw.actor || "Staff / System";

  let category: SystemLog["category"] = "system";
  if (raw.category) {
    category = raw.category;
  } else {
    const actUpper = action.toUpperCase();
    const detLower = details.toLowerCase();
    if (actUpper.includes("EVALUAT") || actUpper.includes("PERMIT") || detLower.includes("evaluated") || detLower.includes("permit")) {
      category = "application";
    } else if (actUpper.includes("LOGIN") || actUpper.includes("AUTH") || actUpper.includes("OTP") || actUpper.includes("TOKEN") || actUpper.includes("SECURITY")) {
      category = "security";
    } else if (actUpper.includes("FEE") || actUpper.includes("SETTING")) {
      category = "setting";
    }
  }

  let status: SystemLog["status"] = "info";
  if (raw.status) {
    status = raw.status;
  } else {
    const combined = (action + " " + details).toUpperCase();
    if (combined.includes("APPROV") || combined.includes("SUCCESS") || combined.includes("PASSED")) {
      status = "success";
    } else if (combined.includes("REVISE") || combined.includes("INCOMPLETE") || combined.includes("WARNING")) {
      status = "warning";
    } else if (combined.includes("REJECT") || combined.includes("FAIL") || combined.includes("ERROR") || combined.includes("DENIED")) {
      status = "error";
    }
  }

  let message = raw.message;
  if (!message || message.trim() === "") {
    if (details && details.trim() !== "") {
      message = details;
    } else if (action && action.trim() !== "") {
      message = action.replace(/_/g, " ");
    } else {
      message = "System operation executed";
    }
  }

  return {
    id: String(raw.id || `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`),
    timestamp: raw.timestamp || new Date().toISOString(),
    category,
    message,
    user,
    status,
    action: raw.action,
    details: raw.details,
    userEmail: raw.userEmail,
    ipAddress: raw.ipAddress
  };
};

const isDummyApp = (app: PermitApplication) => {
  if (!app) return true;
  const id = String(app.id || "").toUpperCase().trim();
  const name = String(app.applicantName || "").toLowerCase().trim();
  const email = String(app.applicantEmail || "").toLowerCase().trim();

  // Legacy sample/seed application IDs and dummy records
  if (
    id === "LC-2025-0001" ||
    id === "BP-2025-0005" ||
    id === "APP-2026-6636" ||
    id === "APP-2026-8101" ||
    id === "APP-2026-7384" ||
    id === "APP-2026-1918" ||
    id === "APP-2026-3962" ||
    id === "LC-2026-6133" ||
    id.startsWith("LC-2025-") ||
    id.startsWith("BP-2025-")
  ) {
    return true;
  }

  // Only filter legacy seed applications that used the dummy name/email
  if (
    (id.startsWith("LC-2025-") || id.startsWith("BP-2025-") || id === "APP-2026-6636") &&
    (name.includes("juan dela cruz") || email.includes("juan.delacruz@email.com"))
  ) {
    return true;
  }

  return false;
};

export const isDummyLog = (log: any): boolean => {
  if (!log) return true;
  const id = String(log.id || "");
  const u = String(log.user || log.userEmail || "").toLowerCase();
  const act = String(log.action || "").toUpperCase();
  const msg = String(log.message || "").toLowerCase();
  const det = String(log.details || "").toLowerCase();

  // Fake system baseline logs
  if (id.startsWith("LOG-SYS-BASE-") || id === "LOG-SYS-01" || id === "LOG-SYS-02") return true;

  // Fake synthetic evaluation logs created with default staff fallback
  if (id.startsWith("LOG-EVAL-APP-") || id.startsWith("LOG-EVAL-REV-")) return true;

  // Fake dummy emails
  if (u.includes("citizen@example.com") || u.includes("business@example.com")) return true;

  // Fake matrix sync or dummy startup logs
  if (act === "ZONING_MATRIX_SYNCED" || (act === "SYSTEM_STARTUP" && det.includes("spatial gis mapping engine"))) return true;

  return false;
};

export const safeISODate = (val: any, fallback = new Date().toISOString()): string => {
  if (!val) return fallback;
  try {
    const d = new Date(val);
    const ms = d.getTime();
    if (!isNaN(ms)) {
      return d.toISOString();
    }
  } catch (e) {}
  return fallback;
};

export const buildAccurateSystemLogs = (apps: PermitApplication[], existingLogs: SystemLog[] = []): SystemLog[] => {
  const logMap = new Map<string, SystemLog>();

  // 1. Add valid existing logs (filter out fake/dummy logs)
  (existingLogs || []).forEach(log => {
    if (log && log.id && !isDummyLog(log)) {
      logMap.set(log.id, normalizeLog(log));
    }
  });

  // 2. Synthesize accurate logs for all actual applications in the system
  (apps || []).forEach(app => {
    if (!app || isDummyApp(app)) return;

    const applicantLabel = app.applicantName || app.applicantEmail || "Applicant";
    const projLabel = app.projectName || app.projectType || "Permit Project";
    const subTime = safeISODate(app.dateSubmitted);

    // Submission log
    const subLogId = `LOG-SUB-${app.id}`;
    if (!logMap.has(subLogId)) {
      logMap.set(subLogId, normalizeLog({
        id: subLogId,
        timestamp: subTime,
        category: "application",
        status: "info",
        action: "APPLICATION_SUBMITTED",
        user: app.applicantName || app.applicantEmail || applicantLabel,
        message: `New application submitted: ${projLabel} (${app.id})`,
        details: `Applicant ${applicantLabel} filed ${app.permitType?.replace(/_/g, " ") || "permit"} for ${projLabel}. Location: ${app.projectAddress || app.location?.address || "Sto. Tomas, Pampanga"}.`,
        userEmail: app.applicantEmail || "applicant@etayo.gov.ph",
      }));
    }

    // Evaluation logs ONLY if an actual evaluator is recorded on the application
    const evaluator = app.evaluatedBy || app.assignedStaff;
    const isEvaluated = app.status === "approved" || app.status === "released" || app.status === "rejected" || app.status === "incomplete_requirements";
    if (evaluator && isEvaluated) {
      const isApproved = app.status === "approved" || app.status === "released";
      const evalLogId = `LOG-EVAL-REAL-${app.id}`;
      if (!logMap.has(evalLogId)) {
        const evalTime = app.evaluatedAt || (app as any).dateApproved || (app as any).dateIssued || subTime;
        logMap.set(evalLogId, normalizeLog({
          id: evalLogId,
          timestamp: safeISODate(evalTime, subTime),
          category: "application",
          status: isApproved ? "success" : (app.status === "rejected" ? "error" : "warning"),
          action: isApproved ? "EVALUATION_APPROVED" : (app.status === "rejected" ? "EVALUATION_REJECTED" : "EVALUATION_REVISION_REQUESTED"),
          user: evaluator,
          message: `${evaluator} evaluated application ${app.id} (${projLabel}) - Status: ${isApproved ? "APPROVED" : (app.status === "rejected" ? "REJECTED" : "REVISION REQUIRED")}`,
          details: app.remarks || `Evaluation conducted by ${evaluator} for ${app.id}.`,
          userEmail: app.evaluatorEmail || (evaluator.includes("@") ? evaluator : `${evaluator.toLowerCase().replace(/\s+/g, ".")}@etayo.gov.ph`),
        }));
      }
    }

    // Include history log entries if present
    if (Array.isArray(app.historyLog)) {
      app.historyLog.forEach((h, hIdx) => {
        if (!h || !h.action) return;
        const hLogId = `LOG-HIST-${app.id}-${hIdx}`;
        if (!logMap.has(hLogId)) {
          let stat: "success" | "warning" | "info" | "error" = "info";
          const actUpper = (h.action || "").toUpperCase();
          if (actUpper.includes("APPROV")) stat = "success";
          if (actUpper.includes("REJECT") || actUpper.includes("CANCEL")) stat = "warning";

          logMap.set(hLogId, normalizeLog({
            id: hLogId,
            timestamp: safeISODate(h.date, subTime),
            category: "application",
            status: stat,
            action: h.action || "APPLICATION_UPDATE",
            user: h.actor || evaluator || applicantLabel,
            message: `${h.actor || "Staff"} - ${h.action || "Status Update"} on ${app.id} (${projLabel})`,
            details: h.details || `${h.action} recorded for application ${app.id}.`,
            userEmail: (h.actor && h.actor.includes("@")) ? h.actor : (app.evaluatorEmail || "admin@etayo.gov.ph"),
          }));
        }
      });
    }
  });

  return Array.from(logMap.values())
    .filter(l => !isDummyLog(l))
    .sort((a, b) => {
      const timeA = new Date(safeISODate(a.timestamp)).getTime();
      const timeB = new Date(safeISODate(b.timestamp)).getTime();
      return timeB - timeA;
    });
};

const STORAGE_VERSION = "etayo_clean_db_v6";

if (typeof window !== "undefined") {
  try {
    const curVer = localStorage.getItem("etayo_storage_version");
    if (curVer !== STORAGE_VERSION) {
      localStorage.removeItem("etayo_cached_applications");
      localStorage.removeItem("etayo_archived_application_ids");
      localStorage.removeItem("etayo_messages_history");
      localStorage.removeItem("etayo_notifications");
      localStorage.removeItem("etayo_unread_messages_count");
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (
          k.startsWith("etayo_status_") ||
          k.startsWith("etayo_approved_") ||
          k.startsWith("etayo_released_") ||
          k.startsWith("etayo_paid_") ||
          k.startsWith("etayo_payment_") ||
          k.startsWith("etayo_receipt_") ||
          k.startsWith("etayo_op_") ||
          k.startsWith("etayo_fees_") ||
          k.startsWith("etayo_archived_") ||
          k.startsWith("etayo_date_approved_") ||
          k.startsWith("etayo_remarks_") ||
          k.startsWith("etayo_threads_")
        )) {
          toRemove.push(k);
        }
      }
      toRemove.forEach(k => localStorage.removeItem(k));
      localStorage.setItem("etayo_storage_version", STORAGE_VERSION);
    }
  } catch (e) {}
}

export const PermitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>("public");
  const [selectedPermitType, setSelectedPermitType] = useState<PermitType>("building_permit");

  const [applications, setApplications] = useState<PermitApplication[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);

  // Client-side hydration
  const [mounted, setMounted] = useState(false);

  const userRoleRef = useRef<UserRole>(userRole);
  useEffect(() => {
    userRoleRef.current = userRole;
  }, [userRole]);

  const rateLimitCooldownUntil = useRef<number>(0);

  // Reusable fetch function for initial load and polling (memoized to keep reference stable)
  const fetchData = useCallback(async () => {
    try {
      // Cooldown guard: if Cloudflare / Render returned 429, wait for cooldown to expire
      if (Date.now() < rateLimitCooldownUntil.current) {
        return;
      }

      // If user is on an unauthenticated/auth page (e.g. /login, /register, /), skip background data fetching
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path === "/login" || path === "/register" || path === "/") {
          return;
        }
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      
      // If user is unauthenticated, do not flood the backend, but preserve locally submitted applications
      if (!token) {
        const cachedStr = typeof window !== "undefined" ? localStorage.getItem("etayo_cached_applications") : null;
        if (cachedStr) {
          try {
            const parsed = JSON.parse(cachedStr);
            if (Array.isArray(parsed)) {
              setApplications(parsed.filter(a => !isDummyApp(a)));
            }
          } catch (e) {}
        }
        return;
      }

      const headers: Record<string, string> = { 
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      };

      let userEmail = "";
      let userName = "";
      let isStaffOrAdmin = false;
      try {
        const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u.email) userEmail = u.email;
          if (u.name) userName = u.name;
          const r = String(u.role || "").toUpperCase();
          if (r.includes("ADMIN") || r.includes("STAFF")) {
            isStaffOrAdmin = true;
          }
        } else if (userRoleRef.current === "admin" || userRoleRef.current === "staff") {
          isStaffOrAdmin = true;
        }
      } catch (e) {}

      const params = new URLSearchParams();
      if (!isStaffOrAdmin) {
        if (userEmail) params.append("email", userEmail.trim());
        if (userName) params.append("name", userName.trim());
      }
      const qStr = params.toString();
      const proxyPermitsUrl = qStr ? `/api/permits?${qStr}` : `/api/permits`;
      const directPermitsUrl = qStr ? `${API_BASE_URL}/permits?${qStr}` : `${API_BASE_URL}/permits`;

      const fetchPermitsSafe = async (): Promise<Response> => {
        if (typeof window !== "undefined") {
          try {
            const pRes = await fetch(proxyPermitsUrl, { headers: { ...headers, "Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache" }, cache: "no-store" });
            if (pRes.ok) return pRes;
          } catch (e) {}
        }
        return fetch(directPermitsUrl, { headers: { ...headers, "Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache" }, cache: "no-store" })
          .catch(() => ({ ok: false, json: async () => [] } as any));
      };

      const [appsRes, logsRes, feesRes] = await Promise.all([
        fetchPermitsSafe(),
        isStaffOrAdmin 
          ? fetch(typeof window !== "undefined" ? "/api/logs" : `${API_BASE_URL}/logs`, { headers }).catch(e => ({ ok: false, json: async () => [] }))
          : Promise.resolve({ ok: false, json: async () => [] } as any),
        fetch(typeof window !== "undefined" ? "/api/fees" : `${API_BASE_URL}/fees`, { headers }).catch(e => ({ ok: false, json: async () => [] }))
      ]);

      // Check if Cloudflare or Render returned 429
      if ((appsRes as any)?.status === 429 || (feesRes as any)?.status === 429) {
        console.warn("Cloudflare / Render rate-limit challenge (429) detected. Pausing background requests for 60 seconds.");
        rateLimitCooldownUntil.current = Date.now() + 60000;
        return;
      }

      let backendApps: PermitApplication[] = [];
      if (appsRes.ok) {
        backendApps = await appsRes.json();
      }
      const cleanBackendApps = (backendApps || []).filter(a => !isDummyApp(a));
      
      const matchPermitId = (a?: string, b?: string) => Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());

      let mergedApps = cleanBackendApps;
      try {
        const cachedStr = localStorage.getItem("etayo_cached_applications");
        let storedArchivedIds: string[] = [];
        try {
          const s = typeof window !== "undefined" ? localStorage.getItem("etayo_archived_application_ids") : null;
          if (s) {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed)) storedArchivedIds = parsed;
          }
        } catch (e) {}

        const isAppLocallyArchived = (appId?: string) => {
          if (!appId || typeof window === "undefined") return false;
          const clean = appId.trim();
          const lower = clean.toLowerCase();
          const upper = clean.toUpperCase();
          return (
            localStorage.getItem(`etayo_archived_${clean}`) === "true" ||
            localStorage.getItem(`etayo_archived_${lower}`) === "true" ||
            localStorage.getItem(`etayo_archived_${upper}`) === "true" ||
            storedArchivedIds.some(x => (x || "").trim().toLowerCase() === lower)
          );
        };

        if (cachedStr) {
          const cachedApps: PermitApplication[] = JSON.parse(cachedStr);
          const cleanCached = (cachedApps || []).filter(c => !isDummyApp(c));
          if (cleanCached.length !== cachedApps.length) {
            try {
              localStorage.setItem("etayo_cached_applications", JSON.stringify(cleanCached));
            } catch (e) {}
          }

          mergedApps = cleanBackendApps.map((bApp) => {
            const foundCached = cleanCached.find((c) => matchPermitId(c.id, bApp.id));
            const id = (bApp.id || "").trim();
            const lowerId = id.toLowerCase();
            const upperId = id.toUpperCase();
            const bAppStatus = String(bApp.status || "").toLowerCase().trim();

            const isArchived = isAppLocallyArchived(id) || Boolean(bApp.isArchived) || Boolean(foundCached?.isArchived);
            if (isArchived && typeof window !== "undefined" && id) {
              try {
                localStorage.setItem(`etayo_archived_${id}`, "true");
                localStorage.setItem(`etayo_archived_${lowerId}`, "true");
                localStorage.setItem(`etayo_archived_${upperId}`, "true");
                if (!storedArchivedIds.some(x => (x || "").trim().toLowerCase() === lowerId)) {
                  storedArchivedIds.push(id);
                  localStorage.setItem("etayo_archived_application_ids", JSON.stringify(storedArchivedIds));
                }
              } catch (e) {}
            }

            const isApprovedOrReleasedLocally = typeof window !== "undefined" && Boolean(id) && (
              localStorage.getItem(`etayo_approved_${id}`) === "true" ||
              localStorage.getItem(`etayo_approved_${lowerId}`) === "true" ||
              localStorage.getItem(`etayo_approved_${upperId}`) === "true" ||
              localStorage.getItem(`etayo_status_${id}`) === "approved" ||
              localStorage.getItem(`etayo_status_${lowerId}`) === "approved" ||
              localStorage.getItem(`etayo_status_${upperId}`) === "approved" ||
              localStorage.getItem(`etayo_status_${id}`) === "released" ||
              localStorage.getItem(`etayo_status_${lowerId}`) === "released" ||
              localStorage.getItem(`etayo_status_${upperId}`) === "released" ||
              foundCached?.status === "approved" ||
              foundCached?.status === "released" ||
              Boolean((foundCached as any)?.isReleased) ||
              isApplicationApproved(bApp) ||
              (foundCached ? isApplicationApproved(foundCached) : false)
            );

            const isUnderReviewLocally = typeof window !== "undefined" && Boolean(id) && (
              localStorage.getItem(`etayo_status_${id}`) === "under_review" ||
              localStorage.getItem(`etayo_status_${lowerId}`) === "under_review" ||
              localStorage.getItem(`etayo_status_${upperId}`) === "under_review" ||
              foundCached?.status === "under_review" ||
              bAppStatus === "under_review"
            );

            // STRICT AUTHORITATIVE RULE:
            // If the application is truly pending AND has NOT been approved/released locally by staff AND is not under review:
            // Clean up any stray flags and keep it pending.
            // But if staff has already approved or released it or placed under evaluation, NEVER regress back to "pending"!
            if (bAppStatus === "pending" && !isApprovedOrReleasedLocally && !isUnderReviewLocally) {
              if (typeof window !== "undefined" && id) {
                try {
                  [id, lowerId, upperId].forEach(k => {
                    if (k) {
                      localStorage.removeItem(`etayo_approved_${k}`);
                      localStorage.removeItem(`etayo_released_${k}`);
                      localStorage.removeItem(`etayo_paid_${k}`);
                      localStorage.removeItem(`etayo_payment_confirmed_${k}`);
                      localStorage.removeItem(`etayo_receipt_${k}`);
                      localStorage.removeItem(`etayo_op_${k}`);
                      localStorage.removeItem(`etayo_fees_${k}`);
                      localStorage.removeItem(`etayo_date_approved_${k}`);
                      localStorage.setItem(`etayo_status_${k}`, "pending");
                    }
                  });
                } catch (e) {}
              }

              const pendingSteps = (bApp.trackingSteps && bApp.trackingSteps.length > 0)
                ? bApp.trackingSteps.map((st: any, idx: number) => {
                    if (idx === 0) return { ...st, status: "completed" };
                    if (idx === 1) return { ...st, status: "in-progress" };
                    return { ...st, status: "upcoming" };
                  })
                : [
                    { title: "Application Submitted", status: "completed", date: bApp.dateSubmitted || "Today" },
                    { title: "Under Evaluation", status: "in-progress", notes: "Reviewing documents and technical attachments." }
                  ];

              return {
                ...(foundCached || {}),
                ...bApp,
                status: "pending",
                isArchived,
                isReleased: false,
                paymentStatus: "unpaid" as const,
                userConfirmedPayment: false,
                orderOfPaymentNo: undefined,
                dateApproved: undefined,
                remarks: bApp.remarks || undefined,
                trackingSteps: pendingSteps
              };
            }

            // SYNC FIX: When the backend says "approved" or "released", immediately update localStorage
            // so any stale "pending" flag is cleared and the user sees the approval instantly on next render
            if ((bAppStatus === "approved" || bAppStatus === "released") && typeof window !== "undefined" && id) {
              try {
                [id, lowerId, upperId].forEach(k => {
                  if (k) {
                    localStorage.setItem(`etayo_status_${k}`, bAppStatus);
                    localStorage.setItem(`etayo_approved_${k}`, "true");
                    if (bAppStatus === "released") {
                      localStorage.setItem(`etayo_released_${k}`, "true");
                    } else if (bAppStatus === "approved") {
                      localStorage.removeItem(`etayo_released_${k}`);
                      localStorage.removeItem(`etayo_paid_${k}`);
                    }
                  }
                });
              } catch (e) {}
            }

            const isPaidLocal = typeof window !== "undefined" && (
              localStorage.getItem(`etayo_paid_${id}`) === "true" ||
              localStorage.getItem(`etayo_paid_${lowerId}`) === "true" ||
              localStorage.getItem(`etayo_paid_${upperId}`) === "true" ||
              (foundCached as any)?.paymentStatus === "paid" ||
              foundCached?.status === "released" ||
              Boolean((foundCached as any)?.isReleased)
            );

            const isConfirmedLocal = typeof window !== "undefined" && (
              isPaidLocal ||
              localStorage.getItem(`etayo_payment_confirmed_${id}`) === "true" ||
              localStorage.getItem(`etayo_payment_confirmed_${lowerId}`) === "true" ||
              localStorage.getItem(`etayo_payment_confirmed_${upperId}`) === "true" ||
              Boolean(localStorage.getItem(`etayo_receipt_${id}`)) ||
              Boolean(localStorage.getItem(`etayo_receipt_${lowerId}`)) ||
              Boolean(localStorage.getItem(`etayo_receipt_${upperId}`)) ||
              Boolean((foundCached as any)?.userConfirmedPayment) ||
              Boolean((bApp as any).userConfirmedPayment)
            );

            const isApprovedLocal = isPaidLocal || isApplicationApproved(bApp) || (foundCached ? isApplicationApproved(foundCached) : false);

            const cachedReceiptUrl = typeof window !== "undefined" 
              ? (localStorage.getItem(`etayo_receipt_${id}`) || localStorage.getItem(`etayo_receipt_${lowerId}`) || localStorage.getItem(`etayo_receipt_${upperId}`))
              : null;

            const storedOp = typeof window !== "undefined" ? (localStorage.getItem(`etayo_op_${id}`) || localStorage.getItem(`etayo_op_${lowerId}`) || localStorage.getItem(`etayo_op_${upperId}`)) : null;
            const storedFees = typeof window !== "undefined" ? (localStorage.getItem(`etayo_fees_${id}`) || localStorage.getItem(`etayo_fees_${lowerId}`) || localStorage.getItem(`etayo_fees_${upperId}`)) : null;
            const storedDateApproved = typeof window !== "undefined" ? (localStorage.getItem(`etayo_date_approved_${id}`) || localStorage.getItem(`etayo_date_approved_${lowerId}`) || localStorage.getItem(`etayo_date_approved_${upperId}`)) : null;
            const storedRemarks = typeof window !== "undefined" ? (localStorage.getItem(`etayo_remarks_${id}`) || localStorage.getItem(`etayo_remarks_${lowerId}`) || localStorage.getItem(`etayo_remarks_${upperId}`)) : null;

            const isLocalUnderReview = typeof window !== "undefined" && (
              localStorage.getItem(`etayo_status_${id}`) === "under_review" ||
              localStorage.getItem(`etayo_status_${lowerId}`) === "under_review" ||
              localStorage.getItem(`etayo_status_${upperId}`) === "under_review" ||
              (foundCached as any)?.status === "under_review" ||
              bApp.status === "under_review"
            );

            const effectiveStatus = isPaidLocal 
              ? "released" 
              : (isApprovedLocal 
                  ? "approved" 
                  : (isLocalUnderReview 
                      ? "under_review" 
                      : (bApp.status && bApp.status !== "pending" 
                          ? bApp.status 
                          : (foundCached?.status || bApp.status))));

            if ((isApprovedLocal || isPaidLocal) && typeof window !== "undefined") {
              try {
                [id, lowerId, upperId].forEach(k => {
                  if (k) {
                    localStorage.setItem(`etayo_status_${k}`, (isPaidLocal || effectiveStatus === "released") ? "released" : "approved");
                    localStorage.setItem(`etayo_approved_${k}`, "true");
                    if (isPaidLocal || effectiveStatus === "released") {
                      localStorage.setItem(`etayo_released_${k}`, "true");
                      localStorage.setItem(`etayo_paid_${k}`, "true");
                    }
                  }
                });
              } catch (e) {}
            } else if (effectiveStatus === "under_review" && typeof window !== "undefined") {
              try {
                [id, lowerId, upperId].forEach(k => {
                  if (k) localStorage.setItem(`etayo_status_${k}`, "under_review");
                });
              } catch (e) {}
            }

            if (foundCached) {
              const isApproved = effectiveStatus === "approved" || effectiveStatus === "released";

              return {
                ...foundCached,
                ...bApp,
                status: effectiveStatus,
                isArchived,
                isReleased: isPaidLocal || effectiveStatus === "released" || Boolean((bApp as any).isReleased) || Boolean((foundCached as any).isReleased),
                paymentStatus: isPaidLocal ? "paid" : (bApp.paymentStatus || (foundCached as any).paymentStatus || (isConfirmedLocal ? "awaiting_verification" : undefined)),
                userConfirmedPayment: isConfirmedLocal,
                officialReceiptNo: (bApp as any).officialReceiptNo || (foundCached as any)?.officialReceiptNo,
                orderOfPaymentNo: (storedOp && storedOp !== "OP-2026" ? storedOp : null) || (bApp as any).orderOfPaymentNo || (foundCached as any)?.orderOfPaymentNo || `OP-${String(bApp.id || "").replace(/^[A-Za-z]+-/i, "") || "2026"}`,
                assessedFees: storedFees ? Number(storedFees) : ((bApp as any).assessedFees || (foundCached as any)?.assessedFees || (bApp as any).estimatedFees || (bApp.permitType === "locational_clearance" || String(bApp.id).toUpperCase().startsWith("LC-") ? 1500 : 6200)),
                dateApproved: storedDateApproved || (bApp as any).dateApproved || (foundCached as any)?.dateApproved || (isApproved ? ((bApp as any).dateIssued || new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })) : undefined),
                remarks: storedRemarks || bApp.remarks || foundCached.remarks,
                trackingSteps: (bApp.trackingSteps && bApp.trackingSteps.length > 0) ? bApp.trackingSteps : foundCached.trackingSteps,
                historyLog: (bApp.historyLog && bApp.historyLog.length > 0) ? bApp.historyLog : foundCached.historyLog,
                paymentProofUrl: cachedReceiptUrl || (bApp as any).paymentProofUrl || (foundCached as any)?.paymentProofUrl
              };
            }

            if (isConfirmedLocal || isPaidLocal || isApprovedLocal) {
              const curIsLC = bApp.permitType === "locational_clearance" || String(bApp.id).toUpperCase().startsWith("LC-");
              const curCleanSeq = String(bApp.id || "").replace(/^[A-Za-z]+-/i, "");
              return {
                ...bApp,
                status: effectiveStatus,
                isArchived,
                isReleased: isPaidLocal || Boolean((bApp as any).isReleased),
                paymentStatus: isPaidLocal ? "paid" : ((bApp as any).paymentStatus || (isConfirmedLocal ? "awaiting_verification" : (isApprovedLocal ? "awaiting_payment" : undefined))),
                userConfirmedPayment: isConfirmedLocal,
                orderOfPaymentNo: (storedOp && storedOp !== "OP-2026" ? storedOp : null) || (bApp as any).orderOfPaymentNo || `OP-${curCleanSeq || "2026"}`,
                assessedFees: storedFees ? Number(storedFees) : ((bApp as any).assessedFees || (bApp as any).estimatedFees || (curIsLC ? 1500 : 6200)),
                dateApproved: storedDateApproved || (bApp as any).dateApproved || (isApprovedLocal ? new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : undefined),
                remarks: storedRemarks || bApp.remarks,
                paymentProofUrl: cachedReceiptUrl || (bApp as any).paymentProofUrl
              };
            }

            return {
              ...bApp,
              isArchived
            };
          });

          // Always retain valid locally cached applications (e.g. newly submitted applications
          // that are pending backend database synchronization or local offline submissions)
          cleanCached.forEach((c) => {
            if (!mergedApps.some((m) => matchPermitId(m.id, c.id))) {
              mergedApps.push(c);
            }
          });
        }
      } catch (e) {
        console.warn("Error merging local cached applications", e);
      }

      // Guarantee all merged applications also reflect any approved or paid flags in localStorage
      mergedApps = mergedApps.map((mApp) => {
        const mId = String(mApp.id || "").trim();
        const mLower = mId.toLowerCase();
        const mUpper = mId.toUpperCase();
        const mRawStatus = String(mApp.status || "").toLowerCase().trim();

        const mIsArchived = typeof window !== "undefined" && Boolean(mId) && (
          localStorage.getItem(`etayo_archived_${mId}`) === "true" ||
          localStorage.getItem(`etayo_archived_${mLower}`) === "true" ||
          localStorage.getItem(`etayo_archived_${mUpper}`) === "true" ||
          Boolean(mApp.isArchived)
        );

        const mIsLocallyApproved = typeof window !== "undefined" && Boolean(mId) && (
          localStorage.getItem(`etayo_approved_${mId}`) === "true" ||
          localStorage.getItem(`etayo_approved_${mLower}`) === "true" ||
          localStorage.getItem(`etayo_approved_${mUpper}`) === "true" ||
          localStorage.getItem(`etayo_status_${mId}`) === "approved" ||
          localStorage.getItem(`etayo_status_${mLower}`) === "approved" ||
          localStorage.getItem(`etayo_status_${mUpper}`) === "approved" ||
          localStorage.getItem(`etayo_status_${mId}`) === "released" ||
          localStorage.getItem(`etayo_status_${mLower}`) === "released" ||
          localStorage.getItem(`etayo_status_${mUpper}`) === "released"
        );
        const mIsApproved = isApplicationApproved(mApp) || Boolean(mIsLocallyApproved);

        const mIsLocallyUnderReview = typeof window !== "undefined" && Boolean(mId) && (
          localStorage.getItem(`etayo_status_${mId}`) === "under_review" ||
          localStorage.getItem(`etayo_status_${mLower}`) === "under_review" ||
          localStorage.getItem(`etayo_status_${mUpper}`) === "under_review" ||
          mRawStatus === "under_review"
        );

        const mEffectiveRawStatus = (!mIsApproved && mIsLocallyUnderReview) ? "under_review" : mRawStatus;

        if (mEffectiveRawStatus === "under_review" && typeof window !== "undefined" && mId) {
          try {
            [mId, mLower, mUpper].forEach(k => {
              if (k) localStorage.setItem(`etayo_status_${k}`, "under_review");
            });
          } catch (e) {}
        }

        // 1. Strict guard: If application is pending, rejected, cancelled, or incomplete AND has not been approved by admin:
        if (!mIsApproved && (mEffectiveRawStatus === "pending" || mEffectiveRawStatus === "rejected" || mEffectiveRawStatus === "cancelled" || mEffectiveRawStatus === "incomplete_requirements")) {
          if (typeof window !== "undefined" && mId) {
            try {
              [mId, mLower, mUpper].forEach(k => {
                if (k) {
                  localStorage.removeItem(`etayo_approved_${k}`);
                  localStorage.removeItem(`etayo_released_${k}`);
                  localStorage.removeItem(`etayo_paid_${k}`);
                  localStorage.removeItem(`etayo_payment_confirmed_${k}`);
                  localStorage.removeItem(`etayo_receipt_${k}`);
                  localStorage.removeItem(`etayo_op_${k}`);
                  localStorage.removeItem(`etayo_fees_${k}`);
                  localStorage.removeItem(`etayo_date_approved_${k}`);
                  if (mEffectiveRawStatus === "pending") {
                    localStorage.setItem(`etayo_status_${k}`, "pending");
                  }
                }
              });
            } catch (e) {}
          }

          let cleanSteps = mApp.trackingSteps || [];
          if (mEffectiveRawStatus === "pending") {
            cleanSteps = cleanSteps.map((st: any, idx: number) => {
              if (idx === 0) return { ...st, status: "completed" };
              if (idx === 1) return { ...st, status: "in-progress" };
              return { ...st, status: "upcoming" };
            });
          }

          return {
            ...mApp,
            status: mEffectiveRawStatus,
            isArchived: mIsArchived,
            trackingSteps: cleanSteps,
            isReleased: false,
            paymentStatus: "unpaid" as const,
            userConfirmedPayment: false,
            orderOfPaymentNo: undefined,
            dateApproved: undefined
          };
        }

        const mIsPaid = typeof window !== "undefined" && (
          localStorage.getItem(`etayo_paid_${mId}`) === "true" ||
          localStorage.getItem(`etayo_paid_${mLower}`) === "true" ||
          localStorage.getItem(`etayo_paid_${mUpper}`) === "true" ||
          (mApp as any)?.paymentStatus === "paid" ||
          mApp.status === "released" ||
          Boolean((mApp as any)?.isReleased)
        );
        const mOp = typeof window !== "undefined" ? (localStorage.getItem(`etayo_op_${mId}`) || localStorage.getItem(`etayo_op_${mLower}`) || localStorage.getItem(`etayo_op_${mUpper}`)) : null;
        const mFees = typeof window !== "undefined" ? (localStorage.getItem(`etayo_fees_${mId}`) || localStorage.getItem(`etayo_fees_${mLower}`) || localStorage.getItem(`etayo_fees_${mUpper}`)) : null;
        const mDateApp = typeof window !== "undefined" ? (localStorage.getItem(`etayo_date_approved_${mId}`) || localStorage.getItem(`etayo_date_approved_${mLower}`) || localStorage.getItem(`etayo_date_approved_${mUpper}`)) : null;
        const mRemarks = typeof window !== "undefined" ? (localStorage.getItem(`etayo_remarks_${mId}`) || localStorage.getItem(`etayo_remarks_${mLower}`) || localStorage.getItem(`etayo_remarks_${mUpper}`)) : null;

        const mEffectiveStatus = mIsPaid ? "released" : (mIsApproved ? "approved" : (mIsLocallyUnderReview ? "under_review" : mApp.status));

        if ((mIsApproved || mIsPaid) && typeof window !== "undefined") {
          try {
            [mId, mLower, mUpper].forEach(k => {
              if (k) {
                localStorage.setItem(`etayo_status_${k}`, mIsPaid ? "released" : "approved");
                localStorage.setItem(`etayo_approved_${k}`, "true");
                if (mIsPaid) {
                  localStorage.setItem(`etayo_released_${k}`, "true");
                } else {
                  localStorage.removeItem(`etayo_released_${k}`);
                }
              }
            });
          } catch (e) {}
        }

        let mTracking = mApp.trackingSteps || [];
        if (mIsApproved || mEffectiveStatus === "approved" || mEffectiveStatus === "released") {
          const rawSteps = mTracking.length > 0 ? [...mTracking] : [
            { title: "1. Filing", status: "completed" as const },
            { title: "2. Evaluation", status: "completed" as const },
            { title: "3. Zoning Clearance", status: "completed" as const }
          ];
          mTracking = rawSteps.map((st: any, idx: number) => {
            const sName = String(st?.title || st?.name || "").toLowerCase();
            if (idx === 0 || idx === 1 || sName.includes("filing") || sName.includes("submitted") || sName.includes("evaluation") || sName.includes("review")) {
              return { ...st, status: "completed" };
            }
            if (idx === 2 || sName.includes("zoning") || sName.includes("clearance") || sName.includes("approved")) {
              return { ...st, status: "completed" };
            }
            return st;
          });
          const hasStep3 = mTracking.some((st: any) => {
            const sName = String(st?.title || st?.name || "").toLowerCase();
            return sName.includes("zoning") || sName.includes("clearance") || sName.includes("approved") || sName.includes("3.");
          });
          if (!hasStep3) {
            mTracking.push({
              title: "3. Zoning Clearance",
              status: "completed" as const
            });
          }

          if (mEffectiveStatus === "released") {
            const hasStep4 = mTracking.some((st: any) => {
              const sName = String(st?.title || st?.name || "").toLowerCase();
              return sName.includes("released") || sName.includes("4.");
            });
            if (!hasStep4) {
              mTracking.push({
                title: "4. Released",
                status: "completed" as const
              });
            } else {
              mTracking = mTracking.map((st: any) => {
                const sName = String(st?.title || st?.name || "").toLowerCase();
                if (sName.includes("released") || sName.includes("4.")) {
                  return { ...st, status: "completed" as const };
                }
                return st;
              });
            }
          }
        }

        const mIsLC = mApp.permitType === "locational_clearance" || String(mApp.id || "").toUpperCase().startsWith("LC-");
        const mCleanSeq = String(mApp.id || "").replace(/^[A-Za-z]+-/i, "");
        return {
          ...mApp,
          status: mEffectiveStatus,
          isArchived: mIsArchived,
          trackingSteps: mTracking,
          orderOfPaymentNo: (mOp && mOp !== "OP-2026" ? mOp : null) || (mApp as any).orderOfPaymentNo || `OP-${mCleanSeq || "2026"}`,
          assessedFees: mFees ? Number(mFees) : ((mApp as any).assessedFees || (mApp as any).estimatedFees || (mIsLC ? 1500 : 6200)),
          dateApproved: mDateApp || (mApp as any).dateApproved || (mIsApproved ? ((mApp as any).dateIssued || new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })) : undefined),
          remarks: mRemarks || mApp.remarks,
        };
      });

      setApplications(mergedApps);
      try {
        localStorage.setItem("etayo_cached_applications", JSON.stringify(mergedApps.map(a => sanitizeAppForStorage(a))));
      } catch (e) {}

      let backendLogs: SystemLog[] = [];
      if (logsRes.ok) {
        const rawLogs = await logsRes.json();
        if (Array.isArray(rawLogs)) {
          backendLogs = rawLogs.map(normalizeLog);
        }
      }

      // Restore cached logs if backend logs is empty
      let cachedLogs: SystemLog[] = [];
      try {
        const storedLogs = localStorage.getItem("etayo_cached_logs");
        if (storedLogs) {
          cachedLogs = JSON.parse(storedLogs);
        }
      } catch (e) {}

      // Build accurate, comprehensive system logs
      const combinedLogs = buildAccurateSystemLogs(mergedApps, backendLogs.length > 0 ? backendLogs : cachedLogs);
      setSystemLogs(combinedLogs);
      try {
        localStorage.setItem("etayo_cached_logs", JSON.stringify(combinedLogs));
      } catch (e) {}

      if (feesRes.ok) {
        const feesData = await feesRes.json();
        if (Array.isArray(feesData) && feesData.length > 0) {
          setFeeStructures(feesData);
          try {
            localStorage.setItem("etayo_cached_fees", JSON.stringify(feesData));
          } catch (e) {}
        }
      }
    } catch (error) {
      console.warn("Notice: Backend connecting or polling...", error);
    }
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      // 1. If unauthenticated, clear active state while preserving local storage
      setApplications([]);
    } else {
      // 1. Immediately restore locally cached applications for authenticated session
      try {
        const stored = localStorage.getItem("etayo_cached_applications");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const clean = parsed.filter(a => !isDummyApp(a)).map(a => {
              const aId = String(a.id || "").trim();
              const aLower = aId.toLowerCase();
              const aUpper = aId.toUpperCase();
              const aStatus = String(a.status || "").toLowerCase().trim();
              const localSt = typeof window !== "undefined" && aId ? localStorage.getItem(`etayo_status_${aId}`) : null;
              const isLocApproved = typeof window !== "undefined" && Boolean(aId) && (
                localSt === "approved" ||
                localSt === "released" ||
                localStorage.getItem(`etayo_approved_${aId}`) === "true" ||
                localStorage.getItem(`etayo_approved_${aLower}`) === "true" ||
                localStorage.getItem(`etayo_approved_${aUpper}`) === "true"
              );
              const isArchived = Boolean(a.isArchived) || (typeof window !== "undefined" && Boolean(aId) && (
                localStorage.getItem(`etayo_archived_${aId}`) === "true" ||
                localStorage.getItem(`etayo_archived_${aLower}`) === "true" ||
                localStorage.getItem(`etayo_archived_${aUpper}`) === "true"
              ));
              if (!isLocApproved && (aStatus === "pending" || localSt === "pending")) {
                return {
                  ...a,
                  status: "pending",
                  isArchived,
                  isReleased: false,
                  paymentStatus: undefined,
                  userConfirmedPayment: false,
                  orderOfPaymentNo: undefined,
                  dateApproved: undefined,
                  trackingSteps: (a.trackingSteps && a.trackingSteps.length > 0)
                    ? a.trackingSteps.map((st: any, idx: number) => ({
                        ...st,
                        status: idx === 0 ? "completed" : idx === 1 ? "in-progress" : "upcoming"
                      }))
                    : a.trackingSteps
                };
              }
              if (isLocApproved) {
                return {
                  ...a,
                  status: localSt === "released" ? "released" : "approved",
                  isArchived,
                  trackingSteps: (a.trackingSteps && a.trackingSteps.length > 0)
                    ? a.trackingSteps.map((st: any, idx: number) => {
                        if (idx <= 2) return { ...st, status: "completed" };
                        return st;
                      })
                    : a.trackingSteps
                };
              }
              return {
                ...a,
                isArchived
              };
            });
            setApplications(clean);
            if (clean.length !== parsed.length) {
              try {
                localStorage.setItem("etayo_cached_applications", JSON.stringify(clean));
              } catch (e) {}
            }
          }
        }
      } catch (e) {
        console.warn("Could not load cached applications from localStorage", e);
      }
    }

    // 2. Immediately restore locally cached system logs and build accurate initial logs
    try {
      const storedLogs = localStorage.getItem("etayo_cached_logs");
      let restoredLogs: SystemLog[] = [];
      if (storedLogs) {
        const parsedLogs = JSON.parse(storedLogs);
        if (Array.isArray(parsedLogs)) {
          restoredLogs = parsedLogs;
        }
      }
      const storedApps = localStorage.getItem("etayo_cached_applications");
      const currentApps = storedApps ? JSON.parse(storedApps) : [];
      const accurateInitial = buildAccurateSystemLogs(currentApps, restoredLogs);
      setSystemLogs(accurateInitial);
      try {
        localStorage.setItem("etayo_cached_logs", JSON.stringify(accurateInitial));
      } catch (e) {}
    } catch (e) {}

    // 3. Immediately restore locally cached fee structures
    try {
      const storedFees = localStorage.getItem("etayo_cached_fees");
      if (storedFees) {
        const parsedFees = JSON.parse(storedFees);
        if (Array.isArray(parsedFees) && parsedFees.length > 0) {
          setFeeStructures(parsedFees);
        }
      }
    } catch (e) {}

    // 4. Fetch fresh data from backend immediately
    fetchData();

    // 5. Set up periodic polling for instant multi-tab & multi-window sync across windows (only on dashboard routes)
    const pollInterval = setInterval(() => {
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path === "/login" || path === "/register" || path === "/") {
          return; // Never poll on auth/landing pages
        }
      }
      const currentToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!currentToken) return; // Do not poll when logged out
      fetchData();
    }, 4000);

    // 6. Cross-tab & multi-window instant reactive update listener
    const handleSyncEvent = () => {
      try {
        const stored = localStorage.getItem("etayo_cached_applications");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setApplications(parsed.filter(a => !isDummyApp(a)));
          }
        }
      } catch (err) {}
      fetchData();
    };

    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        handleSyncEvent();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleSyncEvent);
      window.addEventListener("focus", handleSyncEvent);
      window.addEventListener("etayo_applications_updated", handleSyncEvent);
      window.addEventListener("etayo_fees_updated", handleSyncEvent);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    // Restore user role from login session
    try {
      const userStr = localStorage.getItem("user");
      if (userStr && token) {
        const userObj = JSON.parse(userStr);
        let role = "public";
        if (userObj.role === "ROLE_APPLICANT") role = "applicant";
        if (userObj.role === "ROLE_STAFF") role = "staff";
        if (userObj.role === "ROLE_ADMIN" || userObj.role === "ROLE_SUPERADMIN") role = "admin";
        setUserRole(role as UserRole);
      } else {
        setUserRole("public");
      }
    } catch(e) {}

    setMounted(true);

    return () => {
      clearInterval(pollInterval);
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleSyncEvent);
        window.removeEventListener("focus", handleSyncEvent);
        window.removeEventListener("etayo_applications_updated", handleSyncEvent);
        window.removeEventListener("etayo_fees_updated", handleSyncEvent);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, []);

  // Handle inactivity timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleTimeout = () => {
      if (userRole !== "public") {
        setUserRole("public");
        setApplications([]);
        try {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        } catch (e) {}
      }
    };

    const resetIdleTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleTimeout, 30 * 60 * 1000); // 30 min idle timeout
    };

    resetIdleTimer();

    window.addEventListener("mousemove", resetIdleTimer);
    window.addEventListener("keydown", resetIdleTimer);
    window.addEventListener("click", resetIdleTimer);
    window.addEventListener("scroll", resetIdleTimer);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("mousemove", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
      window.removeEventListener("click", resetIdleTimer);
      window.removeEventListener("scroll", resetIdleTimer);
    };
  }, [userRole]);

  const sanitizeAppForStorage = (app: PermitApplication): PermitApplication => {
    if (!app) return app;
    const clean: any = { ...app };
    if (typeof clean.fileUrl === "string" && clean.fileUrl.startsWith("data:") && clean.fileUrl.length > 500) {
      clean.fileUrl = "/templates/UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf";
    }
    // Always preserve BFP clearance upload
    if ((app as any).bfpUploadedFile) {
      clean.bfpUploadedFile = (app as any).bfpUploadedFile;
      clean.bfpUploadedFileName = (app as any).bfpUploadedFileName;
    }
    if (Array.isArray(clean.requirements)) {
      clean.requirements = clean.requirements.map((r: any) => {
        if (!r) return r;
        const cleanR = { ...r };
        const isBfpOrFsec = (cleanR.name || "").toLowerCase().includes("bfp") ||
                            (cleanR.name || "").toLowerCase().includes("fsec") ||
                            (cleanR.fileName || "").toLowerCase().includes("bfp") ||
                            (cleanR.fileName || "").toLowerCase().includes("fsec");
        // Keep BFP / user-uploaded attachment intact so evaluator can inspect the real file
        if (!isBfpOrFsec && typeof cleanR.fileUrl === "string" && cleanR.fileUrl.startsWith("data:") && cleanR.fileUrl.length > 500) {
          cleanR.fileUrl = "/templates/UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf";
        }
        return cleanR;
      });
    }
    return clean;
  };

  const addApplication = async (rawApp: PermitApplication) => {
    const newApp = sanitizeAppForStorage(rawApp);
    if ((rawApp as any).bfpUploadedFile && !newApp.bfpUploadedFile) {
      (newApp as any).bfpUploadedFile = (rawApp as any).bfpUploadedFile;
      (newApp as any).bfpUploadedFileName = (rawApp as any).bfpUploadedFileName;
    }
    // Ensure new application strictly defaults to pending status
    if (!newApp.status) {
      newApp.status = "pending";
    }

    // 1. Optimistic UI update
    setApplications((prev) => [newApp, ...prev.filter(a => a.id !== newApp.id)]);

    // 2. Cache in localStorage immediately and reset any stale flags for this ID
    try {
      const id = String(newApp.id || "").trim();
      const lowerId = id.toLowerCase();
      const upperId = id.toUpperCase();
      [id, lowerId, upperId].forEach((k) => {
        localStorage.removeItem(`etayo_approved_${k}`);
        localStorage.removeItem(`etayo_released_${k}`);
        localStorage.removeItem(`etayo_paid_${k}`);
        localStorage.removeItem(`etayo_payment_confirmed_${k}`);
        localStorage.removeItem(`etayo_payment_ref_${k}`);
        localStorage.removeItem(`etayo_receipt_${k}`);
        localStorage.removeItem(`etayo_or_${k}`);
        localStorage.setItem(`etayo_status_${k}`, newApp.status || "pending");
      });

      const stored = localStorage.getItem("etayo_cached_applications");
      const currentList: PermitApplication[] = stored ? JSON.parse(stored) : [];
      const cleanList = currentList.map(a => sanitizeAppForStorage(a)).filter(a => a.id !== newApp.id);
      localStorage.setItem("etayo_cached_applications", JSON.stringify([newApp, ...cleanList]));

      // Broadcast storage and custom event for instant cross-tab & multi-window sync!
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("etayo_applications_updated", { detail: newApp }));
      }
    } catch (e) {
      console.warn("Could not cache application to localStorage:", e);
    }

    // 3. Immediately create accurate audit log for this submission (non-blocking)
    const applicantLabel = newApp.applicantName || newApp.applicantEmail || "Applicant";
    const projLabel = newApp.projectName || newApp.projectType || "Permit Application";
    addSystemLog({
      action: "APPLICATION_SUBMITTED",
      category: "application",
      status: "info",
      user: newApp.applicantEmail || applicantLabel,
      message: `New application submitted: ${projLabel} (${newApp.id})`,
      details: `Applicant ${applicantLabel} submitted ${newApp.projectType || newApp.permitType}. Location: ${newApp.projectAddress || newApp.location?.address || "Sto. Tomas, Pampanga"}.`
    }).catch(() => {});

    // 4. Background network sync with fast timeout
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 15000);
      let res = await fetch("/api/permits", {
        method: "POST",
        headers,
        body: JSON.stringify(newApp),
        signal: ctrl.signal
      }).catch(() => null);
      clearTimeout(tid);

      if (!res || !res.ok) {
        const remoteCtrl = new AbortController();
        const remoteTid = setTimeout(() => remoteCtrl.abort(), 15000);
        await fetch(`${API_BASE_URL}/permits`, {
          method: "POST",
          headers,
          body: JSON.stringify(newApp),
          signal: remoteCtrl.signal
        }).catch(() => null);
        clearTimeout(remoteTid);
      }
    } catch (e) {
      console.error("Failed to save permit", e);
    }
  };

  const updateApplication = async (updatedApp: PermitApplication) => {
    const matchPermitId = (a?: string, b?: string) => Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());

    if (updatedApp.status === "approved" || (updatedApp.status as string) === "released") {
      const rawSteps = (updatedApp.trackingSteps && updatedApp.trackingSteps.length > 0) ? [...updatedApp.trackingSteps] : [
        { title: "1. Filing", status: "completed" as const },
        { title: "2. Evaluation", status: "completed" as const },
        { title: "3. Zoning Clearance", status: "completed" as const }
      ];
      let fixedSteps = rawSteps.map((st: any, idx: number) => {
        const sName = String(st?.title || st?.name || "").toLowerCase();
        if (idx === 0 || idx === 1 || sName.includes("filing") || sName.includes("submitted") || sName.includes("evaluation") || sName.includes("review")) {
          return { ...st, status: "completed" };
        }
        if (idx === 2 || sName.includes("zoning") || sName.includes("clearance") || sName.includes("approved")) {
          return { ...st, status: "completed" };
        }
        return st;
      });
      const hasStep3 = fixedSteps.some((st: any) => {
        const sName = String(st?.title || st?.name || "").toLowerCase();
        return sName.includes("zoning") || sName.includes("clearance") || sName.includes("approved") || sName.includes("3.");
      });
      if (!hasStep3) {
        fixedSteps.push({
          title: "3. Zoning Clearance",
          status: "completed" as const
        });
      }

      if (updatedApp.status === "released" || Boolean((updatedApp as any).isReleased)) {
        const hasStep4 = fixedSteps.some((st: any) => {
          const sName = String(st?.title || st?.name || "").toLowerCase();
          return sName.includes("released") || sName.includes("4.");
        });
        if (!hasStep4) {
          fixedSteps.push({
            title: "4. Released",
            status: "completed" as const
          });
        } else {
          fixedSteps = fixedSteps.map((st: any) => {
            const sName = String(st?.title || st?.name || "").toLowerCase();
            if (sName.includes("released") || sName.includes("4.")) {
              return { ...st, status: "completed" as const };
            }
            return st;
          });
        }
      }

      updatedApp = {
        ...updatedApp,
        trackingSteps: fixedSteps
      };
    }

    // 1. Optimistic UI update with case-insensitive ID matching
    setApplications((prev) => {
      const exists = prev.some((app) => matchPermitId(app.id, updatedApp.id));
      if (exists) {
        return prev.map((app) => (matchPermitId(app.id, updatedApp.id) ? { ...app, ...updatedApp } : app));
      }
      return [updatedApp, ...prev];
    });

    // 2. Cache in localStorage immediately so refreshes never lose the approval or payment!
    try {
      const id = String(updatedApp.id || "").trim();
      const lowerId = id.toLowerCase();
      const upperId = id.toUpperCase();

      [id, lowerId, upperId].forEach(k => {
        localStorage.setItem(`etayo_status_${k}`, updatedApp.status);
        if (updatedApp.status === "approved" || updatedApp.status === "released") {
          localStorage.setItem(`etayo_approved_${k}`, "true");
        }
        if ((updatedApp as any).orderOfPaymentNo) {
          localStorage.setItem(`etayo_op_${k}`, (updatedApp as any).orderOfPaymentNo);
        }
        if ((updatedApp as any).assessedFees) {
          localStorage.setItem(`etayo_fees_${k}`, String((updatedApp as any).assessedFees));
        }
        if ((updatedApp as any).dateApproved) {
          localStorage.setItem(`etayo_date_approved_${k}`, (updatedApp as any).dateApproved);
        }
        if ((updatedApp as any).remarks) {
          localStorage.setItem(`etayo_remarks_${k}`, (updatedApp as any).remarks);
        }
        if ((updatedApp as any).userConfirmedPayment) {
          localStorage.setItem(`etayo_payment_confirmed_${k}`, "true");
        }
        if ((updatedApp as any).paymentReference) {
          localStorage.setItem(`etayo_payment_ref_${k}`, (updatedApp as any).paymentReference);
        }
        if ((updatedApp as any).paymentMethod) {
          localStorage.setItem(`etayo_payment_method_${k}`, (updatedApp as any).paymentMethod);
        }
        if ((updatedApp as any).paymentStatus === "paid" || updatedApp.status === "released") {
          localStorage.setItem(`etayo_paid_${k}`, "true");
        }
        if (updatedApp.isArchived !== undefined) {
          if (updatedApp.isArchived) {
            localStorage.setItem(`etayo_archived_${k}`, "true");
          } else {
            localStorage.removeItem(`etayo_archived_${k}`);
          }
        }
      });

      if (updatedApp.isArchived !== undefined) {
        try {
          const s = localStorage.getItem("etayo_archived_application_ids");
          let list: string[] = s ? JSON.parse(s) : [];
          if (!Array.isArray(list)) list = [];
          if (updatedApp.isArchived) {
            if (!list.some(x => x.trim().toLowerCase() === lowerId)) {
              list.push(id);
            }
          } else {
            list = list.filter(x => x.trim().toLowerCase() !== lowerId);
          }
          localStorage.setItem("etayo_archived_application_ids", JSON.stringify(list));
        } catch (e) {}
      }

      const stored = localStorage.getItem("etayo_cached_applications");
      const currentList: PermitApplication[] = stored ? JSON.parse(stored) : [];
      const cleanList = currentList.map(a => sanitizeAppForStorage(a));
      const cleanUpdatedApp = sanitizeAppForStorage(updatedApp);
      const updatedList = cleanList.some(a => matchPermitId(a.id, cleanUpdatedApp.id))
        ? cleanList.map(a => matchPermitId(a.id, cleanUpdatedApp.id) ? { ...a, ...cleanUpdatedApp } : a)
        : [cleanUpdatedApp, ...cleanList];
      localStorage.setItem("etayo_cached_applications", JSON.stringify(updatedList));

      // Broadcast storage and custom event for instant cross-tab & multi-window sync!
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("etayo_applications_updated", { detail: updatedApp }));
      }
    } catch (e) {
      console.warn("Could not cache updated application to localStorage", e);
    }

    // 3. Automatically record accurate audit log for status updates
    if (updatedApp.status === "approved" || updatedApp.status === "released") {
      await addSystemLog({
        action: "EVALUATION_APPROVED",
        category: "application",
        status: "success",
        user: updatedApp.assignedStaff || updatedApp.evaluatorEmail || "admin@etayo.gov.ph",
        message: `Application ${updatedApp.id} (${updatedApp.projectName || updatedApp.projectType}) officially APPROVED`,
        details: updatedApp.remarks || "All requirements and clearances approved by Municipal Planning and Development Office."
      });
    } else if (updatedApp.status === "incomplete_requirements") {
      await addSystemLog({
        action: "EVALUATION_REVISION_REQUESTED",
        category: "application",
        status: "warning",
        user: updatedApp.assignedStaff || updatedApp.evaluatorEmail || "admin@etayo.gov.ph",
        message: `Application ${updatedApp.id} requirements revision requested`,
        details: updatedApp.remarks || "Applicant requested to upload missing engineering plans or documents."
      });
    } else if (updatedApp.status === "rejected") {
      await addSystemLog({
        action: "EVALUATION_REJECTED",
        category: "application",
        status: "error",
        user: updatedApp.assignedStaff || updatedApp.evaluatorEmail || "admin@etayo.gov.ph",
        message: `Application ${updatedApp.id} (${updatedApp.projectName || updatedApp.projectType}) REJECTED`,
        details: updatedApp.remarks || "Application rejected by municipal evaluator."
      });
    }

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const targetId = encodeURIComponent(String(updatedApp.id).trim());

      // 4. Fast PATCH status endpoint to guarantee DB update (proxy first)
      const patchBody = JSON.stringify({
        status: updatedApp.status,
        remarks: updatedApp.remarks || ""
      });
      try {
        const pCtrl = new AbortController();
        const pTid = setTimeout(() => pCtrl.abort(), 2500);
        let patchRes = await fetch(`/api/permits/${targetId}/status`, {
          method: "PATCH",
          headers,
          body: patchBody,
          signal: pCtrl.signal
        }).catch(() => null);
        clearTimeout(pTid);

        if (!patchRes || !patchRes.ok) {
          const rpCtrl = new AbortController();
          const rpTid = setTimeout(() => rpCtrl.abort(), 2500);
          patchRes = await fetch(`${API_BASE_URL}/permits/${targetId}/status`, {
            method: "PATCH",
            headers,
            body: patchBody,
            signal: rpCtrl.signal
          }).catch(() => null);
          clearTimeout(rpTid);
        }
      } catch (e) {}

      // 5. Full PUT update for tracking steps, logs, requirements (proxy first)
      try {
        const uCtrl = new AbortController();
        const uTid = setTimeout(() => uCtrl.abort(), 2500);
        let res = await fetch(`/api/permits/${targetId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(updatedApp),
          signal: uCtrl.signal
        }).catch(() => null);
        clearTimeout(uTid);

        if (!res || !res.ok) {
          const ruCtrl = new AbortController();
          const ruTid = setTimeout(() => ruCtrl.abort(), 2500);
          res = await fetch(`${API_BASE_URL}/permits/${targetId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(updatedApp),
            signal: ruCtrl.signal
          }).catch(() => null);
          clearTimeout(ruTid);
        }
        if (res && res.ok) {
          const saved: PermitApplication = await res.json();
          setApplications((prev) =>
            prev.map((app) => (matchPermitId(app.id, saved.id) ? { ...app, ...saved, ...updatedApp } : app))
          );
        }
      } catch (e) {
        console.error("Failed to update permit on backend:", e);
      }
    } catch (e) {
      console.error("Error in updateApplication:", e);
    }
  };

  const archiveApplication = async (id: string, isArchived: boolean = true) => {
    if (!id) return;
    const cleanId = id.trim();
    const lowerId = cleanId.toLowerCase();
    const upperId = cleanId.toUpperCase();
    const matchPermitId = (a?: string, b?: string) => Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());

    // 1. Optimistic state update
    setApplications((prev) =>
      prev.map((app) => (matchPermitId(app.id, cleanId) ? { ...app, isArchived } : app))
    );

    // 2. Persist to localStorage across keys & lists
    if (typeof window !== "undefined") {
      try {
        [cleanId, lowerId, upperId].forEach(k => {
          if (k) {
            if (isArchived) {
              localStorage.setItem(`etayo_archived_${k}`, "true");
            } else {
              localStorage.removeItem(`etayo_archived_${k}`);
            }
          }
        });

        const savedArchived = localStorage.getItem("etayo_archived_application_ids");
        let list: string[] = savedArchived ? JSON.parse(savedArchived) : [];
        if (!Array.isArray(list)) list = [];

        if (isArchived) {
          if (!list.some(x => x.trim().toLowerCase() === lowerId)) {
            list.push(cleanId);
          }
        } else {
          list = list.filter(x => x.trim().toLowerCase() !== lowerId);
        }
        localStorage.setItem("etayo_archived_application_ids", JSON.stringify(list));

        // Update etayo_cached_applications
        const storedCached = localStorage.getItem("etayo_cached_applications");
        if (storedCached) {
          const parsed = JSON.parse(storedCached);
          if (Array.isArray(parsed)) {
            const updatedCache = parsed.map((app: any) =>
              matchPermitId(app.id, cleanId) ? { ...app, isArchived } : app
            );
            localStorage.setItem("etayo_cached_applications", JSON.stringify(updatedCache));
          }
        }

        // Broadcast events
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("etayo_archive_changed"));
        window.dispatchEvent(new CustomEvent("etayo_applications_updated", { detail: { id: cleanId, isArchived } }));
      } catch (err) {
        console.warn("Failed to persist archive state locally", err);
      }
    }

    // 3. Notify server endpoints (Next.js proxy and backend) with graceful timeout
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const targetId = encodeURIComponent(cleanId);

      // Dedicated archive endpoint
      fetch(`/api/permits/${targetId}/archive?archived=${isArchived}`, {
        method: "PATCH",
        headers
      }).catch(() => null);

      // Also PUT to ensure full record update
      fetch(`/api/permits/${targetId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ id: cleanId, isArchived })
      }).catch(() => null);

      // Direct backend archive
      fetch(`${API_BASE_URL}/permits/${targetId}/archive?archived=${isArchived}`, {
        method: "PATCH",
        headers
      }).catch(() => null);
    } catch (e) {
      console.warn("Failed to notify backend of archive status", e);
    }
  };

  const cancelApplication = async (id: string, reason: string = "Cancelled by applicant") => {
    const existing = applications.find(a => a.id === id);
    if (!existing) return;

    const updatedApp: PermitApplication = {
      ...existing,
      status: "cancelled",
      remarks: reason
    };

    await updateApplication(updatedApp);

    await addSystemLog({
      category: "application",
      status: "warning",
      action: "APPLICATION_CANCELLED",
      user: existing.applicantName || "Applicant",
      message: `Application ${id} (${existing.projectName || "Permit"}) was cancelled by applicant`,
      details: `Reason: ${reason}`
    });
  };

  const refreshApplications = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const updateFeeMultiplier = async (id: string, newValue: number) => {
    setFeeStructures((prev) =>
      prev.map((fee) => (fee.id === id ? { ...fee, multiplierValue: newValue } : fee))
    );

    await addSystemLog({
      category: "setting",
      status: "warning",
      action: "FEE_MULTIPLIER_UPDATED",
      user: "Super Admin",
      message: `Modified ordinance assessment factor for fee ID ${id} to ${newValue}`,
      details: `Assessment factor updated to ${newValue} for fee schedule item ${id}`
    });
  };

  const addSystemLog = async (logData: Partial<SystemLog>) => {
    const rawAction = logData.action || "SYSTEM_LOG";
    const rawDetails = logData.details || logData.message || "System action performed";
    const rawUser = logData.user || logData.userEmail || "Staff / System";

    const newLog = normalizeLog({
      id: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: logData.timestamp || new Date().toISOString(),
      category: logData.category,
      message: logData.message || rawDetails,
      user: rawUser,
      status: logData.status,
      action: rawAction,
      details: rawDetails,
      userEmail: rawUser,
    });

    // 1. Optimistic update and cache
    setSystemLogs((prev) => {
      const updated = [newLog, ...prev];
      try {
        localStorage.setItem("etayo_cached_logs", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 2. Persist to backend database (only staff/admin can write to /api/logs)
    try {
      const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      let isStaffOrAdmin = false;
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          const r = String(u.role || "").toUpperCase();
          if (r.includes("ADMIN") || r.includes("STAFF")) isStaffOrAdmin = true;
        } catch (e) {}
      } else if (userRoleRef.current === "admin" || userRoleRef.current === "staff") {
        isStaffOrAdmin = true;
      }

      if (isStaffOrAdmin) {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const logCtrl = new AbortController();
        const logTid = setTimeout(() => logCtrl.abort(), 2000);
        await fetch(`${API_BASE_URL}/logs`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: rawAction,
            userEmail: rawUser,
            details: rawDetails,
            ipAddress: "127.0.0.1",
          }),
          signal: logCtrl.signal
        }).finally(() => clearTimeout(logTid));
      }
    } catch (e) {
      // quiet fallback
    }
  };

  const clearLogs = async () => {
    setSystemLogs([]);
    try {
      localStorage.removeItem("etayo_cached_logs");
    } catch (e) {}
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`${API_BASE_URL}/logs`, {
        method: "DELETE",
        headers
      });
    } catch (e) {
      console.warn("Could not clear logs on backend:", e);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[var(--bg-main)]"></div>; // Wait for hydration
  }

  return (
    <PermitContext.Provider
      value={{
        userRole,
        setUserRole,
        applications,
        systemLogs,
        feeStructures,
        selectedPermitType,
        setSelectedPermitType,
        addApplication,
        updateApplication,
        archiveApplication,
        cancelApplication,
        refreshApplications,
        updateFeeMultiplier,
        addSystemLog,
        clearLogs,
      }}
    >
      {children}
    </PermitContext.Provider>
  );
};

export const usePermitContext = () => {
  const context = useContext(PermitContext);
  if (context === undefined) {
    throw new Error("usePermitContext must be used within a PermitProvider");
  }
  return context;
};
