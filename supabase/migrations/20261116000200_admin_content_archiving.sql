

begin;

create table public.content_archive_items (
  content_type text not null check (content_type in (
    'resource',
    'event',
    'gallery_album',
    'gallery_photo',
    'ministry',
    'department',
    'department_member'
  )),
  content_id uuid not null,
  title_snapshot text not null,
  content_snapshot jsonb not null,
  previous_publication_status text,
  previous_published_at timestamptz,
  archived_by uuid,
  archived_at timestamptz not null default now(),
  primary key (content_type, content_id)
);

create index content_archive_items_archived_at_idx
  on public.content_archive_items (archived_at desc);

create table public.content_archive_history (
  id bigint generated always as identity primary key,
  content_type text not null check (content_type in (
    'resource',
    'event',
    'gallery_album',
    'gallery_photo',
    'ministry',
    'department',
    'department_member'
  )),
  content_id uuid not null,
  title_snapshot text not null,
  action text not null check (action in (
    'archived',
    'restored',
    'permanently_deleted'
  )),
  administrator_id uuid,
  administrator_identity text not null,
  content_snapshot jsonb not null,
  occurred_at timestamptz not null default now()
);

create index content_archive_history_content_idx
  on public.content_archive_history (content_type, content_id, occurred_at desc);
create index content_archive_history_occurred_at_idx
  on public.content_archive_history (occurred_at desc);

create table public.content_storage_cleanup_jobs (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  content_id uuid not null,
  content_title text not null,
  asset_id uuid not null,
  bucket_id text not null,
  object_path text not null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index content_storage_cleanup_pending_idx
  on public.content_storage_cleanup_jobs (created_at)
  where completed_at is null;
create index content_storage_cleanup_object_pending_idx
  on public.content_storage_cleanup_jobs (bucket_id, object_path)
  where completed_at is null;

alter table public.content_archive_items enable row level security;
alter table public.content_archive_history enable row level security;
alter table public.content_storage_cleanup_jobs enable row level security;

create or replace function public.prevent_asset_reuse_during_cleanup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lock_key text;
begin
  -- Serialize inserts and storage-location changes against archive cleanup.
  -- UPDATE already holds the asset row lock before this BEFORE trigger runs;
  -- delete_archived_content() follows the same row-then-advisory-lock order.
  if tg_op = 'UPDATE' then
    for v_lock_key in
      select distinct location_key
      from unnest(array[
        case when old.storage_bucket is not null and old.object_path is not null
          then old.storage_bucket || ':' || old.object_path end,
        case when new.storage_bucket is not null and new.object_path is not null
          then new.storage_bucket || ':' || new.object_path end
      ]) as locations(location_key)
      where location_key is not null
      order by location_key
    loop
      perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(v_lock_key, 0)
      );
    end loop;
  elsif new.storage_bucket is not null and new.object_path is not null then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        new.storage_bucket || ':' || new.object_path,
        0
      )
    );
  end if;

  if new.storage_bucket is not null and new.object_path is not null
    and exists (
      select 1
      from public.content_storage_cleanup_jobs j
      where j.bucket_id = new.storage_bucket
        and j.object_path = new.object_path
        and j.completed_at is null
    )
  then
    raise exception 'CONTENT_STORAGE_CLEANUP_PENDING'
      using errcode = '23505';
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_asset_reuse_during_cleanup()
  from public, anon, authenticated;

create trigger assets_prevent_reuse_during_cleanup
  before insert or update of storage_bucket, object_path
  on public.assets
  for each row execute function public.prevent_asset_reuse_during_cleanup();

revoke all on public.content_archive_items,
  public.content_archive_history,
  public.content_storage_cleanup_jobs
  from public, anon, authenticated;
grant select on public.content_archive_items,
  public.content_archive_history to authenticated;
grant select (
  id,
  content_type,
  content_id,
  content_title,
  attempt_count,
  last_error,
  created_at,
  completed_at
) on public.content_storage_cleanup_jobs to authenticated;

create or replace function public.is_content_archived(
  p_content_type text,
  p_content_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.content_archive_items ai
    where ai.content_type = p_content_type
      and ai.content_id = p_content_id
  );
$$;

revoke all on function public.is_content_archived(text, uuid)
  from public, anon, authenticated;
grant execute on function public.is_content_archived(text, uuid)
  to anon, authenticated;

create or replace function public.is_active_primary_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = (select auth.uid())
      and au.role = 'primary'
      and au.is_active
  );
$$;

revoke all on function public.is_active_primary_admin()
  from public, anon, authenticated;
