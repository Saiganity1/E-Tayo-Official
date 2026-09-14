export type RequirementLevel = 'required' | 'conditional' | 'not_required';

export interface PermitFormMatrix {
  buildingPermit: RequirementLevel;
  architecturalPermit: RequirementLevel;
  civilStructuralPermit: RequirementLevel;
  electricalPermit: RequirementLevel;
  sanitaryPermit: RequirementLevel;
  mechanicalPermit: RequirementLevel;
  electronicsPermit: RequirementLevel;
  fireBfpPermit: RequirementLevel;
  zoningPermit: RequirementLevel;
}

export type ProjectCategory =
  | 'Residential'
  | 'Commercial'
  | 'Industrial'
  | 'Institutional'
  | 'Ancillary & Alterations'
  | 'Utilities & Mechanical';

export interface ProjectTypeItem {
  id: string;
  name: string;
  category: ProjectCategory;
  description: string;
  matrix: PermitFormMatrix;
  estimatedDays: string;
}

export const PERMIT_FORM_METADATA: Record<keyof PermitFormMatrix, { label: string; code: string; desc: string; templateFile?: string }> = {
  buildingPermit: { 
    label: 'Building Permit', 
    code: 'BP', 
    desc: 'Unified NBCP Form 1 - General construction permit',
    templateFile: '/templates/UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf'
  },
  architecturalPermit: { 
    label: 'Architectural Permit', 
    code: 'AP', 
    desc: 'Architectural plans, elevations, and spatial layout',
    templateFile: '/templates/ARCHITECTURAL-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf'
  },
  civilStructuralPermit: { 
    label: 'Civil/Structural Permit', 
    code: 'SP', 
    desc: 'Structural calculations, foundation, and framing',
    templateFile: '/templates/Civil-Structural-Permit-Sto-Tomas-Gilbert-Cruz.pdf'
  },
  electricalPermit: { 
    label: 'Electrical Permit', 
    code: 'EP', 
    desc: 'Wiring diagrams, load computations, single-line diagram',
    templateFile: '/templates/ELECTRICAL-PERMIT-FORM-Gilbert-Cruz.pdf'
  },
  sanitaryPermit: { 
    label: 'Sanitary Permit', 
    code: 'PL', 
    desc: 'Plumbing layouts, septic tank design, wastewater system',
    templateFile: '/templates/SANITARY-PLUMBING-PERMIT-Sto-Tomas-Fixed.pdf'
  },
  mechanicalPermit: { 
    label: 'Mechanical Permit', 
    code: 'MP', 
    desc: 'HVAC, machinery, ventilation, and pressure vessels',
    templateFile: '/templates/MECHANICAL-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf'
  },
  electronicsPermit: { 
    label: 'Electronics Permit', 
    code: 'EL', 
    desc: 'Telecom, CCTV, fire alarms, network infrastructure',
    templateFile: '/templates/ELECTRONICS-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf'
  },
  fireBfpPermit: { 
    label: 'Fire / BFP Clearance', 
    code: 'FSEC', 
    desc: 'Fire safety evaluation clearance & egress standards' 
  },
  zoningPermit: { 
    label: 'Zoning (Locational Clearance)', 
    code: 'LC', 
    desc: 'Zoning & land use compliance (Stage 1 prerequisite)',
    templateFile: '/templates/LOCATIONAL-CLEARANCE-Sto-Tomas.pdf'
  }
};

