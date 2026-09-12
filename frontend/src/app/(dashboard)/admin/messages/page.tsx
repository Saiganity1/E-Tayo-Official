"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Send, User, Clock, Inbox, MessageSquare, Paperclip, X, Search, 
  ShieldCheck, Landmark, CheckCircle2, ChevronRight, Phone, Info, 
  AlertCircle, Building2, MapPin, RefreshCw, BadgeCheck, ExternalLink, 
  Layers, Filter, FileText, Check, ChevronDown, ChevronUp, Sparkles,
  Briefcase, Activity, Calendar, ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { Client } from "@stomp/stompjs";
import { format } from "date-fns";
import { usePermitContext } from "../../../../context/PermitContext";
import { 
  MessageBubbleContent, 
  AttachmentPreviewModal, 
  ParsedAttachment 
} from "../../../../components/chat/ChatAttachmentRenderer";

// Canned official municipal responses for fast staff dispatch
const CANNED_RESPONSES = [
  {
    id: "docs_received",
    label: "📋 Documents Verified",
    text: "Good day. We have received your submitted permit requirements. They are currently queued for technical evaluation by the zoning and building officers."
  },
  {
    id: "inspection_sched",
    label: "🔍 Inspection Notice",
    text: "Notice: An on-site municipal engineering and zoning inspection has been scheduled for your property. Please ensure property access is available."
  },
  {
    id: "deficiency",
    label: "⚠️ Incomplete Items",
    text: "Please be advised that your application requires additional ancillary documentation. Please review the deficiency remarks and upload the requested certified files."
  },
  {
    id: "approved",
    label: "✅ Clearance Approved",
    text: "Good news! Your Locational Clearance has been approved by the Zoning Administrator and endorsed for Order of Payment processing."
  },
  {
    id: "payment",
    label: "💳 Payment Ready",
    text: "Your permit fee assessment has been completed. The official Order of Payment is now available. You may proceed with settlement at the Municipal Treasury."
  }
];

