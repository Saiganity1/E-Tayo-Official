"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Send, User, Clock, ShieldCheck, Landmark, CheckCircle2, MessageSquare, 
  Search, Paperclip, Sparkles, FileText, ChevronRight, Phone, Info, 
  AlertCircle, X, HelpCircle, Building2, Flame, MapPin, CheckCheck, 
  RefreshCw, BadgeCheck, Compass, ExternalLink, Plus, MessageSquarePlus,
  Layers, Filter, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Client } from "@stomp/stompjs";
import { format } from "date-fns";
import { usePermitContext } from "../../../../context/PermitContext";
import { 
  MessageBubbleContent, 
  AttachmentPreviewModal, 
  ParsedAttachment 
} from "../../../../components/chat/ChatAttachmentRenderer";

const MANG_TOMAS = {
  name: "Mang Tomas",
  title: "Chief Permitting Officer",
  department: "Office of the Building Official (OBO)",
  email: "staff@etayo.gov.ph",
  avatarBg: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  badge: "Official Permitting Staff",
  status: "Online",
  description: "Official municipal permitting desk for Locational Clearances, NBCP Building Permits, inspections, and requirements verification."
};

const QUICK_INQUIRIES = [
  {
    icon: "📋",
    label: "Locational Clearance (Annex D)",
    text: "Good day! May I clarify the required documents and processing timeline for Stage 1 Locational Clearance (Annex D)?"
  },
  {
    icon: "🏗️",
    label: "Building Permit Follow-up",
    text: "Hello, I would like to follow up on the evaluation status of my permit application. Are there pending items required?"
  },
  {
    icon: "🔍",
    label: "Site Inspection Schedule",
    text: "Good day! When is the next available schedule for on-site municipal engineering inspection in Sto. Tomas?"
  },
  {
    icon: "📑",
    label: "Unified Forms & Notarization",
    text: "Hello! Which specific ancillary municipal forms require professional engineer dry seals and legal notarization?"
  }
];

const MODAL_TOPIC_SUGGESTIONS = [
  "Follow up on application evaluation status",
  "Clarify required engineering plans and documents",
  "Inquire about site inspection schedule",
  "Questions regarding permit fees and clearance release"
];

interface ConversationThread {
  id: string; // Application ID (e.g. "LC-2026-4157") or "general"
  title: string;
  subtitle?: string;
  permitType?: string;
  status?: string;
  lastMessage?: string;
  lastTimestamp?: string;
  isGeneral?: boolean;
}

