-- VictoryCity content foundation.
-- Files remain in private object storage; this migration stores metadata only.

create table public.resource_types (
  code text primary key check (code ~ '^[a-z][a-z0-9_]{0,63}$'),
  label text not null check (length(btrim(label)) > 0),
  created_at timestamptz not null default now()
);

insert into public.resource_types (code, label) values
  ('audio', 'Audio'),
  ('video', 'Video'),
  ('book', 'Book or e-book'),
  ('document', 'PDF or document'),
  ('poster', 'Poster or image');

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  media_type text not null check (media_type ~ '^[a-z][a-z0-9_]{0,63}$'),
  alt_text text,
  storage_bucket text,
  object_path text,
  original_filename text,
  mime_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  sha256 text check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assets_storage_location_pair check (
    (storage_bucket is null and object_path is null)
    or (storage_bucket is not null and object_path is not null)
  ),
  constraint assets_storage_location_nonempty check (
    (storage_bucket is null or length(btrim(storage_bucket)) > 0)
    and (object_path is null or length(btrim(object_path)) > 0)
  ),
  constraint assets_mime_type_nonempty check (
    mime_type is null or length(btrim(mime_type)) > 0
  )
);

create unique index assets_storage_object_unique
  on public.assets (storage_bucket, object_path)
  where storage_bucket is not null;

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  resource_type text not null references public.resource_types (code),
  slug text unique check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(btrim(title)) > 0),
  summary text,
  description text,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resources_published_timestamp check (
    publication_status <> 'published' or published_at is not null
  )
);

create index resources_publication_idx
  on public.resources (publication_status, published_at desc);
create index resources_type_publication_idx
  on public.resources (resource_type, publication_status, published_at desc);

create function public.prevent_resource_type_change_with_details()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.resource_type <> old.resource_type and (
    exists (select 1 from public.sermon_details where resource_id = old.id)
    or exists (select 1 from public.audio_details where resource_id = old.id)
    or exists (select 1 from public.video_details where resource_id = old.id)
    or exists (select 1 from public.book_details where resource_id = old.id)
    or exists (select 1 from public.document_details where resource_id = old.id)
  ) then
    raise exception 'Remove type-specific details before changing resource type';
  end if;

  return new;
end;
$$;

create trigger resources_type_change_check
  before update of resource_type on public.resources
  for each row execute function public.prevent_resource_type_change_with_details();

create table public.resource_assets (
  resource_id uuid not null references public.resources (id) on delete cascade,
  asset_id uuid not null references public.assets (id) on delete restrict,
  purpose text not null check (purpose ~ '^[a-z][a-z0-9_]{0,63}$'),
  is_public_metadata boolean not null default false,
  download_allowed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (resource_id, asset_id, purpose)
);

create index resource_assets_asset_idx on public.resource_assets (asset_id);