grant execute on function public.is_active_primary_admin()
  to authenticated;

create policy content_archive_items_admin_read
  on public.content_archive_items
  for select to authenticated
  using ((select public.is_admin()));

create policy content_archive_history_admin_read
  on public.content_archive_history
  for select to authenticated
  using ((select public.is_admin()));

create policy content_storage_cleanup_primary_read
  on public.content_storage_cleanup_jobs
  for select to authenticated
  using ((select public.is_active_primary_admin()));

create or replace function public.write_content_archive_history(
  p_content_type text,
  p_content_id uuid,
  p_title text,
  p_action text,
  p_snapshot jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_administrator_id uuid := (select auth.uid());
  v_administrator_identity text;
begin
  if v_administrator_id is null or not public.is_admin() then
    raise exception 'CONTENT_ARCHIVE_UNAUTHORIZED'
      using errcode = '42501';
  end if;

  select coalesce(u.email::text, 'Administrator ' || v_administrator_id::text)
    into v_administrator_identity
    from auth.users u
    where u.id = v_administrator_id;
  v_administrator_identity :=
    coalesce(v_administrator_identity, 'Administrator ' || v_administrator_id::text);

  insert into public.content_archive_history (
    content_type,
    content_id,
    title_snapshot,
    action,
    administrator_id,
    administrator_identity,
    content_snapshot
  )
  values (
    p_content_type,
    p_content_id,
    p_title,
    p_action,
    v_administrator_id,
    v_administrator_identity,
    p_snapshot
  );
end;
$$;

revoke all on function public.write_content_archive_history(
  text, uuid, text, text, jsonb
) from public, anon, authenticated;

create or replace function public.content_archive_status_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb := to_jsonb(old);
  v_new jsonb := to_jsonb(new);
  v_old_status text := v_old ->> 'publication_status';
  v_new_status text := v_new ->> 'publication_status';
  v_previous_status text;
  v_previous_published_at timestamptz;
begin
  if v_old_status = 'archived' then
    if (v_old - array['publication_status', 'published_at', 'updated_at'])
      is distinct from
       (v_new - array['publication_status', 'published_at', 'updated_at'])
    then
      raise exception 'CONTENT_ARCHIVE_RESTORE_REQUIRED'
        using errcode = 'P0001';
    end if;

    if v_new_status <> 'archived' then
      select ai.previous_publication_status, ai.previous_published_at
        into v_previous_status, v_previous_published_at
        from public.content_archive_items ai
        where ai.content_type = case tg_table_name
          when 'resources' then 'resource'
          when 'events' then 'event'
          when 'gallery_albums' then 'gallery_album'
          when 'ministries' then 'ministry'
          when 'departments' then 'department'
          when 'department_members' then 'department_member'
        end
          and ai.content_id = (v_old ->> 'id')::uuid
        for update;

      if not found then
        v_previous_status := 'draft';
        v_previous_published_at := null;
      end if;

      new := jsonb_populate_record(
        new,
        jsonb_build_object(
          'publication_status', coalesce(v_previous_status, 'draft'),
          'published_at', v_previous_published_at
        )
      );
    end if;
  elsif v_new_status = 'archived' then
    if (select auth.uid()) is null or not public.is_admin() then
      raise exception 'CONTENT_ARCHIVE_UNAUTHORIZED'
        using errcode = '42501';
    end if;

    new := jsonb_populate_record(
      new,
      jsonb_build_object('published_at', null)
    );
  end if;

  return new;
end;
$$;

create or replace function public.content_archive_status_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type text := case tg_table_name
    when 'resources' then 'resource'
    when 'events' then 'event'
    when 'gallery_albums' then 'gallery_album'
    when 'ministries' then 'ministry'
    when 'departments' then 'department'
    when 'department_members' then 'department_member'
  end;
  v_id uuid := (to_jsonb(new) ->> 'id')::uuid;
  v_title text := coalesce(
    to_jsonb(new) ->> 'title',
    to_jsonb(new) ->> 'name',
    to_jsonb(new) ->> 'full_name',
    to_jsonb(new) ->> 'slug',
    'Untitled content'
  );
  v_snapshot jsonb := to_jsonb(new);
  v_archive public.content_archive_items%rowtype;
begin
  if old.publication_status <> 'archived'
    and new.publication_status = 'archived'
  then
    v_snapshot := jsonb_set(
      v_snapshot,
      '{publication_status}',
      to_jsonb(old.publication_status),
      true
    );
    if to_jsonb(old) ? 'published_at' then
      v_snapshot := jsonb_set(
        v_snapshot,
        '{published_at}',
        coalesce(to_jsonb(old) -> 'published_at', 'null'::jsonb),
        true
      );
    end if;

    insert into public.content_archive_items (
      content_type,
      content_id,
      title_snapshot,
      content_snapshot,
      previous_publication_status,
      previous_published_at,
      archived_by
    )
    values (
      v_type,
      v_id,
      v_title,
      v_snapshot,
      old.publication_status,
      (to_jsonb(old) ->> 'published_at')::timestamptz,
      (select auth.uid())
    );

    perform public.write_content_archive_history(
      v_type,
      v_id,
      v_title,
      'archived',
      v_snapshot
    );
  elsif old.publication_status = 'archived'
    and new.publication_status <> 'archived'
  then
    select *
      into v_archive
      from public.content_archive_items ai
      where ai.content_type = v_type
        and ai.content_id = v_id
      for update;

    perform public.write_content_archive_history(
      v_type,
      v_id,
      coalesce(v_archive.title_snapshot, v_title),
      'restored',
      coalesce(v_archive.content_snapshot, v_snapshot)
    );

    delete from public.content_archive_items
      where content_type = v_type
        and content_id = v_id;
  end if;

  return new;
end;
$$;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'resources',
    'events',
    'gallery_albums',
    'ministries',
    'departments',
    'department_members'
  ]
  loop
    execute format(
      'create trigger content_archive_status_guard before update on public.%I for each row execute function public.content_archive_status_guard()',
      v_table
    );
    execute format(
      'create trigger content_archive_status_history after update of publication_status on public.%I for each row execute function public.content_archive_status_history()',
      v_table
    );
  end loop;
