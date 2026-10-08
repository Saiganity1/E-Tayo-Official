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
 * Authoritative check if an application has reached Step 4 (Released)
 */
export const isApplicationReleased = (app: any): boolean => {
  if (!app) return false;
  const appId = String(app.id || "").trim();
  const lowerAppId = appId.toLowerCase();
  const upperAppId = appId.toUpperCase();
  const rawStatus = String(app.status || "").toLowerCase().trim();

  // If rejected or cancelled, cannot be released
  if (rawStatus === "rejected" || rawStatus === "cancelled") {
    return false;
  }

  // CRITICAL RULE: If the application status is currently "approved" (Stage 3),
  // it is waiting for Order of Payment settlement and is NOT yet Stage 4 (Released)!
  // It only becomes released if the admin explicitly clicked Confirm Release.
  if (rawStatus === "approved" || rawStatus === "under_review" || rawStatus === "pending") {
    if (typeof window !== "undefined" && appId) {
      if (
        localStorage.getItem(`etayo_released_${appId}`) === "true" ||
        localStorage.getItem(`etayo_released_${lowerAppId}`) === "true" ||
        localStorage.getItem(`etayo_released_${upperAppId}`) === "true" ||
        localStorage.getItem(`etayo_status_${appId}`) === "released" ||
        localStorage.getItem(`etayo_status_${lowerAppId}`) === "released" ||
        localStorage.getItem(`etayo_status_${upperAppId}`) === "released"
      ) {
        return true;
      }
    }
    return false;
  }

  // 1. Direct status on app object
  if (rawStatus === "released" || Boolean((app as any).isReleased) || (app as any).paymentStatus === "paid") {
    return true;
  }

  // 2. Check localStorage flags
  if (typeof window !== "undefined" && appId) {
    if (
      localStorage.getItem(`etayo_released_${appId}`) === "true" ||
      localStorage.getItem(`etayo_released_${lowerAppId}`) === "true" ||
      localStorage.getItem(`etayo_released_${upperAppId}`) === "true" ||
      localStorage.getItem(`etayo_paid_${appId}`) === "true" ||
      localStorage.getItem(`etayo_paid_${lowerAppId}`) === "true" ||
      localStorage.getItem(`etayo_paid_${upperAppId}`) === "true" ||
      localStorage.getItem(`etayo_status_${appId}`) === "released" ||
      localStorage.getItem(`etayo_status_${lowerAppId}`) === "released" ||
      localStorage.getItem(`etayo_status_${upperAppId}`) === "released"
    ) {
      return true;
    }
  }

  // 3. Check tracking steps
  if (Array.isArray(app.trackingSteps) && app.trackingSteps.some((s: any) => 
    (String(s.title || s.name || "").toLowerCase().includes("released") || String(s.title || s.name || "").toLowerCase().includes("4.")) && 
    s.status === "completed"
  )) {
    return true;
  }

  return false;
};

/**
 * Authoritative check if an application has reached Step 3 (Approved) or Step 4 (Released)
 * across all permit types (Locational Clearance, Building Permits, Ancillary, etc.)
 */
