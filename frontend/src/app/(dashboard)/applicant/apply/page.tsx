"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { usePermitContext } from "../../../../context/PermitContext";
import { 
  FileText, MapPin, Upload, CheckCircle, ChevronRight, ChevronLeft, 
  Lock, ShieldCheck, AlertCircle, Check, Layers, Search, Sparkles, 
  Home, Building2, Factory, Landmark, Wrench, Zap, Clock, Copy, 
  ArrowRight, CheckCircle2, Shield, Droplets, Flame, Radio, FileCheck, X,
  BadgeCheck, Info, Compass, Eye, Printer, Download, FileUp, Trash2, Paperclip, AlertTriangle,
  RefreshCw, Plus, RotateCcw
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

import LocationalClearanceGoogleForm from "../../../../components/forms/LocationalClearanceGoogleForm";
import UnifiedProjectGoogleForm from "../../../../components/forms/UnifiedProjectGoogleForm";
import TechnicalPermitFormsStep from "../../../../components/forms/TechnicalPermitFormsStep";
import { generateUnifiedPermitPdf } from "../../../../utils/unifiedPermitPdfGenerator";
import { 
  PROJECT_TYPES_MATRIX, 
  ProjectTypeItem, 
  ProjectCategory, 
  PERMIT_FORM_METADATA, 
  PermitFormMatrix,
  ALL_OFFICIAL_TEMPLATES,
  OfficialTemplateFile,
  getRequiredPermitForms,
  getConditionalPermitForms,
  getPermitFormTemplate
} from "../../../../data/projectTypeMatrix";

const CATEGORY_THEMES: Record<string, { icon: any; color: string; bg: string; border: string; glow: string }> = {
  All: { icon: Layers, color: "#b45309", bg: "#fef3c7", border: "#fde68a", glow: "rgba(245, 158, 11, 0.25)" },
  Residential: { icon: Home, color: "#b45309", bg: "#fef3c7", border: "#fde68a", glow: "rgba(245, 158, 11, 0.25)" },
  Commercial: { icon: Building2, color: "#b45309", bg: "#fef3c7", border: "#fde68a", glow: "rgba(245, 158, 11, 0.25)" },
  Industrial: { icon: Factory, color: "#b45309", bg: "#fef3c7", border: "#fde68a", glow: "rgba(245, 158, 11, 0.25)" },
  Institutional: { icon: Landmark, color: "#b45309", bg: "#fef3c7", border: "#fde68a", glow: "rgba(245, 158, 11, 0.25)" },
  "Ancillary & Alterations": { icon: Wrench, color: "#b45309", bg: "#fef3c7", border: "#fde68a", glow: "rgba(245, 158, 11, 0.25)" },
  "Utilities & Mechanical": { icon: Zap, color: "#b45309", bg: "#fef3c7", border: "#fde68a", glow: "rgba(245, 158, 11, 0.25)" },
};

const PERMIT_ICONS: Record<keyof PermitFormMatrix, any> = {
  buildingPermit: FileCheck,
  architecturalPermit: Layers,
  civilStructuralPermit: Shield,
  electricalPermit: Zap,
  sanitaryPermit: Droplets,
  mechanicalPermit: Wrench,
  electronicsPermit: Radio,
  fireBfpPermit: Flame,
  zoningPermit: MapPin,
  demolitionPermit: Trash2,
  fencingPermit: ShieldCheck,
  excavationPermit: Wrench,
  signPermit: FileText,
  temporaryServiceConnection: Zap,
  certificateOfOccupancy: CheckCircle2,
  certificateOfCompletion: FileCheck,
  cfei: Zap,
};

const LocationPickerMap = dynamic(() => import("../../../../components/map/LocationPickerMap"), { 
  ssr: false, 
  loading: () => <div style={{ height: "200px", background: "#f8fafc", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #cbd5e1", color: "#64748b", fontWeight: "600" }}>Loading Map...</div> 
});

const STEPS = [
  { id: 1, title: "Project Type", subtitle: "Municipal Matrix", icon: Building2 },
  { id: 2, title: "Locational Clearance", subtitle: "Zoning Prerequisite", icon: ShieldCheck },
  { id: 3, title: "Permit Forms", subtitle: "Required Forms", icon: FileText },
  { id: 4, title: "Mapping", subtitle: "GIS & Coordinates", icon: MapPin },
  { id: 5, title: "Review", subtitle: "Final Endorsement", icon: CheckCircle }
];

const getProjectPermitsBreakdown = (project: ProjectTypeItem) => {
  const allKeys = Object.keys(PERMIT_FORM_METADATA) as (keyof PermitFormMatrix)[];
  
  const mandatory = allKeys
    .filter(k => project.matrix[k] === 'required')
    .map(k => ({
      key: k,
      ...PERMIT_FORM_METADATA[k],
      status: 'required' as const,
      icon: PERMIT_ICONS[k] || FileText
    }));

  const conditional = allKeys
    .filter(k => project.matrix[k] === 'conditional')
    .map(k => {
      let condition = 'Required depending on site engineering evaluation and specialized equipment scope.';
      if (k === 'mechanicalPermit') {
        condition = 'Required if project includes air conditioning machinery, elevator/escalators, commercial exhaust, or standby generator sets.';
      } else if (k === 'electronicsPermit') {
        condition = 'Required if project includes CCTV networks, security systems, commercial sound systems, or structured data cabling.';
      } else if (k === 'sanitaryPermit') {
        condition = 'Required if plumbing fixtures, drainage, or septic/wastewater facilities are modified.';
      } else if (k === 'fireBfpPermit') {
        condition = 'Required if structure undergoes material alteration, occupancy change, or high fire-load expansion.';
      }

      return {
        key: k,
        ...PERMIT_FORM_METADATA[k],
        status: 'conditional' as const,
        condition,
        icon: PERMIT_ICONS[k] || FileText
      };
    });

  const notRequired = allKeys
    .filter(k => project.matrix[k] === 'not_required')
    .map(k => ({
      key: k,
      ...PERMIT_FORM_METADATA[k],
      status: 'not_required' as const,
      icon: PERMIT_ICONS[k] || FileText
    }));

  return { mandatory, conditional, notRequired };
};

export default function ApplyPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const { applications, selectedPermitType, setSelectedPermitType, addApplication, refreshApplications } = usePermitContext();
  const router = useRouter();

  // Locational Clearance Prerequisite & Form State
  const [showGoogleForm, setShowGoogleForm] = useState(false);
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);
  const [selectedClearanceRef, setSelectedClearanceRef] = useState<string | null>(null);
  const [manualClearanceInput, setManualClearanceInput] = useState("");
  const [manualClearanceError, setManualClearanceError] = useState("");
  const [applicantName, setApplicantName] = useState("Applicant");
  const [isCheckingClearance, setIsCheckingClearance] = useState(false);

  // Project Type Matrix State (Step 1)
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectTypeItem>(PROJECT_TYPES_MATRIX[0]);
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUnifiedForm, setShowUnifiedForm] = useState(false);
  const [showRequirementsAlert, setShowRequirementsAlert] = useState(false);
  const [showAllTemplatesModal, setShowAllTemplatesModal] = useState(false);
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [newAppAlert, setNewAppAlert] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [mounted, setMounted] = useState(false);

  const goToStep = useCallback((stepNumber: number) => {
    setCurrentStep(stepNumber);
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("step", String(stepNumber));
        window.history.replaceState({}, "", url.toString());
      } catch (e) {}
    }
  }, []);

  const handleCheckClearanceStatus = async () => {
    setIsCheckingClearance(true);
    try {
      if (refreshApplications) {
        await refreshApplications();
      }
    } catch (e) {}
    setTimeout(() => setIsCheckingClearance(false), 600);
  };

  const hasInitializedFromUrlRef = useRef(false);

  // One-time initialization on mount from URL parameters and local session
  useEffect(() => {
    setMounted(true);
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj.name) setApplicantName(userObj.name);
      }
    } catch (e) {}

    if (typeof window !== "undefined" && !hasInitializedFromUrlRef.current) {
      hasInitializedFromUrlRef.current = true;
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("clearanceRef");
      if (ref) {
        setSelectedClearanceRef(ref);
      }

      const typeParam = params.get("type") || params.get("projectType");
      if (typeParam) {
        const found = PROJECT_TYPES_MATRIX.find(
          p => p.id === typeParam || p.name.toLowerCase() === typeParam.toLowerCase()
        );
        if (found) setSelectedProjectType(found);
      }

      const templateParam = params.get("template") || params.get("code");
      if (templateParam) {
        const tmpl = ALL_OFFICIAL_TEMPLATES.find(
          t => t.code.toLowerCase() === templateParam.toLowerCase() ||
               t.filename.toLowerCase().includes(templateParam.toLowerCase()) ||
               t.formKey?.toLowerCase() === templateParam.toLowerCase()
        );
        if (tmpl && tmpl.projectTypeId) {
          const matchedProj = PROJECT_TYPES_MATRIX.find(p => p.id === tmpl.projectTypeId);
          if (matchedProj) setSelectedProjectType(matchedProj);
        }
      }

      if (params.get("openTemplates") === "true") {
        setShowAllTemplatesModal(true);
      }

      const stepParam = params.get("step");
      if (stepParam && !isNaN(Number(stepParam))) {
        setCurrentStep(Number(stepParam));
      } else if (ref) {
        // Only start at step 2 if arriving from a clearance link without explicit step
        setCurrentStep(2);
      }
    }
  }, []);

  // Separate listener for window focus to keep applications updated without resetting current step
  useEffect(() => {
    const onFocus = () => {
      refreshApplications?.();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshApplications]);

  useEffect(() => {
    if (showRequirementsAlert || showAllTemplatesModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showRequirementsAlert, showAllTemplatesModal]);

  const handleCopyRef = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } catch (e) {}
  };

  const filteredProjectTypes = PROJECT_TYPES_MATRIX.filter((p) => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesQuery = searchQuery.trim() === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // Check whether the currently selected project type requires / conditionally requires Locational Clearance
  const isClearanceRequired = selectedProjectType ? selectedProjectType.matrix.zoningPermit !== 'not_required' : true;

  // Combine applications with localStorage cached applications to avoid false negative flickers during async refreshes
  const allAvailableApps = useMemo(() => {
    let list = applications || [];
    if (list.length === 0 && typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("etayo_cached_applications");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = parsed;
          }
        }
      } catch (e) {}
    }
    return list;
  }, [applications]);

  // Find locational clearance application ONLY when an explicit reference is selected (e.g. from Track page or Step 2 selection)
  const matchedClearanceApp = useMemo(() => {
    if (!selectedClearanceRef) return null;
    return allAvailableApps.find(a => a.id === selectedClearanceRef) || null;
  }, [selectedClearanceRef, allAvailableApps]);

  const isClearanceApproved = Boolean(
    matchedClearanceApp && (
      matchedClearanceApp.status?.toLowerCase() === "approved" || 
      matchedClearanceApp.status?.toLowerCase() === "released"
    )
  );

  const isClearancePending = Boolean(
    matchedClearanceApp && (
      matchedClearanceApp.status?.toLowerCase() === "pending" || 
      matchedClearanceApp.status?.toLowerCase() === "under_review" ||
      matchedClearanceApp.status?.toLowerCase() === "in_progress"
    )
  );

  const isClearanceRejected = Boolean(
    matchedClearanceApp && matchedClearanceApp.status?.toLowerCase() === "rejected"
  );

  // Clearance is ONLY considered passed if not required by the project type, OR if officially APPROVED by the admin/MPDO
  const isClearancePassed = !isClearanceRequired || isClearanceApproved;
  const activeClearanceRef = matchedClearanceApp?.id || selectedClearanceRef || (isClearanceRequired ? null : "EXEMPT");

  // Filter available clearances the user might already have submitted in the system
  const userClearances = useMemo(() => {
    return allAvailableApps.filter(
      (app) => app.permitType === "locational_clearance" || (app.id && app.id.startsWith("LC-"))
    );
  }, [allAvailableApps]);

  // Existing approved clearances matching currently selected project type (available for linking in Step 2)
  const matchingApprovedClearances = useMemo(() => {
    return userClearances.filter(a =>
      (a.status?.toLowerCase() === "approved" || a.status?.toLowerCase() === "released") &&
      (a.projectType === selectedProjectType?.name || (a.projectName && a.projectName.includes(selectedProjectType?.name)))
    );
  }, [userClearances, selectedProjectType]);

  // Auto-sync project type to match approved locational clearance (when an explicit clearance reference is loaded)
  useEffect(() => {
    if (matchedClearanceApp?.projectType) {
      const found = PROJECT_TYPES_MATRIX.find(
        p => p.name.toLowerCase() === matchedClearanceApp.projectType?.toLowerCase() ||
             p.id.toLowerCase() === matchedClearanceApp.projectType?.toLowerCase()
      );
      if (found && found.id !== selectedProjectType?.id) {
        setSelectedProjectType(found);
      }
    }
  }, [matchedClearanceApp?.projectType, selectedProjectType?.id]);


  // Sync selected permit type internally without triggering unnecessary re-renders
  useEffect(() => {
    if (currentStep === 2 && isClearanceRequired && !isClearancePassed) {
      if (selectedPermitType !== "locational_clearance") {
        setSelectedPermitType("locational_clearance");
      }
    } else {
      if (selectedPermitType !== "building_permit") {
        setSelectedPermitType("building_permit");
      }
    }
  }, [currentStep, isClearanceRequired, isClearancePassed, selectedPermitType, setSelectedPermitType]);

  const [projectName, setProjectName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [barangay, setBarangay] = useState("San Bartolome");
  const [lotArea, setLotArea] = useState("");
  const [floorArea, setFloorArea] = useState("");
  const [projectCost, setProjectCost] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [detectedZone, setDetectedZone] = useState<{barangay?: string, zoneType?: string, description?: string} | null>(null);

  // Automatically autofill project & applicant parameters from existing Application Status (matchedClearanceApp)
  useEffect(() => {
    if (!matchedClearanceApp) return;

    // 1. Applicant Name
    if (matchedClearanceApp.applicantName && (!applicantName || applicantName === "Applicant")) {
      setApplicantName(matchedClearanceApp.applicantName);
    }

    // 2. Project Name
    const rawProjectName = matchedClearanceApp.projectName || "";
    const cleanProjectName = rawProjectName
      .replace(/\s*-\s*Locational\s*Clearance/gi, "")
      .replace(/\s*\(Locational\s*Clearance\)/gi, "")
      .trim();
    if (cleanProjectName) {
      setProjectName(cleanProjectName);
    } else if (selectedProjectType?.name && !projectName) {
      setProjectName(`${selectedProjectType.name} Project`);
    }

    // 3. Address & Barangay parsing
    const addr = (matchedClearanceApp as any).projectAddress || matchedClearanceApp.location?.address || "";
    if (addr) {
      const brgyMatch = addr.match(/Brgy\.?\s*([A-Za-z\s]+?)(?:,\s*Sto\.?\s*Tomas|$)/i);
      if (brgyMatch && brgyMatch[1]) {
        const foundBrgy = brgyMatch[1].trim();
        setBarangay(foundBrgy);
      } else if ((matchedClearanceApp as any).barangay) {
        setBarangay((matchedClearanceApp as any).barangay);
      }

      const streetPart = addr.split(/Brgy\.?/i)[0].replace(/,\s*$/, "").trim();
      if (streetPart) {
        setStreetAddress(streetPart);
      } else if ((matchedClearanceApp as any).streetAddress) {
        setStreetAddress((matchedClearanceApp as any).streetAddress);
      }
    }

    // 4. Lot Area, Floor Area, and Project Cost parsing
    const desc = matchedClearanceApp.projectDescription || "";
    const lotMatch = desc.match(/Lot:\s*([0-9.,]+)/i);
    const bldgMatch = desc.match(/Bldg:\s*([0-9.,]+)/i);
    const costMatch = desc.match(/Cost:\s*(?:Php\s*)?([0-9.,]+)/i);

    const extractedLot = (matchedClearanceApp as any).lotArea || (lotMatch ? lotMatch[1] : "");
    const extractedFloor = (matchedClearanceApp as any).floorArea || (matchedClearanceApp as any).bldgArea || (bldgMatch ? bldgMatch[1] : "");
    const extractedCost = (matchedClearanceApp as any).projectCost || (costMatch ? costMatch[1] : "");

    if (extractedLot) {
      setLotArea(String(extractedLot));
    } else if (!lotArea) {
      setLotArea("180");
    }

    if (extractedFloor) {
      setFloorArea(String(extractedFloor));
    } else if (!floorArea) {
      setFloorArea("120");
    }

    if (extractedCost) {
      setProjectCost(String(extractedCost));
    } else if (!projectCost) {
      setProjectCost("1,600,000.00");
    }

    // 5. GPS Coordinates
    if (matchedClearanceApp.location?.lat) {
      setLatitude(String(matchedClearanceApp.location.lat));
    }
    if (matchedClearanceApp.location?.lng) {
      setLongitude(String(matchedClearanceApp.location.lng));
    }
  }, [matchedClearanceApp, selectedProjectType]);
  
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");

  // Technical engineering permit documents attached per permit key (e.g. electricalPermit, mechanicalPermit)
  interface AttachedPermitDoc {
    fileName: string;
    fileSize: string;
    fileUrl: string;
    uploadedAt: string;
    isCompiled?: boolean;
  }
  const [uploadedPermitDocs, setUploadedPermitDocs] = useState<Record<string, any>>({});
  const [activeUploadingKey, setActiveUploadingKey] = useState<string | null>(null);
  const [submissionErrorAlert, setSubmissionErrorAlert] = useState<string | null>(null);
  const [showConditionalSection, setShowConditionalSection] = useState(false);

  const projectAddress = `${streetAddress}, Brgy. ${barangay}, Sto. Tomas, Pampanga`;

  // Mandatory technical permits required for the selected project type (excluding zoningPermit which is Stage 1 / Step 2)
  const mandatoryPermitsToSubmit = selectedProjectType ? (Object.keys(selectedProjectType.matrix) as (keyof PermitFormMatrix)[]).filter(
    (k) => selectedProjectType.matrix[k] === 'required' && k !== 'zoningPermit'
  ) : [];

  // Conditional permits for the selected project type
  const conditionalPermitsToSubmit = selectedProjectType ? (Object.keys(selectedProjectType.matrix) as (keyof PermitFormMatrix)[]).filter(
    (k) => selectedProjectType.matrix[k] === 'conditional' && k !== 'zoningPermit'
  ) : [];

  // Mandatory permits that have not yet been attached
  const missingMandatoryPermits = mandatoryPermitsToSubmit.filter(
    (k) => !uploadedPermitDocs[k]
  );

  const isAllMandatoryAttached = missingMandatoryPermits.length === 0;

  const handlePermitDocUpload = async (key: keyof PermitFormMatrix, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setActiveUploadingKey(key);
    setUploadError("");
    setSubmissionErrorAlert(null);

    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("permitType", PERMIT_FORM_METADATA[key]?.label || "Technical Permit");
      formData.append("projectType", selectedProjectType?.name || "General Application");

      let fileUrl = "";
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/upload`, {
          method: "POST",
          headers: token ? { "Authorization": `Bearer ${token}` } : {},
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          fileUrl = data.urls?.[0] || "";
        }
      } catch (err) {
        console.warn("Backend upload offline, using client session object", err);
      }

      if (!fileUrl && typeof window !== "undefined") {
        fileUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string) || "");
          reader.onerror = () => resolve("");
          reader.readAsDataURL(file);
        });
      }

      const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
      const sizeStr = file.size > 1024 * 1024 ? `${sizeInMb} MB` : `${Math.round(file.size / 1024)} KB`;

      setUploadedPermitDocs(prev => ({
        ...prev,
        [key]: {
          fileName: file.name,
          fileSize: sizeStr,
          fileUrl: fileUrl || "submitted_permit_document.pdf",
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      }));
    } catch (err: any) {
      setUploadError(err.message || "An error occurred during upload");
    } finally {
      setActiveUploadingKey(null);
    }
  };

  const handleRemovePermitDoc = (key: string) => {
    setUploadedPermitDocs(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    
    const formattedPermitType = selectedPermitType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    formData.append("permitType", formattedPermitType);
    formData.append("projectType", selectedProjectType?.name || "General Application");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload files");
      }

      const data = await response.json();
      setUploadedFileUrl(data.urls.join(','));
    } catch (err: any) {
      setUploadError(err.message || "An error occurred during upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitApplication = async () => {
    // STRICT VALIDATION: Block submission if any mandatory technical permit is missing
    if (!isAllMandatoryAttached) {
      const missingLabels = missingMandatoryPermits.map(k => PERMIT_FORM_METADATA[k]?.label || k).join(", ");
      setSubmissionErrorAlert(
        `Submission Incomplete: Sto. Tomas Permitting Regulations require attaching all mandatory engineering permits for ${selectedProjectType.name}. Missing: ${missingLabels}. Please upload the documents below or complete them online.`
      );
      if (typeof document !== "undefined") {
        const elem = document.getElementById("mandatory-requirements-section");
        if (elem) {
          elem.scrollIntoView({ behavior: "smooth" });
        }
      }
      return;
    }

    // Build the dynamic requirements list
    const requirementsList: any[] = [];

    // 1. Locational Clearance entry
    if (isClearanceRequired && activeClearanceRef) {
      requirementsList.push({
        name: "Locational Clearance (LC)",
        required: true,
        status: "approved",
        fileName: `Locational_Clearance_${activeClearanceRef}.pdf`,
        fileSize: "840 KB",
        remarks: `Zoning clearance reference: ${activeClearanceRef}`
      });
    } else if (!isClearanceRequired) {
      requirementsList.push({
        name: "Locational Clearance (LC)",
        required: false,
        status: "approved",
        fileName: "ZONING_EXEMPTION_PD1096.pdf",
        fileSize: "120 KB",
        remarks: `Exempt from zoning clearance under Sto. Tomas municipal ordinance for ${selectedProjectType.name}`
      });
    }

    // 2. Mandatory Technical Engineering Permits
    mandatoryPermitsToSubmit.forEach(key => {
      const meta = PERMIT_FORM_METADATA[key];
      const doc = uploadedPermitDocs[key];
      const templatePath = getPermitFormTemplate(key, selectedProjectType);
      requirementsList.push({
        name: `${meta.label} (${meta.code})`,
        required: true,
        status: "approved",
        fileName: doc?.fileName || `${meta.code}_${selectedProjectType.name.replace(/\s+/g, '_')}_Official_Filled.pdf`,
        fileSize: doc?.fileSize || "1.4 MB",
        remarks: `Official ${meta.label} document submitted and verified`,
        fileUrl: doc?.fileUrl || templatePath
      });
    });

    // 3. Any attached conditional permits
    Object.keys(uploadedPermitDocs).forEach(key => {
      if (!mandatoryPermitsToSubmit.includes(key as keyof PermitFormMatrix) && key !== "zoningPermit") {
        const meta = PERMIT_FORM_METADATA[key as keyof PermitFormMatrix];
        const doc = uploadedPermitDocs[key];
        const templatePath = getPermitFormTemplate(key as keyof PermitFormMatrix, selectedProjectType);
        if (meta && doc) {
          requirementsList.push({
            name: `${meta.label} (${meta.code}) [Conditional]`,
            required: false,
            status: "approved",
            fileName: doc.fileName,
            fileSize: doc.fileSize,
            remarks: "Voluntarily attached conditional engineering document",
            fileUrl: doc.fileUrl || templatePath
          });
        }
      }
    });

    const attachedUrls = Object.values(uploadedPermitDocs).map(d => d.fileUrl).filter(Boolean);

    const newId = `APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const submissionDate = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    const formattedFileName = `${newId}_${selectedProjectType.name.replace(/\s+/g, '_')}_Permit_Package.pdf`;

    // Generate official unified PDF dossier package for this application
    let finalFileUrl = "";
    try {
      const generatedBase64 = await generateUnifiedPermitPdf({
        applicationNo: newId,
        locationalClearanceRef: activeClearanceRef || (isClearanceRequired ? "LC-APPROVED" : "EXEMPT"),
        projectType: selectedProjectType,
        applicantName,
        applicantPhone: "0917-123-4567",
        applicantEmail: "applicant@etayo.gov.ph",
        applicantAddress: projectAddress,
        projectName: projectName || `${selectedProjectType.name} Construction`,
        projectAddress,
        barangay,
        lotArea: lotArea || "200",
        floorArea: floorArea || "120",
        projectCost: projectCost || "1,500,000.00",
        scopeOfWork: "New Construction",
        occupancyClass: "Group A - Residential",
        proposedStoreys: "2",
        activePermitForms: mandatoryPermitsToSubmit,
        submissionDate
      });
      if (generatedBase64) {
        finalFileUrl = `data:application/pdf;base64,${generatedBase64}`;
      }
    } catch (err) {
      console.warn("Notice: Client PDF generation skipped or fallback:", err);
    }
    // Collect all valid document base64 data URIs so all filled forms and attachments reach Google Drive
    const docList: string[] = [];
    if (finalFileUrl && finalFileUrl.startsWith("data:")) {
      docList.push(finalFileUrl);
    }
    for (const url of attachedUrls) {
      if (typeof url === "string" && url.startsWith("data:") && !docList.includes(url)) {
        docList.push(url);
      }
    }
    const combinedFileUrl = docList.length > 0 
      ? docList.join(",") 
      : (finalFileUrl || attachedUrls[0] || uploadedFileUrl || "");

    const newApp: any = {
      id: newId,
      projectName: projectName || `${selectedProjectType.name} Installation & Construction`,
      projectType: selectedProjectType.name,
      permitType: selectedPermitType,
      status: "pending",
      dateSubmitted: submissionDate,
      applicantName: applicantName || "Applicant",
      fileUrl: combinedFileUrl,
      fileName: formattedFileName,
      locationalClearanceRef: activeClearanceRef || undefined,
      location: {
        lat: parseFloat(latitude) || 15.0050,
        lng: parseFloat(longitude) || 120.7100,
        address: projectAddress || 'Sto. Tomas, Pampanga',
      },
      requirements: requirementsList,
      trackingSteps: [
        { title: 'Application Submitted', status: 'completed', date: submissionDate, notes: `Application dossier filed online with ${requirementsList.length} verified engineering attachments.` },
        { title: 'Initial Document Verification', status: 'upcoming', notes: 'Reviewing all technical engineering attachments for completeness and licensed PRC sign-offs.' }
      ],
      historyLog: [
        { date: new Date().toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute:"2-digit" }), action: 'Application Submitted', actor: applicantName, details: `Applied for ${selectedProjectType.name} with ${mandatoryPermitsToSubmit.length} mandatory engineering permits.` }
      ]
    };

    addApplication(newApp);
    router.push("/applicant/dashboard");
  };

  if (showGoogleForm) {
    return (
      <LocationalClearanceGoogleForm 
        onCancel={() => setShowGoogleForm(false)} 
        onSuccessWithRef={(newRef) => {
          setSelectedClearanceRef(newRef);
          setShowGoogleForm(false);
          goToStep(2);
        }}
        initialProjectType={selectedProjectType?.name}
        initialProjectName={projectName}
        initialBarangay={barangay}
        initialLotArea={lotArea}
      />
    );
  }

  if (showUnifiedForm) {
    return (
      <UnifiedProjectGoogleForm
        projectType={selectedProjectType}
        locationalClearanceRef={activeClearanceRef || (isClearanceRequired ? "LC-APPROVED" : "EXEMPT")}
        initialApplicantName={applicantName}
        initialApplicantAddress={projectAddress}
        initialProjectName={projectName}
        initialBarangay={barangay}
        initialLotArea={lotArea}
        onSubmitSuccess={(newApp) => {
          addApplication(newApp);
          setShowUnifiedForm(false);
          router.push("/applicant/dashboard");
        }}
        onCancel={() => setShowUnifiedForm(false)}
      />
    );
  }

  return (
    <div className="wizard-page animate-fade-in-up">
      <header className="page-header" style={{ 
        background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.9)",
        boxShadow: "0 10px 35px rgba(0, 0, 0, 0.14)",
        borderRadius: "20px",
        padding: "1.5rem 2rem",
        marginBottom: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="page-title" style={{ fontSize: "2rem", fontWeight: "800", background: "linear-gradient(90deg, #021a4f 0%, #0038A8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", color: "#0038A8", margin: "0 0 0.4rem 0", letterSpacing: "-0.02em" }}>
              New Permit Application
            </h1>
            <p className="page-subtitle" style={{ margin: 0, color: "#475569", fontSize: "1.05rem" }}>
              Official unified digital permitting workflow compliant with National Building Code of the Philippines (PD 1096).
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setShowNewAppModal(true)}
              className="btn-primary"
              style={{
                background: "linear-gradient(135deg, #0038A8 0%, #021a4f 100%)",
                boxShadow: "0 4px 15px rgba(0, 56, 168, 0.4)",
                transform: "translateY(0)",
                transition: "all 0.3s ease",
                color: "#ffffff",
                padding: "10px 20px",
                borderRadius: "14px",
                fontWeight: "700",
                fontSize: "0.9rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                border: "none"
              }}
            >
              <Plus size={18} color="#ffffff" />
              <span>Create New Application</span>
            </button>
          </div>
        </div>
      </header>

      {/* NEW APPLICATION ALERT TOAST */}
      {newAppAlert && (
        <div className="animate-fade-in-up" style={{
          background: "#ecfdf5",
          border: "1.5px solid #a7f3d0",
          borderRadius: "14px",
          padding: "12px 18px",
          marginBottom: "1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "#065f46"
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <span style={{ fontSize: "0.88rem", fontWeight: "700" }}>{newAppAlert}</span>
          <button 
            type="button" 
            onClick={() => setNewAppAlert(null)}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#059669", fontWeight: "800" }}
          >
            &times;
          </button>
        </div>
      )}

      <div className="wizard-container glass-panel">
        <div className="wizard-sidebar" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <ul className="step-list">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isPassed = currentStep > step.id;
              const isExempt = step.id === 2 && !isClearanceRequired;
              const isClearanceVerified = step.id === 2 && isClearancePassed && isClearanceRequired;
              const isClearanceAwaitingAdmin = step.id === 2 && isClearancePending && isClearanceRequired;
              return (
                <li 
                  key={step.id} 
                  className={`step-item ${isActive ? "active" : ""} ${isPassed ? "passed" : ""}`}
                  onClick={() => {
                    if (step.id === 1) {
                      goToStep(1);
                      return;
                    }
                    if (step.id === 2) {
                      goToStep(2);
                      return;
                    }
                    if (isClearancePassed) {
                      goToStep(step.id);
                    } else {
                      if (isClearancePending) {
                        setLockedNotice(`Your Locational Clearance (${matchedClearanceApp?.id}) is awaiting Admin approval. The municipal zoning administrator must approve your clearance before you can proceed to ${step.title}.`);
                      } else {
                        setLockedNotice(`Mandatory Locational Clearance must be approved by the Admin for ${selectedProjectType.name} before proceeding to ${step.title}.`);
                      }
                    }
                  }}
                  style={{ 
                    cursor: (!isClearancePassed && step.id > 2) ? "not-allowed" : "pointer" 
                  }}
                >
                  <div className="step-indicator" style={{
                    transition: "all 0.2s ease",
                    boxShadow: isActive ? "0 0 0 4px rgba(79, 70, 229, 0.15)" : "none",
                    background: isClearanceAwaitingAdmin && !isActive ? "#fef3c7" : undefined,
                    borderColor: isClearanceAwaitingAdmin && !isActive ? "#f59e0b" : undefined,
                    color: isClearanceAwaitingAdmin && !isActive ? "#b45309" : undefined
                  }}>
                    {isPassed ? (
                      <CheckCircle size={16} />
                    ) : isClearanceAwaitingAdmin ? (
                      <Clock size={16} color="#d97706" />
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>
                  <div className="step-content">
                    <span className="step-title">{step.title}</span>
                    <span className="step-desc" style={{ 
                      fontSize: "0.74rem", 
                      color: isClearanceAwaitingAdmin && !isActive ? "#d97706" : (isActive ? "#4f46e5" : "#94a3b8"), 
                      fontWeight: isActive || isClearanceAwaitingAdmin ? "700" : "500" 
                    }}>
                      {isActive 
                        ? "In Progress" 
                        : isExempt 
                        ? "Exempt" 
                        : isClearanceVerified 
                        ? "Approved" 
                        : isClearanceAwaitingAdmin
                        ? "Pending Approval"
                        : step.subtitle}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="wizard-content">
          {/* APPROVED CLEARANCE BANNER (Only when an explicit clearance is actively linked) */}
          {selectedClearanceRef && isClearanceApproved && (
            <div className="animate-fade-in-up" style={{
              background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
              border: "1.5px solid #a7f3d0",
              borderRadius: "16px",
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              boxShadow: "0 2px 10px rgba(5, 150, 105, 0.06)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#dcfce7", color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <strong style={{ color: "#065f46", fontSize: "0.92rem" }}>
                      Active Approved Clearance: {selectedProjectType.name}
                    </strong>
                    <span style={{ fontSize: "0.76rem", fontWeight: "700", background: "#ffffff", color: "#047857", padding: "2px 8px", borderRadius: "999px", border: "1px solid #a7f3d0" }}>
                      Ref: {activeClearanceRef}
                    </span>
                  </div>
                  <span style={{ color: "#047857", fontSize: "0.82rem" }}>
                    Permit forms are synchronized to approved Locational Clearance {activeClearanceRef}.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedClearanceRef(null);
                  setLockedNotice(null);
                  setNewAppAlert("Unlinked clearance. Starting fresh application draft.");
                  setTimeout(() => setNewAppAlert(null), 4000);
                }}
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #059669",
                  color: "#059669",
                  fontWeight: "700",
                  fontSize: "0.82rem",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(5, 150, 105, 0.1)"
                }}
              >
                <RotateCcw size={14} /> Unlink Clearance (Start Fresh)
              </button>
            </div>
          )}

          {/* STEP 1: PROJECT TYPE */}
          {currentStep === 1 && (
            <div className="step-pane animate-fade-in-up">
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                  <span style={{
                    fontSize: "0.72rem",
                    fontWeight: "800",
                    color: "#ffffff",
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "1px solid rgba(255, 255, 255, 0.35)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    letterSpacing: "0.5px"
                  }}>
                    STEP 1 OF 5
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "rgba(255, 255, 255, 0.85)", fontWeight: "600" }}>
                    Municipal Project Matrix
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h2 style={{ fontSize: "1.65rem", fontWeight: "800", color: "#ffffff", margin: "0 0 0.35rem 0" }}>
                      Project Type
                    </h2>
                    <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.9)", fontSize: "0.92rem", lineHeight: "1.5" }}>
                      Select your specific project classification from the official Sto. Tomas 31-Project Type Matrix to determine required permits.
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setShowAllTemplatesModal(true)}
                      style={{
                        background: "#ffffff",
                        border: "1.5px solid rgba(255, 255, 255, 0.9)",
                        color: "#b45309",
                        padding: "8px 16px",
                        borderRadius: "12px",
                        fontSize: "0.82rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
                        transition: "all 0.15s ease"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
                    >
                      <Download size={14} color="#b45309" />
                      Official Templates (16 PDFs)
                    </button>
                  </div>
                </div>
              </div>

              {/* STATUS BAR / COUNTER & SCROLL HINT */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.65rem",
                padding: "0 4px",
                fontSize: "0.82rem",
                color: "rgba(255, 255, 255, 0.95)"
              }}>
                <span style={{ fontWeight: "600" }}>
                  Showing <strong style={{ color: "#ffffff" }}>{filteredProjectTypes.length}</strong> project types
                </span>
                <span style={{ fontSize: "0.74rem", display: "inline-flex", alignItems: "center", gap: "5px", color: "#ffffff", fontWeight: "700", background: "rgba(0, 0, 0, 0.15)", border: "1px solid rgba(255, 255, 255, 0.4)", padding: "3px 10px", borderRadius: "999px" }}>
                  <span>Scroll to browse</span>
                  <span style={{ fontSize: "0.85rem" }}>↕</span>
                </span>
              </div>

              {/* SELECTED PROJECT TYPE BANNER */}
              {selectedProjectType && (
                <div style={{
                  background: "#ffffff",
                  border: "1.5px solid #cbd5e1",
                  borderRadius: "10px",
                  padding: "8px 14px",
                  marginBottom: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={18} color="#dc2626" />
                    <span style={{ fontSize: "0.84rem", color: "#dc2626", fontWeight: "700" }}>
                      Selected: <strong style={{ color: "#b91c1c" }}>{selectedProjectType.name}</strong>
                    </span>
                    {selectedProjectType.matrix.zoningPermit !== 'not_required' ? (
                      <span style={{ fontSize: "0.72rem", background: "transparent", color: "#475569", border: "1px solid #cbd5e1", padding: "2px 8px", borderRadius: "999px", fontWeight: "700" }}>
                        Zoning Clearance Required
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.72rem", background: "transparent", color: "#64748b", border: "1px solid #cbd5e1", padding: "2px 8px", borderRadius: "999px", fontWeight: "700" }}>
                        Zoning Exempt
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: "600" }}>
                    Estimated Duration: <strong style={{ color: "#0f172a" }}>{selectedProjectType.estimatedDays}</strong>
                  </span>
                </div>
              )}

              {/* SEARCH BAR (UNDER SELECTED PROJECT TYPE) */}
              <div style={{ marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div style={{ position: "relative", maxWidth: "420px" }}>
                  <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="text"
                    placeholder="Search by project name (e.g. House, Warehouse, Clinic)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px 9px 38px",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.88rem",
                      background: "#ffffff",
                      color: "#0f172a",
                      outline: "none",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                    }}
                  />
                  {searchQuery && (
                    <button 
                      type="button" 
                      onClick={() => setSearchQuery("")}
                      style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1rem" }}
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>

              {/* 31 PROJECT TYPES VERTICAL RECTANGLE LIST */}
              <div 
                className="project-cards-container"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  padding: "4px 4px 14px 2px",
                  marginBottom: "1rem",
                  maxHeight: "clamp(380px, 60vh, 650px)",
                  overflowY: "auto",
                  overscrollBehavior: "contain"
                }}
              >
                {filteredProjectTypes.map((p) => {
                  const isSelected = selectedProjectType?.id === p.id;
                  const reqCount = getRequiredPermitForms(p).length;
                  const condCount = getConditionalPermitForms(p).length;
                  const theme = CATEGORY_THEMES[p.category] || CATEGORY_THEMES.Commercial;
                  const CatIcon = theme.icon;
                  const requiresClearance = p.matrix.zoningPermit !== 'not_required';

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProjectType(p)}
                      className="project-card-item"
                      style={{
                        border: isSelected ? "2px solid #dc2626" : "1.5px solid #e2e8f0",
                        background: isSelected ? "linear-gradient(135deg, #ffffff 0%, #fff5f5 100%)" : "#ffffff",
                        borderRadius: "12px",
                        padding: "0.9rem 1.15rem",
                        cursor: "pointer",
                        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                        boxShadow: isSelected 
                          ? "0 6px 18px rgba(220, 38, 38, 0.18), 0 0 0 1px #dc2626" 
                          : "0 1px 4px rgba(0,0,0,0.02)",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.45rem"
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "#dc2626";
                          e.currentTarget.style.outline = "2px solid #dc2626";
                          e.currentTarget.style.boxShadow = "0 8px 24px -4px rgba(220, 38, 38, 0.22)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "#e2e8f0";
                          e.currentTarget.style.outline = "none";
                          e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.02)";
                          e.currentTarget.style.transform = "none";
                        }
                      }}
                    >
                      {/* TOP ROW: CATEGORY + NAME & DURATION */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.7rem",
                            fontWeight: "700",
                            color: "#b45309",
                            background: "#fef3c7",
                            border: "1px solid #fde68a",
                            padding: "2px 8px",
                            borderRadius: "999px"
                          }}>
                            <CatIcon size={11} />
                            {p.category}
                          </span>

                          <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>
                            {p.name}
                          </h4>
                        </div>

                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.72rem",
                          color: "#64748b",
                          fontWeight: "600",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          padding: "2px 8px",
                          borderRadius: "6px"
                        }}>
                          <Clock size={11} /> {p.estimatedDays}
                        </span>
                      </div>

                      {/* MIDDLE: DESCRIPTION */}
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b", lineHeight: "1.4" }}>
                        {p.description}
                      </p>

                      {/* BOTTOM ROW: BADGES & ACTION BUTTONS */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginTop: "0.2rem" }}>
                        {/* BADGES (NO BACKGROUND / TRANSPARENT) */}
                        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center", fontSize: "0.7rem", fontWeight: "700" }}>
                          <span style={{ background: "transparent", color: "#334155", border: "1px solid #cbd5e1", padding: "2px 7px", borderRadius: "5px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            <Check size={11} strokeWidth={2.5} color="#059669" /> {reqCount} Mandatory
                          </span>
                          {condCount > 0 && (
                            <span style={{ background: "transparent", color: "#475569", border: "1px solid #cbd5e1", padding: "2px 7px", borderRadius: "5px" }}>
                              {condCount} Conditional
                            </span>
                          )}
                          {p.matrix.zoningPermit === 'required' ? (
                            <span style={{ background: "transparent", color: "#475569", border: "1px solid #cbd5e1", padding: "2px 7px", borderRadius: "5px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                              <ShieldCheck size={11} color="#d97706" /> LC Required
                            </span>
                          ) : p.matrix.zoningPermit === 'conditional' ? (
                            <span style={{ background: "transparent", color: "#475569", border: "1px solid #cbd5e1", padding: "2px 7px", borderRadius: "5px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                              <ShieldCheck size={11} color="#d97706" /> LC Conditional
                            </span>
                          ) : (
                            <span style={{ background: "transparent", color: "#64748b", border: "1px solid #cbd5e1", padding: "2px 7px", borderRadius: "5px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                              <CheckCircle size={11} color="#059669" /> LC Exempt
                            </span>
                          )}
                        </div>

                        {/* ACTION BUTTONS */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProjectType(p);
                              setShowRequirementsAlert(true);
                            }}
                            style={{
                              background: "#fef3c7",
                              border: "1px solid #fde68a",
                              color: "#b45309",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.72rem",
                              fontWeight: "700",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 9px",
                              transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#d97706"; e.currentTarget.style.color = "#ffffff"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "#fef3c7"; e.currentTarget.style.color = "#b45309"; }}
                            title="View Required Docs for this Project Type"
                          >
                            <Eye size={12} /> Required Docs
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProjectType(p);
                              const pRequiresClearance = p.matrix.zoningPermit !== 'not_required';
                              if (pRequiresClearance) {
                                goToStep(2);
                              } else {
                                goToStep(3);
                              }
                            }}
                            style={{
                              background: isSelected ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)" : "#ffffff",
                              border: isSelected ? "1.5px solid #dc2626" : "1.5px solid #cbd5e1",
                              color: isSelected ? "#ffffff" : "#1e293b",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.72rem",
                              fontWeight: "700",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "5px 12px",
                              boxShadow: isSelected ? "0 2px 8px rgba(220, 38, 38, 0.35)" : "none",
                              transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = "#dc2626";
                                e.currentTarget.style.color = "#dc2626";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = "#cbd5e1";
                                e.currentTarget.style.color = "#1e293b";
                              }
                            }}
                            title="Select this Project Type and proceed"
                          >
                            <span>{isSelected ? "Selected" : "Select"}</span>
                            <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: LOCATIONAL CLEARANCE */}
          {currentStep === 2 && (
            <div className="step-pane animate-fade-in-up">
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                  <span style={{
                    fontSize: "0.72rem",
                    fontWeight: "800",
                    color: "#ffffff",
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "1px solid rgba(255, 255, 255, 0.35)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    letterSpacing: "0.5px"
                  }}>
                    STEP 2 OF 5
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "rgba(255, 255, 255, 0.85)", fontWeight: "600" }}>
                    Prerequisite Verification
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h2 style={{ fontSize: "1.65rem", fontWeight: "800", color: "#ffffff", margin: "0 0 0.35rem 0" }}>
                      Locational Clearance
                    </h2>
                    <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.9)", fontSize: "0.92rem", lineHeight: "1.5" }}>
                      {isClearanceRequired ? (
                        <>
                          Under Sto. Tomas Municipal Permitting Matrix, permitting for <strong>{selectedProjectType?.name}</strong> requires an approved <strong>Locational Clearance</strong> confirming zoning classification before completing the required technical permit forms.
                        </>
                      ) : (
                        <>
                          Under Sto. Tomas Municipal Ordinance, <strong>{selectedProjectType?.name}</strong> is exempt from zoning and locational clearance requirements.
                        </>
                      )}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <a
                      href="/templates/LOCATIONAL-CLEARANCE-Sto-Tomas.pdf"
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: "#ffffff",
                        border: "1.5px solid rgba(255, 255, 255, 0.9)",
                        color: "#b45309",
                        padding: "8px 16px",
                        borderRadius: "12px",
                        fontSize: "0.82rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
                        textDecoration: "none",
                        transition: "all 0.15s ease"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
                    >
                      <Download size={14} color="#b45309" />
                      Official LC Template (PDF)
                    </a>
                  </div>
                </div>
              </div>

              {/* LOCKED WARNING NOTIFICATION */}
              {lockedNotice && (
                <div className="animate-fade-in-up" style={{
                  background: "#fffbeb",
                  border: "1.5px solid #fde68a",
                  borderRadius: "14px",
                  padding: "1rem 1.25rem",
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  color: "#92400e",
                  boxShadow: "0 4px 12px rgba(217, 119, 6, 0.08)"
                }}>
                  <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: "0.9rem", fontWeight: "600" }}>{lockedNotice}</span>
                  <button 
                    onClick={() => setLockedNotice(null)}
                    style={{ marginLeft: "auto", background: "none", border: "none", color: "#92400e", cursor: "pointer", fontWeight: "700", fontSize: "1.1rem" }}
                  >
                    &times;
                  </button>
                </div>
              )}

              {/* CASE 1: EXEMPT FROM CLEARANCE */}
              {!isClearanceRequired ? (
                <div style={{
                  background: "linear-gradient(135deg, rgba(239, 246, 255, 0.95) 0%, rgba(240, 253, 250, 0.9) 100%)",
                  border: "1.5px solid #93c5fd",
                  borderRadius: "18px",
                  padding: "1.75rem 2rem",
                  boxShadow: "0 4px 20px rgba(59, 130, 246, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1.5rem",
                  flexWrap: "wrap"
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", flex: 1, minWidth: "280px" }}>
                    <div style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "14px",
                      background: "#2563eb",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 6px 16px rgba(37, 99, 235, 0.25)"
                    }}>
                      <CheckCircle2 size={26} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
                        <h3 style={{ margin: 0, fontWeight: "800", color: "#1e3a8a", fontSize: "1.2rem" }}>
                          Locational Clearance Exempt
                        </h3>
                        <span style={{
                          background: "#dbeafe",
                          color: "#1e40af",
                          fontSize: "0.75rem",
                          fontWeight: "800",
                          padding: "2px 8px",
                          borderRadius: "999px"
                        }}>
                          PD 1096 Exemption
                        </span>
                      </div>
                      <p style={{ margin: 0, color: "#334155", fontSize: "0.92rem", lineHeight: "1.5" }}>
                        <strong>{selectedProjectType.name}</strong> ({selectedProjectType.category}) does not require zoning or locational clearance under the Santo Tomas permitting matrix. You can proceed directly to <strong>Step 3: Required Permit Forms</strong>.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    style={{
                      background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      padding: "11px 22px",
                      fontSize: "0.92rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)"
                    }}
                  >
                    <span>Proceed to Step 3: Required Permit Forms</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              ) : isClearanceApproved ? (
                /* CASE 2: CLEARANCE APPROVED BY ADMIN */
                <div style={{
                  background: "linear-gradient(135deg, rgba(236, 253, 245, 0.95) 0%, rgba(240, 253, 244, 0.9) 100%)",
                  border: "1.5px solid #86efac",
                  borderRadius: "18px",
                  padding: "1.5rem 1.75rem",
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1.25rem",
                  boxShadow: "0 10px 30px -5px rgba(34, 197, 94, 0.12), 0 0 0 1px rgba(134, 239, 172, 0.3) inset",
                  flexWrap: "wrap"
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", flex: 1, minWidth: "280px" }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 6px 16px rgba(16, 185, 129, 0.35)"
                    }}>
                      <ShieldCheck size={26} strokeWidth={2.2} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                        <span style={{ fontWeight: "800", color: "#065f46", fontSize: "1.1rem", letterSpacing: "-0.01em" }}>
                          Locational Clearance Approved by Admin
                        </span>
                        <div style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#ffffff",
                          border: "1px solid #a7f3d0",
                          color: "#047857",
                          padding: "3px 10px",
                          borderRadius: "999px",
                          fontSize: "0.8rem",
                          fontWeight: "700"
                        }}>
                          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981" }}></span>
                          Ref: {activeClearanceRef || "Approved"}
                          <button
                            type="button"
                            onClick={() => handleCopyRef(activeClearanceRef || "LC-APPROVED")}
                            title="Copy Clearance Reference ID"
                            style={{ display: "flex", alignItems: "center", color: "#059669", marginLeft: "2px", cursor: "pointer", background: "none", border: "none", padding: 0 }}
                          >
                            {copiedRef ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </div>
                      <p style={{ margin: 0, color: "#166534", fontSize: "0.9rem", lineHeight: "1.45" }}>
                        Your Locational Clearance for <strong>{selectedProjectType.name}</strong> has been officially approved by the Sto. Tomas Zoning Administrator / MPDO. You are cleared to proceed to <strong>Step 3: Required Permit Forms</strong>.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClearanceRef(null);
                        setLockedNotice(null);
                      }}
                      style={{
                        background: "#ffffff",
                        border: "1.5px solid #cbd5e1",
                        color: "#334155",
                        borderRadius: "10px",
                        padding: "10px 16px",
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <Plus size={15} color="#2563eb" />
                      <span>File New Clearance for this Project</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => goToStep(3)}
                      style={{
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        padding: "11px 22px",
                        fontSize: "0.9rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
                      }}
                    >
                      <span>Proceed to Step 3: Required Permit Forms</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ) : isClearancePending ? (
                /* CASE 3: CLEARANCE FILED BUT PENDING ADMIN APPROVAL */
                <div style={{
                  background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                  border: "2px solid #f59e0b",
                  borderRadius: "20px",
                  padding: "2rem",
                  marginBottom: "1.75rem",
                  boxShadow: "0 10px 25px -5px rgba(245, 158, 11, 0.15)"
                }}>
                  {/* Status Banner */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "16px",
                        background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 8px 18px rgba(217, 119, 6, 0.35)",
                        flexShrink: 0
                      }}>
                        <Clock size={28} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{
                            background: "#d97706",
                            color: "white",
                            fontSize: "0.72rem",
                            fontWeight: "800",
                            padding: "3px 10px",
                            borderRadius: "6px",
                            letterSpacing: "0.5px"
                          }}>
                            AWAITING ADMIN APPROVAL
                          </span>
                          <span style={{ fontSize: "0.82rem", color: "#92400e", fontWeight: "700" }}>
                            Ref: {matchedClearanceApp?.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyRef(matchedClearanceApp?.id || "")}
                            title="Copy Reference"
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#b45309", padding: 0 }}
                          >
                            {copiedRef ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                          </button>
                        </div>
                        <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "900", color: "#78350f" }}>
                          Locational Clearance Under Review
                        </h3>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={handleCheckClearanceStatus}
                        disabled={isCheckingClearance}
                        style={{
                          background: "#ffffff",
                          border: "1.5px solid #fde68a",
                          color: "#92400e",
                          padding: "8px 16px",
                          borderRadius: "10px",
                          fontWeight: "700",
                          fontSize: "0.85rem",
                          cursor: isCheckingClearance ? "wait" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 2px 6px rgba(217, 119, 6, 0.1)"
                        }}
                      >
                        <RefreshCw size={14} className={isCheckingClearance ? "animate-spin" : ""} />
                        <span>{isCheckingClearance ? "Checking..." : "Check Status"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Explanation Callout */}
                  <div style={{
                    background: "rgba(255, 255, 255, 0.75)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid #fde68a",
                    borderRadius: "14px",
                    padding: "1.25rem 1.5rem",
                    marginBottom: "1.5rem"
                  }}>
                    <p style={{ margin: "0 0 0.75rem 0", color: "#78350f", fontSize: "0.95rem", lineHeight: "1.6", fontWeight: "600" }}>
                      Your <strong>Application for Locational Clearance</strong> for <strong>{selectedProjectType.name}</strong> was submitted on <strong>{matchedClearanceApp?.dateSubmitted || "recently"}</strong> and is currently being evaluated by the <strong>Sto. Tomas MPDO & Zoning Administrator</strong>.
                    </p>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", background: "#fef3c7", padding: "12px 14px", borderRadius: "10px", border: "1px solid #fde68a" }}>
                      <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <div style={{ fontSize: "0.85rem", color: "#92400e", lineHeight: "1.5" }}>
                        <strong>Zoning Approval is Mandatory Prior to Other Forms:</strong> Under the National Building Code (PD 1096) and Sto. Tomas Municipal Permitting Code, the building official cannot process subsequent technical permit forms without an approved Locational Clearance. <strong>Step 3: Required Permit Forms</strong> will unlock automatically once the administrator approves your clearance.
                      </div>
                    </div>
                  </div>

                  {/* 3-Stage Progress Indicator */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1rem",
                    marginBottom: "1.5rem"
                  }}>
                    <div style={{ background: "#ffffff", padding: "1rem", borderRadius: "12px", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: "10px" }}>
                      <CheckCircle2 size={22} color="#16a34a" />
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: "800", textTransform: "uppercase" }}>Stage 1</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: "700", color: "#0f172a" }}>Clearance Filed</div>
                      </div>
                    </div>

                    <div style={{ background: "#ffffff", padding: "1rem", borderRadius: "12px", border: "2px solid #f59e0b", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 4px 12px rgba(245, 158, 11, 0.15)" }}>
                      <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#fef3c7", border: "2px solid #f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#d97706" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "#b45309", fontWeight: "800", textTransform: "uppercase" }}>Stage 2 (Current)</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "#b45309" }}>Admin Review & Approval</div>
                      </div>
                    </div>

                    <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "10px", opacity: 0.7 }}>
                      <Lock size={20} color="#94a3b8" />
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "800", textTransform: "uppercase" }}>Stage 3</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: "700", color: "#64748b" }}>Permit Forms Unlocked</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", borderTop: "1px solid #fde68a", paddingTop: "1.25rem" }}>
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                      <a
                        href={`/applicant/track/${matchedClearanceApp?.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: "#ffffff",
                          border: "1px solid #fde68a",
                          color: "#92400e",
                          padding: "9px 16px",
                          borderRadius: "10px",
                          fontSize: "0.85rem",
                          fontWeight: "700",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        <Eye size={15} /> Track Application
                      </a>

                      <button
                        type="button"
                        onClick={() => setShowGoogleForm(true)}
                        style={{
                          background: "transparent",
                          border: "1px solid #cbd5e1",
                          color: "#64748b",
                          padding: "9px 16px",
                          borderRadius: "10px",
                          fontSize: "0.85rem",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        Re-file / Submit Revision
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled
                      style={{
                        background: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        padding: "11px 22px",
                        fontSize: "0.9rem",
                        fontWeight: "700",
                        cursor: "not-allowed",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        opacity: 0.8
                      }}
                      title="You must wait for the admin to approve this Locational Clearance before proceeding to the other forms"
                    >
                      <Lock size={16} />
                      <span>Locked: Awaiting Admin Approval</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* CASE 4: CLEARANCE REQUIRED BUT NOT YET COMPLETED - STEP 1 MATCHING RECTANGLE CARD */
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div
                    className="project-card-item"
                    style={{
                      border: "1.5px solid #e2e8f0",
                      background: "#ffffff",
                      borderRadius: "12px",
                      padding: "0.9rem 1.15rem",
                      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.45rem"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#dc2626";
                      e.currentTarget.style.outline = "2px solid #dc2626";
                      e.currentTarget.style.boxShadow = "0 8px 24px -4px rgba(220, 38, 38, 0.22)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.outline = "none";
                      e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.02)";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    {/* TOP ROW: CATEGORY + NAME & DURATION */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.7rem",
                          fontWeight: "700",
                          color: "#b45309",
                          background: "#fef3c7",
                          border: "1px solid #fde68a",
                          padding: "2px 8px",
                          borderRadius: "999px"
                        }}>
                          <MapPin size={11} />
                          Zoning & Land Use
                        </span>

                        <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>
                          Application for Locational Clearance
                        </h4>
                      </div>

                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.72rem",
                        color: "#64748b",
                        fontWeight: "600",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        padding: "2px 8px",
                        borderRadius: "6px"
                      }}>
                        <Clock size={11} /> 5 – 7 days
                      </span>
                    </div>

                    {/* MIDDLE: DESCRIPTION */}
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b", lineHeight: "1.4" }}>
                      Official Sto. Tomas MPDO zoning verification and land development approval for <strong>{selectedProjectType?.name}</strong>. Completing this form fulfills the mandatory Stage 1 prerequisite for municipal permit processing.
                    </p>

                    {/* BOTTOM ROW: BADGES & ACTION BUTTONS */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginTop: "0.2rem" }}>
                      {/* BADGES (NO BACKGROUND / TRANSPARENT) */}
                      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center", fontSize: "0.7rem", fontWeight: "700" }}>
                        <span style={{ background: "transparent", color: "#334155", border: "1px solid #cbd5e1", padding: "2px 7px", borderRadius: "5px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                          <Check size={11} strokeWidth={2.5} color="#059669" /> 4 Required Attachments
                        </span>
                        <span style={{ background: "transparent", color: "#475569", border: "1px solid #cbd5e1", padding: "2px 7px", borderRadius: "5px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                          <ShieldCheck size={11} color="#d97706" /> Mandatory Stage 1
                        </span>
                        <span style={{ background: "transparent", color: "#64748b", border: "1px solid #cbd5e1", padding: "2px 7px", borderRadius: "5px" }}>
                          Sto. Tomas MPDO
                        </span>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <a
                          href="/templates/LOCATIONAL-CLEARANCE-Sto-Tomas.pdf"
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            background: "#fef3c7",
                            border: "1px solid #fde68a",
                            color: "#b45309",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.72rem",
                            fontWeight: "700",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 9px",
                            textDecoration: "none",
                            transition: "all 0.15s ease"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#d97706"; e.currentTarget.style.color = "#ffffff"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "#fef3c7"; e.currentTarget.style.color = "#b45309"; }}
                          title="Download Official Locational Clearance PDF Form"
                        >
                          <Download size={12} /> Download PDF
                        </a>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowGoogleForm(true);
                          }}
                          style={{
                            background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                            border: "1.5px solid #dc2626",
                            color: "#ffffff",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.72rem",
                            fontWeight: "700",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "5px 12px",
                            boxShadow: "0 2px 8px rgba(220, 38, 38, 0.35)",
                            transition: "all 0.15s ease"
                          }}
                          title="Fill Locational Clearance Form Online"
                        >
                          <FileText size={12} />
                          <span>Fill Form Online</span>
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: REQUIRED PERMIT FORMS */}
          {currentStep === 3 && (
            <div className="step-pane animate-fade-in-up">
              <TechnicalPermitFormsStep
                projectType={selectedProjectType}
                locationalClearanceRef={activeClearanceRef}
                clearanceApp={matchedClearanceApp}
                isClearanceRequired={isClearanceRequired}
                applicantName={applicantName}
                projectName={projectName}
                setProjectName={setProjectName}
                streetAddress={streetAddress}
                setStreetAddress={setStreetAddress}
                barangay={barangay}
                setBarangay={setBarangay}
                lotArea={lotArea}
                setLotArea={setLotArea}
                floorArea={floorArea}
                setFloorArea={setFloorArea}
                projectCost={projectCost}
                setProjectCost={setProjectCost}
                uploadedPermitDocs={uploadedPermitDocs}
                setUploadedPermitDocs={setUploadedPermitDocs}
                onProceedToMapping={() => goToStep(4)}
                onBack={() => goToStep(2)}
              />
            </div>
          )}

          {/* STEP 4: MAPPING */}
          {currentStep === 4 && (
            <div className="step-pane animate-fade-in-up">
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                  <span style={{
                    fontSize: "0.72rem",
                    fontWeight: "800",
                    color: "#4338ca",
                    background: "#e0e7ff",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    letterSpacing: "0.5px"
                  }}>
                    STEP 4 OF 5
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "600" }}>
                    Site & Cadastral Mapping
                  </span>
                </div>
                <h2 style={{ fontSize: "1.65rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.35rem 0" }}>
                  Mapping
                </h2>
                <p style={{ margin: 0, color: "#475569", fontSize: "0.92rem", lineHeight: "1.5" }}>
                  Pinpoint your project location in Sto. Tomas, Pampanga to determine cadastral boundaries, coordinates, and zoning compliance.
                </p>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "2rem", marginTop: "1rem" }}>
                {/* Left Column: Basic Details & Location Picker Map */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div className="form-group">
                    <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.5rem", display: "block" }}>Project Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 2-Storey Residential House" 
                      className="form-input" 
                      value={projectName}
                      onChange={e => setProjectName(e.target.value)}
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  
                  <div>
                    <LocationPickerMap 
                      onLocationChange={async (lat, lng, zone) => {
                        setLatitude(lat.toFixed(6));
                        setLongitude(lng.toFixed(6));
                        
                        if (zone) {
                          setDetectedZone(zone);
                          if (zone.barangay) {
                            setBarangay(zone.barangay);
                          }
                        }
                        
                        try {
                          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                          const data = await res.json();
                          if (data && data.address) {
                            const road = data.address.road || data.address.pedestrian || "";
                            const neighborhood = data.address.neighbourhood || data.address.suburb || "";
                            if (road || neighborhood) {
                              setStreetAddress(prev => prev.trim() === "" ? [road, neighborhood].filter(Boolean).join(", ") : prev);
                            }
                          }
                        } catch (err) {
                          console.error("Reverse geocoding error:", err);
                        }
                      }}
                    />
                  </div>

                  {detectedZone && (
                    <div className="animate-fade-in-up" style={{ padding: "1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", display: "flex", gap: "1rem", alignItems: "center" }}>
                      <ShieldCheck size={28} color="#16a34a" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "0.75rem", background: "#dcfce7", color: "#166534", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                            {detectedZone.code || "ZONE"}
                          </span>
                          <span style={{ fontWeight: "700", color: "#166534", fontSize: "0.95rem" }}>
                            {detectedZone.name}
                          </span>
                        </div>
                        <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#15803d" }}>
                          {detectedZone.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Site & Project Parameters */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", background: "#f8fafc", padding: "1.5rem", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "1.05rem", fontWeight: "800", color: "#0f172a" }}>
                    Site & Dimension Details
                  </h4>
                  
                  <div className="form-group">
                    <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.4rem", display: "block", fontSize: "0.88rem" }}>Street Address / Sitio</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Purok 3, Poblacion Road" 
                      className="form-input" 
                      value={streetAddress}
                      onChange={e => setStreetAddress(e.target.value)}
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#ffffff" }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.4rem", display: "block", fontSize: "0.88rem" }}>Barangay (Santo Tomas)</label>
                    <select
                      className="form-input"
                      value={barangay}
                      onChange={e => setBarangay(e.target.value)}
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#ffffff" }}
                    >
                      {["San Bartolome", "Moras Dela Paz", "Poblacion", "San Matias", "San Vicente", "Santa Cruz", "Santa Ines", "Santo Nino"].map(b => (
                        <option key={b} value={b}>Brgy. {b}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group">
                      <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.4rem", display: "block", fontSize: "0.88rem" }}>Lot Area (sq.m)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 150" 
                        className="form-input" 
                        value={lotArea}
                        onChange={e => setLotArea(e.target.value)}
                        style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#ffffff" }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.4rem", display: "block", fontSize: "0.88rem" }}>Floor Area (sq.m)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 120" 
                        className="form-input" 
                        value={floorArea}
                        onChange={e => setFloorArea(e.target.value)}
                        style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#ffffff" }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.4rem", display: "block", fontSize: "0.88rem" }}>Estimated Project Cost (₱ PHP)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 1500000" 
                      className="form-input" 
                      value={projectCost}
                      onChange={e => setProjectCost(e.target.value)}
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#ffffff" }}
                    />
                  </div>

                  <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "#eef2ff", borderRadius: "10px", border: "1px solid #c7d2fe", display: "flex", gap: "8px", alignItems: "center" }}>
                    <Sparkles size={16} color="#4f46e5" />
                    <span style={{ fontSize: "0.8rem", color: "#3730a3" }}>
                      Data synced automatically with your technical permit documents and municipal records.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW */}
          {currentStep === 5 && (
            <div className="step-pane animate-fade-in-up">
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                  <span style={{
                    fontSize: "0.72rem",
                    fontWeight: "800",
                    color: "#4338ca",
                    background: "#e0e7ff",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    letterSpacing: "0.5px"
                  }}>
                    STEP 5 OF 5
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "600" }}>
                    Final Verification & Filing
                  </span>
                </div>
                <h2 style={{ fontSize: "1.65rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.35rem 0" }}>
                  Review
                </h2>
                <p style={{ margin: 0, color: "#475569", fontSize: "0.92rem", lineHeight: "1.5" }}>
                  Review your application details, selected municipal project type, required permit forms, and site mapping before filing endorsement.
                </p>
              </div>

              <div className="review-summary" style={{ background: "#ffffff", padding: "2rem", borderRadius: "18px", border: "1.5px solid #e2e8f0", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
                  {/* Step 1 Summary Card: Project Type */}
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "14px", padding: "1.1rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "#1e40af", textTransform: "uppercase" }}>1. Project Type</span>
                    <h4 style={{ margin: "0.4rem 0 0.2rem 0", fontSize: "1.05rem", fontWeight: "800", color: "#0f172a" }}>{selectedProjectType?.name}</h4>
                    <span style={{ fontSize: "0.84rem", color: "#2563eb", fontWeight: "600" }}>
                      {selectedProjectType?.category} • {getRequiredPermitForms(selectedProjectType).length} Mandatory Forms
                    </span>
                  </div>

                  {/* Step 2 Summary Card: Locational Clearance */}
                  <div style={{ background: isClearancePassed ? "#f0fdf4" : "#fffbeb", border: isClearancePassed ? "1px solid #bbf7d0" : "1px solid #fde68a", borderRadius: "14px", padding: "1.1rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: "800", color: isClearancePassed ? "#166534" : "#92400e", textTransform: "uppercase" }}>2. Locational Clearance</span>
                    <h4 style={{ margin: "0.4rem 0 0.2rem 0", fontSize: "1.05rem", fontWeight: "800", color: "#0f172a" }}>
                      {!isClearanceRequired ? "Zoning Exempt" : "Locational Clearance"}
                    </h4>
                    <span style={{ fontSize: "0.84rem", color: isClearancePassed ? "#15803d" : "#b45309", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle2 size={15} color={isClearancePassed ? "#16a34a" : "#d97706"} />
                      {!isClearanceRequired ? "Exempt / Not Required" : (isClearancePassed ? `Passed (${activeClearanceRef || "LC-VERIFIED"})` : "Verification Pending")}
                    </span>
                  </div>

                  {/* Step 3 Summary Card: Required Permit Forms */}
                  <div style={{ background: isAllMandatoryAttached ? "#f0fdf4" : "#fef2f2", border: isAllMandatoryAttached ? "1px solid #bbf7d0" : "1px solid #fecaca", borderRadius: "14px", padding: "1.1rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: "800", color: isAllMandatoryAttached ? "#166534" : "#991b1b", textTransform: "uppercase" }}>3. Permit Forms</span>
                    <h4 style={{ margin: "0.4rem 0 0.2rem 0", fontSize: "1.05rem", fontWeight: "800", color: "#0f172a" }}>
                      {mandatoryPermitsToSubmit.length} Required Forms
                    </h4>
                    <span style={{ fontSize: "0.84rem", color: isAllMandatoryAttached ? "#15803d" : "#dc2626", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle2 size={15} color={isAllMandatoryAttached ? "#16a34a" : "#dc2626"} />
                      {isAllMandatoryAttached ? "All Forms Compiled & Signed" : `${missingMandatoryPermits.length} Form(s) Pending`}
                    </span>
                  </div>

                  {/* Step 4 Summary Card: Mapping */}
                  <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "14px", padding: "1.1rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>4. Mapping</span>
                    <h4 style={{ margin: "0.4rem 0 0.2rem 0", fontSize: "1.05rem", fontWeight: "800", color: "#0f172a" }}>{projectName || "Untitled Project"}</h4>
                    <span style={{ fontSize: "0.84rem", color: "#64748b" }}>
                      {streetAddress || "Sto. Tomas"}, Brgy. {barangay}
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                    <span style={{ color: "#64748b", fontWeight: "600" }}>Coordinates:</span>
                    <span style={{ color: "#0f172a", fontWeight: "700" }}>{latitude ? `${latitude}, ${longitude}` : "Sto. Tomas GIS Centroid"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                    <span style={{ color: "#64748b", fontWeight: "600" }}>Zoning Classification:</span>
                    <span style={{ color: "#0f172a", fontWeight: "700" }}>{detectedZone?.name || "R-1 (Low-Density Residential)"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                    <span style={{ color: "#64748b", fontWeight: "600" }}>Total Lot / Floor Area:</span>
                    <span style={{ color: "#0f172a", fontWeight: "700" }}>{lotArea || 0} sq.m / {floorArea || 0} sq.m</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                    <span style={{ color: "#64748b", fontWeight: "600" }}>Estimated Project Cost:</span>
                    <span style={{ color: "#16a34a", fontWeight: "800" }}>₱{Number(projectCost || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* SECTION: MANDATORY TECHNICAL ENGINEERING PERMITS & DOCUMENT UPLOADS */}
              <div 
                id="mandatory-requirements-section"
                style={{
                  marginTop: "1.75rem",
                  background: "#ffffff",
                  padding: "2rem",
                  borderRadius: "18px",
                  border: isAllMandatoryAttached ? "1.5px solid #86efac" : "1.5px solid #cbd5e1",
                  boxShadow: isAllMandatoryAttached 
                    ? "0 10px 30px -5px rgba(34, 197, 94, 0.12), 0 0 0 1px rgba(134, 239, 172, 0.3) inset" 
                    : "0 4px 20px rgba(0,0,0,0.04)",
                  transition: "all 0.3s ease"
                }}
              >
                {/* Section Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: "14px",
                      background: isAllMandatoryAttached ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: isAllMandatoryAttached ? "0 4px 12px rgba(16, 185, 129, 0.3)" : "0 4px 12px rgba(79, 70, 229, 0.25)"
                    }}>
                      <FileCheck size={24} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                        <span style={{
                          background: isAllMandatoryAttached ? "#dcfce7" : "#e0e7ff",
                          color: isAllMandatoryAttached ? "#166534" : "#4338ca",
                          fontSize: "0.72rem",
                          fontWeight: "800",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          letterSpacing: "0.5px"
                        }}>
                          STAGE 2 TECHNICAL PERMIT REQUIREMENTS
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "600" }}>
                          Sto. Tomas Permitting Code (PD 1096)
                        </span>
                      </div>
                      <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: "800", color: "#0f172a" }}>
                        Mandatory Technical Permits for {selectedProjectType.name}
                      </h3>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      fontSize: "0.8rem",
                      fontWeight: "800",
                      padding: "5px 12px",
                      borderRadius: "999px",
                      background: isAllMandatoryAttached ? "#dcfce7" : "#fef3c7",
                      color: isAllMandatoryAttached ? "#15803d" : "#b45309",
                      border: isAllMandatoryAttached ? "1px solid #86efac" : "1px solid #fde68a",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      {isAllMandatoryAttached ? (
                        <>
                          <Check size={14} strokeWidth={3} />
                          All Mandatory Attached ({mandatoryPermitsToSubmit.length}/{mandatoryPermitsToSubmit.length})
                        </>
                      ) : (
                        <>
                          <AlertCircle size={14} />
                          {missingMandatoryPermits.length} Mandatory Pending Upload
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <p style={{ margin: "0 0 1.25rem 0", color: "#475569", fontSize: "0.9rem", lineHeight: "1.5" }}>
                  Under the Santo Tomas Municipal Permitting Matrix and the National Building Code of the Philippines (PD 1096), projects under <strong>{selectedProjectType.name}</strong> require submitting the technical engineering permits below before an official permit can be issued.
                </p>

                {/* Submission Error Banner */}
                {submissionErrorAlert && (
                  <div className="animate-fade-in-up" style={{
                    background: "#fef2f2",
                    border: "1.5px solid #f87171",
                    borderRadius: "12px",
                    padding: "1rem 1.25rem",
                    marginBottom: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: "#991b1b"
                  }}>
                    <AlertTriangle size={22} color="#dc2626" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: "0.88rem", fontWeight: "600", lineHeight: "1.4" }}>
                      {submissionErrorAlert}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubmissionErrorAlert(null)}
                      style={{ marginLeft: "auto", background: "none", border: "none", color: "#991b1b", cursor: "pointer", fontSize: "1.1rem" }}
                    >
                      &times;
                    </button>
                  </div>
                )}

                {/* Status Callout Banner */}
                {!isAllMandatoryAttached ? (
                  <div style={{
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: "12px",
                    padding: "0.9rem 1.1rem",
                    marginBottom: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "0.75rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: "0.86rem", color: "#92400e", fontWeight: "600" }}>
                        Submission locked: You must attach the <strong>{missingMandatoryPermits.map(k => PERMIT_FORM_METADATA[k]?.label || k).join(", ")}</strong> below before your application can be filed.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowUnifiedForm(true)}
                      style={{
                        background: "#4f46e5",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        padding: "6px 12px",
                        fontSize: "0.78rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        boxShadow: "0 2px 6px rgba(79, 70, 229, 0.2)"
                      }}
                    >
                      <Sparkles size={13} /> Or Auto-Fill Online
                    </button>
                  </div>
                ) : (
                  <div style={{
                    background: "#f0fdf4",
                    border: "1px solid #86efac",
                    borderRadius: "12px",
                    padding: "0.9rem 1.1rem",
                    marginBottom: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: "0.86rem", color: "#166534", fontWeight: "700" }}>
                      All mandatory engineering attachments verified! You may now submit your application package to the Building Official.
                    </span>
                  </div>
                )}

                {/* MANDATORY PERMITS LIST */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                  {mandatoryPermitsToSubmit.map((key) => {
                    const meta = PERMIT_FORM_METADATA[key];
                    const doc = uploadedPermitDocs[key];
                    const templatePath = getPermitFormTemplate(key, selectedProjectType);
                    const Icon = PERMIT_ICONS[key] || FileText;
                    const isUploading = activeUploadingKey === key;

                    // Specialized engineering requirement notice
                    let signeeNotice = "Must be prepared, signed, and sealed by a registered PRC professional.";
                    if (key === "electricalPermit") {
                      signeeNotice = "Requires sign-off by a licensed Professional Electrical Engineer (PEE) with electrical layout & load computations.";
                    } else if (key === "mechanicalPermit") {
                      signeeNotice = "Requires sign-off by a licensed Professional Mechanical Engineer (PME) with machinery plans & equipment details.";
                    } else if (key === "civilStructuralPermit") {
                      signeeNotice = "Requires sign-off by a licensed Civil/Structural Engineer with structural design calculations.";
                    } else if (key === "architecturalPermit") {
                      signeeNotice = "Requires sign-off by a licensed Registered Architect with complete architectural plans.";
                    } else if (key === "sanitaryPermit") {
                      signeeNotice = "Requires sign-off by a licensed Master Plumber or Sanitary Engineer with plumbing layout.";
                    } else if (key === "electronicsPermit") {
                      signeeNotice = "Requires sign-off by a licensed Professional Electronics Engineer (PECE).";
                    } else if (key === "fireBfpPermit") {
                      signeeNotice = "Requires Fire Safety Evaluation Clearance (FSEC) application compliant with RA 9514.";
                    }

                    return (
                      <div 
                        key={key} 
                        style={{
                          background: doc ? "#f0fdf4" : "#f8fafc",
                          border: doc ? "1.5px solid #86efac" : "1.5px solid #e2e8f0",
                          borderRadius: "14px",
                          padding: "1.1rem 1.25rem",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "1rem",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", flex: 1, minWidth: "280px" }}>
                          <div style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "10px",
                            background: doc ? "#dcfce7" : "#eff6ff",
                            color: doc ? "#15803d" : "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: "2px"
                          }}>
                            <Icon size={22} />
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "3px" }}>
                              <span style={{
                                background: "#1e3a8a",
                                color: "white",
                                fontSize: "0.68rem",
                                fontWeight: "800",
                                padding: "2px 7px",
                                borderRadius: "4px"
                              }}>
                                {meta.code}
                              </span>
                              <strong style={{ fontSize: "1rem", color: "#0f172a" }}>
                                {meta.label}
                              </strong>
                              <span style={{
                                fontSize: "0.68rem",
                                fontWeight: "800",
                                padding: "2px 8px",
                                borderRadius: "999px",
                                background: doc ? "#dcfce7" : "#fee2e2",
                                color: doc ? "#166534" : "#991b1b",
                                border: doc ? "1px solid #bbf7d0" : "1px solid #fecaca"
                              }}>
                                {doc ? "ATTACHED" : "MANDATORY"}
                              </span>
                            </div>
                            <p style={{ margin: "0 0 4px 0", fontSize: "0.82rem", color: "#475569" }}>
                              {meta.desc}
                            </p>
                            <p style={{ margin: 0, fontSize: "0.76rem", color: "#64748b", fontStyle: "italic" }}>
                              {signeeNotice}
                            </p>
                          </div>
                        </div>

                        {/* Right: Upload controls and template */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          {templatePath && (
                            <a
                              href={templatePath}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "7px 12px",
                                borderRadius: "8px",
                                background: "#ffffff",
                                border: "1px solid #cbd5e1",
                                color: "#334155",
                                fontSize: "0.78rem",
                                fontWeight: "700",
                                textDecoration: "none",
                                transition: "all 0.15s ease"
                              }}
                              title={`Download official ${meta.label} municipal PDF`}
                            >
                              <Download size={13} color="#4f46e5" />
                              <span>Template (PDF)</span>
                            </a>
                          )}

                          {doc ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <div style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "#ffffff",
                                border: "1px solid #86efac",
                                color: "#166534",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "0.8rem",
                                fontWeight: "600",
                                maxWidth: "220px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                              }}>
                                <CheckCircle2 size={15} color="#16a34a" />
                                <span title={doc.fileName} style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {doc.fileName}
                                </span>
                                <span style={{ color: "#64748b", fontSize: "0.72rem" }}>
                                  ({doc.fileSize})
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemovePermitDoc(key)}
                                style={{
                                  background: "#fee2e2",
                                  border: "1px solid #fca5a5",
                                  color: "#dc2626",
                                  borderRadius: "8px",
                                  padding: "7px 10px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontSize: "0.75rem",
                                  fontWeight: "700"
                                }}
                                title="Remove this attachment"
                              >
                                <Trash2 size={13} /> Remove
                              </button>
                            </div>
                          ) : (
                            <label style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "8px 14px",
                              borderRadius: "8px",
                              background: isUploading ? "#94a3b8" : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                              color: "white",
                              fontSize: "0.8rem",
                              fontWeight: "700",
                              cursor: isUploading ? "wait" : "pointer",
                              boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
                              transition: "all 0.15s ease"
                            }}>
                              <Upload size={14} />
                              <span>{isUploading ? "Uploading..." : `Attach ${meta.code} File`}</span>
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                disabled={isUploading}
                                onChange={(e) => handlePermitDocUpload(key, e)}
                                style={{ display: "none" }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CONDITIONAL PERMITS ACCORDION */}
                {conditionalPermitsToSubmit.length > 0 && (
                  <div style={{ marginTop: "1.25rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "600" }}>
                        Specialized / Scope-Dependent Permits ({conditionalPermitsToSubmit.length} Conditional for {selectedProjectType.name})
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowConditionalSection(!showConditionalSection)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#4f46e5",
                          fontWeight: "700",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        {showConditionalSection ? "Hide Conditional Permits ▲" : "Show Conditional Permits ▼"}
                      </button>
                    </div>

                    {showConditionalSection && (
                      <div className="animate-fade-in-up" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.85rem" }}>
                        {conditionalPermitsToSubmit.map((key) => {
                          const meta = PERMIT_FORM_METADATA[key];
                          const doc = uploadedPermitDocs[key];
                          const templatePath = getPermitFormTemplate(key, selectedProjectType);
                          const Icon = PERMIT_ICONS[key] || FileText;
                          const isUploading = activeUploadingKey === key;

                          return (
                            <div
                              key={key}
                              style={{
                                background: doc ? "#f0fdf4" : "#fffdfa",
                                border: doc ? "1px solid #86efac" : "1px dashed #cbd5e1",
                                borderRadius: "12px",
                                padding: "0.85rem 1rem",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "0.75rem"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "#fef3c7", color: "#b45309", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Icon size={18} />
                                </div>
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ fontSize: "0.65rem", fontWeight: "800", background: "#b45309", color: "white", padding: "1px 5px", borderRadius: "4px" }}>
                                      {meta.code}
                                    </span>
                                    <strong style={{ fontSize: "0.9rem", color: "#0f172a" }}>{meta.label}</strong>
                                    <span style={{ fontSize: "0.68rem", color: "#b45309", background: "#fef3c7", padding: "1px 6px", borderRadius: "999px", fontWeight: "700" }}>
                                      CONDITIONAL
                                    </span>
                                  </div>
                                  <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                                    {meta.desc}
                                  </p>
                                </div>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                {templatePath && (
                                  <a
                                    href={templatePath}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontSize: "0.75rem",
                                      fontWeight: "700",
                                      padding: "5px 10px",
                                      borderRadius: "6px",
                                      background: "#f8fafc",
                                      border: "1px solid #cbd5e1",
                                      color: "#475569",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      textDecoration: "none"
                                    }}
                                  >
                                    <Download size={12} /> Template
                                  </a>
                                )}

                                {doc ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                    <span style={{ fontSize: "0.75rem", color: "#166534", fontWeight: "700" }}>✓ Attached</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePermitDoc(key)}
                                      style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.75rem", fontWeight: "700" }}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <label style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    background: "#f1f5f9",
                                    border: "1px solid #cbd5e1",
                                    color: "#334155",
                                    fontSize: "0.75rem",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                  }}>
                                    <Upload size={12} />
                                    <span>Attach (Optional)</span>
                                    <input
                                      type="file"
                                      accept=".pdf,.png,.jpg,.jpeg"
                                      disabled={isUploading}
                                      onChange={(e) => handlePermitDocUpload(key, e)}
                                      style={{ display: "none" }}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WIZARD ACTIONS BAR */}
          <div className="wizard-actions">
            {currentStep > 1 && (
              <button 
                className="btn-outline" 
                onClick={() => goToStep(currentStep - 1)} 
                disabled={uploading}
                title="Previous Step"
              >
                <ChevronLeft size={18} /> Back
              </button>
            )}
            
            <div className="flex-spacer"></div>

            {currentStep === 1 ? (
              isClearanceRequired && !isClearancePassed ? (
                <button 
                  className="btn-primary btn-wizard-next" 
                  onClick={() => goToStep(2)}
                  style={{ 
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", 
                    color: "#ffffff",
                    border: "1.5px solid transparent",
                    boxShadow: "0 4px 14px rgba(217, 119, 6, 0.3)", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px", 
                    padding: "10px 22px", 
                    borderRadius: "10px",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.color = "#d97706";
                    e.currentTarget.style.borderColor = "#ffffff";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
                    e.currentTarget.style.color = "#ffffff";
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(217, 119, 6, 0.3)";
                  }}
                >
                  <span>Next: Locational Clearance</span>
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button 
                  className="btn-primary btn-wizard-next" 
                  onClick={() => goToStep(3)}
                  style={{ 
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", 
                    color: "#ffffff",
                    border: "1.5px solid transparent",
                    boxShadow: "0 4px 14px rgba(217, 119, 6, 0.3)", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px", 
                    padding: "10px 22px", 
                    borderRadius: "10px",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.color = "#d97706";
                    e.currentTarget.style.borderColor = "#ffffff";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
                    e.currentTarget.style.color = "#ffffff";
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(217, 119, 6, 0.3)";
                  }}
                >
                  <span>Next: Required Permit Forms</span>
                  <ChevronRight size={18} />
                </button>
              )
            ) : currentStep === 2 ? (
              isClearancePassed ? (
                <button 
                  className="btn-primary btn-wizard-next" 
                  onClick={() => goToStep(3)}
                  style={{ 
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", 
                    color: "#ffffff",
                    border: "1.5px solid transparent",
                    boxShadow: "0 4px 14px rgba(217, 119, 6, 0.3)", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px", 
                    padding: "10px 22px", 
                    borderRadius: "10px",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.color = "#d97706";
                    e.currentTarget.style.borderColor = "#ffffff";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
                    e.currentTarget.style.color = "#ffffff";
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(217, 119, 6, 0.3)";
                  }}
                >
                  <span>Next: Required Permit Forms</span>
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button 
                  className="btn-primary btn-wizard-next" 
                  onClick={() => setShowGoogleForm(true)} 
                  style={{ 
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", 
                    color: "#ffffff",
                    border: "1.5px solid transparent",
                    boxShadow: "0 4px 14px rgba(217, 119, 6, 0.3)", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px", 
                    padding: "10px 22px", 
                    borderRadius: "10px",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.color = "#d97706";
                    e.currentTarget.style.borderColor = "#ffffff";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
                    e.currentTarget.style.color = "#ffffff";
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(217, 119, 6, 0.3)";
                  }}
                >
                  <FileText size={18} />
                  <span>Fill Official Locational Clearance Online</span>
                  <ChevronRight size={18} />
                </button>
              )
            ) : currentStep === 3 ? (
              <button 
                className="btn-primary btn-wizard-next" 
                onClick={() => goToStep(4)}
                style={{ 
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", 
                  color: "#ffffff",
                  border: "1.5px solid transparent",
                  boxShadow: "0 4px 14px rgba(217, 119, 6, 0.3)", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  padding: "10px 22px", 
                  borderRadius: "10px",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.color = "#d97706";
                  e.currentTarget.style.borderColor = "#ffffff";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(217, 119, 6, 0.3)";
                }}
              >
                <span>Next: Mapping</span>
                <ChevronRight size={18} />
              </button>
            ) : currentStep === 4 ? (
              <button 
                className="btn-primary btn-wizard-next" 
                onClick={() => goToStep(5)}
                style={{ 
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", 
                  color: "#ffffff",
                  border: "1.5px solid transparent",
                  boxShadow: "0 4px 14px rgba(217, 119, 6, 0.3)", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  padding: "10px 22px", 
                  borderRadius: "10px",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.color = "#d97706";
                  e.currentTarget.style.borderColor = "#ffffff";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(217, 119, 6, 0.3)";
                }}
              >
                <span>Next: Review & Submit</span>
                <ChevronRight size={18} />
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <button 
                  type="button"
                  onClick={() => setShowUnifiedForm(true)} 
                  style={{
                    background: "#ffffff",
                    border: "1.5px solid #fde68a",
                    color: "#b45309",
                    padding: "9px 18px",
                    borderRadius: "10px",
                    fontWeight: "700",
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <FileText size={16} /> Open Unified Form (Google Form Style)
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleSubmitApplication}
                  style={{
                    background: isAllMandatoryAttached 
                      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" 
                      : "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px", 
                    padding: "10px 22px", 
                    borderRadius: "10px",
                    cursor: isAllMandatoryAttached ? "pointer" : "not-allowed",
                    opacity: isAllMandatoryAttached ? 1 : 0.9,
                    boxShadow: isAllMandatoryAttached ? "0 4px 14px rgba(16, 185, 129, 0.35)" : "none",
                    border: "none",
                    color: "white",
                    fontWeight: "700",
                    fontSize: "0.92rem",
                    transition: "all 0.2s ease"
                  }}
                  title={isAllMandatoryAttached ? "Submit complete application" : `Please attach all mandatory permits (${missingMandatoryPermits.map(k => PERMIT_FORM_METADATA[k]?.code).join(', ')})`}
                >
                  <span>
                    {isAllMandatoryAttached 
                      ? "Submit Complete Application" 
                      : `Submit Application (${missingMandatoryPermits.length} Required Docs Pending)`}
                  </span>
                  {isAllMandatoryAttached ? <CheckCircle size={18} /> : <Lock size={16} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* ON-SCREEN REQUIRED PERMITS ALERT MODAL (PORTALED TO DOCUMENT.BODY) */}
      {mounted && showRequirementsAlert && typeof document !== "undefined" && (() => {
        const { mandatory, conditional, notRequired } = getProjectPermitsBreakdown(selectedProjectType);

        return createPortal(
          <div 
            role="alertdialog"
            aria-modal="true"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(15, 23, 42, 0.72)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
              margin: 0
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowRequirementsAlert(false);
            }}
          >
            <div style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "760px",
              width: "100%",
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(226, 232, 240, 0.8)",
              overflow: "hidden",
              position: "relative",
              animation: "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
            }}>
              {/* ALERT HEADER */}
              <div style={{
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                color: "white",
                padding: "1.25rem 1.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "#fef3c7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#b45309"
                  }}>
                    <FileCheck size={24} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                      <span style={{
                        fontSize: "0.68rem",
                        fontWeight: "800",
                        background: "#fef3c7",
                        color: "#b45309",
                        border: "1px solid #fde68a",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        letterSpacing: "0.5px"
                      }}>
                        OFFICIAL PERMIT MATRIX BREAKDOWN
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                        Santo Tomas OBO • PD 1096
                      </span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: "800", letterSpacing: "-0.01em" }}>
                      Permits Needed for {selectedProjectType.name}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRequirementsAlert(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.15)",
                    border: "none",
                    color: "white",
                    width: "34px",
                    height: "34px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"; }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* ALERT BODY */}
              <div style={{ padding: "1.5rem 1.75rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* STATUS SUMMARY BANNER */}
                <div style={{
                  background: "#ffffff",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "0.9rem 1.1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Info size={18} color="#b45309" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: "0.86rem", color: "#334155", lineHeight: "1.4" }}>
                      Under the Santo Tomas Municipal Permitting Matrix, the following engineering permits are required for this <strong>{selectedProjectType.category}</strong> project:
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "#334155", background: "transparent", border: "1px solid #cbd5e1", padding: "2px 8px", borderRadius: "5px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <Check size={11} strokeWidth={2.5} color="#059669" /> {mandatory.length} Mandatory
                    </span>
                    {conditional.length > 0 && (
                      <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "#475569", background: "transparent", border: "1px solid #cbd5e1", padding: "2px 8px", borderRadius: "5px" }}>
                        {conditional.length} Conditional
                      </span>
                    )}
                  </div>
                </div>

                {/* 1. MANDATORY PERMITS NEEDED */}
                <div>
                  <h4 style={{ margin: "0 0 0.65rem 0", fontSize: "0.98rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "7px" }}>
                    <CheckCircle2 size={18} color="#059669" />
                    Mandatory Permits for this Project ({mandatory.length} Required)
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                    {mandatory.map((p) => {
                      const Icon = p.icon;
                      return (
                        <div key={p.key} style={{
                          background: "#ffffff",
                          border: "1.5px solid #e2e8f0",
                          borderRadius: "12px",
                          padding: "0.85rem 1rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.75rem",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                          transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#dc2626";
                          e.currentTarget.style.outline = "2px solid #dc2626";
                          e.currentTarget.style.boxShadow = "0 4px 14px rgba(220, 38, 38, 0.15)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#e2e8f0";
                          e.currentTarget.style.outline = "none";
                          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                          e.currentTarget.style.transform = "none";
                        }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "8px",
                              background: "#fef3c7",
                              color: "#b45309",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0
                            }}>
                              <Icon size={18} />
                            </div>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "0.68rem", fontWeight: "800", padding: "2px 6px", borderRadius: "4px", background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}>
                                  {p.code}
                                </span>
                                <span style={{ fontSize: "0.9rem", fontWeight: "800", color: "#0f172a" }}>
                                  {p.label}
                                </span>
                              </div>
                              <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "2px" }}>
                                {p.desc}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                            {p.templateFile && (
                              <a
                                href={p.templateFile}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: "700",
                                  padding: "4px 9px",
                                  borderRadius: "6px",
                                  background: "#fef3c7",
                                  color: "#b45309",
                                  border: "1px solid #fde68a",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  textDecoration: "none",
                                  transition: "all 0.15s ease"
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#d97706"; e.currentTarget.style.color = "#ffffff"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "#fef3c7"; e.currentTarget.style.color = "#b45309"; }}
                                title={`Download official ${p.label} PDF`}
                              >
                                <Download size={12} /> Official PDF
                              </a>
                            )}
                            <span style={{
                              fontSize: "0.7rem",
                              fontWeight: "700",
                              padding: "3px 8px",
                              borderRadius: "5px",
                              background: "transparent",
                              color: "#334155",
                              border: "1px solid #cbd5e1",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}>
                              <Check size={11} strokeWidth={2.5} color="#059669" /> MANDATORY
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. CONDITIONAL PERMITS NEEDED */}
                {conditional.length > 0 && (
                  <div>
                    <h4 style={{ margin: "0 0 0.65rem 0", fontSize: "0.98rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "7px" }}>
                      <AlertCircle size={18} color="#d97706" />
                      Conditional Permits ({conditional.length} Depending on Scope)
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                      {conditional.map((p) => {
                        const Icon = p.icon;
                        return (
                          <div key={p.key} style={{
                            background: "#ffffff",
                            border: "1.5px solid #e2e8f0",
                            borderRadius: "12px",
                            padding: "0.85rem 1rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.75rem",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                            transition: "all 0.15s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#dc2626";
                            e.currentTarget.style.outline = "2px solid #dc2626";
                            e.currentTarget.style.boxShadow = "0 4px 14px rgba(220, 38, 38, 0.15)";
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#e2e8f0";
                            e.currentTarget.style.outline = "none";
                            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                            e.currentTarget.style.transform = "none";
                          }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <div style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "8px",
                                background: "#fef3c7",
                                color: "#b45309",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0
                              }}>
                                <Icon size={18} />
                              </div>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontSize: "0.68rem", fontWeight: "800", padding: "2px 6px", borderRadius: "4px", background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}>
                                    {p.code}
                                  </span>
                                  <span style={{ fontSize: "0.9rem", fontWeight: "800", color: "#0f172a" }}>
                                    {p.label}
                                  </span>
                                </div>
                                <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "2px" }}>
                                  Condition: {p.condition}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                              {p.templateFile && (
                                <a
                                  href={p.templateFile}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    fontSize: "0.72rem",
                                    fontWeight: "700",
                                    padding: "4px 9px",
                                    borderRadius: "6px",
                                    background: "#fef3c7",
                                    color: "#b45309",
                                    border: "1px solid #fde68a",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    textDecoration: "none",
                                    transition: "all 0.15s ease"
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "#d97706"; e.currentTarget.style.color = "#ffffff"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "#fef3c7"; e.currentTarget.style.color = "#b45309"; }}
                                  title={`Download official ${p.label} PDF`}
                                >
                                  <Download size={12} /> Official PDF
                                </a>
                              )}
                              <span style={{
                                fontSize: "0.7rem",
                                fontWeight: "700",
                                padding: "3px 8px",
                                borderRadius: "5px",
                                background: "transparent",
                                color: "#475569",
                                border: "1px solid #cbd5e1"
                              }}>
                                CONDITIONAL
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. EXEMPT / NOT REQUIRED PERMITS */}
                {notRequired.length > 0 && (
                  <div>
                    <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.88rem", fontWeight: "700", color: "#64748b" }}>
                      Permits Exempt / Not Applicable for this Project Type ({notRequired.length}):
                    </h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {notRequired.map((p) => (
                        <span key={p.key} style={{
                          fontSize: "0.75rem",
                          background: "#ffffff",
                          color: "#64748b",
                          border: "1px solid #cbd5e1",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px"
                        }}>
                          <strong>{p.code}</strong>: {p.label} (Not Required)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ALERT FOOTER ACTIONS */}
              <div style={{
                background: "#ffffff",
                borderTop: "1px solid #e2e8f0",
                padding: "1rem 1.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.75rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowAllTemplatesModal(true)}
                    style={{
                      background: "#ffffff",
                      border: "1.5px solid #cbd5e1",
                      color: "#334155",
                      borderRadius: "8px",
                      padding: "7px 14px",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <Download size={14} /> All 16 Templates
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      background: "#ffffff",
                      border: "1.5px solid #cbd5e1",
                      color: "#475569",
                      borderRadius: "8px",
                      padding: "7px 14px",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <Printer size={15} /> Print Permit List
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowRequirementsAlert(false)}
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      color: "#64748b",
                      borderRadius: "8px",
                      padding: "7px 14px",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      cursor: "pointer"
                    }}
                  >
                    Close Alert
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowRequirementsAlert(false);
                      setShowUnifiedForm(true);
                    }}
                    style={{
                      background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                      color: "white",
                      border: "1.5px solid #dc2626",
                      borderRadius: "8px",
                      padding: "7px 16px",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 2px 8px rgba(220, 38, 38, 0.35)",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
                  >
                    <FileText size={15} /> <span>Fill These Forms Online</span> <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* ALL 16 OFFICIAL TEMPLATES MODAL */}
      {showAllTemplatesModal && mounted && createPortal(
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(6px)",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }}>
          <div className="animate-fade-in-up" style={{
            background: "#ffffff",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "850px",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.35)",
            overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              color: "white",
              padding: "1.5rem 1.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(79, 70, 229, 0.3)",
                  border: "1px solid rgba(129, 140, 248, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#a5b4fc"
                }}>
                  <Download size={24} />
                </div>
                <div>
                  <h3 style={{ margin: "0 0 0.2rem 0", fontSize: "1.25rem", fontWeight: "800" }}>
                    Official Municipal Permit Templates (16 Forms)
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#94a3b8" }}>
                    Municipality of Sto. Tomas, Pampanga · Engineering & Zoning Division
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAllTemplatesModal(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Templates Grid */}
            <div style={{
              padding: "1.5rem 1.75rem",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem"
            }}>
              <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#64748b" }}>
                Download official, standardized PDF forms approved by the Office of the Building Official (OBO). These forms can be filled out, signed by PRC-licensed professionals, and uploaded with your permit application.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "0.85rem" }}>
                {ALL_OFFICIAL_TEMPLATES.map((tmpl) => (
                  <div key={tmpl.filename} style={{
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    transition: "all 0.15s ease"
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                        <span style={{
                          fontSize: "0.68rem",
                          fontWeight: "800",
                          padding: "2px 7px",
                          borderRadius: "4px",
                          background: "#e0e7ff",
                          color: "#4338ca"
                        }}>
                          {tmpl.code}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "600" }}>
                          {tmpl.category}
                        </span>
                      </div>
                      <h4 style={{ margin: "0 0 0.3rem 0", fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>
                        {tmpl.name}
                      </h4>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b", lineHeight: "1.4" }}>
                        {tmpl.description}
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <a
                        href={tmpl.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          background: "#ffffff",
                          border: "1.5px solid #cbd5e1",
                          color: "#334155",
                          fontSize: "0.78rem",
                          fontWeight: "700",
                          textDecoration: "none",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <Eye size={13} color="#4f46e5" /> View Form
                      </a>

                      <a
                        href={tmpl.path}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                          color: "white",
                          fontSize: "0.78rem",
                          fontWeight: "700",
                          textDecoration: "none",
                          boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)"
                        }}
                      >
                        <Download size={13} /> Download PDF
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              background: "#f1f5f9",
              borderTop: "1px solid #e2e8f0",
              padding: "1rem 1.75rem",
              display: "flex",
              justifyContent: "flex-end"
            }}>
              <button
                type="button"
                onClick={() => setShowAllTemplatesModal(false)}
                style={{
                  background: "#0f172a",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  padding: "8px 20px",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CONFIRMATION MODAL: CREATE NEW APPLICATION */}
      {showNewAppModal && typeof document !== "undefined" && createPortal(
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
            maxWidth: "540px",
            width: "100%",
            padding: "2rem",
            boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.25rem" }}>
              <div style={{ width: "46px", height: "46px", borderRadius: "14px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", color: "#0f172a" }}>
                  Start a New Permit Application?
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  Office of the Building Official (OBO) • Sto. Tomas
                </p>
              </div>
            </div>

            <div style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "12px",
              padding: "1rem 1.25rem",
              marginBottom: "1.25rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <strong style={{ color: "#166534", fontSize: "0.88rem" }}>
                  Existing Application is Safely Preserved
                </strong>
              </div>
              <p style={{ margin: 0, color: "#15803d", fontSize: "0.84rem", lineHeight: "1.5" }}>
                Your current application for <strong>{selectedProjectType?.name}</strong> {activeClearanceRef ? `(Clearance: ${activeClearanceRef})` : ""} is saved and remains fully accessible in your <Link href="/applicant/track" style={{ color: "#166534", textDecoration: "underline", fontWeight: "700" }}>Application Status</Link> tracker, where you can monitor or cancel it anytime.
              </p>
            </div>

            <p style={{ fontSize: "0.92rem", color: "#475569", lineHeight: "1.6", margin: "0 0 1.5rem 0" }}>
              Creating a new application will start a brand new filing from <strong>Step 1: Project Type</strong>, allowing you to select a different project category and upload fresh municipal requirements.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setShowNewAppModal(false)}
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
                Stay on Current Application
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedClearanceRef(null);
                  setSelectedProjectType(PROJECT_TYPES_MATRIX[0]);
                  setProjectName("");
                  setStreetAddress("");
                  setBarangay("San Bartolome");
                  setLotArea("");
                  setFloorArea("");
                  setProjectCost("");
                  setUploadedPermitDocs({});
                  setLockedNotice(null);
                  goToStep(1);
                  setShowNewAppModal(false);
                  setNewAppAlert("Started new application draft. Your previous application remains saved in Application Status.");
                  setTimeout(() => setNewAppAlert(null), 5000);
                }}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "#ffffff",
                  fontWeight: "800",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)"
                }}
              >
                <Plus size={16} />
                <span>Confirm & Start New Application</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}} />

    </div>
  );
}
