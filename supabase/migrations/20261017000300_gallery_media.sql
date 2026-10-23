-- VictoryCity photo gallery foundation.
-- Reuses the existing assets catalogue for file metadata; this migration
-- stores album/photo organization and publication state only. Image bytes
-- remain in private object storage; the gallery-photos bucket below is
-- private and no Storage object policy is created, so public viewing must
-- go through server-generated signed URLs for published albums only.

begin;

create table public.gallery_albums (
  id uuid primary key default gen_random_uuid(),
  slug text unique check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(btrim(title)) > 0),
  description text,
  cover_asset_id uuid references public.assets (id) on delete set null,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gallery_albums_published_timestamp check (
    publication_status <> 'published' or published_at is not null
  )
);

create index gallery_albums_publication_idx
  on public.gallery_albums (publication_status, published_at desc);

create table public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.gallery_albums (id) on delete cascade,
  asset_id uuid not null references public.assets (id) on delete restrict,
  caption text,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint gallery_photos_unique_asset_per_album unique (album_id, asset_id)
);

create index gallery_photos_album_idx
  on public.gallery_photos (album_id, sort_order);
create index gallery_photos_asset_idx
  on public.gallery_photos (asset_id);

create trigger gallery_albums_set_updated_at before update on public.gallery_albums
  for each row execute function public.set_updated_at();

-- RLS is enabled before any application grants are issued.
alter table public.gallery_albums enable row level security;
alter table public.gallery_photos enable row level security;

-- Remove inherited API privileges, then grant only the operations needed.
revoke all on public.gallery_albums, public.gallery_photos
  from public, anon, authenticated;

grant select on public.gallery_albums, public.gallery_photos
  to anon, authenticated;

grant insert, update, delete on public.gallery_albums, public.gallery_photos
  to authenticated;

create policy gallery_albums_read_published on public.gallery_albums
  for select to anon, authenticated
  using (publication_status = 'published' and published_at <= now());
create policy gallery_albums_admin_read on public.gallery_albums
  for select to authenticated using ((select public.is_admin()));
create policy gallery_albums_admin_insert on public.gallery_albums
  for insert to authenticated with check ((select public.is_admin()));
create policy gallery_albums_admin_update on public.gallery_albums
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy gallery_albums_admin_delete on public.gallery_albums
  for delete to authenticated using ((select public.is_admin()));

create policy gallery_photos_read_published on public.gallery_photos
  for select to anon, authenticated
  using (exists (
    select 1 from public.gallery_albums a
    where a.id = album_id
      and a.publication_status = 'published'
      and a.published_at <= now()
  ));
create policy gallery_photos_admin_all on public.gallery_photos for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Extend the public asset-metadata policy so published gallery content can
-- be resolved to signed URLs. Column-level grants are unchanged: anon and
-- authenticated readers still see only (id, media_type, alt_text), never
-- storage_bucket, object_path, filenames, or file sizes.
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
    or exists (
      select 1
      from public.gallery_photos gp
      join public.gallery_albums a on a.id = gp.album_id
      where gp.asset_id = assets.id
        and a.publication_status = 'published'
        and a.published_at <= now()
    )
    or exists (
      select 1 from public.gallery_albums a
      where a.cover_asset_id = assets.id
        and a.publication_status = 'published'
        and a.published_at <= now()
    )
  );

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'gallery-photos',
  'gallery-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
);

commit;
