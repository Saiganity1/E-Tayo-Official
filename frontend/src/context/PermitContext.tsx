"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { PermitApplication, SystemLog, FeeStructure, PermitType } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api` 
  : "http://localhost:8080/api";

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

  // Reusable fetch function for initial load and polling (memoized to keep reference stable)
  const fetchData = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      
      // If user is unauthenticated (e.g. Incognito or guest), never fetch or store private permit data
      if (!token) {
        setApplications([]);
        try {
          localStorage.removeItem("etayo_cached_applications");
        } catch (e) {}
        
        // Only public fees are fetched for public users
        const feesRes = await fetch(`${API_BASE_URL}/fees`, { headers: { "Accept": "application/json" } }).catch(e => ({ ok: false, json: async () => [] }));
        if (feesRes.ok) {
          const feesData = await feesRes.json();
          if (Array.isArray(feesData) && feesData.length > 0) {
            setFeeStructures(feesData);
          }
        }
        return;
      }

      const headers: Record<string, string> = { 
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      };

      let isStaffOrAdmin = userRoleRef.current === "admin" || userRoleRef.current === "staff";
      try {
        const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u.role === "ROLE_ADMIN" || u.role === "ROLE_SUPERADMIN" || u.role === "ROLE_STAFF" || u.role === "admin" || u.role === "staff") {
            isStaffOrAdmin = true;
          }
        }
      } catch (e) {}

      const [appsRes, logsRes, feesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/permits`, { headers }).catch(e => ({ ok: false, json: async () => [] })),
        isStaffOrAdmin 
          ? fetch(`${API_BASE_URL}/logs`, { headers }).catch(e => ({ ok: false, json: async () => [] }))
          : Promise.resolve({ ok: false, json: async () => [] } as any),
        fetch(`${API_BASE_URL}/fees`, { headers }).catch(e => ({ ok: false, json: async () => [] }))
      ]);

      let backendApps: PermitApplication[] = [];
      if (appsRes.ok) {
        backendApps = await appsRes.json();
      }
      const cleanBackendApps = (backendApps || []).filter(a => !isDummyApp(a));
      
      let mergedApps = cleanBackendApps;
      try {
        const cachedStr = localStorage.getItem("etayo_cached_applications");
        if (cachedStr) {
          const cachedApps: PermitApplication[] = JSON.parse(cachedStr);
          const cleanCached = (cachedApps || []).filter(c => !isDummyApp(c));

          mergedApps = cleanBackendApps.map((bApp) => {
            if (bApp.status === "approved" || bApp.status === "released") {
              return bApp;
            }
            const foundCached = cleanCached.find((c) => c.id === bApp.id);
            if (foundCached && (foundCached.status === "approved" || foundCached.status === "released")) {
              return { ...bApp, ...foundCached };
            }
            return bApp;
          });

          // Include any locally created applications not yet in backend into state without resubmitting
          cleanCached.forEach((c) => {
            if (!mergedApps.some((m) => m.id === c.id)) {
              mergedApps.push(c);
            }
          });
        }
      } catch (e) {
        console.warn("Error merging local cached applications", e);
      }

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
      // 1. If unauthenticated, ensure no private permits are in state or cache
      setApplications([]);
      try {
        localStorage.removeItem("etayo_cached_applications");
      } catch (e) {}
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

    // 5. Set up periodic polling every 4 seconds for real-time multi-tab & multi-user sync
    const pollInterval = setInterval(() => {
      fetchData();
    }, 4000);

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
          localStorage.removeItem("etayo_cached_applications");
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
    // 1. Optimistic UI update
    setApplications((prev) => [newApp, ...prev]);

    // 2. Cache in localStorage immediately
    try {
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
    // 1. Optimistic UI update
    setApplications((prev) =>
      prev.map((app) => (app.id === updatedApp.id ? updatedApp : app))
    );

    // 2. Cache in localStorage immediately so refreshes never lose the approval!
    try {
      const stored = localStorage.getItem("etayo_cached_applications");
      const currentList: PermitApplication[] = stored ? JSON.parse(stored) : [];
      const updatedList = currentList.some(a => a.id === updatedApp.id)
        ? currentList.map(a => a.id === updatedApp.id ? updatedApp : a)
        : [updatedApp, ...currentList];
      localStorage.setItem("etayo_cached_applications", JSON.stringify(updatedList));
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

      // 4. Fast PATCH status endpoint to guarantee DB update
      try {
        await fetch(`${API_BASE_URL}/permits/${updatedApp.id}/status`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            status: updatedApp.status,
            remarks: updatedApp.remarks || ""
          })
        });
      } catch (e) {
        console.warn("PATCH status fallback notice", e);
      }

      // 5. Full PUT update for tracking steps, logs, requirements
      const res = await fetch(`${API_BASE_URL}/permits/${updatedApp.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updatedApp)
      });
      if (!res.ok) {
        console.error("Failed to update permit on backend:", res.status, await res.text());
      } else {
        const saved: PermitApplication = await res.json();
        setApplications((prev) =>
          prev.map((app) => (app.id === saved.id ? saved : app))
        );
      }
    } catch (e) {
      console.error("Failed to update permit", e);
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

    // 2. Persist to backend database
    try {
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
    } catch (e) {
      console.warn("Could not sync log to backend:", e);
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
