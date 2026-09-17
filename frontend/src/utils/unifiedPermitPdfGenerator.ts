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
  if (data.locationalClearanceRef) drawCheck(240, 802);
  drawCheck(345, 802); // Fire safety clearance also applied

  // Box 1: Owner
  const { lastName, firstName, mi } = parseApplicantName(data.applicantName);
  drawText(lastName, 42, 735, 8.5, true, 30);
  drawText(firstName, 240, 735, 8.5, true, 20);
  drawText(mi, 360, 735, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 415, 735, 8, false);
  drawText(data.formOfOwnership || "INDIVIDUAL", 200, 712, 8, false, 25);

  // Address
  drawText(data.projectAddress || data.applicantAddress || "Lawasn St., Blue Diamond", 42, 694, 7.5, false, 25);
  drawText(data.barangay || "Sapa (Santo Nino)", 175, 694, 7.5, false, 15);
  drawText("Sto. Tomas, Pampanga", 245, 694, 7.5, false, 20);
  drawText("2020", 345, 694, 7.5, false);
  drawText(data.applicantPhone || "0917-123-4567", 415, 694, 7.5, true);

  // Location of Construction Line 1
  drawText(data.lotNo || "Lot 12", 174, 680, 7.5, true);
  drawText(data.blockNo || "Blk 4", 230, 680, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 295, 680, 7.5, true);
  drawText(data.taxDecNo || "TD-2026-0012", 442, 680, 7.5, false);

  // Location of Construction Line 2 (Street, Barangay, City)
  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 70, 666, 7.5, false, 18);
  drawText(data.barangay || "Sapa (Santo Nino)", 180, 666, 7.5, true, 18);
  drawText("Sto. Tomas, Pampanga", 355, 666, 7.5, true, 20);

  // Box 3: Scope of Work
  const scopeNorm = (data.scopeOfWork || "new construction").toLowerCase();
  if (scopeNorm.includes("erect")) drawCheck(37, 629);
  else if (scopeNorm.includes("add")) drawCheck(37, 617);
  else if (scopeNorm.includes("alter")) drawCheck(37, 604);
  else if (scopeNorm.includes("renov")) drawCheck(168, 642);
  else if (scopeNorm.includes("convert")) drawCheck(168, 629);
  else if (scopeNorm.includes("repair")) drawCheck(168, 617);
  else if (scopeNorm.includes("accessory")) drawCheck(303, 629);
  else drawCheck(37, 642); // Default: New Construction

  // Box 4: Use / Occupancy
  const cat = data.projectType?.category || "Residential";
  if (cat === "Commercial") drawCheck(228, 569);
  else if (cat === "Industrial") drawCheck(226, 513);
  else if (cat === "Institutional") drawCheck(56, 463);
  else drawCheck(37, 581); // Group A Residential

  // Box 5: Physical Specs & Cost Breakdown
  const occName = (data.projectType?.name || "Single-Detached House").toUpperCase();
  drawText(occName, 120, 422, 7.5, true, 22);

  // Format clean project cost number (removing duplicate "PHP" since "P" is pre-printed)
  const cleanCost = String(data.projectCost || "1,500,000.00").replace(/PHP/gi, "").trim();
  drawText(cleanCost, 370, 422, 8, true);

  drawText(data.numberOfUnits || "1", 135, 412, 7.5, false);
  drawText(data.costBuilding ? String(data.costBuilding).replace(/PHP/gi, "").trim() : "1,200,000.00", 370, 412, 7.5, false);

  drawText(data.proposedStoreys || "2", 135, 402, 7.5, false);
  drawText(data.costElectrical ? String(data.costElectrical).replace(/PHP/gi, "").trim() : "150,000.00", 370, 402, 7.5, false);

  drawText(data.floorArea || "120", 135, 392, 7.5, true);
  drawText(data.costMechanical ? String(data.costMechanical).replace(/PHP/gi, "").trim() : "50,000.00", 370, 392, 7.5, false);

  drawText(data.lotArea || "200", 135, 382, 7.5, true);
  drawText(data.costElectronics ? String(data.costElectronics).replace(/PHP/gi, "").trim() : "50,000.00", 370, 382, 7.5, false);
  drawText(data.costPlumbing ? String(data.costPlumbing).replace(/PHP/gi, "").trim() : "50,000.00", 370, 372, 7.5, false);

  const constDate = data.proposedStartDate || data.submissionDate || "Sep 17, 2026";
  drawText(constDate, 145, 362, 7.5, false);
  drawText(data.expectedCompletionDate || "WITHIN 180 DAYS", 330, 362, 7.5, false);

  // Box 2: Full-Time Inspector / Supervisor
  const leadEngr = data.civilEngineerName || data.architectName || "Engr. Roberto Cruz, CE";
  drawText(leadEngr.toUpperCase(), 90, 323, 8.5, true);
  drawText("Sto. Tomas, Pampanga", 345, 340, 7.5, false);
  drawText(data.civilEngineerPRC || data.architectPRC || "PRC-0078923", 345, 316, 7.5, false);
  drawText(data.civilEngineerPRCValidity || data.architectPRCValidity || "2028-12-31", 445, 316, 7.5, false);
  drawText(data.civilEngineerPTR || "PTR-ST-2026-001", 345, 304, 7.5, false);
  drawText(data.civilEngineerPTRIssued || "Jan 05, 2026", 445, 304, 7.5, false);
  drawText("Sto. Tomas", 345, 292, 7.5, false);
  drawText(data.civilEngineerTIN || "123-456-789-000", 445, 292, 7.5, false);

  // Box 4: Owner Signature
  drawText((data.applicantName || "PAUL PAYUMO").toUpperCase(), 80, 240, 8.5, true);
  drawText(data.projectAddress || data.applicantAddress || "Sto. Tomas, Pampanga", 80, 212, 7.5, false);

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
  drawText(data.applicationNo || "APP-2026-6636", 115, 788, 8.5, true);

  // Box 1
  const { lastName, firstName, mi } = parseApplicantName(data.applicantName);
  drawText(lastName, 42, 735, 8.5, true, 30);
  drawText(firstName, 240, 735, 8.5, true, 20);
  drawText(mi, 360, 735, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 410, 735, 8, false);
  drawText(data.formOfOwnership || "INDIVIDUAL", 200, 712, 8, false, 25);
  drawText((data.projectType?.category || "Residential").toUpperCase(), 340, 712, 8, false, 25);

  // Address
  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 42, 672, 7.5, false, 25);
  drawText(data.barangay || "Sapa (Santo Nino)", 160, 672, 7.5, false, 15);
  drawText("Sto. Tomas, Pampanga", 240, 672, 7.5, false, 20);
  drawText("2020", 320, 672, 7.5, false);
  drawText(data.applicantPhone || "0917-123-4567", 360, 672, 7.5, true);

  // Location
  drawText(data.lotNo || "Lot 12", 140, 648, 7.5, true);
  drawText(data.blockNo || "Blk 4", 200, 648, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 265, 648, 7.5, true);
  drawText(data.taxDecNo || "TD-2026-0012", 390, 648, 7.5, false);

  // Scope: [X] New Construction
  drawCheck(40, 626);

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
  drawText(archName.toUpperCase(), 90, 302, 8.5, true);
  drawText("Sto. Tomas, Pampanga", 70, 258, 7.5, false);
  drawText(data.architectIAPOA || "IAPOA-2026-091", 70, 239, 7.5, false);
  drawText(data.architectPRC || "PRC-0045211", 70, 225, 7.5, false);
  drawText(data.architectPRCValidity || "2028-12-31", 210, 225, 7.5, false);
  drawText(data.architectPTR || "PTR-ST-2026-004", 70, 211, 7.5, false);
  drawText(data.architectPTRIssued || "Jan 05, 2026", 210, 211, 7.5, false);
  drawText("Sto. Tomas", 70, 197, 7.5, false);
  drawText(data.architectTIN || "123-456-789-000", 210, 197, 7.5, false);

  // Box 5: Owner
  drawText((data.applicantName || "PAUL PAYUMO").toUpperCase(), 80, 122, 8.5, true);
  drawText(data.projectAddress || data.applicantAddress || "Sto. Tomas, Pampanga", 50, 78, 7.5, false);

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
  drawText(data.applicationNo || "APP-2026-6636", 115, 705, 8.5, true);

  // Box 1
  const { lastName, firstName, mi } = parseApplicantName(data.applicantName);
  drawText(lastName, 42, 648, 8.5, true, 30);
  drawText(firstName, 240, 648, 8.5, true, 20);
  drawText(mi, 360, 648, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 410, 648, 8, false);
  drawText(data.formOfOwnership || "INDIVIDUAL", 200, 624, 8, false, 25);
  drawText((data.projectType?.category || "Residential").toUpperCase(), 340, 624, 8, false, 25);

  // Address
  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 42, 582, 7.5, false, 25);
  drawText(data.barangay || "Sapa (Santo Nino)", 160, 582, 7.5, false, 15);
  drawText("Sto. Tomas, Pampanga", 230, 582, 7.5, false, 20);
  drawText("2020", 320, 582, 7.5, false);
  drawText(data.applicantPhone || "0917-123-4567", 360, 582, 7.5, true);

  // Location
  drawText(data.lotNo || "Lot 12", 140, 558, 7.5, true);
  drawText(data.blockNo || "Blk 4", 200, 558, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 265, 558, 7.5, true);
  drawText(data.taxDecNo || "TD-2026-0012", 390, 558, 7.5, false);

  // Scope: [X] New Construction
  drawCheck(39, 512);

  // Box 2: Nature of Civil/Structural Works
  drawCheck(45, 422); // Foundation
  drawCheck(175, 445); // Concrete Framing
  drawCheck(175, 422); // Slabs
  drawCheck(175, 410); // Walls

  // Box 3: Civil Engineer
  const ceName = data.civilEngineerName || "Engr. Roberto Cruz, CE";
  drawText(ceName.toUpperCase(), 80, 205, 8.5, true);
  drawText("Sto. Tomas, Pampanga", 45, 145, 7.5, false);
  drawText(data.civilEngineerPRC || "PRC-0078923", 45, 125, 7.5, false);
  drawText(data.civilEngineerPRCValidity || "2028-12-31", 135, 125, 7.5, false);
  drawText(data.civilEngineerPTR || "PTR-ST-2026-001", 45, 110, 7.5, false);
  drawText(data.civilEngineerPTRIssued || "Jan 05, 2026", 135, 110, 7.5, false);
  drawText("Sto. Tomas", 45, 95, 7.5, false);
  drawText(data.civilEngineerTIN || "123-456-789-000", 135, 95, 7.5, false);

  // Box 5: Owner
  drawText((data.applicantName || "PAUL PAYUMO").toUpperCase(), 80, 120, 8.5, true);
  drawText(data.projectAddress || data.applicantAddress || "Sto. Tomas, Pampanga", 45, 75, 7.5, false);

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
  drawText(data.applicationNo || "APP-2026-6636", 50, 771, 8.5, true);
  drawText(data.submissionDate || "Sep 17, 2026", 410, 771, 8, false);
  drawText(data.proposedStartDate || "Sep 17, 2026", 60, 731, 7.5, false);
  drawText(data.expectedCompletionDate || "WITHIN 180 DAYS", 410, 731, 7.5, false);

  // Box 1
  const { lastName, firstName, mi } = parseApplicantName(data.applicantName);
  drawText(lastName, 50, 691, 8.5, true, 30);
  drawText(firstName, 240, 691, 8.5, true, 20);
  drawText(mi, 360, 691, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 415, 691, 8, false);

  // Address
  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 50, 661, 7.5, false, 25);
  drawText(data.barangay || "Sapa (Santo Nino)", 180, 661, 7.5, false, 15);
  drawText("Sto. Tomas, Pampanga", 280, 661, 7.5, false, 20);
  drawText(data.applicantPhone || "0917-123-4567", 415, 661, 7.5, true);

  // Location of installation
  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 60, 631, 7.5, false, 25);
  drawText(data.barangay || "Sapa (Santo Nino)", 240, 631, 7.5, true, 18);
  drawText("Sto. Tomas, Pampanga", 360, 631, 7.5, true, 20);

  // Scope & Occupancy
  drawCheck(39, 603); // [X] New Installation
  drawCheck(26, 566); // [X] A. Residential Dwelling

  // Number of Outlets
  drawText(data.lightingOutletsCount || "24", 40, 514, 7.5, true);
  drawText(data.convenienceOutletsCount || "18", 40, 504, 7.5, true);
  drawText(data.acuOutletsCount || "3", 40, 494, 7.5, true);
  drawText("1", 175, 514, 7.5, true); // Cooking unit
  drawText(data.waterHeaterOutletsCount || "2", 175, 504, 7.5, true); // Water heater

  // Box 2: Professional Electrical Engineer
  const peeName = data.electricalEngineerName || "Engr. Danilo Reyes, PEE";
  drawText(peeName.toUpperCase(), 50, 456, 8.5, true);
  drawText(data.electricalEngineerPRC || "PRC-0033421", 350, 456, 7.5, false);
  drawText(data.electricalEngineerPRCValidity || "2028-12-31", 455, 456, 7.5, false);
  drawText("Sto. Tomas, Pampanga", 50, 426, 7.5, false);
  drawText("0917-555-4321", 350, 426, 7.5, false);
  drawText(data.electricalEngineerPTR || "PTR-ST-2026-4412", 50, 401, 7.5, false);
  drawText(data.electricalEngineerPTRIssued || "Jan 05, 2026", 200, 401, 7.5, false);
  drawText("Sto. Tomas", 350, 401, 7.5, false);
  drawText(peeName.toUpperCase(), 50, 371, 8.5, true);
  drawText(data.electricalEngineerTIN || "334-219-880-000", 350, 371, 7.5, false);

  // Box 5: Owner
  drawText((data.applicantName || "PAUL PAYUMO").toUpperCase(), 60, 76, 8.5, true);

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
  drawText1(data.applicationNo || "APP-2026-6636", 50, 806, 8.5, true);
  drawText1(data.submissionDate || "Sep 17, 2026", 80, 776, 8, false);

  // Box 1
  const { lastName, firstName, mi } = parseApplicantName(data.applicantName);
  drawText1(lastName, 50, 721, 8.5, true, 30);
  drawText1(firstName, 240, 721, 8.5, true, 20);
  drawText1(mi, 360, 721, 8, true);
  drawText1(data.applicantTIN || "000-123-456-000", 430, 721, 8, false);

  // Address
  drawText1(data.projectAddress || "Lawasn St., Blue Diamond", 50, 691, 7.5, false, 25);
  drawText1(data.barangay || "Sapa (Santo Nino)", 180, 691, 7.5, false, 15);
  drawText1("Sto. Tomas, Pampanga", 280, 691, 7.5, false, 20);
  drawText1(data.applicantPhone || "0917-123-4567", 415, 691, 7.5, true);

  // Project Location (2nd Address line)
  drawText1(data.projectAddress || "Lawasn St., Blue Diamond", 50, 661, 7.5, false, 25);
  drawText1(data.barangay || "Sapa (Santo Nino)", 180, 661, 7.5, true, 18);
  drawText1("Sto. Tomas, Pampanga", 280, 661, 7.5, true, 20);

  // Scope & Occupancy
  drawCheck1(38, 641); // [X] New Installation
  drawCheck1(34, 598); // [X] Residential

  // Fixtures
  drawText1(data.waterClosetsCount || "3", 35, 501, 7.5, true);
  drawCheck1(70, 501);
  drawText1(data.floorDrainsCount || "3", 35, 488, 7.5, true);
  drawCheck1(70, 488);
  drawText1(data.lavatoriesCount || "3", 35, 475, 7.5, true);
  drawCheck1(70, 475);
  drawText1(data.kitchenSinksCount || "1", 35, 462, 7.5, true);
  drawCheck1(70, 462);
  drawText1(data.faucetsCount || "4", 35, 449, 7.5, true);
  drawCheck1(70, 449);
  drawText1(data.showersCount || "2", 35, 436, 7.5, true);
  drawCheck1(70, 436);

  // Water supply & septic
  drawCheck1(26, 241); // [X] City / Municipal Water System
  drawCheck1(185, 254); // [X] Septic Vault

  drawText1(data.proposedStoreys || "2", 160, 206, 7.5, true);
  drawText1(`${data.floorArea || "120"} SQ. M.`, 380, 206, 7.5, true);
  drawText1(data.proposedStartDate || "Sep 17, 2026", 100, 181, 7.5, false);
  drawText1(`PHP ${data.costPlumbing || "50,000.00"}`, 360, 181, 7.5, true);

  const mpName = data.masterPlumberName || "Engr. Jose Mendoza, MP";
  drawText1(mpName.toUpperCase(), 360, 148, 8, true);

  // Page 2: Credentials
  if (doc.getPageCount() > 1) {
    const p2 = doc.getPage(1);
    const drawText2 = (text: string | undefined | null, x: number, y: number, size: number = 8, isBold: boolean = false) => {
      if (!text) return;
      let clean = safeText(text).trim();
      p2.drawText(clean, { x, y, size, font: isBold ? fontBold : fontRegular, color: darkNavy });
    };

    drawText2(mpName.toUpperCase(), 120, 810, 8.5, true);
    drawText2(data.masterPlumberPRC || "PRC-0012984", 420, 810, 7.5, false);
    drawText2("Sto. Tomas, Pampanga", 120, 785, 7.5, false);
    drawText2(data.masterPlumberPTR || "PTR-ST-2026-1102", 120, 760, 7.5, false);
    drawText2("Jan 05, 2026", 320, 760, 7.5, false);
    drawText2("Sto. Tomas", 450, 760, 7.5, false);
    drawText2(data.masterPlumberTIN || "112-984-550-000", 120, 735, 7.5, false);

    // Applicant signature
    drawText2((data.applicantName || "PAUL PAYUMO").toUpperCase(), 120, 685, 8.5, true);
    drawText2("CTC-2026-00192", 120, 660, 7.5, false);
  }

  return await doc.saveAsBase64({ dataUri: false });
}

/**
 * 6. COMPILED OFFICIAL UNIFIED APPLICATION DOSSIER
 * Generates the Building Permit as Master Cover, then appends all required
 * technical permits (AP, SP, EP, PL, etc.) with the applicant's entered responses.
 */
export async function generateUnifiedPermitPdf(data: UnifiedPermitFormData): Promise<string> {
  // 1. Generate Building Permit as base
  const buildingPdfBase64 = await generateBuildingPermitPdf(data);
  const mainDoc = await PDFDocument.load(Buffer.from(buildingPdfBase64, "base64"));

  const activeForms = Array.isArray(data.activePermitForms) && data.activePermitForms.length > 0
    ? data.activePermitForms
    : ["architecturalPermit", "civilStructuralPermit", "electricalPermit", "sanitaryPermit"];

  for (const formKey of activeForms) {
    if (formKey === "buildingPermit" || formKey === "zoningPermit" || formKey === "fireBfpPermit") {
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
      } else {
        const meta = PERMIT_FORM_METADATA[formKey];
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
