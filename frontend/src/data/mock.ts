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

const createMockRequirements = (type: string, filledCount: number = 3): Requirement[] => {
  const reqNames = DEFAULT_REQUIREMENTS_BY_TYPE[type] || [];
  return reqNames.map((name, index) => {
    const isFilled = index < filledCount;
    return {
      name,
      required: true,
      status: isFilled ? 'approved' : 'pending',
      fileName: isFilled ? `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_submitted.pdf` : undefined,
      fileSize: isFilled ? `${(1.2 + index * 0.5).toFixed(1)} MB` : undefined,
      remarks: isFilled ? 'Verified and compliant.' : undefined
    };
  });
};

const createStandardSteps = (status: string, submittedDate: string): TrackingStep[] => {
  const steps: TrackingStep[] = [
    { title: 'Application Submitted', status: 'completed', date: submittedDate, notes: 'Online application file successfully received.', actor: 'Applicant' },
    { title: 'Initial Document Verification', status: 'upcoming', notes: 'Reviewing all required attachments for completeness.' },
    { title: 'Technical Plan Evaluation', status: 'upcoming', notes: 'Zoning/Structural compliance check by OBO Engineers.' },
    { title: 'Technical Clearance Endorsement', status: 'upcoming', notes: 'Final sign-off of compliance certificates.' },
    { title: 'Final Approval & Release', status: 'upcoming', notes: 'Approval of Building Official and permit release.' }
  ];

  if (status === 'pending') {
    steps[0].status = 'completed';
    steps[1].status = 'current';
  } else if (status === 'under_review') {
    steps[0].status = 'completed';
    steps[1].status = 'completed';
    steps[1].date = adjustDate(submittedDate, 2);
    steps[2].status = 'current';
  } else if (status === 'incomplete_requirements') {
    steps[0].status = 'completed';
    steps[1].status = 'current';
    steps[1].notes = 'Awaiting re-upload of missing documents. Please check remarks.';
  } else if (status === 'approved' || status === 'released') {
    steps[0].status = 'completed';
    steps[0].date = submittedDate;
    steps[1].status = 'completed';
    steps[1].date = adjustDate(submittedDate, 2);
    steps[2].status = 'completed';
    steps[2].date = adjustDate(submittedDate, 4);
    steps[3].status = 'completed';
    steps[3].date = adjustDate(submittedDate, 6);
    steps[4].status = status === 'released' ? 'completed' : 'current';
    steps[4].date = status === 'released' ? adjustDate(submittedDate, 8) : undefined;
  } else if (status === 'rejected') {
    steps[0].status = 'completed';
    steps[1].status = 'completed';
    steps[1].date = adjustDate(submittedDate, 2);
    steps[2].status = 'current';
    steps[2].notes = 'Disapproved due to local zoning/structural violations.';
  }

  return steps;
};

function adjustDate(dateStr: string, daysToAdd: number): string {
  try {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + daysToAdd);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
  } catch (e) {
    return dateStr;
  }
}

