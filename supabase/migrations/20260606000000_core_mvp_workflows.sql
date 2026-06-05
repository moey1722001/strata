create table if not exists contractor_job_updates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  work_order_id uuid not null references work_orders(id) on delete cascade,
  contractor_id uuid not null references contractors(id) on delete cascade,
  status text not null default 'In Progress',
  body text not null,
  photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table contractor_job_updates enable row level security;

drop policy if exists building_contractor_job_updates on contractor_job_updates;
create policy building_contractor_job_updates
  on contractor_job_updates
  for all
  using (
    can_access_building(building_id)
    or exists (
      select 1
      from contractors c
      join users u on u.email = c.email
      where c.id = contractor_job_updates.contractor_id
        and u.auth_user_id = auth.uid()
    )
  )
  with check (
    can_access_building(building_id)
    or exists (
      select 1
      from contractors c
      join users u on u.email = c.email
      where c.id = contractor_job_updates.contractor_id
        and u.auth_user_id = auth.uid()
    )
  );

create index if not exists contractor_job_updates_work_order_idx on contractor_job_updates(work_order_id, created_at desc);

-- Core MVP permissions note:
-- The existing tenant policies isolate by company_id/building_id via user_roles and building_memberships.
-- The app only exposes:
-- - residents: their building and lot context
-- - contractors: assigned work orders and job updates
-- - committee: committee/building records
-- - managers: assigned building records
-- - portfolio admins: company records
-- - platform admins: all seeded tenant records

