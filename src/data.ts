import {
  AlertTriangle,
  Bell,
  Building2,
  CalendarDays,
  ClipboardCheck,
  DollarSign,
  FileText,
  FolderKanban,
  Hammer,
  Home,
  Landmark,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  Users,
  Vote,
  Wrench
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Role =
  | 'super_admin'
  | 'portfolio_admin'
  | 'manager'
  | 'resident'
  | 'committee'
  | 'contractor';

export type TestAccount = {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  buildingId?: string;
};

export type Priority = 'Emergency' | 'High' | 'Medium' | 'Low';
export type Status = 'Open' | 'Due soon' | 'Overdue' | 'Draft' | 'Approved' | 'Closed' | 'In progress' | 'Scheduled' | 'Submitted';

export type Building = {
  id: string;
  name: string;
  address: string;
  suburb: string;
  lots: number;
  manager: string;
  satisfaction: number;
  complaints: number;
  maintenanceSpend: number;
  arrears: number;
  profit: number;
};

export type Person = {
  id: string;
  name: string;
  role: Role | 'owner' | 'tenant' | 'staff';
  buildingId: string;
  unit: string;
  email: string;
};

export type Notice = {
  id: string;
  title: string;
  category: string;
  buildingId: string;
  priority: Priority;
  audience: string;
  publishAt: string;
  channels: string[];
  reads: number;
  body: string;
  publicationStatus?: 'Draft' | 'Published';
};

export type MaintenanceRequest = {
  id: string;
  title: string;
  category: string;
  buildingId: string;
  unit: string;
  resident: string;
  contractorId?: string;
  priority: Priority;
  status: string;
  submitted: string;
  slaHours: number;
  overdue: boolean;
  access: string;
  description?: string;
  timeline?: string[];
};

export type BuildingDirectory = {
  buildingId: string;
  strataManager: string;
  buildingManager: string;
  concierge: string;
  emergencyContact: string;
  afterHoursContact: string;
  companyPhone: string;
  companyEmail: string;
};

export type BuildingFacility = {
  id: string;
  name: string;
  description: string;
  location: string;
  availability: string;
  maxBookingLength: string;
  advanceNotice: string;
  approvalRequired: boolean;
  feePlaceholder: string;
  capacity: number;
  rules: string;
  visibility: 'all residents' | 'owners only' | 'tenants allowed' | 'committee only';
  status: 'active' | 'inactive';
};

export type BuildingContact = {
  id: string;
  type: string;
  name: string;
  detail: string;
  visibility: 'all residents' | 'committee only' | 'managers only';
  status?: 'active' | 'inactive';
};

export type BuildingIssueCategory = {
  id: string;
  label: string;
  enabled: boolean;
  defaultPriority: Priority;
  defaultContractorId?: string;
};

export type BuildingRenovationRule = {
  id: string;
  type: string;
  enabled: boolean;
  requiredDocuments: string[];
  acknowledgements: string[];
  approvalPathway: string;
  committeeReviewRequired: boolean;
  noiseRules: string;
};

export type BuildingPackageSettings = {
  enabled: boolean;
  collectionLocation?: string;
  collectionHours?: string;
  idRequired?: boolean;
  notificationRules?: string;
};

export type BuildingComplianceRequirement = {
  id: string;
  category: string;
  enabled: boolean;
  frequency: string;
  responsible: string;
};

export type BuildingAssetConfig = {
  id: string;
  name: string;
  type: string;
  location: string;
  serviceFrequency: string;
  contractorId?: string;
};

export type BuildingResidentPermissions = {
  leviesVisibleTo: 'owners only' | 'owners and tenants';
  residentsCanPostFeed: boolean;
  tenantsCanBookFacilities: boolean;
  committeeDocumentsVisible: boolean;
};

export type BuildingConfiguration = {
  buildingId: string;
  profile: {
    name: string;
    buildingType: string;
    notes: string;
  };
  facilities: BuildingFacility[];
  contacts: BuildingContact[];
  issueCategories: BuildingIssueCategory[];
  renovationRules: BuildingRenovationRule[];
  packageManagement: BuildingPackageSettings;
  compliance: BuildingComplianceRequirement[];
  assets: BuildingAssetConfig[];
  residentPermissions: BuildingResidentPermissions;
  notificationRules: string[];
};

export type ReportIssue = {
  id: string;
  title: string;
  category: 'Maintenance' | 'Damage' | 'Security' | 'Noise' | 'Safety' | 'Other' | 'Water leak' | 'Lift issue' | 'Electrical' | 'Plumbing' | 'Cleaning' | 'Parking' | 'Common area damage' | 'Fire safety';
  severity: Priority;
  buildingId: string;
  unit: string;
  resident: string;
  outcome: 'Maintenance request' | 'Incident' | 'Maintenance request + incident';
  status: string;
  submitted: string;
};

export type LevyRecord = {
  id: string;
  buildingId: string;
  lot: string;
  owner: string;
  currentBalance: number;
  outstandingAmount: number;
  nextDueDate: string;
  latestNotice: string;
  lastPaymentDate: string;
  lastPaymentAmount: number;
  reminderStatus: 'Not required' | 'Scheduled' | 'Sent' | 'Escalated';
  status: 'Current' | 'Overdue' | 'Paid';
};

export type Contractor = {
  id: string;
  company: string;
  contact: string;
  trade: string;
  email: string;
  phone: string;
  licence: string;
  insuranceExpiry: string;
  response: string;
  completed: number;
  rating: number;
  serviceAreas: string[];
  notes?: string;
  status?: 'Active' | 'Inactive';
};

export type Project = {
  id: string;
  title: string;
  buildingId: string;
  budget: number;
  spend: number;
  contractorId: string;
  progress: number;
  status: Status;
  risk: string;
  nextMilestone: string;
};

export type SimpleRecord = {
  id: string;
  title: string;
  buildingId: string;
  owner: string;
  status: Status | string;
  priority?: Priority;
  due?: string;
  meta?: string;
  amount?: number;
  href?: string;
  createdBy?: string;
  senderId?: string;
  recipientId?: string;
  recipientEmail?: string;
  senderRole?: Role;
  recipientRole?: Role;
  unit?: string;
  startsAt?: string;
  endsAt?: string;
  guests?: number;
};

export type ConversationParticipant = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  buildingId: string;
  unit?: string;
  detail?: string;
};

export type NavItem = {
  id: PageId;
  label: string;
  icon: LucideIcon;
  roles: Role[];
};

