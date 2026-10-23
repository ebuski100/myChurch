begin;

-- Future-dated rows previously used `published` as an implicit scheduled state.
-- Make that state explicit before tightening the status/timestamp relationship.
alter table public.resources
  drop constraint resources_publication_status_check;

alter table public.resources
  drop constraint resources_published_timestamp;

update public.resources
set publication_status = 'scheduled'
where publication_status = 'published'
  and published_at > now();

alter table public.resources
  add constraint resources_publication_status_check
  check (publication_status in ('draft', 'scheduled', 'published', 'archived'));

alter table public.resources
  add constraint resources_publication_timestamp_consistent
  check (
    (publication_status in ('scheduled', 'published') and published_at is not null)
    or (publication_status in ('draft', 'archived') and published_at is null)
  );

commit;
