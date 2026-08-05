"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { PermitApplication, SystemLog, FeeStructure, PermitType } from "../types";
import { INITIAL_APPLICATIONS, INITIAL_SYSTEM_LOGS, FEE_STRUCTURES } from "../data/mock";

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

  const [applications, setApplications] = useState<PermitApplication[]>(INITIAL_APPLICATIONS);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(INITIAL_SYSTEM_LOGS);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(FEE_STRUCTURES);

  // Client-side hydration
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedApps = localStorage.getItem("etayo_applications");
    const savedLogs = localStorage.getItem("etayo_system_logs");
    const savedFees = localStorage.getItem("etayo_fee_structures");
    
    if (savedApps) setApplications(JSON.parse(savedApps));
    if (savedLogs) setSystemLogs(JSON.parse(savedLogs));
    if (savedFees) setFeeStructures(JSON.parse(savedFees));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("etayo_applications", JSON.stringify(applications));
      localStorage.setItem("etayo_system_logs", JSON.stringify(systemLogs));
      localStorage.setItem("etayo_fee_structures", JSON.stringify(feeStructures));
    }
  }, [applications, systemLogs, feeStructures, mounted]);

  const addApplication = (newApp: PermitApplication) => {
    setApplications((prev) => [newApp, ...prev]);

    const newLog: SystemLog = {
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      category: "application",
      message: `Created digital dossier ${newApp.id} for "${newApp.projectName}"`,
      user: newApp.applicantName,
      status: "success",
    };
    setSystemLogs((prev) => [newLog, ...prev]);
  };

  const updateApplication = (updatedApp: PermitApplication) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === updatedApp.id ? updatedApp : app))
    );

    const newLog: SystemLog = {
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      category: "application",
      message: `Permit folder ${updatedApp.id} status modified to ${updatedApp.status.toUpperCase()}`,
      user: userRole === "staff" ? "OBO Reviewer Staff" : updatedApp.applicantName,
      status: updatedApp.status === "incomplete_requirements" ? "warning" : "info",
    };
    setSystemLogs((prev) => [newLog, ...prev]);
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
