import { PermitApplication, SystemLog, FeeStructure, Requirement, TrackingStep, HistoryLog } from '../types';

export const DEFAULT_REQUIREMENTS_BY_TYPE: Record<string, string[]> = {
  locational_clearance: [
    'Zoning Clearance Application Form',
    'Certified True Copy of Transfer Certificate of Title (TCT)',
    'Barangay Clearance for Locational Clearance',
    'Site Development Plan with Vicinity Map',
    'Latest Tax Declaration & Real Property Tax Receipt',
    'Lot Plan signed and sealed by a Geodetic Engineer'
  ],
  building_permit: [
    'Unified Building Permit Application Form',
    'Proof of Ownership (TCT, Deed of Absolute Sale, or Lease Contract)',
    'Five (5) Sets of Architectural, Structural, Electrical, and Plumbing Plans',
    'Bill of Materials and Detailed Cost Estimates',
    'Technical Specifications',
    'Structural Design Analysis and Computation (for 2 storeys and above)',
    'Geotechnical/Soil Test Report (for 3 storeys and above)'
  ],
  occupancy_permit: [
    'Certificate of Completion (duly signed and sealed by in-charge Professionals)',
    'As-Built Plans (if there are deviations from original plans)',
    'Fire Safety Inspection Certificate (FSIC) from BFP',
    'Construction Logbook (signed and sealed by Project Inspector)',
    'Photographs of Completed Structure (Front, Sides, and Rear)',
    'Photographs of Required Parking Space, Setbacks, and Drainage'
  ]
};

export const INITIAL_APPLICATIONS: PermitApplication[] = [
  {
    id: "LC-2026-5122",
    permitType: "locational_clearance",
    projectName: "Single-Detached House",
    applicantName: "RANDREB YUTUC DAVID",
    applicantPhone: "0917 123 4567",
    applicantEmail: "david.randreb@gmail.com",
    projectAddress: "Purok 3, Brgy. San Bartolome, Sto. Tomas, Pampanga",
    projectDescription: "Construction of single-detached residential house in San Bartolome.",
    status: "released",
    isReleased: true,
    paymentStatus: "paid",
    dateSubmitted: "October 08, 2026, 10:13 PM",
    dateApproved: "October 08, 2026",
    evaluatedBy: "Dave Sicat",
    evaluatorEmail: "dave.sicat@etayo.gov.ph",
    projectType: "Single-Detached House",
    requirements: [
      { name: "Locational Clearance Application Form", required: true, status: "approved" },
      { name: "Certified True Copy of Transfer Certificate of Title (TCT)", required: true, status: "approved" }
    ],
    trackingSteps: [
      { title: "Application Submitted", status: "completed", date: "Oct 08, 2026" },
      { title: "Zoning Clearance Approved", status: "completed", date: "Oct 08, 2026" },
      { title: "Permit Released", status: "completed", date: "Oct 08, 2026" }
    ]
  },
  {
    id: "LC-2026-4419",
    permitType: "locational_clearance",
    projectName: "Sicat House",
    applicantName: "Dave Sicat",
    applicantPhone: "0917 123 4567",
    applicantEmail: "mdpsicat.student@ua.edu.ph",
    projectAddress: "Purok 3, Brgy. San Bartolome, Sto. Tomas, Pampanga",
    projectDescription: "Residential construction clearance for Sicat House.",
    status: "released",
    isReleased: true,
    paymentStatus: "paid",
    dateSubmitted: "October 08, 2026, 10:13 PM",
    dateApproved: "October 08, 2026",
    evaluatedBy: "Dave Sicat",
    evaluatorEmail: "dave.sicat@etayo.gov.ph",
    projectType: "Single-Detached House",
    requirements: [
      { name: "Locational Clearance Application Form", required: true, status: "approved" }
    ],
    trackingSteps: [
      { title: "Application Submitted", status: "completed", date: "Oct 08, 2026" },
      { title: "Permit Released", status: "completed", date: "Oct 08, 2026" }
    ]
  },
  {
    id: "BP-2026-4419",
    permitType: "building_permit",
    projectName: "Sicat House",
    applicantName: "Dave Sicat",
    applicantPhone: "0917 123 4567",
    applicantEmail: "mdpsicat.student@ua.edu.ph",
    projectAddress: "Purok 3, Brgy. San Bartolome, Sto. Tomas, Pampanga",
    projectDescription: "Building permit for Sicat House residential construction.",
    status: "released",
    isReleased: true,
    paymentStatus: "paid",
    dateSubmitted: "October 08, 2026, 10:13 PM",
    dateApproved: "October 08, 2026",
    evaluatedBy: "Engr. Gilbert Cruz",
    evaluatorEmail: "gilbert.cruz@etayo.gov.ph",
    locationalClearanceRef: "LC-2026-4419",
    projectType: "Single-Detached House",
    requirements: [
      { name: "Unified Building Permit Application Form", required: true, status: "approved" }
    ],
    trackingSteps: [
      { title: "Application Submitted", status: "completed", date: "Oct 08, 2026" },
      { title: "Permit Released", status: "completed", date: "Oct 08, 2026" }
    ]
  },
  {
    id: "LC-2026-3820",
    permitType: "locational_clearance",
    projectName: "Single-Detached House",
    applicantName: "Kathleen Ann Abarquez",
    applicantEmail: "kathleenabarquez@gmail.com",
    projectAddress: "12, Brgy. San Vicente, Sto. Tomas, Pampanga",
    projectDescription: "Locational clearance for Single-Detached House in San Vicente.",
    status: "released",
    isReleased: true,
    paymentStatus: "paid",
    dateSubmitted: "October 08, 2026, 10:13 PM",
    dateApproved: "October 08, 2026",
    evaluatedBy: "Dave Sicat",
    evaluatorEmail: "dave.sicat@etayo.gov.ph",
    projectType: "Single-Detached House",
    requirements: [
      { name: "Locational Clearance Application Form", required: true, status: "approved" }
    ],
    trackingSteps: [
      { title: "Application Submitted", status: "completed", date: "Oct 08, 2026" },
      { title: "Permit Released", status: "completed", date: "Oct 08, 2026" }
    ]
  },
  {
    id: "BP-2026-3820",
    permitType: "building_permit",
    projectName: "Single-Detached House",
    applicantName: "Kathleen Ann Abarquez",
    applicantEmail: "kathleenabarquez@gmail.com",
    projectAddress: "12, Brgy. San Vicente, Sto. Tomas, Pampanga",
    projectDescription: "Building permit for residential house in San Vicente.",
    status: "released",
    isReleased: true,
    paymentStatus: "paid",
    dateSubmitted: "October 08, 2026, 10:13 PM",
    dateApproved: "October 08, 2026",
    evaluatedBy: "Engr. Gilbert Cruz",
    evaluatorEmail: "gilbert.cruz@etayo.gov.ph",
    locationalClearanceRef: "LC-2026-3820",
    projectType: "Single-Detached House",
    requirements: [
      { name: "Unified Building Permit Application Form", required: true, status: "approved" }
    ],
    trackingSteps: [
      { title: "Application Submitted", status: "completed", date: "Oct 08, 2026" },
      { title: "Permit Released", status: "completed", date: "Oct 08, 2026" }
    ]
  },
  {
    id: "LC-2026-1188",
    permitType: "locational_clearance",
    projectName: "Multi-Storey Residential",
    applicantName: "Dave Sicat",
    applicantEmail: "mdpsicat.student@ua.edu.ph",
    projectAddress: "Purok 3, Brgy. San Bartolome, Sto. Tomas, Pampanga",
    projectDescription: "Locational clearance for Multi-Storey Residential dwelling in San Bartolome.",
    status: "released",
    isReleased: true,
    paymentStatus: "paid",
    dateSubmitted: "October 08, 2026, 09:27 PM",
    dateApproved: "October 08, 2026",
    evaluatedBy: "Dave Sicat",
    evaluatorEmail: "dave.sicat@etayo.gov.ph",
    projectType: "Multi-Storey Residential",
    requirements: [
      { name: "Locational Clearance Application Form", required: true, status: "approved" }
    ],
    trackingSteps: [
      { title: "Application Submitted", status: "completed", date: "Oct 08, 2026" },
      { title: "Permit Released", status: "completed", date: "Oct 08, 2026" }
    ]
  },
  {
    id: "BP-2026-1188",
    permitType: "building_permit",
    projectName: "Multi-Storey Residential",
    applicantName: "Dave Sicat",
    applicantEmail: "mdpsicat.student@ua.edu.ph",
    projectAddress: "Purok 3, Brgy. San Bartolome, Sto. Tomas, Pampanga",
    projectDescription: "Building permit for Multi-Storey Residential construction.",
    status: "released",
    isReleased: true,
    paymentStatus: "paid",
    dateSubmitted: "October 08, 2026, 09:27 PM",
    dateApproved: "October 08, 2026",
    evaluatedBy: "Engr. Gilbert Cruz",
    evaluatorEmail: "gilbert.cruz@etayo.gov.ph",
    locationalClearanceRef: "LC-2026-1188",
    projectType: "Multi-Storey Residential",
    requirements: [
      { name: "Unified Building Permit Application Form", required: true, status: "approved" }
    ],
    trackingSteps: [
      { title: "Application Submitted", status: "completed", date: "Oct 08, 2026" },
      { title: "Permit Released", status: "completed", date: "Oct 08, 2026" }
    ]
  }
];

