begin;
select no_plan();

select is((select public from storage.buckets where id = 'event-posters'), false, 'event poster bucket is private');

-- These fixed Auth identities and all content fixtures are rolled back below.
insert into auth.users (id) values
  ('11000000-0000-0000-0000-000000000001'),
  ('11000000-0000-0000-0000-000000000002'),
  ('11000000-0000-0000-0000-000000000003');
insert into public.admin_users (user_id)
values ('11000000-0000-0000-0000-000000000002');

-- Exact expected table presence and RLS state. Missing tables fail both checks.
select ok(to_regclass('public.resource_types') is not null, 'resource_types exists');
select ok(to_regclass('public.admin_users') is not null, 'admin_users exists');
select ok(to_regclass('public.assets') is not null, 'assets exists');
select ok(to_regclass('public.resources') is not null, 'resources exists');
select ok(to_regclass('public.resource_assets') is not null, 'resource_assets exists');
select ok(to_regclass('public.sermon_details') is not null, 'sermon_details exists');
select ok(to_regclass('public.audio_details') is not null, 'audio_details exists');
select ok(to_regclass('public.video_details') is not null, 'video_details exists');
select ok(to_regclass('public.book_details') is not null, 'book_details exists');
select ok(to_regclass('public.document_details') is not null, 'document_details exists');
select ok(to_regclass('public.events') is not null, 'events exists');
select ok(to_regclass('public.ministries') is not null, 'ministries exists');

select ok((select relrowsecurity from pg_class where oid = to_regclass('public.resource_types')), 'RLS is enabled on resource_types');
select ok((select relrowsecurity from pg_class where oid = to_regclass('public.admin_users')), 'RLS is enabled on admin_users');
select ok((select relrowsecurity from pg_class where oid = to_regclass('public.assets')), 'RLS is enabled on assets');
select ok((select relrowsecurity from pg_class where oid = to_regclass('public.resources')), 'RLS is enabled on resources');
select ok((select relrowsecurity from pg_class where oid = to_regclass('public.resource_assets')), 'RLS is enabled on resource_assets');
select ok((select relrowsecurity from pg_class where oid = to_regclass('public.sermon_details')), 'RLS is enabled on sermon_details');
select ok((select relrowsecurity from pg_class where oid = to_regclass('public.audio_details')), 'RLS is enabled on audio_details');
select ok((select relrowsecurity from pg_class where oid = to_regclass('public.video_details')), 'RLS is enabled on video_details');
select ok((select relrowsecurity from pg_class where oid = to_regclass('public.book_details')), 'RLS is enabled on book_details');
select ok((select relrowsecurity from pg_class where oid = to_regclass('public.document_details')), 'RLS is enabled on document_details');
select ok((select relrowsecurity from pg_class where oid = to_regclass('public.events')), 'RLS is enabled on events');
select ok((select relrowsecurity from pg_class where oid = to_regclass('public.ministries')), 'RLS is enabled on ministries');

insert into public.resources (id, resource_type, slug, title, publication_status, published_at) values
  ('21000000-0000-0000-0000-000000000001', 'audio', 'expanded-audio-public', 'Audio public', 'published', now() - interval '1 day'),
  ('21000000-0000-0000-0000-000000000002', 'audio', 'expanded-audio-draft', 'Audio draft', 'draft', null),
  ('21000000-0000-0000-0000-000000000003', 'audio', 'expanded-audio-scheduled', 'Audio scheduled', 'scheduled', now() + interval '1 day'),
  ('21000000-0000-0000-0000-000000000004', 'video', 'expanded-video-public', 'Video public', 'published', now() - interval '1 day'),
  ('21000000-0000-0000-0000-000000000005', 'video', 'expanded-video-draft', 'Video draft', 'draft', null),
  ('21000000-0000-0000-0000-000000000006', 'book', 'expanded-book-public', 'Book public', 'published', now() - interval '1 day'),
  ('21000000-0000-0000-0000-000000000007', 'book', 'expanded-book-draft', 'Book draft', 'draft', null),
  ('21000000-0000-0000-0000-000000000008', 'document', 'expanded-document-public', 'Document public', 'published', now() - interval '1 day'),
  ('21000000-0000-0000-0000-000000000009', 'document', 'expanded-document-draft', 'Document draft', 'draft', null),
  ('21000000-0000-0000-0000-000000000010', 'audio', 'expanded-write-audio', 'Write audio parent', 'draft', null),
  ('21000000-0000-0000-0000-000000000011', 'video', 'expanded-write-video', 'Write video parent', 'draft', null),
  ('21000000-0000-0000-0000-000000000012', 'book', 'expanded-write-book', 'Write book parent', 'draft', null),
  ('21000000-0000-0000-0000-000000000013', 'document', 'expanded-write-document', 'Write document parent', 'draft', null),
  ('21000000-0000-0000-0000-000000000014', 'audio', 'expanded-write-audio-public', 'Write audio public parent', 'published', now() - interval '1 day'),
  ('21000000-0000-0000-0000-000000000015', 'video', 'expanded-write-video-public', 'Write video public parent', 'published', now() - interval '1 day'),
  ('21000000-0000-0000-0000-000000000016', 'book', 'expanded-write-book-public', 'Write book public parent', 'published', now() - interval '1 day'),
  ('21000000-0000-0000-0000-000000000017', 'document', 'expanded-write-document-public', 'Write document public parent', 'published', now() - interval '1 day'),
  ('21000000-0000-0000-0000-000000000018', 'audio', 'expanded-audio-archived', 'Audio archived', 'archived', null);

