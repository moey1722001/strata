set session_replication_role = replica;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'atlas-documents',
  'atlas-documents',
  false,
  52428800,
  array[
    'application/pdf',
    'text/plain',
    'image/png',
    'image/jpeg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists atlas_documents_select on storage.objects;
drop policy if exists atlas_documents_insert on storage.objects;
drop policy if exists atlas_documents_update on storage.objects;

create policy atlas_documents_select
  on storage.objects for select
  to authenticated
  using (bucket_id = 'atlas-documents');

create policy atlas_documents_insert
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'atlas-documents');

create policy atlas_documents_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'atlas-documents')
  with check (bucket_id = 'atlas-documents');

update companies
set name = 'Atlas Sandbox Strata',
    plan = 'Sandbox',
    monthly_recurring_revenue = 0,
    feature_flags = '["Sandbox mode"]'::jsonb
where id = '00000000-0000-4000-8000-000000000001';

update buildings
set name = 'Atlas Residences',
    address = '100 Test Street',
    suburb = 'Sydney',
    state = 'NSW',
    postcode = '2000',
    lots_count = 100
where id = '00000000-0000-4000-8000-000000000101';

update users set full_name = 'Amelia Hart' where email = 'owner@northshorestrata.com.au';
update users set full_name = 'Noah Haddad' where email = 'manager@northshorestrata.com.au';
update users set full_name = 'Sienna Nguyen' where email = 'resident@example.com';
update users set full_name = 'Oliver Taylor' where email = 'committee@example.com';
update users set full_name = 'Harvey Price' where email = 'contractor@liftcare.com.au';

delete from contractor_job_updates;
delete from messages;
delete from notifications;
delete from facility_bookings;
delete from committee_votes;
delete from committee_motions;
delete from work_orders;
delete from report_issues;
delete from maintenance_requests;
delete from notices;
delete from documents;

update contractors
set company_name = 'LiftCare NSW',
    contact_person = 'Harvey Price',
    email = 'contractor@liftcare.com.au',
    trade_category = 'Lift servicing',
    service_areas = array['Sydney'],
    average_response_minutes = 45,
    jobs_completed = 0,
    rating = 4.7
where id = '00000000-0000-4000-8000-000000000701';

insert into lots (id, company_id, building_id, lot_number, unit_number, floor, entitlement)
values (
  '00000000-0000-4000-8000-000000000501',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000101',
  '1',
  '1A',
  '1',
  1
)
on conflict (building_id, lot_number) do update set
  unit_number = excluded.unit_number,
  floor = excluded.floor;

delete from building_memberships
where building_id = '00000000-0000-4000-8000-000000000101';

insert into building_memberships (company_id, building_id, user_id, lot_id, role, can_post)
values
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000203',null,'manager',true),
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000204','00000000-0000-4000-8000-000000000501','resident',true),
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000205','00000000-0000-4000-8000-000000000501','committee',true)
on conflict (building_id, user_id, role) do update set
  lot_id = excluded.lot_id,
  can_post = excluded.can_post;

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
values (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000101',
  'b1',
  '{"name":"Atlas Residences","buildingType":"Sandbox strata building","notes":"Single-building workflow testing sandbox."}'::jsonb,
  '[{"id":"atlas-bbq","name":"BBQ Area","description":"Shared BBQ area for resident bookings.","location":"Level 4 terrace","availability":"Mon-Sun 8am-9pm","maxBookingLength":"2 hours","advanceNotice":"24 hours","approvalRequired":true,"feePlaceholder":"No fee","capacity":12,"rules":"Clean after use. No glass on terrace.","visibility":"all residents","status":"active"}]'::jsonb,
  '[{"id":"atlas-manager","type":"Strata manager","name":"Noah Haddad","detail":"manager@northshorestrata.com.au","visibility":"all residents","status":"active"},{"id":"atlas-emergency","type":"Emergency contact","name":"Atlas after-hours","detail":"1300 000 100","visibility":"all residents","status":"active"}]'::jsonb,
  '[{"id":"maintenance","label":"Maintenance","enabled":true,"defaultPriority":"Medium"},{"id":"damage","label":"Damage","enabled":true,"defaultPriority":"Medium"},{"id":"security","label":"Security","enabled":true,"defaultPriority":"High"},{"id":"noise","label":"Noise","enabled":true,"defaultPriority":"Low"},{"id":"safety","label":"Safety","enabled":true,"defaultPriority":"High"},{"id":"other","label":"Other","enabled":true,"defaultPriority":"Medium"}]'::jsonb,
  '[]'::jsonb,
  '{"enabled":false}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '{"leviesVisibleTo":"owners only","residentsCanPostFeed":false,"tenantsCanBookFacilities":true,"committeeDocumentsVisible":true}'::jsonb,
  '["In-app notifications only for sandbox testing"]'::jsonb
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

insert into notices (id, company_id, building_id, created_by, title, body, category, priority, target_audience, notification_channels, read_receipts, created_at)
values (
  '00000000-0000-4000-8000-000000000901',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000203',
  'Welcome to Atlas Residences',
  'This sandbox notice proves manager-to-resident communications are centralised in Atlas.',
  'General notice',
  'Medium',
  'all residents',
  array['in-app'],
  '{}'::jsonb,
  now() - interval '3 days'
);

insert into documents (id, company_id, building_id, uploaded_by, category, title, file_url, visibility, version, created_at)
values (
  '00000000-0000-4000-8000-000000000902',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000203',
  'By-laws',
  'Atlas Residences by-laws',
  'storage://sandbox/atlas-residences-by-laws.txt',
  'residents',
  1,
  now() - interval '3 days'
);

insert into maintenance_requests (id, company_id, building_id, lot_id, resident_id, category, priority, title, description, permission_to_access, preferred_access_times, status, sla_due_at, created_at, updated_at)
values (
  '00000000-0000-4000-8000-000000000903',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000501',
  '00000000-0000-4000-8000-000000000204',
  'Maintenance',
  'Medium',
  'BBQ light not working',
  'The BBQ Area light is flickering after 7pm.',
  true,
  'Weekdays after 9am',
  'Assigned',
  now() + interval '2 days',
  now() - interval '3 days',
  now() - interval '3 days'
);

insert into report_issues (id, company_id, building_id, lot_id, resident_id, category, severity, title, description, routing_outcome, maintenance_request_id, status, created_at)
values (
  '00000000-0000-4000-8000-000000000904',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000501',
  '00000000-0000-4000-8000-000000000204',
  'Maintenance',
  'Medium',
  'BBQ light not working',
  'The BBQ Area light is flickering after 7pm.',
  'Maintenance request',
  '00000000-0000-4000-8000-000000000903',
  'Assigned',
  now() - interval '3 days'
);

insert into work_orders (id, company_id, building_id, maintenance_request_id, contractor_id, status, scheduled_for, created_at)
values (
  '00000000-0000-4000-8000-000000000905',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000903',
  '00000000-0000-4000-8000-000000000701',
  'Assigned',
  now() + interval '1 day',
  now() - interval '3 days'
);

insert into committee_motions (id, company_id, building_id, title, description, amount, status, closes_at)
values (
  '00000000-0000-4000-8000-000000000906',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000101',
  'Approve BBQ Area lighting repair',
  'Approve expenditure to replace the BBQ Area light fitting.',
  950,
  'Open',
  now() + interval '7 days'
);

set session_replication_role = origin;
