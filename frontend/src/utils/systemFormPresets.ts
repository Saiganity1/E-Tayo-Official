import { UnifiedPermitFormData } from "./unifiedPermitPdfGenerator";
import { PROJECT_TYPES_MATRIX } from "../data/projectTypeMatrix";
import { numberToWordsInPesos } from "./locationalClearancePdfGenerator";

export const DEFAULT_CALIBRATED_TEST_DATA: UnifiedPermitFormData = {
  applicationNo: "APP-TEST-2026-0001",
  controlNo: "2026-000001",
  temporaryServicePermitNo: "PTSC-2026-0001",
  ptscNo: "PTSC-2026-0001",
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

  // Certificate of Occupancy
  occupancyScope: "FULL" as "FULL" | "PARTIAL",
  appliesFireSafetyInspectionCertificate: true,
  appliesFsic: true,
  fsecNo: "FSEC-2026-0041",
  fsecDateIssued: "Jan 15, 2026",
  buildingPermitDateIssued: "Jan 12, 2026",
  supervisorCtcNo: "CTC-2026-00841",
  supervisorCtcDateIssued: "Jan 10, 2026",
  supervisorCtcPlaceIssued: "Sto. Tomas",
  supervisorTin: "123-456-789-000",
  reqApprovedPlan: true,
  reqCompletionForm: true,
  reqPhotocopyPtrPrc: true,
  reqMeggerTest: true,
  reqGoogleMap: false,
  reqPhotographs: true,
  reqOwnersId: true,
  reqAuthLetter: false,
  reqRepresentativeId: false,
  reqOthers: false,
  reqOthersSpecify: "",

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
  rangeOutletsCount: "1",
  waterHeaterOutletsCount: "2",
  waterPumpOutletsCount: "1",
  toggleSwitchCount: "15",
  bellBuzzerCount: "1",
  pushButtonsCount: "1",
  faDetectorCount: "2",
  otherWiringDevicesCount: "1",

  // Plumbing / Sanitary
  sanitaryScopeOfWork: "NEW INSTALLATION",
  waterClosetsCount: "3",
  lavatoriesCount: "3",
  kitchenSinksCount: "2",
  showersCount: "3",
  floorDrainsCount: "4",
  faucetsCount: "6",
  waterMeterCount: "1",
  greaseTrapCount: "1",
  bathTubsCount: "",
  slopSinkCount: "",
  urinalCount: "",
  airConditioningCount: "",
  waterTankCount: "",
  bidetCount: "3",
  laundryTraysCount: "1",
  dentalCuspidorCount: "",
  electricalHeaterCount: "2",
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
  signDisplayType: "Business Sign",
  signDisplayMedium: "Wall Sign",
  signInstallationType: "New Installation",
  signFormOfOwnership: "Individual / Private",
  signEnterpriseName: "DELA CRUZ ENTERPRISES",
  signCharacterOfOccupancy: "Commercial / Retail",
  signLength: "3.00",
  signWidth: "1.50",
  signArea: "4.50",

  // Temporary Service Connection
  ptscPurposeForConstruction: true,
  ptscPurposeForTesting: false,
  ptscPurposeOthers: false,
  ptscPurposeOthersSpecify: "",
  ptscConnectedLoad: "15.0",
  ptscTransformerCapacity: "25.0",
  ptscGeneratorCapacity: "N/A",
  ptscDuration: "90",
  ptscStartDate: "Oct 01, 2026",
  ptscFormOfOwnership: "INDIVIDUAL / OWNER",
  ptscEnterpriseName: "DELA CRUZ RESIDENCE",
  ptscCharacterOfOccupancy: "RESIDENTIAL",
  ptscApplicantNo: "123",
  ptscApplicantStreet: "Rizal St.",
  ptscApplicantBarangay: "Poblacion",
  ptscApplicantCity: "Sto. Tomas, Pampanga",
  ptscApplicantZip: "2020",
  ptscFeePaid: "850.00",
  ptscOfficialReceiptNo: "OR-2026-00412",
  ptscDatePaid: "Oct 01, 2026",
  ptscDateIssued: "Oct 02, 2026",

  // Summary of Actual Costs (Certificate of Completion)
  actualProjectCost: "2,500,000.00",
  materialsCost: "1,450,000.00",
  cementBags: "850",
  lumberBdFt: "3,200",
  reinforcingBarsKg: "5,400",
  giSheets: "120",
  structuralSteelKg: "2,100",
  otherMaterialsCost: "185,000.00",
  laborCost: "750,000.00",
  equipmentCost: "180,000.00",
  otherCosts: "120,000.00",

  // Professional Seals & Credentials
  architectName: "ARCH. MARIA ELENA SANTOS, UAP",
  architectAddress: "Sto. Tomas, Pampanga",
  architectPRC: "0045211",
  architectPRCValidity: "2028-09-15",
  architectPTR: "PTR-ST-665544",
  architectPTRIssued: "Jan 08, 2026",
  architectPTRIssuedAt: "Sto. Tomas",
  architectTIN: "234-567-890-000",
  architectSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih044xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",

  // Box 4: Supervisor / In-Charge of Architectural Works
  sameAsDesignArchitect: true,
  supervisorArchitectName: "ARCH. MARIA ELENA SANTOS, UAP",
  supervisorArchitectAddress: "Sto. Tomas, Pampanga",
  supervisorArchitectPRC: "0045211",
  supervisorArchitectPRCValidity: "2028-09-15",
  supervisorArchitectPTR: "PTR-ST-665544",
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
  masterPlumberSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih044xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",

  sanitaryEngineerName: "ENGR. ANDRES BONIFACIO, SE",
  sanitaryEngineerAddress: "San Bartolome, Sto. Tomas, Pampanga",
  sanitaryEngineerPRC: "0054321",
  sanitaryEngineerPRCValidity: "2027-11-30",
  sanitaryEngineerPTR: "PTR-ST-5678901",
  sanitaryEngineerPTRIssued: "Jan 15, 2026",
  sanitaryEngineerPTRIssuedAt: "Sto. Tomas",
  sanitaryEngineerTIN: "567-890-123-000",
  sanitaryEngineerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih044xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",

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
  mechanicalEngineerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih044xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",

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
  mechSupervisorSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih044xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",

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
  electronicsEngineerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih044xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",

  interiorDesignerName: "IDR. GABRIELA SILANG, PIID",
  interiorDesignerAddress: "Poblacion, Sto. Tomas, Pampanga",
  interiorDesignerPRC: "0021098",
  interiorDesignerPRCValidity: "2027-05-18",
  interiorDesignerPTR: "PTR-ST-8901234",
  interiorDesignerPTRIssued: "Jan 22, 2026",
  interiorDesignerPTRIssuedAt: "Sto. Tomas",
  interiorDesignerTIN: "890-123-456-000",
  interiorDesignerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih044xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",

  // Page 2: Supervisors of Specialty Works
  electricalSupervisorName: "ENGR. DANILO REYES, PEE",
  electricalSupervisorAddress: "Sto. Tomas, Pampanga",
  electricalSupervisorPRC: "0033421",
  electricalSupervisorPRCValidity: "2028-11-30",
  electricalSupervisorPTR: "PTR-ST-443322",
  electricalSupervisorPTRIssued: "Jan 12, 2026",
  electricalSupervisorPTRIssuedAt: "Sto. Tomas",
  electricalSupervisorTIN: "456-789-012-000",
  electricalSupervisorSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih044xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",

  mechanicalSupervisorName: "ENGR. LEONARDO V. TORRES, PME",
  mechanicalSupervisorAddress: "Sto. Tomas, Pampanga",
  mechanicalSupervisorPRC: "0044556",
  mechanicalSupervisorPRCValidity: "2027-12-18",
  mechanicalSupervisorPTR: "PTR-ST-221100",
  mechanicalSupervisorPTRIssued: "Jan 18, 2026",
  mechanicalSupervisorPTRIssuedAt: "Sto. Tomas",
  mechanicalSupervisorTIN: "678-901-234-000",
  mechanicalSupervisorSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih044xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",

  sanitarySupervisorName: "ENGR. ANDRES BONIFACIO, SE",
  sanitarySupervisorAddress: "San Bartolome, Sto. Tomas, Pampanga",
  sanitarySupervisorPRC: "0054321",
  sanitarySupervisorPRCValidity: "2027-11-30",
  sanitarySupervisorPTR: "PTR-ST-5678901",
  sanitarySupervisorPTRIssued: "Jan 15, 2026",
  sanitarySupervisorPTRIssuedAt: "Sto. Tomas",
  sanitarySupervisorTIN: "567-890-123-000",
  sanitarySupervisorSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih044xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",

  plumbingSupervisorName: "ENGR. DARIO K. AQUINO, RMP",
  plumbingSupervisorAddress: "Sto. Tomas, Pampanga",
  plumbingSupervisorPRC: "0011998",
  plumbingSupervisorPRCValidity: "2028-01-25",
  plumbingSupervisorPTR: "PTR-ST-332211",
  plumbingSupervisorPTRIssued: "Jan 15, 2026",
  plumbingSupervisorPTRIssuedAt: "Sto. Tomas",
  plumbingSupervisorTIN: "567-890-123-000",
  plumbingSupervisorSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih044xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",

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
  electronicsSupervisorSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih044xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",

  interiorSupervisorName: "IDR. GABRIELA SILANG, PIID",
  interiorSupervisorAddress: "Poblacion, Sto. Tomas, Pampanga",
  interiorSupervisorPRC: "0021098",
  interiorSupervisorPRCValidity: "2027-05-18",
  interiorSupervisorPTR: "PTR-ST-8901234",
  interiorSupervisorPTRIssued: "Jan 22, 2026",
  interiorSupervisorPTRIssuedAt: "Sto. Tomas",
  interiorSupervisorTIN: "890-123-456-000",
  interiorSupervisorSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih044xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",

  // Box 3 & Box 4: Owner E-Signature & Government ID
  govIdDateIssued: "Jan 10, 2024",
  govIdPlaceIssued: "Sto. Tomas",
  permitIssuedDate: "Sep 22, 2026",
  applicantSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih044xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",
  representativeSignature: "",
  lotOwnerConsent: true,
  lotOwnerName: "Dave Sicat",
  lotOwnerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABGCAYAAADyxhn6AAADe0lEQVR4nO3cTXLcIBCGYU0qPoZP6XP4lDlGFpOVKpRLPwi66f7gfTbezFhI8KmRhOb1fr83AJp+RTcAQDsCDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CAMAIMCCPAgDACDAgjwIAwAgwII8CVPj6/3uVfIIMXv8hx7yi0f/98vyLaApTSVGC1CqfSTswtRQXOXOHugpqlnVhTeAVWr2Qfn19v9X3ooTZzmk14Bb7q+Ojq9rNtZXsyzxpGOeu71Y5DpNAA15y1owbDVXjPPnP2udlk7rfVhE2hZxj8taGeSe3+rX5pMUpIBb4Lb0318/R0+zOcjGo87bejz8DW8ADXDPbIQLRue+YQPw0mQR4n/C70Uadm6ujatpxNp9WnkS1hfBpstBtagXunpt7BttreLNXYYj+oxr6GVWCLs6/KGVz95tbZzKEldFTjez3HYkgF7hkMo6qwx3YUK7FnxaQa/2c13twD7DENs+5wz/+vFOIRbV05xB6LlkICvG3PGuw9sEafIDy20SMiVKsE2XuloWuAj4LRGhavkEVN0b23VyuyXVmPSa+Ry4PdAvzkoX9UiCMqY6ZqnKUtMwQ5ak2/S4BrB0b0iqeoFV/RwckYmIxtupPhRRzzALcMzidB8npWG71cc1Qbok8ed7IHOUNoS+4Bbr1Z5R3i6AAftcGzHdmDUcrW1myhLZkGeFSwegd+hvCetWXbeHSzy3iDbdT2a5kF2PP61OL6ufd7nkYvnsiwz7VGhlgltCWTAHsNkruwtYQxY4B3lsdRteqe8dofxdCWugM8egrY87M2mcO74wWCc1b7pR7aknmAR63e2bdTu32lqaTl2vEn31XREuSZQlvqCnBERWtd3aVQfUu9s4ua7yir2d9ZQ1tqDnD0mf7uFayrjlTpvNYFMVefnc2TV/FmPB5mFTjLc9TdDAHetvtwRp9IM1ih044xuQaOPkhXg1w5vKXaSqO6fxb2Y9Rz517t+IX/sLuVmgGu1jk/9Vw2oI7aGEkfYAZiG7WBiDa/oxtQw+I530wDep/qKU75YCt9BW6x8l1ZrCX8d6E97EG9W3oJqJuyAh+Z5W40UFomwDuuGzGT5QIMzGTKa2BgFQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWEEGBBGgAFhBBgQRoABYQQYEEaAAWH/AMK1QcQfdloeAAAAAElFTkSuQmCC",
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

  // CFEI Specs & Technical Breakdown
  cfeiInspectorName: "ENGR. GILBERT B. CRUZ",
  cfeiInspectorPrc: "PRC 0042189 / 2028-11-20",
  cfeiOfficialName: "ENGR. GIOVANNI L. AQUINO",
  cfeiOfficialPrc: "PRC 0031892 / 2027-08-15",
  cfeiContractorName: "SAN PEDRO ELECTRICAL SERVICES & CONSTRUCTION CORP.",
  cfeiContractorPcab: "PCAB-EL-48821",
  cfeiContractorAddress: "Sto. Tomas, Pampanga",
  cfeiContractorTel: "(045) 982-4112 / 0917-889-4412",
  cfeiInstallationType: "NEW",
  cfeiWiringMethods: ["CONDUITS"],
  cfeiStoriesCount: "2 (TWO)",
  cfeiEstimatedCost: "1,850,000.00",
  cfeiActualCost: "1,850,000.00",
  cfeiMaterialsCost: "1,073,000.00",
  cfeiWiresCost: "321,900.00",
  cfeiLightingCost: "246,790.00",
  cfeiConvenienceCost: "193,140.00",
  cfeiSwitchesCost: "160,950.00",
  cfeiOtherMaterialsCost: "150,220.00 (Distribution Panels, Breakers, Conduits)",
  cfeiOtherCosts: "777,000.00",
  cfeiOtherDevicesNote: "Emergency Lights & Exit Signs",
  cfeiNatureOfWork: "NEW ELECTRICAL INSTALLATION FOR 2-STOREY RESIDENTIAL DWELLING",
  cfeiVoltage: "230V, 1-PHASE, 60HZ",
  cfeiWireSize: "30 MM² THHN COPPER",
  cfeiPhone: "(045) 982-4112",
  cfeiRemarks: "COMPLIED WITH 2017 PHILIPPINE ELECTRICAL CODE (PEC) AND LOCAL MUNICIPAL ORDINANCES.",
  cfeiRemarksLine2: "APPROVED FOR CONTINUOUS RESIDENTIAL ELECTRICAL SERVICE CONNECTION.",
  cfeiComputedBy: "ENGR. DANILO REYES, PEE",
};

