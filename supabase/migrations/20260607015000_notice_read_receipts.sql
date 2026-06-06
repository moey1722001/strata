create or replace function mark_my_notices_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
  profile_id uuid;
begin
  profile_id := current_profile_id();

  update notices n
  set read_receipts = coalesce(n.read_receipts, '{}'::jsonb)
    || jsonb_build_object(profile_id::text, now()::text)
  where n.publication_status = 'Published'
    and not coalesce(n.read_receipts, '{}'::jsonb) ? profile_id::text
    and exists (
      select 1
      from building_memberships bm
      where bm.user_id = profile_id
        and bm.building_id = n.building_id
    );

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

revoke all on function mark_my_notices_read() from public;
revoke all on function mark_my_notices_read() from anon;
grant execute on function mark_my_notices_read() to authenticated;
