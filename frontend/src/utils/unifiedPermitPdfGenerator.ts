import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { ProjectTypeItem, PERMIT_FORM_METADATA, PermitFormMatrix } from "../data/projectTypeMatrix";

export interface UnifiedPermitFormData {
  applicationNo: string;
  locationalClearanceRef: string;
  projectType: ProjectTypeItem;

  // Applicant details (Box 1)
  applicantName: string;
  applicantFirstName?: string;
  applicantMiddleName?: string;
  applicantLastName?: string;
  applicantPhone: string;
  applicantEmail: string;
  applicantAddress: string;
  applicantTIN?: string;
  formOfOwnership?: string;
  govIdNo?: string;

  // Header Classifications & Applications (BP)
  processingType?: "SIMPLE" | "COMPLEX";
  applicationType?: "NEW" | "RENEWAL" | "AMENDATORY";
  appliesLocationalClearance?: boolean;
  appliesFireSafetyClearance?: boolean;

  // Project details & Location (Box 2)
  projectName: string;
  projectAddress: string;
  barangay: string;
  lotNo?: string;
  blockNo?: string;
  tctNo?: string;
  taxDecNo?: string;
  lotArea: string;
  floorArea: string;
  buildingFootprint?: string;
  buildingHeight?: string;
  projectCost: string;
  scopeOfWork: string;
  scopeOthers?: string;
  occupancyClass: string;
  proposedStoreys: string;
  numberOfUnits?: string;
  proposedStartDate?: string;
  expectedCompletionDate?: string;

  // Cost breakdowns (Box 5)
  costBuilding?: string;
  costElectrical?: string;
  costMechanical?: string;
  costPlumbing?: string;
  costElectronics?: string;
  costEquipment?: string;
  costOthers?: string;

  // Architectural Permit details
  architecturalStyle?: string;
  roofingMaterial?: string;
  exteriorWallFinish?: string;
  interiorWallFinish?: string;
  floorFinishes?: string;
  ceilingFinishes?: string;
  doorsSpec?: string;
  windowsSpec?: string;
  frontSetback?: string;
  rearSetback?: string;
  leftSetback?: string;
  rightSetback?: string;
  bedroomCount?: string;
  bathroomCount?: string;

  // Civil / Structural Permit details
  foundationType?: string;
  foundationDepth?: string;
  structuralFraming?: string;
  floorSlabSystem?: string;
  roofFramingSystem?: string;
  concreteStrength?: string;
  steelGrade?: string;
  masonrySpec?: string;

  // Electrical Permit details
  electricalConnectedLoad?: string;
  electricalVoltage?: string;
  electricalFeeder?: string;
  mainBreaker?: string;
  branchCircuitsCount?: string;
  lightingOutletsCount?: string;
  convenienceOutletsCount?: string;
  acuOutletsCount?: string;
  waterHeaterOutletsCount?: string;
  groundingSpec?: string;

  // Sanitary / Plumbing Permit details
  waterSupplySource?: string;
  sewageSystem?: string;
  septicTankDimensions?: string;
  waterPipesMaterial?: string;
  wastePipesMaterial?: string;
  waterClosetsCount?: string;
  lavatoriesCount?: string;
  kitchenSinksCount?: string;
  showersCount?: string;
  floorDrainsCount?: string;
  faucetsCount?: string;

  // Equipment & specialized machinery details (for Elevator/Escalator, Mechanical, Generator)
  machineryType?: string;
  machineryBrand?: string;
  machineryCapacity?: string;
  machineryPower?: string;
  machinerySpeed?: string;
  machineryStoreys?: string;
  electricalLoadKva?: string;
  serviceVoltage?: string;

  // Electronics details
  telecomScope?: string;
  cctvScope?: string;
  fdasScope?: string;

  // Fire / BFP details
  numberOfExits?: string;
  fireEgressDetails?: string;
  fireExtinguisherSpecs?: string;
  emergencyLightsCount?: string;
  smokeDetectorsCount?: string;
  firewallSpecs?: string;

  // Demolition Permit details
  demolitionBuildingType?: string;
  demolitionArea?: string;
  demolitionStoreys?: string;
  demolitionScope?: string;

  // Fencing Permit details
  fencingType?: string;
  fencingLength?: string;
  fencingHeight?: string;
  fencingCost?: string;

  // Excavation Permit details
  excavationVolume?: string;
  excavationDepth?: string;
  excavationScope?: string;

  // Sign Permit details
  signType?: string;
  signDimensions?: string;
  signMaterial?: string;
  signCost?: string;

  // Temporary Service Connection details
  temporaryServicePurpose?: string;
  temporaryServiceKva?: string;
  temporaryServiceVoltage?: string;
  temporaryServiceDuration?: string;

  // Occupancy & Completion details
  actualCompletionDate?: string;
  actualProjectCost?: string;
  actualFloorArea?: string;
  constructionSupervisorName?: string;
  cfeiInspectorName?: string;

  // Professional details
  architectName?: string;
  architectAddress?: string;
  architectPRC?: string;
  architectPRCValidity?: string;
  architectIAPOA?: string;
  architectPTR?: string;
  architectPTRIssued?: string;
  architectPTRIssuedAt?: string;
  architectTIN?: string;

  civilEngineerName?: string;
  civilEngineerAddress?: string;
  civilEngineerPRC?: string;
  civilEngineerPRCValidity?: string;
  civilEngineerPICE?: string;
  civilEngineerPTR?: string;
  civilEngineerPTRIssued?: string;
  civilEngineerPTRIssuedAt?: string;
  civilEngineerTIN?: string;

  electricalEngineerName?: string;
  electricalEngineerAddress?: string;
  electricalEngineerPRC?: string;
  electricalEngineerPRCValidity?: string;
  electricalEngineerIIEE?: string;
  electricalEngineerPTR?: string;
  electricalEngineerPTRIssued?: string;
  electricalEngineerPTRIssuedAt?: string;
  electricalEngineerTIN?: string;

  masterPlumberName?: string;
  masterPlumberAddress?: string;
  masterPlumberPRC?: string;
  masterPlumberPRCValidity?: string;
  masterPlumberNAMPAP?: string;
  masterPlumberPTR?: string;
  masterPlumberPTRIssued?: string;
  masterPlumberPTRIssuedAt?: string;
  masterPlumberTIN?: string;

  mechanicalEngineerName?: string;
  mechanicalEngineerAddress?: string;
  mechanicalEngineerPRC?: string;
  mechanicalEngineerPRCValidity?: string;
  mechanicalEngineerPSME?: string;
  mechanicalEngineerPTR?: string;
  mechanicalEngineerPTRIssued?: string;
  mechanicalEngineerPTRIssuedAt?: string;
  mechanicalEngineerTIN?: string;

  electronicsEngineerName?: string;
  electronicsEngineerAddress?: string;
  electronicsEngineerPRC?: string;
  electronicsEngineerPRCValidity?: string;
  electronicsEngineerIECEP?: string;
  electronicsEngineerPTR?: string;
  electronicsEngineerPTRIssued?: string;
  electronicsEngineerPTRIssuedAt?: string;
  electronicsEngineerTIN?: string;

  // Active form checkboxes selected
  activePermitForms?: (keyof PermitFormMatrix)[];
  submissionDate?: string;

  // Signatures & Box 3 / Box 4 Consent Details
  applicantSignature?: string; // base64 data URL
  govIdDateIssued?: string;
  govIdPlaceIssued?: string;
  lotOwnerConsent?: boolean;
  lotOwnerName?: string;
  lotOwnerSignature?: string;
  lotOwnerAddress?: string;
  lotOwnerGovIdNo?: string;
  lotOwnerGovIdDateIssued?: string;
  lotOwnerGovIdPlaceIssued?: string;
}

async function embedSignatureImage(
  doc: PDFDocument,
  page: PDFPage,
  dataUrl: string | undefined | null,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<boolean> {
  if (!dataUrl || !dataUrl.startsWith("data:image/")) return false;
  try {
    const b64Data = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
    const binaryString = atob(b64Data);
    const imgBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      imgBytes[i] = binaryString.charCodeAt(i);
    }
    let embeddedImage;
    try {
      embeddedImage = await doc.embedPng(imgBytes);
    } catch {
      embeddedImage = await doc.embedJpg(imgBytes);
    }
    if (embeddedImage) {
      page.drawImage(embeddedImage, { x, y, width, height });
      return true;
    }
  } catch (err) {
    console.warn("Could not embed e-signature image:", err);
  }
  return false;
}

function safeText(str: string | undefined | null): string {
  if (!str) return "";
  return String(str)
    .replace(/[✓✔]/g, "[X]")
    .replace(/[—–]/g, "-")
    .replace(/[•●]/g, "*")
    .replace(/[₱]/g, "PHP ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E\t\n\r]/g, "");
}

function parseApplicantName(
  input: UnifiedPermitFormData | string | undefined | null
): { lastName: string; firstName: string; middleName: string; mi: string } {
  if (typeof input === "object" && input !== null) {
    if (input.applicantLastName || input.applicantFirstName) {
      const last = (input.applicantLastName || "").toUpperCase();
      const first = (input.applicantFirstName || "").toUpperCase();
      const mid = (input.applicantMiddleName || "").toUpperCase();
      const mi = mid ? (mid.endsWith(".") ? mid : mid[0] + ".") : "N/A";
      return { lastName: last, firstName: first, middleName: mid, mi };
    }
    input = input.applicantName;
  }
  const parts = (input || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { lastName: "DELA CRUZ", firstName: "JUAN", middleName: "SANTOS", mi: "S." };
  if (parts.length === 1) return { lastName: parts[0].toUpperCase(), firstName: "", middleName: "", mi: "N/A" };
  if (parts.length === 2) return { lastName: parts[1].toUpperCase(), firstName: parts[0].toUpperCase(), middleName: "", mi: "N/A" };

  const upperParts = parts.map(p => p.toUpperCase());
  if (
    upperParts.length >= 3 &&
    (upperParts[upperParts.length - 2] === "DELA" ||
      upperParts[upperParts.length - 2] === "DE" ||
      upperParts[upperParts.length - 2] === "DELOS" ||
      upperParts[upperParts.length - 2] === "SAN")
  ) {
    const lastName = `${upperParts[upperParts.length - 2]} ${upperParts[upperParts.length - 1]}`;
    const firstName = upperParts[0];
    const middleName = upperParts.length > 3 ? upperParts.slice(1, upperParts.length - 2).join(" ") : "";
    const mi = middleName ? middleName[0] + "." : "N/A";
    return { lastName, firstName, middleName, mi };
  }

  const lastName = upperParts[upperParts.length - 1];
  const firstName = upperParts[0];
  const middleName = upperParts.slice(1, -1).join(" ");
  const mi = middleName ? middleName[0] + "." : "N/A";
  return { lastName, firstName, middleName, mi };
}

async function fetchTemplateBytes(templatePath: string): Promise<ArrayBuffer> {
  // In Browser environment
  if (typeof window !== "undefined") {
    const res = await fetch(templatePath);
    if (!res.ok) {
      throw new Error(`Failed to load template ${templatePath}: ${res.statusText}`);
    }
    return await res.arrayBuffer();
  }

  // In Node / Server environment
  try {
    const fs = await import("fs");
    const path = await import("path");
    const cleanRelPath = templatePath.startsWith("/") ? templatePath.slice(1) : templatePath;
    const candidates = [
      path.join(process.cwd(), "frontend", "public", cleanRelPath),
      path.join(process.cwd(), "public", cleanRelPath),
      path.join(process.cwd(), "frontend", "public", "templates", path.basename(templatePath)),
      path.join(process.cwd(), "Forms (Modified and Fixed)", path.basename(templatePath)),
      path.join(process.cwd(), "..", "Forms (Modified and Fixed)", path.basename(templatePath)),
    ];
    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        const buf = fs.readFileSync(cand);
        return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      }
    }
    if (typeof fetch === "function") {
      const res = await fetch(templatePath);
      if (res.ok) return await res.arrayBuffer();
    }
  } catch {
    if (typeof fetch === "function") {
      const res = await fetch(templatePath);
      if (res.ok) return await res.arrayBuffer();
    }
  }
  throw new Error(`Could not load template file: ${templatePath}`);
}

const darkNavy = rgb(0.05, 0.12, 0.35);
const signatureBlue = rgb(0.04, 0.12, 0.45);

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * 1. OFFICIAL UNIFIED BUILDING PERMIT (NBC FORM B-01)
 */
