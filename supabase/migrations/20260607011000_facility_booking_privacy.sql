drop policy if exists building_facilities on facility_bookings;
drop policy if exists facility_bookings_core_access on facility_bookings;

create policy facility_bookings_core_access
  on facility_bookings
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
    or has_company_role(company_id, array['super_admin','portfolio_admin']::strata_role[])
    or (
      can_access_building(building_id)
      and has_company_role(company_id, array['manager']::strata_role[])
    )
  );