export type PageId =
  | 'public'
  | 'portfolio'
  | 'buildings'
  | 'building'
  | 'resident'
  | 'committee'
  | 'motions'
  | 'quotes'
  | 'meetings'
  | 'contractor'
  | 'staff_performance'
  | 'contractor_performance'
  | 'arrears_overview'
  | 'compliance_risk'
  | 'reports'
  | 'communications'
  | 'report_issue'
  | 'maintenance'
  | 'projects'
  | 'incidents'
  | 'compliance'
  | 'building_settings'
  | 'documents'
  | 'facilities'
  | 'renovations'
  | 'packages'
  | 'my_levies'
  | 'levy_management'
  | 'my_requests'
  | 'messages'
  | 'directory'
  | 'settings'
  | 'users'
  | 'audit';

export const roleLabels: Record<Role, string> = {
  super_admin: 'Platform Super Admin',
  portfolio_admin: 'Company Owner',
  manager: 'Strata Manager',
  resident: 'Resident',
  committee: 'Committee Member',
  contractor: 'Contractor'
};

export const testAccounts: TestAccount[] = [
  { id: 'ta2', name: 'Amelia Hart', email: 'owner@northshorestrata.com.au', role: 'portfolio_admin', title: 'Company Owner' },
  { id: 'ta3', name: 'Noah Haddad', email: 'manager@northshorestrata.com.au', role: 'manager', title: 'Strata Manager', buildingId: 'b1' },
  { id: 'ta4', name: 'Sienna Nguyen', email: 'resident@example.com', role: 'resident', title: 'Owner occupier', buildingId: 'b1' },
  { id: 'ta5', name: 'Oliver Taylor', email: 'committee@example.com', role: 'committee', title: 'Committee Secretary', buildingId: 'b1' },
  { id: 'ta6', name: 'Harvey Price', email: 'contractor@liftcare.com.au', role: 'contractor', title: 'LiftCare NSW Contractor', buildingId: 'b1' }
];

export const roleBuildingScope: Record<Role, string[]> = {
  super_admin: ['b1'],
  portfolio_admin: ['b1'],
  manager: ['b1'],
  resident: ['b1'],
  committee: ['b1'],
  contractor: ['b1']
};

export const rolePermissions: Record<Role, {
  scope: string;
  canSeeBuildings: 'all-tenants' | 'company' | 'assigned' | 'own' | 'assigned-jobs';
  canSeeFinancials: 'platform' | 'portfolio-summary' | 'own-lot' | 'none';
  canManage: string[];
}> = {
  super_admin: {
    scope: 'All tenant companies',
    canSeeBuildings: 'all-tenants',
    canSeeFinancials: 'platform',
    canManage: ['companies', 'usage metrics', 'system reports']
  },
  portfolio_admin: {
    scope: 'Atlas Residences',
    canSeeBuildings: 'company',
    canSeeFinancials: 'portfolio-summary',
    canManage: ['messages', 'notices', 'documents', 'maintenance', 'facility bookings']
  },
  manager: {
    scope: 'Atlas Residences only',
    canSeeBuildings: 'assigned',
    canSeeFinancials: 'none',
    canManage: ['issues', 'work orders', 'notices', 'documents', 'facility bookings', 'messages']
  },
  resident: {
    scope: 'Atlas Residences, Lot 1A only',
    canSeeBuildings: 'own',
    canSeeFinancials: 'own-lot',
    canManage: ['own issues', 'own bookings', 'own messages']
  },
  committee: {
    scope: 'Atlas Residences, Lot 1A + Committee',
    canSeeBuildings: 'own',
    canSeeFinancials: 'none',
    canManage: ['motions', 'votes', 'committee documents', 'quotes']
  },
  contractor: {
    scope: 'Assigned LiftCare NSW jobs only',
    canSeeBuildings: 'assigned-jobs',
    canSeeFinancials: 'none',
    canManage: ['assigned jobs', 'job updates', 'job documents']
  }
};

export const buildings: Building[] = [
  {
    id: 'b1',
    name: 'Atlas Residences',
    address: '100 Test Street, Sydney NSW',
    suburb: 'Sydney',
    lots: 100,
    manager: 'Noah Haddad',
    satisfaction: 0,
    complaints: 0,
    maintenanceSpend: 0,
    arrears: 0,
    profit: 0
  }
];

const defaultIssueCategories: BuildingIssueCategory[] = [
  { id: 'water-leak', label: 'Water leak', enabled: true, defaultPriority: 'High', defaultContractorId: 'c1' },
  { id: 'lift-issue', label: 'Lift issue', enabled: true, defaultPriority: 'High', defaultContractorId: 'c3' },
  { id: 'electrical', label: 'Electrical', enabled: true, defaultPriority: 'Medium', defaultContractorId: 'c2' },
  { id: 'plumbing', label: 'Plumbing', enabled: true, defaultPriority: 'High', defaultContractorId: 'c1' },
  { id: 'security', label: 'Security', enabled: true, defaultPriority: 'Medium', defaultContractorId: 'c6' },
  { id: 'noise', label: 'Noise', enabled: true, defaultPriority: 'Medium' },
  { id: 'cleaning', label: 'Cleaning', enabled: true, defaultPriority: 'Low' },
  { id: 'parking', label: 'Parking', enabled: true, defaultPriority: 'Low' },
  { id: 'common-damage', label: 'Common area damage', enabled: true, defaultPriority: 'Medium' },
  { id: 'fire-safety', label: 'Fire safety', enabled: true, defaultPriority: 'Emergency', defaultContractorId: 'c4' },
  { id: 'other', label: 'Other', enabled: true, defaultPriority: 'Medium' }
];

const defaultRenovationRules: BuildingRenovationRule[] = [
  { id: 'bathroom', type: 'Bathroom renovation', enabled: true, requiredDocuments: ['Scope of works', 'Waterproofing certificate', 'Contractor insurance'], acknowledgements: ['By-law acknowledgement', 'Noise rules'], approvalPathway: 'Manager then committee', committeeReviewRequired: true, noiseRules: 'No noisy works outside approved hours.' },
  { id: 'kitchen', type: 'Kitchen renovation', enabled: true, requiredDocuments: ['Plans', 'Contractor insurance'], acknowledgements: ['By-law acknowledgement'], approvalPathway: 'Manager review', committeeReviewRequired: false, noiseRules: 'Noisy works weekdays only.' },
  { id: 'flooring', type: 'Flooring', enabled: true, requiredDocuments: ['Acoustic certificate', 'Product specification'], acknowledgements: ['Acoustic by-law acknowledgement'], approvalPathway: 'Committee review', committeeReviewRequired: true, noiseRules: 'Acoustic underlay required.' },
  { id: 'ev-charger', type: 'EV charger', enabled: true, requiredDocuments: ['Electrical plan', 'Licensed electrician details'], acknowledgements: ['Common property alteration acknowledgement'], approvalPathway: 'Committee review', committeeReviewRequired: true, noiseRules: 'Electrical isolation notice may be required.' },
  { id: 'other-reno', type: 'Other', enabled: true, requiredDocuments: ['Scope of works'], acknowledgements: ['By-law acknowledgement'], approvalPathway: 'Manager review', committeeReviewRequired: false, noiseRules: 'Standard strata noise rules apply.' }
];

