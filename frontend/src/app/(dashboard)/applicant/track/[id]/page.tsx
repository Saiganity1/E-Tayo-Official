"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePermitContext } from "../../../../../context/PermitContext";
import { 
  ChevronLeft, 
  CheckCircle2, 
  Clock, 
  Search, 
  AlertTriangle, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download,
  Building2, 
  Compass, 
  Layers, 
  Zap, 
  Droplets, 
  Flame, 
  ShieldCheck, 
  MapPin, 
  Sparkles,
  RefreshCw,
  Home,
  CreditCard,
  Receipt,
  Banknote,
  X
} from "lucide-react";
import { dispatchPermitMessage } from "../../../../../utils/permitMessaging";
import Link from "next/link";
import { 
  generateUnifiedPermitPdf, 
  generateBuildingPermitPdf, 
  generateArchitecturalPermitPdf, 
  generateStructuralPermitPdf, 
  generateElectricalPermitPdf, 
  generateSanitaryPermitPdf,
  generateMechanicalPermitPdf,
  generateFencingPermitPdf,
  UnifiedPermitFormData
} from "../../../../../utils/unifiedPermitPdfGenerator";
import { generateLocationalClearancePdf } from "../../../../../utils/locationalClearancePdfGenerator";
import { PROJECT_TYPES_MATRIX, ProjectTypeItem } from "../../../../../data/projectTypeMatrix";
import { INITIAL_APPLICATIONS } from "../../../../../data/mock";