// Storage Keys
export const STORAGE_KEY_STUDIO_WORKING = "ETAYO_FORM_STUDIO_WORKING_DATA";
export const STORAGE_KEY_SYSTEM_ACTIVE = "ETAYO_SYSTEM_ACTIVE_PRESETS";
export const STORAGE_KEY_SYSTEM_METADATA = "ETAYO_SYSTEM_ACTIVE_METADATA";

export interface SystemPresetsMetadata {
  isCustomApplied: boolean;
  source?: "default" | "custom";
  lastUpdated?: string;
  appliedAt?: string;
  appliedBy?: string;
}

/**
 * Get current working draft in Form Testing Studio.
 * Order of priority:
 * 1. Saved working draft from Studio (if user previously edited in Studio)
 * 2. Active system presets (if admin previously applied to system)
 * 3. Default base calibrated data
 */
export function getStudioWorkingData(): UnifiedPermitFormData {
  if (typeof window === "undefined") {
    return { ...DEFAULT_CALIBRATED_TEST_DATA };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDIO_WORKING) || localStorage.getItem(STORAGE_KEY_SYSTEM_ACTIVE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CALIBRATED_TEST_DATA, ...parsed };
    }
  } catch (e) {
    console.warn("Failed to load studio working data from localStorage:", e);
  }
  return { ...DEFAULT_CALIBRATED_TEST_DATA };
}