export const buildingConfigurations: BuildingConfiguration[] = [
  {
    buildingId: 'b1',
    profile: { name: 'Atlas Residences', buildingType: 'High-rise residential with concierge', notes: 'Lifts, rooftop, BBQ and package collection enabled.' },
    facilities: [
      { id: 'b1-bbq', name: 'BBQ area', description: 'Resident BBQ area with harbour outlook.', location: 'Level 8 rooftop', availability: 'Mon-Sun 8am-9pm', maxBookingLength: '3 hours', advanceNotice: '24 hours', approvalRequired: true, feePlaceholder: '$150 deposit', capacity: 20, rules: 'Clean area after use. No glass on rooftop.', visibility: 'all residents', status: 'active' },
      { id: 'b1-rooftop', name: 'Rooftop', description: 'Shared rooftop terrace.', location: 'Level 8', availability: 'Mon-Sun 7am-10pm', maxBookingLength: '2 hours', advanceNotice: '24 hours', approvalRequired: true, feePlaceholder: 'No fee', capacity: 40, rules: 'Noise restrictions after 9pm.', visibility: 'all residents', status: 'active' },
      { id: 'b1-parking', name: 'Visitor parking', description: 'Short-stay visitor bay.', location: 'Basement B1', availability: 'Mon-Sun', maxBookingLength: '8 hours', advanceNotice: '12 hours', approvalRequired: false, feePlaceholder: 'No fee', capacity: 1, rules: 'Display booking confirmation.', visibility: 'all residents', status: 'active' }
    ],
    contacts: [
      { id: 'b1-sm', type: 'Strata manager', name: 'Amelia Hart', detail: 'amelia@northshorestrata.com.au', visibility: 'all residents' },
      { id: 'b1-bm', type: 'Building manager', name: 'Marcus Lee', detail: '02 9055 0188', visibility: 'all residents' },
      { id: 'b1-concierge', type: 'Concierge', name: 'Harbourline concierge desk', detail: 'Lobby desk, 7am-7pm', visibility: 'all residents' },
      { id: 'b1-lift', type: 'Lift company', name: 'LiftCare NSW', detail: 'contractor@liftcare.com.au', visibility: 'all residents' },
      { id: 'b1-fire', type: 'Fire contractor', name: 'FireSafe Compliance', detail: 'bookings@firesafecompliance.com.au', visibility: 'all residents' }
    ],
    issueCategories: defaultIssueCategories,
    renovationRules: defaultRenovationRules,
    packageManagement: { enabled: true, collectionLocation: 'Concierge desk', collectionHours: '7am-7pm weekdays', idRequired: true, notificationRules: 'In-app notification when package is logged.' },
    compliance: [
      { id: 'b1-fire', category: 'Fire safety', enabled: true, frequency: 'Annual', responsible: 'FireSafe Compliance' },
      { id: 'b1-afss', category: 'AFSS', enabled: true, frequency: 'Annual', responsible: 'Strata manager' },
      { id: 'b1-lift', category: 'Lift servicing', enabled: true, frequency: 'Monthly', responsible: 'LiftCare NSW' },
      { id: 'b1-insurance', category: 'Insurance', enabled: true, frequency: 'Annual', responsible: 'Portfolio admin' }
    ],
    assets: [
      { id: 'b1-lift1', name: 'Lift 1', type: 'Lift', location: 'Core A', serviceFrequency: 'Monthly', contractorId: 'c3' },
      { id: 'b1-fire-panel', name: 'Fire panel', type: 'Fire panel', location: 'Ground floor lobby', serviceFrequency: 'Quarterly', contractorId: 'c4' },
      { id: 'b1-intercom', name: 'Intercom', type: 'Intercom', location: 'Front entry', serviceFrequency: 'Annual', contractorId: 'c6' }
    ],
    residentPermissions: { leviesVisibleTo: 'owners only', residentsCanPostFeed: false, tenantsCanBookFacilities: true, committeeDocumentsVisible: false },
    notificationRules: ['Notices: residents in building only', 'Facilities: booking resident and manager only', 'Packages: resident recipient only']
  },
  {
    buildingId: 'b2',
    profile: { name: 'Glebe Foundry', buildingType: 'Converted warehouse', notes: 'No package collection, no pool, loading dock and lift move bookings only.' },
    facilities: [
      { id: 'b2-loading', name: 'Loading dock', description: 'Loading dock for moves and deliveries.', location: 'Rear laneway', availability: 'Mon-Fri 8am-4pm', maxBookingLength: '2 hours', advanceNotice: '48 hours', approvalRequired: true, feePlaceholder: 'No fee', capacity: 1, rules: 'Traffic management may be required.', visibility: 'all residents', status: 'active' },
      { id: 'b2-lift-move', name: 'Lift move booking', description: 'Goods lift reservation.', location: 'Goods lift', availability: 'Mon-Fri 9am-3pm', maxBookingLength: '4 hours', advanceNotice: '72 hours', approvalRequired: true, feePlaceholder: '$300 bond', capacity: 1, rules: 'Lift blanket required.', visibility: 'all residents', status: 'active' }
    ],
    contacts: [
      { id: 'b2-sm', type: 'Strata manager', name: 'Noah Haddad', detail: 'manager@northshorestrata.com.au', visibility: 'all residents' },
      { id: 'b2-cleaner', type: 'Cleaner', name: 'Inner West Cleaning Co.', detail: 'cleaning desk via manager', visibility: 'all residents' },
      { id: 'b2-electrician', type: 'Electrician', name: 'SparkPro Electrical', detail: 'Through strata manager', visibility: 'all residents' }
    ],
    issueCategories: defaultIssueCategories.map((item) => item.id === 'lift-issue' ? { ...item, label: 'Goods lift issue', enabled: true } : item.id === 'fire-safety' ? item : item),
    renovationRules: defaultRenovationRules.filter((rule) => rule.id !== 'ev-charger'),
    packageManagement: { enabled: false },
    compliance: [
      { id: 'b2-fire', category: 'Fire safety', enabled: true, frequency: 'Annual', responsible: 'FireSafe Compliance' },
      { id: 'b2-insurance', category: 'Insurance', enabled: true, frequency: 'Annual', responsible: 'Portfolio admin' },
      { id: 'b2-whs', category: 'WHS', enabled: true, frequency: 'Annual', responsible: 'Strata manager' }
    ],
    assets: [
      { id: 'b2-goods-lift', name: 'Goods lift', type: 'Lift', location: 'Rear entry', serviceFrequency: 'Monthly', contractorId: 'c3' },
      { id: 'b2-gate', name: 'Vehicle gate', type: 'Gates', location: 'Rear laneway', serviceFrequency: 'Quarterly', contractorId: 'c6' }
    ],
    residentPermissions: { leviesVisibleTo: 'owners only', residentsCanPostFeed: false, tenantsCanBookFacilities: true, committeeDocumentsVisible: false },
    notificationRules: ['No package notifications', 'Loading dock bookings require approval']
  },
  {
    buildingId: 'b3',
    profile: { name: 'Bondi Pavilion Towers', buildingType: 'Beachside apartments', notes: 'Pool, gym, concierge and strict renovation controls.' },
    facilities: [
      { id: 'b3-pool', name: 'Pool', description: 'Outdoor resident pool.', location: 'Level 2 podium', availability: 'Mon-Sun 6am-9pm', maxBookingLength: 'Not bookable', advanceNotice: 'None', approvalRequired: false, feePlaceholder: 'No fee', capacity: 30, rules: 'Pool rules apply. Children supervised.', visibility: 'all residents', status: 'active' },
      { id: 'b3-gym', name: 'Gym', description: 'Resident gym session booking.', location: 'Level 1', availability: 'Mon-Sun 5am-10pm', maxBookingLength: '90 minutes', advanceNotice: '2 hours', approvalRequired: false, feePlaceholder: 'No fee', capacity: 8, rules: 'Wipe equipment after use.', visibility: 'all residents', status: 'active' }
    ],
    contacts: [
      { id: 'b3-sm', type: 'Strata manager', name: 'Priya Menon', detail: 'priya@northshorestrata.com.au', visibility: 'all residents' },
      { id: 'b3-concierge', type: 'Concierge', name: 'Bondi Pavilion front desk', detail: '6am-10pm', visibility: 'all residents' },
      { id: 'b3-insurance', type: 'Insurance contact', name: 'Harbour Mutual', detail: 'Claims via strata manager', visibility: 'committee only' }
    ],
    issueCategories: defaultIssueCategories,
    renovationRules: defaultRenovationRules.map((rule) => ({ ...rule, committeeReviewRequired: true, approvalPathway: 'Manager then committee review' })),
    packageManagement: { enabled: true, collectionLocation: 'Concierge room', collectionHours: '6am-10pm', idRequired: true, notificationRules: 'In-app notification plus concierge reminder.' },
    compliance: [
      { id: 'b3-pool', category: 'Pool compliance', enabled: true, frequency: 'Annual', responsible: 'Building manager' },
      { id: 'b3-lift', category: 'Lift servicing', enabled: true, frequency: 'Monthly', responsible: 'LiftCare NSW' },
      { id: 'b3-fire', category: 'Fire safety', enabled: true, frequency: 'Annual', responsible: 'FireSafe Compliance' }
    ],
    assets: [
      { id: 'b3-pool-asset', name: 'Pool filtration', type: 'Pool', location: 'Plant room', serviceFrequency: 'Monthly' },
      { id: 'b3-gym-asset', name: 'Gym HVAC', type: 'Gym', location: 'Level 1', serviceFrequency: 'Quarterly' },
      { id: 'b3-lift', name: 'Lift bank', type: 'Lift', location: 'Main core', serviceFrequency: 'Monthly', contractorId: 'c3' }
    ],
    residentPermissions: { leviesVisibleTo: 'owners only', residentsCanPostFeed: false, tenantsCanBookFacilities: true, committeeDocumentsVisible: false },
    notificationRules: ['Strict renovation notifications', 'Pool/gym notices only for Bondi residents']
  }
];

