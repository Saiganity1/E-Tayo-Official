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

// No initial applications — all data must come from the real database only.
export const INITIAL_APPLICATIONS: PermitApplication[] = [];

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