/**
 * Auto-save current edits within Form Testing Studio to localStorage.
 */
export function saveStudioWorkingData(data: UnifiedPermitFormData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_STUDIO_WORKING, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save studio working data to localStorage:", e);
  }
}

/**
 * Explicitly apply edits done in Form Testing Studio to the entire system.
 * This makes the edits active for:
 * - Applicant application forms (prefill & defaults)
 * - Staff evaluation PDF previews & inspections
 * - Applicant tracking document viewing & downloads
 */
export function applyStudioDataToSystem(data: UnifiedPermitFormData): { success: boolean; timestamp: string } {
  const timestamp = new Date().toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_SYSTEM_ACTIVE, JSON.stringify(data));
      localStorage.setItem(
        STORAGE_KEY_SYSTEM_METADATA,
        JSON.stringify({
          isCustomApplied: true,
          source: "custom",
          lastUpdated: timestamp,
          appliedAt: timestamp,
          appliedBy: "Admin / Form Testing Studio",
        })
      );

      // Dispatch real-time custom event so any open forms/components can react immediately
      window.dispatchEvent(
        new CustomEvent("etayo-system-presets-applied", {
          detail: { data, timestamp },
        })
      );
    } catch (e) {
      console.error("Failed to apply studio presets to system:", e);
      return { success: false, timestamp };
    }
  }

  return { success: true, timestamp };
}

