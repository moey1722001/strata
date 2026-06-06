alter table notices
  add column if not exists publication_status text not null default 'Published';

alter table notices
  drop constraint if exists notices_publication_status_check;

alter table notices
  add constraint notices_publication_status_check
  check (publication_status in ('Draft', 'Published'));

create index if not exists notices_building_publication_status_idx
  on notices(building_id, publication_status, created_at desc);
