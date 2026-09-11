"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "../../components/layout/Sidebar";
import MangTomasBot from "../../components/chat/MangTomasBot";
import { usePermitContext } from "../../context/PermitContext";
import { ShieldAlert } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userRole } = usePermitContext();
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Determine if current route allows public guest tracking
    const isPublicTrackingRoute = 
      pathname === "/applicant/track" || 
      pathname.startsWith("/applicant/track/");

    if (isPublicTrackingRoute) {
      setIsAuthorized(true);
      return;
    }

    // 2. For all other dashboard routes, enforce active authenticated session
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;

      if (!token || !userStr) {
        setIsAuthorized(false);
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      const userObj = JSON.parse(userStr);
      const userRoleStr = userObj.role || "";

      // 3. Role-based route boundary checks
      if (pathname.startsWith("/staff")) {
        const hasStaffAccess = ["ROLE_STAFF", "ROLE_ADMIN", "ROLE_SUPERADMIN"].includes(userRoleStr);
        if (!hasStaffAccess) {
          setIsAuthorized(false);
          router.replace("/applicant/dashboard");
          return;
        }
      }

      if (pathname.startsWith("/admin")) {
        const hasAdminAccess = ["ROLE_ADMIN", "ROLE_SUPERADMIN"].includes(userRoleStr);
        if (!hasAdminAccess) {
          setIsAuthorized(false);
          router.replace(userRoleStr === "ROLE_STAFF" ? "/staff/dashboard" : "/applicant/dashboard");
          return;
        }
      }

      if (pathname.startsWith("/superadmin")) {
        if (userRoleStr !== "ROLE_SUPERADMIN") {
          setIsAuthorized(false);
          router.replace("/applicant/dashboard");
          return;
        }
      }

      setIsAuthorized(true);
    } catch (e) {
      setIsAuthorized(false);
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router]);

  // Loading state while verifying authorization
  if (isAuthorized === null) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc", gap: "1rem" }}>
        <div style={{ width: "40px", height: "40px", border: "4px solid #e2e8f0", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#64748b", fontSize: "0.95rem", fontWeight: "600" }}>Verifying secure session...</p>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  // If unauthorized and redirecting
  if (!isAuthorized) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc", gap: "1rem" }}>
        <ShieldAlert size={48} color="#ef4444" />
        <p style={{ color: "#0f172a", fontSize: "1.1rem", fontWeight: "700" }}>Authentication Required</p>
        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Redirecting to secure login portal...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">
          {children}
        </div>
      </main>
      
      {/* Render the chat bot only for applicants */}
      {userRole === "applicant" && <MangTomasBot />}
    </div>
  );
}