export const INITIAL_APPLICATIONS: PermitApplication[] = [
  {
    id: 'LC-2025-0001',
    permitType: 'locational_clearance',
    projectName: 'Dela Cruz Warehouse',
    applicantName: 'Juan Dela Cruz',
    applicantPhone: '0917 000 4567',
    applicantEmail: 'juan.delacruz@email.com',
    applicantAddress: '123 Rizal Street, Sto. Tomas, Pampanga',
    projectAddress: 'Lot 8, Block 3, Brgy. San Bartolome, Sto. Tomas, Pampanga',
    projectDescription: 'Proposed construction of a warehouse building for logistics and storage purposes.',
    status: 'under_review',
    dateSubmitted: 'May 13, 2025',
    requirements: createMockRequirements('locational_clearance', 5),
    location: {
      lat: 15.0163,
      lng: 120.7188,
      address: 'Brgy. San Bartolome, Sto. Tomas, Pampanga',
      lotNo: '8',
      blockNo: '3'
    },
    trackingSteps: createStandardSteps('under_review', 'May 13, 2025'),
    estimatedFees: 4500,
    paymentStatus: 'paid',
    assignedStaff: 'Zoning Officer Amara Santos',
    historyLog: [
      { date: 'May 13, 2025, 09:30 AM', action: 'Application Submitted', actor: 'Juan Dela Cruz', details: 'Application package uploaded online.' },
      { date: 'May 14, 2025, 10:15 AM', action: 'Assigned Reviewer', actor: 'System Admin', details: 'Assigned to Zoning Officer Amara Santos.' },
      { date: 'May 15, 2025, 02:40 PM', action: 'Initial Review Passed', actor: 'Amara Santos', details: 'Documents verified. Proceeded to structural/zoning evaluation.' }
    ]
  },
  {
    id: 'BP-2025-0005',
    permitType: 'building_permit',
    projectName: '2-Storey Residence',
    applicantName: 'Juan Dela Cruz',
    applicantPhone: '0917 000 4567',
    applicantEmail: 'juan.delacruz@email.com',
    applicantAddress: '123 Rizal Street, Sto. Tomas, Pampanga',
    projectAddress: 'Lot 12, Block 1, Brgy. Poblacion, Sto. Tomas, Pampanga',
    projectDescription: 'Construction of a reinforced concrete 2-storey single-detached family house with roof deck.',
    status: 'pending',
    dateSubmitted: 'May 08, 2025',
    requirements: createMockRequirements('building_permit', 3),
    location: {
      lat: 15.0132,
      lng: 120.7121,
      address: 'Brgy. Poblacion, Sto. Tomas, Pampanga',
      lotNo: '12',
      blockNo: '1'
    },
    trackingSteps: createStandardSteps('pending', 'May 08, 2025'),
    estimatedFees: 0,
    paymentStatus: 'paid',
    assignedStaff: 'Engr. Ricardo Mercado',
    historyLog: [
      { date: 'May 08, 2025, 02:15 PM', action: 'Application Submitted', actor: 'Juan Dela Cruz', details: 'Uploaded pre-filled application with standard architectural templates.' },
      { date: 'May 09, 2025, 08:00 AM', action: 'Pending Verification', actor: 'System', details: 'Queue position #3. Waiting for staff assignment.' }
    ]
  },
  {
    id: 'OC-2025-0002',
    permitType: 'occupancy_permit',
    projectName: 'Santos Commercial Building',
    applicantName: 'Elena Santos',
    applicantPhone: '0918 222 8899',
    applicantEmail: 'elena.santos@commlink.ph',
    applicantAddress: 'McArthur Highway, Sto. Tomas, Pampanga',
    projectAddress: 'Brgy. San Vicente, Sto. Tomas, Pampanga',
    projectDescription: 'Requesting Occupancy Permit for a newly completed 3-storey commercial building with 6 spaces for rent.',
    status: 'approved',
    dateSubmitted: 'Apr 25, 2025',
    requirements: createMockRequirements('occupancy_permit', 6),
    location: {
      lat: 15.0195,
      lng: 120.7241,
      address: 'Brgy. San Vicente, Sto. Tomas, Pampanga',
      lotNo: '15-A',
      blockNo: '2'
    },
    trackingSteps: createStandardSteps('approved', 'Apr 25, 2025'),
    estimatedFees: 0,
    paymentStatus: 'paid',
    assignedStaff: 'Arch. Sofia Torres',
    historyLog: [
      { date: 'Apr 25, 2025, 11:00 AM', action: 'Application Submitted', actor: 'Elena Santos', details: 'Complete Certificate of Completion package received.' },
      { date: 'Apr 27, 2025, 01:30 PM', action: 'Document Verification', actor: 'Sofia Torres', details: 'FSIC and completion letters marked as Approved.' },
      { date: 'May 02, 2025, 04:00 PM', action: 'Site Inspection Conducted', actor: 'OBO Inspector Team', details: 'Building construction conforms to approved architectural plans.' },
      { date: 'May 05, 2025, 10:00 AM', action: 'Approved by Building Official', actor: 'Engr. Antonio V. Cruz', details: 'Final signature affixed to permit dossier.' }
    ]
  },
  {
    id: 'BP-2025-0004',
    permitType: 'building_permit',
    projectName: 'Garcia Residence',
    applicantName: 'Roberto Garcia',
    applicantPhone: '0920 555 1234',
    applicantEmail: 'roberto.garcia@gmail.com',
    applicantAddress: 'Brgy. Santo Rosario, Sto. Tomas, Pampanga',
    projectAddress: 'Lot 5, Brgy. Santo Rosario, Sto. Tomas, Pampanga',
    projectDescription: 'Proposed construction of a single-storey residential dwelling with small storefront.',
    status: 'under_review',
    dateSubmitted: 'Apr 20, 2025',
    requirements: createMockRequirements('building_permit', 5),
    location: {
      lat: 15.0101,
      lng: 120.7055,
      address: 'Brgy. Santo Rosario, Sto. Tomas, Pampanga',
      lotNo: '5',
      blockNo: 'N/A'
    },
    trackingSteps: createStandardSteps('under_review', 'Apr 20, 2025'),
    estimatedFees: 0,
    paymentStatus: 'paid',
    assignedStaff: 'Engr. Ricardo Mercado',
    historyLog: [
      { date: 'Apr 20, 2025, 08:12 AM', action: 'Application Submitted', actor: 'Roberto Garcia', details: 'Application submitted.' },
      { date: 'Apr 22, 2025, 09:00 AM', action: 'Review Started', actor: 'Ricardo Mercado', details: 'Document check passed. Plans routed for electrical evaluation.' }
    ]
  },
  {
    id: 'LC-2025-0002',
    permitType: 'locational_clearance',
    projectName: 'ABC Logistics Hub',
    applicantName: 'ABC Development Corp',
    applicantPhone: '0999 123 4567',
    applicantEmail: 'permit@abcdev.com.ph',
    applicantAddress: 'Clark Freeport Zone, Pampanga',
    projectAddress: 'Phase 1 Industrial Park, Brgy. San Matias, Sto. Tomas, Pampanga',
    projectDescription: 'Zoning clearance for a multi-hectare logistical distribution warehouse hub.',
    status: 'released',
    dateSubmitted: 'Apr 10, 2025',
    requirements: createMockRequirements('locational_clearance', 6),
    location: {
      lat: 15.0233,
      lng: 120.7109,
      address: 'Industrial Park, Brgy. San Matias, Sto. Tomas, Pampanga',
      lotNo: '1',
      blockNo: 'A'
    },
    trackingSteps: createStandardSteps('released', 'Apr 10, 2025'),
    estimatedFees: 0,
    paymentStatus: 'paid',
    assignedStaff: 'Zoning Officer Amara Santos',
    historyLog: [
      { date: 'Apr 10, 2025, 04:45 PM', action: 'Application Submitted', actor: 'ABC Dev Rep', details: 'Large scale zoning request submitted.' },
      { date: 'Apr 12, 2025, 10:00 AM', action: 'Zoning Assessment', actor: 'Amara Santos', details: 'Conforms to municipal Land Use Plan (Industrial Zone Cluster).' },
      { date: 'Apr 15, 2025, 01:10 PM', action: 'Clearance Endorsed', actor: 'OBO Chief', details: 'Zoning clearance certificate reviewed and endorsed.' },
      { date: 'Apr 18, 2025, 03:30 PM', action: 'Certificate Released', actor: 'Admin Assistant', details: 'Digital certificate issued. Physical copy picked up.' }
    ]
  },
  {
    id: 'BP-2025-0006',
    permitType: 'building_permit',
    projectName: 'Pampanga Cold Storage Facility',
    applicantName: 'Vanguard Agri-Cold Systems',
    applicantPhone: '0908 777 4321',
    applicantEmail: 'ops@vanguardcold.com',
    applicantAddress: 'San Fernando City, Pampanga',
    projectAddress: 'Brgy. San Matias, Sto. Tomas, Pampanga',
    projectDescription: 'Large industrial-grade agricultural cold storage facility to assist local farming cooperatives.',
    status: 'incomplete_requirements',
    dateSubmitted: 'May 14, 2025',
    requirements: [
      { name: 'Unified Building Permit Application Form', required: true, status: 'approved', fileName: 'form_signed.pdf' },
      { name: 'Proof of Ownership (TCT, Deed of Absolute Sale, or Lease Contract)', required: true, status: 'approved', fileName: 'tct_clean.pdf' },
      { name: 'Five (5) Sets of Architectural, Structural, Electrical, and Plumbing Plans', required: true, status: 'rejected', fileName: 'plans_draft.pdf', remarks: 'Missing professional stamp on Page S-3 Structural Cross Sections.' },
      { name: 'Bill of Materials and Detailed Cost Estimates', required: true, status: 'approved', fileName: 'bom_v2.pdf' },
      { name: 'Technical Specifications', required: true, status: 'pending' },
      { name: 'Structural Design Analysis and Computation (for 2 storeys and above)', required: true, status: 'pending' }
    ],
    location: {
      lat: 15.0211,
      lng: 120.7095,
      address: 'Brgy. San Matias, Sto. Tomas, Pampanga',
      lotNo: 'F-12',
      blockNo: 'Zone 4'
    },
    trackingSteps: [
      { title: 'Application Submitted', status: 'completed', date: 'May 14, 2025', notes: 'Initial submission uploaded.' },
      { title: 'Initial Document Verification', status: 'current', notes: 'Plans S-3 missing seal/stamp. Technical specifications not yet uploaded.' }
    ],
    estimatedFees: 0,
    paymentStatus: 'paid',
    assignedStaff: 'Engr. Ricardo Mercado',
    historyLog: [
      { date: 'May 14, 2025, 10:00 AM', action: 'Application Submitted', actor: 'Vanguard Agent', details: 'Documents uploaded.' },
      { date: 'May 16, 2025, 03:20 PM', action: 'Status Updated: Incomplete', actor: 'Engr. Ricardo Mercado', details: 'Notified applicant of missing seals on plans and missing technical spec files.' }
    ]
  }
];

