import { PDFDocument, PDFPage, rgb, StandardFonts } from "pdf-lib";
import { ProjectTypeItem, PERMIT_FORM_METADATA, PermitFormMatrix } from "../data/projectTypeMatrix";

export interface UnifiedPermitFormData {
  applicationNo: string;
  permitNo?: string;
  architecturalPermitNo?: string;
  structuralPermitNo?: string;
  electricalPermitNo?: string;
  plumbingPermitNo?: string;
  sanitaryPermitNo?: string;
  mechanicalPermitNo?: string;
  electronicsPermitNo?: string;
  buildingPermitNo?: string;
  bpNo?: string;
  demolitionPermitNo?: string;
  dpNo?: string;
  demolitionMethod?: string;
  demolitionStartDate?: string;
  demolitionCompletionDate?: string;
  demolitionSupervisorName?: string;
  demolitionSupervisorPRC?: string;
  demolitionSupervisorPRCValidity?: string;
  demolitionSupervisorPTR?: string;
  demolitionSupervisorPTRIssued?: string;
  demolitionSupervisorPTRIssuedAt?: string;
  demolitionSupervisorTIN?: string;
  demolitionSupervisorAddress?: string;
  demolitionSupervisorPhone?: string;
  demolitionSupervisorSignature?: string;
  fpNo?: string;
  excavationPermitNo?: string;
  egppNo?: string;
  withBuildingPermit?: boolean;
  status?: string;
  isApproved?: boolean;
  dateIssued?: string;
  approvalDate?: string;
  permitIssuedDate?: string;
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
  applicantNoStreet?: string;
  applicantBarangay?: string;
  applicantMunicipality?: string;
  applicantProvince?: string;
  applicantZipCode?: string;
  applicantTIN?: string;
  formOfOwnership?: string;
  constructionOwnedByEnterprise?: string;
  enterpriseName?: string;
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
  projectCost?: string;
  scopeOfWork: string;
  scopeOthers?: string;
  scopeOfWorkDetails?: string;
  percentBuildingFootprint?: string;
  percentImperviousSurface?: string;
  percentUnpavedSurface?: string;
  percentSiteOccupancyOthers?: string;
  fireCodeExitDoors?: boolean;
  fireCodeCorridors?: boolean;
  fireCodeDistanceExits?: boolean;
  fireCodeAccessStreet?: boolean;
  fireCodeFireWalls?: boolean;
  fireCodeFireFighting?: boolean;
  fireCodeSmokeDetectors?: boolean;
  fireCodeEmergencyLights?: boolean;
  fireCodeOthers?: string;
  projectNature?: string;
  natureOthers?: string;
  occupancyClass: string;
  occupancyClassificationDetail?: string;
  occupancyOthers?: string;
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
  cookingUnitOutletsCount?: string;
  rangeOutletsCount?: string;
  waterHeaterOutletsCount?: string;
  waterPumpOutletsCount?: string;
  groundingSpec?: string;
  // Equipment / Wiring Devices details (Box 1)
  toggleSwitchCount?: string;
  bellBuzzerCount?: string;
  pushButtonsCount?: string;
  faDetectorCount?: string;
  otherWiringDevicesCount?: string;

  // Sanitary / Plumbing Permit details
  sanitaryScopeOfWork?: string;
  sanitaryScopeDetails?: string;
  sanitaryScopeOthersAction?: string;
  sanitaryScopeOthersTarget?: string;
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
  waterMeterCount?: string;
  greaseTrapCount?: string;
  bathTubsCount?: string;
  slopSinkCount?: string;
  urinalCount?: string;
  airConditioningCount?: string;
  waterTankCount?: string;

  bidetCount?: string;
  laundryTraysCount?: string;
  dentalCuspidorCount?: string;
  electricalHeaterCount?: string;
  waterBoilerCount?: string;
  drinkingFountainCount?: string;
  barSinkCount?: string;
  sodaFountainCount?: string;
  laboratorySinkCount?: string;
  sterilizerCount?: string;
  swimmingPoolCount?: string;
  othersFixtureCount?: string;
  othersFixtureName?: string;

  fixtureStatusMap?: Record<string, "new" | "existing">;

  waterDistributionSystem?: boolean;
  sanitarySewerSystem?: boolean;
  stormDrainageSystem?: boolean;

  // Water Supply & System Supply / Disposal (NBC Form P-01 Box 1 Bottom)
  waterSupplyType?: "SHALLOW WELL" | "DEEPWELL & PUMP SET" | "CITY/MUNICIPAL WATER SYSTEM" | "OTHERS";
  waterSupplyOthers?: string;
  wasteWaterTreatmentPlant?: boolean;
  septicVaultImhoffTank?: boolean;
  subsurfaceSandFilter?: boolean;
  sanitarySewerConnection?: boolean;
  surfaceDrainage?: boolean;
  streetCanal?: boolean;
  waterCourse?: boolean;
  plumbingTotalArea?: string;
  plumbingStartDate?: string;
  plumbingInstallationCost?: string;
  plumbingCompletionDate?: string;
  plumbingPreparedBy?: string;

  // Locational Clearance specific details (Boxes 11, 12, 13, 14, 15, 16, 17)
  rightOverLand?: string;
  rightOverLandOthers?: string;
  projectTenure?: string;
  existingLandUse?: string;
  landUseOthers?: string;
  agriculturalCrop?: string;
  isTenanted?: string;
  projectCostWords?: string;
  hasWrittenNotice?: string;
  noticeOfficer?: string;
  noticeOrder?: string;
  noticeDate?: string;
  hasRelatedAction?: string;
  relatedOffice?: string;
  relatedDate?: string;
  relatedActionTaken?: string;
  preferredMode?: string;

  // Equipment & specialized machinery details (for Elevator/Escalator, Mechanical, Generator)
  machineryType?: string;
  machineryBrand?: string;
  machineryCapacity?: string;
  machineryPower?: string;
  machinerySpeed?: string;
  machineryStoreys?: string;
  electricalLoadKva?: string;
  serviceVoltage?: string;
  mechanicalScopeOfWork?: string;
  mechanicalScopeDetails?: string;

  // Mechanical Box 2: Installation and Operation of
  boiler?: boolean;
  pressureVessel?: boolean;
  internalCombustionEngine?: boolean;
  refrigerationIce?: boolean;
  windowTypeAircon?: boolean;
  packagedSplitAircon?: boolean;
  mechanicalOthers?: boolean;
  mechanicalOthersSpecify?: string;
  centralAircon?: boolean;
  mechanicalVentilation?: boolean;
  escalator?: boolean;
  movingSidewalk?: boolean;
  freightElevator?: boolean;
  passengerElevator?: boolean;
  cableCar?: boolean;
  dumbwaiter?: boolean;
  pumps?: boolean;
  compressedAirGas?: boolean;
  pneumaticTubesConveyors?: boolean;
  funicular?: boolean;
  mechanicalPreparedBy?: string;

  // Electronics details (NBC Form EL-01)
  electronicsScopeOfWork?: string;
  electronicsScopeOthers?: string;
  telecomScope?: string;
  cctvScope?: string;
  fdasScope?: string;
  catvScope?: string;

  // Box 2 Nature of Installation Checkboxes
  telecomSystem?: boolean;
  broadcastingSystem?: boolean;
  televisionSystem?: boolean;
  itSystem?: boolean;
  securityAlarmSystem?: boolean;
  anyOtherElectronics?: boolean;
  anyOtherElectronicsSpecify?: string;
  electronicsAlarmSystem?: boolean;
  soundCommSystem?: boolean;
  centralizedClockSystem?: boolean;
  soundSystem?: boolean;
  electronicsControlConveyor?: boolean;
  computerProcessControls?: boolean;
  buildingAutomationManagement?: boolean;
  buildingWiringFiberOptic?: boolean;
  electronicsPreparedBy?: string;

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

  // Fencing Permit details (NBC Form B-03)
  fencingPermitNo?: string;
  fencingScopeOfWork?: string;
  fencingScopeDetails?: string;
  fencingType?: string;
  fencingTypes?: string[];
  fencingTypeOthers?: string;
  fencingTypeOthersLine2?: string;
  fencingTypeOthersLine3?: string;
  fencingLength?: string;
  fencingHeight?: string;
  fencingCost?: string;
  fencingDesignerRole?: "architect" | "civilEngineer";
  fencingDesignerName?: string;
  fencingDesignerAddress?: string;
  fencingDesignerPRC?: string;
  fencingDesignerPRCValidity?: string;
  fencingDesignerPTR?: string;
  fencingDesignerPTRIssued?: string;
  fencingDesignerPTRIssuedAt?: string;
  fencingDesignerTIN?: string;
  fencingDesignerSignature?: string;
  fencingSupervisorRole?: "same" | "architect" | "civilEngineer";
  fencingSupervisorName?: string;
  fencingSupervisorAddress?: string;
  fencingSupervisorPRC?: string;
  fencingSupervisorPRCValidity?: string;
  fencingSupervisorPTR?: string;
  fencingSupervisorPTRIssued?: string;
  fencingSupervisorPTRIssuedAt?: string;
  fencingSupervisorTIN?: string;
  fencingSupervisorSignature?: string;

  // Excavation Permit details (NBC Form B-02)
  excavationVolume?: string;
  excavationDepth?: string;
  excavationScope?: string;
  excavationType?: string;
  excavationStartDate?: string;
  excavationCompletionDate?: string;
  excavationAndFills?: boolean;
  foundationAndRetainingWalls?: boolean;
  pileFoundations?: boolean;
  gradingAndEarthworks?: boolean;
  othersSpecify?: boolean;
  othersSpecifyText?: string;
  othersCustomLine2Check?: boolean;
  othersCustomLine2Text?: string;
  othersCustomLine3Check?: boolean;
  othersCustomLine3Text?: string;

  // Sign Permit details (NBC Form B-07)
  signType?: string;
  signDimensions?: string;
  signMaterial?: string;
  signCost?: string;
  signScopeOfWork?: string;
  signScopeOthers?: string;
  signDisplayType?: string;
  signDisplayMedium?: string;
  signInstallationType?: string;
  signLength?: string;
  signWidth?: string;
  signArea?: string;
  signFormOfOwnership?: string;
  signEnterpriseName?: string;
  signCharacterOfOccupancy?: string;
  signApplicantNo?: string;
  signApplicantStreet?: string;
  signApplicantBarangay?: string;
  signApplicantCity?: string;
  installationStreet?: string;
  installationBarangay?: string;
  installationCity?: string;
  signDocTct?: boolean;
  signDocContractOfLease?: boolean;
  signDocTaxDeclaration?: boolean;
  signDocLotPlan?: boolean;
  signDocSignPlansStructural?: boolean;
  signDocSpecsCostEstimates?: boolean;

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
  architectIAPOAValidity?: string;
  architectPTR?: string;
  architectPTRIssued?: string;
  architectPTRIssuedAt?: string;
  architectTIN?: string;

  // Supervisor Architect details (Box 4)
  sameAsDesignArchitect?: boolean;
  supervisorArchitectName?: string;
  supervisorArchitectAddress?: string;
  supervisorArchitectPRC?: string;
  supervisorArchitectPRCValidity?: string;
  supervisorArchitectIAPOA?: string;
  supervisorArchitectIAPOAValidity?: string;
  supervisorArchitectPTR?: string;
  supervisorArchitectPTRIssued?: string;
  supervisorArchitectPTRIssuedAt?: string;
  supervisorArchitectTIN?: string;

  civilEngineerName?: string;
  civilEngineerAddress?: string;
  civilEngineerPRC?: string;
  civilEngineerPRCValidity?: string;
  civilEngineerPICE?: string;
  civilEngineerPTR?: string;
  civilEngineerPTRIssued?: string;
  civilEngineerPTRIssuedAt?: string;
  civilEngineerTIN?: string;
  civilEngineerSignedDate?: string;
  civilEngineerSignature?: string;

  // Supervisor Civil Engineer details (Box 4)
  sameAsDesignCivilEngineer?: boolean;
  supervisorCivilEngineerName?: string;
  supervisorCivilEngineerAddress?: string;
  supervisorCivilEngineerPRC?: string;
  supervisorCivilEngineerPRCValidity?: string;
  supervisorCivilEngineerPICE?: string;
  supervisorCivilEngineerPTR?: string;
  supervisorCivilEngineerPTRIssued?: string;
  supervisorCivilEngineerPTRIssuedAt?: string;
  supervisorCivilEngineerTIN?: string;
  supervisorCivilEngineerSignedDate?: string;
  supervisorCivilEngineerSignature?: string;

  electricalEngineerName?: string;
  electricalEngineerAddress?: string;
  electricalEngineerPRC?: string;
  electricalEngineerPRCValidity?: string;
  electricalEngineerIIEE?: string;
  electricalEngineerPTR?: string;
  electricalEngineerPTRIssued?: string;
  electricalEngineerPTRIssuedAt?: string;
  electricalEngineerTIN?: string;
  electricalEngineerTel?: string;
  applicantCtcNo?: string;
  electricalEngineerSignedDate?: string;
  electricalEngineerSignature?: string;

  // Electrical Contractor details (Box 3)
  electricalContractorName?: string;
  electricalContractorPcab?: string;
  electricalContractorAddress?: string;
  electricalContractorTel?: string;

  // Person In-Charge of Installation (Box 4)
  sameAsDesignElectricalEngineer?: boolean;
  installationInChargeRole?: "PEE" | "REE" | "RME";
  installationInChargeName?: string;
  installationInChargeAddress?: string;
  installationInChargePRC?: string;
  installationInChargePRCValidity?: string;
  installationInChargeTel?: string;
  installationInChargePTR?: string;
  installationInChargePTRIssued?: string;
  installationInChargePTRIssuedAt?: string;
  installationInChargeTIN?: string;
  installationInChargeSignedDate?: string;
  installationInChargeSignature?: string;

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
  mechanicalEngineerPTRDate?: string;
  mechanicalEngineerPTRIssued?: string;
  mechanicalEngineerPTRIssuedAt?: string;
  mechanicalEngineerTIN?: string;
  mechanicalEngineerSignedDate?: string;
  mechanicalEngineerSignature?: string;

  // Supervisor / In-Charge of Mechanical Works (Box 4)
  sameAsDesignMechanicalEngineer?: boolean;
  mechSupervisorRole?: "PME" | "ME";
  mechSupervisorName?: string;
  mechSupervisorAddress?: string;
  mechSupervisorPRC?: string;
  mechSupervisorPRCValidity?: string;
  mechSupervisorPTR?: string;
  mechSupervisorPTRDate?: string;
  mechSupervisorPTRIssued?: string;
  mechSupervisorPTRIssuedAt?: string;
  mechSupervisorTIN?: string;
  mechSupervisorSignedDate?: string;
  mechSupervisorSignature?: string;

  // Building Owner & Lot Owner extra fields
  applicantGovIdDateIssued?: string;
  applicantGovIdPlaceIssued?: string;

  // Box 3: Professional Electronics Engineer (PECE)
  electronicsEngineerName?: string;
  electronicsEngineerAddress?: string;
  electronicsEngineerPRC?: string;
  electronicsEngineerPRCValidity?: string;
  electronicsEngineerIECEP?: string;
  electronicsEngineerPTR?: string;
  electronicsEngineerPTRIssued?: string;
  electronicsEngineerPTRIssuedAt?: string;
  electronicsEngineerTIN?: string;
  electronicsEngineerSignedDate?: string;
  electronicsEngineerSignature?: string;

  // Box 4: Supervisor In-Charge of Electronics Works
  sameAsDesignElectronicsEngineer?: boolean;
  electronicsSupervisorRole?: "PECE" | "ECE";
  electronicsSupervisorName?: string;
  electronicsSupervisorAddress?: string;
  electronicsSupervisorPRC?: string;
  electronicsSupervisorPRCValidity?: string;
  electronicsSupervisorPTR?: string;
  electronicsSupervisorPTRDate?: string;
  electronicsSupervisorPTRIssuedAt?: string;
  electronicsSupervisorTIN?: string;
  electronicsSupervisorSignedDate?: string;
  electronicsSupervisorSignature?: string;

  // Box 4: Full-Time Inspector and Supervisor of Construction Works (Sign Permit / SGP)
  sameAsDesignSignSupervisor?: boolean;
  signSupervisorName?: string;
  signSupervisorAddress?: string;
  signSupervisorPRC?: string;
  signSupervisorPRCValidity?: string;
  signSupervisorPTR?: string;
  signSupervisorPTRIssued?: string;
  signSupervisorPTRIssuedAt?: string;
  signSupervisorTIN?: string;
  signSupervisorSignature?: string;
  signSupervisorSignedDate?: string;

  // Active form checkboxes selected
  activePermitForms?: (keyof PermitFormMatrix)[];
  submissionDate?: string;

  // Corporation & Representative (for LC and Enterprise forms)
  corporationName?: string;
  corporationAddress?: string;
  corporationPhone?: string;
  representativeName?: string;
  representativeAddress?: string;
  representativePhone?: string;