export async function generateBuildingPermitPdf(data: UnifiedPermitFormData): Promise<string> {
  const bytes = await fetchTemplateBytes("/templates/UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf");
  const doc = await PDFDocument.load(bytes);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const p1 = doc.getPage(0);
  const p2 = doc.getPageCount() > 1 ? doc.getPage(1) : null;

  const drawText = (text: string | undefined | null, x: number, y: number, size: number = 8, isBold: boolean = false, maxWidth?: number) => {
    if (!text) return;
    let clean = safeText(text).trim();
    if (maxWidth && clean.length > maxWidth) clean = clean.slice(0, maxWidth);
    p1.drawText(clean, { x, y, size, font: isBold ? fontBold : fontRegular, color: darkNavy });
  };

  const drawCheck = (x: number, y: number) => {
    p1.drawText("X", { x, y, size: 8.5, font: fontBold, color: darkNavy });
  };

  // Header: Application No. in individual boxes (10 boxes)
  const rawAppNo = (data.applicationNo || "2026-0001").trim();
  const cleanAppNo = rawAppNo.replace(/^APP-(TEST-)?/i, "");
  const appChars = cleanAppNo.split("");
  const boxXPositions = [28.56, 39.00, 49.92, 60.72, 71.52, 82.44, 93.00, 103.80, 114.12, 124.68];
  
  boxXPositions.forEach((boxLeft, idx) => {
    if (idx < appChars.length) {
      const char = appChars[idx];
      const charWidth = fontBold.widthOfTextAtSize(char, 9);
      const charX = boxLeft + (10.8 - charWidth) / 2;
      p1.drawText(char, { x: charX, y: 772.5, size: 9, font: fontBold, color: darkNavy });
    }
  });

  // Processing Classification: SIMPLE vs COMPLEX
  const processingType = data.processingType || "SIMPLE";
  if (processingType === "COMPLEX") {
    drawCheck(344.5, 829.3); // COMPLEX*
  } else {
    drawCheck(134.3, 829.4); // SIMPLE (default)
  }

  // Application Type: NEW vs RENEWAL vs AMENDATORY
  const appType = data.applicationType || "NEW";
  if (appType === "RENEWAL") {
    drawCheck(187.4, 816.2); // RENEWAL
  } else if (appType === "AMENDATORY") {
    drawCheck(344.9, 815.6); // AMENDATORY
  } else {
    drawCheck(134.2, 816.4); // NEW (default)
  }

  // Applies also for:
  if (data.appliesLocationalClearance) {
    drawCheck(227.3, 802.0); // LOCATIONAL CLEARANCE
  }
  if (data.appliesFireSafetyClearance !== false) {
    drawCheck(344.9, 802.5); // FIRE SAFETY EVALUATION CLEARANCE (default true)
  }

  // Box 1: Owner
  const { lastName, firstName, mi } = parseApplicantName(data);
  drawText(lastName, 118, 735.0, 8.5, true, 18);
  drawText(firstName, 238, 735.0, 8.5, true, 20);
  drawText(mi, 358, 735.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 405, 735.0, 8, false);
  drawText(data.formOfOwnership || "INDIVIDUAL", 195, 714.0, 8, false, 25);

  // Address: Prefer applicant's address, fallback to project address
  drawText(data.applicantAddress || data.projectAddress || "123 Rizal St., Poblacion", 42, 694.5, 7.0, false, 32);
  drawText(data.barangay || "Poblacion", 175, 694.5, 7.5, false, 16);
  drawText("Sto. Tomas, Pampanga", 245, 694.5, 7.5, false, 25);
  drawText("2020", 345, 694.5, 7.5, false);
  drawText(data.applicantPhone || "0917-123-4567", 405, 694.5, 7.5, true);

  // Location of Construction Line 1
  drawText(data.lotNo || "12", 168, 680.5, 7.5, true);
  drawText(data.blockNo || "4", 226, 680.5, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 284, 680.5, 7.5, true, 18);
  drawText(data.taxDecNo || "TD-2026-0012", 416, 680.5, 7.5, false);

  // Location of Construction Line 2 (Street, Barangay, City)
  // Clean street to avoid repeating Lot/Blk which collides with the printed label "BARANGAY"
  const rawStreet = data.projectAddress || "Sunset Valley Subd.";
  const cleanStreet = rawStreet.replace(/^LOT\s*[^,]+,\s*(?:BLOCK|BLK)\s*[^,]+,\s*/i, "").trim();
  drawText(cleanStreet, 68, 667.5, 6.8, false, 18);
  drawText(data.barangay || "Poblacion", 185, 667.5, 7.5, true, 16);
  drawText("Sto. Tomas, Pampanga", 355, 667.5, 7.5, true, 22);

  // Box 3: Scope of Work
  const scopeNorm = (data.scopeOfWork || "new construction").toLowerCase();
  if (scopeNorm.includes("new") || scopeNorm.includes("construct")) drawCheck(36.5, 639.5);
  else if (scopeNorm.includes("erect")) drawCheck(36.5, 626.5);
  else if (scopeNorm.includes("add")) drawCheck(36.5, 614.0);
  else if (scopeNorm.includes("alter")) drawCheck(36.5, 601.5);
  else if (scopeNorm.includes("renov")) drawCheck(167.5, 639.5);
  else if (scopeNorm.includes("convert")) drawCheck(167.5, 626.5);
  else if (scopeNorm.includes("repair")) drawCheck(167.5, 614.0);
  else if (scopeNorm.includes("mov")) drawCheck(167.5, 601.5);
  else if (scopeNorm.includes("rais")) drawCheck(302.5, 639.5);
  else if (scopeNorm.includes("accessory")) drawCheck(302.5, 626.5);
  else if (scopeNorm.includes("legal")) drawCheck(302.5, 614.0);
  else drawCheck(36.5, 639.5); // Default: New Construction

  // Box 4: Use / Character of Occupancy
  const occ = (data.occupancyClass || data.projectType?.category || "Group A - Residential (Single)").toLowerCase();
  if (occ.includes("group b") || occ.includes("hotel") || occ.includes("motel") || occ.includes("townhouse") || occ.includes("dormitory")) {
    drawCheck(36.0, 556.1); // Group B Residential
    if (occ.includes("townhouse")) drawCheck(128.4, 548.2);
    else if (occ.includes("hotel")) drawCheck(46.5, 548.0);
    else if (occ.includes("dormitory") || occ.includes("boarding")) drawCheck(46.6, 540.0);
    else drawCheck(46.5, 532.1); // R-3, R-4, R-5
  } else if (occ.includes("group c") || occ.includes("educational") || occ.includes("recreational") || occ.includes("school") || occ.includes("church")) {
    drawCheck(35.3, 515.3); // Group C Educational & Recreational
  } else if (occ.includes("group d") || occ.includes("institutional") || occ.includes("hospital")) {
    drawCheck(35.2, 473.2); // Group D Institutional
  } else if (occ.includes("group e") || occ.includes("commercial") || occ.includes("store") || occ.includes("bank") || occ.includes("mall")) {
    drawCheck(207.6, 580.9); // Group E Commercial
  } else if (occ.includes("group f") || occ.includes("light industrial") || occ.includes("incombustible")) {
    drawCheck(207.3, 523.7); // Group F Light Industrial
  } else if (occ.includes("group g") || occ.includes("medium industrial") || occ.includes("hazardous") || occ.includes("warehouse")) {
    drawCheck(206.8, 488.3); // Group G Medium Industrial
  } else if (occ.includes("group h") || occ.includes("< 1,000") || occ.includes("less than 1,000")) {
    drawCheck(355.3, 585.3); // Group H Assembly (< 1,000)
  } else if (occ.includes("group i") || occ.includes("1,000 or more") || occ.includes("coliseum") || occ.includes("sports complex")) {
    drawCheck(354.7, 542.7); // Group I Assembly (1,000+)
  } else if (occ.includes("group j-1") || occ.includes("agricultural") || occ.includes("barn") || occ.includes("piggery")) {
    drawCheck(354.6, 495.2); // Group J (J-1) Agricultural
  } else if (occ.includes("group j-2") || occ.includes("accessories") || occ.includes("carport") || occ.includes("pool") || occ.includes("garage")) {
    drawCheck(354.8, 464.6); // Group J (J-2) Accessories
  } else {
    // Default: Group A Residential (Dwellings)
    drawCheck(36.0, 581.0); // Group A Residential
    if (occ.includes("duplex")) drawCheck(89.0, 572.2);
    else if (occ.includes("r-1") || occ.includes("r-2")) drawCheck(128.7, 572.4);
    else if (occ.includes("others")) drawCheck(46.5, 564.2);
    else drawCheck(46.5, 572.3); // Single family dwelling
  }

  // Box 5: Physical Specs & Cost Breakdown
  const occName = (data.occupancyClass || data.projectType?.name || "Single-Detached House").toUpperCase();
  drawText(occName, 115, 426.0, 6.8, true, 20);

  // Format clean project cost number (placed after pre-printed TOTAL ESTIMATED COST: P)
  const cleanCost = String(data.projectCost || "1,500,000.00").replace(/PHP/gi, "").trim();
  drawText(cleanCost, 305, 426.0, 8, true);

  drawText(data.numberOfUnits || "1", 120, 416.0, 7.5, false);
  drawText(data.costBuilding ? String(data.costBuilding).replace(/PHP/gi, "").trim() : "1,200,000.00", 278, 416.0, 7.5, false);

  drawText(data.proposedStoreys || "2", 120, 407.0, 7.5, false);
  drawText(data.costElectrical ? String(data.costElectrical).replace(/PHP/gi, "").trim() : "150,000.00", 278, 407.0, 7.5, false);

  drawText(data.floorArea || "120", 95, 397.5, 7.5, true);
  drawText(data.costMechanical ? String(data.costMechanical).replace(/PHP/gi, "").trim() : "50,000.00", 278, 397.5, 7.5, false);

  drawText(data.lotArea || "200", 75, 388.5, 7.5, true);
  drawText(data.costElectronics ? String(data.costElectronics).replace(/PHP/gi, "").trim() : "50,000.00", 278, 388.5, 7.5, false);
  drawText(data.costPlumbing ? String(data.costPlumbing).replace(/PHP/gi, "").trim() : "50,000.00", 278, 379.0, 7.5, false);
  if (data.costOthers) drawText(String(data.costOthers).replace(/PHP/gi, "").trim(), 380, 379.0, 7.5, false);

  const constDate = data.proposedStartDate || data.submissionDate || "Sep 17, 2026";
  drawText(constDate, 148, 370.5, 7.5, false);
  drawText(data.expectedCompletionDate || "WITHIN 180 DAYS", 325, 370.5, 7.5, false);

  // Box 2: Full-Time Inspector / Supervisor
  const leadEngr = data.civilEngineerName || data.architectName || "Engr. Roberto Cruz, CE";
  // Position above the pre-printed "ARCHITECT OR CIVIL ENGINEER" line to prevent collision
  drawText(leadEngr.toUpperCase(), 110, 314.0, 8.5, true, 32);
  drawText(data.civilEngineerAddress || "Sto. Tomas, Pampanga", 365, 338.0, 7.5, false, 25);
  drawText(data.civilEngineerPRC || data.architectPRC || "0078923", 355, 303.5, 7.5, false);
  // Shift right to sit cleanly on underline after "Validity" label
  drawText(data.civilEngineerPRCValidity || data.architectPRCValidity || "2027-06-20", 492, 303.5, 7.5, false);
  drawText(data.civilEngineerPTR || "PTR-ST-554433", 355, 291.5, 7.5, false);
  // Extract date only (strip municipality prefix if present) and place after "Date Issued" label
  const rawPtrDate = data.civilEngineerPTRIssued || "Jan 10, 2026";
  const ptrDate = rawPtrDate.includes("/") ? rawPtrDate.split("/")[1].trim() : rawPtrDate;
  drawText(ptrDate, 510, 291.5, 7.5, false);
  drawText(data.civilEngineerPTRIssuedAt || "Sto. Tomas", 360, 279.5, 7.5, false);
  // Shift right after "TIN" label
  drawText(data.civilEngineerTIN || "345-678-901-000", 475, 279.5, 7.5, false);

  // Box 3: Owner Signature & Details
  const applicantUpper = (data.applicantName || "JUAN DELA CRUZ").toUpperCase();
  const applicantSig = toTitleCase(data.applicantName || "Juan Dela Cruz");

  // Embed user's authentic E-Signature if provided
  let hasEmbeddedSig = false;
  if (data.applicantSignature) {
    hasEmbeddedSig = await embedSignatureImage(doc, p1, data.applicantSignature, 65, 234.0, 110, 30);
  }

  // Printed Name of the applicant
  drawText(applicantUpper, 80, 230.0, 8.5, true, 26);

  // Shift right after "Date" label
  drawText(data.submissionDate || "Sep 17, 2026", 255, 228.0, 7.5, false);
  drawText(data.projectAddress || "LOT 12, BLOCK 4, SUNSET VALLEY SUBD.", 72, 208.0, 7.5, false, 45);

  // Gov't Issued ID No. - fit inside the cell (x=33 to x=150) so it never crosses the vertical line into "Date Issued"
  const cleanGovId = safeText(data.govIdNo || "CTC-2026-00192").trim();
  const govIdSize = fontRegular.widthOfTextAtSize(cleanGovId, 6.5) > 56 ? 5.8 : 6.5;
  p1.drawText(cleanGovId, { x: 88, y: 194.5, size: govIdSize, font: fontRegular, color: darkNavy });
  drawText(data.govIdDateIssued || "Jan 10, 2024", 175, 194.5, 7.0, false);
  drawText(data.govIdPlaceIssued || "Sto. Tomas", 260, 194.5, 7.0, false);

  // Box 4: With My Consent: Lot Owner / Authorized Representative
  if (data.lotOwnerName) {
    if (data.lotOwnerSignature) {
      await embedSignatureImage(doc, p1, data.lotOwnerSignature, 345, 234.0, 110, 30);
    }
    drawText(data.lotOwnerName.toUpperCase(), 345, 230.0, 8.5, true, 26);
    drawText(data.submissionDate || "Sep 17, 2026", 522, 228.0, 7.5, false);
    drawText(data.lotOwnerAddress || data.projectAddress || "LOT 12, BLOCK 4, SUNSET VALLEY SUBD.", 355, 208.0, 7.5, false, 45);
    if (data.lotOwnerGovIdNo) drawText(data.lotOwnerGovIdNo, 370, 194.5, 7.0, false);
    if (data.lotOwnerGovIdDateIssued) drawText(data.lotOwnerGovIdDateIssued, 448, 194.5, 7.0, false);
    if (data.lotOwnerGovIdPlaceIssued) drawText(data.lotOwnerGovIdPlaceIssued, 525, 194.5, 7.0, false);
  }

  // Box 5: Jurat Applicant Name - Removed per tester feedback ("BOX 5 - Remove name & government-issued ID number")

  // Page 2 (Consent & Acknowledgment): Applicant Built-in Signature & Printed Name
  if (p2) {
    const p2DrawText = (text: string | undefined | null, x: number, y: number, size: number = 8, isBold: boolean = false, maxWidth?: number) => {
      if (!text) return;
      let clean = safeText(text).trim();
      if (maxWidth && clean.length > maxWidth) clean = clean.slice(0, maxWidth);
      p2.drawText(clean, { x, y, size, font: isBold ? fontBold : fontRegular, color: darkNavy });
    };

    // Center over the printed line "SIGNATURE OVER PRINTED NAME / OWNER/APPLICANT" (line x=338.6 to x=570, center=454)
    const nameWidth = fontBold.widthOfTextAtSize(applicantUpper, 9.0);
    const nameX = Math.max(345, 454 - nameWidth / 2);
    p2DrawText(applicantUpper, nameX, 60.0, 9.0, true);

    if (data.applicantSignature) {
      await embedSignatureImage(doc, p2, data.applicantSignature, 400, 65.0, 110, 30);
    }
  }

  return await doc.saveAsBase64({ dataUri: false });
}