export function getBuildingConfig(buildingId = 'b1') {
  return buildingConfigurations.find((config) => config.buildingId === buildingId) ?? buildingConfigurations[0];
}

const firstNames = ['Sienna', 'Oliver', 'Mia', 'Thomas', 'Ava', 'Ethan', 'Zara', 'Jack', 'Chloe', 'Liam', 'Grace', 'Hugo', 'Layla', 'Noah', 'Ruby', 'Mason', 'Isla', 'Lucas', 'Sofia', 'Henry'];
const lastNames = ['Nguyen', 'Taylor', 'Singh', 'Wilson', 'Khan', 'Brown', 'Patel', 'Harris', 'Kim', 'Owen', 'Ali', 'Martin', 'Chen', 'Walker', 'Ibrahim', 'Davis', 'Costa', 'Murphy', 'Sharma', 'Ryan'];

export const people: Person[] = Array.from({ length: 80 }, (_, index) => {
  const building = buildings[index % buildings.length];
  const owner = index % 3 !== 0;
  return {
    id: `u${index + 1}`,
    name: `${firstNames[index % firstNames.length]} ${lastNames[(index * 3) % lastNames.length]}`,
    role: owner ? 'owner' : 'tenant',
    buildingId: building.id,
    unit: `${Math.floor(index / 4) + 1}${String.fromCharCode(65 + (index % 4))}`,
    email: `resident${index + 1}@example.com`
  };
});

export const committeeMembers = people.slice(0, 8).map((person) => ({ ...person, role: 'committee' as const }));

export const staff: Person[] = [
  { id: 's1', name: 'Amelia Hart', role: 'staff', buildingId: 'b1', unit: 'HQ', email: 'amelia@northshorestrata.com.au' },
  { id: 's2', name: 'Noah Haddad', role: 'staff', buildingId: 'b2', unit: 'HQ', email: 'noah@northshorestrata.com.au' },
  { id: 's3', name: 'Priya Menon', role: 'staff', buildingId: 'b3', unit: 'HQ', email: 'priya@northshorestrata.com.au' },
  { id: 's4', name: 'Luca Romano', role: 'staff', buildingId: 'b4', unit: 'HQ', email: 'luca@northshorestrata.com.au' }
];

