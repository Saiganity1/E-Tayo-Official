"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "../../components/layout/Sidebar";
import Footer from "../../components/layout/Footer";
import MangTomasBot from "../../components/chat/MangTomasBot";
import BackToTop from "../../components/layout/BackToTop";
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

  // Inactivity (30 min) and Absolute (8 hr) Session Lifetime Manager
  useEffect(() => {
    if (typeof window === "undefined") return;

    let lastRecord = Date.now();
    const recordActivity = () => {
      const now = Date.now();
      if (now - lastRecord > 30000) {
        lastRecord = now;
        try {
          localStorage.setItem("etayo_last_active", String(now));
        } catch (e) {}
      }
    };

    const interval = setInterval(() => {
      const now = Date.now();
      const lastActive = Number(localStorage.getItem("etayo_last_active") || now);
      const sessionStart = Number(localStorage.getItem("etayo_session_start") || now);
      const token = localStorage.getItem("token");

      if (token) {
        const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
        const ABSOLUTE_LIMIT_MS = 8 * 60 * 60 * 1000; // 8 hours

        if (now - lastActive > INACTIVITY_LIMIT_MS || now - sessionStart > ABSOLUTE_LIMIT_MS) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("etayo_session_start");
          localStorage.removeItem("etayo_last_active");
          if (typeof document !== "undefined") {
            document.cookie = "token=; path=/; max-age=0";
            document.cookie = "role=; path=/; max-age=0";
          }
          router.replace("/login?expired=1");
        }
      }
    }, 60000);

    window.addEventListener("click", recordActivity, { passive: true });
    window.addEventListener("keydown", recordActivity, { passive: true });
    window.addEventListener("scroll", recordActivity, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener("click", recordActivity);
      window.removeEventListener("keydown", recordActivity);
      window.removeEventListener("scroll", recordActivity);
    };
  }, [router]);

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

      // Check session expiry limits
      const now = Date.now();
      const sessionStart = Number(localStorage.getItem("etayo_session_start") || now);
      if (!localStorage.getItem("etayo_session_start")) {
        localStorage.setItem("etayo_session_start", String(now));
      }
      const lastActive = Number(localStorage.getItem("etayo_last_active") || now);
      if (!localStorage.getItem("etayo_last_active")) {
        localStorage.setItem("etayo_last_active", String(now));
      }

      const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
      const ABSOLUTE_LIMIT_MS = 8 * 60 * 60 * 1000; // 8 hours

      if (now - sessionStart > ABSOLUTE_LIMIT_MS || now - lastActive > INACTIVITY_LIMIT_MS) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("etayo_session_start");
        localStorage.removeItem("etayo_last_active");
        if (typeof document !== "undefined") {
          document.cookie = "token=; path=/; max-age=0";
          document.cookie = "role=; path=/; max-age=0";
        }
        setIsAuthorized(false);
        router.replace("/login?expired=1");
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
        const hasAdminAccess = ["ROLE_ADMIN", "ROLE_SUPERADMIN"].includes(userRoleStr) || (userRoleStr === "ROLE_STAFF" && pathname.startsWith("/admin/evaluations"));
        if (!hasAdminAccess) {
          setIsAuthorized(false);
          router.replace(userRoleStr === "ROLE_STAFF" ? "/admin/evaluations" : "/applicant/dashboard");
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
        <div style={{ width: "40px", height: "40px", border: "4px solid #e2e8f0", borderTopColor: "#0038A8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
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
        <Footer />
      </main>
      
      {/* Render the chat bot only for applicants */}
      {userRole === "applicant" && <MangTomasBot />}

      {/* Floating Back to Top Button with scroll progress */}
      <BackToTop hasChatBot={userRole === "applicant"} />
    </div>
  );
}