/**
 * 2. OFFICIAL ARCHITECTURAL PERMIT (NBC FORM A-01)
 */
export async function generateArchitecturalPermitPdf(data: UnifiedPermitFormData): Promise<string> {
  const bytes = await fetchTemplateBytes("/templates/ARCHITECTURAL-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf");
  const doc = await PDFDocument.load(bytes);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const p1 = doc.getPage(0);

  const drawText = (text: string | undefined | null, x: number, y: number, size: number = 8, isBold: boolean = false, maxWidth?: number) => {
    if (!text) return;
    let clean = safeText(text).trim();
    if (maxWidth && clean.length > maxWidth) clean = clean.slice(0, maxWidth);
    p1.drawText(clean, { x, y, size, font: isBold ? fontBold : fontRegular, color: darkNavy });
  };

  const drawCheck = (x: number, y: number) => {
    p1.drawText("X", { x, y, size: 8.5, font: fontBold, color: darkNavy });
  };

  // Header: APPLICATION NO. inside box
  drawText(data.applicationNo || "APP-2026-6636", 75, 794.0, 8.5, true);

  // Box 1
  const { lastName, firstName, mi } = parseApplicantName(data);
  drawText(lastName, 160, 735.0, 8.5, true, 20);
  drawText(firstName, 280, 735.0, 8.5, true, 22);
  drawText(mi, 428, 735.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 472, 735.0, 8, false);
  drawText(data.formOfOwnership || "INDIVIDUAL", 235, 708.0, 8, false, 25);
  drawText((data.projectType?.category || "Residential").toUpperCase(), 405, 708.0, 8, false, 25);

  // Address (Applicant Address)
  drawText(data.applicantAddress || "123 Rizal St., Poblacion", 80, 683.5, 7.5, false, 28);
  drawText(data.barangay || "Poblacion", 195, 683.5, 7.5, false, 16);
  drawText("Sto. Tomas, Pampanga", 295, 683.5, 7.5, false, 18);
  drawText("2020", 390, 683.5, 7.5, false);
  drawText(data.applicantPhone || "0917-123-4567", 436, 683.5, 7.5, true);

  // Location
  drawText(data.lotNo || "Lot 12", 180, 668.5, 7.5, true);
  drawText(data.blockNo || "Blk 4", 264, 668.5, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 355, 668.5, 7.5, true, 16);
  drawText(data.taxDecNo || "TD-2026-0012", 484, 668.5, 7.5, false);

  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 65, 651.0, 7.5, false, 24);
  drawText(data.barangay || "Sapa (Santo Nino)", 280, 651.0, 7.5, true, 20);
  // Municipality: Sto. Tomas is already preprinted in bold on the Sto. Tomas form template

  // Scope: [X] New Construction
  drawCheck(46.5, 618.0);

  // Box 2: Site Occupancy (removed hardcoded comments per tester feedback)
  if (data.buildingFootprint) {
    drawText(data.buildingFootprint, 188, 442, 7.5, true);
  }

  // Box 3: Architect
  const archName = data.architectName || "Arch. Maria Santos, UAP";
  drawText(archName.toUpperCase(), 100, 300.0, 8.5, true);
  drawText("Sto. Tomas, Pampanga", 75, 258.0, 7.5, false);
  drawText(data.architectIAPOA || "IAPOA-2026-091", 75, 240.0, 7.5, false);
  drawText(data.architectPRC || "PRC-0045211", 75, 228.0, 7.5, false);
  drawText(data.architectPRCValidity || "2028-12-31", 215, 228.0, 7.5, false);
  drawText(data.architectPTR || "PTR-ST-2026-004", 75, 216.0, 7.5, false);
  // Date Issued - contains date only
  const rawArchPtrDate = data.architectPTRIssued || "Jan 05, 2026";
  const archPtrDateOnly = rawArchPtrDate.includes("/") ? rawArchPtrDate.split("/")[1].trim() : rawArchPtrDate;
  drawText(archPtrDateOnly, 215, 216.0, 7.5, false);
  drawText("Sto. Tomas", 75, 198.0, 7.5, false);
  drawText(data.architectTIN || "123-456-789-000", 205, 198.0, 7.5, false);

  // Box 5: Owner
  drawText((data.applicantName || "JUAN DELA CRUZ").toUpperCase(), 100, 112.0, 8.5, true);
  drawText(data.applicantAddress || data.projectAddress || "Sto. Tomas, Pampanga", 75, 60.0, 7.5, false);
  drawText(data.govIdNo || "CTC-2026-00192", 75, 48.0, 7.5, false);

  return await doc.saveAsBase64({ dataUri: false });
}

/**
 * 3. OFFICIAL CIVIL / STRUCTURAL PERMIT (NBC FORM S-01)
 */
export async function generateStructuralPermitPdf(data: UnifiedPermitFormData): Promise<string> {
  const bytes = await fetchTemplateBytes("/templates/Civil-Structural-Permit-Sto-Tomas-Gilbert-Cruz.pdf");
  const doc = await PDFDocument.load(bytes);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const p1 = doc.getPage(0);

  const drawText = (text: string | undefined | null, x: number, y: number, size: number = 8, isBold: boolean = false, maxWidth?: number) => {
    if (!text) return;
    let clean = safeText(text).trim();
    if (maxWidth && clean.length > maxWidth) clean = clean.slice(0, maxWidth);
    p1.drawText(clean, { x, y, size, font: isBold ? fontBold : fontRegular, color: darkNavy });
  };

  const drawCheck = (x: number, y: number) => {
    p1.drawText("X", { x, y, size: 8.5, font: fontBold, color: darkNavy });
  };

  // Header (Application No box)
  drawText(data.applicationNo || "APP-2026-6636", 55, 702.0, 8.5, true);

  // Box 1
  const { lastName, firstName, mi } = parseApplicantName(data);
  drawText(lastName, 160, 641.0, 8.5, true, 20);
  drawText(firstName, 275, 641.0, 8.5, true, 22);
  drawText(mi, 422, 641.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 472, 641.0, 8, false);
  drawText(data.formOfOwnership || "INDIVIDUAL", 220, 615.0, 8, false, 25);
  drawText((data.projectType?.category || "Residential").toUpperCase(), 380, 615.0, 8, false, 25);

  // Address
  drawText(data.applicantAddress || "123 Rizal St., Poblacion", 80, 587.0, 7.5, false, 28);
  drawText(data.barangay || "Poblacion", 195, 587.0, 7.5, false, 16);
  drawText("Sto. Tomas, Pampanga", 300, 587.0, 7.5, false, 18);
  drawText("2020", 390, 587.0, 7.5, false);
  drawText(data.applicantPhone || "0917-123-4567", 430, 587.0, 7.5, true);

  // Location
  drawText(data.lotNo || "Lot 12", 180, 567.5, 7.5, true);
  drawText(data.blockNo || "Blk 4", 264, 567.5, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 345, 567.5, 7.5, true, 16);
  drawText(data.taxDecNo || "TD-2026-0012", 465, 567.5, 7.5, false);

  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 65, 550.0, 7.5, false, 15);
  drawText(data.barangay || "Sapa (Santo Nino)", 185, 550.0, 7.5, true, 18);
  // Municipality: Sto Tomas is already preprinted in the form template

  // Scope: [X] New Construction
  drawCheck(47, 520.0);

  // Box 2: Nature of Civil/Structural Works - X marks placed cleanly inside boxes
  drawCheck(52, 368.0); // Foundation
  drawCheck(192, 412.0); // Concrete Framing
  drawCheck(192, 368.0); // Slabs
  drawCheck(192, 356.0); // Walls

  // Box 3: Civil Engineer
  const ceName = data.civilEngineerName || "Engr. Roberto Cruz, CE";
  drawText(ceName.toUpperCase(), 95, 258.0, 8.5, true);
  drawText("Sto. Tomas, Pampanga", 75, 224.0, 7.5, false);
  drawText(data.civilEngineerPRC || "PRC-0078923", 75, 206.0, 7.5, false);
  drawText(data.civilEngineerPRCValidity || "2028-12-31", 195, 206.0, 7.5, false);
  drawText(data.civilEngineerPTR || "PTR-ST-2026-001", 75, 193.0, 7.5, false);
  const rawCePtrDate = data.civilEngineerPTRIssued || "Jan 05, 2026";
  const cePtrDate = rawCePtrDate.includes("/") ? rawCePtrDate.split("/")[1].trim() : rawCePtrDate;
  drawText(cePtrDate, 195, 193.0, 7.5, false);
  drawText("Sto. Tomas", 75, 179.0, 7.5, false);
  drawText(data.civilEngineerTIN || "123-456-789-000", 185, 179.0, 7.5, false);

  // Box 5: Owner
  drawText((data.applicantName || "JUAN DELA CRUZ").toUpperCase(), 95, 98.0, 8.5, true);
  drawText(data.applicantAddress || data.projectAddress || "Sto. Tomas, Pampanga", 75, 64.0, 7.5, false);
  drawText(data.govIdNo || "CTC-2026-00192", 75, 50.0, 7.5, false);

  return await doc.saveAsBase64({ dataUri: false });
}

/**
 * 4. OFFICIAL ELECTRICAL PERMIT (NBC FORM E-01)
 */