export const contractors: Contractor[] = [
  { id: 'c1', company: 'Summit Plumbing Group', contact: 'Ben Oakes', trade: 'Plumbing', email: 'jobs@summitplumbing.com.au', phone: '02 8123 4401', licence: 'NSW-PL-18422C', insuranceExpiry: '2026-08-18', response: '1h 24m', completed: 142, rating: 4.8, serviceAreas: ['Sydney CBD', 'Inner West'] },
  { id: 'c2', company: 'Blue Gum Electrical', contact: 'Maya Gill', trade: 'Electrical', email: 'service@bluegumelec.com.au', phone: '02 9188 2214', licence: 'NSW-EL-77219', insuranceExpiry: '2026-07-02', response: '2h 10m', completed: 98, rating: 4.6, serviceAreas: ['Eastern Suburbs', 'Parramatta'] },
  { id: 'c3', company: 'LiftCare NSW', contact: 'Harvey Price', trade: 'Lift servicing', email: 'support@liftcare.com.au', phone: '02 8077 6190', licence: 'LIFT-5512', insuranceExpiry: '2026-06-22', response: '45m', completed: 231, rating: 4.7, serviceAreas: ['Greater Sydney'] },
  { id: 'c4', company: 'FireSafe Compliance', contact: 'Natalie Wu', trade: 'Fire safety', email: 'bookings@firesafecompliance.com.au', phone: '02 8099 7500', licence: 'FPAS-FS-9012', insuranceExpiry: '2026-09-15', response: '3h 05m', completed: 188, rating: 4.9, serviceAreas: ['Greater Sydney'] },
  { id: 'c5', company: 'Coastal Waterproofing', contact: 'Samir Haddad', trade: 'Waterproofing', email: 'quotes@coastalwaterproofing.com.au', phone: '02 9055 1130', licence: 'BLD-332880C', insuranceExpiry: '2026-06-17', response: '4h 20m', completed: 66, rating: 4.4, serviceAreas: ['Eastern Suburbs', 'Northern Beaches'] },
  { id: 'c6', company: 'Secure Entry Systems', contact: 'Georgia Mills', trade: 'Access control', email: 'hello@secureentrysystems.com.au', phone: '02 8033 2800', licence: 'SEC-43821', insuranceExpiry: '2026-11-03', response: '1h 55m', completed: 74, rating: 4.5, serviceAreas: ['Sydney CBD', 'Parramatta'] }
];

const maintenanceTitles = [
  'Water leak in car park level B2',
  'Lift 2 intermittent fault',
  'Intercom not opening front gate',
  'Noise complaint from rooftop plant',
  'Common hallway light outage',
  'Pool gate not self-closing',
  'Visitor parking boom gate stuck',
  'Ceiling stain near lobby',
  'Fire stair door closer broken',
  'Gym air conditioning fault'
];
const maintenanceStatuses = ['Submitted', 'Under Review', 'Quote Requested', 'Approved', 'Assigned', 'Scheduled', 'In Progress', 'Completed', 'Closed', 'Rejected'];

export const maintenanceRequests: MaintenanceRequest[] = Array.from({ length: 20 }, (_, index) => {
  const building = buildings[index % buildings.length];
  const resident = people[index * 2];
  return {
    id: `mr${index + 1}`,
    title: maintenanceTitles[index % maintenanceTitles.length],
    category: ['Plumbing', 'Lifts', 'Security', 'Noise', 'Electrical'][index % 5],
    buildingId: building.id,
    unit: resident.unit,
    resident: resident.name,
    contractorId: contractors[index % contractors.length].id,
    priority: (['Emergency', 'High', 'Medium', 'Low'] as Priority[])[index % 4],
    status: maintenanceStatuses[index % maintenanceStatuses.length],
    submitted: `2026-05-${String(10 + index).padStart(2, '0')}`,
    slaHours: [4, 12, 48, 96][index % 4],
    overdue: index % 6 === 0,
    access: index % 2 === 0 ? 'Permission granted, weekdays 9am-3pm' : 'Resident appointment required'
  };
});

export const notices: Notice[] = [
  'Lift maintenance window confirmed',
  'Water shutdown for stack repairs',
  'AFSS inspection access notice',
  'AGM reminder and proxy forms',
  'Rooftop BBQ reopening',
  'Emergency lobby glass repair',
  'Painting works level 7',
  'Courier package collection update',
  'Noise warning for waterproofing works',
  'Fire panel test schedule',
  'Community garden working bee',
  'Visitor parking rule update'
].map((title, index) => ({
  id: `n${index + 1}`,
  title,
  category: ['Maintenance update', 'Water shutdown', 'Fire inspection', 'AGM reminder', 'Community event', 'Emergency alert'][index % 6],
  buildingId: buildings[index % buildings.length].id,
  priority: (['Medium', 'High', 'Low', 'Low', 'Emergency'] as Priority[])[index % 5],
  audience: ['All residents', 'Owners only', 'Tenants only', 'Committee only', 'Level 7 residents'][index % 5],
  publishAt: `2026-06-${String(5 + index).padStart(2, '0')} 09:00`,
  channels: notificationChannels((['Medium', 'High', 'Low', 'Low', 'Emergency'] as Priority[])[index % 5]),
  reads: 42 + index * 7,
  body: 'Building managers have scheduled this update with clear access, noise and safety instructions for residents.'
}));

export const buildingDirectories: BuildingDirectory[] = buildings.map((building, index) => ({
  buildingId: building.id,
  strataManager: building.manager,
  buildingManager: ['Marcus Lee', 'Elena Romano', 'Sarah McKenzie', 'Daniel Park'][index],
  concierge: ['Harbourline concierge desk', 'Glebe Foundry caretaker', 'Bondi Pavilion front desk', 'Parramatta Quarter concierge'][index],
  emergencyContact: '000 for life-threatening emergencies',
  afterHoursContact: 'Northshore after-hours line: 1300 778 228',
  companyPhone: '02 9055 0188',
  companyEmail: 'support@northshorestrata.com.au'
}));