export const PROJECT_TYPES_MATRIX: ProjectTypeItem[] = [
  // --- RESIDENTIAL ---
  {
    id: 'single_detached_house',
    name: 'Single-Detached House',
    category: 'Residential',
    description: 'Stand-alone single family residential home with dedicated lot boundaries.',
    estimatedDays: '3 - 5 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'required',
      mechanicalPermit: 'conditional',
      electronicsPermit: 'conditional',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },
  {
    id: 'two_storey_house',
    name: 'Two-Storey House',
    category: 'Residential',
    description: 'Two-level residential dwelling requiring structural design and stair clearances.',
    estimatedDays: '3 - 5 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'required',
      mechanicalPermit: 'conditional',
      electronicsPermit: 'conditional',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },
  {
    id: 'multi_storey_residential',
    name: 'Multi-Storey Residential',
    category: 'Residential',
    description: '3+ storeys residential building, condominium, or multi-family complex.',
    estimatedDays: '7 - 10 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'required',
      mechanicalPermit: 'required',
      electronicsPermit: 'conditional',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },
  {
    id: 'apartment',
    name: 'Apartment',
    category: 'Residential',
    description: 'Multi-unit dwelling with independent tenant units sharing structural amenities.',
    estimatedDays: '5 - 7 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'required',
      mechanicalPermit: 'conditional',
      electronicsPermit: 'conditional',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },
  {
    id: 'boarding_house_dormitory',
    name: 'Boarding House / Dormitory',
    category: 'Residential',
    description: 'Shared living quarters, student residences, and lodging establishments.',
    estimatedDays: '5 - 7 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'required',
      mechanicalPermit: 'conditional',
      electronicsPermit: 'conditional',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },

  // --- COMMERCIAL ---
  {
    id: 'commercial_building',
    name: 'Commercial Building',
    category: 'Commercial',
    description: 'Standard retail, commercial spaces, and mixed-use commercial properties.',
    estimatedDays: '5 - 7 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'required',
      mechanicalPermit: 'conditional',
      electronicsPermit: 'conditional',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },
  {
    id: 'multi_storey_commercial',
    name: 'Multi-Storey Commercial',
    category: 'Commercial',
    description: 'Large commercial malls, multi-floor department stores, and commercial towers.',
    estimatedDays: '7 - 14 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'required',
      mechanicalPermit: 'required',
      electronicsPermit: 'required',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },
  {
    id: 'office_building',
    name: 'Office Building',
    category: 'Commercial',
    description: 'Corporate offices, business process hubs, and administrative structures.',
    estimatedDays: '7 - 10 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'required',
      mechanicalPermit: 'required',
      electronicsPermit: 'conditional',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },
  {
    id: 'hotel',
    name: 'Hotel',
    category: 'Commercial',
    description: 'Hospitality accommodations with guest rooms, guest amenities, and food services.',
    estimatedDays: '10 - 14 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'required',
      mechanicalPermit: 'required',
      electronicsPermit: 'required',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },
  {
    id: 'resort',
    name: 'Resort',
    category: 'Commercial',
    description: 'Eco-tourism and recreation property with pavilions, cottages, and grounds.',
    estimatedDays: '7 - 10 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'required',
      mechanicalPermit: 'conditional',
      electronicsPermit: 'conditional',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },
  {
    id: 'resort_swimming_pool',
    name: 'Resort + Swimming Pool',
    category: 'Commercial',
    description: 'Resort compound with engineered swimming pool, filtration, and pump houses.',
    estimatedDays: '7 - 12 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'required',
      mechanicalPermit: 'required',
      electronicsPermit: 'conditional',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },
  {
    id: 'gasoline_station',
    name: 'Gasoline Station',
    category: 'Commercial',
    description: 'Fuel dispensing station, canopy structure, and underground fuel storage tanks.',
    estimatedDays: '10 - 14 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'required',
      mechanicalPermit: 'required',
      electronicsPermit: 'conditional',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    category: 'Commercial',
    description: 'Dining establishment, commercial kitchen, grease trap, and exhaust systems.',
    estimatedDays: '5 - 7 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'conditional',
      electricalPermit: 'required',
      sanitaryPermit: 'required',
      mechanicalPermit: 'required',
      electronicsPermit: 'conditional',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },
  {
    id: 'retail_store',
    name: 'Retail / Store',
    category: 'Commercial',
    description: 'Neighborhood grocery, boutique, pharmacy, or convenience store.',
    estimatedDays: '3 - 5 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'conditional',
      electricalPermit: 'required',
      sanitaryPermit: 'conditional',
      mechanicalPermit: 'conditional',
      electronicsPermit: 'conditional',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },

  // --- INDUSTRIAL ---
  {
    id: 'warehouse',
    name: 'Warehouse',
    category: 'Industrial',
    description: 'Logistics storage facility, goods distribution hub, and steel truss structure.',
    estimatedDays: '7 - 10 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'required',
      mechanicalPermit: 'conditional',
      electronicsPermit: 'conditional',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },
  {
    id: 'factory_industrial',
    name: 'Factory / Industrial',
    category: 'Industrial',
    description: 'Heavy or light manufacturing facility, production plant, and machine floor.',
    estimatedDays: '10 - 15 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'required',
      mechanicalPermit: 'required',
      electronicsPermit: 'required',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },

  // --- INSTITUTIONAL / CIVIC ---
  {
    id: 'school',
    name: 'School',
    category: 'Institutional',
    description: 'Academic classrooms, laboratory facilities, and educational institutions.',
    estimatedDays: '7 - 12 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'required',
      mechanicalPermit: 'required',
      electronicsPermit: 'required',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },
  {
    id: 'church_place_of_worship',
    name: 'Church / Place of Worship',
    category: 'Institutional',
    description: 'Religious gathering hall, sanctuary, chapel, or parish facilities.',
    estimatedDays: '7 - 10 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'required',
      mechanicalPermit: 'conditional',
      electronicsPermit: 'required',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },
  {
    id: 'gymnasium',
    name: 'Gymnasium',
    category: 'Institutional',
    description: 'Sports complex, indoor basketball court, and spectator grandstand.',
    estimatedDays: '7 - 10 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'conditional',
      mechanicalPermit: 'conditional',
      electronicsPermit: 'required',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },
  {
    id: 'multi_purpose_hall',
    name: 'Multi-Purpose Hall',
    category: 'Institutional',
    description: 'Barangay civic auditorium, community center, or event pavilion.',
    estimatedDays: '5 - 7 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'conditional',
      mechanicalPermit: 'conditional',
      electronicsPermit: 'conditional',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },
  {
    id: 'recreational_building',
    name: 'Recreational Building',
    category: 'Institutional',
    description: 'Clubhouse, sports facility, gaming zone, and civic recreational hall.',
    estimatedDays: '5 - 7 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'conditional',
      mechanicalPermit: 'conditional',
      electronicsPermit: 'conditional',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },

  // --- ANCILLARY & ALTERATIONS ---
  {
    id: 'renovation_alteration',
    name: 'Renovation / Alteration',
    category: 'Ancillary & Alterations',
    description: 'Internal or external architectural remodel, room expansion, or partition changes.',
    estimatedDays: '3 - 5 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'conditional',
      electricalPermit: 'conditional',
      sanitaryPermit: 'conditional',
      mechanicalPermit: 'conditional',
      electronicsPermit: 'conditional',
      fireBfpPermit: 'required',
      zoningPermit: 'conditional'
    }
  },
  {
    id: 'change_of_use',
    name: 'Change of Use',
    category: 'Ancillary & Alterations',
    description: 'Conversion of existing building use (e.g. residential home converted into cafe or clinic).',
    estimatedDays: '5 - 7 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'conditional',
      electricalPermit: 'conditional',
      sanitaryPermit: 'conditional',
      mechanicalPermit: 'conditional',
      electronicsPermit: 'conditional',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },
  {
    id: 'demolition',
    name: 'Demolition',
    category: 'Ancillary & Alterations',
    description: 'Safe removal and tear-down of dilapidated or obsolete structures.',
    estimatedDays: '3 - 5 days',
    matrix: {
      buildingPermit: 'not_required',
      architecturalPermit: 'conditional',
      civilStructuralPermit: 'required',
      electricalPermit: 'not_required',
      sanitaryPermit: 'not_required',
      mechanicalPermit: 'not_required',
      electronicsPermit: 'not_required',
      fireBfpPermit: 'conditional',
      zoningPermit: 'conditional'
    }
  },
  {
    id: 'fence',
    name: 'Fence',
    category: 'Ancillary & Alterations',
    description: 'Perimeter concrete hollow block (CHB) or steel boundary wall over 1.80 meters.',
    estimatedDays: '2 - 3 days',
    matrix: {
      buildingPermit: 'not_required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'conditional',
      electricalPermit: 'not_required',
      sanitaryPermit: 'not_required',
      mechanicalPermit: 'not_required',
      electronicsPermit: 'not_required',
      fireBfpPermit: 'not_required',
      zoningPermit: 'conditional'
    }
  },
  {
    id: 'retaining_wall',
    name: 'Retaining Wall',
    category: 'Ancillary & Alterations',
    description: 'Reinforced concrete earth retention structure or slope stabilization wall.',
    estimatedDays: '3 - 5 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'conditional',
      civilStructuralPermit: 'required',
      electricalPermit: 'not_required',
      sanitaryPermit: 'not_required',
      mechanicalPermit: 'not_required',
      electronicsPermit: 'not_required',
      fireBfpPermit: 'conditional',
      zoningPermit: 'conditional'
    }
  },
  {
    id: 'signage_billboard',
    name: 'Signage / Billboard',
    category: 'Ancillary & Alterations',
    description: 'Freestanding outdoor advertisement billboard, pylon sign, or building banner structure.',
    estimatedDays: '3 - 5 days',
    matrix: {
      buildingPermit: 'not_required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'conditional',
      sanitaryPermit: 'not_required',
      mechanicalPermit: 'not_required',
      electronicsPermit: 'conditional',
      fireBfpPermit: 'conditional',
      zoningPermit: 'required'
    }
  },
  {
    id: 'swimming_pool',
    name: 'Swimming Pool',
    category: 'Ancillary & Alterations',
    description: 'Private or commercial aquatic pool, water retention vessel, filtration pumps, and piping system.',
    estimatedDays: '5 - 7 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'required',
      mechanicalPermit: 'required',
      electronicsPermit: 'not_required',
      fireBfpPermit: 'conditional',
      zoningPermit: 'required'
    }
  },

  // --- UTILITIES & MECHANICAL ---
  {
    id: 'telecommunication_structure',
    name: 'Telecommunication Structure',
    category: 'Utilities & Mechanical',
    description: 'Cellular tower, guyed antenna mast, satellite dish platform, and equipment shelter.',
    estimatedDays: '10 - 15 days',
    matrix: {
      buildingPermit: 'required',
      architecturalPermit: 'required',
      civilStructuralPermit: 'required',
      electricalPermit: 'required',
      sanitaryPermit: 'not_required',
      mechanicalPermit: 'conditional',
      electronicsPermit: 'required',
      fireBfpPermit: 'required',
      zoningPermit: 'required'
    }
  },
  {
    id: 'generator_set',
    name: 'Generator Set',
    category: 'Utilities & Mechanical',
    description: 'Diesel standby generator, fuel connection, sound attenuator, and exhaust piping.',
    estimatedDays: '3 - 5 days',
    matrix: {
      buildingPermit: 'conditional',
      architecturalPermit: 'not_required',
      civilStructuralPermit: 'conditional',
      electricalPermit: 'required',
      sanitaryPermit: 'not_required',
      mechanicalPermit: 'required',
      electronicsPermit: 'not_required',
      fireBfpPermit: 'required',
      zoningPermit: 'conditional'
    }
  },
  {
    id: 'elevator_escalator',
    name: 'Elevator / Escalator',
    category: 'Utilities & Mechanical',
    description: 'Passenger/freight elevator installation, dumbwaiter, or mechanical escalator.',
    estimatedDays: '5 - 7 days',
    matrix: {
      buildingPermit: 'conditional',
      architecturalPermit: 'conditional',
      civilStructuralPermit: 'conditional',
      electricalPermit: 'required',
      sanitaryPermit: 'not_required',
      mechanicalPermit: 'required',
      electronicsPermit: 'conditional',
      fireBfpPermit: 'required',
      zoningPermit: 'not_required'
    }
  }
];

