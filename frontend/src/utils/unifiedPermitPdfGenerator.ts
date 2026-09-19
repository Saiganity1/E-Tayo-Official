import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { ProjectTypeItem, PERMIT_FORM_METADATA, PermitFormMatrix } from "../data/projectTypeMatrix";

export interface UnifiedPermitFormData {
  applicationNo: string;
  locationalClearanceRef: string;
  projectType: ProjectTypeItem;

  // Applicant details (Box 1)
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  applicantAddress: string;
  applicantTIN?: string;
  formOfOwnership?: string;
  govIdNo?: string;

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
  architectPRC?: string;
  architectPRCValidity?: string;
  architectIAPOA?: string;
  architectPTR?: string;
  architectPTRIssued?: string;
  architectTIN?: string;

  civilEngineerName?: string;
  civilEngineerPRC?: string;
  civilEngineerPRCValidity?: string;
  civilEngineerPICE?: string;
  civilEngineerPTR?: string;
  civilEngineerPTRIssued?: string;
  civilEngineerTIN?: string;

  electricalEngineerName?: string;
  electricalEngineerPRC?: string;
  electricalEngineerPRCValidity?: string;
  electricalEngineerIIEE?: string;
  electricalEngineerPTR?: string;
  electricalEngineerPTRIssued?: string;
  electricalEngineerTIN?: string;

  masterPlumberName?: string;
  masterPlumberPRC?: string;
  masterPlumberPRCValidity?: string;
  masterPlumberNAMPAP?: string;
  masterPlumberPTR?: string;
  masterPlumberPTRIssued?: string;
  masterPlumberTIN?: string;

  mechanicalEngineerName?: string;
  mechanicalEngineerPRC?: string;
  mechanicalEngineerPRCValidity?: string;
  mechanicalEngineerPSME?: string;
  mechanicalEngineerPTR?: string;
  mechanicalEngineerPTRIssued?: string;
  mechanicalEngineerTIN?: string;

  electronicsEngineerName?: string;
  electronicsEngineerPRC?: string;
  electronicsEngineerPRCValidity?: string;
  electronicsEngineerIECEP?: string;
  electronicsEngineerPTR?: string;
  electronicsEngineerPTRIssued?: string;
  electronicsEngineerTIN?: string;

