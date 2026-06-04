create extension if not exists pgcrypto;

create type strata_role as enum (
  'super_admin',
  'portfolio_admin',
  'manager',
  'resident',
  'committee',
  'contractor'
);

create type strata_priority as enum ('Emergency', 'High', 'Medium', 'Low');

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'Scale',
  subscription_status text not null default 'trial',
  monthly_recurring_revenue numeric(12,2) not null default 0,
  feature_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table buildings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  address text not null,
  suburb text not null,
  state text not null default 'NSW',
  postcode text not null,
  lots_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  company_id uuid references companies(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  role strata_role not null,
  unique (user_id, company_id, role)
);

create table lots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  lot_number text not null,
  unit_number text not null,
  floor text,
  entitlement numeric(10,4) default 1,
  unique (building_id, lot_number)
);

create table building_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  lot_id uuid references lots(id) on delete set null,
  role strata_role not null,
  can_post boolean not null default false,
  unique (building_id, user_id, role)
);

create table contractors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  company_name text not null,
  contact_person text not null,
  email text not null,
  phone text,
  trade_category text not null,
  licence_number text,
  insurance_expiry date,
  service_areas text[] not null default '{}',
  average_response_minutes integer not null default 0,
  jobs_completed integer not null default 0,
  rating numeric(2,1) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table notices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  created_by uuid references users(id) on delete set null,
  title text not null,
  body text not null,
  category text not null,
  priority strata_priority not null default 'Medium',
  target_audience text not null default 'all residents',
  attachments jsonb not null default '[]'::jsonb,
  scheduled_publish_at timestamptz,
  notification_channels text[] not null default array['in-app'],
  read_receipts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  lot_id uuid references lots(id) on delete set null,
  resident_id uuid references users(id) on delete set null,
  category text not null,
  priority strata_priority not null default 'Medium',
  title text not null,
  description text not null,
  photos jsonb not null default '[]'::jsonb,
  permission_to_access boolean not null default false,
  preferred_access_times text,
  status text not null default 'Submitted',
  sla_due_at timestamptz,
  resident_feedback jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table report_issues (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  lot_id uuid references lots(id) on delete set null,
  resident_id uuid references users(id) on delete set null,
  category text not null check (category in ('Maintenance','Damage','Security','Noise','Safety','Other')),
  severity strata_priority not null default 'Medium',
  title text not null,
  description text not null,
  photos jsonb not null default '[]'::jsonb,
  routing_outcome text not null default 'Maintenance request',
  maintenance_request_id uuid references maintenance_requests(id) on delete set null,
  incident_id uuid,
  status text not null default 'Triage',
  created_at timestamptz not null default now()
);

create table work_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  maintenance_request_id uuid references maintenance_requests(id) on delete cascade,
  contractor_id uuid references contractors(id) on delete set null,
  status text not null default 'Assigned',
  internal_notes text,
  scheduled_for timestamptz,
  completed_at timestamptz,
  before_photos jsonb not null default '[]'::jsonb,
  after_photos jsonb not null default '[]'::jsonb,
  contractor_updates jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table contractor_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  contractor_id uuid not null references contractors(id) on delete cascade,
  document_type text not null,
  file_url text not null,
  expires_at date,
  created_at timestamptz not null default now()
);

create table quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  work_order_id uuid references work_orders(id) on delete cascade,
  contractor_id uuid not null references contractors(id) on delete cascade,
  amount numeric(12,2) not null,
  status text not null default 'Uploaded',
  file_url text,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  contractor_id uuid references contractors(id) on delete set null,
  title text not null,
  description text,
  budget numeric(12,2) not null default 0,
  approved_spend numeric(12,2) not null default 0,
  timeline daterange,
  progress_percentage integer not null default 0 check (progress_percentage between 0 and 100),
  photos jsonb not null default '[]'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  committee_approvals jsonb not null default '[]'::jsonb,
  resident_updates jsonb not null default '[]'::jsonb,
  risks_issues text,
  status text not null default 'Draft',
  created_at timestamptz not null default now()
);

create table project_milestones (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  due_date date,
  status text not null default 'Open'
);

