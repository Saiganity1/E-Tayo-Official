"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

export type Language = "en" | "fil";

export const SYSTEM_WIDE_DICTIONARY: Record<string, string> = {
  // Homepage & Header Nav
  "OFFICE OF THE BUILDING OFFICIAL": "TANGGAPAN NG OPISYAL NG GUSALI",
  "Office of the Building Official": "Tanggapan ng Opisyal ng Gusali",
  "A Geospatially Enabled Permit Management and Building Monitoring System for the Local Government Unit of Sto. Tomas, Pampanga.": "Isang Geospatially Enabled na Sistema ng Pamamahala ng Permit at Pagsubaybay sa Gusali para sa Pamahalaang Bayan ng Sto. Tomas, Pampanga.",
  "Start New Application": "Magsimula ng Bagong Aplikasyon",
  "Application Status": "Katayuan ng Aplikasyon",
  "Track Applications": "Subaybayan ang mga Aplikasyon",
  "Track Application": "Subaybayan ang Aplikasyon",
  "Apply Now": "Mag-apply Ngayon",
  "Log In": "Mag-log In",
  "Sign In": "Mag-sign In",
  "Sign Out": "Mag-sign Out",
  "Register": "Magrehistro",
  "Create Account": "Gumawa ng Account",
  "Home": "Tahanan",
  "Permit Types": "Mga Uri ng Permit",
  "Three Easy Steps to Secure Your Permits": "Tatlong Madaling Hakbang upang Makuha ang Inyong mga Permit",
  "Frequently Asked Questions": "Mga Madalas Itanong (FAQ)",
  "Explore Sto. Tomas Zoning & Land Use": "Galugarin ang Zoning at Gamit ng Lupa sa Sto. Tomas",
  "Quick Links": "Mabilisang mga Link",
  "Contact Us": "Makipag-ugnayan sa Amin",
  "Office Hours": "Oras ng Opisina",
  "Monday to Friday, 8:00 AM - 5:00 PM": "Lunes hanggang Biyernes, 8:00 AM - 5:00 PM",
  "Sto. Tomas, Pampanga": "Sto. Tomas, Pampanga",
  "© 2026 eTAYO System": "© 2026 Sistema ng eTAYO",
  "All rights reserved.": "Lahat ng karapatan ay nakalaan.",

  // Dashboard Nav & Header
  "Applicant Dashboard": "Dashboard ng Aplikante",
  "Staff Dashboard": "Dashboard ng Kawani",
  "Admin Dashboard": "Dashboard ng Admin",
  "Review Hub": "Sentro ng Pagsusuri",
  "Official Forms": "Mga Opisyal na Form",
  "Query & Inspect": "Suriin at Inspeksyunin",
  "Staff Evaluations": "Pagsusuri ng Kawani",
  "Security & Auth": "Seguridad at Pagpapatotoo",
  "Form Testing Studio": "Studio sa Pagsubok ng Form",
  "Review Workspaces": "Lugar ng Pagsusuri",
  "Applicants Management": "Pamamahala ng mga Aplikante",
  "Staff Management": "Pamamahala ng mga Kawani",
  "Settings": "Mga Setting",
  "Messages": "Mga Mensahe",
  "Map": "Mapa",
  "Main Menu": "Pangunahing Menu",
  "MAIN MENU": "PANGUNAHING MENU",
  "Admin Panel": "Panel ng Admin",
  "ADMIN PANEL": "PANEL NG ADMIN",
  "Language": "Wika",
  "Language / Wika": "Wika / Language",
  "Wika / Language": "Wika / Language",
  "English": "English",
  "Filipino": "Filipino",

  // Applicant Dashboard Details
  "Welcome back,": "Maligayang pagbabalik,",
  "Welcome back": "Maligayang pagbabalik",
  "Track and manage your permit dossiers and technical applications.": "Subaybayan at pamahalaan ang iyong mga permit dossier at teknikal na aplikasyon.",
  "New Application": "Bagong Aplikasyon",
  "Existing Application": "Kasalukuyang Aplikasyon",
  "Project Dossiers": "Mga Dossier ng Proyekto",
  "PROJECT DOSSIERS": "MGA DOSSIER NG PROYEKTO",
  "Active project sites": "Mga aktibong site ng proyekto",
  "Total Forms": "Kabuuang mga Form",
  "TOTAL FORMS": "KABUUANG MGA FORM",
  "Clearance & permit forms": "Mga clearance at permit form",
  "Under Review": "Kasalukuyang Sinusuri",
  "UNDER REVIEW": "KASALUKUYANG SINUSURI",
  "Awaiting municipal evaluation": "Naghihintay ng pagsusuri ng munisipyo",
  "Approved & Released": "Aprubado at Naipalabas",
  "APPROVED & RELEASED": "APRUBADO AT NAIPALABAS",
  "Clearances & permits granted": "Mga naaprubahang permit at clearance",
  "Recent Applications": "Kamakailang mga Aplikasyon",
  "Search projects, IDs, or permit types...": "Maghanap ng mga proyekto, ID, o uri ng permit...",
  "Search projects, IDs, or permit typ": "Maghanap ng mga proyekto, ID, o uri ng permit",
  "Search projects, IDs, or permit type": "Maghanap ng mga proyekto, ID, o uri ng permit",
  "All Status": "Lahat ng Katayuan",
  "Pending Review": "Naghihintay ng Pagsusuri",
  "Pending": "Naghihintay",
  "Approved": "Aprubado",
  "Permit Released": "Naipalabas na ang Permit",
  "Action Required": "Kailangang Aksyunan",
  "Action Required on Requirements": "Kailangang Aksyunan sa mga Rekisito",
  "Disapproved / Rejected": "Tinanggihan / Disapproved",
  "Disapproved": "Tinanggihan",
  "Rejected": "Tinanggihan",
  "Cancelled": "Kinansela",
  "Processing": "Pinoproseso",
  "Archive": "I-archive",
  "Archived": "Naka-archive",
  "Track & Details": "Subaybayan at Detalye",
  "Submitted:": "Isinumite:",
  "Submitted": "Isinumite",
  "Connected Permit Forms": "Kaugnay na mga Permit Form",
  "Connected Permit Form": "Kaugnay na Permit Form",
  "Form Awaiting Review": "Form na Naghihintay ng Pagsusuri",
  "Forms Awaiting Review": "Mga Form na Naghihintay ng Pagsusuri",
  "All Forms Approved ✓": "Lahat ng Form ay Aprubado ✓",
  "No project dossiers found": "Walang natagpuang mga dossier ng proyekto",
  "Try adjusting your search query or status filters.": "Subukang baguhin ang iyong paghahanap o status filter.",
  "Single-Detached House": "Single-Detached na Bahay",
  "Installation & Construction": "Pag-iinstall at Konstruksyon",
  "Commercial Building": "Komersyal na Gusali",
  "Warehouse": "Bodega / Warehouse",
  "Stage 1": "Unang Yugto",
  "Stage 2": "Ikalawang Yugto",
  "Stage 3": "Ikatlong Yugto",
  "Stage 1 - Locational Clearance": "Yugto 1 - Locational Clearance",
  "Stage 2 - Building Permit": "Yugto 2 - Building Permit",
  "Stage 3 - Occupancy Permit": "Yugto 3 - Occupancy Permit",
  "Locational Clearance": "Locational Clearance",
  "Building Permit": "Building Permit",
  "Occupancy Permit": "Occupancy Permit",

  // Common UI actions & Buttons
  "Submit": "Isumite",
  "Cancel": "Kanselahin",
  "Confirm": "Kumpirmahin",
  "Save": "I-save",
  "Save Changes": "I-save ang mga Pagbabago",
  "Save & Continue": "I-save at Magpatuloy",
  "Back": "Bumalik",
  "Next": "Susunod",
  "Next Step": "Susunod na Hakbang",
  "Previous Step": "Nakaraang Hakbang",
  "Close": "Isara",
  "Delete": "Burahin",
  "Edit": "I-edit",
  "Download": "I-download",
  "Upload": "I-upload",
  "View": "Tingnan",
  "View Details": "Tingnan ang Detalye",
  "Copy": "Kopyahin",
  "Copied!": "Nakopya na!",
  "Loading...": "Naglo-load...",
  "Please wait...": "Mangyaring maghintay...",
  "Success": "Matagumpay",
  "Error": "May Problema",
  "Warning": "Babala",
  "Notice": "Pabatid",

  // Chatbot
  "AI OFFICER": "AI OPISYAL",
  "Ask Mang Tomas": "Magtanong kay Mang Tomas",
  "Suggested Inquiries:": "Mga Mungkahing Tanong:",
  "Mang Tomas is thinking": "Nag-iisip si Mang Tomas",
  "Online • Sto. Tomas OBO": "Online • Sto. Tomas OBO",
  "Online • Sto. Tomas OBO (ML-Powered)": "Online • Sto. Tomas OBO (Gawa sa ML)",
  "Ask Mang Tomas (English, Tagalog, Taglish)...": "Magtanong kay Mang Tomas (Tagalog, English, Taglish)...",

  // Form Fields & Wizard
  "Applicant Information": "Impormasyon ng Aplikante",
  "Project Details": "Mga Detalye ng Proyekto",
  "Document Uploads": "Mga I-uupload na Dokumento",
  "Review & Submit": "Suriin at Isumite",
  "Project Title": "Pamagat ng Proyekto",
  "Project Scope": "Saklaw ng Proyekto",
  "Estimated Project Cost": "Tinatayang Gastos ng Proyekto",
  "Upload Plans & Documents": "I-upload ang mga Plano at Dokumento",
  "First Name": "Pangalan",
  "Last Name": "Apelyido",
  "Middle Name": "Gitnang Pangalan",
  "Full Name": "Buong Pangalan",
  "Applicant Name": "Pangalan ng Aplikante",
  "Contact Number": "Numero ng Telepono",
  "Phone Number": "Numero ng Telepono",
  "Email Address": "Email Address",
  "Project Address": "Lugar ng Proyekto",
  "Address": "Tirahan",
  "Barangay": "Barangay",
  "Municipality": "Bayan / Munisipyo",
  "Province": "Lalawigan",
  "Zip Code": "Zip Code",
  "Lot Number": "Numero ng Lote",
  "Block Number": "Numero ng Bloke",
  "TCT Number": "Numero ng TCT (Titulo)",
  "Tax Declaration Number": "Numero ng Tax Declaration",
  "Estimated Cost": "Tinatayang Halaga",
  "Floor Area": "Sukat ng Sahig (Floor Area)",
  "Total Floor Area": "Kabuuang Sukat ng Sahig",
  "Number of Storeys": "Bilang ng Palapag",
  "Building Classification": "Uri ng Gusali",
  "Residential": "Tirahan (Residential)",
  "Commercial": "Komersyal",
  "Industrial": "Industriyal",
  "Institutional": "Institusyonal",
  "Agricultural": "Pangsakahan (Agricultural)",

  // Requirements & Fees
  "Requirements": "Mga Rekisito",
  "Fees": "Mga Bayarin",
  "Estimated Fees": "Tinatayang mga Bayarin",
  "Payment": "Pagbabayad",
  "Paid": "Bayad Na",
  "Unpaid": "Hindi Pa Bayad",
  "Order of Payment": "Kautusan sa Pagbabayad",
  "Order of Payment No.": "Numero ng Order of Payment",
  "Official Receipt No.": "Numero ng Opisyal na Resibo",
  "Amount Due": "Halagang Babayaran",
  "Pay Now": "Magbayad Ngayon",
  "Upload Proof of Payment": "Mag-upload ng Katibayan ng Bayad",
  "Payment Method": "Paraan ng Pagbabayad",
  "Cash": "Cash",
  "Online Payment": "Online Payment",
  "Bank Transfer": "Bank Transfer",

  // Notifications & User
  "Notifications": "Mga Abiso",
  "No notifications": "Walang mga abiso",
  "Mark all as read": "Markahan lahat bilang nabasa",
  "Profile": "Profile",
  "Account": "Account",
  "Role": "Gampanin",
  "APPLICANT": "APLIKANTE",
  "STAFF": "KAWANI",
  "ADMIN": "ADMIN",
  "PUBLIC": "PUBLIKO"
};

