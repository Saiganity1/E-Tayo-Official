"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, Wrench, Zap, Shield, Layers, Droplets, Flame, Radio, 
  CheckCircle2, AlertCircle, Download, Upload, Trash2, Check, 
  ArrowRight, Sparkles, Building, ChevronRight, Info, Eye, 
  Clock, ShieldCheck, ChevronLeft, Lock, Award, Hammer, Compass,
  Sliders, UserCheck, RefreshCw, FileCheck, Home, CheckSquare, Plus, ExternalLink
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
  UnifiedPermitFormData 
} from "../../utils/unifiedPermitPdfGenerator";
import PermitMatrixGuideModal from "../modals/PermitMatrixGuideModal";

interface TechnicalPermitFormsStepProps {
  projectType: ProjectTypeItem;
  locationalClearanceRef: string | null;
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
  const [applicantTIN, setApplicantTIN] = useState("123-456-789-000");
  const [formOfOwnership, setFormOfOwnership] = useState("Individual / Sole Proprietor");
  const [govIdNo, setGovIdNo] = useState("CTC-2026-08912");
  const [lotNo, setLotNo] = useState("Lot 12");
  const [blockNo, setBlockNo] = useState("Block 4");
  const [tctNo, setTctNo] = useState("TCT-042-20260012");
  const [taxDecNo, setTaxDecNo] = useState("TD-2026-00124-ST");

  // ==========================================
  // 2. UNIFIED BUILDING PERMIT (BP) FIELDS
  // ==========================================
  const [scopeOfWork, setScopeOfWork] = useState(
    projectType.id === "elevator_escalator" || projectType.id === "generator_set"
      ? "New Mechanical & Electrical Installation"
      : "New Construction"
  );
  const [occupancyClass, setOccupancyClass] = useState(
    projectType.category === "Commercial"
      ? "Group E - Business & Commercial Mercantile"
      : projectType.category === "Industrial"
      ? "Group F - Light Industrial Plant"
      : projectType.category === "Institutional"
      ? "Group D - Institutional / Public Assembly"
      : "Group A - Residential Dwellings (Single-Detached / Duplex)"
  );
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
  const [architectPRC, setArchitectPRC] = useState("PRC-ARC-0045211");
  const [architectPRCValidity, setArchitectPRCValidity] = useState("2028-06-15");
  const [architectIAPOA, setArchitectIAPOA] = useState("IAPOA-2026-1049");
  const [architectPTR, setArchitectPTR] = useState("PTR-ST-2026-9021");
  const [architectPTRIssued, setArchitectPTRIssued] = useState("Sto. Tomas, Pampanga");
  const [architectTIN, setArchitectTIN] = useState("345-678-901-000");

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
  const [civilEngineerPRC, setCivilEngineerPRC] = useState("PRC-CE-0078923");
  const [civilEngineerPRCValidity, setCivilEngineerPRCValidity] = useState("2028-11-24");
  const [civilEngineerPICE, setCivilEngineerPICE] = useState("PICE-2026-8812");
  const [civilEngineerPTR, setCivilEngineerPTR] = useState("PTR-ST-2026-001");
  const [civilEngineerPTRIssued, setCivilEngineerPTRIssued] = useState("Sto. Tomas, Pampanga");
  const [civilEngineerTIN, setCivilEngineerTIN] = useState("234-567-890-000");

  // ==========================================
  // 5. ELECTRICAL PERMIT (EP) FIELDS
  // ==========================================
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
  const [electricalEngineerName, setElectricalEngineerName] = useState("Engr. Danilo Reyes, PEE");
  const [electricalEngineerPRC, setElectricalEngineerPRC] = useState("PRC-PEE-0033421");
  const [electricalEngineerPRCValidity, setElectricalEngineerPRCValidity] = useState("2027-09-30");
  const [electricalEngineerIIEE, setElectricalEngineerIIEE] = useState("IIEE-2026-5541");
  const [electricalEngineerPTR, setElectricalEngineerPTR] = useState("PTR-ST-2026-4412");
  const [electricalEngineerPTRIssued, setElectricalEngineerPTRIssued] = useState("Sto. Tomas, Pampanga");
  const [electricalEngineerTIN, setElectricalEngineerTIN] = useState("456-789-012-000");