create table incidents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  occurred_at timestamptz not null,
  location text,
  incident_type text not null,
  description text not null,
  severity strata_priority not null default 'Medium',
  photos jsonb not null default '[]'::jsonb,
  reports jsonb not null default '[]'::jsonb,
  contractor_updates jsonb not null default '[]'::jsonb,
  insurance_claim_reference text,
  linked_maintenance_request_id uuid references maintenance_requests(id) on delete set null,
  linked_documents jsonb not null default '[]'::jsonb,
  status text not null default 'Open'
);

alter table report_issues
  add constraint report_issues_incident_id_fkey
  foreign key (incident_id) references incidents(id) on delete set null;

create table building_directories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  strata_manager text not null,
  building_manager text not null,
  concierge_contact text,
  emergency_contact text not null,
  after_hours_contact text not null,
  company_phone text not null,
  company_email text not null,
  updated_at timestamptz not null default now(),
  unique (building_id)
);

create table compliance_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  category text not null,
  due_date date not null,
  responsible_user_id uuid references users(id) on delete set null,
  documents jsonb not null default '[]'::jsonb,
  status text not null default 'Open',
  reminder_schedule jsonb not null default '{"days_before":[30,14,7,1]}'::jsonb,
  escalation_status text not null default 'None'
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid references buildings(id) on delete cascade,
  uploaded_by uuid references users(id) on delete set null,
  category text not null,
  title text not null,
  file_url text not null,
  visibility text not null default 'residents',
  version integer not null default 1,
  version_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table levy_notices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  lot_id uuid not null references lots(id) on delete cascade,
  owner_id uuid references users(id) on delete set null,
  amount numeric(12,2) not null,
  due_date date not null,
  status text not null default 'Open',
  file_url text
);

create table levy_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  levy_notice_id uuid not null references levy_notices(id) on delete cascade,
  amount numeric(12,2) not null,
  paid_at timestamptz,
  method text default 'manual',
  reference text
);

create table renovation_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  lot_id uuid references lots(id) on delete set null,
  resident_id uuid references users(id) on delete set null,
  scope_of_works text not null,
  plans jsonb not null default '[]'::jsonb,
  contractor_details jsonb not null default '{}'::jsonb,
  proposed_dates daterange,
  noise_impact text,
  bylaw_acknowledged boolean not null default false,
  status text not null default 'Submitted',
  committee_comments jsonb not null default '[]'::jsonb
);

create table committee_motions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  title text not null,
  description text,
  amount numeric(12,2),
  status text not null default 'Open',
  closes_at timestamptz
);

create table committee_votes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  motion_id uuid not null references committee_motions(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  vote text not null check (vote in ('yes','no','abstain')),
  signed_at timestamptz,
  unique (motion_id, user_id)
);

create table meetings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  meeting_type text not null,
  starts_at timestamptz not null,
  location text,
  online_link text,
  agenda jsonb not null default '[]'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  attendance jsonb not null default '[]'::jsonb,
  motions jsonb not null default '[]'::jsonb,
  minutes text,
  reminders jsonb not null default '[]'::jsonb
);

create table facility_bookings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  resident_id uuid references users(id) on delete set null,
  facility text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'Submitted',
  fee_placeholder numeric(12,2),
  deposit_placeholder numeric(12,2)
);

create table packages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  resident_id uuid references users(id) on delete set null,
  lot_id uuid references lots(id) on delete set null,
  courier text not null,
  package_photo_url text,
  collection_status text not null default 'Awaiting collection',
  notification_sent boolean not null default false,
  collected_by text,
  collected_at timestamptz
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid references buildings(id) on delete cascade,
  sender_id uuid references users(id) on delete set null,
  recipient_id uuid references users(id) on delete set null,
  channel text not null,
  body text not null,
  attachments jsonb not null default '[]'::jsonb,
  read_at timestamptz,
  linked_entity_type text,
  linked_entity_id uuid,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid references buildings(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  event_type text not null,
  title text not null,
  body text,
  channels text[] not null default array['in-app'],
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  name text not null,
  location text,
  service_frequency text,
  last_serviced date,
  next_service_due date,
  contractor_id uuid references contractors(id) on delete set null,
  documents jsonb not null default '[]'::jsonb,
  maintenance_history jsonb not null default '[]'::jsonb
);

