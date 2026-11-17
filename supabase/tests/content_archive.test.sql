


begin;

select no_plan();

-- Synthetic Auth users for the test.
insert into auth.users (id) values
  ('60000000-0000-0000-0000-000000000001'),
  ('60000000-0000-0000-0000-000000000002');

-- Create only a standard administrator.
-- The existing active primary administrator is reused below.
insert into public.admin_users (user_id, role, is_active)
values
  ('60000000-0000-0000-0000-000000000001', 'standard', true);

-- Resource fixtures.
insert into public.resources
  (id, resource_type, slug, title, publication_status, published_at)
values
  ('61000000-0000-0000-0000-000000000001', 'audio', 'archive-published', 'Published archive fixture', 'published', now() - interval '1 day'),
  ('61000000-0000-0000-0000-000000000002', 'audio', 'archive-draft', 'Draft archive fixture', 'draft', null),
  ('61000000-0000-0000-0000-000000000003', 'audio', 'archive-shared-a', 'Shared asset fixture A', 'draft', null),
  ('61000000-0000-0000-0000-000000000004', 'audio', 'archive-shared-b', 'Shared asset fixture B', 'draft', null),
  ('61000000-0000-0000-0000-000000000005', 'audio', 'archive-primary-restore', 'Primary restore fixture', 'published', now() - interval '2 days'),
  ('61000000-0000-0000-0000-000000000006', 'audio', 'archive-scheduled', 'Scheduled archive fixture', 'scheduled', now() + interval '3 days');

-- Shared media fixture.
insert into public.assets
  (id, media_type, storage_bucket, object_path, original_filename)
values
  ('62000000-0000-0000-0000-000000000001', 'audio', 'sermon-audio', 'archive/shared.mp3', 'shared.mp3');

insert into public.resource_assets
  (resource_id, asset_id, purpose, is_public_metadata, download_allowed)
values
  ('61000000-0000-0000-0000-000000000003', '62000000-0000-0000-0000-000000000001', 'audio_file', false, false),
  ('61000000-0000-0000-0000-000000000004', '62000000-0000-0000-0000-000000000001', 'audio_file', false, false);

-- Gallery fixtures.
insert into public.gallery_albums
  (id, slug, title, publication_status, published_at)
values
  ('63000000-0000-0000-0000-000000000001', 'archive-gallery', 'Archive gallery fixture', 'published', now() - interval '1 day');

insert into public.assets
  (id, media_type, storage_bucket, object_path, original_filename)
values
  ('62000000-0000-0000-0000-000000000002', 'image', 'gallery-photos', 'archive/photo.webp', 'photo.webp');

insert into public.gallery_photos
  (id, album_id, asset_id, caption)
values
  (
    '64000000-0000-0000-0000-000000000001',
    '63000000-0000-0000-0000-000000000001',
    '62000000-0000-0000-0000-000000000002',
    'Archive photo fixture'
  );

-- ============================================================
-- STANDARD ADMINISTRATOR TESTS
-- ============================================================

select set_config(
  'request.jwt.claim.sub',
  '60000000-0000-0000-0000-000000000001',
  true
);

set local role authenticated;

-- Archive published content.
select lives_ok(
  $$select public.archive_content('resource', '61000000-0000-0000-0000-000000000001')$$,
  'standard administrator can archive a published resource'
);

select is(
  (
    select previous_publication_status
    from public.content_archive_items
    where content_type = 'resource'
      and content_id = '61000000-0000-0000-0000-000000000001'
  ),
  'published',
  'archive metadata records the previous published state'
);

select is(
  (
    select publication_status
    from public.resources
    where id = '61000000-0000-0000-0000-000000000001'
  ),
  'archived',
  'archiving changes the resource publication state to archived'
);

select is(
  (
    select count(*)::int
    from public.content_archive_history
    where content_type = 'resource'
      and content_id = '61000000-0000-0000-0000-000000000001'
      and action = 'archived'
  ),
  1,
  'archiving writes an audit entry'
);

reset role;

-- Archived resources must not appear in public queries.
set local role anon;

select is(
  (
    select count(*)::int
    from public.resources
    where id = '61000000-0000-0000-0000-000000000001'
  ),
  0,
  'public resource queries exclude archived content'
);

reset role;

-- Restore published content.
select set_config(
  'request.jwt.claim.sub',
  '60000000-0000-0000-0000-000000000001',
  true
);

set local role authenticated;

