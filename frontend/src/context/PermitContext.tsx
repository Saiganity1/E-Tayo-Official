"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { PermitApplication, SystemLog, FeeStructure, PermitType } from "../types";

const API_BASE_URL = "http://localhost:8080/api";

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
        const [appsRes, logsRes, feesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/permits`),
          fetch(`${API_BASE_URL}/logs`),
          fetch(`${API_BASE_URL}/fees`)
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
  }, []);

  // Idle Logout Logic (10 minutes)
  useEffect(() => {
    if (!mounted) return;
    
    const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes in ms

    const resetIdleTimer = () => {
      localStorage.setItem("etayo_last_activity", Date.now().toString());
    };

    const checkIdle = setInterval(() => {
      if (userRole === "public") return; // Not logged in

      const lastActivity = parseInt(localStorage.getItem("etayo_last_activity") || Date.now().toString(), 10);
      if (Date.now() - lastActivity > IDLE_TIMEOUT) {
        // Log out
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("etayo_last_activity");
        setUserRole("public");
        window.location.href = "/login?timeout=true";
      }
    }, 10000); // Check every 10 seconds

    // Track activity
    window.addEventListener("mousemove", resetIdleTimer);
    window.addEventListener("keydown", resetIdleTimer);
    window.addEventListener("click", resetIdleTimer);
    window.addEventListener("scroll", resetIdleTimer);
    
    // Initialize
    resetIdleTimer();

    return () => {
      clearInterval(checkIdle);
      window.removeEventListener("mousemove", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
      window.removeEventListener("click", resetIdleTimer);
      window.removeEventListener("scroll", resetIdleTimer);
    };
  }, [mounted, userRole]);

  // We no longer sync to localStorage since we are using a real backend database.

  const addApplication = async (newApp: PermitApplication) => {
    // Optimistic UI update
    setApplications((prev) => [newApp, ...prev]);

    try {
      await fetch(`${API_BASE_URL}/permits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newApp)
      });
    } catch (e) {
      console.error("Failed to save permit", e);
    }
  };

  const updateApplication = async (updatedApp: PermitApplication) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === updatedApp.id ? updatedApp : app))
    );

    try {
      await fetch(`${API_BASE_URL}/permits/${updatedApp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedApp)
      });
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
