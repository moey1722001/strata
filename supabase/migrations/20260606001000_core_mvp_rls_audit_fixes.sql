create or replace function has_company_role(target_company uuid, allowed_roles strata_role[])
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from user_roles ur
    join users u on u.id = ur.user_id
    where u.auth_user_id = auth.uid()
      and ur.company_id = target_company
      and ur.role = any(allowed_roles)
  )
$$;

create or replace function current_profile_id()
returns uuid
language sql
stable
as $$
  select id from users where auth_user_id = auth.uid()
$$;

drop policy if exists tenant_memberships on building_memberships;
create policy building_memberships_core_access
  on building_memberships
  for select
  using (
    user_id = current_profile_id()
    or has_company_role(company_id, array['super_admin','portfolio_admin','manager']::strata_role[])
  );

create policy building_memberships_core_insert
  on building_memberships
  for insert
  with check (
    has_company_role(company_id, array['super_admin','portfolio_admin','manager']::strata_role[])
  );

create policy building_memberships_core_update
  on building_memberships
  for update
  using (
    has_company_role(company_id, array['super_admin','portfolio_admin','manager']::strata_role[])
  )
  with check (
    has_company_role(company_id, array['super_admin','portfolio_admin','manager']::strata_role[])
  );

create policy building_memberships_core_delete
  on building_memberships
  for delete
  using (
    has_company_role(company_id, array['super_admin','portfolio_admin','manager']::strata_role[])
  );

drop policy if exists tenant_contractors on contractors;
create policy contractors_core_access
  on contractors
  for all
  using (
    has_company_role(company_id, array['super_admin','portfolio_admin','manager']::strata_role[])
    or exists (
      select 1
      from users u
      where u.auth_user_id = auth.uid()
        and u.email = contractors.email
    )
  )
  with check (
    has_company_role(company_id, array['super_admin','portfolio_admin','manager']::strata_role[])
  );

drop policy if exists building_motions on committee_motions;
create policy committee_motions_core_access
  on committee_motions
  for all
  using (
    has_company_role(company_id, array['super_admin','portfolio_admin']::strata_role[])
    or (
      can_access_building(building_id)
      and has_company_role(company_id, array['manager']::strata_role[])
    )
    or exists (
      select 1
      from building_memberships bm
      where bm.user_id = current_profile_id()
        and bm.building_id = committee_motions.building_id
        and bm.role = 'committee'
    )
  )
  with check (
    has_company_role(company_id, array['super_admin','portfolio_admin','manager']::strata_role[])
  );

drop policy if exists tenant_audit on audit_logs;
drop policy if exists tenant_audit_logs on audit_logs;
create policy audit_logs_admin_read
  on audit_logs
  for select
  using (
    has_company_role(company_id, array['super_admin','portfolio_admin','manager']::strata_role[])
  );

create policy audit_logs_admin_insert
  on audit_logs
  for insert
  with check (
    user_id = current_profile_id()
    or has_company_role(company_id, array['super_admin','portfolio_admin','manager']::strata_role[])
    or can_access_building(building_id)
    or has_company_role(company_id, array['contractor']::strata_role[])
  );

drop policy if exists building_report_issues on report_issues;
create policy report_issues_core_access
  on report_issues
  for all
  using (
    resident_id = current_profile_id()
    or has_company_role(company_id, array['super_admin','portfolio_admin']::strata_role[])
    or (
      can_access_building(building_id)
      and has_company_role(company_id, array['manager']::strata_role[])
    )
  )
  with check (
    resident_id = current_profile_id()
    or has_company_role(company_id, array['super_admin','portfolio_admin','manager']::strata_role[])
  );

drop policy if exists building_maintenance on maintenance_requests;
create policy maintenance_core_access
  on maintenance_requests
  for all
  using (
    resident_id = current_profile_id()
    or has_company_role(company_id, array['super_admin','portfolio_admin']::strata_role[])
    or (
      can_access_building(building_id)
      and has_company_role(company_id, array['manager']::strata_role[])
    )
    or exists (
      select 1
      from work_orders wo
      join contractors c on c.id = wo.contractor_id
      join users u on u.email = c.email
      where wo.maintenance_request_id = maintenance_requests.id
        and u.auth_user_id = auth.uid()
    )
  )
  with check (
    resident_id = current_profile_id()
    or has_company_role(company_id, array['super_admin','portfolio_admin','manager']::strata_role[])
  );

