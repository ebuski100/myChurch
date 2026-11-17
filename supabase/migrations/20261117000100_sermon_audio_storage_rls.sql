-- RLS policies for direct browser uploads to the private sermon-audio bucket.
-- These allow authenticated admin users to insert/select/delete objects in the
-- sermon-audio bucket. Required for TUS resumable uploads from the browser.
-- Apply via `supabase db push` or the Supabase dashboard before deploying
-- the direct-upload client code.

-- Allow authenticated admins to insert objects into the sermon-audio bucket.
create policy "sermon_audio_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'sermon-audio' and
    exists (
      select 1 from public.admin_users
      where user_id = (select auth.uid())
        and is_active = true
    )
  );

-- Allow authenticated admins to select objects in the sermon-audio bucket
-- (needed for verification and HEAD requests during finalization).
create policy "sermon_audio_admin_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'sermon-audio' and
    exists (
      select 1 from public.admin_users
      where user_id = (select auth.uid())
        and is_active = true
    )
  );

-- Allow authenticated admins to delete objects in the sermon-audio bucket
-- (needed for cleanup of failed uploads).
create policy "sermon_audio_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'sermon-audio' and
    exists (
      select 1 from public.admin_users
      where user_id = (select auth.uid())
        and is_active = true
    )
  );