insert into public.audio_details (resource_id, duration_seconds) values
  ('21000000-0000-0000-0000-000000000001', 61),
  ('21000000-0000-0000-0000-000000000002', 62),
  ('21000000-0000-0000-0000-000000000003', 63);
insert into public.video_details (resource_id, provider, duration_seconds) values
  ('21000000-0000-0000-0000-000000000004', 'fixture', 71),
  ('21000000-0000-0000-0000-000000000005', 'fixture', 72);
insert into public.book_details (resource_id, author) values
  ('21000000-0000-0000-0000-000000000006', 'Public author'),
  ('21000000-0000-0000-0000-000000000007', 'Draft author');
insert into public.document_details (resource_id, document_kind) values
  ('21000000-0000-0000-0000-000000000008', 'guide'),
  ('21000000-0000-0000-0000-000000000009', 'guide');
insert into public.sermon_details (resource_id, preacher, series) values
  ('21000000-0000-0000-0000-000000000001', 'Public preacher', 'Public series'),
  ('21000000-0000-0000-0000-000000000002', 'Draft preacher', 'Draft series'),
  ('21000000-0000-0000-0000-000000000004', 'Video preacher', 'Video series');

insert into public.assets
  (id, media_type, alt_text, storage_bucket, object_path, original_filename, mime_type, file_size_bytes, sha256)
values
  ('31000000-0000-0000-0000-000000000001', 'audio', 'Public resource cover', 'private-bucket', 'fixture/private-01', 'private-01.bin', 'audio/mpeg', 101, repeat('a', 64)),
  ('31000000-0000-0000-0000-000000000002', 'audio', 'Private download metadata', 'private-bucket', 'fixture/private-02', 'private-02.bin', 'audio/mpeg', 102, repeat('b', 64)),
  ('31000000-0000-0000-0000-000000000003', 'audio', 'Draft resource cover', 'private-bucket', 'fixture/private-03', 'private-03.bin', 'audio/mpeg', 103, repeat('c', 64)),
  ('31000000-0000-0000-0000-000000000004', 'audio', 'Scheduled resource cover', 'private-bucket', 'fixture/private-04', 'private-04.bin', 'audio/mpeg', 104, repeat('d', 64)),
  ('31000000-0000-0000-0000-000000000005', 'image', 'Published event poster', 'private-bucket', 'fixture/private-05', 'private-05.bin', 'image/png', 105, repeat('e', 64)),
  ('31000000-0000-0000-0000-000000000006', 'image', 'Draft event poster', 'private-bucket', 'fixture/private-06', 'private-06.bin', 'image/png', 106, repeat('f', 64)),
  ('31000000-0000-0000-0000-000000000007', 'image', 'Scheduled event poster', 'private-bucket', 'fixture/private-07', 'private-07.bin', 'image/png', 107, repeat('0', 64)),
  ('31000000-0000-0000-0000-000000000008', 'image', 'Published ministry image', 'private-bucket', 'fixture/private-08', 'private-08.bin', 'image/png', 108, repeat('1', 64)),
  ('31000000-0000-0000-0000-000000000009', 'image', 'Draft ministry image', 'private-bucket', 'fixture/private-09', 'private-09.bin', 'image/png', 109, repeat('2', 64)),
  ('31000000-0000-0000-0000-000000000010', 'image', 'Scheduled ministry image', 'private-bucket', 'fixture/private-10', 'private-10.bin', 'image/png', 110, repeat('3', 64)),
  ('31000000-0000-0000-0000-000000000011', 'audio', 'Unlinked private asset', 'private-bucket', 'fixture/private-11', 'private-11.bin', 'audio/mpeg', 111, repeat('4', 64)),
  ('31000000-0000-0000-0000-000000000012', 'image', 'Staged event poster', 'event-posters', 'pending/11000000-0000-0000-0000-000000000002/31000000-0000-0000-0000-000000000012.png', 'poster.png', 'image/png', 112, repeat('5', 64));

insert into public.resource_assets
  (resource_id, asset_id, purpose, is_public_metadata, download_allowed, sort_order)
