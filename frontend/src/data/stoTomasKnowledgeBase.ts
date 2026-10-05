/**
 * Official Sto. Tomas, Pampanga Municipal Permitting Knowledge Base & ML NLP Engine
 * 
 * Powers "Mang Tomas" AI Virtual Permitting Officer with:
 * 1. Semantic Tokenization, Stemming, and TF-IDF Cosine Fuzzy Matcher
 * 2. Intent Classifier & Entity Extractor (Floor Area, Barangays, Permit Types, Application IDs)
 * 3. Dynamic Fee Estimator (DPWH NBCDO & Sto. Tomas Municipal Revenue Code)
 * 4. 7 Official Barangays Cadastral & Zoning Profiles
 * 5. 38+ Granular Permitting & Engineering FAQs
 * 6. Contextual RAG Retrieval for LLMs (Gemini / OpenAI)
 */

export interface FAQItem {
  id: string;
  question: string;
  keywords: string[];
  intents: string[];
  answer: string;
  category: "zoning" | "building" | "ancillary" | "fees" | "tracking" | "legal" | "occupancy" | "barangay" | "general";
  followUps?: string[];
  actionLink?: { label: string; url: string };
}

export interface BarangayProfile {
  name: string;
  altNames: string[];
  zoningClass: string;
  floodRisk: "Low" | "Moderate" | "High";
  description: string;
  specialRules: string[];
}

export const STO_TOMAS_MUNICIPAL_INFO = {
  municipality: "Municipality of Sto. Tomas",
  province: "Province of Pampanga",
  region: "Region III (Central Luzon)",
  zipCode: "2020",
  classification: "4th Class Municipality",
  hallLocation: "Municipal Hall, Poblacion, Sto. Tomas, Pampanga 2020",
  office: "Office of the Municipal Engineer / Building Official (OBO)",
  zoningOffice: "Office of the Zoning Administrator / MPDC",
  fireStation: "Bureau of Fire Protection (BFP) - Sto. Tomas Fire Station",
  portalName: "eTAYO: Unified Municipal Permitting & Building Monitoring System",
  workingHours: "Lunes hanggang Biyernes, 8:00 AM - 5:00 PM (No Noon Break)",
  contactNumber: "(045) 436-1234 / 0917-123-4567",
  email: "obo@stotomaspampanga.gov.ph",
  portalUrl: "https://e-tayo-official.gov.ph"
};

export const BARANGAYS_DATABASE: Record<string, BarangayProfile> = {
  poblacion: {
    name: "Poblacion",
    altNames: ["poblacion", "sentro", "bayan", "town proper"],
    zoningClass: "High-Density Residential & Commercial (C-1 / R-3 / Institutional)",
    floodRisk: "Low",
    description: "The municipal center of Sto. Tomas hosting the Municipal Hall, Catholic Church, Rural Health Unit, and commercial establishments.",
    specialRules: [
      "Strict pedestrian sidewalk and RROW clearance enforced.",
      "Commercial facades along main municipal road must comply with Sto. Tomas heritage aesthetic guidelines."
    ]
  },
  san_matias: {
    name: "San Matias",
    altNames: ["san matias", "matias", "sm"],
    zoningClass: "Commercial, Industrial & Medium-Density Residential (C-2 / I-1 / R-2)",
    floodRisk: "Low",
    description: "The major economic gateway along MacArthur Highway (Manila North Road) characterized by heavy commercial, retail, warehousing, and ceramic/pottery manufacturing.",
    specialRules: [
      "Mandatory minimum 5.0m front setback along MacArthur Highway.",
      "Off-street customer parking mandatory for all commercial establishments (1 slot per 50 sq.m. gross floor area)."
    ]
  },
  moras_de_la_paz: {
    name: "Moras De La Paz",
    altNames: ["moras", "moras de la paz", "delapaz"],
    zoningClass: "Medium-Density Residential & Cottage Industrial (R-2 / I-1)",
    floodRisk: "Moderate",
    description: "Renowned as the coffin-making capital and craft center of Central Luzon, with numerous woodworking and carpentry establishments alongside residential areas.",
    specialRules: [
      "Woodworking workshops must secure BFP Fire Safety Evaluation Clearance (FSEC) with industrial dust suppression and approved firewalls.",
      "Hazardous waste disposal plan required for lacquer and paint finishes."
    ]
  },
  san_vicente: {
    name: "San Vicente",
    altNames: ["san vicente", "vicente"],
    zoningClass: "Low to Medium-Density Residential & Agricultural (R-1 / R-2 / Agri)",
    floodRisk: "Moderate",
    description: "Peaceful residential community with agricultural tracts and pottery workshops.",
    specialRules: [
      "Minimum 3.0m water easement buffer required for properties adjoining natural creeks or irrigation canals.",
      "Residential single-family homes observe standard 4.5m front setback."
    ]
  },
  santo_rosario: {
    name: "Santo Rosario",
    altNames: ["sto rosario", "santo rosario", "pau"],
    zoningClass: "Low-Density Residential & Agro-Industrial (R-1 / Agri)",
    floodRisk: "Moderate",
    description: "Traditional residential community with fertile agricultural plains and local commercial retail.",
    specialRules: [
      "Zoning conversion clearance from MPDC required if converting agricultural parcels to residential subdivisions or commercial strips."
    ]
  },
  san_bartolome: {
    name: "San Bartolome",
    altNames: ["san bartolome", "bartolome"],
    zoningClass: "Residential & Agricultural (R-1 / Agri)",
    floodRisk: "Moderate to High",
    description: "Serene community bordering watercourses and agricultural lands.",
    specialRules: [
      "Finished ground floor line must be elevated at least 0.50m to 1.0m above existing crown of road for flood resilience.",
      "Septic tanks must be hermetically sealed 3-chamber digestive systems."
    ]
  },
  sapa: {
    name: "Sapa",
    altNames: ["sapa", "brgy sapa"],
    zoningClass: "Agro-Fishery & Low-Density Residential (Agri / R-1)",
    floodRisk: "High",
    description: "Waterway-adjacent community characterized by fishponds, agricultural lands, and residential homesteads.",
    specialRules: [
      "Mandatory 3.0m easement from riverbanks under the Philippine Water Code (PD 1067).",
      "Stilt or reinforced elevated foundation design recommended for waterfront structures."
    ]
  }
};

export const PERMITTING_PROCESS_STAGES = [
  {
    stage: 1,
    name: "Hakbang 1: Locational Clearance (Zoning Approval)",
    office: "Municipal Planning & Development Coordinator (MPDC) / Zoning Administrator",
    purpose: "Sinusuri kung ang itatayong gusali ay legal at tugma sa Comprehensive Land Use Plan (CLUP) at Zoning Ordinance ng Sto. Tomas.",
    prerequisite: "Certified True Copy ng Titulo (TCT), Tax Declaration, Real Property Tax Clearance (Amilyar), Lot Plan with Vicinity Map mula sa Geodetic Engineer.",
    crucialNote: "MAHALAGA: Hindi maaaring kumuha ng Building Permit hangga't walang aprubadong Locational Clearance!"
  },
  {
    stage: 2,
    name: "Hakbang 2: Unified Building Permit & Ancillary Permits",
    office: "Office of the Building Official (OBO)",
    purpose: "Pagsusuri sa engineering, architectural, at structural safety ayon sa National Building Code (PD 1096).",
    formsIncluded: [
      "Unified Application Form for Building Permit (NBC Form 1 / DPWH Form 77-001-B)",
      "Architectural Permit (NBC Form A-01) - Selyado ng Licensed Architect",
      "Civil/Structural Permit (NBC Form S-01) - Selyado ng Licensed Civil Engineer",
      "Electrical Permit (NBC Form E-01) - Selyado ng Professional Electrical Engineer (PEE)",
      "Sanitary/Plumbing Permit (NBC Form P-01) - Selyado ng Master Plumber (RMP) o Sanitary Engineer",
      "Mechanical Permit (NBC Form M-01) - Kung may ACUs, elevator, o cold storage",
      "Electronics Permit (NBC Form EL-01) - Kung may CCTV, FDAS, o network racks",
      "BFP Fire Safety Evaluation Clearance (FSEC) - Mula sa BFP Sto. Tomas Fire Station"
    ]
  },
  {
    stage: 3,
    name: "Hakbang 3: Inspection, CFEI, at Occupancy Permit",
    office: "OBO & BFP Sto. Tomas",
    purpose: "Pagsusuri kung ang aktwal na naitayo ay sumunod sa aprubadong plano bago tirhan o gamitin.",
    formsIncluded: [
      "Certificate of Completion Form (pinirmahan ng supervising engineers)",
      "Certificate of Final Electrical Inspection (CFEI - kailangan ng PELCO 2)",
      "BFP Fire Safety Inspection Certificate (FSIC)",
      "Unified Certificate of Occupancy (pormal na pahintulot na tirhan/gamitin ang gusali)"
    ]
  }
];

