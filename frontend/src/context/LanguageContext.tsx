"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Language = "en" | "fil";

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Navigation & Sidebar
    dashboard: "Dashboard",
    newApplication: "New Application",
    applicationStatus: "Application Status",
    existingApplication: "Existing Application",
    map: "Map",
    messages: "Messages",
    signOut: "Sign Out",
    reviewHub: "Review Hub",
    officialForms: "Official Forms",
    queryInspect: "Query & Inspect",
    staffEvaluations: "Staff Evaluations",
    securityAuth: "Security & Auth",
    formTester: "Form Testing Studio",
    reviewWorkspaces: "Review Workspaces",
    applicantManagement: "Applicants Management",
    staffManagement: "Staff Management",
    settings: "Settings",
    mainMenu: "MAIN MENU",
    adminPanel: "ADMIN PANEL",
    language: "Language",
    languageSwitchPrompt: "Switch Language",
    english: "English",
    filipino: "Filipino",

    // Applicant Dashboard
    applicantDashboardTitle: "Applicant Dashboard",
    welcomeBack: "Welcome back",
    dashboardSubtitle: "Track and manage your permit dossiers and technical applications.",
    projectDossiers: "Project Dossiers",
    activeProjectSites: "Active project sites",
    totalForms: "Total Forms",
    clearancePermitForms: "Clearance & permit forms",
    underReview: "Under Review",
    awaitingMunicipalEvaluation: "Awaiting municipal evaluation",
    approvedAndReleased: "Approved & Released",
    clearancesPermitsGranted: "Clearances & permits granted",
    recentApplications: "Recent Applications",
    archivedCountSuffix: "Archived",
    searchPlaceholder: "Search projects, IDs, or permit type...",
    allStatus: "All Status",
    statusPending: "Pending Review",
    statusUnderReview: "Under Review",
    statusApproved: "Approved",
    statusReleased: "Permit Released",
    statusActionRequired: "Action Required",
    statusRejected: "Disapproved / Rejected",
    statusCancelled: "Cancelled",
    statusProcessing: "Processing",
    archiveAction: "Archive",
    unarchiveAction: "Unarchive",
    trackAndDetails: "Track & Details",
    submittedPrefix: "Submitted",
    connectedPermitForms: "Connected Permit Forms",
    formAwaitingReview: "Form Awaiting Review",
    formsAwaitingReview: "Forms Awaiting Review",
    locationalClearance: "Locational Clearance",
    buildingPermit: "Building Permit",
    occupancyPermit: "Occupancy Permit",
    viewProjectDossiers: "Group by Project",
    viewIndividualForms: "Individual Forms",
    expandAll: "Expand All",
    collapseAll: "Collapse All",
    noApplicationsFound: "No Applications Found",
    noApplicationsDesc: "You don't have any permit applications matching your current filter.",
    startNewApplication: "Start New Application",

    // General / Municipal
    stoTomasPampanga: "Sto. Tomas, Pampanga",
    systemFooter: "© 2026 eTAYO System",
  },
  fil: {
    // Navigation & Sidebar
    dashboard: "Dashboard",
    newApplication: "Bagong Aplikasyon",
    applicationStatus: "Katayuan ng Aplikasyon",
    existingApplication: "Kasalukuyang Aplikasyon",
    map: "Mapa",
    messages: "Mga Mensahe",
    signOut: "Mag-sign Out",
    reviewHub: "Sentro ng Pagsusuri",
    officialForms: "Mga Opisyal na Form",
    queryInspect: "Suriin at Inspeksyunin",
    staffEvaluations: "Pagsusuri ng Kawani",
    securityAuth: "Seguridad at Pagpapatotoo",
    formTester: "Studio sa Pagsubok ng Form",
    reviewWorkspaces: "Lugar ng Pagsusuri",
    applicantManagement: "Pamamahala ng Aplikante",
    staffManagement: "Pamamahala ng Kawani",
    settings: "Mga Setting",
    mainMenu: "PANGUNAHING MENU",
    adminPanel: "PANEL NG ADMIN",
    language: "Wika",
    languageSwitchPrompt: "Pumili ng Wika",
    english: "English",
    filipino: "Filipino",

    // Applicant Dashboard
    applicantDashboardTitle: "Dashboard ng Aplikante",
    welcomeBack: "Maligayang pagbabalik",
    dashboardSubtitle: "Subaybayan at pamahalaan ang iyong mga permit dossier at teknikal na aplikasyon.",
    projectDossiers: "Mga Dossier ng Proyekto",
    activeProjectSites: "Mga aktibong site ng proyekto",
    totalForms: "Kabuuang mga Form",
    clearancePermitForms: "Mga clearance at permit form",
    underReview: "Kasalukuyang Sinusuri",
    awaitingMunicipalEvaluation: "Naghihintay ng pagsusuri ng munisipyo",
    approvedAndReleased: "Aprubado at Naipalabas",
    clearancesPermitsGranted: "Mga naaprubahang permit at clearance",
    recentApplications: "Kamakailang mga Aplikasyon",
    archivedCountSuffix: "Naka-archive",
    searchPlaceholder: "Maghanap ng proyekto, ID, o uri ng permit...",
    allStatus: "Lahat ng Katayuan",
    statusPending: "Naghihintay ng Pagsusuri",
    statusUnderReview: "Kasalukuyang Sinusuri",
    statusApproved: "Aprubado",
    statusReleased: "Naipalabas na ang Permit",
    statusActionRequired: "Kailangang Aksyunan",
    statusRejected: "Tinanggihan / Disapproved",
    statusCancelled: "Kinansela",
    statusProcessing: "Pinoproseso",
    archiveAction: "I-archive",
    unarchiveAction: "Ibalik mula sa Archive",
    trackAndDetails: "Subaybayan at Detalye",
    submittedPrefix: "Isinumite noong",
    connectedPermitForms: "Kaugnay na mga Permit Form",
    formAwaitingReview: "Form na Naghihintay ng Pagsusuri",
    formsAwaitingReview: "Mga Form na Naghihintay ng Pagsusuri",
    locationalClearance: "Locational Clearance",
    buildingPermit: "Building Permit",
    occupancyPermit: "Occupancy Permit",
    viewProjectDossiers: "Igrupo ayon sa Proyekto",
    viewIndividualForms: "Bawat Form",
    expandAll: "Ipakita Lahat",
    collapseAll: "Itupi Lahat",
    noApplicationsFound: "Walang Nakitang Aplikasyon",
    noApplicationsDesc: "Wala kayong aplikasyon na tumutugma sa kasalukuyang filter.",
    startNewApplication: "Magsimula ng Bagong Aplikasyon",

    // General / Municipal
    stoTomasPampanga: "Sto. Tomas, Pampanga",
    systemFooter: "© 2026 Sistema ng eTAYO",
  }
};

export interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("etayo_language") as Language | null;
      if (stored === "en" || stored === "fil") {
        setLanguageState(stored);
        if (typeof document !== "undefined") {
          document.documentElement.lang = stored;
        }
      }
    } catch (e) {
      console.warn("Could not read language from localStorage", e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("etayo_language", lang);
      if (typeof document !== "undefined") {
        document.documentElement.lang = lang;
      }
      // Broadcast change event for cross-tab or non-React listeners
      window.dispatchEvent(new CustomEvent("etayo_language_changed", { detail: lang }));
    } catch (e) {
      console.warn("Could not save language to localStorage", e);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "fil" : "en");
  }, [language, setLanguage]);

  const t = useCallback((key: string, fallback?: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (dict[key] !== undefined) {
      return dict[key];
    }
    return fallback !== undefined ? fallback : key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextProps {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside LanguageProvider
    return {
      language: "en",
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key: string, fallback?: string) => fallback !== undefined ? fallback : key
    };
  }
  return context;
}