/**
 * Get active system presets currently applied across the system.
 */
export function getSystemActivePresets(): UnifiedPermitFormData {
  if (typeof window === "undefined") {
    return { ...DEFAULT_CALIBRATED_TEST_DATA };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SYSTEM_ACTIVE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CALIBRATED_TEST_DATA, ...parsed };
    }
  } catch (e) {
    console.warn("Failed to read system active presets:", e);
  }
  return { ...DEFAULT_CALIBRATED_TEST_DATA };
}

/**
 * Get metadata about whether custom studio edits have been applied to the system.
 */
export function getSystemPresetsMetadata(): SystemPresetsMetadata {
  if (typeof window === "undefined") {
    return { isCustomApplied: false, source: "default" };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SYSTEM_METADATA);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        isCustomApplied: Boolean(parsed.isCustomApplied),
        source: parsed.isCustomApplied ? "custom" : "default",
        lastUpdated: parsed.lastUpdated || parsed.appliedAt,
        appliedAt: parsed.appliedAt,
        appliedBy: parsed.appliedBy,
      };
    }
  } catch (e) {
    console.warn("Failed to read system presets metadata:", e);
  }
  return { isCustomApplied: false, source: "default" };
}

/**
 * Reset working draft in Studio back to default calibrated data.
 */
export function resetStudioWorkingData(): UnifiedPermitFormData {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY_STUDIO_WORKING);
    } catch (e) {}
  }
  return { ...DEFAULT_CALIBRATED_TEST_DATA };
}

/**
 * Reset system presets back to factory defaults.
 */
export function resetSystemPresetsToDefault(): UnifiedPermitFormData {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY_STUDIO_WORKING);
      localStorage.removeItem(STORAGE_KEY_SYSTEM_ACTIVE);
      localStorage.removeItem(STORAGE_KEY_SYSTEM_METADATA);
      window.dispatchEvent(new CustomEvent("etayo-system-presets-applied", { detail: null }));
    } catch (e) {}
  }
  return { ...DEFAULT_CALIBRATED_TEST_DATA };
}
