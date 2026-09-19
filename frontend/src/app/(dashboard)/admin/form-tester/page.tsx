"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, Layers, Zap, Droplets, Wrench, Radio, Flame, ShieldCheck, 
  FileText, Play, RotateCcw, Download, ExternalLink, Sparkles, Check, 
  CheckCircle2, AlertCircle, Search, RefreshCw, ZoomIn, Eye, ArrowLeft
} from "lucide-react";
import { 
  generateBuildingPermitPdf, 
  generateArchitecturalPermitPdf, 
  generateStructuralPermitPdf, 
  generateElectricalPermitPdf, 
  generateSanitaryPermitPdf, 
  generateMechanicalPermitPdf, 
  generateElectronicsPermitPdf, 
  generateBfpApplicationPdf, 
  generateUnifiedPermitPdf, 
  UnifiedPermitFormData 
} from "../../../../utils/unifiedPermitPdfGenerator";
import { 
  generateLocationalClearancePdf, 
  LocationalClearancePdfData 
} from "../../../../utils/locationalClearancePdfGenerator";

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
  { id: "BP", name: "Building Permit Form (DPWH Form 77-001-B)", code: "BP", category: "Primary", icon: Building2, desc: "Box 1-8 construction permit with scope, occupancy & cost breakdowns", pages: 2 },
  { id: "UNIFIED", name: "Unified Application Form (Building Permit)", code: "UNIFIED", category: "Primary", icon: FileText, desc: "Combined municipal checklist, applicant profile & zoning assessment", pages: 1 },
  { id: "AP", name: "Architectural Permit Form", code: "AP", category: "Ancillary", icon: Layers, desc: "Architectural specifications, setbacks, finishes, doors & windows", pages: 2 },
  { id: "SP", name: "Civil / Structural Permit Form", code: "SP", category: "Ancillary", icon: Building2, desc: "Foundation depth, concrete strength, structural framing & steel grades", pages: 2 },
  { id: "EP", name: "Electrical Permit Form", code: "EP", category: "Ancillary", icon: Zap, desc: "Connected load, service voltage, main breakers, wiring & fixture schedule", pages: 2 },
  { id: "PL", name: "Sanitary / Plumbing Permit Form", code: "PL", category: "Ancillary", icon: Droplets, desc: "Water supply, sanitary fixtures count, septic tank & piping specs", pages: 2 },
  { id: "MP", name: "Mechanical Permit Form", code: "MP", category: "Ancillary", icon: Wrench, desc: "Machinery, escalators, ACUs, ventilation & refrigeration specs", pages: 2 },
  { id: "EL", name: "Electronics Permit Form", code: "EL", category: "Ancillary", icon: Radio, desc: "Structured cabling, CCTV security, fire alarm systems & telecom", pages: 2 },
  { id: "BFP", name: "BFP Fire Safety Evaluation Form (FSEC)", code: "BFP", category: "Fire Safety", icon: Flame, desc: "Fire exits, egress clearance, firewalls & extinguisher schedules", pages: 1 },
  { id: "LC", name: "Locational Clearance / Zoning Form", code: "LC", category: "Zoning", icon: ShieldCheck, desc: "Zoning classification, land use tenure & site description", pages: 1 },
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
  applicantName: "JUAN DELA CRUZ",
  applicantPhone: "0917-555-0199",
  applicantEmail: "juan.delacruz@example.com",
  applicantAddress: "123 RIZAL ST., BRGY. POBLACION, STO. TOMAS, PAMPANGA",
  applicantTIN: "123-456-789-000",
  formOfOwnership: "INDIVIDUAL / OWNER",
  govIdNo: "PRC-ID-00987654",

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
  electricalConnectedLoad: "15.50 kVA Connected Load",
  electricalVoltage: "230V Single Phase 60Hz 2-Wire Service",
  electricalFeeder: "2 - 14mm² THHN Cu. Wire in 25mm PVC Conduit",
  mainBreaker: "60A 2P 240V Molded Case Circuit Breaker (MCCB)",
  branchCircuitsCount: "8 Branch Circuits",
  lightingOutletsCount: "28 Outlets",
  convenienceOutletsCount: "32 Duplex Outlets",
  acuOutletsCount: "4 Dedicated Outlets",
  waterHeaterOutletsCount: "2 Dedicated Outlets",
  groundingSpec: "16mm Solid Copper Ground Rod with 8mm² Bare Cu. Wire",

  // Plumbing
  waterSupplySource: "Local Sto. Tomas Water District Pipeline",
  sewageSystem: "Individual 3-Chamber Reinforced Concrete Septic Tank",
  septicTankDimensions: "3.20m Length x 1.60m Width x 1.80m Depth",
  waterPipesMaterial: "PPR-C (Polypropylene Random Copolymer) PN20 Pipes",
  wastePipesMaterial: "Series 1000 uPVC Sanitary Sewer Pipes and Fittings",
  waterClosetsCount: "3 Sets",
  lavatoriesCount: "3 Sets",
  kitchenSinksCount: "2 Sets",
  showersCount: "3 Sets",
  floorDrainsCount: "4 Sets",
  faucetsCount: "6 Sets",

  // Mechanical
  machineryType: "Inverter Split-Type Air Conditioning System",
  machineryBrand: "Daikin / Carrier High-Efficiency Inverter",
  machineryCapacity: "4 Units Totaling 6.5 Horsepower Capacity",
  machineryPower: "4.85 kW Power Consumption",
  machinerySpeed: "Variable Speed Inverter Compressor",
  machineryStoreys: "Served: Ground & Second Floor",
  electricalLoadKva: "6.5 kVA Mechanical Service Load",
  serviceVoltage: "230V 1-Phase 60Hz",

  // Electronics
  telecomScope: "Cat6 Structured Cabling Gigabit Ethernet LAN Distribution",
  cctvScope: "8-Channel 4K PoE IP Security Camera Surveillance Network",
  fdasScope: "Addressable Fire Detection and Smoke Alarm Annunciator System",

  // Fire / BFP
  numberOfExits: "2 Fire Exit Doors (Front & Rear Main Entrances)",
  fireEgressDetails: "1.20m Minimum Clear Width Hallways and Stairways",
  fireExtinguisherSpecs: "3 Units of 10 lbs Multi-Purpose ABC Dry Chemical",
  emergencyLightsCount: "4 Twin-head LED Automatic Battery Backup Units",
  smokeDetectorsCount: "6 Hardwired Photoelectric Smoke Detectors",
  firewallSpecs: "200mm Reinforced CHB Firewall with 2-Hour Fire Resistance",

  // Licensed Professionals
  architectName: "ARCH. GILBERT M. CRUZ, UAP",
  architectPRC: "0054321",
  architectPRCValidity: "2027-11-20",
  architectIAPOA: "UAP-102938",
  architectPTR: "PTR-ST-998877",
  architectPTRIssued: "Sto. Tomas, Pampanga / Jan 08, 2026",
  architectTIN: "234-567-890-000",

  civilEngineerName: "ENGR. MARCO POLO D. SANTOS, CE",
  civilEngineerPRC: "0087654",
  civilEngineerPRCValidity: "2028-06-15",
  civilEngineerPICE: "PICE-887766",
  civilEngineerPTR: "PTR-ST-776655",
  civilEngineerPTRIssued: "Sto. Tomas, Pampanga / Jan 10, 2026",
  civilEngineerTIN: "345-678-901-000",

  electricalEngineerName: "ENGR. EDISON T. REYES, PEE",
  electricalEngineerPRC: "0033221",
  electricalEngineerPRCValidity: "2027-09-30",
  electricalEngineerIIEE: "IIEE-554433",
  electricalEngineerPTR: "PTR-ST-443322",
  electricalEngineerPTRIssued: "Sto. Tomas, Pampanga / Jan 12, 2026",
  electricalEngineerTIN: "456-789-012-000",

  masterPlumberName: "ENGR. DARIO K. AQUINO, RMP",
  masterPlumberPRC: "0011998",
  masterPlumberPRCValidity: "2028-01-25",
  masterPlumberNAMPAP: "NAMPAP-778899",
  masterPlumberPTR: "PTR-ST-332211",
  masterPlumberPTRIssued: "Sto. Tomas, Pampanga / Jan 15, 2026",
  masterPlumberTIN: "567-890-123-000",

  mechanicalEngineerName: "ENGR. LEONARDO V. TORRES, PME",
  mechanicalEngineerPRC: "0044556",
  mechanicalEngineerPRCValidity: "2027-12-18",
  mechanicalEngineerPSME: "PSME-223344",
  mechanicalEngineerPTR: "PTR-ST-221100",
  mechanicalEngineerPTRIssued: "Sto. Tomas, Pampanga / Jan 18, 2026",
  mechanicalEngineerTIN: "678-901-234-000",
};