  applicantSignature?: string; // base64 data URL
  applicantSignedDate?: string;
  representativeSignature?: string; // base64 data URL
  govIdDateIssued?: string;
  govIdPlaceIssued?: string;
  lotOwnerConsent?: boolean;
  lotOwnerName?: string;
  lotOwnerSignature?: string;
  lotOwnerAddress?: string;
  lotOwnerGovIdNo?: string;
  lotOwnerGovIdDateIssued?: string;
  lotOwnerGovIdPlaceIssued?: string;
  lotOwnerSignedDate?: string;
  [key: string]: any;
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
  if (!dataUrl || typeof dataUrl !== "string") return false;
  try {
    let b64Data = dataUrl;
    if (b64Data.includes(",")) {
      b64Data = b64Data.split(",")[1];
    } else if (b64Data.startsWith("data:")) {
      b64Data = b64Data.replace(/^data:[^;]+;base64,/, "");
    }
    const cleanB64 = b64Data.trim();
    if (!cleanB64) return false;
    const binaryString = atob(cleanB64);
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
  let nameStr: string = "";
  if (typeof input === "object" && input !== null) {
    if (input.applicantLastName || input.applicantFirstName) {
      const last = (input.applicantLastName || "").toUpperCase();
      const first = (input.applicantFirstName || "").toUpperCase();
      const mid = (input.applicantMiddleName || "").toUpperCase();
      const mi = mid ? (mid.endsWith(".") ? mid : mid[0] + ".") : "N/A";
      return { lastName: last, firstName: first, middleName: mid, mi };
    }
    nameStr = input.applicantName || "";
  } else {
    nameStr = input || "";
  }
  const parts = nameStr.trim().split(/\s+/).filter(Boolean);
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
  const occ = (data.occupancyClassificationDetail || data.occupancyClass || data.projectType?.category || "Group A - Single Family Dwelling").toLowerCase();
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
  const occName = resolveOccupancyDetailText(data);
  const occBox5Size = occName.length > 25 ? 5.2 : occName.length > 18 ? 5.8 : 6.5;
  drawText(occName, 115, 426.0, occBox5Size, true, 32);

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
  const rawGovId = safeText(data.govIdNo || "CTC-2026-00192").trim();
  let cleanGovId = rawGovId.replace(/^[a-zA-Z\s-]+/g, "").trim() || rawGovId;
  if (cleanGovId.length > 9) cleanGovId = cleanGovId.slice(0, 9);
  let govIdSize = cleanGovId.length > 8 ? 5.2 : cleanGovId.length > 6 ? 5.5 : 6.0;
  p1.drawText(cleanGovId, { x: 88.0, y: 194.5, size: govIdSize, font: fontRegular, color: darkNavy });

  const rawDate = safeText(data.govIdDateIssued || "Jan 10, 2024").trim();
  let dateSize = 5.5;
  const dateW = fontRegular.widthOfTextAtSize(rawDate, dateSize);
  if (dateW > 34.0) dateSize = Math.max(4.5, dateSize * (34.0 / dateW));
  p1.drawText(rawDate, { x: 168.0, y: 194.5, size: dateSize, font: fontRegular, color: darkNavy });

  const rawPlace = safeText(data.govIdPlaceIssued || "Sto. Tomas").trim();
  let placeSize = 5.8;
  const placeW = fontRegular.widthOfTextAtSize(rawPlace, placeSize);
  if (placeW > 36.0) placeSize = Math.max(4.5, placeSize * (36.0 / placeW));
  p1.drawText(rawPlace, { x: 246.0, y: 194.5, size: placeSize, font: fontRegular, color: darkNavy });

  // Box 4: With My Consent: Lot Owner / Authorized Representative
  if (data.lotOwnerConsent || data.lotOwnerName) {
    const lotName = safeText(data.lotOwnerName || "Dave Sicat").toUpperCase().trim();
    const lotNameW = fontBold.widthOfTextAtSize(lotName, 8.5);
    const lotNameX = Math.max(330.0, 422.5 - (lotNameW / 2));
    drawText(lotName, lotNameX, 235.0, 8.5, true, 26);

    if (data.lotOwnerSignature) {
      const sigW = 100;
      const sigH = 20;
      const sigX = Math.max(330.0, 422.5 - sigW / 2);
      await embedSignatureImage(doc, p1, data.lotOwnerSignature, sigX, 234.0, sigW, sigH);
    }

    drawText(data.lotOwnerSignedDate || data.submissionDate || "Sep 17, 2026", 535.0, 234.5, 7.0, false);
    drawText(data.lotOwnerAddress || data.projectAddress || "153 Sitio Visitas, Sto. Tomas, Pampanga", 355.0, 212.0, 7.5, false, 45);

    if (data.lotOwnerGovIdNo) {
      const rawLotGovId = safeText(data.lotOwnerGovIdNo).trim();
      let cleanLotGovId = rawLotGovId.replace(/^[a-zA-Z\s-]+/g, "").trim() || rawLotGovId;
      if (cleanLotGovId.length > 9) cleanLotGovId = cleanLotGovId.slice(0, 9);
      let lotGovIdSize = cleanLotGovId.length > 8 ? 5.2 : cleanLotGovId.length > 6 ? 5.5 : 6.0;
      p1.drawText(cleanLotGovId, { x: 374.0, y: 194.5, size: lotGovIdSize, font: fontRegular, color: darkNavy });
    }
    if (data.lotOwnerGovIdDateIssued) {
      const cleanDate = safeText(data.lotOwnerGovIdDateIssued).trim();
      let dateSize = 5.5;
      const w = fontRegular.widthOfTextAtSize(cleanDate, dateSize);
      if (w > 34.0) dateSize = Math.max(4.5, dateSize * (34.0 / w));
      p1.drawText(cleanDate, { x: 448.0, y: 194.5, size: dateSize, font: fontRegular, color: darkNavy });
    }
    if (data.lotOwnerGovIdPlaceIssued) {
      const cleanPlace = safeText(data.lotOwnerGovIdPlaceIssued).trim();
      let placeSize = 5.8;
      const w = fontRegular.widthOfTextAtSize(cleanPlace, placeSize);
      if (w > 36.0) placeSize = Math.max(4.5, placeSize * (36.0 / w));
      p1.drawText(cleanPlace, { x: 526.0, y: 194.5, size: placeSize, font: fontRegular, color: darkNavy });
    }
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

export function resolveOccupancyDetailText(data: Partial<UnifiedPermitFormData>): string {
  const detail = (data.occupancyClassificationDetail || "").trim();
  const others = (data.occupancyOthers || "").trim();

  if (others && (/OTHER/i.test(detail) || !detail)) {
    return others.toUpperCase();
  }

  if (detail) {
    const u = detail.toUpperCase();
    if (/Group A - Residential \(Single\)/i.test(detail) || /Group A - Single Family Dwelling/i.test(detail)) return "GROUP A - SINGLE FAMILY DWELLING";
    if (/Group A - Residential \(Duplex\)/i.test(detail) || /Group A - Duplex/i.test(detail)) return "GROUP A - DUPLEX";
    if (/Group A - Residential \(R-1, R-2\)/i.test(detail) || /Group A - Residential R-1, R-2/i.test(detail)) return "GROUP A - RESIDENTIAL R-1, R-2";
    if (/Group A - Residential \(Others\)/i.test(detail) || /Group A - Others/i.test(detail)) return others ? others.toUpperCase() : "GROUP A - RESIDENTIAL (OTHERS)";
    if (u === "A. RESIDENTIAL DWELLING") return "GROUP A - SINGLE FAMILY DWELLING";
    if (u === "B. RESIDENTIAL, HOTEL, APARTMENT") return "GROUP B - RESIDENTIAL, HOTEL, APARTMENT";
    if (u === "C. EDUCATION AND RECREATION") return "GROUP C - EDUCATION & RECREATION";
    if (u === "D. INSTITUTIONAL") return "GROUP D - INSTITUTIONAL";
    if (u === "H. BUSINESS AND MERCANTILE") return "GROUP E - BUSINESS & MERCANTILE";
    if (u === "I. INDUSTRIAL") return "GROUP F - INDUSTRIAL";
    if (u === "J. STORAGE AND HAZARDOUS") return "GROUP G - STORAGE & HAZARDOUS";
    if (u === "K. ASSEMBLY OTHER THAN GROUP I") return "GROUP H - ASSEMBLY (< 1,000)";
    if (u === "E. ASSEMBLY OCCUPANT LOAD 1000 OR MORE") return "GROUP I - ASSEMBLY (1,000+)";
    if (u === "F. ACCESSORY") return "GROUP J - ACCESSORY";
    if (u.includes("OTHERS") && others) return others.toUpperCase();
    return detail.toUpperCase();
  }

  if (others) return others.toUpperCase();

  const occ = (data.occupancyClass || data.projectType?.category || "RESIDENTIAL").trim();
  return occ.toUpperCase();
}

function getNormalizedOccupancyText(raw?: string, category?: string): string {
  const val = (raw || category || "RESIDENTIAL").toUpperCase().trim();
  if (val.includes("RESIDENTIAL")) return "RESIDENTIAL";
  if (val.includes("COMMERCIAL")) return "COMMERCIAL";
  if (val.includes("INDUSTRIAL")) return "INDUSTRIAL";
  if (val.includes("INSTITUTIONAL")) return "INSTITUTIONAL";
  if (val.includes("AGRICULTURAL")) return "AGRICULTURAL";
  if (val.includes("EDUCATIONAL")) return "EDUCATIONAL & RECREATIONAL";
  if (val.includes("ASSEMBLY")) return "ASSEMBLY / RECREATION";
  return val;
}

export function parseApplicantAddress(data: UnifiedPermitFormData): {
  noStreet: string;
  barangay: string;
  municipality: string;
  zipCode: string;
  contactNo: string;
  email: string;
} {
  const contactNo = (data.applicantPhone || "").trim();
  const email = (data.applicantEmail || "").trim();
  const zipCode = (data.applicantZipCode || "2020").trim();

  // If discrete address parts exist
  if (data.applicantNoStreet || data.applicantBarangay || data.applicantMunicipality) {
    const noStreet = (data.applicantNoStreet || "123 RIZAL ST.").toUpperCase().trim();
    const barangay = (data.applicantBarangay || data.barangay || "POBLACION").toUpperCase().trim();
    let municipality = (data.applicantMunicipality || "STO. TOMAS").toUpperCase().trim();
    const province = (data.applicantProvince || "PAMPANGA").toUpperCase().trim();
    if (province && !municipality.includes(province)) {
      municipality = `${municipality}, ${province}`;
    }
    return { noStreet, barangay, municipality, zipCode, contactNo, email };
  }

  // Parse legacy applicantAddress if discrete fields are not set
  let raw = (data.applicantAddress || "123 RIZAL ST., POBLACION, STO. TOMAS, PAMPANGA").toUpperCase().trim();
  // Strip trailing zip code
  raw = raw.replace(/,?\s*2020\s*$/, "").trim();

  const parts = raw.split(",").map(p => p.trim()).filter(Boolean);

  let noStreet = "123 RIZAL ST.";
  let barangay = (data.barangay || "POBLACION").toUpperCase().trim();
  let municipality = "STO. TOMAS, PAMPANGA";

  if (parts.length >= 3) {
    noStreet = parts[0];
    barangay = parts[1].replace(/^(BRGY\.?|BARANGAY)\s*/i, "").trim();
    municipality = parts.slice(2).join(", ").trim();
  } else if (parts.length === 2) {
    noStreet = parts[0];
    barangay = parts[1].replace(/^(BRGY\.?|BARANGAY)\s*/i, "").trim();
  } else if (parts.length === 1) {
    noStreet = parts[0];
  }

  // Remove duplicate Brgy or Municipality from street portion
  noStreet = noStreet.replace(/,?\s*(BRGY\.?|BARANGAY).*$/i, "").trim();
  noStreet = noStreet.replace(/,?\s*STO\.?\s*TOMAS.*$/i, "").trim();

  return { noStreet, barangay, municipality, zipCode, contactNo, email };
}

function parseBox1AddressParts(data: UnifiedPermitFormData): {
  no: string;
  street: string;
  barangay: string;
  municipality: string;
  zipCode: string;
  phone: string;
} {
  const base = parseApplicantAddress(data);
  let no = "";
  let street = "";

  const cleanNoStreet = (base.noStreet || data.applicantNoStreet || "").trim();
  // Match leading number: e.g. "123", "123-A", "#123"
  const m = cleanNoStreet.match(/^#?(\d+[-\w/]*)\s+(.+)$/i);
  if (m) {
    no = m[1].trim();
    street = m[2].trim();
  } else {
    const mLot = cleanNoStreet.match(/^(lot\s+\d+[-\w]*[\s,]+(blk|block)?\s*\d*)\s*(.*)$/i);
    if (mLot) {
      no = mLot[1].trim();
      street = mLot[3].trim() || cleanNoStreet;
    } else if (/^\d+[-\w/]*$/.test(cleanNoStreet)) {
      no = cleanNoStreet;
      street = "";
    } else {
      no = "";
      street = cleanNoStreet;
    }
  }

  const barangay = (data.applicantBarangay || data.barangay || base.barangay || "Poblacion").trim();
  let municipality = (data.applicantMunicipality || data.city || data.municipality || base.municipality || "Sto. Tomas").trim();
  const province = (data.applicantProvince || "Pampanga").trim();
  if (province && !municipality.toLowerCase().includes(province.toLowerCase())) {
    municipality = `${municipality}, ${province}`;
  }
  const zipCode = (data.applicantZipCode || data.zipCode || base.zipCode || "2020").trim();
  const phone = (data.applicantPhone || base.contactNo || "0917-123-4567").trim();

  return { no, street, barangay, municipality, zipCode, phone };
}

function drawContactAndEmail(
  page: any,
  contactNo: string,
  email: string,
  x: number,
  yCenter: number,
  fontBold: any,
  fontRegular: any,
  color: any,
  maxEmailWidth = 125
) {
  if (contactNo && email) {
    page.drawText(contactNo, { x, y: yCenter + 2.8, size: 6.8, font: fontBold, color });
    let emailSize = 5.8;
    const emailWidth = fontRegular.widthOfTextAtSize(email, emailSize);
    if (emailWidth > maxEmailWidth) {
      emailSize = Math.max(4.5, emailSize * (maxEmailWidth / emailWidth));
    }
    page.drawText(email, { x, y: yCenter - 3.5, size: emailSize, font: fontRegular, color });
  } else if (contactNo) {
    page.drawText(contactNo, { x, y: yCenter, size: 7.5, font: fontBold, color });
  } else if (email) {
    let emailSize = 6.8;
    const emailWidth = fontRegular.widthOfTextAtSize(email, emailSize);
    if (emailWidth > maxEmailWidth) {
      emailSize = Math.max(4.5, emailSize * (maxEmailWidth / emailWidth));
    }
    page.drawText(email, { x, y: yCenter, size: emailSize, font: fontRegular, color });
  }
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

  // Header: APPLICATION NO. in individual segmented boxes (10 boxes)
  const rawAppNo = (data.applicationNo || "2026-0001").trim();
  const cleanAppNo = rawAppNo.replace(/^APP-(TEST-)?/i, "");
  const appChars = cleanAppNo.split("");
  const boxLefts = [28.6, 41.4, 53.8, 66.6, 78.8, 91.6, 104.2, 116.6, 129.0, 141.6];
  const boxWidths = [12.8, 12.4, 12.8, 12.2, 12.8, 12.6, 12.4, 12.4, 12.6, 12.6];

  boxLefts.forEach((boxLeft, idx) => {
    if (idx < appChars.length) {
      const char = appChars[idx];
      const charWidth = fontBold.widthOfTextAtSize(char, 9.5);
      const charX = boxLeft + (boxWidths[idx] - charWidth) / 2;
      p1.drawText(char, { x: charX, y: 781.8, size: 9.5, font: fontBold, color: darkNavy });
    }
  });

  // Header: AP NO (Architectural Permit No.) in individual segmented boxes (10 boxes)
  const rawApNo = (data.permitNo || data.architecturalPermitNo || `AP-${cleanAppNo}`).trim();
  const cleanApNo = rawApNo.replace(/^(AP|APP)-(TEST-)?/i, "").trim();
  const apChars = cleanApNo.split("");
  const apBoxLefts = [247.6, 260.2, 272.6, 285.4, 297.8, 310.4, 323.0, 335.6, 348.1, 360.7];
  const apBoxWidths = [12.6, 12.4, 12.8, 12.4, 12.6, 12.6, 12.6, 12.5, 12.6, 12.5];

  apBoxLefts.forEach((boxLeft, idx) => {
    if (idx < apChars.length) {
      const char = apChars[idx];
      const charWidth = fontBold.widthOfTextAtSize(char, 9.5);
      const charX = boxLeft + (apBoxWidths[idx] - charWidth) / 2;
      p1.drawText(char, { x: charX, y: 781.8, size: 9.5, font: fontBold, color: darkNavy });
    }
  });

  // Header: BUILDING PERMIT NO. in individual segmented boxes (10 boxes)
  // Auto-gathered if project is associated with a Building Permit, or if buildingPermitNo is provided
  const isBpRequired = !data.projectType || data.projectType.matrix?.buildingPermit === 'required' || data.projectType.matrix?.buildingPermit === 'conditional';
  const rawBpNo = (data.buildingPermitNo || (isBpRequired ? (data.applicationNo ? `BP-${cleanAppNo}` : "BP-2026-0001") : "")).trim();
  if (rawBpNo) {
    const cleanBpNo = rawBpNo.replace(/^(BP|APP|NBC)[\s\-#:]*(TEST-)?/i, "").trim();
    const bpChars = cleanBpNo.split("");
    const bpBoxLefts = [441.45, 453.85, 465.95, 478.55, 491.15, 503.55, 516.15, 528.75, 541.35, 553.95];
    const bpBoxWidths = [12.4, 12.4, 12.6, 12.6, 12.6, 12.6, 12.6, 12.6, 12.6, 12.6];
    bpBoxLefts.forEach((boxLeft, idx) => {
      if (idx < bpChars.length) {
        const char = bpChars[idx];
        const charWidth = fontBold.widthOfTextAtSize(char, 9.5);
        const charX = boxLeft + (bpBoxWidths[idx] - charWidth) / 2;
        p1.drawText(char, { x: charX, y: 781.8, size: 9.5, font: fontBold, color: darkNavy });
      }
    });
  }

  // Box 1: Centered under official column headers (LAST NAME at 196.8, FIRST NAME at 311.9, M.I. at 438.75)
  const { lastName, firstName, mi } = parseApplicantName(data);
  const lastWidth = fontBold.widthOfTextAtSize(lastName, 8.5);
  const firstWidth = fontBold.widthOfTextAtSize(firstName, 8.5);
  const miWidth = fontBold.widthOfTextAtSize(mi, 8.5);

  p1.drawText(lastName, { x: 196.8 - lastWidth / 2, y: 733.0, size: 8.5, font: fontBold, color: darkNavy });
  p1.drawText(firstName, { x: 311.9 - firstWidth / 2, y: 733.0, size: 8.5, font: fontBold, color: darkNavy });
  p1.drawText(mi, { x: 438.75 - miWidth / 2, y: 733.0, size: 8.5, font: fontBold, color: darkNavy });
  drawText(data.applicantTIN || "000-123-456-000", 472, 733.0, 8, false);

  // Row 2: FOR CONSTRUCTION OWNED BY AN ENTERPRISE | FORM OF OWNERSHIP | USE OR CHARACTER OF OCCUPANCY
  const enterprise = data.constructionOwnedByEnterprise || data.corporationName || data.enterpriseName || (data.formOfOwnership?.includes("INDIVIDUAL") ? "N/A" : "");
  if (enterprise && enterprise !== "N/A") {
    drawText(enterprise.toUpperCase(), 104, 708.0, 7.5, false, 24);
  } else if (enterprise === "N/A") {
    drawText("N/A", 104, 708.0, 7.5, false);
  }

  const formOfOwnershipText = (data.formOfOwnership || "INDIVIDUAL / OWNER").toUpperCase();
  const formWidth = fontBold.widthOfTextAtSize(formOfOwnershipText, 8);
  p1.drawText(formOfOwnershipText, { x: 286 - formWidth / 2, y: 708.0, size: 8, font: fontBold, color: darkNavy });

  const occText = resolveOccupancyDetailText(data);
  const occFontSize = occText.length > 36 ? 6.2 : occText.length > 28 ? 7.0 : 7.5;
  const occWidth = fontBold.widthOfTextAtSize(occText, occFontSize);
  const occX = Math.max(372, 475 - occWidth / 2);
  p1.drawText(occText, { x: occX, y: 708.0, size: occFontSize, font: fontBold, color: darkNavy });

  // Address (Applicant Address)
  const addr = parseApplicantAddress(data);
  drawText(addr.noStreet, 85, 683.5, 7.5, false, 25);
  drawText(addr.barangay, 200, 683.5, 7.5, false, 18);
  drawText(addr.municipality, 295, 683.5, 7.0, false, 25);
  drawText(addr.zipCode, 398, 683.5, 7.5, false);
  drawContactAndEmail(p1, addr.contactNo, addr.email, 435, 683.5, fontBold, fontRegular, darkNavy);

  // Location
  drawText(data.lotNo || "Lot 12", 180, 668.5, 7.5, true);
  drawText(data.blockNo || "Blk 4", 264, 668.5, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 355, 668.5, 7.5, true, 16);
  drawText(data.taxDecNo || "TD-2026-0012", 484, 668.5, 7.5, false);

  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 65, 651.0, 7.5, false, 24);
  drawText(data.barangay || "Sapa (Santo Nino)", 280, 651.0, 7.5, true, 20);
  // Municipality: Sto. Tomas is already preprinted in bold on the Sto. Tomas form template

  // 1. SCOPE OF WORK (All 11 Official Boxes matching NBC Form A-01)
  const scopeNorm = (data.scopeOfWork || "New Construction").toLowerCase().trim();
  const scopeDetails = (data.scopeOfWorkDetails || data.scopeOthers || "").trim();

  if (scopeNorm.includes("erect")) {
    drawCheck(46.5, 609.3);
  } else if (scopeNorm.includes("add")) {
    drawCheck(46.5, 597.9);
  } else if (scopeNorm.includes("alter")) {
    drawCheck(46.5, 586.7);
  } else if (scopeNorm.includes("renov")) {
    drawCheck(180.1, 620.5);
    if (scopeDetails) drawText(scopeDetails, 240, 620.5, 7.0, false, 24);
  } else if (scopeNorm.includes("convert")) {
    drawCheck(180.1, 609.3);
    if (scopeDetails) drawText(scopeDetails, 240, 609.3, 7.0, false, 24);
  } else if (scopeNorm.includes("repair")) {
    drawCheck(180.1, 597.9);
    if (scopeDetails) drawText(scopeDetails, 222, 597.9, 7.0, false, 26);
  } else if (scopeNorm.includes("mov")) {
    drawCheck(180.1, 586.7);
    if (scopeDetails) drawText(scopeDetails, 226, 586.7, 7.0, false, 26);
  } else if (scopeNorm.includes("rais")) {
    drawCheck(370.5, 620.5);
    if (scopeDetails) drawText(scopeDetails, 418, 620.5, 7.0, false, 28);
  } else if (scopeNorm.includes("accessory")) {
    drawCheck(370.5, 609.3);
    if (scopeDetails) drawText(scopeDetails, 502, 609.3, 7.0, false, 15);
  } else if (scopeNorm.includes("other")) {
    drawCheck(370.5, 597.9);
    if (scopeDetails) drawText(scopeDetails, 442, 597.9, 7.0, false, 25);
  } else {
    // Default: New Construction
    drawCheck(46.5, 620.5);
  }

  // 2. BOX 2: 2. PERCENTAGE OF SITE OCCUPANCY
  let footprintPercent = data.percentBuildingFootprint;
  if (!footprintPercent && data.buildingFootprint && data.lotArea) {
    const bf = parseFloat(data.buildingFootprint);
    const la = parseFloat(data.lotArea);
    if (!isNaN(bf) && !isNaN(la) && la > 0) {
      footprintPercent = ((bf / la) * 100).toFixed(2);
    }
  }
  drawText(footprintPercent || "55.00", 185.0, 449.0, 7.5, false);
  drawText(data.percentImperviousSurface || "25.00", 202.0, 435.0, 7.5, false);
  drawText(data.percentUnpavedSurface || "20.00", 192.0, 421.0, 7.5, false);
  if (data.percentSiteOccupancyOthers) {
    drawText(data.percentSiteOccupancyOthers, 108.0, 407.5, 7.5, false);
  }

  // 3. BOX 2: 3. CONFORMANCE TO FIRE CODE OF THE PHILIPPINES (P.D. 1185)
  if (data.fireCodeExitDoors !== false) drawCheck(246.5, 447.5);
  if (data.fireCodeCorridors !== false) drawCheck(246.5, 433.5);
  if (data.fireCodeDistanceExits !== false) drawCheck(246.5, 420.5);
  if (data.fireCodeAccessStreet !== false) drawCheck(246.5, 407.0);
  if (data.fireCodeFireWalls !== false) drawCheck(381.0, 448.0);
  if (data.fireCodeFireFighting) drawCheck(381.0, 434.0);
  if (data.fireCodeSmokeDetectors !== false) drawCheck(381.0, 420.0);
  if (data.fireCodeEmergencyLights !== false) drawCheck(381.0, 406.0);
  if (data.fireCodeOthers) {
    drawCheck(453.0, 448.0);
    drawText(data.fireCodeOthers, 492, 448.0, 7.0, false, 15);
  }

  // Box 3: DESIGN PROFESSIONAL, PLANS AND SPECIFICATION (Architect)
  const archName = data.architectName || "ARCH. MARIA ELENA SANTOS, UAP";
  drawText(archName.toUpperCase(), 65, 300.0, 8.5, true);
  drawText(data.architectAddress || "Sto. Tomas, Pampanga", 75, 258.0, 7.5, false);
  drawText(data.architectIAPOA || "IAPOA-2026-9988", 75, 240.0, 7.5, false);
  drawText(data.architectIAPOAValidity || "2028-12-31", 215, 240.0, 7.5, false);
  drawText(data.architectPRC || "0045211", 75, 228.0, 7.5, false);
  drawText(data.architectPRCValidity || "2028-09-15", 215, 228.0, 7.5, false);
  drawText(data.architectPTR || "PTR-ST-665544", 75, 216.0, 7.5, false);
  const rawArchPtrDate = data.architectPTRIssued || "Jan 08, 2026";
  const archPtrDateOnly = rawArchPtrDate.includes("/") ? rawArchPtrDate.split("/")[1].trim() : rawArchPtrDate;
  drawText(archPtrDateOnly, 215, 216.0, 7.5, false);
  drawText(data.architectPTRIssuedAt || "Sto. Tomas", 75, 198.0, 7.5, false);
  drawText(data.architectTIN || "234-567-890-000", 205, 198.0, 7.5, false);

  // Box 4: SUPERVISOR / IN-CHARGE OF ARCHITECTURAL WORKS
  const isSameArch = data.sameAsDesignArchitect ?? false;
  const supName = isSameArch
    ? (data.architectName || "ARCH. MARIA ELENA SANTOS, UAP")
    : (data.supervisorArchitectName || "ARCH. JUAN CARLOS REYES, UAP");
  const supAddress = isSameArch
    ? (data.architectAddress || "Sto. Tomas, Pampanga")
    : (data.supervisorArchitectAddress || "Sto. Tomas, Pampanga");
  const supIAPOA = isSameArch
    ? (data.architectIAPOA || "IAPOA-2026-9988")
    : (data.supervisorArchitectIAPOA || "IAPOA-2026-8877");
  const supIAPOAValidity = isSameArch
    ? (data.architectIAPOAValidity || "2028-12-31")
    : (data.supervisorArchitectIAPOAValidity || "2027-12-31");
  const supPRC = isSameArch
    ? (data.architectPRC || "0045211")
    : (data.supervisorArchitectPRC || "0056123");
  const supPRCValidity = isSameArch
    ? (data.architectPRCValidity || "2028-09-15")
    : (data.supervisorArchitectPRCValidity || "2027-08-20");
  const supPTR = isSameArch
    ? (data.architectPTR || "PTR-ST-665544")
    : (data.supervisorArchitectPTR || "PTR-ST-778899");
  const rawSupPtrDate = isSameArch
    ? (data.architectPTRIssued || "Jan 08, 2026")
    : (data.supervisorArchitectPTRIssued || "Jan 10, 2026");
  const supPtrDateOnly = rawSupPtrDate.includes("/") ? rawSupPtrDate.split("/")[1].trim() : rawSupPtrDate;
  const supPTRIssuedAt = isSameArch
    ? (data.architectPTRIssuedAt || "Sto. Tomas")
    : (data.supervisorArchitectPTRIssuedAt || "Sto. Tomas");
  const supTIN = isSameArch
    ? (data.architectTIN || "234-567-890-000")
    : (data.supervisorArchitectTIN || "345-678-901-000");

  drawText(supName.toUpperCase(), 345, 300.0, 8.5, true);
  drawText(supAddress, 355, 258.0, 7.5, false);
  drawText(supIAPOA, 355, 240.0, 7.5, false);
  drawText(supIAPOAValidity, 495, 240.0, 7.5, false);
  drawText(supPRC, 355, 228.0, 7.5, false);
  drawText(supPRCValidity, 495, 228.0, 7.5, false);
  drawText(supPTR, 355, 216.0, 7.5, false);
  drawText(supPtrDateOnly, 495, 216.0, 7.5, false);
  drawText(supPTRIssuedAt, 355, 198.0, 7.5, false);
  drawText(supTIN, 485, 198.0, 7.5, false);

  // Box 5: Building Owner
  const applicantUpper = (data.applicantName || "JUAN DELA CRUZ").toUpperCase().trim();
  const nameWidth = fontBold.widthOfTextAtSize(applicantUpper, 8.5);
  // Signature line is from x=73.6 to x=238.8, center is 156.2
  const nameX = 156.2 - (nameWidth / 2);
  drawText(applicantUpper, nameX, 111.5, 8.5, true);

  // Embed user's authentic E-Signature if provided
  if (data.applicantSignature) {
    const sigW = 105;
    const sigH = 26;
    const sigX = Math.max(72.0, 156.2 - sigW / 2);
    await embedSignatureImage(doc, p1, data.applicantSignature, sigX, 117.0, sigW, sigH);
  }

  // Date on line
  drawText(data.submissionDate || data.govIdDateIssued || "Jan 08, 2026", 136.0, 89.0, 7.2, false);

  // Address - centered cleanly in cell between borders y=58.7 and y=72.4
  const rawAddr = safeText(data.applicantAddress || data.projectAddress || "Sto. Tomas, Pampanga").trim();
  let addrSize = 7.0;
  const maxAddrW = 220;
  const addrW = fontRegular.widthOfTextAtSize(rawAddr, addrSize);
  if (addrW > maxAddrW) {
    addrSize = Math.max(5.5, addrSize * (maxAddrW / addrW));
  }
  p1.drawText(rawAddr, { x: 65.0, y: 63.5, size: addrSize, font: fontRegular, color: darkNavy });

  // C.T.C. No. - fit inside Column 1 (x=26.8 to 114.0) without overflowing into "Date Issued"
  const rawAppCtc = (data.applicantCtcNo || data.govIdNo || "00192847").trim();
  let cleanAppCtc = rawAppCtc.replace(/^[a-zA-Z\s-]+/g, "").trim();
  if (!cleanAppCtc) cleanAppCtc = rawAppCtc;
  if (cleanAppCtc.length > 9) cleanAppCtc = cleanAppCtc.slice(0, 9);
  const appCtcFontSize = cleanAppCtc.length > 8 ? 5.5 : cleanAppCtc.length > 6 ? 6.0 : 6.5;
  p1.drawText(cleanAppCtc, { x: 68.0, y: 50.0, size: appCtcFontSize, font: fontRegular, color: darkNavy });

  // Date Issued - fit inside Column 2 (x=114.5 to 201.6)
  const rawDateIssued = safeText(data.govIdDateIssued || "Jan 10, 2024").trim();
  let dateIssuedSize = 6.8;
  const maxDateW = 40.0;
  const dateW = fontRegular.widthOfTextAtSize(rawDateIssued, dateIssuedSize);
  if (dateW > maxDateW) {
    dateIssuedSize = Math.max(5.0, dateIssuedSize * (maxDateW / dateW));
  }
  p1.drawText(rawDateIssued, { x: 159.0, y: 50.0, size: dateIssuedSize, font: fontRegular, color: darkNavy });

  // Place Issued - fit inside Column 3 (x=202.1 to 289.3)
  const rawPlaceIssued = safeText(data.govIdPlaceIssued || "Sto. Tomas").trim();
  let placeIssuedSize = 6.8;
  const maxPlaceW = 38.0;
  const placeW = fontRegular.widthOfTextAtSize(rawPlaceIssued, placeIssuedSize);
  if (placeW > maxPlaceW) {
    placeIssuedSize = Math.max(5.0, placeIssuedSize * (maxPlaceW / placeW));
  }
  p1.drawText(rawPlaceIssued, { x: 248.5, y: 50.0, size: placeIssuedSize, font: fontRegular, color: darkNavy });

  // Box 6: WITH MY CONSENT: LOT OWNER
  if (data.lotOwnerConsent || data.lotOwnerName) {
    const lotUpper = safeText(data.lotOwnerName || "Dave Sicat").toUpperCase().trim();
    const lotNameW = fontBold.widthOfTextAtSize(lotUpper, 8.5);
    const lotNameX = Math.max(345.0, 433.4 - (lotNameW / 2));
    drawText(lotUpper, lotNameX, 111.5, 8.5, true);

    if (data.lotOwnerSignature) {
      const sigW = 105;
      const sigH = 26;
      const sigX = Math.max(345.0, 433.4 - sigW / 2);
      await embedSignatureImage(doc, p1, data.lotOwnerSignature, sigX, 117.0, sigW, sigH);
    }

    drawText(data.lotOwnerSignedDate || data.submissionDate || "Jan 08, 2026", 412.0, 89.0, 7.2, false);

    const rawLotAddr = safeText(data.lotOwnerAddress || data.projectAddress || "153 Sitio Visitas").trim();
    let lotAddrSize = 7.0;
    const maxLotAddrW = 220;
    const lotAddrW = fontRegular.widthOfTextAtSize(rawLotAddr, lotAddrSize);
    if (lotAddrW > maxLotAddrW) {
      lotAddrSize = Math.max(5.5, lotAddrSize * (maxLotAddrW / lotAddrW));
    }
    p1.drawText(rawLotAddr, { x: 345.0, y: 63.5, size: lotAddrSize, font: fontRegular, color: darkNavy });

    const rawLotCtc = (data.lotOwnerGovIdNo || data.lotOwnerCtcNo || "00881923").trim();
    let cleanLotCtc = rawLotCtc.replace(/^[a-zA-Z\s-]+/g, "").trim();
    if (!cleanLotCtc) cleanLotCtc = rawLotCtc;
    if (cleanLotCtc.length > 9) cleanLotCtc = cleanLotCtc.slice(0, 9);
    const lotCtcFontSize = cleanLotCtc.length > 8 ? 5.5 : cleanLotCtc.length > 6 ? 6.0 : 6.5;
    p1.drawText(cleanLotCtc, { x: 346.0, y: 50.0, size: lotCtcFontSize, font: fontRegular, color: darkNavy });

    const rawLotDate = safeText(data.lotOwnerGovIdDateIssued || "Jan 10, 2024").trim();
    if (rawLotDate) {
      drawText(rawLotDate, 436.0, 50.0, 6.5, false);
    }
    const rawLotPlace = safeText(data.lotOwnerGovIdPlaceIssued || "Sto. Tomas").trim();
    if (rawLotPlace) {
      drawText(rawLotPlace, 525.5, 50.0, 6.5, false);
    }
  }

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

  // Header: APPLICATION NO. in individual segmented boxes (10 boxes)
  const rawSpAppNo = (data.applicationNo || "2026-0001").trim();
  const cleanSpAppNo = rawSpAppNo.replace(/^APP-(TEST-)?/i, "");
  const spAppChars = cleanSpAppNo.split("");
  const spAppBoxLefts = [29.0, 41.0, 53.0, 65.0, 77.0, 89.0, 101.0, 113.0, 125.0, 136.0];
  spAppBoxLefts.forEach((boxLeft, idx) => {
    if (idx < spAppChars.length) {
      const char = spAppChars[idx];
      const charWidth = fontBold.widthOfTextAtSize(char, 9);
      const charX = boxLeft + (12.0 - charWidth) / 2;
      p1.drawText(char, { x: charX, y: 699.5, size: 9, font: fontBold, color: darkNavy });
    }
  });

  // Header: C/SP NO (Structural Permit No.) in individual boxes (10 boxes)
  const rawSpNo = (data.permitNo || data.structuralPermitNo || `SP-${cleanSpAppNo}`).trim();
  const cleanSpNo = rawSpNo.replace(/^(SP|C\/SP|APP)-(TEST-)?/i, "").trim();
  const spChars = cleanSpNo.split("");
  const spBoxLefts = [237.0, 249.0, 261.0, 273.0, 285.0, 297.0, 309.0, 321.0, 333.0, 345.0];
  spBoxLefts.forEach((boxLeft, idx) => {
    if (idx < spChars.length) {
      const char = spChars[idx];
      const charWidth = fontBold.widthOfTextAtSize(char, 9);
      const charX = boxLeft + (12.0 - charWidth) / 2;
      p1.drawText(char, { x: charX, y: 699.5, size: 9, font: fontBold, color: darkNavy });
    }
  });

  // Header: BUILDING PERMIT NO. in individual boxes (10 boxes)
  // Auto-gathered if project is associated with a Building Permit, or if buildingPermitNo is provided
  const isSpBpRequired = !data.projectType || data.projectType.matrix?.buildingPermit === 'required' || data.projectType.matrix?.buildingPermit === 'conditional';
  const rawSpBpNo = (data.buildingPermitNo || (isSpBpRequired ? (data.applicationNo ? `BP-${cleanSpAppNo}` : "BP-2026-0001") : "")).trim();
  if (rawSpBpNo) {
    const cleanBpNo = rawSpBpNo.replace(/^(BP|APP|NBC)[\s\-#:]*(TEST-)?/i, "").trim();
    const bpChars = cleanBpNo.split("");
    const bpBoxLefts = [434.0, 446.0, 458.0, 470.0, 482.0, 494.0, 506.0, 518.0, 530.0, 542.0];
    bpBoxLefts.forEach((boxLeft, idx) => {
      if (idx < bpChars.length) {
        const char = bpChars[idx];
        const charWidth = fontBold.widthOfTextAtSize(char, 9);
        const charX = boxLeft + (12.0 - charWidth) / 2;
        p1.drawText(char, { x: charX, y: 699.5, size: 9, font: fontBold, color: darkNavy });
      }
    });
  }

  // Box 1
  const { lastName, firstName, mi } = parseApplicantName(data);
  drawText(lastName, 160, 641.0, 8.5, true, 20);
  drawText(firstName, 275, 641.0, 8.5, true, 22);
  drawText(mi, 422, 641.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 472, 641.0, 8, false);

  // Row 2: FOR CONSTRUCTION OWNED BY AN ENTERPRISE | FORM OF OWNERSHIP | USE OR CHARACTER OF OCCUPANCY
  const structEnterprise = data.constructionOwnedByEnterprise || data.corporationName || data.enterpriseName || (data.formOfOwnership?.includes("INDIVIDUAL") ? "N/A" : "");
  if (structEnterprise && structEnterprise !== "N/A") {
    drawText(structEnterprise.toUpperCase(), 104, 615.0, 7.5, false, 24);
  } else if (structEnterprise === "N/A") {
    drawText("N/A", 104, 615.0, 7.5, false);
  }
  const spFormText = (data.formOfOwnership || "INDIVIDUAL / OWNER").toUpperCase();
  const spFormWidth = fontBold.widthOfTextAtSize(spFormText, 8);
  p1.drawText(spFormText, { x: 275 - spFormWidth / 2, y: 615.0, size: 8, font: fontBold, color: darkNavy });

  const spOccText = resolveOccupancyDetailText(data);
  const spOccFontSize = spOccText.length > 36 ? 6.2 : spOccText.length > 28 ? 7.0 : 7.5;
  const spOccWidth = fontBold.widthOfTextAtSize(spOccText, spOccFontSize);
  const spOccX = Math.max(368, 470 - spOccWidth / 2);
  p1.drawText(spOccText, { x: spOccX, y: 615.0, size: spOccFontSize, font: fontBold, color: darkNavy });

  // Address
  const spAddr = parseApplicantAddress(data);
  drawText(spAddr.noStreet, 85, 587.0, 7.5, false, 25);
  drawText(spAddr.barangay, 200, 587.0, 7.5, false, 18);
  drawText(spAddr.municipality, 295, 587.0, 7.0, false, 25);
  drawText(spAddr.zipCode, 398, 587.0, 7.5, false);
  drawContactAndEmail(p1, spAddr.contactNo, spAddr.email, 435, 587.0, fontBold, fontRegular, darkNavy);

  // Location
  drawText(data.lotNo || "Lot 12", 180, 567.5, 7.5, true);
  drawText(data.blockNo || "Blk 4", 264, 567.5, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 345, 567.5, 7.5, true, 16);
  drawText(data.taxDecNo || "TD-2026-0012", 465, 567.5, 7.5, false);

  drawText(data.projectAddress || "Lawasn St., Blue Diamond", 65, 550.0, 7.0, false, 13);
  drawText(data.barangay || "Sapa (Santo Nino)", 185, 550.0, 7.5, true, 18);
  // Municipality: cover any misplaced floating text and draw cleanly aligned on the underline
  p1.drawRectangle({
    x: 395.0,
    y: 556.0,
    width: 48.0,
    height: 8.5,
    color: rgb(1, 1, 1),
  });
  const spMunicipality = (data.applicantMunicipality || "Sto. Tomas").trim();
  drawText(spMunicipality, 425, 550.0, 7.5, true, 25);

  // Scope of Work (All 12 Official Checkboxes matching NBC Form S-01)
  const scopeNorm = (data.scopeOfWork || "New Construction").toLowerCase().trim();
  const scopeDetails = (data.scopeOfWorkDetails || data.scopeOthers || "").trim();

  // Column 1: NEW CONSTRUCTION, ERECTION, ADDITION, ALTERATION
  if (scopeNorm.includes("erect")) {
    drawCheck(47.0, 509.0);
  } else if (scopeNorm.includes("add")) {
    drawCheck(47.0, 498.0);
  } else if (scopeNorm.includes("alter")) {
    drawCheck(47.0, 487.0);
    // Column 2: RENOVATION, CONVERSION, REPAIR, MOVING
  } else if (scopeNorm.includes("renov")) {
    drawCheck(174.5, 520.0);
    if (scopeDetails) drawText(scopeDetails, 240, 520.0, 7.0, false, 24);
  } else if (scopeNorm.includes("convert")) {
    drawCheck(174.5, 509.0);
    if (scopeDetails) drawText(scopeDetails, 240, 509.0, 7.0, false, 24);
  } else if (scopeNorm.includes("repair")) {
    drawCheck(174.5, 498.0);
    if (scopeDetails) drawText(scopeDetails, 222, 498.0, 7.0, false, 26);
  } else if (scopeNorm.includes("mov")) {
    drawCheck(174.5, 487.0);
    if (scopeDetails) drawText(scopeDetails, 226, 487.0, 7.0, false, 26);
    // Column 3: RAISING, DEMOLITION, ACCESSORY BUILDING/STRUCTURE, OTHERS
  } else if (scopeNorm.includes("rais")) {
    drawCheck(355.5, 520.0);
    if (scopeDetails) drawText(scopeDetails, 400, 520.0, 7.0, false, 26);
  } else if (scopeNorm.includes("demoli")) {
    drawCheck(355.5, 509.0);
    if (scopeDetails) drawText(scopeDetails, 420, 509.0, 7.0, false, 24);
  } else if (scopeNorm.includes("accessory")) {
    drawCheck(355.5, 498.0);
    if (scopeDetails) drawText(scopeDetails, 515, 498.0, 7.0, false, 14);
  } else if (scopeNorm.includes("other")) {
    drawCheck(355.5, 487.0);
    if (scopeDetails) drawText(scopeDetails, 445, 487.0, 7.0, false, 24);
  } else {
    // Default: New Construction
    drawCheck(47.0, 520.0);
  }

  // Box 2: Nature of Civil/Structural Works - left clean (to be accomplished by the design professional)

  // Box 3: DESIGN PROFESSIONAL, PLANS AND SPECIFICATIONS (Civil / Structural Engineer)
  const ceName = (data.civilEngineerName || "Engr. Roberto Cruz, CE").trim();
  const ceUpper = ceName.toUpperCase();
  const ceNameW = fontBold.widthOfTextAtSize(ceUpper, 8.5);
  const ceNameX = 140.0 - (ceNameW / 2);
  drawText(ceUpper, ceNameX, 288.0, 8.5, true);

  if (data.civilEngineerSignature) {
    await embedSignatureImage(doc, p1, data.civilEngineerSignature, 140.0 - 55, 282.0, 110, 32);
  }

  const rawCeDate = data.civilEngineerSignedDate || data.submissionDate || "Jan 08, 2026";
  drawText(rawCeDate, 120, 264.5, 7.5, false);

  const ceAddr = data.civilEngineerAddress || "Sto. Tomas, Pampanga";
  drawText(ceAddr, 75, 252.5, 7.5, false, 35);

  drawText(data.civilEngineerPRC || "0078923", 75, 240.5, 7.5, false, 12);
  drawText(data.civilEngineerPRCValidity || "2028-12-31", 190, 240.5, 7.5, false, 12);

  drawText(data.civilEngineerPTR || "PTR-ST-2026-001", 75, 228.0, 7.5, false, 18);
  const rawCePtrDate = data.civilEngineerPTRIssued || "Jan 05, 2026";
  const cePtrDate = rawCePtrDate.includes("/") ? rawCePtrDate.split("/")[1].trim() : rawCePtrDate;
  drawText(cePtrDate, 205, 228.0, 7.5, false, 14);

  drawText(data.civilEngineerPTRIssuedAt || "Sto. Tomas", 75, 215.0, 7.5, false, 15);
  drawText(data.civilEngineerTIN || "123-456-789-000", 175, 215.0, 7.5, false, 18);

  // Box 4: SUPERVISOR / IN-CHARGE OF CIVIL/STRUCTURAL WORKS
  const isCeSame = data.sameAsDesignCivilEngineer !== false && (data.sameAsDesignCivilEngineer || !data.supervisorCivilEngineerName);
  const supCeName = (isCeSame ? (data.civilEngineerName || "Engr. Roberto Cruz, CE") : (data.supervisorCivilEngineerName || data.civilEngineerName || "Engr. Roberto Cruz, CE")).trim();
  const supCeUpper = supCeName.toUpperCase();
  const supCeNameW = fontBold.widthOfTextAtSize(supCeUpper, 8.5);
  const supCeNameX = 410.0 - (supCeNameW / 2);
  drawText(supCeUpper, supCeNameX, 290.0, 8.5, true);

  const supCeSig = isCeSame
    ? (data.civilEngineerSignature || data.supervisorCivilEngineerSignature)
    : (data.supervisorCivilEngineerSignature || data.civilEngineerSignature);
  if (supCeSig) {
    await embedSignatureImage(doc, p1, supCeSig, 410.0 - 55, 284.0, 110, 32);
  }

  const rawSupCeDate = (isCeSame ? rawCeDate : (data.supervisorCivilEngineerSignedDate || rawCeDate));
  drawText(rawSupCeDate, 386, 266.0, 7.5, false);

  const supCeAddr = (isCeSame ? (data.civilEngineerAddress || "Sto. Tomas, Pampanga") : (data.supervisorCivilEngineerAddress || data.civilEngineerAddress || "Sto. Tomas, Pampanga")).trim();
  drawText(supCeAddr, 345, 254.5, 7.5, false, 30);

  const supCePRC = (isCeSame ? (data.civilEngineerPRC || "0078923") : (data.supervisorCivilEngineerPRC || data.civilEngineerPRC || "0078923")).trim();
  drawText(supCePRC, 347, 242.5, 7.5, false, 10);

  const supCePRCVal = (isCeSame ? (data.civilEngineerPRCValidity || "2028-12-31") : (data.supervisorCivilEngineerPRCValidity || data.civilEngineerPRCValidity || "2028-12-31")).trim();
  drawText(supCePRCVal, 468, 242.5, 7.5, false, 12);

  const supCePTR = (isCeSame ? (data.civilEngineerPTR || "PTR-ST-001") : (data.supervisorCivilEngineerPTR || data.civilEngineerPTR || "PTR-ST-001")).trim();
  drawText(supCePTR, 347, 230.5, 7.5, false, 12);

  const rawSupCePtrDate = isCeSame ? cePtrDate : (data.supervisorCivilEngineerPTRIssued || cePtrDate);
  const supCePtrDate = rawSupCePtrDate.includes("/") ? rawSupCePtrDate.split("/")[1].trim() : rawSupCePtrDate;
  drawText(supCePtrDate, 485, 230.5, 7.5, false, 12);

  const supCePTRIssuedAt = (isCeSame ? (data.civilEngineerPTRIssuedAt || "Sto. Tomas") : (data.supervisorCivilEngineerPTRIssuedAt || data.civilEngineerPTRIssuedAt || "Sto. Tomas")).trim();
  drawText(supCePTRIssuedAt, 347, 217.0, 7.5, false, 12);

  const supCeTIN = (isCeSame ? (data.civilEngineerTIN || "123-456-789-000") : (data.supervisorCivilEngineerTIN || data.civilEngineerTIN || "123-456-789-000")).trim();
  drawText(supCeTIN, 452, 217.0, 7.5, false, 16);

  // Box 5: BUILDING OWNER
  const ownerUpper = (data.applicantName || "JUAN DELA CRUZ").toUpperCase();
  const ownerNameW = fontBold.widthOfTextAtSize(ownerUpper, 8.5);
  const ownerNameX = 157.5 - (ownerNameW / 2);
  drawText(ownerUpper, ownerNameX, 152.5, 8.5, true);

  if (data.applicantSignature) {
    await embedSignatureImage(doc, p1, data.applicantSignature, 157.5 - 55, 147.0, 110, 32);
  }

  const rawOwnerDate = data.applicantSignedDate || data.submissionDate || "Jan 08, 2026";
  drawText(rawOwnerDate, 135.0, 135.5, 7.5, false);

  const ownerAddr = data.applicantAddress || data.projectAddress || "Sto. Tomas, Pampanga";
  drawText(ownerAddr, 75.0, 114.0, 7.5, false, 45);

  const rawAppCtc = (data.applicantCtcNo || data.govIdNo || "CTC-2026-00192").trim();
  let cleanAppCtc = rawAppCtc.replace(/^[a-zA-Z\s-]+/g, "").trim() || rawAppCtc;
  if (cleanAppCtc.length > 9) cleanAppCtc = cleanAppCtc.slice(0, 9);
  const appCtcFontSize = cleanAppCtc.length > 8 ? 5.5 : cleanAppCtc.length > 6 ? 6.0 : 6.5;
  drawText(cleanAppCtc, 55.0, 92.0, appCtcFontSize, false, 12);
  drawText(data.govIdDateIssued || "Jan 10, 2026", 115.0, 92.0, 6.8, false, 14);
  drawText(data.govIdPlaceIssued || "Sto. Tomas", 185.0, 92.0, 6.8, false, 15);

  // Box 6: WITH MY CONSENT: LOT OWNER
  if (data.lotOwnerConsent || data.lotOwnerName) {
    const lotUpper = safeText(data.lotOwnerName || "MARIA CLARA DELA CRUZ").toUpperCase().trim();
    const lotNameW = fontBold.widthOfTextAtSize(lotUpper, 8.5);
    const lotNameX = Math.max(345.0, 420.0 - (lotNameW / 2));
    drawText(lotUpper, lotNameX, 157.0, 8.5, true);

    if (data.lotOwnerSignature) {
      const sigW = 100;
      const sigH = 20;
      const sigX = Math.max(345.0, 420.0 - sigW / 2);
      await embedSignatureImage(doc, p1, data.lotOwnerSignature, sigX, 156.0, sigW, sigH);
    }

    const rawLotDate = data.lotOwnerSignedDate || rawOwnerDate;
    drawText(rawLotDate, 400.0, 136.5, 7.2, false);

    const lotAddr = safeText(data.lotOwnerAddress || data.projectAddress || "Sto. Tomas, Pampanga").trim();
    drawText(lotAddr, 350.0, 116.0, 7.5, false, 45);

    const rawLotCtc = (data.lotOwnerGovIdNo || data.lotOwnerCtcNo || "00871923").trim();
    let cleanLotCtc = rawLotCtc.replace(/^[a-zA-Z\s-]+/g, "").trim();
    if (!cleanLotCtc) cleanLotCtc = rawLotCtc;
    if (cleanLotCtc.length > 9) cleanLotCtc = cleanLotCtc.slice(0, 9);
    const lotCtcFontSize = cleanLotCtc.length > 8 ? 5.5 : cleanLotCtc.length > 6 ? 6.0 : 6.5;
    drawText(cleanLotCtc, 340.0, 93.0, lotCtcFontSize, false, 12);

    const lotDate = safeText(data.lotOwnerGovIdDateIssued || "Jan 12, 2026").trim();
    drawText(lotDate, 390.0, 93.0, 6.8, false, 14);

    const lotPlace = safeText(data.lotOwnerGovIdPlaceIssued || "Sto. Tomas").trim();
    drawText(lotPlace, 465.0, 93.0, 6.8, false, 15);
  }

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

  // Header: APPLICATION NO. & DATE APPLICATION FILED inside boxes, and Dates above underlines
  const appNo = safeText(data.applicationNo || "APP-2026-6636").trim();
  const appNoW = fontBold.widthOfTextAtSize(appNo, 8.5);
  const appNoX = 98.5 - (appNoW / 2);
  drawText(appNo, appNoX, 782.5, 8.5, true);

  const fileDate = safeText(data.submissionDate || "Sep 17, 2026").trim();
  const fileDateW = fontRegular.widthOfTextAtSize(fileDate, 8.0);
  const fileDateX = 487.75 - (fileDateW / 2);
  drawText(fileDate, fileDateX, 782.5, 8.0, false);

  const startDate = safeText(data.proposedStartDate || "Sep 17, 2026").trim();
  const startW = fontRegular.widthOfTextAtSize(startDate, 7.5);
  const startX = 96.25 - (startW / 2);
  drawText(startDate, startX, 762.0, 7.5, false);

  const expDate = safeText(data.expectedCompletionDate || "WITHIN 180 DAYS").trim();
  const expDateW = fontRegular.widthOfTextAtSize(expDate, 7.5);
  const expDateX = 488.875 - (expDateW / 2);
  drawText(expDate, expDateX, 762.0, 7.5, false);

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

  // Scope of Work
  const scopeNorm = (data.scopeOfWork || "").toLowerCase();
  const scopeDetails = (data.scopeOfWorkDetails || data.scopeOthers || "").trim();

  if (scopeNorm.includes("annual")) {
    drawCheck(52.0, 619.0); // [X] Annual Inspection
  } else if (scopeNorm.includes("addition")) {
    drawCheck(207.0, 634.0); // [X] Addition Of
    if (scopeDetails) drawText(scopeDetails, 270.0, 635.5, 7.0, false, 25);
  } else if (scopeNorm.includes("repair")) {
    drawCheck(207.0, 626.0); // [X] Repair Of
    if (scopeDetails) drawText(scopeDetails, 260.0, 627.5, 7.0, false, 25);
  } else if (scopeNorm.includes("remov") || scopeNorm.includes("mov")) {
    drawCheck(207.0, 618.0); // [X] Removal Of
    if (scopeDetails) drawText(scopeDetails, 270.0, 619.5, 7.0, false, 25);
  } else if (scopeNorm.includes("other") || scopeNorm.includes("renov") || scopeNorm.includes("alter") || scopeNorm.includes("erect") || scopeNorm.includes("conver") || scopeNorm.includes("rais") || scopeNorm.includes("demoli") || scopeNorm.includes("accessor")) {
    if (scopeNorm.includes("other")) {
      drawCheck(363.0, 634.0); // [X] Others (Specify)
      if (scopeDetails) drawText(scopeDetails, 450.0, 633.0, 7.0, false, 25);
    } else {
      drawCheck(52.0, 627.0); // [X] New Installation
    }
  } else {
    // Default: New Installation
    drawCheck(52.0, 627.0);
  }

  // Type of Occupancy (NBC Form E-01)
  const rawOcc = (data.occupancyClassificationDetail || data.occupancyClass || data.projectType?.category || "").trim();
  const occNorm = rawOcc.toUpperCase();

  if (
    occNorm.startsWith("A.") ||
    occNorm.includes("RESIDENTIAL DWELLING") ||
    occNorm.includes("SINGLE FAMILY") ||
    occNorm.includes("DUPLEX") ||
    occNorm.includes("GROUP A") ||
    occNorm === "RESIDENTIAL"
  ) {
    drawCheck(31.5, 594.0); // [X] A. Residential Dwelling
  } else if (
    occNorm.startsWith("B.") ||
    occNorm.includes("HOTEL") ||
    occNorm.includes("APARTMENT") ||
    occNorm.includes("TOWNHOUSE") ||
    occNorm.includes("DORMITORY") ||
    occNorm.includes("GROUP B")
  ) {
    drawCheck(31.5, 586.0); // [X] B. Residential, Hotel, Apartment
  } else if (
    occNorm.startsWith("C.") ||
    occNorm.includes("EDUCATION") ||
    (occNorm.includes("RECREATION") && !occNorm.includes("ASSEMBLY")) ||
    occNorm.includes("SCHOOL") ||
    occNorm.includes("CHURCH") ||
    occNorm.includes("GROUP C")
  ) {
    drawCheck(31.5, 578.0); // [X] C. Education and Recreation
  } else if (
    occNorm.startsWith("D.") ||
    occNorm.includes("INSTITUTIONAL") ||
    occNorm.includes("HOSPITAL") ||
    occNorm.includes("MEDICAL") ||
    occNorm.includes("HOME FOR THE AGED") ||
    occNorm.includes("GOVERNMENT OFFICE") ||
    occNorm.includes("GROUP D")
  ) {
    drawCheck(31.5, 569.0); // [X] D. Institutional
  } else if (
    occNorm.startsWith("K.") ||
    occNorm.includes("ASSEMBLY OTHER THAN") ||
    occNorm.includes("< 1,000") ||
    occNorm.includes("< 1000") ||
    occNorm.includes("THEATER") ||
    occNorm.includes("AUDITORIUM") ||
    occNorm.includes("GROUP H")
  ) {
    drawCheck(205.5, 569.5); // [X] K. Assembly Other Than Group I
  } else if (
    occNorm.startsWith("E.") ||
    occNorm.includes("1000 OR MORE") ||
    occNorm.includes("1,000 OR MORE") ||
    occNorm.includes("1000+") ||
    occNorm.includes("1,000+") ||
    occNorm.includes("COLISEUM") ||
    occNorm.includes("CONVENTION CENTER") ||
    occNorm.startsWith("GROUP I")
  ) {
    drawCheck(373.5, 594.0); // [X] E. Assembly Occupant Load 1000 or More
  } else if (
    occNorm.startsWith("F.") ||
    occNorm.includes("ACCESSORY") ||
    occNorm.includes("CARPORT") ||
    occNorm.includes("GARAGE") ||
    occNorm.includes("SWIMMING POOL") ||
    occNorm.includes("GROUP J")
  ) {
    drawCheck(373.5, 586.0); // [X] F. Accessory
  } else if (
    occNorm.startsWith("H.") ||
    occNorm.includes("BUSINESS") ||
    occNorm.includes("MERCANTILE") ||
    occNorm.includes("COMMERCIAL") ||
    occNorm.includes("BANK") ||
    occNorm.includes("STORE") ||
    occNorm.includes("RETAIL") ||
    occNorm.includes("MALL") ||
    occNorm.includes("DINING") ||
    occNorm.includes("SHOP") ||
    occNorm.startsWith("GROUP E")
  ) {
    drawCheck(205.5, 594.0); // [X] H. Business and Mercantile
  } else if (
    occNorm.startsWith("I.") ||
    occNorm.startsWith("GROUP F") ||
    (occNorm.includes("INDUSTRIAL") && !occNorm.includes("STORAGE") && !occNorm.includes("HAZARDOUS")) ||
    occNorm.includes("FACTORY") ||
    occNorm.includes("PLANT")
  ) {
    drawCheck(205.5, 585.5); // [X] I. Industrial
  } else if (
    occNorm.startsWith("J.") ||
    occNorm.startsWith("GROUP G") ||
    occNorm.includes("STORAGE") ||
    occNorm.includes("HAZARDOUS") ||
    occNorm.includes("WAREHOUSE") ||
    occNorm.includes("FLAMMABLE")
  ) {
    drawCheck(205.5, 577.5); // [X] J. Storage and Hazardous
  } else if (
    occNorm.startsWith("G.") ||
    occNorm.includes("OTHER") ||
    occNorm.includes("SPECIFY")
  ) {
    drawCheck(374.0, 578.0); // [X] G. Others (Specify)
    const occDetail = data.occupancyOthers || (occNorm.includes("SPECIFY") || occNorm.includes("OTHER") ? "" : rawOcc);
    if (occDetail) {
      drawText(occDetail.toUpperCase(), 470.0, 580.0, 7.5, false, 25);
    }
  } else {
    // Default fallback: A. Residential Dwelling
    drawCheck(31.5, 594.0);
  }

  // Number of Outlets
  const drawCenteredOn = (val: string | undefined | null, cx: number, y: number) => {
    if (!val && val !== "0") return;
    const s = String(val).trim();
    if (!s) return;
    const w = fontBold.widthOfTextAtSize(s, 7.5);
    drawText(s, cx - (w / 2), y, 7.5, true);
  };

  drawCenteredOn(data.lightingOutletsCount || "28", 40.5, 547.5);
  drawCenteredOn(data.convenienceOutletsCount || "24", 40.5, 539.5);
  drawCenteredOn(data.acuOutletsCount || "4", 40.5, 531.5);
  drawCenteredOn(data.cookingUnitOutletsCount || data.rangeOutletsCount || "1", 199.0, 547.5);
  drawCenteredOn(data.waterHeaterOutletsCount || "2", 199.0, 539.5);
  drawCenteredOn(data.waterPumpOutletsCount || "1", 199.0, 531.5);

  // Number of Equipment / Wiring Devices
  drawCenteredOn(data.toggleSwitchCount || "15", 308.2, 547.5);
  drawCenteredOn(data.bellBuzzerCount || "1", 308.2, 539.5);
  drawCenteredOn(data.pushButtonsCount || "1", 308.2, 531.5);
  drawCenteredOn(data.faDetectorCount || "2", 440.7, 547.5);
  drawCenteredOn(data.otherWiringDevicesCount || "1", 440.7, 539.5);

  // Box 2: Professional Electrical Engineer
  const peeName = (data.electricalEngineerName || "Engr. Danilo Reyes, PEE").trim();
  const peeUpper = peeName.toUpperCase();
  drawText(peeUpper, 45, 488.0, 8.5, true);

  // PRC REG. NO. & VALIDITY
  const rawPrc = data.electricalEngineerPRC || "0033421";
  const cleanPrc = rawPrc.replace(/^[A-Za-z-]+/g, "").trim() || rawPrc;
  drawText(cleanPrc, 375, 488.0, 7.5, false);
  drawText(data.electricalEngineerPRCValidity || "2028-11-30", 480, 488.0, 7.5, false);

  // ADDRESS & TEL./FAX NO.
  const peeAddress = data.electricalEngineerAddress || "Sto. Tomas, Pampanga";
  drawText(peeAddress, 45, 460.0, 7.5, false, 40);
  drawText(data.electricalEngineerTel || data.applicantPhone || "0917-555-4321", 375, 460.0, 7.5, false);

  // ROW 3: P.T.R NO., DATE ISSUED, PLACE ISSUED
  drawText(data.electricalEngineerPTR || "PTR-ST-443322", 45, 439.5, 7.5, false);
  const rawPeePtrDate = data.electricalEngineerPTRIssued || "Jan 12, 2026";
  const peePtrDateOnly = rawPeePtrDate.includes("/") ? rawPeePtrDate.split("/")[1].trim() : rawPeePtrDate;
  // Place DATE ISSUED comfortably inside cell [203.1, 365.1]
  drawText(peePtrDateOnly, 215, 439.5, 7.5, false);
  drawText(data.electricalEngineerPTRIssuedAt || "Sto. Tomas", 375, 439.5, 7.5, false);

  // ROW 4: SIGNATURE, DATE ISSUED, T.I.N
  // Center printed name under signature space in cell [23.4, 203.1] (cx = 113.25)
  const peeNameW = fontBold.widthOfTextAtSize(peeUpper, 8.0);
  const peeNameX = 113.25 - (peeNameW / 2);
  drawText(peeUpper, peeNameX, 412.0, 8.0, true);

  if (data.electricalEngineerSignature) {
    await embedSignatureImage(doc, p1, data.electricalEngineerSignature, 113.25 - 55, 411.0, 110, 24);
  }

  const peeSignDate = data.electricalEngineerSignedDate || data.submissionDate || peePtrDateOnly;
  drawText(peeSignDate, 215, 412.0, 7.5, false);
  drawText(data.electricalEngineerTIN || "456-789-012-000", 375, 412.0, 7.5, false);

  // Box 3: Electrical Contractor (200 Ampere Main and Above)
  const contractorName = (data.electricalContractorName || "VOLTMAX ELECTRICAL SERVICES & CONTRACTING INC.").trim();
  if (contractorName && contractorName !== "N/A" && contractorName !== "NONE") {
    drawText(contractorName.toUpperCase(), 45, 370.5, 8.0, true);
    drawText(data.electricalContractorPcab || "PCAB-EL-2026-9811", 280, 370.5, 7.5, false);
    drawText(data.electricalContractorAddress || "San Fernando, Pampanga", 45, 342.5, 7.5, false, 40);
    drawText(data.electricalContractorTel || "0918-777-8899", 375, 342.5, 7.5, false);
  }

  // Box 4: Person In-Charge of Installation
  const isSameEE = data.sameAsDesignElectricalEngineer ?? false;
  const inChargeRole = isSameEE ? "PEE" : (data.installationInChargeRole || "PEE");
  const inChargeName = (isSameEE ? (data.electricalEngineerName || "Engr. Danilo Reyes, PEE") : (data.installationInChargeName || data.electricalEngineerName || "Engr. Danilo Reyes, PEE")).trim();
  const inChargeAddress = isSameEE ? (data.electricalEngineerAddress || "Sto. Tomas, Pampanga") : (data.installationInChargeAddress || data.electricalEngineerAddress || "Sto. Tomas, Pampanga");
  const inChargeRawPrc = isSameEE ? (data.electricalEngineerPRC || "0033421") : (data.installationInChargePRC || data.electricalEngineerPRC || "0033421");
  const inChargeCleanPrc = inChargeRawPrc.replace(/^[A-Za-z-]+/g, "").trim() || inChargeRawPrc;
  const inChargeValidity = isSameEE ? (data.electricalEngineerPRCValidity || "2028-11-30") : (data.installationInChargePRCValidity || data.electricalEngineerPRCValidity || "2028-11-30");
  const inChargeTel = isSameEE ? (data.electricalEngineerTel || data.applicantPhone || "0917-555-4321") : (data.installationInChargeTel || data.electricalEngineerTel || data.applicantPhone || "0917-555-4321");
  const inChargePTR = isSameEE ? (data.electricalEngineerPTR || "PTR-ST-443322") : (data.installationInChargePTR || data.electricalEngineerPTR || "PTR-ST-443322");
  const inChargeRawPtrDate = isSameEE ? (data.electricalEngineerPTRIssued || "Jan 12, 2026") : (data.installationInChargePTRIssued || data.electricalEngineerPTRIssued || "Jan 12, 2026");
  const inChargePtrDateOnly = inChargeRawPtrDate.includes("/") ? inChargeRawPtrDate.split("/")[1].trim() : inChargeRawPtrDate;
  const inChargePTRIssuedAt = isSameEE ? (data.electricalEngineerPTRIssuedAt || "Sto. Tomas") : (data.installationInChargePTRIssuedAt || data.electricalEngineerPTRIssuedAt || "Sto. Tomas");
  const inChargeTIN = isSameEE ? (data.electricalEngineerTIN || "456-789-012-000") : (data.installationInChargeTIN || data.electricalEngineerTIN || "456-789-012-000");
  const inChargeSignedDate = isSameEE
    ? (data.electricalEngineerSignedDate || data.submissionDate || inChargePtrDateOnly)
    : (data.installationInChargeSignedDate || data.submissionDate || inChargePtrDateOnly);
  const inChargeSignature = isSameEE ? data.electricalEngineerSignature : data.installationInChargeSignature;

  // Header Checkboxes
  const roleUpper = inChargeRole.toUpperCase();
  if (roleUpper.includes("MASTER") || roleUpper === "RME") {
    drawCheck(392.3, 316.5); // [X] Registered Master Electrician
  } else if ((roleUpper.includes("REGISTERED") && !roleUpper.includes("MASTER")) || roleUpper === "REE") {
    drawCheck(202.8, 316.5); // [X] Registered Electrical Engineer
  } else {
    drawCheck(27.5, 316.5);  // [X] Professional Electrical Engineer
  }

  // Row 1: NAME, PRC REG NO., VALIDITY
  const inChargeNameUpper = inChargeName.toUpperCase();
  drawText(inChargeNameUpper, 45.0, 272.5, 8.5, true, 40);
  drawText(inChargeCleanPrc, 375.0, 272.5, 7.5, false);
  drawText(inChargeValidity, 495.0, 272.5, 7.5, false);

  // Row 2: ADDRESS, TEL/FAX NO.
  drawText(inChargeAddress, 45.0, 244.5, 7.5, false, 40);
  drawText(inChargeTel, 375.0, 244.5, 7.5, false);

  // Row 3: P.T.R NO., DATE ISSUED, PLACE ISSUED
  drawText(inChargePTR, 45.0, 216.5, 7.5, false);
  drawText(inChargePtrDateOnly, 215.0, 216.5, 7.5, false);
  drawText(inChargePTRIssuedAt, 375.0, 216.5, 7.5, false);

  // Row 4: SIGNATURE, DATE SIGNED, T.I.N
  const inChargeW = fontBold.widthOfTextAtSize(inChargeNameUpper, 8.0);
  const inChargeX = 111.0 - (inChargeW / 2);
  drawText(inChargeNameUpper, inChargeX, 186.5, 8.0, true);

  if (inChargeSignature) {
    await embedSignatureImage(doc, p1, inChargeSignature, 111.0 - 55, 185.5, 110, 24);
  }

  drawText(inChargeSignedDate, 215.0, 186.5, 7.5, false);
  drawText(inChargeTIN, 375.0, 186.5, 7.5, false);

  // Box 5: Owner / Authorized Representative
  const ownerNameUpper = (data.applicantName || "JUAN DELA CRUZ").toUpperCase();
  const ownerNameW = fontBold.widthOfTextAtSize(ownerNameUpper, 8.5);
  const ownerNameX = 111.0 - (ownerNameW / 2);
  drawText(ownerNameUpper, ownerNameX, 128.0, 8.5, true);

  // Signature inside SIGNATURE box [198.6, 311.1] (cx = 254.85)
  if (data.applicantSignature) {
    await embedSignatureImage(doc, p1, data.applicantSignature, 207.5, 112.0, 95, 36);
  }

  // T.I.N inside T.I.N box [311.1, 405.6] (cx = 358.35)
  const ownerTin = (data.applicantTIN || "123-456-789-000").trim();
  const ownerTinW = fontRegular.widthOfTextAtSize(ownerTin, 7.5);
  const ownerTinX = 358.35 - (ownerTinW / 2);
  drawText(ownerTin, ownerTinX, 128.0, 7.5, false);

  // CTC NO., DATE ISSUED, PLACE ISSUED comfortably above each underline
  const ctcNo = data.govIdNo || data.applicantCtcNo || "CTC-2026-00192";
  const ctcDate = data.govIdDateIssued || data.applicantSignedDate || data.submissionDate || "Jan 10, 2026";
  const ctcPlace = data.govIdPlaceIssued || "Sto. Tomas, Pampanga";

  drawText(ctcNo, 452.0, 144.0, 7.5, false);
  drawText(ctcDate, 472.0, 134.5, 7.5, false);
  drawText(ctcPlace, 475.0, 125.5, 7.5, false);

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

  // Header: APPLICATION NO. in 10 individual segmented boxes [19.75, 199.9]
  const rawAppNo = safeText(data.applicationNo || "2026-0001").trim();
  const cleanAppNo = rawAppNo.replace(/^(APP|UNIFIED|PERMIT|DOC)[\s#:\-]*(TEST[\s#:\-]*)?/i, "").trim() || rawAppNo;
  const appChars = cleanAppNo.slice(0, 10).split("");
  const appBoxLefts = [19.75, 38.45, 57.20, 75.95, 91.00, 105.95, 124.80, 143.55, 162.30, 181.05];
  const appBoxWidths = [18.70, 18.75, 18.75, 15.05, 14.95, 18.85, 18.75, 18.75, 18.75, 18.85];

  appBoxLefts.forEach((bLeft, idx) => {
    if (idx < appChars.length) {
      const char = appChars[idx];
      const charW = fontBold.widthOfTextAtSize(char, 8.5);
      const charX = bLeft + (appBoxWidths[idx] - charW) / 2;
      p1.drawText(char, { x: charX, y: 816.5, size: 8.5, font: fontBold, color: darkNavy });
    }
  });

  // DATE OF APPLICATION centered above the underline [24.0, 203.4], y = 794.2
  const fileDate = safeText(data.submissionDate || "Sep 17, 2026").trim();
  const fileDateW = fontRegular.widthOfTextAtSize(fileDate, 8.0);
  const fileDateX = 113.7 - (fileDateW / 2);
  drawText1(fileDate, fileDateX, 797.0, 8.0, false);

  // Header Right: PERMIT NO. (11 individual boxes) and DATE ISSUED (above underline at y = 794.7)
  // Auto-generated and rendered when the permit is approved by Admin / Building Official, or in preview
  const isApprovedOrIssued =
    data.isApproved === true ||
    data.status === "approved" ||
    data.status === "released" ||
    Boolean(data.permitIssuedDate) ||
    Boolean(data.dateIssued) ||
    Boolean(data.sanitaryPermitNo) ||
    Boolean(data.plumbingPermitNo) ||
    (Boolean(data.permitNo) && !data.permitNo?.startsWith("AP-") && !data.permitNo?.startsWith("BP-") && !data.permitNo?.startsWith("EP-")) ||
    (!data.status); // Default to preview if no submission status is provided (e.g. Form Tester)

  if (isApprovedOrIssued) {
    const cleanSeq = safeText(data.applicationNo || "2026-6636")
      .replace(/^(APP|UNIFIED|PERMIT|DOC)[\s\-#:]*(TEST-)?/i, "")
      .trim() || "2026-6636";

    let rawPermitNo = (
      data.sanitaryPermitNo ||
      data.plumbingPermitNo ||
      (data.permitNo && !data.permitNo.startsWith("AP-") && !data.permitNo.startsWith("BP-") && !data.permitNo.startsWith("EP-") ? data.permitNo : "") ||
      `P-${cleanSeq}`
    ).trim();

    // If formatted like SP-2026-6636 (12 chars), adapt cleanly to the 11 boxes as P-2026-6636
    if (rawPermitNo.length > 11 && rawPermitNo.toUpperCase().startsWith("SP-")) {
      rawPermitNo = "P-" + rawPermitNo.slice(3);
    }

    // 11 segmented boxes under PERMIT NO.
    const permitChars = rawPermitNo.slice(0, 11).split("");
    const permitBoxLefts = [373.20, 391.90, 408.45, 426.45, 444.45, 462.45, 480.45, 498.45, 516.45, 534.45, 552.45];
    const permitBoxWidths = [18.70, 16.55, 18.00, 18.00, 18.00, 18.00, 18.00, 18.00, 18.00, 18.00, 18.00];

    permitBoxLefts.forEach((bLeft, idx) => {
      if (idx < permitChars.length) {
        const char = permitChars[idx];
        const charW = fontBold.widthOfTextAtSize(char, 8.5);
        const charX = bLeft + (permitBoxWidths[idx] - charW) / 2;
        p1.drawText(char, { x: charX, y: 817.5, size: 8.5, font: fontBold, color: darkNavy });
      }
    });

    // DATE ISSUED centered above the underline [378.95, 570.35], y = 794.7
    const rawIssuedDate = safeText(
      data.permitIssuedDate ||
      data.dateIssued ||
      data.approvalDate ||
      (data.status === "approved" || data.status === "released" || data.isApproved
        ? (data.submissionDate || "Sep 22, 2026")
        : "Sep 22, 2026")
    ).trim();

    if (rawIssuedDate) {
      const issuedW = fontRegular.widthOfTextAtSize(rawIssuedDate, 8.0);
      const issuedX = 474.65 - (issuedW / 2);
      drawText1(rawIssuedDate, issuedX, 797.0, 8.0, false);
    }
  }

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

  // Scope of Work (NBC Form P-01)
  const rawScope = (data.sanitaryScopeOfWork || data.scopeOfWork || "NEW INSTALLATION").toUpperCase();
  const scopeDetails = safeText(data.sanitaryScopeDetails || data.scopeOfWorkDetails || "").trim();

  if (rawScope.includes("ADDITION")) {
    drawCheck1(211.5, 677.5); // [X] ADDITION OF
    if (scopeDetails) drawText1(scopeDetails, 282.0, 678.5, 7.5, true, 20);
  } else if (rawScope.includes("REPAIR")) {
    drawCheck1(211.5, 665.5); // [X] REPAIR OF
    if (scopeDetails) drawText1(scopeDetails, 273.0, 667.0, 7.5, true, 22);
  } else if (rawScope.includes("REMOVAL")) {
    drawCheck1(211.5, 653.5); // [X] REMOVAL OF
    if (scopeDetails) drawText1(scopeDetails, 283.0, 655.0, 7.5, true, 20);
  } else if (rawScope.includes("OTHER")) {
    drawCheck1(435.5, 665.5); // [X] OTHERS (SPECIFY)
    let action = safeText(data.sanitaryScopeOthersAction || "").trim();
    let target = safeText(data.sanitaryScopeOthersTarget || "").trim();
    if (!action && scopeDetails) {
      if (scopeDetails.toUpperCase().includes(" OF ")) {
        const parts = scopeDetails.split(/ of /i);
        action = parts[0].trim();
        target = parts.slice(1).join(" of ").trim();
      } else {
        action = scopeDetails;
      }
    }
    if (action) drawText1(action.toUpperCase(), 446.0, 667.0, 6.5, true, 12);
    if (target) drawText1(target.toUpperCase(), 521.0, 667.0, 6.5, true, 10);
  } else {
    // Default: NEW INSTALLATION
    drawCheck1(40.0, 666.0); // [X] NEW INSTALLATION
  }

  drawCheck1(40, 624.0); // [X] Residential

  // FIXTURES TO BE INSTALLED Schedule (NBC Form P-01 Box 1)
  const col1Rows: { key: keyof UnifiedPermitFormData; label: string; defaultQty?: string }[] = [
    { key: "waterClosetsCount", label: "WATER CLOSET", defaultQty: "4" },
    { key: "floorDrainsCount", label: "FLOOR DRAIN", defaultQty: "5" },
    { key: "lavatoriesCount", label: "LAVATORIES", defaultQty: "4" },
    { key: "kitchenSinksCount", label: "KITCHEN SINK", defaultQty: "2" },
    { key: "faucetsCount", label: "FAUCET", defaultQty: "6" },
    { key: "showersCount", label: "SHOWER HEAD", defaultQty: "3" },
    { key: "waterMeterCount", label: "WATER METER" },
    { key: "greaseTrapCount", label: "GREASE TRAP" },
    { key: "bathTubsCount", label: "BATH TUBS" },
    { key: "slopSinkCount", label: "SLOP SINK" },
    { key: "urinalCount", label: "URINAL" },
    { key: "airConditioningCount", label: "AIR CONDITIONING UNIT" },
    { key: "waterTankCount", label: "WATER TANK/RESERVOIR" },
  ];

  const col2Rows: { key: keyof UnifiedPermitFormData; label: string }[] = [
    { key: "bidetCount", label: "BIDETTE" },
    { key: "laundryTraysCount", label: "LAUNDRY TRAYS" },
    { key: "dentalCuspidorCount", label: "DENTAL CUSPIDOR" },
    { key: "electricalHeaterCount", label: "ELECTRICAL HEATER" },
    { key: "waterBoilerCount", label: "WATER BOILER" },
    { key: "drinkingFountainCount", label: "DRINKING FOUNTAIN" },
    { key: "barSinkCount", label: "BAR SINK" },
    { key: "sodaFountainCount", label: "SODA FOUNTAINSINK" },
    { key: "laboratorySinkCount", label: "LABORATORY SINK" },
    { key: "sterilizerCount", label: "STERILIZER" },
    { key: "swimmingPoolCount", label: "SWIMMING POOL" },
    { key: "othersFixtureCount", label: "OTHERS (SPECIFY)" },
  ];

  const colY = [534.5, 522.5, 510.5, 498.5, 486.5, 474.5, 462.5, 450.5, 438.5, 426.5, 414.5, 402.5, 390.5];

  let leftTotal = 0;
  col1Rows.forEach((row, idx) => {
    const rawVal = data[row.key] as string | undefined;
    const qtyStr = safeText(rawVal || (row.defaultQty ? row.defaultQty : "")).trim();
    if (qtyStr && parseInt(qtyStr, 10) > 0) {
      const qtyNum = parseInt(qtyStr, 10);
      leftTotal += qtyNum;
      const y = colY[idx];
      const qtyW = fontBold.widthOfTextAtSize(qtyStr, 7.5);
      p1.drawText(qtyStr, { x: 38.7 - qtyW / 2, y, size: 7.5, font: fontBold, color: darkNavy });
      const isExisting = data.fixtureStatusMap?.[row.key as string] === "existing";
      drawCheck1(isExisting ? 131.0 : 78.7, y);
    }
  });

  if (leftTotal > 0) {
    const totalStr = String(leftTotal);
    const totW = fontBold.widthOfTextAtSize(totalStr, 7.5);
    p1.drawText(totalStr, { x: 38.7 - totW / 2, y: 378.5, size: 7.5, font: fontBold, color: darkNavy });
  }

  let rightTotal = 0;
  col2Rows.forEach((row, idx) => {
    const rawVal = data[row.key] as string | undefined;
    const qtyStr = safeText(rawVal || "").trim();
    if (qtyStr && parseInt(qtyStr, 10) > 0) {
      const qtyNum = parseInt(qtyStr, 10);
      rightTotal += qtyNum;
      const y = colY[idx];
      const qtyW = fontBold.widthOfTextAtSize(qtyStr, 7.5);
      p1.drawText(qtyStr, { x: 326.7 - qtyW / 2, y, size: 7.5, font: fontBold, color: darkNavy });
      const isExisting = data.fixtureStatusMap?.[row.key as string] === "existing";
      drawCheck1(isExisting ? 426.2 : 368.7, y);

      if (row.key === "othersFixtureCount" && data.othersFixtureName) {
        drawText1(safeText(data.othersFixtureName), 488.0, y, 6.5, true, 18);
      }
    }
  });

  if (rightTotal > 0) {
    const totalStr = String(rightTotal);
    const totW = fontBold.widthOfTextAtSize(totalStr, 7.5);
    p1.drawText(totalStr, { x: 326.7 - totW / 2, y: 378.5, size: 7.5, font: fontBold, color: darkNavy });
  }

  // Distribution & Sewer Systems
  if (data.waterDistributionSystem !== false) {
    drawCheck1(34.3, 356.5); // [X] WATER DISTRIBUTION SYSTEM
  }
  if (data.sanitarySewerSystem !== false) {
    drawCheck1(218.5, 356.5); // [X] SANITARY SEWER SYTEM
  }
  if (data.stormDrainageSystem === true) {
    drawCheck1(420.5, 356.5); // [X] STORM DRAINAGE SYSTEM
  }

  // WATER SUPPLY (NBC Form P-01 Box 1)
  const waterType = data.waterSupplyType || "CITY/MUNICIPAL WATER SYSTEM";
  if (waterType === "SHALLOW WELL") {
    drawCheck1(36.0, 322.0); // [X] SHALLOW WELL
  } else if (waterType === "DEEPWELL & PUMP SET") {
    drawCheck1(36.0, 310.1); // [X] DEEPWELL & PUMP SET
  } else if (waterType === "CITY/MUNICIPAL WATER SYSTEM") {
    drawCheck1(36.0, 296.5); // [X] CITY/MUNICIPAL WATER SYSTEM
  } else if (waterType === "OTHERS") {
    drawCheck1(36.0, 284.6); // [X] OTHERS
    if (data.waterSupplyOthers) {
      drawText1(safeText(data.waterSupplyOthers), 85.0, 285.5, 6.5, true, 20);
    }
  }

  // SYSTEM SUPPLY / DISPOSAL (NBC Form P-01 Box 1)
  if (data.wasteWaterTreatmentPlant === true) {
    drawCheck1(212.0, 322.0); // [X] WASTE WATER TREATMENT PLANT
  }
  if (data.septicVaultImhoffTank !== false) {
    drawCheck1(212.0, 310.1); // [X] SEPTIC VAULT/IMHOFF TANK (Default: checked)
  }
  if (data.subsurfaceSandFilter === true) {
    drawCheck1(212.0, 296.5); // [X] SUBSURFACE SAND FILTER
  }
  if (data.sanitarySewerConnection === true) {
    drawCheck1(212.0, 284.6); // [X] SANITARY SEWER CONNECTION
  }
  if (data.surfaceDrainage === true) {
    drawCheck1(401.0, 310.1); // [X] SURFACE DRAINAGE
  }
  if (data.streetCanal === true) {
    drawCheck1(401.0, 296.5); // [X] STREET CANAL
  }
  if (data.waterCourse === true) {
    drawCheck1(401.0, 284.6); // [X] WATER COURSE
  }

  // Building & Project Specs (Underlines at y = 261, 237, 209)
  const storeysVal = safeText(data.proposedStoreys || "2").trim();
  drawText1(storeysVal, 192.0, 263.5, 7.5, true);

  const rawArea = safeText(data.plumbingTotalArea || data.floorArea || "185.50").trim();
  const cleanArea = rawArea.replace(/SQ\.?\s*M\.?/gi, "").trim();
  drawText1(cleanArea, 420.0, 263.5, 7.5, true);

  const rawStart = safeText(data.plumbingStartDate || data.proposedStartDate || "2026-10-01").trim();
  drawText1(rawStart, 148.0, 239.5, 7.5, false);

  const rawCost = safeText(data.plumbingInstallationCost || data.costPlumbing || "100,000.00").trim();
  const cleanCost = rawCost.replace(/PHP/gi, "").replace(/P/gi, "").trim();
  drawText1(cleanCost, 415.0, 239.5, 7.5, true);

  const rawComp = safeText(data.plumbingCompletionDate || data.expectedCompletionDate || "").trim();
  if (rawComp) {
    drawText1(rawComp, 105.0, 211.5, 7.5, false);
  }

  const mpName = safeText(data.plumbingPreparedBy || data.masterPlumberName || "").trim();
  if (mpName) {
    drawText1(mpName, 395.0, 211.5, 7.5, true);
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

  // Header: 1. APPLICATION NO. inside box [30.4, 166.9], center x = 98.65, y = 741.5
  const rawAppNo = safeText(data.applicationNo || "APP-2026-6636").trim();
  const appNoW = fontBold.widthOfTextAtSize(rawAppNo, 8.5);
  p1.drawText(rawAppNo, { x: 98.65 - appNoW / 2, y: 741.5, size: 8.5, font: fontBold, color: darkNavy });

  // Date of Application centered above underline [28.8, 166.0], y = 724.0
  const appDate = safeText(data.submissionDate || "Sep 17, 2026").trim();
  const appDateW = fontRegular.widthOfTextAtSize(appDate, 8.0);
  p1.drawText(appDate, { x: 98.65 - appDateW / 2, y: 724.0, size: 8.0, font: fontRegular, color: darkNavy });

  // Header: 2. MECHANICAL PERMIT NO. inside box [216.5, 374.5], center x = 295.5, y = 741.5
  // and Date Issued above underline [216.5, 374.5], y = 724.0
  const cleanSeq = safeText(data.applicationNo || "2026-6636")
    .replace(/^(APP|UNIFIED|PERMIT|DOC)[\s\-#:]*(TEST-)?/i, "")
    .trim() || "2026-6636";

  const isApprovedOrIssued =
    data.isApproved === true ||
    data.status === "approved" ||
    data.status === "released" ||
    Boolean(data.permitIssuedDate) ||
    Boolean(data.dateIssued) ||
    Boolean(data.mechanicalPermitNo) ||
    (Boolean(data.permitNo) && !data.permitNo?.startsWith("AP-") && !data.permitNo?.startsWith("BP-") && !data.permitNo?.startsWith("EP-") && !data.permitNo?.startsWith("P-") && !data.permitNo?.startsWith("SP-")) ||
    (!data.status); // Default to preview if no submission status is provided (e.g. Form Tester)

  if (isApprovedOrIssued) {
    const rawMpNo = (
      data.mechanicalPermitNo ||
      (data.permitNo && !data.permitNo.startsWith("AP-") && !data.permitNo.startsWith("BP-") && !data.permitNo.startsWith("EP-") && !data.permitNo.startsWith("P-") && !data.permitNo.startsWith("SP-") ? data.permitNo : "") ||
      `MP-${cleanSeq}`
    ).trim();

    if (rawMpNo) {
      const mpNoW = fontBold.widthOfTextAtSize(rawMpNo, 8.5);
      p1.drawText(rawMpNo, { x: 295.5 - mpNoW / 2, y: 741.5, size: 8.5, font: fontBold, color: darkNavy });
    }

    const issuedDate = safeText(data.permitIssuedDate || data.dateIssued || data.submissionDate || "Sep 17, 2026").trim();
    if (issuedDate) {
      const issuedDateW = fontRegular.widthOfTextAtSize(issuedDate, 8.0);
      p1.drawText(issuedDate, { x: 295.5 - issuedDateW / 2, y: 724.0, size: 8.0, font: fontRegular, color: darkNavy });
    }
  }

  // Header: 3. BUILDING PERMIT NO. inside box [415.8, 577.6], center x = 496.7, y = 743.0
  // Auto-gathered if project is associated with a Building Permit, or if buildingPermitNo is provided
  const isBpRequired =
    !data.projectType ||
    data.projectType.matrix?.buildingPermit === 'required' ||
    data.projectType.matrix?.buildingPermit === 'conditional' ||
    Boolean(data.buildingPermitNo);

  const rawBpNo = (
    data.buildingPermitNo ||
    (data.permitNo?.startsWith("BP-") ? data.permitNo : "") ||
    (isBpRequired ? (data.applicationNo ? `BP-${cleanSeq}` : "BP-2026-0001") : "")
  ).trim();

  if (rawBpNo) {
    const bpNoW = fontBold.widthOfTextAtSize(rawBpNo, 8.5);
    p1.drawText(rawBpNo, { x: 496.7 - bpNoW / 2, y: 743.0, size: 8.5, font: fontBold, color: darkNavy });
  }

  // Box 1: Owner (baseline y = 663.0)
  const { lastName, firstName, mi, middleName } = parseApplicantName(data);
  drawText(lastName, 166, 663.0, 8.5, true, 20);
  drawText(firstName, 256, 663.0, 8.5, true, 20);
  drawText(middleName || mi, 355, 663.0, 8, true);
  drawText(data.applicantTIN || "000-123-456-000", 433, 663.0, 8, false);

  // Form of Ownership & Occupancy (baseline y = 635.0)
  const bpEnterprise = data.constructionOwnedByEnterprise || data.corporationName || data.enterpriseName || (data.formOfOwnership?.includes("INDIVIDUAL") ? "N/A" : "");
  if (bpEnterprise && bpEnterprise !== "N/A") {
    drawText(bpEnterprise.toUpperCase(), 35, 635.0, 7.5, false, 25);
  } else if (bpEnterprise === "N/A") {
    drawText("N/A", 35, 635.0, 7.5, false);
  }
  const formOfOwnershipText = (data.formOfOwnership || "INDIVIDUAL / OWNER").toUpperCase();
  const formWidth = fontBold.widthOfTextAtSize(formOfOwnershipText, 8);
  p1.drawText(formOfOwnershipText, { x: 275 - formWidth / 2, y: 635.0, size: 8, font: fontBold, color: darkNavy });

  const occText = resolveOccupancyDetailText(data);
  const occFontSize = occText.length > 36 ? 6.2 : occText.length > 28 ? 7.0 : 7.5;
  const occWidth = fontBold.widthOfTextAtSize(occText, occFontSize);
  const occX = Math.max(372, 475 - occWidth / 2);
  p1.drawText(occText, { x: occX, y: 635.0, size: occFontSize, font: fontBold, color: darkNavy });

  // Address: Line 1 (NO., STREET, TEL FAX NO.) baseline y = 621.0
  const addr = parseApplicantAddress(data);
  let houseNo = "";
  let streetName = addr.noStreet;
  const matchNo = addr.noStreet.match(/^(\d+[\w\-\/]*|[A-Z]?\d+)\s+(.*)$/i);
  if (matchNo) {
    houseNo = matchNo[1];
    streetName = matchNo[2];
  }
  if (houseNo) {
    drawText(houseNo, 118, 621.0, 7.5, false, 8);
  }
  drawText(streetName, 198, 621.0, 7.5, false, 32);
  drawText(addr.contactNo || data.applicantPhone || "0917-123-4567", 485, 621.0, 7.5, true);

  // Address: Line 2 (BARANGAY, CITY/MUNICIPALITY) baseline y = 603.5
  drawText(addr.barangay || "POBLACION", 80, 603.5, 7.5, false, 20);
  drawText(addr.municipality || "STO. TOMAS, PAMPANGA", 275, 603.5, 7.5, false, 25);

  // Location of installation: Line 1 (LOT NO., BLK. NO., TC NO., TAX DEC. NO.) baseline y = 593.0
  const cleanLot = safeText(data.lotNo || "12").replace(/^lot\s*/i, "").trim();
  const cleanBlk = safeText(data.blockNo || "4").replace(/^blk\s*/i, "").trim();
  drawText(cleanLot, 205, 593.0, 7.5, true);
  drawText(cleanBlk, 305, 593.0, 7.5, true);
  drawText(data.tctNo || "TCT-123456", 390, 593.0, 7.5, true, 14);
  drawText(data.taxDecNo || "TD-2026-0012", 515, 593.0, 7.5, false);

  // Location of installation: Line 2 (STREET, BARANGAY, CITY/MUNICIPALITY) baseline y = 574.5
  const rawProjStreet = safeText(data.projectAddress || "Sunset Valley Subd.").replace(/^(lot\s*\w+,?\s*blk\s*\w+,?\s*)/i, "").trim();
  drawText(rawProjStreet, 65, 574.5, 7.5, false, 24);
  drawText(data.barangay || "POBLACION", 245, 574.5, 7.5, true, 20);
  drawText("STO. TOMAS, PAMPANGA", 458, 574.5, 7.5, true, 22);

  // Scope of Work: Checkbox + Detail Underlines
  const scope = (data.mechanicalScopeOfWork || data.scopeOfWork || "NEW CONSTRUCTION").toUpperCase();
  const scopeDetail = safeText(data.mechanicalScopeDetails || data.scopeOfWorkDetails || data.scopeOthers || "").trim();

  // Column 1 (x = 52.5)
  if (scope.includes("NEW") || scope.includes("CONSTRUCT")) {
    drawCheck(52.5, 554.0); // [X] NEW CONSTRUCTION
    if (scopeDetail) drawText(scopeDetail, 150, 554.5, 7.0, false, 15);
  } else if (scope.includes("ERECT")) {
    drawCheck(52.5, 544.5); // [X] ERECTION
    if (scopeDetail) drawText(scopeDetail, 120, 545.0, 7.0, false, 18);
  } else if (scope.includes("ADD")) {
    drawCheck(52.5, 535.5); // [X] ADDITION
    if (scopeDetail) drawText(scopeDetail, 115, 536.0, 7.0, false, 18);
  } else if (scope.includes("ALTER")) {
    drawCheck(52.5, 526.5); // [X] ALTERATION
    if (scopeDetail) drawText(scopeDetail, 125, 527.0, 7.0, false, 18);
    // Column 2 (x = 208.8)
  } else if (scope.includes("RENOV")) {
    drawCheck(208.8, 553.5); // [X] RENOVATION
    if (scopeDetail) drawText(scopeDetail, 275, 554.0, 7.0, false, 15);
  } else if (scope.includes("CONVER")) {
    drawCheck(208.8, 544.5); // [X] CONVERSION
    if (scopeDetail) drawText(scopeDetail, 280, 545.0, 7.0, false, 15);
  } else if (scope.includes("REPAIR")) {
    drawCheck(208.8, 535.5); // [X] REPAIR
    if (scopeDetail) drawText(scopeDetail, 255, 536.0, 7.0, false, 18);
  } else if (scope.includes("MOV")) {
    drawCheck(208.8, 526.5); // [X] MOVING
    if (scopeDetail) drawText(scopeDetail, 255, 527.0, 7.0, false, 18);
    // Column 3 (x = 359.5)
  } else if (scope.includes("RAIS")) {
    drawCheck(359.5, 552.5); // [X] RAISING
    if (scopeDetail) drawText(scopeDetail, 405, 553.0, 7.0, false, 30);
  } else if (scope.includes("DEMOL")) {
    drawCheck(359.5, 543.5); // [X] DEMOLITION
    if (scopeDetail) drawText(scopeDetail, 420, 544.0, 7.0, false, 28);
  } else if (scope.includes("ACCESSOR")) {
    drawCheck(359.5, 535.0); // [X] ACCESSORY BUILDING/STRUCTURE
    if (scopeDetail) drawText(scopeDetail, 515, 535.5, 7.0, false, 14);
  } else {
    if (scope.includes("OTHER")) {
      drawCheck(359.5, 526.0); // [X] OTHERS (SPECIFY)
      if (scopeDetail) drawText(scopeDetail, 440, 526.5, 7.0, false, 25);
    } else {
      drawCheck(52.5, 554.0); // Default to NEW CONSTRUCTION
      if (scopeDetail) drawText(scopeDetail, 150, 554.5, 7.0, false, 15);
    }
  }

  // Box 2: Installation and Operation of (NBC Form M-01)
  // Column 1 (x = 37.5)
  if (data.boiler === true) drawCheck(37.5, 480.0);
  if (data.pressureVessel === true) drawCheck(37.5, 470.8);
  if (data.internalCombustionEngine === true) drawCheck(37.5, 461.6);
  if (data.refrigerationIce === true) drawCheck(37.5, 452.5);
  if (data.windowTypeAircon === true) drawCheck(37.5, 443.2);
  if (data.packagedSplitAircon !== false) drawCheck(37.5, 434.0); // default true
  if (data.mechanicalOthers === true || data.mechanicalOthersSpecify) {
    drawCheck(37.5, 424.9);
    if (data.mechanicalOthersSpecify) {
      drawText(data.mechanicalOthersSpecify, 115.0, 424.9, 7.0, false, 24);
    }
  }

  // Column 2 (x = 218.0)
  if (data.centralAircon === true) drawCheck(218.0, 480.0);
  if (data.mechanicalVentilation !== false) drawCheck(218.0, 470.8); // default true
  if (data.escalator === true) drawCheck(218.0, 461.6);
  if (data.movingSidewalk === true) drawCheck(218.0, 452.5);
  if (data.freightElevator === true) drawCheck(218.0, 443.2);
  if (data.passengerElevator === true) drawCheck(218.0, 434.0);
  if (data.cableCar === true) drawCheck(218.0, 424.9);

  // Column 3 (x = 357.5)
  if (data.dumbwaiter === true) drawCheck(357.5, 480.0);
  if (data.pumps !== false) drawCheck(357.5, 470.8); // default true
  if (data.compressedAirGas === true) drawCheck(357.5, 461.6);
  if (data.pneumaticTubesConveyors === true) drawCheck(357.5, 443.2);
  if (data.funicular === true) drawCheck(357.5, 424.9);

  // PREPARED BY: Design Professional underline at y = 405.0 -> baseline y = 406.0
  const preparedByName = safeText(data.mechanicalPreparedBy || data.mechanicalEngineerName || "").trim();
  if (preparedByName) {
    drawText(preparedByName.toUpperCase(), 95.0, 406.0, 8.0, true);
  }

  // ==========================================
  // BOX 3: DESIGN PROFESSIONAL, PLANS AND SPECIFICATION
  // ==========================================
  const pmeName = safeText(data.mechanicalEngineerName || "ENGR. LEONARDO V. TORRES, PME").toUpperCase();
  if (data.mechanicalEngineerSignature) {
    await embedSignatureImage(doc, p1, data.mechanicalEngineerSignature, 100, 315.0, 110, 26);
  }
  const pmeWidth = fontBold.widthOfTextAtSize(pmeName, 8.0);
  drawText(pmeName, 155.35 - pmeWidth / 2, 323.0, 8.0, true);
  drawText(data.mechanicalEngineerSignedDate || data.submissionDate || "Jan 08, 2026", 130.0, 295.1, 7.5, false);

  // Address (cell y: 274.2 -> 293.1, label 'ADDRESS' at x: 27.2)
  drawText(data.mechanicalEngineerAddress || "Sto. Tomas, Pampanga", 75.0, 285.0, 7.5, false, 35);

  // PRC. NO. (x: 21.8 -> 147.8) & Validity (x: 147.8 -> 288.9)
  drawText(data.mechanicalEngineerPRC || "0044556", 75.0, 266.5, 7.5, false, 12);
  drawText(data.mechanicalEngineerPRCValidity || "2027-12-18", 195.0, 266.5, 7.5, false, 15);

  // PTR NO. (x: 21.8 -> 147.8) & Date Issued (x: 147.8 -> 288.9)
  drawText(data.mechanicalEngineerPTR || "PTR-ST-221100", 75.0, 256.6, 7.5, false, 14);
  drawText(data.mechanicalEngineerPTRDate || data.mechanicalEngineerPTRIssued || "Jan 10, 2026", 210.0, 256.6, 7.5, false, 14);

  // Issued at (x: 21.8 -> 147.8) & TIN (x: 147.8 -> 288.9)
  drawText(data.mechanicalEngineerPTRIssuedAt || "Sto. Tomas, Pampanga", 75.0, 246.9, 7.0, false, 14);
  drawText(data.mechanicalEngineerTIN || "678-901-234-000", 175.0, 246.9, 7.5, false, 18);

  // ==========================================
  // BOX 4: SUPERVISOR/IN-CHARGE OF MECHANICAL WORKS
  // ==========================================
  // Checkbox at y = 349.5: [ ] PROFESSIONAL MECHANICAL ENGINEER (x: 311.5) | [ ] MECHANICAL ENGINEER (x: 470.0)
  if (data.mechSupervisorRole === "ME") {
    p1.drawText("X", { x: 470.0, y: 349.5, size: 7.5, font: fontBold, color: darkNavy });
  } else {
    p1.drawText("X", { x: 311.5, y: 349.5, size: 7.5, font: fontBold, color: darkNavy }); // Default to PME
  }

  const supName = safeText(
    data.mechSupervisorName ||
    (data.sameAsDesignMechanicalEngineer !== false ? pmeName : "")
  ).toUpperCase();

  if (data.mechSupervisorSignature) {
    await embedSignatureImage(doc, p1, data.mechSupervisorSignature, 390, 315.0, 110, 26);
  } else if (data.sameAsDesignMechanicalEngineer !== false && data.mechanicalEngineerSignature) {
    await embedSignatureImage(doc, p1, data.mechanicalEngineerSignature, 390, 315.0, 110, 26);
  }

  if (supName) {
    const supWidth = fontBold.widthOfTextAtSize(supName, 8.0);
    drawText(supName, 442.4 - supWidth / 2, 323.0, 8.0, true);
  }
  drawText(data.mechSupervisorSignedDate || data.submissionDate || "Jan 08, 2026", 425.0, 294.4, 7.5, false);

  // Address (cell y: 273.6 -> 292.5, label 'ADDRESS' at x: 312.2)
  drawText(data.mechSupervisorAddress || data.mechanicalEngineerAddress || "Sto. Tomas, Pampanga", 365.0, 284.5, 7.5, false, 35);

  // PRC. NO. (x: 306.8 -> 439.8) & Validity (x: 439.8 -> 578.0)
  drawText(data.mechSupervisorPRC || data.mechanicalEngineerPRC || "0044556", 365.0, 265.8, 7.5, false, 12);
  drawText(data.mechSupervisorPRCValidity || data.mechanicalEngineerPRCValidity || "2027-12-18", 485.0, 265.8, 7.5, false, 15);

  // PTR NO. (x: 306.8 -> 439.8) & Date Issued (x: 439.8 -> 578.0)
  drawText(data.mechSupervisorPTR || data.mechanicalEngineerPTR || "PTR-ST-221100", 365.0, 256.0, 7.5, false, 14);
  drawText(data.mechSupervisorPTRDate || data.mechSupervisorPTRIssued || data.mechanicalEngineerPTRDate || "Jan 10, 2026", 500.0, 256.0, 7.5, false, 14);

  // Issued at (x: 306.8 -> 439.8) & TIN (x: 439.8 -> 578.0)
  drawText(data.mechSupervisorPTRIssuedAt || data.mechanicalEngineerPTRIssuedAt || "Sto. Tomas, Pampanga", 365.0, 246.2, 7.0, false, 14);
  drawText(data.mechSupervisorTIN || data.mechanicalEngineerTIN || "678-901-234-000", 465.0, 246.2, 7.5, false, 18);

  // ==========================================
  // BOX 5: BUILDING OWNER
  // ==========================================
  const ownerName = safeText(data.applicantName || "JUAN DELA CRUZ").toUpperCase().trim();
  const ownerWidth = fontBold.widthOfTextAtSize(ownerName, 8.5);
  const ownerX = Math.max(50.0, 150.0 - ownerWidth / 2);
  drawText(ownerName, ownerX, 172.5, 8.5, true);

  if (data.applicantSignature) {
    const sigW = 100;
    const sigH = 20;
    const sigX = Math.max(50.0, 150.0 - sigW / 2);
    await embedSignatureImage(doc, p1, data.applicantSignature, sigX, 171.0, sigW, sigH);
  }

  drawText(data.submissionDate || "Jan 08, 2026", 180.0, 151.0, 7.5, false);

  // Address (cell y: 129.3 -> 148.2, label 'ADDRESS' at x: 28.8)
  drawText(data.applicantAddress || data.projectAddress || "Sto. Tomas, Pampanga", 70.0, 136.0, 7.5, false, 36);

  // C.T.C NO. (x: 23.4 -> 120.0), Date Issued (x: 120.0 -> 196.5), Place Issued (x: 196.5 -> 288.8)
  const rawAppCtc = (data.applicantCtcNo || data.govIdNo || "CTC-2026-00192").trim();
  let cleanAppCtc = rawAppCtc.replace(/^[a-zA-Z\s-]+/g, "").trim();
  if (!cleanAppCtc) cleanAppCtc = rawAppCtc;
  if (cleanAppCtc.length > 9) cleanAppCtc = cleanAppCtc.slice(0, 9);
  const appCtcFontSize = cleanAppCtc.length > 8 ? 5.5 : cleanAppCtc.length > 6 ? 6.0 : 6.5;
  drawText(cleanAppCtc, 68.0, 117.0, appCtcFontSize, false, 9);

  drawText(data.applicantGovIdDateIssued || data.govIdDateIssued || "Jan 08, 2026", 175.0, 117.0, 6.2, false, 12);
  drawText(data.applicantGovIdPlaceIssued || data.govIdPlaceIssued || "Sto. Tomas", 253.0, 117.0, 6.2, false, 14);

  // ==========================================
  // BOX 6: WITH MY CONSENT: LOT OWNER
  // ==========================================
  if (data.lotOwnerConsent || data.lotOwnerName) {
    const lotName = safeText(data.lotOwnerName || "DAVE SICAT").toUpperCase().trim();
    const lotWidth = fontBold.widthOfTextAtSize(lotName, 8.5);
    const lotX = Math.max(340.0, 451.5 - lotWidth / 2);
    drawText(lotName, lotX, 172.5, 8.5, true);

    if (data.lotOwnerSignature) {
      const sigW = 100;
      const sigH = 20;
      const sigX = Math.max(340.0, 451.5 - sigW / 2);
      await embedSignatureImage(doc, p1, data.lotOwnerSignature, sigX, 171.0, sigW, sigH);
    }

    drawText(data.lotOwnerSignedDate || data.submissionDate || "Jan 08, 2026", 422.0, 151.0, 7.5, false);

    // Address (cell y: 129.3 -> 148.2, label 'ADDRESS' at x: 313.0)
    drawText(data.lotOwnerAddress || "105 Sitio Visitas, Sto. Tomas, Pampanga", 355.0, 136.0, 7.5, false, 48);

    // C.T.C NO. (x: 307.3 -> 404.1), Date Issued (x: 404.1 -> 480.6), Place Issued (x: 480.6 -> 578.0)
    const rawLotCtc = (data.lotOwnerGovIdNo || data.lotOwnerCtcNo || "PRC-ID-00987654").trim();
    let cleanLotCtc = rawLotCtc.replace(/^[a-zA-Z\s-]+/g, "").trim();
    if (!cleanLotCtc) cleanLotCtc = rawLotCtc;
    if (cleanLotCtc.length > 9) cleanLotCtc = cleanLotCtc.slice(0, 9);
    const lotCtcFontSize = cleanLotCtc.length > 8 ? 5.5 : cleanLotCtc.length > 6 ? 6.0 : 6.5;
    drawText(cleanLotCtc, 354.0, 117.0, lotCtcFontSize, false, 9);

    drawText(data.lotOwnerGovIdDateIssued || "Jan 10, 2024", 458.0, 117.0, 6.2, false, 12);
    drawText(data.lotOwnerGovIdPlaceIssued || "Sto. Tomas", 537.0, 117.0, 6.2, false, 14);
  }

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

  const drawBoxCheck = (cx: number, cy: number) => {
    const size = 7.0;
    const w = fontBold.widthOfTextAtSize("X", size);
    p1.drawText("X", { x: cx - w / 2, y: cy - 2.5, size, font: fontBold, color: darkNavy });
  };

  // Header: APPLICATION NO. in 10 individual segmented boxes [18.33, 147.78]
  const rawAppNo = safeText(data.applicationNo || "2026-0001").trim();
  const cleanAppNo = rawAppNo.replace(/^(APP|UNIFIED|PERMIT|DOC|EL|ELP)[\s#:\-]*(TEST[\s#:\-]*)?/i, "").trim() || rawAppNo;
  const appChars = cleanAppNo.slice(0, 10).split("");
  const appBoxLefts = [18.33, 31.11, 43.89, 57.22, 70.00, 83.33, 96.11, 109.44, 122.78, 135.56];
  const appBoxWidths = [12.78, 12.78, 13.33, 12.78, 13.33, 12.78, 13.33, 13.33, 12.78, 12.22];

  appBoxLefts.forEach((bLeft, idx) => {
    if (idx < appChars.length) {
      const char = appChars[idx];
      const charW = fontBold.widthOfTextAtSize(char, 9.0);
      const charX = bLeft + (appBoxWidths[idx] - charW) / 2;
      p1.drawText(char, { x: charX, y: 716.0, size: 9.0, font: fontBold, color: darkNavy });
    }
  });

  // Header: ELP NO. (Electronics Permit No.) in individual segmented boxes (8 boxes)
  // Auto-fillup: uses electronicsPermitNo, or non-AP/BP permitNo, or auto-derives from cleanAppNo
  let rawElpNo = (
    data.electronicsPermitNo ||
    (data.permitNo && !data.permitNo.toUpperCase().startsWith("AP-") && !data.permitNo.toUpperCase().startsWith("BP-") && !data.permitNo.toUpperCase().startsWith("SP-") ? data.permitNo : "") ||
    `ELP-${cleanAppNo}`
  ).trim();

  let cleanElpNo = rawElpNo.replace(/^(ELP|EL|APP|AP|UNIFIED|PERMIT|DOC|BP|SP|MP|PP)[\s#:\-]*(TEST[\s#:\-]*)?/i, "").trim() || rawElpNo;
  if (cleanElpNo.length > 8 && cleanElpNo.includes("-")) {
    cleanElpNo = cleanElpNo.replace(/-/g, "");
  }
  const elpChars = cleanElpNo.slice(0, 8).split("");
  const elpBoxLefts = [246.67, 259.44, 272.78, 285.56, 298.33, 311.67, 324.44, 337.78];
  const elpBoxWidths = [12.78, 13.33, 12.78, 12.78, 13.33, 12.78, 13.33, 13.33];
  elpBoxLefts.forEach((bLeft, idx) => {
    if (idx < elpChars.length) {
      const char = elpChars[idx];
      const charW = fontBold.widthOfTextAtSize(char, 9.0);
      const charX = bLeft + (elpBoxWidths[idx] - charW) / 2;
      p1.drawText(char, { x: charX, y: 716.0, size: 9.0, font: fontBold, color: darkNavy });
    }
  });

  // Header: BUILDING PERMIT NO. in individual segmented boxes (12 boxes)
  // Auto-filled: uses buildingPermitNo, or auto-derived from cleanAppNo
  const isBpRequired = !data.projectType || data.projectType.matrix?.buildingPermit === 'required' || data.projectType.matrix?.buildingPermit === 'conditional';
  const rawBpNo = (data.buildingPermitNo || (isBpRequired ? (data.applicationNo ? `BP-${cleanAppNo}` : "BP-2026-0001") : "")).trim();
  if (rawBpNo) {
    const cleanBpNo = rawBpNo.replace(/^(BP|APP|NBC)[\s#:\-]*(TEST[\s#:\-]*)?/i, "").trim() || rawBpNo;
    const bpChars = cleanBpNo.slice(0, 12).split("");
    const bpBoxLefts = [433.89, 446.11, 459.44, 472.22, 485.00, 498.33, 511.11, 525.00, 537.78, 551.11, 563.89, 576.11];
    const bpBoxWidths = [12.22, 13.33, 12.78, 12.78, 13.33, 12.78, 13.89, 12.78, 13.33, 12.78, 12.22, 12.22];
    bpBoxLefts.forEach((bLeft, idx) => {
      if (idx < bpChars.length) {
        const char = bpChars[idx];
        const charW = fontBold.widthOfTextAtSize(char, 9.0);
        const charX = bLeft + (bpBoxWidths[idx] - charW) / 2;
        p1.drawText(char, { x: charX, y: 716.0, size: 9.0, font: fontBold, color: darkNavy });
      }
    });
  }

  // ==========================================
  // BOX 1: OWNER / APPLICANT INFORMATION
  // ==========================================
  const drawCenteredText = (text: string | undefined | null, centerX: number, y: number, size: number = 8, isBold: boolean = false, maxW?: number) => {
    if (!text) return;
    let clean = safeText(text).trim();
    if (maxW && clean.length > maxW) clean = clean.slice(0, maxW);
    const font = isBold ? fontBold : fontRegular;
    const w = font.widthOfTextAtSize(clean, size);
    p1.drawText(clean, { x: centerX - w / 2, y, size, font, color: darkNavy });
  };

  // Row 1: LAST NAME, FIRST NAME, M.I., TIN
  const { lastName, firstName, mi, middleName } = parseApplicantName(data);
  // LAST NAME: column [89, 278], center = 183.5, y = 667.0
  drawCenteredText(lastName.toUpperCase(), 183.5, 667.0, 8.5, true, 22);
  // FIRST NAME: column [278, 461], center = 369.5, y = 667.0
  drawCenteredText(firstName.toUpperCase(), 369.5, 667.0, 8.5, true, 22);
  // M.I.: column [461, 504], center = 482.5, y = 667.0
  let miText = (mi || (middleName ? middleName.charAt(0) : "")).trim();
  if (miText && !miText.endsWith(".") && miText.length <= 2) miText += ".";
  drawCenteredText(miText.toUpperCase(), 482.5, 667.0, 8.0, true, 6);
  // TIN: column [504, 592], center = 548.0, y = 667.0
  drawCenteredText(data.applicantTIN || "000-123-456-000", 548.0, 667.0, 8.0, false, 18);

  // Row 2: FOR CONSTRUCTION OWNED, FORM OF OWNERSHIP, USE OR CHARACTER OF OCCUPANCY
  // Baseline y = 640.5
  const bpEnterprise = data.constructionOwnedByEnterprise || data.corporationName || data.enterpriseName || (data.formOfOwnership?.includes("INDIVIDUAL") ? "N/A" : "");
  if (bpEnterprise && bpEnterprise !== "N/A") {
    drawText(bpEnterprise.toUpperCase(), 26.0, 640.5, 7.5, false, 28);
  } else {
    drawText("N/A (INDIVIDUAL)", 26.0, 640.5, 7.5, false);
  }

  const bpFormText = (data.formOfOwnership || "INDIVIDUAL / OWNER").toUpperCase();
  drawCenteredText(bpFormText, 330.8, 640.5, 8.0, true, 26);

  const bpOccText = resolveOccupancyDetailText(data);
  const bpOccFontSize = bpOccText.length > 38 ? 6.2 : bpOccText.length > 28 ? 7.0 : 7.5;
  drawCenteredText(bpOccText, 514.4, 640.5, bpOccFontSize, true, 42);

  // Row 3: ADDRESS (Baseline y = 615.0 to sit BELOW the labels and avoid overlap)
  const bpAddr = parseApplicantAddress(data);
  drawText(bpAddr.noStreet, 88.0, 615.0, 7.5, false, 24);
  drawText(bpAddr.barangay, 215.0, 615.0, 7.5, false, 20);
  drawText(bpAddr.municipality, 318.0, 615.0, 7.0, false, 24);
  drawCenteredText(bpAddr.zipCode || "2020", 456.7, 615.0, 7.5, false);
  // TELEPHONE NO.: column [476.7, 592.2]
  const contactPhone = bpAddr.contactNo || data.applicantPhone || "0917-123-4567";
  drawText(contactPhone, 482.0, 615.0, 7.5, false, 16);

  // Row 4: LOCATION OF CONSTRUCTION (Underlines at y = 598.33, Baseline y = 600.5)
  const cleanLotNo = (data.lotNo || "12").replace(/^lot\s*/i, "").trim();
  const cleanBlkNo = (data.blockNo || "4").replace(/^(blk|block)\s*/i, "").trim();
  drawCenteredText(cleanLotNo, 176.7, 600.5, 7.5, true);
  drawCenteredText(cleanBlkNo, 249.4, 600.5, 7.5, true);
  drawCenteredText(data.tctNo || "TCT-889977-P", 363.3, 600.5, 7.5, true, 18);
  drawCenteredText(data.taxDecNo || "TD-2026-004455", 525.6, 600.5, 7.5, false, 18);

  // Row 5: PROJECT ADDRESS (Underlines at y = 578.89, Baseline y = 581.0)
  const projStreet = (data.projectAddress || "Lot 12, Block 4, Sunset").trim();
  drawText(projStreet, 55.0, 581.0, 7.5, false, 32);
  drawText(data.barangay || "Poblacion", 250.0, 581.0, 7.5, true, 22);
  drawText("Sto. Tomas, Pampanga", 476.0, 581.0, 7.5, true, 22);

  // Row 6: SCOPE OF WORK CHECKBOXES
  const scopeLower = (data.electronicsScopeOfWork || data.scopeOfWork || "new installation").toLowerCase();
  if (scopeLower.includes("annual")) {
    drawBoxCheck(223.3, 547.2);
  } else if (scopeLower.includes("other")) {
    drawBoxCheck(424.4, 547.2);
    if (data.electronicsScopeOthers || data.scopeOfWorkDetails) {
      drawText(data.electronicsScopeOthers || data.scopeOfWorkDetails, 490.0, 545.0, 7.5, false, 20);
    }
  } else {
    // Default to NEW INSTALLATION
    drawBoxCheck(34.4, 547.2);
  }

  // ==========================================
  // BOX 2: NATURE OF INSTALLATION WORKS/EQUIPMENT SYSTEM
  // ==========================================
  // Column 1 Checkboxes (cx = 34.4)
  if (data.telecomSystem ?? true) drawBoxCheck(34.4, 492.2);
  if (data.broadcastingSystem) drawBoxCheck(34.4, 480.6);
  if (data.televisionSystem) drawBoxCheck(34.4, 468.9);
  if (data.itSystem ?? true) drawBoxCheck(34.4, 457.8);
  if (data.securityAlarmSystem ?? true) drawBoxCheck(34.4, 445.0);
  if (data.anyOtherElectronics) {
    drawBoxCheck(34.4, 434.4);
    if (data.anyOtherElectronicsSpecify) {
      drawText(data.anyOtherElectronicsSpecify, 95.0, 422.0, 7.0, false, 40);
    }
  }

  // Column 2 Checkboxes (cx = 223.3)
  if (data.electronicsAlarmSystem ?? true) drawBoxCheck(223.3, 492.2);
  if (data.soundCommSystem) drawBoxCheck(223.3, 480.6);
  if (data.centralizedClockSystem) drawBoxCheck(223.3, 468.9);
  if (data.soundSystem) drawBoxCheck(223.3, 457.8);
  if (data.electronicsControlConveyor) drawBoxCheck(223.3, 445.0);

  // Column 3 Checkboxes (cx = 424.4)
  if (data.computerProcessControls) drawBoxCheck(424.4, 492.2);
  if (data.buildingAutomationManagement) drawBoxCheck(424.4, 468.9);
  if (data.buildingWiringFiberOptic ?? true) drawBoxCheck(424.4, 445.0);

  // Prepared By underline (baseline y = 387.0)
  const preparedBy = data.electronicsPreparedBy || data.electronicsEngineerName || "Engr. Carlos Lim, PECE";
  drawText(preparedBy, 82.0, 387.0, 8.0, true, 55);

  // ==========================================
  // BOX 3: DESIGN PROFESSIONAL (PECE)
  // ==========================================
  const peceName = (data.electronicsEngineerName || "Engr. Carlos Lim, PECE").toUpperCase();
  if (data.electronicsEngineerSignature) {
    await embedSignatureImage(doc, p1, data.electronicsEngineerSignature, 68.0, 308.5, 100, 28);
  }
  drawCenteredText(peceName, 117.5, 310.5, 7.5, true, 30);
  drawText(data.electronicsEngineerSignedDate || data.submissionDate || "Jan 08, 2026", 232.0, 310.5, 7.5, false);

  // Table lines
  drawText(data.electronicsEngineerAddress || "Sto. Tomas, Pampanga", 55.0, 277.5, 7.5, false, 45);
  drawText(data.electronicsEngineerPRC || "PRC-PECE-0038912", 55.0, 265.0, 7.5, false);
  drawText(data.electronicsEngineerPRCValidity || "2028-08-20", 195.0, 265.0, 7.5, false);
  drawText(data.electronicsEngineerPTR || "PTR-ST-2026-7782", 55.0, 252.5, 7.5, false);
  drawText(data.electronicsEngineerPTRIssued || "Jan 05, 2026", 208.0, 252.5, 7.5, false);
  drawText(data.electronicsEngineerPTRIssuedAt || "Sto. Tomas, Pampanga", 55.0, 240.0, 7.5, false, 22);
  drawText(data.electronicsEngineerTIN || "789-012-345-000", 185.0, 240.0, 7.5, false);

  // ==========================================
  // BOX 4: SUPERVISOR IN-CHARGE (ECE / PECE)
  // ==========================================
  const sameAsDesign = Boolean(data.sameAsDesignElectronicsEngineer);
  const supName = (sameAsDesign ? peceName : (data.electronicsSupervisorName || peceName)).toUpperCase();
  const supSig = sameAsDesign ? (data.electronicsEngineerSignature || data.electronicsSupervisorSignature) : data.electronicsSupervisorSignature;

  if (supSig) {
    await embedSignatureImage(doc, p1, supSig, 360.0, 308.5, 100, 28);
  }
  drawCenteredText(supName, 410.8, 310.5, 7.5, true, 30);
  drawText((sameAsDesign ? (data.electronicsEngineerSignedDate || data.submissionDate) : data.electronicsSupervisorSignedDate) || "Jan 08, 2026", 524.0, 310.5, 7.5, false);

  const supAddr = sameAsDesign ? (data.electronicsEngineerAddress || "Sto. Tomas, Pampanga") : (data.electronicsSupervisorAddress || "Sto. Tomas, Pampanga");
  const supPrc = sameAsDesign ? (data.electronicsEngineerPRC || "PRC-PECE-0038912") : (data.electronicsSupervisorPRC || "PRC-ECE-0045210");
  const supPrcVal = sameAsDesign ? (data.electronicsEngineerPRCValidity || "2028-08-20") : (data.electronicsSupervisorPRCValidity || "2027-09-15");
  const supPtr = sameAsDesign ? (data.electronicsEngineerPTR || "PTR-ST-2026-7782") : (data.electronicsSupervisorPTR || "PTR-ST-2026-8890");
  const supPtrDate = sameAsDesign ? (data.electronicsEngineerPTRIssued || "Jan 05, 2026") : (data.electronicsSupervisorPTRDate || "Jan 08, 2026");
  const supIssuedAt = sameAsDesign ? (data.electronicsEngineerPTRIssuedAt || "Sto. Tomas, Pampanga") : (data.electronicsSupervisorPTRIssuedAt || "Sto. Tomas, Pampanga");
  const supTin = sameAsDesign ? (data.electronicsEngineerTIN || "789-012-345-000") : (data.electronicsSupervisorTIN || "345-678-901-000");

  drawText(supAddr, 355.0, 277.5, 7.5, false, 45);
  drawText(supPrc, 355.0, 265.0, 7.5, false);
  drawText(supPrcVal, 485.0, 265.0, 7.5, false);
  drawText(supPtr, 355.0, 252.5, 7.5, false);
  drawText(supPtrDate, 498.0, 252.5, 7.5, false);
  drawText(supIssuedAt, 355.0, 240.0, 7.5, false, 22);
  drawText(supTin, 475.0, 240.0, 7.5, false);

  // ==========================================
  // BOX 5: BUILDING OWNER
  // ==========================================
  const ownerName = (data.applicantName || "JUAN DELA CRUZ").toUpperCase().trim();
  if (data.applicantSignature) {
    const sigW = 100;
    const sigH = 20;
    const sigX = Math.max(45.0, 153.0 - sigW / 2);
    await embedSignatureImage(doc, p1, data.applicantSignature, sigX, 180.0, sigW, sigH);
  }
  drawCenteredText(ownerName, 153.0, 184.5, 8.5, true, 30);
  drawText(data.applicantSignedDate || data.submissionDate || "Jan 08, 2026", 150.0, 162.0, 7.2, false);

  const ownerAddr = data.applicantAddress || data.projectAddress || "123 Rizal St., Poblacion, Sto. Tomas, Pampanga";
  drawText(ownerAddr, 70.0, 140.0, 7.5, false, 48);

  const rawAppCtc = (data.applicantCtcNo || data.govIdNo || "CTC-2026-00192").trim();
  let cleanAppCtc = rawAppCtc.replace(/^[a-zA-Z\s-]+/g, "").trim();
  if (!cleanAppCtc) cleanAppCtc = rawAppCtc;
  if (cleanAppCtc.length > 9) cleanAppCtc = cleanAppCtc.slice(0, 9);
  const appCtcFontSize = cleanAppCtc.length > 8 ? 5.5 : cleanAppCtc.length > 6 ? 6.0 : 6.5;
  drawText(cleanAppCtc, 70.0, 101.0, appCtcFontSize, false, 9);

  drawText(data.govIdDateIssued || data.applicantGovIdDateIssued || "Jan 08, 2026", 172.0, 101.0, 6.2, false, 12);
  drawText(data.govIdPlaceIssued || data.applicantGovIdPlaceIssued || "Sto. Tomas", 262.0, 101.0, 6.2, false, 16);

  // ==========================================
  // BOX 6: WITH MY CONSENT: LOT OWNER
  // ==========================================
  if (data.lotOwnerConsent || data.lotOwnerName) {
    const lotName = safeText(data.lotOwnerName || "DAVE SICAT").toUpperCase().trim();
    if (data.lotOwnerSignature) {
      const sigW = 100;
      const sigH = 20;
      const sigX = Math.max(340.0, 450.0 - sigW / 2);
      await embedSignatureImage(doc, p1, data.lotOwnerSignature, sigX, 180.0, sigW, sigH);
    }
    drawCenteredText(lotName, 450.0, 184.5, 8.5, true, 30);
    drawText(data.lotOwnerSignedDate || data.submissionDate || "Jan 08, 2026", 450.0, 162.0, 7.2, false);

    const lotAddr = data.lotOwnerAddress || "153 Sitio Visitas, Sto. Tomas, Pampanga";
    drawText(lotAddr, 370.0, 140.0, 7.5, false, 48);

    const rawLotCtc = (data.lotOwnerGovIdNo || data.lotOwnerCtcNo || "PRC-ID-00987654").trim();
    let cleanLotCtc = rawLotCtc.replace(/^[a-zA-Z\s-]+/g, "").trim();
    if (!cleanLotCtc) cleanLotCtc = rawLotCtc;
    if (cleanLotCtc.length > 9) cleanLotCtc = cleanLotCtc.slice(0, 9);
    const lotCtcFontSize = cleanLotCtc.length > 8 ? 5.5 : cleanLotCtc.length > 6 ? 6.0 : 6.5;
    drawText(cleanLotCtc, 370.0, 101.0, lotCtcFontSize, false, 9);

    drawText(data.lotOwnerGovIdDateIssued || "Jan 10, 2024", 465.0, 101.0, 6.2, false, 12);
    drawText(data.lotOwnerGovIdPlaceIssued || "Sto. Tomas", 555.0, 101.0, 6.2, false, 16);
  }

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
  const fontReg = await doc.embedFont(StandardFonts.Helvetica);

  const navy = rgb(0.05, 0.12, 0.35);
  const red = rgb(0.75, 0.05, 0.10);
  const gray = rgb(0.40, 0.40, 0.40);
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

  // Helper for drawing 1 character centered in compartment boxes
  const drawCompartmentChars = (
    value: string | undefined | null,
    boxLefts: number[],
    boxWidth: number,
    baselineY: number,
    fontSize: number = 9.0
  ) => {
    if (!value) return;
    const cleanChars = safeText(value).replace(/\s+/g, "").split("");
    boxLefts.forEach((bLeft, idx) => {
      if (idx < cleanChars.length) {
        const char = cleanChars[idx];
        const charW = fontBold.widthOfTextAtSize(char, fontSize);
        const charX = bLeft + (boxWidth - charW) / 2;
        p1.drawText(char, { x: charX, y: baselineY, size: fontSize, font: fontBold, color: darkNavy });
      }
    });
  };

  // Header 1: APPLICATION NO. (10 boxes: x = 27.24 to 152.76, width = 12.60, baseline y = 661.0)
  const appBoxLefts = [27.24, 39.84, 52.44, 65.04, 77.40, 90.00, 102.60, 115.20, 127.56, 140.16];
  let cleanApp = safeText(data.applicationNo || "2026-0001")
    .replace(/^APP-(TEST-)?/i, "")
    .replace(/^UNIFIED-/i, "")
    .replace(/\s+/g, "")
    .trim();
  if (cleanApp.length > 10) cleanApp = cleanApp.slice(0, 10);
  drawCompartmentChars(cleanApp, appBoxLefts, 12.60, 661.0, 9.0);

  // Header 2: DP NO (8 boxes: x = 240.72 to 341.16, width = 12.60, baseline y = 661.0)
  // Automatically generated and filled when submitted
  const dpBoxLefts = [240.72, 253.32, 265.92, 278.52, 290.76, 303.36, 315.96, 328.56];
  const rawDp = data.demolitionPermitNo || data.dpNo || (data.permitNo?.startsWith("DP-") ? data.permitNo : `DP-${cleanApp}`);
  let cleanDp = rawDp.replace(/^DP-/i, "").trim();
  if (cleanDp.length > 8 && /^\d{4}-0\d{3}$/.test(cleanDp)) {
    cleanDp = cleanDp.replace(/-0(\d{3})$/, '-$1');
  } else if (cleanDp.length > 8) {
    cleanDp = cleanDp.slice(0, 8);
  }
  drawCompartmentChars(cleanDp, dpBoxLefts, 12.60, 661.0, 9.0);

  // Header 3: BUILDING PERMIT NO. (8 boxes: x = 465.96 to 566.52, width = 12.60, baseline y = 661.0)
  // Gather building permit number when this demolition permit is submitted alongside or linked to a building permit
  const isWithBuildingPermit = Boolean(
    data.withBuildingPermit === true ||
    (data.withBuildingPermit !== false && Boolean(data.buildingPermitNo || data.bpNo)) ||
    (data.activePermitForms && data.activePermitForms.includes("buildingPermit")) ||
    (data.projectType?.matrix?.buildingPermit === 'required' || data.projectType?.matrix?.buildingPermit === 'conditional')
  );

  const rawBp = isWithBuildingPermit
    ? (data.buildingPermitNo || data.bpNo || (data.permitNo?.startsWith("BP-") ? data.permitNo : `BP-${cleanApp}`))
    : undefined;

  if (rawBp && isWithBuildingPermit) {
    const bpBoxLefts = [465.96, 478.56, 491.16, 503.52, 516.12, 528.72, 541.32, 553.92];
    let cleanBp = rawBp.replace(/^BP-/i, "").trim();
    if (cleanBp.length > 8 && /^\d{4}-0\d{3}$/.test(cleanBp)) {
      cleanBp = cleanBp.replace(/-0(\d{3})$/, '-$1');
    } else if (cleanBp.length > 8) {
      cleanBp = cleanBp.slice(0, 8);
    }
    drawCompartmentChars(cleanBp, bpBoxLefts, 12.60, 661.0, 9.0);
  }

  const drawCheck = (x: number, y: number) => {
    p1.drawText("X", { x, y, size: 9, font: fontBold, color: darkNavy });
  };

  // Box 1: Row 1 - Owner / Applicant (Baseline y = 603.5, labels at y = 617.2, bottom border y = 597.23)
  const { lastName, firstName, mi, middleName } = parseApplicantName(data);
  drawText(lastName, 160.0, 603.5, 8.5, true, 20);
  drawText(firstName, 270.0, 603.5, 8.5, true, 22);
  drawText(mi || (middleName ? middleName.slice(0, 1) + "." : ""), 445.0, 603.5, 8.5, true, 4);
  drawText(data.applicantTIN || "000-123-456-000", 475.0, 603.5, 7.5, false, 18);

  // Box 1: Row 2 - Enterprise, Form of Ownership, Use/Occupancy (Baseline y = 574.0, labels at y = 588.1, bottom border y = 565.98)
  const entName = data.enterpriseName || data.constructionOwnedByEnterprise || (data.formOfOwnership?.includes("INDIVIDUAL") ? "N/A" : "");
  drawText(entName, 35.0, 568.0, 7.5, false, 28);
  drawText(data.formOfOwnership || "INDIVIDUAL / OWNER", 235.0, 574.0, 8.0, true, 24);
  drawText((data.projectType?.category || data.occupancyClass || "RESIDENTIAL").toUpperCase(), 395.0, 574.0, 8.0, true, 24);

  // Box 1: Row 3 - Address, Telephone, Barangay, City/Municipality, Zip Code
  const addr = parseBox1AddressParts(data);
  if (addr.no) {
    const noFontSize = addr.no.length > 5 ? 5.8 : addr.no.length > 3 ? 6.5 : 7.2;
    drawText(addr.no, 93.0, 556.5, noFontSize, false, 8);
  }
  const streetFontSize = addr.street.length > 22 ? 5.8 : addr.street.length > 16 ? 6.5 : 7.2;
  drawText(addr.street, 145.0, 556.5, streetFontSize, false, 28);
  drawText(addr.phone, 102.0, 546.5, 7.5, false, 16);
  drawText(addr.barangay, 215.0, 546.5, 7.5, false, 18);
  drawText(addr.municipality, 320.0, 546.5, 7.5, false, 24);
  drawText(addr.zipCode, 450.0, 546.5, 7.5, false, 10);

  // Box 1: Row 4 - Location of Demolition Works
  // Sub-row 1 (y = 531.3): LOT NO., BLK NO., TCT NO., TAX DEC. NO.
  const cleanLot = safeText(data.lotNo || "12").replace(/^lot\s*/i, "");
  const cleanBlk = safeText(data.blockNo || "4").replace(/^(blk|block)\s*/i, "");
  drawText(cleanLot, 215.0, 531.3, 7.5, true, 8);
  drawText(cleanBlk, 286.0, 531.3, 7.5, true, 8);
  drawText(data.tctNo || "TCT-889977-P", 358.0, 531.3, 7.5, true, 16);
  drawText(data.taxDecNo || "TD-2026-004455", 488.0, 531.3, 7.5, true, 16);

  // Sub-row 2 (y = 517.5): STREET, BARANGAY, CITY/MUNICIPALITY OF
  let streetVal = data.projectStreet || data.street;
  if (!streetVal && data.projectAddress) {
    streetVal = data.projectAddress.replace(/^(lot\s+\d+[\s,]+)?(blk|block)\s+\d+[\s,]+/i, "").trim();
  }
  drawText(streetVal || "Sunset Valley Subd.", 73.0, 517.5, 7.0, false, 20);
  drawText(data.barangay || "Poblacion", 205.0, 517.5, 7.5, true, 24);
  drawText((data.city || data.municipality || "STO. TOMAS, PAMPANGA").toUpperCase(), 440.0, 517.5, 7.5, true, 24);

  // Box 1: Row 5 - Scope of Work (Check DEMOLITION box & place clean description on line)
  drawCheck(46.0, 483.0);
  const bldgType = data.demolitionBuildingType || data.projectType?.name || "Single-Detached Residential";
  const storeys = data.demolitionStoreys || data.proposedStoreys;
  const area = data.demolitionArea || data.floorArea;
  let scopeDesc = bldgType;
  if (storeys && area) {
    scopeDesc = `${bldgType} (${storeys}-Storey, ${area} sq.m.)`;
  } else if (storeys) {
    scopeDesc = `${bldgType} (${storeys}-Storey)`;
  } else if (area) {
    scopeDesc = `${bldgType} (${area} sq.m.)`;
  }
  drawText(scopeDesc, 115.0, 482.0, 7.5, true, 55);

  // Box 2: Full-Time Inspector and Supervisor of Demolition Works (Architect or Civil Engineer)
  const supName = (data.demolitionSupervisorName || data.civilEngineerName || data.architectName || "Engr. Roberto Cruz, CE").toUpperCase();
  if (data.demolitionSupervisorSignature || data.civilEngineerSignature || data.engineerSignature) {
    await embedSignatureImage(doc, p1, data.demolitionSupervisorSignature || data.civilEngineerSignature || data.engineerSignature, 65, 395.0, 110, 26);
  }
  drawText(supName, 70.0, 396.0, 8.5, true, 30);
  drawText(data.submissionDate || data.proposedStartDate || data.demolitionStartDate || "Oct 01, 2026", 125.0, 368.5, 7.5, false, 16);
  drawText(data.demolitionSupervisorAddress || data.civilEngineerAddress || "Sto. Tomas, Pampanga", 345.0, 415.8, 7.0, false, 28);
  drawText(data.demolitionSupervisorPhone || data.applicantPhone || "0918-765-4321", 520.0, 415.8, 7.0, false, 15);
  drawText(data.demolitionSupervisorPRC || data.civilEngineerPRC || "0078923", 345.0, 401.0, 7.5, false, 14);
  drawText(data.demolitionSupervisorPRCValidity || data.civilEngineerPRCValidity || "2028-11-20", 480.0, 401.0, 7.5, false, 14);
  drawText(data.demolitionSupervisorPTR || data.civilEngineerPTR || "PTR-ST-2026-001", 345.0, 386.5, 7.5, false, 18);
  drawText(data.demolitionSupervisorPTRIssued || data.civilEngineerPTRIssued || "Jan 10, 2026", 495.0, 386.5, 7.5, false, 14);
  drawText(data.demolitionSupervisorPTRIssuedAt || data.civilEngineerPTRIssuedAt || "Sto. Tomas", 345.0, 371.0, 7.5, false, 14);
  drawText(data.demolitionSupervisorTIN || data.civilEngineerTIN || "456-789-012-000", 460.0, 371.0, 7.5, false, 18);

  // Box 3: Applicant & With My Consent: Lot Owner
  // Left: Applicant
  const appFullName = (data.applicantName || `${firstName} ${lastName}`).toUpperCase().trim();
  const appNameW = fontBold.widthOfTextAtSize(appFullName, 8.0);
  const appNameX = Math.max(70.0, 157.5 - appNameW / 2);
  drawText(appFullName, appNameX, 290.0, 8.0, true, 26);

  if (data.applicantSignature) {
    const sigW = 100;
    const sigH = 20;
    const sigX = Math.max(70.0, 157.5 - sigW / 2);
    await embedSignatureImage(doc, p1, data.applicantSignature, sigX, 289.0, sigW, sigH);
  }

  drawText(data.submissionDate || data.applicantSignedDate || "Oct 01, 2026", 140.0, 269.0, 6.8, false, 14);

  const appAddrSummary = `${addr.no ? addr.no + " " : ""}${addr.street || "123 Rizal St."}, ${addr.barangay || "Poblacion"}`.toUpperCase();
  drawText(appAddrSummary, 75.0, 252.0, 6.8, false, 34);

  const rawAppCtc = (data.applicantCtcNo || data.govIdNo || "00192847").trim();
  let cleanAppCtc = rawAppCtc.replace(/^[a-zA-Z\s-]+/g, "").trim();
  if (!cleanAppCtc) cleanAppCtc = rawAppCtc;
  if (cleanAppCtc.length > 9) cleanAppCtc = cleanAppCtc.slice(0, 9);
  const appCtcFontSize = cleanAppCtc.length > 8 ? 5.5 : cleanAppCtc.length > 6 ? 6.0 : 6.5;
  drawText(cleanAppCtc, 65.0, 227.0, appCtcFontSize, false, 9);

  drawText(data.applicantGovIdDateIssued || data.govIdDateIssued || "Jan 08, 2026", 155.0, 227.0, 6.2, false, 12);
  drawText(data.applicantGovIdPlaceIssued || data.govIdPlaceIssued || "Sto. Tomas", 245.0, 227.0, 6.2, false, 16);

  // Right: With My Consent (Lot Owner)
  if (data.lotOwnerConsent || data.lotOwnerName) {
    const lotName = safeText(data.lotOwnerName || "Dave Sicat").toUpperCase().trim();
    const lotNameW = fontBold.widthOfTextAtSize(lotName, 8.0);
    const lotNameX = Math.max(355.0, 447.5 - lotNameW / 2);
    drawText(lotName, lotNameX, 290.0, 8.0, true, 26);

    if (data.lotOwnerSignature) {
      const sigW = 100;
      const sigH = 20;
      const sigX = Math.max(355.0, 447.5 - sigW / 2);
      await embedSignatureImage(doc, p1, data.lotOwnerSignature, sigX, 289.0, sigW, sigH);
    }

    drawText(data.lotOwnerSignedDate || data.submissionDate || "Oct 01, 2026", 425.0, 269.0, 6.8, false, 14);

    const lotAddr = safeText(data.lotOwnerAddress || data.projectAddress || "153 Sitio Visitas, Sto. Tomas, Pampanga").toUpperCase();
    drawText(lotAddr, 375.0, 252.0, 6.8, false, 34);

    const rawLotCtc = (data.lotOwnerGovIdNo || data.lotOwnerCtcNo || "00881923").trim();
    let cleanLotCtc = rawLotCtc.replace(/^[a-zA-Z\s-]+/g, "").trim();
    if (!cleanLotCtc) cleanLotCtc = rawLotCtc;
    if (cleanLotCtc.length > 9) cleanLotCtc = cleanLotCtc.slice(0, 9);
    const lotCtcFontSize = cleanLotCtc.length > 8 ? 5.5 : cleanLotCtc.length > 6 ? 6.0 : 6.5;
    drawText(cleanLotCtc, 360.0, 227.0, lotCtcFontSize, false, 9);

    drawText(data.lotOwnerGovIdDateIssued || "Jan 10, 2024", 455.0, 227.0, 6.2, false, 12);
    drawText(data.lotOwnerGovIdPlaceIssued || "Sto. Tomas", 545.0, 227.0, 6.2, false, 16);
  }

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
  const p2 = doc.getPage(1);

  const drawText = (page: PDFPage, text: string | undefined | null, x: number, y: number, size: number = 8, isBold: boolean = false, maxWidth?: number) => {
    if (!text) return;
    let clean = safeText(text).trim();
    if (maxWidth && clean.length > maxWidth) clean = clean.slice(0, maxWidth);
    page.drawText(clean, { x, y, size, font: isBold ? fontBold : fontRegular, color: darkNavy });
  };

  const drawCheck = (page: PDFPage, x: number, y: number, size: number = 8.5) => {
    page.drawText("X", { x, y, size, font: fontBold, color: darkNavy });
  };

  const drawBoxesText = (page: PDFPage, text: string | undefined | null, startX: number, y: number, boxWidth: number = 12.6, maxLen: number = 10, size: number = 8.0) => {
    if (!text) return;
    const clean = safeText(text).replace(/[\s\-]/g, "").toUpperCase();
    for (let i = 0; i < clean.length && i < maxLen; i++) {
      const ch = clean[i];
      const charWidth = fontBold.widthOfTextAtSize(ch, size);
      const chX = startX + i * boxWidth + (boxWidth - charWidth) / 2;
      page.drawText(ch, { x: chX, y, size, font: fontBold, color: darkNavy });
    }
  };

  // ==========================================
  // PAGE 1: HEADER & BOXES 1 TO 5
  // ==========================================

  // Header: Segmented boxes for APPLICATION NO. (10 boxes), FP NO (8 boxes), BUILDING PERMIT NO. (8 boxes)
  const appNo = (data.applicationNo || "2026-6636").trim();
  drawBoxesText(p1, appNo, 27.0, 663.0, 12.6, 10, 8.0);

  const fpNo = (data.fencingPermitNo || data.permitNo || "2026-0042").trim();
  drawBoxesText(p1, fpNo, 240.5, 663.0, 12.6, 8, 8.0);

  const bpNo = (data.buildingPermitNo || (data.applicationNo ? `BP-${data.applicationNo.replace(/^APP-/i, "")}` : "2026-0118")).trim();
  drawBoxesText(p1, bpNo, 464.2, 663.0, 12.6, 8, 8.0);

  // BOX 1 (TO BE ACCOMPLISHED BY THE OWNER/APPLICANT)
  // Row 1: OWNER/APPLICANT - LAST NAME, FIRST NAME, M.I., TIN
  const { lastName, firstName, mi } = parseApplicantName(data);
  drawText(p1, lastName, 138, 612.0, 8.0, true, 22);
  drawText(p1, firstName, 268, 612.0, 8.0, true, 24);
  drawText(p1, mi, 432, 612.0, 8.0, true, 6);
  drawText(p1, data.applicantTIN || "000-123-456-000", 472, 612.0, 7.5, false, 18);

  // Row 2: FOR CONSTRUCTION OWNED BY AN ENTERPRISE | FORM OF OWNERSHIP
  const enterprise = data.constructionOwnedByEnterprise || data.corporationName || data.enterpriseName;
  if (enterprise) {
    drawText(p1, enterprise.toUpperCase(), 135, 587.0, 7.5, true, 20);
  } else {
    drawText(p1, "N/A (INDIVIDUAL)", 135, 587.0, 7.0, false);
  }
  const formOfOwnershipText = (data.formOfOwnership || "INDIVIDUAL / OWNER").toUpperCase();
  drawText(p1, formOfOwnershipText, 315, 587.0, 8.0, true, 35);

  // Row 3: ADDRESS: NO., STREET, BARANGAY, CITY/MUNICIPALITY, ZIP CODE | TELEPHONE NO
  const addr = parseApplicantAddress(data);
  drawText(p1, addr.noStreet || "123 RIZAL ST.", 85, 559.0, 7.5, true, 20);
  drawText(p1, addr.barangay || "POBLACION", 205, 559.0, 7.5, true, 16);
  drawText(p1, addr.municipality || "STO. TOMAS, PAMPANGA", 285, 559.0, 7.5, true, 24);
  drawText(p1, addr.zipCode || "2020", 395, 559.0, 7.5, true, 6);
  drawText(p1, addr.contactNo || data.applicantPhone || "0917-123-4567", 455, 559.0, 7.5, true, 16);

  // Row 4: LOCATION OF CONSTRUCTION
  // Subline 1: LOT NO., BLK NO., TCT NO., TAX DEC. NO.
  drawText(p1, data.lotNo || "12", 188, 540.0, 7.5, true, 8);
  drawText(p1, data.blockNo || "4", 275, 540.0, 7.5, true, 8);
  drawText(p1, data.tctNo || "TCT-889977-P", 360, 540.0, 7.5, true, 18);
  drawText(p1, data.taxDecNo || "TD-2026-004455", 486, 540.0, 7.0, true, 18);

  // Subline 2: STREET, BARANGAY, CITY/MUNICIPALITY OF
  const projStreet = (data.projectAddress || "SUNSET VALLEY SUBD.").toUpperCase();
  drawText(p1, projStreet, 68, 522.0, 6.8, true, 16);
  drawText(p1, data.barangay || "POBLACION", 180, 522.0, 7.5, true, 28);
  drawText(p1, "STO. TOMAS, PAMPANGA", 445, 522.0, 7.5, true, 22);

  // Row 5: SCOPE OF WORK (Official NBC Form B-03 Checkboxes)
  const scopeNorm = (data.fencingScopeOfWork || data.scopeOfWork || "New Construction").toLowerCase();
  const scopeDetails = (data.fencingScopeDetails || data.scopeOfWorkDetails || data.scopeOthers || "").trim();

  if (scopeNorm.includes("erect")) {
    drawCheck(p1, 44.5, 481.0);
  } else if (scopeNorm.includes("add")) {
    drawCheck(p1, 44.5, 468.0);
  } else if (scopeNorm.includes("repair")) {
    drawCheck(p1, 178.0, 495.0);
    if (scopeDetails) drawText(p1, scopeDetails, 225, 494.0, 7.0, false, 24);
  } else if (scopeNorm.includes("demoli")) {
    drawCheck(p1, 178.0, 478.5);
    if (scopeDetails) drawText(p1, scopeDetails, 245, 478.5, 7.0, false, 24);
  } else if (scopeNorm.includes("other") || scopeDetails) {
    drawCheck(p1, 368.5, 494.0);
    drawText(p1, scopeDetails || "FENCING WORKS", 445, 494.0, 7.0, false, 24);
  } else {
    // Default: New Construction
    drawCheck(p1, 44.5, 494.5);
  }

  // BOX 2: DESIGN PROFESSIONAL, PLANS AND SPECIFICATIONS
  const isCivilDesigner = data.fencingDesignerRole === "civilEngineer" || (!data.architectName && Boolean(data.civilEngineerName));
  const desName = (data.fencingDesignerName || (isCivilDesigner ? (data.civilEngineerName || "Engr. Roberto Dizon, CE") : (data.architectName || "Arch. Maria Elena Santos, UAP"))).toUpperCase();
  const desAddress = data.fencingDesignerAddress || (isCivilDesigner ? data.civilEngineerAddress : data.architectAddress) || "San Nicolas, Sto. Tomas, Pampanga";
  const desPRC = data.fencingDesignerPRC || (isCivilDesigner ? data.civilEngineerPRC : data.architectPRC) || "PRC-0045211";
  const desPRCVal = data.fencingDesignerPRCValidity || (isCivilDesigner ? data.civilEngineerPRCValidity : data.architectPRCValidity) || "2027-11-15";
  const desPTR = data.fencingDesignerPTR || (isCivilDesigner ? data.civilEngineerPTR : data.architectPTR) || "PTR-ST-2026-004";
  const desPTRDate = data.fencingDesignerPTRIssued || (isCivilDesigner ? data.civilEngineerPTRIssued : data.architectPTRDate) || "Jan 08, 2026";
  const desPTRIssuedAt = data.fencingDesignerPTRIssuedAt || (isCivilDesigner ? data.civilEngineerPTRIssuedAt : data.architectPTRIssuedAt) || "Sto. Tomas, Pampanga";
  const desTIN = data.fencingDesignerTIN || (isCivilDesigner ? data.civilEngineerTIN : data.architectTIN) || "456-789-012-000";

  // Underline is at y=399.0; name placed right above the line
  drawText(p1, desName, 70, 401.5, 7.5, true, 26);
  drawText(p1, data.submissionDate || "Sep 22, 2026", 225, 401.0, 6.8, false);
  drawText(p1, desAddress, 75, 369.0, 6.8, false, 32);
  drawText(p1, desPRC, 75, 358.0, 6.8, false, 16);
  drawText(p1, desPRCVal, 195, 358.0, 6.8, false, 14);
  drawText(p1, desPTR, 75, 347.0, 6.8, false, 16);
  drawText(p1, desPTRDate, 210, 347.0, 6.8, false, 14);
  drawText(p1, desPTRIssuedAt, 75, 336.0, 6.8, false, 18);
  drawText(p1, desTIN, 180, 336.0, 6.8, false, 18);

  const desSig = data.fencingDesignerSignature || (isCivilDesigner ? data.civilEngineerSignature : data.architectSignature);
  if (desSig) {
    await embedSignatureImage(doc, p1, desSig, 70, 399.0, 115, 26);
  }

  // BOX 3: FULL-TIME INSPECTOR AND SUPERVISOR OF CONSTRUCTION WORKS
  const isSameSupervisor = data.fencingSupervisorRole === "same" || (!data.fencingSupervisorName && !data.supervisorCivilEngineerName && !data.supervisorArchitectName);
  const supName = (isSameSupervisor ? desName : (data.fencingSupervisorName || data.supervisorCivilEngineerName || data.supervisorArchitectName || "Engr. Roberto Dizon, CE")).toUpperCase();
  const supAddress = (isSameSupervisor ? desAddress : (data.fencingSupervisorAddress || data.supervisorCivilEngineerAddress || data.supervisorArchitectAddress)) || "Poblacion, Sto. Tomas, Pampanga";
  const supPRC = (isSameSupervisor ? desPRC : (data.fencingSupervisorPRC || data.supervisorCivilEngineerPRC || data.supervisorArchitectPRC)) || "PRC-0089123";
  const supPRCVal = (isSameSupervisor ? desPRCVal : (data.fencingSupervisorPRCValidity || data.supervisorCivilEngineerPRCValidity || data.supervisorArchitectPRCValidity)) || "2028-04-20";
  const supPTR = (isSameSupervisor ? desPTR : (data.fencingSupervisorPTR || data.supervisorCivilEngineerPTR || data.supervisorArchitectPTR)) || "PTR-ST-2026-099";
  const supPTRDate = (isSameSupervisor ? desPTRDate : (data.fencingSupervisorPTRIssued || data.supervisorCivilEngineerPTRIssued || data.supervisorArchitectPTRIssued)) || "Jan 12, 2026";
  const supPTRIssuedAt = (isSameSupervisor ? desPTRIssuedAt : (data.fencingSupervisorPTRIssuedAt || data.supervisorCivilEngineerPTRIssuedAt || data.supervisorArchitectPTRIssuedAt)) || "Sto. Tomas, Pampanga";
  const supTIN = (isSameSupervisor ? desTIN : (data.fencingSupervisorTIN || data.supervisorCivilEngineerTIN || data.supervisorArchitectTIN)) || "987-654-321-000";

  drawText(p1, supName, 345, 401.5, 7.5, true, 26);
  drawText(p1, data.submissionDate || "Sep 22, 2026", 505, 401.0, 6.8, false);
  drawText(p1, supAddress, 355, 369.0, 6.8, false, 32);
  drawText(p1, supPRC, 355, 358.0, 6.8, false, 16);
  drawText(p1, supPRCVal, 475, 358.0, 6.8, false, 14);
  drawText(p1, supPTR, 355, 347.0, 6.8, false, 16);
  drawText(p1, supPTRDate, 485, 347.0, 6.8, false, 14);
  drawText(p1, supPTRIssuedAt, 355, 336.0, 6.8, false, 18);
  drawText(p1, supTIN, 460, 336.0, 6.8, false, 18);

  const supSig = isSameSupervisor ? desSig : (data.fencingSupervisorSignature || data.supervisorCivilEngineerSignature || data.supervisorArchitectSignature);
  if (supSig) {
    await embedSignatureImage(doc, p1, supSig, 350, 399.0, 115, 26);
  }

  // BOX 4: APPLICANT (LEFT) & LOT OWNER CONSENT (RIGHT)
  // Applicant
  const applicantFullName = (data.applicantName || `${firstName} ${lastName}`).toUpperCase().trim();
  const appNameW = fontBold.widthOfTextAtSize(applicantFullName, 8.0);
  const appNameX = Math.max(50.0, 146.5 - appNameW / 2);
  drawText(p1, applicantFullName, appNameX, 252.5, 8.0, true, 26);

  if (data.applicantSignature) {
    const sigW = 100;
    const sigH = 20;
    const sigX = Math.max(50.0, 146.5 - sigW / 2);
    await embedSignatureImage(doc, p1, data.applicantSignature, sigX, 251.0, sigW, sigH);
  }

  drawText(p1, data.applicantSignedDate || data.submissionDate || "Sep 22, 2026", 135.0, 229.5, 6.8, false, 14);

  const appAddrSummary = `${addr.noStreet || "123 Rizal St."}, ${addr.barangay || "Poblacion"}`.toUpperCase();
  drawText(p1, appAddrSummary, 70.0, 217.0, 6.8, false, 32);

  const rawCtc = (data.applicantCtcNo || data.govIdNo || "00192847").trim();
  let cleanCtc = rawCtc.replace(/^[a-zA-Z\s-]+/g, "").trim();
  if (!cleanCtc) cleanCtc = rawCtc;
  if (cleanCtc.length > 9) cleanCtc = cleanCtc.slice(0, 9);
  const ctcFontSize = cleanCtc.length > 8 ? 5.5 : cleanCtc.length > 6 ? 6.0 : 6.5;
  drawText(p1, cleanCtc, 50.0, 202.0, ctcFontSize, false, 9);

  drawText(p1, data.applicantGovIdDateIssued || data.govIdDateIssued || "Jan 08, 2026", 115.0, 202.0, 6.2, false, 12);
  drawText(p1, data.applicantGovIdPlaceIssued || data.govIdPlaceIssued || "Sto. Tomas", 195.0, 202.0, 6.2, false, 16);

  // Lot Owner (With My Consent)
  if (data.lotOwnerConsent || data.lotOwnerName) {
    const lotOwnerFullName = safeText(data.lotOwnerName || "DAVE SICAT").toUpperCase().trim();
    const lotNameW = fontBold.widthOfTextAtSize(lotOwnerFullName, 8.0);
    const lotNameX = Math.max(340.0, 436.5 - lotNameW / 2);
    drawText(p1, lotOwnerFullName, lotNameX, 252.5, 8.0, true, 26);

    if (data.lotOwnerSignature) {
      const sigW = 100;
      const sigH = 20;
      const sigX = Math.max(340.0, 436.5 - sigW / 2);
      await embedSignatureImage(doc, p1, data.lotOwnerSignature, sigX, 251.0, sigW, sigH);
    }

    drawText(p1, data.lotOwnerSignedDate || data.submissionDate || "Sep 22, 2026", 415.0, 229.5, 6.8, false, 14);

    const lotAddr = safeText(data.lotOwnerAddress || "153 Sitio Visitas, Sto. Tomas, Pampanga").toUpperCase();
    drawText(p1, lotAddr, 372.0, 217.0, 6.8, false, 32);

    const rawLotCtc = (data.lotOwnerGovIdNo || data.lotOwnerCtcNo || "00881923").trim();
    let cleanLotCtc = rawLotCtc.replace(/^[a-zA-Z\s-]+/g, "").trim();
    if (!cleanLotCtc) cleanLotCtc = rawLotCtc;
    if (cleanLotCtc.length > 9) cleanLotCtc = cleanLotCtc.slice(0, 9);
    const lotCtcFontSize = cleanLotCtc.length > 8 ? 5.5 : cleanLotCtc.length > 6 ? 6.0 : 6.5;
    drawText(p1, cleanLotCtc, 320.0, 202.0, lotCtcFontSize, false, 9);

    drawText(p1, data.lotOwnerGovIdDateIssued || "Jan 10, 2026", 400.0, 202.0, 6.2, false, 12);
    drawText(p1, data.lotOwnerGovIdPlaceIssued || "Sto. Tomas", 485.0, 202.0, 6.2, false, 16);
  }

  // ==========================================
  // PAGE 2: BOX 6 (SPECIFICATIONS), BOX 7, BOX 8
  // ==========================================

  // BOX 6 (TO BE ACCOMPLISHED BY THE DESIGN PROFESSIONAL)
  // Measurements (Length in Meters, Height in Meters)
  const fLength = (data.fencingLength || (data as any).fenceLength || "45.00").trim();
  const fHeight = (data.fencingHeight || (data as any).fenceHeight || "2.20").trim();
  drawText(p2, fLength, 135.0, 738.0, 8.5, true);
  drawText(p2, fHeight, 360.0, 738.0, 8.5, true);

  // Type of Fencing (8 official checkboxes)
  // Gather all selected fencing types (supports array or string)
  const rawList: string[] = [];
  if (Array.isArray(data.fencingTypes)) {
    rawList.push(...data.fencingTypes);
  } else if (data.fencingType) {
    rawList.push(...data.fencingType.split(","));
  } else if ((data as any).fenceType) {
    rawList.push(...((data as any).fenceType as string).split(","));
  }

  // Trim and filter empty
  const selectedTokens = rawList.map(s => (s || "").trim()).filter(Boolean);

  // If fencingTypes is explicitly empty array or empty string, do not force default
  const isExplicitlyEmpty = (Array.isArray(data.fencingTypes) && data.fencingTypes.length === 0 && !data.fencingType && !(data as any).fenceType) ||
    (data.fencingType === "" && !Array.isArray(data.fencingTypes) && !(data as any).fenceType);

  if (selectedTokens.length === 0 && !isExplicitlyEmpty && data.fencingTypes === undefined && data.fencingType === undefined) {
    selectedTokens.push("R.C. and CONC. HOLLOW BLOCKS");
  }

  let isIndigenous = false;
  let isRcOnly = false;
  let isConcHollow = false;
  let isBricks = false;
  let isInterlink = false;
  let isSteelMatting = false;
  let isBarbedWire = false;
  let isOthers = Boolean(
    (data.fencingTypeOthers && data.fencingTypeOthers.trim()) ||
    (data.fencingTypeOthersLine2 && data.fencingTypeOthersLine2.trim()) ||
    (data.fencingTypeOthersLine3 && data.fencingTypeOthersLine3.trim())
  );

  for (const token of selectedTokens) {
    const t = token.toLowerCase();
    if (t.includes("indigenous")) {
      isIndigenous = true;
    } else if (t.includes("steel matting")) {
      isSteelMatting = true;
    } else if (t.includes("barbed wire")) {
      isBarbedWire = true;
    } else if (t.includes("interlink") || t.includes("cyclone")) {
      isInterlink = true;
    } else if (t.includes("brick")) {
      isBricks = true;
    } else if (t.includes("hollow") || t.includes("chb") || (t.includes("conc.") && !t.includes("reinforced concrete"))) {
      isConcHollow = true;
    } else if (t.includes("reinforced concrete") || t === "r.c." || t === "rc") {
      isRcOnly = true;
    } else if (t.includes("other")) {
      isOthers = true;
    }
  }

  // Mark official checkboxes
  if (isIndigenous) drawCheck(p2, 160.0, 722.5);
  if (isRcOnly) drawCheck(p2, 160.0, 710.7);
  if (isConcHollow) drawCheck(p2, 160.0, 698.8);
  if (isBricks) drawCheck(p2, 160.0, 687.0);
  if (isInterlink) drawCheck(p2, 160.0, 675.0);

  if (isSteelMatting) drawCheck(p2, 367.0, 722.5);
  if (isBarbedWire) drawCheck(p2, 367.0, 710.7);

  if (isOthers) {
    drawCheck(p2, 367.0, 698.8);

    // Multi-line support across the 3 official underlines for OTHERS (Specify)
    let l1 = (data.fencingTypeOthers || "").trim();
    let l2 = (data.fencingTypeOthersLine2 || "").trim();
    let l3 = (data.fencingTypeOthersLine3 || "").trim();

    if (l1.includes("\n")) {
      const parts = l1.split("\n").map(s => s.trim()).filter(Boolean);
      l1 = parts[0] || "";
      if (!l2 && parts[1]) l2 = parts[1];
      if (!l3 && parts[2]) l3 = parts[2];
    } else if (!l2 && !l3 && l1.length > 25) {
      // Automatic word-wrap across the 3 official underlines
      const words = l1.split(" ");
      l1 = "";
      let cur = "";
      let curLine = 1;
      for (const w of words) {
        const limit = (curLine === 1) ? 25 : 38;
        const test = cur ? `${cur} ${w}` : w;
        if (test.length <= limit) {
          cur = test;
        } else {
          if (curLine === 1) {
            l1 = cur;
            cur = w;
            curLine = 2;
          } else if (curLine === 2) {
            l2 = cur;
            cur = w;
            curLine = 3;
          } else {
            cur = test;
          }
        }
      }
      if (curLine === 1) l1 = cur;
      else if (curLine === 2) l2 = cur;
      else if (curLine === 3) l3 = cur;
    }

    if (l1) drawText(p2, l1, 440.0, 698.5, 7.2, false, 28);
    if (l2) drawText(p2, l2, 385.0, 689.0, 7.2, false, 42);
    if (l3) drawText(p2, l3, 385.0, 675.0, 7.2, false, 42);
  }

  // BOX 7: ASSESSED FEES
  drawText(p2, "150.00", 180, 456.0, 7.5, false);
  const costNum = parseFloat((data.fencingCost || (data as any).fenceCost || data.projectCost || "150,000.00").replace(/[^0-9.]/g, "")) || 150000;
  const fencingFee = (Math.max(300, costNum * 0.003)).toFixed(2);
  drawText(p2, fencingFee, 180, 438.0, 7.5, false);
  const totalFee = (150.00 + parseFloat(fencingFee)).toFixed(2);
  drawText(p2, totalFee, 180, 364.0, 8.0, true);

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

  const boxWidth = 13.35;

  // 1. APPLICATION NO. in individual segmented boxes (10 boxes)
  const rawAppNo = safeText(data.applicationNo || "2026-0001").trim();
  const cleanAppNo = rawAppNo.replace(/^(APP|UNIFIED|PERMIT|DOC)[\s\-#:]*(TEST[\s\-#:]*)?/i, "").trim() || "2026-0001";
  const appChars = cleanAppNo.slice(0, 10).split("");
  const appBoxLefts = Array.from({ length: 10 }, (_, i) => 23.40 + i * boxWidth);
  appBoxLefts.forEach((boxLeft, idx) => {
    if (idx < appChars.length) {
      const char = appChars[idx];
      const charW = fontBold.widthOfTextAtSize(char, 9.0);
      const charX = boxLeft + (boxWidth - charW) / 2;
      p1.drawText(char, { x: charX, y: 642.2, size: 9.0, font: fontBold, color: darkNavy });
    }
  });

  // 2. EGPP NO. (Excavation & Ground Preparation Permit No.) in individual segmented boxes (8 boxes)
  const isApprovedOrIssued =
    data.isApproved === true ||
    data.status === "approved" ||
    data.status === "released" ||
    Boolean(data.permitIssuedDate) ||
    Boolean(data.dateIssued) ||
    Boolean(data.excavationPermitNo) ||
    Boolean(data.egppNo) ||
    (Boolean(data.permitNo) && !data.permitNo?.startsWith("AP-") && !data.permitNo?.startsWith("BP-") && !data.permitNo?.startsWith("EP-") && !data.permitNo?.startsWith("P-") && !data.permitNo?.startsWith("SP-") && !data.permitNo?.startsWith("MP-")) ||
    (!data.status); // Default to preview if no submission status is provided (e.g. Form Tester)

  if (isApprovedOrIssued) {
    const rawEgppNo = (
      data.excavationPermitNo ||
      data.egppNo ||
      (data.permitNo && !data.permitNo.startsWith("AP-") && !data.permitNo.startsWith("BP-") && !data.permitNo.startsWith("EP-") && !data.permitNo.startsWith("P-") && !data.permitNo.startsWith("SP-") && !data.permitNo.startsWith("MP-") ? data.permitNo : "") ||
      (data.applicationNo ? `EXP-${cleanAppNo}` : "EXP-2026-0001")
    ).trim();

    if (rawEgppNo) {
      let cleanEgppNo = rawEgppNo.replace(/^(EXP|EGPP|APP|NBC)[\s\-#:]*(TEST[\s\-#:]*)?/i, "").trim();
      if (cleanEgppNo.length > 8 && cleanEgppNo.includes('-')) {
        cleanEgppNo = cleanEgppNo.replace(/-/g, '');
      }
      const egppChars = cleanEgppNo.slice(0, 8).split("");
      const egppBoxLefts = Array.from({ length: 8 }, (_, i) => 278.60 + i * boxWidth);
      egppBoxLefts.forEach((boxLeft, idx) => {
        if (idx < egppChars.length) {
          const char = egppChars[idx];
          const charW = fontBold.widthOfTextAtSize(char, 9.0);
          const charX = boxLeft + (boxWidth - charW) / 2;
          p1.drawText(char, { x: charX, y: 643.7, size: 9.0, font: fontBold, color: darkNavy });
        }
      });
    }
  }

  // 3. BUILDING PERMIT NO. in individual segmented boxes (8 boxes)
  // Auto-gathered if the user's selected project type requires/accompanies a Building Permit,
  // or if buildingPermitNo / activePermitForms includes buildingPermit
  const isBpRequired =
    Boolean(data.buildingPermitNo) ||
    Boolean(data.bpNo) ||
    Boolean(data.permitNo?.startsWith("BP-")) ||
    (Array.isArray(data.activePermitForms) && data.activePermitForms.includes("buildingPermit")) ||
    data.withBuildingPermit === true ||
    (!data.projectType) ||
    (data.projectType?.matrix?.buildingPermit === 'required' || data.projectType?.matrix?.buildingPermit === 'conditional');

  if (isBpRequired) {
    const rawBpNo = (
      data.buildingPermitNo ||
      data.bpNo ||
      (data.permitNo?.startsWith("BP-") ? data.permitNo : "") ||
      (data.applicationNo ? `BP-${cleanAppNo}` : "BP-2026-0001")
    ).trim();

    if (rawBpNo) {
      let cleanBpNo = rawBpNo.replace(/^(BP|APP|NBC)[\s\-#:]*(TEST[\s\-#:]*)?/i, "").trim();
      if (cleanBpNo.length > 8 && cleanBpNo.includes('-')) {
        cleanBpNo = cleanBpNo.replace(/-/g, '');
      }
      const bpChars = cleanBpNo.slice(0, 8).split("");
      const bpBoxLefts = Array.from({ length: 8 }, (_, i) => 481.80 + i * boxWidth);
      bpBoxLefts.forEach((boxLeft, idx) => {
        if (idx < bpChars.length) {
          const char = bpChars[idx];
          const charW = fontBold.widthOfTextAtSize(char, 9.0);
          const charX = boxLeft + (boxWidth - charW) / 2;
          p1.drawText(char, { x: charX, y: 643.7, size: 9.0, font: fontBold, color: darkNavy });
        }
      });
    }
  }

  // ==========================================
  // BOX 1: OWNER / APPLICANT INFORMATION
  // ==========================================
  const { lastName, firstName, mi, middleName } = parseApplicantName(data);
  drawText(lastName, 166.0, 591.0, 8.5, true, 18);
  drawText(firstName, 256.0, 591.0, 8.5, true, 20);
  drawText(middleName || mi, 355.0, 591.0, 8.5, true, 18);
  drawText(data.applicantTIN || "123-456-789-000", 488.0, 591.0, 8.0, false, 18);

  // Row 2: Enterprise, Form of Ownership, Use/Character of Occupancy
  const enterpriseName = (data.constructionOwnedByEnterprise || data.enterpriseName || data.corporationName || "N/A (INDIVIDUAL)").trim();
  drawText(enterpriseName, 30.0, 560.0, 7.5, false, 28);
  drawText(data.formOfOwnership || "INDIVIDUAL / OWNER", 205.0, 560.0, 7.5, false, 26);
  const occTitle = safeText(data.occupancyClassificationDetail || data.occupancyClass || data.projectType?.category || "RESIDENTIAL").toUpperCase();
  drawText(occTitle, 385.0, 560.0, 7.5, false, 28);

  // Row 3: Applicant Address & Phone
  const addr = parseBox1AddressParts(data);
  drawText(addr.no || "123", 116.0, 547.5, 7.5, false, 10);
  drawText(addr.street || "Rizal St.", 198.0, 547.5, 7.5, false, 38);
  drawText(addr.barangay || "Poblacion", 80.0, 529.0, 7.5, false, 16);
  drawText(addr.municipality || "Sto. Tomas, Pampanga", 268.0, 529.0, 7.5, false, 24);
  drawText(addr.zipCode || "2020", 433.0, 529.0, 7.5, false, 8);
  drawText(addr.phone || data.applicantPhone || "0917-123-4567", 490.0, 533.0, 7.5, true, 16);

  // Row 4: Location of Installation
  drawText(data.lotNo || "12", 195.0, 516.0, 7.5, true, 8);
  drawText(data.blockNo || "4", 296.0, 516.0, 7.5, true, 8);
  drawText(data.tctNo || "TCT-889977-P", 389.0, 516.0, 7.5, true, 14);
  drawText(data.taxDecNo || "TD-2026-004455", 516.0, 516.0, 7.5, false, 14);

  // Project street (clean from lot/block if present)
  let projStreet = safeText(data.projectStreet || data.projectAddress || "Sunset Valley Subd.").trim();
  projStreet = projStreet.replace(/^(lot\s+\d+[-\w]*[\s,]+)?(blk|block)?\s*\d*[\s,]*/i, "").trim() || projStreet;
  drawText(projStreet, 65.0, 497.5, 7.0, false, 24);
  drawText(data.barangay || addr.barangay || "Poblacion", 243.0, 497.5, 7.5, true, 18);
  drawText(data.applicantMunicipality || "Sto. Tomas, Pampanga", 458.0, 497.5, 7.5, true, 20);

  // Row 5: Scope of Work Checkboxes
  const drawCheck = (x: number, y: number) => {
    p1.drawText("X", { x, y, size: 8.0, font: fontBold, color: darkNavy });
  };
  const scopeLower = safeText(data.scopeOfWork || "New Construction").toLowerCase();
  if (scopeLower.includes("demolition")) {
    drawCheck(49.4, 460.7);
  } else if (scopeLower.includes("addition")) {
    drawCheck(49.4, 449.6);
  } else if (scopeLower.includes("renovation")) {
    drawCheck(245.3, 471.0);
  } else if (scopeLower.includes("repair")) {
    drawCheck(245.4, 460.4);
  } else if (scopeLower.includes("other") || scopeLower.includes("excavation") || scopeLower.includes("grading")) {
    drawCheck(398.9, 470.6);
    drawText(data.scopeOfWorkDetails || data.excavationScope || "Site Excavation & Ground Prep", 480.0, 471.0, 7.0, false, 20);
  } else {
    // Default: New Construction
    drawCheck(49.4, 470.9);
  }

  // Row 6: Use or Character of Occupancy Checkboxes
  const occUpper = safeText(data.occupancyClass || data.projectType?.category || "RESIDENTIAL").toUpperCase();
  if (occUpper.includes("GROUP B") || occUpper.includes("HOTEL") || occUpper.includes("APARTMENT")) {
    drawCheck(49.4, 406.8);
  } else if (occUpper.includes("GROUP C") || occUpper.includes("EDUCATIONAL")) {
    drawCheck(49.4, 396.6);
  } else if (occUpper.includes("GROUP D") || occUpper.includes("INSTITUTIONAL")) {
    drawCheck(49.4, 386.2);
  } else if (occUpper.includes("GROUP E") || occUpper.includes("BUSINESS") || occUpper.includes("MERCANTILE") || occUpper.includes("COMMERCIAL")) {
    drawCheck(49.4, 375.5);
  } else if (occUpper.includes("GROUP F") || (occUpper.includes("INDUSTRIAL") && !occUpper.includes("HAZARDOUS"))) {
    drawCheck(264.6, 417.5);
  } else if (occUpper.includes("GROUP G") || occUpper.includes("HAZARDOUS")) {
    drawCheck(264.7, 406.8);
  } else if (occUpper.includes("GROUP H")) {
    drawCheck(264.6, 396.5);
  } else if (occUpper.includes("GROUP I")) {
    drawCheck(264.7, 386.0);
  } else if (occUpper.includes("GROUP J") || occUpper.includes("AGRICULTURAL")) {
    drawCheck(264.8, 375.5);
  } else if (occUpper.includes("OTHER")) {
    drawCheck(482.3, 417.5);
  } else {
    // Default: GROUP A: RESIDENTIAL, DWELLINGS
    drawCheck(49.4, 417.5);
  }

  // ==========================================
  // BOX 2: DESIGN PROFESSIONAL (ARCHITECT OR CIVIL ENGINEER)
  // ==========================================
  const ceName = (data.civilEngineerName || data.architectName || "Engr. Roberto Cruz, PICE").toUpperCase().trim();
  const ceNameW = fontBold.widthOfTextAtSize(ceName, 8.5);
  const ceNameX = Math.max(50.0, 152.0 - ceNameW / 2);
  drawText(ceName, ceNameX, 316.5, 8.5, true, 32);

  if (data.civilEngineerSignature) {
    await embedSignatureImage(doc, p1, data.civilEngineerSignature, 102.0, 316.5, 100, 20);
  }

  // Signed Date rests on Date ____________________________ line (pdflib y = 283.5)
  drawText(data.civilEngineerSignedDate || data.submissionDate || "Sep 17, 2026", 108.0, 283.5, 7.5, false);

  // Address
  drawText(data.civilEngineerAddress || "Sto. Tomas, Pampanga", 68.0, 265.0, 7.5, false, 35);

  // PRC & Validity
  const cleanCePrc = safeText(data.civilEngineerPRC || "0078923").replace(/^PRC[\s\-#:]*/i, "").trim() || "0078923";
  drawText(cleanCePrc, 68.0, 251.0, 7.5, false);
  drawText(data.civilEngineerPRCValidity || "2028-11-20", 195.0, 251.0, 7.5, false);

  // PTR & Date Issued
  drawText(data.civilEngineerPTR || "PTR-ST-554433", 68.0, 237.5, 7.5, false);
  drawText(data.civilEngineerPTRIssued || "Jan 10, 2026", 205.0, 237.5, 7.5, false);

  // Issued at & TIN
  drawText(data.civilEngineerPTRIssuedAt || "Sto. Tomas", 68.0, 224.5, 7.5, false);
  drawText(data.civilEngineerTIN || "123-456-789-000", 180.0, 224.5, 7.5, false);

  // ==========================================
  // BOX 3: FULL-TIME INSPECTOR AND SUPERVISOR OF CONSTRUCTION WORKS
  // ==========================================
  const supCeName = (data.supervisorCivilEngineerName || data.civilEngineerName || "Engr. Roberto Cruz, PICE").toUpperCase().trim();
  const supCeNameW = fontBold.widthOfTextAtSize(supCeName, 8.5);
  const supCeNameX = Math.max(340.0, 445.5 - supCeNameW / 2);
  drawText(supCeName, supCeNameX, 313.0, 8.5, true, 32);

  if (data.supervisorCivilEngineerSignature || data.civilEngineerSignature) {
    await embedSignatureImage(doc, p1, data.supervisorCivilEngineerSignature || data.civilEngineerSignature, 395.5, 313.0, 100, 20);
  }

  // Supervisor Signed Date
  drawText(data.supervisorCivilEngineerSignedDate || data.civilEngineerSignedDate || data.submissionDate || "Sep 17, 2026", 412.0, 281.0, 7.5, false);

  // Supervisor Address
  drawText(data.supervisorCivilEngineerAddress || data.civilEngineerAddress || "Sto. Tomas, Pampanga", 345.0, 259.0, 7.5, false, 35);

  // PRC & Validity
  const cleanSupPrc = safeText(data.supervisorCivilEngineerPRC || data.civilEngineerPRC || "0078923").replace(/^PRC[\s\-#:]*/i, "").trim() || "0078923";
  drawText(cleanSupPrc, 345.0, 244.5, 7.5, false);
  drawText(data.supervisorCivilEngineerPRCValidity || data.civilEngineerPRCValidity || "2028-11-20", 498.0, 244.5, 7.5, false);

  // PTR & Date Issued
  drawText(data.supervisorCivilEngineerPTR || data.civilEngineerPTR || "PTR-ST-554433", 345.0, 231.5, 7.5, false);
  drawText(data.supervisorCivilEngineerPTRIssued || data.civilEngineerPTRIssued || "Jan 10, 2026", 512.0, 231.5, 7.5, false);

  // Issued at & TIN
  drawText(data.supervisorCivilEngineerPTRIssuedAt || data.civilEngineerPTRIssuedAt || "Sto. Tomas", 345.0, 218.5, 7.5, false);
  drawText(data.supervisorCivilEngineerTIN || data.civilEngineerTIN || "123-456-789-000", 485.0, 218.5, 7.5, false);

  // ==========================================
  // BOX 4: BUILDING OWNER
  // ==========================================
  const appFullName = (data.applicantName || "JUAN DELA CRUZ").toUpperCase().trim();
  const appNameW = fontBold.widthOfTextAtSize(appFullName, 8.5);
  const appNameX = Math.max(50.0, 152.0 - appNameW / 2);
  drawText(appFullName, appNameX, 141.0, 8.5, true, 30);

  if (data.applicantSignature) {
    const sigW = 100;
    const sigH = 20;
    const sigX = Math.max(50.0, 152.0 - sigW / 2);
    await embedSignatureImage(doc, p1, data.applicantSignature, sigX, 139.0, sigW, sigH);
  }

  // Crucial: Date rests on Date ____________________ line at y = 117.0 (NO overlap with "(Signature Over Printed Name)")
  drawText(data.applicantSignedDate || data.submissionDate || "Sep 17, 2026", 122.0, 117.0, 7.5, false);

  // Address
  drawText(data.applicantAddress || data.projectAddress || "123 RIZAL ST., POBLACION, STO. TOMAS", 68.0, 94.0, 7.5, false, 36);

  // CTC row
  const rawAppCtc = safeText(data.applicantCtcNo || data.govIdNo || "00987654").replace(/^[a-zA-Z\s-]+/g, "").trim() || "00987654";
  drawText(rawAppCtc.slice(0, 12), 35.0, 65.0, 7.0, false);
  drawText(data.applicantGovIdDateIssued || data.govIdDateIssued || "Jan 08, 2026", 118.0, 65.0, 7.0, false);
  drawText(data.applicantGovIdPlaceIssued || data.govIdPlaceIssued || "Sto. Tomas", 205.0, 65.0, 7.0, false);

  // ==========================================
  // BOX 5: WITH MY CONSENT: LOT OWNER
  // ==========================================
  if (data.lotOwnerConsent || data.lotOwnerName) {
    const lotName = safeText(data.lotOwnerName || "Dave Sicat").toUpperCase().trim();
    const lotNameW = fontBold.widthOfTextAtSize(lotName, 8.5);
    const lotNameX = Math.max(340.0, 434.0 - lotNameW / 2);
    drawText(lotName, lotNameX, 139.0, 8.5, true, 30);

    if (data.lotOwnerSignature) {
      const sigW = 100;
      const sigH = 20;
      const sigX = Math.max(340.0, 434.0 - sigW / 2);
      await embedSignatureImage(doc, p1, data.lotOwnerSignature, sigX, 137.0, sigW, sigH);
    }

    // Crucial: Date rests on Date __________________ line at y = 117.0 (NO overlap with "(Signed Over Printed Name)")
    drawText(data.lotOwnerSignedDate || data.submissionDate || "Jan 08, 2026", 422.0, 117.0, 7.5, false);

    // Address
    drawText(data.lotOwnerAddress || "153 Sitio Visitas", 345.0, 93.0, 7.5, false, 40);

    // CTC row
    const rawLotCtc = safeText(data.lotOwnerCtcNo || data.lotOwnerGovIdNo || "00987654").replace(/^[a-zA-Z\s-]+/g, "").trim() || "00987654";
    drawText(rawLotCtc.slice(0, 12), 312.0, 65.0, 7.0, false);
    drawText(data.lotOwnerGovIdDateIssued || "Jan 10, 2024", 428.0, 65.0, 7.0, false);
    drawText(data.lotOwnerGovIdPlaceIssued || "Sto. Tomas", 505.0, 65.0, 7.0, false);
  }

  // ==========================================
  // PAGE 2: BOX 6 (TO BE ACCOMPLISHED BY THE DESIGN PROFESSIONAL)
  // ==========================================
  if (doc.getPageCount() > 1) {
    const p2 = doc.getPage(1);
    const drawP2 = (text: string | undefined | null, x: number, y: number, size: number = 7.5, isBold: boolean = false, maxWidth?: number) => {
      if (!text) return;
      let clean = safeText(text).trim();
      if (maxWidth && clean.length > maxWidth) clean = clean.slice(0, maxWidth);
      p2.drawText(clean, { x, y, size, font: isBold ? fontBold : fontRegular, color: darkNavy });
    };
    const checkP2 = (x: number, y: number) => {
      p2.drawText("X", { x, y, size: 7.5, font: fontBold, color: darkNavy });
    };

    const excScopeLower = safeText(data.excavationScope || "").toLowerCase();
    const excTypeLower = safeText(data.excavationType || "").toLowerCase();

    // Row 1 Checkbox 1: EXCAVATION AND FILLS
    const isExcAndFills = Boolean(data.excavationAndFills) ||
      excTypeLower === "excavation and fills" ||
      (excScopeLower.includes("fill") && !excScopeLower.includes("grading and earthwork"));
    if (isExcAndFills) {
      checkP2(29.8, 730.8);
    }

    // Row 1 Checkbox 2: FOUNDATION AND RETAINING WALLS
    const isFoundRet = Boolean(data.foundationAndRetainingWalls) ||
      excTypeLower === "foundation and retaining walls" ||
      excScopeLower.includes("foundation") ||
      excScopeLower.includes("retaining") ||
      (!data.excavationAndFills && !data.pileFoundations && !data.gradingAndEarthworks && !data.othersSpecify && !data.excavationType);
    if (isFoundRet) {
      checkP2(148.8, 730.8);
    }

    // Row 1 Checkbox 3: PILE FOUNDATIONS
    const isPile = Boolean(data.pileFoundations) ||
      excTypeLower === "pile foundations" ||
      excScopeLower.includes("pile");
    if (isPile) {
      checkP2(320.2, 730.8);
    }

    // Row 1 Checkbox 4: GRADING AND EARTHWORKS (Including fills and embankment.)
    const isGrading = Boolean(data.gradingAndEarthworks) ||
      excTypeLower.includes("grading") ||
      excTypeLower.includes("earthwork") ||
      excScopeLower.includes("grading") ||
      excScopeLower.includes("earthwork");
    if (isGrading) {
      checkP2(420.4, 730.8);
    }

    // Row 2 Checkbox 5: OTHERS (Specify)
    const isOthers = Boolean(data.othersSpecify) ||
      Boolean(data.othersSpecifyText) ||
      excTypeLower.includes("other") ||
      excScopeLower.includes("other");
    if (isOthers) {
      checkP2(29.8, 712.2);
      const specText = (data.othersSpecifyText || (excTypeLower.includes("other") ? data.excavationScope : "") || "").trim().toUpperCase();
      // Fits safely on the line right after (Specify) _____ (up to 10 chars at 6.0pt)
      if (specText) {
        drawP2(specText, 107.0, 712.5, 6.0, true, 10);
      }
    }

    // Row 2 Checkbox 6: Additional custom line 2 [ ] _______________________
    if (data.othersCustomLine2Check || data.othersCustomLine2Text) {
      checkP2(148.8, 712.2);
      if (data.othersCustomLine2Text) {
        drawP2(data.othersCustomLine2Text.toUpperCase(), 158.0, 712.5, 7.0, true, 30);
      }
    }

    // Row 2 Checkbox 7: Additional custom line 3 [ ] _______________________
    if (data.othersCustomLine3Check || data.othersCustomLine3Text) {
      checkP2(320.2, 712.2);
      if (data.othersCustomLine3Text) {
        drawP2(data.othersCustomLine3Text.toUpperCase(), 329.0, 712.5, 7.0, true, 20);
      }
    }
  }

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
    p1.drawText("X", { x, y, size: 7.5, font: fontBold, color: darkNavy });
  };

  const drawCompartmentString = (
    text: string | undefined | null,
    centers: number[],
    baselineY: number,
    fontSize: number = 8.0
  ) => {
    if (!text) return;
    const chars = text.trim().split("");
    centers.forEach((centerX, idx) => {
      if (idx < chars.length) {
        const char = chars[idx];
        const charW = fontBold.widthOfTextAtSize(char, fontSize);
        const charX = centerX - charW / 2;
        p1.drawText(char, {
          x: charX,
          y: baselineY,
          size: fontSize,
          font: fontBold,
          color: darkNavy,
        });
      }
    });
  };

  // Header exact compartment cell centers
  const appCenters = [33.95, 45.00, 56.10, 67.25, 78.30, 89.35, 100.50, 111.65, 122.70, 133.80];
  const spCenters = [264.90, 276.45, 287.55, 298.65, 309.75, 320.85, 331.95, 343.05];
  const bpCenters = [471.80, 483.35, 494.45, 505.50, 516.60, 527.70, 538.75, 549.90];

  // 1. APPLICATION NO. (10 individual segmented boxes)
  const rawApp = safeText(data.applicationNo || "2026-0001").trim();
  let cleanApp = rawApp.replace(/^APP-(TEST-)?/i, "").replace(/^UNIFIED-/i, "").trim();
  if (cleanApp.length > 10 && cleanApp.includes("-")) {
    cleanApp = cleanApp.replace(/-/g, "");
  }
  if (cleanApp.length > 10) cleanApp = cleanApp.slice(0, 10);
  drawCompartmentString(cleanApp, appCenters, 770.8, 8.0);

  // 2. SP NO. (Sign Permit No. - 8 individual segmented boxes)
  const isApprovedOrIssued =
    data.isApproved === true ||
    data.status === "approved" ||
    data.status === "released" ||
    Boolean(data.permitIssuedDate) ||
    Boolean(data.dateIssued) ||
    Boolean(data.signPermitNo) ||
    Boolean(data.spNo) ||
    Boolean(data.sgpNo) ||
    (data.permitNo?.startsWith("SP-") || data.permitNo?.startsWith("SGP-")) ||
    (!data.status); // Default to preview if no submission status is provided (e.g. Form Tester)

  if (isApprovedOrIssued) {
    const rawSp = (
      data.signPermitNo ||
      data.spNo ||
      data.sgpNo ||
      (data.permitNo && (data.permitNo.startsWith("SP-") || data.permitNo.startsWith("SGP-")) ? data.permitNo : "") ||
      (data.applicationNo ? `SP-${cleanApp}` : "SP-2026-0001")
    ).trim();

    if (rawSp) {
      let cleanSp = rawSp.replace(/^(SP|SGP)[\s\-#:]*(TEST[\s\-#:]*)?/i, "").trim();
      if (cleanSp.length > 8 && /^\d{4}-0\d{3}$/.test(cleanSp)) {
        cleanSp = cleanSp.replace(/-0(\d{3})$/, '-$1');
      } else if (cleanSp.length > 8 && cleanSp.includes('-')) {
        cleanSp = cleanSp.replace(/-/g, '');
      }
      if (cleanSp.length > 8) cleanSp = cleanSp.slice(0, 8);
      drawCompartmentString(cleanSp, spCenters, 770.8, 8.0);
    }
  }

  // 3. BUILDING PERMIT NO. (8 individual segmented boxes)
  // Auto-gathered if the user has an accompanying building permit in this project type
  const isWithBuildingPermit = Boolean(
    data.withBuildingPermit === true ||
    (data.withBuildingPermit !== false && Boolean(data.buildingPermitNo || data.bpNo)) ||
    (Array.isArray(data.activePermitForms) && data.activePermitForms.includes("buildingPermit")) ||
    (data.projectType?.matrix?.buildingPermit === 'required' || data.projectType?.matrix?.buildingPermit === 'conditional')
  );

  if (isWithBuildingPermit) {
    const rawBp = (
      data.buildingPermitNo ||
      data.bpNo ||
      (data.permitNo?.startsWith("BP-") ? data.permitNo : "") ||
      (data.applicationNo ? `BP-${cleanApp}` : "BP-2026-0001")
    ).trim();

    if (rawBp) {
      let cleanBp = rawBp.replace(/^(BP|APP|NBC)[\s\-#:]*(TEST[\s\-#:]*)?/i, "").trim();
      if (cleanBp.length > 8 && /^\d{4}-0\d{3}$/.test(cleanBp)) {
        cleanBp = cleanBp.replace(/-0(\d{3})$/, '-$1');
      } else if (cleanBp.length > 8 && cleanBp.includes('-')) {
        cleanBp = cleanBp.replace(/-/g, '');
      }
      if (cleanBp.length > 8) cleanBp = cleanBp.slice(0, 8);
      drawCompartmentString(cleanBp, bpCenters, 772.0, 8.0);
    }
  }

  // Box 1: Owner / Applicant Details
  const { lastName, firstName, mi, middleName } = parseApplicantName(data);
  drawText(lastName, 160.0, 714.0, 8.5, true, 20);
  drawText(firstName, 256.0, 714.0, 8.5, true, 22);
  drawText(middleName || mi, 355.0, 714.0, 8.0, true, 16);
  drawText(data.applicantTIN || "000-123-456-000", 465.0, 727.0, 8.0, false);

  drawText(data.signEnterpriseName || data.enterpriseName || "", 28.0, 686.0, 7.5, true, 26);
  drawText(data.signFormOfOwnership || data.formOfOwnership || "SOLE PROPRIETORSHIP", 205.0, 686.0, 8.0, false, 25);
  drawText((data.signCharacterOfOccupancy || data.characterOfOccupancy || data.projectType?.category || "Commercial / Business").toUpperCase(), 385.0, 686.0, 8.0, false, 25);

  // Address (Applicant Address)
  let appNo = data.signApplicantNo || data.applicantHouseNo || "";
  let appStreet = data.signApplicantStreet || data.applicantStreet || "";
  let appBrgy = data.signApplicantBarangay || data.applicantBarangay || data.barangay || "";
  let appCity = data.signApplicantCity || data.applicantCity || data.city || data.municipality || "Sto. Tomas";

  if (!appNo && !appStreet && data.applicantAddress) {
    const addrParts = data.applicantAddress.split(",").map(s => s.trim());
    if (addrParts.length > 0) {
      const firstPart = addrParts[0];
      const numMatch = firstPart.match(/^(\d+[\w\-\/]*)\s+(.*)$/);
      if (numMatch) {
        appNo = numMatch[1];
        appStreet = numMatch[2];
      } else {
        appStreet = firstPart;
      }
    }
    if (addrParts.length > 1 && !appBrgy) appBrgy = addrParts[1];
    if (addrParts.length > 2 && (!appCity || appCity === "Sto. Tomas")) appCity = addrParts.slice(2).join(", ");
  }

  drawText(appNo || "123", 95.0, 658.0, 7.5, false, 8);
  drawText(appStreet || "Rizal St.", 155.0, 658.0, 7.5, false, 18);
  drawText(appBrgy || "Poblacion", 250.0, 658.0, 7.5, false, 16);
  drawText(appCity || "Sto. Tomas, Pampanga", 340.0, 658.0, 7.5, false, 18);
  drawText(data.applicantPhone || "0917-123-4567", 488.0, 671.5, 7.5, true);

  // Location of Installation
  drawText(data.lotNo || "12", 198.0, 645.0, 7.5, true, 8);
  drawText(data.blockNo || "4", 276.0, 645.0, 7.5, true, 6);
  drawText(data.tctNo || "TCT-889977-P", 348.0, 645.0, 7.5, true, 16);
  drawText(data.taxDecNo || "TD-2026-004455", 492.0, 645.0, 7.5, false, 16);

  drawText(data.projectAddress || data.installationStreet || "Lot 12, Blk 4, McArthur Hwy", 70.0, 626.5, 7.5, false, 28);
  drawText(data.installationBarangay || data.barangay || "Poblacion", 260.0, 626.5, 7.5, true, 18);
  drawText(data.installationCity || data.city || data.municipality || "Sto. Tomas, Pampanga", 435.0, 626.5, 7.5, false, 24);

  // Scope of Work Checkboxes
  const scopeLower = (data.signScopeOfWork || data.scopeOfWork || "New Construction").toLowerCase();
  if (scopeLower.includes("erection")) {
    drawCheck(50.2, 598.1);
  } else if (scopeLower.includes("addition")) {
    drawCheck(50.2, 588.9);
  } else if (scopeLower.includes("alteration")) {
    drawCheck(50.2, 579.7);
  } else if (scopeLower.includes("renovation")) {
    drawCheck(206.0, 607.5);
  } else if (scopeLower.includes("conversion")) {
    drawCheck(206.0, 598.1);
  } else if (scopeLower.includes("repair")) {
    drawCheck(206.0, 588.9);
  } else if (scopeLower.includes("moving")) {
    drawCheck(206.0, 579.7);
  } else if (scopeLower.includes("raising")) {
    drawCheck(357.0, 607.5);
  } else if (scopeLower.includes("demolition")) {
    drawCheck(357.0, 598.1);
  } else if (scopeLower.includes("accessory")) {
    drawCheck(357.0, 588.9);
  } else if (scopeLower.includes("other")) {
    drawCheck(357.0, 579.7);
    drawText(data.signScopeOthers || data.scopeOthers || "CUSTOM", 445.0, 580.0, 7.0, false);
  } else {
    // Default to New Construction
    drawCheck(50.2, 607.5);
  }

  // Type of Display Checkboxes
  const sDisplay = (data.signDisplayType || "").toLowerCase();
  if (sDisplay.includes("double")) {
    drawCheck(287.5, 559.0);
  } else if (sDisplay.includes("multi")) {
    drawCheck(434.5, 558.0);
  } else {
    drawCheck(156.5, 559.0); // 1. Single Face
  }

  const sMedium = (data.signDisplayMedium || data.signMaterial || data.signType || "").toLowerCase();
  if (sMedium.includes("neon")) {
    drawCheck(50.5, 550.0);
  } else if (sMedium.includes("painted")) {
    drawCheck(287.5, 550.0);
  } else if (sMedium.includes("other")) {
    drawCheck(434.5, 550.0);
  } else {
    drawCheck(156.5, 550.0); // 2. Illuminated (Default)
  }

  // Type of Installation Checkboxes
  const sInstall = (data.signInstallationType || data.signType || "").toLowerCase();
  if (sInstall.includes("projecting")) {
    drawCheck(50.5, 522.5); // 2. Business Sign, Projecting Type
  } else if (sInstall.includes("business") && sInstall.includes("ground")) {
    drawCheck(50.5, 513.0); // 3. Business Sign, Ground Type
  } else if (sInstall.includes("temporary")) {
    drawCheck(288.0, 531.0); // 4. Business Sign, Temporary
  } else if (sInstall.includes("advertising") && sInstall.includes("ground")) {
    drawCheck(288.0, 522.0); // 5. Advertising Sign, Ground Type
  } else if (sInstall.includes("advertising") && sInstall.includes("wall")) {
    drawCheck(288.0, 513.0); // 6. Advertising Sign, Wall Type
  } else if (sInstall.includes("roof") || (sInstall.includes("advertising") && sInstall.includes("projecting"))) {
    drawCheck(434.5, 531.0); // 7. Advertising Sign, Wall Type / Projecting
  } else if (sInstall.includes("advertising") && sInstall.includes("other")) {
    drawCheck(434.5, 523.0); // 8. Advertising Sign, Other
  } else {
    drawCheck(50.5, 531.0); // 1. Business Sign, Wall Type
  }

  // Display Size / Dimensions
  const rawDim = data.signDimensions || "";
  let lenVal = data.signLength || "";
  let widVal = data.signWidth || "";
  let areaVal = data.signArea || "";
  if (!lenVal || !widVal) {
    const wMatch = rawDim.match(/([\d.]+)\s*m?\s*(?:width|w)/i);
    const hMatch = rawDim.match(/([\d.]+)\s*m?\s*(?:height|h|length|l)/i);
    if (hMatch) lenVal = hMatch[1];
    if (wMatch) widVal = wMatch[1];
  }
  if (!lenVal) lenVal = "3.00";
  if (!widVal) widVal = "1.50";
  if (!areaVal) areaVal = (parseFloat(lenVal) * parseFloat(widVal)).toFixed(2);

  drawText(lenVal, 160.0, 503.0, 7.5, true);
  drawText(widVal, 305.0, 503.0, 7.5, true);
  drawText(areaVal, 455.0, 503.0, 7.5, true);

  // Box 2: Accompanying Documents checklist (NBC Form B-07)
  const isDocTct = data.signDocTct !== undefined ? data.signDocTct : true;
  const isDocLease = data.signDocContractOfLease !== undefined ? data.signDocContractOfLease : Boolean(data.lotOwnerConsent || data.lotOwnerName);
  const isDocTaxDec = data.signDocTaxDeclaration !== undefined ? data.signDocTaxDeclaration : true;
  const isDocLotPlan = data.signDocLotPlan !== undefined ? data.signDocLotPlan : true;
  const isDocSignPlans = data.signDocSignPlansStructural !== undefined ? data.signDocSignPlansStructural : true;
  const isDocSpecsCost = data.signDocSpecsCostEstimates !== undefined ? data.signDocSpecsCostEstimates : true;

  if (isDocTct) drawCheck(33.0, 458.5);
  if (isDocLease) drawCheck(33.0, 449.6);
  if (isDocTaxDec) drawCheck(33.0, 431.8);
  if (isDocLotPlan) drawCheck(297.5, 458.5);
  if (isDocSignPlans) drawCheck(297.5, 449.6);
  if (isDocSpecsCost) drawCheck(298.0, 430.8);


  // ==========================================
  // Box 3: Design Professional, Plans and Specification
  // ==========================================
  const archName = (data.architectName || data.signDesignerName || "ARCH. MARIA ELENA SANTOS, UAP").toUpperCase();
  const archW = fontBold.widthOfTextAtSize(archName, 8.0);
  const archX = Math.max(30.0, 112.6 - archW / 2);
  drawText(archName, archX, 325.5, 8.0, true);

  const archSig = data.architectSignature || data.signDesignerSignature;
  if (archSig) {
    const sigW = 90;
    const sigH = 22;
    const sigX = Math.max(30.0, 112.6 - sigW / 2);
    await embedSignatureImage(doc, p1, archSig, sigX, 326.0, sigW, sigH);
  }
  drawText(data.architectSignedDate || data.submissionDate || "Sep 26, 2026", 228.0, 325.5, 7.0, false);
  drawText(data.architectAddress || data.applicantAddress || "Sto. Tomas, Pampanga", 75.0, 292.5, 7.2, false, 32);
  drawText(data.architectPRC || "0045211", 68.0, 276.0, 7.2, false);
  drawText(data.architectPRCValidity || "2028-09-15", 188.0, 276.0, 7.2, false);
  drawText(data.architectPTR || "PTR-ST-665544", 68.0, 266.0, 7.2, false);
  drawText(data.architectPTRIssued || "Jan 08, 2026", 202.0, 266.0, 7.2, false);
  drawText(data.architectPTRIssuedAt || "Sto. Tomas", 68.0, 256.0, 7.2, false);
  drawText(data.architectTIN || "234-567-890-000", 185.0, 256.0, 7.2, false);

  // ==========================================
  // Box 4: Full-Time Inspector and Supervisor of Construction Works
  // ==========================================
  const isSupervisorSame = Boolean(data.sameAsDesignSignSupervisor || data.sameAsDesignArchitect || data.sameAsDesignCivilEngineer);
  const supName = (
    data.signSupervisorName ||
    data.supervisorCivilEngineerName ||
    data.supervisorArchitectName ||
    data.civilEngineerName ||
    data.constructionSupervisorName ||
    (isSupervisorSame ? archName : "") ||
    "ENGR. ROBERTO CRUZ, CE"
  ).toUpperCase();
  const supW = fontBold.widthOfTextAtSize(supName, 8.0);
  const supX = Math.max(318.0, 401.6 - supW / 2);
  drawText(supName, supX, 330.0, 8.0, true);

  const supSig = data.signSupervisorSignature ||
    data.supervisorCivilEngineerSignature ||
    data.supervisorArchitectSignature ||
    data.civilEngineerSignature ||
    (isSupervisorSame ? archSig : undefined);
  if (supSig) {
    const sigW = 90;
    const sigH = 22;
    const sigX = Math.max(318.0, 401.6 - sigW / 2);
    await embedSignatureImage(doc, p1, supSig, sigX, 330.5, sigW, sigH);
  }
  drawText(data.signSupervisorSignedDate || data.supervisorCivilEngineerSignedDate || data.supervisorArchitectSignedDate || data.submissionDate || "Sep 26, 2026", 516.0, 330.0, 6.8, false);
  drawText(data.signSupervisorAddress || data.supervisorCivilEngineerAddress || data.supervisorArchitectAddress || data.civilEngineerAddress || (isSupervisorSame ? (data.architectAddress || "Sto. Tomas, Pampanga") : undefined) || "Sto. Tomas, Pampanga", 360.0, 297.5, 7.2, false, 32);
  drawText(data.signSupervisorPRC || data.supervisorCivilEngineerPRC || data.supervisorArchitectPRC || data.civilEngineerPRC || (isSupervisorSame ? (data.architectPRC || "0045211") : undefined) || "0078923", 355.0, 280.5, 7.2, false);
  drawText(data.signSupervisorPRCValidity || data.supervisorCivilEngineerPRCValidity || data.supervisorArchitectPRCValidity || data.civilEngineerPRCValidity || (isSupervisorSame ? (data.architectPRCValidity || "2028-09-15") : undefined) || "2028-11-20", 482.0, 280.5, 7.2, false);
  drawText(data.signSupervisorPTR || data.supervisorCivilEngineerPTR || data.supervisorArchitectPTR || data.civilEngineerPTR || (isSupervisorSame ? (data.architectPTR || "PTR-ST-665544") : undefined) || "PTR-ST-2026-001", 355.0, 270.5, 7.2, false);
  drawText(data.signSupervisorPTRIssued || data.supervisorCivilEngineerPTRIssued || data.supervisorArchitectPTRIssued || data.civilEngineerPTRIssued || (isSupervisorSame ? (data.architectPTRIssued || "Jan 08, 2026") : undefined) || "Jan 10, 2026", 495.0, 270.5, 7.2, false);
  drawText(data.signSupervisorPTRIssuedAt || data.supervisorCivilEngineerPTRIssuedAt || data.supervisorArchitectPTRIssuedAt || data.civilEngineerPTRIssuedAt || (isSupervisorSame ? (data.architectPTRIssuedAt || "Sto. Tomas") : undefined) || "Sto. Tomas", 355.0, 260.5, 7.2, false);
  drawText(data.signSupervisorTIN || data.supervisorCivilEngineerTIN || data.supervisorArchitectTIN || data.civilEngineerTIN || (isSupervisorSame ? (data.architectTIN || "234-567-890-000") : undefined) || "123-456-789-000", 475.0, 260.5, 7.2, false);

  // ==========================================
  // Box 5: Applicant
  // ==========================================
  const appFullName = (data.applicantName || `${firstName} ${middleName ? middleName + " " : ""}${lastName}`).toUpperCase();
  const appW = fontBold.widthOfTextAtSize(appFullName, 8.5);
  const appX = Math.max(230.0, 308.0 - appW / 2);
  drawText(appFullName, appX, 209.5, 8.5, true);

  if (data.applicantSignature) {
    const sigW = 90;
    const sigH = 22;
    const sigX = Math.max(230.0, 308.0 - sigW / 2);
    await embedSignatureImage(doc, p1, data.applicantSignature, sigX, 210.0, sigW, sigH);
  }
  drawText(data.applicantSignedDate || data.submissionDate || "Sep 26, 2026", 398.0, 209.5, 7.0, false);
  drawText(data.applicantAddress || "123 Rizal St., Poblacion, Sto. Tomas, Pampanga", 72.0, 180.5, 7.5, false, 55);

  const rawCtc = safeText(data.applicantCtcNo || data.govIdNo || "CTC-2026-00192");
  let cleanCtc = rawCtc.replace(/^[a-zA-Z\s-]+/g, "").trim();
  if (!cleanCtc) cleanCtc = rawCtc;
  if (cleanCtc.length > 9) cleanCtc = cleanCtc.slice(0, 9);
  drawText(cleanCtc || "2026-00192", 72.0, 171.0, 6.8, false);
  drawText(data.applicantGovIdDateIssued || data.govIdDateIssued || "Jan 10, 2026", 222.0, 171.0, 6.8, false);
  drawText(data.applicantGovIdPlaceIssued || data.govIdPlaceIssued || "Sto. Tomas", 358.0, 171.0, 6.8, false);
  drawText(data.applicantTIN || "123-456-789-000", 490.0, 171.0, 6.8, false);

  // Page 2: Box 6 (Building Owner) & Box 7 (With My Consent: Lot Owner) & Box 8 (Processing & Evaluation)
  const p2 = doc.getPageCount() > 1 ? doc.getPage(1) : null;
  if (p2) {
    // Box 6: Building Owner
    const bldgOwnerName = safeText(
      data.buildingOwnerName ||
      data.applicantName ||
      (data.applicantFirstName ? `${data.applicantFirstName} ${data.applicantMiddleName ? data.applicantMiddleName + " " : ""}${data.applicantLastName || ""}`.trim() : "") ||
      "JUAN DELA CRUZ"
    ).toUpperCase().trim();
    const bldgOwnerW = fontBold.widthOfTextAtSize(bldgOwnerName, 8.5);
    const bldgOwnerX = Math.max(95.0, 164.3 - bldgOwnerW / 2);
    p2.drawText(bldgOwnerName, { x: bldgOwnerX, y: 866.5, size: 8.5, font: fontBold, color: darkNavy });

    const bldgOwnerSig = data.buildingOwnerSignature || data.applicantSignature;
    if (bldgOwnerSig) {
      const sigW = 90;
      const sigH = 22;
      const sigX = Math.max(95.0, 164.3 - sigW / 2);
      await embedSignatureImage(doc, p2, bldgOwnerSig, sigX, 864.5, sigW, sigH);
    }
    p2.drawText(data.buildingOwnerSignedDate || data.applicantSignedDate || data.submissionDate || "Jan 08, 2026", { x: 145.0, y: 844.5, size: 7.2, font: fontRegular, color: darkNavy });
    p2.drawText(safeText(data.buildingOwnerAddress || data.applicantAddress || "123 Rizal St., Poblacion, Sto. Tomas"), { x: 65.0, y: 823.5, size: 7.2, font: fontRegular, color: darkNavy });

    const rawBldgCtc = safeText(data.buildingOwnerCtcNo || data.applicantCtcNo || data.govIdNo || "2026-00192").trim();
    let cleanBldgCtc = rawBldgCtc.replace(/^[a-zA-Z\s-]+/g, "").trim();
    if (!cleanBldgCtc) cleanBldgCtc = rawBldgCtc;
    p2.drawText((cleanBldgCtc || "2026-00192").slice(0, 8), { x: 68.0, y: 806.5, size: 6.5, font: fontRegular, color: darkNavy });
    p2.drawText(data.buildingOwnerCtcDateIssued || data.applicantGovIdDateIssued || data.govIdDateIssued || "Jan 10, 2026", { x: 158.0, y: 806.5, size: 6.8, font: fontRegular, color: darkNavy });
    p2.drawText(data.buildingOwnerCtcPlaceIssued || data.applicantGovIdPlaceIssued || data.govIdPlaceIssued || "Sto. Tomas", { x: 263.0, y: 806.5, size: 6.8, font: fontRegular, color: darkNavy });

    // Box 7: With My Consent (Lot Owner)
    if (data.lotOwnerConsent !== false && (data.lotOwnerConsent || data.lotOwnerName)) {
      const lotName = safeText(data.lotOwnerName || "DAVE SICAT").toUpperCase().trim();
      const lotNameW = fontBold.widthOfTextAtSize(lotName, 8.5);
      const lotNameX = Math.max(387.0, 456.5 - lotNameW / 2);
      p2.drawText(lotName, { x: lotNameX, y: 864.5, size: 8.5, font: fontBold, color: darkNavy });

      if (data.lotOwnerSignature) {
        const sigW = 90;
        const sigH = 22;
        const sigX = Math.max(387.0, 456.5 - sigW / 2);
        await embedSignatureImage(doc, p2, data.lotOwnerSignature, sigX, 862.5, sigW, sigH);
      }

      p2.drawText(data.lotOwnerSignedDate || data.submissionDate || "Jan 08, 2026", { x: 440.0, y: 842.5, size: 7.2, font: fontRegular, color: darkNavy });
      p2.drawText(safeText(data.lotOwnerAddress || data.projectAddress || "153 Sitio Visitas, Sto. Tomas, Pampanga"), { x: 358.0, y: 822.5, size: 7.2, font: fontRegular, color: darkNavy });

      const rawLotCtc = (data.lotOwnerGovIdNo || data.lotOwnerCtcNo || "2026-778899").trim();
      let cleanLotCtc = rawLotCtc.replace(/^[a-zA-Z\s-]+/g, "").trim();
      if (!cleanLotCtc) cleanLotCtc = rawLotCtc;
      p2.drawText((cleanLotCtc || "2026-7788").slice(0, 8), { x: 360.0, y: 806.0, size: 6.5, font: fontRegular, color: darkNavy });
      p2.drawText(data.lotOwnerGovIdDateIssued || "Jan 10, 2026", { x: 444.0, y: 806.0, size: 6.8, font: fontRegular, color: darkNavy });
      p2.drawText(data.lotOwnerGovIdPlaceIssued || "Sto. Tomas", { x: 544.0, y: 806.0, size: 6.8, font: fontRegular, color: darkNavy });
    }

    // Box 8: TO BE ACCOMPLISHED BY THE PROCESSING AND EVALUATION DIVISION
    // Auto-generated when admin has confirmed payment / application is paid
    const isPaid = Boolean(
      data.isPaid ||
      data.paymentStatus === "paid" ||
      data.isReleased ||
      data.officialReceiptNo ||
      data.feePaid
    );

    const feePaid = safeText(data.feePaid || (isPaid ? "P 1,250.00" : "")).trim();
    const datePaid = safeText(data.datePaid || data.paymentDate || (isPaid ? data.submissionDate || "Jan 15, 2026" : "")).trim();
    const orNo = safeText(data.officialReceiptNo || data.paymentReference || (isPaid ? "OR-2026-94812" : "")).trim();
    const dateIssued = safeText(data.dateIssued || data.dateReleased || (isPaid ? data.submissionDate || "Jan 16, 2026" : "")).trim();

    if (feePaid) {
      p2.drawText(feePaid, { x: 82.0, y: 755.0, size: 7.2, font: fontBold, color: darkNavy });
    }
    if (datePaid) {
      p2.drawText(datePaid, { x: 200.0, y: 755.0, size: 7.2, font: fontBold, color: darkNavy });
    }
    if (orNo) {
      p2.drawText(orNo, { x: 358.0, y: 755.0, size: 7.2, font: fontBold, color: darkNavy });
    }
    if (dateIssued) {
      p2.drawText(dateIssued, { x: 510.0, y: 755.0, size: 7.2, font: fontBold, color: darkNavy });
    }
  }

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
  drawText(resolveOccupancyDetailText(data), 285, 363.0, 7.5, true, 45);

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
  const occDetail = resolveOccupancyDetailText(data);
  const charOnly = occDetail.replace(/^GROUP\s+[A-Z0-9\-]+\s*-\s*/i, "");
  drawText(charOnly, 228, 632.5, 7.5, true, 28);
  const groupMatch = occDetail.match(/GROUP\s+([A-Z0-9\-]+)/i);
  if (groupMatch) {
    drawText(groupMatch[1], 480, 632.5, 7.5, true);
  }

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

