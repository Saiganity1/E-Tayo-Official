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
  "Log In Now": "Mag-log In Ngayon",
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
  "Authentication Required": "Kailangan ang Pagpapatotoo",
  "You need to be logged in to apply for a permit. Please log in to your account to continue.": "Kailangan mong mag-log in upang mag-apply para sa permit. Mangyaring mag-log in sa iyong account upang magpatuloy.",

  // Dashboard Nav & Header
  "Dashboard": "Dashboard",
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

  // Applicant Dashboard Details & KPI Cards
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
  "Search project name, reference ID, barangay...": "Maghanap ng pangalan ng proyekto, reference ID, barangay...",
  "Search projects, tracking number, or street...": "Maghanap ng mga proyekto, numero ng pagsubaybay, o kalye...",
  "All Status": "Lahat ng Katayuan",
  "All Statuses": "Lahat ng Katayuan",
  "Pending Review": "Naghihintay ng Pagsusuri",
  "Pending": "Naghihintay",
  "Approved": "Aprubado",
  "Permit Released": "Naipalabas na ang Permit",
  "Action Required": "Kailangang Aksyunan",
  "ACTION REQUIRED": "KAILANGANG AKSYUNAN",
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
  "Stage 1": "Yugto 1",
  "Stage 2": "Yugto 2",
  "Stage 3": "Yugto 3",
  "Stage 1 - Locational Clearance": "Yugto 1 - Locational Clearance",
  "Stage 2 - Building Permit": "Yugto 2 - Building Permit",
  "Stage 3 - Occupancy Permit": "Yugto 3 - Occupancy Permit",
  "Locational Clearance": "Locational Clearance",
  "Building Permit": "Building Permit",
  "Occupancy Permit": "Occupancy Permit",

  // Tracker KPI Cards & Controls
  "Active Permits": "Mga Aktibong Permit",
  "ACTIVE PERMITS": "MGA AKTIBONG PERMIT",
  "Under Evaluation": "Kasalukuyang Sinusuri",
  "UNDER EVALUATION": "KASALUKUYANG SINUSURI",
  "Archived Permits": "Mga Naka-archive na Permit",
  "ARCHIVED PERMITS": "MGA NAKA-ARCHIVE NA PERMIT",
  "Active Total": "Kabuuang Aktibo",
  "Dossier View": "Tingnan bilang Dossier",
  "Flat List": "Talaang Flat",
  "View Full Timeline": "Tingnan ang Buong Timeline",
  "Re-Apply": "Mag-apply Muli",
  "All Permit Types": "Lahat ng Uri ng Permit",
  "Stage 1 · Locational Clearance": "Yugto 1 · Locational Clearance",
  "Stage 2 · Unified Technical Permits": "Yugto 2 · Pinag-isang mga Teknikal na Permit",
  "Reset Filters": "I-reset ang mga Filter",
  "Sync Live Status": "I-sync ang Katayuan",
  "Syncing...": "Sini-sync...",
  "Click to show all active applications": "I-click para ipakita ang lahat ng aktibong aplikasyon",
  "Click to filter by Under Evaluation": "I-click para salain ayon sa Kasalukuyang Sinusuri",
  "Click to filter by Approved & Released": "I-click para salain ayon sa Aprubado at Naipalabas",
  "Click to filter by Action Required": "I-click para salain ayon sa Kailangang Aksyunan",
  "Click to view Archived applications": "I-click para tingnan ang mga naka-archive na aplikasyon",
  "Click to copy Tracking ID": "I-click para kopyahin ang Tracking ID",
  "Cancel Permit Application?": "Kanselahin ang Aplikasyon ng Permit?",
  "Are you sure you want to cancel this application? Once cancelled, municipal evaluation will be stopped. The record will remain archived in your Application Status as Cancelled.": "Sigurado ka bang nais mong kanselahin ang aplikasyong ito? Kapag nakansela, hihinto ang pagsusuri ng munisipyo. Ang rekord ay mananatiling naka-archive sa Katayuan ng Aplikasyon bilang Kinansela.",
  "Reason for Cancellation:": "Dahilan ng Pagkansela:",
  "Change of project plans": "Pagbabago sa plano ng proyekto",
  "Change of project plans / design modifications": "Pagbabago sa plano ng proyekto / modipikasyon sa disenyo",
  "Duplicate submission": "Dobleng pagsusumite",
  "Accidental duplicate submission": "Hindi sinasadyang dobleng pagsusumite",
  "Project postponed / cancelled": "Proyekto ay ipinagpaliban o kinansela",
  "Project postponed or delayed indefinitely": "Proyekto ay naantala o ipinagpaliban nang walang takdang panahon",
  "Incorrect information provided": "Maling impormasyon ang naibigay",
  "Incorrect project details entered": "Maling mga detalye ng proyekto ang naipasok",
  "Other municipal requirements": "Iba pang mga rekisito ng munisipyo",
  "Other reasons": "Iba pang mga dahilan",
  "Keep Application": "Panatilihin ang Aplikasyon",
  "Confirm Cancellation": "Kumpirmahin ang Pagkansela",
  "Cancelling...": "Kinakansela...",
  "Sign In to View Your Application History": "Mag-sign In upang Tingnan ang Kasaysayan ng Iyong Aplikasyon",
  "Personal applications and clearance certificates are strictly protected. Sign in with your registered eTAYO account to securely view your permits, review notes, and approved documents.": "Ang mga personal na aplikasyon at sertipiko ng clearance ay mahigpit na pinangangalagaan. Mag-sign in gamit ang iyong rehistradong eTAYO account upang ligtas na makita ang iyong mga permit, tala ng pagsusuri, at mga aprubadong dokumento.",
  "Sign In to Account": "Mag-sign In sa Account",
  "Register New Account": "Magrehistro ng Bagong Account",
  "No Archived Applications": "Walang mga Naka-archive na Aplikasyon",
  "No Applications Found": "Walang Natagpuang mga Aplikasyon",
  "You haven't archived any applications yet. When an application is completed, released, or cancelled, you can archive it to keep your active workspace organized.": "Wala ka pang nai-archive na mga aplikasyon. Kapag ang isang aplikasyon ay nakumpleto, naipalabas, o nakansela, maaari mo itong i-archive upang manatiling maayos ang iyong espasyo sa trabaho.",
  "No applications match your active search filters. Try clearing your filters above.": "Walang mga aplikasyon na tumutugma sa iyong filter sa paghahanap. Subukang i-clear ang iyong mga filter sa itaas.",
  "You have not submitted any permit applications under this account yet. Click below to begin your official application.": "Wala ka pang naisusumiteng mga aplikasyon ng permit sa ilalim ng account na ito. Mag-click sa ibaba upang simulan ang iyong opisyal na aplikasyon.",

  // Tracker Detailed Dossier & Timeline
  "Project Information": "Impormasyon ng Proyekto",
  "Application Progress Timeline": "Timeline ng Pag-usad ng Aplikasyon",
  "Date Submitted": "Petsang Isinumite",
  "Site Address": "Address ng Lokasyon",
  "Zoning Clearance": "Clearance sa Zoning",
  "Contact Evaluator": "Makipag-ugnayan sa Tagasuri",
  "Apply for New Permit": "Mag-apply para sa Bagong Permit",
  "Municipal Regulation Notice:": "Pabatid sa Regulasyon ng Munisipyo:",
  "Payment Confirmation Submitted (Awaiting Cashier Sign-off)": "Naisumite na ang Kumpirmasyon ng Pagbabayad (Naghihintay ng Lagda ng Kahero)",
  "🎉 Locational Clearance Approved · Order of Payment Issued": "🎉 Aprubado ang Locational Clearance · Naipalabas ang Kautusan sa Pagbabayad (Order of Payment)",
  "🎉 Application Formally Approved · Order of Payment Issued": "🎉 Pormal na Aprubado ang Aplikasyon · Naipalabas ang Kautusan sa Pagbabayad (Order of Payment)",
  "Evaluation Approved": "Aprubado ang Pagsusuri",
  "Step 3 Passed (Zoning Endorsed)": "Naipasa ang Hakbang 3 (Inendorso ng Zoning)",
  "Cashier Sign-off": "Pagpapatunay ng Kahero",
  "Send Receipt on Messages": "Ipadala ang Resibo sa Mensahe",
  "Proceed to Step 3: Technical Permitting Forms": "Magpatuloy sa Hakbang 3: Mga Form ng Teknikal na Permit",
  "View Connected Stage 2 Permits": "Tingnan ang Kaugnay na Stage 2 Permit",
  "Step 1: Submission & Document Intake": "Hakbang 1: Pagsusumite at Pagtanggap ng Dokumento",
  "Step 2: Technical & Zoning Evaluation": "Hakbang 2: Teknikal at Zoning na Pagsusuri",
  "Step 3: Order of Payment Assessment & Fees": "Hakbang 3: Pagtatasa ng Bayarin at Order of Payment",
  "Step 4: Formal Endorsement & Permit Release": "Hakbang 4: Pormal na Pag-endorso at Pagpapalabas ng Permit",
  "Step 5: Completion & Inspection Clearance": "Hakbang 5: Pagkumpleto at Clearance sa Inspeksyon",
  "Order of Payment": "Kautusan sa Pagbabayad (Order of Payment)",
  "Assessed Regulatory Fee": "Tinatayang Regularyong Bayarin",
  "Official Receipt / Reference": "Opisyal na Resibo / Reference",
  "Payment Channel": "Paraan ng Pagbabayad",
  "Payment Reference": "Reference ng Pagbabayad",
  "Payment Method": "Paraan ng Pagbabayad",
  "Confirm Payment": "Kumpirmahin ang Pagbabayad",
  "Municipal Treasury Cashier (On-site)": "Kahero ng Ingat-yaman ng Munisipyo (On-site)",
  "Online Banking / GCash / Maya": "Online Banking / GCash / Maya",
  "Attach Receipt Photo": "Ilakip ang Larawan ng Resibo",
  "Payment Notes (Optional)": "Mga Tala sa Pagbabayad (Opsyonal)",

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
  "Step 1: Project Classification": "Hakbang 1: Klasipikasyon ng Proyekto",
  "Step 2: Locational Clearance": "Hakbang 2: Locational Clearance",
  "Step 3: Technical Permitting Forms": "Hakbang 3: Mga Form ng Teknikal na Permit",
  "Step 4: Geospatial Mapping": "Hakbang 4: Pagma-mapang Geospatial",
  "Step 5: Review & Submission": "Hakbang 5: Pagsusuri at Pagsusumite",
  "Project Type": "Uri ng Proyekto",
  "Municipal Matrix": "Matris ng Munisipyo",
  "Zoning Prerequisite": "Paunang Rekisito sa Zoning",
  "Permit Forms": "Mga Form ng Permit",
  "Required Forms": "Mga Kinakailangang Form",
  "Mapping": "Pagma-mapa",
  "GIS & Coordinates": "GIS at mga Coordinate",
  "Review": "Pagsusuri",
  "Final Endorsement": "Huling Pag-endorso",
  "Residential": "Residensyal",
  "Commercial": "Komersyal",
  "Industrial": "Industriyal",
  "Institutional": "Institusyonal",
  "Ancillary & Alterations": "Karagdagan at Pagbabago",
  "Utilities & Mechanical": "Mga Pasilidad at Mekanikal",
  "All Categories": "Lahat ng Kategorya",
  "Select Your Barangay": "Piliin ang Iyong Barangay",
  "Project Name": "Pangalan ng Proyekto",
  "Project Address": "Address ng Proyekto",
  "Owner / Applicant Name": "Pangalan ng May-ari / Aplikante",
  "Contact Number": "Numero ng Telepono",
  "Email Address": "Email Address",
  "Tax Declaration Number": "Numero ng Tax Declaration",
  "TCT / Transfer Certificate of Title Number": "Numero ng Titulo (TCT)",
  "Lot Area (sq.m.)": "Laki ng Lote (sq.m.)",
  "Floor Area (sq.m.)": "Laki ng Palapag (sq.m.)",
  "Total Estimated Cost": "Kabuuang Tinatayang Halaga",
  "Number of Storeys": "Bilang ng Palapag",
  "Scope of Work": "Saklaw ng Gawain",
  "New Construction": "Bagong Konstruksyon",
  "Erection": "Pagtatayo",
  "Addition": "Karagdagan",
  "Alteration": "Pagbabago",
  "Renovation": "Renobasyon",
  "Conversion": "Pagpapalit ng Gamit",
  "Repair": "Pagkukumpuni",
  "Moving": "Paglilipat",
  "Demolition": "Paggiba",
  "Required Permits Breakdown": "Detalye ng mga Kinakailangang Permit",
  "Architectural Permit": "Architectural Permit",
  "Civil/Structural Permit": "Civil/Structural Permit",
  "Electrical Permit": "Electrical Permit",
  "Sanitary Permit": "Sanitary Permit",
  "Mechanical Permit": "Mechanical Permit",
  "Electronics Permit": "Electronics Permit",
  "Fire Safety Evaluation Clearance (FSEC)": "Fire Safety Evaluation Clearance (FSEC)",
  "Pin Location on Map": "Itusok ang Lokasyon sa Mapa",
  "Drag the marker to the exact construction site": "I-drag ang marker sa eksaktong lugar ng konstruksyon",
  "Coordinates": "Mga Coordinate",
  "Latitude": "Latitude",
  "Longitude": "Longitude",
  "Confirm Location": "Kumpirmahin ang Lokasyon",
  "Review Application Details": "Suriin ang mga Detalye ng Aplikasyon",
  "I hereby certify that all information supplied is true, correct, and complete according to the National Building Code of the Philippines (PD 1096).": "Pinatutunayan ko na ang lahat ng impormasyong ibinigay ay totoo, tama, at kumpleto alinsunod sa National Building Code ng Pilipinas (PD 1096).",
  "Submitting Application...": "Ipinapadala ang Aplikasyon...",
  "Application Submitted Successfully!": "Matagumpay na Naisumite ang Aplikasyon!",

  // Footer & Official Seal
  "REPUBLIC OF THE PHILIPPINES": "REPUBLIKA NG PILIPINAS",
  "MUNICIPALITY OF STO. TOMAS": "BAYAN NG STO. TOMAS",
  "PROVINCE OF PAMPANGA": "LALAWIGAN NG PAMPANGA",
  "Republic of the Philippines": "Republika ng Pilipinas",
  "Municipality of Sto. Tomas": "Bayan ng Sto. Tomas",
  "Province of Pampanga": "Lalawigan ng Pampanga",
  "OFFICES & DEPARTMENTS": "MGA TANGGAPAN AT KAGAWARAN",
  "Offices & Departments": "Mga Tanggapan at Kagawaran",
  "ABOUT US": "TUNGKOL SA AMIN",
  "About Us": "Tungkol sa Amin",
  "PUBLIC ASSISTANCE": "TULONG SA PUBLIKO",
  "Public Assistance": "Tulong sa Publiko",
  "Emergency Hotline": "Emergency Hotline",
  "MDRRMO Rescue": "MDRRMO Rescue",
  "Sto. Tomas Police Station": "Himpilan ng Pulisya ng Sto. Tomas",
  "Bureau of Fire Protection": "Kawanihan ng Pagtatanggol sa Sunog (BFP)",
  "Municipal Health Office": "Tanggapan ng Kalusugan ng Munisipyo",

  // Short words & Common Tokens
  "Date": "Petsa",
  "DATE": "PETSA",
  "Type": "Uri",
  "TYPE": "URI",
  "Project": "Proyekto",
  "PROJECT": "PROYEKTO",
  "Applicant": "Aplikante",
  "Filter": "Salain",
  "FILTER": "SALAIN",
  "Search": "Maghanap",
  "SEARCH": "MAGHANAP",
  "Active": "Aktibo",
  "ACTIVE": "AKTIBO",
  "All": "Lahat",
  "ALL": "LAHAT",
  "Yes": "Oo",
  "No": "Hindi",
  "Notifications": "Mga Abiso",
  "No notifications": "Walang mga abiso",
  "No new notifications": "Walang mga bagong abiso",
  "Mark all as read": "Markahan lahat bilang nabasa",
  "Mark all read": "Markahan lahat bilang nabasa",
  "Profile": "Profile",
  "Account": "Account",
  "Role": "Gampanin",
  "APPLICANT": "APLIKANTE",
  "STAFF": "KAWANI",
  "ADMIN": "ADMIN",
  "PUBLIC": "PUBLIKO"
};