export async function generateElectricalPermitPdf(data: UnifiedPermitFormData): Promise<string> {
  const bytes = await fetchTemplateBytes("/templates/ELECTRICAL-PERMIT-FORM-Gilbert-Cruz.pdf");
  const doc = await PDFDocument.load(bytes);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const p1 = doc.getPage(0);

  const drawText = (text: string | undefined | null, x: number, y: number, size: number = 8, isBold: boolean = false, maxWidth?: number) => {
    if (!text) return;
    let clean = safeText(text).trim();
    if (maxWidth && clean.length > maxWidth) clean = clean.slice(0, maxWidth);
    p1.drawText(clean, { x, y, size, font: isBold ? fontBold : fontRegular, color: darkNavy });
  };

  const drawCheck = (x: number, y: number) => {
    p1.drawText("X", { x, y, size: 8.5, font: fontBold, color: darkNavy });
  };

  // Header: APPLICATION NO. & DATE APPLICATION FILED inside boxes
  drawText(data.applicationNo || "APP-2026-6636", 75, 755.0, 8.5, true);
  drawText(data.submissionDate || "Sep 17, 2026", 410, 755.0, 8, false);
  drawText(data.proposedStartDate || "Sep 17, 2026", 75, 741.0, 7.5, false);
  drawText(data.expectedCompletionDate || "WITHIN 180 DAYS", 410, 741.0, 7.5, false);

  // Box 1
  const { lastName, firstName, mi, middleName } = parseApplicantName(data);
  drawText(lastName, 175, 704.0, 8.5, true, 18);
  drawText(firstName, 255, 704.0, 8.5, true, 20);
  drawText(middleName || mi, 345, 704.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 425, 704.0, 8, false);

  // Address (Applicant Address)
  drawText(data.applicantAddress || "123 Rizal St., Poblacion", 45, 676.0, 7.5, false, 28);
  drawText(data.barangay || "Poblacion", 250, 676.0, 7.5, false, 15);
  drawText("Sto. Tomas, Pampanga", 335, 676.0, 7.5, false, 18);
  drawText(data.applicantPhone || "0917-123-4567", 425, 676.0, 7.5, true);

  // Location of installation
  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 100, 648.0, 7.5, false, 28);
  drawText(data.barangay || "Poblacion", 330, 648.0, 7.5, true, 18);
  drawText("Sto. Tomas, Pampanga", 420, 648.0, 7.5, true, 20);

  // Scope & Occupancy
  drawCheck(49, 624.0); // [X] New Installation
  drawCheck(31, 594.0); // [X] A. Residential Dwelling

  // Number of Outlets
  drawText(data.lightingOutletsCount || "24", 32, 547.5, 7.5, true);
  drawText(data.convenienceOutletsCount || "18", 32, 536.0, 7.5, true);
  drawText(data.acuOutletsCount || "3", 32, 524.5, 7.5, true);
  drawText("1", 190, 547.5, 7.5, true); // Cooking unit
  drawText(data.waterHeaterOutletsCount || "2", 190, 536.0, 7.5, true); // Water heater

  // Box 2: Professional Electrical Engineer
  const peeName = data.electricalEngineerName || "Engr. Danilo Reyes, PEE";
  drawText(peeName.toUpperCase(), 45, 486.0, 8.5, true);
  drawText(data.electricalEngineerPRC || "PRC-0033421", 375, 486.0, 7.5, false);
  drawText(data.electricalEngineerPRCValidity || "2028-12-31", 480, 486.0, 7.5, false);
  drawText("Sto. Tomas, Pampanga", 45, 458.0, 7.5, false);
  drawText("0917-555-4321", 375, 458.0, 7.5, false);
  drawText(data.electricalEngineerPTR || "PTR-ST-2026-4412", 45, 438.0, 7.5, false);
  // DATE ISSUED - contains date only
  const rawPeePtrDate = data.electricalEngineerPTRIssued || "Jan 05, 2026";
  const peePtrDateOnly = rawPeePtrDate.includes("/") ? rawPeePtrDate.split("/")[1].trim() : rawPeePtrDate;
  drawText(peePtrDateOnly, 200, 438.0, 7.5, false);
  drawText("Sto. Tomas", 375, 438.0, 7.5, false);
  drawText(peeName.toUpperCase(), 45, 412.0, 8.5, true);
  drawText(data.electricalEngineerTIN || "334-219-880-000", 375, 412.0, 7.5, false);

  // Box 5: Owner
  drawText((data.applicantName || "JUAN DELA CRUZ").toUpperCase(), 45, 145.0, 8.5, true);
  drawText(data.applicantTIN || "000-123-456-000", 340, 145.0, 7.5, false);
  drawText(data.govIdNo || "CTC-2026-00192", 445, 138.0, 7.5, false);

  return await doc.saveAsBase64({ dataUri: false });
}

/**
 * 5. OFFICIAL SANITARY / PLUMBING PERMIT (NBC FORM P-01)
 */
export async function generateSanitaryPermitPdf(data: UnifiedPermitFormData): Promise<string> {
  const bytes = await fetchTemplateBytes("/templates/SANITARY-PLUMBING-PERMIT-Sto-Tomas-Fixed.pdf");
  const doc = await PDFDocument.load(bytes);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  // Page 1
  const p1 = doc.getPage(0);

  const drawText1 = (text: string | undefined | null, x: number, y: number, size: number = 8, isBold: boolean = false, maxWidth?: number) => {
    if (!text) return;
    let clean = safeText(text).trim();
    if (maxWidth && clean.length > maxWidth) clean = clean.slice(0, maxWidth);
    p1.drawText(clean, { x, y, size, font: isBold ? fontBold : fontRegular, color: darkNavy });
  };

  const drawCheck1 = (x: number, y: number) => {
    p1.drawText("X", { x, y, size: 8.5, font: fontBold, color: darkNavy });
  };

  // Header: APPLICATION NO. in box
  drawText1(data.applicationNo || "APP-2026-6636", 75, 824.0, 8.5, true);
  drawText1(data.submissionDate || "Sep 17, 2026", 100, 792.0, 8, false);

  // Box 1
  const { lastName, firstName, mi, middleName } = parseApplicantName(data);
  drawText1(lastName, 170, 735.0, 8.5, true, 20);
  drawText1(firstName, 260, 735.0, 8.5, true, 22);
  drawText1(middleName || mi, 380, 735.0, 8, true);
  drawText1(data.applicantTIN || "000-123-456-000", 475, 735.0, 8, false);

  // Address (Applicant Address)
  drawText1(data.applicantAddress || "123 Rizal St., Poblacion", 45, 713.0, 7.5, false, 28);
  drawText1(data.barangay || "Poblacion", 260, 713.0, 7.5, false, 15);
  drawText1("Sto. Tomas, Pampanga", 360, 713.0, 7.5, false, 18);
  drawText1(data.applicantPhone || "0917-123-4567", 475, 713.0, 7.5, true);

  // Location of Installation (2nd line)
  drawText1(data.projectAddress || "Lot 12, Blk 4, Sunset Valley Subd.", 45, 691.5, 7.5, false, 28);
  drawText1(data.barangay || "Poblacion", 260, 691.5, 7.5, true, 18);
  drawText1("Sto. Tomas, Pampanga", 360, 691.5, 7.5, true, 20);

  // Scope: NEW INSTALLATION
  drawCheck1(40, 666.0); // [X] New Installation
  drawCheck1(40, 624.0); // [X] Residential

  // Fixtures: moved slightly higher (+4px)
  drawText1(data.waterClosetsCount || "3", 35, 532.0, 7.5, true);
  drawCheck1(80, 532.0);
  drawText1(data.floorDrainsCount || "3", 35, 520.0, 7.5, true);
  drawCheck1(80, 520.0);
  drawText1(data.lavatoriesCount || "3", 35, 508.0, 7.5, true);
  drawCheck1(80, 508.0);
  drawText1(data.kitchenSinksCount || "1", 35, 496.0, 7.5, true);
  drawCheck1(80, 496.0);
  drawText1(data.faucetsCount || "4", 35, 484.0, 7.5, true);
  drawCheck1(80, 484.0);
  drawText1(data.showersCount || "2", 35, 472.0, 7.5, true);
  drawCheck1(80, 472.0);

  // Water supply & septic
  drawCheck1(35, 348.0); // [X] City / Municipal Water System
  drawCheck1(219, 348.0); // [X] Waste / Sewer
  drawCheck1(210, 306.0); // [X] Septic Vault

  drawText1(data.proposedStoreys || "2", 190, 270.0, 7.5, true);
  drawText1(`${data.floorArea || "120"} SQ. M.`, 430, 265.0, 7.5, true);
  drawText1(data.proposedStartDate || "Sep 17, 2026", 180, 248.0, 7.5, false);
  drawText1(`PHP ${data.costPlumbing ? String(data.costPlumbing).replace(/PHP/gi, "").trim() : "50,000.00"}`, 410, 234.0, 7.5, true);

  const mpName = data.masterPlumberName || "Engr. Jose Mendoza, MP";
  drawText1(mpName.toUpperCase(), 355, 148.0, 8, true);

  // Page 2: Credentials
  if (doc.getPageCount() > 1) {
    const p2 = doc.getPage(1);
    const drawText2 = (text: string | undefined | null, x: number, y: number, size: number = 8, isBold: boolean = false) => {
      if (!text) return;
      let clean = safeText(text).trim();
      p2.drawText(clean, { x, y, size, font: isBold ? fontBold : fontRegular, color: darkNavy });
    };

    drawText2(mpName.toUpperCase(), 120, 810.0, 8.5, true);
    drawText2(data.masterPlumberPRC || "PRC-0012984", 420, 810.0, 7.5, false);
    drawText2("Sto. Tomas, Pampanga", 120, 785.0, 7.5, false);
    drawText2(data.masterPlumberPTR || "PTR-ST-2026-1102", 120, 760.0, 7.5, false);
    drawText2("Jan 05, 2026", 320, 760.0, 7.5, false);
    drawText2("Sto. Tomas", 450, 760.0, 7.5, false);
    drawText2(data.masterPlumberTIN || "112-984-550-000", 120, 735.0, 7.5, false);

    // Applicant signature
    drawText2((data.applicantName || "PAUL PAYUMO").toUpperCase(), 120, 685.0, 8.5, true);
    drawText2(data.govIdNo || "CTC-2026-00192", 120, 660.0, 7.5, false);
  }

  return await doc.saveAsBase64({ dataUri: false });
}

/**
 * 6. OFFICIAL MECHANICAL PERMIT (NBC FORM M-01)
 */
export async function generateMechanicalPermitPdf(data: UnifiedPermitFormData): Promise<string> {
  const bytes = await fetchTemplateBytes("/templates/MECHANICAL-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf");
  const doc = await PDFDocument.load(bytes);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const p1 = doc.getPage(0);

  const drawText = (text: string | undefined | null, x: number, y: number, size: number = 8, isBold: boolean = false, maxWidth?: number) => {
    if (!text) return;
    let clean = safeText(text).trim();
    if (maxWidth && clean.length > maxWidth) clean = clean.slice(0, maxWidth);
    p1.drawText(clean, { x, y, size, font: isBold ? fontBold : fontRegular, color: darkNavy });
  };

  const drawCheck = (x: number, y: number) => {
    p1.drawText("X", { x, y, size: 8.5, font: fontBold, color: darkNavy });
  };

  // Header
  drawText(data.applicationNo || "APP-2026-6636", 45, 735.0, 8.5, true);
  drawText(data.submissionDate || "Sep 17, 2026", 85, 722.0, 8, false);

  // Box 1: Owner
  const { lastName, firstName, mi, middleName } = parseApplicantName(data);
  drawText(lastName, 166, 663.0, 8.5, true, 20);
  drawText(firstName, 256, 663.0, 8.5, true, 20);
  drawText(middleName || mi, 355, 663.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 433, 663.0, 8, false);

  // Form of Ownership & Occupancy
  drawText(data.formOfOwnership || "INDIVIDUAL", 230, 635.0, 8, false, 25);
  drawText((data.projectType?.category || "Residential").toUpperCase(), 468, 635.0, 8, false, 25);

  // Address: moved higher (+4px)
  drawText(data.applicantAddress || "123 Rizal St., Poblacion", 200, 616.0, 7.5, false, 35);
  drawText(data.applicantPhone || "0917-123-4567", 465, 616.0, 7.5, true);
  drawText(data.barangay || "Poblacion", 80, 596.0, 7.5, false, 20);
  drawText("Sto. Tomas, Pampanga", 280, 596.0, 7.5, false, 25);

  // Location of installation: moved higher (+4px)
  drawText(data.lotNo || "Lot 12", 195, 570.0, 7.5, true);
  drawText(data.blockNo || "Blk 4", 295, 570.0, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 390, 570.0, 7.5, true, 14);
  drawText(data.taxDecNo || "TD-2026-0012", 515, 570.0, 7.5, false);

  drawText(data.projectAddress || "Lot 12, Blk 4, Sunset Valley Subd.", 70, 552.0, 7.5, false, 22);
  drawText(data.barangay || "Poblacion", 245, 552.0, 7.5, true, 20);
  drawText("Sto. Tomas, Pampanga", 460, 552.0, 7.5, true, 22);

  // Scope of work
  drawCheck(52, 532.0); // New Construction

  // Box 2: Installation and Operation
  drawCheck(34, 432.0); // Packaged / Split type aircon
  drawCheck(215, 468.0); // Mechanical ventilation
  drawCheck(354, 468.0); // Pumps

  // Box 3: Professional Mechanical Engineer: moved higher (+4px)
  const pmeName = data.mechanicalEngineerName || "Engr. Ricardo Gomez, PME";
  drawText(pmeName.toUpperCase(), 60, 329.0, 8.5, true);
  drawText("Sto. Tomas, Pampanga", 50, 302.0, 7.5, false);
  drawText(data.mechanicalEngineerPRC || "PRC-0055123", 50, 282.0, 7.5, false);
  drawText(data.mechanicalEngineerPRCValidity || "2028-12-31", 175, 282.0, 7.5, false);
  drawText(data.mechanicalEngineerPTR || "PTR-ST-2026-7789", 50, 262.0, 7.5, false);
  drawText(data.mechanicalEngineerPTRIssued || "Jan 05, 2026", 175, 262.0, 7.5, false);
  drawText(data.mechanicalEngineerTIN || "112-445-889-000", 50, 242.0, 7.5, false);

  // Box 5: Owner: moved higher (+5px)
  drawText((data.applicantName || "JUAN DELA CRUZ").toUpperCase(), 60, 115.0, 8.5, true);
  drawText(data.applicantAddress || data.projectAddress || "Sto. Tomas, Pampanga", 50, 68.0, 7.5, false);
  drawText(data.govIdNo || "CTC-2026-00192", 50, 50.0, 7.5, false);

  return await doc.saveAsBase64({ dataUri: false });
}