export const INITIAL_SYSTEM_LOGS: SystemLog[] = [
  { id: 'LOG-001', timestamp: '2026-06-28 17:45:12', category: 'application', message: 'New Application submitted (BP-2025-0005) for "2-Storey Residence"', user: 'Juan Dela Cruz', status: 'success' },
  { id: 'LOG-002', timestamp: '2026-06-28 16:20:05', category: 'security', message: 'Staff login verified for Engr. Ricardo Mercado', user: 'Ricardo Mercado', status: 'info' },
  { id: 'LOG-003', timestamp: '2026-06-28 15:10:44', category: 'setting', message: 'Updated building permit standard plan compliance guidelines.', user: 'Admin System', status: 'warning' },
  { id: 'LOG-004', timestamp: '2026-06-28 12:05:30', category: 'application', message: 'Uploaded revised plan for Dela Cruz Warehouse', user: 'Juan Dela Cruz', status: 'success' },
  { id: 'LOG-005', timestamp: '2026-06-28 10:15:00', category: 'system', message: 'Daily automated backup of application files completed successfully', user: 'Cloud Backup Daemon', status: 'success' },
  { id: 'LOG-006', timestamp: '2026-06-28 09:00:22', category: 'security', message: 'Failed login attempt from IP 112.198.45.109', user: 'Unknown (Guest)', status: 'error' }
];

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