/**
 * Word-level dictionary for fallback word replacements.
 * Contains only distinctly English words to avoid collisions with Tagalog words (e.g. "at", "may", "na", "pa").
 */
export const WORD_MAP = new Map<string, string>([
  ["permits", "mga permit"],
  ["permit", "permit"],
  ["active", "aktibo"],
  ["archived", "naka-archive"],
  ["archive", "i-archive"],
  ["evaluation", "pagsusuri"],
  ["evaluations", "mga pagsusuri"],
  ["evaluator", "tagasuri"],
  ["reviewed", "nasuri"],
  ["review", "pagsusuri"],
  ["reviews", "mga pagsusuri"],
  ["approved", "aprubado"],
  ["approve", "aprubahan"],
  ["approval", "pag-apruba"],
  ["released", "naipalabas"],
  ["release", "ipalabas"],
  ["releasing", "pagpapalabas"],
  ["disapproved", "tinanggihan"],
  ["disapprove", "tanggihan"],
  ["rejected", "tinanggihan"],
  ["reject", "tanggihan"],
  ["cancelled", "kinansela"],
  ["cancel", "kanselahin"],
  ["cancellation", "pagkansela"],
  ["submitted", "isinumite"],
  ["submit", "isumite"],
  ["submission", "pagsusumite"],
  ["pending", "naghihintay"],
  ["processing", "pinoproseso"],
  ["required", "kinakailangan"],
  ["requirements", "mga rekisito"],
  ["requirement", "rekisito"],
  ["optional", "opsyonal"],
  ["total", "kabuuan"],
  ["forms", "mga form"],
  ["form", "form"],
  ["projects", "mga proyekto"],
  ["project", "proyekto"],
  ["dossiers", "mga dossier"],
  ["dossier", "dossier"],
  ["sites", "mga lugar"],
  ["site", "lugar"],
  ["address", "tirahan / lokasyon"],
  ["addresses", "mga tirahan / lokasyon"],
  ["applicant", "aplikante"],
  ["applicants", "mga aplikante"],
  ["staff", "kawani"],
  ["officer", "opisyal"],
  ["officers", "mga opisyal"],
  ["admin", "admin"],
  ["administrator", "tagapangasiwa"],
  ["municipal", "munisipyo"],
  ["municipality", "bayan"],
  ["treasury", "ingat-yaman"],
  ["cashier", "kahero / cashier"],
  ["payment", "pagbabayad"],
  ["payments", "mga pagbabayad"],
  ["paid", "bayad na"],
  ["unpaid", "hindi pa bayad"],
  ["receipt", "resibo"],
  ["receipts", "mga resibo"],
  ["fee", "bayarin"],
  ["fees", "mga bayarin"],
  ["amount", "halaga"],
  ["assessed", "tinatayang halaga"],
  ["assessment", "pagtataya"],
  ["order", "kautusan / order"],
  ["clearance", "clearance"],
  ["clearances", "mga clearance"],
  ["zoning", "zoning"],
  ["building", "gusali"],
  ["buildings", "mga gusali"],
  ["residential", "residensyal"],
  ["commercial", "komersyal"],
  ["industrial", "industriyal"],
  ["institutional", "institusyonal"],
  ["timeline", "timeline"],
  ["information", "impormasyon"],
  ["progress", "pag-usad"],
  ["details", "mga detalye"],
  ["detail", "detalye"],
  ["documents", "mga dokumento"],
  ["document", "dokumento"],
  ["checklist", "tseklist"],
  ["status", "katayuan"],
  ["search", "maghanap"],
  ["filter", "salain"],
  ["filters", "mga filter"],
  ["notice", "pabatid"],
  ["warning", "babala"],
  ["caution", "pag-iingat"],
  ["help", "tulong"],
  ["close", "isara"],
  ["closed", "nakasara"],
  ["open", "buksan"],
  ["save", "i-save"],
  ["saved", "nai-save"],
  ["delete", "burahin"],
  ["deleted", "nabura"],
  ["edit", "i-edit"],
  ["update", "i-update"],
  ["view", "tingnan"],
  ["download", "i-download"],
  ["upload", "i-upload"],
  ["print", "i-print"],
  ["copy", "kopyahin"],
  ["copied", "nakopya"],
  ["back", "bumalik"],
  ["next", "susunod"],
  ["previous", "nakaraan"],
  ["continue", "magpatuloy"],
  ["keep", "panatilihin"],
  ["confirm", "kumpirmahin"],
  ["confirmed", "nakumpirma"],
  ["confirmation", "kumpirmasyon"],
  ["reason", "dahilan"],
  ["reasons", "mga dahilan"],
  ["notes", "mga tala"],
  ["note", "tala"],
  ["remarks", "mga komento"],
  ["messages", "mga mensahe"],
  ["message", "mensahe"],
  ["send", "ipadala"],
  ["sent", "naipadala"],
  ["notifications", "mga abiso"],
  ["notification", "abiso"],
  ["profile", "profile"],
  ["account", "account"],
  ["settings", "mga setting"],
  ["dashboard", "dashboard"],
  ["welcome", "maligayang pagbabalik"],
  ["signed", "nilagdaan"],
  ["date", "petsa"],
  ["dates", "mga petsa"],
  ["time", "oras"],
  ["year", "taon"],
  ["years", "mga taon"],
  ["month", "buwan"],
  ["months", "mga buwan"],
  ["day", "araw"],
  ["days", "mga araw"],
  ["today", "ngayong araw"],
  ["yesterday", "kahapon"],
  ["tomorrow", "bukas"],
  ["hours", "mga oras"],
  ["minutes", "mga minuto"],
  ["seconds", "mga segundo"],
  ["ago", "ang nakalipas"],
  ["stage", "yugto"],
  ["stages", "mga yugto"],
  ["step", "hakbang"],
  ["steps", "mga hakbang"],
  ["type", "uri"],
  ["types", "mga uri"],
  ["category", "kategorya"],
  ["categories", "mga kategorya"],
  ["scope", "saklaw"],
  ["nature", "kalikasan"],
  ["construction", "konstruksyon"],
  ["new", "bago"],
  ["existing", "kasalukuyan"],
  ["duplicate", "doble"],
  ["postponed", "ipinagpaliban"],
  ["delayed", "naantala"],
  ["incorrect", "mali"],
  ["correct", "tama"],
  ["provided", "ibinigay"],
  ["enter", "ipasok"],
  ["other", "iba pa"],
  ["others", "iba pa"],
  ["show", "ipakita"],
  ["hide", "itago"],
  ["expand", "palawakin"],
  ["collapse", "i-tiklop"],
  ["online", "online"],
  ["offline", "offline"],
  ["recent", "kamakailan"],
  ["list", "talaan"],
  ["map", "mapa"],
  ["location", "lokasyon"],
  ["coordinates", "mga coordinate"],
  ["latitude", "latitude"],
  ["longitude", "longitude"],
  ["barangay", "barangay"],
  ["town", "bayan"],
  ["province", "lalawigan"],
  ["country", "bansa"],
  ["philippines", "pilipinas"],
  ["republic", "republika"],
  ["official", "opisyal"],
  ["office", "tanggapan"],
  ["offices", "mga tanggapan"],
  ["department", "kagawaran"],
  ["departments", "mga kagawaran"],
  ["public", "publiko"],
  ["assistance", "tulong"],
  ["contact", "makipag-ugnayan"],
  ["phone", "telepono"],
  ["email", "email"],
  ["website", "website"],
  ["portal", "portal"],
  ["system", "sistema"],
  ["security", "seguridad"],
  ["privacy", "pagkapribado"],
]);

