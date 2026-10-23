begin;

alter table public.events
  drop constraint events_publication_status_check;

alter table public.events
  add constraint events_publication_status_check
  check (publication_status in ('draft', 'published', 'cancelled', 'archived'));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'event-posters',
  'event-posters',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
);

commit;