values
  ('21000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001', 'cover', true, false, 0),
  ('21000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000002', 'download', false, false, 1),
  ('21000000-0000-0000-0000-000000000002', '31000000-0000-0000-0000-000000000003', 'cover', true, false, 0),
  ('21000000-0000-0000-0000-000000000003', '31000000-0000-0000-0000-000000000004', 'cover', true, false, 0);

insert into public.events (id, slug, title, starts_at, poster_asset_id, publication_status, published_at) values
  ('41000000-0000-0000-0000-000000000001', 'expanded-event-public', 'Event public', now() + interval '2 days', '31000000-0000-0000-0000-000000000005', 'published', now() - interval '1 day'),
  ('41000000-0000-0000-0000-000000000002', 'expanded-event-draft', 'Event draft', now() + interval '3 days', '31000000-0000-0000-0000-000000000006', 'draft', null),
  ('41000000-0000-0000-0000-000000000003', 'expanded-event-scheduled', 'Event scheduled', now() + interval '4 days', '31000000-0000-0000-0000-000000000007', 'published', now() + interval '1 day'),
  ('41000000-0000-0000-0000-000000000004', 'expanded-event-cancelled', 'Event cancelled', now() + interval '5 days', null, 'cancelled', null);
insert into public.ministries (id, slug, name, image_asset_id, publication_status, published_at) values
  ('51000000-0000-0000-0000-000000000001', 'expanded-ministry-public', 'Ministry public', '31000000-0000-0000-0000-000000000008', 'published', now() - interval '1 day'),
  ('51000000-0000-0000-0000-000000000002', 'expanded-ministry-draft', 'Ministry draft', '31000000-0000-0000-0000-000000000009', 'draft', null),
  ('51000000-0000-0000-0000-000000000003', 'expanded-ministry-scheduled', 'Ministry scheduled', '31000000-0000-0000-0000-000000000010', 'published', now() + interval '1 day');

