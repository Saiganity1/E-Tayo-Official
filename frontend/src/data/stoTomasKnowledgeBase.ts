/**
 * Official Sto. Tomas, Pampanga Municipal Permitting Knowledge Base
 * Used by Mang Tomas AI for RAG (Retrieval-Augmented Generation) and local semantic search.
 */

export interface FAQItem {
  question: string;
  keywords: string[];
  answer: string;
  category: "zoning" | "building" | "ancillary" | "fees" | "tracking" | "general";
}

export const STO_TOMAS_MUNICIPAL_INFO = {
  municipality: "Municipality of Sto. Tomas",
  province: "Province of Pampanga",
  region: "Region III (Central Luzon)",
  zipCode: "2020",
  office: "Office of the Municipal Engineer / Building Official (OBO)",
  zoningOffice: "Office of the Zoning Administrator / MPDC",
  fireStation: "Bureau of Fire Protection (BFP) - Sto. Tomas Fire Station",
  portalName: "e-Tayo: Unified Municipal Permitting & Licensing System",
  workingHours: "Monday to Friday, 8:00 AM - 5:00 PM",
  location: "Municipal Hall, Poblacion, Sto. Tomas, Pampanga",
  contactNumber: "(045) 436-1234 / 0917-123-4567",
  email: "obo@stotomaspampanga.gov.ph / staff@etayo.gov.ph"
};

export const PERMITTING_PROCESS_STAGES = [
  {
    stage: 1,
    name: "Locational Clearance (Zoning Approval)",
    office: "Municipal Planning & Development Coordinator (MPDC) / Zoning Administrator",
    purpose: "Ensures the proposed structure conforms with the Sto. Tomas Comprehensive Land Use Plan (CLUP) and Zoning Ordinance.",
    prerequisite: "Certified True Copy of Transfer Certificate of Title (TCT), Tax Declaration, Real Property Tax Clearance, Lot Plan with Vicinity Map.",
    crucialNote: "MUST be approved first before applying for a Building Permit. Without an approved Locational Clearance, the Building Permit cannot be issued."
  },
  {
    stage: 2,
    name: "Unified Building Permit & Ancillary Permits",
    office: "Office of the Building Official (OBO)",
    purpose: "Technical compliance with the National Building Code of the Philippines (PD 1096).",
    formsIncluded: [
      "Unified Application Form for Building Permit (NBC Form 1 / DPWH Form 77-001-B)",
      "Architectural Permit (NBC Form A-01) - Signed by Licensed Architect",
      "Civil/Structural Permit (NBC Form S-01) - Signed by Licensed Civil Engineer",
      "Electrical Permit (NBC Form E-01) - Signed by Professional Electrical Engineer (PEE)",
      "Sanitary/Plumbing Permit (NBC Form P-01) - Signed by Master Plumber (RMP) / Sanitary Engineer",
      "Mechanical Permit (NBC Form M-01) - If ACUs, elevator, or machinery installed",
      "Electronics Permit (NBC Form EL-01) - If CCTV, fire alarms, or telecom networks installed",
      "BFP Fire Safety Evaluation Clearance (FSEC) - Coordinated with BFP Sto. Tomas"
    ]
  },
  {
    stage: 3,
    name: "Certificate of Completion, Final Inspection & Occupancy Permit",
    office: "OBO & BFP Sto. Tomas",
    purpose: "Certifies that construction followed approved plans and is safe for human habitation/business use.",
    formsIncluded: [
      "Certificate of Completion Form (signed by in-charge engineers)",
      "Certificate of Final Electrical Inspection (CFEI - NBC Form 96006-E)",
      "BFP Fire Safety Inspection Certificate (FSIC)",
      "Unified Certificate of Occupancy"
    ]
  }
];