end;
$$;

-- Existing archived rows predate the actor/timestamp ledger. Preserve them as
-- archived, with a conservative draft restore state and an explicit unknown
-- legacy actor rather than inventing an administrator identity.
insert into public.content_archive_items (
  content_type,
  content_id,
  title_snapshot,
  content_snapshot,
  previous_publication_status,
  previous_published_at,
  archived_by,
  archived_at
)
select
  legacy.content_type,
  legacy.content_id,
  legacy.title_snapshot,
  legacy.content_snapshot,
  'draft',
  null,
  null,
  legacy.archived_at
from (
  select 'resource'::text as content_type, r.id as content_id,
    r.title as title_snapshot, to_jsonb(r) as content_snapshot,
    coalesce(r.updated_at, r.created_at, now()) as archived_at
  from public.resources r where r.publication_status = 'archived'
  union all
  select 'event', e.id, e.title, to_jsonb(e),
    coalesce(e.updated_at, e.created_at, now())
  from public.events e where e.publication_status = 'archived'
  union all
  select 'gallery_album', a.id, a.title, to_jsonb(a),
    coalesce(a.updated_at, a.created_at, now())
  from public.gallery_albums a where a.publication_status = 'archived'
  union all
  select 'ministry', m.id, m.name, to_jsonb(m),
    coalesce(m.updated_at, m.created_at, now())
  from public.ministries m where m.publication_status = 'archived'
  union all
  select 'department', d.id, d.name, to_jsonb(d),
    coalesce(d.updated_at, d.created_at, now())
  from public.departments d where d.publication_status = 'archived'
  union all
  select 'department_member', dm.id, dm.full_name, to_jsonb(dm),
    coalesce(dm.updated_at, dm.created_at, now())
  from public.department_members dm where dm.publication_status = 'archived'
) legacy;

insert into public.content_archive_history (
  content_type,
  content_id,
  title_snapshot,
  action,
  administrator_id,
  administrator_identity,
  content_snapshot,
  occurred_at
)
select
  ai.content_type,
  ai.content_id,
  ai.title_snapshot,
  'archived',
  null,
  'Unknown (legacy archive)',
  ai.content_snapshot,
  ai.archived_at
from public.content_archive_items ai
where ai.archived_by is null;