/**
 * 7. OFFICIAL ELECTRONICS PERMIT (NBC FORM EL-01)
 */
export async function generateElectronicsPermitPdf(data: UnifiedPermitFormData): Promise<string> {
  const bytes = await fetchTemplateBytes("/templates/ELECTRONICS-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf");
  const doc = await PDFDocument.load(bytes);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const p1 = doc.getPage(0);

  const drawText = (text: string | undefined | null, x: number, y: number, size: number = 8, isBold: boolean = false, maxWidth?: number) => {
    if (!text) return;
    let clean = safeText(text).trim();
    if (maxWidth && clean.length > maxWidth) clean = clean.slice(0, maxWidth);
    p1.drawText(clean, { x, y, size, font: isBold ? fontBold : fontRegular, color: darkNavy });
  };

  const drawCheck = (x: number, y: number) => {
    p1.drawText("X", { x, y, size: 8.5, font: fontBold, color: darkNavy });
  };

  // Header
  drawText(data.applicationNo || "APP-2026-6636", 50, 720.0, 8.5, true);
  drawText(data.submissionDate || "Sep 17, 2026", 420, 720.0, 8, false);

  // Box 1: Owner Row
  const { lastName, firstName, mi, middleName } = parseApplicantName(data);
  drawText(lastName, 160, 662.0, 8.5, true, 20);
  drawText(firstName, 270, 662.0, 8.5, true, 20);
  drawText(middleName || mi, 395, 662.0, 8, true);
  // TIN placed in correct column
  drawText(data.applicantTIN || "000-123-456-000", 475, 662.0, 8, false);

  // Form of Ownership & For construction owned by
  drawText(data.formOfOwnership || "INDIVIDUAL", 220, 638.0, 8, false, 25);
  drawText((data.applicantName || "JUAN DELA CRUZ").toUpperCase(), 80, 638.0, 8, false, 25);
  drawText((data.projectType?.category || "Residential").toUpperCase(), 420, 638.0, 8, false, 25);

  // Address (Applicant Address, correct spelling of Pampanga & Sunset)
  drawText(data.applicantAddress || "123 Rizal St., Poblacion", 85, 620.0, 7.5, false, 22);
  drawText(data.barangay || "Poblacion", 200, 620.0, 7.5, false, 15);
  drawText("Sto. Tomas, Pampanga", 290, 620.0, 7.5, false, 18);
  drawText("2020", 380, 620.0, 7.5, false);
  drawText(data.applicantPhone || "0917-123-4567", 425, 620.0, 7.5, true);

  // Location of Construction: moved higher (+4px)
  drawText(data.lotNo || "Lot 12", 155, 590.0, 7.5, true);
  drawText(data.blockNo || "Blk 4", 235, 590.0, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 325, 590.0, 7.5, true, 16);
  drawText(data.taxDecNo || "TD-2026-0012", 450, 590.0, 7.5, false);

  drawText(data.projectAddress || "Lot 12, Blk 4, Sunset Valley Subd.", 65, 572.0, 7.5, false, 24);
  drawText(data.barangay || "Poblacion", 230, 572.0, 7.5, true, 18);
  drawText("Sto. Tomas, Pampanga", 420, 572.0, 7.5, true, 20);

  // Scope: [X] New Installation (moved higher)
  drawCheck(56, 534.0);

  // Box 2: Nature of Works: moved higher (+4px)
  drawCheck(46, 446.0); // Telecommunication
  drawCheck(46, 390.0); // Security & Alarm
  drawCheck(205, 446.0); // Electronics & Alarm
  drawCheck(380, 390.0); // Building wiring / fiber optic

  // Box 3: Professional Electronics Engineer: moved higher (+4px)
  const peceName = data.electronicsEngineerName || "Engr. Fernando Ramos, PECE";
  drawText(peceName.toUpperCase(), 60, 294.0, 8.5, true);
  drawText(data.submissionDate || "Sep 17, 2026", 210, 294.0, 7.5, false);
  drawText("Sto. Tomas, Pampanga", 60, 264.0, 7.5, false);
  drawText(data.electronicsEngineerPRC || "PRC-0022891", 60, 246.0, 7.5, false);
  drawText(data.electronicsEngineerPRCValidity || "2028-12-31", 175, 246.0, 7.5, false);
  drawText(data.electronicsEngineerPTR || "PTR-ST-2026-9045", 60, 230.0, 7.5, false);
  drawText(data.electronicsEngineerPTRIssued || "Jan 05, 2026", 175, 230.0, 7.5, false);
  drawText("Sto. Tomas", 60, 212.0, 7.5, false);
  drawText(data.electronicsEngineerTIN || "228-910-334-000", 175, 212.0, 7.5, false);

  // Box 5: Owner
  drawText((data.applicantName || "JUAN DELA CRUZ").toUpperCase(), 60, 102.0, 8.5, true);
  drawText("Sto. Tomas, Pampanga", 60, 64.0, 7.5, false);
  drawText(data.govIdNo || "CTC-2026-00192", 60, 48.0, 7.5, false);

  return await doc.saveAsBase64({ dataUri: false });
}

/**
 * 8. BFP FIRE SAFETY EVALUATION CLEARANCE (FSEC) APPLICATION
 * Built entirely from scratch — no PDF template required.
 * The BFP issues their own clearance after site inspection; this document
 * is the applicant's official FSEC Application Summary Sheet submitted to
 * the Bureau of Fire Protection, Sto. Tomas City Station.
 */
export async function generateBfpApplicationPdf(data: UnifiedPermitFormData): Promise<string> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // Letter size

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontReg  = await doc.embedFont(StandardFonts.Helvetica);

  const navy   = rgb(0.05, 0.12, 0.35);
  const red    = rgb(0.75, 0.05, 0.10);
  const gray   = rgb(0.40, 0.40, 0.40);
  const border = rgb(0.80, 0.80, 0.80);

  const { width, height } = page.getSize();
  const L = 45, R = width - 45;

  // ── Helper: wrap & draw text ──────────────────────────────────────────────
  const drawLine = (
    text: string,
    x: number,
    y: number,
    size: number = 8,
    font = fontReg,
    color = navy,
    maxChars = 90
  ) => {
    // Sanitize: keep only printable ASCII (pdf-lib standard fonts require this)
    const clean = safeText(text).slice(0, maxChars).trim();
    if (!clean) return;
    page.drawText(clean, { x, y, size, font, color });
  };

  const hRule = (y: number, color = border) =>
    page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.5, color });

  const box = (x: number, y: number, w: number, h: number) =>
    page.drawRectangle({ x, y, width: w, height: h, borderColor: border, borderWidth: 0.5, color: rgb(0.97, 0.97, 0.97) });

  // ── RED HEADER BAND ───────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 72, width, height: 72, color: rgb(0.72, 0.05, 0.09) });
  drawLine("REPUBLIC OF THE PHILIPPINES", 155, height - 18, 7.5, fontReg, rgb(1, 1, 1));
  drawLine("BUREAU OF FIRE PROTECTION", 148, height - 30, 10, fontBold, rgb(1, 1, 1));
  drawLine("Sto. Tomas City Fire Station, Pampanga", 140, height - 42, 8, fontReg, rgb(1, 1, 1));
  drawLine("FIRE SAFETY EVALUATION CLEARANCE (FSEC) APPLICATION", 80, height - 56, 9, fontBold, rgb(1, 1, 1));
  drawLine("In compliance with RA 9514 (Revised Fire Code of the Philippines)", 130, height - 68, 7, fontReg, rgb(1, 1, 1));

  // ── APP NO / DATE ROW ─────────────────────────────────────────────────────
  let y = height - 90;
  box(L, y - 14, 250, 20);
  box(R - 200, y - 14, 200, 20);
  drawLine("Application No.:", L + 5, y - 9, 7.5, fontBold, navy);
  drawLine(data.applicationNo || "FSEC-PENDING", L + 90, y - 9, 8, fontBold, red);
  drawLine("Date Filed:", R - 195, y - 9, 7.5, fontBold, navy);
  drawLine(data.submissionDate || new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
    R - 138, y - 9, 8, fontReg, navy);

  // ── SECTION 1: APPLICANT ─────────────────────────────────────────────────
  y -= 30;
  page.drawRectangle({ x: L, y: y + 2, width: R - L, height: 14, color: rgb(0.88, 0.10, 0.14) });
  drawLine("1.  APPLICANT INFORMATION", L + 5, y + 5, 8, fontBold, rgb(1, 1, 1));

  y -= 20;
  drawLine("Name of Applicant / Owner:", L, y, 7.5, fontBold, gray);
  drawLine((data.applicantName || "").toUpperCase(), L + 150, y, 8.5, fontBold, navy);
  page.drawLine({ start: { x: L + 148, y: y - 2 }, end: { x: R, y: y - 2 }, thickness: 0.4, color: border });

  y -= 18;
  drawLine("TIN:", L, y, 7.5, fontBold, gray);
  drawLine(data.applicantTIN || "N/A", L + 30, y, 8, fontReg, navy);
  drawLine("Form of Ownership:", L + 140, y, 7.5, fontBold, gray);
  drawLine(data.formOfOwnership || "Individual", L + 240, y, 8, fontReg, navy);
  drawLine("Contact No.:", L + 360, y, 7.5, fontBold, gray);
  drawLine(data.applicantPhone || "N/A", L + 430, y, 8, fontReg, navy);

  y -= 18;
  drawLine("Address:", L, y, 7.5, fontBold, gray);
  drawLine(data.applicantAddress || data.projectAddress || "N/A", L + 55, y, 8, fontReg, navy, 70);

  // ── SECTION 2: PROJECT / LOCATION ────────────────────────────────────────
  y -= 28;
  page.drawRectangle({ x: L, y: y + 2, width: R - L, height: 14, color: rgb(0.88, 0.10, 0.14) });
  drawLine("2.  PROJECT / LOCATION OF CONSTRUCTION", L + 5, y + 5, 8, fontBold, rgb(1, 1, 1));

  y -= 20;
  drawLine("Project Name / Description:", L, y, 7.5, fontBold, gray);
  drawLine(data.projectName || (data.projectType?.name || ""), L + 160, y, 8, fontBold, navy, 55);

  y -= 18;
  drawLine("Street / Purok:", L, y, 7.5, fontBold, gray);
  drawLine(data.projectAddress || "N/A", L + 80, y, 8, fontReg, navy, 30);
  drawLine("Barangay:", L + 220, y, 7.5, fontBold, gray);
  drawLine(data.barangay || "N/A", L + 275, y, 8, fontReg, navy, 20);
  drawLine("City:", L + 400, y, 7.5, fontBold, gray);
  drawLine("Sto. Tomas, Pampanga", L + 425, y, 8, fontReg, navy, 22);

  y -= 18;
  drawLine("Lot No.:", L, y, 7.5, fontBold, gray);
  drawLine(data.lotNo || "N/A", L + 45, y, 8, fontReg, navy);
  drawLine("Block:", L + 120, y, 7.5, fontBold, gray);
  drawLine(data.blockNo || "N/A", L + 150, y, 8, fontReg, navy);
  drawLine("TCT No.:", L + 220, y, 7.5, fontBold, gray);
  drawLine(data.tctNo || "N/A", L + 265, y, 8, fontReg, navy);
  drawLine("Tax Dec.:", L + 380, y, 7.5, fontBold, gray);
  drawLine(data.taxDecNo || "N/A", L + 425, y, 8, fontReg, navy);

  y -= 18;
  drawLine("Total Lot Area:", L, y, 7.5, fontBold, gray);
  drawLine(`${data.lotArea || "N/A"} sq.m.`, L + 80, y, 8, fontReg, navy);
  drawLine("Total Floor Area:", L + 180, y, 7.5, fontBold, gray);
  drawLine(`${data.floorArea || "N/A"} sq.m.`, L + 270, y, 8, fontReg, navy);
  drawLine("No. of Storeys:", L + 370, y, 7.5, fontBold, gray);
  drawLine(data.proposedStoreys || "N/A", L + 450, y, 8, fontReg, navy);

  y -= 18;
  drawLine("Type of Occupancy:", L, y, 7.5, fontBold, gray);
  drawLine(data.projectType?.category || "Residential", L + 110, y, 8, fontBold, navy);
  drawLine("Estimated Project Cost:", L + 260, y, 7.5, fontBold, gray);
  drawLine(`PHP ${data.projectCost || "N/A"}`, L + 375, y, 8, fontBold, navy);

  // ── SECTION 3: MEANS OF EGRESS ───────────────────────────────────────────
  y -= 28;
  page.drawRectangle({ x: L, y: y + 2, width: R - L, height: 14, color: rgb(0.88, 0.10, 0.14) });
  drawLine("3.  MEANS OF EGRESS & LIFE SAFETY (RA 9514, Section 3.7)", L + 5, y + 5, 8, fontBold, rgb(1, 1, 1));

  y -= 20;
  drawLine("No. of Independent Exit Doors:", L, y, 7.5, fontBold, gray);
  drawLine(data.numberOfExits || "N/A", L + 175, y, 8, fontReg, navy, 55);

  y -= 15;
  drawLine("Exit Door Clear Opening Width:", L, y, 7.5, fontBold, gray);
  drawLine(data.fireEgressDetails || "N/A", L + 175, y, 8, fontReg, navy, 60);

  y -= 15;
  drawLine("Stairway & Handrail Specifications:", L, y, 7.5, fontBold, gray);
  drawLine(data.firewallSpecs ? "" : "0.90m minimum stair width, continuous steel handrail", L + 210, y, 8, fontReg, navy, 55);

  y -= 15;
  drawLine("Firewall / Party Wall Specifications:", L, y, 7.5, fontBold, gray);
  drawLine(data.firewallSpecs || "N/A", L + 215, y, 8, fontReg, navy, 55);

  // ── SECTION 4: FIRE SUPPRESSION SYSTEMS ──────────────────────────────────
  y -= 28;
  page.drawRectangle({ x: L, y: y + 2, width: R - L, height: 14, color: rgb(0.88, 0.10, 0.14) });
  drawLine("4.  FIRE SUPPRESSION & LIFE-SAFETY EQUIPMENT", L + 5, y + 5, 8, fontBold, rgb(1, 1, 1));

  y -= 20;
  drawLine("Portable Fire Extinguishers:", L, y, 7.5, fontBold, gray);
  drawLine(data.fireExtinguisherSpecs || "N/A", L + 165, y, 8, fontReg, navy, 60);

  y -= 15;
  drawLine("Emergency Lighting Units:", L, y, 7.5, fontBold, gray);
  drawLine(data.emergencyLightsCount || "N/A", L + 148, y, 8, fontReg, navy, 65);

  y -= 15;
  drawLine("Smoke / Heat Detectors:", L, y, 7.5, fontBold, gray);
  drawLine(data.smokeDetectorsCount || "N/A", L + 138, y, 8, fontReg, navy, 65);

  // ── SECTION 5: COMPLIANCE CHECKBOXES ─────────────────────────────────────
  y -= 28;
  page.drawRectangle({ x: L, y: y + 2, width: R - L, height: 14, color: rgb(0.88, 0.10, 0.14) });
  drawLine("5.  RA 9514 COMPLIANCE DECLARATION", L + 5, y + 5, 8, fontBold, rgb(1, 1, 1));

  const checkItems = [
    "All fire exits are unobstructed, clearly marked, and open outward",
    "Portable fire extinguishers are fully charged, mounted, and tagged",
    "Emergency lights are tested and functional (90-min. battery backup)",
    "Smoke / heat detectors are installed in all required areas",
    "Sprinkler system installed (if required by occupancy type & floor area)",
    "Firewall / party wall complies with RIRR of RA 9514, Rule 10",
    "Means of egress comply with NFPA 101 Life Safety Code (adopted by RA 9514)",
    "FSIC/FSEC fees paid per BFP Schedule of Fees and Charges",
  ];
  y -= 4;
  for (const item of checkItems) {
    y -= 14;
    page.drawRectangle({ x: L, y: y - 2, width: 10, height: 10, borderColor: navy, borderWidth: 0.7, color: rgb(0.92, 0.95, 1) });
    page.drawText("X", { x: L + 2, y: y - 1, size: 8, font: fontBold, color: navy });
    drawLine(item, L + 16, y, 7.5, fontReg, navy, 88);
  }

  // ── SECTION 6: SIGNATURES ─────────────────────────────────────────────────
  y -= 32;
  hRule(y + 4);
  page.drawRectangle({ x: L, y: y - 56, width: (R - L) / 2 - 10, height: 62, borderColor: border, borderWidth: 0.5 });
  page.drawRectangle({ x: L + (R - L) / 2 + 10, y: y - 56, width: (R - L) / 2 - 10, height: 62, borderColor: border, borderWidth: 0.5 });

  // Applicant side
  drawLine("APPLICANT'S CERTIFICATION", L + 4, y - 8, 7, fontBold, red);
  drawLine("I hereby certify that all information stated herein is true and correct", L + 4, y - 19, 6.5, fontReg, gray, 58);
  drawLine("and that the construction shall strictly comply with RA 9514.", L + 4, y - 28, 6.5, fontReg, gray, 56);
  page.drawLine({ start: { x: L + 8, y: y - 44 }, end: { x: L + 200, y: y - 44 }, thickness: 0.6, color: navy });
  drawLine((data.applicantName || "").toUpperCase(), L + 8, y - 55, 7.5, fontBold, navy);

  // BFP side
  const bfpX = L + (R - L) / 2 + 14;
  drawLine("BFP EVALUATOR'S SIGNATURE", bfpX, y - 8, 7, fontBold, red);
  drawLine("Evaluated by:", bfpX, y - 19, 6.5, fontReg, gray);
  page.drawLine({ start: { x: bfpX + 4, y: y - 44 }, end: { x: R - 8, y: y - 44 }, thickness: 0.6, color: navy });
  drawLine("Fire Safety Inspector, BFP Sto. Tomas", bfpX + 4, y - 55, 7, fontReg, gray);

  // ── FOOTER ────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width, height: 22, color: rgb(0.88, 0.10, 0.14) });
  drawLine("This document is an official FSEC Application Summary. The BFP will issue the actual Fire Safety Evaluation Clearance after site inspection.",
    55, 7, 6, fontReg, rgb(1, 1, 1), 110);

  return await doc.saveAsBase64({ dataUri: false });
}