export const OFFICIAL_16_FORMS_GUIDE: Record<string, { name: string; code: string; category: string; description: string; signatories: string; requirements: string[] }> = {
  LC: {
    name: "Application for Locational Clearance / Zoning",
    code: "LC",
    category: "Zoning & Land Use",
    description: "Evaluates land use classification, zoning conformity, and setbacks in Sto. Tomas.",
    signatories: "Applicant / Lot Owner",
    requirements: ["TCT / Deed of Sale", "Current Tax Declaration", "Real Property Tax (Amilyar) Clearance", "Lot Plan with Vicinity Map signed by Geodetic Engineer"]
  },
  BP: {
    name: "Unified Application Form for Building Permit",
    code: "NBC Form 1",
    category: "Core Building",
    description: "Primary DPWH Form 77-001-B containing project specifications, cost breakdowns, and supervising engineer credentials.",
    signatories: "Applicant/Owner, Full-time Supervising Architect or Civil Engineer",
    requirements: ["Approved Locational Clearance", "5 sets of Blueprints (Architectural, Structural, Electrical, Sanitary)", "Structural Analysis & Design Computations (for 2+ storeys)", "Bill of Materials & Cost Estimate", "Specifications Document"]
  },
  AP: {
    name: "Architectural Permit Form",
    code: "NBC Form A-01",
    category: "Ancillary",
    description: "Floor plans, elevations, sections, door/window schedules, and architectural finishes.",
    signatories: "Licensed Architect (PRC, PTR, IAPOA, TIN)",
    requirements: ["Architectural Plans", "Door and Window Schedules", "Finishes Specifications", "Architect's valid PRC ID & PTR"]
  },
  SP: {
    name: "Civil / Structural Permit Form",
    code: "NBC Form S-01",
    category: "Ancillary",
    description: "Foundation depths, structural framing, concrete compressive strengths, and steel bar specifications.",
    signatories: "Licensed Civil Engineer (PRC, PTR, PICE, TIN)",
    requirements: ["Structural Plans & Details", "Structural Analysis (for 2+ storeys)", "Boring/Soil Test Report (for 3+ storeys)", "Civil Engineer's valid PRC ID & PTR"]
  },
  EP: {
    name: "Electrical Permit Form",
    code: "NBC Form E-01",
    category: "Ancillary",
    description: "Connected electrical load (kVA), service entrance voltage, circuit breaker sizing, and lighting/power layouts.",
    signatories: "Professional Electrical Engineer (PEE - PRC, PTR, IIEE, TIN)",
    requirements: ["Electrical Layout Plans", "Single Line Diagram", "Load Schedule & Computations", "PEE valid PRC ID & PTR"]
  },
  PL: {
    name: "Sanitary / Plumbing Permit Form",
    code: "NBC Form P-01",
    category: "Ancillary",
    description: "Water supply lines, sanitary drainage, waste piping, and 3-chamber septic tank specifications.",
    signatories: "Licensed Master Plumber (RMP) or Sanitary Engineer",
    requirements: ["Plumbing Layout & Isometrics", "Septic Tank Plan & Details", "Plumber's valid PRC ID & PTR"]
  },
  MP: {
    name: "Mechanical Permit Form",
    code: "NBC Form M-01",
    category: "Ancillary",
    description: "Air-conditioning systems, elevators, escalators, ventilation, and mechanical power equipment.",
    signatories: "Professional Mechanical Engineer (PME)",
    requirements: ["Mechanical Layout Plans", "Equipment Specifications & Capacity Ratings", "PME valid PRC ID & PTR"]
  },
  EL: {
    name: "Electronics Permit Form",
    code: "NBC Form EL-01",
    category: "Ancillary",
    description: "Structured cabling, CCTV surveillance, fire alarm detection systems (FDAS), and telecommunications.",
    signatories: "Professional Electronics Engineer (PECE)",
    requirements: ["Electronics Layout Plans", "System Wiring Diagrams", "PECE valid PRC ID & PTR"]
  },
  BFP: {
    name: "BFP Fire Safety Evaluation Clearance",
    code: "FSEC",
    category: "Fire Safety",
    description: "Evaluates fire safety compliance, emergency exit locations, fire extinguisher schedules, and firewalls.",
    signatories: "BFP Fire Marshall / Fire Safety Inspector",
    requirements: ["Fire Safety Evaluation Checklist", "Complete Building Blueprints", "Firewall Specifications"]
  },
  CO: {
    name: "Certificate of Occupancy Unified Form",
    code: "CO",
    category: "Completion & Occupancy",
    description: "Final certificate issued when construction is fully finished and inspected.",
    signatories: "Municipal Building Official",
    requirements: ["Certificate of Completion", "As-Built Plans", "CFEI Certificate", "BFP FSIC Certificate", "Logbook & Inspection Photos"]
  },
  CFEI: {
    name: "Certificate of Final Electrical Inspection",
    code: "CFEI (NBC Form 96006-E)",
    category: "Utilities & Completion",
    description: "Clearance required by electric utility (PELCO / Meralco) for permanent power energization.",
    signatories: "Municipal Electrical Inspector & OBO",
    requirements: ["As-Built Electrical Plans", "Grounding Resistance Test Result"]
  }
};

