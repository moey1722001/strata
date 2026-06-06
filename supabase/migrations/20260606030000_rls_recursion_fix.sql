create or replace function current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from users where auth_user_id = auth.uid()
$$;

create or replace function current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from users where auth_user_id = auth.uid()
$$;

create or replace function is_company_member(target_company uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from user_roles
    join users on users.id = user_roles.user_id
    where users.auth_user_id = auth.uid()
      and user_roles.company_id = target_company
  )
$$;

create or replace function has_company_role(target_company uuid, allowed_roles strata_role[])
returns boolean
language sql
stable
security definer
set search_path = public
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

create or replace function can_access_building(target_building uuid)
returns boolean
language sql
stable
security definer
set search_path = public
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

grant execute on function current_app_user_id() to authenticated;
grant execute on function current_profile_id() to authenticated;
grant execute on function is_company_member(uuid) to authenticated;
grant execute on function has_company_role(uuid, strata_role[]) to authenticated;
grant execute on function can_access_building(uuid) to authenticated;