-- Anonymous SQL role: exact public IDs, all detail types, and related assets.
set local role anon;
select is((select array_agg(code order by code) from public.resource_types where code = any (ARRAY['audio','book','document','poster','video']::text[])), ARRAY['audio','book','document','poster','video']::text[], 'anon reads the expected resource type catalogue entries');
select is((select array_agg(id::text order by id::text) from public.resources where id between '21000000-0000-0000-0000-000000000001'::uuid and '21000000-0000-0000-0000-000000000017'::uuid), ARRAY['21000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000004','21000000-0000-0000-0000-000000000006','21000000-0000-0000-0000-000000000008','21000000-0000-0000-0000-000000000014','21000000-0000-0000-0000-000000000015','21000000-0000-0000-0000-000000000016','21000000-0000-0000-0000-000000000017']::text[], 'anon sees only published resource fixtures, excluding draft and scheduled parents');
select is((select count(*)::int from public.resources where id = '21000000-0000-0000-0000-000000000018'), 0, 'anon cannot read archived sermons');
select is((select array_agg(resource_id::text order by resource_id::text) from public.audio_details where resource_id between '21000000-0000-0000-0000-000000000001'::uuid and '21000000-0000-0000-0000-000000000017'::uuid), ARRAY['21000000-0000-0000-0000-000000000001']::text[], 'audio details are visible only through a published parent fixture');
select is((select array_agg(resource_id::text order by resource_id::text) from public.video_details where resource_id between '21000000-0000-0000-0000-000000000001'::uuid and '21000000-0000-0000-0000-000000000017'::uuid), ARRAY['21000000-0000-0000-0000-000000000004']::text[], 'video details are visible only through a published parent fixture');
select is((select array_agg(resource_id::text order by resource_id::text) from public.book_details where resource_id between '21000000-0000-0000-0000-000000000001'::uuid and '21000000-0000-0000-0000-000000000017'::uuid), ARRAY['21000000-0000-0000-0000-000000000006']::text[], 'book details are visible only through a published parent fixture');
select is((select array_agg(resource_id::text order by resource_id::text) from public.document_details where resource_id between '21000000-0000-0000-0000-000000000001'::uuid and '21000000-0000-0000-0000-000000000017'::uuid), ARRAY['21000000-0000-0000-0000-000000000008']::text[], 'document details are visible only through a published parent fixture');
select is((select array_agg(resource_id::text order by resource_id::text) from public.sermon_details where resource_id between '21000000-0000-0000-0000-000000000001'::uuid and '21000000-0000-0000-0000-000000000017'::uuid), ARRAY['21000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000004']::text[], 'sermon details are visible only through published audio or video parent fixtures');
select is((select array_agg(id::text order by id::text) from public.events where id between '41000000-0000-0000-0000-000000000001'::uuid and '41000000-0000-0000-0000-000000000003'::uuid), ARRAY['41000000-0000-0000-0000-000000000001']::text[], 'anon sees only the published event fixtures');
select is((select count(*)::int from public.events where id = '41000000-0000-0000-0000-000000000001' and publication_status = 'published' and published_at <= now()), 1, 'public detail lookup can read a due published event by ID');
select is((select count(*)::int from public.events where id = '41000000-0000-0000-0000-000000000002'), 0, 'public detail lookup cannot read a draft event by ID');
select is((select count(*)::int from public.events where id = '41000000-0000-0000-0000-000000000003' and published_at <= now()), 0, 'public detail lookup cannot read a future-published event by ID');
select is((select count(*)::int from public.events where id = '41000000-0000-0000-0000-000000000004'), 0, 'public detail lookup cannot read a cancelled event by ID');
select is((select count(*)::int from public.events where id = '41000000-0000-0000-0000-000000000099'), 0, 'public detail lookup returns no row for an unknown ID');
select is((select count(*)::int from public.events where id = '41000000-0000-0000-0000-000000000004'), 0, 'anon cannot read cancelled events');
select is((select array_agg(id::text order by id::text) from public.ministries where id between '51000000-0000-0000-0000-000000000001'::uuid and '51000000-0000-0000-0000-000000000003'::uuid), ARRAY['51000000-0000-0000-0000-000000000001']::text[], 'anon sees only the published ministry fixtures');
select is((select array_agg(asset_id::text order by asset_id::text) from public.resource_assets where resource_id between '21000000-0000-0000-0000-000000000001'::uuid and '21000000-0000-0000-0000-000000000017'::uuid), ARRAY['31000000-0000-0000-0000-000000000001']::text[], 'anon sees only the published resource cover link, not download or unpublished fixture links');
select is((select array_agg(id::text order by id::text) from public.assets where id between '31000000-0000-0000-0000-000000000001'::uuid and '31000000-0000-0000-0000-000000000011'::uuid), ARRAY['31000000-0000-0000-0000-000000000001','31000000-0000-0000-0000-000000000005','31000000-0000-0000-0000-000000000008']::text[], 'anon sees assets only through the published resource cover, event poster, and ministry image fixtures');
select is((select count(*)::int from public.assets where id = '31000000-0000-0000-0000-000000000012'), 0, 'anon cannot read an unassociated staged event poster');
select is((select alt_text from public.assets where id = '31000000-0000-0000-0000-000000000001'), 'Public resource cover', 'anon can read intended safe asset metadata');
select throws_ok($$select object_path from public.assets where id = '31000000-0000-0000-0000-000000000001'$$, '42501', 'permission denied for table assets', 'anon cannot select object_path');
select throws_ok($$select original_filename from public.assets where id = '31000000-0000-0000-0000-000000000001'$$, '42501', 'permission denied for table assets', 'anon cannot select original_filename');
select throws_ok($$select storage_bucket from public.assets where id = '31000000-0000-0000-0000-000000000001'$$, '42501', 'permission denied for table assets', 'anon cannot select storage_bucket');
select throws_ok($$select sha256 from public.assets where id = '31000000-0000-0000-0000-000000000001'$$, '42501', 'permission denied for table assets', 'anon cannot select sha256');
select throws_ok($$select mime_type from public.assets where id = '31000000-0000-0000-0000-000000000001'$$, '42501', 'permission denied for table assets', 'anon cannot select mime_type');
select throws_ok($$select file_size_bytes from public.assets where id = '31000000-0000-0000-0000-000000000001'$$, '42501', 'permission denied for table assets', 'anon cannot select file_size_bytes');
reset role;

