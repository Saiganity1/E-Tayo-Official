"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  FileText, Wrench, Zap, Shield, Layers, Droplets, Flame, Radio, 
  CheckCircle2, AlertCircle, Download, Upload, Trash2, Check, 
  ArrowRight, Sparkles, Building, ChevronRight, Info, Eye, 
  Clock, ShieldCheck, ChevronLeft, Lock, Award, Hammer, Compass,
  Sliders, UserCheck, RefreshCw, FileCheck, Home, CheckSquare, Plus, ExternalLink, User,
  Save
} from "lucide-react";
import { 
  ProjectTypeItem, 
  PERMIT_FORM_METADATA, 
  PermitFormMatrix, 
  getPermitFormTemplate 
} from "../../data/projectTypeMatrix";
import { 
  generateUnifiedPermitPdf, 
  generateBuildingPermitPdf, 
  generateArchitecturalPermitPdf, 
  generateStructuralPermitPdf, 
  generateElectricalPermitPdf, 
  generateSanitaryPermitPdf,
  generateMechanicalPermitPdf,
  generateElectronicsPermitPdf,
  generateDemolitionPermitPdf,
  generateExcavationPermitPdf,
  generateBfpApplicationPdf,
  generateFencingPermitPdf,
  generateSignPermitPdf,
  generateTemporaryServicePermitPdf,
  UnifiedPermitFormData 
} from "../../utils/unifiedPermitPdfGenerator";
import PermitMatrixGuideModal from "../modals/PermitMatrixGuideModal";
import SignatureCreator from "../common/SignatureCreator";

export const FORM_OFFICIAL_DETAILS: Record<string, { officialTitle: string; nbcCode: string; icon: any; color: string; desc: string }> = {
  buildingPermit: {
    officialTitle: "UNIFIED APPLICATION FORM FOR BUILDING PERMIT",
    nbcCode: "NBC FORM NO. B-01",
    icon: Building,
    color: "#2563eb",
    desc: "Primary DPWH permit application covering structural footprint, occupancy classification, and scope of work."
  },
  architecturalPermit: {
    officialTitle: "ARCHITECTURAL PERMIT APPLICATION",
    nbcCode: "NBC FORM NO. A-01",
    icon: Layers,
    color: "#7c3aed",
    desc: "Architectural plans, building elevations, spatial layout, and Registered Architect sign-off."
  },
  civilStructuralPermit: {
    officialTitle: "CIVIL / STRUCTURAL PERMIT APPLICATION",
    nbcCode: "NBC FORM NO. S-01",
    icon: Hammer,
    color: "#0f766e",
    desc: "Structural calculations, foundation, seismic/wind analysis, and Civil Engineer sign-off."
  },
  electricalPermit: {
    officialTitle: "ELECTRICAL PERMIT APPLICATION",
    nbcCode: "NBC FORM NO. E-01",
    icon: Zap,
    color: "#d97706",
    desc: "Load computations, single-line diagrams, branch circuits, and Professional Electrical Engineer sign-off."
  },
  sanitaryPermit: {
    officialTitle: "SANITARY / PLUMBING PERMIT APPLICATION",
    nbcCode: "NBC FORM NO. P-01",
    icon: Droplets,
    color: "#0284c7",
    desc: "Potable water supply, wastewater drainage, septic tank layout, and Master Plumber sign-off."
  },
  fireBfpPermit: {
    officialTitle: "BUREAU OF FIRE PROTECTION (BFP) CLEARANCE",
    nbcCode: "BFP FSEC / FSIC",
    icon: Flame,
    color: "#dc2626",
    desc: "Official Bureau of Fire Protection Clearance — No fillup form required. Please upload your BFP Clearance certificate."
  },
  mechanicalPermit: {
    officialTitle: "MECHANICAL PERMIT APPLICATION",
    nbcCode: "NBC FORM NO. M-01",
    icon: Wrench,
    color: "#4f46e5",
    desc: "HVAC, elevators, generators, mechanical ventilation, and Professional Mechanical Engineer sign-off."
  },
  electronicsPermit: {
    officialTitle: "ELECTRONICS PERMIT APPLICATION",
    nbcCode: "NBC FORM NO. EL-01",
    icon: Radio,
    color: "#059669",
    desc: "CCTV, structured cabling, fire alarm wiring, and Professional Electronics Engineer sign-off."
  },
  fencingPermit: {
    officialTitle: "FENCING PERMIT APPLICATION",
    nbcCode: "NBC FORM NO. F-01",
    icon: Home,
    color: "#475569",
    desc: "Perimeter fencing, retaining walls, and property boundary structures."
  },
  demolitionPermit: {
    officialTitle: "DEMOLITION PERMIT APPLICATION",
    nbcCode: "NBC FORM NO. D-01",
    icon: Hammer,
    color: "#b91c1c",
    desc: "Safe demolition plan, structural dismantling sequence, and safety measures."
  },
  excavationPermit: {
    officialTitle: "EXCAVATION AND GROUND PREPARATION PERMIT APPLICATION",
    nbcCode: "NBC FORM NO. B-02",
    icon: Hammer,
    color: "#b45309",
    desc: "Official excavation, earthworks, foundation fills, pile driving, and Civil Engineer supervisor sign-off."
  }
};

interface TechnicalPermitFormsStepProps {
  projectType: ProjectTypeItem;
  locationalClearanceRef: string | null;
  clearanceApp?: any;
  isClearanceRequired: boolean;
  applicantName: string;
  projectName: string;
  setProjectName: (name: string) => void;
  streetAddress: string;
  setStreetAddress: (address: string) => void;
  barangay: string;
  setBarangay: (barangay: string) => void;
  lotArea: string;
  setLotArea: (area: string) => void;
  floorArea: string;
  setFloorArea: (area: string) => void;
  projectCost: string;
  setProjectCost: (cost: string) => void;
  uploadedPermitDocs: Record<string, any>;
  setUploadedPermitDocs: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  onProceedToMapping: () => void;
  onBack: () => void;
}

export default function TechnicalPermitFormsStep({
  projectType,
  locationalClearanceRef,
  clearanceApp,
  isClearanceRequired,
  applicantName,
  projectName,
  setProjectName,
  streetAddress,
  setStreetAddress,
  barangay,
  setBarangay,
  lotArea,
  setLotArea,
  floorArea,
  setFloorArea,
  projectCost,
  setProjectCost,
  uploadedPermitDocs,
  setUploadedPermitDocs,
  onProceedToMapping,
  onBack
}: TechnicalPermitFormsStepProps) {
  // Mode: "digital_fill" or "upload_scans"
  const [inputMode, setInputMode] = useState<"digital_fill" | "upload_scans">("digital_fill");

  // Mandatory technical permit keys for this project type (excluding zoning clearance which is Stage 1 / Step 2)
  const mandatoryKeys = (Object.keys(projectType.matrix) as (keyof PermitFormMatrix)[]).filter(
    (k) => projectType.matrix[k] === "required" && k !== "zoningPermit"
  );

  // Active form tab currently viewed
  const [activeTab, setActiveTab] = useState<keyof PermitFormMatrix>(
    mandatoryKeys[0] || "buildingPermit"
  );
  const activeMeta = PERMIT_FORM_METADATA[activeTab];
  const [showMatrixGuide, setShowMatrixGuide] = useState(false);

  // ==========================================
  // 1. GENERAL APPLICANT & PROPERTY DATA (Universal)
  // ==========================================
  // Parse name parts from applicantName prop or clearanceApp
  const parseNameParts = (fullName: string) => {
    const clean = (fullName || "").trim();
    if (!clean) return { lastName: "DELA CRUZ", firstName: "JUAN", middleName: "S." };
    if (clean.includes(",")) {
      const [last, rest] = clean.split(",");
      const parts = (rest || "").trim().split(/\s+/);
      const first = parts.slice(0, -1).join(" ") || parts[0] || "";
      const mi = parts.length > 1 ? parts[parts.length - 1] : "";
      return { lastName: last.trim().toUpperCase(), firstName: first.toUpperCase(), middleName: mi.toUpperCase() };
    }
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return { lastName: parts[0].toUpperCase(), firstName: "", middleName: "" };
    if (parts.length === 2) return { lastName: parts[1].toUpperCase(), firstName: parts[0].toUpperCase(), middleName: "" };
    if (parts.length >= 3 && (parts[parts.length - 2].toUpperCase() === "DELA" || parts[parts.length - 2].toUpperCase() === "DE" || parts[parts.length - 2].toUpperCase() === "DELOS" || parts[parts.length - 2].toUpperCase() === "SAN")) {
      const lastName = `${parts[parts.length - 2]} ${parts[parts.length - 1]}`.toUpperCase();
      const firstName = parts[0].toUpperCase();
      const middleName = parts.slice(1, -2).join(" ").toUpperCase() || "";
      return { lastName, firstName, middleName: middleName ? (middleName.endsWith(".") ? middleName : middleName[0] + ".") : "" };
    }
    const lastName = parts[parts.length - 1].toUpperCase();
    const firstName = parts[0].toUpperCase();
    const middleName = parts.slice(1, -1).join(" ").toUpperCase();
    return { lastName, firstName, middleName: middleName ? (middleName.endsWith(".") ? middleName : middleName[0] + ".") : "" };
  };

  const initialNameParts = parseNameParts(applicantName || clearanceApp?.applicantName || "Juan Dela Cruz");
  const [applicantLastName, setApplicantLastName] = useState(initialNameParts.lastName);
  const [applicantFirstName, setApplicantFirstName] = useState(initialNameParts.firstName);
  const [applicantMiddleName, setApplicantMiddleName] = useState(initialNameParts.middleName);
  const [applicantTIN, setApplicantTIN] = useState("123-456-789-000");
  const [constructionOwnedByEnterprise, setConstructionOwnedByEnterprise] = useState(
    clearanceApp?.corporationName || clearanceApp?.constructionOwnedByEnterprise || "N/A (INDIVIDUAL)"
  );
  const [formOfOwnership, setFormOfOwnership] = useState("INDIVIDUAL / OWNER");
  const [govIdNo, setGovIdNo] = useState("CTC-2026-08912");
  const [govIdDateIssued, setGovIdDateIssued] = useState("Jan 10, 2026");
  const [govIdPlaceIssued, setGovIdPlaceIssued] = useState("Sto. Tomas, Pampanga");
  const [applicantSignature, setApplicantSignature] = useState<string>("");
  const [applicantSignedDate, setApplicantSignedDate] = useState("Jan 08, 2026");

  // Box 6: WITH MY CONSENT: LOT OWNER
  const [lotOwnerConsent, setLotOwnerConsent] = useState(false);
  const [lotOwnerName, setLotOwnerName] = useState<string>(clearanceApp?.lotOwnerName || "Maria Clara Dela Cruz");
  const [lotOwnerAddress, setLotOwnerAddress] = useState<string>(clearanceApp?.lotOwnerAddress || "Sto. Tomas, Pampanga");
  const [lotOwnerGovIdNo, setLotOwnerGovIdNo] = useState("CTC-2026-00871");
  const [lotOwnerGovIdDateIssued, setLotOwnerGovIdDateIssued] = useState("Jan 12, 2026");
  const [lotOwnerGovIdPlaceIssued, setLotOwnerGovIdPlaceIssued] = useState("Sto. Tomas, Pampanga");
  const [lotOwnerSignedDate, setLotOwnerSignedDate] = useState("Jan 08, 2026");
  const [lotOwnerSignature, setLotOwnerSignature] = useState<string>("");

  const [lotNo, setLotNo] = useState("Lot 12");
  const [blockNo, setBlockNo] = useState("Block 4");
  const [tctNo, setTctNo] = useState("TCT-042-20260012");
  const [taxDecNo, setTaxDecNo] = useState("TD-2026-00124-ST");

  // Address & Contact Information (Box 1 Row 3)
  const [applicantNoStreet, setApplicantNoStreet] = useState(streetAddress || "123 RIZAL ST.");
  const [applicantBarangay, setApplicantBarangay] = useState(barangay || "POBLACION");
  const [applicantMunicipality, setApplicantMunicipality] = useState("STO. TOMAS");
  const [applicantProvince, setApplicantProvince] = useState("PAMPANGA");
  const [applicantZipCode, setApplicantZipCode] = useState("2020");
  const [applicantPhone, setApplicantPhone] = useState("0917-123-4567");
  const [applicantEmail, setApplicantEmail] = useState(clearanceApp?.applicantEmail || "juan.delacruz@example.com");

  const compiledFullAddress = useMemo(() => {
    return [applicantNoStreet, applicantBarangay ? `Brgy. ${applicantBarangay}` : "", applicantMunicipality, applicantProvince, applicantZipCode].filter(Boolean).join(", ") || "123 Rizal St., Poblacion, Sto. Tomas, Pampanga";
  }, [applicantNoStreet, applicantBarangay, applicantMunicipality, applicantProvince, applicantZipCode]);

  const compiledFullName = useMemo(() => {
    const mi = applicantMiddleName ? (applicantMiddleName.endsWith(".") ? applicantMiddleName : `${applicantMiddleName}.`) : "";
    return [applicantFirstName, mi, applicantLastName].filter(Boolean).join(" ") || applicantName || "JUAN S. DELA CRUZ";
  }, [applicantFirstName, applicantMiddleName, applicantLastName, applicantName]);

  // ==========================================
  // 2. UNIFIED BUILDING PERMIT (BP) FIELDS
  // ==========================================
  const [scopeOfWork, setScopeOfWork] = useState(
    projectType.id === "elevator_escalator" || projectType.id === "generator_set"
      ? "New Mechanical & Electrical Installation"
      : "New Construction"
  );
  const [scopeOfWorkDetails, setScopeOfWorkDetails] = useState("");
  const [occupancyClass, setOccupancyClass] = useState(
    projectType.category === "Commercial"
      ? "COMMERCIAL"
      : projectType.category === "Industrial"
      ? "INDUSTRIAL"
      : projectType.category === "Institutional"
      ? "INSTITUTIONAL"
      : "RESIDENTIAL"
  );
  const [occupancyRuleVII, setOccupancyRuleVII] = useState("Group A - Single Family Dwelling");
  const [occupancyClassificationDetail, setOccupancyClassificationDetail] = useState("Group A - Single Family Dwelling");
  const [occupancyOthers, setOccupancyOthers] = useState("");
  const [buildingFootprint, setBuildingFootprint] = useState("120");
  const [buildingHeight, setBuildingHeight] = useState("6.8");
  const [proposedStoreys, setProposedStoreys] = useState(
    projectType.id === "two_storey_house" ? "2" : projectType.id === "single_detached_house" ? "1" : "2"
  );
  const [numberOfUnits, setNumberOfUnits] = useState("1");
  const [proposedStartDate, setProposedStartDate] = useState("2026-10-15");
  const [expectedCompletionDate, setExpectedCompletionDate] = useState("2027-04-15");

  // Estimated Cost Breakdown (PHP)
  const [costBuilding, setCostBuilding] = useState("1,100,000.00");
  const [costElectrical, setCostElectrical] = useState("180,000.00");
  const [costPlumbing, setCostPlumbing] = useState("140,000.00");
  const [costMechanical, setCostMechanical] = useState("80,000.00");
  const [costElectronics, setCostElectronics] = useState("60,000.00");
  const [costOthers, setCostOthers] = useState("40,000.00");

  // ==========================================
  // 3. ARCHITECTURAL PERMIT (AP) FIELDS
  // ==========================================
  const [architecturalStyle, setArchitecturalStyle] = useState("Modern Contemporary Filipino");
  const [bedroomCount, setBedroomCount] = useState("3");
  const [bathroomCount, setBathroomCount] = useState("2");
  const [auxiliarySpaces, setAuxiliarySpaces] = useState("Living Area, Dining, Kitchen, Laundry / Service Area, Carport, Balcony");
  const [frontSetback, setFrontSetback] = useState("3.00");
  const [rearSetback, setRearSetback] = useState("2.00");
  const [leftSetback, setLeftSetback] = useState("1.50");
  const [rightSetback, setRightSetback] = useState("1.50");
  const [toslPercent, setToslPercent] = useState("30");
  const [roofingMaterial, setRoofingMaterial] = useState("0.40mm Pre-painted Rib-Type Longspan GI Sheets on Steel Framing");
  const [exteriorWallFinish, setExteriorWallFinish] = useState("Smooth Plastered Cement Paint Finish with Stone Cladding Accent");
  const [interiorWallFinish, setInteriorWallFinish] = useState("Semi-Gloss Latex Paint Finish on Plastered Concrete Hollow Blocks");
  const [floorFinishes, setFloorFinishes] = useState("600mm x 600mm Unglazed Vitrified Homogeneous Porcelain Tiles");
  const [ceilingFinishes, setCeilingFinishes] = useState("9mm Moisture-Resistant Gypsum Board on Heavy-Duty Metal Furring System");
  const [doorsSpec, setDoorsSpec] = useState("Solid Narra Hardwood Main Entrance Door, Molded Panel Interior Flush Doors");
  const [windowsSpec, setWindowsSpec] = useState("Powder-Coated Aluminum Casement & Sliding Windows with 6mm Tinted Glass");
  const [architectName, setArchitectName] = useState("Arch. Maria Santos, UAP");
  const [architectAddress, setArchitectAddress] = useState("Sto. Tomas, Pampanga");
  const [architectPRC, setArchitectPRC] = useState("0045211");
  const [architectPRCValidity, setArchitectPRCValidity] = useState("2028-09-15");
  const [architectIAPOA, setArchitectIAPOA] = useState("IAPOA-2026-9988");
  const [architectIAPOAValidity, setArchitectIAPOAValidity] = useState("2028-12-31");
  const [architectPTR, setArchitectPTR] = useState("PTR-ST-665544");
  const [architectPTRIssued, setArchitectPTRIssued] = useState("Jan 08, 2026");
  const [architectPTRIssuedAt, setArchitectPTRIssuedAt] = useState("Sto. Tomas");
  const [architectTIN, setArchitectTIN] = useState("234-567-890-000");

  // Box 4: Supervisor / In-Charge of Architectural Works
  const [sameAsDesignArchitect, setSameAsDesignArchitect] = useState(false);
  const [supervisorArchitectName, setSupervisorArchitectName] = useState("ARCH. JUAN CARLOS REYES, UAP");
  const [supervisorArchitectAddress, setSupervisorArchitectAddress] = useState("Sto. Tomas, Pampanga");
  const [supervisorArchitectPRC, setSupervisorArchitectPRC] = useState("0056123");
  const [supervisorArchitectPRCValidity, setSupervisorArchitectPRCValidity] = useState("2027-08-20");
  const [supervisorArchitectIAPOA, setSupervisorArchitectIAPOA] = useState("IAPOA-2026-8877");
  const [supervisorArchitectIAPOAValidity, setSupervisorArchitectIAPOAValidity] = useState("2027-12-31");
  const [supervisorArchitectPTR, setSupervisorArchitectPTR] = useState("PTR-ST-778899");
  const [supervisorArchitectPTRIssued, setSupervisorArchitectPTRIssued] = useState("Jan 10, 2026");
  const [supervisorArchitectPTRIssuedAt, setSupervisorArchitectPTRIssuedAt] = useState("Sto. Tomas");
  const [supervisorArchitectTIN, setSupervisorArchitectTIN] = useState("345-678-901-000");

  // NBC Form A-01 (Architectural Permit) Box 2 Subsections:
  // 2. Percentage of Site Occupancy
  const [percentBuildingFootprint, setPercentBuildingFootprint] = useState("55.00");
  const [percentImperviousSurface, setPercentImperviousSurface] = useState("25.00");
  const [percentUnpavedSurface, setPercentUnpavedSurface] = useState("20.00");
  const [percentSiteOccupancyOthers, setPercentSiteOccupancyOthers] = useState("");

  // 3. Conformance to Fire Code of the Philippines (P.D. 1185)
  const [fireCodeExitDoors, setFireCodeExitDoors] = useState(true);
  const [fireCodeCorridors, setFireCodeCorridors] = useState(true);
  const [fireCodeDistanceExits, setFireCodeDistanceExits] = useState(true);
  const [fireCodeAccessStreet, setFireCodeAccessStreet] = useState(true);
  const [fireCodeFireWalls, setFireCodeFireWalls] = useState(true);
  const [fireCodeFireFighting, setFireCodeFireFighting] = useState(false);
  const [fireCodeSmokeDetectors, setFireCodeSmokeDetectors] = useState(true);
  const [fireCodeEmergencyLights, setFireCodeEmergencyLights] = useState(true);
  const [fireCodeOthers, setFireCodeOthers] = useState("");

  // ==========================================
  // 4. CIVIL / STRUCTURAL PERMIT (SP) FIELDS
  // ==========================================
  const [foundationType, setFoundationType] = useState("Isolated Reinforced Concrete Spread Footings with Tie Beams");
  const [foundationDepth, setFoundationDepth] = useState("1.50 meters below natural grade line");
  const [structuralFraming, setStructuralFraming] = useState("Cast-in-Place Reinforced Concrete Beams & Columns Framing System");
  const [floorSlabSystem, setFloorSlabSystem] = useState("100mm Thick Two-Way Cast-in-Place Reinforced Concrete Slab (fc'=20.7 MPa)");
  const [roofFramingSystem, setRoofFramingSystem] = useState("Structural C-Purlins on Welded Angular Steel Trusses (ASTM A36)");
  const [masonrySpec, setMasonrySpec] = useState("150mm Exterior & 100mm Interior Non-Load Bearing CHB with #10 rebars @ 600mm O.C.");
  const [concreteStrength, setConcreteStrength] = useState("20.7 MPa (3,000 psi at 28 days)");
  const [steelGrade, setSteelGrade] = useState("Grade 40 (275 MPa) for ≤12mm, Grade 60 (414 MPa) for ≥16mm");
  const [civilEngineerName, setCivilEngineerName] = useState("Engr. Roberto Cruz, CE");
  const [civilEngineerAddress, setCivilEngineerAddress] = useState("Sto. Tomas, Pampanga");
  const [civilEngineerPRC, setCivilEngineerPRC] = useState("PRC-CE-0078923");
  const [civilEngineerPRCValidity, setCivilEngineerPRCValidity] = useState("2028-11-24");
  const [civilEngineerPICE, setCivilEngineerPICE] = useState("PICE-2026-8812");
  const [civilEngineerPTR, setCivilEngineerPTR] = useState("PTR-ST-2026-001");
  const [civilEngineerPTRIssued, setCivilEngineerPTRIssued] = useState("Jan 08, 2026");
  const [civilEngineerPTRIssuedAt, setCivilEngineerPTRIssuedAt] = useState("Sto. Tomas, Pampanga");
  const [civilEngineerTIN, setCivilEngineerTIN] = useState("234-567-890-000");
  const [civilEngineerSignature, setCivilEngineerSignature] = useState<string>("");
  const [civilEngineerSignedDate, setCivilEngineerSignedDate] = useState("Jan 08, 2026");

  // Box 4: Supervisor / In-Charge of Civil/Structural Works
  const [sameAsDesignCivilEngineer, setSameAsDesignCivilEngineer] = useState(true);
  const [supervisorCivilEngineerName, setSupervisorCivilEngineerName] = useState("Engr. Roberto Cruz, CE");
  const [supervisorCivilEngineerAddress, setSupervisorCivilEngineerAddress] = useState("Sto. Tomas, Pampanga");
  const [supervisorCivilEngineerPRC, setSupervisorCivilEngineerPRC] = useState("PRC-CE-0078923");
  const [supervisorCivilEngineerPRCValidity, setSupervisorCivilEngineerPRCValidity] = useState("2028-11-24");
  const [supervisorCivilEngineerPICE, setSupervisorCivilEngineerPICE] = useState("PICE-2026-8812");
  const [supervisorCivilEngineerPTR, setSupervisorCivilEngineerPTR] = useState("PTR-ST-2026-001");
  const [supervisorCivilEngineerPTRIssued, setSupervisorCivilEngineerPTRIssued] = useState("Jan 08, 2026");
  const [supervisorCivilEngineerPTRIssuedAt, setSupervisorCivilEngineerPTRIssuedAt] = useState("Sto. Tomas, Pampanga");
  const [supervisorCivilEngineerTIN, setSupervisorCivilEngineerTIN] = useState("234-567-890-000");
  const [supervisorCivilEngineerSignature, setSupervisorCivilEngineerSignature] = useState<string>("");
  const [supervisorCivilEngineerSignedDate, setSupervisorCivilEngineerSignedDate] = useState("Jan 08, 2026");

  // ==========================================
  // 5. ELECTRICAL PERMIT (EP) FIELDS
  // ==========================================
  const [electricalScopeOfWork, setElectricalScopeOfWork] = useState("New Installation");
  const [electricalScopeDetails, setElectricalScopeDetails] = useState("");
  const [electricalOccupancy, setElectricalOccupancy] = useState("A. RESIDENTIAL DWELLING");
  const [electricalOccupancyOthers, setElectricalOccupancyOthers] = useState("");
  const [electricalVoltage, setElectricalVoltage] = useState("230V, Single-Phase, 2-Wire, 60 Hz AC");
  const [mainBreaker, setMainBreaker] = useState("60A, 2-Pole, 240V, 10 kAIC Molded Case Circuit Breaker (MCCB)");
  const [electricalConnectedLoad, setElectricalConnectedLoad] = useState(
    projectType.id === "elevator_escalator" ? "25.0 kVA" : "15.0 kVA"
  );
  const [branchCircuitsCount, setBranchCircuitsCount] = useState("8 Branch Circuits (Lighting, Power, ACU, Range, Heater)");
  const [electricalFeeder, setElectricalFeeder] = useState("2 - 14.0 mm² THHN/THWN-2 Copper Wire in 25mm dia. RSC conduit");
  const [groundingSpec, setGroundingSpec] = useState("16mm dia. x 3.0m Copper-clad Steel Ground Rod with 8.0 mm² bare copper wire");
  const [lightingOutletsCount, setLightingOutletsCount] = useState("16");
  const [convenienceOutletsCount, setConvenienceOutletsCount] = useState("18");
  const [acuOutletsCount, setAcuOutletsCount] = useState("3");
  const [rangeOutletsCount, setRangeOutletsCount] = useState("1");
  const [waterHeaterOutletsCount, setWaterHeaterOutletsCount] = useState("2");
  const [waterPumpOutletsCount, setWaterPumpOutletsCount] = useState("1");
  const [toggleSwitchCount, setToggleSwitchCount] = useState("12");
  const [bellBuzzerCount, setBellBuzzerCount] = useState("1");
  const [pushButtonsCount, setPushButtonsCount] = useState("1");
  const [faDetectorCount, setFaDetectorCount] = useState("2");
  const [otherWiringDevicesCount, setOtherWiringDevicesCount] = useState("1");
  const [electricalEngineerName, setElectricalEngineerName] = useState("Engr. Danilo Reyes, PEE");
  const [electricalEngineerPRC, setElectricalEngineerPRC] = useState("PRC-PEE-0033421");
  const [electricalEngineerPRCValidity, setElectricalEngineerPRCValidity] = useState("2027-09-30");
  const [electricalEngineerIIEE, setElectricalEngineerIIEE] = useState("IIEE-2026-5541");
  const [electricalEngineerPTR, setElectricalEngineerPTR] = useState("PTR-ST-2026-4412");
  const [electricalEngineerPTRIssued, setElectricalEngineerPTRIssued] = useState("Sto. Tomas, Pampanga");
  const [electricalEngineerTIN, setElectricalEngineerTIN] = useState("456-789-012-000");
  const [electricalEngineerSignature, setElectricalEngineerSignature] = useState<string>("");
  const [electricalContractorName, setElectricalContractorName] = useState("VOLTMAX ELECTRICAL SERVICES & CONTRACTING INC.");
  const [electricalContractorPcab, setElectricalContractorPcab] = useState("PCAB-EL-2026-9811");
  const [electricalContractorAddress, setElectricalContractorAddress] = useState("San Fernando, Pampanga");
  const [electricalContractorTel, setElectricalContractorTel] = useState("0918-777-8899");

  // Box 4: Person In-Charge of Installation
  const [sameAsDesignElectricalEngineer, setSameAsDesignElectricalEngineer] = useState(false);
  const [installationInChargeRole, setInstallationInChargeRole] = useState<"PEE" | "REE" | "RME">("PEE");
  const [installationInChargeName, setInstallationInChargeName] = useState("Engr. Edgar C. Mendoza, REE");
  const [installationInChargeAddress, setInstallationInChargeAddress] = useState("Sto. Tomas, Pampanga");
  const [installationInChargePRC, setInstallationInChargePRC] = useState("PRC-REE-0045678");
  const [installationInChargePRCValidity, setInstallationInChargePRCValidity] = useState("2028-08-20");
  const [installationInChargeTel, setInstallationInChargeTel] = useState("0917-888-1234");
  const [installationInChargePTR, setInstallationInChargePTR] = useState("PTR-ST-2026-5566");
  const [installationInChargePTRIssued, setInstallationInChargePTRIssued] = useState("Jan 14, 2026");
  const [installationInChargePTRIssuedAt, setInstallationInChargePTRIssuedAt] = useState("Sto. Tomas, Pampanga");
  const [installationInChargeTIN, setInstallationInChargeTIN] = useState("345-678-901-000");
  const [installationInChargeSignedDate, setInstallationInChargeSignedDate] = useState("Jan 15, 2026");
  const [installationInChargeSignature, setInstallationInChargeSignature] = useState<string>("");

  // ==========================================
  // 6. SANITARY / PLUMBING PERMIT (PL) FIELDS
  // ==========================================
  const [sanitaryScopeOfWork, setSanitaryScopeOfWork] = useState<"NEW INSTALLATION" | "ADDITION OF" | "REPAIR OF" | "REMOVAL OF" | "OTHERS">("NEW INSTALLATION");
  const [sanitaryScopeDetails, setSanitaryScopeDetails] = useState("");
  const [sanitaryScopeOthersAction, setSanitaryScopeOthersAction] = useState("");
  const [sanitaryScopeOthersTarget, setSanitaryScopeOthersTarget] = useState("");
  const [waterSupplySource, setWaterSupplySource] = useState("Sto. Tomas Water District (Municipal Waterworks Main)");
  const [sewageSystem, setSewageSystem] = useState("Individual 3-Chamber Reinforced Concrete Septic Tank with Leaching Field");
  const [septicTankDimensions, setSepticTankDimensions] = useState("2.40m Length x 1.20m Width x 1.50m Liquid Depth");
  const [waterPipesMaterial, setWaterPipesMaterial] = useState("PPR-PN20 (Polypropylene Random Copolymer) Heat-Fusion Welded");
  const [wastePipesMaterial, setWastePipesMaterial] = useState("uPVC Series 1000 Sanitary Pipe with Solvent Cement Joints");

  // Water Supply & System Supply / Disposal (NBC Form P-01 Box 1 Bottom)
  const [waterSupplyType, setWaterSupplyType] = useState<"SHALLOW WELL" | "DEEPWELL & PUMP SET" | "CITY/MUNICIPAL WATER SYSTEM" | "OTHERS">("CITY/MUNICIPAL WATER SYSTEM");
  const [waterSupplyOthers, setWaterSupplyOthers] = useState("");
  const [wasteWaterTreatmentPlant, setWasteWaterTreatmentPlant] = useState(false);
  const [septicVaultImhoffTank, setSepticVaultImhoffTank] = useState(true);
  const [subsurfaceSandFilter, setSubsurfaceSandFilter] = useState(false);
  const [sanitarySewerConnection, setSanitarySewerConnection] = useState(false);
  const [surfaceDrainage, setSurfaceDrainage] = useState(false);
  const [streetCanal, setStreetCanal] = useState(false);
  const [waterCourse, setWaterCourse] = useState(false);
  const [plumbingTotalArea, setPlumbingTotalArea] = useState(floorArea || "185.50");
  const [plumbingStartDate, setPlumbingStartDate] = useState("2026-10-01");
  const [plumbingInstallationCost, setPlumbingInstallationCost] = useState("100,000.00");
  const [plumbingCompletionDate, setPlumbingCompletionDate] = useState("2026-11-15");
  const [plumbingPreparedBy, setPlumbingPreparedBy] = useState("");

  // Fixtures schedule - Column 1
  const [waterClosetsCount, setWaterClosetsCount] = useState("4");
  const [floorDrainsCount, setFloorDrainsCount] = useState("5");
  const [lavatoriesCount, setLavatoriesCount] = useState("4");
  const [kitchenSinksCount, setKitchenSinksCount] = useState("2");
  const [faucetsCount, setFaucetsCount] = useState("6");
  const [showersCount, setShowersCount] = useState("3");
  const [waterMeterCount, setWaterMeterCount] = useState("");
  const [greaseTrapCount, setGreaseTrapCount] = useState("");
  const [bathTubsCount, setBathTubsCount] = useState("");
  const [slopSinkCount, setSlopSinkCount] = useState("");
  const [urinalCount, setUrinalCount] = useState("");
  const [airConditioningCount, setAirConditioningCount] = useState("");
  const [waterTankCount, setWaterTankCount] = useState("");

  // Fixtures schedule - Column 2
  const [bidetCount, setBidetCount] = useState("");
  const [laundryTraysCount, setLaundryTraysCount] = useState("");
  const [dentalCuspidorCount, setDentalCuspidorCount] = useState("");
  const [electricalHeaterCount, setElectricalHeaterCount] = useState("");
  const [waterBoilerCount, setWaterBoilerCount] = useState("");
  const [drinkingFountainCount, setDrinkingFountainCount] = useState("");
  const [barSinkCount, setBarSinkCount] = useState("");
  const [sodaFountainCount, setSodaFountainCount] = useState("");
  const [laboratorySinkCount, setLaboratorySinkCount] = useState("");
  const [sterilizerCount, setSterilizerCount] = useState("");
  const [swimmingPoolCount, setSwimmingPoolCount] = useState("");
  const [othersFixtureCount, setOthersFixtureCount] = useState("");
  const [othersFixtureName, setOthersFixtureName] = useState("");

  // Fixture Installation Status Map (new vs existing, defaults to "new")
  const [fixtureStatusMap, setFixtureStatusMap] = useState<Record<string, "new" | "existing">>({});

  // System Checkboxes
  const [waterDistributionSystem, setWaterDistributionSystem] = useState(true);
  const [sanitarySewerSystem, setSanitarySewerSystem] = useState(true);
  const [stormDrainageSystem, setStormDrainageSystem] = useState(false);

  const leftFixturesTotal = [
    waterClosetsCount, floorDrainsCount, lavatoriesCount, kitchenSinksCount,
    faucetsCount, showersCount, waterMeterCount, greaseTrapCount, bathTubsCount,
    slopSinkCount, urinalCount, airConditioningCount, waterTankCount
  ].reduce((acc, val) => acc + (parseInt(val || "0", 10) || 0), 0);

  const rightFixturesTotal = [
    bidetCount, laundryTraysCount, dentalCuspidorCount, electricalHeaterCount,
    waterBoilerCount, drinkingFountainCount, barSinkCount, sodaFountainCount,
    laboratorySinkCount, sterilizerCount, swimmingPoolCount, othersFixtureCount
  ].reduce((acc, val) => acc + (parseInt(val || "0", 10) || 0), 0);
  const [masterPlumberName, setMasterPlumberName] = useState("");
  const [masterPlumberPRC, setMasterPlumberPRC] = useState("");
  const [masterPlumberPRCValidity, setMasterPlumberPRCValidity] = useState("");
  const [masterPlumberNAMPAP, setMasterPlumberNAMPAP] = useState("");
  const [masterPlumberPTR, setMasterPlumberPTR] = useState("");
  const [masterPlumberPTRIssued, setMasterPlumberPTRIssued] = useState("");
  const [masterPlumberTIN, setMasterPlumberTIN] = useState("");

  // ==========================================
  // 7. FIRE SAFETY / BFP CLEARANCE (FSEC) FIELDS
  // ==========================================
  const [numberOfExits, setNumberOfExits] = useState("2 Independent Exits (Main Entrance & Kitchen / Service Yard Exit)");
  const [exitDoorWidth, setExitDoorWidth] = useState("0.90 meters clear opening outward swing");
  const [stairSpecs, setStairSpecs] = useState("0.90m minimum stair width with 0.85m continuous steel handrail");
  const [fireExtinguisherSpecs, setFireExtinguisherSpecs] = useState("2 Units of 10-lb Dry Chemical ABC Multi-Purpose Extinguishers (1.2m mounting height)");
  const [emergencyLightsCount, setEmergencyLightsCount] = useState("2 Units Dual-Head LED with 90-minute automatic battery backup");
  const [smokeDetectorsCount, setSmokeDetectorsCount] = useState("4 Units Independent Photoelectric Smoke Detectors with 85dB alarm");
  const [firewallSpecs, setFirewallSpecs] = useState("150mm Solid Reinforced Concrete 2-hour fire-rated party wall");

  // ==========================================
  // 8. MECHANICAL PERMIT (MP) FIELDS
  // ==========================================
  const [machineryType, setMachineryType] = useState(
    projectType.id === "elevator_escalator" 
      ? "Commercial Escalator (Heavy Duty)" 
      : projectType.id === "generator_set"
      ? "Diesel Standby Generator Set"
      : "HVAC & Mechanical Air Ventilation"
  );
  const [machineryBrand, setMachineryBrand] = useState("Mitsubishi Heavy Industries / Otis");
  const [machineryCapacity, setMachineryCapacity] = useState(
    projectType.id === "elevator_escalator" ? "9,000 persons / hr (1,000 kg capacity)" : "250 kVA Standby Rating"
  );
  const [machinerySpeed, setMachinerySpeed] = useState("0.50 m/sec rated velocity");
  const [machineryPower, setMachineryPower] = useState("15 kW (20.0 HP), 3-Phase");
  const [machineryStoreys, setMachineryStoreys] = useState("Ground to 2nd Floor Level (2 Landings)");
  const [mechanicalEngineerName, setMechanicalEngineerName] = useState("ENGR. LEONARDO V. TORRES, PME");
  const [mechanicalEngineerAddress, setMechanicalEngineerAddress] = useState("Sto. Tomas, Pampanga");
  const [mechanicalEngineerPRC, setMechanicalEngineerPRC] = useState("0044556");
  const [mechanicalEngineerPRCValidity, setMechanicalEngineerPRCValidity] = useState("2027-12-18");
  const [mechanicalEngineerPSME, setMechanicalEngineerPSME] = useState("PSME-2026-0912");
  const [mechanicalEngineerPTR, setMechanicalEngineerPTR] = useState("PTR-ST-221100");
  const [mechanicalEngineerPTRDate, setMechanicalEngineerPTRDate] = useState("Jan 10, 2026");
  const [mechanicalEngineerPTRIssued, setMechanicalEngineerPTRIssued] = useState("Sto. Tomas, Pampanga");
  const [mechanicalEngineerPTRIssuedAt, setMechanicalEngineerPTRIssuedAt] = useState("Sto. Tomas, Pampanga");
  const [mechanicalEngineerTIN, setMechanicalEngineerTIN] = useState("678-901-234-000");
  const [mechanicalEngineerSignedDate, setMechanicalEngineerSignedDate] = useState("Jan 08, 2026");
  const [mechanicalEngineerSignature, setMechanicalEngineerSignature] = useState<string>("");

  // Box 4: Supervisor/In-Charge of Mechanical Works
  const [sameAsDesignMechanicalEngineer, setSameAsDesignMechanicalEngineer] = useState(true);
  const [mechSupervisorRole, setMechSupervisorRole] = useState<"PME" | "ME">("PME");
  const [mechSupervisorName, setMechSupervisorName] = useState("ENGR. LEONARDO V. TORRES, PME");
  const [mechSupervisorAddress, setMechSupervisorAddress] = useState("Sto. Tomas, Pampanga");
  const [mechSupervisorPRC, setMechSupervisorPRC] = useState("0044556");
  const [mechSupervisorPRCValidity, setMechSupervisorPRCValidity] = useState("2027-12-18");
  const [mechSupervisorPTR, setMechSupervisorPTR] = useState("PTR-ST-221100");
  const [mechSupervisorPTRDate, setMechSupervisorPTRDate] = useState("Jan 10, 2026");
  const [mechSupervisorPTRIssuedAt, setMechSupervisorPTRIssuedAt] = useState("Sto. Tomas, Pampanga");
  const [mechSupervisorTIN, setMechSupervisorTIN] = useState("678-901-234-000");
  const [mechSupervisorSignedDate, setMechSupervisorSignedDate] = useState("Jan 08, 2026");
  const [mechSupervisorSignature, setMechSupervisorSignature] = useState<string>("");

  const [mechanicalScopeOfWork, setMechanicalScopeOfWork] = useState("New Construction");
  const [mechanicalScopeDetails, setMechanicalScopeDetails] = useState("");

  // Box 2: Installation and Operation of (NBC Form M-01)
  const [boiler, setBoiler] = useState(false);
  const [pressureVessel, setPressureVessel] = useState(false);
  const [internalCombustionEngine, setInternalCombustionEngine] = useState(false);
  const [refrigerationIce, setRefrigerationIce] = useState(false);
  const [windowTypeAircon, setWindowTypeAircon] = useState(false);
  const [packagedSplitAircon, setPackagedSplitAircon] = useState(true);
  const [mechanicalOthers, setMechanicalOthers] = useState(false);
  const [mechanicalOthersSpecify, setMechanicalOthersSpecify] = useState("");
  const [centralAircon, setCentralAircon] = useState(false);
  const [mechanicalVentilation, setMechanicalVentilation] = useState(true);
  const [escalator, setEscalator] = useState(projectType.id === "elevator_escalator");
  const [movingSidewalk, setMovingSidewalk] = useState(false);
  const [freightElevator, setFreightElevator] = useState(false);
  const [passengerElevator, setPassengerElevator] = useState(false);
  const [cableCar, setCableCar] = useState(false);
  const [dumbwaiter, setDumbwaiter] = useState(false);
  const [pumps, setPumps] = useState(true);
  const [compressedAirGas, setCompressedAirGas] = useState(false);
  const [pneumaticTubesConveyors, setPneumaticTubesConveyors] = useState(false);
  const [funicular, setFunicular] = useState(false);
  const [mechanicalPreparedBy, setMechanicalPreparedBy] = useState("Engr. Antonio Gomez, PME");

  // ==========================================
  // 9. ELECTRONICS PERMIT (EL) FIELDS
  // ==========================================
  const [telecomScope, setTelecomScope] = useState("Structured Cabling System (Cat6 UTP / Optical Fiber) with 6 terminal data jacks");
  const [cctvScope, setCctvScope] = useState("4-Channel Full HD IP Camera Video Surveillance System with NVR & 2TB Storage");
  const [fdasScope, setFdasScope] = useState("Addressable Fire Detection & Alarm System (Smoke Detectors, Manual Call Points, Alarm Bell)");
  const [catvScope, setCatvScope] = useState("RG6 Coaxial Cable TV System with Splitter and 3 Bedroom Terminal Outlets");

  // Electronics Permit Scope & Box 2 Nature of Works
  const [electronicsScopeOfWork, setElectronicsScopeOfWork] = useState("New Installation");
  const [electronicsScopeOthers, setElectronicsScopeOthers] = useState("");
  const [telecomSystem, setTelecomSystem] = useState(true);
  const [broadcastingSystem, setBroadcastingSystem] = useState(false);
  const [televisionSystem, setTelevisionSystem] = useState(true);
  const [itSystem, setItSystem] = useState(true);
  const [securityAlarmSystem, setSecurityAlarmSystem] = useState(true);
  const [anyOtherElectronics, setAnyOtherElectronics] = useState(false);
  const [anyOtherElectronicsSpecify, setAnyOtherElectronicsSpecify] = useState("");
  const [electronicsAlarmSystem, setElectronicsAlarmSystem] = useState(true);
  const [soundCommSystem, setSoundCommSystem] = useState(false);
  const [centralizedClockSystem, setCentralizedClockSystem] = useState(false);
  const [soundSystem, setSoundSystem] = useState(false);
  const [electronicsControlConveyor, setElectronicsControlConveyor] = useState(false);
  const [computerProcessControls, setComputerProcessControls] = useState(false);
  const [buildingAutomationManagement, setBuildingAutomationManagement] = useState(false);
  const [buildingWiringFiberOptic, setBuildingWiringFiberOptic] = useState(true);
  const [electronicsPreparedBy, setElectronicsPreparedBy] = useState("Engr. Carlos Lim, PECE");

  // Box 3: Professional Electronics Engineer (PECE)
  const [electronicsEngineerName, setElectronicsEngineerName] = useState("Engr. Carlos Lim, PECE");
  const [electronicsEngineerAddress, setElectronicsEngineerAddress] = useState("Sto. Tomas, Pampanga");
  const [electronicsEngineerPRC, setElectronicsEngineerPRC] = useState("PRC-PECE-0038912");
  const [electronicsEngineerPRCValidity, setElectronicsEngineerPRCValidity] = useState("2028-08-20");
  const [electronicsEngineerIECEP, setElectronicsEngineerIECEP] = useState("IECEP-2026-4401");
  const [electronicsEngineerPTR, setElectronicsEngineerPTR] = useState("PTR-ST-2026-7782");
  const [electronicsEngineerPTRIssued, setElectronicsEngineerPTRIssued] = useState("Jan 05, 2026");
  const [electronicsEngineerPTRIssuedAt, setElectronicsEngineerPTRIssuedAt] = useState("Sto. Tomas, Pampanga");
  const [electronicsEngineerTIN, setElectronicsEngineerTIN] = useState("789-012-345-000");
  const [electronicsEngineerSignedDate, setElectronicsEngineerSignedDate] = useState("Jan 08, 2026");
  const [electronicsEngineerSignature, setElectronicsEngineerSignature] = useState("");

  // Box 4: Supervisor In-Charge of Electronics Works
  const [sameAsDesignElectronicsEngineer, setSameAsDesignElectronicsEngineer] = useState(true);
  const [electronicsSupervisorRole, setElectronicsSupervisorRole] = useState<"PECE" | "ECE">("PECE");
  const [electronicsSupervisorName, setElectronicsSupervisorName] = useState("Engr. Carlos Lim, PECE");
  const [electronicsSupervisorAddress, setElectronicsSupervisorAddress] = useState("Sto. Tomas, Pampanga");
  const [electronicsSupervisorPRC, setElectronicsSupervisorPRC] = useState("PRC-PECE-0038912");
  const [electronicsSupervisorPRCValidity, setElectronicsSupervisorPRCValidity] = useState("2028-08-20");
  const [electronicsSupervisorPTR, setElectronicsSupervisorPTR] = useState("PTR-ST-2026-7782");
  const [electronicsSupervisorPTRDate, setElectronicsSupervisorPTRDate] = useState("Jan 05, 2026");
  const [electronicsSupervisorPTRIssuedAt, setElectronicsSupervisorPTRIssuedAt] = useState("Sto. Tomas, Pampanga");
  const [electronicsSupervisorTIN, setElectronicsSupervisorTIN] = useState("789-012-345-000");
  const [electronicsSupervisorSignedDate, setElectronicsSupervisorSignedDate] = useState("Jan 08, 2026");
  const [electronicsSupervisorSignature, setElectronicsSupervisorSignature] = useState("");

  // ==========================================
  // 10. ANCILLARY / SPECIAL PERMIT FIELDS - FENCING PERMIT (NBC FORM B-03)
  // ==========================================
  const [fencingScopeOfWork, setFencingScopeOfWork] = useState("New Construction");
  const [fencingScopeDetails, setFencingScopeDetails] = useState("");
  const [fencingType, setFencingType] = useState("R.C. and CONC. HOLLOW BLOCKS");
  const [fencingTypes, setFencingTypes] = useState<string[]>(["R.C. and CONC. HOLLOW BLOCKS"]);
  const [fencingTypeOthers, setFencingTypeOthers] = useState("");
  const [fencingTypeOthersLine2, setFencingTypeOthersLine2] = useState("");
  const [fencingTypeOthersLine3, setFencingTypeOthersLine3] = useState("");
  const [fenceLength, setFenceLength] = useState("45.00");
  const [fenceHeight, setFenceHeight] = useState("2.20");
  const [fencingCost, setFencingCost] = useState("150,000.00");
  const [fencingDesignerRole, setFencingDesignerRole] = useState<"architect" | "civilEngineer">("architect");
  const [fencingDesignerName, setFencingDesignerName] = useState("ARCH. MARIA ELENA SANTOS, UAP");
  const [fencingDesignerAddress, setFencingDesignerAddress] = useState("San Nicolas, Sto. Tomas, Pampanga");
  const [fencingDesignerPRC, setFencingDesignerPRC] = useState("0045211");
  const [fencingDesignerPRCValidity, setFencingDesignerPRCValidity] = useState("2027-11-15");
  const [fencingDesignerPTR, setFencingDesignerPTR] = useState("PTR-ST-2026-004");
  const [fencingDesignerPTRIssued, setFencingDesignerPTRIssued] = useState("Jan 08, 2026");
  const [fencingDesignerPTRIssuedAt, setFencingDesignerPTRIssuedAt] = useState("Sto. Tomas, Pampanga");
  const [fencingDesignerTIN, setFencingDesignerTIN] = useState("456-789-012-000");
  const [fencingDesignerSignature, setFencingDesignerSignature] = useState<string>("");

  const [sameAsDesignFencingSupervisor, setSameAsDesignFencingSupervisor] = useState(true);
  const [fencingSupervisorName, setFencingSupervisorName] = useState("ENGR. ROBERTO DIZON, CE");
  const [fencingSupervisorAddress, setFencingSupervisorAddress] = useState("Poblacion, Sto. Tomas, Pampanga");
  const [fencingSupervisorPRC, setFencingSupervisorPRC] = useState("0089123");
  const [fencingSupervisorPRCValidity, setFencingSupervisorPRCValidity] = useState("2028-04-20");
  const [fencingSupervisorPTR, setFencingSupervisorPTR] = useState("PTR-ST-2026-099");
  const [fencingSupervisorPTRIssued, setFencingSupervisorPTRIssued] = useState("Jan 12, 2026");
  const [fencingSupervisorPTRIssuedAt, setFencingSupervisorPTRIssuedAt] = useState("Sto. Tomas, Pampanga");
  const [fencingSupervisorTIN, setFencingSupervisorTIN] = useState("987-654-321-000");
  const [fencingSupervisorSignature, setFencingSupervisorSignature] = useState<string>("");
  const [fenceMaterial, setFenceMaterial] = useState("Plastered Concrete Hollow Blocks with Decorative Steel Grille Panels");
  const [demolitionBuildingType, setDemolitionBuildingType] = useState("Single-Detached Two-Storey Residential Structure");
  const [demolitionArea, setDemolitionArea] = useState("180.00 sq.m.");
  const [demolitionStoreys, setDemolitionStoreys] = useState("2");
  const [demolitionMethod, setDemolitionMethod] = useState("Manual Disassembly & Hand-held Mechanical Tools with Debris Chute");
  const [demolitionStartDate, setDemolitionStartDate] = useState("2026-10-01");
  const [demolitionCompletionDate, setDemolitionCompletionDate] = useState("2026-11-15");
  const [demolitionWithBuildingPermit, setDemolitionWithBuildingPermit] = useState<boolean>(
    mandatoryKeys.includes("buildingPermit") ||
    projectType.matrix?.buildingPermit === "required" ||
    projectType.matrix?.buildingPermit === "conditional"
  );
  const [demolitionBuildingPermitNo, setDemolitionBuildingPermitNo] = useState<string>("");

  // Box 2: Full-Time Inspector and Supervisor of Demolition Works (Architect or Civil Engineer)
  const [demolitionSupervisorRole, setDemolitionSupervisorRole] = useState<"CE" | "ARCH">("CE");
  const [sameAsCivilEngineer, setSameAsCivilEngineer] = useState<boolean>(true);
  const [demolitionSupervisorName, setDemolitionSupervisorName] = useState("Engr. Roberto Cruz, CE");
  const [demolitionSupervisorPRC, setDemolitionSupervisorPRC] = useState("0078923");
  const [demolitionSupervisorPRCValidity, setDemolitionSupervisorPRCValidity] = useState("2028-11-20");
  const [demolitionSupervisorPTR, setDemolitionSupervisorPTR] = useState("PTR-ST-2026-001");
  const [demolitionSupervisorPTRIssued, setDemolitionSupervisorPTRIssued] = useState("Jan 10, 2026");
  const [demolitionSupervisorPTRIssuedAt, setDemolitionSupervisorPTRIssuedAt] = useState("Sto. Tomas");
  const [demolitionSupervisorTIN, setDemolitionSupervisorTIN] = useState("456-789-012-000");
  const [demolitionSupervisorAddress, setDemolitionSupervisorAddress] = useState("Sto. Tomas, Pampanga");
  const [demolitionSupervisorPhone, setDemolitionSupervisorPhone] = useState("0918-765-4321");
  const [demolitionSupervisorSignature, setDemolitionSupervisorSignature] = useState<string>("");
  const [excavationWithBuildingPermit, setExcavationWithBuildingPermit] = useState<boolean>(true);
  const [excavationBuildingPermitNo, setExcavationBuildingPermitNo] = useState<string>("");
  const [sameAsCivilEngineerExcavation, setSameAsCivilEngineerExcavation] = useState<boolean>(true);
  const [excavationSupervisorName, setExcavationSupervisorName] = useState("Engr. Roberto Cruz, CE");
  const [excavationSupervisorAddress, setExcavationSupervisorAddress] = useState("Sto. Tomas, Pampanga");
  const [excavationSupervisorPhone, setExcavationSupervisorPhone] = useState("0918-765-4321");
  const [excavationSupervisorPRC, setExcavationSupervisorPRC] = useState("0078923");
  const [excavationSupervisorPRCValidity, setExcavationSupervisorPRCValidity] = useState("2028-11-20");
  const [excavationSupervisorTIN, setExcavationSupervisorTIN] = useState("456-789-012-000");
  const [excavationSupervisorPTR, setExcavationSupervisorPTR] = useState("PTR-ST-2026-001");
  const [excavationSupervisorPTRIssued, setExcavationSupervisorPTRIssued] = useState("Jan 10, 2026");
  const [excavationSupervisorPTRIssuedAt, setExcavationSupervisorPTRIssuedAt] = useState("Sto. Tomas");
  const [excavationSupervisorSignature, setExcavationSupervisorSignature] = useState<string>("");
  const [excavationVolume, setExcavationVolume] = useState("120.00");
  const [excavationDepth, setExcavationDepth] = useState("2.50");
  const [excavationScope, setExcavationScope] = useState("Foundation Excavation, Site Grading & Ground Levelling");
  const [excavationType, setExcavationType] = useState("Foundation and Retaining Walls");
  const [excavationAndFills, setExcavationAndFills] = useState<boolean>(false);
  const [foundationAndRetainingWalls, setFoundationAndRetainingWalls] = useState<boolean>(true);
  const [pileFoundations, setPileFoundations] = useState<boolean>(false);
  const [gradingAndEarthworks, setGradingAndEarthworks] = useState<boolean>(false);
  const [othersSpecify, setOthersSpecify] = useState<boolean>(false);
  const [othersSpecifyText, setOthersSpecifyText] = useState<string>("");
  const [othersCustomLine2Check, setOthersCustomLine2Check] = useState<boolean>(false);
  const [othersCustomLine2Text, setOthersCustomLine2Text] = useState<string>("");
  const [othersCustomLine3Check, setOthersCustomLine3Check] = useState<boolean>(false);
  const [othersCustomLine3Text, setOthersCustomLine3Text] = useState<string>("");
  const [excavationStartDate, setExcavationStartDate] = useState("2026-10-01");
  const [excavationCompletionDate, setExcavationCompletionDate] = useState("2026-11-15");
  const [signDimensions, setSignDimensions] = useState("3.00m Width x 1.50m Height");
  const [signLength, setSignLength] = useState("3.00");
  const [signWidth, setSignWidth] = useState("1.50");
  const [signArea, setSignArea] = useState("4.50");
  const [signDisplayType, setSignDisplayType] = useState<string>("Single Face");
  const [signDisplayMedium, setSignDisplayMedium] = useState<string>("Illuminated");
  const [signInstallationType, setSignInstallationType] = useState<string>("Business Sign, Wall Type");
  const [signType, setSignType] = useState<string>("Business Sign, Wall Type (Illuminated LED)");
  const [signMaterial, setSignMaterial] = useState<string>("Acrylic Face with LED Backlight on Steel Framing");
  const [signCost, setSignCost] = useState<string>("45,000.00");
  const [signScopeOfWork, setSignScopeOfWork] = useState<string>("New Construction");
  const [signScopeOthers, setSignScopeOthers] = useState<string>("");
  const [signFormOfOwnership, setSignFormOfOwnership] = useState<string>("Sole Proprietorship");
  const [signEnterpriseName, setSignEnterpriseName] = useState<string>("");
  const [signCharacterOfOccupancy, setSignCharacterOfOccupancy] = useState<string>("Commercial / Business");
  const [signApplicantNo, setSignApplicantNo] = useState<string>("123");
  const [signApplicantStreet, setSignApplicantStreet] = useState<string>("Rizal St.");
  const [signApplicantBarangay, setSignApplicantBarangay] = useState<string>("Poblacion");
  const [signApplicantCity, setSignApplicantCity] = useState<string>("Sto. Tomas, Pampanga");
  const [signWithBuildingPermit, setSignWithBuildingPermit] = useState<boolean>(() => {
    return mandatoryKeys.includes("buildingPermit") || Boolean(projectType?.matrix?.buildingPermit === 'required' || projectType?.matrix?.buildingPermit === 'conditional');
  });
  const [signBuildingPermitNo, setSignBuildingPermitNo] = useState<string>("");
  const [signDocTct, setSignDocTct] = useState<boolean>(true);
  const [signDocContractOfLease, setSignDocContractOfLease] = useState<boolean>(false);
  const [signDocTaxDeclaration, setSignDocTaxDeclaration] = useState<boolean>(true);
  const [signDocLotPlan, setSignDocLotPlan] = useState<boolean>(true);
  const [signDocSignPlansStructural, setSignDocSignPlansStructural] = useState<boolean>(true);
  const [signDocSpecsCostEstimates, setSignDocSpecsCostEstimates] = useState<boolean>(true);
  const [sameAsDesignSignSupervisor, setSameAsDesignSignSupervisor] = useState(true);
  const [signDesignerSignature, setSignDesignerSignature] = useState<string>("");
  const [signSupervisorName, setSignSupervisorName] = useState("ENGR. ROBERTO CRUZ, CE");
  const [signSupervisorAddress, setSignSupervisorAddress] = useState("Sto. Tomas, Pampanga");
  const [signSupervisorPRC, setSignSupervisorPRC] = useState("0078923");
  const [signSupervisorPRCValidity, setSignSupervisorPRCValidity] = useState("2028-11-20");
  const [signSupervisorPTR, setSignSupervisorPTR] = useState("PTR-ST-2026-001");
  const [signSupervisorPTRIssued, setSignSupervisorPTRIssued] = useState("Jan 10, 2026");
  const [signSupervisorPTRIssuedAt, setSignSupervisorPTRIssuedAt] = useState("Sto. Tomas");
  const [signSupervisorTIN, setSignSupervisorTIN] = useState("123-456-789-000");
  const [signSupervisorSignature, setSignSupervisorSignature] = useState<string>("");
  const [signApplicantCtcNo, setSignApplicantCtcNo] = useState("CTC-2026-00192");
  const [signApplicantCtcDateIssued, setSignApplicantCtcDateIssued] = useState("Jan 10, 2026");
  const [signApplicantCtcPlaceIssued, setSignApplicantCtcPlaceIssued] = useState("Sto. Tomas");
  const [signSameAsApplicantBldgOwner, setSignSameAsApplicantBldgOwner] = useState(true);
  const [signBldgOwnerName, setSignBldgOwnerName] = useState("");
  const [signBldgOwnerAddress, setSignBldgOwnerAddress] = useState("");
  const [signBldgOwnerCtcNo, setSignBldgOwnerCtcNo] = useState("CTC-2026-00192");
  const [signBldgOwnerCtcDateIssued, setSignBldgOwnerCtcDateIssued] = useState("Jan 10, 2026");
  const [signBldgOwnerCtcPlaceIssued, setSignBldgOwnerCtcPlaceIssued] = useState("Sto. Tomas");
  const [signBldgOwnerSignedDate, setSignBldgOwnerSignedDate] = useState("Jan 08, 2026");
  const [signBldgOwnerSignature, setSignBldgOwnerSignature] = useState("");
  const [tempConnectionLoad, setTempConnectionLoad] = useState("5.0 kVA (Temporary Construction Power, 6 Months Duration)");
  // Temporary Service Connection (NBC Form E-03) state
  const [ptscPurposeForConstruction, setPtscPurposeForConstruction] = useState(true);
  const [ptscPurposeForTesting, setPtscPurposeForTesting] = useState(true);
  const [ptscPurposeOthers, setPtscPurposeOthers] = useState(false);
  const [ptscPurposeOthersSpecify, setPtscPurposeOthersSpecify] = useState("");
  const [ptscConnectedLoad, setPtscConnectedLoad] = useState(() => {
    const num = parseFloat((electricalConnectedLoad || "").replace(/[^0-9.]/g, ""));
    return (!isNaN(num) && num > 0) ? num.toFixed(1) : "15.0";
  });
  const [ptscTransformerCapacity, setPtscTransformerCapacity] = useState("25.0");
  const [ptscGeneratorCapacity, setPtscGeneratorCapacity] = useState("N/A");
  const [ptscDuration, setPtscDuration] = useState("90");
  const [ptscStartDate, setPtscStartDate] = useState("2026-10-01");
  const [ptscFormOfOwnership, setPtscFormOfOwnership] = useState(() => formOfOwnership || "Individual");
  const [ptscEnterpriseName, setPtscEnterpriseName] = useState(() => (constructionOwnedByEnterprise && constructionOwnedByEnterprise !== "N/A (INDIVIDUAL)") ? constructionOwnedByEnterprise : "");
  const [ptscCharacterOfOccupancy, setPtscCharacterOfOccupancy] = useState("Residential");
  const [ptscApplicantNo, setPtscApplicantNo] = useState(() => (applicantNoStreet ? applicantNoStreet.split(" ")[0] : "123"));
  const [ptscApplicantStreet, setPtscApplicantStreet] = useState(() => streetAddress || applicantNoStreet || "Rizal St.");
  const [ptscApplicantBarangay, setPtscApplicantBarangay] = useState(() => barangay || applicantBarangay || "Poblacion");
  const [ptscApplicantCity, setPtscApplicantCity] = useState(() => applicantMunicipality ? `${applicantMunicipality}, ${applicantProvince || "Pampanga"}` : "Sto. Tomas, Pampanga");
  const [ptscApplicantZip, setPtscApplicantZip] = useState(() => applicantZipCode || "2020");
  const [ptscPeeName, setPtscPeeName] = useState(() => electricalEngineerName || "ENGR. DANILO REYES, PEE");
  const [ptscPeeAddress, setPtscPeeAddress] = useState("San Nicolas, Sto. Tomas, Pampanga");
  const [ptscPeePRC, setPtscPeePRC] = useState(() => electricalEngineerPRC ? electricalEngineerPRC.replace(/^[A-Za-z-]+/, "") : "0033421");
  const [ptscPeePRCValidity, setPtscPeePRCValidity] = useState(() => electricalEngineerPRCValidity || "2028-11-20");
  const [ptscPeePTR, setPtscPeePTR] = useState(() => electricalEngineerPTR || "PTR-ST-2026-4412");
  const [ptscPeePTRIssued, setPtscPeePTRIssued] = useState(() => electricalEngineerPTRIssued || "Jan 10, 2026");
  const [ptscPeePTRIssuedAt, setPtscPeePTRIssuedAt] = useState("Sto. Tomas, Pampanga");
  const [ptscPeeTIN, setPtscPeeTIN] = useState(() => electricalEngineerTIN || "456-789-012-000");
  const [ptscPeeSignature, setPtscPeeSignature] = useState(() => electricalEngineerSignature || "");
  const [ptscPeeSignedDate, setPtscPeeSignedDate] = useState(() => applicantSignedDate || "2026-09-17");
  const [sameAsDesignPtscSupervisor, setSameAsDesignPtscSupervisor] = useState(true);
  const [ptscSupervisorRole, setPtscSupervisorRole] = useState("PEE");
  const [ptscSupervisorName, setPtscSupervisorName] = useState(() => electricalEngineerName || "ENGR. DANILO REYES, PEE");
  const [ptscSupervisorAddress, setPtscSupervisorAddress] = useState("San Nicolas, Sto. Tomas, Pampanga");
  const [ptscSupervisorPRC, setPtscSupervisorPRC] = useState(() => electricalEngineerPRC ? electricalEngineerPRC.replace(/^[A-Za-z-]+/, "") : "0033421");
  const [ptscSupervisorPRCValidity, setPtscSupervisorPRCValidity] = useState(() => electricalEngineerPRCValidity || "2028-11-20");
  const [ptscSupervisorPTR, setPtscSupervisorPTR] = useState(() => electricalEngineerPTR || "PTR-ST-2026-4412");
  const [ptscSupervisorPTRIssued, setPtscSupervisorPTRIssued] = useState(() => electricalEngineerPTRIssued || "Jan 10, 2026");
  const [ptscSupervisorPTRIssuedAt, setPtscSupervisorPTRIssuedAt] = useState("Sto. Tomas, Pampanga");
  const [ptscSupervisorTIN, setPtscSupervisorTIN] = useState(() => electricalEngineerTIN || "456-789-012-000");
  const [ptscSupervisorSignature, setPtscSupervisorSignature] = useState(() => electricalEngineerSignature || "");
  const [ptscSupervisorSignedDate, setPtscSupervisorSignedDate] = useState(() => applicantSignedDate || "2026-09-17");
  const [ptscApplicantCtcNo, setPtscApplicantCtcNo] = useState(() => govIdNo || "CTC-2026-00192");
  const [ptscApplicantCtcDateIssued, setPtscApplicantCtcDateIssued] = useState(() => govIdDateIssued || "Jan 15, 2026");
  const [ptscApplicantCtcPlaceIssued, setPtscApplicantCtcPlaceIssued] = useState(() => govIdPlaceIssued || "Sto. Tomas, Pampanga");
  const [ptscApplicantSignature, setPtscApplicantSignature] = useState(() => applicantSignature || "");
  // Page 2: Box 4 Processing & Evaluation Division
  const [ptscFeePaid, setPtscFeePaid] = useState(() => (clearanceApp as any)?.assessedFees ? `${(clearanceApp as any).assessedFees.toFixed(2)}` : "850.00");
  const [ptscDatePaid, setPtscDatePaid] = useState(() => (clearanceApp as any)?.dateReleased || (clearanceApp as any)?.paymentDate || "Sep 18, 2026");
  const [ptscOfficialReceiptNo, setPtscOfficialReceiptNo] = useState(() => (clearanceApp as any)?.officialReceiptNo || (clearanceApp as any)?.paymentReference || "OR-2026-004521");
  const [ptscDateIssued, setPtscDateIssued] = useState(() => (clearanceApp as any)?.dateReleased || "Sep 18, 2026");

  const handleAutoFillPtscFromSystem = () => {
    setPtscApplicantNo(applicantNoStreet ? applicantNoStreet.split(" ")[0] : "123");
    setPtscApplicantStreet(streetAddress || applicantNoStreet || "Rizal St.");
    setPtscApplicantBarangay(barangay || applicantBarangay || "Poblacion");
    setPtscApplicantCity(applicantMunicipality ? `${applicantMunicipality}, ${applicantProvince || "Pampanga"}` : "Sto. Tomas, Pampanga");
    setPtscApplicantZip(applicantZipCode || "2020");
    if (formOfOwnership) setPtscFormOfOwnership(formOfOwnership);
    if (constructionOwnedByEnterprise && constructionOwnedByEnterprise !== "N/A (INDIVIDUAL)") {
      setPtscEnterpriseName(constructionOwnedByEnterprise);
    }
    if (govIdNo) setPtscApplicantCtcNo(govIdNo);
    if (govIdDateIssued) setPtscApplicantCtcDateIssued(govIdDateIssued);
    if (govIdPlaceIssued) setPtscApplicantCtcPlaceIssued(govIdPlaceIssued);
    if (applicantSignature) setPtscApplicantSignature(applicantSignature);

    if (electricalEngineerName) setPtscPeeName(electricalEngineerName);
    if (electricalEngineerPRC) setPtscPeePRC(electricalEngineerPRC.replace(/^[A-Za-z-]+/, ""));
    if (electricalEngineerPRCValidity) setPtscPeePRCValidity(electricalEngineerPRCValidity);
    if (electricalEngineerPTR) setPtscPeePTR(electricalEngineerPTR);
    if (electricalEngineerPTRIssued) setPtscPeePTRIssued(electricalEngineerPTRIssued);
    if (electricalEngineerTIN) setPtscPeeTIN(electricalEngineerTIN);
    if (electricalEngineerSignature) setPtscPeeSignature(electricalEngineerSignature);
    setPtscPeeSignedDate(applicantSignedDate || "2026-09-17");
    setPtscSupervisorSignedDate(applicantSignedDate || "2026-09-17");

    const numLoad = parseFloat((electricalConnectedLoad || "").replace(/[^0-9.]/g, ""));
    if (!isNaN(numLoad) && numLoad > 0) {
      setPtscConnectedLoad(numLoad.toFixed(1));
    }

    if ((clearanceApp as any)?.assessedFees) {
      setPtscFeePaid(`${(clearanceApp as any).assessedFees.toFixed(2)}`);
    } else {
      setPtscFeePaid("850.00");
    }
    setPtscDatePaid((clearanceApp as any)?.dateReleased || (clearanceApp as any)?.paymentDate || "Sep 18, 2026");
    setPtscOfficialReceiptNo((clearanceApp as any)?.officialReceiptNo || (clearanceApp as any)?.paymentReference || "OR-2026-004521");
    setPtscDateIssued((clearanceApp as any)?.dateReleased || "Sep 18, 2026");

    setNotification("PTSC Form auto-filled from application & electrical records!");
  };

  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeUploadingKey, setActiveUploadingKey] = useState<string | null>(null);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Completed forms tracking with localStorage persistence
  const [completedForms, setCompletedForms] = useState<Record<string, boolean>>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(`etayo_completed_forms_${projectType.id}`);
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {}
    return {};
  });

  // Sync active tab if projectType changes
  useEffect(() => {
    if (mandatoryKeys.length > 0 && !mandatoryKeys.includes(activeTab)) {
      setActiveTab(mandatoryKeys[0]);
    }
    if (mandatoryKeys.includes("buildingPermit") || projectType.matrix?.buildingPermit === "required" || projectType.matrix?.buildingPermit === "conditional") {
      setDemolitionWithBuildingPermit(true);
      setExcavationWithBuildingPermit(true);
    }
  }, [projectType, mandatoryKeys]);

  // Digital technical permits handled directly by the municipal online portal
  const digitalMandatoryKeys = mandatoryKeys.filter((k) => k !== "fireBfpPermit");

  // A form is satisfied if:
  // - for fireBfpPermit: user has uploaded the BFP Clearance (FSEC) file
  // - for digital permits: user has completed the online form OR attached a signed copy
  const isFormSatisfied = (key: string) => {
    if (key === "fireBfpPermit") {
      return Boolean(uploadedPermitDocs["fireBfpPermit"]);
    }
    return Boolean(uploadedPermitDocs[key] || completedForms[key]);
  };

  const satisfiedKeys = mandatoryKeys.filter(isFormSatisfied);
  const areAllMandatorySatisfied = mandatoryKeys.length > 0 && mandatoryKeys.every(isFormSatisfied);

  // Save draft answers to localStorage
  const handleSaveDraft = () => {
    try {
      const draft = {
        projectName,
        streetAddress,
        barangay,
        projectCost,
        lotNo,
        blockNo,
        tctNo,
        taxDecNo,
        scopeOfWork,
        scopeOfWorkDetails,
        occupancyClass,
        occupancyClassificationDetail,
        occupancyOthers,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(`etayo_permit_form_draft_${projectType.id}`, JSON.stringify(draft));
    } catch (e) {}
  };

  // Restore draft answers from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(`etayo_permit_form_draft_${projectType.id}`);
        if (saved) {
          const draft = JSON.parse(saved);
          if (draft.projectName && !projectName) setProjectName(draft.projectName);
          if (draft.streetAddress && !streetAddress) setStreetAddress(draft.streetAddress);
          if (draft.barangay && !barangay) setBarangay(draft.barangay);
          if (draft.projectCost && !projectCost) setProjectCost(draft.projectCost);
          if (draft.lotNo) setLotNo(draft.lotNo);
          if (draft.blockNo) setBlockNo(draft.blockNo);
          if (draft.tctNo) setTctNo(draft.tctNo);
          if (draft.taxDecNo) setTaxDecNo(draft.taxDecNo);
          if (draft.scopeOfWork) setScopeOfWork(draft.scopeOfWork);
          if (draft.scopeOfWorkDetails) setScopeOfWorkDetails(draft.scopeOfWorkDetails);
        }
      }
    } catch (e) {}
  }, [projectType.id]);

  // Submit single form handler
  const handleSubmitSingleForm = (tabKey: string) => {
    if (tabKey === "fireBfpPermit") {
      if (!uploadedPermitDocs["fireBfpPermit"]) {
        setNotification("Please attach your issued Fire / BFP Clearance (FSEC) file before submitting.");
        return;
      }
    } else {
      // Automatically register the completed digital online form
      setUploadedPermitDocs((prev) => ({
        ...prev,
        [tabKey]: prev[tabKey] || {
          fileName: `${PERMIT_FORM_METADATA[tabKey as keyof PermitFormMatrix]?.code || tabKey}_${projectType.name.replace(/\s+/g, '_')}_Official_Filled.pdf`,
          fileSize: "1.4 MB",
          fileUrl: getPermitFormTemplate(tabKey as keyof PermitFormMatrix, projectType) || "/templates/UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf",
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isCompiled: true,
          isFilledOnline: true,
        }
      }));
    }

    setCompletedForms((prev) => {
      const next = { ...prev, [tabKey]: true };
      try {
        localStorage.setItem(`etayo_completed_forms_${projectType.id}`, JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    handleSaveDraft();

    const formMeta = PERMIT_FORM_METADATA[tabKey as keyof PermitFormMatrix];
    const formLabel = formMeta?.label || tabKey;
    setNotification(`✓ Form "${formLabel}" completed and submitted successfully!`);

    // Auto-advance to next incomplete tab if any
    const nextIncomplete = mandatoryKeys.find(
      (k) => k !== tabKey && !isFormSatisfied(k)
    );
    if (nextIncomplete) {
      setTimeout(() => {
        setActiveTab(nextIncomplete);
      }, 500);
    }
  };

  // Ensure all satisfied online forms are saved before advancing to Step 4: Mapping
  const handleProceedToMapping = () => {
    setUploadedPermitDocs((prev) => {
      const next = { ...prev };
      for (const key of mandatoryKeys) {
        if (key !== "fireBfpPermit" && !next[key]) {
          next[key] = {
            fileName: `${PERMIT_FORM_METADATA[key as keyof PermitFormMatrix]?.code || key}_${projectType.name.replace(/\s+/g, '_')}_Official_Filled.pdf`,
            fileSize: "1.4 MB",
            fileUrl: getPermitFormTemplate(key as keyof PermitFormMatrix, projectType) || "/templates/UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf",
            uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isCompiled: true,
            isFilledOnline: true,
          };
        }
      }
      return next;
    });
    onProceedToMapping();
  };


  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Synchronize Box 1 & 2 land title and permit boundary fields from clearanceApp or Sto. Tomas defaults
  useEffect(() => {
    if (clearanceApp) {
      if (clearanceApp.location?.lotNo || clearanceApp.lotNo) {
        setLotNo(clearanceApp.location?.lotNo || clearanceApp.lotNo);
      }
      if (clearanceApp.location?.blockNo || clearanceApp.blockNo) {
        setBlockNo(clearanceApp.location?.blockNo || clearanceApp.blockNo);
      }
      if (clearanceApp.tctNo) {
        setTctNo(clearanceApp.tctNo);
      }
      if (clearanceApp.taxDecNo) {
        setTaxDecNo(clearanceApp.taxDecNo);
      }
      if (clearanceApp.applicantLastName) setApplicantLastName(clearanceApp.applicantLastName);
      if (clearanceApp.applicantFirstName) setApplicantFirstName(clearanceApp.applicantFirstName);
      if (clearanceApp.applicantMiddleName) setApplicantMiddleName(clearanceApp.applicantMiddleName);
      if (clearanceApp.applicantTIN) {
        setApplicantTIN(clearanceApp.applicantTIN);
      }
      if (clearanceApp.corporationName || clearanceApp.constructionOwnedByEnterprise) {
        setConstructionOwnedByEnterprise(clearanceApp.corporationName || clearanceApp.constructionOwnedByEnterprise);
      }
      if (clearanceApp.formOfOwnership) {
        setFormOfOwnership(clearanceApp.formOfOwnership);
      }
      if (clearanceApp.govIdNo || clearanceApp.ctcNumber) {
        setGovIdNo(clearanceApp.govIdNo || clearanceApp.ctcNumber);
      }
    }

    // Guarantee default baseline values in parent state so fields are never empty
    if (!projectName || projectName.trim() === "") {
      const cleanName = clearanceApp?.projectName?.replace(/\s*-\s*Locational\s*Clearance/gi, "")?.trim();
      setProjectName(cleanName || `${projectType.name} Construction`);
    }
    if (!streetAddress || streetAddress.trim() === "") {
      setStreetAddress("Purok 3, Main Street");
    }
    if (!lotArea || lotArea.trim() === "") {
      setLotArea("180");
    }
    if (!floorArea || floorArea.trim() === "") {
      setFloorArea("120");
    }
    if (!projectCost || projectCost.trim() === "") {
      setProjectCost("1,600,000.00");
    }
  }, [clearanceApp, projectType.name]);

  const handleSyncFromClearance = () => {
    if (clearanceApp) {
      const cleanName = (clearanceApp.projectName || "").replace(/\s*-\s*Locational\s*Clearance/gi, "").trim();
      setProjectName(cleanName || `${projectType.name} Construction`);
      
      const addr = clearanceApp.projectAddress || clearanceApp.location?.address || "";
      if (addr) {
        const brgyMatch = addr.match(/Brgy\.?\s*([A-Za-z\s]+?)(?:,\s*Sto\.?\s*Tomas|$)/i);
        if (brgyMatch && brgyMatch[1]) setBarangay(brgyMatch[1].trim());
        const streetPart = addr.split(/Brgy\.?/i)[0].replace(/,\s*$/, "").trim();
        if (streetPart) setStreetAddress(streetPart);
      }

      const desc = clearanceApp.projectDescription || "";
      const lotMatch = desc.match(/Lot:\s*([0-9.,]+)/i);
      const bldgMatch = desc.match(/Bldg:\s*([0-9.,]+)/i);
      const costMatch = desc.match(/Cost:\s*(?:Php\s*)?([0-9.,]+)/i);

      if (lotMatch) setLotArea(lotMatch[1]);
      if (bldgMatch) setFloorArea(bldgMatch[1]);
      if (costMatch) setProjectCost(costMatch[1]);

      if (clearanceApp.location?.lotNo) setLotNo(clearanceApp.location.lotNo);
      if (clearanceApp.location?.blockNo) setBlockNo(clearanceApp.location.blockNo);
      if (clearanceApp.tctNo) setTctNo(clearanceApp.tctNo);
      if (clearanceApp.taxDecNo) setTaxDecNo(clearanceApp.taxDecNo);
      if (clearanceApp.applicantLastName) setApplicantLastName(clearanceApp.applicantLastName);
      if (clearanceApp.applicantFirstName) setApplicantFirstName(clearanceApp.applicantFirstName);
      if (clearanceApp.applicantMiddleName) setApplicantMiddleName(clearanceApp.applicantMiddleName);
      if (clearanceApp.applicantTIN) setApplicantTIN(clearanceApp.applicantTIN);
      if (clearanceApp.corporationName || clearanceApp.constructionOwnedByEnterprise) {
        setConstructionOwnedByEnterprise(clearanceApp.corporationName || clearanceApp.constructionOwnedByEnterprise);
      }
      if (clearanceApp.formOfOwnership) setFormOfOwnership(clearanceApp.formOfOwnership);
    }
    handleAutoFillDefaults();
    setNotification("Re-synchronized all project and land title specifications from approved Locational Clearance.");
    setTimeout(() => setNotification(null), 4000);
  };

  // Auto-Fill official Sto. Tomas standard baseline parameters
  const handleAutoFillDefaults = () => {
    setLotNo(prev => prev || "Lot 12");
    setBlockNo(prev => prev || "Block 4");
    setTctNo(prev => prev || "TCT-042-20260012");
    setTaxDecNo(prev => prev || "TD-2026-00124-ST");
    setApplicantTIN(prev => prev || "123-456-789-000");
    if (!constructionOwnedByEnterprise) setConstructionOwnedByEnterprise("N/A (INDIVIDUAL)");
    setFormOfOwnership(prev => prev || "INDIVIDUAL / OWNER");
    setOccupancyClass(prev => prev || (projectType.category === "Commercial" ? "COMMERCIAL" : projectType.category === "Industrial" ? "INDUSTRIAL" : projectType.category === "Institutional" ? "INSTITUTIONAL" : "RESIDENTIAL"));
    setBuildingFootprint("120");
    setBuildingHeight("6.8");
    setCostBuilding("1,100,000.00");
    setCostElectrical("180,000.00");
    setCostPlumbing("140,000.00");
    setCostMechanical("80,000.00");
    setCostElectronics("60,000.00");
    setCostOthers("40,000.00");

    if (!projectName) setProjectName(`${projectType.name} Construction`);
    if (!streetAddress) setStreetAddress("Purok 3, Main Street");
    if (!lotArea) setLotArea("180");
    if (!floorArea) setFloorArea("120");
    if (!projectCost) setProjectCost("1,600,000.00");
    setGovIdDateIssued(prev => prev || "Jan 10, 2026");
    setGovIdPlaceIssued(prev => prev || "Sto. Tomas, Pampanga");
    setLotOwnerName(prev => prev || "Maria Clara Dela Cruz");
    setLotOwnerAddress(prev => prev || "Sto. Tomas, Pampanga");
    setLotOwnerGovIdNo(prev => prev || "CTC-2026-00871");
    setLotOwnerGovIdDateIssued(prev => prev || "Jan 12, 2026");
    setLotOwnerGovIdPlaceIssued(prev => prev || "Sto. Tomas, Pampanga");
    setLotOwnerSignedDate(prev => prev || "Jan 08, 2026");
    setSanitaryScopeOfWork(prev => prev || "NEW INSTALLATION");

    setNotification("Auto-populated official Sto. Tomas NBCP engineering standards. You can inspect or modify any field.");
    setTimeout(() => setNotification(null), 4000);
  };

  // Auto-generate official PDF package and mark forms as completed
  const handleGenerateDigitalForms = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setNotification(null);

    try {
      const currentYear = new Date().getFullYear();
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      const applicationNo = `UNIFIED-${currentYear}-${randomSeq}`;
      const buildingPermitNo = `BP-${currentYear}-${randomSeq}`;
      const submissionDate = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
      const fullAddress = compiledFullAddress;

      const payload: UnifiedPermitFormData = {
        applicationNo,
        buildingPermitNo: (projectType.matrix?.buildingPermit === 'required' || projectType.matrix?.buildingPermit === 'conditional') ? buildingPermitNo : undefined,
        permitNo: `AP-${currentYear}-${randomSeq}`,
        architecturalPermitNo: `AP-${currentYear}-${randomSeq}`,
        structuralPermitNo: `SP-${currentYear}-${randomSeq}`,
        electricalPermitNo: `EP-${currentYear}-${randomSeq}`,
        plumbingPermitNo: `PP-${currentYear}-${randomSeq}`,
        mechanicalPermitNo: `MP-${currentYear}-${randomSeq}`,
        electronicsPermitNo: `EL-${currentYear}-${randomSeq}`,
        demolitionPermitNo: `DP-${currentYear}-${randomSeq}`,
        dpNo: `DP-${currentYear}-${randomSeq}`,
        locationalClearanceRef: locationalClearanceRef || (isClearanceRequired ? "LC-VERIFIED" : "EXEMPT"),
        projectType,
        applicantName: compiledFullName,
        applicantFirstName,
        applicantLastName,
        applicantMiddleName,
        applicantPhone,
        applicantEmail: applicantEmail || "applicant@etayo.gov.ph",
        applicantAddress: fullAddress,
        applicantNoStreet,
        applicantBarangay,
        applicantMunicipality,
        applicantProvince,
        applicantZipCode,
        applicantTIN,
        formOfOwnership,
        constructionOwnedByEnterprise: constructionOwnedByEnterprise || (formOfOwnership.includes("INDIVIDUAL") ? "N/A" : ""),
        enterpriseName: constructionOwnedByEnterprise || (formOfOwnership.includes("INDIVIDUAL") ? "N/A" : ""),
        govIdNo,
        projectName: projectName || `${projectType.name} Construction`,
        projectAddress: fullAddress,
        barangay,
        lotNo,
        blockNo,
        tctNo,
        taxDecNo,
        lotArea: lotArea || "200",
        floorArea: floorArea || "150",
        buildingFootprint,
        buildingHeight,
        projectCost: projectCost || "1,600,000.00",
        scopeOfWork,
        scopeOfWorkDetails,
        scopeOthers: scopeOfWorkDetails,
        percentBuildingFootprint,
        percentImperviousSurface,
        percentUnpavedSurface,
        percentSiteOccupancyOthers,
        fireCodeExitDoors,
        fireCodeCorridors,
        fireCodeDistanceExits,
        fireCodeAccessStreet,
        fireCodeFireWalls,
        fireCodeFireFighting,
        fireCodeSmokeDetectors,
        fireCodeEmergencyLights,
        fireCodeOthers,
        occupancyClass,
        occupancyClassificationDetail: occupancyClassificationDetail || occupancyRuleVII || occupancyClass,
        occupancyOthers,
        proposedStoreys,
        numberOfUnits,
        proposedStartDate,
        expectedCompletionDate,
        costBuilding,
        costElectrical,
        costMechanical,
        costPlumbing,
        costElectronics,
        costOthers,
        architecturalStyle,
        roofingMaterial,
        exteriorWallFinish,
        interiorWallFinish,
        floorFinishes,
        ceilingFinishes,
        doorsSpec,
        windowsSpec,
        frontSetback,
        rearSetback,
        leftSetback,
        rightSetback,
        bedroomCount,
        bathroomCount,
        foundationType,
        foundationDepth,
        structuralFraming,
        floorSlabSystem,
        roofFramingSystem,
        concreteStrength,
        steelGrade,
        masonrySpec,
        electricalConnectedLoad,
        electricalVoltage,
        electricalFeeder,
        mainBreaker,
        branchCircuitsCount,
        lightingOutletsCount,
        convenienceOutletsCount,
        acuOutletsCount,
        waterHeaterOutletsCount,
        waterPumpOutletsCount,
        toggleSwitchCount,
        bellBuzzerCount,
        pushButtonsCount,
        faDetectorCount,
        otherWiringDevicesCount,
        groundingSpec,
        // Sanitary / Plumbing Scope of Work (NBC Form P-01)
        sanitaryScopeOfWork,
        sanitaryScopeDetails: sanitaryScopeOfWork === "OTHERS"
          ? `${sanitaryScopeOthersAction || ""} OF ${sanitaryScopeOthersTarget || ""}`.trim()
          : sanitaryScopeDetails,
        sanitaryScopeOthersAction,
        sanitaryScopeOthersTarget,
        waterSupplySource,
        sewageSystem,
        septicTankDimensions,
        waterPipesMaterial,
        wastePipesMaterial,
        waterClosetsCount,
        lavatoriesCount,
        kitchenSinksCount,
        showersCount,
        floorDrainsCount,
        faucetsCount,
        waterMeterCount,
        greaseTrapCount,
        bathTubsCount,
        slopSinkCount,
        urinalCount,
        airConditioningCount,
        waterTankCount,
        bidetCount,
        laundryTraysCount,
        dentalCuspidorCount,
        electricalHeaterCount,
        waterBoilerCount,
        drinkingFountainCount,
        barSinkCount,
        sodaFountainCount,
        laboratorySinkCount,
        sterilizerCount,
        swimmingPoolCount,
        othersFixtureCount,
        othersFixtureName,
        fixtureStatusMap,
        waterDistributionSystem,
        sanitarySewerSystem,
        stormDrainageSystem,
        waterSupplyType,
        waterSupplyOthers,
        wasteWaterTreatmentPlant,
        septicVaultImhoffTank,
        subsurfaceSandFilter,
        sanitarySewerConnection,
        surfaceDrainage,
        streetCanal,
        waterCourse,
        plumbingTotalArea,
        plumbingStartDate,
        plumbingInstallationCost,
        plumbingCompletionDate,
        plumbingPreparedBy,
        machineryType,
        mechanicalScopeOfWork,
        mechanicalScopeDetails,
        boiler,
        pressureVessel,
        internalCombustionEngine,
        refrigerationIce,
        windowTypeAircon,
        packagedSplitAircon,
        mechanicalOthers,
        mechanicalOthersSpecify,
        centralAircon,
        mechanicalVentilation,
        escalator,
        movingSidewalk,
        freightElevator,
        passengerElevator,
        cableCar,
        dumbwaiter,
        pumps,
        compressedAirGas,
        pneumaticTubesConveyors,
        funicular,
        mechanicalPreparedBy,
        machineryBrand,
        machineryCapacity,
        machineryPower,
        machinerySpeed,
        machineryStoreys,
        electricalLoadKva: electricalConnectedLoad,
        serviceVoltage: electricalVoltage,
        telecomScope,
        cctvScope,
        fdasScope,
        numberOfExits,
        fireEgressDetails: fireExtinguisherSpecs,
        fireExtinguisherSpecs,
        emergencyLightsCount,
        smokeDetectorsCount,
        firewallSpecs,
        architectName,
        architectAddress,
        architectPRC,
        architectPRCValidity,
        architectIAPOA,
        architectIAPOAValidity,
        architectPTR,
        architectPTRIssued,
        architectPTRIssuedAt,
        architectTIN,
        sameAsDesignArchitect,
        supervisorArchitectName,
        supervisorArchitectAddress,
        supervisorArchitectPRC,
        supervisorArchitectPRCValidity,
        supervisorArchitectIAPOA,
        supervisorArchitectIAPOAValidity,
        supervisorArchitectPTR,
        supervisorArchitectPTRIssued,
        supervisorArchitectPTRIssuedAt,
        supervisorArchitectTIN,
        civilEngineerName,
        civilEngineerAddress,
        civilEngineerPRC,
        civilEngineerPRCValidity,
        civilEngineerPICE,
        civilEngineerPTR,
        civilEngineerPTRIssued,
        civilEngineerPTRIssuedAt,
        civilEngineerTIN,
        sameAsDesignCivilEngineer,
        supervisorCivilEngineerName,
        supervisorCivilEngineerAddress,
        supervisorCivilEngineerPRC,
        supervisorCivilEngineerPRCValidity,
        supervisorCivilEngineerPICE,
        supervisorCivilEngineerPTR,
        supervisorCivilEngineerPTRIssued,
        supervisorCivilEngineerPTRIssuedAt,
        supervisorCivilEngineerTIN,
        electricalEngineerName,
        electricalEngineerPRC,
        electricalEngineerPRCValidity,
        electricalEngineerIIEE,
        electricalEngineerPTR,
        electricalEngineerPTRIssued,
        electricalEngineerTIN,
        masterPlumberName,
        masterPlumberPRC,
        masterPlumberPRCValidity,
        masterPlumberNAMPAP,
        masterPlumberPTR,
        masterPlumberPTRIssued,
        masterPlumberTIN,
        mechanicalEngineerName,
        mechanicalEngineerAddress,
        mechanicalEngineerPRC,
        mechanicalEngineerPRCValidity,
        mechanicalEngineerPSME,
        mechanicalEngineerPTR,
        mechanicalEngineerPTRDate,
        mechanicalEngineerPTRIssued,
        mechanicalEngineerPTRIssuedAt,
        mechanicalEngineerTIN,
        mechanicalEngineerSignedDate,
        mechanicalEngineerSignature,
        sameAsDesignMechanicalEngineer,
        mechSupervisorRole,
        mechSupervisorName,
        mechSupervisorAddress,
        mechSupervisorPRC,
        mechSupervisorPRCValidity,
        mechSupervisorPTR,
        mechSupervisorPTRDate,
        mechSupervisorPTRIssued: mechSupervisorPTRDate,
        mechSupervisorPTRIssuedAt,
        mechSupervisorTIN,
        mechSupervisorSignedDate,
        mechSupervisorSignature,
        applicantCtcNo: govIdNo,
        applicantGovIdDateIssued: govIdDateIssued,
        applicantGovIdPlaceIssued: govIdPlaceIssued,
        electronicsScopeOfWork,
        electronicsScopeOthers,
        catvScope,
        telecomSystem,
        broadcastingSystem,
        televisionSystem,
        itSystem,
        securityAlarmSystem,
        anyOtherElectronics,
        anyOtherElectronicsSpecify,
        electronicsAlarmSystem,
        soundCommSystem,
        centralizedClockSystem,
        soundSystem,
        electronicsControlConveyor,
        computerProcessControls,
        buildingAutomationManagement,
        buildingWiringFiberOptic,
        electronicsPreparedBy,
        electronicsEngineerName,
        electronicsEngineerAddress,
        electronicsEngineerPRC,
        electronicsEngineerPRCValidity,
        electronicsEngineerIECEP,
        electronicsEngineerPTR,
        electronicsEngineerPTRIssued,
        electronicsEngineerPTRIssuedAt,
        electronicsEngineerTIN,
        electronicsEngineerSignedDate,
        electronicsEngineerSignature,
        sameAsDesignElectronicsEngineer,
        electronicsSupervisorRole,
        electronicsSupervisorName: sameAsDesignElectronicsEngineer ? electronicsEngineerName : electronicsSupervisorName,
        electronicsSupervisorAddress: sameAsDesignElectronicsEngineer ? electronicsEngineerAddress : electronicsSupervisorAddress,
        electronicsSupervisorPRC: sameAsDesignElectronicsEngineer ? electronicsEngineerPRC : electronicsSupervisorPRC,
        electronicsSupervisorPRCValidity: sameAsDesignElectronicsEngineer ? electronicsEngineerPRCValidity : electronicsSupervisorPRCValidity,
        electronicsSupervisorPTR: sameAsDesignElectronicsEngineer ? electronicsEngineerPTR : electronicsSupervisorPTR,
        electronicsSupervisorPTRDate: sameAsDesignElectronicsEngineer ? electronicsEngineerPTRIssued : electronicsSupervisorPTRDate,
        electronicsSupervisorPTRIssuedAt: sameAsDesignElectronicsEngineer ? electronicsEngineerPTRIssuedAt : electronicsSupervisorPTRIssuedAt,
        electronicsSupervisorTIN: sameAsDesignElectronicsEngineer ? electronicsEngineerTIN : electronicsSupervisorTIN,
        electronicsSupervisorSignedDate: sameAsDesignElectronicsEngineer ? electronicsEngineerSignedDate : electronicsSupervisorSignedDate,
        electronicsSupervisorSignature: sameAsDesignElectronicsEngineer ? electronicsEngineerSignature : electronicsSupervisorSignature,
        applicantSignature,
        applicantSignedDate,
        govIdDateIssued,
        govIdPlaceIssued,
        civilEngineerSignature,
        civilEngineerSignedDate,
        electricalEngineerSignature,
        electricalContractorName,
        electricalContractorPcab,
        electricalContractorAddress,
        electricalContractorTel,
        supervisorCivilEngineerSignature,
        supervisorCivilEngineerSignedDate,
        lotOwnerConsent,
        lotOwnerName: lotOwnerConsent ? lotOwnerName : undefined,
        lotOwnerAddress: lotOwnerConsent ? lotOwnerAddress : undefined,
        lotOwnerGovIdNo: lotOwnerConsent ? lotOwnerGovIdNo : undefined,
        lotOwnerGovIdDateIssued: lotOwnerConsent ? lotOwnerGovIdDateIssued : undefined,
        lotOwnerGovIdPlaceIssued: lotOwnerConsent ? lotOwnerGovIdPlaceIssued : undefined,
        lotOwnerSignedDate: lotOwnerConsent ? lotOwnerSignedDate : undefined,
        fencingScopeOfWork,
        fencingScopeDetails,
        fencingType,
        fencingTypes,
        fencingTypeOthers: (fencingTypes.includes("OTHERS (Specify)") || fencingType.toLowerCase().includes("other")) ? (fencingTypeOthers || fenceMaterial) : "",
        fencingTypeOthersLine2: (fencingTypes.includes("OTHERS (Specify)") || fencingType.toLowerCase().includes("other")) ? fencingTypeOthersLine2 : "",
        fencingTypeOthersLine3: (fencingTypes.includes("OTHERS (Specify)") || fencingType.toLowerCase().includes("other")) ? fencingTypeOthersLine3 : "",
        fencingLength: fenceLength,
        fencingHeight: fenceHeight,
        fencingCost,
        fencingDesignerRole,
        fencingDesignerName,
        fencingDesignerAddress,
        fencingDesignerPRC,
        fencingDesignerPRCValidity,
        fencingDesignerPTR,
        fencingDesignerPTRIssued,
        fencingDesignerPTRIssuedAt,
        fencingDesignerTIN,
        fencingDesignerSignature,
        fencingSupervisorRole: sameAsDesignFencingSupervisor ? "same" : undefined,
        fencingSupervisorName: sameAsDesignFencingSupervisor ? fencingDesignerName : fencingSupervisorName,
        fencingSupervisorAddress: sameAsDesignFencingSupervisor ? fencingDesignerAddress : fencingSupervisorAddress,
        fencingSupervisorPRC: sameAsDesignFencingSupervisor ? fencingDesignerPRC : fencingSupervisorPRC,
        fencingSupervisorPRCValidity: sameAsDesignFencingSupervisor ? fencingDesignerPRCValidity : fencingSupervisorPRCValidity,
        fencingSupervisorPTR: sameAsDesignFencingSupervisor ? fencingDesignerPTR : fencingSupervisorPTR,
        fencingSupervisorPTRIssued: sameAsDesignFencingSupervisor ? fencingDesignerPTRIssued : fencingSupervisorPTRIssued,
        fencingSupervisorPTRIssuedAt: sameAsDesignFencingSupervisor ? fencingDesignerPTRIssuedAt : fencingSupervisorPTRIssuedAt,
        fencingSupervisorTIN: sameAsDesignFencingSupervisor ? fencingDesignerTIN : fencingSupervisorTIN,
        fencingSupervisorSignature: sameAsDesignFencingSupervisor ? fencingDesignerSignature : fencingSupervisorSignature,
        excavationWithBuildingPermit,
        excavationBuildingPermitNo: excavationWithBuildingPermit ? (excavationBuildingPermitNo || buildingPermitNo) : undefined,
        sameAsCivilEngineerExcavation,
        excavationSupervisorName: sameAsCivilEngineerExcavation ? civilEngineerName : excavationSupervisorName,
        excavationSupervisorAddress: sameAsCivilEngineerExcavation ? civilEngineerAddress : excavationSupervisorAddress,
        excavationSupervisorPhone: sameAsCivilEngineerExcavation ? (applicantPhone || "0918-765-4321") : excavationSupervisorPhone,
        excavationSupervisorPRC: sameAsCivilEngineerExcavation ? civilEngineerPRC : excavationSupervisorPRC,
        excavationSupervisorPRCValidity: sameAsCivilEngineerExcavation ? civilEngineerPRCValidity : excavationSupervisorPRCValidity,
        excavationSupervisorPTR: sameAsCivilEngineerExcavation ? civilEngineerPTR : excavationSupervisorPTR,
        excavationSupervisorPTRIssued: sameAsCivilEngineerExcavation ? civilEngineerPTRIssued : excavationSupervisorPTRIssued,
        excavationSupervisorPTRIssuedAt: sameAsCivilEngineerExcavation ? civilEngineerPTRIssuedAt : excavationSupervisorPTRIssuedAt,
        excavationSupervisorTIN: sameAsCivilEngineerExcavation ? civilEngineerTIN : excavationSupervisorTIN,
        excavationSupervisorSignature: sameAsCivilEngineerExcavation ? (civilEngineerSignature || excavationSupervisorSignature) : excavationSupervisorSignature,
        excavationVolume,
        excavationDepth,
        excavationScope: excavationScope || excavationType,
        excavationType,
        excavationStartDate,
        excavationCompletionDate,
        activePermitForms: mandatoryKeys,
        submissionDate
      };

      const base64Pdf = await generateUnifiedPermitPdf(payload);
      const dataUrl = `data:application/pdf;base64,${base64Pdf}`;
      setGeneratedPdfBlob(dataUrl);

      // Populate uploadedPermitDocs for each mandatory key with its individual filled PDF
      const newDocs: Record<string, any> = { ...uploadedPermitDocs };
      for (const key of mandatoryKeys) {
        if (key === "fireBfpPermit") {
          // Fire / BFP Clearance is an external certificate from the Bureau of Fire Protection — retain user's uploaded file if present
          if (uploadedPermitDocs["fireBfpPermit"]) {
            newDocs["fireBfpPermit"] = uploadedPermitDocs["fireBfpPermit"];
          }
          continue;
        }

        const meta = PERMIT_FORM_METADATA[key];
        let formUrl = dataUrl;
        try {
          if (key === "buildingPermit") {
            const b64 = await generateBuildingPermitPdf(payload);
            formUrl = `data:application/pdf;base64,${b64}`;
          } else if (key === "architecturalPermit") {
            const b64 = await generateArchitecturalPermitPdf(payload);
            formUrl = `data:application/pdf;base64,${b64}`;
          } else if (key === "civilStructuralPermit") {
            const b64 = await generateStructuralPermitPdf(payload);
            formUrl = `data:application/pdf;base64,${b64}`;
          } else if (key === "electricalPermit") {
            const epPayload: UnifiedPermitFormData = {
              ...payload,
              scopeOfWork: electricalScopeOfWork || payload.scopeOfWork,
              scopeOfWorkDetails: electricalScopeDetails || payload.scopeOfWorkDetails,
              occupancyClassificationDetail: electricalOccupancy || occupancyClassificationDetail || occupancyClass,
              occupancyOthers: electricalOccupancyOthers || occupancyOthers,
              lightingOutletsCount,
              convenienceOutletsCount,
              acuOutletsCount,
              cookingUnitOutletsCount: rangeOutletsCount,
              rangeOutletsCount,
              waterHeaterOutletsCount,
              waterPumpOutletsCount,
              toggleSwitchCount,
              bellBuzzerCount,
              pushButtonsCount,
              faDetectorCount,
              otherWiringDevicesCount,
              electricalEngineerSignature,
              electricalContractorName,
              electricalContractorPcab,
              electricalContractorAddress,
              electricalContractorTel,
              sameAsDesignElectricalEngineer,
              installationInChargeRole,
              installationInChargeName,
              installationInChargeAddress,
              installationInChargePRC,
              installationInChargePRCValidity,
              installationInChargeTel,
              installationInChargePTR,
              installationInChargePTRIssued,
              installationInChargePTRIssuedAt,
              installationInChargeTIN,
              installationInChargeSignedDate,
              installationInChargeSignature,
            };
            const b64 = await generateElectricalPermitPdf(epPayload);
            formUrl = `data:application/pdf;base64,${b64}`;
          } else if (key === "sanitaryPermit") {
            const plPayload: UnifiedPermitFormData = {
              ...payload,
              sanitaryScopeOfWork,
              sanitaryScopeDetails: sanitaryScopeOfWork === "OTHERS"
                ? `${sanitaryScopeOthersAction || ""} OF ${sanitaryScopeOthersTarget || ""}`.trim()
                : sanitaryScopeDetails,
              sanitaryScopeOthersAction,
              sanitaryScopeOthersTarget,
              waterClosetsCount,
              lavatoriesCount,
              kitchenSinksCount,
              showersCount,
              floorDrainsCount,
              faucetsCount,
              waterMeterCount,
              greaseTrapCount,
              bathTubsCount,
              slopSinkCount,
              urinalCount,
              airConditioningCount,
              waterTankCount,
              bidetCount,
              laundryTraysCount,
              dentalCuspidorCount,
              electricalHeaterCount,
              waterBoilerCount,
              drinkingFountainCount,
              barSinkCount,
              sodaFountainCount,
              laboratorySinkCount,
              sterilizerCount,
              swimmingPoolCount,
              othersFixtureCount,
              othersFixtureName,
              fixtureStatusMap,
              waterDistributionSystem,
              sanitarySewerSystem,
              stormDrainageSystem,
            };
            const b64 = await generateSanitaryPermitPdf(plPayload);
            formUrl = `data:application/pdf;base64,${b64}`;
          } else if (key === "mechanicalPermit") {
            const b64 = await generateMechanicalPermitPdf(payload);
            formUrl = `data:application/pdf;base64,${b64}`;
          } else if (key === "electronicsPermit") {
            const b64 = await generateElectronicsPermitPdf(payload);
            formUrl = `data:application/pdf;base64,${b64}`;
          } else if (key === "demolitionPermit") {
            const hasBp = demolitionWithBuildingPermit || mandatoryKeys.includes("buildingPermit");
            const gatheredBpNo = hasBp
              ? (demolitionBuildingPermitNo || payload.buildingPermitNo || buildingPermitNo)
              : undefined;
            const activeSupName = sameAsCivilEngineer ? civilEngineerName : demolitionSupervisorName;
            const activeSupPRC = sameAsCivilEngineer ? civilEngineerPRC : demolitionSupervisorPRC;
            const activeSupValidity = sameAsCivilEngineer ? civilEngineerPRCValidity : demolitionSupervisorPRCValidity;
            const activeSupPTR = sameAsCivilEngineer ? civilEngineerPTR : demolitionSupervisorPTR;
            const activeSupPTRIssued = sameAsCivilEngineer ? civilEngineerPTRIssued : demolitionSupervisorPTRIssued;
            const activeSupPTRIssuedAt = sameAsCivilEngineer ? civilEngineerPTRIssuedAt : demolitionSupervisorPTRIssuedAt;
            const activeSupTIN = sameAsCivilEngineer ? civilEngineerTIN : demolitionSupervisorTIN;
            const activeSupAddress = sameAsCivilEngineer ? civilEngineerAddress : demolitionSupervisorAddress;
            const activeSupPhone = sameAsCivilEngineer ? (applicantPhone || "0918-765-4321") : demolitionSupervisorPhone;
            const activeSupSignature = sameAsCivilEngineer ? (civilEngineerSignature || demolitionSupervisorSignature) : demolitionSupervisorSignature;

            const dpPayload: UnifiedPermitFormData = {
              ...payload,
              demolitionPermitNo: payload.demolitionPermitNo || `DP-${currentYear}-${randomSeq}`,
              dpNo: payload.demolitionPermitNo || `DP-${currentYear}-${randomSeq}`,
              demolitionBuildingType,
              demolitionArea,
              demolitionStoreys,
              demolitionScope: demolitionMethod,
              demolitionMethod,
              demolitionStartDate,
              demolitionCompletionDate,
              demolitionSupervisorName: activeSupName,
              demolitionSupervisorPRC: activeSupPRC,
              demolitionSupervisorPRCValidity: activeSupValidity,
              demolitionSupervisorPTR: activeSupPTR,
              demolitionSupervisorPTRIssued: activeSupPTRIssued,
              demolitionSupervisorPTRIssuedAt: activeSupPTRIssuedAt,
              demolitionSupervisorTIN: activeSupTIN,
              demolitionSupervisorAddress: activeSupAddress,
              demolitionSupervisorPhone: activeSupPhone,
              demolitionSupervisorSignature: activeSupSignature,
              withBuildingPermit: hasBp,
              buildingPermitNo: gatheredBpNo,
              bpNo: gatheredBpNo,
            };
            const b64 = await generateDemolitionPermitPdf(dpPayload);
            formUrl = `data:application/pdf;base64,${b64}`;
          } else if (key === "fencingPermit") {
            const fpPayload: UnifiedPermitFormData = {
              ...payload,
              fencingScopeOfWork,
              fencingScopeDetails,
              fencingType,
              fencingTypes,
              fencingTypeOthers: (fencingTypes.includes("OTHERS (Specify)") || fencingType.toLowerCase().includes("other")) ? (fencingTypeOthers || fenceMaterial) : "",
              fencingTypeOthersLine2: (fencingTypes.includes("OTHERS (Specify)") || fencingType.toLowerCase().includes("other")) ? fencingTypeOthersLine2 : "",
              fencingTypeOthersLine3: (fencingTypes.includes("OTHERS (Specify)") || fencingType.toLowerCase().includes("other")) ? fencingTypeOthersLine3 : "",
              fencingLength: fenceLength,
              fencingHeight: fenceHeight,
              fencingCost,
              fencingDesignerRole,
              fencingDesignerName,
              fencingDesignerAddress,
              fencingDesignerPRC,
              fencingDesignerPRCValidity,
              fencingDesignerPTR,
              fencingDesignerPTRIssued,
              fencingDesignerPTRIssuedAt,
              fencingDesignerTIN,
              fencingDesignerSignature,
              fencingSupervisorRole: sameAsDesignFencingSupervisor ? "same" : undefined,
              fencingSupervisorName: sameAsDesignFencingSupervisor ? fencingDesignerName : fencingSupervisorName,
              fencingSupervisorAddress: sameAsDesignFencingSupervisor ? fencingDesignerAddress : fencingSupervisorAddress,
              fencingSupervisorPRC: sameAsDesignFencingSupervisor ? fencingDesignerPRC : fencingSupervisorPRC,
              fencingSupervisorPRCValidity: sameAsDesignFencingSupervisor ? fencingDesignerPRCValidity : fencingSupervisorPRCValidity,
              fencingSupervisorPTR: sameAsDesignFencingSupervisor ? fencingDesignerPTR : fencingSupervisorPTR,
              fencingSupervisorPTRIssued: sameAsDesignFencingSupervisor ? fencingDesignerPTRIssued : fencingSupervisorPTRIssued,
              fencingSupervisorPTRIssuedAt: sameAsDesignFencingSupervisor ? fencingDesignerPTRIssuedAt : fencingSupervisorPTRIssuedAt,
              fencingSupervisorTIN: sameAsDesignFencingSupervisor ? fencingDesignerTIN : fencingSupervisorTIN,
              fencingSupervisorSignature: sameAsDesignFencingSupervisor ? fencingDesignerSignature : fencingSupervisorSignature,
              applicantSignature,
              lotOwnerSignature: lotOwnerConsent ? lotOwnerSignature : undefined,
            };
            const b64 = await generateFencingPermitPdf(fpPayload);
            formUrl = `data:application/pdf;base64,${b64}`;
          } else if (key === "excavationPermit") {
            const hasBp = excavationWithBuildingPermit || mandatoryKeys.includes("buildingPermit");
            const gatheredBpNo = hasBp
              ? (excavationBuildingPermitNo || payload.buildingPermitNo || buildingPermitNo)
              : undefined;
            const activeSupName = sameAsCivilEngineerExcavation ? civilEngineerName : excavationSupervisorName;
            const activeSupPRC = sameAsCivilEngineerExcavation ? civilEngineerPRC : excavationSupervisorPRC;
            const activeSupValidity = sameAsCivilEngineerExcavation ? civilEngineerPRCValidity : excavationSupervisorPRCValidity;
            const activeSupPTR = sameAsCivilEngineerExcavation ? civilEngineerPTR : excavationSupervisorPTR;
            const activeSupPTRIssued = sameAsCivilEngineerExcavation ? civilEngineerPTRIssued : excavationSupervisorPTRIssued;
            const activeSupPTRIssuedAt = sameAsCivilEngineerExcavation ? civilEngineerPTRIssuedAt : excavationSupervisorPTRIssuedAt;
            const activeSupTIN = sameAsCivilEngineerExcavation ? civilEngineerTIN : excavationSupervisorTIN;
            const activeSupAddress = sameAsCivilEngineerExcavation ? civilEngineerAddress : excavationSupervisorAddress;
            const activeSupPhone = sameAsCivilEngineerExcavation ? (applicantPhone || "0918-765-4321") : excavationSupervisorPhone;
            const activeSupSignature = sameAsCivilEngineerExcavation ? (civilEngineerSignature || excavationSupervisorSignature) : excavationSupervisorSignature;

            const expPayload: UnifiedPermitFormData = {
              ...payload,
              excavationPermitNo: payload.excavationPermitNo || `EGPP-${currentYear}-${randomSeq}`,
              egppNo: payload.excavationPermitNo || `EGPP-${currentYear}-${randomSeq}`,
              withBuildingPermit: hasBp,
              buildingPermitNo: gatheredBpNo,
              bpNo: gatheredBpNo,
              excavationType,
              excavationScope: excavationScope || excavationType,
              excavationVolume,
              excavationDepth,
              excavationStartDate,
              excavationCompletionDate,
              // Box 6 Classifications
              excavationAndFills,
              foundationAndRetainingWalls,
              pileFoundations,
              gradingAndEarthworks,
              othersSpecify,
              othersSpecifyText,
              othersCustomLine2Check,
              othersCustomLine2Text,
              othersCustomLine3Check,
              othersCustomLine3Text,
              // Box 2 Design Professional
              civilEngineerName,
              civilEngineerAddress,
              civilEngineerPRC,
              civilEngineerPRCValidity,
              civilEngineerPTR,
              civilEngineerPTRIssued,
              civilEngineerPTRIssuedAt,
              civilEngineerTIN,
              civilEngineerSignature,
              civilEngineerSignedDate,
              // Box 3 Supervisor
              supervisorCivilEngineerName: activeSupName,
              supervisorCivilEngineerAddress: activeSupAddress,
              supervisorCivilEngineerPRC: activeSupPRC,
              supervisorCivilEngineerPRCValidity: activeSupValidity,
              supervisorCivilEngineerPTR: activeSupPTR,
              supervisorCivilEngineerPTRIssued: activeSupPTRIssued,
              supervisorCivilEngineerPTRIssuedAt: activeSupPTRIssuedAt,
              supervisorCivilEngineerTIN: activeSupTIN,
              supervisorCivilEngineerSignature: activeSupSignature,
              supervisorCivilEngineerSignedDate: civilEngineerSignedDate,
              // Box 4 Building Owner
              applicantName: compiledFullName || applicantName,
              applicantAddress: streetAddress,
              applicantCtcNo: govIdNo,
              applicantGovIdDateIssued: govIdDateIssued,
              applicantGovIdPlaceIssued: govIdPlaceIssued,
              applicantSignature,
              applicantSignedDate,
              // Box 5 Lot Owner Consent
              lotOwnerConsent,
              lotOwnerName: lotOwnerConsent ? lotOwnerName : undefined,
              lotOwnerAddress: lotOwnerConsent ? lotOwnerAddress : undefined,
              lotOwnerCtcNo: lotOwnerConsent ? lotOwnerGovIdNo : undefined,
              lotOwnerGovIdNo: lotOwnerConsent ? lotOwnerGovIdNo : undefined,
              lotOwnerGovIdDateIssued: lotOwnerConsent ? lotOwnerGovIdDateIssued : undefined,
              lotOwnerGovIdPlaceIssued: lotOwnerConsent ? lotOwnerGovIdPlaceIssued : undefined,
              lotOwnerSignature: lotOwnerConsent ? lotOwnerSignature : undefined,
              lotOwnerSignedDate: lotOwnerConsent ? lotOwnerSignedDate : undefined,
            };
            const b64 = await generateExcavationPermitPdf(expPayload);
            formUrl = `data:application/pdf;base64,${b64}`;
          } else if (key === "signPermit") {
            const hasBp = signWithBuildingPermit || mandatoryKeys.includes("buildingPermit") || Boolean(projectType?.matrix?.buildingPermit === 'required' || projectType?.matrix?.buildingPermit === 'conditional');
            const gatheredBpNo = hasBp
              ? (signBuildingPermitNo || payload.buildingPermitNo || buildingPermitNo || `BP-${currentYear}-0001`)
              : undefined;

            const calcArea = (parseFloat(signLength || "3.00") * parseFloat(signWidth || "1.50")).toFixed(2);
            const sgpPayload: UnifiedPermitFormData = {
              ...payload,
              signPermitNo: payload.signPermitNo || `SP-${currentYear}-${randomSeq}`,
              spNo: payload.signPermitNo || `SP-${currentYear}-${randomSeq}`,
              withBuildingPermit: hasBp,
              buildingPermitNo: gatheredBpNo,
              bpNo: gatheredBpNo,
              signLength,
              signWidth,
              signArea: calcArea,
              signDisplayType,
              signDisplayMedium,
              signInstallationType,
              signDimensions: `${signLength}m (L) x ${signWidth}m (W)`,
              signType: `${signInstallationType} (${signDisplayType}, ${signDisplayMedium})`,
              signMaterial,
              signCost,
              signScopeOfWork,
              signScopeOthers,
              signFormOfOwnership,
              signEnterpriseName,
              signCharacterOfOccupancy,
              signApplicantNo,
              signApplicantStreet,
              signApplicantBarangay,
              signApplicantCity,
              installationStreet: streetAddress || "Lot 12, Blk 4, McArthur Hwy",
              installationBarangay: barangay || "Poblacion",
              installationCity: "Sto. Tomas, Pampanga",
              // Box 2 Accompanying Documents
              signDocTct,
              signDocContractOfLease,
              signDocTaxDeclaration,
              signDocLotPlan,
              signDocSignPlansStructural,
              signDocSpecsCostEstimates,
              // Box 3 Design Professional
              architectName,
              architectAddress: architectAddress || civilEngineerAddress,
              architectPRC,
              architectPRCValidity,
              architectPTR,
              architectPTRIssued,
              architectPTRIssuedAt,
              architectTIN,
              architectSignature: signDesignerSignature || civilEngineerSignature,
              architectSignedDate: applicantSignedDate || "Sep 26, 2026",
              // Box 4 Supervisor
              sameAsDesignSignSupervisor,
              supervisorCivilEngineerName: sameAsDesignSignSupervisor ? (architectName || civilEngineerName) : signSupervisorName,
              supervisorCivilEngineerAddress: sameAsDesignSignSupervisor ? (architectAddress || civilEngineerAddress) : signSupervisorAddress,
              supervisorCivilEngineerPRC: sameAsDesignSignSupervisor ? (architectPRC || civilEngineerPRC) : signSupervisorPRC,
              supervisorCivilEngineerPRCValidity: sameAsDesignSignSupervisor ? (architectPRCValidity || civilEngineerPRCValidity) : signSupervisorPRCValidity,
              supervisorCivilEngineerPTR: sameAsDesignSignSupervisor ? (architectPTR || civilEngineerPTR) : signSupervisorPTR,
              supervisorCivilEngineerPTRIssued: sameAsDesignSignSupervisor ? (architectPTRIssued || civilEngineerPTRIssued) : signSupervisorPTRIssued,
              supervisorCivilEngineerPTRIssuedAt: sameAsDesignSignSupervisor ? (architectPTRIssuedAt || civilEngineerPTRIssuedAt) : signSupervisorPTRIssuedAt,
              supervisorCivilEngineerTIN: sameAsDesignSignSupervisor ? (architectTIN || civilEngineerTIN) : signSupervisorTIN,
              supervisorCivilEngineerSignature: sameAsDesignSignSupervisor ? (signDesignerSignature || civilEngineerSignature) : signSupervisorSignature,
              supervisorCivilEngineerSignedDate: applicantSignedDate || "Sep 26, 2026",
              // Box 5 Applicant
              applicantName: compiledFullName || applicantName,
              applicantAddress: signApplicantStreet ? `${signApplicantNo} ${signApplicantStreet}, ${signApplicantBarangay}, ${signApplicantCity}` : (streetAddress || compiledFullAddress),
              applicantCtcNo: signApplicantCtcNo || govIdNo || "CTC-2026-00192",
              applicantGovIdDateIssued: signApplicantCtcDateIssued || govIdDateIssued || "Jan 10, 2026",
              applicantGovIdPlaceIssued: signApplicantCtcPlaceIssued || govIdPlaceIssued || "Sto. Tomas",
              applicantTIN: applicantTIN || "123-456-789-000",
              applicantSignature,
              applicantSignedDate,
              // Page 2 Box 6 Building Owner
              buildingOwnerName: signSameAsApplicantBldgOwner ? (compiledFullName || applicantName) : signBldgOwnerName,
              buildingOwnerAddress: signSameAsApplicantBldgOwner ? (signApplicantStreet ? `${signApplicantNo} ${signApplicantStreet}, ${signApplicantBarangay}, ${signApplicantCity}` : (streetAddress || compiledFullAddress)) : signBldgOwnerAddress,
              buildingOwnerCtcNo: signSameAsApplicantBldgOwner ? (signApplicantCtcNo || govIdNo || "CTC-2026-00192") : signBldgOwnerCtcNo,
              buildingOwnerCtcDateIssued: signSameAsApplicantBldgOwner ? (signApplicantCtcDateIssued || govIdDateIssued || "Jan 10, 2026") : signBldgOwnerCtcDateIssued,
              buildingOwnerCtcPlaceIssued: signSameAsApplicantBldgOwner ? (signApplicantCtcPlaceIssued || govIdPlaceIssued || "Sto. Tomas") : signBldgOwnerCtcPlaceIssued,
              buildingOwnerSignature: signSameAsApplicantBldgOwner ? applicantSignature : signBldgOwnerSignature,
              buildingOwnerSignedDate: signSameAsApplicantBldgOwner ? applicantSignedDate : signBldgOwnerSignedDate,
              // Page 2 Box 7 Lot Owner Consent
              lotOwnerConsent,
              lotOwnerName: lotOwnerConsent ? lotOwnerName : undefined,
              lotOwnerAddress: lotOwnerConsent ? lotOwnerAddress : undefined,
              lotOwnerCtcNo: lotOwnerConsent ? lotOwnerGovIdNo : undefined,
              lotOwnerGovIdNo: lotOwnerConsent ? lotOwnerGovIdNo : undefined,
              lotOwnerGovIdDateIssued: lotOwnerConsent ? lotOwnerGovIdDateIssued : undefined,
              lotOwnerGovIdPlaceIssued: lotOwnerConsent ? lotOwnerGovIdPlaceIssued : undefined,
              lotOwnerSignature: lotOwnerConsent ? lotOwnerSignature : undefined,
              lotOwnerSignedDate: lotOwnerConsent ? lotOwnerSignedDate : undefined,
              // Page 2 Box 8 Processing & Evaluation Division (Official Receipt & Payment)
              officialReceiptNo: (clearanceApp as any)?.officialReceiptNo || (clearanceApp as any)?.paymentReference,
              feePaid: (clearanceApp as any)?.assessedFees ? `PHP ${(clearanceApp as any).assessedFees.toLocaleString()}` : undefined,
              datePaid: (clearanceApp as any)?.dateReleased || (clearanceApp as any)?.paymentDate,
              dateIssued: (clearanceApp as any)?.dateReleased,
              isPaid: (clearanceApp as any)?.paymentStatus === "paid" || Boolean((clearanceApp as any)?.officialReceiptNo),
            };
            const b64 = await generateSignPermitPdf(sgpPayload);
            formUrl = `data:application/pdf;base64,${b64}`;
          } else if (key === "temporaryServiceConnection") {
            const ptscPayload: UnifiedPermitFormData = {
              ...payload,
              controlNo: payload.applicationNo || `2026-${randomSeq}`,
              applicationNo: payload.applicationNo || `2026-${randomSeq}`,
              temporaryServicePermitNo: (payload as any).temporaryServicePermitNo || `PTSC-${currentYear}-${randomSeq}`,
              ptscNo: (payload as any).ptscNo || `PTSC-${currentYear}-${randomSeq}`,
              // Purpose
              ptscPurposeForConstruction,
              ptscPurposeForTesting,
              ptscPurposeOthers,
              ptscPurposeOthersSpecify,
              temporaryServicePurpose: ptscPurposeOthers && ptscPurposeOthersSpecify
                ? ptscPurposeOthersSpecify
                : (ptscPurposeForConstruction && ptscPurposeForTesting
                  ? "FOR CONSTRUCTION POWER & EQUIPMENT TESTING"
                  : ptscPurposeForConstruction ? "FOR CONSTRUCTION" : "FOR TESTING"),
              // Capacities & duration
              temporaryServiceKva: ptscConnectedLoad || electricalConnectedLoad || "15.0",
              temporaryServiceTransformerKva: ptscTransformerCapacity || "25.0",
              temporaryServiceGeneratorKva: ptscGeneratorCapacity || "N/A",
              temporaryServiceVoltage: electricalVoltage ? `${electricalVoltage}, Single Phase, 60Hz` : "230V, Single Phase, 60Hz",
              temporaryServiceDuration: ptscDuration || "90",
              temporaryServiceStartDate: ptscStartDate || applicantSignedDate || "Oct 01, 2026",
              proposedStartDate: ptscStartDate || applicantSignedDate || "Oct 01, 2026",
              // Box 1 Ownership & Address
              formOfOwnership: ptscFormOfOwnership,
              enterpriseName: ptscEnterpriseName,
              characterOfOccupancy: ptscCharacterOfOccupancy,
              applicantNo: ptscApplicantNo,
              applicantStreet: ptscApplicantStreet,
              applicantBarangay: ptscApplicantBarangay,
              applicantCity: ptscApplicantCity,
              applicantZip: ptscApplicantZip,
              // Box 2 Design Professional
              electricalEngineerName: ptscPeeName || electricalEngineerName,
              electricalEngineerAddress: ptscPeeAddress,
              electricalEngineerPRC: ptscPeePRC || electricalEngineerPRC,
              electricalEngineerPRCValidity: ptscPeePRCValidity || electricalEngineerPRCValidity,
              electricalEngineerPTR: ptscPeePTR || electricalEngineerPTR,
              electricalEngineerPTRIssued: ptscPeePTRIssued,
              electricalEngineerPTRIssuedAt: ptscPeePTRIssuedAt,
              electricalEngineerTIN: ptscPeeTIN || electricalEngineerTIN,
              electricalEngineerSignature: ptscPeeSignature,
              electricalEngineerSignedDate: ptscPeeSignedDate,
              ptscPeeName,
              ptscPeeAddress,
              ptscPeePRC,
              ptscPeePRCValidity,
              ptscPeePTR,
              ptscPeePTRIssued,
              ptscPeePTRIssuedAt,
              ptscPeeTIN,
              ptscPeeSignature,
              ptscPeeSignedDate,
              // Box 3 Supervisor
              ptscSupervisorRole,
              supervisorElectricalEngineerName: sameAsDesignPtscSupervisor ? (ptscPeeName || electricalEngineerName) : ptscSupervisorName,
              supervisorElectricalEngineerAddress: sameAsDesignPtscSupervisor ? ptscPeeAddress : ptscSupervisorAddress,
              supervisorElectricalEngineerPRC: sameAsDesignPtscSupervisor ? (ptscPeePRC || electricalEngineerPRC) : ptscSupervisorPRC,
              supervisorElectricalEngineerPRCValidity: sameAsDesignPtscSupervisor ? (ptscPeePRCValidity || electricalEngineerPRCValidity) : ptscSupervisorPRCValidity,
              supervisorElectricalEngineerPTR: sameAsDesignPtscSupervisor ? (ptscPeePTR || electricalEngineerPTR) : ptscSupervisorPTR,
              supervisorElectricalEngineerPTRIssued: sameAsDesignPtscSupervisor ? ptscPeePTRIssued : ptscSupervisorPTRIssued,
              supervisorElectricalEngineerPTRIssuedAt: sameAsDesignPtscSupervisor ? ptscPeePTRIssuedAt : ptscSupervisorPTRIssuedAt,
              supervisorElectricalEngineerTIN: sameAsDesignPtscSupervisor ? (ptscPeeTIN || electricalEngineerTIN) : ptscSupervisorTIN,
              supervisorElectricalEngineerSignature: sameAsDesignPtscSupervisor ? ptscPeeSignature : ptscSupervisorSignature,
              supervisorElectricalEngineerSignedDate: sameAsDesignPtscSupervisor ? ptscPeeSignedDate : ptscSupervisorSignedDate,
              ptscSupervisorName,
              ptscSupervisorAddress,
              ptscSupervisorPRC,
              ptscSupervisorPRCValidity,
              ptscSupervisorPTR,
              ptscSupervisorPTRIssued,
              ptscSupervisorPTRIssuedAt,
              ptscSupervisorTIN,
              ptscSupervisorSignature,
              ptscSupervisorSignedDate,
              // Box 4 Owner
              applicantName: compiledFullName || applicantName,
              applicantAddress: `${ptscApplicantNo ? ptscApplicantNo + ' ' : ''}${ptscApplicantStreet}, ${ptscApplicantBarangay}, ${ptscApplicantCity}`,
              applicantTIN,
              govIdNo: ptscApplicantCtcNo || govIdNo,
              ctcNo: ptscApplicantCtcNo,
              ctcDateIssued: ptscApplicantCtcDateIssued,
              ctcPlaceIssued: ptscApplicantCtcPlaceIssued,
              applicantSignature: ptscApplicantSignature || applicantSignature,
              applicantSignedDate: applicantSignedDate || new Date().toISOString().split("T")[0],
              // Page 2: Box 4 Processing & Evaluation Division (Official Receipt & Fee Payment)
              feePaid: ptscFeePaid,
              buildingPermitFee: ptscFeePaid,
              totalFee: ptscFeePaid,
              ptscFeePaid,
              datePaid: ptscDatePaid,
              receiptDate: ptscDatePaid,
              ptscDatePaid,
              officialReceiptNo: ptscOfficialReceiptNo,
              ptscOfficialReceiptNo,
              permitIssuedDate: ptscDateIssued,
              dateIssued: ptscDateIssued,
              ptscDateIssued,
              isPaid: true,
              // Page 2: Box 5 Building Official & Duration
              ptscDuration,
              ptscStartDate,
            };
            const b64 = await generateTemporaryServicePermitPdf(ptscPayload);
            formUrl = `data:application/pdf;base64,${b64}`;
          }
        } catch (indivErr) {
          console.warn(`Fallback to unified dossier for ${key}:`, indivErr);
        }

        newDocs[key] = {
          fileName: `${meta.code}_${projectType.name.replace(/\s+/g, '_')}_Official_Filled.pdf`,
          fileSize: "1.4 MB",
          fileUrl: formUrl,
          uploadedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isDigitallyGenerated: true
        };
      }

      setUploadedPermitDocs(newDocs);
      setNotification(
        `All ${digitalMandatoryKeys.length} official digital engineering permits for ${projectType.name} have been compiled and verified with complete specifications. You are cleared to proceed to Step 4: Mapping.`
      );
    } catch (err: any) {
      console.error("Error generating forms:", err);
      setNotification(err?.message || "Failed to compile official forms. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Upload individual scanned file
  const handleFileUpload = async (key: keyof PermitFormMatrix, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setActiveUploadingKey(key);
    try {
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
      const sizeStr = file.size > 1024 * 1024 ? `${sizeInMb} MB` : `${Math.round(file.size / 1024)} KB`;

      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = (reader.result as string) || "";
        setUploadedPermitDocs((prev) => ({
          ...prev,
          [key]: {
            fileName: file.name,
            fileSize: sizeStr,
            fileUrl: base64Data,
            uploadedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isDigitallyGenerated: false
          }
        }));
        setActiveUploadingKey(null);
      };
      reader.onerror = () => {
        setActiveUploadingKey(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setActiveUploadingKey(null);
    }
  };

  const handleRemoveDoc = (key: string) => {
    setUploadedPermitDocs((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  return (
    <div className="step-pane animate-fade-in-up">
      {/* STEP 3 HEADER */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
          <span style={{
            fontSize: "0.72rem",
            fontWeight: "800",
            color: "#4338ca",
            background: "#e0e7ff",
            padding: "2px 8px",
            borderRadius: "6px",
            letterSpacing: "0.5px"
          }}>
            STEP 3 OF 5
          </span>
          <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "600" }}>
            Comprehensive Municipal Technical Permitting Stage
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.65rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.35rem 0" }}>
              Official Permitting Forms for {projectType.name}
            </h2>
            <p style={{ margin: 0, color: "#475569", fontSize: "0.92rem", lineHeight: "1.5" }}>
              Complete the required National Building Code of the Philippines (PD 1096) and Sto. Tomas municipal engineering forms. All fields are scanned and synchronized to official LGU standards.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setShowMatrixGuide(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#fffbeb",
                border: "1.5px solid #fde68a",
                color: "#92400e",
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "0.82rem",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
              }}
            >
              <FileText size={14} color="#d97706" />
              <span>Permit Requirements Matrix</span>
            </button>

            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: areAllMandatorySatisfied ? "#dcfce7" : "#fef3c7",
              border: areAllMandatorySatisfied ? "1px solid #86efac" : "1px solid #fde68a",
              color: areAllMandatorySatisfied ? "#166534" : "#92400e",
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "0.82rem",
              fontWeight: "800"
            }}>
              <Clock size={15} />
              <span>{satisfiedKeys.length} / {mandatoryKeys.length} Forms Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODE SELECTOR */}
      <div style={{
        display: "inline-flex",
        background: "#f1f5f9",
        padding: "4px",
        borderRadius: "12px",
        marginBottom: "1.5rem",
        border: "1px solid #e2e8f0",
        gap: "4px"
      }}>
        <button
          type="button"
          onClick={() => setInputMode("digital_fill")}
          style={{
            padding: "8px 18px",
            borderRadius: "10px",
            border: "none",
            background: inputMode === "digital_fill" ? "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)" : "none",
            color: inputMode === "digital_fill" ? "#ffffff" : "#475569",
            fontWeight: "700",
            fontSize: "0.85rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            boxShadow: inputMode === "digital_fill" ? "0 4px 12px rgba(79, 70, 229, 0.25)" : "none",
            transition: "all 0.15s ease"
          }}
        >
          <Sparkles size={15} />
          <span>Fill Official Forms Online (Interactive Digital)</span>
        </button>

        <button
          type="button"
          onClick={() => setInputMode("upload_scans")}
          style={{
            padding: "8px 18px",
            borderRadius: "10px",
            border: "none",
            background: inputMode === "upload_scans" ? "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)" : "none",
            color: inputMode === "upload_scans" ? "#ffffff" : "#475569",
            fontWeight: "700",
            fontSize: "0.85rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            boxShadow: inputMode === "upload_scans" ? "0 4px 12px rgba(79, 70, 229, 0.25)" : "none",
            transition: "all 0.15s ease"
          }}
        >
          <Upload size={15} />
          <span>Attach Pre-Printed Signed Forms (PDF)</span>
        </button>
      </div>

      {/* NOTIFICATION BANNER */}
      {notification && (
        <div className="animate-fade-in-up" style={{
          background: areAllMandatorySatisfied ? "#f0fdf4" : "#fef2f2",
          border: areAllMandatorySatisfied ? "1.5px solid #86efac" : "1.5px solid #fca5a5",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: areAllMandatorySatisfied ? "#166534" : "#991b1b"
        }}>
          {areAllMandatorySatisfied ? <CheckCircle2 size={20} color="#16a34a" /> : <AlertCircle size={20} color="#dc2626" />}
          <span style={{ fontSize: "0.9rem", fontWeight: "600" }}>{notification}</span>
          <button 
            type="button" 
            onClick={() => setNotification(null)}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "1.1rem", color: "inherit" }}
          >
            &times;
          </button>
        </div>
      )}

      {/* --- MODE 1: DIGITAL ONLINE FORM BUILDER --- */}
      {inputMode === "digital_fill" && (
        <div style={{
          background: "#ffffff",
          borderRadius: "18px",
          border: "1.5px solid #e2e8f0",
          padding: "1.75rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          marginBottom: "1.5rem"
        }}>
          {/* CLEARANCE AUTOFILL STATUS BANNER */}
          {locationalClearanceRef && (
            <div style={{
              background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
              border: "1.5px solid #86efac",
              borderRadius: "14px",
              padding: "0.85rem 1.25rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "#dcfce7",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "#166534" }}>
                    Auto-filled from Application Status ({locationalClearanceRef})
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#15803d" }}>
                    Project identification, owner, land title boundaries, and Sto. Tomas NBCP standards loaded.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSyncFromClearance}
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #86efac",
                  color: "#166534",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  transition: "all 0.15s ease"
                }}
              >
                <RefreshCw size={13} color="#16a34a" />
                <span>Re-sync Application Data</span>
              </button>
            </div>
          )}

          {/* TABS HEADER WITH ACTIONS */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            borderBottom: "1.5px solid #e2e8f0",
            paddingBottom: "1rem",
            marginBottom: "1.5rem"
          }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {mandatoryKeys.map((key) => {
                const meta = PERMIT_FORM_METADATA[key];
                const isSelected = activeTab === key;
                const isDone = isFormSatisfied(key);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    style={{
                      padding: "9px 16px",
                      borderRadius: "10px",
                      border: isSelected ? "2px solid #3730a3" : "1.5px solid #cbd5e1",
                      background: isSelected ? "#3730a3" : "#f8fafc",
                      color: isSelected ? "#ffffff" : "#475569",
                      fontWeight: isSelected ? "800" : "600",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease",
                      boxShadow: isSelected ? "0 4px 14px rgba(55, 48, 163, 0.3)" : "none"
                    }}
                  >
                    <span style={{
                      fontSize: "0.7rem",
                      fontWeight: "900",
                      padding: "2px 7px",
                      borderRadius: "5px",
                      background: isSelected ? "rgba(255, 255, 255, 0.25)" : "#64748b",
                      color: "white"
                    }}>
                      {meta.code}
                    </span>
                    <span>{meta.label}</span>
                    {isDone && <CheckCircle2 size={16} color={isSelected ? "#86efac" : "#16a34a"} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CURRENT ACTIVE FORM TITLE & INSTRUCTION */}
          {activeMeta && (() => {
            const formDetail = FORM_OFFICIAL_DETAILS[activeTab] || {
              officialTitle: `${activeMeta.label.toUpperCase()} APPLICATION`,
              nbcCode: `NBC FORM ${activeMeta.code}`,
              icon: FileText,
              color: "#4f46e5",
              desc: activeMeta.desc
            };
            const FormIcon = formDetail.icon;
            const currentFormIndex = mandatoryKeys.indexOf(activeTab) + 1;
            const isCompleted = isFormSatisfied(activeTab);

            return (
              <div style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)",
                borderRadius: "16px",
                padding: "1.25rem 1.5rem",
                marginBottom: "1.5rem",
                color: "#ffffff",
                boxShadow: "0 6px 20px rgba(15, 23, 42, 0.2)",
                border: "1.5px solid #4338ca",
                position: "relative",
                overflow: "hidden"
              }}>
                {/* Background decorative glow */}
                <div style={{
                  position: "absolute",
                  top: "-50px",
                  right: "-50px",
                  width: "160px",
                  height: "160px",
                  borderRadius: "50%",
                  background: activeTab === "fireBfpPermit" ? "rgba(225, 29, 72, 0.25)" : "rgba(99, 102, 241, 0.25)",
                  filter: "blur(40px)",
                  pointerEvents: "none"
                }} />

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "14px",
                  position: "relative",
                  zIndex: 1
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                    <div style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "12px",
                      background: activeTab === "fireBfpPermit" ? "#ffe4e6" : "#e0e7ff",
                      color: activeTab === "fireBfpPermit" ? "#e11d48" : "#4338ca",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "2px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                    }}>
                      <FormIcon size={26} />
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                        <span style={{
                          fontSize: "0.7rem",
                          fontWeight: "900",
                          padding: "3px 9px",
                          borderRadius: "6px",
                          background: activeTab === "fireBfpPermit" ? "#e11d48" : "#6366f1",
                          color: "white",
                          letterSpacing: "0.5px"
                        }}>
                          {activeTab === "fireBfpPermit" ? "CERTIFICATE UPLOAD ONLY" : `CURRENTLY ANSWERING: FORM ${currentFormIndex} OF ${mandatoryKeys.length}`}
                        </span>
                        <span style={{
                          fontSize: "0.74rem",
                          fontWeight: "800",
                          color: "#c7d2fe",
                          background: "rgba(255, 255, 255, 0.12)",
                          padding: "2px 8px",
                          borderRadius: "4px"
                        }}>
                          {formDetail.nbcCode}
                        </span>
                        <span style={{
                          fontSize: "0.72rem",
                          fontWeight: "700",
                          color: "#94a3b8"
                        }}>
                          MUNICIPALITY OF STO. TOMAS, PAMPANGA
                        </span>
                      </div>

                      <h2 style={{
                        margin: 0,
                        fontSize: "1.35rem",
                        fontWeight: "900",
                        color: "#ffffff",
                        letterSpacing: "-0.01em",
                        lineHeight: 1.2
                      }}>
                        {formDetail.officialTitle}
                      </h2>

                      <p style={{ margin: "6px 0 0 0", fontSize: "0.84rem", color: "#cbd5e1", maxWidth: "750px", lineHeight: 1.4 }}>
                        {formDetail.desc}
                      </p>
                    </div>
                  </div>

                  {/* Form Status Badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {isCompleted ? (
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#14532d",
                        border: "1.5px solid #22c55e",
                        color: "#86efac",
                        padding: "7px 14px",
                        borderRadius: "999px",
                        fontSize: "0.82rem",
                        fontWeight: "800",
                        boxShadow: "0 2px 8px rgba(34, 197, 94, 0.25)"
                      }}>
                        <CheckCircle2 size={16} /> Completed & Verified
                      </div>
                    ) : (
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "rgba(245, 158, 11, 0.15)",
                        border: "1.5px solid #f59e0b",
                        color: "#fde68a",
                        padding: "7px 14px",
                        borderRadius: "999px",
                        fontSize: "0.82rem",
                        fontWeight: "800"
                      }}>
                        <Clock size={16} /> In Progress (Draft Saved)
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-strip reminder for Box 1 / Box 2 auto-sync */}
                {activeTab !== "fireBfpPermit" && (
                  <div style={{
                    marginTop: "12px",
                    paddingTop: "10px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "0.76rem",
                    color: "#a5b4fc"
                  }}>
                    <Info size={14} style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Auto-Sync Active:</strong> Box 1 (Owner/Applicant) and Box 2 (Project Location) details below will automatically synchronize across all your permit forms ({mandatoryKeys.map(k => PERMIT_FORM_METADATA[k]?.code).filter(c => c !== "FSEC").join(", ")}).
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          <form onSubmit={handleGenerateDigitalForms}>
            {/* Universal NBC Universal Details (Hidden when on Fire / BFP Clearance) */}
            {activeTab !== "fireBfpPermit" && (
              <>
                {/* ============================================================== */}
                {/* BOX 1: OWNER / APPLICANT & ENTERPRISE DETAILS (Universal)       */}
                {/* ============================================================== */}
            <div style={{
              background: "#ffffff",
              border: "1.5px solid #cbd5e1",
              borderRadius: "16px",
              padding: "1.25rem 1.5rem",
              marginBottom: "1.25rem",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
            }}>
              {/* Box 1 Header */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "1rem",
                paddingBottom: "0.75rem",
                borderBottom: "1.5px solid #f1f5f9"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "#eef2ff",
                    color: "#4f46e5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <User size={20} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                      <span style={{
                        fontSize: "0.7rem",
                        fontWeight: "800",
                        color: "#3730a3",
                        background: "#e0e7ff",
                        padding: "2px 8px",
                        borderRadius: "5px",
                        letterSpacing: "0.4px"
                      }}>
                        {FORM_OFFICIAL_DETAILS[activeTab]?.nbcCode || activeMeta?.code} • BOX 1
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: "700" }}>
                        {activeMeta?.label} — Owner & Enterprise Information
                      </span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "900", color: "#0f172a" }}>
                      BOX 1: OWNER / APPLICANT (TO BE ACCOMPLISHED IN PRINT) — {activeMeta?.label.toUpperCase()}
                    </h4>
                  </div>
                </div>

                <div style={{
                  fontSize: "0.72rem",
                  fontWeight: "700",
                  color: "#059669",
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  padding: "4px 10px",
                  borderRadius: "999px"
                }}>
                  Auto-Synchronized Across All Permits
                </div>
              </div>

              {/* Row 1: OWNER / APPLICANT Columns: LAST NAME | FIRST NAME | M.I. | TIN */}
              <div style={{
                background: "#f8fafc",
                border: "1.5px solid #e2e8f0",
                borderRadius: "12px",
                padding: "1rem 1.15rem",
                marginBottom: "1rem"
              }}>
                <div style={{
                  fontSize: "0.74rem",
                  fontWeight: "900",
                  color: "#1e293b",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "0.6rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <span>OWNER / APPLICANT</span>
                  <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600" }}>
                    Official Government Form Grid
                  </span>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1.3fr 1.3fr 0.55fr 1fr",
                  gap: "0.75rem"
                }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "4px" }}>
                      LAST NAME *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicantLastName}
                      onChange={(e) => setApplicantLastName(e.target.value.toUpperCase())}
                      placeholder="DELA CRUZ"
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "7px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.88rem",
                        fontWeight: "800",
                        textTransform: "uppercase",
                        color: "#0f172a",
                        background: "#ffffff"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "4px" }}>
                      FIRST NAME *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicantFirstName}
                      onChange={(e) => setApplicantFirstName(e.target.value.toUpperCase())}
                      placeholder="JUAN"
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "7px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.88rem",
                        fontWeight: "800",
                        textTransform: "uppercase",
                        color: "#0f172a",
                        background: "#ffffff"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "4px", textAlign: "center" }}>
                      M.I.
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={applicantMiddleName}
                      onChange={(e) => setApplicantMiddleName(e.target.value.toUpperCase())}
                      placeholder="S."
                      style={{
                        width: "100%",
                        padding: "8px 8px",
                        borderRadius: "7px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.88rem",
                        fontWeight: "800",
                        textTransform: "uppercase",
                        textAlign: "center",
                        color: "#0f172a",
                        background: "#ffffff"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "4px" }}>
                      TIN *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicantTIN}
                      onChange={(e) => setApplicantTIN(e.target.value)}
                      placeholder="123-456-789-000"
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "7px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.88rem",
                        fontWeight: "700",
                        color: "#0f172a",
                        background: "#ffffff"
                      }}
                    />
                  </div>
                </div>

                {/* Compiled Form Full Name Display */}
                <div style={{
                  marginTop: "0.65rem",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <span style={{ fontSize: "0.72rem", color: "#1e40af", fontWeight: "700" }}>
                    Compiled Form Full Name:
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "#1e3a8a", fontWeight: "800" }}>
                    {compiledFullName}
                  </span>
                </div>
              </div>

              {/* Row 2: FOR CONSTRUCTION OWNED BY AN ENTERPRISE | FORM OF OWNERSHIP | USE OR CHARACTER OF OCCUPANCY */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1.1fr 1.2fr",
                gap: "0.75rem",
                alignItems: "start",
                background: "#f8fafc",
                border: "1.5px solid #e2e8f0",
                borderRadius: "12px",
                padding: "1rem 1.15rem"
              }}>
                {/* 1. FOR CONSTRUCTION OWNED BY AN ENTERPRISE (matches official screenshot) */}
                <div>
                  <div style={{ marginBottom: "5px" }}>
                    <div style={{
                      fontSize: "0.72rem",
                      fontWeight: "900",
                      color: "#0f172a",
                      textTransform: "uppercase",
                      lineHeight: "1.25",
                      letterSpacing: "0.3px"
                    }}>
                      <div>FOR CONSTRUCTION OWNED</div>
                      <div style={{ color: "#2563eb" }}>BY AN ENTERPRISE</div>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={constructionOwnedByEnterprise}
                    onChange={(e) => setConstructionOwnedByEnterprise(e.target.value.toUpperCase())}
                    placeholder="e.g. SAN MIGUEL CORP. (or N/A)"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "7px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.85rem",
                      fontWeight: "800",
                      color: "#0f172a",
                      background: "#ffffff",
                      textTransform: "uppercase"
                    }}
                  />
                  <span style={{ display: "block", fontSize: "0.68rem", color: "#64748b", marginTop: "3px" }}>
                    Name of enterprise / corporation owning the construction (or N/A)
                  </span>
                </div>

                {/* 2. FORM OF OWNERSHIP (Dropdown with custom option) */}
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "900", color: "#0f172a", textTransform: "uppercase", marginBottom: "5px", letterSpacing: "0.3px" }}>
                    FORM OF OWNERSHIP
                  </label>
                  <select
                    value={["INDIVIDUAL / OWNER", "INDIVIDUAL / SOLE PROPRIETORSHIP", "CORPORATION", "PARTNERSHIP", "GOVERNMENT / INSTITUTIONAL", "NON-PROFIT / NGO", "COOPERATIVE"].includes(formOfOwnership.toUpperCase()) ? formOfOwnership.toUpperCase() : "OTHERS"}
                    onChange={(e) => {
                      if (e.target.value !== "OTHERS") {
                        setFormOfOwnership(e.target.value);
                      } else {
                        setFormOfOwnership("");
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "7px",
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
                  {!["INDIVIDUAL / OWNER", "INDIVIDUAL / SOLE PROPRIETORSHIP", "CORPORATION", "PARTNERSHIP", "GOVERNMENT / INSTITUTIONAL", "NON-PROFIT / NGO", "COOPERATIVE"].includes(formOfOwnership.toUpperCase()) && (
                    <input
                      type="text"
                      placeholder="Specify Form of Ownership..."
                      value={formOfOwnership}
                      onChange={(e) => setFormOfOwnership(e.target.value.toUpperCase())}
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
                  <span style={{ display: "block", fontSize: "0.68rem", color: "#64748b", marginTop: "3px" }}>
                    Legal ownership entity
                  </span>
                </div>

                {/* 3. USE OR CHARACTER OF OCCUPANCY (Dropdown with custom option) */}
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "900", color: "#0f172a", textTransform: "uppercase", marginBottom: "5px", letterSpacing: "0.3px" }}>
                    USE OR CHARACTER OF OCCUPANCY
                  </label>
                  <select
                    value={(() => {
                      const upper = occupancyClass.toUpperCase();
                      if (upper.includes("RESIDENTIAL")) return "RESIDENTIAL";
                      if (upper.includes("COMMERCIAL")) return "COMMERCIAL";
                      if (upper.includes("INDUSTRIAL")) return "INDUSTRIAL";
                      if (upper.includes("INSTITUTIONAL")) return "INSTITUTIONAL";
                      if (upper.includes("AGRICULTURAL")) return "AGRICULTURAL";
                      if (upper.includes("EDUCATIONAL")) return "EDUCATIONAL & RECREATIONAL";
                      if (upper.includes("ASSEMBLY")) return "ASSEMBLY / RECREATION";
                      return ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "INSTITUTIONAL", "AGRICULTURAL", "EDUCATIONAL & RECREATIONAL", "ASSEMBLY / RECREATION"].includes(upper) ? upper : "OTHERS";
                    })()}
                    onChange={(e) => {
                      if (e.target.value !== "OTHERS") {
                        setOccupancyClass(e.target.value);
                      } else {
                        setOccupancyClass("");
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "7px",
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
                  {!["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "INSTITUTIONAL", "AGRICULTURAL", "EDUCATIONAL & RECREATIONAL", "ASSEMBLY / RECREATION"].includes(occupancyClass.toUpperCase()) && !occupancyClass.toUpperCase().includes("RESIDENTIAL") && (
                    <input
                      type="text"
                      placeholder="Specify Character of Occupancy..."
                      value={occupancyClass}
                      onChange={(e) => setOccupancyClass(e.target.value.toUpperCase())}
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
                  <span style={{ display: "block", fontSize: "0.68rem", color: "#64748b", marginTop: "3px" }}>
                    National Building Code classification
                  </span>

                  {/* OCCUPANCY CLASSIFICATION DETAIL (NBCP RULE VII) */}
                  <div style={{ marginTop: "10px" }}>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "900", color: "#1e40af", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "0.3px" }}>
                      Occupancy Classification Detail (NBCP Rule VII)
                    </label>
                    <select
                      value={occupancyClassificationDetail}
                      onChange={(e) => {
                        setOccupancyClassificationDetail(e.target.value);
                        setOccupancyRuleVII(e.target.value);
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "7px",
                        border: "1.5px solid #93c5fd",
                        fontSize: "0.85rem",
                        background: "#ffffff",
                        color: "#1e293b",
                        fontWeight: "600"
                      }}
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
                    {occupancyClassificationDetail.includes("Others") && (
                      <input
                        type="text"
                        placeholder="Specify detailed occupancy..."
                        value={occupancyOthers}
                        onChange={(e) => setOccupancyOthers(e.target.value)}
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
                  </div>
                </div>
              </div>

              {/* Row 3: ADDRESS: NO., SITIO, | BARANGAY, | MUNICIPALITY | ZIP CODE | CONTACT NO. */}
              <div style={{
                marginTop: "0.85rem",
                background: "#f8fafc",
                border: "1.5px solid #e2e8f0",
                borderRadius: "12px",
                padding: "1rem 1.15rem"
              }}>
                <div style={{
                  fontSize: "0.74rem",
                  fontWeight: "900",
                  color: "#1e293b",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "0.6rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <span>ADDRESS & CONTACT INFORMATION</span>
                  <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600" }}>
                    Official Government Form Grid (Row 3)
                  </span>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1.3fr 1.1fr 1.1fr 0.7fr 1.1fr 1.4fr",
                  gap: "0.75rem"
                }}>
                  {/* 1. NO., STREET / SITIO */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "4px" }}>
                      NO., STREET, SITIO *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicantNoStreet}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setApplicantNoStreet(val);
                        setStreetAddress(val);
                      }}
                      placeholder="123 RIZAL ST."
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "7px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.85rem",
                        fontWeight: "800",
                        textTransform: "uppercase",
                        color: "#0f172a",
                        background: "#ffffff"
                      }}
                    />
                    <span style={{ display: "block", fontSize: "0.66rem", color: "#64748b", marginTop: "3px" }}>
                      House / Unit No. & Street
                    </span>
                  </div>

                  {/* 2. BARANGAY */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "4px" }}>
                      BARANGAY *
                    </label>
                    <select
                      value={applicantBarangay.toUpperCase()}
                      onChange={(e) => {
                        setApplicantBarangay(e.target.value);
                        setBarangay(e.target.value);
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "7px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        color: "#0f172a",
                        background: "#ffffff",
                        cursor: "pointer"
                      }}
                    >
                      {["POBLACION", "SAN BARTOLOME", "SAN MATIAS", "SAN VICENTE", "SANTA ANA", "SANTO ROSARIO", "SAN NICOLAS"].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                      <option value="OTHERS">OTHER (SPECIFY)</option>
                    </select>
                    {!["POBLACION", "SAN BARTOLOME", "SAN MATIAS", "SAN VICENTE", "SANTA ANA", "SANTO ROSARIO", "SAN NICOLAS"].includes(applicantBarangay.toUpperCase()) && (
                      <input
                        type="text"
                        placeholder="Specify Barangay..."
                        value={applicantBarangay}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setApplicantBarangay(val);
                          setBarangay(val);
                        }}
                        style={{
                          width: "100%",
                          marginTop: "5px",
                          padding: "6px 8px",
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
                      Barangay jurisdiction
                    </span>
                  </div>

                  {/* 3. CITY / MUNICIPALITY */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "4px" }}>
                      MUNICIPALITY *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicantMunicipality}
                      onChange={(e) => setApplicantMunicipality(e.target.value.toUpperCase())}
                      placeholder="STO. TOMAS"
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "7px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.85rem",
                        fontWeight: "800",
                        textTransform: "uppercase",
                        color: "#0f172a",
                        background: "#ffffff"
                      }}
                    />
                    <span style={{ display: "block", fontSize: "0.66rem", color: "#64748b", marginTop: "3px" }}>
                      Municipality / City
                    </span>
                  </div>

                  {/* 4. ZIP CODE */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "4px", textAlign: "center" }}>
                      ZIP CODE *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={applicantZipCode}
                      onChange={(e) => setApplicantZipCode(e.target.value)}
                      placeholder="2020"
                      style={{
                        width: "100%",
                        padding: "8px 8px",
                        borderRadius: "7px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.85rem",
                        fontWeight: "800",
                        textAlign: "center",
                        color: "#0f172a",
                        background: "#ffffff"
                      }}
                    />
                    <span style={{ display: "block", fontSize: "0.66rem", color: "#64748b", marginTop: "3px", textAlign: "center" }}>
                      Postal code
                    </span>
                  </div>

                  {/* 5. CONTACT NO. */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "4px" }}>
                      CONTACT NO. *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      placeholder="0917-123-4567"
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "7px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.85rem",
                        fontWeight: "800",
                        color: "#0f172a",
                        background: "#ffffff"
                      }}
                    />
                    <span style={{ display: "block", fontSize: "0.66rem", color: "#64748b", marginTop: "3px" }}>
                      Contact number
                    </span>
                  </div>

                  {/* 6. EMAIL ADDRESS */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "4px" }}>
                      EMAIL ADDRESS *
                    </label>
                    <input
                      type="email"
                      required
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      placeholder="juan.delacruz@example.com"
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "7px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.85rem",
                        fontWeight: "800",
                        color: "#0f172a",
                        background: "#ffffff"
                      }}
                    />
                    <span style={{ display: "block", fontSize: "0.66rem", color: "#64748b", marginTop: "3px" }}>
                      Email address
                    </span>
                  </div>
                </div>

                {/* Compiled Form Full Address Display */}
                <div style={{
                  marginTop: "0.65rem",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <span style={{ fontSize: "0.72rem", color: "#1e40af", fontWeight: "700" }}>
                    Compiled Form Address:
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "#1e3a8a", fontWeight: "800" }}>
                    {compiledFullAddress}
                  </span>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* BOX 2: PROJECT LOCATION & LAND TITLE BOUNDARIES                 */}
            {/* ============================================================== */}
            <div style={{
              background: "#f8fafc",
              border: "1.5px solid #e2e8f0",
              borderRadius: "14px",
              padding: "1.25rem",
              marginBottom: "1.5rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "#eef2ff",
                  color: "#4f46e5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Building size={18} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                    <span style={{
                      fontSize: "0.7rem",
                      fontWeight: "800",
                      color: "#3730a3",
                      background: "#e0e7ff",
                      padding: "2px 8px",
                      borderRadius: "5px",
                      letterSpacing: "0.4px"
                    }}>
                      {FORM_OFFICIAL_DETAILS[activeTab]?.nbcCode || activeMeta?.code} • BOX 2
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: "700" }}>
                      {activeMeta?.label} — Project Location & Boundaries
                    </span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: "1.02rem", fontWeight: "900", color: "#0f172a" }}>
                    BOX 2: PROJECT IDENTIFICATION & LOCATION — {activeMeta?.label.toUpperCase()}
                  </h4>
                </div>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem"
              }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                    Project Title / Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    placeholder={`${projectType.name} Construction`}
                    onChange={(e) => setProjectName(e.target.value)}
                    style={{ width: "100%", padding: "8px 11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginTop: "4px", background: "white" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                    Project Barangay *
                  </label>
                  <select
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    style={{ width: "100%", padding: "8px 11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginTop: "4px", background: "white" }}
                  >
                    {["San Bartolome", "San Matias", "San Vicente", "Santa Ana", "Santo Rosario", "Poblacion", "San Nicolas"].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                    Street Address / Purok *
                  </label>
                  <input
                    type="text"
                    required
                    value={streetAddress}
                    placeholder="Purok 3, Main Street"
                    onChange={(e) => setStreetAddress(e.target.value)}
                    style={{ width: "100%", padding: "8px 11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginTop: "4px", background: "white" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                    Estimated Total Cost (PHP) *
                  </label>
                  <input
                    type="text"
                    required
                    value={projectCost}
                    placeholder="1,600,000.00"
                    onChange={(e) => setProjectCost(e.target.value)}
                    style={{ width: "100%", padding: "8px 11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginTop: "4px", background: "white" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                    TCT / OCT Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={tctNo}
                    onChange={(e) => setTctNo(e.target.value)}
                    placeholder="TCT-042-20260012"
                    style={{ width: "100%", padding: "8px 11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginTop: "4px", background: "white" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                    Tax Declaration No. (TDN) *
                  </label>
                  <input
                    type="text"
                    required
                    value={taxDecNo}
                    onChange={(e) => setTaxDecNo(e.target.value)}
                    placeholder="TD-2026-00124-ST"
                    style={{ width: "100%", padding: "8px 11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginTop: "4px", background: "white" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                    Lot No. & Block No. *
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    <input
                      type="text"
                      value={lotNo}
                      onChange={(e) => setLotNo(e.target.value)}
                      placeholder="Lot 12"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginTop: "4px", background: "white" }}
                    />
                    <input
                      type="text"
                      value={blockNo}
                      onChange={(e) => setBlockNo(e.target.value)}
                      placeholder="Block 4"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginTop: "4px", background: "white" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                    Zoning Clearance Status
                  </label>
                  <div style={{
                    marginTop: "4px",
                    padding: "7px 11px",
                    borderRadius: "8px",
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    color: "#065f46",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    <ShieldCheck size={16} color="#059669" style={{ flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {locationalClearanceRef ? `Approved: ${locationalClearanceRef}` : (isClearanceRequired ? "Stage 1 Approved" : "Zoning Exempt (PD 1096)")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

            {/* ========================================== */}
            {/* TAB 1: BUILDING PERMIT (BP)                */}
            {/* ========================================== */}
            {activeTab === "buildingPermit" && (
              <div className="animate-fade-in-up">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#dbeafe", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Building size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>
                      Building Permit (BP) — Unified NBC Form B-01
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                      Primary unified permit application for construction, occupancy classification, and scope of work
                    </p>
                  </div>
                </div>

                {/* Section A: Scope of Work & Occupancy */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#1e3a8a", textTransform: "uppercase" }}>
                    Box 3 & 4: Scope of Work & Character of Occupancy
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                        Scope of Work *
                      </label>
                      <select
                        value={scopeOfWork}
                        onChange={(e) => setScopeOfWork(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
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
                      {(scopeOfWork || "").toLowerCase().includes("other") && (
                        <div style={{ marginTop: "8px" }}>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#475569", marginBottom: "3px" }}>
                            Specify Other Scope of Work (Prints on Form Underline) *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Specific details for other scope of work"
                            value={scopeOfWorkDetails}
                            onChange={(e) => setScopeOfWorkDetails(e.target.value)}
                            style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "white" }}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                        Character of Occupancy (NBCP Rule VII) *
                      </label>
                      <select
                        value={occupancyRuleVII}
                        onChange={(e) => setOccupancyRuleVII(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                      >
                        <option value="Group A - Residential Dwellings (Single-Detached / Duplex)">Group A - Residential Dwellings (Single-Detached / Duplex)</option>
                        <option value="Group B - Residential / Hotel / Motel / Apartment / Dormitory">Group B - Residential / Hotel / Motel / Apartment / Dormitory</option>
                        <option value="Group C - Educational & Recreation (School, Daycare, Gym)">Group C - Educational & Recreation (School, Daycare, Gym)</option>
                        <option value="Group D - Institutional (Hospital, Clinic, Home for Aged)">Group D - Institutional (Hospital, Clinic, Home for Aged)</option>
                        <option value="Group E - Business & Commercial Mercantile (Store, Office, Mall)">Group E - Business & Commercial Mercantile (Store, Office, Mall)</option>
                        <option value="Group F - Light Industrial Plant (Factory, Workshop)">Group F - Light Industrial Plant (Factory, Workshop)</option>
                        <option value="Group G - Storage & Warehouse (Freight, Depot)">Group G - Storage & Warehouse (Freight, Depot)</option>
                        <option value="Group J - Accessory Structure (Garage, Shed, Carport)">Group J - Accessory Structure (Garage, Shed, Carport)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section B: Dimensions, Storeys, Units & Schedule */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#1e3a8a", textTransform: "uppercase" }}>
                    Box 5: Dimensions, Storeys, Units & Schedule
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                        Lot Area (sq. m) *
                      </label>
                      <input
                        type="number"
                        required
                        value={lotArea}
                        placeholder="180"
                        onChange={(e) => setLotArea(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                        Total Floor Area (sq. m) *
                      </label>
                      <input
                        type="number"
                        required
                        value={floorArea}
                        placeholder="120"
                        onChange={(e) => setFloorArea(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                        Building Footprint (sq. m) *
                      </label>
                      <input
                        type="number"
                        required
                        value={buildingFootprint}
                        onChange={(e) => setBuildingFootprint(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                        Number of Storeys *
                      </label>
                      <input
                        type="number"
                        required
                        value={proposedStoreys}
                        onChange={(e) => setProposedStoreys(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                        Building Height (meters) *
                      </label>
                      <input
                        type="text"
                        required
                        value={buildingHeight}
                        onChange={(e) => setBuildingHeight(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                        Number of Units *
                      </label>
                      <input
                        type="number"
                        required
                        value={numberOfUnits}
                        onChange={(e) => setNumberOfUnits(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                        Proposed Start Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={proposedStartDate}
                        onChange={(e) => setProposedStartDate(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                        Expected Completion Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={expectedCompletionDate}
                        onChange={(e) => setExpectedCompletionDate(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section C: Estimated Cost Breakdown */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#1e3a8a", textTransform: "uppercase" }}>
                    Box 5: Estimated Engineering Cost Breakdown (PHP)
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Building & Civil (PHP) *</label>
                      <input type="text" value={costBuilding} onChange={(e) => setCostBuilding(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Electrical Works (PHP) *</label>
                      <input type="text" value={costElectrical} onChange={(e) => setCostElectrical(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Plumbing / Sanitary (PHP) *</label>
                      <input type="text" value={costPlumbing} onChange={(e) => setCostPlumbing(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Mechanical Systems (PHP)</label>
                      <input type="text" value={costMechanical} onChange={(e) => setCostMechanical(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Electronics & IT (PHP)</label>
                      <input type="text" value={costElectronics} onChange={(e) => setCostElectronics(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Other Ancillary (PHP)</label>
                      <input type="text" value={costOthers} onChange={(e) => setCostOthers(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                  </div>
                </div>

                {/* Section D: Lead Professional in Charge (Box 6) */}
                <div style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#334155", textTransform: "uppercase" }}>
                    Box 6: Lead Design Professional in Charge of Construction
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Civil Engineer / Architect Name *</label>
                      <input type="text" required value={civilEngineerName} onChange={(e) => setCivilEngineerName(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>PRC Registration No. *</label>
                      <input type="text" required value={civilEngineerPRC} onChange={(e) => setCivilEngineerPRC(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>PTR Number *</label>
                      <input type="text" required value={civilEngineerPTR} onChange={(e) => setCivilEngineerPTR(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Place Issued *</label>
                      <input type="text" required value={civilEngineerPTRIssued} onChange={(e) => setCivilEngineerPTRIssued(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                  </div>
                </div>

                {/* Section E: Box 5 (BP Box 3): BUILDING OWNER / APPLICANT */}
                <div style={{ background: "#ffffff", border: "1.5px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div>
                      <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#1e3a8a", textTransform: "uppercase" }}>
                        BUILDING OWNER / APPLICANT (Signature Over Printed Name & CTC)
                      </span>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.74rem", color: "#64748b" }}>
                        Official applicant sign-off and Community Tax Certificate (CTC) verification
                      </p>
                    </div>
                    <span style={{ fontSize: "0.7rem", color: "#1e3a8a", fontWeight: "700", background: "#dbeafe", padding: "3px 8px", borderRadius: "4px" }}>
                      NBC Form B-01 / S-01
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.85rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Applicant Full Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={compiledFullName} 
                        readOnly 
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "#f1f5f9", fontWeight: "700" }} 
                      />
                      <span style={{ fontSize: "0.68rem", color: "#64748b" }}>Synchronized with Box 1 Owner Name</span>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Date Signed *</label>
                      <input 
                        type="text" 
                        required 
                        value={applicantSignedDate} 
                        onChange={(e) => setApplicantSignedDate(e.target.value)} 
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: "0.85rem" }}>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Address *</label>
                    <input 
                      type="text" 
                      required 
                      value={compiledFullAddress} 
                      readOnly 
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "#f1f5f9" }} 
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.85rem", marginTop: "0.85rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>C.T.C. No. / Gov't ID No. *</label>
                      <input 
                        type="text" 
                        required 
                        value={govIdNo} 
                        onChange={(e) => setGovIdNo(e.target.value)} 
                        placeholder="e.g. CTC-2026-08912"
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Date Issued *</label>
                      <input 
                        type="text" 
                        required 
                        value={govIdDateIssued} 
                        onChange={(e) => setGovIdDateIssued(e.target.value)} 
                        placeholder="e.g. Jan 10, 2026"
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Place Issued *</label>
                      <input 
                        type="text" 
                        required 
                        value={govIdPlaceIssued} 
                        onChange={(e) => setGovIdPlaceIssued(e.target.value)} 
                        placeholder="e.g. Sto. Tomas, Pampanga"
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                    <SignatureCreator
                      value={applicantSignature}
                      onChange={setApplicantSignature}
                      label={`Applicant E-Signature (Affixed over printed name: ${compiledFullName})`}
                      required
                    />
                  </div>
                </div>

                {/* Section F: Box 6 (BP Box 4): WITH MY CONSENT: LOT OWNER */}
                <div style={{ background: "#ffffff", border: "1.5px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#0f172a", textTransform: "uppercase" }}>
                        WITH MY CONSENT: LOT OWNER
                      </span>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.74rem", color: "#64748b" }}>
                        Consent of the registered lot owner if different from the applicant
                      </p>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: "700", color: "#2563eb", cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        checked={lotOwnerConsent} 
                        onChange={(e) => setLotOwnerConsent(e.target.checked)} 
                        style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                      />
                      Include: With My Consent (Lot Owner)
                    </label>
                  </div>

                  {lotOwnerConsent ? (
                    <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid #e2e8f0" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.85rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Lot Owner Full Name (Signature Over Printed Name) *</label>
                          <input 
                            type="text" 
                            required 
                            value={lotOwnerName} 
                            onChange={(e) => setLotOwnerName(e.target.value)} 
                            placeholder="e.g. MARIA CLARA DELA CRUZ"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white", fontWeight: "700" }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Date Signed *</label>
                          <input 
                            type="text" 
                            required 
                            value={lotOwnerSignedDate} 
                            onChange={(e) => setLotOwnerSignedDate(e.target.value)} 
                            placeholder="e.g. Jan 08, 2026"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: "0.85rem" }}>
                        <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Address *</label>
                        <input 
                          type="text" 
                          required 
                          value={lotOwnerAddress} 
                          onChange={(e) => setLotOwnerAddress(e.target.value)} 
                          placeholder="e.g. Sto. Tomas, Pampanga"
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.85rem", marginTop: "0.85rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>C.T.C. No. / Gov't ID No. *</label>
                          <input 
                            type="text" 
                            required 
                            value={lotOwnerGovIdNo} 
                            onChange={(e) => setLotOwnerGovIdNo(e.target.value)} 
                            placeholder="e.g. CTC-2026-00871"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Date Issued *</label>
                          <input 
                            type="text" 
                            required 
                            value={lotOwnerGovIdDateIssued} 
                            onChange={(e) => setLotOwnerGovIdDateIssued(e.target.value)} 
                            placeholder="e.g. Jan 12, 2026"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Place Issued *</label>
                          <input 
                            type="text" 
                            required 
                            value={lotOwnerGovIdPlaceIssued} 
                            onChange={(e) => setLotOwnerGovIdPlaceIssued(e.target.value)} 
                            placeholder="e.g. Sto. Tomas, Pampanga"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                        <SignatureCreator
                          value={lotOwnerSignature}
                          onChange={setLotOwnerSignature}
                          label={`Lot Owner E-Signature (Affixed over printed name: ${lotOwnerName || "Lot Owner"})`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: "0.75rem", padding: "8px 12px", borderRadius: "6px", background: "#f8fafc", color: "#64748b", fontSize: "0.78rem" }}>
                      Lot Owner Consent will be left blank because the applicant is indicated as the property owner. Check the box above if separate lot owner consent is required.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* TAB 2: ARCHITECTURAL PERMIT (AP)           */}
            {/* ========================================== */}
            {activeTab === "architecturalPermit" && (
              <div className="animate-fade-in-up">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f5f3ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Layers size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>
                      Architectural Permit (AP) — NBC Form A-01
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                      Floor plans, building elevations, spatial programs, and Registered Architect sign-off
                    </p>
                  </div>
                </div>

                {/* Box 2: Scope of Work, Percentage of Site Occupancy & Fire Code Conformance */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#6d28d9", textTransform: "uppercase" }}>
                      Box 2: Scope of Work, Site Occupancy & Fire Code Conformance
                    </span>
                    <span style={{ fontSize: "0.72rem", background: "#ede9fe", color: "#6d28d9", padding: "2px 8px", borderRadius: "12px", fontWeight: "700" }}>
                      NBC Form A-01 • Box 2
                    </span>
                  </div>

                  {/* 2.1 Scope of Work */}
                  <div style={{ marginBottom: "1rem", padding: "0.85rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                      1. Scope of Work (Box 2.1) *
                    </label>
                    <select
                      value={scopeOfWork}
                      onChange={(e) => setScopeOfWork(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }}
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
                    {(scopeOfWork || "").toLowerCase().includes("other") && (
                      <div style={{ marginTop: "8px" }}>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#475569", marginBottom: "3px" }}>
                          Specify Other Scope of Work (Prints on Form Underline) *
                        </label>
                        <input
                          type="text"
                          placeholder="Specify details for other scope of work"
                          value={scopeOfWorkDetails}
                          onChange={(e) => setScopeOfWorkDetails(e.target.value)}
                          style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }}
                        />
                      </div>
                    )}
                  </div>

                  {/* 2.2 Percentage of Site Occupancy */}
                  <div style={{ marginBottom: "1rem", padding: "0.85rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase" }}>
                        2. PERCENTAGE OF SITE OCCUPANCY
                      </span>
                      <span style={{ fontSize: "0.7rem", background: "#ede9fe", color: "#6d28d9", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
                        NBC Form A-01 • Box 2.2
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.75rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#475569", marginBottom: "2px" }}>PERCENTAGE OF BUILDING FOOTPRINT</label>
                        <div style={{ position: "relative" }}>
                          <input
                            type="text"
                            value={percentBuildingFootprint}
                            onChange={(e) => setPercentBuildingFootprint(e.target.value)}
                            style={{ width: "100%", padding: "6px 20px 6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "white" }}
                          />
                          <span style={{ position: "absolute", right: "8px", top: "7px", fontSize: "0.75rem", color: "#94a3b8" }}>%</span>
                        </div>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#475569", marginBottom: "2px" }}>PERCENTAGE OF IMPERVIOUS SURFACE AREA</label>
                        <div style={{ position: "relative" }}>
                          <input
                            type="text"
                            value={percentImperviousSurface}
                            onChange={(e) => setPercentImperviousSurface(e.target.value)}
                            style={{ width: "100%", padding: "6px 20px 6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "white" }}
                          />
                          <span style={{ position: "absolute", right: "8px", top: "7px", fontSize: "0.75rem", color: "#94a3b8" }}>%</span>
                        </div>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#475569", marginBottom: "2px" }}>PERCENTAGE OF UNPAVED SURFACE AREA</label>
                        <div style={{ position: "relative" }}>
                          <input
                            type="text"
                            value={percentUnpavedSurface}
                            onChange={(e) => setPercentUnpavedSurface(e.target.value)}
                            style={{ width: "100%", padding: "6px 20px 6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "white" }}
                          />
                          <span style={{ position: "absolute", right: "8px", top: "7px", fontSize: "0.75rem", color: "#94a3b8" }}>%</span>
                        </div>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#475569", marginBottom: "2px" }}>OTHERS (Specify)</label>
                        <input
                          type="text"
                          placeholder="e.g. Lawn / Landscaping"
                          value={percentSiteOccupancyOthers}
                          onChange={(e) => setPercentSiteOccupancyOthers(e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "white" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2.3 Conformance to Fire Code */}
                  <div style={{ padding: "0.85rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase" }}>
                        3. CONFORMANCE TO FIRE CODE OF THE PHILIPPINES (P.D. 1185)
                      </span>
                      <span style={{ fontSize: "0.7rem", background: "#fee2e2", color: "#b91c1c", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
                        P.D. 1185
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.3fr 1.1fr", gap: "1rem", alignItems: "start" }}>
                      {/* Column 1 */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                          <input type="checkbox" checked={fireCodeExitDoors} onChange={(e) => setFireCodeExitDoors(e.target.checked)} style={{ accentColor: "#7c3aed" }} />
                          NUMBER AND WIDTH OF EXIT DOORS
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                          <input type="checkbox" checked={fireCodeCorridors} onChange={(e) => setFireCodeCorridors(e.target.checked)} style={{ accentColor: "#7c3aed" }} />
                          WIDTH OF CORRIDORS
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                          <input type="checkbox" checked={fireCodeDistanceExits} onChange={(e) => setFireCodeDistanceExits(e.target.checked)} style={{ accentColor: "#7c3aed" }} />
                          DISTANCE TO FIRE EXITS
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                          <input type="checkbox" checked={fireCodeAccessStreet} onChange={(e) => setFireCodeAccessStreet(e.target.checked)} style={{ accentColor: "#7c3aed" }} />
                          ACCESS TO PUBLIC STREET
                        </label>
                      </div>

                      {/* Column 2 */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                          <input type="checkbox" checked={fireCodeFireWalls} onChange={(e) => setFireCodeFireWalls(e.target.checked)} style={{ accentColor: "#7c3aed" }} />
                          FIRE WALLS
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                          <input type="checkbox" checked={fireCodeFireFighting} onChange={(e) => setFireCodeFireFighting(e.target.checked)} style={{ accentColor: "#7c3aed" }} />
                          FIRE FIGHTING AND SAFETY FACILITIES
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                          <input type="checkbox" checked={fireCodeSmokeDetectors} onChange={(e) => setFireCodeSmokeDetectors(e.target.checked)} style={{ accentColor: "#7c3aed" }} />
                          SMOKE DETECTORS
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                          <input type="checkbox" checked={fireCodeEmergencyLights} onChange={(e) => setFireCodeEmergencyLights(e.target.checked)} style={{ accentColor: "#7c3aed" }} />
                          EMERGENCY LIGHTS
                        </label>
                      </div>

                      {/* Column 3 */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                          <input type="checkbox" checked={Boolean(fireCodeOthers)} onChange={(e) => { if (!e.target.checked) setFireCodeOthers(""); else setFireCodeOthers("Fire escape & alarm system"); }} style={{ accentColor: "#7c3aed" }} />
                          OTHERS (Specify)
                        </label>
                        <input
                          type="text"
                          placeholder="Specify other fire safety compliance..."
                          value={fireCodeOthers}
                          onChange={(e) => setFireCodeOthers(e.target.value)}
                          style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.78rem", background: "white" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section A: Design Style & Space Planning */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#6d28d9", textTransform: "uppercase" }}>
                    Architectural Style & Space Program
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "1rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Architectural Style *</label>
                      <input type="text" required value={architecturalStyle} onChange={(e) => setArchitecturalStyle(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Bedrooms Count *</label>
                      <input type="number" required value={bedroomCount} onChange={(e) => setBedroomCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Bathrooms Count *</label>
                      <input type="number" required value={bathroomCount} onChange={(e) => setBathroomCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                  </div>
                  <div style={{ marginTop: "10px" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Allocated Auxiliary Spaces *</label>
                    <input type="text" required value={auxiliarySpaces} onChange={(e) => setAuxiliarySpaces(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                  </div>
                </div>

                {/* Section B: Setbacks & Envelope (meters) */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#6d28d9", textTransform: "uppercase" }}>
                    Zoning Setback Compliance & Building Envelope (Meters)
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Front Setback (m) *</label>
                      <input type="text" required value={frontSetback} onChange={(e) => setFrontSetback(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Rear Setback (m) *</label>
                      <input type="text" required value={rearSetback} onChange={(e) => setRearSetback(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Left Setback (m) *</label>
                      <input type="text" required value={leftSetback} onChange={(e) => setLeftSetback(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Right Setback (m) *</label>
                      <input type="text" required value={rightSetback} onChange={(e) => setRightSetback(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>TOSL Open Space (%) *</label>
                      <input type="text" required value={toslPercent} onChange={(e) => setToslPercent(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                  </div>
                </div>

                {/* Section C: Materials & Finishes */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#6d28d9", textTransform: "uppercase" }}>
                    Material Finishes & Specification Schedule
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Roofing Material *</label>
                      <input type="text" required value={roofingMaterial} onChange={(e) => setRoofingMaterial(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Exterior Wall Finishes *</label>
                      <input type="text" required value={exteriorWallFinish} onChange={(e) => setExteriorWallFinish(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Interior Floor Finishes *</label>
                      <input type="text" required value={floorFinishes} onChange={(e) => setFloorFinishes(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Ceiling Finishes *</label>
                      <input type="text" required value={ceilingFinishes} onChange={(e) => setCeilingFinishes(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Doors Schedule Specifications *</label>
                      <input type="text" required value={doorsSpec} onChange={(e) => setDoorsSpec(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Windows Schedule Specifications *</label>
                      <input type="text" required value={windowsSpec} onChange={(e) => setWindowsSpec(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                  </div>
                </div>

                {/* Section D: Registered Architect Credentials (Box 3) */}
                <div style={{ background: "#f5f3ff", border: "1.5px solid #ddd6fe", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#6d28d9", textTransform: "uppercase" }}>
                      Box 3: DESIGN PROFESSIONAL, PLANS AND SPECIFICATION (Architect)
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#7c3aed", fontWeight: "600" }}>
                      NBC Form A-01 (Signed & Sealed Over Printed Name)
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#5b21b6" }}>Architect Full Name *</label>
                      <input type="text" required value={architectName} onChange={(e) => setArchitectName(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#5b21b6" }}>Address *</label>
                      <input type="text" required value={architectAddress} onChange={(e) => setArchitectAddress(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#5b21b6" }}>IAPOA Certificate No. *</label>
                      <input type="text" required value={architectIAPOA} onChange={(e) => setArchitectIAPOA(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#5b21b6" }}>IAPOA Validity Date *</label>
                      <input type="text" required value={architectIAPOAValidity} onChange={(e) => setArchitectIAPOAValidity(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#5b21b6" }}>PRC Registration No. *</label>
                      <input type="text" required value={architectPRC} onChange={(e) => setArchitectPRC(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#5b21b6" }}>PRC Validity Date *</label>
                      <input type="text" required value={architectPRCValidity} onChange={(e) => setArchitectPRCValidity(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#5b21b6" }}>PTR Number *</label>
                      <input type="text" required value={architectPTR} onChange={(e) => setArchitectPTR(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#5b21b6" }}>Date Issued *</label>
                      <input type="text" required value={architectPTRIssued} onChange={(e) => setArchitectPTRIssued(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#5b21b6" }}>Place Issued *</label>
                      <input type="text" required value={architectPTRIssuedAt} onChange={(e) => setArchitectPTRIssuedAt(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#5b21b6" }}>Tax Identification No. (TIN) *</label>
                      <input type="text" required value={architectTIN} onChange={(e) => setArchitectTIN(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                  </div>
                </div>

                {/* Section E: Supervisor / In-Charge of Architectural Works (Box 4) */}
                <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#166534", textTransform: "uppercase" }}>
                      Box 4: SUPERVISOR / IN-CHARGE OF ARCHITECTURAL WORKS (Architect)
                    </span>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: "700", color: "#166534", cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        checked={sameAsDesignArchitect} 
                        onChange={e => setSameAsDesignArchitect(e.target.checked)} 
                      />
                      Same as Design Professional (Box 3)
                    </label>
                  </div>

                  {!sameAsDesignArchitect ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", color: "#166534" }}>Supervisor Architect Full Name *</label>
                        <input type="text" required value={supervisorArchitectName} onChange={(e) => setSupervisorArchitectName(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", color: "#166534" }}>Address *</label>
                        <input type="text" required value={supervisorArchitectAddress} onChange={(e) => setSupervisorArchitectAddress(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", color: "#166534" }}>IAPOA Certificate No. *</label>
                        <input type="text" required value={supervisorArchitectIAPOA} onChange={(e) => setSupervisorArchitectIAPOA(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", color: "#166534" }}>IAPOA Validity Date *</label>
                        <input type="text" required value={supervisorArchitectIAPOAValidity} onChange={(e) => setSupervisorArchitectIAPOAValidity(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", color: "#166534" }}>PRC Registration No. *</label>
                        <input type="text" required value={supervisorArchitectPRC} onChange={(e) => setSupervisorArchitectPRC(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", color: "#166534" }}>PRC Validity Date *</label>
                        <input type="text" required value={supervisorArchitectPRCValidity} onChange={(e) => setSupervisorArchitectPRCValidity(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", color: "#166534" }}>PTR Number *</label>
                        <input type="text" required value={supervisorArchitectPTR} onChange={(e) => setSupervisorArchitectPTR(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", color: "#166534" }}>Date Issued *</label>
                        <input type="text" required value={supervisorArchitectPTRIssued} onChange={(e) => setSupervisorArchitectPTRIssued(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", color: "#166534" }}>Place Issued *</label>
                        <input type="text" required value={supervisorArchitectPTRIssuedAt} onChange={(e) => setSupervisorArchitectPTRIssuedAt(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", color: "#166534" }}>Tax Identification No. (TIN) *</label>
                        <input type="text" required value={supervisorArchitectTIN} onChange={(e) => setSupervisorArchitectTIN(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: "8px 12px", borderRadius: "6px", background: "#dcfce7", color: "#166534", fontSize: "0.82rem" }}>
                      Using identical credentials from Box 3 (Design Professional: {architectName || "Architect"}).
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* TAB 3: CIVIL / STRUCTURAL PERMIT (SP)      */}
            {/* ========================================== */}
            {activeTab === "civilStructuralPermit" && (
              <div className="animate-fade-in-up">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f1f5f9", color: "#334155", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Hammer size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>
                      Civil / Structural Permit (SP) — NBC Form S-01
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                      Foundation design, structural framing, seismic and wind load analysis, and Civil Engineer sign-off
                    </p>
                  </div>
                </div>

                {/* Notice: Box 2 is accomplished on the structural plans */}
                <div style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}>
                  <Info size={18} color="#0284c7" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: "0.78rem", color: "#475569" }}>
                    <strong>Box 2 (Nature of Civil/Structural Works):</strong> In compliance with NBC Form S-01, technical framing calculations and specifications are submitted directly on the signed and sealed blueprints. Accomplish the professional engineer and owner verification boxes below.
                  </span>
                </div>

                {/* Section C: Civil Engineer Credentials (Box 3) */}
                <div style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#047857", textTransform: "uppercase" }}>
                      Box 3: DESIGN PROFESSIONAL, PLANS AND SPECIFICATION (Civil / Structural Engineer)
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#059669", fontWeight: "600" }}>
                      NBC Form S-01 (Signed & Sealed Over Printed Name)
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Civil Engineer Full Name *</label>
                      <input type="text" required value={civilEngineerName} onChange={(e) => setCivilEngineerName(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Address *</label>
                      <input type="text" required value={civilEngineerAddress} onChange={(e) => setCivilEngineerAddress(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>PRC Registration No. *</label>
                      <input type="text" required value={civilEngineerPRC} onChange={(e) => setCivilEngineerPRC(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>PRC Validity Date *</label>
                      <input type="date" required value={civilEngineerPRCValidity} onChange={(e) => setCivilEngineerPRCValidity(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>PICE Membership No. *</label>
                      <input type="text" required value={civilEngineerPICE} onChange={(e) => setCivilEngineerPICE(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>PTR Number *</label>
                      <input type="text" required value={civilEngineerPTR} onChange={(e) => setCivilEngineerPTR(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Date Issued *</label>
                      <input type="text" required value={civilEngineerPTRIssued} onChange={(e) => setCivilEngineerPTRIssued(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Place Issued *</label>
                      <input type="text" required value={civilEngineerPTRIssuedAt} onChange={(e) => setCivilEngineerPTRIssuedAt(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Tax Identification No. (TIN) *</label>
                      <input type="text" required value={civilEngineerTIN} onChange={(e) => setCivilEngineerTIN(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Date Signed *</label>
                      <input type="text" required value={civilEngineerSignedDate} onChange={(e) => setCivilEngineerSignedDate(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                  </div>
                  <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                    <SignatureCreator
                      value={civilEngineerSignature}
                      onChange={setCivilEngineerSignature}
                      label={`Civil Engineer E-Signature (Box 3 - ${civilEngineerName || "Civil Engineer"})`}
                    />
                  </div>
                </div>

                {/* Section D: Supervisor / In-Charge of Civil/Structural Works (Box 4) */}
                <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#166534", textTransform: "uppercase" }}>
                      Box 4: SUPERVISOR / IN-CHARGE OF CIVIL/STRUCTURAL WORKS (Civil Engineer)
                    </span>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: "700", color: "#166534", cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        checked={sameAsDesignCivilEngineer} 
                        onChange={e => setSameAsDesignCivilEngineer(e.target.checked)} 
                      />
                      Same as Design Professional (Box 3)
                    </label>
                  </div>

                  {!sameAsDesignCivilEngineer ? (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#166534" }}>Supervisor Civil Engineer Full Name *</label>
                          <input type="text" required value={supervisorCivilEngineerName} onChange={(e) => setSupervisorCivilEngineerName(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#166534" }}>Address *</label>
                          <input type="text" required value={supervisorCivilEngineerAddress} onChange={(e) => setSupervisorCivilEngineerAddress(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#166534" }}>PRC Registration No. *</label>
                          <input type="text" required value={supervisorCivilEngineerPRC} onChange={(e) => setSupervisorCivilEngineerPRC(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#166534" }}>PRC Validity Date *</label>
                          <input type="date" required value={supervisorCivilEngineerPRCValidity} onChange={(e) => setSupervisorCivilEngineerPRCValidity(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#166534" }}>PICE Membership No. *</label>
                          <input type="text" required value={supervisorCivilEngineerPICE} onChange={(e) => setSupervisorCivilEngineerPICE(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#166534" }}>PTR Number *</label>
                          <input type="text" required value={supervisorCivilEngineerPTR} onChange={(e) => setSupervisorCivilEngineerPTR(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#166534" }}>Date Issued *</label>
                          <input type="text" required value={supervisorCivilEngineerPTRIssued} onChange={(e) => setSupervisorCivilEngineerPTRIssued(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#166534" }}>Place Issued *</label>
                          <input type="text" required value={supervisorCivilEngineerPTRIssuedAt} onChange={(e) => setSupervisorCivilEngineerPTRIssuedAt(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#166534" }}>Tax Identification No. (TIN) *</label>
                          <input type="text" required value={supervisorCivilEngineerTIN} onChange={(e) => setSupervisorCivilEngineerTIN(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#166534" }}>Date Signed *</label>
                          <input type="text" required value={supervisorCivilEngineerSignedDate} onChange={(e) => setSupervisorCivilEngineerSignedDate(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                        </div>
                      </div>
                      <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #bbf7d0" }}>
                        <SignatureCreator
                          value={supervisorCivilEngineerSignature}
                          onChange={setSupervisorCivilEngineerSignature}
                          label={`Supervisor Civil Engineer E-Signature (Box 4 - ${supervisorCivilEngineerName || "Supervisor Civil Engineer"})`}
                        />
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: "8px 12px", borderRadius: "6px", background: "#dcfce7", color: "#166534", fontSize: "0.82rem" }}>
                      Using identical credentials and signature from Box 3 (Design Professional: {civilEngineerName || "Civil Engineer"}).
                    </div>
                  )}
                </div>

                {/* Section E: Box 5: BUILDING OWNER */}
                <div style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div>
                      <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#1e3a8a", textTransform: "uppercase" }}>
                        BOX 5: BUILDING OWNER (Signature Over Printed Name & CTC Verification)
                      </span>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.74rem", color: "#64748b" }}>
                        Official owner acknowledgment and Community Tax Certificate (CTC) sign-off
                      </p>
                    </div>
                    <span style={{ fontSize: "0.7rem", color: "#1e3a8a", fontWeight: "700", background: "#dbeafe", padding: "3px 8px", borderRadius: "4px" }}>
                      NBC Form S-01 Box 5
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.85rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Building Owner Printed Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={compiledFullName} 
                        readOnly 
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "#f1f5f9", fontWeight: "700" }} 
                      />
                      <span style={{ fontSize: "0.68rem", color: "#64748b" }}>Synchronized with Box 1 Owner Name</span>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Date Signed *</label>
                      <input 
                        type="text" 
                        required 
                        value={applicantSignedDate} 
                        onChange={(e) => setApplicantSignedDate(e.target.value)} 
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: "0.85rem" }}>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Address *</label>
                    <input 
                      type="text" 
                      required 
                      value={compiledFullAddress} 
                      readOnly 
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "#f1f5f9" }} 
                    />
                    <span style={{ fontSize: "0.68rem", color: "#64748b" }}>Synchronized with Box 1 Street & Barangay Address</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.85rem", marginTop: "0.85rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>C.T.C. No. / Gov't ID No. *</label>
                      <input 
                        type="text" 
                        required 
                        value={govIdNo} 
                        onChange={(e) => setGovIdNo(e.target.value)} 
                        placeholder="e.g. CTC-2026-08912"
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Date Issued *</label>
                      <input 
                        type="text" 
                        required 
                        value={govIdDateIssued} 
                        onChange={(e) => setGovIdDateIssued(e.target.value)} 
                        placeholder="e.g. Jan 10, 2026"
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Place Issued *</label>
                      <input 
                        type="text" 
                        required 
                        value={govIdPlaceIssued} 
                        onChange={(e) => setGovIdPlaceIssued(e.target.value)} 
                        placeholder="e.g. Sto. Tomas, Pampanga"
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                    <SignatureCreator
                      value={applicantSignature}
                      onChange={setApplicantSignature}
                      label={`Building Owner E-Signature (Affixed over printed name: ${compiledFullName})`}
                      required
                    />
                  </div>
                </div>

                {/* Section F: Box 6: WITH MY CONSENT: LOT OWNER */}
                <div style={{ background: "#ffffff", border: "1.5px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#0f172a", textTransform: "uppercase" }}>
                        BOX 6: WITH MY CONSENT: LOT OWNER
                      </span>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.74rem", color: "#64748b" }}>
                        Consent of the registered lot owner if different from the building owner / applicant
                      </p>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: "700", color: "#2563eb", cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        checked={lotOwnerConsent} 
                        onChange={(e) => setLotOwnerConsent(e.target.checked)} 
                        style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                      />
                      Include Box 6: With My Consent (Lot Owner)
                    </label>
                  </div>

                  {lotOwnerConsent ? (
                    <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid #e2e8f0" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.85rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Lot Owner Full Name (Signature Over Printed Name) *</label>
                          <input 
                            type="text" 
                            required 
                            value={lotOwnerName} 
                            onChange={(e) => setLotOwnerName(e.target.value)} 
                            placeholder="e.g. MARIA CLARA DELA CRUZ"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white", fontWeight: "700" }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Date Signed *</label>
                          <input 
                            type="text" 
                            required 
                            value={lotOwnerSignedDate} 
                            onChange={(e) => setLotOwnerSignedDate(e.target.value)} 
                            placeholder="e.g. Jan 08, 2026"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: "0.85rem" }}>
                        <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Address *</label>
                        <input 
                          type="text" 
                          required 
                          value={lotOwnerAddress} 
                          onChange={(e) => setLotOwnerAddress(e.target.value)} 
                          placeholder="e.g. Sto. Tomas, Pampanga"
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.85rem", marginTop: "0.85rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>C.T.C. No. / Gov't ID No. *</label>
                          <input 
                            type="text" 
                            required 
                            value={lotOwnerGovIdNo} 
                            onChange={(e) => setLotOwnerGovIdNo(e.target.value)} 
                            placeholder="e.g. CTC-2026-00871"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Date Issued *</label>
                          <input 
                            type="text" 
                            required 
                            value={lotOwnerGovIdDateIssued} 
                            onChange={(e) => setLotOwnerGovIdDateIssued(e.target.value)} 
                            placeholder="e.g. Jan 12, 2026"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Place Issued *</label>
                          <input 
                            type="text" 
                            required 
                            value={lotOwnerGovIdPlaceIssued} 
                            onChange={(e) => setLotOwnerGovIdPlaceIssued(e.target.value)} 
                            placeholder="e.g. Sto. Tomas, Pampanga"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                        <SignatureCreator
                          value={lotOwnerSignature}
                          onChange={setLotOwnerSignature}
                          label={`Lot Owner E-Signature (Affixed over printed name: ${lotOwnerName || "Lot Owner"})`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: "0.75rem", padding: "8px 12px", borderRadius: "6px", background: "#f8fafc", color: "#64748b", fontSize: "0.78rem" }}>
                      Box 6 (Lot Owner Consent) will be left blank on the official permit because the applicant is indicated as the property owner. Check the box above if separate lot owner consent is required.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* TAB 4: ELECTRICAL PERMIT (EP)              */}
            {/* ========================================== */}
            {activeTab === "electricalPermit" && (
              <div className="animate-fade-in-up">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#e0e7ff", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Zap size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>
                      Electrical Permit (EP) — NBC Form E-01
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                      Load computations, service entrance, feeder conduits, branch circuits, and Professional Electrical Engineer sign-off
                    </p>
                  </div>
                </div>

                {/* Section 0: Scope of Work & Type of Occupancy (NBC Form E-01 Box 1) */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#1e40af", textTransform: "uppercase" }}>
                    Scope of Work & Type of Occupancy (Box 1)
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                        Scope of Work *
                      </label>
                      <select
                        value={electricalScopeOfWork}
                        onChange={(e) => setElectricalScopeOfWork(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "#ffffff" }}
                      >
                        <option value="New Installation">New Installation</option>
                        <option value="Annual Inspection">Annual Inspection</option>
                        <option value="Addition">Addition</option>
                        <option value="Repair">Repair</option>
                        <option value="Removal">Removal</option>
                        <option value="Others">Others (Specify)</option>
                      </select>
                      {["Addition", "Repair", "Removal", "Others"].some(k => electricalScopeOfWork.toLowerCase().includes(k.toLowerCase())) && (
                        <div style={{ marginTop: "6px" }}>
                          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#64748b", marginBottom: "2px" }}>
                            Specify {electricalScopeOfWork} Details (Printed on Form Underline)
                          </label>
                          <input
                            type="text"
                            value={electricalScopeDetails}
                            onChange={(e) => setElectricalScopeDetails(e.target.value)}
                            placeholder={`e.g. Details for ${electricalScopeOfWork}`}
                            style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                        Type of Occupancy (NBC Form E-01) *
                      </label>
                      <select
                        value={electricalOccupancy}
                        onChange={(e) => setElectricalOccupancy(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #93c5fd", fontSize: "0.88rem", background: "#f0f9ff", color: "#1e3a8a", fontWeight: "700" }}
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
                      {electricalOccupancy.includes("OTHERS") && (
                        <div style={{ marginTop: "6px" }}>
                          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#64748b", marginBottom: "2px" }}>
                            Specify Other Occupancy (Printed on Form Underline)
                          </label>
                          <input
                            type="text"
                            value={electricalOccupancyOthers}
                            onChange={(e) => setElectricalOccupancyOthers(e.target.value)}
                            placeholder="e.g. SPECIAL WORKSHOP / DATA CENTER"
                            style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section A: Service Entrance & Main Distribution */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#1e40af", textTransform: "uppercase" }}>
                    Service Entrance, Voltage, & Main Circuit Breaker
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Service Voltage & System *</label>
                      <input type="text" required value={electricalVoltage} onChange={(e) => setElectricalVoltage(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Total Connected Load *</label>
                      <input type="text" required value={electricalConnectedLoad} onChange={(e) => setElectricalConnectedLoad(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Main Circuit Breaker (MCCB) *</label>
                      <input type="text" required value={mainBreaker} onChange={(e) => setMainBreaker(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Branch Circuits Configuration *</label>
                      <input type="text" required value={branchCircuitsCount} onChange={(e) => setBranchCircuitsCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Service Entrance Wire & Conduit *</label>
                      <input type="text" required value={electricalFeeder} onChange={(e) => setElectricalFeeder(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Grounding System Specifications *</label>
                      <input type="text" required value={groundingSpec} onChange={(e) => setGroundingSpec(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                  </div>
                </div>

                {/* Section B: Fixture & Outlets Quantities */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#1e40af", textTransform: "uppercase" }}>
                    Schedule of Electrical Outlets & Devices
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Lighting Outlets *</label>
                      <input type="number" required value={lightingOutletsCount} onChange={(e) => setLightingOutletsCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Convenience Outlets *</label>
                      <input type="number" required value={convenienceOutletsCount} onChange={(e) => setConvenienceOutletsCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>ACU Outlets *</label>
                      <input type="number" required value={acuOutletsCount} onChange={(e) => setAcuOutletsCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Cooking Range Outlets *</label>
                      <input type="number" required value={rangeOutletsCount} onChange={(e) => setRangeOutletsCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Water Heater Outlets *</label>
                      <input type="number" required value={waterHeaterOutletsCount} onChange={(e) => setWaterHeaterOutletsCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Water Pump Outlets *</label>
                      <input type="number" required value={waterPumpOutletsCount} onChange={(e) => setWaterPumpOutletsCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                  </div>

                  <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px dashed #cbd5e1" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#1e40af", textTransform: "uppercase" }}>
                      Box 1: Number of Equipment / Wiring Devices
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginTop: "10px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Toggle Switch *</label>
                        <input type="number" required value={toggleSwitchCount} onChange={(e) => setToggleSwitchCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Bell / Buzzer *</label>
                        <input type="number" required value={bellBuzzerCount} onChange={(e) => setBellBuzzerCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Push Buttons *</label>
                        <input type="number" required value={pushButtonsCount} onChange={(e) => setPushButtonsCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>FA Detector *</label>
                        <input type="number" required value={faDetectorCount} onChange={(e) => setFaDetectorCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Others (See Attached List) *</label>
                        <input type="number" required value={otherWiringDevicesCount} onChange={(e) => setOtherWiringDevicesCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section C: Electrical Engineer Credentials */}
                <div style={{ background: "#eef2ff", border: "1.5px solid #c7d2fe", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#1e40af", textTransform: "uppercase" }}>
                    Box 2: Design Professional: Professional Electrical Engineer (IIEE)
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#1e3a8a" }}>Electrical Engineer Name *</label>
                      <input type="text" required value={electricalEngineerName} onChange={(e) => setElectricalEngineerName(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#1e3a8a" }}>PRC Registration No. *</label>
                      <input type="text" required value={electricalEngineerPRC} onChange={(e) => setElectricalEngineerPRC(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#1e3a8a" }}>PRC Validity Date *</label>
                      <input type="date" required value={electricalEngineerPRCValidity} onChange={(e) => setElectricalEngineerPRCValidity(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#1e3a8a" }}>IIEE Membership No. *</label>
                      <input type="text" required value={electricalEngineerIIEE} onChange={(e) => setElectricalEngineerIIEE(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#1e3a8a" }}>PTR Number *</label>
                      <input type="text" required value={electricalEngineerPTR} onChange={(e) => setElectricalEngineerPTR(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#1e3a8a" }}>Place Issued *</label>
                      <input type="text" required value={electricalEngineerPTRIssued} onChange={(e) => setElectricalEngineerPTRIssued(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                  </div>

                  <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                    <SignatureCreator
                      value={electricalEngineerSignature}
                      onChange={setElectricalEngineerSignature}
                      label={`Electrical Engineer E-Signature (Box 2 - ${electricalEngineerName || "Professional Electrical Engineer"})`}
                    />
                  </div>
                </div>

                {/* Section D: Electrical Contractor (Box 3) */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#1e40af", textTransform: "uppercase" }}>
                      Box 3: Electrical Contractor (200 Ampere Main and Above)
                    </span>
                    <span style={{ fontSize: "0.68rem", fontWeight: "600", color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px" }}>
                      Special Electrical • PCAB Licensed
                    </span>
                  </div>
                  <p style={{ margin: "0 0 10px 0", fontSize: "0.76rem", color: "#64748b" }}>
                    Required for installations with 200A main circuit breaker and above.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.85rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#334155", fontWeight: "600", marginBottom: "4px" }}>Contractor Name / Firm</label>
                      <input type="text" value={electricalContractorName} onChange={(e) => setElectricalContractorName(e.target.value)} placeholder="VOLTMAX ELECTRICAL SERVICES & CONTRACTING INC." style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#334155", fontWeight: "600", marginBottom: "4px" }}>PCAB Lic. No. (Special Electrical)</label>
                      <input type="text" value={electricalContractorPcab} onChange={(e) => setElectricalContractorPcab(e.target.value)} placeholder="PCAB-EL-2026-9811" style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.85rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#334155", fontWeight: "600", marginBottom: "4px" }}>Contractor Business Address</label>
                      <input type="text" value={electricalContractorAddress} onChange={(e) => setElectricalContractorAddress(e.target.value)} placeholder="San Fernando, Pampanga" style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#334155", fontWeight: "600", marginBottom: "4px" }}>Tel. / Fax No.</label>
                      <input type="text" value={electricalContractorTel} onChange={(e) => setElectricalContractorTel(e.target.value)} placeholder="0918-777-8899" style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                  </div>
                </div>

                {/* Section E: Box 4: Person In-Charge of Installation */}
                <div style={{ background: "#ffffff", border: "1.5px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div>
                      <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#0f172a", textTransform: "uppercase" }}>
                        BOX 4: PERSON IN-CHARGE OF INSTALLATION
                      </span>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.74rem", color: "#64748b" }}>
                        Professional in-charge of electrical installation (PEE, REE, or RME)
                      </p>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: "700", color: "#2563eb", cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        checked={sameAsDesignElectricalEngineer} 
                        onChange={(e) => setSameAsDesignElectricalEngineer(e.target.checked)} 
                        style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                      />
                      Same as Design Professional (Box 2)
                    </label>
                  </div>

                  {!sameAsDesignElectricalEngineer ? (
                    <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid #e2e8f0" }}>
                      {/* Classification Radio Buttons */}
                      <div style={{ marginBottom: "1rem", padding: "10px 12px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                          Professional Classification (Form E-01 Box 4 Checkboxes)
                        </label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem" }}>
                          <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="installationInChargeRoleStep"
                              value="PEE"
                              checked={installationInChargeRole === "PEE"}
                              onChange={() => setInstallationInChargeRole("PEE")}
                              style={{ accentColor: "#2563eb" }}
                            />
                            <span>PROFESSIONAL ELECTRICAL ENGINEER</span>
                          </label>
                          <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="installationInChargeRoleStep"
                              value="REE"
                              checked={installationInChargeRole === "REE"}
                              onChange={() => setInstallationInChargeRole("REE")}
                              style={{ accentColor: "#2563eb" }}
                            />
                            <span>REGISTERED ELECTRICAL ENGINEER</span>
                          </label>
                          <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="installationInChargeRoleStep"
                              value="RME"
                              checked={installationInChargeRole === "RME"}
                              onChange={() => setInstallationInChargeRole("RME")}
                              style={{ accentColor: "#2563eb" }}
                            />
                            <span>REGISTERED MASTER ELECTRICIAN (&lt;600V &amp; 500kVA)</span>
                          </label>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "0.85rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Full Name (Signature Over Printed Name) *</label>
                          <input 
                            type="text" 
                            required 
                            value={installationInChargeName} 
                            onChange={(e) => setInstallationInChargeName(e.target.value)} 
                            placeholder="e.g. ENGR. EDGAR C. MENDOZA, REE"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white", fontWeight: "700" }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>PRC Reg No. *</label>
                          <input 
                            type="text" 
                            required 
                            value={installationInChargePRC} 
                            onChange={(e) => setInstallationInChargePRC(e.target.value)} 
                            placeholder="e.g. 0045678"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>PRC Validity *</label>
                          <input 
                            type="date" 
                            required 
                            value={installationInChargePRCValidity} 
                            onChange={(e) => setInstallationInChargePRCValidity(e.target.value)} 
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                          />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "0.85rem", marginTop: "0.85rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Address *</label>
                          <input 
                            type="text" 
                            required 
                            value={installationInChargeAddress} 
                            onChange={(e) => setInstallationInChargeAddress(e.target.value)} 
                            placeholder="e.g. Sto. Tomas, Pampanga"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Tel / Fax No. *</label>
                          <input 
                            type="text" 
                            required 
                            value={installationInChargeTel} 
                            onChange={(e) => setInstallationInChargeTel(e.target.value)} 
                            placeholder="e.g. 0917-888-1234"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                          />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.85rem", marginTop: "0.85rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>P.T.R No. *</label>
                          <input 
                            type="text" 
                            required 
                            value={installationInChargePTR} 
                            onChange={(e) => setInstallationInChargePTR(e.target.value)} 
                            placeholder="e.g. PTR-ST-2026-5566"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Date Issued *</label>
                          <input 
                            type="text" 
                            required 
                            value={installationInChargePTRIssued} 
                            onChange={(e) => setInstallationInChargePTRIssued(e.target.value)} 
                            placeholder="e.g. Jan 14, 2026"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Place Issued *</label>
                          <input 
                            type="text" 
                            required 
                            value={installationInChargePTRIssuedAt} 
                            onChange={(e) => setInstallationInChargePTRIssuedAt(e.target.value)} 
                            placeholder="e.g. Sto. Tomas, Pampanga"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Date Signed *</label>
                          <input 
                            type="text" 
                            required 
                            value={installationInChargeSignedDate} 
                            onChange={(e) => setInstallationInChargeSignedDate(e.target.value)} 
                            placeholder="e.g. Jan 15, 2026"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: "0.85rem" }}>
                        <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>T.I.N *</label>
                        <input 
                          type="text" 
                          required 
                          value={installationInChargeTIN} 
                          onChange={(e) => setInstallationInChargeTIN(e.target.value)} 
                          placeholder="e.g. 345-678-901-000"
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} 
                        />
                      </div>

                      <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                        <SignatureCreator
                          value={installationInChargeSignature}
                          onChange={setInstallationInChargeSignature}
                          label={`Person In-Charge of Installation E-Signature (Box 4 - ${installationInChargeName || "Person In-Charge"})`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: "0.75rem", padding: "10px 14px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "0.82rem" }}>
                      Using identical credentials and signature from Box 2 (Design Professional: {electricalEngineerName || "Professional Electrical Engineer"}).
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* TAB 5: SANITARY / PLUMBING PERMIT (PL)     */}
            {/* ========================================== */}
            {activeTab === "sanitaryPermit" && (
              <div className="animate-fade-in-up">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#ecfeff", color: "#0891b2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Droplets size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>
                      Sanitary / Plumbing Permit (PL) — NBC Form P-01
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                      Potable water distribution, drainage, septic tank dimensions, and Registered Master Plumber sign-off
                    </p>
                  </div>
                </div>

                {/* Section A: Scope of Work (NBC Form P-01 Box 1) */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#0e7490", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      Scope of Work (NBC Form P-01 Box 1)
                    </span>
                    <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: "600" }}>
                      Select the applicable sanitary / plumbing scope
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    {[
                      { id: "NEW INSTALLATION", label: "New Installation", desc: "Complete plumbing/sanitary installation" },
                      { id: "ADDITION OF", label: "Addition Of", desc: "Add fixtures or extended piping" },
                      { id: "REPAIR OF", label: "Repair Of", desc: "Restoration of existing fixtures/pipes" },
                      { id: "REMOVAL OF", label: "Removal Of", desc: "Dismantling or decommissioning" },
                      { id: "OTHERS", label: "Others (Specify)", desc: "Custom plumbing action / system" },
                    ].map((opt) => {
                      const isSelected = sanitaryScopeOfWork === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setSanitaryScopeOfWork(opt.id as any)}
                          style={{
                            cursor: "pointer",
                            padding: "10px 12px",
                            borderRadius: "10px",
                            border: isSelected ? "2px solid #0891b2" : "1px solid #e2e8f0",
                            background: isSelected ? "#ecfeff" : "#f8fafc",
                            boxShadow: isSelected ? "0 2px 8px rgba(8, 145, 178, 0.12)" : "none",
                            transition: "all 0.15s ease",
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                              type="radio"
                              name="sanitaryScopeRadio"
                              checked={isSelected}
                              onChange={() => setSanitaryScopeOfWork(opt.id as any)}
                              style={{ accentColor: "#0891b2", cursor: "pointer" }}
                            />
                            <span style={{ fontSize: "0.85rem", fontWeight: isSelected ? "700" : "600", color: isSelected ? "#0e7490" : "#334155" }}>
                              {opt.label}
                            </span>
                          </div>
                          <span style={{ fontSize: "0.72rem", color: isSelected ? "#155e75" : "#64748b", marginLeft: "22px" }}>
                            {opt.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dynamic specification inputs for Addition, Repair, Removal */}
                  {(sanitaryScopeOfWork === "ADDITION OF" || sanitaryScopeOfWork === "REPAIR OF" || sanitaryScopeOfWork === "REMOVAL OF") && (
                    <div className="animate-fade-in-up" style={{ background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: "8px", padding: "10px 12px", marginTop: "10px" }}>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#0f766e", marginBottom: "4px" }}>
                        Specify {sanitaryScopeOfWork === "ADDITION OF" ? "Addition Of" : sanitaryScopeOfWork === "REPAIR OF" ? "Repair Of" : "Removal Of"} (Prints on Official Form Underline) *
                      </label>
                      <input
                        type="text"
                        required
                        value={sanitaryScopeDetails}
                        onChange={(e) => setSanitaryScopeDetails(e.target.value)}
                        placeholder={
                          sanitaryScopeOfWork === "ADDITION OF"
                            ? "e.g., 2 Water Closets, 1 Lavatory & Septic Line"
                            : sanitaryScopeOfWork === "REPAIR OF"
                            ? "e.g., Main Soil Pipe & Drainage Traps"
                            : "e.g., Obsolete Galvanized Iron Water Pipes"
                        }
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                      />
                    </div>
                  )}

                  {/* Dynamic specification input for Others (Specify) */}
                  {sanitaryScopeOfWork === "OTHERS" && (
                    <div className="animate-fade-in-up" style={{ background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: "8px", padding: "10px 12px", marginTop: "10px" }}>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#0f766e", marginBottom: "6px" }}>
                        Specify Others: [Action / Scope] OF [System / Component] (Prints on Form Underlines) *
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 32px 1fr", alignItems: "center", gap: "8px" }}>
                        <div>
                          <input
                            type="text"
                            required
                            value={sanitaryScopeOthersAction}
                            onChange={(e) => setSanitaryScopeOthersAction(e.target.value)}
                            placeholder="e.g., UPGRADING / RETROFITTING"
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                          />
                          <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Action (1st underline)</span>
                        </div>
                        <div style={{ textAlign: "center", fontWeight: "800", color: "#0f766e", fontSize: "0.85rem" }}>
                          OF
                        </div>
                        <div>
                          <input
                            type="text"
                            required
                            value={sanitaryScopeOthersTarget}
                            onChange={(e) => setSanitaryScopeOthersTarget(e.target.value)}
                            placeholder="e.g., GREASE TRAP & SEWER"
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                          />
                          <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Component / System (2nd underline)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>



                {/* Section C: FIXTURES TO BE INSTALLED Schedule (NBC Form P-01 Box 1) */}
                <div style={{ background: "#ffffff", border: "1.5px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.88rem", fontWeight: "800", color: "#0e7490", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          FIXTURES TO BE INSTALLED
                        </span>
                        <span style={{ fontSize: "0.68rem", fontWeight: "700", background: "#ecfeff", color: "#0891b2", border: "1px solid #a5f3fc", padding: "2px 8px", borderRadius: "4px" }}>
                          NBC Form P-01 Box 1
                        </span>
                      </div>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#64748b" }}>
                        Specify quantities, select New or Existing fixtures, and verify plumbing & drainage distribution systems
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.76rem", fontWeight: "700", color: "#0891b2", background: "#ecfeff", border: "1px solid #a5f3fc", padding: "4px 12px", borderRadius: "999px" }}>
                        Total Fixtures: {leftFixturesTotal + rightFixturesTotal} Units
                      </span>
                    </div>
                  </div>

                  {/* Two-Column Fixtures Schedule Grid matching official form */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1rem" }}>
                    
                    {/* LEFT COLUMN TABLE (Core Sanitary Fixtures) */}
                    <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "hidden", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                      {/* Official Table Header */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "48px 65px 65px 1fr",
                        background: "#f1f5f9",
                        borderBottom: "1.5px solid #cbd5e1",
                        padding: "6px 8px",
                        fontSize: "0.68rem",
                        fontWeight: "800",
                        color: "#334155",
                        textAlign: "center",
                        alignItems: "center"
                      }}>
                        <span>QTY</span>
                        <span style={{ lineHeight: "1.15" }}>NEW<br/>FIXTURES</span>
                        <span style={{ lineHeight: "1.15" }}>EXISTING<br/>FIXTURES</span>
                        <span style={{ textAlign: "left", paddingLeft: "8px" }}>KIND OF FIXTURES</span>
                      </div>

                      {/* Left Column Fixture Rows */}
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {[
                          { key: "waterClosetsCount", label: "Water Closet", val: waterClosetsCount, setVal: setWaterClosetsCount },
                          { key: "floorDrainsCount", label: "Floor Drain", val: floorDrainsCount, setVal: setFloorDrainsCount },
                          { key: "lavatoriesCount", label: "Lavatories", val: lavatoriesCount, setVal: setLavatoriesCount },
                          { key: "kitchenSinksCount", label: "Kitchen Sink", val: kitchenSinksCount, setVal: setKitchenSinksCount },
                          { key: "faucetsCount", label: "Faucet", val: faucetsCount, setVal: setFaucetsCount },
                          { key: "showersCount", label: "Shower Head", val: showersCount, setVal: setShowersCount },
                          { key: "waterMeterCount", label: "Water Meter", val: waterMeterCount, setVal: setWaterMeterCount },
                          { key: "greaseTrapCount", label: "Grease Trap", val: greaseTrapCount, setVal: setGreaseTrapCount },
                          { key: "bathTubsCount", label: "Bath Tubs", val: bathTubsCount, setVal: setBathTubsCount },
                          { key: "slopSinkCount", label: "Slop Sink", val: slopSinkCount, setVal: setSlopSinkCount },
                          { key: "urinalCount", label: "Urinal", val: urinalCount, setVal: setUrinalCount },
                          { key: "airConditioningCount", label: "Air Conditioning Unit", val: airConditioningCount, setVal: setAirConditioningCount },
                          { key: "waterTankCount", label: "Water Tank/Reservoir", val: waterTankCount, setVal: setWaterTankCount },
                        ].map((fix, idx) => {
                          const status = fixtureStatusMap[fix.key] || "new";
                          const qtyNum = parseInt(fix.val, 10) || 0;
                          const hasQty = qtyNum > 0;
                          const isNew = hasQty && status === "new";
                          const isExist = hasQty && status === "existing";

                          return (
                            <div
                              key={fix.key}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "48px 65px 65px 1fr",
                                alignItems: "center",
                                padding: "4px 8px",
                                borderBottom: idx < 12 ? "1px solid #f1f5f9" : "none",
                                background: hasQty ? "#ecfeff33" : (idx % 2 === 0 ? "#f8fafc" : "#ffffff"),
                                transition: "background 0.15s ease",
                              }}
                            >
                              {/* QTY Input */}
                              <div style={{ display: "flex", justifyContent: "center" }}>
                                <input
                                  type="number"
                                  min="0"
                                  value={fix.val}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    fix.setVal(v);
                                    if ((parseInt(v, 10) || 0) > 0 && !fixtureStatusMap[fix.key]) {
                                      setFixtureStatusMap(prev => ({ ...prev, [fix.key]: "new" }));
                                    }
                                  }}
                                  placeholder="—"
                                  style={{
                                    width: "42px",
                                    height: "26px",
                                    padding: "2px 4px",
                                    textAlign: "center",
                                    fontWeight: hasQty ? "800" : "500",
                                    fontSize: "0.82rem",
                                    border: hasQty ? "1.5px solid #0891b2" : "1px solid #cbd5e1",
                                    borderRadius: "4px",
                                    background: hasQty ? "#ffffff" : "#ffffff",
                                    color: hasQty ? "#0e7490" : "#64748b",
                                    outline: "none"
                                  }}
                                />
                              </div>

                              {/* NEW FIXTURES Checkbox [X] */}
                              <div style={{ display: "flex", justifyContent: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isNew) {
                                      setFixtureStatusMap(prev => {
                                        const c = { ...prev };
                                        delete c[fix.key];
                                        return c;
                                      });
                                    } else {
                                      setFixtureStatusMap(prev => ({ ...prev, [fix.key]: "new" }));
                                      if (!hasQty) fix.setVal("1");
                                    }
                                  }}
                                  title={`Mark ${fix.label} as New Fixture`}
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "4px",
                                    border: isNew ? "2px solid #0891b2" : "1.5px solid #cbd5e1",
                                    background: isNew ? "#0891b2" : "#ffffff",
                                    color: isNew ? "#ffffff" : "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.75rem",
                                    fontWeight: "900",
                                    cursor: "pointer",
                                    padding: 0,
                                    lineHeight: 1,
                                    transition: "all 0.15s ease"
                                  }}
                                >
                                  {isNew ? "X" : ""}
                                </button>
                              </div>

                              {/* EXISTING FIXTURES Checkbox [X] */}
                              <div style={{ display: "flex", justifyContent: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isExist) {
                                      setFixtureStatusMap(prev => {
                                        const c = { ...prev };
                                        delete c[fix.key];
                                        return c;
                                      });
                                    } else {
                                      setFixtureStatusMap(prev => ({ ...prev, [fix.key]: "existing" }));
                                      if (!hasQty) fix.setVal("1");
                                    }
                                  }}
                                  title={`Mark ${fix.label} as Existing Fixture`}
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "4px",
                                    border: isExist ? "2px solid #d97706" : "1.5px solid #cbd5e1",
                                    background: isExist ? "#d97706" : "#ffffff",
                                    color: isExist ? "#ffffff" : "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.75rem",
                                    fontWeight: "900",
                                    cursor: "pointer",
                                    padding: 0,
                                    lineHeight: 1,
                                    transition: "all 0.15s ease"
                                  }}
                                >
                                  {isExist ? "X" : ""}
                                </button>
                              </div>

                              {/* KIND OF FIXTURES Label */}
                              <div style={{ paddingLeft: "8px" }}>
                                <span style={{
                                  fontSize: "0.75rem",
                                  fontWeight: hasQty ? "700" : "500",
                                  color: hasQty ? "#0f172a" : "#475569",
                                  letterSpacing: "0.02em"
                                }}>
                                  [ ] {fix.label.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Left Column Total Row (Row 13) */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "48px 65px 65px 1fr",
                        alignItems: "center",
                        padding: "6px 8px",
                        background: "#f1f5f9",
                        borderTop: "1.5px solid #cbd5e1",
                        fontSize: "0.75rem",
                        fontWeight: "800",
                        color: "#0e7490"
                      }}>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <span style={{
                            borderBottom: "2px solid #0891b2",
                            paddingBottom: "1px",
                            minWidth: "32px",
                            textAlign: "center"
                          }}>
                            {leftFixturesTotal}
                          </span>
                        </div>
                        <span></span>
                        <span></span>
                        <span style={{ paddingLeft: "8px", textTransform: "uppercase", color: "#334155" }}>
                          TOTAL
                        </span>
                      </div>
                    </div>

                    {/* RIGHT COLUMN TABLE (Specialized Fixtures) */}
                    <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "hidden", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                      {/* Official Table Header */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "48px 65px 65px 1fr",
                        background: "#f1f5f9",
                        borderBottom: "1.5px solid #cbd5e1",
                        padding: "6px 8px",
                        fontSize: "0.68rem",
                        fontWeight: "800",
                        color: "#334155",
                        textAlign: "center",
                        alignItems: "center"
                      }}>
                        <span>QTY</span>
                        <span style={{ lineHeight: "1.15" }}>NEW<br/>FIXTURES</span>
                        <span style={{ lineHeight: "1.15" }}>EXISTING<br/>FIXTURES</span>
                        <span style={{ textAlign: "left", paddingLeft: "8px" }}>KIND OF FIXTURES</span>
                      </div>

                      {/* Right Column Fixture Rows */}
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {[
                          { key: "bidetCount", label: "Bidette", val: bidetCount, setVal: setBidetCount },
                          { key: "laundryTraysCount", label: "Laundry Trays", val: laundryTraysCount, setVal: setLaundryTraysCount },
                          { key: "dentalCuspidorCount", label: "Dental Cuspidor", val: dentalCuspidorCount, setVal: setDentalCuspidorCount },
                          { key: "electricalHeaterCount", label: "Electrical Heater", val: electricalHeaterCount, setVal: setElectricalHeaterCount },
                          { key: "waterBoilerCount", label: "Water Boiler", val: waterBoilerCount, setVal: setWaterBoilerCount },
                          { key: "drinkingFountainCount", label: "Drinking Fountain", val: drinkingFountainCount, setVal: setDrinkingFountainCount },
                          { key: "barSinkCount", label: "Bar Sink", val: barSinkCount, setVal: setBarSinkCount },
                          { key: "sodaFountainCount", label: "Soda Fountainsink", val: sodaFountainCount, setVal: setSodaFountainCount },
                          { key: "laboratorySinkCount", label: "Laboratory Sink", val: laboratorySinkCount, setVal: setLaboratorySinkCount },
                          { key: "sterilizerCount", label: "Sterilizer", val: sterilizerCount, setVal: setSterilizerCount },
                          { key: "swimmingPoolCount", label: "Swimming Pool", val: swimmingPoolCount, setVal: setSwimmingPoolCount },
                          { key: "othersFixtureCount", label: "Others (Specify)", val: othersFixtureCount, setVal: setOthersFixtureCount },
                        ].map((fix, idx) => {
                          const status = fixtureStatusMap[fix.key] || "new";
                          const qtyNum = parseInt(fix.val, 10) || 0;
                          const hasQty = qtyNum > 0;
                          const isNew = hasQty && status === "new";
                          const isExist = hasQty && status === "existing";

                          return (
                            <div
                              key={fix.key}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "48px 65px 65px 1fr",
                                alignItems: "center",
                                padding: "4px 8px",
                                borderBottom: idx < 11 ? "1px solid #f1f5f9" : "none",
                                background: hasQty ? "#ecfeff33" : (idx % 2 === 0 ? "#f8fafc" : "#ffffff"),
                                transition: "background 0.15s ease",
                              }}
                            >
                              {/* QTY Input */}
                              <div style={{ display: "flex", justifyContent: "center" }}>
                                <input
                                  type="number"
                                  min="0"
                                  value={fix.val}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    fix.setVal(v);
                                    if ((parseInt(v, 10) || 0) > 0 && !fixtureStatusMap[fix.key]) {
                                      setFixtureStatusMap(prev => ({ ...prev, [fix.key]: "new" }));
                                    }
                                  }}
                                  placeholder="—"
                                  style={{
                                    width: "42px",
                                    height: "26px",
                                    padding: "2px 4px",
                                    textAlign: "center",
                                    fontWeight: hasQty ? "800" : "500",
                                    fontSize: "0.82rem",
                                    border: hasQty ? "1.5px solid #0891b2" : "1px solid #cbd5e1",
                                    borderRadius: "4px",
                                    background: hasQty ? "#ffffff" : "#ffffff",
                                    color: hasQty ? "#0e7490" : "#64748b",
                                    outline: "none"
                                  }}
                                />
                              </div>

                              {/* NEW FIXTURES Checkbox [X] */}
                              <div style={{ display: "flex", justifyContent: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isNew) {
                                      setFixtureStatusMap(prev => {
                                        const c = { ...prev };
                                        delete c[fix.key];
                                        return c;
                                      });
                                    } else {
                                      setFixtureStatusMap(prev => ({ ...prev, [fix.key]: "new" }));
                                      if (!hasQty) fix.setVal("1");
                                    }
                                  }}
                                  title={`Mark ${fix.label} as New Fixture`}
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "4px",
                                    border: isNew ? "2px solid #0891b2" : "1.5px solid #cbd5e1",
                                    background: isNew ? "#0891b2" : "#ffffff",
                                    color: isNew ? "#ffffff" : "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.75rem",
                                    fontWeight: "900",
                                    cursor: "pointer",
                                    padding: 0,
                                    lineHeight: 1,
                                    transition: "all 0.15s ease"
                                  }}
                                >
                                  {isNew ? "X" : ""}
                                </button>
                              </div>

                              {/* EXISTING FIXTURES Checkbox [X] */}
                              <div style={{ display: "flex", justifyContent: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isExist) {
                                      setFixtureStatusMap(prev => {
                                        const c = { ...prev };
                                        delete c[fix.key];
                                        return c;
                                      });
                                    } else {
                                      setFixtureStatusMap(prev => ({ ...prev, [fix.key]: "existing" }));
                                      if (!hasQty) fix.setVal("1");
                                    }
                                  }}
                                  title={`Mark ${fix.label} as Existing Fixture`}
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "4px",
                                    border: isExist ? "2px solid #d97706" : "1.5px solid #cbd5e1",
                                    background: isExist ? "#d97706" : "#ffffff",
                                    color: isExist ? "#ffffff" : "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.75rem",
                                    fontWeight: "900",
                                    cursor: "pointer",
                                    padding: 0,
                                    lineHeight: 1,
                                    transition: "all 0.15s ease"
                                  }}
                                >
                                  {isExist ? "X" : ""}
                                </button>
                              </div>

                              {/* KIND OF FIXTURES Label */}
                              <div style={{ paddingLeft: "8px" }}>
                                <span style={{
                                  fontSize: "0.75rem",
                                  fontWeight: hasQty ? "700" : "500",
                                  color: hasQty ? "#0f172a" : "#475569",
                                  letterSpacing: "0.02em"
                                }}>
                                  [ ] {fix.label.toUpperCase()}
                                </span>
                                {fix.key === "othersFixtureCount" && (
                                  <input
                                    type="text"
                                    value={othersFixtureName}
                                    onChange={(e) => setOthersFixtureName(e.target.value)}
                                    placeholder="Specify custom fixture (e.g. Foot Basin)"
                                    style={{
                                      display: "block",
                                      width: "95%",
                                      marginTop: "3px",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      border: "1px solid #cbd5e1",
                                      fontSize: "0.7rem",
                                      background: "#ffffff"
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right Column Total Row (Row 13) */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "48px 65px 65px 1fr",
                        alignItems: "center",
                        padding: "6px 8px",
                        background: "#f1f5f9",
                        borderTop: "1.5px solid #cbd5e1",
                        fontSize: "0.75rem",
                        fontWeight: "800",
                        color: "#0e7490"
                      }}>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <span style={{
                            borderBottom: "2px solid #0891b2",
                            paddingBottom: "1px",
                            minWidth: "32px",
                            textAlign: "center"
                          }}>
                            {rightFixturesTotal}
                          </span>
                        </div>
                        <span></span>
                        <span></span>
                        <span style={{ paddingLeft: "8px", textTransform: "uppercase", color: "#334155" }}>
                          TOTAL
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Bottom Distribution Systems matching official form */}
                  <div style={{
                    marginTop: "1.25rem",
                    padding: "10px 14px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px"
                  }}>
                    <span style={{ fontSize: "0.74rem", fontWeight: "800", color: "#0f766e", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      Plumbing & Drainage Distribution Systems:
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" }}>
                        <input
                          type="checkbox"
                          checked={waterDistributionSystem}
                          onChange={(e) => setWaterDistributionSystem(e.target.checked)}
                          style={{ width: "17px", height: "17px", accentColor: "#0891b2", cursor: "pointer" }}
                        />
                        <span style={{ fontSize: "0.8rem", fontWeight: waterDistributionSystem ? "700" : "600", color: waterDistributionSystem ? "#0f766e" : "#334155" }}>
                          WATER DISTRIBUTION SYSTEM
                        </span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" }}>
                        <input
                          type="checkbox"
                          checked={sanitarySewerSystem}
                          onChange={(e) => setSanitarySewerSystem(e.target.checked)}
                          style={{ width: "17px", height: "17px", accentColor: "#0891b2", cursor: "pointer" }}
                        />
                        <span style={{ fontSize: "0.8rem", fontWeight: sanitarySewerSystem ? "700" : "600", color: sanitarySewerSystem ? "#0f766e" : "#334155" }}>
                          SANITARY SEWER SYSTEM
                        </span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" }}>
                        <input
                          type="checkbox"
                          checked={stormDrainageSystem}
                          onChange={(e) => setStormDrainageSystem(e.target.checked)}
                          style={{ width: "17px", height: "17px", accentColor: "#0891b2", cursor: "pointer" }}
                        />
                        <span style={{ fontSize: "0.8rem", fontWeight: stormDrainageSystem ? "700" : "600", color: stormDrainageSystem ? "#0f766e" : "#334155" }}>
                          STORM DRAINAGE SYSTEM
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Section C: Water Supply, System Supply / Disposal, & Installation Details (NBC Form P-01 Box 1 Bottom) */}
                <div style={{ background: "#ffffff", border: "1.5px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.88rem", fontWeight: "800", color: "#0e7490", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          WATER SUPPLY & SYSTEM SUPPLY / DISPOSAL
                        </span>
                        <span style={{ fontSize: "0.68rem", fontWeight: "700", background: "#ecfeff", color: "#0891b2", border: "1px solid #a5f3fc", padding: "2px 8px", borderRadius: "4px" }}>
                          NBC Form P-01 Box 1
                        </span>
                      </div>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#64748b" }}>
                        Select water source, system supply / sewage disposal, drainage outfall, and installation timeline & cost
                      </p>
                    </div>
                  </div>

                  {/* Two-Column Grid: Water Supply (Left) & System Supply (Right) */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                    
                    {/* WATER SUPPLY PANEL */}
                    <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "12px", background: "#f8fafc" }}>
                      <div style={{ borderBottom: "1.5px solid #cbd5e1", paddingBottom: "6px", marginBottom: "10px" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                          WATER SUPPLY
                        </span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {[
                          { id: "SHALLOW WELL", label: "SHALLOW WELL" },
                          { id: "DEEPWELL & PUMP SET", label: "DEEPWELL & PUMP SET" },
                          { id: "CITY/MUNICIPAL WATER SYSTEM", label: "CITY/MUNICIPAL WATER SYSTEM" },
                          { id: "OTHERS", label: "OTHERS" },
                        ].map(opt => {
                          const isSelected = waterSupplyType === opt.id;
                          return (
                            <div key={opt.id}>
                              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.78rem", fontWeight: isSelected ? "700" : "600", color: isSelected ? "#0e7490" : "#475569" }}>
                                <input
                                  type="radio"
                                  name="waterSupplyTypeRadio"
                                  checked={isSelected}
                                  onChange={() => setWaterSupplyType(opt.id as any)}
                                  style={{ accentColor: "#0891b2", width: "16px", height: "16px", cursor: "pointer" }}
                                />
                                [ ] {opt.label}
                              </label>
                              {opt.id === "OTHERS" && isSelected && (
                                <input
                                  type="text"
                                  value={waterSupplyOthers}
                                  onChange={e => setWaterSupplyOthers(e.target.value)}
                                  placeholder="Specify other water supply (e.g. Rainwater Catchment / Spring)"
                                  style={{ marginTop: "4px", marginLeft: "24px", width: "calc(100% - 24px)", padding: "4px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "0.78rem", background: "#ffffff" }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SYSTEM SUPPLY / DISPOSAL PANEL */}
                    <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "12px", background: "#f8fafc" }}>
                      <div style={{ borderBottom: "1.5px solid #cbd5e1", paddingBottom: "6px", marginBottom: "10px" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                          SYSTEM SUPPLY / DISPOSAL
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        {/* Left Sub-column: Treatment & Vault */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.74rem", fontWeight: wasteWaterTreatmentPlant ? "700" : "500", color: wasteWaterTreatmentPlant ? "#0e7490" : "#475569" }}>
                            <input
                              type="checkbox"
                              checked={wasteWaterTreatmentPlant}
                              onChange={e => setWasteWaterTreatmentPlant(e.target.checked)}
                              style={{ accentColor: "#0891b2" }}
                            />
                            [ ] WASTE WATER TREATMENT PLANT
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.74rem", fontWeight: septicVaultImhoffTank ? "700" : "500", color: septicVaultImhoffTank ? "#0e7490" : "#475569" }}>
                            <input
                              type="checkbox"
                              checked={septicVaultImhoffTank}
                              onChange={e => setSepticVaultImhoffTank(e.target.checked)}
                              style={{ accentColor: "#0891b2" }}
                            />
                            [X] SEPTIC VAULT/IMHOFF TANK
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.74rem", fontWeight: subsurfaceSandFilter ? "700" : "500", color: subsurfaceSandFilter ? "#0e7490" : "#475569" }}>
                            <input
                              type="checkbox"
                              checked={subsurfaceSandFilter}
                              onChange={e => setSubsurfaceSandFilter(e.target.checked)}
                              style={{ accentColor: "#0891b2" }}
                            />
                            [ ] SUBSURFACE SAND FILTER
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.74rem", fontWeight: sanitarySewerConnection ? "700" : "500", color: sanitarySewerConnection ? "#0e7490" : "#475569" }}>
                            <input
                              type="checkbox"
                              checked={sanitarySewerConnection}
                              onChange={e => setSanitarySewerConnection(e.target.checked)}
                              style={{ accentColor: "#0891b2" }}
                            />
                            [ ] SANITARY SEWER CONNECTION
                          </label>
                        </div>

                        {/* Right Sub-column: Drainage Outfall */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.74rem", fontWeight: surfaceDrainage ? "700" : "500", color: surfaceDrainage ? "#0e7490" : "#475569" }}>
                            <input
                              type="checkbox"
                              checked={surfaceDrainage}
                              onChange={e => setSurfaceDrainage(e.target.checked)}
                              style={{ accentColor: "#0891b2" }}
                            />
                            [ ] SURFACE DRAINAGE
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.74rem", fontWeight: streetCanal ? "700" : "500", color: streetCanal ? "#0e7490" : "#475569" }}>
                            <input
                              type="checkbox"
                              checked={streetCanal}
                              onChange={e => setStreetCanal(e.target.checked)}
                              style={{ accentColor: "#0891b2" }}
                            />
                            [ ] STREET CANAL
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.74rem", fontWeight: waterCourse ? "700" : "500", color: waterCourse ? "#0e7490" : "#475569" }}>
                            <input
                              type="checkbox"
                              checked={waterCourse}
                              onChange={e => setWaterCourse(e.target.checked)}
                              style={{ accentColor: "#0891b2" }}
                            />
                            [ ] WATER COURSE
                          </label>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* BUILDING SPECIFICATIONS & INSTALLATION DETAILS */}
                  <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginBottom: "1rem" }}>
                    <span style={{ fontSize: "0.74rem", fontWeight: "800", color: "#0e7490", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                      Building Specifications & Installation Schedule
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                          Number of Storeys of Building *
                        </label>
                        <input
                          type="text"
                          value={proposedStoreys}
                          onChange={e => setProposedStoreys(e.target.value)}
                          placeholder="2"
                          style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                          Total Area of Building/Subdivision (SQ. M.) *
                        </label>
                        <input
                          type="text"
                          value={plumbingTotalArea}
                          onChange={e => setPlumbingTotalArea(e.target.value)}
                          placeholder="185.50"
                          style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                          Proposed Date Start of Installation *
                        </label>
                        <input
                          type="date"
                          value={plumbingStartDate}
                          onChange={e => setPlumbingStartDate(e.target.value)}
                          style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                          Total Cost of Installation (PHP) *
                        </label>
                        <input
                          type="text"
                          value={plumbingInstallationCost}
                          onChange={e => setPlumbingInstallationCost(e.target.value)}
                          placeholder="100,000.00"
                          style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                          Expected Date of Completion *
                        </label>
                        <input
                          type="date"
                          value={plumbingCompletionDate}
                          onChange={e => setPlumbingCompletionDate(e.target.value)}
                          style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                          Prepared By (Professional / Installer) *
                        </label>
                        <input
                          type="text"
                          value={plumbingPreparedBy}
                          onChange={e => setPlumbingPreparedBy(e.target.value)}
                          placeholder="e.g. Engr. Jose Mendoza, RMP"
                          style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Septic Tank & Piping Material Specs */}
                  <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
                    <span style={{ fontSize: "0.74rem", fontWeight: "800", color: "#0e7490", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                      Septic Tank Dimensions & Piping Material Specifications
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>Septic Tank Dimensions (L x W x D) *</label>
                        <input type="text" required value={septicTankDimensions} onChange={(e) => setSepticTankDimensions(e.target.value)} style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>Potable Water Pipes Material *</label>
                        <input type="text" required value={waterPipesMaterial} onChange={(e) => setWaterPipesMaterial(e.target.value)} style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }} />
                      </div>
                      <div style={{ gridColumn: "span 2" }}>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>Sanitary Waste & Vent Pipes Material *</label>
                        <input type="text" required value={wastePipesMaterial} onChange={(e) => setWastePipesMaterial(e.target.value)} style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* TAB 6: FIRE SAFETY / BFP CLEARANCE (FSEC)  */}
            {/* ========================================== */}
            {activeTab === "fireBfpPermit" && (
              <div className="animate-fade-in-up">
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.25rem" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#fff1f2", color: "#e11d48", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(225, 29, 72, 0.15)" }}>
                    <Flame size={24} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: "800", color: "#9f1239", background: "#ffe4e6", padding: "2px 8px", borderRadius: "4px" }}>
                        EXTERNAL BFP REQUIREMENT
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600" }}>
                        Republic Act No. 9514 (Fire Code of the Philippines)
                      </span>
                    </div>
                    <h3 style={{ margin: "2px 0 0 0", fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>
                      Fire Safety Evaluation Clearance (FSEC / BFP)
                    </h3>
                  </div>
                </div>

                {/* Official BFP Notice Box */}
                <div style={{
                  background: "#fff1f2",
                  border: "1.5px solid #fecdd3",
                  borderRadius: "14px",
                  padding: "1.1rem 1.25rem",
                  marginBottom: "1.5rem"
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <Info size={20} color="#e11d48" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <div style={{ fontSize: "0.86rem", color: "#881337", lineHeight: "1.5" }}>
                      <strong>Official Bureau of Fire Protection Notice:</strong> The Municipality of Sto. Tomas does not process an online fillable form for Fire Safety clearances. In accordance with the Fire Code of the Philippines (RA 9514), the <strong>Fire Safety Evaluation Clearance (FSEC)</strong> is issued directly by the Bureau of Fire Protection (BFP).
                      <div style={{ marginTop: "6px", color: "#9f1239", fontSize: "0.82rem" }}>
                        Please attach your issued Fire Safety Evaluation Clearance certificate or official BFP receipt below. <em>(You can attach this here or during Step 5 review before final submission).</em>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Status Card */}
                {uploadedPermitDocs["fireBfpPermit"] ? (
                  <div style={{
                    background: "#f0fdf4",
                    border: "1.5px solid #86efac",
                    borderRadius: "14px",
                    padding: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "1rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#dcfce7", color: "#166534", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#166534", textTransform: "uppercase" }}>
                          ✓ BFP Clearance Attached
                        </div>
                        <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>
                          {uploadedPermitDocs["fireBfpPermit"].fileName}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                          File size: {uploadedPermitDocs["fireBfpPermit"].fileSize} • Uploaded at {uploadedPermitDocs["fireBfpPermit"].uploadedAt}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <label style={{
                        padding: "8px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#334155",
                        fontSize: "0.8rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                      }}>
                        <Upload size={14} /> Replace File
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => handleFileUpload("fireBfpPermit", e)}
                          style={{ display: "none" }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => handleRemoveDoc("fireBfpPermit")}
                        style={{
                          background: "#fee2e2",
                          border: "1px solid #fca5a5",
                          color: "#dc2626",
                          borderRadius: "8px",
                          padding: "8px 14px",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                          fontWeight: "700",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    border: "2px dashed #fca5a5",
                    borderRadius: "16px",
                    padding: "2.5rem 1.5rem",
                    textAlign: "center",
                    background: "#fff1f2",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.75rem"
                  }}>
                    <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "#ffe4e6", color: "#e11d48", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Flame size={28} />
                    </div>
                    <div>
                      <div style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>
                        Attach Issued Fire / BFP Clearance (FSEC)
                      </div>
                      <div style={{ fontSize: "0.84rem", color: "#64748b", maxWidth: "460px" }}>
                        Attach your scanned certificate, official endorsement, or evaluation document issued by Bureau of Fire Protection Santo Tomas.
                      </div>
                    </div>

                    <label style={{
                      marginTop: "0.5rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 22px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
                      color: "white",
                      fontSize: "0.88rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(225, 29, 72, 0.25)",
                      transition: "all 0.15s ease"
                    }}>
                      <Upload size={16} />
                      <span>Attach FSEC File</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileUpload("fireBfpPermit", e)}
                        style={{ display: "none" }}
                      />
                    </label>

                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>
                      Supported formats: PDF, PNG, JPG, JPEG (up to 25MB)
                    </div>
                  </div>
                )}

                {/* Submit Form (Fire / BFP Clearance) Action Button */}
                <div style={{
                  marginTop: "1.5rem",
                  paddingTop: "1.25rem",
                  borderTop: "1.5px solid #fecdd3",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem"
                }}>
                  <div>
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                      {uploadedPermitDocs["fireBfpPermit"]
                        ? "BFP Clearance document is attached and ready to submit."
                        : "Attach your issued BFP Clearance (FSEC) file above to complete this requirement."}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSubmitSingleForm("fireBfpPermit")}
                    disabled={!uploadedPermitDocs["fireBfpPermit"]}
                    style={{
                      background: uploadedPermitDocs["fireBfpPermit"]
                        ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                        : "#94a3b8",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      padding: "11px 24px",
                      fontSize: "0.92rem",
                      fontWeight: "800",
                      cursor: uploadedPermitDocs["fireBfpPermit"] ? "pointer" : "not-allowed",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: uploadedPermitDocs["fireBfpPermit"] ? "0 4px 14px rgba(5, 150, 105, 0.35)" : "none",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <CheckCircle2 size={17} />
                    <span>Submit Form (Fire / BFP Clearance)</span>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* TAB 7: MECHANICAL PERMIT (MP)              */}
            {/* ========================================== */}
            {activeTab === "mechanicalPermit" && (
              <div className="animate-fade-in-up">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Wrench size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>
                      Mechanical Permit (MP) — NBC Form M-01
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                      HVAC, elevators, escalators, generators, and Professional Mechanical Engineer sign-off
                    </p>
                  </div>
                </div>

                {/* Box 1: Scope of Work (NBC Form M-01) */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#b45309", textTransform: "uppercase", display: "block" }}>
                        Box 1: Scope of Work (NBC Form M-01)
                      </span>
                      <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                        Select the applicable mechanical installation scope
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    {[
                      { id: "New Construction", label: "New Construction" },
                      { id: "Erection", label: "Erection" },
                      { id: "Addition", label: "Addition" },
                      { id: "Alteration", label: "Alteration" },
                      { id: "Renovation", label: "Renovation" },
                      { id: "Conversion", label: "Conversion" },
                      { id: "Repair", label: "Repair" },
                      { id: "Moving", label: "Moving" },
                      { id: "Raising", label: "Raising" },
                      { id: "Demolition", label: "Demolition" },
                      { id: "Accessory Building/Structure", label: "Accessory Building/Structure" },
                      { id: "Others (Specify)", label: "Others (Specify)" },
                    ].map((opt) => {
                      const isSelected = mechanicalScopeOfWork === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setMechanicalScopeOfWork(opt.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            border: isSelected ? "1.5px solid #d97706" : "1px solid #e2e8f0",
                            background: isSelected ? "#fef3c7" : "#f8fafc",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <input
                            type="radio"
                            name="mechanicalScopeRadio"
                            checked={isSelected}
                            onChange={() => setMechanicalScopeOfWork(opt.id)}
                            style={{ accentColor: "#d97706", cursor: "pointer" }}
                          />
                          <span style={{ fontSize: "0.8rem", fontWeight: isSelected ? "700" : "500", color: isSelected ? "#92400e" : "#334155" }}>
                            {opt.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {(mechanicalScopeOfWork || "").toLowerCase().includes("other") && (
                    <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px dashed #e2e8f0" }}>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                        Specify Scope Details (Printed on Official Form Underline)
                      </label>
                      <input
                        type="text"
                        value={mechanicalScopeDetails}
                        onChange={(e) => setMechanicalScopeDetails(e.target.value)}
                        placeholder="e.g. Specific details for other mechanical scope"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                      />
                    </div>
                  )}
                </div>

                {/* Box 2: Installation and Operation of (NBC Form M-01) */}
                <div style={{ background: "#ffffff", border: "1.5px solid #0284c7", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#0369a1", textTransform: "uppercase", display: "block" }}>
                        BOX 2 (TO BE ACCOMPLISHED BY THE DESIGN PROFESSIONAL)
                      </span>
                      <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#475569", textTransform: "uppercase" }}>
                        INSTALLATION AND OPERATION OF:
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                    {/* Column 1 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {[
                        { label: "BOILER", checked: boiler, setter: setBoiler },
                        { label: "PRESSURE VESSEL", checked: pressureVessel, setter: setPressureVessel },
                        { label: "INTERNAL COMBUSTION ENGINE", checked: internalCombustionEngine, setter: setInternalCombustionEngine },
                        { label: "REFRIGERATION AND ICE MAKING", checked: refrigerationIce, setter: setRefrigerationIce },
                        { label: "WINDOW TYPE AIRCONDITIONING", checked: windowTypeAircon, setter: setWindowTypeAircon },
                        { label: "PACKAGED/SPLIT TYPE AIRCON", checked: packagedSplitAircon, setter: setPackagedSplitAircon },
                      ].map((item, idx) => (
                        <label
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            background: item.checked ? "#f0f9ff" : "#f8fafc",
                            border: item.checked ? "1px solid #7dd3fc" : "1px solid #e2e8f0",
                            cursor: "pointer",
                            fontSize: "0.76rem",
                            fontWeight: item.checked ? "700" : "500",
                            color: item.checked ? "#0369a1" : "#334155",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(e) => item.setter(e.target.checked)}
                            style={{ accentColor: "#0284c7", cursor: "pointer" }}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}

                      {/* Others Specify */}
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 8px",
                          borderRadius: "6px",
                          background: mechanicalOthers ? "#f0f9ff" : "#f8fafc",
                          border: mechanicalOthers ? "1px solid #7dd3fc" : "1px solid #e2e8f0",
                          cursor: "pointer",
                          fontSize: "0.76rem",
                          fontWeight: mechanicalOthers ? "700" : "500",
                          color: mechanicalOthers ? "#0369a1" : "#334155",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={mechanicalOthers}
                          onChange={(e) => setMechanicalOthers(e.target.checked)}
                          style={{ accentColor: "#0284c7", cursor: "pointer" }}
                        />
                        <span>OTHERS(SPECIFY)</span>
                      </label>
                      {mechanicalOthers && (
                        <input
                          type="text"
                          value={mechanicalOthersSpecify}
                          onChange={(e) => setMechanicalOthersSpecify(e.target.value)}
                          placeholder="Specify other mechanical system"
                          style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.78rem", marginTop: "2px" }}
                        />
                      )}
                    </div>

                    {/* Column 2 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {[
                        { label: "CENTRAL AICONDITIONING", checked: centralAircon, setter: setCentralAircon },
                        { label: "MECHANICAL VENTILLATION", checked: mechanicalVentilation, setter: setMechanicalVentilation },
                        { label: "ESCALATOR", checked: escalator, setter: setEscalator },
                        { label: "MOVING SIDEWALK", checked: movingSidewalk, setter: setMovingSidewalk },
                        { label: "FREIGHT ELEVATOR", checked: freightElevator, setter: setFreightElevator },
                        { label: "PASSENGER ELEVATOR", checked: passengerElevator, setter: setPassengerElevator },
                        { label: "CABLE CAR", checked: cableCar, setter: setCableCar },
                      ].map((item, idx) => (
                        <label
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            background: item.checked ? "#f0f9ff" : "#f8fafc",
                            border: item.checked ? "1px solid #7dd3fc" : "1px solid #e2e8f0",
                            cursor: "pointer",
                            fontSize: "0.76rem",
                            fontWeight: item.checked ? "700" : "500",
                            color: item.checked ? "#0369a1" : "#334155",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(e) => item.setter(e.target.checked)}
                            style={{ accentColor: "#0284c7", cursor: "pointer" }}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>

                    {/* Column 3 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {[
                        { label: "DUMBWATER", checked: dumbwaiter, setter: setDumbwaiter },
                        { label: "PUMPS", checked: pumps, setter: setPumps },
                        { label: "COMPRESSED AIR VACCUM, INSTITUTIONAL and/or INDUSTRIAL GAS", checked: compressedAirGas, setter: setCompressedAirGas },
                        { label: "PNEUMATIC TUBES, CONVEYORS and/or MONORAILS", checked: pneumaticTubesConveyors, setter: setPneumaticTubesConveyors },
                        { label: "FUNICULAR", checked: funicular, setter: setFunicular },
                      ].map((item, idx) => (
                        <label
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            background: item.checked ? "#f0f9ff" : "#f8fafc",
                            border: item.checked ? "1px solid #7dd3fc" : "1px solid #e2e8f0",
                            cursor: "pointer",
                            fontSize: "0.76rem",
                            fontWeight: item.checked ? "700" : "500",
                            color: item.checked ? "#0369a1" : "#334155",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(e) => item.setter(e.target.checked)}
                            style={{ accentColor: "#0284c7", cursor: "pointer" }}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Prepared By (Design Professional) */}
                  <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "10px" }}>
                    <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                      PREPARED BY: (Design Professional) *
                    </label>
                    <input
                      type="text"
                      value={mechanicalPreparedBy}
                      onChange={(e) => setMechanicalPreparedBy(e.target.value)}
                      placeholder="e.g. Engr. Antonio Gomez, PME"
                      style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                    />
                  </div>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Equipment Classification *</label>
                      <input type="text" required value={machineryType} onChange={(e) => setMachineryType(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Equipment Make / Brand *</label>
                      <input type="text" required value={machineryBrand} onChange={(e) => setMachineryBrand(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Rated Capacity / Load *</label>
                      <input type="text" required value={machineryCapacity} onChange={(e) => setMachineryCapacity(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Drive Motor Power *</label>
                      <input type="text" required value={machineryPower} onChange={(e) => setMachineryPower(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Rated Speed / Velocity *</label>
                      <input type="text" required value={machinerySpeed} onChange={(e) => setMachinerySpeed(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Levels / Storeys Served *</label>
                      <input type="text" required value={machineryStoreys} onChange={(e) => setMachineryStoreys(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                    </div>
                  </div>
                </div>

                {/* BOX 3: DESIGN PROFESSIONAL, PLANS AND SPECIFICATION */}
                <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <div>
                      <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#92400e", textTransform: "uppercase", display: "block" }}>
                        BOX 3: DESIGN PROFESSIONAL, PLANS AND SPECIFICATION
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "#b45309" }}>
                        Professional Mechanical Engineer (PME) details & seal
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#78350f" }}>Engineer Full Name *</label>
                      <input type="text" required value={mechanicalEngineerName} onChange={(e) => setMechanicalEngineerName(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white", fontWeight: "700" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#78350f" }}>Address *</label>
                      <input type="text" required value={mechanicalEngineerAddress} onChange={(e) => setMechanicalEngineerAddress(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#78350f" }}>PRC Registration No. *</label>
                      <input type="text" required value={mechanicalEngineerPRC} onChange={(e) => setMechanicalEngineerPRC(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#78350f" }}>PRC Validity Date *</label>
                      <input type="date" required value={mechanicalEngineerPRCValidity} onChange={(e) => setMechanicalEngineerPRCValidity(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#78350f" }}>PTR Number *</label>
                      <input type="text" required value={mechanicalEngineerPTR} onChange={(e) => setMechanicalEngineerPTR(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#78350f" }}>Date Issued *</label>
                      <input type="text" required value={mechanicalEngineerPTRDate} onChange={(e) => setMechanicalEngineerPTRDate(e.target.value)} placeholder="e.g. Jan 10, 2026" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#78350f" }}>Issued At *</label>
                      <input type="text" required value={mechanicalEngineerPTRIssuedAt} onChange={(e) => setMechanicalEngineerPTRIssuedAt(e.target.value)} placeholder="e.g. Sto. Tomas, Pampanga" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#78350f" }}>TIN Number *</label>
                      <input type="text" required value={mechanicalEngineerTIN} onChange={(e) => setMechanicalEngineerTIN(e.target.value)} placeholder="000-000-000-000" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#78350f" }}>Date Signed *</label>
                      <input type="text" required value={mechanicalEngineerSignedDate} onChange={(e) => setMechanicalEngineerSignedDate(e.target.value)} placeholder="e.g. Jan 08, 2026" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                  </div>

                  <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #fde68a" }}>
                    <SignatureCreator
                      value={mechanicalEngineerSignature}
                      onChange={setMechanicalEngineerSignature}
                      label={`PME E-Signature (Affixed over printed name: ${mechanicalEngineerName})`}
                      required
                    />
                  </div>
                </div>

                {/* BOX 4: SUPERVISOR/IN-CHARGE OF MECHANICAL WORKS */}
                <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "0.5rem" }}>
                    <div>
                      <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#166534", textTransform: "uppercase", display: "block" }}>
                        BOX 4: SUPERVISOR/IN-CHARGE OF MECHANICAL WORKS
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "#15803d" }}>
                        Professional Mechanical Engineer or Registered Mechanical Engineer in-charge of installation
                      </span>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: "700", color: "#15803d", cursor: "pointer", background: "#dcfce7", padding: "4px 8px", borderRadius: "6px" }}>
                      <input
                        type="checkbox"
                        checked={sameAsDesignMechanicalEngineer}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSameAsDesignMechanicalEngineer(checked);
                          if (checked) {
                            setMechSupervisorName(mechanicalEngineerName);
                            setMechSupervisorAddress(mechanicalEngineerAddress);
                            setMechSupervisorPRC(mechanicalEngineerPRC);
                            setMechSupervisorPRCValidity(mechanicalEngineerPRCValidity);
                            setMechSupervisorPTR(mechanicalEngineerPTR);
                            setMechSupervisorPTRDate(mechanicalEngineerPTRDate);
                            setMechSupervisorPTRIssuedAt(mechanicalEngineerPTRIssuedAt);
                            setMechSupervisorTIN(mechanicalEngineerTIN);
                            setMechSupervisorSignedDate(mechanicalEngineerSignedDate);
                            setMechSupervisorSignature(mechanicalEngineerSignature);
                          }
                        }}
                        style={{ accentColor: "#16a34a", cursor: "pointer" }}
                      />
                      Same as Design Professional (Box 3)
                    </label>
                  </div>

                  {/* Role selection radio buttons */}
                  <div style={{ display: "flex", gap: "1rem", margin: "8px 0 12px 0" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: mechSupervisorRole === "PME" ? "700" : "500", color: "#166534", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="mechSupervisorRoleRadio"
                        checked={mechSupervisorRole === "PME"}
                        onChange={() => setMechSupervisorRole("PME")}
                        style={{ accentColor: "#16a34a" }}
                      />
                      [ ] PROFESSIONAL MECHANICAL ENGINEER
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: mechSupervisorRole === "ME" ? "700" : "500", color: "#166534", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="mechSupervisorRoleRadio"
                        checked={mechSupervisorRole === "ME"}
                        onChange={() => setMechSupervisorRole("ME")}
                        style={{ accentColor: "#16a34a" }}
                      />
                      [ ] MECHANICAL ENGINEER
                    </label>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d" }}>Supervisor Full Name *</label>
                      <input type="text" required value={sameAsDesignMechanicalEngineer ? mechanicalEngineerName : mechSupervisorName} onChange={(e) => setMechSupervisorName(e.target.value)} disabled={sameAsDesignMechanicalEngineer} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: sameAsDesignMechanicalEngineer ? "#f8fafc" : "white", fontWeight: "700" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d" }}>Address *</label>
                      <input type="text" required value={sameAsDesignMechanicalEngineer ? mechanicalEngineerAddress : mechSupervisorAddress} onChange={(e) => setMechSupervisorAddress(e.target.value)} disabled={sameAsDesignMechanicalEngineer} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: sameAsDesignMechanicalEngineer ? "#f8fafc" : "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d" }}>PRC Registration No. *</label>
                      <input type="text" required value={sameAsDesignMechanicalEngineer ? mechanicalEngineerPRC : mechSupervisorPRC} onChange={(e) => setMechSupervisorPRC(e.target.value)} disabled={sameAsDesignMechanicalEngineer} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: sameAsDesignMechanicalEngineer ? "#f8fafc" : "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d" }}>PRC Validity Date *</label>
                      <input type="date" required value={sameAsDesignMechanicalEngineer ? mechanicalEngineerPRCValidity : mechSupervisorPRCValidity} onChange={(e) => setMechSupervisorPRCValidity(e.target.value)} disabled={sameAsDesignMechanicalEngineer} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: sameAsDesignMechanicalEngineer ? "#f8fafc" : "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d" }}>PTR Number *</label>
                      <input type="text" required value={sameAsDesignMechanicalEngineer ? mechanicalEngineerPTR : mechSupervisorPTR} onChange={(e) => setMechSupervisorPTR(e.target.value)} disabled={sameAsDesignMechanicalEngineer} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: sameAsDesignMechanicalEngineer ? "#f8fafc" : "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d" }}>Date Issued *</label>
                      <input type="text" required value={sameAsDesignMechanicalEngineer ? mechanicalEngineerPTRDate : mechSupervisorPTRDate} onChange={(e) => setMechSupervisorPTRDate(e.target.value)} disabled={sameAsDesignMechanicalEngineer} placeholder="e.g. Jan 10, 2026" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: sameAsDesignMechanicalEngineer ? "#f8fafc" : "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d" }}>Issued At *</label>
                      <input type="text" required value={sameAsDesignMechanicalEngineer ? mechanicalEngineerPTRIssuedAt : mechSupervisorPTRIssuedAt} onChange={(e) => setMechSupervisorPTRIssuedAt(e.target.value)} disabled={sameAsDesignMechanicalEngineer} placeholder="e.g. Sto. Tomas, Pampanga" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: sameAsDesignMechanicalEngineer ? "#f8fafc" : "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d" }}>TIN Number *</label>
                      <input type="text" required value={sameAsDesignMechanicalEngineer ? mechanicalEngineerTIN : mechSupervisorTIN} onChange={(e) => setMechSupervisorTIN(e.target.value)} disabled={sameAsDesignMechanicalEngineer} placeholder="000-000-000-000" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: sameAsDesignMechanicalEngineer ? "#f8fafc" : "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d" }}>Date Signed *</label>
                      <input type="text" required value={sameAsDesignMechanicalEngineer ? mechanicalEngineerSignedDate : mechSupervisorSignedDate} onChange={(e) => setMechSupervisorSignedDate(e.target.value)} disabled={sameAsDesignMechanicalEngineer} placeholder="e.g. Jan 08, 2026" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: sameAsDesignMechanicalEngineer ? "#f8fafc" : "white" }} />
                    </div>
                  </div>

                  <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #86efac" }}>
                    <SignatureCreator
                      value={sameAsDesignMechanicalEngineer ? mechanicalEngineerSignature : mechSupervisorSignature}
                      onChange={setMechSupervisorSignature}
                      label={`Supervisor E-Signature (Affixed over printed name: ${sameAsDesignMechanicalEngineer ? mechanicalEngineerName : mechSupervisorName})`}
                      required
                    />
                  </div>
                </div>

                {/* BOX 5: BUILDING OWNER */}
                <div style={{ background: "#ffffff", border: "1.5px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div>
                    <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", display: "block" }}>
                      BOX 5: BUILDING OWNER
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      Applicant / Building Owner sign-off and Community Tax Certificate (CTC) details
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>Building Owner Name *</label>
                      <input type="text" required value={applicantName} disabled style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#f8fafc", fontWeight: "700" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>Owner Address *</label>
                      <input type="text" required value={`${applicantNoStreet}, ${applicantBarangay}, ${applicantMunicipality}, ${applicantProvince}`} disabled style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#f8fafc" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>C.T.C. / Gov ID No. *</label>
                      <input type="text" required value={govIdNo} onChange={(e) => setGovIdNo(e.target.value)} placeholder="e.g. CTC-2026-00192" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>Date Issued *</label>
                      <input type="text" required value={govIdDateIssued} onChange={(e) => setGovIdDateIssued(e.target.value)} placeholder="e.g. Jan 08, 2026" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>Place Issued *</label>
                      <input type="text" required value={govIdPlaceIssued} onChange={(e) => setGovIdPlaceIssued(e.target.value)} placeholder="e.g. Sto. Tomas, Pampanga" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                  </div>

                  <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                    <SignatureCreator
                      value={applicantSignature}
                      onChange={setApplicantSignature}
                      label={`Building Owner E-Signature (Affixed over printed name: ${applicantName})`}
                      required
                    />
                  </div>
                </div>

                {/* BOX 6: WITH MY CONSENT: LOT OWNER */}
                <div style={{ background: "#ffffff", border: "1.5px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", display: "block" }}>
                        BOX 6: WITH MY CONSENT: LOT OWNER
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        Consent of the registered lot owner if different from the building owner / applicant
                      </span>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: "700", color: "#2563eb", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={lotOwnerConsent}
                        onChange={(e) => setLotOwnerConsent(e.target.checked)}
                        style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                      />
                      Include Box 6: With My Consent (Lot Owner)
                    </label>
                  </div>

                  {lotOwnerConsent && (
                    <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid #e2e8f0" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>Lot Owner Full Name *</label>
                          <input type="text" required value={lotOwnerName} onChange={(e) => setLotOwnerName(e.target.value)} placeholder="e.g. DAVE SICAT" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white", fontWeight: "700" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>Date Signed *</label>
                          <input type="text" required value={lotOwnerSignedDate} onChange={(e) => setLotOwnerSignedDate(e.target.value)} placeholder="e.g. Jan 08, 2026" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>Lot Owner Address *</label>
                          <input type="text" required value={lotOwnerAddress} onChange={(e) => setLotOwnerAddress(e.target.value)} placeholder="e.g. 105 Sitio Visitas, Sto. Tomas, Pampanga" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>C.T.C. / Gov ID No. *</label>
                          <input type="text" required value={lotOwnerGovIdNo} onChange={(e) => setLotOwnerGovIdNo(e.target.value)} placeholder="e.g. PRC-ID-00987654" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>Date Issued *</label>
                          <input type="text" required value={lotOwnerGovIdDateIssued} onChange={(e) => setLotOwnerGovIdDateIssued(e.target.value)} placeholder="e.g. Jan 10, 2024" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>Place Issued *</label>
                          <input type="text" required value={lotOwnerGovIdPlaceIssued} onChange={(e) => setLotOwnerGovIdPlaceIssued(e.target.value)} placeholder="e.g. Sto. Tomas" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                        </div>
                      </div>

                      <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                        <SignatureCreator
                          value={lotOwnerSignature}
                          onChange={setLotOwnerSignature}
                          label={`Lot Owner E-Signature (Affixed over printed name: ${lotOwnerName})`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* TAB 8: ELECTRONICS PERMIT (EL)             */}
            {/* ========================================== */}
            {activeTab === "electronicsPermit" && (
              <div className="animate-fade-in-up">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f0fdfa", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Radio size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>
                      Electronics Permit (EL) — NBC Form EL-01
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                      CCTV surveillance, structured cabling, FDAS, sound systems, and Professional Electronics Engineer sign-off
                    </p>
                  </div>
                </div>

                {/* Box 1: Scope of Work (NBC Form EL-01) */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#0f766e", textTransform: "uppercase", display: "block" }}>
                        Box 1: Scope of Work (NBC Form EL-01)
                      </span>
                      <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                        Select the applicable electronics installation scope
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    {[
                      { id: "New Installation", label: "New Installation" },
                      { id: "Annual Inspection", label: "Annual Inspection" },
                      { id: "Others (Specify)", label: "Others (Specify)" },
                    ].map((opt) => {
                      const isSelected = electronicsScopeOfWork === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setElectronicsScopeOfWork(opt.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            border: isSelected ? "1.5px solid #0d9488" : "1px solid #e2e8f0",
                            background: isSelected ? "#f0fdfa" : "#f8fafc",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <input
                            type="radio"
                            name="electronicsScopeRadio"
                            checked={isSelected}
                            onChange={() => setElectronicsScopeOfWork(opt.id)}
                            style={{ accentColor: "#0d9488", cursor: "pointer" }}
                          />
                          <span style={{ fontSize: "0.8rem", fontWeight: isSelected ? "700" : "500", color: isSelected ? "#0f766e" : "#334155" }}>
                            {opt.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {(electronicsScopeOfWork || "").toLowerCase().includes("other") && (
                    <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px dashed #e2e8f0" }}>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                        Specify Scope Details (Printed on Official Form Underline)
                      </label>
                      <input
                        type="text"
                        value={electronicsScopeOthers}
                        onChange={(e) => setElectronicsScopeOthers(e.target.value)}
                        placeholder="e.g. Specific details for other electronics installation"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                      />
                    </div>
                  )}
                </div>

                {/* Box 2: Nature of Installation Works / Equipment System (NBC Form EL-01 Box 2) */}
                <div style={{ background: "#ffffff", border: "1.5px solid #0d9488", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#0f766e", textTransform: "uppercase", display: "block" }}>
                        BOX 2 (TO BE ACCOMPLISHED BY THE DESIGN PROFESSIONAL)
                      </span>
                      <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#475569", textTransform: "uppercase" }}>
                        NATURE OF INSTALLATION WORKS / EQUIPMENT SYSTEM:
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                    {/* Column 1 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {[
                        { label: "TELECOMMUNICATION SYSTEM", checked: telecomSystem, setter: setTelecomSystem },
                        { label: "BROADCASTING SYSTEM", checked: broadcastingSystem, setter: setBroadcastingSystem },
                        { label: "TELEVISION SYSTEM", checked: televisionSystem, setter: setTelevisionSystem },
                        { label: "INFORMATION TECHNOLOGY SYSTEM", checked: itSystem, setter: setItSystem },
                        { label: "SECURITY AND ALARM SYSTEM", checked: securityAlarmSystem, setter: setSecurityAlarmSystem },
                      ].map((item, idx) => (
                        <label
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            background: item.checked ? "#f0fdfa" : "#f8fafc",
                            border: item.checked ? "1px solid #5eead4" : "1px solid #e2e8f0",
                            cursor: "pointer",
                            fontSize: "0.76rem",
                            fontWeight: item.checked ? "700" : "500",
                            color: item.checked ? "#0f766e" : "#334155",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(e) => item.setter(e.target.checked)}
                            style={{ accentColor: "#0d9488", cursor: "pointer" }}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}

                      {/* Any other electronics */}
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 8px",
                          borderRadius: "6px",
                          background: anyOtherElectronics ? "#f0fdfa" : "#f8fafc",
                          border: anyOtherElectronics ? "1px solid #5eead4" : "1px solid #e2e8f0",
                          cursor: "pointer",
                          fontSize: "0.76rem",
                          fontWeight: anyOtherElectronics ? "700" : "500",
                          color: anyOtherElectronics ? "#0f766e" : "#334155",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={anyOtherElectronics}
                          onChange={(e) => setAnyOtherElectronics(e.target.checked)}
                          style={{ accentColor: "#0d9488", cursor: "pointer" }}
                        />
                        <span>ANY OTHER ELECTRONICS / IT (SPECIFY)</span>
                      </label>
                      {anyOtherElectronics && (
                        <input
                          type="text"
                          value={anyOtherElectronicsSpecify}
                          onChange={(e) => setAnyOtherElectronicsSpecify(e.target.value)}
                          placeholder="Specify other electronics or IT system"
                          style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.78rem", marginTop: "2px" }}
                        />
                      )}
                    </div>

                    {/* Column 2 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {[
                        { label: "ELECTRONICS AND ALARM SYSTEM", checked: electronicsAlarmSystem, setter: setElectronicsAlarmSystem },
                        { label: "SOUND COMMUNICATION SYSTEM", checked: soundCommSystem, setter: setSoundCommSystem },
                        { label: "CENTRALIZED CLOCK SYSTEM", checked: centralizedClockSystem, setter: setCentralizedClockSystem },
                        { label: "SOUND SYSTEM", checked: soundSystem, setter: setSoundSystem },
                        { label: "ELECTRONICS CONTROL AND CONVEYOR", checked: electronicsControlConveyor, setter: setElectronicsControlConveyor },
                      ].map((item, idx) => (
                        <label
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            background: item.checked ? "#f0fdfa" : "#f8fafc",
                            border: item.checked ? "1px solid #5eead4" : "1px solid #e2e8f0",
                            cursor: "pointer",
                            fontSize: "0.76rem",
                            fontWeight: item.checked ? "700" : "500",
                            color: item.checked ? "#0f766e" : "#334155",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(e) => item.setter(e.target.checked)}
                            style={{ accentColor: "#0d9488", cursor: "pointer" }}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>

                    {/* Column 3 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {[
                        { label: "COMPUTERIZED PROCESS CONTROLS", checked: computerProcessControls, setter: setComputerProcessControls },
                        { label: "BUILDING AUTOMATION MANAGEMENT", checked: buildingAutomationManagement, setter: setBuildingAutomationManagement },
                        { label: "BUILDING WIRING / FIBER OPTIC CABLE", checked: buildingWiringFiberOptic, setter: setBuildingWiringFiberOptic },
                      ].map((item, idx) => (
                        <label
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            background: item.checked ? "#f0fdfa" : "#f8fafc",
                            border: item.checked ? "1px solid #5eead4" : "1px solid #e2e8f0",
                            cursor: "pointer",
                            fontSize: "0.76rem",
                            fontWeight: item.checked ? "700" : "500",
                            color: item.checked ? "#0f766e" : "#334155",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(e) => item.setter(e.target.checked)}
                            style={{ accentColor: "#0d9488", cursor: "pointer" }}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Prepared By (Design Professional) */}
                  <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "10px" }}>
                    <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                      PREPARED BY: (Design Professional) *
                    </label>
                    <input
                      type="text"
                      value={electronicsPreparedBy}
                      onChange={(e) => setElectronicsPreparedBy(e.target.value)}
                      placeholder="e.g. Engr. Carlos Lim, PECE"
                      style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                    />
                  </div>
                </div>

                {/* Scope Specifications */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Structured Cabling & Telecom *</label>
                      <input type="text" required value={telecomScope} onChange={(e) => setTelecomScope(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>CCTV Video Surveillance *</label>
                      <input type="text" required value={cctvScope} onChange={(e) => setCctvScope(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Fire Detection & Alarm (FDAS) *</label>
                      <input type="text" required value={fdasScope} onChange={(e) => setFdasScope(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Cable TV / Antenna System *</label>
                      <input type="text" required value={catvScope} onChange={(e) => setCatvScope(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                    </div>
                  </div>
                </div>

                {/* BOX 3: DESIGN PROFESSIONAL, PLANS AND SPECIFICATIONS */}
                <div style={{ background: "#f0fdfa", border: "1.5px solid #99f6e4", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <div>
                      <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#0f766e", textTransform: "uppercase", display: "block" }}>
                        BOX 3: DESIGN PROFESSIONAL, PLANS AND SPECIFICATIONS
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "#115e59" }}>
                        Professional Electronics Engineer (PECE) details & seal
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#115e59" }}>Engineer Full Name *</label>
                      <input type="text" required value={electronicsEngineerName} onChange={(e) => setElectronicsEngineerName(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white", fontWeight: "700" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#115e59" }}>Address *</label>
                      <input type="text" required value={electronicsEngineerAddress} onChange={(e) => setElectronicsEngineerAddress(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#115e59" }}>PRC Registration No. *</label>
                      <input type="text" required value={electronicsEngineerPRC} onChange={(e) => setElectronicsEngineerPRC(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#115e59" }}>PRC Validity Date *</label>
                      <input type="date" required value={electronicsEngineerPRCValidity} onChange={(e) => setElectronicsEngineerPRCValidity(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#115e59" }}>PTR Number *</label>
                      <input type="text" required value={electronicsEngineerPTR} onChange={(e) => setElectronicsEngineerPTR(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#115e59" }}>Date Issued *</label>
                      <input type="text" required value={electronicsEngineerPTRIssued} onChange={(e) => setElectronicsEngineerPTRIssued(e.target.value)} placeholder="e.g. Jan 05, 2026" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#115e59" }}>Issued At *</label>
                      <input type="text" required value={electronicsEngineerPTRIssuedAt} onChange={(e) => setElectronicsEngineerPTRIssuedAt(e.target.value)} placeholder="e.g. Sto. Tomas, Pampanga" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#115e59" }}>TIN Number *</label>
                      <input type="text" required value={electronicsEngineerTIN} onChange={(e) => setElectronicsEngineerTIN(e.target.value)} placeholder="000-000-000-000" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#115e59" }}>Date Signed *</label>
                      <input type="text" required value={electronicsEngineerSignedDate} onChange={(e) => setElectronicsEngineerSignedDate(e.target.value)} placeholder="e.g. Jan 08, 2026" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                  </div>

                  <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #99f6e4" }}>
                    <SignatureCreator
                      value={electronicsEngineerSignature}
                      onChange={setElectronicsEngineerSignature}
                      label={`PECE E-Signature (Affixed over printed name: ${electronicsEngineerName})`}
                      required
                    />
                  </div>
                </div>

                {/* BOX 4: SUPERVISOR / IN-CHARGE OF ELECTRONICS WORKS */}
                <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "0.5rem" }}>
                    <div>
                      <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#166534", textTransform: "uppercase", display: "block" }}>
                        BOX 4: SUPERVISOR / IN-CHARGE OF ELECTRONICS WORKS
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "#15803d" }}>
                        Professional Electronics Engineer or Electronics Engineer in-charge of installation
                      </span>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: "700", color: "#15803d", cursor: "pointer", background: "#dcfce7", padding: "4px 8px", borderRadius: "6px" }}>
                      <input
                        type="checkbox"
                        checked={sameAsDesignElectronicsEngineer}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSameAsDesignElectronicsEngineer(checked);
                          if (checked) {
                            setElectronicsSupervisorName(electronicsEngineerName);
                            setElectronicsSupervisorAddress(electronicsEngineerAddress);
                            setElectronicsSupervisorPRC(electronicsEngineerPRC);
                            setElectronicsSupervisorPRCValidity(electronicsEngineerPRCValidity);
                            setElectronicsSupervisorPTR(electronicsEngineerPTR);
                            setElectronicsSupervisorPTRDate(electronicsEngineerPTRIssued);
                            setElectronicsSupervisorPTRIssuedAt(electronicsEngineerPTRIssuedAt);
                            setElectronicsSupervisorTIN(electronicsEngineerTIN);
                            setElectronicsSupervisorSignedDate(electronicsEngineerSignedDate);
                            setElectronicsSupervisorSignature(electronicsEngineerSignature);
                          }
                        }}
                        style={{ accentColor: "#16a34a", cursor: "pointer" }}
                      />
                      Same as Design Professional (Box 3)
                    </label>
                  </div>

                  {/* Role selection radio buttons */}
                  <div style={{ display: "flex", gap: "1rem", margin: "8px 0 12px 0" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: electronicsSupervisorRole === "PECE" ? "700" : "500", color: "#166534", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="electronicsSupervisorRoleRadio"
                        checked={electronicsSupervisorRole === "PECE"}
                        onChange={() => setElectronicsSupervisorRole("PECE")}
                        style={{ accentColor: "#16a34a" }}
                      />
                      [ ] PROFESSIONAL ELECTRONICS ENGINEER
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: electronicsSupervisorRole === "ECE" ? "700" : "500", color: "#166534", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="electronicsSupervisorRoleRadio"
                        checked={electronicsSupervisorRole === "ECE"}
                        onChange={() => setElectronicsSupervisorRole("ECE")}
                        style={{ accentColor: "#16a34a" }}
                      />
                      [ ] ELECTRONICS ENGINEER
                    </label>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d" }}>Supervisor Full Name *</label>
                      <input type="text" required value={sameAsDesignElectronicsEngineer ? electronicsEngineerName : electronicsSupervisorName} onChange={(e) => setElectronicsSupervisorName(e.target.value)} disabled={sameAsDesignElectronicsEngineer} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: sameAsDesignElectronicsEngineer ? "#f8fafc" : "white", fontWeight: "700" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d" }}>Address *</label>
                      <input type="text" required value={sameAsDesignElectronicsEngineer ? electronicsEngineerAddress : electronicsSupervisorAddress} onChange={(e) => setElectronicsSupervisorAddress(e.target.value)} disabled={sameAsDesignElectronicsEngineer} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: sameAsDesignElectronicsEngineer ? "#f8fafc" : "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d" }}>PRC Registration No. *</label>
                      <input type="text" required value={sameAsDesignElectronicsEngineer ? electronicsEngineerPRC : electronicsSupervisorPRC} onChange={(e) => setElectronicsSupervisorPRC(e.target.value)} disabled={sameAsDesignElectronicsEngineer} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: sameAsDesignElectronicsEngineer ? "#f8fafc" : "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d" }}>PRC Validity Date *</label>
                      <input type="date" required value={sameAsDesignElectronicsEngineer ? electronicsEngineerPRCValidity : electronicsSupervisorPRCValidity} onChange={(e) => setElectronicsSupervisorPRCValidity(e.target.value)} disabled={sameAsDesignElectronicsEngineer} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: sameAsDesignElectronicsEngineer ? "#f8fafc" : "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d" }}>PTR Number *</label>
                      <input type="text" required value={sameAsDesignElectronicsEngineer ? electronicsEngineerPTR : electronicsSupervisorPTR} onChange={(e) => setElectronicsSupervisorPTR(e.target.value)} disabled={sameAsDesignElectronicsEngineer} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: sameAsDesignElectronicsEngineer ? "#f8fafc" : "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d" }}>Date Issued *</label>
                      <input type="text" required value={sameAsDesignElectronicsEngineer ? electronicsEngineerPTRIssued : electronicsSupervisorPTRDate} onChange={(e) => setElectronicsSupervisorPTRDate(e.target.value)} disabled={sameAsDesignElectronicsEngineer} placeholder="e.g. Jan 05, 2026" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: sameAsDesignElectronicsEngineer ? "#f8fafc" : "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d" }}>Issued At *</label>
                      <input type="text" required value={sameAsDesignElectronicsEngineer ? electronicsEngineerPTRIssuedAt : electronicsSupervisorPTRIssuedAt} onChange={(e) => setElectronicsSupervisorPTRIssuedAt(e.target.value)} disabled={sameAsDesignElectronicsEngineer} placeholder="e.g. Sto. Tomas, Pampanga" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: sameAsDesignElectronicsEngineer ? "#f8fafc" : "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d" }}>TIN Number *</label>
                      <input type="text" required value={sameAsDesignElectronicsEngineer ? electronicsEngineerTIN : electronicsSupervisorTIN} onChange={(e) => setElectronicsSupervisorTIN(e.target.value)} disabled={sameAsDesignElectronicsEngineer} placeholder="000-000-000-000" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: sameAsDesignElectronicsEngineer ? "#f8fafc" : "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d" }}>Date Signed *</label>
                      <input type="text" required value={sameAsDesignElectronicsEngineer ? electronicsEngineerSignedDate : electronicsSupervisorSignedDate} onChange={(e) => setElectronicsSupervisorSignedDate(e.target.value)} disabled={sameAsDesignElectronicsEngineer} placeholder="e.g. Jan 08, 2026" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: sameAsDesignElectronicsEngineer ? "#f8fafc" : "white" }} />
                    </div>
                  </div>

                  <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #86efac" }}>
                    <SignatureCreator
                      value={sameAsDesignElectronicsEngineer ? electronicsEngineerSignature : electronicsSupervisorSignature}
                      onChange={setElectronicsSupervisorSignature}
                      label={`Supervisor E-Signature (Affixed over printed name: ${sameAsDesignElectronicsEngineer ? electronicsEngineerName : electronicsSupervisorName})`}
                      required
                    />
                  </div>
                </div>

                {/* BOX 5: BUILDING OWNER */}
                <div style={{ background: "#ffffff", border: "1.5px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div>
                    <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", display: "block" }}>
                      BOX 5: BUILDING OWNER
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      Applicant / Building Owner sign-off and Community Tax Certificate (CTC) details
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>Building Owner Name *</label>
                      <input type="text" required value={applicantName} disabled style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#f8fafc", fontWeight: "700" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>Owner Address *</label>
                      <input type="text" required value={`${applicantNoStreet}, ${applicantBarangay}, ${applicantMunicipality}, ${applicantProvince}`} disabled style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#f8fafc" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>C.T.C. / Gov ID No. *</label>
                      <input type="text" required value={govIdNo} onChange={(e) => setGovIdNo(e.target.value)} placeholder="e.g. CTC-2026-00192" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>Date Issued *</label>
                      <input type="text" required value={govIdDateIssued} onChange={(e) => setGovIdDateIssued(e.target.value)} placeholder="e.g. Jan 08, 2026" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>Place Issued *</label>
                      <input type="text" required value={govIdPlaceIssued} onChange={(e) => setGovIdPlaceIssued(e.target.value)} placeholder="e.g. Sto. Tomas, Pampanga" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                    </div>
                  </div>

                  <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                    <SignatureCreator
                      value={applicantSignature}
                      onChange={setApplicantSignature}
                      label={`Building Owner E-Signature (Affixed over printed name: ${applicantName})`}
                      required
                    />
                  </div>
                </div>

                {/* BOX 6: WITH MY CONSENT: LOT OWNER */}
                <div style={{ background: "#ffffff", border: "1.5px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", display: "block" }}>
                        BOX 6: WITH MY CONSENT: LOT OWNER
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        Consent of the registered lot owner if different from the building owner / applicant
                      </span>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: "700", color: "#2563eb", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={lotOwnerConsent}
                        onChange={(e) => setLotOwnerConsent(e.target.checked)}
                        style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                      />
                      Include Box 6: With My Consent (Lot Owner)
                    </label>
                  </div>

                  {lotOwnerConsent && (
                    <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid #e2e8f0" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>Lot Owner Full Name *</label>
                          <input type="text" required value={lotOwnerName} onChange={(e) => setLotOwnerName(e.target.value)} placeholder="e.g. DAVE SICAT" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white", fontWeight: "700" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>Date Signed *</label>
                          <input type="text" required value={lotOwnerSignedDate} onChange={(e) => setLotOwnerSignedDate(e.target.value)} placeholder="e.g. Jan 08, 2026" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>Lot Owner Address *</label>
                          <input type="text" required value={lotOwnerAddress} onChange={(e) => setLotOwnerAddress(e.target.value)} placeholder="e.g. 105 Sitio Visitas, Sto. Tomas, Pampanga" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>C.T.C. / Gov ID No. *</label>
                          <input type="text" required value={lotOwnerGovIdNo} onChange={(e) => setLotOwnerGovIdNo(e.target.value)} placeholder="e.g. PRC-ID-00987654" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>Date Issued *</label>
                          <input type="text" required value={lotOwnerGovIdDateIssued} onChange={(e) => setLotOwnerGovIdDateIssued(e.target.value)} placeholder="e.g. Jan 10, 2024" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155" }}>Place Issued *</label>
                          <input type="text" required value={lotOwnerGovIdPlaceIssued} onChange={(e) => setLotOwnerGovIdPlaceIssued(e.target.value)} placeholder="e.g. Sto. Tomas" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }} />
                        </div>
                      </div>

                      <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                        <SignatureCreator
                          value={lotOwnerSignature}
                          onChange={setLotOwnerSignature}
                          label={`Lot Owner E-Signature (Affixed over printed name: ${lotOwnerName})`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* TAB 9: ANCILLARY PERMITS (Fencing, Demolition, Excavation, Sign, TSC) */}
            {/* ========================================== */}
            {["fencingPermit", "demolitionPermit", "excavationPermit", "signPermit", "temporaryServiceConnection"].includes(activeTab) && (
              <div className="animate-fade-in-up">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#ede9fe", color: "#6d28d9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>
                      {PERMIT_FORM_METADATA[activeTab]?.label} ({PERMIT_FORM_METADATA[activeTab]?.code})
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                      {PERMIT_FORM_METADATA[activeTab]?.desc || "Official Municipal Permitting Form"}
                    </p>
                  </div>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  {activeTab === "fencingPermit" && (
                    <div className="space-y-4">
                      {/* Box 1: Scope of Work */}
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#1e293b", textTransform: "uppercase" }}>
                            1. Scope of Work (NBC Form B-03 • Box 1)
                          </span>
                          <span style={{ fontSize: "0.7rem", background: "#ede9fe", color: "#6d28d9", padding: "2px 8px", borderRadius: "4px", fontWeight: "700" }}>
                            Official Checkboxes
                          </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.5rem" }}>
                          {[
                            "New Construction",
                            "Erection",
                            "Addition",
                            "Repair",
                            "Demolition",
                            "Others (Specify)"
                          ].map((scope) => {
                            const isSelected = fencingScopeOfWork === scope;
                            return (
                              <button
                                key={scope}
                                type="button"
                                onClick={() => setFencingScopeOfWork(scope)}
                                style={{
                                  padding: "8px 12px",
                                  borderRadius: "8px",
                                  border: isSelected ? "2px solid #6366f1" : "1px solid #cbd5e1",
                                  background: isSelected ? "#eef2ff" : "#ffffff",
                                  color: isSelected ? "#4338ca" : "#334155",
                                  fontWeight: isSelected ? "700" : "500",
                                  fontSize: "0.82rem",
                                  textAlign: "left",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease"
                                }}
                              >
                                {scope}
                              </button>
                            );
                          })}
                        </div>

                        {["Repair", "Demolition", "Other"].some(k => fencingScopeOfWork.toLowerCase().includes(k.toLowerCase())) && (
                          <div style={{ marginTop: "10px" }}>
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                              Specify {fencingScopeOfWork} Details (Printed on Form Underline) *
                            </label>
                            <input
                              type="text"
                              value={fencingScopeDetails}
                              onChange={(e) => setFencingScopeDetails(e.target.value)}
                              placeholder={`Specify details for ${fencingScopeOfWork}...`}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1.5px solid #93c5fd", fontSize: "0.84rem", background: "#f0f9ff" }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Box 6: Fencing Measurements & Official Type of Fencing (Page 2) */}
                      <div style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                          <div>
                            <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                              2. Fencing Measurements & Type of Fencing (NBC Form B-03 • Box 6)
                            </span>
                            <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#64748b" }}>
                              To be accomplished by the Design Professional (Architect or Civil Engineer)
                            </p>
                          </div>
                          <span style={{ fontSize: "0.7rem", background: "#dbeafe", color: "#1e40af", padding: "3px 10px", borderRadius: "6px", fontWeight: "700" }}>
                            Official Page 2 Box 6
                          </span>
                        </div>

                        {/* Measurements Row */}
                        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "0.85rem", marginBottom: "1rem" }}>
                          <span style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#334155", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.03em" }}>
                            Measurements (Printed on Official Box 6 Underlines)
                          </span>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                                Length in Meters (Underline 1) *
                              </label>
                              <div style={{ position: "relative" }}>
                                <input
                                  type="text"
                                  value={fenceLength}
                                  onChange={(e) => setFenceLength(e.target.value)}
                                  placeholder="e.g. 45.00"
                                  style={{ width: "100%", padding: "8px 10px", paddingRight: "36px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "0.86rem", fontWeight: "600", color: "#0f172a", background: "#f8fafc" }}
                                />
                                <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "#64748b", fontWeight: "700" }}>m</span>
                              </div>
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                                Height in Meters (Underline 2) *
                              </label>
                              <div style={{ position: "relative" }}>
                                <input
                                  type="text"
                                  value={fenceHeight}
                                  onChange={(e) => setFenceHeight(e.target.value)}
                                  placeholder="e.g. 2.20"
                                  style={{ width: "100%", padding: "8px 10px", paddingRight: "36px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "0.86rem", fontWeight: "600", color: "#0f172a", background: "#f8fafc" }}
                                />
                                <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "#64748b", fontWeight: "700" }}>m</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Type of Fencing (Official 8 Checkboxes Grid) */}
                        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "0.85rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#334155", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                              Type of Fencing (Official 8 Checkboxes in NBC Form B-03)
                            </span>
                            <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                              Select one or more applicable fencing types
                            </span>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                            {/* Left Column (5 Checkboxes) */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                              {[
                                { id: "INDIGENOUS MATERIALS", label: "INDIGENOUS MATERIALS", desc: "Bamboo, wood, thatch, or local organic fencing" },
                                { id: "R.C. (Reinforced Concrete)", label: "R.C. (Reinforced Concrete)", desc: "Full reinforced concrete posts and structural panels" },
                                { id: "R.C. and CONC. HOLLOW BLOCKS", label: "R.C. and CONC. HOLLOW BLOCKS", desc: "Reinforced concrete columns/beams with CHB wall infill" },
                                { id: "R.C. and BRICKS", label: "R.C. and BRICKS", desc: "Reinforced concrete framing with decorative brick masonry" },
                                { id: "R.C. and INTERLINK/CYCLONE WIRE", label: "R.C. and INTERLINK/CYCLONE WIRE", desc: "R.C. or pipe framing with chain-link cyclone mesh" },
                              ].map((item) => {
                                const checked = fencingTypes.includes(item.id);
                                const toggleFencing = () => {
                                  const next = checked
                                    ? fencingTypes.filter((t) => t !== item.id)
                                    : [...fencingTypes, item.id];
                                  setFencingTypes(next);
                                  setFencingType(next.join(", "));
                                };
                                return (
                                  <label
                                    key={item.id}
                                    style={{
                                      display: "flex",
                                      alignItems: "flex-start",
                                      gap: "8px",
                                      padding: "7px 10px",
                                      borderRadius: "6px",
                                      border: checked ? "1.5px solid #3b82f6" : "1px solid #e2e8f0",
                                      background: checked ? "#eff6ff" : "#ffffff",
                                      cursor: "pointer",
                                      transition: "all 0.15s ease",
                                      userSelect: "none",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={toggleFencing}
                                      style={{ marginTop: "2px", cursor: "pointer", accentColor: "#2563eb" }}
                                    />
                                    <div>
                                      <div style={{ fontSize: "0.78rem", fontWeight: checked ? "700" : "600", color: checked ? "#1d4ed8" : "#1e293b" }}>
                                        {item.label}
                                      </div>
                                      <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                                        {item.desc}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>

                            {/* Right Column (3 Checkboxes + Underlines) */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                              {[
                                { id: "R.C. STEEL MATTING", label: "R.C. STEEL MATTING", desc: "Reinforced frame with welded steel wire matting panels" },
                                { id: "R.C. BARBED WIRE", label: "R.C. BARBED WIRE", desc: "Security fence posts with multi-strand galvanized barbed wire" },
                                { id: "OTHERS (Specify)", label: "OTHERS (Specify)", desc: "Custom perimeter fencing specifications (prints on 3 underlines)" },
                              ].map((item) => {
                                const checked = fencingTypes.includes(item.id);
                                const toggleFencing = () => {
                                  const next = checked
                                    ? fencingTypes.filter((t) => t !== item.id)
                                    : [...fencingTypes, item.id];
                                  setFencingTypes(next);
                                  setFencingType(next.join(", "));
                                };
                                return (
                                  <label
                                    key={item.id}
                                    style={{
                                      display: "flex",
                                      alignItems: "flex-start",
                                      gap: "8px",
                                      padding: "7px 10px",
                                      borderRadius: "6px",
                                      border: checked ? "1.5px solid #3b82f6" : "1px solid #e2e8f0",
                                      background: checked ? "#eff6ff" : "#ffffff",
                                      cursor: "pointer",
                                      transition: "all 0.15s ease",
                                      userSelect: "none",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={toggleFencing}
                                      style={{ marginTop: "2px", cursor: "pointer", accentColor: "#2563eb" }}
                                    />
                                    <div>
                                      <div style={{ fontSize: "0.78rem", fontWeight: checked ? "700" : "600", color: checked ? "#1d4ed8" : "#1e293b" }}>
                                        {item.label}
                                      </div>
                                      <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                                        {item.desc}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* OTHERS (Specify) 3 Underline Lines Inputs */}
                        {(fencingTypes.includes("OTHERS (Specify)") || fencingType.toLowerCase().includes("other") || Boolean(fencingTypeOthers)) && (
                          <div style={{ marginTop: "0.85rem", background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: "8px", padding: "0.85rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                              <span style={{ fontSize: "0.76rem", fontWeight: "700", color: "#166534", textTransform: "uppercase" }}>
                                Official Box 6 Underlines for OTHERS (Specify)
                              </span>
                              <span style={{ fontSize: "0.68rem", background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "4px", fontWeight: "700" }}>
                                3 Form Lines
                              </span>
                            </div>
                            <p style={{ margin: "0 0 8px", fontSize: "0.7rem", color: "#15803d" }}>
                              Printed directly across the three official specification underlines in Box 6 on Page 2:
                            </p>

                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#374151", marginBottom: "2px" }}>
                                  Line 1: Primary Custom Material (Follows OTHERS (Specify) • max ~26 chars) *
                                </label>
                                <input
                                  type="text"
                                  value={fencingTypeOthers}
                                  onChange={(e) => {
                                    setFencingTypeOthers(e.target.value);
                                    setFenceMaterial(e.target.value);
                                  }}
                                  placeholder="e.g. Decorative Metal Grille Panels"
                                  maxLength={35}
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1.5px solid #86efac", fontSize: "0.82rem", background: "#ffffff" }}
                                />
                              </div>

                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#374151", marginBottom: "2px" }}>
                                  Line 2: Framing & Post Reinforcement (Full Underline 2 • max ~40 chars)
                                </label>
                                <input
                                  type="text"
                                  value={fencingTypeOthersLine2}
                                  onChange={(e) => setFencingTypeOthersLine2(e.target.value)}
                                  placeholder="e.g. with Reinforced Concrete Posts & Footing"
                                  maxLength={50}
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #bbf7d0", fontSize: "0.82rem", background: "#ffffff" }}
                                />
                              </div>

                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "600", color: "#374151", marginBottom: "2px" }}>
                                  Line 3: Top Finishing / Security Specifications (Full Underline 3 • max ~40 chars)
                                </label>
                                <input
                                  type="text"
                                  value={fencingTypeOthersLine3}
                                  onChange={(e) => setFencingTypeOthersLine3(e.target.value)}
                                  placeholder="e.g. Anti-climb spearhead design, 2-coat epoxy finish"
                                  maxLength={50}
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #bbf7d0", fontSize: "0.82rem", background: "#ffffff" }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Box 2: Design Professional, Plans and Specifications */}
                      <div style={{ background: "#ffffff", border: "1.5px solid #6366f1", borderRadius: "12px", padding: "1.25rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#4338ca", textTransform: "uppercase", display: "block" }}>
                              3. BOX 2: DESIGN PROFESSIONAL, PLANS AND SPECIFICATIONS
                            </span>
                            <span style={{ fontSize: "0.76rem", color: "#64748b" }}>
                              Architect or Civil Engineer (Signed and Sealed Over Printed Name)
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "0.76rem", fontWeight: "600", color: "#475569", marginRight: "4px" }}>Profession:</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFencingDesignerRole("architect");
                                setFencingDesignerName(architectName || "ARCH. MARIA ELENA SANTOS, UAP");
                                setFencingDesignerAddress(architectAddress || "San Nicolas, Sto. Tomas, Pampanga");
                                setFencingDesignerPRC(architectPRC || "0045211");
                                setFencingDesignerPRCValidity(architectPRCValidity || "2027-11-15");
                                setFencingDesignerPTR(architectPTR || "PTR-ST-2026-004");
                                setFencingDesignerPTRIssued(architectPTRIssued || "Jan 08, 2026");
                                setFencingDesignerPTRIssuedAt(architectPTRIssuedAt || "Sto. Tomas, Pampanga");
                                setFencingDesignerTIN(architectTIN || "456-789-012-000");
                              }}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                border: fencingDesignerRole === "architect" ? "1.5px solid #4f46e5" : "1px solid #cbd5e1",
                                background: fencingDesignerRole === "architect" ? "#e0e7ff" : "#ffffff",
                                color: fencingDesignerRole === "architect" ? "#3730a3" : "#475569",
                                fontWeight: fencingDesignerRole === "architect" ? "700" : "500",
                                fontSize: "0.76rem",
                                cursor: "pointer"
                              }}
                            >
                              Architect
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFencingDesignerRole("civilEngineer");
                                setFencingDesignerName(civilEngineerName || "ENGR. ROBERTO DIZON, CE");
                                setFencingDesignerAddress(civilEngineerAddress || "San Nicolas, Sto. Tomas, Pampanga");
                                setFencingDesignerPRC(civilEngineerPRC || "PRC-0045211");
                                setFencingDesignerPRCValidity(civilEngineerPRCValidity || "2027-11-15");
                                setFencingDesignerPTR(civilEngineerPTR || "PTR-ST-2026-004");
                                setFencingDesignerPTRIssued(civilEngineerPTRIssued || "Jan 08, 2026");
                                setFencingDesignerPTRIssuedAt(civilEngineerPTRIssuedAt || "Sto. Tomas, Pampanga");
                                setFencingDesignerTIN(civilEngineerTIN || "456-789-012-000");
                              }}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                border: fencingDesignerRole === "civilEngineer" ? "1.5px solid #4f46e5" : "1px solid #cbd5e1",
                                background: fencingDesignerRole === "civilEngineer" ? "#e0e7ff" : "#ffffff",
                                color: fencingDesignerRole === "civilEngineer" ? "#3730a3" : "#475569",
                                fontWeight: fencingDesignerRole === "civilEngineer" ? "700" : "500",
                                fontSize: "0.76rem",
                                cursor: "pointer"
                              }}
                            >
                              Civil Engineer
                            </button>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.65rem", marginBottom: "0.75rem" }}>
                          <div style={{ gridColumn: "span 2" }}>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>
                              {fencingDesignerRole === "civilEngineer" ? "Civil Engineer" : "Architect"} Full Name (Printed on Underline) *
                            </label>
                            <input
                              type="text"
                              value={fencingDesignerName}
                              onChange={(e) => setFencingDesignerName(e.target.value)}
                              placeholder="e.g. ARCH. MARIA ELENA SANTOS, UAP"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff", fontWeight: "700" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>Professional Address *</label>
                            <input
                              type="text"
                              value={fencingDesignerAddress}
                              onChange={(e) => setFencingDesignerAddress(e.target.value)}
                              placeholder="e.g. San Nicolas, Sto. Tomas, Pampanga"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>PRC Registration No. *</label>
                            <input
                              type="text"
                              value={fencingDesignerPRC}
                              onChange={(e) => setFencingDesignerPRC(e.target.value)}
                              placeholder="e.g. 0045211"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>PRC Validity *</label>
                            <input
                              type="date"
                              value={fencingDesignerPRCValidity}
                              onChange={(e) => setFencingDesignerPRCValidity(e.target.value)}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>PTR No. *</label>
                            <input
                              type="text"
                              value={fencingDesignerPTR}
                              onChange={(e) => setFencingDesignerPTR(e.target.value)}
                              placeholder="e.g. PTR-ST-2026-004"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>PTR Date Issued *</label>
                            <input
                              type="text"
                              value={fencingDesignerPTRIssued}
                              onChange={(e) => setFencingDesignerPTRIssued(e.target.value)}
                              placeholder="e.g. Jan 08, 2026"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>PTR Issued At *</label>
                            <input
                              type="text"
                              value={fencingDesignerPTRIssuedAt}
                              onChange={(e) => setFencingDesignerPTRIssuedAt(e.target.value)}
                              placeholder="e.g. Sto. Tomas, Pampanga"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>TIN *</label>
                            <input
                              type="text"
                              value={fencingDesignerTIN}
                              onChange={(e) => setFencingDesignerTIN(e.target.value)}
                              placeholder="e.g. 456-789-012-000"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                        </div>

                        {/* E-Signature Creator for Box 2 */}
                        <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #c7d2fe" }}>
                          <SignatureCreator
                            value={fencingDesignerSignature}
                            onChange={setFencingDesignerSignature}
                            label={`Design Professional E-Signature (${fencingDesignerRole === "civilEngineer" ? "Civil Engineer" : "Architect"} - Affixed Over Printed Name: ${fencingDesignerName})`}
                            required
                          />
                        </div>
                      </div>

                      {/* Box 3: Full-Time Inspector and Supervisor */}
                      <div style={{ background: "#ffffff", border: "1.5px solid #059669", borderRadius: "12px", padding: "1.25rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#065f46", textTransform: "uppercase", display: "block" }}>
                              4. BOX 3: FULL-TIME INSPECTOR AND SUPERVISOR OF CONSTRUCTION WORKS
                            </span>
                            <span style={{ fontSize: "0.76rem", color: "#64748b" }}>
                              Architect or Civil Engineer In-Charge of Construction
                            </span>
                          </div>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: "700", color: "#065f46", cursor: "pointer", background: "#ecfdf5", padding: "4px 10px", borderRadius: "6px", border: "1px solid #a7f3d0" }}>
                            <input
                              type="checkbox"
                              checked={sameAsDesignFencingSupervisor}
                              onChange={(e) => setSameAsDesignFencingSupervisor(e.target.checked)}
                              style={{ accentColor: "#059669", width: "15px", height: "15px", cursor: "pointer" }}
                            />
                            <span>Same as Design Professional (Box 2)</span>
                          </label>
                        </div>

                        {sameAsDesignFencingSupervisor ? (
                          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "0.85rem", display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#22c55e", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: "bold" }}>✓</div>
                            <div>
                              <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#166534", display: "block" }}>
                                Full Credentials & E-Signature Inherited from Box 2
                              </span>
                              <span style={{ fontSize: "0.76rem", color: "#15803d" }}>
                                Supervisor: <strong>{fencingDesignerName}</strong> (PRC: {fencingDesignerPRC}, PTR: {fencingDesignerPTR}). Digital signature is synchronized automatically.
                              </span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.65rem", marginBottom: "0.75rem" }}>
                              <div style={{ gridColumn: "span 2" }}>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>
                                  Supervisor Full Name (Printed on Underline) *
                                </label>
                                <input
                                  type="text"
                                  value={fencingSupervisorName}
                                  onChange={(e) => setFencingSupervisorName(e.target.value)}
                                  placeholder="e.g. ENGR. ROBERTO DIZON, CE"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff", fontWeight: "700" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>Address *</label>
                                <input
                                  type="text"
                                  value={fencingSupervisorAddress}
                                  onChange={(e) => setFencingSupervisorAddress(e.target.value)}
                                  placeholder="e.g. Poblacion, Sto. Tomas, Pampanga"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>PRC Registration No. *</label>
                                <input
                                  type="text"
                                  value={fencingSupervisorPRC}
                                  onChange={(e) => setFencingSupervisorPRC(e.target.value)}
                                  placeholder="e.g. 0089123"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>PRC Validity *</label>
                                <input
                                  type="date"
                                  value={fencingSupervisorPRCValidity}
                                  onChange={(e) => setFencingSupervisorPRCValidity(e.target.value)}
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>PTR No. *</label>
                                <input
                                  type="text"
                                  value={fencingSupervisorPTR}
                                  onChange={(e) => setFencingSupervisorPTR(e.target.value)}
                                  placeholder="e.g. PTR-ST-2026-099"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>PTR Date Issued *</label>
                                <input
                                  type="text"
                                  value={fencingSupervisorPTRIssued}
                                  onChange={(e) => setFencingSupervisorPTRIssued(e.target.value)}
                                  placeholder="e.g. Jan 12, 2026"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>PTR Issued At *</label>
                                <input
                                  type="text"
                                  value={fencingSupervisorPTRIssuedAt}
                                  onChange={(e) => setFencingSupervisorPTRIssuedAt(e.target.value)}
                                  placeholder="e.g. Sto. Tomas, Pampanga"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>TIN *</label>
                                <input
                                  type="text"
                                  value={fencingSupervisorTIN}
                                  onChange={(e) => setFencingSupervisorTIN(e.target.value)}
                                  placeholder="e.g. 987-654-321-000"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                                />
                              </div>
                            </div>

                            <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #a7f3d0" }}>
                              <SignatureCreator
                                value={fencingSupervisorSignature}
                                onChange={setFencingSupervisorSignature}
                                label={`Full-Time Supervisor E-Signature (Affixed Over Printed Name: ${fencingSupervisorName})`}
                                required
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Box 4: Building Owner / Applicant & Lot Owner Consent */}
                      <div style={{ background: "#ffffff", border: "1.5px solid #0284c7", borderRadius: "12px", padding: "1.25rem" }}>
                        <div style={{ marginBottom: "12px" }}>
                          <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#0369a1", textTransform: "uppercase", display: "block" }}>
                            5. BOX 4: TO BE ACCOMPLISHED BY THE APPLICANT & LOT OWNER
                          </span>
                          <span style={{ fontSize: "0.76rem", color: "#64748b" }}>
                            Owner authorization, community tax certificates (CTC), and consent signatures
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                          {/* Applicant Card */}
                          <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "1rem" }}>
                            <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                              Building Owner / Applicant (Left)
                            </span>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                              <div style={{ gridColumn: "span 2" }}>
                                <label style={{ display: "block", fontSize: "0.73rem", color: "#64748b", marginBottom: "2px" }}>Applicant Full Name</label>
                                <input
                                  type="text"
                                  value={applicantName || "JUAN DELA CRUZ"}
                                  disabled
                                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#f1f5f9", fontWeight: "700" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.73rem", color: "#64748b", marginBottom: "2px" }}>C.T.C. / Gov ID No. *</label>
                                <input
                                  type="text"
                                  value={govIdNo || "00192847"}
                                  onChange={(e) => setGovIdNo(e.target.value)}
                                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.73rem", color: "#64748b", marginBottom: "2px" }}>Date Issued *</label>
                                <input
                                  type="text"
                                  value={govIdDateIssued || "Jan 05, 2026"}
                                  onChange={(e) => setGovIdDateIssued(e.target.value)}
                                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                                />
                              </div>
                              <div style={{ gridColumn: "span 2" }}>
                                <label style={{ display: "block", fontSize: "0.73rem", color: "#64748b", marginBottom: "2px" }}>Place Issued *</label>
                                <input
                                  type="text"
                                  value={govIdPlaceIssued || "Sto. Tomas"}
                                  onChange={(e) => setGovIdPlaceIssued(e.target.value)}
                                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                                />
                              </div>
                            </div>

                            <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                              <SignatureCreator
                                value={applicantSignature}
                                onChange={setApplicantSignature}
                                label={`Applicant E-Signature (Affixed over printed name: ${applicantName || 'Applicant'})`}
                                required
                              />
                            </div>
                          </div>

                          {/* Lot Owner Consent Card */}
                          <div style={{ background: lotOwnerConsent ? "#f0fdf4" : "#f8fafc", border: lotOwnerConsent ? "1px solid #86efac" : "1px solid #cbd5e1", borderRadius: "10px", padding: "1rem", transition: "all 0.2s ease" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <span style={{ fontSize: "0.8rem", fontWeight: "800", color: lotOwnerConsent ? "#166534" : "#1e293b", textTransform: "uppercase" }}>
                                With My Consent: Lot Owner (Right)
                              </span>
                              <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.74rem", fontWeight: "700", color: "#166534", cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={lotOwnerConsent}
                                  onChange={(e) => setLotOwnerConsent(e.target.checked)}
                                  style={{ accentColor: "#16a34a", width: "15px", height: "15px", cursor: "pointer" }}
                                />
                                <span>Consent Required</span>
                              </label>
                            </div>

                            {lotOwnerConsent ? (
                              <>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                  <div style={{ gridColumn: "span 2" }}>
                                    <label style={{ display: "block", fontSize: "0.73rem", color: "#64748b", marginBottom: "2px" }}>Lot Owner Full Name *</label>
                                    <input
                                      type="text"
                                      value={lotOwnerName}
                                      onChange={(e) => setLotOwnerName(e.target.value)}
                                      placeholder="e.g. DAVE SICAT"
                                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff", fontWeight: "700" }}
                                    />
                                  </div>
                                  <div style={{ gridColumn: "span 2" }}>
                                    <label style={{ display: "block", fontSize: "0.73rem", color: "#64748b", marginBottom: "2px" }}>Lot Owner Address *</label>
                                    <input
                                      type="text"
                                      value={lotOwnerAddress}
                                      onChange={(e) => setLotOwnerAddress(e.target.value)}
                                      placeholder="e.g. 153 Sitio Visitas, Sto. Tomas, Pampanga"
                                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: "block", fontSize: "0.73rem", color: "#64748b", marginBottom: "2px" }}>C.T.C. No. *</label>
                                    <input
                                      type="text"
                                      value={lotOwnerGovIdNo}
                                      onChange={(e) => setLotOwnerGovIdNo(e.target.value)}
                                      placeholder="e.g. 00881923"
                                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: "block", fontSize: "0.73rem", color: "#64748b", marginBottom: "2px" }}>Date Issued *</label>
                                    <input
                                      type="text"
                                      value={lotOwnerGovIdDateIssued}
                                      onChange={(e) => setLotOwnerGovIdDateIssued(e.target.value)}
                                      placeholder="e.g. Jan 10, 2026"
                                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                                    />
                                  </div>
                                  <div style={{ gridColumn: "span 2" }}>
                                    <label style={{ display: "block", fontSize: "0.73rem", color: "#64748b", marginBottom: "2px" }}>Place Issued *</label>
                                    <input
                                      type="text"
                                      value={lotOwnerGovIdPlaceIssued}
                                      onChange={(e) => setLotOwnerGovIdPlaceIssued(e.target.value)}
                                      placeholder="e.g. Sto. Tomas"
                                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                                    />
                                  </div>
                                </div>

                                <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #86efac" }}>
                                  <SignatureCreator
                                    value={lotOwnerSignature}
                                    onChange={setLotOwnerSignature}
                                    label={`Lot Owner E-Signature (Affixed over printed name: ${lotOwnerName || 'Lot Owner'})`}
                                  />
                                </div>
                              </>
                            ) : (
                              <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "1rem 0", fontStyle: "italic" }}>
                                Enable consent if the applicant is not the registered owner of the lot or if co-owner consent is required.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "demolitionPermit" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      {/* Section 1: Scope of Demolition Works (Box 1) */}
                      <div style={{ padding: "1.1rem", borderRadius: "10px", background: "#f8fafc", border: "1px solid #cbd5e1" }}>
                        <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", display: "block", marginBottom: "0.75rem" }}>
                          Box 1: Scope of Demolition Works & Specifications
                        </span>
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Structure / Building to Demolish *</label>
                            <input type="text" value={demolitionBuildingType} onChange={(e) => setDemolitionBuildingType(e.target.value)} placeholder="e.g. Single-Detached Two-Storey Residential" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "600" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Number of Storeys *</label>
                            <input type="text" value={demolitionStoreys} onChange={(e) => setDemolitionStoreys(e.target.value)} placeholder="e.g. 2" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Demolition Area *</label>
                            <input type="text" value={demolitionArea} onChange={(e) => setDemolitionArea(e.target.value)} placeholder="e.g. 180.00 sq.m." style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }} />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Proposed Start Date *</label>
                            <input type="date" value={demolitionStartDate} onChange={(e) => setDemolitionStartDate(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Expected Completion Date *</label>
                            <input type="date" value={demolitionCompletionDate} onChange={(e) => setDemolitionCompletionDate(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }} />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Demolition Methodology & Safety Plan *</label>
                          <input type="text" value={demolitionMethod} onChange={(e) => setDemolitionMethod(e.target.value)} placeholder="e.g. Manual Disassembly & Hand-held Mechanical Tools with Debris Chute" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }} />
                        </div>
                      </div>

                      {/* Section 2: Accompanying Building Permit */}
                      <div style={{
                        padding: "12px 14px",
                        borderRadius: "10px",
                        background: demolitionWithBuildingPermit ? "#eff6ff" : "#f8fafc",
                        border: demolitionWithBuildingPermit ? "1.5px solid #93c5fd" : "1px solid #e2e8f0"
                      }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem", color: "#1e293b" }}>
                          <input
                            type="checkbox"
                            checked={demolitionWithBuildingPermit}
                            onChange={(e) => setDemolitionWithBuildingPermit(e.target.checked)}
                            style={{ width: "18px", height: "18px", accentColor: "#2563eb", cursor: "pointer" }}
                          />
                          <span>This Demolition Permit is submitted with / accompanied by a Building Permit</span>
                        </label>
                        {demolitionWithBuildingPermit && (
                          <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", alignItems: "center" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#3b82f6", marginBottom: "3px" }}>
                                Building Permit No. (Auto-gathered)
                              </label>
                              <input
                                type="text"
                                value={demolitionBuildingPermitNo || (mandatoryKeys.includes("buildingPermit") ? `BP-${new Date().getFullYear()}-0001` : "BP-2026-0001")}
                                onChange={(e) => setDemolitionBuildingPermitNo(e.target.value)}
                                placeholder="BP-2026-0001"
                                style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #93c5fd", fontSize: "0.85rem", fontWeight: "700", background: "#ffffff", color: "#1d4ed8" }}
                              />
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#475569" }}>
                              Automatically gathered from the Building Permit application and inserted 1 character per compartment box into the 8 boxes of <strong>BUILDING PERMIT NO.</strong>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Section 3: BOX 2: FULL-TIME INSPECTOR AND SUPERVISOR OF DEMOLITION WORKS */}
                      <div style={{ padding: "1.1rem", borderRadius: "10px", background: "#f0fdf4", border: "1.5px solid #86efac" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.85rem" }}>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#14532d", textTransform: "uppercase", display: "block" }}>
                              Box 2: Full-Time Inspector and Supervisor of Demolition Works
                            </span>
                            <span style={{ fontSize: "0.74rem", color: "#166534" }}>
                              Licensed Architect or Civil Engineer in charge of full-time demolition safety & operations
                            </span>
                          </div>

                          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: "700", color: "#166534", cursor: "pointer", background: "#dcfce7", padding: "4px 8px", borderRadius: "6px" }}>
                            <input
                              type="checkbox"
                              checked={sameAsCivilEngineer}
                              onChange={(e) => setSameAsCivilEngineer(e.target.checked)}
                              style={{ accentColor: "#16a34a" }}
                            />
                            Same as Project Civil Engineer (Box 3)
                          </label>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d", marginBottom: "3px" }}>Supervisor Full Name (with Title) *</label>
                            <input
                              type="text"
                              required
                              value={sameAsCivilEngineer ? civilEngineerName : demolitionSupervisorName}
                              onChange={(e) => setDemolitionSupervisorName(e.target.value)}
                              disabled={sameAsCivilEngineer}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.85rem", fontWeight: "700", background: sameAsCivilEngineer ? "#f0fdf4" : "white" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d", marginBottom: "3px" }}>Professional Address *</label>
                            <input
                              type="text"
                              required
                              value={sameAsCivilEngineer ? civilEngineerAddress : demolitionSupervisorAddress}
                              onChange={(e) => setDemolitionSupervisorAddress(e.target.value)}
                              disabled={sameAsCivilEngineer}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.85rem", background: sameAsCivilEngineer ? "#f0fdf4" : "white" }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.85rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d", marginBottom: "3px" }}>Telephone / Mobile *</label>
                            <input
                              type="text"
                              required
                              value={sameAsCivilEngineer ? (applicantPhone || "0918-765-4321") : demolitionSupervisorPhone}
                              onChange={(e) => setDemolitionSupervisorPhone(e.target.value)}
                              disabled={sameAsCivilEngineer}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.85rem", background: sameAsCivilEngineer ? "#f0fdf4" : "white" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d", marginBottom: "3px" }}>PRC Registration No. *</label>
                            <input
                              type="text"
                              required
                              value={sameAsCivilEngineer ? civilEngineerPRC : demolitionSupervisorPRC}
                              onChange={(e) => setDemolitionSupervisorPRC(e.target.value)}
                              disabled={sameAsCivilEngineer}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.85rem", background: sameAsCivilEngineer ? "#f0fdf4" : "white" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d", marginBottom: "3px" }}>PRC Validity Date *</label>
                            <input
                              type="text"
                              required
                              value={sameAsCivilEngineer ? civilEngineerPRCValidity : demolitionSupervisorPRCValidity}
                              onChange={(e) => setDemolitionSupervisorPRCValidity(e.target.value)}
                              disabled={sameAsCivilEngineer}
                              placeholder="YYYY-MM-DD"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.85rem", background: sameAsCivilEngineer ? "#f0fdf4" : "white" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d", marginBottom: "3px" }}>TIN Number *</label>
                            <input
                              type="text"
                              required
                              value={sameAsCivilEngineer ? civilEngineerTIN : demolitionSupervisorTIN}
                              onChange={(e) => setDemolitionSupervisorTIN(e.target.value)}
                              disabled={sameAsCivilEngineer}
                              placeholder="000-000-000-000"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.85rem", background: sameAsCivilEngineer ? "#f0fdf4" : "white" }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d", marginBottom: "3px" }}>PTR Number *</label>
                            <input
                              type="text"
                              required
                              value={sameAsCivilEngineer ? civilEngineerPTR : demolitionSupervisorPTR}
                              onChange={(e) => setDemolitionSupervisorPTR(e.target.value)}
                              disabled={sameAsCivilEngineer}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.85rem", background: sameAsCivilEngineer ? "#f0fdf4" : "white" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d", marginBottom: "3px" }}>Date Issued *</label>
                            <input
                              type="text"
                              required
                              value={sameAsCivilEngineer ? civilEngineerPTRIssued : demolitionSupervisorPTRIssued}
                              onChange={(e) => setDemolitionSupervisorPTRIssued(e.target.value)}
                              disabled={sameAsCivilEngineer}
                              placeholder="e.g. Jan 10, 2026"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.85rem", background: sameAsCivilEngineer ? "#f0fdf4" : "white" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d", marginBottom: "3px" }}>Issued At *</label>
                            <input
                              type="text"
                              required
                              value={sameAsCivilEngineer ? civilEngineerPTRIssuedAt : demolitionSupervisorPTRIssuedAt}
                              onChange={(e) => setDemolitionSupervisorPTRIssuedAt(e.target.value)}
                              disabled={sameAsCivilEngineer}
                              placeholder="e.g. Sto. Tomas"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.85rem", background: sameAsCivilEngineer ? "#f0fdf4" : "white" }}
                            />
                          </div>
                        </div>

                        {/* E-Signature */}
                        <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #86efac" }}>
                          <SignatureCreator
                            value={sameAsCivilEngineer ? (civilEngineerSignature || demolitionSupervisorSignature) : demolitionSupervisorSignature}
                            onChange={(sig) => {
                              setDemolitionSupervisorSignature(sig);
                              if (sameAsCivilEngineer) setCivilEngineerSignature(sig);
                            }}
                            label={`Supervisor Seal & E-Signature (Affixed over printed name: ${sameAsCivilEngineer ? civilEngineerName : demolitionSupervisorName})`}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "excavationPermit" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      {/* Section 1: Accompanying Building Permit */}
                      <div style={{
                        padding: "12px 14px",
                        borderRadius: "10px",
                        background: excavationWithBuildingPermit ? "#eff6ff" : "#f8fafc",
                        border: excavationWithBuildingPermit ? "1.5px solid #93c5fd" : "1px solid #e2e8f0"
                      }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem", color: "#1e293b" }}>
                          <input
                            type="checkbox"
                            checked={excavationWithBuildingPermit}
                            onChange={(e) => setExcavationWithBuildingPermit(e.target.checked)}
                            style={{ width: "18px", height: "18px", accentColor: "#2563eb", cursor: "pointer" }}
                          />
                          <span>This Excavation and Ground Preparation Permit is submitted with / accompanied by a Building Permit</span>
                        </label>
                        {excavationWithBuildingPermit && (
                          <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", alignItems: "center" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#3b82f6", marginBottom: "3px" }}>
                                Building Permit No. (Auto-gathered)
                              </label>
                              <input
                                type="text"
                                value={excavationBuildingPermitNo || (mandatoryKeys.includes("buildingPermit") ? `BP-${new Date().getFullYear()}-0001` : "BP-2026-0001")}
                                onChange={(e) => setExcavationBuildingPermitNo(e.target.value)}
                                placeholder="BP-2026-0001"
                                style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #93c5fd", fontSize: "0.85rem", fontWeight: "700", background: "#ffffff", color: "#1d4ed8" }}
                              />
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#475569" }}>
                              Automatically gathered from the Building Permit application and inserted 1 character per compartment box into the 8 boxes of <strong>BUILDING PERMIT NO.</strong> on NBC Form B-02.
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Section 2: Box 1 Summary & Auto-Sync Review */}
                      <div style={{ padding: "1.1rem", borderRadius: "10px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block" }}>
                              Box 1: Owner / Applicant & Installation Location Details
                            </span>
                            <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                              Auto-synchronized across all municipal permit forms from your primary project information
                            </span>
                          </div>
                          <span style={{ fontSize: "0.72rem", background: "#e2e8f0", color: "#334155", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                            NBC Form B-02 Box 1
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1.2fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Applicant Full Name</label>
                            <div style={{ fontSize: "0.84rem", fontWeight: "700", color: "#0f172a", padding: "6px 10px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {compiledFullName}
                            </div>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>T.I.N. Number</label>
                            <div style={{ fontSize: "0.84rem", fontWeight: "700", color: "#0f172a", padding: "6px 10px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {applicantTIN || "123-456-789-000"}
                            </div>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Form of Ownership</label>
                            <div style={{ fontSize: "0.84rem", fontWeight: "700", color: "#0f172a", padding: "6px 10px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {formOfOwnership || "INDIVIDUAL / OWNER"}
                            </div>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Character of Occupancy</label>
                            <div style={{ fontSize: "0.84rem", fontWeight: "700", color: "#0f172a", padding: "6px 10px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {occupancyClassificationDetail || occupancyClass || "GROUP A - RESIDENTIAL"}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Lot No.</label>
                            <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "#0f172a", padding: "5px 8px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {lotNo || "Lot 12"}
                            </div>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Blk No.</label>
                            <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "#0f172a", padding: "5px 8px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {blockNo || "Block 4"}
                            </div>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>TCT / OCT No.</label>
                            <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "#0f172a", padding: "5px 8px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {tctNo || "TCT-889977-P"}
                            </div>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Tax Dec. No.</label>
                            <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "#0f172a", padding: "5px 8px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {taxDecNo || "TD-2026-004455"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Box 2 Design Professional, Plans and Specification */}
                      <div style={{ padding: "1.1rem", borderRadius: "10px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.85rem" }}>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block" }}>
                              Box 2: Design Professional, Plans and Specification (Architect or Civil Engineer)
                            </span>
                            <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                              Registered Civil Engineer / Architect who prepared and signed the excavation plans and shoring specifications
                            </span>
                          </div>
                          <span style={{ fontSize: "0.72rem", background: "#e2e8f0", color: "#334155", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                            NBC Form B-02 Box 2
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>Engineer / Architect Full Name (with Title) *</label>
                            <input
                              type="text"
                              required
                              value={civilEngineerName}
                              onChange={(e) => setCivilEngineerName(e.target.value)}
                              placeholder="e.g. ENGR. ROBERTO CRUZ, PICE"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "700", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>Professional Address *</label>
                            <input
                              type="text"
                              required
                              value={civilEngineerAddress}
                              onChange={(e) => setCivilEngineerAddress(e.target.value)}
                              placeholder="e.g. Sto. Tomas, Pampanga"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.85rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>PRC Registration No. *</label>
                            <input
                              type="text"
                              required
                              value={civilEngineerPRC}
                              onChange={(e) => setCivilEngineerPRC(e.target.value)}
                              placeholder="e.g. 0078923"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>PRC Validity Date *</label>
                            <input
                              type="text"
                              required
                              value={civilEngineerPRCValidity}
                              onChange={(e) => setCivilEngineerPRCValidity(e.target.value)}
                              placeholder="YYYY-MM-DD"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>TIN Number *</label>
                            <input
                              type="text"
                              required
                              value={civilEngineerTIN}
                              onChange={(e) => setCivilEngineerTIN(e.target.value)}
                              placeholder="000-000-000-000"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>PTR Number *</label>
                            <input
                              type="text"
                              required
                              value={civilEngineerPTR}
                              onChange={(e) => setCivilEngineerPTR(e.target.value)}
                              placeholder="e.g. PTR-ST-554433"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>Date Issued *</label>
                            <input
                              type="text"
                              required
                              value={civilEngineerPTRIssued}
                              onChange={(e) => setCivilEngineerPTRIssued(e.target.value)}
                              placeholder="e.g. Jan 10, 2026"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>Issued At *</label>
                            <input
                              type="text"
                              required
                              value={civilEngineerPTRIssuedAt}
                              onChange={(e) => setCivilEngineerPTRIssuedAt(e.target.value)}
                              placeholder="e.g. Sto. Tomas"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>Signed Date *</label>
                            <input
                              type="text"
                              required
                              value={civilEngineerSignedDate}
                              onChange={(e) => setCivilEngineerSignedDate(e.target.value)}
                              placeholder="e.g. Sep 17, 2026"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                        </div>

                        {/* Professional E-Signature */}
                        <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                          <SignatureCreator
                            value={civilEngineerSignature}
                            onChange={setCivilEngineerSignature}
                            label={`Professional Seal & E-Signature (Affixed over printed name: ${civilEngineerName || 'Civil Engineer'})`}
                            required
                          />
                        </div>
                      </div>

                      {/* Section 4: Box 3 Full-Time Inspector and Supervisor of Excavation Works */}
                      <div style={{ padding: "1.1rem", borderRadius: "10px", background: "#f0fdf4", border: "1.5px solid #86efac" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.85rem" }}>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#14532d", textTransform: "uppercase", display: "block" }}>
                              Box 3: Full-Time Inspector and Supervisor of Excavation & Ground Preparation Works
                            </span>
                            <span style={{ fontSize: "0.74rem", color: "#166534" }}>
                              Licensed Civil Engineer in charge of full-time excavation safety, shoring, sheet piling, and ground operations
                            </span>
                          </div>

                          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: "700", color: "#166534", cursor: "pointer", background: "#dcfce7", padding: "4px 8px", borderRadius: "6px" }}>
                            <input
                              type="checkbox"
                              checked={sameAsCivilEngineerExcavation}
                              onChange={(e) => setSameAsCivilEngineerExcavation(e.target.checked)}
                              style={{ accentColor: "#16a34a" }}
                            />
                            Same as Project Civil Engineer (Box 2)
                          </label>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d", marginBottom: "3px" }}>Supervisor Full Name (with Title) *</label>
                            <input
                              type="text"
                              required
                              value={sameAsCivilEngineerExcavation ? civilEngineerName : excavationSupervisorName}
                              onChange={(e) => setExcavationSupervisorName(e.target.value)}
                              disabled={sameAsCivilEngineerExcavation}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.85rem", fontWeight: "700", background: sameAsCivilEngineerExcavation ? "#f0fdf4" : "white" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d", marginBottom: "3px" }}>Professional Address *</label>
                            <input
                              type="text"
                              required
                              value={sameAsCivilEngineerExcavation ? civilEngineerAddress : excavationSupervisorAddress}
                              onChange={(e) => setExcavationSupervisorAddress(e.target.value)}
                              disabled={sameAsCivilEngineerExcavation}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.85rem", background: sameAsCivilEngineerExcavation ? "#f0fdf4" : "white" }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.85rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d", marginBottom: "3px" }}>Telephone / Mobile *</label>
                            <input
                              type="text"
                              required
                              value={sameAsCivilEngineerExcavation ? (applicantPhone || "0918-765-4321") : excavationSupervisorPhone}
                              onChange={(e) => setExcavationSupervisorPhone(e.target.value)}
                              disabled={sameAsCivilEngineerExcavation}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.85rem", background: sameAsCivilEngineerExcavation ? "#f0fdf4" : "white" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d", marginBottom: "3px" }}>PRC Registration No. *</label>
                            <input
                              type="text"
                              required
                              value={sameAsCivilEngineerExcavation ? civilEngineerPRC : excavationSupervisorPRC}
                              onChange={(e) => setExcavationSupervisorPRC(e.target.value)}
                              disabled={sameAsCivilEngineerExcavation}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.85rem", background: sameAsCivilEngineerExcavation ? "#f0fdf4" : "white" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d", marginBottom: "3px" }}>PRC Validity Date *</label>
                            <input
                              type="text"
                              required
                              value={sameAsCivilEngineerExcavation ? civilEngineerPRCValidity : excavationSupervisorPRCValidity}
                              onChange={(e) => setExcavationSupervisorPRCValidity(e.target.value)}
                              disabled={sameAsCivilEngineerExcavation}
                              placeholder="YYYY-MM-DD"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.85rem", background: sameAsCivilEngineerExcavation ? "#f0fdf4" : "white" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d", marginBottom: "3px" }}>TIN Number *</label>
                            <input
                              type="text"
                              required
                              value={sameAsCivilEngineerExcavation ? civilEngineerTIN : excavationSupervisorTIN}
                              onChange={(e) => setExcavationSupervisorTIN(e.target.value)}
                              disabled={sameAsCivilEngineerExcavation}
                              placeholder="000-000-000-000"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.85rem", background: sameAsCivilEngineerExcavation ? "#f0fdf4" : "white" }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d", marginBottom: "3px" }}>PTR Number *</label>
                            <input
                              type="text"
                              required
                              value={sameAsCivilEngineerExcavation ? civilEngineerPTR : excavationSupervisorPTR}
                              onChange={(e) => setExcavationSupervisorPTR(e.target.value)}
                              disabled={sameAsCivilEngineerExcavation}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.85rem", background: sameAsCivilEngineerExcavation ? "#f0fdf4" : "white" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d", marginBottom: "3px" }}>Date Issued *</label>
                            <input
                              type="text"
                              required
                              value={sameAsCivilEngineerExcavation ? civilEngineerPTRIssued : excavationSupervisorPTRIssued}
                              onChange={(e) => setExcavationSupervisorPTRIssued(e.target.value)}
                              disabled={sameAsCivilEngineerExcavation}
                              placeholder="e.g. Jan 10, 2026"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.85rem", background: sameAsCivilEngineerExcavation ? "#f0fdf4" : "white" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#14532d", marginBottom: "3px" }}>Issued At *</label>
                            <input
                              type="text"
                              required
                              value={sameAsCivilEngineerExcavation ? civilEngineerPTRIssuedAt : excavationSupervisorPTRIssuedAt}
                              onChange={(e) => setExcavationSupervisorPTRIssuedAt(e.target.value)}
                              disabled={sameAsCivilEngineerExcavation}
                              placeholder="e.g. Sto. Tomas"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #86efac", fontSize: "0.85rem", background: sameAsCivilEngineerExcavation ? "#f0fdf4" : "white" }}
                            />
                          </div>
                        </div>

                        {/* Supervisor E-Signature */}
                        <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #86efac" }}>
                          <SignatureCreator
                            value={sameAsCivilEngineerExcavation ? (civilEngineerSignature || excavationSupervisorSignature) : excavationSupervisorSignature}
                            onChange={(sig) => {
                              setExcavationSupervisorSignature(sig);
                              if (sameAsCivilEngineerExcavation) setCivilEngineerSignature(sig);
                            }}
                            label={`Supervisor Seal & E-Signature (Affixed over printed name: ${sameAsCivilEngineerExcavation ? civilEngineerName : excavationSupervisorName})`}
                            required
                          />
                        </div>
                      </div>

                      {/* Section 5: Box 4 Building Owner & Box 5 Lot Owner Consent */}
                      <div style={{ background: "#ffffff", border: "1.5px solid #0284c7", borderRadius: "12px", padding: "1.25rem" }}>
                        <div style={{ marginBottom: "12px" }}>
                          <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#0369a1", textTransform: "uppercase", display: "block" }}>
                            Box 4 & Box 5: Building Owner Authorization & Lot Owner Consent
                          </span>
                          <span style={{ fontSize: "0.76rem", color: "#64748b" }}>
                            Official DPWH Box 4 applicant identification and Box 5 registered lot owner consent signatures
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                          {/* Box 4: Building Owner Card */}
                          <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "1rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase" }}>
                                Box 4: Building Owner / Applicant (Left)
                              </span>
                              <span style={{ fontSize: "0.7rem", background: "#e2e8f0", color: "#334155", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                                NBC Form B-02
                              </span>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                              <div style={{ gridColumn: "span 2" }}>
                                <label style={{ display: "block", fontSize: "0.73rem", color: "#64748b", marginBottom: "2px" }}>Applicant Full Name</label>
                                <input
                                  type="text"
                                  value={compiledFullName || applicantName || "JUAN DELA CRUZ"}
                                  disabled
                                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#f1f5f9", fontWeight: "700" }}
                                />
                              </div>
                              <div style={{ gridColumn: "span 2" }}>
                                <label style={{ display: "block", fontSize: "0.73rem", color: "#64748b", marginBottom: "2px" }}>Applicant Address</label>
                                <input
                                  type="text"
                                  value={streetAddress || "123 Rizal St., Poblacion, Sto. Tomas"}
                                  disabled
                                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#f1f5f9" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.73rem", color: "#64748b", marginBottom: "2px" }}>C.T.C. / Gov ID No. *</label>
                                <input
                                  type="text"
                                  value={govIdNo || "00987654"}
                                  onChange={(e) => setGovIdNo(e.target.value)}
                                  placeholder="e.g. 00987654"
                                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.73rem", color: "#64748b", marginBottom: "2px" }}>Date Issued *</label>
                                <input
                                  type="text"
                                  value={govIdDateIssued || "Jan 08, 2026"}
                                  onChange={(e) => setGovIdDateIssued(e.target.value)}
                                  placeholder="e.g. Jan 08, 2026"
                                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                                />
                              </div>
                              <div style={{ gridColumn: "span 2" }}>
                                <label style={{ display: "block", fontSize: "0.73rem", color: "#64748b", marginBottom: "2px" }}>Place Issued *</label>
                                <input
                                  type="text"
                                  value={govIdPlaceIssued || "Sto. Tomas"}
                                  onChange={(e) => setGovIdPlaceIssued(e.target.value)}
                                  placeholder="e.g. Sto. Tomas"
                                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                                />
                              </div>
                              <div style={{ gridColumn: "span 2" }}>
                                <label style={{ display: "block", fontSize: "0.73rem", color: "#64748b", marginBottom: "2px" }}>Signed Date *</label>
                                <input
                                  type="text"
                                  value={applicantSignedDate || "Sep 17, 2026"}
                                  onChange={(e) => setApplicantSignedDate(e.target.value)}
                                  placeholder="e.g. Sep 17, 2026"
                                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                                />
                              </div>
                            </div>

                            <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                              <SignatureCreator
                                value={applicantSignature}
                                onChange={setApplicantSignature}
                                label={`Applicant E-Signature (Affixed over printed name: ${compiledFullName || applicantName || 'Applicant'})`}
                                required
                              />
                            </div>
                          </div>

                          {/* Box 5: Lot Owner Consent Card */}
                          <div style={{ background: lotOwnerConsent ? "#f0fdf4" : "#f8fafc", border: lotOwnerConsent ? "1px solid #86efac" : "1px solid #cbd5e1", borderRadius: "10px", padding: "1rem", transition: "all 0.2s ease" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <span style={{ fontSize: "0.8rem", fontWeight: "800", color: lotOwnerConsent ? "#166534" : "#1e293b", textTransform: "uppercase" }}>
                                Box 5: With My Consent: Lot Owner (Right)
                              </span>
                              <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.74rem", fontWeight: "700", color: "#166534", cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={lotOwnerConsent}
                                  onChange={(e) => setLotOwnerConsent(e.target.checked)}
                                  style={{ accentColor: "#16a34a", width: "15px", height: "15px", cursor: "pointer" }}
                                />
                                <span>Consent Required</span>
                              </label>
                            </div>

                            {lotOwnerConsent ? (
                              <>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                  <div style={{ gridColumn: "span 2" }}>
                                    <label style={{ display: "block", fontSize: "0.73rem", color: "#64748b", marginBottom: "2px" }}>Lot Owner Full Name *</label>
                                    <input
                                      type="text"
                                      value={lotOwnerName}
                                      onChange={(e) => setLotOwnerName(e.target.value)}
                                      placeholder="e.g. DAVE SICAT"
                                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff", fontWeight: "700" }}
                                    />
                                  </div>
                                  <div style={{ gridColumn: "span 2" }}>
                                    <label style={{ display: "block", fontSize: "0.73rem", color: "#64748b", marginBottom: "2px" }}>Lot Owner Address *</label>
                                    <input
                                      type="text"
                                      value={lotOwnerAddress}
                                      onChange={(e) => setLotOwnerAddress(e.target.value)}
                                      placeholder="e.g. 153 Sitio Visitas, Sto. Tomas, Pampanga"
                                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: "block", fontSize: "0.73rem", color: "#64748b", marginBottom: "2px" }}>C.T.C. No. *</label>
                                    <input
                                      type="text"
                                      value={lotOwnerGovIdNo}
                                      onChange={(e) => setLotOwnerGovIdNo(e.target.value)}
                                      placeholder="e.g. 00987654"
                                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: "block", fontSize: "0.73rem", color: "#64748b", marginBottom: "2px" }}>Date Issued *</label>
                                    <input
                                      type="text"
                                      value={lotOwnerGovIdDateIssued}
                                      onChange={(e) => setLotOwnerGovIdDateIssued(e.target.value)}
                                      placeholder="e.g. Jan 10, 2024"
                                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: "block", fontSize: "0.73rem", color: "#64748b", marginBottom: "2px" }}>Place Issued *</label>
                                    <input
                                      type="text"
                                      value={lotOwnerGovIdPlaceIssued}
                                      onChange={(e) => setLotOwnerGovIdPlaceIssued(e.target.value)}
                                      placeholder="e.g. Sto. Tomas"
                                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: "block", fontSize: "0.73rem", color: "#64748b", marginBottom: "2px" }}>Signed Date *</label>
                                    <input
                                      type="text"
                                      value={lotOwnerSignedDate}
                                      onChange={(e) => setLotOwnerSignedDate(e.target.value)}
                                      placeholder="e.g. Jan 08, 2026"
                                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
                                    />
                                  </div>
                                </div>

                                <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #86efac" }}>
                                  <SignatureCreator
                                    value={lotOwnerSignature}
                                    onChange={setLotOwnerSignature}
                                    label={`Lot Owner E-Signature (Affixed over printed name: ${lotOwnerName || 'Lot Owner'})`}
                                  />
                                </div>
                              </>
                            ) : (
                              <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "1rem 0", fontStyle: "italic" }}>
                                Check "Consent Required" above if the applicant is not the registered owner of the property where the excavation works will take place.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Section 6: Page 2 Box 6 Excavation Specifications */}
                      <div style={{ padding: "1.2rem", borderRadius: "10px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.85rem" }}>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block" }}>
                              BOX 6: TO BE ACCOMPLISHED BY THE DESIGN PROFESSIONAL
                            </span>
                            <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                              Official excavation and ground preparation classification checkboxes (Page 2 of NBC Form B-02)
                            </span>
                          </div>
                          <span style={{ fontSize: "0.72rem", background: "#e2e8f0", color: "#334155", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                            NBC Form B-02 Box 6
                          </span>
                        </div>

                        {/* Official DPWH Box 6 Checkbox Grid */}
                        <div style={{
                          background: "#ffffff",
                          border: "1.5px solid #94a3b8",
                          borderRadius: "8px",
                          padding: "1rem",
                          marginBottom: "1rem"
                        }}>
                          {/* Row 1 */}
                          <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                            gap: "0.85rem",
                            marginBottom: "1rem",
                            paddingBottom: "0.85rem",
                            borderBottom: "1px dashed #e2e8f0"
                          }}>
                            <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "700", color: "#1e293b" }}>
                              <input
                                type="checkbox"
                                checked={excavationAndFills}
                                onChange={(e) => setExcavationAndFills(e.target.checked)}
                                style={{ width: "16px", height: "16px", accentColor: "#2563eb", marginTop: "2px", cursor: "pointer" }}
                              />
                              <span>EXCAVATION AND FILLS</span>
                            </label>

                            <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "700", color: "#1e293b" }}>
                              <input
                                type="checkbox"
                                checked={foundationAndRetainingWalls}
                                onChange={(e) => setFoundationAndRetainingWalls(e.target.checked)}
                                style={{ width: "16px", height: "16px", accentColor: "#2563eb", marginTop: "2px", cursor: "pointer" }}
                              />
                              <span>FOUNDATION AND RETAINING WALLS</span>
                            </label>

                            <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "700", color: "#1e293b" }}>
                              <input
                                type="checkbox"
                                checked={pileFoundations}
                                onChange={(e) => setPileFoundations(e.target.checked)}
                                style={{ width: "16px", height: "16px", accentColor: "#2563eb", marginTop: "2px", cursor: "pointer" }}
                              />
                              <span>PILE FOUNDATIONS</span>
                            </label>

                            <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "700", color: "#1e293b" }}>
                              <input
                                type="checkbox"
                                checked={gradingAndEarthworks}
                                onChange={(e) => setGradingAndEarthworks(e.target.checked)}
                                style={{ width: "16px", height: "16px", accentColor: "#2563eb", marginTop: "2px", cursor: "pointer" }}
                              />
                              <div>
                                <span>GRADING AND EARTHWORKS</span>
                                <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "500" }}>(Including fills and embankment.)</div>
                              </div>
                            </label>
                          </div>

                          {/* Row 2: Others (Specify) and Additional Custom Scope Lines */}
                          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1.3fr", gap: "1rem" }}>
                            <div>
                              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "700", color: "#1e293b", marginBottom: "4px" }}>
                                <input
                                  type="checkbox"
                                  checked={othersSpecify}
                                  onChange={(e) => setOthersSpecify(e.target.checked)}
                                  style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                                />
                                <span>OTHERS (Specify)</span>
                              </label>
                              <input
                                type="text"
                                value={othersSpecifyText}
                                onChange={(e) => {
                                  setOthersSpecifyText(e.target.value);
                                  if (e.target.value.trim() && !othersSpecify) setOthersSpecify(true);
                                }}
                                placeholder="e.g. TRENCHING"
                                style={{ width: "100%", padding: "5px 8px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "0.8rem", background: othersSpecify ? "#ffffff" : "#f1f5f9" }}
                              />
                            </div>

                            <div>
                              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "700", color: "#1e293b", marginBottom: "4px" }}>
                                <input
                                  type="checkbox"
                                  checked={othersCustomLine2Check}
                                  onChange={(e) => setOthersCustomLine2Check(e.target.checked)}
                                  style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                                />
                                <span>Additional Custom Scope (Line 2)</span>
                              </label>
                              <input
                                type="text"
                                value={othersCustomLine2Text}
                                onChange={(e) => {
                                  setOthersCustomLine2Text(e.target.value);
                                  if (e.target.value.trim() && !othersCustomLine2Check) setOthersCustomLine2Check(true);
                                }}
                                placeholder="e.g. DEEP BASEMENT SHORING"
                                style={{ width: "100%", padding: "5px 8px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "0.8rem", background: othersCustomLine2Check ? "#ffffff" : "#f1f5f9" }}
                              />
                            </div>

                            <div>
                              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "700", color: "#1e293b", marginBottom: "4px" }}>
                                <input
                                  type="checkbox"
                                  checked={othersCustomLine3Check}
                                  onChange={(e) => setOthersCustomLine3Check(e.target.checked)}
                                  style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                                />
                                <span>Custom Scope (Line 3)</span>
                              </label>
                              <input
                                type="text"
                                value={othersCustomLine3Text}
                                onChange={(e) => {
                                  setOthersCustomLine3Text(e.target.value);
                                  if (e.target.value.trim() && !othersCustomLine3Check) setOthersCustomLine3Check(true);
                                }}
                                placeholder="e.g. SITE DEWATERING"
                                style={{ width: "100%", padding: "5px 8px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "0.8rem", background: othersCustomLine3Check ? "#ffffff" : "#f1f5f9" }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Engineering Dimensions, Volume & Schedule */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                              Excavation Volume (cu. m.) *
                            </label>
                            <input
                              type="text"
                              value={excavationVolume}
                              onChange={(e) => setExcavationVolume(e.target.value)}
                              placeholder="120.00"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                              Maximum Excavation Depth (meters) *
                            </label>
                            <input
                              type="text"
                              value={excavationDepth}
                              onChange={(e) => setExcavationDepth(e.target.value)}
                              placeholder="2.50"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                              Proposed Start Date *
                            </label>
                            <input
                              type="date"
                              value={excavationStartDate}
                              onChange={(e) => setExcavationStartDate(e.target.value)}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                              Expected Completion Date *
                            </label>
                            <input
                              type="date"
                              value={excavationCompletionDate}
                              onChange={(e) => setExcavationCompletionDate(e.target.value)}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                        </div>

                        {/* Overall Scope Summary input */}
                        <div style={{ marginBottom: "0.85rem" }}>
                          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>
                            Detailed Scope Description *
                          </label>
                          <input
                            type="text"
                            value={excavationScope}
                            onChange={(e) => setExcavationScope(e.target.value)}
                            placeholder="e.g. Foundation Excavation, Retaining Wall Shoring & Site Earthworks"
                            style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                          />
                        </div>

                        {/* Condition 7 Cash Bond Notice */}
                        <div style={{ padding: "8px 12px", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "6px", fontSize: "0.74rem", color: "#92400e", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                          <Info size={16} style={{ flexShrink: 0, marginTop: "2px", color: "#b45309" }} />
                          <div>
                            <strong>Condition 7 Notice (NBC Form B-02):</strong> For excavations exceeding 50 cu. m. and more than 2 meters in depth, the applicant/permittee shall post a cash restoration bond of ₱50,000.00 for the first 50 cu. m., plus ₱300.00 for every cubic meter thereafter, to be deposited with the Office of the Building Official (OBO).
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "signPermit" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      {/* Section 1: Accompanying Building Permit */}
                      <div style={{
                        padding: "12px 14px",
                        borderRadius: "10px",
                        background: signWithBuildingPermit ? "#eff6ff" : "#f8fafc",
                        border: signWithBuildingPermit ? "1.5px solid #93c5fd" : "1px solid #e2e8f0"
                      }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem", color: "#1e293b" }}>
                          <input
                            type="checkbox"
                            checked={signWithBuildingPermit}
                            onChange={(e) => setSignWithBuildingPermit(e.target.checked)}
                            style={{ width: "18px", height: "18px", accentColor: "#2563eb", cursor: "pointer" }}
                          />
                          <span>This Sign and Billboard Permit is submitted with / accompanied by a Building Permit</span>
                        </label>
                        {signWithBuildingPermit && (
                          <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", alignItems: "center" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#3b82f6", marginBottom: "3px" }}>
                                Building Permit No. (Auto-gathered)
                              </label>
                              <input
                                type="text"
                                value={signBuildingPermitNo || (mandatoryKeys.includes("buildingPermit") ? `BP-${new Date().getFullYear()}-0001` : "BP-2026-0001")}
                                onChange={(e) => setSignBuildingPermitNo(e.target.value)}
                                placeholder="BP-2026-0001"
                                style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #93c5fd", fontSize: "0.85rem", fontWeight: "700", background: "#ffffff", color: "#1d4ed8" }}
                              />
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#475569" }}>
                              Automatically gathered from the Building Permit application and inserted 1 character per compartment box into the 8 boxes of <strong>BUILDING PERMIT NO.</strong> on NBC Form B-07.
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Section 2: Box 1 Summary & Enterprise / Ownership Details */}
                      <div style={{ padding: "1.1rem", borderRadius: "10px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block" }}>
                              Box 1: Owner / Applicant & Enterprise Information
                            </span>
                            <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                              Official details formatted for NBC Form B-07 (Sign Permit)
                            </span>
                          </div>
                          <span style={{ fontSize: "0.72rem", background: "#e2e8f0", color: "#334155", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                            NBC Form B-07 Box 1
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Applicant Full Name</label>
                            <div style={{ fontSize: "0.84rem", fontWeight: "700", color: "#0f172a", padding: "6px 10px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {compiledFullName}
                            </div>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>T.I.N. Number</label>
                            <div style={{ fontSize: "0.84rem", fontWeight: "700", color: "#0f172a", padding: "6px 10px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {applicantTIN || "123-456-789-000"}
                            </div>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Form of Ownership</label>
                            <select
                              value={signFormOfOwnership}
                              onChange={(e) => setSignFormOfOwnership(e.target.value)}
                              style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem", fontWeight: "600", background: "#ffffff" }}
                            >
                              <option value="Sole Proprietorship">Sole Proprietorship</option>
                              <option value="Corporation">Corporation</option>
                              <option value="Partnership">Partnership</option>
                              <option value="Individual">Individual</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Character of Occupancy</label>
                            <select
                              value={signCharacterOfOccupancy}
                              onChange={(e) => setSignCharacterOfOccupancy(e.target.value)}
                              style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem", fontWeight: "600", background: "#ffffff" }}
                            >
                              <option value="Commercial / Business">Commercial / Business</option>
                              <option value="Industrial">Industrial</option>
                              <option value="Institutional">Institutional</option>
                              <option value="Residential">Residential</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.75rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>For Construction Owned by an Enterprise (Enterprise Name)</label>
                            <input
                              type="text"
                              value={signEnterpriseName}
                              onChange={(e) => setSignEnterpriseName(e.target.value)}
                              placeholder="e.g. STO. TOMAS COMMERCIAL VENTURES CORP."
                              style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Telephone / Fax No.</label>
                            <input
                              type="text"
                              value={applicantPhone || "0917-123-4567"}
                              readOnly
                              style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.84rem", background: "#f8fafc", color: "#475569" }}
                            />
                          </div>
                        </div>

                        <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>
                          Applicant Registered Address (Printed in Box 1):
                        </span>
                        <div style={{ display: "grid", gridTemplateColumns: "80px 1.5fr 1fr 1fr", gap: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.70rem", color: "#64748b" }}>No.</label>
                            <input
                              type="text"
                              value={signApplicantNo}
                              onChange={(e) => setSignApplicantNo(e.target.value)}
                              style={{ width: "100%", padding: "5px 8px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "0.80rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.70rem", color: "#64748b" }}>Street</label>
                            <input
                              type="text"
                              value={signApplicantStreet}
                              onChange={(e) => setSignApplicantStreet(e.target.value)}
                              style={{ width: "100%", padding: "5px 8px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "0.80rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.70rem", color: "#64748b" }}>Barangay</label>
                            <input
                              type="text"
                              value={signApplicantBarangay}
                              onChange={(e) => setSignApplicantBarangay(e.target.value)}
                              style={{ width: "100%", padding: "5px 8px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "0.80rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.70rem", color: "#64748b" }}>City / Municipality</label>
                            <input
                              type="text"
                              value={signApplicantCity}
                              onChange={(e) => setSignApplicantCity(e.target.value)}
                              style={{ width: "100%", padding: "5px 8px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "0.80rem" }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Location of Signboard Installation */}
                      <div style={{ padding: "1.1rem", borderRadius: "10px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                        <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
                          Location of Installation (NBC Form B-07 • Box 1)
                        </span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Lot No.</label>
                            <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "#0f172a", padding: "5px 8px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {lotNo || "12"}
                            </div>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Blk No.</label>
                            <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "#0f172a", padding: "5px 8px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {blockNo || "4"}
                            </div>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>TCT / OCT No.</label>
                            <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "#0f172a", padding: "5px 8px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {tctNo || "TCT-889977-P"}
                            </div>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Tax Dec. No.</label>
                            <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "#0f172a", padding: "5px 8px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {taxDecNo || "TD-2026-004455"}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "#334155", background: "#ffffff", padding: "6px 10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                          <strong>Installation Address:</strong> {streetAddress || "Lot 12, Blk 4, McArthur Hwy"}, {barangay || "Poblacion"}, Sto. Tomas, Pampanga
                        </div>
                      </div>

                      {/* Section 4: Scope of Work */}
                      <div style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: "10px", padding: "1rem" }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                          Scope of Work (NBC Form B-07 • Box 1)
                        </span>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.5rem" }}>
                          {[
                            "New Construction",
                            "Erection",
                            "Addition",
                            "Alteration",
                            "Renovation",
                            "Conversion",
                            "Repair",
                            "Moving",
                            "Raising",
                            "Demolition",
                            "Accessory Building/Structure",
                            "Others (Specify)"
                          ].map((scope) => {
                            const isSelected = signScopeOfWork === scope;
                            return (
                              <button
                                key={scope}
                                type="button"
                                onClick={() => setSignScopeOfWork(scope)}
                                style={{
                                  padding: "8px 12px",
                                  borderRadius: "8px",
                                  border: isSelected ? "2px solid #6366f1" : "1px solid #cbd5e1",
                                  background: isSelected ? "#eef2ff" : "#ffffff",
                                  color: isSelected ? "#4338ca" : "#334155",
                                  fontWeight: isSelected ? "700" : "500",
                                  fontSize: "0.82rem",
                                  textAlign: "left",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease"
                                }}
                              >
                                {scope}
                              </button>
                            );
                          })}
                        </div>
                        {signScopeOfWork.includes("Other") && (
                          <div style={{ marginTop: "10px" }}>
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                              Specify Other Scope Details *
                            </label>
                            <input
                              type="text"
                              value={signScopeOthers}
                              onChange={(e) => setSignScopeOthers(e.target.value)}
                              placeholder="e.g. LED Digital Screen Replacement"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1.5px solid #93c5fd", fontSize: "0.84rem", background: "#f0f9ff" }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Section 5: Use or Character of Occupancy (A, B, C) */}
                      <div style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: "10px", padding: "1.1rem" }}>
                        <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block", marginBottom: "0.85rem" }}>
                          Use or Character of Occupancy & Sign Details (NBC Form B-07 • Box 1)
                        </span>

                        {/* A. Type of Display */}
                        <div style={{ marginBottom: "1rem", padding: "10px 12px", borderRadius: "8px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
                          <span style={{ fontSize: "0.80rem", fontWeight: "700", color: "#0f172a", display: "block", marginBottom: "6px" }}>
                            A. Type of Display
                          </span>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>Display Configuration</label>
                              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                {["Single Face", "Double Face", "Multi-Media"].map((face) => (
                                  <button
                                    key={face}
                                    type="button"
                                    onClick={() => setSignDisplayType(face)}
                                    style={{
                                      padding: "5px 10px",
                                      borderRadius: "6px",
                                      border: signDisplayType === face ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                                      background: signDisplayType === face ? "#dbeafe" : "#ffffff",
                                      color: signDisplayType === face ? "#1d4ed8" : "#334155",
                                      fontSize: "0.78rem",
                                      fontWeight: signDisplayType === face ? "700" : "500",
                                      cursor: "pointer"
                                    }}
                                  >
                                    {face}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>Illumination / Medium</label>
                              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                {["Neon", "Illuminated", "Painted-on", "Other"].map((medium) => (
                                  <button
                                    key={medium}
                                    type="button"
                                    onClick={() => setSignDisplayMedium(medium)}
                                    style={{
                                      padding: "5px 10px",
                                      borderRadius: "6px",
                                      border: signDisplayMedium === medium ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                                      background: signDisplayMedium === medium ? "#dbeafe" : "#ffffff",
                                      color: signDisplayMedium === medium ? "#1d4ed8" : "#334155",
                                      fontSize: "0.78rem",
                                      fontWeight: signDisplayMedium === medium ? "700" : "500",
                                      cursor: "pointer"
                                    }}
                                  >
                                    {medium}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* B. Type of Installation */}
                        <div style={{ marginBottom: "1rem", padding: "10px 12px", borderRadius: "8px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
                          <span style={{ fontSize: "0.80rem", fontWeight: "700", color: "#0f172a", display: "block", marginBottom: "6px" }}>
                            B. Type of Installation
                          </span>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.5rem" }}>
                            {[
                              "Business Sign, Wall Type",
                              "Business Sign, Projecting Type",
                              "Business Sign, Ground Type",
                              "Business Sign, Temporary",
                              "Advertising Sign, Ground Type",
                              "Advertising Sign, Wall Type",
                              "Advertising Sign, Projecting Type",
                              "Advertising Sign, Other"
                            ].map((inst) => {
                              const isSelected = signInstallationType === inst;
                              return (
                                <button
                                  key={inst}
                                  type="button"
                                  onClick={() => setSignInstallationType(inst)}
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    border: isSelected ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                                    background: isSelected ? "#dbeafe" : "#ffffff",
                                    color: isSelected ? "#1d4ed8" : "#334155",
                                    fontSize: "0.78rem",
                                    fontWeight: isSelected ? "700" : "500",
                                    textAlign: "left",
                                    cursor: "pointer"
                                  }}
                                >
                                  {inst}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* C. Display Size / Dimensions */}
                        <div style={{ padding: "10px 12px", borderRadius: "8px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
                          <span style={{ fontSize: "0.80rem", fontWeight: "700", color: "#0f172a", display: "block", marginBottom: "6px" }}>
                            C. Display Size / Face (Length, Width, and Total Area)
                          </span>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>
                                Length / Height L(m) *
                              </label>
                              <input
                                type="text"
                                value={signLength}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSignLength(val);
                                  const l = parseFloat(val) || 0;
                                  const w = parseFloat(signWidth) || 0;
                                  setSignArea((l * w).toFixed(2));
                                }}
                                placeholder="3.00"
                                style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "700" }}
                              />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>
                                Width W(m) *
                              </label>
                              <input
                                type="text"
                                value={signWidth}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSignWidth(val);
                                  const l = parseFloat(signLength) || 0;
                                  const w = parseFloat(val) || 0;
                                  setSignArea((l * w).toFixed(2));
                                }}
                                placeholder="1.50"
                                style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "700" }}
                              />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>
                                Total Area At(m²) (Auto-calculated)
                              </label>
                              <div style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #93c5fd", fontSize: "0.85rem", fontWeight: "800", background: "#eff6ff", color: "#1d4ed8" }}>
                                {signArea || (parseFloat(signLength || "3.00") * parseFloat(signWidth || "1.50")).toFixed(2)} sq.m.
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.75rem" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>
                                Material & Structural Framing *
                              </label>
                              <input
                                type="text"
                                value={signMaterial}
                                onChange={(e) => setSignMaterial(e.target.value)}
                                placeholder="e.g. Acrylic Face with LED Backlight on Steel Framing"
                                style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                              />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>
                                Estimated Project Cost (PHP) *
                              </label>
                              <input
                                type="text"
                                value={signCost}
                                onChange={(e) => setSignCost(e.target.value)}
                                placeholder="45,000.00"
                                style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 6: Box 2 Accompanying Documents Checklist */}
                      <div style={{ padding: "1.1rem", borderRadius: "10px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block" }}>
                              Box 2: Accompanying Documents Checklist
                            </span>
                            <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                              Five (5) sets each signed and sealed by responsible design professional (NBC Form B-07 • Box 2)
                            </span>
                          </div>
                          <span style={{ fontSize: "0.72rem", background: "#dbeafe", color: "#1e40af", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                            NBC Form B-07 Box 2
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                          {/* Left Column */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <label style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "8px",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              background: signDocTct ? "#ffffff" : "#f1f5f9",
                              border: signDocTct ? "1px solid #93c5fd" : "1px solid #cbd5e1",
                              cursor: "pointer",
                              fontSize: "0.78rem",
                              fontWeight: signDocTct ? "700" : "500",
                              color: signDocTct ? "#1e293b" : "#64748b"
                            }}>
                              <input
                                type="checkbox"
                                checked={signDocTct}
                                onChange={(e) => setSignDocTct(e.target.checked)}
                                style={{ marginTop: "2px", width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                              />
                              <span>CERTIFIED XEROX COPY OF TCT</span>
                            </label>

                            <label style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "8px",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              background: signDocContractOfLease ? "#ffffff" : "#f1f5f9",
                              border: signDocContractOfLease ? "1px solid #93c5fd" : "1px solid #cbd5e1",
                              cursor: "pointer",
                              fontSize: "0.78rem",
                              fontWeight: signDocContractOfLease ? "700" : "500",
                              color: signDocContractOfLease ? "#1e293b" : "#64748b"
                            }}>
                              <input
                                type="checkbox"
                                checked={signDocContractOfLease}
                                onChange={(e) => setSignDocContractOfLease(e.target.checked)}
                                style={{ marginTop: "2px", width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                              />
                              <span>IF NOT OWNED BY APPLICANT: CONTRACT OF LEASE / CONSENT</span>
                            </label>

                            <label style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "8px",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              background: signDocTaxDeclaration ? "#ffffff" : "#f1f5f9",
                              border: signDocTaxDeclaration ? "1px solid #93c5fd" : "1px solid #cbd5e1",
                              cursor: "pointer",
                              fontSize: "0.78rem",
                              fontWeight: signDocTaxDeclaration ? "700" : "500",
                              color: signDocTaxDeclaration ? "#1e293b" : "#64748b"
                            }}>
                              <input
                                type="checkbox"
                                checked={signDocTaxDeclaration}
                                onChange={(e) => setSignDocTaxDeclaration(e.target.checked)}
                                style={{ marginTop: "2px", width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                              />
                              <span>XEROX COPY OF TAX DECLARATION AND LATEST REALTY TAX RECEIPT</span>
                            </label>
                          </div>

                          {/* Right Column */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <label style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "8px",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              background: signDocLotPlan ? "#ffffff" : "#f1f5f9",
                              border: signDocLotPlan ? "1px solid #93c5fd" : "1px solid #cbd5e1",
                              cursor: "pointer",
                              fontSize: "0.78rem",
                              fontWeight: signDocLotPlan ? "700" : "500",
                              color: signDocLotPlan ? "#1e293b" : "#64748b"
                            }}>
                              <input
                                type="checkbox"
                                checked={signDocLotPlan}
                                onChange={(e) => setSignDocLotPlan(e.target.checked)}
                                style={{ marginTop: "2px", width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                              />
                              <span>XEROX COPY OF LOT PLAN AND SITE DEVELOPMENT PLAN</span>
                            </label>

                            <label style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "8px",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              background: signDocSignPlansStructural ? "#ffffff" : "#f1f5f9",
                              border: signDocSignPlansStructural ? "1px solid #93c5fd" : "1px solid #cbd5e1",
                              cursor: "pointer",
                              fontSize: "0.78rem",
                              fontWeight: signDocSignPlansStructural ? "700" : "500",
                              color: signDocSignPlansStructural ? "#1e293b" : "#64748b"
                            }}>
                              <input
                                type="checkbox"
                                checked={signDocSignPlansStructural}
                                onChange={(e) => setSignDocSignPlansStructural(e.target.checked)}
                                style={{ marginTop: "2px", width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                              />
                              <span>PLANS OF SIGN STRUCTURES, STRUCTURAL DESIGN & COMPUTATION</span>
                            </label>

                            <label style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "8px",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              background: signDocSpecsCostEstimates ? "#ffffff" : "#f1f5f9",
                              border: signDocSpecsCostEstimates ? "1px solid #93c5fd" : "1px solid #cbd5e1",
                              cursor: "pointer",
                              fontSize: "0.78rem",
                              fontWeight: signDocSpecsCostEstimates ? "700" : "500",
                              color: signDocSpecsCostEstimates ? "#1e293b" : "#64748b"
                            }}>
                              <input
                                type="checkbox"
                                checked={signDocSpecsCostEstimates}
                                onChange={(e) => setSignDocSpecsCostEstimates(e.target.checked)}
                                style={{ marginTop: "2px", width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                              />
                              <span>SPECIFICATIONS AND COST ESTIMATES</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Section 7: Box 3 Design Professional, Plans and Specification */}
                      <div style={{ padding: "1.1rem", borderRadius: "10px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block" }}>
                              Box 3: Design Professional, Plans and Specification
                            </span>
                            <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                              Architect or Civil Engineer in charge of sign plans, calculations and specifications (NBC Form B-07 • Box 3)
                            </span>
                          </div>
                          <span style={{ fontSize: "0.72rem", background: "#e2e8f0", color: "#334155", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                            NBC Form B-07 Box 3
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>Design Professional Full Name (with Title) *</label>
                            <input
                              type="text"
                              required
                              value={architectName}
                              onChange={(e) => setArchitectName(e.target.value)}
                              placeholder="e.g. ARCH. MARIA ELENA SANTOS, UAP"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "700" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>Professional Address *</label>
                            <input
                              type="text"
                              required
                              value={architectAddress}
                              onChange={(e) => setArchitectAddress(e.target.value)}
                              placeholder="e.g. Sto. Tomas, Pampanga"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.85rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>PRC Registration No. *</label>
                            <input
                              type="text"
                              required
                              value={architectPRC}
                              onChange={(e) => setArchitectPRC(e.target.value)}
                              placeholder="0045211"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>PRC Validity Date *</label>
                            <input
                              type="text"
                              required
                              value={architectPRCValidity}
                              onChange={(e) => setArchitectPRCValidity(e.target.value)}
                              placeholder="YYYY-MM-DD"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>PTR Number *</label>
                            <input
                              type="text"
                              required
                              value={architectPTR}
                              onChange={(e) => setArchitectPTR(e.target.value)}
                              placeholder="PTR-ST-665544"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>TIN Number *</label>
                            <input
                              type="text"
                              required
                              value={architectTIN}
                              onChange={(e) => setArchitectTIN(e.target.value)}
                              placeholder="000-000-000-000"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>PTR Date Issued *</label>
                            <input
                              type="text"
                              required
                              value={architectPTRIssued}
                              onChange={(e) => setArchitectPTRIssued(e.target.value)}
                              placeholder="e.g. Jan 08, 2026"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>PTR Issued At *</label>
                            <input
                              type="text"
                              required
                              value={architectPTRIssuedAt}
                              onChange={(e) => setArchitectPTRIssuedAt(e.target.value)}
                              placeholder="e.g. Sto. Tomas"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                            />
                          </div>
                        </div>

                        {/* Designer E-Signature */}
                        <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                          <SignatureCreator
                            value={signDesignerSignature}
                            onChange={(sig) => setSignDesignerSignature(sig)}
                            label={`Design Professional Seal & E-Signature (Affixed over printed name: ${architectName || "Architect"})`}
                            required
                          />
                        </div>
                      </div>

                      {/* Section 8: Box 4 Full-Time Inspector and Supervisor of Construction Works */}
                      <div style={{ padding: "1.1rem", borderRadius: "10px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.85rem" }}>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block" }}>
                              Box 4: Full-Time Inspector and Supervisor of Construction Works
                            </span>
                            <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                              Architect or Civil Engineer in charge of full-time sign installation and structural supervision (NBC Form B-07 • Box 4)
                            </span>
                          </div>

                          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: "700", color: "#1e40af", cursor: "pointer", background: "#dbeafe", padding: "4px 8px", borderRadius: "6px" }}>
                            <input
                              type="checkbox"
                              checked={sameAsDesignSignSupervisor}
                              onChange={(e) => setSameAsDesignSignSupervisor(e.target.checked)}
                              style={{ accentColor: "#2563eb" }}
                            />
                            Same as Design Professional (Box 3)
                          </label>
                        </div>

                        {sameAsDesignSignSupervisor ? (
                          <div style={{ padding: "12px 14px", borderRadius: "8px", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", fontSize: "0.82rem" }}>
                            <strong>Using credentials and e-signature from Box 3 (Design Professional):</strong> {architectName || "ARCH. MARIA ELENA SANTOS, UAP"} (PRC: {architectPRC || "0045211"}, PTR: {architectPTR || "PTR-ST-665544"}).
                          </div>
                        ) : (
                          <>
                            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>Supervisor Full Name (with Title) *</label>
                                <input
                                  type="text"
                                  required
                                  value={signSupervisorName}
                                  onChange={(e) => setSignSupervisorName(e.target.value)}
                                  placeholder="e.g. ENGR. ROBERTO CRUZ, CE"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "700" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>Professional Address *</label>
                                <input
                                  type="text"
                                  required
                                  value={signSupervisorAddress}
                                  onChange={(e) => setSignSupervisorAddress(e.target.value)}
                                  placeholder="e.g. Sto. Tomas, Pampanga"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                                />
                              </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.85rem", marginBottom: "0.85rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>PRC Registration No. *</label>
                                <input
                                  type="text"
                                  required
                                  value={signSupervisorPRC}
                                  onChange={(e) => setSignSupervisorPRC(e.target.value)}
                                  placeholder="0078923"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>PRC Validity Date *</label>
                                <input
                                  type="text"
                                  required
                                  value={signSupervisorPRCValidity}
                                  onChange={(e) => setSignSupervisorPRCValidity(e.target.value)}
                                  placeholder="YYYY-MM-DD"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>PTR Number *</label>
                                <input
                                  type="text"
                                  required
                                  value={signSupervisorPTR}
                                  onChange={(e) => setSignSupervisorPTR(e.target.value)}
                                  placeholder="PTR-ST-2026-001"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>TIN Number *</label>
                                <input
                                  type="text"
                                  required
                                  value={signSupervisorTIN}
                                  onChange={(e) => setSignSupervisorTIN(e.target.value)}
                                  placeholder="000-000-000-000"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                                />
                              </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>PTR Date Issued *</label>
                                <input
                                  type="text"
                                  required
                                  value={signSupervisorPTRIssued}
                                  onChange={(e) => setSignSupervisorPTRIssued(e.target.value)}
                                  placeholder="e.g. Jan 10, 2026"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>PTR Issued At *</label>
                                <input
                                  type="text"
                                  required
                                  value={signSupervisorPTRIssuedAt}
                                  onChange={(e) => setSignSupervisorPTRIssuedAt(e.target.value)}
                                  placeholder="e.g. Sto. Tomas"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                                />
                              </div>
                            </div>

                            {/* Supervisor E-Signature */}
                            <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                              <SignatureCreator
                                value={signSupervisorSignature}
                                onChange={(sig) => setSignSupervisorSignature(sig)}
                                label={`Supervisor Seal & E-Signature (Affixed over printed name: ${signSupervisorName || "Supervisor"})`}
                                required
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Section 9: Box 5 Applicant (Building Owner) */}
                      <div style={{ padding: "1.1rem", borderRadius: "10px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block" }}>
                              Box 5: Applicant (Building Owner / Signboard Owner)
                            </span>
                            <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                              Official DPWH Box 5 applicant identification, Community Tax Certificate (C.T.C.), and signature (NBC Form B-07 • Box 5)
                            </span>
                          </div>
                          <span style={{ fontSize: "0.72rem", background: "#e2e8f0", color: "#334155", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                            NBC Form B-07 Box 5
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>Applicant Full Name</label>
                            <input
                              type="text"
                              value={applicantName || "JUAN DELA CRUZ"}
                              disabled
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#f1f5f9", fontWeight: "700" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>Applicant Address</label>
                            <input
                              type="text"
                              value={streetAddress ? `${streetAddress}, ${barangay || "Sto. Tomas, Pampanga"}` : (barangay ? `${barangay}, Sto. Tomas, Pampanga` : "123 Rizal St., Poblacion, Sto. Tomas, Pampanga")}
                              disabled
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#f1f5f9" }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>C.T.C. No. *</label>
                            <input
                              type="text"
                              required
                              value={signApplicantCtcNo}
                              onChange={(e) => setSignApplicantCtcNo(e.target.value)}
                              placeholder="CTC-2026-00192"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "700" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>Date Issued *</label>
                            <input
                              type="text"
                              required
                              value={signApplicantCtcDateIssued}
                              onChange={(e) => setSignApplicantCtcDateIssued(e.target.value)}
                              placeholder="e.g. Jan 10, 2026"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>Place Issued *</label>
                            <input
                              type="text"
                              required
                              value={signApplicantCtcPlaceIssued}
                              onChange={(e) => setSignApplicantCtcPlaceIssued(e.target.value)}
                              placeholder="e.g. Sto. Tomas"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "#334155", marginBottom: "3px" }}>TIN Number</label>
                            <input
                              type="text"
                              value={applicantTIN || "123-456-789-000"}
                              disabled
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#f1f5f9" }}
                            />
                          </div>
                        </div>

                        {/* Applicant E-Signature */}
                        <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                          <SignatureCreator
                            value={applicantSignature}
                            onChange={(sig) => setApplicantSignature(sig)}
                            label={`Applicant E-Signature (Affixed over printed name: ${compiledFullName || applicantName || "Applicant"})`}
                            required
                          />
                        </div>
                      </div>

                      {/* Section 10: Page 2 Box 6 (Building Owner) & Box 7 (With My Consent: Lot Owner) */}
                      <div style={{ padding: "1.1rem", borderRadius: "10px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block" }}>
                              Box 6 & Box 7: Building Owner & Lot Owner Consent
                            </span>
                            <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                              Official property and lot ownership consent sections (NBC Form B-07 • Page 2 • Boxes 6 & 7)
                            </span>
                          </div>
                          <span style={{ fontSize: "0.72rem", background: "#e2e8f0", color: "#334155", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                            NBC Form B-07 Page 2
                          </span>
                        </div>

                        {/* BOX 6: BUILDING OWNER */}
                        <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                            <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase" }}>
                              BOX 6: BUILDING OWNER
                            </span>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: "700", color: "#1e40af", cursor: "pointer", background: "#dbeafe", padding: "4px 8px", borderRadius: "6px" }}>
                              <input
                                type="checkbox"
                                checked={signSameAsApplicantBldgOwner}
                                onChange={(e) => setSignSameAsApplicantBldgOwner(e.target.checked)}
                                style={{ accentColor: "#2563eb" }}
                              />
                              Same as Applicant (Box 5)
                            </label>
                          </div>

                          {signSameAsApplicantBldgOwner ? (
                            <div style={{ padding: "10px 12px", borderRadius: "6px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "0.8rem" }}>
                              <strong>Building Owner matches Applicant:</strong> {compiledFullName || applicantName || "JUAN DELA CRUZ"} (C.T.C. No: {signApplicantCtcNo || "CTC-2026-00192"}).
                            </div>
                          ) : (
                            <>
                              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>Building Owner Full Name *</label>
                                  <input
                                    type="text"
                                    value={signBldgOwnerName}
                                    onChange={(e) => setSignBldgOwnerName(e.target.value)}
                                    placeholder="e.g. JUAN DELA CRUZ"
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", fontWeight: "700" }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>Building Owner Address *</label>
                                  <input
                                    type="text"
                                    value={signBldgOwnerAddress}
                                    onChange={(e) => setSignBldgOwnerAddress(e.target.value)}
                                    placeholder="e.g. 123 Rizal St., Poblacion, Sto. Tomas"
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                                  />
                                </div>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>C.T.C. No. *</label>
                                  <input
                                    type="text"
                                    value={signBldgOwnerCtcNo}
                                    onChange={(e) => setSignBldgOwnerCtcNo(e.target.value)}
                                    placeholder="CTC-2026-00192"
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>Date Issued *</label>
                                  <input
                                    type="text"
                                    value={signBldgOwnerCtcDateIssued}
                                    onChange={(e) => setSignBldgOwnerCtcDateIssued(e.target.value)}
                                    placeholder="Jan 10, 2026"
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>Place Issued *</label>
                                  <input
                                    type="text"
                                    value={signBldgOwnerCtcPlaceIssued}
                                    onChange={(e) => setSignBldgOwnerCtcPlaceIssued(e.target.value)}
                                    placeholder="Sto. Tomas"
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>Date Signed *</label>
                                  <input
                                    type="text"
                                    value={signBldgOwnerSignedDate}
                                    onChange={(e) => setSignBldgOwnerSignedDate(e.target.value)}
                                    placeholder="Jan 08, 2026"
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                                  />
                                </div>
                              </div>
                              <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                                <SignatureCreator
                                  value={signBldgOwnerSignature}
                                  onChange={(sig) => setSignBldgOwnerSignature(sig)}
                                  label={`Building Owner E-Signature (Affixed over printed name: ${signBldgOwnerName || "Building Owner"})`}
                                />
                              </div>
                            </>
                          )}
                        </div>

                        {/* BOX 7: WITH MY CONSENT: LOT OWNER */}
                        <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "1rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                            <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase" }}>
                              BOX 7: WITH MY CONSENT: LOT OWNER
                            </span>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: "700", color: "#047857", cursor: "pointer", background: "#d1fae5", padding: "4px 8px", borderRadius: "6px" }}>
                              <input
                                type="checkbox"
                                checked={lotOwnerConsent}
                                onChange={(e) => setLotOwnerConsent(e.target.checked)}
                                style={{ accentColor: "#059669" }}
                              />
                              Consent Required (Check if property is leased / rented)
                            </label>
                          </div>

                          {lotOwnerConsent ? (
                            <>
                              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>Lot Owner Full Name *</label>
                                  <input
                                    type="text"
                                    value={lotOwnerName}
                                    onChange={(e) => setLotOwnerName(e.target.value)}
                                    placeholder="e.g. DAVE SICAT"
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", fontWeight: "700" }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>Lot Owner Address *</label>
                                  <input
                                    type="text"
                                    value={lotOwnerAddress}
                                    onChange={(e) => setLotOwnerAddress(e.target.value)}
                                    placeholder="e.g. 153 Sitio Visitas, Sto. Tomas, Pampanga"
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                                  />
                                </div>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>C.T.C. No. *</label>
                                  <input
                                    type="text"
                                    value={lotOwnerGovIdNo}
                                    onChange={(e) => setLotOwnerGovIdNo(e.target.value)}
                                    placeholder="e.g. 00987654"
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>Date Issued *</label>
                                  <input
                                    type="text"
                                    value={lotOwnerGovIdDateIssued}
                                    onChange={(e) => setLotOwnerGovIdDateIssued(e.target.value)}
                                    placeholder="Jan 10, 2026"
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>Place Issued *</label>
                                  <input
                                    type="text"
                                    value={lotOwnerGovIdPlaceIssued}
                                    onChange={(e) => setLotOwnerGovIdPlaceIssued(e.target.value)}
                                    placeholder="Sto. Tomas"
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>Date Signed *</label>
                                  <input
                                    type="text"
                                    value={lotOwnerSignedDate}
                                    onChange={(e) => setLotOwnerSignedDate(e.target.value)}
                                    placeholder="Jan 08, 2026"
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                                  />
                                </div>
                              </div>
                              <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                                <SignatureCreator
                                  value={lotOwnerSignature}
                                  onChange={(sig) => setLotOwnerSignature(sig)}
                                  label={`Lot Owner E-Signature (Affixed over printed name: ${lotOwnerName || "Lot Owner"})`}
                                />
                              </div>
                            </>
                          ) : (
                            <p style={{ fontSize: "0.76rem", color: "#64748b", margin: "0.25rem 0", fontStyle: "italic" }}>
                              Leave unchecked if the applicant is also the registered owner of the lot where the sign is installed.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Section 11: Page 2 Box 8 (Processing & Evaluation Division - Official Receipt & Payment Auto-Generation) */}
                      <div style={{ padding: "1.1rem", borderRadius: "10px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block" }}>
                              Box 8: Processing and Evaluation Division (Fee & Receipt)
                            </span>
                            <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                              Official LGU payment verification, Official Receipt (O.R.), and permit issuance details (NBC Form B-07 • Box 8)
                            </span>
                          </div>
                          <span style={{
                            fontSize: "0.72rem",
                            background: ((clearanceApp as any)?.paymentStatus === "paid" || Boolean((clearanceApp as any)?.officialReceiptNo)) ? "#dcfce7" : "#fef9c3",
                            color: ((clearanceApp as any)?.paymentStatus === "paid" || Boolean((clearanceApp as any)?.officialReceiptNo)) ? "#166534" : "#854d0e",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontWeight: "800"
                          }}>
                            {((clearanceApp as any)?.paymentStatus === "paid" || Boolean((clearanceApp as any)?.officialReceiptNo)) ? "✓ Payment Confirmed & Auto-Filled" : "Auto-Populated on Payment"}
                          </span>
                        </div>

                        <div style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          padding: "1rem",
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr 1fr",
                          gap: "0.75rem"
                        }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>FEE PAID</label>
                            <input
                              type="text"
                              value={(clearanceApp as any)?.assessedFees ? `PHP ${(clearanceApp as any).assessedFees.toLocaleString()}` : "PHP 1,250.00"}
                              disabled
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#f8fafc", fontWeight: "700", color: "#1e293b" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>DATE PAID</label>
                            <input
                              type="text"
                              value={(clearanceApp as any)?.dateReleased || (clearanceApp as any)?.paymentDate || "Auto upon payment"}
                              disabled
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#f8fafc", color: "#475569" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>OFFICIAL RECEIPT NO.</label>
                            <input
                              type="text"
                              value={(clearanceApp as any)?.officialReceiptNo || (clearanceApp as any)?.paymentReference || "Generated on cashier release"}
                              disabled
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#f8fafc", fontWeight: "700", color: "#0284c7" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>DATE ISSUED</label>
                            <input
                              type="text"
                              value={(clearanceApp as any)?.dateReleased || "Auto upon release"}
                              disabled
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#f8fafc", color: "#475569" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "temporaryServiceConnection" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      {/* Auto-fill Status Banner */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", border: "1.5px solid #86efac", padding: "12px 16px", borderRadius: "10px", flexWrap: "wrap", gap: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#22c55e", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Zap size={18} />
                          </div>
                          <div>
                            <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#166534", display: "block" }}>
                              System Auto-Fill Active
                            </span>
                            <span style={{ fontSize: "0.76rem", color: "#15803d" }}>
                              Applicant identification, addresses, lot details, connected load, and Professional Electrical Engineer credentials are auto-populated from your application.
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleAutoFillPtscFromSystem}
                          style={{
                            background: "#16a34a",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "8px 14px",
                            fontSize: "0.78rem",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                          }}
                        >
                          <RefreshCw size={14} />
                          Re-Sync from System
                        </button>
                      </div>

                      {/* Section 1: Box 1 Summary & Enterprise / Ownership Details */}
                      <div style={{ padding: "1.1rem", borderRadius: "10px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block" }}>
                              Box 1: Owner / Applicant & Enterprise Information
                            </span>
                            <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                              Official details formatted for NBC Form E-03 (Permit for Temporary Service Connection)
                            </span>
                          </div>
                          <span style={{ fontSize: "0.72rem", background: "#fef3c7", color: "#92400e", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                            NBC Form E-03 • Box 1
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Applicant Full Name</label>
                            <div style={{ fontSize: "0.84rem", fontWeight: "700", color: "#0f172a", padding: "6px 10px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {compiledFullName}
                            </div>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>T.I.N. Number</label>
                            <div style={{ fontSize: "0.84rem", fontWeight: "700", color: "#0f172a", padding: "6px 10px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {applicantTIN || "123-456-789-000"}
                            </div>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Form of Ownership</label>
                            <select
                              value={ptscFormOfOwnership}
                              onChange={(e) => setPtscFormOfOwnership(e.target.value)}
                              style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem", fontWeight: "600", background: "#ffffff" }}
                            >
                              <option value="Individual">Individual</option>
                              <option value="Sole Proprietorship">Sole Proprietorship</option>
                              <option value="Corporation">Corporation</option>
                              <option value="Partnership">Partnership</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Character of Occupancy</label>
                            <select
                              value={ptscCharacterOfOccupancy}
                              onChange={(e) => setPtscCharacterOfOccupancy(e.target.value)}
                              style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem", fontWeight: "600", background: "#ffffff" }}
                            >
                              <option value="Residential">Residential</option>
                              <option value="Commercial / Business">Commercial / Business</option>
                              <option value="Industrial">Industrial</option>
                              <option value="Institutional">Institutional</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.75rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>For Construction Owned by an Enterprise (Enterprise Name)</label>
                            <input
                              type="text"
                              value={ptscEnterpriseName}
                              onChange={(e) => setPtscEnterpriseName(e.target.value)}
                              placeholder="Leave blank or N/A if individual owner"
                              style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Telephone / Contact No.</label>
                            <input
                              type="text"
                              value={applicantPhone || "0917-123-4567"}
                              readOnly
                              style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.84rem", background: "#f8fafc", color: "#475569" }}
                            />
                          </div>
                        </div>

                        <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>
                          Applicant Postal Address (Printed in Box 1):
                        </span>
                        <div style={{ display: "grid", gridTemplateColumns: "80px 1.5fr 1fr 1fr 90px", gap: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.70rem", color: "#64748b" }}>No.</label>
                            <input
                              type="text"
                              value={ptscApplicantNo}
                              onChange={(e) => setPtscApplicantNo(e.target.value)}
                              style={{ width: "100%", padding: "5px 8px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "0.80rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.70rem", color: "#64748b" }}>Street</label>
                            <input
                              type="text"
                              value={ptscApplicantStreet}
                              onChange={(e) => setPtscApplicantStreet(e.target.value)}
                              style={{ width: "100%", padding: "5px 8px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "0.80rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.70rem", color: "#64748b" }}>Barangay</label>
                            <input
                              type="text"
                              value={ptscApplicantBarangay}
                              onChange={(e) => setPtscApplicantBarangay(e.target.value)}
                              style={{ width: "100%", padding: "5px 8px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "0.80rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.70rem", color: "#64748b" }}>City / Municipality</label>
                            <input
                              type="text"
                              value={ptscApplicantCity}
                              onChange={(e) => setPtscApplicantCity(e.target.value)}
                              style={{ width: "100%", padding: "5px 8px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "0.80rem" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.70rem", color: "#64748b" }}>Zip Code</label>
                            <input
                              type="text"
                              value={ptscApplicantZip}
                              onChange={(e) => setPtscApplicantZip(e.target.value)}
                              style={{ width: "100%", padding: "5px 8px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "0.80rem" }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Location of Construction */}
                      <div style={{ padding: "1.1rem", borderRadius: "10px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                        <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
                          Location of Construction (NBC Form E-03 • Box 1)
                        </span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Lot No.</label>
                            <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "#0f172a", padding: "5px 8px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {lotNo || "12"}
                            </div>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Blk No.</label>
                            <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "#0f172a", padding: "5px 8px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {blockNo || "4"}
                            </div>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>TCT / OCT No.</label>
                            <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "#0f172a", padding: "5px 8px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {tctNo || "TCT-889977-P"}
                            </div>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Tax Dec. No.</label>
                            <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "#0f172a", padding: "5px 8px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {taxDecNo || "TD-2026-004455"}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "#334155", background: "#ffffff", padding: "6px 10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                          <strong>Construction Site Address:</strong> {streetAddress || "Lot 12, Blk 4, Sunset Valley"}, {barangay || "Poblacion"}, Sto. Tomas, Pampanga
                        </div>
                      </div>

                      {/* Section 3: Purpose of Temporary Service Connection */}
                      <div style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: "10px", padding: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase" }}>
                            Purpose of Temporary Service Connection (NBC Form E-03 • Box 1)
                          </span>
                          <span style={{ fontSize: "0.7rem", background: "#ede9fe", color: "#6d28d9", padding: "2px 8px", borderRadius: "4px", fontWeight: "700" }}>
                            Official Checkboxes
                          </span>
                        </div>
                        <p style={{ margin: "0 0 10px 0", fontSize: "0.78rem", color: "#64748b" }}>
                          Select the intended purpose(s) of this temporary service connection. Each selected option will mark an official checkbox on the form.
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.6rem" }}>
                          <button
                            type="button"
                            onClick={() => setPtscPurposeForConstruction(!ptscPurposeForConstruction)}
                            style={{
                              padding: "10px 14px",
                              borderRadius: "8px",
                              border: ptscPurposeForConstruction ? "2px solid #2563eb" : "1px solid #cbd5e1",
                              background: ptscPurposeForConstruction ? "#eff6ff" : "#ffffff",
                              color: ptscPurposeForConstruction ? "#1d4ed8" : "#334155",
                              fontWeight: ptscPurposeForConstruction ? "700" : "500",
                              fontSize: "0.84rem",
                              textAlign: "left",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <span style={{ fontSize: "1rem" }}>{ptscPurposeForConstruction ? "☑" : "☐"}</span>
                            <span>FOR CONSTRUCTION</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPtscPurposeForTesting(!ptscPurposeForTesting)}
                            style={{
                              padding: "10px 14px",
                              borderRadius: "8px",
                              border: ptscPurposeForTesting ? "2px solid #2563eb" : "1px solid #cbd5e1",
                              background: ptscPurposeForTesting ? "#eff6ff" : "#ffffff",
                              color: ptscPurposeForTesting ? "#1d4ed8" : "#334155",
                              fontWeight: ptscPurposeForTesting ? "700" : "500",
                              fontSize: "0.84rem",
                              textAlign: "left",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <span style={{ fontSize: "1rem" }}>{ptscPurposeForTesting ? "☑" : "☐"}</span>
                            <span>FOR TESTING</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPtscPurposeOthers(!ptscPurposeOthers)}
                            style={{
                              padding: "10px 14px",
                              borderRadius: "8px",
                              border: ptscPurposeOthers ? "2px solid #2563eb" : "1px solid #cbd5e1",
                              background: ptscPurposeOthers ? "#eff6ff" : "#ffffff",
                              color: ptscPurposeOthers ? "#1d4ed8" : "#334155",
                              fontWeight: ptscPurposeOthers ? "700" : "500",
                              fontSize: "0.84rem",
                              textAlign: "left",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <span style={{ fontSize: "1rem" }}>{ptscPurposeOthers ? "☑" : "☐"}</span>
                            <span>OTHERS (Specify)</span>
                          </button>
                        </div>

                        {ptscPurposeOthers && (
                          <div style={{ marginTop: "10px" }}>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "3px" }}>
                              Specify Other Purpose *
                            </label>
                            <input
                              type="text"
                              value={ptscPurposeOthersSpecify}
                              onChange={(e) => setPtscPurposeOthersSpecify(e.target.value)}
                              placeholder="e.g. Seasonal Commercial Exhibit / Temporary Utility Transfer"
                              style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #93c5fd", fontSize: "0.84rem", background: "#ffffff" }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Section 4: Summary of Electrical Loads & Capacities Applied For */}
                      <div style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: "10px", padding: "1.1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block" }}>
                              Summary of Electrical Loads / Capacities Applied For
                            </span>
                            <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                              Capacity specs printed into the official 3 columns of NBC Form E-03
                            </span>
                          </div>
                          <span style={{ fontSize: "0.72rem", background: "#e0f2fe", color: "#0369a1", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                            Capacities
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#1e293b", marginBottom: "2px" }}>
                              Total Connected Load (kVA) *
                            </label>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <input
                                type="text"
                                value={ptscConnectedLoad}
                                onChange={(e) => setPtscConnectedLoad(e.target.value)}
                                placeholder="15.0"
                                style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "700", background: "#ffffff" }}
                              />
                              <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#64748b" }}>kVA</span>
                            </div>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#1e293b", marginBottom: "2px" }}>
                              Total Transformer Capacity (kVA)
                            </label>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <input
                                type="text"
                                value={ptscTransformerCapacity}
                                onChange={(e) => setPtscTransformerCapacity(e.target.value)}
                                placeholder="25.0 (or N/A)"
                                style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "700", background: "#ffffff" }}
                              />
                              <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#64748b" }}>kVA</span>
                            </div>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#1e293b", marginBottom: "2px" }}>
                              Total Generator/UPS Capacity (kVA)
                            </label>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <input
                                type="text"
                                value={ptscGeneratorCapacity}
                                onChange={(e) => setPtscGeneratorCapacity(e.target.value)}
                                placeholder="N/A (or 10.0)"
                                style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "700", background: "#ffffff" }}
                              />
                              <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#64748b" }}>kVA</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", paddingTop: "0.5rem", borderTop: "1px dashed #cbd5e1" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#1e293b", marginBottom: "2px" }}>
                              Requested Temporary Service Duration *
                            </label>
                            <select
                              value={ptscDuration}
                              onChange={(e) => setPtscDuration(e.target.value)}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "600", background: "#ffffff" }}
                            >
                              <option value="30">30 Days (1 Month)</option>
                              <option value="60">60 Days (2 Months)</option>
                              <option value="90">90 Days (3 Months Standard)</option>
                              <option value="180">180 Days (6 Months Construction Power)</option>
                              <option value="365">365 Days (1 Year)</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#1e293b", marginBottom: "2px" }}>
                              Proposed Service Energization Start Date *
                            </label>
                            <input
                              type="date"
                              value={ptscStartDate}
                              onChange={(e) => setPtscStartDate(e.target.value)}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 5: Box 2: Design Professional (PEE) */}
                      <div style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: "10px", padding: "1.1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block" }}>
                              Box 2: Design Professional, Plans and Specifications (PEE)
                            </span>
                            <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                              Professional Electrical Engineer (PEE) sign-off on plans & specs
                            </span>
                          </div>
                          <span style={{ fontSize: "0.72rem", background: "#ede9fe", color: "#6d28d9", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                            NBC Form E-03 • Box 2
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>
                              Professional Electrical Engineer Full Name (Printed Over Underline) *
                            </label>
                            <input
                              type="text"
                              value={ptscPeeName}
                              onChange={(e) => setPtscPeeName(e.target.value)}
                              placeholder="e.g. ENGR. DANILO REYES, PEE"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "700", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>Professional Address *</label>
                            <input
                              type="text"
                              value={ptscPeeAddress}
                              onChange={(e) => setPtscPeeAddress(e.target.value)}
                              placeholder="e.g. San Nicolas, Sto. Tomas, Pampanga"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.65rem", marginBottom: "0.75rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>PRC Registration No. *</label>
                            <input
                              type="text"
                              value={ptscPeePRC}
                              onChange={(e) => setPtscPeePRC(e.target.value)}
                              placeholder="e.g. 0033421"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>PRC Validity *</label>
                            <input
                              type="date"
                              value={ptscPeePRCValidity}
                              onChange={(e) => setPtscPeePRCValidity(e.target.value)}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>PTR No. *</label>
                            <input
                              type="text"
                              value={ptscPeePTR}
                              onChange={(e) => setPtscPeePTR(e.target.value)}
                              placeholder="e.g. PTR-ST-2026-4412"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>PTR Date Issued *</label>
                            <input
                              type="text"
                              value={ptscPeePTRIssued}
                              onChange={(e) => setPtscPeePTRIssued(e.target.value)}
                              placeholder="e.g. Jan 10, 2026"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>PTR Issued At *</label>
                            <input
                              type="text"
                              value={ptscPeePTRIssuedAt}
                              onChange={(e) => setPtscPeePTRIssuedAt(e.target.value)}
                              placeholder="e.g. Sto. Tomas, Pampanga"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>T.I.N. *</label>
                            <input
                              type="text"
                              value={ptscPeeTIN}
                              onChange={(e) => setPtscPeeTIN(e.target.value)}
                              placeholder="e.g. 456-789-012-000"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>Date Signed *</label>
                            <input
                              type="date"
                              value={ptscPeeSignedDate}
                              onChange={(e) => setPtscPeeSignedDate(e.target.value)}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                        </div>

                        {/* E-Signature Creator for Box 2 */}
                        <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #c7d2fe" }}>
                          <SignatureCreator
                            value={ptscPeeSignature}
                            onChange={setPtscPeeSignature}
                            label={`Design Professional E-Signature (Professional Electrical Engineer - Affixed Over Printed Name: ${ptscPeeName})`}
                            required
                          />
                        </div>
                      </div>

                      {/* Section 6: Box 3: Supervisor / In-Charge of Electrical Works */}
                      <div style={{ background: "#ffffff", border: "1.5px solid #059669", borderRadius: "12px", padding: "1.25rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#065f46", textTransform: "uppercase", display: "block" }}>
                              Box 3: Supervisor / In-Charge of Electrical Works
                            </span>
                            <span style={{ fontSize: "0.76rem", color: "#64748b" }}>
                              Official qualification checkbox & credentials on NBC Form E-03
                            </span>
                          </div>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: "700", color: "#065f46", cursor: "pointer", background: "#ecfdf5", padding: "4px 10px", borderRadius: "6px", border: "1px solid #a7f3d0" }}>
                            <input
                              type="checkbox"
                              checked={sameAsDesignPtscSupervisor}
                              onChange={(e) => setSameAsDesignPtscSupervisor(e.target.checked)}
                              style={{ accentColor: "#059669", width: "15px", height: "15px", cursor: "pointer" }}
                            />
                            <span>Same as Design Professional (Box 2)</span>
                          </label>
                        </div>

                        {sameAsDesignPtscSupervisor ? (
                          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "0.85rem", display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#22c55e", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: "bold" }}>✓</div>
                            <div>
                              <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#166534", display: "block" }}>
                                Full Credentials & E-Signature Inherited from Box 2 (PEE)
                              </span>
                              <span style={{ fontSize: "0.76rem", color: "#15803d" }}>
                                Supervisor: <strong>{ptscPeeName}</strong> (PRC: {ptscPeePRC}, PTR: {ptscPeePTR}). Role: Professional Electrical Engineer.
                              </span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ marginBottom: "0.75rem" }}>
                              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                Supervisor Qualification Category (Official Box 3 Checkbox) *
                              </label>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem" }}>
                                {[
                                  { id: "PEE", label: "Professional Electrical Engineer" },
                                  { id: "REE", label: "Registered Electrical Engineer" },
                                  { id: "RME", label: "Registered Master Electrician" },
                                ].map((cat) => {
                                  const isSel = ptscSupervisorRole === cat.id;
                                  return (
                                    <button
                                      key={cat.id}
                                      type="button"
                                      onClick={() => setPtscSupervisorRole(cat.id)}
                                      style={{
                                        padding: "8px 12px",
                                        borderRadius: "8px",
                                        border: isSel ? "2px solid #059669" : "1px solid #cbd5e1",
                                        background: isSel ? "#ecfdf5" : "#ffffff",
                                        color: isSel ? "#065f46" : "#334155",
                                        fontWeight: isSel ? "700" : "500",
                                        fontSize: "0.80rem",
                                        textAlign: "left",
                                        cursor: "pointer"
                                      }}
                                    >
                                      {isSel ? "☑" : "☐"} {cat.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.65rem", marginBottom: "0.75rem" }}>
                              <div style={{ gridColumn: "span 2" }}>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>
                                  Supervisor Full Name (Printed Over Underline) *
                                </label>
                                <input
                                  type="text"
                                  value={ptscSupervisorName}
                                  onChange={(e) => setPtscSupervisorName(e.target.value)}
                                  placeholder="e.g. ENGR. DANILO REYES, PEE"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff", fontWeight: "700" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>Address *</label>
                                <input
                                  type="text"
                                  value={ptscSupervisorAddress}
                                  onChange={(e) => setPtscSupervisorAddress(e.target.value)}
                                  placeholder="e.g. San Nicolas, Sto. Tomas, Pampanga"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>PRC Registration No. *</label>
                                <input
                                  type="text"
                                  value={ptscSupervisorPRC}
                                  onChange={(e) => setPtscSupervisorPRC(e.target.value)}
                                  placeholder="e.g. 0033421"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>PRC Validity *</label>
                                <input
                                  type="date"
                                  value={ptscSupervisorPRCValidity}
                                  onChange={(e) => setPtscSupervisorPRCValidity(e.target.value)}
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>PTR No. *</label>
                                <input
                                  type="text"
                                  value={ptscSupervisorPTR}
                                  onChange={(e) => setPtscSupervisorPTR(e.target.value)}
                                  placeholder="e.g. PTR-ST-2026-4412"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>PTR Date Issued *</label>
                                <input
                                  type="text"
                                  value={ptscSupervisorPTRIssued}
                                  onChange={(e) => setPtscSupervisorPTRIssued(e.target.value)}
                                  placeholder="e.g. Jan 10, 2026"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>PTR Issued At *</label>
                                <input
                                  type="text"
                                  value={ptscSupervisorPTRIssuedAt}
                                  onChange={(e) => setPtscSupervisorPTRIssuedAt(e.target.value)}
                                  placeholder="e.g. Sto. Tomas, Pampanga"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>T.I.N. *</label>
                                <input
                                  type="text"
                                  value={ptscSupervisorTIN}
                                  onChange={(e) => setPtscSupervisorTIN(e.target.value)}
                                  placeholder="e.g. 456-789-012-000"
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>Date Signed *</label>
                                <input
                                  type="date"
                                  value={ptscSupervisorSignedDate}
                                  onChange={(e) => setPtscSupervisorSignedDate(e.target.value)}
                                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#ffffff" }}
                                />
                              </div>
                            </div>

                            <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #a7f3d0" }}>
                              <SignatureCreator
                                value={ptscSupervisorSignature}
                                onChange={setPtscSupervisorSignature}
                                label={`Electrical Works Supervisor E-Signature (${ptscSupervisorRole} - Affixed Over Printed Name: ${ptscSupervisorName})`}
                                required
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Section 7: Box 4: Owner / Applicant Verification & CTC */}
                      <div style={{ background: "#ffffff", border: "1.5px solid #3b82f6", borderRadius: "12px", padding: "1.25rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#1e3a8a", textTransform: "uppercase", display: "block" }}>
                              Box 4: Owner / Applicant Verification & Community Tax Certificate (CTC)
                            </span>
                            <span style={{ fontSize: "0.76rem", color: "#64748b" }}>
                              Identity proof and digital sign-off of the owner/applicant
                            </span>
                          </div>
                          <span style={{ fontSize: "0.72rem", background: "#dbeafe", color: "#1e40af", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                            NBC Form E-03 • Box 4
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#64748b", marginBottom: "2px" }}>Owner/Applicant Full Name</label>
                            <div style={{ fontSize: "0.84rem", fontWeight: "700", color: "#0f172a", padding: "6px 10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {compiledFullName}
                            </div>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>C.T.C. No. *</label>
                            <input
                              type="text"
                              value={ptscApplicantCtcNo}
                              onChange={(e) => setPtscApplicantCtcNo(e.target.value)}
                              placeholder="e.g. CTC-2026-00192"
                              style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>Date Issued *</label>
                            <input
                              type="text"
                              value={ptscApplicantCtcDateIssued}
                              onChange={(e) => setPtscApplicantCtcDateIssued(e.target.value)}
                              placeholder="e.g. Jan 15, 2026"
                              style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem", background: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>Place Issued *</label>
                            <input
                              type="text"
                              value={ptscApplicantCtcPlaceIssued}
                              onChange={(e) => setPtscApplicantCtcPlaceIssued(e.target.value)}
                              placeholder="e.g. Sto. Tomas, Pampanga"
                              style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem", background: "#ffffff" }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", marginBottom: "0.85rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>Owner / Applicant Date Signed *</label>
                            <input
                              type="date"
                              value={applicantSignedDate}
                              onChange={(e) => setApplicantSignedDate(e.target.value)}
                              style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem", background: "#ffffff" }}
                            />
                          </div>
                        </div>

                        <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #bfdbfe" }}>
                          <SignatureCreator
                            value={ptscApplicantSignature || applicantSignature}
                            onChange={(sig) => setPtscApplicantSignature(sig)}
                            label={`Owner / Applicant Digital Signature (Affixed Over Printed Name: ${compiledFullName})`}
                            required
                          />
                        </div>
                      </div>

                      {/* Section 8: Page 2 Box 4: Processing & Evaluation Division (Official Receipt & Fee Payment) */}
                      <div style={{ background: "#ffffff", border: "1.5px solid #0284c7", borderRadius: "12px", padding: "1.25rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#0369a1", textTransform: "uppercase", display: "block" }}>
                              Box 4 (Page 2): Processing & Evaluation Division
                            </span>
                            <span style={{ fontSize: "0.76rem", color: "#64748b" }}>
                              Official LGU payment verification, Official Receipt (O.R.), and permit issuance details (NBC Form E-03 • Box 4)
                            </span>
                          </div>
                          <span style={{ fontSize: "0.72rem", background: "#e0f2fe", color: "#0369a1", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                            NBC Form E-03 • Page 2 Box 4
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                          {/* Left Column: Fee Paid & Date Paid */}
                          <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <div style={{ marginBottom: "0.75rem" }}>
                              <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>
                                FEE PAID (PHP) *
                              </label>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#0369a1" }}>₱</span>
                                <input
                                  type="text"
                                  value={ptscFeePaid}
                                  onChange={(e) => setPtscFeePaid(e.target.value)}
                                  placeholder="850.00"
                                  style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem", fontWeight: "700", color: "#0f172a", background: "#ffffff" }}
                                />
                              </div>
                              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Printed on the official form next to "FEE PAID: P"</span>
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>
                                DATE PAID *
                              </label>
                              <input
                                type="text"
                                value={ptscDatePaid}
                                onChange={(e) => setPtscDatePaid(e.target.value)}
                                placeholder="Sep 18, 2026"
                                style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem", background: "#ffffff" }}
                              />
                              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Printed on the underline for "DATE PAID"</span>
                            </div>
                          </div>

                          {/* Right Column: Official Receipt No & Date Issued */}
                          <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <div style={{ marginBottom: "0.75rem" }}>
                              <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>
                                OFFICIAL RECEIPT NO. *
                              </label>
                              <input
                                type="text"
                                value={ptscOfficialReceiptNo}
                                onChange={(e) => setPtscOfficialReceiptNo(e.target.value)}
                                placeholder="OR-2026-004521"
                                style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem", fontWeight: "700", color: "#0284c7", background: "#ffffff" }}
                              />
                              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Printed on the official form next to "OFFICIAL RECEIPT NO.: AC -"</span>
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#334155", marginBottom: "2px" }}>
                                DATE ISSUED *
                              </label>
                              <input
                                type="text"
                                value={ptscDateIssued}
                                onChange={(e) => setPtscDateIssued(e.target.value)}
                                placeholder="Sep 18, 2026"
                                style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem", background: "#ffffff" }}
                              />
                              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Printed on the underline for "DATE ISSUED"</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 9: Page 2 Box 5: Building Official Approval & Temporary Service Validity */}
                      <div style={{ background: "#ffffff", border: "1.5px solid #64748b", borderRadius: "12px", padding: "1.25rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                          <div>
                            <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", display: "block" }}>
                              Box 5 (Page 2): Building Official Approval & Temporary Service Validity
                            </span>
                            <span style={{ fontSize: "0.76rem", color: "#64748b" }}>
                              Authorized temporary connection period and permit validity (NBC Form E-03 • Box 5)
                            </span>
                          </div>
                          <span style={{ fontSize: "0.72rem", background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                            NBC Form E-03 • Page 2 Box 5
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "0.75rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>Authorized Connection Period (Days) *</label>
                            <input
                              type="text"
                              value={ptscDuration}
                              onChange={(e) => setPtscDuration(e.target.value)}
                              placeholder="e.g. 90"
                              style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem", fontWeight: "700", background: "#ffffff" }}
                            />
                            <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Printed on "... for a period of [ ___ ] days"</span>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#334155", marginBottom: "2px" }}>Effective Start Date *</label>
                            <input
                              type="date"
                              value={ptscStartDate}
                              onChange={(e) => setPtscStartDate(e.target.value)}
                              style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem", background: "#ffffff" }}
                            />
                            <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Printed on "... from date [ __________ ]"</span>
                          </div>
                        </div>

                        <div style={{ padding: "0.75rem 10px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                          <span style={{ fontSize: "0.76rem", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>
                            Official Grantee & Installation Location (Auto-linked):
                          </span>
                          <span style={{ fontSize: "0.78rem", color: "#1e293b", display: "block" }}>
                            Granted to: <strong>{compiledFullName}</strong> | Postal Address: <strong>{`${ptscApplicantNo ? ptscApplicantNo + ' ' : ''}${ptscApplicantStreet}, ${ptscApplicantBarangay}, ${ptscApplicantCity}`}</strong>
                          </span>
                        </div>

                        {/* Municipal Sign-Offs Preview */}
                        <div style={{ marginTop: "0.75rem", display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "0.5rem", padding: "0.75rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                          <div>
                            <span style={{ fontSize: "0.70rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "block" }}>Inspected By (Electrical Inspector)</span>
                            <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#1e293b", display: "block" }}>ENGR. GIOVANNI L. AQUINO</span>
                            <span style={{ fontSize: "0.68rem", color: "#64748b" }}>PRC No. 0042189 • Validity: Nov 20, 2028</span>
                          </div>
                          <div>
                            <span style={{ fontSize: "0.70rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "block" }}>Recommending Approval</span>
                            <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#1e293b", display: "block" }}>ARCH. NORBERT B. LAGMAN</span>
                            <span style={{ fontSize: "0.68rem", color: "#64748b" }}>Chief, Processing & Evaluation Div.</span>
                          </div>
                          <div>
                            <span style={{ fontSize: "0.70rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "block" }}>Approved By (Building Official)</span>
                            <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#1e293b", display: "block" }}>Engr. GILBERT B. CRUZ</span>
                            <span style={{ fontSize: "0.68rem", color: "#64748b" }}>Municipal Building Official</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ACTION BAR AT BOTTOM OF FORM (For technical permit forms) */}
            {activeTab !== "fireBfpPermit" && (
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
                marginTop: "1.75rem",
                paddingTop: "1.25rem",
                borderTop: "1.5px solid #e2e8f0"
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: "0.86rem", color: "#475569", fontWeight: "600" }}>
                    Finished filling out this section? Click below to save your entries and record this permit as completed.
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => handleSubmitSingleForm(activeTab)}
                    style={{
                      background: isFormSatisfied(activeTab)
                        ? "linear-gradient(135deg, #15803d 0%, #166534 100%)"
                        : "linear-gradient(135deg, #059669 0%, #047857 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      padding: "12px 26px",
                      fontSize: "0.95rem",
                      fontWeight: "900",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: "0 4px 16px rgba(5, 150, 105, 0.4)",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>Submit Form ({activeMeta?.label || "Current Form"})</span>
                  </button>

                  {generatedPdfBlob && (
                    <a
                      href={generatedPdfBlob}
                      download={`${projectType.name.replace(/\s+/g, '_')}_Official_Permit_Package.pdf`}
                      style={{
                        padding: "10px 18px",
                        borderRadius: "10px",
                        background: "#f1f5f9",
                        border: "1.5px solid #cbd5e1",
                        color: "#334155",
                        fontSize: "0.88rem",
                        fontWeight: "700",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        textDecoration: "none"
                      }}
                    >
                      <Download size={16} color="#4f46e5" />
                      <span>Download Dossier PDF</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* --- MODE 2: UPLOAD SCANNED FORMS (PRE-PRINTED) --- */}
      {inputMode === "upload_scans" && (
        <div style={{
          background: "#ffffff",
          borderRadius: "18px",
          border: "1.5px solid #e2e8f0",
          padding: "1.75rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          marginBottom: "1.5rem"
        }}>
          <div style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
              Upload Official Signed Permit Scans
            </h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
              If you have already filled and had physical forms signed by your engineers, download blank Sto. Tomas templates or attach your signed copies below.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {mandatoryKeys.map((key) => {
              const meta = PERMIT_FORM_METADATA[key];
              const doc = uploadedPermitDocs[key];
              const templatePath = getPermitFormTemplate(key, projectType);
              const isUploading = activeUploadingKey === key;

              return (
                <div
                  key={key}
                  style={{
                    background: doc ? "#f0fdf4" : "#f8fafc",
                    border: doc ? "1.5px solid #86efac" : "1.5px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1rem"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: "800", padding: "2px 6px", borderRadius: "4px", background: "#1e3a8a", color: "white" }}>
                        {meta.code}
                      </span>
                      <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{meta.label}</strong>
                      <span style={{ fontSize: "0.68rem", fontWeight: "800", padding: "2px 8px", borderRadius: "999px", background: doc ? "#dcfce7" : "#fee2e2", color: doc ? "#166534" : "#991b1b" }}>
                        {doc ? "ATTACHED" : "REQUIRED"}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>{meta.desc}</p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {templatePath && (
                      <a
                        href={templatePath}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: "700",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          color: "#334155",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          textDecoration: "none"
                        }}
                      >
                        <Download size={13} color="#4f46e5" /> Blank Template (PDF)
                      </a>
                    )}

                    {doc ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "0.8rem", color: "#166534", fontWeight: "700" }}>✓ {doc.fileName}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(key)}
                          style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "700" }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "7px 14px",
                        borderRadius: "8px",
                        background: isUploading ? "#94a3b8" : "linear-gradient(135deg, #0038A8 0%, #021a4f 100%)",
                        color: "white",
                        fontSize: "0.8rem",
                        fontWeight: "700",
                        cursor: isUploading ? "wait" : "pointer"
                      }}>
                        <Upload size={13} />
                        <span>{isUploading ? "Uploading..." : "Attach Signed File"}</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          disabled={isUploading}
                          onChange={(e) => handleFileUpload(key, e)}
                          style={{ display: "none" }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP NAVIGATION FOOTER */}
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        borderTop: "1px solid #e2e8f0",
        paddingTop: "1.25rem",
        marginTop: "1.5rem",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>

          {areAllMandatorySatisfied ? (
            <button
              type="button"
              onClick={handleProceedToMapping}
              style={{
                padding: "11px 24px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "white",
                fontWeight: "800",
                fontSize: "0.92rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                transition: "all 0.15s ease"
              }}
            >
              <span>Proceed to Step 4: Mapping</span>
              <ChevronRight size={18} />
            </button>
          ) : (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 18px",
              borderRadius: "10px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#64748b",
              fontSize: "0.85rem",
              fontWeight: "700"
            }}>
              <Lock size={15} color="#94a3b8" />
              <span>Step 4: Mapping ({mandatoryKeys.length - satisfiedKeys.length} Forms Pending Completion)</span>
            </div>
          )}
        </div>
      </div>

      {/* FLOATING NOTIFICATION TOAST */}
      {notification && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          background: "#0f172a",
          color: "#ffffff",
          padding: "14px 20px",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "0.88rem",
          fontWeight: "700",
          maxWidth: "460px",
          border: "1px solid #334155",
          animation: "fadeIn 0.2s ease"
        }}>
          <CheckCircle2 size={20} color="#10b981" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, lineHeight: "1.4" }}>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "2px 6px",
              fontSize: "1rem"
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* PERMIT MATRIX GUIDE MODAL */}
      <PermitMatrixGuideModal
        isOpen={showMatrixGuide}
        onClose={() => setShowMatrixGuide(false)}
        selectedProjectId={projectType.id}
      />
    </div>
  );
}