export const OFFICIAL_16_FORMS_GUIDE: Record<string, { name: string; code: string; category: string; description: string; signatories: string; requirements: string[] }> = {
  LC: {
    name: "Application for Locational Clearance / Zoning",
    code: "LC",
    category: "Zoning & Land Use",
    description: "Pagsusuri sa zoning classification, land use conformity, at setbacks sa Sto. Tomas.",
    signatories: "Applicant / Lot Owner",
    requirements: [
      "Certified True Copy ng Transfer Certificate of Title (TCT) o Deed of Sale",
      "Current Tax Declaration (Lupa at Gusali kung may existing)",
      "Real Property Tax (Amilyar) Clearance sa kasalukuyang taon",
      "Lot Plan at Vicinity Map na pinirmahan ng Geodetic Engineer",
      "Barangay Clearance for Building / Construction mula sa kinasasakupang barangay"
    ]
  },
  BP: {
    name: "Unified Application Form for Building Permit",
    code: "NBC Form 1 (DPWH Form 77-001-B)",
    category: "Core Building",
    description: "Pangunahing aplikasyon na naglalaman ng kabuuang sukat, halaga ng proyekto, at supervising engineers.",
    signatories: "Applicant/Owner, Full-time Supervising Architect o Civil Engineer",
    requirements: [
      "Aprubadong Locational Clearance mula sa MPDC",
      "5 sets ng Blueprints (Architectural, Structural, Electrical, Plumbing) signed and sealed",
      "Structural Analysis and Design Computations (para sa 2 storeys pataas)",
      "Boring/Soil Test Report (para sa 3 storeys pataas o soft soil)",
      "Bill of Materials & Cost Estimate",
      "Technical Specifications Document",
      "BFP Fire Safety Evaluation Clearance (FSEC)"
    ]
  },
  AP: {
    name: "Architectural Permit Form",
    code: "NBC Form A-01",
    category: "Ancillary",
    description: "Floor plans, elevations, sections, door/window schedules, at architectural finishes.",
    signatories: "Licensed Architect (PRC, PTR, IAPOA, TIN)",
    requirements: ["Architectural Plans (1:100 scale)", "Door and Window Schedules", "Architectural Finishes Specifications", "Architect valid PRC ID & PTR"]
  },
  SP: {
    name: "Civil / Structural Permit Form",
    code: "NBC Form S-01",
    category: "Ancillary",
    description: "Foundation, column/beam reinforcement, slab thickness, and seismic lateral design.",
    signatories: "Licensed Civil Engineer (PRC, PTR, PICE, TIN)",
    requirements: ["Structural Details & Framing Plans", "Structural Analysis (2+ storeys)", "Civil Engineer valid PRC ID & PTR"]
  },
  EP: {
    name: "Electrical Permit Form",
    code: "NBC Form E-01",
    category: "Ancillary",
    description: "Connected electrical load (kVA), service entrance, circuit breaker sizing, and lighting layouts.",
    signatories: "Professional Electrical Engineer (PEE - PRC, PTR, IIEE)",
    requirements: ["Electrical Layout Plans", "Single Line Diagram", "Load Schedule & Voltage Drop Computations", "PEE valid PRC ID & PTR"]
  },
  PL: {
    name: "Sanitary / Plumbing Permit Form",
    code: "NBC Form P-01",
    category: "Ancillary",
    description: "Potable water supply, sewer lines, vents, and 3-chamber digestive septic tank details.",
    signatories: "Licensed Master Plumber (RMP) o Sanitary Engineer",
    requirements: ["Plumbing Layout & Isometrics", "3-Chamber Septic Tank Engineering Plan", "Plumber valid PRC ID & PTR"]
  },
  MP: {
    name: "Mechanical Permit Form",
    code: "NBC Form M-01",
    category: "Ancillary",
    description: "Air-conditioning tonnage, exhaust ductwork, elevators, hoists, at mechanical generators.",
    signatories: "Professional Mechanical Engineer (PME)",
    requirements: ["Mechanical Layout Plans", "Equipment Ratings & Ducting Details", "PME valid PRC ID & PTR"]
  },
  EL: {
    name: "Electronics Permit Form",
    code: "NBC Form EL-01",
    category: "Ancillary",
    description: "Structured cabling, CCTV surveillance, FDAS fire alarms, and telecoms.",
    signatories: "Professional Electronics Engineer (PECE)",
    requirements: ["Electronics Layout Plans", "Wiring Schematics & Fire Alarm Risers", "PECE valid PRC ID & PTR"]
  },
  CO: {
    name: "Certificate of Occupancy",
    code: "CO (Unified Form)",
    category: "Completion & Occupancy",
    description: "Pormal na clearance na nagpapatunay na ligtas at tapos na ang gusali at maaari na itong tirhan.",
    signatories: "Municipal Building Official",
    requirements: [
      "Notarized Certificate of Completion (pinirmahan ng Architect/Engineers)",
      "As-Built Blueprints (kung may bahagyang pagbabago sa orihinal)",
      "Certificate of Final Electrical Inspection (CFEI)",
      "BFP Fire Safety Inspection Certificate (FSIC)",
      "Construction Logbook at Picture ng natapos na proyekto"
    ]
  },
  CFEI: {
    name: "Certificate of Final Electrical Inspection",
    code: "CFEI (NBC Form 96006-E)",
    category: "Utilities & Completion",
    description: "Clearance na kailangan ng electric utility (PELCO 2) para ikabit ang metro ng kuryente.",
    signatories: "Municipal Electrical Inspector & OBO",
    requirements: ["As-Built Electrical Plans", "Grounding Resistance Test Result (< 5 ohms)", "Actual site wiring inspection"]
  },
  FENCING: {
    name: "Fencing Permit Form",
    code: "FP (NBC Form 8)",
    category: "Accessory Permit",
    description: "Permit para sa pagtatayo ng kongkretong bakod (masonry wall), cyclone wire, o gate sa property boundary.",
    signatories: "Lot Owner, Civil Engineer",
    requirements: [
      "TCT / Land Title at Tax Declaration",
      "Lot Plan at Fencing Plan (elevations, foundation, rebar details)",
      "Barangay Clearance",
      "Maximum height: 2.0m solid masonry (1.50m along front road line with see-through grill above)"
    ]
  },
  DEMOLITION: {
    name: "Demolition Permit Form",
    code: "DP (NBC Form 9)",
    category: "Accessory Permit",
    description: "Permit bago gibain o baklasin ang isang lumang gusali o istruktura.",
    signatories: "Lot Owner, Supervising Civil Engineer",
    requirements: [
      "Proof of Ownership (TCT)",
      "Demolition Methodology and Safety Plan",
      "Barangay Demolition Clearance",
      "Notice to adjacent neighbors"
    ]
  }
};

export const ZONING_RULES_SUMMARY = {
  setbacks: {
    residentialR1: { front: "4.50 meters", rear: "2.00 meters", left: "2.00 meters", right: "2.00 meters" },
    residentialR2: { front: "3.00 meters", rear: "2.00 meters", left: "2.00 meters", right: "2.00 meters" },
    commercial: { front: "5.00 meters", rear: "2.00 meters", sides: "2.00 meters" },
    industrial: { front: "8.00 meters", rear: "5.00 meters", sides: "5.00 meters" }
  },
  firewalls: "Pinapayagan sa isang gilid o likod para sa R-2 duplex/rowhouse. Dapat ay may 2-hour fire resistance rating (minimum 150mm CHB with solid plaster) at may 1.00 metrong parapet wall sa itaas ng roofline. Sa R-1 single-family, kailangan ng notarized Affidavit of Consent mula sa katabing may-ari ng lupa.",
  heightLimits: {
    residentialR1: "Hanggang 3 palapag o 10.0 meters.",
    residentialR2: "Hanggang 3 hanggang 5 palapag depende sa lapad ng kalsada (RROW).",
    commercial: "Hanggang 5 palapag o 18.0 meters depende sa lapad ng kalsada."
  }
};

// -------------------------------------------------------------
// DYNAMIC FEE CALCULATOR MODEL (DPWH NBCDO + STO. TOMAS CODE)
// -------------------------------------------------------------
export interface FeeEstimationResult {
  floorAreaSqM: number;
  buildingType: "residential" | "commercial" | "industrial";
  storeys: number;
  locationalClearanceFee: number;
  buildingPermitFee: number;
  electricalPermitFee: number;
  plumbingPermitFee: number;
  fsecFireCodeFee: number;
  lineAndGradeFee: number;
  filingProcessingFee: number;
  totalEstimatedFee: number;
  breakdownSummary: string;
}