create or replace function public.archive_content(
  p_content_type text,
  p_content_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_table text;
  v_photo public.gallery_photos%rowtype;
  v_album_title text;
  v_photo_title text;
  v_snapshot jsonb;
  v_row_count integer;
begin
  if (select auth.uid()) is null or not public.is_admin() then
    raise exception 'CONTENT_ARCHIVE_UNAUTHORIZED'
      using errcode = '42501';
  end if;
  if p_content_id is null then
    raise exception 'CONTENT_ARCHIVE_INVALID_ID'
      using errcode = '22023';
  end if;

  if p_content_type = 'gallery_photo' then
    select gp.*
      into v_photo
      from public.gallery_photos gp
      where gp.id = p_content_id
      for update;

    if not found then
      raise exception 'CONTENT_ARCHIVE_NOT_FOUND'
        using errcode = 'P0001';
    end if;

    select coalesce(a.title, 'Unknown album')
      into v_album_title
      from public.gallery_albums a
      where a.id = v_photo.album_id;
    v_album_title := coalesce(v_album_title, 'Unknown album');

    select coalesce(
      v_photo.caption,
      v_photo.alt_text,
      a.original_filename,
      'Photo in ' || v_album_title
    )
      into v_photo_title
      from public.assets a
      where a.id = v_photo.asset_id;
    v_photo_title := coalesce(
      v_photo_title,
      v_photo.caption,
      v_photo.alt_text,
      'Photo in ' || v_album_title
    );
    v_snapshot := to_jsonb(v_photo) || jsonb_build_object(
      'album_title', v_album_title
    );

    insert into public.content_archive_items (
      content_type,
      content_id,
      title_snapshot,
      content_snapshot,
      archived_by
    )
    values (
      'gallery_photo',
      p_content_id,
      v_photo_title,
      v_snapshot,
      (select auth.uid())
    );

    perform public.write_content_archive_history(
      'gallery_photo',
      p_content_id,
      v_photo_title,
      'archived',
      v_snapshot
    );
    return;
  end if;

  v_table := case p_content_type
    when 'resource' then 'resources'
    when 'event' then 'events'
    when 'gallery_album' then 'gallery_albums'
    when 'ministry' then 'ministries'
    when 'department' then 'departments'
    when 'department_member' then 'department_members'
    else null
  end;
  if v_table is null then
    raise exception 'CONTENT_ARCHIVE_INVALID_TYPE'
      using errcode = '22023';
  end if;

  execute format(
    'update public.%I set publication_status = ''archived'' where id = $1 and publication_status <> ''archived''',
    v_table
  ) using p_content_id;
  get diagnostics v_row_count = row_count;
  if v_row_count <> 1 then
    raise exception 'CONTENT_ARCHIVE_NOT_FOUND_OR_ALREADY_ARCHIVED'
      using errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.restore_content(
  p_content_type text,
  p_content_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_table text;
  v_archive public.content_archive_items%rowtype;
  v_photo public.gallery_photos%rowtype;
  v_album_title text;
  v_title text;
  v_snapshot jsonb;
  v_row_count integer;
begin
  if (select auth.uid()) is null or not public.is_admin() then
    raise exception 'CONTENT_ARCHIVE_UNAUTHORIZED'
      using errcode = '42501';
  end if;
  if p_content_id is null then
    raise exception 'CONTENT_ARCHIVE_INVALID_ID'
      using errcode = '22023';
  end if;

  select *
    into v_archive
    from public.content_archive_items ai
    where ai.content_type = p_content_type
      and ai.content_id = p_content_id
    for update;
  if not found then
    raise exception 'CONTENT_ARCHIVE_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  if p_content_type = 'gallery_photo' then
    select gp.*
      into v_photo
      from public.gallery_photos gp
      where gp.id = p_content_id
      for update;
    if not found then
      raise exception 'CONTENT_ARCHIVE_CONTENT_MISSING'
        using errcode = 'P0001';
    end if;

    select coalesce(a.title, 'Unknown album')
      into v_album_title
      from public.gallery_albums a
      where a.id = v_photo.album_id;
    v_album_title := coalesce(v_album_title, 'Unknown album');

    v_title := coalesce(
      v_archive.title_snapshot,
      v_photo.caption,
      v_photo.alt_text,
      'Photo in ' || v_album_title
    );
    v_snapshot := coalesce(v_archive.content_snapshot, to_jsonb(v_photo));
    perform public.write_content_archive_history(
      'gallery_photo',
      p_content_id,
      v_title,
      'restored',
      v_snapshot
    );
    delete from public.content_archive_items
      where content_type = 'gallery_photo'
        and content_id = p_content_id;
    return;
  end if;

  v_table := case p_content_type
    when 'resource' then 'resources'
    when 'event' then 'events'
    when 'gallery_album' then 'gallery_albums'
    when 'ministry' then 'ministries'
    when 'department' then 'departments'
    when 'department_member' then 'department_members'
    else null
  end;
  if v_table is null then
    raise exception 'CONTENT_ARCHIVE_INVALID_TYPE'
      using errcode = '22023';
  end if;

  execute format(
    'update public.%I set publication_status = ''draft'' where id = $1 and publication_status = ''archived''',
    v_table
  ) using p_content_id;
  get diagnostics v_row_count = row_count;
  if v_row_count <> 1 then
    raise exception 'CONTENT_ARCHIVE_CONTENT_MISSING'
      using errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.delete_archived_content(
  p_content_type text,
  p_content_id uuid
)
returns table (cleanup_job_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_table text;
  v_archive public.content_archive_items%rowtype;
  v_child_archive public.content_archive_items%rowtype;
  v_actor uuid := (select auth.uid());
  v_actor_identity text;
  v_asset_ids uuid[] := array[]::uuid[];
  v_asset_id uuid;
  v_bucket text;
  v_object_path text;
  v_cleanup_id uuid;
  v_locked_id uuid;
  v_content_is_archived boolean;
  v_row_count integer;
begin
  if v_actor is null or not public.is_active_primary_admin() then
    raise exception 'CONTENT_ARCHIVE_NOT_PRIMARY'
      using errcode = '42501';
  end if;
  if p_content_id is null then
    raise exception 'CONTENT_ARCHIVE_INVALID_ID'
      using errcode = '22023';
  end if;

  select *
    into v_archive
    from public.content_archive_items ai
    where ai.content_type = p_content_type
      and ai.content_id = p_content_id
    for update;
  if not found then
    raise exception 'CONTENT_ARCHIVE_REQUIRED'
      using errcode = 'P0001';
  end if;

  v_table := case p_content_type
    when 'resource' then 'resources'
    when 'event' then 'events'
    when 'gallery_album' then 'gallery_albums'
    when 'gallery_photo' then 'gallery_photos'
    when 'ministry' then 'ministries'
    when 'department' then 'departments'
    when 'department_member' then 'department_members'
    else null
  end;
  if v_table is null then
    raise exception 'CONTENT_ARCHIVE_INVALID_TYPE'
      using errcode = '22023';
  end if;

  if p_content_type = 'gallery_photo' then
    execute format(
      'select id from public.%I where id = $1 for update',
      v_table
    ) into v_locked_id using p_content_id;
  else
    execute format(
      'select id, publication_status = ''archived'' from public.%I where id = $1 for update',
      v_table
    ) into v_locked_id, v_content_is_archived using p_content_id;
  end if;
  if v_locked_id is null then
    raise exception 'CONTENT_ARCHIVE_CONTENT_MISSING'
      using errcode = 'P0001';
  end if;
  if p_content_type <> 'gallery_photo'
    and v_content_is_archived is distinct from true
  then
    raise exception 'CONTENT_ARCHIVE_REQUIRED'
      using errcode = 'P0001';
  end if;

  if p_content_type = 'resource' then
    select coalesce(array_agg(distinct ra.asset_id order by ra.asset_id), array[]::uuid[])
      into v_asset_ids
      from public.resource_assets ra
      where ra.resource_id = p_content_id;
  elsif p_content_type = 'event' then
    select coalesce(array_agg(e.poster_asset_id order by e.poster_asset_id), array[]::uuid[])
      into v_asset_ids
      from public.events e
      where e.id = p_content_id and e.poster_asset_id is not null;
  elsif p_content_type = 'ministry' then
    select coalesce(array_agg(m.image_asset_id order by m.image_asset_id), array[]::uuid[])
      into v_asset_ids
      from public.ministries m
      where m.id = p_content_id and m.image_asset_id is not null;
  elsif p_content_type = 'gallery_album' then
    select coalesce(array_agg(distinct refs.asset_id order by refs.asset_id), array[]::uuid[])
      into v_asset_ids
      from (
        select a.cover_asset_id as asset_id
        from public.gallery_albums a
        where a.id = p_content_id and a.cover_asset_id is not null
        union all
        select gp.asset_id
        from public.gallery_photos gp
        where gp.album_id = p_content_id
      ) refs;

    if exists (
      select 1
      from public.gallery_photos gp
      left join public.content_archive_items ai
        on ai.content_type = 'gallery_photo'
       and ai.content_id = gp.id
      where gp.album_id = p_content_id
        and ai.content_id is null
    ) then
      raise exception 'CONTENT_ARCHIVE_CHILDREN_REQUIRED'
        using errcode = 'P0001';
    end if;

    for v_child_archive in
      select ai.*
      from public.gallery_photos gp
      join public.content_archive_items ai
        on ai.content_type = 'gallery_photo'
       and ai.content_id = gp.id
      where gp.album_id = p_content_id
      for update of ai
    loop
      perform public.write_content_archive_history(
        'gallery_photo',
        v_child_archive.content_id,
        v_child_archive.title_snapshot,
        'permanently_deleted',
        v_child_archive.content_snapshot
      );
      delete from public.content_archive_items
        where content_type = 'gallery_photo'
          and content_id = v_child_archive.content_id;
    end loop;
  elsif p_content_type = 'gallery_photo' then
    select coalesce(array_agg(gp.asset_id order by gp.asset_id), array[]::uuid[])
      into v_asset_ids
      from public.gallery_photos gp
      where gp.id = p_content_id;
  elsif p_content_type = 'department_member' then
    select coalesce(array_agg(dm.photo_asset_id order by dm.photo_asset_id), array[]::uuid[])
      into v_asset_ids
      from public.department_members dm
      where dm.id = p_content_id and dm.photo_asset_id is not null;
  elsif p_content_type = 'department' then
    select coalesce(array_agg(distinct refs.asset_id order by refs.asset_id), array[]::uuid[])
      into v_asset_ids
      from (
        select d.cover_asset_id as asset_id
        from public.departments d
        where d.id = p_content_id and d.cover_asset_id is not null
        union all
        select dm.photo_asset_id
        from public.department_members dm
        where dm.department_id = p_content_id
          and dm.photo_asset_id is not null
      ) refs;

    if exists (
      select 1
      from public.department_members dm
      left join public.content_archive_items ai
        on ai.content_type = 'department_member'
       and ai.content_id = dm.id
      where dm.department_id = p_content_id
        and ai.content_id is null
    ) then
      raise exception 'CONTENT_ARCHIVE_CHILDREN_REQUIRED'
        using errcode = 'P0001';
    end if;

    for v_child_archive in
      select ai.*
      from public.department_members dm
      join public.content_archive_items ai
        on ai.content_type = 'department_member'
       and ai.content_id = dm.id
      where dm.department_id = p_content_id
      for update of ai
    loop
      perform public.write_content_archive_history(
        'department_member',
        v_child_archive.content_id,
        v_child_archive.title_snapshot,
        'permanently_deleted',
        v_child_archive.content_snapshot
      );
      delete from public.content_archive_items
        where content_type = 'department_member'
          and content_id = v_child_archive.content_id;
    end loop;
  end if;

  select coalesce(u.email::text, 'Administrator ' || v_actor::text)
    into v_actor_identity
    from auth.users u
    where u.id = v_actor;
  v_actor_identity :=
    coalesce(v_actor_identity, 'Administrator ' || v_actor::text);

  insert into public.content_archive_history (
    content_type,
    content_id,
    title_snapshot,
    action,
    administrator_id,
    administrator_identity,
    content_snapshot
  )
  values (
    p_content_type,
    p_content_id,
    v_archive.title_snapshot,
    'permanently_deleted',
    v_actor,
    v_actor_identity,
    v_archive.content_snapshot
  );

  execute format('delete from public.%I where id = $1', v_table)
    using p_content_id;
  get diagnostics v_row_count = row_count;
  if v_row_count <> 1 then
    raise exception 'CONTENT_ARCHIVE_DELETE_FAILED'
      using errcode = 'P0001';
  end if;

  delete from public.content_archive_items
    where content_type = p_content_type
      and content_id = p_content_id;

  foreach v_asset_id in array coalesce(v_asset_ids, array[]::uuid[])
  loop
    -- Lock the asset row first, then its storage location. Asset UPDATE
    -- triggers use the same order; INSERTs have no pre-existing row to lock.
    select a.storage_bucket, a.object_path
      into v_bucket, v_object_path
      from public.assets a
      where a.id = v_asset_id
      for update;

    if found and v_bucket is not null and v_object_path is not null then
      perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(
          v_bucket || ':' || v_object_path,
          0
        )
      );
    end if;

    if found
      and not exists (
        select 1 from public.resource_assets ra where ra.asset_id = v_asset_id
      )
      and not exists (
        select 1 from public.events e where e.poster_asset_id = v_asset_id
      )
      and not exists (
        select 1 from public.ministries m where m.image_asset_id = v_asset_id
      )
      and not exists (
        select 1 from public.gallery_albums a where a.cover_asset_id = v_asset_id
      )
      and not exists (
        select 1 from public.gallery_photos gp where gp.asset_id = v_asset_id
      )
      and not exists (
        select 1 from public.departments d where d.cover_asset_id = v_asset_id
      )
      and not exists (
        select 1 from public.department_members dm
        where dm.photo_asset_id = v_asset_id
      )
    then
        if v_bucket is not null and v_object_path is not null then
          insert into public.content_storage_cleanup_jobs (
            content_type,
            content_id,
            content_title,
            asset_id,
            bucket_id,
            object_path
          )
          values (
            p_content_type,
            p_content_id,
            v_archive.title_snapshot,
            v_asset_id,
            v_bucket,
            v_object_path
          )
          returning id into v_cleanup_id;
          cleanup_job_id := v_cleanup_id;
          return next;
        end if;

        delete from public.assets where id = v_asset_id;
    end if;
  end loop;
end;
$$;

revoke all on function public.archive_content(text, uuid)
  from public, anon, authenticated;
grant execute on function public.archive_content(text, uuid)
  to authenticated;
revoke all on function public.restore_content(text, uuid)
  from public, anon, authenticated;
grant execute on function public.restore_content(text, uuid)
  to authenticated;
revoke all on function public.delete_archived_content(text, uuid)
  from public, anon, authenticated;
grant execute on function public.delete_archived_content(text, uuid)
  to authenticated;

-- Keep old and pending publication states out of public reads while archived.
drop policy if exists resources_read_published on public.resources;
create policy resources_read_published on public.resources
  for select to anon, authenticated
  using (
    publication_status = 'published'
    and published_at <= now()
    and not public.is_content_archived('resource', id)
  );

drop policy if exists resource_assets_read_public_metadata
  on public.resource_assets;
create policy resource_assets_read_public_metadata on public.resource_assets
  for select to anon, authenticated
  using (
    is_public_metadata
    and exists (
      select 1 from public.resources r
      where r.id = resource_id
        and r.publication_status = 'published'
        and r.published_at <= now()
        and not public.is_content_archived('resource', r.id)
    )
  );

drop policy if exists sermon_details_read_published on public.sermon_details;
create policy sermon_details_read_published on public.sermon_details
  for select to anon, authenticated
  using (exists (
    select 1 from public.resources r where r.id = resource_id
      and r.publication_status = 'published'
      and r.published_at <= now()
      and not public.is_content_archived('resource', r.id)
  ));

drop policy if exists audio_details_read_published on public.audio_details;
create policy audio_details_read_published on public.audio_details
  for select to anon, authenticated
  using (exists (
    select 1 from public.resources r where r.id = resource_id
      and r.publication_status = 'published'
      and r.published_at <= now()
      and not public.is_content_archived('resource', r.id)
  ));

drop policy if exists video_details_read_published on public.video_details;
create policy video_details_read_published on public.video_details
  for select to anon, authenticated
  using (exists (
    select 1 from public.resources r where r.id = resource_id
      and r.publication_status = 'published'
      and r.published_at <= now()
      and not public.is_content_archived('resource', r.id)
  ));

drop policy if exists book_details_read_published on public.book_details;
create policy book_details_read_published on public.book_details
  for select to anon, authenticated
  using (exists (
    select 1 from public.resources r where r.id = resource_id
      and r.publication_status = 'published'
      and r.published_at <= now()
      and not public.is_content_archived('resource', r.id)
  ));

drop policy if exists document_details_read_published
  on public.document_details;
create policy document_details_read_published on public.document_details
  for select to anon, authenticated
  using (exists (
    select 1 from public.resources r where r.id = resource_id
      and r.publication_status = 'published'
      and r.published_at <= now()
      and not public.is_content_archived('resource', r.id)
  ));

drop policy if exists events_read_published on public.events;
create policy events_read_published on public.events
  for select to anon, authenticated
  using (
    publication_status = 'published'
    and published_at <= now()
    and not public.is_content_archived('event', id)
  );

drop policy if exists ministries_read_published on public.ministries;
create policy ministries_read_published on public.ministries
  for select to anon, authenticated
  using (
    publication_status = 'published'
    and published_at <= now()
    and not public.is_content_archived('ministry', id)
  );

drop policy if exists gallery_albums_read_published
  on public.gallery_albums;
create policy gallery_albums_read_published on public.gallery_albums
  for select to anon, authenticated
  using (
    publication_status = 'published'
    and published_at <= now()
    and not public.is_content_archived('gallery_album', id)
  );

drop policy if exists gallery_photos_read_published on public.gallery_photos;
create policy gallery_photos_read_published on public.gallery_photos
  for select to anon, authenticated
  using (
    not public.is_content_archived('gallery_photo', id)
    and exists (
      select 1 from public.gallery_albums a
      where a.id = album_id
        and a.publication_status = 'published'
        and a.published_at <= now()
        and not public.is_content_archived('gallery_album', a.id)
    )
  );

drop policy if exists gallery_photos_admin_all on public.gallery_photos;
create policy gallery_photos_admin_read on public.gallery_photos
  for select to authenticated
  using ((select public.is_admin()));
create policy gallery_photos_admin_insert on public.gallery_photos
  for insert to authenticated
  with check (
    (select public.is_admin())
    and not public.is_content_archived('gallery_album', album_id)
  );
create policy gallery_photos_admin_update on public.gallery_photos
  for update to authenticated
  using (
    (select public.is_admin())
    and not public.is_content_archived('gallery_photo', id)
    and not public.is_content_archived('gallery_album', album_id)
  )
  with check (
    (select public.is_admin())
    and not public.is_content_archived('gallery_photo', id)
    and not public.is_content_archived('gallery_album', album_id)
  );

drop policy if exists assets_read_public_metadata on public.assets;
create policy assets_read_public_metadata on public.assets
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.resource_assets ra
      join public.resources r on r.id = ra.resource_id
      where ra.asset_id = assets.id
        and ra.is_public_metadata
        and r.publication_status = 'published'
        and r.published_at <= now()
        and not public.is_content_archived('resource', r.id)
    )
    or exists (
      select 1 from public.events e
      where e.poster_asset_id = assets.id
        and e.publication_status = 'published'
        and e.published_at <= now()
        and not public.is_content_archived('event', e.id)
    )
    or exists (
      select 1 from public.ministries m
      where m.image_asset_id = assets.id
        and m.publication_status = 'published'
        and m.published_at <= now()
        and not public.is_content_archived('ministry', m.id)
    )
    or exists (
      select 1
      from public.gallery_photos gp
      join public.gallery_albums a on a.id = gp.album_id
      where gp.asset_id = assets.id
        and not public.is_content_archived('gallery_photo', gp.id)
        and a.publication_status = 'published'
        and a.published_at <= now()
        and not public.is_content_archived('gallery_album', a.id)
    )
    or exists (
      select 1 from public.gallery_albums a
      where a.cover_asset_id = assets.id
        and a.publication_status = 'published'
        and a.published_at <= now()
        and not public.is_content_archived('gallery_album', a.id)
    )
    or exists (
      select 1 from public.departments d
      where d.cover_asset_id = assets.id
        and d.publication_status = 'published'
        and d.published_at <= now()
        and not public.is_content_archived('department', d.id)
    )
    or exists (
      select 1
      from public.department_members dm
      join public.departments d on d.id = dm.department_id
      where dm.photo_asset_id = assets.id
        and dm.is_public
        and dm.publication_status = 'published'
        and not public.is_content_archived('department_member', dm.id)
        and d.publication_status = 'published'
        and d.published_at <= now()
        and not public.is_content_archived('department', d.id)
    )
  );