/**
 * 9. COMPILED OFFICIAL UNIFIED APPLICATION DOSSIER
 * Generates the Building Permit as Master Cover, then appends all required
 * technical permits (AP, SP, EP, PL, MP, EL, etc.) with the applicant's entered responses.
 */
export async function generateUnifiedPermitPdf(data: UnifiedPermitFormData): Promise<string> {
  // 1. Generate Building Permit as base
  const buildingPdfBase64 = await generateBuildingPermitPdf(data);
  const mainDoc = await PDFDocument.load(Buffer.from(buildingPdfBase64, "base64"));

  const activeForms = Array.isArray(data.activePermitForms) && data.activePermitForms.length > 0
    ? data.activePermitForms
    : ["architecturalPermit", "civilStructuralPermit", "electricalPermit", "sanitaryPermit"];

  for (const formKey of activeForms) {
    if (formKey === "buildingPermit" || formKey === "zoningPermit") {
      continue;
    }

    try {
      let formBase64: string | null = null;
      if (formKey === "architecturalPermit") {
        formBase64 = await generateArchitecturalPermitPdf(data);
      } else if (formKey === "civilStructuralPermit") {
        formBase64 = await generateStructuralPermitPdf(data);
      } else if (formKey === "electricalPermit") {
        formBase64 = await generateElectricalPermitPdf(data);
      } else if (formKey === "sanitaryPermit") {
        formBase64 = await generateSanitaryPermitPdf(data);
      } else if (formKey === "mechanicalPermit") {
        formBase64 = await generateMechanicalPermitPdf(data);
      } else if (formKey === "electronicsPermit") {
        formBase64 = await generateElectronicsPermitPdf(data);
      } else if (formKey === "fireBfpPermit") {
        formBase64 = await generateBfpApplicationPdf(data);
      } else if (formKey === "demolitionPermit") {
        formBase64 = await generateDemolitionPermitPdf(data);
      } else if (formKey === "fencingPermit") {
        formBase64 = await generateFencingPermitPdf(data);
      } else if (formKey === "excavationPermit") {
        formBase64 = await generateExcavationPermitPdf(data);
      } else if (formKey === "signPermit") {
        formBase64 = await generateSignPermitPdf(data);
      } else if (formKey === "temporaryServiceConnection") {
        formBase64 = await generateTemporaryServicePermitPdf(data);
      } else if (formKey === "certificateOfOccupancy") {
        formBase64 = await generateCertificateOfOccupancyPdf(data);
      } else if (formKey === "certificateOfCompletion") {
        formBase64 = await generateCertificateOfCompletionPdf(data);
      } else if (formKey === "cfei") {
        formBase64 = await generateCfeiPdf(data);
      } else {
        const meta = (PERMIT_FORM_METADATA as Record<string, { label: string; code: string; desc: string; templateFile?: string }>)[formKey];
        if (meta?.templateFile) {
          const rawBytes = await fetchTemplateBytes(meta.templateFile);
          const rawDoc = await PDFDocument.load(rawBytes);
          formBase64 = await rawDoc.saveAsBase64({ dataUri: false });
        }
      }

      if (formBase64) {
        const techDoc = await PDFDocument.load(Buffer.from(formBase64, "base64"));
        const copiedPages = await mainDoc.copyPages(techDoc, techDoc.getPageIndices());
        for (const cp of copiedPages) {
          mainDoc.addPage(cp);
        }
      }
    } catch (err) {
      console.warn(`Notice: Could not compile ancillary form ${formKey}:`, err);
    }
  }

  return await mainDoc.saveAsBase64({ dataUri: false });
}

/**
 * 10. OFFICIAL DEMOLITION PERMIT (NBC FORM B-08)
 */
export async function generateDemolitionPermitPdf(data: UnifiedPermitFormData): Promise<string> {
  const bytes = await fetchTemplateBytes("/templates/DEMOLITION-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf");
  const doc = await PDFDocument.load(bytes);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const p1 = doc.getPage(0);

  const drawText = (text: string | undefined | null, x: number, y: number, size: number = 8, isBold: boolean = false, maxWidth?: number) => {
    if (!text) return;
    let clean = safeText(text).trim();
    if (maxWidth && clean.length > maxWidth) clean = clean.slice(0, maxWidth);
    p1.drawText(clean, { x, y, size, font: isBold ? fontBold : fontRegular, color: darkNavy });
  };

  // Header: Application No. inside box
  drawText(data.applicationNo || "APP-2026-6636", 75, 676.0, 8.5, true);
  drawText(data.submissionDate || "Sep 17, 2026", 430, 676.0, 8, false);

  // Box 1: Moved lower to sit on line
  const { lastName, firstName, mi, middleName } = parseApplicantName(data);
  drawText(lastName, 160, 616.0, 8.5, true, 20);
  drawText(firstName, 260, 616.0, 8.5, true, 22);
  drawText(middleName || mi, 370, 616.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 440, 616.0, 7.0, false);
  drawText(data.formOfOwnership || "INDIVIDUAL", 210, 591.0, 8, false, 25);
  drawText((data.projectType?.category || "Residential").toUpperCase(), 380, 591.0, 8, false, 25);

  // Address: moved lower
  drawText(data.applicantAddress || "123 Rizal St., Poblacion", 80, 563.0, 7.5, false, 28);
  drawText(data.barangay || "Poblacion", 250, 563.0, 7.5, false, 16);
  drawText(data.applicantPhone || "0917-123-4567", 440, 563.0, 7.5, true);

  // Location of Demolition
  drawText(data.lotNo || "Lot 12", 160, 538.0, 7.5, true);
  drawText(data.blockNo || "Blk 4", 240, 538.0, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 320, 538.0, 7.5, true, 16);
  drawText(data.taxDecNo || "TD-2026-0012", 440, 538.0, 7.5, false);

  drawText(data.projectAddress || "Lot 12, Blk 4, Sunset Valley Subd.", 80, 519.0, 7.5, false, 24);
  drawText(data.barangay || "Poblacion", 240, 519.0, 7.5, true, 20);

  // Box 2: Demolition Details
  const bldgType = data.demolitionBuildingType || data.projectType?.name || "Single-Detached Residential";
  drawText(bldgType, 160, 480.0, 7.5, true, 36);
  drawText(`${data.demolitionArea || data.floorArea || "180.00"} sq.m.`, 160, 460.0, 8, true);
  drawText(data.demolitionStoreys || data.proposedStoreys || "2", 360, 460.0, 8, true);
  drawText(data.proposedStartDate || "Oct 01, 2026", 160, 440.0, 7.5, false);
  drawText(data.expectedCompletionDate || "Nov 15, 2026", 360, 440.0, 7.5, false);

  // Box 3: Engineer - moved higher
  const ceName = data.civilEngineerName || "Engr. Roberto Cruz, CE";
  drawText(ceName.toUpperCase(), 100, 365.0, 8.5, true);
  drawText(data.civilEngineerPRC || "PRC-0078923", 80, 340.0, 7.5, false);
  drawText(data.civilEngineerPTR || "PTR-ST-2026-001", 80, 325.0, 7.5, false);

  // Box 4: Applicant - moved higher
  drawText((data.applicantName || "JUAN DELA CRUZ").toUpperCase(), 100, 240.0, 8.5, true);
  drawText(data.govIdNo || "CTC-2026-00192", 80, 210.0, 7.5, false);

  return await doc.saveAsBase64({ dataUri: false });
}

/**
 * 11. OFFICIAL FENCING PERMIT (NBC FORM B-03)
 */
