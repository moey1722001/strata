alter table messages
  add column if not exists subject text;

create unique index if not exists work_orders_request_contractor_unique on work_orders(maintenance_request_id, contractor_id);
create index if not exists messages_building_created_idx on messages(building_id, created_at desc);
create index if not exists facility_bookings_building_starts_idx on facility_bookings(building_id, starts_at desc);

drop policy if exists work_orders_core_access on work_orders;
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
    or exists (
      select 1
      from contractors c
      join users u on u.email = c.email
      where c.id = work_orders.contractor_id
        and u.auth_user_id = auth.uid()
    )
  );

drop policy if exists maintenance_core_access on maintenance_requests;
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
    or exists (
      select 1
      from work_orders wo
      join contractors c on c.id = wo.contractor_id
      join users u on u.email = c.email
      where wo.maintenance_request_id = maintenance_requests.id
        and u.auth_user_id = auth.uid()
    )
  );
