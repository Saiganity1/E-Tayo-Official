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
  if (data.locationalClearanceRef) drawCheck(222, 801);
  drawCheck(342, 801); // Fire safety clearance also applied

  // Box 1: Owner
  const { lastName, firstName, mi } = parseApplicantName(data.applicantName);
  drawText(lastName, 118, 735.0, 8.5, true, 18);
  drawText(firstName, 238, 735.0, 8.5, true, 18);
  drawText(mi, 358, 735.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 405, 735.0, 8, false);
  drawText(data.formOfOwnership || "INDIVIDUAL", 195, 714.0, 8, false, 25);

  // Address
  drawText(data.projectAddress || data.applicantAddress || "Lawasn St., Blue Diamond", 42, 694.5, 7.5, false, 24);
  drawText(data.barangay || "Sapa (Santo Nino)", 175, 694.5, 7.5, false, 14);
  drawText("Sto. Tomas, Pampanga", 245, 694.5, 7.5, false, 18);
  drawText("2020", 345, 694.5, 7.5, false);
  drawText(data.applicantPhone || "0917-123-4567", 405, 694.5, 7.5, true);

  // Location of Construction Line 1
  drawText(data.lotNo || "Lot 12", 168, 680.5, 7.5, true);
  drawText(data.blockNo || "Blk 4", 226, 680.5, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 284, 680.5, 7.5, true, 11);
  drawText(data.taxDecNo || "TD-2026-0012", 416, 680.5, 7.5, false);

  // Location of Construction Line 2 (Street, Barangay, City)
  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 68, 667.5, 7.5, false, 20);
  drawText(data.barangay || "Sapa (Santo Nino)", 180, 667.5, 7.5, true, 18);
  drawText("Sto. Tomas, Pampanga", 350, 667.5, 7.5, true, 22);

  // Box 3: Scope of Work
  const scopeNorm = (data.scopeOfWork || "new construction").toLowerCase();
  if (scopeNorm.includes("erect")) drawCheck(36.5, 626.5);
  else if (scopeNorm.includes("add")) drawCheck(36.5, 614.0);
  else if (scopeNorm.includes("alter")) drawCheck(36.5, 601.5);
  else if (scopeNorm.includes("renov")) drawCheck(167.5, 639.5);
  else if (scopeNorm.includes("convert")) drawCheck(167.5, 626.5);
  else if (scopeNorm.includes("repair")) drawCheck(167.5, 614.0);
  else if (scopeNorm.includes("accessory")) drawCheck(302.5, 626.5);
  else drawCheck(36.5, 639.5); // Default: New Construction

  // Box 4: Use / Occupancy
  const cat = data.projectType?.category || "Residential";
  if (cat === "Commercial") drawCheck(225, 565.0);
  else if (cat === "Industrial") drawCheck(223, 509.0);
  else if (cat === "Institutional") drawCheck(53, 459.0);
  else drawCheck(34, 577.5); // Group A Residential

  // Box 5: Physical Specs & Cost Breakdown
  const occName = (data.projectType?.name || "Single-Detached House").toUpperCase();
  drawText(occName, 115, 426.0, 7.5, true, 14);

  // Format clean project cost number (placed after pre-printed TOTAL ESTIMATED COST: P)
  const cleanCost = String(data.projectCost || "1,500,000.00").replace(/PHP/gi, "").trim();
  drawText(cleanCost, 305, 426.0, 8, true);

  drawText(data.numberOfUnits || "1", 120, 416.0, 7.5, false);
  drawText(data.costBuilding ? String(data.costBuilding).replace(/PHP/gi, "").trim() : "1,200,000.00", 260, 416.0, 7.5, false);

  drawText(data.proposedStoreys || "2", 120, 407.0, 7.5, false);
  drawText(data.costElectrical ? String(data.costElectrical).replace(/PHP/gi, "").trim() : "150,000.00", 260, 407.0, 7.5, false);

  drawText(data.floorArea || "120", 95, 397.5, 7.5, true);
  drawText(data.costMechanical ? String(data.costMechanical).replace(/PHP/gi, "").trim() : "50,000.00", 260, 397.5, 7.5, false);

  drawText(data.lotArea || "200", 75, 388.5, 7.5, true);
  drawText(data.costElectronics ? String(data.costElectronics).replace(/PHP/gi, "").trim() : "50,000.00", 260, 388.5, 7.5, false);
  drawText(data.costPlumbing ? String(data.costPlumbing).replace(/PHP/gi, "").trim() : "50,000.00", 260, 379.0, 7.5, false);
  if (data.costOthers) drawText(String(data.costOthers).replace(/PHP/gi, "").trim(), 380, 379.0, 7.5, false);

  const constDate = data.proposedStartDate || data.submissionDate || "Sep 17, 2026";
  drawText(constDate, 148, 370.5, 7.5, false);
  drawText(data.expectedCompletionDate || "WITHIN 180 DAYS", 325, 370.5, 7.5, false);

  // Box 2: Full-Time Inspector / Supervisor
  const leadEngr = data.civilEngineerName || data.architectName || "Engr. Roberto Cruz, CE";
  drawText(leadEngr.toUpperCase(), 115, 300.0, 8.5, true);
  drawText("Sto. Tomas, Pampanga", 345, 338.0, 7.5, false);
  drawText(data.civilEngineerPRC || data.architectPRC || "PRC-0078923", 345, 303.5, 7.5, false);
  drawText(data.civilEngineerPRCValidity || data.architectPRCValidity || "2028-12-31", 445, 303.5, 7.5, false);
  drawText(data.civilEngineerPTR || "PTR-ST-2026-001", 345, 291.5, 7.5, false);
  drawText(data.civilEngineerPTRIssued || "Jan 05, 2026", 445, 291.5, 7.5, false);
  drawText("Sto. Tomas", 345, 279.5, 7.5, false);
  drawText(data.civilEngineerTIN || "123-456-789-000", 445, 279.5, 7.5, false);

  // Box 3: Owner Signature
  drawText((data.applicantName || "PAUL PAYUMO").toUpperCase(), 100, 232.0, 8.5, true);
  drawText(data.submissionDate || "Sep 17, 2026", 235, 228.0, 7.5, false);
  drawText(data.projectAddress || data.applicantAddress || "Sto. Tomas, Pampanga", 65, 208.0, 7.5, false);
  drawText(data.govIdNo || "CTC-2026-00192", 80, 194.0, 7.5, false);

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
 * 8. COMPILED OFFICIAL UNIFIED APPLICATION DOSSIER
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
      } else if (formKey === "mechanicalPermit") {
        formBase64 = await generateMechanicalPermitPdf(data);
      } else if (formKey === "electronicsPermit") {
        formBase64 = await generateElectronicsPermitPdf(data);
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