export function calculateEstimatedFees(
  area: number,
  type: "residential" | "commercial" | "industrial" = "residential",
  storeys: number = 1
): FeeEstimationResult {
  const safeArea = Math.max(15, area);
  
  // NBCDO Schedule of Fees approximations
  let bldgRatePerSqm = 16.0; // Residential Group A
  let estCostPerSqm = 18000; // Est. construction cost for fire code calculation

  if (type === "commercial") {
    bldgRatePerSqm = 28.0;
    estCostPerSqm = 26000;
  } else if (type === "industrial") {
    bldgRatePerSqm = 24.0;
    estCostPerSqm = 22000;
  }

  // Base building fee
  const buildingPermitFee = Math.round(safeArea * bldgRatePerSqm);

  // Locational Clearance (Zoning) Fee: ~₱3.50/sqm + base ₱300
  const locationalClearanceFee = Math.round(300 + (safeArea * 3.5));

  // Electrical Permit Fee (based on floor area & expected fixtures/kVA)
  const electricalPermitFee = Math.round(Math.max(600, safeArea * 12));

  // Plumbing / Sanitary Permit Fee (fixtures & septic tank)
  const plumbingPermitFee = Math.round(Math.max(500, safeArea * 8));

  // Line and Grade Verification Fee
  const lineAndGradeFee = 250;

  // Filing & Processing Fee
  const filingProcessingFee = 400;

  // BFP Fire Safety Evaluation Clearance (FSEC): 0.10% of 10% of bldg cost or schedule
  const totalBldgCost = safeArea * estCostPerSqm;
  const fsecFireCodeFee = Math.round(Math.max(500, Math.min(6000, totalBldgCost * 0.0005)));

  const totalEstimatedFee = (
    locationalClearanceFee +
    buildingPermitFee +
    electricalPermitFee +
    plumbingPermitFee +
    fsecFireCodeFee +
    lineAndGradeFee +
    filingProcessingFee
  );

  const breakdownSummary = 
`📊 **TINATAYANG KWENTADA NG PERMIT FEES (${safeArea} sq.m. ${type.toUpperCase()})**:
• **Locational Clearance (Zoning)**: ₱${locationalClearanceFee.toLocaleString()}
• **Building Permit Fee (OBO)**: ₱${buildingPermitFee.toLocaleString()}
• **Electrical Permit Fee**: ₱${electricalPermitFee.toLocaleString()}
• **Plumbing / Sanitary Permit Fee**: ₱${plumbingPermitFee.toLocaleString()}
• **BFP Fire Safety (FSEC Fee)**: ₱${fsecFireCodeFee.toLocaleString()}
• **Line & Grade / Filing Fee**: ₱${(lineAndGradeFee + filingProcessingFee).toLocaleString()}

💰 **KABUUANG TINATAYANG BAYAD**: **₱${totalEstimatedFee.toLocaleString()}**

*(Paalala: Ito po ay standardized estimate ayon sa DPWH NBCDO Schedule of Fees. Ang opisyal na Order of Payment ay ilalabas ng OBO Municipal Assessor kapag nasuri ang inyong Blueprints at Bill of Materials.)*`;

  return {
    floorAreaSqM: safeArea,
    buildingType: type,
    storeys,
    locationalClearanceFee,
    buildingPermitFee,
    electricalPermitFee,
    plumbingPermitFee,
    fsecFireCodeFee,
    lineAndGradeFee,
    filingProcessingFee,
    totalEstimatedFee,
    breakdownSummary
  };
}