export default function FormTestingStudio() {
  const [selectedFormId, setSelectedFormId] = useState<string>("BP");
  const [formData, setFormData] = useState<UnifiedPermitFormData>(CALIBRATED_TEST_DATA);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [genTimeMs, setGenTimeMs] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "specs" | "professionals">("general");

  const selectedForm = FORMS.find(f => f.id === selectedFormId) || FORMS[0];

  const handleFieldChange = (field: keyof UnifiedPermitFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLoadSample = () => {
    setFormData(CALIBRATED_TEST_DATA);
  };

  const handleClear = () => {
    setFormData({
      ...CALIBRATED_TEST_DATA,
      applicantName: "",
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

      setPdfUrl(generatedUrl);
      setGenTimeMs(Math.round(performance.now() - startTime));
    } catch (err: any) {
      console.error("Failed to generate test PDF:", err);
      alert("Error generating PDF: " + (err.message || String(err)));
    } finally {
      setIsGenerating(false);
    }
  };

  // Automatically generate when switching forms for instant visual feedback
  useEffect(() => {
    handleGeneratePdf();
  }, [selectedFormId]);

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
          ADMIN CALIBRATION MODE
        </span>
      </div>

      {/* Main Studio Header */}
      <div style={{
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        color: "white",
        borderRadius: "20px",
        padding: "1.75rem 2rem",
        marginBottom: "1.5rem",
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
            <span>Interactive Form Testing & Placement Studio</span>
          </div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: "900", margin: "0 0 0.4rem 0", letterSpacing: "-0.5px" }}>
            Official Permitting Forms Verification Suite
          </h1>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.92rem", maxWidth: "780px", lineHeight: "1.5" }}>
            Test each municipal permit form individually. Enter test values, check if all checkboxes and input fields are answerable, and verify that text lands in the exact coordinates of the official scanned government template.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
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
            <span>{isGenerating ? "Generating..." : "Generate & Inspect PDF"}</span>
          </button>
        </div>
      </div>

      {/* Form Picker Tabs (Horizontal Scrollable Selector) */}
      <div style={{
        display: "flex",
        gap: "0.6rem",
        overflowX: "auto",
        paddingBottom: "0.75rem",
        marginBottom: "1.5rem"
      }}>
        {FORMS.map(form => {
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                      Application Reference No.
                    </label>
                    <input
                      type="text"
                      value={formData.applicationNo}
                      onChange={e => handleFieldChange("applicationNo", e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "600" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                      Locational Clearance Ref
                    </label>
                    <input
                      type="text"
                      value={formData.locationalClearanceRef}
                      onChange={e => handleFieldChange("locationalClearanceRef", e.target.value)}
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
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

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={e => handleFieldChange("projectName", e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "600" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                      Project Street Address / Subd.
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem" }}>
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
                </div>

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
                    <input
                      type="text"
                      value={formData.occupancyClass}
                      onChange={e => handleFieldChange("occupancyClass", e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "specs" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
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
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                      Building Height (meters)
                    </label>
                    <input
                      type="text"
                      value={formData.buildingHeight || ""}
                      onChange={e => handleFieldChange("buildingHeight", e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                      Total Estimated Project Cost (PHP)
                    </label>
                    <input
                      type="text"
                      value={formData.projectCost}
                      onChange={e => handleFieldChange("projectCost", e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "700", color: "#047857" }}
                    />
                  </div>
                </div>

                {/* Specific form fields depending on active form */}
                <div style={{ marginTop: "0.5rem", padding: "1rem", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.88rem", fontWeight: "800", color: "#1e293b" }}>
                    Form-Specific Technical Parameters ({selectedForm.code})
                  </h4>

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

                  {selectedForm.id === "BFP" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>No. of Fire Exits</label>
                        <input type="text" value={formData.numberOfExits || ""} onChange={e => handleFieldChange("numberOfExits", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b" }}>Fire Extinguisher Specs</label>
                        <input type="text" value={formData.fireExtinguisherSpecs || ""} onChange={e => handleFieldChange("fireExtinguisherSpecs", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }} />
                      </div>
                    </div>
                  )}

                  {selectedForm.id === "BP" && (
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
                  )}
                </div>
              </div>
            )}

            {activeTab === "professionals" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Architect */}
                <div style={{ padding: "0.9rem", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#1d4ed8" }}>Architect / Design Professional</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Full Name</label>
                      <input type="text" value={formData.architectName || ""} onChange={e => handleFieldChange("architectName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC No.</label>
                      <input type="text" value={formData.architectPRC || ""} onChange={e => handleFieldChange("architectPRC", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR No.</label>
                      <input type="text" value={formData.architectPTR || ""} onChange={e => handleFieldChange("architectPTR", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                    </div>
                  </div>
                </div>

                {/* Civil Engineer */}
                <div style={{ padding: "0.9rem", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#047857" }}>Civil / Structural Engineer</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Full Name</label>
                      <input type="text" value={formData.civilEngineerName || ""} onChange={e => handleFieldChange("civilEngineerName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC No.</label>
                      <input type="text" value={formData.civilEngineerPRC || ""} onChange={e => handleFieldChange("civilEngineerPRC", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR No.</label>
                      <input type="text" value={formData.civilEngineerPTR || ""} onChange={e => handleFieldChange("civilEngineerPTR", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                    </div>
                  </div>
                </div>

                {/* Electrical Engineer */}
                <div style={{ padding: "0.9rem", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#b45309" }}>Professional Electrical Engineer (PEE)</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Full Name</label>
                      <input type="text" value={formData.electricalEngineerName || ""} onChange={e => handleFieldChange("electricalEngineerName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC No.</label>
                      <input type="text" value={formData.electricalEngineerPRC || ""} onChange={e => handleFieldChange("electricalEngineerPRC", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR No.</label>
                      <input type="text" value={formData.electricalEngineerPTR || ""} onChange={e => handleFieldChange("electricalEngineerPTR", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                    </div>
                  </div>
                </div>

                {/* Master Plumber */}
                <div style={{ padding: "0.9rem", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#0369a1" }}>Master Plumber / Sanitary Engineer</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Full Name</label>
                      <input type="text" value={formData.masterPlumberName || ""} onChange={e => handleFieldChange("masterPlumberName", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PRC No.</label>
                      <input type="text" value={formData.masterPlumberPRC || ""} onChange={e => handleFieldChange("masterPlumberPRC", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>PTR No.</label>
                      <input type="text" value={formData.masterPlumberPTR || ""} onChange={e => handleFieldChange("masterPlumberPTR", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
                    </div>
                  </div>
                </div>
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
            {isGenerating ? (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", gap: "1rem" }}>
                <RefreshCw size={36} className="animate-spin" color="#38bdf8" />
                <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>Calibrating & Compiling Form Overlay...</span>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                title="Generated Test PDF"
                style={{ width: "100%", height: "100%", border: "none" }}
              />
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
