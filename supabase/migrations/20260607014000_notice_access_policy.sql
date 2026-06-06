drop policy if exists building_notices on notices;
drop policy if exists notices_core_access on notices;

create policy notices_core_access
  on notices
  for all
  using (
    has_company_role(company_id, array['super_admin','portfolio_admin']::strata_role[])
    or (
      can_access_building(building_id)
      and has_company_role(company_id, array['manager']::strata_role[])
    )
    or (
      publication_status = 'Published'
      and can_access_building(building_id)
    )
  )
  with check (
    has_company_role(company_id, array['super_admin','portfolio_admin']::strata_role[])
    or (
      can_access_building(building_id)
      and has_company_role(company_id, array['manager']::strata_role[])
    )
  );
