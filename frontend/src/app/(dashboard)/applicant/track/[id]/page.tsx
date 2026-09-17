"use client";

import React, { useEffect, useState } from "react";
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
  Sparkles 
} from "lucide-react";
import { 
  generateUnifiedPermitPdf, 
  generateBuildingPermitPdf, 
  generateArchitecturalPermitPdf, 
  generateStructuralPermitPdf, 
  generateElectricalPermitPdf, 
  generateSanitaryPermitPdf,
  UnifiedPermitFormData
} from "../../../../../utils/unifiedPermitPdfGenerator";
import { generateLocationalClearancePdf } from "../../../../../utils/locationalClearancePdfGenerator";
import { PROJECT_TYPES_MATRIX, ProjectTypeItem } from "../../../../../data/projectTypeMatrix";

export default function ApplicationTrackDetail() {
  const params = useParams();
  const router = useRouter();
  const { applications, cancelApplication } = usePermitContext();
  const [appData, setAppData] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Change of project plans");
  const [isCancelling, setIsCancelling] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
    ? `${process.env.NEXT_PUBLIC_API_URL}/api` 
    : "http://localhost:8080/api";

  useEffect(() => {
    // 1. Initial check from context or local cache
    if (params.id) {
      if (applications && applications.length > 0) {
        const found = applications.find(a => a.id === params.id);
        if (found) setAppData(found);
      } else {
        try {
          const cachedStr = localStorage.getItem("etayo_cached_applications");
          if (cachedStr) {
            const cachedList = JSON.parse(cachedStr);
            const found = cachedList.find((a: any) => a.id === params.id);
            if (found) setAppData(found);
          }
        } catch (e) {}
      }
    }

    // 2. Fetch fresh live data directly from server
    const fetchFreshStatus = async () => {
      if (!params.id) return;
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers: Record<string, string> = { "Accept": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE_URL}/permits/${params.id}`, { headers });
        if (res.ok) {
          const serverApp = await res.json();
          if (serverApp && serverApp.id) {
            setAppData(serverApp);
          }
        }
      } catch (e) {
        // network error or offline fallback
      }
    };

    fetchFreshStatus();

    // 3. Live polling every 3 seconds to auto-detect admin approval without manual refresh
    const pollTimer = setInterval(fetchFreshStatus, 3000);

    return () => clearInterval(pollTimer);
  }, [params.id, applications]);

  if (!appData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in-up">
        <div className="spinner mb-4" style={{ width: "40px", height: "40px", border: "4px solid rgba(29, 78, 216, 0.2)", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <p className="text-gray-600">Loading application data...</p>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  const getStatusDetails = (status: string) => {
    switch(status) {
      case "pending": return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", icon: Clock, label: "Pending Review", step: 1 };
      case "under_review": return { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)", icon: Search, label: "Under Evaluation", step: 2 };
      case "incomplete_requirements": return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", icon: AlertTriangle, label: "Action Required", step: 2 };
      case "approved": return { color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", icon: CheckCircle2, label: "Approved (Awaiting Payment)", step: 3 };
      case "released": return { color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", icon: CheckCircle, label: "Permit Released", step: 4 };
      case "cancelled": return { color: "#dc2626", bg: "rgba(220, 38, 38, 0.15)", icon: XCircle, label: "Cancelled by Applicant", step: 0 };
      default: return { color: "#64748b", bg: "rgba(100, 116, 139, 0.15)", icon: FileText, label: "Unknown", step: 0 };
    }
  };

  const statusConfig = getStatusDetails(appData.status);
  const StatusIcon = statusConfig.icon;

  const timelineSteps = [
    { num: 1, title: "Application Submitted", desc: `Received on ${appData.dateSubmitted}` },
    { num: 2, title: "Document Evaluation", desc: appData.status === "incomplete_requirements" ? "Pending applicant action" : "Verifying attached requirements" },
    { num: 3, title: "Final Approval", desc: "Awaiting signatures from officials" },
    { num: 4, title: "Permit Release", desc: "Ready for pickup / download" }
  ];

  const getFilledDocUrl = async (doc: any): Promise<string> => {
    if (doc.url && doc.url.startsWith("data:") && !doc.url.includes("placeholder")) {
      return doc.url;
    }

    const pTypeObj: ProjectTypeItem = (appData?.projectType && typeof appData.projectType === "object")
      ? appData.projectType
      : PROJECT_TYPES_MATRIX.find(p => p.name.toLowerCase() === (appData?.projectType || "").toLowerCase() || p.id === appData?.projectType)
      || PROJECT_TYPES_MATRIX[0];

    const formData: UnifiedPermitFormData = {
      applicationNo: appData?.id || "APP-2026-6636",
      locationalClearanceRef: appData?.locationalClearanceRef || "LC-2026-9307",
      projectType: pTypeObj,
      applicantName: appData?.applicantName || "Paul Payumo",
      applicantPhone: appData?.applicantPhone || "0917-123-4567",
      applicantEmail: appData?.applicantEmail || "applicant@etayo.gov.ph",
      applicantAddress: appData?.projectAddress || appData?.applicantAddress || "Lawasn St., Blue Diamond, Brgy. Sapa, Sto. Tomas, Pampanga",
      applicantTIN: appData?.applicantTIN || "000-123-456-000",
      formOfOwnership: appData?.formOfOwnership || "INDIVIDUAL",
      projectName: appData?.projectName || `${pTypeObj.name} Installation & Construction`,
      projectAddress: appData?.projectAddress || appData?.location?.address || "Lawasn St., Blue Diamond",
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
      masterPlumberName: appData?.masterPlumberName || "Engr. Jose Mendoza, MP",
      masterPlumberPRC: appData?.masterPlumberPRC || "PRC-0012984",
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
      } else if (doc.code === "BP") {
        const b64 = await generateBuildingPermitPdf(formData);
        return `data:application/pdf;base64,${b64}`;
      } else if (doc.code === "LC" || doc.code === "LC-DOSSIER") {
        const b64 = await generateLocationalClearancePdf({
          applicationNo: appData?.locationalClearanceRef || appData?.id || "LC-2026-9307",
          submissionDate: appData?.dateSubmitted || new Date().toLocaleDateString(),
          applicantName: appData?.applicantName || "Paul Payumo",
          applicantAddress: appData?.projectAddress || appData?.applicantAddress || "Sto. Tomas, Pampanga",
          applicantPhone: appData?.applicantPhone || "0917-000-0000",
          applicantEmail: appData?.applicantEmail || "",
          projectName: appData?.projectName || `${pTypeObj.name} Project`,
          projectType: pTypeObj.name,
          projectNature: "New Construction",
          projectAddress: appData?.projectAddress || appData?.location?.address || "Sto. Tomas, Pampanga",
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

  // Safe document opening and downloading helpers for data URIs, templates, and backend URLs
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

  // Resolve all official permit forms and attached documents for this application
  const resolvedDocuments = React.useMemo(() => {
    if (!appData) return [];

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const resolveUrl = (u: string) => {
      if (!u) return "";
      const trimmed = u.trim();
      return trimmed.startsWith("/api/files/") ? `${apiBase}${trimmed}` : trimmed;
    };

    const rawUrls = (appData.fileUrl || "").split(",").map((s: string) => s.trim()).filter(Boolean);
    const primaryFileUrl = resolveUrl(rawUrls[0] || "");
    const isDrive = (appData.fileUrl || "").includes("drive.google.com");
    const projNameClean = (appData.projectName || appData.projectType || "Building").replace(/[^a-zA-Z0-9_-]/g, "_");

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

    // 1. MASTER UNIFIED PERMIT PACKAGE (Compiled Dossier)
    if (primaryFileUrl || appData.permitType === "building_permit" || appData.permitType === "locational_clearance") {
      docs.push({
        id: "master-dossier",
        title: appData.permitType === "locational_clearance" 
          ? "Official Locational Clearance Dossier" 
          : "Compiled Unified Building Permit Dossier",
        code: appData.permitType === "locational_clearance" ? "LC-DOSSIER" : "BP-DOSSIER",
        category: "Master Dossier",
        desc: "Complete compiled DPWH & LGU permit package with technical certifications",
        fileName: appData.fileName || `${appData.id}_${projNameClean}_Permit_Package.pdf`,
        fileSize: "2.4 MB",
        url: primaryFileUrl || (appData.permitType === "locational_clearance" ? "/templates/LOCATIONAL-CLEARANCE-Sto-Tomas.pdf" : "/templates/UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf"),
        downloadName: appData.fileName || `${appData.id}_${projNameClean}_Permit_Package.pdf`,
        badgeBg: "#dbeafe",
        badgeColor: "#1e40af",
        iconBg: "#eff6ff",
        iconColor: "#2563eb",
        iconType: "bp",
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
        iconColor: "#2563eb",
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

    if (appData.requirements && appData.requirements.length > 0) {
      appData.requirements.forEach((req: any, i: number) => {
        // Avoid duplicating LC if already added
        if (req.name && req.name.toLowerCase().includes("locational clearance") && docs.some(d => d.code === "LC")) {
          return;
        }

        // Match metadata from standard forms
        const matched = standardTechnicalForms.find(
          f => req.name?.toLowerCase().includes(f.title.toLowerCase()) || 
               req.name?.includes(`(${f.code})`) || 
               req.fileName?.startsWith(`${f.code}_`)
        );

        const code = matched ? matched.code : `REQ-${i + 1}`;
        const title = matched ? matched.title : req.name;
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
    } else if (appData.permitType === "building_permit" || !appData.permitType || appData.permitType.includes("building")) {
      // Fallback for building permit applications to guarantee all 6 municipal forms display
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

    // 5. ANY EXTRA ATTACHMENTS (if user uploaded custom files in fileUrl)
    if (rawUrls.length > 1) {
      rawUrls.slice(1).forEach((rawUrl: string, idx: number) => {
        const resolved = resolveUrl(rawUrl);
        if (!rawUrl.includes("drive.google.com") && !docs.some(d => d.url === resolved)) {
          docs.push({
            id: `extra-att-${idx + 1}`,
            title: `Custom Attached Engineering Scan ${idx + 1}`,
            code: `ATT-${idx + 1}`,
            category: "Uploaded Attachment",
            desc: "Physical signed engineering plan scan attached by applicant",
            fileName: `${appData.id}_Attachment_${idx + 1}.pdf`,
            fileSize: "1.8 MB",
            url: resolved,
            downloadName: `${appData.id}_Attachment_${idx + 1}.pdf`,
            badgeBg: "#f1f5f9",
            badgeColor: "#475569",
            iconBg: "#f8fafc",
            iconColor: "#64748b",
            iconType: "file"
          });
        }
      });
    }

    return docs;
  }, [appData]);

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
    <div className="dashboard-page animate-fade-in-up">
      <header className="page-header" style={{ marginBottom: "2rem" }}>
        <button onClick={() => router.push("/applicant/track")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontWeight: "600", marginBottom: "1rem", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem" }}>
          <ChevronLeft size={16} /> Back to Tracker
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="page-title" style={{ fontSize: "2rem", fontWeight: "800", color: "#0f172a" }}>{appData.projectName}</h1>
            <p className="page-subtitle" style={{ fontSize: "1.1rem", marginTop: "0.5rem", color: "#475569" }}>
              Tracking ID: <strong style={{color: "#1e293b"}}>{appData.id}</strong> • {appData.permitType.replace("_", " ")}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
            <span style={{ backgroundColor: statusConfig.bg, color: statusConfig.color, fontWeight: "700", padding: "10px 20px", borderRadius: "30px", display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem" }}>
              <StatusIcon size={20} strokeWidth={2.5} /> {statusConfig.label}
            </span>
          </div>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(380px, 480px)", gap: "2rem", alignItems: "start" }}>
        
        {/* Left Column: Timeline & Project Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="glass-panel" style={{ padding: "2.5rem", background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e293b", marginBottom: "2rem" }}>Application Timeline</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", position: "relative" }}>
              {/* Connecting line */}
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
                  <div key={step.num} style={{ display: "flex", gap: "1.5rem", position: "relative", zIndex: 1, opacity: isPassed || isActive ? 1 : 0.5 }}>
                    <div style={{ 
                      width: "40px", height: "40px", borderRadius: "50%", background: circleColor, 
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      boxShadow: isActive ? `0 0 0 4px ${statusConfig.bg}` : "none",
                      transition: "all 0.3s ease"
                    }}>
                      {isPassed ? <CheckCircle size={20} color={iconColor} /> : <span style={{ color: iconColor, fontWeight: "700" }}>{step.num}</span>}
                    </div>
                    <div style={{ paddingTop: "8px" }}>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" }}>{step.title}</h3>
                      <p style={{ color: "#64748b", marginTop: "0.25rem", fontSize: "0.95rem" }}>{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "2rem", background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e293b", marginBottom: "1.25rem" }}>Project Details</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div>
                <span style={{ display: "block", color: "#64748b", fontSize: "0.82rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Applicant</span>
                <span style={{ color: "#0f172a", fontWeight: "700", fontSize: "0.95rem" }}>{appData.applicantName}</span>
              </div>
              <div>
                <span style={{ display: "block", color: "#64748b", fontSize: "0.82rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date Submitted</span>
                <span style={{ color: "#0f172a", fontWeight: "700", fontSize: "0.95rem" }}>{appData.dateSubmitted}</span>
              </div>
              <div>
                <span style={{ display: "block", color: "#64748b", fontSize: "0.82rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Project Type</span>
                <span style={{ color: "#1e40af", fontWeight: "700", fontSize: "0.92rem", background: "#eff6ff", padding: "2px 8px", borderRadius: "6px", display: "inline-block", marginTop: "2px" }}>
                  {appData.projectType || "Single-Detached House"}
                </span>
              </div>
              <div>
                <span style={{ display: "block", color: "#64748b", fontSize: "0.82rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Zoning Clearance</span>
                <span style={{ color: "#15803d", fontWeight: "700", fontSize: "0.92rem", background: "#f0fdf4", padding: "2px 8px", borderRadius: "6px", display: "inline-block", marginTop: "2px" }}>
                  {appData.locationalClearanceRef || "LC-APPROVED"}
                </span>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ display: "block", color: "#64748b", fontSize: "0.82rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Site Address</span>
                <span style={{ color: "#334155", fontWeight: "600", fontSize: "0.92rem" }}>
                  {appData.projectAddress || appData.location?.address || "Sto. Tomas, Pampanga"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: All Official Technical Permit Forms & Attachments */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="glass-panel" style={{ padding: "2rem", background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.75))", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 10px 40px rgba(0,0,0,0.04)" }}>
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
                          <Eye size={13} color="#2563eb" /> View Document
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
                            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
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
                  Ref ID: <strong style={{ color: "#1e293b" }}>{appData.id}</strong> • {appData.projectName || "Permit Application"}
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
    </div>
  );
}