export const reportIssues: ReportIssue[] = [
  { id: 'ri1', title: 'Water entering storage cage', category: 'Maintenance', severity: 'High', buildingId: 'b1', unit: '4A', resident: 'Sienna Nguyen', outcome: 'Maintenance request + incident', status: 'Triage', submitted: '2026-06-05' },
  { id: 'ri2', title: 'Broken glass near lobby door', category: 'Damage', severity: 'High', buildingId: 'b1', unit: '7C', resident: 'Oliver Taylor', outcome: 'Incident', status: 'Manager review', submitted: '2026-06-05' },
  { id: 'ri3', title: 'Repeated rooftop noise after 10pm', category: 'Noise', severity: 'Medium', buildingId: 'b2', unit: '11B', resident: 'Mia Singh', outcome: 'Incident', status: 'Open', submitted: '2026-06-04' },
  { id: 'ri4', title: 'Garage gate remote not working', category: 'Security', severity: 'Medium', buildingId: 'b3', unit: '9D', resident: 'Thomas Wilson', outcome: 'Maintenance request', status: 'Assigned', submitted: '2026-06-03' },
  { id: 'ri5', title: 'Trip hazard on fire stair landing', category: 'Safety', severity: 'Emergency', buildingId: 'b4', unit: '2A', resident: 'Ava Khan', outcome: 'Maintenance request + incident', status: 'Emergency response', submitted: '2026-06-05' }
];

export const projects: Project[] = [
  { id: 'p1', title: 'Balcony waterproofing remediation', buildingId: 'b3', budget: 680000, spend: 214000, contractorId: 'c5', progress: 38, status: 'In progress', risk: 'Weather delays', nextMilestone: 'Level 6 membrane inspection' },
  { id: 'p2', title: 'Lift modernisation stage 1', buildingId: 'b1', budget: 940000, spend: 490000, contractorId: 'c3', progress: 57, status: 'In progress', risk: 'Resident access disruption', nextMilestone: 'Commission Lift 1' },
  { id: 'p3', title: 'Fire panel and EWIS upgrade', buildingId: 'b4', budget: 420000, spend: 82000, contractorId: 'c4', progress: 22, status: 'Scheduled', risk: 'AFSS dependency', nextMilestone: 'Committee quote approval' },
  { id: 'p4', title: 'Facade painting program', buildingId: 'b2', budget: 360000, spend: 176000, contractorId: 'c5', progress: 49, status: 'In progress', risk: 'Scaffold permit', nextMilestone: 'North elevation handover' },
  { id: 'p5', title: 'Access control replacement', buildingId: 'b4', budget: 145000, spend: 31500, contractorId: 'c6', progress: 18, status: 'Approved', risk: 'Device lead times', nextMilestone: 'Resident fob audit' }
];

export const incidents: SimpleRecord[] = [
  { id: 'i1', title: 'Basement water ingress after storm', buildingId: 'b1', owner: 'Amelia Hart', status: 'Open', priority: 'High', due: '2026-06-08', meta: 'Insurance claim pending' },
  { id: 'i2', title: 'Security tailgating complaint', buildingId: 'b4', owner: 'Luca Romano', status: 'In progress', priority: 'Medium', due: '2026-06-11', meta: 'CCTV reviewed' },
  { id: 'i3', title: 'Fire stair trip hazard', buildingId: 'b2', owner: 'Noah Haddad', status: 'Open', priority: 'High', due: '2026-06-07', meta: 'Linked work order WO-18' },
  { id: 'i4', title: 'Common property glass damage', buildingId: 'b3', owner: 'Priya Menon', status: 'Closed', priority: 'Low', due: '2026-05-30', meta: 'Recovered from owner insurance' }
];

export const complianceItems: SimpleRecord[] = [
  'AFSS lodgement', 'Lift service certificate', 'Insurance renewal', 'WHS risk review', 'Pool safety certificate',
  'Asbestos register review', 'Emergency evacuation plan', 'Fire door inspection', 'Contractor insurance check', 'Strata Hub annual report'
].map((title, index) => ({
  id: `co${index + 1}`,
  title,
  buildingId: buildings[index % buildings.length].id,
  owner: staff[index % staff.length].name,
  status: index % 4 === 0 ? 'Overdue' : index % 3 === 0 ? 'Due soon' : 'Open',
  priority: index % 4 === 0 ? 'High' : 'Medium',
  due: `2026-06-${String(7 + index * 2).padStart(2, '0')}`,
  meta: ['Fire safety', 'Essential services', 'Insurance', 'WHS'][index % 4]
}));

export const documents: SimpleRecord[] = [
  '2026 levy notice Q3', 'Capital works plan 2026-2036', 'Building insurance certificate', 'AGM agenda and proxy form',
  'By-laws consolidated register', 'Fire safety statement', 'Contractor insurance pack', 'Renovation approval lot 706',
  'Committee minutes May', 'Budget report FY26'
].map((title, index) => ({
  id: `d${index + 1}`,
  title,
  buildingId: buildings[index % buildings.length].id,
  owner: staff[index % staff.length].name,
  status: index % 3 === 0 ? 'Committee only' : 'Visible',
  due: `2026-05-${String(12 + index).padStart(2, '0')}`,
  meta: ['Levies', 'Financial reports', 'Insurance', 'Meetings', 'By-laws'][index % 5]
}));

export const levies: LevyRecord[] = people.slice(0, 16).map((person, index) => ({
  id: `l${index + 1}`,
  buildingId: person.buildingId,
  lot: person.unit,
  owner: person.name,
  currentBalance: index === 0 ? 1420 : 680 + index * 115,
  outstandingAmount: index % 3 === 0 ? 680 + index * 90 : 0,
  nextDueDate: `2026-07-${String(1 + (index % 12)).padStart(2, '0')}`,
  latestNotice: `levy-notice-${person.unit.toLowerCase()}-q3-2026.pdf`,
  lastPaymentDate: `2026-05-${String(4 + (index % 18)).padStart(2, '0')}`,
  lastPaymentAmount: 820 + index * 40,
  reminderStatus: index % 6 === 0 ? 'Escalated' : index % 3 === 0 ? 'Sent' : index % 2 === 0 ? 'Scheduled' : 'Not required',
  status: index % 3 === 0 ? 'Overdue' : index % 4 === 0 ? 'Paid' : 'Current'
}));

export const renovations: SimpleRecord[] = [
  { id: 'r1', title: 'Kitchen renovation lot 12B', buildingId: 'b1', owner: 'Sienna Nguyen', status: 'Committee Review', due: '2026-06-14', meta: 'Plans and builder insurance uploaded' },
  { id: 'r2', title: 'Bathroom waterproofing lot 6A', buildingId: 'b3', owner: 'Zara Patel', status: 'Manager Review', due: '2026-06-09', meta: 'Noise impact acknowledged' },
  { id: 'r3', title: 'Flooring replacement lot 19C', buildingId: 'b4', owner: 'Ruby Ibrahim', status: 'More Info Required', due: '2026-06-20', meta: 'Acoustic certificate requested' }
];

