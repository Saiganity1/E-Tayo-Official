"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, Layers, Zap, Droplets, Wrench, Radio, Flame, ShieldCheck, 
  FileText, Play, RotateCcw, Download, ExternalLink, Sparkles, Check, 
  CheckCircle2, AlertCircle, Search, RefreshCw, ZoomIn, Eye, ArrowLeft,
  Trash2, Grid, Tv, Plug, Award, FileCheck, ClipboardCheck, Hammer
} from "lucide-react";
import { 
  generateBuildingPermitPdf, 
  generateArchitecturalPermitPdf, 
  generateStructuralPermitPdf, 
  generateElectricalPermitPdf, 
  generateSanitaryPermitPdf, 
  generateMechanicalPermitPdf, 
  generateElectronicsPermitPdf, 
  generateDemolitionPermitPdf,
  generateFencingPermitPdf,
  generateExcavationPermitPdf,
  generateSignPermitPdf,
  generateTemporaryServicePermitPdf,
  generateCertificateOfOccupancyPdf,
  generateCertificateOfCompletionPdf,
  generateCfeiPdf,
  generateBfpApplicationPdf, 
  generateUnifiedPermitPdf, 
  UnifiedPermitFormData 
} from "../../../../utils/unifiedPermitPdfGenerator";
import { 
  generateLocationalClearancePdf, 
  LocationalClearancePdfData,
  numberToWordsInPesos
} from "../../../../utils/locationalClearancePdfGenerator";
import { PROJECT_TYPES_MATRIX } from "../../../../data/projectTypeMatrix";
import SignatureCreator from "@/components/common/SignatureCreator";

interface FormOption {
  id: string;
  name: string;
  code: string;
  category: string;
  icon: any;
  desc: string;
  pages: number;
}

const FORMS: FormOption[] = [
  // Primary (1)
  { id: "BP", name: "Unified Application Form for Building Permit (NBC Form 1)", code: "BP", category: "Primary", icon: Building2, desc: "DPWH Form 77-001-B master building permit with scope, occupancy & cost breakdowns", pages: 2 },

  // Zoning & Land Use (1)
  { id: "LC", name: "Application for Locational Clearance / Zoning", code: "LC", category: "Zoning & Land Use", icon: ShieldCheck, desc: "Official Sto. Tomas zoning classification, land use tenure & site description", pages: 1 },

  // Ancillary Permits (6)
  { id: "AP", name: "Architectural Permit Form (NBC Form A-01)", code: "AP", category: "Ancillary", icon: Layers, desc: "Architectural specifications, setbacks, finishes, doors & windows", pages: 2 },
  { id: "SP", name: "Civil / Structural Permit Form (NBC Form S-01)", code: "SP", category: "Ancillary", icon: Building2, desc: "Foundation depth, concrete strength, structural framing & steel grades", pages: 2 },
  { id: "EP", name: "Electrical Permit Form (NBC Form E-01)", code: "EP", category: "Ancillary", icon: Zap, desc: "Connected load, service voltage, main breakers, wiring & fixture schedule", pages: 2 },
  { id: "PL", name: "Sanitary / Plumbing Permit Form (NBC Form P-01)", code: "PL", category: "Ancillary", icon: Droplets, desc: "Water supply, sanitary fixtures count, septic tank & piping specs", pages: 2 },
  { id: "MP", name: "Mechanical Permit Form (NBC Form M-01)", code: "MP", category: "Ancillary", icon: Wrench, desc: "Machinery, escalators, ACUs, ventilation & refrigeration specs", pages: 2 },
  { id: "EL", name: "Electronics Permit Form (NBC Form EL-01)", code: "EL", category: "Ancillary", icon: Radio, desc: "Structured cabling, CCTV security, fire alarm systems & telecom", pages: 2 },

  // Special Permits (4)
  { id: "DP", name: "Demolition Permit Form (NBC Form B-08)", code: "DP", category: "Special", icon: Trash2, desc: "Demolition of structures, floor area, storeys & safety measures", pages: 2 },
  { id: "FP", name: "Fencing Permit Form (NBC Form B-03)", code: "FP", category: "Special", icon: Grid, desc: "Perimeter fencing, masonry walls, height & length dimensions", pages: 2 },
  { id: "EXP", name: "Excavation and Ground Preparation Permit (NBC Form B-02)", code: "EXP", category: "Special", icon: Layers, desc: "Foundation excavation, ground levelling, depth & volume specs", pages: 2 },
  { id: "SGP", name: "Sign Permit Form (NBC Form B-07)", code: "SGP", category: "Special", icon: Tv, desc: "Business & advertising signboards, display dimensions & illumination", pages: 2 },

  // Utilities & Services (1)
  { id: "TSC", name: "Permit for Temporary Service Connection (NBC Form E-03)", code: "TSC", category: "Utilities & Services", icon: Plug, desc: "Temporary power connection for construction & equipment testing", pages: 2 },

  // Completion & Occupancy (3)
  { id: "CO", name: "Certificate of Occupancy Unified Form", code: "CO", category: "Completion & Occupancy", icon: Award, desc: "Unified application for Certificate of Occupancy with final project inspection", pages: 1 },
  { id: "CC", name: "Certificate of Completion Form", code: "CC", category: "Completion & Occupancy", icon: FileCheck, desc: "Official Certificate of Completion signed by supervising engineers", pages: 3 },
  { id: "CFEI", name: "Certificate of Final Electrical Inspection (CFEI)", code: "CFEI", category: "Completion & Occupancy", icon: ClipboardCheck, desc: "NBC Form 96006-E final electrical inspection certificate & energization clearance", pages: 2 },
];

const CALIBRATED_TEST_DATA: UnifiedPermitFormData = {
  applicationNo: "APP-TEST-2026-0001",
  permitNo: "AP-2026-0001",
  buildingPermitNo: "BP-2026-0001",
  electronicsPermitNo: "EL-2026-0001",
  demolitionPermitNo: "DP-2026-0001",
  withBuildingPermit: true,
  locationalClearanceRef: "LC-2026-9307",
  projectType: PROJECT_TYPES_MATRIX[0],
  applicantFirstName: "JUAN",
  applicantMiddleName: "SANTOS",
  applicantLastName: "DELA CRUZ",
  applicantName: "JUAN DELA CRUZ",
  applicantPhone: "0917-123-4567",
  applicantEmail: "juan.delacruz@example.com",
  applicantAddress: "123 RIZAL ST., POBLACION, STO. TOMAS, PAMPANGA",
  applicantNoStreet: "123 RIZAL ST.",
  applicantBarangay: "POBLACION",
  applicantMunicipality: "STO. TOMAS",
  applicantProvince: "PAMPANGA",
  applicantZipCode: "2020",
  applicantTIN: "123-456-789-000",
  formOfOwnership: "INDIVIDUAL / OWNER",
  govIdNo: "PRC-ID-00987654",
  applicantCtcNo: "CTC-2026-00192",
  applicantGovIdDateIssued: "Jan 10, 2026",
  applicantGovIdPlaceIssued: "Sto. Tomas",
  signSupervisorName: "ENGR. ROBERTO CRUZ, CE",
  signSupervisorAddress: "Sto. Tomas, Pampanga",
  signSupervisorPRC: "0078923",
  signSupervisorPRCValidity: "2028-11-20",
  signSupervisorPTR: "PTR-ST-2026-001",
  signSupervisorPTRIssued: "Jan 10, 2026",
  signSupervisorPTRIssuedAt: "Sto. Tomas",
  signSupervisorTIN: "123-456-789-000",
  sameAsDesignSignSupervisor: true,
  signSameAsApplicantBldgOwner: true,
  buildingOwnerName: "JUAN DELA CRUZ",
  buildingOwnerAddress: "123 Rizal St., Poblacion, Sto. Tomas",
  buildingOwnerCtcNo: "CTC-2026-00192",
  buildingOwnerCtcDateIssued: "Jan 10, 2026",
  buildingOwnerCtcPlaceIssued: "Sto. Tomas",
  buildingOwnerSignedDate: "Jan 08, 2026",
  buildingOwnerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih044xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",
  isPaid: true,
  feePaid: "1,250.00",
  datePaid: "Jan 15, 2026",
  dateIssued: "Jan 16, 2026",
  officialReceiptNo: "OR-2026-94812",

  // Header Classifications & Applications (BP)
  processingType: "SIMPLE" as "SIMPLE" | "COMPLEX",
  applicationType: "NEW" as "NEW" | "RENEWAL" | "AMENDATORY",
  appliesLocationalClearance: false,
  appliesFireSafetyClearance: true,

  projectName: "DELA CRUZ TWO-STOREY RESIDENCE",
  projectAddress: "LOT 12, BLOCK 4, SUNSET VALLEY SUBD.",
  barangay: "Poblacion",
  lotNo: "12",
  blockNo: "4",
  tctNo: "TCT-889977-P",
  taxDecNo: "TD-2026-004455",
  lotArea: "240.00",
  floorArea: "185.50",
  buildingFootprint: "110.00",
  buildingHeight: "9.20",
  projectCost: "2,500,000.00",
  scopeOfWork: "New Construction",
  scopeOthers: "",
  scopeOfWorkDetails: "",
  percentBuildingFootprint: "55.00",
  percentImperviousSurface: "25.00",
  percentUnpavedSurface: "20.00",
  percentSiteOccupancyOthers: "",
  fireCodeExitDoors: true,
  fireCodeCorridors: true,
  fireCodeDistanceExits: true,
  fireCodeAccessStreet: true,
  fireCodeFireWalls: true,
  fireCodeFireFighting: false,
  fireCodeSmokeDetectors: true,
  fireCodeEmergencyLights: true,
  fireCodeOthers: "",
  projectNature: "New Development",
  natureOthers: "",
  occupancyClass: "RESIDENTIAL",
  occupancyClassificationDetail: "Group A - Single Family Dwelling",
  occupancyOthers: "",
  proposedStoreys: "2",
  numberOfUnits: "1",
  proposedStartDate: "2026-10-01",
  expectedCompletionDate: "2027-04-30",

  // Locational Clearance specific fields (Boxes 11, 12, 13)
  rightOverLand: "Owner",
  rightOverLandOthers: "",
  projectTenure: "Permanent",
  existingLandUse: "Residential",
  landUseOthers: "",
  agriculturalCrop: "",
  isTenanted: "No",

  // Locational Clearance (Boxes 15, 16, 17)
  hasWrittenNotice: "No",
  noticeOfficer: "",
  noticeOrder: "",
  noticeDate: "",
  hasRelatedAction: "No",
  relatedOffice: "",
  relatedDate: "",
  relatedActionTaken: "",
  preferredMode: "Pick-up",

  costBuilding: "1,800,000.00",
  costElectrical: "250,000.00",
  costMechanical: "150,000.00",
  costPlumbing: "180,000.00",
  costElectronics: "70,000.00",
  costEquipment: "150,000.00",
  costOthers: "50,000.00",

  // Architectural
  architecturalStyle: "Modern Contemporary Tropical",
  roofingMaterial: "Rib-type Pre-painted Long-span Corrugated GI Sheet",
  exteriorWallFinish: "Plastered Cement with Semi-Gloss Latex Paint",
  interiorWallFinish: "Smooth Painted Gypsum Board / Plastered CHB",
  floorFinishes: "600mm x 600mm Homogeneous Ceramic Tiles",
  ceilingFinishes: "9mm Acoustic Gypsum Ceiling Board on Metal Furring",
  doorsSpec: "Solid Wood Main Door, Solid Core Flush Panel Interior Doors",
  windowsSpec: "Powder Coated Aluminum Sliding Window with 6mm Tinted Glass",
  frontSetback: "4.50m Front Setback",
  rearSetback: "2.00m Rear Setback",
  leftSetback: "2.00m Left Setback",
  rightSetback: "2.00m Right Setback",
  bedroomCount: "4",
  bathroomCount: "3",

  // Structural
  foundationType: "Reinforced Concrete Isolated Column Footing",
  foundationDepth: "1.80m Depth below natural ground level",
  structuralFraming: "Reinforced Concrete Beams and Columns Framing System",
  floorSlabSystem: "125mm Thick Solid Reinforced Concrete One-Way Slab",
  roofFramingSystem: "Light Gauge Structural Steel C-Purlins and Rafters",
  concreteStrength: "21.0 MPa (3,000 psi) at 28 days",
  steelGrade: "Grade 40 Deformed Reinforcing Steel Bars",
  masonrySpec: "150mm Non-Load Bearing Concrete Hollow Blocks (CHB)",

  // Electrical
  electricalConnectedLoad: "15.0 kVA Connected Load",
  electricalVoltage: "230V, Single Phase, 2-Wire, 60Hz",
  electricalFeeder: "2 - 38 sq.mm THHN Copper Wire in 40mm dia. PVC Conduit",
  mainBreaker: "100A 2-Pole Molded Case Circuit Breaker (MCCB)",
  branchCircuitsCount: "12 Branch Circuits",
  lightingOutletsCount: "28",
  convenienceOutletsCount: "24",
  acuOutletsCount: "4",
  cookingUnitOutletsCount: "1",
  waterHeaterOutletsCount: "2",
  waterPumpOutletsCount: "1",
  // Equipment / Wiring Devices (Box 1)
  toggleSwitchCount: "15",
  bellBuzzerCount: "1",
  pushButtonsCount: "1",
  faDetectorCount: "2",
  otherWiringDevicesCount: "1",
  groundingSpec: "16mm dia. x 3.0m Copper Clad Ground Rod with #8 AWG Bare Copper Wire",

  // Plumbing
  waterSupplySource: "Sto. Tomas Water District (Municipal Supply)",
  sewageSystem: "Individual 3-Chamber Septic Tank with Leaching Field",
  septicTankDimensions: "3.20m Length x 1.60m Width x 1.80m Depth (Capacity: 9.2 cu.m.)",
  waterPipesMaterial: "PPR-C (Polypropylene Random Copolymer) PN-20 Pipes",
  wastePipesMaterial: "uPVC Series 1000 Heavy Duty Sanitary Pipes",
  waterClosetsCount: "4",
  lavatoriesCount: "4",
  kitchenSinksCount: "2",
  showersCount: "3",
  floorDrainsCount: "5",
  faucetsCount: "6",
  waterMeterCount: "",
  greaseTrapCount: "",
  bathTubsCount: "",
  slopSinkCount: "",
  urinalCount: "",
  airConditioningCount: "",
  waterTankCount: "",
  bidetCount: "",
  laundryTraysCount: "",
  dentalCuspidorCount: "",
  electricalHeaterCount: "",
  waterBoilerCount: "",
  drinkingFountainCount: "",
  barSinkCount: "",
  sodaFountainCount: "",
  laboratorySinkCount: "",
  sterilizerCount: "",
  swimmingPoolCount: "",
  othersFixtureCount: "",
  othersFixtureName: "",
  fixtureStatusMap: {
    waterClosetsCount: "new",
    floorDrainsCount: "new",
    lavatoriesCount: "new",
    kitchenSinksCount: "new",
    faucetsCount: "new",
    showersCount: "new",
  },
  waterDistributionSystem: true,
  sanitarySewerSystem: true,
  stormDrainageSystem: false,
  waterSupplyType: "CITY/MUNICIPAL WATER SYSTEM",
  waterSupplyOthers: "",
  wasteWaterTreatmentPlant: false,
  septicVaultImhoffTank: true,
  subsurfaceSandFilter: false,
  sanitarySewerConnection: false,
  surfaceDrainage: false,
  streetCanal: false,
  waterCourse: false,
  plumbingTotalArea: "185.50",
  plumbingStartDate: "2026-10-01",
  plumbingInstallationCost: "100,000.00",
  plumbingCompletionDate: "",
  plumbingPreparedBy: "",

  // Mechanical
  machineryType: "Inverter Split-Type Air Conditioning System (4 Units)",
  machineryBrand: "Daikin / Carrier High Efficiency Inverter",
  machineryCapacity: "7.5 Total Horsepower (HP) / 24,000 BTU/hr",
  machineryPower: "5.5 kW Total Connected Mechanical Power",
  machinerySpeed: "Variable Speed Inverter Compressor",
  machineryStoreys: "Ground & Second Floors",
  electricalLoadKva: "6.8 kVA",
  serviceVoltage: "230V, 1-Phase, 60Hz",
  mechanicalScopeOfWork: "New Construction",
  mechanicalScopeDetails: "",
  // Mechanical Box 2
  boiler: false,
  pressureVessel: false,
  internalCombustionEngine: false,
  refrigerationIce: false,
  windowTypeAircon: false,
  packagedSplitAircon: true,
  mechanicalOthers: false,
  mechanicalOthersSpecify: "",
  centralAircon: false,
  mechanicalVentilation: true,
  escalator: false,
  movingSidewalk: false,
  freightElevator: false,
  passengerElevator: false,
  cableCar: false,
  dumbwaiter: false,
  pumps: true,
  compressedAirGas: false,
  pneumaticTubesConveyors: false,
  funicular: false,
  mechanicalPreparedBy: "Engr. Antonio Gomez, PME",

  // Electronics
  electronicsScopeOfWork: "New Installation",
  electronicsScopeOthers: "",
  telecomScope: "FTTH High-Speed Fiber Optic Data Infrastructure with Wi-Fi 6 Access Points",
  cctvScope: "8-Channel 4K IP CCTV Surveillance System with NVR and Mobile Remote Viewing",
  fdasScope: "Addressable Fire Detection & Alarm System (Smoke & Heat Detectors with Strobe Alarm)",
  catvScope: "High-Definition Community Antenna Television System",
  telecomSystem: true,
  broadcastingSystem: false,
  televisionSystem: false,
  itSystem: true,
  securityAlarmSystem: true,
  anyOtherElectronics: false,
  anyOtherElectronicsSpecify: "",
  electronicsAlarmSystem: true,
  soundCommSystem: false,
  centralizedClockSystem: false,
  soundSystem: false,
  electronicsControlConveyor: false,
  computerProcessControls: false,
  buildingAutomationManagement: false,
  buildingWiringFiberOptic: true,
  electronicsPreparedBy: "ENGR. ALAN T. SANTOS, PECE",

  // Fire / BFP
  numberOfExits: "2 Independent Egress Exits with Minimum 0.90m Clear Width",
  fireEgressDetails: "Direct Exterior Access via Main Front Door & Rear Service Door",
  fireExtinguisherSpecs: "2 Units 10-lb ABC Dry Chemical Multi-Purpose Fire Extinguishers (UL-Listed)",
  emergencyLightsCount: "4 Dual-Head LED Emergency Light Units with 90-Minute Battery Backup",
  smokeDetectorsCount: "6 Photoelectric Standalone/Interconnected Smoke Alarm Detectors",
  firewallSpecs: "150mm CHB Two-Hour Fire-Rated Concrete Firewall with 1.0m Parapet Extension",

  // Demolition Permit
  demolitionBuildingType: "Single-Detached Two-Storey Residential Structure",
  demolitionArea: "180.00",
  demolitionStoreys: "2",
  demolitionScope: "Demolition of Old Dilapidated Structure Prior to New Construction",
  demolitionStartDate: "2026-10-01",
  demolitionCompletionDate: "2026-11-15",
  demolitionSupervisorName: "Engr. Roberto Cruz, CE",
  demolitionSupervisorPRC: "0078923",
  demolitionSupervisorPRCValidity: "2028-11-20",
  demolitionSupervisorPTR: "PTR-ST-2026-001",
  demolitionSupervisorPTRIssued: "Jan 10, 2026",
  demolitionSupervisorPTRIssuedAt: "Sto. Tomas",
  demolitionSupervisorTIN: "456-789-012-000",
  demolitionSupervisorAddress: "Sto. Tomas, Pampanga",
  demolitionSupervisorPhone: "0918-765-4321",
  demolitionSupervisorSignature: "",

  // Fencing Permit (NBC Form B-03)
  fencingScopeOfWork: "New Construction",
  fencingScopeDetails: "",
  fencingType: "R.C. and CONC. HOLLOW BLOCKS",
  fencingTypes: ["R.C. and CONC. HOLLOW BLOCKS"],
  fencingTypeOthers: "",
  fencingTypeOthersLine2: "",
  fencingTypeOthersLine3: "",
  fencingLength: "45.00",
  fencingHeight: "2.20",
  fencingCost: "150,000.00",

  // Excavation Permit
  excavationVolume: "120.00",
  excavationDepth: "2.50",
  excavationScope: "Foundation Excavation, Site Grading & Ground Levelling",
  excavationAndFills: true,
  foundationAndRetainingWalls: true,
  pileFoundations: false,
  gradingAndEarthworks: true,
  othersSpecify: false,
  othersSpecifyText: "",
  othersCustomLine2Check: false,
  othersCustomLine2Text: "",
  othersCustomLine3Check: false,
  othersCustomLine3Text: "",

  // Sign Permit
  signType: "Business Sign, Wall Type (Illuminated LED)",
  signDimensions: "3.00m Width x 1.50m Height (Area: 4.50 sq.m.)",
  signMaterial: "Acrylic Face with LED Backlight on Steel Framing",
  signCost: "45,000.00",
  signDocTct: true,
  signDocContractOfLease: false,
  signDocTaxDeclaration: true,
  signDocLotPlan: true,
  signDocSignPlansStructural: true,
  signDocSpecsCostEstimates: true,

  // Temporary Service Connection
  temporaryServicePurpose: "FOR CONSTRUCTION POWER & EQUIPMENT TESTING",
  temporaryServiceKva: "15.0",
  temporaryServiceVoltage: "230V, Single Phase, 60Hz",
  temporaryServiceDuration: "90",

  // Occupancy & Completion
  actualCompletionDate: "2027-04-30",
  actualProjectCost: "2,500,000.00",
  actualFloorArea: "185.50",
  constructionSupervisorName: "Engr. Roberto Cruz, CE",
  cfeiInspectorName: "Engr. GILBERT B. CRUZ, Electrical Inspector",

  // Professional Credentials - Box 3: Design Professional
  architectName: "ARCH. MARIA ELENA SANTOS, UAP",
  architectAddress: "Sto. Tomas, Pampanga",
  architectPRC: "0045211",
  architectPRCValidity: "2028-09-15",
  architectIAPOA: "IAPOA-2026-9988",
  architectIAPOAValidity: "2028-12-31",
  architectPTR: "PTR-ST-665544",
  architectPTRIssued: "Jan 08, 2026",
  architectPTRIssuedAt: "Sto. Tomas",
  architectTIN: "234-567-890-000",

  // Box 4: Supervisor / In-Charge of Architectural Works
  sameAsDesignArchitect: false,
  supervisorArchitectName: "ARCH. JUAN CARLOS REYES, UAP",
  supervisorArchitectAddress: "Sto. Tomas, Pampanga",
  supervisorArchitectPRC: "0056123",
  supervisorArchitectPRCValidity: "2027-08-20",
  supervisorArchitectIAPOA: "IAPOA-2026-8877",
  supervisorArchitectIAPOAValidity: "2027-12-31",
  supervisorArchitectPTR: "PTR-ST-778899",
  supervisorArchitectPTRIssued: "Jan 10, 2026",
  supervisorArchitectPTRIssuedAt: "Sto. Tomas",
  supervisorArchitectTIN: "345-678-901-000",

  civilEngineerName: "ENGR. ROBERTO CRUZ, PICE",
  civilEngineerAddress: "Sto. Tomas, Pampanga",
  civilEngineerPRC: "0078923",
  civilEngineerPRCValidity: "2027-06-20",
  civilEngineerPICE: "PICE-445566",
  civilEngineerPTR: "PTR-ST-554433",
  civilEngineerPTRIssued: "Jan 10, 2026",
  civilEngineerPTRIssuedAt: "Sto. Tomas",
  civilEngineerTIN: "345-678-901-000",

  // Box 4: Supervisor / In-Charge of Civil/Structural Works
  sameAsDesignCivilEngineer: false,
  supervisorCivilEngineerName: "ENGR. MARCO SANTOS, PICE",
  supervisorCivilEngineerAddress: "Sto. Tomas, Pampanga",
  supervisorCivilEngineerPRC: "0088912",
  supervisorCivilEngineerPRCValidity: "2027-09-15",
  supervisorCivilEngineerPICE: "PICE-778899",
  supervisorCivilEngineerPTR: "PTR-ST-667788",
  supervisorCivilEngineerPTRIssued: "Jan 10, 2026",
  supervisorCivilEngineerPTRIssuedAt: "Sto. Tomas",
  supervisorCivilEngineerTIN: "456-789-012-000",

  electricalEngineerName: "ENGR. DANILO REYES, PEE",
  electricalEngineerAddress: "Sto. Tomas, Pampanga",
  electricalEngineerPRC: "0033421",
  electricalEngineerPRCValidity: "2028-11-30",
  electricalEngineerIIEE: "IIEE-554433",
  electricalEngineerPTR: "PTR-ST-443322",
  electricalEngineerPTRIssued: "Jan 12, 2026",
  electricalEngineerPTRIssuedAt: "Sto. Tomas",
  electricalEngineerTIN: "456-789-012-000",
  electricalEngineerSignature: "",
  electricalContractorName: "VOLTMAX ELECTRICAL SERVICES & CONTRACTING INC.",
  electricalContractorPcab: "PCAB-EL-2026-9811",
  electricalContractorAddress: "San Fernando, Pampanga",
  electricalContractorTel: "0918-777-8899",

  // Box 4: Person In-Charge of Installation
  sameAsDesignElectricalEngineer: false,
  installationInChargeRole: "PEE" as "PEE" | "REE" | "RME",
  installationInChargeName: "ENGR. EDGAR C. MENDOZA, REE",
  installationInChargeAddress: "Sto. Tomas, Pampanga",
  installationInChargePRC: "0045678",
  installationInChargePRCValidity: "2028-08-20",
  installationInChargeTel: "0917-888-1234",
  installationInChargePTR: "PTR-ST-556677",
  installationInChargePTRIssued: "Jan 14, 2026",
  installationInChargePTRIssuedAt: "Sto. Tomas",
  installationInChargeTIN: "345-678-901-000",
  installationInChargeSignedDate: "Jan 15, 2026",
  installationInChargeSignature: "",

  masterPlumberName: "ENGR. DARIO K. AQUINO, RMP",
  masterPlumberAddress: "Sto. Tomas, Pampanga",
  masterPlumberPRC: "0011998",
  masterPlumberPRCValidity: "2028-01-25",
  masterPlumberNAMPAP: "NAMPAP-778899",
  masterPlumberPTR: "PTR-ST-332211",
  masterPlumberPTRIssued: "Jan 15, 2026",
  masterPlumberPTRIssuedAt: "Sto. Tomas",
  masterPlumberTIN: "567-890-123-000",

  mechanicalEngineerName: "ENGR. LEONARDO V. TORRES, PME",
  mechanicalEngineerAddress: "Sto. Tomas, Pampanga",
  mechanicalEngineerPRC: "0044556",
  mechanicalEngineerPRCValidity: "2027-12-18",
  mechanicalEngineerPSME: "PSME-223344",
  mechanicalEngineerPTR: "PTR-ST-221100",
  mechanicalEngineerPTRDate: "Jan 18, 2026",
  mechanicalEngineerPTRIssued: "Jan 18, 2026",
  mechanicalEngineerPTRIssuedAt: "Sto. Tomas",
  mechanicalEngineerTIN: "678-901-234-000",
  mechanicalEngineerSignedDate: "Jan 19, 2026",
  mechanicalEngineerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih0p4xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",

  // Box 4: Supervisor / In-Charge of Mechanical Works
  sameAsDesignMechanicalEngineer: true,
  mechSupervisorRole: "PME",
  mechSupervisorName: "ENGR. LEONARDO V. TORRES, PME",
  mechSupervisorAddress: "Sto. Tomas, Pampanga",
  mechSupervisorPRC: "0044556",
  mechSupervisorPRCValidity: "2027-12-18",
  mechSupervisorPTR: "PTR-ST-221100",
  mechSupervisorPTRDate: "Jan 18, 2026",
  mechSupervisorPTRIssued: "Jan 18, 2026",
  mechSupervisorPTRIssuedAt: "Sto. Tomas",
  mechSupervisorTIN: "678-901-234-000",
  mechSupervisorSignedDate: "Jan 19, 2026",
  mechSupervisorSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih0p4xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",


  electronicsEngineerName: "ENGR. ALAN T. SANTOS, PECE",
  electronicsEngineerAddress: "Sto. Tomas, Pampanga",
  electronicsEngineerPRC: "0022334",
  electronicsEngineerPRCValidity: "2028-05-12",
  electronicsEngineerIECEP: "IECEP-889900",
  electronicsEngineerPTR: "PTR-ST-110099",
  electronicsEngineerPTRIssued: "Jan 20, 2026",
  electronicsEngineerPTRIssuedAt: "Sto. Tomas",
  electronicsEngineerTIN: "789-012-345-000",
  electronicsEngineerSignedDate: "Jan 20, 2026",
  electronicsEngineerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih0p4xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",

  // Box 4: Supervisor / In-Charge of Electronics Works
  sameAsDesignElectronicsEngineer: true,
  electronicsSupervisorRole: "PECE",
  electronicsSupervisorName: "ENGR. ALAN T. SANTOS, PECE",
  electronicsSupervisorAddress: "Sto. Tomas, Pampanga",
  electronicsSupervisorPRC: "0022334",
  electronicsSupervisorPRCValidity: "2028-05-12",
  electronicsSupervisorPTR: "PTR-ST-110099",
  electronicsSupervisorPTRDate: "Jan 20, 2026",
  electronicsSupervisorPTRIssued: "Jan 20, 2026",
  electronicsSupervisorPTRIssuedAt: "Sto. Tomas",
  electronicsSupervisorTIN: "789-012-345-000",
  electronicsSupervisorSignedDate: "Jan 20, 2026",
  electronicsSupervisorSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih0p4xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",

  // Box 3 & Box 4: Owner E-Signature & Government ID
  govIdDateIssued: "Jan 10, 2024",
  govIdPlaceIssued: "Sto. Tomas",
  permitIssuedDate: "Sep 22, 2026",
  applicantSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih0p4xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",
  representativeSignature: "",
  lotOwnerConsent: true,
  lotOwnerName: "Dave Sicat",
  lotOwnerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih0p4xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",
  lotOwnerAddress: "153 Sitio Visitas",
  lotOwnerGovIdNo: "PRC-ID-00987654",
  lotOwnerGovIdDateIssued: "Jan 10, 2024",
  lotOwnerGovIdPlaceIssued: "Sto. Tomas",
  lotOwnerSignedDate: "Jan 08, 2026",

  // Corporation & Representative (for LC)
  corporationName: "",
  corporationAddress: "",
  corporationPhone: "",
  representativeName: "",
  representativeAddress: "",
  representativePhone: "",
  projectCostWords: "TWO MILLION FIVE HUNDRED THOUSAND PESOS ONLY",
};

const getAutoPermitNumber = (formId: string, applicationNo?: string): string => {
  const clean = (applicationNo || "2026-0001").replace(/^APP-(TEST-)?/i, "").trim();
  const yearSeq = clean || "2026-0001";
  switch (formId) {
    case "AP": return `AP-${yearSeq}`;
    case "SP": return `SP-${yearSeq}`;
    case "EP": return `EP-${yearSeq}`;
    case "PL": return `P-${yearSeq}`;
    case "MP": return `MP-${yearSeq}`;
    case "EL": return `EL-${yearSeq}`;
    case "BP": return `BP-${yearSeq}`;
    case "DP": return `DP-${yearSeq}`;
    case "FP": return `FP-${yearSeq}`;
    case "EXP": return `EXP-${yearSeq}`;
    case "SGP": return `SGP-${yearSeq}`;
    case "TSC": return `TSC-${yearSeq}`;
    case "CO": return `CO-${yearSeq}`;
    case "CC": return `CC-${yearSeq}`;
    case "CFEI": return `CFEI-${yearSeq}`;
    default: return `${formId}-${yearSeq}`;
  }
};

const getPermitNoLabel = (formId: string): string => {
  switch (formId) {
    case "AP": return "Architectural Permit No. (AP NO)";
    case "SP": return "Civil / Structural Permit No. (C/SP NO)";
    case "EP": return "Electrical Permit No. (EP NO)";
    case "PL": return "Sanitary / Plumbing Permit No. (PP NO)";
    case "MP": return "Mechanical Permit No. (MP NO)";
    case "EL": return "Electronics Permit No. (ELP NO)";
    case "BP": return "Building Permit No. (BP NO)";
    case "DP": return "Demolition Permit No. (DP NO)";
    case "FP": return "Fencing Permit No. (FP NO)";
    case "EXP": return "Excavation and Ground Preparation Permit No. (EGPP NO)";
    case "SGP": return "Sign Permit No. (SGP NO)";
    case "TSC": return "Temporary Service Permit No. (TSC NO)";
    default: return `${formId} Permit No.`;
  }
};

const isFormLinkedToBuildingPermit = (formId: string): boolean => {
  // Ancillary permits and certificates that connect to the master Building Permit No.
  return ["AP", "SP", "EP", "PL", "MP", "EL", "DP", "CO", "CC", "CFEI", "EXP"].includes(formId);
};

