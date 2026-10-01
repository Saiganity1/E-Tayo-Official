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
import { formatPhilippineTime, formatPhilippineDate, formatPhilippineDateTime } from "@/utils/philippineTime";
import { usePermitContext } from "../../../../context/PermitContext";
import { dispatchPermitMessage, ensureApplicationConversationMessages, getAuthoritativePermitFee, SystemPermitMessage } from "../../../../utils/permitMessaging";
import { 
  groupApplicationsIntoProjectDossiers, 
  areAppsInSameProject, 
  isLocationalClearance, 
  isBuildingPermit, 
  isApplicationApproved,
  isApplicationReleased,
  ProjectDossier 
} from "@/utils/projectGrouping";
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
  id: string; // Canonical application ID (e.g. "APP-2026-1061" or primary ID)
  title: string; // Project Name (e.g. "Paul Second Floor house")
  subtitle?: string; // Linked IDs (e.g. "LC-2026-4157 • APP-2026-1061")
  permitType?: string;
  status?: string;
  lastMessage?: string;
  lastTimestamp?: string;
  applicationIds: string[];
  applications: any[];
  primaryApp?: any;
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

  // Categorized Conversation State (defaults to empty/initialRef, never generic OBO admin desk)
  const [activeThreadId, setActiveThreadId] = useState<string>(initialRef || "");
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
      if (matchedId.toLowerCase() === "general") return knownAppIds[0] || "";
      return matchedId;
    }
    // Check if content contains any known application ID
    for (const appId of knownAppIds) {
      if (content.includes(appId)) {
        return appId;
      }
    }
    return knownAppIds[0] || "";
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

        const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
        fetch(`${rawApi}/api/messages/history?user1=${encodeURIComponent(email)}&user2=${encodeURIComponent(MANG_TOMAS.email)}`)
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

        // Setup WebSocket with secure wss:// fallback to deployed backend
        let wsUrl = process.env.NEXT_PUBLIC_WS_URL;
        if (!wsUrl || !wsUrl.trim()) {
          wsUrl = rawApi.startsWith("https://")
            ? rawApi.replace(/^https:\/\//, "wss://") + "/ws"
            : (rawApi.startsWith("http://") ? rawApi.replace(/^http:\/\//, "ws://") + "/ws" : "wss://e-tayo-official-by0b.onrender.com/ws");
        }
        if (typeof window !== 'undefined' && window.location.protocol === 'https:' && wsUrl.startsWith("ws://")) {
          wsUrl = wsUrl.replace(/^ws:\/\//, 'wss://');
        }
        if (!wsUrl.endsWith('/ws')) {
          wsUrl = wsUrl.replace(/\/+$/, '') + '/ws';
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
                try {
                  const raw = localStorage.getItem("etayo_messages_history");
                  const cur: any[] = raw ? JSON.parse(raw) : [];
                  if (!cur.some(m => m.id && m.id === receivedMessage.id)) {
                    localStorage.setItem("etayo_messages_history", JSON.stringify([...cur, receivedMessage]));
                  }
                } catch (e) {}
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

  // Derive full categorized conversation threads (1 conversation per group project dossier - NO OBO Admin desk)
  const conversationThreads = useMemo(() => {
    const threadMap: Record<string, ConversationThread> = {};

    // 1. Filter applications for current user if email exists
    const userApps = (applications || []).filter(app => {
      if (app.applicantEmail && currentUserEmail) {
        return app.applicantEmail === currentUserEmail;
      }
      return true;
    });

    const targetApps = userApps.length > 0 ? userApps : (applications || []);

    // 2. Group into Project Dossiers (e.g. groups Locational Clearance & Building Permit of same project into 1 thread)
    const dossiers = groupApplicationsIntoProjectDossiers(targetApps);

    dossiers.forEach(dossier => {
      const apps = dossier.applications || [];
      if (apps.length === 0) return;

      // Prefer Building Permit as primary, or the first app
      const bpApp = apps.find(a => isBuildingPermit(a));
      const lcApp = apps.find(a => isLocationalClearance(a));
      const primaryApp = bpApp || apps[0];
      const primaryId = primaryApp.id;

      const appIds = apps.map(a => a.id);
      const isApproved = apps.some(a => a.status === "approved" || isApplicationApproved(a) || Boolean((a as any).orderOfPaymentNo));
      const isReleased = apps.every(a => a.status === "released" || isApplicationReleased(a));

      let overallStatus = primaryApp.status || "pending";
      if (isReleased) {
        overallStatus = "released";
      } else if (isApproved) {
        overallStatus = "approved";
      }

      const defaultLastMsg = isReleased
        ? "🎉 Official Permits Released"
        : isApproved
          ? "💰 Order of Payment issued"
          : "Application filed and queued";

      const subtitleIds = appIds.join(" • ");
      const permitTypeLabel = apps.length > 1
        ? "Unified Group Project (LC + BP)"
        : (isLocationalClearance(primaryApp) ? "Locational Clearance" : "Building Permit (PD 1096)");

      threadMap[primaryId] = {
        id: primaryId,
        title: dossier.projectName || primaryApp.projectName || primaryId,
        subtitle: subtitleIds,
        permitType: permitTypeLabel,
        status: overallStatus,
        lastMessage: defaultLastMsg,
        applicationIds: appIds,
        applications: apps,
        primaryApp
      };
    });

    // 3. Include any user-created standalone thread IDs not already in dossiers (exclude 'general')
    userCreatedThreadIds.forEach(id => {
      if (id === "general") return;
      const alreadyIncluded = Object.values(threadMap).some(t => t.applicationIds?.includes(id) || t.id === id);
      if (!alreadyIncluded) {
        const found = (applications || []).find(a => a.id === id);
        threadMap[id] = {
          id,
          title: found?.projectName || id,
          subtitle: id,
          permitType: found?.permitType === "locational_clearance" ? "Locational Clearance" : "Building Permit",
          status: found?.status || "In Review",
          applicationIds: [id],
          applications: found ? [found] : [],
          primaryApp: found
        };
      }
    });

    // 4. Populate latest message & timestamp from messages
    messages.forEach(msg => {
      const msgThreadId = getMessageThreadId(msg);
      if (msgThreadId === "general") return;

      const matchedThread = Object.values(threadMap).find(t => 
        t.applicationIds?.includes(msgThreadId) || 
        t.id === msgThreadId ||
        (msg.applicationId && t.applicationIds?.includes(msg.applicationId)) ||
        (msg.content && t.applicationIds?.some(aid => msg.content.includes(aid)))
      );

      if (matchedThread) {
        const cleanContent = msg.content?.replace(/\[Ref:\s*[^\]]+\]\s*/i, "").replace(/\[Attachment:\s*[^\]]+\]/gi, "[Attachment]").trim();
        if (!matchedThread.lastTimestamp || new Date(msg.timestamp).getTime() > new Date(matchedThread.lastTimestamp).getTime()) {
          matchedThread.lastMessage = cleanContent || "New message";
          matchedThread.lastTimestamp = msg.timestamp;
        }
      }
    });

    let list = Object.values(threadMap);

    // Sort: active thread first, then by latest timestamp
    list.sort((a, b) => {
      const isAActive = a.id === activeThreadId || a.applicationIds?.includes(activeThreadId);
      const isBActive = b.id === activeThreadId || b.applicationIds?.includes(activeThreadId);
      if (isAActive) return -1;
      if (isBActive) return 1;
      if (a.lastTimestamp && b.lastTimestamp) {
        return new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime();
      }
      if (a.lastTimestamp) return -1;
      if (b.lastTimestamp) return 1;
      return 0;
    });

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.id.toLowerCase().includes(q) || 
        (t.subtitle && t.subtitle.toLowerCase().includes(q)) ||
        t.applicationIds?.some(aid => aid.toLowerCase().includes(q))
      );
    }

    return list;
  }, [applications, messages, userCreatedThreadIds, activeThreadId, searchQuery, currentUserEmail]);

  const myConversationThreads = conversationThreads;

  // Handle URL ref parameter (e.g. ?ref=LC-2026-4157 from track page)
  useEffect(() => {
    if (initialRef) {
      const matched = conversationThreads.find(t => t.id === initialRef || t.applicationIds?.includes(initialRef));
      if (matched) {
        setActiveThreadId(matched.id);
      } else {
        setActiveThreadId(initialRef);
      }
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
    } else if (!activeThreadId || activeThreadId === "general") {
      if (conversationThreads.length > 0) {
        setActiveThreadId(conversationThreads[0].id);
      }
    }
  }, [initialRef, currentUserEmail, conversationThreads, activeThreadId]);

  // Synchronize official notices and payment messages for any approved applications
  useEffect(() => {
    if (applications && applications.length > 0) {
      setMessages(prev => {
        const email = currentUserEmail || "applicant@etayo.gov.ph";
        const synced = ensureApplicationConversationMessages(applications, email, prev);
        const hasContentChanged = synced.some((sm, idx) => prev[idx]?.content !== sm.content);
        if (synced.length !== prev.length || hasContentChanged) {
          return synced;
        }
        return prev;
      });
    }

    const handleFeesSync = () => {
      if (applications && applications.length > 0) {
        setMessages(prev => {
          const email = currentUserEmail || "applicant@etayo.gov.ph";
          return ensureApplicationConversationMessages(applications, email, prev);
        });
      }
    };
    window.addEventListener("etayo_fees_updated", handleFeesSync);
    window.addEventListener("storage", handleFeesSync);
    return () => {
      window.removeEventListener("etayo_fees_updated", handleFeesSync);
      window.removeEventListener("storage", handleFeesSync);
    };
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

  // Current active thread object (guaranteed to never be 'general')
  const activeThread = useMemo(() => {
    return conversationThreads.find(t => t.id === activeThreadId || t.applicationIds?.includes(activeThreadId)) || conversationThreads[0] || {
      id: activeThreadId || "active",
      title: "Permit Project",
      subtitle: "",
      applicationIds: activeThreadId ? [activeThreadId] : [],
      applications: []
    };
  }, [conversationThreads, activeThreadId]);

  // Associated active application object (prefer one with active order of payment awaiting payment)
  const activeApp = useMemo(() => {
    const apps = activeThread?.applications || [];
    if (apps.length === 0) {
      return (applications || []).find(a => a.id === activeThreadId) || null;
    }
    const awaitingPay = apps.find(a => (a.status === "approved" || isApplicationApproved(a)) && !a.isReleased && a.status !== "released");
    if (awaitingPay) return awaitingPay;

    const bp = apps.find(a => isBuildingPermit(a));
    if (bp) return bp;

    return apps[0];
  }, [activeThread, applications, activeThreadId]);

  // Filter messages for active thread (unified timeline for all linked applications in the project)
  const activeThreadMessages = useMemo(() => {
    const targetIds = activeThread?.applicationIds && activeThread.applicationIds.length > 0
      ? activeThread.applicationIds
      : (activeThreadId ? [activeThreadId] : []);

    if (targetIds.length === 0) return [];

    let threadMsgs = messages.filter(msg => {
      const msgTid = getMessageThreadId(msg);
      if (targetIds.includes(msgTid)) return true;
      if (msg.applicationId && targetIds.includes(msg.applicationId)) return true;
      if (msg.content && targetIds.some(tid => msg.content.includes(tid))) return true;
      return false;
    });

    if (threadMsgs.length === 0 && activeThread?.applications && activeThread.applications.length > 0) {
      const email = currentUserEmail || "applicant@etayo.gov.ph";
      const synthesized = ensureApplicationConversationMessages(activeThread.applications, email, []);
      if (synthesized.length > 0) {
        threadMsgs = synthesized;
      }
    }

    // Deduplicate duplicate receipts: If the user sent their own receipt photo or message in this thread, drop synthetic auto-receipt-${appId}
    const hasManualReceipt = threadMsgs.some(m => 
      !String(m?.id || "").startsWith("auto-receipt-") && 
      (m.content?.includes("[Attachment:") || m.content?.includes("payment-receipt") || m.content?.includes("Official payment settled"))
    );
    if (hasManualReceipt) {
      threadMsgs = threadMsgs.filter(m => !String(m?.id || "").startsWith("auto-receipt-"));
    }

    // Deduplicate identical duplicate message IDs or exact contents
    const seen = new Set<string>();
    threadMsgs = threadMsgs.filter(m => {
      const key = `${m.id || ''}-${(m.content || '').slice(0, 50)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Strictly chronological sort: by timestamp ascending, with logical ordering tie-breaker
    return threadMsgs.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;
      const getPriority = (m: any) => {
        if (m.content?.includes("ORDER OF PAYMENT") || m.content?.includes("APPLICATION APPROVED")) return 1;
        if (m.content?.includes("Payment Receipt") || m.content?.includes("[Attachment:")) return 2;
        if (m.content?.includes("PERMITS RELEASED") || m.content?.includes("PAYMENT VERIFIED")) return 3;
        return 2;
      };
      return getPriority(a) - getPriority(b);
    });
  }, [messages, activeThreadId, activeThread, currentUserEmail]);

  // Send message handler
  const handleSendMessage = (contentToSend?: string) => {
    const rawContent = (contentToSend !== undefined ? contentToSend : inputMessage).trim();
    if (!rawContent && !attachedFile) return;

    let finalContent = rawContent;
    const targetRefId = activeApp?.id || activeThread?.id || activeThreadId;
    const projName = activeThread?.title || activeApp?.projectName || "Permit Project";
    finalContent = `[Ref: ${targetRefId} - ${projName}] ${finalContent}`;

    if (attachedFile) {
      finalContent = `${finalContent}\n[Attachment: ${attachedFile.name}|${attachedFile.url}]`;
    }

    const payload = {
      senderEmail: currentUserEmail,
      recipientEmail: MANG_TOMAS.email,
      content: finalContent,
      applicationId: targetRefId
    };

    const targetAppForPayment = activeThread?.applications.find(a => (a.status === "approved" || isApplicationApproved(a)) && !a.paymentVerified) 
      || activeApp 
      || activeThread?.primaryApp;

    const localMsg: SystemPermitMessage = {
      id: `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      senderEmail: currentUserEmail,
      recipientEmail: MANG_TOMAS.email,
      content: finalContent,
      applicationId: targetRefId,
      timestamp: new Date().toISOString()
    };

    // Immediately persist locally so chats NEVER disappear on reload or re-render
    try {
      const raw = localStorage.getItem("etayo_messages_history");
      const curList: SystemPermitMessage[] = raw ? JSON.parse(raw) : [];
      if (!curList.some(m => m.id === localMsg.id)) {
        localStorage.setItem("etayo_messages_history", JSON.stringify([...curList, localMsg]));
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("etayo_new_message", { detail: localMsg }));
      }
    } catch (e) {}

    setMessages(prev => {
      if (prev.some(m => m.id === localMsg.id)) return prev;
      return [...prev, localMsg];
    });

    if (stompClient.current && connected) {
      setIsSending(true);
      try {
        stompClient.current.publish({
          destination: "/app/chat.sendMessage",
          body: JSON.stringify(payload),
        });

        if (attachedFile && targetAppForPayment && (targetAppForPayment.status === "approved" || targetAppForPayment.status === "released")) {
          try {
            const fileUrl = attachedFile.url || (typeof window !== "undefined" ? localStorage.getItem(`att_${attachedFile.name}`) : "");
            if (fileUrl) {
              localStorage.setItem("etayo_receipt_" + targetAppForPayment.id, fileUrl);
            }
            updateApplication({
              ...targetAppForPayment,
              userConfirmedPayment: true,
              paymentProofUrl: fileUrl || undefined,
              paymentProofFileName: attachedFile.name,
              datePaymentSubmitted: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
            } as any);
          } catch (e) {}
        }

        setInputMessage("");
        setAttachedFile(null);
      } catch (err) {
        console.error("Failed to send message via WebSocket", err);
      } finally {
        setIsSending(false);
      }
    } else {
      // Fallback
      dispatchPermitMessage(payload).then(newMsg => {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id || m.id === localMsg.id)) {
            return prev.map(m => m.id === localMsg.id ? newMsg : m);
          }
          return [...prev, newMsg];
        });

        if (attachedFile && targetAppForPayment && (targetAppForPayment.status === "approved" || targetAppForPayment.status === "released")) {
          try {
            const fileUrl = attachedFile.url || (typeof window !== "undefined" ? localStorage.getItem(`att_${attachedFile.name}`) : "");
            if (fileUrl) {
              localStorage.setItem("etayo_receipt_" + targetAppForPayment.id, fileUrl);
            }
            updateApplication({
              ...targetAppForPayment,
              userConfirmedPayment: true,
              paymentProofUrl: fileUrl || undefined,
              paymentProofFileName: attachedFile.name,
              datePaymentSubmitted: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
            } as any);
          } catch (e) {}
        }

        setInputMessage("");
        setAttachedFile(null);
      });
    }
  };

  // Start new conversation modal handler
  const handleStartConversationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const defaultId = conversationThreads[0]?.id || (applications && applications.length > 0 ? applications[0].id : "");
    const targetId = modalSelectedAppId || defaultId;
    
    // Switch to this thread
    if (targetId) {
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

    fetch("/api/upload", {
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
      const targetApp = activeThread?.applications.find(a => (a.status === "approved" || isApplicationApproved(a)) && !a.paymentVerified) 
        || activeApp 
        || activeThread?.primaryApp;
      const targetId = targetApp?.id || activeThreadId;
      const isLC = isLocationalClearance(targetApp);
      const permitTitle = isLC ? "Locational Clearance (MPDO)" : "Building Permit (OBO PD 1096)";
      const cleanSeq = targetId ? targetId.replace(/^[A-Za-z]+-/i, "") : "2026";
      const authoritativeFee = getAuthoritativePermitFee(targetApp, targetId);
      const assessedAmt = authoritativeFee.toLocaleString();
      const storedOp = typeof window !== "undefined" ? (localStorage.getItem(`etayo_op_${targetId}`) || localStorage.getItem(`etayo_op_${String(targetId).toLowerCase()}`)) : null;
      const opNo = (targetApp as any)?.orderOfPaymentNo || storedOp || `OP-${cleanSeq}`;
      const orRef = receiptRefInput.trim() || `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`;

      const receiptMsgContent = `[Ref: ${targetId} - Payment Receipt] Official payment settled for ${permitTitle} (${targetId}) - Order of Payment Ref: ${opNo}, Amount: PHP ${assessedAmt}.\nOfficial Receipt / Reference: ${orRef}.\nAttached is the photo of my payment receipt for municipal verification.\n[Attachment: ${receiptModalFile.name}|${receiptModalFile.dataUrl}]`;

      // 1. Dispatch message
      await dispatchPermitMessage({
        applicationId: targetId,
        recipientEmail: MANG_TOMAS.email,
        senderEmail: currentUserEmail,
        content: receiptMsgContent
      });

      // 2. Cache receipt in localStorage for fast lookup across pages
      try {
        localStorage.setItem(`etayo_receipt_${targetId}`, receiptModalFile.dataUrl);
        localStorage.setItem(`att_${receiptModalFile.name}`, receiptModalFile.dataUrl);
      } catch (e) {}

      // 3. Update application in context
      if (updateApplication && targetApp) {
        await updateApplication({
          ...targetApp,
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
                  setModalSelectedAppId(conversationThreads[0]?.id || "");
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
              const isActive = thread.id === activeThreadId || Boolean(thread.applicationIds?.includes(activeThreadId));
              const formattedTime = thread.lastTimestamp 
                ? formatPhilippineTime(thread.lastTimestamp) 
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
                    gap: "5px"
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
                        background: isActive ? "#2563eb" : (thread.status === "approved" || thread.status === "released" ? "#16a34a" : "#3b82f6"),
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

                  {/* Badges for permits in this unified project dossier */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                      {thread.applications && thread.applications.length > 0 ? (
                        thread.applications.map(app => {
                          const isLC = isLocationalClearance(app);
                          return (
                            <span 
                              key={app.id} 
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: "700",
                                color: isLC ? "#6d28d9" : "#1e40af",
                                background: isLC ? "#f5f3ff" : "#eff6ff",
                                border: `1px solid ${isLC ? "#ddd6fe" : "#bfdbfe"}`,
                                padding: "1px 5px",
                                borderRadius: "5px",
                                fontFamily: "monospace"
                              }}
                              title={`${isLC ? "Locational Clearance (MPDO)" : "Building Permit (OBO)"} (${app.id})`}
                            >
                              {isLC ? "LC" : "BP"}: {app.id}
                            </span>
                          );
                        })
                      ) : (
                        <span style={{
                          fontSize: "0.72rem",
                          fontWeight: "700",
                          color: "#2563eb",
                          background: "#eff6ff",
                          padding: "1px 6px",
                          borderRadius: "6px",
                          fontFamily: "monospace"
                        }}>
                          {thread.id}
                        </span>
                      )}
                    </div>

                    {thread.status && (
                      <span style={{
                        fontSize: "0.66rem",
                        fontWeight: "700",
                        color: thread.status === "approved" || thread.status === "released" ? "#15803d" : "#b45309",
                        background: thread.status === "approved" || thread.status === "released" ? "#dcfce7" : "#fef3c7",
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
                    OBO Permitting Desk • {activeThread.title || activeThread.id}
                  </h3>
                  <span style={{
                    background: "#eff6ff",
                    color: "#1e40af",
                    fontSize: "0.66rem",
                    fontWeight: "800",
                    padding: "2px 7px",
                    borderRadius: "6px"
                  }}>
                    {activeThread.applications && activeThread.applications.length > 1 ? "Unified Project (LC + BP)" : "Official OBO Record"}
                  </span>
                </div>
                <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "1px" }}>
                  Engr. Gilbert Cruz (OBO) & Arch. Ramos (MPDO Zoning) • <span style={{ color: "#16a34a", fontWeight: "700" }}>● Online</span>
                </div>
              </div>
            </div>

            {/* Active Applications Context & Hotline */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {activeThread.applications && activeThread.applications.length > 0 ? (
                activeThread.applications.map(app => {
                  const isLC = isLocationalClearance(app);
                  const isAppApproved = app.status === "approved" || isApplicationApproved(app);
                  const isAppReleased = app.status === "released" || isApplicationReleased(app);
                  return (
                    <div 
                      key={app.id}
                      style={{
                        background: isLC ? "#faf5ff" : "#f8fafc",
                        border: `1px solid ${isLC ? "#e9d5ff" : "#e2e8f0"}`,
                        borderRadius: "8px",
                        padding: "3px 8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <span style={{ 
                        fontSize: "0.68rem", 
                        fontWeight: "800", 
                        color: isLC ? "#7e22ce" : "#1e40af", 
                        fontFamily: "monospace" 
                      }}>
                        {isLC ? "LC" : "BP"}: {app.id}
                      </span>
                      <span style={{
                        fontSize: "0.64rem",
                        fontWeight: "800",
                        background: isAppReleased ? "#dcfce7" : (isAppApproved ? "#dcfce7" : "#fef3c7"),
                        color: isAppReleased ? "#15803d" : (isAppApproved ? "#166534" : "#b45309"),
                        padding: "1px 6px",
                        borderRadius: "999px",
                        textTransform: "uppercase"
                      }}>
                        {isAppReleased ? "Released" : (isAppApproved ? "Approved" : app.status)}
                      </span>
                      <Link
                        href={`/applicant/track/${encodeURIComponent(app.id)}`}
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: "700",
                          color: "#2563eb",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "2px"
                        }}
                        title={`Track ${app.id}`}
                      >
                        <span>Track</span>
                        <ExternalLink size={10} />
                      </Link>
                    </div>
                  );
                })
              ) : activeApp ? (
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

          {/* SLIM NOTICE BANNERS (One per approved application in project with detailed breakdown) */}
          {(() => {
            const approvedApps = (activeThread.applications || []).filter(a => a.status === "approved" || isApplicationApproved(a));
            if (approvedApps.length === 0 && activeApp && (activeApp.status === "approved" || isApplicationApproved(activeApp))) {
              approvedApps.push(activeApp);
            }
            if (approvedApps.length === 0) return null;

            return approvedApps.map(app => {
              const isLC = isLocationalClearance(app);
              const feeNum = getAuthoritativePermitFee(app, app.id);
              const cleanSeq = app?.id ? app.id.replace(/^[A-Za-z]+-/i, "") : "2026";
              const storedOp = typeof window !== "undefined" ? (localStorage.getItem(`etayo_op_${app.id}`) || localStorage.getItem(`etayo_op_${String(app.id).toLowerCase()}`)) : null;
              const opNo = (app as any).orderOfPaymentNo || storedOp || `OP-${cleanSeq}`;
              const isConfirmed = Boolean((app as any).userConfirmedPayment);
              const permitLabel = isLC ? "Locational Clearance (MPDO)" : "Building Permit (OBO PD 1096)";

              return (
                <div 
                  key={app.id}
                  style={{
                    padding: "7px 1.25rem",
                    background: isConfirmed ? "#f0fdf4" : (isLC ? "#faf5ff" : "#fffbeb"),
                    borderBottom: `1px solid ${isConfirmed ? "#bbf7d0" : (isLC ? "#e9d5ff" : "#fde68a")}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    fontSize: "0.8rem",
                    flexWrap: "wrap"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <CreditCard size={15} color={isConfirmed ? "#16a34a" : (isLC ? "#7c3aed" : "#d97706")} />
                    <span style={{ 
                      fontWeight: "800", 
                      color: isConfirmed ? "#166534" : (isLC ? "#6b21a8" : "#92400e") 
                    }}>
                      {permitLabel} Order of Payment: PHP {feeNum.toLocaleString()} ({opNo})
                    </span>
                    <span style={{ color: "#94a3b8" }}>•</span>
                    <span style={{ color: isConfirmed ? "#15803d" : (isLC ? "#7e22ce" : "#78350f") }}>
                      {isConfirmed
                        ? `Receipt submitted for ${app.id}. Awaiting municipal admin verification.`
                        : `Settle fee for ${app.id} at Municipal Treasury and upload receipt photo here.`}
                    </span>
                  </div>

                  {!isConfirmed && (
                    <button
                      type="button"
                      onClick={() => {
                        receiptFileInputRef.current?.click();
                      }}
                      style={{
                        background: isLC ? "#7c3aed" : "#d97706",
                        color: "white",
                        border: "none",
                        padding: "3px 9px",
                        borderRadius: "6px",
                        fontSize: "0.72rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <ImageIcon size={12} />
                      <span>Upload Receipt</span>
                    </button>
                  )}
                </div>
              );
            });
          })()}

          {/* PERMIT RELEASED BANNERS */}
          {(() => {
            const releasedApps = (activeThread.applications || []).filter(a => a.status === "released" || isApplicationReleased(a));
            if (releasedApps.length === 0 && activeApp && (activeApp.status === "released" || isApplicationReleased(activeApp))) {
              releasedApps.push(activeApp);
            }
            if (releasedApps.length === 0) return null;

            return releasedApps.map(app => {
              const isLC = isLocationalClearance(app);
              const label = isLC ? "Official Locational Clearance Released" : "Official Building Permit Released (PD 1096)";
              return (
                <div 
                  key={`rel-${app.id}`}
                  style={{
                    padding: "7px 1.25rem",
                    background: "#f0fdf4",
                    borderBottom: "1px solid #bbf7d0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    fontSize: "0.8rem",
                    flexWrap: "wrap"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={16} color="#16a34a" />
                    <span style={{ fontWeight: "700", color: "#166534" }}>
                      {label} • {app.id} (OR #{(app as any).officialReceiptNo || "Verified"})
                    </span>
                    <span style={{ color: "#94a3b8" }}>•</span>
                    <span style={{ color: "#15803d" }}>Clearances ready for download.</span>
                  </div>
                  <Link
                    href={`/applicant/track/${encodeURIComponent(app.id)}`}
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
              );
            });
          })()}

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
            {/* THREAD CONTEXT DIVIDER */}
            {activeApp || activeThread ? (
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
                  <ShieldCheck size={12} color="#16a34a" /> Official Municipal Permitting Record • {activeThread.subtitle || activeThread.id}
                </span>
                <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
              </div>
            ) : null}

            {activeThreadMessages.length === 0 && (
              <div style={{
                margin: "auto",
                maxWidth: "460px",
                textAlign: "center",
                padding: "2rem 1.5rem",
                background: "#ffffff",
                borderRadius: "18px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.02)"
              }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #0038A8 0%, #021a4f 100%)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 0.85rem auto",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)"
                }}>
                  <Building2 size={26} />
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.35rem 0" }}>
                  {activeThread.title || "Project Permitting Channel"}
                </h3>
                <p style={{ margin: "0 0 0.5rem 0", color: "#64748b", fontSize: "0.84rem", lineHeight: "1.5" }}>
                  Official communication channel for {activeThread.subtitle || activeThread.id}. Send your inquiries, follow-ups, or payment receipts directly to the Municipal Permitting Officers.
                </p>
              </div>
            )}

            {/* MESSAGES LIST */}
            {activeThreadMessages.map((msg, idx) => {
              const isMe = msg.senderEmail === currentUserEmail;
              const timeStr = formatPhilippineTime(msg.timestamp);

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
                        maxWidth: isNotice ? "680px" : "480px",
                        width: isNotice ? "100%" : "fit-content",
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
                placeholder={`Ask OBO Permitting Desk regarding [${activeThread.title || activeThreadId}]...`}
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
              <span>Categorized Project Thread: <strong>{activeThread.title}</strong></span>
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
                    Start Project Conversation
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                    Select a project dossier to start or switch to its unified permitting thread.
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
                  Select Project Dossier to Inquire About:
                </label>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "250px", overflowY: "auto", paddingRight: "4px" }}>
                  {(() => {
                    const dossiers = groupApplicationsIntoProjectDossiers(applications || []);
                    if (dossiers.length === 0) {
                      return (
                        <div style={{ padding: "1rem", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                          No applications found to start a conversation.
                        </div>
                      );
                    }
                    return dossiers.map(dossier => {
                      const apps = dossier.applications || [];
                      const primaryApp = apps.find(a => isBuildingPermit(a)) || apps[0];
                      const primaryId = primaryApp?.id || "";
                      const isSelected = modalSelectedAppId === primaryId || apps.some(a => a.id === modalSelectedAppId);

                      return (
                        <div
                          key={dossier.id || primaryId}
                          onClick={() => setModalSelectedAppId(primaryId)}
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
                                {dossier.projectName || primaryId}
                              </div>
                              <div style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: "monospace" }}>
                                {apps.map(a => `${isLocationalClearance(a) ? "LC" : "BP"}: ${a.id}`).join(" • ")}
                              </div>
                            </div>
                          </div>

                          <span style={{
                            fontSize: "0.7rem",
                            fontWeight: "700",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: apps.some(a => a.status === "approved" || a.status === "released") ? "#dcfce7" : "#fef3c7",
                            color: apps.some(a => a.status === "approved" || a.status === "released") ? "#15803d" : "#b45309",
                            textTransform: "capitalize",
                            flexShrink: 0
                          }}>
                            {apps.length > 1 ? `${apps.length} Permits (LC+BP)` : (primaryApp?.status || "Active")}
                          </span>
                        </div>
                      );
                    });
                  })()}
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

            {/* Assessed Regulatory Fee & OP Badge */}
            {(() => {
              const targetApp = activeThread?.applications.find(a => (a.status === "approved" || isApplicationApproved(a)) && !a.paymentVerified) 
                || activeApp 
                || activeThread?.primaryApp;
              const targetId = targetApp?.id || activeThreadId;
              const isLC = isLocationalClearance(targetApp);
              const feeNum = getAuthoritativePermitFee(targetApp, targetId);
              const cleanSeq = targetId ? targetId.replace(/^[A-Za-z]+-/i, "") : "2026";
              const storedOp = typeof window !== "undefined" ? (localStorage.getItem(`etayo_op_${targetId}`) || localStorage.getItem(`etayo_op_${String(targetId).toLowerCase()}`)) : null;
              const opNo = (targetApp as any)?.orderOfPaymentNo || storedOp || `OP-${cleanSeq}`;
              const permitLabel = isLC ? "Locational Clearance (MPDO)" : "Building Permit (OBO PD 1096)";

              return (
                <div style={{
                  background: isLC ? "#f5f3ff" : "#f0fdf4",
                  border: `1.5px solid ${isLC ? "#ddd6fe" : "#bbf7d0"}`,
                  borderRadius: "12px",
                  padding: "10px 14px",
                  marginBottom: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: isLC ? "#6d28d9" : "#166534", fontWeight: "800", textTransform: "uppercase", display: "block" }}>
                      {permitLabel} • {targetId}
                    </span>
                    <strong style={{ fontSize: "1.15rem", color: isLC ? "#4c1d95" : "#14532d", fontWeight: "900" }}>
                      PHP {feeNum.toLocaleString()}
                    </strong>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.72rem", color: isLC ? "#6d28d9" : "#166534", fontWeight: "700", display: "block" }}>
                      Order of Payment Reference
                    </span>
                    <span style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: "700", color: isLC ? "#7c3aed" : "#15803d" }}>
                      {opNo}
                    </span>
                  </div>
                </div>
              );
            })()}

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