-- Non-admin identity is explicitly supplied through the same claim auth.uid() reads.
select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000001', true);
set local role authenticated;
select is((select count(*)::int from public.resources where id = '21000000-0000-0000-0000-000000000018'), 0, 'authenticated non-admin cannot read archived sermons');
select is((select array_agg(resource_id::text order by resource_id::text) from public.audio_details where resource_id between '21000000-0000-0000-0000-000000000001'::uuid and '21000000-0000-0000-0000-000000000017'::uuid), ARRAY['21000000-0000-0000-0000-000000000001']::text[], 'authenticated non-admin cannot read draft or scheduled audio detail fixtures');
select is((select array_agg(resource_id::text order by resource_id::text) from public.video_details where resource_id between '21000000-0000-0000-0000-000000000001'::uuid and '21000000-0000-0000-0000-000000000017'::uuid), ARRAY['21000000-0000-0000-0000-000000000004']::text[], 'authenticated non-admin cannot read unpublished video detail fixtures');
select is((select array_agg(resource_id::text order by resource_id::text) from public.book_details where resource_id between '21000000-0000-0000-0000-000000000001'::uuid and '21000000-0000-0000-0000-000000000017'::uuid), ARRAY['21000000-0000-0000-0000-000000000006']::text[], 'authenticated non-admin cannot read unpublished book detail fixtures');
select is((select array_agg(resource_id::text order by resource_id::text) from public.document_details where resource_id between '21000000-0000-0000-0000-000000000001'::uuid and '21000000-0000-0000-0000-000000000017'::uuid), ARRAY['21000000-0000-0000-0000-000000000008']::text[], 'authenticated non-admin cannot read unpublished document detail fixtures');
select is((select array_agg(id::text order by id::text) from public.events where id between '41000000-0000-0000-0000-000000000001'::uuid and '41000000-0000-0000-0000-000000000003'::uuid), ARRAY['41000000-0000-0000-0000-000000000001']::text[], 'authenticated non-admin sees only published event fixtures');
select is((select count(*)::int from public.events where id = '41000000-0000-0000-0000-000000000004'), 0, 'authenticated non-admin cannot read cancelled events');
select is((select array_agg(id::text order by id::text) from public.ministries where id between '51000000-0000-0000-0000-000000000001'::uuid and '51000000-0000-0000-0000-000000000003'::uuid), ARRAY['51000000-0000-0000-0000-000000000001']::text[], 'authenticated non-admin sees only published ministry fixtures');
select is((select array_agg(id::text order by id::text) from public.assets where id between '31000000-0000-0000-0000-000000000001'::uuid and '31000000-0000-0000-0000-000000000011'::uuid), ARRAY['31000000-0000-0000-0000-000000000001','31000000-0000-0000-0000-000000000005','31000000-0000-0000-0000-000000000008']::text[], 'authenticated non-admin cannot see assets attached only to unpublished parent fixtures');
select is((select count(*)::int from public.assets where id = '31000000-0000-0000-0000-000000000012'), 0, 'authenticated non-admin cannot read an unassociated staged event poster');
select is((select alt_text from public.assets where id = '31000000-0000-0000-0000-000000000001'), 'Public resource cover', 'authenticated non-admin can read intended safe asset metadata');
select throws_ok($$select object_path from public.assets where id = '31000000-0000-0000-0000-000000000001'$$, '42501', 'permission denied for table assets', 'authenticated non-admin cannot select object_path');
select throws_ok($$select original_filename from public.assets where id = '31000000-0000-0000-0000-000000000001'$$, '42501', 'permission denied for table assets', 'authenticated non-admin cannot select original_filename');
select throws_ok($$select storage_bucket from public.assets where id = '31000000-0000-0000-0000-000000000001'$$, '42501', 'permission denied for table assets', 'authenticated non-admin cannot select storage_bucket');
select throws_ok($$select sha256 from public.assets where id = '31000000-0000-0000-0000-000000000001'$$, '42501', 'permission denied for table assets', 'authenticated non-admin cannot select sha256');
select throws_ok($$select mime_type from public.assets where id = '31000000-0000-0000-0000-000000000001'$$, '42501', 'permission denied for table assets', 'authenticated non-admin cannot select mime_type');
select throws_ok($$select file_size_bytes from public.assets where id = '31000000-0000-0000-0000-000000000001'$$, '42501', 'permission denied for table assets', 'authenticated non-admin cannot select file_size_bytes');

-- Every non-admin insert is attempted under authenticated role and must fail.
select throws_ok($$insert into public.resources (resource_type, title) values ('audio', 'unauthorized')$$, '42501', 'new row violates row-level security policy for table "resources"', 'non-admin cannot insert resources');
select throws_ok($$insert into public.resource_assets (resource_id, asset_id, purpose) values ('21000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000011', 'unauthorized')$$, '42501', 'new row violates row-level security policy for table "resource_assets"', 'non-admin cannot insert resource asset links');
select throws_ok($$insert into public.sermon_details (resource_id) values ('21000000-0000-0000-0000-000000000014')$$, '42501', 'new row violates row-level security policy for table "sermon_details"', 'non-admin cannot insert sermon details');
select throws_ok($$insert into public.audio_details (resource_id) values ('21000000-0000-0000-0000-000000000014')$$, '42501', 'new row violates row-level security policy for table "audio_details"', 'non-admin cannot insert audio details');
select throws_ok($$insert into public.video_details (resource_id) values ('21000000-0000-0000-0000-000000000015')$$, '42501', 'new row violates row-level security policy for table "video_details"', 'non-admin cannot insert video details');
select throws_ok($$insert into public.book_details (resource_id) values ('21000000-0000-0000-0000-000000000016')$$, '42501', 'new row violates row-level security policy for table "book_details"', 'non-admin cannot insert book details');
select throws_ok($$insert into public.document_details (resource_id) values ('21000000-0000-0000-0000-000000000017')$$, '42501', 'new row violates row-level security policy for table "document_details"', 'non-admin cannot insert document details');
select throws_ok($$insert into public.events (title, starts_at) values ('unauthorized', now())$$, '42501', 'new row violates row-level security policy for table "events"', 'non-admin cannot insert events');
select throws_ok($$insert into public.ministries (name) values ('unauthorized')$$, '42501', 'new row violates row-level security policy for table "ministries"', 'non-admin cannot insert ministries');
select throws_ok($$insert into public.assets (media_type, storage_bucket, object_path) values ('audio', 'private-bucket', 'unauthorized')$$, '42501', 'new row violates row-level security policy for table "assets"', 'non-admin cannot insert asset metadata');

