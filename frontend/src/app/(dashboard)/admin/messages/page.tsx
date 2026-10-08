"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Send, User, Clock, Inbox, MessageSquare, Paperclip, X, Search, 
  ShieldCheck, Landmark, CheckCircle2, ChevronRight, Phone, Info, 
  AlertCircle, Building2, MapPin, RefreshCw, BadgeCheck, ExternalLink, 
  Layers, Filter, FileText, Check, ChevronDown, ChevronUp, Sparkles,
  Briefcase, Activity, Calendar, ShieldAlert, Receipt, CreditCard, CheckCircle,
  Image as ImageIcon, ArrowLeft, Maximize2, Minimize2, CornerDownLeft, Eye
} from "lucide-react";
import Link from "next/link";
import { Client } from "@stomp/stompjs";
import { formatPhilippineDateTime, formatPhilippineDate, formatPhilippineTime } from "@/utils/philippineTime";
import { usePermitContext } from "../../../../context/PermitContext";
import { 
  MessageBubbleContent, 
  AttachmentPreviewModal, 
  ParsedAttachment 
} from "../../../../components/chat/ChatAttachmentRenderer";
import { ensureApplicationConversationMessages, dispatchPermitMessage, getAuthoritativePermitFee } from "../../../../utils/permitMessaging";

// Canned official municipal responses for fast staff dispatch
const CANNED_RESPONSES = [
  {
    id: "docs_received",
    label: "Documents Verified",
    text: "Good day. We have received your submitted permit requirements. They are currently queued for technical evaluation by the zoning and building officers."
  },
  {
    id: "inspection_sched",
    label: "Inspection Notice",
    text: "Notice: An on-site municipal engineering and zoning inspection has been scheduled for your property. Please ensure property access is available."
  },
  {
    id: "deficiency",
    label: "Incomplete Items",
    text: "Please be advised that your application requires additional ancillary documentation. Please review the deficiency remarks and upload the requested certified files."
  },
  {
    id: "approved",
    label: "Clearance Approved",
    text: "Good news! Your Locational Clearance has been approved by the Zoning Administrator and endorsed for Order of Payment processing."
  },
  {
    id: "payment",
    label: "Payment Ready",
    text: "Your permit fee assessment has been completed. The official Order of Payment is now available. You may proceed with settlement at the Municipal Treasury."
  }
];