export async function generateFencingPermitPdf(data: UnifiedPermitFormData): Promise<string> {
  const bytes = await fetchTemplateBytes("/templates/FENCING-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf");
  const doc = await PDFDocument.load(bytes);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const p1 = doc.getPage(0);

  const drawText = (text: string | undefined | null, x: number, y: number, size: number = 8, isBold: boolean = false, maxWidth?: number) => {
    if (!text) return;
    let clean = safeText(text).trim();
    if (maxWidth && clean.length > maxWidth) clean = clean.slice(0, maxWidth);
    p1.drawText(clean, { x, y, size, font: isBold ? fontBold : fontRegular, color: darkNavy });
  };

  // Header: Applicant No. inside box
  drawText(data.applicationNo || "APP-2026-6636", 75, 676.0, 8.5, true);
  drawText(data.submissionDate || "Sep 17, 2026", 430, 676.0, 8, false);

  // Box 1
  const { lastName, firstName, mi, middleName } = parseApplicantName(data);
  drawText(lastName, 160, 618.0, 8.5, true, 20);
  drawText(firstName, 260, 618.0, 8.5, true, 22);
  drawText(middleName || mi, 370, 618.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 440, 618.0, 7.5, false);
  drawText(data.formOfOwnership || "INDIVIDUAL", 210, 591.0, 8, false, 25);
  drawText((data.projectType?.category || "Residential").toUpperCase(), 380, 591.0, 8, false, 25);

  // Address
  drawText(data.applicantAddress || "123 Rizal St., Poblacion", 80, 565.0, 7.5, false, 28);
  drawText(data.barangay || "Poblacion", 250, 565.0, 7.5, false, 16);
  drawText(data.applicantPhone || "0917-123-4567", 440, 565.0, 7.5, true);

  // Location of Fencing
  drawText(data.lotNo || "Lot 12", 160, 538.0, 7.5, true);
  drawText(data.blockNo || "Blk 4", 240, 538.0, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 320, 538.0, 7.5, true, 16);
  drawText(data.taxDecNo || "TD-2026-0012", 440, 538.0, 7.5, false);

  drawText(data.projectAddress || "Lot 12, Blk 4, Sunset Valley Subd.", 80, 519.0, 7.5, false, 24);
  drawText(data.barangay || "Poblacion", 240, 519.0, 7.5, true, 20);

  // Box 2: Fencing Specifications: moved higher (+5px)
  const fenceType = data.fencingType || "Reinforced Concrete / CHB with Decorative Steel Grills";
  drawText(fenceType, 160, 470.0, 8, true, 48);
  drawText(`${data.fencingLength || "45.00"} METERS`, 160, 450.0, 8, true);
  drawText(`${data.fencingHeight || "2.20"} METERS`, 360, 450.0, 8, true);
  drawText(`PHP ${data.fencingCost || "150,000.00"}`, 160, 433.0, 8, true);
  drawText(data.proposedStartDate || "Oct 01, 2026", 160, 415.0, 7.5, false);
  drawText(data.expectedCompletionDate || "Nov 15, 2026", 360, 415.0, 7.5, false);

  // Box 3: Architect / Civil Engineer
  const archName = data.architectName || "Arch. Maria Santos, UAP";
  drawText(archName.toUpperCase(), 100, 365.0, 8.5, true);
  drawText(data.architectPRC || "PRC-0045211", 80, 340.0, 7.5, false);
  drawText(data.architectPTR || "PTR-ST-2026-004", 80, 325.0, 7.5, false);

  // Box 4: Applicant Signature: moved higher (+5px)
  drawText((data.applicantName || "JUAN DELA CRUZ").toUpperCase(), 100, 240.0, 8.5, true);
  drawText(data.govIdNo || "CTC-2026-00192", 80, 210.0, 7.5, false);

  return await doc.saveAsBase64({ dataUri: false });
}

/**
 * 12. OFFICIAL EXCAVATION AND GROUND PREPARATION PERMIT (NBC FORM B-02)
 */
export async function generateExcavationPermitPdf(data: UnifiedPermitFormData): Promise<string> {
  const bytes = await fetchTemplateBytes("/templates/EXCAVATION-AND-GROUND-PREPARATION-PERMIT-Gilbert-Cruz.pdf");
  const doc = await PDFDocument.load(bytes);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const p1 = doc.getPage(0);

  const drawText = (text: string | undefined | null, x: number, y: number, size: number = 8, isBold: boolean = false, maxWidth?: number) => {
    if (!text) return;
    let clean = safeText(text).trim();
    if (maxWidth && clean.length > maxWidth) clean = clean.slice(0, maxWidth);
    p1.drawText(clean, { x, y, size, font: isBold ? fontBold : fontRegular, color: darkNavy });
  };

  // Header: Applicant No. inside box
  drawText(data.applicationNo || "APP-2026-6636", 75, 656.0, 8.5, true);
  drawText(data.submissionDate || "Sep 17, 2026", 430, 656.0, 8, false);

  // Box 1
  const { lastName, firstName, mi, middleName } = parseApplicantName(data);
  drawText(lastName, 160, 602.0, 8.5, true, 20);
  drawText(firstName, 260, 602.0, 8.5, true, 22);
  drawText(middleName || mi, 370, 602.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 450, 602.0, 8, false);
  drawText(data.formOfOwnership || "INDIVIDUAL", 210, 575.0, 8, false, 25);
  drawText((data.projectType?.category || "Residential").toUpperCase(), 380, 575.0, 8, false, 25);

  // Address (Applicant Address)
  drawText(data.applicantAddress || "123 Rizal St., Poblacion", 80, 546.0, 7.5, false, 28);
  drawText(data.barangay || "Poblacion", 80, 528.0, 7.5, false, 20);
  drawText(data.applicantPhone || "0917-123-4567", 450, 546.0, 7.5, true);

  // Location
  drawText(data.lotNo || "Lot 12", 160, 514.0, 7.5, true);
  drawText(data.blockNo || "Blk 4", 240, 514.0, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 320, 514.0, 7.5, true, 16);
  // Missing Tax Dec No. added
  drawText(data.taxDecNo || "TD-2026-0012", 440, 514.0, 7.5, false);

  drawText(data.projectAddress || "Lot 12, Blk 4, Sunset Valley Subd.", 80, 496.0, 7.5, false, 24);
  drawText(data.barangay || "Poblacion", 240, 496.0, 7.5, true, 20);

  // Box 2: Excavation Specifications: moved higher (+5px)
  const excScope = data.excavationScope || "Foundation Excavation, Site Grading & Ground Levelling";
  drawText(excScope, 160, 465.0, 8, true, 48);
  drawText(`${data.excavationVolume || "120.00"} CU. M.`, 160, 445.0, 8, true);
  drawText(`${data.excavationDepth || "2.50"} METERS`, 360, 445.0, 8, true);
  drawText(`PHP ${data.projectCost || "85,000.00"}`, 160, 425.0, 8, true);
  drawText(data.proposedStartDate || "Oct 01, 2026", 160, 405.0, 7.5, false);
  drawText(data.expectedCompletionDate || "Nov 15, 2026", 360, 405.0, 7.5, false);

  // Box 3: Civil Engineer
  const ceName = data.civilEngineerName || "Engr. Roberto Cruz, CE";
  drawText(ceName.toUpperCase(), 100, 275.0, 8.5, true);
  drawText(data.civilEngineerPRC || "PRC-0078923", 80, 245.0, 7.5, false);
  drawText(data.civilEngineerPTR || "PTR-ST-2026-001", 80, 232.0, 7.5, false);

  // Box 4: Building Owner Signature: moved higher (+5px)
  drawText((data.applicantName || "JUAN DELA CRUZ").toUpperCase(), 100, 130.0, 8.5, true);
  drawText(data.govIdNo || "CTC-2026-00192", 80, 85.0, 7.5, false);

  return await doc.saveAsBase64({ dataUri: false });
}

/**
 * 13. OFFICIAL SIGN PERMIT (NBC FORM B-07)
 */
export async function generateSignPermitPdf(data: UnifiedPermitFormData): Promise<string> {
  const bytes = await fetchTemplateBytes("/templates/SIGN-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf");
  const doc = await PDFDocument.load(bytes);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const p1 = doc.getPage(0);

  const drawText = (text: string | undefined | null, x: number, y: number, size: number = 8, isBold: boolean = false, maxWidth?: number) => {
    if (!text) return;
    let clean = safeText(text).trim();
    if (maxWidth && clean.length > maxWidth) clean = clean.slice(0, maxWidth);
    p1.drawText(clean, { x, y, size, font: isBold ? fontBold : fontRegular, color: darkNavy });
  };

  const drawCheck = (x: number, y: number) => {
    p1.drawText("X", { x, y, size: 8.5, font: fontBold, color: darkNavy });
  };

  // Header: Applicant No. inside box
  drawText(data.applicationNo || "APP-2026-6636", 75, 781.0, 8.5, true);
  drawText(data.submissionDate || "Sep 17, 2026", 440, 781.0, 8, false);

  // Box 1
  const { lastName, firstName, mi, middleName } = parseApplicantName(data);
  drawText(lastName, 160, 728.0, 8.5, true, 20);
  drawText(firstName, 260, 728.0, 8.5, true, 22);
  drawText(middleName || mi, 370, 728.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 460, 728.0, 8, false);
  drawText(data.formOfOwnership || "INDIVIDUAL / ENTERPRISE", 210, 700.0, 8, false, 25);
  drawText((data.projectType?.category || "Commercial / Business").toUpperCase(), 380, 700.0, 8, false, 25);

  // Address (Applicant Address)
  drawText(data.applicantAddress || "123 Rizal St., Poblacion", 80, 672.0, 7.5, false, 28);
  drawText(data.barangay || "Poblacion", 240, 672.0, 7.5, false, 18);
  drawText(data.applicantPhone || "0917-123-4567", 460, 672.0, 7.5, true);

  // Location of Sign
  drawText(data.lotNo || "Lot 12", 160, 643.0, 7.5, true);
  drawText(data.blockNo || "Blk 4", 240, 643.0, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 320, 643.0, 7.5, true, 16);
  // Missing Tax Dec No. added
  drawText(data.taxDecNo || "TD-2026-0012", 440, 643.0, 7.5, false);

  drawText(data.projectAddress || "Lot 12, Blk 4, Sunset Valley Subd.", 80, 613.0, 7.5, false, 24);
  drawText(data.barangay || "Poblacion", 240, 613.0, 7.5, true, 20);

  // Scope of Work: [X] New Installation
  drawCheck(55, 613.0);

  // Box 2: Sign Details
  const sType = data.signType || "Business Sign, Wall Type (Illuminated LED)";
  drawText(sType, 160, 528.0, 8, true, 48);
  drawText(data.signDimensions || "3.00m Width x 1.50m Height (Area: 4.50 sq.m.)", 160, 498.0, 8, true, 48);
  drawText(data.signMaterial || "Acrylic Face with LED Backlight on Steel Framing", 160, 478.0, 8, false, 48);
  drawText(`PHP ${data.signCost || "45,000.00"}`, 160, 458.0, 8, true);
  drawText(data.proposedStartDate || "Oct 01, 2026", 160, 438.0, 7.5, false);
  drawText(data.expectedCompletionDate || "Oct 15, 2026", 360, 438.0, 7.5, false);

  // Box 3: Architect / Structural Engineer: moved higher (+5px)
  const archName = data.architectName || "Arch. Maria Santos, UAP";
  drawText(archName.toUpperCase(), 100, 285.0, 8.5, true);
  drawText(data.architectPRC || "PRC-0045211", 80, 260.0, 7.5, false);
  drawText(data.architectPTR || "PTR-ST-2026-004", 80, 245.0, 7.5, false);

  // Box 5: Applicant Signature: moved higher (+5px)
  drawText((data.applicantName || "JUAN DELA CRUZ").toUpperCase(), 100, 200.0, 8.5, true);
  drawText(data.govIdNo || "CTC-2026-00192", 80, 173.0, 7.5, false);

  return await doc.saveAsBase64({ dataUri: false });
}

/**
 * 14. OFFICIAL PERMIT FOR TEMPORARY SERVICE CONNECTION (NBC FORM E-03)
 */
