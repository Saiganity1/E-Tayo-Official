export type PermitType = 'locational_clearance' | 'building_permit' | 'occupancy_permit';

export type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'incomplete_requirements'
  | 'approved'
  | 'released'
  | 'rejected';

export interface Requirement {
  name: string;
  required: boolean;
  status: 'pending' | 'approved' | 'rejected';
  fileName?: string;
  fileSize?: string;
  remarks?: string;
}

export interface TrackingStep {
  title: string;
  status: 'completed' | 'current' | 'upcoming';
  date?: string;
  notes?: string;
  actor?: string;
}

export interface LocationCoordinates {
  lat: number;
  lng: number;
  address: string;
  lotNo?: string;
  blockNo?: string;
}

export interface HistoryLog {
  date: string;
  action: string;
  actor: string;
  details: string;
}

export interface PermitApplication {
  id: string;
  permitType: PermitType;
  projectName: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  applicantAddress: string;
  projectAddress: string;
  projectDescription: string;
  status: ApplicationStatus;
  dateSubmitted: string;
  requirements: Requirement[];
  location: LocationCoordinates;
  trackingSteps: TrackingStep[];
  estimatedFees: number;
  paymentStatus: 'unpaid' | 'paid';
  assignedStaff?: string;
  historyLog: HistoryLog[];
  remarks?: string;
  locationalClearanceRef?: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  category: 'application' | 'security' | 'setting' | 'system';
  message: string;
  user: string;
  status: 'success' | 'warning' | 'info' | 'error';
}

export interface FeeStructure {
  id: string;
  name: string;
  baseAmount: number;
  multiplierName?: string;
  multiplierValue?: number;
  category: PermitType;
}

export type ViewFrame =
  | 'landing'
  | 'applicant_dashboard'
  | 'new_application'
  | 'tracking_details'
  | 'staff_dashboard'
  | 'admin_dashboard'
  | 'evaluate_project'
  | 'messages'
  | 'interactive_map';