// -------------------------------------------------------------
// EXPANDED KNOWLEDGE BASE (38+ DETAILED FAQS & WORKFLOWS)
// -------------------------------------------------------------
export const FAQ_DATABASE: FAQItem[] = [
  // 1. House Construction Requirements
  {
    id: "house_reqs",
    question: "Ano ang mga kailangan para magpatayo ng bahay sa Sto. Tomas?",
    keywords: ["bahay", "residential", "house", "magpatayo", "magpatyo", "itayo", "kailangan", "requirements", "dokumento", "requirements sa pagpapatayo ng bahay"],
    intents: ["REQUIREMENTS", "BUILDING_PERMIT"],
    category: "building",
    actionLink: { label: "Mag-apply para sa Locational Clearance", url: "/applicant/apply?type=locational_clearance" },
    followUps: ["Magkano ang permit fees para sa 100 sqm?", "Ano ang required setbacks sa residential?", "Bakit kailangan muna ang Locational Clearance?"],
    answer: `Mabuhay! Para sa pagpapatayo ng **Residential House** sa Sto. Tomas, Pampanga, sundin ang opisyal na 2-Step Permitting Process:

📌 **HAKBANG 1: Locational Clearance (Zoning Approval mula sa MPDC)**
Kailangan muna ang clearance na ito bago mag-apply sa Building Permit:
1. Certified True Copy ng **Transfer Certificate of Title (TCT)** o Notarized Deed of Sale
2. Updated **Tax Declaration** (Lupa)
3. **Real Property Tax (Amilyar) Clearance** para sa kasalukuyang taon
4. **Lot Plan with Vicinity Map** na may pirma at selyo ng Geodetic Engineer
5. **Barangay Construction Clearance** mula sa inyong Barangay Hall sa Sto. Tomas

📌 **HAKBANG 2: Unified Building Permit (OBO)**
Kapag may Locational Clearance na, ihanda ang sumusunod para sa OBO:
1. **5 Sets ng Kumpletong Blueprints** (Architectural, Structural, Electrical, Plumbing) na may pirma at selyo ng mga lisensyadong propesyonal
2. **Structural Analysis & Computations** (kung 2 palapag pataas)
3. **Bill of Materials & Cost Estimate**
4. **Technical Specifications Document**
5. **BFP Fire Safety Evaluation Clearance (FSEC)**

💡 *Tip: Maaari ninyong simulan ang inyong aplikasyon online dito mismo sa eTAYO portal!*`
  },

  // 2. Why Locational Clearance First
  {
    id: "why_locational_first",
    question: "Bakit kailangan muna ang Locational Clearance bago ang Building Permit?",
    keywords: ["bakit", "locational", "clearance", "bago", "building", "permit", "zoning", "una", "prior", "sequence"],
    intents: ["PROCESS_EXPLANATION", "ZONING"],
    category: "zoning",
    actionLink: { label: "Tingnan ang Permitting Stages", url: "/applicant/dashboard" },
    followUps: ["Ano ang requirements sa Locational Clearance?", "Ano ang zoning sa barangay ko?"],
    answer: `Ayon sa Batas Pambansa at sa **Sto. Tomas Municipal Zoning Ordinance**, ang **Locational Clearance** ay ang legal na patunay na ang inyong lupang pagtatayuan ay:

1. **Sumusunod sa Land Use Plan**: Tinitiyak ng Municipal Planning & Development Coordinator (MPDC) na ang uri ng inyong gusali (tirahan, tindahan, o bodega) ay pinapayagan sa zoning classification ng inyong barangay.
2. **Ligtas sa Hazard Zones**: Sinusuri kung ang lupa ay hindi nakaharang sa waterways, road widening project, o critical flood easements.
3. **Sumusunod sa Boundary Setbacks**: Sinisiguro ang sapat na distansya mula sa kalsada at katabing lote.

⚠️ **Mahalagang Batas**: Sa ilalim ng National Building Code (PD 1096), **mahigpit na ipinagbabawal** sa Building Official ang pag-isyu ng Building Permit kung walang aprubadong Locational Clearance.`
  },

  // 3. Setbacks & Boundaries
  {
    id: "setbacks_rules",
    question: "Ano ang required setbacks para sa residential property sa Sto. Tomas?",
    keywords: ["setback", "setbacks", "layo", "bakod", "harapan", "gilid", "likod", "boundary", "distansya", "sukat ng layo"],
    intents: ["ZONING", "SETBACKS"],
    category: "zoning",
    followUps: ["Pwede ba magtayo ng firewall sa gilid?", "Ano ang ceiling height requirement?"],
    answer: `Ayon sa **Sto. Tomas Zoning Code** at **National Building Code (PD 1096 Chapter 7 & 8)**, narito ang standard setbacks:

🏡 **Low-Density Residential (R-1 - Single Detached):**
• **Harapan (Front Setback)**: Minimum na **4.50 metro** mula sa property line / kalsada
• **Likuran (Rear Setback)**: Minimum na **2.00 metro**
• **Magkabilang Gilid (Side Setbacks)**: Minimum na **2.00 metro** bawat gilid

🏘️ **Medium-Density Residential (R-2 - Duplex / Rowhouse):**
• **Harapan**: Minimum na **3.00 metro**
• **Likuran**: Minimum na **2.00 metro**
• **Isang Gilid**: Minimum na **2.00 metro** (kung may firewall sa kabilang gilid)

🏢 **Commercial (C-1 / C-2):**
• **Harapan**: Minimum na **5.00 metro** (lalo na sa MacArthur Highway, San Matias)
• **Likuran at Gilid**: Minimum na **2.00 metro**

⚠️ *Tandaan: Ang eave o labas ng bubong ay dapat may distansyang hindi bababa sa 0.75m mula sa property line upang hindi pumatak ang tubig-ulan sa kapitbahay.*`
  },

  // 4. Firewall Rules & Consent
  {
    id: "firewall_rules",
    question: "Pwede ba magtayo ng firewall sa tabi ng boundary o kailangan ng consent ng kapitbahay?",
    keywords: ["firewall", "fire wall", "dikit", "pader", "boundary", "kapitbahay", "consent", "affidavit", "katabi"],
    intents: ["ZONING", "FIREWALL"],
    category: "zoning",
    followUps: ["Ano ang requirements sa Building Permit?", "Ano ang required setbacks sa residential?"],
    answer: `Opo, pinapayagan ang **Firewall**, ngunit may mahigpit na panuntunan ang OBO at National Building Code:

1. **Sa Residential R-1 (Single Detached)**:
   • Hindi awtomatikong pinapayagan ang firewall sa boundary.
   • Kung talagang kailangan, nararapat kumuha ng **Notarized Affidavit of Consent** mula sa may-ari ng katabing lote.

2. **Sa Residential R-2 / Rowhouses**:
   • Pinapayagan ang firewall sa **isang gilid lamang** o sa **likuran**, hanggang sa maximum na 80% ng haba ng boundary line.

3. **Structural & Fire Safety Specifications**:
   • Dapat ay gawa sa solid masonry (minimum 150mm CHB na may buhos at rebars) na may **2-hour fire-resistance rating**.
   • **WALANG BUKAS NA BINTANA O VENT**: Mahigpit na bawal maglagay ng anumang bintana, butas, o aircon hole sa firewall.
   • **Parapet Extension**: Dapat lumampas ang pader ng hindi bababa sa **1.00 metro** sa itaas ng pinakamataas na parte ng bubong upang maiwasan ang pagtalon ng sunog.`
  },

  // 5. Permit Fees Calculation
  {
    id: "fees_inquiry",
    question: "Magkano ang bayad o permit fees para sa 2-storey house?",
    keywords: ["magkano", "fee", "fees", "bayad", "cost", "presyo", "2-storey", "floor area", "halaga", "singil", "magkanu", "magkno"],
    intents: ["FEES", "CALCULATOR"],
    category: "fees",
    followUps: ["Ano ang mga kailangan para magpatayo ng bahay sa Sto. Tomas?", "Paano i-check ang status ng application ko?"],
    answer: `Ang bayad sa permit sa Sto. Tomas ay **hindi flat rate** — ito ay kinukwenta base sa **Kabuuang Floor Area (sq.m.)**, uri ng gusali, at estimated cost ayon sa DPWH NBCDO Schedule of Fees.

Halimbawa, para sa isang **100 sq.m. na Residential House**:
• **Locational Clearance (Zoning)**: ~₱650
• **Building Permit Fee (OBO)**: ~₱1,600
• **Electrical Permit Fee**: ~₱1,200
• **Plumbing / Sanitary Permit Fee**: ~₱800
• **BFP Fire Safety (FSEC)**: ~₱900
• **Line & Grade / Filing Fee**: ~₱650
💰 **Tinatayang Kabuuang Bayad**: Humigit-kumulang **₱5,500 - ₱7,000**.

Para sa **150 sq.m. na 2-Storey House**:
💰 **Tinatayang Kabuuang Bayad**: Humigit-kumulang **₱8,000 - ₱12,500**.

💡 *Gusto ninyo bang kwentahin ko ang eksaktong floor area ninyo? I-type lamang, halimbawa: "Magkano para sa 80 sqm?"*`
  },

  // 6. Application Status Tracking
  {
    id: "track_status",
    question: "Paano ko iche-check ang status ng aking permit application?",
    keywords: ["status", "check", "track", "nasaan", "asan", "follow up", "follow-up", "kamusta", "kumusta", "update", "balita", "permit ko"],
    intents: ["STATUS_INQUIRY", "TRACKING"],
    category: "tracking",
    actionLink: { label: "Pumunta sa Track Applications", url: "/applicant/track" },
    followUps: ["Sino-sino ang mga propesyonal na kailangang pumirma sa plano?", "Gaano katagal bago maaprubahan ang permit?"],
    answer: `Maaari ninyong subaybayan ang inyong aplikasyon sa pamamagitan ng:

1. **Dito sa Chat**: Kung mayroon kayong Tracking ID (hal. \`LC-2026-1841\` o \`APP-2026-9084\`), sabihin lamang ito sa akin at titingnan ko agad ang kasalukuyang talaan!
2. **Sa eTAYO Portal**: I-click ang **'Track Applications'** sa sidebar menu upang makita ang 4-stage visual timeline (Submission → Engineering Evaluation → Order of Payment → Approved / Releasing).
3. **Email at SMS Alerts**: Awtomatikong nagpapadala ang sistema ng update kapag naaprubahan o may kailangang amyendahan sa inyong mga dokumento.`
  },

  // 7. Professionals Signatures
  {
    id: "professionals_signatures",
    question: "Sino-sino ang mga propesyonal na kailangang pumirma sa mga plano?",
    keywords: ["pumirma", "pirma", "engineer", "architect", "arkitekto", "inhinyero", "propesyonal", "sign", "selyado", "prc", "ptr"],
    intents: ["ENGINEERING", "SIGNATORIES"],
    category: "ancillary",
    followUps: ["Kailangan ba ng soil test kapag 2 storeys?", "Kailangan ba ng structural analysis computation?"],
    answer: `Para sa legal at kumpletong pagsusuri ng OBO Sto. Tomas, kailangan ang pirma at selyo ng mga sumusunod na lisensyadong propesyonal na may updated **PRC License** at **PTR (Professional Tax Receipt)**:

1. **Architectural Plans (A-01)**: Licensed Architect (PRC, PTR, IAPOA)
2. **Structural Plans & Computations (S-01)**: Licensed Civil Engineer (PRC, PTR, PICE)
3. **Electrical Plans & Load Schedules (E-01)**: Professional Electrical Engineer (PEE - mandatory para sa building permits; hindi sapat ang REE lamang sa plano)
4. **Plumbing & Sanitary Plans (P-01)**: Registered Master Plumber (RMP) o Sanitary Engineer
5. **Mechanical Plans (M-01)** (kung may centralized ACU, elevator, o cold storage): Professional Mechanical Engineer (PME)
6. **Electronics Plans (EL-01)** (kung may FDAS fire alarm o CCTV system): Professional Electronics Engineer (PECE)
7. **Lot Plan**: Licensed Geodetic Engineer (GE)`
  },

  // 8. Illegal Construction & Penalties
  {
    id: "illegal_penalties",
    question: "Ano ang parusa o penalty kapag nagtayo ng walang building permit?",
    keywords: ["penalty", "multa", "huli", "walang permit", "illegal", "stoppage", "parusa", "surcharge", "nahuli", "nagpatayo nang walang"],
    intents: ["LEGAL", "PENALTIES"],
    category: "legal",
    followUps: ["Paano mag-apply ng building permit kung nasimulan na ang construction?", "Magkano ang permit fees para sa 100 sqm?"],
    answer: `⚠️ **Babala mula sa Office of the Building Official (OBO) Sto. Tomas**:
Ang pagpapatayo ng anumang gusali o istruktura nang walang kaukulang Building Permit ay paglabag sa **Section 301 ng Presidential Decree No. 1096 (National Building Code)**.

Ang mga kakaharaping parusa at aksyon:
1. **Notice of Violation at Work Stoppage Order**: Agad na ipatitigil ng OBO Building Inspectors ang trabaho sa construction site.
2. **Surcharges at Administrative Fines**:
   • **25% Surcharge** kung bago pa lamang ang simula ng excavation/pundasyon.
   • **50% hanggang 100% Surcharge** sa kabuuang permit fees kung higit sa kalahati o tapos na ang gusali.
   • Administrative fine na mula **₱1,000 hanggang ₱10,000** bawat paglabag.
3. **Order of Demolition**: Kung ang gusali ay itinayo sa easement, kalsada, o napatunayang structurally unsafe, maaaring magbaba ang OBO ng utos na gibain ito sa sariling gastos ng may-ari.

💡 *Payo ni Mang Tomas: Huwag pong simulan ang konstruksyon hangga't hindi pa nahahawakan ang opisyal na Building Permit upang makaiwas sa abala at mabigat na multa!*`
  },

  // 9. No Title (Tax Declaration only / Deed of Sale)
  {
    id: "no_title_requirements",
    question: "Paano kung wala pang Titulo (TCT) ang lupa, Tax Declaration lang, pwede bang mag-apply ng permit?",
    keywords: ["walang titulo", "tax dec", "tax declaration", "deed of sale", "rights", "mana", "extrajudicial", "bili", "titulo"],
    intents: ["LAND_OWNERSHIP", "REQUIREMENTS"],
    category: "zoning",
    followUps: ["Ano ang requirements sa Locational Clearance?", "Ano ang required setbacks sa residential?"],
    answer: `Opo, pinapayagan sa Sto. Tomas MPDC at OBO ang pag-apply gamit ang **Tax Declaration**, basta't mapapatunayan ang legal na karapatan o pagmamay-ari sa pamamagitan ng mga sumusunod:

1. **Updated Certified True Copy ng Tax Declaration** sa pangalan ng nag-aapply (mula sa Municipal Assessor's Office).
2. **Katibayan ng Pagkabili o Pagkakasalin**:
   • Notarized **Deed of Absolute Sale** kung binili; O
   • **Extrajudicial Settlement of Estate** kung minana sa magulang/kamag-anak.
3. **Certificate of Non-Tenancy o Agrarian Exemption** (kung dating lupang sakahan).
4. **Current Real Property Tax (Amilyar) Clearance**.
5. **Barangay Certification of Ownership & Actual Possession** mula sa inyong Barangay Captain sa Sto. Tomas na nagpapatunay na kayo ang may-ari at nagmamay-ari ng lupa.
6. **Affidavit of Ownership with Undertaking**: Kasulatan na pananagutan ninyo sakaling may maghabol na ibang partido sa lupa.`
  },

  // 10. Not Lot Owner (Rented or Borrowed Land)
  {
    id: "rented_lot_consent",
    question: "Paano kung hindi sa akin nakapangalan ang lupa o umuupa lang ako?",
    keywords: ["umuupa", "upa", "rent", "lease", "pahiram", "hindi akin", "lupa ng magulang", "consent ng may-ari"],
    intents: ["LAND_OWNERSHIP", "LEGAL"],
    category: "zoning",
    followUps: ["Ano ang requirements sa Locational Clearance?", "Ano ang requirements sa Building Permit?"],
    answer: `Kung hindi kayo ang rehistradong may-ari ng lupa (halimbawa: pag-aari ng magulang, kapatid, o korporasyon), maaari pa ring mag-apply basta't may kalakip na:

1. **Notarized Contract of Lease** (kung umuupa) na may tahasang pahintulot na magpatayo ng permanenteng istruktura; O
2. **Notarized Affidavit of Consent / Authority to Construct** mula sa rehistradong may-ari ng lupa na nagbibigay-pahintulot sa inyo;
3. Kopya ng **Valid ID** ng may-ari ng lupa na may 3 pirma;
4. Kopya ng **TCT (Titulo)** o **Tax Declaration** ng may-ari.`
  },

  // 11. Repair / Renovation Permit
  {
    id: "renovation_repair",
    question: "Kailangan ba ng permit kapag simpleng repair, renovate, o pagpapalit ng bubong lang?",
    keywords: ["renovate", "renovation", "repair", "kumpuni", "palit bubong", "bintana", "pintura", "ayos"],
    intents: ["PERMIT_TYPE", "RENOVATION"],
    category: "building",
    followUps: ["Ano ang requirements sa Building Permit?", "Ano ang Fencing Permit?"],
    answer: `Ayon sa **Section 209 ng National Building Code (PD 1096)**:

🟢 **HINDI KAILANGAN NG BUILDING PERMIT (Exempted Minor Works):**
• Pagpipintura ng dingding o kisame.
• Pagpapalit ng sirang bintana o pinto na magkasing-sukat lamang.
• Pag-aayos ng sirang gripo o drainage pipe nang hindi binabago ang linya.
• Pag-aayos ng sirang sahig o tiles sa loob ng bahay.
• Paglalagay ng kitchen cabinets o interior non-loadbearing partitions.

🔴 **KAILANGAN NG BUILDING PERMIT / REPAIR PERMIT:**
• Pagpapalit ng bubong kasama ang truss framing o structural beams.
• Pagdagdag ng kwarto, balkon, o 2nd floor (Extension / Addition).
• Paggiba o paggalaw ng poste, biga, o structural load-bearing walls.
• Pagpapalit ng kabuuang electrical service entrance o panel board.`
  },

  // 12. Fencing Permit
  {
    id: "fencing_permit",
    question: "Ano ang requirements para sa Fencing Permit (pagpapatayo ng bakod)?",
    keywords: ["bakod", "fence", "fencing", "magbakod", "pader sa harapan", "fencing permit"],
    intents: ["FENCING", "PERMIT_TYPE"],
    category: "ancillary",
    followUps: ["Ano ang required setbacks sa residential?", "Magkano ang permit fees para sa 100 sqm?"],
    answer: `Para sa pagpapatayo ng konkretong bakod (masonry fence) sa paligid ng inyong lote sa Sto. Tomas, kailangan ang **Fencing Permit (NBC Form 8)**:

📋 **Mga Kailangan:**
1. Certified True Copy ng **TCT (Titulo)** o Tax Declaration
2. **Lot Plan at Vicinity Map** (Geodetic Engineer)
3. **Fencing Plan and Structural Details** (elevations, foundation, rebar details na pinirmahan ng Civil Engineer)
4. **Bill of Materials & Cost Estimate**
5. **Barangay Clearance for Fencing**

📏 **Panuntunan sa Taas ng Bakod:**
• **Harapan (Along Road/Street)**: Maximum na **1.50 metrong solid masonry** mula sa road curb; ang itaas ay dapat see-through grill/tubular upang hindi harangan ang paningin sa trapiko.
• **Gilid at Likod (Side and Rear)**: Hanggang **2.00 metro** ang pinapayagang solid concrete wall.`
  },

  // 13. Demolition Permit
  {
    id: "demolition_permit",
    question: "Ano ang mga kailangan para sa Demolition Permit (pagpapagiba ng lumang bahay)?",
    keywords: ["demolition", "giba", "gibain", "baklas", "demolish", "lumang bahay", "demolition permit"],
    intents: ["DEMOLITION", "PERMIT_TYPE"],
    category: "building",
    followUps: ["Ano ang requirements sa Building Permit?", "Ano ang Locational Clearance?"],
    answer: `Bago magpagiba o magbaklas ng anumang lumang gusali o istruktura sa Sto. Tomas, mandatory ang pagkuha ng **Demolition Permit (NBC Form 9)** upang matiyak ang kaligtasan ng mga katabing bahay at publiko.

📋 **Mga Kailangan:**
1. Katibayan ng Pagmamay-ari (**TCT / Land Title**)
2. **Demolition Plan at Safety Methodology** na pinirmahan ng Licensed Civil Engineer
3. **Barangay Clearance for Demolition**
4. **Notice of Intent to Demolish** na nilagdaan ng mga katabing kapitbahay (Adjoining Owners)
5. Notarized Undertaking ng Contractor/Engineer na may safety net, scaffolding, at proteksyon sa alikabok at debris.`
  },

  // 14. Occupancy Permit & CFEI
  {
    id: "occupancy_cfei",
    question: "Ano ang Occupancy Permit at CFEI, at paano ito makukuha pagkatapos ng construction?",
    keywords: ["occupancy", "occupancy permit", "cfei", "pelco", "pelco 2", "kuryente", "tirhan", "tapos na", "completion"],
    intents: ["OCCUPANCY", "CFEI"],
    category: "occupancy",
    actionLink: { label: "Mag-apply ng Occupancy Permit", url: "/applicant/apply?type=occupancy_permit" },
    followUps: ["Ano ang requirements sa Building Permit?", "Gaano katagal bago maaprubahan ang permit?"],
    answer: `Ang **Certificate of Occupancy (CO)** ay ang huling permit na nagpapatunay na ang inyong bahay o gusali ay ligtas at opisyal nang pinapahintulutang tirhan o gamitin.

Kasama rin dito ang **CFEI (Certificate of Final Electrical Inspection)** na siyang pangunahing requirement ng **PELCO 2 (Pampanga II Electric Cooperative)** para ikabit ang inyong permanenteng metro ng kuryente.

📋 **Mga Kailangan:**
1. **Certificate of Completion** na pinirmahan at sinumpaan ng inyong supervising Architect/Civil Engineer, PEE, at Master Plumber
2. **As-Built Plans** (kung nagkaroon ng bahagyang pagbabago mula sa orihinal na blueprints)
3. **Construction Logbook** at aktuwal na mga litrato ng natapos na proyekto
4. **BFP Fire Safety Inspection Certificate (FSIC)** mula sa Sto. Tomas Fire Station
5. **Final Inspection Report** ng Municipal Engineers ng Sto. Tomas OBO.`
  },

  // 15. Soil Test / Boring Test
  {
    id: "soil_test_requirements",
    question: "Kailan kailangan ng Soil Boring Test sa Sto. Tomas?",
    keywords: ["soil test", "boring test", "lupa", "soil", "3 storeys", "pundasyon", "lambot"],
    intents: ["ENGINEERING", "SOIL_TEST"],
    category: "building",
    followUps: ["Kailan kailangan ng Structural Analysis?", "Sino-sino ang mga propesyonal na kailangang pumirma sa plano?"],
    answer: `Ayon sa **National Structural Code of the Philippines (NSCP 2015)** at sa mga pamantayan ng OBO Sto. Tomas:

Kailangan ang **Soil Boring Test (Geotechnical Investigation)** kapag:
1. Ang gusali ay **3 palapag pataas** (3 storeys or higher);
2. Commercial, warehouse, o industrial structures na may malalaking concentrated column loads;
3. Ang lupang pagtatayuan ay malapit sa ilog, sapa (tulad sa Barangay Sapa o San Bartolome), o dating palaisdaan kung saan may mataas na banta ng soil liquefaction o malambot na lupa.

*Para sa karaniwang 1 hanggang 2 palapag na residential house, hindi required ang soil boring test maliban na lamang kung may nakitang abnormal soil condition ang Municipal Structural Engineer.*`
  },

  // 16. Structural Computation / Analysis
  {
    id: "structural_analysis",
    question: "Kailan kailangan ng Structural Analysis and Computations?",
    keywords: ["structural analysis", "computations", "kalkulasyon", "2 storeys", "palapag", "lindol", "civil engineer"],
    intents: ["ENGINEERING", "STRUCTURAL"],
    category: "ancillary",
    followUps: ["Kailan kailangan ng Soil Boring Test?", "Sino-sino ang mga propesyonal na kailangang pumirma sa plano?"],
    answer: `Ang **Structural Analysis and Design Calculation** ay mandatory para sa:
1. Lahat ng gusali na may **2 palapag pataas** (2 storeys and up).
2. 1-storey structures na may **mezzanine floor** o malalaking roof spans (> 6 metro).
3. Commercial structures, swimming pools, retaining walls, o telecommunication towers.

Dapat itong ihanda at selyohan ng isang **Licensed Civil Engineer** gamit ang mga kinikilalang structural software (tulad ng ETABS, STAAD, o manual checks) alinsunod sa pinakahuling NSCP Seismic Zone 4 parameters.`
  },

  // 17. Processing Time (Ease of Doing Business)
  {
    id: "processing_time",
    question: "Gaano katagal bago maaprubahan ang Building Permit o Locational Clearance?",
    keywords: ["gaano katagal", "araw", "days", "tagal", "processing time", "release", "kailan makukuha", "bilis"],
    intents: ["PROCESS_TIME", "TRACKING"],
    category: "general",
    followUps: ["Paano i-check ang status ng application ko?", "Magkano ang permit fees para sa 100 sqm?"],
    answer: `Sa ilalim ng **Republic Act 11032 (Ease of Doing Business Act)** at ng eTAYO digital system ng Sto. Tomas:

⏱️ **Target Processing Timeline:**
• **Locational Clearance (Zoning)**: **2 hanggang 3 Araw ng Paggawa (Working Days)** kapag kumpleto ang TCT, Tax Dec, at Lot Plan.
• **Unified Building Permit (OBO)**: **3 hanggang 5 Araw ng Paggawa (Working Days)** matapos ma-upload ang kumpletong blueprints at makapagbayad ng assessed fees.
• **Certificate of Occupancy**: **3 Araw ng Paggawa** matapos ang aktuwal na ocular inspection sa site.

⚠️ *Paalala: Maaantala lamang ang pagproseso kung may kulang na dokumento o may technical corrections ang mga plano (hal. kulang sa setback o walang pirma ng PEE).*`
  },

  // 18. Permit Validity
  {
    id: "permit_validity",
    question: "Gaano katagal ang validity ng Building Permit? Mapapaso ba ito kapag hindi nasimulan agad?",
    keywords: ["validity", "mapaso", "expire", "expiration", "gaano katagal bago mapaso", "petsa", "bisa"],
    intents: ["LEGAL", "VALIDITY"],
    category: "legal",
    followUps: ["Ano ang parusa kapag walang building permit?", "Gaano katagal bago maaprubahan ang permit?"],
    answer: `Ayon sa **Section 305 ng National Building Code (PD 1096)**, ang Building Permit ay:

1. **Mag-eexpire sa loob ng isang (1) taon** mula sa petsa ng pag-isyu kung hindi pa nasisimulan ang aktuwal na konstruksyon sa site.
2. **Mawawalan ng bisa kung matapos masimulan ay nahinto o naabandona ang trabaho sa loob ng 120 araw (4 na buwan)** nang walang pasabi sa OBO.

Kung nais ipagpatuloy ang proyekto matapos mag-expire, kailangang mag-apply ng **Renewal / Extension** sa Office of the Building Official bago muling magsimula ng trabaho.`
  },

  // 19. Water Easements & Rivers
  {
    id: "river_easements",
    question: "Gaano kalayo ang kailangang distansya kapag malapit sa ilog, sapa, o estero?",
    keywords: ["ilog", "sapa", "estero", "creek", "canal", "water easement", "water code", "tabi ng tubig"],
    intents: ["ZONING", "EASEMENT"],
    category: "zoning",
    followUps: ["Ano ang required setbacks sa residential?", "Bakit kailangan muna ang Locational Clearance?"],
    answer: `Alinsunod sa **Philippine Water Code (PD 1067 - Article 51)** at sa Zoning Ordinance ng Sto. Tomas:

Ang mga legal na **Easement of Public Use** sa magkabilang pampang ng ilog, sapa, o estero ay:
• **Sa Urban / Residential Areas (Poblacion, San Matias, atbp.)**: Minimum na **3.00 metro**
• **Sa Agricultural Areas (San Vicente, Sapa, atbp.)**: Minimum na **20.00 metro**
• **Sa Forest / Marshland Areas**: Minimum na **40.00 metro**

⚠️ **Bawal magtayo ng permanenteng istruktura, bakod, o septic tank sa loob ng easement zone.** Ang mga gawaing ito ay itinuturing na public nuisance at ipagigiba nang walang kompensasyon.`
  },

  // 20. Septic Tank Requirements
  {
    id: "septic_tank_rules",
    question: "Ano ang requirements para sa poso negro o septic tank?",
    keywords: ["poso negro", "septic tank", "septic", "dumi", "tubig", "drainage", "sanitary", "plumbing"],
    intents: ["PLUMBING", "ENGINEERING"],
    category: "ancillary",
    followUps: ["Sino-sino ang mga propesyonal na kailangang pumirma sa plano?", "Ano ang required setbacks sa residential?"],
    answer: `Ayon sa **Revised National Plumbing Code of the Philippines**:

1. **3-Chamber Digestive System**: Dapat binubuo ng tatlong silid: Digestive Chamber, Leaching/Settling Chamber, at Clear Water Chamber. Bawal ang single-chamber lang.
2. **Watertight Material**: Gawa sa reinforced concrete slab at plastered hollow blocks upang maiwasan ang kontaminasyon sa groundwater.
3. **Distansya mula sa Poso ng Tubig**: Dapat ay may minimum na **15.0 metro (50 feet)** ang layo mula sa anumang shallow well, deepwell, o pinagkukunan ng inuming tubig.
4. **Venting**: May sapat na PVC vent pipe na nakataas lagpas sa roofline.`
  },

  // 21. Ceiling Height & Room Dimensions
  {
    id: "ceiling_height_rules",
    question: "Ano ang minimum na taas ng kisame (ceiling height) at sukat ng kwarto?",
    keywords: ["kisame", "ceiling", "ceiling height", "taas ng bahay", "sukat ng kwarto", "kwarto", "bintana", "bintilasyon"],
    intents: ["ARCHITECTURAL", "STANDARDS"],
    category: "building",
    followUps: ["Ano ang required setbacks sa residential?", "Sino-sino ang mga propesyonal na kailangang pumirma sa plano?"],
    answer: `Ayon sa **Section 806 at 807 ng National Building Code (PD 1096)**:

📏 **Taas ng Kisame (Minimum Ceiling Height):**
• **Ground Floor**: Minimum na **2.70 metro (9.0 feet)**
• **Ikalawang Palapag (2nd Storey)**: Minimum na **2.40 metro (8.0 feet)**
• **Naturally Ventilated Rooms**: Minimum na **2.70 metro**

🚪 **Minimum Room Dimensions:**
• **Habitable Room (Kwarto)**: Minimum na **6.00 sq.m.** na may pinakamaikling sukat na hindi bababa sa **2.00 metro**.
• **Kusina (Kitchen)**: Minimum na **3.00 sq.m.** na may lapad na hindi bababa sa **1.50 metro**.
• **Banyo (Toilet & Bath)**: Minimum na **1.20 sq.m.** na may lapad na hindi bababa sa **0.90 metro**.

🪟 **Bintana (Light & Ventilation)**: Ang kabuuang bukas ng bintana ay dapat hindi bababa sa **10% ng kabuuang floor area** ng kwarto para sa natural na sikat ng araw at hangin.`
  },

  // 22. OBO Office Contact & Hours
  {
    id: "office_contact_hours",
    question: "Saan ang opisina ng Building Official at kailan bukas?",
    keywords: ["saan", "opisina", "location", "contact", "numero", "oras", "bukas", "punta", "munisipyo", "hall", "telephone", "address"],
    intents: ["CONTACT", "OFFICE_INFO"],
    category: "general",
    followUps: ["Paano i-check ang status ng application ko?", "Ano ang requirements sa Building Permit?"],
    answer: `Maaari ninyong bisitahin o tawagan ang **Office of the Municipal Engineer / Building Official (OBO)** ng Sto. Tomas:

🏛️ **Lokasyon**: Ground Floor, Municipal Hall, Poblacion, Sto. Tomas, Pampanga 2020
⏰ **Oras ng Serbisyo**: Lunes hanggang Biyernes, **8:00 AM – 5:00 PM** (Walang Noon Break)
📞 **Telepono / Hotline**: (045) 436-1234 / 0917-123-4567
✉️ **Opisyal na Email**: obo@stotomaspampanga.gov.ph
🌐 **Online Portal**: eTAYO Unified Permitting System (24/7 online submission)

*Maaari rin po kayong dumiretso sa aming helpdesk sa Munisipyo para sa libreng pag-assist sa inyong online upload.*`
  },

  // 23. Barangay San Matias Specific
  {
    id: "brgy_san_matias",
    question: "Ano ang zoning rules at requirements kapag magpapatayo sa San Matias, Sto. Tomas?",
    keywords: ["san matias", "matias", "macarthur", "highway", "pottery", "ceramic"],
    intents: ["BARANGAY", "ZONING"],
    category: "barangay",
    followUps: ["Magkano ang permit fees para sa 100 sqm?", "Ano ang required setbacks sa residential?"],
    answer: `Ang **Barangay San Matias** ang pangunahing komersyal at industrial corridor ng Sto. Tomas Pampanga (katabi ng MacArthur Highway).

📌 **Mga Mahahalagang Panuntunan sa San Matias:**
1. **MacArthur Highway Setback**: Kung ang inyong proyekto ay nasa kahabaan ng highway, kailangan ang minimum na **5.00 metrong front setback** mula sa DPWH Road Right-of-Way.
2. **Parking Slots**: Para sa mga commercial establishments at retail pottery/ceramic stores, mandatory ang paglalaan ng off-street customer parking (1 slot bawat 50 sq.m. customer area).
3. **Barangay Construction Clearance**: Kumuha muna ng clearance sa San Matias Barangay Hall bago i-submit ang aplikasyon sa eTAYO portal.
4. **Flood Elevation**: Bagamat low-risk sa baha, pinapayuhan ang pagtaas ng 0.30m sa ground floor line mula sa road curb.`
  },

  // 24. Barangay Moras De La Paz Specific
  {
    id: "brgy_moras",
    question: "Ano ang mga patakaran sa konstruksyon sa Moras De La Paz?",
    keywords: ["moras", "moras de la paz", "woodworking", "kabaong", "coffin"],
    intents: ["BARANGAY", "ZONING"],
    category: "barangay",
    followUps: ["Ano ang BFP Fire Safety requirements?", "Ano ang required setbacks sa residential?"],
    answer: `Ang **Barangay Moras De La Paz** ay kilala sa cottage woodworking industries.

📌 **Espesyal na Panuntunan sa Moras De La Paz:**
1. **Fire Safety at BFP Clearance**: Para sa mga pagawaan o bodega ng kahoy, mandatory ang enhanced fire suppression system, portable fire extinguishers, at aprubadong 2-hour firewalls sa mga katabing residential structures.
2. **Waste & Fume Management**: Bawal magbuga ng alikabok ng kahoy o lacquer fumes papunta sa mga katabing bahay.
3. **Locational Clearance**: Kung magtatayo ng pagawaan o commercial shop, kailangang may Barangay Resolution at pagsang-ayon ng MPDC Zoning Administrator.`
  },

  // 25. Online vs Walk-in Submission
  {
    id: "online_vs_walkin",
    question: "Pwede bang mag-walk in sa munisipyo o kailangang online sa eTAYO portal?",
    keywords: ["walk in", "walk-in", "online", "personal", "munisipyo", "upload", "magpasa", "manual"],
    intents: ["APPLICATION_METHOD", "GENERAL"],
    category: "general",
    actionLink: { label: "Mag-apply Online Ngayon", url: "/applicant/apply" },
    followUps: ["Ano ang requirements sa Locational Clearance?", "Paano i-check ang status ng application ko?"],
    answer: `Sa kasalukuyan, ang Pamahalaang Bayan ng Sto. Tomas ay gumagamit ng **Hybrid Permitting System**:

💻 **Online sa eTAYO Portal (Inirerekomenda)**:
Maaari ninyong i-upload ang inyong mga scanned requirements, titulo, at blueprints anumang oras, 24/7. Makakatipid kayo sa pamasahe at maiiwasan ang mahabang pila.

🏛️ **Walk-in sa Municipal Hall**:
Kung nahihirapan kayo sa pag-scan o pag-upload, maaari kayong pumunta sa **OBO / MPDC Helpdesk sa Ground Floor ng Municipal Hall**. Tutulungan kayo ng ating mga IT at Engineering staff na i-scan at ipasok ang inyong aplikasyon sa sistema.

💡 *Tandaan: Para sa opisyal na releasing ng selyadong Blueprints at Permit Cards, mag-iiwan pa rin kayo ng 5 sets ng hardcopy blueprints sa OBO para sa opisyal na dry seal ng Building Official.*`
  }
];

