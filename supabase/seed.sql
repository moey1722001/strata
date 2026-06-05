truncate table
  contractor_job_updates,
  committee_votes,
  committee_motions,
  notifications,
  messages,
  documents,
  work_orders,
  report_issues,
  maintenance_requests,
  notices,
  building_memberships,
  user_roles,
  lots,
  contractors,
  users,
  buildings,
  companies
restart identity cascade;

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
)
values
  ('10000000-0000-4000-8000-000000000201','00000000-0000-0000-0000-000000000000','authenticated','authenticated','super@strataos.test',crypt('StrataOS123!', gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-4000-8000-000000000202','00000000-0000-0000-0000-000000000000','authenticated','authenticated','owner@northshorestrata.com.au',crypt('StrataOS123!', gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-4000-8000-000000000203','00000000-0000-0000-0000-000000000000','authenticated','authenticated','manager@northshorestrata.com.au',crypt('StrataOS123!', gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-4000-8000-000000000204','00000000-0000-0000-0000-000000000000','authenticated','authenticated','resident@example.com',crypt('StrataOS123!', gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-4000-8000-000000000205','00000000-0000-0000-0000-000000000000','authenticated','authenticated','committee@example.com',crypt('StrataOS123!', gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-4000-8000-000000000206','00000000-0000-0000-0000-000000000000','authenticated','authenticated','contractor@liftcare.com.au',crypt('StrataOS123!', gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}','{}')
on conflict (id) do update
set email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    updated_at = now();

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  id,
  id,
  id::text,
  jsonb_build_object('sub', id::text, 'email', email),
  'email',
  now(),
  now(),
  now()
from auth.users
where email in (
  'super@strataos.test',
  'owner@northshorestrata.com.au',
  'manager@northshorestrata.com.au',
  'resident@example.com',
  'committee@example.com',
  'contractor@liftcare.com.au'
)
on conflict (provider, provider_id) do update
set identity_data = excluded.identity_data,
    updated_at = now();

insert into companies (id, name, plan, subscription_status, monthly_recurring_revenue, feature_flags)
values ('00000000-0000-4000-8000-000000000001', 'Northshore Strata Co.', 'Scale', 'trial', 38400, '["Committee e-signatures","Email notifications"]');

insert into buildings (id, company_id, name, address, suburb, postcode, lots_count)
values
  ('00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000001','Harbourline Residences','18 Hickson Road','Walsh Bay','2000',126),
  ('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000001','Glebe Foundry','42 Bridge Road','Glebe','2037',84),
  ('00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000001','Bondi Pavilion Towers','7 Curlewis Street','Bondi Beach','2026',112),
  ('00000000-0000-4000-8000-000000000104','00000000-0000-4000-8000-000000000001','Parramatta Quarter','66 George Street','Parramatta','2150',168);

insert into users (id, auth_user_id, company_id, full_name, email, phone)
values
  ('00000000-0000-4000-8000-000000000201','10000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000001','Clara Bennett','super@strataos.test','0400 000 201'),
  ('00000000-0000-4000-8000-000000000202','10000000-0000-4000-8000-000000000202','00000000-0000-4000-8000-000000000001','Amelia Hart','owner@northshorestrata.com.au','0400 000 202'),
  ('00000000-0000-4000-8000-000000000203','10000000-0000-4000-8000-000000000203','00000000-0000-4000-8000-000000000001','Noah Haddad','manager@northshorestrata.com.au','0400 000 203'),
  ('00000000-0000-4000-8000-000000000204','10000000-0000-4000-8000-000000000204','00000000-0000-4000-8000-000000000001','Sienna Nguyen','resident@example.com','0400 000 204'),
  ('00000000-0000-4000-8000-000000000205','10000000-0000-4000-8000-000000000205','00000000-0000-4000-8000-000000000001','Oliver Taylor','committee@example.com','0400 000 205'),
  ('00000000-0000-4000-8000-000000000206','10000000-0000-4000-8000-000000000206','00000000-0000-4000-8000-000000000001','Harvey Price','contractor@liftcare.com.au','0400 000 206');

insert into user_roles (user_id, company_id, role)
values
  ('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000001','super_admin'),
  ('00000000-0000-4000-8000-000000000202','00000000-0000-4000-8000-000000000001','portfolio_admin'),
  ('00000000-0000-4000-8000-000000000203','00000000-0000-4000-8000-000000000001','manager'),
  ('00000000-0000-4000-8000-000000000204','00000000-0000-4000-8000-000000000001','resident'),
  ('00000000-0000-4000-8000-000000000205','00000000-0000-4000-8000-000000000001','committee'),
  ('00000000-0000-4000-8000-000000000206','00000000-0000-4000-8000-000000000001','contractor');

insert into lots (id, company_id, building_id, lot_number, unit_number, floor)
values
  ('00000000-0000-4000-8000-000000000301','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','1','1A','1'),
  ('00000000-0000-4000-8000-000000000302','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','2','2B','2');

insert into building_memberships (company_id, building_id, user_id, lot_id, role, can_post)
values
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000203',null,'manager',true),
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000203',null,'manager',true),
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000204','00000000-0000-4000-8000-000000000301','resident',false),
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000205','00000000-0000-4000-8000-000000000302','committee',true);

insert into contractors (id, company_id, company_name, contact_person, email, phone, trade_category, licence_number, insurance_expiry, service_areas, average_response_minutes, jobs_completed, rating)
values ('00000000-0000-4000-8000-000000000701','00000000-0000-4000-8000-000000000001','LiftCare NSW','Harvey Price','contractor@liftcare.com.au','02 8077 6190','Lift servicing','LIFT-5512','2026-06-22',array['Greater Sydney'],45,231,4.7);

insert into notices (id, company_id, building_id, created_by, title, body, category, priority, target_audience, scheduled_publish_at, notification_channels)
values
  ('00000000-0000-4000-8000-000000000801','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000203','Lift maintenance window confirmed','LiftCare NSW will attend tomorrow between 9am and 12pm.','Maintenance update','Medium','all residents',now(),array['in-app','email']),
  ('00000000-0000-4000-8000-000000000802','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000203','Water shutdown reminder','Stack repairs require a short water shutdown on Level 4.','Water shutdown','High','all residents',now(),array['in-app','email']);

insert into maintenance_requests (id, company_id, building_id, lot_id, resident_id, category, priority, title, description, permission_to_access, preferred_access_times, status, sla_due_at)
values ('00000000-0000-4000-8000-000000000901','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000301','00000000-0000-4000-8000-000000000204','Lifts','High','Lift 2 intermittent fault','Resident reported repeated lift fault.',true,'Weekdays 9am-3pm','Submitted',now() + interval '2 days');

insert into report_issues (id, company_id, building_id, lot_id, resident_id, category, severity, title, description, routing_outcome, maintenance_request_id, status)
values ('00000000-0000-4000-8000-000000000902','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000301','00000000-0000-4000-8000-000000000204','Maintenance','High','Lift 2 intermittent fault','Resident reported repeated lift fault.','Maintenance request','00000000-0000-4000-8000-000000000901','Triage');

insert into work_orders (id, company_id, building_id, maintenance_request_id, contractor_id, status, scheduled_for)
values ('00000000-0000-4000-8000-000000000903','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000901','00000000-0000-4000-8000-000000000701','Assigned',now() + interval '1 day');

insert into contractor_job_updates (company_id, building_id, work_order_id, contractor_id, status, body)
values ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000903','00000000-0000-4000-8000-000000000701','Assigned','Contractor assigned and awaiting site attendance.');

insert into documents (company_id, building_id, uploaded_by, category, title, file_url, visibility, version)
values ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000203','By-laws','Consolidated by-laws','https://example.com/by-laws.pdf','residents',1);

insert into messages (company_id, building_id, sender_id, recipient_id, channel, subject, body)
values ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000204','00000000-0000-4000-8000-000000000203','resident-manager','Lift repair timing','Can you confirm when the contractor will attend?');

insert into notifications (company_id, building_id, user_id, event_type, title, body, channels)
values
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000204','notice_created','Lift maintenance window confirmed','A new notice is available.',array['in-app','email']),
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000203','issue_reported','New resident issue','A resident has reported an issue.',array['in-app','email']);

insert into committee_motions (id, company_id, building_id, title, description, amount, status, closes_at)
values ('00000000-0000-4000-8000-000000001001','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','Approve lift repair variation','Approve variation for additional lift diagnostics.',4200,'Open',now() + interval '7 days');

insert into audit_logs (company_id, building_id, user_id, action, entity_type, entity_id)
values ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000203','SEED_MVP','companies','00000000-0000-4000-8000-000000000001');
