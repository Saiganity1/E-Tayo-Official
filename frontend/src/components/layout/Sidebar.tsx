"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  Building2, Home, PlusCircle, Search, FileCheck, 
  MessageSquare, ShieldAlert, Map, X, Menu, LogOut, Users, FileText, ClipboardList,
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
  const [currentSearch, setCurrentSearch] = useState<string>("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentSearch(window.location.search || "");
      const handleLocationChange = () => {
        setCurrentSearch(window.location.search || "");
      };
      window.addEventListener("popstate", handleLocationChange);
      return () => window.removeEventListener("popstate", handleLocationChange);
    }
  }, [pathname]);

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
          { href: "/applicant/messages", label: t("messages", "Messages"), icon: MessageSquare },
        ];
      }
      case "staff":
        return [
          { href: "/admin/evaluations", label: t("staffEvaluations", "Staff Evaluations"), icon: FileCheck },
          { href: "/staff/map", label: t("map", "Map"), icon: Map },
          { href: "/staff/messages", label: t("messages", "Messages"), icon: MessageSquare },
        ];
      case "admin":
        return [
          { href: "/admin/evaluations", label: t("staffEvaluations", "Staff Evaluations"), icon: FileCheck },
          { href: "/admin/security", label: t("securityAuth", "Security & Auth"), icon: Shield },
          { href: "/staff/templates", label: t("officialForms", "Official Forms"), icon: FileText },
          { href: "/admin/users", label: t("applicantManagement", "Applicants Management"), icon: Users },
          { href: "/admin/staff", label: t("staffManagement", "Staff Management"), icon: ShieldAlert },
          { href: "/admin/messages", label: t("messages", "Messages"), icon: MessageSquare },
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

  const getBottomNavItems = () => {
    switch (userRole) {
      case "applicant":
        return [
          { href: "/applicant/dashboard", label: language === "fil" ? "Home" : "Dashboard", icon: Home },
          { href: "/applicant/apply", label: language === "fil" ? "Apply" : "Apply", icon: PlusCircle },
          { href: "/applicant/track", label: language === "fil" ? "Status" : "Status", icon: ClipboardList },
          { href: "/applicant/map", label: language === "fil" ? "Map" : "Map", icon: Map },
          { href: "/applicant/messages", label: language === "fil" ? "Messages" : "Messages", icon: MessageSquare },
        ];
      case "staff":
        return [
          { href: "/admin/evaluations", label: language === "fil" ? "Pagsusuri" : "Evaluations", icon: FileCheck },
          { href: "/staff/map", label: language === "fil" ? "Mapa" : "Map", icon: Map },
          { href: "/staff/messages", label: language === "fil" ? "Mensahe" : "Messages", icon: MessageSquare },
        ];
      case "admin":
        return [
          { href: "/admin/evaluations", label: "Evaluations", icon: FileCheck },
          { href: "/admin/security", label: "Security", icon: Shield },
          { href: "/staff/templates", label: "Forms", icon: FileText },
          { href: "/admin/users", label: "Users", icon: Users },
          { href: "/admin/messages", label: "Messages", icon: MessageSquare },
        ];
      default:
        return [];
    }
  };

  const bottomNavItems = getBottomNavItems();

  const isBottomItemActive = (itemHref: string) => {
    const cleanPath = decodeURIComponent(pathname.split("?")[0].replace(/\/+$/, "").toLowerCase());
    const itemClean = decodeURIComponent(itemHref.split("?")[0].replace(/\/+$/, "").toLowerCase());

    if (itemClean === "/applicant/dashboard") {
      return cleanPath === "/applicant/dashboard" || cleanPath === "/applicant";
    }
    if (itemClean === "/applicant/apply") {
      return cleanPath === "/applicant/apply";
    }
    if (itemClean === "/applicant/track") {
      return cleanPath.startsWith("/applicant/track");
    }
    if (itemClean === "/applicant/map") {
      return cleanPath === "/applicant/map";
    }
    if (itemClean === "/applicant/messages") {
      return cleanPath.startsWith("/applicant/messages");
    }
    if (itemClean === "/admin/evaluations") {
      return cleanPath.startsWith("/admin/evaluations") || cleanPath.startsWith("/staff/evaluate");
    }
    if (itemClean === "/staff/messages" || itemClean === "/admin/messages") {
      return cleanPath.includes("/messages");
    }
    return cleanPath === itemClean;
  };

  return (
    <>
      {/* Mobile Sticky Top Header Bar */}
      <header className="mobile-header-bar">
        <div className="mobile-header-content">
          {/* Left side: App Logo & Municipal Branding */}
          <Link 
            href={userRole === "applicant" ? "/applicant/dashboard" : userRole === "staff" ? "/admin/evaluations" : userRole === "admin" ? "/admin/evaluations" : "/"} 
            className="mobile-header-brand"
            title="eTAYO - Sto. Tomas, Pampanga"
          >
            <Image 
              src="/logo.png" 
              alt="eTAYO" 
              width={100} 
              height={28} 
              style={{ height: "24px", width: "auto", objectFit: "contain" }} 
              priority 
            />
            <div className="mobile-header-brand-divider" />
            <div className="mobile-header-brand-text">
              <span className="mobile-header-muni">Sto. Tomas, Pampanga</span>
            </div>
          </Link>

          {/* Right side: Notification Bell & Profile / Menu Drawer Trigger */}
          <div className="mobile-header-actions">
            {userRole !== "public" && (
              <div className="mobile-header-bell">
                <NotificationBell />
              </div>
            )}
            
            <button 
              type="button" 
              className="mobile-header-profile-btn"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle Menu Drawer"
              title={displayName}
            >
              <div className="mobile-header-avatar">
                {avatarChar}
              </div>
              <span className="mobile-header-name">
                {displayName.split(" ")[0]}
              </span>
              <Menu size={18} className="mobile-header-menu-icon" />
            </button>
          </div>
        </div>
      </header>

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
            const cleanPath = decodeURIComponent(pathname.split("?")[0].replace(/\/+$/, "").toLowerCase());
            const itemClean = decodeURIComponent(item.href.split("?")[0].replace(/\/+$/, "").toLowerCase());

            const effectiveSearch = typeof window !== "undefined" ? (window.location.search || currentSearch) : currentSearch;
            const hasClearanceRefQuery = effectiveSearch.includes("clearanceRef");

            const hasDedicatedTrackItem = navItems.some((nav) => {
              if (nav.href.startsWith("/applicant/track/") && nav.href !== "/applicant/track") {
                const navClean = decodeURIComponent(nav.href.split("?")[0].replace(/\/+$/, "").toLowerCase());
                return cleanPath === navClean;
              }
              return false;
            });

            let isActive = false;
            if (item.href.includes("clearanceRef")) {
              isActive = cleanPath === "/applicant/apply" && hasClearanceRefQuery;
            } else if (item.href === "/applicant/apply") {
              isActive = cleanPath === "/applicant/apply" && !hasClearanceRefQuery;
            } else if (item.href.startsWith("/applicant/track/") && item.href !== "/applicant/track") {
              isActive = cleanPath === itemClean;
            } else if (item.href === "/applicant/track") {
              isActive = cleanPath === "/applicant/track" || (cleanPath.startsWith("/applicant/track/") && !hasDedicatedTrackItem);
            } else {
              isActive = cleanPath === itemClean;
            }

            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  setIsOpen(false);
                  if (item.href.includes("?")) {
                    setCurrentSearch("?" + item.href.split("?")[1]);
                  } else {
                    setCurrentSearch("");
                  }
                }}
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
                    localStorage.removeItem("etayo_submitted_app_ids");
                    localStorage.removeItem("etayo_active_clearance_ref");
                    localStorage.removeItem("etayo_cached_applications");
                    localStorage.removeItem("etayo_last_submitted_id");
                    localStorage.removeItem("etayo_archived_application_ids");
                    localStorage.removeItem("etayo_unread_messages_count");
                    localStorage.removeItem("etayo_notifications");
                    localStorage.removeItem("etayo_messages_history");
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

      {/* Mobile Fixed Bottom Navigation Bar */}
      {bottomNavItems.length > 0 && (
        <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
          <div className="mobile-bottom-nav-inner">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const active = isBottomItemActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mobile-bottom-nav-item ${active ? "active" : ""}`}
                  title={item.label}
                >
                  <div className="mobile-bottom-nav-icon-wrapper">
                    <Icon size={20} strokeWidth={active ? 2.5 : 1.9} />
                  </div>
                  <span className="mobile-bottom-nav-label">{item.label}</span>
                  {active && <span className="mobile-bottom-nav-indicator" />}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