  // Active form checkboxes selected
  activePermitForms?: (keyof PermitFormMatrix)[];
  submissionDate?: string;
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

function parseApplicantName(name: string | undefined | null): { lastName: string; firstName: string; mi: string } {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { lastName: "PAYUMO", firstName: "PAUL", mi: "N/A" };
  if (parts.length === 1) return { lastName: parts[0].toUpperCase(), firstName: "", mi: "N/A" };
  if (parts.length === 2) return { lastName: parts[1].toUpperCase(), firstName: parts[0].toUpperCase(), mi: "N/A" };
  return {
    firstName: parts.slice(0, -1).join(" ").toUpperCase(),
    lastName: parts[parts.length - 1].toUpperCase(),
    mi: parts[1] ? parts[1][0].toUpperCase() + "." : "N/A",
  };
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

/**
 * 1. OFFICIAL UNIFIED BUILDING PERMIT (NBC FORM B-01)
 */
export async function generateBuildingPermitPdf(data: UnifiedPermitFormData): Promise<string> {
  const bytes = await fetchTemplateBytes("/templates/UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf");
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
  drawText(data.applicationNo || "APP-2026-6636", 115, 788, 9, true);
  if (data.locationalClearanceRef) drawCheck(226.5, 801);
  drawCheck(346.5, 801); // Fire safety clearance also applied

  // Box 1: Owner
  const { lastName, firstName, mi } = parseApplicantName(data.applicantName);
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

  // Box 4: Use / Occupancy
  const cat = data.projectType?.category || "Residential";
  if (cat === "Commercial") drawCheck(225, 565.0);
  else if (cat === "Industrial") drawCheck(223, 509.0);
  else if (cat === "Institutional") drawCheck(53, 459.0);
  else {
    drawCheck(34, 577.5); // Group A Residential
    drawCheck(46.5, 569.5); // Single family dwelling
  }

  // Box 5: Physical Specs & Cost Breakdown
  const occName = (data.projectType?.name || "Single-Detached House").toUpperCase();
  drawText(occName, 115, 426.0, 7.5, true, 24);

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
  drawText("Sto. Tomas, Pampanga", 365, 338.0, 7.5, false);
  drawText(data.civilEngineerPRC || data.architectPRC || "0078923", 355, 303.5, 7.5, false);
  // Shift right to sit cleanly on underline after "Validity" label
  drawText(data.civilEngineerPRCValidity || data.architectPRCValidity || "2028-12-31", 492, 303.5, 7.5, false);
  drawText(data.civilEngineerPTR || "PTR-ST-2026-001", 355, 291.5, 7.5, false);
  // Extract date only (strip municipality prefix if present) and place after "Date Issued" label
  const rawPtrDate = data.civilEngineerPTRIssued || "Jan 05, 2026";
  const ptrDate = rawPtrDate.includes("/") ? rawPtrDate.split("/")[1].trim() : rawPtrDate;
  drawText(ptrDate, 510, 291.5, 7.5, false);
  drawText("Sto. Tomas", 360, 279.5, 7.5, false);
  // Shift right after "TIN" label
  drawText(data.civilEngineerTIN || "123-456-789-000", 475, 279.5, 7.5, false);

  // Box 3: Owner Signature
  drawText((data.applicantName || "PAUL PAYUMO").toUpperCase(), 100, 232.0, 8.5, true);
  // Shift right after "Date" label
  drawText(data.submissionDate || "Sep 17, 2026", 255, 228.0, 7.5, false);
  drawText(data.projectAddress || data.applicantAddress || "Sto. Tomas, Pampanga", 72, 208.0, 7.5, false, 35);
  // Shift right after "Gov't Issued ID No." label
  drawText(data.govIdNo || "CTC-2026-00192", 105, 194.0, 7.5, false);

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

  // Header
  drawText(data.applicationNo || "APP-2026-6636", 105, 797.0, 8.5, true);

  // Box 1
  const { lastName, firstName, mi } = parseApplicantName(data.applicantName);
  drawText(lastName, 160, 735.0, 8.5, true, 20);
  drawText(firstName, 280, 735.0, 8.5, true, 22);
  drawText(mi, 428, 735.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 472, 735.0, 8, false);
  drawText(data.formOfOwnership || "INDIVIDUAL", 235, 708.0, 8, false, 25);
  drawText((data.projectType?.category || "Residential").toUpperCase(), 405, 708.0, 8, false, 25);

  // Address
  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 80, 683.5, 7.5, false, 22);
  drawText(data.barangay || "Sapa (Santo Nino)", 195, 683.5, 7.5, false, 16);
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

  // Box 2: Site Occupancy & Fire Safety
  drawText(data.buildingFootprint || "60", 188, 442, 7.5, true);
  drawText("20", 188, 430, 7.5, false); // Impervious
  drawText("20", 188, 418, 7.5, false); // Unpaved
  drawCheck(203, 442); // Exit Doors
  drawCheck(312, 430); // Fire fighting
  drawCheck(312, 418); // Smoke detectors
  drawCheck(312, 404); // Emergency lights

  // Box 3: Architect
  const archName = data.architectName || "Arch. Maria Santos, UAP";
  drawText(archName.toUpperCase(), 100, 300.0, 8.5, true);
  drawText("Sto. Tomas, Pampanga", 75, 258.0, 7.5, false);
  drawText(data.architectIAPOA || "IAPOA-2026-091", 75, 240.0, 7.5, false);
  drawText(data.architectPRC || "PRC-0045211", 75, 228.0, 7.5, false);
  drawText(data.architectPRCValidity || "2028-12-31", 215, 228.0, 7.5, false);
  drawText(data.architectPTR || "PTR-ST-2026-004", 75, 216.0, 7.5, false);
  drawText(data.architectPTRIssued || "Jan 05, 2026", 215, 216.0, 7.5, false);
  drawText("Sto. Tomas", 75, 198.0, 7.5, false);
  drawText(data.architectTIN || "123-456-789-000", 205, 198.0, 7.5, false);

  // Box 5: Owner
  drawText((data.applicantName || "PAUL PAYUMO").toUpperCase(), 100, 112.0, 8.5, true);
  drawText(data.projectAddress || data.applicantAddress || "Sto. Tomas, Pampanga", 75, 60.0, 7.5, false);
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
  const { lastName, firstName, mi } = parseApplicantName(data.applicantName);
  drawText(lastName, 160, 641.0, 8.5, true, 20);
  drawText(firstName, 275, 641.0, 8.5, true, 22);
  drawText(mi, 422, 641.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 472, 641.0, 8, false);
  drawText(data.formOfOwnership || "INDIVIDUAL", 220, 615.0, 8, false, 25);
  drawText((data.projectType?.category || "Residential").toUpperCase(), 380, 615.0, 8, false, 25);

  // Address
  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 80, 587.0, 7.5, false, 22);
  drawText(data.barangay || "Sapa (Santo Nino)", 195, 587.0, 7.5, false, 16);
  drawText("Sto. Tomas, Pampanga", 295, 587.0, 7.5, false, 18);
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

  // Box 2: Nature of Civil/Structural Works
  drawCheck(55, 372.0); // Foundation
  drawCheck(195, 415.0); // Concrete Framing
  drawCheck(195, 372.0); // Slabs
  drawCheck(195, 360.0); // Walls

  // Box 3: Civil Engineer
  const ceName = data.civilEngineerName || "Engr. Roberto Cruz, CE";
  drawText(ceName.toUpperCase(), 95, 255.0, 8.5, true);
  drawText("Sto. Tomas, Pampanga", 75, 222.0, 7.5, false);
  drawText(data.civilEngineerPRC || "PRC-0078923", 75, 205.0, 7.5, false);
  drawText(data.civilEngineerPRCValidity || "2028-12-31", 195, 205.0, 7.5, false);
  drawText(data.civilEngineerPTR || "PTR-ST-2026-001", 75, 192.0, 7.5, false);
  drawText(data.civilEngineerPTRIssued || "Jan 05, 2026", 195, 192.0, 7.5, false);
  drawText("Sto. Tomas", 75, 178.0, 7.5, false);
  drawText(data.civilEngineerTIN || "123-456-789-000", 185, 178.0, 7.5, false);

