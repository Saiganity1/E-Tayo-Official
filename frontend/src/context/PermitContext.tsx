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
  updateFeeMultiplier: (id: string, value: number) => void;
  clearLogs: () => void;
}

const PermitContext = createContext<PermitContextProps | undefined>(undefined);

export const PermitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>("public");
  const [selectedPermitType, setSelectedPermitType] = useState<PermitType>("building_permit");

  const [applications, setApplications] = useState<PermitApplication[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);

  // Client-side hydration
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Fetch data from backend
    const fetchData = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers: Record<string, string> = { "Accept": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const [appsRes, logsRes, feesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/permits`, { headers }),
          fetch(`${API_BASE_URL}/logs`, { headers }),
          fetch(`${API_BASE_URL}/fees`, { headers })
        ]);

        if (appsRes.ok) setApplications(await appsRes.json());
        if (logsRes.ok) setSystemLogs(await logsRes.json());
        if (feesRes.ok) setFeeStructures(await feesRes.json());
      } catch (error) {
        console.error("Error fetching data from backend:", error);
      }
    };

    fetchData();

    // Restore user role from login session
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userObj = JSON.parse(userStr);
        let role = "public";
        if (userObj.role === "ROLE_APPLICANT") role = "applicant";
        if (userObj.role === "ROLE_STAFF") role = "staff";
        if (userObj.role === "ROLE_ADMIN" || userObj.role === "ROLE_SUPERADMIN") role = "admin";
        setUserRole(role as UserRole);
      }
    } catch(e) {}

    setMounted(true);
  }, [mounted]);

  // Handle inactivity timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleTimeout = () => {
      if (userRole !== "public") {
        setUserRole("public");
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
  }, [mounted, userRole]);

  const addApplication = async (newApp: PermitApplication) => {
    // Optimistic UI update
    setApplications((prev) => [newApp, ...prev]);

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
    setApplications((prev) =>
      prev.map((app) => (app.id === updatedApp.id ? updatedApp : app))
    );

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/permits/${updatedApp.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updatedApp)
      });
      if (!res.ok) {
        console.error("Failed to update permit on backend:", res.status, await res.text());
      }
    } catch (e) {
      console.error("Failed to update permit", e);
    }
  };

  const updateFeeMultiplier = (id: string, newValue: number) => {
    setFeeStructures((prev) =>
      prev.map((fee) => (fee.id === id ? { ...fee, multiplierValue: newValue } : fee))
    );

    const newLog: SystemLog = {
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      category: "setting",
      message: `Modified ordinance assessment factor for fee ID ${id} to ${newValue}`,
      user: "Super Admin",
      status: "warning",
    };
    setSystemLogs((prev) => [newLog, ...prev]);
  };

  const clearLogs = () => {
    setSystemLogs([]);
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
        updateFeeMultiplier,
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
