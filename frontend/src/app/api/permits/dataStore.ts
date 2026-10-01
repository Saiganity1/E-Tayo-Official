import { PermitApplication } from "@/types";

// Seed baseline permits including Paul Payumo's active application
const SEED_APPLICATIONS: PermitApplication[] = [
  {
    id: "LC-2026-6133",
    permitType: "locational_clearance",
    projectName: "Paul Second Floor house - Locational Clearance",
    applicantName: "Paul Payumo",
    applicantEmail: "mdpsicot.student@ua.edu.ph",
    applicantPhone: "0917-123-4567",
    applicantAddress: "Purok 3, Brgy. San Bartolome, Sto. Tomas, Pampanga",
    projectAddress: "Purok 3, Brgy. San Bartolome, Sto. Tomas, Pampanga",
    projectDescription: "Locational Clearance for Paul Second Floor house in Brgy. San Bartolome.",
    status: "released",
    dateSubmitted: "October 01, 2026",
    estimatedFees: 2500,
    assessedFees: 2500,
    orderOfPaymentNo: "OP-2026-6133",
    paymentStatus: "paid",
    officialReceiptNo: "OR-2026-69723",
    projectType: "Single-Detached House",
    location: {
      lat: 15.0163,
      lng: 120.7188,
      address: "Purok 3, Brgy. San Bartolome, Sto. Tomas, Pampanga",
      lotNo: "3",
      blockNo: "2"
    },
    requirements: [
      { name: "Locational Clearance Application Form", required: true, status: "approved", fileName: "Locational_Clearance_LC-2026-6133.pdf", fileSize: "840 KB" },
      { name: "Certified True Copy of Transfer Certificate of Title (TCT)", required: true, status: "approved", fileName: "tct_title_deed.pdf", fileSize: "2.1 MB" },
      { name: "Barangay Clearance for Locational Clearance", required: true, status: "approved", fileName: "brgy_clearance_san_bartolome.pdf", fileSize: "890 KB" },
      { name: "Site Development Plan with Vicinity Map", required: true, status: "approved", fileName: "site_dev_plan.pdf", fileSize: "3.2 MB" },
      { name: "Latest Tax Declaration & Real Property Tax Receipt", required: true, status: "approved", fileName: "tax_dec_receipt.pdf", fileSize: "1.1 MB" },
      { name: "Lot Plan signed and sealed by a Geodetic Engineer", required: true, status: "approved", fileName: "lot_plan_geodetic.pdf", fileSize: "1.8 MB" }
    ],
    trackingSteps: [
      { title: "1. Filed", status: "completed", date: "October 01, 2026", notes: "Submitted Online", actor: "Paul Payumo" },
      { title: "2. Evaluation", status: "completed", notes: "Technical Review by Zoning Officer" },
      { title: "3. Zoning Clearance", status: "completed", notes: "Zoning Review & Approved" },
      { title: "4. Released", status: "completed", notes: "Settlement verified under OR-2026-69723" }
    ],
    historyLog: [
      {
        date: "October 01, 2026, 08:30 PM",
        action: "Permit Released",
        actor: "Zoning Administrator",
        details: "Locational clearance certificate issued and released."
      }
    ]
  },
  {
    id: "APP-2026-1061",
    permitType: "building_permit",
    projectName: "Paul Second Floor house",
    applicantName: "Paul Payumo",
    applicantEmail: "mdpsicot.student@ua.edu.ph",
    applicantPhone: "0917-123-4567",
    applicantAddress: "Purok 3, Brgy. San Bartolome, Sto. Tomas, Pampanga",
    projectAddress: "Purok 3, Brgy. San Bartolome, Sto. Tomas, Pampanga",
    projectDescription: "Construction of second floor house extension and residential building improvements.",
    status: "pending",
    dateSubmitted: "October 01, 2026",
    estimatedFees: 6200,
    assessedFees: 6200,
    orderOfPaymentNo: "OP-2026-1061",
    paymentStatus: "unpaid",
    projectType: "Single-Detached House",
    locationalClearanceRef: "LC-2026-6133",
    clearanceRef: "LC-2026-6133",
    connectedClearanceId: "LC-2026-6133",
    fileUrl: "/templates/UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf",
    fileName: "APP-2026-1061_Single-Detached_House_Permit_Package.pdf",
    location: {
      lat: 15.0163,
      lng: 120.7188,
      address: "Purok 3, Brgy. San Bartolome, Sto. Tomas, Pampanga",
      lotNo: "3",
      blockNo: "2"
    },
    requirements: [
      { name: "Locational Clearance (LC)", required: true, status: "approved", fileName: "Locational_Clearance_LC-2026-6133.pdf", fileSize: "840 KB", remarks: "Zoning clearance reference: LC-2026-6133" },
      { name: "Unified Application Form for Building Permit (UAF-BP)", required: true, status: "submitted", fileName: "UAF-BP_Single-Detached_House_Official_Filled.pdf", fileSize: "1.4 MB", remarks: "Official Unified Application Form document submitted for engineering evaluation", fileUrl: "/templates/UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf" },
      { name: "Architectural Permit (ARCH)", required: true, status: "submitted", fileName: "ARCH_Single-Detached_House_Official_Filled.pdf", fileSize: "1.4 MB", remarks: "Official Architectural Permit document submitted for engineering evaluation", fileUrl: "/templates/Architectural-Permit-Cruz-Final.pdf" },
      { name: "Civil / Structural Permit (STRUC)", required: true, status: "submitted", fileName: "STRUC_Single-Detached_House_Official_Filled.pdf", fileSize: "1.4 MB", remarks: "Official Civil / Structural Permit document submitted for engineering evaluation", fileUrl: "/templates/Structural-Permit-Cruz-Final.pdf" },
      { name: "Electrical Permit (ELEC)", required: true, status: "submitted", fileName: "ELEC_Single-Detached_House_Official_Filled.pdf", fileSize: "1.4 MB", remarks: "Official Electrical Permit document submitted for engineering evaluation", fileUrl: "/templates/Electrical-Permit-Cruz-Final.pdf" },
      { name: "Sanitary / Plumbing Permit (PLUMB)", required: true, status: "submitted", fileName: "PLUMB_Single-Detached_House_Official_Filled.pdf", fileSize: "1.4 MB", remarks: "Official Sanitary / Plumbing Permit document submitted for engineering evaluation", fileUrl: "/templates/Sanitary-Plumbing-Permit-Cruz-Final.pdf" },
      { name: "Mechanical Permit (MECH)", required: true, status: "submitted", fileName: "MECH_Single-Detached_House_Official_Filled.pdf", fileSize: "1.4 MB", remarks: "Official Mechanical Permit document submitted for engineering evaluation", fileUrl: "/templates/Mechanical-Permit-Cruz-Final.pdf" },
      { name: "Fire / BFP Clearance (FSEC)", required: true, status: "submitted", fileName: "FSEC_Single-Detached_House_Official_Filled.pdf", fileSize: "1.4 MB", remarks: "Official Fire Safety Evaluation Clearance document submitted for engineering evaluation", fileUrl: "/templates/UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf" },
      { name: "Certificate of Completion (CC)", required: true, status: "submitted", fileName: "CC_Single-Detached_House_Official_Filled.pdf", fileSize: "1.4 MB", remarks: "Official Certificate of Completion document submitted for engineering evaluation", fileUrl: "/templates/Certificate-of-Completion-Cruz-Final.pdf" }
    ],
    trackingSteps: [
      { title: "Application Submitted", status: "completed", date: "October 01, 2026", notes: "Application dossier filed online with 8 verified engineering attachments." },
      { title: "Initial Document Verification", status: "in-progress", notes: "Reviewing all technical engineering attachments for completeness and licensed PRC sign-offs." },
      { title: "Technical Engineering Evaluation", status: "upcoming", notes: "Review by Municipal Building Official, Structural & Electrical Engineers." },
      { title: "Order of Payment & Issuance", status: "upcoming", notes: "Assessment of municipal fees and permit issuance." }
    ],
    historyLog: [
      {
        date: "October 01, 2026, 11:00 PM",
        action: "Application Submitted",
        actor: "Paul Payumo",
        details: "Applied for Single-Detached House with 8 mandatory engineering permits under Locational Clearance LC-2026-6133."
      }
    ]
  },
  {
    id: "LC-2026-6494",
    permitType: "locational_clearance",
    projectName: "Single-Detached House - Locational Clearance",
    applicantName: "Paul Payumo",
    applicantEmail: "mdpsicot.student@ua.edu.ph",
    applicantPhone: "0917-123-4567",
    applicantAddress: "Purok 3, Brgy. San Bartolome, Sto. Tomas, Pampanga",
    projectAddress: "Purok 3, Brgy. San Bartolome, Sto. Tomas, Pampanga",
    projectDescription: "Application for Locational Clearance for a Single-Detached Residential House.",
    status: "pending",
    dateSubmitted: "September 29, 2026",
    estimatedFees: 500,
    assessedFees: 500,
    orderOfPaymentNo: "OP-2026-6494",
    paymentStatus: "unpaid",
    projectType: "Single-Detached House",
    location: {
      lat: 15.0163,
      lng: 120.7188,
      address: "Purok 3, Brgy. San Bartolome, Sto. Tomas, Pampanga",
      lotNo: "3",
      blockNo: "2"
    },
    requirements: [
      { name: "Zoning Clearance Application Form", required: true, status: "approved", fileName: "zoning_clearance_form.pdf", fileSize: "1.4 MB" },
      { name: "Certified True Copy of Transfer Certificate of Title (TCT)", required: true, status: "approved", fileName: "tct_title_deed.pdf", fileSize: "2.1 MB" },
      { name: "Barangay Clearance for Locational Clearance", required: true, status: "approved", fileName: "brgy_clearance_san_bartolome.pdf", fileSize: "890 KB" },
      { name: "Site Development Plan with Vicinity Map", required: true, status: "approved", fileName: "site_dev_plan.pdf", fileSize: "3.2 MB" },
      { name: "Latest Tax Declaration & Real Property Tax Receipt", required: true, status: "approved", fileName: "tax_dec_receipt.pdf", fileSize: "1.1 MB" },
      { name: "Lot Plan signed and sealed by a Geodetic Engineer", required: true, status: "approved", fileName: "lot_plan_geodetic.pdf", fileSize: "1.8 MB" }
    ],
    trackingSteps: [
      { title: "1. Filed", status: "completed", date: "September 29, 2026", notes: "Submitted Online", actor: "Paul Payumo" },
      { title: "2. Evaluation", status: "current", notes: "Technical Review by Zoning Officer" },
      { title: "3. Zoning Clearance", status: "upcoming", notes: "Zoning Review & Approval" },
      { title: "4. Released", status: "upcoming", notes: "Order of Payment & Release" }
    ],
    historyLog: [
      {
        date: "September 29, 2026, 12:00 AM",
        action: "Application Submitted",
        actor: "Paul Payumo",
        details: "Locational Clearance application package submitted online."
      }
    ]
  },
  {
    id: "LC-2025-0001",
    permitType: "locational_clearance",
    projectName: "Dela Cruz Warehouse",
    applicantName: "Juan Dela Cruz",
    applicantEmail: "juan.delacruz@email.com",
    applicantPhone: "0917-000-4567",
    applicantAddress: "123 Rizal Street, Sto. Tomas, Pampanga",
    projectAddress: "Lot 8, Block 3, Brgy. San Bartolome, Sto. Tomas, Pampanga",
    projectDescription: "Proposed construction of a warehouse building for logistics and storage purposes.",
    status: "under_review",
    dateSubmitted: "May 13, 2025",
    estimatedFees: 4500,
    paymentStatus: "paid",
    projectType: "Warehouse",
    location: {
      lat: 15.0163,
      lng: 120.7188,
      address: "Brgy. San Bartolome, Sto. Tomas, Pampanga"
    },
    requirements: [],
    trackingSteps: [
      { title: "Application Submitted", status: "completed", date: "May 13, 2025" },
      { title: "Technical Plan Evaluation", status: "current" },
      { title: "Final Approval & Release", status: "upcoming" }
    ],
    historyLog: [
      { date: "May 13, 2025", action: "Application Submitted", actor: "Juan Dela Cruz", details: "Application uploaded." }
    ]
  },
  {
    id: "BP-2025-0005",
    permitType: "building_permit",
    projectName: "2-Storey Residence",
    applicantName: "Juan Dela Cruz",
    applicantEmail: "juan.delacruz@email.com",
    applicantPhone: "0917-000-4567",
    applicantAddress: "123 Rizal Street, Sto. Tomas, Pampanga",
    projectAddress: "Lot 12, Block 1, Brgy. Poblacion, Sto. Tomas, Pampanga",
    projectDescription: "Construction of a reinforced concrete 2-storey single-detached family house with roof deck.",
    status: "pending",
    dateSubmitted: "May 08, 2025",
    estimatedFees: 5200,
    paymentStatus: "paid",
    projectType: "Single-Detached House",
    location: {
      lat: 15.0132,
      lng: 120.7121,
      address: "Brgy. Poblacion, Sto. Tomas, Pampanga"
    },
    requirements: [],
    trackingSteps: [
      { title: "Application Submitted", status: "completed", date: "May 08, 2025" },
      { title: "Initial Verification", status: "current" }
    ],
    historyLog: [
      { date: "May 08, 2025", action: "Application Submitted", actor: "Juan Dela Cruz", details: "Application uploaded." }
    ]
  }
];

