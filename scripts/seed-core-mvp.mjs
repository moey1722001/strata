import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const password = process.env.SUPABASE_TEST_PASSWORD ?? 'StrataOS123!';

if (!url || !serviceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required.');
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const companyId = '00000000-0000-4000-8000-000000000001';
const buildingIds = {
  b1: '00000000-0000-4000-8000-000000000101',
  b2: '00000000-0000-4000-8000-000000000102',
  b3: '00000000-0000-4000-8000-000000000103'
};
const profileIds = {
  super_admin: '00000000-0000-4000-8000-000000000201',
  portfolio_admin: '00000000-0000-4000-8000-000000000202',
  manager: '00000000-0000-4000-8000-000000000203',
  resident: '00000000-0000-4000-8000-000000000204',
  committee: '00000000-0000-4000-8000-000000000205',
  contractor: '00000000-0000-4000-8000-000000000206'
};
const lotIds = {
  resident: '00000000-0000-4000-8000-000000000301',
  committee: '00000000-0000-4000-8000-000000000302'
};

const accounts = [
  { role: 'super_admin', name: 'Clara Bennett', email: 'super@strataos.test' },
  { role: 'portfolio_admin', name: 'Amelia Hart', email: 'owner@northshorestrata.com.au' },
  { role: 'manager', name: 'Noah Haddad', email: 'manager@northshorestrata.com.au' },
  { role: 'resident', name: 'Sienna Nguyen', email: 'resident@example.com' },
  { role: 'committee', name: 'Oliver Taylor', email: 'committee@example.com' },
  { role: 'contractor', name: 'Harvey Price', email: 'contractor@liftcare.com.au' }
];

async function assert(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

const authUsers = await assert(await supabase.auth.admin.listUsers({ page: 1, perPage: 100 }), 'List auth users');
const authIds = {};

for (const account of accounts) {
  const existing = authUsers.users.find((user) => user.email === account.email);
  const result = existing
    ? await supabase.auth.admin.updateUserById(existing.id, { password, email_confirm: true })
    : await supabase.auth.admin.createUser({ email: account.email, password, email_confirm: true });
  const user = await assert(result, `Create ${account.email}`);
  authIds[account.role] = user.user.id;
}

await assert(await supabase.from('companies').upsert({
  id: companyId,
  name: 'Northshore Strata Co.',
  plan: 'Scale',
  subscription_status: 'trial',
  monthly_recurring_revenue: 38400,
  feature_flags: ['Email notifications']
}), 'Seed company');

await assert(await supabase.from('buildings').upsert([
  { id: buildingIds.b1, company_id: companyId, name: 'Harbourline Residences', address: '18 Hickson Road', suburb: 'Walsh Bay', state: 'NSW', postcode: '2000', lots_count: 126 },
  { id: buildingIds.b2, company_id: companyId, name: 'Glebe Foundry', address: '42 Bridge Road', suburb: 'Glebe', state: 'NSW', postcode: '2037', lots_count: 84 },
  { id: buildingIds.b3, company_id: companyId, name: 'Bondi Pavilion Towers', address: '7 Curlewis Street', suburb: 'Bondi Beach', state: 'NSW', postcode: '2026', lots_count: 112 }
]), 'Seed buildings');

await assert(await supabase.from('users').upsert(accounts.map((account) => ({
  id: profileIds[account.role],
  auth_user_id: authIds[account.role],
  company_id: companyId,
  full_name: account.name,
  email: account.email
}))), 'Seed profiles');

await assert(await supabase.from('user_roles').upsert(accounts.map((account) => ({
  user_id: profileIds[account.role],
  company_id: companyId,
  role: account.role
})), { onConflict: 'user_id,company_id,role' }), 'Seed roles');

for (const [key, lot] of Object.entries({
  resident: { lot_number: '1', unit_number: '1A', floor: '1' },
  committee: { lot_number: '2', unit_number: '2B', floor: '2' }
})) {
  const existing = await assert(await supabase.from('lots').select('id').eq('building_id', buildingIds.b1).eq('lot_number', lot.lot_number).maybeSingle(), `Find lot ${lot.lot_number}`);
  if (existing) {
    lotIds[key] = existing.id;
  } else {
    const created = await assert(await supabase.from('lots').insert({
      id: lotIds[key],
      company_id: companyId,
      building_id: buildingIds.b1,
      ...lot
    }).select('id').single(), `Create lot ${lot.lot_number}`);
    lotIds[key] = created.id;
  }
}

await assert(await supabase.from('building_memberships').upsert([
  { company_id: companyId, building_id: buildingIds.b1, user_id: profileIds.manager, lot_id: null, role: 'manager', can_post: true },
  { company_id: companyId, building_id: buildingIds.b2, user_id: profileIds.manager, lot_id: null, role: 'manager', can_post: true },
  { company_id: companyId, building_id: buildingIds.b1, user_id: profileIds.resident, lot_id: lotIds.resident, role: 'resident', can_post: false },
  { company_id: companyId, building_id: buildingIds.b1, user_id: profileIds.committee, lot_id: lotIds.committee, role: 'committee', can_post: true }
], { onConflict: 'building_id,user_id,role' }), 'Seed memberships');

await assert(await supabase.from('contractors').upsert({
  id: '00000000-0000-4000-8000-000000000701',
  company_id: companyId,
  company_name: 'LiftCare NSW',
  contact_person: 'Harvey Price',
  email: 'contractor@liftcare.com.au',
  phone: '02 8077 6190',
  trade_category: 'Lift servicing',
  licence_number: 'LIFT-5512',
  insurance_expiry: '2026-09-22',
  service_areas: ['Greater Sydney'],
  average_response_minutes: 45,
  jobs_completed: 231,
  rating: 4.7
}), 'Seed contractor');

await assert(await supabase.from('building_settings').upsert({
  company_id: companyId,
  building_id: buildingIds.b1,
  local_key: 'b1',
  profile: {
    name: 'Harbourline Residences',
    buildingType: 'High-rise residential with concierge',
    notes: 'Resident-ready building configuration.'
  },
  facilities: [
    {
      id: 'b1-bbq',
      name: 'BBQ area',
      description: 'Resident rooftop BBQ area.',
      location: 'Level 8 rooftop',
      availability: 'Mon-Sun 8am-9pm',
      maxBookingLength: '3 hours',
      advanceNotice: '24 hours',
      approvalRequired: true,
      feePlaceholder: 'No fee',
      capacity: 20,
      rules: 'Clean the area after use.',
      visibility: 'all residents',
      status: 'active'
    }
  ],
  contacts: [
    { id: 'b1-sm', type: 'Strata manager', name: 'Noah Haddad', detail: 'manager@northshorestrata.com.au', visibility: 'all residents', status: 'active' }
  ],
  issue_categories: [
    { id: 'water', label: 'Water leak', enabled: true, defaultPriority: 'High' },
    { id: 'lift', label: 'Lift issue', enabled: true, defaultPriority: 'High', defaultContractorId: '00000000-0000-4000-8000-000000000701' },
    { id: 'noise', label: 'Noise', enabled: true, defaultPriority: 'Low' },
    { id: 'other', label: 'Other', enabled: true, defaultPriority: 'Medium' }
  ],
  renovation_rules: [],
  package_management: {
    enabled: true,
    collectionLocation: 'Lobby concierge desk',
    collectionHours: 'Mon-Fri 7am-7pm',
    idRequired: true,
    notificationRules: 'Bring photo identification.'
  },
  compliance_items: [],
  assets: [],
  resident_permissions: {
    leviesVisibleTo: 'owners only',
    residentsCanPostFeed: false,
    tenantsCanBookFacilities: true,
    committeeDocumentsVisible: true
  },
  notification_rules: ['Low: in-app only', 'Medium: in-app + email']
}, { onConflict: 'building_id' }), 'Seed building settings');

console.log('Core Atlas Supabase seed completed.');
