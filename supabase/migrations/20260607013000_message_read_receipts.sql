create or replace function mark_my_messages_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update messages
  set read_at = now()
  where recipient_id = current_profile_id()
    and read_at is null;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

revoke all on function mark_my_messages_read() from public;
revoke all on function mark_my_messages_read() from anon;
grant execute on function mark_my_messages_read() to authenticated;
