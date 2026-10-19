import { PermitApplication } from "@/types";
import { compareAppsNewestFirst, normalizeApplicantName } from "@/utils/projectGrouping";
import { INITIAL_APPLICATIONS } from "@/data/mock";
import { sanitizeString } from "@/utils/security";

// Known vulnerability test IDs to purge
export const VULNERABILITY_CLEANUP_IDS = new Set([
  "app-2026-2913",
  "app-2026-2571",
  "app-2026-3000",
  "app-2026-7292",
  "app-2026-7804"
]);

export const SEED_APPLICATIONS: PermitApplication[] = [];

// Persistent global variable across Next.js API route calls within one server instance.
const globalForPermits = globalThis as unknown as {
  _etayoPermitStore: Map<string, PermitApplication>;
};

if (!globalForPermits._etayoPermitStore) {
  globalForPermits._etayoPermitStore = new Map<string, PermitApplication>();
  SEED_APPLICATIONS.forEach(app => {
    globalForPermits._etayoPermitStore.set(app.id.trim().toLowerCase(), app);
  });
} else {
  // Purge any dynamically created test rows from existing memory
  VULNERABILITY_CLEANUP_IDS.forEach(id => globalForPermits._etayoPermitStore.delete(id));
}

const store = globalForPermits._etayoPermitStore;

export function getAllPermits(emailFilter?: string, nameFilter?: string): PermitApplication[] {
  const all = Array.from(store.values());
  all.sort(compareAppsNewestFirst);
  if (!emailFilter && !nameFilter) {
    return all;
  }

  const cleanEmail = (emailFilter || "").trim().toLowerCase();
  const cleanName = (nameFilter || "").trim().toLowerCase();

  const normalizeEmail = (em: string) => (em || "").trim().toLowerCase().replace("mdpsicot", "mdpsicat");

  return all.filter(app => {
    const appEmail = String(app.applicantEmail || "").trim().toLowerCase();
    const appName = normalizeApplicantName(app.applicantName).toLowerCase();

    if (cleanEmail) {
      if (appEmail) {
        return appEmail === cleanEmail || normalizeEmail(appEmail) === normalizeEmail(cleanEmail);
      }
      // If the application has no email attached, match by exact name
      if (cleanName && appName) {
        return appName === cleanName;
      }
      return false;
    }

    if (cleanName) {
      return appName === cleanName;
    }

    // Check if linked clearance belongs to user
    const linkedRef = String(app.locationalClearanceRef || app.clearanceRef || app.connectedClearanceId || "").trim().toLowerCase();
    if (linkedRef && linkedRef !== "exempt" && linkedRef !== "not_required") {
      const parent = store.get(linkedRef);
      if (parent) {
        const pEmail = String(parent.applicantEmail || "").trim().toLowerCase();
        const pName = normalizeApplicantName(parent.applicantName).toLowerCase();
        if (cleanEmail && pEmail) {
          return pEmail === cleanEmail || normalizeEmail(pEmail) === normalizeEmail(cleanEmail);
        }
        if (cleanName && pName) {
          return pName === cleanName;
        }
      }
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
  // XSS Sanitization & Normalization
  newApp.applicantName = sanitizeString(normalizeApplicantName(newApp.applicantName));
  if (newApp.projectName) newApp.projectName = sanitizeString(newApp.projectName);
  if (newApp.projectAddress) newApp.projectAddress = sanitizeString(newApp.projectAddress);
  if (newApp.projectDescription) newApp.projectDescription = sanitizeString(newApp.projectDescription);
  if (newApp.applicantAddress) newApp.applicantAddress = sanitizeString(newApp.applicantAddress);
  if (newApp.applicantEmail) newApp.applicantEmail = sanitizeString(newApp.applicantEmail).toLowerCase();
  if (newApp.remarks) newApp.remarks = sanitizeString(newApp.remarks);

  if (!(newApp as any).createdAt) {
    (newApp as any).createdAt = new Date().toISOString();
  }
  if (!(newApp as any)._seq) {
    (newApp as any)._seq = Date.now();
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

  // XSS Sanitization
  if (updatedApp.applicantName) updatedApp.applicantName = sanitizeString(updatedApp.applicantName);
  if (updatedApp.projectName) updatedApp.projectName = sanitizeString(updatedApp.projectName);
  if (updatedApp.projectAddress) updatedApp.projectAddress = sanitizeString(updatedApp.projectAddress);
  if (updatedApp.projectDescription) updatedApp.projectDescription = sanitizeString(updatedApp.projectDescription);
  if (updatedApp.remarks) updatedApp.remarks = sanitizeString(updatedApp.remarks);

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
