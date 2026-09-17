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
  activePermitForms: (keyof PermitFormMatrix)[];
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

/**
 * Loads the official UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf
 * and all required ancillary technical permit templates from the folder,
 * overlays applicant responses into their respective boxes, and combines
 * them into a single official PDF application dossier.
 */
export async function generateUnifiedPermitPdf(data: UnifiedPermitFormData): Promise<string> {
  // 1. Load the official Unified Building Permit Template
  const unifiedTemplateBytes = await fetchTemplateBytes("/templates/UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf");
  const mainDoc = await PDFDocument.load(unifiedTemplateBytes);

  const fontBold = await mainDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await mainDoc.embedFont(StandardFonts.Helvetica);

  const darkNavy = rgb(0.05, 0.12, 0.35); // Official document ink color

  const p1 = mainDoc.getPage(0);

  const drawP1Text = (
    text: string | undefined | null,
    x: number,
    y: number,
    fontSize: number = 8,
    isBold: boolean = false,
    maxWidth?: number
  ) => {
    if (!text) return;
    let clean = safeText(text).trim();
    if (maxWidth && clean.length > maxWidth) {
      clean = clean.slice(0, maxWidth);
    }
    p1.drawText(clean, {
      x,
      y,
      size: fontSize,
      font: isBold ? fontBold : fontRegular,
      color: darkNavy,
    });
  };

  const drawP1Check = (x: number, y: number) => {
    p1.drawText("X", {
      x,
      y,
      size: 8.5,
      font: fontBold,
      color: darkNavy,
    });
  };

  // --- HEADER: Application No & Prerequisites ---
  drawP1Text(data.applicationNo || "APP-2026-UNIFIED", 115, 788, 9, true);

  // Mark Locational Clearance prerequisite
  if (data.locationalClearanceRef) {
    drawP1Check(235, 802);
  }

  // Parse applicant name (Last, First, Middle)
  const nameParts = (data.applicantName || "").trim().split(" ");
  let lastName = "";
  let firstName = "";
  let mi = "";
  if (nameParts.length === 1) {
    lastName = nameParts[0];
  } else if (nameParts.length === 2) {
    firstName = nameParts[0];
    lastName = nameParts[1];
  } else {
    firstName = nameParts.slice(0, -1).join(" ");
    lastName = nameParts[nameParts.length - 1];
    mi = nameParts[1] ? nameParts[1][0].toUpperCase() + "." : "";
  }

  // --- BOX 1: OWNER / APPLICANT ---
  drawP1Text(lastName.toUpperCase(), 42, 735, 8.5, true, 30);
  drawP1Text(firstName.toUpperCase(), 240, 735, 8.5, true, 20);
  drawP1Text(mi || "N/A", 360, 735, 8, true);
  drawP1Text(data.applicantTIN || "000-123-456-000", 395, 735, 8, false);

  drawP1Text(data.formOfOwnership || "INDIVIDUAL", 200, 712, 8, false, 25);

  // Address line
  drawP1Text(data.projectAddress || data.applicantAddress || "Poblacion", 42, 692, 7.5, false, 25);
  drawP1Text(data.barangay || "Sto. Tomas", 173, 692, 7.5, false, 15);
  drawP1Text("Sto. Tomas, Pampanga", 242, 692, 7.5, false, 20);
  drawP1Text("2020", 342, 692, 7.5, false);
  drawP1Text(data.applicantPhone || "0917-123-4567", 426, 692, 7.5, true);

  // --- BOX 2: LOCATION OF CONSTRUCTION ---
  drawP1Text(data.lotNo || "Lot 12", 168, 680, 7.5, true);
  drawP1Text(data.blockNo || "Blk 4", 226, 680, 7.5, true);
  drawP1Text(data.tctNo || "TCT-123456", 285, 680, 7.5, true);
  drawP1Text(data.taxDecNo || "TD-2026-0012", 420, 680, 7.5, false);

  drawP1Text(data.projectAddress || "Main Street", 65, 666, 7.5, false, 25);
  drawP1Text(data.barangay || "San Bartolome", 185, 666, 7.5, true);
  drawP1Text("Sto. Tomas, Pampanga", 350, 666, 7.5, true);

  // --- BOX 3: SCOPE OF WORK ---
  const scopeNorm = (data.scopeOfWork || "new construction").toLowerCase();
  if (scopeNorm.includes("erect")) {
    drawP1Check(37, 629);
  } else if (scopeNorm.includes("add")) {
    drawP1Check(37, 617);
  } else if (scopeNorm.includes("alter")) {
    drawP1Check(37, 604);
  } else if (scopeNorm.includes("renov")) {
    drawP1Check(168, 642);
  } else if (scopeNorm.includes("convert") || scopeNorm.includes("conversion")) {
    drawP1Check(168, 629);
  } else if (scopeNorm.includes("repair")) {
    drawP1Check(168, 617);
  } else if (scopeNorm.includes("accessory")) {
    drawP1Check(303, 629);
  } else if (scopeNorm.includes("other")) {
    drawP1Check(303, 604);
    drawP1Text(data.scopeOthers || data.scopeOfWork, 350, 604, 7.5, false);
  } else {
    // Default: New Construction
    drawP1Check(37, 642);
  }

  // --- BOX 4: USE OR CHARACTER OF OCCUPANCY ---
  const cat = data.projectType?.category || "Residential";
  if (cat === "Commercial") {
    drawP1Check(228, 569); // Commercial Store / Bank
  } else if (cat === "Industrial") {
    drawP1Check(226, 513); // Light Industrial
  } else if (cat === "Institutional") {
    drawP1Check(56, 463); // Institutional
  } else {
    // Default: Group A - Residential Dwellings
    drawP1Check(56, 569); // Single / Duplex
  }

  // --- BOX 5: BUILDING DETAILS & ESTIMATED COSTS ---
  drawP1Text((data.projectType?.name || "Residential").toUpperCase(), 135, 423, 8, true, 20);
  drawP1Text(`PHP ${data.projectCost || "1,500,000.00"}`, 310, 423, 8, true);

  drawP1Text(data.numberOfUnits || "1", 135, 413, 8, false);
  drawP1Text(data.costBuilding || data.projectCost || "1,000,000.00", 265, 413, 7.5, false);

  drawP1Text(data.proposedStoreys || "1", 135, 404, 8, false);
  drawP1Text(data.costElectrical || "150,000.00", 265, 404, 7.5, false); // Electrical cost

  drawP1Text(data.floorArea ? `${data.floorArea}` : "150", 120, 395, 8, true);
  drawP1Text(data.costMechanical || "100,000.00", 265, 395, 7.5, false); // Mechanical cost

  drawP1Text(data.lotArea ? `${data.lotArea}` : "200", 120, 386, 8, true);
  drawP1Text(data.costElectronics || "50,000.00", 265, 386, 7.5, false); // Electronics cost

  drawP1Text(data.costPlumbing || "100,000.00", 265, 377, 7.5, false); // Plumbing cost

  const constDate = data.proposedStartDate || data.submissionDate || new Date().toLocaleDateString();
  drawP1Text(constDate, 145, 368, 7.5, false);
  drawP1Text(data.expectedCompletionDate || "WITHIN 180 DAYS", 330, 368, 7.5, false);

  // --- DESIGN PROFESSIONALS & SIGNATURES ---
  const leadEngr = data.civilEngineerName || data.architectName || "Engr. Roberto Cruz, CE";
  drawP1Text(leadEngr.toUpperCase(), 120, 295, 8, true);
  drawP1Text(data.civilEngineerPRC || data.architectPRC || "PRC-0078923", 350, 306, 7.5, false);
  drawP1Text(data.civilEngineerPTR || "PTR-ST-2026-001", 350, 294, 7.5, false);
  drawP1Text("Sto. Tomas, Pampanga", 350, 335, 7.5, false);

  // Owner signature Box 4
  drawP1Text((data.applicantName || "APPLICANT").toUpperCase(), 80, 230, 8, true);
  drawP1Text(data.projectAddress || data.applicantAddress || "Sto. Tomas, Pampanga", 80, 210, 7.5, false);

  // 2. Load & Append Active Technical / Ancillary Permit Forms
  const activeForms = Array.isArray(data.activePermitForms) ? data.activePermitForms : [];

  for (const formKey of activeForms) {
    if (formKey === "buildingPermit" || formKey === "zoningPermit" || formKey === "fireBfpPermit") {
      continue;
    }

    const meta = PERMIT_FORM_METADATA[formKey];
    if (!meta || !meta.templateFile) continue;

    try {
      const techBytes = await fetchTemplateBytes(meta.templateFile);
      const techDoc = await PDFDocument.load(techBytes);
      const techFontBold = await techDoc.embedFont(StandardFonts.HelveticaBold);
      const techFontRegular = await techDoc.embedFont(StandardFonts.Helvetica);
      const tp1 = techDoc.getPage(0);

      const drawTech = (
        text: string | undefined | null,
        x: number,
        y: number,
        fontSize: number = 8,
        isBold: boolean = false,
        maxWidth?: number
      ) => {
        if (!text) return;
        let clean = safeText(text).trim();
        if (maxWidth && clean.length > maxWidth) {
          clean = clean.slice(0, maxWidth);
        }
        tp1.drawText(clean, {
          x,
          y,
          size: fontSize,
          font: isBold ? techFontBold : techFontRegular,
          color: darkNavy,
        });
      };

      // Stamp common fields on Box 1 of each technical permit
      if (formKey === "electricalPermit") {
        drawTech(data.applicationNo, 115, 785, 8.5, true);
        drawTech(data.applicantName?.toUpperCase(), 100, 705, 8.5, true);
        drawTech(data.applicantAddress, 100, 677, 7.5, false);
        drawTech(data.projectAddress, 140, 650, 7.5, true);
        // [X] New Installation
        tp1.drawText("X", { x: 45, y: 627, size: 8.5, font: techFontBold, color: darkNavy });
        // Professional Electrical Engineer
        if (data.electricalEngineerName) {
          drawTech(data.electricalEngineerName.toUpperCase(), 65, 490, 8, true);
          drawTech(data.electricalEngineerPRC || "PRC-PEE-0033421", 420, 503, 7.5, false);
          drawTech(data.electricalEngineerPTR || "PTR-ST-2026-4412", 85, 447, 7.5, false);
          drawTech("Sto. Tomas, Pampanga", 85, 462, 7.5, false);
        }
      } else if (formKey === "mechanicalPermit") {
        drawTech(data.applicationNo, 115, 740, 8.5, true);
        drawTech(data.applicantName?.toUpperCase(), 100, 665, 8.5, true);
        drawTech(data.projectAddress, 100, 580, 7.5, true);
        // Equipment / Machinery Scope checkbox
        if (data.projectType?.id === "elevator_escalator") {
          // Escalator: x = 213.8, y = 460.8; Passenger Elevator: x = 213.8, y = 433.1
          tp1.drawText("X", { x: 215, y: 461, size: 8.5, font: techFontBold, color: darkNavy });
          tp1.drawText("X", { x: 215, y: 433, size: 8.5, font: techFontBold, color: darkNavy });
        } else if (data.projectType?.id === "generator_set") {
          // Internal Combustion Engine: x = 33.4, y = 460.8
          tp1.drawText("X", { x: 35, y: 461, size: 8.5, font: techFontBold, color: darkNavy });
        } else {
          // Ventilation / AC: x = 213.8, y = 470
          tp1.drawText("X", { x: 215, y: 470, size: 8.5, font: techFontBold, color: darkNavy });
        }
        // Professional Mechanical Engineer
        if (data.mechanicalEngineerName) {
          drawTech(data.mechanicalEngineerName.toUpperCase(), 80, 303, 8, true);
          drawTech(data.mechanicalEngineerPRC || "PRC-PME-0021489", 65, 265, 7.5, false);
          drawTech("Sto. Tomas, Pampanga", 30, 284, 7.5, false);
        }
        drawTech(data.applicantName?.toUpperCase(), 80, 160, 8, true);
      } else if (formKey === "sanitaryPermit") {
        drawTech(data.applicationNo, 115, 785, 8.5, true);
        drawTech(data.applicantName?.toUpperCase(), 100, 715, 8.5, true);
        drawTech(data.projectAddress, 100, 690, 7.5, true);
        tp1.drawText("X", { x: 40, y: 666, size: 8.5, font: techFontBold, color: darkNavy }); // New installation
        if (data.masterPlumberName) {
          drawTech(data.masterPlumberName.toUpperCase(), 120, 210, 8, true);
          drawTech(data.masterPlumberPRC || "PRC-MP-0012984", 420, 210, 7.5, false);
        }
      } else if (formKey === "architecturalPermit") {
        drawTech(data.applicationNo, 115, 785, 8.5, true);
        drawTech(data.applicantName?.toUpperCase(), 100, 715, 8.5, true);
        drawTech(data.projectAddress, 100, 680, 7.5, true);
        if (data.architectName) {
          drawTech(data.architectName.toUpperCase(), 120, 295, 8, true);
          drawTech(data.architectPRC || "PRC-ARC-0045211", 350, 295, 7.5, false);
        }
      } else if (formKey === "civilStructuralPermit") {
        drawTech(data.applicationNo, 115, 750, 8.5, true);
        drawTech(data.applicantName?.toUpperCase(), 100, 690, 8.5, true);
        drawTech(data.projectAddress, 100, 660, 7.5, true);
        if (data.civilEngineerName) {
          drawTech(data.civilEngineerName.toUpperCase(), 120, 280, 8, true);
          drawTech(data.civilEngineerPRC || "PRC-CE-0078923", 350, 280, 7.5, false);
        }
      } else if (formKey === "electronicsPermit") {
        drawTech(data.applicationNo, 115, 785, 8.5, true);
        drawTech(data.applicantName?.toUpperCase(), 100, 715, 8.5, true);
        drawTech(data.projectAddress, 100, 680, 7.5, true);
        if (data.electronicsEngineerName) {
          drawTech(data.electronicsEngineerName.toUpperCase(), 120, 295, 8, true);
          drawTech(data.electronicsEngineerPRC || "PRC-PECE-0038912", 350, 295, 7.5, false);
        }
      } else if (formKey === "demolitionPermit") {
        drawTech(data.applicationNo, 115, 740, 8.5, true);
        drawTech(data.applicantName?.toUpperCase(), 100, 617, 8.5, true);
        drawTech(data.applicantAddress, 100, 588, 7.5, false);
        drawTech(data.projectAddress, 100, 531, 7.5, true);
      } else if (formKey === "fencingPermit") {
        drawTech(data.applicationNo, 115, 740, 8.5, true);
        drawTech(data.applicantName?.toUpperCase(), 100, 624, 8.5, true);
        drawTech(data.applicantAddress, 100, 598, 7.5, false);
        drawTech(data.projectAddress, 100, 542, 7.5, true);
      } else if (formKey === "excavationPermit") {
        drawTech(data.applicationNo, 115, 740, 8.5, true);
        drawTech(data.applicantName?.toUpperCase(), 100, 604, 8.5, true);
        drawTech(data.applicantAddress, 100, 576, 7.5, false);
        drawTech(data.projectAddress, 100, 516, 7.5, true);
      } else if (formKey === "signPermit") {
        drawTech(data.applicationNo, 115, 785, 8.5, true);
        drawTech(data.applicantName?.toUpperCase(), 100, 730, 8.5, true);
        drawTech(data.applicantAddress, 100, 702, 7.5, false);
        drawTech(data.projectAddress, 100, 645, 7.5, true);
      } else if (formKey === "temporaryServiceConnection") {
        drawTech(data.applicationNo, 115, 785, 8.5, true);
        drawTech(data.applicantName?.toUpperCase(), 100, 750, 8.5, true);
        drawTech(data.applicantAddress, 100, 706, 7.5, false);
        drawTech(data.projectAddress, 100, 632, 7.5, true);
      } else if (formKey === "certificateOfOccupancy") {
        drawTech(data.applicationNo, 115, 785, 8.5, true);
        drawTech(data.applicantName?.toUpperCase(), 120, 617, 8.5, true);
        drawTech(data.projectAddress, 120, 496, 7.5, true);
      } else if (formKey === "certificateOfCompletion") {
        drawTech(data.applicationNo, 115, 785, 8.5, true);
        drawTech(data.applicantName?.toUpperCase(), 120, 667, 8.5, true);
        drawTech(data.projectAddress, 120, 648, 7.5, true);
      } else if (formKey === "cfei") {
        drawTech(data.applicationNo, 115, 850, 8.5, true);
        drawTech(data.applicantName?.toUpperCase(), 120, 787, 8.5, true);
        drawTech(data.projectAddress, 120, 731, 7.5, true);
      }

      // Copy pages of this official filled technical permit into the unified main document
      const copiedPages = await mainDoc.copyPages(techDoc, techDoc.getPageIndices());
      for (const cp of copiedPages) {
        mainDoc.addPage(cp);
      }
    } catch (techErr) {
      console.warn(`Could not attach technical permit form ${formKey}:`, techErr);
    }
  }

  return await mainDoc.saveAsBase64({ dataUri: false });
}
