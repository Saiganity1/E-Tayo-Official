"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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

export const PermitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>("public");
  const [selectedPermitType, setSelectedPermitType] = useState<PermitType>("building_permit");

  const [applications, setApplications] = useState<PermitApplication[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);

  // Client-side hydration
  const [mounted, setMounted] = useState(false);

  // Reusable fetch function for initial load and polling
  const fetchData = async () => {
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

      const [appsRes, logsRes, feesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/permits`, { headers }).catch(e => ({ ok: false, json: async () => [] })),
        fetch(`${API_BASE_URL}/logs`, { headers }).catch(e => ({ ok: false, json: async () => [] })),
        fetch(`${API_BASE_URL}/fees`, { headers }).catch(e => ({ ok: false, json: async () => [] }))
      ]);

      if (appsRes.ok) {
        const backendApps: PermitApplication[] = await appsRes.json();
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

            // Include any locally created applications not yet in backend, and sync them back to backend
            cleanCached.forEach((c) => {
              if (!mergedApps.some((m) => m.id === c.id)) {
                mergedApps.push(c);
                fetch(`${API_BASE_URL}/permits`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
                  body: JSON.stringify(c)
                }).catch(() => {});
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
      }

      if (logsRes.ok) {
        const rawLogs = await logsRes.json();
        if (Array.isArray(rawLogs)) {
          const formatted = rawLogs.map(normalizeLog);
          setSystemLogs(formatted);
          try {
            localStorage.setItem("etayo_cached_logs", JSON.stringify(formatted));
          } catch (e) {}
        }
      }

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
  };

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

    // 2. Immediately restore locally cached system logs (only if admin/staff)
    try {
      const storedLogs = localStorage.getItem("etayo_cached_logs");
      if (storedLogs && token) {
        const parsedLogs = JSON.parse(storedLogs);
        if (Array.isArray(parsedLogs) && parsedLogs.length > 0) {
          setSystemLogs(parsedLogs);
        }
      }
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

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // 3. Fast PATCH status endpoint to guarantee DB update
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

      // 4. Full PUT update for tracking steps, logs, requirements
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

  const refreshApplications = async () => {
    await fetchData();
  };

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