export const isApplicationApproved = (app: any): boolean => {
  if (!app) return false;
  const appId = String(app.id || "").trim();
  const lowerAppId = appId.toLowerCase();
  const upperAppId = appId.toUpperCase();
  const rawStatus = String(app.status || "").toLowerCase().trim();

  // Explicitly rejected or cancelled applications are NOT approved
  if (rawStatus === "rejected" || rawStatus === "cancelled" || rawStatus === "incomplete_requirements") {
    return false;
  }

  // 1. Direct status flags from backend or app object — these are authoritative
  if (rawStatus === "approved" || rawStatus.includes("approv") || rawStatus === "released" || Boolean(app.isReleased)) {
    if (typeof window !== "undefined" && appId) {
      try {
        [appId, lowerAppId, upperAppId].forEach(k => {
          if (k) {
            localStorage.setItem(`etayo_status_${k}`, rawStatus === "released" ? "released" : "approved");
            localStorage.setItem(`etayo_approved_${k}`, "true");
          }
        });
      } catch (e) {}
    }
    return true;
  }

  // 2. Local storage persistence (admin approved in this session or browser)
  if (typeof window !== "undefined" && appId) {
    const isLocalApproved = 
      localStorage.getItem(`etayo_approved_${appId}`) === "true" ||
      localStorage.getItem(`etayo_approved_${lowerAppId}`) === "true" ||
      localStorage.getItem(`etayo_approved_${upperAppId}`) === "true" ||
      localStorage.getItem(`etayo_status_${appId}`) === "approved" ||
      localStorage.getItem(`etayo_status_${lowerAppId}`) === "approved" ||
      localStorage.getItem(`etayo_status_${upperAppId}`) === "approved" ||
      localStorage.getItem(`etayo_status_${appId}`) === "released" ||
      localStorage.getItem(`etayo_status_${lowerAppId}`) === "released" ||
      localStorage.getItem(`etayo_status_${upperAppId}`) === "released";

    if (isLocalApproved) {
      return true;
    }
  }

  // 3. Date approved is populated by admin
  if (Boolean(app.dateApproved)) {
    return true;
  }

  // 4. Remarks explicitly indicate approval by admin/staff
  if (typeof app.remarks === "string" && app.remarks.trim()) {
    const rem = app.remarks.toLowerCase();
    if (
      (rem.includes("approved") || rem.includes("clearance approved") || rem.includes("locational clearance approved")) &&
      !rem.includes("not approved") &&
      !rem.includes("disapproved") &&
      !rem.includes("pending")
    ) {
      return true;
    }
  }

  // 5. Tracking steps: check if any step indicates approval is completed
  if (Array.isArray(app.trackingSteps)) {
    const hasApproved = app.trackingSteps.some((st: any) => {
      const sTitle = String(st?.title || st?.name || "").toLowerCase();
      const sStatus = String(st?.status || "").toLowerCase();
      return sStatus === "completed" && (
        sTitle.includes("approved") ||
        sTitle.includes("3.") ||
        sTitle.includes("step 3") ||
        sTitle.includes("endorsement") ||
        sTitle.includes("zoning clearance")
      );
    });
    if (hasApproved) {
      return true;
    }
  }

  return false;
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

  const isLCA = isLocationalClearance(appA);
  const isLCB = isLocationalClearance(appB);

  // 1. Two distinct Locational Clearances NEVER belong to the same project dossier
  if (isLCA && isLCB && appA.id !== appB.id) {
    return false;
  }

  // 2. EXPLICIT CLEARANCE REFERENCE MATCHING (HIGHEST PRIORITY)
  // When applying for Stage 2 (Technical Permits / Building Permit), locationalClearanceRef is passed.
  // If appA references appB's LC ID (or vice versa), they are 100% definitively the same project!
  const refB = (appB.locationalClearanceRef || appB.clearanceRef || appB.connectedClearanceId || "").trim().toLowerCase();
  const refA = (appA.locationalClearanceRef || appA.clearanceRef || appA.connectedClearanceId || "").trim().toLowerCase();
  const isValidRef = (r: string) => Boolean(r && !["exempt", "lc-verified", "not_required", "lc-approved", "none"].includes(r));

  const idALower = String(appA.id || "").trim().toLowerCase();
  const idBLower = String(appB.id || "").trim().toLowerCase();

  // If appB explicitly points to appA's LC id -> 100% DEFINITELY THE SAME PROJECT!
  if (isValidRef(refB) && refB === idALower) {
    return true;
  }
  // If appA explicitly points to appB's LC id -> 100% DEFINITELY THE SAME PROJECT!
  if (isValidRef(refA) && refA === idBLower) {
    return true;
  }

  // If both are Stage 2 permits and both point to the same valid LC id
  if (isValidRef(refA) && isValidRef(refB) && refA === refB) {
    return true;
  }

  // If appB explicitly points to a DIFFERENT LC id, it cannot belong to appA (if appA is LC)
  if (isLCA && isValidRef(refB) && refB !== idALower) {
    return false;
  }
  if (isLCB && isValidRef(refA) && refA !== idBLower) {
    return false;
  }

  // 3. Applicant check: tolerate generic names like "Applicant" or "Juan Dela Cruz"
  const nameA = (appA.applicantName || "").trim().toLowerCase();
  const nameB = (appB.applicantName || "").trim().toLowerCase();
  const isGenericName = (n: string) => !n || ["applicant", "juan dela cruz", "user"].includes(n);
  if (!isGenericName(nameA) && !isGenericName(nameB) && nameA !== nameB) {
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

export const parseDateToTimestamp = (dateVal: any): number => {
  if (!dateVal) return 0;
  if (typeof dateVal === "number" && !isNaN(dateVal) && dateVal > 0) return dateVal;
  if (typeof dateVal === "string") {
    const clean = dateVal.trim();
    if (!clean) return 0;
    const direct = new Date(clean).getTime();
    if (!isNaN(direct) && direct > 0) return direct;
    const parts = clean.split(",");
    if (parts.length >= 2) {
      const fallback = new Date(`${parts[0].trim()}, ${parts[1].trim().split(" ")[0]}`).getTime();
      if (!isNaN(fallback) && fallback > 0) return fallback;
    }
  }
  return 0;
};

export const getNumericId = (id?: string): number => {
  if (!id) return 0;
  const match = String(id).match(/\d+/g);
  if (!match || match.length === 0) return 0;
  if (match.length >= 2) {
    const year = parseInt(match[0], 10);
    const seq = parseInt(match[match.length - 1], 10);
    if (!isNaN(year) && !isNaN(seq) && year >= 1990 && year <= 2100) {
      return year * 1_000_000 + seq;
    }
  }
  const lastNum = parseInt(match[match.length - 1], 10);
  return isNaN(lastNum) ? 0 : lastNum;
};

export const getAppTimestamp = (app: any): number => {
  if (!app) return 0;

  // 1. High precision ISO timestamps (createdAt, updatedAt, timestamp, etc.)
  const isoFields = [
    app.createdAt,
    app.submittedAt,
    app.submissionTime,
    app.timestamp,
    app.updatedAt
  ];
  for (const f of isoFields) {
    const t = parseDateToTimestamp(f);
    if (t > 0) return t;
  }

  // 2. Submission date string (dateSubmitted, submissionDate, dateApproved)
  const dateFields = [
    app.dateSubmitted,
    app.submissionDate,
    app.dateApproved
  ];
  for (const f of dateFields) {
    const t = parseDateToTimestamp(f);
    if (t > 0) return t;
  }

  // 3. Check history log dates
  if (Array.isArray(app.historyLog) && app.historyLog.length > 0) {
    for (const h of app.historyLog) {
      const t = parseDateToTimestamp(h?.date);
      if (t > 0) return t;
    }
  }

  return 0;
};

export const compareAppsNewestFirst = (a: any, b: any): number => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  // 1. Compare by actual submission/creation timestamp (Newest first)
  const timeA = getAppTimestamp(a);
  const timeB = getAppTimestamp(b);
  if (timeA !== timeB) {
    return timeB - timeA;
  }

  // 2. If valid millisecond timestamps were explicitly stored in _seq (> 1e11), use them
  const seqA = Number((a as any)._seq || 0);
  const seqB = Number((b as any)._seq || 0);
  if (seqA > 1e11 && seqB > 1e11 && seqA !== seqB) {
    return seqB - seqA;
  }

  // 3. Fallback: check numeric suffix in permit ID (e.g., 9999 vs 9314 vs 1840)
  const idNumA = getNumericId(a.id);
  const idNumB = getNumericId(b.id);
  if (idNumA !== idNumB) {
    return idNumB - idNumA;
  }

  // 4. Stable tiebreaker: lexicographical comparison of permit ID
  return String(b.id || "").localeCompare(String(a.id || ""));
};

export const getDossierLatestTimestamp = (d: ProjectDossier): number => {
  if (!d || !d.applications || d.applications.length === 0) {
    return parseDateToTimestamp(d?.latestDate);
  }
  return Math.max(...d.applications.map(getAppTimestamp));
};

export const compareDossiersNewestFirst = (a: ProjectDossier, b: ProjectDossier): number => {
  // 1. Pending / Under Review dossiers take priority so staff can act on forms awaiting review
  if (a.pendingCount > 0 && b.pendingCount === 0) return -1;
  if (b.pendingCount > 0 && a.pendingCount === 0) return 1;

  // 2. MOST RECENT ACTIVITY / SUBMISSION FIRST (Chronological Descending)
  const timeA = getDossierLatestTimestamp(a);
  const timeB = getDossierLatestTimestamp(b);
  if (timeB !== timeA) {
    return timeB - timeA;
  }

  // 3. Stable tiebreaker: compare highest numeric permit ID across applications (e.g. 9999 vs 9314 vs 1840)
  const maxIdA = Math.max(...a.applications.map(x => getNumericId(x.id)), 0);
  const maxIdB = Math.max(...b.applications.map(x => getNumericId(x.id)), 0);
  if (maxIdB !== maxIdA) {
    return maxIdB - maxIdA;
  }

  // 4. Stable tiebreaker: compare project name, applicant name, and dossier ID
  const titleCompare = String(b.projectName || "").localeCompare(String(a.projectName || ""));
  if (titleCompare !== 0) return titleCompare;

  const applicantCompare = String(b.applicantName || "").localeCompare(String(a.applicantName || ""));
  if (applicantCompare !== 0) return applicantCompare;

  return String(b.id || "").localeCompare(String(a.id || ""));
};

/**
 * Groups an array of applications into distinct, organized Project Dossiers.
 * Sorted chronologically so that the most recent application/dossier is always on top.
 */
export const groupApplicationsIntoProjectDossiers = (apps: PermitApplication[]): ProjectDossier[] => {
  const dossiers: ProjectDossier[] = [];
  // Sort input applications newest first using deterministic comparator
  const sortedApps = [...apps].sort(compareAppsNewestFirst);

  sortedApps.forEach(app => {
    // Find an existing dossier where ALL applications belong to the same project
    let matchedDossier: ProjectDossier | null = null;

    for (const dossier of dossiers) {
      const allMatch = dossier.applications.every(existingApp => areAppsInSameProject(app, existingApp));
      if (allMatch) {
        matchedDossier = dossier;
        break;
      }
    }

    const appId = String(app.id || "").trim();
    const lowerAppId = appId.toLowerCase();
    const upperAppId = appId.toUpperCase();
    const rawStatus = String(app.status || "").toLowerCase().trim();

    const isAppApproved = isApplicationApproved(app);

    const isLocalUnderReview = typeof window !== "undefined" && Boolean(appId) && (
      localStorage.getItem(`etayo_status_${appId}`) === "under_review" ||
      localStorage.getItem(`etayo_status_${lowerAppId}`) === "under_review" ||
      localStorage.getItem(`etayo_status_${upperAppId}`) === "under_review" ||
      rawStatus === "under_review"
    );

    if (matchedDossier) {
      matchedDossier.applications.push(app);
      matchedDossier.totalCount++;
      if (isAppApproved) {
        matchedDossier.approvedCount++;
      } else if (rawStatus === "pending" || rawStatus === "under_review" || isLocalUnderReview) {
        matchedDossier.pendingCount++;
      } else if (rawStatus === "rejected") {
        matchedDossier.rejectedCount++;
      }
      if (rawStatus === "incomplete_requirements" || rawStatus === "rejected") {
        matchedDossier.actionRequiredCount = (matchedDossier.actionRequiredCount || 0) + 1;
      }
      // Update latestDate if this app has a newer timestamp
      const curTime = parseDateToTimestamp(matchedDossier.latestDate);
      const appTime = getAppTimestamp(app);
      if (appTime > curTime) {
        matchedDossier.latestDate = app.dateSubmitted || (app as any).createdAt || matchedDossier.latestDate;
      }
      // Keep projectName the cleanest / most descriptive base name
      const curBase = extractBaseProjectName({ projectName: matchedDossier.projectName });
      const appBase = extractBaseProjectName(app);
      if (curBase === "Permit Project" && appBase !== "Permit Project") {
        matchedDossier.projectName = appBase;
      }
    } else {
      const baseTitle = extractBaseProjectName(app);
      const isPending = !isAppApproved && (rawStatus === "pending" || rawStatus === "under_review" || isLocalUnderReview);
      const isRejected = rawStatus === "rejected";
      const isAction = rawStatus === "incomplete_requirements" || rawStatus === "rejected";

      // Build stable, deterministic dossier ID
      const cleanAppId = String(app.id || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const cleanAppIdNoPrefix = cleanAppId.replace(/^lc-/i, "").replace(/^bp-/i, "").replace(/^app-/i, "");
      const lcRef = (app.locationalClearanceRef || (app as any).clearanceRef || (app as any).connectedClearanceId || "").trim().toLowerCase();
      const cleanLcRef = lcRef.replace(/^lc-/i, "").replace(/[^a-z0-9]+/g, "-");
      const isLC = isLocationalClearance(app);
      const applicantSlug = (app.applicantName || "applicant").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const projectSlug = (baseTitle || "project").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

      let stableDossierId = `DOSSIER-${applicantSlug}-${projectSlug}`;
      if (isLC && cleanAppIdNoPrefix) {
        stableDossierId = `DOSSIER-lc-${cleanAppIdNoPrefix}`;
      } else if (cleanLcRef && !["exempt", "verified", "not_required", "approved", "none"].includes(cleanLcRef)) {
        stableDossierId = `DOSSIER-lc-${cleanLcRef}`;
      }

      if (dossiers.some(d => d.id === stableDossierId)) {
        stableDossierId = `${stableDossierId}-${cleanAppId}`;
      }

      dossiers.push({
        id: stableDossierId,
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
        latestDate: app.dateSubmitted || (app as any).createdAt || new Date().toISOString()
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
    d.applications.sort((a, b) => {
      const rankDiff = typeRank(a.permitType, a.id) - typeRank(b.permitType, b.id);
      if (rankDiff !== 0) return rankDiff;
      return compareAppsNewestFirst(a, b);
    });
  });

  // Sort dossiers newest first
  return dossiers.sort(compareDossiersNewestFirst);
};

export interface FormattedSubmissionDateTime {
  date: string;
  time: string;
  full: string;
  hasExplicitTime: boolean;
}

/**
 * Returns a stable, deterministic office filing time during Sto. Tomas municipal
 * office hours (8:15 AM - 4:45 PM) based on application ID hash.
 * Used as a fallback for legacy records that only saved a date string without time.
 */
export const getDeterministicFilingTime = (id: string = ""): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const minuteOffset = positiveHash % 510;
  const totalMinutes = 8 * 60 + 15 + minuteOffset;
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const ampm = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours12)}:${pad(minutes)} ${ampm}`;
};

/**
 * Formats submission date and time for applications, dossiers, or raw timestamps.
 * Prioritizes high-precision timestamps (createdAt, submittedAt, ISO strings, system logs),
 * and handles legacy records gracefully.
 */
export const formatSubmissionDateTime = (
  appOrDate: any,
  options?: {
    app?: any;
    systemLogs?: any[];
  }
): FormattedSubmissionDateTime => {
  if (!appOrDate) {
    return {
      date: "Recent",
      time: "",
      full: "Recent",
      hasExplicitTime: false
    };
  }

  let targetApp: any = null;
  let rawDateVal: any = null;

  if (typeof appOrDate === "object" && appOrDate !== null) {
    if ("applications" in appOrDate && Array.isArray(appOrDate.applications)) {
      // It's a ProjectDossier
      targetApp = appOrDate.applications[0] || null;
      rawDateVal = appOrDate.latestDate || targetApp?.dateSubmitted || (targetApp as any)?.createdAt;
    } else {
      // It's a PermitApplication
      targetApp = appOrDate;
      rawDateVal = targetApp.dateSubmitted || targetApp.createdAt || targetApp.submittedAt;
    }
  } else {
    rawDateVal = appOrDate;
    targetApp = options?.app || null;
  }

  let resolvedTimestamp: Date | null = null;
  let hasExplicitTime = false;

  const candidateTimestamps = [
    targetApp?.createdAt,
    targetApp?.submittedAt,
    targetApp?.timestamp,
    targetApp?.submissionTime
  ];

  for (const c of candidateTimestamps) {
    if (c) {
      const d = new Date(c);
      if (!isNaN(d.getTime())) {
        resolvedTimestamp = d;
        hasExplicitTime = true;
        break;
      }
    }
  }

  // Check if rawDateVal itself has an explicit time component
  if (!resolvedTimestamp && rawDateVal && typeof rawDateVal === "string") {
    const cleanStr = rawDateVal.trim();
    const hasColon = cleanStr.includes(":");
    const hasAmPm = /am|pm/i.test(cleanStr);
    const hasIsoT = cleanStr.includes("T");

    const directDate = new Date(cleanStr);
    if (!isNaN(directDate.getTime())) {
      resolvedTimestamp = directDate;
      if (hasColon || hasAmPm || hasIsoT || directDate.getHours() !== 0 || directDate.getMinutes() !== 0) {
        hasExplicitTime = true;
      }
    }
  }

  // Check systemLogs if available
  if (!hasExplicitTime && targetApp?.id && Array.isArray(options?.systemLogs)) {
    const appIdLower = String(targetApp.id).toLowerCase();
    const subLog = options?.systemLogs.find((l: any) => {
      const msg = String(l?.message || "").toLowerCase();
      const det = String(l?.details || "").toLowerCase();
      const id = String(l?.id || "").toLowerCase();
      return (
        (id.includes(appIdLower) || msg.includes(appIdLower) || det.includes(appIdLower)) &&
        (l?.action === "APPLICATION_SUBMITTED" || l?.action === "PERMIT_CREATED" || id.startsWith("log-sub-"))
      );
    });

    if (subLog && subLog.timestamp) {
      const logDate = new Date(subLog.timestamp);
      if (!isNaN(logDate.getTime())) {
        if (!resolvedTimestamp) {
          resolvedTimestamp = logDate;
        }
        if (logDate.getHours() !== 0 || logDate.getMinutes() !== 0) {
          resolvedTimestamp = logDate;
          hasExplicitTime = true;
        }
      }
    }
  }

  // Fallback parsing for human string formats ("October 08, 2026", "2026-10-01", etc.)
  if (!resolvedTimestamp && rawDateVal) {
    const cleanStr = String(rawDateVal).trim();
    const directDate = new Date(cleanStr);
    if (!isNaN(directDate.getTime())) {
      resolvedTimestamp = directDate;
    } else {
      const parts = cleanStr.split(",");
      if (parts.length >= 2) {
        const fallback = new Date(`${parts[0].trim()}, ${parts[1].trim().split(" ")[0]}`);
        if (!isNaN(fallback.getTime())) {
          resolvedTimestamp = fallback;
        }
      }
    }
  }

  if (!resolvedTimestamp || isNaN(resolvedTimestamp.getTime())) {
    const fallbackId = targetApp?.id || "";
    const genTime = getDeterministicFilingTime(fallbackId);
    return {
      date: typeof rawDateVal === "string" && rawDateVal.trim() ? rawDateVal.trim() : "Recent",
      time: genTime,
      full: typeof rawDateVal === "string" && rawDateVal.trim() ? `${rawDateVal.trim()} • ${genTime}` : `Recent • ${genTime}`,
      hasExplicitTime: false
    };
  }

  const dateFormatted = resolvedTimestamp.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });

  let timeFormatted = "";
  if (hasExplicitTime) {
    timeFormatted = resolvedTimestamp.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } else {
    const refId = targetApp?.id || (appOrDate?.id || "");
    timeFormatted = getDeterministicFilingTime(refId);
  }

  return {
    date: dateFormatted,
    time: timeFormatted,
    full: `${dateFormatted} • ${timeFormatted}`,
    hasExplicitTime
  };
};

export interface EvaluatorInfo {
  name: string;
  role?: string;
  email?: string;
  isAssigned: boolean;
  evaluatedAt?: string;
}

/**
 * Resolves the staff or admin officer who evaluated the permit application.
 * Checks app.evaluatedBy, localStorage records, assignedStaff, tracking steps,
 * history logs, and system audit logs, with official Sto. Tomas municipal authority
 * attribution for Locational Clearance and Building Permits.
 */
export const getApplicationEvaluator = (app: any, options?: { systemLogs?: any[] }): EvaluatorInfo => {
  if (!app) return { name: "Pending Evaluation", isAssigned: false };

  const appId = String(app.id || "").trim();
  const lowerId = appId.toLowerCase();
  const upperId = appId.toUpperCase();
  const isLC = isLocationalClearance(app);

  // 1. Direct evaluatedBy property on application object
  if (app.evaluatedBy && typeof app.evaluatedBy === "string" && app.evaluatedBy.trim()) {
    const cleanName = app.evaluatedBy.trim();
    return {
      name: cleanName,
      email: app.evaluatorEmail || undefined,
      role: cleanName.includes("Engr") ? "Municipal Building Official" : (isLC ? "Zoning Officer" : "Technical Evaluator"),
      isAssigned: true,
      evaluatedAt: app.evaluatedAt || app.dateApproved
    };
  }

  // 2. Explicit localStorage lookup (saved by evaluator session in browser)
  if (typeof window !== "undefined" && appId) {
    const localName = localStorage.getItem(`etayo_evaluated_by_${appId}`) ||
                      localStorage.getItem(`etayo_evaluated_by_${lowerId}`) ||
                      localStorage.getItem(`etayo_evaluated_by_${upperId}`);
    if (localName && localName.trim()) {
      const cleanName = localName.trim();
      const localEmail = localStorage.getItem(`etayo_evaluator_email_${appId}`) ||
                         localStorage.getItem(`etayo_evaluator_email_${lowerId}`) ||
                         localStorage.getItem(`etayo_evaluator_email_${upperId}`);
      const localAt = localStorage.getItem(`etayo_evaluated_at_${appId}`) ||
                      localStorage.getItem(`etayo_evaluated_at_${lowerId}`) ||
                      localStorage.getItem(`etayo_evaluated_at_${upperId}`);
      return {
        name: cleanName,
        email: localEmail || undefined,
        role: cleanName.includes("Engr") ? "Municipal Building Official" : (isLC ? "Zoning Officer" : "Technical Evaluator"),
        isAssigned: true,
        evaluatedAt: localAt || undefined
      };
    }
  }

  // 3. assignedStaff property
  if (app.assignedStaff && typeof app.assignedStaff === "string" && app.assignedStaff.trim()) {
    const cleanName = app.assignedStaff.trim();
    return {
      name: cleanName,
      role: isLC ? "Zoning Officer" : "Technical Evaluator",
      isAssigned: true
    };
  }

  // 4. Tracking steps actor
  if (Array.isArray(app.trackingSteps)) {
    for (const step of app.trackingSteps) {
      const sTitle = String(step?.title || step?.name || "").toLowerCase();
      const sActor = String(step?.actor || "").trim();
      if (sActor && (sTitle.includes("evaluation") || sTitle.includes("approved") || sTitle.includes("zoning") || sTitle.includes("endorsement"))) {
        const parts = sActor.split("/");
        return {
          name: parts[0].trim(),
          role: parts[1] ? parts[1].trim() : (isLC ? "Zoning Administrator" : "Building Official"),
          isAssigned: true
        };
      }
    }
  }

  // 5. History logs actor
  if (Array.isArray(app.historyLog)) {
    for (const h of app.historyLog) {
      const hActor = String(h?.actor || "").trim();
      const hAction = String(h?.action || "").toLowerCase();
      if (hActor && (hAction.includes("approved") || hAction.includes("evaluated") || hAction.includes("review"))) {
        return {
          name: hActor,
          role: isLC ? "Zoning Officer" : "Technical Evaluator",
          isAssigned: true
        };
      }
    }
  }

  // 6. System audit logs
  if (Array.isArray(options?.systemLogs)) {
    const matchLog = options.systemLogs.find(l => 
      (l.message?.includes(appId) || l.details?.includes(appId)) &&
      (l.action?.includes("EVALUAT") || l.action?.includes("APPROV"))
    );
    if (matchLog && matchLog.user && matchLog.user !== "Applicant") {
      return {
        name: matchLog.user,
        role: isLC ? "Zoning Officer" : "Technical Evaluator",
        isAssigned: true
      };
    }
  }

  // 7. Authoritative official evaluating office fallback for Approved / Released permits
  if (isApplicationApproved(app) || isApplicationReleased(app) || app.status === "approved" || app.status === "released") {
    return {
      name: isLC ? "MPDO Zoning Administrator" : "Engr. Gilbert Cruz",
      role: isLC ? "Zoning Officer" : "Municipal Building Official",
      isAssigned: true
    };
  }

  if (app.status === "under_review") {
    return {
      name: isLC ? "MPDO Technical Committee" : "OBO Engineering Section",
      role: "Under Active Review",
      isAssigned: true
    };
  }

  return {
    name: "Pending Assignment",
    role: "Awaiting Staff Review",
    isAssigned: false
  };
};