  // Box 5: Owner
  drawText((data.applicantName || "PAUL PAYUMO").toUpperCase(), 95, 96.0, 8.5, true);
  drawText(data.projectAddress || data.applicantAddress || "Sto. Tomas, Pampanga", 75, 62.0, 7.5, false);
  drawText(data.govIdNo || "CTC-2026-00192", 75, 48.0, 7.5, false);

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

  // Header
  drawText(data.applicationNo || "APP-2026-6636", 50, 760.0, 8.5, true);
  drawText(data.submissionDate || "Sep 17, 2026", 425, 760.0, 8, false);
  drawText(data.proposedStartDate || "Sep 17, 2026", 50, 741.0, 7.5, false);
  drawText(data.expectedCompletionDate || "WITHIN 180 DAYS", 425, 741.0, 7.5, false);

  // Box 1
  const { lastName, firstName, mi } = parseApplicantName(data.applicantName);
  drawText(lastName, 175, 704.0, 8.5, true, 18);
  drawText(firstName, 255, 704.0, 8.5, true, 20);
  drawText(mi, 345, 704.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 425, 704.0, 8, false);

  // Address
  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 45, 676.0, 7.5, false, 28);
  drawText(data.barangay || "Sapa (Santo Nino)", 250, 676.0, 7.5, false, 15);
  drawText("Sto. Tomas, Pampanga", 335, 676.0, 7.5, false, 18);
  drawText(data.applicantPhone || "0917-123-4567", 425, 676.0, 7.5, true);

  // Location of installation
  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 100, 648.0, 7.5, false, 28);
  drawText(data.barangay || "Sapa (Santo Nino)", 330, 648.0, 7.5, true, 18);
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
  drawText(data.electricalEngineerPTRIssued || "Jan 05, 2026", 200, 438.0, 7.5, false);
  drawText("Sto. Tomas", 375, 438.0, 7.5, false);
  drawText(peeName.toUpperCase(), 45, 412.0, 8.5, true);
  drawText(data.electricalEngineerTIN || "334-219-880-000", 375, 412.0, 7.5, false);

  // Box 5: Owner
  drawText((data.applicantName || "PAUL PAYUMO").toUpperCase(), 45, 145.0, 8.5, true);
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

  // Header
  drawText1(data.applicationNo || "APP-2026-6636", 95, 828.0, 8.5, true);
  drawText1(data.submissionDate || "Sep 17, 2026", 100, 792.0, 8, false);

  // Box 1
  const { lastName, firstName, mi } = parseApplicantName(data.applicantName);
  drawText1(lastName, 170, 735.0, 8.5, true, 20);
  drawText1(firstName, 260, 735.0, 8.5, true, 22);
  drawText1(mi, 380, 735.0, 8, true);
  drawText1(data.applicantTIN || "000-123-456-000", 475, 735.0, 8, false);

  // Address
  drawText1(data.projectAddress || "Lawasn St., Blue Diamond", 45, 713.0, 7.5, false, 28);
  drawText1(data.barangay || "Sapa (Santo Nino)", 260, 713.0, 7.5, false, 15);
  drawText1("Sto. Tomas, Pampanga", 360, 713.0, 7.5, false, 18);
  drawText1(data.applicantPhone || "0917-123-4567", 475, 713.0, 7.5, true);

  // Project Location (2nd Address line)
  drawText1(data.projectAddress || "Lawasn St., Blue Diamond", 45, 691.5, 7.5, false, 28);
  drawText1(data.barangay || "Sapa (Santo Nino)", 260, 691.5, 7.5, true, 18);
  drawText1("Sto. Tomas, Pampanga", 360, 691.5, 7.5, true, 20);

  // Scope & Occupancy
  drawCheck1(40, 666.0); // [X] New Installation
  drawCheck1(40, 624.0); // [X] Residential

  // Fixtures
  drawText1(data.waterClosetsCount || "3", 35, 528.0, 7.5, true);
  drawCheck1(80, 528.0);
  drawText1(data.floorDrainsCount || "3", 35, 516.0, 7.5, true);
  drawCheck1(80, 516.0);
  drawText1(data.lavatoriesCount || "3", 35, 504.0, 7.5, true);
  drawCheck1(80, 504.0);
  drawText1(data.kitchenSinksCount || "1", 35, 492.0, 7.5, true);
  drawCheck1(80, 492.0);
  drawText1(data.faucetsCount || "4", 35, 480.0, 7.5, true);
  drawCheck1(80, 480.0);
  drawText1(data.showersCount || "2", 35, 468.0, 7.5, true);
  drawCheck1(80, 468.0);

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
  const { lastName, firstName, mi } = parseApplicantName(data.applicantName);
  drawText(lastName, 166, 663.0, 8.5, true, 20);
  drawText(firstName, 256, 663.0, 8.5, true, 20);
  drawText(mi, 355, 663.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 433, 663.0, 8, false);

  // Form of Ownership & Occupancy
  drawText(data.formOfOwnership || "INDIVIDUAL", 230, 635.0, 8, false, 25);
  drawText((data.projectType?.category || "Residential").toUpperCase(), 468, 635.0, 8, false, 25);

  // Address
  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 200, 612.0, 7.5, false, 35);
  drawText(data.applicantPhone || "0917-123-4567", 465, 612.0, 7.5, true);
  drawText(data.barangay || "Sapa (Santo Nino)", 80, 592.0, 7.5, false, 20);
  drawText("Sto. Tomas, Pampanga", 280, 592.0, 7.5, false, 25);

  // Location of installation
  drawText(data.lotNo || "Lot 12", 195, 566.0, 7.5, true);
  drawText(data.blockNo || "Blk 4", 295, 566.0, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 390, 566.0, 7.5, true, 14);
  drawText(data.taxDecNo || "TD-2026-0012", 515, 566.0, 7.5, false);

  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 70, 548.0, 7.5, false, 22);
  drawText(data.barangay || "Sapa (Santo Nino)", 245, 548.0, 7.5, true, 20);
  drawText("Sto. Tomas, Pampanga", 460, 548.0, 7.5, true, 22);

  // Scope of work
  drawCheck(52, 538.0); // New Construction

  // Box 2: Installation and Operation
  drawCheck(34, 432.0); // Packaged / Split type aircon
  drawCheck(215, 468.0); // Mechanical ventilation
  drawCheck(354, 468.0); // Pumps

  // Box 3: Professional Mechanical Engineer
  const pmeName = data.mechanicalEngineerName || "Engr. Ricardo Gomez, PME";
  drawText(pmeName.toUpperCase(), 60, 325.0, 8.5, true);
  drawText("Sto. Tomas, Pampanga", 50, 298.0, 7.5, false);
  drawText(data.mechanicalEngineerPRC || "PRC-0055123", 50, 278.0, 7.5, false);
  drawText(data.mechanicalEngineerPRCValidity || "2028-12-31", 175, 278.0, 7.5, false);
  drawText(data.mechanicalEngineerPTR || "PTR-ST-2026-7789", 50, 258.0, 7.5, false);
  drawText(data.mechanicalEngineerPTRIssued || "Jan 05, 2026", 175, 258.0, 7.5, false);
  drawText(data.mechanicalEngineerTIN || "112-445-889-000", 50, 238.0, 7.5, false);

  // Box 5: Owner
  drawText((data.applicantName || "PAUL PAYUMO").toUpperCase(), 60, 110.0, 8.5, true);
  drawText(data.projectAddress || data.applicantAddress || "Sto. Tomas, Pampanga", 50, 65.0, 7.5, false);
  drawText(data.govIdNo || "CTC-2026-00192", 50, 48.0, 7.5, false);

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

  // Box 1: Owner Row (Top row in template)
  const { lastName, firstName, mi } = parseApplicantName(data.applicantName);
  drawText(lastName, 160, 662.0, 8.5, true, 20);
  drawText(firstName, 270, 662.0, 8.5, true, 20);
  drawText(mi, 395, 662.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 440, 662.0, 8, false);

  // Form of Ownership & Character of Occupancy
  drawText(data.formOfOwnership || "INDIVIDUAL", 220, 638.0, 8, false, 25);
  drawText((data.projectType?.category || "Residential").toUpperCase(), 420, 638.0, 8, false, 25);

  // Address
  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 85, 616.0, 7.5, false, 22);
  drawText(data.barangay || "Sapa (Santo Nino)", 200, 616.0, 7.5, false, 15);
  drawText("Sto. Tomas, Pampanga", 290, 616.0, 7.5, false, 18);
  drawText("2020", 380, 616.0, 7.5, false);
  drawText(data.applicantPhone || "0917-123-4567", 425, 616.0, 7.5, true);

  // Location of Construction
  drawText(data.lotNo || "Lot 12", 155, 586.0, 7.5, true);
  drawText(data.blockNo || "Blk 4", 235, 586.0, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 325, 586.0, 7.5, true, 16);
  drawText(data.taxDecNo || "TD-2026-0012", 450, 586.0, 7.5, false);

  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 65, 568.0, 7.5, false, 24);
  drawText(data.barangay || "Sapa (Santo Nino)", 230, 568.0, 7.5, true, 18);
  drawText("Sto. Tomas, Pampanga", 420, 568.0, 7.5, true, 20);

  // Scope: [X] New Installation
  drawCheck(56, 530.0);

  // Box 2: Nature of Works (Telecom, Security/Alarm, CCTV, FDAS)
  drawCheck(46, 442.0); // Telecommunication
  drawCheck(46, 386.0); // Security & Alarm
  drawCheck(205, 442.0); // Electronics & Alarm
  drawCheck(380, 386.0); // Building wiring / fiber optic

  // Box 3: Professional Electronics Engineer
  const peceName = data.electronicsEngineerName || "Engr. Fernando Ramos, PECE";
  drawText(peceName.toUpperCase(), 60, 290.0, 8.5, true);
  drawText(data.submissionDate || "Sep 17, 2026", 210, 290.0, 7.5, false);
  drawText("Sto. Tomas, Pampanga", 60, 260.0, 7.5, false);
  drawText(data.electronicsEngineerPRC || "PRC-0022891", 60, 242.0, 7.5, false);
  drawText(data.electronicsEngineerPRCValidity || "2028-12-31", 175, 242.0, 7.5, false);
  drawText(data.electronicsEngineerPTR || "PTR-ST-2026-9045", 60, 226.0, 7.5, false);
  drawText(data.electronicsEngineerPTRIssued || "Jan 05, 2026", 175, 226.0, 7.5, false);
  drawText("Sto. Tomas", 60, 208.0, 7.5, false);
  drawText(data.electronicsEngineerTIN || "228-910-334-000", 175, 208.0, 7.5, false);

  // Box 5: Owner
  drawText((data.applicantName || "PAUL PAYUMO").toUpperCase(), 60, 98.0, 8.5, true);
  drawText("Sto. Tomas, Pampanga", 60, 60.0, 7.5, false);
  drawText(data.govIdNo || "CTC-2026-00192", 60, 44.0, 7.5, false);

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

  // Header
  drawText(data.applicationNo || "APP-2026-6636", 55, 680.0, 8.5, true);
  drawText(data.submissionDate || "Sep 17, 2026", 430, 680.0, 8, false);

  // Box 1
  const { lastName, firstName, mi } = parseApplicantName(data.applicantName);
  drawText(lastName, 160, 622.0, 8.5, true, 20);
  drawText(firstName, 260, 622.0, 8.5, true, 22);
  drawText(mi, 370, 622.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 440, 622.0, 8, false);
  drawText(data.formOfOwnership || "INDIVIDUAL", 210, 595.0, 8, false, 25);
  drawText((data.projectType?.category || "Residential").toUpperCase(), 380, 595.0, 8, false, 25);

  // Address
  drawText(data.projectAddress || data.applicantAddress || "Lawasn St., Blue Diamond", 80, 569.0, 7.5, false, 28);
  drawText(data.barangay || "Sapa (Santo Nino)", 250, 569.0, 7.5, false, 16);
  drawText(data.applicantPhone || "0917-123-4567", 440, 569.0, 7.5, true);

  // Location of Demolition
  drawText(data.lotNo || "Lot 12", 160, 542.0, 7.5, true);
  drawText(data.blockNo || "Blk 4", 240, 542.0, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 320, 542.0, 7.5, true, 16);
  drawText(data.taxDecNo || "TD-2026-0012", 440, 542.0, 7.5, false);

  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 80, 523.0, 7.5, false, 24);
  drawText(data.barangay || "Sapa (Santo Nino)", 240, 523.0, 7.5, true, 20);

  // Box 2: Demolition Details
  const bldgType = data.demolitionBuildingType || data.projectType?.name || "Single-Detached Two-Storey Residential Structure";
  drawText(bldgType, 160, 480.0, 8, true, 45);
  drawText(`${data.demolitionArea || data.floorArea || "180.00"} sq.m.`, 160, 460.0, 8, true);
  drawText(data.demolitionStoreys || data.proposedStoreys || "2", 360, 460.0, 8, true);
  drawText(data.proposedStartDate || "Oct 01, 2026", 160, 440.0, 7.5, false);
  drawText(data.expectedCompletionDate || "Nov 15, 2026", 360, 440.0, 7.5, false);

  // Box 3: Engineer
  const ceName = data.civilEngineerName || "Engr. Roberto Cruz, CE";
  drawText(ceName.toUpperCase(), 100, 360.0, 8.5, true);
  drawText(data.civilEngineerPRC || "PRC-0078923", 80, 335.0, 7.5, false);
  drawText(data.civilEngineerPTR || "PTR-ST-2026-001", 80, 320.0, 7.5, false);

  // Box 4: Applicant
  drawText((data.applicantName || "PAUL PAYUMO").toUpperCase(), 100, 235.0, 8.5, true);
  drawText(data.govIdNo || "CTC-2026-00192", 80, 205.0, 7.5, false);

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

  // Header
  drawText(data.applicationNo || "APP-2026-6636", 55, 680.0, 8.5, true);
  drawText(data.submissionDate || "Sep 17, 2026", 430, 680.0, 8, false);

  // Box 1
  const { lastName, firstName, mi } = parseApplicantName(data.applicantName);
  drawText(lastName, 160, 622.0, 8.5, true, 20);
  drawText(firstName, 260, 622.0, 8.5, true, 22);
  drawText(mi, 370, 622.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 440, 622.0, 8, false);
  drawText(data.formOfOwnership || "INDIVIDUAL", 210, 595.0, 8, false, 25);
  drawText((data.projectType?.category || "Residential").toUpperCase(), 380, 595.0, 8, false, 25);

  // Address
  drawText(data.projectAddress || data.applicantAddress || "Lawasn St., Blue Diamond", 80, 569.0, 7.5, false, 28);
  drawText(data.barangay || "Sapa (Santo Nino)", 250, 569.0, 7.5, false, 16);
  drawText(data.applicantPhone || "0917-123-4567", 440, 569.0, 7.5, true);

  // Location of Fencing
  drawText(data.lotNo || "Lot 12", 160, 542.0, 7.5, true);
  drawText(data.blockNo || "Blk 4", 240, 542.0, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 320, 542.0, 7.5, true, 16);
  drawText(data.taxDecNo || "TD-2026-0012", 440, 542.0, 7.5, false);

  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 80, 523.0, 7.5, false, 24);
  drawText(data.barangay || "Sapa (Santo Nino)", 240, 523.0, 7.5, true, 20);

  // Box 2: Fencing Specifications
  const fenceType = data.fencingType || "Reinforced Concrete / CHB with Decorative Steel Grills";
  drawText(fenceType, 160, 465.0, 8, true, 48);
  drawText(`${data.fencingLength || "45.00"} METERS`, 160, 445.0, 8, true);
  drawText(`${data.fencingHeight || "2.20"} METERS`, 360, 445.0, 8, true);
  drawText(`PHP ${data.fencingCost || "150,000.00"}`, 160, 428.0, 8, true);
  drawText(data.proposedStartDate || "Oct 01, 2026", 160, 410.0, 7.5, false);
  drawText(data.expectedCompletionDate || "Nov 15, 2026", 360, 410.0, 7.5, false);

  // Box 3: Architect / Civil Engineer
  const archName = data.architectName || "Arch. Maria Santos, UAP";
  drawText(archName.toUpperCase(), 100, 360.0, 8.5, true);
  drawText(data.architectPRC || "PRC-0045211", 80, 335.0, 7.5, false);
  drawText(data.architectPTR || "PTR-ST-2026-004", 80, 320.0, 7.5, false);

  // Box 4: Applicant Signature
  drawText((data.applicantName || "PAUL PAYUMO").toUpperCase(), 100, 235.0, 8.5, true);
  drawText(data.govIdNo || "CTC-2026-00192", 80, 205.0, 7.5, false);

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

  // Header
  drawText(data.applicationNo || "APP-2026-6636", 55, 660.0, 8.5, true);
  drawText(data.submissionDate || "Sep 17, 2026", 430, 660.0, 8, false);

  // Box 1
  const { lastName, firstName, mi } = parseApplicantName(data.applicantName);
  drawText(lastName, 160, 602.0, 8.5, true, 20);
  drawText(firstName, 260, 602.0, 8.5, true, 22);
  drawText(mi, 370, 602.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 450, 602.0, 8, false);
  drawText(data.formOfOwnership || "INDIVIDUAL", 210, 575.0, 8, false, 25);
  drawText((data.projectType?.category || "Residential").toUpperCase(), 380, 575.0, 8, false, 25);

  // Address
  drawText(data.projectAddress || data.applicantAddress || "Lawasn St., Blue Diamond", 80, 546.0, 7.5, false, 28);
  drawText(data.barangay || "Sapa (Santo Nino)", 80, 528.0, 7.5, false, 20);
  drawText(data.applicantPhone || "0917-123-4567", 450, 546.0, 7.5, true);

  // Location
  drawText(data.lotNo || "Lot 12", 160, 514.0, 7.5, true);
  drawText(data.blockNo || "Blk 4", 240, 514.0, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 320, 514.0, 7.5, true, 16);

  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 80, 496.0, 7.5, false, 24);
  drawText(data.barangay || "Sapa (Santo Nino)", 240, 496.0, 7.5, true, 20);

  // Box 2: Excavation Specifications
  const excScope = data.excavationScope || "Foundation Excavation, Site Grading & Ground Levelling";
  drawText(excScope, 160, 460.0, 8, true, 48);
  drawText(`${data.excavationVolume || "120.00"} CU. M.`, 160, 440.0, 8, true);
  drawText(`${data.excavationDepth || "2.50"} METERS`, 360, 440.0, 8, true);
  drawText(`PHP ${data.projectCost || "85,000.00"}`, 160, 420.0, 8, true);
  drawText(data.proposedStartDate || "Oct 01, 2026", 160, 400.0, 7.5, false);
  drawText(data.expectedCompletionDate || "Nov 15, 2026", 360, 400.0, 7.5, false);

  // Box 3: Civil Engineer
  const ceName = data.civilEngineerName || "Engr. Roberto Cruz, CE";
  drawText(ceName.toUpperCase(), 100, 275.0, 8.5, true);
  drawText(data.civilEngineerPRC || "PRC-0078923", 80, 245.0, 7.5, false);
  drawText(data.civilEngineerPTR || "PTR-ST-2026-001", 80, 232.0, 7.5, false);

  // Box 4: Building Owner Signature
  drawText((data.applicantName || "PAUL PAYUMO").toUpperCase(), 100, 125.0, 8.5, true);
  drawText(data.govIdNo || "CTC-2026-00192", 80, 80.0, 7.5, false);

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

  // Header
  drawText(data.applicationNo || "APP-2026-6636", 55, 785.0, 8.5, true);
  drawText(data.submissionDate || "Sep 17, 2026", 440, 785.0, 8, false);

  // Box 1
  const { lastName, firstName, mi } = parseApplicantName(data.applicantName);
  drawText(lastName, 160, 728.0, 8.5, true, 20);
  drawText(firstName, 260, 728.0, 8.5, true, 22);
  drawText(mi, 370, 728.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 460, 728.0, 8, false);
  drawText(data.formOfOwnership || "INDIVIDUAL / ENTERPRISE", 210, 700.0, 8, false, 25);
  drawText((data.projectType?.category || "Commercial / Business").toUpperCase(), 380, 700.0, 8, false, 25);

  // Address
  drawText(data.projectAddress || data.applicantAddress || "Lawasn St., Blue Diamond", 80, 672.0, 7.5, false, 28);
  drawText(data.barangay || "Sapa (Santo Nino)", 240, 672.0, 7.5, false, 18);
  drawText(data.applicantPhone || "0917-123-4567", 460, 672.0, 7.5, true);

  // Location of Sign
  drawText(data.lotNo || "Lot 12", 160, 643.0, 7.5, true);
  drawText(data.blockNo || "Blk 4", 240, 643.0, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 320, 643.0, 7.5, true, 16);

  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 80, 613.0, 7.5, false, 24);
  drawText(data.barangay || "Sapa (Santo Nino)", 240, 613.0, 7.5, true, 20);

  // Box 2: Sign Details
  const sType = data.signType || "Business Sign, Wall Type (Illuminated LED)";
  drawText(sType, 160, 528.0, 8, true, 48);
  drawText(data.signDimensions || "3.00m Width x 1.50m Height (Area: 4.50 sq.m.)", 160, 498.0, 8, true, 48);
  drawText(data.signMaterial || "Acrylic Face with LED Backlight on Steel Framing", 160, 478.0, 8, false, 48);
  drawText(`PHP ${data.signCost || "45,000.00"}`, 160, 458.0, 8, true);
  drawText(data.proposedStartDate || "Oct 01, 2026", 160, 438.0, 7.5, false);
  drawText(data.expectedCompletionDate || "Oct 15, 2026", 360, 438.0, 7.5, false);

  // Box 3: Architect / Structural Engineer
  const archName = data.architectName || "Arch. Maria Santos, UAP";
  drawText(archName.toUpperCase(), 100, 280.0, 8.5, true);
  drawText(data.architectPRC || "PRC-0045211", 80, 255.0, 7.5, false);
  drawText(data.architectPTR || "PTR-ST-2026-004", 80, 240.0, 7.5, false);

  // Box 5: Applicant Signature
  drawText((data.applicantName || "PAUL PAYUMO").toUpperCase(), 100, 195.0, 8.5, true);
  drawText(data.govIdNo || "CTC-2026-00192", 80, 168.0, 7.5, false);

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

  // Header
  drawText(data.applicationNo || "APP-2026-6636", 55, 770.0, 8.5, true);
  drawText(data.submissionDate || "Sep 17, 2026", 440, 770.0, 8, false);

  // Box 1
  const { lastName, firstName, mi } = parseApplicantName(data.applicantName);
  drawText(lastName, 160, 747.0, 8.5, true, 20);
  drawText(firstName, 260, 747.0, 8.5, true, 22);
  drawText(mi, 370, 747.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 450, 747.0, 8, false);
  drawText(data.formOfOwnership || "INDIVIDUAL", 210, 704.0, 8, false, 25);
  drawText((data.projectType?.category || "Residential").toUpperCase(), 380, 704.0, 8, false, 25);

  // Address
  drawText(data.projectAddress || data.applicantAddress || "Lawasn St., Blue Diamond", 80, 671.0, 7.5, false, 28);
  drawText(data.barangay || "Sapa (Santo Nino)", 240, 671.0, 7.5, false, 18);
  drawText(data.applicantPhone || "0917-123-4567", 450, 671.0, 7.5, true);

  // Location
  drawText(data.lotNo || "Lot 12", 160, 629.0, 7.5, true);
  drawText(data.blockNo || "Blk 4", 240, 629.0, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 320, 629.0, 7.5, true, 16);

  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 80, 609.0, 7.5, false, 24);
  drawText(data.barangay || "Sapa (Santo Nino)", 240, 609.0, 7.5, true, 20);

  // Box 2: Temporary Service Specs
  drawText(data.temporaryServicePurpose || "FOR CONSTRUCTION POWER & TESTING", 160, 577.0, 8, true, 45);
  drawText(`${data.temporaryServiceKva || "15.0"} kVA, ${data.temporaryServiceVoltage || "230V, Single Phase, 60Hz"}`, 160, 548.0, 8, true);
  drawText(`${data.temporaryServiceDuration || "90"} DAYS`, 160, 528.0, 8, true);
  drawText(data.proposedStartDate || "Oct 01, 2026", 160, 508.0, 7.5, false);

  // Box 3: Electrical Engineer
  const peeName = data.electricalEngineerName || "Engr. Danilo Reyes, PEE";
  drawText(peeName.toUpperCase(), 100, 395.0, 8.5, true);
  drawText(data.electricalEngineerPRC || "PRC-0033421", 80, 365.0, 7.5, false);
  drawText(data.electricalEngineerPTR || "PTR-ST-2026-4412", 80, 350.0, 7.5, false);

  // Box 4: Owner Signature
  drawText((data.applicantName || "PAUL PAYUMO").toUpperCase(), 100, 145.0, 8.5, true);
  drawText(data.govIdNo || "CTC-2026-00192", 80, 120.0, 7.5, false);

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

  // Header & References
  drawText(data.applicationNo || "BP-2026-0091", 160, 742.0, 8.5, true);
  drawText(data.submissionDate || "Sep 17, 2026", 440, 742.0, 8, false);

  // Owner details
  drawText((data.applicantName || "PAUL PAYUMO").toUpperCase(), 140, 642.0, 8.5, true);
  drawText(data.applicantAddress || "123 Rizal St., Brgy. Poblacion, Sto. Tomas, Pampanga", 180, 618.0, 7.5, false, 45);

  // Project details
  drawText((data.projectName || "DELA CRUZ TWO-STOREY RESIDENCE").toUpperCase(), 140, 405.0, 8.5, true);
  drawText(`${data.projectAddress || ""}, Brgy. ${data.barangay || "Poblacion"}, Sto. Tomas, Pampanga`, 140, 375.0, 7.5, false, 55);
  drawText((data.occupancyClass || data.projectType?.category || "Group A - Residential").toUpperCase(), 260, 342.0, 8, true);

  // Dates & Costs
  drawText(data.proposedStartDate || "Oct 01, 2026", 140, 312.0, 7.5, false);
  drawText(data.actualCompletionDate || data.expectedCompletionDate || "Apr 30, 2027", 380, 312.0, 7.5, true);
  drawText(`${data.actualFloorArea || data.floorArea || "185.50"} sq.m.`, 140, 282.0, 8, true);
  drawText(`PHP ${data.actualProjectCost || data.projectCost || "2,500,000.00"}`, 380, 282.0, 8, true);

  // Applicant Signature
  drawText((data.applicantName || "PAUL PAYUMO").toUpperCase(), 360, 195.0, 8.5, true);
  drawText(data.govIdNo || "CTC-2026-00192", 360, 172.0, 7.5, false);

  // Engineer Signature
  const supName = data.constructionSupervisorName || data.civilEngineerName || data.architectName || "Engr. Roberto Cruz, CE";
  drawText(supName.toUpperCase(), 360, 85.0, 8.5, true);

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

  // Owner details
  drawText((data.applicantName || "PAUL PAYUMO").toUpperCase(), 140, 690.0, 8.5, true);
  drawText(data.applicantAddress || "Sto. Tomas, Pampanga", 150, 665.0, 7.5, false, 48);

  // Project & Occupancy
  drawText(`${data.projectName || "Residential Building"}, ${data.projectAddress || ""}, Brgy. ${data.barangay || "Poblacion"}`, 150, 642.0, 7.5, false, 55);
  drawText((data.occupancyClass || data.projectType?.category || "Residential").toUpperCase(), 200, 630.0, 8, true);

  // Dates & Floor Area / Cost
  drawText(data.proposedStartDate || "Oct 01, 2026", 120, 572.0, 7.5, false);
  drawText(data.actualCompletionDate || data.expectedCompletionDate || "Apr 30, 2027", 340, 572.0, 7.5, true);
  drawText(`${data.floorArea || "185.50"} SQ. M.`, 140, 542.0, 8, true);
  drawText(`PHP ${data.projectCost || "2,500,000.00"}`, 340, 542.0, 8, true);

  // Full-time supervisor
  const supName = data.constructionSupervisorName || data.civilEngineerName || data.architectName || "Engr. Roberto Cruz, CE";
  drawText(supName.toUpperCase(), 140, 280.0, 8.5, true);

  // Conforme: Owner
  drawText((data.applicantName || "PAUL PAYUMO").toUpperCase(), 140, 170.0, 8.5, true);

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

  // Header & Permit
  drawText(data.applicationNo || "CFEI-2026-0042", 420, 835.0, 8.5, true);

  // Owner
  drawText((data.applicantName || "PAUL PAYUMO").toUpperCase(), 150, 788.0, 8.5, true);
  drawText(data.applicantAddress || "Sto. Tomas, Pampanga", 150, 758.0, 7.5, false, 50);

  // Type of occupancy
  drawText("X", 55, 688.0, 8.5, true); // [X] Residential Dwelling

  // Dates
  drawText(data.proposedStartDate || "Oct 01, 2026", 150, 644.0, 7.5, false);
  drawText(data.actualCompletionDate || data.expectedCompletionDate || "Apr 30, 2027", 420, 644.0, 7.5, true);

  // Load
  const loadSummary = `${data.electricalConnectedLoad || "15.0"} kVA / ${data.electricalVoltage || "230V"}, Single Phase, 60Hz`;
  drawText(loadSummary, 150, 582.0, 8, true);

  // PEE
  const peeName = data.electricalEngineerName || "Engr. Danilo Reyes, PEE";
  drawText(peeName.toUpperCase(), 120, 485.0, 8.5, true);
  drawText(data.electricalEngineerPRC || "PRC-0033421", 320, 485.0, 7.5, false);
  drawText(data.electricalEngineerPTR || "PTR-ST-2026-4412", 120, 458.0, 7.5, false);

  // Electrical Inspector
  const inspector = data.cfeiInspectorName || "Engr. GILBERT B. CRUZ, Electrical Inspector";
  drawText(inspector.toUpperCase(), 120, 205.0, 8.5, true);

  return await doc.saveAsBase64({ dataUri: false });
}

