begin;

select plan(23);

-- Fixed fixtures keep this suite deterministic. They are rolled back at the end.
insert into auth.users (id) values
  ('10000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002');

insert into public.admin_users (user_id) values
  ('10000000-0000-0000-0000-000000000002');

insert into public.resources
  (id, resource_type, slug, title, publication_status, published_at)
values
  ('20000000-0000-0000-0000-000000000001', 'audio', 'rls-published', 'Published fixture', 'published', now() - interval '1 day'),
  ('20000000-0000-0000-0000-000000000002', 'audio', 'rls-draft', 'Draft fixture', 'draft', null),
  ('20000000-0000-0000-0000-000000000003', 'audio', 'rls-scheduled', 'Scheduled fixture', 'published', now() + interval '1 day');

insert into public.audio_details (resource_id, duration_seconds) values
  ('20000000-0000-0000-0000-000000000001', 60),
  ('20000000-0000-0000-0000-000000000002', 90);

insert into public.assets (id, media_type, alt_text, storage_bucket, object_path, original_filename, file_size_bytes)
values
  ('30000000-0000-0000-0000-000000000001', 'audio', 'Public cover', 'private-files', 'public/content.mp3', 'content.mp3', 1234),
  ('30000000-0000-0000-0000-000000000002', 'audio', 'Private cover', 'private-files', 'private/secret.mp3', 'secret.mp3', 5678),
  ('30000000-0000-0000-0000-000000000003', 'audio', 'Draft cover', 'private-files', 'draft/draft.mp3', 'draft.mp3', 42);

insert into public.resource_assets
  (resource_id, asset_id, purpose, is_public_metadata, download_allowed)
values
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'cover', true, false),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'audio_file', false, false),
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', 'cover', true, false);

insert into public.events
  (id, slug, title, starts_at, publication_status, published_at)
values
  ('40000000-0000-0000-0000-000000000001', 'rls-event-public', 'Public event fixture', now() + interval '2 days', 'published', now() - interval '1 day'),
  ('40000000-0000-0000-0000-000000000002', 'rls-event-draft', 'Draft event fixture', now() + interval '3 days', 'draft', null);

insert into public.ministries
  (id, slug, name, publication_status, published_at)
values
  ('50000000-0000-0000-0000-000000000001', 'rls-ministry-public', 'Public ministry fixture', 'published', now() - interval '1 day'),
  ('50000000-0000-0000-0000-000000000002', 'rls-ministry-draft', 'Draft ministry fixture', 'draft', null);

-- Anonymous callers can read published content, but not drafts or scheduled rows.
set local role anon;
select is((select count(*)::int from public.resources), 1, 'anon sees only currently published resources');
select is((select count(*)::int from public.audio_details), 1, 'anon sees details only for published resources');
select is((select count(*)::int from public.events), 1, 'anon sees only published events');
select is((select count(*)::int from public.ministries), 1, 'anon sees only published ministries');
select is((select count(*)::int from public.resource_assets), 1, 'anon sees only public metadata links on published resources');
select is((select count(*)::int from public.assets), 1, 'anon sees metadata only for assets attached to published content');
select ok(has_column_privilege('anon', 'public.assets', 'id', 'select'), 'anon can select the asset id');
select ok(has_column_privilege('anon', 'public.assets', 'alt_text', 'select'), 'anon can select public alt text');
select ok(not has_column_privilege('anon', 'public.assets', 'object_path', 'select'), 'anon cannot select storage object paths');
select ok(not has_column_privilege('anon', 'public.assets', 'original_filename', 'select'), 'anon cannot select original filenames');
select ok(not has_column_privilege('anon', 'public.assets', 'file_size_bytes', 'select'), 'anon cannot select file sizes');
reset role;

-- A signed-in non-admin has the same public visibility and cannot mutate content.
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
set local role authenticated;
select is((select count(*)::int from public.resources), 1, 'authenticated non-admin sees only published resources');
select is((select count(*)::int from public.resource_assets), 1, 'authenticated non-admin sees only public resource-asset links');
select is((select count(*)::int from public.admin_users), 0, 'non-admin cannot enumerate administrators');
select throws_ok(
  $$insert into public.resources (resource_type, title) values ('audio', 'RLS unauthorized fixture')$$,
  '42501', 'new row violates row-level security policy for table "resources"',
  'authenticated non-admin cannot insert resources'
);
select throws_ok(
  $$insert into public.events (title, starts_at) values ('RLS unauthorized event', now())$$,
  '42501', 'new row violates row-level security policy for table "events"',
  'authenticated non-admin cannot insert events'
);
reset role;

-- The allow-listed admin sees the admin marker and can perform granted writes.
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
set local role authenticated;
select is((select count(*)::int from public.admin_users), 1, 'admin can read their own allow-list row');
insert into public.resources (resource_type, title) values ('audio', 'RLS authorized fixture');
select is((select count(*)::int from public.resources where title = 'RLS authorized fixture'), 1, 'admin can insert resources');
insert into public.events (title, starts_at) values ('RLS authorized event', now());
select is((select count(*)::int from public.events where title = 'RLS authorized event'), 1, 'admin can insert events');
insert into public.ministries (name) values ('RLS authorized ministry');
select is((select count(*)::int from public.ministries where name = 'RLS authorized ministry'), 1, 'admin can insert ministries');
insert into public.assets (id, media_type, storage_bucket, object_path) values
  ('30000000-0000-0000-0000-000000000004', 'audio', 'private-files', 'admin/authorized.mp3');
select is((select count(*)::int from public.assets where id = '30000000-0000-0000-0000-000000000004'), 1, 'admin can insert asset metadata');
reset role;
select ok(not has_table_privilege('authenticated', 'public.admin_users', 'insert'), 'authenticated users cannot grant administrator access through the API');

-- Verify all application tables retain RLS, including the lookup and detail tables.
select ok((select bool_and(c.relrowsecurity)
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = any (array[
      'resource_types', 'admin_users', 'assets', 'resources', 'resource_assets',
      'sermon_details', 'audio_details', 'video_details', 'book_details',
      'document_details', 'events', 'ministries'
    ])), 'RLS is enabled on all 12 content tables');

select * from finish();
rollback;