drop policy if exists building_work_orders on work_orders;
create policy work_orders_core_access
  on work_orders
  for all
  using (
    has_company_role(company_id, array['super_admin','portfolio_admin']::strata_role[])
    or (
      can_access_building(building_id)
      and has_company_role(company_id, array['manager']::strata_role[])
    )
    or exists (
      select 1
      from contractors c
      join users u on u.email = c.email
      where c.id = work_orders.contractor_id
        and u.auth_user_id = auth.uid()
    )
  )
  with check (
    has_company_role(company_id, array['super_admin','portfolio_admin']::strata_role[])
    or (
      can_access_building(building_id)
      and has_company_role(company_id, array['manager']::strata_role[])
    )
  );

drop policy if exists building_contractor_job_updates on contractor_job_updates;
create policy contractor_job_updates_core_access
  on contractor_job_updates
  for all
  using (
    has_company_role(company_id, array['super_admin','portfolio_admin']::strata_role[])
    or (
      can_access_building(building_id)
      and has_company_role(company_id, array['manager']::strata_role[])
    )
    or exists (
      select 1
      from contractors c
      join users u on u.email = c.email
      where c.id = contractor_job_updates.contractor_id
        and u.auth_user_id = auth.uid()
    )
  )
  with check (
    has_company_role(company_id, array['super_admin','portfolio_admin','manager']::strata_role[])
    or exists (
      select 1
      from contractors c
      join users u on u.email = c.email
      where c.id = contractor_job_updates.contractor_id
        and u.auth_user_id = auth.uid()
    )
  );

drop policy if exists building_messages on messages;
create policy messages_core_access
  on messages
  for all
  using (
    sender_id = current_profile_id()
    or recipient_id = current_profile_id()
    or has_company_role(company_id, array['super_admin','portfolio_admin']::strata_role[])
    or (
      can_access_building(building_id)
      and has_company_role(company_id, array['manager']::strata_role[])
    )
  )
  with check (
    sender_id = current_profile_id()
    or has_company_role(company_id, array['super_admin','portfolio_admin','manager']::strata_role[])
  );

drop policy if exists building_documents on documents;
create policy documents_core_access
  on documents
  for all
  using (
    has_company_role(company_id, array['super_admin','portfolio_admin']::strata_role[])
    or (
      can_access_building(building_id)
      and has_company_role(company_id, array['manager']::strata_role[])
    )
    or (
      visibility in ('residents','all')
      and can_access_building(building_id)
    )
    or (
      visibility = 'committee'
      and exists (
        select 1
        from building_memberships bm
        join users u on u.id = bm.user_id
        where u.auth_user_id = auth.uid()
          and bm.building_id = documents.building_id
          and bm.role = 'committee'
      )
    )
  )
  with check (
    has_company_role(company_id, array['super_admin','portfolio_admin','manager']::strata_role[])
  );

drop policy if exists building_notifications on notifications;
create policy notifications_core_access
  on notifications
  for all
  using (
    user_id = current_profile_id()
    or has_company_role(company_id, array['super_admin','portfolio_admin']::strata_role[])
  )
  with check (
    user_id = current_profile_id()
    or has_company_role(company_id, array['super_admin','portfolio_admin','manager']::strata_role[])
  );

drop policy if exists company_votes on committee_votes;
create policy committee_votes_core_access
  on committee_votes
  for all
  using (
    user_id = current_profile_id()
    or has_company_role(company_id, array['super_admin','portfolio_admin']::strata_role[])
    or exists (
      select 1
      from committee_motions cm
      where cm.id = committee_votes.motion_id
        and can_access_building(cm.building_id)
        and has_company_role(cm.company_id, array['manager']::strata_role[])
    )
  )
  with check (
    user_id = current_profile_id()
  );
