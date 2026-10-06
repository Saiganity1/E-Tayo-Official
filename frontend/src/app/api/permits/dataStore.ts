import { PermitApplication } from "@/types";

// No seed data — all permits must come from the real database only.
// The fallback store starts empty; real data is fetched from the backend each time.

// Persistent global variable across Next.js API route calls within one server instance.
const globalForPermits = globalThis as unknown as {
  _etayoPermitStore: Map<string, PermitApplication>;
};

if (!globalForPermits._etayoPermitStore) {
  globalForPermits._etayoPermitStore = new Map<string, PermitApplication>();
}

const store = globalForPermits._etayoPermitStore;

export function getAllPermits(emailFilter?: string, nameFilter?: string): PermitApplication[] {
  const all = Array.from(store.values());
  if (!emailFilter && !nameFilter) {
    return all;
  }

  const cleanEmail = (emailFilter || "").trim().toLowerCase();
  const cleanName = (nameFilter || "").trim().toLowerCase();

  const normalizeEmail = (em: string) => (em || "").trim().toLowerCase().replace("mdpsicot", "mdpsicat");

  return all.filter(app => {
    const appEmail = (app.applicantEmail || "").trim().toLowerCase();
    const appName = (app.applicantName || "").trim().toLowerCase();

    if (cleanEmail) {
      if (appEmail === cleanEmail || appEmail.includes(cleanEmail) || cleanEmail.includes(appEmail)) {
        return true;
      }
      if (normalizeEmail(appEmail) === normalizeEmail(cleanEmail)) {
        return true;
      }
    }
    if (cleanName && (appName === cleanName || appName.includes(cleanName) || cleanName.includes(appName))) {
      return true;
    }
    // Check if linked clearance belongs to user
    const linkedRef = String(app.locationalClearanceRef || app.clearanceRef || app.connectedClearanceId || "").trim().toLowerCase();
    if (linkedRef && linkedRef !== "exempt" && linkedRef !== "not_required") {
      const parent = store.get(linkedRef);
      if (parent) {
        const pEmail = (parent.applicantEmail || "").trim().toLowerCase();
        const pName = (parent.applicantName || "").trim().toLowerCase();
        if (cleanEmail && (pEmail === cleanEmail || normalizeEmail(pEmail) === normalizeEmail(cleanEmail))) {
          return true;
        }
        if (cleanName && (pName === cleanName || pName.includes(cleanName) || cleanName.includes(pName))) {
          return true;
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
