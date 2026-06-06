revoke all on function mark_my_messages_read() from public;
revoke all on function mark_my_messages_read() from anon;
grant execute on function mark_my_messages_read() to authenticated;

revoke all on function mark_my_notices_read() from public;
revoke all on function mark_my_notices_read() from anon;
grant execute on function mark_my_notices_read() to authenticated;