-- UPDATE and DELETE filters must leave every published fixture unchanged.
update public.resources set title = 'unauthorized update' where id = '21000000-0000-0000-0000-000000000001';
delete from public.resources where id = '21000000-0000-0000-0000-000000000001';
select is((select title from public.resources where id = '21000000-0000-0000-0000-000000000001'), 'Audio public', 'non-admin update/delete cannot change or remove a published resource');
update public.resource_assets set is_public_metadata = false where resource_id = '21000000-0000-0000-0000-000000000001' and asset_id = '31000000-0000-0000-0000-000000000001' and purpose = 'cover';
delete from public.resource_assets where resource_id = '21000000-0000-0000-0000-000000000001' and asset_id = '31000000-0000-0000-0000-000000000001' and purpose = 'cover';
select is((select is_public_metadata from public.resource_assets where resource_id = '21000000-0000-0000-0000-000000000001' and asset_id = '31000000-0000-0000-0000-000000000001' and purpose = 'cover'), true, 'non-admin update/delete cannot alter or remove a resource asset link');
update public.sermon_details set preacher = 'unauthorized' where resource_id = '21000000-0000-0000-0000-000000000001';
delete from public.sermon_details where resource_id = '21000000-0000-0000-0000-000000000001';
select is((select preacher from public.sermon_details where resource_id = '21000000-0000-0000-0000-000000000001'), 'Public preacher', 'non-admin update/delete cannot change or remove sermon details');
update public.audio_details set duration_seconds = 999 where resource_id = '21000000-0000-0000-0000-000000000001';
delete from public.audio_details where resource_id = '21000000-0000-0000-0000-000000000001';
select is((select duration_seconds from public.audio_details where resource_id = '21000000-0000-0000-0000-000000000001'), 61, 'non-admin update/delete cannot change or remove audio details');
update public.video_details set provider = 'unauthorized' where resource_id = '21000000-0000-0000-0000-000000000004';
delete from public.video_details where resource_id = '21000000-0000-0000-0000-000000000004';
select is((select provider from public.video_details where resource_id = '21000000-0000-0000-0000-000000000004'), 'fixture', 'non-admin update/delete cannot change or remove video details');
update public.book_details set author = 'unauthorized' where resource_id = '21000000-0000-0000-0000-000000000006';
delete from public.book_details where resource_id = '21000000-0000-0000-0000-000000000006';
select is((select author from public.book_details where resource_id = '21000000-0000-0000-0000-000000000006'), 'Public author', 'non-admin update/delete cannot change or remove book details');
update public.document_details set document_kind = 'unauthorized' where resource_id = '21000000-0000-0000-0000-000000000008';
delete from public.document_details where resource_id = '21000000-0000-0000-0000-000000000008';
select is((select document_kind from public.document_details where resource_id = '21000000-0000-0000-0000-000000000008'), 'guide', 'non-admin update/delete cannot change or remove document details');
update public.events set title = 'unauthorized' where id = '41000000-0000-0000-0000-000000000001';
delete from public.events where id = '41000000-0000-0000-0000-000000000001';
select is((select title from public.events where id = '41000000-0000-0000-0000-000000000001'), 'Event public', 'non-admin update/delete cannot change or remove a published event');
update public.ministries set name = 'unauthorized' where id = '51000000-0000-0000-0000-000000000001';
delete from public.ministries where id = '51000000-0000-0000-0000-000000000001';
select is((select name from public.ministries where id = '51000000-0000-0000-0000-000000000001'), 'Ministry public', 'non-admin update/delete cannot change or remove a published ministry');
update public.assets set alt_text = 'unauthorized' where id = '31000000-0000-0000-0000-000000000001';
delete from public.assets where id = '31000000-0000-0000-0000-000000000001';
select is((select alt_text from public.assets where id = '31000000-0000-0000-0000-000000000001'), 'Public resource cover', 'non-admin update/delete cannot change or remove public asset metadata');

-- admin_users has no client write grants: attempt all operations as a non-admin.
select throws_ok($$insert into public.admin_users (user_id) values ('11000000-0000-0000-0000-000000000001')$$, '42501', 'permission denied for table admin_users', 'non-admin cannot insert self into admin_users');
select throws_ok($$update public.admin_users set user_id = '11000000-0000-0000-0000-000000000003' where user_id = '11000000-0000-0000-0000-000000000002'$$, '42501', 'permission denied for table admin_users', 'non-admin cannot update admin membership');
select throws_ok($$delete from public.admin_users where user_id = '11000000-0000-0000-0000-000000000002'$$, '42501', 'permission denied for table admin_users', 'non-admin cannot delete admin membership');
reset role;

