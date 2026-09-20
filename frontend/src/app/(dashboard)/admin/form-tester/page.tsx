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
  constructionOwnedByEnterprise: "N/A (INDIVIDUAL)",
  govIdNo: "PRC-ID-00987654",

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
  waterHeaterOutletsCount: "2",
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

  // Mechanical
  machineryType: "Inverter Split-Type Air Conditioning System (4 Units)",
  machineryBrand: "Daikin / Carrier High Efficiency Inverter",
  machineryCapacity: "7.5 Total Horsepower (HP) / 24,000 BTU/hr",
  machineryPower: "5.5 kW Total Connected Mechanical Power",
  machinerySpeed: "Variable Speed Inverter Compressor",
  machineryStoreys: "Ground & Second Floors",
  electricalLoadKva: "6.8 kVA",
  serviceVoltage: "230V, 1-Phase, 60Hz",

  // Electronics
  telecomScope: "FTTH High-Speed Fiber Optic Data Infrastructure with Wi-Fi 6 Access Points",
  cctvScope: "8-Channel 4K IP CCTV Surveillance System with NVR and Mobile Remote Viewing",
  fdasScope: "Addressable Fire Detection & Alarm System (Smoke & Heat Detectors with Strobe Alarm)",

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

  // Fencing Permit
  fencingType: "Reinforced Concrete / CHB with Decorative Steel Grills",
  fencingLength: "45.00",
  fencingHeight: "2.20",
  fencingCost: "150,000.00",

  // Excavation Permit
  excavationVolume: "120.00",
  excavationDepth: "2.50",
  excavationScope: "Foundation Excavation, Site Grading & Ground Levelling",

  // Sign Permit
  signType: "Business Sign, Wall Type (Illuminated LED)",
  signDimensions: "3.00m Width x 1.50m Height (Area: 4.50 sq.m.)",
  signMaterial: "Acrylic Face with LED Backlight on Steel Framing",
  signCost: "45,000.00",

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
  mechanicalEngineerPTRIssued: "Jan 18, 2026",
  mechanicalEngineerPTRIssuedAt: "Sto. Tomas",
  mechanicalEngineerTIN: "678-901-234-000",

  electronicsEngineerName: "ENGR. ALAN T. SANTOS, PECE",
  electronicsEngineerAddress: "Sto. Tomas, Pampanga",
  electronicsEngineerPRC: "0022334",
  electronicsEngineerPRCValidity: "2028-05-12",
  electronicsEngineerIECEP: "IECEP-889900",
  electronicsEngineerPTR: "PTR-ST-110099",
  electronicsEngineerPTRIssued: "Jan 20, 2026",
  electronicsEngineerPTRIssuedAt: "Sto. Tomas",
  electronicsEngineerTIN: "789-012-345-000",

  // Box 3 & Box 4: Owner E-Signature & Government ID
  govIdDateIssued: "Jan 10, 2024",
  govIdPlaceIssued: "Sto. Tomas",
  applicantSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih0p4xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",
  representativeSignature: "",
  lotOwnerConsent: true,
  lotOwnerName: "Dave Sicat",
  lotOwnerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih0p4xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",
  lotOwnerAddress: "153 Sitio Visitas",
  lotOwnerGovIdNo: "PRC-ID-00987654",
  lotOwnerGovIdDateIssued: "Jan 10, 2024",
  lotOwnerGovIdPlaceIssued: "Sto. Tomas",

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
    case "PL": return `PP-${yearSeq}`;
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
    case "EL": return "Electronics Permit No. (EL NO)";
    case "BP": return "Building Permit No. (BP NO)";
    case "DP": return "Demolition Permit No. (DP NO)";
    case "FP": return "Fencing Permit No. (FP NO)";
    case "EXP": return "Excavation Permit No. (EXP NO)";
    case "SGP": return "Sign Permit No. (SGP NO)";
    case "TSC": return "Temporary Service Permit No. (TSC NO)";
    default: return `${formId} Permit No.`;
  }
};