export default function ApplicationTrackDetail() {
  const params = useParams();
  const router = useRouter();
  const { applications, updateApplication, cancelApplication } = usePermitContext();

  const rawId = params?.id;
  const appId = useMemo(() => {
    if (!rawId) return "";
    return Array.isArray(rawId) ? String(rawId[0] || "") : String(rawId || "");
  }, [rawId]);

  const [appData, setAppData] = useState<any>(null);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Change of project plans");
  const [isCancelling, setIsCancelling] = useState(false);

  // Payment Confirmation Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentRefInput, setPaymentRefInput] = useState("");
  const [paymentMethodInput, setPaymentMethodInput] = useState("Municipal Treasury Cashier (On-site)");
  const [paymentNotesInput, setPaymentNotesInput] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "info" } | null>(null);

  const handleSubmitPaymentConfirm = async () => {
    if (!appData) return;
    setIsSubmittingPayment(true);
    const refNo = paymentRefInput.trim() || `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const assessedAmountStr = `PHP ${(appData.assessedFees || 3795).toLocaleString()}`;

    const updatedApp = {
      ...appData,
      userConfirmedPayment: true,
      paymentStatus: "awaiting_verification" as const,
      paymentReference: refNo,
      paymentMethod: paymentMethodInput,
      paymentDate: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      paymentNotes: paymentNotesInput,
      historyLog: [
        ...(appData.historyLog || []),
        {
          date: new Date().toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          action: "Payment Confirmation Submitted",
          actor: appData.applicantName || "Applicant",
          details: `Payment submitted under reference ${refNo} via ${paymentMethodInput}. Assessed: ${assessedAmountStr}. Awaiting municipal cashier sign-off.`
        }
      ]
    };

    setAppData(updatedApp);
    await updateApplication(updatedApp as any);

    // Notify staff desk
    try {
      await dispatchPermitMessage({
        applicationId: appData.id,
        recipientEmail: "staff@etayo.gov.ph",
        senderEmail: appData.applicantEmail || "applicant@etayo.gov.ph",
        content: `[Ref: ${appData.id} - ${appData.projectName || "Permit Application"}]
💳 PAYMENT CONFIRMATION SUBMITTED BY APPLICANT

The applicant has submitted payment confirmation for Order of Payment ${appData.orderOfPaymentNo || 'OP-2026'}.
Amount: ${assessedAmountStr}
Official Receipt / Reference: ${refNo}
Payment Channel: ${paymentMethodInput}
${paymentNotesInput ? `Applicant Remarks: ${paymentNotesInput}` : ""}

Action Required: Please inspect and click "Payment Complete & Release Permit" on the Evaluation Page to officially release the permit papers.`,
      });
    } catch (e) {
      console.warn("Could not dispatch payment confirmation message", e);
    }

    setIsSubmittingPayment(false);
    setShowPaymentModal(false);
    setToastMsg({ text: "Payment confirmation submitted! Municipal cashier notified.", type: "success" });
    setTimeout(() => setToastMsg(null), 3800);
  };

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
    ? `${process.env.NEXT_PUBLIC_API_URL}/api` 
    : "http://localhost:8080/api";

  useEffect(() => {
    if (!appId) return;

    let isMounted = true;

    // 1. Initial check from context or local cache
    const findLocal = () => {
      if (applications && applications.length > 0) {
        const found = applications.find(a => (a.id || "").toLowerCase() === appId.toLowerCase());
        if (found) return found;
      }

      try {
        const cachedStr = localStorage.getItem("etayo_cached_applications");
        if (cachedStr) {
          const cachedList = JSON.parse(cachedStr);
          if (Array.isArray(cachedList)) {
            const found = cachedList.find((a: any) => (a.id || "").toLowerCase() === appId.toLowerCase());
            if (found) return found;
          }
        }
      } catch (e) {}

      // Fallback: check initial mock dataset
      const mockFound = (INITIAL_APPLICATIONS || []).find(a => (a.id || "").toLowerCase() === appId.toLowerCase());
      if (mockFound) return mockFound;

      return null;
    };

    const localFound = findLocal();
    if (localFound && isMounted) {
      setAppData(localFound);
    }

    // 2. Fetch fresh live data directly from server
    const fetchFreshStatus = async () => {
      if (!appId) return;
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers: Record<string, string> = { "Accept": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE_URL}/permits/${encodeURIComponent(appId)}`, { headers });
        if (res.ok) {
          const serverApp = await res.json();
          if (serverApp && serverApp.id && isMounted) {
            setAppData(serverApp);
          }
        }
      } catch (e) {
        // network error or offline fallback
      }
    };

    fetchFreshStatus();

    // 3. Fallback timer if not found anywhere to avoid infinite spinner
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setAppData((curr: any) => {
          if (curr) return curr;
          const recheck = findLocal();
          if (recheck) return recheck;

          // If still not found, synthesize a graceful placeholder so the user is never blocked
          const isLC = appId.toUpperCase().startsWith("LC-");
          return {
            id: appId,
            projectName: isLC ? "Single-Detached House - Locational Clearance" : "Single-Detached House Installation & Construction",
            projectType: "Single-Detached House",
            permitType: isLC ? "locational_clearance" : "building_permit",
            status: "approved",
            dateSubmitted: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
            applicantName: "Applicant",
            applicantAddress: "Sto. Tomas, Pampanga",
            projectAddress: "Sto. Tomas, Pampanga",
            requirements: [],
            trackingSteps: [
              { num: 1, title: "Application Submitted", status: "completed", date: new Date().toLocaleDateString() },
              { num: 2, title: "Document Evaluation", status: "completed" },
              { num: 3, title: "Final Approval", status: "completed" },
              { num: 4, title: "Permit Release", status: "completed" }
            ]
          };
        });
        setLoadTimedOut(true);
      }
    }, 1800);

    // 4. Live polling every 3 seconds to auto-detect admin approval without manual refresh
    const pollTimer = setInterval(fetchFreshStatus, 3000);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      clearInterval(pollTimer);
    };
  }, [appId, applications]);

  const resolvedDocuments = React.useMemo(() => {
    if (!appData) return [];

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const resolveUrl = (u: string) => {
      if (!u) return "";
      const trimmed = u.trim();
      return trimmed.startsWith("/api/files/") ? `${apiBase}${trimmed}` : trimmed;
    };

    const rawUrls = (typeof appData.fileUrl === "string" ? appData.fileUrl : "").split(",").map((s: string) => s.trim()).filter(Boolean);
    const primaryFileUrl = resolveUrl(rawUrls[0] || "");
    const isDrive = (typeof appData.fileUrl === "string" ? appData.fileUrl : "").includes("drive.google.com");
    
    const rawProjName = typeof appData.projectName === "string" 
      ? appData.projectName 
      : (typeof appData.projectType === "object" ? appData.projectType?.name : (typeof appData.projectType === "string" ? appData.projectType : "Permit"));
    const projNameClean = (rawProjName || "Permit").replace(/[^a-zA-Z0-9_-]/g, "_");

    const docs: Array<{
      id: string;
      title: string;
      code: string;
      category: string;
      desc: string;
      fileName: string;
      fileSize: string;
      url: string;
      downloadName: string;
      badgeBg: string;
      badgeColor: string;
      iconBg: string;
      iconColor: string;
      iconType: "bp" | "ap" | "sp" | "ep" | "pl" | "fsec" | "lc" | "map" | "file";
      isDriveBackup?: boolean;
    }> = [];

    const pTypeStr = String(appData.permitType || "locational_clearance").toLowerCase();

    // 1. MASTER UNIFIED PERMIT PACKAGE (Compiled Dossier)
    if (primaryFileUrl || pTypeStr === "building_permit" || pTypeStr === "locational_clearance") {
      docs.push({
        id: "master-dossier",
        title: pTypeStr === "locational_clearance" 
          ? "Official Locational Clearance Dossier" 
          : "Compiled Unified Building Permit Dossier",
        code: pTypeStr === "locational_clearance" ? "LC-DOSSIER" : "BP-DOSSIER",
        category: "Master Dossier",
        desc: "Complete compiled DPWH & LGU permit package with technical certifications",
        fileName: appData.fileName || `${appData.id}_${projNameClean}_Permit_Package.pdf`,
        fileSize: "2.4 MB",
        url: primaryFileUrl || (pTypeStr === "locational_clearance" ? "/templates/LOCATIONAL-CLEARANCE-Sto-Tomas.pdf" : "/templates/UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf"),
        downloadName: appData.fileName || `${appData.id}_${projNameClean}_Permit_Package.pdf`,
        badgeBg: "#dbeafe",
        badgeColor: "#1e40af",
        iconBg: "#eff6ff",
        iconColor: "#0038A8",
        iconType: pTypeStr === "locational_clearance" ? "lc" : "bp",
        isDriveBackup: isDrive
      });
    }

    // 2. LOCATIONAL CLEARANCE (Zoning Prerequisite)
    if (appData.locationalClearanceRef && appData.locationalClearanceRef !== "EXEMPT") {
      docs.push({
        id: "locational-clearance",
        title: "Locational Clearance (Zoning Approval)",
        code: "LC",
        category: "Zoning Clearance",
        desc: `Municipal zoning compliance prerequisite • Ref: ${appData.locationalClearanceRef}`,
        fileName: `Locational_Clearance_${appData.locationalClearanceRef}.pdf`,
        fileSize: "840 KB",
        url: "/templates/LOCATIONAL-CLEARANCE-Sto-Tomas.pdf",
        downloadName: `Locational_Clearance_${appData.locationalClearanceRef}.pdf`,
        badgeBg: "#dcfce7",
        badgeColor: "#15803d",
        iconBg: "#f0fdf4",
        iconColor: "#16a34a",
        iconType: "lc"
      });
    }

    // 3. THE 6 OFFICIAL TECHNICAL PERMIT FORMS (DPWH & Sto. Tomas Municipal Engineering)
    const standardTechnicalForms = [
      {
        key: "buildingPermit",
        code: "BP",
        title: "Building Permit (NBC Form B-01)",
        desc: "General Construction, Storeys, Floor Area & Total Cost Breakdown",
        template: "/templates/UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf",
        badgeBg: "#dbeafe",
        badgeColor: "#1d4ed8",
        iconBg: "#eff6ff",
        iconColor: "#0038A8",
        iconType: "bp" as const
      },
      {
        key: "architecturalPermit",
        code: "AP",
        title: "Architectural Permit (NBC Form A-01)",
        desc: "Architectural Plans, Spatial Layouts, Setbacks & Material Finishes",
        template: "/templates/ARCHITECTURAL-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf",
        badgeBg: "#e0e7ff",
        badgeColor: "#4338ca",
        iconBg: "#eef2ff",
        iconColor: "#4f46e5",
        iconType: "ap" as const
      },
      {
        key: "civilStructuralPermit",
        code: "SP",
        title: "Civil / Structural Permit (NBC Form S-01)",
        desc: "Foundation Design, Concrete fc', Rebar fy & Structural Calculations",
        template: "/templates/Civil-Structural-Permit-Sto-Tomas-Gilbert-Cruz.pdf",
        badgeBg: "#f3e8ff",
        badgeColor: "#6d28d9",
        iconBg: "#faf5ff",
        iconColor: "#7c3aed",
        iconType: "sp" as const
      },
      {
        key: "electricalPermit",
        code: "EP",
        title: "Electrical Permit (NBC Form E-01)",
        desc: "Service Voltage, Load Schedules, Connected Load & PEE Sign-off",
        template: "/templates/ELECTRICAL-PERMIT-FORM-Gilbert-Cruz.pdf",
        badgeBg: "#fef3c7",
        badgeColor: "#b45309",
        iconBg: "#fffbeb",
        iconColor: "#d97706",
        iconType: "ep" as const
      },
      {
        key: "sanitaryPermit",
        code: "PL",
        title: "Sanitary / Plumbing Permit (NBC Form P-01)",
        desc: "Water Supply, Septic Tank Dimensions, Fixtures & Master Plumber",
        template: "/templates/SANITARY-PLUMBING-PERMIT-Sto-Tomas-Fixed.pdf",
        badgeBg: "#cffafe",
        badgeColor: "#0e7490",
        iconBg: "#ecfeff",
        iconColor: "#0891b2",
        iconType: "pl" as const
      },
      {
        key: "fireBfpPermit",
        code: "FSEC",
        title: "Fire Safety Evaluation Clearance (FSEC / BFP)",
        desc: "BFP Life Safety Standards, Fire Exits, Extinguishers & Egress Widths",
        template: "/templates/UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf",
        badgeBg: "#fee2e2",
        badgeColor: "#b91c1c",
        iconBg: "#fef2f2",
        iconColor: "#dc2626",
        iconType: "fsec" as const
      }
    ];

    if (Array.isArray(appData.requirements) && appData.requirements.length > 0) {
      appData.requirements.forEach((req: any, i: number) => {
        if (!req) return;
        const reqName = typeof req === "string" ? req : (req.name || `Requirement ${i + 1}`);

        // Avoid duplicating LC if already added
        if (reqName.toLowerCase().includes("locational clearance") && docs.some(d => d.code === "LC" || d.code === "LC-DOSSIER")) {
          return;
        }

        const matched = standardTechnicalForms.find(
          f => reqName.toLowerCase().includes(f.title.toLowerCase()) || 
               reqName.includes(`(${f.code})`) || 
               (typeof req.fileName === "string" && req.fileName.startsWith(`${f.code}_`))
        );

        const code = matched ? matched.code : `REQ-${i + 1}`;
        const title = matched ? matched.title : reqName;
        const desc = matched ? matched.desc : (req.remarks || "Official engineering attachment submitted");
        const template = matched ? matched.template : (primaryFileUrl || "/templates/UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf");
        const fileName = req.fileName || `${code}_${projNameClean}_Official_Filled.pdf`;
        const fileSize = req.fileSize || "1.4 MB";
        const badgeBg = matched ? matched.badgeBg : "#f1f5f9";
        const badgeColor = matched ? matched.badgeColor : "#334155";
        const iconBg = matched ? matched.iconBg : "#f8fafc";
        const iconColor = matched ? matched.iconColor : "#475569";
        const iconType = matched ? matched.iconType : ("file" as const);

        if (!docs.some(d => d.title === title || d.code === code)) {
          docs.push({
            id: `req-${i}`,
            title,
            code,
            category: "Technical Permit",
            desc,
            fileName,
            fileSize,
            url: resolveUrl(req.fileUrl || template),
            downloadName: fileName,
            badgeBg,
            badgeColor,
            iconBg,
            iconColor,
            iconType
          });
        }
      });
    } else if (pTypeStr === "building_permit" || pTypeStr.includes("building")) {
      standardTechnicalForms.forEach((f, i) => {
        docs.push({
          id: `std-form-${i}`,
          title: f.title,
          code: f.code,
          category: "Technical Permit",
          desc: f.desc,
          fileName: `${f.code}_${projNameClean}_Official_Filled.pdf`,
          fileSize: "1.4 MB",
          url: f.template,
          downloadName: `${f.code}_${projNameClean}_Official_Filled.pdf`,
          badgeBg: f.badgeBg,
          badgeColor: f.badgeColor,
          iconBg: f.iconBg,
          iconColor: f.iconColor,
          iconType: f.iconType
        });
      });
    }

    // 4. VICINITY SKETCH MAP (if available)
    if (appData.sketchImageUrl) {
      docs.push({
        id: "sketch-map",
        title: "Section D: Vicinity Sketch Map & Cadastral Coordinates",
        code: "GIS-MAP",
        category: "Site Mapping",
        desc: `Georeferenced cadastral boundaries in Sto. Tomas (Lat: ${appData.location?.lat || '15.0050'}, Lng: ${appData.location?.lng || '120.7100'})`,
        fileName: `${appData.id}_Vicinity_Sketch.png`,
        fileSize: "620 KB",
        url: resolveUrl(appData.sketchImageUrl),
        downloadName: `${appData.id}_Vicinity_Sketch.png`,
        badgeBg: "#e0f2fe",
        badgeColor: "#0369a1",
        iconBg: "#f0f9ff",
        iconColor: "#0284c7",
        iconType: "map"
      });
    }

    return docs;
  }, [appData]);

  if (!appData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in-up" style={{ minHeight: "50vh" }}>
        <div className="spinner mb-4" style={{ width: "44px", height: "44px", border: "4px solid rgba(0, 56, 168, 0.15)", borderTopColor: "#0038A8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
        <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#1e293b", margin: "0 0 6px 0" }}>Loading Application Dossier</h3>
        <p style={{ color: "#64748b", margin: 0, fontSize: "0.95rem" }}>Retrieving verified permit records for <strong>{appId || "permit"}</strong>...</p>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  const getStatusDetails = (status: string) => {
    switch(status) {
      case "pending": return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", icon: Clock, label: "Pending Review", step: 1 };
      case "under_review": return { color: "#0038A8", bg: "rgba(0, 56, 168, 0.12)", icon: Search, label: "Under Evaluation", step: 2 };
      case "incomplete_requirements": return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", icon: AlertTriangle, label: "Action Required", step: 2 };
      case "approved": return { color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", icon: CheckCircle2, label: "Approved (Awaiting Payment)", step: 3 };
      case "released": return { color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", icon: CheckCircle, label: "Permit Released", step: 4 };
      case "cancelled": return { color: "#dc2626", bg: "rgba(220, 38, 38, 0.15)", icon: XCircle, label: "Cancelled by Applicant", step: 0 };
      default: return { color: "#64748b", bg: "rgba(100, 116, 139, 0.15)", icon: FileText, label: "Processing", step: 1 };
    }
  };

  const statusConfig = getStatusDetails(appData?.status || "pending");
  const StatusIcon = statusConfig.icon;

  const timelineSteps = [
    { num: 1, title: "Application Submitted", desc: `Received on ${appData?.dateSubmitted || "Online Portal"}` },
    { num: 2, title: "Document Evaluation", desc: appData?.status === "incomplete_requirements" ? "Pending applicant action" : "Verifying attached requirements" },
    { num: 3, title: "Final Approval", desc: "Awaiting signatures from municipal engineers" },
    { num: 4, title: "Permit Release", desc: "Official clearance & permits released" }
  ];

  const getFilledDocUrl = async (doc: any): Promise<string> => {
    if (doc.url && doc.url.startsWith("data:") && !doc.url.includes("placeholder")) {
      return doc.url;
    }

    const pTypeObj: ProjectTypeItem = (appData?.projectType && typeof appData.projectType === "object")
      ? appData.projectType
      : (PROJECT_TYPES_MATRIX.find(p => p.name.toLowerCase() === (typeof appData?.projectType === "string" ? appData.projectType.toLowerCase() : "") || p.id === appData?.projectType) || PROJECT_TYPES_MATRIX[0]);

    const cleanSeq = appData?.id ? String(appData.id).replace(/^[A-Za-z]+-/i, "") : "2026-6636";
    const issuedDate = (appData as any)?.permitIssuedDate || (appData as any)?.dateIssued || (appData?.status === "approved" || appData?.status === "released" ? (appData?.dateApproved || appData?.dateSubmitted || new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })) : undefined);
    
    const formData: UnifiedPermitFormData = {
      applicationNo: appData?.id || "APP-2026-6636",
      status: appData?.status,
      isApproved: appData?.status === "approved" || appData?.status === "released",
      buildingPermitNo: appData?.buildingPermitNo || (pTypeObj.matrix?.buildingPermit === 'required' || !pTypeObj ? `BP-${cleanSeq}` : undefined),
      permitNo: appData?.permitNo || `AP-${cleanSeq}`,
      architecturalPermitNo: appData?.architecturalPermitNo || `AP-${cleanSeq}`,
      structuralPermitNo: appData?.structuralPermitNo || `SP-${cleanSeq}`,
      sanitaryPermitNo: (appData as any)?.sanitaryPermitNo || (appData?.status === "approved" || appData?.status === "released" ? `P-${cleanSeq}` : undefined),
      plumbingPermitNo: (appData as any)?.plumbingPermitNo || (appData?.status === "approved" || appData?.status === "released" ? `P-${cleanSeq}` : undefined),
      mechanicalPermitNo: (appData as any)?.mechanicalPermitNo || (appData?.status === "approved" || appData?.status === "released" ? `MP-${cleanSeq}` : undefined),
      permitIssuedDate: issuedDate,
      dateIssued: issuedDate,
      approvalDate: (appData as any)?.approvalDate || (appData as any)?.dateApproved,
      locationalClearanceRef: appData?.locationalClearanceRef || "LC-2026-9307",
      projectType: pTypeObj,
      applicantName: appData?.applicantName || "Paul Payumo",
      applicantPhone: appData?.applicantPhone || "0917-123-4567",
      applicantEmail: appData?.applicantEmail || "applicant@etayo.gov.ph",
      applicantAddress: appData?.projectAddress || appData?.applicantAddress || "Sto. Tomas, Pampanga",
      applicantTIN: appData?.applicantTIN || "000-123-456-000",
      formOfOwnership: appData?.formOfOwnership || "INDIVIDUAL",
      projectName: typeof appData?.projectName === "string" ? appData.projectName : `${pTypeObj.name} Installation & Construction`,
      projectAddress: typeof appData?.projectAddress === "string" ? appData.projectAddress : (appData?.location?.address || "Sto. Tomas, Pampanga"),
      barangay: appData?.barangay || "Sapa (Santo Nino)",
      lotNo: appData?.lotNo || "Lot 12",
      blockNo: appData?.blockNo || "Blk 4",
      tctNo: appData?.tctNo || "TCT-123456",
      taxDecNo: appData?.taxDecNo || "TD-2026-0012",
      lotArea: appData?.lotArea || "200",
      floorArea: appData?.floorArea || "120",
      buildingFootprint: appData?.buildingFootprint || "60",
      projectCost: appData?.projectCost || (appData?.estimatedFees ? `${appData.estimatedFees * 500}` : "1,500,000.00"),
      scopeOfWork: appData?.scopeOfWork || "New Construction",
      occupancyClass: appData?.occupancyClass || "Group A - Residential",
      occupancyClassificationDetail: (appData as any)?.occupancyClassificationDetail || (appData as any)?.occupancyRuleVII || "Group A - Single Family Dwelling",
      occupancyOthers: (appData as any)?.occupancyOthers || "",
      proposedStoreys: appData?.proposedStoreys || "2",
      numberOfUnits: appData?.numberOfUnits || "1",
      proposedStartDate: appData?.dateSubmitted || new Date().toLocaleDateString(),
      expectedCompletionDate: "WITHIN 180 DAYS",
      costBuilding: "1,200,000.00",
      costElectrical: "150,000.00",
      costMechanical: "50,000.00",
      costPlumbing: "50,000.00",
      costElectronics: "50,000.00",
      architectName: appData?.architectName || "Arch. Maria Santos, UAP",
      architectPRC: appData?.architectPRC || "PRC-0045211",
      civilEngineerName: appData?.civilEngineerName || "Engr. Roberto Cruz, CE",
      civilEngineerPRC: appData?.civilEngineerPRC || "PRC-0078923",
      electricalEngineerName: appData?.electricalEngineerName || "Engr. Danilo Reyes, PEE",
      electricalEngineerPRC: appData?.electricalEngineerPRC || "PRC-0033421",
      masterPlumberName: appData?.masterPlumberName || "",
      masterPlumberPRC: appData?.masterPlumberPRC || "",
      lightingOutletsCount: (appData as any)?.lightingOutletsCount,
      convenienceOutletsCount: (appData as any)?.convenienceOutletsCount,
      acuOutletsCount: (appData as any)?.acuOutletsCount,
      cookingUnitOutletsCount: (appData as any)?.cookingUnitOutletsCount,
      waterHeaterOutletsCount: (appData as any)?.waterHeaterOutletsCount,
      waterPumpOutletsCount: (appData as any)?.waterPumpOutletsCount,
      toggleSwitchCount: (appData as any)?.toggleSwitchCount,
      bellBuzzerCount: (appData as any)?.bellBuzzerCount,
      pushButtonsCount: (appData as any)?.pushButtonsCount,
      faDetectorCount: (appData as any)?.faDetectorCount,
      otherWiringDevicesCount: (appData as any)?.otherWiringDevicesCount,
      electricalEngineerSignature: (appData as any)?.electricalEngineerSignature,
      electricalContractorName: (appData as any)?.electricalContractorName,
      electricalContractorPcab: (appData as any)?.electricalContractorPcab,
      electricalContractorAddress: (appData as any)?.electricalContractorAddress,
      electricalContractorTel: (appData as any)?.electricalContractorTel,
      sameAsDesignElectricalEngineer: (appData as any)?.sameAsDesignElectricalEngineer,
      installationInChargeRole: (appData as any)?.installationInChargeRole,
      installationInChargeName: (appData as any)?.installationInChargeName,
      installationInChargeAddress: (appData as any)?.installationInChargeAddress,
      installationInChargePRC: (appData as any)?.installationInChargePRC,
      installationInChargePRCValidity: (appData as any)?.installationInChargePRCValidity,
      installationInChargeTel: (appData as any)?.installationInChargeTel,
      installationInChargePTR: (appData as any)?.installationInChargePTR,
      installationInChargePTRIssued: (appData as any)?.installationInChargePTRIssued,
      installationInChargePTRIssuedAt: (appData as any)?.installationInChargePTRIssuedAt,
      installationInChargeTIN: (appData as any)?.installationInChargeTIN,
      installationInChargeSignedDate: (appData as any)?.installationInChargeSignedDate,
      installationInChargeSignature: (appData as any)?.installationInChargeSignature,
      mechanicalScopeOfWork: (appData as any)?.mechanicalScopeOfWork || (appData as any)?.scopeOfWork,
      mechanicalScopeDetails: (appData as any)?.mechanicalScopeDetails,
      boiler: (appData as any)?.boiler,
      pressureVessel: (appData as any)?.pressureVessel,
      internalCombustionEngine: (appData as any)?.internalCombustionEngine,
      refrigerationIce: (appData as any)?.refrigerationIce,
      windowTypeAircon: (appData as any)?.windowTypeAircon,
      packagedSplitAircon: (appData as any)?.packagedSplitAircon,
      mechanicalOthers: (appData as any)?.mechanicalOthers,
      mechanicalOthersSpecify: (appData as any)?.mechanicalOthersSpecify,
      centralAircon: (appData as any)?.centralAircon,
      mechanicalVentilation: (appData as any)?.mechanicalVentilation,
      escalator: (appData as any)?.escalator,
      movingSidewalk: (appData as any)?.movingSidewalk,
      freightElevator: (appData as any)?.freightElevator,
      passengerElevator: (appData as any)?.passengerElevator,
      cableCar: (appData as any)?.cableCar,
      dumbwaiter: (appData as any)?.dumbwaiter,
      pumps: (appData as any)?.pumps,
      compressedAirGas: (appData as any)?.compressedAirGas,
      pneumaticTubesConveyors: (appData as any)?.pneumaticTubesConveyors,
      funicular: (appData as any)?.funicular,
      mechanicalPreparedBy: (appData as any)?.mechanicalPreparedBy || (appData as any)?.mechanicalEngineerName,
      machineryType: (appData as any)?.machineryType,
      machineryBrand: (appData as any)?.machineryBrand,
      machineryCapacity: (appData as any)?.machineryCapacity,
      machineryPower: (appData as any)?.machineryPower,
      machinerySpeed: (appData as any)?.machinerySpeed,
      machineryStoreys: (appData as any)?.machineryStoreys,
      mechanicalEngineerName: (appData as any)?.mechanicalEngineerName,
      mechanicalEngineerPRC: (appData as any)?.mechanicalEngineerPRC,
      mechanicalEngineerPRCValidity: (appData as any)?.mechanicalEngineerPRCValidity,
      mechanicalEngineerAddress: (appData as any)?.mechanicalEngineerAddress,
      mechanicalEngineerPTRDate: (appData as any)?.mechanicalEngineerPTRDate,
      mechanicalEngineerPTRIssuedAt: (appData as any)?.mechanicalEngineerPTRIssuedAt,
      mechanicalEngineerSignedDate: (appData as any)?.mechanicalEngineerSignedDate,
      mechanicalEngineerSignature: (appData as any)?.mechanicalEngineerSignature,
      sameAsDesignMechanicalEngineer: (appData as any)?.sameAsDesignMechanicalEngineer,
      mechSupervisorRole: (appData as any)?.mechSupervisorRole,
      mechSupervisorName: (appData as any)?.mechSupervisorName,
      mechSupervisorAddress: (appData as any)?.mechSupervisorAddress,
      mechSupervisorPRC: (appData as any)?.mechSupervisorPRC,
      mechSupervisorPRCValidity: (appData as any)?.mechSupervisorPRCValidity,
      mechSupervisorPTR: (appData as any)?.mechSupervisorPTR,
      mechSupervisorPTRDate: (appData as any)?.mechSupervisorPTRDate,
      mechSupervisorPTRIssued: (appData as any)?.mechSupervisorPTRIssued,
      mechSupervisorPTRIssuedAt: (appData as any)?.mechSupervisorPTRIssuedAt,
      mechSupervisorTIN: (appData as any)?.mechSupervisorTIN,
      mechSupervisorSignedDate: (appData as any)?.mechSupervisorSignedDate,
      mechSupervisorSignature: (appData as any)?.mechSupervisorSignature,
      applicantGovIdDateIssued: (appData as any)?.applicantGovIdDateIssued || (appData as any)?.govIdDateIssued,
      applicantGovIdPlaceIssued: (appData as any)?.applicantGovIdPlaceIssued || (appData as any)?.govIdPlaceIssued,
      applicantCtcNo: (appData as any)?.applicantCtcNo || (appData as any)?.govIdNo,
      fencingPermitNo: (appData as any)?.fencingPermitNo,
      fencingScopeOfWork: (appData as any)?.fencingScopeOfWork,
      fencingScopeDetails: (appData as any)?.fencingScopeDetails,
      fencingLength: (appData as any)?.fencingLength || (appData as any)?.fenceLength,
      fencingHeight: (appData as any)?.fencingHeight || (appData as any)?.fenceHeight,
      fencingType: (appData as any)?.fencingType || (appData as any)?.fenceType,
      fencingTypes: (appData as any)?.fencingTypes,
      fencingTypeOthers: (appData as any)?.fencingTypeOthers,
      fencingTypeOthersLine2: (appData as any)?.fencingTypeOthersLine2,
      fencingTypeOthersLine3: (appData as any)?.fencingTypeOthersLine3,
      fencingCost: (appData as any)?.fencingCost || (appData as any)?.fenceCost,
      fencingDesignerRole: (appData as any)?.fencingDesignerRole,
      fencingSupervisorRole: (appData as any)?.fencingSupervisorRole,
      submissionDate: appData?.dateSubmitted || new Date().toLocaleDateString(),
    };

    try {
      if (doc.code === "AP") {
        const b64 = await generateArchitecturalPermitPdf(formData);
        return `data:application/pdf;base64,${b64}`;
      } else if (doc.code === "SP") {
        const b64 = await generateStructuralPermitPdf(formData);
        return `data:application/pdf;base64,${b64}`;
      } else if (doc.code === "EP") {
        const b64 = await generateElectricalPermitPdf(formData);
        return `data:application/pdf;base64,${b64}`;
      } else if (doc.code === "PL") {
        const b64 = await generateSanitaryPermitPdf(formData);
        return `data:application/pdf;base64,${b64}`;
      } else if (doc.code === "MP") {
        const b64 = await generateMechanicalPermitPdf(formData);
        return `data:application/pdf;base64,${b64}`;
      } else if (doc.code === "BP") {
        const b64 = await generateBuildingPermitPdf(formData);
        return `data:application/pdf;base64,${b64}`;
      } else if (doc.code === "FP") {
        const b64 = await generateFencingPermitPdf(formData);
        return `data:application/pdf;base64,${b64}`;
      } else if (doc.code === "LC" || doc.code === "LC-DOSSIER") {
        const b64 = await generateLocationalClearancePdf({
          applicationNo: appData?.locationalClearanceRef || appData?.id || "LC-2026-9307",
          submissionDate: appData?.dateSubmitted || new Date().toLocaleDateString(),
          applicantName: appData?.applicantName || "Paul Payumo",
          applicantAddress: appData?.projectAddress || appData?.applicantAddress || "Sto. Tomas, Pampanga",
          applicantPhone: appData?.applicantPhone || "0917-000-0000",
          applicantEmail: appData?.applicantEmail || "",
          projectName: typeof appData?.projectName === "string" ? appData.projectName : `${pTypeObj.name} Project`,
          projectType: pTypeObj.name,
          projectNature: "New Construction",
          projectAddress: typeof appData?.projectAddress === "string" ? appData.projectAddress : (appData?.location?.address || "Sto. Tomas, Pampanga"),
          barangay: appData?.barangay || "Sto. Tomas",
          lotArea: appData?.lotArea || "200",
          bldgArea: appData?.floorArea || "120",
          rightOverLand: "Owner",
          projectTenure: "Permanent",
          existingLandUse: "Residential",
          isTenanted: "No",
          projectCost: appData?.projectCost || "1,500,000.00",
        });
        return `data:application/pdf;base64,${b64}`;
      } else if (doc.code === "BP-DOSSIER") {
        const b64 = await generateUnifiedPermitPdf(formData);
        return `data:application/pdf;base64,${b64}`;
      }
    } catch (e) {
      console.warn("Could not generate filled form, using default doc.url:", e);
    }

    return doc.url;
  };

  const openDocumentSafely = (url: string) => {
    if (!url) return;
    if (url.startsWith("data:")) {
      try {
        const parts = url.split("base64,");
        const contentType = parts[0].replace("data:", "").replace(";base64", "") || "application/pdf";
        const byteChars = atob(parts[1]);
        const byteNumbers = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNumbers[i] = byteChars.charCodeAt(i);
        }
        const blob = new Blob([byteNumbers], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
        return;
      } catch (e) {
        console.warn("Could not create blob URL, opening directly", e);
      }
    }
    window.open(url, "_blank");
  };

  const downloadDocumentSafely = (url: string, filename: string) => {
    if (!url) return;
    if (url.startsWith("data:")) {
      try {
        const parts = url.split("base64,");
        const contentType = parts[0].replace("data:", "").replace(";base64", "") || "application/pdf";
        const byteChars = atob(parts[1]);
        const byteNumbers = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNumbers[i] = byteChars.charCodeAt(i);
        }
        const blob = new Blob([byteNumbers], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        return;
      } catch (e) {
        console.warn("Blob download fallback", e);
      }
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderDocIcon = (iconType: string) => {
    switch(iconType) {
      case "bp": return <Building2 size={20} />;
      case "ap": return <Compass size={20} />;
      case "sp": return <Layers size={20} />;
      case "ep": return <Zap size={20} />;
      case "pl": return <Droplets size={20} />;
      case "fsec": return <Flame size={20} />;
      case "lc": return <ShieldCheck size={20} />;
      case "map": return <MapPin size={20} />;
      default: return <FileText size={20} />;
    }
  };

  return (
    <div className="dashboard-page animate-fade-in-up" style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Page Header */}
      <header className="page-header" style={{ 
        background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.9)",
        boxShadow: "0 10px 35px rgba(0, 0, 0, 0.14)",
        borderRadius: "20px",
        padding: "1.25rem 1.75rem",
        marginBottom: "1.25rem" 
      }}>
        <button 
          onClick={() => router.push("/applicant/track")} 
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "0.5rem", 
            color: "#64748b", 
            fontWeight: "700", 
            marginBottom: "0.75rem", 
            background: "none", 
            border: "none", 
            cursor: "pointer", 
            fontSize: "0.88rem",
            padding: 0
          }}
        >
          <ChevronLeft size={16} /> Back to Application Tracker
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="page-title" style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
              {typeof appData.projectName === 'string' ? appData.projectName : (appData.projectName?.name || "Permit Application")}
            </h1>
            <p className="page-subtitle" style={{ fontSize: "1rem", marginTop: "0.35rem", color: "#475569" }}>
              Tracking ID: <strong style={{color: "#1e293b"}}>{appData.id}</strong> • {String(appData.permitType || "Permit").replace(/_/g, " ")}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {appData.status !== "cancelled" && appData.status !== "released" && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #fca5a5",
                  color: "#b91c1c",
                  padding: "8px 16px",
                  borderRadius: "12px",
                  fontWeight: "700",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 6px rgba(220, 38, 38, 0.1)"
                }}
              >
                <XCircle size={15} color="#dc2626" /> Cancel Application
              </button>
            )}

            <span style={{ 
              backgroundColor: statusConfig.bg, 
              color: statusConfig.color, 
              fontWeight: "800", 
              padding: "9px 18px", 
              borderRadius: "30px", 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "8px", 
              fontSize: "1rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}>
              <StatusIcon size={19} strokeWidth={2.5} /> {statusConfig.label}
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(380px, 500px)", gap: "1.25rem", alignItems: "start" }}>
        
        {/* Left Column: Timeline & Project Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* Toast Notification */}
          {toastMsg && (
            <div style={{
              background: toastMsg.type === "success" ? "#ecfdf5" : "#eff6ff",
              border: `1.5px solid ${toastMsg.type === "success" ? "#86efac" : "#bfdbfe"}`,
              color: toastMsg.type === "success" ? "#166534" : "#1e40af",
              borderRadius: "12px",
              padding: "0.85rem 1.25rem",
              fontWeight: "700",
              fontSize: "0.88rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}>
              <CheckCircle2 size={18} />
              <span>{toastMsg.text}</span>
            </div>
          )}

          {/* ORDER OF PAYMENT & SETTLEMENT ACTION CARD */}
          {appData?.status === "approved" && (
            <div style={{
              background: (appData as any).userConfirmedPayment
                ? "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)"
                : "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
              border: `1.5px solid ${(appData as any).userConfirmedPayment ? "#86efac" : "#fde68a"}`,
              borderRadius: "20px",
              padding: "1.4rem",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1, minWidth: "260px" }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: (appData as any).userConfirmedPayment ? "#dcfce7" : "#fef3c7",
                    color: (appData as any).userConfirmedPayment ? "#16a34a" : "#d97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1px solid ${(appData as any).userConfirmedPayment ? "#bbf7d0" : "#fcd34d"}`
                  }}>
                    {(appData as any).userConfirmedPayment ? (
                      <CheckCircle2 size={24} strokeWidth={2.5} />
                    ) : (
                      <CreditCard size={24} strokeWidth={2.5} />
                    )}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: (appData as any).userConfirmedPayment ? "#166534" : "#92400e" }}>
                        {(appData as any).userConfirmedPayment
                          ? "Payment Confirmation Submitted (Awaiting Cashier Sign-off)"
                          : "Approved · Order of Payment Issued"}
                      </h4>
                      <span style={{
                        fontSize: "0.72rem",
                        fontWeight: "800",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background: (appData as any).userConfirmedPayment ? "#dcfce7" : "#fee2e2",
                        color: (appData as any).userConfirmedPayment ? "#15803d" : "#b91c1c",
                        border: `1px solid ${(appData as any).userConfirmedPayment ? "#86efac" : "#fca5a5"}`
                      }}>
                        {(appData as any).userConfirmedPayment ? "Under Review" : "Payment Required"}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: (appData as any).userConfirmedPayment ? "#15803d" : "#78350f", marginTop: "4px", lineHeight: "1.45" }}>
                      {(appData as any).userConfirmedPayment ? (
                        <>
                          You submitted payment confirmation with Reference: <strong>{(appData as any).paymentReference}</strong> ({(appData as any).paymentMethod || "Treasury / Online"}). The Municipal Building Official cashier will verify and officially release your permits.
                        </>
                      ) : (
                        <>
                          Your application has passed evaluation! Please settle the assessed regulatory fee of <strong style={{ color: "#b45309", fontSize: "1rem" }}>PHP {((appData as any).assessedFees || 3795).toLocaleString()}</strong> (Ref: <strong>{appData.orderOfPaymentNo || "OP-2026"}</strong>) at the Municipal Treasury or online to unlock your official signed permits.
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {!(appData as any).userConfirmedPayment ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentRefInput(`OR-2026-${Math.floor(10000 + Math.random() * 90000)}`);
                      setShowPaymentModal(true);
                    }}
                    style={{
                      background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                      color: "white",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "10px",
                      fontWeight: "800",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)"
                    }}
                  >
                    <CreditCard size={16} />
                    <span>Confirm Payment Sent</span>
                  </button>
                ) : (
                  <div style={{
                    background: "#dcfce7",
                    border: "1px solid #86efac",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "0.78rem",
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
          )}

          {/* PERMIT OFFICIALLY RELEASED BANNER */}
          {appData?.status === "released" && (
            <div style={{
              background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
              border: "1.5px solid #86efac",
              borderRadius: "20px",
              padding: "1.4rem",
              boxShadow: "0 4px 16px rgba(16, 185, 129, 0.08)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "14px",
                  background: "#dcfce7",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #86efac"
                }}>
                  <CheckCircle size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "900", color: "#166534" }}>
                      🎉 Official Permits Released — Process Complete!
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
                  <div style={{ fontSize: "0.85rem", color: "#15803d", marginTop: "3px" }}>
                    Payment verified under Official Receipt No: <strong>{(appData as any).officialReceiptNo || "OR-2026-OFFICIAL"}</strong>. All official building permits, ancillary clearances, and approved plans are now released and active.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Application Timeline Card */}
          <div className="glass-panel" style={{ 
            padding: "1.75rem 2rem", 
            background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))", 
            borderRadius: "24px", 
            border: "1px solid rgba(255,255,255,0.9)", 
            boxShadow: "0 10px 35px rgba(0,0,0,0.06)" 
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#1e293b", marginBottom: "1.25rem" }}>
              Application Progress Timeline
            </h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", position: "relative" }}>
              <div style={{ position: "absolute", left: "20px", top: "20px", bottom: "20px", width: "3px", background: "#e2e8f0", zIndex: 0 }}></div>
              
              {timelineSteps.map((step) => {
                const isActive = statusConfig.step === step.num;
                const isPassed = statusConfig.step > step.num;
                
                let circleColor = "#e2e8f0";
                let iconColor = "#94a3b8";
                
                if (isPassed) {
                  circleColor = "#10b981";
                  iconColor = "#fff";
                } else if (isActive) {
                  circleColor = statusConfig.color;
                  iconColor = "#fff";
                }
                
                return (
                  <div key={step.num} style={{ display: "flex", gap: "1.25rem", position: "relative", zIndex: 1, opacity: isPassed || isActive ? 1 : 0.6 }}>
                    <div style={{ 
                      width: "40px", height: "40px", borderRadius: "50%", background: circleColor, 
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      boxShadow: isActive ? `0 0 0 4px ${statusConfig.bg}` : "none",
                      transition: "all 0.3s ease"
                    }}>
                      {isPassed || (step.num === 4 && statusConfig.step >= 4) ? (
                        <CheckCircle size={20} color={iconColor} />
                      ) : (
                        <span style={{ color: iconColor, fontWeight: "700" }}>{step.num}</span>
                      )}
                    </div>
                    <div style={{ paddingTop: "6px" }}>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>{step.title}</h3>
                      <p style={{ color: "#64748b", marginTop: "0.25rem", fontSize: "0.9rem", margin: "4px 0 0 0" }}>{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project Details Card */}
          <div className="glass-panel" style={{ 
            padding: "1.75rem 2rem", 
            background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))", 
            borderRadius: "24px", 
            border: "1px solid rgba(255,255,255,0.9)", 
            boxShadow: "0 10px 35px rgba(0,0,0,0.06)" 
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#1e293b", marginBottom: "1.25rem" }}>
              Project Information
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div>
                <span style={{ display: "block", color: "#64748b", fontSize: "0.82rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Applicant</span>
                <span style={{ color: "#0f172a", fontWeight: "700", fontSize: "0.95rem" }}>
                  {typeof appData.applicantName === 'string' ? appData.applicantName : "Applicant"}
                </span>
              </div>

              <div>
                <span style={{ display: "block", color: "#64748b", fontSize: "0.82rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date Submitted</span>
                <span style={{ color: "#0f172a", fontWeight: "700", fontSize: "0.95rem" }}>
                  {appData.dateSubmitted || "Recorded"}
                </span>
              </div>

              <div>
                <span style={{ display: "block", color: "#64748b", fontSize: "0.82rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Project Type</span>
                <span style={{ color: "#1e40af", fontWeight: "700", fontSize: "0.92rem", background: "#eff6ff", padding: "2px 8px", borderRadius: "6px", display: "inline-block", marginTop: "2px" }}>
                  {typeof appData.projectType === "object" ? appData.projectType?.name : (appData.projectType || "Locational Clearance")}
                </span>
              </div>

              <div>
                <span style={{ display: "block", color: "#64748b", fontSize: "0.82rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Zoning Clearance</span>
                <span style={{ color: "#15803d", fontWeight: "700", fontSize: "0.92rem", background: "#f0fdf4", padding: "2px 8px", borderRadius: "6px", display: "inline-block", marginTop: "2px" }}>
                  {typeof appData.locationalClearanceRef === 'string' ? appData.locationalClearanceRef : "LC-APPROVED"}
                </span>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ display: "block", color: "#64748b", fontSize: "0.82rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Site Address</span>
                <span style={{ color: "#334155", fontWeight: "600", fontSize: "0.92rem" }}>
                  {typeof appData.projectAddress === 'string' ? appData.projectAddress : (appData.location?.address || "Sto. Tomas, Pampanga")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: All Official Technical Permit Forms & Attachments */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="glass-panel" style={{ 
            padding: "1.75rem 2rem", 
            background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))", 
            borderRadius: "24px", 
            border: "1px solid rgba(255,255,255,0.9)", 
            boxShadow: "0 10px 35px rgba(0,0,0,0.06)" 
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                  Submitted Forms & Attachments
                </h2>
                <p style={{ margin: "3px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                  All official technical municipal permit forms filed for this project
                </p>
              </div>

              <span style={{
                background: "#eff6ff",
                color: "#1d4ed8",
                fontWeight: "800",
                fontSize: "0.78rem",
                padding: "4px 10px",
                borderRadius: "999px",
                border: "1px solid #bfdbfe",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}>
                <Sparkles size={13} /> {resolvedDocuments.length} Official Forms Ready
              </span>
            </div>

            {resolvedDocuments.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {resolvedDocuments.map((doc) => {
                  return (
                    <div 
                      key={doc.id} 
                      style={{ 
                        padding: "1rem 1.15rem", 
                        border: "1.5px solid #e2e8f0", 
                        borderRadius: "14px", 
                        background: "#ffffff",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem", marginBottom: "0.75rem" }}>
                        <div style={{ 
                          background: doc.iconBg, 
                          color: doc.iconColor, 
                          padding: "10px", 
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          {renderDocIcon(doc.iconType)}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "2px" }}>
                            <span style={{ 
                              background: doc.badgeBg, 
                              color: doc.badgeColor, 
                              fontSize: "0.68rem", 
                              fontWeight: "800", 
                              padding: "2px 7px", 
                              borderRadius: "4px",
                              letterSpacing: "0.5px"
                            }}>
                              {doc.code}
                            </span>
                            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "600" }}>
                              • {doc.category}
                            </span>
                          </div>

                          <strong style={{ display: "block", color: "#0f172a", fontSize: "0.92rem", lineHeight: "1.3" }}>
                            {doc.title}
                          </strong>
                          <p style={{ margin: "3px 0 0 0", color: "#64748b", fontSize: "0.78rem", lineHeight: "1.3" }}>
                            {doc.desc}
                          </p>

                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "5px", fontSize: "0.75rem", color: "#94a3b8" }}>
                            <span>{doc.fileName}</span>
                            <span>•</span>
                            <span>{doc.fileSize}</span>
                            {doc.isDriveBackup && (
                              <>
                                <span>•</span>
                                <span style={{ color: "#059669", fontWeight: "700" }}>Cloud Backed Up</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", paddingTop: "0.5rem", borderTop: "1px solid #f1f5f9" }}>
                        <button
                          type="button"
                          onClick={async () => {
                            const u = await getFilledDocUrl(doc);
                            openDocumentSafely(u);
                          }}
                          className="btn-outline"
                          style={{ 
                            padding: "0.42rem 0.85rem", 
                            fontSize: "0.8rem", 
                            display: "inline-flex", 
                            alignItems: "center", 
                            gap: "5px", 
                            cursor: "pointer",
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: "8px",
                            fontWeight: "600",
                            color: "#334155"
                          }}
                        >
                          <Eye size={13} color="#0038A8" /> View Document
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            const u = await getFilledDocUrl(doc);
                            downloadDocumentSafely(u, doc.downloadName);
                          }}
                          className="btn-primary"
                          style={{ 
                            padding: "0.42rem 0.95rem", 
                            fontSize: "0.8rem", 
                            display: "inline-flex", 
                            alignItems: "center", 
                            gap: "5px", 
                            cursor: "pointer",
                            background: "linear-gradient(135deg, #0038A8 0%, #021a4f 100%)",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "700",
                            color: "#ffffff"
                          }}
                        >
                          <Download size={13} /> Download
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: "#64748b", fontSize: "0.95rem" }}>No files attached to this application.</p>
            )}
          </div>
        </div>
      </div>

      {/* CANCEL CONFIRMATION MODAL */}
      {showCancelModal && (
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
            borderRadius: "20px",
            maxWidth: "520px",
            width: "100%",
            padding: "2rem",
            boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.25rem" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", color: "#0f172a" }}>
                  Cancel Permit Application?
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  Ref ID: <strong style={{ color: "#1e293b" }}>{appData.id}</strong> • {typeof appData.projectName === 'string' ? appData.projectName : "Permit Application"}
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
                onClick={() => setShowCancelModal(false)}
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
                    await cancelApplication(appData.id, cancelReason);
                    setAppData((prev: any) => prev ? { ...prev, status: "cancelled", remarks: cancelReason } : null);
                    setShowCancelModal(false);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsCancelling(false);
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
      {showPaymentModal && appData && (
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
                onClick={() => setShowPaymentModal(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Assessment Breakdown Card */}
            <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "14px", padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Permit Application:</span>
                <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#0f172a" }}>{appData.id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Order of Payment No:</span>
                <span style={{ fontSize: "0.84rem", fontWeight: "700", color: "#6d28d9" }}>{appData.orderOfPaymentNo || "OP-2026"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px dashed #cbd5e1" }}>
                <span style={{ fontSize: "0.86rem", fontWeight: "700", color: "#334155" }}>Amount Assessed:</span>
                <span style={{ fontSize: "1.25rem", fontWeight: "900", color: "#059669" }}>
                  PHP {((appData as any).assessedFees || 3795).toLocaleString()}
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
                onClick={() => setShowPaymentModal(false)}
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