export function getRequiredPermitForms(projectType: ProjectTypeItem): (keyof PermitFormMatrix)[] {
  return (Object.keys(projectType.matrix) as (keyof PermitFormMatrix)[]).filter(
    (key) => projectType.matrix[key] === 'required'
  );
}

export function getConditionalPermitForms(projectType: ProjectTypeItem): (keyof PermitFormMatrix)[] {
  return (Object.keys(projectType.matrix) as (keyof PermitFormMatrix)[]).filter(
    (key) => projectType.matrix[key] === 'conditional'
  );
}

/**
 * Returns the exact official municipal PDF template path for a given permit form,
 * taking into account project-specific specialized permits (e.g. Demolition, Fencing, Signage).
 */
export function getPermitFormTemplate(formKey: keyof PermitFormMatrix, projectType?: ProjectTypeItem): string | undefined {
  if (projectType) {
    if (projectType.id === 'demolition' && (formKey === 'civilStructuralPermit' || formKey === 'buildingPermit')) {
      return '/templates/DEMOLITION-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf';
    }
    if (projectType.id === 'fence' && (formKey === 'architecturalPermit' || formKey === 'buildingPermit')) {
      return '/templates/FENCING-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf';
    }
    if (projectType.id === 'signage_billboard' && (formKey === 'architecturalPermit' || formKey === 'buildingPermit')) {
      return '/templates/SIGN-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf';
    }
  }
  return PERMIT_FORM_METADATA[formKey]?.templateFile;
}