// Persistent global variable across Next.js API route calls
const globalForPermits = globalThis as unknown as {
  _etayoPermitStore: Map<string, PermitApplication>;
};

if (!globalForPermits._etayoPermitStore) {
  globalForPermits._etayoPermitStore = new Map<string, PermitApplication>();
  SEED_APPLICATIONS.forEach(app => {
    globalForPermits._etayoPermitStore.set(app.id.toLowerCase(), app);
  });
}

const store = globalForPermits._etayoPermitStore;
if (store.has("app-2026-6636")) {
  store.delete("app-2026-6636");
}

export function getAllPermits(emailFilter?: string, nameFilter?: string): PermitApplication[] {
  const all = Array.from(store.values());
  if (!emailFilter && !nameFilter) {
    return all;
  }

  const cleanEmail = (emailFilter || "").trim().toLowerCase();
  const cleanName = (nameFilter || "").trim().toLowerCase();

  return all.filter(app => {
    const appEmail = (app.applicantEmail || "").trim().toLowerCase();
    const appName = (app.applicantName || "").trim().toLowerCase();

    if (cleanEmail && (appEmail === cleanEmail || appEmail.includes(cleanEmail) || cleanEmail.includes(appEmail))) {
      return true;
    }
    if (cleanName && (appName === cleanName || appName.includes(cleanName) || cleanName.includes(appName))) {
      return true;
    }
    return false;
  });
}