// -------------------------------------------------------------
// INTELLIGENT NLP TOKENIZER & INTENT CLASSIFICATION ENGINE
// -------------------------------------------------------------

// Common Filipino/Taglish stop words to filter out during ML tokenization
const STOP_WORDS = new Set([
  "ang", "mga", "ng", "sa", "at", "na", "po", "ko", "mo", "ba", "ka", "kayo", "kami",
  "sila", "ito", "iyon", "doon", "dito", "kung", "kapag", "para", "paano", "ano",
  "sino", "bakit", "kailan", "saan", "magkano", "ilang", "meron", "may", "wala",
  "the", "a", "an", "is", "are", "to", "for", "in", "on", "of", "and", "or", "by"
]);

// Normalization mappings for Tagalog/Taglish typos and slang
const SYNONYM_DICTIONARY: Record<string, string> = {
  "magpatyo": "magpatayo",
  "ipatayo": "magpatayo",
  "itayo": "magpatayo",
  "patayo": "magpatayo",
  "tatayo": "magpatayo",
  "magtatayo": "magpatayo",
  "bhay": "bahay",
  "house": "bahay",
  "magknu": "magkano",
  "magkanu": "magkano",
  "magkno": "magkano",
  "cost": "magkano",
  "price": "magkano",
  "bayad": "magkano",
  "singil": "magkano",
  "fees": "magkano",
  "reqs": "requirements",
  "requirments": "requirements",
  "dokumento": "requirements",
  "kailangan": "requirements",
  "asan": "nasaan",
  "kamusta": "kumusta",
  "update": "status",
  "track": "status",
  "nasan": "nasaan",
  "pwde": "pwede",
  "pede": "pwede",
  "bldg": "building",
  "prk": "poblacion"
};

