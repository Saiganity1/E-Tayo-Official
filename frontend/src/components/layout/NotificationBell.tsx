"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Bell, Check, CheckCheck, Inbox, FileCheck, CheckCircle2, Clock, 
  MessageSquare, AlertCircle, Building2, ChevronRight, Sparkles, ExternalLink
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

export interface ParsedNotification {
  id: number;
  category: "released" | "approved" | "review" | "message" | "alert" | "default";
  badge: {
    label: string;
    bg: string;
    color: string;
    border: string;
  };
  title: string;
  projectTag?: string;
  directMessage: string;
  timeAgo: string;
  resolvedLink: string;
  isUnread: boolean;
  raw: any;
}

/**
 * Intelligent parser that converts raw/legacy database notifications into
 * concise, direct-to-the-point actionable cards.
 */
function parseDirectNotification(notif: any): ParsedNotification {
  const rawTitle = String(notif.title || "").trim();
  const rawMsg = String(notif.message || "").trim();
  const rawType = String(notif.type || "").toUpperCase();
  const isUnread = !Boolean(notif.read || notif.isRead);

  // Safe time formatting
  let timeAgo = "recently";
  try {
    if (notif.timestamp) {
      timeAgo = formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true });
    }
  } catch (e) {
    timeAgo = "recently";
  }

  // 1. Detect category / intent
  const isMessage = rawType === "NEW_MESSAGE" || rawTitle.toLowerCase().includes("message");
  
  // Try extracting Application ID (e.g. LC-2026-7004, BP-2026-0001, APP-001)
  const appIdMatch = (rawTitle + " " + rawMsg).match(/\b(LC-\d{4}-\d+|BP-\d{4}-\d+|CO-\d{4}-\d+|APP-\d+|LC\s*\d{4}-\d+)\b/i);
  const appId = appIdMatch ? appIdMatch[1].replace(/\s+/, "-").toUpperCase() : undefined;

  // Try extracting Permit Type
  let permitType = "Permit";
  const lowerBoth = (rawTitle + " " + rawMsg).toLowerCase();
  if (lowerBoth.includes("locational") || lowerBoth.includes("zoning")) {
    permitType = "Locational Clearance";
  } else if (lowerBoth.includes("building")) {
    permitType = "Building Permit";
  } else if (lowerBoth.includes("occupancy")) {
    permitType = "Certificate of Occupancy";
  }

  // --- CASE A: MESSAGES ---
  if (isMessage) {
    let cleanTitle = "New Message from Staff";
    if (rawTitle.toLowerCase().includes("from")) {
      const fromPart = rawTitle.split(/from/i)[1]?.trim() || "";
      if (fromPart.toLowerCase().includes("admin") || fromPart.toLowerCase().includes("obo") || fromPart.toLowerCase().includes("staff")) {
        cleanTitle = "New Message from Engineering Staff";
      } else if (fromPart) {
        cleanTitle = `Message from ${fromPart.split("@")[0]}`;
      }
    }

    // Extract [Ref: ...] if present
    let projectTag = undefined;
    let directMessage = rawMsg;
    const refMatch = rawMsg.match(/\[Ref:\s*([^\]]+)\]/i);
    if (refMatch) {
      projectTag = refMatch[1].trim();
      directMessage = rawMsg.replace(/\[Ref:\s*[^\]]+\]/i, "").trim();
    }

    if (!directMessage) {
      directMessage = "You have received a new message regarding your application.";
    }

    return {
      id: notif.id,
      category: "message",
      badge: { label: "MESSAGE", bg: "#eef2ff", color: "#4f46e5", border: "#c7d2fe" },
      title: cleanTitle,
      projectTag: projectTag || (appId ? `${appId}` : undefined),
      directMessage,
      timeAgo,
      resolvedLink: notif.link || "/applicant/messages",
      isUnread,
      raw: notif
    };
  }

  // --- CASE B: APPLICATION / PERMIT UPDATES ---
  const isReleased = lowerBoth.includes("released") || lowerBoth.includes("release");
  const isApproved = !isReleased && (lowerBoth.includes("approved") || lowerBoth.includes("approve"));
  const isUnderReview = !isReleased && !isApproved && (lowerBoth.includes("under_review") || lowerBoth.includes("under review") || lowerBoth.includes("review"));
  const isRejected = lowerBoth.includes("reject") || lowerBoth.includes("action_required") || lowerBoth.includes("incomplete");

  // Extract Remarks if existing
  let extractedRemarks = "";
  const remarksMatch = rawMsg.match(/Remarks:\s*(.*)$/i);
  if (remarksMatch) {
    const candidate = remarksMatch[1].trim();
    if (candidate && candidate.toLowerCase() !== "none" && candidate.toLowerCase() !== "null") {
      extractedRemarks = candidate;
    }
  }

  // If message starts with [APP-ID] Remarks
  const bracketMatch = rawMsg.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (bracketMatch && bracketMatch[2]) {
    extractedRemarks = bracketMatch[2].trim();
  }

  if (isReleased) {
    return {
      id: notif.id,
      category: "released",
      badge: { label: "RELEASED", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
      title: `${permitType} Released`,
      projectTag: appId,
      directMessage: extractedRemarks || "Official receipt verified. Your permit is ready for download.",
      timeAgo,
      resolvedLink: appId ? `/applicant/track/${encodeURIComponent(appId)}` : (notif.link || "/applicant/track"),
      isUnread,
      raw: notif
    };
  }

  if (isApproved) {
    return {
      id: notif.id,
      category: "approved",
      badge: { label: "APPROVED", bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" },
      title: `${permitType} Approved`,
      projectTag: appId,
      directMessage: extractedRemarks || "Application approved. Order of Payment is ready for settlement.",
      timeAgo,
      resolvedLink: appId ? `/applicant/track/${encodeURIComponent(appId)}` : (notif.link || "/applicant/track"),
      isUnread,
      raw: notif
    };
  }

  if (isUnderReview) {
    return {
      id: notif.id,
      category: "review",
      badge: { label: "IN REVIEW", bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
      title: `${permitType} Under Review`,
      projectTag: appId,
      directMessage: extractedRemarks || "Municipal engineers are evaluating your submitted documents.",
      timeAgo,
      resolvedLink: appId ? `/applicant/track/${encodeURIComponent(appId)}` : (notif.link || "/applicant/track"),
      isUnread,
      raw: notif
    };
  }

  if (isRejected) {
    return {
      id: notif.id,
      category: "alert",
      badge: { label: "ACTION NEEDED", bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
      title: `Action Required: ${permitType}`,
      projectTag: appId,
      directMessage: extractedRemarks || "Please review requested changes and update your application.",
      timeAgo,
      resolvedLink: appId ? `/applicant/track/${encodeURIComponent(appId)}` : (notif.link || "/applicant/track"),
      isUnread,
      raw: notif
    };
  }

  // Fallback for generic notifications
  let cleanMsg = rawMsg.replace(/Remarks:\s*(none|null)/gi, "").trim();
  cleanMsg = cleanMsg.replace(/^Your application\s+[^\s]+\s*\([^)]*\)\s*has been updated to\s+[^\.]+\./i, "").trim();
  if (!cleanMsg) {
    cleanMsg = rawMsg;
  }

  return {
    id: notif.id,
    category: "default",
    badge: { label: "UPDATE", bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
    title: rawTitle.replace(/Application Update:\s*/i, "").replace(/Permit Update:\s*/i, "") || "Notification",
    projectTag: appId,
    directMessage: cleanMsg || "You have an update on your permit application.",
    timeAgo,
    resolvedLink: notif.link || "/applicant/track",
    isUnread,
    raw: notif
  };
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"all" | "unread">("all");
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setUserEmail(parsed.email);
        fetchNotifications(parsed.email);

        // Poll for new notifications every 20 seconds
        const interval = setInterval(() => {
          fetchNotifications(parsed.email);
        }, 20000);
        return () => clearInterval(interval);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const screenWidth = typeof window !== "undefined" ? window.innerWidth : 360;
      const dropdownWidth = Math.min(390, screenWidth - 20);
      
      let left = rect.left;
      if (left + dropdownWidth > screenWidth - 12) {
        left = Math.max(12, screenWidth - dropdownWidth - 12);
      }

      setDropdownPos({
        top: rect.bottom + 8,
        left: Math.max(10, left),
      });
    }
    setIsOpen(prev => !prev);
  };

  const fetchNotifications = async (email: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let res = await fetch(`/api/notifications/${encodeURIComponent(email)}`, {
        headers
      }).catch(() => null);

      if (!res || !res.ok) {
        const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-backend-production.up.railway.app").replace(/\/+$/, "");
        const backendUrl = rawApi.endsWith("/api") ? `${rawApi}/notifications/${encodeURIComponent(email)}` : `${rawApi}/api/notifications/${encodeURIComponent(email)}`;
        res = await fetch(backendUrl, { headers }).catch(() => null);
      }

      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          let allReadTimestamp = 0;
          let readIds: number[] = [];
          if (typeof window !== "undefined") {
            try {
              allReadTimestamp = Number(localStorage.getItem(`etayo_all_read_${email.toLowerCase().trim()}`) || 0);
              readIds = JSON.parse(localStorage.getItem(`etayo_read_notif_ids_${email.toLowerCase().trim()}`) || "[]");
            } catch (e) {}
          }

          const reconciled = data.map((n: any) => {
            const notifTime = n.timestamp ? new Date(n.timestamp).getTime() : 0;
            const isMarkedRead = Boolean(n.read || n.isRead) || readIds.includes(Number(n.id)) || (allReadTimestamp > 0 && notifTime > 0 && notifTime <= allReadTimestamp);
            if (isMarkedRead) {
              return { ...n, read: true, isRead: true };
            }
            return n;
          });

          setNotifications(reconciled);
        }
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // 1. Next.js API proxy
      fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
        headers
      }).catch(() => null);

      // 2. Direct Railway Backend
      const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-backend-production.up.railway.app").replace(/\/+$/, "");
      const backendUrl = rawApi.endsWith("/api") ? `${rawApi}/notifications/${id}/read` : `${rawApi}/api/notifications/${id}/read`;
      fetch(backendUrl, { method: "PUT", headers }).catch(() => null);

      // 3. LocalStorage Persistence
      if (typeof window !== "undefined" && userEmail) {
        try {
          const idsKey = `etayo_read_notif_ids_${userEmail.toLowerCase().trim()}`;
          const existingIds: number[] = JSON.parse(localStorage.getItem(idsKey) || "[]");
          if (!existingIds.includes(Number(id))) {
            existingIds.push(Number(id));
            localStorage.setItem(idsKey, JSON.stringify(existingIds));
          }
        } catch (e) {}
      }

      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, isRead: true } : n));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const markAllAsRead = async () => {
    if (!userEmail) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // 1. Next.js API proxy
      fetch(`/api/notifications/read-all/${encodeURIComponent(userEmail.trim())}`, {
        method: "PUT",
        headers
      }).catch(() => null);

      // 2. Direct Railway Backend
      const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-backend-production.up.railway.app").replace(/\/+$/, "");
      const backendUrl = rawApi.endsWith("/api") 
        ? `${rawApi}/notifications/read-all/${encodeURIComponent(userEmail.trim())}` 
        : `${rawApi}/api/notifications/read-all/${encodeURIComponent(userEmail.trim())}`;
      fetch(backendUrl, { method: "PUT", headers }).catch(() => null);

      // 3. LocalStorage Persistence (Instant & permanent)
      if (typeof window !== "undefined") {
        try {
          const emailKey = userEmail.toLowerCase().trim();
          localStorage.setItem(`etayo_all_read_${emailKey}`, Date.now().toString());

          const idsKey = `etayo_read_notif_ids_${emailKey}`;
          const existingIds: number[] = JSON.parse(localStorage.getItem(idsKey) || "[]");
          const currentIds = notifications.map(n => Number(n.id));
          const merged = Array.from(new Set([...existingIds, ...currentIds]));
          localStorage.setItem(idsKey, JSON.stringify(merged));
        } catch (e) {}
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleNotificationClick = (item: ParsedNotification) => {
    if (item.isUnread) {
      markAsRead(item.id);
    }
    setIsOpen(false);
    if (item.resolvedLink) {
      router.push(item.resolvedLink);
    }
  };

  // Parse all notifications into structured, direct cards
  const parsedNotifications = useMemo(() => {
    return notifications.map(parseDirectNotification);
  }, [notifications]);

  const unreadCount = parsedNotifications.filter(n => n.isUnread).length;

  const displayedNotifications = useMemo(() => {
    if (filterTab === "unread") {
      return parsedNotifications.filter(n => n.isUnread);
    }
    return parsedNotifications;
  }, [parsedNotifications, filterTab]);

  const renderCategoryIcon = (category: ParsedNotification["category"]) => {
    switch (category) {
      case "released":
        return (
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a", flexShrink: 0 }}>
            <FileCheck size={18} />
          </div>
        );
      case "approved":
        return (
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#ecfdf5", border: "1px solid #a7f3d0", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669", flexShrink: 0 }}>
            <CheckCircle2 size={18} />
          </div>
        );
      case "review":
        return (
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", flexShrink: 0 }}>
            <Clock size={18} />
          </div>
        );
      case "message":
        return (
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eef2ff", border: "1px solid #c7d2fe", display: "flex", alignItems: "center", justifyContent: "center", color: "#4f46e5", flexShrink: 0 }}>
            <MessageSquare size={18} />
          </div>
        );
      case "alert":
        return (
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", flexShrink: 0 }}>
            <AlertCircle size={18} />
          </div>
        );
      default:
        return (
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", flexShrink: 0 }}>
            <Bell size={18} />
          </div>
        );
    }
  };

  return (
    <div className="notification-bell-container" style={{ position: "relative" }}>
      <button
        ref={buttonRef}
        className="notification-trigger"
        onClick={handleToggle}
        aria-label="Notifications"
        style={{
          position: "relative",
          background: isOpen ? "#eff6ff" : "transparent",
          border: isOpen ? "1px solid #bfdbfe" : "none",
          borderRadius: "10px",
          padding: "6px 8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isOpen ? "#1d4ed8" : "#475569",
          transition: "all 0.15s ease"
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span 
            className="notification-badge"
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              background: "#ef4444",
              color: "white",
              fontSize: "0.68rem",
              fontWeight: "800",
              height: "17px",
              minWidth: "17px",
              padding: "0 4px",
              borderRadius: "999px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid white",
              boxShadow: "0 2px 6px rgba(239,68,68,0.4)"
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="notification-dropdown"
          style={{ 
            top: dropdownPos.top, 
            left: dropdownPos.left,
            position: "fixed",
            width: "min(390px, calc(100vw - 20px))",
            maxWidth: "calc(100vw - 20px)",
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            boxShadow: "0 22px 50px -10px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(226, 232, 240, 0.9)",
            zIndex: 9999,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            animation: "fadeIn 0.15s ease"
          }}
        >
          {/* HEADER */}
          <div style={{ 
            padding: "1rem 1.15rem 0.75rem 1.15rem", 
            borderBottom: "1px solid #f1f5f9",
            background: "linear-gradient(180deg, #ffffff 0%, #fcfdfe 100%)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ 
                  width: "28px", 
                  height: "28px", 
                  borderRadius: "8px", 
                  background: "#eff6ff", 
                  color: "#2563eb", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center" 
                }}>
                  <Bell size={15} />
                </div>
                <h3 style={{ fontSize: "1.02rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span style={{ 
                    background: "#eff6ff", 
                    color: "#1d4ed8", 
                    fontSize: "0.72rem", 
                    fontWeight: "800", 
                    padding: "2px 7px", 
                    borderRadius: "999px",
                    border: "1px solid #bfdbfe"
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563eb",
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    transition: "background 0.15s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  title="Mark all notifications as read"
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
            </div>

            {/* TAB SELECTORS */}
            <div style={{ display: "flex", gap: "6px", background: "#f1f5f9", padding: "3px", borderRadius: "10px" }}>
              <button
                type="button"
                onClick={() => setFilterTab("all")}
                style={{
                  flex: 1,
                  padding: "5px 0",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  borderRadius: "7px",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  background: filterTab === "all" ? "#ffffff" : "transparent",
                  color: filterTab === "all" ? "#0f172a" : "#64748b",
                  boxShadow: filterTab === "all" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
                }}
              >
                All ({parsedNotifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("unread")}
                style={{
                  flex: 1,
                  padding: "5px 0",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  borderRadius: "7px",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  background: filterTab === "unread" ? "#ffffff" : "transparent",
                  color: filterTab === "unread" ? "#1d4ed8" : "#64748b",
                  boxShadow: filterTab === "unread" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
                }}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* NOTIFICATION LIST */}
          <div 
            className="custom-scrollbar"
            style={{ 
              maxHeight: "390px", 
              overflowY: "auto",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {displayedNotifications.length === 0 ? (
              <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "#94a3b8" }}>
                <div style={{ 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "14px", 
                  background: "#f1f5f9", 
                  color: "#94a3b8", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  margin: "0 auto 0.75rem auto"
                }}>
                  <Inbox size={24} />
                </div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: "800", color: "#334155", margin: "0 0 3px 0" }}>
                  {filterTab === "unread" ? "All caught up!" : "No notifications yet"}
                </h4>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>
                  {filterTab === "unread" ? "You have no unread updates." : "Permit updates and messages will appear here."}
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => {
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "0.85rem 1.15rem",
                      borderBottom: "1px solid #f1f5f9",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      background: notif.isUnread ? "#f8faff" : "#ffffff",
                      borderLeft: notif.isUnread ? "3.5px solid #2563eb" : "3.5px solid transparent",
                      position: "relative"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = notif.isUnread ? "#f1f7ff" : "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = notif.isUnread ? "#f8faff" : "#ffffff";
                    }}
                  >
                    {/* Category Icon */}
                    {renderCategoryIcon(notif.category)}

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Top Pill & Time */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", marginBottom: "3px" }}>
                        <span style={{
                          fontSize: "0.68rem",
                          fontWeight: "800",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          padding: "1px 7px",
                          borderRadius: "999px",
                          background: notif.badge.bg,
                          color: notif.badge.color,
                          border: `1px solid ${notif.badge.border}`
                        }}>
                          {notif.badge.label}
                        </span>

                        <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                          <Clock size={10} color="#94a3b8" /> {notif.timeAgo}
                        </span>
                      </div>

                      {/* Direct Title */}
                      <h4 style={{ 
                        fontSize: "0.88rem", 
                        fontWeight: notif.isUnread ? "800" : "700", 
                        color: "#0f172a", 
                        margin: "0 0 2px 0",
                        letterSpacing: "-0.01em",
                        lineHeight: 1.3
                      }}>
                        {notif.title}
                      </h4>

                      {/* Project / Ref Tag (if available) */}
                      {notif.projectTag && (
                        <div style={{ 
                          display: "inline-flex", 
                          alignItems: "center", 
                          gap: "4px", 
                          fontSize: "0.74rem", 
                          fontWeight: "700", 
                          color: "#1d4ed8", 
                          background: "#eff6ff", 
                          padding: "1px 6px", 
                          borderRadius: "5px", 
                          marginBottom: "4px",
                          maxWidth: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          <Building2 size={11} color="#2563eb" />
                          <span>{notif.projectTag}</span>
                        </div>
                      )}

                      {/* Direct to the point Action Message */}
                      <p style={{ 
                        fontSize: "0.82rem", 
                        color: "#475569", 
                        margin: 0, 
                        lineHeight: 1.38,
                        fontWeight: "500",
                        wordBreak: "break-word"
                      }}>
                        {notif.directMessage}
                      </p>
                    </div>

                    {/* Right Chevron & Unread Dot */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", flexShrink: 0, paddingTop: "4px" }}>
                      {notif.isUnread && (
                        <span style={{ 
                          width: "8px", 
                          height: "8px", 
                          borderRadius: "50%", 
                          backgroundColor: "#2563eb",
                          boxShadow: "0 0 0 3px rgba(37,99,235,0.2)"
                        }} />
                      )}
                      <ChevronRight size={14} color="#94a3b8" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* FOOTER */}
          <div style={{ 
            padding: "0.75rem 1.15rem", 
            borderTop: "1px solid #f1f5f9", 
            background: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/applicant/track");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#1d4ed8",
                fontSize: "0.8rem",
                fontWeight: "700",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 4px"
              }}
            >
              Application Status <ExternalLink size={12} />
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/applicant/messages");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#475569",
                fontSize: "0.8rem",
                fontWeight: "700",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 4px"
              }}
            >
              Messages <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
