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
  LocationalClearancePdfData 
} from "../../../../utils/locationalClearancePdfGenerator";
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
  locationalClearanceRef: "LC-2026-9307",
  projectType: {
    id: "single_family",
    name: "Single-Detached Residential Dwelling",
    category: "Residential",
    description: "Standard residential two-storey house",
    estimatedDays: "5",
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'required',
      mechanicalPermit: 'conditional',
      electronicsPermit: 'conditional',
      fireBfpPermit: 'required',
      zoningPermit: 'required',
    }
  },
  applicantFirstName: "JUAN",
  applicantMiddleName: "SANTOS",
  applicantLastName: "DELA CRUZ",
  applicantName: "JUAN DELA CRUZ",
  applicantPhone: "0917-555-0199",
  applicantEmail: "juan.delacruz@example.com",
  applicantAddress: "123 RIZAL ST., BRGY. POBLACION, STO. TOMAS, PAMPANGA",
  applicantTIN: "123-456-789-000",
  formOfOwnership: "INDIVIDUAL / OWNER",
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
  occupancyClass: "Group A - Residential",
  proposedStoreys: "2",
  numberOfUnits: "1",
  proposedStartDate: "2026-10-01",
  expectedCompletionDate: "2027-04-30",

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

  // Professional Credentials
  architectName: "ARCH. MARIA ELENA SANTOS, UAP",
  architectAddress: "Sto. Tomas, Pampanga",
  architectPRC: "0045211",
  architectPRCValidity: "2028-09-15",
  architectIAPOA: "IAPOA-2026-9988",
  architectPTR: "PTR-ST-665544",
  architectPTRIssued: "Jan 08, 2026",
  architectPTRIssuedAt: "Sto. Tomas",
  architectTIN: "234-567-890-000",

  civilEngineerName: "ENGR. ROBERTO CRUZ, PICE",
  civilEngineerAddress: "Sto. Tomas, Pampanga",
  civilEngineerPRC: "0078923",
  civilEngineerPRCValidity: "2027-06-20",
  civilEngineerPICE: "PICE-445566",
  civilEngineerPTR: "PTR-ST-554433",
  civilEngineerPTRIssued: "Jan 10, 2026",
  civilEngineerPTRIssuedAt: "Sto. Tomas",
  civilEngineerTIN: "345-678-901-000",

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
  govIdNo: "PRC-ID-0098765",
  govIdDateIssued: "Jan 10, 2024",
  govIdPlaceIssued: "Sto. Tomas",
  applicantSignature: "",
  lotOwnerConsent: false,
  lotOwnerName: "",
  lotOwnerSignature: "",
  lotOwnerAddress: "",
  lotOwnerGovIdNo: "",
  lotOwnerGovIdDateIssued: "",
  lotOwnerGovIdPlaceIssued: "",
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNamePartChange = (part: "first" | "middle" | "last", val: string) => {
    const first = part === "first" ? val : (formData.applicantFirstName || "");
    const middle = part === "middle" ? val : (formData.applicantMiddleName || "");
    const last = part === "last" ? val : (formData.applicantLastName || "");
    const full = [first, middle, last].filter(Boolean).join(" ");
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
          applicationNo: formData.locationalClearanceRef || "LC-2026-9307",
          submissionDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          applicantName: formData.applicantName,
          applicantAddress: formData.applicantAddress,
          applicantPhone: formData.applicantPhone,
          applicantEmail: formData.applicantEmail,
          projectName: formData.projectName,
          projectType: formData.projectType?.name || "Single-Detached House",
          projectNature: "New Construction",
          projectAddress: formData.projectAddress,
          barangay: formData.barangay,
          lotArea: formData.lotArea,
          bldgArea: formData.floorArea,
          rightOverLand: "Owner",
          projectTenure: "Permanent",
          existingLandUse: "Residential",
          isTenanted: "No",
          projectCost: formData.projectCost,
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
                  background: activeTab === "general" ? "#2563eb" : "#e2e8f0",
                  color: activeTab === "general" ? "white" : "#475569",
                  fontWeight: "700",
                  fontSize: "0.78rem",
                  cursor: "pointer"
                }}
              >
                1. Applicant & Project
              </button>
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
            </div>
          </div>

          {/* Form Fields Area */}
          <div style={{ padding: "1.5rem", maxHeight: "750px", overflowY: "auto" }}>
            {activeTab === "general" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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

                {/* Separated Applicant Name inputs */}
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 1.2fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.applicantFirstName || ""}
                      onChange={e => handleNamePartChange("first", e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "600" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                      M.I.
                    </label>
                    <input
                      type="text"
                      value={formData.applicantMiddleName || ""}
                      onChange={e => handleNamePartChange("middle", e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "600" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                      Last Name / Surname
                    </label>
                    <input
                      type="text"
                      value={formData.applicantLastName || ""}
                      onChange={e => handleNamePartChange("last", e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "600" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                    Applicant / Owner Full Name (Box 1)
                  </label>
                  <input
                    type="text"
                    value={formData.applicantName}
                    onChange={e => handleFieldChange("applicantName", e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "600" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: selectedForm.id === "LC" ? "1fr" : "1fr 1fr", gap: "0.75rem" }}>
                  {selectedForm.id !== "LC" && (
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                        Applicant TIN
                      </label>
                      <input
                        type="text"
                        value={formData.applicantTIN || ""}
                        onChange={e => handleFieldChange("applicantTIN", e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                      />
                    </div>
                  )}
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                      Phone / Contact
                    </label>
                    <input
                      type="text"
                      value={formData.applicantPhone}
                      onChange={e => handleFieldChange("applicantPhone", e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                    Applicant Address (Street, Barangay, City/Municipality)
                  </label>
                  <input
                    type="text"
                    value={formData.applicantAddress}
                    onChange={e => handleFieldChange("applicantAddress", e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                  />
                </div>

                {/* Project Name / Type */}
                {selectedForm.id === "LC" && (
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                      Project Type
                    </label>
                    <input
                      type="text"
                      value={formData.projectType?.name || "Single-Detached Residential Dwelling"}
                      readOnly
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#f8fafc", fontWeight: "600" }}
                    />
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
                      <option value="Repair">Repair</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                      Occupancy Classification
                    </label>
                    <select
                      value={formData.occupancyClass || "Group A - Residential (Single)"}
                      onChange={e => handleFieldChange("occupancyClass", e.target.value)}
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
                <div style={{ marginTop: "0.5rem", padding: "1rem", borderRadius: "12px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#1e293b", display: "block" }}>
                      Box 3: Owner / Applicant E-Signature & Government ID
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                      Draw or upload your authentic e-signature to affix directly over your printed name.
                    </span>
                  </div>

                  {/* E-Signature Creator */}
                  <SignatureCreator
                    value={formData.applicantSignature}
                    onChange={(sig) => handleFieldChange("applicantSignature", sig)}
                    label="Applicant E-Signature (Signed over Printed Name)"
                    required
                  />

                  {/* Gov't ID, Date Issued, Place Issued */}
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

                  {/* Box 4 Toggle: Lot Owner / Authorized Representative */}
                  <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #e2e8f0" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" }}>
                      <input
                        type="checkbox"
                        checked={formData.lotOwnerConsent || false}
                        onChange={e => handleFieldChange("lotOwnerConsent", e.target.checked)}
                        style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                      />
                      <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#334155" }}>
                        Include Box 4: With My Consent (Lot Owner / Authorized Representative)
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
                </div>
              </div>
            )}

            {activeTab === "specs" && (
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
                  )}

                  {selectedForm.id === "SP" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Foundation Type</label>
                        <input type="text" value={formData.foundationType || ""} onChange={e => handleFieldChange("foundationType", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Concrete Strength</label>
                        <input type="text" value={formData.concreteStrength || ""} onChange={e => handleFieldChange("concreteStrength", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Structural Framing</label>
                        <input type="text" value={formData.structuralFraming || ""} onChange={e => handleFieldChange("structuralFraming", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Steel Grade</label>
                        <input type="text" value={formData.steelGrade || ""} onChange={e => handleFieldChange("steelGrade", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
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

                  {selectedForm.id === "LC" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Right Over Land</label>
                        <input type="text" value="Owner" readOnly style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#f1f5f9" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Zoning / Existing Land Use</label>
                        <input type="text" value="R-1 Low Density Residential" readOnly style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#f1f5f9" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Project Tenure</label>
                        <input type="text" value="Permanent" readOnly style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#f1f5f9" }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "professionals" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Not applicable for Locational Clearance */}
                {selectedForm.id === "LC" ? (
                  <div style={{ padding: "2.5rem 1.5rem", textAlign: "center", background: "#f8fafc", borderRadius: "14px", border: "1.5px dashed #cbd5e1" }}>
                    <ShieldCheck size={40} color="#64748b" style={{ margin: "0 auto 0.75rem auto", display: "block" }} />
                    <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: "#334155" }}>Not Applicable for Locational Clearance</h4>
                    <p style={{ margin: "0.5rem auto 0 auto", fontSize: "0.86rem", color: "#64748b", maxWidth: "420px", lineHeight: "1.5" }}>
                      Locational Clearance / Zoning does not require design professionals or supervising engineers on its official template.
                    </p>
                  </div>
                ) : (
                  <>
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

                    {/* Architect */}
                    {(selectedForm.id === "AP" || selectedForm.id === "FP" || selectedForm.id === "SGP" || selectedForm.id === "CC") && (
                      <div style={{ padding: "0.9rem", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#1d4ed8" }}>Architect / Design Professional</span>
                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Full Name</label>
                            <input type="text" value={formData.architectName || ""} onChange={e => handleFieldChange("architectName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Address</label>
                            <input type="text" value={formData.architectAddress || "Sto. Tomas, Pampanga"} onChange={e => handleFieldChange("architectAddress", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC No.</label>
                            <input type="text" value={formData.architectPRC || ""} onChange={e => handleFieldChange("architectPRC", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Validity</label>
                            <input type="text" value={formData.architectPRCValidity || "2028-09-15"} onChange={e => handleFieldChange("architectPRCValidity", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>TIN</label>
                            <input type="text" value={formData.architectTIN || "234-567-890-000"} onChange={e => handleFieldChange("architectTIN", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
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
                        </div>
                      </div>
                    )}

                    {/* Civil Engineer */}
                    {(selectedForm.id === "BP" || selectedForm.id === "SP" || selectedForm.id === "DP" || selectedForm.id === "EXP" || selectedForm.id === "SGP" || selectedForm.id === "CO" || selectedForm.id === "CC") && (
                      <div style={{ padding: "0.9rem", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#047857" }}>Civil / Structural Engineer (Full-Time Inspector & Supervisor)</span>
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
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
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
                        </div>
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
                  </>
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
