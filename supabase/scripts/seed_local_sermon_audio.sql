-- Local-only test fixture. Run with:
-- npx.cmd supabase db query --local --file supabase/scripts/seed_local_sermon_audio.sql
-- This script never uploads or deletes Storage objects.
-- The CLI submits a query as one prepared statement. Keeping validation and
-- all upserts inside one DO statement also makes the fixture atomic.

do $local_seed$
begin
  if not exists (
    select 1
    from storage.buckets
    where id = 'sermon-audio'
      and name = 'sermon-audio'
      and public = false
  ) then
    raise exception 'Expected private local Storage bucket sermon-audio was not found';
  end if;

  if not exists (
    select 1
    from storage.objects
    where bucket_id = 'sermon-audio'
      and name = 'alex_kizenkov-dark-engine-logo-141942.mp3'
  ) then
    raise exception 'Expected existing audio object was not found in sermon-audio';
  end if;

  if not exists (
    select 1
    from public.resource_types
    where code = 'audio'
  ) then
    raise exception 'Required resource type audio was not found';
  end if;

insert into public.resources (
  resource_type,
  slug,
  title,
  summary,
  publication_status,
  published_at
)
values (
  'audio',
  'local-audio-playback-test',
  'Local Audio Playback Test',
  'Fictional local-only fixture for testing sermon audio playback.',
  'published',
  now() - interval '5 minutes'
)
on conflict (slug) do update
set resource_type = excluded.resource_type,
    title = excluded.title,
    summary = excluded.summary,
    publication_status = excluded.publication_status,
    published_at = excluded.published_at,
    updated_at = now();

insert into public.sermon_details (
  resource_id,
  preacher,
  sermon_date,
  series
)
select
  id,
  'Local Test Preacher',
  current_date,
  'Local Audio Integration Tests'
from public.resources
where slug = 'local-audio-playback-test'
on conflict (resource_id) do update
set preacher = excluded.preacher,
    sermon_date = excluded.sermon_date,
    series = excluded.series,
    updated_at = now();

insert into public.audio_details (
  resource_id,
  duration_seconds
)
select
  id,
  null
from public.resources
where slug = 'local-audio-playback-test'
on conflict (resource_id) do update
set duration_seconds = excluded.duration_seconds,
    updated_at = now();

insert into public.assets (
  media_type,
  storage_bucket,
  object_path,
  original_filename,
  mime_type
)
values (
  'audio',
  'sermon-audio',
  'alex_kizenkov-dark-engine-logo-141942.mp3',
  'alex_kizenkov-dark-engine-logo-141942.mp3',
  'audio/mpeg'
)
on conflict (storage_bucket, object_path)
  where storage_bucket is not null
do update
set media_type = excluded.media_type,
    original_filename = excluded.original_filename,
    mime_type = excluded.mime_type,
    updated_at = now();

insert into public.resource_assets (
  resource_id,
  asset_id,
  purpose,
  is_public_metadata,
  download_allowed
)
select
  r.id,
  a.id,
  'audio',
  true,
  false
from public.resources as r
cross join public.assets as a
where r.slug = 'local-audio-playback-test'
  and a.storage_bucket = 'sermon-audio'
  and a.object_path = 'alex_kizenkov-dark-engine-logo-141942.mp3'
on conflict (resource_id, asset_id, purpose) do update
set is_public_metadata = excluded.is_public_metadata,
    download_allowed = excluded.download_allowed;

end;
$local_seed$;
