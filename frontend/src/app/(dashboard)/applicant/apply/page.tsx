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
  RefreshCw, Plus, RotateCcw, BookmarkCheck, ExternalLink, FolderKanban
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

import LocationalClearanceGoogleForm from "../../../../components/forms/LocationalClearanceGoogleForm";
import UnifiedProjectGoogleForm from "../../../../components/forms/UnifiedProjectGoogleForm";
import TechnicalPermitFormsStep from "../../../../components/forms/TechnicalPermitFormsStep";
import { generateUnifiedPermitPdf } from "../../../../utils/unifiedPermitPdfGenerator";
import { generateLocationalClearancePdf } from "../../../../utils/locationalClearancePdfGenerator";
import { isApplicationReleased } from "../../../../utils/projectGrouping";
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
import { STO_TOMAS_BARANGAYS } from "../../../../data/stoTomasGeoJSON";

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
  const [applicantEmail, setApplicantEmail] = useState("");
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

  // Submission Confirmation State
  const [submittedApp, setSubmittedApp] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedSubmittedId, setCopiedSubmittedId] = useState(false);

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
        if (userObj.email) setApplicantEmail(userObj.email);
      }
    } catch (e) {}

    // Purge any stale dummy mock applications from local cache
    try {
      const cached = localStorage.getItem("etayo_cached_applications");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((a: any) => a && a.id !== "APP-2026-6636");
          if (filtered.length !== parsed.length) {
            localStorage.setItem("etayo_cached_applications", JSON.stringify(filtered));
          }
        }
      }
      if (localStorage.getItem("etayo_active_clearance_ref") === "APP-2026-6636") {
        localStorage.removeItem("etayo_active_clearance_ref");
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

  // Helper to determine if an application is a dummy/mock seed that should not block applicants
  const isIgnoredDummyApp = useCallback((app: any) => {
    if (!app) return true;
    const appId = String(app.id || "").trim();
    if (appId === "APP-2026-6636") return true;
    if (appId === "LC-2025-0001" && (app.applicantName === "Juan Dela Cruz" || app.applicantEmail === "juan.delacruz@email.com")) return true;
    return false;
  }, []);

  // Helper to verify if an application belongs to the current logged-in applicant
  const isAppOwnedByCurrentUser = useCallback((app: any) => {
    if (!app || isIgnoredDummyApp(app)) return false;
    const curEmail = (applicantEmail || "").trim().toLowerCase();
    const curName = (applicantName || "").trim().toLowerCase();

    const appEmail = (app.applicantEmail || app.userEmail || (typeof app.user === "string" ? app.user : "") || "").trim().toLowerCase();
    const appName = (app.applicantName || app.userName || "").trim().toLowerCase();

    if (curEmail && appEmail && (appEmail === curEmail || appEmail.includes(curEmail) || curEmail.includes(appEmail))) {
      return true;
    }
    if (curName && curName !== "applicant" && appName && (appName === curName || appName.includes(curName) || curName.includes(appName))) {
      return true;
    }
    return false;
  }, [applicantEmail, applicantName, isIgnoredDummyApp]);

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
    return list.filter((a: any) => !isIgnoredDummyApp(a));
  }, [applications, isIgnoredDummyApp]);

  // When re-applying from a disapproved application, auto-resolve project type if not explicitly set
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const reapplyId = urlParams.get("reapplyFrom");
    if (reapplyId && !selectedProjectType && allAvailableApps.length > 0) {
      const priorApp = allAvailableApps.find(a => a.id === reapplyId);
      if (priorApp) {
        const typeName = typeof priorApp.projectType === "object" ? (priorApp.projectType as any)?.name : priorApp.projectType;
        const found = PROJECT_TYPES_MATRIX.find(
          p => p.id === typeName || p.name.toLowerCase() === (typeName || "").toLowerCase()
        );
        if (found) {
          setSelectedProjectType(found);
        }
      }
    }
  }, [allAvailableApps, selectedProjectType]);

  // Find locational clearance application ONLY when an explicit reference is selected (e.g. from Track page or Step 2 selection)
  const matchedClearanceApp = useMemo(() => {
    if (!selectedClearanceRef) return null;
    return allAvailableApps.find(a => a.id === selectedClearanceRef) || null;
  }, [selectedClearanceRef, allAvailableApps]);

  const isClearanceApproved = Boolean(
    matchedClearanceApp && (
      matchedClearanceApp.status?.toLowerCase() === "released" || 
      isApplicationReleased(matchedClearanceApp)
    )
  );

  const isClearancePending = Boolean(
    matchedClearanceApp && !isClearanceApproved && (
      matchedClearanceApp.status?.toLowerCase() === "approved" ||
      matchedClearanceApp.status?.toLowerCase() === "pending" || 
      matchedClearanceApp.status?.toLowerCase() === "under_review" ||
      matchedClearanceApp.status?.toLowerCase() === "in_progress"
    )
  );

  const isClearanceRejected = Boolean(
    matchedClearanceApp && matchedClearanceApp.status?.toLowerCase() === "rejected"
  );

  // Clearance is ONLY considered passed if not required by the project type, OR if officially APPROVED and RELEASED by the admin/MPDO
  const isClearancePassed = !isClearanceRequired || isClearanceApproved;
  const activeClearanceRef = matchedClearanceApp?.id || selectedClearanceRef || (isClearanceRequired ? null : "EXEMPT");

  const goToStep = useCallback((stepNumber: number) => {
    // Hard gate: Do not permit moving to Step 3, 4, or 5 if locational clearance is required and not yet officially released
    if (stepNumber >= 3 && isClearanceRequired && !isClearancePassed) {
      setCurrentStep(2);
      if (typeof window !== "undefined") {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set("step", "2");
          window.history.replaceState({}, "", url.toString());
        } catch (e) {}
      }
      setLockedNotice(
        isClearancePending
          ? `Your Locational Clearance (${matchedClearanceApp?.id || "submitted"}) has not yet been officially released. You cannot proceed to Step 3 (Required Permit Forms) until the Locational Clearance is officially released by the Municipal Zoning Administrator / MPDO.`
          : `Mandatory Locational Clearance must be approved and officially released for ${selectedProjectType?.name || "this project"} before you can proceed to Step 3: Required Permit Forms.`
      );
      return;
    }

    setCurrentStep(stepNumber);
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("step", String(stepNumber));
        window.history.replaceState({}, "", url.toString());
      } catch (e) {}
    }
  }, [isClearanceRequired, isClearancePassed, isClearancePending, matchedClearanceApp?.id, selectedProjectType?.name]);

  // CRITICAL ENFORCEMENT: Never allow applicant to remain on Step 3 or beyond if Locational Clearance is required but not released
  useEffect(() => {
    if (mounted && currentStep >= 3 && isClearanceRequired && !isClearancePassed) {
      setCurrentStep(2);
      if (typeof window !== "undefined") {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set("step", "2");
          window.history.replaceState({}, "", url.toString());
        } catch (e) {}
      }
      setLockedNotice(
        isClearancePending
          ? `Your Locational Clearance (${matchedClearanceApp?.id || "submitted"}) has not yet been officially released. You cannot proceed to Step 3 (Required Permit Forms) until the Locational Clearance is officially released by the Municipal Zoning Administrator / MPDO.`
          : `Mandatory Locational Clearance must be approved and officially released for ${selectedProjectType?.name || "this project"} before proceeding to Step 3: Required Permit Forms.`
      );
    }
  }, [mounted, currentStep, isClearanceRequired, isClearancePassed, isClearancePending, matchedClearanceApp?.id, selectedProjectType?.name]);

  // Filter available clearances the user might already have submitted in the system
  const userClearances = useMemo(() => {
    return allAvailableApps.filter(
      (app) => (app.permitType === "locational_clearance" || (app.id && app.id.startsWith("LC-"))) &&
        (!applicantEmail || isAppOwnedByCurrentUser(app))
    );
  }, [allAvailableApps, applicantEmail, isAppOwnedByCurrentUser]);

  // Existing approved & released clearances matching currently selected project type (available for linking in Step 2)
  const matchingApprovedClearances = useMemo(() => {
    return userClearances.filter(a =>
      (a.status?.toLowerCase() === "released" || isApplicationReleased(a)) &&
      (a.projectType === selectedProjectType?.name || (a.projectName && a.projectName.includes(selectedProjectType?.name)))
    );
  }, [userClearances, selectedProjectType]);

  // Helper to find an ACTIVE (in-progress or approved) application for a given project type
  // Active = status is NOT "rejected" and NOT "cancelled" and belongs to the current applicant
  const getActiveAppForProjectType = useCallback((projectTypeName: string) => {
    return allAvailableApps.find((app: any) => {
      if (isIgnoredDummyApp(app)) return false;
      if (!isAppOwnedByCurrentUser(app)) return false;
      if (app.status === "rejected" || app.status === "cancelled") return false;
      const isLC = app.permitType === "locational_clearance" || (app.id && app.id.startsWith("LC-"));
      if (isLC) return false;
      const aProjType = typeof app.projectType === "object" ? app.projectType?.name : app.projectType;
      return Boolean(
        aProjType && (
          aProjType.toLowerCase() === projectTypeName.toLowerCase() ||
          projectTypeName.toLowerCase().includes(aProjType.toLowerCase())
        )
      );
    });
  }, [allAvailableApps, isIgnoredDummyApp, isAppOwnedByCurrentUser]);

  // Helper to find a PREVIOUSLY REJECTED application for a given project type (so applicant can re-apply)
  const getRejectedAppForProjectType = useCallback((projectTypeName: string) => {
    return allAvailableApps.find((app: any) => {
      if (isIgnoredDummyApp(app)) return false;
      if (!isAppOwnedByCurrentUser(app)) return false;
      if (app.status !== "rejected") return false;
      const isLC = app.permitType === "locational_clearance" || (app.id && app.id.startsWith("LC-"));
      if (isLC) return false;
      const aProjType = typeof app.projectType === "object" ? app.projectType?.name : app.projectType;
      return Boolean(
        aProjType && (
          aProjType.toLowerCase() === projectTypeName.toLowerCase() ||
          projectTypeName.toLowerCase().includes(aProjType.toLowerCase())
        )
      );
    });
  }, [allAvailableApps, isIgnoredDummyApp, isAppOwnedByCurrentUser]);

  // Check if an ACTIVE Stage 2 application has already been submitted for this Locational Clearance
  const activeExistingStage2App = useMemo(() => {
    if (!activeClearanceRef || activeClearanceRef === "EXEMPT") return null;
    return allAvailableApps.find(
      (app: any) =>
        !isIgnoredDummyApp(app) &&
        isAppOwnedByCurrentUser(app) &&
        app.id !== activeClearanceRef &&
        !(app.permitType === "locational_clearance" || (app.id && app.id.startsWith("LC-"))) &&
        app.status !== "rejected" &&
        app.status !== "cancelled" &&
        (
          app.locationalClearanceRef && app.locationalClearanceRef.trim().toLowerCase() === activeClearanceRef.trim().toLowerCase()
        )
    );
  }, [allAvailableApps, activeClearanceRef, isIgnoredDummyApp, isAppOwnedByCurrentUser]);

  // Check if a previous Stage 2 application was REJECTED (so user is allowed to re-apply)
  const rejectedStage2App = useMemo(() => {
    if (!activeClearanceRef || activeClearanceRef === "EXEMPT") return null;
    return allAvailableApps.find(
      (app: any) =>
        !isIgnoredDummyApp(app) &&
        isAppOwnedByCurrentUser(app) &&
        app.id !== activeClearanceRef &&
        !(app.permitType === "locational_clearance" || (app.id && app.id.startsWith("LC-"))) &&
        app.status === "rejected" &&
        (
          app.locationalClearanceRef && app.locationalClearanceRef.trim().toLowerCase() === activeClearanceRef.trim().toLowerCase()
        )
    );
  }, [allAvailableApps, activeClearanceRef, isIgnoredDummyApp, isAppOwnedByCurrentUser]);

  // Alias for backward compatibility where alreadySubmittedStage2App was previously referenced
  const alreadySubmittedStage2App = activeExistingStage2App;

  // Active application for currently selected project type
  const activeAppForCurrentProjectType = useMemo(() => {
    if (!selectedProjectType) return null;
    return getActiveAppForProjectType(selectedProjectType.name);
  }, [selectedProjectType, getActiveAppForProjectType]);

  // Rejected application for currently selected project type
  const rejectedAppForCurrentProjectType = useMemo(() => {
    if (!selectedProjectType) return null;
    return getRejectedAppForProjectType(selectedProjectType.name);
  }, [selectedProjectType, getRejectedAppForProjectType]);

  // Persist active clearance reference to localStorage ONLY when officially released
  useEffect(() => {
    if (isClearanceApproved && activeClearanceRef && activeClearanceRef !== "EXEMPT") {
      try {
        localStorage.setItem("etayo_active_clearance_ref", activeClearanceRef);
      } catch (e) {}
    } else if (!isClearanceApproved && typeof window !== "undefined") {
      const stored = localStorage.getItem("etayo_active_clearance_ref");
      if (stored && stored === activeClearanceRef) {
        localStorage.removeItem("etayo_active_clearance_ref");
      }
    }
  }, [isClearanceApproved, activeClearanceRef]);

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

  // Auto-sync project information (name, address, applicant) from matched clearance
  useEffect(() => {
    if (matchedClearanceApp) {
      if (matchedClearanceApp.projectName && !projectName) {
        const cleanName = (matchedClearanceApp.projectName || "").replace(/\s*-\s*locational\s*clearance/i, "").trim();
        setProjectName(cleanName || matchedClearanceApp.projectName);
      }
      if (matchedClearanceApp.applicantName && (applicantName === "Applicant" || !applicantName)) {
        setApplicantName(matchedClearanceApp.applicantName);
      }
      if (matchedClearanceApp.applicantEmail && !applicantEmail) {
        setApplicantEmail(matchedClearanceApp.applicantEmail);
      }
      if (matchedClearanceApp.barangay && barangay === "San Bartolome") {
        setBarangay(matchedClearanceApp.barangay);
      }
    }
  }, [matchedClearanceApp]);


  
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

  // Technical permits (BP, AP, SP, EP, PL, MP, EL, FP, DP) are answered digitally online in Step 3.
  // The ONLY permit that requires manual file upload/attachment is Fire / BFP Clearance ('fireBfpPermit').
  const isPermitSatisfied = (k: keyof PermitFormMatrix) => {
    if (k === 'fireBfpPermit') {
      return Boolean(uploadedPermitDocs['fireBfpPermit']);
    }
    // All other technical permits are answered online in Step 3 and compiled digitally
    return true;
  };

  // Mandatory permits that require manual file upload and have not yet been attached (ONLY fireBfpPermit)
  const missingMandatoryPermits = mandatoryPermitsToSubmit.filter(
    (k) => !isPermitSatisfied(k)
  );

  const isAllMandatoryAttached = missingMandatoryPermits.length === 0;

  const handlePermitDocUpload = async (key: keyof PermitFormMatrix, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setActiveUploadingKey(key);
    setUploadError("");
    setSubmissionErrorAlert(null);

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    const sizeStr = file.size > 1024 * 1024 ? `${sizeInMb} MB` : `${Math.round(file.size / 1024)} KB`;

    // 1. Immediately read file as authentic base64 Data URL to guarantee it renders exactly as uploaded
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = (reader.result as string) || "";
      let finalFileUrl = base64Data;

      // 2. Also send to /api/upload to sync with server
      try {
        const formData = new FormData();
        formData.append("files", file);
        formData.append("permitType", PERMIT_FORM_METADATA[key]?.label || "Technical Permit");
        formData.append("projectType", selectedProjectType?.name || "General Application");

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: token ? { "Authorization": `Bearer ${token}` } : {},
          body: formData,
        }).catch(() => null);

        if (res && res.ok) {
          const data = await res.json();
          if (data?.urls?.[0]) {
            finalFileUrl = data.urls[0];
          }
        }
      } catch (e) {
        // Fallback to client-side base64Data
      }

      setUploadedPermitDocs(prev => ({
        ...prev,
        [key]: {
          fileName: file.name,
          fileSize: sizeStr,
          fileUrl: finalFileUrl,
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isDigitallyGenerated: false
        }
      }));

      try {
        localStorage.setItem(`att_${file.name}`, finalFileUrl);
        localStorage.setItem(`etayo_att_${file.name}`, finalFileUrl);
        if (key === "fireBfpPermit") {
          localStorage.setItem("etayo_bfp_file_data", finalFileUrl);
          localStorage.setItem("etayo_bfp_file_name", file.name);
          localStorage.setItem("etayo_bfp_file_size", sizeStr);
        }
      } catch (e) {}

      setActiveUploadingKey(null);
    };

    reader.onerror = () => {
      setUploadError("Could not read uploaded document");
      setActiveUploadingKey(null);
    };

    reader.readAsDataURL(file);
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
      let response = await fetch("/api/upload", {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
        body: formData,
      }).catch(() => null);

      if (!response || !response.ok) {
        const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
        response = await fetch(`${rawApi}/api/upload`, {
          method: "POST",
          headers: token ? { "Authorization": `Bearer ${token}` } : {},
          body: formData,
        }).catch(() => null);
      }

      if (!response || !response.ok) {
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
    // Only check for duplicate if this exact Locational Clearance already has an active stage 2 building permit by this applicant
    const activeDuplicateApp = allAvailableApps.find((app: any) => {
      if (isIgnoredDummyApp(app)) return false;
      if (!isAppOwnedByCurrentUser(app)) return false;
      if (app.status === "rejected" || app.status === "cancelled") return false;
      const isLC = app.permitType === "locational_clearance" || (app.id && app.id.startsWith("LC-"));
      if (isLC) return false;

      const sameClearance = Boolean(
        activeClearanceRef &&
        activeClearanceRef !== "EXEMPT" &&
        app.locationalClearanceRef &&
        app.locationalClearanceRef.trim().toLowerCase() === activeClearanceRef.trim().toLowerCase()
      );

      return sameClearance;
    });

    if (activeDuplicateApp) {
      setSubmissionErrorAlert(
        `Duplicate Application Blocked: You already have an active permit application (${activeDuplicateApp.id} - ${activeDuplicateApp.status}) referencing Locational Clearance ${activeClearanceRef}. If a previous application was rejected, only then can you file a new application.`
      );
      if (typeof document !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    if (!projectName.trim()) {
      setSubmissionErrorAlert("Cannot submit application: Project Name is required.");
      if (typeof document !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!streetAddress.trim()) {
      setSubmissionErrorAlert("Cannot submit application: Street Address is required.");
      if (typeof document !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!lotArea.trim() || Number(lotArea) <= 0) {
      setSubmissionErrorAlert("Cannot submit application: Lot Area in square meters is required.");
      if (typeof document !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!floorArea.trim() || Number(floorArea) <= 0) {
      setSubmissionErrorAlert("Cannot submit application: Floor Area in square meters is required.");
      if (typeof document !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!projectCost.trim() || Number(projectCost) <= 0) {
      setSubmissionErrorAlert("Cannot submit application: Estimated Project Cost is required.");
      if (typeof document !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!isAllMandatoryAttached) {
      setSubmissionErrorAlert(
        `Cannot submit application: There are ${missingMandatoryPermits.length} mandatory documents not yet attached. Please review the checklist and attach all required files.`
      );
      if (typeof document !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    setIsSubmitting(true);
    setSubmissionErrorAlert(null);

    try {
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
        const isBfp = key === "fireBfpPermit";
        const isUserUpload = isBfp || !doc?.isDigitallyGenerated;
        const resolvedDocUrl = isUserUpload 
          ? (doc?.fileUrl || (isBfp ? "" : templatePath)) 
          : ((doc?.fileUrl && !doc.fileUrl.startsWith("data:")) ? doc.fileUrl : templatePath);

        if (doc?.fileUrl && doc.fileName) {
          try {
            localStorage.setItem(`att_${doc.fileName}`, doc.fileUrl);
            localStorage.setItem(`etayo_att_${doc.fileName}`, doc.fileUrl);
            if (isBfp) {
              localStorage.setItem("etayo_bfp_file_data", doc.fileUrl);
              localStorage.setItem("etayo_bfp_file_name", doc.fileName);
            }
          } catch (e) {}
        }

        requirementsList.push({
          name: `${meta.label} (${meta.code})`,
          required: true,
          status: "submitted",
          fileName: doc?.fileName || `${meta.code}_${selectedProjectType.name.replace(/\s+/g, '_')}_Official_Filled.pdf`,
          fileSize: doc?.fileSize || "1.4 MB",
          remarks: isBfp ? "Official Bureau of Fire Protection Clearance Certificate" : `Official ${meta.label} document submitted for engineering evaluation`,
          fileUrl: resolvedDocUrl
        });
      });

      // 3. Any attached conditional permits
      Object.keys(uploadedPermitDocs).forEach(key => {
        if (!mandatoryPermitsToSubmit.includes(key as keyof PermitFormMatrix) && key !== "zoningPermit") {
          const meta = PERMIT_FORM_METADATA[key as keyof PermitFormMatrix];
          const doc = uploadedPermitDocs[key];
          const templatePath = getPermitFormTemplate(key as keyof PermitFormMatrix, selectedProjectType);
          const resolvedDocUrl = (doc?.fileUrl && !doc.fileUrl.startsWith("data:")) ? doc.fileUrl : templatePath;
          if (meta && doc) {
            requirementsList.push({
              name: `${meta.label} (${meta.code}) [Conditional]`,
              required: false,
              status: "submitted",
              fileName: doc.fileName,
              fileSize: doc.fileSize,
              remarks: "Voluntarily attached conditional engineering document",
              fileUrl: resolvedDocUrl
            });
          }
        }
      });

      const isApplyingLC = selectedPermitType === "locational_clearance";
      const newId = isApplyingLC
        ? `LC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
        : `APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const submissionDate = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
      const formattedFileName = isApplyingLC
        ? `${newId}_${selectedProjectType.name.replace(/\s+/g, '_')}_Locational_Clearance.pdf`
        : `${newId}_${selectedProjectType.name.replace(/\s+/g, '_')}_Permit_Package.pdf`;

      // Keep application metadata lightweight (<15KB) so it saves instantly in localStorage and Vercel/Render without 413 or QuotaExceeded errors
      const cleanPrimaryFileUrl = (uploadedFileUrl && !uploadedFileUrl.startsWith("data:"))
        ? uploadedFileUrl
        : "/templates/UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf";

      const curUser = typeof window !== "undefined" ? (() => {
        try {
          const u = localStorage.getItem("user");
          return u ? JSON.parse(u) : null;
        } catch (e) { return null; }
      })() : null;

      const finalProjectName = (projectName || "").trim() || (matchedClearanceApp?.projectName || "").trim() || `${selectedProjectType.name} Installation & Construction`;
      const finalApplicantName = (applicantName && applicantName !== "Applicant") 
        ? applicantName 
        : (curUser?.name || matchedClearanceApp?.applicantName || "Paul Payumo");
      const finalApplicantEmail = applicantEmail || curUser?.email || matchedClearanceApp?.applicantEmail || "applicant@etayo.gov.ph";
      const finalClearanceRef = activeClearanceRef || matchedClearanceApp?.id || undefined;

      const newApp: any = {
        id: newId,
        projectName: finalProjectName,
        projectType: selectedProjectType.name,
        permitType: selectedPermitType,
        status: "pending",
        dateSubmitted: submissionDate,
        applicantName: finalApplicantName,
        applicantEmail: finalApplicantEmail,
        userEmail: finalApplicantEmail,
        fileUrl: cleanPrimaryFileUrl,
        fileName: formattedFileName,
        locationalClearanceRef: finalClearanceRef,
        clearanceRef: finalClearanceRef,
        connectedClearanceId: finalClearanceRef,
        location: {
          lat: parseFloat(latitude) || 15.0050,
          lng: parseFloat(longitude) || 120.7100,
          address: projectAddress || matchedClearanceApp?.projectAddress || 'Sto. Tomas, Pampanga',
        },
        requirements: requirementsList,
        bfpUploadedFile: uploadedPermitDocs['fireBfpPermit']?.fileUrl,
        bfpUploadedFileName: uploadedPermitDocs['fireBfpPermit']?.fileName,
        trackingSteps: [
          { title: 'Application Submitted', status: 'completed', date: submissionDate, notes: `Application dossier filed online with ${requirementsList.length} verified engineering attachments.` },
          { title: 'Initial Document Verification', status: 'upcoming', notes: 'Reviewing all technical engineering attachments for completeness and licensed PRC sign-offs.' }
        ],
        historyLog: [
          { date: new Date().toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute:"2-digit" }), action: 'Application Submitted', actor: finalApplicantName, details: `Applied for ${selectedProjectType.name} with ${mandatoryPermitsToSubmit.length} mandatory engineering permits.` }
        ]
      };

      // Persist BFP clearance upload for administrative evaluation
      if (typeof window !== "undefined") {
        const bfpDoc = uploadedPermitDocs['fireBfpPermit'];
        if (bfpDoc?.fileUrl) {
          const bfpUrl = bfpDoc.fileUrl;
          const bfpName = bfpDoc.fileName || 'BFP_Fire_Safety_Clearance.pdf';
          try {
            localStorage.setItem(`etayo_bfp_${newApp.id}`, bfpUrl);
            localStorage.setItem(`etayo_bfp_name_${newApp.id}`, bfpName);
            localStorage.setItem("etayo_bfp_file_data", bfpUrl);
            localStorage.setItem("etayo_bfp_file_name", bfpName);
            localStorage.setItem(`att_${bfpName}`, bfpUrl);
            localStorage.setItem(`etayo_att_${bfpName}`, bfpUrl);
          } catch (e) {}
        }
      }

      // Optimistically dispatch application immediately (saves to state, localStorage, and syncs)
      addApplication(newApp);

      // Quick 300ms transition for a snappy, satisfying user experience
      await new Promise(r => setTimeout(r, 300));
      setSubmittedApp(newApp);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      setSubmissionErrorAlert(err?.message || "An unexpected error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
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
          setSubmittedApp(newApp);
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
        onCancel={() => setShowUnifiedForm(false)}
      />
    );
  }

  // --- SUBMISSION CONFIRMATION VIEW (Renders when application is successfully lodged) ---
  if (submittedApp) {
    const requirementsCount = submittedApp.requirements?.length || 0;
    
    return (
      <div className="animate-fade-in-up" style={{ maxWidth: "880px", margin: "1.5rem auto 3.5rem", padding: "0 1rem" }}>
        <div style={{
          background: "#ffffff",
          borderRadius: "24px",
          border: "1.5px solid #a7f3d0",
          boxShadow: "0 25px 50px -12px rgba(5, 150, 105, 0.2), 0 10px 25px -5px rgba(0, 0, 0, 0.04)",
          overflow: "hidden"
        }}>
          {/* Header Banner with Philippine Blue & Sto. Tomas Emerald Accent */}
          <div style={{
            background: "linear-gradient(135deg, #021a4f 0%, #0038A8 55%, #059669 100%)",
            color: "white",
            padding: "2.25rem 2.5rem",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Subtle glow circle decoration */}
            <div style={{
              position: "absolute",
              top: "-50px",
              right: "-50px",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.08)",
              pointerEvents: "none"
            }} />
            
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", position: "relative", zIndex: 1 }}>
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "18px",
                background: "rgba(255, 255, 255, 0.18)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.15)"
              }}>
                <CheckCircle2 size={38} color="#34d399" />
              </div>
              <div>
                <div style={{
                  fontSize: "0.78rem",
                  fontWeight: "800",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: "#93c5fd",
                  marginBottom: "4px"
                }}>
                  Municipality of Sto. Tomas, Pampanga · Office of the Building Official (OBO)
                </div>
                <h2 style={{ margin: 0, fontSize: "1.75rem", fontWeight: "900", letterSpacing: "-0.02em" }}>
                  Application Lodged Successfully!
                </h2>
                <p style={{ margin: "6px 0 0 0", fontSize: "0.95rem", color: "#e2e8f0", opacity: 0.95, lineHeight: 1.4 }}>
                  Your official permit application and technical attachments have been registered into the municipal permitting records.
                </p>
              </div>
            </div>
          </div>

          {/* Reference Number & Quick Status Highlight Card */}
          <div style={{ padding: "2rem 2.5rem" }}>
            <div style={{
              background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
              border: "1.5px solid #86efac",
              borderRadius: "16px",
              padding: "1.5rem 1.75rem",
              marginBottom: "2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1.25rem",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.08)"
            }}>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Official Reference Number
                </div>
                <div style={{
                  fontSize: "1.85rem",
                  fontWeight: "900",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  color: "#065f46",
                  letterSpacing: "0.5px",
                  margin: "4px 0 8px 0"
                }}>
                  {submittedApp.id}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      navigator.clipboard.writeText(submittedApp.id);
                      setCopiedSubmittedId(true);
                      setTimeout(() => setCopiedSubmittedId(false), 2500);
                    }
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: copiedSubmittedId ? "#166534" : "#ffffff",
                    color: copiedSubmittedId ? "#ffffff" : "#166534",
                    border: "1px solid #86efac",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {copiedSubmittedId ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedSubmittedId ? "Copied Reference Number!" : "Copy Reference Number"}</span>
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                <span style={{
                  background: "#fef3c7",
                  color: "#92400e",
                  border: "1px solid #fde68a",
                  padding: "6px 14px",
                  borderRadius: "999px",
                  fontSize: "0.85rem",
                  fontWeight: "800",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <Clock size={15} /> Under Initial Evaluation
                </span>
                <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "500" }}>
                  Filed on {submittedApp.dateSubmitted || new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Key Information Summary Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1rem",
              marginBottom: "2rem"
            }}>
              <div style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "1.1rem 1.25rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0038A8", marginBottom: "6px" }}>
                  <Building2 size={18} />
                  <span style={{ fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b" }}>
                    Project & Classification
                  </span>
                </div>
                <div style={{ fontWeight: "800", color: "#1e293b", fontSize: "1rem" }}>
                  {submittedApp.projectName || selectedProjectType?.name}
                </div>
                <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "2px" }}>
                  Category: {submittedApp.projectType || selectedProjectType?.name}
                </div>
              </div>

              <div style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "1.1rem 1.25rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#059669", marginBottom: "6px" }}>
                  <ShieldCheck size={18} />
                  <span style={{ fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b" }}>
                    Zoning Clearance Prerequisite
                  </span>
                </div>
                <div style={{ fontWeight: "800", color: "#1e293b", fontSize: "1rem", fontFamily: "monospace" }}>
                  {submittedApp.locationalClearanceRef || activeClearanceRef || (isClearanceRequired ? "LC-APPROVED" : "ZONING EXEMPT")}
                </div>
                <div style={{ fontSize: "0.82rem", color: "#059669", fontWeight: "600", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <CheckCircle size={13} /> Stage 1 Prerequisite Satisfied
                </div>
              </div>

              <div style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "1.1rem 1.25rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#dc2626", marginBottom: "6px" }}>
                  <MapPin size={18} />
                  <span style={{ fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b" }}>
                    Project Address / Location
                  </span>
                </div>
                <div style={{ fontWeight: "800", color: "#1e293b", fontSize: "0.95rem" }}>
                  {submittedApp.location?.address || projectAddress}
                </div>
                <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "2px" }}>
                  Brgy. {barangay}, Sto. Tomas, Pampanga
                </div>
              </div>

              <div style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "1.1rem 1.25rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#4f46e5", marginBottom: "6px" }}>
                  <FileText size={18} />
                  <span style={{ fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b" }}>
                    Permit Package Dossier
                  </span>
                </div>
                <div style={{ fontWeight: "800", color: "#1e293b", fontSize: "1rem" }}>
                  {requirementsCount} Verified Technical Forms
                </div>
                <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "2px" }}>
                  Applicant: {submittedApp.applicantName || applicantName || "Paul Payumo"}
                </div>
              </div>
            </div>

            {/* Verified Technical Attachments List */}
            {submittedApp.requirements && submittedApp.requirements.length > 0 && (
              <div style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "1.25rem 1.5rem",
                marginBottom: "2rem"
              }}>
                <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "#1e293b", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FileCheck size={18} color="#059669" />
                  <span>Submitted Technical Documents in this Dossier:</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem" }}>
                  {submittedApp.requirements.map((req: any, idx: number) => (
                    <div 
                      key={idx} 
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        padding: "8px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px"
                      }}
                    >
                      <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                        <div style={{ fontSize: "0.84rem", fontWeight: "700", color: "#1e293b", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {req.name}
                        </div>
                        <div style={{ fontSize: "0.74rem", color: "#64748b" }}>
                          {req.fileName || "Official Digitized Document"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Permitting Process Roadmap */}
            <div style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "16px",
              padding: "1.5rem 1.75rem",
              marginBottom: "2.5rem"
            }}>
              <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "#1e3a8a", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={18} color="#2563eb" />
                <span>What Happens Next? (Sto. Tomas Permitting Process)</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
                <div style={{ borderLeft: "3px solid #10b981", paddingLeft: "10px" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: "800", color: "#065f46" }}>1. Application Lodged</div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "2px" }}>Completed today. Dossier filed with reference ID.</div>
                </div>
                <div style={{ borderLeft: "3px solid #f59e0b", paddingLeft: "10px" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: "800", color: "#92400e" }}>2. Technical Evaluation</div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "2px" }}>OBO structural, electrical, sanitary, and BFP reviews.</div>
                </div>
                <div style={{ borderLeft: "3px solid #94a3b8", paddingLeft: "10px" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: "800", color: "#475569" }}>3. Order of Payment</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>Assessed regulatory fees will be computed for payment.</div>
                </div>
                <div style={{ borderLeft: "3px solid #94a3b8", paddingLeft: "10px" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: "800", color: "#475569" }}>4. Official Release</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>Digitally signed permit package with Municipal QR.</div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
              borderTop: "1.5px solid #f1f5f9",
              paddingTop: "1.5rem"
            }}>
              <button
                type="button"
                onClick={() => {
                  setSubmittedApp(null);
                  setCurrentStep(1);
                  if (typeof window !== "undefined") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  color: "#475569",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.15s ease"
                }}
              >
                <RotateCcw size={16} />
                <span>File Another Application</span>
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => router.push("/applicant/dashboard")}
                  style={{
                    background: "#ffffff",
                    border: "1.5px solid #cbd5e1",
                    color: "#334155",
                    padding: "12px 22px",
                    borderRadius: "12px",
                    fontSize: "0.92rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.15s ease"
                  }}
                >
                  <Home size={18} />
                  <span>Go to Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push(`/applicant/track/${submittedApp.id}`)}
                  style={{
                    background: "linear-gradient(135deg, #0038A8 0%, #021a4f 100%)",
                    border: "none",
                    color: "#ffffff",
                    padding: "12px 26px",
                    borderRadius: "12px",
                    fontSize: "0.95rem",
                    fontWeight: "800",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 6px 20px rgba(0, 56, 168, 0.35)",
                    transition: "all 0.15s ease"
                  }}
                >
                  <FolderKanban size={18} />
                  <span>Track Application Timeline Live</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
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
              const isPassed = step.id === 2 ? (isClearancePassed && currentStep > 2) : currentStep > step.id;
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
                        setLockedNotice(`Your Locational Clearance (${matchedClearanceApp?.id || 'Ref'}) is awaiting official release. The municipal zoning administrator / MPDO must officially release your clearance before you can proceed to ${step.title}.`);
                      } else {
                        setLockedNotice(`Mandatory Locational Clearance must be approved and officially released for ${selectedProjectType.name} before proceeding to ${step.title}.`);
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
                        ? "Approved & Released" 
                        : isClearanceAwaitingAdmin
                        ? (matchedClearanceApp?.status?.toLowerCase() === "approved" ? "Awaiting Release" : "Pending Approval")
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
                  <span style={{ fontSize: "0.88rem", color: "#ffffff", fontWeight: "700", textShadow: "0 1px 2px rgba(0, 0, 0, 0.25)" }}>
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
                    <CheckCircle2 size={18} color="#2563eb" />
                    <span style={{ fontSize: "0.84rem", color: "#2563eb", fontWeight: "700" }}>
                      Selected: <strong style={{ color: "#1d4ed8" }}>{selectedProjectType.name}</strong>
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

              {/* ACTIVE PERMIT NOTICE (1-PERMIT-PER-PROJECT RULE / BAWAL DUMOBLE) */}
              {activeAppForCurrentProjectType && (
                <div className="animate-fade-in-up" style={{
                  background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                  border: "1.5px solid #fde68a",
                  borderRadius: "12px",
                  padding: "0.85rem 1.25rem",
                  marginBottom: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                  boxShadow: "0 2px 8px rgba(217, 119, 6, 0.08)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Clock size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: "800", color: "#92400e", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span>Active Permit In Progress: {activeAppForCurrentProjectType.id}</span>
                        <span style={{ fontSize: "0.72rem", fontWeight: "800", padding: "2px 8px", borderRadius: "6px", background: "#fef9c3", color: "#b45309", border: "1px solid #fde047" }}>
                          {activeAppForCurrentProjectType.status === "approved" || activeAppForCurrentProjectType.status === "released" ? "Approved" : "Under Review"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#78350f", marginTop: "2px" }}>
                        You already have an active permit application for <strong>{selectedProjectType.name}</strong>. Per Sto. Tomas municipal regulations, only one (1) active permit application is permitted per project type (bawal dumoble).
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/applicant/track/${encodeURIComponent(activeAppForCurrentProjectType.id)}`}
                    style={{
                      background: "#2563eb",
                      color: "white",
                      padding: "7px 15px",
                      borderRadius: "8px",
                      fontSize: "0.82rem",
                      fontWeight: "800",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)"
                    }}
                  >
                    <span>Track Active Permit</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              )}

              {/* RE-APPLICATION NOTICE FOR PREVIOUSLY REJECTED APPLICATION */}
              {rejectedAppForCurrentProjectType && !activeAppForCurrentProjectType && (
                <div className="animate-fade-in-up" style={{
                  background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
                  border: "1.5px solid #a7f3d0",
                  borderRadius: "12px",
                  padding: "0.85rem 1.25rem",
                  marginBottom: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                  boxShadow: "0 2px 8px rgba(5, 150, 105, 0.06)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <RotateCcw size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: "800", color: "#065f46" }}>
                        Previous Application Disapproved ({rejectedAppForCurrentProjectType.id}) — New Application Permitted
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#047857", marginTop: "2px" }}>
                        Your previous application for <strong>{selectedProjectType.name}</strong> was rejected. You are now creating a new replacement application with corrected compliance.
                      </div>
                    </div>
                  </div>
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
                  const activeAppForP = getActiveAppForProjectType(p.name);
                  const rejectedAppForP = getRejectedAppForProjectType(p.name);

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProjectType(p);
                        setLockedNotice(null);
                      }}
                      className="project-card-item"
                      style={{
                        border: isSelected ? "2px solid #1d4ed8" : "1.5px solid #e2e8f0",
                        background: isSelected 
                          ? "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)" 
                          : "#ffffff",
                        borderRadius: "12px",
                        padding: "0.9rem 1.15rem",
                        cursor: "pointer",
                        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                        boxShadow: isSelected 
                          ? "0 10px 25px -4px rgba(37, 99, 235, 0.4), 0 0 0 1px #1d4ed8" 
                          : "0 1px 4px rgba(0,0,0,0.02)",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.45rem"
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "#cbd5e1";
                          e.currentTarget.style.outline = "none";
                          e.currentTarget.style.boxShadow = "0 8px 24px -4px rgba(0, 0, 0, 0.08)";
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
                            color: isSelected ? "#ffffff" : "#b45309",
                            background: isSelected ? "rgba(255, 255, 255, 0.2)" : "#fef3c7",
                            border: isSelected ? "1px solid rgba(255, 255, 255, 0.35)" : "1px solid #fde68a",
                            padding: "2px 8px",
                            borderRadius: "999px"
                          }}>
                            <CatIcon size={11} />
                            {p.category}
                          </span>

                          <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: isSelected ? "#ffffff" : "#0f172a" }}>
                            {p.name}
                          </h4>
                        </div>

                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.72rem",
                          color: isSelected ? "#ffffff" : "#64748b",
                          fontWeight: "600",
                          background: isSelected ? "rgba(255, 255, 255, 0.18)" : "#f8fafc",
                          border: isSelected ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid #e2e8f0",
                          padding: "2px 8px",
                          borderRadius: "6px"
                        }}>
                          <Clock size={11} /> {p.estimatedDays}
                        </span>
                      </div>

                      {/* MIDDLE: DESCRIPTION */}
                      <p style={{ margin: 0, fontSize: "0.8rem", color: isSelected ? "rgba(255, 255, 255, 0.9)" : "#64748b", lineHeight: "1.4" }}>
                        {p.description}
                      </p>

                      {/* BOTTOM ROW: BADGES & ACTION BUTTONS */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginTop: "0.2rem" }}>
                        {/* BADGES */}
                        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center", fontSize: "0.7rem", fontWeight: "700" }}>
                          {activeAppForP ? (
                            <span style={{
                              background: isSelected ? "rgba(255, 255, 255, 0.2)" : "#fef3c7",
                              color: isSelected ? "#ffffff" : "#b45309",
                              border: isSelected ? "1px solid rgba(255, 255, 255, 0.35)" : "1px solid #fde68a",
                              padding: "2px 8px",
                              borderRadius: "5px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontWeight: "800"
                            }}>
                              <Clock size={11} color={isSelected ? "#fef3c7" : "#d97706"} />
                              <span>Active: {activeAppForP.id}</span>
                            </span>
                          ) : rejectedAppForP ? (
                            <span style={{
                              background: isSelected ? "rgba(255, 255, 255, 0.2)" : "#f0fdf4",
                              color: isSelected ? "#ffffff" : "#166534",
                              border: isSelected ? "1px solid rgba(255, 255, 255, 0.35)" : "1px solid #86efac",
                              padding: "2px 8px",
                              borderRadius: "5px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontWeight: "800"
                            }}>
                              <RotateCcw size={11} color={isSelected ? "#86efac" : "#15803d"} />
                              <span>Disapproved ({rejectedAppForP.id}) — Re-Apply Allowed</span>
                            </span>
                          ) : null}

                          <span style={{
                            background: isSelected ? "rgba(255, 255, 255, 0.18)" : "transparent",
                            color: isSelected ? "#ffffff" : "#334155",
                            border: isSelected ? "1px solid rgba(255, 255, 255, 0.35)" : "1px solid #cbd5e1",
                            padding: "2px 7px",
                            borderRadius: "5px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px"
                          }}>
                            <Check size={11} strokeWidth={2.5} color={isSelected ? "#86efac" : "#059669"} /> {reqCount} Mandatory
                          </span>
                          {condCount > 0 && (
                            <span style={{
                              background: isSelected ? "rgba(255, 255, 255, 0.18)" : "transparent",
                              color: isSelected ? "#ffffff" : "#475569",
                              border: isSelected ? "1px solid rgba(255, 255, 255, 0.35)" : "1px solid #cbd5e1",
                              padding: "2px 7px",
                              borderRadius: "5px"
                            }}>
                              {condCount} Conditional
                            </span>
                          )}
                          {p.matrix.zoningPermit === 'required' ? (
                            <span style={{
                              background: isSelected ? "rgba(255, 255, 255, 0.18)" : "transparent",
                              color: isSelected ? "#ffffff" : "#475569",
                              border: isSelected ? "1px solid rgba(255, 255, 255, 0.35)" : "1px solid #cbd5e1",
                              padding: "2px 7px",
                              borderRadius: "5px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px"
                            }}>
                              <ShieldCheck size={11} color={isSelected ? "#fde047" : "#d97706"} /> LC Required
                            </span>
                          ) : p.matrix.zoningPermit === 'conditional' ? (
                            <span style={{
                              background: isSelected ? "rgba(255, 255, 255, 0.18)" : "transparent",
                              color: isSelected ? "#ffffff" : "#475569",
                              border: isSelected ? "1px solid rgba(255, 255, 255, 0.35)" : "1px solid #cbd5e1",
                              padding: "2px 7px",
                              borderRadius: "5px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px"
                            }}>
                              <ShieldCheck size={11} color={isSelected ? "#fde047" : "#d97706"} /> LC Conditional
                            </span>
                          ) : (
                            <span style={{
                              background: isSelected ? "rgba(255, 255, 255, 0.18)" : "transparent",
                              color: isSelected ? "#ffffff" : "#64748b",
                              border: isSelected ? "1px solid rgba(255, 255, 255, 0.35)" : "1px solid #cbd5e1",
                              padding: "2px 7px",
                              borderRadius: "5px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px"
                            }}>
                              <CheckCircle size={11} color={isSelected ? "#86efac" : "#059669"} /> LC Exempt
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
                              background: isSelected ? "rgba(255, 255, 255, 0.2)" : "#fef3c7",
                              border: isSelected ? "1px solid rgba(255, 255, 255, 0.4)" : "1px solid #fde68a",
                              color: isSelected ? "#ffffff" : "#b45309",
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
                            onMouseEnter={(e) => {
                              if (isSelected) {
                                e.currentTarget.style.background = "#ffffff";
                                e.currentTarget.style.color = "#1d4ed8";
                              } else {
                                e.currentTarget.style.background = "#d97706";
                                e.currentTarget.style.color = "#ffffff";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (isSelected) {
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                                e.currentTarget.style.color = "#ffffff";
                              } else {
                                e.currentTarget.style.background = "#fef3c7";
                                e.currentTarget.style.color = "#b45309";
                              }
                            }}
                            title="View Required Docs for this Project Type"
                          >
                            <Eye size={12} /> Required Docs
                          </button>

                          {activeAppForP ? (
                            <Link
                              href={`/applicant/track/${encodeURIComponent(activeAppForP.id)}`}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                background: "#fef3c7",
                                border: "1.5px solid #f59e0b",
                                color: "#b45309",
                                borderRadius: "6px",
                                fontSize: "0.72rem",
                                fontWeight: "800",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "5px 12px",
                                textDecoration: "none",
                                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.05)"
                              }}
                              title={`An active permit (${activeAppForP.id}) already exists. Click to view its tracking details.`}
                            >
                              <ExternalLink size={12} />
                              <span>View Active ({activeAppForP.id})</span>
                            </Link>
                          ) : rejectedAppForP ? (
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
                                background: "#16a34a",
                                border: "1.5px solid #16a34a",
                                color: "#ffffff",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.72rem",
                                fontWeight: "800",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "5px 12px",
                                boxShadow: "0 2px 8px rgba(22, 163, 74, 0.3)",
                                transition: "all 0.15s ease"
                              }}
                              title="Previous application was rejected. Click to start a new application."
                            >
                              <RotateCcw size={12} />
                              <span>Re-Apply (New Application)</span>
                            </button>
                          ) : (
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
                                background: isSelected ? "#ffffff" : "#ffffff",
                                border: isSelected ? "1.5px solid #ffffff" : "1.5px solid #cbd5e1",
                                color: isSelected ? "#1d4ed8" : "#1e293b",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.72rem",
                                fontWeight: "800",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "5px 12px",
                                boxShadow: isSelected ? "0 2px 8px rgba(0, 0, 0, 0.18)" : "none",
                                transition: "all 0.15s ease"
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = "#2563eb";
                                  e.currentTarget.style.color = "#2563eb";
                                } else {
                                  e.currentTarget.style.background = "#f8fafc";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = "#cbd5e1";
                                  e.currentTarget.style.color = "#1e293b";
                                } else {
                                  e.currentTarget.style.background = "#ffffff";
                                }
                              }}
                              title="Select this Project Type and proceed"
                            >
                              <span>{isSelected ? "Selected" : "Select"}</span>
                              <ChevronRight size={12} />
                            </button>
                          )}
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
                  <span style={{ fontSize: "0.88rem", color: "#ffffff", fontWeight: "700", textShadow: "0 1px 2px rgba(0, 0, 0, 0.25)" }}>
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
                          Locational Clearance Released & Approved
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
                          Ref: {activeClearanceRef || "Released"}
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
                        Your Locational Clearance for <strong>{selectedProjectType.name}</strong> has been officially approved and released by the Sto. Tomas Zoning Administrator / MPDO. You are cleared to proceed to <strong>Step 3: Required Permit Forms</strong>.
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
                            background: matchedClearanceApp?.status?.toLowerCase() === "approved" ? "#059669" : "#d97706",
                            color: "white",
                            fontSize: "0.72rem",
                            fontWeight: "800",
                            padding: "3px 10px",
                            borderRadius: "6px",
                            letterSpacing: "0.5px"
                          }}>
                            {matchedClearanceApp?.status?.toLowerCase() === "approved" ? "APPROVED · AWAITING RELEASE" : "AWAITING ADMIN APPROVAL"}
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
                          {matchedClearanceApp?.status?.toLowerCase() === "approved"
                            ? "Locational Clearance Approved (Pending Official Release)"
                            : "Locational Clearance Under Review"}
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
                      {matchedClearanceApp?.status?.toLowerCase() === "approved"
                        ? <>Your <strong>Application for Locational Clearance</strong> for <strong>{selectedProjectType.name}</strong> is approved, but has not yet been officially released (Stage 4). Once payment/order of payment is settled and the clearance is released, <strong>Step 3: Required Permit Forms</strong> will unlock automatically.</>
                        : <>Your <strong>Application for Locational Clearance</strong> for <strong>{selectedProjectType.name}</strong> was submitted on <strong>{matchedClearanceApp?.dateSubmitted || "recently"}</strong> and is currently being evaluated by the <strong>Sto. Tomas MPDO & Zoning Administrator</strong>.</>}
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
                      e.currentTarget.style.borderColor = "#cbd5e1";
                      e.currentTarget.style.outline = "none";
                      e.currentTarget.style.boxShadow = "0 8px 24px -4px rgba(0, 0, 0, 0.08)";
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
                            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                            border: "1.5px solid #2563eb",
                            color: "#ffffff",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.72rem",
                            fontWeight: "700",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "5px 12px",
                            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.35)",
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
              {isClearanceRequired && !isClearancePassed ? (
                <div style={{
                  background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                  border: "2px solid #f59e0b",
                  borderRadius: "20px",
                  padding: "2.5rem 2rem",
                  marginBottom: "1.5rem",
                  textAlign: "center",
                  boxShadow: "0 10px 25px -5px rgba(245, 158, 11, 0.15)"
                }}>
                  <div style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "18px",
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1.25rem auto",
                    boxShadow: "0 8px 18px rgba(217, 119, 6, 0.35)"
                  }}>
                    <Lock size={30} />
                  </div>
                  <h3 style={{ fontSize: "1.4rem", fontWeight: "900", color: "#78350f", margin: "0 0 0.5rem 0" }}>
                    Step 3 Locked: Locational Clearance Required
                  </h3>
                  <p style={{ maxWidth: "600px", margin: "0 auto 1.5rem auto", fontSize: "0.95rem", color: "#92400e", lineHeight: "1.6" }}>
                    {isClearancePending
                      ? `Your Locational Clearance (${matchedClearanceApp?.id || "submitted"}) has not yet been officially released. Under Sto. Tomas municipal permitting regulations and the National Building Code (PD 1096), you cannot proceed to Step 3 until your Locational Clearance has been released by the Zoning Administrator / MPDO.`
                      : `A valid, officially released Locational Clearance is required for ${selectedProjectType?.name || "this project"} before proceeding to technical engineering permit forms.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    style={{
                      background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      padding: "12px 24px",
                      fontSize: "0.92rem",
                      fontWeight: "800",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: "0 4px 14px rgba(217, 119, 6, 0.35)"
                    }}
                  >
                    <span>Return to Step 2: Locational Clearance</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              ) : activeExistingStage2App ? (
                <div style={{
                  background: activeExistingStage2App.status === "approved" || activeExistingStage2App.status === "released"
                    ? "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)"
                    : "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                  border: `1.5px solid ${
                    activeExistingStage2App.status === "approved" || activeExistingStage2App.status === "released"
                      ? "#86efac"
                      : "#fde68a"
                  }`,
                  borderRadius: "18px",
                  padding: "2rem",
                  marginBottom: "1.5rem",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                  textAlign: "center"
                }}>
                  <div style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    background: activeExistingStage2App.status === "approved" || activeExistingStage2App.status === "released" ? "#dcfce7" : "#fef3c7",
                    color: activeExistingStage2App.status === "approved" || activeExistingStage2App.status === "released" ? "#16a34a" : "#d97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem auto"
                  }}>
                    <Clock size={30} strokeWidth={2.5} />
                  </div>

                  <h3 style={{ fontSize: "1.35rem", fontWeight: "900", color: "#0f172a", margin: "0 0 0.5rem 0" }}>
                    Active Permit In Progress: {activeExistingStage2App.id}
                  </h3>
                  
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "1rem" }}>
                    <span style={{
                      fontSize: "0.78rem",
                      fontWeight: "800",
                      padding: "3px 10px",
                      borderRadius: "6px",
                      background: activeExistingStage2App.status === "approved" || activeExistingStage2App.status === "released" ? "#dcfce7" : "#fef9c3",
                      color: activeExistingStage2App.status === "approved" || activeExistingStage2App.status === "released" ? "#15803d" : "#b45309",
                      border: `1px solid ${activeExistingStage2App.status === "approved" || activeExistingStage2App.status === "released" ? "#86efac" : "#fde047"}`
                    }}>
                      {activeExistingStage2App.status === "approved" || activeExistingStage2App.status === "released" ? "Approved" : "Pending Review"}
                    </span>
                    <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "600" }}>
                      Clearance: {activeClearanceRef}
                    </span>
                  </div>

                  <p style={{ maxWidth: "620px", margin: "0 auto 1.5rem auto", fontSize: "0.92rem", color: "#475569", lineHeight: "1.55" }}>
                    An active permit application has already been submitted and is currently being processed for <strong>{selectedProjectType.name}</strong>. Per Sto. Tomas municipal regulations, only one (1) active permit application is allowed per project type (bawal dumoble).
                  </p>

                  <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
                    <Link
                      href={`/applicant/track/${encodeURIComponent(activeExistingStage2App.id)}`}
                      style={{
                        background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                        color: "white",
                        padding: "10px 22px",
                        borderRadius: "12px",
                        fontSize: "0.9rem",
                        fontWeight: "800",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)"
                      }}
                    >
                      <span>Track Active Application</span>
                      <ArrowRight size={16} />
                    </Link>

                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      style={{
                        background: "#ffffff",
                        border: "1.5px solid #cbd5e1",
                        color: "#334155",
                        padding: "10px 18px",
                        borderRadius: "12px",
                        fontSize: "0.9rem",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      Select Different Project Type
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {rejectedStage2App && (
                    <div style={{
                      background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
                      border: "1.5px solid #a7f3d0",
                      borderRadius: "14px",
                      padding: "1rem 1.4rem",
                      marginBottom: "1.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "12px",
                      boxShadow: "0 2px 10px rgba(5, 150, 105, 0.05)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "10px",
                          background: "#dcfce7",
                          color: "#15803d",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          <RotateCcw size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                          <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#065f46" }}>
                            Re-Application for Stage 2 Permits
                          </div>
                          <div style={{ fontSize: "0.83rem", color: "#047857", marginTop: "2px" }}>
                            Previous application <strong>{rejectedStage2App.id}</strong> was disapproved / rejected ({rejectedStage2App.remarks || 'compliance deficiencies'}). You are creating a new replacement application with corrected compliance.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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
                </>
              )}
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
                  <span style={{ fontSize: "0.88rem", color: "#ffffff", fontWeight: "700", textShadow: "0 1px 2px rgba(0, 0, 0, 0.25)" }}>
                    Site & Cadastral Mapping
                  </span>
                </div>
                <h2 style={{ fontSize: "1.65rem", fontWeight: "800", color: "#ffffff", margin: "0 0 0.35rem 0", textShadow: "0 2px 10px rgba(0, 0, 0, 0.18)" }}>
                  Mapping
                </h2>
                <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.95)", fontSize: "0.92rem", lineHeight: "1.5" }}>
                  Pinpoint your project location in Sto. Tomas, Pampanga to determine cadastral boundaries, coordinates, and zoning compliance.
                </p>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1rem" }}>
                {/* 1. Basic Details: Project Name */}
                <div className="form-group">
                  <label style={{ fontWeight: "700", color: "#ffffff", marginBottom: "0.5rem", display: "block", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>Project Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. 2-Storey Residential House" 
                    className="form-input" 
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1.5px solid #cbd5e1", background: "#ffffff" }}
                  />
                </div>
                
                {/* 2. Enlarged Full-Width Interactive Map */}
                <div>
                  <LocationPickerMap 
                    selectedBarangay={barangay}
                    initialLat={latitude ? parseFloat(latitude) : undefined}
                    initialLng={longitude ? parseFloat(longitude) : undefined}
                    height="380px"
                    onLocationChange={async (lat, lng, zone) => {
                      setLatitude(lat.toFixed(6));
                      setLongitude(lng.toFixed(6));
                      
                      if (zone) {
                        setDetectedZone(zone);
                        if (zone.barangay) {
                          setBarangay(zone.barangay);
                        }
                      }
                    }}
                  />
                </div>

                {/* 3. Detected Zoning Compliance Badge */}
                {detectedZone && (
                  <div className="animate-fade-in-up" style={{ padding: "1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", display: "flex", gap: "1rem", alignItems: "center" }}>
                    <ShieldCheck size={28} color="#16a34a" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.75rem", background: "#dcfce7", color: "#166534", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                          {(detectedZone as any)?.code || "ZONE"}
                        </span>
                        <span style={{ fontWeight: "700", color: "#166534", fontSize: "0.95rem" }}>
                          {(detectedZone as any)?.name || detectedZone.zoneType || (detectedZone.barangay ? `Brgy. ${detectedZone.barangay}` : "Zoning Compliant")}
                        </span>
                      </div>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#15803d" }}>
                        {detectedZone.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* 4. Site & Dimension Details Card (Placed underneath the map) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", background: "#f8fafc", padding: "1.5rem", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
                    <Building2 size={20} color="#2563eb" />
                    <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
                      Site & Dimension Details
                    </h4>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
                    {/* Left Sub-column: Street Address and Barangay */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div className="form-group">
                        <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.4rem", display: "block", fontSize: "0.88rem" }}>Street Address / Sitio *</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Purok 3, Poblacion Road" 
                          className="form-input" 
                          value={streetAddress}
                          onChange={e => setStreetAddress(e.target.value)}
                          style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1.5px solid #cbd5e1", background: "#ffffff" }}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.4rem", display: "block", fontSize: "0.88rem" }}>Barangay (Santo Tomas) *</label>
                        <select
                          className="form-input"
                          required
                          value={barangay}
                          onChange={e => setBarangay(e.target.value)}
                          style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1.5px solid #cbd5e1", background: "#ffffff" }}
                        >
                          {STO_TOMAS_BARANGAYS.map(b => (
                            <option key={b} value={b}>Brgy. {b}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Right Sub-column: Areas and Estimated Cost */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div className="form-group">
                          <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.4rem", display: "block", fontSize: "0.88rem" }}>Lot Area (sq.m) *</label>
                          <input 
                            type="number" 
                            required
                            placeholder="e.g. 150" 
                            className="form-input" 
                            value={lotArea}
                            onChange={e => setLotArea(e.target.value)}
                            style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1.5px solid #cbd5e1", background: "#ffffff" }}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.4rem", display: "block", fontSize: "0.88rem" }}>Floor Area (sq.m) *</label>
                          <input 
                            type="number" 
                            required
                            placeholder="e.g. 120" 
                            className="form-input" 
                            value={floorArea}
                            onChange={e => setFloorArea(e.target.value)}
                            style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1.5px solid #cbd5e1", background: "#ffffff" }}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.4rem", display: "block", fontSize: "0.88rem" }}>Estimated Project Cost (₱ PHP) *</label>
                        <input 
                          type="number" 
                          required
                          placeholder="e.g. 1500000" 
                          className="form-input" 
                          value={projectCost}
                          onChange={e => setProjectCost(e.target.value)}
                          style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1.5px solid #cbd5e1", background: "#ffffff" }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "0.25rem", padding: "0.85rem", background: "#eef2ff", borderRadius: "10px", border: "1px solid #c7d2fe", display: "flex", gap: "8px", alignItems: "center" }}>
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
                  <span style={{ fontSize: "0.88rem", color: "#ffffff", fontWeight: "700", textShadow: "0 1px 2px rgba(0, 0, 0, 0.25)" }}>
                    Final Verification & Filing
                  </span>
                </div>
                <h2 style={{ fontSize: "1.65rem", fontWeight: "800", color: "#ffffff", margin: "0 0 0.35rem 0", textShadow: "0 2px 10px rgba(0, 0, 0, 0.18)" }}>
                  Review
                </h2>
                <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.95)", fontSize: "0.92rem", lineHeight: "1.5" }}>
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
                    <span style={{ color: "#0f172a", fontWeight: "700" }}>{(detectedZone as any)?.name || detectedZone?.zoneType || "R-1 (Low-Density Residential)"}</span>
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
                          All Requirements Satisfied ({mandatoryPermitsToSubmit.length}/{mandatoryPermitsToSubmit.length})
                        </>
                      ) : (
                        <>
                          <AlertCircle size={14} />
                          {missingMandatoryPermits.length} Mandatory Pending Upload (Fire / BFP Clearance)
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div style={{ margin: "0 0 1.25rem 0", color: "#334155", fontSize: "0.92rem", lineHeight: "1.5", fontWeight: "500" }}>
                  Under the Santo Tomas Municipal Permitting Matrix and the National Building Code of the Philippines (PD 1096), technical engineering permits answered online in Step 3 are automatically compiled into your official digital permit dossier.
                </div>

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
                        Submission locked: You must attach your <strong>Fire / BFP Clearance (FSEC)</strong> below before your application can be filed. (Other mandatory technical permits were answered online in Step 3).
                      </span>
                    </div>
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
                      All mandatory engineering attachments and digital forms verified! You may now submit your application package to the Building Official.
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
                    const isBfpClearance = key === "fireBfpPermit";

                    // Specialized engineering requirement notice
                    let signeeNotice = "Digitally filled & verified online in Step 3 • Sto. Tomas NBCP standards applied.";
                    if (isBfpClearance) {
                      signeeNotice = "Requires Fire Safety Evaluation Clearance (FSEC) certificate issued by Bureau of Fire Protection (BFP Sto. Tomas).";
                    }

                    if (isBfpClearance) {
                      // Fire / BFP Clearance is the ONLY permit requiring external file upload
                      return (
                        <div 
                          key={key} 
                          style={{
                            background: doc ? "#f0fdf4" : "#fffbeb",
                            border: doc ? "1.5px solid #86efac" : "1.5px solid #fde68a",
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
                              background: doc ? "#dcfce7" : "#fee2e2",
                              color: doc ? "#15803d" : "#dc2626",
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
                                  background: "#991b1b",
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
                                  {doc ? "ATTACHED" : "UPLOAD REQUIRED"}
                                </span>
                              </div>
                              <div style={{ margin: "0 0 4px 0", fontSize: "0.85rem", color: "#1e293b", fontWeight: "600", lineHeight: "1.4" }}>
                                {meta.desc}
                              </div>
                              <div style={{ margin: 0, fontSize: "0.80rem", color: doc ? "#15803d" : "#b45309", fontStyle: "italic", fontWeight: "700" }}>
                                {doc ? "✓ Official BFP Clearance document attached" : signeeNotice}
                              </div>
                            </div>
                          </div>

                          {/* Right: Upload controls */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
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
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                <label style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "8px 14px",
                                  borderRadius: "8px",
                                  background: isUploading ? "#94a3b8" : "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                                  color: "white",
                                  fontSize: "0.8rem",
                                  fontWeight: "700",
                                  cursor: isUploading ? "wait" : "pointer",
                                  boxShadow: "0 2px 6px rgba(220, 38, 38, 0.25)",
                                  transition: "all 0.15s ease"
                                }}>
                                  <Upload size={14} />
                                  <span>{isUploading ? "Uploading..." : "Attach BFP File"}</span>
                                  <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.png,.jpg,.jpeg"
                                    disabled={isUploading}
                                    onChange={(e) => handlePermitDocUpload(key, e)}
                                    style={{ display: "none" }}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // All other mandatory permits are digital online forms answered in Step 3
                    return (
                      <div 
                        key={key} 
                        style={{
                          background: "#f0fdf4",
                          border: "1.5px solid #86efac",
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
                            background: "#dcfce7",
                            color: "#15803d",
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
                                background: "#dcfce7",
                                color: "#166534",
                                border: "1px solid #bbf7d0",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}>
                                <Check size={12} strokeWidth={3} />
                                FILLED ONLINE (STEP 3)
                              </span>
                            </div>
                            <div style={{ margin: "0 0 4px 0", fontSize: "0.85rem", color: "#1e293b", fontWeight: "600", lineHeight: "1.4" }}>
                              {meta.desc}
                            </div>
                            <div style={{ margin: 0, fontSize: "0.80rem", color: "#15803d", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                              <span>✓ Form answered & compiled digitally. No manual file attachment required.</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Template download & edit online form */}
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

                          <button
                            type="button"
                            onClick={() => goToStep(3)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "7px 12px",
                              borderRadius: "8px",
                              background: "#f8fafc",
                              border: "1px solid #cbd5e1",
                              color: "#475569",
                              fontSize: "0.78rem",
                              fontWeight: "700",
                              cursor: "pointer",
                              transition: "all 0.15s ease"
                            }}
                            title="Review or edit your online answers in Step 3"
                          >
                            <FileText size={13} color="#2563eb" />
                            <span>Edit Online Form</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CONDITIONAL PERMITS ACCORDION */}
                {conditionalPermitsToSubmit.length > 0 && (
                  <div style={{ marginTop: "1.25rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", color: "#1e293b", fontWeight: "700" }}>
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
                                  <div style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#1e293b", fontWeight: "600" }}>
                                    {meta.desc}
                                  </div>
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
                                      accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.png,.jpg,.jpeg"
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
            {currentStep > 1 && currentStep !== 3 && (
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
              ) : isClearancePending ? (
                <button 
                  className="btn-primary btn-wizard-next" 
                  disabled
                  style={{ 
                    background: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)", 
                    color: "#ffffff",
                    border: "1.5px solid transparent",
                    boxShadow: "none", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px", 
                    padding: "10px 22px", 
                    borderRadius: "10px",
                    fontWeight: "700",
                    cursor: "not-allowed",
                    opacity: 0.8
                  }}
                  title="Locational Clearance must be officially released by the Zoning Administrator before proceeding to Step 3."
                >
                  <Lock size={18} />
                  <span>Locked: Awaiting Clearance Release</span>
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
                type="button"
                className="btn-wizard-back" 
                onClick={() => {
                  try {
                    localStorage.setItem("etayo_draft_saved_notice", "Your permit form answers have been safely saved as a draft. You can continue answering anytime.");
                  } catch (e) {}
                  router.push("/applicant/dashboard");
                }}
                style={{ 
                  background: "#ffffff", 
                  color: "#334155",
                  border: "1.5px solid #cbd5e1",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  padding: "10px 22px", 
                  borderRadius: "10px",
                  fontWeight: "800",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                  e.currentTarget.style.borderColor = "#94a3b8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                }}
                title="Save draft answers and return to dashboard to answer later"
              >
                <BookmarkCheck size={18} color="#4f46e5" />
                <span>Answer Later</span>
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
                {!isAllMandatoryAttached ? (
                  <button 
                    disabled 
                    className="btn-primary" 
                    style={{ 
                      opacity: 0.6, 
                      cursor: 'not-allowed', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: "11px 24px", 
                      borderRadius: "10px",
                      background: "#94a3b8",
                      boxShadow: "none"
                    }}
                    title={`Please attach all mandatory documents before submitting (${missingMandatoryPermits.length} pending)`}
                  >
                    <Lock size={18} />
                    <span>Submit Application ({missingMandatoryPermits.length} Required Docs Pending)</span>
                  </button>
                ) : (
                  <button 
                    className="btn-primary" 
                    onClick={handleSubmitApplication}
                    disabled={isSubmitting}
                    style={{ 
                      background: isSubmitting
                        ? "linear-gradient(135deg, #64748b 0%, #475569 100%)"
                        : "linear-gradient(135deg, #10b981 0%, #059669 100%)", 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: "11px 24px", 
                      borderRadius: "10px",
                      cursor: isSubmitting ? 'wait' : 'pointer',
                      boxShadow: isSubmitting ? "none" : "0 4px 14px rgba(16, 185, 129, 0.35)",
                      border: "none",
                      color: "white",
                      fontWeight: "700",
                      fontSize: "0.95rem",
                      transition: "all 0.2s ease"
                    }}
                    title="Submit your complete application dossier to Sto. Tomas Building Official"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        <span>Filing Application Package...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Complete Application</span>
                        <CheckCircle size={18} />
                      </>
                    )}
                  </button>
                )}
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
                background: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)",
                color: "white",
                padding: "1.25rem 1.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem"
              }}>
                <h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: "800", letterSpacing: "-0.01em", color: "#ffffff" }}>
                  Permits Needed for {selectedProjectType.name}
                </h3>

                <button
                  type="button"
                  onClick={() => setShowRequirementsAlert(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.18)",
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
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.18)"; }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* ALERT BODY */}
              <div style={{ padding: "1.5rem 1.75rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* STATUS SUMMARY BANNER */}
                <div style={{
                  background: "#f8fafc",
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
                    <Info size={18} color="#2563eb" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: "0.86rem", color: "#334155", lineHeight: "1.4" }}>
                      Under the Santo Tomas Municipal Permitting Matrix, the following engineering permits are required for this <strong>{selectedProjectType.category}</strong> project:
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "#1d4ed8", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: "5px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <Check size={11} strokeWidth={2.5} color="#2563eb" /> {mandatory.length} Mandatory
                    </span>
                    {conditional.length > 0 && (
                      <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "#475569", background: "#ffffff", border: "1px solid #cbd5e1", padding: "2px 8px", borderRadius: "5px" }}>
                        {conditional.length} Conditional
                      </span>
                    )}
                  </div>
                </div>

                {/* 1. MANDATORY PERMITS NEEDED */}
                <div>
                  <h4 style={{ margin: "0 0 0.65rem 0", fontSize: "0.98rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "7px" }}>
                    <CheckCircle2 size={18} color="#2563eb" />
                    Mandatory Permits for this Project ({mandatory.length} Required)
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                    {mandatory.map((p) => {
                      return (
                        <div key={p.key} style={{
                          background: "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)",
                          border: "1.5px solid #1d4ed8",
                          borderRadius: "12px",
                          padding: "0.85rem 1.1rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.75rem",
                          boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                          transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.outline = "none";
                          e.currentTarget.style.boxShadow = "0 6px 18px rgba(37, 99, 235, 0.35)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.outline = "none";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.2)";
                          e.currentTarget.style.transform = "none";
                        }}
                        >
                          <div>
                            <h5 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "800", color: "#ffffff" }}>
                              {p.label}
                            </h5>
                            <div style={{ fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.9)", marginTop: "2px" }}>
                              {p.desc}
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
                                  padding: "5px 11px",
                                  borderRadius: "6px",
                                  background: "#ffffff",
                                  color: "#1d4ed8",
                                  border: "1px solid #ffffff",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  textDecoration: "none",
                                  transition: "all 0.15s ease",
                                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.12)"
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.color = "#1e40af"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.color = "#1d4ed8"; }}
                                title={`Download official ${p.label} PDF`}
                              >
                                <Download size={12} color="#1d4ed8" /> Official PDF
                              </a>
                            )}
                            <span style={{
                              fontSize: "0.7rem",
                              fontWeight: "700",
                              padding: "4px 9px",
                              borderRadius: "6px",
                              background: "rgba(255, 255, 255, 0.22)",
                              color: "#ffffff",
                              border: "1px solid rgba(255, 255, 255, 0.4)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}>
                              <Check size={11} strokeWidth={2.5} color="#86efac" /> MANDATORY
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
                      <AlertCircle size={18} color="#2563eb" />
                      Conditional Permits ({conditional.length} Depending on Scope)
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                      {conditional.map((p) => {
                        return (
                          <div key={p.key} style={{
                            background: "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)",
                            border: "1.5px solid #1d4ed8",
                            borderRadius: "12px",
                            padding: "0.85rem 1.1rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.75rem",
                            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                            transition: "all 0.15s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.outline = "none";
                            e.currentTarget.style.boxShadow = "0 6px 18px rgba(37, 99, 235, 0.35)";
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.outline = "none";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.2)";
                            e.currentTarget.style.transform = "none";
                          }}
                          >
                            <div>
                              <h5 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "800", color: "#ffffff" }}>
                                {p.label}
                              </h5>
                              <div style={{ fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.9)", marginTop: "2px" }}>
                                Condition: {p.condition}
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
                                    padding: "5px 11px",
                                    borderRadius: "6px",
                                    background: "#ffffff",
                                    color: "#1d4ed8",
                                    border: "1px solid #ffffff",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    textDecoration: "none",
                                    transition: "all 0.15s ease",
                                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.12)"
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.color = "#1e40af"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.color = "#1d4ed8"; }}
                                  title={`Download official ${p.label} PDF`}
                                >
                                  <Download size={12} color="#1d4ed8" /> Official PDF
                                </a>
                              )}
                              <span style={{
                                fontSize: "0.7rem",
                                fontWeight: "700",
                                padding: "4px 9px",
                                borderRadius: "6px",
                                background: "rgba(255, 255, 255, 0.22)",
                                color: "#ffffff",
                                border: "1px solid rgba(255, 255, 255, 0.4)"
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
                          background: "#f8fafc",
                          color: "#64748b",
                          border: "1px solid #cbd5e1",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px"
                        }}>
                          <strong style={{ color: "#1e40af" }}>{p.code}</strong>: {p.label} (Not Required)
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
                      color: "#1e293b",
                      borderRadius: "8px",
                      padding: "7px 14px",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.background = "#eff6ff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#1e293b"; e.currentTarget.style.background = "#ffffff"; }}
                  >
                    <Download size={14} /> All 16 Templates
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      background: "#ffffff",
                      border: "1.5px solid #cbd5e1",
                      color: "#1e293b",
                      borderRadius: "8px",
                      padding: "7px 14px",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.background = "#eff6ff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#1e293b"; e.currentTarget.style.background = "#ffffff"; }}
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
                      color: "#475569",
                      borderRadius: "8px",
                      padding: "7px 14px",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#475569"; }}
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
                      background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                      color: "white",
                      border: "1.5px solid #2563eb",
                      borderRadius: "8px",
                      padding: "7px 16px",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 2px 8px rgba(37, 99, 235, 0.35)",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.45)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(37, 99, 235, 0.35)";
                    }}
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