// Sort dictionary phrases by descending length so multi-word phrases match before single words
const SORTED_PHRASES = Object.keys(SYSTEM_WIDE_DICTIONARY).sort((a, b) => b.length - a.length);

// Lowercase lookup map for case-insensitive exact matching (preferring non-ALL-CAPS entries)
const LOWERCASE_MAP = new Map<string, string>();
for (const [k, v] of Object.entries(SYSTEM_WIDE_DICTIONARY)) {
  const lowerKey = k.trim().toLowerCase();
  if (!LOWERCASE_MAP.has(lowerKey) || k !== k.toUpperCase()) {
    LOWERCASE_MAP.set(lowerKey, v);
  }
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Translates a given English string into Tagalog/Filipino with smart case preservation.
 */
export function translateToFilipino(text: string): string {
  if (!text || typeof text !== "string") return text;
  const trimmed = text.trim();
  if (!trimmed) return text;

  const leading = text.match(/^\s*/)?.[0] || "";
  const trailing = text.match(/\s*$/)?.[0] || "";

  // 1. Direct exact or case-insensitive phrase match
  const lower = trimmed.toLowerCase();
  if (LOWERCASE_MAP.has(lower)) {
    const val = LOWERCASE_MAP.get(lower)!;
    if (trimmed.length > 2 && trimmed === trimmed.toUpperCase()) {
      return leading + val.toUpperCase() + trailing;
    }
    return leading + val + trailing;
  }

  // 2. Sub-phrase replacements (longest phrase first)
  let result = text;

  for (const phrase of SORTED_PHRASES) {
    if (phrase.length < 3) continue;
    const trans = SYSTEM_WIDE_DICTIONARY[phrase];
    if (result.includes(phrase)) {
      result = result.split(phrase).join(trans);
    } else if (result.toUpperCase().includes(phrase.toUpperCase())) {
      try {
        const regex = new RegExp(escapeRegex(phrase), "gi");
        result = result.replace(regex, (m) => {
          if (m.length > 2 && m === m.toUpperCase()) return trans.toUpperCase();
          return trans;
        });
      } catch (e) {}
    }
  }

  // 3. Word-level fallback for remaining English words
  result = result.replace(/\b[A-Za-z]+(?:'[A-Za-z]+)?\b/g, (w) => {
    const wLower = w.toLowerCase();
    if (WORD_MAP.has(wLower)) {
      const trans = WORD_MAP.get(wLower)!;
      if (w.length > 2 && w === w.toUpperCase()) {
        return trans.toUpperCase();
      }
      if (w[0] === w[0].toUpperCase()) {
        return trans.charAt(0).toUpperCase() + trans.slice(1);
      }
      return trans;
    }
    return w;
  });

  return result;
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
   * Automatically inspects text nodes and attributes and translates them when language === "fil",
   * and restores original text when language === "en".
   */
  useEffect(() => {
    if (typeof window === "undefined" || !document.body) return;

    const translateDOMNode = (node: Node) => {
      // Skip scripts, styles, pre, code, and user text-input areas
      const parent = node.parentElement;
      if (parent) {
        const tag = parent.tagName;
        if (
          tag === "SCRIPT" ||
          tag === "STYLE" ||
          tag === "NOSCRIPT" ||
          tag === "CODE" ||
          tag === "PRE" ||
          tag === "TEXTAREA"
        ) {
          return;
        }
        if (parent.getAttribute("contenteditable") === "true" || parent.closest("[contenteditable='true']")) {
          return;
        }
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue;
        if (!text || !text.trim()) return;

        const nodeAny = node as any;
        // If React re-rendered with new text that isn't the translated text, update orig text
        if (nodeAny.__etayoOrigText === undefined || (node.nodeValue !== nodeAny.__etayoOrigText && node.nodeValue !== nodeAny.__etayoTransText)) {
          nodeAny.__etayoOrigText = text;
        }

        if (language === "fil") {
          const translated = translateToFilipino(nodeAny.__etayoOrigText);
          nodeAny.__etayoTransText = translated;
          if (node.nodeValue !== translated) {
            node.nodeValue = translated;
          }
        } else {
          if (nodeAny.__etayoOrigText && node.nodeValue !== nodeAny.__etayoOrigText) {
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

        // Translate aria-label
        if (el.getAttribute("aria-label")) {
          const ariaLabel = el.getAttribute("aria-label")!;
          if (!el.getAttribute("data-etayo-orig-aria")) {
            el.setAttribute("data-etayo-orig-aria", ariaLabel);
          }
          const orig = el.getAttribute("data-etayo-orig-aria")!;
          if (language === "fil") {
            const trans = translateToFilipino(orig);
            if (el.getAttribute("aria-label") !== trans) {
              el.setAttribute("aria-label", trans);
            }
          } else {
            if (el.getAttribute("aria-label") !== orig) {
              el.setAttribute("aria-label", orig);
            }
          }
        }

        // Translate button input values (e.g. <input type="button" value="Submit">)
        if (el.tagName === "INPUT") {
          const inputEl = el as HTMLInputElement;
          if (inputEl.type === "button" || inputEl.type === "submit") {
            if (!el.getAttribute("data-etayo-orig-val")) {
              el.setAttribute("data-etayo-orig-val", inputEl.value);
            }
            const orig = el.getAttribute("data-etayo-orig-val")!;
            if (language === "fil") {
              const trans = translateToFilipino(orig);
              if (inputEl.value !== trans) {
                inputEl.value = trans;
              }
            } else {
              if (inputEl.value !== orig) {
                inputEl.value = orig;
              }
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
