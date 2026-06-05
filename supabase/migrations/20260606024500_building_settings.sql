create table if not exists building_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  local_key text,
  profile jsonb not null default '{}'::jsonb,
  facilities jsonb not null default '[]'::jsonb,
  contacts jsonb not null default '[]'::jsonb,
  issue_categories jsonb not null default '[]'::jsonb,
  renovation_rules jsonb not null default '[]'::jsonb,
  package_management jsonb not null default '{"enabled":false}'::jsonb,
  compliance_items jsonb not null default '[]'::jsonb,
  assets jsonb not null default '[]'::jsonb,
  resident_permissions jsonb not null default '{}'::jsonb,
  notification_rules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (building_id)
);

alter table building_settings enable row level security;

drop policy if exists building_settings_select on building_settings;
drop policy if exists building_settings_manage on building_settings;

create policy building_settings_select on building_settings
  for select using (can_access_building(building_id));

create policy building_settings_manage on building_settings
  for all using (can_access_building(building_id))
  with check (can_access_building(building_id));

insert into building_settings (
  company_id,
  building_id,
  local_key,
  profile,
  facilities,
  contacts,
  issue_categories,
  renovation_rules,
  package_management,
  compliance_items,
  assets,
  resident_permissions,
  notification_rules
)
values
(
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000101',
  'b1',
  '{"name":"Harbourline Residences","buildingType":"High-rise residential with concierge","notes":"Lifts, rooftop, BBQ and package collection enabled."}',
  '[{"id":"b1-bbq","name":"BBQ area","description":"Resident BBQ area with harbour outlook.","location":"Level 8 rooftop","availability":"Mon-Sun 8am-9pm","maxBookingLength":"3 hours","advanceNotice":"24 hours","approvalRequired":true,"feePlaceholder":"$150 deposit placeholder","capacity":20,"rules":"Clean area after use. No glass on rooftop.","visibility":"all residents","status":"active"},{"id":"b1-rooftop","name":"Rooftop","description":"Shared rooftop terrace.","location":"Level 8","availability":"Mon-Sun 7am-10pm","maxBookingLength":"2 hours","advanceNotice":"24 hours","approvalRequired":true,"feePlaceholder":"No fee","capacity":40,"rules":"Noise restrictions after 9pm.","visibility":"all residents","status":"active"},{"id":"b1-parking","name":"Visitor parking","description":"Short-stay visitor bay.","location":"Basement B1","availability":"Mon-Sun","maxBookingLength":"8 hours","advanceNotice":"12 hours","approvalRequired":false,"feePlaceholder":"No fee","capacity":1,"rules":"Display booking confirmation.","visibility":"all residents","status":"active"}]',
  '[{"id":"b1-sm","type":"Strata manager","name":"Amelia Hart","detail":"amelia@northshorestrata.com.au","visibility":"all residents"},{"id":"b1-bm","type":"Building manager","name":"Marcus Lee","detail":"02 9055 0188","visibility":"all residents"},{"id":"b1-concierge","type":"Concierge","name":"Harbourline concierge desk","detail":"Lobby desk, 7am-7pm","visibility":"all residents"},{"id":"b1-lift","type":"Lift company","name":"LiftCare NSW","detail":"contractor@liftcare.com.au","visibility":"all residents"},{"id":"b1-fire","type":"Fire contractor","name":"FireSafe Compliance","detail":"bookings@firesafecompliance.com.au","visibility":"all residents"}]',
  '[{"id":"water","label":"Water leak","enabled":true,"defaultPriority":"High","defaultContractorId":"c1"},{"id":"lift","label":"Lift issue","enabled":true,"defaultPriority":"High","defaultContractorId":"c3"},{"id":"electrical","label":"Electrical","enabled":true,"defaultPriority":"Medium","defaultContractorId":"c2"},{"id":"plumbing","label":"Plumbing","enabled":true,"defaultPriority":"Medium","defaultContractorId":"c1"},{"id":"security","label":"Security","enabled":true,"defaultPriority":"High","defaultContractorId":"c6"},{"id":"noise","label":"Noise","enabled":true,"defaultPriority":"Low"},{"id":"cleaning","label":"Cleaning","enabled":true,"defaultPriority":"Low"},{"id":"parking","label":"Parking","enabled":true,"defaultPriority":"Medium"},{"id":"damage","label":"Common area damage","enabled":true,"defaultPriority":"Medium"},{"id":"fire","label":"Fire safety","enabled":true,"defaultPriority":"Emergency","defaultContractorId":"c4"},{"id":"other","label":"Other","enabled":true,"defaultPriority":"Medium"}]',
  '[{"id":"bathroom","type":"Bathroom renovation","enabled":true,"requiredDocuments":["Plans","Contractor licence","Insurance certificate"],"acknowledgements":["By-law acknowledgement","Noise rules"],"approvalPathway":"Manager then committee","committeeReviewRequired":true,"noiseRules":"No noisy work before 8am or after 5pm weekdays."},{"id":"kitchen","type":"Kitchen renovation","enabled":true,"requiredDocuments":["Plans","Contractor insurance"],"acknowledgements":["By-law acknowledgement"],"approvalPathway":"Manager review","committeeReviewRequired":false,"noiseRules":"Notify neighbours 72 hours before noisy works."},{"id":"flooring","type":"Flooring","enabled":true,"requiredDocuments":["Acoustic certificate","Scope of works"],"acknowledgements":["Acoustic by-law acknowledgement"],"approvalPathway":"Committee review","committeeReviewRequired":true,"noiseRules":"Acoustic underlay certificate required."}]',
  '{"enabled":true,"collectionLocation":"Lobby concierge desk","collectionHours":"Mon-Fri 7am-7pm, Sat 8am-12pm","idRequired":true,"notificationRules":"Notify resident when package is logged and remind after 48 hours."}',
  '[{"id":"b1-fire","category":"Fire safety","enabled":true,"frequency":"Annual","responsible":"FireSafe Compliance"},{"id":"b1-afss","category":"AFSS","enabled":true,"frequency":"Annual","responsible":"Strata manager"},{"id":"b1-lift","category":"Lift servicing","enabled":true,"frequency":"Monthly","responsible":"LiftCare NSW"},{"id":"b1-insurance","category":"Insurance","enabled":true,"frequency":"Annual","responsible":"Portfolio admin"}]',
  '[{"id":"b1-lift1","name":"Lift 1","type":"Lift","location":"Core A","serviceFrequency":"Monthly","contractorId":"c3"},{"id":"b1-fire-panel","name":"Fire panel","type":"Fire panel","location":"Ground floor lobby","serviceFrequency":"Quarterly","contractorId":"c4"},{"id":"b1-intercom","name":"Intercom","type":"Intercom","location":"Front entry","serviceFrequency":"Annual","contractorId":"c6"}]',
  '{"leviesVisibleTo":"owners only","residentsCanPostFeed":false,"tenantsCanBookFacilities":true,"committeeDocumentsVisible":true}',
  '["Low: in-app only","Medium: in-app + email","High: in-app + email","Critical: in-app + email"]'
),
(
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000102',
  'b2',
  '{"name":"Glebe Foundry","buildingType":"Converted warehouse apartments","notes":"Loading dock and lift move bookings enabled. Package collection disabled."}',
  '[{"id":"b2-loading","name":"Loading dock","description":"Shared loading dock for deliveries and trades.","location":"Rear lane","availability":"Mon-Fri 8am-4pm","maxBookingLength":"2 hours","advanceNotice":"48 hours","approvalRequired":true,"feePlaceholder":"No fee","capacity":1,"rules":"Keep roller door clear.","visibility":"all residents","status":"active"},{"id":"b2-lift-move","name":"Lift move booking","description":"Goods lift booking for moves and bulky deliveries.","location":"Goods lift","availability":"Tue-Thu 9am-3pm","maxBookingLength":"4 hours","advanceNotice":"72 hours","approvalRequired":true,"feePlaceholder":"$300 bond placeholder","capacity":1,"rules":"Lift curtains required.","visibility":"all residents","status":"active"}]',
  '[{"id":"b2-sm","type":"Strata manager","name":"Noah Haddad","detail":"noah@northshorestrata.com.au","visibility":"all residents"},{"id":"b2-cleaner","type":"Cleaner","name":"Inner West Cleaning Co.","detail":"cleaning@iwcleaning.com.au","visibility":"all residents"},{"id":"b2-electrician","type":"Electrician","name":"Blue Gum Electrical","detail":"service@bluegumelec.com.au","visibility":"all residents"}]',
  '[{"id":"water","label":"Water leak","enabled":true,"defaultPriority":"High","defaultContractorId":"c1"},{"id":"electrical","label":"Electrical","enabled":true,"defaultPriority":"Medium","defaultContractorId":"c2"},{"id":"plumbing","label":"Plumbing","enabled":true,"defaultPriority":"Medium","defaultContractorId":"c1"},{"id":"security","label":"Security","enabled":true,"defaultPriority":"High","defaultContractorId":"c6"},{"id":"noise","label":"Noise","enabled":true,"defaultPriority":"Low"},{"id":"cleaning","label":"Cleaning","enabled":true,"defaultPriority":"Low"},{"id":"parking","label":"Parking","enabled":true,"defaultPriority":"Medium"},{"id":"other","label":"Other","enabled":true,"defaultPriority":"Medium"}]',
  '[{"id":"flooring","type":"Flooring","enabled":true,"requiredDocuments":["Acoustic certificate","Scope of works"],"acknowledgements":["Acoustic by-law acknowledgement"],"approvalPathway":"Committee review","committeeReviewRequired":true,"noiseRules":"Acoustic certificate required before approval."},{"id":"aircon","type":"Air conditioning","enabled":true,"requiredDocuments":["Installer licence","Condenser location plan"],"acknowledgements":["External wall penetration by-law"],"approvalPathway":"Manager review","committeeReviewRequired":false,"noiseRules":"Condenser must meet noise requirements."}]',
  '{"enabled":false}',
  '[{"id":"b2-fire","category":"Fire safety","enabled":true,"frequency":"Annual","responsible":"FireSafe Compliance"},{"id":"b2-insurance","category":"Insurance","enabled":true,"frequency":"Annual","responsible":"Portfolio admin"},{"id":"b2-whs","category":"WHS","enabled":true,"frequency":"Quarterly","responsible":"Building manager"}]',
  '[{"id":"b2-goods-lift","name":"Goods lift","type":"Lift","location":"Rear core","serviceFrequency":"Monthly","contractorId":"c3"},{"id":"b2-gate","name":"Vehicle gate","type":"Gate","location":"Rear lane","serviceFrequency":"Quarterly","contractorId":"c6"}]',
  '{"leviesVisibleTo":"owners only","residentsCanPostFeed":false,"tenantsCanBookFacilities":true,"committeeDocumentsVisible":true}',
  '["Low: in-app only","Medium: in-app + email","High: in-app + email","Critical: in-app + email"]'
),
(
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000103',
  'b3',
  '{"name":"Bondi Pavilion Towers","buildingType":"Beachside apartments with concierge","notes":"Pool, gym and strict renovation approvals enabled."}',
  '[{"id":"b3-pool","name":"Pool","description":"Outdoor resident pool.","location":"Level 2 deck","availability":"Mon-Sun 6am-9pm","maxBookingLength":"2 hours","advanceNotice":"No advance notice","approvalRequired":false,"feePlaceholder":"No fee","capacity":25,"rules":"No glass. Children supervised.","visibility":"all residents","status":"active"},{"id":"b3-gym","name":"Gym","description":"Resident gym sessions.","location":"Level 1","availability":"Mon-Sun 5am-10pm","maxBookingLength":"90 minutes","advanceNotice":"No advance notice","approvalRequired":false,"feePlaceholder":"No fee","capacity":12,"rules":"Wipe equipment after use.","visibility":"all residents","status":"active"}]',
  '[{"id":"b3-sm","type":"Strata manager","name":"Priya Menon","detail":"priya@northshorestrata.com.au","visibility":"all residents"},{"id":"b3-concierge","type":"Concierge","name":"Bondi Pavilion front desk","detail":"Lobby desk, 6am-10pm","visibility":"all residents"},{"id":"b3-security","type":"Security","name":"Eastern Beaches Security","detail":"02 9000 7788","visibility":"all residents"}]',
  '[{"id":"water","label":"Water leak","enabled":true,"defaultPriority":"High","defaultContractorId":"c1"},{"id":"lift","label":"Lift issue","enabled":true,"defaultPriority":"High","defaultContractorId":"c3"},{"id":"security","label":"Security","enabled":true,"defaultPriority":"High","defaultContractorId":"c6"},{"id":"noise","label":"Noise","enabled":true,"defaultPriority":"Low"},{"id":"cleaning","label":"Cleaning","enabled":true,"defaultPriority":"Low"},{"id":"parking","label":"Parking","enabled":true,"defaultPriority":"Medium"},{"id":"fire","label":"Fire safety","enabled":true,"defaultPriority":"Emergency","defaultContractorId":"c4"},{"id":"other","label":"Other","enabled":true,"defaultPriority":"Medium"}]',
  '[{"id":"bathroom","type":"Bathroom renovation","enabled":true,"requiredDocuments":["Plans","Waterproofing licence","Insurance certificate"],"acknowledgements":["By-law acknowledgement","Noise rules"],"approvalPathway":"Manager then committee","committeeReviewRequired":true,"noiseRules":"No noisy work on weekends."},{"id":"balcony","type":"Balcony works","enabled":true,"requiredDocuments":["Engineer details","Scope of works","Insurance"],"acknowledgements":["Common property by-law acknowledgement"],"approvalPathway":"Committee review","committeeReviewRequired":true,"noiseRules":"Strict coastal facade conditions apply."},{"id":"ev","type":"EV charger","enabled":true,"requiredDocuments":["Electrical plan","Installer licence"],"acknowledgements":["Embedded network acknowledgement"],"approvalPathway":"Committee review","committeeReviewRequired":true,"noiseRules":"Works by approved electricians only."}]',
  '{"enabled":true,"collectionLocation":"Concierge room behind lobby","collectionHours":"Mon-Sun 6am-10pm","idRequired":true,"notificationRules":"Notify immediately and escalate uncollected parcels after 72 hours."}',
  '[{"id":"b3-pool","category":"Pool compliance","enabled":true,"frequency":"Annual","responsible":"Building manager"},{"id":"b3-lift","category":"Lift servicing","enabled":true,"frequency":"Monthly","responsible":"LiftCare NSW"},{"id":"b3-fire","category":"Fire safety","enabled":true,"frequency":"Annual","responsible":"FireSafe Compliance"}]',
  '[{"id":"b3-pool-pump","name":"Pool filtration","type":"Pool","location":"Plant room","serviceFrequency":"Monthly","contractorId":"c1"},{"id":"b3-gym-hvac","name":"Gym HVAC","type":"Electrical systems","location":"Level 1 plant","serviceFrequency":"Quarterly","contractorId":"c2"},{"id":"b3-lifts","name":"Lift bank","type":"Lift","location":"Core","serviceFrequency":"Monthly","contractorId":"c3"}]',
  '{"leviesVisibleTo":"owners only","residentsCanPostFeed":false,"tenantsCanBookFacilities":true,"committeeDocumentsVisible":true}',
  '["Low: in-app only","Medium: in-app + email","High: in-app + email","Critical: in-app + email"]'
)
on conflict (building_id) do update set
  local_key = excluded.local_key,
  profile = excluded.profile,
  facilities = excluded.facilities,
  contacts = excluded.contacts,
  issue_categories = excluded.issue_categories,
  renovation_rules = excluded.renovation_rules,
  package_management = excluded.package_management,
  compliance_items = excluded.compliance_items,
  assets = excluded.assets,
  resident_permissions = excluded.resident_permissions,
  notification_rules = excluded.notification_rules,
  updated_at = now();