const isFormLinkedToBuildingPermit = (formId: string): boolean => {
  // Ancillary permits and certificates that connect to the master Building Permit No.
  return ["AP", "SP", "EP", "PL", "MP", "EL", "CO", "CC", "CFEI"].includes(formId);
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
              onClick={() => setSelectedFormId(form.id)}
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
                        Auto-gathered from project with Building Permit — mapped into the 10 official boxes
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
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
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
                        <option value="Erection">Erection</option>
                        <option value="Addition">Addition</option>
                        <option value="Alteration">Alteration</option>
                        <option value="Renovation">Renovation</option>
                        <option value="Conversion">Conversion</option>
                        <option value="Repair">Repair</option>
                        <option value="Moving">Moving</option>
                        <option value="Raising">Raising</option>
                        <option value="Demolition">Demolition</option>
                        <option value="Accessory Building / Structure">Accessory Building / Structure</option>
                        <option value="Others">Others (Specify)</option>
                      </select>
                      {["Renovation", "Conversion", "Repair", "Moving", "Raising", "Demolition", "Accessory", "Other"].some(k => (formData.scopeOfWork || "").toLowerCase().includes(k.toLowerCase())) && (
                        <div style={{ marginTop: "6px" }}>
                          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#64748b", marginBottom: "2px" }}>
                            Specify {formData.scopeOfWork} Details (Printed on Form Underline)
                          </label>
                          <input
                            type="text"
                            value={formData.scopeOfWorkDetails || formData.scopeOthers || ""}
                            onChange={e => {
                              handleFieldChange("scopeOfWorkDetails", e.target.value);
                              handleFieldChange("scopeOthers", e.target.value);
                            }}
                            placeholder={`e.g. Details for ${formData.scopeOfWork}`}
                            style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                        Occupancy Classification Detail (NBCP Rule VII)
                      </label>
                      <select
                        value={formData.occupancyClassificationDetail || "Group A - Residential (Single)"}
                        onChange={e => handleFieldChange("occupancyClassificationDetail", e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff", color: "#1e293b", fontWeight: "600" }}
                      >
                        <optgroup label="GROUP A: RESIDENTIAL (DWELLINGS)">
                          <option value="Group A - Residential (Single)">Group A - Single Family Dwelling</option>
                          <option value="Group A - Residential (Duplex)">Group A - Duplex</option>
                          <option value="Group A - Residential (R-1, R-2)">Group A - Residential R-1, R-2</option>
                          <option value="Group A - Residential (Others)">Group A - Others</option>
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

                          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "0.5rem" }}>
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
                  )}

                  {selectedForm.id === "PL" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Water Source</label>
                        <input type="text" value={formData.waterSupplySource || ""} onChange={e => handleFieldChange("waterSupplySource", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Septic Tank Dimensions</label>
                        <input type="text" value={formData.septicTankDimensions || ""} onChange={e => handleFieldChange("septicTankDimensions", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Water Closets Count</label>
                        <input type="text" value={formData.waterClosetsCount || ""} onChange={e => handleFieldChange("waterClosetsCount", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Kitchen Sinks Count</label>
                        <input type="text" value={formData.kitchenSinksCount || ""} onChange={e => handleFieldChange("kitchenSinksCount", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                    </div>
                  )}

                  {selectedForm.id === "MP" && (
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
                  )}

                  {selectedForm.id === "EL" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Telecom & Data Scope</label>
                        <input type="text" value={formData.telecomScope || ""} onChange={e => handleFieldChange("telecomScope", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>CCTV Surveillance Scope</label>
                        <input type="text" value={formData.cctvScope || ""} onChange={e => handleFieldChange("cctvScope", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                    </div>
                  )}

                  {selectedForm.id === "DP" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Structure to Demolish</label>
                        <input type="text" value={formData.demolitionBuildingType || ""} onChange={e => handleFieldChange("demolitionBuildingType", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Demolition Area (sq.m.)</label>
                        <input type="text" value={formData.demolitionArea || ""} onChange={e => handleFieldChange("demolitionArea", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Number of Storeys</label>
                        <input type="text" value={formData.demolitionStoreys || ""} onChange={e => handleFieldChange("demolitionStoreys", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Scope & Precautions</label>
                        <input type="text" value={formData.demolitionScope || ""} onChange={e => handleFieldChange("demolitionScope", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                    </div>
                  )}

                  {selectedForm.id === "FP" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Fencing Type & Materials</label>
                        <input type="text" value={formData.fencingType || ""} onChange={e => handleFieldChange("fencingType", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Total Fence Length (meters)</label>
                        <input type="text" value={formData.fencingLength || ""} onChange={e => handleFieldChange("fencingLength", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Fence Height (meters)</label>
                        <input type="text" value={formData.fencingHeight || ""} onChange={e => handleFieldChange("fencingHeight", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Estimated Fencing Cost (PHP)</label>
                        <input type="text" value={formData.fencingCost || ""} onChange={e => handleFieldChange("fencingCost", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                    </div>
                  )}

                  {selectedForm.id === "EXP" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Excavation Scope</label>
                        <input type="text" value={formData.excavationScope || ""} onChange={e => handleFieldChange("excavationScope", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Excavation Volume (cu.m.)</label>
                        <input type="text" value={formData.excavationVolume || ""} onChange={e => handleFieldChange("excavationVolume", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Maximum Depth (meters)</label>
                        <input type="text" value={formData.excavationDepth || ""} onChange={e => handleFieldChange("excavationDepth", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Start & Completion Dates</label>
                        <input type="text" value={`${formData.proposedStartDate || "Oct 01, 2026"} to ${formData.expectedCompletionDate || "Nov 15, 2026"}`} readOnly style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#f1f5f9" }} />
                      </div>
                    </div>
                  )}

                  {selectedForm.id === "SGP" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Sign Type & Location</label>
                        <input type="text" value={formData.signType || ""} onChange={e => handleFieldChange("signType", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Dimensions (Width x Height)</label>
                        <input type="text" value={formData.signDimensions || ""} onChange={e => handleFieldChange("signDimensions", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
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
                      </div>
                    )}

                    {/* Architect - Box 4: Supervisor / In-Charge of Architectural Works */}
                    {selectedForm.id === "AP" && (
                      <div style={{ padding: "0.9rem", borderRadius: "12px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: "800", color: "#0284c7" }}>
                            Box 4: SUPERVISOR / IN-CHARGE OF ARCHITECTURAL WORKS (Architect)
                          </span>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: "700", color: "#334155", cursor: "pointer" }}>
                            <input 
                              type="checkbox" 
                              checked={!!formData.sameAsDesignArchitect} 
                              onChange={e => handleFieldChange("sameAsDesignArchitect", e.target.checked)} 
                            />
                            Same as Design Professional (Box 3)
                          </label>
                        </div>

                        {!formData.sameAsDesignArchitect ? (
                          <>
                            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Supervisor Architect Full Name</label>
                                <input type="text" value={formData.supervisorArchitectName || ""} onChange={e => handleFieldChange("supervisorArchitectName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Address</label>
                                <input type="text" value={formData.supervisorArchitectAddress || "Sto. Tomas, Pampanga"} onChange={e => handleFieldChange("supervisorArchitectAddress", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>IAPOA No.</label>
                                <input type="text" value={formData.supervisorArchitectIAPOA || "IAPOA-2026-8877"} onChange={e => handleFieldChange("supervisorArchitectIAPOA", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>IAPOA Validity</label>
                                <input type="text" value={formData.supervisorArchitectIAPOAValidity || "2027-12-31"} onChange={e => handleFieldChange("supervisorArchitectIAPOAValidity", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC No.</label>
                                <input type="text" value={formData.supervisorArchitectPRC || ""} onChange={e => handleFieldChange("supervisorArchitectPRC", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC Validity</label>
                                <input type="text" value={formData.supervisorArchitectPRCValidity || "2027-08-20"} onChange={e => handleFieldChange("supervisorArchitectPRCValidity", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR No.</label>
                                <input type="text" value={formData.supervisorArchitectPTR || ""} onChange={e => handleFieldChange("supervisorArchitectPTR", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Issued</label>
                                <input type="text" value={formData.supervisorArchitectPTRIssued || "Jan 10, 2026"} onChange={e => handleFieldChange("supervisorArchitectPTRIssued", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Issued at</label>
                                <input type="text" value={formData.supervisorArchitectPTRIssuedAt || "Sto. Tomas"} onChange={e => handleFieldChange("supervisorArchitectPTRIssuedAt", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>TIN</label>
                                <input type="text" value={formData.supervisorArchitectTIN || "345-678-901-000"} onChange={e => handleFieldChange("supervisorArchitectTIN", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div style={{ marginTop: "0.5rem", padding: "8px 12px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "0.76rem" }}>
                            Using identical credentials from Box 3 (Design Professional: {formData.architectName || "Architect"}).
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

                        {selectedForm.id === "SP" && (
                          <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                            <SignatureCreator
                              value={formData.civilEngineerSignature}
                              onChange={sig => handleFieldChange("civilEngineerSignature", sig)}
                              label={`Civil Engineer E-Signature (Box 3 - ${formData.civilEngineerName || "Civil Engineer"})`}
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
                      </div>
                    )}

                    {/* Master Plumber */}
                    {selectedForm.id === "PL" && (
                      <div style={{ padding: "0.9rem", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#0369a1" }}>Master Plumber / Sanitary Engineer</span>
                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Full Name</label>
                            <input type="text" value={formData.masterPlumberName || ""} onChange={e => handleFieldChange("masterPlumberName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Address</label>
                            <input type="text" value={formData.masterPlumberAddress || "Sto. Tomas, Pampanga"} onChange={e => handleFieldChange("masterPlumberAddress", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC No.</label>
                            <input type="text" value={formData.masterPlumberPRC || ""} onChange={e => handleFieldChange("masterPlumberPRC", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Validity</label>
                            <input type="text" value={formData.masterPlumberPRCValidity || "2028-01-25"} onChange={e => handleFieldChange("masterPlumberPRCValidity", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>TIN</label>
                            <input type="text" value={formData.masterPlumberTIN || "567-890-123-000"} onChange={e => handleFieldChange("masterPlumberTIN", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR No.</label>
                            <input type="text" value={formData.masterPlumberPTR || ""} onChange={e => handleFieldChange("masterPlumberPTR", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Issued</label>
                            <input type="text" value={formData.masterPlumberPTRIssued || "Jan 15, 2026"} onChange={e => handleFieldChange("masterPlumberPTRIssued", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Issued at</label>
                            <input type="text" value={formData.masterPlumberPTRIssuedAt || "Sto. Tomas"} onChange={e => handleFieldChange("masterPlumberPTRIssuedAt", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mechanical Engineer */}
                    {selectedForm.id === "MP" && (
                      <div style={{ padding: "0.9rem", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#7c3aed" }}>Professional Mechanical Engineer (PME)</span>
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
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR No.</label>
                            <input type="text" value={formData.mechanicalEngineerPTR || ""} onChange={e => handleFieldChange("mechanicalEngineerPTR", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Date Issued</label>
                            <input type="text" value={formData.mechanicalEngineerPTRIssued || "Jan 18, 2026"} onChange={e => handleFieldChange("mechanicalEngineerPTRIssued", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Issued at</label>
                            <input type="text" value={formData.mechanicalEngineerPTRIssuedAt || "Sto. Tomas"} onChange={e => handleFieldChange("mechanicalEngineerPTRIssuedAt", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Electronics Engineer */}
                    {selectedForm.id === "EL" && (
                      <div style={{ padding: "0.9rem", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#0891b2" }}>Professional Electronics Engineer (PECE)</span>
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
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
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