export const ZONING_RULES_SUMMARY = {
  setbacks: {
    residentialR1: { front: "4.50 meters", rear: "2.00 meters", left: "2.00 meters", right: "2.00 meters" },
    residentialR2: { front: "3.00 meters", rear: "2.00 meters", left: "2.00 meters", right: "2.00 meters" },
    commercial: { front: "5.00 meters", rear: "2.00 meters", sides: "2.00 meters" }
  },
  firewalls: "Permitted on one side or rear only for R-2 duplex/rowhouses with minimum 2-hour fire-resistance rating and 1.0m parapet extension above the roofline. In R-1 single-family, firewalls require adjacent owner written consent.",
  heightLimits: {
    residentialR1: "Maximum 3 storeys or 10.0 meters height limit.",
    residentialR2: "Maximum 3 storeys or 10.0 meters height limit.",
    commercial: "Up to 5 storeys depending on road right-of-way (RROW) width."
  }
};

export const FAQ_DATABASE: FAQItem[] = [
  {
    question: "Ano ang mga kailangan para magpatayo ng bahay sa Sto. Tomas?",
    keywords: ["bahay", "residential", "house", "magpatayo", "requirements", "kailangan"],
    category: "building",
    answer: "Para sa pagpapatayo ng residential house sa Sto. Tomas, Pampanga, sundin ang 2 pangunahing hakbang:\n\n1. **Una (Step 1): Kumuha ng Locational Clearance (Zoning)** mula sa MPDC/Zoning Office. Kailangan dito ang TCT (Titulo ng Lupa), Tax Declaration, Amilyar (Tax Clearance), at Lot Plan.\n2. **Pangalawa (Step 2): Mag-apply para sa Unified Building Permit (NBC Form 1)** at mga Ancillary Permits (Architectural, Structural, Electrical, Plumbing) na may 5 sets ng blueprints na pinirmahan at selyado ng mga lisensyadong arkitekto at inhinyero.\n\nKapag aprubado na ang Locational Clearance, maaari na pong i-submit ang inyong Building Permit application!"
  },
  {
    question: "Bakit kailangan muna ang Locational Clearance bago ang Building Permit?",
    keywords: ["bakit", "locational", "clearance", "bago", "building", "permit", "zoning", "una"],
    category: "zoning",
    answer: "Ayon sa batas pambansa at sa Sto. Tomas Municipal Zoning Ordinance, kailangang tiyakin muna ng Zoning Administrator na ang inyong lupa ay ligtas, hindi nasa flood hazard/buffer zone, at tugma ang uri ng itatayo (halimbawa: tirahan vs pabrika) sa Comprehensive Land Use Plan (CLUP). Kapag may Locational Clearance na kayo, tsaka pa lamang susuriin ng Building Official ang structural at engineering safety ng gusali."
  },
  {
    question: "Magkano ang bayad o permit fees para sa 2-storey house?",
    keywords: ["magkano", "fee", "fees", "bayad", "cost", "presyo", "2-storey", "floor area"],
    category: "fees",
    answer: "Ang permit fees sa Sto. Tomas ay binabase sa **Total Floor Area (sq.m.)** at uri ng konstruksyon:\n\n- **Filing & Processing Fee**: ~₱200 - ₱500\n- **Building Permit Fee**: karaniwang ₱15 - ₱30 bawat sq.m. para sa residential\n- **Electrical & Plumbing Fees**: Depende sa dami ng outlets, fixtures, at kVA load (~₱1,500 - ₱4,000)\n- **Locational Clearance Fee**: ~₱1,000 - ₱2,500 depende sa floor area\n\nHalimbawa, para sa isang 150 sq.m. na 2-storey house, ang kabuuang tinatayang fees ay nasa pagitan ng **₱5,000 hanggang ₱12,000**. Maaari ninyong tingnan ang eksaktong computation sa inyong dashboard!"
  },
  {
    question: "Paano ko iche-check ang status ng aking permit application?",
    keywords: ["status", "check", "track", "nasaan", "follow up", "follow-up", "kamusta", "kumusta"],
    category: "tracking",
    answer: "Maaari mong subaybayan ang iyong permit sa pamamagitan ng pagpunta sa **'Application Status'** o **'Track Applications'** sa sidebar menu ng e-Tayo portal. I-enter lamang ang iyong **Tracking ID** (halimbawa: `LC-2026-1841` o `APP-2026-9084`). Makikita mo roon ang bawat hakbang ng evaluation ng Municipal Engineers!"
  },
  {
    question: "Sino-sino ang mga propesyonal na kailangang pumirma sa mga plano?",
    keywords: ["pumirma", "pirma", "engineer", "architect", "arkitekto", "inhinyero", "propesyonal", "sign"],
    category: "ancillary",
    answer: "Para sa kumpletong Building Permit application, kailangan ang pirma at selyo ng mga sumusunod:\n\n1. **Architectural Plans**: Licensed Architect (PRC & PTR)\n2. **Structural Plans & Computations**: Licensed Civil Engineer (PRC & PTR)\n3. **Electrical Plans & Load Schedules**: Professional Electrical Engineer (PEE)\n4. **Plumbing/Sanitary Plans**: Registered Master Plumber (RMP) o Sanitary Engineer\n5. **Mechanical Plans** (kung may ACU o elevator): Professional Mechanical Engineer (PME)\n\nLahat ng inhinyero at arkitekto ay dapat may updated PRC ID at PTR sa kasalukuyang taon."
  },
  {
    question: "Ano ang required setbacks para sa residential property sa Sto. Tomas?",
    keywords: ["setback", "setbacks", "layo", "bakod", "harapan", "gilid", "likod", "boundary"],
    category: "zoning",
    answer: "Ayon sa Sto. Tomas Zoning Code:\n- **Harapan (Front Setback)**: Minimum na 4.50 meters mula sa property line (o road right of way)\n- **Likuran (Rear Setback)**: Minimum na 2.00 meters\n- **Magkabilang Gilid (Side Setbacks)**: Minimum na 2.00 meters bawat gilid\n\nKung nais magtayo ng firewall (0 setback) sa isang gilid, kailangan itong may kasulatang pahintulot mula sa katabing may-ari ng lupa at may 1.0 metrong parapet wall sa itaas ng bubong."
  }
];