export interface OfficialTemplateFile {
  name: string;
  category: string;
  code: string;
  filename: string;
  path: string;
  description: string;
}

export const ALL_OFFICIAL_TEMPLATES: OfficialTemplateFile[] = [
  {
    name: "Unified Application Form for Building Permit",
    category: "Primary Permit",
    code: "BP",
    filename: "UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf",
    path: "/templates/UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf",
    description: "Official unified application form for building permit (NBCP Form 1)"
  },
  {
    name: "Application for Locational Clearance",
    category: "Zoning & Land Use",
    code: "LC",
    filename: "LOCATIONAL-CLEARANCE-Sto-Tomas.pdf",
    path: "/templates/LOCATIONAL-CLEARANCE-Sto-Tomas.pdf",
    description: "Official Sto. Tomas Locational Clearance application form"
  },
  {
    name: "Architectural Permit",
    category: "Ancillary Permit",
    code: "AP",
    filename: "ARCHITECTURAL-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf",
    path: "/templates/ARCHITECTURAL-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf",
    description: "Official Architectural Permit application form"
  },
  {
    name: "Civil / Structural Permit",
    category: "Ancillary Permit",
    code: "SP",
    filename: "Civil-Structural-Permit-Sto-Tomas-Gilbert-Cruz.pdf",
    path: "/templates/Civil-Structural-Permit-Sto-Tomas-Gilbert-Cruz.pdf",
    description: "Official Civil and Structural Permit application form"
  },
  {
    name: "Electrical Permit",
    category: "Ancillary Permit",
    code: "EP",
    filename: "ELECTRICAL-PERMIT-FORM-Gilbert-Cruz.pdf",
    path: "/templates/ELECTRICAL-PERMIT-FORM-Gilbert-Cruz.pdf",
    description: "Official Electrical Permit application form"
  },
  {
    name: "Sanitary / Plumbing Permit",
    category: "Ancillary Permit",
    code: "PL",
    filename: "SANITARY-PLUMBING-PERMIT-Sto-Tomas-Fixed.pdf",
    path: "/templates/SANITARY-PLUMBING-PERMIT-Sto-Tomas-Fixed.pdf",
    description: "Official Sanitary and Plumbing Permit application form"
  },
  {
    name: "Mechanical Permit",
    category: "Ancillary Permit",
    code: "MP",
    filename: "MECHANICAL-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf",
    path: "/templates/MECHANICAL-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf",
    description: "Official Mechanical Permit application form"
  },
  {
    name: "Electronics Permit",
    category: "Ancillary Permit",
    code: "EL",
    filename: "ELECTRONICS-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf",
    path: "/templates/ELECTRONICS-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf",
    description: "Official Electronics Permit application form"
  },
  {
    name: "Demolition Permit",
    category: "Special Permit",
    code: "DP",
    filename: "DEMOLITION-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf",
    path: "/templates/DEMOLITION-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf",
    description: "Official Demolition Permit application form"
  },
  {
    name: "Fencing Permit",
    category: "Special Permit",
    code: "FP",
    filename: "FENCING-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf",
    path: "/templates/FENCING-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf",
    description: "Official Fencing Permit application form"
  },
  {
    name: "Excavation and Ground Preparation Permit",
    category: "Special Permit",
    code: "EXP",
    filename: "EXCAVATION-AND-GROUND-PREPARATION-PERMIT-Gilbert-Cruz.pdf",
    path: "/templates/EXCAVATION-AND-GROUND-PREPARATION-PERMIT-Gilbert-Cruz.pdf",
    description: "Official Excavation and Ground Preparation Permit form"
  },
  {
    name: "Sign Permit",
    category: "Special Permit",
    code: "SGP",
    filename: "SIGN-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf",
    path: "/templates/SIGN-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf",
    description: "Official Sign and Billboard Permit application form"
  },
  {
    name: "Permit for Temporary Service Connection",
    category: "Utilities & Services",
    code: "TSC",
    filename: "PERMIT-FOR-TEMPORARY-SERVICE-CONNECTION-Gilbert-Cruz.pdf",
    path: "/templates/PERMIT-FOR-TEMPORARY-SERVICE-CONNECTION-Gilbert-Cruz.pdf",
    description: "Official Temporary Service Connection permit form"
  },
  {
    name: "Certificate of Occupancy Unified Form",
    category: "Completion & Occupancy",
    code: "CO",
    filename: "UNIFIED-APPLICATION-FORM-FOR-CERTIFICATE-OF-OCCUPANCY-Sto-Tomas.pdf",
    path: "/templates/UNIFIED-APPLICATION-FORM-FOR-CERTIFICATE-OF-OCCUPANCY-Sto-Tomas.pdf",
    description: "Unified application form for Certificate of Occupancy"
  },
  {
    name: "Certificate of Completion",
    category: "Completion & Occupancy",
    code: "CC",
    filename: "CERTIFICATE-OF-COMPLETION-Sto-Tomas-Header-Bold.pdf",
    path: "/templates/CERTIFICATE-OF-COMPLETION-Sto-Tomas-Header-Bold.pdf",
    description: "Official Certificate of Completion form"
  },
  {
    name: "Certificate of Final Electrical Inspection (CFEI)",
    category: "Completion & Occupancy",
    code: "CFEI",
    filename: "CERTIFICATE-OF-FINAL-ELECTRICAL-INSPECTION-Gilbert-Cruz.pdf",
    path: "/templates/CERTIFICATE-OF-FINAL-ELECTRICAL-INSPECTION-Gilbert-Cruz.pdf",
    description: "Official Certificate of Final Electrical Inspection form"
  }
];