-- Administrator's claim is the allow-listed fixture identity, not an Auth account provisioned outside this test.
select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000002', true);
set local role authenticated;
select is((select user_id::text from public.admin_users), '11000000-0000-0000-0000-000000000002', 'admin sees only their own allow-list entry');
select is((select count(*)::int from public.assets where id = '31000000-0000-0000-0000-000000000012'), 1, 'admin can inspect staged event poster metadata');
select is((select publication_status from public.events where id = '41000000-0000-0000-0000-000000000004'), 'cancelled', 'admin can read cancelled events');
select is((select count(*)::int from public.resources where id between '21000000-0000-0000-0000-000000000001'::uuid and '21000000-0000-0000-0000-000000000017'::uuid and publication_status = 'draft'), 8, 'admin can inspect draft resource fixtures');
select is((select count(*)::int from public.resources where id = '21000000-0000-0000-0000-000000000018' and publication_status = 'archived'), 1, 'admin can inspect archived sermons for restoration');

-- Admin INSERT/UPDATE/DELETE success for each content table with write grants.
insert into public.resources (id, resource_type, title) values ('22000000-0000-0000-0000-000000000001', 'audio', 'Admin resource');
select is((select title from public.resources where id = '22000000-0000-0000-0000-000000000001'), 'Admin resource', 'admin can insert resources');
update public.resources set title = 'Admin resource updated' where id = '22000000-0000-0000-0000-000000000001';
select is((select title from public.resources where id = '22000000-0000-0000-0000-000000000001'), 'Admin resource updated', 'admin can update resources');
delete from public.resources where id = '22000000-0000-0000-0000-000000000001';
select ok(not exists (select 1 from public.resources where id = '22000000-0000-0000-0000-000000000001'), 'admin can delete resources');

insert into public.resource_assets (resource_id, asset_id, purpose) values ('21000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000011', 'admin_link');
select is((select purpose from public.resource_assets where resource_id = '21000000-0000-0000-0000-000000000001' and asset_id = '31000000-0000-0000-0000-000000000011'), 'admin_link', 'admin can insert resource asset links');
update public.resource_assets set sort_order = 7 where resource_id = '21000000-0000-0000-0000-000000000001' and asset_id = '31000000-0000-0000-0000-000000000011' and purpose = 'admin_link';
select is((select sort_order from public.resource_assets where resource_id = '21000000-0000-0000-0000-000000000001' and asset_id = '31000000-0000-0000-0000-000000000011' and purpose = 'admin_link'), 7, 'admin can update resource asset links');
delete from public.resource_assets where resource_id = '21000000-0000-0000-0000-000000000001' and asset_id = '31000000-0000-0000-0000-000000000011' and purpose = 'admin_link';
select ok(not exists (select 1 from public.resource_assets where resource_id = '21000000-0000-0000-0000-000000000001' and asset_id = '31000000-0000-0000-0000-000000000011' and purpose = 'admin_link'), 'admin can delete resource asset links');

insert into public.sermon_details (resource_id, preacher) values ('21000000-0000-0000-0000-000000000010', 'Admin preacher');
select is((select preacher from public.sermon_details where resource_id = '21000000-0000-0000-0000-000000000010'), 'Admin preacher', 'admin can insert sermon details');
update public.sermon_details set preacher = 'Admin preacher updated' where resource_id = '21000000-0000-0000-0000-000000000010';
select is((select preacher from public.sermon_details where resource_id = '21000000-0000-0000-0000-000000000010'), 'Admin preacher updated', 'admin can update sermon details');
delete from public.sermon_details where resource_id = '21000000-0000-0000-0000-000000000010';
select ok(not exists (select 1 from public.sermon_details where resource_id = '21000000-0000-0000-0000-000000000010'), 'admin can delete sermon details');

insert into public.audio_details (resource_id, duration_seconds) values ('21000000-0000-0000-0000-000000000010', 81);
select is((select duration_seconds from public.audio_details where resource_id = '21000000-0000-0000-0000-000000000010'), 81, 'admin can insert audio details');
update public.audio_details set duration_seconds = 82 where resource_id = '21000000-0000-0000-0000-000000000010';
select is((select duration_seconds from public.audio_details where resource_id = '21000000-0000-0000-0000-000000000010'), 82, 'admin can update audio details');
delete from public.audio_details where resource_id = '21000000-0000-0000-0000-000000000010';
select ok(not exists (select 1 from public.audio_details where resource_id = '21000000-0000-0000-0000-000000000010'), 'admin can delete audio details');

insert into public.video_details (resource_id, provider) values ('21000000-0000-0000-0000-000000000011', 'Admin provider');
select is((select provider from public.video_details where resource_id = '21000000-0000-0000-0000-000000000011'), 'Admin provider', 'admin can insert video details');
update public.video_details set provider = 'Admin provider updated' where resource_id = '21000000-0000-0000-0000-000000000011';
select is((select provider from public.video_details where resource_id = '21000000-0000-0000-0000-000000000011'), 'Admin provider updated', 'admin can update video details');
delete from public.video_details where resource_id = '21000000-0000-0000-0000-000000000011';
select ok(not exists (select 1 from public.video_details where resource_id = '21000000-0000-0000-0000-000000000011'), 'admin can delete video details');

