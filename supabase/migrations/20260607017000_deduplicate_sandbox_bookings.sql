with ranked_bookings as (
  select
    id,
    row_number() over (
      partition by resident_id, building_id, facility, starts_at, ends_at, status
      order by id
    ) as duplicate_number
  from facility_bookings
  where building_id = '00000000-0000-4000-8000-000000000101'::uuid
)
delete from facility_bookings
where id in (
  select id
  from ranked_bookings
  where duplicate_number > 1
);