export default function AdminMessagesPage() {
  const { applications, refreshApplications } = usePermitContext();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserName, setCurrentUserName] = useState("Super Admin");
  const [connected, setConnected] = useState(false);
  const [applicantEmail, setApplicantEmail] = useState<string | null>(null);
  const [contacts, setContacts] = useState<string[]>([]);
  const [previewAttachment, setPreviewAttachment] = useState<ParsedAttachment | null>(null);
  const [adminAttachedFile, setAdminAttachedFile] = useState<{ name: string; url: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter in Contacts
  const [searchContact, setSearchContact] = useState("");
  const [contactFilter, setContactFilter] = useState<"all" | "with_permits">("all");

  // Thread Categorization within Selected Applicant's Chat
  const [activeThreadId, setActiveThreadId] = useState<string>("all");

  // Collapsible Dossier Sidebar
  const [showDossier, setShowDossier] = useState(true);

  const adminFileInputRef = useRef<HTMLInputElement>(null);
  const stompClient = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to extract thread/application ID from message
  const getMessageThreadId = (msg: any): string => {
    if (msg.applicationId && msg.applicationId !== "all" && msg.applicationId !== "") {
      return msg.applicationId;
    }
    const content = msg.content || "";
    // Match [Ref: LC-2026-4157# - Sicat] or [Ref: LC-2026-4157]
    const refMatch = content.match(/\[Ref:\s*([^\]\-#]+)(?:#)?(?:\s*-\s*([^\]]+))?\]/i);
    if (refMatch) {
      const matchedId = refMatch[1].trim();
      if (matchedId.toLowerCase() === "general") return "general";
      return matchedId;
    }
    // Check if content matches any known permit ID from applications
    for (const app of applications) {
      if (content.includes(app.id)) {
        return app.id;
      }
    }
    return "general";
  };

  // Helper to resolve applicant metadata from applications
  const getApplicantData = (email: string) => {
    const matchingApps = applications.filter(
      a => a.applicantEmail && a.applicantEmail.toLowerCase() === email.toLowerCase()
    );
    const primaryApp = matchingApps[0];
    const name = primaryApp?.applicantName || email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const phone = primaryApp?.applicantPhone || "Not provided";
    const address = primaryApp?.applicantAddress || primaryApp?.projectAddress || "Santo Tomas, Pampanga";
    return {
      name,
      phone,
      address,
      applications: matchingApps,
      latestStatus: primaryApp?.status || null
    };
  };

  // Fetch unique conversations on load
  const loadConversations = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/messages/conversations?user=staff@etayo.gov.ph`);
      if (res.ok) {
        const data = await res.json();
        const serverContacts = data.filter((c: string) => c !== "staff@etayo.gov.ph");
        
        // Also include applicants who have applications in the system
        const appApplicants = Array.from(
          new Set(
            applications
              .map(a => a.applicantEmail?.toLowerCase())
              .filter((e): e is string => Boolean(e) && e !== "staff@etayo.gov.ph")
          )
        );

        const merged = Array.from(new Set([...serverContacts, ...appApplicants]));
        setContacts(merged);

        // If no applicant currently selected, select the first one with messages or apps
        if (!applicantEmail && merged.length > 0) {
          setApplicantEmail(merged[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [applications.length]);

  // STOMP WebSocket initialization
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUserEmail(parsedUser.email || "admin@etayo.gov.ph");
        if (parsedUser.name) setCurrentUserName(parsedUser.name);

        let wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";
        if (typeof window !== "undefined" && window.location.protocol === "https:") {
          wsUrl = wsUrl.replace("ws://", "wss://");
        }
        if (!wsUrl.endsWith("/ws")) {
          wsUrl = wsUrl.replace(/\/$/, "") + "/ws";
        }

        const client = new Client({
          brokerURL: wsUrl,
          reconnectDelay: 5000,
          onConnect: () => {
            console.log("Admin connected to STOMP WebSocket");
            setConnected(true);

            const handleIncomingMessage = (message: any) => {
              const receivedMessage = JSON.parse(message.body);
              const sender = receivedMessage.senderEmail;
              const recipient = receivedMessage.recipientEmail;

              if (sender !== "staff@etayo.gov.ph") {
                setContacts(prev => prev.includes(sender) ? prev : [sender, ...prev]);
              } else if (recipient !== "staff@etayo.gov.ph") {
                setContacts(prev => prev.includes(recipient) ? prev : [recipient, ...prev]);
              }

              setApplicantEmail(currentApplicant => {
                if (sender === currentApplicant || (sender === "staff@etayo.gov.ph" && recipient === currentApplicant)) {
                  setMessages(prev => {
                    const exists = prev.find(m => m.id === receivedMessage.id);
                    if (exists) return prev;
                    return [...prev, receivedMessage];
                  });
                }
                return currentApplicant;
              });
            };

            client.subscribe(`/topic/messages/${parsedUser.email}`, handleIncomingMessage);
            if (parsedUser.email !== "staff@etayo.gov.ph") {
              client.subscribe(`/topic/messages/staff@etayo.gov.ph`, handleIncomingMessage);
            }
          },
          onStompError: frame => {
            console.error("Broker reported error: " + frame.headers["message"]);
          },
          onWebSocketClose: () => {
            setConnected(false);
          }
        });

        client.activate();
        stompClient.current = client;
      } catch (err) {
        console.error("Error setting up WebSocket client:", err);
      }
    }

    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
  }, []);

  // Fetch chat history whenever selected applicant changes
  useEffect(() => {
    if (applicantEmail) {
      const staffInbox = "staff@etayo.gov.ph";
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/messages/history?user1=${staffInbox}&user2=${applicantEmail}`)
        .then(res => res.json())
        .then(data => {
          setMessages(Array.isArray(data) ? data : []);
          setActiveThreadId("all"); // Reset filter to all messages on contact switch
        })
        .catch(err => {
          console.error("Failed to load history", err);
          setMessages([]);
        });
    }
  }, [applicantEmail]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeThreadId]);

  // Handle Admin File Attachment
  const handleAdminFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      try {
        localStorage.setItem(`att_${file.name}`, dataUrl);
      } catch (err) {}
      setAdminAttachedFile({ name: file.name, url: "" });
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("files", file);
    formData.append("permitType", "Admin Official Dispatch");
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const uploadHeaders: Record<string, string> = {};
    if (token) uploadHeaders["Authorization"] = `Bearer ${token}`;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/upload`, {
      method: "POST",
      headers: uploadHeaders,
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.urls && data.urls[0]) {
          setAdminAttachedFile({ name: file.name, url: data.urls[0] });
        }
      })
      .catch(err => console.error("Upload error", err));
  };

  // Send Message
  const sendMessage = (e?: React.FormEvent, cannedText?: string) => {
    if (e) e.preventDefault();
    let textToSend = (cannedText || inputMessage).trim();
    if (!textToSend && !adminAttachedFile) return;

    // If a specific thread (permit ID) is selected, tag the message content so applicant knows which permit it refers to
    const selectedApp = applications.find(a => a.id === activeThreadId);
    let taggedContent = textToSend;
    if (activeThreadId !== "all" && activeThreadId !== "general" && !textToSend.includes(`[Ref: ${activeThreadId}`)) {
      const tagLabel = selectedApp ? `${activeThreadId} - ${selectedApp.projectName}` : activeThreadId;
      taggedContent = `[Ref: ${tagLabel}] ${textToSend}`;
    }

    if (adminAttachedFile) {
      taggedContent = taggedContent 
        ? `${taggedContent} [Attachment: ${adminAttachedFile.name}|${adminAttachedFile.url}]`
        : `[Attachment: ${adminAttachedFile.name}|${adminAttachedFile.url}]`;
    }

    if (stompClient.current && connected && applicantEmail) {
      const chatMessage = {
        senderEmail: "staff@etayo.gov.ph",
        actualSender: currentUserEmail,
        recipientEmail: applicantEmail,
        content: taggedContent,
        applicationId: activeThreadId !== "all" && activeThreadId !== "general" ? activeThreadId : null
      };

      stompClient.current.publish({
        destination: "/app/chat.sendMessage",
        body: JSON.stringify(chatMessage)
      });

      // Optimistic append
      setMessages(prev => [
        ...prev,
        {
          id: `admin-${Date.now()}`,
          senderEmail: "staff@etayo.gov.ph",
          actualSender: currentUserEmail,
          recipientEmail: applicantEmail,
          content: taggedContent,
          applicationId: activeThreadId !== "all" && activeThreadId !== "general" ? activeThreadId : null,
          timestamp: new Date().toISOString()
        }
      ]);

      setInputMessage("");
      setAdminAttachedFile(null);
    }
  };

  const getValidDate = (ts: any) => {
    if (!ts) return new Date();
    if (typeof ts === "string" && !ts.endsWith("Z")) {
      return new Date(ts + "Z");
    }
    return new Date(ts);
  };

  // Selected applicant metadata
  const selectedApplicantData = useMemo(() => {
    if (!applicantEmail) return null;
    return getApplicantData(applicantEmail);
  }, [applicantEmail, applications]);

  // Compute all available threads for the active applicant
  const applicantThreads = useMemo(() => {
    if (!selectedApplicantData) return { allCount: 0, generalCount: 0, threads: [] };
    const threadMap = new Map<string, { id: string; title: string; count: number; status?: string }>();

    // Add applicant's registered permits from context
    selectedApplicantData.applications.forEach(app => {
      threadMap.set(app.id, {
        id: app.id,
        title: `${app.id} · ${app.projectName || "Permit"}`,
        count: 0,
        status: app.status
      });
    });

    // Also scan messages for any references or general tag
    let generalCount = 0;
    messages.forEach(msg => {
      const threadId = getMessageThreadId(msg);
      if (threadId === "general") {
        generalCount++;
      } else if (threadMap.has(threadId)) {
        threadMap.get(threadId)!.count++;
      } else {
        threadMap.set(threadId, {
          id: threadId,
          title: threadId,
          count: 1
        });
      }
    });

    const threadList = Array.from(threadMap.values());
    return {
      allCount: messages.length,
      generalCount,
      threads: threadList
    };
  }, [selectedApplicantData, messages]);

  // Filter messages according to activeThreadId
  const filteredMessages = useMemo(() => {
    if (activeThreadId === "all") return messages;
    return messages.filter(msg => {
      const msgThread = getMessageThreadId(msg);
      return msgThread === activeThreadId;
    });
  }, [messages, activeThreadId]);

  // Filter contacts list by search and category
  const filteredContacts = useMemo(() => {
    return contacts.filter(email => {
      const data = getApplicantData(email);
      const s = searchContact.toLowerCase();
      const matchesSearch = 
        email.toLowerCase().includes(s) ||
        data.name.toLowerCase().includes(s) ||
        data.applications.some(a => a.id.toLowerCase().includes(s) || a.projectName?.toLowerCase().includes(s));

      if (!matchesSearch) return false;

      if (contactFilter === "with_permits") {
        return data.applications.length > 0;
      }
      return true;
    });
  }, [contacts, searchContact, contactFilter, applications]);

  // Status badge config
  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case "approved":
      case "released":
        return { label: "Approved", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" };
      case "under_review":
        return { label: "Under Review", bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" };
      case "incomplete_requirements":
        return { label: "Needs Revision", bg: "#fffbeb", color: "#d97706", border: "#fde68a" };
      case "rejected":
        return { label: "Disapproved", bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
      default:
        return { label: "Pending", bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" };
    }
  };

  return (
    <div className="admin-messages-container animate-fade-in-up" style={{ maxWidth: "1600px", margin: "0 auto", paddingBottom: "2rem" }}>
      
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE MUNICIPAL BANNER & HEADER */}
      {/* ========================================================================= */}
      <header className="page-header" style={{
        marginBottom: "1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "1.25rem",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "1.75rem 2rem",
        borderRadius: "24px",
        boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.2)",
        color: "white"
      }}>
        <div style={{ maxWidth: "720px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{
              background: "rgba(59, 130, 246, 0.2)",
              color: "#93c5fd",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              border: "1px solid rgba(147, 197, 253, 0.3)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <Landmark size={12} /> Sto. Tomas OBO Administration
            </span>
            <span style={{
              background: "rgba(34, 197, 94, 0.2)",
              color: "#86efac",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: "700",
              border: "1px solid rgba(134, 239, 172, 0.3)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <span style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: connected ? "#22c55e" : "#ef4444",
                boxShadow: connected ? "0 0 8px #22c55e" : "none"
              }} />
              {connected ? "Gateway Online · Live Dispatch" : "Reconnecting STOMP..."}
            </span>
          </div>

          <h1 style={{ fontSize: "2rem", fontWeight: "800", margin: "0 0 6px 0", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <MessageSquare size={30} color="#60a5fa" /> Permitting Communications Desk
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
            Official municipal dispatch console for citizen inquiries, requirements verification, and inspection coordination.
          </p>
        </div>

        {/* Quick KPI Stats & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            padding: "10px 16px",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <div style={{ background: "rgba(59, 130, 246, 0.25)", color: "#60a5fa", padding: "8px", borderRadius: "10px" }}>
              <User size={18} />
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase" }}>Active Citizens</div>
              <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "#ffffff" }}>{contacts.length}</div>
            </div>
          </div>

          <div style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            padding: "10px 16px",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <div style={{ background: "rgba(16, 185, 129, 0.25)", color: "#34d399", padding: "8px", borderRadius: "10px" }}>
              <FileText size={18} />
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase" }}>Total Permits</div>
              <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "#ffffff" }}>{applications.length}</div>
            </div>
          </div>

          <button
            onClick={() => {
              loadConversations();
              refreshApplications();
            }}
            disabled={isRefreshing}
            style={{
              background: "white",
              border: "none",
              color: "#0f172a",
              padding: "11px 18px",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "700",
              fontSize: "0.88rem",
              cursor: isRefreshing ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              transition: "all 0.2s"
            }}
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} color="#2563eb" />
            Sync Desk
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN 3-COLUMN DESK LAYOUT */}
      {/* ========================================================================= */}
      <div style={{
        display: "grid",
        gridTemplateColumns: showDossier ? "340px 1fr 340px" : "340px 1fr",
        gap: "1.5rem",
        height: "calc(100vh - 270px)",
        minHeight: "680px"
      }}>
        
        {/* ======================================================================= */}
        {/* LEFT COLUMN: CITIZEN DIRECTORY & SEARCH */}
        {/* ======================================================================= */}
        <div style={{
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px -4px rgba(0, 0, 0, 0.05)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          {/* Directory Header & Search */}
          <div style={{ padding: "1.25rem", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MessageSquare size={18} color="#2563eb" />
                <h2 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>Citizen Inquiries</h2>
              </div>
              <span style={{
                background: "#eff6ff",
                color: "#2563eb",
                fontSize: "0.75rem",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "12px",
                border: "1px solid #bfdbfe"
              }}>
                {filteredContacts.length} Active
              </span>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="text"
                value={searchContact}
                onChange={e => setSearchContact(e.target.value)}
                placeholder="Search citizen, email, or permit #..."
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 34px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  fontSize: "0.85rem",
                  color: "#0f172a",
                  outline: "none"
                }}
              />
              {searchContact && (
                <button
                  onClick={() => setSearchContact("")}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Filter Pills */}
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => setContactFilter("all")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                  background: contactFilter === "all" ? "#2563eb" : "#f1f5f9",
                  color: contactFilter === "all" ? "#ffffff" : "#64748b",
                  transition: "all 0.15s"
                }}
              >
                All
              </button>
              <button
                onClick={() => setContactFilter("with_permits")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                  background: contactFilter === "with_permits" ? "#2563eb" : "#f1f5f9",
                  color: contactFilter === "with_permits" ? "#ffffff" : "#64748b",
                  transition: "all 0.15s"
                }}
              >
                With Active Permits
              </button>
            </div>
          </div>

          {/* Directory Contact List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredContacts.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
                <Inbox size={36} style={{ margin: "0 auto 10px auto", opacity: 0.5 }} />
                <p style={{ fontSize: "0.9rem", fontWeight: "600", margin: "0 0 4px 0" }}>No conversations found</p>
                <p style={{ fontSize: "0.78rem", margin: 0 }}>Try clearing the search query.</p>
              </div>
            ) : (
              filteredContacts.map((email, idx) => {
                const data = getApplicantData(email);
                const isSelected = applicantEmail?.toLowerCase() === email.toLowerCase();
                const latestBadge = getStatusBadge(data.latestStatus);

                return (
                  <div
                    key={idx}
                    onClick={() => setApplicantEmail(email)}
                    style={{
                      padding: "12px",
                      borderRadius: "14px",
                      cursor: "pointer",
                      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      background: isSelected ? "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" : "#ffffff",
                      border: isSelected ? "1.5px solid #60a5fa" : "1px solid #f1f5f9",
                      boxShadow: isSelected ? "0 4px 12px rgba(37, 99, 235, 0.1)" : "0 1px 3px rgba(0,0,0,0.02)",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      position: "relative"
                    }}
                  >
                    {/* Active Stripe Indicator */}
                    {isSelected && (
                      <div style={{
                        position: "absolute",
                        left: "0",
                        top: "12px",
                        bottom: "12px",
                        width: "4px",
                        background: "#2563eb",
                        borderRadius: "0 4px 4px 0"
                      }} />
                    )}

                    {/* Avatar with Initials */}
                    <div style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: isSelected 
                        ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" 
                        : "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)",
                      color: isSelected ? "#ffffff" : "#334155",
                      fontWeight: "800",
                      fontSize: "1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: isSelected ? "0 2px 8px rgba(37, 99, 235, 0.3)" : "none"
                    }}>
                      {data.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Contact Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", marginBottom: "2px" }}>
                        <p style={{
                          margin: 0,
                          fontSize: "0.9rem",
                          fontWeight: "700",
                          color: isSelected ? "#1e40af" : "#0f172a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}>
                          {data.name}
                        </p>
                        {data.applications.length > 0 && (
                          <span style={{
                            fontSize: "0.68rem",
                            fontWeight: "700",
                            background: isSelected ? "#ffffff" : "#eff6ff",
                            color: "#2563eb",
                            padding: "2px 6px",
                            borderRadius: "8px",
                            border: "1px solid #bfdbfe",
                            flexShrink: 0
                          }}>
                            {data.applications.length} {data.applications.length === 1 ? "Permit" : "Permits"}
                          </span>
                        )}
                      </div>

                      <p style={{
                        margin: "0 0 6px 0",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {email}
                      </p>

                      {/* Primary Application Tag Pill if available */}
                      {data.applications.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{
                            fontSize: "0.68rem",
                            fontWeight: "600",
                            background: latestBadge.bg,
                            color: latestBadge.color,
                            border: `1px solid ${latestBadge.border}`,
                            padding: "1px 6px",
                            borderRadius: "6px"
                          }}>
                            {data.applications[0].id} · {latestBadge.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* CENTER COLUMN: LIVE CHAT AREA & THREAD CATEGORIZATION */}
        {/* ======================================================================= */}
        <div style={{
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px -4px rgba(0, 0, 0, 0.05)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0
        }}>
          {!applicantEmail || !selectedApplicantData ? (
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "3rem",
              textAlign: "center",
              background: "radial-gradient(circle at 50% 30%, #f8fafc 0%, #ffffff 70%)"
            }}>
              <div style={{
                width: "72px",
                height: "72px",
                borderRadius: "24px",
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1.25rem",
                boxShadow: "0 8px 16px -4px rgba(37, 99, 235, 0.15)"
              }}>
                <Landmark size={36} />
              </div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: "800", color: "#0f172a", margin: "0 0 8px 0" }}>
                Santo Tomas Permitting Helpdesk
              </h2>
              <p style={{ fontSize: "0.92rem", color: "#64748b", maxWidth: "420px", margin: "0 0 1.5rem 0", lineHeight: 1.5 }}>
                Select an applicant from the left directory to review their permit inquiries, view uploaded blueprints, and dispatch official notices.
              </p>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#f1f5f9",
                padding: "8px 16px",
                borderRadius: "12px",
                fontSize: "0.82rem",
                color: "#475569",
                fontWeight: "600"
              }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: connected ? "#22c55e" : "#ef4444" }} />
                {connected ? "Gateway Online · Ready for Communications" : "Reconnecting STOMP Service..."}
              </div>
            </div>
          ) : (
            <>
              {/* Top Chat Header */}
              <div style={{
                padding: "1rem 1.5rem",
                borderBottom: "1px solid #f1f5f9",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "800",
                    fontSize: "1.1rem",
                    boxShadow: "0 4px 10px rgba(37, 99, 235, 0.2)"
                  }}>
                    {selectedApplicantData.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h2 style={{ fontSize: "1.08rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                        {selectedApplicantData.name}
                      </h2>
                      <span style={{
                        background: "#ecfdf5",
                        color: "#059669",
                        fontSize: "0.72rem",
                        fontWeight: "700",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        <BadgeCheck size={12} /> Verified Citizen
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "2px" }}>
                      <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{applicantEmail}</span>
                      <span style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>•</span>
                      <span style={{
                        fontSize: "0.75rem",
                        color: connected ? "#16a34a" : "#dc2626",
                        fontWeight: "600",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: connected ? "#22c55e" : "#ef4444" }} />
                        {connected ? "Active Session" : "Offline"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Header Action: Toggle Dossier Inspector */}
                <button
                  onClick={() => setShowDossier(prev => !prev)}
                  style={{
                    background: showDossier ? "#eff6ff" : "#f8fafc",
                    border: showDossier ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                    color: showDossier ? "#2563eb" : "#475569",
                    padding: "8px 14px",
                    borderRadius: "12px",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                  title="Toggle Applicant & Permit Dossier"
                >
                  <Briefcase size={15} />
                  <span>Permit Dossier</span>
                  {selectedApplicantData.applications.length > 0 && (
                    <span style={{
                      background: showDossier ? "#2563eb" : "#e2e8f0",
                      color: showDossier ? "#ffffff" : "#475569",
                      padding: "1px 6px",
                      borderRadius: "10px",
                      fontSize: "0.7rem",
                      fontWeight: "800"
                    }}>
                      {selectedApplicantData.applications.length}
                    </span>
                  )}
                </button>
              </div>

              {/* =============================================================== */}
              {/* APPLICATION THREAD CATEGORIZATION FILTER BAR */}
              {/* =============================================================== */}
              <div style={{
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                padding: "8px 1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                overflowX: "auto"
              }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px", marginRight: "4px" }}>
                  <Filter size={13} /> Thread:
                </span>

                {/* All Messages Tab */}
                <button
                  onClick={() => setActiveThreadId("all")}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "20px",
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    border: activeThreadId === "all" ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                    background: activeThreadId === "all" ? "#2563eb" : "#ffffff",
                    color: activeThreadId === "all" ? "#ffffff" : "#475569",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s"
                  }}
                >
                  <Layers size={13} /> All Messages ({applicantThreads.allCount})
                </button>

                {/* Individual Permit Threads */}
                {applicantThreads.threads.map(thread => {
                  const isActive = activeThreadId === thread.id;
                  const statusBadge = getStatusBadge(thread.status);
                  return (
                    <button
                      key={thread.id}
                      onClick={() => setActiveThreadId(thread.id)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "20px",
                        fontSize: "0.78rem",
                        fontWeight: "700",
                        border: isActive ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                        background: isActive ? "#2563eb" : "#ffffff",
                        color: isActive ? "#ffffff" : "#475569",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        whiteSpace: "nowrap",
                        transition: "all 0.15s"
                      }}
                    >
                      <Building2 size={13} />
                      <span>{thread.title}</span>
                      {thread.count > 0 && (
                        <span style={{
                          background: isActive ? "rgba(255, 255, 255, 0.25)" : "#eff6ff",
                          color: isActive ? "#ffffff" : "#2563eb",
                          fontSize: "0.7rem",
                          padding: "1px 6px",
                          borderRadius: "10px"
                        }}>
                          {thread.count}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* General Inquiries Tab if general messages exist */}
                {applicantThreads.generalCount > 0 && (
                  <button
                    onClick={() => setActiveThreadId("general")}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "20px",
                      fontSize: "0.78rem",
                      fontWeight: "700",
                      border: activeThreadId === "general" ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                      background: activeThreadId === "general" ? "#2563eb" : "#ffffff",
                      color: activeThreadId === "general" ? "#ffffff" : "#475569",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s"
                    }}
                  >
                    <MessageSquare size={13} /> General Inquiries ({applicantThreads.generalCount})
                  </button>
                )}
              </div>

              {/* Active Thread Notice Banner */}
              {activeThreadId !== "all" && (
                <div style={{
                  background: "#eff6ff",
                  borderBottom: "1px solid #bfdbfe",
                  padding: "6px 1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.78rem",
                  color: "#1e40af"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Info size={14} />
                    <span>
                      Viewing thread for <strong>{activeThreadId}</strong>. Responses sent will automatically carry this permit reference.
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveThreadId("all")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#2563eb",
                      fontWeight: "700",
                      cursor: "pointer",
                      fontSize: "0.75rem"
                    }}
                  >
                    View All
                  </button>
                </div>
              )}

              {/* =============================================================== */}
              {/* MESSAGES SCROLL FEED */}
              {/* =============================================================== */}
              <div style={{
                flex: 1,
                overflowY: "auto",
                padding: "1.5rem",
                background: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)",
                backgroundSize: "24px 24px"
              }}>
                {filteredMessages.length === 0 ? (
                  <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                    padding: "2rem"
                  }}>
                    <Clock size={36} style={{ marginBottom: "8px", opacity: 0.5 }} />
                    <p style={{ fontSize: "0.95rem", fontWeight: "700", margin: "0 0 4px 0", color: "#475569" }}>
                      No messages in this category
                    </p>
                    <p style={{ fontSize: "0.82rem", margin: 0 }}>
                      {activeThreadId === "all"
                        ? "Say hello or send an official update using the composer below."
                        : `No messages currently tagged for ${activeThreadId}.`}
                    </p>
                  </div>
                ) : (
                  filteredMessages.map((msg, idx) => {
                    const isMe = msg.senderEmail === currentUserEmail || msg.senderEmail === "staff@etayo.gov.ph";
                    const msgThreadId = getMessageThreadId(msg);

                    return (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: isMe ? "flex-end" : "flex-start",
                          width: "100%"
                        }}
                      >
                        <div style={{
                          maxWidth: "75%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isMe ? "flex-end" : "flex-start"
                        }}>
                          {/* Sender Identity Pill */}
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            marginBottom: "4px",
                            fontSize: "0.72rem",
                            fontWeight: "700",
                            color: isMe ? "#1d4ed8" : "#475569"
                          }}>
                            {isMe ? (
                              <>
                                <span style={{
                                  background: "#eff6ff",
                                  color: "#1d4ed8",
                                  padding: "2px 8px",
                                  borderRadius: "8px",
                                  border: "1px solid #bfdbfe",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}>
                                  <ShieldCheck size={11} /> Sto. Tomas OBO Dispatch
                                </span>
                                {msg.actualSender && (
                                  <span style={{ color: "#64748b" }}>
                                    ({msg.actualSender.split("@")[0]})
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <span>{selectedApplicantData.name}</span>
                                {msgThreadId !== "general" && (
                                  <span
                                    onClick={() => setActiveThreadId(msgThreadId)}
                                    style={{
                                      background: "#e0e7ff",
                                      color: "#3730a3",
                                      padding: "1px 6px",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      fontSize: "0.68rem"
                                    }}
                                    title="Click to filter by this permit thread"
                                  >
                                    Ref: {msgThreadId}
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          {/* Bubble Container */}
                          <div style={{
                            padding: "0.9rem 1.15rem",
                            borderRadius: isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                            background: isMe
                              ? "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)"
                              : "#ffffff",
                            color: isMe ? "#ffffff" : "#0f172a",
                            boxShadow: isMe
                              ? "0 4px 14px rgba(37, 99, 235, 0.25)"
                              : "0 2px 8px rgba(0, 0, 0, 0.05)",
                            border: isMe ? "none" : "1px solid #e2e8f0"
                          }}>
                            <MessageBubbleContent
                              content={msg.content}
                              isMe={isMe}
                              onOpenAttachment={att => setPreviewAttachment(att)}
                            />

                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              gap: "4px",
                              marginTop: "6px",
                              fontSize: "0.68rem",
                              color: isMe ? "rgba(255, 255, 255, 0.8)" : "#94a3b8"
                            }}>
                              <Clock size={10} />
                              <span>{format(getValidDate(msg.timestamp), "h:mm a · MMM d")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* =============================================================== */}
              {/* CANNED OFFICIAL RESPONSES STRIP */}
              {/* =============================================================== */}
              <div style={{
                padding: "8px 1.25rem",
                background: "#ffffff",
                borderTop: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                overflowX: "auto"
              }}>
                <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                  <Sparkles size={12} color="#f59e0b" /> Quick Reply:
                </span>
                {CANNED_RESPONSES.map(canned => (
                  <button
                    key={canned.id}
                    onClick={() => setInputMessage(canned.text)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "10px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      color: "#334155",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "#eff6ff";
                      e.currentTarget.style.borderColor = "#bfdbfe";
                      e.currentTarget.style.color = "#1d4ed8";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "#f8fafc";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.color = "#334155";
                    }}
                    title={canned.text}
                  >
                    {canned.label}
                  </button>
                ))}
              </div>

              {/* Attachment Preview Pill if admin selected a file */}
              {adminAttachedFile && (
                <div style={{
                  padding: "6px 1.25rem",
                  background: "#eff6ff",
                  borderTop: "1px solid #bfdbfe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.8rem",
                  color: "#1e40af"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Paperclip size={14} />
                    <span>Attached Document: <strong>{adminAttachedFile.name}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdminAttachedFile(null)}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Input Area */}
              <div style={{
                padding: "1rem 1.25rem",
                background: "#ffffff",
                borderTop: "1px solid #e2e8f0"
              }}>
                <form
                  onSubmit={e => sendMessage(e)}
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <input
                    type="file"
                    ref={adminFileInputRef}
                    style={{ display: "none" }}
                    onChange={handleAdminFileSelect}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <button
                    type="button"
                    onClick={() => adminFileInputRef.current?.click()}
                    title="Attach Blueprint or Municipal Document"
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      color: "#475569",
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"}
                    onMouseLeave={e => e.currentTarget.style.background = "#f1f5f9"}
                  >
                    <Paperclip size={18} />
                  </button>

                  <input
                    type="text"
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    placeholder={
                      activeThreadId !== "all" && activeThreadId !== "general"
                        ? `Type official response regarding ${activeThreadId}...`
                        : "Type official municipal reply..."
                    }
                    style={{
                      flex: 1,
                      background: "#f8fafc",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "14px",
                      padding: "10px 16px",
                      fontSize: "0.92rem",
                      color: "#0f172a",
                      outline: "none",
                      transition: "all 0.2s"
                    }}
                    onFocus={e => {
                      e.currentTarget.style.background = "#ffffff";
                      e.currentTarget.style.borderColor = "#3b82f6";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.15)";
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    disabled={!connected}
                  />

                  <button
                    type="submit"
                    disabled={!connected || (!inputMessage.trim() && !adminAttachedFile)}
                    style={{
                      background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "14px",
                      padding: "10px 20px",
                      height: "42px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontWeight: "700",
                      fontSize: "0.9rem",
                      cursor: (!connected || (!inputMessage.trim() && !adminAttachedFile)) ? "not-allowed" : "pointer",
                      opacity: (!connected || (!inputMessage.trim() && !adminAttachedFile)) ? 0.5 : 1,
                      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                      transition: "all 0.15s"
                    }}
                  >
                    <span>Dispatch</span>
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: APPLICANT & PERMIT DOSSIER INSPECTOR (COLLAPSIBLE) */}
        {/* ======================================================================= */}
        {showDossier && selectedApplicantData && (
          <div style={{
            background: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px -4px rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}>
            {/* Dossier Header */}
            <div style={{
              padding: "1.25rem",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Briefcase size={18} color="#2563eb" />
                <h3 style={{ fontSize: "1rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>Permit Dossier</h3>
              </div>
              <button
                onClick={() => setShowDossier(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                title="Collapse Panel"
              >
                <X size={16} />
              </button>
            </div>

            {/* Dossier Scrollable Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              
              {/* Citizen Card */}
              <div style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                borderRadius: "16px",
                padding: "1.25rem",
                border: "1px solid #e2e8f0"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    color: "white",
                    fontWeight: "800",
                    fontSize: "1.2rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 10px rgba(37, 99, 235, 0.2)"
                  }}>
                    {selectedApplicantData.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>
                      {selectedApplicantData.name}
                    </h4>
                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Registered Applicant</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.8rem", color: "#334155" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <User size={13} color="#64748b" />
                    <span style={{ wordBreak: "break-all" }}>{applicantEmail}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Phone size={13} color="#64748b" />
                    <span>{selectedApplicantData.phone}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <MapPin size={13} color="#64748b" />
                    <span>{selectedApplicantData.address}</span>
                  </div>
                </div>
              </div>

              {/* Linked Applications Section */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <h4 style={{ margin: 0, fontSize: "0.88rem", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Submitted Permits ({selectedApplicantData.applications.length})
                  </h4>
                </div>

                {selectedApplicantData.applications.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                    <p style={{ margin: 0, fontSize: "0.82rem" }}>No submitted permits found for this citizen.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {selectedApplicantData.applications.map((app, aIdx) => {
                      const badge = getStatusBadge(app.status);
                      const isFiltered = activeThreadId === app.id;

                      return (
                        <div
                          key={aIdx}
                          style={{
                            background: isFiltered ? "#eff6ff" : "#ffffff",
                            border: isFiltered ? "1.5px solid #3b82f6" : "1px solid #e2e8f0",
                            borderRadius: "14px",
                            padding: "12px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                            transition: "all 0.15s"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
                            <div>
                              <span style={{ fontSize: "0.88rem", fontWeight: "800", color: "#0f172a", display: "block" }}>
                                {app.id}
                              </span>
                              <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "#475569" }}>
                                {app.projectName || "Permit Application"}
                              </span>
                            </div>
                            <span style={{
                              fontSize: "0.7rem",
                              fontWeight: "700",
                              background: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              padding: "2px 8px",
                              borderRadius: "8px",
                              flexShrink: 0
                            }}>
                              {badge.label}
                            </span>
                          </div>

                          <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "10px", display: "flex", flexDirection: "column", gap: "3px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Building2 size={12} />
                              <span style={{ textTransform: "capitalize" }}>{app.permitType?.replace(/_/g, " ")}</span>
                            </div>
                            {app.projectAddress && (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <MapPin size={12} />
                                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {app.projectAddress}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action Links */}
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => setActiveThreadId(app.id)}
                              style={{
                                flex: 1,
                                padding: "6px 10px",
                                borderRadius: "8px",
                                fontSize: "0.75rem",
                                fontWeight: "700",
                                background: isFiltered ? "#2563eb" : "#f1f5f9",
                                color: isFiltered ? "#ffffff" : "#334155",
                                border: "none",
                                cursor: "pointer",
                                transition: "all 0.15s"
                              }}
                            >
                              {isFiltered ? "Active Thread" : "Filter Thread"}
                            </button>

                            <Link
                              href={`/staff/evaluate/${app.id}`}
                              style={{
                                flex: 1,
                                padding: "6px 10px",
                                borderRadius: "8px",
                                fontSize: "0.75rem",
                                fontWeight: "700",
                                background: "white",
                                color: "#2563eb",
                                border: "1px solid #bfdbfe",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                                textDecoration: "none",
                                transition: "all 0.15s"
                              }}
                              target="_blank"
                            >
                              <span>Workspace</span>
                              <ExternalLink size={12} />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Municipal Guidance Box */}
              <div style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "14px",
                padding: "12px",
                fontSize: "0.78rem",
                color: "#166534"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", marginBottom: "4px" }}>
                  <ShieldCheck size={15} />
                  <span>Sto. Tomas OBO Protocol</span>
                </div>
                <p style={{ margin: 0, lineHeight: 1.4 }}>
                  Official notices sent through this desk are recorded into the municipal audit trail. Citizens receive real-time notifications on their portal.
                </p>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 3. ATTACHMENT PREVIEW MODAL */}
      {/* ========================================================================= */}
      <AttachmentPreviewModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </div>
  );
}