insert into public.book_details (resource_id, author) values ('21000000-0000-0000-0000-000000000012', 'Admin author');
select is((select author from public.book_details where resource_id = '21000000-0000-0000-0000-000000000012'), 'Admin author', 'admin can insert book details');
update public.book_details set author = 'Admin author updated' where resource_id = '21000000-0000-0000-0000-000000000012';
select is((select author from public.book_details where resource_id = '21000000-0000-0000-0000-000000000012'), 'Admin author updated', 'admin can update book details');
delete from public.book_details where resource_id = '21000000-0000-0000-0000-000000000012';
select ok(not exists (select 1 from public.book_details where resource_id = '21000000-0000-0000-0000-000000000012'), 'admin can delete book details');

insert into public.document_details (resource_id, document_kind) values ('21000000-0000-0000-0000-000000000013', 'guide');
select is((select document_kind from public.document_details where resource_id = '21000000-0000-0000-0000-000000000013'), 'guide', 'admin can insert document details');
update public.document_details set document_kind = 'manual' where resource_id = '21000000-0000-0000-0000-000000000013';
select is((select document_kind from public.document_details where resource_id = '21000000-0000-0000-0000-000000000013'), 'manual', 'admin can update document details');
delete from public.document_details where resource_id = '21000000-0000-0000-0000-000000000013';
select ok(not exists (select 1 from public.document_details where resource_id = '21000000-0000-0000-0000-000000000013'), 'admin can delete document details');

insert into public.events (id, title, starts_at) values ('42000000-0000-0000-0000-000000000001', 'Admin event', now());
select is((select title from public.events where id = '42000000-0000-0000-0000-000000000001'), 'Admin event', 'admin can insert events');
update public.events set title = 'Admin event updated' where id = '42000000-0000-0000-0000-000000000001';
select is((select title from public.events where id = '42000000-0000-0000-0000-000000000001'), 'Admin event updated', 'admin can update events');
delete from public.events where id = '42000000-0000-0000-0000-000000000001';
select ok(not exists (select 1 from public.events where id = '42000000-0000-0000-0000-000000000001'), 'admin can delete events');

insert into public.ministries (id, name) values ('52000000-0000-0000-0000-000000000001', 'Admin ministry');
select is((select name from public.ministries where id = '52000000-0000-0000-0000-000000000001'), 'Admin ministry', 'admin can insert ministries');
update public.ministries set name = 'Admin ministry updated' where id = '52000000-0000-0000-0000-000000000001';
select is((select name from public.ministries where id = '52000000-0000-0000-0000-000000000001'), 'Admin ministry updated', 'admin can update ministries');
delete from public.ministries where id = '52000000-0000-0000-0000-000000000001';
select ok(not exists (select 1 from public.ministries where id = '52000000-0000-0000-0000-000000000001'), 'admin can delete ministries');

insert into public.assets (id, media_type, alt_text, storage_bucket, object_path, sha256) values
  ('32000000-0000-0000-0000-000000000001', 'image', 'Admin asset', 'private-bucket', 'fixture/admin-write', repeat('5', 64));
select is((select alt_text from public.assets where id = '32000000-0000-0000-0000-000000000001'), 'Admin asset', 'admin can insert asset metadata');
update public.assets set alt_text = 'Admin asset updated' where id = '32000000-0000-0000-0000-000000000001';
select is((select alt_text from public.assets where id = '32000000-0000-0000-0000-000000000001'), 'Admin asset updated', 'admin can update asset metadata');
delete from public.assets where id = '32000000-0000-0000-0000-000000000001';
select ok(not exists (select 1 from public.assets where id = '32000000-0000-0000-0000-000000000001'), 'admin can delete asset metadata');

-- Admin cannot use client-side allow-list operations for self or another user.
select throws_ok($$insert into public.admin_users (user_id) values ('11000000-0000-0000-0000-000000000002')$$, '42501', 'permission denied for table admin_users', 'admin cannot insert self into admin_users');
select throws_ok($$insert into public.admin_users (user_id) values ('11000000-0000-0000-0000-000000000003')$$, '42501', 'permission denied for table admin_users', 'admin cannot grant another user admin membership');
select throws_ok($$update public.admin_users set user_id = '11000000-0000-0000-0000-000000000003' where user_id = '11000000-0000-0000-0000-000000000002'$$, '42501', 'permission denied for table admin_users', 'admin cannot update admin membership');
select throws_ok($$delete from public.admin_users where user_id = '11000000-0000-0000-0000-000000000002'$$, '42501', 'permission denied for table admin_users', 'admin cannot delete admin membership');

reset role;
select * from finish();
rollback;