create table public.sermon_details (
  resource_id uuid primary key references public.resources (id) on delete cascade,
  preacher text,
  sermon_date date,
  series text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sermon_details_date_idx on public.sermon_details (sermon_date desc);
create index sermon_details_preacher_idx on public.sermon_details (preacher);

create table public.audio_details (
  resource_id uuid primary key references public.resources (id) on delete cascade,
  duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.video_details (
  resource_id uuid primary key references public.resources (id) on delete cascade,
  external_url text check (external_url is null or external_url ~ '^https://'),
  provider text,
  duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.book_details (
  resource_id uuid primary key references public.resources (id) on delete cascade,
  author text,
  reading_url text check (reading_url is null or reading_url ~ '^https://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.document_details (
  resource_id uuid primary key references public.resources (id) on delete cascade,
  document_kind text check (
    document_kind is null or document_kind ~ '^[a-z][a-z0-9_]{0,63}$'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.enforce_resource_detail_type()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  actual_type text;
begin
  select resource_type
    into actual_type
    from public.resources
    where id = new.resource_id;

  if not found then
    raise exception 'Resource does not exist';
  end if;

  if (tg_argv[0] = 'sermon' and actual_type not in ('audio', 'video'))
    or (tg_argv[0] <> 'sermon' and actual_type <> tg_argv[0]) then
    raise exception 'Resource detail type does not match resource type';
  end if;

  return new;
end;
$$;

create trigger sermon_details_type_check
  before insert or update of resource_id on public.sermon_details
  for each row execute function public.enforce_resource_detail_type('sermon');
create trigger audio_details_type_check
  before insert or update of resource_id on public.audio_details
  for each row execute function public.enforce_resource_detail_type('audio');
create trigger video_details_type_check
  before insert or update of resource_id on public.video_details
  for each row execute function public.enforce_resource_detail_type('video');
create trigger book_details_type_check
  before insert or update of resource_id on public.book_details
  for each row execute function public.enforce_resource_detail_type('book');
create trigger document_details_type_check
  before insert or update of resource_id on public.document_details
  for each row execute function public.enforce_resource_detail_type('document');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(btrim(title)) > 0),
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text not null default 'Africa/Lagos',
  location text,
  poster_asset_id uuid references public.assets (id) on delete set null,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_valid_time_range check (ends_at is null or ends_at > starts_at),
  constraint events_published_timestamp check (
    publication_status <> 'published' or published_at is not null
  ),
  constraint events_timezone check (timezone = 'Africa/Lagos')
);

create index events_publication_start_idx
  on public.events (publication_status, starts_at);

create table public.ministries (
  id uuid primary key default gen_random_uuid(),
  slug text unique check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(btrim(name)) > 0),
  description text,
  image_asset_id uuid references public.assets (id) on delete set null,
  involvement_label text,
  involvement_url text check (
    involvement_url is null or involvement_url ~ '^https://'
  ),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ministries_published_timestamp check (
    publication_status <> 'published' or published_at is not null
  ),
  constraint ministries_involvement_pair check (
    (involvement_label is null and involvement_url is null)
    or (involvement_label is not null and involvement_url is not null)
  )
);

create index ministries_publication_name_idx
  on public.ministries (publication_status, name);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger assets_set_updated_at before update on public.assets
  for each row execute function public.set_updated_at();
create trigger resources_set_updated_at before update on public.resources
  for each row execute function public.set_updated_at();
create trigger sermon_details_set_updated_at before update on public.sermon_details
  for each row execute function public.set_updated_at();
create trigger audio_details_set_updated_at before update on public.audio_details
  for each row execute function public.set_updated_at();
create trigger video_details_set_updated_at before update on public.video_details
  for each row execute function public.set_updated_at();
create trigger book_details_set_updated_at before update on public.book_details
  for each row execute function public.set_updated_at();
create trigger document_details_set_updated_at before update on public.document_details
  for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger ministries_set_updated_at before update on public.ministries
  for each row execute function public.set_updated_at();

-- RLS is enabled before any application grants are issued.
alter table public.resource_types enable row level security;
alter table public.admin_users enable row level security;
alter table public.assets enable row level security;
alter table public.resources enable row level security;
alter table public.resource_assets enable row level security;
alter table public.sermon_details enable row level security;
alter table public.audio_details enable row level security;
alter table public.video_details enable row level security;
alter table public.book_details enable row level security;
alter table public.document_details enable row level security;
alter table public.events enable row level security;
alter table public.ministries enable row level security;

-- Remove inherited API privileges, then grant only the operations needed.
revoke all on public.resource_types, public.admin_users, public.assets,
  public.resources, public.resource_assets, public.sermon_details,
  public.audio_details, public.video_details, public.book_details,
  public.document_details, public.events, public.ministries
  from public, anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on public.resource_types to anon, authenticated;
grant select on public.resources, public.sermon_details, public.audio_details,
  public.video_details, public.book_details, public.document_details,
  public.events, public.ministries to anon, authenticated;
grant select (resource_id, asset_id, purpose, is_public_metadata, download_allowed, sort_order)
  on public.resource_assets to anon;
grant select on public.resource_assets to authenticated;
grant select (id, media_type, alt_text) on public.assets to anon;
grant select (id, media_type, alt_text) on public.assets to authenticated;
grant select on public.admin_users to authenticated;

grant insert, update, delete on public.resources, public.resource_assets,
  public.sermon_details, public.audio_details, public.video_details,
  public.book_details, public.document_details, public.events, public.ministries,
  public.assets to authenticated;

create policy resource_types_read on public.resource_types
  for select to anon, authenticated using (true);

create policy admin_users_read_self on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));

create policy resources_read_published on public.resources
  for select to anon, authenticated
  using (publication_status = 'published' and published_at <= now());
create policy resources_admin_read on public.resources
  for select to authenticated using ((select public.is_admin()));
create policy resources_admin_insert on public.resources
  for insert to authenticated with check ((select public.is_admin()));
create policy resources_admin_update on public.resources
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy resources_admin_delete on public.resources
  for delete to authenticated using ((select public.is_admin()));

create policy resource_assets_read_public_metadata on public.resource_assets
  for select to anon, authenticated
  using (
    is_public_metadata
    and exists (
      select 1 from public.resources r
      where r.id = resource_id
        and r.publication_status = 'published'
        and r.published_at <= now()
    )
  );
create policy resource_assets_admin_all on public.resource_assets
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

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
    )
    or exists (
      select 1 from public.events e
      where e.poster_asset_id = assets.id
        and e.publication_status = 'published'
        and e.published_at <= now()
    )
    or exists (
      select 1 from public.ministries m
      where m.image_asset_id = assets.id
        and m.publication_status = 'published'
        and m.published_at <= now()
    )
  );
