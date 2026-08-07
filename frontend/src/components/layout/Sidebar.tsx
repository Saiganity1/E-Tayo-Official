"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Building2, Home, PlusCircle, Search, FileCheck, 
  MessageSquare, ShieldAlert, Map, X, Menu, Settings, LogOut, Users
} from "lucide-react";
import { usePermitContext } from "../../context/PermitContext";

export default function Sidebar() {
  const { userRole, setUserRole } = usePermitContext();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const [userName, setUserName] = useState("");
  
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

  const getNavItems = () => {
    switch (userRole) {
      case "public":
        return [
          { href: "/", label: "Home", icon: Home },
        ];
      case "applicant":
        return [
          { href: "/applicant/dashboard", label: "Dashboard", icon: Home },
          { href: "/applicant/apply", label: "New Application", icon: PlusCircle },
          { href: "/applicant/track", label: "Track Application", icon: Search },
          { href: "/applicant/map", label: "Map", icon: Map },
          { href: "/applicant/messages", label: "Messages", icon: MessageSquare, badge: 3 },
        ];
      case "staff":
        return [
          { href: "/staff/dashboard", label: "Review Hub", icon: FileCheck },
          { href: "/staff/track", label: "Query & Inspect", icon: Search },
          { href: "/staff/map", label: "Map", icon: Map },
          { href: "/staff/messages", label: "Messages", icon: MessageSquare, badge: 5 },
        ];
      case "admin":
        return [
          { href: "/admin/dashboard", label: "Admin Portal", icon: ShieldAlert },
          { href: "/staff/dashboard", label: "Review Workspaces", icon: FileCheck },
          { href: "/admin/users", label: "Applicants Management", icon: Users },
          { href: "/admin/staff", label: "Staff Management", icon: ShieldAlert },
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
          <div className="logo-group">
            <div className="logo-icon"></div>
            <h1 className="logo-text">e-Tayo</h1>
          </div>
          <button className="close-btn" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="user-profile">
          <div className="user-avatar">
            {avatarChar}
          </div>
          <div className="user-info">
            <span className="user-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayName}
            </span>
            <span className="user-role">{userRole}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Main Menu</div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => setIsOpen(false)}
              >
                <div className="nav-item-content">
                  <Icon size={18} strokeWidth={2.25} />
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
                  setUserRole("public");
                  setIsOpen(false);
                }}
              >
                <div className="nav-item-content">
                  <LogOut size={18} strokeWidth={2.25} />
                  <span>Sign Out</span>
                </div>
              </Link>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <p>Sto. Tomas, Pampanga</p>
          <small>© 2026 e-Tayo System</small>
        </div>

      </aside>
    </>
  );
}
