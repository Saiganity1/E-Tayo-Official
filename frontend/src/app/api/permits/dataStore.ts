import { PermitApplication } from "@/types";

// Seed baseline permits including Paul Payumo's active application
const SEED_APPLICATIONS: PermitApplication[] = [
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
    estimatedFees: 3795,
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
    id: "APP-2026-6636",
    permitType: "building_permit",
    projectName: "Single-Detached House Installation & Construction",
    applicantName: "Paul Payumo",
    applicantEmail: "mdpsicot.student@ua.edu.ph",
    applicantPhone: "0917-123-4567",
    applicantAddress: "Purok 3, Brgy. San Bartolome, Sto. Tomas, Pampanga",
    projectAddress: "Purok 3, Brgy. San Bartolome, Sto. Tomas, Pampanga",
    projectDescription: "Construction of a 1-storey single-detached residential house.",
    status: "pending",
    dateSubmitted: "September 29, 2026",
    estimatedFees: 3795,
    paymentStatus: "unpaid",
    projectType: "Single-Detached House",
    locationalClearanceRef: "LC-2026-6494",
    location: {
      lat: 15.0163,
      lng: 120.7188,
      address: "Purok 3, Brgy. San Bartolome, Sto. Tomas, Pampanga"
    },
    requirements: [
      { name: "Unified Building Permit Application Form", required: true, status: "approved", fileName: "unified_application.pdf", fileSize: "2.4 MB" },
      { name: "Architectural Documents & Plans", required: true, status: "approved", fileName: "architectural_plans.pdf", fileSize: "4.8 MB" },
      { name: "Civil / Structural Documents", required: true, status: "approved", fileName: "structural_analysis.pdf", fileSize: "3.9 MB" },
      { name: "Electrical Documents", required: true, status: "approved", fileName: "electrical_plans.pdf", fileSize: "2.2 MB" },
      { name: "Sanitary / Plumbing Documents", required: true, status: "approved", fileName: "plumbing_plans.pdf", fileSize: "1.9 MB" }
    ],
    trackingSteps: [
      { title: "1. Filed", status: "completed", date: "September 29, 2026", notes: "Submitted Online", actor: "Paul Payumo" },
      { title: "2. Technical Evaluation", status: "current", notes: "Reviewing Architectural & Engineering Plans" },
      { title: "3. Final Approval", status: "upcoming", notes: "Building Official Sign-off" },
      { title: "4. Permit Release", status: "upcoming", notes: "Official Permit Documents" }
    ],
    historyLog: [
      {
        date: "September 29, 2026, 12:15 AM",
        action: "Application Submitted",
        actor: "Paul Payumo",
        details: "Unified Building Permit application package submitted online."
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
    // If local in-memory store has an approved or released application, do NOT let a stale GET "pending" or "under_review" overwrite it!
    if ((existingStatus === "approved" || existingStatus === "released") && (newStatus === "pending" || newStatus === "under_review")) {
      newApp.status = existing.status;
      if (existing.dateApproved && !newApp.dateApproved) newApp.dateApproved = existing.dateApproved;
      if (existing.remarks && !newApp.remarks) newApp.remarks = existing.remarks;
      if (existing.paymentStatus && !newApp.paymentStatus) newApp.paymentStatus = existing.paymentStatus;
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

export function patchPermitStatus(id: string, status: string, remarks?: string): PermitApplication | null {
  const existing = getPermitById(id);
  if (!existing) return null;

  existing.status = status as any;
  if (remarks !== undefined) existing.remarks = remarks;

  if (status === "approved" || status === "released") {
    existing.dateApproved = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
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