// Sort dictionary phrases by descending length so multi-word phrases match before single words
const SORTED_PHRASES = Object.keys(SYSTEM_WIDE_DICTIONARY).sort((a, b) => b.length - a.length);

/**
 * Translates a given English string into Tagalog/Filipino.
 */
export function translateToFilipino(text: string): string {
  if (!text || typeof text !== "string") return text;
  const trimmed = text.trim();
  if (!trimmed) return text;

  // 1. Direct exact phrase match
  if (SYSTEM_WIDE_DICTIONARY[trimmed]) {
    const leading = text.match(/^\s*/)?.[0] || "";
    const trailing = text.match(/\s*$/)?.[0] || "";
    return leading + SYSTEM_WIDE_DICTIONARY[trimmed] + trailing;
  }

  // 2. Sub-phrase replacements
  let result = text;
  let hasMatch = false;

  for (const phrase of SORTED_PHRASES) {
    if (result.includes(phrase)) {
      result = result.split(phrase).join(SYSTEM_WIDE_DICTIONARY[phrase]);
      hasMatch = true;
    }
  }

  return hasMatch ? result : text;
}

export interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const isTranslatingRef = useRef(false);

  // Initialize language from localStorage
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
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("etayo_language", lang);
      if (typeof document !== "undefined") {
        document.documentElement.lang = lang;
      }
      window.dispatchEvent(new CustomEvent("etayo_language_changed", { detail: lang }));
    } catch (e) {
      console.warn("Could not save language to localStorage", e);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "fil" : "en");
  }, [language, setLanguage]);

  const t = useCallback((keyOrPhrase: string, fallback?: string): string => {
    if (language === "en") {
      return fallback !== undefined ? fallback : keyOrPhrase;
    }
    // Check dictionary
    if (SYSTEM_WIDE_DICTIONARY[keyOrPhrase]) {
      return SYSTEM_WIDE_DICTIONARY[keyOrPhrase];
    }
    if (fallback && SYSTEM_WIDE_DICTIONARY[fallback]) {
      return SYSTEM_WIDE_DICTIONARY[fallback];
    }
    return translateToFilipino(fallback !== undefined ? fallback : keyOrPhrase);
  }, [language]);

  /**
   * System-Wide Deep DOM Translator
   * Automatically inspects text nodes and translates them when language === "fil",
   * and restores original text when language === "en".
   */
  useEffect(() => {
    if (typeof window === "undefined" || !document.body) return;

    const translateDOMNode = (node: Node) => {
      // Skip scripts, styles, pre, code
      const parent = node.parentElement;
      if (parent) {
        const tag = parent.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "CODE" || tag === "PRE") {
          return;
        }
        if (parent.getAttribute("contenteditable") === "true") {
          return;
        }
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue;
        if (!text || !text.trim()) return;

        const nodeAny = node as any;
        if (nodeAny.__etayoOrigText === undefined) {
          nodeAny.__etayoOrigText = text;
        }

        if (language === "fil") {
          const translated = translateToFilipino(nodeAny.__etayoOrigText);
          if (node.nodeValue !== translated) {
            node.nodeValue = translated;
          }
        } else {
          if (node.nodeValue !== nodeAny.__etayoOrigText) {
            node.nodeValue = nodeAny.__etayoOrigText;
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        
        // Translate placeholders
        if (el.getAttribute("placeholder")) {
          const placeholder = el.getAttribute("placeholder")!;
          if (!el.getAttribute("data-etayo-orig-placeholder")) {
            el.setAttribute("data-etayo-orig-placeholder", placeholder);
          }
          const orig = el.getAttribute("data-etayo-orig-placeholder")!;
          if (language === "fil") {
            const trans = translateToFilipino(orig);
            if (el.getAttribute("placeholder") !== trans) {
              el.setAttribute("placeholder", trans);
            }
          } else {
            if (el.getAttribute("placeholder") !== orig) {
              el.setAttribute("placeholder", orig);
            }
          }
        }

        // Translate title
        if (el.getAttribute("title")) {
          const title = el.getAttribute("title")!;
          if (!el.getAttribute("data-etayo-orig-title")) {
            el.setAttribute("data-etayo-orig-title", title);
          }
          const orig = el.getAttribute("data-etayo-orig-title")!;
          if (language === "fil") {
            const trans = translateToFilipino(orig);
            if (el.getAttribute("title") !== trans) {
              el.setAttribute("title", trans);
            }
          } else {
            if (el.getAttribute("title") !== orig) {
              el.setAttribute("title", orig);
            }
          }
        }
      }
    };

    const walk = (root: Node) => {
      translateDOMNode(root);
      let child = root.firstChild;
      while (child) {
        walk(child);
        child = child.nextSibling;
      }
    };

    const executeTranslation = () => {
      if (isTranslatingRef.current) return;
      isTranslatingRef.current = true;
      try {
        walk(document.body);
      } finally {
        isTranslatingRef.current = false;
      }
    };

    // Run initial walk
    executeTranslation();

    // Set up MutationObserver to translate any newly added or updated elements
    const observer = new MutationObserver(() => {
      if (!isTranslatingRef.current) {
        executeTranslation();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      observer.disconnect();
    };
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
    return {
      language: "en",
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (keyOrPhrase: string, fallback?: string) => fallback !== undefined ? fallback : keyOrPhrase
    };
  }
  return context;
}