export const meetings: SimpleRecord[] = [
  { id: 'm1', title: 'Annual General Meeting', buildingId: 'b1', owner: 'Amelia Hart', status: 'Scheduled', due: '2026-06-24 18:00', meta: 'Hybrid meeting with proxy voting' },
  { id: 'm2', title: 'Committee meeting - facade works', buildingId: 'b2', owner: 'Noah Haddad', status: 'Scheduled', due: '2026-06-12 17:30', meta: 'Three motions ready' },
  { id: 'm3', title: 'Resident information session', buildingId: 'b3', owner: 'Priya Menon', status: 'Scheduled', due: '2026-06-18 19:00', meta: 'Waterproofing update' }
];

export const facilityBookings: SimpleRecord[] = [
  'Rooftop BBQ booking', 'Visitor parking bay 3', 'Lift move booking', 'Function room booking', 'Loading dock access', 'Gym induction'
].map((title, index) => ({
  id: `fb${index + 1}`,
  title,
  buildingId: buildings[index % buildings.length].id,
  owner: people[index].name,
  status: index % 3 === 0 ? 'Approved' : 'Submitted',
  due: `2026-06-${String(8 + index).padStart(2, '0')}`,
  meta: index % 2 === 0 ? 'Deposit required' : 'Manager approval required'
}));

export const packages: SimpleRecord[] = [
  'Australia Post satchel', 'DHL medium parcel', 'Toll fragile delivery', 'Amazon locker overflow', 'StarTrack document tube'
].map((title, index) => ({
  id: `pkg${index + 1}`,
  title,
  buildingId: buildings[index % buildings.length].id,
  owner: index === 0 ? 'Sienna Nguyen' : people[index + 5].name,
  status: index % 2 === 0 ? 'Awaiting collection' : 'Collected',
  due: `2026-06-${String(5 + index).padStart(2, '0')}`,
  meta: 'Notification sent'
}));

export const messages: SimpleRecord[] = [
  { id: 'msg1', title: 'My question about lift repair', buildingId: 'b1', owner: 'Sienna Nguyen', status: 'Unread', due: '2026-06-05', meta: 'Linked to MR-2' },
  { id: 'msg2', title: 'Committee discussion: waterproofing quote', buildingId: 'b3', owner: 'Committee', status: 'Open', due: '2026-06-06', meta: '2 unread replies' },
  { id: 'msg3', title: 'Contractor job update', buildingId: 'b4', owner: 'Secure Entry Systems', status: 'Open', due: '2026-06-05', meta: 'Photo uploaded' }
];

export const assets: SimpleRecord[] = [
  'Lift 1', 'Lift 2', 'Fire panel', 'Basement pumps', 'Vehicle gate', 'CCTV recorder', 'Roof anchor points', 'Pool filtration', 'Gym HVAC', 'Common doors'
].map((title, index) => ({
  id: `a${index + 1}`,
  title,
  buildingId: buildings[index % buildings.length].id,
  owner: contractors[index % contractors.length].company,
  status: index % 5 === 0 ? 'Due soon' : 'Open',
  due: `2026-06-${String(10 + index * 2).padStart(2, '0')}`,
  meta: ['Monthly', 'Quarterly', 'Annual'][index % 3]
}));

export const inspections: SimpleRecord[] = [
  'Quarterly common property inspection', 'Fire stair inspection', 'Roof access safety check', 'Pool and BBQ area inspection'
].map((title, index) => ({
  id: `insp${index + 1}`,
  title,
  buildingId: buildings[index % buildings.length].id,
  owner: staff[index % staff.length].name,
  status: index === 0 ? 'Scheduled' : 'Open',
  due: `2026-06-${String(13 + index * 3).padStart(2, '0')}`,
  meta: 'Checklist with photos'
}));

export const notifications: SimpleRecord[] = [
  { id: 'nt1', title: 'Emergency alert issued', buildingId: 'b1', owner: 'System', status: 'Sent', priority: 'Emergency', due: '2026-06-05', meta: 'In-app + email' },
  { id: 'nt2', title: 'Compliance deadline approaching', buildingId: 'b4', owner: 'System', status: 'Open', priority: 'High', due: '2026-06-07', meta: 'In-app notification' },
  { id: 'nt3', title: 'Committee vote required', buildingId: 'b3', owner: 'System', status: 'Sent', priority: 'Medium', due: '2026-06-08', meta: 'In-app + email' }
];

export const auditLogs: SimpleRecord[] = [
  { id: 'al1', title: 'Notice published', buildingId: 'b1', owner: 'Amelia Hart', status: 'Recorded', due: '2026-06-05 09:13', meta: 'Entity notices/n6 old=draft new=published' },
  { id: 'al2', title: 'Work order assigned', buildingId: 'b4', owner: 'Luca Romano', status: 'Recorded', due: '2026-06-05 10:21', meta: 'Entity work_orders/wo14 contractor=c6' },
  { id: 'al3', title: 'Levy marked paid', buildingId: 'b2', owner: 'Noah Haddad', status: 'Recorded', due: '2026-06-04 16:44', meta: 'Entity levy_payments/lp8 old=unpaid new=paid' }
];

export const motions: SimpleRecord[] = [
  { id: 'cm1', title: 'Approve waterproofing variation', buildingId: 'b3', owner: 'Committee', status: 'Open', due: '2026-06-12', amount: 42000, meta: '5 yes, 1 abstain' },
  { id: 'cm2', title: 'Adopt EV charging feasibility study', buildingId: 'b1', owner: 'Committee', status: 'Draft', due: '2026-06-20', amount: 12500, meta: 'Digital resolution pending' }
];

