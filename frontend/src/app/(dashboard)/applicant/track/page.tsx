"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PermitApplication } from "@/types";
import { usePermitContext } from "../../../../context/PermitContext";
import { useLanguage } from "../../../../context/LanguageContext";
import { 
  Search, Plus, Clock, CheckCircle2, AlertTriangle, 
  FileText, CheckCircle, ChevronRight, Copy, Check, 
  MapPin, Sparkles, Layers, ShieldCheck, ArrowRight, MessageSquare, Lock,
  XCircle, Trash2, Archive, ArchiveRestore, RotateCcw, Filter, Calendar,
  Building2, DollarSign, Eye, RefreshCw, FolderKanban, List, ChevronDown,
  CreditCard, Receipt, Banknote, Download, X, Send, Camera, AlertCircle,
  UserCheck
} from "lucide-react";
import { dispatchPermitMessage, getAuthoritativePermitFee } from "../../../../utils/permitMessaging";
import { 
  groupApplicationsIntoProjectDossiers, 
  getConnectedProjectApp, 
  extractBaseProjectName, 
  ProjectDossier,
  isApplicationApproved,
  isApplicationReleased,
  compareAppsNewestFirst,
  formatSubmissionDateTime,
  getApplicationEvaluator 
} from "@/utils/projectGrouping";

type ViewMode = "project" | "flat";