drop policy if exists departments_read_published on public.departments;
create policy departments_read_published on public.departments
  for select to anon, authenticated
  using (
    publication_status = 'published'
    and published_at <= now()
    and not public.is_content_archived('department', id)
  );

drop policy if exists department_members_read_public
  on public.department_members;
create policy department_members_read_public on public.department_members
  for select to anon, authenticated
  using (
    is_public
    and publication_status = 'published'
    and not public.is_content_archived('department_member', id)
    and exists (
      select 1 from public.departments d
      where d.id = department_id
        and d.publication_status = 'published'
        and d.published_at <= now()
        and not public.is_content_archived('department', d.id)
    )
  );

-- Direct table deletion bypasses the archive transaction and media outbox.
-- All permanent deletion goes through delete_archived_content().
revoke delete on public.resources,
  public.events,
  public.ministries,
  public.gallery_albums,
  public.gallery_photos,
  public.departments,
  public.department_members
  from public, anon, authenticated;

drop policy if exists resources_admin_delete on public.resources;
drop policy if exists events_admin_delete on public.events;
drop policy if exists ministries_admin_delete on public.ministries;
drop policy if exists gallery_albums_admin_delete on public.gallery_albums;
drop policy if exists departments_admin_delete on public.departments;
drop policy if exists department_members_admin_delete
  on public.department_members;

drop policy if exists assets_admin_delete on public.assets;
revoke delete on public.assets from public, anon, authenticated;
-- Asset rows are removed only by delete_archived_content(), which creates a
-- durable cleanup job before deleting the catalogue row. The SECURITY DEFINER
-- function performs that deletion as its owner.

commit;
