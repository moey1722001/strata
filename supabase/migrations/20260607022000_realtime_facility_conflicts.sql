create extension if not exists btree_gist;

with duplicate_bookings as (
  select
    id,
    row_number() over (
      partition by building_id, facility, starts_at, ends_at
      order by id desc
    ) as duplicate_rank
  from facility_bookings
  where status not in ('Rejected', 'Cancelled')
)
update facility_bookings
set status = 'Cancelled'
where id in (
  select id
  from duplicate_bookings
  where duplicate_rank > 1
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'facility_bookings_no_overlap'
  ) then
    alter table facility_bookings
      add constraint facility_bookings_no_overlap
      exclude using gist (
        building_id with =,
        facility with =,
        tstzrange(starts_at, ends_at, '[)') with &&
      )
      where (status not in ('Rejected', 'Cancelled'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'facility_bookings'
  ) then
    alter publication supabase_realtime add table facility_bookings;
  end if;
end $$;
