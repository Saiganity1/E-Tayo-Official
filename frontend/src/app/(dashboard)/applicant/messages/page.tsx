"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, User, Clock, ShieldCheck, Landmark, CheckCircle2, MessageSquare, 
  Search, Paperclip, Sparkles, FileText, ChevronRight, Phone, Info, 
  AlertCircle, X, HelpCircle, Building2, Flame, MapPin, CheckCheck, 
  RefreshCw, BadgeCheck, Compass, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Client } from "@stomp/stompjs";
import { format } from "date-fns";
import { usePermitContext } from "../../../../context/PermitContext";

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

export default function ApplicantMessagesPage() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get("ref");
  
  const { applications } = usePermitContext();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserName, setCurrentUserName] = useState("Applicant");
  const [connected, setConnected] = useState(false);
  const [selectedAppRef, setSelectedAppRef] = useState<any | null>(null);
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const stompClient = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize active reference if passed in query string
  useEffect(() => {
    if (initialRef && applications && applications.length > 0) {
      const found = applications.find(a => a.id === initialRef);
      if (found) {
        setSelectedAppRef(found);
      }
    }
  }, [initialRef, applications]);

  // Load user & connect WebSocket
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUserEmail(parsedUser.email || "applicant@example.com");
        if (parsedUser.name) setCurrentUserName(parsedUser.name);
        
        // Load initial chat history with Mang Tomas (staff@etayo.gov.ph)
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/messages/history?user1=${parsedUser.email}&user2=${MANG_TOMAS.email}`)
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
            client.subscribe(`/topic/messages/${parsedUser.email}`, (message) => {
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

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (contentToSend?: string) => {
    const rawContent = (contentToSend !== undefined ? contentToSend : inputMessage).trim();
    if (!rawContent && !attachedFile) return;

    let finalContent = rawContent;

    // Add Application Reference tag if selected
    if (selectedAppRef) {
      finalContent = `[Ref: ${selectedAppRef.id} - ${selectedAppRef.projectName || "Application"}] ${finalContent}`;
    }

    // Add Attachment tag if selected
    if (attachedFile) {
      finalContent = `${finalContent}\n📎 [Attachment: ${attachedFile}]`;
    }

    if (stompClient.current && connected) {
      setIsSending(true);
      const chatMessage = {
        senderEmail: currentUserEmail,
        recipientEmail: MANG_TOMAS.email,
        content: finalContent,
      };

      try {
        stompClient.current.publish({
          destination: "/app/chat.sendMessage",
          body: JSON.stringify(chatMessage),
        });

        // Optimistically add to local messages for instant feedback
        const localMsg = {
          id: `local-${Date.now()}`,
          senderEmail: currentUserEmail,
          recipientEmail: MANG_TOMAS.email,
          content: finalContent,
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
      // Fallback if offline/demo
      const localMsg = {
        id: `local-${Date.now()}`,
        senderEmail: currentUserEmail,
        recipientEmail: MANG_TOMAS.email,
        content: finalContent,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, localMsg]);
      setInputMessage("");
      setAttachedFile(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file.name);
    }
  };

  const renderMessageContent = (text: string) => {
    if (!text) return null;

    // Detect tracking ID patterns like LC-2026-1641 or BP-2026-0012
    const trackingIdRegex = /(LC-\d{4}-\d{4}|BP-\d{4}-\d{4}|APP-\d{4}-\d{4})/g;
    const parts = text.split(trackingIdRegex);

    return parts.map((part, i) => {
      if (trackingIdRegex.test(part)) {
        return (
          <Link
            key={i}
            href={`/applicant/track/${part}`}
            className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md transition-all mx-1"
            title="Click to view official application status"
          >
            <span>{part}</span>
            <ExternalLink size={10} />
          </Link>
        );
      }
      return <span key={i}>{part}</span>;
    });
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
              Direct real-time consultation with Mang Tomas (Municipal Permitting Officer) for permit requirements and evaluation updates.
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

      {/* DEDICATED CHAT CONTAINER (FOCUSED ON MANG TOMAS) */}
      <div 
        className="chat-main-wrapper glass-panel"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          maxWidth: "1000px",
          width: "100%",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 8px 32px rgba(0,0,0,0.04)",
          overflow: "hidden",
          minHeight: "580px",
          height: "calc(100vh - 240px)"
        }}
      >
        {/* MANG TOMAS PROFILE HEADER */}
        <div style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: MANG_TOMAS.avatarBg,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)"
            }}>
              <Landmark size={24} />
              <span style={{
                position: "absolute",
                bottom: "-2px",
                right: "-2px",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#16a34a",
                border: "2px solid #ffffff"
              }} />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>
                  {MANG_TOMAS.name}
                </h3>
                <span style={{
                  background: "#e0e7ff",
                  color: "#4338ca",
                  fontSize: "0.7rem",
                  fontWeight: "800",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px"
                }}>
                  <BadgeCheck size={12} /> {MANG_TOMAS.badge}
                </span>
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                {MANG_TOMAS.title} • {MANG_TOMAS.department} • <span style={{ color: "#16a34a", fontWeight: "700" }}>● {MANG_TOMAS.status}</span>
              </div>
            </div>
          </div>

          {/* Header Right Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {/* Reference Application Button */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowAppPicker(!showAppPicker)}
                style={{
                  background: selectedAppRef ? "#eff6ff" : "#ffffff",
                  border: selectedAppRef ? "1.5px solid #93c5fd" : "1px solid #cbd5e1",
                  color: selectedAppRef ? "#1d4ed8" : "#475569",
                  padding: "7px 13px",
                  borderRadius: "9px",
                  fontSize: "0.8rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  transition: "all 0.15s ease"
                }}
                title="Link an active permit application to this conversation"
              >
                <FileText size={15} color={selectedAppRef ? "#2563eb" : "#64748b"} />
                <span>{selectedAppRef ? `Ref: ${selectedAppRef.id}` : "Link Application"}</span>
              </button>

              {/* Dropdown Menu of Applications */}
              {showAppPicker && (
                <div style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: "6px",
                  width: "290px",
                  background: "#ffffff",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                  zIndex: 50,
                  padding: "8px"
                }}>
                  <div style={{ padding: "6px 8px", fontSize: "0.72rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
                    Select Application to Reference
                  </div>
                  {applications && applications.length > 0 ? (
                    applications.slice(0, 5).map(app => (
                      <div
                        key={app.id}
                        onClick={() => {
                          setSelectedAppRef(app);
                          setShowAppPicker(false);
                        }}
                        style={{
                          padding: "8px 10px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          background: selectedAppRef?.id === app.id ? "#eff6ff" : "transparent",
                          fontSize: "0.82rem",
                          transition: "background 0.15s ease"
                        }}
                        onMouseEnter={(e) => { if (selectedAppRef?.id !== app.id) e.currentTarget.style.background = "#f8fafc"; }}
                        onMouseLeave={(e) => { if (selectedAppRef?.id !== app.id) e.currentTarget.style.background = "transparent"; }}
                      >
                        <div style={{ fontWeight: "700", color: "#0f172a" }}>{app.projectName || app.id}</div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{app.id} • {app.status}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "8px", fontSize: "0.78rem", color: "#94a3b8", textAlign: "center" }}>
                      No filed applications yet.
                    </div>
                  )}
                  {selectedAppRef && (
                    <div 
                      onClick={() => { setSelectedAppRef(null); setShowAppPicker(false); }}
                      style={{ padding: "7px", textAlign: "center", fontSize: "0.75rem", color: "#ef4444", cursor: "pointer", borderTop: "1px solid #f1f5f9", fontWeight: "600" }}
                    >
                      Clear Linked Reference
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{
              fontSize: "0.76rem",
              color: "#64748b",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              padding: "7px 12px",
              borderRadius: "9px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <Phone size={13} color="#2563eb" />
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
            <Sparkles size={12} color="#6366f1" /> Suggested Inquiries:
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

        {/* MESSAGES FEED AREA */}
        <div 
          className="chat-messages"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem",
            background: "#fafbfd",
            display: "flex",
            flexDirection: "column",
            gap: "1.1rem"
          }}
        >
          {messages.length === 0 ? (
            <div style={{
              margin: "auto",
              maxWidth: "480px",
              textAlign: "center",
              padding: "2.25rem 1.75rem",
              background: "#ffffff",
              borderRadius: "18px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 16px rgba(0,0,0,0.02)"
            }}>
              <div style={{
                width: "58px",
                height: "58px",
                borderRadius: "16px",
                background: MANG_TOMAS.avatarBg,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem auto",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)"
              }}>
                <Landmark size={30} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.4rem 0" }}>
                Welcome to Mang Tomas Permitting Helpdesk
              </h3>
              <p style={{ margin: "0 0 1.25rem 0", color: "#64748b", fontSize: "0.86rem", lineHeight: "1.5" }}>
                {MANG_TOMAS.description} Send a message below or click one of the suggested inquiry templates to begin.
              </p>
              <div style={{
                background: "#f8fafc",
                borderRadius: "10px",
                padding: "0.75rem",
                fontSize: "0.75rem",
                color: "#64748b",
                border: "1px dashed #cbd5e1"
              }}>
                Official consultations are logged pursuant to RA 11032 (Ease of Doing Business Act).
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
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
                    maxWidth: "70%",
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
                      {renderMessageContent(msg.content)}
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
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ACTIVE APPLICATION / ATTACHMENT BADGE CHIP */}
        {(selectedAppRef || attachedFile) && (
          <div style={{
            padding: "6px 1.5rem",
            background: "#eff6ff",
            borderTop: "1px solid #bfdbfe",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap"
          }}>
            {selectedAppRef && (
              <span style={{
                background: "#ffffff",
                border: "1px solid #93c5fd",
                color: "#1e40af",
                borderRadius: "999px",
                fontSize: "0.72rem",
                fontWeight: "700",
                padding: "2px 9px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}>
                <FileText size={11} />
                <span>Linked: {selectedAppRef.id}</span>
                <X size={11} style={{ cursor: "pointer" }} onClick={() => setSelectedAppRef(null)} />
              </span>
            )}

            {attachedFile && (
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
                <span>{attachedFile}</span>
                <X size={11} style={{ cursor: "pointer" }} onClick={() => setAttachedFile(null)} />
              </span>
            )}
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
              placeholder="Ask Mang Tomas about requirements or permit evaluation..."
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
            <span>Press Enter to send inquiry</span>
            <span>Office of the Building Official • Santo Tomas, Pampanga</span>
          </div>
        </div>
      </div>
    </div>
  );
}