/**
 * Enhanced semantic fallback matching for Mang Tomas when offline or when no LLM API key is configured.
 */
export function findKnowledgeBaseMatches(query: string, userApplications?: any[]): string {
  const q = query.toLowerCase().trim();

  // 1. Check if user is asking about their specific application status
  if (userApplications && userApplications.length > 0) {
    if (q.includes("status") || q.includes("permit ko") || q.includes("application ko") || q.includes("kamusta") || q.includes("kumusta") || q.includes("track")) {
      const summaryList = userApplications.map((app, i) => {
        const type = app.permitType ? app.permitType.replace(/_/g, " ") : "Permit";
        const status = (app.status || "pending").toUpperCase();
        return `${i + 1}. **${type}** (\`${app.id}\`) para sa *${app.projectName || "Project"}*\n   • **Status**: \`${status}\`\n   • **Lokasyon**: ${app.projectAddress || "Sto. Tomas, Pampanga"}`;
      }).join("\n\n");

      return `Mabuhay! Chineck ko po ang inyong mga kasalukuyang permit applications sa Sto. Tomas e-Tayo system:\n\n${summaryList}\n\nKung may kailangan kayong linawin sa alinman sa mga ito, sabihin lamang po ang Application ID!`;
    }

    // Check if query mentions a specific application ID in the user's list
    const foundApp = userApplications.find(app => q.includes(app.id.toLowerCase()));
    if (foundApp) {
      return `Tungkol po sa inyong application **${foundApp.id}** (${foundApp.projectName}):\n\n• **Permit Type**: ${foundApp.permitType?.replace(/_/g, " ") || "Locational Clearance"}\n• **Kasalukuyang Status**: \`${(foundApp.status || "pending").toUpperCase()}\`\n• **Petsa ng Submission**: ${foundApp.dateSubmitted || "Kamakailan"}\n• **Project Address**: ${foundApp.projectAddress || "Sto. Tomas, Pampanga"}\n\nKung kailangan ninyong mag-upload ng karagdagang dokumento o mag-download ng permit, pumunta lamang po sa Track page!`;
    }
  }

  // 2. Search in FAQ Database using keyword scoring
  let bestMatch: FAQItem | null = null;
  let highestScore = 0;

  for (const item of FAQ_DATABASE) {
    let score = 0;
    for (const kw of item.keywords) {
      if (q.includes(kw)) {
        score += kw.length; // weight longer keyword matches higher
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && highestScore >= 3) {
    return bestMatch.answer;
  }

  // 3. Fallback: Contextual conversational guidance
  if (q.includes("locational") || q.includes("zoning")) {
    return OFFICIAL_16_FORMS_GUIDE.LC.description + "\n\n**Mga Kailangan**:\n" + OFFICIAL_16_FORMS_GUIDE.LC.requirements.map(r => `• ${r}`).join("\n");
  }

  if (q.includes("building permit") || q.includes("nbc form 1")) {
    return OFFICIAL_16_FORMS_GUIDE.BP.description + "\n\n**Mahalagang Paalala**: Kailangang may aprubadong Locational Clearance muna bago ma-release ang Building Permit.\n\n**Mga Kailangan**:\n" + OFFICIAL_16_FORMS_GUIDE.BP.requirements.map(r => `• ${r}`).join("\n");
  }

  if (q.includes("salamat") || q.includes("thank")) {
    return "Walang anuman po! Ikinagagalak kong makatulong sa inyo para sa inyong konstruksyon dito sa Sto. Tomas, Pampanga. Kung may iba pa kayong katanungan, magtanong lamang po kayo anumang oras!";
  }

  if (q.includes("kumusta") || q.includes("hello") || q.includes("hi") || q.includes("mabuhay")) {
    return "Mabuhay! Ako po si **Mang Tomas**, ang inyong AI Virtual Permitting Officer para sa Sto. Tomas, Pampanga. Ano po ang maitutulong ko sa inyong mga plano o permit ngayon?";
  }

  return "Mabuhay! Bilang inyong virtual assistant sa Sto. Tomas, maaari ko po kayong gabayan sa:\n\n1. **Locational Clearance & Zoning** requirements at setbacks\n2. **Building Permit (NBC Form 1)** at mga blueprint requirements\n3. **Kwentada ng Permit Fees** base sa floor area\n4. **Status ng inyong Application**\n\nAno po ang nais ninyong itanong tungkol sa inyong ipapatayong gusali o bahay?";
}