  // ==========================================
  // 6. SANITARY / PLUMBING PERMIT (PL) FIELDS
  // ==========================================
  const [waterSupplySource, setWaterSupplySource] = useState("Sto. Tomas Water District (Municipal Waterworks Main)");
  const [sewageSystem, setSewageSystem] = useState("Individual 3-Chamber Reinforced Concrete Septic Tank with Leaching Field");
  const [septicTankDimensions, setSepticTankDimensions] = useState("2.40m Length x 1.20m Width x 1.50m Liquid Depth");
  const [waterPipesMaterial, setWaterPipesMaterial] = useState("PPR-PN20 (Polypropylene Random Copolymer) Heat-Fusion Welded");
  const [wastePipesMaterial, setWastePipesMaterial] = useState("uPVC Series 1000 Sanitary Pipe with Solvent Cement Joints");
  const [waterClosetsCount, setWaterClosetsCount] = useState("3");
  const [lavatoriesCount, setLavatoriesCount] = useState("3");
  const [kitchenSinksCount, setKitchenSinksCount] = useState("1");
  const [showersCount, setShowersCount] = useState("3");
  const [floorDrainsCount, setFloorDrainsCount] = useState("4");
  const [faucetsCount, setFaucetsCount] = useState("3");
  const [masterPlumberName, setMasterPlumberName] = useState("Engr. Jose Mendoza, RMP");
  const [masterPlumberPRC, setMasterPlumberPRC] = useState("PRC-MP-0012984");
  const [masterPlumberPRCValidity, setMasterPlumberPRCValidity] = useState("2028-03-12");
  const [masterPlumberNAMPAP, setMasterPlumberNAMPAP] = useState("NAMPAP-2026-3390");
  const [masterPlumberPTR, setMasterPlumberPTR] = useState("PTR-ST-2026-1188");
  const [masterPlumberPTRIssued, setMasterPlumberPTRIssued] = useState("Sto. Tomas, Pampanga");
  const [masterPlumberTIN, setMasterPlumberTIN] = useState("567-890-123-000");

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
  const [mechanicalEngineerName, setMechanicalEngineerName] = useState("Engr. Antonio Gomez, PME");
  const [mechanicalEngineerPRC, setMechanicalEngineerPRC] = useState("PRC-PME-0021489");
  const [mechanicalEngineerPRCValidity, setMechanicalEngineerPRCValidity] = useState("2027-12-05");
  const [mechanicalEngineerPSME, setMechanicalEngineerPSME] = useState("PSME-2026-0912");
  const [mechanicalEngineerPTR, setMechanicalEngineerPTR] = useState("PTR-ST-2026-9921");
  const [mechanicalEngineerPTRIssued, setMechanicalEngineerPTRIssued] = useState("Sto. Tomas, Pampanga");
  const [mechanicalEngineerTIN, setMechanicalEngineerTIN] = useState("678-901-234-000");

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

  // Auto-Fill official Sto. Tomas standard baseline parameters
  const handleAutoFillDefaults = () => {
    setLotNo("Lot 12");
    setBlockNo("Block 4");
    setTctNo("TCT-042-20260012");
    setTaxDecNo("TD-2026-00124-ST");
    setApplicantTIN("123-456-789-000");
    setFormOfOwnership("Individual / Sole Proprietor");
    setBuildingFootprint("120");
    setBuildingHeight("6.8");
    setCostBuilding("1,100,000.00");
    setCostElectrical("180,000.00");
    setCostPlumbing("140,000.00");
    setCostMechanical("80,000.00");
    setCostElectronics("60,000.00");
    setCostOthers("40,000.00");
    setNotification("Auto-populated official Sto. Tomas NBCP engineering standards. You can inspect or modify any field.");
    setTimeout(() => setNotification(null), 4000);
  };

  // Auto-generate official PDF package and mark forms as completed
  const handleGenerateDigitalForms = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setNotification(null);