export default function AdminMessagesPage() {
  const { applications, updateApplication, refreshApplications } = usePermitContext();

  const [releaseModalApp, setReleaseModalApp] = useState<any | null>(null);
  const [officialReceiptInput, setOfficialReceiptInput] = useState("");
  const [certifyingCashierInput, setCertifyingCashierInput] = useState("Engr. Gilbert Cruz, Municipal Building Official");
  const [receiptPhotoPreview, setReceiptPhotoPreview] = useState<string | null>(null);
  const [isReleasingPermit, setIsReleasingPermit] = useState(false);

  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserName, setCurrentUserName] = useState("Super Admin");
  const [connected, setConnected] = useState(false);
  const [applicantEmail, setApplicantEmail] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">(applicantEmail ? "chat" : "list");
  const [contacts, setContacts] = useState<string[]>([]);
  const [previewAttachment, setPreviewAttachment] = useState<ParsedAttachment | null>(null);
  const [adminAttachedFile, setAdminAttachedFile] = useState<{ name: string; url: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter in Contacts
  const [searchContact, setSearchContact] = useState("");
  const [contactFilter, setContactFilter] = useState<"all" | "with_permits">("all");

  // Thread Categorization within Selected Applicant's Chat
  const [activeThreadId, setActiveThreadId] = useState<string>("all");
  const [showThreadDropdown, setShowThreadDropdown] = useState(false);
  const threadDropdownRef = useRef<HTMLDivElement>(null);

  // Close thread dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (threadDropdownRef.current && !threadDropdownRef.current.contains(e.target as Node)) {
        setShowThreadDropdown(false);
      }
    };
    if (showThreadDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showThreadDropdown]);

  // Collapsible Dossier Sidebar (Default false for 75%+ wide readable chat)
  const [showDossier, setShowDossier] = useState(false);

  const adminFileInputRef = useRef<HTMLInputElement>(null);
  const stompClient = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to extract thread/application ID from message
  const getMessageThreadId = (msg: any): string => {
    if (msg.applicationId && msg.applicationId !== "all" && msg.applicationId !== "") {
      return msg.applicationId;
    }
    const content = msg.content || "";
    // Match [Ref: LC-2026-4157# - Sicat] or [Ref: LC-2026-4157]
    const refMatch = content.match(/\[Ref:\s*([A-Za-z0-9_#/-]+)(?:\s*[-–—]\s*([^\]]+))?\]/i);
    if (refMatch) {
      const matchedId = refMatch[1].replace(/#$/, "").trim();
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
    const cleanEmail = email.toLowerCase().trim();
    const matchingApps = applications.filter(
      a => a.applicantEmail && a.applicantEmail.toLowerCase().trim() === cleanEmail
    );
    const primaryApp = matchingApps[0];
    const name = primaryApp?.applicantName || cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
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

  // Fetch unique conversations on load with strict deduplication
  const loadConversations = async () => {
    setIsRefreshing(true);
    try {
      let serverContacts: string[] = [];
      // Try local Next.js API first, then rawApi fallback
      try {
        let res = await fetch("/api/messages/conversations?user=staff@etayo.gov.ph").catch(() => null);
        if (!res || !res.ok) {
          const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
          res = await fetch(`${rawApi}/api/messages/conversations?user=staff@etayo.gov.ph`).catch(() => null);
        }
        if (res && res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            serverContacts = data
              .map((c: any) => {
                if (typeof c === "string") return c.trim().toLowerCase();
                if (c && typeof c === "object") {
                  return (c.email || c.applicantEmail || c.senderEmail || c.recipientEmail || "").trim().toLowerCase();
                }
                return "";
              })
              .filter((c: string) => c && c !== "staff@etayo.gov.ph" && c !== "admin@etayo.gov.ph");
          }
        }
      } catch (err) {}
      
      // Also include applicants who have applications in the system
      const appApplicants = (applications || [])
        .map(a => a.applicantEmail?.trim().toLowerCase())
        .filter((e): e is string => Boolean(e) && e !== "staff@etayo.gov.ph" && e !== "admin@etayo.gov.ph");

      // Check localStorage cached applications
      let cachedAppApplicants: string[] = [];
      try {
        const rawCached = localStorage.getItem("etayo_cached_applications");
        if (rawCached) {
          const parsed = JSON.parse(rawCached);
          if (Array.isArray(parsed)) {
            parsed.forEach((a: any) => {
              const em = (a.applicantEmail || "").trim().toLowerCase();
              if (em && em !== "staff@etayo.gov.ph" && em !== "admin@etayo.gov.ph") cachedAppApplicants.push(em);
            });
          }
        }
      } catch (e) {}

      // Check registered users in localStorage
      let registeredApplicants: string[] = [];
      try {
        const rawUsers = localStorage.getItem("etayo_users");
        if (rawUsers) {
          const parsed = JSON.parse(rawUsers);
          if (Array.isArray(parsed)) {
            parsed.forEach((u: any) => {
              const em = (u.email || "").trim().toLowerCase();
              if (em && em !== "staff@etayo.gov.ph" && em !== "admin@etayo.gov.ph" && (u.role === "applicant" || !u.role)) {
                registeredApplicants.push(em);
              }
            });
          }
        }
      } catch (e) {}

      // Check localStorage cached messages for any other applicant emails
      let localApplicants: string[] = [];
      try {
        const raw = localStorage.getItem("etayo_messages_history");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((m: any) => {
              const r = (m.recipientEmail || "").trim().toLowerCase();
              const s = (m.senderEmail || "").trim().toLowerCase();
              if (r && r !== "staff@etayo.gov.ph" && r !== "admin@etayo.gov.ph") localApplicants.push(r);
              if (s && s !== "staff@etayo.gov.ph" && s !== "admin@etayo.gov.ph") localApplicants.push(s);
            });
          }
        }
      } catch (e) {}

      // Unique set of emails
      let uniqueEmails = Array.from(new Set([
        ...serverContacts, 
        ...appApplicants, 
        ...cachedAppApplicants, 
        ...registeredApplicants, 
        ...localApplicants
      ])).filter(Boolean);

      setContacts(uniqueEmails);

      // If no applicant currently selected, select the first one
      setApplicantEmail(curr => {
        if (curr && uniqueEmails.includes(curr.toLowerCase())) return curr.toLowerCase();
        return uniqueEmails.length > 0 ? uniqueEmails[0] : null;
      });
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [applications.length]);

  // STOMP WebSocket initialization and real-time listeners
  useEffect(() => {
    const handleIncomingChatMessage = (receivedMessage: any) => {
      if (!receivedMessage) return;
      const sender = (receivedMessage.senderEmail || "").trim().toLowerCase();
      const recipient = (receivedMessage.recipientEmail || "").trim().toLowerCase();

      const otherParty = sender !== "staff@etayo.gov.ph" && sender !== "admin@etayo.gov.ph"
        ? sender
        : (recipient !== "staff@etayo.gov.ph" && recipient !== "admin@etayo.gov.ph" ? recipient : null);

      if (otherParty) {
        setContacts(prev => {
          const normalized = prev.map(p => p.toLowerCase());
          if (!normalized.includes(otherParty)) {
            return [otherParty, ...prev];
          }
          return prev;
        });
      }

      setApplicantEmail(currentApplicant => {
        const curNorm = currentApplicant?.toLowerCase();
        if (sender === curNorm || recipient === curNorm) {
          setMessages(prev => {
            const exists = prev.some(m => m.id === receivedMessage.id || (m.content === receivedMessage.content && Math.abs(new Date(m.timestamp).getTime() - new Date(receivedMessage.timestamp).getTime()) < 3000));
            if (exists) return prev;
            return [...prev, receivedMessage];
          });
        }
        return currentApplicant;
      });
    };

    // 1. BroadcastChannel listener for cross-tab communication
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel("etayo_chat_channel");
        bc.onmessage = (event) => {
          if (event.data) {
            handleIncomingChatMessage(event.data);
          }
        };
      }
    } catch (err) {}

    // 2. Custom window event listener
    const onCustomMsg = (e: any) => {
      if (e.detail) {
        handleIncomingChatMessage(e.detail);
      }
    };
    window.addEventListener("etayo_new_message", onCustomMsg);

    // 3. Storage event listener
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === "etayo_messages_history" && e.newValue) {
        try {
          const list = JSON.parse(e.newValue);
          if (Array.isArray(list) && list.length > 0) {
            const latest = list[list.length - 1];
            handleIncomingChatMessage(latest);
          }
        } catch (err) {}
      }
    };
    window.addEventListener("storage", onStorageChange);

    // 4. STOMP WebSocket client
    let isMounted = true;
    let connectTimer: NodeJS.Timeout | null = null;
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUserEmail(parsedUser.email || "admin@etayo.gov.ph");
        if (parsedUser.name) setCurrentUserName(parsedUser.name);

        const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
        let wsUrl = process.env.NEXT_PUBLIC_WS_URL;
        if (!wsUrl || !wsUrl.trim()) {
          wsUrl = rawApi.startsWith("https://")
            ? rawApi.replace(/^https:\/\//, "wss://") + "/ws"
            : (rawApi.startsWith("http://") ? rawApi.replace(/^http:\/\//, "ws://") + "/ws" : "wss://e-tayo-official-by0b.onrender.com/ws");
        }
        if (typeof window !== "undefined" && window.location.protocol === "https:" && wsUrl.startsWith("ws://")) {
          wsUrl = wsUrl.replace(/^ws:\/\//, "wss://");
        }
        if (!wsUrl.endsWith("/ws")) {
          wsUrl = wsUrl.replace(/\/+$/, "") + "/ws";
        }

        const client = new Client({
          brokerURL: wsUrl,
          reconnectDelay: 5000,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          connectionTimeout: 10000,
          onConnect: () => {
            console.log("Admin connected to STOMP WebSocket");
            setConnected(true);

            client.subscribe(`/topic/messages/${parsedUser.email}`, (message) => {
              try {
                handleIncomingChatMessage(JSON.parse(message.body));
              } catch (err) {}
            });
            if (parsedUser.email !== "staff@etayo.gov.ph") {
              client.subscribe(`/topic/messages/staff@etayo.gov.ph`, (message) => {
                try {
                  handleIncomingChatMessage(JSON.parse(message.body));
                } catch (err) {}
              });
            }
          },
          onStompError: frame => {
            console.warn("STOMP notice:", frame?.headers?.["message"]);
          },
          onWebSocketClose: () => {
            setConnected(false);
          },
          onWebSocketError: () => {
            setConnected(false);
          }
        });

        connectTimer = setTimeout(() => {
          if (isMounted) {
            client.activate();
            stompClient.current = client;
          }
        }, 150);
      } catch (err) {
        console.error("Error setting up WebSocket client:", err);
      }
    }

    return () => {
      isMounted = false;
      if (connectTimer) clearTimeout(connectTimer);
      if (bc) bc.close();
      window.removeEventListener("etayo_new_message", onCustomMsg);
      window.removeEventListener("storage", onStorageChange);
      if (stompClient.current) {
        const c = stompClient.current;
        stompClient.current = null;
        c.deactivate().catch(() => {});
      }
    };
  }, []);

  // Fetch chat history whenever selected applicant changes, with polling
  useEffect(() => {
    if (applicantEmail) {
      const cleanEmail = applicantEmail.toLowerCase().trim();
      const staffInbox = "staff@etayo.gov.ph";
      const mergeWithLocal = (apiData: any[]) => {
        let localMsgs: any[] = [];
        try {
          const raw = localStorage.getItem("etayo_messages_history");
          if (raw) localMsgs = JSON.parse(raw);
        } catch (e) {}
        const isDummyMsg = (m: any) => {
          if (!m) return true;
          const id = String(m.id || "");
          const content = String(m.content || "");
          const appId = String(m.applicationId || "");
          return id === "seed-msg-1" || appId === "LC-2026-6494" || content.includes("Greetings Mr. Payumo") || content.includes("LC-2026-6494");
        };
        const cleanApi = (apiData || []).filter(m => !isDummyMsg(m));
        const cleanLocal = (localMsgs || []).filter(m => !isDummyMsg(m));
        const merged = [...cleanApi];
        cleanLocal.forEach((lm: any) => {
          const r = (lm.recipientEmail || "").toLowerCase().trim();
          const s = (lm.senderEmail || "").toLowerCase().trim();
          if (
            (r === cleanEmail || s === cleanEmail || !r || r === "applicant@etayo.gov.ph") &&
            !merged.some((m: any) => m.id === lm.id || (m.content === lm.content && Math.abs(new Date(m.timestamp).getTime() - new Date(lm.timestamp).getTime()) < 5000))
          ) {
            merged.push(lm);
          }
        });
        const finalized = ensureApplicationConversationMessages(applications || [], cleanEmail, merged);
        setMessages(finalized);
        setActiveThreadId("all");
      };

      const fetchHistory = async () => {
        try {
          let res = await fetch(`/api/messages/history?user1=${encodeURIComponent(staffInbox)}&user2=${encodeURIComponent(cleanEmail)}`).catch(() => null);
          if (!res || !res.ok) {
            const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
            res = await fetch(`${rawApi}/api/messages/history?user1=${encodeURIComponent(staffInbox)}&user2=${encodeURIComponent(cleanEmail)}`).catch(() => null);
          }
          if (res && res.ok) {
            const data = await res.json();
            mergeWithLocal(Array.isArray(data) ? data : []);
          } else {
            mergeWithLocal([]);
          }
        } catch (err) {
          mergeWithLocal([]);
        }
      };

      fetchHistory();

      // Poll every 3 seconds to guarantee admin receives applicant messages even without WebSocket
      const interval = setInterval(fetchHistory, 3000);
      return () => clearInterval(interval);
    }
  }, [applicantEmail, applications]);

  // Synchronize official notices and payment messages for any approved applications
  useEffect(() => {
    if (applications && applications.length > 0 && applicantEmail) {
      setMessages(prev => {
        const synced = ensureApplicationConversationMessages(applications, applicantEmail, prev);
        if (synced.length !== prev.length) {
          return synced;
        }
        return prev;
      });
    }
  }, [applications, applicantEmail]);

  // Scroll strictly inside messages container
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [activeThreadId, applicantEmail]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages.length]);

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

    fetch("/api/upload", {
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
  const sendMessage = async (e?: React.FormEvent, cannedText?: string) => {
    if (e) e.preventDefault();
    let textToSend = (cannedText || inputMessage).trim();
    if (!textToSend && !adminAttachedFile) return;
    if (!applicantEmail) return;

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

    const newMsg = {
      id: `admin-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      senderEmail: "staff@etayo.gov.ph",
      actualSender: currentUserEmail || "admin@etayo.gov.ph",
      recipientEmail: applicantEmail,
      content: taggedContent,
      applicationId: activeThreadId !== "all" && activeThreadId !== "general" ? activeThreadId : null,
      timestamp: new Date().toISOString()
    };

    // 1. Optimistic append to UI
    setMessages(prev => [...prev, newMsg]);

    // 2. Cache locally to etayo_messages_history
    try {
      const raw = localStorage.getItem("etayo_messages_history");
      const list = raw ? JSON.parse(raw) : [];
      list.push(newMsg);
      localStorage.setItem("etayo_messages_history", JSON.stringify(list));
    } catch (err) {}

    // 3. Broadcast to all open tabs/windows
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("etayo_new_message", { detail: newMsg }));
      try {
        if (typeof BroadcastChannel !== "undefined") {
          const bc = new BroadcastChannel("etayo_chat_channel");
          bc.postMessage(newMsg);
          bc.close();
        }
      } catch (err) {}
    }

    // 4. Send via STOMP WebSocket if connected
    if (stompClient.current && connected) {
      try {
        stompClient.current.publish({
          destination: "/app/chat.sendMessage",
          body: JSON.stringify({
            senderEmail: "staff@etayo.gov.ph",
            actualSender: currentUserEmail,
            recipientEmail: applicantEmail,
            content: taggedContent,
            applicationId: activeThreadId !== "all" && activeThreadId !== "general" ? activeThreadId : null
          })
        });
      } catch (err) {
        console.warn("STOMP publish failed, falling back to HTTP", err);
      }
    }

    // 5. Always POST to /api/messages/send
    fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMsg)
    }).catch(() => {});

    setInputMessage("");
    setAdminAttachedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleConfirmPaymentAndRelease = async () => {
    if (!releaseModalApp) return;
    setIsReleasingPermit(true);
    try {
      const orNumber = officialReceiptInput.trim() || (releaseModalApp as any).paymentReference || `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const releaseDateFormatted = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
      const assessedAmount = getAuthoritativePermitFee(releaseModalApp, releaseModalApp?.id).toLocaleString();

      const updatedTracking = [
        ...(releaseModalApp.trackingSteps || []).map((step: any) => ({ ...step, status: "completed" })),
        {
          title: "Permit Officially Released",
          status: "completed",
          date: releaseDateFormatted,
          notes: `Payment of PHP ${assessedAmount} confirmed under Official Receipt No. ${orNumber}. All official permits and clearances have been RELEASED and made available for applicant download.`
        }
      ];

      const updatedApp = {
        ...releaseModalApp,
        status: "released",
        paymentStatus: "paid",
        officialReceiptNo: orNumber,
        datePaid: releaseDateFormatted,
        dateReleased: releaseDateFormatted,
        certifyingCashier: certifyingCashierInput.trim() || "Engr. Gilbert Cruz, Municipal Building Official",
        trackingSteps: updatedTracking
      };

      if (updateApplication) {
        await updateApplication(updatedApp);
      }

      // Dispatch release notice in the conversation
      const releaseNoticeContent = `[Ref: ${releaseModalApp.id} - Permit Released] Payment Verified! Official Receipt No. ${orNumber} has been verified and confirmed by the Building Official.
All official permit papers, ancillary clearances, and approved plans for ${releaseModalApp.id} have been RELEASED and are now available for download on your tracking dashboard.`;

      await dispatchPermitMessage({
        applicationId: releaseModalApp.id,
        recipientEmail: releaseModalApp.applicantEmail || applicantEmail || "applicant@etayo.gov.ph",
        senderEmail: "staff@etayo.gov.ph",
        content: releaseNoticeContent
      });

      setReleaseModalApp(null);
      setReceiptPhotoPreview(null);
    } catch (err) {
      console.error("Error releasing permit from messages", err);
    } finally {
      setIsReleasingPermit(false);
    }
  };

  // Selected applicant metadata
  const selectedApplicantData = useMemo(() => {
    if (!applicantEmail) return null;
    return getApplicantData(applicantEmail);
  }, [applicantEmail, applications]);

  // Compute all available threads for the active applicant
  const applicantThreads = useMemo(() => {
    if (!selectedApplicantData) return { allCount: 0, generalCount: 0, threads: [] };
    const threadMap = new Map<string, { id: string; title: string; count: number; status?: string; permitType?: string }>();

    // Add applicant's registered permits from context
    selectedApplicantData.applications.forEach(app => {
      threadMap.set(app.id, {
        id: app.id,
        title: app.projectName ? `${app.id} · ${app.projectName}` : app.id,
        count: 0,
        status: app.status,
        permitType: app.permitType
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
    let threadMsgs = activeThreadId === "all" ? messages : messages.filter(msg => {
      const msgThread = getMessageThreadId(msg);
      return msgThread === activeThreadId;
    });

    if (activeThreadId !== "all" && threadMsgs.length === 0) {
      const activeApp = (applications || []).find(a => a.id === activeThreadId);
      if (activeApp && (activeApp.status === "approved" || activeApp.status === "released" || Boolean((activeApp as any).orderOfPaymentNo))) {
        const synthesized = ensureApplicationConversationMessages([activeApp], applicantEmail || "applicant@etayo.gov.ph", []);
        if (synthesized.length > 0) return synthesized;
      }
    }
    return threadMsgs;
  }, [messages, activeThreadId, applications, applicantEmail]);

  // Filter contacts list by search and category
  const filteredContacts = useMemo(() => {
    return contacts.filter(email => {
      const data = getApplicantData(email);
      const s = searchContact.toLowerCase().trim();
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

  // Status badge config (Cohesive Black & Blue Palette)
  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case "approved":
      case "released":
        return { label: status === "released" ? "Released" : "Approved", bg: "#eff6ff", color: "#0038A8", border: "#bfdbfe" };
      case "under_review":
        return { label: "Under Review", bg: "#f8fafc", color: "#0f172a", border: "#cbd5e1" };
      case "incomplete_requirements":
        return { label: "Needs Revision", bg: "#f8fafc", color: "#334155", border: "#cbd5e1" };
      case "rejected":
        return { label: "Disapproved", bg: "#f1f5f9", color: "#0f172a", border: "#94a3b8" };
      default:
        return { label: "Pending", bg: "#f8fafc", color: "#475569", border: "#e2e8f0" };
    }
  };

  // Helper for grouping messages by date in Philippine Standard Time
  const getDateLabel = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      const today = new Date();
      const dStr = d.toLocaleDateString("en-US", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric" });
      const todayStr = today.toLocaleDateString("en-US", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric" });
      if (dStr === todayStr) return "Today";
      return dStr;
    } catch (e) {
      return "Conversation";
    }
  };

  // Find active permit object if a specific thread is selected
  const activePermitApp = useMemo(() => {
    if (activeThreadId === "all" || activeThreadId === "general") return null;
    return applications.find(a => a.id === activeThreadId) || null;
  }, [activeThreadId, applications]);

  return (
    <div className="admin-messages-container animate-fade-in-up" style={{ maxWidth: "1680px", margin: "0 auto", paddingBottom: "1.5rem" }}>
      
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE MUNICIPAL BANNER & HEADER */}
      {/* ========================================================================= */}
      <header className="page-header" style={{
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.92))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.9)",
        boxShadow: "0 10px 35px rgba(0, 0, 0, 0.08)",
        borderRadius: "20px",
        padding: "1.25rem 1.75rem",
        marginBottom: "1.25rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1.5rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "50px",
            height: "50px",
            borderRadius: "16px",
            background: "#eff6ff",
            color: "#0038A8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1.5px solid #bfdbfe",
            boxShadow: "0 2px 8px rgba(0, 56, 168, 0.08)",
            flexShrink: 0
          }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
              <span style={{
                background: "#eff6ff",
                color: "#1d4ed8",
                padding: "3px 10px",
                borderRadius: "8px",
                fontSize: "0.72rem",
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                border: "1px solid #bfdbfe",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}>
                <Landmark size={12} /> Sto. Tomas OBO
              </span>
              <span style={{
                background: connected ? "#f0fdf4" : "#fef2f2",
                color: connected ? "#16a34a" : "#dc2626",
                padding: "3px 10px",
                borderRadius: "8px",
                fontSize: "0.72rem",
                fontWeight: "700",
                border: `1px solid ${connected ? "#bbf7d0" : "#fecaca"}`,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <span style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: connected ? "#16a34a" : "#dc2626",
                  boxShadow: connected ? "0 0 6px #16a34a" : "none"
                }} />
                {connected ? "Gateway Online (PHT)" : "Reconnecting STOMP..."}
              </span>
            </div>
            <h1 style={{
              fontSize: "1.75rem",
              fontWeight: "800",
              margin: 0,
              letterSpacing: "-0.02em",
              background: "linear-gradient(90deg, #021a4f 0%, #0038A8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "#0038A8"
            }}>
              Permit Communications Console
            </h1>
          </div>
        </div>

        {/* Quick KPI Stats & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            padding: "8px 16px",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)"
          }}>
            <User size={18} color="#0038A8" />
            <div>
              <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.03em" }}>CITIZENS</div>
              <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "#0f172a", lineHeight: 1 }}>{contacts.length}</div>
            </div>
          </div>

          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            padding: "8px 16px",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)"
          }}>
            <FileText size={18} color="#059669" />
            <div>
              <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.03em" }}>TOTAL PERMITS</div>
              <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "#0f172a", lineHeight: 1 }}>{applications.length}</div>
            </div>
          </div>

          <button
            onClick={() => {
              loadConversations();
              refreshApplications();
            }}
            disabled={isRefreshing}
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#1e293b",
              padding: "10px 18px",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              fontWeight: "700",
              fontSize: "0.88rem",
              cursor: isRefreshing ? "not-allowed" : "pointer",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
              transition: "all 0.15s ease"
            }}
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} color="#0038A8" />
            Refresh
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE LAYOUT (290px DIRECTORY + 1FR CHAT [+ 340px DOSSIER]) */}
      {/* ========================================================================= */}
      <div className={`messages-workspace-grid ${mobileView === "chat" ? "show-chat" : "show-list"}`} style={{
        display: "grid",
        gridTemplateColumns: showDossier ? "290px 1fr 340px" : "290px 1fr",
        gap: "1.25rem",
        height: "calc(100vh - 215px)",
        minHeight: "680px",
        transition: "grid-template-columns 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        
        {/* ======================================================================= */}
        {/* LEFT COLUMN: CITIZEN DIRECTORY & SEARCH */}
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
                <h2 style={{ fontSize: "1rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>Citizens</h2>
              </div>
              <span style={{
                background: "#eff6ff",
                color: "#2563eb",
                fontSize: "0.72rem",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "10px",
                border: "1px solid #bfdbfe"
              }}>
                {filteredContacts.length}
              </span>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative", marginBottom: "8px" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="text"
                value={searchContact}
                onChange={e => setSearchContact(e.target.value)}
                placeholder="Search citizen or permit..."
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
              {searchContact && (
                <button
                  onClick={() => setSearchContact("")}
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
                onClick={() => setContactFilter("with_permits")}
                style={{
                  padding: "3px 9px",
                  borderRadius: "8px",
                  fontSize: "0.72rem",
                  fontWeight: "700",
                  border: "none",
                  cursor: "pointer",
                  background: contactFilter === "with_permits" ? "#2563eb" : "#f1f5f9",
                  color: contactFilter === "with_permits" ? "#ffffff" : "#64748b"
                }}
              >
                With Permits
              </button>
            </div>
          </div>

          {/* Directory Contact List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {filteredContacts.length === 0 ? (
              <div style={{ padding: "30px 15px", textAlign: "center", color: "#94a3b8" }}>
                <Inbox size={32} style={{ margin: "0 auto 8px auto", opacity: 0.4 }} />
                <p style={{ fontSize: "0.85rem", fontWeight: "600", margin: "0 0 2px 0" }}>No citizens found</p>
                <p style={{ fontSize: "0.75rem", margin: 0 }}>Try clearing your search query.</p>
              </div>
            ) : (
              filteredContacts.map((email, idx) => {
                const data = getApplicantData(email);
                const isSelected = applicantEmail?.toLowerCase().trim() === email.toLowerCase().trim();
                const latestBadge = getStatusBadge(data.latestStatus);

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setApplicantEmail(email);
                      setMobileView("chat");
                    }}
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

                    {/* Avatar with Initials */}
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
                      {data.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Contact Info */}
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
                          {data.name}
                        </p>
                        {data.applications.length > 0 && (
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
                            {data.applications.length} {data.applications.length === 1 ? "Permit" : "Permits"}
                          </span>
                        )}
                      </div>

                      <p style={{
                        margin: 0,
                        fontSize: "0.74rem",
                        color: "#64748b",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {email}
                      </p>

                      {/* Primary Application Tag Pill if available */}
                      {data.applications.length > 0 && (
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
                width: "64px",
                height: "64px",
                borderRadius: "20px",
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
                boxShadow: "0 6px 14px -3px rgba(37, 99, 235, 0.15)"
              }}>
                <Landmark size={32} />
              </div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0" }}>
                Santo Tomas Permitting Helpdesk
              </h2>
              <p style={{ fontSize: "0.92rem", color: "#64748b", maxWidth: "420px", margin: "0 0 1.25rem 0", lineHeight: 1.5 }}>
                Select an applicant from the left directory to review their inquiries, evaluate permits, and dispatch official notices.
              </p>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#f1f5f9",
                padding: "7px 14px",
                borderRadius: "10px",
                fontSize: "0.8rem",
                color: "#475569",
                fontWeight: "600"
              }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: connected ? "#22c55e" : "#ef4444" }} />
                {connected ? "Gateway Online (Philippine Time)" : "Connecting STOMP..."}
              </div>
            </div>
          ) : (
            <>
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
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setMobileView("list")}
                    className="mobile-back-to-list-btn"
                    aria-label="Back to citizens list"
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
                    <span>Citizens</span>
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
                    {selectedApplicantData.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
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
                        gap: "4px",
                        border: "1px solid #a7f3d0"
                      }}>
                        <BadgeCheck size={12} /> Verified Citizen
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "2px" }}>
                      <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "500" }}>{applicantEmail}</span>
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

                {/* Right Header Actions: Thread Filter Button + Permit Records Button */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", position: "relative" }}>
                  {/* Thread Dropdown Button */}
                  <div style={{ position: "relative" }} ref={threadDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowThreadDropdown(prev => !prev)}
                      style={{
                        background: showThreadDropdown || activeThreadId !== "all" ? "#eff6ff" : "#f8fafc",
                        border: showThreadDropdown || activeThreadId !== "all" ? "1.5px solid #3b82f6" : "1.5px solid #e2e8f0",
                        color: activeThreadId !== "all" ? "#1d4ed8" : "#334155",
                        padding: "8px 14px",
                        borderRadius: "11px",
                        fontSize: "0.84rem",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        boxShadow: showThreadDropdown ? "0 2px 8px rgba(59, 130, 246, 0.2)" : "none"
                      }}
                      title="Filter conversations by permit thread"
                    >
                      <Layers size={15} color={activeThreadId !== "all" ? "#2563eb" : "#64748b"} />
                      <span>Thread</span>
                      {activeThreadId !== "all" ? (
                        <span style={{
                          background: "#2563eb",
                          color: "#ffffff",
                          padding: "1px 7px",
                          borderRadius: "8px",
                          fontSize: "0.72rem",
                          fontWeight: "800",
                          maxWidth: "110px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {activeThreadId}
                        </span>
                      ) : (
                        <span style={{
                          background: "#e2e8f0",
                          color: "#475569",
                          padding: "1px 6px",
                          borderRadius: "8px",
                          fontSize: "0.72rem",
                          fontWeight: "800"
                        }}>
                          {applicantThreads.allCount}
                        </span>
                      )}
                      <ChevronDown size={14} style={{ transform: showThreadDropdown ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
                    </button>

                    {/* Popover Dropdown Menu */}
                    {showThreadDropdown && (
                      <div style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        right: 0,
                        zIndex: 100,
                        background: "#ffffff",
                        border: "1.5px solid #e2e8f0",
                        borderRadius: "14px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
                        width: "320px",
                        padding: "6px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px"
                      }}>
                        <div style={{
                          padding: "8px 10px 4px 10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}>
                          <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Filter by Thread
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                            {applicantThreads.threads.length} {applicantThreads.threads.length === 1 ? "Permit" : "Permits"}
                          </span>
                        </div>

                        {/* All Messages Option */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveThreadId("all");
                            setShowThreadDropdown(false);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: "9px",
                            border: activeThreadId === "all" ? "1px solid #bfdbfe" : "1px solid transparent",
                            background: activeThreadId === "all" ? "#eff6ff" : "transparent",
                            color: activeThreadId === "all" ? "#1d4ed8" : "#334155",
                            cursor: "pointer",
                            fontSize: "0.82rem",
                            fontWeight: activeThreadId === "all" ? "700" : "600",
                            textAlign: "left",
                            transition: "background 0.15s"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Layers size={14} color={activeThreadId === "all" ? "#2563eb" : "#64748b"} />
                            <span>All Messages</span>
                          </div>
                          <span style={{
                            background: activeThreadId === "all" ? "#dbeafe" : "#f1f5f9",
                            color: activeThreadId === "all" ? "#1e40af" : "#64748b",
                            padding: "2px 7px",
                            borderRadius: "6px",
                            fontSize: "0.72rem",
                            fontWeight: "800"
                          }}>
                            {applicantThreads.allCount}
                          </span>
                        </button>

                        <div style={{ height: "1px", background: "#f1f5f9", margin: "4px 0" }} />

                        {/* Thread List Header */}
                        {applicantThreads.threads.length > 0 && (
                          <div style={{ padding: "4px 10px 2px 10px", fontSize: "0.68rem", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase" }}>
                            Permit Applications
                          </div>
                        )}

                        {/* Permit Threads */}
                        <div style={{ maxHeight: "240px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "3px" }}>
                          {applicantThreads.threads.map(thread => {
                            const isSelected = activeThreadId === thread.id;
                            const statusBadge = getStatusBadge(thread.status);
                            return (
                              <button
                                key={thread.id}
                                type="button"
                                onClick={() => {
                                  setActiveThreadId(thread.id);
                                  setShowThreadDropdown(false);
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  width: "100%",
                                  padding: "8px 10px",
                                  borderRadius: "9px",
                                  border: isSelected ? "1px solid #bfdbfe" : "1px solid transparent",
                                  background: isSelected ? "#eff6ff" : "transparent",
                                  cursor: "pointer",
                                  textAlign: "left",
                                  transition: "background 0.15s"
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                                  <div style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    background: statusBadge.color,
                                    flexShrink: 0
                                  }} />
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{
                                      fontSize: "0.82rem",
                                      fontWeight: isSelected ? "700" : "600",
                                      color: isSelected ? "#1d4ed8" : "#0f172a",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis"
                                    }}>
                                      {thread.id}
                                    </div>
                                    <div style={{
                                      fontSize: "0.7rem",
                                      color: "#64748b",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis"
                                    }}>
                                      {statusBadge.label}
                                    </div>
                                  </div>
                                </div>
                                {thread.count > 0 && (
                                  <span style={{
                                    background: isSelected ? "#2563eb" : "#f1f5f9",
                                    color: isSelected ? "#ffffff" : "#475569",
                                    padding: "2px 7px",
                                    borderRadius: "6px",
                                    fontSize: "0.72rem",
                                    fontWeight: "800",
                                    flexShrink: 0
                                  }}>
                                    {thread.count}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* General Inquiries */}
                        {applicantThreads.generalCount > 0 && (
                          <>
                            <div style={{ height: "1px", background: "#f1f5f9", margin: "4px 0" }} />
                            <button
                              type="button"
                              onClick={() => {
                                setActiveThreadId("general");
                                setShowThreadDropdown(false);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                width: "100%",
                                padding: "8px 10px",
                                borderRadius: "9px",
                                border: activeThreadId === "general" ? "1px solid #bfdbfe" : "none",
                                background: activeThreadId === "general" ? "#eff6ff" : "transparent",
                                cursor: "pointer",
                                textAlign: "left"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <MessageSquare size={14} color="#64748b" />
                                <span style={{ fontSize: "0.82rem", fontWeight: activeThreadId === "general" ? "700" : "600", color: "#334155" }}>
                                  General Inquiries
                                </span>
                              </div>
                              <span style={{
                                background: "#f1f5f9",
                                color: "#64748b",
                                padding: "2px 7px",
                                borderRadius: "6px",
                                fontSize: "0.72rem",
                                fontWeight: "800"
                              }}>
                                {applicantThreads.generalCount}
                              </span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Toggle Permit Records Inspector */}
                  <button
                    onClick={() => setShowDossier(prev => !prev)}
                    style={{
                      background: showDossier ? "#2563eb" : "#f8fafc",
                      border: showDossier ? "1.5px solid #1d4ed8" : "1.5px solid #e2e8f0",
                      color: showDossier ? "#ffffff" : "#334155",
                      padding: "8px 14px",
                      borderRadius: "11px",
                      fontSize: "0.84rem",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: showDossier ? "0 2px 8px rgba(37, 99, 235, 0.25)" : "none"
                    }}
                    title="Toggle Applicant & Permit Records"
                  >
                    <Briefcase size={15} />
                    <span>{showDossier ? "Hide Records" : "Permit Records"}</span>
                    {selectedApplicantData.applications.length > 0 && (
                      <span style={{
                        background: showDossier ? "rgba(255,255,255,0.25)" : "#e2e8f0",
                        color: showDossier ? "#ffffff" : "#475569",
                        padding: "1px 6px",
                        borderRadius: "8px",
                        fontSize: "0.72rem",
                        fontWeight: "800"
                      }}>
                        {selectedApplicantData.applications.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* =============================================================== */}
              {/* STICKY PERMIT CONTEXT BANNER WHEN A SPECIFIC THREAD IS ACTIVE */}
              {/* =============================================================== */}
              {activePermitApp && (
                <div style={{
                  padding: "10px 1.4rem",
                  background: activePermitApp.status === "approved" ? "#f0fdf4" : "#eff6ff",
                  borderBottom: `1.5px solid ${activePermitApp.status === "approved" ? "#86efac" : "#bfdbfe"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "9px",
                      background: activePermitApp.status === "approved" ? "#dcfce7" : "#dbeafe",
                      color: activePermitApp.status === "approved" ? "#16a34a" : "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <Building2 size={18} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.92rem", fontWeight: "800", color: "#0f172a" }}>
                          {activePermitApp.id}
                        </span>
                        <span style={{ fontSize: "0.82rem", color: "#475569", fontWeight: "600" }}>
                          {activePermitApp.projectName || "Permit Application"}
                        </span>
                        <span style={{
                          fontSize: "0.7rem",
                          fontWeight: "800",
                          background: getStatusBadge(activePermitApp.status).bg,
                          color: getStatusBadge(activePermitApp.status).color,
                          border: `1px solid ${getStatusBadge(activePermitApp.status).border}`,
                          padding: "2px 7px",
                          borderRadius: "6px"
                        }}>
                          {getStatusBadge(activePermitApp.status).label}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "#64748b" }}>
                        Messages sent in this thread are automatically tagged to {activePermitApp.id}.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Link
                      href={`/staff/evaluate/${activePermitApp.id}`}
                      target="_blank"
                      style={{
                        background: "#ffffff",
                        border: "1.5px solid #cbd5e1",
                        color: "#1e40af",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "0.78rem",
                        fontWeight: "700",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px"
                      }}
                    >
                      <span>Open Workspace</span>
                      <ExternalLink size={12} />
                    </Link>

                    {activePermitApp.status === "approved" && (
                      <button
                        type="button"
                        onClick={() => {
                          setReleaseModalApp(activePermitApp);
                          setOfficialReceiptInput((activePermitApp as any).paymentReference || `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`);
                        }}
                        style={{
                          background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                          color: "white",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          fontSize: "0.8rem",
                          fontWeight: "800",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          boxShadow: "0 2px 6px rgba(5, 150, 105, 0.3)"
                        }}
                      >
                        <CheckCircle2 size={14} />
                        <span>Confirm Payment &amp; Release</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveThreadId("all")}
                      style={{
                        background: "#ffffff",
                        border: "1.5px solid #cbd5e1",
                        color: "#475569",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "0.78rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px"
                      }}
                      title="Clear thread filter"
                    >
                      <X size={13} />
                      <span>All Messages</span>
                    </button>
                  </div>
                </div>
              )}

              {/* General Inquiries banner if selected */}
              {activeThreadId === "general" && (
                <div style={{
                  padding: "10px 1.4rem",
                  background: "#f8fafc",
                  borderBottom: "1.5px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <MessageSquare size={16} color="#64748b" />
                    <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#334155" }}>
                      Viewing General Inquiries Thread
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveThreadId("all")}
                    style={{
                      background: "#ffffff",
                      border: "1.5px solid #cbd5e1",
                      color: "#475569",
                      padding: "5px 11px",
                      borderRadius: "7px",
                      fontSize: "0.76rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <X size={12} />
                    <span>All Messages</span>
                  </button>
                </div>
              )}

              {/* =============================================================== */}
              {/* MESSAGES SCROLL FEED (LARGE LEGIBLE FONT, CRISP SPACING) */}
              {/* =============================================================== */}
              <div 
                ref={messagesContainerRef}
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "1.5rem",
                  background: "#f8fafc",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                  backgroundImage: "radial-gradient(#e2e8f0 1.2px, transparent 1.2px)",
                  backgroundSize: "28px 28px"
                }}
              >
                {filteredMessages.length === 0 ? (
                  <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                    padding: "2.5rem"
                  }}>
                    <Clock size={40} style={{ marginBottom: "10px", opacity: 0.4 }} />
                    <p style={{ fontSize: "1.05rem", fontWeight: "800", margin: "0 0 4px 0", color: "#334155" }}>
                      No messages in this view
                    </p>
                    <p style={{ fontSize: "0.88rem", margin: 0, color: "#64748b" }}>
                      {activeThreadId === "all"
                        ? "Dispatch an official update using the composer below."
                        : `No messages currently tagged for thread ${activeThreadId}.`}
                    </p>
                  </div>
                ) : (
                  filteredMessages.map((msg, idx) => {
                    const isMe = msg.senderEmail === currentUserEmail || msg.senderEmail === "staff@etayo.gov.ph";
                    const msgThreadId = getMessageThreadId(msg);
                    const currentDateLabel = getDateLabel(msg.timestamp);
                    const prevDateLabel = idx > 0 ? getDateLabel(filteredMessages[idx - 1].timestamp) : null;
                    const showDateDivider = idx === 0 || currentDateLabel !== prevDateLabel;

                    return (
                      <React.Fragment key={msg.id || idx}>
                        {/* Date Divider */}
                        {showDateDivider && (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "0.75rem 0" }}>
                            <span style={{
                              background: "#e2e8f0",
                              color: "#475569",
                              padding: "4px 14px",
                              borderRadius: "14px",
                              fontSize: "0.74rem",
                              fontWeight: "800",
                              letterSpacing: "0.04em",
                              textTransform: "uppercase"
                            }}>
                              {currentDateLabel}
                            </span>
                          </div>
                        )}

                        <div
                          style={{
                            display: "flex",
                            justifyContent: isMe ? "flex-end" : "flex-start",
                            width: "100%"
                          }}
                        >
                          <div style={{
                            maxWidth: "78%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: isMe ? "flex-end" : "flex-start"
                          }}>
                            {/* Sender Identity Pill */}
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "5px",
                              fontSize: "0.78rem",
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
                                    gap: "5px",
                                    fontSize: "0.74rem"
                                  }}>
                                    <ShieldCheck size={13} /> Sto. Tomas Municipal Dispatch
                                  </span>
                                  {msg.actualSender && (
                                    <span style={{ color: "#64748b", fontSize: "0.74rem" }}>
                                      ({msg.actualSender.split("@")[0]})
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span style={{ fontWeight: "800", color: "#0f172a" }}>{selectedApplicantData.name}</span>
                                  {msgThreadId !== "general" && (
                                    <span
                                      onClick={() => setActiveThreadId(msgThreadId)}
                                      style={{
                                        background: "#e0e7ff",
                                        color: "#3730a3",
                                        padding: "2px 7px",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        fontSize: "0.72rem",
                                        fontWeight: "800"
                                      }}
                                      title="Click to view only this permit's thread"
                                    >
                                      Permit: {msgThreadId}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Upgraded Bubble Container with Large Legible Font (15px) */}
                            <div style={{
                              padding: "1rem 1.25rem",
                              borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                              background: isMe
                                ? "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)"
                                : "#ffffff",
                              color: isMe ? "#ffffff" : "#0f172a",
                              boxShadow: isMe
                                ? "0 4px 16px rgba(37, 99, 235, 0.22)"
                                : "0 3px 12px rgba(15, 23, 42, 0.06)",
                              border: isMe ? "none" : "1.5px solid #e2e8f0",
                              fontSize: "0.96rem",
                              lineHeight: "1.6",
                              letterSpacing: "0.01em"
                            }}>
                              <MessageBubbleContent
                                content={msg.content}
                                isMe={isMe}
                                onOpenAttachment={att => setPreviewAttachment(att)}
                                timestamp={msg.timestamp}
                                app={activePermitApp || (msgThreadId ? applications.find(a => a.id === msgThreadId) : null)}
                              />

                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                gap: "5px",
                                marginTop: "8px",
                                fontSize: "0.74rem",
                                color: isMe ? "rgba(255, 255, 255, 0.82)" : "#94a3b8"
                              }}>
                                <Clock size={11} />
                                <span>{formatPhilippineDateTime(msg.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* =============================================================== */}
              {/* CANNED OFFICIAL RESPONSES STRIP */}
              {/* =============================================================== */}
              <div style={{
                padding: "8px 1.4rem",
                background: "#ffffff",
                borderTop: "1.5px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                overflowX: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none"
              }}>
                <span style={{ fontSize: "0.74rem", fontWeight: "800", color: "#0038A8", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                  <FileText size={13} color="#0038A8" /> Quick Replies:
                </span>
                {CANNED_RESPONSES.map(canned => (
                  <button
                    key={canned.id}
                    onClick={() => {
                      setInputMessage(canned.text);
                      if (textareaRef.current) textareaRef.current.focus();
                    }}
                    style={{
                      padding: "5px 11px",
                      borderRadius: "9px",
                      fontSize: "0.78rem",
                      fontWeight: "700",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      color: "#0f172a",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      flexShrink: 0,
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "#eff6ff";
                      e.currentTarget.style.borderColor = "#bfdbfe";
                      e.currentTarget.style.color = "#0038A8";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "#ffffff";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.color = "#0f172a";
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
                  padding: "8px 1.4rem",
                  background: "#eff6ff",
                  borderTop: "1.5px solid #bfdbfe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.85rem",
                  color: "#1e40af"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Paperclip size={16} />
                    <span>Attached Document: <strong>{adminAttachedFile.name}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdminAttachedFile(null)}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center" }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Upgraded Multiline Auto-Expanding Textarea Composer */}
              <div style={{
                padding: "1rem 1.4rem",
                background: "#ffffff",
                borderTop: "1.5px solid #e2e8f0"
              }}>
                <form
                  onSubmit={e => sendMessage(e)}
                  style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}
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
                    title="Attach Document or Blueprint"
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
                          sendMessage();
                        }
                      }}
                      placeholder={
                        activeThreadId !== "all" && activeThreadId !== "general"
                          ? `Type official response regarding ${activeThreadId}... (Enter to send, Shift+Enter for newline)`
                          : "Type official municipal reply... (Enter to send, Shift+Enter for newline)"
                      }
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
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!inputMessage.trim() && !adminAttachedFile}
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
                      cursor: (!inputMessage.trim() && !adminAttachedFile) ? "not-allowed" : "pointer",
                      opacity: (!inputMessage.trim() && !adminAttachedFile) ? 0.45 : 1,
                      boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
                      flexShrink: 0,
                      marginBottom: "2px",
                      transition: "all 0.15s"
                    }}
                  >
                    <span>Send</span>
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
                <h3 style={{ fontSize: "1rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>Permit Records</h3>
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
              
              {/* Citizen Card */}
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
                    {selectedApplicantData.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>
                      {selectedApplicantData.name}
                    </h4>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Registered Citizen</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.8rem", color: "#334155" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <User size={13} color="#64748b" />
                    <span style={{ wordBreak: "break-all" }}>{applicantEmail}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <Phone size={13} color="#64748b" />
                    <span>{selectedApplicantData.phone}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <MapPin size={13} color="#64748b" />
                    <span>{selectedApplicantData.address}</span>
                  </div>
                </div>
              </div>

              {/* Linked Applications Section */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, fontSize: "0.82rem", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Permits on Record ({selectedApplicantData.applications.length})
                  </h4>
                </div>

                {selectedApplicantData.applications.length === 0 ? (
                  <div style={{ padding: "18px", textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                    <p style={{ margin: 0, fontSize: "0.8rem" }}>No permits recorded for this citizen.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selectedApplicantData.applications.map((app, aIdx) => {
                      const badge = getStatusBadge(app.status);
                      const isFiltered = activeThreadId === app.id;

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
                                {app.id}
                              </span>
                              <span style={{ fontSize: "0.76rem", fontWeight: "600", color: "#475569" }}>
                                {app.projectName || "Permit Application"}
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
                              <span style={{ textTransform: "capitalize" }}>{app.permitType?.replace(/_/g, " ")}</span>
                            </div>
                            {app.projectAddress && (
                              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                <MapPin size={12} />
                                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {app.projectAddress}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action Links */}
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              onClick={() => setActiveThreadId(app.id)}
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
                              {isFiltered ? "Active Thread" : "Filter Thread"}
                            </button>

                            <Link
                              href={`/staff/evaluate/${app.id}`}
                              style={{
                                flex: 1,
                                padding: "5px 8px",
                                borderRadius: "7px",
                                fontSize: "0.72rem",
                                fontWeight: "700",
                                background: "white",
                                color: "#2563eb",
                                border: "1px solid #bfdbfe",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                                textDecoration: "none"
                              }}
                              target="_blank"
                            >
                              <span>Evaluate</span>
                              <ExternalLink size={11} />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Guidance Box */}
              <div style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "12px",
                padding: "10px",
                fontSize: "0.76rem",
                color: "#166534"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", marginBottom: "3px" }}>
                  <ShieldCheck size={14} />
                  <span>Sto. Tomas OBO Protocol</span>
                </div>
                <p style={{ margin: 0, lineHeight: 1.4 }}>
                  Notices sent through this console update the applicant portal in real-time under Philippine Standard Time.
                </p>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* PAYMENT COMPLETE & RELEASE PERMIT MODAL */}
      {/* ========================================================================= */}
      {releaseModalApp && (
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
            maxWidth: "540px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "2rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Receipt size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", color: "#0f172a" }}>
                    Verify Payment &amp; Release Permit
                  </h3>
                  <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                    Confirm payment to release official permit and clearance documents
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReleaseModalApp(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Assessment Breakdown Card */}
            <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "14px", padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Permit Application:</span>
                <span style={{ fontSize: "0.86rem", fontWeight: "800", color: "#0f172a" }}>{releaseModalApp.id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Order of Payment No:</span>
                <span style={{ fontSize: "0.86rem", fontWeight: "700", color: "#6d28d9" }}>{(releaseModalApp as any).orderOfPaymentNo || `OP-${releaseModalApp.id?.replace(/^[A-Za-z]+-/i, "") || "2026"}`}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px dashed #cbd5e1" }}>
                <span style={{ fontSize: "0.86rem", fontWeight: "700", color: "#334155" }}>Total Regulatory Amount:</span>
                <span style={{ fontSize: "1.25rem", fontWeight: "900", color: "#059669" }}>
                  PHP {getAuthoritativePermitFee(releaseModalApp, releaseModalApp?.id).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Receipt Photo Preview if available */}
            {receiptPhotoPreview ? (
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  Applicant Uploaded Receipt Photo:
                </label>
                <div style={{ borderRadius: "12px", overflow: "hidden", border: "1.5px solid #cbd5e1", background: "#000", maxHeight: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={receiptPhotoPreview} alt="Receipt preview" style={{ maxWidth: "100%", maxHeight: "220px", objectFit: "contain" }} />
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: "1.25rem", padding: "10px 14px", background: "#fef3c7", borderRadius: "10px", border: "1px solid #fde68a", fontSize: "0.82rem", color: "#92400e" }}>
                ℹ️ Official Receipt settlement can be verified directly if settled at Municipal Hall Cashier.
              </div>
            )}

            {/* Input Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Official Receipt (OR) Number:
                </label>
                <input
                  type="text"
                  value={officialReceiptInput}
                  onChange={(e) => setOfficialReceiptInput(e.target.value)}
                  placeholder="e.g. OR-2026-94812"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.9rem",
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Certifying Cashier / Building Official:
                </label>
                <input
                  type="text"
                  value={certifyingCashierInput}
                  onChange={(e) => setCertifyingCashierInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.9rem",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setReleaseModalApp(null)}
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  padding: "9px 18px",
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
                onClick={handleConfirmPaymentAndRelease}
                disabled={isReleasingPermit}
                style={{
                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  padding: "9px 22px",
                  fontSize: "0.92rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.35)"
                }}
              >
                <CheckCircle2 size={18} />
                <span>{isReleasingPermit ? "Releasing Permit..." : "Confirmed Payment & Release Papers"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