export const navItems: NavItem[] = [
  { id: 'portfolio', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'portfolio_admin'] },
  { id: 'messages', label: 'Messages', icon: MessageSquare, roles: ['super_admin', 'portfolio_admin'] },
  { id: 'communications', label: 'Notices', icon: Bell, roles: ['super_admin', 'portfolio_admin'] },
  { id: 'documents', label: 'Documents', icon: FileText, roles: ['super_admin', 'portfolio_admin'] },
  { id: 'maintenance', label: 'Maintenance', icon: Hammer, roles: ['super_admin', 'portfolio_admin'] },
  { id: 'facilities', label: 'Facility Bookings', icon: Landmark, roles: ['super_admin', 'portfolio_admin'] },

  { id: 'portfolio', label: 'Dashboard', icon: LayoutDashboard, roles: ['manager'] },
  { id: 'messages', label: 'Messages', icon: MessageSquare, roles: ['manager'] },
  { id: 'communications', label: 'Notices', icon: Bell, roles: ['manager'] },
  { id: 'documents', label: 'Documents', icon: FileText, roles: ['manager'] },
  { id: 'maintenance', label: 'Maintenance', icon: Hammer, roles: ['manager'] },
  { id: 'facilities', label: 'Facility Bookings', icon: Landmark, roles: ['manager'] },

  { id: 'resident', label: 'Dashboard', icon: Home, roles: ['resident'] },
  { id: 'messages', label: 'Messages', icon: MessageSquare, roles: ['resident'] },
  { id: 'communications', label: 'Notices', icon: Bell, roles: ['resident'] },
  { id: 'my_requests', label: 'Requests', icon: ClipboardCheck, roles: ['resident'] },
  { id: 'documents', label: 'Documents', icon: FileText, roles: ['resident'] },
  { id: 'facilities', label: 'Facilities', icon: Landmark, roles: ['resident'] },

  { id: 'resident', label: 'Dashboard', icon: Home, roles: ['committee'] },
  { id: 'messages', label: 'Messages', icon: MessageSquare, roles: ['committee'] },
  { id: 'communications', label: 'Notices', icon: Bell, roles: ['committee'] },
  { id: 'my_requests', label: 'Requests', icon: ClipboardCheck, roles: ['committee'] },
  { id: 'documents', label: 'Documents', icon: FileText, roles: ['committee'] },
  { id: 'facilities', label: 'Facilities', icon: Landmark, roles: ['committee'] },
  { id: 'committee', label: 'Committee', icon: Vote, roles: ['committee'] },

  { id: 'contractor', label: 'Dashboard', icon: LayoutDashboard, roles: ['contractor'] },
  { id: 'maintenance', label: 'Assigned Job', icon: Wrench, roles: ['contractor'] }
];

export const deferredNavItems: NavItem[] = [
  { id: 'buildings', label: 'Buildings', icon: Building2, roles: ['portfolio_admin'] },
  { id: 'maintenance', label: 'Issues & Work Orders', icon: Hammer, roles: ['portfolio_admin'] },
  { id: 'communications', label: 'Communications', icon: MessageSquare, roles: ['portfolio_admin'] },
  { id: 'documents', label: 'Documents', icon: FileText, roles: ['portfolio_admin'] },
  { id: 'messages', label: 'Messages', icon: MessageSquare, roles: ['portfolio_admin'] },

  { id: 'portfolio', label: 'Dashboard', icon: LayoutDashboard, roles: ['manager'] },
  { id: 'buildings', label: 'Buildings', icon: Building2, roles: ['manager'] },
  { id: 'maintenance', label: 'Issues & Work Orders', icon: Hammer, roles: ['manager'] },
  { id: 'communications', label: 'Communications', icon: MessageSquare, roles: ['manager'] },
  { id: 'documents', label: 'Documents', icon: FileText, roles: ['manager'] },
  { id: 'messages', label: 'Messages', icon: MessageSquare, roles: ['manager'] },

  { id: 'resident', label: 'Dashboard', icon: Home, roles: ['resident'] },
  { id: 'communications', label: 'Communications', icon: MessageSquare, roles: ['resident'] },
  { id: 'report_issue', label: 'Report Issue', icon: AlertTriangle, roles: ['resident'] },
  { id: 'my_requests', label: 'My Requests', icon: ClipboardCheck, roles: ['resident'] },
  { id: 'documents', label: 'Documents', icon: FileText, roles: ['resident'] },
  { id: 'directory', label: 'Building Directory', icon: ClipboardCheck, roles: ['resident'] },
  { id: 'messages', label: 'Messages', icon: MessageSquare, roles: ['resident'] },

  { id: 'committee', label: 'Dashboard', icon: LayoutDashboard, roles: ['committee'] },
  { id: 'motions', label: 'Motions & Voting', icon: Vote, roles: ['committee'] },
  { id: 'documents', label: 'Documents', icon: FileText, roles: ['committee'] },
  { id: 'messages', label: 'Messages', icon: MessageSquare, roles: ['committee'] },

  { id: 'contractor', label: 'Dashboard', icon: LayoutDashboard, roles: ['contractor'] },
  { id: 'maintenance', label: 'Assigned Jobs', icon: Wrench, roles: ['contractor'] },
  { id: 'messages', label: 'Messages', icon: MessageSquare, roles: ['contractor'] }
];

export const company = {
  id: 'company-1',
  name: 'Northshore Strata Co.',
  plan: 'Scale',
  mrr: 38400,
  usage: 78,
  featureFlags: ['Committee e-signatures', 'Email notifications', 'Accounting integration']
};

export function notificationChannels(priority: Priority) {
  if (priority === 'Low') return ['in-app'];
  if (priority === 'Medium') return ['in-app'];
  if (priority === 'High') return ['in-app'];
  return ['in-app'];
}

export function buildingName(id: string) {
  return buildings.find((building) => building.id === id)?.name ?? 'Unknown building';
}

export function currency(value: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(value);
}

export function filterForRole<T extends { buildingId?: string; contractorId?: string }>(items: T[], role: Role) {
  if (role === 'super_admin' || role === 'portfolio_admin') return items;
  if (role === 'manager') return items.filter((item) => !item.buildingId || roleBuildingScope.manager.includes(item.buildingId));
  if (role === 'resident' || role === 'committee') return items.filter((item) => item.buildingId === 'b1');
  if (role === 'contractor') return items.filter((item) => item.contractorId === 'c3');
  return items;
}

export function filterPrivateForRole<T extends { buildingId?: string; contractorId?: string; owner?: string; resident?: string; unit?: string }>(items: T[], role: Role) {
  if (role === 'resident') {
    return items.filter((item) => item.buildingId === 'b1' && (item.owner === 'Sienna Nguyen' || item.resident === 'Sienna Nguyen' || item.unit === '1A'));
  }
  if (role === 'committee') {
    return items.filter((item) => item.buildingId === 'b1' && (item.owner === 'Committee' || item.owner === 'Sienna Nguyen' || !item.owner));
  }
  return filterForRole(items, role);
}
