"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  Building2, Home, PlusCircle, Search, FileCheck, 
  MessageSquare, ShieldAlert, Map, X, Menu, Settings, LogOut, Users, ClipboardList, FileText,
  Shield, CheckSquare
} from "lucide-react";
import { usePermitContext } from "../../context/PermitContext";
import NotificationBell from "./NotificationBell";

export default function Sidebar() {
  const { userRole, setUserRole, applications } = usePermitContext();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const [userName, setUserName] = useState("");
  const [approvedClearanceRef, setApprovedClearanceRef] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("etayo_active_clearance_ref");
      if (stored && stored !== "EXEMPT") return stored;
      try {
        const params = new URLSearchParams(window.location.search);
        const refParam = params.get("clearanceRef");
        if (refParam && refParam !== "EXEMPT") return refParam;
      } catch (e) {}
    }
    return null;
  });
  
  React.useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj.name) setUserName(userObj.name);
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage");
    }
  }, []);

  React.useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const refParam = params.get("clearanceRef");
        if (refParam && refParam !== "EXEMPT") {
          setApprovedClearanceRef(refParam);
          localStorage.setItem("etayo_active_clearance_ref", refParam);
        }
      }

      let list = applications || [];
      if (list.length === 0 && typeof window !== "undefined") {
        const cached = localStorage.getItem("etayo_cached_applications");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) list = parsed;
        }
      }

      const approved = list.find(
        (app: any) =>
          (app.permitType === "locational_clearance" || (app.id && app.id.startsWith("LC-"))) &&
          (app.status?.toLowerCase() === "approved" || app.status?.toLowerCase() === "released")
      );

      if (approved) {
        setApprovedClearanceRef(approved.id);
        if (typeof window !== "undefined") {
          localStorage.setItem("etayo_active_clearance_ref", approved.id);
        }
      } else if (typeof window !== "undefined") {
        const storedRef = localStorage.getItem("etayo_active_clearance_ref");
        if (storedRef && storedRef !== "EXEMPT") {
          setApprovedClearanceRef(storedRef);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [applications]);

  const getNavItems = () => {
    switch (userRole) {
      case "public":
        return [
          { href: "/", label: "Home", icon: Home },
        ];
      case "applicant": {
        const approvedApp = (applications || []).find(
          (app: any) =>
            (app.permitType === "locational_clearance" || (app.id && app.id.startsWith("LC-"))) &&
            (app.status?.toLowerCase() === "approved" || app.status?.toLowerCase() === "released")
        );
        const clearanceRef = approvedApp?.id || approvedClearanceRef;

        // Check if user has ALREADY submitted a connected Stage 2 application
        const submittedStage2 = clearanceRef
          ? (applications || []).find(
              (app: any) =>
                app.id !== clearanceRef &&
                !(app.permitType === "locational_clearance" || (app.id && app.id.startsWith("LC-"))) &&
                (
                  (app.locationalClearanceRef && app.locationalClearanceRef.trim().toLowerCase() === clearanceRef.trim().toLowerCase()) ||
                  (approvedApp?.projectName && app.projectName && (
                    app.projectName.toLowerCase().includes(approvedApp.projectName.toLowerCase()) ||
                    approvedApp.projectName.toLowerCase().includes(app.projectName.toLowerCase())
                  ))
                )
            )
          : null;

        return [
          { href: "/applicant/dashboard", label: "Dashboard", icon: Home },
          { href: "/applicant/apply", label: "New Application", icon: PlusCircle },
          { href: "/applicant/track", label: "Application Status", icon: ClipboardList },
          ...(clearanceRef ? [
            submittedStage2 ? {
              href: `/applicant/track/${encodeURIComponent(submittedStage2.id)}`,
              label: "Existing Application",
              icon: FileCheck,
              badge: submittedStage2.status === "approved" || submittedStage2.status === "released" ? "Approved" : "Review"
            } : {
              href: `/applicant/apply?clearanceRef=${encodeURIComponent(clearanceRef)}&step=3`,
              label: "Existing Application",
              icon: FileCheck,
              badge: "Stage 2"
            }
          ] : []),
          { href: "/applicant/map", label: "Map", icon: Map },
          { href: "/applicant/messages", label: "Messages", icon: MessageSquare, badge: 3 },
        ];
      }
      case "staff":
        return [
          { href: "/staff/dashboard", label: "Review Hub", icon: FileCheck },
          { href: "/staff/templates", label: "Official Forms", icon: FileText },
          { href: "/staff/track", label: "Query & Inspect", icon: Search },
          { href: "/staff/map", label: "Map", icon: Map },
          { href: "/staff/messages", label: "Messages", icon: MessageSquare, badge: 5 },
        ];
      case "admin":
        return [
          { href: "/admin/evaluations", label: "Staff Evaluations", icon: FileCheck },
          { href: "/admin/security", label: "Security & Auth", icon: Shield },
          { href: "/admin/form-tester", label: "Form Testing Studio", icon: ClipboardList },
          { href: "/staff/dashboard", label: "Review Workspaces", icon: CheckSquare },
          { href: "/staff/templates", label: "Official Forms", icon: FileText },
          { href: "/admin/users", label: "Applicants Management", icon: Users },
          { href: "/admin/staff", label: "Staff Management", icon: ShieldAlert },
          { href: "/admin/messages", label: "Messages", icon: MessageSquare, badge: 1 },
          { href: "/admin/settings", label: "Settings", icon: Settings },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  
  // Fallback names if not loaded
  const defaultNames: Record<string, string> = {
    "applicant": "Applicant",
    "staff": "OBO Evaluator",
    "admin": "System Admin",
    "public": "Guest"
  };
  
  const displayName = userName || defaultNames[userRole] || "Guest";
  const avatarChar = displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="mobile-toggle" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Menu"
      >
        <Menu size={24} />
      </button>

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <Link href="/" className="logo-group" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', cursor: 'pointer' }} title="Bumalik sa Homepage">
            <Image src="/logo.png" alt="eTAYO" width={120} height={36} style={{ height: "30px", width: "auto", objectFit: "contain", cursor: "pointer" }} priority />
          </Link>
          <button className="close-btn" onClick={() => setIsOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
            <div className="user-avatar" style={{ flexShrink: 0 }}>
              {avatarChar}
            </div>
            <div className="user-info" style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span 
                className="user-name" 
                style={{ 
                  fontSize: displayName.length > 24 ? "0.7rem" : displayName.length > 16 ? "0.77rem" : "0.84rem",
                  lineHeight: "1.25",
                  fontWeight: 700,
                  wordBreak: "break-word"
                }}
                title={displayName}
              >
                {displayName}
              </span>
              <span className="user-role" style={{ marginTop: "2px" }}>{userRole}</span>
            </div>
          </div>
          {userRole !== "public" && (
            <div style={{ flexShrink: 0 }}>
              <NotificationBell />
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Main Menu</div>
          {navItems.map((item) => {
            const isActive = item.label === "Existing Application"
              ? (pathname === "/applicant/apply" && typeof window !== "undefined" && window.location.search.includes("clearanceRef"))
              : (item.href === "/applicant/apply"
                  ? (pathname === "/applicant/apply" && (typeof window === "undefined" || !window.location.search.includes("clearanceRef")))
                  : pathname === item.href);
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => setIsOpen(false)}
              >
                <div className="nav-item-content">
                  <Icon size={17} strokeWidth={2.2} />
                  <span>{item.label}</span>
                </div>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </Link>
            );
          })}
          
          {userRole !== "public" && (
            <>
              <div className="nav-divider"></div>
              
              <Link 
                href="/"
                className="nav-item text-danger hover-danger"
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  localStorage.removeItem("etayo_cached_applications");
                  localStorage.removeItem("etayo_cached_logs");
                  setUserRole("public");
                  setIsOpen(false);
                }}
              >
                <div className="nav-item-content">
                  <LogOut size={17} strokeWidth={2.2} />
                  <span>Sign Out</span>
                </div>
              </Link>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <p>Sto. Tomas, Pampanga</p>
          <small>© 2026 eTAYO System</small>
        </div>

      </aside>
    </>
  );
}