select lives_ok(
  $$select public.restore_content('resource', '61000000-0000-0000-0000-000000000001')$$,
  'standard administrator can restore content'
);

select is(
  (
    select publication_status
    from public.resources
    where id = '61000000-0000-0000-0000-000000000001'
  ),
  'published',
  'restore returns published content to its original state'
);

select is(
  (
    select published_at
    from public.resources
    where id = '61000000-0000-0000-0000-000000000001'
  ),
  now() - interval '1 day',
  'restore preserves the original publication timestamp'
);

-- Draft content must remain a draft after restoration.
select lives_ok(
  $$select public.archive_content('resource', '61000000-0000-0000-0000-000000000002')$$,
  'standard administrator can archive a draft'
);

select lives_ok(
  $$select public.restore_content('resource', '61000000-0000-0000-0000-000000000002')$$,
  'standard administrator can restore a draft'
);

select is(
  (
    select publication_status
    from public.resources
    where id = '61000000-0000-0000-0000-000000000002'
  ),
  'draft',
  'restore does not publish an originally unpublished resource'
);

select is(
  (
    select published_at
    from public.resources
    where id = '61000000-0000-0000-0000-000000000002'
  ),
  null,
  'restoring an unpublished resource keeps its publication timestamp empty'
);

-- Scheduled content must retain its future publication date.
select lives_ok(
  $$select public.archive_content('resource', '61000000-0000-0000-0000-000000000006')$$,
  'standard administrator can archive scheduled content'
);

select lives_ok(
  $$select public.restore_content('resource', '61000000-0000-0000-0000-000000000006')$$,
  'standard administrator can restore scheduled content'
);

select is(
  (
    select publication_status
    from public.resources
    where id = '61000000-0000-0000-0000-000000000006'
  ),
  'scheduled',
  'restoring scheduled content does not publish it early'
);

select is(
  (
    select published_at
    from public.resources
    where id = '61000000-0000-0000-0000-000000000006'
  ),
  now() + interval '3 days',
  'restoring scheduled content preserves its future publication time'
);

-- Standard admins may archive and restore, but cannot permanently delete.
select lives_ok(
  $$select public.archive_content('resource', '61000000-0000-0000-0000-000000000001')$$,
  'standard administrator can archive restored content again'
);

select throws_ok(
  $$select * from public.delete_archived_content('resource', '61000000-0000-0000-0000-000000000001')$$,
  '42501',
  'CONTENT_ARCHIVE_NOT_PRIMARY',
  'standard administrator cannot permanently delete archived content through the RPC'
);

select throws_ok(
  $$delete from public.resources where id = '61000000-0000-0000-0000-000000000001'$$,
  '42501',
  'permission denied for table resources',
  'standard administrator cannot bypass archival with a direct table delete'
);

reset role;

-- ============================================================
-- EXISTING PRIMARY ADMINISTRATOR TESTS
-- ============================================================

-- Reuse the active primary administrator already present locally.
-- Do not insert another primary administrator.
select set_config(
  'request.jwt.claim.sub',
  (
    select user_id::text
    from public.admin_users
    where role = 'primary'
      and is_active = true
    limit 1
  ),
  true
);

-- A primary administrator cannot delete content until it is archived.
insert into public.content_archive_items (
  content_type,
  content_id,
  title_snapshot,
  content_snapshot,
  previous_publication_status
)
values (
  'resource',
  '61000000-0000-0000-0000-000000000005',
  'Primary restore fixture',
  '{}'::jsonb,
  'published'
);

set local role authenticated;

select throws_ok(
  $$select * from public.delete_archived_content('resource', '61000000-0000-0000-0000-000000000005')$$,
  'P0001',
  'CONTENT_ARCHIVE_REQUIRED',
  'a stale archive marker cannot authorize deletion of non-archived content'
);

reset role;

-- Remove the deliberately stale archive marker.
delete from public.content_archive_items
where content_type = 'resource'
  and content_id = '61000000-0000-0000-0000-000000000005';

set local role authenticated;

select lives_ok(
  $$select public.archive_content('resource', '61000000-0000-0000-0000-000000000005')$$,
  'primary administrator can archive published content'
);

select lives_ok(
  $$select public.restore_content('resource', '61000000-0000-0000-0000-000000000005')$$,
  'primary administrator can restore archived content'
);

select is(
  (
    select publication_status
    from public.resources
    where id = '61000000-0000-0000-0000-000000000005'
  ),
  'published',
  'primary restoration preserves the original publication state'
);