export const SEED_APPLICATIONS = INITIAL_APPLICATIONS;

// No initial system logs — logs must come from the real database only.
export const INITIAL_SYSTEM_LOGS: SystemLog[] = [];

export const FEE_STRUCTURES: FeeStructure[] = [
  { id: 'FEE-001', name: 'Zoning & Land Use Inspection Base Fee', baseAmount: 1500, category: 'locational_clearance' },
  { id: 'FEE-002', name: 'Locational Processing Fee per Sq.m. of Lot', baseAmount: 500, multiplierName: 'Project Area multiplier', multiplierValue: 6, category: 'locational_clearance' },
  { id: 'FEE-003', name: 'Building Permit Base Filing Fee', baseAmount: 2500, category: 'building_permit' },
  { id: 'FEE-004', name: 'Structural Review Assessment Fee per Sq.m.', baseAmount: 3.50, multiplierName: 'Floor Area (sq.m.)', multiplierValue: 2500, category: 'building_permit' },
  { id: 'FEE-005', name: 'Plumbing and Sanitary Inspection Fee', baseAmount: 1200, category: 'building_permit' },
  { id: 'FEE-006', name: 'Electrical Inspection Fee per Outlet', baseAmount: 200, multiplierName: 'No. of Outlets/Fixtures', multiplierValue: 40, category: 'building_permit' },
  { id: 'FEE-007', name: 'Occupancy Inspection Base Fee', baseAmount: 3000, category: 'occupancy_permit' },
  { id: 'FEE-008', name: 'FSIC Clearance Endorsement Processing', baseAmount: 2200, category: 'occupancy_permit' }
];

export const MOCK_STAFF = [
  'Engr. Ricardo Mercado (Structural Reviewer)',
  'Arch. Sofia Torres (Architectural Evaluator)',
  'Zoning Officer Amara Santos (Zoning Clearance)',
  'Engr. Antonio V. Cruz (Building Official)'
];
