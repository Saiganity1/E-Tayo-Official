"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Send, User, Clock, ShieldCheck, Landmark, CheckCircle2, MessageSquare, 
  Search, Paperclip, Sparkles, FileText, ChevronRight, Phone, Info, 
  AlertCircle, X, HelpCircle, Building2, Flame, MapPin, CheckCheck, 
  RefreshCw, BadgeCheck, Compass, ExternalLink, Plus, MessageSquarePlus,
  Layers, Filter, ArrowLeft, CreditCard, Receipt, Image as ImageIcon,
  Briefcase, Inbox, Check, ChevronDown
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

const CANNED_INQUIRIES = [
  {
    id: "docs_received",
    label: "📋 Documents Verified",
    text: "Good day! May I clarify if our submitted permit requirements have been formally received and verified by technical staff?"
  },
  {
    id: "inspection_sched",
    label: "🔍 Inspection Notice",
    text: "Notice inquiry: When is the next scheduled on-site municipal engineering and zoning inspection for our project?"
  },
  {
    id: "deficiency",
    label: "⚠️ Incomplete Items",
    text: "Good day. We have reviewed the checklist remarks and are uploading the updated engineering plans and clearances."
  },
  {
    id: "approved",
    label: "✅ Clearance Approved",
    text: "Thank you for the evaluation update! May we confirm if our Order of Payment has been endorsed to the treasury?"
  },
  {
    id: "payment",
    label: "💳 Payment Ready",
    text: "Official Payment Notice: We have settled the required regulatory fees at the Municipal Treasury. Attached is our receipt."
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
  
  const { applications, updateApplication, refreshApplications } = usePermitContext();

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
  const [mobileView, setMobileView] = useState<"list" | "chat">(initialRef ? "chat" : "list");
  const [searchQuery, setSearchQuery] = useState("");
  const [userCreatedThreadIds, setUserCreatedThreadIds] = useState<string[]>(initialRef ? [initialRef] : []);
  const [showStartModal, setShowStartModal] = useState(false);
  const [modalSelectedAppId, setModalSelectedAppId] = useState<string>("");
  const [modalInitialMessage, setModalInitialMessage] = useState<string>("");
  const lastProcessedRef = useRef<string | null>(null);

  // Collapsible Dossier Sidebar (Default false for 75%+ wide readable chat)
  const [showDossier, setShowDossier] = useState(false);

  // Thread Categorization within Active Conversation (All Messages vs Specific Permit in the Project)
  const [selectedPermitTab, setSelectedPermitTab] = useState<string>("all");

  // Quick Directory Filter Pills
  const [contactFilter, setContactFilter] = useState<"all" | "approved" | "in_review">("all");

  // Top Console Refreshing State
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-expanding textarea composer ref
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Status badge config
  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case "approved":
      case "released":
        return { label: status === "released" ? "Released" : "Approved", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" };
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

  // Payment Receipt Upload in Chat State
  const [receiptModalFile, setReceiptModalFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [receiptRefInput, setReceiptRefInput] = useState("");
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);

  const stompClient = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const receiptFileInputRef = useRef<HTMLInputElement>(null);

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
      if (matchedId.toLowerCase() === "general") return "";
      return matchedId;
    }
    // Check if content contains any known application ID
    for (const appId of knownAppIds) {
      if (content.includes(appId)) {
        return appId;
      }
    }
    return "";
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

    // Sort stably by latest timestamp descending
    list.sort((a, b) => {
      const timeA = a.lastTimestamp ? new Date(a.lastTimestamp).getTime() : 0;
      const timeB = b.lastTimestamp ? new Date(b.lastTimestamp).getTime() : 0;
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return a.title.localeCompare(b.title);
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
  }, [applications, messages, userCreatedThreadIds, searchQuery, currentUserEmail]);

  const myConversationThreads = conversationThreads;

  // Seamlessly switch active conversation thread and update URL without page refresh
  const handleSelectThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setMobileView("chat");
    lastProcessedRef.current = threadId;
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("ref", threadId);
        window.history.replaceState({}, "", url.toString());
      } catch (e) {}
    }
  };

  // Handle URL ref parameter (e.g. ?ref=LC-2026-4157 from track page) without overriding user selections
  useEffect(() => {
    if (initialRef && lastProcessedRef.current !== initialRef) {
      lastProcessedRef.current = initialRef;
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
    } else if ((!activeThreadId || activeThreadId === "general") && conversationThreads.length > 0) {
      const fallbackId = conversationThreads[0].id;
      setActiveThreadId(fallbackId);
      lastProcessedRef.current = fallbackId;
    }
  }, [initialRef, currentUserEmail, conversationThreads]);

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

  const displayedMessages = activeThreadMessages;

  // Filter conversation threads by quick filter pills and search query
  const filteredConversationThreads = useMemo(() => {
    return conversationThreads.filter(thread => {
      if (contactFilter === "approved") {
        const isApprovedOrReleased = thread.status === "approved" || thread.status === "released";
        if (!isApprovedOrReleased) return false;
      } else if (contactFilter === "in_review") {
        const isPending = thread.status !== "approved" && thread.status !== "released";
        if (!isPending) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = thread.title.toLowerCase().includes(q);
        const matchesId = thread.id.toLowerCase().includes(q);
        const matchesSubtitle = thread.subtitle?.toLowerCase().includes(q);
        const matchesApps = thread.applicationIds?.some(id => id.toLowerCase().includes(q));
        if (!matchesTitle && !matchesId && !matchesSubtitle && !matchesApps) {
          return false;
        }
      }

      return true;
    });
  }, [conversationThreads, contactFilter, searchQuery]);

  // KPI stats for top banner
  const myAppsCount = conversationThreads.length;
  const totalPermitsCount = useMemo(() => {
    return (applications || []).filter(a => {
      if (a.applicantEmail && currentUserEmail) {
        return a.applicantEmail.toLowerCase().trim() === currentUserEmail.toLowerCase().trim();
      }
      return true;
    }).length;
  }, [applications, currentUserEmail]);

  // Refresh handler for top console button
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (refreshApplications) {
        await refreshApplications();
      }
    } catch (e) {} finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

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
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
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
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
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
      handleSelectThread(targetId);

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
    <div className="applicant-messages-container animate-fade-in-up" style={{ maxWidth: "1680px", margin: "0 auto", paddingBottom: "1.5rem" }}>
      
      {/* ========================================================================= */}
      {/* 1. TOP CONSOLE BANNER (EXACT ADMIN STYLE WITH KPI STATS & REFRESH)        */}
      {/* ========================================================================= */}
      <header style={{
        background: "linear-gradient(135deg, #0b192c 0%, #1e3e62 100%)",
        borderRadius: "20px",
        padding: "1.2rem 1.75rem",
        color: "#ffffff",
        boxShadow: "0 10px 30px -5px rgba(11, 25, 44, 0.25)",
        marginBottom: "1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1.5rem",
        flexWrap: "wrap",
        border: "1px solid rgba(255, 255, 255, 0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "rgba(255, 255, 255, 0.12)",
            color: "#60a5fa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.15)"
          }}>
            <MessageSquare size={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{
                background: "rgba(255, 255, 255, 0.15)",
                color: "#93c5fd",
                fontSize: "0.68rem",
                fontWeight: "800",
                padding: "2px 8px",
                borderRadius: "6px",
                letterSpacing: "0.05em",
                textTransform: "uppercase"
              }}>
                🏛️ STO. TOMAS OBO &amp; MPDO
              </span>
              <span style={{
                background: connected ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                color: connected ? "#86efac" : "#fca5a5",
                fontSize: "0.68rem",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "6px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: connected ? "#22c55e" : "#ef4444" }} />
                {connected ? "Gateway Online (PHT)" : "STOMP Disconnected"}
              </span>
            </div>
            <h1 style={{ fontSize: "1.45rem", fontWeight: "800", margin: 0, letterSpacing: "-0.01em" }}>
              Permit Communications Console
            </h1>
          </div>
        </div>

        {/* Quick KPI Stats & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            padding: "8px 14px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <User size={16} color="#93c5fd" />
            <div>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: "600" }}>MY APPLICATIONS</div>
              <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#ffffff", lineHeight: 1 }}>{myAppsCount}</div>
            </div>
          </div>

          <div style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            padding: "8px 14px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <FileText size={16} color="#86efac" />
            <div>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: "600" }}>TOTAL PERMITS</div>
              <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#ffffff", lineHeight: 1 }}>{totalPermitsCount}</div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              background: "white",
              border: "none",
              color: "#0f172a",
              padding: "9px 16px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              fontWeight: "700",
              fontSize: "0.85rem",
              cursor: isRefreshing ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "all 0.15s"
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} color="#2563eb" />
            Refresh
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE LAYOUT (290px DIRECTORY + 1FR CHAT [+ 340px DOSSIER])   */}
      {/* ========================================================================= */}
      <div className={`messages-workspace-grid ${mobileView === "chat" ? "show-chat" : "show-list"}`} style={{
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        gap: "1.25rem",
        height: "calc(100vh - 215px)",
        minHeight: "680px",
        transition: "grid-template-columns 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        
        {/* ======================================================================= */}
        {/* LEFT COLUMN: CONVERSATION DIRECTORY & SEARCH                           */}
        {/* ======================================================================= */}
        <div className="messages-directory-col" style={{
          background: "#ffffff",
          borderRadius: "18px",
          border: "1.5px solid #e2e8f0",
          boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.04)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          {/* Directory Header & Search */}
          <div style={{ padding: "1.1rem", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <MessageSquare size={17} color="#2563eb" />
                <h2 style={{ fontSize: "1rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>Conversations</h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{
                  background: "#eff6ff",
                  color: "#2563eb",
                  fontSize: "0.72rem",
                  fontWeight: "700",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  border: "1px solid #bfdbfe"
                }}>
                  {filteredConversationThreads.length}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setModalSelectedAppId(conversationThreads[0]?.id || "");
                    setModalInitialMessage("");
                    setShowStartModal(true);
                  }}
                  style={{
                    background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "3px 8px",
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                    boxShadow: "0 2px 6px rgba(37, 99, 235, 0.2)"
                  }}
                  title="Start a new chat for an application"
                >
                  <Plus size={13} />
                  <span>Start Chat</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative", marginBottom: "8px" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search conversation or permit..."
                style={{
                  width: "100%",
                  padding: "7px 10px 7px 30px",
                  borderRadius: "10px",
                  border: "1.5px solid #e2e8f0",
                  background: "#f8fafc",
                  fontSize: "0.82rem",
                  color: "#0f172a",
                  outline: "none"
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Quick Filter Pills */}
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => setContactFilter("all")}
                style={{
                  padding: "3px 9px",
                  borderRadius: "8px",
                  fontSize: "0.72rem",
                  fontWeight: "700",
                  border: "none",
                  cursor: "pointer",
                  background: contactFilter === "all" ? "#2563eb" : "#f1f5f9",
                  color: contactFilter === "all" ? "#ffffff" : "#64748b"
                }}
              >
                All
              </button>
              <button
                onClick={() => setContactFilter("approved")}
                style={{
                  padding: "3px 9px",
                  borderRadius: "8px",
                  fontSize: "0.72rem",
                  fontWeight: "700",
                  border: "none",
                  cursor: "pointer",
                  background: contactFilter === "approved" ? "#2563eb" : "#f1f5f9",
                  color: contactFilter === "approved" ? "#ffffff" : "#64748b"
                }}
              >
                Approved
              </button>
              <button
                onClick={() => setContactFilter("in_review")}
                style={{
                  padding: "3px 9px",
                  borderRadius: "8px",
                  fontSize: "0.72rem",
                  fontWeight: "700",
                  border: "none",
                  cursor: "pointer",
                  background: contactFilter === "in_review" ? "#2563eb" : "#f1f5f9",
                  color: contactFilter === "in_review" ? "#ffffff" : "#64748b"
                }}
              >
                In Review
              </button>
            </div>
          </div>

          {/* Directory Conversation List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {filteredConversationThreads.length === 0 ? (
              <div style={{ padding: "30px 15px", textAlign: "center", color: "#94a3b8" }}>
                <Inbox size={32} style={{ margin: "0 auto 8px auto", opacity: 0.4 }} />
                <p style={{ fontSize: "0.85rem", fontWeight: "600", margin: "0 0 2px 0" }}>No conversations found</p>
                <p style={{ fontSize: "0.75rem", margin: 0 }}>Try clearing your search query or start a new chat.</p>
              </div>
            ) : (
              filteredConversationThreads.map((thread) => {
                const isSelected = thread.id === activeThread?.id || 
                  thread.id === activeThreadId || 
                  Boolean(thread.applicationIds?.includes(activeThreadId)) ||
                  Boolean(activeThread?.applicationIds?.some(aid => thread.applicationIds?.includes(aid)));
                const latestBadge = getStatusBadge(thread.status);
                const permitCount = thread.applications?.length || thread.applicationIds?.length || 1;

                return (
                  <div
                    key={thread.id}
                    onClick={() => handleSelectThread(thread.id)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "12px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      background: isSelected ? "#eff6ff" : "#ffffff",
                      border: isSelected ? "1.5px solid #3b82f6" : "1px solid #f1f5f9",
                      boxShadow: isSelected ? "0 2px 8px rgba(37, 99, 235, 0.12)" : "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      position: "relative"
                    }}
                  >
                    {/* Active Stripe Indicator */}
                    {isSelected && (
                      <div style={{
                        position: "absolute",
                        left: "0",
                        top: "8px",
                        bottom: "8px",
                        width: "3.5px",
                        background: "#2563eb",
                        borderRadius: "0 4px 4px 0"
                      }} />
                    )}

                    {/* Avatar with Initial */}
                    <div style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: isSelected 
                        ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" 
                        : "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)",
                      color: isSelected ? "#ffffff" : "#334155",
                      fontWeight: "800",
                      fontSize: "0.95rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      {thread.title.charAt(0).toUpperCase()}
                    </div>

                    {/* Thread Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px", marginBottom: "2px" }}>
                        <p style={{
                          margin: 0,
                          fontSize: "0.88rem",
                          fontWeight: "700",
                          color: isSelected ? "#1e40af" : "#0f172a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}>
                          {thread.title}
                        </p>
                        <span style={{
                          fontSize: "0.68rem",
                          fontWeight: "800",
                          background: isSelected ? "#ffffff" : "#f1f5f9",
                          color: isSelected ? "#2563eb" : "#475569",
                          padding: "1px 6px",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                          flexShrink: 0
                        }}>
                          {permitCount} {permitCount === 1 ? "Permit" : "Permits"}
                        </span>
                      </div>

                      <p style={{
                        margin: 0,
                        fontSize: "0.74rem",
                        color: "#64748b",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {thread.permitType || thread.subtitle || thread.id}
                      </p>

                      {/* Primary Application Tag Pill */}
                      <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{
                          fontSize: "0.68rem",
                          fontWeight: "700",
                          background: latestBadge.bg,
                          color: latestBadge.color,
                          border: `1px solid ${latestBadge.border}`,
                          padding: "1px 5px",
                          borderRadius: "5px"
                        }}>
                          {thread.id} · {latestBadge.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* CENTER COLUMN: LIVE CHAT AREA & THREAD TABS                           */}
        {/* ======================================================================= */}
        <div className="messages-chat-col" style={{
          background: "#ffffff",
          borderRadius: "18px",
          border: "1.5px solid #e2e8f0",
          boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.04)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0
        }}>
          {/* Top Chat Header */}
          <div style={{
            padding: "0.9rem 1.4rem",
            borderBottom: "1.5px solid #f1f5f9",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <button
                type="button"
                onClick={() => setMobileView("list")}
                className="mobile-back-to-list-btn"
                aria-label="Back to conversations list"
                style={{
                  display: "none",
                  alignItems: "center",
                  gap: "5px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "10px",
                  padding: "6px 12px",
                  fontSize: "0.82rem",
                  fontWeight: "700",
                  color: "#1d4ed8",
                  cursor: "pointer",
                  marginRight: "4px",
                  flexShrink: 0
                }}
              >
                <ArrowLeft size={16} />
                <span>Chats</span>
              </button>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "800",
                fontSize: "1.1rem",
                boxShadow: "0 3px 8px rgba(37, 99, 235, 0.2)",
                flexShrink: 0
              }}>
                <Building2 size={22} />
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                    {activeThread.title}
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
                    gap: "4px",
                    border: "1px solid #a7f3d0"
                  }}>
                    <BadgeCheck size={12} /> Verified Municipal Helpdesk
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "2px" }}>
                  <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "500" }}>
                    Engr. Gilbert Cruz (OBO) &amp; Arch. Ramos (MPDO Zoning)
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "#cbd5e1" }}>•</span>
                  <span style={{
                    fontSize: "0.78rem",
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
          </div>

          {/* SLIM NOTICE BANNERS (Order of Payment & Clearances Released) */}
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
                        ? `Receipt submitted for ${app.id}. Awaiting municipal verification.`
                        : `Settle fee for ${app.id} at Municipal Treasury and attach receipt photo here.`}
                    </span>
                  </div>

                  {!isConfirmed && (
                    <button
                      type="button"
                      onClick={() => receiptFileInputRef.current?.click()}
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

          {/* MESSAGES FEED AREA */}
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
            {/* THREAD CONTEXT DIVIDER (Matches Admin Dispatch Pill) */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              margin: "6px 0"
            }}>
              <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
              <span style={{
                fontSize: "0.72rem",
                fontWeight: "700",
                color: "#1e40af",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "999px",
                padding: "3px 14px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 1px 3px rgba(37,99,235,0.06)"
              }}>
                <ShieldCheck size={13} color="#2563eb" /> Sto. Tomas Municipal Dispatch (Engr. Gilbert Cruz, Municipal Building Official)
              </span>
              <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            </div>

            {displayedMessages.length === 0 && (
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
                  {activeThread.title || "Permitting Communication Channel"}
                </h3>
                <p style={{ margin: "0 0 0.5rem 0", color: "#64748b", fontSize: "0.84rem", lineHeight: "1.5" }}>
                  Official communication channel for {activeThread.subtitle || activeThread.id}. Send your inquiries, follow-ups, or payment receipts directly to the Municipal Permitting Officers.
                </p>
              </div>
            )}

            {/* MESSAGES LIST */}
            {displayedMessages.map((msg, idx) => {
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
                                ? "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" 
                                : "#ffffff"),
                          color: isMe ? "#ffffff" : "#1e293b",
                          border: isNotice ? "none" : (isMe ? "none" : "1.5px solid #e2e8f0"),
                          boxShadow: isNotice ? "none" : (isMe ? "0 4px 14px rgba(37, 99, 235, 0.2)" : "0 2px 8px rgba(0,0,0,0.03)"),
                          fontSize: "0.96rem",
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

          {/* QUICK INQUIRY SUGGESTIONS BAR (Matches Admin Quick Replies) */}
          <div style={{
            padding: "6px 1.25rem",
            background: "#ffffff",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            overflowX: "auto",
            scrollbarWidth: "none"
          }}>
            <span style={{ fontSize: "0.73rem", fontWeight: "800", color: "#d97706", display: "inline-flex", alignItems: "center", gap: "4px", flexShrink: 0, textTransform: "uppercase" }}>
              <Sparkles size={13} color="#f59e0b" /> Quick Reply:
            </span>
            {CANNED_INQUIRIES.map(cq => (
              <button
                key={cq.id}
                type="button"
                onClick={() => {
                  setInputMessage(cq.text);
                  if (textareaRef.current) textareaRef.current.focus();
                }}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "3px 10px",
                  fontSize: "0.74rem",
                  fontWeight: "600",
                  color: "#334155",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "all 0.12s ease"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "#eff6ff";
                  e.currentTarget.style.borderColor = "#93c5fd";
                  e.currentTarget.style.color = "#1e40af";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.color = "#334155";
                }}
              >
                {cq.label}
              </button>
            ))}
          </div>

          {/* INPUT COMPOSER AREA (Matches Admin Multiline Textarea & Dispatch Button) */}
          <div style={{
            padding: "0.85rem 1.25rem",
            background: "#ffffff",
            borderTop: "1.5px solid #f1f5f9"
          }}>
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
              style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}
            >
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
                title="Attach Document or Receipt"
                style={{
                  background: "#f1f5f9",
                  border: "1.5px solid #cbd5e1",
                  color: "#475569",
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  marginBottom: "2px",
                  transition: "all 0.15s"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"}
                onMouseLeave={e => e.currentTarget.style.background = "#f1f5f9"}
              >
                <Paperclip size={19} />
              </button>

              <div style={{ flex: 1, position: "relative" }}>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputMessage}
                  onChange={e => {
                    setInputMessage(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 130)}px`;
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Type message regarding [${activeThread.title || activeThreadId}]... (Enter to send, Shift+Enter for newline)`}
                  style={{
                    width: "100%",
                    minHeight: "44px",
                    maxHeight: "130px",
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "10px 14px",
                    fontSize: "0.96rem",
                    color: "#0f172a",
                    outline: "none",
                    resize: "none",
                    fontFamily: "inherit",
                    lineHeight: 1.5,
                    transition: "all 0.15s"
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
              </div>

              <button
                type="submit"
                disabled={!connected || (!inputMessage.trim() && !attachedFile)}
                style={{
                  background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "14px",
                  padding: "10px 22px",
                  height: "44px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: "800",
                  fontSize: "0.92rem",
                  cursor: (!connected || (!inputMessage.trim() && !attachedFile)) ? "not-allowed" : "pointer",
                  opacity: (!connected || (!inputMessage.trim() && !attachedFile)) ? 0.45 : 1,
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
                  flexShrink: 0,
                  marginBottom: "2px",
                  transition: "all 0.15s"
                }}
              >
                <span>Dispatch</span>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: COLLAPSIBLE PERMIT DOSSIER PANEL                          */}
        {/* ======================================================================= */}
        {showDossier && (
          <div style={{
            background: "#ffffff",
            borderRadius: "18px",
            border: "1.5px solid #e2e8f0",
            boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.04)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}>
            {/* Dossier Header */}
            <div style={{
              padding: "1.1rem",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Briefcase size={17} color="#2563eb" />
                <h3 style={{ fontSize: "1rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>Permit Dossier</h3>
              </div>
              <button
                onClick={() => setShowDossier(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex" }}
                title="Collapse Panel"
              >
                <X size={18} />
              </button>
            </div>

            {/* Dossier Scrollable Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.1rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              
              {/* Project Card */}
              <div style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                borderRadius: "14px",
                padding: "1.1rem",
                border: "1px solid #e2e8f0"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    color: "white",
                    fontWeight: "800",
                    fontSize: "1.1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 3px 8px rgba(37, 99, 235, 0.2)"
                  }}>
                    {activeThread.title.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>
                      {activeThread.title}
                    </h4>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Unified Municipal Project</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.8rem", color: "#334155" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <User size={13} color="#64748b" />
                    <span style={{ wordBreak: "break-all" }}>{currentUserEmail || "Registered Citizen"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <Building2 size={13} color="#64748b" />
                    <span>{activeThread.permitType || "Permit Project"}</span>
                  </div>
                  {activeApp?.projectAddress && (
                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      <MapPin size={13} color="#64748b" />
                      <span>{activeApp.projectAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Linked Applications Section */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, fontSize: "0.82rem", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Permits on Record ({(activeThread.applications || []).length})
                  </h4>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(activeThread.applications || [activeApp]).filter(Boolean).map((app, aIdx) => {
                    const badge = getStatusBadge(app?.status);
                    const feeNum = getAuthoritativePermitFee(app, app?.id);
                    const isFiltered = selectedPermitTab === app?.id;

                    return (
                      <div
                        key={aIdx}
                        style={{
                          background: isFiltered ? "#eff6ff" : "#ffffff",
                          border: isFiltered ? "1.5px solid #3b82f6" : "1px solid #e2e8f0",
                          borderRadius: "12px",
                          padding: "10px",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
                          transition: "all 0.15s"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "6px", marginBottom: "4px" }}>
                          <div>
                            <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#0f172a", display: "block" }}>
                              {app?.id}
                            </span>
                            <span style={{ fontSize: "0.76rem", fontWeight: "600", color: "#475569" }}>
                              {app?.projectName || activeThread.title}
                            </span>
                          </div>
                          <span style={{
                            fontSize: "0.68rem",
                            fontWeight: "700",
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            padding: "2px 7px",
                            borderRadius: "6px",
                            flexShrink: 0
                          }}>
                            {badge.label}
                          </span>
                        </div>

                        <div style={{ fontSize: "0.74rem", color: "#64748b", marginBottom: "8px", display: "flex", flexDirection: "column", gap: "2px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <Building2 size={12} />
                            <span style={{ textTransform: "capitalize" }}>{app?.permitType?.replace(/_/g, " ") || "Permit"}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <CreditCard size={12} />
                            <span>Assessed Fee: <strong>PHP {feeNum.toLocaleString()}</strong></span>
                          </div>
                        </div>

                        {/* Action Links */}
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => setSelectedPermitTab(app?.id || "all")}
                            style={{
                              flex: 1,
                              padding: "5px 8px",
                              borderRadius: "7px",
                              fontSize: "0.72rem",
                              fontWeight: "700",
                              background: isFiltered ? "#2563eb" : "#f1f5f9",
                              color: isFiltered ? "#ffffff" : "#334155",
                              border: "none",
                              cursor: "pointer"
                            }}
                          >
                            {isFiltered ? "Active Filter" : "Filter Chat"}
                          </button>
                          <Link
                            href={`/applicant/track/${encodeURIComponent(app?.id || "")}`}
                            style={{
                              padding: "5px 8px",
                              borderRadius: "7px",
                              fontSize: "0.72rem",
                              fontWeight: "700",
                              background: "#ffffff",
                              color: "#2563eb",
                              border: "1px solid #bfdbfe",
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
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Municipal Assistance Card */}
              <div style={{
                background: "#f8fafc",
                borderRadius: "14px",
                padding: "1rem",
                border: "1px solid #e2e8f0"
              }}>
                <h5 style={{ margin: "0 0 6px 0", fontSize: "0.82rem", fontWeight: "800", color: "#0f172a" }}>
                  Municipal Permitting Helpdesk
                </h5>
                <p style={{ margin: "0 0 8px 0", fontSize: "0.76rem", color: "#64748b", lineHeight: "1.4" }}>
                  Municipal Building Official (OBO) &amp; MPDO Zoning Administration. Office hours: 8:00 AM – 5:00 PM PHT.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#2563eb", fontWeight: "700" }}>
                  <Phone size={13} />
                  <span>(045) 961-4157</span>
                </div>
              </div>
            </div>
          </div>
        )}
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