-- Permanent deletion requires an archive record.
select throws_ok(
  $$select * from public.delete_archived_content('resource', '61000000-0000-0000-0000-000000000003')$$,
  'P0001',
  'CONTENT_ARCHIVE_REQUIRED',
  'permanent deletion requires an archive record'
);

-- Archive and permanently delete the first shared-media consumer.
select lives_ok(
  $$select public.archive_content('resource', '61000000-0000-0000-0000-000000000003')$$,
  'primary administrator can archive a resource'
);

select lives_ok(
  $$select public.delete_archived_content('resource', '61000000-0000-0000-0000-000000000003')$$,
  'primary administrator can permanently delete archived content'
);

select is(
  (
    select count(*)::int
    from public.assets
    where id = '62000000-0000-0000-0000-000000000001'
  ),
  1,
  'shared storage metadata is preserved while another content record references it'
);

-- Archive and delete the final shared-media consumer.
select lives_ok(
  $$select public.archive_content('resource', '61000000-0000-0000-0000-000000000004')$$,
  'primary administrator can archive the final shared-media consumer'
);

select lives_ok(
  $$select * from public.delete_archived_content('resource', '61000000-0000-0000-0000-000000000004')$$,
  'primary administrator can delete the final shared-media consumer'
);

select is(
  (
    select count(*)::int
    from public.assets
    where id = '62000000-0000-0000-0000-000000000001'
  ),
  0,
  'orphaned asset metadata is removed after the final reference is deleted'
);

-- select is(
--   (
--     select count(*)::int
--     from public.content_storage_cleanup_jobs
--     where asset_id = '62000000-0000-0000-0000-000000000001'
--       and bucket_id = 'sermon-audio'
--       and object_path = 'archive/shared.mp3'
--       and completed_at is null
--   ),
--   1,
--   'unshared storage cleanup is queued for retryable server-side removal'
-- );


-- Inspect the internal cleanup queue as the privileged test role.
reset role;

select is(
  (
    select count(*)::int
    from public.content_storage_cleanup_jobs
    where asset_id = '62000000-0000-0000-0000-000000000001'
      and bucket_id = 'sermon-audio'
      and object_path = 'archive/shared.mp3'
      and completed_at is null
  ),
  1,
  'unshared storage cleanup is queued for retryable server-side removal'
);

-- Restore the authenticated primary-admin context for the remaining tests.
set local role authenticated;


select throws_ok(
  $$insert into public.assets (id, media_type, storage_bucket, object_path)
    values ('62000000-0000-0000-0000-000000000003', 'audio', 'sermon-audio', 'archive/shared.mp3')$$,
  '23505',
  'CONTENT_STORAGE_CLEANUP_PENDING',
  'storage paths cannot be reused while cleanup is pending'
);

select is(
  (
    select count(*)::int
    from public.content_archive_history
    where content_type = 'resource'
      and content_id = '61000000-0000-0000-0000-000000000004'
      and title_snapshot = 'Shared asset fixture B'
      and action = 'permanently_deleted'
  ),
  1,
  'permanent deletion history preserves the identifying title after record deletion'
);

-- ============================================================
-- GALLERY ALBUM AND PHOTO TESTS
-- ============================================================

-- Gallery photos must be archived before their parent album is deleted.
select lives_ok(
  $$select public.archive_content('gallery_album', '63000000-0000-0000-0000-000000000001')$$,
  'primary administrator can archive a gallery album'
);

select throws_ok(
  $$select * from public.delete_archived_content('gallery_album', '63000000-0000-0000-0000-000000000001')$$,
  'P0001',
  'CONTENT_ARCHIVE_CHILDREN_REQUIRED',
  'an album cannot be permanently deleted until its photos are archived'
);

select lives_ok(
  $$select public.archive_content('gallery_photo', '64000000-0000-0000-0000-000000000001')$$,
  'primary administrator can archive a gallery photo'
);

select lives_ok(
  $$select * from public.delete_archived_content('gallery_album', '63000000-0000-0000-0000-000000000001')$$,
  'primary administrator can delete an album after all photos are archived'
);

select is(
  (
    select count(*)::int
    from public.content_archive_history
    where content_type = 'gallery_photo'
      and content_id = '64000000-0000-0000-0000-000000000001'
      and action = 'permanently_deleted'
  ),
  1,
  'album deletion records child photo deletion history'
);

reset role;

-- Finish assertions and roll back every fixture and change.
select * from finish();

rollback;
