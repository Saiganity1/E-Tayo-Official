import { PermitApplication } from "@/types";

export interface ProjectDossier {
  id: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  projectName: string;
  projectAddress: string;
  projectType?: string;
  applications: PermitApplication[];
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  actionRequiredCount: number;
  latestDate: string;
}

/**
 * Checks if an application is Stage 1 Locational Clearance / Zoning
 */
export const isLocationalClearance = (app: any): boolean => {
  if (!app) return false;
  const pType = (app.permitType || "").toLowerCase();
  const id = (app.id || "").toLowerCase();
  return pType.includes("locational") || pType.includes("zoning") || id.startsWith("lc-");
};

/**
 * Checks if an application is Stage 2 Building Permit / Technical Permitting
 */
export const isBuildingPermit = (app: any): boolean => {
  if (!app) return false;
  const pType = (app.permitType || "").toLowerCase();
  const id = (app.id || "").toLowerCase();
  return (
    pType.includes("building") ||
    pType.includes("architectural") ||
    pType.includes("structural") ||
    pType.includes("civil") ||
    pType.includes("electrical") ||
    pType.includes("plumbing") ||
    pType.includes("sanitary") ||
    pType.includes("mechanical") ||
    id.startsWith("bp-") ||
    id.startsWith("app-")
  );
};

/**
 * Extracts a normalized, clean project title for grouping and display.
 * Strips out form/stage noise (e.g. "- Locational Clearance", "Installation & Construction")
 * and extracts meaningful names like "Single-Detached House", "Resort + Swimming Pool".
 */
export const extractBaseProjectName = (app: any): string => {
  if (!app) return "Permit Project";

  // Check projectType string or object
  const rawType = typeof app.projectType === "object" ? (app.projectType as any)?.name : app.projectType;
  const pTypeStr = (typeof rawType === "string" ? rawType : "").trim();

  // Check projectName
  const pName = (app.projectName || "").trim();

  const cleanTitle = (raw: string): string => {
    return raw
      .replace(/\s*-\s*locational\s*clearance/gi, "")
      .replace(/\s*locational\s*clearance/gi, "")
      .replace(/\s*installation\s*&\s*construction/gi, "")
      .replace(/\s*building\s*permit/gi, "")
      .replace(/\s*occupancy\s*permit/gi, "")
      .replace(/\s*construction/gi, "")
      .trim();
  };

  const isGeneric = (str: string): boolean => {
    const s = str.toLowerCase();
    return !s || [
      "permit project",
      "residential house",
      "commercial building",
      "other",
      "unknown",
      "locational clearance",
      "building permit",
      "project portfolio"
    ].includes(s);
  };

  const cleanedName = cleanTitle(pName);
  if (cleanedName && !isGeneric(cleanedName)) {
    return cleanedName;
  }

  const cleanedType = cleanTitle(pTypeStr);
  if (cleanedType && !isGeneric(cleanedType)) {
    return cleanedType;
  }

  if (pTypeStr && !isGeneric(pTypeStr)) {
    return pTypeStr;
  }

  if (cleanedName) {
    return cleanedName;
  }

  // Check if projectDescription has a leading title (e.g., "Resort + Swimming Pool (New Construction) - ...")
  if (app.projectDescription) {
    const desc = String(app.projectDescription).split("(")[0].split("-")[0].trim();
    const cleanDesc = cleanTitle(desc);
    if (cleanDesc && cleanDesc.length > 2 && cleanDesc.length < 50 && !isGeneric(cleanDesc)) {
      return cleanDesc;
    }
  }

  return pName || pTypeStr || "Permit Project";
};

/**
 * Normalizes title for comparison (strips punctuation and spaces)
 */