export default function FormTestingStudio() {
  const [selectedFormId, setSelectedFormId] = useState<string>("BP");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [formData, setFormData] = useState<UnifiedPermitFormData>(CALIBRATED_TEST_DATA);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [genTimeMs, setGenTimeMs] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "specs" | "professionals">("general");

  // When Locational Clearance is selected, ensure active tab is 'general'
  useEffect(() => {
    if (selectedFormId === "LC" && activeTab !== "general") {
      setActiveTab("general");
    }
  }, [selectedFormId, activeTab]);

  const blobUrlRef = React.useRef<string | null>(null);
  const generationSeq = React.useRef<number>(0);

  const createPdfBlobUrl = (dataUrlOrBase64: string): string => {
    if (!dataUrlOrBase64) return "";
    if (dataUrlOrBase64.startsWith("blob:")) return dataUrlOrBase64;

    try {
      let base64 = dataUrlOrBase64;
      if (base64.includes(",")) {
        base64 = base64.split(",")[1];
      }

      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error("Error converting PDF to blob:", e);
      return dataUrlOrBase64;
    }
  };

  const selectedForm = FORMS.find(f => f.id === selectedFormId) || FORMS[0];

  const handleFieldChange = (field: keyof UnifiedPermitFormData, value: any) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      if (field === "projectCost") {
        updated.projectCostWords = numberToWordsInPesos(value);
      }
      return updated;
    });
  };

  const handleNamePartChange = (part: "first" | "middle" | "last", val: string) => {
    const first = part === "first" ? val : (formData.applicantFirstName || "");
    const middle = part === "middle" ? val : (formData.applicantMiddleName || "");
    const last = part === "last" ? val : (formData.applicantLastName || "");
    const miDisplay = middle ? (middle.endsWith(".") ? middle : middle[0] + ".") : "";
    const full = [first, miDisplay, last].filter(Boolean).join(" ");
    setFormData(prev => ({
      ...prev,
      applicantFirstName: first,
      applicantMiddleName: middle,
      applicantLastName: last,
      applicantName: full
    }));
  };

  const handleLoadSample = () => {
    setFormData(CALIBRATED_TEST_DATA);
  };

  const handleClear = () => {
    setFormData({
      ...CALIBRATED_TEST_DATA,
      applicantName: "",
      applicantFirstName: "",
      applicantMiddleName: "",
      applicantLastName: "",
      applicantAddress: "",
      applicantTIN: "",
      applicantPhone: "",
      projectName: "",
      projectAddress: "",
      lotNo: "",
      blockNo: "",
      tctNo: "",
      taxDecNo: "",
      projectCost: "",
      lotArea: "",
      floorArea: "",
    });
  };

  const handleGeneratePdf = async () => {
    const seq = ++generationSeq.current;
    setIsGenerating(true);
    const startTime = performance.now();
    try {
      let generatedUrl = "";
      if (selectedFormId === "BP") {
        generatedUrl = await generateBuildingPermitPdf(formData);
      } else if (selectedFormId === "UNIFIED") {
        generatedUrl = await generateUnifiedPermitPdf(formData);
      } else if (selectedFormId === "AP") {
        generatedUrl = await generateArchitecturalPermitPdf(formData);
      } else if (selectedFormId === "SP") {
        generatedUrl = await generateStructuralPermitPdf(formData);
      } else if (selectedFormId === "EP") {
        generatedUrl = await generateElectricalPermitPdf(formData);
      } else if (selectedFormId === "PL") {
        generatedUrl = await generateSanitaryPermitPdf(formData);
      } else if (selectedFormId === "MP") {
        generatedUrl = await generateMechanicalPermitPdf(formData);
      } else if (selectedFormId === "EL") {
        generatedUrl = await generateElectronicsPermitPdf(formData);
      } else if (selectedFormId === "DP") {
        generatedUrl = await generateDemolitionPermitPdf(formData);
      } else if (selectedFormId === "FP") {
        generatedUrl = await generateFencingPermitPdf(formData);
      } else if (selectedFormId === "EXP") {
        generatedUrl = await generateExcavationPermitPdf(formData);
      } else if (selectedFormId === "SGP") {
        generatedUrl = await generateSignPermitPdf(formData);
      } else if (selectedFormId === "TSC") {
        generatedUrl = await generateTemporaryServicePermitPdf(formData);
      } else if (selectedFormId === "CO") {
        generatedUrl = await generateCertificateOfOccupancyPdf(formData);
      } else if (selectedFormId === "CC") {
        generatedUrl = await generateCertificateOfCompletionPdf(formData);
      } else if (selectedFormId === "CFEI") {
        generatedUrl = await generateCfeiPdf(formData);
      } else if (selectedFormId === "BFP") {
        generatedUrl = await generateBfpApplicationPdf(formData);
      } else if (selectedFormId === "LC") {
        const lcData: LocationalClearancePdfData = {
          applicationNo: formData.applicationNo || "APP-TEST-2026-0001",
          submissionDate: formData.submissionDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          applicantName: formData.applicantName,
          applicantFirstName: formData.applicantFirstName,
          applicantMiddleName: formData.applicantMiddleName,
          applicantLastName: formData.applicantLastName,
          applicantAddress: formData.applicantAddress,
          applicantPhone: formData.applicantPhone,
          applicantEmail: formData.applicantEmail,
          applicantSignature: formData.applicantSignature,
          representativeSignature: formData.representativeSignature,
          corporationName: formData.corporationName,
          corporationAddress: formData.corporationAddress,
          corporationPhone: formData.corporationPhone,
          representativeName: formData.representativeName,
          representativeAddress: formData.representativeAddress,
          representativePhone: formData.representativePhone,
          projectName: formData.projectName,
          projectType: formData.projectType?.name || "Single-Detached House",
          projectNature: formData.projectNature || "New Development",
          natureOthers: formData.natureOthers || "",
          projectAddress: formData.projectAddress,
          barangay: formData.barangay,
          lotArea: formData.lotArea,
          bldgArea: formData.floorArea,
          rightOverLand: formData.rightOverLand || "Owner",
          rightOverLandOthers: formData.rightOverLandOthers || "",
          projectTenure: formData.projectTenure || "Permanent",
          existingLandUse: formData.existingLandUse || "Residential",
          landUseOthers: formData.landUseOthers || "",
          agriculturalCrop: formData.agriculturalCrop || "",
          isTenanted: formData.isTenanted || "No",
          projectCost: formData.projectCost || "2,500,000.00",
          projectCostWords: formData.projectCostWords || numberToWordsInPesos(formData.projectCost || "2,500,000.00"),
          hasWrittenNotice: formData.hasWrittenNotice || "No",
          noticeOfficer: formData.noticeOfficer || "",
          noticeOrder: formData.noticeOrder || "",
          noticeDate: formData.noticeDate || "",
          hasRelatedAction: formData.hasRelatedAction || "No",
          relatedOffice: formData.relatedOffice || "",
          relatedDate: formData.relatedDate || "",
          relatedActionTaken: formData.relatedActionTaken || "",
          preferredMode: formData.preferredMode || "Pick-up",
        };
        generatedUrl = await generateLocationalClearancePdf(lcData);
      }

      // Only apply result if this is still the latest generation call
      if (seq === generationSeq.current) {
        // Convert large base64 data URI to a blob URL to prevent URI TOO LONG error in iframes
        const blobUrl = createPdfBlobUrl(generatedUrl);

        // Clean up previous blob URL to prevent memory leaks
        if (blobUrlRef.current && blobUrlRef.current.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(blobUrlRef.current);
          } catch (e) {}
        }
        blobUrlRef.current = blobUrl;

        setPdfUrl(blobUrl);
        setGenTimeMs(Math.round(performance.now() - startTime));
      }
    } catch (err: any) {
      if (seq === generationSeq.current) {
        console.error("Failed to generate test PDF:", err);
        alert("Error generating PDF: " + (err.message || String(err)));
      }
    } finally {
      if (seq === generationSeq.current) {
        setIsGenerating(false);
      }
    }
  };

  // Real-time automatic PDF update on keystrokes/data change with intelligent 350ms debounce
  useEffect(() => {
    if (!autoSync) return;

    const timer = setTimeout(() => {
      handleGeneratePdf();
    }, 350);

    return () => clearTimeout(timer);
  }, [formData, selectedFormId, autoSync]);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current && blobUrlRef.current.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(blobUrlRef.current);
        } catch (e) {}
      }
    };
  }, []);

  // Filter forms based on category
  const categories = [
    { key: "All", label: `All Forms (${FORMS.length})` },
    { key: "Primary", label: "Primary (1)" },
    { key: "Zoning", label: "Zoning (1)" },
    { key: "Ancillary", label: "Ancillary (6)" },
    { key: "Special", label: "Special Permits (4)" },
    { key: "Utilities", label: "Utilities (1)" },
    { key: "Completion", label: "Completion & Occupancy (3)" },
  ];

  const displayedForms = FORMS.filter(f => {
    if (categoryFilter === "All") return true;
    if (categoryFilter === "Primary") return f.category === "Primary";
    if (categoryFilter === "Zoning") return f.category.includes("Zoning");
    if (categoryFilter === "Ancillary") return f.category === "Ancillary";
    if (categoryFilter === "Special") return f.category === "Special";
    if (categoryFilter === "Utilities") return f.category.includes("Utilities");
    if (categoryFilter === "Completion") return f.category.includes("Completion");
    return true;
  });

  return (
    <div style={{ maxWidth: "1560px", margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      {/* Top Breadcrumb & Return */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <Link 
          href="/staff/templates" 
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#64748b", textDecoration: "none", fontSize: "0.88rem", fontWeight: "600" }}
        >
          <ArrowLeft size={16} /> Back to Official Templates Library
        </Link>
        <span style={{ fontSize: "0.75rem", background: "#f1f5f9", padding: "4px 10px", borderRadius: "999px", color: "#475569", fontWeight: "700" }}>
          ADMIN CALIBRATION MODE &bull; 16 OFFICIAL MUNICIPAL FORMS
        </span>
      </div>

      {/* Main Studio Header */}
      <div style={{
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        color: "white",
        borderRadius: "20px",
        padding: "1.75rem 2rem",
        marginBottom: "1.25rem",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1.5rem"
      }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", padding: "4px 12px", borderRadius: "999px", color: "#38bdf8", fontSize: "0.8rem", fontWeight: "700", marginBottom: "0.6rem" }}>
            <Sparkles size={14} />
            <span>Interactive Form Testing & Placement Studio &bull; All 16 Official Municipal Forms</span>
          </div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: "900", margin: "0 0 0.4rem 0", letterSpacing: "-0.5px" }}>
            Official Permitting Forms Verification Suite
          </h1>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.92rem", maxWidth: "800px", lineHeight: "1.5" }}>
            Test each municipal permit form individually. Enter test values, check if all checkboxes and input fields are answerable, and verify that text lands in the exact coordinates of the official scanned government template.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setAutoSync(prev => !prev)}
            style={{
              background: autoSync ? "rgba(16, 185, 129, 0.18)" : "rgba(255, 255, 255, 0.08)",
              color: autoSync ? "#34d399" : "#cbd5e1",
              border: autoSync ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(255, 255, 255, 0.15)",
              padding: "9px 14px",
              borderRadius: "12px",
              fontWeight: "700",
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px"
            }}
            title="Toggle automatic real-time PDF update as you type"
          >
            <span style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "999px",
              background: autoSync ? "#34d399" : "#94a3b8",
              boxShadow: autoSync ? "0 0 8px #34d399" : "none"
            }} />
            <span>Real-Time Sync: {autoSync ? "ON" : "OFF"}</span>
          </button>
          <button
            type="button"
            onClick={handleLoadSample}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              padding: "9px 16px",
              borderRadius: "12px",
              fontWeight: "700",
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
            title="Pre-fill all form fields with calibrated sample test data"
          >
            <Sparkles size={15} color="#38bdf8" /> Load Calibrated Sample
          </button>
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              color: "#cbd5e1",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "9px 14px",
              borderRadius: "12px",
              fontWeight: "600",
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
            title="Clear all fields to test blank behavior"
          >
            <RotateCcw size={15} /> Clear Fields
          </button>
          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={isGenerating}
            style={{
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              color: "white",
              border: "none",
              padding: "9px 20px",
              borderRadius: "12px",
              fontWeight: "800",
              fontSize: "0.9rem",
              cursor: isGenerating ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              boxShadow: "0 4px 15px rgba(37, 99, 235, 0.4)"
            }}
          >
            {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} fill="white" />}
            <span>{isGenerating ? "Syncing..." : "Generate & Inspect PDF"}</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div style={{
        display: "flex",
        gap: "0.5rem",
        overflowX: "auto",
        paddingBottom: "0.5rem",
        marginBottom: "0.75rem"
      }}>
        {categories.map(cat => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setCategoryFilter(cat.key)}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              border: categoryFilter === cat.key ? "1px solid #2563eb" : "1px solid #e2e8f0",
              background: categoryFilter === cat.key ? "#eff6ff" : "#ffffff",
              color: categoryFilter === cat.key ? "#1d4ed8" : "#64748b",
              fontWeight: categoryFilter === cat.key ? "800" : "600",
              fontSize: "0.8rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease"
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Form Picker Tabs (Horizontal Scrollable Selector) */}
      <div style={{
        display: "flex",
        gap: "0.6rem",
        overflowX: "auto",
        paddingBottom: "0.75rem",
        marginBottom: "1.5rem"
      }}>
        {displayedForms.map(form => {
          const isSelected = form.id === selectedFormId;
          const Icon = form.icon;
          return (
            <button
              key={form.id}
              type="button"
              onClick={() => {
                setSelectedFormId(form.id);
                setFormData(prev => {
                  const autoNo = getAutoPermitNumber(form.id, prev.applicationNo);
                  const isOldPrefix = prev.permitNo && ["AP-", "SP-", "EP-", "P-", "MP-", "EL-", "BP-", "DP-", "FP-", "EXP-", "SGP-", "TSC-", "CO-", "CC-", "CFEI-"].some(p => prev.permitNo?.startsWith(p));
                  return {
                    ...prev,
                    permitNo: (!prev.permitNo || isOldPrefix) ? autoNo : prev.permitNo,
                    electronicsPermitNo: form.id === "EL" ? (prev.electronicsPermitNo || autoNo) : prev.electronicsPermitNo,
                    demolitionPermitNo: form.id === "DP" ? (prev.demolitionPermitNo || autoNo) : prev.demolitionPermitNo,
                    scopeOfWork: form.id === "DP" ? "Demolition" : (prev.scopeOfWork === "Demolition" ? "New Construction" : prev.scopeOfWork)
                  };
                });
              }}
              style={{
                flexShrink: 0,
                padding: "10px 16px",
                borderRadius: "14px",
                background: isSelected ? "#2563eb" : "#ffffff",
                color: isSelected ? "#ffffff" : "#334155",
                border: isSelected ? "1.5px solid #1d4ed8" : "1.5px solid #e2e8f0",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: isSelected ? "800" : "600",
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: isSelected ? "0 4px 14px rgba(37, 99, 235, 0.25)" : "0 2px 6px rgba(0,0,0,0.02)",
                transition: "all 0.15s ease"
              }}
            >
              <Icon size={16} color={isSelected ? "#ffffff" : "#2563eb"} />
              <span>{form.code}</span>
              <span style={{ fontSize: "0.75rem", opacity: isSelected ? 0.9 : 0.65 }}>
                ({form.pages}p)
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Split Screen: Inputs on Left, Real-Time PDF on Right */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.15fr",
        gap: "1.5rem",
        alignItems: "start"
      }}>
        {/* LEFT COLUMN: Test Input Fields */}
        <div style={{
          background: "#ffffff",
          borderRadius: "20px",
          border: "1.5px solid #e2e8f0",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          overflow: "hidden"
        }}>
          {/* Header of input panel */}
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
                  {selectedForm.name}
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                  {selectedForm.desc}
                </p>
              </div>
              <span style={{ fontSize: "0.72rem", background: "#dbeafe", color: "#1d4ed8", padding: "3px 8px", borderRadius: "6px", fontWeight: "800" }}>
                {selectedForm.category}
              </span>
            </div>

            {/* Sub-tabs for organising fields */}
            <div style={{ display: "flex", gap: "6px", marginTop: "1rem" }}>
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "none",
                  background: (activeTab === "general" || selectedForm.id === "LC") ? "#2563eb" : "#e2e8f0",
                  color: (activeTab === "general" || selectedForm.id === "LC") ? "white" : "#475569",
                  fontWeight: "700",
                  fontSize: "0.78rem",
                  cursor: "pointer"
                }}
              >
                1. Applicant & Project
              </button>
              {selectedForm.id !== "LC" && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab("specs")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      border: "none",
                      background: activeTab === "specs" ? "#2563eb" : "#e2e8f0",
                      color: activeTab === "specs" ? "white" : "#475569",
                      fontWeight: "700",
                      fontSize: "0.78rem",
                      cursor: "pointer"
                    }}
                  >
                    2. Technical Details & Costs
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("professionals")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      border: "none",
                      background: activeTab === "professionals" ? "#2563eb" : "#e2e8f0",
                      color: activeTab === "professionals" ? "white" : "#475569",
                      fontWeight: "700",
                      fontSize: "0.78rem",
                      cursor: "pointer"
                    }}
                  >
                    3. Engineers & Credentials
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Form Fields Area */}
          <div style={{ padding: "1.5rem", maxHeight: "750px", overflowY: "auto" }}>
            {(activeTab === "general" || selectedForm.id === "LC") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: selectedForm.id === "LC" 
                    ? "1fr" 
                    : isFormLinkedToBuildingPermit(selectedForm.id) 
                      ? "1fr 1fr 1fr" 
                      : "1fr 1fr",
                  gap: "0.75rem"
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569" }}>
                        {(selectedForm.id === "CO" || selectedForm.id === "CC")
                          ? "Building Permit Ref. No." 
                          : (selectedForm.id === "CFEI" ? "Application Reference No." : "Application No.")}
                      </label>
                      <span style={{ fontSize: "0.68rem", color: "#0284c7", fontWeight: "700", background: "#e0f2fe", padding: "1px 6px", borderRadius: "4px" }}>
                        Auto-gathered
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.applicationNo}
                      readOnly
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        background: "#f8fafc",
                        color: "#334155",
                        cursor: "not-allowed"
                      }}
                    />
                    <span style={{ display: "block", fontSize: "0.7rem", color: "#64748b", marginTop: "3px" }}>
                      Automatically gathered from user Application Number
                    </span>
                  </div>

                  {selectedForm.id !== "LC" && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569" }}>
                          {getPermitNoLabel(selectedForm.id)}
                        </label>
                        <span style={{ fontSize: "0.68rem", color: "#059669", fontWeight: "700", background: "#d1fae5", padding: "1px 6px", borderRadius: "4px" }}>
                          Auto-generated
                        </span>
                      </div>
                      <input
                        type="text"
                        value={formData.permitNo || getAutoPermitNumber(selectedForm.id, formData.applicationNo)}
                        onChange={e => handleFieldChange("permitNo", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: "1.5px solid #10b981",
                          fontSize: "0.85rem",
                          fontWeight: "700",
                          background: "#f0fdf4",
                          color: "#065f46"
                        }}
                      />
                      <span style={{ display: "block", fontSize: "0.7rem", color: "#64748b", marginTop: "3px" }}>
                        Auto-generated and mapped directly into official {selectedForm.code} boxes
                      </span>
                    </div>
                  )}

                  {isFormLinkedToBuildingPermit(selectedForm.id) && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569" }}>
                          Building Permit No. (BP NO)
                        </label>
                        <span style={{ fontSize: "0.68rem", color: "#2563eb", fontWeight: "700", background: "#dbeafe", padding: "1px 6px", borderRadius: "4px" }}>
                          Auto-gathered (Connected)
                        </span>
                      </div>
                      <input
                        type="text"
                        value={formData.buildingPermitNo || (formData.applicationNo ? getAutoPermitNumber("BP", formData.applicationNo) : "BP-2026-0001")}
                        onChange={e => handleFieldChange("buildingPermitNo", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: "1.5px solid #3b82f6",
                          fontSize: "0.85rem",
                          fontWeight: "700",
                          background: "#eff6ff",
                          color: "#1d4ed8"
                        }}
                      />
                      <span style={{ display: "block", fontSize: "0.7rem", color: "#64748b", marginTop: "3px" }}>
                        {selectedForm.id === "DP"
                          ? "Auto-gathered from project with Building Permit — mapped into the 8 official boxes of NBC Form B-08"
                          : "Auto-gathered from project with Building Permit — mapped into the official boxes"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Project Selection & Building Permit Auto-Gather Connection Card */}
                {selectedForm.id !== "LC" && (
                  <div style={{
                    padding: "1rem 1.25rem",
                    borderRadius: "12px",
                    background: (formData.projectType?.matrix?.buildingPermit === 'required' || !formData.projectType) ? "#f0fdf4" : "#f8fafc",
                    border: (formData.projectType?.matrix?.buildingPermit === 'required' || !formData.projectType) ? "1.5px solid #86efac" : "1.5px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Building2 size={16} color={(formData.projectType?.matrix?.buildingPermit === 'required' || !formData.projectType) ? "#16a34a" : "#64748b"} />
                        <span style={{ fontSize: "0.82rem", fontWeight: "800", color: (formData.projectType?.matrix?.buildingPermit === 'required' || !formData.projectType) ? "#14532d" : "#334155" }}>
                          Selected Project & Building Permit Connection
                        </span>
                      </div>
                      {(formData.projectType?.matrix?.buildingPermit === 'required' || !formData.projectType) ? (
                        <span style={{ fontSize: "0.72rem", background: "#dcfce7", color: "#15803d", padding: "3px 8px", borderRadius: "6px", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <CheckCircle2 size={12} /> Connected with Master Building Permit
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.72rem", background: "#f1f5f9", color: "#64748b", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                          Standalone Permit (No Building Permit Required)
                        </span>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          Pick Project / Construction Type
                        </label>
                        <select
                          value={formData.projectType?.id || PROJECT_TYPES_MATRIX[0].id}
                          onChange={e => {
                            const selected = PROJECT_TYPES_MATRIX.find(p => p.id === e.target.value);
                            if (selected) {
                              const hasBp = selected.matrix?.buildingPermit === 'required' || selected.matrix?.buildingPermit === 'conditional';
                              const cleanApp = (formData.applicationNo || "2026-0001").replace(/^APP-(TEST-)?/i, "").trim();
                              setFormData(prev => ({
                                ...prev,
                                projectType: selected,
                                projectName: prev.projectName && prev.projectName !== prev.projectType?.name ? prev.projectName : `${selected.name} Project`,
                                buildingPermitNo: hasBp ? (prev.buildingPermitNo || `BP-${cleanApp}`) : prev.buildingPermitNo,
                                occupancyClass: selected.category ? selected.category.toUpperCase() : (prev.occupancyClass || "RESIDENTIAL")
                              }));
                            }
                          }}
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            border: "1.5px solid #cbd5e1",
                            fontSize: "0.85rem",
                            background: "#ffffff",
                            fontWeight: "700",
                            color: "#0f172a",
                            cursor: "pointer"
                          }}
                        >
                          {Array.from(new Set(PROJECT_TYPES_MATRIX.map(p => p.category))).map(cat => (
                            <optgroup key={cat} label={`── ${cat.toUpperCase()} ──`}>
                              {PROJECT_TYPES_MATRIX.filter(p => p.category === cat).map(proj => (
                                <option key={proj.id} value={proj.id}>
                                  {proj.name} {proj.matrix?.buildingPermit === 'required' ? "• [With Building Permit]" : "• [Standalone]"}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          Master Building Permit No. (Auto-Gathered)
                        </label>
                        <input
                          type="text"
                          value={formData.buildingPermitNo || ""}
                          onChange={e => handleFieldChange("buildingPermitNo", e.target.value)}
                          placeholder="BP-2026-0001"
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            border: (formData.projectType?.matrix?.buildingPermit === 'required' || !formData.projectType) ? "1.5px solid #16a34a" : "1px solid #cbd5e1",
                            fontSize: "0.85rem",
                            fontWeight: "700",
                            background: (formData.projectType?.matrix?.buildingPermit === 'required' || !formData.projectType) ? "#f0fdf4" : "#f8fafc",
                            color: (formData.projectType?.matrix?.buildingPermit === 'required' || !formData.projectType) ? "#15803d" : "#64748b"
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ fontSize: "0.73rem", color: (formData.projectType?.matrix?.buildingPermit === 'required' || !formData.projectType) ? "#166534" : "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Sparkles size={13} color={(formData.projectType?.matrix?.buildingPermit === 'required' || !formData.projectType) ? "#16a34a" : "#94a3b8"} />
                      <span>
                        {(formData.projectType?.matrix?.buildingPermit === 'required' || !formData.projectType)
                          ? `Auto-gathering active: Picking this project connects the Master Building Permit (${formData.buildingPermitNo || "BP-2026-0001"}). In the Architectural Permit (NBC Form A-01), the 10 official boxes under "BUILDING PERMIT NO." are automatically filled.`
                          : "This project does not require a Building Permit. Ancillary boxes will remain unlinked unless a Building Permit is specified."}
                      </span>
                    </div>
                  </div>
                )}

                {/* BP Classification & Application Type */}
                {selectedForm.id === "BP" && (
                  <div style={{
                    padding: "1rem",
                    borderRadius: "12px",
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.85rem"
                  }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: "800", color: "#1e293b" }}>
                      Application Classification & Type
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1rem" }}>
                      {/* Processing Classification */}
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                          Classification
                        </label>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          {(["SIMPLE", "COMPLEX"] as const).map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => handleFieldChange("processingType", type)}
                              style={{
                                flex: 1,
                                padding: "6px 10px",
                                borderRadius: "6px",
                                border: (formData.processingType || "SIMPLE") === type ? "1.5px solid #0284c7" : "1px solid #cbd5e1",
                                background: (formData.processingType || "SIMPLE") === type ? "#e0f2fe" : "#ffffff",
                                color: (formData.processingType || "SIMPLE") === type ? "#0369a1" : "#475569",
                                fontWeight: (formData.processingType || "SIMPLE") === type ? "700" : "600",
                                fontSize: "0.78rem",
                                cursor: "pointer",
                                transition: "all 0.15s ease"
                              }}
                            >
                              {type === "COMPLEX" ? "COMPLEX*" : type}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Application Type */}
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                          Application Type
                        </label>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          {(["NEW", "RENEWAL", "AMENDATORY"] as const).map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => handleFieldChange("applicationType", type)}
                              style={{
                                flex: 1,
                                padding: "6px 8px",
                                borderRadius: "6px",
                                border: (formData.applicationType || "NEW") === type ? "1.5px solid #0284c7" : "1px solid #cbd5e1",
                                background: (formData.applicationType || "NEW") === type ? "#e0f2fe" : "#ffffff",
                                color: (formData.applicationType || "NEW") === type ? "#0369a1" : "#475569",
                                fontWeight: (formData.applicationType || "NEW") === type ? "700" : "600",
                                fontSize: "0.78rem",
                                cursor: "pointer",
                                transition: "all 0.15s ease"
                              }}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Applies Also For */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                        This Applies Also For:
                      </label>
                      <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#334155", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={!!formData.appliesLocationalClearance}
                            onChange={e => handleFieldChange("appliesLocationalClearance", e.target.checked)}
                            style={{ width: "16px", height: "16px", accentColor: "#0284c7" }}
                          />
                          Locational Clearance
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#334155", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={formData.appliesFireSafetyClearance !== false}
                            onChange={e => handleFieldChange("appliesFireSafetyClearance", e.target.checked)}
                            style={{ width: "16px", height: "16px", accentColor: "#0284c7" }}
                          />
                          Fire Safety Evaluation Clearance
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* BOX 1: OWNER / APPLICANT - Specific Official Form Layout matching screenshot */}
                <div style={{
                  borderRadius: "10px",
                  border: "2px solid #0f172a",
                  overflow: "hidden",
                  background: "#ffffff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                }}>
                  {/* Official Header Strip */}
                  <div style={{
                    background: "#0f172a",
                    color: "#ffffff",
                    padding: "6px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "800", letterSpacing: "0.5px" }}>
                      BOX 1 (TO BE ACCOMPLISHED IN PRINT BY THE OWNER/APPLICANT)
                    </span>
                    <span style={{ fontSize: "0.68rem", background: "rgba(255,255,255,0.2)", color: "#ffffff", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
                      Specific Official Fields
                    </span>
                  </div>

                  {/* Specific Name Grid matching screenshot: OWNER/APPLICANT | LAST NAME | FIRST NAME | M.I. | TIN */}
                  <div style={{ padding: "0.85rem 1rem", background: "#f8fafc" }}>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: selectedForm.id === "LC" ? "120px 1.4fr 1.2fr 0.6fr" : "110px 1.4fr 1.2fr 0.6fr 1fr",
                      gap: "0.65rem",
                      alignItems: "end"
                    }}>
                      {/* OWNER/APPLICANT Tag */}
                      <div style={{ paddingBottom: "8px" }}>
                        <span style={{
                          display: "block",
                          fontSize: "0.72rem",
                          fontWeight: "800",
                          color: "#1e293b",
                          letterSpacing: "0.4px"
                        }}>
                          OWNER / APPLICANT
                        </span>
                        <span style={{ fontSize: "0.66rem", color: "#64748b" }}>
                          (Print in capital letters)
                        </span>
                      </div>

                      {/* LAST NAME */}
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "800", color: "#334155", marginBottom: "4px", letterSpacing: "0.3px" }}>
                          LAST NAME
                        </label>
                        <input
                          type="text"
                          placeholder="DELA CRUZ"
                          value={formData.applicantLastName || ""}
                          onChange={e => handleNamePartChange("last", e.target.value.toUpperCase())}
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            border: "1.5px solid #cbd5e1",
                            fontSize: "0.88rem",
                            fontWeight: "800",
                            color: "#0f172a",
                            background: "#ffffff",
                            textTransform: "uppercase"
                          }}
                        />
                      </div>

                      {/* FIRST NAME */}
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "800", color: "#334155", marginBottom: "4px", letterSpacing: "0.3px" }}>
                          FIRST NAME
                        </label>
                        <input
                          type="text"
                          placeholder="JUAN"
                          value={formData.applicantFirstName || ""}
                          onChange={e => handleNamePartChange("first", e.target.value.toUpperCase())}
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            border: "1.5px solid #cbd5e1",
                            fontSize: "0.88rem",
                            fontWeight: "800",
                            color: "#0f172a",
                            background: "#ffffff",
                            textTransform: "uppercase"
                          }}
                        />
                      </div>

                      {/* M.I. */}
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "800", color: "#334155", marginBottom: "4px", letterSpacing: "0.3px", textAlign: "center" }}>
                          M.I.
                        </label>
                        <input
                          type="text"
                          placeholder="S."
                          maxLength={4}
                          value={formData.applicantMiddleName || ""}
                          onChange={e => handleNamePartChange("middle", e.target.value.toUpperCase())}
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            border: "1.5px solid #cbd5e1",
                            fontSize: "0.88rem",
                            fontWeight: "800",
                            color: "#0f172a",
                            background: "#ffffff",
                            textTransform: "uppercase",
                            textAlign: "center"
                          }}
                        />
                      </div>

                      {/* TIN (if not LC) */}
                      {selectedForm.id !== "LC" && (
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "800", color: "#334155", marginBottom: "4px", letterSpacing: "0.3px" }}>
                            TIN
                          </label>
                          <input
                            type="text"
                            placeholder="123-456-789-000"
                            value={formData.applicantTIN || ""}
                            onChange={e => handleFieldChange("applicantTIN", e.target.value)}
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              border: "1.5px solid #cbd5e1",
                              fontSize: "0.88rem",
                              fontWeight: "700",
                              color: "#0f172a",
                              background: "#ffffff"
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Compiled Form Full Name Display */}
                    <div style={{
                      marginTop: "0.65rem",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      background: "#e0f2fe",
                      border: "1px solid #bae6fd",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}>
                      <span style={{ fontSize: "0.72rem", color: "#0369a1", fontWeight: "700" }}>
                        Compiled Form Full Name:
                      </span>
                      <span style={{ fontSize: "0.82rem", color: "#0c4a6e", fontWeight: "800" }}>
                        {formData.applicantFirstName || "JUAN"} {formData.applicantMiddleName ? (formData.applicantMiddleName.endsWith(".") ? formData.applicantMiddleName : formData.applicantMiddleName[0] + ".") : "S."} {formData.applicantLastName || "DELA CRUZ"}
                      </span>
                    </div>

                    {/* Official Row 2 of Box 1: FOR CONSTRUCTION OWNED BY AN ENTERPRISE | FORM OF OWNERSHIP | USE OR CHARACTER OF OCCUPANCY */}
                    <div style={{
                      marginTop: "0.85rem",
                      paddingTop: "0.85rem",
                      borderTop: "1.5px dashed #cbd5e1"
                    }}>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "1.4fr 1.1fr 1.2fr",
                        gap: "0.65rem",
                        alignItems: "start"
                      }}>
                        {/* 1. FOR CONSTRUCTION OWNED BY AN ENTERPRISE */}
                        <div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                            <label style={{ fontSize: "0.72rem", fontWeight: "900", color: "#1e293b", letterSpacing: "0.3px", lineHeight: "1.25" }}>
                              <div>FOR CONSTRUCTION OWNED</div>
                              <div style={{ color: "#2563eb" }}>BY AN ENTERPRISE</div>
                            </label>
                          </div>
                          <input
                            type="text"
                            placeholder="e.g. SAN MIGUEL CORP. (or N/A)"
                            value={formData.constructionOwnedByEnterprise ?? formData.corporationName ?? ""}
                            onChange={e => {
                              handleFieldChange("constructionOwnedByEnterprise", e.target.value.toUpperCase());
                              handleFieldChange("corporationName", e.target.value.toUpperCase());
                            }}
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              border: "1.5px solid #cbd5e1",
                              fontSize: "0.85rem",
                              fontWeight: "700",
                              color: "#0f172a",
                              background: "#ffffff",
                              textTransform: "uppercase"
                            }}
                          />
                          <span style={{ display: "block", fontSize: "0.66rem", color: "#64748b", marginTop: "3px" }}>
                            Name of enterprise / corporation owning the construction (or N/A)
                          </span>
                        </div>

                        {/* 2. FORM OF OWNERSHIP */}
                        <div>
                          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "900", color: "#1e293b", marginBottom: "4px", letterSpacing: "0.2px" }}>
                            FORM OF OWNERSHIP
                          </label>
                          <select
                            value={["INDIVIDUAL / OWNER", "INDIVIDUAL / SOLE PROPRIETORSHIP", "CORPORATION", "PARTNERSHIP", "GOVERNMENT / INSTITUTIONAL", "NON-PROFIT / NGO", "COOPERATIVE"].includes((formData.formOfOwnership || "INDIVIDUAL / OWNER").toUpperCase()) ? (formData.formOfOwnership || "INDIVIDUAL / OWNER").toUpperCase() : "OTHERS"}
                            onChange={e => {
                              if (e.target.value !== "OTHERS") {
                                handleFieldChange("formOfOwnership", e.target.value);
                              } else {
                                handleFieldChange("formOfOwnership", "");
                              }
                            }}
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              border: "1.5px solid #cbd5e1",
                              fontSize: "0.85rem",
                              fontWeight: "700",
                              color: "#0f172a",
                              background: "#ffffff",
                              cursor: "pointer"
                            }}
                          >
                            <option value="INDIVIDUAL / OWNER">INDIVIDUAL / OWNER</option>
                            <option value="INDIVIDUAL / SOLE PROPRIETORSHIP">INDIVIDUAL / SOLE PROPRIETORSHIP</option>
                            <option value="CORPORATION">CORPORATION</option>
                            <option value="PARTNERSHIP">PARTNERSHIP</option>
                            <option value="GOVERNMENT / INSTITUTIONAL">GOVERNMENT / INSTITUTIONAL</option>
                            <option value="NON-PROFIT / NGO">NON-PROFIT / NGO</option>
                            <option value="COOPERATIVE">COOPERATIVE</option>
                            <option value="OTHERS">OTHER (CUSTOM)</option>
                          </select>
                          {!["INDIVIDUAL / OWNER", "INDIVIDUAL / SOLE PROPRIETORSHIP", "CORPORATION", "PARTNERSHIP", "GOVERNMENT / INSTITUTIONAL", "NON-PROFIT / NGO", "COOPERATIVE"].includes((formData.formOfOwnership || "").toUpperCase()) && (
                            <input
                              type="text"
                              placeholder="Specify Form of Ownership..."
                              value={formData.formOfOwnership || ""}
                              onChange={e => handleFieldChange("formOfOwnership", e.target.value.toUpperCase())}
                              style={{
                                width: "100%",
                                marginTop: "5px",
                                padding: "6px 9px",
                                borderRadius: "6px",
                                border: "1.5px solid #93c5fd",
                                fontSize: "0.82rem",
                                fontWeight: "700",
                                color: "#0f172a",
                                background: "#f0f9ff"
                              }}
                            />
                          )}
                          <span style={{ display: "block", fontSize: "0.66rem", color: "#64748b", marginTop: "3px" }}>
                            Legal ownership structure
                          </span>
                        </div>

                        {/* 3. USE OR CHARACTER OF OCCUPANCY */}
                        <div>
                          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "900", color: "#1e293b", marginBottom: "4px", letterSpacing: "0.2px" }}>
                            USE OR CHARACTER OF OCCUPANCY
                          </label>
                          <select
                            value={(() => {
                              const upper = (formData.occupancyClass || "RESIDENTIAL").toUpperCase();
                              if (upper.includes("RESIDENTIAL")) return "RESIDENTIAL";
                              if (upper.includes("COMMERCIAL")) return "COMMERCIAL";
                              if (upper.includes("INDUSTRIAL")) return "INDUSTRIAL";
                              if (upper.includes("INSTITUTIONAL")) return "INSTITUTIONAL";
                              if (upper.includes("AGRICULTURAL")) return "AGRICULTURAL";
                              if (upper.includes("EDUCATIONAL")) return "EDUCATIONAL & RECREATIONAL";
                              if (upper.includes("ASSEMBLY")) return "ASSEMBLY / RECREATION";
                              return ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "INSTITUTIONAL", "AGRICULTURAL", "EDUCATIONAL & RECREATIONAL", "ASSEMBLY / RECREATION"].includes(upper) ? upper : "OTHERS";
                            })()}
                            onChange={e => {
                              if (e.target.value !== "OTHERS") {
                                handleFieldChange("occupancyClass", e.target.value);
                              } else {
                                handleFieldChange("occupancyClass", "");
                              }
                            }}
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              border: "1.5px solid #cbd5e1",
                              fontSize: "0.85rem",
                              fontWeight: "700",
                              color: "#0f172a",
                              background: "#ffffff",
                              cursor: "pointer"
                            }}
                          >
                            <option value="RESIDENTIAL">RESIDENTIAL</option>
                            <option value="COMMERCIAL">COMMERCIAL</option>
                            <option value="INDUSTRIAL">INDUSTRIAL</option>
                            <option value="INSTITUTIONAL">INSTITUTIONAL</option>
                            <option value="AGRICULTURAL">AGRICULTURAL</option>
                            <option value="EDUCATIONAL & RECREATIONAL">EDUCATIONAL & RECREATIONAL</option>
                            <option value="ASSEMBLY / RECREATION">ASSEMBLY / RECREATION</option>
                            <option value="OTHERS">OTHER (CUSTOM)</option>
                          </select>
                          {!["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "INSTITUTIONAL", "AGRICULTURAL", "EDUCATIONAL & RECREATIONAL", "ASSEMBLY / RECREATION"].includes((formData.occupancyClass || "").toUpperCase()) && !(formData.occupancyClass || "").toUpperCase().includes("RESIDENTIAL") && (
                            <input
                              type="text"
                              placeholder="Specify Character of Occupancy..."
                              value={formData.occupancyClass || ""}
                              onChange={e => handleFieldChange("occupancyClass", e.target.value.toUpperCase())}
                              style={{
                                width: "100%",
                                marginTop: "5px",
                                padding: "6px 9px",
                                borderRadius: "6px",
                                border: "1.5px solid #93c5fd",
                                fontSize: "0.82rem",
                                fontWeight: "700",
                                color: "#0f172a",
                                background: "#f0f9ff"
                              }}
                            />
                          )}
                          <span style={{ display: "block", fontSize: "0.66rem", color: "#64748b", marginTop: "3px" }}>
                            NBC occupancy classification
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Box 1 Row 3: ADDRESS: NO., SITIO, | BARANGAY, | MUNICIPALITY | ZIP CODE | CONTACT NO. */}
                <div style={{
                  padding: "0.85rem 1rem",
                  borderRadius: "10px",
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0"
                }}>
                  <div style={{
                    fontSize: "0.74rem",
                    fontWeight: "900",
                    color: "#1e293b",
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                    marginBottom: "0.6rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}>
                    <span>ADDRESS & CONTACT INFORMATION</span>
                    <span style={{ fontSize: "0.66rem", color: "#64748b", fontWeight: "600" }}>
                      Official Government Form Grid (Row 3)
                    </span>
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1.3fr 1.1fr 1.1fr 0.7fr 1.1fr 1.4fr",
                    gap: "0.65rem"
                  }}>
                    {/* 1. NO., STREET / SITIO */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "3px" }}>
                        NO., STREET, SITIO
                      </label>
                      <input
                        type="text"
                        value={formData.applicantNoStreet || "123 RIZAL ST."}
                        onChange={e => {
                          const val = e.target.value.toUpperCase();
                          handleFieldChange("applicantNoStreet", val);
                          handleFieldChange("applicantAddress", `${val}, ${formData.applicantBarangay || "POBLACION"}, ${formData.applicantMunicipality || "STO. TOMAS"}, ${formData.applicantProvince || "PAMPANGA"}`);
                        }}
                        style={{ width: "100%", padding: "7px 9px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "0.84rem", fontWeight: "700", textTransform: "uppercase" }}
                      />
                    </div>

                    {/* 2. BARANGAY */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "3px" }}>
                        BARANGAY
                      </label>
                      <select
                        value={(formData.applicantBarangay || "POBLACION").toUpperCase()}
                        onChange={e => {
                          const val = e.target.value;
                          handleFieldChange("applicantBarangay", val);
                          handleFieldChange("barangay", val);
                          handleFieldChange("applicantAddress", `${formData.applicantNoStreet || "123 RIZAL ST."}, ${val}, ${formData.applicantMunicipality || "STO. TOMAS"}, ${formData.applicantProvince || "PAMPANGA"}`);
                        }}
                        style={{ width: "100%", padding: "7px 9px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "0.84rem", fontWeight: "700", cursor: "pointer", background: "#ffffff" }}
                      >
                        {["POBLACION", "SAN BARTOLOME", "SAN MATIAS", "SAN VICENTE", "SANTA ANA", "SANTO ROSARIO", "SAN NICOLAS"].map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                        <option value="OTHERS">OTHER (SPECIFY)</option>
                      </select>
                    </div>

                    {/* 3. CITY / MUNICIPALITY */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "3px" }}>
                        MUNICIPALITY
                      </label>
                      <input
                        type="text"
                        value={formData.applicantMunicipality || "STO. TOMAS"}
                        onChange={e => {
                          const val = e.target.value.toUpperCase();
                          handleFieldChange("applicantMunicipality", val);
                          handleFieldChange("applicantAddress", `${formData.applicantNoStreet || "123 RIZAL ST."}, ${formData.applicantBarangay || "POBLACION"}, ${val}, ${formData.applicantProvince || "PAMPANGA"}`);
                        }}
                        style={{ width: "100%", padding: "7px 9px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "0.84rem", fontWeight: "700", textTransform: "uppercase" }}
                      />
                    </div>

                    {/* 4. ZIP CODE */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "3px", textAlign: "center" }}>
                        ZIP CODE
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={formData.applicantZipCode || "2020"}
                        onChange={e => handleFieldChange("applicantZipCode", e.target.value)}
                        style={{ width: "100%", padding: "7px 7px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "0.84rem", fontWeight: "700", textAlign: "center" }}
                      />
                    </div>

                    {/* 5. CONTACT NO. */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "3px" }}>
                        CONTACT NO.
                      </label>
                      <input
                        type="text"
                        value={formData.applicantPhone || "0917-123-4567"}
                        onChange={e => handleFieldChange("applicantPhone", e.target.value)}
                        style={{ width: "100%", padding: "7px 9px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "0.84rem", fontWeight: "700" }}
                      />
                    </div>

                    {/* 6. EMAIL ADDRESS */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "3px" }}>
                        EMAIL ADDRESS
                      </label>
                      <input
                        type="email"
                        value={formData.applicantEmail || "juan.delacruz@example.com"}
                        onChange={e => handleFieldChange("applicantEmail", e.target.value)}
                        placeholder="juan.delacruz@example.com"
                        style={{ width: "100%", padding: "7px 9px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "0.84rem", fontWeight: "700" }}
                      />
                    </div>
                  </div>

                  <div style={{
                    marginTop: "0.5rem",
                    padding: "4px 10px",
                    borderRadius: "5px",
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}>
                    <span style={{ fontSize: "0.68rem", color: "#1e40af", fontWeight: "700" }}>
                      Compiled Form Address:
                    </span>
                    <span style={{ fontSize: "0.76rem", color: "#1e3a8a", fontWeight: "800" }}>
                      {`${formData.applicantNoStreet || "123 RIZAL ST."}, ${formData.applicantBarangay || "POBLACION"}, ${formData.applicantMunicipality || "STO. TOMAS"}, ${formData.applicantProvince || "PAMPANGA"} ${formData.applicantZipCode || "2020"}`}
                    </span>
                  </div>
                </div>

                {/* Corporation & Representative (Boxes 2, 4, 5, 6 - for LC) */}
                {selectedForm.id === "LC" && (
                  <div style={{
                    padding: "1rem",
                    borderRadius: "10px",
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.85rem"
                  }}>
                    {/* Corporation Details (Boxes 2 & 4) */}
                    <div style={{
                      padding: "0.85rem",
                      borderRadius: "8px",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#1e293b" }}>
                          2. Name of Corporation
                        </label>
                        <span style={{
                          fontSize: "0.68rem",
                          fontWeight: "700",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          background: formData.corporationName?.trim() ? "#e0f2fe" : "#f1f5f9",
                          color: formData.corporationName?.trim() ? "#0369a1" : "#64748b"
                        }}>
                          {formData.corporationName?.trim() ? "Corporate Applicant" : "N/A (Individual Applicant)"}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={formData.corporationName || ""}
                        onChange={e => handleFieldChange("corporationName", e.target.value)}
                        placeholder="Leave blank for Individual Applicant (defaults to N/A)"
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", marginBottom: "8px" }}
                      />

                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "0.5rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#475569", marginBottom: "3px" }}>
                            4. Address of Corporation
                          </label>
                          <input
                            type="text"
                            value={formData.corporationAddress || ""}
                            onChange={e => handleFieldChange("corporationAddress", e.target.value)}
                            placeholder="e.g. 123 Business Ave., Makati City"
                            style={{ width: "100%", padding: "7px 9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#475569", marginBottom: "3px" }}>
                            4. Telephone / Contact
                          </label>
                          <input
                            type="text"
                            value={formData.corporationPhone || ""}
                            onChange={e => handleFieldChange("corporationPhone", e.target.value)}
                            placeholder="e.g. (02) 8888-0000"
                            style={{ width: "100%", padding: "7px 9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Authorized Representative (Boxes 5 & 6) */}
                    <div style={{
                      padding: "0.85rem",
                      borderRadius: "8px",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#1e293b" }}>
                          5. Name of Authorized Representative
                        </label>
                        <span style={{
                          fontSize: "0.68rem",
                          fontWeight: "700",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          background: formData.representativeName?.trim() ? "#e0f2fe" : "#f1f5f9",
                          color: formData.representativeName?.trim() ? "#0369a1" : "#64748b"
                        }}>
                          {formData.representativeName?.trim() ? "Representative Appointed" : "N/A (Self-Represented)"}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={formData.representativeName || ""}
                        onChange={e => handleFieldChange("representativeName", e.target.value)}
                        placeholder="Leave blank if Self-Represented (defaults to N/A)"
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", marginBottom: "8px" }}
                      />

                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "0.5rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#475569", marginBottom: "3px" }}>
                            6. Address of Authorized Representative
                          </label>
                          <input
                            type="text"
                            value={formData.representativeAddress || ""}
                            onChange={e => handleFieldChange("representativeAddress", e.target.value)}
                            placeholder="e.g. Unit 4B, Law Center, Sto. Tomas"
                            style={{ width: "100%", padding: "7px 9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#475569", marginBottom: "3px" }}>
                            6. Telephone / Contact
                          </label>
                          <input
                            type="text"
                            value={formData.representativePhone || ""}
                            onChange={e => handleFieldChange("representativePhone", e.target.value)}
                            placeholder="e.g. 0917-123-4567"
                            style={{ width: "100%", padding: "7px 9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Name / Type */}
                {selectedForm.id === "LC" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#475569" }}>
                        7. Project Type
                      </label>
                      <span style={{ fontSize: "0.72rem", color: "#0284c7", fontWeight: "700" }}>
                        {PROJECT_TYPES_MATRIX.length} System Project Types
                      </span>
                    </div>
                    <select
                      value={formData.projectType?.id || PROJECT_TYPES_MATRIX[0].id}
                      onChange={e => {
                        const selected = PROJECT_TYPES_MATRIX.find(p => p.id === e.target.value);
                        if (selected) {
                          setFormData(prev => ({
                            ...prev,
                            projectType: selected,
                            projectName: selected.name,
                          }));
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.85rem",
                        background: "#ffffff",
                        fontWeight: "700",
                        color: "#0f172a",
                        cursor: "pointer",
                        outline: "none"
                      }}
                    >
                      {Array.from(new Set(PROJECT_TYPES_MATRIX.map(p => p.category))).map(cat => (
                        <optgroup key={cat} label={`── ${cat.toUpperCase()} ──`}>
                          {PROJECT_TYPES_MATRIX.filter(p => p.category === cat).map(proj => (
                            <option key={proj.id} value={proj.id}>
                              {proj.name} ({proj.category})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                      Project Street Address / Subd. (Box 3)
                    </label>
                    <input
                      type="text"
                      value={formData.projectAddress}
                      onChange={e => handleFieldChange("projectAddress", e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                      Barangay
                    </label>
                    <input
                      type="text"
                      value={formData.barangay}
                      onChange={e => handleFieldChange("barangay", e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                    />
                  </div>
                </div>

                {/* Land Records: Lot, Block, TCT, Tax Dec */}
                {selectedForm.id !== "EP" && (
                  <div style={{ display: "grid", gridTemplateColumns: (selectedForm.id === "PL" || selectedForm.id === "CO" || selectedForm.id === "CFEI") ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: "0.5rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                        Lot No.
                      </label>
                      <input
                        type="text"
                        value={formData.lotNo || ""}
                        onChange={e => handleFieldChange("lotNo", e.target.value)}
                        style={{ width: "100%", padding: "7px 8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                        Block No.
                      </label>
                      <input
                        type="text"
                        value={formData.blockNo || ""}
                        onChange={e => handleFieldChange("blockNo", e.target.value)}
                        style={{ width: "100%", padding: "7px 8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                      />
                    </div>
                    {selectedForm.id !== "PL" && selectedForm.id !== "CO" && selectedForm.id !== "CFEI" && (
                      <>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                            TCT No.
                          </label>
                          <input
                            type="text"
                            value={formData.tctNo || ""}
                            onChange={e => handleFieldChange("tctNo", e.target.value)}
                            style={{ width: "100%", padding: "7px 8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                            Tax Dec No.
                          </label>
                          <input
                            type="text"
                            value={formData.taxDecNo || ""}
                            onChange={e => handleFieldChange("taxDecNo", e.target.value)}
                            style={{ width: "100%", padding: "7px 8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {selectedForm.id === "LC" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    {/* 8. Project Nature */}
                    <div style={{
                      padding: "0.85rem",
                      borderRadius: "8px",
                      background: "#f8fafc",
                      border: "1.5px solid #cbd5e1"
                    }}>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
                        8. Project Nature
                      </label>
                      <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "0.85rem", fontWeight: "600", color: "#1e293b", cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="lcProjectNature"
                            value="New Development"
                            checked={formData.projectNature !== "Others"}
                            onChange={() => handleFieldChange("projectNature", "New Development")}
                            style={{ accentColor: "#0284c7", width: "16px", height: "16px", cursor: "pointer" }}
                          />
                          <span style={{ fontWeight: formData.projectNature !== "Others" ? "700" : "500" }}>
                            [ X ] New Development
                          </span>
                        </label>

                        <label style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "0.85rem", fontWeight: "600", color: "#1e293b", cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="lcProjectNature"
                            value="Others"
                            checked={formData.projectNature === "Others"}
                            onChange={() => handleFieldChange("projectNature", "Others")}
                            style={{ accentColor: "#0284c7", width: "16px", height: "16px", cursor: "pointer" }}
                          />
                          <span style={{ fontWeight: formData.projectNature === "Others" ? "700" : "500" }}>
                            [  ] Others (specify)
                          </span>
                        </label>
                      </div>

                      {formData.projectNature === "Others" && (
                        <div style={{ marginTop: "10px" }}>
                          <input
                            type="text"
                            value={formData.natureOthers || ""}
                            onChange={e => handleFieldChange("natureOthers", e.target.value)}
                            placeholder="Specify project nature (e.g. Renovation / Alteration, Change of Use)"
                            style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1.5px solid #0284c7", fontSize: "0.85rem", background: "#ffffff" }}
                            autoFocus
                          />
                        </div>
                      )}
                    </div>

                    {/* 11. Right Over Land & 12. Project Tenure */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      {/* 11. Right Over Land */}
                      <div style={{
                        padding: "0.85rem",
                        borderRadius: "8px",
                        background: "#f8fafc",
                        border: "1.5px solid #cbd5e1"
                      }}>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
                          11. Right Over Land
                        </label>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#1e293b", cursor: "pointer" }}>
                              <input
                                type="radio"
                                name="lcRightOverLand"
                                value="Owner"
                                checked={formData.rightOverLand !== "Lease" && formData.rightOverLand !== "Others"}
                                onChange={() => handleFieldChange("rightOverLand", "Owner")}
                                style={{ accentColor: "#0284c7", width: "16px", height: "16px", cursor: "pointer" }}
                              />
                              <span>[ X ] Owner</span>
                            </label>

                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#1e293b", cursor: "pointer" }}>
                              <input
                                type="radio"
                                name="lcRightOverLand"
                                value="Others"
                                checked={formData.rightOverLand === "Others"}
                                onChange={() => handleFieldChange("rightOverLand", "Others")}
                                style={{ accentColor: "#0284c7", width: "16px", height: "16px", cursor: "pointer" }}
                              />
                              <span>[  ] Others (specify)</span>
                            </label>
                          </div>

                          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#1e293b", cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="lcRightOverLand"
                              value="Lease"
                              checked={formData.rightOverLand === "Lease"}
                              onChange={() => handleFieldChange("rightOverLand", "Lease")}
                              style={{ accentColor: "#0284c7", width: "16px", height: "16px", cursor: "pointer" }}
                            />
                            <span>[  ] Lease</span>
                          </label>

                          {formData.rightOverLand === "Others" && (
                            <div style={{ marginTop: "6px" }}>
                              <input
                                type="text"
                                value={formData.rightOverLandOthers || ""}
                                onChange={e => handleFieldChange("rightOverLandOthers", e.target.value)}
                                placeholder="Specify land rights (e.g. Usufruct, Special Power of Attorney)"
                                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1.5px solid #0284c7", fontSize: "0.82rem", background: "#ffffff" }}
                                autoFocus
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 12. Project Tenure */}
                      <div style={{
                        padding: "0.85rem",
                        borderRadius: "8px",
                        background: "#f8fafc",
                        border: "1.5px solid #cbd5e1"
                      }}>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
                          12. Project Tenure
                        </label>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#1e293b", cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="lcProjectTenure"
                              value="Permanent"
                              checked={formData.projectTenure !== "Temporary"}
                              onChange={() => handleFieldChange("projectTenure", "Permanent")}
                              style={{ accentColor: "#0284c7", width: "16px", height: "16px", cursor: "pointer" }}
                            />
                            <span>[ X ] Permanent</span>
                          </label>

                          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#1e293b", cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="lcProjectTenure"
                              value="Temporary"
                              checked={formData.projectTenure === "Temporary"}
                              onChange={() => handleFieldChange("projectTenure", "Temporary")}
                              style={{ accentColor: "#0284c7", width: "16px", height: "16px", cursor: "pointer" }}
                            />
                            <span>[  ] Temporary</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* 13. Existing Land Use of the Project Site */}
                    <div style={{
                      padding: "0.85rem",
                      borderRadius: "8px",
                      background: "#f8fafc",
                      border: "1.5px solid #cbd5e1"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#1e293b" }}>
                          13. EXISTING LAND USE OF THE PROJECT SITE
                        </label>
                        <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Matches Box 13 on Locational Clearance</span>
                      </div>

                      {/* Top row & Bottom row choices matching physical PDF */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "6px", marginBottom: "10px" }}>
                        {[
                          { id: "Residential", label: "Residential" },
                          { id: "Commercial", label: "Commercial" },
                          { id: "Others", label: "Others" },
                          { id: "Vacant / Idle", label: "Vacant/Idle" },
                          { id: "Agricultural", label: "Agricultural" },
                          { id: "Institutional", label: "Institutional" },
                          { id: "Industrial", label: "Industrial" },
                        ].map((opt) => (
                          <label
                            key={opt.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "0.82rem",
                              fontWeight: (formData.existingLandUse || "Residential") === opt.id ? "700" : "500",
                              color: "#1e293b",
                              cursor: "pointer",
                              padding: "5px 8px",
                              borderRadius: "6px",
                              background: (formData.existingLandUse || "Residential") === opt.id ? "#e0f2fe" : "#ffffff",
                              border: (formData.existingLandUse || "Residential") === opt.id ? "1.5px solid #0284c7" : "1px solid #e2e8f0"
                            }}
                          >
                            <input
                              type="radio"
                              name="lcExistingLandUse"
                              value={opt.id}
                              checked={(formData.existingLandUse || "Residential") === opt.id}
                              onChange={() => handleFieldChange("existingLandUse", opt.id)}
                              style={{ accentColor: "#0284c7", width: "15px", height: "15px", cursor: "pointer" }}
                            />
                            <span>{(formData.existingLandUse || "Residential") === opt.id ? `[ X ] ${opt.label}` : `[  ] ${opt.label}`}</span>
                          </label>
                        ))}
                      </div>

                      {/* Sub-inputs: Agricultural crop, Others specify, and Tenancy */}
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "0.75rem", paddingTop: "8px", borderTop: "1px dashed #cbd5e1" }}>
                        <div>
                          {formData.existingLandUse === "Agricultural" ? (
                            <div>
                              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#0369a1", marginBottom: "4px" }}>
                                Agricultural (specify crop):
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Rice, Corn, Sugarcane"
                                value={formData.agriculturalCrop || ""}
                                onChange={e => handleFieldChange("agriculturalCrop", e.target.value)}
                                style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1.5px solid #0284c7", fontSize: "0.82rem", background: "#ffffff" }}
                                autoFocus
                              />
                            </div>
                          ) : formData.existingLandUse === "Others" ? (
                            <div>
                              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#0369a1", marginBottom: "4px" }}>
                                Others (specify):
                              </label>
                              <input
                                type="text"
                                placeholder="Specify land use"
                                value={formData.landUseOthers || ""}
                                onChange={e => handleFieldChange("landUseOthers", e.target.value)}
                                style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1.5px solid #0284c7", fontSize: "0.82rem", background: "#ffffff" }}
                                autoFocus
                              />
                            </div>
                          ) : (
                            <div style={{ fontSize: "0.78rem", color: "#64748b", display: "flex", alignItems: "center", height: "100%" }}>
                              Selected classification: <strong style={{ marginLeft: "4px", color: "#0f172a" }}>{formData.existingLandUse || "Residential"}</strong>
                            </div>
                          )}
                        </div>

                        {/* Tenancy status */}
                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                            Tenancy:
                          </label>
                          <div style={{ display: "flex", gap: "1rem", alignItems: "center", height: "34px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: "600", color: "#1e293b", cursor: "pointer" }}>
                              <input
                                type="radio"
                                name="lcIsTenanted"
                                value="Yes"
                                checked={formData.isTenanted === "Yes"}
                                onChange={() => handleFieldChange("isTenanted", "Yes")}
                                style={{ accentColor: "#0284c7", width: "15px", height: "15px", cursor: "pointer" }}
                              />
                              <span>{formData.isTenanted === "Yes" ? "[ X ] Tenanted" : "[  ] Tenanted"}</span>
                            </label>

                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: "600", color: "#1e293b", cursor: "pointer" }}>
                              <input
                                type="radio"
                                name="lcIsTenanted"
                                value="No"
                                checked={formData.isTenanted !== "Yes"}
                                onChange={() => handleFieldChange("isTenanted", "No")}
                                style={{ accentColor: "#0284c7", width: "15px", height: "15px", cursor: "pointer" }}
                              />
                              <span>{formData.isTenanted !== "Yes" ? "[ X ] Not tenanted" : "[  ] Not tenanted"}</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 14. Project Cost (in pesos, write in words and figures) */}
                    <div style={{
                      padding: "0.85rem",
                      borderRadius: "8px",
                      background: "#f8fafc",
                      border: "1.5px solid #cbd5e1"
                    }}>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
                        14. PROJECT COST (in pesos, write in words and figures)
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                            Figures (PHP)
                          </label>
                          <input
                            type="text"
                            value={formData.projectCost || "1,500,000.00"}
                            onChange={e => handleFieldChange("projectCost", e.target.value)}
                            placeholder="e.g. 1,500,000.00"
                            style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff", fontWeight: "600" }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                            Words
                          </label>
                          <input
                            type="text"
                            value={formData.projectCostWords || numberToWordsInPesos(formData.projectCost || "2,500,000.00")}
                            onChange={e => handleFieldChange("projectCostWords", e.target.value)}
                            placeholder="e.g. TWO MILLION FIVE HUNDRED THOUSAND PESOS ONLY"
                            style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 15. Is the project applied for the subject of written notice(s)... */}
                    <div style={{
                      padding: "0.85rem",
                      borderRadius: "8px",
                      background: "#f8fafc",
                      border: "1.5px solid #cbd5e1"
                    }}>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
                        15. IS THE PROJECT APPLIED FOR THE SUBJECT OF WRITTEN NOTICE(S) FROM THIS BOARD OR THE LOCAL GOVT. UNIT (LGU) TO PRESENT OR APPLY FOR LOCATIONAL CLEARANCE(LC)?
                      </label>
                      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "8px" }}>
                        <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="hasWrittenNotice"
                            value="No"
                            checked={formData.hasWrittenNotice !== "Yes"}
                            onChange={() => handleFieldChange("hasWrittenNotice", "No")}
                            style={{ accentColor: "#0284c7" }}
                          />
                          <span>[ X ] No</span>
                        </label>
                        <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="hasWrittenNotice"
                            value="Yes"
                            checked={formData.hasWrittenNotice === "Yes"}
                            onChange={() => handleFieldChange("hasWrittenNotice", "Yes")}
                            style={{ accentColor: "#0284c7" }}
                          />
                          <span>[ ] Yes (Please indicate the following)</span>
                        </label>
                      </div>
                      {formData.hasWrittenNotice === "Yes" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 1fr", gap: "0.5rem", marginTop: "8px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                              Issuing Officer
                            </label>
                            <input
                              type="text"
                              value={formData.noticeOfficer || ""}
                              onChange={e => handleFieldChange("noticeOfficer", e.target.value)}
                              placeholder="e.g. ENGR. MARIO SANTOS"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                              Order in the Notice
                            </label>
                            <input
                              type="text"
                              value={formData.noticeOrder || ""}
                              onChange={e => handleFieldChange("noticeOrder", e.target.value)}
                              placeholder="e.g. COMPLY WITH ZONING CLEARANCE"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                              Date of Notice
                            </label>
                            <input
                              type="text"
                              value={formData.noticeDate || ""}
                              onChange={e => handleFieldChange("noticeDate", e.target.value)}
                              placeholder="e.g. 01/15/2026"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 16. Related Action */}
                    <div style={{
                      padding: "0.85rem",
                      borderRadius: "8px",
                      background: "#f8fafc",
                      border: "1.5px solid #cbd5e1"
                    }}>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
                        16. IS THE PROJECT APPLIED FOR THE SUBJECT OF RELATED ACTION(S) WITH OTHER OFFICES OF THE BOARD AND/OR LOCAL GOVERNMENT UNIT?
                      </label>
                      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "8px" }}>
                        <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="hasRelatedAction"
                            value="No"
                            checked={formData.hasRelatedAction !== "Yes"}
                            onChange={() => handleFieldChange("hasRelatedAction", "No")}
                            style={{ accentColor: "#0284c7" }}
                          />
                          <span>[ X ] No</span>
                        </label>
                        <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="hasRelatedAction"
                            value="Yes"
                            checked={formData.hasRelatedAction === "Yes"}
                            onChange={() => handleFieldChange("hasRelatedAction", "Yes")}
                            style={{ accentColor: "#0284c7" }}
                          />
                          <span>[ ] Yes (Please indicate the following)</span>
                        </label>
                      </div>
                      {formData.hasRelatedAction === "Yes" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 2fr", gap: "0.5rem", marginTop: "8px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                              Office where similar action(s) was filed
                            </label>
                            <input
                              type="text"
                              value={formData.relatedOffice || ""}
                              onChange={e => handleFieldChange("relatedOffice", e.target.value)}
                              placeholder="e.g. MPDO / OBO"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                              Date filed
                            </label>
                            <input
                              type="text"
                              value={formData.relatedDate || ""}
                              onChange={e => handleFieldChange("relatedDate", e.target.value)}
                              placeholder="e.g. 01/20/2026"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                              Actions taken
                            </label>
                            <input
                              type="text"
                              value={formData.relatedActionTaken || ""}
                              onChange={e => handleFieldChange("relatedActionTaken", e.target.value)}
                              placeholder="e.g. APPROVED"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 17. Preferred Mode of Release */}
                    <div style={{
                      padding: "0.85rem",
                      borderRadius: "8px",
                      background: "#f8fafc",
                      border: "1.5px solid #cbd5e1"
                    }}>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
                        17. PREFERRED MODE OR RELEASE OF DECISION
                      </label>
                      <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
                        <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: "600", cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="preferredMode"
                            value="Pick-up"
                            checked={!formData.preferredMode || formData.preferredMode === "Pick-up"}
                            onChange={() => handleFieldChange("preferredMode", "Pick-up")}
                            style={{ accentColor: "#0284c7", width: "15px", height: "15px" }}
                          />
                          <span>{(!formData.preferredMode || formData.preferredMode === "Pick-up") ? "[X]" : "[ ]"} Pick-up</span>
                        </label>

                        <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "#ffffff", padding: "4px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                          <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "#475569" }}>
                            {formData.preferredMode?.startsWith("Mail") ? "[X]" : "[ ]"} By mail, addressed to
                          </span>
                          <label style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.8rem", cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="preferredMode"
                              value="Mail to Applicant"
                              checked={formData.preferredMode === "Mail to Applicant" || formData.preferredMode === "Mail"}
                              onChange={() => handleFieldChange("preferredMode", "Mail to Applicant")}
                              style={{ accentColor: "#0284c7" }}
                            />
                            <span>{(formData.preferredMode === "Mail to Applicant" || formData.preferredMode === "Mail") ? "[X]" : "[ ]"} Applicant</span>
                          </label>
                          <label style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.8rem", cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="preferredMode"
                              value="Mail to Representative"
                              checked={formData.preferredMode === "Mail to Representative"}
                              onChange={() => handleFieldChange("preferredMode", "Mail to Representative")}
                              style={{ accentColor: "#0284c7" }}
                            />
                            <span>{formData.preferredMode === "Mail to Representative" ? "[X]" : "[ ]"} Authorized Representative</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: (selectedForm.id === "DP" || selectedForm.id === "CO" || selectedForm.id === "CC" || selectedForm.id === "CFEI") ? "1fr" : "1fr 1fr", gap: "0.75rem" }}>
                    {selectedForm.id !== "DP" && selectedForm.id !== "CO" && selectedForm.id !== "CC" && selectedForm.id !== "CFEI" && (
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          Scope of Work
                        </label>
                        <select
                          value={formData.scopeOfWork}
                          onChange={e => handleFieldChange("scopeOfWork", e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                        >
                          <option value="New Construction">New Construction</option>
                          <option value="New Installation">New Installation</option>
                          <option value="Annual Inspection">Annual Inspection</option>
                          <option value="Addition">Addition</option>
                          <option value="Repair">Repair</option>
                          <option value="Removal">Removal</option>
                          <option value="Erection">Erection</option>
                          <option value="Alteration">Alteration</option>
                          <option value="Renovation">Renovation</option>
                          <option value="Conversion">Conversion</option>
                          <option value="Moving">Moving</option>
                          <option value="Raising">Raising</option>
                          <option value="Demolition">Demolition</option>
                          <option value="Accessory Building / Structure">Accessory Building / Structure</option>
                          <option value="Others">Others (Specify)</option>
                        </select>
                        {(formData.scopeOfWork || "").toLowerCase().includes("other") && (
                          <div style={{ marginTop: "6px" }}>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#64748b", marginBottom: "2px" }}>
                              Specify Other Scope of Work (Printed on Form Underline)
                            </label>
                            <input
                              type="text"
                              value={formData.scopeOfWorkDetails || formData.scopeOthers || ""}
                              onChange={e => {
                                handleFieldChange("scopeOfWorkDetails", e.target.value);
                                handleFieldChange("scopeOthers", e.target.value);
                              }}
                              placeholder="e.g. Specific details for other scope of work"
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      {selectedForm.id === "EP" ? (
                        <>
                          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#1e40af", marginBottom: "4px" }}>
                            Type of Occupancy (NBC Form E-01 Box 1)
                          </label>
                          <select
                            value={(() => {
                              const cur = formData.occupancyClassificationDetail || "";
                              if ([
                                "A. RESIDENTIAL DWELLING",
                                "B. RESIDENTIAL, HOTEL, APARTMENT",
                                "C. EDUCATION AND RECREATION",
                                "D. INSTITUTIONAL",
                                "H. BUSINESS AND MERCANTILE",
                                "I. INDUSTRIAL",
                                "J. STORAGE AND HAZARDOUS",
                                "K. ASSEMBLY OTHER THAN GROUP I",
                                "E. ASSEMBLY OCCUPANT LOAD 1000 OR MORE",
                                "F. ACCESSORY",
                                "G. OTHERS (SPECIFY)"
                              ].includes(cur)) return cur;
                              const u = cur.toUpperCase();
                              if (u.includes("GROUP B") || u.includes("HOTEL") || u.includes("APARTMENT") || u.includes("TOWNHOUSE") || u.includes("DORMITORY")) return "B. RESIDENTIAL, HOTEL, APARTMENT";
                              if (u.includes("GROUP C") || u.includes("SCHOOL") || u.includes("CHURCH") || (u.includes("RECREATION") && !u.includes("ASSEMBLY"))) return "C. EDUCATION AND RECREATION";
                              if (u.includes("GROUP D") || u.includes("HOSPITAL") || u.includes("INSTITUTIONAL") || u.includes("MEDICAL")) return "D. INSTITUTIONAL";
                              if (u.includes("GROUP E") || u.includes("COMMERCIAL") || u.includes("BANK") || u.includes("STORE") || u.includes("RETAIL") || u.includes("BUSINESS") || u.includes("MERCANTILE")) return "H. BUSINESS AND MERCANTILE";
                              if (u.includes("GROUP F") || (u.includes("INDUSTRIAL") && !u.includes("STORAGE") && !u.includes("HAZARDOUS"))) return "I. INDUSTRIAL";
                              if (u.includes("GROUP G") || u.includes("STORAGE") || u.includes("HAZARDOUS") || u.includes("WAREHOUSE")) return "J. STORAGE AND HAZARDOUS";
                              if (u.includes("GROUP H") || u.includes("< 1,000") || u.includes("< 1000") || u.includes("THEATER") || u.includes("AUDITORIUM")) return "K. ASSEMBLY OTHER THAN GROUP I";
                              if (u.includes("GROUP I") || u.includes("1000") || u.includes("1,000") || u.includes("COLISEUM") || u.includes("CONVENTION CENTER")) return "E. ASSEMBLY OCCUPANT LOAD 1000 OR MORE";
                              if (u.includes("GROUP J") || u.includes("ACCESSORY") || u.includes("CARPORT") || u.includes("GARAGE") || u.includes("SWIMMING POOL")) return "F. ACCESSORY";
                              if (u.includes("OTHER") || u.includes("SPECIFY")) return "G. OTHERS (SPECIFY)";
                              return "A. RESIDENTIAL DWELLING";
                            })()}
                            onChange={e => handleFieldChange("occupancyClassificationDetail", e.target.value)}
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid #93c5fd", fontSize: "0.85rem", background: "#f0f9ff", color: "#1e3a8a", fontWeight: "700" }}
                          >
                            <option value="A. RESIDENTIAL DWELLING">A. RESIDENTIAL DWELLING</option>
                            <option value="B. RESIDENTIAL, HOTEL, APARTMENT">B. RESIDENTIAL, HOTEL, APARTMENT</option>
                            <option value="C. EDUCATION AND RECREATION">C. EDUCATION AND RECREATION</option>
                            <option value="D. INSTITUTIONAL">D. INSTITUTIONAL</option>
                            <option value="H. BUSINESS AND MERCANTILE">H. BUSINESS AND MERCANTILE</option>
                            <option value="I. INDUSTRIAL">I. INDUSTRIAL</option>
                            <option value="J. STORAGE AND HAZARDOUS">J. STORAGE AND HAZARDOUS</option>
                            <option value="K. ASSEMBLY OTHER THAN GROUP I">K. ASSEMBLY OTHER THAN GROUP I</option>
                            <option value="E. ASSEMBLY OCCUPANT LOAD 1000 OR MORE">E. ASSEMBLY OCCUPANT LOAD 1000 OR MORE</option>
                            <option value="F. ACCESSORY">F. ACCESSORY</option>
                            <option value="G. OTHERS (SPECIFY)">G. OTHERS (SPECIFY)</option>
                          </select>
                          {((formData.occupancyClassificationDetail || "").includes("OTHER") || (formData.occupancyClassificationDetail || "").includes("SPECIFY")) && (
                            <div style={{ marginTop: "6px" }}>
                              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#64748b", marginBottom: "2px" }}>
                                Specify Others Occupancy (Printed on Form Underline)
                              </label>
                              <input
                                type="text"
                                value={formData.occupancyOthers || ""}
                                onChange={e => handleFieldChange("occupancyOthers", e.target.value)}
                                placeholder="e.g. SPECIAL WORKSHOP / DATA CENTER"
                                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                            {selectedForm.id === "DP" ? "Use or Character of Occupancy (NBC Form B-08 Box 1)" : "Occupancy Classification Detail (NBCP Rule VII)"}
                          </label>
                          <select
                            value={formData.occupancyClassificationDetail || "Group A - Single Family Dwelling"}
                            onChange={e => handleFieldChange("occupancyClassificationDetail", e.target.value)}
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff", color: "#1e293b", fontWeight: "600" }}
                          >
                            <optgroup label="GROUP A: RESIDENTIAL (DWELLINGS)">
                              <option value="Group A - Single Family Dwelling">Group A - Single Family Dwelling</option>
                              <option value="Group A - Duplex">Group A - Duplex</option>
                              <option value="Group A - Residential R-1, R-2">Group A - Residential R-1, R-2</option>
                              <option value="Group A - Others">Group A - Others</option>
                            </optgroup>
                            <optgroup label="GROUP B: RESIDENTIAL">
                              <option value="Group B - Hotel / Motel">Group B - Hotel / Motel</option>
                              <option value="Group B - Townhouse">Group B - Townhouse</option>
                              <option value="Group B - Dormitory / Boardinghouse">Group B - Dormitory / Boardinghouse</option>
                              <option value="Group B - Residential R-3, R-4, R-5">Group B - Residential R-3, R-4, R-5</option>
                              <option value="Group B - Others">Group B - Others</option>
                            </optgroup>
                            <optgroup label="GROUP C: EDUCATIONAL & RECREATIONAL">
                              <option value="Group C - School Building">Group C - School Building</option>
                              <option value="Group C - School Auditorium / Gymnasium">Group C - School Auditorium / Gymnasium</option>
                              <option value="Group C - Civic Center / Clubhouse">Group C - Civic Center / Clubhouse</option>
                              <option value="Group C - Church, Mosque, Temple, Chapel">Group C - Church, Mosque, Temple, Chapel</option>
                              <option value="Group C - Others">Group C - Others</option>
                            </optgroup>
                            <optgroup label="GROUP D: INSTITUTIONAL">
                              <option value="Group D - Hospital / Medical Facility">Group D - Hospital / Medical Facility</option>
                              <option value="Group D - Home for the Aged">Group D - Home for the Aged</option>
                              <option value="Group D - Government Office">Group D - Government Office</option>
                              <option value="Group D - Others">Group D - Others</option>
                            </optgroup>
                            <optgroup label="GROUP E: COMMERCIAL">
                              <option value="Group E - Bank / Financial">Group E - Bank / Financial</option>
                              <option value="Group E - Store / Retail">Group E - Store / Retail</option>
                              <option value="Group E - Shopping Center / Mall">Group E - Shopping Center / Mall</option>
                              <option value="Group E - Drinking / Dining Establishment">Group E - Drinking / Dining Establishment</option>
                              <option value="Group E - Shop (Tailoring, Salon, etc.)">Group E - Shop (Tailoring, Salon, etc.)</option>
                              <option value="Group E - Others">Group E - Others</option>
                            </optgroup>
                            <optgroup label="GROUP F: LIGHT INDUSTRIAL">
                              <option value="Group F - Factory / Plant (Incombustible)">Group F - Factory / Plant (Incombustible)</option>
                              <option value="Group F - Others">Group F - Others</option>
                            </optgroup>
                            <optgroup label="GROUP G: MEDIUM INDUSTRIAL">
                              <option value="Group G - Storage / Warehouse (Hazardous)">Group G - Storage / Warehouse (Hazardous)</option>
                              <option value="Group G - Factory (Hazardous / Flammable)">Group G - Factory (Hazardous / Flammable)</option>
                              <option value="Group G - Others">Group G - Others</option>
                            </optgroup>
                            <optgroup label="GROUP H: ASSEMBLY (< 1,000)">
                              <option value="Group H - Theater / Auditorium (< 1,000)">Group H - Theater / Auditorium (&lt; 1,000)</option>
                              <option value="Group H - Convention Hall / Bleacher (< 1,000)">Group H - Convention Hall / Bleacher (&lt; 1,000)</option>
                              <option value="Group H - Others (< 1,000)">Group H - Others (&lt; 1,000)</option>
                            </optgroup>
                            <optgroup label="GROUP I: ASSEMBLY (1,000 OR MORE)">
                              <option value="Group I - Coliseum / Sports Complex (1,000+)">Group I - Coliseum / Sports Complex (1,000+)</option>
                              <option value="Group I - Convention Center (1,000+)">Group I - Convention Center (1,000+)</option>
                              <option value="Group I - Others (1,000+)">Group I - Others (1,000+)</option>
                            </optgroup>
                            <optgroup label="GROUP J: (J-1) AGRICULTURAL">
                              <option value="Group J-1 - Barn / Granary / Poultry House">Group J-1 - Barn / Granary / Poultry House</option>
                              <option value="Group J-1 - Piggery / Grain Mill / Silo">Group J-1 - Piggery / Grain Mill / Silo</option>
                              <option value="Group J-1 - Others">Group J-1 - Others</option>
                            </optgroup>
                            <optgroup label="GROUP J: (J-2) ACCESSORIES">
                              <option value="Group J-2 - Private Carport / Garage">Group J-2 - Private Carport / Garage</option>
                              <option value="Group J-2 - Swimming Pool">Group J-2 - Swimming Pool</option>
                              <option value="Group J-2 - Fence over 1.80m">Group J-2 - Fence over 1.80m</option>
                              <option value="Group J-2 - Steel / Concrete Tank">Group J-2 - Steel / Concrete Tank</option>
                              <option value="Group J-2 - Others">Group J-2 - Others</option>
                            </optgroup>
                          </select>
                        </>
                      )}
                    </div>
                </div>
              )}

                {selectedForm.id === "BP" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                        Number of Units
                      </label>
                      <input
                        type="text"
                        value={formData.numberOfUnits || "1"}
                        onChange={e => handleFieldChange("numberOfUnits", e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                        Number of Storeys
                      </label>
                      <input
                        type="text"
                        value={formData.proposedStoreys || "2"}
                        onChange={e => handleFieldChange("proposedStoreys", e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                        Expected Date of Completion
                      </label>
                      <input
                        type="text"
                        value={formData.expectedCompletionDate || ""}
                        onChange={e => handleFieldChange("expectedCompletionDate", e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                      />
                    </div>
                  </div>
                )}

                {/* Box 3: Owner / Applicant E-Signature & Government ID */}
                <div style={{ marginTop: "0.5rem", padding: "1.2rem", borderRadius: "12px", background: "#f8fafc", border: "1.5px solid #cbd5e1", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <div style={{ marginBottom: "0.75rem" }}>
                      <span style={{ fontSize: "0.88rem", fontWeight: "800", color: "#1e293b", display: "block" }}>
                        {selectedForm.id === "LC" ? "Applicant E-Signature (Box 18)" : "Box 3: Owner / Applicant E-Signature & Government ID"}
                      </span>
                      <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                        Draw or upload your authentic e-signature to affix directly over the applicant's printed name ({formData.applicantName || "Applicant"}).
                      </span>
                    </div>

                    {/* Applicant E-Signature Creator */}
                    <SignatureCreator
                      value={formData.applicantSignature}
                      onChange={(sig) => handleFieldChange("applicantSignature", sig)}
                      label={`Applicant E-Signature (Signed over ${formData.applicantName || "Applicant"})`}
                      required
                    />
                  </div>

                  {/* Separate Authorized Representative E-Signature for LC */}
                  {selectedForm.id === "LC" && (
                    <div style={{ paddingTop: "1rem", borderTop: "1.5px solid #e2e8f0" }}>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.88rem", fontWeight: "800", color: "#1e293b" }}>
                            Authorized Representative E-Signature (Box 19)
                          </span>
                          <span style={{
                            fontSize: "0.68rem",
                            fontWeight: "700",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            background: formData.representativeName?.trim() ? "#e0f2fe" : "#f1f5f9",
                            color: formData.representativeName?.trim() ? "#0369a1" : "#64748b"
                          }}>
                            {formData.representativeName?.trim() ? `Appointed: ${formData.representativeName}` : "Optional (Self-Represented)"}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                          {formData.representativeName?.trim()
                            ? `Draw or upload the signature for representative: ${formData.representativeName} (affixed directly over printed name in Box 19).`
                            : "Draw or upload the signature of the authorized representative (affixed on Box 19 if appointed in Box 5)."}
                        </span>
                      </div>

                      <SignatureCreator
                        value={formData.representativeSignature || ""}
                        onChange={(sig) => handleFieldChange("representativeSignature", sig)}
                        label={formData.representativeName?.trim() 
                          ? `Representative E-Signature (Signed over ${formData.representativeName})`
                          : "Representative E-Signature (Box 19)"}
                      />
                    </div>
                  )}

                  {/* Gov't ID, Date Issued, Place Issued - Hidden for Locational Clearance */}
                  {selectedForm.id !== "LC" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "0.5rem", marginTop: "0.75rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#475569", marginBottom: "3px" }}>
                          Gov't Issued ID No.
                        </label>
                        <input
                          type="text"
                          value={formData.govIdNo || "PRC-ID-0098765"}
                          onChange={e => handleFieldChange("govIdNo", e.target.value)}
                          placeholder="e.g. PRC-ID-0098765"
                          style={{ width: "100%", padding: "7px 9px", borderRadius: "7px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#475569", marginBottom: "3px" }}>
                          Date Issued
                        </label>
                        <input
                          type="text"
                          value={formData.govIdDateIssued || "Jan 10, 2024"}
                          onChange={e => handleFieldChange("govIdDateIssued", e.target.value)}
                          placeholder="e.g. Jan 10, 2024"
                          style={{ width: "100%", padding: "7px 9px", borderRadius: "7px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#475569", marginBottom: "3px" }}>
                          Place Issued
                        </label>
                        <input
                          type="text"
                          value={formData.govIdPlaceIssued || "Sto. Tomas"}
                          onChange={e => handleFieldChange("govIdPlaceIssued", e.target.value)}
                          placeholder="e.g. Sto. Tomas"
                          style={{ width: "100%", padding: "7px 9px", borderRadius: "7px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Box 4 Toggle: Lot Owner / Authorized Representative - Hidden for Locational Clearance */}
                  {selectedForm.id !== "LC" && (
                    <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #e2e8f0" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" }}>
                        <input
                          type="checkbox"
                          checked={formData.lotOwnerConsent || false}
                          onChange={e => handleFieldChange("lotOwnerConsent", e.target.checked)}
                          style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                        />
                        <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#334155" }}>
                          Include {selectedForm.id === "AP" || selectedForm.id === "MP" ? "Box 6" : selectedForm.id === "SGP" ? "Box 8" : "Box 4"}: With My Consent (Lot Owner / Authorized Representative)
                        </span>
                      </label>

                      {formData.lotOwnerConsent && (
                        <div style={{ marginTop: "0.75rem", padding: "0.75rem", borderRadius: "8px", background: "#ffffff", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr", gap: "0.5rem" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#475569" }}>
                                Lot Owner / Representative Name
                              </label>
                              <input
                                type="text"
                                value={formData.lotOwnerName || ""}
                                onChange={e => handleFieldChange("lotOwnerName", e.target.value)}
                                placeholder="Full Name"
                                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }}
                              />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#475569" }}>
                                Address
                              </label>
                              <input
                                type="text"
                                value={formData.lotOwnerAddress || ""}
                                onChange={e => handleFieldChange("lotOwnerAddress", e.target.value)}
                                placeholder="Complete Address"
                                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }}
                              />
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#475569" }}>
                                Gov't Issued ID No.
                              </label>
                              <input
                                type="text"
                                value={formData.lotOwnerGovIdNo || ""}
                                onChange={e => handleFieldChange("lotOwnerGovIdNo", e.target.value)}
                                placeholder="ID No."
                                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }}
                              />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#475569" }}>
                                Date Issued
                              </label>
                              <input
                                type="text"
                                value={formData.lotOwnerGovIdDateIssued || ""}
                                onChange={e => handleFieldChange("lotOwnerGovIdDateIssued", e.target.value)}
                                placeholder="e.g. Feb 01, 2024"
                                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }}
                              />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#475569" }}>
                                Place Issued
                              </label>
                              <input
                                type="text"
                                value={formData.lotOwnerGovIdPlaceIssued || ""}
                                onChange={e => handleFieldChange("lotOwnerGovIdPlaceIssued", e.target.value)}
                                placeholder="City / Municipality"
                                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }}
                              />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#475569" }}>
                                Date Signed
                              </label>
                              <input
                                type="text"
                                value={formData.lotOwnerSignedDate || ""}
                                onChange={e => handleFieldChange("lotOwnerSignedDate", e.target.value)}
                                placeholder="e.g. Jan 08, 2026"
                                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }}
                              />
                            </div>
                          </div>

                          <SignatureCreator
                            value={formData.lotOwnerSignature}
                            onChange={(sig) => handleFieldChange("lotOwnerSignature", sig)}
                            label="Lot Owner / Authorized Representative E-Signature"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "specs" && selectedForm.id !== "LC" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Section 2: Shown only for BP, EXP, and DP */}
                {(selectedForm.id === "BP" || selectedForm.id === "EXP" || selectedForm.id === "DP") && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: selectedForm.id === "BP" ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          Lot Area (sq.m.)
                        </label>
                        <input
                          type="text"
                          value={formData.lotArea}
                          onChange={e => handleFieldChange("lotArea", e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          Total Floor Area (sq.m.)
                        </label>
                        <input
                          type="text"
                          value={formData.floorArea}
                          onChange={e => handleFieldChange("floorArea", e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                          No. of Storeys
                        </label>
                        <input
                          type="text"
                          value={formData.proposedStoreys}
                          onChange={e => handleFieldChange("proposedStoreys", e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                        />
                      </div>
                      {selectedForm.id === "BP" && (
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                            Number of Units
                          </label>
                          <input
                            type="text"
                            value={formData.numberOfUnits || "1"}
                            onChange={e => handleFieldChange("numberOfUnits", e.target.value)}
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                        {selectedForm.id === "BP" ? "TOTAL ESTIMATED COST (PHP)" : "Total Estimated Project Cost (PHP)"}
                      </label>
                      <input
                        type="text"
                        value={formData.projectCost}
                        onChange={e => handleFieldChange("projectCost", e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "700", color: "#047857" }}
                      />
                    </div>
                  </div>
                )}

                {/* Specific form fields depending on active form */}
                {selectedForm.id === "SP" ? (
                  <div style={{ marginTop: "0.5rem", padding: "1.25rem", borderRadius: "12px", background: "#f8fafc", border: "1.5px dashed #cbd5e1", textAlign: "center" }}>
                    <p style={{ margin: "0 0 0.4rem 0", fontSize: "0.85rem", fontWeight: "700", color: "#334155" }}>
                      NBC Form S-01 Box 2: Nature of Civil/Structural Works
                    </p>
                    <p style={{ margin: 0, fontSize: "0.76rem", color: "#64748b" }}>
                      Box 2 is kept clean on the official permit in compliance with municipal building guidelines. Please navigate to <strong>3. Engineers & Credentials</strong> to view Civil Engineer Box 3 & Box 4 certifications and Box 5 / Box 6 signatures.
                    </p>
                  </div>
                ) : (
                  <div style={{ marginTop: "0.5rem", padding: "1rem", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.88rem", fontWeight: "800", color: "#1e293b" }}>
                      Form-Specific Technical Parameters ({selectedForm.code})
                    </h4>

                  {selectedForm.id === "BP" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#64748b" }}>Building Cost</label>
                          <input type="text" value={formData.costBuilding || ""} onChange={e => handleFieldChange("costBuilding", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#64748b" }}>Electrical Cost</label>
                          <input type="text" value={formData.costElectrical || ""} onChange={e => handleFieldChange("costElectrical", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#64748b" }}>Plumbing Cost</label>
                          <input type="text" value={formData.costPlumbing || ""} onChange={e => handleFieldChange("costPlumbing", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#64748b" }}>Mechanical Cost</label>
                          <input type="text" value={formData.costMechanical || ""} onChange={e => handleFieldChange("costMechanical", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#64748b" }}>Electronics Cost</label>
                          <input type="text" value={formData.costElectronics || ""} onChange={e => handleFieldChange("costElectronics", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#64748b" }}>Cost of Equipment Installed</label>
                          <input type="text" value={formData.costEquipment || ""} onChange={e => handleFieldChange("costEquipment", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#64748b" }}>Expected Date of Completion</label>
                        <input type="text" value={formData.expectedCompletionDate || ""} onChange={e => handleFieldChange("expectedCompletionDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                      </div>
                    </div>
                  )}

                  {selectedForm.id === "AP" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {/* Box 2.2: Percentage of Site Occupancy */}
                      <div style={{ padding: "0.75rem", borderRadius: "8px", background: "#f1f5f9", border: "1px solid #cbd5e1" }}>
                        <span style={{ display: "block", fontSize: "0.78rem", fontWeight: "800", color: "#1e293b", marginBottom: "6px", textTransform: "uppercase" }}>
                          2. PERCENTAGE OF SITE OCCUPANCY
                        </span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#64748b" }}>PERCENTAGE OF BUILDING FOOTPRINT</label>
                            <input type="text" value={formData.percentBuildingFootprint || ""} onChange={e => handleFieldChange("percentBuildingFootprint", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#64748b" }}>PERCENTAGE OF IMPERVIOUS SURFACE AREA</label>
                            <input type="text" value={formData.percentImperviousSurface || ""} onChange={e => handleFieldChange("percentImperviousSurface", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#64748b" }}>PERCENTAGE OF UNPAVED SURFACE AREA</label>
                            <input type="text" value={formData.percentUnpavedSurface || ""} onChange={e => handleFieldChange("percentUnpavedSurface", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#64748b" }}>OTHERS (Specify)</label>
                            <input type="text" placeholder="e.g. Lawn / Landscaping" value={formData.percentSiteOccupancyOthers || ""} onChange={e => handleFieldChange("percentSiteOccupancyOthers", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>
                      </div>

                      {/* Box 2.3: Conformance to Fire Code */}
                      <div style={{ padding: "0.85rem", borderRadius: "8px", background: "#f1f5f9", border: "1px solid #cbd5e1" }}>
                        <span style={{ display: "block", fontSize: "0.78rem", fontWeight: "800", color: "#1e293b", marginBottom: "8px", textTransform: "uppercase" }}>
                          3. CONFORMANCE TO FIRE CODE OF THE PHILIPPINES (P.D. 1185)
                        </span>
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.3fr 1.1fr", gap: "1rem", alignItems: "start" }}>
                          {/* Column 1 */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                              <input type="checkbox" checked={formData.fireCodeExitDoors !== false} onChange={e => handleFieldChange("fireCodeExitDoors", e.target.checked)} />
                              NUMBER AND WIDTH OF EXIT DOORS
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                              <input type="checkbox" checked={formData.fireCodeCorridors !== false} onChange={e => handleFieldChange("fireCodeCorridors", e.target.checked)} />
                              WIDTH OF CORRIDORS
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                              <input type="checkbox" checked={formData.fireCodeDistanceExits !== false} onChange={e => handleFieldChange("fireCodeDistanceExits", e.target.checked)} />
                              DISTANCE TO FIRE EXITS
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                              <input type="checkbox" checked={formData.fireCodeAccessStreet !== false} onChange={e => handleFieldChange("fireCodeAccessStreet", e.target.checked)} />
                              ACCESS TO PUBLIC STREET
                            </label>
                          </div>

                          {/* Column 2 */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                              <input type="checkbox" checked={formData.fireCodeFireWalls !== false} onChange={e => handleFieldChange("fireCodeFireWalls", e.target.checked)} />
                              FIRE WALLS
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                              <input type="checkbox" checked={!!formData.fireCodeFireFighting} onChange={e => handleFieldChange("fireCodeFireFighting", e.target.checked)} />
                              FIRE FIGHTING AND SAFETY FACILITIES
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                              <input type="checkbox" checked={formData.fireCodeSmokeDetectors !== false} onChange={e => handleFieldChange("fireCodeSmokeDetectors", e.target.checked)} />
                              SMOKE DETECTORS
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                              <input type="checkbox" checked={formData.fireCodeEmergencyLights !== false} onChange={e => handleFieldChange("fireCodeEmergencyLights", e.target.checked)} />
                              EMERGENCY LIGHTS
                            </label>
                          </div>

                          {/* Column 3 */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                              <input type="checkbox" checked={Boolean(formData.fireCodeOthers)} onChange={e => handleFieldChange("fireCodeOthers", e.target.checked ? "Compliant with BFP standards" : "")} />
                              OTHERS (Specify)
                            </label>
                            <input
                              type="text"
                              placeholder="Specify other fire safety compliance..."
                              value={formData.fireCodeOthers || ""}
                              onChange={e => handleFieldChange("fireCodeOthers", e.target.value)}
                              style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.78rem" }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Architectural Specifications */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Architectural Style</label>
                          <input type="text" value={formData.architecturalStyle || ""} onChange={e => handleFieldChange("architecturalStyle", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Roofing Spec</label>
                          <input type="text" value={formData.roofingMaterial || ""} onChange={e => handleFieldChange("roofingMaterial", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Doors Spec</label>
                          <input type="text" value={formData.doorsSpec || ""} onChange={e => handleFieldChange("doorsSpec", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Windows Spec</label>
                          <input type="text" value={formData.windowsSpec || ""} onChange={e => handleFieldChange("windowsSpec", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                      </div>
                    </div>
                  )}


                  {selectedForm.id === "EP" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Connected Load</label>
                          <input type="text" value={formData.electricalConnectedLoad || ""} onChange={e => handleFieldChange("electricalConnectedLoad", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Service Voltage</label>
                          <input type="text" value={formData.electricalVoltage || ""} onChange={e => handleFieldChange("electricalVoltage", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Main Breaker</label>
                          <input type="text" value={formData.mainBreaker || ""} onChange={e => handleFieldChange("mainBreaker", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Branch Circuits Count</label>
                          <input type="text" value={formData.branchCircuitsCount || ""} onChange={e => handleFieldChange("branchCircuitsCount", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                      </div>

                      {/* Schedule of Outlets (Box 1: Number of Outlets) */}
                      <div style={{ padding: "0.85rem 1rem", borderRadius: "10px", background: "#f8fafc", border: "1.5px solid #e2e8f0" }}>
                        <div style={{ fontSize: "0.74rem", fontWeight: "800", color: "#1e40af", textTransform: "uppercase", marginBottom: "0.6rem" }}>
                          Box 1: Number of Outlets
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>
                              Lighting Outlets (LIGHT)
                            </label>
                            <input
                              type="text"
                              value={formData.lightingOutletsCount || ""}
                              onChange={e => handleFieldChange("lightingOutletsCount", e.target.value)}
                              placeholder="28"
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>
                              Convenience (CONVENIENCE/RECEPTACLE)
                            </label>
                            <input
                              type="text"
                              value={formData.convenienceOutletsCount || ""}
                              onChange={e => handleFieldChange("convenienceOutletsCount", e.target.value)}
                              placeholder="24"
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>
                              Aircon Outlets (SPO, AIRCON)
                            </label>
                            <input
                              type="text"
                              value={formData.acuOutletsCount || ""}
                              onChange={e => handleFieldChange("acuOutletsCount", e.target.value)}
                              placeholder="4"
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>
                              Cooking Unit (SPO, COOKING UNIT)
                            </label>
                            <input
                              type="text"
                              value={formData.cookingUnitOutletsCount || ""}
                              onChange={e => handleFieldChange("cookingUnitOutletsCount", e.target.value)}
                              placeholder="1"
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>
                              Water Heater (SPO, WATER HEATER)
                            </label>
                            <input
                              type="text"
                              value={formData.waterHeaterOutletsCount || ""}
                              onChange={e => handleFieldChange("waterHeaterOutletsCount", e.target.value)}
                              placeholder="2"
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>
                              Water Pump (SPO, WATER PUMP)
                            </label>
                            <input
                              type="text"
                              value={formData.waterPumpOutletsCount || ""}
                              onChange={e => handleFieldChange("waterPumpOutletsCount", e.target.value)}
                              placeholder="1"
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Schedule of Equipment / Wiring Devices (Box 1: Number of Equipment/Wiring Devices) */}
                      <div style={{ padding: "0.85rem 1rem", borderRadius: "10px", background: "#f8fafc", border: "1.5px solid #e2e8f0" }}>
                        <div style={{ fontSize: "0.74rem", fontWeight: "800", color: "#1e40af", textTransform: "uppercase", marginBottom: "0.6rem" }}>
                          Box 1: Number of Equipment / Wiring Devices
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>
                              Toggle Switch (TOGGGLE SWITCH)
                            </label>
                            <input
                              type="text"
                              value={formData.toggleSwitchCount || ""}
                              onChange={e => handleFieldChange("toggleSwitchCount", e.target.value)}
                              placeholder="15"
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>
                              Bell / Buzzer (BELL/BUZZER)
                            </label>
                            <input
                              type="text"
                              value={formData.bellBuzzerCount || ""}
                              onChange={e => handleFieldChange("bellBuzzerCount", e.target.value)}
                              placeholder="1"
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>
                              Push Buttons (PUSH BUTTONS)
                            </label>
                            <input
                              type="text"
                              value={formData.pushButtonsCount || ""}
                              onChange={e => handleFieldChange("pushButtonsCount", e.target.value)}
                              placeholder="1"
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>
                              FA Detector (FA DETECTOR)
                            </label>
                            <input
                              type="text"
                              value={formData.faDetectorCount || ""}
                              onChange={e => handleFieldChange("faDetectorCount", e.target.value)}
                              placeholder="2"
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>
                              Others (SEE ATTACHED LIST)
                            </label>
                            <input
                              type="text"
                              value={formData.otherWiringDevicesCount || ""}
                              onChange={e => handleFieldChange("otherWiringDevicesCount", e.target.value)}
                              placeholder="1"
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedForm.id === "PL" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div style={{ gridColumn: "span 2" }}>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Scope of Work (NBC Form P-01)</label>
                        <select
                          value={formData.sanitaryScopeOfWork || "NEW INSTALLATION"}
                          onChange={e => handleFieldChange("sanitaryScopeOfWork", e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                        >
                          <option value="NEW INSTALLATION">NEW INSTALLATION</option>
                          <option value="ADDITION OF">ADDITION OF</option>
                          <option value="REPAIR OF">REPAIR OF</option>
                          <option value="REMOVAL OF">REMOVAL OF</option>
                          <option value="OTHERS">OTHERS (SPECIFY)</option>
                        </select>
                      </div>
                      {["ADDITION OF", "REPAIR OF", "REMOVAL OF"].includes(formData.sanitaryScopeOfWork || "") && (
                        <div style={{ gridColumn: "span 2" }}>
                          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#64748b" }}>Specify Scope Details</label>
                          <input
                            type="text"
                            value={formData.sanitaryScopeDetails || ""}
                            onChange={e => handleFieldChange("sanitaryScopeDetails", e.target.value)}
                            placeholder="e.g. 2 Water Closets & Septic Line"
                            style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                          />
                        </div>
                      )}
                      {(formData.sanitaryScopeOfWork === "OTHERS") && (
                        <>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#64748b" }}>Others Action</label>
                            <input
                              type="text"
                              value={formData.sanitaryScopeOthersAction || ""}
                              onChange={e => handleFieldChange("sanitaryScopeOthersAction", e.target.value)}
                              placeholder="e.g. UPGRADING"
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#64748b" }}>Others OF System</label>
                            <input
                              type="text"
                              value={formData.sanitaryScopeOthersTarget || ""}
                              onChange={e => handleFieldChange("sanitaryScopeOthersTarget", e.target.value)}
                              placeholder="e.g. GREASE TRAP"
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                            />
                          </div>
                        </>
                      )}
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Water Source</label>
                        <input type="text" value={formData.waterSupplySource || ""} onChange={e => handleFieldChange("waterSupplySource", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Sewage System</label>
                        <input type="text" value={formData.sewageSystem || ""} onChange={e => handleFieldChange("sewageSystem", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div style={{ gridColumn: "span 2" }}>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Septic Tank Dimensions</label>
                        <input type="text" value={formData.septicTankDimensions || ""} onChange={e => handleFieldChange("septicTankDimensions", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                    </div>

                    {/* FIXTURES TO BE INSTALLED Schedule (NBC Form P-01 Box 1) */}
                    <div style={{ marginTop: "1rem", border: "1.5px solid #cbd5e1", borderRadius: "10px", padding: "12px", background: "#ffffff" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#0e7490", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                          FIXTURES TO BE INSTALLED (NBC Form P-01 Box 1)
                        </span>
                        <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "#0891b2", background: "#ecfeff", border: "1px solid #a5f3fc", padding: "2px 8px", borderRadius: "999px" }}>
                          Total: {
                            [
                              "waterClosetsCount", "floorDrainsCount", "lavatoriesCount", "kitchenSinksCount", "faucetsCount", "showersCount",
                              "waterMeterCount", "greaseTrapCount", "bathTubsCount", "slopSinkCount", "urinalCount", "airConditioningCount", "waterTankCount",
                              "bidetCount", "laundryTraysCount", "dentalCuspidorCount", "electricalHeaterCount", "waterBoilerCount", "drinkingFountainCount",
                              "barSinkCount", "sodaFountainCount", "laboratorySinkCount", "sterilizerCount", "swimmingPoolCount", "othersFixtureCount"
                            ].reduce((acc, k) => acc + (parseInt((formData as any)[k] || "0", 10) || 0), 0)
                          } Units
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        {/* LEFT COLUMN */}
                        <div style={{ border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "44px 58px 58px 1fr", background: "#f1f5f9", borderBottom: "1px solid #cbd5e1", padding: "4px 6px", fontSize: "0.65rem", fontWeight: "800", color: "#334155", textAlign: "center", alignItems: "center" }}>
                            <span>QTY</span>
                            <span style={{ lineHeight: "1.1" }}>NEW<br/>FIX.</span>
                            <span style={{ lineHeight: "1.1" }}>EXIST.<br/>FIX.</span>
                            <span style={{ textAlign: "left", paddingLeft: "6px" }}>KIND OF FIXTURES</span>
                          </div>
                          <div>
                            {([
                              { key: "waterClosetsCount", label: "WATER CLOSET" },
                              { key: "floorDrainsCount", label: "FLOOR DRAIN" },
                              { key: "lavatoriesCount", label: "LAVATORIES" },
                              { key: "kitchenSinksCount", label: "KITCHEN SINK" },
                              { key: "faucetsCount", label: "FAUCET" },
                              { key: "showersCount", label: "SHOWER HEAD" },
                              { key: "waterMeterCount", label: "WATER METER" },
                              { key: "greaseTrapCount", label: "GREASE TRAP" },
                              { key: "bathTubsCount", label: "BATH TUBS" },
                              { key: "slopSinkCount", label: "SLOP SINK" },
                              { key: "urinalCount", label: "URINAL" },
                              { key: "airConditioningCount", label: "AIR CONDITIONING UNIT" },
                              { key: "waterTankCount", label: "WATER TANK/RESERVOIR" },
                            ] as { key: keyof UnifiedPermitFormData; label: string }[]).map((fix, idx) => {
                              const val = (formData as any)[fix.key] || "";
                              const qtyNum = parseInt(val, 10) || 0;
                              const hasQty = qtyNum > 0;
                              const status = formData.fixtureStatusMap?.[fix.key] || (hasQty ? "new" : "");
                              const isNew = hasQty && status === "new";
                              const isExist = hasQty && status === "existing";

                              return (
                                <div key={fix.key} style={{ display: "grid", gridTemplateColumns: "44px 58px 58px 1fr", alignItems: "center", padding: "3px 6px", borderBottom: idx < 12 ? "1px solid #f1f5f9" : "none", background: hasQty ? "#ecfeff33" : (idx % 2 === 0 ? "#f8fafc" : "#ffffff") }}>
                                  <div style={{ display: "flex", justifyContent: "center" }}>
                                    <input
                                      type="number"
                                      min="0"
                                      value={val}
                                      onChange={e => {
                                        const v = e.target.value;
                                        handleFieldChange(fix.key, v);
                                        if ((parseInt(v, 10) || 0) > 0 && !formData.fixtureStatusMap?.[fix.key]) {
                                          handleFieldChange("fixtureStatusMap", { ...(formData.fixtureStatusMap || {}), [fix.key]: "new" });
                                        }
                                      }}
                                      placeholder="—"
                                      style={{ width: "38px", height: "24px", padding: "1px 2px", textAlign: "center", fontWeight: hasQty ? "800" : "500", fontSize: "0.78rem", border: hasQty ? "1.5px solid #0891b2" : "1px solid #cbd5e1", borderRadius: "4px" }}
                                    />
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "center" }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newMap = { ...(formData.fixtureStatusMap || {}) };
                                        if (isNew) {
                                          delete newMap[fix.key];
                                        } else {
                                          newMap[fix.key] = "new";
                                          if (!hasQty) handleFieldChange(fix.key, "1");
                                        }
                                        handleFieldChange("fixtureStatusMap", newMap);
                                      }}
                                      style={{ width: "18px", height: "18px", borderRadius: "3px", border: isNew ? "1.5px solid #0891b2" : "1px solid #cbd5e1", background: isNew ? "#0891b2" : "#ffffff", color: isNew ? "#ffffff" : "transparent", fontSize: "0.7rem", fontWeight: "900", cursor: "pointer", padding: 0 }}
                                    >
                                      {isNew ? "X" : ""}
                                    </button>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "center" }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newMap = { ...(formData.fixtureStatusMap || {}) };
                                        if (isExist) {
                                          delete newMap[fix.key];
                                        } else {
                                          newMap[fix.key] = "existing";
                                          if (!hasQty) handleFieldChange(fix.key, "1");
                                        }
                                        handleFieldChange("fixtureStatusMap", newMap);
                                      }}
                                      style={{ width: "18px", height: "18px", borderRadius: "3px", border: isExist ? "1.5px solid #d97706" : "1px solid #cbd5e1", background: isExist ? "#d97706" : "#ffffff", color: isExist ? "#ffffff" : "transparent", fontSize: "0.7rem", fontWeight: "900", cursor: "pointer", padding: 0 }}
                                    >
                                      {isExist ? "X" : ""}
                                    </button>
                                  </div>
                                  <span style={{ fontSize: "0.72rem", fontWeight: hasQty ? "700" : "500", color: hasQty ? "#0f172a" : "#64748b", paddingLeft: "6px" }}>
                                    [ ] {fix.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "44px 58px 58px 1fr", alignItems: "center", padding: "5px 6px", background: "#f1f5f9", borderTop: "1px solid #cbd5e1", fontSize: "0.72rem", fontWeight: "800", color: "#0e7490" }}>
                            <span style={{ textAlign: "center", borderBottom: "1.5px solid #0891b2" }}>
                              {["waterClosetsCount", "floorDrainsCount", "lavatoriesCount", "kitchenSinksCount", "faucetsCount", "showersCount", "waterMeterCount", "greaseTrapCount", "bathTubsCount", "slopSinkCount", "urinalCount", "airConditioningCount", "waterTankCount"].reduce((acc, k) => acc + (parseInt((formData as any)[k] || "0", 10) || 0), 0)}
                            </span>
                            <span></span>
                            <span></span>
                            <span style={{ paddingLeft: "6px", color: "#334155" }}>TOTAL</span>
                          </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div style={{ border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "44px 58px 58px 1fr", background: "#f1f5f9", borderBottom: "1px solid #cbd5e1", padding: "4px 6px", fontSize: "0.65rem", fontWeight: "800", color: "#334155", textAlign: "center", alignItems: "center" }}>
                            <span>QTY</span>
                            <span style={{ lineHeight: "1.1" }}>NEW<br/>FIX.</span>
                            <span style={{ lineHeight: "1.1" }}>EXIST.<br/>FIX.</span>
                            <span style={{ textAlign: "left", paddingLeft: "6px" }}>KIND OF FIXTURES</span>
                          </div>
                          <div>
                            {([
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
                            ] as { key: keyof UnifiedPermitFormData; label: string }[]).map((fix, idx) => {
                              const val = (formData as any)[fix.key] || "";
                              const qtyNum = parseInt(val, 10) || 0;
                              const hasQty = qtyNum > 0;
                              const status = formData.fixtureStatusMap?.[fix.key] || (hasQty ? "new" : "");
                              const isNew = hasQty && status === "new";
                              const isExist = hasQty && status === "existing";

                              return (
                                <div key={fix.key} style={{ display: "grid", gridTemplateColumns: "44px 58px 58px 1fr", alignItems: "center", padding: "3px 6px", borderBottom: idx < 11 ? "1px solid #f1f5f9" : "none", background: hasQty ? "#ecfeff33" : (idx % 2 === 0 ? "#f8fafc" : "#ffffff") }}>
                                  <div style={{ display: "flex", justifyContent: "center" }}>
                                    <input
                                      type="number"
                                      min="0"
                                      value={val}
                                      onChange={e => {
                                        const v = e.target.value;
                                        handleFieldChange(fix.key, v);
                                        if ((parseInt(v, 10) || 0) > 0 && !formData.fixtureStatusMap?.[fix.key]) {
                                          handleFieldChange("fixtureStatusMap", { ...(formData.fixtureStatusMap || {}), [fix.key]: "new" });
                                        }
                                      }}
                                      placeholder="—"
                                      style={{ width: "38px", height: "24px", padding: "1px 2px", textAlign: "center", fontWeight: hasQty ? "800" : "500", fontSize: "0.78rem", border: hasQty ? "1.5px solid #0891b2" : "1px solid #cbd5e1", borderRadius: "4px" }}
                                    />
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "center" }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newMap = { ...(formData.fixtureStatusMap || {}) };
                                        if (isNew) {
                                          delete newMap[fix.key];
                                        } else {
                                          newMap[fix.key] = "new";
                                          if (!hasQty) handleFieldChange(fix.key, "1");
                                        }
                                        handleFieldChange("fixtureStatusMap", newMap);
                                      }}
                                      style={{ width: "18px", height: "18px", borderRadius: "3px", border: isNew ? "1.5px solid #0891b2" : "1px solid #cbd5e1", background: isNew ? "#0891b2" : "#ffffff", color: isNew ? "#ffffff" : "transparent", fontSize: "0.7rem", fontWeight: "900", cursor: "pointer", padding: 0 }}
                                    >
                                      {isNew ? "X" : ""}
                                    </button>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "center" }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newMap = { ...(formData.fixtureStatusMap || {}) };
                                        if (isExist) {
                                          delete newMap[fix.key];
                                        } else {
                                          newMap[fix.key] = "existing";
                                          if (!hasQty) handleFieldChange(fix.key, "1");
                                        }
                                        handleFieldChange("fixtureStatusMap", newMap);
                                      }}
                                      style={{ width: "18px", height: "18px", borderRadius: "3px", border: isExist ? "1.5px solid #d97706" : "1px solid #cbd5e1", background: isExist ? "#d97706" : "#ffffff", color: isExist ? "#ffffff" : "transparent", fontSize: "0.7rem", fontWeight: "900", cursor: "pointer", padding: 0 }}
                                    >
                                      {isExist ? "X" : ""}
                                    </button>
                                  </div>
                                  <div style={{ paddingLeft: "6px" }}>
                                    <span style={{ fontSize: "0.72rem", fontWeight: hasQty ? "700" : "500", color: hasQty ? "#0f172a" : "#64748b" }}>
                                      [ ] {fix.label}
                                    </span>
                                    {fix.key === "othersFixtureCount" && (
                                      <input
                                        type="text"
                                        value={formData.othersFixtureName || ""}
                                        onChange={e => handleFieldChange("othersFixtureName", e.target.value)}
                                        placeholder="Specify name"
                                        style={{ display: "block", width: "95%", marginTop: "2px", padding: "1px 4px", borderRadius: "3px", border: "1px solid #cbd5e1", fontSize: "0.68rem" }}
                                      />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "44px 58px 58px 1fr", alignItems: "center", padding: "5px 6px", background: "#f1f5f9", borderTop: "1px solid #cbd5e1", fontSize: "0.72rem", fontWeight: "800", color: "#0e7490" }}>
                            <span style={{ textAlign: "center", borderBottom: "1.5px solid #0891b2" }}>
                              {["bidetCount", "laundryTraysCount", "dentalCuspidorCount", "electricalHeaterCount", "waterBoilerCount", "drinkingFountainCount", "barSinkCount", "sodaFountainCount", "laboratorySinkCount", "sterilizerCount", "swimmingPoolCount", "othersFixtureCount"].reduce((acc, k) => acc + (parseInt((formData as any)[k] || "0", 10) || 0), 0)}
                            </span>
                            <span></span>
                            <span></span>
                            <span style={{ paddingLeft: "6px", color: "#334155" }}>TOTAL</span>
                          </div>
                        </div>
                      </div>

                      {/* Systems Checkboxes */}
                      <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "14px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "700", color: "#334155", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={formData.waterDistributionSystem !== false}
                            onChange={e => handleFieldChange("waterDistributionSystem", e.target.checked)}
                            style={{ accentColor: "#0891b2" }}
                          />
                          WATER DISTRIBUTION SYSTEM
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "700", color: "#334155", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={formData.sanitarySewerSystem !== false}
                            onChange={e => handleFieldChange("sanitarySewerSystem", e.target.checked)}
                            style={{ accentColor: "#0891b2" }}
                          />
                          SANITARY SEWER SYSTEM
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "700", color: "#334155", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={formData.stormDrainageSystem === true}
                            onChange={e => handleFieldChange("stormDrainageSystem", e.target.checked)}
                            style={{ accentColor: "#0891b2" }}
                          />
                          STORM DRAINAGE SYSTEM
                        </label>
                      </div>

                      {/* WATER SUPPLY & SYSTEM SUPPLY / DISPOSAL (NBC Form P-01 Box 1 Bottom) */}
                      <div style={{ marginTop: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "12px", background: "#ffffff" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                          <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#0e7490", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            WATER SUPPLY & SYSTEM SUPPLY / DISPOSAL
                          </span>
                          <span style={{ fontSize: "0.68rem", fontWeight: "700", background: "#ecfeff", color: "#0891b2", border: "1px solid #a5f3fc", padding: "2px 8px", borderRadius: "4px" }}>
                            NBC Form P-01 Box 1
                          </span>
                        </div>

                        {/* Two-Column Grid: Water Supply (Left) & System Supply (Right) */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "10px", marginBottom: "12px" }}>
                          
                          {/* WATER SUPPLY */}
                          <div style={{ border: "1px solid #cbd5e1", borderRadius: "6px", padding: "10px", background: "#f8fafc" }}>
                            <div style={{ borderBottom: "1px solid #cbd5e1", paddingBottom: "4px", marginBottom: "8px" }}>
                              <span style={{ fontSize: "0.74rem", fontWeight: "800", color: "#334155", textTransform: "uppercase" }}>
                                WATER SUPPLY
                              </span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {[
                                { id: "SHALLOW WELL", label: "SHALLOW WELL" },
                                { id: "DEEPWELL & PUMP SET", label: "DEEPWELL & PUMP SET" },
                                { id: "CITY/MUNICIPAL WATER SYSTEM", label: "CITY/MUNICIPAL WATER SYSTEM" },
                                { id: "OTHERS", label: "OTHERS" },
                              ].map(opt => {
                                const isSelected = (formData.waterSupplyType || "CITY/MUNICIPAL WATER SYSTEM") === opt.id;
                                return (
                                  <div key={opt.id}>
                                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.74rem", fontWeight: isSelected ? "700" : "500", color: isSelected ? "#0e7490" : "#475569" }}>
                                      <input
                                        type="radio"
                                        name="adminWaterSupplyRadio"
                                        checked={isSelected}
                                        onChange={() => handleFieldChange("waterSupplyType", opt.id)}
                                        style={{ accentColor: "#0891b2", cursor: "pointer" }}
                                      />
                                      [ ] {opt.label}
                                    </label>
                                    {opt.id === "OTHERS" && isSelected && (
                                      <input
                                        type="text"
                                        value={formData.waterSupplyOthers || ""}
                                        onChange={e => handleFieldChange("waterSupplyOthers", e.target.value)}
                                        placeholder="Specify water supply"
                                        style={{ marginTop: "4px", marginLeft: "20px", width: "calc(100% - 20px)", padding: "3px 6px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "0.72rem", background: "#ffffff" }}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* SYSTEM SUPPLY / DISPOSAL */}
                          <div style={{ border: "1px solid #cbd5e1", borderRadius: "6px", padding: "10px", background: "#f8fafc" }}>
                            <div style={{ borderBottom: "1px solid #cbd5e1", paddingBottom: "4px", marginBottom: "8px" }}>
                              <span style={{ fontSize: "0.74rem", fontWeight: "800", color: "#334155", textTransform: "uppercase" }}>
                                SYSTEM SUPPLY / DISPOSAL
                              </span>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.72rem", fontWeight: formData.wasteWaterTreatmentPlant ? "700" : "500", color: formData.wasteWaterTreatmentPlant ? "#0e7490" : "#475569" }}>
                                  <input
                                    type="checkbox"
                                    checked={formData.wasteWaterTreatmentPlant === true}
                                    onChange={e => handleFieldChange("wasteWaterTreatmentPlant", e.target.checked)}
                                    style={{ accentColor: "#0891b2" }}
                                  />
                                  [ ] WASTE WATER TREATMENT PLANT
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.72rem", fontWeight: formData.septicVaultImhoffTank !== false ? "700" : "500", color: formData.septicVaultImhoffTank !== false ? "#0e7490" : "#475569" }}>
                                  <input
                                    type="checkbox"
                                    checked={formData.septicVaultImhoffTank !== false}
                                    onChange={e => handleFieldChange("septicVaultImhoffTank", e.target.checked)}
                                    style={{ accentColor: "#0891b2" }}
                                  />
                                  [X] SEPTIC VAULT/IMHOFF TANK
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.72rem", fontWeight: formData.subsurfaceSandFilter ? "700" : "500", color: formData.subsurfaceSandFilter ? "#0e7490" : "#475569" }}>
                                  <input
                                    type="checkbox"
                                    checked={formData.subsurfaceSandFilter === true}
                                    onChange={e => handleFieldChange("subsurfaceSandFilter", e.target.checked)}
                                    style={{ accentColor: "#0891b2" }}
                                  />
                                  [ ] SUBSURFACE SAND FILTER
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.72rem", fontWeight: formData.sanitarySewerConnection ? "700" : "500", color: formData.sanitarySewerConnection ? "#0e7490" : "#475569" }}>
                                  <input
                                    type="checkbox"
                                    checked={formData.sanitarySewerConnection === true}
                                    onChange={e => handleFieldChange("sanitarySewerConnection", e.target.checked)}
                                    style={{ accentColor: "#0891b2" }}
                                  />
                                  [ ] SANITARY SEWER CONNECTION
                                </label>
                              </div>

                              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.72rem", fontWeight: formData.surfaceDrainage ? "700" : "500", color: formData.surfaceDrainage ? "#0e7490" : "#475569" }}>
                                  <input
                                    type="checkbox"
                                    checked={formData.surfaceDrainage === true}
                                    onChange={e => handleFieldChange("surfaceDrainage", e.target.checked)}
                                    style={{ accentColor: "#0891b2" }}
                                  />
                                  [ ] SURFACE DRAINAGE
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.72rem", fontWeight: formData.streetCanal ? "700" : "500", color: formData.streetCanal ? "#0e7490" : "#475569" }}>
                                  <input
                                    type="checkbox"
                                    checked={formData.streetCanal === true}
                                    onChange={e => handleFieldChange("streetCanal", e.target.checked)}
                                    style={{ accentColor: "#0891b2" }}
                                  />
                                  [ ] STREET CANAL
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.72rem", fontWeight: formData.waterCourse ? "700" : "500", color: formData.waterCourse ? "#0e7490" : "#475569" }}>
                                  <input
                                    type="checkbox"
                                    checked={formData.waterCourse === true}
                                    onChange={e => handleFieldChange("waterCourse", e.target.checked)}
                                    style={{ accentColor: "#0891b2" }}
                                  />
                                  [ ] WATER COURSE
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* BUILDING SPECIFICATIONS & INSTALLATION SCHEDULE */}
                        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "10px" }}>
                          <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "#0e7490", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                            Building Specifications & Installation Schedule
                          </span>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                                Number of Storeys of Building *
                              </label>
                              <input
                                type="text"
                                value={formData.proposedStoreys ?? "2"}
                                onChange={e => handleFieldChange("proposedStoreys", e.target.value)}
                                placeholder="2"
                                style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", background: "#ffffff" }}
                              />
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                                Total Area of Building/Subdivision (SQ. M.) *
                              </label>
                              <input
                                type="text"
                                value={formData.plumbingTotalArea || formData.floorArea || "185.50"}
                                onChange={e => handleFieldChange("plumbingTotalArea", e.target.value)}
                                placeholder="185.50"
                                style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", background: "#ffffff" }}
                              />
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                                Proposed Date Start of Installation *
                              </label>
                              <input
                                type="date"
                                value={formData.plumbingStartDate || formData.proposedStartDate || "2026-10-01"}
                                onChange={e => handleFieldChange("plumbingStartDate", e.target.value)}
                                style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", background: "#ffffff" }}
                              />
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                                Total Cost of Installation (PHP) *
                              </label>
                              <input
                                type="text"
                                value={formData.plumbingInstallationCost || formData.costPlumbing || "100,000.00"}
                                onChange={e => handleFieldChange("plumbingInstallationCost", e.target.value)}
                                placeholder="100,000.00"
                                style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", background: "#ffffff" }}
                              />
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                                Expected Date of Completion
                              </label>
                              <input
                                type="date"
                                value={formData.plumbingCompletionDate || ""}
                                onChange={e => handleFieldChange("plumbingCompletionDate", e.target.value)}
                                style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", background: "#ffffff" }}
                              />
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                                Prepared By (Professional / Installer) *
                              </label>
                              <input
                                type="text"
                                value={formData.plumbingPreparedBy || formData.masterPlumberName || ""}
                                onChange={e => handleFieldChange("plumbingPreparedBy", e.target.value)}
                                placeholder="e.g. Engr. Jose Mendoza, RMP"
                                style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", background: "#ffffff" }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                  {selectedForm.id === "MP" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>
                          Scope of Work (NBC Form M-01 Box 1)
                        </label>
                        <select
                          value={formData.mechanicalScopeOfWork || formData.scopeOfWork || "New Construction"}
                          onChange={e => handleFieldChange("mechanicalScopeOfWork", e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                        >
                          <option value="New Construction">New Construction</option>
                          <option value="Erection">Erection</option>
                          <option value="Addition">Addition</option>
                          <option value="Alteration">Alteration</option>
                          <option value="Renovation">Renovation</option>
                          <option value="Conversion">Conversion</option>
                          <option value="Repair">Repair</option>
                          <option value="Moving">Moving</option>
                          <option value="Raising">Raising</option>
                          <option value="Demolition">Demolition</option>
                          <option value="Accessory Building/Structure">Accessory Building/Structure</option>
                          <option value="Others (Specify)">Others (Specify)</option>
                        </select>
                      </div>

                      {(formData.mechanicalScopeOfWork || "").toLowerCase().includes("other") && (
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>
                            Scope Details (Prints on Form Underline)
                          </label>
                          <input
                            type="text"
                            value={formData.mechanicalScopeDetails || formData.scopeOfWorkDetails || ""}
                            onChange={e => handleFieldChange("mechanicalScopeDetails", e.target.value)}
                            placeholder="e.g. Specific details for other mechanical scope"
                            style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                          />
                        </div>
                      )}

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Machinery / ACU Type</label>
                          <input type="text" value={formData.machineryType || ""} onChange={e => handleFieldChange("machineryType", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Total Capacity / HP</label>
                          <input type="text" value={formData.machineryCapacity || ""} onChange={e => handleFieldChange("machineryCapacity", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                      </div>

                      {/* BOX 2 (TO BE ACCOMPLISHED BY THE DESIGN PROFESSIONAL) */}
                      <div style={{ borderTop: "1.5px solid #0284c7", paddingTop: "10px", marginTop: "4px" }}>
                        <span style={{ fontSize: "0.74rem", fontWeight: "800", color: "#0369a1", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>
                          BOX 2 (TO BE ACCOMPLISHED BY THE DESIGN PROFESSIONAL)
                        </span>
                        <span style={{ fontSize: "0.71rem", fontWeight: "700", color: "#475569", display: "block", marginBottom: "8px" }}>
                          INSTALLATION AND OPERATION OF:
                        </span>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                          {/* Column 1 */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                            {[
                              { key: "boiler", label: "BOILER" },
                              { key: "pressureVessel", label: "PRESSURE VESSEL" },
                              { key: "internalCombustionEngine", label: "INTERNAL COMBUSTION ENGINE" },
                              { key: "refrigerationIce", label: "REFRIGERATION AND ICE MAKING" },
                              { key: "windowTypeAircon", label: "WINDOW TYPE AIRCONDITIONING" },
                              { key: "packagedSplitAircon", label: "PACKAGED/SPLIT TYPE AIRCON" },
                            ].map((item) => (
                              <label key={item.key} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.72rem", fontWeight: formData[item.key as keyof UnifiedPermitFormData] ? "700" : "500", color: formData[item.key as keyof UnifiedPermitFormData] ? "#0369a1" : "#475569" }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(formData[item.key as keyof UnifiedPermitFormData])}
                                  onChange={e => handleFieldChange(item.key as keyof UnifiedPermitFormData, e.target.checked)}
                                  style={{ accentColor: "#0284c7" }}
                                />
                                {item.label}
                              </label>
                            ))}
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.72rem", fontWeight: formData.mechanicalOthers ? "700" : "500", color: formData.mechanicalOthers ? "#0369a1" : "#475569" }}>
                              <input
                                type="checkbox"
                                checked={Boolean(formData.mechanicalOthers)}
                                onChange={e => handleFieldChange("mechanicalOthers", e.target.checked)}
                                style={{ accentColor: "#0284c7" }}
                              />
                              OTHERS(SPECIFY)
                            </label>
                            {formData.mechanicalOthers && (
                              <input
                                type="text"
                                value={formData.mechanicalOthersSpecify || ""}
                                onChange={e => handleFieldChange("mechanicalOthersSpecify", e.target.value)}
                                placeholder="Specify equipment"
                                style={{ width: "100%", padding: "4px 6px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "0.72rem" }}
                              />
                            )}
                          </div>

                          {/* Column 2 */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                            {[
                              { key: "centralAircon", label: "CENTRAL AICONDITIONING" },
                              { key: "mechanicalVentilation", label: "MECHANICAL VENTILLATION" },
                              { key: "escalator", label: "ESCALATOR" },
                              { key: "movingSidewalk", label: "MOVING SIDEWALK" },
                              { key: "freightElevator", label: "FREIGHT ELEVATOR" },
                              { key: "passengerElevator", label: "PASSENGER ELEVATOR" },
                              { key: "cableCar", label: "CABLE CAR" },
                            ].map((item) => (
                              <label key={item.key} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.72rem", fontWeight: formData[item.key as keyof UnifiedPermitFormData] ? "700" : "500", color: formData[item.key as keyof UnifiedPermitFormData] ? "#0369a1" : "#475569" }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(formData[item.key as keyof UnifiedPermitFormData])}
                                  onChange={e => handleFieldChange(item.key as keyof UnifiedPermitFormData, e.target.checked)}
                                  style={{ accentColor: "#0284c7" }}
                                />
                                {item.label}
                              </label>
                            ))}
                          </div>

                          {/* Column 3 */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                            {[
                              { key: "dumbwaiter", label: "DUMBWATER" },
                              { key: "pumps", label: "PUMPS" },
                              { key: "compressedAirGas", label: "COMPRESSED AIR VACCUM / GAS" },
                              { key: "pneumaticTubesConveyors", label: "PNEUMATIC TUBES, CONVEYORS" },
                              { key: "funicular", label: "FUNICULAR" },
                            ].map((item) => (
                              <label key={item.key} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.72rem", fontWeight: formData[item.key as keyof UnifiedPermitFormData] ? "700" : "500", color: formData[item.key as keyof UnifiedPermitFormData] ? "#0369a1" : "#475569" }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(formData[item.key as keyof UnifiedPermitFormData])}
                                  onChange={e => handleFieldChange(item.key as keyof UnifiedPermitFormData, e.target.checked)}
                                  style={{ accentColor: "#0284c7" }}
                                />
                                {item.label}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* PREPARED BY */}
                        <div style={{ marginTop: "10px", borderTop: "1px dashed #cbd5e1", paddingTop: "8px" }}>
                          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                            PREPARED BY: (Design Professional)
                          </label>
                          <input
                            type="text"
                            value={formData.mechanicalPreparedBy || formData.mechanicalEngineerName || ""}
                            onChange={e => handleFieldChange("mechanicalPreparedBy", e.target.value)}
                            placeholder="e.g. Engr. Antonio Gomez, PME"
                            style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", background: "#ffffff" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedForm.id === "EL" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", padding: "1rem", borderRadius: "10px", background: "#f0fdf4", border: "1.5px solid #86efac" }}>
                      {/* BOX 1: SCOPE OF WORK */}
                      <div>
                        <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#166534", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                          BOX 1: SCOPE OF WORK (ELECTRONICS)
                        </span>
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "8px" }}>
                          {[
                            { value: "New Installation", label: "NEW INSTALLATION" },
                            { value: "Annual Inspection", label: "ANNUAL INSPECTION" },
                            { value: "Others", label: "OTHERS (SPECIFY)" }
                          ].map(s => (
                            <label key={s.value} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.74rem", fontWeight: "700", color: "#166534", cursor: "pointer" }}>
                              <input
                                type="radio"
                                name="electronicsScopeOfWork"
                                checked={(formData.electronicsScopeOfWork || "New Installation") === s.value}
                                onChange={() => handleFieldChange("electronicsScopeOfWork", s.value)}
                                style={{ accentColor: "#16a34a" }}
                              />
                              {s.label}
                            </label>
                          ))}
                        </div>
                        {formData.electronicsScopeOfWork === "Others" && (
                          <div style={{ marginBottom: "8px" }}>
                            <input
                              type="text"
                              value={formData.electronicsScopeOthers || ""}
                              onChange={e => handleFieldChange("electronicsScopeOthers", e.target.value)}
                              placeholder="Specify other electronics scope of work"
                              style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.78rem" }}
                            />
                          </div>
                        )}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#475569" }}>Telecom & Data Scope</label>
                            <input type="text" value={formData.telecomScope || ""} onChange={e => handleFieldChange("telecomScope", e.target.value)} style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.78rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#475569" }}>CCTV Surveillance Scope</label>
                            <input type="text" value={formData.cctvScope || ""} onChange={e => handleFieldChange("cctvScope", e.target.value)} style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.78rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#475569" }}>Fire Alarm (FDAS) Scope</label>
                            <input type="text" value={formData.fdasScope || ""} onChange={e => handleFieldChange("fdasScope", e.target.value)} style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.78rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#475569" }}>CATV / Broadcast Scope</label>
                            <input type="text" value={formData.catvScope || ""} onChange={e => handleFieldChange("catvScope", e.target.value)} style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.78rem" }} />
                          </div>
                        </div>
                      </div>

                      {/* BOX 2: NATURE OF INSTALLATION / WORKS */}
                      <div style={{ borderTop: "1.5px solid #86efac", paddingTop: "10px", marginTop: "4px" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#166534", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>
                          BOX 2 (TO BE ACCOMPLISHED BY THE DESIGN PROFESSIONAL)
                        </span>
                        <span style={{ fontSize: "0.71rem", fontWeight: "700", color: "#475569", display: "block", marginBottom: "8px" }}>
                          NATURE OF INSTALLATION WITH CORRESPONDING ELECTRONICS SYSTEMS:
                        </span>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                          {/* Column 1 */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                            {[
                              { key: "telecomSystem", label: "TELECOMMUNICATION SYSTEM" },
                              { key: "broadcastingSystem", label: "BROADCASTING SYSTEM" },
                              { key: "televisionSystem", label: "TELEVISION SYSTEM" },
                              { key: "itSystem", label: "INFORMATION TECHNOLOGY SYSTEM" },
                              { key: "securityAlarmSystem", label: "SECURITY AND/OR ALARM SYSTEMS" },
                            ].map((item) => (
                              <label key={item.key} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.72rem", fontWeight: formData[item.key as keyof UnifiedPermitFormData] ? "700" : "500", color: formData[item.key as keyof UnifiedPermitFormData] ? "#166534" : "#475569" }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(formData[item.key as keyof UnifiedPermitFormData])}
                                  onChange={e => handleFieldChange(item.key as keyof UnifiedPermitFormData, e.target.checked)}
                                  style={{ accentColor: "#16a34a" }}
                                />
                                {item.label}
                              </label>
                            ))}
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.72rem", fontWeight: formData.anyOtherElectronics ? "700" : "500", color: formData.anyOtherElectronics ? "#166534" : "#475569" }}>
                              <input
                                type="checkbox"
                                checked={Boolean(formData.anyOtherElectronics)}
                                onChange={e => handleFieldChange("anyOtherElectronics", e.target.checked)}
                                style={{ accentColor: "#16a34a" }}
                              />
                              ANY OTHER ELECTRONICS SYSTEMS
                            </label>
                            {formData.anyOtherElectronics && (
                              <input
                                type="text"
                                value={formData.anyOtherElectronicsSpecify || ""}
                                onChange={e => handleFieldChange("anyOtherElectronicsSpecify", e.target.value)}
                                placeholder="Specify electronics systems"
                                style={{ width: "100%", padding: "4px 6px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "0.72rem" }}
                              />
                            )}
                          </div>

                          {/* Column 2 */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                            {[
                              { key: "electronicsAlarmSystem", label: "ELECTRONICS FIRE ALARM SYSTEM" },
                              { key: "soundCommSystem", label: "SOUND-COMMUNICATION SYSTEM" },
                              { key: "centralizedClockSystem", label: "CENTRALIZED CLOCK SYSTEM" },
                              { key: "soundSystem", label: "SOUND SYSTEM" },
                              { key: "electronicsControlConveyor", label: "ELECTRONIC CONTROL CONVEYOR SYSTEM" },
                            ].map((item) => (
                              <label key={item.key} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.72rem", fontWeight: formData[item.key as keyof UnifiedPermitFormData] ? "700" : "500", color: formData[item.key as keyof UnifiedPermitFormData] ? "#166534" : "#475569" }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(formData[item.key as keyof UnifiedPermitFormData])}
                                  onChange={e => handleFieldChange(item.key as keyof UnifiedPermitFormData, e.target.checked)}
                                  style={{ accentColor: "#16a34a" }}
                                />
                                {item.label}
                              </label>
                            ))}
                          </div>

                          {/* Column 3 */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                            {[
                              { key: "computerProcessControls", label: "COMPUTER PROCESS CONTROLS" },
                              { key: "buildingAutomationManagement", label: "BUILDING AUTOMATION MANAGEMENT" },
                              { key: "buildingWiringFiberOptic", label: "BUILDING WIRING / FIBER OPTIC" },
                            ].map((item) => (
                              <label key={item.key} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.72rem", fontWeight: formData[item.key as keyof UnifiedPermitFormData] ? "700" : "500", color: formData[item.key as keyof UnifiedPermitFormData] ? "#166534" : "#475569" }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(formData[item.key as keyof UnifiedPermitFormData])}
                                  onChange={e => handleFieldChange(item.key as keyof UnifiedPermitFormData, e.target.checked)}
                                  style={{ accentColor: "#16a34a" }}
                                />
                                {item.label}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* PREPARED BY */}
                        <div style={{ marginTop: "10px", borderTop: "1px dashed #cbd5e1", paddingTop: "8px" }}>
                          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                            PREPARED BY: (Design Professional PECE)
                          </label>
                          <input
                            type="text"
                            value={formData.electronicsPreparedBy || formData.electronicsEngineerName || ""}
                            onChange={e => handleFieldChange("electronicsPreparedBy", e.target.value)}
                            placeholder="e.g. Engr. Alan T. Santos, PECE"
                            style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", background: "#ffffff" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedForm.id === "DP" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {/* Section 1: Accompanying Building Permit */}
                      <div style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: (formData.withBuildingPermit !== false && Boolean(formData.buildingPermitNo)) ? "#eff6ff" : "#f8fafc",
                        border: (formData.withBuildingPermit !== false && Boolean(formData.buildingPermitNo)) ? "1.5px solid #93c5fd" : "1px solid #cbd5e1",
                      }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "700", fontSize: "0.8rem", color: "#1e293b" }}>
                          <input
                            type="checkbox"
                            checked={formData.withBuildingPermit !== false && Boolean(formData.buildingPermitNo)}
                            onChange={e => {
                              const checked = e.target.checked;
                              handleFieldChange("withBuildingPermit", checked);
                              if (checked && !formData.buildingPermitNo) {
                                handleFieldChange("buildingPermitNo", getAutoPermitNumber("BP", formData.applicationNo));
                              }
                            }}
                            style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                          />
                          <span>Accompanying Building Permit (With Building Permit)</span>
                        </label>
                        <span style={{ display: "block", fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
                          When enabled, automatically gathers the Building Permit number ({formData.buildingPermitNo || "BP-2026-0001"}) and inserts it into the 8 compartment boxes under <strong>BUILDING PERMIT NO.</strong> on NBC Form B-08.
                        </span>
                      </div>

                      {/* Section 2: Box 1 Scope of Demolition Works */}
                      <div style={{ padding: "0.9rem", borderRadius: "10px", background: "#f8fafc", border: "1px solid #cbd5e1" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
                          Box 1: Scope of Demolition Works
                        </span>
                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Structure to Demolish</label>
                            <input type="text" value={formData.demolitionBuildingType || ""} onChange={e => handleFieldChange("demolitionBuildingType", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Number of Storeys</label>
                            <input type="text" value={formData.demolitionStoreys || ""} onChange={e => handleFieldChange("demolitionStoreys", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Demolition Area (sq.m.)</label>
                            <input type="text" value={formData.demolitionArea || ""} onChange={e => handleFieldChange("demolitionArea", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Proposed Start Date</label>
                            <input type="date" value={formData.demolitionStartDate || formData.proposedStartDate || "2026-10-01"} onChange={e => handleFieldChange("demolitionStartDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Expected Completion Date</label>
                            <input type="date" value={formData.demolitionCompletionDate || formData.expectedCompletionDate || "2026-11-15"} onChange={e => handleFieldChange("demolitionCompletionDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Scope & Precautions</label>
                          <input type="text" value={formData.demolitionScope || ""} onChange={e => handleFieldChange("demolitionScope", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                      </div>

                      {/* Section 3: Box 2 Full-Time Inspector and Supervisor of Demolition Works */}
                      <div style={{ padding: "0.9rem", borderRadius: "10px", background: "#f0fdf4", border: "1.5px solid #86efac" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#14532d", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>
                          Box 2: Full-Time Inspector and Supervisor of Demolition Works
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "#166534", display: "block", marginBottom: "0.75rem" }}>
                          Architect or Civil Engineer in charge of full-time demolition works & safety
                        </span>

                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#14532d", fontWeight: "700" }}>Supervisor Full Name (with Title)</label>
                            <input type="text" value={formData.demolitionSupervisorName || "Engr. Roberto Cruz, CE"} onChange={e => handleFieldChange("demolitionSupervisorName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.8rem", fontWeight: "700" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#14532d", fontWeight: "700" }}>Address</label>
                            <input type="text" value={formData.demolitionSupervisorAddress || "Sto. Tomas, Pampanga"} onChange={e => handleFieldChange("demolitionSupervisorAddress", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.8rem" }} />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#14532d", fontWeight: "700" }}>Telephone / Mobile</label>
                            <input type="text" value={formData.demolitionSupervisorPhone || "0918-765-4321"} onChange={e => handleFieldChange("demolitionSupervisorPhone", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#14532d", fontWeight: "700" }}>PRC Registration No.</label>
                            <input type="text" value={formData.demolitionSupervisorPRC || "0078923"} onChange={e => handleFieldChange("demolitionSupervisorPRC", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#14532d", fontWeight: "700" }}>PRC Validity Date</label>
                            <input type="text" value={formData.demolitionSupervisorPRCValidity || "2028-11-20"} onChange={e => handleFieldChange("demolitionSupervisorPRCValidity", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#14532d", fontWeight: "700" }}>TIN Number</label>
                            <input type="text" value={formData.demolitionSupervisorTIN || "456-789-012-000"} onChange={e => handleFieldChange("demolitionSupervisorTIN", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.8rem" }} />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#14532d", fontWeight: "700" }}>PTR Number</label>
                            <input type="text" value={formData.demolitionSupervisorPTR || "PTR-ST-2026-001"} onChange={e => handleFieldChange("demolitionSupervisorPTR", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#14532d", fontWeight: "700" }}>Date Issued</label>
                            <input type="text" value={formData.demolitionSupervisorPTRIssued || "Jan 10, 2026"} onChange={e => handleFieldChange("demolitionSupervisorPTRIssued", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#14532d", fontWeight: "700" }}>Issued At</label>
                            <input type="text" value={formData.demolitionSupervisorPTRIssuedAt || "Sto. Tomas"} onChange={e => handleFieldChange("demolitionSupervisorPTRIssuedAt", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.8rem" }} />
                          </div>
                        </div>

                        {/* Supervisor E-Signature */}
                        <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #86efac" }}>
                          <SignatureCreator
                            value={formData.demolitionSupervisorSignature || formData.civilEngineerSignature}
                            onChange={sig => {
                              handleFieldChange("demolitionSupervisorSignature", sig);
                              handleFieldChange("civilEngineerSignature", sig);
                            }}
                            label={`Supervisor Seal & E-Signature (Affixed over printed name: ${formData.demolitionSupervisorName || "Engr. Roberto Cruz, CE"})`}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedForm.id === "FP" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>
                          Scope of Work (NBC Form B-03 Box 1)
                        </label>
                        <select
                          value={formData.fencingScopeOfWork || formData.scopeOfWork || "New Construction"}
                          onChange={e => {
                            handleFieldChange("fencingScopeOfWork", e.target.value);
                            handleFieldChange("scopeOfWork", e.target.value);
                          }}
                          style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                        >
                          <option value="New Construction">New Construction</option>
                          <option value="Erection">Erection</option>
                          <option value="Addition">Addition</option>
                          <option value="Repair">Repair</option>
                          <option value="Demolition">Demolition</option>
                          <option value="Others">Others (Specify)</option>
                        </select>
                      </div>

                      {["Repair", "Demolition", "Other"].some(k => (formData.fencingScopeOfWork || "").toLowerCase().includes(k.toLowerCase())) && (
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>
                            Specify Scope Details (Prints on Underline)
                          </label>
                          <input
                            type="text"
                            value={formData.fencingScopeDetails || formData.scopeOfWorkDetails || ""}
                            onChange={e => {
                              handleFieldChange("fencingScopeDetails", e.target.value);
                              handleFieldChange("scopeOfWorkDetails", e.target.value);
                            }}
                            placeholder="e.g. Specific repair/demolition/custom scope"
                            style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                          />
                        </div>
                      )}

                      {/* Box 6 Measurements */}
                      <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#475569", marginBottom: "3px" }}>
                            Length in Meters (Underline 1) *
                          </label>
                          <input
                            type="text"
                            value={formData.fencingLength || ""}
                            onChange={e => handleFieldChange("fencingLength", e.target.value)}
                            placeholder="e.g. 45.00"
                            style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#475569", marginBottom: "3px" }}>
                            Height in Meters (Underline 2) *
                          </label>
                          <input
                            type="text"
                            value={formData.fencingHeight || ""}
                            onChange={e => handleFieldChange("fencingHeight", e.target.value)}
                            placeholder="e.g. 2.20"
                            style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                          />
                        </div>
                      </div>

                      {/* Box 6: 8 Official Fencing Checkboxes */}
                      <div style={{ gridColumn: "1 / -1", background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#1e293b", textTransform: "uppercase" }}>
                            Type of Fencing (NBC Form B-03 Box 6 Official Checkboxes)
                          </label>
                          <span style={{ fontSize: "0.68rem", color: "#64748b" }}>Multi-select supported</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                          {/* Left Column (5 Checkboxes) */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                            {[
                              "INDIGENOUS MATERIALS",
                              "R.C. (Reinforced Concrete)",
                              "R.C. and CONC. HOLLOW BLOCKS",
                              "R.C. and BRICKS",
                              "R.C. and INTERLINK/CYCLONE WIRE",
                            ].map(item => {
                              const typesList: string[] = Array.isArray(formData.fencingTypes)
                                ? formData.fencingTypes
                                : formData.fencingType
                                ? formData.fencingType.split(",").map(s => s.trim()).filter(Boolean)
                                : ["R.C. and CONC. HOLLOW BLOCKS"];
                              const checked = typesList.includes(item);
                              const toggleItem = () => {
                                const next = checked ? typesList.filter(t => t !== item) : [...typesList, item];
                                handleFieldChange("fencingTypes", next);
                                handleFieldChange("fencingType", next.join(", "));
                              };
                              return (
                                <label
                                  key={item}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "5px 8px",
                                    borderRadius: "5px",
                                    border: checked ? "1.5px solid #3b82f6" : "1px solid #cbd5e1",
                                    background: checked ? "#eff6ff" : "#ffffff",
                                    cursor: "pointer",
                                    fontSize: "0.75rem",
                                    fontWeight: checked ? "700" : "500",
                                    color: checked ? "#1d4ed8" : "#334155",
                                    userSelect: "none",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={toggleItem}
                                    style={{ accentColor: "#2563eb", cursor: "pointer" }}
                                  />
                                  <span>{item}</span>
                                </label>
                              );
                            })}
                          </div>

                          {/* Right Column (3 Checkboxes) */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                            {[
                              "R.C. STEEL MATTING",
                              "R.C. BARBED WIRE",
                              "OTHERS (Specify)",
                            ].map(item => {
                              const typesList: string[] = Array.isArray(formData.fencingTypes)
                                ? formData.fencingTypes
                                : formData.fencingType
                                ? formData.fencingType.split(",").map(s => s.trim()).filter(Boolean)
                                : ["R.C. and CONC. HOLLOW BLOCKS"];
                              const checked = typesList.includes(item);
                              const toggleItem = () => {
                                const next = checked ? typesList.filter(t => t !== item) : [...typesList, item];
                                handleFieldChange("fencingTypes", next);
                                handleFieldChange("fencingType", next.join(", "));
                              };
                              return (
                                <label
                                  key={item}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "5px 8px",
                                    borderRadius: "5px",
                                    border: checked ? "1.5px solid #3b82f6" : "1px solid #cbd5e1",
                                    background: checked ? "#eff6ff" : "#ffffff",
                                    cursor: "pointer",
                                    fontSize: "0.75rem",
                                    fontWeight: checked ? "700" : "500",
                                    color: checked ? "#1d4ed8" : "#334155",
                                    userSelect: "none",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={toggleItem}
                                    style={{ accentColor: "#2563eb", cursor: "pointer" }}
                                  />
                                  <span>{item}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* 3 Underline Lines for OTHERS (Specify) */}
                      {((formData.fencingTypes || []).includes("OTHERS (Specify)") || (formData.fencingType || "").toLowerCase().includes("other") || Boolean(formData.fencingTypeOthers)) && (
                        <div style={{ gridColumn: "1 / -1", background: "#f0fdf4", padding: "10px", borderRadius: "8px", border: "1.5px solid #86efac", display: "flex", flexDirection: "column", gap: "6px" }}>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#166534" }}>
                            Official Underlines for OTHERS (Specify) • Page 2 Box 6
                          </label>
                          <div>
                            <span style={{ fontSize: "0.7rem", color: "#374151" }}>Line 1 (Follows OTHERS (Specify) • max ~26 chars):</span>
                            <input
                              type="text"
                              value={formData.fencingTypeOthers || ""}
                              onChange={e => handleFieldChange("fencingTypeOthers", e.target.value)}
                              placeholder="e.g. Decorative Metal Grille Panels"
                              maxLength={35}
                              style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.8rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <span style={{ fontSize: "0.7rem", color: "#374151" }}>Line 2 (Full Underline 2 • max ~40 chars):</span>
                            <input
                              type="text"
                              value={formData.fencingTypeOthersLine2 || ""}
                              onChange={e => handleFieldChange("fencingTypeOthersLine2", e.target.value)}
                              placeholder="e.g. with Reinforced Concrete Posts & Footing"
                              maxLength={50}
                              style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #bbf7d0", fontSize: "0.8rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <span style={{ fontSize: "0.7rem", color: "#374151" }}>Line 3 (Full Underline 3 • max ~40 chars):</span>
                            <input
                              type="text"
                              value={formData.fencingTypeOthersLine3 || ""}
                              onChange={e => handleFieldChange("fencingTypeOthersLine3", e.target.value)}
                              placeholder="e.g. Anti-climb spearhead design"
                              maxLength={50}
                              style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #bbf7d0", fontSize: "0.8rem", background: "#ffffff" }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedForm.id === "EXP" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {/* Section 1: Accompanying Building Permit */}
                      <div style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: (formData.withBuildingPermit !== false && Boolean(formData.buildingPermitNo)) ? "#eff6ff" : "#f8fafc",
                        border: (formData.withBuildingPermit !== false && Boolean(formData.buildingPermitNo)) ? "1.5px solid #93c5fd" : "1px solid #cbd5e1",
                      }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "700", fontSize: "0.8rem", color: "#1e293b" }}>
                          <input
                            type="checkbox"
                            checked={formData.withBuildingPermit !== false && Boolean(formData.buildingPermitNo)}
                            onChange={e => {
                              const checked = e.target.checked;
                              handleFieldChange("withBuildingPermit", checked);
                              if (checked && !formData.buildingPermitNo) {
                                handleFieldChange("buildingPermitNo", getAutoPermitNumber("BP", formData.applicationNo));
                              }
                            }}
                            style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                          />
                          <span>Accompanying Building Permit (With Building Permit)</span>
                        </label>
                        <span style={{ display: "block", fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
                          When enabled, automatically gathers the Building Permit number ({formData.buildingPermitNo || "BP-2026-0001"}) and inserts it into the 8 compartment boxes under <strong>BUILDING PERMIT NO.</strong> on NBC Form B-02.
                        </span>
                      </div>

                      {/* Section 2: Page 2 Box 6 Specifications */}
                      <div style={{ padding: "0.9rem", borderRadius: "10px", background: "#f8fafc", border: "1px solid #cbd5e1" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block", marginBottom: "0.35rem" }}>
                          Box 6: To Be Accomplished by the Design Professional
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "#64748b", display: "block", marginBottom: "0.75rem" }}>
                          Select all excavation and ground preparation classifications that apply (NBC Form B-02 Page 2):
                        </span>

                        {/* Official DPWH Box 6 Checkbox Grid */}
                        <div style={{
                          background: "#ffffff",
                          border: "1.5px solid #cbd5e1",
                          borderRadius: "8px",
                          padding: "0.85rem",
                          marginBottom: "0.85rem"
                        }}>
                          {/* Row 1 */}
                          <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                            gap: "0.85rem",
                            marginBottom: "0.85rem",
                            paddingBottom: "0.75rem",
                            borderBottom: "1px dashed #e2e8f0"
                          }}>
                            <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "700", color: "#1e293b" }}>
                              <input
                                type="checkbox"
                                checked={Boolean(formData.excavationAndFills)}
                                onChange={(e) => handleFieldChange("excavationAndFills", e.target.checked)}
                                style={{ width: "16px", height: "16px", accentColor: "#2563eb", marginTop: "2px", cursor: "pointer" }}
                              />
                              <span>EXCAVATION AND FILLS</span>
                            </label>

                            <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "700", color: "#1e293b" }}>
                              <input
                                type="checkbox"
                                checked={Boolean(formData.foundationAndRetainingWalls)}
                                onChange={(e) => handleFieldChange("foundationAndRetainingWalls", e.target.checked)}
                                style={{ width: "16px", height: "16px", accentColor: "#2563eb", marginTop: "2px", cursor: "pointer" }}
                              />
                              <span>FOUNDATION AND RETAINING WALLS</span>
                            </label>

                            <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "700", color: "#1e293b" }}>
                              <input
                                type="checkbox"
                                checked={Boolean(formData.pileFoundations)}
                                onChange={(e) => handleFieldChange("pileFoundations", e.target.checked)}
                                style={{ width: "16px", height: "16px", accentColor: "#2563eb", marginTop: "2px", cursor: "pointer" }}
                              />
                              <span>PILE FOUNDATIONS</span>
                            </label>

                            <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "700", color: "#1e293b" }}>
                              <input
                                type="checkbox"
                                checked={Boolean(formData.gradingAndEarthworks)}
                                onChange={(e) => handleFieldChange("gradingAndEarthworks", e.target.checked)}
                                style={{ width: "16px", height: "16px", accentColor: "#2563eb", marginTop: "2px", cursor: "pointer" }}
                              />
                              <div>
                                <span>GRADING AND EARTHWORKS</span>
                                <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "500" }}>(Including fills and embankment.)</div>
                              </div>
                            </label>
                          </div>

                          {/* Row 2: Others (Specify) and Additional Custom Scope Lines */}
                          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1.3fr", gap: "0.75rem" }}>
                            <div>
                              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "700", color: "#1e293b", marginBottom: "4px" }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(formData.othersSpecify)}
                                  onChange={(e) => handleFieldChange("othersSpecify", e.target.checked)}
                                  style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                                />
                                <span>OTHERS (Specify)</span>
                              </label>
                              <input
                                type="text"
                                value={formData.othersSpecifyText || ""}
                                onChange={(e) => {
                                  handleFieldChange("othersSpecifyText", e.target.value);
                                  if (e.target.value.trim() && !formData.othersSpecify) handleFieldChange("othersSpecify", true);
                                }}
                                placeholder="e.g. TRENCHING"
                                style={{ width: "100%", padding: "5px 8px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "0.78rem", background: formData.othersSpecify ? "#ffffff" : "#f1f5f9" }}
                              />
                            </div>

                            <div>
                              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "700", color: "#1e293b", marginBottom: "4px" }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(formData.othersCustomLine2Check)}
                                  onChange={(e) => handleFieldChange("othersCustomLine2Check", e.target.checked)}
                                  style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                                />
                                <span>Additional Scope (Line 2)</span>
                              </label>
                              <input
                                type="text"
                                value={formData.othersCustomLine2Text || ""}
                                onChange={(e) => {
                                  handleFieldChange("othersCustomLine2Text", e.target.value);
                                  if (e.target.value.trim() && !formData.othersCustomLine2Check) handleFieldChange("othersCustomLine2Check", true);
                                }}
                                placeholder="e.g. DEEP BASEMENT SHORING"
                                style={{ width: "100%", padding: "5px 8px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "0.78rem", background: formData.othersCustomLine2Check ? "#ffffff" : "#f1f5f9" }}
                              />
                            </div>

                            <div>
                              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "700", color: "#1e293b", marginBottom: "4px" }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(formData.othersCustomLine3Check)}
                                  onChange={(e) => handleFieldChange("othersCustomLine3Check", e.target.checked)}
                                  style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                                />
                                <span>Custom Scope (Line 3)</span>
                              </label>
                              <input
                                type="text"
                                value={formData.othersCustomLine3Text || ""}
                                onChange={(e) => {
                                  handleFieldChange("othersCustomLine3Text", e.target.value);
                                  if (e.target.value.trim() && !formData.othersCustomLine3Check) handleFieldChange("othersCustomLine3Check", true);
                                }}
                                placeholder="e.g. SITE DEWATERING"
                                style={{ width: "100%", padding: "5px 8px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "0.78rem", background: formData.othersCustomLine3Check ? "#ffffff" : "#f1f5f9" }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Overall Scope Summary input */}
                        <div style={{ marginBottom: "0.75rem" }}>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>Detailed Scope Description</label>
                          <input
                            type="text"
                            value={formData.excavationScope || ""}
                            onChange={e => handleFieldChange("excavationScope", e.target.value)}
                            placeholder="e.g. Foundation Excavation, Site Grading & Ground Levelling"
                            style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                          />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>Volume (cu.m.)</label>
                            <input
                              type="text"
                              value={formData.excavationVolume || "120.00"}
                              onChange={e => handleFieldChange("excavationVolume", e.target.value)}
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>Max Depth (meters)</label>
                            <input
                              type="text"
                              value={formData.excavationDepth || "2.50"}
                              onChange={e => handleFieldChange("excavationDepth", e.target.value)}
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>Start Date</label>
                            <input
                              type="date"
                              value={formData.proposedStartDate || "2026-10-01"}
                              onChange={e => handleFieldChange("proposedStartDate", e.target.value)}
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>Completion Date</label>
                            <input
                              type="date"
                              value={formData.expectedCompletionDate || "2026-11-15"}
                              onChange={e => handleFieldChange("expectedCompletionDate", e.target.value)}
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Box 3 Supervisor of Excavation Works */}
                      <div style={{ padding: "0.9rem", borderRadius: "10px", background: "#f0fdf4", border: "1.5px solid #86efac" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#14532d", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>
                          Box 3: Full-Time Inspector and Supervisor of Excavation Works
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "#166534", display: "block", marginBottom: "0.75rem" }}>
                          Civil Engineer in charge of full-time excavation safety, shoring, and operations
                        </span>

                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#14532d", fontWeight: "700" }}>Supervisor Full Name (with Title)</label>
                            <input type="text" value={formData.supervisorCivilEngineerName || formData.civilEngineerName || "Engr. Roberto Cruz, CE"} onChange={e => { handleFieldChange("supervisorCivilEngineerName", e.target.value); handleFieldChange("civilEngineerName", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.8rem", fontWeight: "700" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#14532d", fontWeight: "700" }}>Address</label>
                            <input type="text" value={formData.supervisorCivilEngineerAddress || formData.civilEngineerAddress || "Sto. Tomas, Pampanga"} onChange={e => { handleFieldChange("supervisorCivilEngineerAddress", e.target.value); handleFieldChange("civilEngineerAddress", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.8rem" }} />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#14532d", fontWeight: "700" }}>Telephone / Mobile</label>
                            <input type="text" value={formData.supervisorCivilEngineerPhone || formData.applicantPhone || "0918-765-4321"} onChange={e => handleFieldChange("supervisorCivilEngineerPhone", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#14532d", fontWeight: "700" }}>PRC Registration No.</label>
                            <input type="text" value={formData.supervisorCivilEngineerPRC || formData.civilEngineerPRC || "0078923"} onChange={e => { handleFieldChange("supervisorCivilEngineerPRC", e.target.value); handleFieldChange("civilEngineerPRC", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#14532d", fontWeight: "700" }}>PRC Validity Date</label>
                            <input type="text" value={formData.supervisorCivilEngineerPRCValidity || formData.civilEngineerPRCValidity || "2028-11-20"} onChange={e => { handleFieldChange("supervisorCivilEngineerPRCValidity", e.target.value); handleFieldChange("civilEngineerPRCValidity", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#14532d", fontWeight: "700" }}>TIN Number</label>
                            <input type="text" value={formData.supervisorCivilEngineerTIN || formData.civilEngineerTIN || "123-456-789-000"} onChange={e => { handleFieldChange("supervisorCivilEngineerTIN", e.target.value); handleFieldChange("civilEngineerTIN", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.8rem" }} />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#14532d", fontWeight: "700" }}>PTR Number</label>
                            <input type="text" value={formData.supervisorCivilEngineerPTR || formData.civilEngineerPTR || "PTR-ST-2026-001"} onChange={e => { handleFieldChange("supervisorCivilEngineerPTR", e.target.value); handleFieldChange("civilEngineerPTR", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#14532d", fontWeight: "700" }}>Date Issued</label>
                            <input type="text" value={formData.supervisorCivilEngineerPTRIssued || formData.civilEngineerPTRIssued || "Jan 10, 2026"} onChange={e => { handleFieldChange("supervisorCivilEngineerPTRIssued", e.target.value); handleFieldChange("civilEngineerPTRIssued", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#14532d", fontWeight: "700" }}>Issued At</label>
                            <input type="text" value={formData.supervisorCivilEngineerPTRIssuedAt || formData.civilEngineerPTRIssuedAt || "Sto. Tomas"} onChange={e => { handleFieldChange("supervisorCivilEngineerPTRIssuedAt", e.target.value); handleFieldChange("civilEngineerPTRIssuedAt", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.8rem" }} />
                          </div>
                        </div>

                        {/* Supervisor E-Signature */}
                        <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #86efac" }}>
                          <SignatureCreator
                            value={formData.supervisorCivilEngineerSignature || formData.civilEngineerSignature}
                            onChange={sig => {
                              handleFieldChange("supervisorCivilEngineerSignature", sig);
                              handleFieldChange("civilEngineerSignature", sig);
                            }}
                            label={`Supervisor Seal & E-Signature (Affixed over printed name: ${formData.supervisorCivilEngineerName || formData.civilEngineerName || "Engr. Roberto Cruz, CE"})`}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedForm.id === "SGP" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {/* Section 1: Accompanying Building Permit */}
                      <div style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: (formData.withBuildingPermit !== false && Boolean(formData.buildingPermitNo)) ? "#eff6ff" : "#f8fafc",
                        border: (formData.withBuildingPermit !== false && Boolean(formData.buildingPermitNo)) ? "1.5px solid #93c5fd" : "1px solid #cbd5e1",
                      }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "700", fontSize: "0.8rem", color: "#1e293b" }}>
                          <input
                            type="checkbox"
                            checked={formData.withBuildingPermit !== false && Boolean(formData.buildingPermitNo)}
                            onChange={e => {
                              const checked = e.target.checked;
                              handleFieldChange("withBuildingPermit", checked);
                              if (checked && !formData.buildingPermitNo) {
                                handleFieldChange("buildingPermitNo", getAutoPermitNumber("BP", formData.applicationNo));
                              }
                            }}
                            style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                          />
                          <span>Accompanying Building Permit (With Building Permit)</span>
                        </label>
                        <span style={{ display: "block", fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
                          When enabled, automatically gathers the Building Permit number ({formData.buildingPermitNo || "BP-2026-0001"}) and inserts it 1 character per compartment box into the 8 boxes under <strong>BUILDING PERMIT NO.</strong> on NBC Form B-07.
                        </span>
                      </div>

                      {/* Section 2: Sign Specifications & Box 1 Controls */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Scope of Work</label>
                          <select value={formData.signScopeOfWork || "New Construction"} onChange={e => handleFieldChange("signScopeOfWork", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}>
                            {["New Construction", "Erection", "Addition", "Alteration", "Renovation", "Conversion", "Repair", "Moving", "Raising", "Demolition", "Accessory Building/Structure", "Others (Specify)"].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Form of Ownership</label>
                          <select value={formData.signFormOfOwnership || "Sole Proprietorship"} onChange={e => handleFieldChange("signFormOfOwnership", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}>
                            {["Sole Proprietorship", "Corporation", "Partnership", "Individual"].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Enterprise Name (If applicable)</label>
                          <input type="text" value={formData.signEnterpriseName || ""} onChange={e => handleFieldChange("signEnterpriseName", e.target.value)} placeholder="e.g. STO. TOMAS VENTURES CORP." style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Character of Occupancy</label>
                          <select value={formData.signCharacterOfOccupancy || "Commercial / Business"} onChange={e => handleFieldChange("signCharacterOfOccupancy", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}>
                            {["Commercial / Business", "Industrial", "Institutional", "Residential"].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Type of Display (Face)</label>
                          <select value={formData.signDisplayType || "Single Face"} onChange={e => handleFieldChange("signDisplayType", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}>
                            {["Single Face", "Double Face", "Multi-Media"].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Type of Display (Medium)</label>
                          <select value={formData.signDisplayMedium || "Illuminated"} onChange={e => handleFieldChange("signDisplayMedium", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}>
                            {["Neon", "Illuminated", "Painted-on", "Other"].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Type of Installation</label>
                          <select value={formData.signInstallationType || "Business Sign, Wall Type"} onChange={e => handleFieldChange("signInstallationType", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}>
                            {[
                              "Business Sign, Wall Type",
                              "Business Sign, Projecting Type",
                              "Business Sign, Ground Type",
                              "Business Sign, Temporary",
                              "Advertising Sign, Ground Type",
                              "Advertising Sign, Wall Type",
                              "Advertising Sign, Projecting Type",
                              "Advertising Sign, Other"
                            ].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Length L(m)</label>
                          <input type="text" value={formData.signLength || "3.00"} onChange={e => {
                            const val = e.target.value;
                            handleFieldChange("signLength", val);
                            handleFieldChange("signArea", ((parseFloat(val) || 0) * (parseFloat(formData.signWidth || "1.50") || 0)).toFixed(2));
                          }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Width W(m)</label>
                          <input type="text" value={formData.signWidth || "1.50"} onChange={e => {
                            const val = e.target.value;
                            handleFieldChange("signWidth", val);
                            handleFieldChange("signArea", ((parseFloat(formData.signLength || "3.00") || 0) * (parseFloat(val) || 0)).toFixed(2));
                          }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Signboard Material & Lighting</label>
                          <input type="text" value={formData.signMaterial || ""} onChange={e => handleFieldChange("signMaterial", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Estimated Sign Cost (PHP)</label>
                          <input type="text" value={formData.signCost || ""} onChange={e => handleFieldChange("signCost", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                      </div>

                      {/* Section 3: Box 2 Accompanying Documents Checklist */}
                      <div style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "#f8fafc",
                        border: "1px solid #cbd5e1"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.76rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase" }}>
                            Box 2: Accompanying Documents Checklist
                          </span>
                          <span style={{ fontSize: "0.70rem", background: "#dbeafe", color: "#1e40af", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                            NBC Form B-07 Box 2
                          </span>
                        </div>
                        <span style={{ display: "block", fontSize: "0.70rem", color: "#64748b", marginBottom: "8px" }}>
                          Five (5) sets each signed and sealed by responsible design professional
                        </span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                          <label style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "0.74rem", color: "#334155", cursor: "pointer", fontWeight: "600" }}>
                            <input
                              type="checkbox"
                              checked={formData.signDocTct !== false}
                              onChange={e => handleFieldChange("signDocTct", e.target.checked)}
                              style={{ width: "14px", height: "14px", marginTop: "2px", accentColor: "#2563eb", cursor: "pointer" }}
                            />
                            <span>Certified Xerox Copy of TCT</span>
                          </label>

                          <label style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "0.74rem", color: "#334155", cursor: "pointer", fontWeight: "600" }}>
                            <input
                              type="checkbox"
                              checked={formData.signDocLotPlan !== false}
                              onChange={e => handleFieldChange("signDocLotPlan", e.target.checked)}
                              style={{ width: "14px", height: "14px", marginTop: "2px", accentColor: "#2563eb", cursor: "pointer" }}
                            />
                            <span>Xerox Copy of Lot Plan & Site Dev Plan</span>
                          </label>

                          <label style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "0.74rem", color: "#334155", cursor: "pointer", fontWeight: "600" }}>
                            <input
                              type="checkbox"
                              checked={Boolean(formData.signDocContractOfLease)}
                              onChange={e => handleFieldChange("signDocContractOfLease", e.target.checked)}
                              style={{ width: "14px", height: "14px", marginTop: "2px", accentColor: "#2563eb", cursor: "pointer" }}
                            />
                            <span>Contract of Lease (If not lot owner)</span>
                          </label>

                          <label style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "0.74rem", color: "#334155", cursor: "pointer", fontWeight: "600" }}>
                            <input
                              type="checkbox"
                              checked={formData.signDocSignPlansStructural !== false}
                              onChange={e => handleFieldChange("signDocSignPlansStructural", e.target.checked)}
                              style={{ width: "14px", height: "14px", marginTop: "2px", accentColor: "#2563eb", cursor: "pointer" }}
                            />
                            <span>Plans of Sign Structures & Structural Design</span>
                          </label>

                          <label style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "0.74rem", color: "#334155", cursor: "pointer", fontWeight: "600" }}>
                            <input
                              type="checkbox"
                              checked={formData.signDocTaxDeclaration !== false}
                              onChange={e => handleFieldChange("signDocTaxDeclaration", e.target.checked)}
                              style={{ width: "14px", height: "14px", marginTop: "2px", accentColor: "#2563eb", cursor: "pointer" }}
                            />
                            <span>Tax Declaration & Latest Realty Tax Receipt</span>
                          </label>

                          <label style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "0.74rem", color: "#334155", cursor: "pointer", fontWeight: "600" }}>
                            <input
                              type="checkbox"
                              checked={formData.signDocSpecsCostEstimates !== false}
                              onChange={e => handleFieldChange("signDocSpecsCostEstimates", e.target.checked)}
                              style={{ width: "14px", height: "14px", marginTop: "2px", accentColor: "#2563eb", cursor: "pointer" }}
                            />
                            <span>Specifications and Cost Estimates</span>
                          </label>
                        </div>
                      </div>

                      {/* Section 4: Box 3 Design Professional, Plans and Specifications */}
                      <div style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "#f8fafc",
                        border: "1px solid #cbd5e1"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.76rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase" }}>
                            Box 3: Design Professional, Plans and Specifications
                          </span>
                          <span style={{ fontSize: "0.70rem", background: "#dbeafe", color: "#1e40af", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                            NBC Form B-07 Box 3
                          </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Architect / Civil Engineer Name</label>
                            <input type="text" value={formData.architectName || formData.signDesignerName || ""} onChange={e => { handleFieldChange("architectName", e.target.value); handleFieldChange("signDesignerName", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", fontWeight: "700" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Professional Address</label>
                            <input type="text" value={formData.architectAddress || formData.signDesignerAddress || ""} onChange={e => { handleFieldChange("architectAddress", e.target.value); handleFieldChange("signDesignerAddress", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC No.</label>
                            <input type="text" value={formData.architectPRC || formData.signDesignerPRC || ""} onChange={e => { handleFieldChange("architectPRC", e.target.value); handleFieldChange("signDesignerPRC", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC Validity</label>
                            <input type="text" value={formData.architectPRCValidity || formData.signDesignerPRCValidity || ""} onChange={e => { handleFieldChange("architectPRCValidity", e.target.value); handleFieldChange("signDesignerPRCValidity", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR No.</label>
                            <input type="text" value={formData.architectPTR || formData.signDesignerPTR || ""} onChange={e => { handleFieldChange("architectPTR", e.target.value); handleFieldChange("signDesignerPTR", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>TIN</label>
                            <input type="text" value={formData.architectTIN || formData.signDesignerTIN || ""} onChange={e => { handleFieldChange("architectTIN", e.target.value); handleFieldChange("signDesignerTIN", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR Date Issued</label>
                            <input type="text" value={formData.architectPTRIssued || formData.signDesignerPTRIssued || ""} onChange={e => { handleFieldChange("architectPTRIssued", e.target.value); handleFieldChange("signDesignerPTRIssued", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR Issued at</label>
                            <input type="text" value={formData.architectPTRIssuedAt || formData.signDesignerPTRIssuedAt || ""} onChange={e => { handleFieldChange("architectPTRIssuedAt", e.target.value); handleFieldChange("signDesignerPTRIssuedAt", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Signed</label>
                            <input type="text" value={formData.architectSignedDate || formData.signDesignerSignedDate || "Sep 26, 2026"} onChange={e => { handleFieldChange("architectSignedDate", e.target.value); handleFieldChange("signDesignerSignedDate", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>
                        <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                          <SignatureCreator
                            value={formData.architectSignature || formData.signDesignerSignature}
                            onChange={sig => { handleFieldChange("architectSignature", sig); handleFieldChange("signDesignerSignature", sig); }}
                            label={`Designer E-Signature (Box 3 - ${formData.architectName || formData.signDesignerName || "Design Professional"})`}
                          />
                        </div>
                      </div>

                      {/* Section 5: Box 4 Full-Time Inspector and Supervisor of Construction Works */}
                      <div style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "#f8fafc",
                        border: "1px solid #cbd5e1"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.76rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase" }}>
                            Box 4: Full-Time Inspector and Supervisor
                          </span>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.74rem", fontWeight: "700", color: "#2563eb" }}>
                            <input
                              type="checkbox"
                              checked={Boolean(formData.sameAsDesignSignSupervisor)}
                              onChange={e => handleFieldChange("sameAsDesignSignSupervisor", e.target.checked)}
                              style={{ accentColor: "#2563eb" }}
                            />
                            Same as Design Professional (Box 3)
                          </label>
                        </div>
                        {!formData.sameAsDesignSignSupervisor ? (
                          <>
                            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Supervisor Name</label>
                                <input type="text" value={formData.signSupervisorName || formData.civilEngineerName || ""} onChange={e => handleFieldChange("signSupervisorName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", fontWeight: "700" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Supervisor Address</label>
                                <input type="text" value={formData.signSupervisorAddress || formData.civilEngineerAddress || ""} onChange={e => handleFieldChange("signSupervisorAddress", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC No.</label>
                                <input type="text" value={formData.signSupervisorPRC || formData.civilEngineerPRC || ""} onChange={e => handleFieldChange("signSupervisorPRC", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC Validity</label>
                                <input type="text" value={formData.signSupervisorPRCValidity || formData.civilEngineerPRCValidity || ""} onChange={e => handleFieldChange("signSupervisorPRCValidity", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR No.</label>
                                <input type="text" value={formData.signSupervisorPTR || formData.civilEngineerPTR || ""} onChange={e => handleFieldChange("signSupervisorPTR", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>TIN</label>
                                <input type="text" value={formData.signSupervisorTIN || formData.civilEngineerTIN || ""} onChange={e => handleFieldChange("signSupervisorTIN", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR Date Issued</label>
                                <input type="text" value={formData.signSupervisorPTRIssued || formData.civilEngineerPTRIssued || ""} onChange={e => handleFieldChange("signSupervisorPTRIssued", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR Issued at</label>
                                <input type="text" value={formData.signSupervisorPTRIssuedAt || formData.civilEngineerPTRIssuedAt || ""} onChange={e => handleFieldChange("signSupervisorPTRIssuedAt", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Signed</label>
                                <input type="text" value={formData.signSupervisorSignedDate || "Sep 26, 2026"} onChange={e => handleFieldChange("signSupervisorSignedDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                            </div>
                            <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                              <SignatureCreator
                                value={formData.signSupervisorSignature || formData.civilEngineerSignature}
                                onChange={sig => handleFieldChange("signSupervisorSignature", sig)}
                                label={`Supervisor E-Signature (Box 4 - ${formData.signSupervisorName || "Supervisor"})`}
                              />
                            </div>
                          </>
                        ) : (
                          <div style={{ marginTop: "0.5rem", padding: "8px 12px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "0.76rem" }}>
                            Using identical credentials and signature from Box 3 Design Professional ({formData.architectName || formData.signDesignerName || "Architect"}).
                          </div>
                        )}
                      </div>

                      {/* Section 6: Box 5 Applicant (Building Owner / Signboard Owner) */}
                      <div style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "#f8fafc",
                        border: "1px solid #cbd5e1"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.76rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase" }}>
                            Box 5: Applicant (Building Owner / Signboard Owner)
                          </span>
                          <span style={{ fontSize: "0.70rem", background: "#dbeafe", color: "#1e40af", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                            NBC Form B-07 Box 5
                          </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Applicant Name</label>
                            <input type="text" value={formData.applicantName || ""} onChange={e => handleFieldChange("applicantName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", fontWeight: "700" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Applicant Address</label>
                            <input type="text" value={formData.applicantAddress || ""} onChange={e => handleFieldChange("applicantAddress", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>C.T.C. No.</label>
                            <input type="text" value={formData.applicantCtcNo || formData.signApplicantCtcNo || formData.govIdNo || ""} onChange={e => { handleFieldChange("applicantCtcNo", e.target.value); handleFieldChange("signApplicantCtcNo", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Issued</label>
                            <input type="text" value={formData.applicantGovIdDateIssued || formData.govIdDateIssued || ""} onChange={e => handleFieldChange("applicantGovIdDateIssued", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Place Issued</label>
                            <input type="text" value={formData.applicantGovIdPlaceIssued || formData.govIdPlaceIssued || ""} onChange={e => handleFieldChange("applicantGovIdPlaceIssued", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Signed</label>
                            <input type="text" value={formData.applicantSignedDate || "Sep 26, 2026"} onChange={e => handleFieldChange("applicantSignedDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>
                        <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                          <SignatureCreator
                            value={formData.applicantSignature}
                            onChange={sig => handleFieldChange("applicantSignature", sig)}
                            label={`Applicant E-Signature (Box 5 - ${formData.applicantName || "Applicant"})`}
                          />
                        </div>
                      </div>

                      {/* Section 7: Box 6 Building Owner */}
                      <div style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "#f8fafc",
                        border: "1px solid #cbd5e1"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.76rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase" }}>
                            Box 6: Building Owner
                          </span>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.74rem", fontWeight: "700", color: "#2563eb" }}>
                            <input
                              type="checkbox"
                              checked={formData.signSameAsApplicantBldgOwner !== false}
                              onChange={e => handleFieldChange("signSameAsApplicantBldgOwner", e.target.checked)}
                              style={{ accentColor: "#2563eb" }}
                            />
                            Same as Applicant (Box 5)
                          </label>
                        </div>
                        {formData.signSameAsApplicantBldgOwner !== false ? (
                          <div style={{ marginTop: "0.5rem", padding: "8px 12px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "0.76rem" }}>
                            Building Owner credentials and signature are identical to Box 5 Applicant ({formData.applicantName || "Building Owner"}).
                          </div>
                        ) : (
                          <>
                            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Building Owner Name</label>
                                <input type="text" value={formData.buildingOwnerName || ""} onChange={e => handleFieldChange("buildingOwnerName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", fontWeight: "700" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Building Owner Address</label>
                                <input type="text" value={formData.buildingOwnerAddress || ""} onChange={e => handleFieldChange("buildingOwnerAddress", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>C.T.C. No.</label>
                                <input type="text" value={formData.buildingOwnerCtcNo || ""} onChange={e => handleFieldChange("buildingOwnerCtcNo", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Issued</label>
                                <input type="text" value={formData.buildingOwnerCtcDateIssued || ""} onChange={e => handleFieldChange("buildingOwnerCtcDateIssued", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Place Issued</label>
                                <input type="text" value={formData.buildingOwnerCtcPlaceIssued || ""} onChange={e => handleFieldChange("buildingOwnerCtcPlaceIssued", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Signed</label>
                                <input type="text" value={formData.buildingOwnerSignedDate || "Jan 08, 2026"} onChange={e => handleFieldChange("buildingOwnerSignedDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                            </div>
                            <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                              <SignatureCreator
                                value={formData.buildingOwnerSignature}
                                onChange={sig => handleFieldChange("buildingOwnerSignature", sig)}
                                label={`Building Owner E-Signature (Box 6 - ${formData.buildingOwnerName || "Building Owner"})`}
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Section 8: Box 7 With My Consent: Lot Owner */}
                      <div style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "#f8fafc",
                        border: "1px solid #cbd5e1"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.76rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase" }}>
                            Box 7: With My Consent (Lot Owner)
                          </span>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.74rem", fontWeight: "700", color: "#2563eb" }}>
                            <input
                              type="checkbox"
                              checked={Boolean(formData.lotOwnerConsent)}
                              onChange={e => handleFieldChange("lotOwnerConsent", e.target.checked)}
                              style={{ accentColor: "#2563eb" }}
                            />
                            Include Box 7 (Lot Owner Consent)
                          </label>
                        </div>
                        {formData.lotOwnerConsent && (
                          <>
                            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Lot Owner Name</label>
                                <input type="text" value={formData.lotOwnerName || ""} onChange={e => handleFieldChange("lotOwnerName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", fontWeight: "700" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Lot Owner Address</label>
                                <input type="text" value={formData.lotOwnerAddress || ""} onChange={e => handleFieldChange("lotOwnerAddress", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>C.T.C. / Gov ID No.</label>
                                <input type="text" value={formData.lotOwnerGovIdNo || ""} onChange={e => handleFieldChange("lotOwnerGovIdNo", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Issued</label>
                                <input type="text" value={formData.lotOwnerGovIdDateIssued || ""} onChange={e => handleFieldChange("lotOwnerGovIdDateIssued", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Place Issued</label>
                                <input type="text" value={formData.lotOwnerGovIdPlaceIssued || ""} onChange={e => handleFieldChange("lotOwnerGovIdPlaceIssued", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Signed</label>
                                <input type="text" value={formData.lotOwnerSignedDate || "Jan 08, 2026"} onChange={e => handleFieldChange("lotOwnerSignedDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                            </div>
                            <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                              <SignatureCreator
                                value={formData.lotOwnerSignature}
                                onChange={sig => handleFieldChange("lotOwnerSignature", sig)}
                                label={`Lot Owner E-Signature (Box 7 - ${formData.lotOwnerName || "Lot Owner"})`}
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Section 9: Box 8 Processing and Evaluation Division (Payment Details & Auto-Generation) */}
                      <div style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "#f8fafc",
                        border: "1px solid #cbd5e1"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                          <div>
                            <span style={{ fontSize: "0.76rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block" }}>
                              Box 8: Processing and Evaluation Division
                            </span>
                            <span style={{ fontSize: "0.70rem", color: "#64748b" }}>
                              Official receipt and payment details (auto-populated when payment is confirmed)
                            </span>
                          </div>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.74rem", fontWeight: "700", color: "#166534", background: "#dcfce7", padding: "4px 8px", borderRadius: "6px" }}>
                            <input
                              type="checkbox"
                              checked={formData.isPaid !== false}
                              onChange={e => handleFieldChange("isPaid", e.target.checked)}
                              style={{ accentColor: "#166534" }}
                            />
                            Payment Confirmed / Paid
                          </label>
                        </div>

                        {formData.isPaid !== false ? (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.75rem" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Fee Paid</label>
                              <input type="text" value={formData.feePaid || "1,250.00"} onChange={e => handleFieldChange("feePaid", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", fontWeight: "700" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Paid</label>
                              <input type="text" value={formData.datePaid || "Jan 15, 2026"} onChange={e => handleFieldChange("datePaid", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Official Receipt No.</label>
                              <input type="text" value={formData.officialReceiptNo || "OR-2026-94812"} onChange={e => handleFieldChange("officialReceiptNo", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", fontWeight: "700", color: "#0284c7" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Issued</label>
                              <input type="text" value={formData.dateIssued || "Jan 16, 2026"} onChange={e => handleFieldChange("dateIssued", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                          </div>
                        ) : (
                          <div style={{ marginTop: "0.5rem", padding: "8px 12px", borderRadius: "8px", background: "#fef9c3", border: "1px solid #fde047", color: "#854d0e", fontSize: "0.76rem" }}>
                            Awaiting payment confirmation. Box 8 will be left blank until admin confirms receipt of payment.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedForm.id === "TSC" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Purpose of Temporary Power</label>
                        <input type="text" value={formData.temporaryServicePurpose || ""} onChange={e => handleFieldChange("temporaryServicePurpose", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Connected Load (kVA)</label>
                        <input type="text" value={formData.temporaryServiceKva || ""} onChange={e => handleFieldChange("temporaryServiceKva", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Service Voltage</label>
                        <input type="text" value={formData.temporaryServiceVoltage || ""} onChange={e => handleFieldChange("temporaryServiceVoltage", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Duration (Days)</label>
                        <input type="text" value={formData.temporaryServiceDuration || ""} onChange={e => handleFieldChange("temporaryServiceDuration", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                    </div>
                  )}

                  {selectedForm.id === "CO" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Building Permit Ref. No.</label>
                        <input type="text" value={formData.applicationNo || ""} onChange={e => handleFieldChange("applicationNo", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Actual Completion Date</label>
                        <input type="text" value={formData.actualCompletionDate || ""} onChange={e => handleFieldChange("actualCompletionDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Actual Floor Area (sq.m.)</label>
                        <input type="text" value={formData.actualFloorArea || formData.floorArea} onChange={e => handleFieldChange("actualFloorArea", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Actual Project Cost (PHP)</label>
                        <input type="text" value={formData.actualProjectCost || formData.projectCost} onChange={e => handleFieldChange("actualProjectCost", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                    </div>
                  )}

                  {selectedForm.id === "CC" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Building Permit Ref. No.</label>
                          <input type="text" value={formData.applicationNo || ""} onChange={e => handleFieldChange("applicationNo", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Construction Supervisor</label>
                          <input type="text" value={formData.constructionSupervisorName || ""} onChange={e => handleFieldChange("constructionSupervisorName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Planned Start Date</label>
                          <input type="text" value={formData.proposedStartDate || ""} onChange={e => handleFieldChange("proposedStartDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Actual Date of Completion</label>
                          <input type="text" value={formData.actualCompletionDate || ""} onChange={e => handleFieldChange("actualCompletionDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Number of Units</label>
                          <input type="text" value={formData.numberOfUnits || "1"} onChange={e => handleFieldChange("numberOfUnits", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Number of Storeys</label>
                          <input type="text" value={formData.proposedStoreys || "2"} onChange={e => handleFieldChange("proposedStoreys", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                        </div>
                      </div>

                      {/* Design Professionals for CC */}
                      <div style={{ marginTop: "0.5rem", padding: "0.75rem", borderRadius: "8px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#1d4ed8" }}>Design Professional (Plans & Specifications)</span>
                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "0.5rem", marginTop: "0.4rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.7rem", color: "#64748b" }}>Architect / Professional Name</label>
                            <input type="text" value={formData.architectName || ""} onChange={e => handleFieldChange("architectName", e.target.value)} style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.7rem", color: "#64748b" }}>PRC No.</label>
                            <input type="text" value={formData.architectPRC || ""} onChange={e => handleFieldChange("architectPRC", e.target.value)} style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.7rem", color: "#64748b" }}>PTR No.</label>
                            <input type="text" value={formData.architectPTR || ""} onChange={e => handleFieldChange("architectPTR", e.target.value)} style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedForm.id === "CFEI" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>CFEI Reference No.</label>
                        <input type="text" value={formData.applicationNo || ""} onChange={e => handleFieldChange("applicationNo", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Electrical Inspector</label>
                        <input type="text" value={formData.cfeiInspectorName || ""} onChange={e => handleFieldChange("cfeiInspectorName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Total Connected Load (kVA)</label>
                        <input type="text" value={formData.electricalConnectedLoad || ""} onChange={e => handleFieldChange("electricalConnectedLoad", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Date of Final Inspection</label>
                        <input type="text" value={formData.actualCompletionDate || "2027-04-30"} onChange={e => handleFieldChange("actualCompletionDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                    </div>
                  )}
                </div>
                )}
              </div>
            )}

            {activeTab === "professionals" && selectedForm.id !== "LC" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Construction Supervisor / Inspector */}
                {(selectedForm.id === "CC" || selectedForm.id === "CO" || selectedForm.id === "CFEI") && (
                      <div style={{ padding: "0.9rem", borderRadius: "12px", background: "#eff6ff", border: "1.5px solid #bfdbfe" }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: "800", color: "#1d4ed8" }}>Project Supervisor / Municipal Inspector</span>
                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>
                              {selectedForm.id === "CFEI" ? "Electrical Inspector Name" : "Construction Supervisor Name"}
                            </label>
                            <input 
                              type="text" 
                              value={selectedForm.id === "CFEI" ? (formData.cfeiInspectorName || "") : (formData.constructionSupervisorName || "")} 
                              onChange={e => handleFieldChange(selectedForm.id === "CFEI" ? "cfeiInspectorName" : "constructionSupervisorName", e.target.value)} 
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} 
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Role / Designation</label>
                            <input 
                              type="text" 
                              value={selectedForm.id === "CFEI" ? "City Electrical Inspector" : "Full-Time In-Charge of Construction"} 
                              readOnly 
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", background: "#f8fafc" }} 
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Architect - Box 3: Design Professional */}
                    {(selectedForm.id === "AP" || selectedForm.id === "FP" || selectedForm.id === "SGP" || selectedForm.id === "CC") && (
                      <div style={{ padding: "0.9rem", borderRadius: "12px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: "800", color: "#1d4ed8" }}>
                            Box 3: DESIGN PROFESSIONAL, PLANS AND SPECIFICATION (Architect)
                          </span>
                          <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600" }}>
                            NBC Form A-01 (Signed & Sealed)
                          </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Architect Full Name (Over Printed Name)</label>
                            <input type="text" value={formData.architectName || ""} onChange={e => handleFieldChange("architectName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Address</label>
                            <input type="text" value={formData.architectAddress || "Sto. Tomas, Pampanga"} onChange={e => handleFieldChange("architectAddress", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>IAPOA No.</label>
                            <input type="text" value={formData.architectIAPOA || "IAPOA-2026-9988"} onChange={e => handleFieldChange("architectIAPOA", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>IAPOA Validity</label>
                            <input type="text" value={formData.architectIAPOAValidity || "2028-12-31"} onChange={e => handleFieldChange("architectIAPOAValidity", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC No.</label>
                            <input type="text" value={formData.architectPRC || ""} onChange={e => handleFieldChange("architectPRC", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC Validity</label>
                            <input type="text" value={formData.architectPRCValidity || "2028-09-15"} onChange={e => handleFieldChange("architectPRCValidity", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR No.</label>
                            <input type="text" value={formData.architectPTR || ""} onChange={e => handleFieldChange("architectPTR", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Issued</label>
                            <input type="text" value={formData.architectPTRIssued || "Jan 08, 2026"} onChange={e => handleFieldChange("architectPTRIssued", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Issued at</label>
                            <input type="text" value={formData.architectPTRIssuedAt || "Sto. Tomas"} onChange={e => handleFieldChange("architectPTRIssuedAt", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>TIN</label>
                            <input type="text" value={formData.architectTIN || "234-567-890-000"} onChange={e => handleFieldChange("architectTIN", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>

                        <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                          <SignatureCreator
                            value={formData.fencingDesignerSignature || formData.architectSignature}
                            onChange={sig => {
                              handleFieldChange("architectSignature", sig);
                              handleFieldChange("fencingDesignerSignature", sig);
                            }}
                            label={`Design Professional E-Signature (${formData.architectName || "Architect"})`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Architect / Supervisor - Box 4: Supervisor */}
                    {(selectedForm.id === "AP" || selectedForm.id === "FP" || selectedForm.id === "SGP") && (
                      <div style={{ padding: "0.9rem", borderRadius: "12px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: "800", color: "#0284c7" }}>
                            {selectedForm.id === "FP" ? "Box 3: FULL-TIME INSPECTOR AND SUPERVISOR OF CONSTRUCTION WORKS" : "Box 4: FULL-TIME INSPECTOR AND SUPERVISOR OF CONSTRUCTION WORKS"}
                          </span>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: "700", color: "#334155", cursor: "pointer" }}>
                            <input 
                              type="checkbox" 
                              checked={!!(formData.sameAsDesignArchitect || formData.sameAsDesignFencingSupervisor || formData.sameAsDesignSignSupervisor)} 
                              onChange={e => {
                                handleFieldChange("sameAsDesignArchitect", e.target.checked);
                                handleFieldChange("sameAsDesignFencingSupervisor", e.target.checked);
                                handleFieldChange("sameAsDesignSignSupervisor", e.target.checked);
                              }} 
                            />
                            Same as Design Professional
                          </label>
                        </div>

                        {!(formData.sameAsDesignArchitect || formData.sameAsDesignFencingSupervisor || formData.sameAsDesignSignSupervisor) ? (
                          <>
                            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Supervisor Full Name</label>
                                <input type="text" value={formData.signSupervisorName || formData.supervisorArchitectName || formData.fencingSupervisorName || ""} onChange={e => { handleFieldChange("supervisorArchitectName", e.target.value); handleFieldChange("fencingSupervisorName", e.target.value); handleFieldChange("signSupervisorName", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Address</label>
                                <input type="text" value={formData.signSupervisorAddress || formData.supervisorArchitectAddress || formData.fencingSupervisorAddress || "Sto. Tomas, Pampanga"} onChange={e => { handleFieldChange("supervisorArchitectAddress", e.target.value); handleFieldChange("fencingSupervisorAddress", e.target.value); handleFieldChange("signSupervisorAddress", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>IAPOA / Affiliation No.</label>
                                <input type="text" value={formData.supervisorArchitectIAPOA || "IAPOA-2026-8877"} onChange={e => handleFieldChange("supervisorArchitectIAPOA", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Validity Date</label>
                                <input type="text" value={formData.supervisorArchitectIAPOAValidity || "2027-12-31"} onChange={e => handleFieldChange("supervisorArchitectIAPOAValidity", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC No.</label>
                                <input type="text" value={formData.signSupervisorPRC || formData.supervisorArchitectPRC || formData.fencingSupervisorPRC || ""} onChange={e => { handleFieldChange("supervisorArchitectPRC", e.target.value); handleFieldChange("fencingSupervisorPRC", e.target.value); handleFieldChange("signSupervisorPRC", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC Validity</label>
                                <input type="text" value={formData.signSupervisorPRCValidity || formData.supervisorArchitectPRCValidity || formData.fencingSupervisorPRCValidity || "2027-08-20"} onChange={e => { handleFieldChange("supervisorArchitectPRCValidity", e.target.value); handleFieldChange("fencingSupervisorPRCValidity", e.target.value); handleFieldChange("signSupervisorPRCValidity", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR No.</label>
                                <input type="text" value={formData.signSupervisorPTR || formData.supervisorArchitectPTR || formData.fencingSupervisorPTR || ""} onChange={e => { handleFieldChange("supervisorArchitectPTR", e.target.value); handleFieldChange("fencingSupervisorPTR", e.target.value); handleFieldChange("signSupervisorPTR", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Issued</label>
                                <input type="text" value={formData.signSupervisorPTRIssued || formData.supervisorArchitectPTRIssued || formData.fencingSupervisorPTRIssued || "Jan 10, 2026"} onChange={e => { handleFieldChange("supervisorArchitectPTRIssued", e.target.value); handleFieldChange("fencingSupervisorPTRIssued", e.target.value); handleFieldChange("signSupervisorPTRIssued", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Issued at</label>
                                <input type="text" value={formData.signSupervisorPTRIssuedAt || formData.supervisorArchitectPTRIssuedAt || formData.fencingSupervisorPTRIssuedAt || "Sto. Tomas"} onChange={e => { handleFieldChange("supervisorArchitectPTRIssuedAt", e.target.value); handleFieldChange("fencingSupervisorPTRIssuedAt", e.target.value); handleFieldChange("signSupervisorPTRIssuedAt", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>TIN</label>
                                <input type="text" value={formData.signSupervisorTIN || formData.supervisorArchitectTIN || formData.fencingSupervisorTIN || "345-678-901-000"} onChange={e => { handleFieldChange("supervisorArchitectTIN", e.target.value); handleFieldChange("fencingSupervisorTIN", e.target.value); handleFieldChange("signSupervisorTIN", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                            </div>

                            <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                              <SignatureCreator
                                value={formData.signSupervisorSignature || formData.fencingSupervisorSignature || formData.supervisorArchitectSignature}
                                onChange={sig => {
                                  handleFieldChange("supervisorArchitectSignature", sig);
                                  handleFieldChange("fencingSupervisorSignature", sig);
                                  handleFieldChange("signSupervisorSignature", sig);
                                }}
                                label={`Supervisor E-Signature (${formData.signSupervisorName || formData.supervisorArchitectName || formData.fencingSupervisorName || "Supervisor"})`}
                              />
                            </div>
                          </>
                        ) : (
                          <div style={{ marginTop: "0.5rem", padding: "8px 12px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "0.76rem" }}>
                            Using identical credentials and e-signature from Box 3 / Design Professional ({formData.architectName || formData.fencingDesignerName || "Architect"}).
                          </div>
                        )}
                      </div>
                    )}

                    {/* Civil Engineer - Box 3: Design Professional */}
                    {(selectedForm.id === "BP" || selectedForm.id === "SP" || selectedForm.id === "DP" || selectedForm.id === "EXP" || selectedForm.id === "SGP" || selectedForm.id === "CO" || selectedForm.id === "CC") && (
                      <div style={{ padding: "0.9rem", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#047857" }}>
                          Box 3: DESIGN PROFESSIONAL, PLANS AND SPECIFICATIONS (Civil / Structural Engineer)
                        </span>
                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Full Name</label>
                            <input type="text" value={formData.civilEngineerName || ""} onChange={e => handleFieldChange("civilEngineerName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Address</label>
                            <input type="text" value={formData.civilEngineerAddress || "Sto. Tomas, Pampanga"} onChange={e => handleFieldChange("civilEngineerAddress", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC No.</label>
                            <input type="text" value={formData.civilEngineerPRC || ""} onChange={e => handleFieldChange("civilEngineerPRC", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Validity</label>
                            <input type="text" value={formData.civilEngineerPRCValidity || "2027-06-20"} onChange={e => handleFieldChange("civilEngineerPRCValidity", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>TIN</label>
                            <input type="text" value={formData.civilEngineerTIN || "345-678-901-000"} onChange={e => handleFieldChange("civilEngineerTIN", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR No.</label>
                            <input type="text" value={formData.civilEngineerPTR || ""} onChange={e => handleFieldChange("civilEngineerPTR", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Issued</label>
                            <input type="text" value={formData.civilEngineerPTRIssued || "Jan 10, 2026"} onChange={e => handleFieldChange("civilEngineerPTRIssued", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Issued at</label>
                            <input type="text" value={formData.civilEngineerPTRIssuedAt || "Sto. Tomas"} onChange={e => handleFieldChange("civilEngineerPTRIssuedAt", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Signed</label>
                            <input type="text" value={formData.civilEngineerSignedDate || "Jan 08, 2026"} onChange={e => handleFieldChange("civilEngineerSignedDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>

                        {(selectedForm.id === "SP" || selectedForm.id === "DP") && (
                          <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                            <SignatureCreator
                              value={formData.demolitionSupervisorSignature || formData.civilEngineerSignature}
                              onChange={sig => {
                                handleFieldChange("civilEngineerSignature", sig);
                                handleFieldChange("demolitionSupervisorSignature", sig);
                              }}
                              label={selectedForm.id === "DP" 
                                ? `Demolition Supervisor E-Signature (Box 2 - ${formData.demolitionSupervisorName || formData.civilEngineerName || "Engr. Roberto Cruz, CE"})`
                                : `Civil Engineer E-Signature (Box 3 - ${formData.civilEngineerName || "Civil Engineer"})`}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Civil Engineer - Box 4: Supervisor / In-Charge of Civil/Structural Works */}
                    {(selectedForm.id === "BP" || selectedForm.id === "SP") && (
                      <div style={{ padding: "0.9rem", borderRadius: "12px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: "800", color: "#047857" }}>
                            Box 4: SUPERVISOR / IN-CHARGE OF CIVIL/STRUCTURAL WORKS (Civil Engineer)
                          </span>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: "700", color: "#334155", cursor: "pointer" }}>
                            <input 
                              type="checkbox" 
                              checked={!!formData.sameAsDesignCivilEngineer} 
                              onChange={e => handleFieldChange("sameAsDesignCivilEngineer", e.target.checked)} 
                            />
                            Same as Design Professional (Box 3)
                          </label>
                        </div>

                        {!formData.sameAsDesignCivilEngineer ? (
                          <>
                            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Supervisor Civil Engineer Full Name</label>
                                <input type="text" value={formData.supervisorCivilEngineerName || ""} onChange={e => handleFieldChange("supervisorCivilEngineerName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Address</label>
                                <input type="text" value={formData.supervisorCivilEngineerAddress || "Sto. Tomas, Pampanga"} onChange={e => handleFieldChange("supervisorCivilEngineerAddress", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC No.</label>
                                <input type="text" value={formData.supervisorCivilEngineerPRC || ""} onChange={e => handleFieldChange("supervisorCivilEngineerPRC", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC Validity</label>
                                <input type="text" value={formData.supervisorCivilEngineerPRCValidity || "2027-06-20"} onChange={e => handleFieldChange("supervisorCivilEngineerPRCValidity", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR No.</label>
                                <input type="text" value={formData.supervisorCivilEngineerPTR || ""} onChange={e => handleFieldChange("supervisorCivilEngineerPTR", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Issued</label>
                                <input type="text" value={formData.supervisorCivilEngineerPTRIssued || "Jan 10, 2026"} onChange={e => handleFieldChange("supervisorCivilEngineerPTRIssued", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Issued at</label>
                                <input type="text" value={formData.supervisorCivilEngineerPTRIssuedAt || "Sto. Tomas"} onChange={e => handleFieldChange("supervisorCivilEngineerPTRIssuedAt", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Signed</label>
                                <input type="text" value={formData.supervisorCivilEngineerSignedDate || "Jan 08, 2026"} onChange={e => handleFieldChange("supervisorCivilEngineerSignedDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                            </div>
                            <div style={{ marginTop: "0.5rem" }}>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>TIN</label>
                              <input type="text" value={formData.supervisorCivilEngineerTIN || "345-678-901-000"} onChange={e => handleFieldChange("supervisorCivilEngineerTIN", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                            {selectedForm.id === "SP" && (
                              <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                                <SignatureCreator
                                  value={formData.supervisorCivilEngineerSignature}
                                  onChange={sig => handleFieldChange("supervisorCivilEngineerSignature", sig)}
                                  label={`Supervisor Civil Engineer E-Signature (Box 4 - ${formData.supervisorCivilEngineerName || "Supervisor Civil Engineer"})`}
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ marginTop: "0.5rem", padding: "8px 12px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "0.76rem" }}>
                            Using identical credentials and signature from Box 3 (Design Professional: {formData.civilEngineerName || "Civil Engineer"}).
                          </div>
                        )}
                      </div>
                    )}

                    {/* Electrical Engineer */}
                    {(selectedForm.id === "EP" || selectedForm.id === "TSC") && (
                      <div style={{ padding: "0.9rem", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#b45309" }}>Professional Electrical Engineer (PEE)</span>
                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Full Name</label>
                            <input type="text" value={formData.electricalEngineerName || ""} onChange={e => handleFieldChange("electricalEngineerName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Address</label>
                            <input type="text" value={formData.electricalEngineerAddress || "Sto. Tomas, Pampanga"} onChange={e => handleFieldChange("electricalEngineerAddress", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC No.</label>
                            <input type="text" value={formData.electricalEngineerPRC || ""} onChange={e => handleFieldChange("electricalEngineerPRC", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Validity</label>
                            <input type="text" value={formData.electricalEngineerPRCValidity || "2028-11-30"} onChange={e => handleFieldChange("electricalEngineerPRCValidity", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>TIN</label>
                            <input type="text" value={formData.electricalEngineerTIN || "456-789-012-000"} onChange={e => handleFieldChange("electricalEngineerTIN", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR No.</label>
                            <input type="text" value={formData.electricalEngineerPTR || ""} onChange={e => handleFieldChange("electricalEngineerPTR", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Issued</label>
                            <input type="text" value={formData.electricalEngineerPTRIssued || "Jan 12, 2026"} onChange={e => handleFieldChange("electricalEngineerPTRIssued", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Issued at</label>
                            <input type="text" value={formData.electricalEngineerPTRIssuedAt || "Sto. Tomas"} onChange={e => handleFieldChange("electricalEngineerPTRIssuedAt", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>

                        {(selectedForm.id === "EP" || selectedForm.id === "TSC") && (
                          <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                            <SignatureCreator
                              value={formData.electricalEngineerSignature}
                              onChange={sig => handleFieldChange("electricalEngineerSignature", sig)}
                              label={`Electrical Engineer E-Signature (Box 2 - ${formData.electricalEngineerName || "Professional Electrical Engineer"})`}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Box 3: Electrical Contractor (200 Ampere Main and Above) */}
                    {(selectedForm.id === "EP" || selectedForm.id === "TSC") && (
                      <div style={{ padding: "0.9rem", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#b45309" }}>
                            Box 3: Electrical Contractor (200 Ampere Main and Above)
                          </span>
                          <span style={{ fontSize: "0.68rem", fontWeight: "600", color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px" }}>
                            Special Electrical • PCAB Licensed
                          </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.4fr", gap: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Contractor Name / Firm</label>
                            <input 
                              type="text" 
                              value={formData.electricalContractorName || ""} 
                              onChange={e => handleFieldChange("electricalContractorName", e.target.value)} 
                              placeholder="VOLTMAX ELECTRICAL SERVICES & CONTRACTING INC."
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} 
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PCAB Lic. No. (Special Electrical)</label>
                            <input 
                              type="text" 
                              value={formData.electricalContractorPcab || ""} 
                              onChange={e => handleFieldChange("electricalContractorPcab", e.target.value)} 
                              placeholder="PCAB-EL-2026-9811"
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} 
                            />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.4fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Contractor Business Address</label>
                            <input 
                              type="text" 
                              value={formData.electricalContractorAddress || ""} 
                              onChange={e => handleFieldChange("electricalContractorAddress", e.target.value)} 
                              placeholder="San Fernando, Pampanga"
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} 
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Tel. / Fax No.</label>
                            <input 
                              type="text" 
                              value={formData.electricalContractorTel || ""} 
                              onChange={e => handleFieldChange("electricalContractorTel", e.target.value)} 
                              placeholder="0918-777-8899"
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} 
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Box 4: Person In-Charge of Installation */}
                    {(selectedForm.id === "EP" || selectedForm.id === "TSC") && (
                      <div style={{ padding: "0.9rem", borderRadius: "12px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: "800", color: "#b45309" }}>
                            Box 4: PERSON IN-CHARGE OF INSTALLATION
                          </span>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: "700", color: "#334155", cursor: "pointer" }}>
                            <input 
                              type="checkbox" 
                              checked={!!formData.sameAsDesignElectricalEngineer} 
                              onChange={e => handleFieldChange("sameAsDesignElectricalEngineer", e.target.checked)} 
                            />
                            Same as Design Professional (Box 2)
                          </label>
                        </div>

                        {!formData.sameAsDesignElectricalEngineer ? (
                          <>
                            {/* Professional Role Radio */}
                            <div style={{ marginTop: "0.6rem", padding: "8px 10px", borderRadius: "8px", background: "#fffbeb", border: "1px solid #fef3c7" }}>
                              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#92400e", marginBottom: "4px" }}>
                                Professional Classification
                              </label>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                                <label style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.76rem", fontWeight: "600", color: "#78350f", cursor: "pointer" }}>
                                  <input
                                    type="radio"
                                    name="installationInChargeRole"
                                    value="PEE"
                                    checked={formData.installationInChargeRole === "PEE" || !formData.installationInChargeRole}
                                    onChange={() => handleFieldChange("installationInChargeRole", "PEE")}
                                    style={{ accentColor: "#b45309" }}
                                  />
                                  <span>PROFESSIONAL ELECTRICAL ENGINEER</span>
                                </label>
                                <label style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.76rem", fontWeight: "600", color: "#78350f", cursor: "pointer" }}>
                                  <input
                                    type="radio"
                                    name="installationInChargeRole"
                                    value="REE"
                                    checked={formData.installationInChargeRole === "REE"}
                                    onChange={() => handleFieldChange("installationInChargeRole", "REE")}
                                    style={{ accentColor: "#b45309" }}
                                  />
                                  <span>REGISTERED ELECTRICAL ENGINEER</span>
                                </label>
                                <label style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.76rem", fontWeight: "600", color: "#78350f", cursor: "pointer" }}>
                                  <input
                                    type="radio"
                                    name="installationInChargeRole"
                                    value="RME"
                                    checked={formData.installationInChargeRole === "RME"}
                                    onChange={() => handleFieldChange("installationInChargeRole", "RME")}
                                    style={{ accentColor: "#b45309" }}
                                  />
                                  <span>REGISTERED MASTER ELECTRICIAN (&lt;600V &amp; 500kVA)</span>
                                </label>
                              </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Full Name</label>
                                <input type="text" value={formData.installationInChargeName || ""} onChange={e => handleFieldChange("installationInChargeName", e.target.value)} placeholder="ENGR. EDGAR C. MENDOZA, REE" style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Address</label>
                                <input type="text" value={formData.installationInChargeAddress || "Sto. Tomas, Pampanga"} onChange={e => handleFieldChange("installationInChargeAddress", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC Reg No.</label>
                                <input type="text" value={formData.installationInChargePRC || ""} onChange={e => handleFieldChange("installationInChargePRC", e.target.value)} placeholder="0045678" style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Validity</label>
                                <input type="text" value={formData.installationInChargePRCValidity || "2028-08-20"} onChange={e => handleFieldChange("installationInChargePRCValidity", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Tel / Fax No.</label>
                                <input type="text" value={formData.installationInChargeTel || "0917-888-1234"} onChange={e => handleFieldChange("installationInChargeTel", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>P.T.R No.</label>
                                <input type="text" value={formData.installationInChargePTR || ""} onChange={e => handleFieldChange("installationInChargePTR", e.target.value)} placeholder="PTR-ST-556677" style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Issued</label>
                                <input type="text" value={formData.installationInChargePTRIssued || "Jan 14, 2026"} onChange={e => handleFieldChange("installationInChargePTRIssued", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Place Issued</label>
                                <input type="text" value={formData.installationInChargePTRIssuedAt || "Sto. Tomas"} onChange={e => handleFieldChange("installationInChargePTRIssuedAt", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Signed</label>
                                <input type="text" value={formData.installationInChargeSignedDate || "Jan 15, 2026"} onChange={e => handleFieldChange("installationInChargeSignedDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                            </div>
                            <div style={{ marginTop: "0.5rem" }}>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>T.I.N</label>
                              <input type="text" value={formData.installationInChargeTIN || "345-678-901-000"} onChange={e => handleFieldChange("installationInChargeTIN", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                            <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                              <SignatureCreator
                                value={formData.installationInChargeSignature}
                                onChange={sig => handleFieldChange("installationInChargeSignature", sig)}
                                label={`Person In-Charge of Installation E-Signature (Box 4 - ${formData.installationInChargeName || "Person In-Charge"})`}
                              />
                            </div>
                          </>
                        ) : (
                          <div style={{ marginTop: "0.5rem", padding: "8px 12px", borderRadius: "8px", background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e", fontSize: "0.76rem" }}>
                            Using identical credentials and signature from Box 2 (Design Professional: {formData.electricalEngineerName || "Professional Electrical Engineer"}).
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mechanical Engineer - Box 3: Design Professional & Box 4: Supervisor */}
                    {selectedForm.id === "MP" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {/* BOX 3: DESIGN PROFESSIONAL */}
                        <div style={{ padding: "0.9rem", borderRadius: "12px", background: "#fffbeb", border: "1.5px solid #fde68a" }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: "800", color: "#b45309" }}>
                            Box 3: DESIGN PROFESSIONAL, PLANS AND SPECIFICATION (PME)
                          </span>
                          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Full Name</label>
                              <input type="text" value={formData.mechanicalEngineerName || ""} onChange={e => handleFieldChange("mechanicalEngineerName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Address</label>
                              <input type="text" value={formData.mechanicalEngineerAddress || "Sto. Tomas, Pampanga"} onChange={e => handleFieldChange("mechanicalEngineerAddress", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC No.</label>
                              <input type="text" value={formData.mechanicalEngineerPRC || ""} onChange={e => handleFieldChange("mechanicalEngineerPRC", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Validity</label>
                              <input type="text" value={formData.mechanicalEngineerPRCValidity || "2027-12-18"} onChange={e => handleFieldChange("mechanicalEngineerPRCValidity", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>TIN</label>
                              <input type="text" value={formData.mechanicalEngineerTIN || "678-901-234-000"} onChange={e => handleFieldChange("mechanicalEngineerTIN", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR No.</label>
                              <input type="text" value={formData.mechanicalEngineerPTR || ""} onChange={e => handleFieldChange("mechanicalEngineerPTR", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Issued</label>
                              <input type="text" value={formData.mechanicalEngineerPTRDate || formData.mechanicalEngineerPTRIssued || "Jan 18, 2026"} onChange={e => handleFieldChange("mechanicalEngineerPTRDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Issued at</label>
                              <input type="text" value={formData.mechanicalEngineerPTRIssuedAt || "Sto. Tomas"} onChange={e => handleFieldChange("mechanicalEngineerPTRIssuedAt", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Signed</label>
                              <input type="text" value={formData.mechanicalEngineerSignedDate || "Jan 19, 2026"} onChange={e => handleFieldChange("mechanicalEngineerSignedDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                          </div>
                          <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #fde68a" }}>
                            <SignatureCreator
                              value={formData.mechanicalEngineerSignature}
                              onChange={sig => handleFieldChange("mechanicalEngineerSignature", sig)}
                              label={`PME E-Signature (Box 3 - ${formData.mechanicalEngineerName || "Professional Mechanical Engineer"})`}
                            />
                          </div>
                        </div>

                        {/* BOX 4: SUPERVISOR/IN-CHARGE OF MECHANICAL WORKS */}
                        <div style={{ padding: "0.9rem", borderRadius: "12px", background: "#f0fdf4", border: "1.5px solid #86efac" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.82rem", fontWeight: "800", color: "#166534" }}>
                              Box 4: SUPERVISOR / IN-CHARGE OF MECHANICAL WORKS
                            </span>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: "700", color: "#15803d", cursor: "pointer" }}>
                              <input 
                                type="checkbox" 
                                checked={!!formData.sameAsDesignMechanicalEngineer} 
                                onChange={e => {
                                  const checked = e.target.checked;
                                  handleFieldChange("sameAsDesignMechanicalEngineer", checked);
                                  if (checked) {
                                    handleFieldChange("mechSupervisorName", formData.mechanicalEngineerName);
                                    handleFieldChange("mechSupervisorAddress", formData.mechanicalEngineerAddress);
                                    handleFieldChange("mechSupervisorPRC", formData.mechanicalEngineerPRC);
                                    handleFieldChange("mechSupervisorPRCValidity", formData.mechanicalEngineerPRCValidity);
                                    handleFieldChange("mechSupervisorPTR", formData.mechanicalEngineerPTR);
                                    handleFieldChange("mechSupervisorPTRDate", formData.mechanicalEngineerPTRDate);
                                    handleFieldChange("mechSupervisorPTRIssuedAt", formData.mechanicalEngineerPTRIssuedAt);
                                    handleFieldChange("mechSupervisorTIN", formData.mechanicalEngineerTIN);
                                    handleFieldChange("mechSupervisorSignedDate", formData.mechanicalEngineerSignedDate);
                                    handleFieldChange("mechSupervisorSignature", formData.mechanicalEngineerSignature);
                                  }
                                }} 
                              />
                              Same as Design Professional (Box 3)
                            </label>
                          </div>

                          {!formData.sameAsDesignMechanicalEngineer ? (
                            <>
                              {/* Role selection radio buttons */}
                              <div style={{ display: "flex", gap: "1rem", margin: "8px 0 10px 0", padding: "6px 10px", background: "#dcfce7", borderRadius: "6px" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.76rem", fontWeight: formData.mechSupervisorRole === "PME" || !formData.mechSupervisorRole ? "700" : "500", color: "#166534", cursor: "pointer" }}>
                                  <input
                                    type="radio"
                                    name="mechSupervisorRoleRadioTester"
                                    checked={formData.mechSupervisorRole === "PME" || !formData.mechSupervisorRole}
                                    onChange={() => handleFieldChange("mechSupervisorRole", "PME")}
                                    style={{ accentColor: "#16a34a" }}
                                  />
                                  <span>[ ] PROFESSIONAL MECHANICAL ENGINEER</span>
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.76rem", fontWeight: formData.mechSupervisorRole === "ME" ? "700" : "500", color: "#166534", cursor: "pointer" }}>
                                  <input
                                    type="radio"
                                    name="mechSupervisorRoleRadioTester"
                                    checked={formData.mechSupervisorRole === "ME"}
                                    onChange={() => handleFieldChange("mechSupervisorRole", "ME")}
                                    style={{ accentColor: "#16a34a" }}
                                  />
                                  <span>[ ] MECHANICAL ENGINEER</span>
                                </label>
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Supervisor Full Name</label>
                                  <input type="text" value={formData.mechSupervisorName || ""} onChange={e => handleFieldChange("mechSupervisorName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Address</label>
                                  <input type="text" value={formData.mechSupervisorAddress || "Sto. Tomas, Pampanga"} onChange={e => handleFieldChange("mechSupervisorAddress", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC No.</label>
                                  <input type="text" value={formData.mechSupervisorPRC || ""} onChange={e => handleFieldChange("mechSupervisorPRC", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Validity</label>
                                  <input type="text" value={formData.mechSupervisorPRCValidity || "2027-12-18"} onChange={e => handleFieldChange("mechSupervisorPRCValidity", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>TIN</label>
                                  <input type="text" value={formData.mechSupervisorTIN || "678-901-234-000"} onChange={e => handleFieldChange("mechSupervisorTIN", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR No.</label>
                                  <input type="text" value={formData.mechSupervisorPTR || ""} onChange={e => handleFieldChange("mechSupervisorPTR", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Issued</label>
                                  <input type="text" value={formData.mechSupervisorPTRDate || formData.mechSupervisorPTRIssued || "Jan 18, 2026"} onChange={e => handleFieldChange("mechSupervisorPTRDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Issued at</label>
                                  <input type="text" value={formData.mechSupervisorPTRIssuedAt || "Sto. Tomas"} onChange={e => handleFieldChange("mechSupervisorPTRIssuedAt", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Signed</label>
                                  <input type="text" value={formData.mechSupervisorSignedDate || "Jan 19, 2026"} onChange={e => handleFieldChange("mechSupervisorSignedDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                              </div>
                              <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #86efac" }}>
                                <SignatureCreator
                                  value={formData.mechSupervisorSignature}
                                  onChange={sig => handleFieldChange("mechSupervisorSignature", sig)}
                                  label={`Supervisor E-Signature (Box 4 - ${formData.mechSupervisorName || "Supervisor Mechanical Engineer"})`}
                                />
                              </div>
                            </>
                          ) : (
                            <div style={{ marginTop: "0.5rem", padding: "8px 12px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "0.76rem" }}>
                              Using identical credentials and signature from Box 3 (Design Professional: {formData.mechanicalEngineerName || "ENGR. LEONARDO V. TORRES, PME"}).
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Electronics Engineer & Supervisor */}
                    {selectedForm.id === "EL" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {/* BOX 3: PECE */}
                        <div style={{ padding: "1rem", borderRadius: "12px", background: "#f0fdfa", border: "1.5px solid #5eead4" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#0f766e", textTransform: "uppercase" }}>
                            BOX 3: DESIGN PROFESSIONAL, PLANS AND SPECIFICATIONS (PECE)
                          </span>
                          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Full Name</label>
                              <input type="text" value={formData.electronicsEngineerName || ""} onChange={e => handleFieldChange("electronicsEngineerName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Address</label>
                              <input type="text" value={formData.electronicsEngineerAddress || "Sto. Tomas, Pampanga"} onChange={e => handleFieldChange("electronicsEngineerAddress", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC No.</label>
                              <input type="text" value={formData.electronicsEngineerPRC || ""} onChange={e => handleFieldChange("electronicsEngineerPRC", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Validity</label>
                              <input type="text" value={formData.electronicsEngineerPRCValidity || "2028-05-12"} onChange={e => handleFieldChange("electronicsEngineerPRCValidity", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>TIN</label>
                              <input type="text" value={formData.electronicsEngineerTIN || "789-012-345-000"} onChange={e => handleFieldChange("electronicsEngineerTIN", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR No.</label>
                              <input type="text" value={formData.electronicsEngineerPTR || ""} onChange={e => handleFieldChange("electronicsEngineerPTR", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Issued</label>
                              <input type="text" value={formData.electronicsEngineerPTRIssued || "Jan 20, 2026"} onChange={e => handleFieldChange("electronicsEngineerPTRIssued", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Issued at</label>
                              <input type="text" value={formData.electronicsEngineerPTRIssuedAt || "Sto. Tomas"} onChange={e => handleFieldChange("electronicsEngineerPTRIssuedAt", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Signed</label>
                              <input type="text" value={formData.electronicsEngineerSignedDate || "Jan 20, 2026"} onChange={e => handleFieldChange("electronicsEngineerSignedDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                          </div>
                          <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #5eead4" }}>
                            <SignatureCreator
                              value={formData.electronicsEngineerSignature}
                              onChange={sig => handleFieldChange("electronicsEngineerSignature", sig)}
                              label={`PECE E-Signature (Box 3 - ${formData.electronicsEngineerName || "Professional Electronics Engineer"})`}
                            />
                          </div>
                        </div>

                        {/* BOX 4: SUPERVISOR IN-CHARGE OF ELECTRONICS WORKS */}
                        <div style={{ padding: "1rem", borderRadius: "12px", background: "#f0fdf4", border: "1.5px solid #86efac" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                            <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#166534", textTransform: "uppercase" }}>
                              BOX 4: SUPERVISOR / IN-CHARGE OF ELECTRONICS WORKS
                            </span>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.74rem", fontWeight: "700", color: "#16a34a" }}>
                              <input
                                type="checkbox"
                                checked={Boolean(formData.sameAsDesignElectronicsEngineer)}
                                onChange={e => handleFieldChange("sameAsDesignElectronicsEngineer", e.target.checked)}
                                style={{ accentColor: "#16a34a" }}
                              />
                              Same as Design Professional (PECE)
                            </label>
                          </div>

                          {!formData.sameAsDesignElectronicsEngineer ? (
                            <>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Role</label>
                                  <select
                                    value={formData.electronicsSupervisorRole || "PECE"}
                                    onChange={e => handleFieldChange("electronicsSupervisorRole", e.target.value)}
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", background: "white" }}
                                  >
                                    <option value="PECE">PECE</option>
                                    <option value="ECE">ECE</option>
                                  </select>
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Full Name</label>
                                  <input type="text" value={formData.electronicsSupervisorName || ""} onChange={e => handleFieldChange("electronicsSupervisorName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Address</label>
                                  <input type="text" value={formData.electronicsSupervisorAddress || "Sto. Tomas, Pampanga"} onChange={e => handleFieldChange("electronicsSupervisorAddress", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC No.</label>
                                  <input type="text" value={formData.electronicsSupervisorPRC || ""} onChange={e => handleFieldChange("electronicsSupervisorPRC", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Validity</label>
                                  <input type="text" value={formData.electronicsSupervisorPRCValidity || "2028-05-12"} onChange={e => handleFieldChange("electronicsSupervisorPRCValidity", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>TIN</label>
                                  <input type="text" value={formData.electronicsSupervisorTIN || "789-012-345-000"} onChange={e => handleFieldChange("electronicsSupervisorTIN", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR No.</label>
                                  <input type="text" value={formData.electronicsSupervisorPTR || ""} onChange={e => handleFieldChange("electronicsSupervisorPTR", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Issued</label>
                                  <input type="text" value={formData.electronicsSupervisorPTRDate || "Jan 20, 2026"} onChange={e => handleFieldChange("electronicsSupervisorPTRDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Issued at</label>
                                  <input type="text" value={formData.electronicsSupervisorPTRIssuedAt || "Sto. Tomas"} onChange={e => handleFieldChange("electronicsSupervisorPTRIssuedAt", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Signed</label>
                                  <input type="text" value={formData.electronicsSupervisorSignedDate || "Jan 20, 2026"} onChange={e => handleFieldChange("electronicsSupervisorSignedDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                              </div>
                              <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #86efac" }}>
                                <SignatureCreator
                                  value={formData.electronicsSupervisorSignature}
                                  onChange={sig => handleFieldChange("electronicsSupervisorSignature", sig)}
                                  label={`Supervisor E-Signature (Box 4 - ${formData.electronicsSupervisorName || "Supervisor Electronics Engineer"})`}
                                />
                              </div>
                            </>
                          ) : (
                            <div style={{ marginTop: "0.5rem", padding: "8px 12px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "0.76rem" }}>
                              Using identical credentials and signature from Box 3 (Design Professional: {formData.electronicsEngineerName || "ENGR. ALAN T. SANTOS, PECE"}).
                            </div>
                          )}
                        </div>

                        {/* BOX 5: BUILDING OWNER */}
                        <div style={{ padding: "1rem", borderRadius: "12px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase" }}>
                            BOX 5: BUILDING OWNER
                          </span>
                          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Building Owner Name</label>
                              <input type="text" value={formData.applicantName || ""} onChange={e => handleFieldChange("applicantName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", fontWeight: "700" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Owner Address</label>
                              <input type="text" value={formData.applicantAddress || ""} onChange={e => handleFieldChange("applicantAddress", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>C.T.C. / Gov ID No.</label>
                              <input type="text" value={formData.applicantCtcNo || formData.govIdNo || ""} onChange={e => { handleFieldChange("applicantCtcNo", e.target.value); handleFieldChange("govIdNo", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Issued</label>
                              <input type="text" value={formData.applicantGovIdDateIssued || formData.govIdDateIssued || ""} onChange={e => { handleFieldChange("applicantGovIdDateIssued", e.target.value); handleFieldChange("govIdDateIssued", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Place Issued</label>
                              <input type="text" value={formData.applicantGovIdPlaceIssued || formData.govIdPlaceIssued || ""} onChange={e => { handleFieldChange("applicantGovIdPlaceIssued", e.target.value); handleFieldChange("govIdPlaceIssued", e.target.value); }} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Signed</label>
                              <input type="text" value={formData.applicantSignedDate || "Jan 08, 2026"} onChange={e => handleFieldChange("applicantSignedDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                            </div>
                          </div>
                          <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                            <SignatureCreator
                              value={formData.applicantSignature}
                              onChange={sig => handleFieldChange("applicantSignature", sig)}
                              label={`Applicant E-Signature (Box 5 / Building Owner - ${formData.applicantName || "Applicant"})`}
                            />
                          </div>
                        </div>

                        {/* LOT OWNER (BOX 6) */}
                        <div style={{ padding: "1rem", borderRadius: "12px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                            <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase" }}>
                              BOX 6: WITH MY CONSENT: LOT OWNER
                            </span>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.74rem", fontWeight: "700", color: "#2563eb" }}>
                              <input
                                type="checkbox"
                                checked={Boolean(formData.lotOwnerConsent)}
                                onChange={e => handleFieldChange("lotOwnerConsent", e.target.checked)}
                                style={{ accentColor: "#2563eb" }}
                              />
                              Include Box 6 (Lot Owner Consent)
                            </label>
                          </div>

                          {formData.lotOwnerConsent && (
                            <>
                              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Lot Owner Name</label>
                                  <input type="text" value={formData.lotOwnerName || ""} onChange={e => handleFieldChange("lotOwnerName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", fontWeight: "700" }} />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Lot Owner Address</label>
                                  <input type="text" value={formData.lotOwnerAddress || ""} onChange={e => handleFieldChange("lotOwnerAddress", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>C.T.C. / Gov ID No.</label>
                                  <input type="text" value={formData.lotOwnerGovIdNo || ""} onChange={e => handleFieldChange("lotOwnerGovIdNo", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Issued</label>
                                  <input type="text" value={formData.lotOwnerGovIdDateIssued || ""} onChange={e => handleFieldChange("lotOwnerGovIdDateIssued", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Place Issued</label>
                                  <input type="text" value={formData.lotOwnerGovIdPlaceIssued || ""} onChange={e => handleFieldChange("lotOwnerGovIdPlaceIssued", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Signed</label>
                                  <input type="text" value={formData.lotOwnerSignedDate || "Jan 08, 2026"} onChange={e => handleFieldChange("lotOwnerSignedDate", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                                </div>
                              </div>
                              <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                                <SignatureCreator
                                  value={formData.lotOwnerSignature}
                                  onChange={sig => handleFieldChange("lotOwnerSignature", sig)}
                                  label={`Lot Owner E-Signature (Box 6 - ${formData.lotOwnerName || "Lot Owner"})`}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time PDF Viewer & Placement Inspector */}
        <div style={{
          background: "#ffffff",
          borderRadius: "20px",
          border: "1.5px solid #e2e8f0",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          height: "850px"
        }}>
          {/* Inspection Toolbar */}
          <div style={{
            padding: "1rem 1.4rem",
            background: "#0f172a",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: "700" }}>
                <CheckCircle2 size={16} color="#34d399" />
                <span>Live Verification Preview</span>
              </div>
              {genTimeMs && (
                <span style={{ fontSize: "0.75rem", color: "#94a3b8", background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "6px" }}>
                  Rendered in {genTimeMs}ms
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              {pdfUrl && (
                <>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: "rgba(255, 255, 255, 0.12)",
                      color: "white",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px"
                    }}
                    title="Open PDF full size in a new tab"
                  >
                    <ExternalLink size={14} /> Full Screen
                  </a>
                  <a
                    href={pdfUrl}
                    download={`TEST-${selectedForm.code}-${Date.now()}.pdf`}
                    style={{
                      background: "#38bdf8",
                      color: "#0f172a",
                      padding: "6px 14px",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      fontWeight: "800",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px"
                    }}
                    title="Download generated PDF to test local print/view"
                  >
                    <Download size={14} /> Download PDF
                  </a>
                </>
              )}
            </div>
          </div>

          {/* PDF Frame */}
          <div style={{ flex: 1, background: "#334155", position: "relative" }}>
            {isGenerating && !pdfUrl ? (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", gap: "1rem" }}>
                <RefreshCw size={36} className="animate-spin" color="#38bdf8" />
                <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>Calibrating & Compiling Form Overlay...</span>
              </div>
            ) : pdfUrl ? (
              <>
                <iframe
                  src={pdfUrl}
                  title="Generated Test PDF"
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
                {isGenerating && (
                  <div style={{
                    position: "absolute",
                    top: "14px",
                    right: "14px",
                    background: "rgba(15, 23, 42, 0.9)",
                    backdropFilter: "blur(8px)",
                    color: "white",
                    padding: "7px 12px",
                    borderRadius: "10px",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    border: "1px solid rgba(56, 189, 248, 0.4)",
                    zIndex: 10,
                    pointerEvents: "none"
                  }}>
                    <RefreshCw size={13} className="animate-spin" color="#38bdf8" />
                    <span style={{ color: "#38bdf8" }}>Real-time syncing edits...</span>
                  </div>
                )}
              </>
            ) : (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8", gap: "1rem" }}>
                <FileText size={48} />
                <span style={{ fontWeight: "600" }}>Click "Generate & Inspect PDF" to preview placement.</span>
              </div>
            )}
          </div>

          {/* Footer Guide Checklist */}
          <div style={{ padding: "0.75rem 1.25rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", fontSize: "0.78rem", color: "#475569", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600" }}>
                <Check size={13} color="#16a34a" /> Box 1 Applicant Details
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600" }}>
                <Check size={13} color="#16a34a" /> Box 2 Project Location
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600" }}>
                <Check size={13} color="#16a34a" /> Box 3 Scopes & Checkboxes
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600" }}>
                <Check size={13} color="#16a34a" /> Box 7 Professional Seals
              </span>
            </div>
            <span style={{ color: "#94a3b8", fontSize: "0.72rem" }}>
              Template: {selectedForm.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
