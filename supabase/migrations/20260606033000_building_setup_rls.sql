drop policy if exists tenant_memberships on building_memberships;

create policy tenant_memberships_select on building_memberships
  for select using (can_access_building(building_id));

create policy tenant_memberships_manage on building_memberships
  for all
  using (
    can_access_building(building_id)
    or has_company_role(company_id, array['portfolio_admin', 'manager']::strata_role[])
  )
  with check (
    has_company_role(company_id, array['portfolio_admin', 'manager']::strata_role[])
  );
