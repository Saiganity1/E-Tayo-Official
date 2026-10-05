"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  Building2, Home, PlusCircle, Search, FileCheck, 
  MessageSquare, ShieldAlert, Map, X, Menu, Settings, LogOut, Users, ClipboardList, FileText,
  Shield, CheckSquare, Globe
} from "lucide-react";
import { usePermitContext } from "../../context/PermitContext";
import { useLanguage } from "../../context/LanguageContext";
import NotificationBell from "./NotificationBell";
import { isApplicationReleased } from "@/utils/projectGrouping";

export default function Sidebar() {
  const { userRole, setUserRole, applications } = usePermitContext();
  const { language, setLanguage, t } = useLanguage();
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
        let name = userObj.name || "";
        
        // If name looks like an email or is empty, resolve actual Full Name from local registered stores
        if (!name || name.includes("@")) {
          const registeredUsersRaw = localStorage.getItem("etayo_registered_users");
          if (registeredUsersRaw) {
            try {
              const regList = JSON.parse(registeredUsersRaw);
              const found = regList.find((u: any) => u.email?.toLowerCase() === userObj.email?.toLowerCase());
              if (found && found.name) name = found.name;
            } catch (e) {}
          }
          if (!name || name.includes("@")) {
            const assignedStaffRaw = localStorage.getItem("etayo_assigned_staff");
            if (assignedStaffRaw) {
              try {
                const staffList = JSON.parse(assignedStaffRaw);
                const found = staffList.find((u: any) => u.email?.toLowerCase() === userObj.email?.toLowerCase());
                if (found && found.name) name = found.name;
              } catch (e) {}
            }
          }
        }

        if ((!name || name.includes("@")) && userObj.email?.toLowerCase().includes("admin")) {
          name = "Municipal Administrator";
        }

        if (name && !name.includes("@")) {
          setUserName(name);
        }
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage");
    }
  }, []);

  // Close sidebar automatically on navigation/route change
  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile sidebar is open to avoid background jitter
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (isOpen) {
        document.body.style.overflow = "hidden";
        document.body.style.touchAction = "none";
      } else {
        document.body.style.overflow = "";
        document.body.style.touchAction = "";
      }
    }
    return () => {
      if (typeof window !== "undefined") {
        document.body.style.overflow = "";
        document.body.style.touchAction = "";
      }
    };
  }, [isOpen]);

  // Handle escape key to close sidebar
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

      const released = list.find(
        (app: any) =>
          (app.permitType === "locational_clearance" || (app.id && app.id.startsWith("LC-"))) &&
          (app.status?.toLowerCase() === "released" || isApplicationReleased(app))
      );

      if (released) {
        setApprovedClearanceRef(released.id);
        if (typeof window !== "undefined") {
          localStorage.setItem("etayo_active_clearance_ref", released.id);
        }
      } else if (typeof window !== "undefined") {
        const storedRef = localStorage.getItem("etayo_active_clearance_ref");
        const foundStored = list.find((a: any) => a.id === storedRef);
        if (foundStored && !(foundStored.status?.toLowerCase() === "released" || isApplicationReleased(foundStored))) {
          localStorage.removeItem("etayo_active_clearance_ref");
          setApprovedClearanceRef(null);
        } else if (storedRef && storedRef !== "EXEMPT") {
          setApprovedClearanceRef(storedRef);
        } else {
          setApprovedClearanceRef(null);
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
        // Find if user has an officially released Locational Clearance
        const releasedApp = (applications || []).find(
          (app: any) =>
            (app.permitType === "locational_clearance" || (app.id && app.id.startsWith("LC-"))) &&
            (app.status?.toLowerCase() === "released" || isApplicationReleased(app))
        );
        // Find if user has any active Locational Clearance (including pending/under review)
        const anyLCApp = (applications || []).find(
          (app: any) =>
            (app.permitType === "locational_clearance" || (app.id && app.id.startsWith("LC-"))) &&
            app.status !== "rejected" && app.status !== "cancelled"
        );

        const isReleased = Boolean(releasedApp);
        const clearanceRef = releasedApp?.id || (isReleased ? approvedClearanceRef : null);

        // Check if user has ALREADY submitted a connected Stage 2 application
        const connectedRef = clearanceRef || anyLCApp?.id;
        const submittedStage2 = connectedRef
          ? (applications || []).find(
              (app: any) =>
                app.id !== connectedRef &&
                !(app.permitType === "locational_clearance" || (app.id && app.id.startsWith("LC-"))) &&
                (
                  (app.locationalClearanceRef && app.locationalClearanceRef.trim().toLowerCase() === connectedRef.trim().toLowerCase()) ||
                  (anyLCApp?.projectName && app.projectName && (
                    app.projectName.toLowerCase().includes(anyLCApp.projectName.toLowerCase()) ||
                    anyLCApp.projectName.toLowerCase().includes(app.projectName.toLowerCase())
                  ))
                )
            )
          : null;

        return [
          { href: "/applicant/dashboard", label: t("dashboard", "Dashboard"), icon: Home },
          { href: "/applicant/apply", label: t("newApplication", "New Application"), icon: PlusCircle },
          { href: "/applicant/track", label: t("applicationStatus", "Application Status"), icon: ClipboardList },
          ...(submittedStage2 ? [
            {
              href: `/applicant/track/${encodeURIComponent(submittedStage2.id)}`,
              label: t("existingApplication", "Existing Application"),
              icon: FileCheck,
              badge: submittedStage2.status === "approved" || submittedStage2.status === "released" 
                ? (language === "fil" ? "Aprubado" : "Approved") 
                : (language === "fil" ? "Pagsusuri" : "Review")
            }
          ] : isReleased && clearanceRef ? [
            {
              href: `/applicant/apply?clearanceRef=${encodeURIComponent(clearanceRef)}&step=3`,
              label: t("existingApplication", "Existing Application"),
              icon: FileCheck,
              badge: "Stage 2"
            }
          ] : anyLCApp ? [
            {
              href: `/applicant/track/${encodeURIComponent(anyLCApp.id)}`,
              label: t("locationalClearance", "Locational Clearance"),
              icon: FileCheck,
              badge: anyLCApp.status?.toLowerCase() === "approved" 
                ? (language === "fil" ? "Releasing" : "Pending Release") 
                : (language === "fil" ? "Sinusuri" : "Under Review")
            }
          ] : []),
          { href: "/applicant/map", label: t("map", "Map"), icon: Map },
          { href: "/applicant/messages", label: t("messages", "Messages"), icon: MessageSquare, badge: 3 },
        ];
      }
      case "staff":
        return [
          { href: "/staff/dashboard", label: t("reviewHub", "Review Hub"), icon: FileCheck },
          { href: "/staff/templates", label: t("officialForms", "Official Forms"), icon: FileText },
          { href: "/staff/track", label: t("queryInspect", "Query & Inspect"), icon: Search },
          { href: "/staff/map", label: t("map", "Map"), icon: Map },
          { href: "/staff/messages", label: t("messages", "Messages"), icon: MessageSquare, badge: 5 },
        ];
      case "admin":
        return [
          { href: "/admin/evaluations", label: t("staffEvaluations", "Staff Evaluations"), icon: FileCheck },
          { href: "/admin/security", label: t("securityAuth", "Security & Auth"), icon: Shield },
          { href: "/admin/form-tester", label: t("formTester", "Form Testing Studio"), icon: ClipboardList },
          { href: "/staff/dashboard", label: t("reviewWorkspaces", "Review Workspaces"), icon: CheckSquare },
          { href: "/staff/templates", label: t("officialForms", "Official Forms"), icon: FileText },
          { href: "/admin/users", label: t("applicantManagement", "Applicants Management"), icon: Users },
          { href: "/admin/staff", label: t("staffManagement", "Staff Management"), icon: ShieldAlert },
          { href: "/admin/messages", label: t("messages", "Messages"), icon: MessageSquare, badge: 1 },
          { href: "/admin/settings", label: t("settings", "Settings"), icon: Settings },
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
  
  const rawDisplayName = userName || defaultNames[userRole] || "Guest";
  const displayName = rawDisplayName.includes("@") ? (defaultNames[userRole] || "User") : rawDisplayName;
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

      {/* Mobile Backdrop Overlay */}
      <div 
        className={`sidebar-backdrop ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

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
              <span className="user-role" style={{ marginTop: "2px" }}>
                {userRole === "applicant" 
                  ? (language === "fil" ? "APLIKANTE" : "APPLICANT") 
                  : userRole === "staff" 
                  ? (language === "fil" ? "KAWANI" : "STAFF") 
                  : userRole === "admin" 
                  ? "ADMIN" 
                  : (language === "fil" ? "PUBLIKO" : "PUBLIC")}
              </span>
            </div>
          </div>
          {userRole !== "public" && (
            <div style={{ flexShrink: 0 }}>
              <NotificationBell />
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">{userRole === "admin" ? t("adminPanel", "Admin Panel") : t("mainMenu", "Main Menu")}</div>
          {navItems.map((item) => {
            const isActive = (item.href.includes("clearanceRef") || (item.href.includes("/applicant/track/") && item.href !== "/applicant/track"))
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
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-signout-container">
            {/* Language Switcher Feature (Positioned directly above Sign Out button) */}
            <div className="sidebar-language-box">
              <div className="sidebar-language-header">
                <Globe size={13} className="lang-icon" />
                <span>{language === "fil" ? "Wika / Language" : "Language / Wika"}</span>
              </div>
              <div className="sidebar-language-toggle">
                <button
                  type="button"
                  className={`lang-btn ${language === "en" ? "active" : ""}`}
                  onClick={() => setLanguage("en")}
                  title="Switch to English"
                  aria-label="Switch to English"
                >
                  <span className="lang-flag-emoji">🇺🇸</span>
                  <span>English</span>
                </button>
                <button
                  type="button"
                  className={`lang-btn ${language === "fil" ? "active" : ""}`}
                  onClick={() => setLanguage("fil")}
                  title="Lumipat sa Filipino"
                  aria-label="Lumipat sa Filipino"
                >
                  <span className="lang-flag-emoji">🇵🇭</span>
                  <span>Filipino</span>
                </button>
              </div>
            </div>

            {userRole !== "public" && (
              <>
                <div className="nav-divider" style={{ margin: "8px 0" }}></div>
                
                <Link 
                  href="/"
                  className="nav-item text-danger hover-danger"
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    setUserRole("public");
                    setIsOpen(false);
                  }}
                >
                  <div className="nav-item-content">
                    <LogOut size={17} strokeWidth={2.2} />
                    <span>{t("signOut", "Sign Out")}</span>
                  </div>
                </Link>
              </>
            )}
          </div>

          <div className="sidebar-footer">
            <p>{t("stoTomasPampanga", "Sto. Tomas, Pampanga")}</p>
            <small>{t("systemFooter", "© 2026 eTAYO System")}</small>
          </div>
        </div>

      </aside>
    </>
  );
}