create table inspections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  scheduled_for date not null,
  checklist jsonb not null default '[]'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  notes text,
  issues_found jsonb not null default '[]'::jsonb,
  converted_maintenance_request_id uuid references maintenance_requests(id) on delete set null
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  building_id uuid references buildings(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  role strata_role,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index on buildings(company_id);
create index on building_memberships(company_id, building_id, user_id);
create index on notices(company_id, building_id, scheduled_publish_at);
create index on maintenance_requests(company_id, building_id, status);
create index on work_orders(company_id, building_id, contractor_id);
create index on documents(company_id, building_id, category);
create index on audit_logs(company_id, building_id, created_at desc);

create or replace function current_app_user_id()
returns uuid
language sql
stable
as $$
  select id from users where auth_user_id = auth.uid()
$$;

create or replace function is_company_member(target_company uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from user_roles
    join users on users.id = user_roles.user_id
    where users.auth_user_id = auth.uid()
      and user_roles.company_id = target_company
  )
$$;

create or replace function can_access_building(target_building uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from building_memberships
    join users on users.id = building_memberships.user_id
    where users.auth_user_id = auth.uid()
      and building_memberships.building_id = target_building
  )
  or exists (
    select 1
    from buildings b
    join user_roles ur on ur.company_id = b.company_id
    join users u on u.id = ur.user_id
    where u.auth_user_id = auth.uid()
      and b.id = target_building
      and ur.role in ('super_admin','portfolio_admin')
  )
$$;

create or replace function audit_row_change()
returns trigger
language plpgsql
security definer
as $$
declare
  target_company uuid;
  target_building uuid;
begin
  target_company := coalesce((to_jsonb(new)->>'company_id')::uuid, (to_jsonb(old)->>'company_id')::uuid);
  target_building := nullif(coalesce(to_jsonb(new)->>'building_id', to_jsonb(old)->>'building_id'), '')::uuid;

  insert into audit_logs(company_id, building_id, user_id, action, entity_type, entity_id, old_value, new_value)
  values (
    target_company,
    target_building,
    current_app_user_id(),
    tg_op,
    tg_table_name,
    coalesce((to_jsonb(new)->>'id')::uuid, (to_jsonb(old)->>'id')::uuid),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'notices','maintenance_requests','report_issues','work_orders','quotes','projects','incidents','building_directories','compliance_items',
    'documents','levy_notices','levy_payments','renovation_requests','committee_motions','committee_votes',
    'meetings','facility_bookings','packages','messages','notifications','assets','inspections'
  ]
  loop
    execute format('create trigger %I_audit after insert or update or delete on %I for each row execute function audit_row_change()', table_name, table_name);
  end loop;
end $$;

alter table companies enable row level security;
alter table buildings enable row level security;
alter table users enable row level security;
alter table user_roles enable row level security;
alter table lots enable row level security;
alter table building_memberships enable row level security;
alter table contractors enable row level security;
alter table notices enable row level security;
alter table maintenance_requests enable row level security;
alter table report_issues enable row level security;
alter table work_orders enable row level security;
alter table contractor_documents enable row level security;
alter table quotes enable row level security;
alter table projects enable row level security;
alter table project_milestones enable row level security;
alter table incidents enable row level security;
alter table building_directories enable row level security;
alter table compliance_items enable row level security;
alter table documents enable row level security;
alter table levy_notices enable row level security;
alter table levy_payments enable row level security;
alter table renovation_requests enable row level security;
alter table committee_motions enable row level security;
alter table committee_votes enable row level security;
alter table meetings enable row level security;
alter table facility_bookings enable row level security;
alter table packages enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table assets enable row level security;
alter table inspections enable row level security;
alter table audit_logs enable row level security;

create policy tenant_companies on companies for all using (is_company_member(id));
create policy tenant_users on users for all using (is_company_member(company_id) or auth_user_id = auth.uid());
create policy tenant_user_roles on user_roles for all using (is_company_member(company_id));
create policy tenant_buildings on buildings for all using (is_company_member(company_id));
create policy tenant_lots on lots for all using (can_access_building(building_id));
create policy tenant_memberships on building_memberships for all using (can_access_building(building_id));
create policy tenant_contractors on contractors for all using (is_company_member(company_id));
create policy tenant_audit_logs on audit_logs for select using (is_company_member(company_id));

create policy building_notices on notices for all using (can_access_building(building_id));
create policy building_maintenance on maintenance_requests for all using (can_access_building(building_id));
create policy building_report_issues on report_issues for all using (can_access_building(building_id));
create policy building_work_orders on work_orders for all using (can_access_building(building_id));
create policy building_projects on projects for all using (can_access_building(building_id));
create policy building_project_milestones on project_milestones for all using (is_company_member(company_id));
create policy building_incidents on incidents for all using (can_access_building(building_id));
create policy building_directories on building_directories for all using (can_access_building(building_id));
create policy building_compliance on compliance_items for all using (can_access_building(building_id));
create policy building_documents on documents for all using (building_id is null or can_access_building(building_id));
create policy building_levy_notices on levy_notices for all using (can_access_building(building_id));
create policy building_renovations on renovation_requests for all using (can_access_building(building_id));
create policy building_motions on committee_motions for all using (can_access_building(building_id));
create policy building_meetings on meetings for all using (can_access_building(building_id));
create policy building_facilities on facility_bookings for all using (can_access_building(building_id));
create policy building_packages on packages for all using (can_access_building(building_id));
create policy building_messages on messages for all using (building_id is null or can_access_building(building_id));
create policy building_notifications on notifications for all using (is_company_member(company_id));
create policy building_assets on assets for all using (can_access_building(building_id));
create policy building_inspections on inspections for all using (can_access_building(building_id));
create policy company_contractor_documents on contractor_documents for all using (is_company_member(company_id));
create policy company_quotes on quotes for all using (is_company_member(company_id));
create policy company_levy_payments on levy_payments for all using (is_company_member(company_id));
create policy company_votes on committee_votes for all using (is_company_member(company_id));

-- TODO: connect auth invites, email delivery, future push, payments, accounting exports and AI/RAG retrieval using service-role edge functions.

with inserted_company as (
  insert into companies (id, name, plan, subscription_status, monthly_recurring_revenue, feature_flags)
  values (
    '00000000-0000-4000-8000-000000000001',
    'Northshore Strata Co.',
    'Scale',
    'trial',
    38400,
    '["Committee e-signatures","Email notifications","Future push placeholder"]'
  )
  returning id
),
inserted_buildings as (
  insert into buildings (id, company_id, name, address, suburb, postcode, lots_count)
  values
    ('00000000-0000-4000-8000-000000000101', (select id from inserted_company), 'Harbourline Residences', '18 Hickson Road', 'Walsh Bay', '2000', 126),
    ('00000000-0000-4000-8000-000000000102', (select id from inserted_company), 'Glebe Foundry', '42 Bridge Road', 'Glebe', '2037', 84),
    ('00000000-0000-4000-8000-000000000103', (select id from inserted_company), 'Bondi Pavilion Towers', '7 Curlewis Street', 'Bondi Beach', '2026', 112),
    ('00000000-0000-4000-8000-000000000104', (select id from inserted_company), 'Parramatta Quarter', '66 George Street', 'Parramatta', '2150', 168)
  returning id
),
inserted_staff as (
  insert into users (id, company_id, full_name, email, phone)
  values
    ('00000000-0000-4000-8000-000000000201', (select id from inserted_company), 'Amelia Hart', 'amelia@northshorestrata.com.au', '0412 100 201'),
    ('00000000-0000-4000-8000-000000000202', (select id from inserted_company), 'Noah Haddad', 'noah@northshorestrata.com.au', '0412 100 202'),
    ('00000000-0000-4000-8000-000000000203', (select id from inserted_company), 'Priya Menon', 'priya@northshorestrata.com.au', '0412 100 203'),
    ('00000000-0000-4000-8000-000000000204', (select id from inserted_company), 'Luca Romano', 'luca@northshorestrata.com.au', '0412 100 204')
  returning id
),
generated_residents as (
  insert into users (id, company_id, full_name, email, phone)
  select
    ('00000000-0000-4000-8000-' || lpad((300 + gs)::text, 12, '0'))::uuid,
    (select id from inserted_company),
    (array['Sienna Nguyen','Oliver Taylor','Mia Singh','Thomas Wilson','Ava Khan','Ethan Brown','Zara Patel','Jack Harris','Chloe Kim','Liam Owen','Grace Ali','Hugo Martin','Layla Chen','Noah Walker','Ruby Ibrahim','Mason Davis','Isla Costa','Lucas Murphy','Sofia Sharma','Henry Ryan'])[1 + ((gs - 1) % 20)] || ' ' || gs::text,
    'resident' || gs::text || '@example.com',
    '04' || lpad((12000000 + gs)::text, 8, '0')
  from generate_series(1, 80) gs
  returning id
),
generated_lots as (
  insert into lots (id, company_id, building_id, lot_number, unit_number, floor)
  select
    ('00000000-0000-4000-8000-' || lpad((500 + gs)::text, 12, '0'))::uuid,
    (select id from inserted_company),
    (array['00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000104'])[1 + ((gs - 1) % 4)]::uuid,
    gs::text,
    ceil(gs / 4.0)::text || chr(65 + ((gs - 1) % 4)),
    ceil(gs / 4.0)::text
  from generate_series(1, 80) gs
  returning id
)
insert into user_roles (user_id, company_id, role)
select id, (select id from inserted_company), 'manager'::strata_role from inserted_staff
union all
select id, (select id from inserted_company), 'resident'::strata_role from generated_residents
union all
select id, (select id from inserted_company), 'committee'::strata_role
from (select id from generated_residents order by id limit 8) committee_seed;

insert into building_memberships (company_id, building_id, user_id, lot_id, role, can_post)
select
  '00000000-0000-4000-8000-000000000001',
  lots.building_id,
  users.id,
  lots.id,
  case when row_number() over (order by users.email) <= 8 then 'committee'::strata_role else 'resident'::strata_role end,
  row_number() over (order by users.email) <= 8
from users
join lots on lots.id = ('00000000-0000-4000-8000-' || lpad((500 + regexp_replace(users.email, '\D', '', 'g')::int)::text, 12, '0'))::uuid
where users.email like 'resident%@example.com';

insert into contractors (id, company_id, company_name, contact_person, email, phone, trade_category, licence_number, insurance_expiry, service_areas, average_response_minutes, jobs_completed, rating)
values
  ('00000000-0000-4000-8000-000000000701','00000000-0000-4000-8000-000000000001','Summit Plumbing Group','Ben Oakes','jobs@summitplumbing.com.au','02 8123 4401','Plumbing','NSW-PL-18422C','2026-08-18',array['Sydney CBD','Inner West'],84,142,4.8),
  ('00000000-0000-4000-8000-000000000702','00000000-0000-4000-8000-000000000001','Blue Gum Electrical','Maya Gill','service@bluegumelec.com.au','02 9188 2214','Electrical','NSW-EL-77219','2026-07-02',array['Eastern Suburbs','Parramatta'],130,98,4.6),
  ('00000000-0000-4000-8000-000000000703','00000000-0000-4000-8000-000000000001','LiftCare NSW','Harvey Price','support@liftcare.com.au','02 8077 6190','Lift servicing','LIFT-5512','2026-06-22',array['Greater Sydney'],45,231,4.7),
  ('00000000-0000-4000-8000-000000000704','00000000-0000-4000-8000-000000000001','FireSafe Compliance','Natalie Wu','bookings@firesafecompliance.com.au','02 8099 7500','Fire safety','FPAS-FS-9012','2026-09-15',array['Greater Sydney'],185,188,4.9),
  ('00000000-0000-4000-8000-000000000705','00000000-0000-4000-8000-000000000001','Coastal Waterproofing','Samir Haddad','quotes@coastalwaterproofing.com.au','02 9055 1130','Waterproofing','BLD-332880C','2026-06-17',array['Eastern Suburbs','Northern Beaches'],260,66,4.4),
  ('00000000-0000-4000-8000-000000000706','00000000-0000-4000-8000-000000000001','Secure Entry Systems','Georgia Mills','hello@secureentrysystems.com.au','02 8033 2800','Access control','SEC-43821','2026-11-03',array['Sydney CBD','Parramatta'],115,74,4.5);

insert into notices (company_id, building_id, title, body, category, priority, target_audience, scheduled_publish_at, notification_channels)
select '00000000-0000-4000-8000-000000000001',
  (array['00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000104'])[1 + ((gs - 1) % 4)]::uuid,
  (array['Lift maintenance window confirmed','Water shutdown for stack repairs','AFSS inspection access notice','AGM reminder and proxy forms','Rooftop BBQ reopening','Emergency lobby glass repair','Painting works level 7','Courier package collection update','Noise warning for waterproofing works','Fire panel test schedule','Community garden working bee','Visitor parking rule update'])[gs],
  'Please review the attached building update and follow access, safety and noise instructions.',
  (array['Maintenance update','Water shutdown','Fire inspection','AGM reminder','Community event','Emergency alert'])[1 + ((gs - 1) % 6)],
  (array['Medium','High','Low','Low','Emergency'])[1 + ((gs - 1) % 5)]::strata_priority,
  (array['all residents','owners only','tenants only','committee only','floor group'])[1 + ((gs - 1) % 5)],
  now() + (gs || ' days')::interval,
  case (array['Medium','High','Low','Low','Emergency'])[1 + ((gs - 1) % 5)]
    when 'Low' then array['in-app']
    when 'High' then array['in-app','email','future push']
    else array['in-app','email']
  end
from generate_series(1, 12) gs;

insert into building_directories (company_id, building_id, strata_manager, building_manager, concierge_contact, emergency_contact, after_hours_contact, company_phone, company_email)
values
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','Amelia Hart','Marcus Lee','Harbourline concierge desk','000 for life-threatening emergencies','Northshore after-hours line: 1300 778 228','02 9055 0188','support@northshorestrata.com.au'),
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000102','Noah Haddad','Elena Romano','Glebe Foundry caretaker','000 for life-threatening emergencies','Northshore after-hours line: 1300 778 228','02 9055 0188','support@northshorestrata.com.au'),
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000103','Priya Menon','Sarah McKenzie','Bondi Pavilion front desk','000 for life-threatening emergencies','Northshore after-hours line: 1300 778 228','02 9055 0188','support@northshorestrata.com.au'),
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000104','Luca Romano','Daniel Park','Parramatta Quarter concierge','000 for life-threatening emergencies','Northshore after-hours line: 1300 778 228','02 9055 0188','support@northshorestrata.com.au');

insert into maintenance_requests (company_id, building_id, lot_id, resident_id, category, priority, title, description, permission_to_access, preferred_access_times, status, sla_due_at)
select
  '00000000-0000-4000-8000-000000000001',
  lots.building_id,
  lots.id,
  users.id,
  (array['Plumbing','Lifts','Security','Noise','Electrical'])[1 + ((gs - 1) % 5)],
  (array['Emergency','High','Medium','Low'])[1 + ((gs - 1) % 4)]::strata_priority,
  (array['Water leak in car park level B2','Lift 2 intermittent fault','Intercom not opening front gate','Noise complaint from rooftop plant','Common hallway light outage','Pool gate not self-closing','Visitor parking boom gate stuck','Ceiling stain near lobby','Fire stair door closer broken','Gym air conditioning fault'])[1 + ((gs - 1) % 10)],
  'Resident submitted description with photos, access preferences and audit trail entries.',
  gs % 2 = 0,
  case when gs % 2 = 0 then 'Weekdays 9am-3pm' else 'Resident appointment required' end,
  (array['Submitted','Under Review','Quote Requested','Approved','Assigned','Scheduled','In Progress','Completed','Closed','Rejected'])[1 + ((gs - 1) % 10)],
  now() + ((gs % 5) || ' days')::interval
from generate_series(1, 20) gs
join lots on lots.lot_number = gs::text
join users on users.email = 'resident' || gs::text || '@example.com';

insert into report_issues (company_id, building_id, lot_id, resident_id, category, severity, title, description, routing_outcome, maintenance_request_id, status)
select
  mr.company_id,
  mr.building_id,
  mr.lot_id,
  mr.resident_id,
  (array['Maintenance','Damage','Security','Noise','Safety','Other'])[1 + ((row_number() over ()) - 1) % 6],
  mr.priority,
  mr.title,
  mr.description,
  case
    when mr.priority = 'Emergency' then 'Maintenance request + incident'
    when mr.category in ('Security','Noise') then 'Incident'
    else 'Maintenance request'
  end,
  mr.id,
  'Triage'
from maintenance_requests mr
limit 8;

insert into work_orders (company_id, building_id, maintenance_request_id, contractor_id, status, scheduled_for)
select company_id, building_id, id,
  (array['00000000-0000-4000-8000-000000000701','00000000-0000-4000-8000-000000000702','00000000-0000-4000-8000-000000000703','00000000-0000-4000-8000-000000000704','00000000-0000-4000-8000-000000000705','00000000-0000-4000-8000-000000000706'])[1 + ((row_number() over ()) - 1) % 6]::uuid,
  'Assigned',
  now() + ((row_number() over ()) || ' days')::interval
from maintenance_requests
where status in ('Assigned','Scheduled','In Progress','Completed');

insert into projects (company_id, building_id, contractor_id, title, description, budget, approved_spend, progress_percentage, risks_issues, status)
values
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000705','Balcony waterproofing remediation','Waterproofing and membrane renewal.',680000,214000,38,'Weather delays','In progress'),
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000703','Lift modernisation stage 1','Lift controls and cabin upgrade.',940000,490000,57,'Resident access disruption','In progress'),
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000104','00000000-0000-4000-8000-000000000704','Fire panel and EWIS upgrade','Essential fire service upgrade.',420000,82000,22,'AFSS dependency','Scheduled'),
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000705','Facade painting program','External painting and render repairs.',360000,176000,49,'Scaffold permit','In progress'),
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000104','00000000-0000-4000-8000-000000000706','Access control replacement','Reader, fob and door controller rollout.',145000,31500,18,'Device lead times','Approved');

insert into compliance_items (company_id, building_id, category, due_date, status, escalation_status)
select '00000000-0000-4000-8000-000000000001',
  (array['00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000104'])[1 + ((gs - 1) % 4)]::uuid,
  (array['AFSS lodgement','Lift service certificate','Insurance renewal','WHS risk review','Pool safety certificate','Asbestos register review','Emergency evacuation plan','Fire door inspection','Contractor insurance check','Strata Hub annual report'])[gs],
  current_date + (gs * 3),
  case when gs in (1,5,9) then 'Overdue' when gs in (3,7) then 'Due soon' else 'Open' end,
  case when gs in (1,5,9) then 'Manager escalated' else 'None' end
from generate_series(1, 10) gs;

insert into facility_bookings (company_id, building_id, resident_id, facility, starts_at, ends_at, status, deposit_placeholder)
select '00000000-0000-4000-8000-000000000001',
  (array['00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000104'])[1 + ((gs - 1) % 4)]::uuid,
  ('00000000-0000-4000-8000-' || lpad((300 + gs)::text, 12, '0'))::uuid,
  (array['BBQ area','Visitor parking','Lift move booking','Function room','Loading dock','Gym session'])[gs],
  now() + (gs || ' days')::interval,
  now() + (gs || ' days')::interval + interval '2 hours',
  case when gs % 3 = 0 then 'Approved' else 'Submitted' end,
  150
from generate_series(1, 6) gs;

insert into packages (company_id, building_id, resident_id, lot_id, courier, collection_status, notification_sent)
select '00000000-0000-4000-8000-000000000001',
  lots.building_id,
  users.id,
  lots.id,
  (array['Australia Post','DHL','Toll','Amazon','StarTrack'])[gs],
  case when gs % 2 = 0 then 'Collected' else 'Awaiting collection' end,
  true
from generate_series(1, 5) gs
join users on users.email = 'resident' || (gs + 5)::text || '@example.com'
join lots on lots.lot_number = (gs + 5)::text;

insert into incidents (company_id, building_id, occurred_at, location, incident_type, description, severity, insurance_claim_reference, status)
values
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101',now() - interval '2 days','Basement B2','Water leak','Stormwater ingress after heavy rain.','High','CLM-2026-118','Open'),
  ('00000000-0000-4000-8000-000000000104',now() - interval '1 day','Lobby','Security incident','Tailgating complaint and CCTV review.','Medium',null,'In progress'),
  ('00000000-0000-4000-8000-000000000102',now() - interval '4 days','Fire stair 2','WHS event','Trip hazard reported on stair nosing.','High',null,'Open'),
  ('00000000-0000-4000-8000-000000000103',now() - interval '7 days','Ground floor','Property damage','Common property glass damage.','Low','CLM-2026-102','Closed');

insert into meetings (company_id, building_id, meeting_type, starts_at, location, online_link, agenda)
values
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','AGM',now() + interval '19 days','Level 3 lounge','https://meet.example.com/agm-harbourline','["financials","committee election","capital works"]'),
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000102','Committee meeting',now() + interval '7 days','Online','https://meet.example.com/glebe-committee','["facade works","quotes","arrears"]'),
  ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000103','Resident information session',now() + interval '13 days','Rooftop room',null,'["waterproofing update","noise plan"]');