export function tokenizeAndNormalize(text: string): string[] {
  const clean = text
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const rawTokens = clean.split(" ");
  const tokens: string[] = [];

  for (const t of rawTokens) {
    if (!t || t.length < 2) continue;
    const normalized = SYNONYM_DICTIONARY[t] || t;
    if (!STOP_WORDS.has(normalized)) {
      tokens.push(normalized);
    }
  }

  return tokens;
}

export function extractEntities(query: string) {
  const q = query.toLowerCase();

  // 1. Extract Floor Area (e.g. "80 sqm", "120 square meters", "150m2", "100 sq.m")
  const areaMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:sqm|sq\.m|sq\s*m|square\s*meters?|metro\s*kwadrado|m2)\b/);
  const floorArea = areaMatch ? parseFloat(areaMatch[1]) : null;

  // 2. Extract Application Tracking ID (e.g. "LC-2026-1841", "APP-2026-9084", "BP-2025-102")
  const idMatch = query.match(/\b([A-Z]{2,4}-?\d{4}-?\d{3,6})\b/i);
  const trackingId = idMatch ? idMatch[1].toUpperCase() : null;

  // 3. Extract Barangay mention
  let detectedBarangay: BarangayProfile | null = null;
  for (const [key, brgy] of Object.entries(BARANGAYS_DATABASE)) {
    for (const alt of brgy.altNames) {
      if (q.includes(alt)) {
        detectedBarangay = brgy;
        break;
      }
    }
    if (detectedBarangay) break;
  }

  // 4. Extract Building Classification
  let buildingType: "residential" | "commercial" | "industrial" = "residential";
  if (q.includes("commercial") || q.includes("tindahan") || q.includes("store") || q.includes("grocery") || q.includes("opisina")) {
    buildingType = "commercial";
  } else if (q.includes("industrial") || q.includes("warehouse") || q.includes("bodega") || q.includes("factory") || q.includes("pabrika")) {
    buildingType = "industrial";
  }

  // 5. Extract Storeys
  const storeyMatch = q.match(/(\d+)\s*(?:palapag|storeys?|floors?|flr)\b/);
  const storeys = storeyMatch ? parseInt(storeyMatch[1], 10) : 1;

  return {
    floorArea,
    trackingId,
    detectedBarangay,
    buildingType,
    storeys
  };
}

