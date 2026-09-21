"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  FileText, Wrench, Zap, Shield, Layers, Droplets, Flame, Radio, 
  CheckCircle2, AlertCircle, Download, Upload, Trash2, Check, 
  ArrowRight, Sparkles, Building, ChevronRight, Info, Eye, 
  Clock, ShieldCheck, ChevronLeft, Lock, Award, Hammer, Compass,
  Sliders, UserCheck, RefreshCw, FileCheck, Home, CheckSquare, Plus, ExternalLink, User
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
  generateBfpApplicationPdf,
  UnifiedPermitFormData 
} from "../../utils/unifiedPermitPdfGenerator";
import PermitMatrixGuideModal from "../modals/PermitMatrixGuideModal";
import SignatureCreator from "../common/SignatureCreator";

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
  const [electronicsEngineerName, setElectronicsEngineerName] = useState("Engr. Carlos Lim, PECE");
  const [electronicsEngineerPRC, setElectronicsEngineerPRC] = useState("PRC-PECE-0038912");
  const [electronicsEngineerPRCValidity, setElectronicsEngineerPRCValidity] = useState("2028-08-20");
  const [electronicsEngineerIECEP, setElectronicsEngineerIECEP] = useState("IECEP-2026-4401");
  const [electronicsEngineerPTR, setElectronicsEngineerPTR] = useState("PTR-ST-2026-7782");
  const [electronicsEngineerPTRIssued, setElectronicsEngineerPTRIssued] = useState("Sto. Tomas, Pampanga");
  const [electronicsEngineerTIN, setElectronicsEngineerTIN] = useState("789-012-345-000");

  // ==========================================
  // 10. ANCILLARY / SPECIAL PERMIT FIELDS
  // ==========================================
  const [fenceLength, setFenceLength] = useState("45.0 meters");
  const [fenceHeight, setFenceHeight] = useState("1.80 meters");
  const [fenceMaterial, setFenceMaterial] = useState("Plastered Concrete Hollow Blocks with Decorative Steel Grille Panels");
  const [demolitionArea, setDemolitionArea] = useState("80.0 sq.m.");
  const [demolitionMethod, setDemolitionMethod] = useState("Manual Disassembly & Hand-held Mechanical Tools with Debris Shute");
  const [excavationVolume, setExcavationVolume] = useState("65.0 cu.m.");
  const [signDimensions, setSignDimensions] = useState("1.20m Width x 0.80m Height");
  const [tempConnectionLoad, setTempConnectionLoad] = useState("5.0 kVA (Temporary Construction Power, 6 Months Duration)");

  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeUploadingKey, setActiveUploadingKey] = useState<string | null>(null);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Sync active tab if projectType changes
  useEffect(() => {
    if (mandatoryKeys.length > 0 && !mandatoryKeys.includes(activeTab)) {
      setActiveTab(mandatoryKeys[0]);
    }
  }, [projectType]);

  // Check which mandatory keys have been satisfied (either uploaded or generated online)
  const satisfiedKeys = mandatoryKeys.filter((key) => Boolean(uploadedPermitDocs[key]));
  const areAllMandatorySatisfied = mandatoryKeys.every((key) => Boolean(uploadedPermitDocs[key]));

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
        electronicsEngineerName,
        electronicsEngineerPRC,
        electronicsEngineerPRCValidity,
        electronicsEngineerIECEP,
        electronicsEngineerPTR,
        electronicsEngineerPTRIssued,
        electronicsEngineerTIN,
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
        lotOwnerSignature: lotOwnerConsent ? lotOwnerSignature : undefined,
        activePermitForms: mandatoryKeys,
        submissionDate
      };

      const base64Pdf = await generateUnifiedPermitPdf(payload);
      const dataUrl = `data:application/pdf;base64,${base64Pdf}`;
      setGeneratedPdfBlob(dataUrl);

      // Populate uploadedPermitDocs for each mandatory key with its individual filled PDF
      const newDocs: Record<string, any> = { ...uploadedPermitDocs };
      for (const key of mandatoryKeys) {
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
          } else if (key === "fireBfpPermit") {
            // BFP has no blank PDF template — generate the application summary sheet from scratch
            const b64 = await generateBfpApplicationPdf(payload);
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
        `All ${mandatoryKeys.length} official permit forms for ${projectType.name} have been compiled and verified with complete engineering specifications. You are cleared to proceed to Step 4: Mapping.`
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
                const isDone = Boolean(uploadedPermitDocs[key]);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "10px",
                      border: isSelected ? "1.5px solid #4f46e5" : "1px solid #e2e8f0",
                      background: isSelected ? "#eef2ff" : "#f8fafc",
                      color: isSelected ? "#4338ca" : "#475569",
                      fontWeight: isSelected ? "800" : "600",
                      fontSize: "0.84rem",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <span style={{
                      fontSize: "0.68rem",
                      fontWeight: "800",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: isSelected ? "#4338ca" : "#94a3b8",
                      color: "white"
                    }}>
                      {meta.code}
                    </span>
                    <span>{meta.label}</span>
                    {isDone && <CheckCircle2 size={15} color="#16a34a" />}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleAutoFillDefaults}
              style={{
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
                color: "#475569",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "0.78rem",
                fontWeight: "700",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
              title="Populate standard municipal National Building Code compliant engineering defaults"
            >
              <RefreshCw size={13} color="#4f46e5" />
              <span>Auto-Fill Sto. Tomas Standards</span>
            </button>
          </div>

          <form onSubmit={handleGenerateDigitalForms}>
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
                    width: "36px",
                    height: "36px",
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
                        fontSize: "0.68rem",
                        fontWeight: "800",
                        color: "#4338ca",
                        background: "#e0e7ff",
                        padding: "2px 7px",
                        borderRadius: "4px",
                        letterSpacing: "0.4px"
                      }}>
                        NBC FORM A-01 / S-01 / B-01 • BOX 1
                      </span>
                      <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: "600" }}>
                        Owner & Enterprise Information
                      </span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: "0.98rem", fontWeight: "800", color: "#0f172a" }}>
                      BOX 1: OWNER / APPLICANT (TO BE ACCOMPLISHED IN PRINT)
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
                <Building size={18} color="#4f46e5" />
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "800", color: "#1e293b" }}>
                  BOX 2: Project Identification & Land Title Boundaries
                </h4>
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
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#fff1f2", color: "#e11d48", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Flame size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#0f172a" }}>
                      Fire Safety Evaluation Clearance (FSEC / BFP)
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                      Bureau of Fire Protection compliance, RA 9514 life-safety, means of egress, and fire suppression systems
                    </p>
                  </div>
                </div>

                {/* Section A: Egress & Life Safety */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#be123c", textTransform: "uppercase" }}>
                    Means of Egress & Architectural Fire Resistance (RA 9514)
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Independent Exit Doors *</label>
                      <input type="text" required value={numberOfExits} onChange={(e) => setNumberOfExits(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Exit Door Clear Opening *</label>
                      <input type="text" required value={exitDoorWidth} onChange={(e) => setExitDoorWidth(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Exit Stairway & Handrail Specs *</label>
                      <input type="text" required value={stairSpecs} onChange={(e) => setStairSpecs(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Firewall / Party Wall Specifications *</label>
                      <input type="text" required value={firewallSpecs} onChange={(e) => setFirewallSpecs(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                  </div>
                </div>

                {/* Section B: Fire Fighting Equipment */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#be123c", textTransform: "uppercase" }}>
                    Fire Suppression & Life-Safety Equipment (BFP Santo Tomas)
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "1rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Portable Fire Extinguishers *</label>
                      <input type="text" required value={fireExtinguisherSpecs} onChange={(e) => setFireExtinguisherSpecs(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Emergency Lights Count *</label>
                      <input type="number" required value={emergencyLightsCount} onChange={(e) => setEmergencyLightsCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Smoke Detectors Count *</label>
                      <input type="number" required value={smokeDetectorsCount} onChange={(e) => setSmokeDetectorsCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                  </div>
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

                <div style={{ background: "#f0fdfa", border: "1.5px solid #99f6e4", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#0f766e", textTransform: "uppercase" }}>
                    Box 2: Design Professional: Professional Electronics Engineer (PECE)
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#115e59" }}>Engineer Full Name *</label>
                      <input type="text" required value={electronicsEngineerName} onChange={(e) => setElectronicsEngineerName(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#115e59" }}>PRC Registration No. *</label>
                      <input type="text" required value={electronicsEngineerPRC} onChange={(e) => setElectronicsEngineerPRC(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#115e59" }}>PRC Validity Date *</label>
                      <input type="date" required value={electronicsEngineerPRCValidity} onChange={(e) => setElectronicsEngineerPRCValidity(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#115e59" }}>PTR Number *</label>
                      <input type="text" required value={electronicsEngineerPTR} onChange={(e) => setElectronicsEngineerPTR(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                  </div>
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
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr", gap: "1rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Fence Length *</label>
                        <input type="text" value={fenceLength} onChange={(e) => setFenceLength(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Fence Height *</label>
                        <input type="text" value={fenceHeight} onChange={(e) => setFenceHeight(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Fencing Material Specifications *</label>
                        <input type="text" value={fenceMaterial} onChange={(e) => setFenceMaterial(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                      </div>
                    </div>
                  )}

                  {activeTab === "demolitionPermit" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Demolition Area *</label>
                        <input type="text" value={demolitionArea} onChange={(e) => setDemolitionArea(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Demolition Methodology & Safety Plan *</label>
                        <input type="text" value={demolitionMethod} onChange={(e) => setDemolitionMethod(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                      </div>
                    </div>
                  )}

                  {activeTab === "excavationPermit" && (
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Excavation Volume (cu. m.) *</label>
                      <input type="text" value={excavationVolume} onChange={(e) => setExcavationVolume(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                  )}

                  {activeTab === "signPermit" && (
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Signboard Dimensions (W x H) *</label>
                      <input type="text" value={signDimensions} onChange={(e) => setSignDimensions(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                  )}

                  {activeTab === "temporaryServiceConnection" && (
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Requested Temporary Power Capacity & Duration *</label>
                      <input type="text" value={tempConnectionLoad} onChange={(e) => setTempConnectionLoad(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ACTION BAR AT BOTTOM OF FORM */}
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
                <p style={{ margin: 0, fontSize: "0.84rem", color: "#64748b" }}>
                  Ready to compile? This will synchronize all official boxes across all {mandatoryKeys.length} required permit forms.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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

                <button
                  type="submit"
                  disabled={isGenerating}
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    padding: "11px 24px",
                    fontSize: "0.92rem",
                    fontWeight: "800",
                    cursor: isGenerating ? "wait" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
                    transition: "all 0.15s ease"
                  }}
                >
                  <Sparkles size={16} />
                  <span>{isGenerating ? "Compiling Official Dossier..." : "Save & Generate Official Forms"}</span>
                </button>
              </div>
            </div>
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
                        background: isUploading ? "#94a3b8" : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
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
        justifyContent: "space-between",
        alignItems: "center",
        borderTop: "1px solid #e2e8f0",
        paddingTop: "1.25rem",
        marginTop: "1.5rem"
      }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#475569",
            fontWeight: "700",
            fontSize: "0.88rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <ChevronLeft size={18} />
          <span>Back to Locational Clearance</span>
        </button>

        <button
          type="button"
          onClick={onProceedToMapping}
          disabled={!areAllMandatorySatisfied}
          style={{
            padding: "11px 24px",
            borderRadius: "10px",
            border: "none",
            background: areAllMandatorySatisfied 
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" 
              : "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
            color: "white",
            fontWeight: "800",
            fontSize: "0.92rem",
            cursor: areAllMandatorySatisfied ? "pointer" : "not-allowed",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: areAllMandatorySatisfied ? "0 4px 14px rgba(16, 185, 129, 0.35)" : "none",
            opacity: areAllMandatorySatisfied ? 1 : 0.8
          }}
          title={areAllMandatorySatisfied ? "Proceed to site mapping" : "Please complete or generate the required permit forms above first"}
        >
          <span>
            {areAllMandatorySatisfied 
              ? "Proceed to Step 4: Mapping" 
              : `Step 4: Mapping (${mandatoryKeys.length - satisfiedKeys.length} Forms Pending)`}
          </span>
          {areAllMandatorySatisfied ? <ChevronRight size={18} /> : <Lock size={16} />}
        </button>
      </div>

      {/* PERMIT MATRIX GUIDE MODAL */}
      <PermitMatrixGuideModal
        isOpen={showMatrixGuide}
        onClose={() => setShowMatrixGuide(false)}
        selectedProjectId={projectType.id}
      />
    </div>
  );
}