export default function ApplicantMessagesPage() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get("ref");
  
  const { applications } = usePermitContext();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserName, setCurrentUserName] = useState("Applicant");
  const [connected, setConnected] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; url: string } | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<ParsedAttachment | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Categorized Conversation State
  const [activeThreadId, setActiveThreadId] = useState<string>("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [userCreatedThreadIds, setUserCreatedThreadIds] = useState<string[]>([]);
  const [showStartModal, setShowStartModal] = useState(false);
  const [modalSelectedAppId, setModalSelectedAppId] = useState<string>("");
  const [modalInitialMessage, setModalInitialMessage] = useState<string>("");

  const stompClient = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Known application IDs for smart parsing
  const knownAppIds = useMemo(() => {
    return (applications || []).map(a => a.id);
  }, [applications]);

  // Helper to determine which thread a message belongs to
  const getMessageThreadId = (msg: any): string => {
    if (msg.applicationId && msg.applicationId !== 'all') {
      return msg.applicationId;
    }
    const content = msg.content || "";
    // Check for [Ref: ID - ProjectName]
    const refMatch = content.match(/\[Ref:\s*([^\]\-]+)(?:\s*-\s*([^\]]+))?\]/i);
    if (refMatch) {
      const matchedId = refMatch[1].trim();
      if (matchedId.toLowerCase() === "general") return "general";
      return matchedId;
    }
    // Check if content contains any known application ID
    for (const appId of knownAppIds) {
      if (content.includes(appId)) {
        return appId;
      }
    }
    return "general";
  };

  // Load user & connect WebSocket
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const email = parsedUser.email || "applicant@example.com";
        setCurrentUserEmail(email);
        if (parsedUser.name) setCurrentUserName(parsedUser.name);

        // Load user-created threads from localStorage
        try {
          const storedThreads = localStorage.getItem(`etayo_threads_${email}`);
          if (storedThreads) {
            const parsed = JSON.parse(storedThreads);
            if (Array.isArray(parsed)) setUserCreatedThreadIds(parsed);
          }
        } catch (e) {}
        
        // Load initial chat history with Mang Tomas (staff@etayo.gov.ph)
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/messages/history?user1=${email}&user2=${MANG_TOMAS.email}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) setMessages(data);
          })
          .catch(err => console.error("Failed to load message history", err));

        // Setup WebSocket
        let wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";
        if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
          wsUrl = wsUrl.replace('ws://', 'wss://');
        }
        if (!wsUrl.endsWith('/ws')) {
          wsUrl = wsUrl.replace(/\/$/, '') + '/ws';
        }

        const client = new Client({
          brokerURL: wsUrl,
          reconnectDelay: 5000,
          onConnect: () => {
            setConnected(true);
            client.subscribe(`/topic/messages/${email}`, (message) => {
              try {
                const receivedMessage = JSON.parse(message.body);
                setMessages(prev => {
                  if (prev.some(m => m.id && m.id === receivedMessage.id)) return prev;
                  return [...prev, receivedMessage];
                });
              } catch (e) {
                console.error("Failed to parse incoming message", e);
              }
            });
          },
          onStompError: (frame) => {
            console.error("STOMP Broker error: " + frame.headers["message"]);
          },
          onWebSocketClose: () => {
            setConnected(false);
          }
        });

        client.activate();
        stompClient.current = client;
      } catch (err) {
        console.error("Error parsing user from localStorage", err);
      }
    }

    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
  }, []);

  // Handle URL ref parameter (e.g. ?ref=LC-2026-4157 from track page)
  useEffect(() => {
    if (initialRef) {
      setActiveThreadId(initialRef);
      // Ensure thread is added to userCreatedThreadIds
      setUserCreatedThreadIds(prev => {
        if (!prev.includes(initialRef)) {
          const updated = [...prev, initialRef];
          if (currentUserEmail) {
            try {
              localStorage.setItem(`etayo_threads_${currentUserEmail}`, JSON.stringify(updated));
            } catch (e) {}
          }
          return updated;
        }
        return prev;
      });
    }
  }, [initialRef, currentUserEmail]);

  // Auto-scroll to latest message in active thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeThreadId]);

  // Derive full categorized conversation threads
  const conversationThreads = useMemo(() => {
    const threadMap: Record<string, ConversationThread> = {};

    // 1. General Helpdesk thread (always available)
    threadMap["general"] = {
      id: "general",
      title: "General Permitting Desk",
      subtitle: "Sto. Tomas OBO Consultation",
      isGeneral: true,
      lastMessage: "Welcome to Mang Tomas Permitting Helpdesk",
      lastTimestamp: undefined
    };

    // 2. Discover all application threads from applications context or userCreatedThreadIds
    (applications || []).forEach(app => {
      threadMap[app.id] = {
        id: app.id,
        title: app.projectName || "Locational Clearance",
        subtitle: app.id,
        permitType: app.permitType === "locational_clearance" ? "Locational Clearance (Annex D)" : "Building Permit (PD 1096)",
        status: app.status,
        isGeneral: false
      };
    });

    userCreatedThreadIds.forEach(id => {
      if (!threadMap[id]) {
        const found = (applications || []).find(a => a.id === id);
        threadMap[id] = {
          id,
          title: found?.projectName || id,
          subtitle: id,
          permitType: found?.permitType || "Permit Application",
          status: found?.status || "In Review",
          isGeneral: false
        };
      }
    });

    // 3. Populate latest message & timestamp from messages
    messages.forEach(msg => {
      const threadId = getMessageThreadId(msg);
      if (!threadMap[threadId]) {
        threadMap[threadId] = {
          id: threadId,
          title: threadId === "general" ? "General Permitting Desk" : threadId,
          subtitle: threadId,
          isGeneral: threadId === "general"
        };
      }

      // Update latest message for this thread
      const cleanContent = msg.content?.replace(/\[Ref:\s*[^\]]+\]\s*/i, "").replace(/\[Attachment:\s*[^\]]+\]/gi, "[Attachment]").trim();
      threadMap[threadId].lastMessage = cleanContent || "New message";
      threadMap[threadId].lastTimestamp = msg.timestamp;
    });

    // Convert to list
    let list = Object.values(threadMap);

    // If an application has messages or was explicitly created or is active, prioritize it
    // Sort so threads with latest timestamps appear at the top, followed by general
    list.sort((a, b) => {
      if (a.id === activeThreadId) return -1;
      if (b.id === activeThreadId) return 1;
      if (a.lastTimestamp && b.lastTimestamp) {
        return new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime();
      }
      if (a.lastTimestamp) return -1;
      if (b.lastTimestamp) return 1;
      if (a.id === "general") return 1;
      return -1;
    });

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.id.toLowerCase().includes(q) || 
        (t.subtitle && t.subtitle.toLowerCase().includes(q))
      );
    }

    return list;
  }, [applications, messages, userCreatedThreadIds, activeThreadId, searchQuery, knownAppIds]);

  // Current active thread object
  const activeThread = useMemo(() => {
    return conversationThreads.find(t => t.id === activeThreadId) || {
      id: activeThreadId,
      title: activeThreadId === "general" ? "General Permitting Desk" : activeThreadId,
      isGeneral: activeThreadId === "general"
    };
  }, [conversationThreads, activeThreadId]);

  // Associated application object (if active thread is for a permit)
  const activeApp = useMemo(() => {
    if (activeThreadId === "general") return null;
    return (applications || []).find(a => a.id === activeThreadId) || null;
  }, [applications, activeThreadId]);

  // Filter messages for active thread
  const activeThreadMessages = useMemo(() => {
    return messages.filter(msg => getMessageThreadId(msg) === activeThreadId);
  }, [messages, activeThreadId]);

  // Send message handler
  const handleSendMessage = (contentToSend?: string) => {
    const rawContent = (contentToSend !== undefined ? contentToSend : inputMessage).trim();
    if (!rawContent && !attachedFile) return;

    let finalContent = rawContent;

    // Automatically tag message with active application thread reference
    if (activeThreadId !== "general") {
      const projName = activeApp?.projectName || activeThread.title || "Application";
      finalContent = `[Ref: ${activeThreadId} - ${projName}] ${finalContent}`;
    } else {
      finalContent = `[Ref: General - Helpdesk] ${finalContent}`;
    }

    // Add Attachment tag if selected
    if (attachedFile) {
      finalContent = `${finalContent}\n[Attachment: ${attachedFile.name}|${attachedFile.url}]`;
    }

    const payload = {
      senderEmail: currentUserEmail,
      recipientEmail: MANG_TOMAS.email,
      content: finalContent,
      applicationId: activeThreadId
    };

    if (stompClient.current && connected) {
      setIsSending(true);
      try {
        stompClient.current.publish({
          destination: "/app/chat.sendMessage",
          body: JSON.stringify(payload),
        });

        // Optimistically add to local messages
        const localMsg = {
          id: `local-${Date.now()}`,
          senderEmail: currentUserEmail,
          recipientEmail: MANG_TOMAS.email,
          content: finalContent,
          applicationId: activeThreadId,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, localMsg]);

        setInputMessage("");
        setAttachedFile(null);
      } catch (err) {
        console.error("Failed to send message", err);
      } finally {
        setIsSending(false);
      }
    } else {
      // Offline fallback
      const localMsg = {
        id: `local-${Date.now()}`,
        senderEmail: currentUserEmail,
        recipientEmail: MANG_TOMAS.email,
        content: finalContent,
        applicationId: activeThreadId,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, localMsg]);
      setInputMessage("");
      setAttachedFile(null);
    }
  };

  // Start new conversation modal handler
  const handleStartConversationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = modalSelectedAppId || (applications && applications.length > 0 ? applications[0].id : "general");
    
    // Switch to this thread
    setActiveThreadId(targetId);

    // Save to userCreatedThreadIds
    if (!userCreatedThreadIds.includes(targetId)) {
      const updated = [...userCreatedThreadIds, targetId];
      setUserCreatedThreadIds(updated);
      if (currentUserEmail) {
        try {
          localStorage.setItem(`etayo_threads_${currentUserEmail}`, JSON.stringify(updated));
        } catch (err) {}
      }
    }

    // If an initial message or suggestion was provided, send it right away
    const initText = modalInitialMessage.trim();
    if (initText) {
      handleSendMessage(initText);
    }

    // Reset and close modal
    setModalInitialMessage("");
    setShowStartModal(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Cache locally as base64
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      try {
        localStorage.setItem(`att_${file.name}`, dataUrl);
      } catch (err) {}
      setAttachedFile({ name: file.name, url: "" });
    };
    reader.readAsDataURL(file);

    // Also upload to server
    const formData = new FormData();
    formData.append("files", file);
    formData.append("permitType", "Applicant Attachment");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/upload`, {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.urls && data.urls[0]) {
          setAttachedFile({ name: file.name, url: data.urls[0] });
        }
      })
      .catch(err => console.error("Upload error", err));
  };

  return (
    <div className="dashboard-page animate-fade-in-up" style={{ minHeight: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
      {/* PAGE HEADER */}
      <header className="page-header" style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.35rem" }}>
              <span style={{
                background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
                color: "white",
                padding: "3px 10px",
                borderRadius: "6px",
                fontSize: "0.72rem",
                fontWeight: "800",
                letterSpacing: "0.5px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}>
                <Landmark size={12} />
                LGU SANTO TOMAS, PAMPANGA
              </span>
              <span style={{ fontSize: "0.76rem", color: "#64748b", fontWeight: "600" }}>
                • Office of the Building Official (OBO)
              </span>
            </div>
            <h1 className="page-title" style={{ fontSize: "1.85rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.25rem 0", letterSpacing: "-0.02em" }}>
              Messages & Helpdesk
            </h1>
            <p className="page-subtitle" style={{ margin: 0, color: "#64748b", fontSize: "0.92rem" }}>
              Categorized real-time consultation with Mang Tomas (Municipal Permitting Officer) per permit application.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Live Status Pill */}
            <div style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "7px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
            }}>
              <span style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: connected ? "#16a34a" : "#eab308",
                boxShadow: connected ? "0 0 0 3px rgba(22, 163, 74, 0.2)" : "none",
                display: "inline-block"
              }} />
              <span style={{ fontSize: "0.82rem", fontWeight: "700", color: connected ? "#15803d" : "#854d0e" }}>
                {connected ? "Helpdesk Connected" : "Connecting..."}
              </span>
            </div>

            {/* Quick Track Link */}
            <Link
              href="/applicant/track"
              style={{
                background: "#f1f5f9",
                color: "#334155",
                fontSize: "0.84rem",
                fontWeight: "700",
                padding: "8px 14px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                textDecoration: "none",
                transition: "all 0.15s ease"
              }}
            >
              <FileText size={15} color="#475569" />
              <span>Track Applications</span>
            </Link>
          </div>
        </div>
      </header>

      {/* TWO-COLUMN CATEGORIZED CONVERSATION CONTAINER */}
      <div 
        className="glass-panel"
        style={{
          flex: 1,
          display: "flex",
          width: "100%",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 8px 32px rgba(0,0,0,0.04)",
          overflow: "hidden",
          minHeight: "600px",
          height: "calc(100vh - 210px)"
        }}
      >
        {/* LEFT SIDEBAR: CATEGORIZED CONVERSATIONS */}
        <aside style={{
          width: "330px",
          minWidth: "300px",
          maxWidth: "360px",
          borderRight: "1px solid #e2e8f0",
          background: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0
        }}>
          {/* Sidebar Header */}
          <div style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid #e2e8f0",
            background: "#ffffff",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <MessageSquare size={17} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>
                    Inquiries
                  </h3>
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                    {conversationThreads.length} {conversationThreads.length === 1 ? "thread" : "threads"}
                  </span>
                </div>
              </div>

              {/* START CONVERSATION BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setModalSelectedAppId(applications && applications.length > 0 ? applications[0].id : "general");
                  setModalInitialMessage("");
                  setShowStartModal(true);
                }}
                style={{
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "9px",
                  padding: "7px 12px",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                  transition: "all 0.15s ease"
                }}
                title="Start a new conversation for an application"
              >
                <Plus size={15} />
                <span>Start Chat</span>
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative" }}>
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px 7px 30px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  fontSize: "0.82rem",
                  outline: "none",
                  transition: "all 0.15s ease"
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.background = "#ffffff"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; }}
              />
              {searchQuery && (
                <X 
                  size={13} 
                  color="#94a3b8" 
                  style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", cursor: "pointer" }} 
                  onClick={() => setSearchQuery("")}
                />
              )}
            </div>
          </div>

          {/* Conversation List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {conversationThreads.map(thread => {
              const isActive = thread.id === activeThreadId;
              const formattedTime = thread.lastTimestamp 
                ? format(new Date(thread.lastTimestamp), "h:mm a") 
                : "";

              return (
                <div
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "12px",
                    marginBottom: "6px",
                    cursor: "pointer",
                    background: isActive ? "#ffffff" : "transparent",
                    border: isActive ? "1.5px solid #bfdbfe" : "1px solid transparent",
                    boxShadow: isActive ? "0 4px 12px rgba(59, 130, 246, 0.08)" : "none",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px"
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                      <span style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: isActive ? "#2563eb" : (thread.isGeneral ? "#a855f7" : "#10b981"),
                        flexShrink: 0
                      }} />
                      <span style={{
                        fontSize: "0.82rem",
                        fontWeight: "800",
                        color: isActive ? "#1e3a8a" : "#0f172a",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {thread.title}
                      </span>
                    </div>

                    {formattedTime && (
                      <span style={{ fontSize: "0.68rem", color: "#94a3b8", flexShrink: 0 }}>
                        {formattedTime}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
                    <span style={{
                      fontSize: "0.72rem",
                      fontWeight: "700",
                      color: thread.isGeneral ? "#7e22ce" : "#2563eb",
                      background: thread.isGeneral ? "#faf5ff" : "#eff6ff",
                      padding: "1px 6px",
                      borderRadius: "6px",
                      fontFamily: "monospace"
                    }}>
                      {thread.isGeneral ? "General" : thread.id}
                    </span>

                    {thread.status && (
                      <span style={{
                        fontSize: "0.66rem",
                        fontWeight: "700",
                        color: thread.status === "approved" ? "#15803d" : "#b45309",
                        background: thread.status === "approved" ? "#dcfce7" : "#fef3c7",
                        padding: "1px 6px",
                        borderRadius: "999px",
                        textTransform: "capitalize"
                      }}>
                        {thread.status}
                      </span>
                    )}
                  </div>

                  {thread.lastMessage && (
                    <p style={{
                      margin: "2px 0 0 0",
                      fontSize: "0.76rem",
                      color: "#64748b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {thread.lastMessage}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sidebar Footer Help */}
          <div style={{
            padding: "10px 14px",
            borderTop: "1px solid #e2e8f0",
            background: "#ffffff",
            fontSize: "0.72rem",
            color: "#64748b",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span>Municipal OBO Portal</span>
            <span style={{ fontWeight: "700", color: "#2563eb" }}>Sto. Tomas</span>
          </div>
        </aside>

        {/* RIGHT CHAT AREA */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          minWidth: 0
        }}>
          {/* Active Thread Header */}
          <div style={{
            padding: "0.9rem 1.5rem",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            flexWrap: "wrap",
            gap: "0.75rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: MANG_TOMAS.avatarBg,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                boxShadow: "0 4px 10px rgba(37, 99, 235, 0.25)",
                flexShrink: 0
              }}>
                <Landmark size={22} />
                <span style={{
                  position: "absolute",
                  bottom: "-2px",
                  right: "-2px",
                  width: "11px",
                  height: "11px",
                  borderRadius: "50%",
                  background: "#16a34a",
                  border: "2px solid #ffffff"
                }} />
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: "#0f172a" }}>
                    {MANG_TOMAS.name}
                  </h3>
                  <span style={{
                    background: "#e0e7ff",
                    color: "#4338ca",
                    fontSize: "0.68rem",
                    fontWeight: "800",
                    padding: "2px 7px",
                    borderRadius: "999px"
                  }}>
                    {MANG_TOMAS.badge}
                  </span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  {MANG_TOMAS.title} • <span style={{ color: "#16a34a", fontWeight: "700" }}>● {MANG_TOMAS.status}</span>
                </div>
              </div>
            </div>

            {/* Active Thread Context Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {activeThreadId !== "general" ? (
                <div style={{
                  background: "#eff6ff",
                  border: "1.5px solid #93c5fd",
                  borderRadius: "10px",
                  padding: "5px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Building2 size={14} color="#1d4ed8" />
                    <span style={{ fontWeight: "800", color: "#1e40af", fontSize: "0.8rem", fontFamily: "monospace" }}>
                      {activeThreadId}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.78rem", color: "#3b82f6", fontWeight: "600" }}>
                    {activeApp?.projectName || activeThread.title}
                  </span>
                  {activeApp && (
                    <Link
                      href={`/applicant/track/${activeApp.id}`}
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: "700",
                        color: "#2563eb",
                        background: "#ffffff",
                        padding: "2px 7px",
                        borderRadius: "6px",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px"
                      }}
                      title="View full application status"
                    >
                      <span>Track</span>
                      <ExternalLink size={10} />
                    </Link>
                  )}
                </div>
              ) : (
                <div style={{
                  background: "#f5f3ff",
                  border: "1px solid #ddd6fe",
                  borderRadius: "10px",
                  padding: "5px 12px",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  color: "#6d28d9"
                }}>
                  General Inquiries Desk
                </div>
              )}

              <div style={{
                fontSize: "0.76rem",
                color: "#64748b",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                padding: "6px 10px",
                borderRadius: "9px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}>
                <Phone size={12} color="#2563eb" />
                <span style={{ fontWeight: "600" }}>(045) 961-4157</span>
              </div>
            </div>
          </div>

          {/* QUICK INQUIRY CHIPS CAROUSEL */}
          <div style={{
            padding: "8px 1.5rem",
            background: "#f8fafc",
            borderBottom: "1px solid #edf2f7",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            overflowX: "auto"
          }}>
            <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "#64748b", display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
              <Sparkles size={12} color="#6366f1" /> Quick Inquiries:
            </span>
            {QUICK_INQUIRIES.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInputMessage(q.text)}
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "999px",
                  padding: "4px 12px",
                  fontSize: "0.75rem",
                  color: "#334155",
                  fontWeight: "600",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.color = "#4338ca"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#334155"; }}
              >
                <span>{q.icon}</span>
                <span>{q.label}</span>
              </button>
            ))}
          </div>

          {/* MESSAGES FEED AREA FOR ACTIVE THREAD */}
          <div 
            className="chat-messages"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "1.25rem 1.5rem",
              background: "#fafbfd",
              display: "flex",
              flexDirection: "column",
              gap: "1rem"
            }}
          >
            {/* THREAD CONTEXT CARD AT TOP */}
            {activeThreadId !== "general" && activeApp ? (
              <div style={{
                background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
                border: "1.5px solid #86efac",
                borderRadius: "16px",
                padding: "1.1rem 1.35rem",
                boxShadow: "0 4px 14px rgba(34, 197, 94, 0.08)",
                marginBottom: "0.5rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "#10b981",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "0.98rem", fontWeight: "800", color: "#065f46" }}>
                        {activeApp.projectName || "Permit Application"}
                      </h4>
                      <span style={{ fontSize: "0.74rem", color: "#166534", fontWeight: "700", fontFamily: "monospace" }}>
                        Ref: {activeApp.id} • {activeApp.permitType === "locational_clearance" ? "Locational Clearance (Annex D)" : "Building Permit"}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      fontSize: "0.72rem",
                      fontWeight: "800",
                      background: activeApp.status === "approved" ? "#dcfce7" : "#fef3c7",
                      color: activeApp.status === "approved" ? "#166534" : "#b45309",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      textTransform: "uppercase"
                    }}>
                      {activeApp.status}
                    </span>
                    <Link
                      href={`/applicant/track/${activeApp.id}`}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #86efac",
                        color: "#059669",
                        fontSize: "0.74rem",
                        fontWeight: "700",
                        padding: "4px 10px",
                        borderRadius: "8px",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <span>View Application</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: "0.82rem", color: "#166534", lineHeight: "1.45" }}>
                  This conversation is strictly linked to <strong>{activeApp.id}</strong>. All inquiries and responses are archived directly with your official municipal permit records.
                </p>
              </div>
            ) : activeThreadId === "general" && activeThreadMessages.length === 0 ? (
              <div style={{
                margin: "auto",
                maxWidth: "480px",
                textAlign: "center",
                padding: "2rem 1.5rem",
                background: "#ffffff",
                borderRadius: "18px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.02)"
              }}>
                <div style={{
                  width: "54px",
                  height: "54px",
                  borderRadius: "14px",
                  background: MANG_TOMAS.avatarBg,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 0.85rem auto",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)"
                }}>
                  <Landmark size={28} />
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.35rem 0" }}>
                  General Permitting Helpdesk
                </h3>
                <p style={{ margin: "0 0 1rem 0", color: "#64748b", fontSize: "0.86rem", lineHeight: "1.5" }}>
                  Consult Mang Tomas regarding general zoning classifications, required engineering documents, or start a dedicated conversation for an application.
                </p>
                <button
                  type="button"
                  onClick={() => setShowStartModal(true)}
                  style={{
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    padding: "9px 18px",
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)"
                  }}
                >
                  <Plus size={16} /> Start Conversation for Application
                </button>
              </div>
            ) : null}

            {/* MESSAGES LIST */}
            {activeThreadMessages.map((msg, idx) => {
              const isMe = msg.senderEmail === currentUserEmail;
              const timeStr = msg.timestamp ? format(new Date(msg.timestamp), "h:mm a") : format(new Date(), "h:mm a");

              return (
                <div
                  key={msg.id || idx}
                  style={{
                    display: "flex",
                    justifyContent: isMe ? "flex-end" : "flex-start",
                    width: "100%"
                  }}
                >
                  {!isMe && (
                    <div style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "10px",
                      background: MANG_TOMAS.avatarBg,
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "9px",
                      flexShrink: 0,
                      marginTop: "3px"
                    }}>
                      <Landmark size={18} />
                    </div>
                  )}

                  <div style={{
                    maxWidth: "75%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isMe ? "flex-end" : "flex-start"
                  }}>
                    {!isMe && (
                      <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700", marginBottom: "3px", marginLeft: "4px" }}>
                        Mang Tomas • OBO
                      </span>
                    )}

                    <div style={{
                      padding: "0.85rem 1.15rem",
                      borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: isMe 
                        ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" 
                        : "#ffffff",
                      color: isMe ? "#ffffff" : "#1e293b",
                      border: isMe ? "none" : "1px solid #e2e8f0",
                      boxShadow: isMe ? "0 4px 14px rgba(37, 99, 235, 0.22)" : "0 2px 8px rgba(0,0,0,0.03)",
                      fontSize: "0.92rem",
                      lineHeight: "1.45"
                    }}>
                      <MessageBubbleContent
                        content={msg.content}
                        isMe={isMe}
                        onOpenAttachment={(att) => setPreviewAttachment(att)}
                      />
                    </div>

                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.68rem",
                      color: "#94a3b8",
                      marginTop: "3px",
                      padding: "0 4px"
                    }}>
                      <span>{timeStr}</span>
                      {isMe && <CheckCheck size={12} color="#3b82f6" />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* ACTIVE ATTACHMENT BADGE CHIP */}
          {attachedFile && (
            <div style={{
              padding: "6px 1.5rem",
              background: "#eff6ff",
              borderTop: "1px solid #bfdbfe",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <span style={{
                background: "#ffffff",
                border: "1px solid #bbf7d0",
                color: "#166534",
                borderRadius: "999px",
                fontSize: "0.72rem",
                fontWeight: "700",
                padding: "2px 9px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}>
                <Paperclip size={11} />
                <span>{attachedFile.name}</span>
                <X size={11} style={{ cursor: "pointer" }} onClick={() => setAttachedFile(null)} />
              </span>
            </div>
          )}

          {/* INPUT COMPOSER AREA */}
          <div style={{
            padding: "1rem 1.5rem",
            background: "#ffffff",
            borderTop: "1px solid #f1f5f9"
          }}>
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {/* File Attachment Button */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach Document or Plan (PDF/Image)"
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  color: "#64748b",
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  flexShrink: 0
                }}
              >
                <Paperclip size={18} />
              </button>

              {/* Main Input Text */}
              <input
                type="text"
                placeholder={
                  activeThreadId !== "general"
                    ? `Ask Mang Tomas regarding [${activeThreadId}]...`
                    : "Ask Mang Tomas about general requirements or procedures..."
                }
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: "10px",
                  border: "1.5px solid #e2e8f0",
                  fontSize: "0.92rem",
                  outline: "none",
                  transition: "all 0.15s ease",
                  background: "#f8fafc"
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.background = "#ffffff"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; }}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={isSending || (!inputMessage.trim() && !attachedFile)}
                style={{
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  width: "44px",
                  height: "42px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: (inputMessage.trim() || attachedFile) ? "pointer" : "not-allowed",
                  opacity: (inputMessage.trim() || attachedFile) ? 1 : 0.55,
                  boxShadow: (inputMessage.trim() || attachedFile) ? "0 4px 12px rgba(37, 99, 235, 0.3)" : "none",
                  transition: "all 0.15s ease",
                  flexShrink: 0
                }}
              >
                <Send size={18} />
              </button>
            </form>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#94a3b8", marginTop: "6px", padding: "0 2px" }}>
              <span>Categorized Thread: <strong>{activeThread.title}</strong></span>
              <span>Press Enter to send inquiry</span>
            </div>
          </div>
        </div>
      </div>

      {/* START NEW CONVERSATION MODAL */}
      {showStartModal && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem"
          }}
          onClick={() => setShowStartModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
              padding: "1.75rem",
              border: "1px solid #e2e8f0"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <MessageSquarePlus size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", color: "#0f172a" }}>
                    Start New Conversation
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                    Select an application to start a categorized inquiry thread.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowStartModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px"
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStartConversationSubmit}>
              {/* Application Selection */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#334155", marginBottom: "0.5rem" }}>
                  Select Application to Inquire About:
                </label>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "220px", overflowY: "auto", paddingRight: "4px" }}>
                  {applications && applications.length > 0 ? (
                    applications.map(app => {
                      const isSelected = modalSelectedAppId === app.id;
                      return (
                        <div
                          key={app.id}
                          onClick={() => setModalSelectedAppId(app.id)}
                          style={{
                            border: isSelected ? "2px solid #2563eb" : "1.5px solid #e2e8f0",
                            background: isSelected ? "#eff6ff" : "#ffffff",
                            borderRadius: "12px",
                            padding: "10px 14px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "10px",
                            transition: "all 0.15s ease"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                            <div style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: isSelected ? "#2563eb" : "#f1f5f9",
                              color: isSelected ? "white" : "#475569",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0
                            }}>
                              <Building2 size={16} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: "700", fontSize: "0.88rem", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {app.projectName || app.id}
                              </div>
                              <div style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: "monospace" }}>
                                {app.id} • {app.permitType === "locational_clearance" ? "Locational Clearance" : "Building Permit"}
                              </div>
                            </div>
                          </div>

                          <span style={{
                            fontSize: "0.7rem",
                            fontWeight: "700",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: app.status === "approved" ? "#dcfce7" : "#fef3c7",
                            color: app.status === "approved" ? "#15803d" : "#b45309",
                            textTransform: "capitalize",
                            flexShrink: 0
                          }}>
                            {app.status}
                          </span>
                        </div>
                      );
                    })
                  ) : null}

                  {/* General Helpdesk option */}
                  <div
                    onClick={() => setModalSelectedAppId("general")}
                    style={{
                      border: modalSelectedAppId === "general" ? "2px solid #7c3aed" : "1.5px solid #e2e8f0",
                      background: modalSelectedAppId === "general" ? "#f5f3ff" : "#ffffff",
                      borderRadius: "12px",
                      padding: "10px 14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: modalSelectedAppId === "general" ? "#7c3aed" : "#f1f5f9",
                      color: modalSelectedAppId === "general" ? "white" : "#475569",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <HelpCircle size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "0.88rem", color: "#0f172a" }}>
                        General Permitting Helpdesk
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                        General zoning, NBCP requirements, or general OBO inquiry
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Topic Chips */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#64748b", marginBottom: "0.4rem" }}>
                  Quick Inquiry Topic:
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {MODAL_TOPIC_SUGGESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setModalInitialMessage(sug)}
                      style={{
                        background: modalInitialMessage === sug ? "#eff6ff" : "#f8fafc",
                        border: modalInitialMessage === sug ? "1px solid #3b82f6" : "1px solid #cbd5e1",
                        color: modalInitialMessage === sug ? "#1d4ed8" : "#475569",
                        borderRadius: "999px",
                        padding: "4px 10px",
                        fontSize: "0.74rem",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Initial Message Textarea */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#334155", marginBottom: "0.4rem" }}>
                  Initial Message (Optional):
                </label>
                <textarea
                  rows={3}
                  placeholder="Type your opening question for Mang Tomas..."
                  value={modalInitialMessage}
                  onChange={(e) => setModalInitialMessage(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #e2e8f0",
                    fontSize: "0.88rem",
                    outline: "none",
                    resize: "none"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#2563eb"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    color: "#475569",
                    borderRadius: "10px",
                    padding: "9px 16px",
                    fontSize: "0.88rem",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    padding: "9px 20px",
                    fontSize: "0.88rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)"
                  }}
                >
                  <Send size={15} />
                  <span>Start Conversation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ATTACHMENT PREVIEW MODAL */}
      <AttachmentPreviewModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </div>
  );
}
