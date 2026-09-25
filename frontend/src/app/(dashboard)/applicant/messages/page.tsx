"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Send, User, Clock, ShieldCheck, Landmark, CheckCircle2, MessageSquare, 
  Search, Paperclip, Sparkles, FileText, ChevronRight, Phone, Info, 
  AlertCircle, X, HelpCircle, Building2, Flame, MapPin, CheckCheck, 
  RefreshCw, BadgeCheck, Compass, ExternalLink, Plus, MessageSquarePlus,
  Layers, Filter, ArrowLeft, CreditCard, Receipt, Image as ImageIcon
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Client } from "@stomp/stompjs";
import { format } from "date-fns";
import { usePermitContext } from "../../../../context/PermitContext";
import { dispatchPermitMessage, ensureApplicationConversationMessages } from "../../../../utils/permitMessaging";
import { 
  MessageBubbleContent, 
  AttachmentPreviewModal, 
  ParsedAttachment 
} from "../../../../components/chat/ChatAttachmentRenderer";

const OBO_ADMIN = {
  name: "OBO Admin",
  title: "Building Official Staff",
  department: "Office of the Building Official (OBO)",
  email: "staff@etayo.gov.ph",
  avatarBg: "linear-gradient(135deg, #0038A8 0%, #021a4f 100%)",
  badge: "Official OBO Staff",
  status: "Online",
  description: "Official Office of the Building Official desk for real-time consultation on your permit applications."
};

// Keep MANG_TOMAS as alias so existing send/receive logic is unchanged
const MANG_TOMAS = OBO_ADMIN;