export default function ApplicationStatusPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { applications, systemLogs, updateApplication, archiveApplication, cancelApplication, refreshApplications } = usePermitContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [viewMode, setViewMode] = useState<ViewMode>("project");
  const [expandedDossiers, setExpandedDossiers] = useState<Record<string, boolean>>({});
  const [userName, setUserName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Archive State (persisted in localStorage)
  const [archivedIds, setArchivedIds] = useState<string[]>([]);

  // Cancellation State
  const [appToCancel, setAppToCancel] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("Change of project plans");
  const [isCancelling, setIsCancelling] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "info" } | null>(null);

  // Payment Confirmation Modal State
  const [payingApp, setPayingApp] = useState<any>(null);
  const [paymentRefInput, setPaymentRefInput] = useState<string>("");
  const [paymentMethodInput, setPaymentMethodInput] = useState<string>("Municipal Treasury Cashier (On-site)");
  const [paymentNotesInput, setPaymentNotesInput] = useState<string>("");
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);

  const showToast = (text: string, type: "success" | "info" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3800);
  };

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (refreshApplications) await refreshApplications();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Tracking status synced with municipal server!", "success");
    }, 600);
  };

  const handleSubmitPaymentConfirm = async () => {
    if (!payingApp) return;
    setIsSubmittingPayment(true);
    const refNo = paymentRefInput.trim() || `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const isPayingLC = payingApp.permitType === "locational_clearance" || String(payingApp.id || "").toUpperCase().startsWith("LC-");
    const assessedAmountStr = `PHP ${getAuthoritativePermitFee(payingApp, payingApp.id).toLocaleString()}`;
    const payingId = String(payingApp.id || "");

    const connectedApp = applications ? getConnectedApp(payingApp, applications) : null;
    const connectedId = String(connectedApp?.id || "");

    // Cache receipt photo locally for instant preview across tabs and admin evaluation
    try {
      localStorage.setItem(`etayo_payment_confirmed_${payingId}`, "true");
      localStorage.setItem(`etayo_payment_confirmed_${payingId.toLowerCase()}`, "true");
      localStorage.setItem(`etayo_payment_ref_${payingId}`, refNo);
      localStorage.setItem(`etayo_payment_method_${payingId}`, paymentMethodInput);

      if (paymentReceiptFile) {
        localStorage.setItem(`etayo_receipt_${payingId}`, paymentReceiptFile.dataUrl);
        localStorage.setItem(`etayo_receipt_${payingId.toLowerCase()}`, paymentReceiptFile.dataUrl);
        localStorage.setItem(`att_${paymentReceiptFile.name}`, paymentReceiptFile.dataUrl);
      }

      if (connectedId) {
        localStorage.setItem(`etayo_payment_confirmed_${connectedId}`, "true");
        localStorage.setItem(`etayo_payment_confirmed_${connectedId.toLowerCase()}`, "true");
        localStorage.setItem(`etayo_payment_ref_${connectedId}`, refNo);
        localStorage.setItem(`etayo_payment_method_${connectedId}`, paymentMethodInput);
        if (paymentReceiptFile) {
          localStorage.setItem(`etayo_receipt_${connectedId}`, paymentReceiptFile.dataUrl);
          localStorage.setItem(`etayo_receipt_${connectedId.toLowerCase()}`, paymentReceiptFile.dataUrl);
        }
      }
    } catch (e) {}

    const updatedApp = {
      ...payingApp,
      userConfirmedPayment: true,
      paymentStatus: "awaiting_verification" as const,
      paymentReference: refNo,
      paymentMethod: paymentMethodInput,
      paymentProofUrl: paymentReceiptFile?.dataUrl || payingApp.paymentProofUrl,
      paymentProofFileName: paymentReceiptFile?.name || payingApp.paymentProofFileName,
      paymentDate: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      paymentNotes: paymentNotesInput,
      historyLog: [
        ...(payingApp.historyLog || []),
        {
          date: new Date().toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          action: "Payment Confirmation Submitted",
          actor: payingApp.applicantName || userName || "Applicant",
          details: `Payment submitted under reference ${refNo} via ${paymentMethodInput}. Assessed: ${assessedAmountStr}.${paymentReceiptFile ? " Receipt photo attached." : ""} Awaiting municipal cashier sign-off.`
        }
      ]
    };

    await updateApplication(updatedApp as any);

    if (connectedApp) {
      const updatedConnected = {
        ...connectedApp,
        userConfirmedPayment: true,
        paymentStatus: "awaiting_verification" as const,
        paymentReference: refNo,
        paymentMethod: paymentMethodInput,
        paymentProofUrl: paymentReceiptFile?.dataUrl || (connectedApp as any).paymentProofUrl,
        paymentProofFileName: paymentReceiptFile?.name || (connectedApp as any).paymentProofFileName,
        paymentDate: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        paymentNotes: paymentNotesInput
      };
      await updateApplication(updatedConnected as any);
    }

    // Notify municipal staff desk directly in the chat conversation thread
    try {
      const attachmentClause = paymentReceiptFile ? `\n[Attachment: ${paymentReceiptFile.name}|${paymentReceiptFile.dataUrl}]` : "";
      await dispatchPermitMessage({
        applicationId: payingApp.id,
        recipientEmail: "staff@etayo.gov.ph",
        senderEmail: payingApp.applicantEmail || currentUser?.email || "applicant@etayo.gov.ph",
        content: `[Ref: ${payingApp.id} - ${payingApp.projectName || "Permit Application"}]
💳 PAYMENT CONFIRMATION & RECEIPT SUBMITTED BY APPLICANT

The applicant has submitted payment confirmation for Order of Payment ${payingApp.orderOfPaymentNo || 'OP-2026'}.
Amount: ${assessedAmountStr}
Official Receipt / Reference: ${refNo}
Payment Channel: ${paymentMethodInput}
${paymentNotesInput ? `Applicant Remarks: ${paymentNotesInput}\n` : ""}${attachmentClause}

Action Required: Please inspect the receipt photo and click "Confirmed Payment" on the Evaluation Page or in Messages to officially release the permit papers.`,
      });
    } catch (e) {
      console.warn("Could not dispatch payment confirmation message", e);
    }

    setIsSubmittingPayment(false);
    setPayingApp(null);
    setPaymentReceiptFile(null);
    showToast("Payment confirmation & receipt submitted! Municipal cashier notified.", "success");
  };

  useEffect(() => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (token && userStr) {
        const userObj = JSON.parse(userStr);
        setIsLoggedIn(true);
        setCurrentUser(userObj);
        if (userObj.name) setUserName(userObj.name);
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setUserName("");
      }
    } catch (e) {
      setIsLoggedIn(false);
      setCurrentUser(null);
    }

    // Load archived IDs
    try {
      const savedArchived = localStorage.getItem("etayo_archived_application_ids");
      if (savedArchived) {
        const parsed = JSON.parse(savedArchived);
        if (Array.isArray(parsed)) {
          setArchivedIds(parsed);
        }
      }
    } catch (e) {}

    // Auto-heal any locally cached applications that have a linked LC so they adopt user & project info
    try {
      const cached = localStorage.getItem("etayo_cached_applications");
      const userStr = localStorage.getItem("user");
      if (cached) {
        const userObj = userStr ? JSON.parse(userStr) : null;
        const parsed = JSON.parse(cached);
        let updated = false;
        if (Array.isArray(parsed)) {
          parsed.forEach((a: any) => {
            if (!a) return;
            const ref = a.locationalClearanceRef || a.clearanceRef || a.connectedClearanceId;
            if (ref && ref !== "exempt" && ref !== "not_required") {
              const matchedLC = parsed.find((p: any) => p && p.id && String(p.id).trim().toLowerCase() === String(ref).trim().toLowerCase());
              if (matchedLC) {
                if (!a.applicantEmail && (matchedLC.applicantEmail || userObj?.email)) {
                  a.applicantEmail = matchedLC.applicantEmail || userObj?.email;
                  a.userEmail = a.applicantEmail;
                  updated = true;
                }
                if ((!a.applicantName || a.applicantName === "Applicant") && (matchedLC.applicantName || userObj?.name)) {
                  a.applicantName = matchedLC.applicantName || userObj?.name;
                  updated = true;
                }
                if (matchedLC.projectName && (!a.projectName || a.projectName.includes("Installation & Construction"))) {
                  a.projectName = matchedLC.projectName;
                  updated = true;
                }
                if (matchedLC.projectAddress && (!a.projectAddress || a.projectAddress.includes("Sto. Tomas, Pampanga"))) {
                  a.projectAddress = matchedLC.projectAddress;
                  updated = true;
                }
              } else if (userObj) {
                if (!a.applicantEmail && userObj.email) {
                  a.applicantEmail = userObj.email;
                  a.userEmail = userObj.email;
                  updated = true;
                }
                if ((!a.applicantName || a.applicantName === "Applicant") && userObj.name) {
                  a.applicantName = userObj.name;
                  updated = true;
                }
              }
            }
          });
          if (updated) {
            localStorage.setItem("etayo_cached_applications", JSON.stringify(parsed));
          }
        }
      }
    } catch (e) {}

    // Support tab deep-linking (e.g. /applicant/track?tab=archived)
    try {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("tab") === "archived") {
          setActiveTab("archived");
        }
      }
    } catch (e) {}

    // Real-time multi-tab & cross-window sync listener with fast polling
    const syncArchived = () => {
      try {
        const savedArchived = localStorage.getItem("etayo_archived_application_ids");
        if (savedArchived) {
          const parsed = JSON.parse(savedArchived);
          if (Array.isArray(parsed)) {
            setArchivedIds(parsed);
          }
        }
      } catch (e) {}
    };

    const handleSync = () => {
      syncArchived();
      if (refreshApplications) refreshApplications();
    };

    const handleFocus = () => {
      syncArchived();
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        if (refreshApplications) refreshApplications();
      }
    };

    // Auto-poll every 2.5s to detect admin approval without delay across windows/tabs
    const pollTimer = setInterval(() => {
      syncArchived();
      if (refreshApplications) refreshApplications();
    }, 2500);

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleSync);
      window.addEventListener("etayo_archive_changed", syncArchived);
      window.addEventListener("etayo_applications_updated", handleSync);
      window.addEventListener("focus", handleFocus);
      document.addEventListener("visibilitychange", handleFocus);
    }

    return () => {
      clearInterval(pollTimer);
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleSync);
        window.removeEventListener("etayo_archive_changed", syncArchived);
        window.removeEventListener("etayo_applications_updated", handleSync);
        window.removeEventListener("focus", handleFocus);
        document.removeEventListener("visibilitychange", handleFocus);
      }
    };
  }, [refreshApplications]);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    showToast(`Copied tracking ID ${id} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleArchiveApp = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cleanId = String(id || "").trim();
    if (archiveApplication) {
      archiveApplication(cleanId, true);
    }
    setArchivedIds(prev => {
      const next = Array.from(new Set([...prev, cleanId]));
      try {
        localStorage.setItem("etayo_archived_application_ids", JSON.stringify(next));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("etayo_archive_changed"));
        }
      } catch (err) {}
      return next;
    });
    showToast(`Application ${cleanId} moved to archive.`, "info");
  };

  const handleUnarchiveApp = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cleanId = String(id || "").trim();
    const lower = cleanId.toLowerCase();
    if (archiveApplication) {
      archiveApplication(cleanId, false);
    }
    setArchivedIds(prev => {
      const next = prev.filter(x => String(x || "").trim().toLowerCase() !== lower);
      try {
        localStorage.setItem("etayo_archived_application_ids", JSON.stringify(next));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("etayo_archive_changed"));
        }
      } catch (err) {}
      return next;
    });
    showToast(`Application ${cleanId} restored to active list.`, "success");
  };

  const isAppArchived = useCallback((app: PermitApplication): boolean => {
    if (app.isArchived) return true;
    const appId = String(app.id || "").trim().toLowerCase();
    if (!appId) return false;
    if (archivedIds.some(x => String(x || "").trim().toLowerCase() === appId)) return true;
    if (typeof window !== "undefined") {
      const origId = String(app.id || "").trim();
      if (
        localStorage.getItem(`etayo_archived_${origId}`) === "true" ||
        localStorage.getItem(`etayo_archived_${appId}`) === "true" ||
        localStorage.getItem(`etayo_archived_${origId.toUpperCase()}`) === "true"
      ) {
        return true;
      }
    }
    return false;
  }, [archivedIds]);

  // Strictly filter applications for the active logged-in applicant or recently submitted apps on this device
  const myApplications = useMemo(() => {
    let localSubmittedIds: string[] = [];
    try {
      const s = typeof window !== "undefined" ? localStorage.getItem("etayo_submitted_app_ids") : null;
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) localSubmittedIds = parsed;
      }
    } catch (e) {}

    let pool = applications || [];
    if (pool.length === 0 && typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("etayo_cached_applications");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) pool = parsed;
        }
      } catch (e) {}
    }

    if (!isLoggedIn || !currentUser) {
      if (localSubmittedIds.length > 0) {
        return pool.filter(app => {
          if (!app) return false;
          const appId = String(app.id || "").trim().toLowerCase();
          return localSubmittedIds.some(sid => sid && sid.trim().toLowerCase() === appId);
        });
      }
      return [];
    }

    const email = (currentUser.email || "").toLowerCase().trim();
    const name = (currentUser.name || "").toLowerCase().trim();
    const norm = (str: string) => (str || "").toLowerCase().trim().replace("mdpsicot", "mdpsicat");

    const activeStoredRef = typeof window !== "undefined" 
      ? (localStorage.getItem("etayo_active_clearance_ref") || "").trim().toLowerCase() 
      : "";

    return pool.filter(app => {
      if (!app) return false;
      const appId = String(app.id || "").trim().toLowerCase();
      const appEmail = (app.applicantEmail || (app as any).userEmail || (typeof (app as any).user === "string" ? (app as any).user : "") || "").toLowerCase().trim();
      const appName = (app.applicantName || (app as any).userName || "").toLowerCase().trim();

      const matchSubmitted = localSubmittedIds.some(sid => sid && sid.trim().toLowerCase() === appId);

      const matchEmail = Boolean(email && appEmail && (
        appEmail === email || 
        appEmail.includes(email) || 
        email.includes(appEmail) ||
        norm(appEmail) === norm(email)
      ));
      const matchName = Boolean(name && appName && (appName === name || appName.includes(name) || name.includes(appName)));

      // If this application matches the active clearance reference from existing application flow
      const matchActiveRef = Boolean(activeStoredRef && activeStoredRef !== "exempt" && (
        appId === activeStoredRef ||
        String(app.locationalClearanceRef || "").trim().toLowerCase() === activeStoredRef ||
        String((app as any).clearanceRef || "").trim().toLowerCase() === activeStoredRef
      ));

      // CRITICAL FIX: If this application has locationalClearanceRef, check if that LC belongs to this user!
      // This guarantees that any Stage 2 permit linked to user's LC is NEVER dropped!
      const linkedRef = String(app.locationalClearanceRef || (app as any).clearanceRef || (app as any).connectedClearanceId || "").trim().toLowerCase();
      let matchLinkedLC = false;
      if (linkedRef && linkedRef !== "exempt" && linkedRef !== "not_required" && pool) {
        matchLinkedLC = pool.some(other => {
          if (!other || !other.id) return false;
          const otherId = String(other.id).trim().toLowerCase();
          if (otherId !== linkedRef) return false;
          const otherEmail = (other.applicantEmail || (other as any).userEmail || "").toLowerCase().trim();
          const otherName = (other.applicantName || "").toLowerCase().trim();
          return (email && otherEmail && (otherEmail === email || otherEmail.includes(email) || norm(otherEmail) === norm(email))) ||
                 (name && otherName && (otherName === name || otherName.includes(name)));
        });
      }

      return matchEmail || matchName || matchActiveRef || matchLinkedLC || matchSubmitted;
    });
  }, [applications, isLoggedIn, currentUser]);

  const activeApps = useMemo(() => {
    return myApplications.filter(a => !isAppArchived(a));
  }, [myApplications, isAppArchived]);

  const archivedApps = useMemo(() => {
    return myApplications.filter(a => isAppArchived(a));
  }, [myApplications, isAppArchived]);

  const currentPool = activeTab === "active" ? activeApps : archivedApps;

  const filteredApps = useMemo(() => {
    return currentPool.filter(app => {
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch = !query ||
        (app.projectName && app.projectName.toLowerCase().includes(query)) ||
        (app.id && app.id.toLowerCase().includes(query)) ||
        (app.projectType && app.projectType.toLowerCase().includes(query)) ||
        (app.permitType && app.permitType.toLowerCase().includes(query)) ||
        (app.projectAddress && app.projectAddress.toLowerCase().includes(query));

      const isAppApproved = isApplicationApproved(app);
      const aId = String(app.id || "").trim();
      const isRev = (app.status === "under_review") || (typeof window !== "undefined" && Boolean(aId) && (
        localStorage.getItem(`etayo_status_${aId}`) === "under_review" ||
        localStorage.getItem(`etayo_status_${aId.toLowerCase()}`) === "under_review" ||
        localStorage.getItem(`etayo_status_${aId.toUpperCase()}`) === "under_review"
      ));
      const effectiveAppStatus = isAppApproved ? "approved" : (isRev ? "under_review" : (app.status || "pending"));

      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "approved" ? isAppApproved : (isAppApproved ? false : effectiveAppStatus === statusFilter));

      const matchesType = typeFilter === "all" ||
        (typeFilter === "locational_clearance" ? app.permitType === "locational_clearance" : app.permitType !== "locational_clearance");

      return matchesSearch && matchesStatus && matchesType;
    }).sort(compareAppsNewestFirst);
  }, [currentPool, searchTerm, statusFilter, typeFilter]);

  const stats = {
    activeTotal: activeApps.length,
    pending: activeApps.filter(a => {
      const isAppApproved = isApplicationApproved(a);
      const aId = String(a.id || "").trim();
      const isRev = (a.status === "under_review") || (typeof window !== "undefined" && Boolean(aId) && (
        localStorage.getItem(`etayo_status_${aId}`) === "under_review" ||
        localStorage.getItem(`etayo_status_${aId.toLowerCase()}`) === "under_review" ||
        localStorage.getItem(`etayo_status_${aId.toUpperCase()}`) === "under_review"
      ));
      return (a.status === "pending" || !a.status) && !isAppApproved && !isRev;
    }).length,
    review: activeApps.filter(a => {
      const isAppApproved = isApplicationApproved(a);
      const aId = String(a.id || "").trim();
      const isRev = (a.status === "under_review") || (typeof window !== "undefined" && Boolean(aId) && (
        localStorage.getItem(`etayo_status_${aId}`) === "under_review" ||
        localStorage.getItem(`etayo_status_${aId.toLowerCase()}`) === "under_review" ||
        localStorage.getItem(`etayo_status_${aId.toUpperCase()}`) === "under_review"
      ));
      return isRev && !isAppApproved;
    }).length,
    approved: activeApps.filter(a => isApplicationApproved(a)).length,
    action: activeApps.filter(a => a.status === "incomplete_requirements" || a.status === "rejected").length,
    archivedTotal: archivedApps.length,
  };

  const extractBaseProjectName = (app: any) => {
    const pTypeStr = typeof app.projectType === "object" ? (app.projectType as any)?.name : (app.projectType || "");
    const pName = (app.projectName || "").trim();

    const cleaned = pName
      .replace(/\s*-\s*locational clearance/i, "")
      .replace(/\s*installation\s*&\s*construction/i, "")
      .replace(/\s*construction/i, "")
      .replace(/\s*building permit/i, "")
      .trim();

    if (cleaned && cleaned.toLowerCase() !== "residential house" && cleaned.toLowerCase() !== "commercial building") {
      return cleaned;
    }

    if (pTypeStr && pTypeStr !== "Other" && pTypeStr !== "Unknown") {
      return pTypeStr.trim();
    }

    return cleaned || pName || "Permit Project";
  };

  const getConnectedApp = (app: any, allApps: any[]) => {
    return getConnectedProjectApp(app, allApps);
  };

  const checkUserConfirmedPayment = (app: any): { confirmed: boolean; reference: string; method: string; date?: string; receiptUrl?: string } => {
    if (!app) return { confirmed: false, reference: "", method: "" };

    const rawSt = (app.status || "").toLowerCase().trim();
    if (rawSt === "pending" || rawSt === "under_review" || rawSt === "incomplete_requirements" || rawSt === "rejected" || rawSt === "cancelled") {
      return { confirmed: false, reference: "", method: "" };
    }

    const id = String(app.id || "");

    // 1. Direct properties on app
    if (Boolean((app as any).userConfirmedPayment)) {
      return {
        confirmed: true,
        reference: (app as any).paymentReference || (app as any).officialReceiptNo || "OR-2026-SUBMITTED",
        method: (app as any).paymentMethod || "Municipal Treasury / Online",
        date: (app as any).paymentDate || (app as any).datePaid,
        receiptUrl: (app as any).paymentProofUrl
      };
    }

    if (app.paymentStatus === "awaiting_verification" || app.paymentStatus === "paid" || app.paymentStatus === "settled" || app.paymentStatus === "submitted") {
      return {
        confirmed: true,
        reference: (app as any).paymentReference || (app as any).officialReceiptNo || "OR-2026-SUBMITTED",
        method: (app as any).paymentMethod || "Municipal Treasury / Online",
        date: (app as any).paymentDate || (app as any).datePaid,
        receiptUrl: (app as any).paymentProofUrl
      };
    }

    // 2. LocalStorage flags specifically for THIS application ID
    if (typeof window !== "undefined") {
      const receiptImg = localStorage.getItem(`etayo_receipt_${id}`) || 
                         localStorage.getItem(`etayo_receipt_${id.toLowerCase()}`);

      const isConfirmedLocal = localStorage.getItem(`etayo_payment_confirmed_${id}`) === "true" ||
                               localStorage.getItem(`etayo_payment_confirmed_${id.toLowerCase()}`) === "true";

      const isPaidLocal = localStorage.getItem(`etayo_paid_${id}`) === "true" ||
                          localStorage.getItem(`etayo_paid_${id.toLowerCase()}`) === "true";

      const storedRef = localStorage.getItem(`etayo_payment_ref_${id}`) ||
                        localStorage.getItem(`etayo_or_${id}`);

      const storedMethod = localStorage.getItem(`etayo_payment_method_${id}`);

      if (isConfirmedLocal || isPaidLocal || Boolean(receiptImg) || Boolean(storedRef)) {
        return {
          confirmed: true,
          reference: storedRef || (app as any).paymentReference || "OR-2026-SUBMITTED",
          method: storedMethod || (app as any).paymentMethod || "Municipal Treasury / Online",
          receiptUrl: receiptImg || undefined
        };
      }

      // 3. Check etayo_messages_history strictly for THIS application ID
      try {
        const msgsStr = localStorage.getItem("etayo_messages_history");
        if (msgsStr) {
          const msgs = JSON.parse(msgsStr);
          if (Array.isArray(msgs)) {
            const hasPaymentMsg = msgs.some((m: any) => {
              if (m.applicationId !== id && m.applicationId !== id.toLowerCase()) return false;
              const content = (m.content || "").toUpperCase();
              return content.includes("PAYMENT CONFIRMATION") ||
                     content.includes("PAYMENT RECEIPT") ||
                     content.includes("OFFICIAL PAYMENT SETTLED") ||
                     content.includes("PAYMENT VERIFIED");
            });

            if (hasPaymentMsg) {
              return {
                confirmed: true,
                reference: (app as any).paymentReference || "OR-2026-SUBMITTED",
                method: "Submitted via Portal Chat"
              };
            }
          }
        }
      } catch (e) {}
    }

    return { confirmed: false, reference: "", method: "" };
  };

  const isActuallyReleasedApp = (app: any) => {
    return isApplicationReleased(app);
  };

  const getStatusConfig = (status: string, app?: any) => {
    const isReleased = status === "released" || isActuallyReleasedApp(app) || Boolean(app?.isReleased);
    if (isReleased) {
      return { color: "#059669", bg: "#dcfce7", border: "#16a34a", icon: CheckCircle, label: "Permit Released", step: 4 };
    }

    const rawStatus = (status || "").toLowerCase().trim();
    if (rawStatus === "pending") {
      return { color: "#d97706", bg: "#fef3c7", border: "#f59e0b", icon: Clock, label: "Pending Review", step: 1 };
    }

    const isApproved = rawStatus === "approved" || rawStatus.includes("approv") || isApplicationApproved(app);

    if (isApproved) {
      const paymentInfo = checkUserConfirmedPayment(app);
      if (paymentInfo.confirmed) {
        return {
          color: "#059669",
          bg: "#dcfce7",
          border: "#16a34a",
          icon: CheckCircle2,
          label: "Payment Submitted (Under Cashier Review)",
          step: 3
        };
      }
      const isLC = (app?.permitType || "").toLowerCase().includes("locational") || (app?.id || "").toLowerCase().startsWith("lc-");
      return { 
        color: "#059669", 
        bg: "#d1fae5", 
        border: "#10b981", 
        icon: CheckCircle2, 
        label: isLC ? "Locational Clearance Approved" : "Application Approved", 
        step: 3 
      };
    }

    switch(rawStatus) {
      case "pending":
        return { color: "#d97706", bg: "#fef3c7", border: "#f59e0b", icon: Clock, label: "Pending Review", step: 1 };
      case "under_review":
        return { color: "#0038A8", bg: "#eff6ff", border: "#0038A8", icon: Search, label: "Under Evaluation", step: 2 };
      case "incomplete_requirements":
        return { color: "#dc2626", bg: "#fee2e2", border: "#ef4444", icon: AlertTriangle, label: "Action Required", step: 2 };
      case "rejected":
        return { color: "#dc2626", bg: "#fee2e2", border: "#ef4444", icon: XCircle, label: "Disapproved / Rejected", step: 0 };
      case "cancelled":
        return { color: "#dc2626", bg: "#fee2e2", border: "#ef4444", icon: XCircle, label: "Cancelled", step: 0 };
      default:
        return { color: "#64748b", bg: "#f1f5f9", border: "#94a3b8", icon: FileText, label: "Processing", step: 1 };
    }
  };

  const getPermitTypeBadge = (permitType?: string, appId?: string) => {
    const isLC = (permitType || "").toLowerCase().includes("locational") || (appId || "").toLowerCase().startsWith("lc-");
    if (isLC) {
      return {
        code: "LC",
        stage: "Stage 1",
        label: "Locational Clearance",
        bg: "#eff6ff",
        color: "#1e40af",
        border: "#bfdbfe"
      };
    }
    return {
      code: "BP",
      stage: "Stage 2",
      label: "Technical Permits",
      bg: "#f5f3ff",
      color: "#6d28d9",
      border: "#ddd6fe"
    };
  };

  // Group applications by Project Dossier (combining Locational Clearance and Technical Permits)
  const projectDossiers = useMemo(() => {
    return groupApplicationsIntoProjectDossiers(filteredApps);
  }, [filteredApps]);

  const toggleDossier = (dossierId: string) => {
    setExpandedDossiers(prev => ({
      ...prev,
      [dossierId]: !prev[dossierId]
    }));
  };

  const isDossierExpanded = (dossierId: string) => {
    return Boolean(expandedDossiers[dossierId]);
  };

  const expandAll = () => {
    const allExp: Record<string, boolean> = {};
    projectDossiers.forEach(d => { allExp[d.id] = true; });
    setExpandedDossiers(allExp);
  };

  const collapseAll = () => {
    const allCol: Record<string, boolean> = {};
    projectDossiers.forEach(d => { allCol[d.id] = false; });
    setExpandedDossiers(allCol);
  };

  // Helper to render an individual application card with visual timeline
  const renderApplicationCard = (app: any, options?: { hideMessageDesk?: boolean }) => {
    const isLocationalClearance = app.permitType === "locational_clearance" || (app.id && app.id.startsWith("LC-"));

    // Identify connected application (Locational Clearance <-> Technical Permits) of the same project
    let connectedApp = getConnectedProjectApp(app, applications);
    if (!connectedApp && typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("etayo_cached_applications");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) connectedApp = getConnectedProjectApp(app, parsed);
        }
      } catch (e) {}
    }
    if (!connectedApp) {
      const searchPool = (applications && applications.length > 0) ? applications : (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("etayo_cached_applications") || "[]") : []);
      if (Array.isArray(searchPool)) {
        if (isLocationalClearance) {
          const appIdLower = String(app.id || "").toLowerCase().trim();
          connectedApp = searchPool.find((other: any) => {
            if (!other || other.id === app.id) return false;
            const ref = String(other.locationalClearanceRef || other.clearanceRef || other.connectedClearanceId || "").toLowerCase().trim();
            return ref && ref === appIdLower;
          }) || null;
        } else {
          const ref = String(app.locationalClearanceRef || app.clearanceRef || app.connectedClearanceId || "").toLowerCase().trim();
          if (ref && ref !== "exempt") {
            connectedApp = searchPool.find((other: any) => {
              if (!other || other.id === app.id) return false;
              return String(other.id || "").toLowerCase().trim() === ref;
            }) || null;
          }
        }
      }
    }
    const connectedStage2App = isLocationalClearance ? connectedApp : null;
    const connectedLCApp = !isLocationalClearance ? connectedApp : null;
    const shouldHideMessageDesk = Boolean(options?.hideMessageDesk) || Boolean(connectedStage2App);
    const isActuallyReleased = isActuallyReleasedApp(app);
    const paymentInfo = checkUserConfirmedPayment(app);
    const evaluator = getApplicationEvaluator(app, { systemLogs });
    const appIdStr = String(app.id || "").trim();
    const lowerAppId = appIdStr.toLowerCase();
    const upperAppId = appIdStr.toUpperCase();
    const rawAppStatus = (app.status || "").toLowerCase().trim();
    const isAppApproved = isApplicationApproved(app);
    const isLocalUnderReview = typeof window !== "undefined" && Boolean(appIdStr) && (
      localStorage.getItem(`etayo_status_${appIdStr}`) === "under_review" ||
      localStorage.getItem(`etayo_status_${lowerAppId}`) === "under_review" ||
      localStorage.getItem(`etayo_status_${upperAppId}`) === "under_review" ||
      rawAppStatus === "under_review"
    );
    const isPending = !isAppApproved && !isActuallyReleased && !isLocalUnderReview && (rawAppStatus === "pending" || !rawAppStatus);



    const effectiveStatus = isActuallyReleased 
      ? "released" 
      : (isAppApproved 
          ? "approved" 
          : (isLocalUnderReview ? "under_review" : (rawAppStatus || "pending")));
    const statusConfig = getStatusConfig(effectiveStatus, app);
    const StatusIcon = statusConfig.icon;
    // Show Stage 2 progression banner ONLY if LC is officially Released (not when it's only Step 3 / Approved)
    const isReleasedLC = isLocationalClearance && (isActuallyReleased || (app.status || "").toLowerCase() === "released");
    const isArchived = isAppArchived(app);

    return (
      <div 
        key={app.id}
        className="track-application-card"
        style={{
          borderLeft: `6px solid ${statusConfig.border}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          transition: "all 0.2s ease"
        }}
      >
        {/* TOP HEADER ROW: CHIPS & STATUS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            {/* Tracking ID Badge with Instant Copy */}
            <button
              type="button"
              onClick={(e) => handleCopyId(app.id, e)}
              title="Click to copy Tracking ID"
              style={{
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                padding: "5px 12px",
                fontSize: "0.85rem",
                fontWeight: "800",
                color: "#0f172a",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              <code style={{ fontFamily: "monospace", fontSize: "0.88rem" }}>{app.id}</code>
              {copiedId === app.id ? (
                <Check size={14} color="#16a34a" />
              ) : (
                <Copy size={14} color="#64748b" />
              )}
            </button>

            {/* Permit Type Badge */}
            {isLocationalClearance ? (
              <span style={{
                background: "#eff6ff",
                color: "#1e40af",
                fontSize: "0.76rem",
                fontWeight: "800",
                padding: "4px 10px",
                borderRadius: "8px",
                border: "1px solid #bfdbfe",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}>
                <ShieldCheck size={13} /> Stage 1 · Locational Clearance
              </span>
            ) : (
              <span style={{
                background: "#f5f3ff",
                color: "#5b21b6",
                fontSize: "0.76rem",
                fontWeight: "800",
                padding: "4px 10px",
                borderRadius: "8px",
                border: "1px solid #ddd6fe",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}>
                <Sparkles size={13} /> Stage 2 · {app.projectType || "Unified Technical Permits"}
              </span>
            )}

            {/* Archive Status Pill if archived */}
            {isArchived && (
              <span style={{
                background: "#ede9fe",
                color: "#6d28d9",
                fontSize: "0.72rem",
                fontWeight: "800",
                padding: "3px 8px",
                borderRadius: "6px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}>
                <Archive size={12} /> Archived
              </span>
            )}
          </div>

          {/* Status Pill */}
          <div style={{
            background: statusConfig.bg,
            color: statusConfig.color,
            border: `1.5px solid ${statusConfig.border}40`,
            borderRadius: "999px",
            padding: "5px 14px",
            fontSize: "0.84rem",
            fontWeight: "800",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
          }}>
            <StatusIcon size={15} strokeWidth={2.5} />
            <span>{statusConfig.label}</span>
          </div>
        </div>

        {/* PROJECT TITLE & LOCATION */}
        <div style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "1.35rem", fontWeight: "900", color: "#0f172a", letterSpacing: "-0.3px" }}>
            {app.projectName || (isLocationalClearance ? "Locational Clearance Application" : "Unified Permitting Dossier")}
          </h3>
          
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", color: "#64748b", fontSize: "0.88rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <MapPin size={15} color="#94a3b8" />
              <span>{app.projectAddress || "Sto. Tomas, Pampanga"}</span>
            </div>

            {app.projectType && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Building2 size={15} color="#94a3b8" />
                <span>{app.projectType}</span>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Calendar size={15} color="#94a3b8" />
              <span>Filed on: <strong>{formatSubmissionDateTime(app, { systemLogs }).date}</strong></span>
              <span style={{ color: "#cbd5e1" }}>•</span>
              <Clock size={14} color="#94a3b8" />
              <strong>{formatSubmissionDateTime(app, { systemLogs }).time}</strong>
            </div>

            {evaluator.isAssigned && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                color: "#1d4ed8",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                padding: "2px 8px",
                borderRadius: "6px",
                fontSize: "0.82rem",
                fontWeight: "700"
              }}>
                <UserCheck size={13} color="#2563eb" />
                <span>Evaluated by: <strong>{evaluator.name}</strong></span>
                {evaluator.role && (
                  <span style={{ color: "#3b82f6", fontSize: "0.74rem", fontWeight: "600" }}>· {evaluator.role}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 4-STAGE VISUAL TIMELINE STEPPER */}
        <div className="track-timeline-stepper">
          <div className="track-timeline-grid">
            {[
              { 
                num: 1, 
                label: "Filed", 
                desc: "Submitted Online", 
                active: true, 
                current: !isAppApproved && !isActuallyReleased && (statusConfig.step === 1) 
              },
              { 
                num: 2, 
                label: "Evaluation", 
                desc: effectiveStatus === "under_review" ? "Under Evaluation" : "Technical Review", 
                active: isAppApproved || isActuallyReleased || statusConfig.step >= 2 || effectiveStatus === "under_review", 
                current: !isAppApproved && !isActuallyReleased && (statusConfig.step === 2 || effectiveStatus === "under_review") 
              },
              { 
                num: 3, 
                label: isLocationalClearance ? "Zoning Clearance" : "Endorsement", 
                desc: (isAppApproved || isActuallyReleased || app.status === "approved" || rawAppStatus.includes("approv") || app.status === "released") 
                  ? (isLocationalClearance ? "Zoning Review Approved ✓" : "Approved & Endorsed ✓") 
                  : (isLocationalClearance ? "Zoning Review" : "Chief OBO Approval"), 
                active: isAppApproved || isActuallyReleased || statusConfig.step >= 3, 
                current: isAppApproved && !isActuallyReleased 
              },
              { 
                num: 4, 
                label: "Released", 
                desc: isActuallyReleased 
                  ? "Permit Released ✓" 
                  : (paymentInfo.confirmed ? "Cashier Verifying" : "Order of Payment"), 
                active: Boolean(isActuallyReleased), 
                current: Boolean(isActuallyReleased) 
              }
            ].map((step) => (
              <div key={step.num} className="track-timeline-step">
                <div style={{
                  height: "7px",
                  width: "100%",
                  borderRadius: "999px",
                  background: step.active ? "#10b981" : "#cbd5e1",
                  marginBottom: "8px",
                  boxShadow: step.current ? `0 0 10px #10b98190` : "none",
                  transition: "all 0.3s ease"
                }} />
                <div className="track-step-title" style={{
                  fontWeight: step.active ? "800" : "600",
                  color: step.active ? "#0f172a" : "#94a3b8"
                }}>
                  <span className="track-step-num">{step.num}.</span>{" "}
                  <span className="track-step-label">{step.label}</span>
                </div>
                <div className="track-step-desc" style={{ 
                  color: step.active ? (step.num === 4 ? "#16a34a" : "#059669") : "#64748b"
                }}>
                  {step.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FORMAL DISAPPROVAL / REJECTION BANNER */}
        {app.status === "rejected" && (
          <div style={{
            background: "linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)",
            border: "1.5px solid #fca5a5",
            borderRadius: "16px",
            padding: "1.25rem 1.4rem",
            marginBottom: "1.25rem",
            boxShadow: "0 4px 14px rgba(220, 38, 38, 0.08)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1, minWidth: "260px" }}>
                <div style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #fca5a5",
                  flexShrink: 0
                }}>
                  <XCircle size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "900", color: "#991b1b" }}>
                      Application Disapproved / Rejected
                    </h4>
                    <span style={{
                      fontSize: "0.72rem",
                      fontWeight: "800",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: "#fee2e2",
                      color: "#b91c1c",
                      border: "1px solid #f87171"
                    }}>
                      Re-Application Allowed
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#7f1d1d", marginTop: "4px", lineHeight: "1.5" }}>
                    {app.rejectionReason || app.evaluationNotes || app.feedback || (
                      typeof app.remarks === "string" ? app.remarks : "This application has been formally disapproved by the municipal evaluating officer. Since active applications are limited to 1 permit per project type, this application is now closed and you are permitted to submit a brand new corrected application."
                    )}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#991b1b", marginTop: "6px", fontWeight: "600" }}>
                    Per municipal policy: 1 permit per project type only. Because this application is disapproved, the slot is now open and you may submit a new application.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <Link
                  href={`/applicant/apply?reapplyFrom=${encodeURIComponent(app.id)}&type=${encodeURIComponent(typeof app.projectType === "object" ? (app.projectType as any)?.name || "" : app.projectType || "")}`}
                  style={{
                    background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                    color: "white",
                    padding: "9px 18px",
                    borderRadius: "10px",
                    fontSize: "0.88rem",
                    fontWeight: "800",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)"
                  }}
                >
                  <RotateCcw size={16} />
                  <span>Apply Again (New Application)</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ORDER OF PAYMENT & SETTLEMENT ACTION CARD */}
        {(app.status === "approved" || isAppApproved) && app.status !== "released" && !isActuallyReleased && (
          <div style={{
            background: paymentInfo.confirmed
              ? "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)"
              : "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
            border: `1.5px solid ${paymentInfo.confirmed ? "#86efac" : "#fde68a"}`,
            borderRadius: "16px",
            padding: "1.25rem 1.4rem",
            marginBottom: "1.25rem",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.04)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1, minWidth: "260px" }}>
                <div style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: paymentInfo.confirmed ? "#dcfce7" : "#fef3c7",
                  color: paymentInfo.confirmed ? "#16a34a" : "#d97706",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${paymentInfo.confirmed ? "#bbf7d0" : "#fcd34d"}`
                }}>
                  {paymentInfo.confirmed ? (
                    <CheckCircle2 size={24} strokeWidth={2.5} />
                  ) : (
                    <CreditCard size={24} strokeWidth={2.5} />
                  )}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: paymentInfo.confirmed ? "#166534" : "#92400e" }}>
                      {paymentInfo.confirmed
                        ? "Payment Confirmation Submitted (Awaiting Verification)"
                        : "Approved · Order of Payment Issued"}
                    </h4>
                    <span style={{
                      fontSize: "0.72rem",
                      fontWeight: "800",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: paymentInfo.confirmed ? "#dcfce7" : "#fee2e2",
                      color: paymentInfo.confirmed ? "#15803d" : "#b91c1c",
                      border: `1px solid ${paymentInfo.confirmed ? "#86efac" : "#fca5a5"}`
                    }}>
                      {paymentInfo.confirmed ? "Under Cashier Review" : "Payment Required"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.84rem", color: paymentInfo.confirmed ? "#15803d" : "#78350f", marginTop: "4px", lineHeight: "1.45" }}>
                    {paymentInfo.confirmed ? (
                      <>
                        You confirmed payment under Reference: <strong>{paymentInfo.reference}</strong> ({paymentInfo.method}). The Municipal Building Official cashier is verifying this transaction to release your permits.
                      </>
                    ) : (
                      <>
                        Your application is approved! Settle the assessed regulatory amount of <strong style={{ color: "#b45309", fontSize: "0.95rem" }}>PHP {getAuthoritativePermitFee(app, app.id).toLocaleString()}</strong> (Ref: <strong>{app.orderOfPaymentNo || `OP-${app.id?.replace(/^[A-Za-z]+-/i, "") || "2026"}`}</strong>) to immediately unlock and release your official signed permits.
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <Link
                  href={`/applicant/messages?ref=${app.id}`}
                  style={{
                    background: "#ffffff",
                    color: "#059669",
                    border: "1.5px solid #10b981",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontWeight: "800",
                    fontSize: "0.86rem",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                    transition: "all 0.15s ease"
                  }}
                >
                  <Send size={15} />
                  <span>Send Receipt on Messages</span>
                </Link>

                {paymentInfo.confirmed && (
                  <div style={{
                    background: "#dcfce7",
                    border: "1px solid #86efac",
                    padding: "7px 12px",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    color: "#166534",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <Clock size={14} />
                    <span>Cashier Verification Pending</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PERMIT OFFICIALLY RELEASED & PROCESS COMPLETE BANNER */}
        {(app.status === "released" || isActuallyReleased) && (
          <div style={{
            background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
            border: "1.5px solid #86efac",
            borderRadius: "16px",
            padding: "1.25rem 1.4rem",
            marginBottom: "1.25rem",
            boxShadow: "0 4px 14px rgba(16, 185, 129, 0.08)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "260px" }}>
                <div style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "#dcfce7",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #86efac"
                }}>
                  <CheckCircle size={26} strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "900", color: "#166534" }}>
                      Official Permits Released — Process Complete!
                    </h4>
                    <span style={{
                      fontSize: "0.72rem",
                      fontWeight: "800",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: "#dcfce7",
                      color: "#15803d",
                      border: "1px solid #86efac"
                    }}>
                      Step 4 Complete
                    </span>
                  </div>
                  <div style={{ fontSize: "0.84rem", color: "#15803d", marginTop: "3px" }}>
                    Settlement verified under Official Receipt No: <strong>{(app as any).officialReceiptNo || "OR-2026-OFFICIAL"}</strong>
                  </div>
                </div>
              </div>

              <Link
                href={`/applicant/track/${encodeURIComponent(app.id)}`}
                style={{
                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  color: "white",
                  padding: "9px 18px",
                  borderRadius: "10px",
                  fontSize: "0.88rem",
                  fontWeight: "800",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)"
                }}
              >
                <Download size={16} />
                <span>Download Official Documents</span>
              </Link>
            </div>
          </div>
        )}

        {/* BANNER FOR RELEASED LOCATIONAL CLEARANCE (LILITAW LANG PAG RELEASED NA, HINDI SA STEP 3) */}
        {isReleasedLC && (
          connectedStage2App ? (
            <div style={{
              background: connectedStage2App.status === "rejected"
                ? "linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)"
                : connectedStage2App.status === "approved" || connectedStage2App.status === "released"
                ? "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)"
                : "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
              border: `1.5px solid ${
                connectedStage2App.status === "rejected"
                  ? "#fca5a5"
                  : connectedStage2App.status === "approved" || connectedStage2App.status === "released"
                  ? "#86efac"
                  : "#fde68a"
              }`,
              borderRadius: "14px",
              padding: "1rem 1.25rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: connectedStage2App.status === "rejected"
                    ? "#fee2e2"
                    : connectedStage2App.status === "approved" || connectedStage2App.status === "released"
                    ? "#dcfce7"
                    : "#fef3c7",
                  color: connectedStage2App.status === "rejected"
                    ? "#dc2626"
                    : connectedStage2App.status === "approved" || connectedStage2App.status === "released"
                    ? "#16a34a"
                    : "#d97706",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${
                    connectedStage2App.status === "rejected"
                      ? "#fca5a5"
                      : connectedStage2App.status === "approved" || connectedStage2App.status === "released"
                      ? "#bbf7d0"
                      : "#fcd34d"
                  }`
                }}>
                  {connectedStage2App.status === "rejected" ? (
                    <XCircle size={20} strokeWidth={2.5} />
                  ) : connectedStage2App.status === "approved" || connectedStage2App.status === "released" ? (
                    <CheckCircle2 size={20} strokeWidth={2.5} />
                  ) : (
                    <Clock size={20} strokeWidth={2.5} />
                  )}
                </div>
                <div>
                  <div style={{
                    fontSize: "0.92rem",
                    fontWeight: "800",
                    color: connectedStage2App.status === "rejected"
                      ? "#991b1b"
                      : connectedStage2App.status === "approved" || connectedStage2App.status === "released"
                      ? "#166534"
                      : "#92400e",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap"
                  }}>
                    <span>
                      {connectedStage2App.status === "approved" || connectedStage2App.status === "released"
                        ? `Stage 2 Complete: Technical Permits Approved (${connectedStage2App.id})`
                        : connectedStage2App.status === "rejected"
                        ? `Stage 2 Disapproved / Rejected (${connectedStage2App.id})`
                        : `Stage 2 Connected: Technical Permits Awaiting Review (${connectedStage2App.id})`}
                    </span>
                    <span style={{
                      fontSize: "0.72rem",
                      fontWeight: "800",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: connectedStage2App.status === "rejected"
                        ? "#fee2e2"
                        : connectedStage2App.status === "approved" || connectedStage2App.status === "released" ? "#dcfce7" : "#fef9c3",
                      color: connectedStage2App.status === "rejected"
                        ? "#b91c1c"
                        : connectedStage2App.status === "approved" || connectedStage2App.status === "released" ? "#15803d" : "#b45309",
                      border: `1px solid ${connectedStage2App.status === "rejected" ? "#f87171" : connectedStage2App.status === "approved" || connectedStage2App.status === "released" ? "#86efac" : "#fde047"}`
                    }}>
                      {connectedStage2App.status === "rejected" ? "Disapproved" : connectedStage2App.status === "approved" || connectedStage2App.status === "released" ? "Approved" : "Pending Review"}
                    </span>
                  </div>
                  <div style={{
                    fontSize: "0.82rem",
                    color: connectedStage2App.status === "rejected"
                      ? "#7f1d1d"
                      : connectedStage2App.status === "approved" || connectedStage2App.status === "released"
                      ? "#15803d"
                      : "#78350f",
                    marginTop: "2px"
                  }}>
                    {connectedStage2App.status === "rejected"
                      ? `Your Stage 2 technical permit application was disapproved by the evaluator. Since 1 permit per project type is enforced, you can now file a brand new Stage 2 submission.`
                      : connectedStage2App.status === "approved" || connectedStage2App.status === "released"
                      ? `Both your locational zoning clearance and technical permitting forms have been verified and approved.`
                      : `You have completed this step! Your Stage 2 permitting forms (${connectedStage2App.id}) are officially linked to this clearance and currently awaiting municipal approval.`}
                  </div>
                </div>
              </div>

              {connectedStage2App.status === "rejected" ? (
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <Link 
                    href={`/applicant/track/${encodeURIComponent(connectedStage2App.id)}`}
                    style={{
                      background: "#ffffff",
                      border: "1.5px solid #cbd5e1",
                      color: "#334155",
                      padding: "8px 14px",
                      borderRadius: "10px",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <span>View Remarks</span>
                  </Link>
                  <Link 
                    href={`/applicant/apply?clearanceRef=${encodeURIComponent(app.id)}&step=3&reapplyFrom=${encodeURIComponent(connectedStage2App.id)}`}
                    style={{
                      background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "10px",
                      fontSize: "0.85rem",
                      fontWeight: "800",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)"
                    }}
                  >
                    <RotateCcw size={15} />
                    <span>Re-Apply Stage 2 Permits</span>
                  </Link>
                </div>
              ) : (
                <Link 
                  href={`/applicant/track/${encodeURIComponent(connectedStage2App.id)}`}
                  style={{
                    background: connectedStage2App.status === "approved" || connectedStage2App.status === "released"
                      ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                      : "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontSize: "0.85rem",
                    fontWeight: "800",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: connectedStage2App.status === "approved" || connectedStage2App.status === "released"
                      ? "0 4px 12px rgba(5, 150, 105, 0.25)"
                      : "0 4px 12px rgba(217, 119, 6, 0.25)"
                  }}
                >
                  <span>View Stage 2 Permits ({connectedStage2App.id})</span>
                  <ArrowRight size={15} />
                </Link>
              )}
            </div>
          ) : (
            <div style={{
              background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
              border: "1.5px solid #86efac",
              borderRadius: "14px",
              padding: "1rem 1.25rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
              boxShadow: "0 2px 10px rgba(16, 185, 129, 0.08)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: "800", color: "#166534" }}>
                    Stage 1 Prerequisite Passed! Clearance Ref: {app.id}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#15803d" }}>
                    Your locational zoning is officially approved and released. You can now proceed to Stage 2 Technical Permitting Forms with all fields prefilled.
                  </div>
                </div>
              </div>

              <Link 
                href={`/applicant/apply?clearanceRef=${encodeURIComponent(app.id)}&step=3`}
                style={{
                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: "800",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)"
                }}
              >
                <span>Proceed to Step 3: Permitting Forms</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          )
        )}

        {/* FOOTER ROW WITH ACTIONS */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.85rem",
          borderTop: "1.5px solid #f1f5f9",
          paddingTop: "1rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.82rem", color: "#64748b", flexWrap: "wrap" }}>
            <span>Permit Dossier: <strong>{app.requirements?.length || 1} Document(s)</strong></span>
            {app.locationalClearanceRef ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                • Linked Prerequisite: <strong style={{ color: "#059669" }}>LC ({app.locationalClearanceRef}) ✓ Approved</strong>
              </span>
            ) : connectedLCApp ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                • Linked Prerequisite: <strong style={{ color: "#059669" }}>LC ({connectedLCApp.id}) ✓ Approved</strong>
              </span>
            ) : connectedStage2App ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                • Connected Stage 2: <strong style={{ color: connectedStage2App.status === "approved" || connectedStage2App.status === "released" ? "#059669" : "#d97706" }}>
                  {connectedStage2App.id} ({connectedStage2App.status === "approved" || connectedStage2App.status === "released" ? "Approved" : "Awaiting Review"})
                </strong>
              </span>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            {/* Message Desk Officer - Only 1 button shown in grouped project dossiers */}
            {!shouldHideMessageDesk && (
              <Link
                href={`/applicant/messages?ref=${encodeURIComponent(app.id)}`}
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #cbd5e1",
                  color: "#334155",
                  padding: "7px 13px",
                  borderRadius: "10px",
                  fontSize: "0.84rem",
                  fontWeight: "700",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  transition: "all 0.15s ease"
                }}
                title="Inquire or message municipal evaluation officer regarding this application"
              >
                <MessageSquare size={14} color="#64748b" />
                <span>Message Desk</span>
              </Link>
            )}

            {/* ARCHIVE / UNARCHIVE ACTION BUTTON */}
            {isArchived ? (
              <button
                type="button"
                onClick={(e) => handleUnarchiveApp(app.id, e)}
                style={{
                  background: "#ede9fe",
                  border: "1.5px solid #ddd6fe",
                  color: "#6d28d9",
                  padding: "7px 13px",
                  borderRadius: "10px",
                  fontSize: "0.84rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  transition: "all 0.15s ease"
                }}
                title="Restore this application back to your active dashboard"
              >
                <ArchiveRestore size={14} />
                <span>Restore to Active</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => handleArchiveApp(app.id, e)}
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #cbd5e1",
                  color: "#475569",
                  padding: "7px 13px",
                  borderRadius: "10px",
                  fontSize: "0.84rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  transition: "all 0.15s ease"
                }}
                title="Archive this application to hide it from your active list"
              >
                <Archive size={14} color="#64748b" />
                <span>Archive</span>
              </button>
            )}

            {/* Cancel or Re-Apply Action Button */}
            {app.status === "cancelled" ? (
              <span style={{
                background: "#fee2e2",
                color: "#991b1b",
                border: "1px solid #fca5a5",
                padding: "6px 12px",
                borderRadius: "10px",
                fontSize: "0.82rem",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}>
                <XCircle size={14} color="#dc2626" /> Cancelled
              </span>
            ) : app.status === "rejected" ? (
              <Link
                href={`/applicant/apply?reapplyFrom=${encodeURIComponent(app.id)}&type=${encodeURIComponent(typeof app.projectType === "object" ? (app.projectType as any)?.name || "" : app.projectType || "")}`}
                style={{
                  background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                  color: "white",
                  padding: "7px 14px",
                  borderRadius: "10px",
                  fontSize: "0.84rem",
                  fontWeight: "800",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  boxShadow: "0 2px 8px rgba(220, 38, 38, 0.25)"
                }}
                title="Create a fresh application replacing this disapproved permit"
              >
                <RotateCcw size={14} />
                <span>Re-Apply</span>
              </Link>
            ) : app.status !== "released" ? (
              <button
                type="button"
                onClick={() => {
                  setAppToCancel(app);
                  setCancelReason("Change of project plans");
                }}
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #fca5a5",
                  color: "#b91c1c",
                  padding: "7px 12px",
                  borderRadius: "10px",
                  fontSize: "0.84rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  transition: "all 0.15s ease"
                }}
                title="Cancel or withdraw this application"
              >
                <XCircle size={14} color="#dc2626" />
                <span>Cancel</span>
              </button>
            ) : null}

            {/* View Full Timeline Dossier Button */}
            <Link
              href={`/applicant/track/${app.id}`}
              style={{
                background: "linear-gradient(135deg, #0038A8 0%, #021a4f 100%)",
                color: "#ffffff",
                padding: "7px 16px",
                borderRadius: "10px",
                fontSize: "0.86rem",
                fontWeight: "800",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: "0 3px 10px rgba(0, 56, 168, 0.35)"
              }}
            >
              <span>View Full Timeline</span>
              <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-page animate-fade-in-up" style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* INTERACTIVE KPI STATS DASHBOARD (ONLY FOR LOGGED IN USERS) */}
      {isLoggedIn && (
        <section className="track-kpi-grid">
          {/* Card 1: Active Total */}
          <div 
            onClick={() => { setActiveTab("active"); setStatusFilter("all"); }}
            className="track-kpi-card"
            style={{ 
              background: activeTab === "active" && statusFilter === "all" ? "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)" : "#ffffff", 
              border: activeTab === "active" && statusFilter === "all" ? "2px solid #0038A8" : "1.5px solid #e2e8f0", 
              boxShadow: activeTab === "active" && statusFilter === "all" ? "0 8px 24px rgba(0, 56, 168, 0.18)" : "0 2px 10px rgba(0,0,0,0.02)"
            }}
            title="Click to show all active applications"
          >
            <div style={{ marginBottom: "0.55rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", color: "#0038A8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={19} />
              </div>
            </div>
            <div>
              <div className="track-kpi-num">{stats.activeTotal}</div>
              <div 
                className="track-kpi-label"
                style={{ color: activeTab === "active" && statusFilter === "all" ? "#0038A8" : "#64748b" }}
              >
                {t("Active Permits", "Active Permits")}
              </div>
            </div>
          </div>

          {/* Card 2: Under Review */}
          <div 
            onClick={() => { setActiveTab("active"); setStatusFilter("under_review"); }}
            className="track-kpi-card"
            style={{ 
              background: activeTab === "active" && statusFilter === "under_review" ? "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)" : "#ffffff", 
              border: activeTab === "active" && statusFilter === "under_review" ? "2px solid #0038A8" : "1.5px solid #e2e8f0", 
              boxShadow: activeTab === "active" && statusFilter === "under_review" ? "0 8px 24px rgba(0, 56, 168, 0.18)" : "0 2px 10px rgba(0,0,0,0.02)"
            }}
            title={t("Click to filter by Under Evaluation", "Click to filter by Under Evaluation")}
          >
            <div style={{ marginBottom: "0.55rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", color: "#0038A8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Search size={19} />
              </div>
            </div>
            <div>
              <div className="track-kpi-num">{stats.review}</div>
              <div 
                className="track-kpi-label"
                style={{ color: activeTab === "active" && statusFilter === "under_review" ? "#0038A8" : "#64748b" }}
              >
                {t("Under Evaluation", "Under Evaluation")}
              </div>
            </div>
          </div>

          {/* Card 3: Approved / Released */}
          <div 
            onClick={() => { setActiveTab("active"); setStatusFilter("approved"); }}
            className="track-kpi-card"
            style={{ 
              background: activeTab === "active" && statusFilter === "approved" ? "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)" : "#ffffff", 
              border: activeTab === "active" && statusFilter === "approved" ? "2px solid #059669" : "1.5px solid #e2e8f0", 
              boxShadow: activeTab === "active" && statusFilter === "approved" ? "0 8px 24px rgba(5, 150, 105, 0.12)" : "0 2px 10px rgba(0,0,0,0.02)"
            }}
            title={t("Click to filter by Approved & Released", "Click to filter by Approved & Released")}
          >
            <div style={{ marginBottom: "0.55rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#d1fae5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 size={19} />
              </div>
            </div>
            <div>
              <div className="track-kpi-num">{stats.approved}</div>
              <div 
                className="track-kpi-label"
                style={{ color: activeTab === "active" && statusFilter === "approved" ? "#059669" : "#64748b" }}
              >
                {t("Approved & Released", "Approved & Released")}
              </div>
            </div>
          </div>

          {/* Card 4: Action Required */}
          <div 
            onClick={() => { setActiveTab("active"); setStatusFilter("incomplete_requirements"); }}
            className="track-kpi-card"
            style={{ 
              background: activeTab === "active" && statusFilter === "incomplete_requirements" ? "linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)" : "#ffffff", 
              border: activeTab === "active" && statusFilter === "incomplete_requirements" ? "2px solid #dc2626" : "1.5px solid #e2e8f0", 
              boxShadow: activeTab === "active" && statusFilter === "incomplete_requirements" ? "0 8px 24px rgba(220, 38, 38, 0.12)" : "0 2px 10px rgba(0,0,0,0.02)"
            }}
            title={t("Click to filter by Action Required", "Click to filter by Action Required")}
          >
            <div style={{ marginBottom: "0.55rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={19} />
              </div>
            </div>
            <div>
              <div className="track-kpi-num">{stats.action}</div>
              <div 
                className="track-kpi-label"
                style={{ color: activeTab === "active" && statusFilter === "incomplete_requirements" ? "#dc2626" : "#64748b" }}
              >
                {t("Action Required", "Action Required")}
              </div>
            </div>
          </div>

          {/* Card 5: ARCHIVE TAB CARD */}
          <div 
            onClick={() => { setActiveTab("archived"); setStatusFilter("all"); }}
            className="track-kpi-card"
            style={{ 
              background: activeTab === "archived" ? "linear-gradient(135deg, #f8fafc 0%, #ede9fe 100%)" : "#ffffff", 
              border: activeTab === "archived" ? "2px solid #7c3aed" : "1.5px solid #e2e8f0", 
              boxShadow: activeTab === "archived" ? "0 8px 24px rgba(124, 58, 237, 0.15)" : "0 2px 10px rgba(0,0,0,0.02)"
            }}
            title={t("Click to view Archived applications", "Click to view Archived applications")}
          >
            <div style={{ marginBottom: "0.55rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f5f3ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Archive size={19} />
              </div>
            </div>
            <div>
              <div className="track-kpi-num">{stats.archivedTotal}</div>
              <div 
                className="track-kpi-label"
                style={{ color: activeTab === "archived" ? "#7c3aed" : "#64748b" }}
              >
                {t("Archived Permits", "Archived Permits")}
              </div>
            </div>
          </div>
        </section>
      )}



      {/* FILTER & SEARCH TOOLBAR */}
      <section className="track-filter-toolbar">
        {/* Search Filter */}
        <div className="track-filter-search">
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input 
            type="text" 
            placeholder={t("Search project name, reference ID, barangay...", "Search project name, reference ID, barangay...")}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "0.88rem",
              outline: "none"
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                fontWeight: "700",
                fontSize: "1rem"
              }}
            >
              &times;
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="track-filter-actions">
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} color="#64748b" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                fontWeight: "600",
                color: "#334155",
                background: "#f8fafc",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="all">{t("All Statuses", "All Statuses")}</option>
              <option value="pending">{t("Pending Review", "Pending Review")}</option>
              <option value="under_review">{t("Under Evaluation", "Under Evaluation")}</option>
              <option value="approved">{t("Approved & Released", "Approved / Released")}</option>
              <option value="incomplete_requirements">{t("Action Required", "Action Required")}</option>
              <option value="cancelled">{t("Cancelled", "Cancelled")}</option>
            </select>
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                fontWeight: "600",
                color: "#334155",
                background: "#f8fafc",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="all">{t("All Permit Types", "All Permit Types")}</option>
              <option value="locational_clearance">{t("Stage 1 · Locational Clearance", "Stage 1 · Locational Clearance")}</option>
              <option value="building_permit">{t("Stage 2 · Unified Technical Permits", "Stage 2 · Unified Technical Permits")}</option>
            </select>
          </div>

          {(searchTerm || statusFilter !== "all" || typeFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setTypeFilter("all");
              }}
              style={{
                background: "#fee2e2",
                color: "#991b1b",
                border: "none",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "0.78rem",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              {t("Reset Filters", "Reset Filters")}
            </button>
          )}
        </div>

        {/* DOSSIER COUNT & MANUAL SYNC BUTTON */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: "0.5rem", paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9" }}>
          <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>
            {language === "fil" 
              ? `${projectDossiers.length} Dossier ng Proyekto` 
              : `${projectDossiers.length} Project Dossier${projectDossiers.length !== 1 ? "s" : ""}`}
          </span>
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "5px 12px",
              fontSize: "0.8rem",
              fontWeight: "700",
              color: "#334155",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            title={t("Click to fetch the latest approval and permit status directly from the municipal server", "Click to fetch the latest approval and permit status directly from the municipal server")}
          >
            <RefreshCw size={13} style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />
            <span>{isRefreshing ? t("Syncing...", "Syncing...") : t("Sync Live Status", "Sync Live Status")}</span>
          </button>
        </div>
      </section>

      {/* APPLICATIONS LIST */}
      <section>
        {!isLoggedIn ? (
          <div style={{
            background: "#ffffff",
            borderRadius: "22px",
            border: "1.5px solid #e2e8f0",
            padding: "3.5rem 2rem",
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
          }}>
            <div style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              background: "#eff6ff",
              color: "#0038A8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem auto",
              boxShadow: "0 4px 12px rgba(0, 56, 168, 0.2)"
            }}>
              <Lock size={32} />
            </div>
            <h3 style={{ fontSize: "1.35rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.5rem 0" }}>
              Sign In to View Your Application History
            </h3>
            <p style={{ margin: "0 auto 1.75rem auto", color: "#64748b", fontSize: "0.95rem", maxWidth: "520px", lineHeight: "1.5" }}>
              Personal applications and clearance certificates are strictly protected. Sign in with your registered eTAYO account to securely view your permits, review notes, and approved documents.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
              <Link href="/login?redirect=/applicant/track" className="btn-primary" style={{ padding: "0.75rem 1.6rem", borderRadius: "12px", fontWeight: "700" }}>
                Sign In to Account
              </Link>
              <Link href="/register" className="btn-secondary" style={{ padding: "0.75rem 1.6rem", borderRadius: "12px", fontWeight: "600", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#334155" }}>
                Register New Account
              </Link>
            </div>
          </div>
        ) : filteredApps.length === 0 ? (
          <div style={{
            background: "rgba(255,255,255,0.7)",
            borderRadius: "22px",
            border: "2px dashed #cbd5e1",
            padding: "4rem 2rem",
            textAlign: "center"
          }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: activeTab === "archived" ? "#f5f3ff" : "#f1f5f9",
              color: activeTab === "archived" ? "#7c3aed" : "#94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem auto"
            }}>
              {activeTab === "archived" ? <Archive size={30} /> : <FileText size={30} />}
            </div>

            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#1e293b", margin: "0 0 0.4rem 0" }}>
              {activeTab === "archived" ? "No Archived Applications" : "No Applications Found"}
            </h3>

            <p style={{ margin: "0 auto 1.5rem auto", color: "#64748b", fontSize: "0.92rem", maxWidth: "480px", lineHeight: "1.5" }}>
              {activeTab === "archived"
                ? "You haven't archived any applications yet. When an application is completed, released, or cancelled, you can archive it to keep your active workspace organized."
                : (searchTerm || statusFilter !== "all" || typeFilter !== "all")
                ? "No applications match your active search filters. Try clearing your filters above."
                : "You have not submitted any permit applications under this account yet. Click below to begin your official application."}
            </p>

            {activeTab === "archived" ? (
              <button
                type="button"
                onClick={() => setActiveTab("active")}
                style={{
                  background: "#7c3aed",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "10px 20px",
                  fontWeight: "700",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <FileText size={16} /> Return to Active Applications
              </button>
            ) : (
              <Link href="/applicant/apply" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                <Plus size={16} /> File New Application
              </Link>
            )}
          </div>
        ) : viewMode === "project" ? (
          /* VIEW 1: GROUPED BY PROJECT DOSSIER */
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {projectDossiers.map(dossier => {
              const isExpanded = isDossierExpanded(dossier.id);
              const hasPending = dossier.pendingCount > 0;
              const hasAction = dossier.actionRequiredCount > 0;
              const allApproved = dossier.approvedCount === dossier.totalCount && dossier.totalCount > 0;
              const borderStatusColor = hasAction ? "#ef4444" : hasPending ? "#f59e0b" : allApproved ? "#10b981" : "#0038A8";

              return (
                <div
                  key={dossier.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "20px",
                    border: "1.5px solid #e2e8f0",
                    borderLeft: `5px solid ${borderStatusColor}`,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                    overflow: "hidden",
                    transition: "all 0.2s ease"
                  }}
                >
                  {/* DOSSIER HEADER CARD */}
                  <div
                    onClick={() => toggleDossier(dossier.id)}
                    style={{
                      padding: "1.25rem 1.5rem",
                      background: hasPending ? "linear-gradient(180deg, #fdfbf7 0%, #ffffff 100%)" : "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "1.25rem",
                      borderBottom: isExpanded ? "1px solid #f1f5f9" : "none"
                    }}
                  >
                    {/* Left: Project Dossier Title & Meta */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: "280px", flex: 1 }}>
                      <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "14px",
                        background: hasPending ? "#fef3c7" : allApproved ? "#d1fae5" : "#eff6ff",
                        color: hasPending ? "#b45309" : allApproved ? "#059669" : "#0038A8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
                      }}>
                        <Building2 size={24} />
                      </div>

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                            {dossier.projectName}
                          </h3>
                          {(() => {
                            const isAnyUnderReview = dossier.applications.some(a => {
                              if (isApplicationApproved(a)) return false;
                              const aId = String(a.id || "").trim();
                              const isLocalRev = typeof window !== "undefined" && Boolean(aId) && (
                                localStorage.getItem(`etayo_status_${aId}`) === "under_review" ||
                                localStorage.getItem(`etayo_status_${aId.toLowerCase()}`) === "under_review" ||
                                localStorage.getItem(`etayo_status_${aId.toUpperCase()}`) === "under_review"
                              );
                              const raw = (a.status || "").toLowerCase().trim();
                              return raw === "under_review" || isLocalRev;
                            });
                            const isAnyPending = !isAnyUnderReview && dossier.applications.some(a => {
                              if (isApplicationApproved(a)) return false;
                              const raw = (a.status || "").toLowerCase().trim();
                              return raw === "pending" || !raw;
                            });
                            return (
                              <span style={{
                                fontSize: "0.75rem",
                                fontWeight: "800",
                                padding: "3px 9px",
                                borderRadius: "999px",
                                background: hasAction ? "#fee2e2" : isAnyUnderReview ? "#eff6ff" : isAnyPending ? "#fffbeb" : "#f0fdf4",
                                color: hasAction ? "#b91c1c" : isAnyUnderReview ? "#1d4ed8" : isAnyPending ? "#b45309" : "#16a34a",
                                border: `1px solid ${hasAction ? "#fca5a5" : isAnyUnderReview ? "#bfdbfe" : isAnyPending ? "#fde68a" : "#bbf7d0"}`
                              }}>
                                {hasAction ? "Action Required on Requirements" : isAnyUnderReview ? `${dossier.pendingCount || 1} Form Under Evaluation` : isAnyPending ? `${dossier.pendingCount || 1} Form${(dossier.pendingCount || 1) > 1 ? "s" : ""} Awaiting Review` : "All Forms Approved ✓"}
                              </span>
                            );
                          })()}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", color: "#64748b", flexWrap: "wrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <MapPin size={13} color="#94a3b8" /> {dossier.projectAddress}
                          </span>
                          <span>•</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <FolderKanban size={13} color="#94a3b8" /> {dossier.applications.length} Connected Permit Form{dossier.applications.length > 1 ? "s" : ""}
                          </span>
                          <span>•</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#334155", fontWeight: "600" }}>
                            <Calendar size={13} color="#2563eb" /> {formatSubmissionDateTime(dossier, { systemLogs }).date}
                            <span style={{ color: "#cbd5e1" }}>•</span>
                            <Clock size={12} color="#2563eb" /> {formatSubmissionDateTime(dossier, { systemLogs }).time}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Milestone Flow Chips & Expand Arrow */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        {dossier.applications.map((app, idx) => {
                          const badge = getPermitTypeBadge(app.permitType, app.id);
                          const aId = String(app.id || "").trim();
                          const isThisLocalUnderReview = typeof window !== "undefined" && Boolean(aId) && (
                            localStorage.getItem(`etayo_status_${aId}`) === "under_review" ||
                            localStorage.getItem(`etayo_status_${aId.toLowerCase()}`) === "under_review" ||
                            localStorage.getItem(`etayo_status_${aId.toUpperCase()}`) === "under_review"
                          );
                          const isThisApproved = isApplicationApproved(app);
                          const isThisReleased = isActuallyReleasedApp(app) || (app.status || "").toLowerCase() === "released";
                          const isThisPending = !isThisApproved && !isThisReleased && !isThisLocalUnderReview && ((app.status || "").toLowerCase().trim() === "pending" || !app.status);
                          const effSt = isThisReleased 
                            ? "released" 
                            : (isThisApproved 
                                ? "approved" 
                                : (isThisLocalUnderReview || (app.status || "").toLowerCase().trim() === "under_review" ? "under_review" : "pending"));
                          const stConfig = getStatusConfig(effSt, app);
                          return (
                            <React.Fragment key={app.id}>
                              <div style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "4px 10px",
                                borderRadius: "8px",
                                background: stConfig.bg,
                                border: `1px solid ${stConfig.border}50`,
                                fontSize: "0.78rem"
                              }}>
                                <span style={{ fontWeight: "800", color: badge.color }}>[{badge.code}]</span>
                                <span style={{ fontWeight: "700", color: "#1e293b" }}>{badge.label}</span>
                                <span style={{ fontWeight: "700", color: stConfig.color }}>• {stConfig.label}</span>
                              </div>
                              {idx < dossier.applications.length - 1 && (
                                <ArrowRight size={13} color="#94a3b8" />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>

                      <div style={{ 
                        width: "32px", 
                        height: "32px", 
                        borderRadius: "8px", 
                        background: "#f8fafc", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        color: "#64748b"
                      }}>
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED DOSSIER CONTENT */}
                  {isExpanded && (
                    <div style={{ padding: "1.25rem 1.5rem", background: "#f8fafc", display: "flex", flexDirection: "column", gap: "1.25rem", borderTop: "1px solid #f1f5f9" }}>
                      {(() => {
                        // When applications are grouped, determine the single active application for Message Desk
                        const activeMessagingAppId = (() => {
                          const nonLC = dossier.applications.find(a => !String(a.id || "").toLowerCase().startsWith("lc-"));
                          return nonLC ? nonLC.id : dossier.applications[dossier.applications.length - 1]?.id;
                        })();
                        return dossier.applications.map(app => 
                          renderApplicationCard(app, {
                            hideMessageDesk: dossier.applications.length > 1 && app.id !== activeMessagingAppId
                          })
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* VIEW 2: FLAT LIST OF APPLICATION CARDS */
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {filteredApps.map(app => renderApplicationCard(app))}
          </div>
        )}
      </section>

      {/* FLOATING TOAST FEEDBACK NOTIFICATION */}
      {toastMsg && (
        <div className="animate-fade-in-up" style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          zIndex: 9999,
          background: toastMsg.type === "success" ? "#0f172a" : "#1e1b4b",
          color: "white",
          padding: "12px 20px",
          borderRadius: "14px",
          boxShadow: "0 12px 35px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "0.92rem",
          fontWeight: "700",
          border: "1px solid rgba(255,255,255,0.15)"
        }}>
          {toastMsg.type === "success" ? (
            <CheckCircle size={18} color="#22c55e" />
          ) : (
            <Archive size={18} color="#a78bfa" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {appToCancel && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(6px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "22px",
            maxWidth: "520px",
            width: "100%",
            padding: "2rem",
            boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.25rem" }}>
              <div style={{ width: "46px", height: "46px", borderRadius: "14px", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: "900", color: "#0f172a" }}>
                  Cancel Permit Application?
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  Ref ID: <strong style={{ color: "#1e293b" }}>{appToCancel.id}</strong> • {appToCancel.projectName || "Permit Application"}
                </p>
              </div>
            </div>

            <p style={{ fontSize: "0.92rem", color: "#475569", lineHeight: "1.6", margin: "0 0 1.25rem 0" }}>
              Are you sure you want to cancel this application? Once cancelled, municipal evaluation will be stopped. The record will remain archived in your Application Status as <strong>Cancelled</strong>.
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                Reason for Cancellation:
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.88rem",
                  color: "#1e293b",
                  background: "#f8fafc",
                  outline: "none"
                }}
              >
                <option value="Change of project plans">Change of project plans / design modifications</option>
                <option value="Duplicate submission">Accidental duplicate submission</option>
                <option value="Project postponed / cancelled">Project postponed or delayed indefinitely</option>
                <option value="Incorrect information provided">Incorrect project details entered</option>
                <option value="Other municipal requirements">Other reasons</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setAppToCancel(null)}
                disabled={isCancelling}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: "700",
                  fontSize: "0.88rem",
                  cursor: "pointer"
                }}
              >
                Keep Application
              </button>

              <button
                type="button"
                disabled={isCancelling}
                onClick={async () => {
                  setIsCancelling(true);
                  try {
                    await cancelApplication(appToCancel.id, cancelReason);
                    showToast(`Application ${appToCancel.id} has been cancelled.`);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsCancelling(false);
                    setAppToCancel(null);
                  }
                }}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                  color: "#ffffff",
                  fontWeight: "800",
                  fontSize: "0.88rem",
                  cursor: isCancelling ? "wait" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)"
                }}
              >
                <XCircle size={16} />
                <span>{isCancelling ? "Cancelling..." : "Confirm Cancellation"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT CONFIRMATION MODAL FOR APPLICANT */}
      {payingApp && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "1rem"
        }}>
          <div style={{
            background: "white",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "520px",
            padding: "2rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CreditCard size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>
                    Confirm Payment Sent
                  </h3>
                  <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                    Submit proof of fee settlement to unlock official permit release
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPayingApp(null);
                  setPaymentReceiptFile(null);
                }}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Assessment Breakdown Card */}
            <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "14px", padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Permit Application:</span>
                <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#0f172a" }}>{payingApp.id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Order of Payment No:</span>
                <span style={{ fontSize: "0.84rem", fontWeight: "700", color: "#6d28d9" }}>{payingApp.orderOfPaymentNo || `OP-${payingApp.id?.replace(/^[A-Za-z]+-/i, "") || "2026"}`}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px dashed #cbd5e1" }}>
                <span style={{ fontSize: "0.86rem", fontWeight: "700", color: "#334155" }}>Amount Assessed:</span>
                <span style={{ fontSize: "1.25rem", fontWeight: "900", color: "#059669" }}>
                  PHP {getAuthoritativePermitFee(payingApp, payingApp.id).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Form Inputs */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#334155", marginBottom: "5px" }}>
                  Official Receipt (OR) / Transaction Reference No: <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  placeholder="e.g. OR-2026-94812 or GCash Ref"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    color: "#0f172a"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#334155", marginBottom: "5px" }}>
                  Payment Channel:
                </label>
                <select
                  value={paymentMethodInput}
                  onChange={(e) => setPaymentMethodInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.88rem",
                    color: "#0f172a",
                    background: "white"
                  }}
                >
                  <option value="Municipal Treasury Cashier (On-site)">Municipal Treasury Cashier (Town Hall)</option>
                  <option value="GCash (Sto. Tomas Municipal LGU Trust Fund)">GCash (Sto. Tomas LGU)</option>
                  <option value="Landbank Link.BizPortal">Landbank Link.BizPortal</option>
                  <option value="Bank Deposit / Over-the-counter">Bank Deposit / Over-the-counter</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  Upload Receipt Photo / Proof of Settlement: <span style={{ color: "#059669" }}>(Sent to Chat &amp; Admin)</span>
                </label>
                {paymentReceiptFile ? (
                  <div style={{
                    position: "relative",
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "1.5px solid #86efac",
                    background: "#f0fdf4",
                    padding: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                  }}>
                    <img
                      src={paymentReceiptFile.dataUrl}
                      alt="Receipt preview"
                      style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.86rem", fontWeight: "800", color: "#166534", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {paymentReceiptFile.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#15803d", marginTop: "2px" }}>
                        ✓ Photo attached. Will be sent directly into the message conversation for the admin to inspect and confirm.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentReceiptFile(null)}
                      style={{
                        background: "#fee2e2",
                        border: "1px solid #fca5a5",
                        color: "#b91c1c",
                        borderRadius: "8px",
                        padding: "6px 12px",
                        fontSize: "0.76rem",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "1rem",
                    borderRadius: "12px",
                    border: "2px dashed #94a3b8",
                    background: "#f8fafc",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#059669", fontWeight: "800", fontSize: "0.88rem" }}>
                      <Camera size={18} />
                      <span>Take Photo or Upload Official Receipt / Screenshot</span>
                    </div>
                    <span style={{ fontSize: "0.76rem", color: "#64748b" }}>
                      PNG o JPEG (JPG) lamang ang tinatanggap na format para sa resibo
                    </span>
                    <input
                      type="file"
                      accept=".png,.jpeg,.jpg,image/png,image/jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
                        const isJpeg = file.type === "image/jpeg" || file.type === "image/jpg" || /\.(jpe?g)$/i.test(file.name);
                        if (!isPng && !isJpeg) {
                          setReceiptError("Bawal ang file na ito! Tanging PNG o JPEG (.png, .jpeg, .jpg) lamang ang tinatanggap na format para sa resibo.");
                          e.target.value = "";
                          return;
                        }
                        setReceiptError(null);
                        const reader = new FileReader();
                        reader.onload = () => {
                          setPaymentReceiptFile({ name: file.name, dataUrl: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }}
                      style={{ display: "none" }}
                    />
                  </label>
                )}
                {receiptError && (
                  <div style={{
                    marginTop: "8px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "#fef2f2",
                    border: "1.5px solid #f87171",
                    color: "#991b1b",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <AlertCircle size={16} color="#dc2626" />
                    <span>{receiptError}</span>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#334155", marginBottom: "5px" }}>
                  Notes / Payment Remarks (Optional):
                </label>
                <textarea
                  value={paymentNotesInput}
                  onChange={(e) => setPaymentNotesInput(e.target.value)}
                  rows={2}
                  placeholder="e.g. Paid in cash at Counter 2 or GCash reference 001928374"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.84rem",
                    color: "#334155"
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => {
                  setPayingApp(null);
                  setPaymentReceiptFile(null);
                }}
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
                onClick={handleSubmitPaymentConfirm}
                disabled={isSubmittingPayment}
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
                <span>{isSubmittingPayment ? "Submitting..." : "Submit Payment Confirmation"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