export function getPermitById(id: string): PermitApplication | null {
  if (!id) return null;
  const cleanId = id.trim().toLowerCase();
  
  // Exact match
  if (store.has(cleanId)) {
    return store.get(cleanId)!;
  }

  // Case-insensitive / prefix search
  for (const [key, value] of store.entries()) {
    if (key === cleanId || key.startsWith(cleanId) || cleanId.startsWith(key)) {
      return value;
    }
  }

  return null;
}

export function savePermit(newApp: PermitApplication): PermitApplication {
  if (!newApp.id) {
    newApp.id = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  const cleanId = newApp.id.trim().toLowerCase();
  const existing = getPermitById(newApp.id);
  if (existing) {
    const existingStatus = String(existing.status || "").toLowerCase().trim();
    const newStatus = String(newApp.status || "").toLowerCase().trim();
    // Protect against status regression from stale payloads:
    // 1. If local in-memory store has an approved or released application, do NOT let a stale GET "pending" or "under_review" overwrite it!
    // 2. If local in-memory store is under_review, do NOT let a stale "pending" revert it!
    if ((existingStatus === "approved" || existingStatus === "released") && (newStatus === "pending" || newStatus === "under_review")) {
      newApp.status = existing.status;
      if (existing.dateApproved && !newApp.dateApproved) newApp.dateApproved = existing.dateApproved;
      if (existing.remarks && !newApp.remarks) newApp.remarks = existing.remarks;
      if (existing.paymentStatus && !newApp.paymentStatus) newApp.paymentStatus = existing.paymentStatus;
      if (existing.trackingSteps && (!newApp.trackingSteps || newApp.trackingSteps.length === 0)) {
        newApp.trackingSteps = existing.trackingSteps;
      }
    } else if (existingStatus === "under_review" && (newStatus === "pending" || !newStatus)) {
      newApp.status = "under_review";
      if (existing.remarks && !newApp.remarks) newApp.remarks = existing.remarks;
      if (existing.trackingSteps && (!newApp.trackingSteps || newApp.trackingSteps.length === 0)) {
        newApp.trackingSteps = existing.trackingSteps;
      }
    }
    if (existing.isArchived && !newApp.isArchived) {
      newApp.isArchived = true;
    }
  }
  store.set(cleanId, newApp);
  return newApp;
}

export function updatePermit(updatedApp: PermitApplication): PermitApplication {
  if (!updatedApp.id) return updatedApp;
  const cleanId = updatedApp.id.trim().toLowerCase();
  const existing = getPermitById(updatedApp.id) || {};
  const existingStatus = String((existing as any).status || "").toLowerCase().trim();
  const newStatus = String(updatedApp.status || "").toLowerCase().trim();

  // Protect against status regression from stale payloads
  if ((existingStatus === "approved" || existingStatus === "released") && (newStatus === "pending" || newStatus === "under_review")) {
    updatedApp.status = (existing as any).status;
    if ((existing as any).dateApproved && !updatedApp.dateApproved) updatedApp.dateApproved = (existing as any).dateApproved;
  } else if (existingStatus === "under_review" && (newStatus === "pending" || !newStatus)) {
    updatedApp.status = "under_review";
  }

  const merged = { ...existing, ...updatedApp };
  if (updatedApp.isArchived !== undefined) {
    merged.isArchived = updatedApp.isArchived;
  }
  store.set(cleanId, merged as PermitApplication);
  return merged as PermitApplication;
}

export function archivePermit(id: string, isArchived: boolean): PermitApplication | null {
  const existing = getPermitById(id);
  if (!existing) return null;
  existing.isArchived = isArchived;
  const cleanId = id.trim().toLowerCase();
  store.set(cleanId, existing);
  return existing;
}

export function patchPermitStatus(
  id: string,
  status: string,
  remarks?: string,
  extra?: {
    assessedFees?: number;
    estimatedFees?: number;
    orderOfPaymentNo?: string;
    paymentStatus?: string;
    dateApproved?: string;
  }
): PermitApplication | null {
  const existing = getPermitById(id);
  if (!existing) return null;

  existing.status = status as any;
  if (remarks !== undefined) existing.remarks = remarks;

  if (extra?.assessedFees !== undefined && !isNaN(Number(extra.assessedFees)) && Number(extra.assessedFees) > 0) {
    existing.assessedFees = Number(extra.assessedFees);
  }
  if (extra?.estimatedFees !== undefined && !isNaN(Number(extra.estimatedFees)) && Number(extra.estimatedFees) > 0) {
    existing.estimatedFees = Number(extra.estimatedFees);
  }
  if (extra?.orderOfPaymentNo) {
    existing.orderOfPaymentNo = extra.orderOfPaymentNo;
  }
  if (extra?.paymentStatus) {
    existing.paymentStatus = extra.paymentStatus as any;
  }

  if (status === "approved" || status === "released") {
    existing.dateApproved = extra?.dateApproved || existing.dateApproved || new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    if (status === "released") {
      existing.paymentStatus = "paid";
    }
  }

  store.set(id.trim().toLowerCase(), existing);
  return existing;
}

export function deletePermit(id: string): boolean {
  return store.delete(id.trim().toLowerCase());
}