const QUICK_INQUIRIES = [
  {
    icon: "📋",
    label: "Locational Clearance",
    text: "Good day! May I clarify the required documents and processing timeline for Stage 1 Locational Clearance?"
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
  
  const { applications, updateApplication } = usePermitContext();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserName, setCurrentUserName] = useState("Applicant");
  const [connected, setConnected] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; url: string } | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<ParsedAttachment | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Categorized Conversation State
  const [activeThreadId, setActiveThreadId] = useState<string>(initialRef || "general");
  const [searchQuery, setSearchQuery] = useState("");
  const [userCreatedThreadIds, setUserCreatedThreadIds] = useState<string[]>(initialRef ? [initialRef] : []);
  const [showStartModal, setShowStartModal] = useState(false);
  const [modalSelectedAppId, setModalSelectedAppId] = useState<string>("");
  const [modalInitialMessage, setModalInitialMessage] = useState<string>("");

  // Payment Receipt Upload in Chat State
  const [receiptModalFile, setReceiptModalFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [receiptRefInput, setReceiptRefInput] = useState("");
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);

  const stompClient = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const receiptFileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize initialRef from deep links (e.g. /applicant/messages?ref=LC-2026-9307)
  useEffect(() => {
    if (initialRef) {
      setActiveThreadId(initialRef);
      setUserCreatedThreadIds(prev => prev.includes(initialRef) ? prev : [...prev, initialRef]);
    }
  }, [initialRef]);

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
    const refMatch = content.match(/\[Ref:\s*([A-Za-z0-9_#/-]+)(?:\s*[-–—]\s*([^\]]+))?\]/i);
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
        const mergeWithLocal = (apiData: any[]) => {
          let localMsgs: any[] = [];
          try {
            const raw = localStorage.getItem("etayo_messages_history");
            if (raw) localMsgs = JSON.parse(raw);
          } catch (e) {}
          const merged = [...apiData];
          localMsgs.forEach((lm: any) => {
            if (
              (lm.recipientEmail === email || lm.senderEmail === email || !lm.recipientEmail || lm.recipientEmail === "applicant@etayo.gov.ph") &&
              !merged.some((m: any) => m.id === lm.id || (m.content === lm.content && Math.abs(new Date(m.timestamp).getTime() - new Date(lm.timestamp).getTime()) < 5000))
            ) {
              merged.push(lm);
            }
          });
          const finalized = ensureApplicationConversationMessages(applications || [], email, merged);
          setMessages(finalized);
        };

        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/messages/history?user1=${email}&user2=${MANG_TOMAS.email}`)
          .then(res => res.json())
          .then(data => {
            mergeWithLocal(Array.isArray(data) ? data : []);
          })
          .catch(err => {
            console.error("Failed to load message history", err);
            mergeWithLocal([]);
          });

        const handleCustomMsg = (e: any) => {
          if (e.detail) {
            setMessages((prev: any[]) => {
              if (prev.some(m => m.id === e.detail.id)) return prev;
              return [...prev, e.detail];
            });
          }
        };
        window.addEventListener("etayo_new_message", handleCustomMsg);

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

  // Synchronize official notices and payment messages for any approved applications
  useEffect(() => {
    if (applications && applications.length > 0) {
      setMessages(prev => {
        const email = currentUserEmail || "applicant@etayo.gov.ph";
        const synced = ensureApplicationConversationMessages(applications, email, prev);
        if (synced.length !== prev.length) {
          return synced;
        }
        return prev;
      });
    }
  }, [applications, currentUserEmail]);

  // Auto-scroll strictly inside the message container (never scrolls the outer browser window)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [activeThreadId]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages.length]);

  // Derive full categorized conversation threads
  const conversationThreads = useMemo(() => {
    const threadMap: Record<string, ConversationThread> = {};

    // 1. General OBO Admin thread (always available)
    threadMap["general"] = {
      id: "general",
      title: "OBO Admin Desk",
      subtitle: "Office of the Building Official",
      isGeneral: true,
      lastMessage: "Welcome to the OBO Permitting Helpdesk",
      lastTimestamp: undefined
    };

    // 2. Discover all application threads from applications context or userCreatedThreadIds
    (applications || []).forEach(app => {
      const isApproved = app.status === "approved" || app.status === "released" || Boolean((app as any).orderOfPaymentNo);
      const defaultLastMsg = app.status === "released"
        ? "🎉 Official Permits Released"
        : isApproved
          ? `💰 Order of Payment: PHP ${((app as any).assessedFees || 3795).toLocaleString()} issued`
          : "Application filed and queued";

      threadMap[app.id] = {
        id: app.id,
        title: app.projectName || "Locational Clearance",
        subtitle: app.id,
        permitType: app.permitType === "locational_clearance" ? "Locational Clearance" : "Building Permit (PD 1096)",
        status: app.status,
        lastMessage: defaultLastMsg,
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
  }, [applications, messages, userCreatedThreadIds, activeThreadId, searchQuery, knownAppIds, currentUserEmail]);

  // Filter threads: only show this user's own applications (not other applicants)
  const myConversationThreads = useMemo(() => {
    return conversationThreads.filter(thread => {
      if (thread.isGeneral) return true; // always show general/OBO Admin desk
      // Only show application threads that belong to the current user
      const app = (applications || []).find(a => a.id === thread.id);
      if (app) {
        // Match by applicantEmail if available, otherwise trust PermitContext scope
        if (app.applicantEmail && currentUserEmail) {
          return app.applicantEmail === currentUserEmail;
        }
        return true; // PermitContext already filters by user
      }
      // Threads from messages: only if the current user is sender or recipient
      const threadMessages = messages.filter(m => {
        const tid = getMessageThreadId(m);
        return tid === thread.id && (m.senderEmail === currentUserEmail || m.recipientEmail === currentUserEmail);
      });
      return threadMessages.length > 0 || userCreatedThreadIds.includes(thread.id);
    });
  }, [conversationThreads, applications, messages, currentUserEmail, userCreatedThreadIds]);

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
    const threadMsgs = messages.filter(msg => getMessageThreadId(msg) === activeThreadId);
    if (threadMsgs.length === 0 && activeApp && (activeApp.status === "approved" || activeApp.status === "released" || Boolean((activeApp as any).orderOfPaymentNo))) {
      const email = currentUserEmail || "applicant@etayo.gov.ph";
      const synthesized = ensureApplicationConversationMessages([activeApp], email, []);
      if (synthesized.length > 0) {
        return synthesized;
      }
    }
    return threadMsgs;
  }, [messages, activeThreadId, activeApp, currentUserEmail]);

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

        // Auto-register payment proof if applicant sent an image in an approved permit thread
        if (attachedFile && activeApp && (activeApp.status === "approved" || activeApp.status === "released")) {
          try {
            const fileUrl = attachedFile.url || (typeof window !== "undefined" ? localStorage.getItem(`att_${attachedFile.name}`) : "");
            if (fileUrl) {
              localStorage.setItem("etayo_receipt_" + activeApp.id, fileUrl);
            }
            updateApplication({
              ...activeApp,
              userConfirmedPayment: true,
              paymentProofUrl: fileUrl || (activeApp as any).paymentProofUrl,
              datePaymentSubmitted: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
            } as any);
          } catch (e) {}
        }

        // Also trigger Mang Tomas AI response if talking to Mang Tomas / General Desk
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: finalContent,
            history: messages.slice(-6).map(m => ({
              role: m.senderEmail === MANG_TOMAS.email ? "bot" : "user",
              text: m.content
            })),
            userApplications: applications || []
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data && data.reply) {
            const botMsg = {
              id: `mang-tomas-${Date.now()}`,
              senderEmail: MANG_TOMAS.email,
              recipientEmail: currentUserEmail,
              content: data.reply,
              applicationId: activeThreadId,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, botMsg]);
          }
        })
        .catch(err => console.warn("Failed to get Mang Tomas response:", err));

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

      // Auto-register payment proof in offline fallback mode
      if (attachedFile && activeApp && (activeApp.status === "approved" || activeApp.status === "released")) {
        try {
          const fileUrl = attachedFile.url || (typeof window !== "undefined" ? localStorage.getItem(`att_${attachedFile.name}`) : "");
          if (fileUrl) {
            localStorage.setItem("etayo_receipt_" + activeApp.id, fileUrl);
          }
          updateApplication({
            ...activeApp,
            userConfirmedPayment: true,
            paymentProofUrl: fileUrl || (activeApp as any).paymentProofUrl,
            datePaymentSubmitted: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
          } as any);
        } catch (e) {}
      }

      // Call /api/chat for local offline/knowledge base response
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: finalContent,
          history: messages.slice(-6).map(m => ({
            role: m.senderEmail === MANG_TOMAS.email ? "bot" : "user",
            text: m.content
          })),
          userApplications: applications || []
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.reply) {
          const botMsg = {
            id: `mang-tomas-${Date.now()}`,
            senderEmail: MANG_TOMAS.email,
            recipientEmail: currentUserEmail,
            content: data.reply,
            applicationId: activeThreadId,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, botMsg]);
        }
      })
      .catch(() => {});

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
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const uploadHeaders: Record<string, string> = {};
    if (token) uploadHeaders["Authorization"] = `Bearer ${token}`;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/upload`, {
      method: "POST",
      headers: uploadHeaders,
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

  const handleReceiptPhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setReceiptModalFile({ name: file.name, dataUrl });
      try {
        localStorage.setItem(`att_${file.name}`, dataUrl);
      } catch (err) {}
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSendReceiptMessage = async () => {
    if (!receiptModalFile) return;
    setIsSubmittingReceipt(true);
    try {
      const assessedAmt = ((activeApp as any)?.assessedFees || 3795).toLocaleString();
      const opNo = (activeApp as any)?.orderOfPaymentNo || "OP-2026";
      const orRef = receiptRefInput.trim() || `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`;

      const receiptMsgContent = `[Ref: ${activeThreadId} - Payment Receipt] Official payment settled for ${activeThreadId} (Order of Payment Ref: ${opNo}, Amount: PHP ${assessedAmt}).\nOfficial Receipt / Reference: ${orRef}.\nAttached is the photo of my payment receipt for municipal verification.\n[Attachment: ${receiptModalFile.name}|${receiptModalFile.dataUrl}]`;

      // 1. Dispatch message
      await dispatchPermitMessage({
        applicationId: activeThreadId,
        recipientEmail: MANG_TOMAS.email,
        senderEmail: currentUserEmail,
        content: receiptMsgContent
      });

      // 2. Cache receipt in localStorage for fast lookup across pages
      try {
        localStorage.setItem(`etayo_receipt_${activeThreadId}`, receiptModalFile.dataUrl);
        localStorage.setItem(`att_${receiptModalFile.name}`, receiptModalFile.dataUrl);
      } catch (e) {}

      // 3. Update application in context
      if (updateApplication && activeApp) {
        await updateApplication({
          ...activeApp,
          userConfirmedPayment: true,
          paymentProofUrl: receiptModalFile.dataUrl,
          paymentProofFileName: receiptModalFile.name,
          paymentReference: orRef,
          datePaymentSubmitted: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
        } as any);
      }

      setReceiptModalFile(null);
      setReceiptRefInput("");
    } catch (err) {
      console.error("Error sending receipt", err);
    } finally {
      setIsSubmittingReceipt(false);
    }
  };

  return (
    <div className="dashboard-page animate-fade-in-up" style={{ minHeight: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
      {/* PAGE HEADER */}
      <header className="page-header" style={{ 
        background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.9)",
        boxShadow: "0 4px 18px rgba(0, 0, 0, 0.05)",
        borderRadius: "16px",
        padding: "0.75rem 1.5rem",
        marginBottom: "0.75rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.2rem" }}>
              <span style={{
                background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
                color: "white",
                padding: "2px 8px",
                borderRadius: "5px",
                fontSize: "0.7rem",
                fontWeight: "800",
                letterSpacing: "0.5px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}>
                <Landmark size={11} />
                LGU SANTO TOMAS
              </span>
              <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: "600" }}>
                • Office of the Building Official (OBO)
              </span>
            </div>
            <h1 className="page-title" style={{ fontSize: "1.45rem", fontWeight: "800", background: "linear-gradient(90deg, #021a4f 0%, #0038A8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0, letterSpacing: "-0.02em" }}>
              Messages &amp; Helpdesk
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Live Status Pill */}
            <div style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "5px 12px",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.02)"
            }}>
              <span style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: connected ? "#16a34a" : "#eab308",
                boxShadow: connected ? "0 0 0 3px rgba(22, 163, 74, 0.2)" : "none",
                display: "inline-block"
              }} />
              <span style={{ fontSize: "0.78rem", fontWeight: "700", color: connected ? "#15803d" : "#854d0e" }}>
                {connected ? "Helpdesk Connected" : "Connecting..."}
              </span>
            </div>

            {/* Quick Track Link */}
            <Link
              href="/applicant/track"
              style={{
                background: "#f1f5f9",
                color: "#334155",
                fontSize: "0.8rem",
                fontWeight: "700",
                padding: "6px 12px",
                borderRadius: "9px",
                border: "1px solid #cbd5e1",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                textDecoration: "none",
                transition: "all 0.15s ease"
              }}
            >
              <FileText size={14} color="#475569" />
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
          borderRadius: "18px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 6px 25px rgba(0,0,0,0.05)",
          overflow: "hidden",
          height: "calc(100vh - 160px)",
          minHeight: "560px"
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
                  color: "#0038A8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <MessageSquare size={17} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>
                    My Conversations
                  </h3>
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                    {myConversationThreads.length} {myConversationThreads.length === 1 ? "thread" : "threads"}
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
                  background: "linear-gradient(135deg, #0038A8 0%, #021a4f 100%)",
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
            {myConversationThreads.map(thread => {
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
            padding: "0.75rem 1.25rem",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#ffffff",
            flexWrap: "wrap",
            gap: "0.6rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #0038A8 0%, #021a4f 100%)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                boxShadow: "0 2px 8px rgba(0, 56, 168, 0.25)",
                flexShrink: 0
              }}>
                <Building2 size={20} />
                <span style={{
                  position: "absolute",
                  bottom: "-2px",
                  right: "-2px",
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#16a34a",
                  border: "2px solid #ffffff"
                }} />
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: "800", color: "#0f172a" }}>
                    {activeThreadId !== "general" ? `OBO Permitting Desk • ${activeThreadId}` : "OBO Admin Desk (Mang Tomas)"}
                  </h3>
                  <span style={{
                    background: activeThreadId !== "general" ? "#eff6ff" : "#e0e7ff",
                    color: activeThreadId !== "general" ? "#1e40af" : "#4338ca",
                    fontSize: "0.66rem",
                    fontWeight: "800",
                    padding: "2px 7px",
                    borderRadius: "6px"
                  }}>
                    {activeThreadId !== "general" ? "Official OBO Record" : "General Helpdesk"}
                  </span>
                </div>
                <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "1px" }}>
                  {activeThreadId !== "general" ? "Engr. Gilbert Cruz • Municipal Building Official" : "Mang Tomas • FAQs & Procedures"} • <span style={{ color: "#16a34a", fontWeight: "700" }}>● Online</span>
                </div>
              </div>
            </div>

            {/* Active Thread Context Badge & Hotline */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {activeThreadId !== "general" && activeApp ? (
                <div style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "4px 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span style={{ fontSize: "0.76rem", color: "#334155", fontWeight: "700" }}>
                    {activeApp.projectName || activeThread.title}
                  </span>
                  <span style={{
                    fontSize: "0.66rem",
                    fontWeight: "800",
                    background: activeApp.status === "released" ? "#dcfce7" : (activeApp.status === "approved" ? "#dcfce7" : "#fef3c7"),
                    color: activeApp.status === "released" ? "#15803d" : (activeApp.status === "approved" ? "#166534" : "#b45309"),
                    padding: "2px 8px",
                    borderRadius: "999px",
                    textTransform: "uppercase"
                  }}>
                    {activeApp.status}
                  </span>
                  <Link
                    href={`/applicant/track/${encodeURIComponent(activeApp.id)}`}
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: "700",
                      color: "#2563eb",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px"
                    }}
                    title="Track application progress"
                  >
                    <span>Track</span>
                    <ExternalLink size={10} />
                  </Link>
                </div>
              ) : null}

              <div style={{
                fontSize: "0.74rem",
                color: "#64748b",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                padding: "5px 9px",
                borderRadius: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}>
                <Phone size={12} color="#2563eb" />
                <span style={{ fontWeight: "600" }}>(045) 961-4157</span>
              </div>
            </div>
          </div>

          {/* SLIM NOTICE BANNER (Takes only 34px instead of 180px!) */}
          {activeApp && activeApp.status === "approved" && (
            <div style={{
              padding: "7px 1.25rem",
              background: (activeApp as any).userConfirmedPayment ? "#f0fdf4" : "#fffbeb",
              borderBottom: `1px solid ${(activeApp as any).userConfirmedPayment ? "#bbf7d0" : "#fde68a"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              fontSize: "0.8rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CreditCard size={15} color={(activeApp as any).userConfirmedPayment ? "#16a34a" : "#d97706"} />
                <span style={{ fontWeight: "700", color: (activeApp as any).userConfirmedPayment ? "#166534" : "#92400e" }}>
                  Order of Payment: PHP {((activeApp as any).assessedFees || 3795).toLocaleString()} ({(activeApp as any).orderOfPaymentNo || "OP-2026"})
                </span>
                <span style={{ color: "#94a3b8" }}>•</span>
                <span style={{ color: (activeApp as any).userConfirmedPayment ? "#15803d" : "#78350f" }}>
                  {(activeApp as any).userConfirmedPayment
                    ? "Receipt submitted. Awaiting municipal admin verification to release permit."
                    : "Settle at Municipal Treasury and send a photo of your receipt in this chat."}
                </span>
              </div>
            </div>
          )}

          {activeApp && activeApp.status === "released" && (
            <div style={{
              padding: "7px 1.25rem",
              background: "#f0fdf4",
              borderBottom: "1px solid #bbf7d0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              fontSize: "0.8rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span style={{ fontWeight: "700", color: "#166534" }}>
                  Official Permits Released (OR #{(activeApp as any).officialReceiptNo || "Verified"})
                </span>
                <span style={{ color: "#94a3b8" }}>•</span>
                <span style={{ color: "#15803d" }}>All approved documents and clearances are ready for download.</span>
              </div>
              <Link
                href={`/applicant/track/${encodeURIComponent(activeApp.id)}`}
                style={{
                  background: "#16a34a",
                  color: "white",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.74rem",
                  fontWeight: "700",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <span>View Downloads</span>
                <ExternalLink size={11} />
              </Link>
            </div>
          )}

          {/* QUICK INQUIRY CHIPS (Only shown on General Desk) */}
          {activeThreadId === "general" && (
            <div style={{
              padding: "7px 1.25rem",
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
                    padding: "3px 11px",
                    fontSize: "0.74rem",
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
          )}

          {/* MESSAGES FEED AREA FOR ACTIVE THREAD */}
          <div 
            ref={messagesContainerRef}
            className="chat-messages"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "1rem 1.5rem",
              background: "#f8fafc",
              display: "flex",
              flexDirection: "column",
              gap: "0.85rem"
            }}
          >
            {/* THREAD CONTEXT DIVIDER (Clean, modern 22px line instead of 120px card) */}
            {activeThreadId !== "general" && activeApp ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                margin: "4px 0 10px 0"
              }}>
                <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                <span style={{
                  fontSize: "0.72rem",
                  fontWeight: "700",
                  color: "#475569",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "999px",
                  padding: "3px 12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                }}>
                  <ShieldCheck size={12} color="#16a34a" /> Official Municipal Archive • Ref: {activeApp.id}
                </span>
                <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
              </div>
            ) : null}

            {activeThreadId === "general" && activeThreadMessages.length === 0 && (
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
                    background: "linear-gradient(135deg, #0038A8 0%, #021a4f 100%)",
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
                    boxShadow: "0 4px 12px rgba(0, 56, 168, 0.35)"
                  }}
                >
                  <Plus size={16} /> Start Conversation for Application
                </button>
              </div>
            )}

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
                      width: "36px",
                      height: "36px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #0038A8 0%, #021a4f 100%)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "9px",
                      flexShrink: 0,
                      marginTop: "3px",
                      boxShadow: "0 2px 8px rgba(0, 56, 168, 0.25)"
                    }}>
                      <Building2 size={18} />
                    </div>
                  )}

                  {(() => {
                    const isNotice = !isMe && (
                      msg.content?.includes("OFFICIAL NOTICE: APPLICATION APPROVED") ||
                      msg.content?.includes("ORDER OF PAYMENT ISSUED") ||
                      msg.content?.includes("PAYMENT VERIFIED & OFFICIAL PERMITS RELEASED") ||
                      msg.content?.includes("PERMITS RELEASED")
                    );

                    return (
                      <div style={{
                        maxWidth: isNotice ? "680px" : "82%",
                        width: isNotice ? "100%" : "auto",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMe ? "flex-end" : "flex-start"
                      }}>
                        {!isMe && (
                          <span style={{ fontSize: "0.74rem", color: "#475569", fontWeight: "800", marginBottom: "3px", marginLeft: "4px" }}>
                            {msg.actualSender || "OBO Admin • Municipal Building Official"}
                          </span>
                        )}

                        <div style={{
                          padding: isNotice ? "0" : "0.85rem 1.25rem",
                          borderRadius: isNotice ? "14px" : (isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px"),
                          background: isNotice
                            ? "transparent"
                            : (isMe 
                                ? "linear-gradient(135deg, #0038A8 0%, #021a4f 100%)" 
                                : "#ffffff"),
                          color: isMe ? "#ffffff" : "#1e293b",
                          border: isNotice ? "none" : (isMe ? "none" : "1px solid #e2e8f0"),
                          boxShadow: isNotice ? "none" : (isMe ? "0 4px 14px rgba(0, 56, 168, 0.25)" : "0 2px 8px rgba(0,0,0,0.03)"),
                          fontSize: "0.93rem",
                          lineHeight: "1.55"
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
                    );
                  })()}
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
                onFocus={(e) => { e.currentTarget.style.borderColor = "#0038A8"; e.currentTarget.style.background = "#ffffff"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; }}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={isSending || (!inputMessage.trim() && !attachedFile)}
                style={{
                  background: "linear-gradient(135deg, #0038A8 0%, #021a4f 100%)",
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
                  boxShadow: (inputMessage.trim() || attachedFile) ? "0 4px 12px rgba(0, 56, 168, 0.4)" : "none",
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
                    background: "linear-gradient(135deg, #0038A8 0%, #021a4f 100%)",
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
                    boxShadow: "0 4px 12px rgba(0, 56, 168, 0.35)"
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

      {/* RECEIPT CONFIRMATION MODAL */}
      {receiptModalFile && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          padding: "1rem"
        }}>
          <div style={{
            background: "white",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "500px",
            padding: "1.75rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Receipt size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>
                    Send Payment Receipt Photo
                  </h3>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    Attach proof of payment to this conversation for admin review
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReceiptModalFile(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Photo Preview Container */}
            <div style={{
              background: "#0f172a",
              borderRadius: "14px",
              overflow: "hidden",
              marginBottom: "1.25rem",
              border: "1.5px solid #cbd5e1",
              maxHeight: "260px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <img
                src={receiptModalFile.dataUrl}
                alt="Selected Receipt"
                style={{ width: "100%", maxHeight: "260px", objectFit: "contain", display: "block" }}
              />
            </div>

            {/* Reference Input */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                Official Receipt (OR) / GCash Reference No:
              </label>
              <input
                type="text"
                value={receiptRefInput}
                onChange={(e) => setReceiptRefInput(e.target.value)}
                placeholder="e.g. OR-2026-94812 or GCash 001928374"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "0.9rem",
                  color: "#0f172a",
                  fontWeight: "700"
                }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setReceiptModalFile(null)}
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  padding: "8px 16px",
                  fontSize: "0.88rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  color: "#475569"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendReceiptMessage}
                disabled={isSubmittingReceipt}
                style={{
                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  padding: "8px 20px",
                  fontSize: "0.9rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.35)"
                }}
              >
                <Send size={16} />
                <span>{isSubmittingReceipt ? "Sending Receipt..." : "Send Receipt Photo"}</span>
              </button>
            </div>
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