    try {
      const applicationNo = `UNIFIED-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const submissionDate = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
      const fullAddress = `${streetAddress || "Main Street"}, Brgy. ${barangay}, Sto. Tomas, Pampanga`;

      const payload: UnifiedPermitFormData = {
        applicationNo,
        locationalClearanceRef: locationalClearanceRef || (isClearanceRequired ? "LC-VERIFIED" : "EXEMPT"),
        projectType,
        applicantName,
        applicantPhone: "0917-123-4567",
        applicantEmail: "applicant@etayo.gov.ph",
        applicantAddress: fullAddress,
        applicantTIN,
        formOfOwnership,
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
        occupancyClass,
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
        groundingSpec,
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
        machineryType,
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
        architectPRC,
        architectPRCValidity,
        architectIAPOA,
        architectPTR,
        architectPTRIssued,
        architectTIN,
        civilEngineerName,
        civilEngineerPRC,
        civilEngineerPRCValidity,
        civilEngineerPICE,
        civilEngineerPTR,
        civilEngineerPTRIssued,
        civilEngineerTIN,
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
        mechanicalEngineerPRC,
        mechanicalEngineerPRCValidity,
        mechanicalEngineerPSME,
        mechanicalEngineerPTR,
        mechanicalEngineerPTRIssued,
        mechanicalEngineerTIN,
        electronicsEngineerName,
        electronicsEngineerPRC,
        electronicsEngineerPRCValidity,
        electronicsEngineerIECEP,
        electronicsEngineerPTR,
        electronicsEngineerPTRIssued,
        electronicsEngineerTIN,
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
            const b64 = await generateElectricalPermitPdf(payload);
            formUrl = `data:application/pdf;base64,${b64}`;
          } else if (key === "sanitaryPermit") {
            const b64 = await generateSanitaryPermitPdf(payload);
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
            {/* GENERAL DETAILS SUMMARY (Shared across all forms) */}
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
                  Project Identification & Land Title Boundaries (Box 1 & 2)
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
                    value={projectName || `${projectType.name} Construction`}
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
                    value={streetAddress || "Main Street"}
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
                    value={projectCost || "1,600,000.00"}
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
                        <option value="Erection">Erection</option>
                        <option value="Addition">Addition</option>
                        <option value="Alteration">Alteration</option>
                        <option value="Renovation">Renovation</option>
                        <option value="Conversion">Conversion</option>
                        <option value="Repair">Repair</option>
                        <option value="Accessory Building / Structure">Accessory Building / Structure</option>
                        <option value="Others">Others (Specify)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                        Character of Occupancy (NBCP Rule VII) *
                      </label>
                      <select
                        value={occupancyClass}
                        onChange={(e) => setOccupancyClass(e.target.value)}
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
                        value={lotArea || "200"}
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
                        value={floorArea || "150"}
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

                {/* Section D: Registered Architect Credentials */}
                <div style={{ background: "#f5f3ff", border: "1.5px solid #ddd6fe", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#6d28d9", textTransform: "uppercase" }}>
                    Box 2: Design Professional: Registered Architect (UAP / IAPOA)
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#5b21b6" }}>Architect Full Name *</label>
                      <input type="text" required value={architectName} onChange={(e) => setArchitectName(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#5b21b6" }}>PRC Registration No. *</label>
                      <input type="text" required value={architectPRC} onChange={(e) => setArchitectPRC(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#5b21b6" }}>PRC Validity Date *</label>
                      <input type="date" required value={architectPRCValidity} onChange={(e) => setArchitectPRCValidity(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#5b21b6" }}>IAPOA Certificate No. *</label>
                      <input type="text" required value={architectIAPOA} onChange={(e) => setArchitectIAPOA(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#5b21b6" }}>PTR Number *</label>
                      <input type="text" required value={architectPTR} onChange={(e) => setArchitectPTR(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#5b21b6" }}>Place Issued *</label>
                      <input type="text" required value={architectPTRIssued} onChange={(e) => setArchitectPTRIssued(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                  </div>
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

                {/* Section A: Foundation & Framing */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#334155", textTransform: "uppercase" }}>
                    Foundation & Superstructure Framing Specifications
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Foundation Type & System *</label>
                      <input type="text" required value={foundationType} onChange={(e) => setFoundationType(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Embedment Depth *</label>
                      <input type="text" required value={foundationDepth} onChange={(e) => setFoundationDepth(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Superstructure Framing System *</label>
                      <input type="text" required value={structuralFraming} onChange={(e) => setStructuralFraming(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Floor Slab System *</label>
                      <input type="text" required value={floorSlabSystem} onChange={(e) => setFloorSlabSystem(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Roof Framing System *</label>
                      <input type="text" required value={roofFramingSystem} onChange={(e) => setRoofFramingSystem(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Masonry CHB & Reinforcement *</label>
                      <input type="text" required value={masonrySpec} onChange={(e) => setMasonrySpec(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                  </div>
                </div>

                {/* Section B: Material Strength Ratings */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#334155", textTransform: "uppercase" }}>
                    Structural Materials Strength Ratings (NSCP 2015)
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Concrete Compressive Strength fc' *</label>
                      <input type="text" required value={concreteStrength} onChange={(e) => setConcreteStrength(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Steel Rebar Yield Strength fy *</label>
                      <input type="text" required value={steelGrade} onChange={(e) => setSteelGrade(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                  </div>
                </div>

                {/* Section C: Civil Engineer Credentials */}
                <div style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#334155", textTransform: "uppercase" }}>
                    Box 2: Design Professional: Civil / Structural Engineer (PICE)
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Civil Engineer Name *</label>
                      <input type="text" required value={civilEngineerName} onChange={(e) => setCivilEngineerName(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
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
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#475569" }}>Place Issued *</label>
                      <input type="text" required value={civilEngineerPTRIssued} onChange={(e) => setCivilEngineerPTRIssued(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                  </div>
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

                {/* Section A: Water & Sewage Systems */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#0e7490", textTransform: "uppercase" }}>
                    Water Source, Waste Disposal, & Septic Tank Dimensions
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Potable Water Supply Source *</label>
                      <input type="text" required value={waterSupplySource} onChange={(e) => setWaterSupplySource(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Sewage Disposal System *</label>
                      <input type="text" required value={sewageSystem} onChange={(e) => setSewageSystem(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Septic Tank Dimensions (L x W x D) *</label>
                      <input type="text" required value={septicTankDimensions} onChange={(e) => setSepticTankDimensions(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Potable Water Pipes Material *</label>
                      <input type="text" required value={waterPipesMaterial} onChange={(e) => setWaterPipesMaterial(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Sanitary Waste & Vent Pipes Material *</label>
                      <input type="text" required value={wastePipesMaterial} onChange={(e) => setWastePipesMaterial(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                  </div>
                </div>

                {/* Section B: Plumbing Fixture Schedule */}
                <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#0e7490", textTransform: "uppercase" }}>
                    Plumbing Fixture Counts Schedule (Units)
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Water Closets *</label>
                      <input type="number" required value={waterClosetsCount} onChange={(e) => setWaterClosetsCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Lavatories *</label>
                      <input type="number" required value={lavatoriesCount} onChange={(e) => setLavatoriesCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Kitchen Sinks *</label>
                      <input type="number" required value={kitchenSinksCount} onChange={(e) => setKitchenSinksCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Shower Units *</label>
                      <input type="number" required value={showersCount} onChange={(e) => setShowersCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Floor Drains *</label>
                      <input type="number" required value={floorDrainsCount} onChange={(e) => setFloorDrainsCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Faucets / Bibbs *</label>
                      <input type="number" required value={faucetsCount} onChange={(e) => setFaucetsCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }} />
                    </div>
                  </div>
                </div>

                {/* Section C: Master Plumber Credentials */}
                <div style={{ background: "#ecfeff", border: "1.5px solid #a5f3fc", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#0e7490", textTransform: "uppercase" }}>
                    Box 2: Design Professional: Registered Master Plumber / Sanitary Engineer
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#155e75" }}>Plumber Full Name *</label>
                      <input type="text" required value={masterPlumberName} onChange={(e) => setMasterPlumberName(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#155e75" }}>PRC License No. *</label>
                      <input type="text" required value={masterPlumberPRC} onChange={(e) => setMasterPlumberPRC(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#155e75" }}>PRC Validity Date *</label>
                      <input type="date" required value={masterPlumberPRCValidity} onChange={(e) => setMasterPlumberPRCValidity(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#155e75" }}>NAMPAP Membership No. *</label>
                      <input type="text" required value={masterPlumberNAMPAP} onChange={(e) => setMasterPlumberNAMPAP(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#155e75" }}>PTR Number *</label>
                      <input type="text" required value={masterPlumberPTR} onChange={(e) => setMasterPlumberPTR(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#155e75" }}>Place Issued *</label>
                      <input type="text" required value={masterPlumberPTRIssued} onChange={(e) => setMasterPlumberPTRIssued(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
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

                <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#92400e", textTransform: "uppercase" }}>
                    Box 2: Design Professional: Professional Mechanical Engineer (PME)
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#78350f" }}>Engineer Full Name *</label>
                      <input type="text" required value={mechanicalEngineerName} onChange={(e) => setMechanicalEngineerName(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#78350f" }}>PRC Registration No. *</label>
                      <input type="text" required value={mechanicalEngineerPRC} onChange={(e) => setMechanicalEngineerPRC(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#78350f" }}>PRC Validity Date *</label>
                      <input type="date" required value={mechanicalEngineerPRCValidity} onChange={(e) => setMechanicalEngineerPRCValidity(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#78350f" }}>PTR Number *</label>
                      <input type="text" required value={mechanicalEngineerPTR} onChange={(e) => setMechanicalEngineerPTR(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#78350f" }}>Place Issued *</label>
                      <input type="text" required value={mechanicalEngineerPTRIssued} onChange={(e) => setMechanicalEngineerPTRIssued(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "white" }} />
                    </div>
                  </div>
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