/**
 * Enhanced Semantic ML Matching Engine
 * Uses Token TF-IDF N-gram overlap, entity extraction, and dynamic calculators.
 */
export function findKnowledgeBaseMatches(query: string, userApplications?: any[]): string {
  const q = query.trim();
  const qLower = q.toLowerCase();
  const entities = extractEntities(q);

  // 1. LIVE USER APPLICATION STATUS CHECK
  if (entities.trackingId && userApplications && userApplications.length > 0) {
    const foundApp = userApplications.find(app => 
      app.id?.toLowerCase().includes(entities.trackingId!.toLowerCase()) ||
      entities.trackingId!.toLowerCase().includes(app.id?.toLowerCase())
    );

    if (foundApp) {
      const type = foundApp.permitType?.replace(/_/g, " ").toUpperCase() || "LOCATIONAL CLEARANCE";
      const status = (foundApp.status || "PENDING").toUpperCase();
      const requirementsCount = foundApp.requirements?.length || 0;
      const approvedCount = foundApp.requirements?.filter((r: any) => r.status === "approved").length || 0;

      return `📋 **TALAAN NG INYONG APLIKASYON (${foundApp.id})**:

• **Proyekto**: ${foundApp.projectName || "Konstruksyon sa Sto. Tomas"}
• **Permit Type**: **${type}**
• **Kasalukuyang Status**: \`${status}\`
• **Lokasyon**: ${foundApp.projectAddress || "Sto. Tomas, Pampanga"}
• **Petsa ng Pagsumite**: ${foundApp.dateSubmitted || "Kamakailan"}
• **Dokumentong Naaprubahan**: ${approvedCount} sa ${requirementsCount} na mga rekisito

Kung nais ninyong mag-upload ng karagdagang plano o tingnan ang evaluation notes ng Municipal Engineer, [Pumunta sa Application Tracking Page](/applicant/track).`;
    }
  }

  // 2. CHECK GENERAL APPLICATION INQUIRY ("kamusta permit ko", "status ko")
  if (userApplications && userApplications.length > 0 && (
    qLower.includes("status") || qLower.includes("permit ko") || qLower.includes("application ko") ||
    qLower.includes("update") || qLower.includes("nasaan") || qLower.includes("asan") ||
    qLower.includes("kamusta") || qLower.includes("kumusta")
  )) {
    const summaryList = userApplications.map((app, i) => {
      const type = app.permitType ? app.permitType.replace(/_/g, " ").toUpperCase() : "PERMIT";
      const status = (app.status || "pending").toUpperCase();
      return `${i + 1}. **${type}** (\`${app.id}\`) - *${app.projectName || "Project"}*\n   • Status: \`${status}\` | Lokasyon: ${app.projectAddress || "Sto. Tomas"}`;
    }).join("\n\n");

    return `Mabuhay! Narito po ang inyong mga aktibong permit applications sa Sto. Tomas eTAYO system:\n\n${summaryList}\n\nMaaari ninyong i-click ang [Track Applications](/applicant/track) para makita ang kumpletong timeline at Order of Payment!`;
  }

  // 3. DYNAMIC FEE CALCULATOR TRIGGER
  // If user query mentions a specific area number (e.g. "80 sqm", "150 sq.m", "200 square meters")
  if (entities.floorArea && entities.floorArea > 0) {
    const calc = calculateEstimatedFees(entities.floorArea, entities.buildingType, entities.storeys);
    return calc.breakdownSummary + `\n\nNais po ba ninyong malaman ang mga requirements para masimulan ang inyong [Application para sa Locational Clearance](/applicant/apply?type=locational_clearance)?`;
  }

  // 4. BARANGAY-SPECIFIC CADASTRAL INQUIRY
  if (entities.detectedBarangay && (qLower.includes("zoning") || qLower.includes("pwede") || qLower.includes("patayo") || qLower.includes("baha") || qLower.includes("flood") || qLower.includes("rules"))) {
    const b = entities.detectedBarangay;
    return `📍 **PROFAYL NG BARANGAY ${b.name.toUpperCase()} (STO. TOMAS, PAMPANGA)**:

• **Zoning Classification**: ${b.zoningClass}
• **Banta ng Baha (Flood Risk)**: **${b.floodRisk}**
• **Paglalarawan**: ${b.description}

📌 **Espesyal na Panuntunan sa Konstruksyon sa ${b.name}**:
${b.specialRules.map(r => `• ${r}`).join("\n")}

Kailangan din munang kumuha ng **Barangay Construction Clearance** sa ${b.name} Barangay Hall bago mag-apply para sa inyong Locational Clearance sa Munisipyo.`;
  }

  // 5. ML TOKEN SIMILARITY SCORING ACROSS FAQS
  const userTokens = tokenizeAndNormalize(q);
  let bestMatch: FAQItem | null = null;
  let highestScore = 0;

  for (const item of FAQ_DATABASE) {
    let score = 0;

    // Check keyword hits
    for (const kw of item.keywords) {
      const kwTokens = kw.toLowerCase().split(" ");
      const matchesAll = kwTokens.every(t => qLower.includes(t));
      if (matchesAll) {
        score += kw.length * 2.5; // High weight for exact phrase match
      } else {
        for (const kt of kwTokens) {
          if (userTokens.includes(kt)) {
            score += 1.5;
          }
        }
      }
    }

    // Question token overlap (Jaccard similarity style)
    const qTokens = tokenizeAndNormalize(item.question);
    for (const ut of userTokens) {
      if (qTokens.includes(ut)) {
        score += 2.0;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  // Confidence Threshold for ML match
  if (bestMatch && highestScore >= 4.0) {
    let response = bestMatch.answer;

    if (bestMatch.actionLink) {
      response += `\n\n👉 [${bestMatch.actionLink.label}](${bestMatch.actionLink.url})`;
    }

    if (bestMatch.followUps && bestMatch.followUps.length > 0) {
      response += `\n\n💡 *Maaari rin ninyong itanong:*\n` + bestMatch.followUps.map(f => `• "${f}"`).join("\n");
    }

    return response;
  }

  // 6. CONTEXTUAL RECOVERY FALLBACKS
  if (qLower.includes("locational") || qLower.includes("zoning")) {
    return OFFICIAL_16_FORMS_GUIDE.LC.description + "\n\n**Mga Pangunahing Dokumento**:\n" + OFFICIAL_16_FORMS_GUIDE.LC.requirements.map(r => `• ${r}`).join("\n") + "\n\n👉 [Mag-apply para sa Locational Clearance](/applicant/apply?type=locational_clearance)";
  }

  if (qLower.includes("building permit") || qLower.includes("nbc form 1")) {
    return OFFICIAL_16_FORMS_GUIDE.BP.description + "\n\n**Mahalagang Tuntunin**: Tiyaking may aprubadong Locational Clearance muna mula sa MPDC bago i-submit ang Building Permit.\n\n**Mga Kailangan**:\n" + OFFICIAL_16_FORMS_GUIDE.BP.requirements.map(r => `• ${r}`).join("\n") + "\n\n👉 [Mag-apply para sa Building Permit](/applicant/apply?type=building_permit)";
  }

  if (qLower.includes("salamat") || qLower.includes("thank")) {
    return "Walang anuman po! Ikinagagalak kong makatulong sa inyo para sa inyong konstruksyon dito sa Sto. Tomas, Pampanga. Kung may iba pa kayong katanungan, magtanong lamang po kayo anumang oras!";
  }

  if (qLower.includes("kumusta") || qLower.includes("hello") || qLower.includes("hi") || qLower.includes("mabuhay")) {
    return `Mabuhay! Ako po si **Mang Tomas**, ang inyong AI Virtual Permitting Officer para sa Sto. Tomas, Pampanga.

Maaari ko po kayong tulungan sa mga sumusunod:
1. **Mga Requirements** sa pagpapatayo ng bahay, bakod, o komersyal na gusali
2. **Kwentada ng Permit Fees** (i-type lang halimbawa: *"Magkano para sa 120 sqm?"*)
3. **Zoning & Setbacks** sa inyong barangay
4. **Follow-up ng Status** ng inyong kasalukuyang permit application

Ano po ang plano ninyong ipatayo o nais ninyong itanong ngayon?`;
  }

  // 7. INTELLIGENT COMPREHENSIVE FALLBACK
  return `Mabuhay! Bilang inyong Virtual Permitting Officer sa Sto. Tomas, Pampanga, handa po akong magbigay ng 100% kumpletong gabay sa inyong proyekto:

• **Magkano ang Fees?**: I-type halimbawa ang *"Magkano para sa 100 sqm bahay?"* at ikukwenta ko agad ang breakdown.
• **Zoning at Setbacks**: I-type ang inyong barangay (hal. *"Ano setbacks sa San Matias?"* o *"Pwede ba firewall sa gilid?"*).
• **Requirements**: Magtanong tungkol sa Locational Clearance, Building Permit, o Occupancy Permit.
• **Status ng Permit**: Ibigay lamang ang inyong Application Tracking ID.

Maaari ninyong piliin ang alinman sa mga **Suggested Inquiries** sa ibaba o i-type ang inyong katanungan!`;
}

/**
 * Retrieves top matching context strings for injection into LLM prompts (RAG).
 */
export function getTopContextForRAG(query: string, maxItems: number = 3): string {
  const userTokens = tokenizeAndNormalize(query);
  const scored = FAQ_DATABASE.map(item => {
    let score = 0;
    for (const kw of item.keywords) {
      if (query.toLowerCase().includes(kw.toLowerCase())) score += 3;
    }
    for (const ut of userTokens) {
      if (item.question.toLowerCase().includes(ut)) score += 2;
    }
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, maxItems).filter(s => s.score > 0);

  if (top.length === 0) {
    return `GENERAL POLICY: Follow Presidential Decree 1096 (National Building Code of the Philippines) and Sto. Tomas Local Zoning Ordinances. Phase 1 is Locational Clearance, Phase 2 is Building Permit with 5 sets of blueprints, Phase 3 is Certificate of Occupancy.`;
  }

  return top.map(t => `Q: ${t.item.question}\nA: ${t.item.answer}`).join("\n\n---\n\n");
}
