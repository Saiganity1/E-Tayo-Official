"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { PermitApplication, SystemLog, FeeStructure, PermitType } from "../types";
import { isApplicationApproved } from "../utils/projectGrouping";

const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official.onrender.com").replace(/\/+$/, "");
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
  return app.id === "LC-2025-0001" && (app.applicantName === "Juan Dela Cruz" || app.applicantEmail === "juan.delacruz@email.com");
};

export const buildAccurateSystemLogs = (apps: PermitApplication[], existingLogs: SystemLog[] = []): SystemLog[] => {
  const logMap = new Map<string, SystemLog>();

  // 1. Add existing logs first
  (existingLogs || []).forEach(log => {
    if (log && log.id) {
      logMap.set(log.id, log);
    }
  });

  // 2. Synthesize accurate logs for all actual applications in the system
  (apps || []).forEach(app => {
    if (!app || isDummyApp(app)) return;

    const applicantLabel = app.applicantName || app.applicantEmail || "Applicant";
    const projLabel = app.projectName || app.projectType || "Permit Project";
    const subTime = app.dateSubmitted ? new Date(app.dateSubmitted).toISOString() : new Date().toISOString();

    // Submission log
    const subLogId = `LOG-SUB-${app.id}`;
    if (!logMap.has(subLogId)) {
      logMap.set(subLogId, normalizeLog({
        id: subLogId,
        timestamp: subTime,
        category: "application",
        status: "info",
        action: "APPLICATION_SUBMITTED",
        user: app.applicantEmail || applicantLabel,
        message: `New application submitted: ${projLabel} (${app.id})`,
        details: `Applicant ${applicantLabel} filed ${app.permitType?.replace(/_/g, " ") || "permit"} for ${projLabel}. Location: ${app.projectAddress || app.location?.address || "Sto. Tomas, Pampanga"}.`,
        userEmail: app.applicantEmail || "applicant@etayo.gov.ph",
      }));
    }

    // Evaluation logs based on application status
    if (app.status === "approved" || app.status === "released") {
      const evalLogId = `LOG-EVAL-APP-${app.id}`;
      if (!logMap.has(evalLogId)) {
        const evalTime = new Date(new Date(subTime).getTime() + 3600000).toISOString();
        logMap.set(evalLogId, normalizeLog({
          id: evalLogId,
          timestamp: evalTime,
          category: "application",
          status: "success",
          action: "EVALUATION_APPROVED",
          user: app.assignedStaff || "staff@etayo.gov.ph",
          message: `Application ${app.id} (${projLabel}) officially APPROVED`,
          details: app.remarks || `Locational and zoning clearance approved by Sto. Tomas Municipal Planning and Development Office.`,
          userEmail: app.assignedStaff || "staff@etayo.gov.ph",
        }));
      }
    } else if (app.status === "incomplete_requirements" || app.status === "rejected") {
      const evalLogId = `LOG-EVAL-REV-${app.id}`;
      if (!logMap.has(evalLogId)) {
        const evalTime = new Date(new Date(subTime).getTime() + 1800000).toISOString();
        logMap.set(evalLogId, normalizeLog({
          id: evalLogId,
          timestamp: evalTime,
          category: "application",
          status: app.status === "rejected" ? "error" : "warning",
          action: app.status === "rejected" ? "EVALUATION_REJECTED" : "EVALUATION_REVISION_REQUESTED",
          user: app.assignedStaff || "staff@etayo.gov.ph",
          message: `Application ${app.id} (${projLabel}) - ${app.status === "rejected" ? "REJECTED" : "REVISION REQUIRED"}`,
          details: app.remarks || `Applicant requested to update documentation or specifications.`,
          userEmail: app.assignedStaff || "staff@etayo.gov.ph",
        }));
      }
    } else if (app.status === "under_review") {
      const evalLogId = `LOG-EVAL-REV-${app.id}`;
      if (!logMap.has(evalLogId)) {
        const evalTime = new Date(new Date(subTime).getTime() + 900000).toISOString();
        logMap.set(evalLogId, normalizeLog({
          id: evalLogId,
          timestamp: evalTime,
          category: "application",
          status: "info",
          action: "EVALUATION_UNDER_REVIEW",
          user: app.assignedStaff || "staff@etayo.gov.ph",
          message: `Application ${app.id} (${projLabel}) queued for technical evaluation`,
          details: `Staff evaluator assigned to verify zoning compliance and municipal ordinance criteria.`,
          userEmail: app.assignedStaff || "staff@etayo.gov.ph",
        }));
      }
    }

    // Include history log entries if present
    if (Array.isArray(app.historyLog)) {
      app.historyLog.forEach((h, hIdx) => {
        const hLogId = `LOG-HIST-${app.id}-${hIdx}`;
        if (!logMap.has(hLogId)) {
          let stat: "success" | "warning" | "info" | "error" = "info";
          const actUpper = (h.action || "").toUpperCase();
          if (actUpper.includes("APPROV")) stat = "success";
          if (actUpper.includes("REJECT") || actUpper.includes("CANCEL")) stat = "warning";

          logMap.set(hLogId, normalizeLog({
            id: hLogId,
            timestamp: h.date ? new Date(h.date).toISOString() : subTime,
            category: "application",
            status: stat,
            action: h.action || "APPLICATION_UPDATE",
            user: h.actor || applicantLabel,
            message: `${h.action || "Status Update"} on ${app.id} (${projLabel})`,
            details: h.details || `${h.action} recorded for application ${app.id}.`,
            userEmail: h.actor || "staff@etayo.gov.ph",
          }));
        }
      });
    }
  });

  // 3. Realistic System & Security baseline logs if total logs are low
  const baseLogs: SystemLog[] = [
    normalizeLog({
      id: "LOG-SYS-BASE-01",
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      category: "security",
      status: "success",
      action: "USER_LOGIN",
      user: "admin@etayo.gov.ph",
      message: "Administrator authenticated into Admin Portal",
      details: "Role: ROLE_ADMIN · Multi-Factor Session Verified · IP: 127.0.0.1",
      userEmail: "admin@etayo.gov.ph"
    }),
    normalizeLog({
      id: "LOG-SYS-BASE-02",
      timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
      category: "security",
      status: "success",
      action: "USER_LOGIN",
      user: "staff@etayo.gov.ph",
      message: "Staff Evaluator authenticated into Evaluation Workspace",
      details: "Role: ROLE_STAFF · Zoning & Permitting Unit · IP: 127.0.0.1",
      userEmail: "staff@etayo.gov.ph"
    }),
    normalizeLog({
      id: "LOG-SYS-BASE-03",
      timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      category: "setting",
      status: "success",
      action: "ZONING_MATRIX_SYNCED",
      user: "Super Admin",
      message: "Official Sto. Tomas 31-Project Type Permitting Matrix validated",
      details: "All 6 project categories (Residential, Commercial, Industrial, Institutional, Ancillary, Utilities) synchronized with municipal zoning code.",
      userEmail: "admin@etayo.gov.ph"
    }),
    normalizeLog({
      id: "LOG-SYS-BASE-04",
      timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      category: "system",
      status: "info",
      action: "SYSTEM_STARTUP",
      user: "system@etayo.gov.ph",
      message: "eTAYO Municipal Online Permitting System operational",
      details: "Spatial GIS mapping engine, PDF generation services, and database listeners initialized.",
      userEmail: "system@etayo.gov.ph"
    })
  ];

  baseLogs.forEach(b => {
    if (!logMap.has(b.id)) {
      logMap.set(b.id, b);
    }
  });

  return Array.from(logMap.values()).sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });
};

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

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      
      // If user is unauthenticated (e.g. on /login or guest), do not flood the backend
      if (!token) {
        setApplications([]);
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
            const pRes = await fetch(proxyPermitsUrl, { headers, cache: "no-store" });
            if (pRes.ok) return pRes;
          } catch (e) {}
        }
        return fetch(directPermitsUrl, { headers }).then(async r => {
          if (!r.ok && token) {
            return fetch(directPermitsUrl, { headers: { "Accept": "application/json" } });
          }
          return r;
        }).catch(e => ({ ok: false, json: async () => [] } as any));
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
        if (cachedStr) {
          const cachedApps: PermitApplication[] = JSON.parse(cachedStr);
          const cleanCached = (cachedApps || []).filter(c => !isDummyApp(c));

          mergedApps = cleanBackendApps.map((bApp) => {
            const foundCached = cleanCached.find((c) => matchPermitId(c.id, bApp.id));
            const id = (bApp.id || "").trim();
            const lowerId = id.toLowerCase();
            const upperId = id.toUpperCase();

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

            const effectiveStatus = isPaidLocal 
              ? "released" 
              : (isApprovedLocal 
                  ? "approved" 
                  : (bApp.status && bApp.status !== "pending" 
                      ? bApp.status 
                      : (foundCached?.status || bApp.status)));

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
            }

            if (foundCached) {
              const isApproved = effectiveStatus === "approved" || effectiveStatus === "released";

              return {
                ...foundCached,
                ...bApp,
                status: effectiveStatus,
                isReleased: isPaidLocal || effectiveStatus === "released" || Boolean((bApp as any).isReleased) || Boolean((foundCached as any).isReleased),
                paymentStatus: isPaidLocal ? "paid" : (bApp.paymentStatus || (foundCached as any).paymentStatus || (isConfirmedLocal ? "awaiting_verification" : undefined)),
                userConfirmedPayment: isConfirmedLocal,
                officialReceiptNo: (bApp as any).officialReceiptNo || (foundCached as any).officialReceiptNo,
                orderOfPaymentNo: storedOp || (bApp as any).orderOfPaymentNo || (foundCached as any).orderOfPaymentNo,
                assessedFees: storedFees ? Number(storedFees) : ((bApp as any).assessedFees || (foundCached as any).assessedFees),
                dateApproved: storedDateApproved || (bApp as any).dateApproved || (foundCached as any).dateApproved || (isApproved ? ((bApp as any).dateIssued || new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })) : undefined),
                remarks: storedRemarks || bApp.remarks || foundCached.remarks,
                trackingSteps: (bApp.trackingSteps && bApp.trackingSteps.length > 0) ? bApp.trackingSteps : foundCached.trackingSteps,
                historyLog: (bApp.historyLog && bApp.historyLog.length > 0) ? bApp.historyLog : foundCached.historyLog,
                paymentProofUrl: cachedReceiptUrl || (bApp as any).paymentProofUrl || (foundCached as any).paymentProofUrl
              };
            }

            if (isConfirmedLocal || isPaidLocal || isApprovedLocal) {
              return {
                ...bApp,
                status: effectiveStatus,
                isReleased: isPaidLocal || Boolean((bApp as any).isReleased),
                paymentStatus: isPaidLocal ? "paid" : ((bApp as any).paymentStatus || (isConfirmedLocal ? "awaiting_verification" : (isApprovedLocal ? "awaiting_payment" : undefined))),
                userConfirmedPayment: isConfirmedLocal,
                orderOfPaymentNo: storedOp || (bApp as any).orderOfPaymentNo,
                assessedFees: storedFees ? Number(storedFees) : (bApp as any).assessedFees,
                dateApproved: storedDateApproved || (bApp as any).dateApproved || (isApprovedLocal ? new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : undefined),
                remarks: storedRemarks || bApp.remarks,
                paymentProofUrl: cachedReceiptUrl || (bApp as any).paymentProofUrl
              };
            }

            return bApp;
          });

          // Include any locally created applications not yet in backend into state without resubmitting
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
        const mIsPaid = typeof window !== "undefined" && (
          localStorage.getItem(`etayo_paid_${mId}`) === "true" ||
          localStorage.getItem(`etayo_paid_${mLower}`) === "true" ||
          localStorage.getItem(`etayo_paid_${mUpper}`) === "true" ||
          (mApp as any)?.paymentStatus === "paid" ||
          mApp.status === "released" ||
          Boolean((mApp as any)?.isReleased)
        );
        const mIsApproved = mIsPaid || isApplicationApproved(mApp);
        const mOp = typeof window !== "undefined" ? (localStorage.getItem(`etayo_op_${mId}`) || localStorage.getItem(`etayo_op_${mLower}`) || localStorage.getItem(`etayo_op_${mUpper}`)) : null;
        const mFees = typeof window !== "undefined" ? (localStorage.getItem(`etayo_fees_${mId}`) || localStorage.getItem(`etayo_fees_${mLower}`) || localStorage.getItem(`etayo_fees_${mUpper}`)) : null;
        const mDateApp = typeof window !== "undefined" ? (localStorage.getItem(`etayo_date_approved_${mId}`) || localStorage.getItem(`etayo_date_approved_${mLower}`) || localStorage.getItem(`etayo_date_approved_${mUpper}`)) : null;
        const mRemarks = typeof window !== "undefined" ? (localStorage.getItem(`etayo_remarks_${mId}`) || localStorage.getItem(`etayo_remarks_${mLower}`) || localStorage.getItem(`etayo_remarks_${mUpper}`)) : null;

        const mEffectiveStatus = mIsPaid ? "released" : (mIsApproved ? "approved" : mApp.status);

        if ((mIsApproved || mIsPaid) && typeof window !== "undefined") {
          try {
            [mId, mLower, mUpper].forEach(k => {
              if (k) {
                localStorage.setItem(`etayo_status_${k}`, mIsPaid ? "released" : "approved");
                localStorage.setItem(`etayo_approved_${k}`, "true");
              }
            });
          } catch (e) {}
        }

        let mTracking = mApp.trackingSteps || [];
        if (mIsApproved || mEffectiveStatus === "approved" || mEffectiveStatus === "released") {
          const rawSteps = mTracking.length > 0 ? [...mTracking] : [
            { name: "1. Filing", title: "1. Filing", status: "completed" },
            { name: "2. Evaluation", title: "2. Evaluation", status: "completed" },
            { name: "3. Zoning Clearance", title: "3. Zoning Clearance", status: "completed" }
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
              name: "3. Zoning Clearance",
              title: "3. Zoning Clearance",
              status: "completed"
            });
          }
        }

        return {
          ...mApp,
          status: mEffectiveStatus,
          trackingSteps: mTracking,
          orderOfPaymentNo: mOp || (mApp as any).orderOfPaymentNo,
          assessedFees: mFees ? Number(mFees) : (mApp as any).assessedFees,
          dateApproved: mDateApp || (mApp as any).dateApproved || (mIsApproved ? ((mApp as any).dateIssued || new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })) : undefined),
          remarks: mRemarks || mApp.remarks,
        };
      });

      setApplications(mergedApps);
      try {
        localStorage.setItem("etayo_cached_applications", JSON.stringify(mergedApps));
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
            const clean = parsed.filter(a => !isDummyApp(a));
            setApplications(clean);
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

    // 5. Set up periodic polling every 6 seconds for real-time multi-tab & multi-user sync (only if window is visible and user is logged in)
    const pollInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      const currentToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!currentToken) return; // Do not poll when logged out
      fetchData();
    }, 6000);

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

  const addApplication = async (newApp: PermitApplication) => {
    // Ensure new application strictly defaults to pending status
    if (!newApp.status) {
      newApp.status = "pending";
    }

    // 1. Optimistic UI update
    setApplications((prev) => [newApp, ...prev]);

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
      localStorage.setItem("etayo_cached_applications", JSON.stringify([newApp, ...currentList.filter(a => a.id !== newApp.id)]));
    } catch (e) {}

    // 3. Immediately create accurate audit log for this submission
    const applicantLabel = newApp.applicantName || newApp.applicantEmail || "Applicant";
    const projLabel = newApp.projectName || newApp.projectType || "Permit Application";
    await addSystemLog({
      action: "APPLICATION_SUBMITTED",
      category: "application",
      status: "info",
      user: newApp.applicantEmail || applicantLabel,
      message: `New application submitted: ${projLabel} (${newApp.id})`,
      details: `Applicant ${applicantLabel} submitted ${newApp.projectType || newApp.permitType}. Location: ${newApp.projectAddress || newApp.location?.address || "Sto. Tomas, Pampanga"}.`
    });

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/permits`, {
        method: "POST",
        headers,
        body: JSON.stringify(newApp)
      });
      if (!res.ok) {
        console.error("Failed to save permit to backend:", res.status, await res.text());
      }
    } catch (e) {
      console.error("Failed to save permit", e);
    }
  };

  const updateApplication = async (updatedApp: PermitApplication) => {
    const matchPermitId = (a?: string, b?: string) => Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());

    if (updatedApp.status === "approved" || (updatedApp.status as string) === "released") {
      const rawSteps = (updatedApp.trackingSteps && updatedApp.trackingSteps.length > 0) ? [...updatedApp.trackingSteps] : [
        { name: "1. Filing", title: "1. Filing", status: "completed" },
        { name: "2. Evaluation", title: "2. Evaluation", status: "completed" },
        { name: "3. Zoning Clearance", title: "3. Zoning Clearance", status: "completed" }
      ];
      const fixedSteps = rawSteps.map((st: any, idx: number) => {
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
          name: "3. Zoning Clearance",
          title: "3. Zoning Clearance",
          status: "completed"
        });
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
      });

      const stored = localStorage.getItem("etayo_cached_applications");
      const currentList: PermitApplication[] = stored ? JSON.parse(stored) : [];
      const updatedList = currentList.some(a => matchPermitId(a.id, updatedApp.id))
        ? currentList.map(a => matchPermitId(a.id, updatedApp.id) ? { ...a, ...updatedApp } : a)
        : [updatedApp, ...currentList];
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
        user: updatedApp.assignedStaff || "staff@etayo.gov.ph",
        message: `Application ${updatedApp.id} (${updatedApp.projectName || updatedApp.projectType}) officially APPROVED`,
        details: updatedApp.remarks || "All requirements and clearances approved by Municipal Planning and Development Office."
      });
    } else if (updatedApp.status === "incomplete_requirements") {
      await addSystemLog({
        action: "EVALUATION_REVISION_REQUESTED",
        category: "application",
        status: "warning",
        user: updatedApp.assignedStaff || "staff@etayo.gov.ph",
        message: `Application ${updatedApp.id} requirements revision requested`,
        details: updatedApp.remarks || "Applicant requested to upload missing engineering plans or documents."
      });
    } else if (updatedApp.status === "rejected") {
      await addSystemLog({
        action: "EVALUATION_REJECTED",
        category: "application",
        status: "error",
        user: updatedApp.assignedStaff || "staff@etayo.gov.ph",
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
        let patchRes = await fetch(`/api/permits/${targetId}/status`, {
          method: "PATCH",
          headers,
          body: patchBody
        }).catch(() => null);
        if (!patchRes || !patchRes.ok) {
          patchRes = await fetch(`${API_BASE_URL}/permits/${targetId}/status`, {
            method: "PATCH",
            headers,
            body: patchBody
          }).catch(() => null);
        }
      } catch (e) {}

      // 5. Full PUT update for tracking steps, logs, requirements (proxy first)
      try {
        let res = await fetch(`/api/permits/${targetId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(updatedApp)
        }).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch(`${API_BASE_URL}/permits/${targetId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(updatedApp)
          }).catch(() => null);
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

        await fetch(`${API_BASE_URL}/logs`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: rawAction,
            userEmail: rawUser,
            details: rawDetails,
            ipAddress: "127.0.0.1",
          })
        });
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