create policy assets_admin_read on public.assets
  for select to authenticated using ((select public.is_admin()));
create policy assets_admin_insert on public.assets
  for insert to authenticated with check ((select public.is_admin()));
create policy assets_admin_update on public.assets
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy assets_admin_delete on public.assets
  for delete to authenticated using ((select public.is_admin()));

create policy sermon_details_read_published on public.sermon_details
  for select to anon, authenticated
  using (exists (
    select 1 from public.resources r where r.id = resource_id
      and r.publication_status = 'published' and r.published_at <= now()
  ));
create policy sermon_details_admin_all on public.sermon_details for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy audio_details_read_published on public.audio_details
  for select to anon, authenticated
  using (exists (
    select 1 from public.resources r where r.id = resource_id
      and r.publication_status = 'published' and r.published_at <= now()
  ));
create policy audio_details_admin_all on public.audio_details for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy video_details_read_published on public.video_details
  for select to anon, authenticated
  using (exists (
    select 1 from public.resources r where r.id = resource_id
      and r.publication_status = 'published' and r.published_at <= now()
  ));
create policy video_details_admin_all on public.video_details for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy book_details_read_published on public.book_details
  for select to anon, authenticated
  using (exists (
    select 1 from public.resources r where r.id = resource_id
      and r.publication_status = 'published' and r.published_at <= now()
  ));
create policy book_details_admin_all on public.book_details for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy document_details_read_published on public.document_details
  for select to anon, authenticated
  using (exists (
    select 1 from public.resources r where r.id = resource_id
      and r.publication_status = 'published' and r.published_at <= now()
  ));
create policy document_details_admin_all on public.document_details for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy events_read_published on public.events
  for select to anon, authenticated
  using (publication_status = 'published' and published_at <= now());
create policy events_admin_read on public.events
  for select to authenticated using ((select public.is_admin()));
create policy events_admin_insert on public.events
  for insert to authenticated with check ((select public.is_admin()));
create policy events_admin_update on public.events
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy events_admin_delete on public.events
  for delete to authenticated using ((select public.is_admin()));

create policy ministries_read_published on public.ministries
  for select to anon, authenticated
  using (publication_status = 'published' and published_at <= now());
create policy ministries_admin_read on public.ministries
  for select to authenticated using ((select public.is_admin()));
create policy ministries_admin_insert on public.ministries
  for insert to authenticated with check ((select public.is_admin()));
create policy ministries_admin_update on public.ministries
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy ministries_admin_delete on public.ministries
  for delete to authenticated using ((select public.is_admin()));