export const normalizeTitle = (title: string): string => {
  return (title || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
};

/**
 * Determines whether two applications belong to the SAME project.
 * E.g., Stage 1 LC and Stage 2 BP for "Single-Detached House" are the same project.
 * But "Single-Detached House" and "Resort + Swimming Pool" are DIFFERENT projects.
 * Also, two separate Locational Clearances (e.g. LC-8758 and LC-1713) are DIFFERENT projects.
 */
export const areAppsInSameProject = (appA: any, appB: any): boolean => {
  if (!appA || !appB) return false;
  if (appA.id === appB.id) return true;

  // 1. Applicant check: if both have applicant names and they differ, they cannot be the same project
  const nameA = (appA.applicantName || "").trim().toLowerCase();
  const nameB = (appB.applicantName || "").trim().toLowerCase();
  if (nameA && nameB && nameA !== nameB) {
    return false;
  }

  const isLCA = isLocationalClearance(appA);
  const isLCB = isLocationalClearance(appB);

  // 2. Two distinct Locational Clearances NEVER belong to the same project dossier
  // Each LC represents a distinct zoning clearance filing
  if (isLCA && isLCB && appA.id !== appB.id) {
    return false;
  }

  // 3. Explicit Locational Clearance Reference matching
  // When applying for Stage 2 (Technical Permits / Building Permit), locationalClearanceRef is passed
  const refB = (appB.locationalClearanceRef || appB.clearanceRef || appB.connectedClearanceId || "").trim().toLowerCase();
  const refA = (appA.locationalClearanceRef || appA.clearanceRef || appA.connectedClearanceId || "").trim().toLowerCase();
  const isValidRef = (r: string) => Boolean(r && !["exempt", "lc-verified", "not_required", "lc-approved", "none"].includes(r));

  const idALower = String(appA.id || "").trim().toLowerCase();
  const idBLower = String(appB.id || "").trim().toLowerCase();

  // If appB explicitly points to appA's LC id
  if (isValidRef(refB) && refB === idALower) {
    return true;
  }
  // If appA explicitly points to appB's LC id
  if (isValidRef(refA) && refA === idBLower) {
    return true;
  }

  // If appB explicitly points to a DIFFERENT LC id, it cannot belong to appA (if appA is LC)
  if (isLCA && isValidRef(refB) && refB !== idALower) {
    return false;
  }
  if (isLCB && isValidRef(refA) && refA !== idBLower) {
    return false;
  }

  // 4. Project Base Title Matching
  const titleA = extractBaseProjectName(appA);
  const titleB = extractBaseProjectName(appB);
  const normA = normalizeTitle(titleA);
  const normB = normalizeTitle(titleB);

  const genericTitles = ["permitproject", "residentialhouse", "commercialbuilding", "other", "unknown"];
  const isGenericA = genericTitles.includes(normA);
  const isGenericB = genericTitles.includes(normB);

  // If both have specific project titles (e.g. "Single-Detached House" vs "Resort + Swimming Pool")
  if (normA && normB && !isGenericA && !isGenericB) {
    const titlesMatch = normA === normB ||
      (normA.length >= 8 && normB.length >= 8 && (normA.includes(normB) || normB.includes(normA)));

    if (!titlesMatch) {
      // Titles are explicitly different -> DIFFERENT projects!
      return false;
    }

    // Titles match! If one is LC and one is BP, they form the same project
    return true;
  }

  // If one or both have generic titles, check if address matches AND they are different stages (LC vs BP)
  if (isLCA !== isLCB) {
    const addrA = (appA.projectAddress || appA.location?.address || "").trim().toLowerCase();
    const addrB = (appB.projectAddress || appB.location?.address || "").trim().toLowerCase();
    if (addrA && addrB && (addrA === addrB || addrA.slice(0, 16) === addrB.slice(0, 16))) {
      // Only match if titles don't explicitly conflict
      if (!isGenericA && !isGenericB && normA !== normB) {
        return false;
      }
      return true;
    }
  }

  return false;
};

/**
 * Finds the connected application (e.g. Stage 1 LC for a Stage 2 BP, or vice-versa) for the same project.
 */
export const getConnectedProjectApp = (app: any, allApps: any[]): any | null => {
  if (!app || !allApps || !Array.isArray(allApps)) return null;
  return allApps.find((other: any) => {
    if (!other || other.id === app.id) return false;
    return areAppsInSameProject(app, other);
  }) || null;
};

/**
 * Groups an array of applications into distinct, organized Project Dossiers.
 */
export const groupApplicationsIntoProjectDossiers = (apps: PermitApplication[]): ProjectDossier[] => {
  const dossiers: ProjectDossier[] = [];

  apps.forEach(app => {
    // Find an existing dossier where ALL applications belong to the same project
    let matchedDossier: ProjectDossier | null = null;

    for (const dossier of dossiers) {
      const allMatch = dossier.applications.every(existingApp => areAppsInSameProject(app, existingApp));
      if (allMatch) {
        matchedDossier = dossier;
        break;
      }
    }

    const appId = String(app.id || "");
    const lowerAppId = appId.toLowerCase();
    const isAppApproved = app.status === "approved" || app.status === "released" || (typeof window !== "undefined" && (
      localStorage.getItem(`etayo_approved_${appId}`) === "true" ||
      localStorage.getItem(`etayo_approved_${lowerAppId}`) === "true" ||
      localStorage.getItem(`etayo_status_${appId}`) === "approved" ||
      localStorage.getItem(`etayo_status_${lowerAppId}`) === "approved"
    ));

    if (matchedDossier) {
      matchedDossier.applications.push(app);
      matchedDossier.totalCount++;
      if (isAppApproved) {
        matchedDossier.approvedCount++;
      } else if (app.status === "pending" || app.status === "under_review") {
        matchedDossier.pendingCount++;
      } else if (app.status === "rejected") {
        matchedDossier.rejectedCount++;
      }
      if (app.status === "incomplete_requirements" || app.status === "rejected") {
        matchedDossier.actionRequiredCount = (matchedDossier.actionRequiredCount || 0) + 1;
      }
      // Keep projectName the cleanest / most descriptive base name
      const curBase = extractBaseProjectName({ projectName: matchedDossier.projectName });
      const appBase = extractBaseProjectName(app);
      if (curBase === "Permit Project" && appBase !== "Permit Project") {
        matchedDossier.projectName = appBase;
      }
    } else {
      const baseTitle = extractBaseProjectName(app);
      const isPending = !isAppApproved && (app.status === "pending" || app.status === "under_review");
      const isRejected = app.status === "rejected";
      const isAction = app.status === "incomplete_requirements" || app.status === "rejected";

      dossiers.push({
        id: `DOSSIER-${dossiers.length + 1}`,
        applicantName: app.applicantName || "Unknown Applicant",
        applicantPhone: app.applicantPhone || "",
        applicantEmail: app.applicantEmail || "",
        projectName: baseTitle,
        projectAddress: app.projectAddress || app.location?.address || "Sto. Tomas, Pampanga",
        projectType: typeof app.projectType === "object" ? (app.projectType as any)?.name : (app.projectType || baseTitle),
        applications: [app],
        totalCount: 1,
        pendingCount: isPending ? 1 : 0,
        approvedCount: isAppApproved ? 1 : 0,
        rejectedCount: isRejected ? 1 : 0,
        actionRequiredCount: isAction ? 1 : 0,
        latestDate: app.dateSubmitted || new Date().toISOString()
      });
    }
  });

  // Sort applications inside each dossier: LC first, then BP, then others
  const typeRank = (type?: string, id?: string) => {
    const t = (type || "").toLowerCase();
    const i = (id || "").toLowerCase();
    if (t.includes("locational") || t.includes("zoning") || i.startsWith("lc-")) return 1;
    if (t.includes("building") || i.startsWith("bp-") || i.startsWith("app-")) return 2;
    if (t.includes("architectural")) return 3;
    if (t.includes("civil") || t.includes("structural")) return 4;
    if (t.includes("electrical")) return 5;
    if (t.includes("sanitary") || t.includes("plumb")) return 6;
    if (t.includes("mechanical")) return 7;
    if (t.includes("occupancy") || i.startsWith("oc-")) return 8;
    return 9;
  };

  dossiers.forEach(d => {
    d.applications.sort((a, b) => typeRank(a.permitType, a.id) - typeRank(b.permitType, b.id));
  });

  // Sort dossiers: ones with pending submissions first, then by count / date
  return dossiers.sort((a, b) => {
    if (a.pendingCount > 0 && b.pendingCount === 0) return -1;
    if (b.pendingCount > 0 && a.pendingCount === 0) return 1;
    return b.applications.length - a.applications.length;
  });
};