export async function generateTemporaryServicePermitPdf(data: UnifiedPermitFormData): Promise<string> {
  const bytes = await fetchTemplateBytes("/templates/PERMIT-FOR-TEMPORARY-SERVICE-CONNECTION-Gilbert-Cruz.pdf");
  const doc = await PDFDocument.load(bytes);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const p1 = doc.getPage(0);

  const drawText = (text: string | undefined | null, x: number, y: number, size: number = 8, isBold: boolean = false, maxWidth?: number) => {
    if (!text) return;
    let clean = safeText(text).trim();
    if (maxWidth && clean.length > maxWidth) clean = clean.slice(0, maxWidth);
    p1.drawText(clean, { x, y, size, font: isBold ? fontBold : fontRegular, color: darkNavy });
  };

  // Header: Applicant No. inside box
  drawText(data.applicationNo || "APP-2026-6636", 75, 766.0, 8.5, true);
  drawText(data.submissionDate || "Sep 17, 2026", 440, 766.0, 8, false);

  // Box 1
  const { lastName, firstName, mi, middleName } = parseApplicantName(data);
  drawText(lastName, 160, 747.0, 8.5, true, 20);
  drawText(firstName, 260, 747.0, 8.5, true, 22);
  drawText(middleName || mi, 370, 747.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 450, 747.0, 8, false);
  drawText(data.formOfOwnership || "INDIVIDUAL", 210, 704.0, 8, false, 25);
  drawText((data.projectType?.category || "Residential").toUpperCase(), 380, 704.0, 8, false, 25);

  // Address (Applicant Address)
  drawText(data.applicantAddress || "123 Rizal St., Poblacion", 80, 671.0, 7.5, false, 28);
  drawText(data.barangay || "Poblacion", 240, 671.0, 7.5, false, 18);
  drawText(data.applicantPhone || "0917-123-4567", 450, 671.0, 7.5, true);

  // Location
  drawText(data.lotNo || "Lot 12", 160, 629.0, 7.5, true);
  drawText(data.blockNo || "Blk 4", 240, 629.0, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 320, 629.0, 7.5, true, 16);
  // Missing Tax Dec No. added
  drawText(data.taxDecNo || "TD-2026-0012", 440, 629.0, 7.5, false);

  drawText(data.projectAddress || "Lot 12, Blk 4, Sunset Valley Subd.", 80, 609.0, 7.5, false, 24);
  drawText(data.barangay || "Poblacion", 240, 609.0, 7.5, true, 20);

  // Box 2: Temporary Service Specs: moved higher (+5px)
  drawText(data.temporaryServicePurpose || "FOR CONSTRUCTION POWER & TESTING", 160, 582.0, 8, true, 45);
  drawText(`${data.temporaryServiceKva || "15.0"} kVA, ${data.temporaryServiceVoltage || "230V, Single Phase, 60Hz"}`, 160, 553.0, 8, true);
  drawText(`${data.temporaryServiceDuration || "90"} DAYS`, 160, 533.0, 8, true);
  drawText(data.proposedStartDate || "Oct 01, 2026", 160, 513.0, 7.5, false);

  // Box 3: Electrical Engineer
  const peeName = data.electricalEngineerName || "Engr. Danilo Reyes, PEE";
  drawText(peeName.toUpperCase(), 100, 395.0, 8.5, true);
  drawText(data.electricalEngineerPRC || "PRC-0033421", 80, 365.0, 7.5, false);
  drawText(data.electricalEngineerPTR || "PTR-ST-2026-4412", 80, 350.0, 7.5, false);

  // Box 4: Owner Signature: moved higher (+5px)
  drawText((data.applicantName || "JUAN DELA CRUZ").toUpperCase(), 100, 150.0, 8.5, true);
  drawText(data.govIdNo || "CTC-2026-00192", 80, 125.0, 7.5, false);

  return await doc.saveAsBase64({ dataUri: false });
}

/**
 * 15. UNIFIED APPLICATION FORM FOR CERTIFICATE OF OCCUPANCY
 */
export async function generateCertificateOfOccupancyPdf(data: UnifiedPermitFormData): Promise<string> {
  const bytes = await fetchTemplateBytes("/templates/UNIFIED-APPLICATION-FORM-FOR-CERTIFICATE-OF-OCCUPANCY-Sto-Tomas.pdf");
  const doc = await PDFDocument.load(bytes);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const p1 = doc.getPage(0);

  const drawText = (text: string | undefined | null, x: number, y: number, size: number = 8, isBold: boolean = false, maxWidth?: number) => {
    if (!text) return;
    let clean = safeText(text).trim();
    if (maxWidth && clean.length > maxWidth) clean = clean.slice(0, maxWidth);
    p1.drawText(clean, { x, y, size, font: isBold ? fontBold : fontRegular, color: darkNavy });
  };

  // Header & References: BUILDING PERMIT NO. on underline
  drawText(data.applicationNo || "BP-2026-0091", 160, 738.0, 8.5, true);
  drawText(data.submissionDate || "Sep 17, 2026", 440, 738.0, 8, false);

  // Owner details: separated name
  const { lastName, firstName, mi, middleName } = parseApplicantName(data);
  const ownerFormatted = `${lastName}, ${firstName} ${middleName ? middleName + " " : ""}${mi !== "N/A" ? mi : ""}`.trim();
  drawText(ownerFormatted.toUpperCase(), 140, 642.0, 8.5, true);
  // ADDRESS OF APPLICANT / OWNER on underline
  drawText(data.applicantAddress || "123 Rizal St., Brgy. Poblacion, Sto. Tomas, Pampanga", 180, 614.0, 7.5, false, 45);

  // Project details & Occupancy: moved higher onto underlines
  drawText((data.projectName || "DELA CRUZ TWO-STOREY RESIDENCE").toUpperCase(), 140, 410.0, 8.5, true);
  drawText(`${data.projectAddress || ""}, Brgy. ${data.barangay || "Poblacion"}, Sto. Tomas, Pampanga`, 140, 380.0, 7.5, false, 55);
  drawText((data.occupancyClass || data.projectType?.category || "Group A - Residential").toUpperCase(), 260, 348.0, 8, true);

  // Dates & Costs: moved higher onto underlines
  drawText(data.proposedStartDate || "Oct 01, 2026", 140, 318.0, 7.5, false);
  drawText(data.actualCompletionDate || data.expectedCompletionDate || "Apr 30, 2027", 380, 318.0, 7.5, true);
  drawText(data.proposedStoreys || "2", 140, 303.0, 7.5, true);
  drawText(data.numberOfUnits || "1", 380, 303.0, 7.5, true);
  drawText(`${data.actualFloorArea || data.floorArea || "185.50"} sq.m.`, 140, 288.0, 8, true);
  drawText(`PHP ${data.actualProjectCost || data.projectCost || "2,500,000.00"}`, 380, 288.0, 8, true);

  // Applicant Signature: moved higher
  drawText((data.applicantName || "JUAN DELA CRUZ").toUpperCase(), 360, 200.0, 8.5, true);
  drawText(data.govIdNo || "CTC-2026-00192", 360, 177.0, 7.5, false);

  // Engineer Signature: moved higher
  const supName = data.constructionSupervisorName || data.civilEngineerName || data.architectName || "Engr. Roberto Cruz, CE";
  drawText(supName.toUpperCase(), 360, 90.0, 8.5, true);

  return await doc.saveAsBase64({ dataUri: false });
}

/**
 * 16. OFFICIAL CERTIFICATE OF COMPLETION
 */
export async function generateCertificateOfCompletionPdf(data: UnifiedPermitFormData): Promise<string> {
  const bytes = await fetchTemplateBytes("/templates/CERTIFICATE-OF-COMPLETION-Sto-Tomas-Header-Bold.pdf");
  const doc = await PDFDocument.load(bytes);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  // Remove Page 3 from PDF per tester feedback
  if (doc.getPageCount() > 2) {
    doc.removePage(2);
  }

  const p1 = doc.getPage(0);

  const drawText = (text: string | undefined | null, x: number, y: number, size: number = 8, isBold: boolean = false, maxWidth?: number) => {
    if (!text) return;
    let clean = safeText(text).trim();
    if (maxWidth && clean.length > maxWidth) clean = clean.slice(0, maxWidth);
    p1.drawText(clean, { x, y, size, font: isBold ? fontBold : fontRegular, color: darkNavy });
  };

  // Header
  drawText(data.applicationNo || "BP-2026-0091", 320, 748.0, 8.5, true);
  drawText(data.submissionDate || "Sep 17, 2026", 480, 748.0, 8, false);

  // Owner details: separated name
  const { lastName, firstName, mi, middleName } = parseApplicantName(data);
  const ownerFormatted = `${lastName}, ${firstName} ${middleName ? middleName + " " : ""}${mi !== "N/A" ? mi : ""}`.trim();
  drawText(ownerFormatted.toUpperCase(), 140, 690.0, 8.5, true);
  drawText(data.applicantAddress || "Sto. Tomas, Pampanga", 150, 665.0, 7.5, false, 48);
  // Zip Code & CONTACT NO.
  drawText("2020", 340, 665.0, 7.5, false);
  drawText(data.applicantPhone || "0917-123-4567", 440, 665.0, 7.5, true);

  // LOCATION OF CONSTRUCTION & USE on underline
  drawText(`${data.projectAddress || "Lot 12, Blk 4, Sunset Valley Subd."}, Brgy. ${data.barangay || "Poblacion"}`, 150, 640.0, 7.5, false, 55);
  drawText((data.occupancyClass || data.projectType?.category || "Residential").toUpperCase(), 200, 626.0, 8, true);

  // Dates & Floor Area / Cost on underline
  drawText(data.proposedStartDate || "Oct 01, 2026", 120, 572.0, 7.5, false);
  drawText(data.actualCompletionDate || data.expectedCompletionDate || "Apr 30, 2027", 340, 572.0, 7.5, true);
  drawText(`${data.floorArea || "185.50"} SQ. M.`, 140, 542.0, 8, true);
  drawText(`PHP ${data.projectCost || "2,500,000.00"}`, 340, 542.0, 8, true);

  // NO. OF STOREY(S) & NO. OF UNIT(S) in table/chart
  drawText(data.proposedStoreys || "2", 140, 520.0, 8, true);
  drawText(data.numberOfUnits || "1", 340, 520.0, 8, true);

  // Full-time supervisor: moved higher (+5px)
  const supName = data.constructionSupervisorName || data.civilEngineerName || data.architectName || "Engr. Roberto Cruz, CE";
  drawText(supName.toUpperCase(), 140, 285.0, 8.5, true);

  // Conforme: Owner
  drawText((data.applicantName || "JUAN DELA CRUZ").toUpperCase(), 140, 170.0, 8.5, true);

  // BEFORE ME, at the City/Municipality of on underline
  drawText("Sto. Tomas, Pampanga", 240, 140.0, 8, true);

  return await doc.saveAsBase64({ dataUri: false });
}

/**
 * 17. OFFICIAL CERTIFICATE OF FINAL ELECTRICAL INSPECTION (CFEI)
 */
export async function generateCfeiPdf(data: UnifiedPermitFormData): Promise<string> {
  const bytes = await fetchTemplateBytes("/templates/CERTIFICATE-OF-FINAL-ELECTRICAL-INSPECTION-Gilbert-Cruz.pdf");
  const doc = await PDFDocument.load(bytes);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const p1 = doc.getPage(0);

  const drawText = (text: string | undefined | null, x: number, y: number, size: number = 8, isBold: boolean = false, maxWidth?: number) => {
    if (!text) return;
    let clean = safeText(text).trim();
    if (maxWidth && clean.length > maxWidth) clean = clean.slice(0, maxWidth);
    p1.drawText(clean, { x, y, size, font: isBold ? fontBold : fontRegular, color: darkNavy });
  };

  // Header & Permit: Application Reference No. on underline
  drawText(data.applicationNo || "CFEI-2026-0042", 420, 831.0, 8.5, true);

  // Owner: on underline
  drawText((data.applicantName || "JUAN DELA CRUZ").toUpperCase(), 150, 784.0, 8.5, true);
  // ADDRESS: NO. STREET on underline
  drawText(data.applicantAddress || "123 Rizal St.", 150, 754.0, 7.5, false, 50);
  // BARANGAY, CITY/MUNICIPALITY
  drawText(`Brgy. ${data.barangay || "Poblacion"}, Sto. Tomas, Pampanga`, 150, 735.0, 7.5, false, 50);

  // Type of occupancy: X mark properly placed inside the box
  drawText("X", 52, 686.0, 8.5, true); // [X] Residential Dwelling

  // Dates
  drawText(data.proposedStartDate || "Oct 01, 2026", 150, 644.0, 7.5, false);
  drawText(data.actualCompletionDate || data.expectedCompletionDate || "Apr 30, 2027", 420, 644.0, 7.5, true);

  // LOCATION OF INSTALLATION: LOT NO., BLK. NO., STREET, BARANGAY, & CITY/MUNICIPALITY
  drawText(
    `Lot ${data.lotNo || "12"}, Blk ${data.blockNo || "4"}, ${data.projectAddress || "Sunset Valley Subd."}, Brgy. ${data.barangay || "Poblacion"}, Sto. Tomas, Pampanga`,
    150,
    610.0,
    7.5,
    false,
    55
  );

  // Load
  const loadSummary = `${data.electricalConnectedLoad || "15.0"} kVA / ${data.electricalVoltage || "230V"}, Single Phase, 60Hz`;
  drawText(loadSummary, 150, 582.0, 8, true);

  // PEE
  const peeName = data.electricalEngineerName || "Engr. Danilo Reyes, PEE";
  drawText(peeName.toUpperCase(), 120, 485.0, 8.5, true);
  drawText(data.electricalEngineerPRC || "PRC-0033421", 320, 485.0, 7.5, false);
  drawText(data.electricalEngineerPTR || "PTR-ST-2026-4412", 120, 458.0, 7.5, false);

  // Electrical Inspector: on underline
  const inspector = data.cfeiInspectorName || "Engr. GILBERT B. CRUZ, Electrical Inspector";
  drawText(inspector.toUpperCase(), 120, 201.0, 8.5, true);

  return await doc.saveAsBase64({ dataUri: false });
}

